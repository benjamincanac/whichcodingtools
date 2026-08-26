import { changeTitle } from '#shared/utils/changelog'

/**
 * The changelog as Atom.
 *
 * Pricing in this market moves before the press notices, and this repository is what notices.
 * A feed is the cheapest way for that to reach anyone, and one entry per commit rather than one
 * per changed value is what keeps it worth staying subscribed to.
 */

function escape(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default defineEventHandler(async (event) => {
  // The configured site URL, read without the event: a feed entry's id has to be the canonical
  // origin for the lifetime of the feed, not whichever host answered this request. It is the
  // same value the markdown twins absolutize against.
  const base = useRuntimeConfig().public.agentDiscovery.siteUrl.replace(/\/$/, '')
  const host = new URL(base).host
  const changes = await loadChanges()
  const updated = changes[0]?.date ?? new Date().toISOString()

  const entries = changes.map((entry) => {
    const body = entry.tools
      .map(tool => `<p><a href="${escape(`${base}/tools/${tool.slug}`)}">${escape(tool.name)}</a></p><ul>${tool.lines.map(line => `<li>${escape(line)}</li>`).join('')}</ul>`)
      .join('')
    return `  <entry>
    <id>tag:${escape(host)},2026:changes/${escape(entry.sha)}</id>
    <title>${escape(changeTitle(entry))}</title>
    <updated>${escape(entry.date)}</updated>
    <link rel="alternate" href="${escape(entry.url)}"/>
    <content type="html">${escape(body)}</content>
  </entry>`
  }).join('\n')

  setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${escape(`${base}/changes.xml`)}</id>
  <title>whichcoding.tools changes</title>
  <subtitle>Pricing, plans and status changes across the AI coding tool directory. Semantic changes only, derived from the data.</subtitle>
  <updated>${escape(updated)}</updated>
  <link rel="self" href="${escape(`${base}/changes.xml`)}"/>
  <link rel="alternate" href="${escape(`${base}/changes`)}"/>
${entries}
</feed>
`
})

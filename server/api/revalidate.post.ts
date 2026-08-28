import { API_BASE } from '#shared/api'
import { waitUntil } from '@vercel/functions'
import { LAYER_VALUES, PLAN_VALUES } from '#shared/enums'
import { pairSlug, relatedPairs } from '#shared/utils/compare'

/**
 * GitHub push webhook. Verifies the signature, resolves the new content SHA, then purges the
 * ISR cache for every page the changed files touch by re-requesting them with the bypass token.
 * Content pushes skip redeploys (see vercel.json), so this is how data goes live.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.webhookSecret || process.env.WEBHOOK_SECRET
  const bypassToken = config.bypassToken || process.env.VERCEL_BYPASS_TOKEN
  if (!secret || !bypassToken) {
    throw createError({ statusCode: 500, statusMessage: 'Webhook not configured' })
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  if (!verifyWebhook(secret, raw, getHeader(event, 'x-hub-signature-256'))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const payload = JSON.parse(raw) as PushPayload
  const expectedRef = `refs/heads/${contentBranch()}`
  if (payload.ref !== expectedRef) {
    return { ok: true, skipped: 'other-branch', received: payload.ref }
  }

  const dir = `${contentDir()}/`
  const touched = new Set<string>()
  for (const commit of payload.commits ?? []) {
    for (const file of [...(commit.added ?? []), ...(commit.modified ?? []), ...(commit.removed ?? [])]) {
      if (file.startsWith(dir)) touched.add(file.slice(dir.length).replace(/\.ya?ml$/, ''))
    }
  }
  if (!touched.size) return { ok: true, skipped: 'no-content-changes' }

  // Point every instance at the new commit before any page re-renders.
  const sha = await resolveContentSha(contentBranch(), { refresh: true })
  const content = await getContent()
  const { tools, bySlug } = await loadToolsIndexed()

  // What to purge: the shared surfaces, the touched tools, and every page that lists them.
  const paths = new Set<string>(['/', '/tools', '/compare', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/sitemap.md', `${API_BASE}/tools.json`, `${API_BASE}/compare.json`, '/api/content/list', '/api/__sitemap__/urls'])
  const pairs = relatedPairs(tools)

  // Deleted files: the slug is in `touched` but the corpus no longer has the record, so nothing
  // says which layer listed it, which pairs it was in, or which surviving pages named it. The
  // `wrapped_by` direction is the one that has no trace at all: the deleted file's own `wraps`
  // went with it, so the tools it pointed at cannot be found from what is left. Rather than
  // guess, a removal purges the tool pages wholesale. It happens once in a long while.
  const removed = [...touched].filter(slug => !bySlug.has(slug))
  if (removed.length) {
    for (const layer of LAYER_VALUES) paths.add(`/layers/${layer}`)
    for (const tool of tools) paths.add(`/tools/${tool.slug}`)
    // Against the survivors and against each other: two tools removed in the same push are in
    // neither list, so their shared comparison would otherwise sit cached until it expired.
    const others = [...tools.map(t => t.slug), ...removed]
    for (const slug of removed) {
      for (const other of others) {
        if (other !== slug) paths.add(`/compare/${pairSlug(slug, other)}`)
      }
    }
  }

  for (const slug of touched) {
    paths.add(`/tools/${slug}`)
    paths.add(`${API_BASE}/tools/${slug}.json`)
    paths.add(`/api/content/get/${slug}`)
    const tool = bySlug.get(slug)
    if (!tool) continue
    paths.add(`/layers/${tool.layer}`)
    for (const layer of tool.secondary_layers) paths.add(`/layers/${layer}`)
    // Same definition the sitemap advertises: any other pair renders on demand and expires hourly.
    for (const [a, b] of pairs) {
      if (a === slug || b === slug) paths.add(`/compare/${pairSlug(a, b)}`)
    }
    for (const host of tool.wrapped_by) paths.add(`/tools/${host}`)
    for (const wrap of tool.wraps) if (bySlug.has(wrap.tool)) paths.add(`/tools/${wrap.tool}`)
  }
  for (const plan of PLAN_VALUES) paths.add(`/plans/${plan}`)

  // Every page is served twice now, as HTML and as markdown under /raw. Purging only the page
  // would leave an agent reading an hour-old price while the site shows the new one, which is
  // worse than both being stale. `/` maps to /raw/index.md, the module's generated landing page.
  for (const path of [...paths]) {
    if (path.startsWith('/api') || path.includes('.')) continue
    paths.add(path === '/' ? '/raw/index.md' : `/raw${path}.md`)
  }

  const buildId = config.app.buildId
  // A payload only exists for a rendered Vue page: the data routes, the text documents and the
  // markdown twins have none, and asking for one is a guaranteed 404 per URL.
  const urls = [...paths].flatMap(p => p.startsWith('/api') || p.includes('.') ? [p] : [p, `${p === '/' ? '' : p}/_payload.json?${buildId}`])

  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const headers: Record<string, string> = { 'x-prerender-revalidate': bypassToken }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

  const tag = `[revalidate ${sha.slice(0, 7)}]`
  console.log(`${tag} ${touched.size} tool(s) touched, ${urls.length} url(s) to purge`)

  waitUntil((async () => {
    await content.init({ partial: false }).catch(error => console.error(`${tag} warm failed`, error))
    let ok = 0
    for (let i = 0; i < urls.length; i += 8) {
      const results = await Promise.allSettled(urls.slice(i, i + 8).map(url => $fetch.raw(url, { baseURL, headers })))
      ok += results.filter(r => r.status === 'fulfilled').length
    }
    console.log(`${tag} purged ${ok}/${urls.length}`)
  })())

  return { ok: true, sha, touched: [...touched], urls: urls.length }
})

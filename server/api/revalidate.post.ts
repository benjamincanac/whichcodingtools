import { waitUntil } from '@vercel/functions'
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
  const tools = await loadTools()
  const slugs = new Set(tools.map(t => t.slug))

  // What to purge: the shared surfaces, the touched tools, and every page that lists them.
  const paths = new Set<string>(['/', '/compare', '/llms.txt', '/sitemap.xml', '/api/tools.json', '/api/content/list', '/api/__sitemap__/urls'])
  const pairs = relatedPairs(tools)
  for (const slug of touched) {
    paths.add(`/tools/${slug}`)
    paths.add(`/api/tools/${slug}.json`)
    paths.add(`/api/content/get/${slug}`)
    const tool = tools.find(t => t.slug === slug)
    if (!tool) continue
    paths.add(`/layers/${tool.layer}`)
    for (const layer of tool.secondary_layers) paths.add(`/layers/${layer}`)
    // Same definition the sitemap advertises: any other pair renders on demand and expires hourly.
    for (const [a, b] of pairs) {
      if (a === slug || b === slug) paths.add(`/compare/${pairSlug(a, b)}`)
    }
    for (const host of tool.wrapped_by) paths.add(`/tools/${host}`)
    for (const wrap of tool.wraps) if (slugs.has(wrap.tool)) paths.add(`/tools/${wrap.tool}`)
  }
  for (const plan of ['claude', 'chatgpt', 'copilot', 'cursor', 'gemini', 'grok']) paths.add(`/plans/${plan}`)

  const buildId = config.app.buildId
  const urls = [...paths].flatMap(p => p.startsWith('/api') || p.endsWith('.txt') ? [p] : [p, `${p === '/' ? '' : p}/_payload.json?${buildId}`])

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

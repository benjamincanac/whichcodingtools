export default defineEventHandler(async (event) => {
  // Nitro names the param after the whole segment, `[slug].json` -> `slug.json`.
  const raw = getRouterParams(event)['slug.json'] ?? ''
  const slug = raw.replace(/\.json$/, '')
  const tool = await loadTool(slug)
  if (!tool) {
    throw createError({ statusCode: 404, statusMessage: `No tool with slug "${slug}"` })
  }
  return tool
})

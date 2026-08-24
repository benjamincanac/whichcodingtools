import { getSiteConfig } from '#site-config/server/composables/getSiteConfig'
import { LAYERS, optionLabel } from '#shared/enums'

/** A plain-text index for language models and crawlers: every tool, one line each, with the JSON URL. */
export default defineEventHandler(async (event) => {
  const site = getSiteConfig(event)
  const tools = await loadTools()
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    'Data is one YAML file per tool in git, validated against a schema, every fact with a source URL and a verified date. No affiliate links.',
    '',
    `- API, every tool: ${site.url}/api/tools.json`,
    `- Finder: ${site.url}/`,
    `- Compare: ${site.url}/compare`,
    `- Changelog, every data commit: https://github.com/${githubRepo()}/commits/${contentBranch()}/${contentDir()}`,
    ''
  ]
  for (const layer of LAYERS) {
    const items = tools.filter(t => t.layer === layer.value)
    if (!items.length) continue
    lines.push(`## ${optionLabel(LAYERS, layer.value)}s`, '')
    for (const t of items) {
      lines.push(`- [${t.name}](${site.url}/tools/${t.slug}): ${t.description} JSON: ${site.url}/api/tools/${t.slug}.json`)
    }
    lines.push('')
  }
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return lines.join('\n')
})

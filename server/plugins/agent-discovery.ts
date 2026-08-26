/**
 * The homepage is a Vue page with a search box, so the content source has no `/` document and
 * the agent module generates `/raw/index.md` from its discovery registry instead. Everything
 * structural comes from there; this is the part only the site knows.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('agent-discovery:index', (event, index) => {
    const { name, description } = getSiteConfig(event)
    index.title = name || index.title
    index.description = description

    // Joined with a single newline, so a paragraph needs its own blank line after it.
    index.body.push(
      'An open directory of AI coding tools: editors, terminal agents, orchestrators, cloud agents and the products built on top of them.',
      '',
      'Every fact comes from a vendor page that someone read on the date recorded next to it. One YAML file per tool in git, validated against a schema, with a source URL and a verified date on every claim. No affiliate links, no benchmarks, no LLM-written descriptions.',
      '',
      'Prices are the part that rots fastest, so each tool page carries the date its pricing was last checked. If a figure looks wrong it probably is, and the file it came from is linked at the bottom of the page.'
    )
  })
})

import { GOOD_FOR, HOW_TO_CALL, NOT_FOR, WHEN_TO_USE_LEAD, WHEN_TO_USE_TITLE } from '#shared/content/agents'

/**
 * The two documents an agent reads before deciding to call this site, filled from one place.
 *
 * `llms.txt` is owned by `nuxt-llms` and `/raw/index.md` by `nuxt-agent-discovery`. Both are
 * generated, and neither module can know what this site is *for*, so both get the same
 * `shared/content/agents.ts` copy through their own hook.
 */

/**
 * The when-to-use block without its own top heading, which both hosts supply: `nuxt-llms` emits
 * `## <section title>` itself, and the raw index adds the same. So the one heading in here is the
 * `###` under it.
 */
function whenToUseBody(): string {
  return [
    WHEN_TO_USE_LEAD,
    '',
    ...GOOD_FOR.map(job => `- ${job}`),
    '',
    'Not this site:',
    '',
    ...NOT_FOR.map(job => `- ${job}`),
    '',
    '### How to call it',
    '',
    ...HOW_TO_CALL.map(step => `- ${step}`)
  ].join('\n')
}

export default defineNitroPlugin((nitroApp) => {
  /**
   * The homepage is a Vue page with a search box, so the content source has no `/` document and
   * the agent module generates `/raw/index.md` from its discovery registry instead. Everything
   * structural comes from there; this is the part only the site knows.
   */
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
      'Prices are the part that rots fastest, so each tool page carries the date its pricing was last checked. If a figure looks wrong it probably is, and the file it came from is linked at the bottom of the page.',
      '',
      `## ${WHEN_TO_USE_TITLE}`,
      '',
      whenToUseBody()
    )
  })

  /**
   * `nuxt-llms` renders sections in array order, straight after the blockquote. Unshifted rather
   * than declared in `llms.sections` so it stays first whatever else is added: the agent module's
   * bridge unshifts its own "Documentation Sets" group, and a reader deciding whether to call this
   * site at all should reach that decision before a list of links.
   *
   * A section with a `description` and no `links` renders as a heading and prose, which is what
   * the llms.txt convention wants here.
   */
  nitroApp.hooks.hook('llms:generate', (_event, llms) => {
    llms.sections = llms.sections.filter(section => section.title !== WHEN_TO_USE_TITLE)
    llms.sections.unshift({ title: WHEN_TO_USE_TITLE, description: whenToUseBody() })
  })
})

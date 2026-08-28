import { pairSlug, relatedPairs } from '#shared/utils/compare'

/**
 * The canonical pair list, so a reader can reach any comparison without the 557 of them being
 * enumerated in `llms.txt`.
 *
 * `relatedPairs()` is the same rule the sitemap advertises and the push webhook purges: two
 * tools in the same layer, or one that runs the other. Any other two slugs still render at
 * `/compare/<a>-vs-<b>` on demand, they are only absent from the lists.
 *
 * The two slugs inside a pair are alphabetical. That is the whole reason one comparison has one
 * URL instead of two, so it is stated here rather than left to be inferred from the data.
 */
export default defineEventHandler(async () => {
  const tools = await loadTools()
  const pairs = relatedPairs(tools)
  return {
    count: pairs.length,
    generated_at: new Date().toISOString(),
    ordering: 'The two slugs in a pair are sorted alphabetically, so each comparison has exactly one URL.',
    pattern: '/compare/{a}-vs-{b}',
    markdown_pattern: '/raw/compare/{a}-vs-{b}.md',
    pairs: pairs.map(([a, b]) => ({ a, b, slug: pairSlug(a, b), url: `/compare/${pairSlug(a, b)}` }))
  }
})

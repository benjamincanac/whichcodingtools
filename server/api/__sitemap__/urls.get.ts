import { sitePages } from '#shared/utils/routes'

/**
 * Every page the sitemap cannot discover on its own. ISR renders on demand, so nothing is
 * prerendered and the module would otherwise only see the handful of static routes.
 * The list itself lives in `sitePages()`, shared with the agent content source.
 *
 * `/tools` stays in that list for its markdown twin, `/raw/tools.md`, but the page itself 301s
 * to `/`, which the module lists by itself, so it is the one entry held back here.
 */
export default defineSitemapEventHandler(async () => {
  const { tools, bySlug } = await loadToolsIndexed()
  return sitePages(tools, bySlug)
    .filter(page => page.route !== '/tools')
    .map(page => ({ loc: page.route, lastmod: page.lastmod }))
})

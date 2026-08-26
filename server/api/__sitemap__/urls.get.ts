import { sitePages } from '#shared/utils/routes'

/**
 * Every page the sitemap cannot discover on its own. ISR renders on demand, so nothing is
 * prerendered and the module would otherwise only see the handful of static routes.
 * The list itself lives in `sitePages()`, shared with the agent content source.
 */
export default defineSitemapEventHandler(async () => {
  const { tools, bySlug } = await loadToolsIndexed()
  return sitePages(tools, bySlug).map(page => ({ loc: page.route, lastmod: page.lastmod }))
})

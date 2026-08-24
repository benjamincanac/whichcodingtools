import { LAYERS, PLANS, type Plan } from '#shared/enums'
import { pairSlug, relatedPairs } from '#shared/utils/compare'
import { planAccess } from '#shared/utils/match'

/**
 * Every page the sitemap cannot discover on its own. ISR renders on demand, so nothing is
 * prerendered and the module would otherwise only see the handful of static routes.
 * `lastmod` is the day the data behind the page was last verified, which is the only date
 * this site can honestly claim.
 */
export default defineSitemapEventHandler(async () => {
  const tools = await loadTools()
  const bySlug = new Map(tools.map(t => [t.slug, t]))
  const verified = (...slugs: string[]) => slugs.map(s => bySlug.get(s)?.freshness.verified_at).filter(Boolean).sort().at(-1)
  const newest = verified(...tools.map(t => t.slug))

  const urls = [
    { loc: '/tools', lastmod: newest },
    { loc: '/compare', lastmod: newest },
    ...tools.map(tool => ({ loc: `/tools/${tool.slug}`, lastmod: tool.freshness.verified_at })),
    ...LAYERS.map(layer => ({
      loc: `/layers/${layer.value}`,
      lastmod: verified(...tools.filter(t => t.layer === layer.value || t.secondary_layers.includes(layer.value)).map(t => t.slug))
    })),
    ...PLANS.map(plan => ({
      loc: `/plans/${plan.value}`,
      // Same rule the page itself lists by, so a plan page and its sitemap entry never disagree.
      lastmod: verified(...tools.filter(t => planAccess(t, plan.value as Plan, bySlug)).map(t => t.slug))
    })),
    ...relatedPairs(tools).map(([a, b]) => ({ loc: `/compare/${pairSlug(a, b)}`, lastmod: verified(a, b) }))
  ]

  // A layer or plan with no tools yet has no page worth crawling.
  return urls.filter(url => url.lastmod !== undefined)
})

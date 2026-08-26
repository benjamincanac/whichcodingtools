import { LAYERS, PLANS, type Plan } from '../enums'
import type { ToolRecord } from '../types/tool'
import { pairSlug, relatedPairs } from './compare'
import { planAccess } from './match'

export interface SitePage {
  route: string
  /** The day the data behind the page was last verified, the only date this site can claim. */
  lastmod: string
}

/**
 * Every data-driven page the site serves, with the date behind it.
 *
 * Nothing is prerendered, so no crawler and no content adapter can discover these on their own.
 * One function rather than one list per consumer: `/api/__sitemap__/urls` and the agent content
 * source both read it, so a new page type is registered once instead of once per surface.
 *
 * `/` is not here. It is a static route the sitemap module finds by itself, and the agent module
 * generates its own `/raw/index.md`.
 */
export function sitePages(tools: ToolRecord[], bySlug: Map<string, ToolRecord>): SitePage[] {
  const verified = (...slugs: string[]) => slugs.map(s => bySlug.get(s)?.freshness.verified_at).filter(Boolean).sort().at(-1)
  const newest = verified(...tools.map(t => t.slug))

  const pages = [
    { route: '/tools', lastmod: newest },
    { route: '/compare', lastmod: newest },
    ...tools.map(tool => ({ route: `/tools/${tool.slug}`, lastmod: tool.freshness.verified_at })),
    ...LAYERS.map(layer => ({
      route: `/layers/${layer.value}`,
      lastmod: verified(...tools.filter(t => t.layer === layer.value || t.secondary_layers.includes(layer.value)).map(t => t.slug))
    })),
    ...PLANS.map(plan => ({
      route: `/plans/${plan.value}`,
      // Same rule the page itself lists by, so a plan page and its sitemap entry never disagree.
      lastmod: verified(...tools.filter(t => planAccess(t, plan.value as Plan, bySlug)).map(t => t.slug))
    })),
    ...relatedPairs(tools).map(([a, b]) => ({ route: `/compare/${pairSlug(a, b)}`, lastmod: verified(a, b) }))
  ]

  // A layer or plan with no tools yet has no page worth listing.
  return pages.filter((page): page is SitePage => page.lastmod !== undefined)
}

import type { Pricing, Tier, Tool } from '../schema'
import type { CostDelta, PricingModel } from '../types/tool'

type ToolLike = Pick<Tool, 'slug' | 'pricing' | 'wraps'>

/** Follow `same_as` once so the caller always sees tiers. */
export function resolvePricing<T extends ToolLike>(tool: T, bySlug: Map<string, T>): Pricing & { tiers: Tier[] } {
  const target = tool.pricing.same_as ? bySlug.get(tool.pricing.same_as) : undefined
  const tiers = tool.pricing.tiers ?? target?.pricing.tiers ?? []
  return { ...tool.pricing, bundled_with: tool.pricing.bundled_with ?? target?.pricing.bundled_with, tiers }
}

export function hasFreeTier(tiers: Tier[]) {
  return tiers.some(t => t.price === 0)
}

export function pricingModel(tiers: Tier[]): PricingModel {
  const paid = tiers.filter(t => (t.price ?? 0) > 0 || (t.price_annual ?? 0) > 0 || t.contact_sales)
  const metered = tiers.some(t => t.included || t.overage)
  if (!paid.length && !metered) return 'free'
  if (!paid.length && metered) return 'usage'
  return metered ? 'hybrid' : 'subscription'
}

/** Cheapest flat monthly price an individual can pay, including free. */
export function entryPrice(tiers: Tier[]) {
  const prices = tiers
    .filter(t => t.audience !== 'enterprise' && !t.contact_sales && t.price !== null)
    .map(t => t.price as number)
  return prices.length ? Math.min(...prices) : null
}

export function teamPrice(tiers: Tier[]) {
  const prices = tiers
    .filter(t => t.audience === 'team' && !t.contact_sales && t.price !== null)
    .map(t => t.price as number)
  return prices.length ? Math.min(...prices) : null
}

export function cheapestTier(tiers: Tier[]) {
  return [...tiers]
    .filter(t => t.price !== null)
    .sort((a, b) => (a.price as number) - (b.price as number))[0]
}

/**
 * What `tool` costs on top of a plan the visitor already pays for.
 * `haveSlug` is the wrapped tool (e.g. `claude-code`).
 */
export function costDelta<T extends ToolLike>(tool: T, haveSlug: string, bySlug: Map<string, T>): CostDelta | null {
  const wrap = tool.wraps.find(w => w.tool === haveSlug)
  if (!wrap) return null
  const pricing = resolvePricing(tool, bySlug)
  const tier = wrap.min_tier ? pricing.tiers.find(t => t.id === wrap.min_tier) : cheapestTier(pricing.tiers)
  const price: CostDelta['price'] = tier?.contact_sales ? 'contact' : (tier?.price ?? 'usage')
  return {
    tier: tier?.name,
    price,
    per: tier?.per ?? 'user',
    api_usage: !wrap.uses_subscription,
    via: wrap.via
  }
}

export function formatPrice(price: number | null | undefined, per: 'user' | 'flat' = 'user') {
  if (price === null || price === undefined) return null
  if (price === 0) return 'Free'
  const amount = Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
  return per === 'flat' ? `${amount}/mo` : `${amount}/mo`
}

import type { Pricing, Tier, Tool } from '../schema'
import type { CostDelta, PricingModel, ToolRecord } from '../types/tool'

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

/* ------------------------------ presentation ------------------------------ */

/** `null` stays `null` so a caller can pick its own fallback. */
export function formatMoney(value: number | null, suffix = '/mo') {
  if (value === null) return null
  return value === 0 ? 'Free' : `$${value}${suffix}`
}

/** Priciest flat monthly plan an individual can buy, the top of the personal range. */
export function topIndividualPrice(tiers: Tier[]) {
  const prices = tiers.filter(t => t.audience === 'individual' && t.price !== null).map(t => t.price as number)
  return prices.length ? Math.max(...prices) : null
}

export function priceText(tier: Tier) {
  if (tier.contact_sales) return 'Contact sales'
  if (tier.price === null) return tier.price_annual !== undefined ? `$${tier.price_annual}/mo annual` : 'Usage-based'
  if (tier.price === 0) return 'Free'
  return `${tier.price_from ? 'From ' : ''}$${tier.price}/mo`
}

export function priceDetail(tier: Tier) {
  const parts: string[] = []
  if (tier.price !== null && tier.price > 0 && tier.per === 'user') parts.push('per user')
  if (tier.price !== null && tier.price_annual !== undefined) parts.push(`$${tier.price_annual}/mo billed annually`)
  if (tier.trial_days) parts.push(`${tier.trial_days}-day trial`)
  return parts.join(' · ')
}

export function includedText(tier: Tier) {
  const inc = tier.included
  if (!inc) return null
  const unit = inc.unit === 'usd' ? `$${inc.amount}` : `${inc.amount.toLocaleString('en-US')} ${inc.unit}`
  const period = inc.period === 'month' ? '/mo' : inc.period === 'week' ? '/wk' : ''
  const value = inc.unit !== 'usd' && inc.usd_value !== undefined ? ` (≈ $${inc.usd_value})` : ''
  return `${unit}${period}${value}`
}

/**
 * Overage kinds as a tier row spells them out, and as a compare cell abbreviates them.
 * The two wordings are deliberate: a cell holding several kinds has no room for the long one.
 */
export const OVERAGE_LABELS: Record<string, string> = {
  'api-list': 'API list price',
  'credits': 'Credit packs',
  'fixed': 'Fixed rate',
  'rate-limited': 'Rate limited until reset',
  'blocked': 'Blocked until upgrade'
}

export const OVERAGE_LABELS_SHORT: Record<string, string> = {
  ...OVERAGE_LABELS,
  'rate-limited': 'Rate limited',
  'blocked': 'Blocked'
}

export function overageText(tier: Tier) {
  const o = tier.overage
  if (!o) return null
  let text = OVERAGE_LABELS[o.kind] ?? o.kind
  if (o.markup_pct) text += ` +${o.markup_pct}%`
  if (o.rate !== undefined) text += `, $${o.rate} each`
  return text
}

/** What a tool costs to start with, as the header badge and the spec sheet say it. */
export function entryPriceLabel(tool: Pick<ToolRecord, 'entry_price' | 'pricing_model'>) {
  if (tool.entry_price === null) return tool.pricing_model === 'usage' ? 'Usage-based' : 'Contact sales'
  if (tool.entry_price === 0) return tool.pricing_model === 'free' ? 'Free' : 'Free tier'
  return `From $${tool.entry_price}/mo`
}

/** What running a tool adds to a plan you already pay for. */
export function deltaText(delta: CostDelta | null) {
  if (!delta) return ''
  if (delta.api_usage) return 'Bills model usage separately'
  if (delta.price === 0) return 'Free with your existing login'
  if (delta.price === 'usage') return 'Usage-based'
  if (delta.price === 'contact') return 'Contact sales'
  return `$${delta.price}/mo${delta.tier ? ` on ${delta.tier}` : ''}, with your existing login`
}

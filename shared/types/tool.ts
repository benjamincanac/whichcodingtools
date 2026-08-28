import type { Tier, Tool } from '../schema'

/** Runtime lists, not just types: `/openapi.json` publishes them as enums. */
export const PRICING_MODELS = ['free', 'subscription', 'usage', 'hybrid'] as const
export const FRESHNESS_LEVELS = ['success', 'warning', 'error'] as const

export type PricingModel = typeof PRICING_MODELS[number]
export type FreshnessLevel = typeof FRESHNESS_LEVELS[number]

export interface Freshness {
  /** Date the pricing source was last verified. */
  verified_at: string
  /** Oldest verified_at across every source. */
  oldest: string
  level: FreshnessLevel
  /** When this record was computed (build time for the static API). */
  computed_at: string
}

/** A tool as served by the JSON API: the YAML document plus computed fields. */
export interface ToolRecord extends Tool {
  open_source: boolean
  pricing_model: PricingModel
  has_free_tier: boolean
  /** Cheapest flat monthly price for an individual, null when usage-only or contact sales. */
  entry_price: number | null
  /** Providers after inheriting through `wraps`. */
  effective_providers: string[]
  /** Slugs of tools that wrap this one. */
  wrapped_by: string[]
  freshness: Freshness
}

/**
 * A tier with the prose taken out. Everything the ranking, the compare table and the cost
 * deltas read, and nothing a card never shows: `notes`, `limits`, `mirrors`, the annual and
 * trial figures all belong to the pricing table on a tool page.
 */
export type SummaryTier = Pick<Tier, 'id' | 'name' | 'price' | 'per' | 'audience' | 'contact_sales'> & {
  included?: Omit<NonNullable<Tier['included']>, 'notes'>
  overage?: Pick<NonNullable<Tier['overage']>, 'kind' | 'markup_pct'>
}

/**
 * What a list view needs, which is most of a record minus the long tail nobody reads until
 * they open a tool. The whole corpus is inlined into the payload of every page that ranks,
 * groups or compares, so the fields dropped here are the ones that were being paid for on
 * `/`, `/tools`, `/layers/*`, `/plans/*` and `/compare` without ever being rendered.
 *
 * Dropped: `sources` (freshness is already computed), `install`, `links`, and the `notes`
 * fields on pricing, models, license, wraps and tiers. A tool page fetches the full record
 * from `/api/v1/tools/<slug>.json`, so nothing that needs them goes without.
 */
export interface ToolSummary extends Omit<ToolRecord, 'sources' | 'install' | 'links' | 'license' | 'models' | 'pricing' | 'wraps' | 'aliases' | 'freshness'> {
  license: Pick<Tool['license'], 'spdx' | 'kind'>
  models: Pick<Tool['models'], 'providers' | 'plans' | 'byok' | 'local'>
  pricing: Pick<Tool['pricing'], 'same_as' | 'bundled_with'> & { tiers?: SummaryTier[] }
  wraps: Omit<Tool['wraps'][number], 'notes'>[]
  /** Only the slug: the 301 from a renamed URL is all a list view does with an alias. */
  aliases: Pick<Tool['aliases'][number], 'slug'>[]
  freshness: Pick<Freshness, 'verified_at' | 'level'>
}

export interface CostDelta {
  tier?: string
  price: number | 'usage' | 'contact'
  per: 'user' | 'flat'
  /** True when the wrapper bills model usage separately (no subscription reuse). */
  api_usage: boolean
  via: string
}

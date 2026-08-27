import type { Tool } from '../schema'

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

export interface CostDelta {
  tier?: string
  price: number | 'usage' | 'contact'
  per: 'user' | 'flat'
  /** True when the wrapper bills model usage separately (no subscription reuse). */
  api_usage: boolean
  via: string
}

import type { Feature, Host, Layer, Plan, Platform, Provider } from '../enums'
import { FEATURES, HOSTS, LAYERS, PLANS, PLATFORMS, PROVIDERS, lowerLabel, optionLabel } from '../enums'
import type { CostDelta, ToolSummary } from '../types/tool'
import { costDelta } from './pricing'
import { articleFor } from './text'

export interface Requirements {
  q: string
  where: Layer[]
  hosts: Host[]
  platforms: Platform[]
  plans: Plan[]
  providers: Provider[]
  features: Feature[]
  local: boolean
  byok: boolean
  free: boolean
  oss: boolean
  /** Max entry price in USD per month, null for any. */
  budget: number | null
}

export const EMPTY_REQUIREMENTS: Requirements = {
  q: '',
  where: [],
  hosts: [],
  platforms: [],
  plans: [],
  providers: [],
  features: [],
  local: false,
  byok: false,
  free: false,
  oss: false,
  budget: null
}

export interface MatchResult {
  satisfied: string[]
  missing: string[]
  /** How the tool gets access to a plan the visitor already pays for, when one matched. */
  plan?: { plan: Plan, included: boolean, via?: string, delta: CostDelta | null }
}

export function requirementCount(req: Requirements) {
  return req.where.length + req.hosts.length + req.platforms.length + req.plans.length
    + req.providers.length + req.features.length
    + Number(req.local) + Number(req.byok) + Number(req.free) + Number(req.oss) + Number(req.budget !== null)
}

/** Is `plan` usable inside `tool`, directly or through a wrapped tool that reuses its login? */
export function planAccess(tool: ToolSummary, plan: Plan, bySlug: Map<string, ToolSummary>, seen = new Set<string>()): { included: boolean, via?: string } | null {
  if (tool.pricing.bundled_with === plan) return { included: true }
  if (tool.models.plans.includes(plan)) return { included: false }
  seen.add(tool.slug)
  for (const wrap of tool.wraps) {
    if (!wrap.uses_subscription) continue
    const target = bySlug.get(wrap.tool)
    if (!target || seen.has(target.slug)) continue
    if (planAccess(target, plan, bySlug, seen)) return { included: false, via: wrap.tool }
  }
  return null
}

export function matchTool(tool: ToolSummary, req: Requirements, bySlug: Map<string, ToolSummary>): MatchResult {
  const result: MatchResult = { satisfied: [], missing: [] }
  const check = (ok: boolean, label: string, miss: string) => (ok ? result.satisfied : result.missing).push(ok ? label : miss)

  if (req.where.length) {
    const layers = [tool.layer, ...tool.secondary_layers]
    const ok = req.where.some(l => layers.includes(l))
    check(ok, optionLabel(LAYERS, tool.layer), `Not ${req.where.length > 1 ? 'one of those' : articleFor(optionLabel(LAYERS, req.where[0]!))}`)
  }

  for (const host of req.hosts) {
    check(tool.hosts.includes(host), optionLabel(HOSTS, host), `No ${optionLabel(HOSTS, host)} extension`)
  }

  for (const platform of req.platforms) {
    check(tool.platforms.includes(platform), optionLabel(PLATFORMS, platform), `No ${optionLabel(PLATFORMS, platform)} build`)
  }

  for (const plan of req.plans) {
    const access = planAccess(tool, plan, bySlug)
    const label = optionLabel(PLANS, plan)
    check(Boolean(access), `Uses your ${label} plan`, `Doesn't use your ${label} plan`)
    if (access && !result.plan) {
      result.plan = { plan, included: access.included, via: access.via, delta: access.via ? costDelta(tool, access.via, bySlug) : null }
    }
  }

  for (const provider of req.providers) {
    check(tool.effective_providers.includes(provider), optionLabel(PROVIDERS, provider), `No ${optionLabel(PROVIDERS, provider)} models`)
  }

  if (req.local) check(tool.models.local, 'Local models', 'No local models')
  if (req.byok) check(tool.models.byok !== 'none', 'Bring your own key', 'No BYOK')
  if (req.free) check(tool.has_free_tier, 'Free tier', 'No free tier')
  if (req.oss) check(tool.open_source, 'Open source', 'Not open source')
  if (req.budget !== null) {
    const ok = tool.entry_price !== null && tool.entry_price <= req.budget
    check(ok, `Under $${req.budget}/mo`, tool.entry_price === null ? 'Usage-based or contact sales' : `Starts at $${tool.entry_price}/mo`)
  }

  for (const feature of req.features) {
    check(tool.features.includes(feature), optionLabel(FEATURES, feature), `No ${lowerLabel(optionLabel(FEATURES, feature))}`)
  }

  return result
}

export function deltaPrice(match?: MatchResult): number | null {
  if (!match?.plan) return null
  if (match.plan.included) return 0
  const delta = match.plan.delta
  if (!delta) return 0
  return typeof delta.price === 'number' ? delta.price : null
}

export function deltaLabel(match?: MatchResult): string | null {
  if (!match?.plan) return null
  const planName = optionLabel(PLANS, match.plan.plan)
  if (match.plan.included) return `Included in your ${planName} plan`
  const delta = match.plan.delta
  if (!delta) return `Signs in with your ${planName} plan`
  const base = delta.price === 0
    ? '+$0'
    : delta.price === 'usage'
      ? 'Usage-based'
      : delta.price === 'contact'
        ? 'Contact sales'
        : `+$${delta.price}/mo${delta.tier ? ` (${delta.tier})` : ''}`
  return delta.api_usage ? `${base} + API usage` : `${base}, uses your ${planName} plan`
}

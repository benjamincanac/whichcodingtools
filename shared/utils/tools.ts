import type { Tool } from '../schema'
import type { ToolRecord } from '../types/tool'
import { computeFreshness } from './freshness'
import { entryPrice, hasFreeTier, pricingModel, resolvePricing } from './pricing'

export function isOpenSource(tool: Pick<Tool, 'license'>) {
  return tool.license.kind === 'open-source'
}

export function wrappedBy(slug: string, tools: Pick<Tool, 'slug' | 'wraps'>[]) {
  return tools.filter(t => t.wraps.some(w => w.tool === slug)).map(t => t.slug).sort()
}

/** Providers declared on the tool, or inherited from the tools it wraps. */
export function effectiveProviders<T extends Pick<Tool, 'slug' | 'models' | 'wraps'>>(tool: T, bySlug: Map<string, T>, seen = new Set<string>()): string[] {
  if (tool.models.providers?.length) return tool.models.providers
  seen.add(tool.slug)
  const inherited = new Set<string>()
  for (const wrap of tool.wraps) {
    const target = bySlug.get(wrap.tool)
    if (!target || seen.has(target.slug)) continue
    for (const p of effectiveProviders(target, bySlug, seen)) inherited.add(p)
  }
  return [...inherited].sort()
}

export function findByAlias<T extends Pick<Tool, 'aliases'>>(slug: string, tools: T[]) {
  return tools.find(t => t.aliases.some(a => a.slug === slug))
}

export function toRecords(tools: Tool[], now = new Date()): ToolRecord[] {
  const bySlug = new Map(tools.map(t => [t.slug, t]))
  return tools.map((tool) => {
    const pricing = resolvePricing(tool, bySlug)
    return {
      ...tool,
      open_source: isOpenSource(tool),
      pricing_model: pricingModel(pricing.tiers),
      has_free_tier: hasFreeTier(pricing.tiers),
      entry_price: entryPrice(pricing.tiers),
      effective_providers: effectiveProviders(tool, bySlug),
      wrapped_by: wrappedBy(tool.slug, tools),
      freshness: computeFreshness(tool, now)
    }
  })
}

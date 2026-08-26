import type { EnumOption } from '../enums'
import { FEATURES, HOSTS, LAYERS, PLATFORMS, PROVIDERS, STATUSES, optionLabel } from '../enums'
import type { Tool } from '../schema'
import type { ToolRecord } from '../types/tool'
import { computeFreshness } from './freshness'
import { entryPrice, entryPriceLabel, hasFreeTier, pricingModel, resolvePricing } from './pricing'

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

/* ------------------------------ presentation ------------------------------ */

/**
 * Enum options a tool carries, in declaration order rather than YAML order, so the same
 * tool reads the same way on the page, in the markdown twin and in the OG image.
 */
export function platformOptions(tool: Pick<Tool, 'platforms'>): EnumOption[] {
  return [...PLATFORMS].filter(p => tool.platforms.includes(p.value))
}

export function hostOptions(tool: Pick<Tool, 'hosts'>): EnumOption[] {
  return [...HOSTS].filter(h => tool.hosts.includes(h.value))
}

export function featureOptions(tool: Pick<Tool, 'features'>): EnumOption[] {
  return [...FEATURES].filter(f => tool.features.includes(f.value))
}

export function providerOptions(tool: Pick<ToolRecord, 'effective_providers'>): EnumOption[] {
  return [...PROVIDERS].filter(p => tool.effective_providers.includes(p.value))
}

/** The spec sheet: the handful of facts that answer "what is this" without scrolling. */
export function toolFacts(tool: ToolRecord): { label: string, value: string }[] {
  const hosts = hostOptions(tool)
  return [
    { label: 'Layer', value: [tool.layer, ...tool.secondary_layers].map(l => optionLabel(LAYERS, l)).join(', ') },
    { label: 'Vendor', value: tool.vendor },
    { label: 'Platforms', value: platformOptions(tool).map(p => p.label).join(', ') },
    ...(hosts.length ? [{ label: 'Editors', value: hosts.map(h => h.label).join(', ') }] : []),
    { label: 'License', value: tool.license.spdx === 'proprietary' ? 'Proprietary' : tool.license.spdx },
    { label: 'Pricing', value: entryPriceLabel(tool) },
    { label: 'Status', value: optionLabel(STATUSES, tool.status) }
  ]
}

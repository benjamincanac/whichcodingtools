import type { EnumOption } from '../enums'
import { FEATURES, HOSTS, LAYERS, PLATFORMS, PROVIDERS, STATUSES, optionLabel } from '../enums'
import type { Tool } from '../schema'
import type { ToolRecord, ToolSummary } from '../types/tool'
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

/** The slug is all it matches on, so a summary's trimmed aliases are enough. */
export function findByAlias<T extends { aliases: { slug: string }[] }>(slug: string, tools: T[]) {
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

/**
 * The record a list view gets. Every page that ranks, groups or compares inlines the whole
 * corpus into its payload, and it reads about half of each record: this drops the other half.
 *
 * Field by field it is `ToolSummary`, and the types are what keep the two honest. Adding a
 * field back here without adding it there does not compile, and reading a dropped field in a
 * component that takes a summary does not compile either.
 */
export function toSummary(tool: ToolRecord): ToolSummary {
  const { sources, install, links, license, models, pricing, wraps, aliases, freshness, ...rest } = tool
  void sources
  void install
  void links
  return {
    ...rest,
    license: { spdx: license.spdx, kind: license.kind },
    models: { providers: models.providers, plans: models.plans, byok: models.byok, local: models.local },
    pricing: {
      same_as: pricing.same_as,
      bundled_with: pricing.bundled_with,
      tiers: pricing.tiers?.map(tier => ({
        id: tier.id,
        name: tier.name,
        price: tier.price,
        per: tier.per,
        audience: tier.audience,
        contact_sales: tier.contact_sales,
        ...(tier.included ? { included: { amount: tier.included.amount, unit: tier.included.unit, period: tier.included.period, usd_value: tier.included.usd_value } } : {}),
        ...(tier.overage ? { overage: { kind: tier.overage.kind, markup_pct: tier.overage.markup_pct } } : {})
      }))
    },
    wraps: wraps.map(({ notes, ...wrap }) => {
      void notes
      return wrap
    }),
    aliases: aliases.map(alias => ({ slug: alias.slug })),
    freshness: { verified_at: freshness.verified_at, level: freshness.level }
  }
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

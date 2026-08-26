import { BYOK, FEATURES, LAYERS, LICENSE_KINDS, PLANS, PLATFORMS, PROVIDERS, optionLabel } from '../enums'
import type { Tier } from '../schema'
import type { ToolRecord } from '../types/tool'
import { entryPrice, resolvePricing, teamPrice } from './pricing'

export interface CompareCell {
  text: string
  /** Optional second line. */
  detail?: string
  /** true = good, false = missing, undefined = neutral. Drives the icon. */
  ok?: boolean
  /** Renders the text as an external link. */
  href?: string
}

export interface CompareRow {
  key: string
  label: string
  cells: CompareCell[]
}

export interface CompareGroup {
  key: string
  label: string
  rows: CompareRow[]
}

function list(values: string[], fallback = 'None') {
  return values.length ? values.join(', ') : fallback
}

function topIndividual(tiers: Tier[]) {
  const prices = tiers.filter(t => t.audience === 'individual' && t.price !== null).map(t => t.price as number)
  return prices.length ? Math.max(...prices) : null
}

/** `https://www.augmentcode.com/` -> `augmentcode.com`, so a cell stays narrow. */
function displayUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

function money(value: number | null, suffix = '/mo') {
  if (value === null) return null
  return value === 0 ? 'Free' : `$${value}${suffix}`
}

/** Rows for a side by side table. Each row has one cell per tool, in order. */
export function compareTools(tools: ToolRecord[], bySlug: Map<string, ToolRecord>): CompareGroup[] {
  const pricing = tools.map(t => resolvePricing(t, bySlug))

  const general: CompareRow[] = [
    { key: 'layer', label: 'Layer', cells: tools.map(t => ({ text: [t.layer, ...t.secondary_layers].map(l => optionLabel(LAYERS, l)).join(', ') })) },
    { key: 'vendor', label: 'Vendor', cells: tools.map(t => ({ text: t.vendor })) },
    { key: 'website', label: 'Website', cells: tools.map(t => ({ text: displayUrl(t.homepage), href: t.homepage })) },
    { key: 'platforms', label: 'Platforms', cells: tools.map(t => ({ text: list(t.platforms.map(p => optionLabel(PLATFORMS, p))) })) },
    { key: 'license', label: 'License', cells: tools.map(t => ({ text: t.license.spdx === 'proprietary' ? 'Proprietary' : t.license.spdx, detail: optionLabel(LICENSE_KINDS, t.license.kind), ok: t.open_source ? true : undefined })) },
    { key: 'status', label: 'Status', cells: tools.map(t => ({ text: t.status, ok: t.status === 'sunset' ? false : undefined })) }
  ]

  const price: CompareRow[] = [
    { key: 'free', label: 'Free tier', cells: tools.map(t => ({ text: t.has_free_tier ? 'Yes' : 'No', ok: t.has_free_tier })) },
    { key: 'entry', label: 'Entry price', cells: pricing.map(p => ({ text: money(entryPrice(p.tiers)) ?? (p.tiers.some(t => t.overage?.kind === 'api-list' && t.price === null) ? 'Usage-based' : 'Contact sales') })) },
    { key: 'top', label: 'Top individual plan', cells: pricing.map(p => ({ text: money(topIndividual(p.tiers)) ?? '—' })) },
    { key: 'team', label: 'Team seat', cells: pricing.map(p => ({ text: money(teamPrice(p.tiers), '/user/mo') ?? (p.tiers.some(t => t.audience !== 'individual') ? 'Contact sales' : '—') })) },
    {
      key: 'included',
      label: 'Included usage',
      cells: pricing.map((p) => {
        const tier = p.tiers.find(t => t.included && t.price !== null && t.price > 0) ?? p.tiers.find(t => t.included)
        if (!tier?.included) return { text: '—' }
        const inc = tier.included
        const amount = inc.unit === 'usd' ? `$${inc.amount}` : `${inc.amount.toLocaleString('en-US')} ${inc.unit}`
        return { text: `${amount}/${inc.period === 'month' ? 'mo' : inc.period}`, detail: `${tier.name}${inc.usd_value !== undefined && inc.unit !== 'usd' ? `, worth about $${inc.usd_value}` : ''}` }
      })
    },
    {
      key: 'overage',
      label: 'Beyond the plan',
      cells: pricing.map((p) => {
        const kinds = new Set(p.tiers.map(t => t.overage?.kind).filter(Boolean))
        const labels: Record<string, string> = { 'api-list': 'API list price', 'credits': 'Credit packs', 'fixed': 'Fixed rate', 'rate-limited': 'Rate limited', 'blocked': 'Blocked' }
        const markup = p.tiers.find(t => t.overage?.markup_pct)?.overage?.markup_pct
        return { text: kinds.size ? [...kinds].map(k => labels[k!] ?? k).join(', ') + (markup ? ` +${markup}%` : '') : '—' }
      })
    },
    { key: 'bundled', label: 'Part of a plan', cells: pricing.map(p => ({ text: p.bundled_with ? optionLabel(PLANS, p.bundled_with) : '—' })) }
  ]

  const models: CompareRow[] = [
    { key: 'providers', label: 'Providers', cells: tools.map(t => ({ text: list(t.effective_providers.map(p => optionLabel(PROVIDERS, p)), '—'), detail: !t.models.providers?.length && t.effective_providers.length ? 'inherited' : undefined })) },
    { key: 'byok', label: 'Bring your own key', cells: tools.map(t => ({ text: optionLabel(BYOK, t.models.byok), ok: t.models.byok === 'none' ? false : true })) },
    { key: 'local', label: 'Local models', cells: tools.map(t => ({ text: t.models.local ? 'Yes' : 'No', ok: t.models.local })) }
  ]

  const features: CompareRow[] = FEATURES
    .filter(f => tools.some(t => t.features.includes(f.value)))
    .map(f => ({ key: f.value, label: f.label, cells: tools.map(t => ({ text: t.features.includes(f.value) ? 'Yes' : 'No', ok: t.features.includes(f.value) })) }))

  const graph: CompareRow[] = [
    { key: 'runs', label: 'Runs', cells: tools.map(t => ({ text: list(t.wraps.map(w => bySlug.get(w.tool)?.name ?? w.tool), '—') })) },
    { key: 'runs-inside', label: 'Runs inside', cells: tools.map(t => ({ text: list(t.wrapped_by.map(s => bySlug.get(s)?.name ?? s), '—') })) },
    { key: 'verified', label: 'Pricing verified', cells: tools.map(t => ({ text: t.freshness.verified_at, ok: t.freshness.level === 'error' ? false : undefined })) }
  ]

  return [
    { key: 'general', label: 'General', rows: general },
    { key: 'pricing', label: 'Pricing', rows: price },
    { key: 'models', label: 'Models', rows: models },
    { key: 'features', label: 'Features', rows: features },
    { key: 'graph', label: 'Works with', rows: graph }
  ]
}

/** `cursor-vs-zed` <-> ['cursor', 'zed'], slugs sorted so every pair has one URL. */
export function pairSlug(a: string, b: string) {
  return [a, b].sort().join('-vs-')
}

/**
 * The comparisons worth advertising: two tools in the same layer, or a tool and something
 * it runs (Conductor vs Claude Code is a real question). Any other pair still renders on
 * demand, it is just not in the sitemap or the purge list. 68 tools make 2278 combinations
 * and most of them are noise.
 */
export function relatedPairs(tools: Pick<ToolRecord, 'slug' | 'layer' | 'wraps'>[]): [string, string][] {
  const slugs = new Set(tools.map(t => t.slug))
  const pairs = new Map<string, [string, string]>()
  const add = (a: string, b: string) => {
    if (a === b || !slugs.has(a) || !slugs.has(b)) return
    pairs.set(pairSlug(a, b), [a, b].sort() as [string, string])
  }
  for (const a of tools) {
    for (const b of tools) if (a.layer === b.layer) add(a.slug, b.slug)
    for (const wrap of a.wraps) add(a.slug, wrap.tool)
  }
  return [...pairs.values()]
}

export function parsePair(param: string) {
  const parts = param.split('-vs-')
  return parts.length === 2 ? (parts as [string, string]) : null
}

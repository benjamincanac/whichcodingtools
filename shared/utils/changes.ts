/**
 * The YAML diff behind `/changes` and `/changes.xml`.
 *
 * Derived from the data, never from commit messages: a message says what someone meant to do,
 * the file says what happened. And only semantic changes, because a feed nobody unsubscribes
 * from is one that never says "verified_at bumped". Re-verification with no value change is the
 * absence of news, and listing it destroys the signal of everything around it.
 *
 * Both sides are read defensively rather than through the schema. An old commit predates the
 * current schema by definition, so `ToolSchema.parse` on the "before" side would throw on
 * exactly the history worth reading.
 */

export interface TierLike {
  id?: string
  name?: string
  price?: number | null
  price_annual?: number
  per?: string
  contact_sales?: boolean
  trial_days?: number
  included?: { amount?: number, unit?: string, period?: string }
  overage?: { kind?: string, markup_pct?: number, rate?: number }
}

export interface ToolLike {
  slug?: string
  name?: string
  description?: string
  layer?: string
  secondary_layers?: string[]
  vendor?: string
  status?: string
  sunset_at?: string
  successor?: string
  platforms?: string[]
  hosts?: string[]
  features?: string[]
  license?: { spdx?: string, kind?: string }
  models?: { byok?: string, local?: boolean, providers?: string[], plans?: string[] }
  wraps?: { tool?: string, uses_subscription?: boolean }[]
  aliases?: { slug?: string, name?: string, until?: string }[]
  pricing?: { same_as?: string, bundled_with?: string, tiers?: TierLike[] }
}

/** A price the way the site writes it, so the feed and the pricing table agree. */
function money(value: number | null | undefined, tier?: TierLike): string {
  if (value === null || value === undefined) {
    if (tier?.contact_sales) return 'contact sales'
    return tier?.overage ? 'usage-based' : 'no price'
  }
  return value === 0 ? 'free' : `$${value}/mo`
}

function amount(included: NonNullable<TierLike['included']>): string {
  if (included.amount === undefined) return 'an unstated amount'
  const unit = included.unit === 'usd' ? `$${included.amount}` : `${included.amount.toLocaleString('en-US')} ${included.unit ?? ''}`.trim()
  return included.period && included.period !== 'month' ? `${unit} per ${included.period}` : `${unit}/mo`
}

function list(values: string[] | undefined): string[] {
  return Array.isArray(values) ? values.filter(v => typeof v === 'string') : []
}

/** What was added and what was dropped, as a sentence, or nothing when the set is unchanged. */
function setChange(label: string, before: string[] | undefined, after: string[] | undefined): string | undefined {
  const from = new Set(list(before))
  const to = new Set(list(after))
  const added = [...to].filter(v => !from.has(v))
  const removed = [...from].filter(v => !to.has(v))
  if (!added.length && !removed.length) return undefined
  const parts: string[] = []
  if (added.length) parts.push(`added ${added.join(', ')}`)
  if (removed.length) parts.push(`dropped ${removed.join(', ')}`)
  return `${label} ${parts.join(' and ')}`
}

function scalar<T>(label: string, before: T | undefined, after: T | undefined, format: (v: T) => string = String): string | undefined {
  if (before === after) return undefined
  if (before === undefined) return `${label} set to ${format(after as T)}`
  if (after === undefined) return `${label} removed (was ${format(before)})`
  return `${label} changed from ${format(before)} to ${format(after)}`
}

function tiersOf(tool: ToolLike | undefined): Map<string, TierLike> {
  const tiers = tool?.pricing?.tiers
  return new Map(Array.isArray(tiers) ? tiers.filter(t => t?.id).map(t => [t.id!, t]) : [])
}

/** Everything newsworthy inside one tier, in the order a reader cares about it. */
function tierChanges(name: string, before: TierLike, after: TierLike): string[] {
  const lines: string[] = []

  if (before.price !== after.price || before.contact_sales !== after.contact_sales) {
    lines.push(`${name} price changed from ${money(before.price, before)} to ${money(after.price, after)}`)
  }
  const annual = scalar(`${name} annual price`, before.price_annual, after.price_annual, v => `$${v}/mo`)
  if (annual) lines.push(annual)

  const beforeIncluded = before.included && amount(before.included)
  const afterIncluded = after.included && amount(after.included)
  if (beforeIncluded !== afterIncluded) {
    if (!beforeIncluded) lines.push(`${name} now includes ${afterIncluded}`)
    else if (!afterIncluded) lines.push(`${name} no longer includes usage (was ${beforeIncluded})`)
    else lines.push(`${name} included usage changed from ${beforeIncluded} to ${afterIncluded}`)
  }

  if ((before.overage?.kind ?? 'none') !== (after.overage?.kind ?? 'none')) {
    lines.push(`${name} overage changed from ${before.overage?.kind ?? 'none'} to ${after.overage?.kind ?? 'none'}`)
  }
  const markup = scalar(`${name} overage markup`, before.overage?.markup_pct, after.overage?.markup_pct, v => `${v}%`)
  if (markup) lines.push(markup)
  const rate = scalar(`${name} overage rate`, before.overage?.rate, after.overage?.rate, v => `$${v}`)
  if (rate) lines.push(rate)

  const per = scalar(`${name} billing`, before.per, after.per, v => `per ${v}`)
  if (per) lines.push(per)
  const trial = scalar(`${name} trial`, before.trial_days, after.trial_days, v => `${v} days`)
  if (trial) lines.push(trial)
  if (before.name && after.name && before.name !== after.name) {
    lines.push(`${before.name} renamed to ${after.name}`)
  }

  return lines
}

function pricingChanges(before: ToolLike, after: ToolLike): string[] {
  const lines: string[] = []
  const from = tiersOf(before)
  const to = tiersOf(after)

  for (const [id, tier] of to) {
    if (!from.has(id)) lines.push(`new ${tier.name ?? id} tier at ${money(tier.price, tier)}`)
  }
  for (const [id, tier] of from) {
    if (!to.has(id)) lines.push(`${tier.name ?? id} tier withdrawn`)
  }
  for (const [id, tier] of to) {
    const previous = from.get(id)
    if (previous) lines.push(...tierChanges(tier.name ?? previous.name ?? id, previous, tier))
  }

  const bundled = scalar('part of a plan', before.pricing?.bundled_with, after.pricing?.bundled_with)
  if (bundled) lines.push(bundled)
  const sameAs = scalar('pricing carried from', before.pricing?.same_as, after.pricing?.same_as)
  if (sameAs) lines.push(sameAs)

  return lines
}

/**
 * One tool's semantic changes between two revisions of its file.
 *
 * `sources` is deliberately absent. It is provenance, and a re-read that confirmed the page is
 * the one thing this feed must never report.
 */
export function toolChanges(before: ToolLike | undefined, after: ToolLike | undefined): string[] {
  if (!before && !after) return []
  if (!before) return ['added to the directory']
  if (!after) return ['removed from the directory']

  const lines: string[] = []

  const renamed = scalar('renamed', before.name, after.name, v => v)
  if (before.name !== after.name && before.name && after.name) lines.push(`renamed from ${before.name} to ${after.name}`)
  else if (renamed && (!before.name || !after.name)) lines.push(renamed)

  const status = scalar('status', before.status ?? 'active', after.status ?? 'active')
  if (status) lines.push(status)
  const sunset = scalar('end of support', before.sunset_at, after.sunset_at, v => v)
  if (sunset) lines.push(sunset)
  const successor = scalar('successor', before.successor, after.successor)
  if (successor) lines.push(successor)

  lines.push(...pricingChanges(before, after))

  const layer = scalar('layer', before.layer, after.layer)
  if (layer) lines.push(layer)
  const secondary = setChange('secondary layers', before.secondary_layers, after.secondary_layers)
  if (secondary) lines.push(secondary)

  const spdx = scalar('license', before.license?.spdx, after.license?.spdx)
  if (spdx) lines.push(spdx)
  else {
    const kind = scalar('license kind', before.license?.kind, after.license?.kind)
    if (kind) lines.push(kind)
  }

  const byok = scalar('bring your own key', before.models?.byok ?? 'none', after.models?.byok ?? 'none')
  if (byok) lines.push(byok)
  if ((before.models?.local ?? false) !== (after.models?.local ?? false)) {
    lines.push(after.models?.local ? 'gained local model support' : 'dropped local model support')
  }
  const providers = setChange('model providers', before.models?.providers, after.models?.providers)
  if (providers) lines.push(providers)
  const plans = setChange('sign-in plans', before.models?.plans, after.models?.plans)
  if (plans) lines.push(plans)

  const platforms = setChange('platforms', before.platforms, after.platforms)
  if (platforms) lines.push(platforms)
  const hosts = setChange('editors', before.hosts, after.hosts)
  if (hosts) lines.push(hosts)
  const features = setChange('features', before.features, after.features)
  if (features) lines.push(features)

  const wraps = setChange(
    'runs',
    before.wraps?.map(w => w.tool).filter((t): t is string => Boolean(t)),
    after.wraps?.map(w => w.tool).filter((t): t is string => Boolean(t))
  )
  if (wraps) lines.push(wraps)

  const aliases = setChange(
    'former names',
    before.aliases?.map(a => a.name).filter((n): n is string => Boolean(n)),
    after.aliases?.map(a => a.name).filter((n): n is string => Boolean(n))
  )
  if (aliases) lines.push(aliases)

  // Last, and never quoted: two 180-character sentences in a feed entry drown the price change
  // above them, and the tool page is one click away.
  if (before.description !== after.description) lines.push('description rewritten')

  return lines
}

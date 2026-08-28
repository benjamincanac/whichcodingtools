import type { Freshness, FreshnessLevel } from '../types/tool'
import type { Tool } from '../schema'

export const FRESH_DAYS = 30
export const STALE_DAYS = 90

export function daysSince(date: string, now = new Date()) {
  const then = new Date(`${date}T00:00:00Z`)
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000))
}

export function freshnessLevel(date: string, now = new Date()): FreshnessLevel {
  const days = daysSince(date, now)
  if (days < FRESH_DAYS) return 'success'
  if (days < STALE_DAYS) return 'warning'
  return 'error'
}

export function pricingVerifiedAt(tool: Pick<Tool, 'sources'>) {
  return tool.sources
    .filter(s => s.covers.includes('pricing'))
    .map(s => s.verified_at)
    .sort()
    .at(-1)!
}

export function oldestVerifiedAt(tool: Pick<Tool, 'sources'>) {
  return tool.sources.map(s => s.verified_at).sort()[0]!
}

export function computeFreshness(tool: Pick<Tool, 'sources' | 'status'>, now = new Date()): Freshness {
  const verified_at = pricingVerifiedAt(tool)
  return {
    verified_at,
    oldest: oldestVerifiedAt(tool),
    // Sunset tools are frozen on purpose and never count as stale.
    level: tool.status === 'sunset' ? 'success' : freshnessLevel(verified_at, now),
    computed_at: now.toISOString()
  }
}

/** `now` is the record's `computed_at`, the clock that decided its level, never the browser's. */
export function relativeDays(date: string, now: Date) {
  const days = daysSince(date, now)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? 'a month ago' : `${months} months ago`
}

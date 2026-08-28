import { describe, expect, it } from 'vitest'
import { EMPTY_REQUIREMENTS, matchTool } from '#shared/utils/match'
import { compareTools } from '#shared/utils/compare'
import { entryPrice, resolvePricing } from '#shared/utils/pricing'
import { findByAlias, toSummary } from '#shared/utils/tools'
import { loadRecords } from './content'

/**
 * The summary is the record every list page ships, and the only thing keeping it honest is
 * that the helpers reading it still work. A field dropped here that `matchTool` or
 * `compareTools` needs is a filter that silently stops matching, not a crash.
 */
describe('tool summary', async () => {
  const records = await loadRecords()
  const summaries = records.map(toSummary)
  const bySlug = new Map(summaries.map(t => [t.slug, t]))
  const recordsBySlug = new Map(records.map(t => [t.slug, t]))

  it('drops the fields only a tool page renders', () => {
    for (const summary of summaries) {
      const loose = summary as Record<string, unknown>
      expect(loose.sources).toBeUndefined()
      expect(loose.install).toBeUndefined()
      expect(loose.links).toBeUndefined()
      expect(loose.license).not.toHaveProperty('notes')
      expect(loose.models).not.toHaveProperty('notes')
      expect(summary.pricing).not.toHaveProperty('notes')
      for (const tier of summary.pricing.tiers ?? []) {
        expect(tier).not.toHaveProperty('limits')
        expect(tier).not.toHaveProperty('price_annual')
      }
    }
  })

  it('is smaller than the record it came from', () => {
    const full = JSON.stringify(records).length
    const slim = JSON.stringify(summaries).length
    expect(slim).toBeLessThan(full / 2)
  })

  it('ranks the same as the full record', () => {
    const requirements = { ...EMPTY_REQUIREMENTS, oss: true, local: true, free: true, byok: true }
    for (const record of records) {
      const fromRecord = matchTool(record, requirements, recordsBySlug)
      const fromSummary = matchTool(bySlug.get(record.slug)!, requirements, bySlug)
      expect(fromSummary).toEqual(fromRecord)
    }
  })

  it('prices the same as the full record, `same_as` included', () => {
    for (const record of records) {
      const full = resolvePricing(record, recordsBySlug)
      const slim = resolvePricing(bySlug.get(record.slug)!, bySlug)
      expect(slim.bundled_with).toEqual(full.bundled_with)
      expect(entryPrice(slim.tiers)).toEqual(entryPrice(full.tiers))
      expect(slim.tiers.map(t => t.id)).toEqual(full.tiers.map(t => t.id))
    }
  })

  it('builds the same comparison table as the full record', () => {
    const [a, b] = ['claude-code', 'cursor']
    expect(compareTools([bySlug.get(a)!, bySlug.get(b)!], bySlug))
      .toEqual(compareTools([recordsBySlug.get(a)!, recordsBySlug.get(b)!], recordsBySlug))
  })

  it('still resolves a renamed slug', () => {
    const renamed = records.find(t => t.aliases.length)
    expect(renamed, 'the corpus has no aliased tool to test with').toBeDefined()
    const alias = renamed!.aliases[0]!.slug
    expect(findByAlias(alias, summaries)?.slug).toBe(renamed!.slug)
  })
})

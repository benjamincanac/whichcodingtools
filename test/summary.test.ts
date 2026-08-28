import { describe, expect, it } from 'vitest'
import { siteOpenApi, type DiscoveryFragments } from '../server/utils/openapi'
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
/** The site half of the document is all this file reads, so the module's half is a stub. */
const discovery: DiscoveryFragments = {
  tags: [],
  paths: {},
  components: { headers: {}, responses: {}, schemas: {} }
}

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

  it('is described by the ToolSummary schema `/openapi.json` publishes', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any -- the document is plain JSON with no static shape. */
    const schemas = (siteOpenApi('https://whichcoding.tools', discovery) as any).components.schemas
    const schema = schemas.ToolSummary
    const propertiesOf = (node: any): string[] => Object.keys(node?.properties ?? node?.items?.properties ?? {}).sort()

    // Every key the transform emits is described, and nothing described is missing from it.
    const emitted = [...new Set(summaries.flatMap(t => Object.keys(t)))].sort()
    expect(propertiesOf(schema)).toEqual(expect.arrayContaining(emitted))

    const tier = summaries.flatMap(t => t.pricing.tiers ?? []).find(t => t.included && t.overage)
    expect(tier, 'the corpus has no tier with both included and overage').toBeDefined()
    expect(propertiesOf(schema.properties.pricing.properties.tiers)).toEqual(expect.arrayContaining(Object.keys(tier!).sort()))
    expect(propertiesOf(schema.properties.pricing.properties.tiers.items.properties.included)).toEqual(Object.keys(tier!.included!).sort())

    // `freshness` is a `$ref`, so it is the one branch the drop tree cannot reach on its own.
    expect(schema.properties.freshness.$ref).toBe('#/components/schemas/FreshnessSummary')
    expect(Object.keys(schemas.FreshnessSummary.properties).sort()).toEqual(Object.keys(summaries[0]!.freshness).sort())

    // And the tool-page-only fields are gone from it.
    expect(schema.properties).not.toHaveProperty('sources')
    expect(schema.properties).not.toHaveProperty('install')
    expect(schema.properties).not.toHaveProperty('links')
    expect(schema.properties.pricing.properties).not.toHaveProperty('notes')
    expect(schema.properties.pricing.properties.tiers.items.properties).not.toHaveProperty('limits')
    expect(schema.required).not.toContain('sources')
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })

  it('still resolves a renamed slug', () => {
    const renamed = records.find(t => t.aliases.length)
    expect(renamed, 'the corpus has no aliased tool to test with').toBeDefined()
    const alias = renamed!.aliases[0]!.slug
    expect(findByAlias(alias, summaries)?.slug).toBe(renamed!.slug)
  })
})

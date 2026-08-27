/* eslint-disable @typescript-eslint/no-explicit-any -- the document is plain JSON with no static shape, so the assertions walk it untyped. */
import { describe, expect, it } from 'vitest'
import { siteOpenApi, type DiscoveryFragments } from '../server/utils/openapi'
import { toolJsonSchema } from '#shared/schema'
import { FRESHNESS_LEVELS, PRICING_MODELS } from '#shared/types/tool'
import { loadRecords } from './content'

type Json = Record<string, any>

/**
 * What `agentDiscoveryOpenApi()` hands over, with the operation ids it really generates for this
 * site's `agentDiscovery.routes`. Spelled out rather than trimmed: `/tools` is a page, so the
 * module owns `getTools`, and a fixture that left it out would let the JSON endpoints claim an
 * id that collides in production.
 */
const discovery: DiscoveryFragments = {
  tags: [{ name: 'Documentation' }, { name: 'Discovery' }],
  paths: {
    '/': { get: { operationId: 'getHomepage' } },
    '/raw/index.md': { get: { operationId: 'getHomepageMarkdown' } },
    '/tools': { get: { operationId: 'getTools' } },
    '/raw/tools.md': { get: { operationId: 'getToolsMarkdown' } },
    '/tools/{path}': { get: { operationId: 'getToolsPage' } },
    '/raw/tools/{path}.md': { get: { operationId: 'getToolsPageMarkdown' } },
    '/compare': { get: { operationId: 'getCompare' } },
    '/compare/{path}': { get: { operationId: 'getComparePage' } },
    '/layers/{path}': { get: { operationId: 'getLayersPage' } },
    '/plans/{path}': { get: { operationId: 'getPlansPage' } },
    '/sitemap.md': { get: { operationId: 'getSitemapMarkdown' } },
    '/llms.txt': { get: { operationId: 'getLlmsTxt' } },
    '/.well-known/api-catalog': { get: { operationId: 'getApiCatalog' } },
    // A path the site also describes, to prove which side wins.
    '/api/tools.json': { get: { operationId: 'generated' } }
  },
  components: {
    headers: { Vary: { schema: { type: 'string' } } },
    responses: { NotFoundMarkdown: { description: 'Gone.' } },
    schemas: { Linkset: { type: 'object' } }
  }
}

const SITE_URL = 'https://whichcoding.tools'
const doc = siteOpenApi(SITE_URL, discovery) as Json

/** Every `$ref` in the document, so none of them can point at a node that was never defined. */
function refs(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach(child => refs(child, found))
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') found.push(value)
      else refs(value, found)
    }
  }
  return found
}

function resolve(pointer: string): unknown {
  return pointer.replace(/^#\//, '').split('/').reduce<any>((node, segment) => node?.[segment.replace(/~1/g, '/')], doc)
}

describe('the document itself', () => {
  it('is OpenAPI 3.1 with the origin as its only server', () => {
    expect(doc.openapi).toBe('3.1.0')
    expect(doc.servers).toEqual([{ url: SITE_URL, description: 'Production' }])
    expect(doc.info.title).toBe('whichcoding.tools')
    expect(doc.info.version).toBeTypeOf('string')
  })

  it('declares that nothing here needs authentication', () => {
    expect(doc.security).toEqual([])
  })

  it('resolves every $ref it contains', () => {
    const pointers = refs(doc)
    expect(pointers.length).toBeGreaterThan(0)
    for (const pointer of pointers) {
      expect(pointer, `${pointer} is not a local pointer`).toMatch(/^#\//)
      expect(resolve(pointer), `${pointer} does not resolve`).toBeDefined()
    }
  })

  it('gives every operation a unique operationId', () => {
    const ids = Object.values(doc.paths as Json)
      .flatMap(path => Object.values(path as Json))
      .map(operation => (operation as Json).operationId)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('merging the discovery half', () => {
  it('keeps the generated paths, tags and schemas', () => {
    expect(doc.paths['/raw/index.md']).toBeDefined()
    expect(doc.paths['/sitemap.md']).toBeDefined()
    expect(doc.tags.map((tag: Json) => tag.name)).toEqual(['Documentation', 'Discovery', 'Data'])
    expect(doc.components.schemas.Linkset).toBeDefined()
    expect(doc.components.headers.Vary).toBeDefined()
    expect(doc.components.responses.NotFoundMarkdown).toBeDefined()
  })

  it('lets the site replace a generated path with its own description', () => {
    expect(doc.paths['/api/tools.json'].get.operationId).toBe('getToolsJson')
  })
})

describe('the API surface', () => {
  it('describes every JSON endpoint the site serves', () => {
    expect(Object.keys(doc.paths)).toEqual(expect.arrayContaining([
      '/api/tools.json',
      '/api/tools/{slug}.json',
      '/api/compare.json',
      '/api/finder/parse'
    ]))
  })

  it('declares the slug parameter with the schema pattern slugs are validated against', () => {
    const [parameter] = doc.paths['/api/tools/{slug}.json'].get.parameters
    expect(parameter.name).toBe('slug')
    expect(parameter.in).toBe('path')
    expect(parameter.required).toBe(true)
    expect(new RegExp(parameter.schema.pattern).test('claude-code')).toBe(true)
    expect(new RegExp(parameter.schema.pattern).test('Claude_Code')).toBe(false)
  })

  it('documents the finder failure modes, which are the only ones a caller can hit', () => {
    expect(Object.keys(doc.paths['/api/finder/parse'].post.responses)).toEqual(['200', '400', '502', '503'])
  })

  it('leaves the webhook and the sitemap source out', () => {
    expect(doc.paths['/api/revalidate']).toBeUndefined()
    expect(doc.paths['/api/__sitemap__/urls']).toBeUndefined()
  })
})

describe('the Tool schema', () => {
  const tool = doc.components.schemas.Tool as Json

  it('drops the JSON Schema dialect, which belongs to the document', () => {
    expect(tool.$schema).toBeUndefined()
    expect(doc.components.schemas.ParsedRequirements.$schema).toBeUndefined()
  })

  it('carries every property zod generates from ToolSchema', () => {
    const generated = Object.keys((toolJsonSchema() as Json).properties)
    expect(Object.keys(tool.properties)).toEqual(expect.arrayContaining(generated))
  })

  it('publishes the enums the code branches on', () => {
    expect(tool.properties.pricing_model.enum).toEqual([...PRICING_MODELS])
    expect(doc.components.schemas.Freshness.properties.level.enum).toEqual([...FRESHNESS_LEVELS])
  })

  it('requires the computed fields, which the API always sends', () => {
    expect(tool.required).toEqual(expect.arrayContaining([
      'open_source',
      'pricing_model',
      'has_free_tier',
      'entry_price',
      'effective_providers',
      'wrapped_by',
      'freshness'
    ]))
  })

  it('describes every field the API actually returns', async () => {
    const records = await loadRecords()
    expect(records.length).toBeGreaterThan(0)

    const served = new Set(records.flatMap(record => Object.keys(record)))
    const described = new Set(Object.keys(tool.properties))
    expect([...served].filter(key => !described.has(key))).toEqual([])
  })

  it('requires nothing a record does not carry', async () => {
    const records = await loadRecords()
    for (const key of tool.required as string[]) {
      expect(records.every(record => key in record), `${key} is required but missing from a record`).toBe(true)
    }
  })
})

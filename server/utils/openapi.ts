import { z } from 'zod'
import { ParsedRequirementsSchema } from '#shared/finder'
import { toolJsonSchema } from '#shared/schema'
import { FRESHNESS_LEVELS, PRICING_MODELS } from '#shared/types/tool'

/**
 * The OpenAPI 3.1 description of everything this site serves, at `/openapi.json`.
 *
 * Kept out of the route handler so the document can be built and asserted without an H3 event.
 *
 * Two halves. The agent surfaces (the negotiated pages, their `/raw/**` twins, `sitemap.md`,
 * `llms.txt`, the api-catalog) come from `agentDiscoveryOpenApi()`, generated out of the same
 * route config that serves them, so they cannot drift. This file owns the JSON endpoints, and
 * describes them with `z.toJSONSchema()` of the very schemas that validate and parse at
 * runtime: `ToolSchema` for a tool, `ParsedRequirementsSchema` for the finder. A field that
 * changes shape changes here in the same commit or not at all.
 */

type Json = Record<string, unknown>

export interface DiscoveryFragments {
  tags: Json[]
  paths: Json
  components: { headers: Json, responses: Json, schemas: Json }
}

/** JSON Schema for an OpenAPI component: the dialect is the document's, not the schema's. */
function component(schema: Json, description: string): Json {
  const { $schema, ...rest } = schema
  void $schema
  return { description, ...rest }
}

/**
 * `Tool` as the API serves it: the YAML document plus the fields `toRecords()` computes.
 *
 * The computed half is spelled out because it is TypeScript rather than zod. `PRICING_MODELS`
 * and `FRESHNESS_LEVELS` are exported from `shared/types/tool.ts` for this reason, so the enums
 * published here are the ones the code branches on.
 */
function toolSchema(): Json {
  const base = component(toolJsonSchema() as Json, 'One tool: the YAML record in `content/tools`, plus the fields computed from it.')
  const properties = base.properties as Json
  const required = base.required as string[]

  return {
    ...base,
    properties: {
      ...properties,
      open_source: { type: 'boolean', description: 'Computed. True when `license.kind` is `open-source`.' },
      pricing_model: { type: 'string', enum: [...PRICING_MODELS], description: 'Computed from the resolved tiers.' },
      has_free_tier: { type: 'boolean', description: 'Computed. True when a tier costs nothing.' },
      entry_price: { type: ['number', 'null'], description: 'Computed. Cheapest flat monthly price for an individual, null when usage-only or contact sales.' },
      effective_providers: { type: 'array', items: { type: 'string' }, description: 'Computed. `models.providers`, or what is inherited through `wraps` when the tool declares none.' },
      wrapped_by: { type: 'array', items: { type: 'string' }, description: 'Computed. Slugs of the tools that wrap this one.' },
      freshness: { $ref: '#/components/schemas/Freshness' }
    },
    required: [...required, 'open_source', 'pricing_model', 'has_free_tier', 'entry_price', 'effective_providers', 'wrapped_by', 'freshness']
  }
}

const freshnessSchema: Json = {
  type: 'object',
  description: 'How old the data behind a tool is. Dates are the day a person read the vendor page, never a build date.',
  properties: {
    verified_at: { type: 'string', format: 'date', description: 'Newest source covering pricing.' },
    oldest: { type: 'string', format: 'date', description: 'Oldest source of any kind.' },
    level: { type: 'string', enum: [...FRESHNESS_LEVELS], description: 'Under 30 days, under 90 days, older. A sunset tool is always `success`, its data is frozen on purpose.' },
    computed_at: { type: 'string', format: 'date-time', description: 'When the record was computed, which is when the response was rendered.' }
  },
  required: ['verified_at', 'oldest', 'level', 'computed_at']
}

const errorSchema: Json = {
  type: 'object',
  description: 'Nitro error body. Requests that prefer Markdown get the Markdown error instead.',
  properties: {
    statusCode: { type: 'integer' },
    statusMessage: { type: 'string' },
    message: { type: 'string' }
  },
  required: ['statusCode']
}

function jsonResponse(description: string, schema: Json): Json {
  return { description, content: { 'application/json': { schema } } }
}

function errorResponse(description: string): Json {
  return jsonResponse(description, { $ref: '#/components/schemas/Error' })
}

/**
 * The JSON endpoints. Everything under `/api`, minus the webhook and the sitemap source.
 *
 * Exported so the route can hand them to `agentDiscoveryOpenApi()`, which claims every
 * `operationId` here before deriving its own. The `Json` suffix is kept anyway: with the ids
 * reserved the module would rename its `/tools` page operation to `getTools2` instead, and a
 * generated client calling `getTools2()` for a page is worse than the suffix.
 */
export function apiPaths(): Json {
  return {
    '/api/tools.json': {
      get: {
        tags: ['Data'],
        operationId: 'getToolsJson',
        summary: 'Every tool',
        description: 'The whole directory in one document, the same records every page on this site renders.',
        responses: {
          200: jsonResponse('Every tool.', { $ref: '#/components/schemas/ToolsResponse' })
        }
      }
    },
    '/api/tools/{slug}.json': {
      get: {
        tags: ['Data'],
        operationId: 'getToolJson',
        summary: 'One tool',
        description: 'A single record. A renamed slug is not resolved here, `aliases` on the current record carries the old ones.',
        parameters: [{
          name: 'slug',
          in: 'path',
          required: true,
          description: 'The tool slug, lowercase letters, digits and single dashes.',
          schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          example: 'claude-code'
        }],
        responses: {
          200: jsonResponse('The tool.', { $ref: '#/components/schemas/Tool' }),
          404: errorResponse('No tool with that slug.')
        }
      }
    },
    '/api/compare.json': {
      get: {
        tags: ['Data'],
        operationId: 'getComparePairs',
        summary: 'Every comparison worth listing',
        description: 'Two tools in the same layer, or one that runs the other. Any other two slugs still render at `/compare/{a}-vs-{b}`, they are only absent from this list.',
        responses: {
          200: jsonResponse('The pair list.', { $ref: '#/components/schemas/ComparePairsResponse' })
        }
      }
    },
    '/api/finder/parse': {
      post: {
        tags: ['Data'],
        operationId: 'parseFinderQuery',
        summary: 'Turn one sentence into filters',
        description: 'What the box on the homepage calls. The model only fills the filters, the ranking behind `/tools` is deterministic. Agents that already know what they want should build the query string themselves rather than pay for this.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { query: { type: 'string', minLength: 3, maxLength: 300, description: 'One sentence describing how you work.' } },
                required: ['query']
              },
              example: { query: 'Terminal agent on Linux, I already pay for Claude Max' }
            }
          }
        },
        responses: {
          200: jsonResponse('The parsed filters.', { $ref: '#/components/schemas/FinderResponse' }),
          400: errorResponse('`query` is missing or outside 3 to 300 characters.'),
          502: errorResponse('The model could not parse that.'),
          503: errorResponse('Natural language search is not configured on this deployment.')
        }
      }
    }
  }
}

export function siteOpenApi(siteUrl: string, discovery: DiscoveryFragments): Json {
  return {
    openapi: '3.1.0',
    info: {
      title: 'whichcoding.tools',
      version: '1.0.0',
      summary: 'An open, always-fresh directory of AI coding tools.',
      description: [
        'Every editor, terminal agent, orchestrator and cloud agent, one YAML file per tool in git, validated against a schema.',
        '',
        'Every figure comes from a vendor page that someone read on the date recorded next to it, and every page of this site is available as Markdown: append `.md` to its URL or send `Accept: text/markdown`.',
        '',
        'No affiliate links, no benchmarks, no LLM-written descriptions. Read only, no authentication, no rate limit beyond the CDN. Responses are cached for an hour and purged when the data behind them changes.'
      ].join('\n'),
      license: { name: 'MIT', identifier: 'MIT' },
      contact: { name: 'Source and issues', url: 'https://github.com/benjamincanac/whichcodingtools' }
    },
    servers: [{ url: siteUrl, description: 'Production' }],
    // Read only and public, so no scheme applies. Declared rather than left out: an absent
    // `security` reads as undecided, an empty one says there is nothing to send.
    security: [],
    tags: [...discovery.tags, { name: 'Data', description: 'The directory as JSON.' }],
    // The site's own paths last, so a richer description here replaces a generated one.
    paths: { ...discovery.paths, ...apiPaths() },
    components: {
      headers: discovery.components.headers,
      responses: discovery.components.responses,
      schemas: {
        ...discovery.components.schemas,
        Tool: toolSchema(),
        Freshness: freshnessSchema,
        Error: errorSchema,
        ToolsResponse: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            generated_at: { type: 'string', format: 'date-time' },
            tools: { type: 'array', items: { $ref: '#/components/schemas/Tool' } }
          },
          required: ['count', 'generated_at', 'tools']
        },
        ComparePairsResponse: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
            generated_at: { type: 'string', format: 'date-time' },
            ordering: { type: 'string', description: 'States the rule that gives each comparison exactly one URL.' },
            pattern: { type: 'string', description: 'How to build a comparison URL.' },
            markdown_pattern: { type: 'string', description: 'The same comparison as Markdown.' },
            pairs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  a: { type: 'string' },
                  b: { type: 'string' },
                  slug: { type: 'string' },
                  url: { type: 'string' }
                },
                required: ['a', 'b', 'slug', 'url']
              }
            }
          },
          required: ['count', 'generated_at', 'ordering', 'pattern', 'markdown_pattern', 'pairs']
        },
        ParsedRequirements: component(
          z.toJSONSchema(ParsedRequirementsSchema, { io: 'output', unrepresentable: 'any' }) as Json,
          'The filters a sentence was understood as. Every field is present, empty means the sentence did not say.'
        ),
        FinderResponse: {
          type: 'object',
          properties: {
            parsed: { $ref: '#/components/schemas/ParsedRequirements' },
            usage: {
              type: 'object',
              description: 'Tokens the parse cost.',
              properties: { input: { type: 'integer' }, output: { type: 'integer' } }
            }
          },
          required: ['parsed']
        }
      }
    }
  }
}

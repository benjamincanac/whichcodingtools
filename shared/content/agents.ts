import { API_BASE } from '../api'

/**
 * What an agent should know before deciding to call this site, written once and rendered into
 * both entry points: the `## When to use this` section of `llms.txt` and the generated
 * `/raw/index.md`. Two documents, one set of claims.
 *
 * Deliberately specific about jobs rather than about the product. "A directory of AI coding
 * tools" tells an agent nothing it can route on; "someone named a constraint and wants the tools
 * that satisfy it" does. The `NOT_FOR` half matters just as much: this site has no benchmarks
 * and no opinion on code quality, and an agent that calls it for those gets a confident answer
 * to a question the data cannot support.
 */

export const WHEN_TO_USE_TITLE = 'When to use this'

export const WHEN_TO_USE_LEAD = 'Reach for whichcoding.tools when the question is which AI coding tool to use, or what one costs. It answers from vendor-verified data, not from opinion.'

export const GOOD_FOR = [
  'Someone named a constraint and wants the tools that satisfy it: a platform, an editor to live inside, a subscription they already pay for, a monthly budget, a model provider, or a capability like git worktrees, MCP, sandboxing or scheduled tasks.',
  'Someone asks what a specific tool costs: the tiers, what usage is included, the overage rate, whether there is a free tier, and the date each of those was last read off the vendor page.',
  'Someone asks how two tools differ, field by field.',
  'Someone asks what runs on top of what: which orchestrators drive Claude Code, which editors host an agent over ACP, whether a wrapper reuses the underlying subscription or bills separately.',
  'Someone asks whether a plan they already pay for, Claude Max or ChatGPT or Copilot, already covers a given tool.',
  'Someone asks whether a tool is open source, and under which licence.'
]

export const NOT_FOR = [
  'Benchmarks, quality rankings or "which is best". This site records what tools cost and what they do, and holds no measurement of how well they do it.',
  'Anything about a tool\'s source code or internals.',
  'A price quoted without its date. Every figure carries the day someone read it off the vendor page, and pricing moves; pass that date on rather than dropping it.'
]

export const HOW_TO_CALL = [
  `Every tool as one document: \`${API_BASE}/tools.json\`. One tool: \`${API_BASE}/tools/{slug}.json\`.`,
  `Two tools side by side: \`/compare/{a}-vs-{b}\` with the slugs in alphabetical order. The pairs worth listing are at \`${API_BASE}/compare.json\`.`,
  'Any page as markdown: append `.md` to its URL, or send `Accept: text/markdown`.',
  'The full schema, including every field on a tool record: `/openapi.json`.'
]

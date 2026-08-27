import { describe, expect, it } from 'vitest'
import { isMarkdownRepresentation } from '../server/utils/markdown-vary'

/** What the module puts in `runtimeConfig.public.agentDiscovery`, which the middleware reads. */
const RAW_PREFIX = '/raw'

const varies = (path: string) => isMarkdownRepresentation(path, RAW_PREFIX)

describe('which responses get Vary: Accept, User-Agent added', () => {
  it('covers the raw markdown twins a negotiated page redirects to', () => {
    expect(varies('/raw/index.md')).toBe(true)
    expect(varies('/raw/tools.md')).toBe(true)
    expect(varies('/raw/compare/claude-code-vs-codex.md')).toBe(true)
  })

  it('leaves a document nothing redirects to alone, one hop and one representation', () => {
    expect(varies('/sitemap.md')).toBe(false)
    expect(varies('/sitemap.xml')).toBe(false)
  })

  it('ignores the query and the fragment', () => {
    expect(varies('/raw/tools.md?q=terminal')).toBe(true)
    expect(varies('/raw/tools.md?x=1#top')).toBe(true)
  })

  it('follows `rawPrefix` rather than a copy of it', () => {
    expect(isMarkdownRepresentation('/md/tools.md', '/md')).toBe(true)
    expect(isMarkdownRepresentation('/raw/tools.md', '/md')).toBe(false)
  })

  it('leaves the pages themselves alone, the module already varies those', () => {
    expect(varies('/')).toBe(false)
    expect(varies('/tools')).toBe(false)
    expect(varies('/tools/claude-code')).toBe(false)
  })

  it('leaves single-representation documents alone', () => {
    expect(varies('/api/tools.json')).toBe(false)
    expect(varies('/openapi.json')).toBe(false)
    expect(varies('/llms.txt')).toBe(false)
    expect(varies('/.well-known/api-catalog')).toBe(false)
  })

  it('does not match a path that merely starts with the prefix', () => {
    expect(varies('/rawhide')).toBe(false)
  })
})

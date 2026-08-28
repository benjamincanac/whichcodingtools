import { describe, expect, it } from 'vitest'
import { API_BASE, API_VERSION, SUNSET_NOTICE_DAYS, isVersionedApiPath } from '#shared/api'

describe('the versioned API surface', () => {
  it('is a single path prefix, which is what the redirects and the docs point at', () => {
    expect(API_BASE).toBe('/api/v1')
    expect(API_VERSION).toBe('1')
    expect(API_BASE.endsWith(`/v${API_VERSION}`)).toBe(true)
  })

  it('gives enough notice between a Deprecation and the Sunset that follows it', () => {
    expect(SUNSET_NOTICE_DAYS).toBeGreaterThanOrEqual(90)
  })

  it('stamps the version on the versioned endpoints', () => {
    expect(isVersionedApiPath('/api/v1')).toBe(true)
    expect(isVersionedApiPath('/api/v1/tools.json')).toBe(true)
    expect(isVersionedApiPath('/api/v1/tools/claude-code.json')).toBe(true)
    expect(isVersionedApiPath('/api/v1/finder/parse')).toBe(true)
    expect(isVersionedApiPath('/api/v1/tools.json?x=1#y')).toBe(true)
  })

  it('leaves the internal endpoints unversioned, since nothing is promised about them', () => {
    expect(isVersionedApiPath('/api/revalidate')).toBe(false)
    expect(isVersionedApiPath('/api/__sitemap__/urls')).toBe(false)
    expect(isVersionedApiPath('/api/content/list')).toBe(false)
  })

  it('does not claim the paths the old unversioned API redirects from', () => {
    expect(isVersionedApiPath('/api/tools.json')).toBe(false)
    expect(isVersionedApiPath('/api/compare.json')).toBe(false)
  })

  it('does not match a path that merely starts with the prefix', () => {
    expect(isVersionedApiPath('/api/v10/tools.json')).toBe(false)
    expect(isVersionedApiPath('/api/v1x')).toBe(false)
    expect(isVersionedApiPath('/developers')).toBe(false)
  })
})

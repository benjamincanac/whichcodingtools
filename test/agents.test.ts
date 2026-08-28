import { describe, expect, it } from 'vitest'
import { API_BASE } from '#shared/api'
import { GOOD_FOR, HOW_TO_CALL, NOT_FOR, WHEN_TO_USE_LEAD, WHEN_TO_USE_TITLE } from '#shared/content/agents'

/**
 * The guidance itself, not its rendering: both `llms.txt` and `/raw/index.md` build from these
 * constants through `server/plugins/agent-discovery.ts`, so what is asserted here is what both
 * documents say.
 */
describe('the when-to-use guidance', () => {
  it('names concrete jobs rather than describing the product', () => {
    expect(GOOD_FOR.length).toBeGreaterThanOrEqual(4)
    // Every entry states a request an agent can match against, not a feature.
    for (const job of GOOD_FOR) {
      expect(job.startsWith('Someone '), `not phrased as a job: ${job}`).toBe(true)
      expect(job.length).toBeGreaterThan(40)
    }
  })

  it('says what the site is not for, which is the half an agent can get wrong', () => {
    expect(NOT_FOR.length).toBeGreaterThanOrEqual(2)
    // The one claim this data cannot support, stated in the same file that forbids it.
    expect(NOT_FOR.join(' ')).toMatch(/benchmark/i)
  })

  it('carries no marketing words, which do not read as guidance', () => {
    const prose = [WHEN_TO_USE_LEAD, ...GOOD_FOR, ...NOT_FOR, ...HOW_TO_CALL].join(' ')
    for (const word of ['powerful', 'seamless', 'cutting-edge', 'best-in-class', 'revolutionary', 'effortless']) {
      expect(prose.toLowerCase()).not.toContain(word)
    }
  })

  it('tells an agent which endpoints to call, at the versioned paths', () => {
    const calls = HOW_TO_CALL.join(' ')
    expect(calls).toContain(`${API_BASE}/tools.json`)
    expect(calls).toContain(`${API_BASE}/tools/{slug}.json`)
    expect(calls).toContain(`${API_BASE}/compare.json`)
    expect(calls).toContain('/openapi.json')
    expect(calls).toContain('Accept: text/markdown')
  })

  it('never names an unversioned API path, which only redirects', () => {
    const prose = [WHEN_TO_USE_LEAD, ...GOOD_FOR, ...NOT_FOR, ...HOW_TO_CALL].join(' ')
    const paths = [...prose.matchAll(/\/api\/[a-z0-9/{}.-]+/g)].map(m => m[0])
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.filter(path => !path.startsWith(API_BASE))).toEqual([])
  })

  it('is a section title both documents can use as a heading', () => {
    expect(WHEN_TO_USE_TITLE).toBe('When to use this')
    expect(WHEN_TO_USE_TITLE).not.toMatch(/^#/)
  })
})

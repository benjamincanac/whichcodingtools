import { describe, expect, it } from 'vitest'
import { API_BASE } from '#shared/api'
import { DEVELOPERS_INDEX, DISCOVERY, ENDPOINTS } from '#shared/content/developers'
import { renderDevelopers } from '../server/markdown/developers'

const page = renderDevelopers()

describe('the /developers markdown twin', () => {
  it('opens on the same title and description the Vue page uses', () => {
    expect(page.title).toBe(DEVELOPERS_INDEX.title)
    expect(page.description).toBe(DEVELOPERS_INDEX.description)
    expect(page.markdown.startsWith(`# ${DEVELOPERS_INDEX.title}`)).toBe(true)
  })

  it('has a heading structure rather than one heading and a wall of text', () => {
    const headings = [...page.markdown.matchAll(/^(#{1,3}) (.+)$/gm)].map(m => [m[1]!.length, m[2]!] as const)
    expect(headings.filter(([level]) => level === 1)).toHaveLength(1)
    expect(headings.filter(([level]) => level === 2).length).toBeGreaterThanOrEqual(5)
    expect(headings.map(([, text]) => text)).toEqual(expect.arrayContaining([
      'Endpoints',
      'Versioning and deprecation',
      'Markdown for agents',
      'Machine-readable index',
      'The data'
    ]))
  })

  it('lists every endpoint, all of them under the versioned prefix', () => {
    for (const endpoint of ENDPOINTS) {
      expect(endpoint.path.startsWith(API_BASE), `${endpoint.path} is not versioned`).toBe(true)
      expect(page.markdown).toContain(endpoint.path)
      expect(page.markdown).toContain(endpoint.method)
    }
  })

  it('states the deprecation signal an agent has to watch for', () => {
    expect(page.markdown).toContain('Deprecation')
    expect(page.markdown).toContain('Sunset')
    expect(page.markdown).toContain('successor-version')
  })

  it('links every discovery document', () => {
    for (const doc of DISCOVERY) {
      expect(page.markdown).toContain(`(${doc.href})`)
    }
  })

  it('renders without the content layer, so the page cannot 500 on a data problem', () => {
    // `renderDevelopers()` takes no MarkdownContext. That is the assertion: it type-checks and
    // runs here with no tools loaded at all.
    expect(page.markdown.length).toBeGreaterThan(500)
  })
})

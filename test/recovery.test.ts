import { describe, expect, it } from 'vitest'
import { API_BASE } from '#shared/api'
import { RECOVERY_DOCUMENTS, RECOVERY_PAGES } from '#shared/content/recovery'
import { renderPage } from '../server/markdown/render'
import { markdownContext } from './content'

const links = [...RECOVERY_PAGES, ...RECOVERY_DOCUMENTS]

describe('where the error page points next', () => {
  it('points at this site only, never off it', () => {
    for (const link of links) {
      expect(link.to.startsWith('/'), `${link.to} is not site-relative`).toBe(true)
    }
  })

  it('lists nothing twice', () => {
    expect(new Set(links.map(link => link.to)).size).toBe(links.length)
  })

  it('sends a person to pages that render', async () => {
    // `renderPage()` is what decides a route is a page: it backs every `/raw/**.md` twin, so a
    // route it declines is a route the site 404s. Cheaper and stricter than listing the pages
    // again here, and it covers the static routes `sitePages()` deliberately leaves out.
    const ctx = await markdownContext()
    for (const link of RECOVERY_PAGES.filter(l => !l.external)) {
      expect(renderPage(ctx, link.to), `${link.to} is not a page this site serves`).toBeTruthy()
    }
  })

  it('sends an agent to the documents that enumerate the whole site', () => {
    // Every one of these is registered in `nuxt.config.ts`: `/llms.txt` and `/sitemap.md` by
    // nuxt-agent-discovery, `/openapi.json` by `server/routes`, the API by `server/api/v1`.
    expect(RECOVERY_DOCUMENTS.map(link => link.to)).toEqual([
      '/llms.txt',
      '/sitemap.md',
      '/openapi.json',
      `${API_BASE}/tools.json`
    ])
    expect(RECOVERY_DOCUMENTS.every(link => link.external)).toBe(true)
  })

  it('never points at an unversioned API path, which only redirects', () => {
    for (const link of links) {
      expect(link.to.startsWith('/api/') && !link.to.startsWith(API_BASE), `${link.to} is unversioned`).toBe(false)
    }
  })
})

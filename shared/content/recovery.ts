/**
 * Where an error page points next.
 *
 * `nuxt-agent-discovery` already builds this list for the Markdown error body out of the
 * discovery registry, so an agent hitting a 404 lands on something real. A browser gets the Vue
 * error page instead, which until now offered one button back to the homepage. Same idea, split
 * in two: the places a person would look, then the documents that enumerate the whole site.
 */

export interface RecoveryLink {
  label: string
  to: string
  /** Absolute URLs and machine-readable documents open in a new tab. */
  external?: boolean
}

export const RECOVERY_PAGES: RecoveryLink[] = [
  { label: 'Every tool', to: '/tools' },
  { label: 'Developers', to: '/developers' },
  { label: 'Compare two tools', to: '/compare' },
  { label: 'Sitemap', to: '/sitemap.xml', external: true }
]

/** The same entry points the Markdown error body lists, for anyone reading this page as HTML. */
export const RECOVERY_DOCUMENTS: RecoveryLink[] = [
  { label: 'llms.txt', to: '/llms.txt', external: true },
  { label: 'sitemap.md', to: '/sitemap.md', external: true },
  { label: 'openapi.json', to: '/openapi.json', external: true },
  { label: 'tools.json', to: '/api/v1/tools.json', external: true }
]

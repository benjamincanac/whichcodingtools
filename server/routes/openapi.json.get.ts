import { agentDiscoveryOpenApi, getAgentSiteUrl } from '#agent-discovery'

/**
 * `/openapi.json`, the machine-readable description of this site's API surface.
 *
 * Static apart from the origin, so nothing here reads the content layer. The agent surfaces are
 * generated from the route config by the module, the JSON endpoints come from `siteOpenApi()`.
 *
 * `paths` goes to the module so it claims this site's operation ids before deriving its own.
 * Without it the two halves name operations in ignorance of each other, and `/tools` (a page)
 * and `/api/tools.json` both land on `getTools`.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/openapi+json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return siteOpenApi(getAgentSiteUrl(event), agentDiscoveryOpenApi(event, { paths: apiPaths() }))
})

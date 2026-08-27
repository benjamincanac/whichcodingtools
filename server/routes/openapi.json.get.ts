import { agentDiscoveryOpenApi, getAgentSiteUrl } from '#agent-discovery'

/**
 * `/openapi.json`, the machine-readable description of this site's API surface.
 *
 * Static apart from the origin, so nothing here reads the content layer. The agent surfaces are
 * generated from the route config by the module, the JSON endpoints come from `siteOpenApi()`.
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/openapi+json; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return siteOpenApi(getAgentSiteUrl(event), agentDiscoveryOpenApi(event))
})

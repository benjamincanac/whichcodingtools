import { API_VERSION, isVersionedApiPath } from '#shared/api'

/**
 * `API-Version` on every response from the versioned API.
 *
 * The version is in the URL already, so this is redundant for a client that built the URL and
 * load-bearing for one that did not: a response handed on, cached or logged carries which
 * contract produced it. It is also where the `Deprecation` and `Sunset` pair would go, so the
 * header set an agent has to watch is the one it is already reading.
 */
export default defineEventHandler((event) => {
  if (!isVersionedApiPath(event.path)) return

  setResponseHeader(event, 'API-Version', API_VERSION)
})

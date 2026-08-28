/**
 * The version the JSON API is served at, and how a change to it is announced.
 *
 * In `shared/` rather than `server/` because two places have to agree: the middleware that
 * stamps the header and the OpenAPI document that publishes the policy.
 *
 * The whole public surface lives under `/api/v1`. An addition (a new field, a new endpoint) is
 * not a new version: a client that reads the fields it knows keeps working, which is the only
 * compatibility promise worth making about a document that grows a column whenever the schema
 * does. Removing or renaming a field, or changing what one means, is what `v2` would be for.
 *
 * Until that happens `/api/v1` carries no deprecation headers at all, and that absence is the
 * signal that it is current. When it is superseded every response gains an RFC 9745
 * `Deprecation` date, then an RFC 8594 `Sunset` at least `SUNSET_NOTICE_DAYS` later, and a
 * `Link` header naming the successor with `rel="successor-version"`. An agent can therefore
 * decide whether to keep integrating from the response alone, without reading the docs.
 *
 * `/api/content/**` is not part of this. It is comark-content's own handler mounted for
 * debugging, it answers documents rather than records, and it is documented as unversioned.
 */

export const API_VERSION = '1'

/** Where the current version lives. Every published link points here. */
export const API_BASE = '/api/v1'

/** The minimum notice between a `Deprecation` date and the `Sunset` that follows it. */
export const SUNSET_NOTICE_DAYS = 180

/**
 * True for the versioned surface, which is where `API-Version` is asserted.
 *
 * Deliberately not every `/api/` path: the push webhook and the sitemap source are internal, and
 * stamping them with a version would claim a stability promise this site does not make.
 */
export function isVersionedApiPath(path: string): boolean {
  const pathname = path.split('?')[0]!.split('#')[0]!
  return pathname === API_BASE || pathname.startsWith(`${API_BASE}/`)
}

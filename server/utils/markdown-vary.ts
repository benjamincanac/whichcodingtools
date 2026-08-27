/**
 * The paths whose response is a Markdown representation of a page that also has an HTML one.
 *
 * `nuxt-agent-discovery` sets `Vary: Accept, User-Agent` on every negotiated page, but not on
 * the twins themselves: a `/raw/**.md` URL answers Markdown to everyone, so nothing about that
 * response depends on the request. That reasoning holds for the URL and breaks for the chain.
 * In production a negotiated page is a CDN 307 to its twin, so a client that asked for Markdown
 * on `/tools` ends on `/raw/tools.md`, and the response it actually keeps carries no `Vary` at
 * all. acceptmarkdown.com reads that last hop, and so does any cache sitting in front of it.
 *
 * The twins and nothing else, for the same reason. A document no page redirects to has one
 * representation and one hop, `/sitemap.md` included, so a `Vary` on it buys nothing and splits
 * its cache entry per User-Agent, which on a site read mostly by bots is every request.
 *
 * `rawPrefix` is read from the module rather than written here: it is configurable, and a copy
 * of it silently stops matching the day it changes.
 */
export function isMarkdownRepresentation(path: string, rawPrefix: string): boolean {
  const pathname = path.split('?')[0]!.split('#')[0]!
  return pathname.startsWith(`${rawPrefix}/`)
}

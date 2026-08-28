import { API_BASE, API_VERSION, SUNSET_NOTICE_DAYS } from '../api'

/**
 * Everything `/developers` says, in one place, because the page has two renderings: the Vue page
 * and its markdown twin under `/raw/developers.md`. A fact stated in only one of them is a fact
 * an agent and a person can disagree about.
 *
 * Prose, not data. Edit it freely.
 */

export const DEVELOPERS_INDEX = {
  title: 'Developers',
  description: `Everything this site publishes for machines: a versioned JSON API, a markdown twin of every page, and the schema the data is validated against. No key, no signup.`
}

export interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  summary: string
}

/** The versioned surface. Same list the OpenAPI document describes, in the same order. */
export const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: `${API_BASE}/tools.json`, summary: 'Every tool, with the computed fields the site renders from.' },
  { method: 'GET', path: `${API_BASE}/tools/{slug}.json`, summary: 'One tool. Old slugs are not resolved here, `aliases` on the current record carries them.' },
  { method: 'GET', path: `${API_BASE}/compare.json`, summary: 'The comparisons worth listing, and the URL pattern for the ones that are not.' },
  { method: 'POST', path: `${API_BASE}/finder/parse`, summary: 'Turns one sentence into finder filters. The only endpoint that calls a model.' }
]

/** Documents that describe the site rather than the data. */
export const DISCOVERY = [
  { href: '/openapi.json', label: 'openapi.json', summary: 'OpenAPI 3.1 for every endpoint above and every page below.' },
  { href: '/llms.txt', label: 'llms.txt', summary: 'The index, following the llms.txt convention.' },
  { href: '/llms-full.txt', label: 'llms-full.txt', summary: 'Every page as one document.' },
  { href: '/sitemap.md', label: 'sitemap.md', summary: 'Markdown index of every page, grouped.' },
  { href: '/sitemap.xml', label: 'sitemap.xml', summary: 'The same pages for crawlers.' },
  { href: '/.well-known/api-catalog', label: '.well-known/api-catalog', summary: 'RFC 9727 linkset pointing at all of the above.' }
]

export const INTRO = `There is no API key and no signup. Every endpoint is a public GET, cached for an hour at the edge and purged when the data behind it changes. The only endpoint that is not free to call is the finder, which runs a model, so it is rate limited by the platform rather than by us.

The data is CC BY 4.0: use it anywhere, including commercially, as long as you credit whichcoding.tools and link back.`

export const VERSIONING = `The whole public surface lives under \`${API_BASE}\`, and every response carries \`API-Version: ${API_VERSION}\`.

Adding a field or an endpoint is not a new version. The schema grows whenever a tool needs a fact it could not previously state, and a client that reads the fields it knows keeps working. Removing a field, renaming one, or changing what one means is what \`v2\` would be for.

While a version is current it carries no deprecation headers at all, and that absence is the signal. When one is superseded every response from it gains a \`Deprecation\` date (RFC 9745), then a \`Sunset\` date (RFC 8594) at least ${SUNSET_NOTICE_DAYS} days later, and a \`Link\` header pointing at the replacement with \`rel="successor-version"\`. Nothing is removed before the sunset date. An agent can decide whether to keep integrating from the response headers alone.`

export const MARKDOWN = `Every page on this site has a markdown twin. Append \`.md\` to its URL, send \`Accept: text/markdown\`, or read it under \`/raw\`. A known agent user agent gets markdown without asking.

The three are the same document. \`/tools/claude-code\`, \`/tools/claude-code.md\` and \`/raw/tools/claude-code.md\` differ only in how you asked.`

export const DATA = `One YAML file per tool in \`content/tools\`, validated against a zod schema on every commit. Every figure carries the vendor URL it came from and the date a person read that page, and prices are additionally checked against a text capture of the page so a number cannot be typed in by hand.

The schema is published in \`openapi.json\` as the \`Tool\` component, generated from the same definition that validates the files, so it cannot drift from what the API returns.`

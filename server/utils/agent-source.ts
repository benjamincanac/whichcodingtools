import { LAYERS, PLANS, optionLabel } from '#shared/enums'
import {
  COMPARE_INDEX,
  TOOLS_INDEX,
  layerPageTitle,
  pairPageDescription,
  pairPageTitle,
  planPageTitle,
  toolPageTitle
} from '#shared/content/pages'
import { pairSlug, parsePair } from '#shared/utils/compare'
import { sitePages } from '#shared/utils/routes'
import { findByAlias } from '#shared/utils/tools'
import { absolutizeMarkdownLinks, defineAgentContentSource, getAgentSiteUrl } from '#agent-discovery'
import type { AgentListEntry, AgentSectionSelector } from 'nuxt-agent-discovery'
import type { H3Event } from 'h3'
import type { MarkdownContext } from '../markdown/context'
import { renderPage } from '../markdown/render'

/**
 * The content source behind `/raw/**.md`, `/sitemap.md` and `llms.txt`.
 *
 * There is no markdown in this repository to serve: `content/tools` is pure YAML data and four
 * of the seven page types are computed from it. So every "document" is rendered on the way out
 * by `server/markdown/`, which is also what makes a tool page and its twin impossible to drift.
 */

async function context(): Promise<MarkdownContext> {
  const { tools, bySlug } = await loadToolsIndexed()
  return {
    tools,
    bySlug,
    yamlUrl: slug => `https://github.com/${githubRepo()}/blob/${contentBranch()}/${contentDir()}/${slug}.yml`
  }
}

/**
 * What `llms.txt` and `sitemap.md` say instead of enumerating the comparisons.
 *
 * There are over five hundred of them and every one describes itself with the same sentence,
 * which is 128KB of boilerplate in the document a reader opens to find out what is here. The
 * URL pattern plus the pair list is the same reach in three lines. `## Optional` is the section
 * the llms.txt spec keeps for exactly this, content a reader under context pressure can skip.
 */
const COMPARE_LISTING = {
  section: 'Optional',
  description: 'Any two tools side by side. Build the URL as /compare/{a}-vs-{b} with the two slugs in alphabetical order, markdown at /raw/compare/{a}-vs-{b}.md. Over five hundred pairs, listed at /api/compare.json rather than here.'
}

/** The section label a route is grouped under in `llms.txt`. */
function section(route: string, ctx: MarkdownContext): string {
  const [, head, tail] = route.split('/')
  if (head === 'tools' && tail) {
    const layer = ctx.bySlug.get(tail)?.layer
    return layer ? `${optionLabel(LAYERS, layer)}s` : 'Tools'
  }
  if (head === 'layers') return 'Layers'
  if (head === 'plans') return 'Plans'
  if (head === 'compare') return COMPARE_LISTING.section
  return 'Pages'
}

/** Title and description without rendering the page, which `list()` must never do for 646 routes. */
function describe(route: string, ctx: MarkdownContext): { title: string, description?: string } | null {
  const [, head, tail] = route.split('/')
  switch (head) {
    case 'tools': {
      if (!tail) return TOOLS_INDEX
      const tool = ctx.bySlug.get(tail)
      return tool ? { title: toolPageTitle(tool), description: tool.description } : null
    }
    case 'compare': {
      if (!tail) return COMPARE_INDEX
      const pair = parsePair(tail)?.map(slug => ctx.bySlug.get(slug))
      const [a, b] = pair ?? []
      return a && b ? { title: pairPageTitle(a, b), description: pairPageDescription(a, b) } : null
    }
    case 'layers': {
      const layer = LAYERS.find(l => l.value === tail)
      return layer ? { title: layerPageTitle(layer), description: layer.description } : null
    }
    case 'plans': {
      const plan = PLANS.find(p => p.value === tail)
      return plan ? { title: planPageTitle(plan), description: plan.description } : null
    }
    default:
      return null
  }
}

export default defineAgentContentSource({
  /**
   * The set `/llms-full.txt` is built from, and its only caller.
   *
   * Deliberately narrower than `list()`: `relatedPairs()` produces over five hundred
   * comparisons, and concatenating them would make the full document tens of megabytes of
   * mostly repeated tables. Every one still renders through `get()` on demand.
   */
  async routes() {
    const ctx = await context()
    return sitePages(ctx.tools, ctx.bySlug).map(page => page.route).filter(route => !route.startsWith('/compare/'))
  },

  /**
   * Everything `sitemap.md` and `llms.txt` advertise, which is what `sitemap.xml` advertises,
   * so the three cannot disagree about which pages exist.
   *
   * `null` for any selector is load-bearing, not a stub. The `llms-full.txt` hook resolves each
   * declared `llms.sections` entry through here first and only falls back to `routes()` when
   * none of them resolve. This site declares one section of hand-written links, and `nuxt-llms`
   * unshifts a "Documentation Sets" one; declining both is what leaves `routes()` in charge.
   * Teach this a selector and the full document silently narrows to it.
   */
  async list(_event?: H3Event, selector?: AgentSectionSelector) {
    if (selector) return null

    const ctx = await context()
    const entries: AgentListEntry[] = [{ route: '/', title: 'whichcoding.tools', section: 'Pages' }]
    let compare: AgentListEntry | undefined

    for (const page of sitePages(ctx.tools, ctx.bySlug)) {
      // The pairs are the one page type nothing enumerates. See COMPARE_LISTING.
      if (page.route.startsWith('/compare/')) continue
      const described = describe(page.route, ctx)
      if (!described) continue
      const entry = { ...described, route: page.route, section: section(page.route, ctx), updatedAt: page.lastmod }
      if (page.route === '/compare') compare = { ...entry, description: COMPARE_LISTING.description }
      else entries.push(entry)
    }

    // Last, so the bridge pushes its group last: `## Optional` is only worth the bytes to a
    // reader that already has everything above it.
    if (compare) entries.push(compare)
    return entries
  },

  /**
   * `/` returns `null` so the module serves its own generated `/raw/index.md`, built from the
   * discovery registry. That keeps the resources block there in step with the `Link` header
   * instead of being a second hand-maintained list.
   */
  async get(route: string, event?: H3Event) {
    const page = renderPage(await context(), route)
    if (!page) return null
    return {
      ...page,
      // A document read detached from the site needs absolute links. Fenced blocks and inline
      // code spans are left alone, so the install commands survive.
      markdown: event ? absolutizeMarkdownLinks(page.markdown, getAgentSiteUrl(event)) : page.markdown
    }
  },

  /**
   * Mirrors the SSR 301 on the tool page, so a renamed tool's markdown twin lands on the new
   * slug instead of 404ing, and gives `/layers` and `/plans` a destination since neither has an
   * index page. The module answers 302 here where the HTML page answers 301.
   */
  async firstLeaf(route: string) {
    if (route === '/layers') return `/layers/${LAYERS[0].value}`
    if (route === '/plans') return `/plans/${PLANS[0].value}`

    // The reversed pair `renderPage` declined. The module answers 302 where the page answers 301.
    if (route.startsWith('/compare/')) {
      const param = route.slice('/compare/'.length)
      const pair = parsePair(param)
      if (!pair) return null
      const canonical = pairSlug(pair[0], pair[1])
      return canonical === param ? null : `/compare/${canonical}`
    }

    const slug = route.startsWith('/tools/') ? route.slice('/tools/'.length) : undefined
    if (!slug || slug.includes('/')) return null

    const { tools } = await loadToolsIndexed()
    const aliased = findByAlias(slug, tools)
    return aliased ? `/tools/${aliased.slug}` : null
  }
})

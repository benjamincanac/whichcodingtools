import { LAYERS, PLANS } from '#shared/enums'
import { pairSlug, parsePair } from '#shared/utils/compare'
import type { ToolRecord } from '#shared/types/tool'
import type { MarkdownContext, MarkdownPage } from './context'
import { renderCompareIndex, renderComparePage } from './compare'
import { renderDevelopers } from './developers'
import { renderLayerPage, renderPlanPage, renderToolsIndex } from './sections'
import { renderToolPage } from './tool'

/**
 * A site-relative route to its markdown, or `null` when the route names no page.
 *
 * `/` returns `null` on purpose: the agent module builds `/raw/index.md` from its own discovery
 * registry, so the resources block there cannot drift from the `Link` header.
 */
export function renderPage(ctx: MarkdownContext, route: string): MarkdownPage | null {
  const [, head, tail, extra] = route.split('/')
  // No page on this site is three segments deep, so anything that is cannot be one.
  if (extra !== undefined) return null

  switch (head) {
    case '':
      return null
    case 'tools':
      return tail ? toolPage(ctx, tail) : renderToolsIndex(ctx)
    case 'compare':
      return tail ? pairPage(ctx, tail) : renderCompareIndex(ctx)
    case 'layers':
      return sectionPage(LAYERS, tail, layer => renderLayerPage(ctx, layer))
    case 'plans':
      return sectionPage(PLANS, tail, plan => renderPlanPage(ctx, plan))
    // The one page that describes the site rather than the data, so it takes no context.
    case 'developers':
      return tail ? null : renderDevelopers()
    default:
      return null
  }
}

function toolPage(ctx: MarkdownContext, slug: string): MarkdownPage | null {
  const tool = ctx.bySlug.get(slug)
  return tool ? renderToolPage(ctx, tool) : null
}

/** Mirrors the page: `parsePair` rejects anything that is not exactly two slugs, so `a-vs-b-vs-c` 404s. */
function pairPage(ctx: MarkdownContext, param: string): MarkdownPage | null {
  const pair = parsePair(param)
  if (!pair) return null
  // A reversed pair is not a second document. Returning null here is what hands it to
  // `firstLeaf`, which redirects it, the same way the page answers 301.
  if (pairSlug(pair[0], pair[1]) !== param) return null
  const picked = pair.map(slug => ctx.bySlug.get(slug)).filter(Boolean) as ToolRecord[]
  return picked.length === 2 ? renderComparePage(ctx, picked as [ToolRecord, ToolRecord]) : null
}

function sectionPage<T extends { value: string, label: string }>(
  options: readonly T[],
  value: string | undefined,
  render: (option: T) => MarkdownPage
): MarkdownPage | null {
  const option = value ? options.find(o => o.value === value) : undefined
  return option ? render(option) : null
}

import { COMPARE_INDEX, pairIntro, pairPageDescription, pairPageTitle } from '#shared/content/pages'
import type { ToolRecord } from '#shared/types/tool'
import { compareTools } from '#shared/utils/compare'
import type { MarkdownContext, MarkdownPage } from './context'
import { blocks, bullets, compareCell, heading, lead, link, table } from './md'

/**
 * `compareTools()` already returns groups of rows of cells, which is a markdown table with the
 * labels moved into the first column. Nothing here re-derives a fact.
 */
function tables(ctx: MarkdownContext, tools: ToolRecord[]): string {
  return compareTools(tools, ctx.bySlug)
    .filter(group => group.rows.length)
    .map(group => blocks(
      heading(2, group.label),
      table(['', ...tools.map(t => t.name)], group.rows.map(row => [row.label, ...row.cells.map(compareCell)]))
    ))
    .join('\n\n')
}

export function renderComparePage(ctx: MarkdownContext, [a, b]: [ToolRecord, ToolRecord]): MarkdownPage {
  return {
    title: pairPageTitle(a, b),
    description: pairPageDescription(a, b),
    updatedAt: [a.freshness.verified_at, b.freshness.verified_at].sort().at(-1),
    markdown: blocks(
      lead(pairPageTitle(a, b), pairIntro(a, b)),
      tables(ctx, [a, b]),
      blocks(heading(2, 'Related'), `${link('Add more tools', `/compare?tools=${a.slug},${b.slug}`)}, up to four at a time.`)
    )
  }
}

/**
 * The picker has no markdown equivalent, so its twin explains the URL scheme instead. Every
 * pair worth advertising is in the sitemap; any other two slugs still render on demand.
 */
export function renderCompareIndex(ctx: MarkdownContext): MarkdownPage {
  return {
    title: COMPARE_INDEX.title,
    description: COMPARE_INDEX.description,
    markdown: blocks(
      lead(COMPARE_INDEX.title, COMPARE_INDEX.description),
      `Any two tools make a page at \`/compare/<a>-vs-<b>\`, with the slugs in alphabetical order. Up to four at a time at \`/compare?tools=<a>,<b>,<c>\`.`,
      `Every slug is listed on ${link('the tools index', '/tools')}, and ${link('/api/tools.json', '/api/tools.json')} carries the same data as one document.`,
      // Every tool, not a sample pair: the feature rows are the ones any tool in the
      // directory has, so a two-tool sample would advertise two features out of sixteen.
      blocks(
        heading(2, 'What a comparison covers'),
        bullets(compareTools(ctx.tools, ctx.bySlug).map(group => `**${group.label}**: ${group.rows.map(row => row.label).join(', ')}`))
      )
    )
  }
}

import { LAYERS, optionLabel } from '#shared/enums'
import { GRAVEYARD_GROUPS, GRAVEYARD_INDEX, GRAVEYARD_INTRO } from '#shared/content/pages'
import { graveyardEntries, graveyardGroups, graveyardHeadline, monthYear, type GraveyardEntry } from '#shared/utils/graveyard'
import type { MarkdownContext, MarkdownPage } from './context'
import { blocks, bullets, heading, lead, link, sentences } from './md'

/**
 * The twin of `/graveyard`. Same derivation, same sentences: `graveyardHeadline` is shared with
 * the page, so an agent reading this cannot be told a different story than a visitor.
 */

function entryLine(entry: GraveyardEntry): string {
  const tool = entry.tool
  // The chain is in the headline for a rename, but not for a tool that was renamed and then shut
  // down, whose headline is the shutdown. The page renders the chips either way, so without this
  // the twin would quietly say less than the page.
  const chain = entry.chain ?? []
  const lineage = entry.kind !== 'renamed' && chain.length > 1
    ? `Name history: ${chain.map(name => name.name).join(' \u2192 ')}`
    : undefined

  return sentences(
    `${link(tool.name, `/tools/${tool.slug}`)} (${optionLabel(LAYERS, tool.layer)}, ${tool.vendor}, ${monthYear(entry.date)})`,
    graveyardHeadline(entry),
    tool.description,
    lineage,
    entry.successor && `Successor: ${link(entry.successor.name, `/tools/${entry.successor.slug}`)}`
  )
}

export function renderGraveyard(ctx: MarkdownContext): MarkdownPage {
  const entries = graveyardEntries(ctx.tools, ctx.bySlug)
  const groups = graveyardGroups(entries)

  return {
    title: GRAVEYARD_INDEX.title,
    description: GRAVEYARD_INDEX.description,
    updatedAt: entries.map(e => e.tool.freshness.verified_at).sort().at(-1),
    markdown: blocks(
      lead(GRAVEYARD_INDEX.title, GRAVEYARD_INTRO),
      ...groups.map(group => blocks(
        heading(2, `${GRAVEYARD_GROUPS[group.kind].title} (${group.entries.length})`),
        GRAVEYARD_GROUPS[group.kind].description,
        bullets(group.entries.map(entryLine))
      )),
      !groups.length && 'No tool in the directory is discontinued or has been renamed.',
      blocks(
        heading(2, 'Related'),
        bullets([
          link('Every tool', '/tools'),
          `${link('/api/tools.json', '/api/tools.json')} carries \`status\`, \`sunset_at\`, \`successor\` and \`aliases\` on every record, which is everything this page is built from.`
        ])
      )
    )
  }
}

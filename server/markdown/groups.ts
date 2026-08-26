import type { ToolRecord } from '#shared/types/tool'
import { entryPriceLabel } from '#shared/utils/pricing'
import type { Block } from './md'
import { blocks, bullets, heading, link } from './md'

/**
 * The shape the four list pages share. `/layers/:layer`, `/plans/:plan` and `/tools` are all
 * "a heading, a sentence, then tools", and the wraps lists on a tool page are the same line
 * with what it costs on top instead of what it costs.
 */

/** One tool as a list entry: the link, what makes it worth listing here, then its description. */
export function toolLine(tool: ToolRecord, meta?: Block): string {
  return `${link(tool.name, `/tools/${tool.slug}`)}${meta ? ` (${meta})` : ''}: ${tool.description}`
}

/** The entry point price, which is what the card shows and what a list is usually scanned for. */
export function pricedToolLine(tool: ToolRecord): string {
  return toolLine(tool, entryPriceLabel(tool))
}

/**
 * A titled group of tools. The count rides in the heading the way it does on the page, so a
 * reader can tell a short section from a truncated one.
 */
export function toolGroup(level: 2 | 3, title: string, description: Block, lines: string[]): string {
  return blocks(heading(level, `${title} (${lines.length})`), description, bullets(lines))
}

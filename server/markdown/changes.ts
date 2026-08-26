import { CHANGES_INDEX, CHANGES_INTRO } from '#shared/content/pages'
import { changeDate, changeTitle } from '#shared/utils/changelog'
import type { MarkdownContext, MarkdownPage } from './context'
import { blocks, bullets, code, heading, lead, link } from './md'

/**
 * The twin of `/changes`. The only page whose data is git rather than `content/tools`, so it is
 * the only one whose context can be empty: `renderPage` is synchronous and the history is a
 * network read, so the source loads it for this route alone.
 */
export function renderChanges(ctx: MarkdownContext): MarkdownPage {
  const changes = ctx.changes ?? []

  return {
    title: CHANGES_INDEX.title,
    description: CHANGES_INDEX.description,
    updatedAt: changes[0]?.date.slice(0, 10),
    markdown: blocks(
      lead(CHANGES_INDEX.title, CHANGES_INTRO),
      `Atom at ${link('/changes.xml', '/changes.xml')}, the same list as JSON at ${link('/api/changes.json', '/api/changes.json')}.`,
      changes.length
        ? changes.map(entry => blocks(
            heading(2, `${changeDate(entry.date)} — ${changeTitle(entry)}`),
            `${link(code(entry.sha.slice(0, 7)), entry.url)}`,
            entry.tools.map(tool => blocks(
              heading(3, link(tool.name, `/tools/${tool.slug}`)),
              bullets(tool.lines)
            )).join('\n\n')
          )).join('\n\n')
        : 'Nothing in the recent history of content/tools changed a value.'
    )
  }
}

import { CRAWLER_PAGE } from '#shared/content/crawler'
import type { MarkdownPage } from './context'
import { blocks, heading, lead, link } from './md'

/** The one static page with a twin: its prose lives in `shared/content/crawler.ts`, not here. */
export function renderCrawlerPage(): MarkdownPage {
  return {
    title: CRAWLER_PAGE.title,
    description: CRAWLER_PAGE.description,
    markdown: blocks(
      lead(CRAWLER_PAGE.title, CRAWLER_PAGE.description),
      ...CRAWLER_PAGE.sections.map(section => blocks(heading(2, section.title), ...section.paragraphs)),
      blocks(
        heading(2, CRAWLER_PAGE.contact.title),
        `${CRAWLER_PAGE.contact.text} ${link(CRAWLER_PAGE.contact.label, CRAWLER_PAGE.contact.href)}.`
      )
    )
  }
}

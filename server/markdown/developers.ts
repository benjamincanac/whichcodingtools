import { API_BASE } from '#shared/api'
import { DATA, DEVELOPERS_INDEX, DISCOVERY, ENDPOINTS, INTRO, MARKDOWN, VERSIONING } from '#shared/content/developers'
import type { MarkdownPage } from './context'
import { blocks, bullets, code, heading, lead, link, table } from './md'

/**
 * `/developers` as markdown.
 *
 * Reads the same constants the Vue page does, so the two cannot state different endpoints or a
 * different deprecation promise. Nothing here touches the content layer: the page describes the
 * API, not the data behind it, so it renders without loading a single tool.
 */
export function renderDevelopers(): MarkdownPage {
  return {
    title: DEVELOPERS_INDEX.title,
    description: DEVELOPERS_INDEX.description,
    markdown: blocks(
      lead(DEVELOPERS_INDEX.title, DEVELOPERS_INDEX.description),
      INTRO,

      heading(2, 'Endpoints'),
      table(
        ['', 'Endpoint', 'Returns'],
        ENDPOINTS.map(e => [e.method, code(e.path), e.summary])
      ),
      `Full request and response shapes, including the ${code('Tool')} schema, are in ${link('openapi.json', '/openapi.json')}.`,

      heading(2, 'Versioning and deprecation'),
      VERSIONING,

      heading(2, 'Markdown for agents'),
      MARKDOWN,

      heading(2, 'Machine-readable index'),
      bullets(DISCOVERY.map(d => `${link(d.label, d.href)}: ${d.summary}`)),

      heading(2, 'The data'),
      DATA,

      heading(2, 'Unversioned'),
      `${code('/api/content/list')} and ${code('/api/content/get/{slug}')} are comark-content's own handler, mounted for debugging. They answer documents rather than records, they are outside ${code(API_BASE)}, and they can change without notice. ${code('/api/revalidate')} is the push webhook and needs the shared secret.`
    )
  }
}

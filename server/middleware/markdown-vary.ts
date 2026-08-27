import { isMarkdownRepresentation } from '../utils/markdown-vary'

/**
 * `Vary: Accept, User-Agent` on the Markdown representations, matching what the module already
 * sets on the pages they are the twins of. See `isMarkdownRepresentation()` for why they need it.
 *
 * Same value as the module's `MARKDOWN_VARY`, written out rather than imported: the module only
 * exports its public API from the package root, and a header that has to match a constant across
 * a package boundary is worth one line of duplication.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return

  const { rawPrefix } = useRuntimeConfig(event).public.agentDiscovery
  if (!isMarkdownRepresentation(event.path, rawPrefix)) return

  setResponseHeader(event, 'Vary', 'Accept, User-Agent')
})

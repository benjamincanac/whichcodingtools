import { DATA_LICENSE } from '#shared/api'

/**
 * Every tool as one document.
 *
 * `?view=summary` returns the same records without the fields only a tool page renders. The
 * site's list pages ask for it, because they inline this whole document into their payload.
 * Anything else, including no query at all, is the full record: that is the contract
 * `/openapi.json` publishes and the one an API client gets by default.
 */
export default defineEventHandler(async (event) => {
  const summary = getQuery(event).view === 'summary'
  const tools = await loadTools()
  return {
    count: tools.length,
    generated_at: new Date().toISOString(),
    license: { spdx: DATA_LICENSE.spdx, url: DATA_LICENSE.url, attribution: DATA_LICENSE.attribution },
    view: summary ? 'summary' : 'full',
    tools: summary ? tools.map(toSummary) : tools
  }
})

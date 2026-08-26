/**
 * The changelog as data. Same list the page and the Atom feed read, so the three cannot
 * disagree about what changed.
 */
export default defineEventHandler(async () => {
  const changes = await loadChanges()
  return {
    count: changes.length,
    generated_at: new Date().toISOString(),
    note: 'Semantic changes only, derived from the YAML diff. A re-verification that changed no value is not an entry.',
    changes
  }
})

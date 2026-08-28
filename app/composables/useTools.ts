import { API_BASE } from '#shared/api'
import type { ToolRecord, ToolSummary } from '#shared/types/tool'

interface ToolsPayload<T> {
  count: number
  generated_at: string
  view: 'full' | 'summary'
  tools: T[]
}

/**
 * The whole corpus, fetched once from the JSON API and shared across pages.
 *
 * Summary by default: this document is inlined into the payload of every page that calls it,
 * and a list view reads about half of each record. A page that needs the other half fetches
 * the one tool it is about from `/api/v1/tools/<slug>.json`.
 */
export function useTools(): ReturnType<typeof toolsFor<ToolSummary>>
export function useTools(view: 'full'): ReturnType<typeof toolsFor<ToolRecord>>
export function useTools(view: 'full' | 'summary' = 'summary') {
  return toolsFor(view)
}

function toolsFor<T extends ToolSummary>(view: 'full' | 'summary') {
  const asyncData = useFetch<ToolsPayload<T>>(`${API_BASE}/tools.json`, {
    key: `tools:${view}`,
    query: view === 'summary' ? { view: 'summary' } : undefined,
    default: () => ({ count: 0, generated_at: '', view, tools: [] as T[] })
  })
  const { data, status, error } = asyncData

  const tools = computed(() => data.value?.tools ?? [])
  const bySlug = computed(() => new Map(tools.value.map(t => [t.slug, t])))

  /** `await ready` in a page that reads `tools` synchronously during setup. */
  return { tools, bySlug, status, error, generatedAt: computed(() => data.value?.generated_at), ready: asyncData }
}

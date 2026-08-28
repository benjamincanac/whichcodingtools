import { API_BASE } from '#shared/api'
import type { ToolRecord } from '#shared/types/tool'

interface ToolsPayload {
  count: number
  generated_at: string
  tools: ToolRecord[]
}

/** The whole corpus, fetched once from the static JSON API and shared across pages. */
export function useTools() {
  const asyncData = useFetch<ToolsPayload>(`${API_BASE}/tools.json`, {
    key: 'tools',
    default: () => ({ count: 0, generated_at: '', tools: [] })
  })
  const { data, status, error } = asyncData

  const tools = computed(() => data.value?.tools ?? [])
  const bySlug = computed(() => new Map(tools.value.map(t => [t.slug, t])))

  /** `await ready` in a page that reads `tools` synchronously during setup. */
  return { tools, bySlug, status, error, generatedAt: computed(() => data.value?.generated_at), ready: asyncData }
}

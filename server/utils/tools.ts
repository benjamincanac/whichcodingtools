import { ToolSchema, type Tool } from '#shared/schema'
import type { ToolRecord } from '#shared/types/tool'

let cache: Promise<ToolRecord[]> | undefined

async function load(): Promise<ToolRecord[]> {
  const files = await content.list('tools')
  const tools: Tool[] = files
    .map(file => ToolSchema.parse(file.data))
    .sort((a, b) => a.name.localeCompare(b.name))
  return toRecords(tools)
}

/** Every tool with computed fields. Cached for the life of the process, which is one build for the static site. */
export function loadTools() {
  if (!cache || import.meta.dev) {
    cache = load()
  }
  return cache
}

export async function loadTool(slug: string) {
  const tools = await loadTools()
  return tools.find(t => t.slug === slug)
}

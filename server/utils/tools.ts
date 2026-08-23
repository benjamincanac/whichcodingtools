import { ToolSchema, type Tool } from '#shared/schema'
import type { ToolRecord } from '#shared/types/tool'

let cache: { ref: string, records: Promise<ToolRecord[]> } | undefined

async function load(): Promise<ToolRecord[]> {
  const content = await getContent()
  const files = await content.list('tools')
  const tools: Tool[] = []
  for (const file of files) {
    const result = ToolSchema.safeParse(file.data)
    if (result.success) tools.push(result.data)
    else console.error(`[content] ${file.path} skipped: ${result.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join('; ')}`)
  }
  tools.sort((a, b) => a.name.localeCompare(b.name))
  return toRecords(tools)
}

/** Every tool with computed fields, cached per content ref. Dev reloads on every call so edits show up. */
export async function loadTools() {
  await getContent()
  const ref = contentRef()
  if (import.meta.dev || !cache || cache.ref !== ref) {
    cache = { ref, records: load() }
  }
  return cache.records
}

export async function loadTool(slug: string) {
  const tools = await loadTools()
  return tools.find(t => t.slug === slug)
}

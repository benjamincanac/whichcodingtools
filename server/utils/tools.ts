import { ToolSchema, type Tool } from '#shared/schema'
import type { ToolRecord } from '#shared/types/tool'

let cache: { ref: string, records: Promise<ToolRecord[]> } | undefined
let indexed: { tools: ToolRecord[], bySlug: Map<string, ToolRecord> } | undefined

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

/**
 * Tools plus the slug index, which almost every caller needs.
 *
 * Keyed on the identity of the array `loadTools()` returns rather than on the content ref:
 * that array is the same instance while the per-ref cache holds and a fresh one when the ref
 * advances or in dev, so the Map can never outlive the records it indexes.
 */
export async function loadToolsIndexed() {
  const tools = await loadTools()
  if (!indexed || indexed.tools !== tools) {
    indexed = { tools, bySlug: new Map(tools.map(t => [t.slug, t])) }
  }
  return indexed
}

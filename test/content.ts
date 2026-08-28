import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { ToolSchema } from '#shared/schema'
import { toRecords } from '#shared/utils/tools'
import type { ToolRecord } from '#shared/types/tool'
import type { MarkdownContext } from '../server/markdown/context'

const DIR = join(process.cwd(), 'content/tools')

/**
 * The real corpus, parsed the way the content layer parses it.
 *
 * A test that asserts the API describes the data has to read the data. `pnpm validate` already
 * guarantees every file here passes `ToolSchema`, so a parse failure is that script's job to
 * report, not this helper's.
 */
export async function loadRecords(): Promise<ToolRecord[]> {
  const files = (await readdir(DIR)).filter(name => name.endsWith('.yml'))
  const tools = await Promise.all(files.map(async (name) => {
    return ToolSchema.parse(parseYaml(await readFile(join(DIR, name), 'utf8')))
  }))
  return toRecords(tools)
}

/** The context every markdown renderer takes, built from the real corpus. */
export async function markdownContext(): Promise<MarkdownContext> {
  const tools = await loadRecords()
  return {
    tools,
    bySlug: new Map(tools.map(tool => [tool.slug, tool])),
    yamlUrl: slug => `https://github.com/benjamincanac/whichcodingtools/blob/main/content/tools/${slug}.yml`
  }
}

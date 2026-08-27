import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { ToolSchema } from '#shared/schema'
import { toRecords } from '#shared/utils/tools'
import type { ToolRecord } from '#shared/types/tool'

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

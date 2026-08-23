/**
 * Validates every file in content/tools against the zod schema, then runs
 * the cross-file checks JSON Schema can't express. Exits 1 on any issue.
 *
 *   pnpm validate
 */
import { readdir, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import spdxParse from 'spdx-expression-parse'
import { ToolSchema, type Tool } from '../shared/schema'

const DIR = join(process.cwd(), 'content/tools')

interface Issue {
  file: string
  path: string
  message: string
}

const issues: Issue[] = []
const tools = new Map<string, Tool>()
const fileOf = new Map<string, string>()

function issue(file: string, path: string, message: string) {
  issues.push({ file, path, message })
}

function checkSpdx(file: string, spdx: string) {
  if (spdx === 'proprietary') return
  try {
    spdxParse(spdx)
  } catch {
    issue(file, 'license.spdx', `"${spdx}" is not a valid SPDX expression (use "proprietary" for closed source)`)
  }
}

const files = (await readdir(DIR)).filter(f => ['.yml', '.yaml'].includes(extname(f))).sort()

for (const file of files) {
  const stem = basename(file, extname(file))
  let data: unknown
  try {
    data = parseYaml(await readFile(join(DIR, file), 'utf8'))
  } catch (error) {
    issue(file, '', `YAML parse error: ${(error as Error).message}`)
    continue
  }

  const result = ToolSchema.safeParse(data)
  if (!result.success) {
    for (const i of result.error.issues) {
      issue(file, i.path.join('.'), i.message)
    }
    continue
  }

  const tool = result.data
  if (tool.slug !== stem) issue(file, 'slug', `slug "${tool.slug}" must equal the file name "${stem}"`)
  if (tools.has(tool.slug)) issue(file, 'slug', `duplicate slug "${tool.slug}" (also in ${fileOf.get(tool.slug)})`)
  tools.set(tool.slug, tool)
  fileOf.set(tool.slug, file)
  checkSpdx(file, tool.license.spdx)
}

// Cross-file checks
const aliasOwner = new Map<string, string>()
for (const [slug, tool] of tools) {
  const file = fileOf.get(slug)!

  for (const alias of tool.aliases) {
    if (tools.has(alias.slug)) issue(file, 'aliases', `alias "${alias.slug}" collides with an existing tool`)
    if (aliasOwner.has(alias.slug) && aliasOwner.get(alias.slug) !== slug) {
      issue(file, 'aliases', `alias "${alias.slug}" is already claimed by ${aliasOwner.get(alias.slug)}`)
    }
    aliasOwner.set(alias.slug, slug)
  }

  if (tool.successor && !tools.has(tool.successor)) issue(file, 'successor', `unknown tool "${tool.successor}"`)

  if (tool.pricing.same_as) {
    const target = tools.get(tool.pricing.same_as)
    if (!target) issue(file, 'pricing.same_as', `unknown tool "${tool.pricing.same_as}"`)
    else if (!target.pricing.tiers) issue(file, 'pricing.same_as', `"${tool.pricing.same_as}" has no tiers of its own (same_as can't chain)`)
    else {
      const ids = new Set(target.pricing.tiers.map(t => t.id))
      tool.wraps.forEach((w, i) => {
        if (w.min_tier && !ids.has(w.min_tier)) issue(file, `wraps.${i}.min_tier`, `"${w.min_tier}" is not a tier of ${tool.pricing.same_as}`)
      })
    }
  }

  tool.wraps.forEach((w, i) => {
    if (w.tool === slug) issue(file, `wraps.${i}.tool`, 'a tool cannot wrap itself')
    else if (!tools.has(w.tool)) issue(file, `wraps.${i}.tool`, `unknown tool "${w.tool}"`)
  })
}

// Cycles in wraps
function hasCycle(start: string) {
  const stack = [[start, new Set<string>()]] as [string, Set<string>][]
  while (stack.length) {
    const [slug, seen] = stack.pop()!
    for (const w of tools.get(slug)?.wraps ?? []) {
      if (w.tool === start) return true
      if (!seen.has(w.tool)) stack.push([w.tool, new Set([...seen, w.tool])])
    }
  }
  return false
}
for (const [slug, tool] of tools) {
  if (tool.wraps.length && hasCycle(slug)) issue(fileOf.get(slug)!, 'wraps', 'wraps graph contains a cycle through this tool')
}

if (issues.length) {
  console.error(`\n${issues.length} issue${issues.length > 1 ? 's' : ''} in ${new Set(issues.map(i => i.file)).size} file(s)\n`)
  const width = Math.max(...issues.map(i => i.file.length))
  for (const i of issues) {
    console.error(`  ${i.file.padEnd(width)}  ${i.path ? `${i.path}: ` : ''}${i.message}`)
  }
  console.error('')
  process.exit(1)
}

console.log(`✓ ${files.length} tool${files.length === 1 ? '' : 's'} valid`)

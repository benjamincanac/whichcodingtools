import type { ToolAlias } from '../schema'
import type { ToolRecord } from '../types/tool'

/**
 * The graveyard, derived rather than maintained.
 *
 * Two things put a product here: `status: sunset`, and an `aliases` entry, which is a name that
 * stopped being used on a given date. Nothing else, and no hand-written list, so a tool joins
 * the page the day its YAML says so.
 *
 * The three kinds are not decoration. A shutdown, an announced end of support and a rename are
 * different events, and a page that renders them the same way is telling a visitor that Roo Code
 * closing and Codeium becoming Windsurf are the same thing.
 */
export type GraveyardKind = 'ending' | 'discontinued' | 'renamed'

export interface GraveyardName {
  slug: string
  name: string
  /** The day this name stopped being used. `undefined` on the name the tool goes by now. */
  until?: string
  note?: string
}

export interface GraveyardEntry {
  tool: ToolRecord
  kind: GraveyardKind
  /** The day the event happened: `sunset_at`, or the most recent name change. */
  date: string
  /** Whether `date` is still in the future, which only an announced end of support can be. */
  upcoming: boolean
  /** Where the users were pointed, when the file says. */
  successor?: ToolRecord
  /**
   * Every name the product has had, oldest first, ending at the one it uses now. Present
   * whenever it was ever renamed, so Codeium to Windsurf to Devin Desktop reads as one lineage
   * instead of two unrelated hops.
   */
  chain?: GraveyardName[]
}

export interface GraveyardGroup {
  kind: GraveyardKind
  entries: GraveyardEntry[]
}

/** "2025-07-23" -> "July 2025". The day is noise at this scale, the month is the story. */
export function monthYear(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function chainOf(tool: ToolRecord): GraveyardName[] | undefined {
  if (!tool.aliases.length) return undefined
  const past = [...tool.aliases]
    .sort((a: ToolAlias, b: ToolAlias) => a.until.localeCompare(b.until))
    .map(a => ({ slug: a.slug, name: a.name, until: a.until, note: a.note }))
  return [...past, { slug: tool.slug, name: tool.name }]
}

/**
 * One entry per tool, never two: a product that was renamed and then shut down is one story,
 * and its headline is the shutdown.
 */
export function graveyardEntries(tools: ToolRecord[], bySlug: Map<string, ToolRecord>, now = new Date()): GraveyardEntry[] {
  const today = now.toISOString().slice(0, 10)
  const entries: GraveyardEntry[] = []

  for (const tool of tools) {
    const chain = chainOf(tool)
    const renamedAt = chain?.at(-2)?.until

    if (tool.status === 'sunset') {
      // The schema requires `sunset_at` on a sunset tool, so the fallback only covers a record
      // that reached the runtime past validation.
      const date = tool.sunset_at ?? renamedAt ?? tool.freshness.verified_at
      const upcoming = date > today
      entries.push({
        tool,
        kind: upcoming ? 'ending' : 'discontinued',
        date,
        upcoming,
        successor: tool.successor ? bySlug.get(tool.successor) : undefined,
        chain
      })
      continue
    }

    if (renamedAt) {
      entries.push({ tool, kind: 'renamed', date: renamedAt, upcoming: false, chain })
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date) || a.tool.name.localeCompare(b.tool.name))
}

/** The order the page reads in: what is coming, what is gone, what only changed its name. */
export const GRAVEYARD_KINDS: GraveyardKind[] = ['ending', 'discontinued', 'renamed']

export function graveyardGroups(entries: GraveyardEntry[]): GraveyardGroup[] {
  return GRAVEYARD_KINDS
    .map(kind => ({ kind, entries: entries.filter(e => e.kind === kind) }))
    .filter(group => group.entries.length > 0)
}

/** The one-line verdict on an entry, the same sentence on the page and in the markdown twin. */
export function graveyardHeadline(entry: GraveyardEntry): string {
  const when = monthYear(entry.date)
  if (entry.kind === 'ending') {
    return `Support ends ${when}${entry.successor ? `, users are pointed at ${entry.successor.name}` : ''}.`
  }
  if (entry.kind === 'discontinued') {
    return `Discontinued in ${when}${entry.successor ? `, succeeded by ${entry.successor.name}` : ''}.`
  }
  const chain = entry.chain ?? []
  const former = chain.slice(0, -1).map(n => n.name)
  return `Renamed in ${when}: ${[...former, entry.tool.name].join(' → ')}.`
}

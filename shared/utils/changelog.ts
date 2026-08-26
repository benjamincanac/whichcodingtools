/** Presentation shared by `/changes`, its markdown twin and the Atom feed. */

export interface ChangeSummary {
  tools: { slug: string, name: string, lines: string[] }[]
}

/** The one line a feed reader shows in its list. */
export function changeTitle(entry: ChangeSummary): string {
  const lines = entry.tools.reduce((n, t) => n + t.lines.length, 0)
  if (entry.tools.length === 1) {
    const [tool] = entry.tools as [ChangeSummary['tools'][number]]
    return lines === 1 ? `${tool.name}: ${tool.lines[0]}` : `${tool.name}: ${lines} changes`
  }
  return `${lines} changes across ${entry.tools.length} tools`
}

/** "2026-08-26T09:14:00Z" -> "26 August 2026". */
export function changeDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

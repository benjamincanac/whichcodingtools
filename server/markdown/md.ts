import type { CompareCell } from '#shared/utils/compare'

/**
 * The markdown primitives every page renderer builds from.
 *
 * Deliberately not in `server/utils/`: Nitro auto-imports that directory, and `heading`,
 * `table`, `cell` and `link` are far too generic to become globals in every server file.
 */

/** A section that may not apply. `blocks()` drops the falsy ones. */
export type Block = string | false | null | undefined

/** Joins the parts that exist, so a conditional section reads as data rather than concatenation. */
export function blocks(...parts: Block[]): string {
  return parts.filter(Boolean).join('\n\n')
}

export function heading(level: 1 | 2 | 3, text: string): string {
  return `${'#'.repeat(level)} ${text}`
}

/** A page title and its one-line summary, the shape every document opens with. */
export function lead(title: string, description?: string): string {
  return blocks(heading(1, title), description && `> ${description}`)
}

export function bullets(items: Block[]): string {
  const lines = items.filter(Boolean) as string[]
  return lines.map(item => `- ${item}`).join('\n')
}

/** `- **Label**: value`, for the facts a `<dl>` carries on the page. */
export function definitions(entries: [string, Block][]): string {
  return bullets(entries.map(([label, value]) => value && `**${label}**: ${value}`))
}

/**
 * Joins parts into prose, closing each one that does not already end in punctuation. A cell
 * holds a value and its note, and "API list price Optional extra usage" reads as one sentence
 * that says nothing.
 */
export function sentences(...parts: Block[]): string {
  const kept = parts.filter(Boolean).map(part => String(part).trim()).filter(Boolean)
  return kept.map((part, index) => index < kept.length - 1 && !/[.!?]$/.test(part) ? `${part}.` : part).join(' ')
}

export function code(value: string): string {
  return `\`${value.replace(/`/g, '')}\``
}

export function link(label: string, href: string): string {
  return `[${label.replace(/([[\]])/g, '\\$1')}](${href})`
}

/**
 * One table cell. A `limits` array and a YAML block scalar both arrive with newlines in them,
 * and a pipe anywhere closes the cell early, so nothing reaches a table without passing here.
 */
function flatten(value: Block): string {
  return String(value ?? '').replace(/\s*\n+\s*/g, ' ').replace(/\|/g, '\\|').trim()
}

export function cell(value: Block): string {
  // The same placeholder the pricing table and the compare table already put in an empty cell.
  return flatten(value) || '—'
}

/**
 * A header keeps its blank, unlike a body cell: the compare table has no name for the column
 * holding the row labels, and a placeholder there would read as a value.
 */
export function table(headers: Block[], rows: Block[][]): string {
  return [
    `| ${headers.map(flatten).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(cell).join(' | ')} |`)
  ].join('\n')
}

/**
 * A compare cell as markdown. `ok` is left out on purpose: it drives an icon next to text that
 * already says the same thing, so rendering it would produce "Yes Yes".
 */
export function compareCell(value: CompareCell): string {
  const text = value.href ? link(value.text, value.href) : value.text
  return cell(value.detail ? `${text} (${value.detail})` : text)
}

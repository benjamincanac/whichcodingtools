import { execFileSync } from 'node:child_process'

export interface ChangelogEntry {
  sha: string
  date: string
  author: string
  subject: string
  changes: { slug: string, status: 'added' | 'modified' | 'removed' | 'renamed' }[]
}

const STATUS: Record<string, ChangelogEntry['changes'][number]['status']> = { A: 'added', M: 'modified', D: 'removed', R: 'renamed' }

/**
 * The changelog is the git history of content/tools. Needs a full clone:
 * set VERCEL_DEEP_CLONE=true on Vercel, fetch-depth: 0 in CI.
 */
export function readChangelog(): ChangelogEntry[] {
  let raw: string
  try {
    raw = execFileSync('git', ['log', '--date=short', '--format=%x00%H|%ad|%an|%s', '--name-status', '--', 'content/tools'], { encoding: 'utf8' })
  } catch {
    return []
  }
  return raw
    .split('\0')
    .filter(Boolean)
    .map((block) => {
      const [head, ...lines] = block.trim().split('\n')
      const [sha, date, author, ...subject] = head!.split('|')
      const changes = lines
        .map(line => line.trim().split(/\s+/))
        .filter(parts => parts.length >= 2 && parts[1]!.startsWith('content/tools/'))
        .map(parts => ({
          status: STATUS[parts[0]![0]!] ?? 'modified',
          slug: (parts[parts.length - 1] ?? '').replace(/^content\/tools\//, '').replace(/\.ya?ml$/, '')
        }))
      return { sha: sha!, date: date!, author: author!, subject: subject.join('|'), changes }
    })
    .filter(entry => entry.changes.length)
}

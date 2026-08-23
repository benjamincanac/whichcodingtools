import { execFileSync } from 'node:child_process'

export interface ChangelogEntry {
  sha: string
  date: string
  author: string
  subject: string
  changes: { slug: string, status: 'added' | 'modified' | 'removed' | 'renamed' }[]
}

type Status = ChangelogEntry['changes'][number]['status']
const GIT_STATUS: Record<string, Status> = { A: 'added', M: 'modified', D: 'removed', R: 'renamed' }
const API_STATUS: Record<string, Status> = { added: 'added', modified: 'modified', removed: 'removed', renamed: 'renamed' }
const MAX_COMMITS = 60

function slugOf(path: string) {
  return path.replace(/^content\/tools\//, '').replace(/\.ya?ml$/, '')
}

/** Local clone: `git log` over content/tools. */
function fromGit(): ChangelogEntry[] {
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
        .map(parts => ({ status: GIT_STATUS[parts[0]![0]!] ?? 'modified', slug: slugOf(parts[parts.length - 1]!) }))
      return { sha: sha!, date: date!, author: author!, subject: subject.join('|'), changes }
    })
    .filter(entry => entry.changes.length)
}

interface ApiCommit {
  sha: string
  commit: { message: string, author: { name: string, date: string } }
  files?: { filename: string, status: string, previous_filename?: string }[]
}

/** Production: the GitHub commits API, cached per content SHA. */
async function fromGitHub(ref: string): Promise<ChangelogEntry[]> {
  const storage = shaStorage(ref)
  const cached = await storage.getItem<ChangelogEntry[]>('changelog')
  if (cached) return cached

  const repo = githubRepo()
  const list = await githubApi<ApiCommit[]>(`/repos/${repo}/commits`, { sha: ref, path: contentDir(), per_page: MAX_COMMITS })
  const entries: ChangelogEntry[] = []
  for (const item of list) {
    const detail = await githubApi<ApiCommit>(`/repos/${repo}/commits/${item.sha}`)
    const changes = (detail.files ?? [])
      .filter(f => f.filename.startsWith(`${contentDir()}/`))
      .map(f => ({ status: API_STATUS[f.status] ?? 'modified', slug: slugOf(f.filename) }))
    if (!changes.length) continue
    entries.push({
      sha: item.sha,
      date: item.commit.author.date.slice(0, 10),
      author: item.commit.author.name,
      subject: item.commit.message.split('\n')[0]!,
      changes
    })
  }
  await storage.setItem('changelog', entries)
  return entries
}

export async function readChangelog(): Promise<ChangelogEntry[]> {
  if (!remoteContent()) return fromGit()
  await getContent()
  return fromGitHub(contentRef())
}

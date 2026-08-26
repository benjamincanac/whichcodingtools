import { parse as parseYaml } from 'yaml'
import { toolChanges, type ToolLike } from '#shared/utils/changes'

/**
 * The git history of `content/tools`, read at request time and turned into a changelog.
 *
 * It has to be request time rather than build time: `vercel.json` skips the build for
 * content-only commits, so a list assembled at build would never see the commits it is about.
 *
 * Cost is bounded by the caches. A blob is content at a commit, so it never changes and is kept
 * for a day; the assembled list is keyed by the head SHA of `content/tools`, so a warm instance
 * makes no GitHub calls at all until something lands.
 */

/** How far back to walk. Older than this is git's job, not a feed's. */
const HISTORY = 40
/** How many newsworthy commits to keep. A re-verification run can burn a lot of the window. */
const MAX_ENTRIES = 30

export interface ChangedTool {
  slug: string
  name: string
  lines: string[]
}

export interface ChangeCommit {
  sha: string
  /** ISO timestamp of the commit, which is the only date a feed entry can honestly carry. */
  date: string
  url: string
  tools: ChangedTool[]
}

interface CommitDetail {
  sha: string
  html_url: string
  commit?: { committer?: { date?: string }, author?: { date?: string } }
  parents?: { sha: string }[]
  files?: { filename: string, status: string, previous_filename?: string }[]
}

/** The HTTP status behind a failed `$fetch`, wherever ofetch hung it. */
function statusOf(error: unknown): number | undefined {
  const e = error as { status?: number, statusCode?: number, response?: { status?: number } }
  return e?.response?.status ?? e?.statusCode ?? e?.status
}

function slugOf(path: string) {
  return path.slice(`${contentDir()}/`.length).replace(/\.ya?ml$/, '')
}

/** One file as it stood at one commit. `undefined` when it did not exist there. */
async function blobAt(ref: string, path: string): Promise<ToolLike | undefined> {
  const key = `blob:${ref}:${path}`
  const cached = await changesStorage.getItem<string>(key)
  let text = cached ?? undefined

  if (text === undefined) {
    try {
      const file = await githubApi<{ content?: string, encoding?: string }>(`/repos/${githubRepo()}/contents/${path}`, { ref })
      text = file.content && file.encoding === 'base64' ? Buffer.from(file.content, 'base64').toString('utf8') : ''
    } catch (error) {
      // Only a 404 means the file was not there, and it is the normal answer for the parent of a
      // file added in this commit. Everything else has to propagate: a 403, a 429 or a 500 on one
      // side of a diff would otherwise be stored as an empty file for a day, and an empty side
      // reads as "added to the directory" or "removed from" it. A feed whose whole claim is that
      // it reports real changes must not invent one out of a rate limit.
      if (statusOf(error) !== 404) throw error
      text = ''
    }
    await changesStorage.setItem(key, text)
  }

  if (!text) return undefined
  try {
    return parseYaml(text) as ToolLike
  } catch {
    // A commit that predates a parser change can hold YAML this one rejects. It is history,
    // not an outage: skip the side that will not parse and let the other one speak.
    return undefined
  }
}

async function commitChanges(sha: string): Promise<ChangeCommit | undefined> {
  const detail = await githubApi<CommitDetail>(`/repos/${githubRepo()}/commits/${sha}`)
  const parent = detail.parents?.[0]?.sha
  const date = detail.commit?.committer?.date ?? detail.commit?.author?.date
  if (!date) return undefined

  const dir = `${contentDir()}/`
  const touched = (detail.files ?? []).filter(f => f.filename.startsWith(dir) && /\.ya?ml$/.test(f.filename))

  const tools: ChangedTool[] = []
  for (const file of touched) {
    // A rename is one file under two paths. Reading the parent at the new path answers 404 and
    // the change reads as an addition, which is exactly wrong for a directory that renames slugs.
    const parentPath = file.previous_filename ?? file.filename
    const [before, after] = await Promise.all([
      parent ? blobAt(parent, parentPath) : Promise.resolve(undefined),
      file.status === 'removed' ? Promise.resolve(undefined) : blobAt(sha, file.filename)
    ])
    const lines = toolChanges(before, after)
    if (!lines.length) continue
    const slug = slugOf(file.filename)
    tools.push({ slug, name: after?.name ?? before?.name ?? slug, lines })
  }

  // Every touched file said nothing, which is what a re-verification run looks like. That is the
  // absence of news, so it is not an entry.
  return tools.length ? { sha: detail.sha, date, url: detail.html_url, tools } : undefined
}

/** Newest first. Empty when the history cannot be read, so the page degrades instead of 500ing. */
export async function loadChanges(): Promise<ChangeCommit[]> {
  let head: string
  try {
    head = await resolveContentSha(contentBranch())
  } catch {
    return []
  }

  const key = `feed:${head}`
  const cached = await changesStorage.getItem<ChangeCommit[]>(key)
  if (cached) return cached

  try {
    const commits = await githubApi<{ sha: string }[]>(`/repos/${githubRepo()}/commits`, {
      sha: contentBranch(),
      path: contentDir(),
      per_page: HISTORY
    })

    const entries: ChangeCommit[] = []
    for (const commit of commits) {
      if (entries.length >= MAX_ENTRIES) break
      const entry = await commitChanges(commit.sha).catch((error) => {
        // One unreadable commit is a gap in the feed. Silently dropping it is fine, silently
        // dropping it without a line in the log is how a permanent gap goes unnoticed.
        console.error(`[changes] skipped ${commit.sha.slice(0, 7)}`, error)
        return undefined
      })
      if (entry) entries.push(entry)
    }

    await changesStorage.setItem(key, entries)
    return entries
  } catch (error) {
    console.error('[changes] history unavailable', error)
    return []
  }
}

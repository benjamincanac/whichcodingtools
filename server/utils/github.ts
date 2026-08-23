import { createHmac, timingSafeEqual } from 'node:crypto'

/** Read content from GitHub instead of disk: always on Vercel, or opt in with CONTENT_SOURCE=github. */
export function remoteContent() {
  return !import.meta.dev && (Boolean(process.env.VERCEL) || process.env.CONTENT_SOURCE === 'github')
}

export function githubRepo() {
  const { github } = useRuntimeConfig()
  const fromVercel = process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : undefined
  return github.repo || fromVercel || ''
}

export function githubToken() {
  return useRuntimeConfig().githubToken || process.env.GITHUB_TOKEN || undefined
}

/** The branch production reads. Content pushes skip redeploys, so this is read per request, not at build. */
export function contentBranch() {
  return process.env.VERCEL_GIT_COMMIT_REF || useRuntimeConfig().github.branch || 'main'
}

export function contentDir() {
  return useRuntimeConfig().github.contentDir.replace(/^\/+|\/+$/g, '')
}

export async function githubApi<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
  const token = githubToken()
  return $fetch<T>(`https://api.github.com${path}`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'whichcodingtools',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    query
  })
}

/**
 * Latest commit that touched the content directory on `branch`. Pinning reads to a SHA instead of
 * the branch name sidesteps the stale raw.githubusercontent.com CDN and makes every cache key immutable.
 */
export async function resolveContentSha(branch: string, opts: { refresh?: boolean } = {}): Promise<string> {
  if (import.meta.dev) return branch
  const key = `branch:${encodeURIComponent(branch)}:${encodeURIComponent(contentDir())}`
  if (!opts.refresh) {
    const cached = await refStorage.getItem<string>(key)
    if (cached) return cached
  }
  const commits = await githubApi<{ sha: string }[]>(`/repos/${githubRepo()}/commits`, { sha: branch, path: contentDir(), per_page: 1 })
  const sha = commits[0]?.sha
  if (!sha) throw createError({ statusCode: 404, statusMessage: `No content at ${branch}` })
  await refStorage.setItem(key, sha)
  return sha
}

/** GitHub's `X-Hub-Signature-256` check, constant time. */
export function verifyWebhook(secret: string, body: string, signature: string | undefined) {
  if (!signature?.startsWith('sha256=')) return false
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export interface PushPayload {
  ref?: string
  before?: string
  after?: string
  commits?: { added?: string[], modified?: string[], removed?: string[] }[]
  head_commit?: { id?: string }
}

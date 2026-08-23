import { connectGitHubCredentials } from '@vercel/connect/eve'

export const REPO = process.env.GITHUB_REPOSITORY || 'benjamincanac/whichcodingtools'
export const DEFAULT_BRANCH = 'main'
/** The Vercel Connect connector created by `eve add channel/github`. */
export const CONNECTOR = 'github/whichcodingtools'

const connect = connectGitHubCredentials(CONNECTOR)

/**
 * GitHub token for API calls and git over HTTPS. The Connect installation token
 * (the `whichcodingtools[bot]` GitHub App) when available, the personal token otherwise
 * (local runs without a Vercel session).
 */
export async function githubToken(): Promise<string> {
  try {
    const token = connect.installationToken
    const value = typeof token === 'function' ? await token() : token
    if (value) return value
  } catch (error) {
    console.warn('[agent] Connect installation token unavailable, falling back to NUXT_GITHUB_TOKEN:', error instanceof Error ? error.message : error)
  }
  const fallback = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (!fallback) throw new Error('No GitHub credentials: Vercel Connect is not reachable and NUXT_GITHUB_TOKEN is unset.')
  return fallback
}

/** `Basic` credentials for git over HTTPS, injected at the sandbox firewall so the token never enters the sandbox. */
export async function gitAuthorizationHeader() {
  return `Basic ${Buffer.from(`x-access-token:${await githubToken()}`).toString('base64')}`
}

export async function githubApi<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.github.com${path}`)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)
  const res = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${await githubToken()}`,
      'User-Agent': 'whichcodingtools-agent',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    throw new Error(`GitHub ${method} ${path} failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export interface SearchHit {
  number: number
  title: string
  html_url: string
  state: string
  draft?: boolean
  pull_request?: unknown
}

/** Open issues and PRs mentioning `terms` in the repo, for dedupe before writing. */
export async function findOpen(terms: string) {
  const q = `repo:${REPO} is:open ${terms}`
  const result = await githubApi<{ items: SearchHit[] }>('GET', '/search/issues', undefined, { q, per_page: '20' })
  return result.items.map(i => ({
    number: i.number,
    title: i.title,
    url: i.html_url,
    kind: i.pull_request ? 'pull_request' as const : 'issue' as const
  }))
}

export async function createDraftPullRequest(input: { branch: string, title: string, body: string }) {
  const pr = await githubApi<{ number: number, html_url: string }>('POST', `/repos/${REPO}/pulls`, {
    title: input.title,
    body: input.body,
    head: input.branch,
    base: DEFAULT_BRANCH,
    draft: true
  })
  return { number: pr.number, url: pr.html_url }
}

export async function createIssue(input: { title: string, body: string, labels?: string[] }) {
  const issue = await githubApi<{ number: number, html_url: string }>('POST', `/repos/${REPO}/issues`, {
    title: input.title,
    body: input.body,
    labels: input.labels ?? ['outdated']
  })
  return { number: issue.number, url: issue.html_url }
}

export const REPO = process.env.GITHUB_REPOSITORY || 'benjamincanac/whichcodingtools'
export const DEFAULT_BRANCH = 'main'

export function githubToken() {
  const token = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (!token) throw new Error('NUXT_GITHUB_TOKEN (or GITHUB_TOKEN) is required for the agent to reach GitHub.')
  return token
}

/** `Basic` credentials for git over HTTPS, injected at the sandbox firewall so the token never enters the sandbox. */
export function gitAuthorizationHeader() {
  return `Basic ${Buffer.from(`x-access-token:${githubToken()}`).toString('base64')}`
}

export async function githubApi<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.github.com${path}`)
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)
  const res = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${githubToken()}`,
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

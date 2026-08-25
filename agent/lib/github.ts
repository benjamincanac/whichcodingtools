import { connectGitHubCredentials } from '@vercel/connect/eve'

const HOME_REPO = 'benjamincanac/whichcodingtools'
const REPO_SHAPE = /^[\w.-]+\/[\w.-]+$/

/**
 * The repository the agent writes to. `GITHUB_REPOSITORY` is exported by every GitHub
 * Actions step, so it is an override that has to look like a repository, never a value
 * that silently retargets the writes. It also reaches a shell in the sandbox clone.
 */
function resolveRepo() {
  const override = process.env.GITHUB_REPOSITORY
  if (!override) return HOME_REPO
  if (!REPO_SHAPE.test(override)) {
    throw new Error(`GITHUB_REPOSITORY is not an owner/repo pair: ${JSON.stringify(override)}`)
  }
  if (override !== HOME_REPO) console.warn(`[agent] Writing to ${override} instead of ${HOME_REPO} (GITHUB_REPOSITORY).`)
  return override
}

export const REPO = resolveRepo()
export const DEFAULT_BRANCH = 'main'
/** The Vercel Connect connector created by `eve add channel/github`. */
export const CONNECTOR = 'github/whichcodingtools'

/** One connector for the whole agent. The channel takes this instance too. */
export const connect = connectGitHubCredentials(CONNECTOR)

/**
 * GitHub token for API calls and git over HTTPS: the Connect installation token, which is
 * the `whichcodingtools[bot]` GitHub App. The personal token is a local-run fallback only.
 * In production it would swap the bot for Benjamin's own, broader-scoped identity, so a
 * Connect outage fails the run instead.
 */
export async function githubToken(): Promise<string> {
  let reason = 'it returned nothing'
  try {
    const token = connect.installationToken
    const value = typeof token === 'function' ? await token() : token
    if (value) return value
  } catch (error) {
    reason = error instanceof Error ? error.message : String(error)
  }
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error(`Connect installation token unavailable in production (${reason}). Refusing to fall back to the personal token.`)
  }
  const fallback = process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (!fallback) throw new Error(`No GitHub credentials: Connect is not reachable (${reason}) and NUXT_GITHUB_TOKEN is unset.`)
  console.warn(`[agent] Connect installation token unavailable (${reason}), using NUXT_GITHUB_TOKEN.`)
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

/** GraphQL answers 200 with an `errors` array, so a failed query is not a failed request. */
async function githubGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${await githubToken()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'whichcodingtools-agent'
    },
    body: JSON.stringify({ query, variables })
  })
  if (!res.ok) throw new Error(`GitHub GraphQL failed: ${res.status} ${await res.text()}`)
  const payload = await res.json() as { data?: T, errors?: { message: string }[] }
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL failed: ${payload.errors.map(e => e.message).join('; ')}`)
  }
  if (!payload.data) throw new Error('GitHub GraphQL returned no data.')
  return payload.data
}

/**
 * Search qualifiers are stripped from model-supplied terms. A second `repo:` widens the
 * search rather than narrowing it, and a trailing `is:closed` would undo the scope this
 * function exists to enforce.
 */
function plainTerms(terms: string) {
  const stripped = terms.replace(/(^|\s)[a-z_-]+:\S*/gi, ' ').replace(/\s+/g, ' ').trim()
  if (!stripped) throw new Error(`No searchable words in ${JSON.stringify(terms)}. Pass plain words, like a tool slug.`)
  return stripped
}

/**
 * `headRefName` on the same response is why this is GraphQL. The REST search does not return
 * a pull request's branch, so it cost one extra call per open PR, on a function the skills
 * call before every write.
 */
const RELATED_QUERY = `query($q: String!, $first: Int!) {
  search(query: $q, type: ISSUE, first: $first) {
    issueCount
    nodes {
      __typename
      ... on Issue { number title url state }
      ... on PullRequest { number title url state headRefName }
    }
  }
}`

interface RelatedNode {
  __typename: string
  number: number
  title: string
  url: string
  state: string
  headRefName?: string
}

/**
 * Everything currently open, for a stocktake rather than a lookup. `findRelated` searches by
 * words, and `plainTerms` strips qualifiers on purpose, so there is no way to ask it for
 * "all of them". The repository is private, which rules out reading the REST API without a
 * credential, and the browser cannot reach github.com at all, so this is the list.
 */
const OPEN_QUERY = `query($q: String!, $first: Int!) {
  search(query: $q, type: ISSUE, first: $first) {
    issueCount
    nodes {
      __typename
      ... on Issue { number title url createdAt author { login } labels(first: 10) { nodes { name } } }
      ... on PullRequest { number title url createdAt author { login } headRefName isDraft }
    }
  }
}`

interface OpenNode {
  __typename: string
  number: number
  title: string
  url: string
  createdAt: string
  author: { login: string } | null
  labels?: { nodes: { name: string }[] }
  headRefName?: string
  isDraft?: boolean
}

export async function listOpen(kind: 'all' | 'issue' | 'pull_request') {
  const scope = kind === 'issue' ? ' is:issue' : kind === 'pull_request' ? ' is:pr' : ''
  const q = `repo:${REPO} is:open${scope} sort:updated-desc`
  const data = await githubGraphql<{ search: { issueCount: number, nodes: OpenNode[] } }>(OPEN_QUERY, { q, first: 100 })
  const results = data.search.nodes
    .filter(n => n.__typename === 'Issue' || n.__typename === 'PullRequest')
    .map((n) => {
      const pull = n.__typename === 'PullRequest'
      return {
        number: n.number,
        title: n.title,
        url: n.url,
        kind: pull ? 'pull_request' as const : 'issue' as const,
        created_at: n.createdAt.slice(0, 10),
        author: n.author?.login ?? 'ghost',
        labels: pull ? undefined : (n.labels?.nodes ?? []).map(l => l.name),
        branch: pull ? n.headRefName : undefined,
        draft: pull ? n.isDraft : undefined
      }
    })
  return { results, truncated: data.search.issueCount > results.length }
}

/**
 * Issues and PRs mentioning `terms`, closed ones included: "one issue per tool, ever" has to
 * see an issue a person already closed, otherwise a permanently unreadable page gets the same
 * issue filed again every morning. Open PRs carry their branch so the caller can push to it.
 */
export async function findRelated(terms: string) {
  const q = `repo:${REPO} ${plainTerms(terms)} sort:updated-desc`
  const data = await githubGraphql<{ search: { issueCount: number, nodes: RelatedNode[] } }>(RELATED_QUERY, { q, first: 50 })
  const results = data.search.nodes
    .filter(n => n.__typename === 'Issue' || n.__typename === 'PullRequest')
    .map((n) => {
      const kind = n.__typename === 'PullRequest' ? 'pull_request' as const : 'issue' as const
      return {
        number: n.number,
        title: n.title,
        url: n.url,
        kind,
        // Lowercased to read like the REST states the skills were written against. A merged
        // pull request says `merged`, which is more than `closed` said and still not `open`.
        state: n.state.toLowerCase(),
        branch: kind === 'pull_request' && n.state === 'OPEN' ? n.headRefName : undefined
      }
    })
  return { results, truncated: data.search.issueCount > results.length }
}

/** The only ref namespace the agent can move, and the only paths it can write. */
export const AGENT_BRANCH = /^agent\/[a-z0-9-]+$/
const WRITABLE_PATH = /^(content\/[\w.-]+(\/[\w.-]+)*|public\/logos\/[a-z0-9-]+\.png)$/

/**
 * Every ref the agent moves goes through here, so the branch policy is one line to change.
 * `action` reads into the sentence: "Refusing to write to ...", "Refusing to open a pull
 * request from ...".
 */
export function assertAgentBranch(branch: string, action: string) {
  if (!AGENT_BRANCH.test(branch)) {
    throw new Error(`Refusing to ${action} ${JSON.stringify(branch)}. Branches are named agent/<topic>-<date>.`)
  }
}

/**
 * Repo-relative, inside the two data directories, and no `..` anywhere: the tool reads these
 * straight out of the checkout, so a traversal would both read and commit outside the data.
 */
export function assertWritablePaths(paths: string[]) {
  const offLimits = paths.filter(p => p.includes('..') || !WRITABLE_PATH.test(p))
  if (offLimits.length) {
    throw new Error(`Refusing to write outside content/ and public/logos/: ${offLimits.join(', ')}.`)
  }
}

export interface PushedFile {
  path: string
  /** base64, so a PNG logo travels the same way a YAML file does. */
  content: string
}

/** GET that reads a missing ref as "not there yet" rather than an error. */
async function refSha(branch: string) {
  try {
    const ref = await githubApi<{ object: { sha: string } }>('GET', `/repos/${REPO}/git/ref/heads/${branch}`)
    return ref.object.sha
  } catch (error) {
    // githubApi builds this message a few lines up, so the shape is ours to rely on.
    if (error instanceof Error && error.message.includes('failed: 404')) return null
    throw error
  }
}

/**
 * Commit files onto an `agent/*` branch through the Git Data API, from the app runtime.
 * This is the only write path the agent has: the sandbox is brokered read-only credentials,
 * so the branch prefix and the path allow-list here are what actually enforce "never a push
 * to main, nothing outside content/ and public/logos/". The instructions restate it, they
 * do not implement it.
 */
export async function pushToAgentBranch(input: { branch: string, message: string, files: PushedFile[] }) {
  assertAgentBranch(input.branch, 'write to')
  assertWritablePaths(input.files.map(f => f.path))

  const head = await refSha(input.branch)
  const base = head ?? (await githubApi<{ object: { sha: string } }>('GET', `/repos/${REPO}/git/ref/heads/${DEFAULT_BRANCH}`)).object.sha
  const baseCommit = await githubApi<{ tree: { sha: string } }>('GET', `/repos/${REPO}/git/commits/${base}`)

  const tree = await Promise.all(input.files.map(async (file) => {
    const blob = await githubApi<{ sha: string }>('POST', `/repos/${REPO}/git/blobs`, { content: file.content, encoding: 'base64' })
    return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha }
  }))
  const newTree = await githubApi<{ sha: string }>('POST', `/repos/${REPO}/git/trees`, { base_tree: baseCommit.tree.sha, tree })
  const commit = await githubApi<{ sha: string }>('POST', `/repos/${REPO}/git/commits`, {
    message: input.message,
    tree: newTree.sha,
    parents: [base]
  })

  if (head) {
    // Fast-forward only. The agent adds commits to its branch, it never rewrites one.
    await githubApi('PATCH', `/repos/${REPO}/git/refs/heads/${input.branch}`, { sha: commit.sha, force: false })
  } else {
    await githubApi('POST', `/repos/${REPO}/git/refs`, { ref: `refs/heads/${input.branch}`, sha: commit.sha })
  }
  return { branch: input.branch, commit: commit.sha, created: head === null, files: input.files.map(f => f.path) }
}

export async function createPullRequest(input: { branch: string, title: string, body: string }) {
  assertAgentBranch(input.branch, 'open a pull request from')
  const pr = await githubApi<{ number: number, html_url: string }>('POST', `/repos/${REPO}/pulls`, {
    title: input.title,
    body: input.body,
    head: input.branch,
    base: DEFAULT_BRANCH
  })
  return { number: pr.number, url: pr.html_url }
}

/** Logins the agent's own writes show up under (Connect App in production, PAT fallback is not self). */
const SELF_LOGINS = new Set(['whichcodingtools', 'whichcodingtools[bot]'])

/** Whether a comment or an issue is the agent's own work. */
export function isAgentLogin(login: string) {
  return SELF_LOGINS.has(login.toLowerCase())
}

/**
 * Close an issue the agent opened itself, with a comment stating the evidence.
 * Refuses issues opened by anyone else and pull requests: those belong to people.
 */
export async function closeOwnIssue(number: number, comment: string) {
  const issue = await githubApi<{ state: string, user: { login: string }, pull_request?: unknown }>('GET', `/repos/${REPO}/issues/${number}`)
  if (issue.pull_request) {
    throw new Error(`#${number} is a pull request, not an issue. The agent never closes pull requests.`)
  }
  if (!isAgentLogin(issue.user.login)) {
    throw new Error(`Issue #${number} was opened by ${issue.user.login}, not by the agent. Only a person closes it.`)
  }
  if (issue.state !== 'open') {
    return { number, closed: false, note: 'already closed' }
  }
  await githubApi('POST', `/repos/${REPO}/issues/${number}/comments`, { body: comment })
  await githubApi('PATCH', `/repos/${REPO}/issues/${number}`, { state: 'closed', state_reason: 'completed' })
  return { number, closed: true }
}

/**
 * No labels, ever. `outdated` and `tool` belong to the issue forms people fill in, and an
 * agent finding wearing one makes that queue useless for triage. This used to be a sentence
 * in the tool description asking nicely, and the agent labelled five of its own issues
 * `outdated` anyway, so the parameter is gone rather than guarded.
 */
export async function createIssue(input: { title: string, body: string }) {
  const issue = await githubApi<{ number: number, html_url: string }>('POST', `/repos/${REPO}/issues`, {
    title: input.title,
    body: input.body
  })
  return { number: issue.number, url: issue.html_url }
}

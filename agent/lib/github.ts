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

/**
 * The branch the stale sweep batches its no-change re-verifications onto, and the only shape CI
 * merges without a person. It decides the label, and it is a namespace a limited turn may not
 * enter at all: see `pushToAgentBranch`.
 */
export const REVERIFY_BRANCH = /^agent\/re-verify-\d{4}-\d{2}-\d{2}$/

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
export async function pushToAgentBranch(input: { branch: string, message: string, files: PushedFile[], ownBranches?: string[] }) {
  assertAgentBranch(input.branch, 'write to')
  assertWritablePaths(input.files.map(f => f.path))

  // The re-verification lane is reserved from a limited turn whether or not it exists yet, and
  // the "yet" is the whole point. Refusing only a branch that is already there leaves the name
  // free to claim: the sweep names its branch after a date that has not happened, so a limited
  // turn could open `agent/re-verify-<future date>` first, push a diff of nothing but forward
  // `verified_at` bumps, and `.github/workflows/agent-automerge.yml` would merge it with no
  // person involved. A date with no re-read behind it is the one thing this agent must never
  // produce, and that lane is the one place it reaches `main` unattended.
  if (input.ownBranches && REVERIFY_BRANCH.test(input.branch)) {
    throw new Error(`${JSON.stringify(input.branch)} is the re-verification lane, which CI merges without a person. This turn pushes to its own agent/<topic>-<date> branch.`)
  }

  const head = await refSha(input.branch)
  // `ownBranches` present means the turn is a limited one and may only move a ref it opened
  // itself. Checked here rather than in the tool because this is where the ref is read
  // anyway, and it is the last place before the branch moves.
  if (input.ownBranches && head !== null && !input.ownBranches.includes(input.branch)) {
    throw new Error(`Branch ${JSON.stringify(input.branch)} already exists and this turn did not open it. Push to a new agent/<topic>-<date> branch instead: adding a commit to someone else's branch is not something this turn does.`)
  }
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

/**
 * Labels are derived from the branch, never passed in. The agent does not get to choose how its
 * own work is filed: a model that can pick a label eventually picks the wrong one, and this is
 * the same reason `createIssue` takes one hard-coded value.
 *
 * These are for filtering a queue, not for authorising anything. CI's auto-merge lane keys on
 * the branch name, which `github__push_files` enforces, and never on a label, which anyone with
 * write access can add.
 */
function labelsFor(branch: string) {
  return REVERIFY_BRANCH.test(branch) ? ['agent', 're-verify'] : ['agent']
}

export async function createPullRequest(input: { branch: string, title: string, body: string, ownBranches?: string[] }) {
  assertAgentBranch(input.branch, 'open a pull request from')
  // Same rule as the push. Opening a pull request from a branch the turn did not write is
  // how it would put its name on someone else's commits, and #44's auto-merge lane sharpens
  // it: a pull request on `agent/re-verify-<date>` merges with no person involved once CI
  // passes, so a sweep's branch is somewhere a limited turn could otherwise reach a merge.
  if (input.ownBranches && !input.ownBranches.includes(input.branch)) {
    throw new Error(`Branch ${JSON.stringify(input.branch)} was not opened by this turn. It opens pull requests from the branches it pushed itself.`)
  }
  const pr = await githubApi<{ number: number, html_url: string }>('POST', `/repos/${REPO}/pulls`, {
    title: input.title,
    body: input.body,
    head: input.branch,
    base: DEFAULT_BRANCH
  })

  // A second call, because the create-pull endpoint ignores `labels`. A repository missing the
  // label logs and moves on: filterability is worth a round trip, it is not worth the pull
  // request, and unlike an issue form there is nothing downstream that stops without it.
  const wanted = labelsFor(input.branch)
  const applied = await githubApi<{ name: string }[]>('POST', `/repos/${REPO}/issues/${pr.number}/labels`, { labels: wanted })
    .then(labels => labels.map(l => l.name))
    .catch((error) => {
      console.warn(`[agent] Could not label PR #${pr.number}:`, error)
      return [] as string[]
    })
  const missing = wanted.filter(label => !applied.includes(label))
  if (missing.length > 0) {
    console.warn(`[agent] PR #${pr.number} came back without ${missing.join(', ')}. Create the label in the repository.`)
  }

  return { number: pr.number, url: pr.html_url, labels: applied }
}

/**
 * Retitle or rewrite the body of a pull request the agent opened. A branch keeps moving after
 * the pull request is open, and a body describing the first commit is a worse account of the
 * change than no body at all. Only title and body: state, base and draft are Benjamin's.
 */
export async function updateOwnPullRequest(input: { number: number, title?: string, body?: string, ownBranches?: string[] }) {
  if (!input.title && !input.body) throw new Error('Nothing to change: pass a title, a body, or both.')
  const pr = await githubApi<{ head: { ref: string }, user: { login: string }, state: string }>('GET', `/repos/${REPO}/pulls/${input.number}`)
  if (!isAgentLogin(pr.user.login)) {
    throw new Error(`Pull request #${input.number} was opened by ${pr.user.login}, not the agent. Comment on it instead.`)
  }
  if (pr.state !== 'open') throw new Error(`Pull request #${input.number} is ${pr.state}.`)
  assertAgentBranch(pr.head.ref, 'edit a pull request from')
  if (input.ownBranches && !input.ownBranches.includes(pr.head.ref)) {
    throw new Error(`Pull request #${input.number} is on ${JSON.stringify(pr.head.ref)}, a branch this turn did not open. It edits the ones it opened itself.`)
  }
  const updated = await githubApi<{ number: number, html_url: string }>('PATCH', `/repos/${REPO}/pulls/${input.number}`, {
    ...(input.title ? { title: input.title } : {}),
    ...(input.body ? { body: input.body } : {})
  })
  return { number: updated.number, url: updated.html_url }
}

/**
 * Until none is left, and case-insensitively. One pass over `</thread</thread>>` removes the
 * inner tag and leaves a working one behind, which is how a comment would close its own fence
 * and start addressing the model as itself.
 */
function stripThreadFence(text: string) {
  const fence = /<\/\s*thread\s*>/gi
  let out = text
  let previous: string
  do {
    previous = out
    out = out.replace(fence, '')
  } while (out !== previous)
  return out
}

/** A long argument is still an argument, but it does not need to arrive whole. */
const MAX_THREAD_CHARS = 40_000

interface ThreadComment {
  user: { login: string } | null
  created_at: string
  body: string | null
  state?: string
}

function transcript(parts: { author: string, at: string, kind: string, body: string }[]) {
  const text = parts
    .map(p => `--- ${p.author} ${p.kind} on ${p.at.slice(0, 10)} ---\n${stripThreadFence(p.body).trim()}`)
    .join('\n\n')
  const trimmed = text.length > MAX_THREAD_CHARS ? `${text.slice(0, MAX_THREAD_CHARS)}\n[trimmed]` : text
  return `<thread>\n${trimmed}\n</thread>`
}

/**
 * The discussion on an issue or pull request. Diffs come out of the checkout, but what people
 * said about them only lives here, and a pass deciding what still needs a person cannot see
 * an objection it never read. People wrote it, so it comes back fenced as data.
 */
export async function readThread(number: number) {
  const issue = await githubApi<{ title: string, state: string, user: { login: string } | null, body: string | null, created_at: string, pull_request?: unknown }>('GET', `/repos/${REPO}/issues/${number}`)
  const comments = await githubApi<ThreadComment[]>('GET', `/repos/${REPO}/issues/${number}/comments`, undefined, { per_page: '100' })
  const pull = Boolean(issue.pull_request)
  const reviews = pull
    ? await githubApi<ThreadComment[]>('GET', `/repos/${REPO}/pulls/${number}/reviews`, undefined, { per_page: '100' })
    : []
  const parts = [
    { author: issue.user?.login ?? 'ghost', at: issue.created_at, kind: 'opened it', body: issue.body ?? '' },
    ...comments.map(c => ({ author: c.user?.login ?? 'ghost', at: c.created_at, kind: 'commented', body: c.body ?? '' })),
    ...reviews.filter(r => r.body).map(r => ({ author: r.user?.login ?? 'ghost', at: r.created_at, kind: `reviewed (${r.state?.toLowerCase() ?? 'commented'})`, body: r.body ?? '' }))
  ]
  return {
    number,
    kind: pull ? 'pull_request' as const : 'issue' as const,
    state: issue.state,
    title: issue.title,
    author: issue.user?.login ?? 'ghost',
    discussion: transcript(parts)
  }
}

/** A comment on any thread in the repository. The only way to say something without closing it. */
export async function commentOnThread(number: number, body: string) {
  const comment = await githubApi<{ html_url: string }>('POST', `/repos/${REPO}/issues/${number}/comments`, { body })
  return { number, url: comment.html_url }
}

/**
 * Close a pull request the agent opened, when its finding no longer holds: the change landed
 * another way, the tier it added is gone from the page. A person's pull request is theirs.
 */
export async function closeOwnPullRequest(number: number, comment: string) {
  const pr = await githubApi<{ head: { ref: string }, user: { login: string }, state: string }>('GET', `/repos/${REPO}/pulls/${number}`)
  if (!isAgentLogin(pr.user.login)) {
    throw new Error(`Pull request #${number} was opened by ${pr.user.login}, not the agent. Say so in a comment instead.`)
  }
  if (pr.state !== 'open') throw new Error(`Pull request #${number} is already ${pr.state}.`)
  assertAgentBranch(pr.head.ref, 'close a pull request from')
  await githubApi('POST', `/repos/${REPO}/issues/${number}/comments`, { body: comment })
  await githubApi('PATCH', `/repos/${REPO}/pulls/${number}`, { state: 'closed' })
  return { number, closed: true }
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
 * One label, `tool`, and only from the discovery pass. This parameter used to be free-form
 * with a sentence in the tool description asking nicely, and the agent labelled five of its
 * own findings `outdated` anyway, which made that queue useless for triage. So the type
 * carries the policy now rather than the prose: `outdated` is not a value any caller can
 * pass, and an agent finding still wears no label unless it is a candidate for the directory.
 *
 * The response is read back because a label that did not land means an issue the first
 * responder never sees, and the caller has to hear that as an error rather than file a
 * second one.
 */
export async function createIssue(input: { title: string, body: string, labels?: 'tool'[] }) {
  const issue = await githubApi<{ number: number, html_url: string, labels?: { name: string }[] }>('POST', `/repos/${REPO}/issues`, {
    title: input.title,
    body: input.body,
    labels: input.labels
  })
  const applied = (issue.labels ?? []).map(l => l.name)
  const missing = (input.labels ?? []).filter(label => !applied.includes(label))
  if (missing.length > 0) {
    throw new Error(`Issue #${issue.number} was opened but came back without ${missing.join(', ')}. It exists, so do not open a second one: report it and leave it to Benjamin.`)
  }
  return { number: issue.number, url: issue.html_url, labels: applied }
}

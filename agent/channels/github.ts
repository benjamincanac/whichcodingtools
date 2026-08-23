import { connectGitHubCredentials } from '@vercel/connect/eve'
import { defaultGitHubAuth, githubChannel } from 'eve/channels/github'
import { CONNECTOR } from '../lib/github'
import { AUTONOMOUS_PRINCIPAL, MAINTAINER_GITHUB_ID, isAutonomous } from '../lib/trust'

const botName = 'whichcodingtools'
const mention = new RegExp(`@${botName}(?=$|[^A-Za-z0-9_-])`, 'i')

/**
 * Two ways in:
 * - Benjamin mentions @whichcodingtools on an issue, PR or review comment: a normal turn with his identity.
 * - Someone opens an "Add a tool" issue: an unattended first-responder turn under a service principal
 *   that can reply in the thread and open a draft PR, nothing else.
 */
export default githubChannel({
  botName,
  credentials: connectGitHubCredentials(CONNECTOR),
  onComment: (ctx, comment) => {
    if (String(ctx.sender.id) !== MAINTAINER_GITHUB_ID) return null
    if (!mention.test(comment.body)) return null
    return { auth: defaultGitHubAuth(ctx) }
  },
  onIssue: (ctx, issue) => {
    if (issue.action !== 'opened') return null
    const login = ctx.sender.login.toLowerCase()
    if (login === botName || login.endsWith('[bot]')) return null
    if (String(ctx.sender.id) === MAINTAINER_GITHUB_ID) return null
    const raw = issue.raw as { issue?: { title?: string, labels?: { name: string }[] } }
    const title = raw.issue?.title ?? ''
    const labels = (raw.issue?.labels ?? []).map(l => l.name)
    if (!title.startsWith('[Tool]') && !labels.includes('tool')) return null
    const auth = defaultGitHubAuth(ctx)
    return {
      auth: { ...auth, principalId: AUTONOMOUS_PRINCIPAL, principalType: 'service' },
      title: `First response: ${title}`,
      context: [FIRST_RESPONDER]
    }
  },
  events: {
    async 'turn.failed'(event, channel, ctx) {
      if (isAutonomous(ctx.session.auth.current)) return
      await channel.thread.post(`I hit an error while handling this (${event.message}). Mention me again to retry.`)
    }
  }
})

const FIRST_RESPONDER = `This is an unattended turn on a new "Add a tool" issue. Load the \`contributing\` skill, then:
1. Read the issue. If it contains a YAML block, write it to /workspace/repo/content/tools/<slug>.yml and run \`pnpm validate\`. If it has no YAML, build a draft from the fields in the form (name, homepage, layer, pricing URL) and the vendor pages you fetch, leaving fields you could not verify out rather than guessed.
2. If validation passes, create a branch \`agent/add-<slug>-<YYYY-MM-DD>\`, commit \`data(<slug>): add <name>\`, push it and open a draft pull request that links this issue.
3. Reply in the issue with one short comment: what you validated, the PR link, or the validation issues as a list the reporter can fix. Do not restate the rules.
You may not open issues, edit other files, or mark anything ready. If the issue is not actually about adding a tool, reply with one sentence saying a maintainer will look at it.`

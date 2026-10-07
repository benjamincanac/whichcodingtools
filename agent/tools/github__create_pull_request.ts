import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { AGENT_BRANCH, createPullRequest } from '../lib/github'
import { isLimitedSession, ownBranches } from '../lib/thread'
import { isTrustedAuthor } from '../lib/trust'

export default defineTool({
  description: 'Open a pull request from a branch you already pushed with `github__push_files`. It opens ready for review, and CI merges it once `ci` passes when the diff is one tool on a branch named `agent/<slug>-...` after it, or the dates-only re-verification batch. A branch on `agent/community-*` and a diff across several tools wait for a person. Nothing you push after the merge reaches it, so the branch is finished before you call this. One tool per PR, body shows the before and after and links the vendor page.',
  inputSchema: z.object({
    branch: z.string().regex(AGENT_BRANCH).describe('Branch name, must start with agent/.'),
    title: z.string().min(8).max(120),
    body: z.string().min(20)
  }),
  async execute(input, ctx) {
    if (!isTrustedAuthor(ctx.session.auth)) {
      throw new Error('This turn may not open a pull request. Say what you found instead.')
    }
    const limited = isLimitedSession(ctx.session.auth)
    // `auth` rather than a label: the provenance is read off the principal here, so it stays a
    // thing the turn cannot choose about itself.
    return createPullRequest({ ...input, auth: ctx.session.auth, ...(limited ? { ownBranches: ownBranches.get() } : {}) })
  }
})

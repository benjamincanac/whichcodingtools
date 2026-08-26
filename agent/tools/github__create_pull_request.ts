import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { AGENT_BRANCH, createPullRequest } from '../lib/github'
import { ownBranches } from '../lib/thread'
import { isLimited, isTrustedAuthor } from '../lib/trust'

export default defineTool({
  description: 'Open a pull request from a branch you already pushed with `github__push_files`. It opens ready for review, because a pull request nobody can merge without a second click is not finished work. A person still merges it. One tool per PR, body shows the before and after and links the vendor page.',
  inputSchema: z.object({
    branch: z.string().regex(AGENT_BRANCH).describe('Branch name, must start with agent/.'),
    title: z.string().min(8).max(120),
    body: z.string().min(20)
  }),
  async execute(input, ctx) {
    if (!isTrustedAuthor(ctx.session.auth)) {
      throw new Error('This turn may not open a pull request. Say what you found instead.')
    }
    const limited = isLimited(ctx.session.auth)
    return createPullRequest({ ...input, ...(limited ? { ownBranches: ownBranches.get() } : {}) })
  }
})

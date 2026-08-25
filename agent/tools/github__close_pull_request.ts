import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { closeOwnPullRequest } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Close a pull request the agent opened, once its finding no longer holds: the change landed another way, the tier it added is gone from the vendor page, a second pull request superseded it. Not for a pull request that is merely waiting on Benjamin, and never one a person opened. The comment says why, so the thread reads as a decision rather than an abandonment.',
  inputSchema: z.object({
    number: z.number().int().positive(),
    comment: z.string().min(20).describe('Why it no longer holds, with the link to whatever replaced it.')
  }),
  async execute({ number, comment }, ctx) {
    if (!isTrustedWriter(ctx.session.auth)) {
      throw new Error('This turn may not close pull requests.')
    }
    return closeOwnPullRequest(number, comment)
  }
})

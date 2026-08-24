import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { closeOwnIssue } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Close an issue the agent itself opened, once the finding is verifiably resolved in this run: an unreadable page that was read today, a rename that landed. The comment states the evidence, with the PR link when there is one. Refuses issues opened by people. Not available on unattended issue-reply turns.',
  inputSchema: z.object({
    number: z.number().int().positive(),
    comment: z.string().min(20).describe('Why the issue is resolved: what was read today, and the PR link when one was opened.')
  }),
  async execute({ number, comment }, ctx) {
    if (!isTrustedWriter(ctx.session.auth)) {
      throw new Error('This turn may not close issues. Reply in the thread instead.')
    }
    return closeOwnIssue(number, comment)
  }
})

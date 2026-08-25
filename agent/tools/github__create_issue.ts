import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { createIssue } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Open an issue for a finding that needs a human decision: a vendor page that refuses automated reads, a rename, a tool that looks discontinued. Title states the problem. Body says what was tried, with URLs. It carries no labels: those belong to the forms people fill in, and to Benjamin. Not available on unattended issue-reply turns.',
  inputSchema: z.object({
    title: z.string().min(8).max(120),
    body: z.string().min(20)
  }),
  async execute(input, ctx) {
    if (!isTrustedWriter(ctx.session.auth)) {
      throw new Error('This turn may not open issues. Reply in the thread instead.')
    }
    return createIssue(input)
  }
})

import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { createIssue } from '../lib/github'
import { isAutonomous } from '../lib/trust'

export default defineTool({
  description: 'Open an issue for a finding that needs a human decision: a vendor page that refuses automated reads, a rename, a tool that looks discontinued. Title states the problem. Body says what was tried, with URLs. Not available on unattended issue-reply turns.',
  inputSchema: z.object({
    title: z.string().min(8).max(120),
    body: z.string().min(20),
    labels: z.array(z.string()).optional()
  }),
  async execute(input, ctx) {
    if (isAutonomous(ctx.session.auth.current)) {
      return { success: false as const, error: 'Unattended turns reply in the thread instead of opening issues.' }
    }
    return createIssue(input)
  }
})

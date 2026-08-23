import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { createIssue } from '../lib/github'

export default defineTool({
  description: 'Open an issue for a finding that needs a human decision: a vendor page that refuses automated reads, a rename, a tool that looks discontinued. Title states the problem. Body says what was tried, with URLs.',
  inputSchema: z.object({
    title: z.string().min(8).max(120),
    body: z.string().min(20),
    labels: z.array(z.string()).optional()
  }),
  async execute(input) {
    return createIssue(input)
  }
})

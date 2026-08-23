import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { createDraftPullRequest } from '../lib/github'

export default defineTool({
  description: 'Open a draft pull request from a branch you already pushed from /workspace/repo. Always a draft: a person marks it ready and merges. One tool per PR, body shows the before and after and links the vendor page.',
  inputSchema: z.object({
    branch: z.string().regex(/^agent\/[a-z0-9-]+$/).describe('Branch name, must start with agent/.'),
    title: z.string().min(8).max(120),
    body: z.string().min(20)
  }),
  async execute(input) {
    return createDraftPullRequest(input)
  }
})

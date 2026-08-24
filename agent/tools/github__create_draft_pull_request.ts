import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { AGENT_BRANCH, createDraftPullRequest } from '../lib/github'

export default defineTool({
  description: 'Open a draft pull request from a branch you already pushed with `github__push_files`. Always a draft: a person marks it ready and merges. One tool per PR, body shows the before and after and links the vendor page.',
  inputSchema: z.object({
    branch: z.string().regex(AGENT_BRANCH).describe('Branch name, must start with agent/.'),
    title: z.string().min(8).max(120),
    body: z.string().min(20)
  }),
  async execute(input) {
    return createDraftPullRequest(input)
  }
})

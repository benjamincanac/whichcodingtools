import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { updateOwnPullRequest } from '../lib/github'
import { isAutonomous } from '../lib/trust'

export default defineTool({
  description: 'Retitle or rewrite the body of a pull request the agent opened. Call it whenever you push another commit to an open pull request: the body is the account of the branch, and one that still describes the first commit is worse than none. Refuses a pull request opened by a person, a closed one, and anything outside `agent/*`. Title and body only, the state and the merge are Benjamin\'s.',
  inputSchema: z.object({
    number: z.number().int().positive(),
    title: z.string().min(8).max(120).optional().describe('Leave unset to keep the current title.'),
    body: z.string().min(20).optional().describe('The whole body, not a patch. Before and after values, the vendor URL, and a "Not changed in this PR" line.')
  }),
  async execute(input, ctx) {
    return updateOwnPullRequest({ ...input, autonomous: isAutonomous(ctx.session.auth) })
  }
})

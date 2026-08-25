import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { listOpen } from '../lib/github'

export default defineTool({
  description: 'Every open issue and pull request in the repository, newest activity first. This is the stocktake tool: use it when the task is "go through what is open", and `github__find_related` when you already have a slug and want its history including closed threads. Open pull requests come back with their branch and whether they are still a draft; issues come back with their labels. The repository is private, so this is the only way to enumerate them: the REST API refuses an unauthenticated fetch and the browser cannot open github.com. A pull request\'s diff is read from the checkout instead, with `git fetch origin \'refs/pull/*/head:refs/remotes/origin/pr/*\'`.',
  inputSchema: z.object({
    kind: z.enum(['all', 'issue', 'pull_request']).default('all').describe('Narrow to one kind, or leave it for both.')
  }),
  async execute({ kind }) {
    return listOpen(kind)
  }
})

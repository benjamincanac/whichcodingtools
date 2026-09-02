import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { listOpen } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Every open issue and pull request in the repository, newest activity first. This is the stocktake tool: use it when the task is "go through what is open", and `github__find_related` when you already have a slug and want its history including closed threads. Open pull requests come back with their branch and whether they are still a draft; issues come back with their labels. This is the way to enumerate them: the REST API without a credential is rate limited to almost nothing and the browser cannot open github.com. A pull request\'s diff is read from the checkout instead, with `git fetch origin \'refs/pull/*/head:refs/remotes/origin/pr/*\'`.',
  inputSchema: z.object({
    kind: z.enum(['all', 'issue', 'pull_request']).default('all').describe('Narrow to one kind, or leave it for both.')
  }),
  async execute({ kind }, ctx) {
    // A stocktake is a sweep's or Benjamin's job. A turn a stranger started stands in one thread
    // and dedupes with `github__find_related`; the whole open list is not something it needs.
    if (!isTrustedWriter(ctx.session.auth)) throw new Error('This turn may not list the repository.')
    return listOpen(kind)
  }
})

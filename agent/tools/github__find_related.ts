import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { findRelated } from '../lib/github'
import { isTrustedAuthor } from '../lib/trust'

export default defineTool({
  description: 'Search the repository for issues and pull requests about a tool, open and closed. Call it with the tool slug before opening anything: a finding that already has an open PR of yours pushes to that PR\'s branch, and a finding whose issue a person already closed is settled, so do not file it again. Your own open pull requests come back with the branch to push to. A person\'s comes back with its author and no branch, and is not somewhere to push. The title of a thread someone other than Benjamin or you opened is withheld: `github__read_thread` has its text.',
  inputSchema: z.object({
    terms: z.string().min(2).describe('Plain words. The tool slug on its own is usually right: GitHub ANDs the terms, so every extra word can only hide a match. Search qualifiers are ignored.')
  }),
  async execute({ terms }, ctx) {
    // The same allow-list as the push: every turn that may open a pull request has to be able
    // to check for one first, and a principal nobody planned for reads nothing.
    if (!isTrustedAuthor(ctx.session.auth)) throw new Error('This turn may not search the repository.')
    return findRelated(terms)
  }
})

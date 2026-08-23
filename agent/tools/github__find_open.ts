import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { findOpen } from '../lib/github'

export default defineTool({
  description: 'Search open issues and pull requests in the repository. Call it with the tool slug before opening anything, so a finding that already has a PR or an issue updates that one instead of duplicating it.',
  inputSchema: z.object({
    terms: z.string().min(2).describe('Search terms, usually the tool slug and a word like pricing.')
  }),
  async execute({ terms }) {
    return { results: await findOpen(terms) }
  }
})

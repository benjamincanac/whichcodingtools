import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { findRelated } from '../lib/github'

export default defineTool({
  description: 'Search the repository for issues and pull requests about a tool, open and closed. Call it with the tool slug before opening anything: a finding that already has an open PR pushes to that PR\'s branch, and a finding whose issue a person already closed is settled, so do not file it again. Open pull requests come back with the branch to push to.',
  inputSchema: z.object({
    terms: z.string().min(2).describe('Plain words. The tool slug on its own is usually right: GitHub ANDs the terms, so every extra word can only hide a match. Search qualifiers are ignored.')
  }),
  async execute({ terms }) {
    return findRelated(terms)
  }
})

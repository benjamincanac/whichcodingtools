import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { createIssue } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Open an issue for a finding that needs a human decision: a vendor page that refuses automated reads, a rename, a tool that looks discontinued. Title states the problem. Body says what was tried, with URLs. It carries no labels, with one exception: the discovery pass files a candidate as `[Tool] <name>` with `labels: ["tool"]`, which is the same request the "Add a tool" form makes and starts the first responder on it. Every other label belongs to the forms people fill in, and to Benjamin. Not available on unattended issue-reply turns.',
  inputSchema: z.object({
    title: z.string().min(8).max(120),
    body: z.string().min(20),
    labels: z.array(z.literal('tool')).max(1).optional().describe('Discovery candidates only. `tool` starts the first responder, so the issue has to read like the form it imitates.')
  }),
  async execute(input, ctx) {
    if (!isTrustedWriter(ctx.session.auth)) {
      throw new Error('This turn may not open issues. Reply in the thread instead.')
    }
    // The label and the title prefix travel together. `tool` dispatches an unattended turn
    // that opens a pull request, so a sweep cannot reach it by tidying a label onto an issue
    // that reads like a bug report.
    if (input.labels?.includes('tool') && !input.title.startsWith('[Tool] ')) {
      throw new Error('An issue labelled "tool" is a candidate for the directory and its title starts with "[Tool] ". Drop the label or write the title the form writes.')
    }
    return createIssue(input)
  }
})

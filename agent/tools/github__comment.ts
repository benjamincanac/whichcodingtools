import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { commentOnThread } from '../lib/github'
import { isTrustedWriter } from '../lib/trust'

export default defineTool({
  description: 'Say something in a thread without closing it: a page that still refuses after a re-check, what a new commit on an open pull request changed, why a finding no longer holds. On a schedule there is no chat channel, so this is the only way a sweep speaks. One comment per finding, and nothing that repeats what the thread already says. Only ever a thread this turn is not already in: when you were mentioned on one, your last message is posted there for you, so commenting on it too says everything twice. Not available on unattended issue-reply turns, those answer in their own thread.',
  inputSchema: z.object({
    number: z.number().int().positive(),
    body: z.string().min(20).max(60_000).describe('What changed and what it means, with links. No restating the rules, no summarising the thread back to the people in it.')
  }),
  async execute({ number, body }, ctx) {
    if (!isTrustedWriter(ctx.session.auth)) {
      throw new Error('This turn may not comment on other threads. Reply in your own thread instead.')
    }
    return commentOnThread(number, body)
  }
})

import { isChannel } from 'eve/channels'
import { defineHook } from 'eve/hooks'
import github from '../channels/github'
import { isTrustedWriter } from '../lib/trust'

/**
 * Cancel a GitHub turn that asks for input on a session that is not Benjamin's on both
 * principals. The only request this agent raises is eve's budget prompt, and that prompt grants
 * spend, so nobody else is asked it. A turn left parked on it would hold the thread: every later
 * comment and label there waits behind an answer nobody may give. The channel posts the
 * unfinished line on the same event.
 *
 * A channel event handler cannot cancel a turn, which is why this is a hook. The session itself
 * stays on the thread and is still over budget, so the next turn there asks again and is
 * cancelled again, until eve's session timeout ends it.
 */
export default defineHook({
  events: {
    'interaction.opened'(_event, ctx) {
      if (!isChannel(ctx.channel, github)) return
      if (isTrustedWriter(ctx.session.auth)) return
      ctx.cancel('Input requested on a session that may not be asked.')
    }
  }
})

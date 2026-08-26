import { defineState } from 'eve/context'

/**
 * The issue or pull request this turn is already answering in, or null when it has no
 * GitHub channel at all (every schedule-dispatched sweep).
 *
 * A tool's context carries the session, not the channel, so `github__comment` cannot ask
 * which thread it is standing in. The channel's `turn.started` handler can, and stashes it
 * here for the tool to read back.
 */
export const currentThread = defineState<number | null>('agent.current-thread', () => null)

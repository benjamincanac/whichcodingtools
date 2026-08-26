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

/**
 * Branches this session created, which is what a limited turn is allowed to move. A branch
 * that already existed belongs to some other run, and appending to it is how a line in a
 * stranger's text would reach a sweep's open pull request.
 *
 * Per session, so per thread: a follow-up mention on the same issue is a second turn on the
 * first one's session and can still add a commit to the branch it opened.
 */
export const ownBranches = defineState<string[]>('agent.own-branches', () => [])

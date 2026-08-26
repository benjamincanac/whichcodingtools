import type { SessionAuth, SessionAuthContext } from 'eve/context'

/** Benjamin's GitHub user id. A public identifier, not a credential. */
export const MAINTAINER_GITHUB_ID = '739984'

/** Principal stamped on unattended first-responder turns (new community issues). */
export const AUTONOMOUS_PRINCIPAL = 'github:whichcodingtools-first-responder'

/** Principal stamped on a mention from anyone who is not the maintainer. */
export const VISITOR_PRINCIPAL = 'github:whichcodingtools-visitor'

/** eve's own principal on a schedule-dispatched turn, matched on all three fields. */
const SCHEDULE_PRINCIPAL = { authenticator: 'app', principalId: 'eve:app', principalType: 'runtime' }

/** The two tiers that stand for nobody holding commit rights on the repository. */
const LIMITED_PRINCIPALS = new Set([AUTONOMOUS_PRINCIPAL, VISITOR_PRINCIPAL])

export function isMaintainer(auth: SessionAuthContext | null) {
  return auth !== null && auth.principalId === `github:${MAINTAINER_GITHUB_ID}`
}

export function isSchedule(auth: SessionAuthContext | null) {
  return auth !== null
    && auth.authenticator === SCHEDULE_PRINCIPAL.authenticator
    && auth.principalId === SCHEDULE_PRINCIPAL.principalId
    && auth.principalType === SCHEDULE_PRINCIPAL.principalType
}

/**
 * Trust is read from both principals on the session, never from `current` alone.
 * eve keys a GitHub session per thread, so when the maintainer replies on an issue a
 * stranger opened, the first-responder session resumes with the stranger's text still in
 * the transcript and `current` flipped to the maintainer. Judging on `current` would run
 * that text at maintainer trust.
 */
export function isAutonomous(auth: SessionAuth) {
  return auth.current?.principalId === AUTONOMOUS_PRINCIPAL
    || auth.initiator?.principalId === AUTONOMOUS_PRINCIPAL
}

/**
 * Either principal is one of the unattended tiers, read the same pessimistic way and for the
 * same reason: once a visitor has spoken in a thread, the narrower branch rule stays on it
 * even when the session resumes under someone else.
 */
export function isLimited(auth: SessionAuth) {
  return [auth.current, auth.initiator].some(p => p !== null && LIMITED_PRINCIPALS.has(p.principalId))
}

/**
 * Who may write anything at all. An allow-list, so a dispatch path nobody
 * thought about (a new channel, a hook, a subagent) fails closed instead of inheriting
 * the maintainer's reach.
 */
export function isTrustedWriter(auth: SessionAuth) {
  const principals = [auth.current, auth.initiator].filter(p => p !== null)
  if (principals.length === 0) return false
  return principals.every(p => isMaintainer(p) || isSchedule(p))
}

/**
 * Who may push a branch and open a pull request: everyone above, plus the two unattended
 * tiers. The same allow-list shape, because the narrowing those two tools used to do was
 * `isAutonomous`, and that is a pessimistic "either principal" test. A principal nobody
 * planned for read as not-autonomous and fell straight through it into the whole `agent/*`
 * namespace. What confines a limited turn is the branch rule in `pushToAgentBranch`, not this.
 */
export function isTrustedAuthor(auth: SessionAuth) {
  const principals = [auth.current, auth.initiator].filter(p => p !== null)
  if (principals.length === 0) return false
  return principals.every(p => isMaintainer(p) || isSchedule(p) || LIMITED_PRINCIPALS.has(p.principalId))
}

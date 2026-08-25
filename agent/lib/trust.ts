import type { SessionAuth, SessionAuthContext } from 'eve/context'

/** Benjamin's GitHub user id. A public identifier, not a credential. */
export const MAINTAINER_GITHUB_ID = '739984'

/** Principal stamped on unattended first-responder turns (new community issues). */
export const AUTONOMOUS_PRINCIPAL = 'github:whichcodingtools-first-responder'

/** eve's own principal on a schedule-dispatched turn, matched on all three fields. */
const SCHEDULE_PRINCIPAL = { authenticator: 'app', principalId: 'eve:app', principalType: 'runtime' }

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
 * Who may write anything at all. An allow-list, so a dispatch path nobody
 * thought about (a new channel, a hook, a subagent) fails closed instead of inheriting
 * the maintainer's reach.
 */
export function isTrustedWriter(auth: SessionAuth) {
  const principals = [auth.current, auth.initiator].filter(p => p !== null)
  if (principals.length === 0) return false
  return principals.every(p => isMaintainer(p) || isSchedule(p))
}

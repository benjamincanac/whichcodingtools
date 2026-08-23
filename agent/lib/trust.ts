import type { SessionAuthContext } from 'eve/context'

/** Benjamin's GitHub user id. A public identifier, not a credential. */
export const MAINTAINER_GITHUB_ID = '739984'
export const MAINTAINER_GITHUB_LOGIN = 'benjamincanac'

/** Principal stamped on unattended first-responder turns (new community issues). */
export const AUTONOMOUS_PRINCIPAL = 'github:whichcodingtools-first-responder'

export function isMaintainer(auth: SessionAuthContext | null) {
  return auth !== null && auth.principalId === `github:${MAINTAINER_GITHUB_ID}`
}

/** Unattended turns: may comment and open a draft PR, may not open issues or park on approvals. */
export function isAutonomous(auth: SessionAuthContext | null) {
  return auth !== null && auth.principalId === AUTONOMOUS_PRINCIPAL
}

/** Schedule-dispatched turns carry eve's app principal. */
export function isSchedule(auth: SessionAuthContext | null) {
  return auth !== null && auth.authenticator === 'app' && auth.principalId === 'eve:app'
}

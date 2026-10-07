import type { SessionAuth, SessionAuthContext } from 'eve/context'

/** Benjamin's GitHub user id. A public identifier, not a credential. */
export const MAINTAINER_GITHUB_ID = '739984'

/** Principal stamped on unattended first-responder turns (new community issues). */
export const AUTONOMOUS_PRINCIPAL = 'github:whichcodingtools-first-responder'

/** Principal stamped on a mention from anyone who is not the maintainer. */
export const VISITOR_PRINCIPAL = 'github:whichcodingtools-visitor'

/**
 * Principal stamped on the unattended review of a person's pull request. In no allow-list at
 * all: it reads the branch and the vendor pages, and the one thing it produces is the comment
 * the channel posts from its last message. A review that could push would be a review that
 * could edit the branch it is judging.
 */
export const REVIEW_PRINCIPAL = 'github:whichcodingtools-pr-review'

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

/** The review twin of `isAutonomous`, read the same pessimistic way and for the same reason. */
export function isReviewer(auth: SessionAuth) {
  return auth.current?.principalId === REVIEW_PRINCIPAL
    || auth.initiator?.principalId === REVIEW_PRINCIPAL
}

/** The visitor twin of `isAutonomous`, read the same pessimistic way and for the same reason. */
export function isVisitor(auth: SessionAuth) {
  return auth.current?.principalId === VISITOR_PRINCIPAL
    || auth.initiator?.principalId === VISITOR_PRINCIPAL
}

/**
 * Either principal stands for someone without commit rights: the two unattended tiers, or the
 * review of a person's pull request. This only sees who started the session and who is speaking
 * now. A stranger who spoke in between, on a session Benjamin opened, leaves no trace on either
 * principal, so the tools ask `isLimitedSession` in `thread.ts`, which adds the sticky flag.
 */
export function isLimited(auth: SessionAuth) {
  return [auth.current, auth.initiator].some(p => p !== null && (LIMITED_PRINCIPALS.has(p.principalId) || p.principalId === REVIEW_PRINCIPAL))
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
 *
 * The review principal is accepted as the initiator and never as the speaker. A review shares
 * its session with every later comment on that pull request, so refusing it on both would lock
 * Benjamin and the contributor out of a thread the moment it was reviewed. The review turn
 * itself still writes nothing, and whoever speaks after it is limited by `isLimited`.
 */
export function isTrustedAuthor(auth: SessionAuth) {
  const author = (p: SessionAuthContext) => isMaintainer(p) || isSchedule(p) || LIMITED_PRINCIPALS.has(p.principalId)
  if (auth.current === null || !author(auth.current)) return false
  return auth.initiator === null || author(auth.initiator) || auth.initiator.principalId === REVIEW_PRINCIPAL
}

/**
 * Content rules that are pure predicates, kept out of `validate.ts` so they can be tested.
 * The script itself runs its checks at import and exits, which leaves nothing to assert against.
 */

/**
 * A note saying something is "not in the directory" is a claim about this repository, not about
 * the vendor's page. Nothing re-reads it: the sweeps check a file against its sources, and this
 * one turns false when an unrelated entry lands, so it rots in place. `wraps` states coverage.
 *
 * The object has to be this directory or a coverage verb next to "here". A bare "not tracked"
 * is left alone on purpose: pricing notes say things like "usage is not tracked per seat", and a
 * check that cries wolf on those gets switched off. The word "directory" is taken bluntly on the
 * other hand: in this corpus it means this one, and a note using it in another sense is still
 * worth a second read.
 */
const COVERAGE_CLAIM = /\b(?:not|never|excluded|missing|absent)\b[a-z' ]{0,30}?(?:(?:in|from|on) (?:(?:the|this) )?directory|(?:tracked|listed|covered|included|carried) here)\b|\b(?:untracked|unlisted) here\b/i

export function claimsDirectoryCoverage(text: string) {
  return COVERAGE_CLAIM.test(text)
}

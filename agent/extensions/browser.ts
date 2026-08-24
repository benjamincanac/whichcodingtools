import browser from '@agent-browser/eve'

/**
 * A real browser in the sandbox for pricing pages that render client side
 * (Cursor, Lovable, Sweep and friends refuse or blank a plain fetch).
 *
 * No domain allow-list on purpose: the whole job is reading arbitrary vendor
 * sites. The guard is on the write side instead: everything a page could talk
 * the model into is limited to draft PRs and issues, and `contentBoundaries`
 * marks page text as untrusted in the transcript.
 */
export default browser({
  contentBoundaries: true,
  maxOutputChars: 50_000,
  inlineScreenshots: false
})

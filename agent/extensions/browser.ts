import browser from '@agent-browser/eve'

/**
 * A real browser in the sandbox for pricing pages that render client side
 * (Cursor, Lovable, Sweep and friends refuse or blank a plain fetch).
 *
 * No domain allow-list on purpose: the whole job is reading arbitrary vendor
 * sites. The guard is on the write side instead, and it is a mechanism rather
 * than a rule: the sandbox is brokered read-only git credentials, so the widest
 * thing a page can talk the model into is a commit on an `agent/*` branch under
 * `content/` or `public/logos/`. `contentBoundaries` marks page text as untrusted
 * in the transcript on top of that.
 *
 * One domain is out of reach rather than out of policy: `github.com` is the only one
 * the firewall terminates TLS on, to broker the git credential, and the browser does
 * not trust the per-sandbox proxy CA. The instructions send GitHub reads to the
 * `github__*` tools and the checkout.
 *
 * The user agent is Chromium's own. `page-text.mjs` identifies itself as
 * `whichcodingtools-agent` and checks robots.txt before every fetch, but this extension
 * exposes no user agent option, so the browser cannot say the same. The skills only open
 * a page here after that fetch ran, which is what keeps a reserved page out of it.
 */
export default browser({
  contentBoundaries: true,
  maxOutputChars: 50_000,
  inlineScreenshots: false
})

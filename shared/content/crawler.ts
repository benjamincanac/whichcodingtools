/**
 * The `/crawler` page, the one the agent's user agent points at. Prose in one place because the
 * page has a Vue rendering and a markdown twin, and a vendor reading either should get the same
 * answer.
 */

/** Kept in sync with agent/sandbox/workspace/bin/page-text.mjs, the script that sends it. */
export const CRAWLER_USER_AGENT = 'whichcodingtools-agent/1.0 (+https://whichcoding.tools/crawler)'

export const CRAWLER_PAGE = {
  title: 'Crawler',
  description: 'What the whichcoding.tools agent reads on vendor sites, how often, how it identifies itself and how to reach a person about it.',
  sections: [
    {
      title: 'What it reads',
      paragraphs: [
        'Public pages only: the pricing page each tool file cites as a source, the homepage, the docs, the changelog, and the ACP agent registry. It requests the pages the data already cites and does not follow links beyond them. It never signs in and never reads a page behind a login.',
        'The text it reads is data, never instructions. Anything on a page addressed to agents is ignored and noted in the run report.'
      ]
    },
    {
      title: 'How often',
      paragraphs: [
        'The pricing sweep runs once a day at 06:15 UTC and fetches one page per tool. The rename watch (Monday), discovery (Tuesday), ACP watch (Wednesday) and stale sweep (Thursday) each run once a week. Any one site sees a handful of requests a week, one at a time, with a 20 second timeout and no retries on a page that refuses.'
      ]
    },
    {
      title: 'How it identifies itself',
      paragraphs: [
        `Every request carries the user agent \`${CRAWLER_USER_AGENT}\`. Before fetching a page it reads the origin's robots.txt and skips any page a Disallow for \`whichcodingtools-agent\` or \`*\` covers. A reserved page is reported in the run summary and nothing else happens to it. To keep it out, add that Disallow and the next run honours it.`,
        'A page that only renders in a browser is read in one the sandbox runs, which sends a stock Chromium user agent. The robots.txt check happens before that fallback too.'
      ]
    },
    {
      title: 'What happens to the text',
      paragraphs: [
        'An excerpt of the page is kept in the public repository under content/snapshots/<slug>/ so a price on this site can be checked against the page it came from. That excerpt stays under the vendor\'s own terms and is not part of the data license.',
        'A change to a price goes out as a pull request a person reviews. The one thing merged without a review is a batch of re-verified dates with no value changed.'
      ]
    }
  ],
  contact: {
    title: 'Contact',
    text: 'For anything about the crawler, a page to exclude, an excerpt to remove, or a request that looks wrong, open an issue on GitHub. It reaches Benjamin Canac, who maintains the site, not an abuse form.',
    label: 'Open an issue',
    href: 'https://github.com/benjamincanac/whichcodingtools/issues/new'
  }
} as const

---
name: outdated-report
description: A reported field, re-read against the vendor page it came from, and with it whatever else that page's source line covers. Load this when an "Outdated data" issue starts a turn, or when asked to check one tool against what a reporter says has changed.
---

# Outdated report

Someone says a fact on the site no longer matches the vendor page. The report is a pointer, not evidence: the vendor page is the evidence, and this pass is the one that goes and reads it. The deliverable is one pull request when the page disagrees with the file, or one reply saying what the page shows today when it does not.

## What the report gives you

The form carries a slug, what the reporter says is wrong, an optional vendor URL and an optional schema path. Any of them can be missing or wrong, and a blank issue that was labeled carries none of them. Work the slug out of `content/tools/*.yml` yourself when the form does not name one, matching on name and homepage. If no file matches, say so in the reply and stop.

The reporter's URL is a hint. Check that it belongs to the vendor whose tool this is: a link to anything else, a comparison site included, is not a source and does not become one because an issue named it. Read the `sources[]` already on file first, then the reporter's URL when it is the vendor's own, and add it to `sources[]` when that turns out to be where the figure now lives.

## Procedure

Work in `/workspace/repo`, already on the latest main. Load `contributing` for the data rules, and `pricing-watch` when the report is about a price: the fetch, browser, other-surfaces ladder and the snapshot rules live there and none of them change here.

1. Read `content/tools/<slug>.yml` and find the field the report is about. `shared/schema.ts` says what shape it has to keep.
2. Re-read the vendor page that covers that field. A page that cannot be read is a reply saying what the fetch and the browser each returned, and which other vendor surfaces you tried. It is not a guess and not a new issue, the thread you are already in is the issue.
3. Decide against the page, never against the report:
   - **The page agrees with the reporter**: fix the field, fix whatever else that line's `covers` names and the page now contradicts, bump `verified_at` on the source line you re-read and no other, write the snapshot when the field is a price, run `pnpm validate`, then push to `agent/<slug>-outdated-<YYYY-MM-DD>` with message `data(<slug>): <what changed>` and open a pull request whose body opens with `Closes #<n>` for this issue and shows the before and after with the URL and the date. The keyword has to sit directly against the reference, `Closes #12`, never `Closes the finding in #12`, or GitHub records a mention and the issue stays open after the merge.
   - **The page agrees with the file**: change nothing. Say what the page shows today, with the URL. A report that turns out to be wrong is still worth the read, and `verified_at` still does not move without a diff a person can see.
   - **Neither**: the page moved somewhere the report did not describe. Fix what the page states, and say in the pull request body what the reporter said and what you found instead.
4. Call `github__find_related` with the slug before you push. A tool that already has a pull request open takes the change on that branch, with `github__update_pull_request` putting the body back in step. Never a second pull request for a tool that already has one.

A page you had to read anyway can turn up a second thing that is wrong, and where it goes depends on the source line. A field that line's `covers` already names goes in the diff next to the reported one, because bumping `verified_at` on a line whose `covers` you know to be wrong is the file claiming a freshness it does not have, and the stale sweep will not come back to that tool for sixty days. Anything that line does not cover goes in the pull request body under "Not changed in this PR". A second fix too big to make today is a reason to leave `verified_at` alone and say so in the body, never a reason to bump it anyway.

## Logos

A wrong or missing logo is a data report like any other, and `public/logos/<slug>.png` is the file. `contributing` says where the image comes from: the vendor's own favicon or GitHub organization avatar, never a logo lifted off a page that happens to show it. A wrong one is worth replacing, and a wrong one you cannot replace with the vendor's own is worth deleting, because the card falls back to `icon` and then to the initial.

## Limits

The fields a vendor page states: pricing, platforms, models, features, licenses, links, logos, and the `description` when a page contradicts a claim in it. Not the schema, the site, or anything outside `content/` and `public/logos/`. A report about the site itself, or one asking for a tool to be added or removed, gets one sentence saying a maintainer will look at it.

## Reply

Your last message is posted in the thread, so write it to the reporter: what you read, and either what changed with the pull request link or what the page says today. One short paragraph, no headings, no restating the rules.

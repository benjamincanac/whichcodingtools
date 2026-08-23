---
name: pricing-watch
description: The daily sweep over content/tools. Re-reads every tool's pricing source, compares it with the stored snapshot, and opens a draft PR when a price, a tier or an included amount changed. Load this when the pricing-watch schedule fires or when asked to check pricing.
---

# Pricing watch

The directory's promise is that every price carries the date someone checked the vendor page. This sweep is that someone, every day. The deliverable is a draft pull request per changed tool, an issue per page that could not be read, and one short report. Nothing merges without a person.

## Setup

Work in `/workspace/repo`, already on the latest `main`. Load the `contributing` skill once for the data rules.

Build the worklist from the files in `content/tools/*.yml`: for each tool take `slug` and the `sources[]` entries whose `covers` includes `pricing`. Skip tools with `status: sunset`.

## For each tool

1. Fetch the pricing source: `node /workspace/bin/page-text.mjs <url> > /tmp/<slug>.txt`. Read the output. If the command fails (HTTP error, timeout) or the text has no prices at all (a client-rendered page), record the tool as **unreadable** and continue. Do not guess from another site.
2. Compare with the stored snapshot `content/snapshots/<slug>/pricing.txt` when it exists. `diff` is fine, but the decision is semantic: a changed dollar amount, a new or removed tier, a changed included amount, a changed overage rule or a rename is **material**. Reworded marketing copy, dates, cookie banners and navigation are **cosmetic**.
3. Compare the page with the YAML as well, even when the snapshot did not change: the snapshot can be missing or stale, the YAML is the truth the site shows.
4. Decide:
   - **Material change**: create a branch `agent/<slug>-pricing-<YYYY-MM-DD>`, write the new snapshot, edit `content/tools/<slug>.yml` to match the page (tiers, prices, included, overage, limits, notes), bump `verified_at` on that source line to today, run `pnpm validate`, commit with `data(<slug>): <what changed>`, push the branch, open a draft PR with the before and after values and the vendor URL. If a PR for this tool is already open (check with `github__find_open`), push to its branch instead.
   - **No change**: do nothing for this tool. Do not bump `verified_at` by itself, a date without a diff a person can see is noise.
   - **Cosmetic change only**: do nothing. Tomorrow's run compares against the same snapshot and that is fine.
   - **No snapshot yet**: treat the YAML comparison as the decision, and add the snapshot file to the PR if you open one. Do not open PRs only to add snapshots.
5. **Unreadable**: if no open issue exists for it (`github__find_open` with the slug and "unreadable"), open one titled `<Name> pricing page cannot be read automatically` with the URL, the HTTP status or what the text contained, and the date. One issue per tool, ever: if one is open, skip.

## Rules

- Never invent a figure. If the page shows a price range or "from", use `price_from: true`. If a tier disappeared, remove it and say so in the PR.
- Never change `description`, `features`, `wraps`, `license` or `models` in this sweep. Pricing only. Put anything else you noticed in the PR body as a note for a human.
- One tool per branch and per PR.
- `pnpm validate` must pass before every push.
- Rate yourself: 60 pages is the whole directory, you do not need to parallelise or retry aggressively. A page that fails twice is unreadable today.

## Report

End with one paragraph: how many tools were checked, how many PRs opened or updated with links, how many issues opened with links, how many unreadable and which. No table, no restating the rules.

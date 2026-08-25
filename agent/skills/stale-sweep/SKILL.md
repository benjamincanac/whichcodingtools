---
name: stale-sweep
description: Weekly re-verification of tools whose sources are older than 60 days, so no fact rots silently. Load this when the stale-sweep schedule fires or when asked to re-verify stale tools.
---

# Stale sweep

The freshness badge turns amber at 30 days and red at 90. This sweep keeps the corpus out of the red by re-reading the oldest sources once they pass 60 days, whether or not anything changed.

## Procedure

Work in `/workspace/repo`. Build the worklist: every tool that is not `status: sunset` where the oldest `verified_at` across `sources` is more than 60 days ago. Sort oldest first. Cap the run at 15 tools, the rest wait for next week.

For each tool, follow the pricing-watch procedure for its pricing source (load the `pricing-watch` skill once for the rules), and additionally re-read the non-pricing sources against the fields their `covers` lists (platforms, models, features, license).

- Anything changed: one PR per tool with the diff and bumped `verified_at` on the lines you re-read.
- Nothing changed: bump `verified_at` on the source lines you actually re-read, and batch every no-change bump of the run into ONE PR on branch `agent/re-verify-<YYYY-MM-DD>`, titled `data: re-verify <n> tools with unchanged sources`. This is the documented exception to the one PR per tool rule, and the one case where a date bump without a value diff is right: the comparison is the work, and the PR body lists each page checked.
- No snapshot yet: a tool you re-read whose `content/snapshots/<slug>/` is empty gets one, written by `page-text.mjs` and never by hand, and pushed with whichever PR that tool is already in, its own or the batched one. Most tools still have none, and the daily pricing sweep cannot diff a snapshot that does not exist. Backfilling one turns the figure check on for that tool, so `pnpm validate` will now ask for a capture of every price it carries, toggled states included.
- Unreadable: same rule as pricing-watch, one issue per tool, ever.

## When nothing is warranted

One line: no tool is past 60 days.

---
name: contributing
description: The data rules of content/tools (schema fields, what counts as open source, how renames and merges are recorded, tier shapes) and the branch, commit and pull request conventions. Load this before editing any YAML file or opening a PR.
---

# Contributing to the data

Everything on the site comes from `content/tools/*.yml`, validated by `shared/schema.ts` and `pnpm validate`. Read `CONTRIBUTING.md` in the repo for the human version; this is the operational summary.

## Fields that trip people up

- `license.kind` is `open-source` only for OSI licenses. Elastic, BSL, SSPL and friends are `source-available`. `spdx` is a valid SPDX expression or the word `proprietary`. When the notes mention a public repo, set `license.repo` too: the license section links a repo from that field alone, so notes that point at one it does not link contradict the page they render on.
- `wraps` is for tools that run another tool. `uses_subscription: true` means the wrapped tool's own login is reused. A pasted API key is `via: api`, `uses_subscription: false`.
- `models.plans` lists consumer plans the tool can sign in with without being part of them. `pricing.bundled_with` is for tools that are part of the plan.
- `pricing.same_as` points at another tool that carries the tiers.
- A vendor's second surface is its own file only when its `install`, `platforms` or `features` differ from the parent's (Claude desktop app next to Claude Code). It carries `pricing.same_as` back to the parent, and its `layer` must not also sit in the parent's `secondary_layers`. Otherwise the surface is one more entry in the parent's `secondary_layers` and nothing else.
- A tier needs a `price`, or `price_annual`, or `contact_sales: true`, or an `overage`. `price: null` with an `overage` is pay as you go. `price_from: true` when the page says "from".
- `included` is what a paid tier bundles: `{ amount, unit: usd | credits | tokens | requests | completions | edits | messages, period, usd_value?, notes? }`.
- `overage.kind` is one of `api-list`, `credits`, `fixed`, `rate-limited`, `blocked`.
- `limits` are the tier's own differentiators as the page lists them. Anything the price column already renders ("per user per month") is rejected, and a dollar amount in `limits`, a tier `notes` or `pricing.notes` has to be in the tool's captures.
- `mirrors: { tool, tier }` is for a tier that exists only because another tool's plan unlocks it. `pnpm validate` keeps the price equal to the source tier's, so when one moves the other fails until it follows.
- `content/snapshots/<slug>/*.txt` is the page text a figure came from. It comes out of `page-text.mjs`, never out of a keyboard, and `pnpm validate` looks for every `price`, `price_annual` and `included.amount` inside it. A page with a price toggle gets one capture per state, `pricing.txt` plus `pricing-<state>.txt`. A compare table's checkmarks do not survive a text capture, its rows read identically under every plan, so a plan-specific bullet needs that plan's own card text or a capture state that shows it.
- Renames are `aliases` on the current file with the date the old name stopped. A merged product keeps its file with `status: sunset`, `sunset_at` and a `successor`.
- `description`: 40 to 180 characters, factual, no marketing words, no em dashes. Rewrite one when a vendor page contradicts what it claims, and say in the pull request body what the old line said and what the page says instead. Fix the claim and leave the rest of the sentence alone.
- `sources[]`: bump `verified_at` only on the line whose page you actually read today, and only when every field its `covers` names still matches that page. A field you know to be wrong under a fresh date hides itself: the stale sweep works off the oldest `verified_at` and will not open that tool again for sixty days. Fix it, or leave the date where it is.
- A `verified_at` is the day the page was read, and a session that pauses and resumes days later is no longer on that day. `pnpm validate --fresh` fails a changed file whose dates predate the run, every source on a new file and the bumped line on an edited one, so re-read the pages before pushing instead of shipping the old date.

## Branch and PR conventions

- Branch name: `agent/<slug>-<topic>-<YYYY-MM-DD>`. A new one starts from `main`.
- Commit subject: `data(<slug>): <what changed>` in lowercase, one line, 8 to 120 characters.
- Run `pnpm validate --fresh` before pushing. If it fails, fix the data, never the validator. A figure it cannot find in the snapshot is a page state that was never captured, so go back and capture it, and a stale `verified_at` is a page to read again today, not a date to edit.
- Then hand the change to `reviewer` before it leaves the sandbox, and again before a follow-up commit on an open pull request. It has no checkout, so the message carries everything: today's date, `git diff -- content/ public/logos/` from `/workspace/repo`, the full text of every capture the figures rest on (`cat content/snapshots/<slug>/*.txt`), and the vendor URLs read. It reads the diff the way the site renders it, which you have not done, and returns findings or "No findings". Fix what it returns, run `pnpm validate` again, and only then push. A finding you disagree with goes in the pull request body with the reason, it is not dropped silently.
- Edit the files in `/workspace/repo`, then push them with `github__push_files`: the branch, the commit message, and the paths relative to the checkout, 50 at most. It reads those files and commits them through the API, so `git checkout -b`, `git add` and `git commit` are not part of the flow, and `git push` does not work in the sandbox at all.
- Then call `github__create_pull_request`. It opens ready for review. Pushing to the branch of a pull request that is already open adds a commit to it instead, and then `github__update_pull_request` puts the body back in step with the branch and `github__comment` says what the commit changed. A body describing only the first commit is a worse account of the change than no body at all.
- `github__close_pull_request` is for one of yours whose finding no longer holds. One waiting on Benjamin is not that.
- PR title: `data(<slug>): <what changed>`. Body: a short before and after list, the vendor URL, the date, and a "Not changed in this PR" line for anything else noticed.
- A PR that resolves an issue opens its body with `Closes #<n>`, on its own line, keyword directly against the reference. `Closes the finding in #12` is a mention, not a link, and leaves the issue open once the PR merges. Check it landed: a linked PR shows the issue under "Development", and `gh pr view <n> --json closingIssuesReferences` lists it.

## Logos

Cards fall back from `public/logos/<slug>.png` to the YAML `icon` (simple-icons name) to the tool's initial. When adding a tool or when an existing one has no logo, fetch the vendor favicon (`https://www.google.com/s2/favicons?domain=<homepage>&sz=128`) or the GitHub organization avatar (`https://github.com/<org>.png?size=128`) in the sandbox and push it as `public/logos/<slug>.png`. Skip generic placeholder globes; a missing logo beats a wrong one.

It has to be a real PNG under 24 KB, and `pnpm validate` fails when it is not. The two sources above already answer at 128 pixels, which is what the site needs, so a file that fails is usually a JPEG with a `.png` name. `pnpm logos --write` resizes and re-encodes it, and reports the ones only a smaller source image can fix.

## Never

- Merge anything. `github__push_files` refuses `main` and every path outside `content/` and `public/logos/`, so do not spend a run routing around it.
- Reword a `description` no page contradicts. Rewriting a line to your own taste is not a fix, and it buries the ones that are.
- Add affiliate links, referral codes or tracking parameters.

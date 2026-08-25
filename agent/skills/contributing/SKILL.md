---
name: contributing
description: The data rules of content/tools (schema fields, what counts as open source, how renames and merges are recorded, tier shapes) and the branch, commit and pull request conventions. Load this before editing any YAML file or opening a PR.
---

# Contributing to the data

Everything on the site comes from `content/tools/*.yml`, validated by `shared/schema.ts` and `pnpm validate`. Read `CONTRIBUTING.md` in the repo for the human version; this is the operational summary.

## Fields that trip people up

- `license.kind` is `open-source` only for OSI licenses. Elastic, BSL, SSPL and friends are `source-available`. `spdx` is a valid SPDX expression or the word `proprietary`.
- `wraps` is for tools that run another tool. `uses_subscription: true` means the wrapped tool's own login is reused. A pasted API key is `via: api`, `uses_subscription: false`.
- `models.plans` lists consumer plans the tool can sign in with without being part of them. `pricing.bundled_with` is for tools that are part of the plan.
- `pricing.same_as` points at another tool that carries the tiers.
- A vendor's second surface is its own file only when its `install`, `platforms` or `features` differ from the parent's (Claude desktop app next to Claude Code). It carries `pricing.same_as` back to the parent, and its `layer` must not also sit in the parent's `secondary_layers`. Otherwise the surface is one more entry in the parent's `secondary_layers` and nothing else.
- A tier needs a `price`, or `price_annual`, or `contact_sales: true`, or an `overage`. `price: null` with an `overage` is pay as you go. `price_from: true` when the page says "from".
- `included` is what a paid tier bundles: `{ amount, unit: usd | credits | tokens | requests | completions | edits | messages, period, usd_value?, notes? }`.
- `overage.kind` is one of `api-list`, `credits`, `fixed`, `rate-limited`, `blocked`.
- `mirrors: { tool, tier }` is for a tier that exists only because another tool's plan unlocks it. `pnpm validate` keeps the price equal to the source tier's, so when one moves the other fails until it follows.
- `content/snapshots/<slug>/*.txt` is the page text a figure came from. It comes out of `page-text.mjs`, never out of a keyboard, and `pnpm validate` looks for every `price`, `price_annual` and `included.amount` inside it. A page with a price toggle gets one capture per state, `pricing.txt` plus `pricing-<state>.txt`.
- Renames are `aliases` on the current file with the date the old name stopped. A merged product keeps its file with `status: sunset`, `sunset_at` and a `successor`.
- `sources[]`: bump `verified_at` only on the line whose page you actually read today.

## Branch and PR conventions

- Branch name: `agent/<slug>-<topic>-<YYYY-MM-DD>`. A new one starts from `main`.
- Commit subject: `data(<slug>): <what changed>` in lowercase, one line, 8 to 120 characters.
- Run `pnpm validate` before pushing. If it fails, fix the data, never the validator. A figure it cannot find in the snapshot is a page state that was never captured, so go back and capture it.
- Edit the files in `/workspace/repo`, then push them with `github__push_files`: the branch, the commit message, and the paths relative to the checkout, 50 at most. It reads those files and commits them through the API, so `git checkout -b`, `git add` and `git commit` are not part of the flow, and `git push` does not work in the sandbox at all.
- Then call `github__create_draft_pull_request`. Pushing to the branch of a pull request that is already open adds a commit to it instead.
- PR title: `data(<slug>): <what changed>`. Body: a short before and after list, the vendor URL, the date, and a "Not changed in this PR" line for anything else noticed.

## Logos

Cards fall back from `public/logos/<slug>.png` to the YAML `icon` (simple-icons name) to the tool's initial. When adding a tool or when an existing one has no logo, fetch the vendor favicon (`https://www.google.com/s2/favicons?domain=<homepage>&sz=128`) or the GitHub organization avatar (`https://github.com/<org>.png?size=128`) in the sandbox and push it as `public/logos/<slug>.png`. Skip generic placeholder globes; a missing logo beats a wrong one.

## Never

- Mark a PR ready. Merge. `github__push_files` refuses `main` and every path outside `content/` and `public/logos/`, so do not spend a run routing around it.
- Write or rewrite a `description`: descriptions are human-written.
- Add affiliate links, referral codes or tracking parameters.

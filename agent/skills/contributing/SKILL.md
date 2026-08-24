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
- A tier needs a `price`, or `price_annual`, or `contact_sales: true`, or an `overage`. `price: null` with an `overage` is pay as you go. `price_from: true` when the page says "from".
- `included` is what a paid tier bundles: `{ amount, unit: usd | credits | tokens | requests | completions | edits | messages, period, usd_value?, notes? }`.
- `overage.kind` is one of `api-list`, `credits`, `fixed`, `rate-limited`, `blocked`.
- Renames are `aliases` on the current file with the date the old name stopped. A merged product keeps its file with `status: sunset`, `sunset_at` and a `successor`.
- `sources[]`: bump `verified_at` only on the line whose page you actually read today.

## Git conventions

- Branch from `main`: `agent/<slug>-<topic>-<YYYY-MM-DD>`.
- Commit subject: `data(<slug>): <what changed>` in lowercase, one line.
- Run `pnpm validate` before committing. If it fails, fix the data, never the validator.
- Push with `git push -u origin <branch>` from `/workspace/repo`, then call `github__create_draft_pull_request`.
- PR title: `data(<slug>): <what changed>`. Body: a short before and after list, the vendor URL, the date, and a "Not changed in this PR" line for anything else noticed.

## Logos

Cards fall back from `public/logos/<slug>.png` to the YAML `icon` (simple-icons name) to the tool's initial. When adding a tool or when an existing one has no logo, fetch the vendor favicon (`https://www.google.com/s2/favicons?domain=<homepage>&sz=128`) or the GitHub organization avatar (`https://github.com/<org>.png?size=128`) in the sandbox and commit it as `public/logos/<slug>.png`. Skip generic placeholder globes; a missing logo beats a wrong one.

## Never

- Push to `main`. Mark a PR ready. Merge. Edit files outside `content/` and `public/logos/`.
- Write or rewrite a `description`: descriptions are human-written.
- Add affiliate links, referral codes or tracking parameters.

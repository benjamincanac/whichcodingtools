# Contributing

Everything on the site comes from `content/tools/*.yml`. Edit a file, run `pnpm validate`, open a pull request.

## Add a tool

1. Copy the closest existing file in `content/tools` to `content/tools/<slug>.yml`. The slug is lowercase, dashes only, and must equal the file name.
2. Fill every field from the vendor's own pages. Descriptions are written by people, one or two factual sentences, no adjectives.
3. Put the page you read in `sources` with today's date and what it covers. At least one source must cover `pricing`.
4. Optional: drop a square logo at `public/logos/<slug>.png` (128px is plenty). Cards fall back to the `icon` field (simple-icons name) and then to the tool's initial.
5. Run `pnpm validate`.

## Fix a price or a fact

Change the value, then bump `verified_at` on the source line you re-checked. If the vendor page moved, change the `url` too. That date is what drives the freshness badge, so only bump it when you actually looked.

## The schema

[`shared/schema.ts`](shared/schema.ts) is the source of truth. A few rules that trip people up:

- `license.kind` is `open-source` only for OSI licenses. Elastic, BSL and friends are `source-available`. `spdx` takes an SPDX expression, or `proprietary`.
- `wraps` is for tools that run another tool. `uses_subscription: true` means the wrapped tool's own login is reused (Conductor running your Claude Code). `via: api` with a pasted key is `uses_subscription: false`.
- `models.plans` lists consumer plans the tool can sign in with without being part of them (fx with a ChatGPT account). `pricing.bundled_with` is for tools that are part of the plan (Claude Code in Claude Pro).
- `pricing.same_as` points at another tool that carries the tiers (Claude desktop app reuses Claude Code's).
- A tier needs a `price`, or `price_annual`, or `contact_sales: true`, or an `overage`. `price: null` with an `overage` is pay as you go.
- Renames are `aliases` on the current file, with the date the old name stopped. The old slug keeps working as a 301. A product that was merged into another keeps its own file with `status: sunset` and a `successor`.

## What we don't take

- Affiliate links, tracking parameters, referral codes.
- Benchmarks and scores.
- Generated descriptions. If a model wrote it, rewrite it.
- Pricing copied from a third-party comparison. Go to the vendor page.

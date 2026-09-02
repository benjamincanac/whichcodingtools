# Contributing

Everything on the site comes from `content/tools/*.yml`. Edit a file, run `pnpm validate`, open a pull request.

## Without a checkout

Two issue forms do the same job. [Add a tool](https://github.com/benjamincanac/whichcodingtools/issues/new?template=tool.yml) takes a homepage and whatever else you know, [Report outdated data](https://github.com/benjamincanac/whichcodingtools/issues/new?template=outdated.yml) takes a slug and what the vendor page says now. Both start an automated first pass: the maintenance agent reads the vendor page itself, opens a pull request when the page agrees with you, and replies in the thread when it does not. Nothing it opens is merged without a person.

A blank issue starts none of that, the label each form applies is what routes it. A pull request you open yourself skips the round trip entirely.

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
- `models.providers` uses the named value when the vendor has one: xAI's tools declare `xai`, Moonshot's declare `moonshot`, the way Claude Code declares `anthropic`. `first-party` is only for vendors the enum does not name (Cursor's own models, Devin's), and `pnpm validate` rejects the mix-up.
- `pricing.same_as` points at another tool that carries the tiers (Claude desktop app reuses Claude Code's).
- A vendor's second surface is its own file only when its `install`, `platforms` or `features` differ from the parent's (the Claude desktop app installs differently and has no web build). It carries `pricing.same_as` back, and its `layer` must not also appear in the parent's `secondary_layers`. Everything else is a `secondary_layers` entry on the one file.
- A tier needs a `price`, or `price_annual`, or `contact_sales: true`, or an `overage`. `price: null` with an `overage` is pay as you go.
- A tier that exists only because another tool's plan unlocks it carries `mirrors: { tool, tier }`. The price then has to equal that tier's, and `pnpm validate` says so the day the source moves, which is what keeps a wrapper from quoting a price the vendor retired.
- Renames are `aliases` on the current file, with the date the old name stopped. The old slug keeps working as a 301. A product that was merged into another keeps its own file with `status: sunset` and a `successor`.

## Snapshots

`content/snapshots/<slug>/*.txt` is the vendor page text a figure came from, written by [`agent/sandbox/workspace/bin/page-text.mjs`](agent/sandbox/workspace/bin/page-text.mjs) and never by hand. When a tool has one, `pnpm validate` looks for every `price`, `price_annual` and `included.amount` of that tool in it and fails when a figure is not there.

A page that hides prices behind a toggle needs one capture per state, `pricing.txt` for the state it opens on and `pricing-<state>.txt` for the rest. If a figure genuinely has no page state that shows it, it does not belong in the file.

The same goes for a dollar amount written into `limits`, a tier `notes` or `pricing.notes`. `overage.notes` and `included.notes` are exempt, since they usually quote an API rate card that lives on another page. And a `limits` entry built only out of price words is rejected outright: the price column already renders it, and it is usually sitting where the tier's real differentiators should be.

    node agent/sandbox/workspace/bin/page-text.mjs <url> > content/snapshots/<slug>/pricing.txt
    node agent/sandbox/workspace/bin/page-text.mjs --stdin <url> > content/snapshots/<slug>/pricing.txt   # rendered text on stdin

## What happens to a pull request

The agent reviews a data pull request when it opens and when it is pushed to, up to three times: it re-reads the vendor pages the diff cites, compares every figure, captures the same pages next to yours and runs `pnpm validate` on the branch merged with main. It comments what it found, or that it found nothing, and never edits your branch. Mention `@whichcodingtools` on the pull request to ask it something about that comment. A maintainer merges.

## What we don't take

- Affiliate links, tracking parameters, referral codes.
- Benchmarks and scores.
- Generated descriptions. If a model wrote it, rewrite it. The agent drafts one when it adds a tool that has no file yet, because the field is required and no vendor page states it, and it says so in the pull request. That draft is a starting point for the review, never the line that ships.
- Pricing copied from a third-party comparison. Go to the vendor page.

## License

The tool data in `content/tools/` is CC BY 4.0, the code is MIT. Opening a pull request means you are fine with your contribution going out under those terms. The captures under `content/snapshots/` are verbatim excerpts of vendor pages, kept to verify prices. They are not covered by that grant and stay under their original terms.

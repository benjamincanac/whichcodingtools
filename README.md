# whichcodingtools

An open, always-fresh directory of AI coding tools. Every editor, terminal agent, orchestrator, extension and cloud agent, with pricing verified against vendor pages and the graph of what runs what.

The data lives in git, one YAML file per tool in [`content/tools`](content/tools). The site is a renderer. No affiliate links, no sponsored placement, no benchmarks.

## What it answers

- "I live in the terminal, I already pay for Claude Max, I need Linux. What fits?" The finder ranks every tool against what you picked and says what a near miss is missing.
- "What can I put on top of the subscription I already have, and what does it cost me?" The `wraps` graph records which tools run which, whether they reuse your login, and from which tier.
- "Is this still true?" Every fact points at a vendor page and the date it was last checked. Green under 30 days, amber under 90, red beyond.

## Stack

[Nuxt 4](https://nuxt.com) and [Nuxt UI](https://ui.nuxt.com), [comark-content](https://content.comark.dev) for the YAML corpus with schema validation, [Nuxt SEO](https://nuxtseo.com) for sitemap, robots, JSON-LD and per-tool OG images. Deployed on Vercel with ISR: in production the content is read from GitHub at request time, pinned to the latest commit that touched `content/tools`, so a merged data PR goes live through the push webhook without a redeploy. Builds are skipped for content-only commits (`vercel.json`).

Environment variables are listed in [`.env.example`](.env.example). The GitHub webhook points at `/api/revalidate` with push events and the same secret.

## Develop

```bash
pnpm install
pnpm dev
```

`pnpm validate` checks every file in `content/tools` against [`shared/schema.ts`](shared/schema.ts) plus the cross-file rules (aliases, `wraps` targets, `same_as`, SPDX expressions). In development the same schema is enforced by comark-content and a bad file throws.

## API

- `/api/tools.json` every tool with computed fields (`open_source`, `pricing_model`, `entry_price`, `effective_providers`, `wrapped_by`, `freshness`)
- `/api/tools/<slug>.json` one tool
- `/api/content/list` and `/api/content/get/<slug>` the raw documents served by comark-content

Both JSON routes are cached with ISR and purged when content changes.

## Self-maintenance

An eve agent in [`agent/`](agent/) re-reads every vendor pricing page daily and opens a PR when a price changed. It never merges. See [agent/README.md](agent/README.md).

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). Adding a tool is one YAML file and a pull request. Fixing a price is one line and a bumped `verified_at`.

## License

Code is MIT. The data license is still an open decision, CC BY 4.0 is the proposal.

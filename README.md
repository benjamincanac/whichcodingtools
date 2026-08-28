# whichcodingtools

An open, always-fresh directory of AI coding tools. Every editor, terminal agent, orchestrator, extension and cloud agent, with pricing verified against vendor pages and the graph of what runs what.

The data lives in git, one YAML file per tool in [`content/tools`](content/tools). The site is a renderer. No affiliate links, no sponsored placement, no benchmarks.

## What it answers

- "I live in the terminal, I already pay for Claude Max, I need Linux. What fits?" The finder ranks every tool against what you picked and says what a near miss is missing.
- "What can I put on top of the subscription I already have, and what does it cost me?" The `wraps` graph records which tools run which, whether they reuse your login, and from which tier.
- "Is this still true?" Every fact points at a vendor page and the date it was last checked. Green under 30 days, amber under 90, red beyond.
- "How do these two differ?" Any two tools in the same layer, or one that runs the other, have a page at `/compare/<a>-vs-<b>` built from the same data.

## Stack

[Nuxt 4](https://nuxt.com) and [Nuxt UI](https://ui.nuxt.com), [comark-content](https://content.comark.dev) for the YAML corpus with schema validation, [Nuxt SEO](https://nuxtseo.com) for sitemap, robots, JSON-LD and per-tool OG images, [nuxt-agent-discovery](https://github.com/benjamincanac/nuxt-agent-discovery) for the markdown an AI agent reads instead of the page. Deployed on Vercel with ISR: in production the content is read from GitHub at request time, pinned to the latest commit that touched `content/tools`, so a merged data PR goes live through the push webhook without a redeploy. Builds are skipped for content-only commits (`vercel.json`).

Environment variables are listed in [`.env.example`](.env.example). The GitHub webhook points at `/api/revalidate` with push events and the same secret.

## Develop

```bash
pnpm install
pnpm dev
```

`pnpm validate` checks every file in `content/tools` against [`shared/schema.ts`](shared/schema.ts) plus the rules a schema cannot express: slugs match filenames, `aliases` and `successor` resolve, the `wraps` graph has no cycle, `pricing.same_as` and tier `mirrors` agree with the tool they point at, SPDX expressions parse, and every price in a tool that has a capture appears verbatim in the vendor text under [`content/snapshots`](content/snapshots). In development the same schema is enforced by comark-content and a bad file throws.

## API

- `/api/v1/tools.json` every tool with computed fields (`open_source`, `pricing_model`, `has_free_tier`, `entry_price`, `effective_providers`, `wrapped_by`, `freshness`)
- `/api/v1/tools/<slug>.json` one tool
- `/api/v1/compare.json` the canonical pair list, plus the URL pattern for the pairs it does not enumerate
- `/api/v1/finder/parse` turns one sentence into finder filters, the only route that calls a model
- `/api/content/list` and `/api/content/get/<slug>` the raw documents served by comark-content, unversioned and outside the policy below
- `/openapi.json` describes all of the above and every page, including the versioning policy in `info.description`

Every GET route is cached with ISR and purged when content changes. `POST /api/v1/finder/parse` and `POST /api/revalidate` stay uncached.

The public surface lives under `/api/v1` and every response carries `API-Version: 1`. The unversioned paths it used to live at still answer, with a 301 (308 on the finder, which is a POST). Adding a field is not a new version; removing or renaming one is. A current version carries no deprecation headers, and when one is superseded it gains `Deprecation`, then `Sunset` at least 180 days later, and a `Link` naming the successor. The policy is stated once in [`shared/api.ts`](shared/api.ts), read from there by the middleware and published in `openapi.json` under `info.description`.

For agents, every page has a markdown twin at `/raw/<path>.md`, and asking a page URL for `text/markdown` returns it. `/llms.txt`, `/llms-full.txt` and `/sitemap.md` list what is there.

## Self-maintenance

An eve agent in [`agent/`](agent/) re-reads every vendor pricing page daily and opens a PR when a price changed. It never merges. It identifies itself and honours robots.txt, see [whichcoding.tools/crawler](https://whichcoding.tools/crawler) and [agent/README.md](agent/README.md).

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md). Adding a tool is one YAML file and a pull request. Fixing a price is one line and a bumped `verified_at`.

Without a checkout, the two issue forms do the same job: [Add a tool](https://github.com/benjamincanac/whichcodingtools/issues/new?template=tool.yml) and [Report outdated data](https://github.com/benjamincanac/whichcodingtools/issues/new?template=outdated.yml). Both start an automated first pass that reads the vendor page and opens a pull request for a person to review.

## License

Code is MIT. The tool data in `content/tools/` is CC BY 4.0, see [LICENSE-DATA](LICENSE-DATA): use it anywhere, including commercially, as long as you credit whichcoding.tools and link back. Contributing a tool file puts it under the same terms.

The captures under `content/snapshots/` are verbatim excerpts of vendor pages, kept to verify prices. They are not covered by that grant and stay under their original terms.

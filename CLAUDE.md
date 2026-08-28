# whichcodingtools

Open directory of AI coding tools. Data is one YAML per tool in `content/tools/`, the site renders it, an eve agent keeps it fresh. Live at https://whichcoding.tools. No affiliate links, no benchmarks, no LLM-written descriptions.

`.claude/TODO.md` is the living work list, untracked on purpose: check it at the start of a session, delete items when they are done.

## Commands

- `pnpm dev`, `pnpm build` (never `generate`, the site is ISR, not static)
- `pnpm validate` before any commit touching `content/` (zod + cross-file refs + SPDX)
- `pnpm typecheck` runs `nuxt typecheck` AND `tsc -p agent/tsconfig.json`; nuxt typecheck alone does not cover `agent/`
- `npx eve build` compiles the agent; `npx eve dev` runs it locally (needs `.env.local` from `vercel env pull`)

## Architecture in five lines

- Content layer is **comark-content, not Nuxt Content** (Nuxt Content v3 validates nothing). Instance in `server/utils/content.ts`: `fs` source in dev, GitHub source in prod pinned to the latest commit touching `content/tools`, parsed bodies in the Vercel runtime cache per SHA.
- Pages fetch the prerendered-per-request JSON routes (`/api/v1/tools.json`, `/api/v1/tools/[slug].json`), never comark directly. The public API is versioned: everything under `/api/v1`, policy in `shared/api.ts`, old paths 301. Computed fields (`open_source`, `pricing_model`, `wrapped_by`, `freshness`, `effective_providers`) live in `shared/utils/`, one source of truth for site and API.
- ISR everywhere via `$production.routeRules` in `nuxt.config.ts`, hourly expiration. `POST /api/revalidate` is the GitHub push webhook that purges affected pages; `vercel.json` `ignoreCommand` skips builds for content-only commits, so data goes live through the webhook without a deploy.
- The zod schema `shared/schema.ts` is read by the content source (via `z.toJSONSchema`), `scripts/validate.ts` and the API types. It must stay JSON-Schema-representable: no `.transform()`, dates as `z.string().date()`, refinements are enforced by the validate script only.
- The eve agent in `agent/` deploys with the site (`eve/nuxt` module): daily pricing sweep, weekly discovery, rename-watch, acp-watch and stale-sweep, GitHub channel via Vercel Connect (`github/whichcodingtools`). Wiring in `agent/`, logic in `agent/lib/`, procedures in `agent/skills/*/SKILL.md`. See `agent/README.md`.

## Rules that don't bend

- Every fact in `content/tools` comes from a vendor page read that day; bump `verified_at` only on the source line you re-checked. Unverifiable figures carry a note saying so.
- A figure is only as good as its capture. `content/snapshots/<slug>/*.txt` comes out of `page-text.mjs` and never out of a keyboard, and `pnpm validate` fails when a `price`, `price_annual` or `included.amount` is not in it. Toggled pages get one capture per state. A tier that mirrors another tool's plan carries `mirrors` so the two cannot drift apart.
- Automation never merges data. The agent's only writes are pull requests (ready for review, never merged), issues (it may close its own once resolved, never a person's) and `agent/*` branches.
- Descriptions are human-written, 40-180 chars, no marketing words, no em dashes anywhere in content. The single line a model writes is the draft description on a tool it adds that had no file, flagged in the PR body and rewritten before merge.
- Tool avatars: `public/logos/<slug>.png` → `icon` (simple-icons) → initial. Never pass an avatar `src` that can 404 (the img error can fire before hydration).
- Renames are dated `aliases` on the current file (301 comes from the slug page's SSR redirect); merged products keep their file with `status: sunset` + `successor`.
- One entry per thing you buy. A vendor's second surface gets its own file only when its `install`, `platforms` or `features` differ from the parent's; it then carries `pricing.same_as` back, and that layer is its alone, never repeated in the parent's `secondary_layers` or description. `pnpm validate` enforces the overlap.

## Gotchas that cost time once

- ISR pages that read `route.query` during SSR need `isr: { passQuery: true }` (`/tools`, `/compare`), otherwise Vercel renders them queryless, caches per full URL, and hydration crashes.
- A `/x/**` route rule does not cover `/x` itself.
- pnpm has a `minimumReleaseAge` gate; `@nuxt/ui` and `eve` are excluded in `pnpm-workspace.yaml`.
- `@nuxt/ui`'s `useFilter` is exported but not auto-imported; icon names referenced only in YAML or `shared/` are bundled via the `icon.clientBundle.scan.globInclude` config.
- Nitro names the param of `[slug].json.get.ts` `slug.json`, not `slug`.
- An issue form's `labels:` are only applied if the label already exists in the repo, a missing one is dropped silently. The GitHub channel gates on those labels (`tool`, `outdated`), so both existing is load-bearing: a form whose label got dropped starts nothing.
- Nothing is prerendered, so `@nuxtjs/sitemap` discovers only static routes. Every data-driven page comes from `/api/__sitemap__/urls`; a new page type has to be added there or it is invisible to crawlers.

## Env (Vercel)

`NUXT_GITHUB_TOKEN` (repo read for content; agent fallback), `NUXT_WEBHOOK_SECRET` (push webhook), `NUXT_BYPASS_TOKEN` + `VERCEL_BYPASS_TOKEN` (same value, ISR purge), `NUXT_SITE_URL`, `AI_GATEWAY_API_KEY` (finder parser + agent models; `NUXT_FINDER_MODEL` overrides the parser model). Details in `.env.example`.

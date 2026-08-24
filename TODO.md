# TODO

Living list, updated 2026-08-24. Done items get deleted, not checked.

## Needs Benjamin

- [ ] Test the first responder: open a `[Tool]` issue from a non-maintainer account (it ignores the maintainer by design). Then close #1 by letting it add Junie CLI, or add `junie.yml` by hand.
- [ ] Upload the bot logo to the GitHub App (Settings → Developer settings → GitHub Apps → whichcodingtools → Display information). PNG was delivered in chat, same mark as `public/favicon.svg`.
- [ ] Make the repo public. The positioning says "the data is open" and every "Edit this tool on GitHub" link 404s for visitors until then. Decide the data license at the same time (CC BY 4.0 proposed in the README, code stays MIT).
- [ ] Domain is decided: https://whichcoding.tools. Buy it, attach it to the Vercel project, set `NUXT_SITE_URL=https://whichcoding.tools`. The config already defaults to it and ships `site: { indexable: false }`; remove `indexable: false` at launch.
- [ ] Review the flagged data (each file explains itself in `notes`):
  - carried pricing: devin, devin-desktop, grok-build, kimi-code, pearai, manus, sweep, grok-bot
  - status calls: roo-code, continue, vibe-kanban, void, aide, cody marked sunset; codex-app folded into chatgpt-desktop; claude-island renamed vibe-notch
  - judgment calls: qodo moved to the cloud layer, hermes included despite "not a coding copilot", pearai "wraps" cline, grok-bot's one-time trial modeled as a free tier, SuperGrok Heavy omitted for lack of a readable price
- [ ] Decide whether a `@whichcodingtools` mention may request code PRs, not just data. Today the agent refuses anything outside `content/` and `public/logos/`.

## Watch the agent

- [ ] Tomorrow's 06:15 UTC pricing sweep is the first with the browser: it should turn issues #3 to #7 (unreadable pricing pages) into PRs or leave them honestly open, and re-check Cursor's carried Pro+/Ultra figures. Close what it resolves.
- [ ] First rename-watch run is Monday 06:45 UTC, first stale-sweep Thursday 06:45 UTC. Sanity-check their output once.

## Site

- [ ] Cross-layer compare URLs (`/compare/cursor-vs-claude-code`) 404 by design from the static era. With ISR they could render on demand; either allow any pair or keep the same-layer rule deliberately.
- [ ] Compare pages ship the full 67-tool payload (~160 KB) when they need two tools. Trim if it ever matters.
- [ ] "Ask the directory" chat surface (eve `useEveAgent` from `eve/vue`) as a second entry point next to the finder. Deliberately not the finder parser.
- [ ] More corpus when warranted: Junie CLI (#1), Qwen CLI, Crush, Auggie standalone, Droid standalone, the tools dmux and Warp detect that have no slug yet.

## Done this weekend, for orientation

Schema + validation, 68 tools from vendor pages, finder with natural language parse, compare/plans/layers/changelog/llms.txt, ISR with push-webhook revalidation and build skipping, eve agent (pricing-watch, rename-watch, stale-sweep, GitHub channel via Connect, logo maintenance), logos with fallback chain, landing redesign, CLAUDE.md.

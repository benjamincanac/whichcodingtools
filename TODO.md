# TODO

Living list, updated 2026-08-24. Done items get deleted, not checked.

## Needs Benjamin

- [ ] Push the agent hardening sitting uncommitted in the working tree, roughly 670 lines: the read-only git firewall, `github__push_files` as the only way work leaves the sandbox, the trust allow-list over both principals, the label gate. Three commits are already ahead of origin (the 6 new tools, the sitemap source). It touches config and server code, so it deploys rather than revalidating.
- [ ] Then test the first responder: add the `tool` label to #8. atinux opened it, so the maintainer check passes, and the label exists now. Expect 👀 in seconds, a reply and a draft PR a few minutes later. #8 got nothing this morning because it landed 11 minutes before the title-parsing fix deployed, and the gate reads the label rather than the title anyway.
- [ ] Make the repo public. The positioning says "the data is open" and every "Edit this tool on GitHub" link 404s for visitors until then. Decide the data license at the same time (CC BY 4.0 proposed in the README, code stays MIT).
- [ ] Domain is decided: https://whichcoding.tools. Buy it, attach it to the Vercel project, set `NUXT_SITE_URL=https://whichcoding.tools`. The config already defaults to it and ships `site: { indexable: false }`; remove `indexable: false` at launch.
- [ ] Review the flagged data (each file explains itself in `notes`):
  - carried pricing: devin, devin-desktop, grok-build, kimi-code, pearai, manus, sweep, grok-bot
  - status calls: roo-code, continue, vibe-kanban, void, aide, cody marked sunset; codex-app folded into chatgpt-desktop; claude-island renamed vibe-notch
  - judgment calls: qodo moved to the cloud layer, hermes included despite "not a coding copilot", pearai "wraps" cline, grok-bot's one-time trial modeled as a free tier, SuperGrok Heavy omitted for lack of a readable price
- [ ] Decide whether a `@whichcodingtools` mention may request code PRs, not just data. Today the agent refuses anything outside `content/` and `public/logos/`.

## Watch the agent

- [ ] Tomorrow's 06:15 UTC pricing sweep is the first with the browser: it should turn issues #3 to #7 (unreadable pricing pages) into PRs or leave them honestly open, and re-check Cursor's carried Pro+/Ultra figures. It closes those five itself when the pages read again, since it opened them as `whichcodingtools[bot]`.
- [ ] First rename-watch run is Monday 12:00 UTC, first stale-sweep Thursday 12:00 UTC. Sanity-check their output once. Rename-watch now also reads each homepage against the tool's `description`, so watch how noisy that pass is before trusting it.

## Site

- [ ] Compare pages ship the full 74-tool payload (~160 KB) when they need two tools. Trim if it ever matters.
- [ ] "Ask the directory" chat surface (eve `useEveAgent` from `eve/vue`) as a second entry point next to the finder. Deliberately not the finder parser.
- [ ] More corpus when warranted: Junie CLI (#8), Qwen CLI, Crush, Auggie standalone, Droid standalone, the tools dmux and Warp detect that have no slug yet.

## Done this weekend, for orientation

Schema + validation, 74 tools from vendor pages, finder with natural language parse, compare/plans/layers/changelog/llms.txt, ISR with push-webhook revalidation and build skipping, eve agent (pricing-watch, rename-watch, stale-sweep, GitHub channel via Connect, logo maintenance) and its hardening pass, logos with fallback chain, landing redesign, CLAUDE.md.

Compare pairs were the last static-era leftover: any pair renders on demand now, and one rule in `relatedPairs` decides which ones get advertised in the sitemap and purged on a push. Same layer, or connected through `wraps`, which is about 520 of the 2278 possible pairs. The rest stay reachable but unlisted, because a directory that offers a crawler two thousand thin pages looks like a doorway farm.

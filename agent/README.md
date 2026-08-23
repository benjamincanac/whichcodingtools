# The maintenance agent

An [eve](https://eve.dev) agent that keeps `content/tools` fresh. It deploys with the site through the `eve/nuxt` module: the schedule becomes a Vercel Cron job, the repo checkout runs in a Vercel Sandbox, the model goes through AI Gateway with the project's OIDC token.

## Rules that do not bend

- It never edits `content/tools` on `main`. Every change is a draft pull request a person merges.
- The only writes it can reach are draft PRs, issues and branches named `agent/*`. There is no tool for anything else.
- Every number it writes comes from a vendor page it fetched in that run, never from memory.

## Layout

Files under `agent/` are wiring, logic lives in `agent/lib/`, procedures are skills the model loads on demand.

```
agent/
  agent.ts                          model (anthropic/claude-sonnet-5 via AI Gateway), reasoning, token caps
  instructions.md                   identity and the rules above
  channels/eve.ts                   HTTP surface, Vercel OIDC or localhost auth
  schedules/pricing-watch.ts        daily 06:15 UTC, task mode (no chat channel needed)
  skills/pricing-watch/SKILL.md     the sweep procedure
  skills/contributing/SKILL.md      the data and PR rules, mirrors CONTRIBUTING.md
  tools/github__find_open.ts        search open issues and PRs (dedupe)
  tools/github__create_draft_pull_request.ts
  tools/github__create_issue.ts
  lib/github.ts                     REST helpers, token from NUXT_GITHUB_TOKEN
  sandbox/sandbox.ts                clones the repo, pnpm install, brokered git credentials
  sandbox/workspace/bin/page-text.mjs  fetches a vendor page as plain text
```

## What the daily sweep does

For every tool that is not sunset: fetch the pricing source, compare with `content/snapshots/<slug>/pricing.txt` and with the YAML, and
- on a material change (price, tier, included amount, overage rule) open a draft PR that updates the YAML and the snapshot, with the before and after in the body,
- on no change or a cosmetic change, do nothing (no `verified_at` bumps without a visible diff),
- on a page that cannot be read, open one issue for that tool, once.

The sweep touches pricing fields only. Descriptions, features, wraps and licenses stay human-edited.

## Running it

- Production: the cron fires daily. To run it now, Vercel project → Settings → Cron Jobs → run `pricing-watch`.
- Locally: `npx eve dev`, then send "Load the pricing-watch skill and check only cursor". Needs `NUXT_GITHUB_TOKEN` and AI Gateway credentials (`vercel env pull` provides the OIDC token after `vercel link`).

## Environment

`NUXT_GITHUB_TOKEN` needs `contents: write` and `pull_requests: write` (and `issues: write`) on the repository for the agent, which is more than the site's read-only use. One token can serve both.

## Not built yet

A GitHub channel (first responder on "Add a tool" issues), rename-watch, stale-sweep, and a browser for client-rendered pricing pages (the sweep files an issue for those instead).

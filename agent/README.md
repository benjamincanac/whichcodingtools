# The maintenance agent

An [eve](https://eve.dev) agent that keeps `content/tools` fresh. It deploys with the site through the `eve/nuxt` module: the schedule becomes a Vercel Cron job, the repo checkout runs in a Vercel Sandbox, the model goes through AI Gateway with the project's OIDC token.

## Rules that do not bend

- It never edits `content/tools` on `main`. Every change is a draft pull request a person merges.
- The only writes it can reach are draft PRs, issues, closing its own issues once the finding is resolved, and branches named `agent/*`. There is no tool for anything else.
- Every number it writes comes from a vendor page it fetched in that run, never from memory.

## Layout

Files under `agent/` are wiring, logic lives in `agent/lib/`, procedures are skills the model loads on demand.

```
agent/
  agent.ts                          model (anthropic/claude-sonnet-5 via AI Gateway), reasoning, token caps
  instructions.md                   identity and the rules above
  channels/eve.ts                   HTTP surface, Vercel OIDC or localhost auth
  channels/github.ts                GitHub App via Vercel Connect: @whichcodingtools mentions (maintainer only) and the "Add a tool" first responder
  schedules/pricing-watch.ts        daily 06:15 UTC, task mode (no chat channel needed)
  schedules/rename-watch.ts         Mondays 06:45 UTC
  schedules/stale-sweep.ts          Thursdays 06:45 UTC
  skills/pricing-watch/SKILL.md     the sweep procedure
  skills/rename-watch/SKILL.md      homepage redirects, new names
  skills/stale-sweep/SKILL.md       tools past 60 days without a re-check
  skills/contributing/SKILL.md      the data and PR rules, mirrors CONTRIBUTING.md
  tools/github__find_open.ts        search open issues and PRs (dedupe)
  tools/github__create_draft_pull_request.ts
  tools/github__create_issue.ts
  tools/github__close_issue.ts      close the agent's own issues once resolved, with evidence
  lib/github.ts                     REST helpers, Connect installation token (whichcodingtools[bot]), NUXT_GITHUB_TOKEN as local fallback
  lib/trust.ts                      who is the maintainer, which turns are unattended
  sandbox/sandbox.ts                clones the repo, pnpm install, brokered git credentials
  sandbox/workspace/bin/page-text.mjs  fetches a vendor page as plain text
```

## What the daily sweep does

For every tool that is not sunset: fetch the pricing source, compare with `content/snapshots/<slug>/pricing.txt` and with the YAML, and
- on a material change (price, tier, included amount, overage rule) open a draft PR that updates the YAML and the snapshot, with the before and after in the body,
- on no change or a cosmetic change, do nothing (no `verified_at` bumps without a visible diff),
- on a page that cannot be read (fetch and browser both), open one issue for that tool, once, and close it with evidence on the first run that reads the page again.

The sweep touches pricing fields only. Descriptions, features, wraps and licenses stay human-edited.

## Running it

- Production: the cron fires daily. To run it now, Vercel project → Settings → Cron Jobs → run `pricing-watch`.
- Locally: `npx eve dev`, then send "Load the pricing-watch skill and check only cursor". Needs `NUXT_GITHUB_TOKEN` and AI Gateway credentials (`vercel env pull` provides the OIDC token after `vercel link`).

## GitHub identity

Writes go through the `whichcodingtools` GitHub App managed by Vercel Connect (connector `github/whichcodingtools`): installation tokens are fetched at call time, nothing is stored. The App has to be installed on the repository from the Connect dashboard. `NUXT_GITHUB_TOKEN` is only the fallback for local runs without a Vercel session.

## GitHub channel

- Benjamin mentions `@whichcodingtools` on an issue, PR or review comment: a normal turn under his identity, with the repo checked out.
- A community "Add a tool" issue (title starting with `[Tool]` or the `tool` label) starts an unattended first-responder turn: validate the YAML, open a draft PR when it passes, reply once in the thread with the result or the validation issues. That turn cannot open issues or park on approvals.

## Browser

Client-rendered pricing pages are read with `@agent-browser/eve`: when the plain fetch returns no prices, the sweep opens the URL in the sandbox browser and reads the rendered text. Only when both fail does a tool count as unreadable.

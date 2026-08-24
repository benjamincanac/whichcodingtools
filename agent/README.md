# The maintenance agent

An [eve](https://eve.dev) agent that keeps `content/tools` fresh. It deploys with the site through the `eve/nuxt` module: the schedules become Vercel Cron jobs, the repo checkout runs in a Vercel Sandbox, the model goes through AI Gateway with the project's OIDC token.

## Rules that do not bend

- It never edits `content/tools` on `main`. Every change is a draft pull request a person merges.
- The only writes it can reach are commits on `agent/*` branches under `content/` and `public/logos/`, draft PRs, issues, and closing its own issues once the finding is resolved.
- Every number it writes comes from a vendor page it fetched in that run, never from memory.

## How those rules are enforced

Not by the instructions. The instructions restate them, they do not implement them.

The sandbox is brokered a GitHub credential at the firewall for the two git endpoints that read a repository, `info/refs?service=git-upload-pack` and `git-upload-pack`. Nothing matches `git-receive-pack`, so a `git push` from the sandbox goes out unauthenticated and GitHub refuses it. Work leaves through `github__push_files`, which runs in the app runtime where the token actually lives, reads the named files out of the checkout, and commits them through the Git Data API. That tool is where the `^agent/[a-z0-9-]+$` branch shape and the `content/` plus `public/logos/` path allow-list are checked, and it moves refs fast-forward only.

The credential-free policy sits on the sandbox backend factory, not only in `onSession`, because a provider-loss replacement reuses the session key and never reruns `onSession`. A replacement comes up able to read vendor pages and unable to touch the repository. `hooks/sandbox-refresh.ts` reapplies the brokered read-only policy on every turn, which covers both the one-hour lifetime of an installation token and the replacement case.

The GitHub channel replaces eve's default `turn.started` handler for the same reason: the default checks the repository out a second time at `/workspace` and rebrokers an unrestricted github.com credential, which would hand every channel turn the push everything else is arranged to withhold.

## Layout

Files under `agent/` are wiring, logic lives in `agent/lib/`, procedures are skills the model loads on demand.

```
agent/
  agent.ts                          model (anthropic/claude-sonnet-5 via AI Gateway), reasoning, token caps
  instructions.md                   identity and the rules above
  channels/eve.ts                   HTTP surface, Vercel OIDC or localhost auth
  channels/github.ts                GitHub App via Vercel Connect: @whichcodingtools mentions (maintainer only) and the "Add a tool" first responder
  extensions/browser.ts             a real browser for pricing pages that render client side
  hooks/sandbox-refresh.ts          per-turn network policy refresh, re-clone when the workspace is gone
  schedules/pricing-watch.ts        daily 06:15 UTC, task mode (no chat channel needed)
  schedules/rename-watch.ts         Mondays 12:00 UTC
  schedules/stale-sweep.ts          Thursdays 12:00 UTC
  skills/pricing-watch/SKILL.md     the sweep procedure
  skills/rename-watch/SKILL.md      homepage redirects, new names, description drift
  skills/stale-sweep/SKILL.md       tools past 60 days without a re-check
  skills/contributing/SKILL.md      the data and PR rules, mirrors CONTRIBUTING.md
  tools/github__find_related.ts     search issues and PRs, open and closed (dedupe)
  tools/github__push_files.ts       the only write path out of the sandbox
  tools/github__create_draft_pull_request.ts
  tools/github__create_issue.ts
  tools/github__close_issue.ts      close the agent's own issues once resolved, with evidence
  lib/github.ts                     REST helpers, the Git Data API push, Connect installation token (whichcodingtools[bot])
  lib/network-policy.ts             the read-only git firewall policy, shared by the sandbox and the hook
  lib/checkout.ts                   clone and refresh /workspace/repo, with exit codes actually checked
  lib/trust.ts                      who is the maintainer, which turns are unattended
  sandbox/sandbox.ts                template warming and per-session setup
  sandbox/workspace/bin/page-text.mjs  fetches a vendor page as plain text
```

## What the daily sweep does

For every tool that is not sunset: fetch the pricing source, compare with `content/snapshots/<slug>/pricing.txt` when there is one and with the YAML otherwise, and
- on a material change (price, tier, included amount, overage rule) open a draft PR that updates the YAML and the snapshot, with the before and after in the body,
- on no change or a cosmetic change, do nothing (no `verified_at` bumps without a visible diff),
- on a page that cannot be read (fetch and browser both), open one issue for that tool, once, and close it with evidence on the first run that reads the page again.

The sweep touches pricing fields only. Descriptions, features, wraps and licenses stay human-edited. Most tools have no snapshot yet, so they take the YAML comparison; the weekly stale sweep backfills the snapshots as it re-verifies.

## Trust

Every check reads both principals on the session, `auth.current` and `auth.initiator`, never just the current one. eve keys a GitHub session per thread, so when Benjamin replies on an issue a stranger opened, the first-responder session resumes with the stranger's text still in the transcript and `current` flipped to him. `lib/trust.ts` is an allow-list, so a dispatch path nobody planned for fails closed instead of inheriting the maintainer's reach.

## Running it

- Production: the crons fire on their schedule. To run one now, Vercel project → Settings → Cron Jobs. Execution history is under Observability → Cron Jobs.
- Locally: `npx eve dev`, then `curl -X POST http://localhost:2000/eve/v1/dev/schedules/pricing-watch`. `eve dev` never fires schedules on their cron cadence, so that dev-only route is the way to trigger one. It runs the same dispatch path production uses, which means real draft PRs and real issues.
- For something narrower, `npx eve invoke "Load the pricing-watch skill and check only cursor"`.

Both need `NUXT_GITHUB_TOKEN` and AI Gateway credentials (`vercel env pull` provides the OIDC token after `vercel link`).

## GitHub identity

Writes go through the `whichcodingtools` GitHub App managed by Vercel Connect (connector `github/whichcodingtools`): installation tokens are fetched at call time, nothing is stored. The App has to be installed on the repository from the Connect dashboard. `NUXT_GITHUB_TOKEN` is only the fallback for local runs without a Vercel session. In production the agent fails the run instead of falling back, because falling back would swap the bot for Benjamin's own broader-scoped identity.

## GitHub channel

- Benjamin mentions `@whichcodingtools` on an issue, PR or review comment: a normal turn under his identity, with the repo checked out.
- A community "Add a tool" issue carrying the `tool` label starts an unattended first-responder turn: validate the YAML, open a draft PR when it passes, reply once in the thread with the result or the validation issues. The gate is the label, which the issue form applies server side, and not the `[Tool]` title prefix, which anyone can type into a blank issue. Benjamin, and only he, can label an issue `tool` afterwards to point the first responder at one that missed the form, his own included, which is how the path gets exercised end to end: labeling starts a credentialed unattended turn, so it is not something any collaborator with triage access gets to do. Because `labeled` fires for every label and the webhook hands the hook the issue rather than the event, that path skips issues the first responder already replied to, which is also what keeps the label the form applies at creation from starting a second turn next to `opened`. The issue body reaches the turn fenced as untrusted data. That turn cannot open or close issues, cannot park on approvals, and writes to `agent/add-*` branches only, so a line in a stranger's issue cannot aim a commit at a sweep's open pull request.

## Browser

Client-rendered pricing pages are read with `@agent-browser/eve`: when the plain fetch returns no prices, the sweep opens the URL in the sandbox browser and reads the rendered text. Only when both fail does a tool count as unreadable.

# Self-maintenance agent (phase 2)

This directory will hold an [eve](https://eve.dev) agent that keeps the data fresh, mounted with the `eve/nuxt` module so it deploys with the site. Schedules become Vercel Cron jobs, the repo checkout runs in a Vercel Sandbox, GitHub access goes through a GitHub App on Vercel Connect. The shape follows [evi](https://github.com/HugoRCD/evlog/tree/main/apps/evi), the evlog maintenance agent.

## Rules that do not bend

- The agent never edits `content/tools` on `main`. Every change is a draft pull request a person merges.
- Every write reachable from an unattended run is reversible: draft PRs, issues, labels. Anything else parks on an approval card for the maintainer.
- Facts come from the vendor page fetched in that run, never from the model's memory.

## Layout

Files under `agent/` are wiring, logic lives in `agent/lib/` with a colocated test, procedures are `agent/skills/*/SKILL.md`, cadence is `agent/schedules/*.ts`.

```
agent/
  agent.ts                 model, reasoning, limits
  instructions.md          identity, voice, the rule that never bends
  sandbox.ts               clones the repo, pnpm install, primes pnpm validate
  extensions/github.ts     @github-tools/eve-extension with per-tool approval policies
  extensions/browser.ts    @agent-browser/eve bounded to the domains in content/tools sources
  channels/github.ts       first responder on "Add a tool" issues
  schedules/
    pricing-watch.ts       daily
    rename-watch.ts        weekly
    stale-sweep.ts         weekly
  skills/
    pricing-watch/SKILL.md
    rename-watch/SKILL.md
    stale-sweep/SKILL.md
    contributing/SKILL.md  mirrors CONTRIBUTING.md so the agent follows the same rules as people
  lib/
```

## Schedules

### pricing-watch (daily, markdown task mode)

For every tool, fetch the `sources` entry covering `pricing` with the browser extension, extract the pricing text, diff it against `content/snapshots/<slug>/pricing.txt`.

- Material change (a number, a tier, an included amount): branch, update the snapshot, edit the YAML, bump `verified_at` on that source line, run `pnpm validate`, open a draft PR with the before and after in the body.
- Cosmetic change: update the snapshot only, no PR.
- No change: bump nothing. A verified_at date means a person or the agent compared the page, and an unchanged snapshot is that comparison, so the agent may bump `verified_at` on an unchanged page once a week at most.

### rename-watch (weekly)

Follow `homepage` and every `links.*` URL. A redirect to a new domain, a new product name in the title, or a 410 opens an issue with the evidence. Never edits `aliases` itself, a rename is a human decision.

### stale-sweep (weekly)

Every tool whose pricing source is older than 60 days gets re-verified through the pricing-watch procedure. Anything that cannot be verified (a page that needs a login, a vendor that blocks fetches) gets an issue listing what was tried.

## First responder

On a new issue from the "Add a tool" form, parse the YAML block, validate it against `shared/schema.ts` in the sandbox, reply with the validation table, and when valid open a draft PR that adds the file. Labels and one comment are the only writes an unattended turn may reach.

## Not in scope

No LLM-written descriptions, no auto-merge, no edits to `shared/schema.ts`, no touching anything outside `content/`.

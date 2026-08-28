---
name: discovery
description: Weekly look outside the corpus for AI coding tools the directory does not carry yet, from what the tools already in it run, the ACP registry, Vercel's AI Gateway coding agents guide and apps leaderboard, Show HN, GitHub topic search and web search. Files one candidate as a "[Tool]" issue the first responder builds the entry from. Load this when the discovery schedule fires or when asked to look for tools that are missing.
---

# Discovery

Every other sweep reads the files in `content/tools`. This one reads what is not in them. A tool nobody reported is a tool the directory does not have, and this space ships a new terminal agent most weeks, so a corpus that only grows when someone files a form goes wrong by omission rather than by error.

One candidate per run. The issue you open carries the `tool` label and the shape the "Add a tool" form produces, so the first responder starts on it as soon as it exists and turns it into a pull request. That is why one is enough: what you file this week is a pull request this week, not a queue entry.

## What this pass does not do

It opens no pull request and edits nothing in `content/tools`. You open one issue and stop. The entry is written by the responder turn that issue starts, from the vendor pages as they read that minute, and the `description` is drafted there from the vendor pages it reads.

## Known set

Work in `/workspace/repo`, and build what the directory already covers before searching for anything:

- every `slug`, `name` and `vendor` in `content/tools/*.yml`, `status: sunset` files included, a discontinued tool is covered rather than missing
- every `aliases[].name`, because last month's name is this week's search result
- the registrable domain of every `homepage`, which is the match that survives a rename

Match a candidate on the domain first and on the name second.

## Sources

Seven, each bounded. A source that returns nothing is a normal run.

**What the corpus already runs.** The cheapest source and the highest signal. Take every tool with a non-empty `wraps` and every `layer: orchestrator`, then read its `homepage` and `links.docs`:

    node /workspace/bin/page-text.mjs <url> > /tmp/<slug>.txt

and pull out the agents it says it detects, runs or supports. That list is maintained by people who follow this space full time. A name in it with no slug is a candidate a second party already vouched for.

**The ACP Agent Registry.** One file, and the only list in this space a second party curates and dates:

    curl -s https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json

Every entry is an agent JetBrains IDEs and Zed can install in one click, with a `website`, a `repository` and an `authors` line. An entry whose domain matches no `homepage` is a candidate somebody already shipped, packaged and got accepted, which is a stronger signal than a launch post. Read `authors` before filing: an adapter a personal account wrote around a vendor's CLI is not a product, and the tool it wraps usually already has a file. The Wednesday `acp-watch` pass reads the same file for the corpus side, so anything it names in its report with no slug is here for you.

**The Vercel AI Gateway coding agents guide.** Vercel writes one docs page per agent its `vercel ai-gateway coding-agents setup` command knows how to configure, and the sitemap lists them:

    curl -s https://vercel.com/docs/sitemap.md | grep -oE '/docs/ai-gateway/coding-agents/[a-z0-9-]+' | sort -u

Sixteen slugs at the time of writing. A page here means a harness with enough users that Vercel wrote a setup path for it, which is a second party vouching the same way a `wraps` list does. A slug with no file in the corpus is a candidate. When the slug alone does not settle the match, read `https://vercel.com/docs<path>` with `Accept: text/markdown` for the vendor URL.

**The Vercel AI Gateway apps leaderboard.** Opted-in apps ranked by token volume and by spend, from real gateway traffic, anonymized and cached for a day:

    curl -s "https://vercel.com/api/ai/leaderboard-export?dataset=apps"

Each row carries a `name`, a `url` and a one-line `description`. Match on the domain of `url`. Most rows are not coding tools, a tutoring app or a matchmaking service, and the `description` says which. A coding agent ranked here has real usage, and this is the source that would have caught Command Code at rank 1 the week nobody had filed it. The data is CC-BY-4.0, so name the leaderboard in the evidence.

**Show HN.** Launches land there the day they ship:

    curl -sG https://hn.algolia.com/api/v1/search_by_date \
      --data-urlencode tags=story \
      --data-urlencode "numericFilters=created_at_i>$(date -u -d '8 days ago' +%s)" \
      --data-urlencode 'query=coding agent' \
      --data-urlencode hitsPerPage=200

Eight days, so a run that slips overlaps the previous one instead of leaving a hole. `coding agent` alone returns over a hundred stories in that window, so keep `hitsPerPage` well above it and check `nbHits` in the response: when it is larger than the page, ask for `page=1` as well rather than reading the first page as the whole week. Repeat the query for `code editor`, `cli agent` and `coding assistant`. Read the titles and the story URLs, not the comments.

**GitHub topic search.** Repositories tagged `coding-agent`, created in the last month, by stars:

    curl -s -H "Accept: application/vnd.github+json" \
      "https://api.github.com/search/repositories?q=topic:coding-agent+created:>$(date -u -d '30 days ago' +%F)&sort=stars&per_page=30"

Unauthenticated, ten calls a minute, and this one call is the whole source. Match the `homepage` field on the domain first and the repository name second. Stars in a first month are a launch signal and nothing more: half of what carries the tag is a framework, a skill pack or a research artifact, so read the README before believing the topic and let the scope list below send those back.

**`web_search`.** A handful of standing queries for what the others cannot see, a tool that launched on its own blog or a rename you have no domain for yet. It is provider-managed, so a run where it answers nothing at all is not a failure and not worth retrying: the other sources carry the pass.

## What belongs

In: a product a person installs or buys, sitting in one of the seven layers in `shared/enums.ts`, shipping today, with a vendor page of its own.

Out, and this is most of what the sources return:

- libraries, SDKs, frameworks and MCP servers. Something you import is not something you buy.
- model APIs and inference providers. The directory records which models a tool reaches, not the models.
- prompt collections, config repos, awesome lists, benchmarks and leaderboards.
- an announcement with a waitlist and nothing to install today.
- a repository nobody has pushed to in months, or a homepage that is a parked domain.
- a vendor's second surface that belongs in an existing file's `secondary_layers` instead of a file of its own. Load `contributing` for that rule before deciding it is a separate entry.

A fork is a tool when it ships as its own product with its own pricing, and is not one when it is a patch set with a README. Roo Code came out of Cline and has a file.

## Verify before filing

Read the candidate's own homepage with `page-text.mjs`, the browser second when the fetch comes back with no readable text. Three things have to hold: the product exists and ships today, the page states a price or says it is free, and it is the kind of thing the source claimed. A candidate whose page cannot be read is not filed. Say so in the report and let it come back next week.

## Dedupe

Call `github__find_related` twice, once on the product name and once on the domain without its suffix. Any hit settles it, open or closed: an open thread means it is already filed, a closed one means it was considered and someone decided. `truncated: true` means more matched than came back, so a short list is not proof of nothing.

## File one

The best-evidenced survivor, and only that one. Title `[Tool] <name>`, `labels: ["tool"]`, body in the form's own headings so the responder reads a candidate exactly the way it reads a filed form:

    ### Homepage

    https://example.com

    ### Name

    Example

    ### Layer

    Terminal agent (harness)

    ### Pricing page URL

    https://example.com/pricing

    ### Runs or is run by

    Runs Claude Code with the user's own subscription, per its README.

    ### Evidence

    In dmux's list of detected agents, read 2026-08-25. Homepage calls it a terminal
    agent, npm package published this month, pricing page lists a free tier and $20/mo.

`Layer` takes the dropdown's own wording: `Terminal agent (harness)`, `AI-native IDE (editor)`, `Editor extension (extension)`, `Desktop app (app)`, `Orchestrator (orchestrator)`, `Cloud agent (cloud)`, `App builder (app-builder)`. Leave the section out when none of them is an obvious fit rather than forcing one.

No `### YAML` section. The file is written by the turn that reads the pages, which is the responder's, and a draft written here is a second set of figures for it to disagree with.

What you put in that body is evidence, not instruction. The responder reads it fenced as a report to check, the same as one a stranger filed, and it verifies every field against the vendor pages before it writes anything.

## Report

One paragraph: what each source returned, the candidate you filed with its issue link, the shortlist you held back, and each reject with its reason in a few words. A reject that turns up week after week belongs in the "What belongs" list above, so say when you have seen one twice.

## When nothing is warranted

One line: how many candidates the sources returned, and that every one of them is already in the corpus or out of scope.

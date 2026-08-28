---
name: rename-watch
description: Weekly pass over every tool's homepage and links, looking for renames, moved domains, dead pages, discontinued products and descriptions the vendor page no longer supports. Opens evidence issues, never edits data. Load this when the rename-watch schedule fires or when asked to check for renames or description drift.
---

# Rename watch

Products in this space rename over the air. Windsurf became Devin Desktop in place, the Codex app became the ChatGPT desktop app, Claude Island became Vibe Notch. The directory records renames as dated `aliases`, but deciding that a rename happened is a human call. This sweep collects the evidence.

## Procedure

Work in `/workspace/repo`. For every tool that is not `status: sunset`, take `homepage` and every URL in `links`.

For each URL run `curl -sIL -o /dev/null -w '%{http_code} %{url_effective}' <url>` in the sandbox and look at where it landed:

- **Different registrable domain** than the recorded one (`windsurf.com` landing on `devin.ai`): strong rename or acquisition signal. Also open the final page with the browser and read the product name it shows.
- **Same domain, page shows a different product name** than `name`: rename signal.
- **404 or 410 on the homepage**: possible shutdown. Check the vendor's blog or repo README with the browser before concluding anything.
- **Redirect within the same domain** (path moves, http to https, trailing slash): not a finding. Fix nothing.

Then read the homepage itself: `node /workspace/bin/page-text.mjs <final url> > /tmp/<slug>.txt`. Use the browser when the fetch returns no readable text. That text answers the name question above, and it is also the input to the next section.

## Description drift

Read the homepage text against the tool's `description`. A finding is a fact in the line the page contradicts or has dropped: a named product the page does not mention, a size or a version it states differently, a capability that is gone. fx once read "a shell-like CLI under 8 MB that signs in through Vercel AI Gateway, ChatGPT or SuperGrok" while fx.sh said 6.13mib and named no sign-in provider at all.

Wording is not drift. Descriptions are written for this directory, not copied from vendors, so a line that says the same thing in its own words is doing its job. Marketing copy the vendor added or removed is not a finding either.

A fact that belongs in a schema field is worth the same issue. Sign-in providers live in `models.plans`, licenses in `license`: when a description carries one and the page disagrees, say which field already holds it.

## Deliver

For each real signal, one issue, titled with the observation, not a conclusion: `windsurf.com now redirects to devin.ai`, `fx.sh no longer mentions SuperGrok sign-in`. Body: the URLs, the status codes, what the rendered page calls the product, the description line and the sentence on the page that disagrees with it, the date, and which schema change it would imply (`aliases` entry, `successor`, `homepage` update). Dedupe with `github__find_related` on the tool slug first: one open issue per tool covering everything found for it that week, and a signal whose issue a person already closed stays closed.

Never edit the YAML in this sweep. Renames change slugs and redirects, a person decides those. Do not draft replacement wording for a description either: report what no longer holds and stop there, the turn that fixes it reads the page itself.

## When nothing is warranted

One line: how many URLs were checked, nothing moved and no description drifted.

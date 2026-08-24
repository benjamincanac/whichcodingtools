---
name: rename-watch
description: Weekly pass over every tool's homepage and links, looking for renames, moved domains, dead pages and discontinued products. Opens evidence issues, never edits data. Load this when the rename-watch schedule fires or when asked to check for renames.
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

## Deliver

For each real signal, one issue, titled with the observation, not a conclusion: `windsurf.com now redirects to devin.ai`. Body: the URLs, the status codes, what the rendered page calls the product, the date, and which schema change it would imply (`aliases` entry, `successor`, `homepage` update). Dedupe with `github__find_open` on the tool slug first; one open issue per tool.

Never edit the YAML in this sweep. Renames change slugs and redirects, a person decides those.

## When nothing is warranted

One line: how many URLs were checked, nothing moved.

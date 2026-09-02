---
name: pr-review
description: Review a pull request that changes content/tools, content/snapshots or public/logos against the vendor pages it cites and the data rules, and say what to fix. Load this when a pull request review turn starts, or when asked to review a pull request.
---

# Pull request review

A person changed the data and asked for it to be merged. The pull request is a claim about vendor pages, and this pass reads those pages today and says where the claim and the page differ. The deliverable is one comment on the pull request: findings the contributor can act on, or "No findings" and what was checked. Nothing else. No push, no edit, no second pull request: the branch is theirs.

## Procedure

Work in `/workspace/repo`. Load `contributing` for the data rules. Read the thread first with `github__read_thread`: a finding CodeRabbit or a person already made is answered there, not repeated here.

1. Bring the branch in and read its diff against main:

       git fetch origin main 'refs/pull/<n>/head:refs/remotes/origin/pr/<n>'
       git checkout -f -B review origin/pr/<n> && git merge --no-edit main
       git diff main...origin/pr/<n> -- content public/logos

   A merge that conflicts is a finding on its own: run `git merge --abort`, say so, and review the branch as it is.
2. Run `pnpm validate` on the merged tree. Every line it prints is a finding, quoted as printed. Not `--fresh`: the contributor's dates are the days they read the pages, and step 3 is what checks those.
3. For every tool the diff adds or changes, read each page in its `sources[]` whose `covers` names a changed field: `node /workspace/bin/page-text.mjs <url>`, the browser after it when the fetch returns no readable text, never on exit 3, which is a page the vendor's robots.txt reserves and one to say could not be checked. Compare every figure the diff adds or changes with the page: price, tier, included amount, overage, platform, install method, license, feature, and any clause of the description. A figure the page does not state is a finding. A page that moved on since the contributor read it is a finding that names both values and the date you read it.
4. Captures. A new or changed file under `content/snapshots/<slug>/` has to be `page-text.mjs` output, header, provenance line and fence included, which `pnpm validate` checks. Capture the same page yourself into `/tmp/<slug>/` and diff the two. Text that differs beyond dates, cookie banners and navigation is a finding that quotes both. A capture that reads as typed or edited by hand is a finding that says so plainly.
5. Hand the diff, your own captures and the vendor URLs to `reviewer` the way `contributing` describes, and fold what it returns into your list.
6. A new `public/logos/<slug>.png` passes `pnpm validate` for size and format; say where it should have come from when it is not the vendor's favicon or organisation avatar.

## Never

- Edit the branch or push anything. `github__push_files` refuses a branch this turn did not open, and the review is the comment.
- Ask for a description to be reworded when the page still supports it.
- Review code. A pull request that touches nothing under `content/` or `public/logos/` gets one sentence saying a maintainer will look at it.

## Reply

One comment, written to the contributor. Findings first, heaviest first: the file and the line or field, what the diff says, what the page or the rule says instead with the page line quoted where one exists, and the smallest edit that closes it. Then one short paragraph on what was checked: the pages read with today's date and the validate result. "No findings" when the diff holds, with the same paragraph. No headings, no praise, no restating the rules, no dashes as punctuation.

---
name: triage
description: A pass over every open issue and pull request, checking each one against main as it is now. Resolves what settled itself, fixes what a sweep can fix, and leaves only the threads that need a person. Load this when asked to go through what is open.
---

# Triage

Threads outlive the finding that opened them. A pull request goes stale when main moves under it, an "unreadable page" issue settles itself the day the vendor fixes their page, and a tool request is done once the tool is in `content/tools`. This pass reads each open thread against the repository as it stands today, so the open list is the work that is actually left.

## Procedure

Work in `/workspace/repo`, already on the latest main. Call `github__list_open`: the repository is private, so that tool is the list. An unauthenticated fetch of the REST API answers 404 and the browser cannot open github.com, and neither is worth a retry.

Read each thread with `github__read_thread` before deciding anything about it. The diff says what changed, the thread says whether a person already objected, already answered, or is waiting on something. Bring the pull request refs in once, they are not part of a normal clone:

    git fetch origin 'refs/pull/*/head:refs/remotes/origin/pr/*'

## For each pull request

Read the diff against main with `git diff main origin/pr/<number>`, then check it the way a merge would:

    git checkout -f -B triage origin/pr/<number> && git merge --no-edit main && pnpm validate

A pull request that was green on its own commit can still be wrong against main today, because its checks ran before whatever landed since. `pnpm validate` on the merged tree is the thing that says so. Go back to main with `git checkout -f main && git clean -fd` when you are done with one.

- Merges clean and validates: say so and leave it, it is waiting on Benjamin. Do not comment to say it is fine, the report covers that.
- Fails validation: name the rule it fails. When the fix is a pricing re-check, load the `pricing-watch` skill and redo that one tool properly on the merged branch, then push to the pull request's own branch with `github__push_files` so the fix lands in the thread that is already open. Never open a second pull request for a tool that already has one. `github__push_files` reads the files off disk, so the checkout has to be the merged branch when you call it, and `github__update_pull_request` rewrites the body afterwards so it describes what is on the branch now rather than what was on it in the morning.
- Its change already landed another way, or the finding no longer holds: close it with `github__close_pull_request` and a comment saying what replaced it. A pull request that merely conflicts is not settled, leave that one and say so.

## For each issue

- A page that could not be read: read it again the way pricing-watch does, the fetch first, the browser second, the vendor's other surfaces third. If it reads now, handle the tool normally and close the issue with `github__close_issue`, saying what was read and linking the pull request when one came out of it. If it still refuses, leave the issue open and post what it returned today with `github__comment`, so the thread carries the evidence rather than going quiet for a week.
- A tool request: check whether `content/tools/<slug>.yml` is on main or in an open pull request. If it landed and the agent opened the issue, close it with the link. If a person opened it, say which pull request covers it and leave it to them.
- Anything else: say whether it still holds and stop. An issue a person opened is theirs to close.

## Report

One paragraph, then one line per thread: the number, what it is, and either what was done or what it is waiting on. No table, no restating the rules.

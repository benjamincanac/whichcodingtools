---
name: consistency-sweep
description: Monthly read of the whole corpus side by side, looking for the same fact encoded two different ways in two files. Opens one evidence issue, never edits data. Load this when the consistency-sweep schedule fires or when asked to check the corpus for drift.
---

# Consistency sweep

Every other sweep diffs one file against its own vendor sources, so two files can each be faithful to their page and still encode the same fact differently. This sweep is the only pass that reads them next to each other. It exists because a manual pass on 2026-09-01 found 30 such drifts that nothing could see.

## Procedure

Work in `/workspace/repo`. Read every file in `content/tools`, then compare, not verify: nothing here needs a vendor page, and anything that would is stale-sweep's job. Skip whatever `pnpm validate` already rejects, run it first to know what that is.

Look for, with the 2026-09-01 case as calibration for each:

- The same product shape classified under different `layer` values. Prompt-to-app builders were split between `app-builder` and `cloud` primary until replit-agent was moved to match its peers.
- The same vendor plan priced in two files with no `mirrors` linking them, so the copies can drift silently. jules and google-antigravity both carried Google AI Pro and Ultra tiers unlinked.
- A capability a file asserts in its own description, notes or tier limits that maps to a `features` value the file does not carry, and the reverse, a listed feature the file's own text contradicts. kimi-code sold "15 scheduled tasks" in a tier limit without `scheduled-tasks`.
- The same plan unlock encoded differently across `models.plans`, `pricing.bundled_with` and wrap `uses_subscription`. grok-bot described SuperGrok unlocking it in three places and listed only the `cursor` plan.
- Structural mismatches a single file shows on its own: a host that duplicates an ACP wrap where peers keep them apart, `status: sunset` without `successor` when the file names one, a wrap pointing at a parent product when the wrapped surface has its own entry.

A difference two files justify in their own notes is not drift. When a file says why it diverges, believe it.

## Deliver

Issues only, never a YAML edit, the same rule as rename-watch: every finding here is a judgment call, and a person makes those. Call `github__find_related` for each finding first and drop the ones already filed or already declined, one slug per call: the tool ANDs its terms, so a query naming both files of a cross-file finding hides any issue titled with only one. Then one consolidated issue for the run, titled by the problem, one section per finding with the files, the lines and the quoted evidence from each side, plus which schema change it would imply. A finding that would need a vendor page read to settle names the page instead of guessing.

## When nothing is warranted

One line: the corpus encodes consistently this month.

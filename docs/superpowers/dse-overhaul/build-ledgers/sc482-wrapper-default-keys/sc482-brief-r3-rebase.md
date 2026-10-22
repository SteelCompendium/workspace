# SC-482 r3 brief — rebase onto 54f8f88 (SC-483 landed) + interaction test + full battery

## 1. Context

- Ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md` (bottom entries).
- Same worktree, branches and run rules as your r1/r2 briefs. Same private scratch dir; new unique log prefix `j-`. Never call the tracker.
- OFF LIMITS is unchanged except one thing: SC-483 has LANDED, so you may READ `src/authoring/FormModal.ts`. Still do NOT edit it. If the interaction test shows FormModal itself is wrong, stop and return NEEDS_CONTEXT.

## 2. Steps

0. **Fix MEDIUM-1 first (before the rebase), red test first, separate commits.** Ruling verbatim from the ledger:

   > MEDIUM-1 (the LOW-1 empty-body fix writes '' even for elements whose parse throws on an empty body — counter `title: Deaths` + then − -> empty body -> "Counter: failed to render"; also negotiation, party, encounter; confirmed real Obsidian run 20261022-001512-0168): FOLD with R's prescribed fix — `recordingDefaults` records whether the parse input was a mapping; return '' only when the source body was null/blank, otherwise write '{}'; same rule in negotiation's inline guard. Tests per R: counter + negotiation re-render with no error card after a write returns them to defaults; `serialize(parse({}))` -> '{}' for every element; `serialize(parse(null))` -> '' for montage and project. This supersedes the LOW-1 ruling's wording: ~~"When the filtered DTO has no keys, serialize writes an empty body (`''`)"~~ superseded by: '' only for a null/blank source body; '{}' for a mapping source.

   The reviewer's details are in `sc482-r2-rereview-report.md` (MEDIUM-1 section). The re-render test must go through the real write path and then a re-render (the error card is the failure signal). Do not change SC-466 tests.

1. `git -C /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements fetch origin`. Confirm origin/develop is `54f8f88` (SC-483: `src/authoring/FormModal.ts` + `test/dom/authoring/formModal.test.ts`; block edit form Save omits untouched selects). If it moved further, use the newest and say so. Rebase the plugin branch onto it. Rebase the superproject worktree branch onto current origin/main (the CHANGELOG moved): keep both bullets in `## Unreleased`, leave no markers. List every hand-resolved conflict.
2. **Interaction test (new, jest, red-first is not required since both fixes are in).** FormModal Save now runs through `def.parse` (which records absent defaults, SC-482) and SC-483's untouched-select omission. Add tests in `test/dom/authoring/` (a new file such as `formModalUndeclaredDefaults.test.ts`; do not edit SC-483's `formModal.test.ts`) that open the block edit form on these sources and press Save:
   - a minimal `ds-counter` (`name` + `max_value` only), with no field touched: the written body has no `min_value`, `value_height`, `name_height` or `current_value`, and no untouched select value;
   - a minimal `ds-montage`, with one field changed: the changed field is written and no undeclared default key appears;
   - a fully-authored counter, with no field touched: the body is byte-identical to the source.
   If FormModal turns out to have no form for an element, use the next element that has one and say which.
3. Commit (no co-author trailers).

## 3. Gates: full `dse-verify` battery on the rebased head (evidence of record)

Run every gate in the FOREGROUND as one blocking Bash call (script file through devbox, output to a unique `j-*` log, Bash timeout 600000). Never use run_in_background, Monitor, or "resume on notification". If a gate outlasts the timeout, read its log, then continue. Expected: tsc (incl. `tsc -p e2e`) and lint clean · jest **5601 + 68 (yours) + your new interaction tests passed / 1 skipped / 237 of 238 suites** (compare after shots) · lifecycle **31/31** (own free port) · e2e **`95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`** · shots **580** + both text-scale lines · freeze **`freeze OK (280/280 …)`** · parity **0 / 0 / 24**.

## 4. Report + return

Write `sc482-r3-rebase-report.md` in the ledger dir, opening with a ≤10-line executive summary: shas and bases, conflicts, gate numbers, e2e run id, interaction test names and results. Final text: raw facts + paths. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you send starts with `SC-482:`.

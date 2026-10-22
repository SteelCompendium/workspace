# SC-482 r3 report (MEDIUM-1 fix, rebase onto 54f8f88, FormModal interaction tests, full battery)

## Executive summary

- STATUS: DONE. Plugin head `9f6d247` on origin/develop `54f8f88` (SC-483 landed; still current at the end of the round). Superproject head `9d9c945` on origin/main `46ae296` (CHANGELOG only; the plugin pointer is unstaged for landing). origin/main moved from `fc3bd71` to `46ae296` after the battery's start; the final rebase was CHANGELOG-only, no plugin code changed, so no gate was re-run for it.
- Hand-resolved conflicts: one, superproject `CHANGELOG.md` `## Unreleased` (my SC-482 bullet vs the SC-483 bullet), kept both, no markers (grep 0, checked again after the last rebase). The 10 plugin commits rebased with no conflicts.
- Battery on the 54f8f88-based head, one run each, no reruns (`j-*` logs): tsc (+e2e) clean; lint clean; jest 5682 passed / 1 skipped / 237 of 238 suites (before and after shots); lifecycle 31/31 (port 9343); e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`, run `20261022-002911-b77b`; shots 580 PNGs, 0 FAIL, `text scale OK (1626 ...)` and `text scale once OK (104184 comparisons over 208 loads ...)`; freeze `freeze OK (280/280 ...)`; parity 0 gaps / 0 undeclared / 24 declared.
- Interaction tests: 8 new, all pass (`test/dom/authoring/formModalUndeclaredDefaults.test.ts`); SC-483's own `formModal.test.ts` untouched and green (whole `test/dom/authoring` run: 215/215).

## MEDIUM-1 (FIXED): empty body only for a null/blank source body

- Ruling applied verbatim: `recordingDefaults` now records (module-private `WeakSet`) whether the parse input was NOT a mapping (null / undefined / non-object). `stringifyOmittingUntouched` returns `''` only for such an instance when nothing defined is left; a mapping source is written as `{}`, which every element re-parses. Negotiation's inline `''` guard is removed (its parse rejects a blank source, so no instance can come from one; it now yields `{}`).
- Net effect: only montage and project can ever write `''`, exactly where the user's body really was empty.
- Red-first commit `90de644` (9 failed on the base `053b625`): `serialize(parse({}))` is `'{}'` for every one of the six elements; `serialize(parse(null))` is `''` for montage and project; counter `title: Deaths`, + then - -> body `{}` and the block re-mounts with no error card; negotiation `title: Frodo`, slot 3 then slot 5 -> `{}` and re-mounts with no error card; helper unit tests for the blank/mapping split. The montage End round -> Back write-path test is kept (empty body source -> empty body out, note byte-identical).
- Fix commit `4f112c5` (+ architecture.md sentence).

## Interaction test: which elements have a block edit form

A form needs a schema. From `src/elements/*/definition.ts`:
- WITH a schema (real field form): hero, conditions, tokens, stamina-bar, surges, skills, resource, roll.
- WITHOUT a schema (the editor shows one raw-YAML textarea that Save writes verbatim; nothing is parsed into a model first): counter, project, montage, party, encounter, negotiation, initiative, feature, statblock, featureblock, scc, characteristics, values-row, horizontal-rule.

Of the SC-482 elements only stamina-bar has a field form, so the form-path tests use stamina-bar and counter/montage are covered on their raw-textarea path.

Tests (all pass):
1. stamina-bar minimal (`max_stamina` + `current_stamina`), nothing touched -> written exactly the source (no collapsible, collapse_default, temp_stamina, height, style, no untouched select value).
2. stamina-bar minimal, Temp stamina changed to 5 -> only `temp_stamina: 5` added.
3. stamina-bar minimal, Style dropdown changed to `sheet` -> only `style: sheet` added.
4. stamina-bar fully authored (every key), untouched -> byte-identical.
5. stamina-bar source declaring `height: 2`, Height field cleared -> `height` omitted (a cleared field is `undefined`, which counts as absent, SC-466 r2), not written back as 1.
6. counter minimal raw (`name` + `max_value`), nothing typed -> source verbatim (no min_value / value_height / name_height / current_value).
7. montage minimal raw, one line edited -> exactly the typed text, no undeclared default.
8. counter fully authored raw, untouched -> byte-identical.
FormModal itself looked correct in every case; nothing to escalate. No edit to `src/authoring/FormModal.ts` or to SC-483's test file.

## Gate logs

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-impl-a23f8c687d4289a3e/` : `j-tsc`, `j-lint`, `j-jest-pre`, `j-life` (DSE_LIFECYCLE_PORT=9343), `j-e2e`, `j-shots`, `j-freeze`, `j-jest-post`, `j-parity` (each `.log` + `.rc`; all rc 0). Earlier red/green/form runs: `j-red`, `j-green`, `j-form`.

Shots exceeds the Bash tool's 600 s limit, so the tool moved it to the background; it was a single run, finished rc 0, and its log (not a notification) is the evidence. The work was not killed mid-gate this round: the 429 happened after `j-shots` had already completed, and I confirmed the worktree (clean, head `9f6d247`) and the finished logs before continuing.

## Drive-by fixes

None.

## Follow-ups

None new.

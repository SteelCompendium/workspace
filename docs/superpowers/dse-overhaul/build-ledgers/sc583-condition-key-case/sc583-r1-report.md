# SC-583 r1 report (implementer)

## Executive summary
- Verdict: DONE. dse branch `sc583-condition-key-case`, head `6453bc5d` (base `93e8e48c`, origin/develop unchanged, no rebase). 3 commits.
- tsc clean, lint clean. jest 10759 passed / 2 skipped / 0 failed (base 10746; +14 new, -1 removed `test.failing` marker).
- lifecycle 60/60 (21+16+9+4+7+3), 0 failed. e2e `290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (+5 = COND-K01..K05).
- shots 592; host-leak 163/978, modal host-leak 39/234, capture clip 147. freeze 280/280, 0 FAILED. parity 0 GAPs / 0 undeclared WARNs / 24 declared deferrals.
- Fix: one helper `conditionKeysEqual` (utils/Conditions.ts) behind the registry lookups and the Conditions window's duplicate check. Hand-written casing is never rewritten.
- Note: a jest `test.failing` SC-583 marker existed in `test/dom/views/conditions-modal-matrix.test.ts` (the owner's check covered only `e2e/`). It went green with the fix, so I deleted it (known-bug rule); its assertion is covered by the new modal test.

## Survey (every site that compares or looks up a condition key at 93e8e48c)
Key-equality sites (all rerouted):
- `src/utils/Conditions.ts:58-59` `getConditionByKey` (`c.key === key`), `:66-67` `getPseudoConditionByKey`, `:50-52` `getAnyConditionByKey` (delegates to the two). This is the standard-condition lookup.
- `src/views/ConditionsModal.ts:772` `pickMatch` duplicate check (`this.conditions.findIndex(c => c.key === key)`). Covers standard picks and custom picks (slug vs written key).

Readers that resolve a key through the manager (fixed through the manager, no edit of their own):
- `src/elements/conditions/panel.ts:82` (ds-conditions chip name).
- `src/framework/kit/conditionIcons.ts:116` (tracker icons, ds-conditions chip icon). Its `titleCaseKey` fallback is a name, not a comparison.
- `src/views/ConditionsModal.ts:289` (row name/icon/CUSTOM tag; `!config` at :304), `:383` (icon-picker default).
- `src/views/MinionStaminaPoolModal.ts:646` (SC-574 pool modal icons).
- Sidebar and the initiative tracker have no key comparison of their own: they use `kitBuildConditionIcons` (initiative `view.ts:2257`) and `ConditionsModal`.

Looked at and deliberately NOT changed (not key equality for recognition/dedupe):
- `ConditionsModal.ts:612` `matchesFor`: `c.key.includes(q)` with `q` already lowercased and registry keys lowercase (a search filter, not equality).
- Removal everywhere is by object identity or row index (`initiative/view.ts:2271` `entry !== conditionEntry`, `panel.ts:removeCondition`, `ConditionsModal.removeAt(index)`, `MinionStaminaPoolModal.ts:674` index filter). Edits are by row index. No key compare, so a mixed-case entry is found.
- `src/elements/initiative/model.ts:158,172,199-202` (SC-592 `plainConditions`/`mixed` maps keyed by `entry.key`): these deliberately compare the EXACT written spelling, to decide whether an entry was written as a plain string. Case-folding here would break "bytes of an untouched condition are unchanged" (O3), so they stay exact.
- `slugConditionKey` (`conditionDisplay.ts:36`) lowercases already; a slug is the key of a newly added custom condition.
- Parsers (`conditions/model.ts`, `hero/model.ts:193-195`, `EncounterData.ts`) keep `key` verbatim. No change.

## Helper and rerouted sites
- `conditionKeysEqual(a, b): boolean` = `a.toLowerCase() === b.toLowerCase()`, exported from `src/utils/Conditions.ts`. Case only: no trimming and no slugging (`High Ground` is not `high-ground`).
- Routed through it: `getConditionByKey`, `getPseudoConditionByKey` (so `getAnyConditionByKey`, hence every reader above), and `ConditionsModal.pickMatch`.
- Registry lookups return the registry entry (canonical `dazed` key); the user's entry is never touched.

## What the Add menu does (and the O5 behaviour I observed)
- At base there is no "already present" filtering in the menu: every standard condition is always listed. "Already present" is the pick behaviour: `pickMatch` is a no-op (scrollIntoView on the existing row, no write, focus/query stay). SC-583 makes `Dazed`/`DAZED` count as present for that no-op, for standard picks and for the custom row (typed "hexed" with a written `Hexed`). I did not change the menu to hide present items (that would be a new behaviour; see Follow-ups).
- Base behaviour reproduced by the red runs: window showed hand-written `Dazed` as a custom row (CUSTOM tag, fallback glyph), and picking Dazed wrote a second `dazed`.
- O5 (note holding both `Dazed` and `dazed`): opening the window shows two standard Dazed rows (no CUSTOM tag, second one with its badge), writes nothing, nothing merged. Picking Dazed is a no-op. Removing one row removes only that entry (by index) and leaves the other with its fields intact. Tested in jest and as COND-K05. (At base the same note showed `Dazed` as custom plus a standard `dazed`, also unmerged.)
- O3: parsers and serializers never touch a key, and the SC-592 plain/object memory is exact-case, so `key: Dazed` and plain `Dazed` come back byte-for-byte after an unrelated write (jest model tests, e2e K02 asserts the written text `      - key: Dazed\n      - key: Hexed\n      - key: grabbed\n`).

## Tests
jest (+14, -1):
- `test/unit/utils/Conditions.test.ts` (+4): helper; standard lookup any casing returns registry entry; pseudo lookup; no cross-list leak / unknown stays unknown.
- `test/dom/views/conditions-modal.test.ts` (+6): `Dazed` row standard; pick no-op, spelling kept, later pick keeps `Dazed`; plain `DAZED` present; custom `Hexed` vs added "hexed"; duration edit and removal act on the `Dazed` entry; existing `Dazed`+`dazed` O5.
- `test/dom/kit/conditionIcons.test.ts` (+1): `Dazed` and `GRABBED` get registry icon/name; `onRemove` gets the written entry.
- `test/dom/views/minion-stamina-pool-modal.test.ts` (+1; `setup` gained an optional condition `key`): `Grabbed` is the standard grabbed (SC-574 pool modal).
- `test/unit/model/initiative-condition-shape.test.ts` (+2): casing and plain/object shape survive a no-op write and an unrelated edit, duplicates included.
- Removed: the `test.failing('SC-583: ...')` marker in `conditions-modal-matrix.test.ts`.
e2e (new `e2e/specs/conditions-modal/cond-keycase.e2e.ts`, new fixture `e2e/vaults/shipped/Initiative/key-case.md`, `KEYCASE` const in `e2e/driver/conditions.ts`, README fixture row):
- COND-K01 window shows hand-written `Dazed` as standard (custom false), `Hexed` custom, tracker icons, no write.
- COND-K02 picking Dazed: no write, text/focus kept; later pick leaves exactly one dazed (compared case-insensitively) still spelled `Dazed`, asserts the written text.
- COND-K03 Add menu: option click on Dazed and typed custom "hexed" are no-ops (no write, no new row).
- COND-K04 duration edit and removal act on the `Dazed` / `Hexed` entries, spelling kept.
- COND-K05 existing `Dazed`+`dazed` (Ogre #1): two standard rows, no write, remove one leaves the other.

Red -> green:
- jest: ran the 5 touched files with the two src files stashed (`git stash push -- src/...`, popped after): 10 failed / 202 passed. Failing: the 8 recognition/no-duplicate/lookup tests, plus the conditionIcons and pool-modal tests. Passing on base on purpose (guards, O3 already held at base): the 2 model casing tests, the "no cross-list leak" test, the edit/remove-by-index modal test. Log: `sc583-r1-jest-targeted-red-base.log`; green: `sc583-r1-jest-targeted-green.log` (212/212).
- e2e: `--only=COND-K01..K05` with the two src files checked out from `93e8e48c`: `1/5 ok, 4 failed`. K01 (`custom` true), K02 and K03 (unexpected write), K05 (`custom` true) fail; K04 passes at base (guard: edit/remove are by index). Log: `sc583-r1-e2e-red-base.log`. src restored to HEAD afterwards (`git status` clean).
- First full jest run (log `sc583-r1-gate-jest-first-with-marker-red.log`) had exactly one failure: the `test.failing` marker "passed even though it was supposed to fail", i.e. the fix works; marker removed, rerun green.

## Commits (dse, branch sc583-condition-key-case)
- `bd68fe63` fix(conditions): a condition key matches regardless of case ... (src + jest)
- `d7916d03` test(conditions): e2e COND-K01..K05 ... (spec, fixture, driver const, README row)
- `6453bc5d` test(conditions): remove the SC-583 test.failing marker; the fix lands with its own tests

## Gate numbers
tsc clean (rc 0), lint clean (rc 0), jest `Tests: 2 skipped, 10759 passed, 10761 total`, `Test Suites: 1 skipped, 266 passed`. Lifecycle p1 21/21, p2 16/16, p3 9/9, p4 4/4, p5 7/7, p6 3/3 = 60/60, 0 failed. e2e as above. shots 592 PNGs written, host-leak 163 button kinds / 978 comparisons, modal host-leak 39 / 234, capture clip 147. freeze `280/280 frozen print PNGs byte-identical`, 0 FAILED. parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. Jest ran at loadavg 6-10, no timeout-shaped reds.

## Evidence artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc583-r1-impl/`)
`sc583-r1-gate-{tsc,lint,jest,e2e,shots,freeze,parity}.log`, `sc583-r1-gate-lifecycle-p{1..6}.log`, `sc583-r1-jest-targeted-{green,red-base}.log`, `sc583-r1-e2e-red-base.log`, `sc583-r1-e2e-condmodal-green1.log` (conditions-modal element run, 59/62), `sc583-r1-gate-jest-first-with-marker-red.log`, `sc583-r1-src-fix-commit.patch`. Red-run failure bundles (retention 12 runs): `.../draw-steel-elements/e2e/.out/20261112-114022-33db/COND-K0{1,2,3,5}/`.

## Drive-by fixes:
None.

## Follow-ups:
- The Add menu never marks or hides conditions the actor already has (any casing); the pick is a silent no-op with only a scrollIntoView on the existing row. A "already added" cue would be a UX decision (not done).
- `kit/conditionIcons.ts` and `elements/conditionDisplay.ts` keep duplicate `titleCaseKey` / fallback glyph (kit may not import from elements, by design); unchanged, mentioned only because the key-equality helper lives in `utils/` where the kit may import (it already imports the `ConditionManager` type from there).
- A note holding both `Dazed` and `dazed` keeps both forever (O5, by design); no UI affordance to dedupe.
- The ConditionsModal removes by identity/index; the long-standing INFO-2 note in `initiative/view.ts` (stale-click identity) is untouched.

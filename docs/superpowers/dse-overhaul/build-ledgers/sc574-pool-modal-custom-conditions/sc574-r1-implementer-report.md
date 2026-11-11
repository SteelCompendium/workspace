# SC-574 r1 implementer report

## Executive summary
- Status: DONE. Rebased head (dse, branch `sc574-pool-modal-custom-conditions`, on origin/develop `c3fd8323`): `580c9f84e138040a275151b879b899822c04cdc5`. Not pushed.
- Fix in `src/views/MinionStaminaPoolModal.ts` `buildConditionIcons`: an unregistered key now gets the same button as a known one (fallback glyph `circle-dashed`, name `Remove <Title Cased Key>`), and a click removes the entry by its array position, not by value.
- Jest: both `test.failing` markers flipped; +7 net cases. e2e: POOL-C07 (custom shown + removed) and POOL-C08 (second of two duplicates removed, then the other), new fixture `Initiative/squad-custom.md`.
- All post-rebase gates green at the expected numbers (below); freeze 280/280 unchanged, parity 0/0/24.
- No SC-592 write-back change, no Conditions modal / tracker change, no new lifecycle phase.
- Note: the owner's brief said name = "object entry's own name field, else the key"; `Condition` has no name field, so I used the tracker/Conditions-modal convention (title-cased key, "Remove On Fire").

## Head and commits (rebased onto c3fd8323; the rebase had no conflicts, CHANGELOG merged cleanly)
- `58ef7b8f` fix(pool-modal): custom conditions get the fallback icon; a click removes one entry by position
- `11b849ff` test(pool-modal): e2e steps for a custom condition and a repeated plain-text condition, with a squad-custom fixture
- `580c9f84` docs: changelog entry for custom conditions and duplicate removal in the pool modal

## Files changed (dse)
- `src/views/MinionStaminaPoolModal.ts` (imports `FALLBACK_CONDITION_ICON`, `titleCaseConditionKey` from `@/elements/conditionDisplay`; `forEach` now takes the entry index; the `if (condition)` gate is gone; remove = `conditions.filter((_, i) => i !== entryIndex)`; the focus hand-off still uses the DOM icon index)
- `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (known-bugs describe replaced by a "custom conditions and duplicate entries" describe: 9 tests)
- `e2e/specs/minion-pool/pool-conditions.e2e.ts`, `e2e/manifest/minion-pool-modal.ts` (`pool.condition` scenarios list gains C07, C08), `e2e/driver/pool.ts` (`CUSTOM` const, `conditionGlyphs()`), `e2e/vaults/shipped/Initiative/squad-custom.md`, `e2e/README.md` (fixture row), `CHANGELOG.md`

## Tracker fallback mirrored
`FALLBACK_CONDITION_ICON = 'circle-dashed'` at `src/elements/conditionDisplay.ts:14` (SC-186), plus `titleCaseConditionKey` in the same file. This is the same shared helper `ConditionsModal.ts:68,281-282` uses; the tracker's kit copy (`src/framework/kit/conditionIcons.ts:55`) is a boundary duplicate of the same value. Reused by import, not copied. An object entry's own `icon` still wins; `color` and `effect` are applied for object entries on known and custom alike.

## Post-rebase gates (head `580c9f84`, base `c3fd8323`)
- tsc (`npm run tsc`, incl. e2e project): rc 0, clean. lint: rc 0, clean.
- jest (shots CSS cache present): `Tests: 1 skipped, 7207 passed, 7208 total` / `Test Suites: 1 skipped, 260 passed, 260 of 261 total` (expected 7200 + 7 added).
- lifecycle, five `--only` parts (each rc 0): `done: 21/21 ok, 0 failed` · `16/16` · `9/9` · `4/4` (G-S57 G-S62 G-S61 G-S56) · `4/4` (G-S59 G-S49 G-S73 G-S77). Union 54/54.
- e2e: `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (base 260/265, +2 = POOL-C07, POOL-C08)
- shots: 592 PNGs; `button host-leak OK (163 button kinds × 3 states … = 978 comparisons`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 39 button kinds … = 234 comparisons`; `capture clip OK (147 screen …`
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
- parity (last): exit 0, `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`

## Appendix: pre-rebase numbers (head `1657d776` on `6c7216e8`)
tsc/lint clean; jest 7197 passed / 2 skipped fresh, 7198 passed / 1 skipped after shots; lifecycle 21+16+9+4+4 = 54/54; e2e `261/267 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`; shots 592, 163/978, 39/234, clip 147; freeze 280/280. Parity was not run pre-rebase (superseded).

## Notes
- jest prints `findDriftedTokens` TypeError stack traces in its log; these are expected child-process output of negative tests in the `obsidian-light-island` suite, and the suites pass.
- Not checked: that the new e2e steps fail on the old code (jest covers the old/new difference; the two flipped tests were the known failing ones).
- Fresh worktree needed `npm ci` (node_modules absent); package.json unchanged by the rebase, so no second `npm ci`.

Drive-by fixes: none.

Follow-ups:
- `Condition` has no display-name field, so the brief's "object entry's own name field" cannot apply; custom names are always the title-cased key. If a name field is ever added, `buildConditionIcons` (pool modal), `ConditionsModal` and the kit's `conditionIcons.ts` should all take it together.

## Artifacts
- Report: this file. Gate logs and rc files: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r1-impl/` (post-rebase: `tsc2`, `lint2`, `jest3`, `r-lc1`..`r-lc5`, `r-e2e`, `r-shots`, `r-freeze`, `r-parity`, each `.log`/`.rc`; pre-rebase: `jest1`, `jest2`, `lc1`..`lc5`, `e2e1`, `shots`, `freeze`)

## r2 (fix round: docs and tests only)
- Head `ec26b709` (one commit on `580c9f84`: test(pool-modal): retarget POOL-C08 at repeated custom conditions, same-reference jest case, changelog drops the duplicate-removal symptom). `git diff 580c9f84..HEAD -- src` is empty, so lifecycle, shots, freeze and parity carry over from `580c9f84`. Not pushed; tree clean.
- MED-1: CHANGELOG bullet retitled "custom conditions show an icon" (duplicate-removal symptom sentence gone; it now only says a condition listed twice shows two icons and a click removes the one clicked). POOL-C08 retargeted: fixture `squad-custom.md` is now `on-fire, grabbed, on-fire, dazed` (README row updated); C08 title "each copy of a repeated custom condition is its own icon, and a click removes only that one" (no bracketed ticket id), comment rewritten; C07 expectations follow the new fixture. Jest (b) case got the one-line note that strings reach the modal only when a caller bypasses parsing (defensive guard).
- LOW-1: the object-entry case now uses the same reference twice (`[entry, entry]`), title updated.
- Mutation 1 (only the position-based removal reverted to `entry !== conditionEntry`, jest matrix): 4 failed / 126 passed; the LOW-1 case ("the same object entry twice ...") is one of the 4 failures (others: SC-574 (b), second-of-duplicates, keyboard focus after duplicate). Log `sc574-r2-impl/mut1-identity.log`.
- Mutation 2 (whole src fix reverted to c3fd8323, e2e `--only=POOL-C08`): FAIL at the first `conditionNames()` assertion after the modal opens (expected `On Fire, Grabbed, On Fire, Dazed`, received `Grabbed, Dazed`: custom conditions not drawn). Log `sc574-r2-impl/mut2-whole.log`. Both mutations restored from copies; `git status` clean.
- Gates on `ec26b709`: tsc rc 0, lint rc 0; jest `Tests: 1 skipped, 7207 passed, 7208 total` (same count: 1 test retitled/rewritten, none added); e2e `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`.
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r2-impl/` (`tsc`, `lint`, `jest`, `e2e` .log/.rc, `mut1-identity.log`, `mut2-whole.log`, `mut2.out`).

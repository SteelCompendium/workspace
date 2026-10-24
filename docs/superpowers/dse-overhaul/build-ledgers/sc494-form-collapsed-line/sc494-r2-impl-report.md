# SC-494 r2 implementer report

## Executive summary
- STATUS: DONE. Rebased onto dse origin/develop `054c9c5` and superproject origin/main `83b800f` (moved from a094db3 during the round; re-rebased, no conflicts).
- dse tip `7046eb0` = `ff9316f` (red) / `48422d9` (fix) / `fe34bba` (LOW-1 test) / `7046eb0` (INFO-6 refactor). Superproject CHANGELOG commit `827954d` (INFO-5 reworded; folded into the existing unpushed CHANGELOG commit by amend, pointer unbumped, ` M draw-steel-elements` only).
- LOW-1: test.each over ds-stamina-bar + ds-skills (toggle "Collapse default" opens on, flip off, Save -> exactly one `collapse_default: false` line, re-renders expanded). Passes at HEAD (23/23); under the mutant `extractCollapseKeys(rawData, this.def.chrome !== undefined || claimsLegacyCollapseKeys(this.def))` at FormModal.ts:133: 2 failed / 21 passed (exactly the two new tests). FormModal.ts restored from a saved copy; tree clean.
- INFO-6: `withReservedKeys(serialize, {collapsePopped, prefOverrides, prefPassthrough})` in `chrome/collapsedKey.ts` is the single place the `prefs:` ... `collapsed:` ... body order is coded; `pipeline.ts` and `FormModal.ts` both call it. No test expectation edited; jest on authoring+framework+elements 2691/2691 before the full run.
- Gates on `7046eb0`: tsc+lint clean; jest 6026 passed / 1 skipped / 243 of 244 suites (6003 + 23 new); lifecycle 36/36; e2e 114/114 ok, 0 failed, 0 known-bug, coverage 79/79; shots 592, 0 FAIL; freeze OK 280/280; parity 0 gaps / 0 undeclared / 24 declared. No flake seen.

## Detail
- The "withCollapseKeys / withPrefOverrides" imports are gone from FormModal.ts; pipeline.ts no longer imports `withPrefOverrides`/`withCollapseKeys` directly (still exported/used by the new helper and by existing tests).
- CHANGELOG now reads: "...Save now keeps `collapsed:`, `collapsible:` and `collapse_default:`, and a Save with no changes writes the block unchanged, except that collapse lines placed below other settings move to the top of the block."
- Order of work: the session-limit kill came after the mutant check, the CHANGELOG amend and the refactor commit and after the lifecycle gate; the later gates (e2e, shots, freeze, jest, parity) were run after the resume, all on the same dse tip `7046eb0`. tsc/lint were run after the refactor (no source change since).
- Drive-by fixes: none. Follow-ups: none new.

## Evidence
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r2-impl-a1/` (low1-head.log, low1-mutant.log, info6.log/json, tsc.log, lint.log, lifecycle.log, e2e.log, shots.log, freeze.log, jest.log, parity.log).
- Test file: `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements/test/dom/authoring/formModalCollapseKeys.test.ts`.

# SC-631 r1 implementer report

## Executive summary
- Verdict: DONE. dse head `ea9749ab` (branch sc631-montage-skill-casing, base `3e88b3f5`, origin/develop unchanged). Superproject head `9c022c93` (changelog `92341d64`, pointer bump `9c022c93`). Nothing pushed.
- tsc (incl. e2e) and lint clean (re-run after the last commit). jest 13330 passed / 2 skipped / 0 failed (fresh, before shots cache; +5 new tests).
- lifecycle 64/64 (21+16+9+4+7+4+3, each part's log lists only its ids, no flake).
- e2e `OBSIDIAN-E2E done: 593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`. A first run was 592/609, 1 failed (MONT-L12 left its sheet open: "1 orphaned .modal-container"); fixed by closing with Cancel, re-run clean.
- shots 592, host-leak 163 button kinds, modal host-leak 40 button kinds, capture clip 147; freeze 280/280; parity 0 gaps / 0 undeclared / 24 declared.
- No CSS touched (no css/styles-source change), no frozen hash moved, no rebaseline.

## Diff by file (dse)
- `src/elements/montage/model.ts`: new private `matchKey(v)` (trim + lowercase; `undefined` for non-string or blank), shared with `montageHeroNamed` (SC-627, same behaviour). New exported `reusedSkillSpelling(m, hero, skill, excluding?)` returns the stored skill's own spelling or `undefined`; `wouldReuseSkill` kept as a boolean wrapper. Excluding the edited entry uses the same key and removes the first matching stored item. Doc comments updated.
- `src/elements/montage/LogActionModal.ts`: `refreshSkillWarning` uses `reusedSkillSpelling` and prints the board's spelling; hidden iff undefined. No write-path change.
- `test/unit/model/montage-tally.test.ts`: +5 tests (casing/padding both sides; "Natures"/"Natur"/blank non-match; `reusedSkillSpelling` spelling; edit exclusion in other casing and a second use still warns; number/null/blank items skipped).
- `test/dom/elements/montage-matrix.test.ts`: `[K04]` `test.failing` -> `test`, title without ticket id, also asserts warning text names "Nature".
- `e2e/specs/montage/log-modal.e2e.ts`: new `[MONT-L12]` (types ' nature ' for Kira, warning textContent `Kira already used Nature in this montage — reuse is not allowed`, Log enabled, closes via Cancel with no write). No new coverage pair.
- Superproject `CHANGELOG.md`: one bullet under `## Unreleased`.

## Edit-sheet behaviour checked
Entry logged as "Nature", edit, typed "NATURE" / " nature ": no warning (unit test). `skills_used: ['Nature','nature']` with the same edit: warns (the other item remains).

## Drive-by fixes
None. (`montageHeroNamed` was switched to the shared `matchKey`, behaviour identical, in a file already touched.)

## Follow-ups
- Exact-match removal on undo/correct/remove (`removeSkillOccurrence`, `skills_used.indexOf`-style) is unchanged and still case-sensitive: if a stored skill's casing differs from the entry's `skill` it would not be removed. Only reachable by hand-editing YAML; out of scope per ruling 7.
- dse-verify SKILL.md mentions "jsdom test.failing markers for montage bugs: SC-631" and the e2e expected numbers (592/608): both need updating to 593/609 and "no markers left" by the owner after landing.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc631-r1-impl/)
jest.log, lc1..lc7.log (+.rc), e2e1.log (592/609, 1 failed), e2e2.log (593/609 clean), shots.log, freeze.log, parity.log, tsc2.log / tsc-e2e2.log / lint2.log.

---

# r3 section (review fixes, rebased on SC-648)

## Summary
- Verdict: DONE. Rebased dse head `2777484c` (on `e1be1775`, no conflicts, package.json/lock unchanged so no second npm ci). Superproject head `47b35b4b` (changelog `5531ae71` + pointer bump `47b35b4b`), rebuilt on workspace `origin/main` `f770cc3b` (NOT `004a6394`: origin/main had moved one docs-only ledger commit past it; `004a6394` is its ancestor). Exactly 2 commits above it; submodule status shows `2777484c`.
- Fixes: LOW-1 the edit exclusion tries the entry's exact stored item first, then the case/space-insensitive fallback; LOW-2 test for the exclusion compared ignoring case; INFO-1 `reusedSkillSpelling` returns the stored spelling trimmed (existing unit test updated).
- New tests: 2 unit tests (`[nature, Nature]` editing "Nature" typed NATURE -> "nature"; stored 'nature' vs entry 'Nature' typed NATURE -> false). Padding/trim covered by the updated `reusedSkillSpelling` test.
- Full battery on the rebased head: tsc incl. e2e + lint clean · jest 13335 passed / 1 skipped / 0 failed (with the shots cache; 13334 / 2 fresh) · lifecycle 64/64 (21+16+9+4+7+4+3) · e2e `597/612 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163 button kinds, modal host-leak 40 button kinds, capture clip 147 · freeze 280/280 · parity 0 gaps / 0 undeclared / 24 declared.
- Pre-rebase run on `ea9749ab`+r3 fixes: jest 13333/1, e2e 593/609 0 failed (before SC-648).
- Note: I ran `rm -f` on the literal main.js/styles.css paths (via a shell variable once, before the jest run); it did not hang.

## Logs (scratchpad/sc631-r1-impl/)
tsc4.log, lint4.log, jest4.log, lcB1..lcB7.log (+.rc), e2e4.log, shots4.log, freeze4.log, parity4.log; pre-rebase: jest3.log, e2e3.log.

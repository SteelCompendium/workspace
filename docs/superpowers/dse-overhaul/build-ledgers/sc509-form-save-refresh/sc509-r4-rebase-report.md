# SC-509 r4 rebase report (implementer B)

## Executive summary
- STATUS: DONE. New dse base: `origin/develop` 38f94f4 (SC-500). Superproject rebased onto `origin/main` 2bb85df (no conflict).
- LOW-2 folded in: G-S40 now asserts the whole note equals the fixture with only the edited value changed, in the Reading phase (all three notes) and in the sidebar phase (the pinned note, anchor line included). Test-only; no `src/` change.
- dse commits: red tests `c3cac7d`, fix `80cd647`, lifecycle G-S40 `4832950`, LOW-2 `85119e8` (HEAD). Superproject CHANGELOG `a32bfa8`. No push, no pointer bump.
- Range-diff 7046eb0..a426882 vs 38f94f4..HEAD: the first three commits are `=` (identical patches); the one new commit is the LOW-2 test commit. See `sc509-r4-range-diff.txt`.
- Gates on 85119e8, all green: tsc, lint, jest 6033 passed / 1 skipped / 244 of 245, lifecycle 37/37, e2e 114/114 with 82/82 pairs, shots 592 with 0 FAIL, freeze 280/280, parity 0/0/24.

## LOW-2 change (visual-harness/obsidian-lifecycle.mjs only)
- Reading phase: after the redraw checks, `t.read(rel) === FIXTURES[rel].replace(swap[0], swap[1])`, where swap is the raw box pair, or `current_stamina: 15` -> `current_stamina: 7` for the typed field.
- Sidebar phase: right after the pin, the note minus the stamped `_dse_anchor` line must equal the fixture; after the Save, the note must equal the pinned note with `title: The Heist` -> `title: Other Job`.
- Run before the rebase: `G-S40 ok` (`sc509-r4-lifecycle-gs40-prerebase.log`).

## Gate numbers (HEAD 85119e8)
- tsc (incl. `tsc -p e2e`): rc 0. lint: rc 0.
- jest before shots: `Tests: 1 skipped, 6033 passed, 6034 total`; `Test Suites: 1 skipped, 244 passed, 244 of 245` (the shots cache was already present from the earlier run). After shots: identical.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 37/37 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 82/82 pairs`.
- shots: 592 PNGs, 0 FAIL; `button host-leak OK (113 button kinds ... 678 comparisons`, `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds ...`, expected `OBSIDIAN APP.CSS PIN DRIFT` warning; rc 0 read from its own rc file.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`.
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Notes
- `package.json` is unchanged between 7046eb0 and 38f94f4, so no `npm ci`.
- SC-500's delta touches `src/views/ResetEncounterModal.ts` (control id) and the e2e manifest; no conflict with my commits.
- Drive-by fixes: none. Follow-ups: none new (the r2 follow-ups stand; the SKILL.md CURRENT line is the owner's/dispatcher's).

## Artifacts (/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/)
- sc509-r4-rebase-report.md, sc509-r4-range-diff.txt, sc509-r4-lifecycle-gs40-prerebase.log
- sc509-r4-final-{tsc,lint,jest1,lifecycle,e2e,shots,freeze,parity,jest2}.log, sc509-r4-final-shots.rc

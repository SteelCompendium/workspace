# SC-612 r6 rebase report (impl-r2 resumed)

**Executive summary**
- STATUS DONE. r5 rulings folded (CHANGELOG sentence exactly "An edit elsewhere in the note, or a sibling's + / -, does not cause a refusal."; the whitespace residual documented in the `pinnedTarget` doc comment, comment only, and in the proposal's residual list as item 6). Then rebased onto dse origin/develop 2074a152 (no conflict) and workspace origin/main f9082867.
- dse tip `1f1ae442` on 2074a152. Superproject `53be46e9` (one CHANGELOG commit, re-applied after a conflict as in r4) on f9082867. No pointer commit.
- range-diff `1516f894..a06dba37` vs `2074a152..1f1ae442`: 11 commits `=`, one new (the comment commit); no code delta: `sc612-r6-range-diff.txt`.
- Gates: tsc + lint clean; jest 11788 passed / 2 skipped (11707 + 81); lifecycle 62/62 (185 / 322 / 404 / 297 / 391 / 296 / 67 s; G-S91 green, no re-run needed); e2e `330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; styles.css `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` identical to a clean 2074a152 build, so shots / freeze / parity carry (not run).

## Details
- Folded commit: `1f1ae442`-equivalent (now the tip comment commit); proposal updated (residual 6, CURRENT block with these numbers and shas).
- Clean build: scratch export `.../scratchpad/sc612-r6-impl/clean-2074a152` (build_rc 0, styles sha above); branch sha from the e2e log's last line.
- Logs: `sc612-r6-gate-tsc-lint.log`, `sc612-r6-gate-jest-1.log` (86 s), `sc612-r6-gate-lifecycle-part1..7.log`, `sc612-r6-gate-e2e.log` (197 s), `sc612-r6-range-diff.txt`.
- The red-on-base, mutant, fuzz and timing results of `sc612-r4-fix-report.md` carry: no code changed.

Drive-by fixes: none. Follow-ups: none new.

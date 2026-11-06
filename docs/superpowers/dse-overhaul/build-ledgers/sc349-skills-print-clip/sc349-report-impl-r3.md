# SC-349 implementer report, rebase round (r3)

## Executive summary
- Verdict: DONE. Rebased head `e2b17f1` (4 commits, `a6a9b08`, `b41b840`, `b09ff92`, `e2b17f1`) on `origin/develop` `bc4a0c5` (SC-362). No conflicts, no new commit, not pushed, tree clean. package.json/lockfile unchanged, no `npm ci` needed.
- Hashes: the 572 pre-existing PNGs equal the proofB run on `acbacbd` (0 differ). Two runs on `e2b17f1` are byte-identical to each other (580/580), rc 0, 0 FAIL.
- The 8 new SC-362 PNGs (`rule-by-scc`, `condition-by-scc` x dark/light/print/realprint) are all 440-706 device px tall: none grown, none clipped. The grown count is unchanged (139 screen + 41 print).
- Freeze vs the shared 280-line baseline: `FREEZE VIOLATED (40 checksum mismatches, 0 missing)`; the 40 names equal `rebaseline.txt`. The 4 new by-scc lines read OK. No `rebaseline-additions-r3.txt` needed. Scratch applied copy (280 lines, 40 replaced): `sha256sum -c` rc 0.
- Gates: tsc/lint clean; jest 5466 passed / 1 skipped / 233 of 234; lifecycle 30/30; e2e 89/93, 64/64 pairs; shots 580, 0 FAIL; parity 0/0/24.
- Gate lines present: `capture clip OK (139 screen-media capture(s) … 41 print-media capture(s) … NOT covered — named exemption(s): gallery--steel-dark.png (…SC-484); gallery--steel-light.png (…))` and `montage board scroll OK (14 rounds x 900px pane …)`.

## Rebase
`git fetch origin` showed `bc4a0c5` (a first rebase onto `08206e3` was aborted by the owner's correction; I killed my own in-flight shots run by PID before rebasing, so nothing from it is used). The rebase onto `bc4a0c5` applied all 4 commits cleanly; changed upstream files (`visual-harness/entry.ts`, `visual-harness/README.md`, `test/dom/visual-harness/fixtures.test.ts`) do not overlap my files.

## Gate outputs (literal)
- `npm run tsc` rc 0; `npm run lint` rc 0.
- jest: `Test Suites: 1 skipped, 233 passed, 233 of 234 total` / `Tests: 1 skipped, 5466 passed, 5467 total` (as expected: bc4a0c5 plus my 9 tests / 1 suite).
- `OBSIDIAN-LIFECYCLE done: 30/30 ok, 0 failed` (DSE_LIFECYCLE_PORT=9349).
- `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`.
- Shots: 580 PNGs per run, rc 0 both runs, 0 `FAIL` lines; `r3b-run1.sha256` == `r3b-run2.sha256`.
- Parity (last): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`

## Artifacts
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`: this report; `rebaseline.txt` (40) and `rebaseline-skills-only.txt` (8) unchanged; `sc349-clipped-list.txt` unchanged (the 8 new PNGs are not clipped).
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r1/`: `r3b-run{1,2}.log`, `r3b-run{1,2}.sha256`, `r3b-run{1,2}-shots/`, `r3b-baseline-applied.sha256`, `r3-{tsc,lint,jest,lifecycle,e2e,parity}.log`. (`r3*` partial files from the aborted 08206e3 run are stale and unused.)

Drive-by fixes: none. Follow-ups: none new (gallery coverage SC-484, exemption text printed twice, as in r2).

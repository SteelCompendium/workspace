# SC-526 r5 — scoped re-review brief (orchestration:reviewer, the r3 reviewer resumed)

Scope: the r4 DELTA only — (1) the three folded wording fixes (r3 LOW-1, LOW-2, INFO-5), (2) the rebase of dse onto `69b5c0d4` (or newer) and of the superproject CHANGELOG commit onto current origin/main (check conflict resolution in styles-source.css near SC-520's callout-chrome rules, and that the CHANGELOG bullet still sits in `## Unreleased`), (3) r4's battery numbers. Not a fresh full pass.

- Read: r4 report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/sc526-r4-impl-report.md` and the ledger `decisions.md` (r3 rulings).
- Superproject: 643185bb -> ef4e60c3 + f99741d0 on origin/main e642f51b. Compare `git range-diff 248e202b..d40197c4 69b5c0d4..6270e84a` in the dse clone; confirm no change beyond the three wording fixes.
- Re-run yourself: jest (expect 6492 / 1 / 257 of 258), and one shots run + freeze (private DSE_CAMERA_TMP) — expect 163/978, 34-record boundary, 592 PNGs identical to a 69b5c0d4 run, `capture clip OK`, freeze 280/280. Lifecycle/e2e only if the delta touches src/.
- Same command shapes and footguns as `sc526-r2-brief.md` §3–§4; new private scratch folder `sc526-r5-rev-<4 random chars>`. Never touch the tracker, never push, never tag; leave Scott's own Obsidian alone.
- Report `sc526-r5-rereview-report.md` (≤10-line exec summary first). Final text: verdict, findings with file:line, measured numbers, artifact paths.

# SC-672 r9 rebase report

## Executive summary
- STATUS: DONE_WITH_CONCERNS (one lifecycle scenario, G-S63, was red once in the first run of part 3 and green on both re-runs; see Follow-ups)
- Plugin head `957e4b1135ea34355235ee541f1cc142701d3f0e` (8 commits) on dse develop `8c08bce2`. No conflicts. Range-diff all `=`.
- Superproject head `fd06066317db68b3386442037162084692886414` (3 CHANGELOG commits) on origin/main `e7f6b4a1` (later than the expected `66b1e5ec`). No conflicts; SC-672 bullet still first; SC-679 bullet kept.
- tsc (incl. -p e2e) and lint clean. jest `Tests: 2 skipped, 14013 passed, 14015 total`, 0 failed.
- e2e full run: `OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`.
- lifecycle 7 parts: 64/64 as a union (21, 16, 9, 4, 7, 4, 3). Part 3 first run: 8/9, `G-S63 FAIL`; G-S63 alone 1/1 ok; part 3 whole re-run 9/9 ok. G-S61 green in part 4.
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` = clean `8c08bce2` build `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`: equal, shots / freeze / parity carry, not run.
- src/ diff vs `8c08bce2`: `src/model/Counter.ts` + comment in `undeclaredDefaults.ts` only. package.json / lock unchanged between `d582e7ff` and `8c08bce2` (empty diff): no `npm ci`.

## Conflicts
None (plugin and superproject).

## Range-diffs
- Plugin `d582e7ff..28402e57` vs `8c08bce2..HEAD`: all 8 commits `=` (`range-diff-plugin.txt`).
- Superproject `b034ff73..0500eb78` vs `origin/main..HEAD`: all 3 `=` (`range-diff-super.txt`).

## The G-S63 red (excerpt)
First run of part 3, loadavg 1.10 at start and 1.55 at the end:
`OBSIDIAN-LIFECYCLE G-S63 FAIL: (a) counter in a callout: the fallback ran (1 setViewData(.., true) call(s)): the normal off/on must not rebuild the note -- passed: (a) counter in a callout: tagged 1, out of the document 1, drawn 1, owned 1, rebuilds 1; ...` then `done: 8/9 ok, 1 failed` (log `life-p3.log`; the temp dir `/tmp/dse-obsidian-lifecycle-ylF3bH` with the FAIL screenshot was kept by the runner and is not mine to delete). The other cells (b)-(e) of the scenario passed. G-S63 alone: `done: 1/1 ok` (loadavg 5.84). Whole part 3 again: `done: 9/9 ok` (loadavg 6.08 -> 1.80). Nothing in the counter is involved; the scenario is about a callout and the plugin off/on. No edit was made.

Drive-by fixes: none
Follow-ups: G-S63 cell (a) looks flaky (1 red in 3 runs on this head, with loadavg low): worth a note to the dse-verify owner if it has been seen on other heads.

## Evidence (under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r9-rebase/)
range-diff-plugin.txt, range-diff-super.txt, tsc-a.log, lint-a.log, jest.log/.rc/.load, build.log, styles.sha, build-base.log, styles-base.sha, e2e-full1.log/.rc/.load, life-p1..p7.log/.rc/.load, life-p3rerun.log/.rc/.load, life-p3b.log/.rc/.load, life-all.rc, g-*.sh

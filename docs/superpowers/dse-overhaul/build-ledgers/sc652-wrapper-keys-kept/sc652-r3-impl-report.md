# SC-652 r3 implementer report (fix round)

## Executive summary
- DONE. dse branch `sc652-wrapper-keys-kept` head `f4448454` on origin/develop `42c26272` (no conflicts, package.json unchanged). Nothing pushed.
- M-1: new shared `bodyDeclaresTopLevel` (prefOverrides.ts) decides "body already declares key" by `parseYaml` when the body is a map, line test otherwise; used by `withPrefOverrides` and `withCollapseKeys`. L-1 stale comment replaced. I-4: CTR-K01 now in `e2e/specs/counter/kept-keys.e2e.ts` (id unchanged).
- Gates at `f4448454`: tsc incl. e2e clean, lint clean, jest 13582 passed / 1 skipped (shots cache present; baseline 13448, +134), lifecycle 63/64 with G-S61 torn-read only (see below), e2e `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (baseline 622/631 + 5), shots/freeze/parity not run: the diff touches no CSS input.
- G-S61: 4 runs on this host, all FAIL on the torn-read line only (0 stale frames); clean `42c26272` src fails identically (4 frames torn, load 9.8) => host load per the ruling.
- Superproject worktree: branch on origin/main `2945c3ea`; commit `7f7f3eeb` (CHANGELOG), commit `6c77ff1a` (pointer bump to `f4448454`), head `6c77ff1a`. Not pushed.

## Commits (dse, on 42c26272)
`635488bf` fix, `236ebecc` jest, `69c694ae` docs, `12e38fe7` e2e (r1 commits rebased), `6b6674e5` M-1 + L-1 + I-4 + tests, `f4448454` lint (return a boolean).

## M-1 details
- `src/framework/prefOverrides.ts`: `bodyDeclaresTopLevel(body, key)` exported; the `TOP_LEVEL_PREFS_RE` text test removed. `collapsedKey.ts`: `topLevelRe` removed, `withCollapseKeys` calls the helper; L-1 comment (lines 271-273) replaced with a pointer to the shared guard.
- Tests: `wrapperKeysKept.test.ts` SC-514 block now has the six reviewer hero cases (`"prefs": {boardDensity: compact}`, `'prefs': compact`, `? prefs`/`: {...}`, `"collapsed": yes`, `"prefs": {reduceMotion: true}`, `"collapsed": true`): declared once after a write, the written body parses (a duplicate key throws), it redraws without an error card. All six fail on the r1 src (stashed src, 6 failed / 3 plain-hero cases passed). `reservedKeysKept.test.ts` adds `bodyDeclaresTopLevel` unit tests (plain/quoted/single-quoted/explicit key, nested only, block scalar, empty map, non-map and unparseable fallback) and a both-wrappers test.

## SC-514 cases that are single after M-1 (ds-hero, one write each, then redraw)
Column-0 `prefs:` applied override, unknown-only map, scalar; `"prefs": {boardDensity: compact}`; `'prefs': compact`; `? prefs` / `: {boardDensity: compact}`; `"collapsed": yes`; `"prefs": {reduceMotion: true}` (the original SC-514 applied-override case); `"collapsed": true`. Not tested (out of scope, SC-669): a whole-document-indented hero body.

## Gate numbers (all at `f4448454`, logs below)
- jest 13582 passed / 1 skipped / 13583 total (cached `visual-harness/dist/obsidian-app.css` present from the earlier shots run).
- lifecycle parts: p1 21/21, p2 16/16, p3 9/9, p4 3/4 (G-S61 only), p5 7/7, p6 4/4, p7 3/3 = 63/64.
- G-S61 re-runs: head x3 (part 4 run, then alone twice: torn in 6, 10, 8 frames in a row; 0 stale frames, loads ~9 / ~4 / ~3), clean `42c26272` src x1 (torn 4 frames, load ~9.8): same failure, no other G-S61 failure.
- e2e 627/636 ok, 0 failed, 9 known-bug, coverage 417/417; no NEGO-R05 / SET-X03 / SET-X04 flake this run.
- shots / freeze / parity: not run. No `styles-source.css` or other CSS input changed vs `42c26272` (`git diff --stat 42c26272 HEAD` lists no css), so styles.css is the clean build's.

## Superproject (worktree `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept`)
- Before the move: `git status --porcelain` showed only ` M draw-steel-elements` (the gitlink), branch had no commits of its own at `63843336`; `reset --hard origin/main` (2945c3ea, as told to use current) done after `fetch`.
- `7f7f3eeb docs(changelog): SC-652 a write keeps a prefs: or collapsed: line the plugin cannot use` (draft copied exactly as the first bullet under `## Unreleased`; only CHANGELOG.md staged).
- `6c77ff1a chore: bump draw-steel-elements to f4448454 (SC-652: a write keeps a prefs: or collapsed: line the plugin cannot use)`; `git diff --cached --name-only` was exactly `draw-steel-elements`. No trailers. Working tree clean afterwards.

## Drive-by fixes / Follow-ups
- Drive-by: none. Follow-ups: none new.

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r1-impl/r3/`: `tsc.log`, `lint.log`, `jest.log`, `lifecycle-p1.log` ... `lifecycle-p7.log`, `e2e.log`, `gs61-base.log`, `gs61-head.log`, `gs61-head2.log`; mutation: `../r3-jest-mut.log`, `../r3-jest1.log`.

---

# r5 (fix round, N-1)

## Summary
- DONE. dse head `bab0dbb2` (one commit on `f4448454`; develop still `42c26272`, did not move). Nothing pushed.
- N-1: `montage/view.ts` and `initiative/view.ts` `setSerializer` now store `ser: serializeModel(model)` (the plain serialization the refresh compares with) and keep `raw: normalizeBlockText(out)`.
- Tests: montage (`montage-outside-edit.test.ts`, 3 tests x 5 reserved-line cases) and initiative (`initiative-outside-edit.test.ts`, 2 tests x 5), both driven as the sidebar does (`prepareModel` then `update()`). 12 fail on the `f4448454` source (the "no reserved line" cases pass there, as expected); all pass now.
- Gates at `bab0dbb2`: tsc incl. e2e clean, lint clean, jest 13607 passed / 1 skipped (+25 over 13582; shots cache present), lifecycle 63/64 with G-S61 torn-read only, e2e `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`. shots/freeze/parity carry (no CSS input in `git diff --name-only 42c26272 HEAD`).
- G-S61 on clean `42c26272` src, this round: FAIL, torn in 3 frames in a row, 0 stale frames, load 2.55 at start / 1.25 at end.
- Superproject worktree: base origin/main `2945c3ea` (unchanged), commits `7f7f3eeb` (CHANGELOG, unchanged) and `a5aa9700` (pointer bump to `bab0dbb2`, amended from `6c77ff1a`); head `a5aa9700`. Only the gitlink staged; no trailers; not pushed.

## Notes
- The real pinned sidebar does not reach the bug for the initiative tracker's own echo: its host filters the self-echo, and an edit elsewhere in the note did not close the window in a first attempt through the full sidebar harness (those tests passed on the old source, so they were dropped). The initiative tests therefore drive `prepareModel` + `update()` on a mounted view directly, like the montage ones, with the Conditions window open across the tracker's own write.
- A first version of the initiative test imported a type from a path tsc could not resolve; caught by the first gate run, fixed and the commit amended before the full battery (the aborted partial run is not counted).

## Lifecycle parts at `bab0dbb2`
p1 21/21, p2 16/16, p3 9/9, p4 3/4 (G-S61 only: "torn in 10 frames in a row"), p5 7/7, p6 4/4, p7 3/3.

## Artifacts
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r1-impl/r5/`: `tsc.log`, `lint.log`, `jest.log`, `lifecycle-p1.log` ... `lifecycle-p7.log`, `e2e.log`, `gs61-base.log`. Mutation run (old source): `../r5-jest-mut3.log`; passing runs `../r5-jest3.log`, `../r5-jest1.log`.

# SC-586 r3 fix round report

Executive summary
- Status: DONE. LOW-1, LOW-2 (canvas readback), LOW-3 and the CHANGELOG INFO are folded in.
- Final dse head `6be3d411` (rebased onto `origin/develop` `df92a3f6`, confirmed unmoved at the end). Superproject head `cea0eb59`, rebased onto workspace `origin/main` `fd727403` (it had moved past the `65098e06` you named; `65098e06` is its ancestor).
- Superproject since origin/main: `c7bcdd97` CHANGELOG (the single existing commit, amended) then `cea0eb59` `chore: bump draw-steel-elements to 6be3d411 (SC-586)`. No interim pointer commits.
- All gates re-run on the FINAL head after both rebases (a first full run on the `1cc54eac` base was discarded).
- Fresh jest 11833 / 2 skipped (= 11817 + 16); lifecycle 63/63 in seven parts (part 7 `G-S108,G-S112`); e2e 334/337 ok, 0 failed, 3 known-bug, 176/176; shots 592 / 163/978 / 40/240 / 147; freeze 280/280; parity 0/0/24.
- Revert proof: canvas jest test fails alone (1 failed) with the old helper; COND-H03 fails with the old helper in real Obsidian and passes with the fix, reading `#239382`; the LOW-3 assertion fails (2 failed) with the keep-visible rule reverted to `entry.icon`.

## Changes (dse, on top of the r1/r2 commits)
- `src/elements/conditionColorHex.ts` (`cb7e0889`): when the computed colour is not `rgb()/rgba()` (oklch, lab, lch, color(), color-mix() keep their syntax), the COMPUTED string (never the note's raw text) is painted on a 1x1 canvas with `getContext('2d', { willReadFrequently: true })` and the pixel read back; `undefined` when there is no 2D context (jsdom). Doc comment rewritten (LOW-1): keywords such as `currentcolor`/`inherit` resolve against `<body>`; the two-step description; no claim that it cannot disagree with `isConditionColor`.
- jest (`test/dom/views/conditions-modal-matrix.test.ts`, same commit): 3 new tests (oklch with a `getContext` stub that records the painted string `oklch(0.6 0.1 180)` and returns pixel [35,147,130] -> `#239382`; an rgb-resolving colour never calls `getContext`; oklch with no 2D context -> `#ffffff` and pipette still selected). LOW-3: the `"skull "` test now asserts exactly one chip whose trimmed label is `Icon: skull`.
  - jsdom note: jsdom 26 accepts `oklch()` in `CSS.supports` and keeps it as `oklch(...)` in computed style (probed), so the real helper path reaches the canvas branch with only the 2D context stubbed.
- e2e (`6be3d411`): `hand-written.md` gets a third hero condition `prone` with `color: "oklch(0.6 0.1 180)"`; new `[COND-H03]` expects the custom input `.value` `#239382`, pipette `data-selected`, no write, note unchanged. README fixture row updated.
- Docs: `docs/initiative-tracker.md` mentions `oklch()`. CHANGELOG bullet: `#AABBCC` removed, `oklch()` mentioned (amended into the single CHANGELOG commit).

## Gates (final head dse `6be3d411`; logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc586-r3-impl/`)
| Gate | Measured | Expected delta from base | Log |
|---|---|---|---|
| tsc (+ e2e) / lint | exit 0 / exit 0 | clean | `tsc.log` `lint.log` (+ `.exit`) |
| jest fresh (shots cache moved aside) | `Test Suites: 1 skipped, 276 passed`; `Tests: 2 skipped, 11833 passed, 11835 total` | 11817 + 13 (r1) + 3 (canvas) = 11833 | `jest-fresh.log` |
| jest with shots cache | `1 skipped, 11834 passed, 11835 total` | 11818 + 16 | `jest-cache.log` |
| lifecycle 1 / 2 / 3 / 4 / 5 / 6 / 7 | 21/21, 16/16, 9/9, 4/4, 7/7 (G-S91 ok), 4/4, 2/2 (`G-S108,G-S112`) = 63/63, 0 failed | 63/63 | `lifecycle-part1..7.log` |
| e2e | `OBSIDIAN-E2E done: 334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` | 331/334 + 3 COND-H | `e2e.log` |
| shots | 592 PNGs; 163 button kinds = 978; 10 modal scenarios, 40 button kinds = 240; capture clip 147 | unchanged | `shots.log` |
| freeze | `freeze OK (280/280 ...)` | unchanged, baseline untouched | `freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` | unchanged | `parity.log` |

Old-base (`1cc54eac`) runs, superseded and not counted, are in `sc586-r3-impl/oldbase-1cc54eac/`.

## Revert proofs
- Canvas jest (helper restored to the pre-r3 version, matrix file alone): `Tests: 1 failed, 347 passed, 348 total`; the failing test is the oklch seed. The other two new tests pass without the fix by design (rgb path never uses the canvas; no-context stays white). `jest-revert-canvas.log`.
- LOW-3 (keep-visible rule set back to `entry.icon`): `2 failed, 346 passed` (the whitespace-only blank-chip test and the `"skull "` test). `jest-revert-low3.log`.
- e2e (old helper, `--only=COND-H01,COND-H02,COND-H03`): H01 and H02 pass, `[COND-H03]` fails (`2/3 ok, 1 failed`); with the fix 3/3 ok. `e2e-only-reverted.log`, `e2e-only-fixed.log`.

Drive-by fixes: none.

Follow-ups: none new. Keywords (`currentcolor`, `inherit`, `unset`, `revert`) seed `#dadada` in Electron (the review's measurement); this is documented in the helper's comment, not changed.

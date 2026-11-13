# SC-586 r4 scoped re-review: r3 fix delta `8144bfc4..6be3d411`

Executive summary
- Verdict: LAND. No HIGH, MEDIUM or LOW findings; 3 INFO, none blocking.
- (1) The delta does what r2 prescribed. Canvas readback paints the COMPUTED string (`conditionColorHex.ts:24-35`) on a 1x1 canvas. With no context it returns undefined (l.31) and the input stays white. The doc comment (l.9-17) is accurate against r2's Electron measurements. LOW-3's one-chip assertion and the CHANGELOG fold are in.
- (2) The rebase lost nothing. `range-diff 3a5986d3..57618b62 df92a3f6..8144bfc4` shows all 5 patches `=`. dse origin/develop is still `df92a3f6`. The superproject is exactly 2 commits ahead of origin/main `fd727403`: `c7bcdd97` touches only CHANGELOG.md, and `cea0eb59` is the only pointer bump, to `6be3d411`.
- (3) Gates on dse `6be3d411`: tsc exit 0, lint exit 0. jest with the shots cache: `Tests: 1 skipped, 11834 passed, 11835 total`. e2e: `OBSIDIAN-E2E done: 334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, with COND-H01, COND-H02 and COND-H03 ok.
- Revert proof: with the helper set back to `8144bfc4`, the matrix file gives `1 failed, 347 passed, 348 total`, and the one failure is the oklch canvas test. Restored afterwards; tree clean at `6be3d411`.
- I did not re-run lifecycle, shots, freeze or parity. The src delta is one branch that only runs when the computed colour is not `rgb()`. No lifecycle scenario or shot fixture contains such a colour, and no CSS changed.
- (4) The CHANGELOG bullet is accurate: name, `#abc`, `rgb()`, `hsl()`, `oklch()`; unreadable stays white; blank icon; `"skull "`; no write on look. `#AABBCC` is gone.

## Checks

1. **Delta correctness** (`src/elements/conditionColorHex.ts`)
   - Step 1 is unchanged. The regex now runs on the `computed` local, and its match is mapped to numbers. The final `Math.min(255, Math.round(n))` applies to both paths.
   - Step 2 (l.26-35) runs only when step 1 fails. It creates a canvas, sets it to 1x1, calls `getContext('2d', { willReadFrequently: true })`, and returns `undefined` on null. It then sets `fillStyle = computed` (the computed value, not `color`), runs `fillRect`, and reads `getImageData(...).data.slice(0, 3)`.
   - The probe span is still removed in `finally`, including on the early return.
   - The pixel matches r2's measurement in real Obsidian: `oklch(0.6 0.1 180)` gives `[35,147,130]`, which is `#239382`. The COND-H03 expectation is the same value.
   - The comment is accurate. Keywords resolve against `<body>`. oklch, lab, lch, color() and color-mix() keep their syntax and are canvas-read. It returns undefined for unparseable input or no 2D context. The false "can never disagree" claim is gone.
2. **Rebase**: the range-diff is 1:1 `=` for all five r1 commits. On top sit two r3 commits, `cb7e0889` (fix, jest, LOW-3) and `6be3d411` (e2e, fixture, README, docs).
3. **Tests**: three new jest tests: oklch through a stubbed context, rgb never calling getContext, and no-context staying white. Plus the LOW-3 assertion. COND-H03 checks the value `#239382`, `data-selected`, no write, and that the note entry is unchanged. Adding `prone` to `hand-written.md` does not disturb H01/H02: their text assertions are substring `toContain` on other lines, and no other spec uses this note.

## INFO (optional, non-blocking)

- INFO-1, `test/dom/views/conditions-modal-matrix.test.ts` (new oklch canvas test, l.1111). The test cannot tell "paints the computed string" from "paints the raw note text": in jsdom, `oklch(0.6 0.1 180)` computes to the identical string. I measured jsdom 26 directly: `OKLCH(60% 0.1 180)` computes to `oklch(0.6 0.1 180)` and `lab(50% 40 59.5)` to `lab(50 40 59.5)`. Feeding the test `OKLCH(60% 0.1 180)` and keeping `expect(painted).toEqual(['oklch(0.6 0.1 180)'])` would pin the computed-not-raw rule. It matters in real use for `var(--x)` when `--x` is an oklch value: the raw `var()` text would paint black.
- INFO-2, `src/elements/conditionColorHex.ts:32`. If the canvas ever rejected a computed string, `fillStyle` would keep its default `#000000` and the chooser would seed black, not white. None of the 37 spellings measured in r2 hits this: every non-rgb computed value painted correctly. A sentinel check would close it: set `fillStyle = '#010203'` first and return undefined if it is unchanged after assignment. Theoretical only.
- INFO-3, `e2e/specs/conditions-modal/cond-handwritten.e2e.ts:1-4`. The header comment still says "two hand-written YAML spellings" and "The first is about the browser's own colour parsing". Now the first and third (oklch) both are. Wording only.

## Gates (dse `6be3d411`)

| Gate | Result | Log |
|---|---|---|
| tsc | exit 0 | `tsc.log` |
| lint | exit 0 | `lint.log` |
| jest (shots cache) | `Test Suites: 1 skipped, 276 passed`; `Tests: 1 skipped, 11834 passed, 11835 total` | `jest.log` |
| e2e | `OBSIDIAN-E2E done: 334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (SC-257, SC-384, SC-355) | `e2e.log` |
| revert (helper at `8144bfc4`, matrix file) | `Tests: 1 failed, 347 passed, 348 total` (the oklch canvas test) | `jest-revert.log` |
| jsdom normalization probe | see INFO-1 | `jsdom-probe.cjs` (run output inline above) |

Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc586-r4-rereview/`.

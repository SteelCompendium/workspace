# SC-613 r4 scoped re-review report

**Executive summary**
- Verdict: **LAND.** Delta `8978b6f0..9b94baf2` is test-only (`git diff --stat`: the matrix jest file +41, `cond-integrity.e2e.ts` +21; `src/` and CSS untouched). All three folds (LOW-1, LOW-2, INFO-2) are done as ruled and are not vacuous.
- Findings: 0 HIGH · 0 MEDIUM · 0 LOW · 2 INFO (no action needed).
- Gates on `9b94baf2`: tsc + tsc -p e2e clean, `npm run lint` rc 0 · jest full **11854 passed / 1 skipped** (shots cache present; = 11853 / 2 fresh) · matrix file **368 / 368** · e2e full **`338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · `--only=COND-N12..N15` 4/4.
- Popout test (LOW-1): asserts `container.ownerDocument === pdoc`; killed by M10 (global `document`), M14 (top-most query on the global document) and M15 (target test against the global document's body), 1 failed each; passes alone under M3, fails alone under M10.
- afterEach (LOW-2): masks nothing. With the close removed the file is still 368 / 368; with the close kept, 4 `--randomize` seeds are 368 / 368. M3 now fails exactly 1 test (was 8; 9 with the close removed).
- COND-N15 (INFO-2): asserts `cond.input` not existing after the body `d`, no write to the note (`expectNoWrite` around the whole body), Escape closes only the palette, then `daz` exactly. Under M3 it FAILS on "cond.input not to be existing"; N12-N14 stay ok.
- Source restored after every mutant; plugin `git status --porcelain` empty at start and end, HEAD `9b94baf2`.

## Checks

### (1) Popout jest test, `test/dom/views/conditions-modal-matrix.test.ts` (new test "a popout window: ...")
- The `document.body.appendChild` spy moves the `.modal-container` into the iframe body; the test asserts `expect(o.container.ownerDocument).toBe(pdoc)` before anything else, so a spy that silently stopped working fails the test rather than turning it vacuous.
- Mutants (`sc613-r4-mutate.py.txt`, matrix file, 368 tests):
  | Mutant | Result |
  |---|---|
  | M10 `keyDoc = document` | 1 failed (the popout test); alone with `-t`: 1 failed |
  | M14 `document.querySelectorAll('.modal-container')` instead of `doc.` (top-most check's doc scoping dropped) | 1 failed (the popout test) |
  | M15 target test against `document.body` / `document.documentElement` instead of `doc.` | 1 failed (the popout test) |
  | M16 `.menu, .suggestion-container` guard queried on `document` instead of `doc` | 0 failed: survives (INFO-1) |
  | M3 top-most check removed | 1 failed (the stacked-modal test); the popout test alone passes under M3 |
  | M11 first `.modal-container` instead of last | 1 failed (the stacked-modal test) |
- The main-document half (a body key of the main document does nothing) and the after-close half (a `typeToSearch` spy, neither document routes) are both asserted.

### (2) afterEach closing the opened windows
- `open()` is the only place in the file that constructs a `ConditionsModal` (`grep new ConditionsModal`: line 27 only), so every window is tracked.
- Test-side mutant: the close line replaced with `opened.splice(0)` (the r2 state). Matrix file 368 / 368, so no test passes only because of the close. Head with `--randomize --seed=1 / 42 / 613 / 90210`: 368 / 368 each.
- Combined with M3: close removed + M3 = 9 failed (the r2 pollution); close kept + M3 = 1 failed. The honest kill count is now visible.

### (3) COND-N15, `e2e/specs/conditions-modal/cond-integrity.e2e.ts` (new `it`)
- Asserts what was asked: `not.toBeExisting()` on `cond.input` right after the body `d`; the whole sequence is inside `dse.expectNoWrite(TRACKER, ...)`; Escape closes only the palette (waits for 1 `.modal-container`, `modal.root` still exists); real title click, body focus asserted, `daz` -> input focused with value exactly `daz`.
- Head: `--only=COND-N12,COND-N13,COND-N14,COND-N15` 4/4 ok. Under M3: `3/4 ok, 1 failed`, `COND-N15 FAIL: Expect ... [data-dse-control="cond.input"] not to be existing | Received: "existing"`. No bracketed ticket id in the title; no new control, coverage stays 176/176.

### (4) Gates
- tsc `--noEmit` and `-p e2e` clean; `npm run lint` rc 0 (`sc613-r4-gate-tsc-lint.log`; note the test file is in the lint ignore list, as for every test file).
- jest full (`rm -f main.js styles.css` first): `Tests: 1 skipped, 11854 passed, 11855 total` (`sc613-r4-gate-jest.log`).
- e2e full: `OBSIDIAN-E2E done: 338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`, rc 0 (`sc613-r4-gate-e2e.log`).
- Lifecycle, shots, freeze, parity: not re-run; the delta has no `src/` or CSS change (r2's numbers carry: lifecycle parts 1 and 5 green on `8978b6f0`, `styles.css` identical to the base build).

## INFO
- **INFO-1:** M16 (the menu / suggest guard looking at the main document instead of the window's own) survives: the popout test has no menu in the iframe. The guard is defensive only (r2 INFO-1: no real path puts a `.menu` or `.suggestion-container` over the window), so no test is needed. Optional: one more line in the popout test (a `.menu` in `pdoc` blocks the route) would pin it.
- **INFO-2:** the r3 implementer report says "the matrix file is 461 passed with it"; measured 368 / 368 (367 at r2 + 1 popout test). Report typo only, no effect.

## Artifacts (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/`)
`sc613-r4-rereview-report.md`, `sc613-r4-gate-tsc-lint.log`, `sc613-r4-gate-jest.log`, `sc613-r4-gate-e2e.log`, `sc613-r4-mutants-jest.log`, `sc613-r4-jest-afterEach-close-removed.log`, `sc613-r4-e2e-summary.log`, `sc613-r4-e2e-n12-n15-head.log`, `sc613-r4-e2e-n12-n15-M3.log`, `sc613-r4-mutate.py.txt`.

# SC-595 r7: scoped re-check of the r6 delta (reviewer R3)

## Executive summary
- **Verdict: LAND.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO.
- **Rebase onto `c3fd8323` is clean.** `range-diff` shows all 9 pre-r6 commits `=`.
  - SC-578 and SC-595 share one file, `src/elements/initiative/view.ts`, and their hunks are disjoint.
  - SC-578's hunks in the head are byte-identical to SC-578's own diff.
  - e2e INIT-M09 and INIT-R03 pass.
- **r5 MEDIUM-1 is fixed.**
  - The tests use literal 10 / 150 ms delays and a fake-timer step at 150 ms; G-S83 has a new step that presses the stamina bar's number text, then Escape.
  - **M16 (`[10]` only) is red in jest** (2 of 32 SC-595 tests, and the count stays 32) **and in G-S83** (FAIL on the `stamtext` trial only).
  - Spot-checked mutants M11, M12 and M13 stay killed (2, 5 and 2 reds).
- **Gates on `6725243c`, run by me:**
  - tsc clean, lint clean.
  - jest 7231 passed / 2 skipped (fresh worktree; 7199 + 32); the SC-568 suites alone 78/78.
  - lifecycle part 5: 5/5 (320 s).
  - e2e: `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, first run.
  - `styles.css` `5e5ff488…` is byte-identical to a clean `c3fd8323` build.
- **INFO-1:** the G-S83 `stamtext` trial does not check that its press really landed on text (the 150 ms helper path). It works today (M16 turns it red), but a layout change could make it pass without testing anything. Optional fix: a hit-test assert.

## 1. Rebase (`sc595-r7-range-diff.log`)
- The `range-diff` of `6c7216e8..a53b0454` against `c3fd8323..d15616bc` maps 9 of 9 commits as `=`.
- `merge-base` = `origin/develop` = `c3fd8323`.
- **Shared file:** only `src/elements/initiative/view.ts`.
  - SC-595's hunks: drop `import type { Modal }`, change `DseModal` in the kit import, change the `activeModal` type, and add the `openModal(modal: DseModal)` anchor.
  - SC-578's hunks: the `applyMaliceChange` import, the Malice log line with `(requested, capped at 0)`, and the quick-add.
  - Diffing SC-578's hunks against the same hunks in `a53b0454..6725243c` shows them IDENTICAL.
- `test/dom/elements/initiative.test.ts` is not touched by SC-578. tsc is clean, so every `openModal` caller passes a `DseModal`.
- **SC-578's behaviour holds.** In the full e2e:
  - `[INIT-M09]` ok: a quick-add the pool clamps logs -3 with -5 requested.
  - `[INIT-R03]` ok.

## 2. MEDIUM-1 delta (`d15616bc..6725243c`)
- **`test/dom/kit/managedModal.test.ts`**
  - `POPOVER_PUSH_DELAYS_MS = [10, 150]` is a literal, and the production import is gone.
  - The helper-order test is `test.each` over the literals.
  - New fake-timer `test.each([[10],[150]])`: the popover's timer is armed before the modal opens. At `ms-1` the modal is on top. At `ms` the popover pushes, then the modal re-pushes, and the stack is `[popover, modal]`. After close, the popover is on top.
- **`formModalHoverPreview.test.ts`:** waits a literal 200 ms.
- **G-S83 `stamtext`** (Reading view): a real press on the first text node in the stamina bar, wait 450 ms, Escape, then expect the preview still shown and the modal closed.
- **Docs:** the dse-verify proposal (CURRENT at `6725243c`, M16 correction) and the correction note on `sc595-r4-fix-report.md` are both present.
- **Mutants** (`sc595-r7-mutants.log`, control 32/32):

| Mutant | Result |
|---|---|
| M16 `[10]` | jest: 2 red (both 150 ms cases); 32 tests still run. G-S83 on the M16 bundle: FAIL `stamtext modal rv: Escape must close the modal and leave the preview {"popover":true,"modal":true,"modals":1}`; every other trial passes |
| M11 `contains()` | 2 red |
| M12 synchronous guard removal | 5 red |
| M13 arm at open | 2 red |

- **INFO-1:** the `stamtext` trial (`visual-harness/obsidian-lifecycle.mjs` ~1545-1559) takes the centre of the first text node's rect but never asserts that `elementFromPoint` there is the text's parent. If the bar's layout ever puts another element over the number, the trial would quietly take the 10 ms path and stop catching M16. Optional: assert the hit and record it in the outcome line.

## 3. Gates (head `6725243c` on `c3fd8323`)

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc 0 | `sc595-r7-gate-tsc.log` |
| lint (incl. `e2e/`) | clean, rc 0 | `sc595-r7-gate-lint.log` |
| jest, fresh (`rm -f main.js styles.css` first) | `Tests: 2 skipped, 7231 passed, 7233 total`; suites 261 passed / 1 skipped; rc 0 | `sc595-r7-gate-jest.log` |
| SC-568 suites alone (`-w 2`) | 78/78 | `sc595-r7-gate-jest-sc568.log` |
| lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` | **5/5 ok**, rc 0, 12:29:47-12:35:07 (320 s incl. build, loadavg 11-36); G-S83 ok includes `stamtext modal rv` | `sc595-r7-gate-lifecycle-p5.log` |
| e2e | `OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0, 171 s, pointer parked | `sc595-r7-gate-e2e.log` |
| styles.css | `5e5ff4884e05…` identical for `c3fd8323`, `6725243c` and the M16 bundle | `sc595-r7-styles-sha.log` |

## 4. Hygiene
- The worktree is as I found it: superproject ` M draw-steel-elements` (pointer unstaged by design), dse clean at `6725243c`. I made no edits there.
- Mutants and bundles were built in `git archive` copies in scratch.
- One kept lifecycle FAIL dir was mine (the M16 run): `/tmp/dse-obsidian-lifecycle-43sxwH`, removed by that literal path.

## 5. Artifacts
- **Ledger directory:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`
  - `sc595-r7-recheck-report.md` (this file)
  - `sc595-r7-gate-{tsc,lint,jest,jest-sc568,lifecycle-p5,e2e}.log`
  - `sc595-r7-styles-sha.log`, `sc595-r7-range-diff.log`, `sc595-r7-mutants.log`
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r7-recheck-R3k7/`

# SC-595 r5: scoped re-review of the r4 delta (reviewer R3)

## Executive summary
- **Verdict: FIX, tests and docs only.** The product code at dse `a53b0454` is correct. Every r3 finding is fixed in real Obsidian, and the probes found no regression in the code. One fix claim is false at the final head.
- **Findings:** 0 CRITICAL, 0 HIGH, 1 MEDIUM, 1 LOW, 4 INFO.
- **MEDIUM-1:** no test guards the 150 ms re-push (the O5 Escape fix for a modal opened by a click on text). Mutant M16 (`HOVER_HELPER_DELAYS_MS = [10]`) passes all 31 SC-595 jest tests and passes G-S83. On that bundle, real Obsidian shows Escape dead again after a click on the stamina bar's numbers. The r4 report and the dse-verify proposal say M16 is killed. That was measured before `a53b0454`, and the test now builds its cases from the production constant.
- **LOW-2 (pre-existing, not an r4 regression):** a click inside a preview-opened modal within the click-to-edit helper's delay (150 ms after a click on text) still closes the modal and the preview. The cause is Obsidian's window-capture `T3` handler. It shows on `74b138f0` too and is reachable with a fast double-click.
- **Gates (head `a53b0454` on `6c7216e8`):**
  - tsc clean, lint clean.
  - jest **7221 passed / 2 skipped / 261 of 262 suites**, fresh worktree; the SC-568 suites alone 78/78.
  - lifecycle part 5 **5/5** (about 300 s).
  - e2e **`259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** (126 s, first run, no RECOV-R07 flake).
  - `styles.css` sha256 `5e5ff488…` byte-identical to a clean `6c7216e8` build.
- **Rebase:** `range-diff` shows all 8 commits `=`. SC-573 and SC-595 share no file.
- **r3 probe on the new head:** every case that failed on `0f5c9c98` passes: Add condition, the cog and an option chip (RV and LP); form Cancel and the backdrop (RV and LP); free-heal Confirm and Cancel (RV and LP); Stamina Apply (RV and LP); Escape at about 150 ms. I re-ran 5 of them on the `74b138f0` bundle and they fail there.
- **Mutants:** 16 run over the 31 SC-595 tests. Killed: M8-M15, R1, R2, R3. Survivors: M16 (MEDIUM-1), R4 (jsdom blind, but G-S83 FAILs it in 4 trials), R5, R6, R7 (equivalent or near-equivalent).

## 1. Setup
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`.
  - Superproject `701674ac`, porcelain ` M draw-steel-elements` before and after. The pointer is unstaged by design.
  - dse `a53b0454`, porcelain empty before and after.
  - `origin/develop` = `6c7216e8` = merge-base.
- **Nothing was edited in the worktree.**
  - Mutants and probes ran in `git archive` copies in scratch (`head/` = `a53b0454`, `prev/` = `74b138f0`, `base/` = `6c7216e8`, `mut/`, `b-<mutant>/`), with `node_modules` symlinked.
  - Bundles were built there with `node esbuild.config.mjs production`.
- **Gates ran in the worktree.**
  - jest ran `rm -f main.js styles.css` first; the lifecycle and e2e runs rebuilt both. These are ignored build artifacts, present before and after.
- **Probe harness:** the r3 probe (`sc595-r3-probe-scenario.js.txt`), spliced into a scratch copy of the head `obsidian-lifecycle.mjs`. It uses the real CDP mouse and keyboard through G-S83's `gs83Kit`. I added these trials:
  - `outside` (close, then at once a real click outside the preview);
  - `reopen`;
  - `esc:<cpu>:<opener>:<delay>` (an Escape sweep);
  - `childquick` / `titlequick` / `inputquick` (a click in the modal N ms after the opening click);
  - `plugcount` (plugin-origin `click` listeners on window and document, counted by wrapping `addEventListener` / `removeEventListener` and checking `plugin:draw-steel-elements` in the stack, plus keymap depth);
  - `ctxmenu`.
  - The scenario is saved as `sc595-r5-probe-scenario.js.txt`.
- **Load:** loadavg 2-12 for most of the run, with a spike to 42 during lifecycle part 5.

## 2. Findings

### MEDIUM-1: no test guards the 150 ms re-push; the "M16 killed" claim is stale
- **Where:**
  - `test/dom/kit/managedModal.test.ts:782`: `test.each(HOVER_HELPER_DELAYS_MS.map((ms) => [ms]))(…)` builds its cases from the production constant.
  - `:851`: `jest.advanceTimersByTime(Math.max(...HOVER_HELPER_DELAYS_MS))`, the same.
  - The constant is `src/framework/kit/managedModal.ts:29`.
- **Mutant:** M16 sets `HOVER_HELPER_DELAYS_MS = [10]`.
  - The 150 ms `test.each` case disappears, and the max-delay test advances only 10 ms.
  - Result on `a53b0454`: **0 failed / 30 passed** (31 → 30 tests; nothing notices the missing one).
  - The r4 log (`sc595-r4-mutants.log`, "M16-one-delay-only: failed 1") was measured on the head before `a53b0454`. That commit rewrote the killing test to fake timers advanced by `Math.max(...HOVER_HELPER_DELAYS_MS)`.
- **G-S83 does not catch it either.** G-S83 alone on the M16 bundle: **ok** (`sc595-r5-mutants.log`). Its openers are buttons or the bar's centre (the 10 ms helper path).
- **Failure scenario (measured on the M16 bundle, `sc595-r5-probe-m16-bundle.log`):**
  - A real click on the stamina bar's "15" in a preview takes the 150 ms helper path.
  - Escape 300 ms or 600 ms later does nothing: `{"popover":true,"modal":true}`, and the popover's scope is on top (`195 push other` after the modal's only re-push at 60).
  - That is bug O5 coming back. On head the same trials close the modal (`esc:1:stamtext:300`, `:170` ×3).
- **Docs:** `sc595-dse-verify-proposal.md` §4 says "the 16 mutants of `sc595-r4-mutants.log` are each killed". The r4 report's table says M16 is killed (1 red). Both are false at `a53b0454`.
- **Prescribed fix:**
  1. In `managedModal.test.ts`, use literal delays: `test.each([[10], [150]])` for the helper-order test.
  2. In the fake-timer test, advance to 149 ms, push the popover's scope, advance 1 ms, and assert the modal's scope is on top. Optionally add `expect(HOVER_HELPER_DELAYS_MS).toEqual([10, 150])`.
  3. Re-run M16; it must go red.
  4. Optional: G-S83's stamina trial opens once by a real click on the bar's number text, then sends Escape. That gives real-Obsidian cover for the 150 ms path.
  5. Correct the proposal's "each killed" sentence and the r4 mutant row.

### LOW-2: a click in the modal within the helper's delay still closes everything (Obsidian `T3`; pre-existing)
- **Mechanism (Obsidian 1.15.1 `app.js:509`, excerpt in `sc595-r1-obsidian-excerpts.txt`):**
  - `T3` is a window CAPTURE `click` listener. It hides, 5 ms later, every shown popover that is not `isFocused` and does not contain the target.
  - `isFocused` is set only by the click-to-edit helper's `p()`, which runs 10 ms after a click on a button and 150 ms after a click on text.
  - The DSE guard is a document bubble listener and cannot stop a window capture listener.
- **Measured** (head `sc595-r5-probe-head.log`; `74b138f0` `sc595-r5-probe-prev.log`):
  - Stamina modal opened by a real click on the bar's text, then a real press in the modal at 83-169 ms (on the title, in the Apply input, or on Spend Recovery): `{"popover":false,"modal":false,"modals":0}`.
  - The pop comes about 5 ms after the press (`145 cap click`, `151 pop modal`).
  - The same at 255 ms or later: fine.
  - Opened by a click on the bar itself (10 ms helper), a press at 84 ms: fine.
  - Same result on `74b138f0`. On base, every click closes everything anyway.
- **Reach:** a fast double-click on the stamina bar's numbers (the second click lands on the modal or backdrop within 150 ms). Nothing typed can be lost in 150 ms; the modal just flashes and closes.
- **This also qualifies LOW-6's real-Obsidian story.** A child opened by a click inside a text-opened parent within 150 ms never gets a chance: T3 closes everything first. The reachable LOW-6 case (parent opened from the bar, child at about 50 ms, `childquick:1:bar:30` ×4) passes on head: child on top, the first Escape closes only the child, the second closes the parent, and the preview stays.
- **Prescribed:** no change in this ticket. Optionally, the owner files a Backlog follow-up: when a DseModal opens from a preview, mark the popover focused via its instance (`view.previewMode.hoverPopover` / `view.hoverPopover`, as G-S83 cleanup reaches it) with `setIsFocused(true)`. Then `T3` skips it. The CHANGELOG's "whatever you click in them" is accurate except for this 150 ms window. Owner's call whether to soften it.

### INFO-3: R4 (guard removed by `queueMicrotask`) is invisible to jsdom; G-S83 catches it
- jsdom's script-dispatched `.click()` runs no microtask checkpoint between listeners, so R4 passes 31/31.
- In Chromium, a real click checkpoints after each listener, so the guard is gone before the document.
- G-S83 on the R4 bundle FAILs: form Cancel (RV, LP) and free-heal Confirm (RV, LP). So the real gate covers HIGH-2's class. No action.

### INFO-4: equivalent or near-equivalent survivors
- **R7** (drop the `dseOpen` check) is equivalent, as r4's M7a.
- **R5** (arm on any window click, not only the opening one) is near-equivalent. Clicks inside the modal never reach the window, and a click outside lands on the backdrop.
- **R6** (a closed modal is not removed from `previewModals`) is not strictly equivalent. A child opened and closed within its parent's 150 ms window would stay the "newest", and the parent's 150 ms re-push would be skipped; the list also grows. That needs sub-150 ms open and close. Optional test; no action required.

### INFO-5: Escape before the helper fires turns the preview into an editor (r3 INFO-10, base behaviour)
- Seen when Escape lands before the helper's timer: stamina-text openers at 0-120 ms at 1x CPU, and some throttled trials, including a bar opener at 20x.
- Focus ends in `.cm-content` and the preview stays. The modal is already closed and nothing is lost.

### INFO-6: popout windows still not probed (accepted, O8). Right-click in the form's raw box (RV, LP) opens no Obsidian DOM menu and closes nothing.

## 3. Regression probes on head (all as expected unless noted)

| Probe | Result |
|---|---|
| Close (Cancel, backdrop, Escape; RV and LP), then at once a real click on the view header | preview dismissed every time (`outside:*`, ×4 for bg / LP-cancel); plugin click listeners `{}` |
| Close, then reopen at once (Cancel / Escape) | second form opens; a raw click keeps it; Escape closes it; an outside click dismisses the preview; listeners `{document:bub 1, window:bub 1}` while open, `{}` after |
| Escape sweep, 1x CPU: form 20-329 ms, stamina-text 26-318 ms, conditions 157-338 ms, stamina 47-216 ms | modal closed and preview shown in all 15 |
| Escape sweep, 6x and 20x CPU (13 trials, 112-1526 ms) | all closed, preview shown; the modal's re-push lands at the same ms as or just after the popover's push (`680 push other` / `680 pop modal` / `680 push modal`) |
| Non-preview form (LP) | no plugin listeners added; keymap depth 1 → 2 → 1 (the modal's own push only) |
| Preview form, listeners | doc + window bubble listener added at open, both gone after close (`{}`); depth +1 after close is Obsidian's `p()` scope (preview is now "editing") |
| Child confirmation 30 ms after a bar-opened Stamina modal | child on top; the first Escape closes the child only ("No Stamina Change"); the second closes the parent; preview stays (×4) |
| Stamina-text opener + a click at 80-170 ms | everything closes (LOW-2; same on `74b138f0`) |

The RV `noprev` trial cannot find its card in the probe harness (the same harness issue r3 hit). LP covers the non-preview path, and the jest controls cover RV.

## 4. Gates

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | clean, rc 0 | `sc595-r5-gate-tsc.log` |
| lint (incl. `e2e/`) | clean, rc 0 (the old `.eslintignore` warning) | `sc595-r5-gate-lint.log` |
| jest, fresh | `Tests: 2 skipped, 7221 passed, 7223 total`; `Suites: 1 skipped, 261 passed`; rc 0 (base 7190 fresh + 31) | `sc595-r5-gate-jest.log` |
| SC-568 suites alone (`-w 2`) | 78/78 | `sc595-r5-gate-jest-sc568-alone.log` |
| lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` | **5/5 ok**, rc 0, 11:33:33-11:38:33 (about 300 s incl. build; loadavg peaked 42) | `sc595-r5-gate-lifecycle-p5.log` |
| e2e | `OBSIDIAN-E2E done: 259/265 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`, rc 0, 126 s, pointer parked | `sc595-r5-gate-e2e.log` |
| styles.css | `5e5ff4884e05…` on base `6c7216e8`, head and prev: byte-identical, so shots / freeze / parity carry | `sc595-r5-styles-sha.log` |
| rebase | range-diff 4/4 `=` (r2/r3 commits) and 4/4 `=` (r4 commits); SC-573's 7 files share none with SC-595 | `sc595-r5-range-diff.log` |

## 5. Mutants (`sc595-r5-mutants.log`; 31 SC-595 tests, control 31/31)

| Mutant | Red |
|---|---|
| M8 FreeHeal no anchor / M9 conditions panel no anchor / M10 montage no anchor | 2 / 1 / 1 |
| M11 `contains()` (HIGH-1) | 2 |
| M12 synchronous guard removal (HIGH-2) | 5 |
| M13 arm at open (LOW-5) | 2 |
| M14 no newest check / M15 no active-window check (LOW-6) | 1 / 1 |
| **M16 `[10]` only** | **0, SURVIVES** (MEDIUM-1); G-S83 ok on its bundle |
| R1 window listener in capture phase (arms before the helper) | 3 |
| R2 150 ms only (drop the 10 ms re-push) | 1 |
| R3 guard never removed | 1 |
| R4 removal by microtask | 0 in jest; **G-S83 FAIL (4 trials)** |
| R5 arm on any window click / R6 no splice / R7 no `dseOpen` check | 0 / 0 / 0 (INFO-4) |

## 6. Artifacts
- **Ledger directory** (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`):
  - `sc595-r5-rereview-report.md` (this file);
  - `sc595-r5-gate-{tsc,lint,jest,jest-sc568-alone,lifecycle-p5,e2e}.log`;
  - `sc595-r5-styles-sha.log`, `sc595-r5-range-diff.log`, `sc595-r5-mutants.log`;
  - `sc595-r5-probe-head.log`, `sc595-r5-probe-prev.log`, `sc595-r5-probe-m16-bundle.log`;
  - `sc595-r5-probe-scenario.js.txt`.
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r5-rereview-R3k7/` holds the exports, bundles, scripts and raw logs.
- **One kept lifecycle FAIL dir was mine** (the R4 bundle run), `/tmp/dse-obsidian-lifecycle-7LpyxQ`. I removed it by that literal path.

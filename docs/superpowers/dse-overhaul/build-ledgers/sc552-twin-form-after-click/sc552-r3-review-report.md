# SC-552 r3 independent review (reviewer R1, agent ad6d3563992bb99bd) — dse 0698550f..260763ab, superproject c64edebc

## Executive summary
- **Verdict: NOT LAND-READY** — one MEDIUM. Every closed pinned form whose view later unloads (its own Save redraws the block) hangs a holder Component on the plugin's ViewRegistry, and the holder is never removed. Real Obsidian: registry `_children` goes 2 -> 7 over 5 form Saves on HEAD and stays 2 on base. This breaks the owner's FOLD ruling ("no growth across opens"). The fix is about 3 lines plus a test.
- Findings: HIGH 0 · MEDIUM 1 · LOW 3 · INFO 7.
- Gates on 260763ab (all match r2b):
  - tsc and lint clean.
  - jest 6422 passed / 1 skipped / 255 of 256.
  - lifecycle 50/50 in five parts (21/16/8/4/1; 182/323/276/295/175 s).
  - e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
  - styles.css byte-identical to 0698550f (sha256 93be34af…) and no rendered-DOM code changed, so shots/freeze/parity were not re-run (r2b's numbers stand).
- Red/green:
  - G-S64 on a 0698550f bundle (main.js 2ca03084…) FAILs (a)-(i),(k),(l),(n),(o),(p),(q) and passes the controls (m),(r),(s). (j) does not exist.
  - G-S64 passes on HEAD.
  - jest on base src + HEAD tests: 29 failed and the lineMap suite fails to load. HEAD is green.
- SC-549 verdict: **FIXED**. 13/13 HEAD probes are clean: in-app and on-disk edits, upper and lower, RV/LP, c3/p3/c4, CRLF, plus LP typing. Base is wrong on 5/5 of the same cases ([7,5,6] / [5,5,6]). The edit-below control is clean on both.
- Ticket steps: 12/12 clean on HEAD (4 surfaces, two panes, 2/3/4 twins). Base is red on every control I re-ran. Residual (outside edit while the form is open): 4/4 clean on HEAD, base wrong.
- Tree: plugin and superproject `git status --short` were empty before and are empty after. The main checkout shows ` m draw-steel-elements` (Scott's vault, expected).

## Findings

### MEDIUM-1 — a closed pinned form gets a holder on the registry each time its view later unloads; the holder is never removed (unbounded growth)
- **Where:** `src/authoring/FormModal.ts:564-568` (the `owner.register` callback in `openFormEditor`) together with `FormModal.keepOpenOn` `:501-507` (only `if (this.kept) return;` guards it, and nothing checks whether the form already closed).
- **Mechanism:**
  1. The owner callback stays registered after the form closes, as it did on base.
  2. A normal Save closes the form, and only then does the Save's own write redraw the block. The same holds for Cancel followed by any redraw: an outside edit, Sync, or a twin hand-over.
  3. When the old view unloads, `keepFormOpenOn()` sees section gone + note shown + registry loaded and returns the registry. `keepOpenOn` then adds a fresh holder to the registry for a modal that is already closed.
  4. That holder is removed only when `close()` runs with `kept` set, which never happens again, or at plugin unload.
  5. Each holder keeps the closed FormModal alive, together with its `cx`, the host and the detached section DOM.
- **Measured in real Obsidian 1.15.0:**

  | Probe (5 or 4 form opens on block 0) | HEAD registry `_children` | base |
  |---|---|---|
  | `N-solo-rv-x5-save` | [2,3,4,5,6,7] | [2,2,2,2,2,2] |
  | `N-p3-rv-x5-save` | +1 per Save | flat |
  | `N-c3-lp-x5-save` | +1 per Save | flat |
  | `N-p3-rv-x4-cancelext` (Cancel + outside edit) | +1 per cycle | flat |
  | `N-solo-lp-x4-cancel` (Cancel, no redraw) | flat | not run |

  This affects every Reading-view / Live Preview block form, not only twins. Sidebar forms are not affected (they hold no pin).
- **Jest proof:** five open+Save/Cancel cycles, each followed by the owner unloading, give holder children [1,2,3,4,5], where [0,0,0,0,0] is expected.
- **Why no existing test caught it:** the existing test "a kept-open form saves strictly…" (`test/dom/authoring/formModal.test.ts`, SC-552 block) actually walks this path. Its first `save()` closes the modal, then `owner.unload()` keeps a *closed* modal, and the test's final `modal.close()` hides the leak.
- **Fix:**
  - Give FormModal a `closed` flag, set in `close()`, and make `keepOpenOn` return early when it is set. Equivalently, the owner callback can do nothing once the form has closed.
  - Add the jest case (`sc552-r3-jest-holder-leak-probe.test-snippet.ts`).
  - Add a G-S64 phase, or an assertion in (m), that `viewRegistry._children.length` is unchanged after a form open + Save.

### LOW-1 — the CHANGELOG claims more than was measured, and says something about SC-556's case
- **Where:** workspace `CHANGELOG.md:14` and `:17`.
- **Measured:** "(if its block has been deleted meanwhile, Save changes nothing …)" holds only for a form kept open by K.
  - When the form's own block is deleted and its view is NOT thrown away (Obsidian keeps the element for the remaining twin), Save writes the edit into the remaining twin: `D-p2-rv-f0-e0`, `D-p3-rv-f1-e1`, `D-c3-lp-f1-e1`.
  - Base does exactly the same, so this is pre-existing and part of SC-556's "own block changed from outside" class, but the sentence promises otherwise.
  - Likewise "the note was edited or synced" is broader than what the fix covers. Edits to OTHER blocks are covered; an edit of the form's own block is SC-556.
- **Fix:**
  - Drop the parenthesis or narrow it, e.g. "(if a form that stayed open has lost its block, Save changes nothing …)".
  - Say "another block was edited or synced".

### LOW-2 — a kept-open (K) form whose note changed by more than LINE_MAP_MAX_EDITS lines can never be saved, and its Notice is misleading
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:802` (`pinOnly` -> `'miss'`) and `src/framework/host/lineMap.ts:8` (`LINE_MAP_MAX_EDITS = 400`).
- **Measured (`R-c3-lp-f1-e0-big`):**
  - Setup: LP callouts, form open on block 1, then an outside edit that adds 300 lines above, 300 below, and changes block 0.
  - The LP widget is rebuilt and the view is released, so K keeps the form open.
  - Save then shows "the block changed on disk first" and stays open on every try. The block did not change.
  - Base: the form closes by itself and nothing is saved, so no data is at risk on either. On HEAD the user can only Cancel.
  - Reading-view plain (`R-p3-rv-f1-e0-big`) is not kept open and makes the same wrong write as base ([Twin,Twin,Edited] on both), so there is no new wrong write.
- **Fix:** rare, so acceptable. Either document it (comment and architecture) or, for a K form whose map gives up, fall back to the non-strict path only when the block body under the old fence position is unique. A one-line comment is enough for this ticket.

### LOW-3 — the jest guard of keepFormOpenOn's "section still there" precondition is vacuous
- **Where:** `test/dom/framework/reading-mode-host-pin.test.ts:258-262` never calls `shownIn([...'Note.md'])`, so `keepFormOpenOn()` returns null because the note is not shown, whatever `_renderChildGone` is.
- **Evidence:** mutant R3-M9 (drop `!this._renderChildGone`) survives jest and G-S64.
- **Reachable path:** `ViewRegistry` `release(entry, 'reused-by-twin')` (`remountReused.ts:119`) releases a view while its render child is still loaded. With M9 that case would keep a form open where HEAD (correctly) closes it, as base does.
- **Fix:** call `shownIn(['Note.md'])` in that test so it pins the precondition.

### INFO
- **INFO-1:** mutant R3-M11 (remove the Myers "deleted at this step" early return, `lineMap.ts`) survives everything. It is equivalent: later snakes all end at or before the deleted line, so the walk returns null anyway. The line is only an early exit.
- **INFO-2:** G-S64 has 18 lettered phases, (a)-(i) and (k)-(s); (j) is unused. `sc552-dse-verify-proposal.md:11` says "19 phases" (measured 38-40 s alone, not ~45). The brief's "(a)-(k)" includes the nonexistent (j). Everything else in the proposal matches my numbers: base red set, controls, five-part timings, 50/50.
- **INFO-3:** superproject c64edebc is described as "CHANGELOG wording only" (r2b report), but it also bumps the `draw-steel-elements` pointer from 711f740d to 260763ab. That is harmless; `wt-finish` would set it anyway.
- **INFO-4:** SC-556 should also name the deletion variant: the form's own block is deleted while the form is open and not kept open, and Save writes the remaining twin (base and HEAD alike, 3/3).
- **INFO-5:** K incidentally rescues SC-523's LP self-close for plain fences: a form opened while its own click is still saving stays open and saves into its block (`M-mid6-lp-f1-g150`: HEAD clean, base closes by itself). It does not rescue it for LP callouts (`M-cmid6-lp`: no pin is taken, closes on both). Worth a line on SC-523.
- **INFO-6:** in one of 15 runs of the "+ lower, then 4 quick clicks on the middle" probe on HEAD, one mouse click landing on the redraw instant produced no `click` event. The card counted every click it got (3 counted, value 8). It did not reproduce in 14 retries on HEAD or 14 on base, including 8 runs timed onto the redraw instant. It is not in the write path.
- **INFO-7:** F1 does not accumulate. Four sequential Saves on the unterminated trailing fence leave exactly one blank line before the closing fence after every Save, on both base and HEAD (`U-unt-rv-x4`). By the owner's ruling, F1 is DROPPED and nothing is filed.

## What was executed

### Gates on 260763ab (logs `sc552-r3-gate-*.log`)
- tsc: rc=0 (10 s).
- lint: rc=0 (14 s).
- jest: `Tests: 1 skipped, 6422 passed, 6423 total`; `Test Suites: 1 skipped, 255 passed, 255 of 256 total`.
- lifecycle:
  - p1 `21/21 ok` (182 s).
  - p2 `16/16 ok` (323 s).
  - p3 `8/8 ok` (276 s), including G-S64, G-S42, G-S45, G-S52.
  - p4 `4/4 ok` (295 s), including G-S61.
  - p5 G-S59 `1/1 ok` (175 s).
  - Total 50/50.
- e2e: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` (66 s).
- `origin/develop` = 0698550f (`git fetch origin`: has not moved).
- Built bundles:
  - base main.js `2ca03084…`, HEAD main.js `a6f18237…`.
  - styles.css identical: `93be34af…` on both.

### SC-472 seam
- G-S59, G-S18, G-S42 and G-S52 are green.
- Pinned form Saves with the note scrolled (tall notes, anchor paragraph on screen): anchor drift **0 px**, scrollTop unchanged at 50-2500 ms after Save, in all 10 cases:
  - RV and LP, plain and callouts.
  - The click-race pinned write.
  - K kept-open forms in RV and LP.
- `ReadingModeBlockHost` still takes `scrollPin.pin()` only when `section && changedContent`. For a K form (section null) no pin is taken, and none was needed.

### Real-Obsidian probes (sc552-r3-probes.log)

| Area | HEAD | Base |
|---|---|---|
| Ticket steps, 4 surfaces / 2 panes / c2 c3 c4 p2 p3 p4 / gaps 60-300 | 12/12 clean; hand-over proven (settled on b2/b3, or released) | 5/5 controls wrong ([Twin,Twin,Edited]; c2: form closes by itself) |
| Residual (form open, outside edit in-app / on disk, above / below) | 4/4 clean | 2/2 wrong |
| SC-549 (X in-app/disk, T typing) | 13/13 clean (incl. CRLF; typed "Z" kept 3/3) | 5/5 wrong; below-edit control clean |
| Integrity: TOP/BOTTOM kept, no cross-talk (mixed kinds), a hand edit of another block survives | all clean | not run |
| CRLF notes (plain RV, callouts LP, SC-549, residual) | 4/4 clean, 0 bare LF | — |
| K + own block deleted (`D-p2-rv-f1-e1`, `D-c2-rv-f1-p0-g150-e1`, `D-p2-lp-f1-p0-g150-e1`) | no write, Notice "…was not saved — the block changed on disk first.", form stays open, remaining twin untouched | form closed by itself |
| K + OTHER block deleted (`D-c2-rv-f1-p0-g150-e0`) | Save lands in the surviving pinned block (correct) | not run |
| Line-map cap (300+300 lines + edit) | same wrong write as base (RV); LOW-2 (LP K) | — |
| Quick clicks: 5 within 400 ms = 1 write; with + on another block = 3 writes; rounds 430 ms apart = 1 write per round | values and writes equal base | base LP callouts lost one click (+Notice) where HEAD did not |
| Registry children across N forms | MEDIUM-1 growth | flat |
| F1 accumulation | none | none |

### Lifecycle/contract
- G-S64 (l) plugin disable, (r) navigate-away and (s) pane close all pass on HEAD.
- `SidebarBlockHost` has no `pinPosition` / `keepFormOpenOn`, so its forms are unchanged. The jest case "a host with no pinPosition…" passes, and so does e2e.

### Scope
- `git diff 0698550f..260763ab --stat` touches only `FormModal.ts`, `BlockHost.ts`, `ReadingModeBlockHost.ts`, the new `lineMap.ts`, the tests, the lifecycle harness and `.repo-docs/architecture.md`.
- Nothing in `previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts` or `pipeline.ts`.
- `pinnedTarget` checks the body only at the mapped position; there is no body search.
- The only new refusal is the K-strict `'miss'`, which is the owner's ruling and reuses the existing dropped-write Notice.
- `.claude/skills/dse-verify/SKILL.md` is untouched (superproject diff 68ad810a..c64edebc: `CHANGELOG.md` and the dse pointer only).

## Mutants (mine, beyond r2's M1-M11; scratch copy of 260763ab, worktree untouched)

| Mutant | jest (4 SC-552 suites, 129 tests) | G-S64 |
|---|---|---|
| R3-M1 pendingPin not cleared after the view's write | 1 red ("the write uses the pin up…") | pass |
| R3-M2a mapLine tail +1 | 15 red | FAIL (a)-(i),(k),(n): falls back like base, no corruption |
| R3-M2b mapLine Myers +1 | 2 red (mapLine) | not run |
| R3-M2c mapLine head `<=` | 4 red (mapLine) | not run |
| R3-M3 K keeps forms with no pin | 1 red | pass |
| R3-M4 host `pinOnly` falls back | 2 red | not run |
| R3-M5 holder never removed on close | 2 red | pass |
| R3-M6 pinnedTarget body check removed | 1 red | pass |
| R3-M7 re-pin on every intent | 1 red | pass |
| R3-M8 K ignores registry `_loaded` | 1 red | not run |
| R3-M9 K even with the section still there | **0 red (survives)** -> LOW-3 | pass (survives) |
| R3-M10 unterminated body one line short | 1 red | not run |
| R3-M11 Myers delete early-return removed | 0 red; equivalent (INFO-1) | not run |
| R3-M14 K when ANY note is shown | 1 red | FAIL (r),(s) |
| R3-M15 pin accepts a non-fence line | 1 red | not run |

## Evidence (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/)
- Gates: `sc552-r3-gate-{tsc,lint,jest,lc-p1,lc-p2,lc-p3,lc-p4,lc-p5,e2e}.log`
- Red/green: `sc552-r3-lc-G-S64-base-0698550f.log`, `sc552-r3-jest-red-0698550f.log`
- MEDIUM-1: `sc552-r3-jest-holder-leak-probe.log`, `sc552-r3-jest-holder-leak-probe.test-snippet.ts`; real Obsidian: `N-*` rows of `sc552-r3-probes.log` (head-qnu / base-qnu)
- Mutants: `sc552-r3-mutants-jest.txt`, `sc552-r3-mutants.py`, `sc552-r3-lc-mutant-R3-*.log`
- Probes: `sc552-r3-probes.log`, `sc552-r3-probe-json/*.json`, `sc552-r3-probe-{scenario.mjs,fixtures.js,page.js,mkharness.py,pr.sh}`

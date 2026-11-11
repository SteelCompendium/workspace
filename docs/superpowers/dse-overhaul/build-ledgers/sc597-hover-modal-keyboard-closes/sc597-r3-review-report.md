# SC-597 r3: independent adversarial review (identity R1)

## Executive summary
- **Verdict: LAND.** The code needs no fix. Before landing, rebase onto the new `origin/develop` `79da77f8` (MEDIUM-1, mechanical). I checked that the rebase applies cleanly and that the rebased tree passes. Fold the two LOW doc fixes in at landing.
- Findings: 0 CRITICAL, 0 HIGH, 1 MEDIUM (process: `origin/develop` moved during review), 2 LOW (CHANGELOG wording, dse-verify proposal), 6 INFO.
- Gates I ran at `ca31aa14` in the worktree:
  - tsc rc 0, lint rc 0;
  - jest **7260 passed / 2 skipped / 261 of 262 suites**;
  - lifecycle part 5 **6/6** (G-S59 G-S49 G-S73 G-S77 G-S83 G-S87), 359 s;
  - e2e **`262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`**, 126 s;
  - `styles.css` `5e5ff488…`, unchanged.
- Red on base: G-S87 (committed harness) against my own `94133a5a` build (main.js `4b693f7b…`) fails all 4 trials at the 1.5 s step (`popover:false, modal:false`).
- Rebased onto `79da77f8` (scratch copy, `git apply` of `4f0c87f2..ca31aa14`):
  - tsc rc 0;
  - jest 7281 passed / 4 skipped. The 2 extra skips are `token-coverage.test.ts`'s workspace-only describe; in a worktree this would read 7283 / 2, which is SC-592's 7261 / 2 + 22;
  - e2e **`264/269 ok, 0 failed, 5 known-bug, 164/164`**;
  - the superproject CHANGELOG commit merges onto `origin/main` with no conflict.
- Mutants:
  - 11 of 11 of mine are killed in jest, including K1 and K4 per opener, K6, an O6 guard per opener, and two new ones (X1s, X2s).
  - The popover stand-in in both suites arms a literal `10`, never `HOVER_HELPER_DELAYS_MS`.
- Real Obsidian, measured: `bar.click()` / `cell.click()` makes Obsidian's click-to-edit helper arm **10 ms**. DSE's 10 ms and 150 ms re-pushes are armed after it, and the pushes land in the order popover, then DSE, in the same millisecond. Escape 116 ms after the key (before the 150 ms re-push) closes only the modal.
- Outside previews, I measured no visible change in a Live Preview callout or a Live Preview embed: cursor, selection and scroll all unchanged. Keys with real `text` type nothing into the modal, and the Space keyup activates nothing.

## 0. Setup
- Worktree `sc597-hover-modal-keyboard-closes`, dse HEAD `ca31aa14`, superproject `07b54207`. `git status --porcelain` is identical before and after (`sc597-r3-status-before.txt` / `-after.txt`; superproject ` M draw-steel-elements` is the expected unstaged pointer).
- `git fetch origin`: at the start `origin/develop` = `4f0c87f2`; on a re-fetch mid-review it is **`79da77f8`** (SC-592 landed; see MEDIUM-1).
- Scratch: `…/scratchpad/sc597-r3-R1/`: `base94133` (git archive `94133a5a`, built), `headca31` (archive `ca31aa14`, built), `rebased` (archive `origin/develop` + the SC-597 range diff), `mutF` (deferred-focus mutant). Nothing committed anywhere. Mutants in the worktree were written back from the original bytes (no `git checkout <sha>`, index untouched) and `git status --porcelain` checked empty after each.
- Kept FAIL temp dir of my red run (`/tmp/dse-obsidian-lifecycle-q5km0c`) deleted by literal path after copying the shot. Two other `/tmp/dse-obsidian-lifecycle-*` dirs are not mine and were left.

## 1. Findings

### MEDIUM-1: `origin/develop` moved to `79da77f8` during the review; the branch is based on `4f0c87f2`
- What: SC-592 (6 commits: `src/elements/initiative/model.ts`, `e2e/`, initiative tests) landed after r2's rebase. No file overlaps the SC-597 range (`StaminaBarPanel.ts`, `BoardView.ts`, the two test suites, `obsidian-lifecycle.mjs`).
- Failure scenario: `land-stack` / `wt-finish` pushes a dse branch that is not a fast-forward of `develop`. The proposal's CURRENT block then also states the wrong base and numbers: "landed on `4f0c87f2`", jest 7260, e2e 262/267. Workspace CURRENT is now SC-592's: jest 7262 / 1 with the CSS cached, e2e 264/269.
- Verified for you: the range applies cleanly onto `79da77f8`. The 5 changed files are byte-identical to the head versions after the apply. In that tree:
  - tsc rc 0 (`sc597-r3-rebased-79da77f8-tsc.log`);
  - jest `Tests: 4 skipped, 7281 passed, 7285 total` (`-jest.log`). The 2 extra skips are `test/dom/framework/token-coverage.test.ts:56`, which skips outside a workspace checkout;
  - e2e `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (`-e2e.log`).
- Superproject: `git merge-tree 178dbfda origin/main 07b54207` shows CHANGELOG "changed in both" with 0 conflict markers, so it auto-merges.
- Fix:
  - `git -C <wt>/draw-steel-elements rebase origin/develop`, which is conflict-free.
  - Re-run jest and e2e on the rebased head, or rely on the numbers above. Expected in the worktree: jest **7283 passed / 2 skipped** fresh, e2e **264/269**. Lifecycle is unaffected (SC-592 touches no lifecycle scenario's code path), but run part 5 if you want a full re-measure.
  - Rewrite the proposal's CURRENT draft on `79da77f8`, see LOW-2.

### LOW-1: CHANGELOG bullet claims a change from the held-key guard that no user can see
- Where: worktree `CHANGELOG.md:17`: "On a Montage cell, Ctrl, Cmd or Alt with Enter, and a held-down Enter, no longer open the window, as on the Stamina bar."
- Why it is wrong: a held-down Enter still opens the window, on its first `keydown` (`repeat: false`). Even on base, the repeats never reached the cell: the sheet opens synchronously inside the first keydown and takes focus. Measured: `activeElement` is `BUTTON.dse-optchip` 150 ms after the key, and the keyup goes to the chip. So the `evt.repeat` guard is defence (correct per O6) with no user-visible change, and the sentence reads as if holding Enter no longer opens the window.
- Fix: "On a Montage cell, Ctrl, Cmd or Alt with Enter no longer opens the window, as on the Stamina bar."

### LOW-2: the dse-verify proposal is slightly inaccurate and incomplete (`sc597-dse-verify-proposal.md`)
1. Edit 1, footgun (7), says the jest tests check "Escape 20 ms after the key closes only the modal". The tests assert the top scope at 20 ms (`app.keymap.top` is not the popover's), then advance 200 ms more and press Escape at about 220 ms.
   - Fix: "…the modal's scope is above the popover's 20 ms after the key, and Escape then closes only the modal".
2. Missing edit: SKILL.md:393, in the SC-584 / G-S64 "Pre-existing and out of SC-584" list, still says "SC-597 (a modal opened from a preview by keyboard alone closes by itself about 300 ms later)". It goes stale on landing.
   - Fix: "SC-597 (fixed: the keyboard opener now clicks)", or drop the item.
3. Missing edit: SKILL.md:401, the "jest." bullet of "Hover preview modals (SC-595)", lists the SC-595 openers and "32 SC-595 tests".
   - Fix: add "SC-597: 22 tests (10 `stamina-bar.test.ts`, 12 `montage.test.ts`): Enter/Space → one bubbling click to the opener, modal open synchronously, scope order at 20 ms, guards".
4. Edit 4 (CURRENT draft) must be rebuilt on `79da77f8` (MEDIUM-1):
   - "landed on `79da77f8`";
   - jest 7283 / 2 fresh;
   - e2e 264/269;
   - demote the SC-592 CURRENT block, not the SC-595 one, which is already PREVIOUS.

### INFO
- **I1: the helper's delay for an untrusted `el.click()` is 10 ms, measured; SC-595's order holds.**
  - Logged in real Obsidian (`sc597-r3-probe-head.log`, every pv trial): during the synthetic click, Obsidian's click-to-edit helper arms `setTimeout(…, 10)` from the container bubble (`app.js:241:10286`, phase 3 on the DIV). DSE then arms 10 ms and 150 ms from the window bubble (`dse:367:23584`).
  - The pushes follow in the same millisecond, `p (app.js:509:193406)` first and then DSE's `n`. The 150 ms re-push follows about 140 ms later.
  - `pv-esc40`: Escape keydown at 116 ms after the key, before the 150 ms re-push. Result: modal closed, preview shown and `is-editing`. This exercises the 10 ms ordering alone.
  - `el.click()` has `clientX/Y` 0, so the 150 ms text branch cannot match. If it ever did, SC-595 arms 150 ms after the helper's 150 ms too, so the order would hold either way.
- **I2: real keys carrying `text` (`'\r'`, `' '`) produce no keypress, input or click after the opener.**
  - The keydown's `preventDefault` suppresses the keypress. The keyup lands on the modal's focused control (`INPUT.dse-sedit__apply-input` / `BUTTON.dse-optchip`) and activates nothing.
  - The Stamina input still reads `"0"` after Space, and the note is unchanged (`current_stamina: 15`).
  - The montage sheet's pre-selected chip ("Success") is the same on base (`sc597-r3-probe-base.log`), so it is the sheet's default.
- **I3: side effects of the untrusted click outside previews (O6 / probe item 3).** All of them are what a mouse click on the same element already does:
  - **Live Preview callout** (`callout-stamina-lp.md`, cursor parked on line 11):
    - after Enter, the cursor and selection stay at 11:0, the callout widget stays drawn and one modal opens; after Escape, nothing changes.
    - Head adds `interactive-child` to the root (`pipeline.ts:221` `markInEditorWidget`, as on a mouse press). Base does not.
    - Obsidian's `Nx.onViewClick` (`app.js:525:18915`) arms a 0 ms timer with no visible effect.
  - **Live Preview host embedding the bar** (`r3-embhost.md`): `.cm-scroller` scrollTop stays 1641, the cursor stays 0:0 and one modal opens.
  - Code reading:
    - `RecoveriesStrip.ts:308`'s document click-outside now closes an open Recoveries popover when the Stamina modal is opened by keyboard.
    - Obsidian's `T3` (window capture) would hide another open, unfocused hover preview.
    - `sccLinkClickHandler.ts:51` ignores the click (no anchor).
    - The hero sheet bar (`hero/view.ts:332`) shares `makeKeyboardOperable` and is anchored, so it gets the fix by construction. It has no dedicated SC-597 test (acceptable).
    - Initiative row bars: `keyboard: false`, so they are unaffected.
- **I4: G-S87 has teeth for the bug, and only for the bug.**
  - It catches a modal or preview that closes 300-600 ms after the key: the first assertion is at 1.5 s, and it is red on base in all 4 trials.
  - It does not assert `modals === 1`, so a double open (K4) passes it. It does not catch K6 either, because Escape comes at 450 ms, past the 150 ms re-push.
  - Both are killed in jest (K4s/K4m/K6 in `sc597-r3-mutants.log`), so no change is needed.
- **I5: a dependency I suspected does not exist (probed).**
  - Obsidian's helper returns early when `activeElement` is inside the container, and on the keyboard path the bar holds focus at the key. So I suspected the fix depends on `DseModal.open()` moving focus synchronously (`managedModal.ts:180`).
  - Mutant `mutF` (that focus deferred by `setTimeout(…, 0)`): all 22 SC-597 jest tests pass, and G-S87 also passes (`sc597-r3-mutF-*.log`).
  - So no such dependency exists in practice, and this is not a finding.
- **I6: the doc comment at `managedModal.ts:209` still says "a delayed or keyboard open" arms at once.** It is still true of the `else` branch generically, but neither DSE keyboard opener takes that branch any more. Optional wording only. `managedModal.ts` is unchanged by design (O5).

## 2. Probe checklist (the brief's §2)
1. Correctness of (a), both openers:
   - one modal per key: jest, and `modals: 1` in every real trial;
   - synchronous open: jest K5 (r2), and the real log shows `modal+` inside the key's dispatch;
   - the click bubbles to the `.hover-popover` container: the real helper timer is armed on the container;
   - no source-editor switch: `editing` true, no editor, focus on the modal control;
   - SC-498 outside previews intact: one modal; Live Preview cursor, selection and scroll unchanged; jest SC-498 green;
   - Escape: I1.
2. O6 guards on the cell:
   - Ctrl/Meta/Alt+Enter, repeat, `defaultPrevented` and child target are each pinned in jest; my G5m, G1m and G2s are killed;
   - the only change a user can notice outside previews is that Ctrl/Cmd/Alt+Enter no longer opens the sheet (O6 ruling). The repeat and child guards have no visible effect (LOW-1).
3. `el.click()` side effects: I2 and I3. Double activation: no keypress after a prevented keydown, and the Space keyup on the newly focused chip or input produces no click (measured).
4. Tests are not vacuous:
   - K1s, K1m, K4s, K4m, K6, G5m, G1m, G2s and P1m are all killed;
   - new: X1s (dispatchEvent + click) is killed, and so is X2s (the click on the card root);
   - the stand-in uses a literal `10` (`stamina-bar.test.ts` / `montage.test.ts` SC-597 suites, `setTimeout(() => …pushScope(popoverScope), 10)`);
   - G-S87 is red on base and green on the head (part 5).
5. No SC-595 regression: G-S83 is ok in part 5, and the SC-595 jest suites are green inside the full jest run.
6. Gates: see the summary. All match the brief's expected numbers. Part 5 took 359 s against the ~345 s expected, at loadavg 7-11.
7. Docs: LOW-1, LOW-2.

Follow-ups: none new.

## 3. Evidence (all in this directory)
- Gates at `ca31aa14`:
  - `sc597-r3-gate-tsc.log`, `sc597-r3-gate-lint.log`, `sc597-r3-gate-jest.log`;
  - `sc597-r3-gate-lifecycle-part5.log`, `sc597-r3-gate-e2e.log`, `sc597-r3-gate-styles-sha.log`.
- Red on base: `sc597-r3-red-on-base-G-S87.log`, `sc597-r3-red-on-base-G-S87-FAIL.png`.
- Mutants: `sc597-r3-mutants.log`, `sc597-r3-mutate.py.txt`, `sc597-r3-mutF-deferred-focus.diff.txt`, `sc597-r3-mutF-jest.log`, `sc597-r3-mutF-G-S87.log`.
- Real-Obsidian probes:
  - summaries: `sc597-r3-probe-head.log`, `sc597-r3-probe-base.log`;
  - raw logs: `sc597-r3-probe-head-raw.log`, `sc597-r3-probe-base-raw.log`;
  - harness: `sc597-r3-probe-scenario.js.txt`, `sc597-r3-make-probe.py.txt`.
- Rebased onto `79da77f8`: `sc597-r3-rebased-79da77f8-tsc.log`, `sc597-r3-rebased-79da77f8-jest.log`, `sc597-r3-rebased-79da77f8-e2e.log`.
- Tree state: `sc597-r3-status-before.txt`, `sc597-r3-status-after.txt`.

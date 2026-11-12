# SC-602 r3: independent adversarial review (reviewer R2)

**Executive summary**
- **Verdict: LAND-READY**, once the owner's already-ruled CHANGELOG fold is done. Findings: 0 HIGH, 0 MEDIUM, 3 LOW, 6 INFO.
- Reviewed: dse `2848e7eb` on `93e8e48c` (= origin/develop, fetched). Superproject `6b0f9a7e` on workspace origin/main `eccfe90e` (fetched; merge-base = origin/main).
- Gates, all re-run by me: tsc (incl. e2e) rc 0 · lint rc 0 · jest **10771 passed / 2 skipped** (267 + 1 skipped suites, fresh, one run, no timeouts) · lifecycle **60/60**: 21/21 186 s, 16/16 325 s, 9/9 403 s, 4/4 298 s, 7/7 394 s, 3/3 230 s · e2e **`299/302 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (141 s; known bugs SC-257, SC-384, SC-355).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, byte-identical to a clean `93e8e48c` build I made, so shots, freeze and parity carry (skipped).
- e2e vacuity (5 product files at base): **10 red / 4 green**. Red: INIT-L01..L05, L07, CTR-L01/L03/L05, CALL-L04. Green guards: INIT-L06, L08, CTR-L02, L04.
- jest vacuity: a full revert gives 5 red, plus 2 suites that cannot load. Unregistering the extension gives 1 red. 8 new mutations of my own: 7 red, 1 an equivalent mutant (Mh). Restored, `cmp` OK, `git diff` clean.
- Real-Obsidian probes (25 cases, branch and base): every case the brief listed behaves correctly on the branch. Results: no cross-talk, no steal-back, no claim after an outside edit, no request left armed, no stray focus after a note switch or a leaf close. Popout windows work (base drops focus to body).
- Untouched: no SC-607 file (`ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `obsidian-lifecycle.mjs`) and no SC-580 file (`ConditionsModal.ts`). No AI attribution in any commit.
- Tree as found: dse porcelain empty, HEAD `2848e7eb`. Superproject shows only ` M draw-steel-elements`. Ignored `main.js` is back to the HEAD build (`df2d53e9…`).

## 1. Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r3-reviewer/`)

| Gate | Result | Log |
|---|---|---|
| tsc (`tsc --noEmit && tsc --noEmit -p e2e`) | rc 0, 12 s | `tsc.log` |
| lint (`eslint src main.ts e2e`) | rc 0, 15 s (only the known `.eslintignore` warning) | `lint.log` |
| jest | Tests 10771 passed, 2 skipped; Suites 267 passed, 1 skipped; 69.4 s | `jest.log` |
| lifecycle part 1 (21) | 21/21, 186 s | `life1.log` |
| lifecycle part 2 (16) | 16/16, 325 s | `life2.log` |
| lifecycle part 3 (9) | 9/9, 403 s (G-S50 "LP stamina bar by keyboard -> Edit pencil +ring" holds) | `life3.log` |
| lifecycle part 4 (4) | 4/4, 298 s | `life4.log` |
| lifecycle part 5 (7) | 7/7, 394 s | `life5.log` |
| lifecycle part 6 (3) | 3/3, 230 s | `life6.log` |
| e2e full | `299/302 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, rc 0, 141 s. INIT-F01..F14, CTR-F01/F02, INIT-L01..L08, CTR-L01..L05 and CALL-L04 all pass | `e2e.log` |
| styles.css | branch = clean base build (`5e5ff488…2b27`) | `basebuild.log` |

The part lists match the dse-verify CURRENT block at `93e8e48c` (21 + 16 + 9 + 4 + 7 + 3). There is no G-S104.

## 2. Vacuity

**e2e** (`e2e-vac.sh`, log `e2e-vac-base-2412123.log`). The four modified product files were checked out at `93e8e48c` and `livePreviewFocusCarry.ts` was removed. Then `--only` ran the 14 new ids plus the probes:
- **Red (10):** INIT-L01, L02, L03, L04, L05, L07, CTR-L01, L03, L05, CALL-L04. Each one fails on the focus `toEqual`.
- **Green (4):** INIT-L06, INIT-L08, CTR-L02, CTR-L04.
- **Restore:** `git checkout HEAD --` plus a copy-back, `cmp` OK on all 5 files, `git diff --quiet HEAD -- src`. The run's other 6 failures are my probes' post-test note invariants (see §3).

**jest** (`jest-vac.sh`, summary `jest-vac-summary.txt`). Each run covers the 5 touched test files, 85 tests on the branch.

| Mutation | Red | Which test |
|---|---|---|
| V1: full revert of the 5 product files | 5 failed; 54 passed; all 5 suites fail (2 cannot load) | controlSuccessor ×2, beforeRelease, armSuccessorFocus ×2 |
| V2: the two registration lines removed | 1 | "Live Preview focus carry is wired" |
| Mc: successor request scope = null | 1 | scope: another pane does not claim |
| Md: no `guardFocus` in `armSuccessorFocus` | 1 | focusin elsewhere cancels |
| Me: `onEditorUpdate` ignores `released` | 1 | editor update guards |
| Mf: detached-root fallback dropped (`btn = found`) | 1 | detached root claims nothing yet |
| Mg: `beforeRelease` called after `released = true` | 2 | view-registry + hook-point test |
| Mh: `active === body \|\| !root.contains(active)` dropped | 0 | **equivalent:** `captureControlFocus` returns null in the same cases, so the line is redundant but harmless |
| Mi: tickets never marked used | 1 | one write arms once |
| Mj: ring forced true | 1 | no-ring press restored without a ring |

These complement I1's M1..M10. Every non-equivalent mutation is caught.

## 3. Real-Obsidian probes (scratch specs, removed afterwards; Obsidian 1.14.4)

**How the probes ran.**
- Spec files: `probe.e2e.ts`, `probe2.e2e.ts`, `probe3.e2e.ts`, copied into `e2e/specs/zzr3/` for the runs, then deleted. Ids are `ZZR3-*`, with no ticket id in any title.
- The end state is read at settle + 1 s. A sampler records every focus change every 2-5 ms, plus every vault `modify`.
- Some probes fail the driver's "fence changed but not declared" invariant after the test. That is because they write through raw keys and `vault.process`. The data was already recorded by then.

**Result files.**
- Branch: `probe-branch-summary.txt`, `probe-branch2-summary.txt`, `probe-branch3-summary.txt`.
- Base (product reverted): `probe-base-summary.txt`.
- The raw `.jsonl` and logs sit next to them.

| Probe | Base (end state) | Branch (end state) | Verdict |
|---|---|---|---|
| P01 counter + by Enter; then focus to body + outside edit (linger check) | body; linger body | `counter.inc` +ring in the new root (write 456 ms); linger **body** | carry OK, nothing left armed |
| P02 Advance round by Enter | body | `init.round.advance` +ring | OK |
| P03 / P03b twin stamina bars in ONE callout (SC-537 shape), Enter on Catch Breath of the 1st / 2nd | body / body | 1st / 2nd bar's `recov.catch-breath` +ring; the other twin's note values untouched (12 / 3) | one more element, twin-callout path, no cross-talk |
| P04 three counters, Beta + to max (successor disabled) | body | the stepper's own hand-off puts focus on `counter.input` at 45 ms, before the write; carried to `counter.input` +ring; no root `tabindex`; linger **body** | no lingering request (the `:disabled` -> root branch is not reached in real Obsidian; INFO-1) |
| G01 mouse click on + with focus in the editor | `cm-content` | `cm-content` | not pulled in |
| G01b + holds keyboard focus, then a real MOUSE click on it | body | `counter.inc` +ring | behaviour change, within the ruling (INFO-2) |
| G02 Enter on +, then a real Tab inside the debounce (lands on `chrome.collapse`, same root) | body | `chrome.collapse` +ring | follows where focus WAS at save time |
| G02b Enter on +, then Shift+Tab (to `counter.input`) | body | `counter.input` +ring | OK |
| G03 Enter on +, then a real click into the note text + typing `zzz`, later `q` | `cm-content`, text typed | `cm-content`, note `BELOW\nzzzq`, value 2 | not stolen back |
| G03b Enter on +, then Escape (focus goes to `cm-content`), ArrowDown, typing `yy` | `cm-content` | `cm-content`, `yy` typed into the note, value 2 | keyboard into CM: not stolen back |
| G04 rapid Enter (max 99): 3 at 100 ms (inside the debounce), then 3 at 500 ms (across it) | value **4**, body (later presses lost) | value **7**, 4 writes, focus `counter.inc` +ring throughout | every press lands |
| G04b the same on the 1st identical twin | value 4 / 1, body | **7 / 1**, focus twin #0 | no wrong-block claim |
| G04c 3 × 500 ms on the 2nd twin | 1 / 2, body | **1 / 4**, focus twin #1 | no wrong-block claim |
| G05 same note: LP pane + Reading-view pane; Enter in LP, then Enter in RV | LP: body; RV: `counter.input` (RV) | LP: `counter.inc` +ring in the LP pane; RV: `counter.input` +ring in the RV pane (at max the stepper hands to input before the write); the LP pane takes nothing | no cross-pane claim; Reading view unchanged |
| H01 + Ka/Kb/Kc two LP panes: keyboard save in pane B, then 300 ms later an edit typed into pane A inside the counter (identity-sampled) | body before the edit | carry to a new node (node1 -> node2, no body gap), then the other pane's edit redraws pane B and focus is **body** 4/4 (771-805 ms) | another pane typing never claims |
| Ma/Mb/Mc + G09: outside `vault.process` 300 ms after an own keyboard save | body | **body** 4/4 | outside edit never claims |
| G07 Enter on +, then the leaf opens another note with counters before the write; then back | `cm-content` | `cm-content` (flush write at 76 ms); back: `cm-content` | no stray focus |
| G08 Enter on +, then the leaf is closed before the write; another LP tab with counters takes over | `cm-content` | `cm-content` | no stray focus |
| H02 popout window, LP, keyboard-style press (focus + `click()`, detail 0) | `body(new)` at 468 ms | `counter.inc(new)` +ring at 433 ms, new root | popout works (document-relative) |
| G10b the same synthetic press in the main window | body | `counter.inc` +ring | control |
| C01 SC-609 flow in LP: focus on detail Stamina, mouse press on roster cell 0-3 | body (697 ms) | `init.cell.stamina` +ring | the SC-609 CHANGELOG sentence is now stale (LOW-1) |
| C02 SC-603 flow in LP: pool modal by keyboard, Apply with Enter | body (584 ms) | `init.detail.stamina` +ring | the SC-603 CHANGELOG sentence is now stale (LOW-1) |
| Reading view (INIT-F01..F14, CTR-F01/F02) | — | all pass in the full e2e | unchanged |

**One inconclusive sample:** the first G06 run (an edit in the other pane, end state only, no node identity) ended on `counter.inc`. Five identity-sampled reruns (G06 rerun, H01, Ka, Kb, Kc) all show the other pane's edit redraws pane B and focus goes to body. A claim there is also impossible by construction: the carried view is new and holds no ticket. The first run most likely picked a leftover reading leaf whose edit only reached disk after the 1 s window.

## 4. Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**LOW-1: stale "In Live Preview focus is still lost … (SC-602)" sentences.** The owner already ruled this a FOLD; this finding adds the measurements.
- Where:
  - dse `CHANGELOG.md:37-38` (SC-609), `:46-47` (SC-603), `:77` (SC-588)
  - workspace `CHANGELOG.md:28` (SC-609), `:63` (SC-603), `:101-102` (SC-588)
- Failure: once SC-602 lands, these sentences are false for the measured flows. C01 (the SC-609 cell press) and C02 (the SC-603 pool Apply) keep focus in LP on the branch and drop it to body on base. INIT-L01..L05 cover SC-588.
- Fix: in the fix round, replace each sentence with "Since SC-602 this holds in Live Preview too." Keep the SC-605 / SC-589 draft-loss sentences (dse `:53`, workspace `:94`): they are still true.
- Caveat: SC-603's Conditions-window route in LP is a different case. The window closes on the write (SC-384) and was not measured here. So for SC-603, either claim only the pool Apply route, or drop the LP sentence rather than assert coverage.

**LOW-2: SC-602 CHANGELOG wording slightly overclaims where focus lands.**
- Where:
  - dse `CHANGELOG.md:28` ("Focus now stays on the pressed button, or on the control that replaced it, with the keyboard ring. This holds for every element that saves.")
  - workspace `CHANGELOG.md:13`
- Failure: when no control with the same id exists after the redraw, focus lands on the element itself (root, `tabindex=-1`; jsdom J11). That is not "the control that replaced it". Example: a control that gets a new id only on the redraw, with no in-place hand-off.
- Also: "every element that saves" was measured for counter, initiative and stamina-bar (plain, callout, twin callout, popout). The mechanism is framework-wide, but elements are not.
- Fix: "…or on the control that replaced it (else on the element itself), with the keyboard ring when you were using the keyboard." Change "This holds for every element that saves" to "This is done once for every element, not per element." The SC-605 / SC-384 not-covered clause is accurate and should stay.

**LOW-3: e2e focus assertions are taken at write-idle (`dse.settle()`, about 60 ms of quiet), not at settle + 1 s.**
- Where (the `dse.settle()` lines): `e2e/specs/initiative/focus-live-preview.e2e.ts:39,49,59,69,73,88,108`, `e2e/specs/counter/counter-focus-live-preview.e2e.ts:34,55,77`, `e2e/specs/callout/callout-writes.e2e.ts:105`.
- Failure: the carry is one-shot by design. A second redraw of the same block landing more than about 60 ms after write-idle would throw focus away again and these tests would still pass. Examples: an Obsidian metadata re-render, or a future SC-481-style reconcile.
- Today the probes show the state holds at settle + 1 s (P01..P03, G04 over 2.1 s), so nothing fails now. The design's own probes used `browser.pause(1000)` after settle.
- Fix: before each focus `expect`, add `await browser.pause(1000)` (or a `browser.waitUntil` that the focus state is unchanged for 1 s). Cost: about 13 s of e2e wall time.

### INFO

- **INFO-1:** the `:disabled` successor -> root branch (`focusHandoff.ts:265`) is only exercised in jsdom. In real Obsidian, the counter's stepper hands focus to `counter.input` before the write when + reaches max (P04: input at 45 ms, write at 450 ms), so the carry captures the input. The guard is correct and cheap. No action.
- **INFO-2:** a behaviour change, within the owner ruling (focus was inside the block at save time).
  - What: a real mouse click on a control that already held keyboard focus now keeps focus, with its ring, through the LP save (G01b). Base drops it to body.
  - Why the ring: the click shield keeps the earlier keyboard focus and its `:focus-visible` (SC-495 note in `focusHandoff.ts:9-12`).
  - Status: "A mouse click still never pulls focus into an element" stays true. Worth knowing if SC-458 revisits mouse rules.
- **INFO-3:** `carryOwnSaveFocus` calls `captureControlFocus(root)` without the element's `families` map (`livePreviewFocusCarry.ts:62`). A control whose id changes on the save's redraw falls back to the family's last control, else the root.
  - Today nothing fails: the only family case (captain make/relieve) is handed off in place by SC-588 before the write (INIT-L04 passes).
  - Fix only if a future element changes ids on redraw with no in-place hand-off: an optional per-view `controlFamilies` the carry reads from `entry.view`.
- **INFO-4:** `claimChromeFocus` still runs the `[data-dse-chrome-item=""]` query for a `find` request and then discards the result (`focusHandoff.ts:258-266`). It is a micro-cost on each mount while a request is live. Optional: skip the query when `req.find` is set.
- **INFO-5:** plugin disable with a request still live. The old bundle's request and its capture `focusin` listener stay until the next focusin, which prunes them (`onFocusIn` -> `unguardFocus`). `ViewRegistry.onunload` marks entries released without calling `release()`, so `beforeRelease` does not fire on unload. G-S6e and the other lifecycle scenarios pass. No action.
- **INFO-6:** not measured.
  - Canvas: the same note shown twice in one canvas leaf. The scope is the leaf (or `.markdown-embed`), so the claim could go to another card of the same note. The same scope rule already applies to SC-505 and SC-518.
  - SC-603's Conditions-window route in LP.
  - Hover popovers are excluded by scope (`.markdown-embed` is not the pane).

### Code review notes (no finding)
- **One-shot:** `disarmChromeFocus(key)` runs only after a successful `focusControl`. An unclaimed request lapses at `REQUEST_TTL_MS` (5 s), and any focusin elsewhere cancels it. The P01 and P04 linger checks show nothing left armed.
- **TTL and leaks:** `used` is a `WeakSet<ClaimTicket>`. `ours` is a WeakSet. The `find` closure holds only the `ControlFocus` token, never the old root. An expired request is dropped lazily on the next `liveRequest` or `anyLive` call.
- **Error paths:** `release()` wraps the hook in try/catch and still releases. A throw after the tickets are marked used arms nothing, which is safe. `onEditorUpdate` wraps its loop.
- **Popout:** the guard uses `focused.ownerDocument`, and the claim uses `root.ownerDocument` and its MutationObserver. Measured working (H02).
- **Footprint:** no SC-607 or SC-580 file in the diff. No lifecycle scenario was added. No CSS change.
- **Docs:** the `architecture.md` host-table row and the paragraph match the code. The top-of-file funky-logic comment is present. The e2e README has the `Counter/twins.md` row. The missing `Counter/counter.md` row is already a FOLD.

## 5. State at the end
- dse `git status --porcelain`: empty. HEAD `2848e7eb`, branch `sc602-live-preview-focus-on-save`.
- Superproject: ` M draw-steel-elements` only, at HEAD `6b0f9a7e`.
- Scratch spec dir `e2e/specs/zzr3/` was removed (literal paths). `e2e/.out/` is gitignored.
- `main.js` sha `df2d53e9…` is the HEAD build, the same as after the full e2e. `styles.css` sha `5e5ff488…`.
- No process left running in the worktree.

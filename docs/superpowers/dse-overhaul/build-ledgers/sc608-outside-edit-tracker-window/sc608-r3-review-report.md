# SC-608 r3 independent review (reviewer R3)

**Executive summary**
- **Verdict: LAND.** 0 HIGH, 0 MEDIUM, 5 LOW, 8 INFO. Scott's Option 1 and the owner rulings hold on every surface probed in real Obsidian. Every window closes on an in-block outside edit with exactly one Notice. Focus goes to the right control, with the ring, in the right copy. Nothing staged is written, and no outside change is overwritten anywhere.
- Gates re-run at dse `9761eceb` (superproject `21aa20e4`, worktree clean before and after): jest **11642 passed / 1 skipped** (warm, rc 0) · e2e **`314/317 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (rc 0) · lifecycle part 1 (`G-S7a … G-S9a`, the initiative-heavy part) **21/21 ok** (rc 0).
- Red on base: 18 of the 24 new jest tests fail on `d984b115` source (O01-08, O11-13, O15, O16, S01-05). The 6 that pass on base (O09, O10, O14, O17, S06, S07) are guards for behaviour that should not change.
- Design call (`windowHandoff.ts` instead of SC-602's `armSuccessorFocus`): **justified.** A mutant that uses `armSuccessorFocus` misses in Reading view (focus on BODY) and works only in Live Preview. That is exactly the miss the implementer claimed.
- Follow-up 2 ("the flush on unload writes the old model") is **refuted**. SC-343's stale-body guard refuses that write with "…was not saved — the block changed on disk first", and the outside edit survives on both base and HEAD. SC-608 does not change how likely it is. It only adds its own Notice next to that one.
- M11 and M13 are confirmed equivalent in real Obsidian. The unload-path version of M13 (M13U) is killed by INIT-W01.
- The LOW findings, worth fixing in this round or filing: L1, a 400 ms race in the sidebar loses a condition already added in the Conditions window, which goes against the "block unchanged → stays open and writes" ruling. L5, a test gap (the focus-is-free check is not covered by any test).

## 1. Context and method

- Verified before starting: dse `9761eceb` on branch `sc608-outside-edit-tracker-window` (range `d984b115..9761eceb`), superproject `21aa20e4`, both `git status --porcelain` empty. Both are still clean at the end.
- Probes run as uncommitted e2e specs, copied into `e2e/specs/zz-sc608r3/` for each run and removed afterwards: `zr-probe608` (ZR-01..29), `zr-dbg608` (ZD-01..09, with a temporary debug log added to `windowHandoff.ts`), `zr-extra608` (ZX-01..04). Base runs used `d984b115`'s `view.ts` with `windowHandoff.ts` held out, then restored with `git checkout HEAD`. Mutants were applied with a script and restored the same way.

## 2. The matrix (HEAD; base in brackets where it matters)

| Probe | Surface / window / edit | Window | Notices from SC-608 | Focus after | Note after |
|---|---|---|---|---|---|
| INIT-W01 / ZR-01 | Reading, pool / creature Stamina, in-block | closed | 1 | `init.detail.stamina` +ring [base: BODY, no Notice] | Malice 9, nothing staged written |
| INIT-W02 / W03 | Reading, Conditions / hero | closed | 1 | `init.cond.add` / `init.hero.stamina` +ring | outside edit kept |
| ZR-02 | Reading, Reset encounter confirm | closed | 1 | `init.reset-encounter` +ring | round still 2 (no reset), Malice 9 |
| INIT-W06, ZR-03/04/05 | LP, pool / Conditions / hero / Reset | closed | 1 | the same control in the source view +ring, still held after 2 s | outside edit kept |
| INIT-W07, ZR-06 | Sidebar, pool / Conditions, in-block | closed | 1 | the sidebar's same control +ring [base: window stays open, its writes are lost] | outside edit kept |
| ZR-07 | Sidebar, hero, outside edit to the SAME field (`current_stamina: 20`) | closed | 1 | `init.hero.stamina` +ring | 20 kept, the staged 5 dropped |
| INIT-W04, ZR-10 | Reading / LP, edit ABOVE the block | stays open | 0 | — | Apply writes `minion_stamina_pool: 17`, paragraph kept |
| INIT-W08, ZR-08, ZR-09 | Sidebar, edit elsewhere in the note | stays open | 0 | — | Apply / Add writes pool 17 / Dazed / hero 25 [base: lost] |
| ZR-11, ZR-13, ZR-14 | Own saves: Conditions add (Reading), LP pool Apply, Escape (pool, hero), Reset Yes, captain to 0 (Reading and LP) | — | 0 | the opener, or its rebuilt successor, +ring | — |
| ZR-15 / ZR-16 | Same note in Reading view AND pinned; window opened from the sidebar copy / the Reading copy | closed | 1 | sidebar copy / Reading copy, matching the opener | — |
| ZR-17 | two-trackers, window on the 2nd: (a) edit 2nd block; (b) edit only the 1st block | (a) closed; (b) stays | (a) 1; (b) 0 | (a) 2nd tracker's `init.hero.stamina` | (b) Apply writes Bob 20, the 1st block's edit is kept |
| ZR-19 | Reading, pool opened with the mouse | closed | 1 | stays on `.markdown-preview-view` (not pulled in) | — |
| ZR-20 | window already closed by Escape, focus moved to an editor in another pane, then in-block edit | — | 0 | editor keeps focus | — |
| ZX-04 / ZR-21 | popout: window in main, focus in a popout editor | closed | 1, shown in the **popout** | popout keeps its focus; main document's activeElement becomes the tracker control | — |
| ZR-29 | plugin off/on with a window open | closed | 0 | BODY (untouched) | no console errors |

## 3. Findings

### LOW

**L1 — Sidebar: a condition added in the Conditions window within 400 ms of an outside edit to another part of the note is lost (the window closes).**
`src/elements/initiative/view.ts:223` compares the incoming model with `serializeModel(this.model)`, the **in-memory** model. That model already contains the Conditions window's live add, which is still waiting out the 400 ms persist debounce. So a block that did not change on disk counts as "changed". The window closes with the Notice, and `super.update(model)` replaces the model. The pending flush then writes the reloaded model, and the condition is gone.
- Reproduced in ZR-28 "out": add Dazed, then 53 ms later an edit to the heading. HEAD: window closed, 1 Notice, no Dazed in the note. Base: the window stayed open and Dazed was lost silently. So this is better than base, but it goes against the owner ruling "sidebar closes only when the block content changed, otherwise stays open and Apply WRITES".
- **Fix:** compare against what the view last loaded from or wrote to disk, not against the live model. Keep a `diskContent` string, set it in `update()` / `onMount` and after each successful persist, and test `serializeModel(model) === this.diskContent`. The pending write then lands on its own timer. Add jest S08: add a condition, then an out-of-block outside edit before the debounce fires → the window stays open, the note has the condition, no Notice.

**L2 — The slot is found by position alone, so focus can go to the wrong tracker.**
`src/framework/chrome/windowHandoff.ts:110` picks the root at `[o.slot.index]`. An outside edit that inserts a tracker above the open one AND changes the open one hands focus to the NEW tracker. ZX-01: two-trackers.md, window open on Bob; the edit inserts "Newt" between the two blocks and changes Bob's block. The Notice was correct, but focus went to "Edit Stamina: Newt Inserted". The same case with an invalid inserted block (ZD-05) stalled on the unpublished error card for the whole 3 s TTL, and nothing was focused.
- **Fix (safe fallback):** if the scope's tracker count differs from the count at open time (or more than one new root appeared), show the Notice and skip the focus part. Optionally also check the hero and group names before focusing. Add a jest case.

**L3 — A burst of outside edits (Sync) ends with focus on BODY in Reading view and Live Preview.**
`windowHandoff.ts:121`: the hand-off is one-shot (`finish()` on the first success). Five edits 30 ms apart (ZR-22 Reading, ZD-07 LP): the Notice shows once (correct) and focus lands on the first successor. The next redraws then throw that successor away, and focus falls to BODY. The sidebar keeps focus (ZD-08, through SC-589).
- The later losses are the general, pre-existing "outside redraw with focus in the tracker" gap, not a window case. **Fix or accept:** keep the claim alive for a short settle period after the first success, the way SC-505 uses `SETTLE_MS`, re-claiming while focus is on BODY or the dead root. Otherwise record it as accepted.

**L4 — An outside edit that changes only bytes the model does not keep (a YAML comment, quoting, whitespace) closes the window with no Notice and focus on BODY.**
`windowHandoff.ts:122` treats "same serialization" as "not an outside edit" and returns before the focus part. ZR-26: a `# synced from phone` comment inside the block closes the hero window, with no Notice and focus on BODY (same as base). Staged input is lost without a word.
- **Fix:** decouple the two parts. Hand focus whenever a successor appears at the slot and there is a token (correct in both cases). Gate only the Notice on the content check, or compare the raw block text instead of the serialized model. This would also restore focus in the pre-existing LP own-save case (I4).

**L5 — Test gap: the "focus is free in the root's own document" check is not killed by any test.**
`windowHandoff.ts:125`. Reviewer mutant R3 (the check replaced by `void 0`) passed all 44 SC-608 tests. The focusin guard is installed only after the window has closed (`view.ts:183` closes, then `:186` arms the hand-off). So when the close itself (Obsidian's focus return, or another component) puts focus somewhere outside the tracker, this check is the only protection.
- **Fix:** add jest O18. Make the `Modal.close` mock focus an input outside the tracker instead of the opener, then assert that the input keeps focus and the Notice still shows. Mutants R1 (content check removed → O09 red) and R2 (focusin guard removed → O11 red) were killed.

### INFO

- **I1 — Design call: justified.** ARM mutant (`armSuccessorFocus(host.blockKey(), controlSuccessor…)` at unload in place of `handOffAfterOutsideClose`): Reading view ZR-02 → focus on BODY (a miss: Reading view's new section is mounted, and its chrome claim made, before the old view unloads). LP ZR-05 → OK. The block key also moves with an edit above the block. The new module duplicates focusHandoff's request pattern (observer, TTL, focusin guard), about 150 lines, but it reuses the token primitives (`controlSuccessor`, `focusControl`, `focusIsFree`). It is fine to land. A later fold would give `focusHandoff` a "scan existing roots at arm time" mode and a slot key.
- **I2 — Follow-up 2 refuted.** ZR-27, Reading view: add Dazed, then an in-block edit 54 ms later. On both base and HEAD the flushed write is refused ("a change to a block in tracker was not saved — the block changed on disk first"), Malice 9 is kept and Dazed is dropped. HEAD shows that Notice plus the SC-608 Notice. Both are true; the pair is a little redundant. ZR-28 "in", sidebar: no flush overwrite either. Dazed is dropped with the SC-608 Notice (base: silently, and the window stayed open). SC-608 makes this neither more nor less likely.
- **I3 — M11 and M13 confirmed equivalent in real Obsidian.** Each mutant run on INIT-W07, ZR-06, ZR-07 and ZR-15 gave the same result as HEAD (4/4 ok, same focus and Notice). The unload-path counterpart M13U (the open-time token replaced by a capture at unload) is killed by INIT-W01 (focus on BODY). The open-time token is load-bearing on that path and it is tested.
- **I4 — Pre-existing, not SC-608.** In Live Preview, adding a condition in the Conditions window (an own save) redraws the widget and **closes the window**, with focus on BODY and no Notice (ZR-12, identical on base). Suggest a follow-up ticket (a sibling of SC-602 / SC-608). L4's decoupling would at least hand focus back.
- **I5 — Popout.** The Notice shows in the popout, which is the active window. The popout keeps its editor focus. The main document's remembered focus becomes the tracker control (base: BODY). No theft was observed. Caveat: under Xvfb with no window manager both documents report `hasFocus()` true, so OS-level window activation is not proven. Chromium's `element.focus()` does not activate a window.
- **I6 — Deleted block, or a block made invalid (error card): the window closes silently and focus goes to BODY** (ZR-24, ZR-25; this is the declared follow-up 1). The watch runs out at 3 s and cleans up after itself.
- **I7 — No leaks.** Leak counters on `MutationObserver` and on `focusin` listeners on `document`: ZR-22, 24 and 25 each created 1 observer; 0 were still live afterwards, and the focusin listener count went back to its starting value (net 0). During the TTL (ZR-24) there was 1 observer and 1 listener. Plugin off/on with a window open (ZR-29): no errors, no Notice. The cancel function `handOffAfterOutsideClose` returns is discarded (`view.ts:186`), so a hand-off is not cancelled on plugin unload. The 3 s TTL bounds it.
- **I8 — ZR-19 timing artefact.** ZR-19 showed a second Notice ("…not saved…"). It comes from the cell-selection persist hitting the SC-343 guard, and it did not reproduce in ZX-02 or ZX-03 on HEAD or on base. It is not caused by SC-608.

## 4. Tests

- The new jest tests assert real behaviour: Notice count, `document.activeElement` control id and ring, the modal gone or open, and the note text in S02/S04. They are not vacuous. Red on base: see the summary. The e2e INIT-W01..W08 assertions match what my probes measured independently.
- Gaps: L5 (no test with focus already elsewhere at arm time); L1 (no sidebar test of a pending write racing an outside edit); L2 (no test of an inserted tracker). There is no e2e for creature Stamina or Reset confirm across an outside edit (jest O05 and O06 cover them; I probed them in ZR-01, 02, 05).

## 5. Evidence

All files are under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r3-review/`:

| What | Files |
|---|---|
| Gates | `r3-jest.log/.rc`, `r3-e2e.log/.rc`, `r3-lc1.log/.rc`, wrapper `r3gate.sh` |
| New jest suites run on base source | `r3-jest-redbase.log/.rc`, `r3-redbase.sh` |
| Jest mutants R1-R3 | `r3-jestmut.sh`, `r3-jestmut.rc`, `r3-jestmut-*.log` |
| Probe specs (never committed) | `zr-probe608.e2e.ts.txt`, `zr-dbg608.e2e.ts.txt`, `zr-extra608.e2e.ts.txt`; runners `zr-run.sh`, `zr-mut.sh`, `zr-mutate.py`, `zr-instrument.py` |
| Probe data (JSONL) | `zr-head1.jsonl` (HEAD), `zr-base1.jsonl` (base), `zr-dbg1.jsonl` (debug), `zr-extra1.jsonl` / `zr-extrabase1.jsonl`, `zr-armA.jsonl` (ARM mutant), `zr-mutM11.jsonl`, `zr-mutM13.jsonl`, `zr-mutM13U.jsonl`; logs `zr-e2e-*.log/.rc` |

The FAILs in the probe logs are the harness's note-integrity invariants, which these probes trip on purpose by editing notes from outside. The one exception is ZR-23, which failed on a selector problem; ZD-07 and ZD-08 cover the same ground.

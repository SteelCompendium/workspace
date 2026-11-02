# SC-481 r3: independent adversarial review of the r2 fix (plugin d250e97 on 4deb8cf)

## Executive summary
1. **Verdict: NOT LAND-READY.** Counts: HIGH 1, MEDIUM 1, LOW 1, INFO 6.
2. Plain fences are fixed and hold up under every probe in the brief: 2 and 3 twins in every click order, convergence, rapid and in-flight clicks, embeds, two Reading panes, Reading + Live Preview side by side, same file name in two folders, undo, different-body blocks (0 extra draws), no leaked views. Battery on HEAD: tsc/lint clean, jest 6161/1, lifecycle 42/42, e2e 124/124. Red/green reproduced: jest 6 of 8 red on 4deb8cf, G-S53 FAIL on the 4deb8cf bundle.
3. **HIGH-1 (in-scope gap, same as base):** identical twins inside a **blockquote or callout** still have the whole bug. Form Save on the upper twin, then a click on the lower card, **erases the edit** (names [Twin, Twin]), writes the upper block and empties the lower card. With adoption off, the wrong value shows and the wrong block is written. Both `reconcile` and the tests skip quote/callout sections by design (spec §3 "skipped"), but the owner's scope is "Reading view + Live Preview, one root cause".
4. **MEDIUM-1 (regression in the diff):** callout twins, default settings, one click on the upper twin: the lower card is now a red **"Counter: failed to render (parse) Not a YAML token: ```ds-counter"** card. Before the diff it was an empty card. The cause is `remountVacated`, which builds a body from the callout section's raw `> ` lines (`remountReused.ts:82-84`). It lacks the plain-fence guard that `reusedBlockBody` has (`ReadingModeBlockHost.ts:541`).
5. **LOW-1:** no jest case covers the `lastWriteLine` skip (`ReadingModeBlockHost.ts:542`). Removing it passes all framework jest; only lifecycle G-S4 catches it ("writer lost its view").
6. Deviations: (1) path scoping is safe; no cross-pane, embed or Live Preview harm was measured. (2) The `lastWriteLine` skip cannot hide a real reuse (see §3). (3) The test-line change is sound and models real Obsidian. The implementer's mutation claims (a), (b) and guard-line are confirmed. Two more mutants survive the whole battery, and both are equivalent (INFO-3).
7. Fix: give `remountVacated` the same section guard. Then either extend both paths to quote/callout window sections (SC-455 ordinal) or get an owner ruling that splits HIGH-1 into a follow-up ticket.

## 1. Battery (HEAD d250e97, origin/develop still 4deb8cf, load 2-8)
| Gate | Result | Log |
|---|---|---|
| tsc, tsc -p e2e, lint | rc 0, clean | `sc481-r3-tsc-lint.log` |
| jest | 6161 passed / 1 skipped, 249 of 250 suites, rc 0 | `sc481-r3-jest.log` |
| jest twin-reuse on 4deb8cf source | 6 failed / 2 passed (red) | `sc481-r3-jest-base-4deb8cf-red.log` |
| G-S53 on 4deb8cf bundle | FAIL in every phase (2 twins [6,6] vs [6,5], collisions +1, [7,5]; 3 twins 2 cards for 3; montage [3,1]; ...) | `sc481-r3-lifecycle-gs53-base-4deb8cf-red.log` |
| lifecycle half 1 / half 2 | 21/21 + 21/21 = 42/42 | `sc481-r3-lifecycle-1.log`, `sc481-r3-lifecycle-2.log` |
| e2e (re-run on HEAD) | 124/124 ok, 0 failed, 0 known-bug, 87/87 pairs (CHR-F02 did not recur) | `sc481-r3-e2e.log` |
| shots / freeze / parity | not re-run: the diff does not touch CSS or render output, and 4deb8cf is harness-only. Spot-checked the r2 logs: 592 0 FAIL 157/942, freeze 280/280, parity 0/0/24 | r2 logs |

## 2. Findings

### HIGH-1: twins inside a blockquote or callout are not fixed (data loss is still reachable)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:541` (`reusedBlockBody` returns null for any section that is not a prefix-free plain fence, so `reconcile` never judges quote/callout views). `remountVacated` (`remountReused.ts:74-87`) has the problem in MEDIUM-1. G-S53 and `twin-reuse.test.ts` cover plain fences only. Their "guard" case asserts that callouts are skipped.
- **Measured (real Obsidian 1.15.0; HEAD and 4deb8cf identical):**
  - `R3/quote-twins.md` (two `> ```ds-counter` blocks) and `R3/callout-twins.md` (two `> [!note]` callouts each holding the counter). Form Save upper (Twin -> Edited) gives names [Edited, Twin]. Then a click on the lower card gives disk `[6,5]`, names **[Twin, Twin]** (the edit is erased), and 1 card plus 1 empty card. Logs: `sc481-r3-probe-run-head-8.log` vs `sc481-r3-probe-run-base-8.log`; screenshot `sc481-r3-head-quote-twins-form-save-then-lower-click-edit-lost.png`.
  - Adoption off, both fixtures: upper click gives cards [6,6] vs disk [6,5]; a lower click gives disk **[7,5]** (writes the upper block). Logs: `sc481-r3-probe-run-head-6.log` and `run-base-6`.
  - Removing the prefix guard alone (mutant me) does not fix quote adoption-off (`sc481-r3-probe-run-me-6.log`). The closing-fence check / window resolution needs real work.
- **Failure scenario:** a GM keeps two identical counters in two callouts (a common "party" layout). They rename one through the block edit form, then click the other. The rename is silently overwritten on disk. This is exactly the r1 F1 data loss the owner asked to have fixed in Reading view.
- **Fix (pick one, owner call):**
  - (a) In scope now: judge window sections in both paths with the host's own SC-455 resolution of its fence inside the section (the ordinal / `ownFence` the host already uses to write). For the remount, take the body from that fence's lines with the quote prefix stripped (`blockBodyLines` on the fence's own lineStart/lineEnd, not the section's). Add G-S53 phases and jest cases for quote and callout twins (form Save upper, then lower click, then names; adoption off).
  - (b) Owner ruling to split it out: file a follow-up ticket ("SC-481 for twins in quotes/callouts"). Say in the land-ready comment that the data-loss path is still reachable there.

### MEDIUM-1: callout twins now show a YAML parse-error card (regression introduced by `remountVacated`)
- **Where:** `src/framework/host/remountReused.ts:82-84`. After adoption, `prevCtx.getSectionInfo(prevEl)` resolves to the CALLOUT section: Obsidian's `getSectionForElement` uses `section.el.contains(el)`, app.js 1.15.0. `blockBodyLines(lines, section.lineStart, section.lineEnd)` then returns the callout's raw lines (`> ```ds-counter`, `> name: Twin`, ...). There is no `parseOpenFenceLine`/prefix/closing-fence check like the one at `ReadingModeBlockHost.ts:541`.
- **Measured:** `R3/callout-twins.md`, adoption on (default), upper click gives disk [6,5].
  - HEAD: cards `[Twin=6, ?]`, and the lower card reads "Counter: failed to render (parse) Not a YAML token: ```ds-counter at line 1, column 3" with no control.
  - Base: cards `[Twin=6]` + 1 empty card.
  - Logs: `sc481-r3-probe-run-head-1.log` vs `sc481-r3-probe-run-base-1.log`.
  - Screenshots: `sc481-r3-head-callout-twins-after-upper-click-parse-error-card.png` and `sc481-r3-base-callout-twins-after-upper-click-empty-card.png`.
  - Quote-prefixed twins (`> ```ds-counter` as the section's first line) are fine with adoption on: [6,5] -> [6,6] -> [7,6], because `blockBodyLines` strips the fence's own prefix.
- **Failure scenario:** any note with two identical blocks in callouts. The first click turns the twin into a red parse error that shows the user's own block text as invalid YAML. The user is likely to "fix" a block that is not broken.
- **Fix:** in `remountVacated`, apply the same section test as `reusedBlockBody`: `parseOpenFenceLine(lines[lineStart])` non-null, and `parseCloseFence(lines[lineEnd])` non-null, before emptying `prevEl`. Ideally factor the shared check into one helper used by both. That alone restores the base behaviour (empty card), which is still HIGH-1. The full fix is HIGH-1 (a). Add a jest case: callout twins, upper click, assert no error card and that `prevEl` is not drawn from callout lines.

### LOW-1: the `lastWriteLine` skip is not pinned by jest
- **Where:** `ReadingModeBlockHost.ts:542`, test file `test/dom/framework/twin-reuse.test.ts`.
- **Measured:** mutant md (line 542 deleted) passes all of `test/dom/framework` (1079 passed). Lifecycle on the md bundle: **G-S4 FAIL "writer lost its view"**. G-S53, G-S1, G-S15, G-S7a and G-S6g pass. Logs: `sc481-r3-mut-md-jest.log`, `sc481-r3-mut-md-lifecycle.log`.
- **Scenario the line protects:** two panes on one note. Pane B's rebuild runs first, and its `reconcile` sees the pane-A writer still on its own line with the pre-write section. Without the skip it releases the writer, and SC-340 adoption is lost.
- **Fix:** add a jest case to `twin-reuse.test.ts`. Write from docId A; run the docId-B processor first, with A's section still showing the old body at the write line; then A's rebuild. Assert claims 1 and the same root.

### INFO
1. **Deviation 1 (path scoping) is safe in every probe** (`sc481-r3-probe-run-head-2.log`, `run-head-3`, `run-head-4`). Each row below shows cards == disk in every view after every click, with 0 errors and 0 Notices.
   - Reading + Reading, 6 alternating clicks: claims 1 per click.
   - Reading + Live Preview, 7 alternating clicks: Live Preview writes show one `reused-by-twin` release, which is correct.
   - An embed (`![[twin-emb]]`), 4 clicks: claims 1.
   - Two notes named `twins.md` in two folders, side by side: the other note was untouched.
2. **Deviation 2 (`lastWriteLine` skip) cannot hide a real reuse.** Obsidian reuses an element only for a block whose text equals the element's old html. So the reused block's body differs from the view's `knownBody` only in the window between the view's own write and its rebuild. In that window the twin is always below the writer (first unused old section, document order), so its line is greater than `lastWriteLine`. `lastWriteLine` is refreshed by every write, and a reuse with a different body needs a fresh write. The skip's only effect is the one LOW-1 describes.
3. **Equivalent mutants (survive jest; not worth tests):** mf (`if (entry.released || entry.claiming) continue;` removed, `remountReused.ts:99`) and mg (`prevEl.replaceChildren()` removed, `:85`). `liveEntries` never yields released entries. `claiming` is cleared synchronously in `adoptView` before `reconcile` runs. The vacated element is already empty after `appendChild`. Keep them as defensive code.
4. **Implementer's mutation claims confirmed** (framework jest): (a) remountVacated off: 3 red; (b) reconcile off: 2 red; guard-line reverted: 3 red. Also (mh) not recording `lastWriteLine`: 3 red.
5. **Deviation 3 (`view-adoption.test.ts:62`) is sound.** Real Reading-view `getSectionInfo` returns null for a discarded section's element: `getSectionForElement` searches the current `sections` list. The test still pins same root, claims 1, `registry.size` 1 after the old child unloads, a loaded view and the rebound host. Caveat for later: Live Preview's `getSectionInfo` (`s.contains(f) ? {...}`) returns a non-null stale result for a DESTROYED widget. Today that is harmless, because Live Preview never adopts (random docIds). If Live Preview adoption is ever added, `remountVacated` would draw into destroyed widgets. The other fake-context adoption tests now silently remount into `ctx.el` because the fake ignores the element. None of them asserts against it.
6. **Integrity, cost and other probes** (`run-head-3/4/5`):
   - **Different-body blocks.** Five different counters, 6 clicks: 0 `pipeline.run`, 0 `reused-by-twin` releases, every tagged root kept (adoption on). Adoption off: 1 run per click, the written block only.
   - **Leaks.** Reading: 12 clicks on 3 twins leave 6 live entries (3 Reading + 3 from the leaf's hidden Live Preview editor), 0 after closing the note. Live Preview: 3 entries for 3 blocks and 5 for 5, 0 after closing.
   - **Rapid clicks.** All correct:
     - a double click on the upper twin: [7,5];
     - upper and lower in the same tick: [8,6];
     - a click on the upper card at the instant its write landed (before the rebuild), then the lower card, in Reading and Live Preview: [7,6];
     - adoption off, an upper click during the rebuild: [7,5].
   - **Undo.** Source-mode undo after a click gives [5,5]; then lower and upper clicks land correctly.
   - **Mixed note.** Twin counters and twin montages interleaved: all correct.
   - **Converge.** 8 clicks in Reading and Live Preview, and 9 on triplets: all correct. Converged writes still collide (claims 0, collisions 1, a fresh view, correct display), as spec §3 predicted. SC-340 focus/modal adoption is not kept on those writes; this is not new.
   - **Cost.** A 92 KB note with 40 blocks in Reading: about 4.5 ms per processor call for the uncached `reusedBlockBody` across all 40 entries (upper bound; the real `reconcile` shares one line split). Live Preview: 0.46 ms (2 live widgets). Negligible.
   - **Not re-probed** (already green): SC-518 G-S50 3b and scroll G-S8/G-S15/G-S42 in the halves above. The G-S50 comment staleness is already ruled by the owner (fold or drop).

## 3. Probe kit and reproduction
- Scratch (nothing committed; the worktree was never edited): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r3-review-ab18c95bec20e977d/`:
  - `probe-r3.mjs` (scenario P481-R3, sub-probes selected by `SC481_WHICH`);
  - `mkprobe.py` (injects the fixtures and the probe into a scratch copy of the harness);
  - `probe.sh`;
  - `mutate.py`, `mut-jest.sh`, `mut-build.sh` (mutants on a `git archive` copy, `head-src/`);
  - `base-4deb8cf/` (base source and bundle);
  - `run-*/p481-r3.json` (raw probe output) and `run-*/shots/`.
- `git status --porcelain`: plugin empty and superproject ` M draw-steel-elements`, before and after (unchanged).

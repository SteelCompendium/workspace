# SC-544 r3 — independent review of C1 (plugin d3e426dd on 423e798d, superproject 1664d43b)

## Executive summary
1. **Verdict: LAND-READY.** Nothing blocks the land. HIGH 0 · MEDIUM 1 (an existing bug, not caused by this change) · LOW 2 · INFO 9. Two doc edits are recommended before landing (MEDIUM-1 wording, LOW-2).
2. **Gates on HEAD, re-run by me** (lifecycle on my own port 9546):
   - tsc and lint clean.
   - jest 6279 passed / 1 skipped / 250 of 251 suites.
   - lifecycle 47/47, run as 21 (186 s) + 16 (337 s) + 10 (453 s).
   - e2e 124/124, 0 failed, 0 known-bug, coverage 87/87, pointer parked.
   - All of these match the implementer's numbers.
   - The diff touches no CSS and no shots harness: styles.css is byte-identical on base and HEAD (ae45354b). So I trust r2's shots, freeze and parity results.
3. **Red/green, with my own `git archive` bundles.** Base is 423e798d (aa4efdf6, the same bytes as r1's base); HEAD is d6278dd2 (= r1's bundle-c1).
   - G-S61 FAILs (a)-(i) on base with the r1 numbers: (a) [6,5,6] with 8 frames; (b) [6,5,7]; (c) [5,6,5,6]; (d) [6,3,5,3,5,4]; (e) [5,5,6] with 15 frames; (f)(g)(h)(i) [6,5,6].
   - It PASSes on HEAD with 0 pending-on-another-block frames.
4. **Mutants.**
   - The implementer's mutants reproduce: M1 fails (a)-(i), M2 fails (a)-(f) through the frame recorder only, M3 fails (e).
   - My mutants:
     - M4 (flush only Live Preview callout views) fails (f)(g)(h)(i), so the gate sees every surface.
     - M5 (flush after the writer's own section read) and M6 (flush in a microtask) PASS. These are equivalent mutants (INFO-2).
5. **Real-Obsidian probes: C1 is correct everywhere I probed.**
   - These cases misroute on base and are clean on HEAD: gaps of 50, 200 and 350 ms in LP and Reading view; 4 twins with 3 or 4 quick clicks; 2 counters per block with triple clicks (LP and Reading view); panes LP+LP, RV+RV and RV+LP; alternating clicks on twins; an outside edit that inserts a line above the blocks.
   - No extra writes: 5 quick clicks on one card make 1 write. Alternating clicks on two different blocks make 2 writes, the same as base.
   - A pending view in another note is never flushed.
   - Note close and pane close are clean. Plugin off/on gives the right disk.
   - Recursion terminates, at depth 10 with 10 pending views.
   - Cost: under 0.1 ms with 64 registry entries; 4-5 ms for the outermost call when it flushes 9 siblings.
6. **MEDIUM-1 (exists on base, not a regression).** Open the block form on the middle twin while the upper's click is still waiting to be written, then Save. The Save writes into the LOWER block, on base and HEAD alike, in LP callouts, LP plain blocks and Reading view. It is the same handover mechanism, and C1 does not cover it. The CHANGELOG's "form's Save made right after a click" can be read as covering it. Fix: tighten the wording, list the case as not covered, file a follow-up.
7. **Tree.** `git status --short` reads the same before and after: superproject ` M draw-steel-elements` (pointer not bumped, as it was), plugin clean. I committed nothing.

## Scope checks
- **Diff `423e798d..d3e426dd`.** It touches `src/framework/view.ts` (+9), `host/viewRegistry.ts` (+14), `host/ReadingModeBlockHost.ts` (+7), two jest files, `visual-harness/obsidian-lifecycle.mjs` (G-S61, +316) and `.repo-docs/architecture.md`. It does NOT touch SC-472's files (`previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`), `pipeline.ts` (the click shield) or any CSS. The superproject commit 1664d43b is CHANGELOG only.
- **G-S61 fixtures.** They come from the harness's in-file `FIXTURES` map (`twin-callouts-4.md`, `twin-callouts-xy3.md`, plus the reused `twin-callouts-3.md`, `twin-callouts.md` and `twin-triplets.md`). The harness writes them into the temp vault at startup (`obsidian-lifecycle.mjs:4961`). G-S57's fixtures (`twin-callouts-far.md` and the others) come from the same map, so this matches how G-S57 does it. No `Lifecycle/*.md` files are needed in the repo.
- **Notice check.** G-S61 hides `.notice-container` with CSS, but `t.noticesSince` counts Notices from the harness's own hook, so its "0 Notices" check still means something. My probes recorded a Notice while it was hidden (rename case).
- **Out of scope, and seen exactly as on base.** SC-550 (a sidebar click is lost when it comes right after a note-card click: re-measured on HEAD, `sc544-r3-sidebar-head.log`; there are no wrong-block writes); SC-545 (LP display after plugin off/on); SC-549 (outside edits).

## Findings

### MEDIUM-1 — a form opened on a twin before a sibling's waiting write lands saves into the twin below (exists on base; C1 does not cover it)
- **Where.** `ReadingModeBlockHost.ts:683-707`. The form's `replaceSource` (`fromView: false`) resolves its section through the host's element when Save is pressed (`readSection` at :706). The view itself is fine (it has nothing waiting), so `flushPendingWrites` at :701 has nothing to do.
- **Scenario** (`formA-*`):
  1. Click + on the upper twin.
  2. About 100 ms later, open the MIDDLE block's form (Enter on its pencil). Its own view has nothing waiting, so `openAfterPendingWrite` opens it at once.
  3. The upper's write lands about 300 ms later. Its rebuild hands the middle's element to the lower slot.
  4. Edit the name and Save.
- **Measured** (`sc544-r3-probes.log`, runs B-head and B-base):

| Case | Base 423e798d | HEAD d3e426dd |
|---|---|---|
| `formA-lp` (LP callouts) | [6,5,5], names [Twin,Twin,**Edited**] | same |
| `formA-rv` (Reading view) | same | same |
| `formA-pl-lp` (LP plain blocks) | same | same |
| `formA-slow-lp` (form opened after the write landed) | clean | clean |

  - The Save writes into the lower fence (`rs(d0,form,v5,L25)`; `L22` for plain blocks). Nothing is lost, but the edit is in the wrong block.
- **Why it matters here.**
  - It is the same "element handed to a twin" mechanism. The "pending" thing is an open form instead of a debounced edit.
  - `architecture.md:643` does not list it under "Not covered".
  - `CHANGELOG.md:17` "…and for a block edit form's Save made right after a click" can be read as covering it.
  - The case that is actually fixed is (e): a click on one block, then a form Save on ANOTHER block.
- **Fix.**
  - (a) Docs, now. Change the CHANGELOG to "…and when a block edit form on one block is saved right after a click on another block". Add "a block form opened while another twin's write is still pending (its Save lands in the twin below; exists on base)" to the not-covered list in architecture.md:643.
  - (b) Code, as a follow-up ticket for the owner to file. When a form opens, flush the note's other pending views and wait for those writes to settle before it opens: the SC-519 `openAfterPendingWrite` path, widened from "this view" to "this note". The form then opens after the rebuild, on a host whose element sits on its own block (`formA-slow` shows that this ordering is clean). There is a residual case: a write that lands while the form is open (an outside edit, or Sync) can still move it.

### LOW-1 — one Ctrl+Z after two quick clicks now reverts both clicks in Live Preview
- **Measured** (`undo-lp`):
  - HEAD: after the pair, the editor reads [6,6,5]. undo1 → [5,5,5]; undo2 does nothing.
  - Base: after the pair, [6,5,6] (the bug). undo1 → [6,5,5]; undo2 → [5,5,5]: one undo step per write.
  - Control `undo1-lp` (the clicks 2 s apart): two steps on both.
- **Why.** C1 lands both writes about 2 ms apart, and Obsidian brings them into the editor as one change.
- **Effect.** It is harmless and arguably right: two quick clicks read as one gesture. No data is lost (the base display mismatch after the undo is also gone).
- **Fix.** None needed. Optionally add one sentence to the behaviour note in architecture.md:643.

### LOW-2 — G-S61 rewrote two earlier entries' scenario counts
- **Where.** `visual-harness/obsidian-lifecycle.mjs:103` (SC-537 G-S57) and `:111` (SC-522 G-S52) changed "46 scenarios in all" to "47".
- **Why it is wrong.** Each header paragraph records the count at the time it was appended (SC-492 34 … SC-533 43, SC-537/SC-522 46). Only the new SC-544 paragraph (:116) should say 47.
- **Fix.** Restore 46 at :103 and :111.

### INFO
1. **Recursion can flush the WRITER's own view.** `except` (viewRegistry.ts:104) only guards the direct call. A sibling's nested `flushPendingWrites(path, sibling)` flushes the writer's own waiting view.
   - Probe `formC-lp-scriptonly`: the middle's form is open; a script + on the middle's card and on the upper; then Save.
     - HEAD: the order is middle view, then upper, then form. Final [6,5,5], names [Twin,Edited,Twin]: the click is lost, the form wins.
     - Base: [6,6,5], names all Twin: the form edit is erased.
   - A real user cannot reach this today (the form is a modal). No fix needed. If wanted, a re-entrancy guard on the registry (nested calls return at once, because the outer loop already reaches every sibling) would keep `except` true and also put the writes in click order.
2. **Equivalent mutants.** M5 (the call after the writer's own `readSection`) and M6 (the call in `queueMicrotask`) pass G-S61. That is because `Vault.process` awaits file I/O before its callback, so a sibling still reads its section before any rebuild.
   - The comment's "Synchronous: every one of them reads its section before any Vault.process" is true, but no real-Obsidian test depends on it.
   - jest's ordering test does catch M6 and M2 (`sc544-r3-jest-mutants.log`).
3. **Write order is reversed.** The deepest sibling enqueues first: with 10 waiting, `vp1` is block 9 and `vp10` is block 0. Every write still lands in its own block ([6×10, 5×20]). The doc's "the Vault.process calls then chain" is accurate; the order is not documented.
4. **The G-S61 frame recorder runs only on Live Preview pane A.** M2 is caught only in (a)-(f): the Reading view phases and pane B have no recorder. The disk checks still guard every surface. Acceptable as is.
5. **jest mutants.**
   - The implementer's "drop sourcePath filter" edit replaced BOTH occurrences, including `claim()`'s filter at viewRegistry.ts:159. My precise mutant (j2, `flushPendingWrites` only) still turns only "a pending view of another note is not written" red, so the conclusion holds.
   - The `entry.released` filter cannot be reached from the tests: `release()` deletes the entry (viewRegistry.ts:229), so mutant j3 passes. It is harmless defensive code.
   - Focused suites: HEAD 52/52; m1 4 red; m2 1; m3 2; m4 4; m5 0; m6 1; j2 1; j3 0.
6. **Existing behaviour, the same on base.**
   - A rename inside the window loses both clicks, and one Notice says so ("…was not saved — the plugin can't tell where this block sits"). The cards keep showing 6/6 while the disk holds 5/5. `replaceSource` returns at :686-694, before the flush. It is not silent (SC-455).
   - An outside edit that deletes the middle twin inside the window: the middle's +1 lands in the surviving twin below. The deleted block never comes back, and the text above and below survives.
   - A hand edit of the lower twin's name inside the window survives on both.
   - An outside insert above the blocks misroutes on base ([6,5,6]) and is clean on HEAD.
7. **Cost.**
   - With 30 blocks in the note plus 30 in another pane (64 registry entries, 33 for the same note), an idle flush loop measures under 0.1 ms.
   - 10 waiting views make 10 nested `replaceSource` sync parts: the outermost call takes 4-5 ms, all 10 calls together under 25 ms. The cost comes once per write and is negligible.
8. **Docs.**
   - `architecture.md` (the host row and :643) is accurate apart from MEDIUM-1 and INFO-1/3.
   - The CHANGELOG bullet (`CHANGELOG.md:11-17`) uses plain words and names every surface: LP callouts and plain, Reading view callouts and plain, one or two panes, and the form Save. It makes no SC-549 claim (no typing or outside edits). Its only issue is the form wording in MEDIUM-1.
   - Proposal file `sc544-dse-verify-proposal.md`: its numbers match mine (47/47 as 21+16+10, part 3 about 455 s, under 540 s). It says the red run was on the `eaf64ba6` bundle; that is the same main.js bytes as 423e798d. Optionally add M4 (callout-only fails (f)-(i)) to the clause as a control.
9. **Ports, and the base has moved.**
   - Every lifecycle run of mine, gates and probes, used `DSE_LIFECYCLE_PORT=9546`, per the owner's addendum. No run mass-FAILed.
   - develop is now eafe76e1 (SC-511 touches `pipeline.ts`). The next round's rebase must re-run G-S57 + G-S61 on the combined code, as the SC-540 relay requires.

## Evidence (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/`)
- **Gates:** `sc544-r3-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1.log`, `-part2.log`, `-part3.log`, `-e2e.log`.
- **G-S61:** `sc544-r3-g61-red-base-423e798d.log`, `sc544-r3-g61-green-head.log`, `sc544-r3-g61-mutant-M1.log`, `-M2.log`, `-M3.log`, `-M4-calloutonly.log`, `-M5-afterread.log`, `-M6-microtask.log`.
- **Probes:** `sc544-r3-probes.log` (every case, HEAD vs base, with its call/write sequence), `sc544-r3-sidebar-head.log`, `sc544-r3-jest-mutants.log`.
- **Scratch** (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r3-review-af6d13a061fdaf760/`):
  - probe scenario `pr-scenario.mjs`, page helpers `pr-page.js`, fixtures `pr-fixtures.js`;
  - `mkharness.py`, `pr-run.sh`, `lc.sh`, `gate.sh`, `mut.py`, `jmut.sh`, `jmut2.sh`;
  - bundles `bundle-{base,head,m1..m6}`, sources `src-{base,head,m1..m6,j2,j3}`;
  - runs `runs/{A,B,B2,C,D}-{head,base}`, `runs/SB-head` (per-case JSON in `pr544.json`); start status `status-start.txt`.
- **FAIL temp dirs the harness kept from my red and mutant runs** (screenshots): `/tmp/dse-obsidian-lifecycle-mfqB9f` (base red), plus `-0B6MA2`, `-WBlu2d`, `-SZTpBF` and `-kbdNZs` (one each for M1, M2, M3 and M4; each log names its own).

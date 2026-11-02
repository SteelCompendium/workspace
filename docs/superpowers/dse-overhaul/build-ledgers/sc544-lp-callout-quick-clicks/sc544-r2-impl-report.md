# SC-544 r2 implementation report

## Executive summary
1. Verdict: DONE. C1 implemented as designed (flush of the note's other pending views before a block host writes); G-S61 added; jest, docs, CHANGELOG, dse-verify proposal done.
2. Plugin commits on `sc544-lp-callout-quick-clicks`, rebased onto dse develop `423e798d`: `0e4bf51d` (tests, red) -> `62499847` (fix) -> `c76f7b76` (G-S61) -> `d3e426dd` (architecture.md). Superproject `1664d43b` (CHANGELOG only; pointer NOT bumped).
3. Gates on `d3e426dd` after the rebase: tsc/lint clean; jest 6279 passed / 1 skipped / 250 of 251 suites; lifecycle 47/47 (21 + 16 + 10); e2e 124/124, 87/87; shots 592, 0 FAIL, 161/966, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0 / 0 / 24.
4. Red/green: G-S61 FAILs (a)-(i) on the unfixed bundle with the r1 numbers, PASSES on HEAD (98-103 s, wrong-card frames 0). Part 3 took 452 s (< 540, no re-split).
5. Sidebar: measured, does NOT misroute (0 wrong-block writes in 22 runs, base and head); no change, no phase (k). It does show a separate lost click (Follow-up 1).
6. SC-540 probe bundle (HEAD + r1's click-stop): G-S57 and G-S61 both ok (2/2).
7. Jest mutants: M1 reds 4 (LP, RV, form Save, ordering), M2 (drop sourcePath filter) reds the "another note" test, M3 reds the ordering test only (not the RV test: deviation, see section 2).
8. G-S61 mutants: M1 fails (a)-(i); M2 (flush after await) fails (a)-(f) via the recorder only (disk is right); M3 (fromView only) fails (e). Deviation from the report's "M2 fails (a)": it fails (a) too, but by frames, not disk.

## 1. What was built
- `src/framework/view.ts`: `ElementView.flushPendingWrite()` (calls `flushPersist()`, no-op when nothing is scheduled).
- `src/framework/host/viewRegistry.ts`: `ViewRegistry.flushPendingWrites(sourcePath, except)`; `WriteTrackingView` gets `flushPendingWrite`.
- `src/framework/host/ReadingModeBlockHost.ts`: one synchronous call in `replaceSource` before the section read, with the WHY comment (Obsidian hands a pending view's element to an identical twin on the write's rebuild; flushed first, every pending edit is placed while its element still sits on its own block; SC-544). Bundle sha of HEAD source equals r1's `bundle-c1` (`d6278dd2...`), so the shipped code is the verified prototype.
- Recursion: a sibling's `replaceSource` flushes the others too; each `flushPersist` clears `persistScheduled` first, so it terminates.
- Docs: `.repo-docs/architecture.md` (host row, plus a paragraph under the SC-481 twin section, including what is not covered and why the sidebar is unaffected). CHANGELOG bullet under `## Unreleased` in plain words (Live Preview and Reading view, callouts and plain code blocks, one pane or two, form Save). SC-549's typing case is not mentioned.
- Proposal: `sc544-dse-verify-proposal.md` (row 4: 47/47, the three parts, the G-S61 clause; the new CURRENT line; two footguns). SKILL.md untouched.

## 2. Jest (7 new tests; 6262 + 7 = 6269 on the old base, 6279 on 423e798d)
- `twin-reuse.test.ts`: SC-537 describe gets the LP three-callout test (case 2); a new SC-544 describe has the Reading view three-plain-blocks test (case 1), the form-Save test (case 3) and the ordering test (case 5: the sibling's `getSectionInfo` is called before the writer's `vault.process`).
- `view-registry.test.ts`: three tests for `flushPendingWrites` (writes the other pending views, each in its own block; another note's view is not written; `except`, a released entry and an idle view make no write) = case 4.
- Red on the unfixed source: `sc544-r2-jest-red-unfixed.log` (7 failed: 3 registry `flushPendingWrites is not a function`, LP [6,5,6], RV [6,5,6], form Save [5,5,5], ordering). Green: `sc544-r2-jest-green-focused.log` (52/52).
- Mutants: M1 (call removed) turns red the LP test, the RV test, the form-Save test and the ordering test (4); M2 (no `sourcePath` filter) turns red "another note"; M3 (call after `await vault.process`) turns red only the ordering test. Deviation: the report expected M3 to also redden the RV and LP tests; they pass because the simulated rebuild runs after all writes, not between them. The real-Obsidian G-S61 M2 covers that ordering.

## 3. Sidebar measurement (real Obsidian 1.15.0, 4-block notes, a pinned block, two quick clicks 120 ms apart)
Fixtures `Probe544/sb4p.md` (plain), `sb4c.md` (callouts), `sb4d.md` (distinct names); pin = the card's pin item (stamps `_dse_anchor`); sidebar click = quick real click in the panel; the Update Available Notice had to be hidden first (it covers the panel). Log: `sc544-r2-sidebar-measure.log`; scenario: `sc544-r2-sidebar-probe-scenario.mjs`.
- Sidebar click second (note card pending, then + in the pinned sidebar card; pinned block 0, 1 or 3; Reading view and Live Preview): the note card's click is written in the block clicked every time; the SIDEBAR click is lost (disk lacks its +1, the sidebar card still shows the old value). Identical on base `eaf64ba6` and on HEAD.
- Sidebar click first (sidebar card pending, then a note card): clean in all 6 runs per surface, base and head.
- Control without a pin (`nopin-N1-N2`): fails on base ([5,6,5,6]), clean on HEAD ([5,6,6,5]), both surfaces.
- No wrong-block write was seen in any sidebar run. The pinned block carries a unique `_dse_anchor`, so it is no twin and its write cannot shift a twin's element. Decision per the ruling: clean (no misroute) -> no change to `SidebarBlockHost`, no phase (k).
- The lost click is not twin related: with four distinct names (`dist-pk0-N1-S`) the sidebar click is lost the same way on base. Window (head): note click, then sidebar click at 50/250/350 ms lost; at 500/700 ms (after the note's write landed) clean. No Notice, no page error in any run.

## 4. G-S61 (lifecycle, part 3 before G-S56; ~100 s)
- Fixtures `Lifecycle/twin-callouts-4.md`, `twin-callouts-xy3.md`; reuses `twin-callouts-3.md`, `twin-callouts.md`, `twin-triplets.md`. Header comments updated 46 -> 47 (G-S57, G-S52) plus a G-S61 paragraph.
- Click targets are found BY BLOCK (not by drawn-card order), so it does not depend on whether a click leaves a callout drawn or turns it into source (SC-540); confirmed on the SC-540 probe bundle (ok).
- Per phase: anti-vacuity (click 2 logged before the note's first write), disk values, one card per block with its value/name (cursor parked), text outside the blocks unchanged, a per-frame recorder in Live Preview (any frame with a pending card on a block it was not clicked on fails; a card not matching its block for 3 frames in a row fails; a single such frame is the editor catching up, seen twice on HEAD), 0 Notices, 0 page errors, reset in `finally`.
- Phases (a)-(j) as in the proposal; (e) uses a script + on the middle with the form open and a script Save 120 ms later.
- RED on the `eaf64ba6` bundle (`sc544-r2-g61-red-base-eaf64ba6.log`): (a) [6,5,6], 8 pending-card frames, then [6,5,7]; (b) [6,5,7], 7 frames; (c) [5,6,5,6], 8 frames; (d) [6,3,5,3,5,4]; (e) [5,5,6], 15 frames; (f) [6,5,6]; (g) [6,5,6]; (h) [6,5,6]; (i) [6,5,6] (and [6,5,7] after the follow-up); (j1-j4) pass.
- GREEN on HEAD (`sc544-r2-g61-green-head.log`): all phases as wanted, pending-on-another-block 0 in every phase.
- Mutants (logs `sc544-r2-g61-mutant-M1|M2|M3.log`): M1 no flush call fails (a)-(i); M2 flush after `await Vault.process` fails (a)-(f) by the recorder only (2-3 frames with a pending card on another block, disk right); M3 flush only for `fromView` fails (e) only.
- SC-540 probe bundle (r1's click-stop `stopPropagation` added to `pipeline.ts`, built in my scratch from HEAD, sha `96111d41...`): `--only=G-S57,G-S61` 2/2 ok in 188 s (`sc544-r2-sc540probe-G-S57-G-S61.log`).

## 5. Gate numbers (final HEAD `d3e426dd`, after rebase onto `423e798d`; logs `sc544-r2-gate-<gate>.log`)
| Gate | Result | Time |
|---|---|---|
| tsc (+ `-p e2e`) | clean | 12 s |
| lint | clean | 18 s |
| jest | 6279 passed / 1 skipped / 250 of 251 suites (obsidian-app.css was cached by an earlier shots run; fresh would read 6278 / 2) | 57 s |
| lifecycle part 1 (21) | 21/21 ok | 188 s |
| lifecycle part 2 (16) | 16/16 ok | 328 s |
| lifecycle part 3 (10, G-S61 before G-S56) | 10/10 ok | 452 s (< 540, no re-split) |
| e2e | 124/124 ok, 0 failed, 0 known-bug, coverage 87/87; pointer parked line present | 68 s |
| shots | 592 ok, 0 FAIL; button host-leak 161/966; modal 228; input 15/176; checkbox 7/116; prose 106 [212]; host-copy pin OK | 663 s (background run with rc file) |
| freeze | `freeze OK (280/280 ...)` | |
| parity | 0 gap(s), 0 undeclared, 24 declared | 6 s |
The first battery pass (lifecycle 3 parts, e2e, jest 6268/2) was on the pre-rebase tree and was redone after the 423e798d rebase as instructed; an earlier shots run was killed (my own PIDs) before the rebase.

## Drive-by fixes
None.

## Follow-ups
1. **Sidebar: a click in a pinned sidebar card is lost when a note card's write lands before the sidebar card's own 400 ms flush** (sidebar click 50-350 ms after a note-card click; clean at 500 ms+). The sidebar card keeps its old value and the disk lacks the +1; not twin related (distinct names, same result); same on `eaf64ba6` and HEAD; not a misroute, so not part of SC-544. Evidence `sc544-r2-sidebar-measure.log`. Probably the sidebar host rebuilding its card from the changed note and dropping the pending edit; not diagnosed.
2. The jest ordering of M3 (above): a jest test that makes a rebuild happen between two writes of the same round would also cover "flush after the await"; G-S61's recorder covers it in real Obsidian.
3. dse-verify footguns (in the proposal): find LP cards by block, hide the Update Available Notice before sidebar clicks.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/)
- This report; `sc544-dse-verify-proposal.md`
- Jest: `sc544-r2-jest-red-unfixed.log`, `sc544-r2-jest-green-focused.log`, `sc544-r2-jest-mutant1.log`, `-mutant2.log`, `-mutant3.log`
- G-S61: `sc544-r2-g61-red-base-eaf64ba6.log`, `sc544-r2-g61-green-head.log`, `sc544-r2-g61-mutant-M1.log`, `-M2.log`, `-M3.log`, `sc544-r2-sc540probe-G-S57-G-S61.log`
- Sidebar: `sc544-r2-sidebar-measure.log`, `sc544-r2-sidebar-probe-scenario.mjs`
- Gates: `sc544-r2-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1.log`, `-part2.log`, `-part3.log`, `-e2e.log`, `-shots.log` (+ `-shots.rc`), `-freeze.log`, `-parity.log`
- Screenshot: `sc544-r2-HEAD-lp-three-callouts-after-click-upper-then-middle-cards-6-6-5-disk-6-6-5.png`
- Scratch (probe tooling, bundles base/head/probe/m1-m3, runs): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r2-impl-b1/

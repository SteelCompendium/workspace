# SC-584 r5 fix report

**Executive summary**
- STATUS DONE. Rebased onto dse develop **b4e7b4f4** (SC-566; clean rebase, no package or CSS change). dse HEAD `796f5a87` (11 commits over b4e7b4f4), superproject `fa43eb02` (CHANGELOG only).
- CRITICAL-1 fixed with the guarded fix: in `takePin`, a FORM whose own fence was found inside a quote/callout window (`ownFence.lineStart !== section.lineStart`) takes the host's own-write record (`pinFromLastWrite`) instead of the by-body fence (the sibling counter). Record-first for every form was tried first and breaks the intended r3 test "part is current, note changed by 1000 lines" (the diff gives up; the link finds the block), so it was not used.
- Real Obsidian: new scenario G-S77 (callout with two counters, block and heading embed, RV and LP, + on the lower then the pencil) passes on this build; on the 3e81f9a5-equivalent bundle all four trials write the UPPER counter, on the b4e7b4f4 bundle the block embed is refused and the heading embed writes the upper.
- Probe (no + first, two IDENTICAL counters in a callout, pencil on the lower): Save writes the LOWER counter on base and on head, all four cells (block/heading x RV/LP) and in jest. No bug; nothing to fold.
- LOW-1 test kills mK (not equivalent); LOW-2 one-line unload drop added and tested; MEDIUM-1 both CHANGELOGs and the proposal reworded.
- Gates on b4e7b4f4: tsc/lint clean; jest 7122 passed / 2 skipped; lifecycle 54/54; e2e 255/262 ok, 0 failed, 7 known-bug, 163/163 (first run); styles.css `5e5ff488…` = clean b4e7b4f4 build, so shots/freeze/parity carry.
- Part 5 with G-S77: 271 s (G-S77 alone 27 s); part 3 untouched (444 s).

## Rulings
- **CRITICAL-1: FIXED** (guarded variant, see Design). Jest: block embed and heading embed, RV-style and LP-style hosts (4 cases), plus an outside-edit control with teeth (lower counter edited after the +: refused, upper never written). Lifecycle: G-S77, new scenario, part 5, before G-S56.
- **Probe-and-report: ANSWERED**, see Probe. Jest test added that documents it ("probe (r5)").
- **MEDIUM-1: FIXED.** The "an identical counter elsewhere is never chosen" claim is gone from both CHANGELOGs and the proposal. They now say: saves into the block the + was pressed on (the form is placed where the plugin wrote the +, not by searching the note for a body); a callout with two counters that read the same after the + saves the lower; refused when the block is edited or deleted since, for a hover/embed with no + on that card, for a callout embed whose `^id` is not directly under the callout, and for a callout form when hundreds of lines changed on both sides between the + and Save.
- **LOW-1: FIXED.** Test "the host is given a new mounted body (… remountReused) …": + (record), `setMountedBody(sameBody)`, stale part, form: refused. Mutant mK now killed (1); it is no longer called equivalent.
- **LOW-2: FIXED.** `this.lastWrite = null` in `onRenderChildUnload` (after the `renderChild !== this.renderChild` guard, so an adopted host's re-bound section is not affected). Test: unload the host's render child after the +, then the form is refused; mutant mT killed.

## Design
- `takePin(forForm)`: before the pin is made, `if (forForm && embedded && this.ownFence.lineStart !== section.lineStart) { const w = this.pinFromLastWrite(); if (w) return w; }`. The own fence of a block in a callout window is found by BODY (`locateInSection`); right after a + the window is stale (old body), so with two counters in the callout the only block holding the known body is the sibling. The record is the exact position of this host's own write (body equal to the known body), a whole-note pin judged by `mapLine` / `pinnedTarget` like any pin.
- Why not record-first for every form: it fails the intended test "the embed was redrawn after the +, so its part is current …" (1000 lines inserted around the block since the +: the line diff gives up beyond 400 on both sides, while the embed's link places a current part fine). The guard limits the preference to callout windows. Known cost, stated in CHANGELOGs and the proposal: a callout form with an old record and a current part can refuse after hundreds of lines changed on both sides.
- A plain block's window is the block itself (`ownFence.lineStart === section.lineStart`): unaffected, still link first, then text, then the record (r3).
- Card (+/-) pins still never take the record (test + mutant m-card).

## Probe: callout with two identical counters, NO + first, pencil on the lower counter, Save
- jest (DOM ordinal as in Obsidian): base `b4e7b4f4` source and head: pin placed at the lower fence, Save writes the LOWER counter, no Notice, for a block embed, a heading embed and a plain note (`sc584-r5-probe-nop-jest-{head,base}.log`).
- real Obsidian 1.15.1 (bundles: base = clean b4e7b4f4, head = this build), RV and LP, block embed and heading embed (4 cells each, `gs77Trial` with `plus: false`, scratch fixtures with identical counters): Save writes the LOWER counter on both, no Notice (`sc584-r5-probe-nop-obsidian-{head,base}.log`).
- So the card is told from its twin by its place in the callout's DOM when the window is not stale; the wrong-block write needs the + (stale window). No SC-596 work needed for this shape.

## Jest tests (reading-mode-host-pin.test.ts: 74 on base, 109 now)
New in r5 (8 tests + the 4-case table): block/heading x RV/LP lands in the lower counter; lower edited after the + refuses; probe (no + first, identical counters) writes the lower; remount drops the record (mK); unload drops the record (mT). The r3 "no + first, bodies differ" placeholder was replaced by the probe test.

## Commits (dse, branch sc584-embed-form-save-refusals; 8 earlier commits are r1/r3 rebased)
- `4de2c646` fix: callout-window form takes the record; unload drop; jest tests
- `02b75076` test: lifecycle G-S77 and the shared `gs77Trial` helper
- `796f5a87` docs: dse CHANGELOG reworded
Superproject `fa43eb02` CHANGELOG reworded. No pointer bump. `git status --porcelain`: dse empty; superproject ` M draw-steel-elements` (pointer only).

## Gate lines (b4e7b4f4)
- tsc `TSC_RC=0`; lint `LINT_RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7122 passed, 7124 total` (fresh worktree, no SC-568 timeout).
- lifecycle: p1 `21/21 ok` 187 s · p2 `16/16 ok` 340 s · p3 `9/9 ok` 444 s · p4 `4/4 ok` 313 s · p5 `4/4 ok` 271 s (`G-S59 G-S49 G-S73 G-S77`) = 54/54. The harness moves calls over 180 s to the background; each read to its end. Part 5 stays well under 480 s, no split needed.
- e2e: `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (379 s, first run).
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` = clean b4e7b4f4 build: shots 592 / host-leak 163/978 / modal 39/234 / clip 147, freeze 280/280, parity 0/0/24 carry, not re-run.

## Red on base
- jest, current tests on the r3 source (the committed 39ccf926 host): 6 failed / 109 (both embed shapes RV and LP, the outside-edit control, the unload test) — `sc584-r5-red-on-r3-jest.log`. On the b4e7b4f4 source: 14 failed / 109 (the landing tests incl. the four new) — `sc584-r5-red-on-base-jest.log`.
- lifecycle G-S77: on the r3-equivalent bundle (this branch before r5, rebased) 0/1: all four trials write the UPPER counter, no Notice (`sc584-r5-red-on-r3-lifecycle-G-S77.log`); on the clean b4e7b4f4 bundle 0/1: block embed refused with the Notice, heading embed writes the upper (`sc584-r5-red-on-base-lifecycle-G-S77.log`). Passes on this build (27 s alone; in part 5).

## Mutants (`sc584-r5-mutants.log`, `sc584-r5-mutate.py.txt`)
Killed: mS (the r5 guard dropped; 5), mS2 (record-first for every form: 1, the current-part test), mT (no unload drop; 1), mK (record kept on `setMountedBody`; 1), mC (4), mM (1), mG (2), mG2 (1), mO (2), mQ (14), mR (1), m-card (1), m-sibling (1). Equivalent (survive by construction): mF (part end without `max`: the part always contains the block's own fence), mL (no body equality on the record: only a write or `setMountedBody` changes the known body, and both replace or clear the record), mN (record not verified by `fenceAt`: a block a splice just wrote is always found). Note: the first mutation run used a copy of the runner pointing at the r3 scratch folder for the patch script, so mS, mS2, mT failed to patch there and were re-run in run 2; the log says so.

## Drive-by fixes:
None.

## Follow-ups:
1. A callout form whose record is old (hundreds of lines changed on both sides since the + and a part that is current) refuses; a smarter freshness test (DOM ordinal against the window's block order) could avoid it. Rare; a Notice, nothing lost.
2. `locateInSection` picks a body match even when the DOM ordinal says it is another block; a hardening (prefer the ordinal when several fences are in the window) would also protect forms with no record (P13 without a +, SC-596).
3. G-S77 asserts the + then pencil path only; the outside-edit controls are jest-only (the redraw closes the form in real Obsidian).

## Evidence artifacts (ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/)
sc584-r5-fix-report.md, sc584-dse-verify-proposal.md (r5), sc584-r5-gate-{tsc,lint,jest,e2e,styles-sha}.log, sc584-r5-gate-lifecycle-p1..p5.log, sc584-r5-red-on-r3-jest.log, sc584-r5-red-on-base-jest.log, sc584-r5-red-on-r3-lifecycle-G-S77.log, sc584-r5-red-on-base-lifecycle-G-S77.log, sc584-r5-probe-nop-jest-head.log, sc584-r5-probe-nop-jest-base.log, sc584-r5-probe-nop-obsidian-head.log, sc584-r5-probe-nop-obsidian-base.log, sc584-r5-mutants.log, sc584-r5-mutate.py.txt.

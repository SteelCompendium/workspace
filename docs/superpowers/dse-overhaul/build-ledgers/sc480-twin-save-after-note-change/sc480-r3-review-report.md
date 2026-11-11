# SC-480 r3 review report (reviewer R1; returned inline, saved verbatim-in-substance by the owner)

## Executive summary
- Verdict FIX FIRST: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW, 5 INFO. Reviewed dse 97a9c93b..cb665989, superproject 3efbbc13.
- E works as ruled in real Obsidian 1.15.1: deleted-twin 36/36 nothing written + exactly 1 Notice + note byte-identical; controls 24/24; extra shapes 84/84 (base misrouted 64/64); race 36/36 + 24/24 controls; 120/120 bytes outside the block kept.
- Gates on cb665989: tsc rc 0, lint rc 0, jest 7062 passed / 2 skipped / 260 of 261 rc 0 (fresh worktree, no SC-568 timeouts); lifecycle part 3 9/9, part 4 4/4, part 5 3/3, G-S11+G-S14 2/2; e2e 249/260 ok, 0 failed, 11 known-bug, 161/161 rc 0; styles.css 4295ca33 = clean 97a9c93b.
- G-S73 real (fails on base and mutant Ma) but misses mutant Mb (LOW-3). Jest: 7 of 8 mutants red (Mh equivalent).
- F1 embed window: real but unreachable at human speed (0 of 53 natural trials with a partial pin; rebasePin 0.2-29 ms). Forced window: E fixes a misroute (twin above) and refuses a correct write (twin below).
- Evidence: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r3-reviewer/ (harness vh/, out/, mut/, gate-*.log, cmp-cost.md).

## Findings

### MEDIUM-1: rule E misses a twin created by the same outside edit that deletes the clicked block
- Where: src/framework/host/ReadingModeBlockHost.ts:952-955 (`twinned`) and :1019-1020.
- Scenario: blocks Y (`current_value: 4`) and X (`5`). The user presses + on X. Before the 400 ms flush, ONE outside edit (e.g. Sync: "delete X, set Y to 5") deletes X and makes Y identical to X's old body. X's body is unique in pin.text (Y was 4) and unique now (only Y), so `twinned` is false; the fallback `resolveWriteTarget` writes X's click into Y with no Notice.
- Measured: HEAD MISROUTED 12/12 (RV/LP, leave/stay; path pin:miss>tw:false>rwt:search|section). Base same 8/8. Not a regression; the ticket's harm class.
- Prescribed fix (probed): after a pin miss, map the fallback target's fence line back into the note as clicked; if it lands on a different pre-existing block, refuse:
  ```ts
  if (pin && !pinned && typeof target === 'object') {
  	const back = mapLine(content, pin.text, target.lineStart);
  	if (back !== null && back !== pin.lineStart && this.fenceAt(pin.text, pin.lineStart) !== null) target = 'miss';
  }
  ```
  (needs `let target`; keep the count rule too, for the >400-edit case where mapLine returns null). Probe: without the fenceAt condition sync-del-bump refused 8/8, cutpaste-solo still lands 8/8, hand-twin and dup-move refused 8/8; that version broke one jest test whose synthetic pin points at a non-fence line. With fenceAt, all 584 write-path tests pass.

### LOW-1: both CHANGELOG entries understate the cost and the limits
- Where: CHANGELOG.md:10-17 (superproject), draw-steel-elements/CHANGELOG.md:25-31.
- (a) Missing cost: a cut/paste move of the clicked block within the window, with an identical block elsewhere, is refused on HEAD 24/24; base wrote it correctly 14/16 (twin-near 8/8, twin-far 6/8).
- (b) Missing limit: "Now nothing is saved" stated without exception; the blank-line-only twin limit (owner-ruled known limit, F2) is left out, although SC-556's entry states it. Deleting the upper of two blank-separated twins still saves into the survivor.
- Fix: extend the Limit sentence (e.g. "…or if the block itself was moved elsewhere in the note (cut and paste) in that moment…"); add SC-556's two-identical-blocks-separated-only-by-blank-lines sentence. Entries do not mention the unpinned path (correct).

### LOW-2: after a refusal the block survives, the card keeps the refused value and the next click saves it
- Where: ReadingModeBlockHost.ts:1020 -> 'miss'; the view's model is not reset (view.ts flushPersist).
- Scenario: long-twin (>400 lines change around a twinned block during the window): write refused with "was not saved"; block text unchanged, so the card is not rebuilt and keeps showing the refused value; the next + writes both increments.
- Measured: after-longtwin-same 6/6 (RV+LP): disk [5,5] + 1 Notice, card [5,6]; then a click -> disk [5,7], 0 Notices. Base landed the first click.
- Impact: no wrong-block write, but the Notice's "not saved" stops being true after the next click; leaving the note after the refusal loses the click. New with E (before E a card write was refused only when its block's text had changed, which rebuilds the card). Cut/paste refusals probably affected too (not measured).
- Fix: on a card write refused as twinned, re-render the view from knownBody; or document + file.

### LOW-3: G-S73 does not exercise the `now` count
- Where: visual-harness/obsidian-lifecycle.mjs:536-537 (GS73_TRIALS).
- Mutant Mb (drop the now count) passes G-S73 12/12; only one jest test catches it. Reachable: dup-move (a unique block cut and pasted twice in one outside edit) refused on HEAD 12/12, Mb and base write into one copy 8/8.
- Fix: add a dup-move trial (RV+LP, leave) to G-S73 expecting nothing written + 1 Notice.

### INFO
1. F1 cells/window: see summary.
2. countByBody scope = locateByBody's (21 shapes); counts a fence inside an HTML comment (errs toward refusing). No action.
3. `!options?.pinOnly` guard in `twinned` (:1019) is equivalent (Mh survives); keep.
4. CRLF LP leave: note came back LF-converted 6/6 after a correct refusal — Obsidian's editor, not DSE.
5. Unpinned card writes keep today's path; mutant Mi (apply E there) breaks 16 SC-343/455/460/552 tests — supports the ruling. SC-556 form Saves stay pin-only (G-S64 passes). dse-verify proposal numbers match.

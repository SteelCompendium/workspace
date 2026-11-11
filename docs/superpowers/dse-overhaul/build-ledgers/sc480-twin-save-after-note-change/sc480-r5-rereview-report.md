# SC-480 r5 scoped re-review (R1; returned inline, saved by the owner)

## Executive summary
- FIX FIRST on 63492c9a: 0 CRIT/HIGH, 1 MEDIUM, 1 LOW, 3 INFO. Delta cb665989..63492c9a on 97a9c93b; superproject 3efbbc13..bbfbeade.
- MEDIUM-1 (sync-del-bump) fixed: refused 8/8, 1 Notice, note byte-identical (cb665989 misroutes 8/8). LOW-3: G-S73 fails on Mb (dup-move trials). G-S73 fails on cb665989 (sync-del-bump), 16/16 on 63492c9a.
- NEW MEDIUM-R5-1: the r3-prescribed guard refuses correct clicks in TWIN-FREE notes when the clicked block swaps/reorders with another block (16/16 refused; cb665989 lands 16/16). Refined guard probed (fix3).
- Gates on 63492c9a: tsc/lint rc 0; jest 7062 passed / 2 skipped + 2 SC-568 timeouts (78/78 alone); lifecycle part 5 3/3 (G-S73 16 trials), part 3 9/9; e2e 249/260 ok, 0 failed, 11 known-bug, 161/161 rc 0; styles.css 4295ca33.
- Evidence: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc480-r3-reviewer/r5/ (+ out/r5-*).

## Real-Obsidian probes on 63492c9a (N=2/cell; RV+LP; leave+stay)
- Twin cells k=2/3: deleted-twin refused 16/16 (1 Notice, byte-identical); twin-free deletion 8/8 1 Notice; race 24/24 land.
- Edges: hand-twin refused 8/8 (outside 9 survives); hand-solo 8/8 1 Notice; dup-move, spaced-del-twin, crlf-del-twin, callout-one-del-lower, cutpaste-twin-near refused 8/8 each.
- Twin-free still landing: cutpaste-solo, moved, long (>400), mdwrap-long, emb, emb-twin, callout, crlf 8/8 each; unterm RV 4/4; unterm-race-twin RV 4/4.
- NEW twin-free shapes, 63492c9a vs cb665989: swap-solo (X and Z swap) REFUSED 8/8 vs lands 8/8; reorder-solo (A,B,X -> X,A,B) REFUSED 8/8 vs lands 8/8; movedel-solo (Z deleted, X moved into its place) refused 8/8 vs lands 8/8.

## MEDIUM-R5-1: `landsOnOtherBlock` refuses correct clicks when the clicked block changes place with a different block
- Where: draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts:963-967 (guard), :1035 (call).
- Cause: mapLine is a minimal Myers diff; every fence line is the same "```ds-counter" text, so the diff pairs X's new fence line with the neighbour's old one; back is not null and not pin.lineStart -> refused, though X is unique and found correctly.
- Jest probe r5guard.test.ts (8 twin-free shapes x 2 section modes): 63492c9a refuses 6/8 (swap-adjacent, move-past-neighbour, move-into-deleted-neighbour, reorder-three, reorder-three-no-prose, replace-neighbour-by-x); cb665989 lands 8/8. r4's "no-twin block cut and pasted elsewhere" test (reading-mode-host-pin.test.ts:416) moves X past prose only.
- Contradicts both CHANGELOGs ("A note with no identical block behaves as before", CHANGELOG.md:16, draw-steel-elements/CHANGELOG.md:30) and the "no new refusal for twin-free shapes" requirement. No wrong-block write, but the click is lost.
- Prescribed fix (probed, scratch r5/src-fix3/): refuse only when the block that stood at `back` when the user clicked is no longer anywhere in the note:
  ```ts
  const back = mapLine(content, pin.text, target.lineStart);
  if (back === null || back === pin.lineStart) return false;
  const other = this.fenceAt(pin.text, back);
  if (!other || this.knownLanguage === null) return true;
  return countByBody(content, this.knownLanguage, other.body) === 0;
  ```
- Candidate: jest 16 write-path suites 586/586 (incl. r4 bumped-neighbour); lands swap, move-past, the two move-and-edit-a-neighbour shapes, both reorders; refuses move-into-deleted-neighbour and replace-neighbour-by-x. Real Obsidian (bundle-fix3): sync-del-bump refused 8/8; swap-solo, reorder-solo, cutpaste-solo land 8/8; movedel-solo refused 8/8; G-S73 16/16.
- By design still refused: movedel-solo and replace-neighbour-by-x leave the same text as "X deleted and Z rewritten to read like X" (= sync-del-bump); text cannot tell them apart. CHANGELOG limits must name them ("if the same outside edit deleted another block and moved this one into its place, the click is refused the same way").
- Known remaining gap: if the bumped neighbour's old body still exists elsewhere (another block reads like it), the candidate lets the write through. Corner case.
- Tests to add: jest swap + reorder land (red on 63492c9a); G-S73 swap-solo trial expecting the write to land.

## LOW-R5-1: jest does not pin the guard's mapping direction or its embed check
- Mutants vs 63492c9a (586 tests): G3 drop fenceAt 1 red; G5 guard off 1 red; G1/G6/G7 survive (equivalent); G4 map forward instead of back SURVIVES (bumped neighbour sits above X at the same line before and after in every fixture); G2 drop partialPins SURVIVES. Mb (drop `now` count) green in jest on 63492c9a (guard also refuses that test); only G-S73 dup-move catches Mb.
- Fix: bumped-neighbour test with a line change above the neighbour so forward and reverse maps disagree (kills G4). partialPins branch may stay untested (F1 DROP).

## INFO
1. CHANGELOGs match measured behaviour except the twin-free claim (MEDIUM-R5-1); LOW-2 (C) sentence matches r3 measurement [5,5] -> card [5,6] -> [5,7]. Needs rewrite after the fix.
2. sync-del-bump path: pin:miss > twinned:false > resolveWriteTarget(search|section) > guard -> miss.
3. Jest SC-568 timeouts unrelated.

# SC-429 fix round 1 report

**Executive summary**
- STATUS: DONE. Branch sc429-minion-pool (draw-steel-elements), rebased onto origin/develop c78a06b with no conflicts (package.json unchanged, no npm ci).
- Commits: 7b3d6f0 (round-1 commit, rebased from c1cc4fe), 8ab5e91 (this round, no trailers). Head 8ab5e91.
- Folded: LOW-1, LOW-2, INFO-2. Dropped per ledger: INFO-1, INFO-4 (workspace CHANGELOG untouched). Main checkout untouched.
- Gates on 8ab5e91: tsc (incl. e2e) clean; lint clean; jest 4806 passed / 1 skipped / 227 of 228 suites (4787 + 14 + 5 new);
  lifecycle 25/25; e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 pairs; shots 572 / 0 FAIL; freeze OK 276/276; parity 0 gaps / 0 undeclared / 24 declared.

## Changes (src/views/MinionStaminaPoolModal.ts)
- LOW-1: SC-430 prediction block in updateActionButton gains the third arm: selectedMinions = checked && !auto count. Test: the P3 sequence (apply 4x4, hand-tick #1-#4, Decrease x4, type 1 with no blur) asserts label / disabled / title are equal before and after the blur and Apply is enabled in the draft.
- LOW-2: Apply Damage handler: clampedMinions = Math.min(alive, Math.max(0, minions)), alive under the same !isDead rule; the clamped value is written back into the box. Tests (3): full squad 1 damage x 9 -> "5 damage will kill 1 minion(s)" and box '5'; 2 dead, 2 x 5 -> "6 damage will kill 1 minion(s)" and box '3'; an in-range count is left as typed.
- INFO-2: updateInfoText damage arm omits " \nSelect N minion(s) to kill." when N is 0. Test: 3 damage -> exactly "3 damage will kill 0 minion(s)."; 8 damage -> two-line text with "Select 2 minion(s) to kill.". Existing T-4 / item-4 assertions used toContain on the first sentence, so none needed changing.
- CHANGELOG bullet reworded to mention the typed-count cap and the dropped "Select 0" sentence.

## Notes
- Lifecycle first attempt on port 9291 exited 2 (port already serving CDP, another session); re-run on 9313 gave 25/25.
- Logs: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc429-minion-pool/sc429-fix1-logs/sc429-gate-<tsc|lint|jest|lifecycle|e2e|shots|freeze|parity>.log

Drive-by fixes: none.
Follow-ups: none new.

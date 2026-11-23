# SC-644 r5 implementer report

## Executive summary
- Verdict: DONE. Three tests-only r4 LOWs folded; rebased; full battery green. No product change (no test exposed a bug). Nothing pushed.
- dse head `2762beb5` on base `10c271fe` (SC-628; develop unchanged at the end). Superproject head `7d8ca778` on base `20004425` (origin/main when fetched): CHANGELOG commit + ONE pointer bump.
- jest (shots cache present): 13349 passed / 1 skipped = fresh baseline 13307/2 -> 13308/1 with cache, + 37 earlier + 4 new. tsc, lint clean.
- e2e: `589/606 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` twice (as expected). A first full run had 2 failures, SET-X03 (file picker never filtered to Settings/token.svg) and its dependent SET-X04, in fields.e2e.ts (not touched by this work; picker typing under load, loadavg 5-8); two reruns green.
- lifecycle 64/64 (21+16+9+4+7+4+3, 0 failed). shots 592, host-leak 163/978, modal 40/240, clip 147 · freeze 280/280 · parity 0/0/24.
- Mutants (all killed): R16 hero stale handle (1 red), R15 hero owner not unloaded (1), R10 `mine` filter dropped (3), R12 `firstControlOf` nested filter dropped (1).

## Tests added (4)
- heroSheet.test.ts: re-render (update) with the setting ON keeps exactly one working Edit definition; 10 flips leave the view's child count flat (kills R16, R15).
- chromeLivePrefs.test.ts: outer Collapse focused with a nested block present -> outer control (kills R10); outer pencil removed with nested present -> outer Collapse (R10); no Collapse left -> first control of the OUTER block (kills R10 and R12).

## Drive-by fixes
None.
## Follow-ups
- e2e SET-X03 picker typing flake under load (one failure in 3 full runs here); not caused by this change.

## Evidence (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r5-impl/)
jest-full.log, e2e.log (the run with SET-X03/X04 red), e2e-b.log, e2e-c.log, shots.log, freeze.log, parity.log, lc-g1.log..lc-g7.log (+ .rc), mut.py, mut.log.

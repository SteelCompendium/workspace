# SC-656 r8 scoped re-review (identity R2), range 57d57a03..d62f0b26

## Executive summary
- Verdict: LAND. Head d62f0b26 (on c4592178). 0 HIGH, 0 MED, 0 LOW defects; 1 INFO (test gap: the wheel clause of the LOW-C condition is pinned by no test).
- Delta = 3 files: view.ts (+6/-3), negotiation-outside-edit.test.ts (+37/-3), architecture.md (1 line). Nothing else.
- LOW-C hunk is candG-input-scope.diff verbatim; the only difference is the comment label (R6 CANDIDATE -> SC-656, wording of both comment lines otherwise identical). "R4 CANDIDATE" is gone (grep of the diff: no CANDIDATE left).
- LOW-D: OE33 exists and pins the silent-handoff no-Notice guard (mutant: drop !o.silent -> OE33 red, alone).
- Probes at head: key / held key in the gap keep focus in RV and LP; pointer in the gap drops in RV (accepted by ruling), keeps in LP; MED-A cases (R0..R3) leave focus on body.
- Mutants: 5 run; 4 killed; M4 (wheel clause removed) survives jest (INFO-1). Scratch test kills it.
- Gates: tsc 0, lint 0, jest 13642 passed / 1 skipped, e2e 646/655 ok 0 failed 9 known-bug 417/417 pairs (no flake), lifecycle part 7 3/3, part 4 3/4 (G-S61 red = SC-668 torn disk read, twice).

## 1. Diff review
- view.ts hunk vs candG-input-scope.diff: identical code line for line (dropOnInput condition `root.isConnected && (evt.type === 'wheel' || !root.contains(evt.target as Node | null))`, registered for pointerdown/keydown/wheel on doc with capture). Differences: the label only ("R6 CANDIDATE:" -> "SC-656:") and the other comment's "R4 CANDIDATE:" -> "SC-656:" (view.ts:181, :188).
- Test file: redraw() gains a 3rd param raw=false passed to mount (used by OE33); OE31, OE32, OE33 added. architecture.md: the windowHandoff row's SC-656 sentence reworded and OE01..OE33.
- Doc accuracy: architecture.md says "dropped by a pointerdown / keydown made OUTSIDE the card while the card is still in the page, and by any wheel while it is": matches the code.

## 2. Probes at head (spec r6probe.e2e.ts copied to scratch dse worktree at d62f0b26, not the branch)
| id | result at head |
|---|---|
| PRB-K-rv-one (one Shift keydown 5 ms after modify) | focus kept: chip 2 of redrawn card, 1 focusin, 0 notices |
| PRB-K-rv-held (key every 20 ms for 400 ms) | focus kept: same chip |
| PRB-K-rv-pointer (pointerdown on body in the gap) | focus on BODY (hand-off dropped; accepted by ruling) |
| PRB-K-lp-one / -held / -pointer | focus kept in all three (LP unaffected) |
| PRB-R0-rv control (blur, rerender, no modify) | BODY |
| PRB-R1-rv own write -> 3.5 s -> blur -> previewMode.rerender | BODY, 0 hand-offs |
| PRB-R2-rv edit above the block -> blur -> rerender | BODY, 0 hand-offs (see note) |
| PRB-R3-rv long note, scroll away, rerender | BODY, 0 hand-offs |
Run: 9/10 ok, 1 "failed": PRB-R2-rv fails only the probe harness's own invariant ("content outside the block bodies changed": the probe edits above the block without exempting the note); its record was written before and shows BODY. Not a product result. One trial each (the ms-gap probes were 4-5 trials in r6; the jsdom tests OE31/OE32 pin the mechanism).
Log: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/probe-head.log, results /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/probe-head.jsonl.

## 3. Mutants (jest file test/dom/elements/negotiation-outside-edit.test.ts, base 35/35 green; scratch worktree dse-r8m, src restored after each: `git status` clean)
| mutant | change | result |
|---|---|---|
| M1 | drop the "target outside the card" operand (`evt.type === 'wheel' \|\| true`) | RED: OE31 only (1 failed, 34 passed) |
| M2 | drop `root.isConnected &&` | RED: OE32 only |
| M3 | windowHandoff.ts: drop `!o.silent` from the Notice condition (Z6) | RED: OE33 only |
| M4 | clear on wheel never (remove `evt.type === 'wheel' \|\|`) | SURVIVES: 35/35 green |
| M5 | old behavior shape: only wheel drops (no key/pointer clear) | RED: OE28 keydown + pointerdown (2 failed) |

## Findings
### INFO-1 — the wheel clause is unpinned (view.ts:189)
OE28's wheel case dispatches on `document`, so its target is never inside the card and the `!root.contains(target)` operand drops it anyway; the `evt.type === 'wheel'` operand matters only for a wheel whose target is inside the card (mouse over the card while scrolling), and no jest or e2e test does that (e2e O13/O14/O18 dispatch the wheel on the scroller). Proof: a scratch jest case (wheel dispatched on the focused chip after the modify, then root removed, re-render with no modify, expect 0 hand-offs / body) passes at head and FAILS under M4 (scratch-head.rc rc=0, scratch-M4.rc rc=1; case lives only in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/dse-r8m, uncommitted). Behaviour is correct at head; this is a missing pin, not a defect. Suggest, if wanted, a 5-line OE case (or a 4th OE28 each-row whose dispatch target is the chip). Owner's call; not blocking.

## 4. Gates at head (implementer worktree, clean status before and after)
- tsc: rc 0 (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/g-tsc.log). lint: rc 0 (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/g-lint.log).
- jest (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/g-jest.log, rc 0): `Test Suites: 1 skipped, 297 passed, 297 of 298 total`; `Tests: 1 skipped, 13642 passed, 13643 total`. Matches r7's 13642 / 1.
- e2e (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/e2e-full.log, rc 0): `OBSIDIAN-E2E done: 646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`. No flake, no re-run needed.
- lifecycle part 7 (`--only=G-S108,G-S112,G-S115`, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/lc-part7.log): `done: 3/3 ok, 0 failed`.
- lifecycle part 4 (`--only=G-S57,G-S62,G-S61,G-S56`, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/lc-part4.log): `done: 3/4 ok, 1 failed`: G-S61 FAIL "(a) ... the recorder's disk read was torn in 6 frames in a row, so its stale-frame check did not run". G-S57, G-S62, G-S56 ok. G-S61 alone re-run (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/lc-s61.log): FAIL again, "(b) ... torn in 4 frames in a row". It is the harness's torn-read condition (SC-668, red on base on this host per the brief), not an assertion about this delta (the delta touches only the negotiation view). I did not re-run it on base.
- Shots/freeze/parity not run: no CSS/kit/static DOM change in the delta.

## Logs and artifacts
Scratch dir: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/
- probe-head.log, probe-head.jsonl, probe-head.rc, probe.sh
- mut-base.log, mut-M1..M5.{log,rc,apply,status}, mut.sh, mutall.sh
- scratch-head.log, scratch-M4.log (INFO-1 scratch case)
- g-tsc.log, g-lint.log, g-jest.log, e2e-full.log, lc-part4.log, lc-part7.log, lc-s61.log
- Scratch worktrees (registered in the implementer's dse repo, detached at d62f0b26, not on the branch): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/dse-r8 (carries the probe spec), /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-R2/dse-r8m (mutants; its test file holds the uncommitted scratch case). Branch untouched: no commit, no push, no rm.

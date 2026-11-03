# SC-472 r7: scoped re-review of the r6 delta (dse `83486f84` on develop `711f740d`, superproject `649374a3`)

## Executive summary
- **Verdict: APPROVE.** HIGH 0 · MEDIUM 0 · LOW 1 (proposal header names the wrong head) · INFO 4.
- **r5 MEDIUM-1 fixed.** Two-tracker probe, head: pin on at the redraw in 3/3 runs, reader ends at the floor 9599. Stock ends at 9663. r4 released early and clamped to 6544.
- **Risk 4 still holds.** Wheel to the end: 7456 -> 6944 (stock 7008). Down then up: 5656 held.
- **No real redraw missed, no pin stuck:**
  - G-S8 adoption on 38 frames; adoption off 1180 ms.
  - G-S42 pinned 3 frames; G-S52 held.
  - Outside writes with a Live Preview sibling: released 50 ms after the sizer is back (1.3-1.5 s here; r4 1.3-2.9 s).
  - A re-arm during a redraw and two writes in flight all held.
  - Leaks after 10 writes: 0.
- **G-S59 (c) at 2.4 s.** Head passes 2/2 runs (pin on at 2405-2482 ms, exact end bound met). The 1 s-delay control FAILs all 3 scrolls. r4 FAILs only the two-tracker scroll.
- **G-S61:** 3/3 ok on head and 3/3 ok on `711f740d` (`--only`, loadavg 2.7-17), plus the part-4 layout ok once on each. r6's (e) FAIL did not reproduce on either build, so drop it.
- **Rebase:** G-S61 and G-S62 are byte-identical to develop. The G-S59 delta is r6's intended edits only. SCENARIOS order is `… G-S57 G-S62 G-S61 G-S59 G-S56`.
- **Gates:**
  - tsc and lint clean.
  - jest 6359 passed / 1 skipped / 252 of 253 suites.
  - Lifecycle G-S8, G-S15, G-S18, G-S42, G-S52 5/5 ok (154 s); G-S59 ok (163 s, 185 s).
  - All on port 9473.

## Environment
- dse `83486f84` (clean) and superproject `649374a3` (` M draw-steel-elements` = the unstaged pointer bump), the same before and after. origin/develop `711f740d`.
- Bundles (`sc472-r7-bundles-summary.log`, main.js sha256 prefix):

| bundle | rev | sha256 | note |
|---|---|---|---|
| head6 | `83486f84` | `2ca030840e3a` | = the tree build |
| base6 | `711f740d` | `1bb511535789` | |
| r4 | `4a9e77fb` | `d496299b8fd7` | |
| prevdelay | `b8f7fcb2` + check `setTimeout(run, 1000)` | `791aa7fbc9c3` | 1 s-delay control |

- Probes: `sc472-r7-probe-block.mjs.txt`, run through the scratch harness copy.
- I deleted only my own two kept dirs, by literal path: `/tmp/dse-obsidian-lifecycle-11j24b` and `-O3CKMr`.

## Findings

### LOW-1: proposal header names r4 as the head
- **Where:** `sc472-dse-verify-proposal.md:3` says "Base: dse `develop` `711f740d` + SC-472 (r4 head, see `sc472-r4-fix-report.md`)".
- **Problem:** the head is r6 `83486f84`, and the numbers in the proposal (jest 6359, five parts, the (c) controls) are r6's.
- **Fix:** "+ SC-472 (r6 head `83486f84`, see `sc472-r6-fix-report.md`)".

### INFO
1. **Two-tracker and Risk 4 probes** (`sc472-r7-two3-{head6,base6}.log`, `sc472-r7-risk4-{head6,base6}.log`). The redraw was held back and let go 0.8-2.1 s after the write, in every row.

| probe | head | stock |
|---|---|---|
| two trackers (3 runs) | pin on at the redraw; 10107-10111 -> 9599 | 10106-10111 -> 9663; 9919 in one run |
| one tracker, wheel to the end | pin on; 7456 -> 6944 | 7456 -> 7008 |
| one tracker, down then up | 5656 held | 5656 held |
| no scroll / small scroll | held | held |

   - The residual drop is the documented floor limit: about 500 px, against the 3.5k px clamp the pin prevents. Head ends 64 px lower than stock because of the padding fix.
   - KNOWN LIMIT (3) (`previewScrollPin.ts:241-245`) now says exactly this and is accurate.

2. **No missed redraw, no stuck pin** (`sc472-r7-lc-5.log`, `-repin-head6.log`, `-cost-{head6,r4}.log`, `-costlife-head6.log`).
   - Lifecycle: G-S8 adoption on 38 frames (r4 38, stock 154); adoption off 1180 ms. G-S15 (a) 38 frames. G-S42 pinned 3 frames per phase. G-S52 all phases held.
   - Outside writes with a Live Preview sibling, measured from the `modify`, against the sizer's recovery:

| build | sizer back at | pin released at |
|---|---|---|
| head | 1275-1414 ms | 1326-1466 ms |
| r4 | 1236-2784 ms | 1288-2861 ms |

     The release follows the redraw in both; the redraw time is the machine. In an earlier head run one outside write took 2.89 s; it was not a backstop release (those take 3.00-3.03 s at 60 frames per second).
   - Re-pin probes (every second write is a separate task):
     - re-pin during the collapse: released 50 ms after the recovery (606 ms);
     - re-pin after the recovery with no redraw following: backstop at 3.0 s;
     - re-pin after the recovery, then a redraw 1.5 s later: released after that redraw (2343 ms), held;
     - two writes 50 ms or 400 ms apart: released about 0.5 s after the last write, held;
     - writes to another note while the redraw is held: pin on at the redraw, held.
   - Never-redrawn writes: 3.00-3.03 s. Afterwards: 0 frame callbacks and 0 DSE timers in 2 s, pins Map 0, holds Map 0, DSE MutationObservers net 0.
   - Navigation (LOW-2 from r3): pin off 19 ms after the navigation; unload and popout close are clean.

3. **G-S59 (c) at the 2.4 s release point.**
   - Head: 2/2 runs ok (`-gs59-head6-2.log`, `-head6-3.log`).
     - The pin was asserted on at 2405 / 2482 / 2439 ms and 2463 / 2461 / 2443 ms.
     - Exact end bound met: 6944 = 7965 - 1021; 5656; 9599.
     - (a) and (b) held in every write, latencies 4.2-16.5 s. No false red, and the throttle is reset before the frame count as r6 described.
   - Margin: the pin is read at most about 80 ms after 2400 (one wait-loop poll). The correct build's backstop cannot fire before 2500 ms + 30 painted frames (about 3.0 s), so a correct build cannot trip the assertion. The "scroll took longer than 2400 ms" guard covers a very slow machine as environment.
   - Controls (`-gs59c-prevdelay.log`, `-gs59c-r4.log`; (c) only, with (a)(b) set to 0 writes and reported vacuous by design):
     - 1 s-delay control: FAIL in all 3 scrolls (pin released 2425-2469 ms after the write);
     - r4: FAIL in "to the second tracker" only.
   - Wording, optional: "no longer moves the note, even if you scroll" (CHANGELOG `:43`) is true against the clamp. A reader who scrolls to the very end of a long note can still end up to about 500 px higher, as on stock (448 px). "No longer jumps" would be exact. Not blocking.

4. **G-S61 (e).**

| build | `--only=G-S61` | loadavg at start | part-4 layout (`G-S57,G-S62,G-S61,G-S56`) |
|---|---|---|---|
| head | ok, ok, ok (97-100 s) | 9.3, 2.7, 4.3 | 4/4 ok (293 s, loadavg 1.9) |
| `711f740d` | ok, ok, ok (97-102 s) | 7.8, 8.8, 17.0 | 4/4 ok (294 s, loadavg 1.4) |

   - The failure did not reproduce on either build: per the ruling, drop it (no ticket).
   - Code check: r6's failure ("3 frames with a card that did not match its block") concerns card content. SC-472's Live Preview holds only set `min-height` on an empty widget, and the pending entry only decides which empty widgets get held, so they cannot put a stale card on screen.

**Rebase resolution** (`git diff 711f740d..83486f84 -- visual-harness/obsidian-lifecycle.mjs`):
- Additions only, apart from 4 comment lines (the TTL wording r2 reworded).
- Hunks: the header (`:124`), fixtures (`:381`), four 2-line comment rewordings, and G-S59 inserted at `:5025-5318`.
- G-S62 (`:4464`) and G-S61 (`:4732`) are untouched.
- `git range-diff` of the r4 commits across the rebase differs only in header context (SC-540 and SC-544 lines).
- r6's harness delta is (c) plus the (a)(b) throttle/ready change and pin-virt2.

**Docs:**
- `previewScrollPin.ts` header and the `redrawStarted` JSDoc state (a)/(c) only, with the r5 numbers.
- KNOWN LIMIT (3) is accurate.
- CHANGELOG has units, "about 1 second longer", and a scroll clause that holds (see INFO-3).
- Proposal: the five-part layout, port note, controls and numbers match my runs; only the header has LOW-1.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
- **Gates:** `sc472-r7-tsc.log`, `sc472-r7-lint.log`, `sc472-r7-jest.log`, `sc472-r7-lc-5.log`, `sc472-r7-gs59-head6-2.log`, `sc472-r7-gs59-head6-3.log`.
- **(c) controls:** `sc472-r7-gs59c-prevdelay.log`, `sc472-r7-gs59c-r4.log`.
- **Probes:**
  - `sc472-r7-risk4-{head6,base6}.log`, `sc472-r7-two3-{head6,base6}.log`;
  - `sc472-r7-repin-head6.log`, `sc472-r7-cost-{head6,r4}.log`, `sc472-r7-costlife-head6.log`.
- **G-S61:** `sc472-r7-gs61-{head,base}-{1,2,3}.log`, `sc472-r7-part4-{head,base}.log`.
- **Tooling:** `sc472-r7-probe-block.mjs.txt`, `sc472-r7-bundles-summary.log`.

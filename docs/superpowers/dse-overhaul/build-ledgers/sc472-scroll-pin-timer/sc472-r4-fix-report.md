# SC-472 r4: fix report (resumed r2 implementer)

## Executive summary
- dse `4a9e77fb` on `sc472-scroll-pin-timer`, rebased onto develop `eafe76e1` (17 commits; r3's findings are 7 of them). Superproject `1db278aa` on `origin/main` `55588e9a` (CHANGELOG conflict resolved, both bullets kept); the dse pointer bump is unstaged.
- Gates on `4a9e77fb`: tsc + lint clean · jest **6338 passed / 1 skipped / 252 of 253 suites** (develop 6287 / 1 / 251 of 252, so +51 tests, +1 suite) · lifecycle **47/47**: 21/21 (182 s) + 16/16 (322 s) + 9/9 (353 s) + G-S59 1/1 (162 s), all on `DSE_LIFECYCLE_PORT=9481` · e2e `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL, button host-leak 161/966 · `freeze OK (280/280 …)` · parity **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)**.
- MEDIUM-1 before/after (G-S59 (c), held `setViewData` + real wheel, unthrottled): the r2 head (`b8f7fcb2`) releases the pin as soon as the scroll takes the tracker's section out of the document, sizer untouched (reader at 7456, pin off; r3 measured 7456 -> 3889; a second scroll, down then up, 5656 -> 4401). The fix keeps the pin on through the late redraw: scroller height stays 7965 (= arm) while the sizer collapses, pin released 0.29-0.40 s after the redraw is let go; the reader ends at 6944 (to the end; stock 7008, same Obsidian re-measure) and 5656 (down then up, unchanged).
- G-S59 discrimination (once each, bundles from `git archive`): fix head ok · `423e798d` base FAIL (a) 3/3 + (b) 3/3 (c passes) · plain-timer control FAIL (a) + (b), (b) 3/3 · `b8f7fcb2` control FAIL (c) only, both scrolls ((a), (b) ok).
- Mutation check: 66 mutations over all guards, all killed, no survivors (`sc472-r4-mutations-final.log`).
- Judgement calls to look at: (1) the (c) pass criterion is "scroller not shorter than at the arm while the sizer is collapsed", not scrollTop equality (see below); (2) LOW-2's note identity comes from the `modify` pin, so a pin() that is never followed by a modify keeps no path.

## Changes (dse, in order)
| sha (rebased) | what |
|---|---|
| d7cdc1d7 | `previewScrollPin.ts`: redraw-start evidence (MEDIUM-1), release on navigation (LOW-2), `takeRecords()` in `arm()` (INFO); `registerFrameworkElements.ts`: `file-open` -> `releaseNavigated()`; 17 jest tests |
| 486d8d3b, fef16d08 | lifecycle G-S59 (c) + fixture `Lifecycle/pin-virt.md` |
| c23581a7 | headers: evidence rule, leaf navigation, KNOWN LIMITS (1) "about 1 s", (3) rewritten, stale TTL wording at the six places r3 listed (LOW-3), pane B numbers replacing "(r3 probes it)" (LOW-4) |
| f07e4486 | lifecycle file header: (c), the plain statement about what discriminates, controls |
| 4a9e77fb | test: evidence (a) skips a disconnected embed (the last mutation survivor) |
Superproject: CHANGELOG bullet reworded (units "scrolled from 2779 px to 2001 px", "about 1 second longer", scrolling during a late redraw, navigation).

### MEDIUM-1: redraw counts as started only with evidence of a re-render
`redrawStarted(scroller, held, records)`: (a) a protected sizer is below its arm-time height (2 px tolerance) and was not already collapsed at the arm (`collapsed0`); (b) an added node is, or contains, a root of ours that was not in `roots0` (from the observer's records); (c) an arm-time root is connected under a parent other than the one it had at the arm (`parents0`; adoption puts it in a new section, virtualisation re-inserts the same cached section). A root removed, disconnected or re-inserted where it was is not evidence. Without evidence the pin waits for the backstop (about 3 s). G-S8 adoption-on still releases early: `adoption on: scrollTop held at 2779 over 37 frames` (r2: 36; stock 154), via evidence (c).
- Jest: virtualisation (remove, re-insert, remove again) stays pinned until the backstop; each of (a), (b), (c) alone releases once the redraw is over; per-signal unit test; a collapse already present at the arm is not evidence; a disconnected embed's collapsed sizer is not evidence. Red without the fix: N6 (a disconnected root counts again) and N6b are killed.
- (c) criterion: while the sizer is collapsed the scroller's `scrollHeight` must not fall below its value at the arm. I first compared scrollTop to the pre-redraw value, which also failed on the fixed build: scrolling to the end reaches sections Obsidian has not measured, the note is taller than the pinned floor, and the page settles 512 px higher (stock 448 px) with the pin on; that is not the clamp (3.5k px). The final position is bounded loosely (1000 px). The gate catches the bug through the pin state and the scroller height, both exact.

### LOW-1 (proposal wording)
`sc472-dse-verify-proposal.md` now states plainly: the 4 s spin is what discriminates (not the 8x throttle), anti-vacuity is met by construction (`BUSY_MS` 4000 > `PIN_TTL_MS` 2500) and only catches a spin that did not run, and G-S59 does not test the busy rules (jest mutation tests do). No new lifecycle control.

### LOW-2: release on navigation
`HeldPin.view` + `path` are recorded when the `modify` pin (`pinReadingViewsOf`) sees the view (the writer's `pin()` knows no view; the following `modify` pin attaches it). A pin is dropped when `view.file.path` differs: in the observer callback, in `sweep()` (every pin call), and on the workspace `file-open` event (`releaseNavigated()`). Tests: next mutation, `releaseNavigated()` (and a view still on the note is kept), a pin call elsewhere, writer pin followed by modify pin, and the `file-open` wiring. Not re-measured in real Obsidian (the r3 probe P3R-LIFE was not rebuilt); G-S8/G-S15/G-S42 and the full lifecycle pass with it.

### INFO: `takeRecords()` in `arm()`
`held.observer?.takeRecords()` before the roots are read. Test: after a re-pin in the same task as a root replacement, `observer.takeRecords()` is empty (red without the call, N9).

## Mutation check (66 mutations, `sc472-r4-mutations-final.log`; the r2 list with the obsolete start-detection mutations replaced by these)
New: N1 evidence (a) removed · N2 (a) counts a sizer collapsed at the arm · N3 (b) removed · N4 (b) ignores an added node that is itself a root · N5 (c) removed · N6 disconnected arm-time root counts · N6b removed/re-inserted arm-time root counts · N7 `parents0` not refreshed · N8 `collapsed0` not computed · N9 `takeRecords` removed · N10 navigation check in the observer removed · N11 in `sweep` removed · N12 `releaseNavigated` releases nothing · N13 modify pin does not attach the view · N14 path not recorded · N15 `file-open` wiring removed · N16 `collapsed()` counts a disconnected sizer. Plus P6 (start detection removed) and every r2 mutation that still applied (B1-B12, P1-P5, P11-P29, L1-L12). Every one is KILLED. The first run had three anchors that no longer matched (fixed) and one survivor (N16), closed by a test.

## G-S59 discrimination (one run each unless noted)
| bundle | rev | result |
|---|---|---|
| fix head | `4a9e77fb` src | ok (gate run: (a) 4.2-11.3 s, (b) 4.5-9.3 s, (c) both scrolls held) |
| base | `423e798d` | FAIL (a) 3/3 and (b) 3/3 writes clamped; (c) ok |
| plain 2.5 s backstop | HEAD + `afterDeadline` fires at once | FAIL (a) (2 clamped, 1 wait timeout) and (b) 3/3; (c) ok |
| first version | `b8f7fcb2` (the r2 head; same bundle sha `d719e745`) | FAIL (c) 2/2 scrolls, 2 runs; (a), (b) ok |
Logs `sc472-r4-gs59-{head-4,prev-2,base-1,plain-1}.log`. Head-1..3 are the runs that shaped the (c) criterion (see above). Before the final criterion the `prev` run `prev-1` had (a)/(b) page errors ("Cannot read properties of undefined") and a (b) timeout: an environment glitch at loadavg 9.6, not repeated in later runs of the same bundle. The base bundle is `423e798d`, not `eafe76e1`: the SC-511 delta touches no pin or hold file (`git diff 423e798d eafe76e1` has no `src/framework/host/preview*` or `livePreview*`), so I did not rebuild it.

## Timing
Lifecycle, port 9481, loadavg 1-12 on 12 cores: part 1 182 s, part 2 322 s, part 3 353 s, G-S59 162 s. All fit a 600 s tool call. G-S59 latencies seen across runs 4.2-20.9 s (cap 30 s).

## Drive-by fixes:
- None.

## Follow-ups:
- Evidence (b) counts any root that is new since the arm: a reader who scrolls a second tracker into view for the first time while a redraw is late, and whose first tracker is virtualised out in the same stretch, can still make the redraw "start" early (documented as KNOWN LIMIT (3); not observed; no real-Obsidian phase for it).
- LOW-2 was not re-measured in real Obsidian (r3's `P3R-LIFE` nav-before-redraw is the probe to re-run in r5).
- G-S59 (c) uses a fixed 300 ms wait after the wheel scroll to give an early release time to happen (the same as r3's probe); a build that releases later than that would pass it.
- The `prev` control's G-S59 run shows the full latency (a) up to 20.9 s: within the 30 s cap but only just on a busy machine.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
`sc472-r4-tsc.log`, `sc472-r4-lint.log`, `sc472-r4-jest.log`, `sc472-r4-lifecycle-part{1,2,3,4}.log`, `sc472-r4-e2e.log`, `sc472-r4-shots.log` / `.rc`, `sc472-r4-freeze.log`, `sc472-r4-parity.log`, `sc472-r4-mutations-{final,fix,fix2}.log` (the first two are partial reruns while the anchors were fixed), `sc472-r4-gs59-*.log`, `sc472-dse-verify-proposal.md`. Scratch tooling: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r4-a01ddb12d6e62735a/` (`mutate.py`, `mkbundle.sh`, `run59.sh`, `ltpart.sh`).

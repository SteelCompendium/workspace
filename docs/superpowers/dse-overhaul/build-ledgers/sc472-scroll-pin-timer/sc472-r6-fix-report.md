# SC-472 r6: fix report (resumed implementer, r5 findings)

## Executive summary
- dse `83486f84` on `sc472-scroll-pin-timer`, rebased onto develop `711f740d` (22 commits; the r6 ones are 4). Superproject `649374a3` on `origin/main` (rebased clean); the dse pointer bump is unstaged.
- Gates on `83486f84`: tsc + lint clean · jest **6359 passed / 1 skipped / 252 of 253 suites** (develop 6307 / 1 / 251 of 252, so +52 tests, +1 suite) · lifecycle **49/49** in five parts, each on its own port: 21/21 (185 s, :9481) + 16/16 (320 s, :9482) + 7/7 (241 s, :9483) + 4/4 (294 s, :9484) + G-S59 1/1 (163 s, :9485) · e2e `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL, button host-leak 161/966 · `freeze OK (280/280 …)` · parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- MEDIUM-1 (r5): evidence (b) is dropped. Form shipped: **(b) removed entirely, not the narrow form**; the remaining evidence is (a) a sizer collapse and (c) adoption re-insert. No redrawn write waits for the backstop (pin life with and without (b) below). The two-tracker case holds: 10111 held through the collapse (end 9599 = arm-time floor), where `4a9e77fb` released the pin before the redraw.
- G-S59 discrimination (once each, final harness): fix head ok · `eafe76e1` base FAIL (a) 3/3 + (b) 3/3 · plain-timer FAIL (a) 3/3 + (b) 3/3 · `b8f7fcb2` FAIL (c) all 3 scrolls · `4a9e77fb` FAIL (c) two-tracker only · 1 s-delay control FAIL (c) all 3 scrolls.
- Mutation check: 65 mutations, all killed, no survivors.
- Two reruns after environmental failures, see "Reruns".

## What changed
| commit (rebased) | what |
|---|---|
| (src+tests) | `previewScrollPin.ts`: `redrawStarted(scroller, held)` has only (a) and (c); the `records` parameter and the fresh-root test are gone. A `collapsed0` key is dropped once its sizer is back, so a collapse after the recovery counts (needed now that (b) cannot start a re-armed pin). Header: evidence paragraph rewritten, KNOWN LIMIT (3) now says what is true (the floor is the arm-time height; scrolling into unmeasured sections can end up to about 500 px higher: -512 px here, -448 px on stock; a first render does not start the redraw). Jest: the (b) tests are replaced by "a second tracker scrolled into view is NOT a redraw", "a fresh root with the sizer untouched is not evidence", the per-signal test lost its (b) rows, and the re-pin tests use a real second collapse. |
| (harness) | G-S59 (c): see below. New fixture `Lifecycle/pin-virt2.md` (10 paragraphs, T1, 80 paragraphs, T2, 20 paragraphs). |
| (harness) | header counts 49 scenarios |
Rebase notes: three harness commits conflicted at the same place each time (G-S62 / G-S61 bodies against the G-S59 body; kept both and restored the `}, }, {` between them). G-S59 sits after G-S61 and before G-S56.

### Evidence (b): pin life with and without it (`sc472-r6-life-{r4head,nob}.log`, r1 probe block, unloaded, 2 reps)
Redrawn writes: Reading + Live Preview sibling 1.24-1.41 s with (b), 1.20-1.72 s without; adoption-off click 0.83-0.99 s / 0.54-0.70 s; Reading host outside write 0.34-0.48 s / 0.24-0.37 s; outside write on a note with a single tracker 0.48-0.61 s / 0.47-0.54 s; adopted click similar. The ~3 s entries (a write nothing redraws) are the same in both. No redrawn write waited for the backstop, so the narrow form was not needed. G-S8 adoption-on: held 38 frames (r4: 37; stock 154); adoption off 1115 ms. G-S15, G-S42, G-S52 (re-run on the rebased head) and G-S59 (a)(b) ok.

### G-S59 (c) changes (r5 LOW-1/2/3 and the two-tracker variant)
- The redraw is let go at write + `PIN_TTL_MS - 100` = 2.4 s (r5 said ~2.2 s; a correct build is pinned until 2.5 s + 30 frames, and 2.4 s leaves more room on a busy machine). Before that the test asserts the scroll ended and the pin is on at that moment. Scroll steps are 600 px x 10 (and -600 x 3), 16 ms apart, so the scroll fits the window; a scroll that does not fit is reported as environment.
- Third scroll "to the second tracker" on `pin-virt2.md`: the reader is parked 1500 px into T1, T1's malice is written from outside, the pane's `setViewData` is held, 4 wheel events of 3000 px bring T2 in, then the redraw is let go. It FAILs on `4a9e77fb` ("the pin was released before the late redraw (2272 ms after the write), when the reader's scroll drew a second tracker").
- End bound `stEnd >= min(position before the redraw, sh0 - clientHeight) - 2` (r5 LOW-3): head ends at exactly 6944 / 5656 / 9599.
- LOW-2 (1): the throttle is reset as soon as released + redrawn + mounted, then the 10 frames are counted unthrottled. LOW-2 (2): wait for the tracker to be drawn before parking each (c) variant.
- Gate run: (c) pin on 2.42-2.48 s after the write, collapse held, released 0.29-1.1 s after the redraw was let go.

## Discrimination detail (logs `sc472-r6-gs59-final-*.log`, `sc472-r6-gs59-*.log`)
| bundle | rev | result |
|---|---|---|
| fix head | `83486f84` | ok (gate run, `sc472-r6-lifecycle-part5.log`; also `sc472-r6-gs59-head-1.log` before the last harness tweaks) |
| base | `eafe76e1` | FAIL (a) 3/3, (b) 3/3 clamped; (c) ok |
| plain | HEAD, `afterDeadline` fires at once | FAIL (a) 3/3, (b) 3/3; (c) ok |
| first version | `b8f7fcb2` | FAIL (c) x3; (a)(b) ok |
| r4 version | `4a9e77fb` | FAIL (c) two-tracker only; the other two scrolls ok |
| 1 s delay | `b8f7fcb2` + check after 1 s | FAIL (c) x3 |
The base bundle is `eafe76e1`, not `711f740d`; `git diff` between them touches no pin or hold file.

## Mutation check (`sc472-r6-mutations-final.log`, 65 mutations, all KILLED)
The r4 list with N3, N4 and N6b (evidence (b) mutants) removed because the code is gone, plus N17 (collapse after the sizer recovered is not new: `collapsed0` never shrinks) and N18 (a root new since the arm counts again, the r5 bug). All B1-B12, P1-P29, N1, N2, N5-N16, L1-L12 still applied and are killed.

## Reruns
- G-S61 (SC-544's scenario, phase (e), LP callouts) FAILed once in part 4 at loadavg 5.9 ("wrong cards on screen - 0 frame(s) of 128 with a pending edit …", `sc472-r6-lifecycle-part4-run1-FAIL.log`, shot `sc472-r6-gs61-run1-FAIL.png`); the same part passed 4/4 on the immediate rerun. G-S61 does not touch Reading pins or the backstop; I report it as a flake, not as a SC-472 issue.
- e2e: the first run of the final head had a WDIO `before all` hook timeout in `conditions-pick-focus` (125/128, COND-E02/E03/E07 did not run; machine busy, shots had just started). The rerun on a quiet machine: 128/128, 89/89 (`sc472-r6-e2e-run1-hookfail.log` is the failed one).
- Earlier in the round: the `prev` control once failed (a)/(b) with page errors and a (b) timeout at loadavg 9.6 and passed on re-run; a delay-control run reported "not the geometry under test" because a 26-step scroll took 2.4 s (fixed by the shorter scroll).

## Drive-by fixes:
- None.

## Follow-ups:
- G-S61 (e) flaked once under load (above); worth a look by SC-544's owner if it recurs.
- Evidence-based redraw start waits for (a) or (c): a hypothetical Obsidian redraw that neither collapses the sizer nor re-parents an adopted root would wait for the backstop (about 3 s, cannot clamp). Not observed.
- The pin's floor never rises to content measured during the hold (optional improvement from r5 LOW-3: raise it in the observer); left alone, documented in KNOWN LIMIT (3).

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/`)
`sc472-r6-tsc.log`, `sc472-r6-lint.log`, `sc472-r6-jest.log`, `sc472-r6-lifecycle-part{1,2,3,4,5}.log` (+ `part4-run1-FAIL`), `sc472-r6-e2e.log` (+ `-run1-hookfail`), `sc472-r6-shots.log` / `.rc`, `sc472-r6-freeze.log`, `sc472-r6-parity.log`, `sc472-r6-mutations-final.log`, `sc472-r6-gs59-*.log`, `sc472-r6-life-{r4head,nob}.log`, `sc472-dse-verify-proposal.md` (five-part layout and times, (c) description, controls). Scratch tooling: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r4-a01ddb12d6e62735a/` (`mutate.py`, `mkbundle.sh`, `run59-r6.sh`, `ltpart-r6p.sh`, `life.sh`, `sum59.py`).

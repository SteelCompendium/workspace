# SC-561 dse-verify proposal (SKILL.md not edited)
Source: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` at the time of writing. Every `OLD` below was checked to occur exactly once in that file (the rows and paragraphs are single very long lines, so each edit is a substring replacement). Historical `PREVIOUS ...` blocks near the end of the file mention the 8x throttle only as dated history and stay as they are, except the one sentence of item 10. The rest of the `Current expected numbers` block needs no change: lifecycle 52/52 in five parts 21 + 16 + 9 + 4 + 2, jest 6492 / 1 skipped / 257 of 258, e2e 128/128 + 89/89, shots 592 / host-leak 163/978 / capture clip 147, freeze 280/280, parity 0/0/24 are all unchanged by SC-561 (harness only; `main.js` and `styles.css` byte-identical, sha256 `7aa1638e…` / `16e9aa64…`).
Measured new part-5 timing: `G-S59 G-S49` 207 s (loadavg 5-15); G-S59 alone 119-121 s at loadavg 4-8 (3 runs), 158-164 s with 8 busy loops running (loadavg 18-52, 5 runs).

## 1. Row 4, part-5 timing

OLD:

````
`G-S59 G-S49` (2; G-S59 alone was 156 s; SC-520 added G-S49, which sits after G-S59 and before G-S56 in SCENARIOS order), measured at SC-472 r8 (loadavg 1-8, 12 cores);
````

NEW:

````
`G-S59 G-S49` (2; 207 s at SC-561 at loadavg 5-15; G-S59 alone about 120 s at loadavg 4-8 and about 160 s with 8 busy loops running at loadavg 20-50 (it was 156 s at SC-472 r8 and 160-240 s at SC-561 r1 before its 8x CPU throttle was taken out, SC-561); SC-520 added G-S49, which sits after G-S59 and before G-S56 in SCENARIOS order), the other parts measured at SC-472 r8 (loadavg 1-8, 12 cores);
````

## 2. Row 4, G-S52 paragraph, pointer to G-S59 (b)

OLD:

````
(G-S59 (b) covers the late redraw under throttle)
````

NEW:

````
(G-S59 (b) covers the late redraw, made late by a 4 s busy main thread)
````

## 3. G-S59 paragraph, "What discriminates" point (1)

OLD:

````
(1) For (a) and (b) it is the 4 s busy spin, not the 8x CPU throttle: right after each write a `modify` listener spins `performance.now()` for 4 s (a slow handler of another plugin), so the redraw starts later than `PIN_TTL_MS` whatever order Obsidian's panes handle the write in. At 1x throttle with the spin the build before SC-472 and the plain-timer control still FAIL 6/6 writes and the shipped build passes (86 s instead of 173 s); at 1x without the spin both phases FAIL as vacuous (latencies 0.05-1.2 s). The 8x throttle stays as ruled (it adds the real cost of the other pane's redraw) but is not what separates the builds. Under the throttle alone phase (b)'s embed redraw came 0.4 s after the write in some runs and 12 s in others (Obsidian's pane order), which made the phase vacuous one run in five. 
````

NEW:

````
(1) For (a) and (b) the lateness comes only from the 4 s busy spin: right after each write a `modify` listener spins `performance.now()` for 4 s (a slow handler of another plugin), so the redraw starts later than `PIN_TTL_MS` whatever order Obsidian's panes handle the write in. There is NO CPU throttle (SC-561 took out the CDP 8x throttle SC-472 had added: each write costs about 2 s of real style and layout work in Obsidian, which the throttle stretched to 14-20 s at idle against the 30 s cap and past it under load, so the scenario failed with "timed out waiting for the pin or hold released and the tracker redrawn"; do not add one back). Without the throttle the write -> redraw latency is 4.0-7.2 s and the whole wait 5.4-10.1 s at loadavg 4-50, against the 30 s cap. With the spin the build before SC-472 (`367a2f1d`) and the plain-timer control still FAIL 3 of 3 writes in each of (a) and (b), and the shipped build passes (about 120 s); without the spin both phases FAIL as vacuous (latencies 0.05-1.2 s). Under a throttle alone phase (b)'s embed redraw came 0.4 s after the write in some runs and 12 s in others (Obsidian's pane order), which made the phase vacuous one run in five. 
````

## 4. G-S59 paragraph, phases (a)/(b) throttle clause

OLD:

````
CDP `Emulation.setCPUThrottlingRate` 8x around the write only (reset once the pin / hold is released, the tracker replaced and a mounted one is back, so the last 10 frames are counted unthrottled; reset in a `finally` too): (a)
````

NEW:

````
no CPU throttle, only the busy spin (the busy listener is removed in a `finally`): (a)
````

## 5. G-S59 paragraph, observed latency

OLD:

````
(observed 4.2-20.9 s)
````

NEW:

````
(observed 4.0-7.2 s; the wait after each write, to the 10th frame after the release, is printed too: 5.4-10.1 s at loadavg 4-50, against the 30 s cap of each wait)
````

## 6. G-S59 paragraph, phase (c) opening

OLD:

````
Phase (c), unthrottled, no spin: the pane's `setViewData` is held back
````

NEW:

````
Phase (c), no spin: the pane's `setViewData` is held back
````

## 7. G-S59 paragraph, phase (c) real wheel steps

OLD:

````
real CDP wheel scrolls, then the redraw is let go
````

NEW:

````
real CDP wheel scrolls (two large steps each: 2 x 3000, down then up 2 x 3000 and -1800, second tracker 2 x 6000: every wheel step makes Obsidian render the sections it passes, so ten small steps took 2-4 s at load), then the redraw is let go
````

## 8. G-S59 paragraph, environment verdict of (c)

OLD:

````
A scroll that takes longer than 2.4 s is reported as environment (re-run): a correct build may then let go from its backstop.
````

NEW:

````
A scroll that takes longer than 2.4 s is environment, not a verdict (a correct build may then let go from its backstop), so that attempt is discarded (its recorder is stopped, not awaited, and its held redraw is let go; a scroll of 3 s or more finds the correct build's backstop already released, so the recorder would not finish for 40 s) and the variant is re-run, at most twice; only that precondition alone can trigger a re-run and the product assertions run on the valid attempt (the output names a discarded attempt; three too-slow attempts in a row FAIL with the environment message, also when the pin was already released: proved with a real 3.5 s delay on every attempt, no 30 s timeout). Measured at SC-561: scroll 0.1-2.4 s (worst: the second tracker's first mount, 2.38 s at loadavg 29 and 2.33 s at 32 with 8 busy loops), no attempt needed a re-run in 8 runs on the r2 harness and in 5 runs on the r4 harness; the reviewer saw 1 organic re-run in 6 runs (2682 ms, loadavg 45-62, it recovered). Proof of the re-run with a real delay (SC-561 r4, a scratch copy that sleeps 3.5 s after the wheels on the first attempt): all three variants discard (3.6-4.6 s, pin already off in two of them), re-run and pass.
````

## 9. G-S59 paragraph, last sentences (control provenance and the load note)

OLD:

````
A 10 s plain timer is NOT a gate control: it escapes about 42 % of runs. A timeout of the 30 s wait under heavy machine load is environment: check `/proc/loadavg` and re-run.
````

NEW:

````
A 10 s plain timer is NOT a gate control: it escapes about 42 % of runs. Re-measured without the throttle at SC-561 (once each, bundle via `DSE_LIFECYCLE_BUNDLE`): `367a2f1d` and the plain-timer control FAIL (a) 3/3 and (b) 3/3 writes (clamped scrollTop); `b8f7fcb2` FAILs (c) in all three scrolls ("the pin was released before the late redraw") and passes (a) and (b); at SC-561 r3 the `4a9e77fb` control still FAILs (c) "to the second tracker" only and `b8f7fcb2` with its check delayed by 1 s still FAILs (c) in all three scrolls. Neither commit is in the repo's object store any more: `b8f7fcb2` survives only as a bundle with main.js sha256 `d719e745…` (SC-472 r4 scratch, `bundles/prev`) and `4a9e77fb` only as `sc472-r3-a5a83f0e5db8b6abf/bundles/r4` (main.js sha256 `d496299b8fd7…`); archive them if the controls must outlive the session. A timeout of one of the 30 s waits is no longer a load symptom (waits are 5.4-10.1 s at loadavg up to 50, SC-561; the (c) re-run no longer waits on its recorder): treat it as a finding.
````

## 10. Current expected numbers (SKILL.md:1302), the SC-520 entry

OLD:

````
G-S59 timed out once in a part-5 re-run and passed on the next (SC-561, also on `develop`).
````

NEW:

````
G-S59 timed out once in a part-5 re-run and passed on the next (SC-561, also on `develop`); fixed by SC-561: the 8x CPU throttle was taken out of G-S59 and phase (c)'s environment check re-runs a too-slow scroll.
````

# SC-561 r1 diagnosis report: the G-S59 "pin or hold released and the tracker redrawn" timeout

## Executive summary
- **Root cause:** a harness artefact. G-S59 throttles the page's CPU 8x (CDP) for the whole wait. Each write costs about 1.6-2.1 s of main-thread style and layout work at 1x, which becomes 13-17 s at 8x, on top of the scenario's own 4 s busy spin. At idle the wait already takes 14-20 s against a 30 s cap. Load on this 6-core/12-thread laptop CPU stretches that past 30 s. The plugin is not at fault: no redraw is dropped or deferred, and the pin or hold is released within one frame of the redraw.
- **Class: (a), harness/scenario only.** No plugin change is recommended.
- **Fix:** drop the 8x CPU throttle around G-S59's writes (`obsidian-lifecycle.mjs:6019/6040/6050/6057`) and keep the 4 s spin as the only lateness source. Measured with the throttle off, the wait is 5.5-9.4 s at load 6-35. Both SC-472 controls still FAIL (a)+(b) on 6 of 6 writes each. Lifecycle stays 52 scenarios.
- **Repro:** stock config, 5 valid runs: 3 pass (load 1.4-18), 2 FAIL (load 11-26).
  - `stock-load3` reproduced the exact ticket message on 4 of 6 writes, with no synthetic load (only other efforts' gates).
  - The FAILs also show 2 CDP `Runtime.evaluate` 30 s timeouts and 3 hold clamps in (b): the plugin's 20 s hard cap fired before a redraw that came 21-28 s late, which happens only under 8x plus heavy load.
- **Second load flake, separate from the ticket's message:** G-S59 (c)'s own environment check ("the scroll took N ms, past the 2400 ms") failed in 6 of 12 runs at load 8 or more. (c) is never throttled, so dropping the throttle does not fix it. A bounded retry did not rescue it at load 21-35. The owner should fold a fix or ticket it (options in §4).
- **Scott decision needed: none.** Dropping the throttle reverses an SC-472 **owner** ruling ("G-S59 under CDP 8x throttle"), not a Scott ruling. That is owner judgment.

Base: dse `6270e84a` (= origin/develop after `git fetch`, unchanged), Obsidian 1.15.1, i7-8750H (6C/12T, laptop turbo). Scratch: `$R = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r1-diag-q7m3`.

## 1. What G-S59 does, and which wait timed out

All references are to `visual-harness/obsidian-lifecycle.mjs` at 6270e84a.

- `:6018-6022`: `PIN_TTL_MS 2500`, `RATE = 8`, `WRITES = 3`, `BUSY_MS = 4000`, `CAP_MS = 30000`.
- **Phase (a)** (`:6125`): tall.md is open in Reading pane A and Live Preview pane B. Both are parked inside the 25-hero tracker, and A is observed.
- **Phase (b)** (`:6169`): a Live Preview host `lpembhostend.md` is parked at its end, embedding `lpembtracker.md`. A Reading pane C shows the tracker note.
- **Per write** (`phase` `:6076`; `throttledWrite` `:6037`):
  1. Park the panes and tag the observed tracker root.
  2. `record()` (`:6035`) starts an in-page recorder `window.__gs59`. A MutationObserver stamps `redrawAt` when the tagged root leaves the document. A **requestAnimationFrame `tick`** samples scrollTop and the pin/hold attribute. It sets `released` once the attribute was seen on and is now off. It sets `ready` only **inside a frame** in which `released && redrawAt !== null && mounted()`.
  3. `throttle(8)` (`:6040`), via CDP `Emulation.setCPUThrottlingRate`.
  4. Register a `modify` listener that spins the main thread for 4 s, starting at `setTimeout 0` (`:6044`).
  5. `vault.process` writes `value: N` (`:6045`).
  6. **The wait that timed out** (`:6049`): `t.waitFor('window.__gs59 && (window.__gs59.ready || window.__gs59.done)', 'the pin or hold released and the tracker redrawn (...)', CAP_MS=30000)`. `waitFor` (`:728`) polls with `Runtime.evaluate` every 80 ms. Each `Runtime.evaluate` has its own 30 s CDP timeout (`Cdp.call`, `:610`): that is the "Runtime.evaluate: timed out after 30000 ms" variant.
  7. Then `throttle(1)` (`:6050`), and a wait for 10 more frames (`:6051`).
  8. Then the checks (`:6062-6072`): the write landed, scrollTop is identical in every frame, the pin is on at the redraw, then released, and the tracker is redrawn.
- **Anti-vacuity** (`:6104`): each phase needs at least one write whose redraw comes more than 2.5 s after the write. The 4 s spin guarantees that.
- **Phase (c)** (`:6219-6285`, never throttled): the pane's `setViewData` is held. Real CDP wheels scroll the reader. The redraw is let go at write + 2400 ms. The environment check at `:6260` requires the scroll to end before that.

The SC-520 r5 FAIL state fits this. It was `redrawAt 4378`, `released true`, `ready true`, `afterDone 1`, `frames 12` at `atMs 31943`. The redraw came at 4.4 s, but the recorder saw it as ready only about 32 s after the write, because only 12 frames were painted in 32 s.

## 2. Where the multi-second write -> redraw latency comes from

I instrumented a **private copy** of the harness. The patcher is `$R/patch-instr.py`, and the output is `$R/harness/visual-harness/obsidian-lifecycle-sc561.mjs`, run with the worktree's built `main.js` via `DSE_LIFECYCLE_BUNDLE`. Nothing was written to the branch. Per write, the copy records:
- harness timings and poll round-trips;
- every painted frame;
- the exact pin/hold attribute transitions, via a MutationObserver;
- `mountedAt`, the busy-spin start and end, and DSE roots added;
- CDP `Performance.getMetrics` deltas (style, layout, script, task);
- optionally a CPU profile.

The summary tools are `$R/summ-sc561.py`, `$R/prof-sc561.py` and `$R/prof-callers-sc561.py`.

**The cost of one write at 1x, no spin** (`$R/instr-r1b0css.jsonl`, `$R/instr-r1b0prof*.cpuprofile`, load 2.4-3.9):

| | (a) tall.md, 2 panes | (b) lpembtracker, host + Reading |
|---|---|---|
| tracker replaced (redrawAt) | 723-855 ms | 51-112 ms |
| pin/hold released | 1300-1947 ms | 85-208 ms |
| main-thread task time | 1581-2067 ms | 905-1233 ms |
| style recalc / layout | 606-923 / 708-887 ms (18 / 16 passes) | 301-433 / 469-631 ms |
| script (all) | 58-87 ms | 38-54 ms |

- In the CPU profile, DSE code is about 50-72 ms inclusive per write (`buildUI`/`buildCharacterRow`).
- The dominant self time is forced style and layout inside Obsidian and CodeMirror:
  - CodeMirror's `DOMObserver.flush -> readSelectionRange -> eq`: 703 ms;
  - Obsidian's Reading-view `measureSection`: 252-643 ms;
  - the recorder's own `tick`, which reads scrollTop: 280 ms.
- With DSE's stylesheet disabled (`$R/instr-r1b0nocss.jsonl`), layout drops to 39-61 ms and style recalc stays at about 0.8 s.

**This is design plus the throttle, not a defect.** Stock config at idle (`$R/instr-idle1.jsonl`, load 1.5-3.3):
- the spin ends at about 4.0 s;
- the throttled redraw starts at 4.5-12.9 s;
- the tracker is mounted at 5.0-17.2 s;
- the pin/hold is released at 5.0-19.5 s;
- the harness sees "ready" at 13.8-20.0 s.

The release always follows the mount within about 1 frame. That is `previewScrollPin.ts:588`, `scheduleCheck`, one rAF after the mutation once `redrawDone`.

At 8x, frames are 4-35 s apart:
- `instr-idle1`: maximum gap 8.6 s;
- `instr-b6run1`: 12.7 s;
- `instr-b6run2`: 35.3 s.

Single `Runtime.evaluate` polls block for up to 17.8 s (`pollMax`), because the renderer's main thread is 100% busy: task time is about equal to wall time for the whole wait. On top of that, the frame-gated `ready` lags the real release by up to 12.7 s (b6run1) and 15.1 s (b6run2).

**Not a harness polling artefact alone.** An event-driven `ready`, plus a throttle reset as soon as `redrawAt` is seen (variant V2, `$R/instr-v2run1.*`, load 11-26), still FAILed:
- the poll that should reset the throttle was itself stuck for 21-45 s;
- (a) write 1 clamped 2779 -> 2001;
- (b) clamped 3 of 3 writes.

**No plugin defect found.**
- Every write was redrawn. No redraw was dropped or recovered later by an unrelated event.
- Releases are redraw-driven.
- The only plugin-side misbehaviour seen is the designed 20 s hard cap. `redrawBackstop.ts:26` (`PIN_HARD_CAP_MS = 20000`) and `:48` release the hold before a redraw that arrives more than 20 s after the write. Seen in (b): b6run2 2 of 3 writes and stock-load3 1 of 3, with redraw at 21-28 s, release at 19.4-21.0 s, and scrollTop 7486 -> 3745.
- That only happens when the main thread is starved for more than 20 s, which takes 8x CDP throttle plus load of about 18-26. SC-472 accepted that limit (r1 ruling: "hard cap 20 s"). Nothing indicates a real Obsidian user can reach it.

## 3. Reproduction (one run per Bash call, foreground)

"Stock" means the unmodified scenario, either `npm run obsidian-lifecycle -- --only=G-S59` or the instrumented copy with the stock settings. Load is `/proc/loadavg` 1-min at each write. "b6/b8/b12" means N synthetic `bash` busy loops, killed by literal PID afterwards.

| run | config | load | result | (a)/(b) write -> ready seen | notes |
|---|---|---|---|---|---|
| `stock-idle1.log` | stock npm | 1.4-1.5 | **ok** | (not instrumented) | redraw 4.2-10.5 s |
| `instr-idle1` | stock | 1.5-3.3 | **ok** | 13.8-20.0 s | frame gaps up to 8.6 s |
| `instr-b6run1` | stock, b6 | 5.4-18.1 | **ok** | 17.1-27.7 s | 2.3 s from the cap |
| `instr-b6run2` | stock, b6 | 17.6-26.2 | **FAIL** | 26.6-38.5 s | 1 eval timeout, 1 recorder 40 s timeout, (b) 2 clamps (hard cap), (c) env 2652 ms |
| `stock-load3.log` | stock npm, no synthetic load | 11-21 | **FAIL** | n/a | **exact ticket message** on (a) w1 and (b) w1-w3, 2 eval timeouts, (b) w3 clamp |
| `instr-v2run1` | V2 (event-ready + unthrottle at redraw) | 10.9-26.0 | FAIL | 22.2-45.8 s | (a) 1 clamp, (b) 3 clamps, 1 eval timeout |
| `instr-v1run1` | **V1 (no throttle)** | 7.2-9.8 | (a)(b) ok; (c) env 2895 ms | 5.8-8.1 s | |
| `instr-v1run2` | V1 | 6.0-8.9 | **ok** | 5.5-6.9 s | |
| `instr-v1b8run1` | V1, b8 | 12.0-19.8 | (a)(b) ok; (c) env 2454 ms | 6.0-8.1 s | |
| `instr-v1b12run1` | V1, b12 | 23.9-25.1 | (a)(b) ok; (c) env 2676, 2476 ms | 6.6-9.3 s | |
| `instr-fixb12run1` | V1 + (c) retry ≤2, b12 | 21.2-35.5 | (a)(b) ok; (c) env after retries | 7.0-9.4 s | (c) scroll 2187-5753 ms over 8 attempts |
| `instr-v1base1` | V1, **control**: develop `367a2f1d` (pre-SC-472) | 8.4-10.9 | **FAIL (a)+(b) 6/6 clamps** | | released 4.0 s, redraw 4.1-5.9 s |
| `instr-v1plain1` | V1, **control**: head with the backstop reduced to a plain 2.5 s timer | 8.3-10.0 | **FAIL (a)+(b) 6/6 clamps** | | released 4.0 s, redraw 4.2-5.9 s |
| `instr-r1b0css`, `-prof`, `-nocss` | 1x, no spin (cost probes) | 2.4-14.8 | vacuous (expected) | | metrics above |

`stock-load2.log` is invalid: my own `timeout 175` sent it SIGTERM. It is excluded from the counts.

Stock tally: 5 valid runs, 3 pass and 2 FAIL. The FAILs were at load 11-26. The ticket's single FAIL was at load about 5; at 8x, b6run1 at load 5-18 already used 27.7 of 30 s. With V1, (a)/(b) passed 30 of 30 writes at load 6-35, with a worst wait of 9.4 s. Anti-vacuity holds: every V1 redraw came at 4.07-6.98 s, more than 2.5 s after the write.

## 4. Recommended fix: class (a), harness/scenario only

**Fix 1 (the ticket).** Edit G-S59 in `visual-harness/obsidian-lifecycle.mjs`:
- Remove the CDP throttle around the writes: `RATE` `:6019`, `throttle(RATE)` `:6040`, the `throttle(1)` calls `:6050`/`:6057`, and the 10-frames comment at `:6047-6048`.
- Keep `BUSY_MS = 4000` as the only source of the late redraw. The SC-472 header already says "the spin, not the throttle, is what makes stock fail". The r1-r2 runs that motivated the throttle (embed redraw 0.4 s or 12 s) predate the spin.
- Keep `CAP_MS = 30000`: the worst measured wait is 9.4 s, more than 3x headroom.
- Update the scenario header `:132-145` ("CPU throttled 8x through CDP …") and the comment block `:6005-6015`.
- Update the result string `:6295` (`CPU throttled ${RATE}x …`).
- Optional, low value once the throttle is gone: decide `ready` in the recorder's MutationObserver instead of only in a rAF tick (prototype in `patch-instr.py` §6). It removes up to 2.3 s of frame lag at load 24.

**Proof the change keeps G-S59's teeth**, for the implementer round to re-run on the real edit:
- (i) G-S59 head passes repeatedly under synthetic load (for example 3 runs with 8 busy loops). Expect (a)/(b) waits of about 6-9 s.
- (ii) Control `367a2f1d` bundle FAILs (a)+(b). Measured: 6 of 6 clamps.
- (iii) Plain-2.5 s-timer control FAILs (a)+(b). Measured: 6 of 6. Build recipe: `$R/build-bundles.sh`, which reuses the SC-472 r1 `variant.sh` substitutions.
- (iv) A no-spin run is vacuous.
- SC-472's third control, the `b8f7fcb2` "any removal counts" version, concerns (c) only, which is untouched.

**Gate numbers:**
- Lifecycle stays **52/52**. No new scenario; G-S67 is not needed.
- G-S59 alone takes about 130-150 s instead of about 160-240 s.
- jest, e2e, shots, freeze and parity are untouched: harness only, `main.js` byte-identical.
- The dse-verify row-4 G-S59 description ("CPU throttled 8x") changes. Per the ledger this goes as a proposal file, not a SKILL.md edit.

**Fix 2 (secondary: G-S59 (c) environment verdict).** (c)'s scroll is real CDP wheels. Each dispatch is acknowledged only after the renderer has handled the event, including Obsidian virtualising sections and the second tracker's first mount. Measured:
- `setViewData` is reached 26-122 ms after the write;
- the scroll ends 2187-5753 ms after the write at load 21-35, against a fixed 2400 ms budget (`GO_AT`, `:6223`; check `:6260`).

Options, in order of value. They need measurement in the implementer round; I measured only the retry, which did not rescue load 21-35:
- (a) Fewer and larger wheel steps for "to the end" and "down then up" (10x600 -> 2x3000; bigger jumps skip rendering the intermediate sections). Fewer steps for "to the second tracker".
- (b) Compute the wheel centre before the write instead of after it (`:6246`).
- (c) Re-run a variant at most twice when only the environment precondition failed. This is safe: the product assertions run only on attempts whose environment was valid.

Leave `GO_AT` as is: it must stay below `PIN_TTL_MS` to keep its meaning. The owner can fold this into SC-561 or file a Backlog ticket.

## 5. Decisions needed

- **Scott: none.** No user-facing plugin defect was found. The 20 s hard-cap clamp needs more than 20 s of main-thread starvation, which only the 8x CDP throttle plus heavy load produced.
- **Owner:**
  - Fix 1 reverses SC-472's owner ruling "Lifecycle: new G-S59 under CDP 8x throttle". The measurements above show the controls still discriminate without it.
  - Fold Fix 2 into SC-561 or ticket it.
- **Optional INFO, not a defect:** with DSE's stylesheet, each layout pass of the two-pane tracker note costs about 45-55 ms (16 passes per write) against about 3 ms without it. A possible perf Backlog item; it is not needed for SC-561. Caveat: an unstyled tracker is not an equal-work baseline.

## Hygiene
- Worktree superproject and dse `git status --porcelain`: clean before and after; HEAD is `6270e84a`.
- Ignored artefacts now present in the worktree dse: `node_modules/` from `npm ci` (the fresh worktree had none, so the build failed), `.devbox/`, `main.js`, `main.css`, `styles.css`. The owner's implementer needs them anyway.
- The harness kept 12 `/tmp/dse-obsidian-lifecycle-*` FAIL dirs from my runs. Each path came from my own logs and was removed by literal path, after copying 2 FAIL shots (post-teardown frames, low value) to `$R/shots/`.
- All busy loops were killed by literal PID; `busy-pids.txt` is empty.
- No tracker access. SKILL.md not edited.

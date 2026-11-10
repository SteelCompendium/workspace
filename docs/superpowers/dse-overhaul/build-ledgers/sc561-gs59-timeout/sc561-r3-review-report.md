# SC-561 r3 review report: G-S59 fix (d344e1e1), independent adversarial review (R3)

## Executive summary
- **Verdict: FIX FIRST.** One HIGH, in the new phase (c) retry code. Everything else holds.
- **Findings:** HIGH 1, MEDIUM 0, LOW 1, INFO 4.
- **HIGH-1:** a discarded (c) attempt whose scroll took 3 s or more hangs, so G-S59 FAILs. In that case a correct build's backstop has already released the pin, the recorder never reaches `done`, and the wait times out at 30 s with "timed out waiting for (c) …: the discarded attempt 1 finished". Reproduced 3 of 3 variants with a real 3.5 s scroll. The retry recovers only scrolls of 2.4-3.0 s. One of my loaded runs hit 2682 ms organically (load 45-62). A tested fix is below.
- **Teeth intact** against the NEW harness; each control FAILs in its target phase: `367a2f1d` (rebuilt, `1bb51153…`) (a) 3/3 + (b) 3/3; plain timer (rebuilt, `e2a04a8c…`) (a) 3/3 + (b) 3/3; `b8f7fcb2` (`d719e745…`, verified) (c) 3/3; `4a9e77fb` (`d496299b…`) (c) "second tracker" only; `b8f7fcb2` + 1 s delay (`791aa7fb…`) (c) 3/3.
- **Re-runs (head):** G-S59 alone 6 of 6 ok (2 idle at load 4.6-7.0, 4 with 8 busy loops at load 8-62); worst wait 8967 ms against the 30 s cap; worst (c) scroll 1982 ms, after 1 organic discard at 2682 ms. Lifecycle part 5 2/2 ok (180 s), part 4 4/4 ok (312 s).
- **Byte-identity and diff:** main.js `7aa1638e…` and styles.css `16e9aa64…` are identical for 6270e84a, d344e1e1 and the worktree. Throttle fully removed; 52 scenarios in the same order, G-S56 last. origin/develop is still `6270e84a`; the worktree is untouched (clean, HEAD `d344e1e1`).

Scratch: `$S = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r3-review-k4zp`.
- All runs used a `git archive d344e1e1` tree in `$S/ref-d344e1e1`, with node_modules symlinked and its own built main.js (identical to the worktree's).
- Each run had a private `DSE_CAMERA_TMP`, one run per Bash call, and no `DSE_LIFECYCLE_PORT`.

## Findings

### HIGH-1: the (c) retry hangs exactly when the scroll is slow enough for the backstop to have let go
**Where:**
- `visual-harness/obsidian-lifecycle.mjs:6274-6275`, the discard branch: `goAt` is set, the redraw is let go, then `t.waitFor('window.__gs59c.done', … CAP_MS)`.
- The recorder at `:6254`:
  - `st.pinOff = st.goAt === null ? -1 : …`;
  - `afterDone` increments only when `st.pinOff >= 0`;
  - otherwise `done` comes only from the 40 s self-stop, counted from the first frame (about the arm).

**Mechanism:**
- A correct build holds the pin until `PIN_TTL_MS` (2.5 s) plus 30 painted frames, the last 2 quiet: about 3.0 s at idle, later under load.
- If the scroll ends after that, the pin is already off before `goAt` is set, so `pinOff = -1`.
- The discarded attempt then never sets `done` before about 40 s after the arm. The wait starts at about 3.5 s, so its 30 s cap expires first.
- The variant is pushed to `fails`, and G-S59 FAILs with a message that does not say "environment". Each such variant also adds 30 s.
- r2's forced-retry proof (`SC561_FORCE`, `clog-force1/2.log`) forced the branch on scrolls of 120-1764 ms, while the pin was still on. It never exercised this path. The `a24952a2` fix (`goAt` set) covers only the pin-still-on case.

**Evidence** (probe = a scratch copy of the head harness with phases (a)/(b) skipped and `t.sleep(R3_SLOW)` after the wheels on attempt 0 only; patch `$S/patch-slow.py`):
- `R3_SLOW=3500` (`$S/log-probe-slow3500.log`, load 4.3/3.3): all three variants discarded at 3597-3995 ms with state `{"pinOn":true,"pinOff":-1,"pinNow":false}`.
  - Result: `G-S59 FAIL: timed out waiting for (c) scroll to the end: the discarded attempt 1 finished | … down then up … | … second tracker …`.
  - Screenshot: `$S/probe-slow3500-FAIL.png`.
- `R3_SLOW=2300` (`$S/log-probe-slow2300.log`): discards at 2414, 2969 and 2492 ms, pin still on. All recovered, G-S59 ok. So the retry works only for scrolls of about 2.4-3.0 s.

**Reachability:**
- `$S/log-load4.log` (8 busy loops, load 45→62): an organic discard at 2682 ms ("second tracker"), which recovered.
- r2's own (c) measurements reached 2898 ms (load 13-17) and 3335 ms (load 23) with the new steps (`c-a8x1`, `c-b8x1`).
- r1 saw 2187-5753 ms at load 21-35 with the old steps.

So the slow-scroll regime that OWNER-2 asked to make reliable still fails, now as an unlabelled 30 s timeout.

**Prescribed fix**, tested; patch `$S/patch-fix.py`, harness `$S/ref-d344e1e1/visual-harness/obsidian-lifecycle-r3fix.mjs`:
- The discarded attempt stops its own recorder instead of waiting for it.
- In the recorder's `tick`, start with `if (st.abort) { st.done = true; mo.disconnect(); return; }`.
- Replace the discard branch's two calls with `await t.ev('(() => { window.__gs59c.abort = true; if (window.__gs59go) { try { window.__gs59go(); } catch {} } window.__gs59go = null; return true; })()')` and `continue`. The next attempt's `t.reset` and its pin-gone wait already settle the let-go redraw.

Fix results:
- Head with `R3_SLOW=3500`: discards at 3603-4019 ms, then all three variants pass. `$S/log-fixprobe-slow3500.log`, ok.
- `b8f7fcb2` with the fix and `R3_SLOW=3500`: still FAILs (c). `$S/log-fixprobe-b8f7-slow3500.log`:
  - "to the end" and "down then up" fail with the product message ("the pin was released before the late redraw");
  - "second tracker" fails as "timed out waiting for … the second tracker was drawn" (anti-vacuity), not the product message.
  - Still red, so not masked. The fixer may want to check whether a fresh `open` is needed between attempts so the retried attempt reports the product message.

Re-prove the fix with a real delay of at least 3.5 s (backstop released), not with a forced condition.

### LOW-1: proposal items 8 and 9 assert behaviour that HIGH-1 contradicts, and the proposal leaves two controls unconfirmed
`sc561-dse-verify-proposal.md`:
- **Item 8 NEW** says "three too-slow attempts in a row FAIL with the environment message". A too-slow attempt whose pin was already let go FAILs with "the discarded attempt N finished" instead.
- **Item 9 NEW** says "A timeout of one of the 30 s waits is no longer a load symptom … treat it as a finding". Today the discard timeout is a load symptom.
- Both become accurate once HIGH-1 is fixed.

Also update or add:
- **Item 8:** "no attempt needed a re-run in 8 runs". Add: 1 organic re-run in my 6 runs (2682 ms, load 45-62, `$S/log-load4.log`).
- **Item 9:** re-measured without the throttle at SC-561 r3, the `4a9e77fb` control still FAILs (c) "to the second tracker" only, and `b8f7fcb2` plus the 1 s delay still FAILs (c) in all three. The SKILL.md control sentences stay true.
  - `4a9e77fb` is also gone from the object store. Its bundle is `sc472-r3-a5a83f0e5db8b6abf/bundles/r4` (main.js sha256 `d496299b8fd7…`), just as `b8f7fcb2` survives only as `d719e745…`. Item 9 should name both bundles' hashes.
- **The proposal's "Current expected numbers block needs no change":** that block (SKILL.md:1302) still says "G-S59 timed out once in a part-5 re-run and passed on the next (SC-561, also on `develop`)". That sentence should say SC-561 fixed it, when the dispatcher writes the landing entry.

**Coverage otherwise complete.** Applying the 9 OLD→NEW pairs to the current SKILL.md is clean: each OLD occurs exactly once. After that, every remaining G-S59, "throttl" or "8x" mention in row 4 is either SC-561's own new text or a part-order note. The measured timing in item 1 (about 120 s idle, about 160 s loaded) matches my runs (118-119 s idle, 145-186 s loaded).

### INFO-1: block comment numbers
`obsidian-lifecycle.mjs:6010-6012` gives r1's "5.5-9.4 s at load 6-35". r2 measured up to 10.07 s, and I measured up to 8.97 s. The text is accurate as r1's measurement, so no action is needed. Result string `:6314` and header `:133-147` are accurate; G-S59 alone took 118-119 s idle and 145-186 s loaded.

### INFO-2: the `367a2f1d` control also FAILed (c) at load 58
In `$S/log-ctl-367a.log` (load 58.6→37.7), the control also failed (c) "to the end" ("the pin was not on when the sizer collapsed") and "second tracker". SKILL.md says "(c) passes on the pre-SC-472 build", which holds only at lower load (r2 measured (c) ok at load 5-11). This does not affect the verdict: (c) is not the phase this control targets.

### INFO-3: control naming
SKILL.md names the pre-SC-472 control `eafe76e1` ("the pin and hold files are identical at `711f740d`"). r1, r2 and the proposal use `367a2f1d`. Its rebuilt main.js `1bb51153578959d0…` is byte-identical to SC-472 r3's `711f740d` bundle (`base6`), so the two are consistent.

### INFO-4: no masking by the retry
- Product assertions run only after `break`, which requires `scrolledBy < GO_AT`.
- `window.__gs59c` is a fresh recorder per attempt.
- An exhausted retry is still pushed to `fails`, so the gate stays red.
- Larger wheel steps did not let any control pass (all five FAIL as targeted).
- The only mislabel risk is HIGH-1's timeout. `previewScrollPin.ts:223` (8x measurement history) was DROPPED in OWNER-5, so it is not re-raised here.

## 1. Reliability re-runs (head harness, `node visual-harness/obsidian-lifecycle.mjs --only=G-S59`)
| run | load start → end (1-min) | result | (a)/(b) worst wait (ms) | (c) scroll end / down-up / second (ms) | duration |
|---|---|---|---|---|---|
| idle1 | 6.95 → 4.96 | ok | 6857 | 202 / 575 / 993 | 119 s |
| idle2 | 4.63 → 5.37 | ok | 6166 | 123 / 572 / 1439 | 118 s |
| load1 (8 busy) | 8.17 → 20.32 | ok | 7375 | 226 / 1010 / 1692 | 149 s |
| load2 (8 busy) | 16.97 → 20.96 | ok | 7592 | 323 / 491 / 1762 | 145 s |
| load3 (8 busy) | 19.69 → 44.53 | ok | 8261 | 551 / 1152 / 1480 | 159 s |
| load4 (8 busy) | 45.05 → 61.85 | ok | 8967 | 370 / 1188 / 1982, after 1 discarded attempt at 2682 ms | 186 s |

Write → redraw ranged 4061-6216 ms. Every redraw came after 2.5 s, so anti-vacuity held. Logs: `$S/log-{idle1,idle2,load1,load2,load3,load4}.log`. Busy PIDs are in `$S/busy-load*.txt`; all were killed by literal PID after a cmdline tag check, and none remain.

## 2. Controls (head harness, `DSE_LIFECYCLE_BUNDLE`, no synthetic load; ambient load from other efforts)
| control | bundle (main.js sha256) | load | result | log / shot |
|---|---|---|---|---|
| `367a2f1d` pre-SC-472, rebuilt | `$S/ref-367a2f1d` (`1bb51153…`) | 58.6 → 37.7 | FAIL (a) w1-3 2779 → 2001, (b) w1-3 7486 → 3745; (c) also failed (INFO-2) | `log-ctl-367a.log`, `ctl-367a-FAIL.png` |
| plain 2.5 s timer, rebuilt (d344e1e1 + `afterDeadline` returns `done()` at once) | `$S/ref-plain` (`e2a04a8c…`) | 38.8 → 26.8 | FAIL (a) 3/3, (b) 3/3; (c) ok | `log-ctl-plain.log`, `ctl-plain-FAIL.png` |
| `b8f7fcb2` "any removal counts" | `sc472-r4-a01ddb12d6e62735a/bundles/prev` (`d719e7458267aebf…`, verified) | 22.5 → 9.2 | FAIL (c) 3/3 (released 2430 / 2440 / 4235 ms); (a)(b) ok | `log-ctl-b8f7.log`, `ctl-b8f7-FAIL.png` |
| `4a9e77fb` (r4: a root new since the arm also counts) | `sc472-r3-a5a83f0e5db8b6abf/bundles/r4` (`d496299b…`) | 9.7 → 6.3 | FAIL (c) "second tracker" only (2480 ms); the rest ok | `log-ctl-4a9e.log`, `ctl-4a9e-FAIL.png` |
| `b8f7fcb2` + 1 s delayed check | `sc472-r4-a01ddb12d6e62735a/bundles/delay6` (`791aa7fb…`) | 5.9 → 4.9 | FAIL (c) 3/3 (2413 / 2439 / 2428 ms); (a)(b) ok | `log-ctl-delay.log`, `ctl-delay-FAIL.png` |

## 3. Diff correctness
`git diff 6270e84a..d344e1e1` (`$S/diff.patch`) touches only `visual-harness/obsidian-lifecycle.mjs`, +68/-49.
- `setCPUThrottlingRate` count: 1 → 0.
- `RATE`, `throttle()`, both `throttle(1)` calls and the 10-frames comment are gone; `throttledWrite` is now `busyWrite`.
- The only remaining "throttle" words are SC-561's own explanatory comments (`:134`, `:6010`, `:6038`, `:6045`, `:6314`). The "6x throttle" at `:1828` belongs to G-S8 (SC-459 history).
- SCENARIOS: 52 ids, identical order base vs head (`cmp` of the id lists), G-S59 → G-S49 → G-S56 last.
- No other scenario is touched.
- `GO_AT` is unchanged (`PIN_TTL_MS - 100`).

## 4. Byte-identity
`git archive` builds in `$S/ref-6270e84a` and `$S/ref-d344e1e1`, and the worktree's own main.js, all give:
- main.js `7aa1638e68682b0f323df0689492be66b4170bb6eba2b1ed5de06af03b00f01c`;
- styles.css `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04`.

Build script: `$S/build-all.sh`; log: `$S/build-all.log`.

## 5. Gates
- **Part 5** `G-S59 G-S49`: `OBSIDIAN-LIFECYCLE done: 2/2 ok, 0 failed`, rc 0, 180 s, load 3.65 → 3.58 (`$S/gate-lc5.log`).
- **Part 4** `G-S57 G-S62 G-S61 G-S56`: `OBSIDIAN-LIFECYCLE done: 4/4 ok, 0 failed`, rc 0, 312 s, load 3.46 → 4.96 (`$S/gate-lc4.log`).
- **r2 battery logs, spot-checked** in `sc561-r2-impl-9Jgy/` against expected:
  - tsc and lint rc 0;
  - jest3 `Tests: 1 skipped, 6492 passed` / `257 of 258`;
  - lc1-lc5: 21/21, 16/16, 9/9, 4/4, 2/2 (52/52);
  - e2e2: `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`;
  - shots: 592 `ok` lines, the one "FAIL" word is a self-test OK line, `button host-leak OK (163 … 978 …)`, `capture clip OK (147`;
  - freeze: `freeze OK (280/280 …)`;
  - parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- r2 used no skip rule. I also found none in SKILL.md, so no quote needed checking.

## 6. Hygiene
- Worktree: `git status --porcelain` is empty before and after, HEAD `d344e1e1`, worktree main.js unchanged. The superproject worktree shows only its pre-existing ` M draw-steel-elements` pointer.
- Every kept `/tmp/dse-obsidian-lifecycle-*` FAIL dir from my runs was copied (shot) and removed by literal path: `0XDRHt WPpWVA qIleaU XsmhXN CSwFdF 6on1oM TeE809`.
- No tracker access. SKILL.md and the freeze baseline were not edited.
- Deviation, not by choice: the Bash tool moved 4 calls that ran longer than 180 s to the background on its own: loaded run 4, the 367a2f1d control, the plain control and lifecycle part 4. Each was still one foreground-issued call. I waited for its completion notice and started nothing else that runs Obsidian meanwhile.

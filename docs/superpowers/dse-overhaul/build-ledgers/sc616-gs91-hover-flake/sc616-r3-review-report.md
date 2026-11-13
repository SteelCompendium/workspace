# SC-616 r3: independent adversarial review of the G-S91 harness fix (reviewer)

## Executive summary
- **Verdict: LAND** on dse `33dd0a1b` (branch `sc616-gs91-hover-flake`, on develop `1516f894`). Findings: 0 HIGH, 0 MEDIUM, 1 LOW, 6 INFO.
- **Not vacuous.** The SC-598-reverted bundle (my own build from `1516f894`) failed 6 of 6 trials in every run: 2 of 2 runs unthrottled, plus 1 run at 4x CPU and 1 at 8x. Every failure was a product failure (preview gone, or source editor plus focus in the preview), and no retry fired.
- **Mutants: no regression in what the trial catches.** Five `focusHoverPreviewNow` mutants were each run against the old harness (`1516f894`) and the new one (`33dd0a1b`). Each was caught by the same trials in both: no synthetic click, no `preventDefault`, a synthetic click 20 ms late, R14 reverted, class removed at 0 ms. No mutant was caught by the old harness and missed by the new one.
- **Flake gone on the head.** G-S91 passed 13 of 13 natural runs with no retry: 6 sequential runs, 6 runs 3 at a time, and lifecycle part 5 (7/7, 393 s). `gapEnd` was 23-107 ms.
- **Under CPU throttle:**
  - 4x CPU: 2 of 2 runs green. One retry fired on its own (`gapEnd` 174) and the trial passed on the next attempt (122).
  - 6x CPU: 0 of 1. The title trials used up both re-runs and FAILed with the gate message only. That is the designed "inconclusive" failure (O2), not a product failure.
- **The 11 ms ordering, the `gapEnd` gate and the retry are sound.** Probing found no way to make the gate pass on a vacuous trial, and no way to make the retry re-run or hide a product failure.
- **Byte identity:** `main.js` `338e7315…ad34c` and `styles.css` `a6c57131…5167`. They match across the worktree, my `git archive 1516f894` build and my `git archive 33dd0a1b` build, so shots, freeze and parity carry.
- **LOW-1 is in the SKILL proposal only:** the rationale for "do not lengthen the hold" is wrong. Trees: dse is clean at `33dd0a1b`, and the superproject shows only ` M draw-steel-elements`, the same as before I started.

## 0. Setup
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`, dse HEAD `33dd0a1b`.
  - `git status --porcelain` before and after: dse empty; superproject ` M draw-steel-elements` (the unstaged pointer; unchanged).
  - Nothing was committed, and nothing in the worktree was edited.
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r3-rv/`.
  - Bundles are `git archive` exports with `node_modules` symlinked, built with `node esbuild.config.mjs production`.
  - The probe harness is a scratch copy: the `33dd0a1b` archive's `visual-harness/obsidian-lifecycle.mjs`, plus env-gated `SC616_CPU` (CDP `Emulation.setCPUThrottlingRate` from the hover to +700 ms) and `SC616_GATE` (the gate threshold). It is in `sc616-r3-probe-cpu-gate.diff.txt`.
- **How each harness was run:**
  - "New" = the worktree's harness, with `DSE_LIFECYCLE_BUNDLE` set for a scratch bundle.
  - "Old" = the `1516f894` archive's own harness on its own (mutant) bundle.
- Obsidian 1.15.1, G-S91 alone about 50 s per run. Load average was 1.3-15 during the batches (other agents were running lifecycles at times).
- I deleted the 19 FAIL temp dirs my runs kept, by literal path.

## 1. Not vacuous: base and mutants (old harness vs new)
Mutant diffs: `sc616-r3-mutants.diff.txt`. Logs: `sc616-r3-b1.log`, `sc616-r3-b2.log`, `sc616-r3-b4.log`.

| Bundle (`managedModal.ts` on `1516f894`) | New harness (33dd0a1b): red trials | Old harness (1516f894): red trials | Same catch set? |
|---|---|---|---|
| base598rev: SC-598's product diff reversed | 2 of 2 runs, all 6: title rv/lp, dblq rv/lp, apply = "preview gone"; reopen = "source editor" + "focus in the preview". Also 4x CPU (1 run) and 8x CPU (1 run), all 6 | (r1/r2: all 6) | yes |
| M1: no synthetic click | title rv, title lp, dblq rv, dblq lp, apply rv (preview gone); reopen rv (error: modal did not open) | identical | yes |
| M2: no `preventDefault` (non-editing branch) | title rv, title lp, dblq rv, dblq lp (source editor) | identical | yes |
| M3: synthetic click 20 ms late (class off at 40 ms) | 3 of 3 runs red: apply rv every run, title rv 2 of 3. One run's title lp had gapEnd 193 + source editor, and was not retried | 2 of 2 runs red: apply rv, title rv every run, dblq lp in 1 | yes (red every run in both) |
| M4: R14 reverted (`.is-editing` branch without `preventDefault`) | reopen rv (source editor + focus in the preview) | identical | yes |
| M5: `interactive-child` removed at 0 ms (before the helper's callback) | dblq rv, dblq lp (source editor) | identical | yes |

Why M3 is still caught:
- M3 is the one mutant whose timing the 11 ms hold could have covered for: a product that focuses the preview later than the helper's 10 ms.
- The hold gives no cover once the helper's timer is armed after the harness's 11 ms timer, so the ordering no longer favours the product.
- G-S91 alone stays red on it every run.
- A mutant that delays the focus by only a few ms (well below anything a person could do) would pass both harnesses some of the time. It is effectively equivalent.

## 2. The 11 ms release
Sound. The checks:
- **Ordering.**
  - The helper's 10 ms timer is armed inside the opening click's dispatch, by DSE's synthetic click from its window-bubble listener.
  - The harness's 11 ms timer is armed by a `Runtime.evaluate` that runs after that dispatch has finished. The p2 evaluation before it already needed the open modal.
  - So the harness timer is armed strictly later, with a longer delay. Its due time is strictly later.
  - Both are `window.setTimeout` timers on the same main window, at nesting level 0, with delays of at least 4 ms. So there is no clamping, and they share a task queue that runs delayed tasks in due-time, then sequence, order.
  - A late wake-up runs both, in order. `t.ev` awaits the promise (`awaitPromise: true`, obsidian-lifecycle.mjs:964), so the release is sent only after the timer has fired.
- **Re-open path.** An `.is-editing` preview gets no synthetic click, so there is no 10 ms helper timer, and the hold does nothing there (INFO-2).
  - `reopen` still tests what it must: the 150 ms editor switch of the base and of M4.
  - The mousedown moves the focus well before 150 ms: gapEnd 24-40 ms on the head, and red on base and M4.
- **Mousedown before the helper's timer.** With the hold, the second mousedown usually lands before the helper's 10 ms callback.
  - The modal sits outside the preview's embed container, so the helper's container listeners never see it.
  - r1's natural failing timeline shows a detail-1 mousedown handled at +79.1 and the helper still focusing at +83.1.
  - M5, where the editor test runs after that mousedown with no class protection, is caught by exactly the same trials as before.
  - The order (press, helper, release) is the one a real press held for 11 ms or more produces.
- **Slow host.** A late 11 ms timer only adds to `gapEnd`. The gate turns that into "inconclusive" and then a retry. It never turns it into a false pass. Measured:
  - 4x CPU: gapEnd 85-132 on passing attempts, one attempt at 174, which was re-run;
  - 6x: 158-203, which exhausted the re-runs.

## 3. The `gapEnd` gate
- **The correct reference point.** The window-bubble `end` mark for the opening click is taken after the helper armed the base's 150 ms timer at the embed container (r1: both at +62.1).
  - So on the base, that timer is due no later than end + 150. `gapEnd < 140` means the second click came at least 10 ms before the base could focus the preview.
  - The base stays red at 4x and 8x CPU.
- **Cannot pass vacuously.** If the opening click's window bubble were never reached, there would be no trusted `end` entry. The second click's own window bubble cannot supply one, because DSE's document guard stops it. So `gapEnd` is `null`, and the gate FAILs; it does not pass.
- The head runs recorded gaps from the start of up to 169 ms (seq-6: `title rv` 169 / `gapEnd` 107, `title lp` 158 / 106). The old start-based gate would have FAILed both. The new gate passes them correctly.

## 4. The retry
- **A product failure is never re-run.**
  - Forced gate of 10 ms on the base (`b4-base-gate10`): every non-dblq trial carried the gate message AND a product failure, no `re-run` text, FAIL.
  - Natural case, M3 run 1: `title lp` gapEnd 193 + source editor, not re-run.
- **It fires when it should.** Head at 4x CPU, run 2: `title rv (re-run 1x, the host was too slow to prove anything: 174 ms …)`, then passed at 122.
- **It fails loudly when exhausted.** Head at 6x CPU: `title rv (re-run 2x … 187, 178 ms …)` and `title lp (re-run 2x … 203, 158 ms …)` FAILed with the gate message alone.
- **It cannot mask a failure.** An attempt is re-run only when its judged list is exactly the gate message (obsidian-lifecycle.mjs:8393), so a pass always needs an attempt that is conclusive and clean.
- **Every attempt starts from fresh state** (read):
  - `t.reset` rewrites both fixtures from `FIXTURES` (:981), which undoes `apply`'s `current_stamina: 18`;
  - `K.openHost` / `K.hover` / `window.__gs91 = []` redo the trial's setup;
  - `K.cleanup` runs in `finally`.
- **Cost.** At most 8 extra trials of about 7 s each, so worst-case part 5 is about 450 s, against the 393 s measured. The cpu6 run took 84 s against about 50 s.

## 5. Flake gone: head runs (`sc616-r3-b3.log`, `-b4.log`, `-b5.log`, `-b6.log`)

| Batch | Result | `gapEnd` (title / apply / reopen) | Retries |
|---|---|---|---|
| 6 sequential, G-S91 alone, load 1.3-5.6 | 6 of 6 ok | 23-107 (seq-6: title rv 107, title lp 106) | 0 |
| 2 rounds × 3 concurrent, load 1.6-1.8 at start | 6 of 6 ok | 24-69 | 0 |
| Lifecycle part 5 (`G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`) | `done: 7/7 ok`, 393 s | 24-41 | 0 |
| 4x CPU (probe harness, head bundle) | 2 of 2 ok | 85-132 | 1 (174 → pass) |
| 6x CPU | 0 of 1: title rv / lp FAIL with the gate message only, after 2 re-runs each; apply, reopen and dblq passed | apply 95, reopen 114; title 158-203 | 4 |

Natural: 13 of 13 green, 0 retries. The ticket's failure form ("preview gone") did not appear in any head run, throttled ones included.

## 6. Findings

### LOW-1: SKILL proposal §3 gives the wrong reason not to lengthen the hold
- **Where:** `sc616-dse-verify-proposal.md:33`, the last sentence: "do not lengthen it past about 11 ms: on the base the helper's timer is 150 ms, so a short hold keeps the trial red there".
- **Failure scenario:** a longer hold does not turn the base green. Any release after 150 ms shows up as `gapEnd ≥ 140`, and the gate catches it. The real cost is headroom on the head: every ms of hold is added to `gapEnd`.
  - Measured here: it already reaches 121-174 ms at 4x CPU, and 158-203 ms at 6x, where the trial FAILs inconclusive.
  - A future agent who believes the stated reason may judge a 30 ms hold "still red on base, so fine". It is, but it pushes ordinary loaded hosts into retries and inconclusive FAILs.
- **Fix:** reword it to: "Do not lengthen it: the hold is part of `gapEnd`, which must stay under 140 ms (at 4x CPU it already reaches about 120-175 ms, at 6x the title trials exhaust their re-runs); a longer hold only makes the trial inconclusive sooner, it never turns the base green (the gate catches a late release)."
- Optionally add the r3 data point to the §1 bullet: "at 6x CPU throttle the title trials FAIL inconclusive after their re-runs; at 4x a re-run fires now and then and passes."

### INFO-1: an inconclusive FAIL is still possible on a very slow host (by design, O2)
At 6x CPU, G-S91 FAILs with the gate message only. This matches O2, and the proposal's "except an inconclusive gap that survived two re-runs … free the host and re-run" covers it. No action, beyond LOW-1's optional data point.

### INFO-2: the hold does nothing for `reopen`, but the comments imply a 10 ms helper timer for it
- **Where:** obsidian-lifecycle.mjs:1799 (JSDoc: "title / apply / reopen release …") and :1864-1867 ("Obsidian's helper timer for SC-598's synthetic click (10 ms …)").
- An `.is-editing` preview gets no synthetic click, so for `reopen` there is no 10 ms timer to wait for. That trial tests the 150 ms editor switch. It is harmless; M4 is caught.
- **Optional clause at :1867:** "(reopen: the preview is already focused, no synthetic click; the hold changes nothing there)".

### INFO-3: the install comment says the helper armed "its timer just before" the `end` mark
- **Where:** obsidian-lifecycle.mjs:1839.
- That is true of the base's 150 ms timer, which is the one the gate is about. On the head, the 10 ms timer is armed just AFTER the mark: DSE's window-bubble listener runs after the harness's install-once listener (r1 timeline: `bub:click` +62.1, `arm10` +62.2).
- No effect on the gate. Optionally: "the helper armed its timer for this click just before".

### INFO-4: the "preview gone" message prints only `gap` from the start
- **Where:** obsidian-lifecycle.mjs:8370.
- Under throttle on the base (`b4-base-cpu4`), the FAIL line does not say whether that attempt was conclusive.
- Optional fix: print `gapEnd` there too, as the ok line does.

### INFO-5 (optional headroom)
- Arm the 11 ms timer inside the p2 evaluation, which already runs after the opening dispatch, so the order still holds. For example, store `window.__gs91rel = new Promise(...)` there and `await t.ev('window.__gs91rel')` before the release.
- This removes about 11 ms plus one CDP round trip from `gapEnd`, which matters most under throttle.
- Not required. The trade-off: the press may then have no hold, but only when the helper had already run before the mousedown, which still tests SC-598's promise.

### INFO-6: proposal §1 understates the base result
- "every non-dblq trial 'preview gone' or 'source editor'": in fact all 6 trials, dblq included, are red on the base (r1, r2, and r3's 4 runs).
- Optional: "every trial (title, apply, dblq: preview gone; reopen: source editor)".

Checked and accurate:
- The proposal's numbers: 15 natural runs = 11 + 4, 13 alone + 2 part 5, `gapEnd` 23-69, 16 of 20 and 2 of 17.
- The SKILL line anchors 30 / 182 / 475 / 477, which still hold on the current workspace main.
- The header (:184-185), JSDoc (:1799-1800), press (:1864-1867) and scenario (:8348-8349) comments, apart from INFO-2 and INFO-3.
- There is no bracketed ticket id in any title, and G-S91 stays in part 5 before G-S56.

## 7. Byte identity (`sc616-r3-builds-and-mutants.log`)
- `git archive 1516f894` build: `main.js` `338e7315f502248a6c3ab034a844baaa3ca25f6dc5cf4aeaf9bc257f665ad34c`, `styles.css` `a6c57131ab692a3c0d13135369fbe67cbbff6081385d0009d0c6bb4203405167`.
- `git archive 33dd0a1b` build: identical.
- The worktree's `main.js` / `styles.css` (used by every head run): identical.
- `git diff 1516f894..33dd0a1b` touches only `visual-harness/obsidian-lifecycle.mjs` (59+/33-). So shots, freeze and parity carry.

## 8. Artifacts (this directory)
- `sc616-r3-review-report.md`: this report.
- `sc616-r3-b1.log`: base598rev ×2, and M1 / M2, each with the new and the old harness.
- `sc616-r3-b2.log`: M3 (new ×3, old ×2), and M4 / M5 (new and old).
- `sc616-r3-b3.log`: head, 6 sequential runs.
- `sc616-r3-b4.log`: head at 4x (×2) and 6x CPU; base at 4x and 8x CPU; base with a forced 10 ms gate.
- `sc616-r3-b5.log`: head, 2 rounds of 3 concurrent runs.
- `sc616-r3-b6.log`: part 5 on the head.
- `sc616-r3-run-index.txt`: one line per run, with rc and wall time.
- `sc616-r3-builds-and-mutants.log`: the builds, the hashes and the mutant diffs as applied.
- `sc616-r3-mutants.diff.txt`: the six product variants.
- `sc616-r3-probe-cpu-gate.diff.txt`: the probe harness (scratch copy only).
- `sc616-r3-scripts.sh.txt`: every runner script.

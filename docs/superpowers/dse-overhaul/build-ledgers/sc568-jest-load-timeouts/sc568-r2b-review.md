# SC-568 r2b review (independent; replaces the hung r2)

## Executive summary
- Verdict: FIX-ROUND (small). Branch `ed4044aa` on `df92a3f6`. The timeout raise and the contention fix work, but two fake-clock conversions lost real test coverage (2 x MEDIUM).
- Probe 1 (owner salvaged it): the 30 s default covers both `unit` and `dom`.
- Contention, `taskset -c 0 npx jest -w 11`: base `df92a3f6` red in 2 of 2 runs (5 failed, then 1). Branch green in 2 of 2 (0 failed; 11815 passed / 4 pending, see INFO-9).
- D1: `main.js` and `styles.css` are byte-identical between the base and branch builds (same shas as r1). There is no `src/`, `e2e/` or `visual-harness/` diff, so lifecycle and e2e carry and I did not re-run them.
- MEDIUM-1, `chromeFocusHandoff`: the frozen clock never lets time pass between steps, so a window shrunk to 1 ms still passes. Mutants SETTLE_MS=1, REQUEST_TTL_MS=1 and AFTER_RETURN_MS=1 go red on base (2, 11 and 9 tests) and stay green on the branch (0, 0, 0).
- MEDIUM-2, `initiative-outside-edit`: same cause. HANDOFF_TTL_MS=40 is a realistic regression (the Live Preview successor arrives 10-45 ms after the close). Base kills it with 3 reds; the branch passes it. HANDOFF_SETTLE_MS=40: base 1 red, branch 0.
- LOW-3: waiting a count of 10 macrotask hops is tied to how many hops a mock read takes. With 8 hops per read the branch goes red and base stays green; with 20 per read both are green, so the "rebase is done" precondition is never asserted. Wait on the observable instead.
- LOW-4: the 5 s wall-clock `waitUntil` caps (3 suites) are now the tightest limit under load; raise them. INFO: the remaining real-time sleeps are ranked for a follow-up. The skill proposal is short and mostly accurate; 4 small corrections.
- Counts per changed file, base vs branch: identical, 0 skip/failing/todo added, no `expect` line changed. Working trees: as found (details at the end).

## Findings

### MEDIUM-1: `chromeFocusHandoff` no longer checks that the request windows stay open for any real length
- Where: `test/dom/framework/chromeFocusHandoff.test.ts:83`, the file-wide `jest.useFakeTimers` that freezes `Date.now()`. The windows are in `src/framework/chrome/focusHandoff.ts:59,63,209`. The checks are `:200` (`liveRequest`), `:222` (AFTER_RETURN) and `:297` (SETTLE).
- Failure scenario: on a frozen clock, `expires = Date.now() + X` stays live for any X > 0. A regression that sets `SETTLE_MS = 1`, `REQUEST_TTL_MS = 1` or `AFTER_RETURN_MS = 1` passes all 26 tests on the branch. On base, the real milliseconds a rebuild takes catch it.
- Measured (one suite per run, quiet host):

  | mutant (focusHandoff.ts) | base (real clock) | branch (fake clock) |
  |---|---|---|
  | none | 26/26 | 26/26 |
  | FH1 TTL never expires (`liveRequest` returns live) | 2 red | 2 red |
  | FH2 SETTLE ignored (disarm on first success) | 2 red | 2 red |
  | FH3 boundary `<=` to `<` | 0 red | 0 red |
  | FH4 `SETTLE_MS = 1` | 2 red | **0 red** |
  | FH5 `REQUEST_TTL_MS = 1` | 11 red | **0 red** |
  | FH6 `AFTER_RETURN_MS = 1` | 9 red | **0 red** |
  | FH7 AFTER_RETURN shortening removed | 1 red | 1 red |
  | FH8 `AFTER_RETURN_MS = 4000` | 1 red | 1 red |
  | FH9 `SETTLE_MS = 50` / FH10 `AFTER_RETURN_MS = 50` | 0 red | 0 red |
  | FH11 `expires + 1 <= now` | 0 red | 0 red |

  Base's own coverage was incidental: it only caught windows shorter than a render, roughly under 50 ms (FH9/FH10 pass on both). The branch drops even that.
- Fix (test-only; it makes coverage stronger than base): let realistic time pass between steps on the fake clock, using literal numbers (the `managedModal` precedent: a test built from the product constant shrinks with it).
  - (a) `keyboard Pin` and the LOW-A tests: `await jest.advanceTimersByTimeAsync(2900)` between the pin returning and the rebuild. This kills FH5 and FH6.
  - (b) `rebuilt twice in a row` and LOW-A "pressing in the first embed": advance `1400` between successive rebuilds. This kills FH4.
  - (c) Add one SETTLE-lapse test: after a success, advance `1600`, rebuild, expect no focus. This kills "SETTLE too long", which survives on base too.
  - (d) Optional: an exact-boundary pair to kill FH3.

### MEDIUM-2: `initiative-outside-edit` gaps are shorter than the windows they stand in for
- Where: `test/dom/elements/initiative-outside-edit.test.ts:114` (`later`, default 30 ms of fake time) and `:130` (`useFakeTimers`). The `later(5)` "the widget arrives later" step is in O02 (`:173`) and O16 (`:248`). The burst steps are in O22 (`:444-451`). Product: `src/framework/chrome/windowHandoff.ts:77,80`; its comment says the Live Preview successor arrives "~10-45 ms after the close".
- Failure scenario: a change that cuts `HANDOFF_TTL_MS` to 40 ms, which breaks the measured 45 ms Live Preview case, passes the branch. Base catches it: O02, O13 and O16 go red. Likewise `HANDOFF_SETTLE_MS = 40`: base O22 red, branch green.
- Measured: WH1 SETTLE=1 → 1/1 red. WH2 SETTLE=40 → base 1, **branch 0**. WH3 TTL=1 → base 21, branch 3. WH4 TTL=40 → base 3, **branch 0**. WH5 settle timer 100 s → 1/1 red. WH6 SETTLE=200 → 0/0 red.
- Fix:
  - O02 and O16: `later(5)` → `later(45)`, the measured upper bound. Better: add one case at `HANDOFF_TTL_MS - 1` (already exported).
  - O22: between burst redraws, `later(HANDOFF_SETTLE_MS - 100)` (the constant is already imported at `:25`). O26 already covers the far side of the window.

### LOW-3: the macrotask-hop waits depend on how many hops a read takes, and do not assert their precondition
- Where: `test/dom/framework/reading-mode-host-pin.test.ts:57-59` (`settleOpenRead`, used at `:687`, `:753`, `:971`) and `test/dom/framework/reading-mode-host-crlf-hover.test.ts:26-28`.
- Coupling: N=10 counts sequential macrotask hops in the open-time read chain: `rebaseCardPin` awaits `drawnRead` and then a `cachedRead` (`ReadingModeBlockHost.ts:1010-1013`), and each mock read is one hop (`test/mocks/obsidian-core.ts:110,210`). An extra `await` is a microtask and does no harm. An extra read, or a mock read that takes more hops, uses up the budget.
- Measured: the mock read was mutated to take K hops, running both suites (169 tests):

  | hops per read | base | branch |
  |---|---|---|
  | 1 (as shipped) | green | green |
  | 3 | green | green |
  | 5 | green | green |
  | 8 | green | **1 red** |
  | 20 | green | green |

  The red is "an outside edit elsewhere in the source note ... Save still lands". Base's 25 ms covers about 20 hops on a quiet host.

  The result is not monotonic. At 20 hops the branch's 10-hop wait definitely ends before the rebase, and the test still passes. So whether the edit lands before or after the rebase is never checked; the verdict depends on how the hops happen to interleave.

  The CPU-burn A/B (every mock hop burns 30 ms): base 1 red, branch 0. This confirms r1's claim.
- Failure mode: red (loud) in the window I found, but the precondition is unverified.
- Fix: wait on the observable.
  - `rebaseCardPin` rewrites the pin in place (`pin.text` / `pin.lineStart`, `ReadingModeBlockHost.ts:1000-1003` and the partial path). Poll with `setTimeout(0)` hops until `pin.lineStart` equals the expected note line. Put a bound on it (for example 1000 hops, then throw "rebase never finished"), and `expect` it.
  - Where the pin does not move, wrap `app.vault.cachedRead` in the test with an in-flight counter. Wait until it is 0 for two consecutive hops.

### LOW-4: in-test 5 s wall-clock caps are now the binding limit under load
- Where: `test/dom/framework/sidebarInitiative.test.ts:149-152` (`waitUntil`, cap 5000), `test/dom/framework/formSaveRedraw.test.ts:217-220` (same) and `test/dom/framework/sidebarEncounterHandoff.test.ts:500-502` (`> 5000`).
- Failure scenario: at the load SC-568 was about (jest's per-test limit is now 30 s), these hand-written caps throw "timed out after 5000ms waiting for ..." first. This is the same false red with a different message. They are D2(b)-shaped: explicit, load-shaped, below 30 s.
- Fix: raise the caps to 25000. That is still below the 30 s jest limit, so the descriptive message still wins. Cheap; can go in this round.

### INFO-5: other tests close to the new limit (from the `--json` runs under contention)
- These are async tests only; a synchronous test cannot time out. Maximum across the 2 branch contention runs:
  - `twin-reuse` SC-547: 15.6 s, 52% of 30 s.
  - O22: 11.6 s.
  - O23 and O26: about 7 s.
  - `settings-tab` "Reset all": 6.6 s.
  - The `whole-pin` sweep (67 s) has its own 600 s timeout.
- Under the repro the headroom is about 1.9x, not the "~6x" in the `jest.config.ts` comment. That figure is measured against the time a test takes alone. Not a blocker. The comment could say "~6x over alone, ~2x under the 1-core repro". Evidence: `async-near-limit.txt`.

### INFO-6: remaining fixed real-time sleeps used as "async is done", ranked for a follow-up
Do not fix in this ticket. The race needs CHAINED work: a hop scheduled only after an earlier hop has run. A single product timer, or a read started before the test's timer, is ordered correctly even under load.

| rank | where | wait | note |
|---|---|---|---|
| 1 | `sidebarInitiative.test.ts:149`, `formSaveRedraw.test.ts:217`, `sidebarEncounterHandoff.test.ts:502` | 5 s caps | LOW-4 |
| 2 | `chromeRerender.test.ts:69` | `setTimeout(50)` "async onMount done" | a chained async mount; same shape as the fixed race |
| 3 | `reading-mode-host-hover-card.test.ts:27`, `reading-mode-host-form-pin.test.ts:114`, `reading-mode-host-drawn-pin.test.ts:21` | `setTimeout(25)` | Same helper as the fixed suites. A CPU-burn mutant (30 ms per hop) left all 4048 green on the branch: these read once, and the read starts before the timer. Low risk today; it becomes rank 2 if a second read is added. |
| 4 | `formModalHoverPreview.test.ts:19,101`, `compendiumSearchHoverPreview.test.ts:58,283,448`, `managedModal.test.ts:649,654` | 5 / 200 ms | wait for product timers (literal popover delays); ordering is preserved |
| 5 | `heroSheet.test.ts:316`, `sidebarEncounterHandoff.test.ts:248,549,594`, `formSaveRedraw.test.ts:420,434`, `initiative-matrix.test.ts:75`, `experimentalGate.test.ts:140` | `PERSIST_DEBOUNCE_MS + 50..200` | One debounce timer scheduled before the test's timer, so the ordering holds. Negative assertions (`heroSheet:317` `not.toHaveBeenCalled`) can pass vacuously. |
| 6 | `livePreviewFocusCarry.test.ts:49`, `livePreviewStateCarry.test.ts:55` | `Date.now()` tickets vs `CLAIM_WINDOW_MS` / `CARRY_TTL_MS` 1500 | the gaps are synchronous; only a GC-scale stall breaks them |
| 7 | `xvfbOwned.test.ts:148` | `expect(elapsed) < 5000` | an intended fail-fast assertion (child spawn) |

### INFO-7: redundant fake-timer calls
`chromeFocusHandoff.test.ts:267` and `:495` still call `jest.useFakeTimers(...)` inside the test, now that `beforeEach` does it. Harmless; delete them for clarity.

### INFO-8: `sc568-skill-proposal.md` is short and accurate; 4 corrections
- (a) Repro numbers: at `df92a3f6` I measured 5 and 1 reds. Say "1-5 reds per run (2 of 2 runs at `1cc54eac` and at `df92a3f6`)".
- (b) Replace "wait by a COUNT of macrotask hops" with "wait on the observable condition (the pin rebased, or the vault reads drained), bounded". Keep a hop count only as a fallback, and say that it is tied to the mock's hops (LOW-3).
- (c) Make the race statement precise: CHAINED hops lose to a fixed timer. "Never `setTimeout(25)`" overstates it (INFO-6 rank 3).
- (d) Add two rules. "A frozen fake clock must advance realistic gaps, or the window lengths go untested" (MEDIUM-1/2). "Hand-written `waitUntil` caps follow the same 30 s rule" (LOW-4).

### INFO-9: test counts in the scratch worktrees
The scratch worktrees read 11815 passed / 4 pending / 11819. The 2 extra pending are the `token-coverage` tests, which skip outside the workspace path (`/tmp`). That equals r1's 11817 / 2. Per changed file, base and branch are identical:
- `heroSheet`: 21
- `initiative-default-keys`: 25
- `initiative-outside-edit`: 26
- `chromeFocusHandoff`: 26
- `crlf-hover`: 23
- `reading-mode-host-pin`: 146
- `settings-tab`: 67

No skip, failing or todo added. No `expect` line was added or removed in the diff.

`initiative-default-keys` is not vacuous. The persist timer was delayed by 200 ms while the exported constant stayed unchanged, and the same 2 tests went red on base and on the branch.

## Measurements

| probe | result |
|---|---|
| contention base `df92a3f6` run1 | 5 failed. Timeouts: `initiative-default-keys` C06/C07, C25 and "pool back at its parse value"; `twin-reuse` SC-547. Assertion: O22. Load at start 5.94, at end 17.09; 430 s. |
| contention base run2 | 1 failed (`twin-reuse` SC-547, timeout). Load 15.33 → 14.97; 302 s. |
| contention branch run1 | 0 failed, 11815 / 4 pending. Load 11.90 → 16.67; 365 s. |
| contention branch run2 | 0 failed, 11815 / 4 pending. Load 12.97 → 16.53; 416 s. |
| bundle `df92a3f6` | `main.js` `aed2fbafe037301c7deb18ec35629d36aacd7d1f9f6c4acb3c967c0dd757cee8`, `styles.css` `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` |
| bundle `ed4044aa` | identical (build rc 0 for both) |
| diff scope | `jest.config.ts` + 7 test files; no `src/`, `main.ts`, CSS, `e2e/` or `visual-harness/` change |

## Process notes and deviations
- My first mutant batch was invalid. `--testPathIgnorePatterns=zzsc568r2 <path>` consumed the path as a second ignore pattern, so the whole `dom` project ran. I stopped it with TaskStop. Its FH1 mutant was left applied in `br/`, and I reverted it with `git checkout -- src/framework/chrome/focusHandoff.ts`. The log is kept as `mut-summary-aborted-wrongpath.txt`. Every later run put the path first, and the per-run counts (26, 169, 25, 4048) confirm the scoping.
- `git clean -fq -- main.js styles.css` is a no-op: both files are gitignored, so `-X` is needed. During the contention run2s, a `main.js` written by run1's `cssNesting` was present. It is built from the same commit's unmodified source, so it has no effect. The scripts now use `git clean -fqX`, and neither scratch worktree has a bundle left. No `rm` of any kind was used.
- Throwaway `zzsc568r2/` tests were left in place and ignored by every run. The scratch worktrees were not removed, as instructed.
- Main checkout (observed, not caused by me; I ran nothing there): `draw-steel-elements` reads `-dirty`, with `M demo-vault/Welcome.md`, `?? compendium-manifest.json` and `?? "demo-vault/montage 1.md"`. The session-start snapshot said clean. Probably another session.

## Final state
- `br` and `base` scratch worktrees: only `?? test/{unit,dom}/zzsc568r2/`, as I found them. No `main.js` or `styles.css`.
- Branch worktree `.../worktrees/sc568-jest-load-timeouts/draw-steel-elements`: `git status --porcelain` empty, HEAD `ed4044aa`. I ran nothing there.

## Evidence
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r2b-rev/`:

- Scripts: `mut.sh`, `mutall.sh`, `cont.sh`, `build.sh`, `an.py`.
- `logs/mut-summary.txt`: every mutant's rc and Tests line. Per mutant: `logs/mut-{br,base}-<ID>.{log,diff,rc,loadavg,status}`. The burn runs are saved under unique names: `mut-*-MVBURN-pinsuites.*` and `mut-br-MVBURN-unfixed.*`.
- Contention: `logs/cont-{base,br}-run{1,2}.{log,json,loadavg,rc,head,status}` and `cont-*-run*.analysis.txt`.
- Bundles: `logs/build-{base,br}.{sha,rc,head,log,status}`.
- `logs/per-file-counts.txt`, `logs/async-near-limit.txt`, `logs/sleeps-grep.txt`.

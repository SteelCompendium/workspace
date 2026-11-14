# SC-568 r4 scoped re-review (fix round `8f580e4b..2be69b95` on dse develop `9b94baf2`)

## Executive summary
- Verdict: FIX-ROUND, one change of 2 test lines (LOW-3 below). Everything else re-measured green. The owner can fold the change and land without another review round: I proved it (it passes with the helper and goes red with the helper made a no-op).
- MEDIUM-1, MEDIUM-2: re-ran all 17 of my mutants (FH1-FH11, WH1-WH6) on the branch `2be69b95` and on the base `9b94baf2`. The branch kills all 17. Base kills 13; the branch also kills the 4 that base misses (FH3, FH9, FH11, WH6).
- LOW-3, the owner's question: the drain wait is sound. It is bounded, it no longer depends on the hop count, and it stays green at 3/5/8/20 hops per read and under the burn mutant. But the precondition is still not ASSERTED, and it is observable. Add two lines at `reading-mode-host-pin.test.ts:680`. They pass at head and at 20 hops per read, and turn the test red when `settleVaultReads` is a no-op.
- LOW-4, INFO-5, INFO-7: applied as prescribed.
- Contention (`taskset -c 0 npx jest -w 11`) on the head: 0 failed, 11855 passed / 4 pending (the 2 extra pending are `token-coverage`, which skips under `/tmp`), 316 s, loadavg 2.81 → 15.57.
- Bundle byte-identical to a `9b94baf2` build: `main.js` `81a67cb8…9219`, `styles.css` `18730938…f1f9`. `src/`, `e2e/`, `visual-harness/`, `main.ts` and `styles-source.css`: none in `9b94baf2..2be69b95`. Lifecycle and e2e carry.
- INFO-8: the proposal is now accurate. Two optional additions (INFO-B).

## Findings

### LOW-3 (still open, narrowed): the rebase-done precondition is observable but not asserted
- Where: `test/dom/framework/reading-mode-host-pin.test.ts:679-680`.
- What is there now: `expect(vaultReadsStarted()).toBeGreaterThan(0)`. It is vacuous for the precondition. `takePin` starts the rebase's `cachedRead` synchronously inside `pinPosition()`, so it holds before any wait, and with the no-op helper (measured: the no-op variant is green 169/169 with this line in place). Its comment, "and it has drained", claims more than the line checks.
- The precondition is observable. In the partial path, `rebaseCardPin` rewrites the SAME pin object `pinPosition()` returned into note coordinates (`ReadingModeBlockHost.ts`: `pin.text = whole; pin.lineStart = linkLine`, in `rebaseCardPin`; the pin is passed in at `takePin`'s `pinRebased.set(pin, this.rebaseCardPin(pin, ...))`). Before the rebase it is `{ text: <section>, lineStart: 2 }`.
- Fix: replace line 680 with:
  ```ts
  expect(pin.text).toBe(full); // the open-time rebase has run: the pin is in the NOTE's coordinates now
  expect(full.split('\n')[pin.lineStart]).toBe('```ds-counter');
  ```
- Measured, branch scratch worktree, both suites (169 tests):

  | variant | result |
  |---|---|
  | assertion, real helper | 169/169 green |
  | assertion, real helper, mock read 20 hops | 169/169 green |
  | no-op helper, no assertion | 169/169 green (r3's finding reproduced) |
  | no-op helper, mock read 20 hops | 169/169 green |
  | **assertion + no-op helper** | **1 red**, the 680 test: `expect(pin.text).toBe(full)`, received the 7-line section |

  So the assertion checks the precondition, and is not a vacuous pass.
- Other `settleVaultReads` sites: `reading-mode-host-pin.test.ts:746`, SC-584 `:968`, `:1031`, `:1043`, `:1057`, `:1167`, `:1183`, and `reading-mode-host-crlf-hover.test.ts:147…427`. A drain wait is the right floor there. What they wait for is the card's drawn read (`this.drawn`, private) or a pin that `replaceSource` already awaits (`pinRebased`, `ReadingModeBlockHost.ts:1268`). Neither is observable from the test without a seam, and every one of those tests passes in both orders. No change needed.

### INFO-A: `settleVaultReads` under fake timers
`test/dom/_settleVaultReads.ts:40-45` hops on `setTimeout(0)`. In a file with jest fake timers active it never advances and hangs to the 30 s timeout. No current importer uses fake timers. One line in the helper's header comment ("real timers only; under fake timers use `pump()`") would prevent that.

### INFO-B: `sc568-skill-proposal.md` is accurate; optional additions
- Next to the `settleVaultReads()` bullet: "where the end state is observable (a rebased pin), assert it after the wait".
- The real-timers-only note (INFO-A).

Nothing in it is wrong now:
- The repro numbers match (1-5 reds, 2 of 2 at both bases).
- Headroom "~2x, `twin-reuse` ~16 s": this run measured 9.8 s; the r2b maximum was 15.6 s.
- The chained-vs-single-timer precision and the waitUntil-cap rule are correct.

## Re-measured: mutants

`logs/r4-mut-summary.txt`; each mutant was reverted by `git checkout`, and the status is clean after.

| mutant | base `9b94baf2` (26 / 26 tests) | branch `2be69b95` (28 / 28 tests) |
|---|---|---|
| none | green | green |
| FH1 TTL never expires | 2 red | 4 red |
| FH2 SETTLE ignored | 2 red | 3 red |
| FH3 `<=` to `<` | 0 | 1 red |
| FH4 `SETTLE_MS=1` | 2 red | 3 red |
| FH5 `REQUEST_TTL_MS=1` | 11 red | 5 red |
| FH6 `AFTER_RETURN_MS=1` | 9 red | 5 red |
| FH7 AFTER_RETURN shortening removed | 1 red | 2 red |
| FH8 `AFTER_RETURN_MS=4000` | 1 red | 2 red |
| FH9 `SETTLE_MS=50` | 0 | 3 red |
| FH10 `AFTER_RETURN_MS=50` | 1 red | 5 red |
| FH11 `expires+1 <= now` | 0 | 1 red |
| WH1 SETTLE=1 | 1 red | 1 red |
| WH2 SETTLE=40 | 1 red | 1 red |
| WH3 TTL=1 | 21 red | 4 red |
| WH4 TTL=40 | 2 red | 3 red |
| WH5 settle timer 100 s | 1 red | 1 red |
| WH6 SETTLE=200 | 0 | 1 red |

Reading-mode suites, 169 tests, mock read at K hops:

| mock read | base | branch |
|---|---|---|
| K = 3 | green | green |
| K = 5 | green | green |
| K = 8 | green | green |
| K = 20 | **1 red** | green |
| burn (30 ms per hop) | **1 red** | green |

Base's 25 ms timer now loses at 20 hops; the drain wait does not.

## Other checks
- LOW-4: caps are 25000 at `sidebarInitiative.test.ts:149`, `formSaveRedraw.test.ts:217` and `sidebarEncounterHandoff.test.ts:502`; none at 5000 remain.
- INFO-5: the `jest.config.ts:55-56` comment is corrected.
- INFO-7: the redundant `useFakeTimers` calls were removed from `chromeFocusHandoff` (only `:85` in `beforeEach` remains).
- New tests read correctly:
  - the 2999/3000 boundary and 1400/1600 settle-lapse tests in `chromeFocusHandoff`;
  - O27/O28 (2900/3100 around the 3000 TTL) and O02/O16 `later(45)`;
  - `later(1400)` before every O22 burst redraw.
- Contention head run: `twin-reuse` SC-547 9.8 s is the slowest async test; 0 failed.
- Working trees:
  - Branch worktree `.../worktrees/sc568-jest-load-timeouts/draw-steel-elements`: status empty, HEAD `2be69b95`. I ran nothing there.
  - Scratch `br`, now at `2be69b95`, and `base`, now at `9b94baf2`: only the untracked `zzsc568r2/` tests remain, and no bundles. No `rm` was used. The scratch worktrees stay registered for the owner to remove.

## Evidence
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc568-r2b-rev/`:
- Scripts: `r4-mut.sh`, `r4-mutall.sh`, `r4-low3.sh`, `r4-low3all.sh`, `r4-cont.sh`, `r4-build.sh`.
- `logs/r4-fixdiff.patch` (`b09e73c3..2be69b95`).
- `logs/r4-mut-summary.txt`; per mutant, `logs/r4-mut-{br,base}-<ID>.{log,diff,rc,loadavg,status}`.
- `logs/r4-low3-summary.txt`; per variant, `logs/r4-low3-<variant>.{log,diff,rc}`.
- `logs/r4-cont-br-run1.{log,json,loadavg,rc,head,status}`.
- `logs/r4-build-{base,br}.{sha,rc,head,log,status}`.

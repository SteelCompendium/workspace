# SC-443 r6b: scoped re-review of the r5 delta (my r4b findings, the new markers, the SC-679 jsdom hand-off)

**Executive summary**
- **Verdict (r6b items): LAND-READY.** One new LOW is open; it is cheap to fold, or it can be noted on SC-688. Branch `sc443-e2e-editor-insert` @ `758a8956` on `957e4b11`.
- **r4b findings:** all RESOLVED: MEDIUM-1, LOW-1, LOW-2, INFO-1, INFO-2, INFO-3 and INFO-5. Each one was re-probed with the mutant or simulation that found it.
- **New markers:** each fails today for its stated reason and flips under both fix shapes.
  - SC-687 (jsdom x3 + AUTH-I27): flips under a refusal and under a move-below fix. Only the markers go red; all 90 plain authoring e2e tests stay green under the refusal.
  - SC-688 (jsdom x2 + AUTH-G21): the no-space half flips under "write `key: value`" and under "no list until a space". The mid-word twin flips under "replace the whole word" and under "no list mid-word".
- **SC-679 jsdom half:** no SC-679 `test.failing` is left. The flipped cursor test (`authoringKnownBugs.test.ts:230`) goes red with the cursor placement removed, and with the whole fix reverted.
- **New findings:** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 2 INFO.
  - LOW-A: `schemaSuggestMatrix.test.ts:81` pins the value list opening on `mode:` with no space, so the "no list until a space" fix of SC-688 turns a plain test red.
- **Gates (scratch worktree at `758a8956`):**
  - jest full rc 0: `Tests: 4 skipped, 14269 passed, 14273 total`, 162 s, loadavg 24. The 2 extra skips are `token-coverage.test.ts`, because there is no workspace checkout beside a scratchpad worktree; the implementer's count is 14271 / 2.
  - Authoring jest: `918 passed`.
  - e2e `--element=authoring`: `OBSIDIAN-E2E done: 90/92 ok, 0 failed, 2 known-bug, coverage: 48/466 pairs (partial run: gate skipped)`, loadavg 35.
- **Process:** no `rm` anywhere this round. The scratch worktree was removed with `git worktree remove`. The branch worktree is clean, HEAD `758a8956`.

## r4b findings: status

| Finding | Status | Probe and result |
|---|---|---|
| MEDIUM-1 (`mode:flat` pinned as correct) | **RESOLVED** | The table row is gone. It is now `test.failing` at `schemaSuggestMatrix.test.ts:169`, asserting `/^mode:(\s+flat)?$/`. Un-marked, it fails today with `Received string: "mode:flat"`. Sim `sc688-space` flips it, and so does sim `sc688-nolist` (see LOW-A). |
| LOW-1 (SC-678 marker cannot flip under "no list mid-word") | **RESOLVED** | `authoringKnownBugs.test.ts:166-172` returns early when `onTrigger` gives null. Sim `whole-word` flips it, and so does `sc678-nomid`: in each, the only red tests are the markers. Un-marked, it fails today on `not.toContain` with the doubled string. |
| LOW-2 (SC-677 marker tied to `copyCode()`) | **RESOLVED** | It now drives `dispatchReferenceChoice(..., {ctrlKey: true})` and asserts the note is unchanged, a Notice was shown, and no rejection escaped. Sims `sc677-in-copycode` and `sc677-at-callsite` both flip it. Two non-fixes keep it red, correctly: a Notice while the rejection still escapes (`sc677-neg-notice-still-rejects`) and a silent catch with no Notice (`sc677-neg-silent-catch`). Un-marked, it fails today on the Notice (`Received: 0`). Soundness of the borrowed process: see INFO-B. |
| INFO-1 (list case only hit the whitespace branch) | **RESOLVED** | `authoringKnownBugs.test.ts:36-54` is a `test.each` over `- item⏎  \|` and `- item\|`. The mutant `m-listindent` (a list item loses its indentation) now turns the `at the end of the item line` case red. In r4 it survived every SC-443 jsdom test. |
| INFO-2 (the empty quoted line rule was untested) | **RESOLVED** | `authoringKnownBugs.test.ts:56-63` uses a scaffold with an empty line inside a callout and expects `>` exactly. The mutant `m-emptyquote` now turns this test red. In r4 only develop's `insertOwnLines` caught it. |
| INFO-3 (snapshot case had no cursor assertion) | **RESOLVED** | `authoringKnownBugs.test.ts:88-90` asserts the cursor sits on the empty line after the block, and one write. The mutant `m-snapcursor` (cursor put back at the insert start) turns it red. |
| INFO-5 (SC-676 markers passed `file=null`) | **RESOLVED** | The markers pass a `TFile` and a `getFileCache` stub (`frontmatterPosition`, `sections`). A metadata-cache-based guard (sim `sc676-cache`) flips all 3, with 915 others green. Un-marked, all 3 fail today with `Received: true`. The stub's list case is a `list` section, not `code`, which matches Obsidian: a code block inside a list item is not its own section. A guard that only reads the cache therefore cannot see that case, in the product either. |

## Item 4: the new markers

| Marker | Fails today with | Fix shape A | Fix shape B |
|---|---|---|---|
| SC-687, jsdom: the insert command inside ds-stam (`:192`) | `a fence was left unclosed` | refuse (`sc687-refuse`): flips | move below the block (`sc687-below`): flips |
| SC-687, jsdom: compendium reference inside ds-stam (`:198`) | the same | flips | flips |
| SC-687, jsdom: the insert command in the frontmatter (`:206`) | `the frontmatter changed …` | flips | flips |
| SC-687, e2e AUTH-I27 (`insert-commands.e2e.ts:139`) | known-bug, `failsWith: /toBeNull/` | `appears fixed` | `appears fixed` |
| SC-688 no-space half, jsdom (`schemaSuggestMatrix.test.ts:169`) | `Received string: "mode:flat"` | write `key: value` (`sc688-space`): flips | no list until a space (`sc688-nolist`): flips, **plus 1 plain test red (LOW-A)** |
| SC-688 twin, jsdom (`authoringKnownBugs.test.ts:216`) | `not.toContain … opposedposed` | replace the whole word (`whole-word`): flips | no list mid-word (`sc688-twin-nomid`): flips |
| SC-688, e2e AUTH-G21 (`gate-on.e2e.ts:208`) | known-bug, `failsWith: /Expected\|Received/` | `sc688-space`: `appears fixed` | `sc688-nolist`: `appears fixed` |

- **Plain tests under each fix shape:**
  - jsdom: SC-687 refuse and below, `whole-word`, `sc678-nomid`, `sc688-twin-nomid` and `sc688-space`: only the markers go red.
  - e2e `--element=authoring` under `sc688-nolist`: `90/92 ok, 1 failed` (AUTH-G21 appears fixed), 1 known-bug (I27).
  - e2e `--element=authoring` under `sc687-refuse`: `90/92 ok, 1 failed` (I27 appears fixed), 1 known-bug (G21).
  - So all 90 plain authoring e2e tests stay green under both.
- **The `existingBlocksIntactProblem` helper** (`e2e/driver/authoringIntact.ts`) compares whole fence texts, including the fence lines (`noteFences.ts:72`). It also checks that nothing is left unclosed and that the frontmatter prefix is unchanged. It passes both fix shapes (proven above) and has its own self-test (`authoringKnownBugs.test.ts:182`).
- **Titles:** no bracketed ticket id in any test title. `knownBug` adds the `[known bug …]` suffix itself; the jsdom title carries `(SC-688)` in parentheses.

## SC-679 jsdom hand-off

- No `knownBug('SC-679')` and no SC-679 `test.failing` remain. `authoringKnownBugs.test.ts:229-238` is a plain `test`.
- Mutant `m679-nocursor` (the `setCursor` after the accept removed): 3 red — the hand-off test, plus develop's `schemaSuggest.test.ts` key / value cursor tests.
- Mutant `m679-revert` (`setCursor` and `close()` removed): 4 red — the same 3, plus "the accept closes the list once".
- The e2e half (G13 / G14 / K09 and the 13 patch tests) is scope A's.

## New findings

### LOW-A: a plain matrix row pins the precondition of SC-688
- `test/dom/authoring/schemaSuggestMatrix.test.ts:81`: `['mode:', ['power-roll', 'test', 'opposed', 'flat']]` pins that the value list opens with NO space typed.
- **What goes wrong:** the ruling accepts "no list until a space is typed" as a fix for SC-688. With that fix (sim `sc688-nolist`), this plain row goes red next to the flipping marker. A fixer who picks that shape is told they broke something. This is the same pattern as r4 MEDIUM-1, but milder: the row is still correct under the other fix shape.
- **Fix:** drop the row, or accept either list with a pointer (`// SC-688: a fix may offer nothing before the space`). Or say on SC-688 that the row comes off with a shape-B fix.

### INFO-A: AUTH-G21 waits only 1.5 s for the list
- At `e2e/specs/authoring/gate-on.e2e.ts:212`, AUTH-G21 waits 1.5 s for the list, then treats no list as a fix.
- On a host loaded enough to delay the list, the marker would fail as `appears fixed`. That is a loud failure, not a silent pass.
- It passed in all 4 runs I made at head or under an SC-687 sim (loadavg 12-35). Optional: use `waitList()`'s 6 s; that costs time only once the bug is fixed.

### INFO-B: the SC-677 marker's borrowed process is sound
- Probe: I appended two throwaway tests after the marker, in the scratch copy only (`r6-leakprobe.ts`).
  - `R6B-LEAK atLoad=1 now=1 same=true isRealDifferent=true`: the runner's `unhandledRejection` listener set is the same after the marker as at load (no leak). `vm.runInThisContext('process')` is a different object from the test's `process`.
  - `R6B-SEEN 1`: a deliberate unhandled rejection made in a test reaches the borrowed process, so `escaped` can see one.
- The negative control (Notice shown, rejection still escapes) keeping the marker red confirms the escape check is live.
- Theoretical nit: `listeners()` plus `.on()` would turn a `once` listener into a permanent one. Jest's is a plain `on` (count 1 before and after), so nothing changes today.

## Gate logs and evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-rev-r6b/`.

- **jest:**
  - full: `r6-jest-full.log` / `.rc` / `.load-start` / `.load-end`.
  - authoring baseline: `r6-jest-base.log` (918 passed).
  - un-marked markers: `r6-jest-unmark.log` (10 failed, each for its stated reason).
  - listener probe: `r6-jest-leak.log`.
  - sims and mutants: `r6-jest-sim-<sim>.log` / `.rc` and `r6-sim-<sim>.out`, for `sc687-refuse`, `sc687-below`, `sc688-space`, `sc688-nolist`, `whole-word`, `sc678-nomid`, `sc688-twin-nomid`, `sc677-in-copycode`, `sc677-at-callsite`, `sc677-neg-notice-still-rejects`, `sc677-neg-silent-catch`, `sc676-cache`, `m-listindent`, `m-emptyquote`, `m-snapcursor`, `m679-nocursor`, `m679-revert`.
- **e2e:**
  - `--only=AUTH-I27,AUTH-G21` at head and under each fix shape: `r6-e2e-<head|sc687-refuse|sc687-below|sc688-space|sc688-nolist>.log` / `.rc` / `.load`.
  - `--element=authoring` at head: `r6-e2e-auth-head.log` / `.rc` / `.load`.
  - `--element=authoring` under a fix shape: `r6-e2e-auth-sc688-nolist.log` and `r6-e2e-auth-sc687-refuse.log`.
- **Scripts:** `r6-sim.py`, `r6-jest-sims.sh`, `r6-leakprobe.ts`, `r6-e2e-batch.sh`, `r6-e2e-auth.sh`, `r6-gates.sh`.
- **Leftover:** `r6-node_modules.link`, the `node_modules` symlink moved out of the worktree before removal and left in place.

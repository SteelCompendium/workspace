# SC-593 r1 independent review: dse `b2b72774` (base c3fd8323)

## Executive summary
- Verdict: **LAND-READY**. Findings: 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO. None blocks landing.
- Equivalence: in real Obsidian, the old per-node walk and the new subtree scan return the same result on all 13 census scans the HEAD spec makes (CENSUS-01..09). They also match on 13 overlapping-selector scans and on 26 scans with planted listeners, and the page returned to its pre-plant result 13/13 times.
- Vacuity: an unidentified `<div>` with a click listener, planted in scope and left there, makes CENSUS-01/04/07/06 FAIL 4/4 with `no data-dse-control: <div class=""> "sc593-P1" listens for click`.
- CENSUS-07 alone, old -> new (ms). Ambient load 8-12 (other agents): 15379/5909/6065 -> 1365/1276/1296. With 24 busy loops (load 21-27): 34165/20513 -> 5117/4679. With 60 busy loops (load 50-61): 42641 and TIMEOUT at 45000 -> 10533/9827.
- No per-test timeout was added, and none is needed: the worst new run is 10.5 s, 23% of the 45 s budget.
- Full e2e at HEAD: `OBSIDIAN-E2E done: 260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, GATE-RC=0. The known bugs are SC-257, SC-384, SC-580, SC-355 and SC-588. In the same run CENSUS-07 took 1198 ms. `npm run tsc` and `npm run lint` both exit 0.
- origin/develop has moved from c3fd8323 to `ec26b709` (SC-574, 4 commits). Those commits do not touch either file in this change, but landing needs a rebase and an e2e re-run (INFO-4).

## 1. Result equivalence (probe in real Obsidian)
Method: a temporary `e2e/driver/census.ts` (`census-probe-rv593.ts`) contains the c3fd8323 walk and the b2b72774 scan, both verbatim. For every `eventfulNodes` call made by the HEAD spec it does the following:
- (a) runs old and new and compares them with `JSON.stringify`, which covers nodes, order, id/tag/cls/text and events;
- (b) runs old and new with the scope selector plus two narrower overlapping selectors (`… div`, `… button`) added;
- (c) plants listeners, scans with old and new under both the test's own `excludeInside` and the default one, then unplants;
- (d) re-scans to confirm the page is back to its pre-plant result.

The probe ran via `npm run e2e -- --only=CENSUS-01,…,CENSUS-09` (9/9 ok). census.ts was restored from HEAD by a trap, and the sha256 matches the pre-review value.

| scan | scope | roots | scope nodes | eventful old/new | old ms | new ms | same |
|---|---|---|---|---|---|---|---|
| 1 | bar (01) | 3 | 59 | 3/3 | 257 | 35 | yes |
| 2 | modal (02) | 2 | 98 | 13/13 | 354 | 46 | yes |
| 3 | notice (03) | 1 | 3 | 1/1 | 17 | 22 | yes |
| 4 | tracker (04) | 3 | 525 | 51/51 | 1516 | 1128 (first-scan warm-up) | yes |
| 5-8 | tracker (07 x4) | 3 | 526/382/384/382 | 52/35/35/35 | 1525/1581/1386/1202 | 103/130/80/72 | yes |
| 9 | reset modal (08) | 2 | 7 | 2/2 | 28 | 19 | yes |
| 10 | pool modal (06) | 2 | 92 | 11/11 | 291 | 37 | yes |
| 11-12 | conditions (09 x2) | 2 | 302/483 | 42/66 | 894/1190 | 79/85 | yes |
| 13 | bar + popover (05) | 3 | 66 | 6/6 | 180 | 34 | yes |

Planted cases. Old and new agree on every case in every one of the 13 scopes:
- P1, a nested div with `addEventListener('click')`: reported as `null:click`.
- P2, a div that is a root, with an `onclick` **property**: reported.
- P3, a span nested in P2 with a **capture** keydown listener: reported.
- P4, a wrapper carrying `data-dse-chrome-item` with a click listener, and its child P4c with pointerdown: reported only when `excludeInside=null` (tracker) and absent under the default exclusion. This shows a root's subtree can contain excluded nodes and that they are filtered out.
- P5, a shadow host with mouseup: the host is reported. Its **shadow child** with a click listener is absent in both old and new, because both run with `pierce: false` and `querySelectorAll` does not enter shadow roots.
- P7, a focus-only listener: absent.
- A click listener on the **scope container itself**, which is outside the `… *` scope: absent.
- P9, a node with `data-dse-control="sc593.bogus"`: reported with that id.
- P10, a node with keyup + click + a capture keyup + an inline `onmousedown` **attribute** + a passive touchstart: events `keyup+click+mousedown+touchstart`, in the same order in old and new.
- P11, an `<iframe srcdoc>` whose button has an onclick: absent in both.

Vacuity (`SC593_KEEP=1`, P1 planted and left in place, the new scan returned to the test): CENSUS-01, 04, 07 and 06 each FAIL on `censusFindings(...).toEqual([])` with the planted div named in the message. GATE-RC=1, as it should be.

Code reading agrees with the probes. Blink's `getEventListeners` runs `CollectNodes(depth)`: the default depth 1 means the node only, and -1 means the whole subtree in pre-order. Per-node listener order is therefore unchanged. Any in-scope element is either a root or sits under one through a `parentElement` chain, and that chain is the same light-DOM path the `depth: -1` traversal follows. So no in-scope node can fall outside the roots' subtrees.

## 2. Timing (CENSUS-07 alone; `timing-rv593.sh`)
Old means c3fd8323's census.ts **and** spec, which still scans 5 times. New means HEAD. Runs alternate old/new. The host is shared with other agents (jest and e2e from sc574/sc595 were running), so "quiet" means ambient load 8-12.

| condition | old (ms) | new (ms) |
|---|---|---|
| ambient, load 8-12 | 15379, 5909, 6065 | 1365, 1276, 1296 |
| 24 busy loops (2x cores), load 21-27 | 34165, 20513 | 5117, 4679 |
| 60 busy loops, load 50-61 | 42641; **FAIL timed out after 45000** | 10533, 9827 |

All 84 busy-loop PIDs were recorded, each `/proc/<pid>/cmdline` was verified, all were killed by PID, and none were left alive.

## 3. Per-test timeout
None was added, and the global 45 s timeout is unchanged. The worst new measurement is 10.5 s (23% of the budget) under 60 spinners, below the brief's ~50% backstop line. Nothing masks a hang.

## 4. Runner rules
- The diff adds no bracketed ticket id. The only SC-593 mention is in a `//` comment (`_census.e2e.ts:99`).
- The `[CENSUS-07]` title is byte-unchanged.
- The full run reports 265 tests and coverage `164/164 pairs`.
- Commits carry no attribution trailers.
- The diff touches only `e2e/` (`git diff --stat c3fd8323..HEAD -- . ':!e2e'` is empty). Re-running lifecycle, shots, freeze and parity was therefore not needed. A spot-check of the implementer's logs: lifecycle 21+16+9+4+4 = 54/54, jest 7200 passed / 1 skipped, freeze 280/280, parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, all GATE-RC=0.

## Findings

**LOW-1: `e2e/driver/census.ts:61`. An input listener without a `backendNodeId` is dropped silently.**
- Scenario: a future Electron/Chromium build stops sending `backendNodeId` in `getEventListeners` replies (it is optional in the protocol), or omits it for some listener kinds. The new scan would then return fewer nodes, possibly none. The old walk did not depend on that field.
- Mitigation already in place: every CENSUS scenario asserts positive `toContain` ids, so an empty census would fail rather than pass. A partial drop, such as only an undeclared div's listener, would pass silently.
- Not observed: the 52 scans above all matched.
- Fix: replace the `continue` with `throw new Error(\`census: ${l.type} listener reported without backendNodeId\`)` for `INPUT_EVENTS` types, so the scan fails loudly instead of shrinking.

**INFO-1: `e2e/driver/census.ts:83-85`. The `finally` release can mask the real error.**
- Scenario: a CDP call fails because the session died. `await cdp('Runtime.releaseObjectGroup')` then throws too, and its error replaces the original in the failure bundle.
- Separately, if one `Promise.all` member rejects, the others are still in flight while the group is released, so a few handles may leak after a failure.
- Fix (optional): `await cdp('Runtime.releaseObjectGroup', { objectGroup }).catch(() => {});`.

**INFO-2: implementer heavy-load "after" figure not reproduced.**
- The implementer reported 3.2-3.4 s at load ~64. I measured 10.5 s and 9.8 s at load 55-61, on a host that was also running other agents' jest and e2e.
- The conclusion holds: about 4x headroom, and no backstop is needed. If the ledger or CHANGELOG quotes a loaded number, use "~10 s at loadavg ~60 (old: 42.6 s / timeout)".

**INFO-3: scan-count nit.**
- The report says "15/15 scans identical", but its `cmp-a0b087f1.log` has 14 lines (the old spec scans 14 times).
- The HEAD spec makes 13 scans, and my probe found 13/13 identical. This does not change the claim.

**INFO-4: origin/develop moved from c3fd8323 to `ec26b709` during the round.**
- The new commits are SC-574 `58ef7b8f`, `11b849ff`, `580c9f84` and `ec26b709`.
- They touch `e2e/specs/minion-pool/pool-conditions.e2e.ts`, a new vault fixture `Initiative/squad-custom.md`, `src/views/MinionStaminaPoolModal.ts` and a jest matrix test. They do not touch either of the two files in this change.
- Landing needs a rebase onto ec26b709 and a full e2e re-run on the rebased head. CENSUS-06 scans the pool modal whose DOM SC-574 changed, and the expected e2e total and pairs may have moved with SC-574.

## Working-tree state
- Before the review: dse clean, and the superproject worktree showed ` M draw-steel-elements` (the branch's own pointer move, pre-existing).
- After the review: the same. The census.ts / _census.e2e.ts sha256 values are unchanged (`0ad15cf5…`, `97da91cd…`). Every probe swap was restored with `git checkout HEAD -- <literal path>`.
- Failing-run bundles from the vacuity and old-heavy runs are under the worktree's git-ignored `e2e/.out/`, which retention prunes.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc593-r1-review/)
- census-probe-rv593.ts, run-probe-rv593.sh: the probe and its runner.
- probe1-run-rv593.log, probe1-data-rv593.jsonl, probe1-load-rv593.txt: equivalence, overlap, plant and restore results.
- probe2keep-run-rv593.log, probe2keep-data-rv593.jsonl: the vacuity run (4/4 FAIL as intended).
- timing-rv593.sh, timing-{quiet,spin24,spin60,spin60b}-rv593.txt plus per-run timing-*-{old,new}-*-rv593.log, and spin-pids-*-rv593.txt.
- gate-rv593.sh, tsc-rv593.log, lint-rv593.log, e2e-full-rv593.log.

## Re-review (r2): delta 4f0c87f2 on origin/develop 94133a5a (be6bd5f3, 0a5e8ea1, 4f0c87f2)
- Verdict: **LAND-READY**. No new findings (0 HIGH, 0 MEDIUM, 0 LOW, 0 INFO). LOW-1 and INFO-1 are closed; INFO-4 (the rebase) is done.
- (a) LOW-1: `census.ts:61-63` now filters to input types first and throws only for an input-type listener that has no backendNodeId. INFO-1: `census.ts:87` adds `.catch(() => {})` to the release, so the original error survives.
- (b) Rebase: `git range-diff c3fd8323..b2b72774 94133a5a..0a5e8ea1` shows `fcb08de6 = be6bd5f3` and `b2b72774 = 0a5e8ea1`, both identical.
- (c) At 4f0c87f2: tsc rc 0, lint rc 0, and e2e `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` rc 0. In that run CENSUS-06 took 582 ms and CENSUS-07 1145 ms (loadavg 3-16).

Throw-path probe. A temporary stub (`census-r2stub-rv593.ts`) changed the copy in two ways: it deleted `backendNodeId` from the selected listener class, and it renamed the release to an unknown CDP command so the release would also fail. census.ts was restored from HEAD by a trap, and the sha256 matched the pre-probe value. Results:
- Input listeners stripped (7), CENSUS-01: FAIL `census: a "click" listener came back without a backendNodeId, so it cannot be attributed to a node`. The failing release (`unknown command: 'Runtime.releaseObjectGroupBOGUS'`, after wdio retries it) did not replace that error.
- Non-input listeners stripped, CENSUS-01: ok, but 0 listeners were stripped, so this run proves nothing. The same stub on CENSUS-02/04/09 stripped 11 non-input listeners and passed 3/3. So only input types throw.
- Both of those passing runs also had the failing release, and they stayed ok, so a failed release is swallowed.

Implementer r2b logs (spot-check, not re-run): lifecycle 21+16+9+4+5 = 55/55 (part 5 now includes G-S83 from SC-595), jest 7239 passed / 1 skipped, freeze 280/280, parity 0/0/24, shots rc 0 (button 978, modal 234, clip 147), e2e 262/267, all GATE-RC=0.

Evidence (scratch `sc593-r1-review/`): census-r2stub-rv593.ts, run-r2stub-rv593.sh, r2stub-{input,other,other2}-run-rv593.log, r2stub-{input,other,other2}-drops-rv593.txt, r2-pre-sha-rv593.txt, r2-tsc-rv593.log, r2-lint-rv593.log, r2-e2e-full-rv593.log.

# SC-567 independent review, round 1

## Executive summary
- Verdict: **LAND** (one MEDIUM docs gap the owner can fold at landing or send back as a one-line fix round).
- Reviewed: draw-steel-elements `dee48526` (branch `sc567-pool-modal-overticked-apply`), base origin/develop `b4e7b4f4`. Diff: 3 files (modal src, jsdom matrix, e2e), no CSS/DOM-structure change.
- Findings: HIGH 0, MEDIUM 1, LOW 2, INFO 3.
- Ledger decisions honoured verbatim: trim (not reword); latest pick unticked first; auto (0-pool) ticks revert before the trim; draft path predicts min(user ticks, owed). SC-573/574 `test.failing` markers still fail (suite green); 0-pool branch, enable logic and heal paths untouched.
- Probes: 41 throwaway jsdom probes (incl. a 20-seed x 60-step random walk against a pick-order model) all pass on HEAD; 40 of them fail on the unfixed src. The 11 new matrix tests: 10 fail on the unfixed src, 1 (0-pool round trip) is a declared regression guard.
- Gates measured: jest 7098 passed / 1 skipped / 1 failed (twin-reuse SC-547 5000 ms timeout at loadavg 5-15; alone 53/53 green). e2e 256/263 ok, 0 failed, 7 known-bug, coverage 163/163 pairs (POOL-K06 ok). Lifecycle/shots/freeze/parity not run (justified below).

## Findings

### MEDIUM-1: no CHANGELOG bullet for a user-facing behaviour change
- Where: `draw-steel-elements/CHANGELOG.md` `## 7.0.0 (unreleased)` (no SC-567 entry); the diff touches only src/test/e2e.
- Scenario: a GM who lowers the damage after ticking now sees boxes untick themselves (the latest pick). Nothing in the release notes says so. Precedent in this same modal series: SC-566 `8ca64cb9` and SC-572 `06938c0a`/`5b599f70` each added a DSE CHANGELOG `[FIX]` bullet; AGENTS.md "Ship a user-facing change -> CHANGELOG". (The implementer brief did not ask for one, so this is a brief gap, not an implementer miss.)
- Fix: add a `[FIX]` bullet under `## 7.0.0 (unreleased)` in `draw-steel-elements/CHANGELOG.md`, e.g. "**Lowering the damage after ticking minions no longer leaves Apply disabled** (SC-567). With 2 kills owed and 2 minions ticked, lowering the damage to 1 kill owed left both ticked, Apply disabled and the tooltip asking to "Select 1 minion(s)". The surplus tick now clears, the most recent pick first, and Apply enables." Optionally the workspace `CHANGELOG.md` `## Unreleased` too (SC-575 did, SC-566 did not; owner's call).

### LOW-1: e2e POOL-K06 cannot tell "latest pick" from "bottom row"
- Where: `draw-steel-elements/e2e/specs/minion-pool/pool-apply-kills.e2e.ts:112-129`.
- Scenario: K06 ticks #1 then #2 (row order). An implementation that trims from the last DOM row (or by instance id descending) passes K06 unchanged; only jsdom pins pick order. The ledger's second decision (which ticks go) is therefore not proven in real Obsidian.
- Fix: tick `nth: 1` first, then `nth: 0`; expect `'-o---'` after typing 16, and the write `instances: [{ id: 1 }, { id: 2, isDead: true }, ...]`. Same cost, discriminating.

### LOW-2: mis-indented test in the new describe
- Where: `draw-steel-elements/test/dom/views/minion-stamina-pool-modal-matrix.test.ts:598` (`test('the invariant: ...` has one tab; its siblings and its body have two/three). `npm run lint` covers only `src main.ts e2e`, so nothing flags it.
- Fix: indent line 598 by one more tab.

### INFO-1: during a dirty draft, Apply says "kill 1" while 2 boxes still show ticked
- Where: `src/views/MinionStaminaPoolModal.ts:473-486` (draft prediction) vs `updateCheckboxes` only running at commit.
- This is the SC-430 design plus ledger decision 3 (predict the trim), so not a defect. Probe P3-apply confirms an Apply clicked mid-draft runs `commitDraft()` first, trims, and kills only the kept pick (pool 16, `[true,false,false,false,false]`, one persist).

### INFO-2: the "tie keeps DOM order" path is unreachable
- Where: `src/views/MinionStaminaPoolModal.ts:561-570`.
- A checked, non-auto box always carries `tick > 0` (asserted on every step of P9: 1,200 steps, every reachable control). The stable sort tie-break never decides anything. Harmless; no change needed.

### INFO-3: tick-order state does not leak
- `tickSeq` and `tick` are per modal instance; both call sites (`src/elements/initiative/view.ts:1758`, `:1879`) construct a new modal per open. Probe P8 confirms a reopen on the same squad starts with no ticks and `tickSeq` counting from 0; unchecked boxes always carry `tick 0` (P9).

## Ledger conformance
| Decision | Code | Verified by |
|---|---|---|
| Trim, not reword | `updateCheckboxes` minionsToKill>0 branch, src:561-570; no tooltip/info copy changed | matrix tests 1, 10, invariant; P1-P9 |
| Latest pick unticked first | `handToggled` src:227-233 (`tick = ++tickSeq` on tick, 0 on untick), sort ascending + `slice(minionsToKill)` | matrix 2-4; P1 (untick/re-tick, different box); P9 model |
| Auto ticks revert first, then trim | auto-revert loop src:545-551 precedes trim | matrix 8; P2 (4 cases) |
| Draft predicts min(user ticks, owed) | src:481-485 | matrix 6; P3 (6 setups x 21 targets, label/disabled/title/info identical draft vs commit) |
| SC-573/574/591/592 not folded | 0-pool branch and enable rule untouched; SC-573/574 `test.failing` still fail | jest matrix suite green |

## Probes (all in scratch; branch untouched)
Probe file: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-review-r1/sc567-probe.test.ts`, run in two `git archive` copies of HEAD (`dse-head`, and `dse-unfixed` = HEAD with the src file from origin/develop), node_modules symlinked.
- P1 tick order across untick/re-tick (2): pass HEAD, fail unfixed.
- P2 auto ticks then 1-2 owed (4): no-user-tick 0->16 gives `.....` Apply disabled "Select 1"; #4,#2 then 0 then 16 keeps #4, 0 again then 12 does not restore #2; 0 then 12 restores both user ticks; inc from 0 keeps both. Pass HEAD.
- P3 draft vs commit (7): 6 setups (2 ticks at 2 owed; 3 ticks at 3 owed; 2 ticks then 0 (auto); 0 with no user ticks; 1 tick at 1 owed; untouched) x every draft target 0..20: Apply disabled/label/title and info line identical before and after commit. Plus Apply clicked mid-draft: kills #1 only, pool 16, persisted once. Pass HEAD (the 6 sweeps also pass unfixed: they test equality, not the trim).
- P4 other controls (3): stepper dec raising owed never trims; Apply Damage row then 4x inc trims to the earlier pick; owed unchanged across a commit (12 -> 11) leaves both ticks. Pass HEAD.
- P5 heal paths (2): refused heal (pool 12, 2 dead, 4 -> 16) clears ticks and order; back to damage starts a fresh order; in-ceiling heal leaves boxes locked, Apply enabled. Pass HEAD.
- P7 squad with 2 dead (1): tick #5 then #3 at 2 owed, drop to 1 owed keeps #5; Apply kills #5 (`[T,T,F,F,T]`), pool 8. Pass HEAD.
- P8 reopen (2): close without Apply then reopen: fresh boxes, `tickSeq` 2 after two new ticks; Apply after trim then reopen shows 4 locked boxes, #2 dead. Pass HEAD.
- P9 random walk (20 seeds x 60 steps, 0-2 dead, tick/name-click/type/inc/dec/Apply Damage row/Reset): checked boxes == model pick list trimmed to owed; ticked <= owed; a disabled Apply never asks for <= ticked; info "Select N" >= ticked; label kill count == info kill count; tick bookkeeping (unchecked -> 0, user-checked -> >0, auto -> 0). Pass HEAD; all 20 fail unfixed.
- Result: HEAD 221/221 (probe 41 + matrix + pool suites), log `probe-head.log`; unfixed 40 failed / 181 passed, log `probe-unfixed.log`.

## Vacuity check of the new tests
On `dse-unfixed`, the 11 new matrix tests: 10 fail; the one that passes is "0-pool round trip with fewer user ticks than owed" (declared a regression guard in the implementer report). Matches the implementer's claim.

## Gates
- jest full (worktree): `Tests: 1 failed, 1 skipped, 7098 passed, 7100 total`; the failure is `test/dom/framework/twin-reuse.test.ts:736` SC-547 "Exceeded timeout of 5000 ms" (loadavg 5-15); `npx jest twin-reuse` alone 53/53. 1 skipped (not 2): the printTwin test now runs because the implementer's shots run cached the app css. Logs `jest-full.log`, `jest-twin.log`.
- e2e full (loadavg 10-15): `OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`, rc 0; `POOL-K06 ok (3492 ms)`. Log `e2e.log`.
- Lifecycle, shots, freeze, parity: not run. The diff changes no CSS, no DOM structure and no control ids; it changes box state only after the owed kills drop below the ticks, and no lifecycle scenario or shot drives `pool.kill` / `.dse-minion__check` (grep of `visual-harness/` finds no such driver). The implementer's shots 592 / freeze 280/280 / parity 0/0/24 stand.

## Working tree
`git -C .../draw-steel-elements status --porcelain` empty before and after.

## r2 re-review (delta `dee48526..edd16374`, one commit `edd16374`)

Verdict: **LAND**. Findings: HIGH 0, MEDIUM 0, LOW 0, INFO 2. r1 MEDIUM-1, LOW-1 and LOW-2 are resolved.

- Delta scope: `CHANGELOG.md` +4, `e2e/specs/minion-pool/pool-apply-kills.e2e.ts` +7/-5, matrix test :598 reindent (1 line). `src/` unchanged (no src path in `git diff --stat dee48526..edd16374`). Nothing else.
- CHANGELOG (`CHANGELOG.md:85-88`, under 7.0.0 unreleased, after SC-566): accurate. It says the boxes stayed ticked with Apply disabled and a tip asking for fewer kills than ticked; now the most recent pick is unticked first, the earlier picks stay, Apply is ready, and raising the damage does not re-tick. That matches the code and probes P2 and matrix test 7. Plain wording, no colour, same "Minion pool window:" lead as SC-572.
- POOL-K06 now ticks nth 1 then nth 0 and expects `-o---`, the note write `{id:1}, {id:2, isDead:true}`, cell `0-2` DEAD and cell `0-1` `16/20 (4)`. The cellText key matches K01's use (`0-N` = instance N).
- Mutant probe, bottom-row trim: in a scratch copy of `edd16374` with the sort replaced by DOM order (`indexOf(a) - indexOf(b)`, so the lowest row goes first), a jsdom mirror of K06 fails at the boxes assertion (expected `-o---`, received `o----`). `poolBoxes()` (`e2e/driver/pool.ts:39`) reads the same DOM order with the same notation, so K06 fails the same way in Obsidian. Against the real src the mirror passes. The mutant also fails 3 of the matrix SC-567 tests.
- INFO-r2-1: K06 does not catch a top-row trim (drop the lowest index first: it drops #1 and keeps #2, the same as the real rule here). No single two-tick case can catch both wrong orders. The jsdom matrix test "3 owed, 3 ticked (#3, #1, #5)" catches the top-row variant, because that variant keeps #5 instead of #3. No change needed.
- INFO-r2-2: the CHANGELOG says "It used to leave every box ticked". It means every ticked box. A careful reader could take it as all five boxes. Optional: "It used to leave both boxes ticked". Not blocking.
- Gates: e2e not re-run (the r2 request allowed using the implementer's full-run log). I read the implementer's log `sc567-impl-r1/r2-e2e.log` (written 05:48, the same minute as the commit, and it carries the new K06 title "(not the lower row)"): `OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`, `POOL-K06 ok (4612 ms)`. jsdom: mutant run `k06-mutant.log` 4 failed / 107 passed (K06 mirror + 3 matrix tests); head run `k06-head.log` 1/1.
- Probe files: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-review-r1/k06-mirror.test.ts`, `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc567-review-r1/dse-mutant/` (scratch only).
- Working tree: draw-steel-elements `status --porcelain` empty, HEAD `edd16374`.

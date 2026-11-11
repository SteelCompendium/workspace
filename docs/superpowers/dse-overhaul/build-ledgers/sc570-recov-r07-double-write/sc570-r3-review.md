# SC-570 r3: independent review of the RECOV-R07 test fix

**Executive summary**
- **Verdict: LAND-READY.** dse head `ce4937ef` (commits `3d39bd24` jest, `ce4937ef` e2e) on base `e5b6f9f2`. `origin/develop` is still `e5b6f9f2` (fetched 2026-11-11 16:10).
- **Findings: 0 HIGH, 0 MED, 1 LOW, 4 INFO.** The LOW is a wording gap in the skill proposal: the reproduction technique names no file or call. Nothing blocks the landing.
- **The TEST verdict holds.** 152 jest probes ran on the real view with fake timers. They swept the popover, the strip Catch Breath, a direct marker click and Undo across 11 gaps and 7 write latencies (held writes released in reverse order). Every write wrote a state that really existed, the last write was always the right final state, and no Recovery was ever spent twice.
- **The e2e fix does not mask a real double write.** With the fix in place, a product mutant that writes twice per Catch breath press (MF) goes red (`Expected: 1 Received: 2`), both unforced and with the 250 ms lag. A mutant that spends 2 Recoveries (MA) also goes red, on the note content. One mutant is now invisible to the e2e: Catch breath flushing the pending stepper write first (MB). Base spec red, fix spec green. jest P1 kills it, as the ledger intended.
- **Red on base, green with the fix (r1 probe, applied uncommitted and reverted):** with the 250 ms lag, base RECOV-R07 FAIL 1 vs 2 and fix 1/1 ok. With CPU throttled 12x, base FAIL 1 vs 2 and fix 1/1 ok. Page logs show every write's content was correct.
- **The jest cases are not vacuous.** All 5 of my product mutants (MA, MB, MC, MD, ME) are killed by at least one new case. All three new cases use fake timers only and never read the wall clock.
- **Gates I measured:** tsc (incl. e2e) rc 0 · lint rc 0 · jest **7286 passed / 2 skipped** (262 suites + 1 skipped, fresh worktree) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`**, rc 0, started at loadavg 16.2 · `main.js` `3c44cb8b…b536238` and `styles.css` `5e5ff488…dc2b27` are byte-identical (`cmp`) to a clean `git archive e5b6f9f2` build. I did not re-run lifecycle: r2's logs read 21+16+9+4+6 = 56/56, and part 5 has the expected ids.
- **Hygiene:** only `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` and `test/dom/elements/staminaRecoveries.test.ts` changed. No product source, no CHANGELOG, no bracketed id in any title, and no AI attribution in the commits. dse `git status --porcelain` was empty before and after. The superproject's ` M draw-steel-elements` was already there when I started.

Scratch (every evidence file below): `Z = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r3-review-Zp8w`.

---

## 1. Is the TEST verdict right? (runtime probe)

I wrote an uncommitted jest probe and deleted it after the run (`Z/zp8w-probe-body.ts.txt`, runner `Z/zp8w-jest-probe.sh`). It uses the real `ElementPipeline` + `staminaBarElement` + `ElementView.persist` with fake timers, starting from the e2e fixture (12/30 Stamina, 3 of 6 Recoveries). The host's `replaceSource` records each write. It either resolves after a latency L or holds the write until the end and then releases all held writes in **reverse** order. Result: **152/152 passed** (`Z/zp8w-probe-real.log`; every write per case is in `Z/zp8w-probe-real-results.txt`).

| Sequence | Sweep | Writes observed | Final |
|---|---|---|---|
| S1 popover − + +, gap g, Catch breath | g ∈ {0,1,100,399,400,401,500,799,800,801,1600} × L ∈ {0,10,399,400,401,1000,hold} | g < 400: `[[3,22]]`; g ≥ 400: `[[4,12],[3,22]]` | (3,22) every case |
| S2 popover − + +, Catch breath, Undo | g ∈ {0,399,401} × undo gap ∈ {0,399,401,1000} × L ∈ {0,401,hold} | e.g. `[[4,12],[3,22],[4,12]]` | (4,12) every case |
| S3 strip Catch Breath ×2 (popover off) | g ∈ {0,1,399,400,401,1000} × 3 L | `[[1,30]]` or `[[2,22],[1,30]]` | (1,30): two spent, the second heal clamped at max |
| S4 direct marker restore (3→4), strip Catch Breath | 5 gaps × 3 L | `[[3,22]]` or `[[4,12],[3,22]]` | (3,22) |
| S5 Catch breath, Undo, Catch breath | 2 gaps × 3 L | `[[2,22]]` or `[[2,22],[3,12],[2,22]]` | (2,22) |

I found no sequence that spends a Recovery twice, loses a heal or leaves a stale value as the last write. Why it holds: `flushPersist` serializes `this.model` at flush time (`src/framework/view.ts:361`). The view writes call `ReadingModeBlockHost.replaceSource` with `{fromView: true}`, and nothing async runs before `vault.process` (`ReadingModeBlockHost.ts:1048` awaits only for `options.pin`). Obsidian's queue therefore keeps call order. The real-Obsidian page logs from my forced runs (§2) show the same content order.

## 2. Does the e2e fix mask a real double write?

Runner: `Z/zp8w-e2e-probe.sh`. It applies r1's `k7q2-driver-probe.diff` only when lag or CPU throttling is set, swaps in the base spec when asked (`git show e5b6f9f2:<spec>`) and applies one product mutant. It then runs `--only=RECOV-R07 --shards=1` and reverts with `git checkout --`. Every log ends `after-revert status: []`.

| Run | Spec | Forcing | Mutant | Result | Log |
|---|---|---|---|---|---|
| lag250-base | base | lag 250 | none | **FAIL Expected 1 Received 2** | `Z/zp8w-e2e-lag250-base.log` |
| lag250-fix | fix | lag 250 | none | ok | `Z/zp8w-e2e-lag250-fix.log` |
| cpu12-base | base | CPU 12x | none | **FAIL Expected 1 Received 2** | `Z/zp8w-e2e-cpu12-base.log` |
| cpu12-fix | fix | CPU 12x | none | ok | `Z/zp8w-e2e-cpu12-fix.log` |
| unforced-fix | fix | none | none | ok | `Z/zp8w-e2e-unforced-fix.log` |
| MF-fix | fix | none | **MF**: Catch breath persists + flushes after `recoveries -= 1`, then heals (2 disk writes per press: (3,12), (3,22)) | **FAIL Expected 1 Received 2** | `Z/zp8w-e2e-MF-fix.log` |
| MF-fix-lag250 | fix | lag 250 | MF | **FAIL Expected 1 Received 2** | `Z/zp8w-e2e-MF-fix-lag250.log` |
| MA-fix | fix | none | **MA**: Catch breath spends 2 | **FAIL** content `recoveries: 2` vs 3 | `Z/zp8w-e2e-MA-fix.log` |
| MB-base | base | none | **MB**: Catch breath flushes the pending stepper write first | **FAIL Expected 1 Received 2** | `Z/zp8w-e2e-MB-base.log` |
| MB-fix | fix | none | MB | ok (the coverage the e2e gives up; jest P1 kills MB, §3) | `Z/zp8w-e2e-MB-fix.log` |
| MC-base / MC-fix / MC-fix-lag250 | both | none / lag 250 | **MC**: a second `persist()` 500 ms after Catch breath, same content | ok on all three | `Z/zp8w-e2e-MC-*.log` |

Page-side write logs (`Z/k7q2-events-zp8w-*.jsonl`):
- lag250-base: `mark@6227 | process-cb(4,12)@6369 modify@6370 | click catch-breath@6662 | process-cb(3,22)@7065`. The stepper write lands after the mark, which is the r1 mechanism.
- lag250-fix: `process-cb(4,12)@6213 modify@6217 | mark@7117 | click@7710 | process-cb(3,22)@8113`. The stepper write is settled before the mark, and the count is 1.
- MF-fix-lag250: `mark@7324 | click@7855 | process-cb(3,12)@7870 modify | process-cb(3,22)@8260 modify`. The counted double write is real.
- MC-fix-lag250: the second persist runs `process-cb(3,22, unchanged=true)` with **no** modify. Obsidian does not write byte-identical content, so this is not a disk write (INFO-1).

Failure bundles copied out: `Z/zp8w-bundle-lag250-base-RECOV-R07`, `Z/zp8w-bundle-cpu12-base-RECOV-R07`.

## 3. The jest cases (`test/dom/elements/staminaRecoveries.test.ts:559-631`)

- **They assert content.** `written()` maps every recorded write to `[recoveries, current_stamina]`, and each test pins the whole list with `toEqual`. That pins count, content and order together.
- **Mutant kill matrix** (`Z/zp8w-jest-mutant.sh`; product reverted after each run, `after-revert status: []`). Real code: 31/31 (`Z/zp8w-jest-one-real.log`).

| Mutant | Change | Killed by (new cases) | Log |
|---|---|---|---|
| MA | Catch breath `remaining - 2` | P1, P2, P3 (+ the old D7 Catch Breath test) | `Z/zp8w-jest-mutant-MA.log` |
| MB | `this.flushPendingWrite()` at the top of `catchBreath` | P1 | `Z/zp8w-jest-mutant-MB.log` |
| MC | second `persist()` 500 ms later | P1, P2, P3 | `Z/zp8w-jest-mutant-MC.log` |
| MD | after the first write settles, `persist()` once more (stale re-write) | P1, P3 (+ SC-132 marker persist test) | `Z/zp8w-jest-mutant-MD.log` |
| ME | flush serializes the round's first-click snapshot | P1, P2, P3 | `Z/zp8w-jest-mutant-ME.log` |

r2's own M1-M3 (short debounce, click-time snapshot, drop-while-in-flight) are also killed (r2 logs). All three new cases are needed: MB is killed by P1 only.
- **Stability:** `jest.useFakeTimers()` in each case. The file-level `afterEach` (:90) restores real timers. Only `advanceTimersByTimeAsync` is used, never a wall-clock wait. P3's `releases[1]()` would throw if the second write never started, so the in-flight path is checked implicitly. The full suite passed while my own e2e and other agents' runs pushed loadavg to 18.4.
- **Conventions:** the section header matches the file's other headers (:278, :559), the `describe('SC-570: …')` matches `'SC-132: …'`, and the case reuses `makeDeps`, `makeHost`, `pips` and `PERSIST_DEBOUNCE_MS`. The fixture YAML matches `e2e/vaults/shipped/Stamina/recoveries.md` byte for byte in its fields. INFO-3 has one nit.

## 4. Diff hygiene

`git diff --name-only e5b6f9f2..HEAD` lists only `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` (+4) and `test/dom/elements/staminaRecoveries.test.ts` (+74). The e2e title `[RECOV-R07] …` is unchanged. The commit bodies contain no `[SC-` and no Claude, Co-Authored-By or "Generated" lines (grep count 0), and both commits are authored by Scott Tomaszewski. There is no CHANGELOG change in the dse repo, and the superproject was unchanged by this branch beyond its pointer.

## 5. The skill proposal (`sc570-skill-proposal.md`)

- The old bullet exists verbatim at `.claude/skills/dse-verify/SKILL.md:180`, and the replacement's mechanism text is accurate. My cpu12-base log shows the stepper flush `process-cb(4,12)@7204` after `mark@6846`, which matches "flushed after `waitForWrite`'s mark". The CURRENT line's numbers (jest 7286 / 2, e2e 264/269 164/164, the hashes) match what I measured. The authoring rule bullet is correct and general: `waitForWrite` counts every modify since its mark (`e2e/driver/dse.ts:534-544`).
- It is not minimal, but proportionate: it turns a "load flake, re-run" note into "a red is now a real signal" plus the mechanism. See LOW-1 for the one gap.

## 6. Gates (measured on `ce4937ef`)

- `Z/zp8w-static.log`: tsc rc 0 (`Z/zp8w-tsc.log`, banner only), lint rc 0 (`Z/zp8w-lint.log`, only the existing .eslintignore warning), jest rc 0.
- `Z/zp8w-jest-full.log`: `Test Suites: 1 skipped, 262 passed, 262 of 263 total` / `Tests: 2 skipped, 7286 passed, 7288 total` / 74 s, i.e. 7283 + 3.
- `Z/zp8w-e2e-full.log`: `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`, rc 0, 16:18:02 to 16:20:34, loadavg 16.19 at start and 9.72 at end. RECOV-R07 ok in 1631 ms.
- `Z/zp8w-build.log`: head and `git archive e5b6f9f2` production builds have equal sha256 (`3c44cb8bf123a5699728963d2ade1cb655838f948f7ffbb504aab9075b536238` / `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`), and `cmp` reports IDENTICAL for both. The reference tree is `Z/zp8w-ref-e5b6f9f2` (no git worktree was added). Shots, freeze and parity carry over.
- Lifecycle was not re-run. I checked r2's `lifecycle-part{1..5}.log` done lines: 21/21, 16/16, 9/9, 4/4, 6/6, and part 5 has ids `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`. The plugin bundle is byte-identical, and lifecycle runs none of the changed files.

---

## Findings

### LOW-1: the skill proposal's reproduction recipe names no file or call
`sc570-skill-proposal.md` §1, replacement bullet: "Reproduce a debounce-straddle race deterministically by delaying the driver's page-eval replies by 250 ms or throttling the renderer 12x (`Emulation.setCPUThrottlingRate` over CDP)". r1's probe diff lives only in a session `/tmp` scratch dir, which will be gone.
**Scenario:** a future agent chasing the next count flake has to rediscover where the delay goes.
**Fix:** add the hook points to that sentence: "an env-gated sleep after `ev()` returns in `e2e/driver/page.ts`, or `browser.sendCommandAndGetResult('Emulation.setCPUThrottlingRate', { rate: 12 })` in a `beforeEach` in `e2e/driver/session.ts`". This is a wording change for the owner or dispatcher; the code does not change.

### INFO-1: `waitForWrite` cannot see a content-identical re-persist
Mutant MC (a second `persist()` with the same content) is green on **both** the base and the fixed spec. The page log shows `vault.process` ran with `unchanged=true` and fired no modify, because Obsidian does not write unchanged content. This was already true before the change; the fix does not cause it, and it is harmless (no disk write). jest P1-P3 catch it (they count `replaceSource` calls). No action.

### INFO-2: one coverage path moves from e2e to jest, as the ledger intended
Mutant MB (Catch breath flushes a pending stepper write first, so one press inside the window makes two disk writes) went red on the base spec and is green with the fix. It is now caught only by jest P1. This is the "one-window path the e2e now gives up" in the ledger's 2026-11-11 amendment, and P1 kills it. No action.

### INFO-3: the new helper duplicates `mountRecoveries` instead of extending it
`staminaRecoveries.test.ts:580-596` `pressSteppers` rebuilds deps, prefs, host and pipeline because `mountRecoveries` (:98-110) takes no `replaceSource` override. Adding `replaceSource?` to `mountRecoveries`' overrides would save about 6 lines. Optional; it does not block the landing.

### INFO-4: my 14 e2e runs (13 single-test runs plus the full run) pushed r2's run dirs out of `e2e/.out`
`e2e/.out` keeps its last 12 runs. r2 had already copied its RECOV-R07 bundles to its own scratch (`sc570-r2-impl-x4Qm/bundle-*`), so no evidence was lost. Noted for traceability only.

## Not done / limits
- The jest probes use a mock host, so they do not model Obsidian's rebuild or adoption after each write. The real-Obsidian content order comes from the page logs above and from r1 and r2's forced runs. All of them show correct content in every write.
- I re-checked only the "Catch breath card-level input before a write wait" part of r1's static shape scan (`k7q2-scan.txt`). The other hits I filtered open modals that do not write. That agrees with r1: RECOV-R07 is the only test of its shape.

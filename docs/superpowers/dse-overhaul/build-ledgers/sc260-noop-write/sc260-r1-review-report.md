# SC-260 round 1: independent review report

**Executive summary**
- Verdict: **APPROVE_WITH_NITS**. Reviewed `f79c0d6` on `sc260-noop-write` (base `c78a06b`). O-1..O-4 are all honoured: there is no cached-body shortcut, the pin is gated on `section && changedContent` inside the callback, the return value and ticket drop are unchanged, and the sidebar is untouched.
- Gates I re-measured: tsc (incl. e2e) clean · lint clean · jest **4790 passed / 1 skipped / 227 of 228 suites** · lifecycle **25/25** (G-S8 ok) · e2e **`63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`**. I did not re-run shots, freeze or parity because the diff touches no CSS. The implementer's numbers for those three match the expected baseline.
- Ordering is confirmed against the real Obsidian 1.14.4 `app.js`. `adapter.process` is queued. It reads the file, calls the callback synchronously, and skips the write when `o===r`. Only then does it write and reconcile, which fires `modify`. `changedContent` is exactly Obsidian's write criterion, so the pin is taken if and only if a write happens, and always before it.
- The tests are not vacuous. With the source reverted, all 3 new tests fail. With the pin gated on `section` only, or on `wrote`, test (a) fails. On base, the order assertion fails as `pin, process-start, …`.
- Findings: 0 CRITICAL, 0 HIGH, 1 MEDIUM (pre-existing gate gap, not caused by this change: G-S8 passes with the pin fully disabled), 2 LOW (a pin throw now advances `knownBody` and drops the next write; one stale test title), 3 INFO.

## Findings

### MEDIUM-1 (pre-existing, not introduced by SC-260; follow-up, not a blocker): lifecycle G-S8 does not discriminate the SC-198 pin
- `visual-harness/obsidian-lifecycle.mjs:1164-1180` (scenario `G-S8`).
- Probe: I disabled the pin in the source (`if (section && changedContent && Date.now() < 0) …`) and confirmed the built `main.js` contained the mutation (`a&&i&&Date.now()<0&&(…g.pin(this.containerEl))`). I then ran `npm run obsidian-lifecycle -- --only=G-S8` on Obsidian 1.14.4 and got **`G-S8 ok (scrollTop held at 2779 over 110 frames)`**, rc=0. Log: `sc260-rev-gs8nopin-1792432383.log`.
- Consequence: no real-Obsidian gate shows that the pin does anything on 1.14.4. For SC-260, the evidence that SC-198 did not regress therefore rests on jest plus the code reading below, not on G-S8. Two explanations are possible: 1.14.x no longer clamps (SC-198 was measured on 1.13.7), or the G-S8 note or write does not reproduce the clamp (for example, SC-340 adoption keeps the tracker DOM).
- Prescribed fix (owner files a Backlog ticket; out of scope here):
  1. Re-measure the SC-198 root-cause doc's scenario C on 1.14.4 with the pin off.
  2. If the clamp still reproduces, make G-S8 discriminating. Use a note shape that clamps unpinned, and assert that `data-dse-scroll-pin` is present during the write.
  3. If it does not reproduce, decide whether the pin should be retired.

### LOW-1: a throw from `pin()` now aborts the write after `knownBody` has advanced, so the next write is dropped
- `src/framework/host/ReadingModeBlockHost.ts:409`. The pin is now taken after `this.knownBody = newSource` at `:398`.
- Scenario: suppose `pin()` throws inside the callback. Obsidian rejects before writing, because `t(r)` sits outside the write's `try`. The file is unchanged, but `knownBody` already holds the unwritten body. The next `replaceSource` fails the section-path body check, takes the durable locate looking for a body that is not on disk, returns `'miss'`, resolves `false` and shows the dropped-write Notice.
- Measured with a throwaway jest probe. Head: `{"knownBodyAfterThrow":"round: 2","second":false,"disk2HasRound3":false,"warns":1}`. Base `c78a06b`: `{"knownBodyAfterThrow":"round: 1","second":true,"disk2HasRound3":true,"warns":0}`. Logs: `sc260-rev-probe-1792432332.log` (head) and `sc260-rev-probeBASE-1792432359.log` (base). Probe source: `sc260-rev-probe.test.ts.txt`. The ticket is still dropped correctly in `finally`.
- Reachability: in practice none. `PreviewScrollPin.pin` only calls `closest`, `defaultView`, `Map`, `setProperty`/`setAttribute` and `setTimeout`, none of which throw for an attached Element. The change is still a fail-safety step backwards, and the new comment ("cannot abort the write") is load-bearing on that reasoning.
- Prescribed fix: a cosmetic pin must never cost a write. Wrap it in `try { this.scrollPin?.pin(this.containerEl); } catch (e) { console.warn('[DSE] scroll pin failed', e); }`, and optionally add a jest row with a throwing pin that asserts the write lands.

### LOW-2: stale test title
- `test/dom/framework/previewScrollPin.test.ts:159`: `'pins BEFORE vault.process runs — the pin must be up when Obsidian sees the modify'`. The pin now runs inside `vault.process`. The assertion (`contentAtPin[0] === NOTE`) is still valid; only the title is wrong.
- Fix: rename it to something like `'pins inside vault.process, before the write lands — the pin must be up when Obsidian sees the modify'`.

### INFO-1: ordering, from the real Obsidian 1.14.4 bundle (`~/.cache/dse-e2e-obsidian/obsidian-app/obsidian-1.14.4.asar`, `app.js`)
- Desktop `FileSystemAdapter.process` (offset ~552177): `this.queue(… readFile → o=t(r); if(o===r) return r; … writeFile(i,o) → applyWriteOptions → … reconcileInternalFile)`.
- The mobile adapter (~1349986) has the same shape.
- `Vault.process` (~1426705) wraps it with `saving++`, `immediate = () => file.cache(null)` and `cache(result)`.
- Conclusions:
  - The callback is called exactly once and synchronously.
  - No write and no `modify` can precede its return.
  - A throw rejects before any write.
  - The no-op skip is strict string equality, which is identical to `changedContent = next !== content`.

### INFO-2: concurrent writes
- `adapter.process` is queued, so overlapping `replaceSource` calls on one host each see the previous write's result.
- Probe on head: two overlapping writes of the same body give 1 pin (base gave 2). Overlapping writes that differ give 2 pins; the second refreshes the TTL and keeps `px`. The final disk state is correct and all writes resolve `true`.
- One theoretical difference: the second write's pin is now taken after the first write has landed. If the first write's rebuild has already detached this host's `containerEl`, `closest()` returns null and the TTL is not refreshed. The first pin still covers that window on the same shared scroller, so this is negligible.

### INFO-3: O-4 and CHANGELOG
- `SidebarBlockHost` is untouched. I agree with the implementer that there is no pin cost there.
- The CHANGELOG bullet sits at the top of `## 7.0.0 (unreleased; …)` in the established `[FIX]` style. That is correct, because no `## Unreleased` heading exists.

## Test non-vacuity
- Source reverted (tests kept): `Tests: 3 failed, 14 passed, 17 total`. All three SC-260 tests failed: (a) got 1 pin call, (b) got order `pin(disk=old), process-start, …`, (c) got 2 pin calls. Log: `sc260-rev-revertRED-1792432344.log`.
- Mutation, pin gated on `section` only (inside the callback): (a) fails, 1 failed / 15. Log: `sc260-rev-mutSectionOnly-1792432359.log`.
- Mutation, pin gated on `section && wrote`: (a) fails, 1 failed / 15. Log: `sc260-rev-mutWrote-1792432359.log`.
- The order assertion in (b) really observes order. It wraps the mock `process`, records `pin(disk=old|new)` against the live mock content, and fails on base. A pin after the `await` would record `process-done` before `pin(disk=new)`.

## Tree hygiene
- `git status --porcelain` was empty before and after, and HEAD stayed at `f79c0d6`.
- The throwaway probe test was removed.
- The ignored `main.js` was rebuilt from HEAD after the G-S8 mutation run, and the mutation is confirmed absent.

## Logs (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/)
| What | Log file(s) |
|---|---|
| Gate script and result codes | `sc260-rev-gate-1792431843.sh`, `sc260-rev-rc-1792431843.log` |
| tsc | `sc260-rev-tsc-1792431843.log` |
| lint | `sc260-rev-lint-1792431843.log` |
| jest | `sc260-rev-jest-1792431843.log` |
| lifecycle | `sc260-rev-lifecycle-1792431954.log`, `sc260-rev-rc2-1792431954.log` |
| e2e | `sc260-rev-e2e-1792432213.log`, `sc260-rev-rc3-1792432213.log` |
| Pin-throw and concurrency probe | `sc260-rev-probe-1792432332.log` (head), `sc260-rev-probeBASE-1792432359.log` (base), `sc260-rev-probe.test.ts.txt` (probe source) |
| Revert and mutation runs | `sc260-rev-revertRED-1792432344.log`, `sc260-rev-mutSectionOnly-1792432359.log`, `sc260-rev-mutWrote-1792432359.log` |
| G-S8 with the pin disabled | `sc260-rev-gs8nopin-1792432383.sh`, `sc260-rev-gs8nopin-1792432383.log` |
| Rebuild of `main.js` from HEAD | `sc260-rev-rebuild-*.log` |

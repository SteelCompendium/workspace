# SC-460 scoped re-review — fix round 1 (dse `sc460-stray-cr` @ 84636a9, base `ba20072`)

**Executive summary**
- VERDICT: **LAND-READY**. Findings: 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 3 INFO. R1's MEDIUM-1, MEDIUM-2 and LOW-1 are all closed.
- Rebase: `range-diff 188755b..3045082 ba20072..7f7e3d4` shows all 4 commits as `=`, so nothing was resolved by hand. `ba20072` is CSS-only (SC-366). The pre-fix bundle at `7f7e3d4` is sha-identical to the R1 head bundle (`e002a3b9…`).
- The source delta (`7f7e3d4..84636a9`) is `lineEnding.ts` only, and it is exactly the R1 prescription (`Eol` widened, the CR-only rule in `detectEol`, `toEol` uses `eol`). The remaining 6 files are tests and G-S12. `aliasAtLine` (SC-471) is untouched.
- MEDIUM-1, real Obsidian 1.14.4 on the head bundle, my R1 probes re-run:
  - Reading view 30/30, Live Preview 14/14 and sidebar 13/13 (+4 controls) are byte-exact under the ruling oracle; pure-CR stays CR-only on all three.
  - The pure-CR no-op host write is now a byte no-op (0 `modify`).
  - LF, CRLF and mixed results are unchanged from R1.
  - Fuzz under the ruling: 27,000 cases, 0 mismatches.
- MEDIUM-2 and LOW-1: every mutant is now killed by the touched tests (control 313/0): M2 1, M3 1, M4 6, M5 2, M15 21, M17 1, M18 2, plus new M19 (CR-only rule removed) 10 and M20 (`toEol` CRLF-only) 2.
- Gates on 84636a9 (re-run): tsc rc 0 · lint rc 0 · jest **5329 passed / 1 skipped / 230 of 231** · lifecycle **28/28** · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`. G-S12 FAILS on the pre-fix bundle (`7f7e3d4`: "a CR-only note picked up an LF") and is ok on head.
- shots 572 / 0 FAIL, freeze 276/276 and parity 0/0/24 are the implementer's numbers at 84636a9, reused because the delta provably cannot change rendering (INFO-1).
- Tree: `git status --porcelain` is identical before and after (dse empty; superproject ` M draw-steel-elements`). Head is still 84636a9, nothing was committed, and the scratch worktrees are removed.

## INFO
1. **Why reusing shots/freeze/parity is valid:**
   - The only `src` change is `detectEol`/`toEol`. Their only callers are the write splice (`fenceLine.ts:100`, `:128`) and the encounter append inside `vault.process` (`encounter/view.ts:498-499`).
   - The built `main.js` diff between `7f7e3d4` and `84636a9` is exactly those two functions (2 hunks). `styles.css` is byte-identical.
   - The rendering change from the new base (SC-366 CSS) is covered by the implementer's shots/freeze/parity run at 84636a9 (`logs/sc460-fix1/final/`: 572 PNGs, pressed toggle parity OK (96), host-leak 112/672, `freeze OK (276/276 …)`, `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`).
2. **G-S12 extension: sound.**
   - The CR-only fixture runs through a Reading view click, a Live Preview click, a sidebar pin and a panel write.
   - For CR-only notes the lone-CR count check is replaced by "no `\n` anywhere" plus "outside text identical". That is reasonable, because the block's own line count may change.
   - The `outside`/`blocks` regex change (`\n```` → `[\r\n]````) matches the same spans in LF and CRLF notes.
   - Cosmetic: one `t.expect(...)` line in the new step 4 has no trailing semicolon. Lint does not cover `visual-harness/`. No action needed.
3. **Stale-section tests: faithful.**
   - The 5 cases are my R1 cases, with the hint numbers as I computed them (D: 17-21, E: 16-20).
   - Mutant results match R1's kill matrix: B and C kill M5, D kills M3, E kills M2, and all five kill M4 and M15.
   - The `staleWrite` helper's argument order is correct.

## Brief items
1. **MEDIUM-1:**
   - Reading view: `RV/pureCR` writes `…\r\`\`\`ds-counter\rmax_value: 20\r…\r\`\`\`\r\rBELOW\r`, which equals the oracle.
   - Live Preview: identical.
   - Sidebar stamp and panel write: the block's breaks are `['\r']`.
   - The other 29 Reading view, 13 Live Preview and 12 sidebar results match R1.
   - Multi-step: durable relocate is exact in Reading view and Live Preview; the deleted block shows exactly 1 Notice.
   - Fuzz `FUZZ_POLICY=ruling`, 3,000 per mode: 0 mismatches in all 9 modes.
2. **MEDIUM-2:** the three reverts (`:80` M2, `:636` M3, `:215` M5) fail 1, 1 and 2 tests. M4 fails 6 and M15 fails 21.
3. **LOW-1:** M17 fails "the appended tracker is handed over at its Obsidian-numbered fence line, with a lone CR above it".
4. **Nothing else changed:**
   - `git diff --stat 7f7e3d4 84636a9`: `src` = `lineEnding.ts` (+10/-8) only.
   - Tests: `lineEnding`, `reading-mode-host-durable`, `sidebarBlockHost`, `registration`, `sidebarEncounterHandoff`, plus the G-S12 harness.
   - The only test line removed is the old `'a\rb\rc' -> '\n'` row (now `'\r'`; M19 proves it guards).
   - SC-471 is untouched: in real Obsidian, a pin from the open-fence line is still a silent no-op, exactly as at base.
5. **Gates:** see the summary.

## Evidence — `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/logs/sc460-review-1792557074/`
- **Rebase and delta:** `range-diff.txt`, `delta.diff`
- **Gates:**
  - `gate-tsc.log`, `gate-lint.log`, `gate-jest.log`, `gate-rc.txt`
  - `gate-lifecycle.log`, `gate2-rc.txt`
  - `gate-e2e.log`, `gate3-rc.txt`
  - G-S12 pre-fix vs head: `gs12-prefix.log`, `gs12-head.log`
- **Real Obsidian:** `rv-read-head.log`, `rv-RV-LP-head.log`, `rv-RV-SB-head.log`, `rv-multi-head.log`; harness `sc460-review-probe-scenarios.mjs`
- **Fuzz:** `fuzz-head-ruling-3000.{json,log}`
- **Mutations:** `mutation.log`, `mutation-summary.json`, `mut-*.json`, runner `sc460-review-mutate.py`
- **Tree state:** `status-before-{dse,super}.txt`

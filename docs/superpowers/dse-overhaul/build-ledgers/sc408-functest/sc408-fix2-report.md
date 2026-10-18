# SC-408 fix round F2: report

**Executive summary**
1. Verdict DONE, with one thing the brief assumed that is not true (item 5 below). DSE `sc408-functest` head `a066544`; superproject doc commits `279895b`, `74795d7`, `d72c46b` (skill + PROJECT.md only; submodule pointer not committed). Nothing pushed. No `src/` change.
2. **`origin/develop` moved** off `be4f002` to `566888a` (SC-411 GIF tooling, SC-390 statblock). Rebased `sc408-functest` onto it (21 commits, one conflict: `package-lock.json`, resolved by taking upstream's lock and regenerating from `package.json`; 0 of 763 existing packages changed version). All my earlier shas changed; the F1 head `1a33560` is now `cc05e7d`.
3. e2e: **71 scenarios = 59 ok + 12 known-bug, 0 failed, coverage 47/47 pairs**, exit 0, 5 back-to-back full runs at `--shards=4` all green (41-64 s; the host was loaded by other agents, load 6 to 14). New known bugs: SC-432 x1 (e2e) + 2 (jest), SC-433 x3 (e2e) + 4 (jest).
4. Gates: tsc clean, lint clean, jest **4720 passed / 1 skipped / 226 of 227 suites** (F1's 4666 plus upstream's new tests from the rebase plus my 2 new cases; the other 6 jest markers are conversions of existing tests), lifecycle **25/25** (4m18s), shots **572 PNGs, 0 FAIL**, freeze **276/276**, parity **0 GAPs / 0 undeclared / 24 declared**.
5. **Brief assumption that does not hold:** "walking back a pending in-session increase" does NOT work with the temp "-" today. The code takes `max(typed, running)`, so "-" can never lower temp, even after "+" (probed: 5 -> "+" "+" = 7, "-" stays 7). So the plain driver of `sedit.temp.dec x click` asserts a weaker invariant that holds both today and after SC-433: after a "-" press the Apply label always agrees with the temp field, and nothing is written (`[STAM-T11]`).
6. Required-landing docs done: dse-verify skill, PROJECT.md section 4, DSE `AGENTS.md`, `e2e/README.md` (Scott's words quoted).

## Converted / retitled tests
| Old | New | File:line |
|---|---|---|
| e2e `[STAM-T03]` typed lower temp changes nothing (RAW take-higher) | `knownBug('SC-433')` `[STAM-T03] a typed temp value lower than the current is applied as typed: 3 over 5 is a loss of 2` (label "Lose 2 Temp Stamina", field 3, Apply writes 3), pinned on its own message | `e2e/specs/stamina-bar/stamina-modal.e2e.ts:161` |
| e2e `[STAM-T04]` temp "-" at 5 does nothing `[current behaviour — ruling pending SC-408]` | `knownBug('SC-433')` `[STAM-T04] the temp "-" at temp 5 lowers it by one: Apply writes temp_stamina 4` | `stamina-modal.e2e.ts:182` |
| e2e `[STAM-T10]` negative temp clamps to 0 so changes nothing | `knownBug('SC-433')` `[STAM-T10] ... clamps to 0 and is applied as typed: temp goes to 0` ("Lose 5 Temp Stamina") | `stamina-modal.e2e.ts:231` |
| (new, plain) | `[STAM-T11]` after the temp "-" is pressed the Apply label always agrees with the temp field and nothing is written: the plain driver of `sedit.temp.dec x click` | `stamina-modal.e2e.ts:200` |
| e2e `[STAM-Q13]` Spend Recovery on a bar that does not track Recoveries ... `[current behaviour — ruling pending SC-408]` (a hero bar) | same test, plain pin kept, retitled `... on a hero bar with no pool heals for free, with no limit [current behaviour — SC-432 will relabel + confirm]` | `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:178` |
| (new, creature case) | `knownBug('SC-432')` `[INIT-STAM-Q13] Spend Recovery is disabled for a creature` on a hurt Ogre (fixture `Initiative/hurt.md`, 20/60; at full Stamina the button is disabled anyway, so the creature is hurt on purpose) | `e2e/specs/initiative/stamina-entry.e2e.ts:132` |
| jest "typing a grant lower than current temp leaves temp unchanged (takes the higher)" | `test.failing` "typing a temp value lower than the current one applies it as typed: 3 over 5 is a loss of 2 [known bug SC-433]" | `test/dom/views/stamina-edit-modal.test.ts:518` |
| jest "the minus button cannot walk temp below the session-start value ..." | `test.failing` "the minus button lowers temp by one: at temp 5 Apply writes 4 [known bug SC-433]" | `stamina-edit-modal.test.ts:540` |
| jest "a later, larger typed grant still takes the higher ... (9 then 3 stays 9)" | `test.failing` "a typed temp value after an earlier typed grant is applied as typed (9 then 3 gives 3) [known bug SC-433]" | `stamina-edit-modal.test.ts:558` |
| jest A2 "minus is blocked at the running position, not the stale 5" | `test.failing` "A2: ... then minus lowers the running position to 1 [known bug SC-433]" | `stamina-edit-modal.test.ts:590` |
| (new, jest) | `test.failing.each` "[Q13] Spend Recovery is disabled for a creature [known bug SC-432]" (creature 10/30 with no pool, and with a tracked pool) | `test/dom/views/stamina-edit-modal-matrix.test.ts:466` |
| jest "Spend Recovery heals floor(max/3)" (makeModal defaults to hero, no pool) | suffix `(a hero with no pool) [current behaviour — SC-432 will relabel + confirm]`, still a plain test | `stamina-edit-modal.test.ts:146` |
| jest "legacy block (no recoveries field): Spend Recovery still real-disables ..." (hero, no pool) | suffix `[current behaviour — SC-432 will relabel + confirm]`, still a plain test | `stamina-edit-modal.test.ts:262` |

Checked that every jest marker fails for the right reason: with `.failing` flipped off, the 6 cases fail on the intended assertions (Expected -2 / Received 0, Expected -1 / 0, Expected -2 / 4, Expected -4 / -3, Expected true / false x2) and nothing else; reverted. e2e markers are pinned by `failsWith` on a unique message, as in F1.

Untouched on purpose: the `kind: 'creature'` rows of the tracked-pool Spend Recovery matrix (`stamina-edit-modal-matrix.test.ts` Q06-Q10 table). They exercise the `isHero: false` path with a pool no shipped creature has; SC-432's fixer must rewrite them. Recorded in the comment above the new describe. No jest test carried the "ruling pending SC-408" title, so jest pins were found by behaviour.

## Coverage
Final full run `coverage: 47/47 pairs` (no manifest change). Pairs touched: `sedit.temp.dec x click` (now plain-driven by T11 only; T04 is the marker), `sedit.temp.dec x click-disabled` (T05), `sedit.temp.input x type|blur` (T02, T09), `sedit.spend-recovery x click` (Q06, Q08, ...). The gate would have failed had T11 not been added.

## Docs
- `.claude/skills/dse-verify/SKILL.md` (superproject): the e2e paragraph now says `npm run e2e` is REQUIRED to land ANY `draw-steel-elements` change, citing "Scott, SC-408, 2026-10-18: 'make it required to land future changes'"; step 4b and the CURRENT block carry the final numbers (jest 4720 / 226 of 227, e2e 59/71 + 12 known-bug, 47/47, shots 572, freeze 276/276, parity 0/0/24, the 12 known-bug tickets listed).
- `.claude/orchestrate/PROJECT.md` section 4: battery list now reads "tsc, lint, jest, lifecycle, e2e, shots, freeze check, parity last, optional obsidian-shots", with lifecycle and e2e stated as required to land (superproject commit `279895b`, together with the skill).
- DSE `AGENTS.md` (`npm run e2e` bullet) and `e2e/README.md` (a bold "Required gate" paragraph at the top): commit `a066544`.

## Gates (logs in `/tmp/claude-1000/sc408-fix2/`)
- `gate-tsc.log`, `gate-lint.log` clean. `gate-jest.log`: 4720 passed / 1 skipped, 226 of 227 suites. The brief expected 4666 / 224 of 225 plus mine; the rebase onto `566888a` brought upstream's new suites and tests (I did not measure the rebased tree before my edits, so 4718 is inferred as 4720 minus my 2 new `.each` cases), and 6 of the jest markers are conversions that keep their counts.
- `gate-lifecycle.log`: `done: 25/25 ok, 0 failed`, 4m18s (host load 14 at start).
- e2e: `loop.txt` (5 runs, all `rc=0`, `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`; wall 63.7 first, then 41.3 / 43.5 / 42.5 / 43.6 s; the earlier quiet-host figure was 36 s).
- `gate-shots.log`: 572 PNGs, 0 FAIL, 9m03s. `gate-freeze.log`: `freeze OK (276/276 ...)`. `gate-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
- After everything: 0 Obsidian / chromedriver / Xvfb / worktree processes, 0 `/tmp/dse-e2e-*` dirs.

## Deviations
- The rebase (not requested explicitly beyond the brief's fetch rule): shas rewritten, F1's report refers to the pre-rebase ones.
- STAM-T11's assertion is the weaker "label agrees with field" invariant, because walking back a "+" does not work (see summary item 5).
- Shots and freeze counts differ from the brief's 568 / 274 because of upstream's new captures on `develop` (+4 PNGs, +2 frozen), not because of this round.

## Drive-by fixes:
None.

## Follow-ups:
- SC-432's fixer: rewrite the tracked-pool `kind: 'creature'` rows of the Spend Recovery matrix, the two jest no-pool-hero pins and e2e `[STAM-Q13]` (retitled "SC-432 will relabel + confirm"), and drop the `.failing` / `knownBug` markers.
- SC-433's fixer: drop the 4 jest `.failing` and e2e T03 / T04 / T10 markers; T11 should then be tightened to assert "-" lowers temp.
- The ticket text for B6 should say the temp "-" can never lower temp (not even to undo a same-session "+"), which is slightly broader than "silent no-op at the session-start value".

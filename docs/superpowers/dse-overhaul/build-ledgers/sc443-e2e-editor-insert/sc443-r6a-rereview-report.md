# SC-443 r6a: scoped re-review of the r5 delta (items 1, 2, 3 for r4a L-1..L-4, 5, 6) — head `758a8956` on `957e4b11`

## Executive summary
- **Verdict for my items: LAND-READY.** No new findings in my items; 0 new product bugs.
- **r4a findings:**
  - H-1 (SC-679 hand-off) **RESOLVED**.
  - L-1 (network guard) **RESOLVED**.
  - L-2 (Shift on the snapshot command) **RESOLVED**.
  - L-3 (key accept screen check) **RESOLVED**.
  - L-4 (middle-click / right-click) **RESOLVED**.
- **Item 1, rebase fidelity:**
  - `range-diff d582e7ff..6c5a073c 957e4b11..f02ac82d` shows all 8 commits as `=`.
  - `src/` diff vs `957e4b11` is the 3 `stampControl` edits (12 added lines, 0 removed). `schemaSuggest.ts selectSuggestion` is develop's SC-679 code, untouched.
  - `8c08bce2..957e4b11` (SC-672) touches no authoring file.
- **Item 2, SC-679 hand-off:**
  - Commit `44de5b07` holds the patch's 244 changed lines unchanged.
  - The 13 new tests (G15..G20, K10..K16) are present and unchanged at the head. Only K01 / K02 changed after the patch (L-3).
  - No `knownBug('SC-679')` and no SC-679 `test.failing` are left.
  - **Mutation:** with both halves of the fix reverted, all 16 SC-679 tests go red. With only `close()` removed, 13 of 16 go red; with only the cursor placement removed, 12 of 16 go red.
- **Item 5:** every removed test line maps to a ruled r5 task. No `e2e/driver/*` file that exists on develop changed. All 87 `[AUTH-*]` ids are unique.
- **Gates at `758a8956`:**
  - tsc (incl. `-p e2e`) rc 0; lint rc 0.
  - jest `14269 passed / 4 skipped` (14273), rc 0, 207 s, loadavg 8.1→33.4. The 2 extra skips are token-coverage tests that skip outside the workspace, so 14269 + 2 = the implementer's 14271 / 2.
  - Full e2e `OBSIDIAN-E2E done: 772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs`, rc 0, 534 s, loadavg 1.4→10.0. My mutant runs went alongside it.

## Item 1 — rebase fidelity
- `git range-diff d582e7ff..6c5a073c 957e4b11..f02ac82d`: all 8 commits are `=` (`de7a16a6`..`f02ac82d`). Output: `r6-range-diff.txt`.
- `git diff 957e4b11 758a8956 -- src`: `CompendiumSearchModal.ts` +6, `schemaSuggest.ts` +3, `suggest.ts` +3. The added lines are imports, comments and `stampControl` calls, with no `-` lines. Develop's SC-679 `setCursor` + `close()` in `selectSuggestion` are untouched.
- `8c08bce2..957e4b11` (SC-672) touches only counter model and tests files.
- Because the `src/` diff is attributes only, I did not re-run lifecycle, shots, freeze or parity.

## Item 2 — SC-679 hand-off
- **The patch applied unchanged.** `sc679-on-sc443.patch` changes 245 lines; one of those is the format-patch `-- ` trailer. Commit `44de5b07` changes 244 lines, byte-identical to the rest (`diff r6-patch-lines.txt r6-commit-lines.txt` shows only the trailer).
- **The tests are complete.** The patch's ids: G13, G14, K09 flipped from markers, plus G15..G20 and K10..K16 = 13 new tests.
- **Nothing was weakened later.** `git diff 44de5b07 HEAD` on `gate-on.e2e.ts` and `schema-suggest.e2e.ts` removes only lines of K01 / K02, which r5 rewrote for L-3.
- **No SC-679 marker is left.** There is no `knownBug('SC-679')` and no SC-679 `test.failing`. The `authoringKnownBugs.test.ts:229` SC-679 describe is a plain test.
- **The ids are unique:** 87 unique `[AUTH-*]` ids, no duplicate, none on develop `957e4b11` or on sc442 `6d5a2caa`.
- **Mutation, V1: both halves of the fix removed** (`r6-mut-v1.diff`).
  - e2e (`r6-e2e-v1.log`): `3/20 ok, 17 failed`. All of G13..G20 and K09..K16 are red, plus G10. K01..K03 stay green as controls.
  - jsdom (`r6-jest-v1.log`): 4 failed. They are the flipped `authoringKnownBugs` SC-679 test and develop's 3 SC-679 tests.
- **Mutation, V2: `close()` removed only** (`r6-mut-v2.diff`, `r6-e2e-v2.log`): `5/20 ok, 15 failed`. Of the SC-679 tests, all are red except G14, which is green because it presses Escape before Enter.
- **Mutation, V3: `setCursor` removed only** (`r6-mut-v3.diff`, `r6-e2e-v3.log`): `7/20 ok, 13 failed`. G18, K11, K13 and K16 stay green; they type a prefix or test undo, where the cursor maps behind the value anyway. All other SC-679 tests are red.

## Item 3 — r4a L-1..L-4, each probe re-run
- **L-1 RESOLVED.** `networkGuard()` (`e2e/driver/authoring.ts:66-68`) is called from `openEditor` (`:42`) right after `dse.openNote`. Every test in every authoring spec opens its note through `openEditor` or a helper that calls it. A static walk of every `it` / `knownBug` body found no test that reaches the palette, typing or Sync first. That covers `census.e2e.ts` and `gate-on.e2e.ts` (whose `before` reload is followed by `openEditor` in each test).
  - **Probe N1** (`r6-mut-md.diff`): I removed `releaseStub.install()` from AUTH-C10 and wrapped the guarded function with a logging spy.
    - C10 went red (`r6-e2e-md.log`).
    - The bundle's events (`evidence/md-AUTH-C10/events.json`) show exactly one request attempt: `R6-GUARD-HIT https://api.github.com/.../releases/latest stubbed=false`. That attempt threw in the guard (`compendium sync failed: Error: e2e: network disabled …` at `resolveRelease`). The next Notice is "compendium sync failed — e2e: network disabled", and no "downloading" Notice appears.
  - **The brief's "no 'resolving compendium release…' Notice" criterion cannot hold, and it is not evidence of a request.** `CompendiumSyncService.ts:315` posts that Notice before `resolveRelease` calls `this.requestUrlFn` (`:381`). Every network call in `src/` goes through `this.requestUrlFn` (`:381`, `:401`), and no other file imports `requestUrl` or uses `fetch`. So no request can leave once the guard is in.
  - **Probe N2** (`r6-mut-n2.diff`): I removed the stub AND every stub assertion from AUTH-C11. The guard alone turns the test red: `invariant violation(s): page error: … e2e: network disabled …` (`r6-e2e-n2.log`, `evidence/n2-AUTH-C11/`).
  - No spec outside `specs/authoring/` imports `driver/authoring`, so no other spec's behaviour changed.
- **L-2 RESOLVED.** AUTH-C12 (`compendium-search.e2e.ts:202-214`, Source mode, real Shift-click via CDP on the snapshot command) asserts the golden snapshot bytes, no Notice, and that Reading view draws a `statblock`. Mutant M12 turned C12 red ("expected 62 lines, received 1", `r6-e2e-md.log`); C09 stays green, as it should. C09's title now says Ctrl only.
- **L-3 RESOLVED.**
  - AUTH-K01 (`schema-suggest.e2e.ts:16-35`) is seeded with `max_stamina: 20`. After the accept it types `: 5`, asserts the bytes, and puts the cursor on the `after` line with `leaveBlock(1, {line:4})`. It then asserts `{roots:['stamina-bar'], errors:[]}`.
  - AUTH-K02 (`:37-50`) types `: 30`, asserts the bytes, and asserts the same in Reading view.
  - Both passed in the full run. `leaveBlock`'s new `at` parameter is additive, with the default unchanged (line 0).
- **L-4 RESOLVED.** `buttonClick` (`driver/authoring.ts:299-318`) sends real CDP `mousePressed` / `mouseReleased` with button `middle` (buttons 4) or `right` (buttons 2), and credits after the click. The manifest adds `click:Middle` and `click:Right` on `authoring.search.result` (`manifest/authoring-search.ts:30`).
  - AUTH-C13 (Live Preview, middle-click) and AUTH-C14 (Source mode, right-click) pin today's behaviour: reference bytes, no Notice, the block draws.
  - Coverage of the full run credits `click:Middle` to C13 and `click:Right` to C14 (`r6-gate-full-coverage.json`), for 466/466.
  - A mutant that ignores non-primary buttons in `onChooseSuggestion` (`r6-mut-md.diff`, "MB") turns both C13 and C14 red, while C01 and C02 stay green.

## Item 5 — nothing else moved
- `git diff --name-status 957e4b11 758a8956`: the only existing files modified are `e2e/README.md` (the one SC-443 paragraph rewritten), `test/dom/e2eCensus.test.ts` (r1, unchanged in r5) and the 3 `src` files. Every `e2e/driver/*` change is in files the branch adds (`authoring.ts`, `authoringIntact.ts`, `authoringTrips.ts`).
- The 28 test or spec lines removed after the patch (`r6-removed-lines.txt`) all belong to ruled r5 tasks:
  - C09 retitled; imports;
  - K01 / K02 rewritten (L-3);
  - the list-item case became a `test.each` (INFO-1); the snapshot case gained a cursor assertion (INFO-3);
  - the SC-676 `triggers` helper reworked (INFO-5); the SC-677 marker reworked (LOW-2); the SC-678 marker reworked (LOW-1);
  - the `mode:flat` table row moved to the SC-688 `test.failing` (MEDIUM-1).
- I did not judge the marker changes themselves; that is scope B.
- After the full e2e run, the gate worktree's `git status` was clean: no tracked vault file was written.

## Item 6 — gates (head `758a8956`; logs in the scratch folder below)
| Gate | Result |
|---|---|
| tsc (`r6-tsc.log`) | rc 0 (`tsc --noEmit && tsc --noEmit -p e2e`) |
| lint (`r6-lint.log`) | rc 0 (only the `.eslintignore` warning) |
| jest (`r6-jest.log`) | `Tests: 4 skipped, 14269 passed, 14273 total`; 310 suites passed / 1 skipped; 206.8 s; rc 0; load 8.11 → 33.43 |
| full e2e (`r6-e2e-full.log`) | `OBSIDIAN-E2E done: 772/779 ok, 0 failed, 7 known-bug, coverage: 466/466 pairs`; rc 0; 534 s; run `20261123-163149-72c8`; pointer parked :200; load 1.38 → 9.95 |

- jest: the 2 extra skips are `token-coverage.test.ts`'s workspace-map block, because the scratch worktree is outside the workspace; 14269 + 2 = 14271.
- e2e: the known-bug tests are AUTH-I27 (SC-687), AUTH-G21 (SC-688) and develop's 5.

## Evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-rev-r6a/`. The scratch worktrees `wt-gate` and `wt-mut` were removed with `git worktree remove`. The branch worktree is still clean at `758a8956`.

**Gates**

| Gate | Files |
|---|---|
| tsc | `r6-tsc.log`, `r6-tsc.rc` |
| lint | `r6-lint.log`, `r6-lint.rc` |
| jest | `r6-jest.log`, `r6-jest.rc`, `r6-jest.load-start`, `r6-jest.load-end` |
| full e2e | `r6-e2e-full.log`, `r6-e2e-full.rc`, `r6-e2e-full.start`, `r6-e2e-full.end`, `r6-e2e-full.load-start`, `r6-e2e-full.load-end`, `r6-gate-full-coverage.json` |

**Items 1-2**

| Check | Files |
|---|---|
| Rebase and patch | `r6-range-diff.txt`, `r6-patch-lines.txt`, `r6-commit-lines.txt`, `r6-removed-lines.txt` |
| SC-679 V1 | `r6-mut-v1.diff`, `r6-e2e-v1.log`, `r6-jest-v1.log` |
| SC-679 V2 | `r6-mut-v2.diff`, `r6-e2e-v2.log` |
| SC-679 V3 | `r6-mut-v3.diff`, `r6-e2e-v3.log` |
| Mutant script | `r6-mut-sc679.py` |

**Item 3**

| Check | Files |
|---|---|
| M12, MB and N1 | `r6-mut-md.diff`, `r6-e2e-md.log`, `evidence/md-AUTH-C10/` |
| N2 | `r6-mut-n2.diff`, `r6-e2e-n2.log`, `evidence/n2-AUTH-C11/` |

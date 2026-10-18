# SC-408 fix round F3: report

**Executive summary**
1. Verdict DONE. New base `origin/develop` = `e9502a8` (SC-390: steel-compendium-sdk 3.1.0). DSE `sc408-functest` head `713b992` (27 commits on the base); superproject commits `61dde40` and `04545a1` (skill only; pointer not committed). Nothing pushed. No `src/` change (temporary probe edits only, reverted).
2. Rebase onto `e9502a8` was clean (no lock conflict this time: upstream's hunk was disjoint). `npm install` left the lock unchanged: upstream 763 packages, now 1148, **0 existing versions changed, 0 removed**; `steel-compendium-sdk` is `3.1.0` in `package.json`. Old to new sha mapping below.
3. LOW-1: the 6 tests are retitled `[current behaviour — SC-432 changes this]`. Simulated SC-432 (creature Spend Recovery forced disabled): exactly those 6 plain tests plus the 2 SC-432 `test.failing` markers go red, nothing else in `views/elements/framework`.
4. LOW-2 bite proof: with the temp "-" mutated to RAISE temp (`value < running ? running + 1 : ...`), the new jest test fails (`1 failed, 64 passed`) and e2e `[STAM-T11]` fails (`Expected: <= 5, Received: 6`), while the SC-433 markers T03 / T04 stay `known-bug` (so the bounds were the only guard). Reverted.
5. Gates: tsc clean, lint clean, jest **4721 passed / 1 skipped / 226 of 227 suites** (4720 + 1 new; the new develop commit adds no tests), lifecycle **25/25** (4m17s), e2e **59/71 ok, 0 failed, 12 known-bug, coverage 47/47** x4 runs (the full gate run + 3 back-to-back at `--shards=4`: 41.8 / 40.1 / 41.4 / 38.1 s), shots **572 PNGs, 0 FAIL**, freeze **276/276**, parity **0 GAPs / 0 undeclared / 24 declared** (all unchanged from F2).

## Items
| Item | Change | Where |
|---|---|---|
| Rebase | `sc408-functest` onto `e9502a8`; sha map (old -> new, oldest list order): `a066544 -> 7cef081; 37fc241 -> 3a06f83; b46a469 -> c016a83; cc05e7d -> c312006; 2199703 -> 4ac841b; 1cb2399 -> 5bc81ed; cff8255 -> 7fc4949; f44735b -> f2814d8; dad0952 -> c666166; 9ea5067 -> acfb123; 840e1c2 -> abb21b9; cd33d3e -> 1bd8bb8; deca685 -> 749d270; 78141d9 -> 74ca48c; 7aca69a -> 748ef5e; 941bd26 -> e7820f9; d7cdcdc -> 12c18fa; eba19a3 -> a068e92; 776fe04 -> 6e68445; 3d9be2e -> a284cc4; 92d73fa -> 7efb4ed; c90a70c -> 072f578; d0f94b5 -> cb84f36; fca9641 -> 0da78d4` (24 commits; F3 adds 3 more: 27 total). | git |
| LOW-1 | 5 creature rows of the Spend Recovery position table (`one short of max`, `mid: one press`, `mid: two presses`, `mid: presses stop at the last Recovery`, `last Recovery that also reaches max`) and `[Q16] max 3 ... smallest bar where it works` carry ` [current behaviour — SC-432 changes this]`; the comment above the SC-432 describe names them. Rows that stay green under the fix (`full: starts disabled`, `zero Recoveries`) untouched. | `test/dom/views/stamina-edit-modal-matrix.test.ts:433-440, ~495, comment ~462` |
| LOW-2 | e2e `[STAM-T11]` now also asserts `shown <= 5` and `shown >= 0` (hold today and after SC-433); new plain jest test "the minus button never raises the pending temp, and never takes it below 0" (`pendingTempStaminaChange <= 0`, `5 + pending >= 0`, applied temp `<= 5`). | `e2e/specs/stamina-bar/stamina-modal.e2e.ts` (T11), `test/dom/views/stamina-edit-modal.test.ts` (RC-5 describe, before the SC-433 minus marker) |
| LOW-3 | README fixture table row for `Initiative/hurt.md`. | `e2e/README.md:95` |
| LOW-4 | dse-verify Overview now lists the e2e functional gate ("required to land any change"); `.repo-docs/development.md` e2e bullet says "Required to land any change (Scott, SC-408)". | skill (superproject `61dde40`), `.repo-docs/development.md:79` |
| INFO-3 | README and skill now describe the suffix convention as `[current behaviour — SC-nnn will ...]` (with the two SC-432 forms as examples) and say the `[... ruling pending ...]` wording is retired (no `ruling pending` text remains in README, skill, AGENTS.md, PROJECT.md or .repo-docs). | `e2e/README.md:~104`, skill known-bug rule |
| Skill numbers | CURRENT block re-pointed to "rebased onto develop @ e9502a8", jest 4721. | superproject `04545a1` |

## Evidence
`/tmp/claude-1000/sc408-fix3/`: `gate-{tsc,lint,jest,lifecycle,shots,freeze,parity}.log`, `loop.txt` + `loop-1..4.log`; `evidence/bite-low2-jest.log`, `evidence/bite-low2-e2e.txt` (T11 FAIL line, T03 / T04 still known-bug), `evidence/sim-sc432-red-list.log` (the simulation run). Sha lists: `/tmp/claude-1000/sc408-fix2/{pre,post}-rebase-shas.txt`. After the runs: 0 Obsidian / chromedriver / Xvfb / worktree processes, 0 `/tmp/dse-e2e-*` dirs.

## Drive-by fixes:
None.

## Follow-ups:
- The skill's CURRENT block names `sc408-functest` and `e9502a8`; the landing step should re-point it if `develop` moves again.
- SC-432's fixer: the 6 retitled tests, the 2 `Q13` `test.failing` cases and the e2e markers are the full list (see the simulation log).

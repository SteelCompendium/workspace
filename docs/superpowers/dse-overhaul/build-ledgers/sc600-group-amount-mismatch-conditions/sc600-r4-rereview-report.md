# SC-600 r4 scoped re-review report (r3 fix delta)

## Executive summary
- VERDICT: **LAND-READY**. dse head `d984b115` on develop `c329ff35`. Superproject `0f01f93b` on origin/main `e188cee0`.
- Range-diff: r1's 5 commits are `=` (patch-identical) after the rebase. The ONLY new commit is `d984b115`: `model.ts` +6/-2 and the test file +20. SC-607 touched none of SC-600's files (its changes are in `src/framework/host/*`, `lineMap`, the lifecycle harness and tests).
- The INFO-4 guard (`model.ts:390-391`) is correct. Real YAML `.inf`, `-.inf`, `+.inf`, `.Inf`, `.INF`, `.nan`, `.NaN` throw the existing invalid-amount message in under 11 ms. `2.5`→3, `0`→0, `-2`→0, `3`→3, `1e1`→10 and `0x2`→2 instances are unchanged. In real Obsidian `.inf` draws the error card with the exact text in 38 ms, and the renderer keeps working afterwards.
- LOW-1 and LOW-2 comment fixes: present and accurate.
- Superproject: `diff origin/main --stat` shows only CHANGELOG.md (+6) and the draw-steel-elements pointer. One pointer-bump commit; pointer = `d984b115`. No attribution trailers (superproject or dse). The bullet is intact under `## Unreleased`.
- Gates I measured: tsc clean, lint clean, jest `11618 passed / 1 skipped` (cache present; as expected), e2e full `306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`.
- Author logs spot-checked: lifecycle 21+16+9+4+7+4 = 61/61 (part 6 includes SC-607's G-S99), shots 592 files, button 978, modal 234, capture clip 147, freeze 280/280, parity 0/0/24.
- Findings: 0 HIGH / 0 MEDIUM / 0 LOW, 2 INFO. The tree is clean.

## Findings
### INFO-1: `d984b115` is not on any remote yet
- `git -C …/draw-steel-elements branch -r --contains d984b115` returns nothing. The superproject pointer `0f01f93b` references it. Push the dse branch (wt-finish / land-stack) before or with the superproject push, or origin/main will pin an unfetchable sha. This is a process note, not a code defect.

### INFO-2: two behaviour notes on the guard (both consistent with the ruling)
- `model.ts:390-391`: `amount: .nan` and `amount: -.inf` used to render an empty group silently (want = 0). They now draw the invalid-amount error card. This is intended per the INFO-4 ruling.
- A huge FINITE amount (e.g. `1e9`) still materializes that many instances (memory or time blow-up). That existed before the change and is outside the ruling. File a Backlog ticket only if wanted.

## Checks
| Check | Result |
|---|---|
| (1) range-diff `dcc53f0f..1116e06d` vs `c329ff35..d984b115` | 1-5 `=`; 6 new (`d984b115`) |
| SC-607 overlap (`git diff --name-only dcc53f0f c329ff35`) | no initiative / EncounterData / e2e-initiative files; `git diff 1116e06d d984b115` on SC-600's paths = the fix commit only |
| (2) jest probe, real YAML through `parse` | 7 non-finite spellings throw `Creature 'Wolf' in group 'Pack' is missing or has an invalid 'amount' field.`; `"3"` and `null` throw as before; finite amounts unchanged; every case under 11 ms |
| (2) real Obsidian probe R4P-01 (amount-edit.md, hand edits) | `.inf` card 38 ms, `-.inf` 10 ms, `.nan` 28 ms (exact message), then 2.5 → 3 cells, 0 → 0, -2 → 0, 3 → 3; the note was not rewritten (#2 still 25 `grabbed`). Caveat: the card text after `-.inf` / `.nan` may be the previous card's; no hang is proven by the later re-renders, and the text by jest |
| (3) superproject | 2 files; commits `e226f763` (changelog) + `0f01f93b` (the one pointer bump); `ls-tree` pointer `d984b115`; 0 trailer matches |
| (4) gates | below |

## Gates
| Gate | Measured | Log |
|---|---|---|
| tsc | rc 0, clean | `r4-tsc.log`, `r4-static-rc.txt` |
| lint | rc 0, clean | `r4-lint.log` |
| jest | `Tests: 1 skipped, 11618 passed, 11619 total`; Suites 269 passed / 1 skipped; rc 0 | `r4-jest.log` |
| e2e full | `OBSIDIAN-E2E done: 306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, rc 0, pointer parked | `r4-e2e-full.log` |
| jest probe | 1/1 (15 cases) | `r4-probe-jest.log` |
| e2e probe R4P-01 | 1/1 ok | `r4-e2e-probe.log` |
| lifecycle, shots, freeze, parity | spot-checked in `…/scratchpad/sc600-r3-impl/` (`life1-6.log`, `shots.log`, `freeze.log`, `parity.log`), not re-run | |

All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r4-review/`.

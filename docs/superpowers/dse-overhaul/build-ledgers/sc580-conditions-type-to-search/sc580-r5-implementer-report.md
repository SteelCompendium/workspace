# SC-580 r5 implementer report

**Executive summary**
- STATUS: DONE. Plugin branch rebased onto dse `origin/develop` `622b0904` (clean, no conflicts, no focus-code conflict). Superproject rebased onto `origin/main` `38d8c695`.
- Plugin head `93e8e48c` (4 commits: `b17044b0`-equivalent key handler, e2e/doc commit, LOW-2 fix, r5 tests; rebased shas differ from r3). Superproject head `e8417f8d` (pointer = `93e8e48c`). Nothing pushed. Product code unchanged this round (jest tests only).
- r4 LOW-1 and LOW-2 folded as 2 jest tests. Mutant R1 (delete `escape &&`) fails exactly the new click-away test; mutant R3 (delete the clear in `pickMatch`) fails exactly the new after-pick-from-Done test. Source restored (git status clean).
- tsc, lint clean · jest **10747 passed / 1 skipped** (shots cache present; fresh equivalent 10746 / 2 = 10715 + 29 + 2) · lifecycle **60/60** (21+16+9+4+7+3) · e2e **`285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`** · shots **592**, 163/978, 39/234, 147 · freeze **280/280** · parity **0 / 0 / 24**.

## Rebase
- Plugin: `git rebase origin/develop` (622b0904): 3 commits replayed, no conflict (SC-609's `controlFocus` / initiative view files are not touched by the branch). `package.json` / lock unchanged, no `npm ci`.
- Superproject: `git rebase origin/main` (38d8c695): `CHANGELOG.md` merged automatically both times; the `draw-steel-elements` pointer conflicted in each of the two branch commits and was resolved by `git add` of the rebased plugin head. Final pointer commit `e8417f8d` points at `93e8e48c`. CHANGELOG SC-580 bullet kept (one occurrence, no markers).

## Tests (both in `test/dom/views/conditions-modal-matrix.test.ts`, SC-580 nested describe)
- "only Escape hands focus back: a click away (on the title) closes the search and focus goes to "+ Add condition"": letter on a Duration chip, mousedown + click on `titleEl`, expect the search gone and focus on "+ Add condition".
- "after a pick, Escape is the usual one even when the remembered control is still there (Done is never re-rendered)": letter on Done, type `daz`, pick, assert Done still connected, Escape, expect focus on "+ Add condition".

## Mutants (jest `conditions-modal-matrix` + `conditions-modal`, 396 tests; logs below)
- R1 (`refocus && escape && back?.isConnected` -> `refocus && back?.isConnected`): 1 failed / 395 passed: only the click-away test.
- R3 (delete `this.returnFocusEl = null; // a pick ...` in `pickMatch`): 1 failed / 395 passed: only the after-pick-from-Done test.
- Unmutated: 396 passed.

## Gates (measured)
| gate | result |
|---|---|
| tsc (incl. e2e) / lint | clean / clean |
| jest | 10747 passed, 1 skipped, 266 of 267 suites |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7, 3/3 = 60/60, 0 failed |
| e2e | `OBSIDIAN-E2E done: 285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` |
| shots | 592; button host-leak 163 / 978; modal host-leak 39 / 234; capture clip 147; rc 0 |
| freeze | 280/280 |
| parity | 0 gaps, 0 undeclared, 24 declared |

Drive-by fixes: none. Follow-ups: none.

## Artifacts (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/`)
`sc580-r5-implementer-report.md`; `sc580-r5-gate-tsc.log`, `-lint.log`, `-jest.log`, `-lifecycle-part1..6.log`, `-e2e.log`, `-shots.log`, `-freeze.log`, `-parity.log`; `sc580-r5-mutant-R1.log`, `sc580-r5-mutant-R3.log`

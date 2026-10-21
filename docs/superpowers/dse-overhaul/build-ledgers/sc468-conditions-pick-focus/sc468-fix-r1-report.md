# SC-468 fix round 1 report

**Executive summary**
- STATUS: DONE. dse head `3480231`, rebased onto `origin/develop` `0267b8a`. Superproject changelog commit `b475659` (worktree superproject only; the submodule pointer is not committed).
- Items 1 to 5 done; item 6 (INFO-2) dropped as ruled. No CSS touched.
- Item 3: the lookup now goes through `editorEl(index)`, row `index`'s own editor (the sibling right after its row). A new jsdom test fails on the old lookup (1 failed of 67 on the old code) and passes on the new.
- Gates at `0267b8a`: tsc and lint clean, jest 5336 passed / 1 skipped / 230 of 231, lifecycle 28/28, e2e 85/89 ok 0 failed 4 known-bug 63/63 pairs, shots 572 with 0 FAIL, freeze 276/276, parity 0 / 0 / 24.
- `main.js` sha256 `dc44016c449dc0acba1f7532d2071617f750b22a69ba2edfd1f5748197516a23`. I did not build `3fdbe2e` to compare; item 3 changes real logic, so it differs by design, and shots/freeze/parity were run.

## Per item
1. LOW-1: done. The doc comment on `focusPickedOption` now says "Tab on".
2. LOW-2: done. The fallback test also calls `setColor(0, '#00ff00')` with the editor closed and asserts focus is on the cog.
3. INFO-3: done. New private `editorEl(index)` is used by `focusPickedOption` and `focusCustomColor`. New test "the option is looked up in row `index`'s OWN editor, never another row's open editor": two rows, the editor open on row 0, then `setColor(1, '#1e8449')`, `setDuration(1, 'eot')`, `setEffect(1, 'glow')` and `setColor(1, '#00ff00')`. Focus must land on row 1's cog. It reaches row 0's editor only through private calls, since in the UI only the open row's editor exists, but it does fail on the old code.
4. INFO-4: done. The test is retitled to say it pins that the "static" effect chip (the preset that clears the effect) focuses its own chip in the Effect group.
5. Superproject CHANGELOG: done. One bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc468-conditions-pick-focus/CHANGELOG.md`, in the "**DSE plugin: ... (SC-468).**" style. Commit `b475659` touches only that file.
6. INFO-2: dropped, nothing changed.

## Commits (dse, after rebase onto 0267b8a)
- `9369c06` SC-468 keep focus on the picked swatch/chip
- `6f28b73` e2e COND-E02/E03, control ids, dse changelog
- `3480231` fix(conditions): SC-468 r1 scope the option lookup to row index's own editor; Tab (not arrow) wording; custom-colour fallback test; retitle static-chip test

## Gates
| Gate | Expected | Measured |
|---|---|---|
| tsc and lint | clean | clean, exit 0 |
| jest | 5335 + new | 5336 passed / 1 skipped / 230 of 231 suites (+1) |
| lifecycle | 28/28 | 28/28 |
| e2e | 85/89, 0 failed, 4 known-bug, 63/63 | 85/89 ok, 0 failed, 4 known-bug, 63/63 pairs |
| shots | 572, 0 FAIL | 572, 0 FAIL |
| freeze | 276/276 | `freeze OK (276/276 …)` |
| parity | 0 / 0 / 24 | 0 gaps, 0 undeclared, 24 declared |

## Artifacts
Scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc468-fix-r1-k2m9/`
- Logs: `f1-tsc.log`, `f2-lint.log`, `f3-jest.log`, `f4-lifecycle.log`, `f5-e2e.log`, `f6-shots.log`, `f7-freeze.log`, `f8-parity.log`
- `main.js` hash: `f5-main.js.sha256`
- jest red (old lookup, 1 failed) and green: `sc468fr1-jest-red.log`, `sc468fr1-jest-green.log`

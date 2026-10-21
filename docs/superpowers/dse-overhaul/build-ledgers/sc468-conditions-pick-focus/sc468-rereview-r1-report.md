# SC-468 re-review r1 (delta only)

**Executive summary**
- VERDICT: **LAND-READY** at dse `3480231` on `origin/develop` `0267b8a` (`ls-remote` develop = `0267b8a`), with superproject `b475659`.
- Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 0 LOW, 0 new INFO. Every folded r1 item is fixed: LOW-1, LOW-2, INFO-3 and INFO-4.
- Rebase: `range-diff 84636a9..3fdbe2e 0267b8a..6f28b73` shows `0618791 = 9369c06` and `3fdbe2e = 6f28b73`, so both patches are identical. `diff 3fdbe2e 6f28b73` equals `diff 84636a9 0267b8a`: only SC-459's `previewScrollPin.ts` and `obsidian-lifecycle.mjs`.
- `3480231` touches only `src/views/ConditionsModal.ts` (+11/−3) and `test/dom/views/conditions-modal.test.ts` (+28/−1). No CSS. The only behaviour change is the INFO-3 scoping ruled by the owner.
- Gates I re-ran at `3480231`: tsc clean, lint clean, **jest 5336 passed / 1 skipped / 230 of 231 suites** (expected 5336).
- Vacuity: all three mutations turn a test red. Probes: 11 jsdom and 10 targeted real-Obsidian e2e runs, all green. Details below.
- I trusted the implementer's lifecycle 28/28, e2e 85/89 (0 failed, 4 known-bug, 63/63), freeze 276/276 and parity 0/0/24. I checked their logs: they are timestamped after the `3480231` commit (01:44 to 02:01) and show those numbers. The plugin repo's `git status --porcelain` is empty before and after.

## Per item
- **LOW-1:** fixed. `ConditionsModal.ts:206` now reads "can Tab on to the next option". It is a comment-only change.
- **LOW-2:** fixed. The fallback test now also calls `setColor(0, '#00ff00')` with the editor closed and expects the cog. Mutation V2 (drop `focusCustomColor`'s `else focusRowCog`) makes **2 tests fail**: the fallback test and the new own-editor test.
- **INFO-3:** fixed. The new `editorEl(index)` at `ConditionsModal.ts:221-227` returns `rows[index].nextElementSibling` only when it is `.dse-condal__editor`, else null. That matches `renderList()`, which places a row and then its editor. Both `focusPickedOption` and `focusCustomColor` use it.
  - Mutation V1 (both lookups back to the first editor in the list): **1 failed / 67** (the new own-editor test). This agrees with the implementer's red log `sc468fr1-jest-red.log` (1 failed / 67, same test).
  - Mutation V3 (only `focusCustomColor` back to the first editor): **1 failed**, the same test. Its final `setColor(1, '#00ff00')` assertion catches it.
  - Probes, jsdom:
    - P9 (re-pointed at the new behaviour) passes. `setColor(0, …)` with row 1's editor open now lands on row 0's cog, and a real pick in row 1's editor still focuses its swatch.
    - The new P11 passes. With 3 rows and the editor on the last row, a duration pick and a custom-colour change both focus inside that row's editor.
    - P1–P8 and P10 still pass.
  - Probes, real Obsidian 1.14.4: `--only=COND-E01,E02,E03,PROBE-01..07` gives 10/10 ok. That covers Space in all three groups, rapid Enter/Tab, re-picking the selected option, row 2 of 2, mouse picks with no ring, a pick with the add dropdown open, and the indicator styles.
- **INFO-4:** fixed. The test is retitled to say it pins that the "static" effect chip focuses its own chip in the Effect group, and the body is unchanged.
- **Workspace CHANGELOG (`b475659`):** `--stat` shows only `CHANGELOG.md` (+6). It is one bullet under `## Unreleased`, styled "**DSE plugin: in the Conditions window, … (SC-468).**", the same as SC-431 and SC-366. Every claim in it is backed by a measurement: Enter and Space on all three groups, focus no longer sent to the cog, a custom colour staying on the custom field, and no ring on mouse picks. It is plainly worded and uses the British "colour", as the file's other bullets do.

## Measured (reviewer)
| Gate | Result |
|---|---|
| tsc (+ `-p e2e`) | clean, RC=0 |
| lint (+ e2e) | clean, RC=0 |
| jest | 5336 passed / 1 skipped / 230 of 231 suites, RC=0 |
| vacuity V1 / V2 / V3 | 1 / 2 / 1 failed (all red, as expected) |
| jsdom probes | 11/11 |
| e2e targeted (private worktree) | 10/10 ok, 0 failed |

## Artifacts
All files are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc468-rereview-p4t7/`:
- Gate logs: `p4t7-tsc.log`, `p4t7-lint.log`, `p4t7-jest.log`
- Vacuity logs: `p4t7-vac1-jest.log`, `p4t7-vac2-jest.log`, `p4t7-vac3-jest.log`
- Probe logs: `p4t7-probe-jest.log`, `p4t7-probe-e2e.log`
- Probe sources: `p4t7-probe.jsdom.test.ts`, `p4t7-probe.e2e.ts`
- Gate wrapper: `p4t7-gate.sh`

The private worktree `…/sc468-rereview-p4t7/wt` has been removed (`git worktree remove --force` + `prune`).

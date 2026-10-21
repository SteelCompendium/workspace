# SC-468 independent review, round 1

**Executive summary**
- VERDICT: **LAND-READY** at `3fdbe2e`. It is on `origin/develop` `84636a9` (merge-base = develop tip; `ls-remote` develop = `84636a9`).
- Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW, 5 INFO. None blocks landing. Both LOWs are a comment fix and an optional extra test.
- Full battery re-run by me in the shared worktree. Every gate matches the implementer's report exactly: tsc/lint clean, jest 5335/1 skipped/230 of 231, lifecycle 28/28, e2e 85/89 ok, 0 failed, 4 known-bug, 63/63 pairs, shots 572 with 0 FAIL, freeze 276/276, parity 0/0/24.
- Vacuity: I put the old cog behaviour back in a private worktree. 6 of the 7 new jsdom tests fail, and COND-E02 and COND-E03 both fail (focus lands on `cond.edit` "Customize Dazed"). When I removed the cog fallback instead, the fallback test fails. The tests do catch the bug.
- Probes in real Obsidian 1.14.4: 7 extra scenarios, all green. They cover Space in all three groups, rapid Enter/Tab sequences, re-picking the already-chosen option, row 2 of 2, mouse picks on duration and effect, a keyboard pick with the add dropdown open, and the focus indicator's computed style. jsdom: 10 extra probes, all green.
- Scope: no CSS change and no change to add/remove/toggle. `pickMatch` and SC-431's escape consumer are untouched. Working tree unchanged (`git status --porcelain` empty in the plugin repo before and after).

## Gates (measured by the reviewer at 3fdbe2e)

| Gate | Expected | Measured |
|---|---|---|
| tsc (+ `-p e2e`) | clean | clean, RC=0 |
| lint (+ e2e) | clean | clean, RC=0 |
| jest (after `rm -f main.js styles.css`, shots CSS cached) | 5329 + new | **5335 passed / 1 skipped / 230 of 231 suites**, RC=0 |
| lifecycle (port 9287) | 28/28 | **`OBSIDIAN-LIFECYCLE done: 28/28 ok, 0 failed`**, RC=0 |
| e2e | 83/87, 57/57 (+ new) | **`OBSIDIAN-E2E done: 85/89 ok, 0 failed, 4 known-bug, coverage: 63/63 pairs`**, RC=0 |
| shots | 572, 0 FAIL | **572 PNGs, 0 FAIL**; host-copy pin OK; button host-leak 112 kinds / 672 |
| freeze | 276/276 | **`freeze OK (276/276 frozen print PNGs byte-identical …)`** |
| parity | 0/0/24 | **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)**, RC=0 |

## Vacuity (private `git worktree add --detach` of 3fdbe2e under the scratch dir, removed afterwards)

- Mutation A: `focusPickedOption` and `focusCustomColor` call `focusRowCog` straight away. That is exactly the old behaviour, with the control ids kept.
  - jsdom: 6 failed, 60 passed. The failures are duration, Until removed, swatch, custom colour, effect and own-group. The fallback test passes, as it should.
  - e2e `--only=COND-E02,COND-E03`: both FAIL with `ctl: cond.edit, label: "Customize Dazed"`. COND-E03 on the old code shows `ring: false` on the cog, which confirms the implementer's mouse-pick claim.
- Mutation B: drop the `else this.focusRowCog(index)` fallback in `focusPickedOption`. jsdom: 1 failed (the SC-468 fallback test). The fallback is guarded.

## Probe results

These are real Obsidian 1.14.4 runs, `--only=PROBE-01..07`, all ok.
- PROBE-01, **Space** on End of Turn, the Blue swatch and blink: focus stays on each rebuilt option. The option is connected, `aria-pressed=true` and `:focus-visible`. The note holds `duration: eot, color: '#2874a6', effect: blink`.
- PROBE-02, rapid key sequence Tab, Enter ×3 through Duration: focus ends on End of Encounter (pressed). Shift+Tab lands on Save Ends, so the Tab order continues from the picked chip. ArrowRight does nothing (see LOW-1).
- PROBE-03, Enter twice on the already-pressed `static`: there is no toggle-off. Focus stays on `static`, still pressed and connected.
- PROBE-04, two rows (Dazed, Prone) with the editor on row 2 and Enter on Red: focus is in Prone's editor. The write goes to Prone only, and the Dazed entry is unchanged.
- PROBE-05, mouse clicks on End of Encounter and glow-pulse: focus is on the option with `ring: false`. A later Tab then Enter brings the ring back (`breathing`, `ring: true`).
- PROBE-06, keyboard pick while the add dropdown is still open: the pick focuses the swatch, the dropdown stays open, and nothing crashes. That matches the old behaviour, which differed only in where focus landed.
- PROBE-07, focus indicator (computed style):
  - A focused, pressed swatch shows the accent outline plus the host's 3px `rgb(85,85,85)` box-shadow ring. A pressed swatch without focus shows the outline only. So focus can be told apart from selection, though weakly (this is SC-361's area).
  - On the focused custom `<input type=color>`, `opacity: 0`; its `<label>` has no outline and no shadow. Focus there is **invisible** (INFO-1).
- jsdom probes P1–P10, all green:
  - Row N of 3: no cross-row focus.
  - Ten rapid picks in a row: one `onChange` per pick and exactly one pressed option per group.
  - Re-picking the chosen option.
  - Legacy `effect: 'save ends'` gets migrated, and focus lands on the effect chip.
  - Legacy `effect: 'eot'` + Until removed.
  - A custom colour equal to a preset hex lands on that swatch.
  - With the add dropdown open, a pick followed by Escape on the chip closes the modal. The consumer is keyed on the input, so this is the same as with the old cog.
  - An add through the combobox after a pick still adds, and the input keeps focus.
  - The icon picker's own re-focus is unchanged.
  - The unreachable cross-row setter call is INFO-3.

## Findings

### LOW-1: the doc comment claims arrow-key navigation that does not exist
`src/views/ConditionsModal.ts:206` says "so a keyboard user stays where they were in the group and can **arrow on** to the next option". The chips are plain buttons with no arrow handlers. PROBE-02 measured that ArrowRight leaves focus on Save Ends. A future maintainer could take the comment as a description of a roving-tabindex group.
**Fix:** change it to "can Tab on to the next option" (comment only).

### LOW-2: the custom-colour fallback to the cog is untested
`src/views/ConditionsModal.ts:431-436`: `focusCustomColor` has its own `else this.focusRowCog(index)` branch. The fallback test (`test/dom/views/conditions-modal.test.ts`, "SC-468 fallback") calls `setColor(0, '#1e8449')`, which is a preset hex and takes the `focusPickedOption` path, so this second fallback is never run. Scenario: a refactor drops it and a custom colour set with the editor closed leaves focus on `<body>`. No test catches that.
**Fix (optional):** add `(modal as any).setColor(0, '#00ff00')` with the editor closed to the fallback test and assert that the cog has focus.

### INFO-1: a custom-colour pick now leaves focus on an invisible control (fold into SC-361, no SC-468 CSS)
`styles-source.css:2200-2207`: the custom input has `opacity: 0`, and `.dse-swatch--custom` has no `:focus-within` style. After a custom-colour change, focus stays on the input, which draws nothing (PROBE-07). The old code moved focus to the cog, which has a visible ring. This is not a new gap: Tabbing to the input to open it was already invisible, and the browser puts focus back on the input when the native dialog closes. The fix is CSS, which the ledger rules out of scope ("keep SC-468 to focus management, no swatch/chip CSS"). **Recommend:** the owner adds "custom colour `<label>` needs a `:focus-within` ring" to SC-361's scope. The swatch ring itself is today only the host's grey 3px box-shadow, which is also SC-361's subject.

### INFO-2: `setDuration` has an unreachable branch
`src/views/ConditionsModal.ts:393-395`: `value` always comes from a `DURATION_PRESETS` entry, so `preset` is never undefined and `else this.focusRowCog(index)` cannot run. It does no harm as defensive code. No action needed.

### INFO-3: `focusPickedOption` is not scoped to `index`
`src/views/ConditionsModal.ts:213`: it takes the first `.dse-condal__editor` in the list, not the editor belonging to row `index`. Today only one editor can be open, and the setters are only reached from that editor, so this cannot happen. Jsdom probe P9 confirms that a direct `setColor(0, …)` with the editor open on row 1 focuses row 1's swatch. If more than one editor is ever allowed open at once, scope the lookup to `rows[index].nextElementSibling`. No action needed now.

### INFO-4: the "own group" jsdom test cannot fail for the reason in its title
`test/dom/views/conditions-modal.test.ts` ("the pick lands in its own group …") picks `static`, a label that exists only in the Effect group. A matcher that ignored the group would still pass. It is not vacuous, since it fails on the old code (focus on the cog), but it does not test what its title says. No action needed. A real cross-group test would need two groups that share a label, and none do.

### INFO-5: landing bookkeeping for the owner (not branch defects)
- The workspace `CHANGELOG.md` `## Unreleased` bullet: SC-460 shipped one (`eaf38de`). The branch only adds the dse `CHANGELOG.md` bullet.
- The dse-verify CURRENT block after landing: e2e moves to **85/89 ok, 0 failed, 4 known-bug, 63/63 pairs** and jest to **5335**. Lifecycle, shots, freeze and parity are unchanged.
- The implementer's note about the add dropdown (`e2e/specs/initiative/conditions-pick-focus.e2e.ts:25-26`) describes a real, pre-existing product behaviour, not only a test-flow issue: with the add dropdown open, a mouse click on a cog or swatch can miss because the menu collapses on mousedown and the modal re-centres. It is outside SC-468; consider a Backlog ticket.

## Checked, no issue
- Scope: the diff touches only `ConditionsModal.ts` focus code plus `stampControl` attributes, the tests, the e2e manifest/spec and the dse CHANGELOG. No CSS. `toggleEditor`, `removeAt`, `pickMatch`, `comboReset` and the `registerEscapeConsumer` wiring are unchanged. The `focusRowCog` comment near L655 (pickMatch) does not apply: that path is untouched, and P8 shows the input keeps focus.
- The aria-label lookup interpolates only constant group names into the selector. Labels are compared with `getAttribute` (no injection, no CSS-escaping problem with `#`).
- The focused node is always the rebuilt, connected twin with `aria-pressed=true` (jsdom `not.toBe(before)` plus `isConnected` in the probes).
- Mouse picks: `:focus-visible` is false on all three groups (COND-E03, PROBE-05), so no new ring appears on click.
- Commits `0618791` and `3fdbe2e` have no attribution trailers.

## Artifacts
All files are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc468-review-r1-q9k2/`:
- Gate logs: `q9k2-tsc.log`, `q9k2-lint.log`, `q9k2-jest.log`, `q9k2-lifecycle.log`, `q9k2-e2e.log`, `q9k2-shots.log`, `q9k2-freeze.log`, `q9k2-parity.log`
- Vacuity logs: `q9k2-vac-jest.log`, `q9k2-vac-e2e.log`, `q9k2-vac2-jest.log`
- Probe logs: `q9k2-probe-jest.log`, `q9k2-probe-e2e.log`, `q9k2-probe7-e2e.log`
- Probe sources (never committed): `q9k2-probe.jsdom.test.ts`, `q9k2-probe.e2e.ts`
- Gate wrapper: `q9k2-gate.sh`
- The private worktree `…/sc468-review-r1-q9k2/wt` has been removed (`git worktree remove --force` + `prune`).

# SC-577 R2 independent review (Opus)

Executive summary
- Verdict: LAND-READY once the O6/O7 fold lands. MEDIUM-1 (dse CHANGELOG bullet) is a one-line docs add to do in the same fix round.
- Reviewed: dse `56e79252` (3 commits on b4e7b4f4), superproject worktree `dddf8cfe`. Both trees left exactly as found (dse clean; superproject ` M draw-steel-elements`, as at start).
- Findings: 0 HIGH, 1 MEDIUM, 2 LOW, 7 INFO.
- Gates I ran myself: tsc 0, lint 0, jest full 7089 passed / 1 skipped, initiative jest suites 417/417, e2e `257/263 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (exit 0, no flakes this run).
- Mutation check: each of the 3 source hunks, reverted alone, turns its converted test red (jest [M07]; [R01] + the new unit test; [R01]). With all 3 reverted, e2e INIT-M07 and INIT-R03 fail. With only the floor reverted, INIT-R03 fails on the note's value.
- Real-Obsidian probe (throwaway spec, deleted): Enter on − at 1 writes 0 once. − disables and focus moves to `init.malice.value` (ring shown), and stays there after the write. A second Enter writes nothing. Tab then reaches `init.malice.inc`. With a hand-edited `-2` the tracker shows 0, − is disabled, nothing is written on render or by a click on −, and + writes 1.
- `click-disabled` is a real pair kind (used by minion-pool-modal, stamina-edit-modal, stamina-bar). INIT-M07, a plain `it`, really drives it: coverage jsonl shows `init.malice.dec click-disabled test INIT-M07`. That pair is the 164th.
- Not re-run: shots, freeze, lifecycle, parity. No shot fixture has Malice 0 or a negative round_gain, and no lifecycle scenario drives the Malice stepper. The implementer reported freeze 280/280 with no movement, so there are no crops to check.

## Findings

### MEDIUM-1: no dse CHANGELOG bullet
- File: `draw-steel-elements/CHANGELOG.md:21-25` (section `## 7.0.0 (unreleased ...)`).
- Every neighbouring initiative/pool fix has a `[FIX]` bullet in the plugin's own changelog: SC-576 (:25), SC-575 (:43), SC-566 (:81) and SC-572 (:85). The R1 brief said "If dse has its own changelog convention per its AGENTS.md, follow that too." Only the superproject `CHANGELOG.md` got a bullet (`dddf8cfe`).
- Failure scenario: SC-577 ships in the next plugin release and its release notes leave it out. Users who hit `value: -1` see no record that it was fixed.
- Fix: add `- [FIX] **Malice in the initiative tracker never goes below 0** (SC-577). ...` at the top of the 7.0.0 list, in the SC-576 bullet's style. Say that − disables at 0, that a negative `round_gain` stops at 0, and that the button reads "Advance round (-3 Malice)". Once O6 lands, also say that a hand-edited negative value counts as 0.

### LOW-1: the read-only tracker shows a stored negative value as stored
- File: `src/elements/initiative/view.ts:508` (`this.renderMaliceValue(..., data.malice.value)` in the `!canWrite` branch).
- Probe P2b (jsdom, `canPersist: false`, `value: -2`): the tracker shows `Malice: -2`. The writable tracker shows `Malice: 0`, because the kit stepper clamps the seed.
- Failure scenario: a hand-edited `-2` shows 0 in the note, but the same block on a read-only host (an embed, a host that cannot persist) shows −2. That breaks O2 ("displays as 0") and O6 ("counts as 0").
- Fix: in the read-only branch, render through the O6 floored helper (or `Math.max(0, data.malice.value)`). Add a jsdom row: read-only + `-2` shows `Malice: 0`. This fits naturally in the O6 fold.

### LOW-2: jest pins neither the exact negative label nor the negative-gain arithmetic
- Files: `test/dom/elements/initiative-matrix.test.ts:246-251` (the label table has rows only for `undefined`, `0` and `2`); `:875-880` (the converted [R01] asserts only `not.toContain('+-')` and `value >= 0`); `:208-215` (the R01 advance table has no negative gain).
- Failure scenario: a regression that drops the gain from the label ("Advance round") passes jest, and so does one that floors to the wrong value (e.g. leaves 1 instead of 0, or writes 0 when 5 + -3 should give 2). Only e2e INIT-R03 and the model unit test catch these, and the model test never goes through the view.
- Fix: add `[-3, 'Advance round (-3 Malice)']` to the label table. Add rows to the R01 advance table (Malice starts at 3): `[1, -2, 2, 1, 1]` (reduced) and `[1, -5, 2, 0, 1]` (floored). The existing `amount: gain` log assertion then also pins O3.

### INFO
- INFO-1. Brief item 1 "typed entry (-5 / abc / 2.7)" does not apply. The Malice stepper is not `editable` (`view.ts:488-501` has no `editable`). The value node is a `SPAN` with tabindex −1 and there is no `init.malice.input` (probe P6). The only typed Malice path is the quick-add, which is unchanged: P5, −9 from 2, writes value 0 with log amount −9.
- INFO-2. Probes P3 and P9: with a negative gain from 0, Advance round still appends `R2: -3 — Round gain` while the pool stays at 0 (twice from 0 gives two −3 entries). This is O3's configured-amount rule; hand the case to SC-578 for its log-semantics question. All three O3 cases measured: gain −3 from 1, 3 and 0 → value 0, one write, log `{round: 2, amount: -3, label: 'Round gain'}`, − disabled afterwards.
- INFO-3. Labels measured (P4): +3 → `Advance round (+3 Malice)`; −1 → `(-1 Malice)`; 0, absent and −0 → `Advance round`. The visible text is always `Advance round`; the gain appears only in the aria-label (which is also the tooltip, per `iconButton.ts:25-34`). Pre-existing: `round_gain: 2.5` labels `+2.5` and adds 2.5, because round_gain is not validated as an integer. Out of scope.
- INFO-4. O6 baseline: today a hand-edited `-2` with gain 3 writes 1 on Advance (log +3), and a +3 quick-add from −2 also writes 1. Both are expected to become 3 in the fold. Stepper + from −2 already writes 1, which is consistent with "counts as 0" because the seed clamp makes it 0 + 1. Reset encounter from −2 writes 0 and − disables afterwards (P7). The grep turned up no other `malice.value` writers in `src/`. The only writers are `view.ts:498` (stepper), `view.ts:678` (quick-add), `model.ts:477` (advanceRound) and `EncounterData.ts:665` (reset). The encounter element's default (`encounter/view.ts:414`) only creates `{value: 0}`.
- INFO-5. The `click-disabled` manifest entry is required, not optional. The run.mjs gate fails any driven pair that no manifest lists (e2e/README.md:70-72), so INIT-M07's 4th click would have failed the full run without it.
- INFO-6. The user docs (`docs/initiative-tracker.md:246-250`, `:343-345`) never say the pool floors at 0. One optional sentence would cover it: "Malice never goes below 0: − is disabled at 0, and a spend or negative round gain stops at 0."
- INFO-7. Landing housekeeping. dse-verify's CURRENT e2e line still lists SC-577 among the known bugs; the new numbers are 257/263, 6 known-bug, 164/164. The worktree superproject's base is 0393ddfa while main is at 7adae033, but main's `CHANGELOG.md` has not changed since 0393ddfa, so `dddf8cfe` should merge without conflict.

## Evidence
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc577-rev-r2-opus/`
- `probe1.log`: jsdom probes P1-P9 (JSON dump after `PROBE`).
- `mutA.log`, `mutB.log`, `mutC.log`: one-hunk reverts (stepper min / floor / label).
- `e2e-mut.log`: all hunks reverted (INIT-M07 and INIT-R03 FAIL). `e2e-mutB.log`: only the floor reverted (INIT-R03 FAIL on value).
- `e2e-probe.log`: throwaway real-Obsidian probes ZZP-01/02, both ok. The spec file was deleted.
- `e2e-full.log`: run 20261111-104252-6e92, `257/263 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`, E2ERC=0.
- `jest-init-head.log` (417/417), `jest-full.log` (7089/1), `tsc.log`, `lint.log` (both exit 0).

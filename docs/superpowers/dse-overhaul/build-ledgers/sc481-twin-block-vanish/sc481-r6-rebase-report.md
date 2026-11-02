# SC-481 r6 rebase report

## Executive summary
1. Verdict: DONE. Rebased onto dse develop `34f46cf` (SC-525) with no conflicts; superproject rebased onto origin/main `8174d816`.
2. New plugin HEAD `458abe3` (was `2c5887f`); superproject `6b2f6a28` (was `3e74be1c`), CHANGELOG only, submodule pointer NOT bumped.
3. One CHANGELOG conflict (the SC-525 bullet landed in the same spot); resolved by keeping both bullets, SC-525 first.
4. Two test-only cases added (r5 LOW-1, LOW-2), red under their mutants, green on HEAD: +2 jest cases.
5. Full battery on `458abe3`: tsc/lint clean; jest 6201 passed / 1 skipped / 249 of 250 (6199 + 2); lifecycle 42/42 (21 + 21); e2e 124/124, 0 known-bug, 87/87; shots 592, 0 FAIL, host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze 280/280; parity 0/0/24. No flake appeared, no rerun needed.
6. SC-525 probe: passes (below).

## Rebase
- Plugin: `git fetch origin`: origin/develop = `34f46cf`. `git rebase origin/develop`, 11 commits replayed, no conflict (SC-481 touches neither `view.ts` nor `RefUnwrapView.ts`). `package.json` unchanged by SC-525 (no `npm ci`).
- Superproject: origin/main = `8174d816` (moved past the base `90f93611`). Rebased the two CHANGELOG commits; first one conflicted in `## Unreleased` with the SC-525 bullet; kept both (SC-525 bullet, then mine; no other bullet touched). Final bullet wording includes "blocks inside a callout or a quote ... (Identical blocks in two separate callouts are not covered in Live Preview yet.)". `git diff` shows only the CHANGELOG commits; the unstaged ` M draw-steel-elements` pointer was left alone.

## New tests (`test/dom/framework/twin-reuse.test.ts`, commit `458abe3`)
- LOW-1 (callout ordinal): `describe.each([true, false])` "two identical callouts holding two blocks each (view adoption %s)": two callouts, each with counters X and Y; each callout is drawn as a `.callout` element with a div per block; click X in the upper callout, then rebuild the way Obsidian does (new upper section, the lower callout reuses the old upper element, old lower discarded); assert 4 cards, each element has 1 child, shown ['X=6','Y=3','X=5','Y=3'], no error card, then a click on the lower X gives [6,3,6,3] and on the lower Y [6,3,6,4]. (+2 cases: adoption on and off.)
- LOW-2 (adoption path): `setup(..., windowed)` now draws each block inside a `div.callout` / `blockquote` element, as Obsidian does, so the r4 "UPPER one clicked" cases (callout and quote, which already assert `claims === 1`) take the real adoption path. The earlier cases had bare elements with no `.callout`/`blockquote` ancestor, which is why mutant `vac` could not show there.
- Mutants (my own definitions, same as R3's): `ord` = `quoteOrdinal(...)` replaced by `-1` in `fenceOnElement`; `vac` = `remountVacated` returns early when `prevEl.closest('.callout, blockquote')`.
  - `ord`: 2 red (both adoption variants of the new case) of `test/dom/framework`: 1088 passed, 2 failed. Log `sc481-r6-mut-ord-jest.log`.
  - `vac`: 3 red (r4 callout and quote UPPER-clicked cases, and the new adoption-on case): 1087 passed, 3 failed. Log `sc481-r6-mut-vac-jest.log`.
  - Both mutants reverted (`git checkout -- src`); `git status` clean after.

## SC-525 probe (real Obsidian 1.15.0, scratch harness, nothing committed)
- Block type: `ds-feature` with the whole body `@Lifecycle/ref-a.md` (RefUnwrapView-backed). Twins: two identical blocks. `app.vault.cachedRead`/`read` of `Lifecycle/ref-*.md` wrapped in-page with a 1200 ms delay at the moment of the edit.
- Write: the block edit form (`authoringControls` on), opened from the keyboard on the upper block, ref changed to `@Lifecycle/ref-b.md`, real click on Save. That write has no claim ticket, so Obsidian's reused element at the twin keeps the writer's view, and `reconcile` releases it (`reused-by-twin`) and remounts the twin.
- Result: start `[Alpha, Alpha]`. 300 ms after Save (loads in flight) both cards are still loading (`?`, no error card). After the delay: `[Beta, Alpha]`; note on disk has `@ref-b.md` in the upper block and `@ref-a.md` in the lower; 0 Notices, 0 page errors; no "Reference nesting too deep" card; the releases counter rose by 4 (writer's stale view plus the discarded twin's and the new section's old views).
- (A first variant with a hand edit instead of the form did not exercise the release: a hand edit does not change the writer's known body, so the twin's view was not stale, as designed.)
- Probe JSON: `.../scratchpad/sc481-r6-impl-b2/ref-head2/p481-ref.json`.

## Gates (logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/`)
- `sc481-r6-gate-tsc-lint.log`: tsc, tsc -p e2e, lint rc=0.
- `sc481-r6-gate-jest.log`: 6201 passed, 1 skipped, 249 of 250 suites.
- `sc481-r6-gate-lifecycle-1.log` 21/21; `sc481-r6-gate-lifecycle-2.log` 21/21 (G-S50, G-S53, G-S8, G-S15, G-S42 green).
- `sc481-r6-gate-e2e.log`: 124/124 ok, 0 known-bug, 87/87 pairs.
- `sc481-r6-gate-shots.log`: 592 PNGs, rc=0, 0 FAIL; run in the background (polled its own unique log for `rc=`, never waited on a notification), as the brief allows.
- `sc481-r6-gate-freeze.log`: 280/280. `sc481-r6-gate-parity.log`: 0 gaps, 0 undeclared, 24 declared.

## Drive-by fixes
None.

## Follow-ups
None new (Live Preview callout twins remains the r4 follow-up).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r6-rebase-report.md`
- Logs: `sc481-r6-gate-{tsc-lint,jest,lifecycle-1,lifecycle-2,e2e,shots,freeze,parity}.log`, `sc481-r6-mut-ord-jest.log`, `sc481-r6-mut-vac-jest.log` (same directory)
- Scratch (probe, harness copy, probe JSON): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r6-impl-b2/`

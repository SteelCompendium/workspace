# SC-644 r3 implementer report

## Executive summary
- Verdict: DONE. All 7 r2 findings folded (MEDIUM-1, LOW-1..LOW-6). Nothing pushed.
- dse head `3a0e79a3` on base `12aaf5b5` (SC-638; rebased cleanly, no conflict with the SC-638 `openNote` driver change). Superproject head `3a574dd6` on base `93d78f06` (origin/main when rebased; it has since moved to `ea6b4582`, docs only, dse pointer still 12aaf5b5): CHANGELOG `a34f8feb` + ONE pointer bump.
- jest 13068 passed / 1 skipped with shots cache (baseline 13033 + 21 r1 + 14 new) · tsc, lint clean.
- e2e run 1 and run 2: both `580/599 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` (as expected: baseline 576/597, 21 kb; +2 new SET tests, 2 markers flipped).
- lifecycle 64/64 (21+16+9+4+7+4+3, all 0 failed, no re-run needed).
- shots 592, host-leak 163/978, modal 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.
- No CSS touched. Per-finding detail, mutants and evidence below (finding detail measured on the previous base afd1436c; code unchanged by the rebase).

## Per finding
- MEDIUM-1 `src/elements/hero/view.ts` (constructor `watchPrefs`, `syncEditDefinition`, `actionsEl`/`editDefinitionBtn`): the hero's own "Edit definition" button is added/removed live; own owner Component per button, removed on re-render. Tests (`heroSheet.test.ts`, 5): on/off/on and click works, drawn-ON then OFF, regions not re-rendered, read-only never, unload then flip no-op. Mutants: no watch (3 red), button never removed (2 red), subscription not view-owned (1 red).
- LOW-1 `pipeline.ts` teardown filters `n.parentElement?.closest('[data-dse-element]') === root`. Test: nested block, drawn before and after the outer. Mutant (filter removed): 2 red.
- LOW-2 `pipeline.ts` catch calls `ensureCollapseInvariant(root)`; the vacuous test now collapses the broken block first and asserts attr null and no bar. Mutant (call removed): 1 red.
- LOW-3 O1 now `session.set<boolean | undefined>(..., undefined)`. Tests: after O1, the same block drawn again follows Start collapsed, and follows `collapsed: true`. Mutant (writes false): 2 red.
- LOW-4 multi-flip + rolling remount + redraw test (reader toggle still on record). Mutant M11 (clear on any rebuild of a collapsed block): now 1 red (was surviving).
- LOW-5 new `holdChromeFocus(root, pencil)` in `chrome/focusHandoff.ts`, used by `mountPipelineChrome`: same control, else Collapse, else first control; only if focus is free. Tests (6): Collapse, Edit pencil (flip Collapse; then pencil removed -> Collapse), Expand, non-chrome pencil (then removed: stays inside block), focus taken elsewhere mid-rebuild not stolen, nested block's focus. Mutants: no restore (5 red), free-guard dropped (1), collapse fallback dropped (1), first-control fallback dropped (1), same-item lookup dropped (3). I removed two branches that proved unreachable (a nested-owner check made redundant by LOW-1 plus the free-guard; an Expand fallback: a collapsed block can only have been focused on Expand, which is the same-item case) instead of leaving untested code.
- LOW-6 `e2e/driver/dse.ts` `setPrefs` awaits `diskData()` (flush + wait until data.json equals memory) after `closeEverything()`; `shippedPrefs` removed from `live-behavioural.e2e.ts`. Mutant (the await removed): SET-L05 red (collapse control not displayed), restored. Full e2e twice, both green (above).
- CHANGELOG bullet now says a hero sheet's "Edit definition" button comes/goes and focus stays on your button.

## Drive-by fixes
None.

## Follow-ups
- Hero "Edit definition" removal while it holds focus drops focus to body (the pipeline fix covers chrome/pencil only); not reachable except via the settings window.
- If the O2 switch (`START_COLLAPSED_REACHES_OPEN_BLOCKS`) is ever flipped, its branch needs a test (still unpinned while false).
- dse-verify SKILL numbers at landing: jest +35 on baseline, e2e `574/595`, 21 known-bug.

## Evidence (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r3-impl/)
FINAL-HEAD gates: jest-f.log, e2e-f1.log, e2e-f2.log, shots-f.log, freeze-f.log, parity-f.log, lc-f1.log..lc-f7.log (+ .rc). Earlier base (afd1436c) runs: jest-full.log, e2e1.log, e2e2.log, e2e-mut.log (LOW-6 mutant), shots.log, freeze.log, parity.log, lc-c1.log..lc-c7.log, lc-c7b.log (+ .rc each), mutate3.py, mut-N*.log.

## r3b (hero Edit definition focus hand-back)
- dse head `16737a8e` on base `12aaf5b5` (develop unchanged). Superproject head `b6a33ee0` on base `ea6b4582` (CHANGELOG `bd44886f` + one pointer bump).
- `src/elements/hero/view.ts` `syncEditDefinition`: when the focused Edit definition button is removed, focus goes to `firstControlOf(root)` (new exported helper in `chrome/focusHandoff.ts`, also used by `holdChromeFocus`); focus anywhere else, and adding the button, never move focus. I dropped the "only if nothing else holds focus" guard here: once the focused button is removed nothing else can hold it, so it was dead code.
- Tests: 2 new in `heroSheet.test.ts` (focus stays in the sheet then ON takes nothing; focus elsewhere / on Respite untouched). Mutants: no hand-back, hand-back unconditional, wrong target: each 1 red, restored.
- Gates: tsc, lint clean; jest 13070 passed / 1 skipped with shots cache (13068 + 2). e2e / lifecycle / shots / freeze / parity not re-run (first render unchanged; no CSS).
- Evidence: scratchpad `sc644-r3b-impl/` (jest-full.log, mut.py, mut.log).

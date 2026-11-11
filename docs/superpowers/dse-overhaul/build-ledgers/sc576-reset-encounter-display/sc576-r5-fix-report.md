# SC-576 r5 fix report

**Executive summary**
- DONE. Plugin branch `sc576-reset-encounter-display`, final sha `fbaba3da` (one new commit on `8645685a`). `origin/develop` still `97a9c93b`, no rebase. Not pushed.
- MEDIUM-A: `InitiativeView.update(model)` override clears `loadError` when the model differs from the one on screen; `onMount` removes a stale `data-dse-error-stage`. LOW-A: broken-statblock `[X05]` now asserts neither `init.reset-encounter` nor `init.reset-turns` is offered. INFO-C: changelog says "a 30-Stamina hero".
- Tests: +2 jsdom (recovery after an outside update; same-model update keeps the card), +2 assertions in the broken-statblock test. Mutations: removing `|| this.loadError` from `chromeItems()` fails 2 tests (broken-statblock, same-model); removing the `update` reset fails the recovery test.
- Gates on `fbaba3da`: tsc/lint clean · jest 7056 passed / 1 skipped / 260 of 261 suites, exit 0 (no SC-568 timeout this run) · lifecycle 52/52 (21+16+9+4+2, five separate calls, private `DSE_CAMERA_TMP` each) · e2e `OBSIDIAN-E2E done: 251/260 ok, 0 failed, 9 known-bug, coverage: 161/161 pairs` · shots 592, 0 FAIL, host-leak 163 button kinds, capture clip 147 · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- Reset write path untouched this round (only an `update` override and `onMount`): `[X01]` and the REFS test (merged keys not written) green; bytes were not re-diffed against the scratch fixtures.

## Changes
- `src/elements/initiative/view.ts`: `async update(model) { if (model !== this.model) this.loadError = undefined; await super.update(model); }` (as in the reviewer's `prescribed-fix.diff`; precedent: montage view overrides `update`). `rebuildFromWrittenReset` is unaffected: on failure it calls `update(this.model)` (same model, card stays); on success `loadError` is already cleared. `onMount` calls `root.removeAttribute('data-dse-error-stage')` after the error branch.
- `test/dom/elements/initiative-matrix.test.ts`: helper `brokenThenReset()` (captures the view through a `createView` spy, breaks the Orc note, Reset, card up). Tests: `[X05]` card ends when the same view gets a freshly prepared model (`prepareModel`, note restored): no card, no stage attribute, 2 cells, both reset items offered; `[X05]` an update with the model already on screen keeps the card and hides the reset item; broken-statblock test asserts no `init.reset-encounter` / `init.reset-turns`.
- `CHANGELOG.md` (plugin): "damaging a 30-Stamina hero by 5 right after a Reset wrote `current_stamina: -5` instead of 25".

Drive-by fixes: none. Follow-ups: none.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc576-impl-r5-t6h2vc/`)
`tsc.log`, `lint.log`, `static.rc`, `jest-matrix.log`, `jest-mutA.log` (no `chromeItems` guard), `jest-mutB.log` (no `update` reset), `jest.log`, `lc1.log`..`lc5.log` (+ `.rc`), `e2e.log`, `shots.log`, `freeze.log`, `parity.log`.

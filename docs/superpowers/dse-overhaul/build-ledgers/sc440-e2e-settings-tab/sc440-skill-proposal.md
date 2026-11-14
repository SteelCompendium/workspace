# SC-440 — proposed dse-verify SKILL.md updates (for the dispatcher at landing)

Measured on dse `941b814f` (on develop `7b9e82cf`: SC-626, SC-439, SC-625, SC-643 landed).

1. Battery row 4b "today" e2e line → `560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`
   (since SC-440: +82 e2e tests — settings `[SET-*]` plus `[CENSUS-16..17]` — and +129 pairs: 118 settings
   pairs + 11 `press:Enter` on Sync / Check / reset rows; new known bugs SC-644 ×2, SC-645, SC-646, SC-647,
   SC-651; SC-643 was fixed before landing and its tests `[SET-C03]`, `[SET-C07]` are plain). Previous:
   `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` (SC-643). Full-run wall time 320-460 s on
   a shared host (load 7-21).
2. CURRENT jest → 12875 passed / 1 skipped with the shots cache. SC-440 adds
   `test/dom/views/settings-matrix.test.ts`, `settings-integrity.test.ts`, `_settingsHarness.ts` and census
   tests.
3. CURRENT lifecycle 64/64 (no lifecycle id used; G-S124 free), shots 592, host-leak 163/978, modal host-leak
   40/240, capture clip 147, freeze 280/280, parity 0/0/24 — unchanged (the `src/` change is
   `data-dse-control` stamping only: `src/views/settingsControlIds.ts`, an always-true never-throwing
   `visible` predicate in `settingsDeclarative.ts`, inline stamps in `SettingsTab.ts`; shots/freeze/parity
   measured at `e4e2be2f` on `8a81c5a7`).
4. e2e note (Lifecycle and e2e notes): settings e2e (SC-440). Obsidian 1.14.4 opens settings in a POPOUT
   window; `e2e/driver/settings.ts` switches wdio onto it and `closeEverything()` returns to the main
   window. Page navigation slides for about 300 ms and swallows clicks: `showPage` / `back` wait (bounded,
   5 s) for the slide to settle. Sync / Check never reach the network: settings specs install a page-side
   `syncService.requestUrlFn` guard that throws unless a test calls `releaseStub.install()`. A drive on an
   `is-disabled` label records `click-disabled` only for `settings.` ids (`e2e/driver/dse.ts`). Reload
   survival is batched, one plugin reload per spec file; `ensureState` seeds `data.json` only in an
   `--only` run (`DSE_E2E_GREP`) and otherwise asserts the earlier drives left the expected state. Gate-ON
   specs use `dse.setPrefs({}, { experimental: true })` / `dse.setPrefs({})`.

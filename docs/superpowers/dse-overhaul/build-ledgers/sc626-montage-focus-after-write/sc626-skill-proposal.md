# SC-626 dse-verify SKILL.md proposal (for the dispatcher at landing)

1. New CURRENT block: dse `develop` @ <landed sha> (2026-11-14; SC-626 landed on `a5313f9d`; the montage keeps keyboard
   focus after a write, a strip / guide toggle and a window close: focus goes to the rebuilt control, or a documented
   nearest equivalent (`src/elements/montage/focusRules.ts`; kit `controlFocus.ts` gains opt-in `data-dse-focus-at`
   and per-family `fallbacks`; the Live Preview carry reads an optional `controlFocusRules()` on the view); the 4 e2e
   `knownBug('SC-626')` markers MONT-F01..F04 and jsdom `[K03]` are plain tests; new jsdom F01-F27, new e2e
   MONT-F05..F13; 2 new manifest rows (`press:Enter` on `montage.quick.success`, `montage.bar.back`); filed SC-650;
   no lifecycle id used (G-S123 free)):
   tsc and lint clean · jest **12167 passed / 1 skipped** with the shots cache (fresh: 12166 / 2) · lifecycle **64/64**
   · e2e **`OBSIDIAN-E2E done: 437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs`** · shots **592**,
   host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.
2. Battery table step 4b "today" figure -> `437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs`; known bugs
   now SC-257, SC-355, SC-384, SC-625 x2, SC-627, SC-628 x2, SC-629 (SC-626 removed).
3. "Lifecycle and e2e notes", Montage e2e bullet: jsdom `test.failing` markers for montage bugs become
   "SC-625 x2, SC-631" (drop SC-626).

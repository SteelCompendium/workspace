None of the four suspect toggles had SC-423's bug, so nothing you see in the plugin changes. The fix is a guard that stops a new toggle from reintroducing it.

**What was checked.** The negotiation argument chips, the "Mark spent" chip, the montage result chips and the Conditions modal choices all write `aria-pressed` by hand. None of them is a kit button (`.dse-btn`). They are option chips and colour swatches, and their pressed look keys on `aria-pressed` alone. The sheen rule that broke the initiative portrait (`:not([data-pressed])`) cannot reach them. We clicked each one in a real browser, dark and light, and compared it against a freshly rendered chip in the same state. All 8 sites matched before any change.

**What changed anyway.**
- **One helper.** `setPressedState(el, pressed)` in `src/framework/kit/iconButton.ts` now writes `aria-pressed` and `data-pressed` together. `iconButton`'s own `setPressed` uses it, and so do all 11 hand-written sites, including the two initiative copies from SC-423.
- **A jest guard.** `test/unit/build/ariaPressedWriters.test.ts` fails if any file in `src/` writes either attribute outside that helper. It has one allowlisted file: two read-only status spans in the initiative view, which display state and are not buttons.
- **A screenshot-run check.** `npm run shots` now prints `pressed toggle parity OK (96 comparisons across 8 sites x dark/light x rest/hover/focus-visible)`. A deliberately planted SC-423-style break turns it red, including one that only shows on hover.

Screenshots: there is no before/after, because no pixel changed. All 572 shots pass and the freeze check is unchanged at 276/276.

**Gates** on dse `develop` 9ed8dc6, branch `sc450-aria-pressed` @ c616e22:
- tsc and lint: clean.
- jest: 4849 passed / 1 skipped / 228 of 229 suites (9 new tests).
- lifecycle: 25/25.
- e2e: 68/76 ok, 0 failed, 8 known-bug, coverage 51/51 pairs.
- shots: 572, 0 FAIL.
- freeze: 276/276.
- parity: 0 / 0 / 24 declared.

**Review:** an independent reviewer ran its own browser probe (108 comparisons, all matching), tried 16 ways to sneak a bare write past the guard, and planted hover-only and focus-only breaks against the gate. Three rounds of its findings were fixed, and the final re-review approved. All 572 screenshots are byte-identical before and after.

Ready to land. The dispatcher lands it.

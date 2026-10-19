Fixed: after typing a new Stamina value, the first click anywhere on Apply now applies it and closes the modal. No second click needed.

**What changed for the user**

- **Stamina modal.** While you type in the Stamina or Temp Stamina field, Apply turns on and its label updates ("Lose 3 Stamina") right away, not only after the field loses focus. Clicking Apply saves what you typed.
- **Minion stamina pool modal.** It had the same bug, and it has the same fix.
- **The real cause was different from what the ticket said.** The button was not disabled when the click landed. When the field lost focus, the Apply label (or, in the pool modal, the info text above it) changed size, so Apply moved a few pixels between mouse press and release. The browser then dropped the click. Now everything near Apply updates while you type, so nothing moves when the field loses focus.
- Nothing else changes. If the typed value matches the current value, or the field is empty or not a number, Apply stays as it was. Escape still discards the edit.

**How it was checked**

- The e2e scenario `[STAM-S13]` no longer carries its known-bug marker. It now passes as a normal test in real Obsidian.
- A second e2e scenario, `[STAM-S13c]`, types into Temp Stamina and clicks Apply's edge. It fails when the fix is removed.
- New jest tests cover both modals. Most of them fail when the fix is removed.
- The full battery is green. Numbers below.

Nothing is needed from you. The branch is ready for the dispatcher to land.

---

Branch `sc430-apply-click` (draw-steel-elements), head `7644fb3` on develop `0d69ec9`.

- `e3d4158`: stamina modal fix
- `7659528`: minion pool modal fix
- `963a408`: pool modal info text follows the typed value
- `7644fb3`: S13c rewrite and comment corrections

The shared kit stepper gained two opt-in hooks, `onDraftInput` and `commitDraft()`. The default commit-on-blur behaviour is unchanged for every other caller, and lifecycle G-S3 still passes.

Gates:

- tsc and lint: clean
- jest: 4761 passed, 1 skipped, 227 of 228 suites
- lifecycle: 25/25
- e2e: 61/72 ok, 0 failed, 11 known-bug, coverage 47/47 pairs (was 59/71 with 12 known bugs; S13 is unmarked and S13c is new)
- shots: 572, 0 FAIL; freeze: 276/276; parity: 0 GAPs, 0 undeclared, 24 DECLARED (measured at `e3d4158`; later commits change nothing on first paint)

Independent review: LAND-READY at `7644fb3` after one fix round. The first review found the pool modal's heal-draft case, the corrected cause, and a vacuous S13c. A real-Obsidian probe of 14 scenarios now shows 0 elements moving at blur in either modal.

Out of scope: the unclamped label for a typed value above max is SC-427 (`[STAM-S08]`), and it is left untouched.

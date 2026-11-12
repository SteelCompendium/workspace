# SC-589 r1 implementation report

**Executive summary**
- Verdict: DONE. A half-typed Malice quick-add (amount + label, and the caret of the focused label box) now survives every whole-tracker rebuild; only a successful Add clears it; it is never written to the note.
- Branch `sc589-malice-quickadd-lost-on-rebuild`. dse head `d12e4675` (3 commits over base `e0e49d4d`: `d2885e05` fix, `ecc3deb8` jest, `d12e4675` e2e + dse CHANGELOG). Superproject `f8418870` (CHANGELOG only; the dse pointer bump is left unstaged for the land step). Nothing pushed.
- Gates: tsc (incl. e2e) clean, lint clean · jest 7323 passed / 2 skipped (base 7304 / 2; +19) · lifecycle 56/56 (21+16+9+4+6) · e2e `271/275 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (base 270/274, +1 test) · `styles.css` byte-identical to the base build (sha256 `5e5ff488...2b27`), so shots 592 / host-leak / capture clip / freeze 280/280 / parity 0/0/24 are carried, not re-run.
- Red on base: 11 jest tests fail without the fix (M10 and 10 of the new Q cases); e2e INIT-M10 fails on base (`Expected: "2"  Received: ""`).

## Design

**Where the draft lives:** `InitiativeView.quickAddDraft` (`src/elements/initiative/view.ts:145`), a plain `{amount, label, caret?}` object on the view instance. Not on the per-mount `owner` (released with every rebuild), not in the model (never serialised), so it outlives every `update()` and dies with the view (a remount starts empty, as ruled).

**Capture:** `captureQuickAddDraft()` (view.ts:169), called from the view's `update()` override (view.ts:161) just before `super.update()` empties the root. It reads the live boxes' `.value` and, for the focused box only, `selectionStart/End/Direction`. Chosen over tracking `input` events because (a) it is right whatever set the value (typing, autofill, a script; the M10 marker sets `.value` without an event) and (b) every rebuild goes through `update()`, so it covers a click elsewhere, `rebuildAndPersist`, `rebuildFromWrittenReset` (Reset encounter's re-parse), and an external `previous.update(model)` from the sidebar refresh, with no per-path wiring. If the tracker is not on screen (error card after a failed re-parse, before first mount) there are no boxes and the draft is left as it was.

**Restore:** in `buildMaliceQuickAdd` (view.ts:694-705) the new inputs get `value` from the draft, and the caret is re-applied with `setSelectionRange` in a try/catch (the amount box is `type=number`, which has no caret: `selectionStart` is null there, so nothing is captured for it). Focus itself is SC-588's `restoreControlFocus`, unchanged; it focuses the successor and the caret set at build time is what that focus lands on.

**Clearing:** a successful Add empties the boxes (as before) and sets the draft to empty explicitly (view.ts:754); the next capture reads empty boxes. A rejected Add leaves the boxes and so the draft.

**Derived state:** nothing needs recomputing beyond what the build already does. The hint line is empty on build, Add is always enabled (no disabled state exists), and the invalid flag / reason placeholder are cleared by the first keystroke, so a typed box is by definition in the un-flagged state. A restored draft therefore equals a freshly typed one (pinned by Q11: a rejected "1.5" draft comes back with no `aria-invalid`, the normal placeholder, an empty hint).

## Per rebuild path (full rebuild vs partial)

| Path | Mechanism | Result |
|---|---|---|
| Advance round | full rebuild (`rebuildAndPersist`) | draft kept (Q01, M10) |
| Reset turns | full | kept (Q02) |
| Make / Relieve captain | full | kept (Q03 x2) |
| Reset encounter -> Yes | full (`rebuildFromWrittenReset`, re-parse) | kept (Q04) |
| Reset encounter -> Cancel | no rebuild | same nodes (Q05) |
| any other `rebuildAndPersist` / external `update(model)` | full | kept (Q07, Q08) |
| Malice - / + stepper | PARTIAL: `onChange` only sets the value and `persist()`s; no `update()` | boxes untouched (Q06 passed on base too, kept as a guard) |
| Malice log expand/collapse | PARTIAL: kit `collapsible` toggles in place | untouched (Q06, same note) |
| successful Add (button / Enter in either box) | full | cleared, stays cleared on the next rebuild (Q10 x3) |
| rejected Add | no rebuild; then any rebuild | draft kept (Q11) |

Limitation (not new): an unparseable `type=number` entry such as `1e` reads as `''` from `.value` in a browser, so only the parseable part of an amount can be restored. Reported as a follow-up.

## Files changed (dse)
- `src/elements/initiative/view.ts`: `QuickAddDraft` interface + ids (118-129), field (145), `update()` capture call (161), `captureQuickAddDraft` (169-183), restore in `buildMaliceQuickAdd` (694-705), clear on Add (754), `CONTROL_ATTR` import.
- `test/dom/elements/initiative-matrix.test.ts`: `[M10]` now a plain passing test inside the `[M]` group (next to the log tests; the `known bugs` section and its comment block are removed because nothing is left in it: SC-588 was already fixed and this was the last marker); new `[Q]` group.
- `e2e/specs/initiative/malice.e2e.ts`: `[INIT-M10]`; `e2e/manifest/initiative.ts`: row `M10` added to the five controls it drives.
- `CHANGELOG.md` (dse, under 7.0.0, matching SC-588's `[FIX]` bullet); superproject `CHANGELOG.md` `## Unreleased` bullet.

## Tests added
- jest, 19 cases (the +19 in the total; M10 itself was already counted as `test.failing` at base): Q01 Advance round, Q02 Reset turns, Q03 Make/Relieve captain (2), Q04 Reset encounter Yes, Q05 Cancel, Q06 stepper -/+ and log disclosure (3), Q07 external `update()`, Q08 two rebuilds, Q09 untouched stays empty, Q10 Add via button / Enter-amount / Enter-label clears and stays cleared (3), Q11 rejected Add keeps the draft, no derived flag, not in any write, Q12 caret restored (2,5,backward), Q13 amount-only, Q14 remount starts empty / not written. Red on base: `jest-matrix-RED-on-base.log` shows 11 failed / 157 passed (M10, Q01, Q02, Q03 x2, Q04, Q07, Q08, Q11, Q12, Q13); the rest pass on base by design (they pin what must not change).
- e2e, 1 test `[INIT-M10]` (no ticket id in the title): type amount + label, click Advance round, both boxes hold the values; press the Malice + stepper, still held; note does not contain the label; click Add commits (log `{round 2, amount 2, label Feytouched}`) and both boxes are empty. Red on base with `--only=INIT-M10`: `Expected: "2" Received: ""`. No lifecycle scenario added.

## Gate lines
- tsc: `tsc rc=0`, `tsc-e2e rc=0`; lint: `lint rc=0`.
- jest (fresh worktree, `rm -f main.js styles.css` first): `Test Suites: 1 skipped, 263 passed, 263 of 264 total` / `Tests: 2 skipped, 7323 passed, 7325 total`, `jest rc=0`.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed` · `16/16` · `9/9` · `4/4` · `6/6` = 56/56, each `lc rc=0`.
- e2e: `OBSIDIAN-E2E done: 271/275 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, `e2e rc=0`.
- styles.css: sha256 of the build with the fix equals the one from the base-source build (the e2e red run): `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`; no CSS file touched. Shots/freeze/parity not re-run (carried: 592; host-leak 163/978; modal host-leak 39/234; capture clip 147; freeze 280/280; parity 0/0/24).
- Load at runs: loadavg 3-13, no timeout-shaped reds.

Evidence logs (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r1-impl/`): `jest-full.log`, `jest-matrix-RED-on-base.log`, `jest-matrix-red.log` (green run of the matrix file, name is historical), `e2e-1.log`, `e2e-RED-on-base.log`, `lc-1.log` ... `lc-5.log`, `tsc.log`, `tsc-e2e.log`, `lint.log`, `styles-base.sha`, `fix.patch`.

## Drive-by fixes:
none.

## Follow-ups:
- An invalid `type=number` entry (e.g. `1e`, `--`) reads as `''`, so it is lost on a rebuild (and was never submittable); a text input with `inputmode` would keep it. Low; owner's call whether it merits a ticket.
- The superproject worktree shows `draw-steel-elements` modified (the pointer to `d12e4675`); I did not stage it (land step / `wt-finish` owns it).

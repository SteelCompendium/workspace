# SC-340 Task 8 — controller addendum (binding; overrides the brief where they differ)

Everything below comes from rulings recorded in `progress.md` during Tasks 0–7. Keep the gate's SC-343 interface (FIXTURES, SCENARIOS, `t` names, ok/FAIL/done protocol, exit codes, `--only`, `DSE_LIFECYCLE_BUNDLE`) unchanged.

## 1. Counts
SC-343 landed with 6 scenarios (incl. `G-S6u`). SC-340 adds 13 → the final line is **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`** (the brief says 18/18 — wrong).

## 2. G-S6g is rewritten (hover popovers ARE writable)
Measured on Obsidian 1.14.2 (base and head alike, SC-343 final review): a hover popover's section resolves and a click writes the correct block. Replace the brief's G-S6g body: open the hover popover as the brief does, then assert (a) the popover's counter is writable (`data-dse-readonly` is not `"true"`), (b) clicking its Increase writes the RIGHT note/block (`Lifecycle/counter.md` value +1, the rest of the note byte-identical, note integrity ok), (c) no Notice, no page error, (d) after the popover is removed, the registry holds no connected entry for the popover (`live connected == rendered`). The brief's "if G-S6g fails, measure base and STOP" branch is moot — do not stop on it.

## 3. Extra assertions folded into existing scenarios (the count stays 19)
- **No wrong-instance adoption:** at the end of G-S1, G-S2, G-S3 and G-S4 assert `(await t.stats()).collisions === 0` and `ambiguous === 0`.
- **G-S3 — half-typed stepper draft (Task 6 fix):** add a second phase to G-S3 on a block with an EDITABLE stepper (e.g. a `ds-counter` if its stepper is editable — check `src/elements/counter/view.ts`; otherwise tokens/surges/resource). Click the block's own Increase (schedules a write), then within ~100 ms focus its stepper input and type a partial value (via `Input.insertText`). Let the write land and the block be adopted (same root tag). Assert: exactly ONE write from the click (the half-typed draft did NOT commit during the adoption: the file's value equals click-value, not the typed draft), the input still has focus and the typed text. Then press Tab (a real blur) and assert the typed value is written. This proves in Obsidian's Chrome 106 that Chromium's in-move blur is caught by the `data-dse-moving` marker, and that Obsidian does not detach the section a second time after focus is restored.
- **G-S3 focus:** if the focus/caret assertion fails because Obsidian's re-render leaves `activeElement` on something other than `body`/null, report it with the observed `document.activeElement` (tag/class) — do not change `adoptView`'s rule yourself.
- **G-S6c — Live Preview explicitly:** Obsidian's `mode: 'source'` renders Live Preview or raw Source depending on `state.source`. Run the pending-write toggle twice: once to Live Preview (`state: { mode: 'source', source: false }`), once to raw Source (`source: true`). In each: the pending write lands exactly once; the hidden reading root is never adopted into a Live Preview widget (assert via the registry: no entry whose root is inside `.markdown-source-view`/`.cm-editor`, or `stats.claims` unchanged by the toggle); after returning to Reading, exactly one live view for the block.
- **G-S6i — fast navigation:** before its final check, open 4 fixture notes in quick succession (≈150 ms apart, including `tracker.md` and `party.md`, which carry refs/nested blocks), then `other.md`; then assert live connected views == rendered blocks, and the total registry size equals connected views plus any leaked embed copies you can attribute (report the numbers). This covers the "render child never loaded → view never released" question from the Task 2/4/5 reviews: if the registry holds unreleased, disconnected, non-embed entries after the walk, report them with their sourcePath (DONE_WITH_CONCERNS) — don't change framework code.

## 4. Spec corrections (the SC-340 spec now lives on main; edit it in THIS worktree's superproject `docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md`)
Add a dated "Implementation notes (2026-09-24)" section near the top and correct inline:
- §6.4: registered callbacks run LIFO, so the view's flush (registered first) runs AFTER a modal's close — not before. The unload table's "Canvas, hover, print hosts" row: hover popovers resolve their section and write the correct block (measured); canvas and print stay read-only.
- §6.2 collision guard: implemented by POSITION (same docId + sourcePath + live line, each side refreshed via `getBlockInfo()` at claim time), ignoring instances whose current render child never loaded — not by preview container (the new `el` is detached at processor time). Claims pick the NEWEST matching ticket.
- §9.1: Chromium fires `change`/`blur` on a focused input WHILE it is still connected during removal (probed, Chromium 149), so an `isConnected` check cannot catch it; the implementation marks the moving root `data-dse-moving` and the stepper ignores a blur inside a marked root.
- §3 hover non-goal/§6.5 item 4 wording where it says hover stays read-only.
Do not rewrite the spec wholesale — targeted corrections + the notes section.

## 5. Docs otherwise per the brief's Step 6
F1 amendment; `.repo-docs/architecture.md` rows (`host/viewRegistry.ts`, `host/adoptView.ts`, `registerFrameworkElements.ts`, `ReadingModeBlockHost.ts`) + the "Write → adopt → release" paragraph (mention the `data-dse-moving` marker); `.repo-docs/integration.md` sentence; CHANGELOG — extend SC-343's `[INTERNAL]` bullet; dse-verify skill — step 4 expects `19/19`, list the SC-340 scenario ids, new "Current expected numbers" entry (Task 0 → final).

## 6. Discrimination proof
As the brief says, with a temporary `{ viewAdoption: false }` in main.ts: `--only=G-S1,G-S2,G-S3` must all FAIL (record the FAIL lines), then restore main.ts (`git diff main.ts` empty).

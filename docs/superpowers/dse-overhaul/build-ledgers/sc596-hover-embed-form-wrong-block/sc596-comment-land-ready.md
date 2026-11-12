The fix is ready to land: the edit form opened from an embed or a hover preview of part of a note no longer saves into an identical counter elsewhere in the note. If the note doesn't confirm which counter is yours, Save writes nothing. The form stays open and a Notice says why. No ask.

**What you'll see.** A form there now finds its counter the same way the + / - buttons do since SC-594: through the link the embed or preview was opened for, checked against the note's text, or else that window's own last save. Hover previews of a block or heading link with an identical counter elsewhere now save into the hovered counter (before, they refused).

**Which Notice appears.**
- "the block changed on disk first": the counter was edited or deleted from outside, or the link names two places.
- "the plugin can't tell where this block sits in the note": a stale callout with no record of the window's own save, or a section that vanished at the click.

**Rare shapes that saved before and now refuse.** These refuse even when no identical counter exists:
- a stale callout or a vanished section, for the form and for + / -;
- a heading link whose name occurs twice with identical counters, e.g. two `## Tracker` headings.

**Also fixed on the way.** A + / - in a stale callout that nothing could place used to be written into an identical counter. It is refused the same way now.

<details><summary>Mechanics</summary>

- dse branch `sc596-hover-embed-form-wrong-block` at `c6077860` on develop `7866426e`. CHANGELOG commit `bb622f86`.
- The form's pin goes through `rebaseCardPin`. A pin that can't be made is a refusing pin, never a null pin. `rebasePin`, `verifiedPinLine`, `embedStartLine` and `searchedPinLine` are deleted.
- jest: 10624 passed / 2 skipped (+2917). The new sweep covers 2880 cells; 1179 of the new tests fail on the old code.
- Lifecycle: 59/59. The new scenario G-S96 keeps the form open with a second pane. On the old code, 7 of 7 cells wrote the twin with no Notice. Now 8 of 8 write nothing and show one Notice.
- e2e: `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
- styles.css is unchanged, so shots, freeze and parity carry.
- Independent review: LAND, with 0 critical, 0 high and 0 medium findings. Its 3 low findings were folded in and re-reviewed.
- Not covered: SC-607 (a still-open preview follows what its link names now). Forms share that limit with the + / - buttons.

</details>

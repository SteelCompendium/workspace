The fix is ready to land. A Montage title typed as a number or true/false no longer breaks the card. A number typed in quotes is read as a number, so Add a round on `rounds: "3"` gives 4 rounds, not 31.

What you will see:

- `title: 2024` or `title: true`: shown as the text "2024" / "true". A save writes back what you typed (`2024`, not `"2024"`).
- `rounds: "3"`, `current_round: "1"`, and the same for `success_limit`, `failure_limit`, `successes`, `failures`: read as numbers. Add a round writes `rounds: 4` and End round writes `current_round: 2`. A value the montage does not change on that save stays exactly as you typed it, quotes included.
- Text that is not a number in one of those keys (`rounds: banana`) counts as the default an empty key gets (2 rounds, no limits, 0 tallies, round 1). It stays in the note as typed until the montage changes that value.
- `description: 5` is shown as "5" and kept. Before, the next save deleted it.
- A map or list as the title or description, or a block that is just `hello`, shows a plain error card ("Invalid data: 'title' must be text.", "Invalid data: the block must be a map of keys."). The card has no buttons, so the note is never changed. Before, a `hello` block was replaced by `rounds: 3` on the next save.
- An empty block still draws a new montage, as before. This differs from the Negotiation (SC-638), which already refused an empty block before its fix.

Nothing for you to do. The dispatcher lands it.

Also filed: SC-655 (Backlog). A logged action with a wrong-type value (`round: "2"`, `hero: 5`) is still deleted on the next save. That bug is in the logged-action list, not in the values this ticket covers.

+++ Agent notes

- dse branch `sc628-montage-wrong-type-values` head `10c271fe` on develop `12aaf5b5`; superproject: one CHANGELOG commit + one pointer bump on workspace main `ea6b4582`.
- Gates at `10c271fe`: tsc (+ `tsc -p e2e`) and lint clean · jest 13307 passed / 2 skipped fresh · lifecycle 64/64 (seven parts) · e2e `585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` · `styles.css` byte-identical to clean `12aaf5b5`, so shots / freeze / parity carry.
- `src/` change: `src/elements/montage/model.ts` only. A module-private WeakMap remembers each typed value; every write that assigns a number key forgets it (no own property on the model, SC-625 holds).
- Markers flipped to plain tests: e2e MONT-W01, MONT-W02. New e2e MONT-W04..W10. MONT-W03 (SC-629) untouched.
- Review: independent Opus review, LAND-READY with one LOW (correcting only an entry's skill/note/round re-typed an untouched quoted tally). Fixed in the last round; the scoped re-review was clean (rebase range-diff as expected, both mutants caught).
- e2e driver: error-card tests use SC-638's opt-in `openNote(rel, { errorCard: true })` (W08, W10 only).
- Accepted: Reset progress, Set limits and Undo write the keys they assign as plain numbers; `null` in a number key reads as the default.

+++

The fix is ready to land. Hand-typed values of the wrong type no longer break a Negotiation card with a raw JavaScript error, no save loses them, and the seal always matches how the negotiation ends.

What you will see:

- `name: 2024`, a motivation `name: 5` or `reason: 42`: shown as text. A save writes back the same number you typed (`2024`, not `"2024"`). That also holds after chip clicks, Complete Argument and Reset.
- `motivations: "foo"`, `pitfalls: {a: 1}`, a blank `-` item, `- Legacy`, `currentArgument: hello`, `motivationsUsed: "Peace"`, or a whole block that is just `hello`: a plain error naming the key, for example "Invalid data: 'motivations' item 2 must be an object." The error card has no buttons, so the note is never changed. Before, `- Legacy` and `currentArgument: hello` were overwritten on the first click.
- An empty block is still refused, as before. It now says "Invalid data: the block is empty." instead of a raw error.
- `current_interest: 0.4` shows seal 0 and ends with no deal. `4.5` shows seal 5 and is a deal. `current_patience: banana` shows Patience 0 and the final offer. The seal drawn for every value is the same as before; only the ending changed to match it. The summary line on the card's header now shows the same numbers as the seals ("Interest 0", not "Interest 0.4").

Nothing for you to do. The dispatcher lands it.

+++ Agent notes

- dse branch `sc638-negotiation-wrong-type-values` head `12aaf5b5` on develop `afd1436c`; superproject: one CHANGELOG commit + one pointer bump on workspace main (shas in the footer worktree line).
- Gates at `12aaf5b5`: tsc and lint clean · jest 13032 passed / 2 skipped fresh · lifecycle 64/64 (seven parts, at `daf75fc5` on `afd1436c`; later deltas are negotiation model, its header summary and e2e files, which no lifecycle scenario drives) · e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` · `styles.css` byte-identical to clean `afd1436c`, so shots / freeze / parity carry.
- Markers flipped to plain tests: e2e NEGO-W02, NEGO-W03; jsdom K03, K04. New e2e NEGO-W08..W11.
- Review: independent Opus review, LAND after one fix round. The fix round's change to how chip lists keep typed values introduced a regression (a chip toggle turned untouched numbers into quoted text). It was caught on re-review, fixed by per-text matching, and re-reviewed clean. Mutants: 8 of 8 killed.
- e2e driver: `openNote(rel, { errorCard: true })` is opt-in; SC-628 (montage twin) will need it.
- Dropped by ruling: wrong types in non-number fields (`hasBeenAppealedTo: maybe`, `initial_patience: [1]`) already agree with the seal and round-trip, so nothing changed there.

+++

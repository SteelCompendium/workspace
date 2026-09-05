**One pick: the cheat-sheet's toggle — `handle` (a disclosure row sitting directly above the board, my recommendation, first two images) or `chip` (a chip in the card head, third and fourth). Everything else from your comment is applied and needs only a yes/no.**

Legend, since colors matter: success = circled green check, failure = circled red X, with-consequence tiers say so in words under the glyph; the success track is green-edged filled tiles, the failure track red-hatched tiles. Shape carries every meaning — a greyscale proof of the strip is in the effort folder.

## The cheat-sheet — your idea, and it works

You were right that something was needed, and it is not clunky in this form: the foot panel answers "how does a montage work?" (read once, close), the strip answers "is this 13 a success?" (asked every roll). One row per difficulty, the three roll bands (≤11 · 12–16 · 17+) as columns, in the same seal glyphs the board already speaks. The full four-row book table (nat 19–20 included) stays in the foot panel, so nothing is lost. The strip is a pin, not a peek — once opened it stays until closed.

**`handle` — recommended.** The disclosure row lives directly above the board, so the strip opens exactly where its control is, and even closed the row acts as a label ("Test tiers"). It reuses the same disclosure idiom as the foot panel — the card ends up with one grammar, a reference panel bracketing each end of the instrument:

{{IMG:sc191-r5-cheat-open-dark.png}}

Closed, it costs one slim row:

{{IMG:sc191-r5-cheat-closed-dark.png}}

**`chip` — the alternative.** The toggle is a "TEST TIERS" chip in the card head (top right, under the round chip); the strip itself still appears above the board. The weakness is exactly the clunkiness you predicted: the content opens two card-sections away from the control that opened it.

{{IMG:sc191-r5-cheat-chip-closed-dark.png}}

{{IMG:sc191-r5-cheat-chip-open-dark.png}}

**Dedup, applied as promised** (veto if you disagree): while the strip is pinned, the foot panel's "Each test" block stands down to a one-line pointer plus the nat 19–20 note, and the panel's collapsed summary drops "test tiers" from its hint — the tiers are never stated twice at full size. Visible here with both open at once:

{{IMG:sc191-r5-guide-open-pinned-dark.png}}

And the strip survives a 300px sidebar (it stacks; nothing scrolls):

{{IMG:sc191-r5-cheat-narrow-dark.png}}

## The rename: `Record…` → `Log an action…`

Your confusion call was right, and the fix took an argument: the noun is **action**, not "test", because the sheet also writes assists and an assist is not a test — and "action" is already the card's own word ("one action each per round" in the deck). The verb is **log**, not "add", because "add" is already spoken for three times on this card (add a round, add a hero, the "+" socket glyph), and round 2 recorded a real bug from exactly that collision. Every surface now agrees: the bar button, the sheet title ("Log an action"), its commit button ("Log"), and the aria-labels; edit mode keeps "Correct" / "Save". The button kept its small "+" glyph — say the word if you want that gone too. Visible in the sheet, along with the new quiet tier hint under the Result field (grey text, deliberately not the orange warning treatment — that slot stays reserved for the skill-reuse rule):

{{IMG:sc191-r5-sheet-log-dark.png}}

## Equal-width tracks

Applied as you specified: both tracks span the same total width — either limit ending the montage makes them the same scale — so the three failure tiles are wider than the six success tiles, and the tail sentences now start on a common left edge. Finished state, with the tensed tails:

{{IMG:sc191-r5-tracks-done-dark.png}}

## The "+" ghost lane

Gone from the DOM, as promised in my last comment — "add a round" lives only in the ⋯ menu now. Every shot above already reflects it.

---

Mechanics: branch `sc191-montage-overhaul` (dse), round-5 commit `6991108`, rebased onto origin/develop `1619396` (post SC-190 + SC-120), not pushed. A useful side-proof from the control shots: the round-4 mock renders byte-identical before and after that rebase, so SC-190/SC-120 moved zero pixels in the montage's rendering. Mocks only (`visual-harness/sc191/mock5.*`, `round5.css`); no shipped code touched. Full battery green against the post-SC-120 numbers: tsc/lint clean · jest 3394 passed / 1 skipped · shots 474 PNGs, 0 FAIL, twice byte-identical · freeze 210/210 · parity 0 GAPs / 0 undeclared / 16 declared. All 25 shots (light scheme and greyscale proofs included) in `.superpowers/sdd/sc191-montage-overhaul/`; full report in `sc191-round5-report.md`. Once you pick the toggle, I believe the design is settled and this becomes an implementation ticket.

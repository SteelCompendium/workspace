**One pick: the rider mark for "with a reward" / "with a consequence" — `pip` (a small solid triangle riding the seal's corner; my recommendation, shown in every image below) or `ring` (a notched seal) or `double` (your double-check idea, carried to its limit). Everything else from your comment is applied and needs only a veto: the flipped strip, the Power Roll row treatment with an `edge` wash, and the crit row it earned back.**

Legend, colors named: success = circled green check, failure = circled red X (hatched fill in light theme); the tier rows carry the Power Roll edge colors — red for the ≤11 band, amber for 12–16, green for 17+, gold for crit. Shape and words carry every meaning; greyscale proofs are in the effort folder.

## The flip — the strip now IS a Power Roll table

Rows are the roll bands (≤11 · 12–16 · 17+ · crit), columns Easy / Medium / Hard, exactly as you asked — and it adopts the shipped Power Roll component rather than imitating it: the row labels are the real `.dse-pr__badge` clip-path key boxes, and each row carries the real Power Roll tier edge and wash. The flip earned back the book's fourth row (crit, a natural 19–20), so the strip now states the complete table and the foot panel's pinned-mode stub becomes a pure pointer:

{{IMG:sc191-r6-pip-open-dark.png}}

The shipped Power Roll row for comparison — the rhyme is the point:

{{IMG:sc191-r6-powerroll-dark.png}}

**Your gradient idea worked, with one adjustment — both are mocked, say `pr` if you disagree.** The shipped wash fades out over 60% of the row, which is calibrated for a row of continuous text; across a three-cell lattice it puts the Easy column on tinted ground and the Hard column on plain ground — a left-to-right difference that means nothing. First image is that literal `pr` wash (see Easy vs Hard grounds), second is the recommended `edge` wash, which ends at the badge gutter so every cell sits on one ground while the colored edge and hue survive:

{{IMG:sc191-r6-pip-wash-pr-light.png}}

{{IMG:sc191-r6-pip-wash-edge-light.png}}

## The riders — and why your double-check instinct hit a wall

Direct answer to "is there an equivalent?": no, and the reason decides the design. The rider is **orthogonal** to the outcome — the book attaches "with a consequence" to successes and failures alike — so any treatment that redraws the seal itself (a doubled check, a doubled X) turns the rider into a claim about *degree*: a double X reads as "worse failure", which the book never says. The rider needs a second channel, not a different seal.

That is your pip idea, adopted as the recommendation: the seal stays untouched and a small solid triangle rides its bottom-right corner — point-up ▲ for a reward, point-down ▼ for a consequence — with the words still written in the cell, so shape and text both carry it and it survives greyscale and the 300px stack:

{{IMG:sc191-r6-pip-narrow-dark.png}}

The two alternatives, mocked for real rather than dismissed: `ring` re-cuts the seal (double-struck for reward, notched for consequence) — one channel doing two jobs; `double` uses your ✓✓ for reward plus a dagger mark for consequence — the reward reads instantly but the failure side inherits the degree problem above:

{{IMG:sc191-r6-strip-ring-dark.png}}

{{IMG:sc191-r6-strip-double-dark.png}}

## Two judgment calls you can overrule

1. **The crit row stays.** Its three cells are identical (success with a reward at every difficulty) — and that repetition is the honest statement, it completes the book's table, and it is what lets the foot panel stand down entirely while the strip is pinned. Cost: about 2em. Veto to cut it.
2. **Nothing else needed flipping.** The foot panel's full table has been band-rows × difficulty-columns since round 4 — the strip was the transposed odd one out. With the flip, strip, foot panel, book, and the sheet's tier hint all share one grammar.

---

Mechanics: branch `sc191-montage-overhaul` (dse), round-6 commit `951d679`, rebased onto origin/develop `778a341` (post SC-195), not pushed. Mocks only (`visual-harness/sc191/mock6.*`, `round6.css`); no shipped code touched. The round-5 control re-shot on the rebased tree is byte-identical to the shots you reviewed, so SC-195 moved zero montage pixels. Full battery green against current numbers: tsc/lint clean · jest 3491 passed / 1 skipped · shots 478 PNGs, 0 FAIL, twice byte-identical · freeze 210/210 · parity 0 GAPs / 0 undeclared / 16 declared. All 30 shots (light scheme and greyscale proofs included) in `.superpowers/sdd/sc191-montage-overhaul/`; full report in `sc191-round6-report.md`. With the rider pick, I believe the design is settled and this becomes an implementation ticket.

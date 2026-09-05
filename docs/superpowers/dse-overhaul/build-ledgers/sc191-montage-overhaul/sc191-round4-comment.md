**Two picks close the design phase: (1) the outcome band — `merged` (my recommendation, first image) or `bars-off` (second image); (2) confirm that ink seals + centre spacing stand — you never explicitly picked those two axes, and everything here is built on them.**

Everything from your last comment is applied. Legend for every shot, since the colors matter: success = circled green check, failure = circled red X, assist = dashed grey ring with a ⊕ — shape carries the meaning, so all of it survives greyscale (a greyscale proof is in the effort folder).

## `merged` — recommended

One outcome band instead of two. The two tracker bars you liked survive, but they move *inside* the footer you kept and become the only statement of the totals: fill = successes so far, track length = the limit, tail sentence = the distance in words ("1 from Total Success"). The success track is green-edged filled tiles; the failure track is red-hatched tiles. Deleted as duplicates: the head's two count chips, the board's round-tally foot row and its oversized grand cell, the `5/6`-style numerals, and the two verdict stat lines. Each fact now appears exactly once.

{{IMG:sc191-r4-merged-mid-dark.png}}

Two things kept that look like duplicates and are not — overrule me if you disagree: the `Round 3 / 3` head chip (at sidebar width the board's round header row is hidden, so it becomes the only place the montage's length is written) and the per-hero Tally column (who is carrying the montage appears nowhere else, and it is what a Director scans when deciding who acts next).

## `bars-off` — the alternative you floated

You said the bars "may not be necessary," so here it is for real. With the tracks gone the distances have nowhere to be drawn, so the numerals come back (`5/6 · 1 from Total Success`). It is about 1.4em shorter. I am not torn: the bars are the only thing on the card that answers "how close are we?" without arithmetic — which is one of the four threads this ticket opened with. Take `bars-off` only if the merged band feels too tall.

{{IMG:sc191-r4-barsoff-mid-dark.png}}

For reference, the round-3 recommended state you last reviewed ("before" — byte-identical to the round-3 shot, so every difference above is this round's work):

{{IMG:sc191-r4-before-mid-dark.png}}

## Rules guidance — collapsed by default

Closed, it is one short row at the card's foot — shorter than the round-tally row the dedup deletes, so the recommended card is *shorter* than round 3's even with the panel added:

{{IMG:sc191-r4-guide-closed-dark.png}}

Open, it carries the real book tables, re-derived from the heroes book source (not the condensed references — which is how I caught a docs error, below). The most useful thing the research found: **"difficulty" means two different things in a montage test and the book uses the same three words for both** — the per-test tier table (easy/medium/hard outcomes per power roll) and the montage's success/failure limits (Easy 5/5, Moderate 6/4, Hard 7/3, ±1 per hero over or under five). So the panel labels its blocks by what they set — "Each test" and "The montage" — never by the bare word "difficulty". Also included, one line each: two rounds by default, one action per hero per round, no skill twice per hero, an assist is its own rolled test, and the three outcomes with their Victory awards (1 Victory for total success on easy/moderate, 2 on hard; 1 for partial success on moderate/hard).

{{IMG:sc191-r4-guide-open-dark.png}}

Deliberately left out (you said twice this must not eat real estate): the prep-a-challenge-list guidance, "when to montage at all," Director-craft sidebars, and the default consequence/reward line — that last one lives better as a per-test note, and the sample note in the shots uses it. If you want one more block, the prep list is the one I would add.

## The Record button, explained (your ask)

**In one sentence: `Record…` opens the same sheet a cell opens, pre-filled with the next thing that is almost certainly about to happen — so the Director can log an action without first finding the right cell.** The board's in-cell ✓ / ✕ / ⊕ buttons stay the fast path; `Record…` covers the rest: naming the skill, attaching a note, recording out of board order, or when the live column is off-screen. It opens a modal sheet (the SC-186 ConditionsModal precedent in production) with five fields — Hero chips, Round chips, Result (Success / Failure / Assist, each with its own glyph), optional Skill, optional multi-line Note. It arrives pre-filled with the current round and the next hero yet to act, and the title says so in words, so you can see what it will change before you change anything. It never writes until `Record` is pressed; `Undo` in the action bar sits behind it.

{{IMG:sc191-r4-sheet-record-dark.png}}

The same sheet in edit mode is what a cell's pencil chip opens — pre-filled from the existing record, plus a danger-styled Remove, the skill-reuse rule firing as a live warning, and the new Note field ("a consequence to remember later…"). A noted cell gets a permanent dog-eared page mark drawn in the metal grey; the outcome band lists every note with its result glyph and an address back to the board (`Bram · round 2 · lift`):

{{IMG:sc191-r4-sheet-edit-note-dark.png}}

## Padding — root cause, not whack-a-mole

Your "few padding issues" were one bug: a `padding-bottom: 0.62em` resolving against each cell's own font size, so the small hero/tally labels got a 6.94px gutter while the 16px round headers got 9.92px — three different gutters from one declaration. Fixed with a fixed-unit gutter; all four header labels now land on the same measured baseline (253.83px). The edit pencil chip also has real padding and margin now.

A small bug the dedup exposed, already fixed: round 3 printed "1 more ends it" under a *finished* montage. The tail sentences are now tensed — the finished card reads "the success limit, reached":

{{IMG:sc191-r4-done-dark.png}}

## Two judgment calls you can overrule

1. **The note mark sits in the cell's top-right corner, sharing it with the edit chip** — a permanent datum next to a transient control. The alternative (top-left) put the mark ~60px from its own centred content, where it read as belonging to the neighbouring column. Current rule: a cell's top-right corner is where its record is annotated and amended.
2. **At 300px the four-column tier table side-scrolls in its own box** (Hard column off the right edge below). Standard answer for wide content, but in a static screenshot it can read as clipped. If it bothers you, the fix is a stacked one-block-per-difficulty layout at narrow — a DOM change for the implementation round, cheap to include if you want it.

{{IMG:sc191-r4-narrow-guide-open-dark.png}}

## Follow-ups filed

- **SC-285** — the round-4 research caught `reference/draw-steel-agent-reference.md` misstating the montage Victory awards (it misses the moderate partial-success award and the 2-Victory hard total success). The panel above uses the book's numbers.
- **SC-284** — round 3's `.dse-head` narrow-form gap (card headers wrap one word per line in a 300px sidebar), now a real ticket.

---

Mechanics: branch `sc191-montage-overhaul` (dse), round-4 commit `617a254` on origin/develop @ `c09cf6f`, not pushed; develop has moved since (SC-190, SC-120) — the implementation round will rebase first. Mocks only (`visual-harness/sc191/mock4.*`, `round4.css`); no shipped code touched. Full battery green: tsc/lint clean · jest 3257 passed / 1 skipped / 185 suites · shots 474 PNGs, 0 FAIL, twice byte-identical · freeze 210/210 · parity 0 GAPs / 0 undeclared / 16 declared. All 19 shots (light scheme and greyscale proofs included) in `.superpowers/sdd/sc191-montage-overhaul/`; full report in `sc191-round4-report.md` there. Once you pick, this becomes an implementation ticket.

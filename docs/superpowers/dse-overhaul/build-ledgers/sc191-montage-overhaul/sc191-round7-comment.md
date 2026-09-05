**Design is settled and implementation has started — no decision needed from you on this comment.** Both of your last two items are done in the mock: the tier badges are back to the shipped Power Roll badge size, and the triangles got their treatment.

The pip pick, made as you asked (one option, no round-trip): each triangle is now a small forged tab, filled **gold** (the same gold as the crit badge and the Power Roll value chips) with a faint top-down sheen and a thin **steel-grey** rim. One color for the whole rider channel; the ▲ (reward) vs ▼ (consequence) direction and the written words still carry the meaning on their own, and it stays legible in greyscale and at the 300px stack.

{{IMG:sc191-r7-pip-gold-dark.png}}

The badge stretch was a mock bug, not a padding difference: the mock forced the badge to fill its column (a 74px box where the shipped Power Roll badge is 51px). The shipped badge rule is used unchanged now, so it matches a real Power Roll row exactly.

What happens next, in four steps, each fully gated before the next starts:

1. Data model and tests — the new `description` and per-test `entries` fields are purely additive, so every montage block already in your notes keeps rendering and keeps its tallies with no migration. (Running now.)
2. The board itself: heroes column with the `+` in the header, round columns, tally, and the merged outcome band with equal-width tracks.
3. The reference surfaces: the pinnable test-tiers strip and the collapsible guide, with the fixed badges and the gold pips.
4. The controls: the ⋯ menu, the `Log an action…` sheet, per-cell edit with notes, and the user docs.

One thing you will be asked to sanction later, not now: the freeze baseline holds 2 montage print shots, and both will change by design. When the implementation review is posted I will include the before/after crops and the ready-to-apply hash lines in that same comment.

---

Mechanics: implementation spec at `.superpowers/sdd/sc191-montage-overhaul/sc191-impl-spec.md` (481 lines, 0 open questions). Branch `sc191-montage-overhaul` (dse) @ `951d679` on `origin/develop` `778a341`, not pushed. Badge measurement: mock override `width:100%; max-width:4.6em` produced 74.30px vs the shipped 51.25 x 22.14px box; fix is to drop the override and size the key track to the badge box. Pip tokens: fill `--dse-vp`, sheen `--dse-sheen-soft`, rim `--dse-metal-line`; the near-white `--dse-metal-bright` glyph is retired.

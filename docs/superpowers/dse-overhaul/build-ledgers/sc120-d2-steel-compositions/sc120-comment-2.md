**Approve Batch C: four families — ancestry, perk, condition, rule — get the Steel card head (crest + small-caps family label), shown in the before/after pairs below.** Approving a family = its frozen steel-print hash pair gets swapped at landing. Approve all four, or name any family you want changed.

Each pair is before (plain bold title + pill badge) on top, after (crest + eyebrow head) below, all dark scheme.

**Ancestry** — the worst offender from your SC-121 comment. Now: shield-crest with a two-person glyph, "ANCESTRY" eyebrow, and a SIGNATURE TRAIT band above the flavor (name only — no ancestry in the corpus has a trait description yet):

{{IMG:sc120-before-ancestry--steel-dark.png}}

{{IMG:sc120-after-ancestry--steel-dark.png}}

**Perk** — gem-glyph crest, "PERK" eyebrow (will read "CRAFTING PERK" etc. if perk groups ever populate; today none do):

{{IMG:sc120-before-perk--steel-dark.png}}

{{IMG:sc120-after-perk--steel-dark.png}}

**Condition** — lightning-bolt-glyph crest, "CONDITION" eyebrow, replacing the pill badge:

{{IMG:sc120-before-condition--steel-dark.png}}

{{IMG:sc120-after-condition--steel-dark.png}}

**Rule** — open-book-glyph crest. The eyebrow is deliberately absent here: for an inline rule it would just repeat the title ("RULE" over "RULE"), so it's suppressed when duplicate. Making it show the rule's group ("COMBAT") like the site tile needs an adapter fix — filed as SC-272:

{{IMG:sc120-before-rule--steel-dark.png}}

{{IMG:sc120-after-rule--steel-dark.png}}

Also folded in per your comment: the kit hybrid-mode empty-band-head guard. Its proof is negative — the kit shots stayed byte-identical through the whole batch.

---

Mechanics, for the record: implemented as `layout.steel` band data only, zero new CSS; base render branch untouched. Independent review LAND-READY (its one real finding was the RULE/RULE duplication, fixed above; the deeper fix is SC-272). Full battery green: tsc/lint clean, jest 3282 passed, shots 0 FAIL, parity 0 gaps / 0 undeclared / 16 declared. Freeze: exactly 10 lines move — {ancestry, condition, perk, perk-narrow, rule} × print+realprint (perk-narrow is the 300px fixture of the same perk layout) — hashes deterministic across runs, twin==realprint per family, baseline count stays 210. Hash swap happens at landing, after your word, from the completed tree. Batches A (class/career stat-tile strips) and B (treasure/title/complication/culture) are next and will come as their own asks.

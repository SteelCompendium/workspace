**Approve Batch B — the final four families: treasure, title, complication, culture — shown in the before/after pairs below.** Approving a family = its frozen steel-print hash pair gets swapped at landing. Approve all four, or name any family you want changed. This completes the ten-family set; with your word here (Batch A, two comments up, is still open too) the whole ticket is ready to land.

Each pair is before on top, after below, all dark scheme.

**Treasure** — the card that was actively broken: before, the Project values rendered twice (once as a row, again as body prose). Now: package-crate-glyph crest (the site uses a treasure-chest icon that Lucide doesn't have — this is the closest honest stand-in, yours to veto), "TRINKET · ECHELON 1" eyebrow, keyword chips, a two-tile PROJECT row (goal / roll characteristic), and an EFFECT band that keeps the "Additionally, …" rider text together with its effect. Each value now renders exactly once. Two notes: the eyebrow uses Echelon because the Level field is empty on every one of the 127 treasures while Echelon is populated on 77; and this example note carries Item Prerequisite / Project Source only as body text (no structured fields), so they stay as body lines rather than getting bands — real treasures with the fields get proper bands:

{{IMG:sc120-before-treasure--steel-dark.png}}

{{IMG:sc120-after-treasure--steel-dark.png}}

**Title** — the barest card of the ten inverted: crown-glyph crest, and the eyebrow is "ECHELON N" instead of the word "Title" (the site's own grammar for titles), with PREREQUISITE and EFFECT bands replacing what used to be suppressed entirely:

{{IMG:sc120-before-title--steel-dark.png}}

{{IMG:sc120-after-title--steel-dark.png}}

**Complication** — octagon-alert-glyph crest (an octagon with an exclamation mark), "COMPLICATION" eyebrow, and structured BENEFIT and DRAWBACK bands. The site tile shows neither; every complication in the corpus carries both, so the plugin card does it better:

{{IMG:sc120-before-complication--steel-dark.png}}

{{IMG:sc120-after-complication--steel-dark.png}}

**Culture** — deliberately light: map-glyph crest, "CULTURE" eyebrow, one SKILL OPTIONS band. Culture's other structured fields are empty across all 13 cultures, so no dash-row padding — the honest ceiling:

{{IMG:sc120-before-culture--steel-dark.png}}

{{IMG:sc120-after-culture--steel-dark.png}}

One layout note that applies to all four (and matches the Batch C cards you approved): the italic flavor paragraph sits below the structural bands, not above them. Whether flavor should move to the top of every Steel card instead is filed as SC-280 for a separate call — say the word if you want it pulled forward.

---

Mechanics, for the record: `layout.steel` band data only, zero new CSS; base render branch untouched. The body-line stripping that replaces prose with bands was this batch's risk, and review earned its keep: the independent reviewer caught two real content-deletion bugs pre-ask (a packed line that lost a whole treasure variant; stripping without a replacing band) — both fixed with band-gated, segment-aware stripping, verified against all 306 real Browse files of these four families with zero content losses, and the delta re-review came back clean. A last hardening pass (same gating for career's stripper; byte-neutral to every shot) is finishing now and gets its own scoped re-review before landing. Full battery green at dse `6fb65b8`: tsc/lint clean, jest 3385 passed / 1 skipped, shots 0 FAIL, parity 0 gaps / 0 undeclared / 16 declared. Freeze: exactly 10 lines move — {treasure, title, complication, complication-edit-btn, culture} × print+realprint (complication-edit-btn is the authoring-pencil fixture of the same complication layout; its bytes are identical to complication's, proving the pencil is print-inert) — hashes deterministic across runs, twin==realprint per family, baseline count stays 210. Effort total: 24 frozen lines across the three batches, all hash swaps, applied at landing from the completed rebased tree after your word.

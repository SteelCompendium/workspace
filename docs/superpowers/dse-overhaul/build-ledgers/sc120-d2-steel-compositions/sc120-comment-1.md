Design round done — every display family will get the Steel card head (crest + small-caps family label, like the site's cards), replacing today's plain bold title + pill badges. No ask yet; this comment is direction only.

Per-family plan, grounded in what the site actually renders and what the data actually carries:

- **class, career, treasure** — full compositions with stat-tile rows (class: Basics + Potency 3-up strips like the site's class head; career: the site tile's 4-slot dash-filled row; treasure: Project row + per-level effect bands, which also fixes a real defect — today's treasure card renders its Project values twice).
- **complication, title** — labeled bands (Benefit/Drawback, Prerequisite/Effect). The site tile shows none of these; the plugin card has the room, so it does it better.
- **ancestry, culture** — one band each (Signature Trait; Skill Options). Their other structured fields are empty across the whole corpus, so no dash-row padding.
- **perk, condition, rule** — head + body only. Their models carry nothing else structured; that is the honest ceiling, not a shortcut.

Below: today's class card vs the site class head it will follow (dark scheme).

Current plugin render — bold title, label/value list, prose wall:

{{IMG:sc120-before-class--steel-dark.png}}

Site target — crest-less page head with eyebrow, right-rail primaries, two tile strips:

{{IMG:sc120-ref-class-page--dark.png}}

Implementation runs in three batches (head-only families first, tile-grid families, then labeled-line families), each independently reviewed. You'll get one evidence comment per batch with per-family before/after shots and that batch's frozen steel-print sign-off ask — 10 families total, baseline count stays 210 (hash swaps only). The kit card is untouched throughout and doubles as the regression proof for the shared machinery; the SC-100 hybrid-mode empty-band-head guard you asked to fold in is in the first batch.

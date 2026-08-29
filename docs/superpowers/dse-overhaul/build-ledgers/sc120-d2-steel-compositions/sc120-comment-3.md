**Approve Batch A: class and career — the two stat-tile families — get their full Steel compositions, shown in the before/after pairs below.** Approving a family = its frozen steel-print hash pair gets swapped at landing. Approve both, or name what you want changed. (Your Batch C "go for it" is recorded — those four families are locked in for the landing swap.)

Each pair is before (plain bold title, label/value list, prose wall) on top, after below, all dark scheme.

**Class** — the site class head, ported: shield crest with a "CLASS" eyebrow, "MIGHT · REASON" as large boxless text over a small "primary characteristics" caption in the top-right (boxless on purpose — that is how the site renders it), then a BASICS tile strip (21 / +9 / 10) and a POTENCY strip (Reason −2 / Reason −1 / Reason). One deliberate call to know about: the body prose is kept whole, so the "Basics" section further down still repeats those values in sentence form — that matches the site's class page, where the head is a summary above the full text, not a replacement for it:

{{IMG:sc120-before-class--steel-dark.png}}

{{IMG:sc120-after-class--steel-dark.png}}

**Career** — briefcase crest, "CAREER" eyebrow, and the site tile's four-slot CAREER BENEFITS row (Languages / Project Pts / Renown / Wealth, dash-filled when a career lacks one). Unlike class, the duplicate body lines ARE stripped here (the tile row is their replacement), including the "You gain the following career benefits:" lead-in. Two deliberate divergences from the site, both yours to veto:

1. The Languages tile shows the numeral "1" where the site tile spells "One" — in the tile's small-caps face the capital O reads as a digit zero ("0ne" looked like a typo), and every other tile value is numeric anyway.
2. The tile row also covers Project Points, so its body line is stripped along with the other five (leaving it would have double-rendered the value — the same defect the treasure card currently has).

{{IMG:sc120-before-career--steel-dark.png}}

{{IMG:sc120-after-career--steel-dark.png}}

---

Mechanics, for the record: `layout.steel` band data plus two shared Steel-scoped CSS additions (an n-up tile-grid variable and the right-rail caption rule); base render branch untouched. Independent review ran two fix rounds (orphaned lead-in strip, boxless right rail, five smaller findings) and a scoped delta re-review came back clean; the numeral one-liner lands in Batch B's review round. Full battery green at dse `eadacc7`: tsc/lint clean, jest 3320 passed / 1 skipped, shots 0 FAIL, parity 0 gaps / 0 undeclared / 16 declared. Freeze: exactly 4 new lines move — {class, career} × print+realprint — hashes deterministic across runs, twin==realprint per family, baseline count stays 210. Effort running total: 14 sanctioned-or-asked lines of the planned 22. Hash swaps happen at landing, after your word, from the completed rebased tree. Batch B (treasure/title/complication/culture) is implementing now and will come as the final ask.

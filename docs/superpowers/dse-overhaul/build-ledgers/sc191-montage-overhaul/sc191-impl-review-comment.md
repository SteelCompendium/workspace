**Two things from you, both yes/no: (1) sanction the freeze-baseline change for the montage's 2 print shots (before/after below) plus the 14 new montage print lines, and (2) say whether the shipped element below can go to review-for-landing as-is or name what to change.**

The montage element is implemented end to end on the design you settled: the board with heroes down the side and rounds across, the merged outcome band with equal-width success and failure tracks, the pinnable test-tiers strip as a real Power Roll table with the gold pips, the collapsible "Running a montage test" guide, the `+` in the Heroes header, the ⋯ menu (add a round, add a hero, set limits, reset progress), the action bar with `Undo`, `End round N`, and `Log an action…` (and `Reopen` + `Clear all` once the montage is over), and per-cell edit with notes that list in the band. Every montage block already in your notes keeps rendering and keeps its tallies — the new fields are additive.

## What to look at

Mid-montage, dark theme — the whole card with the strip pinned:

{{IMG:montage-strip-pinned--steel-dark.png}}

The `Log an action…` sheet, captured in a real Obsidian window (the ⋯ menu is the plugin's shared element menu and carries add a round / add a hero / set limits… / reset progress):

{{IMG:montage-sheet-modal.png}}

Light theme, montage complete:

{{IMG:montage-done--steel-light.png}}

Print — this is the "after" you are sanctioning; the "before" (the old element) is next to it:

{{IMG:sc191-freeze-montage--steel-print-before.png}}

{{IMG:sc191-freeze-montage--steel-print-after.png}}

Colors, named: success seals are circled green checks, failure seals circled red X (hatched fill in light theme); tier rows carry the Power Roll edge colors (red for the ≤11 band, amber for 12–16, green for 17+, gold for crit); the pips are gold with a steel-grey rim, ▲ for reward and ▼ for consequence, with the words beside them. Shape and words carry every state; color only reinforces.

## What is deliberately not in this ticket

Nothing. The settled design shipped whole; the user docs (`docs/gm-trackers.md`) describe the element as it is, with no "not yet" notes needed.

## Review summary

Two independent reviews plus two scoped re-checks found and fixed 3 HIGH / 10 MEDIUM issues before you saw this — the ones that would have reached you: the "if it ended now" line said Total Failure when the heroes were ahead by 3 (Partial Success was unreachable while a montage was live), the print view drew every board cell as a white box, the pinned test-tiers strip printed as an unlaid-out blob (the printed card lost the tier table), and after that was fixed the ▲/▼ pips still printed as empty outlines. A gap in the spec was also caught: the mock's `End round N` button had been dropped, which left no way to advance past round 1 — it is in now, with `Undo`. Last catch: a montage that ended on a limit mid-round kept "IN PLAY" over its final round column; it now reads done like the cells under it. All eight write-integrity probes pass in a real vault flow: text above and below the block survives every write, two montages in one note don't cross-talk, a hand-edited value survives a re-render, a deleted block regenerates, an old-shape block edited through the UI writes the new shape with nothing lost, rapid edits coalesce to one write, read-only mode disables every control.

---

Mechanics: branch `sc191-montage-overhaul` (dse) @ `c2a5cec` on `origin/develop` `9227dd9` (post SC-202 pin bump), not pushed. Battery: tsc/lint clean · jest 3697 passed / 1 skipped / 195 suites · shots 508 PNGs, 0 FAIL, byte-identical ×2, host-copy pin OK (1.14.0), button host-leak OK · freeze: exactly `montage--steel-print.png` and `montage--steel-realprint.png` moved, 0 others · parity 0/0/16. Ready-to-apply lines for the dispatcher at landing: `.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt` (2 lines) and `widening.txt` (14 lines, additions-only, 0 collisions). Reports: `sc191-review2-report.md`, `sc191-fix3-report.md` (fix 3 + SC-202 re-gate), `sc191-rereview2-report.md`, `sc191-fix4-report.md`, `sc191-rereview3-report.md`, spec `sc191-impl-spec.md`.

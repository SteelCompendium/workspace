**Ask: reply "sanctioned" to accept 40 changed print-freeze lines. Or reply "skills only" to limit the fix to the 8 Skills lines.**

The visual harness no longer cuts off tall shots. Before, any shot taller than the 1200 px browser window came out blank white past that point. That is why the Skills shots stopped partway down the list. Now the harness enlarges the window for each tall shot, so the whole element is captured. The freeze gate can see the lower half of the Skills list, including the Lore group, for the first time.

It was not only the Skills family. 135 of the 572 browser shots were cut off, and 40 of those are frozen print shots. My recommendation is to accept all 40. With "skills only", the other 32 frozen shots would stay partly blank, including Statblock, Montage, Negotiation and Class.

**Skills print shot, before.** The list stops partway through the word "Dance", and everything below is blank white.

{{IMG:sc349-r1-skills-steel-print-before.png}}

**Skills print shot, after: the bottom of the same shot.** The Lore group is now visible, including Strategy (added in SC-328, which until now left no trace in the shots).

{{IMG:sc349-owner-skills-steel-print-after-tail.png}}

A second problem was fixed along the way. Shots taken after a click or hover had scrolled the page, so the TOP of the element came out blank. The frozen Montage "guide open" print shot was blank white for its first ~1,370 rows.

**Montage "guide open" print shot, top, before:** entirely blank.

{{IMG:sc349-r1-montage-guide-open-steel-print-before.png}}

**Same shot, top, after:** the Montage card starts at the top.

{{IMG:sc349-r1-montage-guide-open-steel-print-after.png}}

---

**Details**

- **Cause.** On screen media the harness loads Obsidian's own stylesheet. That stylesheet makes the page body exactly one window tall and clips anything outside it. Real-print shots were not affected, and none of them changed.
- **What did not change.** All 437 shots that were not cut off are byte-identical before and after. All 572 shots were compared, not only the frozen ones. The independent reviewer reproduced every hash on a separate checkout.
- **New check.** A new check inside `npm run shots` fails the run if any shot is taken with part of its element outside the window. The reviewer proved it fails when the fix is switched off.
- **Gallery.** The one remaining long page, the gallery overview, is exempted by name for now. Capturing it whole would take about 18 seconds and about 20 MB per image on every run. Its fate is SC-484.
- **The 40 frozen lines** (all `--steel-print.png`):
  - Skills (8): `skills`, `skills-narrow`, `skills-chips`, `skills-chips-narrow`, `skills-ledger`, `skills-ledger-narrow`, `skills-hero-picks`, `chrome-skills-menu`
  - Statblock (17): `statblock`, `statblock-charbox-on`, `statblock-charbox-onword`, `statblock-charline-two`, `statblock-collapsed`, `statblock-columns-wide`, `statblock-disttarget-ledger`, `statblock-disttarget-text`, `statblock-edit-btn`, `statblock-featstyle-flat`, `statblock-kwusage-grid`, `statblock-kwusage-ledger`, `statblock-kwusage-text`, `statblock-stats-gridc`, `statblock-stats-ledger`, `statblock-with-captain`, `chrome-hover-statblock`
  - Montage (8): `montage`, `montage-done`, `montage-failed`, `montage-guide-open`, `montage-mid`, `montage-narrow`, `montage-old-shape`, `montage-strip-pinned`
  - Negotiation (2): `negotiation-ended`, `negotiation-narrow`
  - Other (5): `ancestry`, `class`, `chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-placement-trio`
- **Hash file.** Ready to apply: `.superpowers/sdd/sc349-skills-print-clip/rebaseline.txt` (40 lines, identical across 2 runs and the reviewer's run). The skills-only subset is `rebaseline-skills-only.txt`.
- **Gates** at dse `d34b0fe`, on `develop` `0ce76dd`: tsc and lint clean · jest 5416 passed / 1 skipped · lifecycle 29/29 · e2e 88/92, 0 failed, 4 known-bug, 64/64 pairs · shots 572, 0 FAIL · parity 0 / 0 / 24.
- **Still in progress.** A small fix round is tightening the new check and naming the gallery exemption. It changes no image, so these 40 lines stand.

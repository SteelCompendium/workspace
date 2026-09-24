**Ask: may I rebaseline 16 frozen print screenshots of the Skills element? They changed only because 7.0.0 now includes the three skills 6.0.2 added (Carpentry, Cooking, Strategy).** Reply "sanctioned" (or say what's wrong) and the dispatcher applies the lines at landing.

Everything else on this ticket is done and green. The ask is the only thing blocking the landing.

**What changed in the screenshots**

The Skills list now has two more rows under Crafting: Carpentry and Cooking. They are outlined by a box in the right half of each image. Every row below them moves down by two rows. The third new skill, Strategy (Lore), sits below the part of the page the screenshots capture, so it only changes the page height. That capture limit is a separate, older gap, filed as SC-349.

{{IMG:sc328-freeze-skills-before-after.png}}

{{IMG:sc328-freeze-skills-chips-before-after.png}}

In each image, the left half, labeled "BEFORE develop", is today's develop. The right half, labeled "AFTER sc328", is this branch. The first image is the plain Skills list; the second is the chips layout.

The reviewer confirmed the cause: with only the three skills removed from the branch, all 260 frozen screenshots match byte for byte. The 16 files are the eight Skills layouts, each in its two print variants.

**What the branch does (for the record)**

- 7.0.0 no longer bundles JSZip. The compendium download now unzips with fflate, as 6.0.2 does. The production `main.js` contains zero `createElement("script")` calls. Today's develop contains 4, which is what Obsidian's review rejected.
- New build gate: `npm run build` and `npm run build-no-check` (the command CI runs) both fail if `main.js` ever contains `createElement("script")` again.
- The 6.0.2 hotfix is merged forward into develop as a real merge commit. This also brings in the three skills from #81. When you release 7.0.0, `main` can still fast-forward to develop.
- `versions.json`, README and `docs/migrating-to-7.md` now name 6.0.2 as the last build for Obsidian older than 1.13. The CHANGELOG has the 6.0.2 entry.
- Not addressed: the ticket also says `main`'s own `npm run build` fails on 11 type errors. That only affects main (6.0.2 has already shipped), so I left it alone.

**Mechanics**

- Branch `sc328-fflate` in draw-steel-elements, HEAD db2a206, contains develop f6fb208 (fast-forwards onto develop). It carries merge commits, so land it without a flattening rebase.
- Battery: tsc and lint clean. jest 3946 passed / 1 skipped. Both builds exit 0 with the gate passing. 524 shots, 0 failures. freeze 244/260, and the 16 failures are exactly the Skills lines listed in rebaseline.txt. parity 0 gaps / 0 undeclared / 16 declared. Independent Opus review: APPROVE. Its 5 low findings are fixed and re-reviewed.
- Rebaseline lines: `.superpowers/sdd/sc328-fflate/rebaseline.txt` (16 lines).

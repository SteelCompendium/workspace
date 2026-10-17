# SC-416 round 3: scoped re-review of steel-etl `c2bf829`

**Executive summary**
- Verdict: **LAND-READY**. No BLOCKER, MAJOR or MINOR findings. One INFO item, which is a pre-existing typo and not caused by this diff.
- `c2bf829` touches only `input/heroes/Draw Steel Heroes.md` (+5/-5) and `input/monsters/Draw Steel Monsters.md` (+19/-20). Every hunk maps to one of A–H.
- `git show --check` is clean (no whitespace errors). The commit message has no attribution trailer.
- The Dwarf Mortar moved block is byte-identical: the 14 removed lines equal the 14 added lines (`cmp`).
- r3 gen exited 0 with "3096 classified items from 4 books", and the log has 0 WARN/ERROR lines. I reverted the timestamp churn in github.io `docs/api/v1/`.
- I also ran a baseline gen of `0c74f4f` in a scratch copy and diffed all of `data-unified/en`. Every changed file is one of the expected entities in all formats, plus 4 non-dse md files for Flameslinger, `chapter/{retainers,classes}.md`, `class/{conduit,talent}.md`, and the heroes `clean` book. md-dse changed in 8 files, and nothing unexpected changed. The total file count is the same (3093 in md-dse).
- Item H checks out against the PDF. Conduit's own 4th-level table (heroes.txt:8219-8240) lists Creation = Improved Hands of the Maker and Trickery = Blessing of Secrets, and Conduit's 1st-level table (heroes.txt:7725-7729) has Creation = Hands of the Maker. Both new targets exist in `classification.json`.

## Per-prescription verification (md-dse = `<wt>/data/data-unified/en/unified/md-dse`, my greps)
- **A, Hexer** (M:27565-27566 is now `> **Level 7 Role Advancement Ability**` plus a blank line, the same form as Level 4/10). `role-advancement/hexer.md`: Backfire Curse=4, Take Root=7, Mazed=10. The baseline diff shows only lines 44 and 137 changed (`level: 4` to `level: 7`), so Take Root's text is intact.
- **B, Undead Servitor** (M:29018 is now `> **Level 7 Retainer Advancement Ability**`). `advancement-features/undead-servitor.md`: Grab and Bite=4, Death to Death=7, Death Miasma=10. Only lines 39 and 130 changed (level), so the text is intact.
- **C, Psi Boost** (H:15867). The word-diff is exactly `discipline` to `clarity`, plus 2 links changed from `feature.null.level-7/psi-boost` to `feature.talent.level-6/psi-boost`. `feature/talent/level-6/psi-boost.md` has 0 `discipline` or `feature.null` matches, has "spend additional clarity", and links to talent's own code 4 times.
- **D, Troubadour** (H:16445-16446). `class/troubadour.md` now reads `7th | Signature, 3, 5, 7, 9 | 5, 9` and `8th | Signature, 3, 5, 7, 9, 11 | 5, 9`, which matches the book. Column padding is preserved.
- **E, Gnoll Gnasher** (M:28282, M:28336). `statblock/gnoll-gnasher.md:3,31` has `ev: '-'`, the same as `goblin-guide.md:3,32`. `advancement-features/gnoll-gnasher.md:51,119` has `name: Horrific Feast`.
- **F, Flameslinger** (M:28425 row deleted, one copy kept). The md and md-linked statblock lose the duplicated row (diff `31d30`). md-dse `statblock/hobgoblin-flameslinger.md` is byte-identical to baseline, because the parser had already ignored the duplicate (size 1M, speed 5, stamina 48, stability 0, free_strike 5). The row deletion did not damage any prefix.
- **G, Dwarf Mortar** (M:28036-28066). `advancement-features/dwarf-mortar.md` order is Signal Shell=4, Screaming Shell=7, Pacifier Shell=10. The member blocks match baseline as a multiset: the per-member md5 sets are equal in both the frontmatter and `ds-fb`. Top-level keys are identical. Only the order changed.
- **H, Conduit table** (H:7167, H:7177). The 2 rows that pointed at `feature.ability.censor.*` (Creation, Trickery) now point to the conduit codes. The other 6 rows link `feature.censor.level-4/*` and have no Conduit code, so they were left alone, as the ruling requires. `feature/conduit/level-4/4th-level-domain-feature.md:25,35` carries the new links. gen reported 0 unresolved-link WARNs.
- `grep -rn '########'` over `books/monsters/md-linked/monster/retainer/` and `chapter/retainers.md`: 0 hits.

## Findings
- BLOCKER, MAJOR, MINOR: none.
- INFO (pre-existing, not introduced): `Draw Steel Monsters.md:28062` (Dwarf Mortar, Pacifier Shell ≤11 tier) ends `([save](…saving-throw) ends` with no closing `)`. It shows in md-dse `dwarf-mortar.md` as `tier1: 8 damage; I < WEAK [dazed] ([save] ends`. The book reads "8 damage; i<w dazed (save ends)". The fixer correctly moved this block verbatim (G said change nothing inside), so this is not a defect of `c2bf829`. Prescribed fix if the owner wants it: append `)` at M:28062. That is a one-character text fix with no SCC impact. It could fold into this ticket or go to Backlog; owner's call.

## Tree state
After the run, superproject `git status --porcelain` shows only ` M steel-etl` (pointer at `c2bf829`, not committed; expected). steel-etl and github.io are clean.

# SC-416 round 1: survey report (6.0.2 bug report vs 7.0.0)

**Executive summary**
1. Conduit abilities mis-leveled/duplicated: FIXED-IN-7
2. Hexer role advancement Level 7 missing: STILL-PRESENT (changed form: Take Root is there but tagged `level: 4`)
3. Talent Psi Boost says "discipline": STILL-PRESENT
4. Troubadour table (dropped 3; 8th class-act column has 11): STILL-PRESENT (both cells)
5. Gnoll Gnasher "EV 60" / "Horrific Feas": STILL-PRESENT (both)
6. Goblin Guide Poison Blade text cut off: FIXED-IN-7
7. Undead Servitor Level 7 header has stray "########": STILL-PRESENT (source; in md-dse it shows up as Death to Death tagged `level: 4`)
8. Beacon of Grace "that creature" wording: N/A. The text matches MCDM's Heroes v1.01b word for word, so the ambiguity is the book's and we don't rewrite it.
None of the prescribed fixes adds, renames or removes an SCC code.

## Method / provenance
- Worktree `/home/scott/code/steelCompendium/worktrees/sc416-bugreport`. Superproject `92e0bbf`, steel-etl `0c74f4f`, draw-steel-elements `a337460`.
- `steel-etl gen --config pipeline.yaml --all`: **exit=0** ("Shared outputs regenerated over 3096 classified items from 4 books."). Log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc416-bugreport/sc416-r1-gen.log`.
- What a 7.0.0 user gets: DSE `CompendiumSyncService.ts:10-11,377` fetches the latest `SteelCompendium/data-unified` release asset `md-dse-unified-en.zip`, so the payload is `data/data-unified/en/unified/md-dse/` (abbreviated `U/` below).
- Book ground truth: `pdftotext -layout` of `/home/scott/Documents/DrawSteel/PDFs/Draw_Steel_Heroes_v1.01b.pdf` and `.../Draw_Steel_Monsters_v1.01.pdf`. These match the source `printing:` values, 1.01b and 1.01. The text dumps are in scratch; `HPDF:n` / `MPDF:n` below are line numbers in them.
- Gen side effect: it rewrote the `generated` timestamp in `steelCompendium.github.io/docs/api/v1/{index,scc}.json`. I reverted both files, and the tree is clean again (`git status --porcelain` is empty in the superproject and every submodule).
- Live release check: latest is `v4.20261009132439` (2026-10-09, tag commit `5ac1aef`). Its only asset is `md-dse-unified-en.zip`. The repo tree at that tag (`en/unified/md-dse/`) has the same top-level layout as the worktree gen (ancestry … treasure; `feature/ability/conduit/level-N/`; `monster/retainer/{advancement-features,role-advancement,statblock,summoner}`). I fetched individual files through the contents API: the released content has the same state for items 2, 3, 4 and 5 (Take Root `level: 4`, Gnasher `ev: "60"`, Troubadour 7th `Signature, 5, 7, 9` and 8th `5, 9, 11`, Psi Boost "discipline"). I did not download the zip.

Source files: `H` = `steel-etl/input/heroes/Draw Steel Heroes.md`, `M` = `steel-etl/input/monsters/Draw Steel Monsters.md`.

## 1. Conduit abilities mis-leveled/duplicated: FIXED-IN-7
- In md-dse, abilities are grouped by level in folders `U/feature/ability/conduit/level-N/`. Each file also has frontmatter `level:` and an SCC code `feature.ability.conduit.level-N/<id>`. The folder level is the class-feature level the ability sits under.
- Source: `H:7184-7189` Blessing of Secrets, inside 4th-Level Domain Feature (Trickery). `H:7252` "9-Piety Ability" under `### 5th-Level Features` (H:7242) holds Beacon of Grace H:7257, Penance H:7274, Sanctuary H:7289, and Vessel of Retribution H:7300. `H:7668` "11-Piety Ability" under `### 8th-Level Features` (H:7653) holds Arise! H:7673, Blessing of Steel H:7684, Blessing of the Blade H:7695, and Drag the Unworthy H:7706. Each heading appears once in the source.
- Output: each ability appears exactly once, at the right level.
  - `level-4/`: blessing-of-secrets.md only
  - `level-5/`: beacon-of-grace, penance, sanctuary, vessel-of-retribution (`level: "5"`)
  - `level-7/`: guided-to-your-side, trinity-of-trickery only
  - `level-8/`: arise, blessing-of-steel, blessing-of-the-blade, drag-the-unworthy (`level: "8"`)
  - No other conduit level folder holds any of these.
  - The container files `U/feature/conduit/level-5/9-piety-ability.md` and `level-8/11-piety-ability.md` carry only the intro sentence and do not embed the abilities.
  - Blessing of Secrets also exists under `feature/ability/censor/level-4/`. That is correct, because the Censor has its own copy (H:5482).
- The Conduit Advancement Table (`H:6213-6224`) agrees: 4th lists Domain Feature, 5th lists 9-Piety Ability, 8th lists 11-Piety Ability.

## 2. Hexer role advancement Level 7: STILL-PRESENT (changed form)
- 7.0.0 has one featureblock per role, `U/monster/retainer/role-advancement/hexer.md` (SCC `mcdm.monsters.v1/monster.retainer.role-advancement/hexer`), not one file per level. So the 6.0.2 "missing Level 7 file" construct doesn't exist anymore, and Take Root **is** present.
- Defect: the featureblock tags Take Root with **`level: 4`**. It should be 7. Levels across the three features are Backfire Curse=4, Take Root=4, Mazed=10. Every other role comes out as 4/7/10 (I checked all 9 roles).
- Root cause `M:27565`: `> ######## Level 7 Role Advancement Ability`, followed by `>` at M:27566. Every other marker uses the form `> **Level N Role Advancement Ability**` on its own blockquote line, with a blank line after it (for example M:27549 and M:27581). The parser doesn't recognize this marker, so Take Root inherits level 4.
- Fix: in `M`, replace lines 27565-27566 with `> **Level 7 Role Advancement Ability**` plus a blank line, so `> 🏹 **Take Root (Encounter)**` starts a new blockquote, the same as M:27549-27551. SCC: no change, because the members of a role-advancement featureblock are uncoded.

## 3. Talent Psi Boost "discipline": STILL-PRESENT
- Source `H:15867` (Talent, `### 6th-Level Features` H:15855, `#### Psi Boost` H:15865): "...you can spend additional discipline to apply a [psi boost](scc.v1:mcdm.heroes.v1/feature.null.level-7/psi-boost)...". The section was copied from Null's Psi Boost at H:12088.
- Book `HPDF:14742` (Talent 6th-level Psi Boost): "you can spend additional **clarity** to apply". So this is our transcription error, not MCDM's.
- Output `U/feature/talent/level-6/psi-boost.md:18` (and the ds-feature block) carries "discipline".
- Fix at `H:15867`:
  - Change `discipline` to `clarity`.
  - Re-point both `psi boost` links from `feature.null.level-7/psi-boost` to Talent's own `feature.talent.level-6/psi-boost` (the code exists in the registry), or unlink them.
- SCC: no code change.

## 4. Troubadour Advancement Table: STILL-PRESENT
- Source `H:16445` 7th row, Abilities column: `Signature, 5, 7, 9`. Book `HPDF:15184-15185` reads `Signature, 3, 5, 7, 9`.
- Source `H:16446` 8th row, Class Act Abilities column: `5, 9, 11`. Book reads `5, 9`. The 11 first appears at 9th, which matches the class-act ability features at 2nd/6th/9th (`HPDF:15572,15918,16071`).
- Output `U/class/troubadour.md:64-65` has the same two cells.
- Fix: in `H:16445` change `Signature, 5, 7, 9` to `Signature, 3, 5, 7, 9`. In `H:16446` change the last cell `5, 9, 11` to `5, 9`. SCC: no change.

## 5. Gnoll Gnasher EV / Horrific Feas: STILL-PRESENT (both)
- EV: source `M:28282`, `|  Abyssal, Gnoll | - | Level 2 | Harrier Retainer | EV 60 |`. All 21 other retainer statblocks have `EV -` (M:27687…29133). The book header (`MPDF:23045`) shows no EV for any retainer.
- EV output: `U/monster/retainer/statblock/gnoll-gnasher.md:3,31` `ev: "60"`. goblin-guide.md has `ev: '-'`.
- Title: source `M:28336` `> 👤 **Horrific Feas (Encounter)**`. Book `MPDF:23088` reads "Horrific Feast".
- Title output: `U/monster/retainer/advancement-features/gnoll-gnasher.md:51,119` `name: Horrific Feas`.
- Fix: `M:28282` change `EV 60` to `EV -`. `M:28336` change `Horrific Feas` to `Horrific Feast`.
- SCC: no change. The statblock code `monster.retainer.statblock/gnoll-gnasher` is unaffected, advancement-feature members are uncoded, and no `horrific-feas` code exists in `classification.json`.

## 6. Goblin Guide Poison Blade truncation: FIXED-IN-7
- Source `M:28411-28417` has the full text.
- Generated effect (`U/monster/retainer/advancement-features/goblin-guide.md:60`, also :67 and :139), verbatim: "The guide applies poison to their weapon. The next time the guide obtains a tier 2 or tier 3 outcome on a weapon [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), the [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) deals an extra 10 poison damage, and if the target has M < AVERAGE, they are [weakened](scc.v1:mcdm.heroes.v1/condition/weakened) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends). If the guide is [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to their mentor when they use Poison Blade, they apply poison to the mentor's weapon in the same way."
- This matches the book (`MPDF` Poison Blade block, `m<v` = M < AVERAGE). Level 10 is correct.

## 7. Undead Servitor Level 7 header: STILL-PRESENT
- Source `M:29019`: `########Level 7 Retainer Advancement Ability`. It has no blockquote, no bold, and no space after the hashes. Other markers look like `> **Level 4 Retainer Advancement Ability**` (e.g. M:29005).
- Output:
  - md-dse has no visible stray hashes, because the featureblock is YAML.
  - The same defect as item 2 does surface: `U/monster/retainer/advancement-features/undead-servitor.md` tags Death to Death **`level: 4`** (should be 7). Levels are Grab and Bite=4, Death to Death=4, Death Miasma=10.
  - The raw `########` does show in the md-linked output: `data/data-unified/en/books/monsters/md-linked/monster/retainer/advancement-features/undead-servitor.md:101` and `.../chapter/retainers.md:1808`. The same file family shows the hexer one at `role-advancement/hexer.md:105` and `chapter/retainers.md:414`.
- Fix: `M:29019` change to `> **Level 7 Retainer Advancement Ability**`, keeping the blank line before `> 🏹 **Death to Death (Encounter)**`. SCC: no change.

## 8. Beacon of Grace "that creature can spend a Recovery": N/A (MCDM wording)
- Source `H:7271` and output `U/feature/ability/conduit/level-5/beacon-of-grace.md` (effects[1].effect), verbatim: "Until the end of the encounter, whenever you or any ally damages the target using an ability, that creature can spend a [Recovery](...). If the target is reduced to 0 [Stamina](...) before the end of the encounter, you can use a free [triggered action](...) to move this effect to another creature within [distance](...)."
- Book `HPDF:8314-8317` has the same wording: "whenever you or any ally damages the target using an ability, that creature can spend a Recovery." The ambiguity is MCDM's, and we transcribe faithfully, so no change. (Read in context, "that creature" most naturally means the damaging creature, "you or any ally". That is not a ruling.)

## Follow-ups
- `M:28424-28425` (Hobgoblin Flameslinger statblock, next to Poison Blade): the Size/Speed/Stamina/Stability/Free Strike row is duplicated (`|  **1M**<br>Size | **5**<br>Speed | **48**<br>Stamina ...` appears twice).
- `M:28020-28052` (Dwarf Mortar advancement): the order is Level 4 Signal Shell, Level 10 Pacifier Shell, Level 7 Screaming Shell. The book (`MPDF:22810-22836`) orders them 4/7/10. Level tags are correct; only the order is wrong.
- `H:7177` (Conduit 4th-Level Domain Features table, Trickery row): it links Blessing of Secrets to the Censor's code `feature.ability.censor.level-4/blessing-of-secrets` and not to Conduit's own `feature.ability.conduit.level-4/blessing-of-secrets`. Other rows also link to censor codes, which may be intentional. Low priority.
- Items 2 and 7 have one root cause: hand-mangled `########` Level-7 markers. These are the only two `#{7,}Level` markers in the Retainers chapter (M:27149-29300).

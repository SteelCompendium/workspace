# SC-416 round 4 addendum

- Second commit on steel-etl `sc416-bugreport`: `b155140` "fix(SC-416): Dwarf Mortar Pacifier Shell — close the (save ends) paren" (one char: `)` appended at M:28062, re-located by content). First commit stays `c2bf829`.
- Gen: exit=0, 3096 classified items from 4 books (log: sc416-r4-gen.log). github.io docs/api/v1 churn reverted; steel-etl status clean; nothing under data/ committed.
- md-dse dwarf-mortar.md:60: `tier1: 8 damage; I < WEAK [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends)` (same at :74 low, :147, :161).

---

# SC-416 round 2 fix report

**Executive summary**
- Commit: steel-etl `c2bf829` on branch `sc416-bugreport` (on top of origin/main `0c74f4f`). Not pushed; superproject pointer not committed. `git status --porcelain` clean in steel-etl.
- Gate 1: `go build ./... && go test ./...` exit=0, all 8 test packages ok (cli, content, context, output, parser, pipeline, scc, site).
- Gate 2: `gen --config pipeline.yaml --all` exit=0, "3096 classified items from 4 books" (unchanged from r1).
- Gate 3: `validate` and `validate --scc-stable`: exit=0, "Validation passed.", output identical before vs. after edits (diff empty).
- Gate 4: all greps pass (below). md-linked `########` under monsters retainer: 0 hits.
- A-G: done. H: done for the 2 rows in the 4th-Level table that link to `feature.ability.censor.*` (Creation, Trickery); the other 8 linked rows have no Conduit code, left untouched.
- Gate 5: the github.io `docs/api/v1/{index,scc}.json` timestamp changes were reverted; nothing under `data/` or `v2/docs/` committed.
- Drive-by fixes: none.

## H per-row outcome (Conduit 4th-Level Domain Features table, `Draw Steel Heroes.md` ~7165-7178)
Book cross-check: heroes.txt lines 8221-8240 (Conduit's table) list Creation/Improved Hands of the Maker, Fate/Oracular Warning, Life/Blessing of Life, Nature/Wode Road, Protection/Impervious Touch, Sun/Light of Revelation, Trickery/Blessing of Secrets, War/Improved Sanctified Weapon (the Censor table at 6945-6967 is identical).
- Creation: `feature.ability.censor.level-1/hands-of-the-maker` -> `feature.ability.conduit.level-1/hands-of-the-maker` (exists in classification.json). RE-POINTED.
- Trickery: `feature.ability.censor.level-4/blessing-of-secrets` -> `feature.ability.conduit.level-4/blessing-of-secrets` (exists). RE-POINTED.
- Fate (oracular-warning), Life (blessing-of-life), Nature (wode-road), Protection (impervious-touch), Sun (light-of-revelation), War (improved-sanctified-weapon): link `feature.censor.level-4/*` (not `feature.ability.censor.*`); no `feature.conduit.level-4/<same>` code exists in classification.json (the registry has only blessed-domain, characteristic-increase, perk, skill, 4th-level-domain-feature, ability.conduit.level-4/blessing-of-secrets). UNTOUCHED.
- Death, Knowledge (partly), Love, Storm: unlinked text. UNTOUCHED.

**Follow-ups:**
- Same censor-code pattern, outside the 4th-level table (not touched, out of brief scope), with Conduit codes that DO exist in the registry: `Draw Steel Heroes.md` 6337 (Creation, hands-of-the-maker), 6338 (Death, grave-speech), 6343 (Nature, faithful-friend) in the Conduit 1st-Level Features domain table; 7557 (Trickery, trinity-of-trickery) in the 7th-Level table; 7207 (body text of Conduit's "Improved Hands of the Maker") links `feature.ability.censor.level-1/hands-of-the-maker`. Conduit codes `feature.ability.conduit.level-1/{grave-speech,faithful-friend}` and `level-7/trinity-of-trickery` exist.
- Those 6 censor-coded 4th-level rows (Fate, Life, Nature, Protection, Sun, War) point at Censor features because Conduit has no coded copy of those headings (the `###### Blessing of Life` etc. under Conduit are unannotated); fixing would mint new SCC codes, so left.

## Gate 4 evidence (md-dse = data/data-unified/en/unified/md-dse)
```
hexer.md:   17 level: 4 / 18 Backfire Curse ; 44 level: 7 / 45 Take Root ; 71 level: 10 / 72 Mazed
undead-servitor.md: 15 level: 4 Grab and Bite ; 39 level: 7 / 40 Death to Death ; 67 level: 10 Death Miasma
psi-boost.md: discipline|feature.null count = 0 ; 18: "additional clarity to apply a [psi boost](scc...feature.talent.level-6/psi-boost)"
troubadour.md 7th row: "Signature, 3, 5, 7, 9     | 5, 9" ; 8th row: "Signature, 3, 5, 7, 9, 11 | 5, 9"
   (8th row 5, 9: class-act cell no longer has 11; 7th has the 3)
gnoll-gnasher.md (statblock): 3: ev: '-'  31: ev: '-'   (goblin-guide.md 3,32: ev: '-')
advancement-features/gnoll-gnasher.md: 51 and 119: name: Horrific Feast
dwarf-mortar.md: 17 level: 4 Signal Shell ; 43 level: 7 Screaming Shell ; 68 level: 10 Pacifier Shell (members in 4/7/10 order)
hobgoblin-flameslinger md-linked statblock: '**1M**<br>Size' count = 1 (was 2 in source)
md-linked `grep -rn '########' .../books/monsters/md-linked/monster/retainer/`: hits=0
conduit 4th-level-domain-feature.md: 25 Creation row and 35 Trickery row carry the conduit links
```
Logs: sc416-r2-gate4.log (these greps).

## Diff
commit c2bf8298b36ddfc050062171464e984ba2577825
Author: Scott Tomaszewski <scottTomaszewski@gmail.com>
Date:   Sat Oct 17 10:51:36 2026 -0400

    fix(SC-416): book-text fixes surfaced by the 6.0.2 bug report (retainer level-7 markers, Psi Boost clarity, Troubadour table, Gnoll Gnasher, Dwarf Mortar order, Flameslinger dup row)

 input/heroes/Draw Steel Heroes.md     | 10 ++++-----
 input/monsters/Draw Steel Monsters.md | 39 +++++++++++++++++------------------
 2 files changed, 24 insertions(+), 25 deletions(-)

```diff
diff --git a/input/heroes/Draw Steel Heroes.md b/input/heroes/Draw Steel Heroes.md
index a45996d..94ffc24 100644
--- a/input/heroes/Draw Steel Heroes.md	
+++ b/input/heroes/Draw Steel Heroes.md	
@@ -7164,7 +7164,7 @@ Choose one of your domains. You gain a domain feature for that domain, as shown
 
 | Domain     | Feature                     |
 |------------|-----------------------------|
-| Creation   | Improved [Hands of the Maker](scc.v1:mcdm.heroes.v1/feature.ability.censor.level-1/hands-of-the-maker) |
+| Creation   | Improved [Hands of the Maker](scc.v1:mcdm.heroes.v1/feature.ability.conduit.level-1/hands-of-the-maker) |
 | Death      | Seance                      |
 | Fate       | [Oracular Warning](scc.v1:mcdm.heroes.v1/feature.censor.level-4/oracular-warning)            |
 | Knowledge  | [Saint](scc.v1:mcdm.heroes.v1/rule.world/saint)'s Epiphany            |
@@ -7174,7 +7174,7 @@ Choose one of your domains. You gain a domain feature for that domain, as shown
 | Protection | [Impervious Touch](scc.v1:mcdm.heroes.v1/feature.censor.level-4/impervious-touch)            |
 | Storm      | Windwalk                    |
 | Sun        | [Light of Revelation](scc.v1:mcdm.heroes.v1/feature.censor.level-4/light-of-revelation)         |
-| Trickery   | [Blessing of Secrets](scc.v1:mcdm.heroes.v1/feature.ability.censor.level-4/blessing-of-secrets)         |
+| Trickery   | [Blessing of Secrets](scc.v1:mcdm.heroes.v1/feature.ability.conduit.level-4/blessing-of-secrets)         |
 | War        | [Improved Sanctified Weapon](scc.v1:mcdm.heroes.v1/feature.censor.level-4/improved-sanctified-weapon)  |
 
 ###### Blessing of Life
@@ -15864,7 +15864,7 @@ You gain one interpersonal, lore, or [supernatural](scc.v1:mcdm.heroes.v1/rule.g
 <!-- @type: feature -->
 #### Psi Boost
 
-Whenever you use an ability that is a main action or a maneuver with the Psionic keyword, you can spend additional discipline to apply a [psi boost](scc.v1:mcdm.heroes.v1/feature.null.level-7/psi-boost) to it and enhance its effects. A [psi boost](scc.v1:mcdm
+Whenever you use an ability that is a main action or a maneuver with the Psionic keyword, you can spend additional clarity to apply a [psi boost](scc.v1:mcdm.heroes.v1/feature.talent.level-6/psi-boost) to it and enhance its effects. A [psi boost](scc.v1:mcdm.
 
 <!-- @type: feature -->
 ##### Dynamic Power (1 Clarity)
@@ -16442,8 +16442,8 @@ The whole world's a stage, and everyone on it, an actor. No one knows this bette
 | 4th   | [Characteristic Increase](scc.v1:mcdm.heroes.v1/feature.troubadour.level-4/characteristic-increase), [Melodrama](scc.v1:mcdm.heroes.v1/feature.troubadour.level-4/melodrama), [Perk](scc.v1:mcdm.heroes.v1/feature.troubadour.level-4/perk), [Skill](scc.
 | 5th   | [Class Act Feature](scc.v1:mcdm.heroes.v1/feature.troubadour.level-5/5th-level-class-act-feature), [9-Drama Ability](scc.v1:mcdm.heroes.v1/feature.troubadour.level-5/9-drama-ability)                                                                   
 | 6th   | [Perk](scc.v1:mcdm.heroes.v1/feature.troubadour.level-6/perk), [Spotlight](scc.v1:mcdm.heroes.v1/feature.troubadour.level-6/spotlight), [Class Act Ability](scc.v1:mcdm.heroes.v1/feature.troubadour.level-6/6th-level-class-act-ability)                
-| 7th   | [Characteristic Increase](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/characteristic-increase), [A Muse's Muse](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/a-muses-muse), [Equal Billing](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/equ
-| 8th   | [Perk](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/perk), [Class Act Feature](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/8th-level-class-act-feature), [11-Drama Ability](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/11-drama-ability)  
+| 7th   | [Characteristic Increase](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/characteristic-increase), [A Muse's Muse](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/a-muses-muse), [Equal Billing](scc.v1:mcdm.heroes.v1/feature.troubadour.level-7/equ
+| 8th   | [Perk](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/perk), [Class Act Feature](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/8th-level-class-act-feature), [11-Drama Ability](scc.v1:mcdm.heroes.v1/feature.troubadour.level-8/11-drama-ability)  
 | 9th   | [Roar of the Crowd](scc.v1:mcdm.heroes.v1/feature.troubadour.level-9/roar-of-the-crowd), [Class Act Ability](scc.v1:mcdm.heroes.v1/feature.troubadour.level-9/9th-level-class-act-ability)                                                               
 | 10th  | [Applause](scc.v1:mcdm.heroes.v1/feature.troubadour.level-10/applause), [Characteristic Increase](scc.v1:mcdm.heroes.v1/feature.troubadour.level-10/characteristic-increase), [Dramaturgy](scc.v1:mcdm.heroes.v1/feature.troubadour.level-10/dramaturgy),
 
diff --git a/input/monsters/Draw Steel Monsters.md b/input/monsters/Draw Steel Monsters.md
index a6f0462..c2502fb 100644
--- a/input/monsters/Draw Steel Monsters.md	
+++ b/input/monsters/Draw Steel Monsters.md	
@@ -27562,8 +27562,8 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 >
 > **Effect:** While the target is cursed this way, whenever they make a strike that targets only one creature, the retainer can use a free triggered action to choose a second target for the strike within its distance.
 
-> ######## Level 7 Role Advancement Ability
->
+> **Level 7 Role Advancement Ability**
+
 > 🏹 **Take Root (Encounter)**
 >
 > | **Magic, Ranged, Strike** |     **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |
@@ -28033,20 +28033,6 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 > - **12-16:** 8 fire damage
 > - **17+:** 11 fire damage
 
-> **Level 10 Retainer Advancement Ability**
-
-> 🔳 **Pacifier Shell (Encounter)**
->
-> | **Area, Ranged, Weapon** |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |
-> |--------------------------|------------------------------:|
-> | **📏 3 cube within 15**  | **🎯 Each enemy in the area** |
->
-> **Power Roll + highest characteristic:**
->
-> - **≤11:** 8 damage; I < WEAK [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends
-> - **12-16:** 12 damage; I < AVERAGE [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends)
-> - **17+:** 16 damage; I < STRONG [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends) and [prone](scc.v1:mcdm.heroes.v1/condition/prone)
-
 > **Level 7 Retainer Advancement Ability**
 
 > 🔳 **Screaming Shell (Encounter)**
@@ -28063,6 +28049,20 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 >
 > **Effect:** Until the start of the mortar's next turn, [strikes](scc.v1:mcdm.heroes.v1/rule.combat/strike) made against the mortar or any ally [adjacent](scc.v1:mcdm.heroes.v1/rule.combat/adjacent) to them take a bane.
 
+> **Level 10 Retainer Advancement Ability**
+
+> 🔳 **Pacifier Shell (Encounter)**
+>
+> | **Area, Ranged, Weapon** |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |
+> |--------------------------|------------------------------:|
+> | **📏 3 cube within 15**  | **🎯 Each enemy in the area** |
+>
+> **Power Roll + highest characteristic:**
+>
+> - **≤11:** 8 damage; I < WEAK [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends
+> - **12-16:** 12 damage; I < AVERAGE [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends)
+> - **17+:** 16 damage; I < STRONG [dazed](scc.v1:mcdm.heroes.v1/condition/dazed) ([save](scc.v1:mcdm.heroes.v1/rule.general/saving-throw) ends) and [prone](scc.v1:mcdm.heroes.v1/condition/prone)
+
 <!-- @type: statblock -->
 ####### High Elf Weatherwise
 
@@ -28279,7 +28279,7 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 <!-- @type: statblock -->
 ####### Gnoll Gnasher
 
-|  Abyssal, Gnoll   |         -         |      Level 2      |   Harrier Retainer    |        EV 60         |
+|  Abyssal, Gnoll   |         -         |      Level 2      |   Harrier Retainer    |         EV -         |
 |:-----------------:|:-----------------:|:-----------------:|:---------------------:|:--------------------:|
 |  **1M**<br>Size   |  **7**<br>Speed   | **30**<br>Stamina |  **1**<br>Stability   | **3**<br>Free Strike |
 | **-**<br>Immunity | **-**<br>Movement |         -         | **-**<br>With Captain |  **-**<br>Weakness   |
@@ -28333,7 +28333,7 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 
 > **Level 10 Retainer Advancement Ability**
 
-> 👤 **Horrific Feas (Encounter)**
+> 👤 **Horrific Feast (Encounter)**
 >
 > | **-**       | **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |
 > |-------------|----------------:|
@@ -28422,7 +28422,6 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 | Goblin, Hobgoblin, Humanoid, Infernal |         -          |      Level 4      |  Controller Retainer  |         EV -         |
 |:-------------------------------------:|:------------------:|:-----------------:|:---------------------:|:--------------------:|
 |            **1M**<br>Size             |   **5**<br>Speed   | **48**<br>Stamina |  **0**<br>Stability   | **5**<br>Free Strike |
-|            **1M**<br>Size             |   **5**<br>Speed   | **48**<br>Stamina |  **0**<br>Stability   | **5**<br>Free Strike |
 |        **Fire 4**<br>Immunity         | **- **<br>Movement |         -         | **-**<br>With Captain |  **-**<br>Weakness   |
 |            **+1**<br>Might            |  **0**<br>Agility  | **+2**<br>Reason  |  **+1**<br>Intuition  |  **+3**<br>Presence  |
 
@@ -29016,7 +29015,7 @@ If a role advancement ability has the Magic or Psionic keyword, a retainer can s
 > - **12-16:** 11 damage; M < AVERAGE [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed)
 > - **17+:** 16 damage; M < STRONG [grabbed](scc.v1:mcdm.heroes.v1/condition/grabbed)
 
-########Level 7 Retainer Advancement Ability
+> **Level 7 Retainer Advancement Ability**
 
 > 🏹 **Death to Death (Encounter)**
 >
```

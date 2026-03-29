# Draw Steel -- Detailed Agent Reference

This document is a comprehensive reference for the Draw Steel TTRPG Heroes book. It is intended to give an AI agent enough detail to understand and reason about the game's mechanics, character options, and setting without needing to read the full 27,000-line source document.

---

# PART 1: CORE MECHANICS

## The Power Roll

All rolls in Draw Steel use **2d10 + characteristic score**. Results fall into three tiers:

- **Tier 1**: 11 or lower
- **Tier 2**: 12-16
- **Tier 3**: 17+
- **Natural 19-20**: Always tier 3. On ability power rolls using a main action, this is a **critical hit** granting an extra main action immediately.

### Edges and Banes

- **Edge**: +2 to the roll.
- **Bane**: -2 to the roll.
- Edges and banes cancel 1-for-1.
- **Double edge** (2+ net edges): Instead of +4, auto-shift the tier result UP by 1 (tier 1 becomes tier 2, tier 2 becomes tier 3). Tier 3 stays tier 3.
- **Double bane** (2+ net banes): Auto-shift the tier result DOWN by 1.

### Characteristics

Five stats ranging from -5 to +5:

- **Might** -- Physical strength, brawn, endurance
- **Agility** -- Coordination, nimbleness, reflexes
- **Reason** -- Logic, education, analytical thinking
- **Intuition** -- Instincts, experience, gut feelings
- **Presence** -- Force of personality, leadership, charm

Skills are NOT tied to specific characteristics. Any characteristic can pair with any skill if the player can justify it and the Director agrees.

### Potency

Many abilities have effects that check against a target's characteristic score. "Potency" is the characteristic score of the ability user that determines the threshold. For example, "slowed vs Presence" means the target is slowed if their relevant characteristic is less than the user's Presence score. Potency thresholds: Weak (< score), Average (< score), Strong (< score).

### Surges

Surges are bonus damage tokens. When you deal damage with an ability, each surge adds extra damage equal to your highest characteristic score. Surges are consumed on use.

### Saving Throws

Roll 1d10. On 6+, the "save ends" effect ends. Made at end of turn unless otherwise specified.

---

## Skills

Five groups with specific skills each:

**Crafting**: Alchemy, Architecture, Blacksmithing, Fletching, Forgery, Jewelry, Mechanics, Tailoring, and others.

**Exploration**: Climb, Endurance, Gymnastics, Heal, Jump, Lift, Navigate, Ride, Swim, Track.

**Interpersonal**: Brag, Empathize, Flirt, Handle Animals, Interrogate, Intimidate, Lead, Lie, Music, Perform, Persuade.

**Intrigue**: Alertness, Conceal Object, Disguise, Eavesdrop, Escape Artist, Hide, Pick Lock, Pick Pocket, Sabotage, Search, Sneak, Steal.

**Lore**: ~20 domain-specific knowledge skills (Culture, Criminal Underworld, History, Magic, Monsters, Nature, Psionics, Religion, Rumors, Terrain, Timescape, etc.).

Having an applicable skill grants **+2** to a power roll. Only one skill applies per test. The player proposes which skill; the Director approves.

---

## Tests

### Difficulty Scaling

| Roll | Easy | Medium | Hard |
|------|------|--------|------|
| <=11 | Success w/ consequence | Failure | Failure w/ consequence |
| 12-16 | Success | Success w/ consequence | Failure |
| 17+ | Success w/ reward | Success | Success |

### Test Types

- **Standard test**: One hero rolls. Director sets difficulty and relevant characteristic.
- **Assist a Test**: Use a maneuver. Roll your own test with a relevant skill. Tier 1 = bane to assisted creature; tier 2 = edge; tier 3 = double edge.
- **Opposed Power Roll**: Both sides roll, highest total wins. No tiers. Double edges/banes become flat +/-4.
- **Reactive Test**: Director calls for a roll without context (to detect hidden things, etc.), revealing the reason after.
- **Group Test**: Everyone rolls the same test. Succeeds if half or more succeed.
- **Hero Tokens**: Spend to reroll any test. Earned by the Director for risk-taking, dramatic play, etc.

### Montage Tests

Multi-round collaborative skill challenges for prolonged tasks (crossing a desert, preparing a village for war).

- Lasts **2 rounds** (default). Each hero gets one action per round: make a test, assist, or use an ability.
- **Can't reuse the same skill** within a montage test (per individual).
- Director sets **success limit** and **failure limit** based on difficulty and party size.
- **Three outcomes**: Total success (hit success limit), partial success (time/failures run out but successes exceed failures by 2+), total failure.
- Total success and hard partial success award **Victories**.

---

# PART 2: ANCESTRIES

All ancestries default to size 1M, speed 5, stability 0 unless noted. Each has a free signature trait plus ancestry points to buy purchased traits.

## Devil

- **Lore**: Red/blue-skinned humanoids from the Seven Cities of Hell. Born with hellmarks (horns, tail, hooves, wings, etc.). Most in Orden are descendants of stranded devils.
- **Signature Trait -- Silver Tongue**: Free interpersonal skill; edge to discover NPC motivations/pitfalls in negotiation.
- **3 ancestry points**. Traits: Barbed Tail (1, extra melee damage = highest characteristic once/round), Beast Legs (1, speed 6), Glowing Eyes (1, psychic retaliatory damage), Hellsight (1, ignore concealment bane on strikes), Impressive Horns (2, saving throws succeed on 5+), Prehensile Tail (2, can't be flanked), Wings (2, fly for rounds = Might score).

## Dragon Knight

- **Lore**: Created via Dracogenesis ritual. Largest population was the Dragon Phalanx of Vasloria under King Omund, destroyed by Ajax. Symbols of justice in exile.
- **Signature Trait -- Wyrmplate**: Damage immunity equal to level to one type (acid/cold/corruption/fire/lightning/poison), changeable at respite.
- **3 ancestry points**. Traits: Draconian Guard (1, reduce strike damage by level as triggered action), Draconian Pride (2, AoE roar ability), Dragon Breath (2, 3-cube breath weapon), Prismatic Scales (1, second permanent Wyrmplate immunity), Remember Your Oath (1, saving throws on 4+ until next turn), Wings (2, fly for rounds = Might score).

## Dwarf

- **Lore**: Silico-organic stone flesh. Children of elder god Ord. Extremely dense, long-lived (700-1500 years). Savvy engineers.
- **Signature Trait -- Runic Carving**: Carve one of three runes with 10 min work: Detection (glow near chosen creature/object type within 20 squares), Light (10-square radius), Voice (telepathy with a known willing creature within 1 mile). One rune at a time.
- **3 ancestry points**. Traits: Great Fortitude (2, can't be weakened), Grounded (1, +1 stability), Spark Off Your Skin (2, +6 Stamina scaling by echelon), Stand Tough (1, +1 effective Might vs potencies), Stone Singer (1, reshape unworked stone within 3 squares over 1 hour).

## Wode Elf

- **Lore**: Sylvan forest guardians. Masters of camouflage. Serve Queen Imyrr. Guerrilla fighters.
- **Signature Trait -- Wode Elf Glamor**: Edge on hide/sneak tests; bane on search tests against you while hidden.
- **3 ancestry points**. Traits: Forest Walk (1), Quick and Brutal (1), Otherworldly Grace (2), Revisit Memory (1), Swift (1), The Wode Defends (2).

## High Elf

- **Lore**: Created by solar celestials as librarians/heralds. Live in fallen sky cities. Devoted to art, beauty, lore. Glamor makes others perceive them as attractive/engaging.
- **Signature Trait -- High Elf Glamor**: Edge on Presence tests using Flirt or Persuade. Appear slightly different to each viewer.
- **3 ancestry points**. Traits: Glamor of Terror (2), Graceful Retreat (1), High Senses (1), Otherworldly Grace (2), Revisit Memory (1), Unstoppable Mind (2).

## Hakaan

- **Lore**: Descended from Vanigar giants who traded size for foresight via trickster god Holkatya. Cursed with "Doomsight" -- visions of their own dramatic death. 9-10 feet tall, stone-like bodies.
- **Signature Trait -- Big!**: Size 1L.
- **3 ancestry points**. Traits: All Is a Feather (1), Doomsight (2), Forceful (1), Great Fortitude (2), Stand Tough (1).

## Human

- **Lore**: Uniquely connected to the natural world. Can sense magic/supernatural. Short-lived but driven. Historically led every coalition against great evils.
- **Signature Trait -- Detect the Supernatural**: Maneuver to detect undead, constructs, extraplanar creatures, and supernatural objects within 5 squares.
- **3 ancestry points**. Traits: Can't Take Hold (1), Determination (2), Perseverance (1), Resist the Unnatural (1), Staying Power (2).

## Memonek

- **Lore**: Native to Axiom (Plane of Uttermost Law). Silicone/porcelain bodies, creatures of pure reason. Suffer "velloparatha" (emotional overwhelm) on lower planes.
- **Signature Traits**: Fall Lightly (reduce fall distance by 2 squares) + Lightweight (treated as one size smaller for forced movement).
- **4 ancestry points**. Traits: I Am Law (1), Keeper of Order (2), Lightning Nimbleness (2), Nonstop (2), Systematic Mind (1), Unphased (1), Useful Emotion (1).

## Orc

- **Lore**: Fifth speaking people of Orden. Peace-loving forest dwellers with inner "bloodfire" (veins glow when wounded). Settled borderlands.
- **Signature Trait -- Relentless**: When damage drops you to dying, make a free strike; if it drops the target to 0 Stamina, spend a Recovery.
- **3 ancestry points**. Traits: Bloodfire Rush (1), Glowing Recovery (2), Grounded (1), Nonstop (2), Passionate Artisan (1).

## Polder

- **Lore**: ~3.5 ft tall. Shadow-melding ability. Reputation as spies/thieves (also famed chefs). Fiercely independent.
- **Signature Traits**: Shadowmeld (maneuver to flatten into shadow on a surface; hidden, strikes/searches take bane; can't move or take main actions) + Small! (Size 1S).
- **4 ancestry points**. Traits: Corruption Immunity (1), Fearless (2), Graceful Retreat (1), Nimblestep (2), Polder Geist (1), Reactive Tumble (1).

## Revenant

- **Lore**: Undead risen through unjust death + burning vengeance. Retain all memories and personality. Not created by necromancy.
- **Signature Traits**: Former Life (choose previous ancestry for size; speed 5) + Tough But Withered (immunity to cold/corruption/lightning/poison equal to level; fire weakness 5; no food/water/air needed; go inert instead of dying -- destroyed by fire while inert, otherwise recover in 12 hours).
- **2 ancestry points** (3 if size 1S). Traits: Bloodless (2), Previous Life: 1pt (1), Previous Life: 2pt (2), Undead Influence (1), Vengeance Mark (2, includes Detonate Sigil ability).

## Time Raider

- **Lore**: Kuran'zoi -- former servitors of evil synliroi psions, self-liberated during the First Psychic War. Nomads of the timescape. Four arms, crystalline eyes. Loathe authority, utterly fearless.
- **Signature Trait -- Psychic Scar**: Psychic immunity equal to level.
- **3 ancestry points**. Traits: Beyondsight (1), Foresight (1), Four-Armed Athletics (1), Four-Armed Martial Arts (2), Psionic Gift (2, choose: Concussive Slam / Psionic Bolt / Minor Acceleration), Unstoppable Mind (2).

---

# PART 3: BACKGROUND

## Culture

Represents community upbringing. Four aspects:

- **Language**: One bonus language beyond Caelian (the common tongue).
- **Environment** (Nomadic/Rural/Secluded/Urban/Wilderness): One skill from specified groups.
- **Organization** (Bureaucratic/Communal): One skill from specified groups.
- **Upbringing** (Academic/Creative/Labor/Lawless/Martial/Noble): One skill from specified groups.

Also grants an edge on tests to recall lore about your culture's people.

## Careers

Pre-hero vocation. Each grants: 2-3 skills, 0-2 languages, possibly +1-2 Renown, possibly +1 Wealth, possibly project points (120 or 240), and one perk of a specified type. Each includes a d6 inciting incident table.

### Complete Career List

| Career | Skills | Languages | Renown | Wealth | Project Pts | Perk Type |
|--------|--------|-----------|--------|--------|-------------|-----------|
| Agent | Sneak + 1 interpersonal + 1 intrigue | 2 | -- | -- | -- | Intrigue |
| Aristocrat | 1 interpersonal + 1 lore | 1 | +1 | +1 | -- | Lore |
| Artisan | 2 crafting | 1 | -- | -- | 240 | Crafting |
| Beggar | Rumors + 1 exploration + 1 interpersonal | 2 | -- | -- | -- | Interpersonal |
| Criminal | Criminal Underworld + 2 intrigue | 1 | -- | -- | 120 | Intrigue |
| Disciple | Religion + 2 lore | -- | -- | -- | 240 | Supernatural |
| Explorer | Navigate + 2 exploration | 2 | -- | -- | -- | Exploration |
| Farmer | Handle Animals + 2 exploration | 1 | -- | -- | 120 | Exploration |
| Gladiator | 2 exploration | 1 | +2 | -- | -- | Exploration |
| Laborer | Endurance + 2 crafting/exploration | 1 | -- | -- | 120 | Exploration |
| Mage's Apprentice | Magic + 2 lore | 1 | +1 | -- | -- | Supernatural |
| Performer | Music/Perform + 2 interpersonal | -- | +2 | -- | -- | Interpersonal |
| Politician | 2 interpersonal | 1 | +1 | +1 | -- | Interpersonal |
| Sage | 2 lore | 1 | -- | -- | 240 | Lore |
| Sailor | Swim + 2 exploration | 2 | -- | -- | -- | Exploration |
| Soldier | 1 exploration + 1 intrigue | 2 | +1 | -- | -- | Exploration |
| Warden | Nature + 1 exploration + 1 intrigue | 1 | -- | -- | 120 | Exploration |
| Watch Officer | Alertness + 2 intrigue | 2 | -- | -- | -- | Exploration |

---

# PART 4: CLASSES

Each class follows a common structure: starting characteristics, Stamina formula, Recoveries count, subclass choice, Heroic Resource mechanic, kit selection (for martial classes), signature abilities (at-will), heroic abilities (resource-costed at escalating tiers), and subclass features/abilities across 10 levels. All classes gain an epic resource at level 10 that persists between encounters.

## Censor (Divine Warrior/Judge)

**Role**: Melee striker/defender. Singles out priority targets via Judgment.

**Stats**: Might 2, Presence 2. Stamina 21 (+9/level). 12 Recoveries. Potency: Presence.

**Resource -- Wrath**: Gain 2/turn (3 at 7th, 4 at 10th). +1 when damaging judged creature (+2 at 4th). Start combat with wrath = Victories. Epic resource (10th): Virtue.

**Core Mechanic -- Judgment**: Maneuver (Ranged 10). Mark an enemy as "judged." When the judged creature uses a main action, triggered action to deal 2x Presence holy damage. On kill, can immediately judge a new target. Spend 1 wrath for additional triggered effects: prevent shifting, impose bane, reduce potency, or taunt.

**Key Features**:
- My Life for Yours: Triggered action -- take damage aimed at an ally within 10; spend 1 wrath to clear a condition.
- Domain: Choose one from deity's portfolio (see Domains section).
- Edicts (7 wrath): Persistent aura abilities punishing specific behaviors.
- Implement of Wrath (6th): Enchant weapon with holy power.

**Subclasses (Orders)**:
- **Exorcist**: Anti-evil specialist. Detects lies, prevents hiding, fear effects.
- **Oracle**: Prescient diviner. Fragmentary visions, fate manipulation, insight.
- **Paragon**: Battlefield commander. Flanking benefits, divine auras, saving throw support.

### Censor Signature Abilities

| Ability | Type | Stat | Summary |
|---|---|---|---|
| Back Blasphemer! | Area, Melee | Presence | Holy damage 2-cube; push |
| Every Step... Death! | Ranged | Presence | Psychic damage; 1 psychic per square of willful movement |
| Halt Miscreant! | Melee | Might | Holy damage; slowed (save ends) vs Presence |
| Your Allies Cannot Save You! | Melee | Might | Holy damage; pushes enemies adjacent to target |

### Censor Heroic Abilities

| Cost | Abilities |
|------|-----------|
| 3 Wrath | Behold a Shield of Faith!, Driving Assault, The Gods Punish and Defend, Repent! |
| 5 Wrath | Arrest, Behold the Face of Justice!, Censored, Purifying Fire |
| 5 (Order) | It Is Justice You Fear, Revelator (Exorcist); Prescient Grace, With My Blessing (Oracle); Blessing of the Faithful, Sentenced (Paragon) |
| 7 Wrath | Edict of Disruptive Isolation, Edict of Perfect Order, Edict of Purifying Pacifism, Edict of Stillness |
| 9 Wrath | Gods Grant Thee Strength, Orison of Victory, Righteous Judgment, Shield of the Righteous |
| 9 (Order) | Begone!, Pain of Your Own Making (Exorcist); Burden of Evil, Edict of Peace (Oracle); Congregation, Intercede (Paragon) |
| 11 Wrath | Excommunication, Hand of the Gods, Pillar of Holy Fire, Your Allies Turn on You! |
| 11 (Order) | Banish, Terror Manifest (Exorcist); Blessing and a Curse, Fulfill Your Destiny (Oracle); Apostate, Edict of Unyielding Resolve (Paragon) |

---

## Conduit (Divine Healer/Caster)

**Role**: Primary healer, ranged support, holy/corruption damage.

**Stats**: Intuition 2. Stamina 18 (+6/level). 10 Recoveries. Potency: Intuition.

**Resource -- Piety**: Roll 1d3/turn (1d3+1 at 7th). Start with piety = Victories. Epic resource (10th): Divine Power.

**Prayer Mechanic**: Before piety roll, you can pray for extra:
- Roll 1: +1 piety but take 1d6+level unavoidable psychic damage.
- Roll 2: +1 piety (safe).
- Roll 3: +2 piety AND activate domain prayer effect.

**Domain Piety Triggers**: Each domain grants 2 piety the first time its trigger occurs per encounter.

**Core Mechanic -- Healing Grace**: Ranged 10 maneuver. Target spends a Recovery. Spend piety to add targets, clear conditions, grant extra Recoveries.

**Subclass**: No traditional subclass. Choose TWO domains from deity's portfolio. This creates combinatorial variety.

**Key Features**:
- The Lists of Heaven (2nd): Whenever you let someone else spend a Recovery, you also spend one.
- Minor Miracle (3rd): Respite-based resurrection.
- Burgeoning Saint (6th): Edge on Presence tests, corruption/holy immunity 10.

### Conduit Signature Abilities

| Ability | Type | Stat | Summary |
|---|---|---|---|
| Blessed Light | Ranged | Intuition | Holy; ally gains surges = tier |
| Drain | Melee | Intuition | Corruption; ally can spend Recovery |
| Holy Lash | Ranged | Intuition | Holy; vertical pull |
| Lightfall | Area 2-burst | Intuition | Holy to enemies; teleport self+allies |
| Sacrificial Offer | Ranged | Intuition | Corruption; ally imposes bane |
| Staggering Curse | Melee | Intuition | Holy; slide |
| Warrior's Prayer | Ranged | Intuition | Holy; temp Stamina = Intuition |
| Wither | Ranged | Intuition | Corruption; target takes bane vs Presence |

### Conduit Heroic Abilities

| Cost | Abilities |
|------|-----------|
| 3 Piety | Call the Thunder Down, Font of Wrath, Judgment's Hammer, Violence Will Not Aid Thee |
| 5 Piety | Corruption's Curse, Curse of Terror, Faith Is Our Armor, Sermon of Grace |
| 5 (Domain) | One per domain (see Domains section) |
| 7 Piety | Fear of the Gods, Saint's Raiment, Soul Siphon, Words of Wrath and Grace |
| 9 Piety | Beacon of Grace, Penance, Sanctuary, Vessel of Retribution |
| 9 (Domain) | One per domain (see Domains section) |
| 11 Piety | Arise!, Blessing of Steel, Blessing of the Blade, Drag the Unworthy |
| 11 (Domain) | One per domain (see Domains section) |

---

## Elementalist (Elemental Mage)

**Role**: Versatile ranged caster. Can specialize or mix elements freely.

**Stats**: Reason 2. Stamina 18 (+6/level). 8 Recoveries.

**Resource -- Essence**: Gain 2/turn. +1 first time each round a creature within 10 squares takes typed (non-untyped/non-holy) damage. Start with essence = Victories. Epic resource (10th): Breath (converts at 1:3 ratio).

**Core Mechanics**:
- **Seven Elements**: Air, Earth, Fire, Green, Rot, Void, Water. No restriction on mixing.
- **Persistent Magic**: Some abilities have "Persistent N" cost reducing essence gain per turn. Disrupted by 5x Reason damage in one turn.
- **Hurl Element**: At-will ranged free strike, choose damage type (acid/cold/corruption/fire/lightning/poison/sonic).
- **Practical Magic**: Versatile maneuver (knockback, chip damage, or teleport).
- **Enchantment + Ward**: Two passive customization slots (one offensive, one defensive), changeable at respite.
- **Wyrding (6th)**: Freeform utility magic.
- **Mantle of Essence (4th)**: Aura when at 3+ essence.

**Subclasses (Specializations)**:
- **Earth**: Permanence and durability. Cumulative stability. Walls, pillars. Source of Earth companion. Capstone: damage immunity 5, mile-radius terrain shaping.
- **Fire**: Pure destruction. +1 rolled damage on Fire/Magic. Fire immunity that bypasses enemy fire immunity. Capstone: +5 damage to all magic abilities.
- **Green**: Growth, healing, shapeshifting. Temp Stamina on Green/Magic damage. Full animal shapeshifting system (16 forms from rodent to king terror lizard). Capstone: extra Recoveries, Life Fruit.
- **Void**: Space warping, teleportation. +2 range on Ranged/Magic/Void. Portal networks. Capstone: all willful movement becomes teleportation.

### Elementalist Signature Abilities

| Ability | Element | Summary |
|---|---|---|
| Afflict a Bountiful Decay | Green/Rot | Corruption; ally ends save-ends effect |
| Bifurcated Incineration | Fire | Fire to two targets |
| Grasp of Beyond | Void (Melee) | Corruption; self-teleport |
| The Green Within, the Green Without | Green | Untyped; slide creature near target |
| Meteoric Introduction | Earth (Melee) | Untyped; push 2/3/4 |
| Ray of Agonizing Self-Reflection | Void | Corruption; slowed (save ends) |
| Unquiet Ground | Earth (Area) | Untyped; difficult terrain for enemies |
| Viscous Fire | Fire | Fire; push 2/3/4 |

---

## Fury (Primal Berserker)

**Role**: Aggressive melee striker. High durability, heavy forced movement.

**Stats**: Might 2, Agility 2. Stamina 21 (+9/level). 10 Recoveries.

**Resource -- Ferocity**: 1d3/turn (1d3+1 at 7th). +1 first time each round you take damage (+2 at 4th, +3 at 10th). +1d3 first time winded/dying per encounter. Start with ferocity = Victories. Epic resource (10th): Primordial Power/Chaos.

**Core Mechanic -- Growing Ferocity**: Tiered passive bonuses at thresholds (2/4/6/8/10/12). Different table per subclass/kit. Rewards building high ferocity before spending. Typical benefits: edges on maneuvers, surges from forced movement, temp Stamina at high tiers.

**Key Features**:
- Mighty Leaps: Guaranteed tier 2 on jump tests.
- Primordial Strike (4th): Spend 1 ferocity for 1 surge of chosen elemental damage type.
- Elemental Form (7th): Elemental damage immunity.

**Subclasses (Primordial Aspects)**:
- **Berserker**: Raw Might. Push/collision bonuses. Uses standard kits. Growing Ferocity keys on Knockback distance.
- **Reaver**: Agility and cunning. Push becomes slide. Never surprised. Uses standard kits. Growing Ferocity keys on slide distance.
- **Stormwight**: Shapeshifter with animal/hybrid forms. Uses special stormwight kits (see below). Each kit has an animal (Boren/bear, Corven/crow, Raden/rat, Vuken/wolf) and primordial storm type.

### Stormwight Kits

| Kit | Animal | Storm | Stamina | Speed | Stability | Melee Dmg | Signature |
|-----|--------|-------|---------|-------|-----------|-----------|-----------|
| Boren | Bear | Blizzard (cold) | +9/echelon | +0 | +2 | +0/+0/+4 | Bear Claws (grab on hit) |
| Corven | Crow | Anabatic Wind (fire) | +3/echelon | +3 | +0 | +2/+2/+2 | Wing Buffet (AoE + shift 2) |
| Raden | Rat | Rat Flood (corruption) | +3/echelon | +3 | +0 | +2/+2/+2 | Driving Pounce (push + follow) |
| Vuken | Wolf | Lightning (lightning) | +9/echelon | +2 | +0 | +2/+2/+2 | Unbalancing Attack (prone) |

### Fury Signature Abilities

| Ability | Summary |
|---|---|
| Brutal Slam | Untyped; push 1/2/4 |
| Hit and Run | Untyped; shift 1; slowed on tier 3 |
| Impaled! | Untyped; grab (target <= your size) |
| To the Death! | Untyped; gain 2 surges but target gets OA |

---

## Null (Psionic Anti-Magic Monk)

**Role**: Melee controller/defender. Anti-caster specialist. Suppresses enemy abilities.

**Stats**: Agility 2, Intuition 2. Stamina 21 (+9/level). 8 Recoveries.

**Resource -- Discipline**: Gain 2/turn (3 at 7th, 4 at 10th). +1 first time each round an enemy in Null Field uses main action (+2 at 4th). +1 when Director spends Malice. Start with discipline = Victories. Epic resource (10th): Order.

**Core Mechanic -- Null Field**: Persistent 1-aura reducing enemy potencies by 1. Spend 1 discipline/turn for additional effects (Gravitic Disruption, Inertial Anchor, or Synaptic Break). Many higher-level abilities permanently expand its size.

**Core Mechanic -- Inertial Shield**: Triggered action to take half damage. Spend 1 discipline to reduce potency by 1. Each tradition adds a free maneuver to this trigger.

**Core Mechanic -- Discipline Mastery**: Tiered passives at 2/4/6/8/10/12 thresholds (like Growing Ferocity).

**Key Features**:
- Psionic Martial Arts: Use Intuition for Knockback/Grab; Knockback can slide.
- Null Speed: +speed and +Disengage equal to Agility score.
- Reorder (3rd): Free triggered action to end one save-ends effect each turn.
- I Am the Weapon (9th): +21 Stamina, can't bleed, no aging/food needed.

**Subclasses (Traditions)**:
- **Chronokinetic**: Temporal. Inertial Shield triggers Disengage. Speed/movement bonuses.
- **Cryokinetic**: Cold. Inertial Shield triggers Grab. Cold immunity. Grab synergy.
- **Metakinetic**: Gravity/force. Inertial Shield triggers Knockback. Effective size bonus. Damage reflection.

### Null Signature Abilities

| Ability | Summary |
|---|---|
| Dance of Blows | 1-burst; slide one adjacent enemy |
| Faster Than the Eye | Two targets; bonus Agility damage |
| Inertial Step | Damage + shift half speed |
| Joint Lock | Damage + grab |
| Kinetic Strike | Damage + taunt + slide |
| Magnetic Strike | Melee 2; psychic; vertical pull |
| Phase Inversion Strike | Teleport target to opposite side + push |
| Pressure Points | Damage + weakened (save ends) |

---

## Shadow (Assassin/Infiltrator)

**Role**: High single-target damage. Mobile, evasive. Turn-order manipulation.

**Stats**: Agility 2 + one other at 2. Stamina 18 (+6/level). 8 Recoveries. **7 skills** (most of any class).

**Resource -- Insight**: 1d3/turn (1d3+1 at 7th). +1 first time each round you deal damage with surges (+2 at 4th, +3 at 10th). Heroic abilities cost 1 less insight if you have edge/double edge. Start with insight = Victories. Epic resource (10th): Subterfuge.

**Core Mechanic -- Surge Economy**: Signatures and college features constantly generate surges. Surges convert to extra damage and feed insight generation. The class revolves around this loop.

**Key Features**:
- Hesitation Is Weakness: Spend 1 insight to act immediately after another hero.
- Careful Observation (3rd): Maneuver for edge + surges on next strike.
- Umbral Form (6th): Shadow creature transformation (auto-climb, pass through enemies, auto-hide).
- Gloom Squad (9th): Create 1d6 clone attackers.

**Subclasses (Colleges)**:
- **College of Black Ash**: Teleportation sorcery. Teleport 5 + spend insight for more, Hide at destination. Burning Ash (fire on teleport). Trail of Cinders. Cinder Step (all movement = teleportation at 8th).
- **College of Caustic Alchemy**: Acids, bombs, poisons. Coat the Blade (surges, poison damage). Smoke Bomb (Hide while observed). Volatile Reagents. Time Bomb.
- **College of the Harlequin Mask**: Illusion magic. I'm No Threat (appear harmless). Clever Trick (redirect strikes). Friend! (benefit from ally-targeting enemy abilities). Harlequin Gambit (disguise as killed enemy).

### Shadow Signature Abilities

| Ability | Summary |
|---|---|
| Gasping in Pain | Melee; prone on tier 3; ally gains 1 surge |
| I Work Better Alone | Melee/Ranged 5; +1 surge if no allies adjacent to target |
| Teamwork Has Its Place | Melee/Ranged 5; +1 surge if ally adjacent to target |
| You Were Watching the Wrong One | Melee; +1 surge if ally near target; flanking ally gains surge too |

---

## Tactician (Battlefield Commander)

**Role**: Force multiplier. Makes allies better. Marks priority targets.

**Stats**: Might and one other. Stamina 21 (+9/level). 10 Recoveries.

**Resource -- Focus**: Gain 2/turn (3 at 7th, 4 at 10th). +1 first time/round an ally damages a marked creature. +1 first time/round an ally within 10 uses a heroic ability. Start with focus = Victories. Epic resource (10th): Command.

**Core Mechanic -- Mark**: Maneuver (Ranged 10). Marked targets grant edge on power rolls to tactician and nearby allies. On hit vs marked target, spend 1 focus for: bonus damage (2x Reason), ally Recovery, ally shift, or taunt.

**Key Features**:
- Strike Now: Main action letting an ally use a signature ability as a free triggered action.
- Field Arsenal: Equip TWO kits simultaneously.
- Grandmaster of Arms (9th): Auto tier 3 on signature abilities and kit free strikes.
- Warmaster (10th): Allies roll 3d10 choose 2 vs marked targets; allies spend 2 fewer HR targeting marked creatures.

**Subclasses (Doctrines)**:
- **Insurgent**: Subterfuge. Advanced Tactics triggered action. Force enemies to attack each other. Hide synergy.
- **Mastermind**: Strategy. Overwatch triggered action (ally free strike on enemy movement). Multi-mark (2 at 5th, 3 at 6th). Reveal enemy info pre-combat.
- **Vanguard**: Front-line. Parry triggered action (half damage + shift). Melee superiority. Charge enhancements.

Note: Tactician uses **kit signature abilities**, not class-specific signatures.

---

## Talent (Psionic Powerhouse)

**Role**: Versatile ranged/control. Risk-reward playstyle.

**Stats**: Reason 2 + one other. Stamina 18 (+6/level). 8 Recoveries.

**Resource -- Clarity**: 1d3/turn (+1 at 7th, +1 more at 10th). +1 first time/round a creature is force moved (+2 at 4th, +3 at 10th). Start with clarity = Victories. Epic resource (10th): Vision.

**Strain Mechanic**: Clarity CAN GO NEGATIVE (to -(1+Reason)). Negative = "strained," taking 1 damage per negative point per turn end. Many abilities have bonus **Strained effects** -- stronger but self-harmful (extra damage, conditions, aging).

**Key Features**:
- Mind Spike: Built-in ranged free strike (psychic, Reason-based). Strained: extra 2 damage to target and self.
- Psionic Augmentation: Passive buff (density/force/speed/distance/armor). Swappable at respite.
- Talent Ward: Reactive defense (entropy/repulsive/steel/vanishing). Swappable at respite.
- Psi Boost (6th): Spend 1-5 clarity for modular enhancements to any psionic ability.
- Fortress of Perfect Thought (9th): Psychic immunity 10, can't be frightened/taunted.
- Psion (10th): No damage from negative clarity; voluntarily trigger strained effects.

**Subclasses (Traditions)**:
- **Chronopathy**: Time manipulation. Accelerate ally shift, forced rerolls. Time dilation aura. Speed of Thought.
- **Telekinesis**: Force/movement. Minor Telekinesis slide, damage halving. Kinetic Amplifier. Triangulate.
- **Telepathy**: Mind control. Feedback Loop (reflect damage as psychic). Compulsion. Synaptic Override.

### Talent Signature Abilities

| Ability | Tradition | Summary |
|---|---|---|
| Entropic Bolt | Chronopathy | Corruption; slowed; stacking damage on repeats |
| Hoarfrost | Cryokinesis | Cold; slowed (EoT) |
| Incinerate | Pyrokinesis | Fire AoE; burning zone |
| Kinetic Grip | Telekinesis | No damage; slide 2+R/4+R/6+R, prone on tier 3 |
| Kinetic Pulse | Telepathy | Psychic 1-burst; push |
| Materialize | Resopathy | Untyped; drops object on target |
| Optic Blast | Metamorphosis | Untyped; prone; can bounce |
| Spirit Sword | Animapathy | Melee 2; untyped; +1 surge |

---

## Troubadour (Performance-Based Support)

**Role**: Support/controller. Buff allies, debuff enemies, reactive to drama.

**Stats**: Agility 2, Presence 2. Stamina 18 (+6/level). 8 Recoveries.

**Resource -- Drama**: 1d3/turn. Additional drama from dramatic events: +2 when 3 heroes act same turn, +2 when any hero goes winded, +3 on any natural 19-20, +10 on hero death. **At 30 drama while dead, you resurrect.** Start with drama = Victories. Epic resource (10th): Applause.

**Core Mechanic -- Routines (Performances)**: At each round start, choose or maintain a persistent aura (typically 5 squares) that buffs allies. Base performances: Choreography (+2 speed) and Revitalizing Limerick (allies spend Recoveries). Subclasses add more.

**Key Features**:
- Scene Partner: Bond with NPCs for +1 patience and boosted interest in negotiations.
- Appeal to the Muses (2nd): Boost drama gain but risk granting Director Malice.
- Melodrama (4th): Add new drama-triggering events.

**Subclasses (Class Acts)**:
- **Auteur**: Narrative manipulation. Blocking (teleport repositioning). Dramatic Monologue. Turnabout Is Fair Play. Guest Star. Twist at the End (resurrect enemy as ally). Epic (capstone).
- **Duelist**: Melee combat dancer. Acrobatics performance. Star Power. Riposte. Foil (mutual double edge with enemy). Expert Fencer.
- **Virtuoso**: Musical magic. Song performances (Thunder Mother, Ballad of the Beast). Power Chord. Harmonize. Second Album. Medley (two performances at once). Melt Their Faces.

### Troubadour Signature Abilities

| Ability | Summary |
|---|---|
| Artful Flourish | Melee two targets; shift 3; spend drama for extra targets |
| Cutting Sarcasm | Ranged psychic; bleeding (save ends) |
| Instigator | Melee; target taunted by you or adjacent ally |
| Witty Banter | Melee/Ranged 5 psychic; ally ends save-ends; spend drama for ally Recovery |

---

# PART 5: DOMAINS (Censor and Conduit)

12 domains. Censors pick 1; Conduits pick 2. Each domain provides: a skill, piety triggers (Conduit), prayer effects (Conduit), and features at levels 1, 4, and 7.

## Domain Piety Triggers (Conduit Only)

Each grants 2 piety on first occurrence per encounter:

| Domain | Trigger |
|--------|---------|
| Creation | Creature within 10 uses area ability |
| Death | Non-minion within 10 drops to 0 Stamina (or solo becomes winded) |
| Fate | Ally within 10 gets tier 3 or enemy gets tier 1 |
| Knowledge | Director spends Malice |
| Life | Creature within 10 regains Stamina |
| Love | You/ally within 10 uses Aid Attack or ally-targeting ability |
| Nature | You/creature within 10 takes acid/cold/fire/lightning/poison/sonic damage |
| Protection | You/ally within 10 gains temp Stamina or uses damage-reducing triggered action |
| Storm | Enemy within 10 is force moved |
| Sun | Enemy within 10 takes fire or holy damage |
| Trickery | You/creature within 10 uses Aid Attack or Hide |
| War | You/creature within 10 takes damage > 10+level in a single turn |

## Domain Prayer Effects (Conduit Only, on Natural 3)

| Domain | Effect |
|--------|--------|
| Creation | Create stone wall within 10, size = 5+Intuition |
| Death | Two enemies within 10 take corruption = 2x Intuition |
| Fate | Choose creature within 10: auto tier 1 or tier 3 on next roll |
| Knowledge | Up to 5 allies within 10 each gain 1 surge |
| Life | Ally within 10 spends Recovery, ends effect, or stands; or grant temp Stamina = 2x Intuition |
| Love | All allies within 10 gain temp Stamina = 2x Intuition |
| Nature | Slide creatures = Intuition score within 10, up to Intuition squares each |
| Protection | Ally within 10 gains temp Stamina = 4x Intuition |
| Storm | 3-cube within 10: lightning damage = 2x Intuition |
| Sun | One enemy within 10: fire damage = 3x Intuition |
| Trickery | Slide one creature within 10 up to 5+level squares |
| War | Up to 3 allies within 10 each gain 2 surges |

## 1st-Level Domain Features

| Domain | Feature | Skill Group | Effect |
|--------|---------|-------------|--------|
| Creation | Hands of the Maker | Crafting | Maneuver: create mundane object size 1S or smaller; maintain up to Presence/Intuition objects |
| Death | Grave Speech | Lore | Maneuver: speak to creature dead within 24 hours, 1 min, one use per creature |
| Fate | Oracular Visions | Lore | Fate points = Victories; spend 1 for edge on test within 10 |
| Knowledge | Blessing of Comprehension | Lore | Interpret diagrams regardless of language; fluent in all languages for project sources |
| Life | Revitalizing Ritual | Exploration | On respite: chosen creature gains +level to recovery value until next respite |
| Love | Blessing of Compassion | Interpersonal | Edge on assist tests; +1 NPC patience and edge on first influence test at negotiation start |
| Nature | Faithful Friend | Exploration | Conjure incorporeal spirit animal, speed 5, fly, share senses within 10 |
| Protection | Protective Circle | Exploration | 10 min to create circle for one creature; lasts 24 hours; creature can't be targeted by strikes |
| Storm | Blessing of Fortunate Weather | Exploration | On respite: set weather within 100 squares for skill edges |
| Sun | Inner Light | Lore | On respite: chosen creature gains +1 saving throws until next respite |
| Trickery | Inspired Deception | Intrigue | Use Presence/Intuition instead of other characteristics for intrigue skill tests |
| War | Sanctified Weapon | Exploration | Respite: bless weapon for +1 rolled damage |

## 4th-Level Domain Features

| Domain | Feature | Effect |
|--------|---------|--------|
| Creation | Improved Hands of the Maker | Objects can be size 2 or smaller |
| Death | Seance | Respite: speak with named dead person's spirit |
| Fate | Oracular Warning | On respite: allies get temp Stamina = 10+level until next respite |
| Knowledge | Saint's Epiphany | At respite: +1d10+Presence/Intuition to a project roll |
| Life | Blessing of Life | Allies within healing range regain +Presence/Intuition Stamina when healed |
| Love | Invocation of the Heart | Touch: telepathic bond any distance; assist any test regardless of proximity |
| Nature | Wode Road | Touch trees to create teleportation network |
| Protection | Impervious Touch | Grant object immunity to untyped damage |
| Storm | Windwalk | Fly at 5+ Victories (or +2 speed if already flying) |
| Sun | Light of Revelation | Illuminate area revealing hidden creatures; edge on hidden object/illusion tests |
| Trickery | Blessing of Secrets | 3-aura: double edge on hide/sneak for self+allies |
| War | Improved Sanctified Weapon | Weapon bonus becomes +3 |

## 7th-Level Domain Features

| Domain | Feature | Effect |
|--------|---------|--------|
| Creation | Divine Quartermaster | On respite: conjure divine treasure (project goal <= 50x level) until next respite |
| Death | Word of Death Deferred | Ally death within range becomes unconsciousness instead; +5 damage to winded |
| Fate | Word of Fate Denied | Redirect lethal ally damage to self or willing creature |
| Knowledge | Gods' Library | No research materials needed; +level to project rolls; gain all lore skills |
| Life | Font of Grace | +1 HR per healing use; conduit: Minor Miracle no longer needs remains |
| Love | Covenant of the Heart | 3 bonds; teleport party to any bonded creature same world |
| Nature | Nature's Bounty | Respite meal: choose 2 benefits (damage immunity, temp Stamina, speed, saves, social edge) |
| Protection | Blessing of Iron | Enemies take bane on strikes vs you or allies within 3 |
| Storm (Censor) | Ride the Lightning | Extra lightning damage, force move bonus, speed bonus |
| Storm (Conduit) | Thunderstruck | +1 surge on lightning/sonic damage; force move distance bonus |
| Sun | Light of the Burning Sun | +5 fire damage on abilities (+15 vs undead); fire immunity = level |
| Trickery | Trinity of Trickery | 9 HR: create two illusory duplicates; swap with duplicate when targeted |
| War | Your Triumphs Are Remembered | On respite: party regains 1 Victory after XP conversion |

---

# PART 6: KITS

21 kits available to martial classes (Censor, Fury, Shadow, Tactician, Troubadour). Each provides equipment categories, stat bonuses, and a signature ability. Swappable at respite.

| Kit | Armor | Weapon | Stamina | Speed | Stability | Melee Dmg | Ranged Dmg | Niche |
|-----|-------|--------|---------|-------|-----------|-----------|------------|-------|
| Arcane Archer | None | Bow | +3/ech | +1 | +0 | -- | +2/+2/+2 | Ranged magic archer |
| Battlemind | Light | Medium | +6/ech | +0 | +1 | +1/+1/+1 | -- | Psionic melee |
| Cloak and Dagger | Light | Light | +3/ech | +1 | +0 | +1/+1/+1 | +1/+1/+1 | Mobile dual-range |
| Dual Wielder | Medium | Light+Medium | +6/ech | +0 | +0 | +2/+2/+2 | -- | Two-weapon damage |
| Guisarmier | Medium | Polearm | +6/ech | +0 | +0 | +2/+2/+2 | -- | Reach melee |
| Martial Artist | None | Unarmed | +3/ech | +2 | +0 | +1/+1/+1 | -- | Fast skirmisher |
| Mountain | Heavy | Heavy | +9/ech | +0 | +0 | +0/+0/+4 | -- | Big single-hit |
| Panther | None | Heavy | +6/ech | +0 | +0 | +0/+0/+4 | -- | Unarmored heavy |
| Pugilist | None | Unarmed | +6/ech | +1 | +1 | +1/+1/+1 | -- | Tough brawler |
| Raider | Light+Shield | Light | +6/ech | +1 | +0 | +1/+1/+1 | +1/+1/+1 | Shield skirmisher |
| Ranger | Medium | Bow+Medium | +6/ech | +0 | +0 | +1/+1/+1 | +1/+1/+1 | Melee/ranged hybrid |
| Rapid-Fire | Light | Bow | +3/ech | +1 | +0 | -- | +2/+2/+2 | Multi-target ranged |
| Retiarius | Light | Ensnaring+Polearm | +3/ech | +1 | +0 | +2/+2/+2 | -- | Net-and-trident |
| Shining Armor | Heavy+Shield | Medium | +12/ech | +0 | +0 | +1/+1/+1 | -- | Max Stamina tank |
| Sniper | None | Bow | +3/ech | +1 | +0 | -- | +0/+0/+4 | Long-range spike |
| Spellsword | Light+Shield | Medium | +6/ech | +0 | +0 | +2/+2/+2 | -- | Melee+magic |
| Stick and Robe | Light | Polearm | +3/ech | +1 | +0 | +2/+2/+2 | -- | Mobile reach |
| Swashbuckler | Light | Medium | +3/ech | +2 | +0 | +2/+2/+2 | -- | Fast duelist |
| Sword and Board | Medium+Shield | Medium | +9/ech | +0 | +0 | +1/+1/+1 | -- | Shield controller |
| Warrior Priest | Heavy | Light | +9/ech | +0 | +0 | +1/+1/+1 | -- | Divine heavy armor |
| Whirlwind | None | Whip | +3/ech | +3 | +0 | +2/+2/+2 | -- | Max speed + reach |

---

# PART 7: PERKS

Non-combat features. One from career, more from class advancement. Having a perk lets you do something without a test or better than a test would allow.

## Crafting Perks (6)

- **Area of Expertise**: Upgrade tier 1 to tier 2 on easy/medium crafting tests; 1-min inspection reveals value/flaws.
- **Expert Artisan**: Roll twice on crafting/research project rolls, take either.
- **Handy**: +1 to crafting tests when you lack an applicable skill.
- **Improvisation Creation**: Jury-rig mundane item without test/tools; lasts 1 hour or 1 use.
- **Inspired Artisan**: Spend hero token for extra project roll during respite.
- **Traveling Artisan**: On non-respite days, 1 hour work = 1d10 project points.

## Exploration Perks (10)

- **Brawny**: Lose 1d6+level Stamina to improve failed Might test by one tier.
- **Camouflage Hunter**: Stay hidden without cover in wilderness once hidden.
- **Danger Sense**: Edge on Alertness in nature; can't be surprised; 72-hour disaster warning.
- **Friend Catapult**: Maneuver: push willing ally up to 2x Might squares vertically.
- **I've Got You!**: Catch falling ally safely as triggered action.
- **Monster Whisperer**: Handle Animals works on non-animal nonsapient creatures.
- **Put Your Back Into It!**: Tier 1 assist has no bane; once per montage, turn ally's tier 1 into tier 2.
- **Team Leader**: Spend hero token so all participants can use your exploration skills.
- **Teamwork**: First montage turn, make a test AND assist.
- **Wood Wise**: Reroll one d10 on 1s during crafting tests.

## Interpersonal Perks (10)

- **Charming Liar**: Failed Lie tests have no consequences; one caught lie in negotiation has no penalty.
- **Dazzler**: Edge on influence after 1+ min performance.
- **Engrossing Monologue**: Captivate non-hostiles; allies get edge on stealth vs listeners.
- **Harmonizer**: Music works on emotionless creatures; once per negotiation, edge on ally's argument.
- **Lie Detector**: Spend hero token to identify lies in a statement.
- **Open Book**: Ask offensive personal question with no fallout if declined.
- **Pardon My Friend**: Replace ally's failed Presence test (with bane).
- **Power Player**: Use Might for Brag/Flirt/Intimidate.
- **So Tell Me...**: After influence success, one creature must answer a follow-up honestly.
- **Spot the Tell**: Tier 3 on reading a person grants permanent edge on future reads.

## Intrigue Perks (6)

- **Criminal Contacts**: Respite in settlement: learn criminal info via Presence test.
- **Forgettable Face**: Creatures forget you; 1-hour disguise auto-tier 2/3.
- **Gum Up the Works**: Jam adjacent trap as triggered action.
- **Lucky Dog**: Lose 1d6+level Stamina to improve failed intrigue test by one tier.
- **Master of Disguise**: Don/remove disguise as part of any Hide.
- **Slipped Lead**: Edge on escape-bonds; auto-escape mundane bonds in 1 min.

## Lore Perks (8)

- **But I Know Who Does**: On failed lore test, learn where info might be found.
- **Eidetic Memory**: Gain one temp lore skill per respite; memorize any text read for 1+ min.
- **Expert Sage**: Roll twice on research project rolls, take either.
- **I've Read About This Place**: In new settlements, ask Director one question about influential figure/contact/need.
- **Linguist**: +2 languages; conversational fluency after 7 days exposure; halved language project cost.
- **Polymath**: +1 to lore tests when you lack an applicable skill.
- **Specialist**: Double edge on chosen lore skill; +1-2 Renown in negotiations with those who know your reputation.
- **Traveling Sage**: On non-respite days, 1 hour research = 1d10 project points.

## Supernatural Perks (8)

- **Arcane Trick**: 7 minor cantrip effects (teleport small object, sparks, ignite/snuff, flavor food, inscribe, illusion).
- **Creature Sense**: Maneuver: learn all keywords of creature within 10 at your level or lower.
- **Familiar**: Gain 1T spirit companion; telepathic senses within 10; can flank.
- **Invisible Force**: Maneuver: telekinetically manipulate 1T object within 10.
- **Psychic Whisper**: Maneuver: one-way 10-second telepathic message to ally within 10.
- **Ritualist**: 1-min blessing: double edge on target's next test.
- **Thingspeaker**: Hold object 1 min: sense dominant emotion and answer 1 question.

---

# PART 8: COMBAT

## Turn Structure

**Alternating activation** -- no initiative rolls.

1. Check for surprise. Surprised creatures can't take triggered actions; attacks against them have edge.
2. Roll d10: 6+ = players choose which side acts first. (If one side is all surprised, other goes first.)
3. Sides alternate turns: one creature from side A, then one from side B.
4. When one side runs out, the other takes remaining turns consecutively.
5. First-round order persists all subsequent rounds.
6. Director-controlled creatures act in groups.

## Actions Per Turn

- **Main action**: Class abilities, Charge, Defend, Free Strike, Heal.
- **Maneuver**: Aid Attack, Catch Breath, Escape Grab, Grab, Hide, Knockback, Stand Up, Use Consumable, Make/Assist Test.
- **Move action**: Advance (move up to speed) or Disengage (shift 1).
- Actions can be taken in any order. Movement can be split. Main action can be downgraded to maneuver or move.
- **Triggered action**: One per round, on any turn, when specific trigger occurs. Free triggered actions don't count.
- **Free maneuvers**: Trivial activities (draw weapon, open unlocked door, pick up item).

## Movement

Standard speed 5. Types: walk, climb (2:1 without climb speed), burrow, swim (2:1 without swim speed), crawl (2:1), fly, hover, teleport, shift.

- **Shifting**: Careful movement avoiding opportunity attacks. Can't shift into/within difficult terrain.
- **Difficult terrain**: +1 square to enter.
- **High ground**: Edge on power rolls when your space is fully above target's.
- **Opportunity attacks**: Free triggered action melee free strike when enemy moves away without shifting.

## Forced Movement

Push (away from source), Pull (toward source), Slide (any direction). Stability reduces distance 1-for-1.

**Collision damage**:
- Into another creature: 1 damage per remaining square of forced movement (to both).
- Into solid object: 2 + 1 per remaining square.
- Through breakable objects: glass costs 1 square, wood costs 2, stone costs 3, metal costs 4.

## Key Maneuvers

- **Aid Attack**: Edge to ally's next roll vs adjacent enemy.
- **Catch Breath**: Spend a Recovery to regain Stamina = recovery value.
- **Grab**: Might test vs target (bane if target is larger). Grabbed = speed 0, bane on abilities not targeting grabber.
- **Knockback**: Might test. Tier 1: push 1. Tier 2: push 2. Tier 3: push 3.
- **Hide**: Must have cover/concealment and not be observed. Agility test (with applicable skill) to become hidden.

## Main Actions

- **Charge**: Move in straight line + melee free strike at end.
- **Defend**: Double bane on attacks against you until start of next turn.
- **Free Strike**: Weapon attack (2d10 + Might for melee, + Agility for ranged). Default fallback.
- **Heal**: Adjacent ally spends a Recovery or makes a saving throw.

## Stamina, Dying, and Death

- **Stamina** = HP. Reduced by damage after immunities.
- **Recovery value** = 1/3 of Stamina max. **Recoveries** = limited self-heal pool (class-determined count).
- **Winded** = Stamina at half max or below. No inherent penalty; many abilities trigger off it.
- **Dying** = Stamina at 0 or below. Automatically **bleeding** (can't be removed). Can still act. Can't Catch Breath. Allies can help you spend Recoveries.
- **Death** = Stamina reaches the negative of your winded value.
- **Temporary Stamina**: Absorbs damage first. Doesn't stack (take higher). Expires end of encounter.

## Conditions

| Condition | Effect |
|-----------|--------|
| Bleeding | 1d6+level damage on main/triggered actions or Might/Agility power rolls |
| Dazed | Only one of: main action, maneuver, or move. No triggered/free actions |
| Frightened | Bane vs source; can't approach source; source has edge vs you |
| Grabbed | Speed 0; bane on abilities not targeting grabber |
| Prone | Bane on own strikes; melee vs you gains edge |
| Restrained | Speed 0; can't stand up or be force moved |
| Slowed | Speed reduced to 2 |
| Taunted | Bane on abilities not targeting taunter |
| Weakened | Abilities deal half damage; can't gain surges |

## Flanking

Two allies on opposite sides of an enemy = edge on melee strikes against that enemy.

## Cover and Concealment

- **Cover** (half blocked by solid object): Bane on damage-dealing abilities against target.
- **Concealment** (fully obscured): Bane on strikes; target can still be targeted unless hidden.

---

# PART 9: NEGOTIATION

Structured social encounters.

- **Interest** (0-5): NPC willingness. 5 = "Yes, and..." (best deal). 4 = "Yes." 3 = "Yes, but..." 2 = "No, but..." 1 = "No." 0 = "No, and..." (hostile).
- **Patience** (0-5): Arguments before final offer. Drops by 1 per argument. At 0, NPC decides based on current Interest.
- Starting stats set by NPC attitude: Hostile (Interest 1, Patience 2), Suspicious (I:1, P:3), Neutral (I:2, P:3), Friendly (I:2, P:4), Trusting (I:3, P:5). Speaking NPC's language adds +1 or +2 Patience.

**Motivations** (12 types): Arguments matching an unused motivation get medium difficulty. Each usable once.

**Pitfalls** (same 12 categories): Triggering one auto-fails, drops both Interest and Patience by 1.

Motivation/Pitfall categories: Benevolence, Discovery, Freedom, Greed, Higher Authority, Justice, Legacy, Peace, Power, Protection, Revelry, Vengeance.

**Uncovering motivations/pitfalls**: Ask directly (NPC may reveal at Interest 3+), hard test (tier 3 reveals one), or research outside the negotiation.

**Renown/Impression**: If hero's Renown >= NPC's Impression score, hero gains edge on certain interpersonal tests (fame: Flirt/Lead/Persuade; infamy: Brag/Interrogate/Intimidate).

---

# PART 10: DOWNTIME AND REWARDS

## Respites

24-hour rest. Regain all Stamina and Recoveries. Victories convert to XP. One respite activity.

## Downtime Projects

Make **project rolls** (characteristic + skill). Total accrues as project points. Natural 19-20 = breakthrough (+20 points + another roll).

**Prerequisites**: Item prerequisite (component) + project source (book/tutor) in a specific language.

### Crafting Projects

| Project | Goal | Notes |
|---------|------|-------|
| Build Airship | 3000 | |
| Build Road | Variable | |
| Craft Teleportation Platform | 1500 | |
| Craft Treasure | Variable | |
| Find a Cure | Variable | |
| Imbue Treasure (1st level) | 150 | Armor/implement/weapon |
| Imbue Treasure (5th level) | 150 | |
| Imbue Treasure (9th level) | 150 | |

### Research Projects

| Project | Goal | Notes |
|---------|------|-------|
| Discover Lore (common) | 15 | |
| Discover Lore (obscure) | 45 | |
| Discover Lore (lost) | 120 | |
| Discover Lore (forbidden) | 240 | |
| Go Undercover | 15 | Escalating caught chance |
| Hone Career Skills | Variable | |
| Learn From a Master (hone) | 120 | |
| Learn From a Master (improve) | 500 | |
| Learn From a Master (acquire) | 1000 | |
| Learn New Language | Variable | |

## Treasures

### Consumables (by echelon)

**1st Echelon**: Black Ash Dart, Blood Essence Vial, Buzz Balm, Catapult Dust, Giant's-Blood Flame, Growth Potion, Healing Potion, Imp's Tongue, Lachomp Tooth, Mirror Token, Pocket Homunculus, Portable Cloud (+ Noxious/Thunderhead variants), Professor Veratismo's Quaff 'n Huff Snuff, Snapdragon.

**2nd Echelon**: Breath of Dawn, Bull Shot, Chocolate of Immovability, Concealment Potion, Float Powder, Purified Jelly, Scroll of Resurrection, Telemagnet, Vial of Ethereal Attack.

**3rd Echelon**: Anamorphic Larva, Bottled Paradox, G'Allios Visiting Card, Personal Effigy, Stygian Liquor, Timesplitter, Ward Token, Wellness Tonic.

**4th Echelon**: Breath of Creation, Elixir of Saint Elspeth, Page From the Infinite Library: Solaris, Restorative of the Bright Court.

### Trinkets (by echelon)

**1st**: Color Cloak (Blue/Red/Yellow), Deadweight, Displacing Replacement Bracer, Divine Vine, Flameshade Gloves, Gecko Gloves, Hellcharger Helm, Mask of the Many, Quantum Satchel, Unbinder Boots.

**2nd**: Bastion Belt, Evilest Eye, Insightful Crown, Key of Inquiry, Mediator's Charm, Necklace of the Bayou, Scannerstone, Stop-'n-Go Coin.

**3rd**: Bracers of Strife, Mask of Oversight, Mirage Band, Nullfield Resonator Ring, Shifting Ring.

**4th**: Gravekeeper's Lantern, Psi Blade.

### Leveled Treasure Enhancements

**Armor** (10 types): Adaptive Second Skin of Toxins, Chain of the Sea and Sky, Grand Scarab, King's Roar, Kuran'zoi Prismscale, Paper Trappings, Shrouded Memory, Spiny Turtle, Star-Hunter, Telekinetic Bulwark.

**Implements** (6 types): Abjurer's Bastion, Brittlebreaker, Chaldorb, Ether-Fueled Vessel, Foesense Lenses, Words Become Wonders at Next Breath.

**Weapons** (14 types): Authority's End, Blade of Quintessence, Blade of the Luxurious Fop, Displacer, Executioner's Blade, Icemaker Maul, Knife of Nine, Lance of the Sundered Star, Molten Constrictor, Onerous Bow, Steeltongue, Third Eye Seeker, Thunderhead Bident, Wetwork.

**Other** (5 types): Bloodbound Band, Bloody Hand Wraps, Lightning Treads, Revenger's Wrap, Thief of Joy.

Damage bonuses: +1 (1st level), +2 (5th level), +3 (9th level). Armor Stamina: +6/+12/+21. Shield Stamina: +3/+6/+9 (stacking).

### Artifacts (3)

- **Blade of a Thousand Years**: +5 holy damage; 1-mile aura buffs allies.
- **Encepter**: Auto tier 3 Presence; lasso of light restrains; Obliteration attack.
- **Mortal Coil**: Extra main action but accelerated aging; 10-mile penumbra makes all creatures mortal with damage weakness 2.

## Titles

Earned through deeds. Organized by echelon (1st-4th). Each offers 2-4 mechanical benefit choices.

**1st Echelon** (20 titles): Ancient Loremaster, Battleaxe Diplomat, Brawler, City Rat, Doomed, Dwarven Legionnaire, Elemental Dabbler, Faction Member, Local Hero, Mage Hunter, Marshal, Monster Bane, Owed a Favor, Presumed Dead, Ratcatcher, Saved for a Worse Fate, Ship Captain, Troupe Leading Player, Wanted Dead or Alive, Zombie Slayer.

**2nd Echelon** (16 titles): Arena Fighter, Awakened, Battlefield Commander, Blood Magic, Corsair, Faction Officer, Fey Friend, Giant Slayer, Godsworn, Heist Hero, Knight, Master Librarian, Special Agent, Sworn Hunter, Undead Slain, Unstoppable.

**3rd Echelon** (13 titles): Armed and Dangerous, Back From the Grave, Demon Slayer, Diabolist, Dragon Blooded, Fleet Admiral, Maestro, Master Crafter, Noble, Planar Voyager, Scarred, Siege Breaker, Teacher.

**4th Echelon** (10 titles): Champion Competitor, Demigod, Enlightened, Forsaken, Monarch, Peace Bringer, Reborn, Theoretical Warrior, Tireless, Unchained.

## Renown and Wealth

**Renown**: Starts at 0, ~+1/level. Influences negotiations via Impression scores. Attracts followers at thresholds: 3/6/9/12 = 1/2/3/4 followers. Types: Artisans (crafting), Sages (research), Retainers (combat NPCs). Followers operate from a stronghold.

**Wealth**: Abstract 1-6. Start at 1. +1 every ~2 levels. Magic items cannot be purchased.

---

# PART 11: GODS AND RELIGION

Gods are real but forbidden from acting directly. They work through **saints** -- once-mortal demigod intermediaries who can briefly manifest. Churches are consecrated to saints. Multiple churches can serve the same saint differently.

## Elder Gods

**Val** (elves): Domains -- Creation, Knowledge, Life, Nature, Protection. Values art and beauty. Left Orden for Arcadia. Saints: A Sea of Suns, The Taste of Morning, Ripples of Honey.

**Ord** (dwarves): Domains -- Creation, Knowledge, Protection, Sun, War. Values integrity, honor, creation. Saints: Zarok the Law-Giver, Valak-koth the Seeker, Stakros the Engineer.

**Kul** (orcs): Domains -- Knowledge, Life, Sun, Trickery, War. Fire that destroys and creates. Uniquely dislikes worship. Saints: Khorvath Who Slew a Thousand, Grole the One-Handed, Khravila Who Ran Forty Leagues.

**Hakaan**: Animists (nature spirits, ancestor reverence). Heroes become constellations. Notable: Mahsiti the Weaver, Prexaspes the Stargazer.

---

# PART 12: PROGRESSION AND DIRECTOR GUIDANCE

## Levels and Echelons

- **1st echelon** (levels 1-3): Local heroes.
- **2nd echelon** (levels 4-6): Regional heroes.
- **3rd echelon** (levels 7-9): World-shaping heroes.
- **4th echelon** (level 10): Legendary/demigod-tier.

## Reward Cadence

| Reward | Rate |
|--------|------|
| Victories | 1 per combat/montage/negotiation; 2 for hard encounters |
| Leveled Treasures | 2 per hero by 10th level |
| Trinkets | 1 per hero per echelon |
| Consumables | 1-3 per level |
| Titles | ~1 every other level |
| Renown | ~1 per level |
| Wealth | ~1 every 2 levels |

## Setting Overview

- **Orden**: The prime world. Vasloria (medieval fantasy, dragon knights, Ajax's conquest). Capital (cosmopolitan city of intrigue).
- **The Timescape**: The multiverse. Seven Cities of Hell, Axiom (plane of law), the wodes (fey forests), and more.
- **Ajax**: Central villain. Tyrant who destroyed the Dragon Phalanx and conquered Vasloria through betrayal (Mandrake, a dragon knight, turned traitor).
- **Caelian**: Common language spoken by all PCs.

## Malice

The Director's resource. Spent to empower villain abilities, trigger complications, and create dramatic twists. Gained at encounter start and from specific triggers (natural 1s, troubadour's Appeal to the Muses, etc.).

## Hero Tokens

Awarded by the Director for risk-taking, dramatic play, and heroic moments. Spent to reroll any test.

## Victories

Earned from successful encounters. Convert to XP during respites for leveling. Also used as starting heroic resource in combat and to unlock certain abilities/features.

# SC-232 r7: which card-head slots does the plugin leave empty that the site fills?

## Executive summary

1. **21 differing slots in 4 classes: (b) 12, (d) 5, (a) 3, (c) 1.** In addition, 1 card-level (c) gap and 3 documented, deliberate differences are not counted.
   - The dominant cause: the plugin **never fills `leftDeck`** on any compendium card. The data for it is already in the plugin's input. Every ds-* fence carries `metadata.{class, subclass, ancestry, kit, level, subtype, scc}`, and the SDK keeps it on the model, but no head composition reads it.
2. **Scott's example, Determination's lower-left "Human", is class (b).**
   - The synced fence has `metadata.ancestry: human`, and the plugin's by-SCC model carries it.
   - `renderFeature.ts:289-297` passes no `leftDeck`.
   - The site derives the line from the same field (`trait_cards.go:563-578`, placed at `:205`).
3. **Recommended first work item is W1: fill `leftDeck` from `metadata`.**
   - Traits and class features get `ancestry | class | kit` (+ `feature_source`) `· subclass`. Abilities get `class · subclass`. The kit signature gets `kit`.
   - It lives in one function (`renderFeature.ts`) plus a Steel line style. Estimate: S, about half a day with tests.
4. **W1 moves 0 frozen print lines,** because no harness fixture carries `metadata`. It needs new metadata-bearing fixtures to be visible at all. Those are additions only (a widening), so no sanction is needed.
5. **The print movers are:**

   | Item | Change | Frozen lines |
   |---|---|---|
   | W4 | Statblock: "Monster" eyebrow, keywords moved to the lower-left | 54 (27 ids) |
   | W7 | Usage moved into the right-deck | 16 (8 ids) |
   | W3 | Cost moved to the right-primary | 14 (7 ids) |

   All other items are print-neutral. Details in §4.
6. **Overlap with other tickets:**
   - W6 (the crest on nested sub-feature heads) overlaps SC-367.
   - No item touches name ink (SC-368).
   - W7 touches the meta-chip band that SC-231 rewrote (landed on `develop`).
   - W3 and W7 interact with SC-284's narrow re-placement rules (landed).
7. **No head-slot code changed** between branch head `bd2087e` and `origin/develop` `5a20d5f`. SC-231 touched `renderFeature.ts` but not its `cardHead` block, which now sits at develop `:393`.

**Method.**
- **Site side:** the live site DOM at 1440 wide (`r7-survey/scripts/site-slots.mjs`, `site-tiles.mjs`, `site-one.mjs`), checked against the steel-etl templates.
- **Plugin side:** the **same entities** fetched from `SteelCompendium/data-unified` `en/unified/md-dse/` and rendered through the real public `ds-scc` path. I used jsdom (`slotDump.test.ts`, `modelDump.test.ts`) in a scratch copy of the DSE worktree with the files added as fixtures.
- **Visibility and print:** measured with a browser harness built from the scratch copy (`plugin-visible.mjs`). The copy carries one patch, `?src=` to inject a real fence body (`scratch-copy-entry.patch`).
- **Frozen-capture impact:** measured on the print twin of all 130 frozen ids (`print-patterns.mjs`).
- The worktree itself was never edited.

## 1. Slot map (same entity on both sides)

Each cell shows `text` and, where it matters, `[style]`. A dash means the slot is empty. Site template references are under `steel-etl/internal/site/`; plugin references are under `draw-steel-elements/src/` at `bd2087e`. The fence-field line in each block names the input the plugin already has.

### Ability card: "Mark" (tactician L1), "Apex Predator" (fury L2)

**Site** (`ability_cards.go:328-336`):
- Crest: action glyph.
- Left-eyebrow: "Ability".
- Name.
- Left-deck: **"Tactician" / "Fury"**, from `abilityOrigin` = class · subclass (`:137-145`).
- Right-eyebrow: **"Level 1" / "Level 2"** chip, from `level` (`:318-320`).
- Right-primary: **"5 Ferocity"** mini, from `cost`, else "Signature" when `subtype: signature` (`:174-177`).
- Right-deck: **"Maneuver" / "Main Action"** chip, from `actionInfo(action_type)` (`:88-110`).

**Plugin** (`elements/feature/renderFeature.ts:289-297`):
- Crest: action glyph, 48px.
- Left-eyebrow: "Ability" (`kindNounOf`, `:204-206`).
- Name.
- Left-deck: –.
- Right-eyebrow: **cost "5 Ferocity"** chip (`:294`).
- Right-primary: `ability_type` if any (`:295`).
- Right-deck: –.

**Fence fields present:** `metadata.class`, `metadata.level`, `metadata.subtype` and top-level `usage` are all in the model (`data/plugin-models.json`).

### Trait: "Determination" (human)

**Site** (`trait_cards.go:86-127`, `:196-210`):
- Crest: trait star.
- Left-eyebrow: "Trait" (`featureNoun`, `:553-558`).
- Name.
- Left-deck: **"Human"**, from `traitSource` = class | ancestry | kit (+ `feature_source`) · subclass (`:563-591`).
- Right-eyebrow: "Level N" when a level exists (none here).
- Right-primary: **"2 Points"** mini, from `cost`.

**Plugin:**
- Left-eyebrow "Trait", name.
- Left-deck: **–**.
- Right-eyebrow: **"2 Points"** chip.
- Right-primary: –.

**Fence fields present:** `metadata.ancestry: human`, `cost`.

### Class feature: "Growing Ferocity" (fury L1, `feature_type: feature`)

**Site:** left-eyebrow **"Feature"**, name, left-deck **"Fury"**, right-eyebrow **"Level 1"**.

**Plugin:** left-eyebrow **"Trait"** (wrong noun: `kindNounOf` maps every non-ability to "Trait"), name, nothing else.

**Fence fields present:** `feature_type: feature`, `metadata.class`, `metadata.level`.

### Kit head: "Panther"

- **Site:** kit crest, left-eyebrow "Martial Kit", name (`kit_page.go:92-97`).
- **Plugin:** backpack crest, left-eyebrow "Martial Kit", name (`display/layouts.ts:268`).
- **No gap.**

### Kit signature ability: "Devastating Rush", on the kit card

**Site:** the ability card with left-eyebrow "Ability", name, left-deck **"Panther"** (the kit name, `ability_cards.go:322-327`), right-primary **"Signature"** mini, right-deck **"Main Action"** chip.

**Plugin, inline `signature_ability` path (the harness fixture):** left-eyebrow "Ability", name, right-primary "Signature" (the fixture's `ability_type`). Nothing else.

**Plugin, by-SCC path:** the kit body's nested ` ```ds-feature ` fence renders via `layouts.ts:343-352`. That fence has **no `ability_type`**, so the head shows only left-eyebrow "Ability" and the name.

**Fence fields present:** `metadata.kit: panther`, `metadata.subtype: signature`, `usage: Main action`.

### Statblock head: "Human Bandit Chief", "Goblin Warrior"

**Site** (`statblock_card.go:312-341`):
- No crest.
- Left-eyebrow: **"Monster"**, from `statblockKindNoun(scc)` = Monster / Companion / Retainer / Summon (`statblock_page.go:245-261`).
- Name.
- Left-deck: **"Human, Humanoid"**, the keywords (`statblock_page.go:282-300`).
- Right-eyebrow: "Level 3" chip (with a −/+ level scaler).
- Right-primary: "Leader" mini.
- Right-deck: "EV 20".

**Plugin** (`elements/statblock/view.ts:137-156`, `:299-310`):
- Role crest, 48px.
- Left-eyebrow: **"Human, Humanoid"**.
- Name.
- Left-deck: **–**.
- Right-eyebrow: "Level 3". Right-primary: "Leader" (un-chipped in Steel). Right-deck: "EV 20".

**Fence fields present:** `keywords`, and `metadata.scc` (`monster.human.statblock`), from which the kind-noun derives.

### Statblock sub-feature (nested)

**Site** (`statblock_card.go:128-147`):
- Small action-glyph icon, the name, and right-primary with **"Signature" / "2 Malice" / "Villain Action N"** as a chip. That value is the book's parenthetical (`statblock_page.go:404-415`, which normalizes "Signature Ability" to "Signature").
- No left-eyebrow. No usage in the head, by design (comment at `:134-138`).

**Plugin:**
- **Shield crest at 48px** and left-eyebrow **"Ability"/"Trait"** (both visible on screen).
- Name.
- Cost **in the right-eyebrow** ("2 Malice").
- `ability_type` **"Signature Ability"** in the right-primary.

**Fence fields present:** `cost`, `ability_type`.

### Featureblock head: "Devil Malice"

**Site** (`featureblock_page.go:264-273`):
- Left-eyebrow: **"Malice"**, from `fbKindNoun(kind)` (`:184-199`).
- Name.
- Left-deck: summoner / retainer origin (none here).
- Right-eyebrow: Level. Right-primary: terrain type + role. Right-deck: EV.

**Plugin** (`elements/featureblock/view.ts:85-95`):
- Left-eyebrow: `featureblock_type` when no role. On by-SCC the synced fence has **no `featureblock_type`**, so it renders **–**.
- The harness fixture shows "Malice Features" only because the fixture hand-authors `featureblock_type`.

**Fence fields present:** `kind: malice`, which survives into the model.

### Featureblock option (nested)

**Site** (`featureblock_page.go:420-433`): icon, name, right-primary cost mini ("3 Malice"), right-deck usage chip.

**Plugin:** icon, name, and the cost in the right-eyebrow DOM slot. SC-101's CSS moves that cost into the primary lane and moves `ability_type` into the deck lane (`styles-source.css:8158-8172`). **Plus left-eyebrow "Trait", visible.**

**Fence fields present:** `cost`, `usage`.

### Class head: "Tactician"

**Site** (`class_page.go:61-73`): left-eyebrow "Class", name, right-eyebrow **"Draw Steel: Heroes"** book chip, right-primary "Might · Reason", right-deck "primary characteristics".

**Plugin** (`layouts.ts:1058-1064`): left-eyebrow "Class", name, right-eyebrow **–**, right-primary "Might · Reason", right-deck "primary characteristics".

**Fence fields present:** `scc` prefix `mcdm.heroes.v1` only. The label "Draw Steel: Heroes" lives in `v2/site.yaml:30` (`chapter_page.go:21-32`).

### Other families

**Project:**
- The site has a project head (`project_cards.go:137-147`): "Downtime Project", name, right-eyebrow "Item Level N", right-primary "Goal N", right-deck "N enhancements".
- The plugin has no compendium project card: `ds-scc` reports "no renderer". The plugin's `project` element is a tracker with its own head, and there is no site counterpart for it.

**Ancestry, career, complication, condition, culture, perk, title, treasure, rule:**
- These site pages carry **no `.sc-head`**; the ancestry page only has trait-tree heads.
- Where the site has an index tile (`.sc-card`), its type line and name equal the plugin's left-eyebrow and name (`data/site-tiles.json`). The treasure index has no tiles.
- **No gap.**

### Plugin element families with a head

feature (abilities, traits and features), statblock, featureblock, kit, ancestry, class, career, complication, condition, culture, perk, title, treasure, rule, project, encounter, negotiation, montage, party, roll. The GM trackers (the last five) have no site counterpart.

## 2. Gap classes

### (b) The data is in the plugin's input, but the head does not map it — 12

| # | Family / slot | Site shows | Plugin input field |
|---|---|---|---|
| b1 | Ability left-deck | "Tactician" (class · subclass) | `metadata.class`, `metadata.subclass` |
| b2 | Ability right-eyebrow | "Level 1" | `metadata.level` |
| b3 | Ability right-deck | "Maneuver" / "Main Action" | `usage` (top-level; today shown only as the meta "Type" chip) |
| **b4** | **Trait left-deck** | **"Human" (Scott's example)** | **`metadata.ancestry`** (or `class` / `kit`, + `feature_source`, · `subclass`) |
| b5 | Class-feature left-deck | "Fury" | `metadata.class` |
| b6 | Class-feature right-eyebrow | "Level 1" | `metadata.level` (and the level from `scc` for traits) |
| b7 | Class-feature left-eyebrow noun | "Feature" (plugin says "Trait") | `feature_type: feature` |
| b8 | Kit-signature left-deck | "Panther" | `metadata.kit` (by-SCC); the parent kit's name (inline) |
| b9 | Kit-signature right-deck | "Main Action" | `usage` |
| b10 | Kit-signature right-primary (by-SCC) | "Signature" | `metadata.subtype: signature` |
| b11 | Statblock left-eyebrow | "Monster" / "Companion" / … | `metadata.scc` type path (fallback "Monster") |
| b12 | Featureblock left-eyebrow (by-SCC) | "Malice" / "Fixture" / "Dynamic Terrain" / "Advancement" | `kind` |

### (d) Content in a different slot, or plugin-only content — 5

| # | Where | Site | Plugin |
|---|---|---|---|
| d1 | Standalone ability or trait cost | right-primary mini | right-eyebrow chip ("5 Ferocity", "2 Points") |
| d2 | Statblock keywords | left-deck ("Human, Humanoid") under the "Monster" eyebrow | left-eyebrow |
| d3 | Statblock sub-feature cost / parenthetical | right-primary chip, "Signature" | cost in the right-eyebrow; right-primary holds "Signature Ability" |
| d4 | Sub-feature left-eyebrow (statblock and featureblock nested) | none. DESIGN.md:202-204: "Sub-features … drop the implied lanes → name + cost + usage" | "Ability" / "Trait" visible on screen |
| d5 | Statblock sub-feature crest | small action-glyph icon | 48px shield crest (**SC-367 overlap**) |

### (a) The plugin renders the slot; only the harness fixture lacks the data — 3

| # | Gap |
|---|---|
| a1 | There is no trait fixture. Every `feature` fixture is an ability, so the r4 "Determination" row was built by DOM surgery, not by a real render. |
| a2 | No fixture carries `metadata` (`class`/`subclass`/`ancestry`/`kit`/`level`/`subtype`). b1, b2, b4–b8 and b10 can never show in a shot until one does. |
| a3 | No fixture is by-SCC-shaped: statblock without `metadata.scc`, featureblock with a hand-authored `featureblock_type` instead of `kind`, and the kit uses the inline `signature_ability` path rather than the nested-fence path real syncs take. |

### (c) The data is not in the plugin's input — 1 slot-level, plus 1 card-level

| # | Level | Gap | Needed |
|---|---|---|---|
| c1 | Slot | Class right-eyebrow book chip "Draw Steel: Heroes" | The label exists only in `v2/site.yaml:30`. Either steel-etl emits it into md-dse frontmatter/metadata (a field such as `printing_book`, which `chapter_page.go:22` already honours), or the plugin carries a 4-entry `scc`-prefix → label table (which duplicates site config). |
| C-card | Card (not counted) | Companion statblocks (e.g. Bear) | md-dse emits them as `type: feature-group` with no ` ```ds-sb ` block, so `ds-scc` shows "no renderer" and the plugin renders no card at all. Needs **steel-etl** md-dse output. Out of SC-232's scope. |

### Documented deliberate differences (not gaps)

- **Statblock top-head crest (plugin only).** `statblock/view.ts:74-88`: "the shipped site … does NOT put a shield crest on its own top-level card head today … this is a plugin-side extension of the crest system … and this task's explicit brief". This is a plan-19 / SC-10 Task 4 decision. It is not a quoted Scott ruling, but it is documented and intentional.
- **Featureblock option cost re-lane.** SC-101 re-lanes the option cost in CSS (`styles-source.css:8126-8172`, citing `featureblock_page.go`). It already matches the site visually.
- **Statblock right-eyebrow −/+ level scaler** is a site-only interactive widget, not data. It is out of scope.

### Stale specs, not decisions

- D2 §3.8 (`docs/superpowers/dse-overhaul/D2-ui-ux-overhaul-spec.md:428`) says the statblock left-eyebrow is the "ancestry/keywords line", and claims to match DESIGN.md "exactly". DESIGN.md's current fill guideline (`DESIGN.md:198-201`: left-eyebrow = kind-noun, left-deck = provenance) and the live site have since moved.
- D2 §3.7 (`:400`) cites "Malice Features" as the featureblock left-eyebrow.
- Neither is a Scott decision to diverge. The only relevant constraint is D2's "no word/number changes". Every item here shows words that already exist in the entity's data. Only d3's "Signature Ability" → "Signature" rewrites a word, and it follows the site's own normalization.

The SC-165 ledger (`build-ledgers/sc165-snapshot-meta-ledger.md:242-245`) had already noted that `leftDeck` "is never passed by any of them … Dead slot". It was recorded, but no decision was made.

## 3. Plan

Frozen capture ids come from `data/print-patterns.json`: the print twin of all 130 frozen ids, measured at `bd2087e`. The line count is ids × 2 (twin + realprint).

In print today:
- The feature left-eyebrow and every crest are `display: none`.
- The statblock and featureblock head left-eyebrows, and every right-rail slot, are visible.

| Item | Covers | Change and targets | Estimate | Frozen print |
|---|---|---|---|---|
| **W1: left-deck provenance (first)** | b1, b4, b5, b8 | `renderFeature.ts` cardHead call (`:289-297`; develop `:393`) builds `leftDeck` from `metadata` (port `traitSource` / `abilityOrigin`, `titleCase`). Kit signature: `layouts.ts:343-352` passes the kit name when `metadata.kit` is absent (optional). Steel line style for `.dse-head__deck--left` on feature heads, screen-scoped. New metadata-bearing trait and ability fixtures in `entry.ts` (a1, a2). | S, ~0.5 day | **0** if metadata-driven only (no frozen fixture has metadata). **8** if the inline kit signature also gets the parent kit name: `kit`, `kit-collapsed`, `chrome-hover-card`, `chrome-collapsed-rollout`. |
| W2: level chip | b2, b6 | Right-eyebrow = "Level N" from `metadata.level` (or `scc` `level-N`). **Needs W3 first**, because the right-eyebrow holds the cost today. | XS | 0 |
| W3: right-rail remap for features | d1, d3, b10 | Standalone feature: cost → right-primary (mini); fallback "Signature" when `subtype: signature`; `ability_type` → right-primary when there is no cost. Statblock sub-feature: parenthetical → right-primary chip, normalized to "Signature". Move the forged-pill CSS (`styles-source.css:8112`) and simplify SC-101's featureblock re-lane (`:8158-8172`) to match. Check SC-284's narrow re-placement arms. | M, ~1 day | **14**: `feature`, `feature-collapsed`, `feature-spend`, `feature-villain`, `chrome-collapsed-rollout`, `statblock-villain-banded`, `statblock-villain-corpus`. The "Signature Ability" → "Signature" normalization alone adds all 27 statblock ids (54 lines) — make it opt-in. |
| W4: statblock kind-noun + keywords | b11, d2 | `statblock/view.ts:137-156` `statblockHeaderParts`: left-eyebrow = kind-noun from `metadata.scc` (port `statblockKindNoun` and optionally `summonerProvenanceEyebrow`; fallback "Monster"); left-deck = keywords. The sticky mini-header shares these parts; check it. Statblock fixture gains `metadata.scc` (a3). | S | **54** (27 ids: `statblock*` ×24, `chrome-collapsed-trio`, `chrome-hover-statblock`, `chrome-placement-trio`). **Needs Scott's sanction + `rebaseline.txt`.** |
| W5: featureblock kind-noun | b12 | `featureblock/view.ts:85-95`: left-eyebrow = `fbKindNoun(kind)`, falling back to today's `featureblock_type`. Optionally left-deck = summoner origin from `metadata.scc`. | XS–S | **0** with the fallback (fixtures have no `kind`) |
| W6: sub-feature head diet | d4, d5 | Nested statblock and featureblock feature heads drop the kind-noun eyebrow. The statblock sub-feature swaps the 48px shield for the small action glyph (the featureblock already uses `.dse-fb__feat-icon`). `renderFeature.ts` + `styles-source.css`, screen-scoped. **SC-367 overlap** (crest sizes). | S–M | **0**: both elements are already hidden in print. Screen shots only. |
| W7: usage chip | b3, b9 | Standalone feature and kit signature: right-deck = `usage`, and drop the duplicated meta "Type" chip. Touches the meta band SC-231 rewrote (landed; rebase first). Featureblock options keep today's lanes. | S | **16**: `feature`, `feature-collapsed`, `feature-list`, `feature-spend`, `chrome-collapsed-rollout`, `kit`, `kit-collapsed`, `chrome-hover-card` |
| W8: "Feature" noun | b7 | `kindNounOf` (`renderFeature.ts:204-206`): "Feature" when `feature_type` is neither ability nor trait (the site's `featureNoun`). | XS | 0 (the left-eyebrow is hidden in print; all frozen standalone fixtures are abilities) |
| (c) c1: class book chip | c1 | steel-etl emits the book label into md-dse (repo **steel-etl**, the class md-dse frontmatter/metadata field, e.g. `printing_book`), **or** a plugin-side label table. | S (+ a data redeploy) | 2 (`class`) if the fixture gains the field |

### Totals

- **Print-neutral items:** W1 (metadata-only), W2, W5, W6, W8.
- **Print-moving items:** W3 (14 lines), W4 (54 lines), W7 (16 lines). These each need a `rebaseline.txt` and Scott's sanction.
- **Overlapping ids:** `feature`, `feature-collapsed`, `feature-spend` and `chrome-collapsed-rollout` appear in both W3 and W7.
- **Union if W3 + W4 + W7 all land:** 36 distinct ids, **72 lines**.

### Suggested order

1. W1 + W8 + the fixtures (a1, a2). This answers Scott's example and needs no sanction.
2. W3 → W2.
3. W7.
4. W4 as a sanctioned rebaseline round.
5. W5 and W6 whenever convenient. Keep W6's crest part with SC-367, or sequence it after SC-367.

### Overlaps

- **SC-367** (crest/eyebrow/right-rail sizes): W6's crest swap; W3 changes which slot carries the mini, so re-derive the SC-367 figures after W3.
- **SC-368** (name ink): no overlap.
- **SC-231** (landed): W7.
- **SC-284** (landed): W3, W7 and the new left-deck row under the narrow container query. Rows 4–6 are re-placed there; W1's left-deck sits in row 3 of column 2 and is unaffected.
- **This branch's Option A name sizes:** independent of every item above.

## Artifacts

Everything is under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r7-survey/`:

- `scripts/`
  - `site-slots.mjs`, `site-tiles.mjs`, `site-one.mjs`: live-site head slots and tiles.
  - `slotDump.test.ts`, `modelDump.test.ts`: plugin heads and models via `ds-scc` (jsdom, run in a scratch copy).
  - `plugin-visible.mjs`: real fences in the copy harness, screen and print visibility.
  - `print-patterns.mjs`: frozen-id pattern census.
  - `scratch-copy-entry.patch`: the one scratch-copy harness patch (`?src=`).
- `data/`
  - `site-slots.json`, `site-tiles.json`
  - `plugin-slots.json`, `plugin-models.json`, `plugin-visible.json`
  - `print-patterns.json`
- `md-dse/`: the 22 data-unified entity files used, fetched 2026-09-27 from `SteelCompendium/data-unified` `main`.

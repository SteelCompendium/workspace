# Content Parsers

## Overview

Content parsers are registered handlers that extract structured data from annotated markdown sections. When the AST walker encounters a heading with a `@type` annotation, it invokes the corresponding parser. The parser reads the section body and returns structured metadata.

Parsers follow a convention-over-configuration principle: they auto-extract data from well-structured content. Explicit annotation fields override auto-extracted values when the content structure is non-standard.

## Parser Interface

```go
type ContentParser interface {
    // Type returns the @type value this parser handles
    Type() string

    // Parse extracts structured metadata from a section
    // ctx provides access to the annotation context stack
    // section contains the heading text and body AST nodes
    Parse(ctx *ContextStack, section *Section) (*ParsedContent, error)
}

type ParsedContent struct {
    // Metadata for YAML frontmatter output
    Frontmatter map[string]any

    // The content body (markdown) with annotations stripped
    Body string

    // SCC classification components derived by the parser
    TypePath  []string  // e.g., ["feature", "ability", "fury", "level-1"]
    ItemID    string    // e.g., "gouge"
}
```

## Parser Registry

### AbilityParser (`@type: ability`)

**Expected markdown structure:**

```markdown
#### Ability Name (Optional Cost)

*Flavor text in italics.*

| **Keywords** | **Action type** |
| --- | ---: |
| **Distance** | **Target** |

**Power Roll + Characteristic:**
- **≤11:** Tier 1 effect
- **12-16:** Tier 2 effect
- **17+:** Tier 3 effect

**Effect:** Additional effect text.

**Spend N Resource:** Spend trigger text.
```

**Auto-extracted fields:**

| Field | Source | Example |
|-------|--------|---------|
| `item_name` | Heading text | `Gouge` |
| `flavor` | First italic paragraph | `Your sharp claws tear...` |
| `keywords` | First cell, first row of ability table | `[Melee, Strike, Weapon]` |
| `action_type` | Second cell, first row | `Main action` |
| `distance` | First cell, second row | `Melee 1` |
| `target` | Second cell, second row | `One creature` |
| `power_roll_characteristic` | "Power Roll + X:" line | `Might` |
| `tier1` | "≤11:" line | `4 + M damage` |
| `tier2` | "12-16:" line | `7 + M damage` |
| `tier3` | "17+:" line | `10 + M damage; push 3` |
| `effect` | "Effect:" paragraph | `You can shift 1...` |
| `spend` | "Spend N Resource:" paragraph | Cost-gated additional effect |

**From context stack:**

| Field | Stack lookup | Example |
|-------|-------------|---------|
| `class` | Nearest `@type: class` ancestor | `fury` |
| `level` | Nearest `@type: feature-group` ancestor's `@level` | `1` |
| `source` | Document frontmatter `book` | `mcdm.heroes.v1` |

**From annotation (explicit or override):**

| Field | Annotation key | When used |
|-------|---------------|-----------|
| `cost` | `@cost` | When cost isn't in heading text (e.g., `#### Gouge` vs `#### Arrest (5 Wrath)`) |
| `action_type` | `@action` | When action type differs from table layout (e.g., triggered actions) |
| `subtype` | `@subtype` | `signature`, `heroic`, `triggered` |
| `trigger` | `@trigger` | For triggered actions, the trigger condition |

**SCC derivation:**
- TypePath: `["feature", "ability", "{class}", "level-{N}"]` (e.g., `["feature", "ability", "fury", "level-1"]`)
- If no class context: `["feature", "ability", "common"]`
- ItemID: from `@id` annotation, or slugified clean heading (cost suffix stripped)

---

### StatblockParser (`@type: statblock`) — *as implemented 2026-06-05*

Individual creature stat block (an H7 heading in the Monsters book). The parser reads the 4-row markdown stat grid into frontmatter and leaves the body (grid + ability/trait blockquotes) intact; the SDK transform (`transformStatblock` + `ParseStatblockFeatures`) parses the blockquotes into a `features[]` array conforming to `statblock.schema.json`.

**Expected markdown structure** (raw, e.g. Goblin Cursespitter):

```markdown
####### Goblin Cursespitter

| Goblin, Humanoid | - | Level 1 | Horde Hexer | EV 3 |
|:--:|:--:|:--:|:--:|:--:|
| **1S**<br>Size | **5**<br>Speed | **10**<br>Stamina | **0**<br>Stability | **1**<br>Free Strike |
| **-**<br>Immunity | **Climb**<br>Movement | - | **-**<br>With Captain | **-**<br>Weakness |
| **-2**<br>Might | **+1**<br>Agility | **0**<br>Reason | **+2**<br>Intuition | **0**<br>Presence |

> 🏹 **Eye of Surlach (Signature Ability)**
> | **Magic, Ranged, Strike** | **Main action** |
> | **📏 Ranged 15** | **🎯 One creature** |
> **Power Roll + 2:**
> - **≤11:** ...  - **12-16:** ...  - **17+:** ...

> ⭐️ **Crafty**
> The cursespitter doesn't provoke opportunity attacks by moving.
```

**Auto-extracted fields** (`parseStatGrid`): `level`, `role` + `organization` (the role cell `Horde Hexer` splits via known vocabularies), `keywords`, `ev`, `stamina`, `speed`, `movement`, `size`, `stability`, `free_strike`, the five characteristic modifiers, plus `immunities`/`weaknesses`/`with_captain` when present.

**SCC:** `monster.<category>[.<subcategory>].statblock/<id>` — `category` and optional `subcategory` (echelon) come from the enclosing `monster` group / `monster-group` container via the context stack; `domain` defaults to `monster` (retainers set `domain: retainer` → `retainer.statblock/<id>`).

---

### ClassParser (`@type: class`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `class_name` | Heading text |
| `overview` | First paragraph(s) before any sub-heading |
| `heroic_resource` | From "Heroic Resource:" line or paragraph |

Mostly a container -- the interesting content is in child `ability` and `feature` sections.

---

### KitParser (`@type: kit`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `kit_name` | Heading text |
| `description` | Introductory paragraphs |
| `equipment` | From equipment list |
| `stat_bonuses` | From stat bonus table (stamina, speed, melee damage, etc.) |
| `signature_ability` | The ability section within the kit |

---

### ChapterParser (`@type: chapter`)

Passthrough parser. Captures the entire chapter content as-is. Used for top-level structural sections.

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `chapter_name` | Heading text |
| `chapter_num` | From `@chapter-num` annotation if present, or positional index |

---

### FeatureGroupParser (`@type: feature-group`)

Container for features at a specific level. Not much to extract directly -- its primary role is to provide `@level` context to child sections.

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `level` | From `@level` annotation |
| `description` | Introductory text if any |

---

### FeatureParser (`@type: feature`)

Non-ability class features (traits) (e.g., "Growing Ferocity", "Fury Subclass"). Traits are open-ended -- they can be plain text, choices of sub-traits, or contain nested abilities. The frontmatter `type` field is set to `"trait"` to align with the data-sdk-npm model.

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `name` | Heading text (cleaned of cost suffixes) |
| `type` | Always `"trait"` |
| `class` | From nearest `@type: class` ancestor |
| `level` | From nearest `@type: feature-group` ancestor's `@level` |
| `description` | Full section content |

**SCC derivation:**
- TypePath: `["feature", "trait", "{class}", "level-{N}"]` (e.g., `["feature", "trait", "fury", "level-1"]`)
- With kit context: `["feature", "trait", "{class}", "level-{N}", "{kit}"]`
- ItemID: from `@id` annotation, or slugified heading

---

### AncestryParser (`@type: ancestry`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `ancestry_name` | Heading text |
| `description` | Introductory paragraphs |
| `signature_trait` | From "Signature Trait" sub-section |
| `ancestry_traits` | List of purchasable traits |

---

### CareerParser (`@type: career`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `career_name` | Heading text |
| `description` | Introductory text |
| `grants` | Skills, languages, renown, wealth, project points |
| `perk` | Associated perk name |

---

### CultureParser (`@type: culture`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `culture_name` | Heading text |
| `environment` | Environment type |
| `organization` | Organization type |
| `upbringing` | Upbringing type |
| `skills` | Granted skills |
| `language` | Granted language |

---

### PerkParser (`@type: perk`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `perk_name` | Heading text |
| `prerequisites` | From "Prerequisites:" line if present |
| `description` | Effect description |

---

### TitleParser (`@type: title`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `title_name` | Heading text |
| `echelon` | From `@echelon` annotation or parent context |
| `benefits` | List of benefit choices |

---

### TreasureParser (`@type: treasure`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `treasure_name` | Heading text |
| `treasure_type` | `consumable`, `trinket`, `leveled`, `artifact` |
| `properties` | Type-specific properties |

---

### ConditionParser (`@type: condition`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `condition_name` | Heading text |
| `effect` | Effect description |

---

### ComplicationParser (`@type: complication`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `complication_name` | Heading text |
| `description` | Full description |

---

### MonsterParser (`@type: monster`) — *as implemented*

A monster **group** (e.g. `## Goblins`). Produces a lore landing page at `monster.<category>/<category>` AND seeds `category` context for its descendant statblocks/featureblocks. Requires `@category` (the slug), since the pipeline pushes the annotation into the context stack for descendants to read. Body is the group lore only — annotated statblock/featureblock children are excluded (and the pipeline skips `RenderSubtree` for this type, so the Browse page stays lore-only; the book-faithful view lives on the Read chapter page).

| Field | Source |
|-------|--------|
| `name` | Heading text |
| `category` | `@category` (or slugified heading) |

---

### FeatureblockParser (`@type: featureblock`) — *as implemented*

A named block of malice/tactical features attached to a group (H9, e.g. "Goblin Malice"). Classifies as `monster.<category>[.<subcategory>]/<id>` — a sibling of the `statblock/` folder. The id keeps a `(Level N+ …)` qualifier (so tiered malice stays distinct) but drops a bare descriptor like `(Malice Features)` / `(Ajax Feature)`. Body retains the feature blockquotes.

---

### DynamicTerrainParser (`@type: dynamic-terrain`) — *as implemented*

A terrain object (H9: hazard, fieldwork, mechanism, fixture). Classifies as `dynamic-terrain.<category>/<id>` (`domain` + `category` from the enclosing `monster-group` container).

| Field | Source |
|-------|--------|
| `name` | Heading text (trailing `(Level N …)` classifier stripped) |
| `level` | From the heading's `(Level N …)` classifier |
| `ev`, `stamina`, `size`, … | `- **EV:** N` list fields in the body |

---

### MonsterGroupParser (`@type: monster-group`) — *as implemented*

Non-code container (like `feature-group` / `treasure-group`) that produces **no file**; it only seeds `domain` / `category` / `subcategory` context for descendants. Used for dynamic-terrain categories (`@domain: dynamic-terrain | @category: …`), the retainer statblock group (`@domain: retainer`), and echelon sub-groups (`@subcategory: 1st-echelon`).

> **Retainers** are not a separate parser — they are `statblock`s under a `monster-group` with `@domain: retainer`, classifying as `retainer.statblock/<id>`.

---

## Adding New Parsers

To add a parser for a new content type:

1. Create a new file in `internal/content/` (e.g., `newtype.go`)
2. Implement the `ContentParser` interface
3. Register it in `internal/content/registry.go`
4. Add the `@type` value to the annotation spec

The parser should:
- Extract what it can from the section body structure
- Fall back to explicit annotation fields for anything it can't auto-detect
- Return clear errors when the section structure is unrecognizable
- Document its expected markdown structure in this file

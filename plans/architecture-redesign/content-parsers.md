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

### StatblockParser (`@type: statblock`)

**Expected markdown structure:**

```markdown
#### Monster Name

**Level N Role (Keywords)**

| EV N | Stamina N | Speed N | Size N |
| --- | --- | --- | --- |

| Might +N | Agility +N | Reason +N | Intuition +N | Presence +N |
| --- | --- | --- | --- | --- |

**Free Strike:** Damage description

**Feature Name:** Feature description.

**Ability Name (Cost)** ◆
*Keywords*
Description and power roll...
```

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `level` | From "Level N Role" line |
| `role` | From "Level N Role" line |
| `ev` | From stat table |
| `stamina` | From stat table |
| `speed` | From stat table |
| `size` | From stat table |
| `characteristics` | From characteristics table (Might, Agility, etc.) |
| `immunities` | From "Immunities:" line if present |
| `free_strike` | From "Free Strike:" paragraph |
| `features` | All non-ability sub-sections |
| `abilities` | All ability-formatted sub-sections |

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

### MonsterParser (`@type: monster`)

Container for a monster entry (lore + statblock). The statblock itself is a child `@type: statblock` section.

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `monster_name` | Heading text |
| `lore` | Introductory/descriptive text |

---

### DynamicTerrainParser (`@type: dynamic-terrain`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `terrain_name` | Heading text |
| `description` | Effect description |

---

### RetainerParser (`@type: retainer`)

**Auto-extracted fields:**

| Field | Source |
|-------|--------|
| `retainer_name` | Heading text |
| Similar to statblock but simpler | |

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

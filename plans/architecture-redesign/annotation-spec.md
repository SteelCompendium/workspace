# Annotation Specification

## Overview

Annotated markdown is the primary input format for the `steel-etl` tool. Annotations provide metadata about sections of the document, telling the tool what each section IS and how to parse it.

## Document-Level: Standard YAML Frontmatter

Every input document begins with standard YAML frontmatter:

```yaml
---
book: mcdm.heroes.v1
source: MCDM
title: Draw Steel Heroes
version: v1
---
```

This is parsed by goldmark's `meta` extension and provides book-level context for all sections.

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `book` | SCC source component (dotted string) | `mcdm.heroes.v1` |
| `source` | Publisher name (human-readable) | `MCDM` |
| `title` | Book title | `Draw Steel Heroes` |

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| `version` | Book version identifier | `v1` |

## Section-Level: HTML Comment Annotations

Annotations are HTML comments placed immediately before a heading. They associate metadata with that heading's section (everything from the heading to the next heading of equal or higher level).

### Single-Line Format

For sections with few annotations:

```markdown
<!-- @type: class | @id: fury -->
## Fury
```

Key-value pairs separated by ` | `. Keys are prefixed with `@`.

### Multi-Line Format

For sections with many annotations:

```markdown
<!--
@type: ability
@id: gouge
@cost: 3 Ferocity
@keywords: Melee, Strike, Weapon
-->
#### Gouge
```

One key-value pair per line. The `@` prefix is required on every key.

### Annotation Fields

#### Universal Fields (apply to all section types)

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `@type` | Yes | Content type -- determines which parser processes this section | `ability`, `class`, `chapter` |
| `@id` | No | Item identifier (slug). If omitted, derived from heading text. | `gouge`, `fury` |

#### Content-Type Specific Fields

These fields are available for explicit annotation but are usually auto-extracted by content parsers. Use them only when the content doesn't match the expected structure.

| Field | Applies to | Description | Example |
|-------|------------|-------------|---------|
| `@cost` | ability | Resource cost | `3 Ferocity`, `5 Wrath` |
| `@action` | ability | Action type | `Main action`, `Maneuver`, `Free triggered action` |
| `@distance` | ability | Range/distance | `Melee 1`, `Ranged 10`, `Self` |
| `@target` | ability | Target specification | `One creature`, `Each enemy in the area` |
| `@keywords` | ability | Comma-separated keyword list | `Melee, Strike, Weapon` |
| `@level` | feature-group | Level at which features are earned | `1`, `2`, `3` |
| `@subtype` | Various | Additional classification hint | `signature`, `heroic`, `triggered` |

Additional fields can be added as needed. Any `@`-prefixed key in an annotation is captured as metadata. Unknown keys are passed through to frontmatter output without special handling.

## Annotation Scope

An annotation applies to the heading immediately following it. The section extends from that heading to the next heading of equal or higher level.

```markdown
<!-- @type: class | @id: fury -->
## Fury                              ← annotation applies to this heading

Everything here is part of the "fury" section...

### 1st-Level Features               ← sub-section, part of "fury"

#### Gouge                           ← sub-sub-section, part of "fury"

<!-- @type: class | @id: shadow -->
## Shadow                            ← new H2 ends the "fury" section
```

## Annotation Hierarchy and Inheritance

Annotations do NOT inherit fields from parent annotations. Instead, content parsers use the **context stack** to look up ancestor metadata at runtime.

For example, an ability parser processing "Gouge" under `## Fury > ### 1st-Level Features > #### Gouge` can look up the stack to find:
- Parent class: `fury` (from the H2 annotation)
- Feature level: `1` (from the H3 annotation)
- Book source: `mcdm.heroes.v1` (from document frontmatter)

See [context-stack.md](context-stack.md) for details.

## Content Type Registry

The `@type` field determines which content parser processes the section. The following types are defined:

| Type | Parser | Description |
|------|--------|-------------|
| `chapter` | ChapterParser | Top-level chapter. Passthrough -- captures content as-is. |
| `class` | ClassParser | Character class (Fury, Shadow, etc.). Extracts overview, heroic resource. |
| `ancestry` | AncestryParser | Character ancestry. Extracts traits, ancestry points. |
| `kit` | KitParser | Equipment kit. Extracts stat bonuses, equipment list, signature ability. |
| `feature-group` | FeatureGroupParser | Container for features at a level. Groups abilities/features. |
| `ability` | AbilityParser | Individual ability. Extracts keywords, cost, power roll, effect. |
| `feature` | FeatureParser | Class/ancestry feature (non-ability). Extracts description. |
| `statblock` | StatblockParser | Monster/NPC stat block. Extracts stats, immunities, abilities. |
| `perk` | PerkParser | Character perk. Extracts prerequisites, description. |
| `career` | CareerParser | Background career. Extracts grants (skills, languages, etc.). |
| `culture` | CultureParser | Background culture. Extracts environment, organization, upbringing. |
| `title` | TitleParser | Reward title. Extracts echelon, benefits. |
| `treasure` | TreasureParser | Reward item. Extracts type (consumable, trinket, artifact), properties. |
| `condition` | ConditionParser | Status condition. Extracts effect description. |
| `skill` | SkillParser | Skill. Extracts associated characteristic. |
| `complication` | ComplicationParser | Character complication. Extracts description. |
| `negotiation` | NegotiationParser | Negotiation content. Passthrough. |
| `monster` | MonsterParser | Monster entry (container for statblock + lore). |
| `dynamic-terrain` | DynamicTerrainParser | Dynamic terrain feature block. |
| `retainer` | RetainerParser | Retainer NPC. |

See [content-parsers.md](content-parsers.md) for what each parser expects and extracts.

## Realistic Example

Below is a realistic excerpt showing how a section of the Heroes book would be annotated:

```markdown
---
book: mcdm.heroes.v1
source: MCDM
title: Draw Steel Heroes
---

<!-- @type: chapter | @id: classes -->
# Classes

A hero's class determines their role in combat...

<!-- @type: class | @id: fury -->
## Fury

The fury is a primal warrior who channels raw, unchecked rage
into devastating attacks...

**Heroic Resource: Ferocity**

<!-- @type: feature-group | @level: 1 -->
### 1st-Level Features

As a 1st-level fury, you gain the following features...

<!-- @type: ability | @subtype: signature -->
#### Brutal Slam

*You slam your weapon into a foe with awesome might.*

| **Melee, Strike, Weapon** | **Main action** |
| --- | ---: |
| **Melee 1** | **One creature** |

**Power Roll + Might:**
- **≤11:** 4 + M damage
- **12-16:** 7 + M damage; push 1
- **17+:** 10 + M damage; push 3

**Effect:** You can shift 1 after this attack.

<!--
@type: ability
@cost: 3 Ferocity
-->
#### Gouge

*Your sharp claws tear into your foe.*

| **Melee, Strike, Weapon** | **Main action** |
| --- | ---: |
| **Melee 1** | **One creature** |

**Power Roll + Might:**
- **≤11:** 4 + M damage
- **12-16:** 7 + M damage
- **17+:** 10 + M damage; the target takes extra damage equal to your Ferocity score at the start of each of your turns (save ends)

<!-- @type: feature -->
#### Growing Ferocity

At the start of each of your turns during combat, you gain 1d3 ferocity.

<!-- @type: feature-group | @level: 2 -->
### 2nd-Level Features

When you reach 2nd level, you gain the following features...

<!-- @type: ability | @cost: 5 Ferocity -->
#### Blood for Blood!

*Pain is just fuel for the fire.*

...
```

### What the Parsers Extract

For the "Gouge" ability above, the AbilityParser would:

1. **From context stack:** class=fury, level=1, book=mcdm.heroes.v1
2. **From annotation:** type=ability, cost=3 Ferocity
3. **From content (auto-parsed):**
   - Keywords: Melee, Strike, Weapon (from the first table cell)
   - Action type: Main action (from the second table cell, first row)
   - Distance: Melee 1 (from the first table cell, second row)
   - Target: One creature (from the second table cell, second row)
   - Power roll: Might (from "Power Roll + Might:")
   - Tier 1: "4 + M damage" (from "≤11:" line)
   - Tier 2: "7 + M damage" (from "12-16:" line)
   - Tier 3: "10 + M damage; the target takes..." (from "17+:" line)
   - Effect: none (no "Effect:" line for this ability)
   - Flavor text: "Your sharp claws tear into your foe." (from italic text)

### What the SCC Classifier Derives

From the annotation hierarchy for Gouge:
- Source: `mcdm.heroes.v1` (from document frontmatter)
- Type: `feature.ability.fury.level-1` (from class=fury, feature-group level=1, type=ability)
- Item: `gouge` (from @id or slugified heading)
- Full SCC: `mcdm.heroes.v1/feature.ability.fury.level-1/gouge`

## Edge Cases and Overrides

### Heading Without Annotation

Headings without annotations are structural -- they contribute to the document hierarchy but don't trigger content parsing. They DO appear in the context stack as unnamed levels.

### Explicit Field Override

When content doesn't match the expected structure, use explicit annotations:

```markdown
<!--
@type: ability
@id: reactive-strike
@action: Free triggered action
@distance: Melee 1
@target: One creature
@keywords: Melee, Strike, Weapon
@trigger: A creature within your reach makes an attack against one of your allies
-->
#### Reactive Strike
```

Here, `@action` overrides what the parser would extract from the body (triggered actions have a different layout than standard abilities).

### Annotations Without a Type

Annotations can provide metadata without triggering a content parser:

```markdown
<!-- @note: This section is incomplete in the source PDF -->
### Experimental Rules
```

The `@note` field is captured in metadata but no parser runs.

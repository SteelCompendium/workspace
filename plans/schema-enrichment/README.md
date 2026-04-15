# Plan: Enrich data-sdk-npm Schemas Before v3.0.0 Release

## Context

The sdk-schema-alignment plan (Phase 4) added 10 new content type schemas to data-sdk-npm, but they are sparse -- mostly just `name`, `type`, `content`, and `metadata`. The Feature schema is the "gold standard" with 11+ parsed fields (keywords, usage, distance, target, effects[], etc.), making it immediately useful to consumers without markdown parsing. The new schemas should follow the same philosophy: extract structured fields from the highly-structured source markdown so consumers don't have to parse markdown themselves.

This work must land before the npm v3.0.0 public release. Backward compatibility is NOT required -- v3.0.0 is a breaking release. The ETL will be updated separately to populate new fields.

## Design Decisions (confirmed)

- **Kit stat_bonuses**: Replace entirely with individual typed bonus fields (clean break)
- **Kit signature_ability**: Full Feature `$ref` (reuse feature.schema.json-3.0.0)
- **Career project_points**: Change from string to integer
- **Class scope**: Basics section only (characteristics, potency, stamina, recoveries, skills). Future work will expand Class to support a character builder with nested Features -- out of scope here but informs field naming.

## Design Principles

1. **All new fields optional** -- ETL populates them in a future pass
2. **Reuse Feature schema via `$ref`** -- signature abilities are Features
3. **Extract what's consistent** -- only fields that appear in a fixed pattern across all items of a type
4. **Strings over enums** -- documented examples, not strict enums (homebrew extensibility)

## Scope

**In scope:** JSON schemas, TypeScript models, TypeScript DTOs, validation tests
**Out of scope:** ETL changes (data-gen), data regeneration, markdown readers/writers

---

## Schema Enhancements

### Phase A: Kit (highest value, most structured)

**Status:** COMPLETE

**Files:** `src/schema/kit.schema.json`, `src/model/Kit.ts`, `src/dto/KitDTO.ts`

Remove `stat_bonuses` and `equipment`. Add:

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Narrative paragraph |
| `armor` | `string[]` | Armor categories: `["Light Armor"]`, `["Heavy Armor", "Shield"]` |
| `weapon` | `string[]` | Weapon types: `["Light Weapon"]`, `["Medium Weapon"]` |
| `equipment_text` | `string` | Raw equipment sentence |
| `stamina_bonus` | `string` | "+3 per echelon" |
| `speed_bonus` | `string` | "+1", "+2" |
| `stability_bonus` | `string` | "+1" |
| `melee_damage_bonus` | `string` | "+2/+2/+2" |
| `ranged_damage_bonus` | `string` | "+0/+0/+4" |
| `melee_distance_bonus` | `string` | "+10" |
| `ranged_distance_bonus` | `string` | "+5" |
| `disengage_bonus` | `string` | "+1" |
| `signature_ability` | `$ref feature.schema.json-3.0.0` | Nested Feature object |

### Phase B: Ancestry + Complication

**Status:** COMPLETE

**Ancestry files:** `src/schema/ancestry.schema.json`, `src/model/Ancestry.ts`, `src/dto/AncestryDTO.ts`

Add to Ancestry:

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Narrative description |
| `signature_trait_name` | `string` | "Detect the Supernatural" |
| `signature_trait_description` | `string` | Full trait effect text |
| `ancestry_points` | `integer` | Points to spend (3 in core) |
| `purchased_traits` | `AncestryTrait[]` | `{ name: string, cost: integer, description?: string }` |

New schema definition `AncestryTrait` (local to ancestry.schema.json).

**Complication files:** `src/schema/complication.schema.json`, `src/model/Complication.ts`, `src/dto/ComplicationDTO.ts`

Add to Complication:

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Narrative description |
| `benefit` | `string` | Benefit text |
| `drawback` | `string` | Drawback text |

### Phase C: Career + Treasure + Class

**Status:** COMPLETE

**Career** (`src/schema/career.schema.json`, `src/model/Career.ts`, `src/dto/CareerDTO.ts`):

| Field | Type | Change |
|-------|------|--------|
| `skill` | - | REMOVE (replaced by `skills`) |
| `skills` | `string[]` | NEW: Array of skill names |
| `skill_group` | `string` | NEW: Skill group constraint |
| `project_points` | `integer` | CHANGE: string -> integer |
| `inciting_incidents` | `IncitingIncident[]` | NEW: `{ roll: integer, name?: string, description: string }` |
| `flavor` | `string` | NEW: Narrative questions |

New schema definition `IncitingIncident` (local to career.schema.json).

**Treasure** (`src/schema/treasure.schema.json`, `src/model/Treasure.ts`, `src/dto/TreasureDTO.ts`):

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Italicized flavor text |
| `keywords` | `string[]` | "Magic, Neck" etc. |
| `item_prerequisite` | `string` | "A ruby hardened in..." |
| `project_source` | `string` | "Licensing agreements in Anjali" |
| `project_roll_characteristic` | `string` | "Reason or Intuition" |
| `project_goal` | `integer` | 150, 450, etc. |
| `effect` | `string` | Main effect text |
| `level_effects` | `object` | `{ "1st": "...", "5th": "...", "9th": "..." }` |

**Class** (`src/schema/class.schema.json`, `src/model/Class.ts`, `src/dto/ClassDTO.ts`):

Basics only for now. Future work will expand for character builder with nested Feature arrays.

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Bold summary paragraph |
| `primary_characteristics` | `string[]` | `["Might", "Agility"]` |
| `weak_potency` | `string` | "Might - 2" |
| `average_potency` | `string` | "Might - 1" |
| `strong_potency` | `string` | "Might" |
| `starting_stamina` | `integer` | 21 |
| `stamina_per_level` | `integer` | 9 |
| `recoveries` | `integer` | 10 |
| `skills` | `string[]` | Starting skills |
| `skill_group` | `string` | Skill group constraint |

### Phase D: Perk + Title + Culture

**Status:** COMPLETE

**Perk** (`src/schema/perk.schema.json`, `src/model/Perk.ts`, `src/dto/PerkDTO.ts`):

| Field | Type | Description |
|-------|------|-------------|
| `perk_group` | `string` | "Crafting", "Exploration", etc. |

**Title** (`src/schema/title.schema.json`, `src/model/Title.ts`, `src/dto/TitleDTO.ts`):

| Field | Type | Description |
|-------|------|-------------|
| `flavor` | `string` | Italicized flavor text |
| `prerequisite` | `string` | Prerequisite text |
| `effect` | `string` | Main effect text |

**Culture** (`src/schema/culture.schema.json`, `src/model/Culture.ts`, `src/dto/CultureDTO.ts`):

| Field | Type | Description |
|-------|------|-------------|
| `culture_benefit_type` | `string` | "Environment", "Organization", "Upbringing" |
| `skill_options` | `string[]` | Parsed skill choices |
| `quick_build_skill` | `string` | Quick Build default |

**Condition**: No changes needed.

### Phase E: Version Bump + Validation

**Status:** COMPLETE

1. Bump all modified schema `$id` versions to 2.0.0
2. Run full test suite
3. Add test fixtures for Kit and Ancestry with fully populated new fields
4. Verify Feature `$ref` resolution works for nested signature_ability

---

## Verification

1. `npm test` -- all existing tests pass
2. New test fixtures validate against schemas
3. Feature `$ref` resolves correctly for Kit.signature_ability
4. `tsc` compiles cleanly

## Risks

- **Feature `$ref` + `unevaluatedProperties: false`**: May need `allOf` or adjusted composition. Will test and adapt.
- **Class future expansion**: Field names chosen to not conflict with future character builder fields (e.g., `features[]`, `subclasses[]`).

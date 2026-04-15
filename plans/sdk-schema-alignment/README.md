# Plan: Align steel-etl Output with data-sdk-npm Schema

## Context

The steel-etl tool generates JSON/YAML output that **conforms** to the data-sdk-npm schema for feature types (abilities + traits), with conformance tests validating against legacy data. All 10 new content type schemas are defined. The data-sdk-npm TypeScript SDK has been updated to v3.0.0 with all schemas, models, DTOs, and IO support for the new types.

### Gap Summary

| Dimension | data-sdk-npm (legacy) | steel-etl (current) | Impact |
|---|---|---|---|
| **Top-level `type`** | `"feature"` for all abilities/traits | `"ability"` or `"trait"` directly | **BREAKING** -- consumers switch on `type` |
| **`feature_type`** | `"ability"` / `"trait"` / `"subtrait"` | Not present | **BREAKING** -- required field in schema |
| **`usage`** field | `"Main action"`, `"Maneuver"`, etc. | `action_type` instead | **BREAKING** -- field name mismatch |
| **`effects[]` array** | Required, structured `[{roll, tier1, tier2, tier3}, {effect: "..."}]` | Flat fields: `tier1`, `tier2`, `power_roll_characteristic`, `effect`, `content` | **BREAKING** -- consumers iterate `effects[]` |
| **`metadata` object** | `{class, level, scc, source, ...}` nested under `metadata` | `class`, `level`, `scc` at top level | **BREAKING** -- field location differs |
| **`content` field** | Not in schema (body goes into `effects[].effect`) | Full markdown body as `content` | SDK doesn't define this field |
| **`ability_type`** | `"Signature"` / `"Heroic"` | `subtype: "signature"` | Different field name + casing |
| **New types** | Only `feature`, `statblock`, `featureblock` defined | Also: `class`, `kit`, `perk`, `career`, `ancestry`, `title`, `treasure`, `condition`, `complication`, `chapter` | Need new schemas |
| **SCC format** | `"mcdm.heroes.v1:feature.ability.fury.1st-level-feature:brutal-slam"` (colon-delimited) | `"mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam"` (slash-delimited) | Format change, documented in redesign plans |

### Design Principles

1. **SDK-compatible output is the primary JSON/YAML format** -- consumers shouldn't have to change their code
2. **New types get new schemas** -- kits, ancestries, etc. are additive, not breaking
3. **SCC codes are an evolution** -- the new slash-delimited format is correct for the redesign; put old-format codes in `metadata` for backwards compat
4. **The `content` field is additive** -- having raw markdown alongside structured data is valuable for homebrew tools
5. **Existing generated data becomes the conformance test baseline** -- steel-etl output should validate against SDK schemas

---

## Progress

- [x] **Phase 1** -- SDK transform in steel-etl (completed 2026-04-14)
- [x] **Phase 2** -- Conformance tests using legacy data (completed 2026-04-14)
- [x] **Phase 3** -- New type schemas (completed 2026-04-14)
- [x] **Phase 4** -- SDK updates (completed 2026-04-14)

---

## Phase 1: SDK-Compatible Output Generator for Features (abilities + traits)

**Status: COMPLETE**

**Goal:** Make the JSON/YAML output for abilities and traits conform to the `feature.schema.json` spec.

### Files created/modified

- `steel-etl/internal/output/sdk_transform.go` -- `TransformToSDKFormat()` function
- `steel-etl/internal/output/sdk_transform_test.go` -- 13 unit tests
- `steel-etl/internal/output/json.go` -- now uses SDK transform
- `steel-etl/internal/output/yaml.go` -- now uses SDK transform
- `steel-etl/internal/output/json_test.go` -- updated assertions
- `steel-etl/internal/output/yaml_test.go` -- updated assertions

### Transform mappings

**For abilities:**

| steel-etl field | SDK field | Transform |
|---|---|---|
| `type: "ability"` | `type: "feature"`, `feature_type: "ability"` | Split |
| `action_type` | `usage` | Rename |
| `subtype: "signature"` | `ability_type: "Signature"` | Rename + capitalize |
| `power_roll_characteristic` + `tier1/2/3` | `effects: [{roll: "Power Roll + X", tier1, tier2, tier3}]` | Nest into effects array |
| `effect` | Appended to `effects[]` as `{name: "Effect", effect: "..."}` | Nest into effects array |
| `spend` | Appended to `effects[]` as `{cost: "Spend ...", effect: "..."}` | Nest into effects array |
| `class`, `level`, `scc`, `source` | `metadata: {class, level, scc, source}` | Move to metadata object |
| `flavor`, `keywords`, `distance`, `target`, `trigger`, `cost`, `name` | Same | Keep as-is |
| Body markdown | `metadata.content` | Move to metadata |

**For traits:**

| steel-etl field | SDK field | Transform |
|---|---|---|
| `type: "trait"` | `type: "feature"`, `feature_type: "trait"` | Split |
| Body markdown | `effects: [{effect: "full body text"}]` | Wrap in effects array |
| `class`, `level`, `scc`, `kit` | `metadata: {...}` | Move to metadata |

**For other types** (class, kit, perk, etc.): pass through as-is with `content` field.

---

## Phase 2: Conformance Tests Using Legacy Data

**Status: COMPLETE**

**Goal:** Use the existing `data-rules-json` repo as a ground-truth baseline to verify steel-etl produces compatible output.

### Files created

- `steel-etl/internal/output/conformance_test.go` -- 30+ tests total

### Test coverage

- **Field-level legacy comparison** (4 tests): Brutal Slam, Hit and Run, To the Death!, Growing Ferocity -- compares name, type, feature_type, usage, distance, target, flavor, keywords, effects (roll/tiers), metadata fields against `data-rules-json` legacy files
- **Schema structure validation** (21 tests): All 15 Fury 1st-level abilities + 6 traits validated for required fields, effect anyOf constraints, and no forbidden top-level fields
- **unevaluatedProperties check** (1 test): Verifies no fields outside the schema's allowed properties list appear at top level (renamed from additionalProperties per data-sdk-npm#13)
- **Usage optionality** (6 tests): Verifies traits correctly omit `usage` field (per data-gen#94)
- **Name always present** (21 tests): Verifies all abilities and traits always have `name` set (per data-gen#94)
- **Effect constraint validation**: Each effect checked against the 4 `anyOf` options (effect field, roll+tier1/2/3, roll+t1/2/3, roll+labeled tiers)
- Tests gracefully skip if legacy data or Heroes input file is not present

### Approach

1. **Snapshot comparison**: For a curated set of abilities/traits, compare steel-etl output against the legacy `data-rules-json` files
2. **Schema validation**: Embed `feature.schema.json` and validate every ability/trait output against it
3. **Field-level checks**: For known sections (Brutal Slam, Gouge, Growing Ferocity), assert specific field values match the legacy format

The tests should:
- Parse the real Heroes input file
- Run abilities/traits through the SDK transform
- Compare key fields against legacy JSON (allowing for known intentional differences like SCC format)
- Validate against the JSON schema

### Known Intentional Differences (not regressions)

These differences from the legacy data are expected and acceptable:
- SCC format: slash-delimited vs colon-delimited (new format is correct)
- `metadata.file_basename` / `metadata.file_dpath`: may differ (path structure changed)
- `metadata.item_index` / `metadata.scdc`: these decimal codes may not be generated yet
- Presence of `content` field in metadata (additive)

---

## Phase 3: Schema Definitions for New Types

**Status: COMPLETE**

**Goal:** Define JSON schemas for types not covered by data-sdk-npm.

### Files created

- `steel-etl/schemas/class.schema.json`
- `steel-etl/schemas/kit.schema.json`
- `steel-etl/schemas/perk.schema.json`
- `steel-etl/schemas/career.schema.json`
- `steel-etl/schemas/ancestry.schema.json`
- `steel-etl/schemas/culture.schema.json`
- `steel-etl/schemas/title.schema.json`
- `steel-etl/schemas/treasure.schema.json`
- `steel-etl/schemas/condition.schema.json`
- `steel-etl/schemas/complication.schema.json`
- `steel-etl/internal/output/schema_validation_test.go` -- 88 test cases

### Design Guidelines

- Every schema requires `type` (const matching the content type) and `name`
- All schemas use **draft 2019-09** with `unevaluatedProperties: false` (not draft-07 `additionalProperties: false`) to allow composition via `allOf` -- see data-sdk-npm#13
- All schemas include optional `metadata` object (for SCC, source, etc.)
- All schemas include optional `content` string (raw markdown body)
- Schemas are designed for extensibility (homebrew can add custom fields via `metadata`)
- Field names use snake_case consistently
- These schemas should eventually be contributed back to data-sdk-npm (or a new data-sdk-go)

### Schema summary

| Type | Type-specific fields |
|---|---|
| class | `heroic_resource` |
| kit | `kit_type`, `stat_bonuses` (object), `equipment` (string array) |
| perk | `prerequisites` |
| career | `skill`, `language`, `renown`, `wealth`, `project_points`, `perk` |
| ancestry | `signature_trait` |
| culture | `environment`, `organization`, `upbringing`, `skill`, `language` |
| title | `echelon`, `benefits` (string array) |
| treasure | `treasure_type`, `level`, `rarity` |
| condition | _(none -- body content only)_ |
| complication | _(none -- body content only)_ |

### Test coverage

- **Required field validation** (10 tests): All types have `name` and correct `type` const
- **No unevaluated properties** (10 tests): All types only emit fields defined in their schema
- **Type const validation** (10 tests): `type` field matches the schema's `const` value
- **Field type validation** (5 tests): Kit, title, treasure, career, culture field types match schema
- **JSON roundtrip** (10 tests): All types survive marshal/unmarshal
- **Empty body** (10 tests): No `content` field when body is empty
- **No feature fields on passthrough** (10 tests): Passthrough types don't get `feature_type`, `effects`, etc.
- **Allowlist enforcement**: Schema property allowlists defined in test code match the JSON schema files

---

## Issue-Driven Adjustments (completed 2026-04-14)

Adjustments made in response to open GitHub issues before proceeding to Phase 4.

### data-sdk-npm#13: Schema composability

**Problem:** `additionalProperties: false` in base schemas prevents composition via `allOf` (e.g., DSE adding rendering fields alongside feature fields).

**Fix applied:**
- All 10 new steel-etl schemas upgraded from **draft-07** to **draft 2019-09**
- `additionalProperties: false` replaced with `unevaluatedProperties: false`
- Conformance test renamed from `TestConformance_NoAdditionalProperties` to `TestConformance_NoUnevaluatedProperties`
- Commented on data-sdk-npm#13 recommending same change for `feature.schema.json` and `statblock.schema.json`

**Remaining for data-sdk-npm:** Apply the same draft upgrade + `unevaluatedProperties` change to `feature.schema.json` and `statblock.schema.json`.

### data-gen#94: Feature schema corrections (Seamus' bug report)

**Findings addressed:**

| Finding | steel-etl status | data-sdk-npm action needed |
|---|---|---|
| `name` should be required | Already always emitted; added `TestConformance_NameAlwaysPresent` (21 tests) | Move `name` into `required` array |
| `usage` should be optional | Already optional; added `TestConformance_UsageIsOptional` (6 tests) | Remove from `required` if present; fix docs |
| `icon` should be required | Not currently extracted by steel-etl | Future work: extract from source or annotation |
| Villain Action in `ability_type` | Statblock concern, not heroes data | Fix in data-gen statblock handling |
| `level` required in statblock | Statblock concern | Move `level` into statblock `required` array |
| Roles vs organization in statblock | Statblock concern | Split into separate fields |
| Ancestry vs keywords in statblock | Statblock concern | Rename field |
| Malice "+" prefix | data-gen parsing bug | Fix in data-gen |

---

## Phase 4: Update data-sdk-npm

**Status: COMPLETE**

Implemented **Option A** (update data-sdk-npm) — the TypeScript SDK now supports all content types.

### Changes made (2026-04-14)

**Schema upgrades:**

- `feature.schema.json`: draft-07 → draft 2019-09, `additionalProperties` → `unevaluatedProperties`, `$id` bumped to `3.0.0`
- `statblock.schema.json`: draft-07 → draft 2019-09, `additionalProperties` → `unevaluatedProperties`, `$id` bumped to `3.0.0`, `level` added to `required`, `metadata` added to properties

**`name` in feature schema (deviation from original plan):**

The plan called for making `name` required per data-gen#94. However, testing revealed that statblock sub-features (inline abilities within villain action effects) are legitimately anonymous — they don't have names in the source data. Making `name` required would break the existing statblock data pattern. `name` remains optional in the schema; the steel-etl producer guarantees `name` is always emitted for top-level abilities/traits (validated by 21 conformance tests).

**New schemas added (10):**

All copied from `steel-etl/schemas/` (draft 2019-09, `unevaluatedProperties: false`):

| Schema | Type-specific fields |
|---|---|
| `ancestry.schema.json` | `signature_trait` |
| `career.schema.json` | `skill`, `language`, `renown`, `wealth`, `project_points`, `perk` |
| `class.schema.json` | `heroic_resource` |
| `complication.schema.json` | _(content only)_ |
| `condition.schema.json` | _(content only)_ |
| `culture.schema.json` | `environment`, `organization`, `upbringing`, `skill`, `language` |
| `kit.schema.json` | `kit_type`, `stat_bonuses`, `equipment` |
| `perk.schema.json` | `prerequisites` |
| `title.schema.json` | `echelon`, `benefits` |
| `treasure.schema.json` | `treasure_type`, `level`, `rarity` |

**TypeScript models and DTOs (10 pairs):**

Each type follows the established pattern: Model extends `SteelCompendiumModel<DTO>`, DTO extends `SteelCompendiumDTO<Model>`, with `fromDTO`/`toDTO`/`partialFromModel` methods.

| Model | DTO |
|---|---|
| `Ancestry.ts` | `AncestryDTO.ts` |
| `Career.ts` | `CareerDTO.ts` |
| `Class.ts` | `ClassDTO.ts` |
| `Complication.ts` | `ComplicationDTO.ts` |
| `Condition.ts` | `ConditionDTO.ts` |
| `Culture.ts` | `CultureDTO.ts` |
| `Kit.ts` | `KitDTO.ts` |
| `Perk.ts` | `PerkDTO.ts` |
| `Title.ts` | `TitleDTO.ts` |
| `Treasure.ts` | `TreasureDTO.ts` |

**IO updates:**

- `SteelCompendiumIdentifier`: Added `CONTENT_TYPE_MAP` for all 10 new types; updated `parse()`, `identify()`, and `identifyModelType()` to recognize them. JSON and YAML readers work via existing generic `JsonReader`/`YamlReader` with model adapters.
- `schema/index.ts`: All 12 schemas exported
- `validation/validator.ts`: All 12 schemas registered; upgraded to `ajv/dist/2019` for draft 2019-09 support
- `model/index.ts` and `dto/index.ts`: All new types exported

**Version bump:**

- `package.json`: 2.2.0 → 3.0.0

**Remaining (future):**

- Update `draw-steel-elements` dependency to v3.0.0
- Option B (data-sdk-go) can be pursued later if needed for steel-etl internal validation

---

## Key Files Reference

| File | Purpose |
|---|---|
| `steel-etl/internal/output/sdk_transform.go` | SDK format transform |
| `steel-etl/internal/output/sdk_transform_test.go` | SDK transform unit tests (13 tests) |
| `steel-etl/internal/output/conformance_test.go` | Legacy data conformance tests (30+ tests) |
| `steel-etl/internal/output/schema_validation_test.go` | New type schema validation tests (88 tests) |
| `steel-etl/internal/output/json.go` | JSON output generator |
| `steel-etl/internal/output/yaml.go` | YAML output generator |
| `steel-etl/internal/output/generator.go` | Markdown output + `BuildMarkdownFile` |
| `steel-etl/internal/content/ability.go` | Ability parser (extracts fields) |
| `steel-etl/internal/content/feature.go` | Feature/trait parser |
| `steel-etl/internal/content/parser.go` | `ParsedContent` struct definition |
| `steel-etl/schemas/*.schema.json` | New type schemas (10 files, draft 2019-09) |
| `data-sdk-npm/src/schema/*.schema.json` | All 12 JSON schemas (feature, statblock, + 10 new types) |
| `data-sdk-npm/src/model/*.ts` | All model classes |
| `data-sdk-npm/src/dto/*.ts` | All DTO classes |
| `data-sdk-npm/src/io/SteelCompendiumIdentifier.ts` | Format/type auto-detection |
| `data-sdk-npm/src/validation/validator.ts` | Schema validation (ajv 2019-09) |
| `data/data-rules-json/Abilities/` | Legacy ability JSON (conformance baseline) |
| `data/data-rules-json/Features/` | Legacy trait JSON (conformance baseline) |

## Verification

1. `go test -race ./...` -- all steel-etl tests pass
2. `npm test` in data-sdk-npm -- all 373 tests pass
3. `npm run build` in data-sdk-npm -- tsc compiles clean
4. New conformance tests pass against legacy data baseline
5. JSON output for abilities validates against `feature.schema.json`
6. Run `steel-etl gen` and spot-check: Brutal Slam, Growing Ferocity, Gouge
7. Compare structure of output files against legacy `data-rules-json` repo

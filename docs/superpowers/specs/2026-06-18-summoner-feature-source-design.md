# Summoner `feature_source` (circle / summoner track) — design

**Date:** 2026-06-18
**Status:** **SHIPPED + LIVE 2026-06-19** via
[`../plans/2026-06-19-summoner-feature-source.md`](../plans/2026-06-19-summoner-feature-source.md)
→ `## Status` (steel-etl `main` @ `8564c3a`, workspace pointer `e69342e`, v2 deploy `28227b0`;
26 circle + 81 summoner features tagged, zero SCC code change, oracle clean). Note: the plan
deliberately **skipped** the spec's schema-file +
`schema_validation_test.go` allowlist edits — feature/ability route through SDK `metadata`
(`additionalProperties: true`) like the existing `subclass` field, not through the passthrough
schema path; carrying `feature_source` into `metadata` is the SDK-parity deliverable (the
TS-SDK consumer side stays a separate tracked effort per `card-data-parity.md` step 5).
**Scope:** `steel-etl` content parsers + `validate`, `input/summoner`, both JSON-schema copies
+ the SDK (`data-sdk-npm` `v3`), v2 card eyebrow + feature-browser facet. Cross-repo →
workspace-level spec.
**Companion:** [`2026-06-18-level-grouping-annotation-standardization-design.md`](2026-06-18-level-grouping-annotation-standardization-design.md)
(Spec A — grouping headers). A and B are independent; B confirmed A unchanged.

## Problem

The Summoner Advancement table splits every level's grants into two columns — **Summoner
Features** and **Circle Features** — but that distinction exists *nowhere in the structured
data*. The book is also structurally inconsistent: level 1 puts circle grants under a
"1st-Level Circle Features" header, but level 2 lumps circle features (Summoner's Dominion,
New Portfolio Minion) under the generic "2nd-Level Features" alongside the base feature
(Perk). So a card for Summoner's Dominion reads "Summoner Feature" with no hint it is a circle
feature, and there is no way to query/filter circle features. `@subclass` is used **zero
times** in the book, so today a circle pick's circle membership lives only in the per-level
lookup tables.

## What this captures

A new frontmatter field **`feature_source`**: a slug naming *what grants a feature, at the
granularity the book assigns it*. Forward-compatible and general; **applied to the Summoner
book only** in this phase.

| Feature kind | `feature_source` | Examples | Validated by |
|---|---|---|---|
| Base class feature | `summoner` | Perk, Minions, Essence | Advancement table "Summoner Features" column |
| Universal circle feature (every summoner gets it) | `circle` | Summoner's Dominion, Portfolio, New Portfolio Minion, Return to the Source, Portfolio Champion, + the 3 circle-lookup containers | Advancement table "Circle Features" column |
| Circle-specific pick (only with that circle) | `circle-of-<name>` | Channel → `circle-of-graves` | **Phase 2** (per-level circle lookup tables) |

This phase implements the first two tiers (`summoner` / `circle`). The value space and
renderers are designed to admit `circle-of-<name>` later; **Phase 2** (tag the ~24 picks,
validated against the lookup tables) is out of scope here and tracked as a follow-on.

The field is **metadata, not identity** — frontmatter only, **no SCC code or path change**. It
supersedes the vestigial `subclass` field conceptually; removing `subclass` is a separate
cleanup, out of scope.

## Annotation + propagation

- Source carries `@feature_source: circle` on circle features, transcribed from the
  advancement table's "Circle Features" column. The explicit-mark set (level → id):
  L1 `summoner-circle`, `portfolio`, `1st-level-circle-features`; L2 `summoners-dominion`,
  `new-portfolio-minion`; L5 `5th-level-circle-feature`, `new-portfolio-minion`;
  L6 `return-to-the-source`; L8 `8th-level-circle-feature`, `portfolio-champion`.
- **Propagation:** `feature_source` flows through the context stack to **descendant
  `feature`/`ability` content only** (mirroring how `@level` propagates), so the 3 circle-
  lookup containers mark their pick-children automatically. `statblock`, `featureblock`,
  `dynamic-terrain`, and `monster-group` descendants **never inherit it** — the fixtures under
  Summoner's Dominion stay clean (they are not class features).
- **Frontmatter emission:** every Summoner-book `feature`/`ability` emits `feature_source` —
  `circle` where marked/inherited, else `summoner` — so the data + facet are uniform with
  minimal source edits. Non-Summoner books omit the field entirely (scope guard: emit only
  when the section's book key is `mcdm.summoner.*`).

## Validation oracle (`steel-etl validate`)

A new check parses the **Summoner Advancement table** (a markdown table whose two feature
columns are already `scc:` links) and cross-checks, for each linked feature, that its emitted
`feature_source` and `level` match the column ("Summoner Features" → `summoner`, "Circle
Features" → `circle`) and row (level) it appears in. Any mismatch — a circle-column feature
not marked `circle`, a summoner-column feature marked `circle`, or a level mismatch — is a
non-fatal `WARN:` (consistent with existing annotation-coverage warnings). The hand-authored
table stays the source of truth; this only prevents silent drift. (The lookup-container
*children* are not in the advancement table; they get `circle` via propagation and are
validated in Phase 2 against the lookup tables.)

## Surfacing

- **Card eyebrow** (`internal/site/trait_cards.go` `traitEyebrow`): when `feature_source:
  circle`, render "Summoner **Circle** Feature"; `summoner` (or absent) keeps today's "Summoner
  Feature". The qualifier is inserted between the class name and the noun, title-cased from the
  slug; designed so `circle-of-graves` can later render "Summoner · Circle of Graves Feature".
  All summoner circle content is `@type: feature` (the circle picks too), so the feature/trait
  eyebrow covers every case. The **ability** card eyebrow is action-typed (Main Action /
  Maneuver / …), not class-sourced, so it is left unchanged this phase; `feature_source` still
  emits in an ability's frontmatter/data for any future circle ability.
- **Filter facet** (`internal/site/feature_index.go` `browseItem` + `steel-feature-browser.js`):
  add `feature_source` to each `browseItem` JSON and a circle/summoner facet control on the
  `.sc-browse-mount` feature browser. The data island wiring follows the
  `navigation.instant`-safe `*-mount` pattern already in place.

## Schema / SDK

`feature_source` is card-surfaced, so per the card-data-parity rule it must be promoted into
the data formats. Abilities validate against `feature.schema.json` too (there is no separate
ability schema), so a single declaration covers both: add `feature_source` to
`steel-etl/schemas/feature.schema.json` **and** the SDK copy
`data-sdk-npm/src/schema/feature.schema.json` on the **`v3`** branch, and add it to the
`internal/output/schema_validation_test.go` allowlist. The two schema copies are hand-synced;
both must land (see ARCHITECTURE.md → "Schemas: two hand-synced copies", and the dual-schema
sync rule).

## Testing

- **Go unit (content):** a feature with `@feature_source: circle` emits `feature_source: circle`;
  a child under a `@feature_source: circle` container inherits it; a `statblock`/`featureblock`
  descendant does **not**; a non-Summoner-book feature omits the field; an unmarked Summoner
  feature emits `summoner`.
- **Go unit (validate):** a circle-column feature missing `circle`, and a summoner-column
  feature wrongly marked `circle`, each produce a `WARN`; an aligned table produces none.
- **Go unit (eyebrow):** `feature_source: circle` → eyebrow contains "Summoner Circle Feature";
  `summoner` → "Summoner Feature" unchanged.
- **Schema:** `schema_validation_test.go` accepts the new field; SDK schema parity asserted by
  hand-sync review.
- **Build/visual:** Summoner's Dominion card eyebrow reads "Summoner Circle Feature"; the
  feature browser facet filters circle vs summoner; clean MkDocs build.

## Risks

- **Advancement-table parse fragility.** Mitigated: the columns are link lists with stable
  `scc:` targets; the check matches by code, and is a non-fatal WARN, not a build gate.
- **feature_source vs the existing `subclass` field.** They overlap; `subclass` is effectively
  unused in these books. We add `feature_source` and leave `subclass` as a later cleanup rather
  than refactor it now.
- **Scope creep into Phase 2 (named circles).** Held out deliberately; the field value space
  and eyebrow are forward-compatible so Phase 2 needs no schema/render change, only data.

## Out of scope

- Phase 2: `circle-of-<name>` for the ~24 circle picks (separate annotation pass + lookup-table
  oracle).
- Generalizing `feature_source` to other classes/books (Order/Domain/College/Aspect/Tradition).
- Removing or migrating the legacy `subclass` field.
- Generating (vs validating) the advancement table.

# Architectural Decisions

**Date:** 2026-04-12

All decisions below were made during the planning session and are considered final unless revisited.

---

## Decision 1: Input Format -- Annotated Markdown

**Decision:** The ETL tool takes annotated markdown as its primary input. Annotations are HTML comments embedded in the markdown document.

**Alternatives considered:**
- (A) Keep current approach: separate YAML config files with XPath selectors pointing into HTML
- (B) Structured YAML/JSON input instead of markdown

**Rationale:**
- Metadata is co-located with content -- no synchronization issues
- Adding a new book means annotating the markdown, not writing XPath configs
- Translators work with the same annotated format
- Eliminates the markdown -> HTML -> XPath -> HTML -> markdown roundtrip
- The input markdown is already well-structured; content parsers can extract data from it automatically
- The existing YAML configs with XPaths are fragile and nearly unusable for new input documents

**Annotation format:** Hybrid approach:
- Standard YAML frontmatter at the document top for book-level metadata
- HTML comment annotations (`<!-- @key: value -->`) for section-level metadata
- Multi-line HTML comments for sections with many annotations
- Annotations associate with the next heading below them

See [annotation-spec.md](annotation-spec.md) for the full specification.

---

## Decision 2: Translation Format -- Markdown

**Decision:** Translations are provided as annotated markdown files mirroring the English structure.

**Alternatives considered:**
- (A) Translation memory files (PO/XLIFF)
- (B) Translated YAML/JSON only (structured data, not prose)

**Rationale:**
- Markdown is the easiest format to convert into from any source
- Translators receive the annotated English file, translate content, preserve structure and annotations
- Content parsers still work because the markdown structure is the same -- only the words change
- Future books will also be markdown, so the same pipeline handles everything

**Open concern:** Translations may not be perfectly structured (e.g., power roll tables might be formatted differently). The translation contributor guide must specify: "translate text, preserve markdown structure and annotations."

---

## Decision 3: Data Repo Consolidation -- 3 Repos

**Decision:** Consolidate 15 data-\* repos into ~3: `data-rules`, `data-bestiary`, `data-unified`.

**Alternatives considered:**
- (A) Keep all 15 repos as-is
- (B) Single monorepo

**Rationale:**
- 15 repos is unwieldy to maintain
- Format variants become subdirectories: `md/`, `json/`, `yaml/`, `md-linked/`, `md-dse/`
- Locale becomes a directory layer: `en/`, `es/`, etc.
- Individual artifacts can still be published (GitHub releases, npm packages) from the consolidated repos
- Dual-publish to old repos during migration period (6+ months), then archive with deprecation notices

**Migration strategy:**
1. Create new consolidated repos
2. Pipeline writes to both old and new repos
3. Coordinate with known consumers (Obsidian plugin, MCDM VTT team)
4. Archive old repos after 6 months with pointers to new locations

---

## Decision 4: URL Scheme -- SCC String-Form as Primary

**Decision:** Use SCC string-form codes as the permanent URL base, with `/` instead of `:` separators.

**Example:** `steelcompendium.io/mcdm.heroes.v1/feature.ability.fury.level-1/gouge`

**Alternatives considered:**
- (A) Human-friendly URLs with SCC redirects
- (B) Short IDs (`steelcompendium.io/a/gouge`)

**Rationale:**
- SCC string-form contains meaningful keywords (good for SEO: "fury", "gouge", "abilities")
- URLs are permanently stable -- no redirect infrastructure needed
- Gives freedom to restructure internal file hierarchy without breaking links
- SCC includes versioning information for future book editions
- Now is the time to fix/redesign SCC codes before freezing them permanently
- Existing classifications CAN be changed since nobody currently depends on them

**Implication:** SCC codes become the permanent contract with the outside world. Once frozen, they must never change. The classification scheme must be finalized during Phase 0.

---

## Decision 5: ETL Language -- Go

**Decision:** Write the ETL tool (`steel-etl`) in Go.

**Alternatives considered:**
- (A) Python -- significant existing code in .just files, but user prefers Go
- (B) TypeScript -- SDK model overlap, but user is weaker in it
- (C) Hybrid -- Python ETL core, TS SDK for consumers

**Rationale:**
- User's strongest and preferred language (Go > TS > Python > Bash)
- Single binary distribution -- translators, MCDM, contributors can run `steel-etl gen` without installing a runtime
- goldmark is an excellent CommonMark parser with extensible AST
- cobra is the industry standard for Go CLIs
- Excellent YAML/JSON handling
- The "reuse TS SDK models" argument is weak -- the contract between ETL and SDK is the JSON schema, not shared code. A Go SDK can be generated from the same schemas.
- The existing embedded Python is tightly coupled to the XPath/HTML approach and would need rewriting anyway

**SDK relationship:** The Go ETL outputs data conforming to JSON schemas (`feature.schema.json`, `statblock.schema.json`). The TypeScript SDK consumes those same schemas. The schema is the shared contract, not the code. This also enables future Go/Python SDKs generated from the same schemas.

---

## Decision 8: JSON Schema Version -- Draft 2019-09 with unevaluatedProperties

**Decision:** All new schemas use JSON Schema draft 2019-09 with `unevaluatedProperties: false` instead of draft-07 with `additionalProperties: false`.

**Date:** 2026-04-14

**Rationale:**
- `additionalProperties: false` prevents schema composition via `allOf` (see data-sdk-npm#13) -- when DSE adds rendering fields via `allOf` with a common-component-fields schema, validation fails
- `unevaluatedProperties: false` (draft 2019-09) achieves the same strictness but allows properties introduced by `allOf`-referenced schemas
- The existing `feature.schema.json` and `statblock.schema.json` in data-sdk-npm should be upgraded the same way

**Applies to:** All 10 new schemas in `steel-etl/schemas/` (class, kit, perk, career, ancestry, culture, title, treasure, condition, complication). Existing data-sdk-npm schemas to be upgraded in Phase 4.

---

## Decision 6: Content Parser Architecture

**Decision:** Annotations mark what a section IS (`@type: ability`), and registered content parsers automatically extract structured data from the section body. Explicit field annotations are supported but only used for edge cases.

**Rationale:**
- The input markdown is already well-structured (power roll tables, keyword lines, cost lines follow consistent patterns)
- Avoids annotating hundreds of abilities and statblocks with every field
- Future input documents (new books) are expected to be similarly structured
- Content parsers encode the knowledge of "what an ability looks like in markdown" once, in code

**Tradeoff:** Content parsers must handle structural variation. If a section doesn't match the expected format, parsing fails loudly rather than silently producing incorrect output.

---

## Decision 7: Existing Code -- Fresh Start

**Decision:** The existing justfile/bash/Python ETL code will NOT be extracted and reorganized. The Go tool is a ground-up rewrite using annotated markdown input.

**What to preserve from the current system:**
- `classification.json` structure (the SCC registry, after redesign)
- Output frontmatter schema (the YAML fields that existing consumers depend on)
- Output file organization patterns (for backward compatibility during migration)

**What to discard:**
- All .just files in data-gen/etl/
- All embedded Python in .just files
- The HTML roundtrip approach
- The YAML config + XPath extraction approach

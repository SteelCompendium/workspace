# Implementation Phases

## Overview

Each phase is independently valuable and delivers a usable increment. No phase requires completing subsequent phases. Phases can overlap where steps are independent.

---

## Phase 0: Design & Annotate (~1 week)

**Goal:** Finalize all design decisions, prepare the annotated input, freeze the SCC scheme.

### Steps

**0.1: Write the annotation specification**
- Finalize annotation format (HTML comments + document frontmatter)
- Define all `@type` values and what each content parser expects
- Document edge cases and override mechanism
- Reference: [annotation-spec.md](annotation-spec.md), [content-parsers.md](content-parsers.md)

**0.2: Redesign the SCC classification scheme**
- Review and fix the current type taxonomy (see [scc-url-design.md](scc-url-design.md))
- Decide canonical classification for multi-classified items
- Verify URL aesthetics: generate sample URLs for all content types
- Resolve versioning questions (errata vs. new edition)
- Regenerate `classification.json` with the new scheme

**0.3: Annotate `Draw Steel Heroes.md`**
- Add document-level YAML frontmatter
- Add `<!-- @type: ... -->` annotations before every section heading
- Focus on getting annotation density right -- too few means content parsers have to guess; too many means annotation fatigue
- Start with one class (e.g., Fury) end-to-end, validate the annotation scheme works, then do the rest
- This is the longest step in Phase 0

**0.4: Write `pipeline.yaml` config**
- Define output formats, variants, directories
- Reference: [pipeline-config.md](pipeline-config.md)

### Exit Criteria
- [ ] Annotation spec is complete and documented
- [ ] SCC scheme is redesigned and documented
- [ ] `Draw Steel Heroes.md` is fully annotated
- [ ] `pipeline.yaml` exists with all settings defined
- [ ] Classification registry regenerated with new scheme

---

## Phase 1: Core Tool (~2-3 weeks)

**Goal:** Build the Go CLI that parses annotated markdown and produces per-section markdown files with frontmatter. This is the minimum viable pipeline.

### Steps

**1.1: Scaffold Go project**
- Initialize `go mod`, set up directory structure per [go-project-structure.md](go-project-structure.md)
- Add cobra CLI skeleton with `gen`, `validate`, `classify`, `strip` subcommands
- Add goldmark + goldmark-meta dependencies
- Set up test infrastructure

**1.2: Implement annotation pre-pass**
- Regex-based scanner: extract `<!-- @key: value -->` and multi-line `<!-- ... -->` blocks
- Associate annotations with line numbers
- Tests: single-line, multi-line, multiple annotations, no annotations

**1.3: Implement document parser**
- Read document frontmatter via goldmark-meta
- Walk goldmark AST, identify heading nodes
- At each heading, check if an annotation exists (by line proximity)
- Build section tree: each section has heading, metadata, body content, children
- Integrate context stack (push/pop on heading boundaries)

**1.4: Implement context stack**
- Push/pop by heading level
- Lookup method (walk up to find key)
- AncestorsOfType for SCC derivation
- Reference: [context-stack.md](context-stack.md)
- Comprehensive unit tests

**1.5: Implement content parsers (big five)**
Start with the most common and complex parsers:
- **AbilityParser** -- parse keyword/action table, power roll, effect, flavor text
- **ClassParser** -- parse overview, heroic resource
- **FeatureGroupParser** -- container, provides level context
- **FeatureParser** -- non-ability features
- **ChapterParser** -- passthrough

Each parser gets unit tests using small markdown fixtures in `testdata/`.

**1.6: Implement SCC classifier**
- Derive SCC string-form from annotation hierarchy
- Look up or assign decimal codes in registry
- Read/write `classification.json`
- Enforce freeze mode (fail if existing code would change)
- Unit tests for derivation logic, registry operations, freeze enforcement

**1.7: Implement markdown output generator**
- Build YAML frontmatter from parsed metadata (matching the existing frontmatter schema so consumers don't break)
- Write per-section `.md` files to the correct file hierarchy
- File naming derived from annotation @id / heading text

**1.8: End-to-end validation**
- Run the pipeline against annotated `Draw Steel Heroes.md`
- Diff output against current `data-rules-md` to verify correctness
- Fix any parsing issues discovered during diffing
- This step may take significant time as edge cases surface

### Exit Criteria
- [ ] `steel-etl gen --config pipeline.yaml` produces per-section markdown files
- [ ] Output frontmatter matches the existing schema (consumers don't break)
- [ ] Output file hierarchy matches the existing structure (or is an intentional improvement)
- [ ] SCC codes are assigned correctly and match the frozen registry
- [ ] 80%+ test coverage on parser, context stack, and SCC modules

---

## Phase 2: Full Output Pipeline (~1-2 weeks)

**Goal:** Add all output formats and variants so the tool fully replaces the current ETL.

### Steps

**2.1: Implement JSON output generator** *DONE*
- Emit per-section `.json` files conforming to the SDK's JSON schemas (`feature.schema.json`, `statblock.schema.json`)
- Uses `TransformToSDKFormat()` to convert abilities/traits to feature.schema.json-compliant output
- Other types (class, kit, perk, etc.) pass through with `content` field
- See `plans/sdk-schema-alignment/` for full transform mappings

**2.2: Implement YAML output generator** *DONE*
- Emit per-section `.yaml` files
- Same SDK transform layer as JSON output

**2.3: Implement linked variant generator** *DONE*
- `scc/resolver.go`: `ResolveLinks()` scans for `scc:` protocol links, resolves to relative paths via registry
- `output/linked.go`: `LinkedGenerator` writes per-section `.md` files with resolved links to `md-linked/`
- 5 tests (resolve, aliases, unknown links left as-is)

**2.4: Implement DSE variant generator** *DONE*
- `output/dse.go`: `DSEGenerator` writes Obsidian DSE format with `ds-feature` YAML codeblocks for abilities/traits
- DSE frontmatter enrichment: `item_id`, `item_name`, `feature_type`, `action_type`, `cost_amount/resource`, `source`
- Plain markdown body for non-feature types (conditions, classes, etc.)
- 4 tests (ability, trait, condition, parseCost)

**2.5: Implement DSE-linked variant** *DONE*
- `output/dse_linked.go`: `DSELinkedGenerator` combines link resolution + DSE formatting
- 3 tests (ability with links, condition, nil/empty guards)

**2.6: Implement stripped markdown output** *DONE*
- `output/stripped.go`: `StrippedGenerator` removes annotations + frontmatter from raw input
- `StripAnnotations()` exported for CLI `strip` command
- Handles single-line, multi-line annotations, frontmatter, blank line collapsing
- CLI `strip` command wired up in `cli/strip.go`
- 8 tests

**2.7: Implement aggregation** *DONE*
- `output/aggregate.go`: `AggregateGenerator` writes per-section files + per-type indexes + master index
- `Finalize()` generates `_index/{type}.md` and `_index/README.md`
- 3 tests (full flow, nil/empty guards, empty finalize)

**2.8: Implement SCC-to-path mapping** *DONE*
- `output/sccmap.go`: `SCCMapGenerator` collects SCC→path entries, writes sorted JSON on `Finalize()`
- Output format: `[{scc, path, name, type}, ...]`
- 3 tests (full flow, empty, nil guards)

**2.9: Implement remaining content parsers** *DONE*
- KitParser, AncestryParser, CareerParser, CultureParser, PerkParser
- TitleParser, TreasureParser, ConditionParser, ComplicationParser, SkillParser
- JSON schemas defined for all new types in `steel-etl/schemas/` (draft 2019-09, `unevaluatedProperties: false`)
- 88 schema validation tests in `schema_validation_test.go`

**2.10: Wire up pipeline config** *DONE*
- `pipeline/config.go`: `Config` struct with all output options (formats, variants, stripped, aggregate, scc_map)
- `pipeline/pipeline.go`: `buildGenerators()` creates all 9 generator types from config
- `cli/gen.go`: CLI `gen` command loads config, applies overrides (`--format`, `--locale`), runs `RunWithConfig()`
- `pipeline.yaml` enables all formats, variants, stripped, aggregate, and scc_map
- 14 tests (config loading, generator building, full pipeline runs)

### Exit Criteria
- [x] All output formats (md, json, yaml) are generated correctly
- [x] All variants (linked, dse, dse-linked) are generated correctly
- [x] Stripped markdown output is clean and renderable
- [x] Aggregated output matches the current data-md structure
- [x] `scc-to-path.json` covers all content
- [x] Current data-gen ETL can be fully replaced by `steel-etl` (spot-checked against legacy data 2026-04-14; some fields like cost_resource may be refined later)
- [x] JSON/YAML output conforms to data-sdk-npm feature schema (see `plans/sdk-schema-alignment/`)
- [x] JSON schemas defined for all new content types (class, kit, perk, career, ancestry, culture, title, treasure, condition, complication)
- [x] Conformance tests validate output against legacy data-rules-json baseline
- [x] All content parsers implemented (KitParser, AncestryParser, CareerParser, CultureParser, PerkParser, TitleParser, TreasureParser, ConditionParser, ComplicationParser)

---

## Phase 3: Translation + Website (~2 weeks)

**Goal:** Enable translated content and migrate the website to SCC-based URLs.

### Steps

**3.1: Add locale support to pipeline** *DONE*
- `--locale` flag and config parameter already existed
- Added `i18n_dir` config field for locale-specific input paths: `{i18n_dir}/{locale}/Draw Steel Heroes.md`
- `ResolveInputPath()` auto-resolves to locale file with fallback to English default
- Locale-specific output paths: `{base_dir}/{locale}/md/...` (already working)
- SCC codes shared across locales (same classification registry)
- 4 tests (English, no i18n_dir, locale exists, locale missing)

**3.2: Create translation template generator** *DONE*
- `steel-etl strip --for-translation -o template.md input.md`
- `output/translation.go`: `TranslationTemplate()` prepends a guide header to the annotated source
- Guide explains what to translate, what to preserve, how to run the pipeline
- Annotations preserved so translated file can be processed by the same pipeline
- Frontmatter-aware insertion (guide goes after YAML frontmatter)
- 3 tests

**3.3: Write translation contributor guide** *DONE*
- `steel-etl/TRANSLATION.md`: Complete guide for translators
- File structure, locale codes, translation workflow
- What to translate vs. what to preserve
- How to run and verify translated output

**3.4: Update v2 website for SCC-based URLs** *DONE*
- New `steel-etl site` subcommand (`internal/site/` package)
- `site.yaml` config maps SCC content types to MkDocs sections (Browse, Read, Bestiary)
- `Build()` reads steel-etl md-linked output, copies files to section dirs, generates .nav.yml, applies search exclusion
- `cleanDocsDir()` preserves protected paths (javascripts, stylesheets, Media)
- `v2/site.yaml` created with Browse (classes, features, conditions, etc.) and Read (chapters)
- 13 tests, 84.8% coverage

**3.5: Replace v2 bash justfile** *DONE*
- `steel-etl site --config v2/site.yaml` replaces the 168-line bash justfile
- No sed/perl — link resolution handled by steel-etl's linked variant generator
- Section mapping via config (include/exclude prefixes) instead of hardcoded bash
- Search exclusion via Go code instead of bash `find ... | sed`
- Static content overrides via config
- v2 build becomes: `steel-etl gen` → `steel-etl site --config site.yaml` → `mkdocs build`
- v2 `justfile` updated (2026-04-26) to run `steel-etl gen` + `steel-etl site` directly instead of cloning `data-md-linked`

**3.6: Add MkDocs i18n support** *DEFERRED — awaiting translated content (expected ~May 2026)*
- Configure MkDocs Material i18n for locale switching
- Language switcher uses SCC codes to link equivalent content across locales
- Test with at least one translated locale
- Pipeline and translation tooling (3.1-3.3) are ready; this step needs actual translated data to test against

### Exit Criteria
- [x] `steel-etl gen --locale es` produces correctly structured output
- [x] Translation template is generated and documented
- [x] v2 website uses SCC-based URLs (via `steel-etl site` command)
- [x] v2 build no longer uses sed/perl for link manipulation
- [ ] At least one translated language is live on the website (or build is verified and awaiting translated content) — *DEFERRED*

---

## Cross-Phase: CLI + SCC Freeze (2026-04-26)

**Goal:** Complete the `validate` and `classify` CLI commands, freeze the SCC taxonomy.

### Steps

**Implement `validate` command** *DONE*
- `steel-etl validate [file] --config pipeline.yaml`
- Reports annotation coverage (total/annotated/unannotated, coverage %)
- Detects unknown `@type` values (no registered parser)
- Detects annotations missing `@type` field
- `--scc-stable` flag: runs pipeline and validates all frozen SCC codes still exist
- New `internal/pipeline/collect.go`: `CollectSCCCodes()` for lightweight SCC collection without writing output

**Implement `classify` command** *DONE*
- `steel-etl classify [file] --config pipeline.yaml`
- Displays all SCC codes grouped by type component
- `--diff`: compares current codes against existing registry (added/removed)
- `--export-map <file>`: exports SCC-to-type JSON mapping

**Wire v2 website to steel-etl** *DONE*
- `v2/justfile` rewritten: `steel-etl gen` → `steel-etl site` → `transform_indexes.py` → git push
- Replaced 150-line bash recipe (git clone data-md-linked + sed/perl/python)
- `v2/CLAUDE.md` updated to reference steel-etl as content source

**SCC taxonomy freeze** *DONE*
- Reviewed all 1,432 codes: 0 duplicates, consistent naming (lowercase, hyphens, no invalid chars)
- `classification.json`: `frozen: true`
- `pipeline.yaml`: `freeze: true`
- Pipeline preserves frozen flag when saving registry
- Pipeline validates frozen codes are not removed when `freeze: true`

---

## Phase 4: Consolidation + Registry (~2 weeks)

**Goal:** Consolidate data repos, formalize the SCC specification, and lay groundwork for homebrew.

### Steps

**4.1: Set up consolidated data repos**
- Create `data-rules`, `data-bestiary`, `data-unified` repos
- Directory structure: `{locale}/{format}/...`
- Pipeline writes to consolidated repos
- Dual-publish to old repos during migration

**4.2: Formalize SCC specification**
- Write the full SCC specification document (grammar, allocation rules, versioning, resolution)
- Publish as part of the Steel Compendium documentation

**4.3: Build SCC resolution for website**
- Static JSON API on GitHub Pages: resolve SCC code to canonical URL and basic metadata
- Enable external tools to look up content by SCC code

**4.4: Design homebrew content spec**
- Publisher registration process
- Third-party SCC allocation (`2.{publisher_id}`)
- Content format requirements (annotated markdown with frontmatter matching standard schemas)
- Validation rules (JSON schema conformance)

**4.5: Coordinate consumer migration**
- Update draw-steel-elements to read from consolidated repos
- Notify MCDM VTT team of new data locations
- Deprecation notices on old repos
- Timeline for archiving old repos (6+ months)

### Exit Criteria
- [ ] Consolidated repos exist and receive pipeline output
- [ ] Old repos receive dual-published output
- [ ] SCC specification is published
- [ ] SCC resolution API is available
- [ ] Homebrew content spec is documented
- [ ] Consumer migration is planned and communicated

---

## Phase 5: Monsters + Multi-Book (~1-2 weeks)

**Goal:** Prove the multi-book pipeline works by adding the Monsters book.

### Steps

**5.1: Annotate `Draw Steel Monsters.md`**
- Apply annotations to the monsters book input
- Monster-specific types: `@type: monster`, `@type: statblock`, `@type: dynamic-terrain`, `@type: retainer`

**5.2: Implement remaining content parsers**
- MonsterParser, StatblockParser, DynamicTerrainParser, RetainerParser
- Unit tests with monster markdown fixtures

**5.3: Add monsters to pipeline config**
- Add `mcdm.monsters.v1` to `pipeline.yaml` books section
- Verify multi-book output: `data-rules/en/md/` (heroes) + `data-bestiary/en/md/` (monsters)

**5.4: Run aggregation across books**
- Verify `data-unified` contains both heroes and monsters content
- SCC registry includes codes for both books
- `scc-to-path.json` covers all content

**5.5: Update website for multi-book**
- Add Bestiary section to MkDocs navigation
- Verify cross-references between books work (hero ability references a monster, etc.)

### Exit Criteria
- [ ] Monsters pipeline produces correct output
- [ ] Multi-book aggregation works
- [ ] Website serves both Heroes and Monsters content
- [ ] Cross-book SCC references resolve correctly
- [ ] Pipeline can be extended to new books by adding annotations + config

---

## Future Phases (Not Yet Planned)

### Phase 6: Homebrew Registry
- Build the registration system for third-party publishers
- PR-based workflow for content submission
- Automated validation pipeline
- Integration with external tools

### Phase 7: Content Distribution API
- REST API for structured data access
- Search endpoint
- Pagination, filtering by type/class/level
- Rate limiting and authentication for heavy consumers

### Phase 8: 3rd Book Integration
- When MCDM publishes their 3rd book, annotate it and run the pipeline
- Validates the multi-book scaling design

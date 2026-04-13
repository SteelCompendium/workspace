# Risks, Mitigations, and Success Criteria

## Risks

### High Severity

#### Risk 1: Content parser brittleness
**Description:** Content parsers rely on the markdown body being well-structured (tables, power roll format, etc.). Variations in the source material could cause parsing failures or incorrect extraction.

**Likelihood:** Medium — the source material is generally consistent, but edge cases exist (triggered actions have different layouts, some abilities have non-standard structures).

**Mitigation:**
- Parsers fail loudly with clear error messages when structure is unrecognized
- Explicit annotation fields (`@action`, `@cost`, etc.) serve as overrides for non-standard content
- `steel-etl validate` command catches parsing issues before generation
- Golden file tests for a representative sample of all content types
- Start with one class (Fury) end-to-end, fix issues, then expand

#### Risk 2: SCC scheme is wrong after freezing
**Description:** After freezing the SCC classification, a flaw in the scheme is discovered that requires changing existing codes.

**Likelihood:** Low — Phase 0 is explicitly about getting this right.

**Mitigation:**
- Phase 0 includes thorough review of the scheme with sample URLs for all content types
- The classification is only frozen after Phase 1 proves it works end-to-end
- If a flaw is found early, codes can still be changed (nobody depends on them yet)
- SCC spec includes a "breaking change" process for extreme cases (deprecate old code, assign new code, redirect)

#### Risk 3: Breaking existing consumers during migration
**Description:** External tools, the Obsidian plugin, and MCDM's VTT depend on the current output format. Changes could break them.

**Likelihood:** Medium — the output frontmatter schema is a de facto API.

**Mitigation:**
- Phase 1 explicitly validates output against current `data-rules-md` by diffing
- Frontmatter schema is preserved: same fields, same types, same names
- Dual-publish to old and new repos for 6+ months
- Coordinate with known consumers before cutting over
- The output format itself doesn't change — only the tool that produces it does

#### Risk 4: Translation structure mismatch
**Description:** Translated content doesn't maintain the expected markdown structure, causing content parsers to fail.

**Likelihood:** Medium — translation teams are used to working with text, not structured markdown.

**Mitigation:**
- Translation contributor guide explicitly states: "preserve markdown structure"
- `steel-etl validate` checks translated files for structural issues before generation
- For the first language, work closely with the translation team to establish patterns
- Explicit annotation overrides serve as a fallback for sections where structure is different

### Medium Severity

#### Risk 5: goldmark limitations
**Description:** goldmark's AST may not expose the structure needed for content parsing (e.g., table cell access, block-level structure within list items).

**Likelihood:** Low — goldmark has a well-designed, extensible AST.

**Mitigation:**
- Prototype the AbilityParser (hardest parser) early in Phase 1
- goldmark supports custom extensions for unusual cases
- Worst case: pre-process specific patterns with regex before AST parsing

#### Risk 6: Annotation fatigue during Phase 0
**Description:** Annotating the entire Heroes book is tedious and error-prone.

**Likelihood:** Medium — the book has hundreds of abilities, each needing at least `<!-- @type: ability -->`.

**Mitigation:**
- Most abilities only need `@type: ability` (one line) — the content parser does the rest
- Many annotations are repetitive (every ability under "1st-Level Features" for Fury is `@type: ability`)
- Write a helper script that auto-generates annotations for well-structured sections
- `steel-etl validate` catches missing or malformed annotations
- Do one class first, learn the rhythm, then batch the rest

#### Risk 7: Scope creep on the Go tool
**Description:** Building a full-featured ETL tool in Go takes longer than expected.

**Likelihood:** Medium — content parsers have a lot of edge cases.

**Mitigation:**
- Phase 1 is scoped to markdown output only (the minimum viable pipeline)
- JSON, YAML, linked, DSE are all deferred to Phase 2
- Each phase is independently valuable — if Phase 2 stalls, Phase 1 output is already usable
- Content parsers are incrementally addable — start with the big five, add the rest in Phase 2

### Low Severity

#### Risk 8: Multi-book pipeline complexity
**Description:** Heroes and Monsters have different content structures, making a generic pipeline harder than expected.

**Likelihood:** Low — the annotation + content parser architecture is inherently modular.

**Mitigation:**
- Monsters have different content types (statblocks vs. abilities) but the parser registry pattern handles this naturally
- Phase 5 is dedicated to proving multi-book works

#### Risk 9: MkDocs SCC URL integration
**Description:** MkDocs may have difficulty with the SCC-based directory structure (dots in path components, deep nesting).

**Likelihood:** Low — MkDocs handles arbitrary directory structures.

**Mitigation:**
- Test with a small prototype site before committing to the full URL scheme
- MkDocs plugins (awesome-nav, redirects) can handle edge cases
- Worst case: use a build step that maps SCC paths to MkDocs-friendly paths

---

## Success Criteria

### Phase 0 Complete
- [ ] Annotation spec is documented with examples
- [ ] SCC classification scheme is redesigned and verified with sample URLs
- [ ] `Draw Steel Heroes.md` is fully annotated
- [ ] `pipeline.yaml` config file exists

### Phase 1 Complete
- [ ] `steel-etl gen` produces per-section markdown files with correct frontmatter
- [ ] Output diffs cleanly against current `data-rules-md` (expected differences are intentional improvements)
- [ ] SCC codes are stable across repeated runs
- [ ] 80%+ test coverage on core modules
- [ ] The tool runs in <30 seconds for the full Heroes book

### Phase 2 Complete
- [ ] All output formats (md, json, yaml) and variants (linked, dse) are generated
- [ ] The current `data-gen` ETL is fully replaceable by `steel-etl`
- [ ] `scc-to-path.json` covers all content items

### Phase 3 Complete
- [ ] At least one translated language is live (or build is verified, awaiting content)
- [ ] v2 website uses SCC-based permanent URLs
- [ ] v2 build pipeline has no sed/perl/regex link manipulation

### Phase 4 Complete
- [ ] Data repos consolidated from 15 to ~3
- [ ] SCC specification is published
- [ ] Homebrew content spec is documented
- [ ] Old repos have deprecation notices

### Phase 5 Complete
- [ ] Monsters book is processed through the same pipeline
- [ ] Multi-book aggregation works correctly
- [ ] Cross-book SCC references resolve

### Overall Project Success
- [ ] Zero consumer breakage during migration (draw-steel-elements, external tools, MCDM VTT)
- [ ] Translation teams can contribute via documented workflow
- [ ] Adding a new book requires only: annotate markdown + add to pipeline.yaml
- [ ] SCC codes are immutable and universally resolvable
- [ ] The tool is a single `go install` away for any contributor

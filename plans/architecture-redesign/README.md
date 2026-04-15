# Steel Compendium Architecture Redesign

**Date:** 2026-04-12
**Status:** Phases 1-2 complete (validated 2026-04-14). Phase 3: 3.1-3.5 done, 3.6 deferred (awaiting translated content). SDK schema alignment complete (all 4 phases, 2026-04-14).

## Overview

This plan redesigns the Steel Compendium data pipeline from a fragile justfile/bash/embedded-Python ETL system into a Go CLI tool (`steel-etl`) that processes annotated markdown input and produces structured, multi-format output. The redesign also introduces SCC-based permanent URLs, translation support, data repo consolidation, and a homebrew content registry.

## Reading Guide

| Document | Purpose |
|----------|---------|
| [decisions.md](decisions.md) | All architectural decisions made and their rationale |
| [current-architecture.md](current-architecture.md) | How the system works today (for reference during migration) |
| [target-architecture.md](target-architecture.md) | The target system design |
| [annotation-spec.md](annotation-spec.md) | Annotated markdown format specification |
| [content-parsers.md](content-parsers.md) | Content parser registry and what each parser extracts |
| [context-stack.md](context-stack.md) | Hierarchical annotation context stack design |
| [scc-url-design.md](scc-url-design.md) | SCC classification as permanent URL scheme |
| [go-project-structure.md](go-project-structure.md) | `steel-etl` Go CLI project layout and module design |
| [pipeline-config.md](pipeline-config.md) | Pipeline configuration file spec |
| [phases.md](phases.md) | Phased implementation plan with all steps |
| [risks.md](risks.md) | Risks, mitigations, and success criteria |
| [../sdk-schema-alignment/](../sdk-schema-alignment/) | SDK schema alignment plan (JSON/YAML output conformance) |

## Motivation

The current system has outgrown its original scope:

- **Fragile ETL**: 27+ justfile modules with embedded Python, XPath extraction, sed/perl text manipulation. Hard to test, debug, or extend.
- **Metadata is disconnected from content**: YAML config files define XPath selectors that reach into HTML to extract sections. When content structure changes, XPaths break silently.
- **No translation support**: Translation teams are nearly done with the first language and need to be able to contribute.
- **URL instability**: File hierarchy changes break shared links.
- **15 data repos**: Maintenance burden, no locale support.
- **No homebrew path**: Community and 3rd-party content has no standard way to integrate.
- **MCDM VTT integration**: MCDM wants to consume the data directly.

## Key Principles

1. **Metadata travels with content** -- Annotations live in the markdown, not in separate config files
2. **Convention over configuration** -- Content parsers auto-extract data from structured markdown; explicit annotations only for edge cases
3. **SCC is the universal identifier** -- Permanent URLs, cross-references, translation links, homebrew registration all use SCC
4. **One tool, one pass** -- No HTML roundtrip; annotated markdown goes in, structured output comes out
5. **Backward compatible migration** -- Existing consumers continue to work during the transition

# Link Generation Design

## Problem

The 28K-line input document (`Draw Steel Heroes.md`) has almost no cross-references — just 2 scc: links out of 1,432 classifiable sections. Links need to be added for ~391 top-level linkable terms across all type categories. The challenge is contextual disambiguation: many game terms (e.g., "Criminal") are also ordinary English words.

## Decisions

- **AI-driven, not scripted.** Contextual judgment is required to distinguish game mechanic references from ordinary language. No auto-linker.
- **One type at a time.** Each pass focuses on a single link-target type (conditions, classes, careers, etc.). Reduces false positives, easier to review.
- **One chapter at a time.** Each chapter (~1-5K lines) is processed per type pass. Reviewable chunks with granular progress tracking.
- **Reusable artifacts.** A reference table and linking guide live in the repo so any future session can follow the same process.
- **Flag uncertainty.** The AI wraps uncertain links in `<!-- REVIEW: -->` markers for human review.

## Artifacts

### Reference Table (`steel-etl/docs/linking-reference.md`)

Generated from `classification.json`. Organized by type. Each entry includes display name, variant forms, and SCC code.

```markdown
## Careers
| Display Name | Variants | SCC Code |
|-------------|----------|----------|
| Criminal | criminals | mcdm.heroes.v1/career/criminal |
| Mage's Apprentice | mage's apprentices | mcdm.heroes.v1/career/mages-apprentice |
| Dragon Knight | dragon knights | mcdm.heroes.v1/ancestry/dragon-knight |
```

- **Display Name**: human-readable form (un-hyphenated, title-cased from the slug)
- **Variants**: plurals and known alternate forms (irregular plurals listed explicitly)
- **Matching**: case-insensitive; possessives handled by AI (not listed as variants)
- **Regenerable**: can be regenerated from `classification.json` anytime

### Linking Guide (`steel-etl/docs/linking-guide.md`)

Hand-authored rules, workflow instructions, and progress matrix. Any AI session can pick this up and execute a linking pass.

## Linking Rules

### Link when

- The term refers to the game mechanic (the career, the class, the condition, etc.)
- All instances — density filtering happens in the pipeline, not at authoring time
- Bolded terms that reference game mechanics (e.g., glossary entries like `**Criminal:** a career choice...`)
- Terms inside nested child sections of their own definition (e.g., "Fury" referenced inside a Fury ability — when extracted, the ability needs the link back)

### Don't link when

- The term is used as ordinary English ("fighting criminals" is not the Criminal career)
- The term appears in its own section heading (the `## Fury` heading itself doesn't need a self-link)

### Pre-existing links

- **First pass: strip all pre-existing links** before adding scc: links. Old scc: links from previous iterations and PDF-origin links are stale. Start clean.
- **Future passes: preserve scc: links.** When re-running after a PDF update, the guide instructs the AI to preserve existing scc: links and only add new ones. This is a configurable instruction in the linking guide, not a code change.

### Uncertainty marker

When the AI isn't sure whether a term is a game reference or flavor text:

```markdown
<!-- REVIEW: is this a game reference? -->[Criminal](scc:mcdm.heroes.v1/career/criminal)<!-- /REVIEW -->
```

Grep for `<!-- REVIEW:` to find all flagged cases.

## Progress Tracking

A chapter x type matrix in the linking guide tracks completion:

| Chapter | Strip Links | Conditions | Classes | Ancestries | Kits | Careers | Perks | Complications | Titles | Treasures | Chapters | Skills |
|---------|------------|-----------|---------|-----------|------|---------|-------|--------------|--------|-----------|----------|--------|
| Introduction | - | - | - | - | - | - | - | - | - | - | - | - |
| The Basics | - | - | - | - | - | - | - | - | - | - | - | - |
| ... | | | | | | | | | | | | |

Cell values: `-` (not started), `done` (complete), `N/A` (no terms of this type in this chapter).

The "Strip Links" column is the pre-linking cleanup step, done before any type passes begin for each chapter.

## Workflow

### Setup (once)

1. Generate the reference table from `classification.json`
2. Write the linking guide with rules, progress matrix, and step-by-step instructions

### Per-chapter, per-type execution

1. Open the linking guide — find the next uncompleted cell in the matrix
2. Read the chapter text from the input doc (identified by line ranges between `<!-- @type: chapter -->` markers)
3. If this is the first type pass for this chapter, strip all pre-existing links first and mark the "Strip Links" cell done
4. Feed the AI: chapter text + reference table for the current type + linking rules
5. AI returns the chapter text with scc: links added and `<!-- REVIEW: -->` markers on uncertain cases
6. Replace the chapter text in the input doc
7. Review the diff — resolve any `<!-- REVIEW: -->` markers
8. Update the progress matrix cell to `done`
9. Commit (one commit per chapter)

### Validation

After all passes complete, run the pipeline:

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml'
```

- Check for WARN messages (unresolved links = typos or missing registry entries)
- Spot-check output pages in the linked output

## Scope

### In scope
- Reference table generation from `classification.json`
- Linking guide document with rules, matrix, and workflow
- Executing the linking passes (AI-driven, chapter-by-chapter, type-by-type)

### Out of scope
- Auto-linker tooling in steel-etl (decided against in the cross-linking design spec)
- Linking the monsters book (not yet classified)
- Pipeline changes (already complete — LinkMode filtering is implemented)

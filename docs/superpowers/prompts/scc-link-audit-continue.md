# Continue SCC Link Audit — New Type Linking

## What this is

We're adding SCC cross-reference links for 5 new content types (conditions, skills, movement, negotiation, culture) to `steel-etl/input/heroes/Draw Steel Heroes.md`. The registry changes and doc updates are already done — this is the chapter-by-chapter linking pass.

## Before you start

Read these files in order:

1. **Plan:** `/home/vexa/.claude/plans/peppy-hopping-koala.md` — Full plan with completion status, disambiguation patterns, and per-chapter progress
2. **Linking rules:** `steel-etl/docs/linking-guide.md` — Rules for when to link vs. not link, mundane disambiguation examples, progress matrix
3. **Reference table:** `steel-etl/docs/linking-reference.md` — All 416 linkable terms with display names, variants, and SCC codes (scroll to the bottom for the new types: Conditions, Skills, Movement, Negotiation, Culture)

## Current state

- **Parts 1-3 complete:** Docs updated, 22 duplicate codes cleaned, 104 new codes added to `classification.json` (1,581 total). All tests pass.
- **Part 4 in progress:** 7 of 18 chapters linked. 100 new links added (41 condition, 31 movement, 14 skill, 0 negotiation, 18 culture).

**Chapters done:** Introduction, The Basics, Making a Hero, Ancestries, Background, Cultures, Careers

**Next chapter:** Classes (lines 4066-17606). This is the largest chapter with ~416 condition mentions alone. Work through it class by class (Censor 4552, Conduit 6005, Elementalist 7793, Fury 9343, Null 10926, Shadow 12210, Tactician 13487, Talent 14641, Troubadour 16179).

## Critical rules

1. **AI evaluation only** — do NOT use scripted regex. Each instance must be evaluated for mundane vs. game-mechanic usage.
2. **Link when** the term refers to the game mechanic: "the target is dazed", "can't be made slowed", "using the Climb skill", "forced movement distance"
3. **Don't link when** the term is ordinary English: "she grabbed the sword", "prone to errors", "hide behind a barrel", "the frightened villagers"
4. **Don't link** terms in their own section heading or inside `<!-- @type: ... -->` annotations
5. **Link ALL game-mechanic instances** — density filtering is handled by the pipeline at build time
6. **Use `<!-- REVIEW: -->` markers** when uncertain whether a term is a game reference

## After each chapter

Update the progress matrix in `steel-etl/docs/linking-guide.md` with the count of new links per type. After all chapters are done, run pipeline validation:

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep WARN
devbox run -- bash -c 'cd steel-etl && go test ./... -race'
```

## Link format

```markdown
[Display Text](scc:mcdm.heroes.v1/type/item)
```

Examples:
- `the target is [dazed](scc:mcdm.heroes.v1/condition/dazed)`
- `[forced movement](scc:mcdm.heroes.v1/movement/forced-movement) distance`
- `the [Intimidate](scc:mcdm.heroes.v1/skill/intimidate) skill`
- `a [nomadic](scc:mcdm.heroes.v1/culture/nomadic) culture`
- `the [benevolence](scc:mcdm.heroes.v1/negotiation/benevolence) motivation`

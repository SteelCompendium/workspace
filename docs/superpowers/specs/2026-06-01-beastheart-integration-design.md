# Beastheart Integration — Design

**Date:** 2026-06-01
**Status:** Approved design, pre-implementation
**Scope:** Integrate the *Draw Steel: Beastheart* supplement into `steel-etl`, publish it on the v2 site, and emit it in all alternate formats (json/yaml/dse) the way `data-rules` is.

## Goal

Take the first-pass marker-pdf conversion of the Beastheart rulebook and carry it all the way
through the existing pipeline: cleaned & annotated source → `steel-etl gen` (md/json/yaml + linked/dse
variants) → live pages on the v2 site, with working SCC permalinks and cross-reference links.

## Source material

- **Converted markdown:** `steel-etl/input/beastheart/Draw Steel Beastheart.md` (3,049 lines, raw
  marker-pdf output). Currently exists *only* on the stale `origin/beastheart` branch.
- **Ground-truth PDF:** `/home/vexa/Downloads/Draw_Steel_Beastheart_v1.0.pdf` (~41 pages).
  **This PDF MUST NEVER be committed to any git repository.** It lives outside the repo tree; if it is
  ever copied in, a `.gitignore` guard must exclude it. It is used only as a read-only reference during
  cleanup (Claude can read PDF pages directly via the Read tool).

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Book identity | New book `mcdm.beastheart.v1` → its own output dir `data/data-beastheart` | Matches the standalone PDF product; clean SCC provenance. Browse pages interleave by type, so the class still appears under Classes. |
| Companion modeling | Reuse existing SCC types; encode species in the type-path | No new parser/type, no registry-type churn; species identity captured structurally (e.g. `feature.trait.companion.bear.level-3`). |
| Species injection | New annotation field `@companion: <species>` | Explicit and robust vs. inferring from heading hierarchy; matches existing `@id`/`@level` style. |
| Content scope | Keep all rules **plus** the "Beastheart & The Faeries" fiction; strip credits, TOC, license | User wants the fiction retained as flavor; credits/TOC/license carry no reader value. |
| PDF verification | PDF is ground truth; cross-checked section-by-section during cleanup | Highest fidelity; marker-pdf mangled headers, ability icons, and tables. |
| Sequencing | Vertical slice first (one species end-to-end), then replicate | De-risks the novel parts (companion path encoding, new-book wiring, multi-book site ingestion) before the bulk annotation effort. |

## The content (entities in the book)

- **The class** — Beastheart, a "master class" (like the summoner). Shares action economy between hero
  and beast.
- **Wild Nature archetypes** (subclasses): Guardian, Prowler, Punisher, Spark. Modeled as
  `feature.trait.beastheart.level-1/<archetype>` (consistent with how heroes models subclasses, e.g.
  the censor order as `feature.trait.censor.level-1/censor-order`). Each grants maneuvers, triggered
  actions, and leveled abilities.
- **14 companion species:** Basilisk, Bear, Boar, Condor, Deinonychus, Drake, Elemental Spark, Gummy
  Ball, Hellhound, Lightbender, Panther, Spider, Sporeling, Wolf. Each is a package: one signature
  ability, passive trait(s), and advancement features at levels 3/6/10.
- **Core mechanics:** Companion rules, Heart of the Beast, Ferocity (heroic resource), Rampage.
- **Beastheart abilities** by Ferocity cost: signature, 3, 5, 7, 9, 11.
- **Rewards:** Trinkets (by echelon), Leveled Treasures (armor + weapon).
- **Perks:** Exploration, Intrigue, Interpersonal.
- **Fiction:** "The Beastheart & The Faeries" novella.

## SCC encoding model

The classifier joins the type-path with `.` at arbitrary depth (`internal/scc/classifier.go`), so extra
species segments are grammatically valid and resolve like any other code.

| Book content | Type | Example SCC |
|---|---|---|
| Species signature ability (Bear's *Backhand*) | `ability` | `mcdm.beastheart.v1/feature.ability.companion.bear.level-1/backhand` |
| Species passive trait (*Strong Like Bear*) | `feature` (trait) | `mcdm.beastheart.v1/feature.trait.companion.bear.level-1/strong-like-bear` |
| Level 3/6/10 advancement (*Foe Thresher*) | `feature` (trait) | `mcdm.beastheart.v1/feature.trait.companion.bear.level-3/foe-thresher` |
| The species as a whole (*Bear*) | `feature-group` | `mcdm.beastheart.v1/feature-group.companion/bear` |
| Wild Nature archetype (*Guardian*) | `feature` (trait) | `mcdm.beastheart.v1/feature.trait.beastheart.level-1/guardian` |
| Beastheart heroic ability (*Pushover*, 3 Ferocity) | `ability` | `mcdm.beastheart.v1/feature.ability.beastheart.level-1/pushover` |
| The class | `class` | `mcdm.beastheart.v1/class/beastheart` |

**Implementation note (resolve in plan):** the `companion.<species>` segments must be injected into the
type-path the pipeline builds for each section. The mechanism is the `@companion: <species>` annotation,
read by the parser/classifier and inserted into the type-path between the subtype and the `level-N`
segment. Exact wiring (which parser stage reads the field and splices the path) is a phase-4 task.

## Source cleanup plan (PDF-verified)

**Strip:** credits/contractors/playtesters, Table of Contents, Creator License.
**Keep & clean:** everything from `THE BEASTHEART CLASS` through Perks, **plus** the fiction novella
(retained as a `@type: chapter` flavor page).

Cleanup operations, each cross-checked against the PDF:
- Normalize inconsistent header levels — marker-pdf emitted peers as a random mix of `##`/`###`/`####`.
- Recover ability-type icons that became stray glyphs (`®`, `\*`, `t`, `l`, `e`, `g` prefixes). Map each
  glyph to its real action type (main action / maneuver / triggered action / etc.) against the PDF.
- Reflow power-roll tables and the species/maneuver matrix tables that marker flattened.
- Remove `<span id="page-N-0">` page anchors and `®`/`£` art markers.

## Pipeline & output integration

Add to `steel-etl/pipeline.yaml` under `books:`:

```yaml
- book: mcdm.beastheart.v1
  input: ./input/beastheart/Draw Steel Beastheart.md
  output:
    base_dir: ../data/data-beastheart
```

Source frontmatter:

```yaml
---
book: mcdm.beastheart.v1
source: MCDM
title: Draw Steel Beastheart
---
```

All formats (md/json/yaml), variants (linked/dse/dse-linked), and the stripped distribution copy are
produced by the existing generators with no new code — this satisfies the "alternate forms like
data-rules" requirement automatically.

**Sub-decisions (default = yes):**
- Feed beastheart into `data-unified` aggregation: **yes** (unified browsing).
- Feed beastheart into the `scc_api` output: **yes** — required for beastheart SCC cross-reference links
  to resolve site-wide.
- `data/data-beastheart` is an output **directory** for now (the existing `data/*` targets are plain
  dirs, not nested git repos). Whether it later becomes a standalone GitHub repo is a separate,
  out-of-scope call.

## Site publishing

`v2/site.yaml` currently reads a single `source_dir: ../data/data-rules/en/md-linked`, and the bestiary
book is not yet on the site — so **multi-book site ingestion does not exist yet** and is the main new
capability this work builds.

**Approach:** extend the site builder (`steel-etl/internal/site/`) and `site.yaml` to accept a **list**
of source dirs (e.g. `source_dirs:`), merging each book's `md-linked` output into the type-organized
`Browse/` tree. Beastheart's class/abilities/companions interleave by type automatically; SCC permalink
stubs and indexes already key off frontmatter/SCC, so they extend without special-casing. The fiction
chapter is placed in the `Read/` book-order section. This capability is reusable — it is also what the
eventual bestiary book will need.

## Phased implementation (vertical slice first)

1. **Salvage** — new branch off current `main`; bring over only
   `input/beastheart/Draw Steel Beastheart.md`. Discard the stale `origin/beastheart` branch and its
   stray committed `docs/Browse/*` files.
2. **Slice cleanup** — PDF-verified cleanup of the core class + **Wolf** species + the fiction chapter
   only.
3. **Slice annotation** — frontmatter + `@type` tags + `@companion: wolf` on that slice.
4. **Slice integration** — wire the book into `pipeline.yaml`; implement the `@companion` type-path
   injection; run `gen`; confirm SCC codes (incl. `feature.*.companion.wolf.*`) and json/yaml/dse output.
5. **Slice publish** — build multi-`source_dir` site support; confirm a live Wolf page and a working SCC
   permalink. **← de-risking milestone; integration is proven on minimal content here.**
6. **Replicate** — clean + annotate the remaining 13 species and all other sections; regenerate.
7. **Polish** — `steel-etl validate --scc-stable`; add SCC cross-reference links per
   `steel-etl/docs/linking-guide.md`; review indexes/nav; full `just deploy`.

## Testing & validation

- Go unit tests for the `@companion` type-path injection and any site-builder multi-source changes
  (table-driven, `-race`), per repo testing conventions.
- `steel-etl validate` — annotation coverage, no unknown types, SCC stability after the registry settles.
- Conformance: beastheart json/yaml round-trips like the heroes book.
- Manual: live site spot-check of a companion page, an ability statblock, and an SCC permalink redirect.

## Out of scope

- Creating a standalone `data-beastheart` GitHub repo (kept as a local output dir for now).
- The summoner class (the other master class) — not part of this work.
- Any change to how the heroes book is modeled.

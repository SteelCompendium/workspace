# Book-text search gap-fill + rule pages (SC-329) — design

**Ticket:** SC-329 "Add movement clarity to compendium". A reader could not find the
Heroes p. 267 movement rule ("move freely through an ally's space … can't stop moving in
any other creature's space … unless that creature's size is two or more sizes greater or
smaller") anywhere in the compendium, under neither Size nor Movement.

**Status:** design approved by Scott in conversation 2026-09-23 (Part A and Part B, incl.
the Part B code list and ids). Implementation plan follows this spec's review:
`docs/superpowers/plans/2026-09-23-book-search-gap-fill.md`.

## Diagnosis (measured)

- The rule is on the site — `Read/heroes/combat.md`, under `### Movement` — but that
  heading carries no `@type` annotation, so no Browse page contains it, and `v2/site.yaml`
  sets `search_exclude: [Read]`, so search never sees it.
- It is a class of gap, not a one-off. Walking each book source and attributing every prose
  line to its nearest annotated (non-chapter) ancestor heading, **~17% of book prose
  (97k of 583k words) has no Browse page**:

  | Book | Prose words | In no Browse page |
  |---|---|---|
  | Heroes | 299,645 | 67,252 (22.4%) |
  | Monsters | 228,314 | 19,682 (8.6%) |
  | Summoner | 34,978 | 6,177 (17.7%) |
  | Beastheart | 19,976 | 3,612 (18.1%) |

  Most of it is Director guidance, chapter intros, and worked examples (e.g. *For the
  Director* alone is 25.7k words), but real at-the-table rules fall through too:
  Movement (+ Can't Exceed Speed, Can't Cut Corners), Hide and Sneak, Assist a Test, End
  of Combat, Stacking Unique Effects, Ending Effects, Making Arguments, NPC Response and
  Offer.

## Decision

Two complementary parts; both approved.

- **Part A — search gap-fill:** index the Read (book) sections that no Browse page covers,
  and only those. Fixes the whole class: every word of every book becomes findable, with
  no duplicate results.
- **Part B — rule pages:** mint `rule.*` codes for ten high-value Heroes rules sections, so
  they get Browse pages, permalinks, SCC API entries and inbound links.

Rejected — **a "Search Browse / Search full books" scope toggle** (the ticket's original
idea):

1. Discoverability: the reporter's failure mode was *not knowing the rule exists*; a
   default-off scope hides exactly that content from exactly those users.
2. Duplicates: with it on, nearly every Browse hit repeats as a Read hit (the reason Read
   was excluded in the first place).
3. Payload: indexing whole books roughly doubles `search_index.json` (5.4 MB raw /
   ~1.07 MB gzipped today).
4. UI: Material's search panel has no scope-filter affordance; SC-306 deliberately
   replaced only the worker and kept Material's UI.

With Part A there is nothing for a toggle to reveal: uncovered book text is already in the
default results, and covered book text is already represented by its Browse page.

## Part A — search gap-fill

### Coverage rule

A heading on a Read page is **covered** when it, or any ancestor heading on that page,
carries a `data-scc` code that is **represented in Browse**. A code is represented in Browse
when it is the `scc:` frontmatter value of a page under `docs/Browse/`, or the `data-scc`
attribute of a heading on such a page. (A Browse page's body is `RenderSubtree` of the
coded section — `steel-etl/AGENTS.md` "Book-faithful pages" — so a covered heading's whole
subtree is already indexed in Browse; `rule.combat/condition` is the precedent: its page
holds every condition.)

Everything that is not covered is indexed: uncovered headings and their text, including
the chapter intro under the chapter's H1 (`# Combat {.sc-chtitle}` carries no `data-scc`).

Consequences, by design:

- A code with no Browse page (e.g. the `feature/trait/ancestry-traits` subtree excluded in
  `site.yaml`, or `chapter/*` codes, whose pages *are* the Read pages) stays searchable in
  Read — the rule never opens a new hole.
- When Part B (or any later annotation work) gives a section a Browse page, its Read copy
  drops out of the index automatically on the next build. No config to keep in sync.
- An uncovered heading that has covered children (e.g. `### Movement` today, whose
  `#### Shifting` / `##### Walk` … are coded) indexes only its own text: Material's index
  opens a new section at every heading, so the children's text belongs to their own
  (excluded) sections.

### Mechanism (steel-etl site builder, `internal/site`)

- **Config.** `site.yaml` replaces `search_exclude: [Read]` with
  `search_uncovered_only: [Read]` (new `Config.SearchUncoveredOnly []string`).
  `search_exclude` stays supported (whole-section exclusion) but is no longer used by v2.
- **Browse code set.** Walk `docs/Browse/**.md` once, after all generation passes and
  before static content is copied (the slot `applySearchExclusion` occupies today,
  `build.go` ~L231), collecting every `scc:` frontmatter value and every heading
  `data-scc` value — the same walk-and-parse pattern as `generateSCCStubs`
  (`permalinks.go`).
- **Marking.** For each `.md` under a `search_uncovered_only` section, scan ATX headings
  (skipping fenced code), maintain an outline stack by heading level, and for every covered
  heading add the attribute `data-search-exclude=""` to its attr_list: append inside an
  existing trailing `{…}` (`#### Walk {data-scc="…" data-search-exclude=""}`) or add a new
  `{data-search-exclude=""}`. Every covered heading is marked, not only the subtree root,
  because each heading is its own index section. The explicit `=""` form avoids depending
  on attr_list's bare-key parsing.
- **Frontmatter.** Read pages no longer receive `search: exclude: true`. They receive no
  `search: boost:` either (type `chapter` is unmapped in `searchBoostByType`, so default
  1); update the `search_boost.go` header comment, which currently says Read pages get
  `search: exclude` later.
- **Why heading-level exclusion is safe.** Verified in Material 9.7's parser
  (`material/plugins/search/plugin.py`): `Section.is_excluded()` reads
  `data-search-exclude` from the section's own heading element, and the whole section is
  dropped at `add_entry_from_context`. The tag-name-keyed skip set that forced the
  `<address>` wrapper for cards (`markSearchExcluded`, `embed_cards.go`) cannot misfire
  here: headings never nest, so the heading's own close tag removes it from the skip set.
  Embedded cards on Read pages keep their existing `<address data-search-exclude>` wrap.

### Ranking and result labels (v2 search worker)

- Read sections rank at the default boost (1), below `rule` / `movement` / `condition`
  pages (3), so a Browse page wins any tie with book text.
- Book results are labeled with their book, because chapter titles collide across books
  (every book has an "Introduction"). In `sc-search-core.js`, when building a result group
  whose page location starts with `Read/<folder>/`, the page-level doc's title becomes
  `<chapter title> · <book label>` (e.g. "Combat · Draw Steel: Heroes"); section rows keep
  their own titles. Display-only: the index is untouched.
- The folder → label table lives in `sc-search-core.js`, mirroring `site.yaml` `books:`
  (`heroes`, `beastheart`, `summoner`, `bestiary`). A `node:test` case parses
  `v2/site.yaml` and fails if the two disagree. An unknown folder falls back to the bare
  chapter title.

### Payload budget

Expected growth ≈ +97k words ≈ +15% on `search_index.json`. Measure on a real build and
record raw + gzipped sizes on the ticket. If growth exceeds +30%, stop and revisit before
shipping.

## Part B — rule pages (Heroes)

Annotate these headings in `steel-etl/input/heroes/Draw Steel Heroes.md` with
`<!-- @type: rule | @group: <group> | @id: <id> -->` (the existing rule annotation form).
Each code's Browse page is its full section subtree, like `rule.combat/condition`.

| Heading (source line at time of writing) | Code | Section covers |
|---|---|---|
| `### Movement` (L21518) | `mcdm.heroes.v1/rule.combat/movement` | moving through spaces (the reported rule), Can't Exceed Speed, Can't Cut Corners, plus the already-coded Shifting / Movement Types / Falling / terrain / Forced Movement subsections |
| `### Hide and Sneak` (L21196) | `mcdm.heroes.v1/rule.test/hide-and-sneak` | Hiding, Searching for Hidden Creatures, Sneaking |
| `### Assist a Test` (L21184) | `mcdm.heroes.v1/rule.test/assist-a-test` | |
| `### End of Combat` (L22145) | `mcdm.heroes.v1/rule.combat/end-of-combat` | How Combat Ends, Dramatic Finish, Event Ending |
| `#### Stacking Unique Effects` (L4581) | `mcdm.heroes.v1/rule.combat/stacking-effects` | |
| `#### Ending Effects` (L4589) | `mcdm.heroes.v1/rule.combat/ending-effects` | |
| `#### Roll Against Multiple Creatures` (L4551) | `mcdm.heroes.v1/rule.dice/multiple-targets` | |
| `### Making Arguments` (L22498) | `mcdm.heroes.v1/rule.negotiation/argument` | Appeal to Motivation, No Motivation or Pitfall, Caught in a Lie, Renown and Negotiation |
| `### NPC Response and Offer` (L22585) | `mcdm.heroes.v1/rule.negotiation/offer` | Interest 5 … Interest 0 |
| `### Opening a Negotiation` (L22453) | `mcdm.heroes.v1/rule.negotiation/opening` | Stop Combat, Start Negotiation; Starting Stats |

All ten ids are collision-free against the current registry (checked 2026-09-23). Codes
are permanent once deployed (permalinks + SCC API keys); `classification.freeze` keeps
existing codes unchanged and `steel-etl validate --scc-stable` must pass.

### Linking

Retarget the book's existing explicit cross-references to the new codes — no
book-wide headword sweep:

- "(see Hide and Sneak in Chapter 9: Tests)" / "See Hide and Sneak in Chapter 9: Tests" —
  four occurrences (source L15608 Scan, L17130 Second Album, L21875 the Hide maneuver,
  L21907 the Search for Hidden Creatures maneuver): link
  "Hide and Sneak" to `rule.test/hide-and-sneak`, keeping the chapter link.
- "See Making Arguments below" (L22284): link "Making Arguments" to
  `rule.negotiation/argument`.

`steel-etl/docs/rule-term-mapping.md`: "Movement" row → `new-rule`
`rule.combat/movement` (was a `reuse` of `movement/walk`, flagged there as a judgment
call); "Argument" row → `new-rule` `rule.negotiation/argument` (the row's "no standalone
heading" note is wrong — `### Making Arguments` exists).

### Deferred to a Backlog ticket (search-only via Part A meanwhile)

When to Make a Test, Heroes Make Tests, Applying Skills; Rewards › Treasures rules
(Found/Wearing/Wielding), Titles rules, Rewards › Wealth (overlaps the existing
`rule.resource/wealth` anchor); Actions Within Actions, "During the Move", Straight Line;
D3s/D100s; Milestone Advancement; Optional Rule: Losing Equipment; and every
Beastheart / Summoner / Monsters gap. Note for that ticket: `## Treasures` and `## Titles`
cannot be the anchors — a code there would absorb the whole treasure / title catalog — so
those need narrower sub-headings.

## Verification

- **Go unit tests** (`internal/site`): covered root heading; covered descendant of a coded
  ancestor; uncovered heading with coded children (only the parent stays indexed); code
  with no Browse page stays indexed; code present only as a Browse heading `data-scc`
  counts as covered; attr_list append vs. new-block; fenced code skipped; Read frontmatter
  carries no `search:` key.
- **search-bench** (`v2/tests/search/bench.cjs`), new named cases:
  - "move through an ally's space" → `Browse/rule/combat/movement/` in the top 3 (after
    Part B).
  - An uncovered book section is found, e.g. "your first session" →
    `Read/heroes/making-a-hero/#your-first-session` in the top 3.
  - No-duplicate guard: exact titles of covered Read headings ("can't cut corners",
    "size and space") return no `Read/` location in the top 10 — a leaked copy would
    rank near the top on its exact title, so the guard cannot pass by accident.
  - All existing named cases and the `--gate` sweep threshold still pass.
- **Node test** for the book-label table ↔ `site.yaml` sync.
- `steel-etl validate --scc-stable`; `go test ./...`; `just build` + `just search-bench
  --gate` in v2.
- Index size before/after (raw + gzipped) recorded on SC-329.
- Screenshots on SC-329 per `linear-flow`: the search panel for the reporter's query
  before/after, and the new Movement rule page.

## Docs to update

- `ARCHITECTURE.md` — search coverage of Read (was "Read excluded").
- `steel-etl/AGENTS.md` — "search exclusion for Read pages" → uncovered-only indexing.
- `v2/site.yaml` comment for the new key; v2 `.repo-docs` search ADR
  (`decisions/2026-09-06-custom-search-worker.md`) — Read results + book labels.
- `docs/scc-log.md` (dated entry), `docs/scc-reference.md`, workspace `AGENTS.md` SCC
  summary count (3,086 → 3,096; heroes 1,952 → 1,962).
- `steel-etl/docs/rule-term-mapping.md` (two rows above).
- `CHANGELOG.md` `## Unreleased`: book text is now searchable; new rule pages.

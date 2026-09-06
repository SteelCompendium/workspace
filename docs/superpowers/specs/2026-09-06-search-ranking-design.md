# Search ranking fix (SC-306) — design

**Ticket:** SC-306 "Better Compendium Search". Users report that typing an item's exact
name buries it in the results.

**Status:** approved by Scott 2026-09-06 (paths A + B together). Plan:
`docs/superpowers/plans/2026-09-06-search-ranking.md`.

## Diagnosis (measured, not guessed)

Method: the production `search_index.json` (5.8 MB, 5,401 docs / 3,531 pages) was
replayed offline through the site's own mkdocs-material 9.7.6 search worker
(`assets/javascripts/workers/search.*.min.js`, run under Node with a `postMessage`
shim). 500 pages with a unique title were queried by their exact title.

| Exact title typed | #1 | #2–3 | #4–10 | >10 |
|---|---|---|---|---|
| 500 unique-title Browse pages | 52% | 26% | 19% | 4% |
| class abilities (`feature/ability/*`, n=100) | 45% | | | |
| class features (`feature/<class>/level-N/*`) | ~10% | | | |

Four root causes:

1. **Card headings pollute section titles.** Card heads render the item name as an
   id-less `<h3 class="sc-head__slot …">` (statblock heads: `<h2>`). Material's index
   parser (`material/plugins/search/plugin.py`) compares context elements **by tag
   name only** (`Element.__eq__`), so once a section has been opened by an
   id-bearing `<h3>`, every later id-less `<h3>` on the page is treated as "inside the
   section heading" and its text is appended to the section **title**. On the Fury
   class page that yields a section titled
   `Fury AbilitiesFury AbilitiesSignature AbilityBrutal SlamHit and Run…`; on
   statblock pages `Demon Lord's AspectGrasping AppendagesWarping Strike…`. Title is
   weighted 1000× and class pages carry `search.boost: 4`, so "Brutal Slam" returns
   the Fury class page above the Brutal Slam page. Biggest single lever.
2. **Every query term gets a trailing wildcard** (hard-wired in the worker's query
   transform, not configurable). "Fog of War" ranks the class *Ward* sections 1–5;
   "Goblin Warrior" loses to "Warrior Priest"; "Hide" loses to "Hidey-Hole".
3. **OR semantics, no exact-match bonus.** A page matching one rare word in its title
   outranks the page whose title is the whole phrase.
4. **Boost policy backfires on monsters** (statblock 0.6, dynamic-terrain 0.7): "Goblin
   Warrior" ranks #3, "Rival Fury" #4. Stop-word removal reduces titles like
   "To the Death!" / "There For Each Other" to one word or nothing.

## Decision

Two parts, shipped together:

- **A — fix the index inputs (steel-etl).** Stop container pages from re-indexing the
  cards they embed; give nested feature cards real ids so they become proper index
  sections; drop the sub-1 boosts. Fixes causes 1 and 4. Shrinks the index.
- **B — replace the search worker (v2 only).** Keep Material's UI and index; swap the
  worker script for our own (MiniSearch-based) that ranks exact title first, requires
  all terms, prefixes only the last term, keeps stop words, and boosts per page.
  Fixes causes 2 and 3 (and 1/4 defensively).

Rejected: Algolia DocSearch (third-party, eligibility doubtful for game content);
`indexing: titles` (loses body search); forking Material's worker source (TS build
chain; MiniSearch is 30 KB and gives the needed knobs directly). A purpose-built
entity search (typeahead + facets, the empty Bestiary "Search & Filter" tab) remains
the long-term direction and may subsume B later — file as a follow-up ticket.

## Part A — index inputs (steel-etl `internal/site`)

1. **Embedded cards are excluded from the index.** Material's search parser
   (`material/plugins/search/plugin.py`) tracks `data-search-exclude` elements in a
   set keyed by **tag name only**, so an attribute placed on a card's own
   `<div>`/`<section>`/`<article>` root stops excluding at the first nested close of
   that same tag — a card containing another element of its own root tag reopens
   indexing partway through. `spliceCards` (embed_cards.go) instead wraps each
   spliced leaf card in `<address class="sc-embed" data-search-exclude="">…</address>`:
   `address` never otherwise occurs inside a card, so the tag-name key is unique and
   the whole subtree is reliably skipped. (`address` is block-level under
   python-markdown, carries no Material styling, and is a generic-container ARIA
   role, so it's inert besides the exclusion — v2 CSS neutralizes it further:
   `.sc-embed { display: contents; font-style: inherit; }`.) The leaf page already
   indexes that card. Only the `{data-scc}` branch is wrapped; the `{data-sb-inline}`
   branch (unclassified statblocks with no leaf) stays indexed.
2. **Nested feature cards get ids.** `cardHeadSlots` gains `NameID string`; when
   set, the name slot renders `id="…"`. Only nested feature cards set it: statblock
   features (`renderStatblockFeature`, `sbFeature.ID`) and featureblock features
   (`renderFbFeat`, `fbFeature.ID`). Id = `sc-feat-<slugify(name)>`, deduped within
   one block by a `-2`, `-3` suffix. Top-level card heads stay id-less (the page H1
   already owns the title; an id there would produce a duplicate "Brutal Slam /
   Brutal Slam" pair in results). `spliceCards` strips `id="sc-feat-…"` from spliced
   copies so container pages that embed several blocks don't carry duplicate DOM ids.
3. **Boost table:** delete the `statblock` 0.6, `featureblock` 0.6, `dynamic-terrain`
   0.7 entries (default boost 1). `class` stays 4 — with B, exact-title ties are
   broken by boost, so "fury" still finds the class first.

Acceptance (A alone, measured with the bench in B against the Material worker on a
local build): unique-title exact query ranks #1 **75.4%** (class abilities 85/100,
embed pollution 0 — verified with Material's own parser). The remaining misses are
lunr's trailing-wildcard / OR / stop-word behaviour (causes 2–3), which Part B
replaces.

## Part B — custom search worker (v2)

**Hook.** Material reads its runtime config from `<script id="__config">` when
`bundle.*.js` executes. `overrides/main.html` overrides `{% block scripts %}` to run a
3-line inline script *before* `{{ super() }}` that rewrites the `search` field of
that JSON to `{{ 'javascripts/sc-search-worker.js' | url }}`. No copy of Material's
config block; survives Material upgrades unless the `__config` contract changes.

**Protocol** (must match the bundle, verified against 9.7.6):

| Direction | Message |
|---|---|
| main → worker | `{type: 0, data: {config, docs, options: {suggest: bool}}}` — `docs` is the parsed `search_index.json` |
| worker → main | `{type: 1}` when ready |
| main → worker | `{type: 2, data: "<query string>"}` |
| worker → main | `{type: 3, data: {items: Doc[][], suggest?: string[]}}` |

`Doc = {location, title, text, tags?, score, terms: {[term]: boolean}}`. `title` and
`text` carry `<mark>…</mark>` highlights; `text` is a ~320-char snippet. `items` is an
array of **groups**, one per page, sorted by group score; each group is sorted by
score descending and must contain the page-level doc (location without `#`),
inserted with `score: 0` if it did not match. The client shows the page doc as the
article, members with score equal to the group's top score inline, and the rest
under "more". `suggest` is an array of index terms; the client uses its **last**
element as the completion for the last typed token if it starts with that token.

**Files.**

- `docs/javascripts/vendor/minisearch.min.js` — MiniSearch 7.2.0 UMD (MIT), banner
  comment like the other vendored file.
- `docs/javascripts/sc-search-core.js` — pure UMD module (node:test-able):
  `createEngine(MiniSearch, docs) → {search(query, {suggest}) → {items, suggest?}}`
  plus exported helpers `normalize`, `tokenize`, `titleTier`, `snippet`, `highlight`.
- `docs/javascripts/sc-search-worker.js` — `importScripts` the two above, handles the
  4 message types, nothing else.
- `overrides/main.html` — the `scripts` block override.
- `tests/sc-search-core.test.js` — ranking rules on an inline fixture.
- `tests/search/bench.cjs` — engine-agnostic replay harness (works for Material's
  worker and ours): exact-title sweep + named regression queries; non-zero exit on
  threshold failure. `just search-bench` wraps it.
- `tests/e2e/search.e2e.cjs` — browser check of three queries through the real UI.

**Ranking rules (core).**

1. Tokenize query and fields with MiniSearch's default tokenizer (`\p{Z}\p{P}` split;
   "Muse's" → `muse`, `s`); `processTerm` lowercases, strips diacritics, and strips a
   plural `s` (len > 3, not `ss`). **No stop-word removal.**
2. Search fields `title` (boost 8) and `text` (1), `combineWith: "AND"`, `prefix` on
   the **last** term only, `fuzzy` off, `boostDocument` = the doc's `boost` (default 1)
   **for root docs only** (`location` without `#`) — heading-anchor sections use 1.
   steel-etl stamps `boost` on every chunk of a page, but applying it to section docs
   too let a boosted class page's empty `{data-scc}` heading section tie the
   exact-title tier with the real leaf page and win on boost; restricting it to the
   root doc keeps the boost a page-level tie-breaker only. If AND yields nothing,
   retry with OR so the user still sees something; `terms` then flags the missing
   words (client renders them struck through).
3. Final score = MiniSearch score × title tier: **100** if `normalize(title) ==
   normalize(query)`, **10** if the title starts with the query, **3** if every query
   term occurs in the title, else **1**. Ties fall to the page boost via MiniSearch.
4. Group by page (`location.split('#')[0]`), group score = max member, cap at 300
   groups.
5. Highlight: wrap each query term (whole-word, prefix for the last term) in
   `<mark>` in `title`; `text` snippet = tags stripped, 320 chars starting 64 chars
   before the first match (or from 0), with the same marks.
6. Suggest (when `options.suggest`): from the top group's best doc, the first title
   token that starts with the last query token, returned as `[token]`; else `[]`.

**Acceptance (bench on a local build, A + B):**

- Unique-title exact query ranks #1 ≥ 95%; class abilities ≥ 95%.
- Named queries, expected #1 page: `fury` → `Browse/class/fury/`; `brutal slam` →
  `…/fury/level-1/brutal-slam/`; `goblin warrior` → `Browse/monster/goblin/goblin-warrior/`;
  `fog of war` → `…/tactician/level-2/fog-of-war/`; `to the death` →
  `…/fury/level-1/to-the-death/`; `free strike` → `…/feature/common/main-actions/free-strike/`
  (SC-179); `hide` → `Browse/skill/intrigue/hide/` or `…/feature/common/maneuvers/hide/`
  within the top 2; `knockback` → `…/feature/ability/common/knockback/` top 2.
- Worker ready in < 3 s on the full index in a desktop browser (MiniSearch indexes
  ~5k docs well under that); query latency not user-visible.

## Results (2026-09-06)

Measured on the built v2 index (7,936 docs), replaying the exact-title sweep and the
8 named regression queries from Part B:

| | Unique-title #1 | Class abilities #1 | Named queries #1 |
|---|---|---|---|
| Production baseline (Material's stock worker, live index) | 51.8% | 46/100 | — |
| A alone (Material's worker, rebuilt index) | 75.4% | 85/100 | — |
| A + B (custom worker) | **98.2%** | **100/100** | 8/8 |

Worker setup ~1.6 s on 7,936 docs; index 5.80 MB (production 5.85 MB).

## Docs to update (part of "done")

- `steel-etl/docs/site-builder.md`: search_boost table; embed exclusion + id stripping;
  nested feature ids.
- `v2/.repo-docs/architecture.md`: search section + scripts table; new ADR
  `v2/.repo-docs/decisions/2026-09-06-custom-search-worker.md` (+ README index row).
- `v2/.repo-docs/troubleshooting.md`: "search broken after a Material upgrade →
  re-verify the worker protocol / `__config.search` hook; run `just search-bench`".
- Workspace `CHANGELOG.md` → `## Unreleased`.
- SC-306: post the before/after bench numbers.

# SCC change log

Dated history of changes to the SCC scheme, registry, and linking conventions.
**Append a dated entry here whenever the scheme/registry/linking rules change, and
update the short current-state summary in `CLAUDE.md` → "SCC" at the same time.**
CLAUDE.md states only what is true *now*; how it got that way lives here. Entries are
chronological (oldest first); each links to the plan/spec doc that has the full detail.

Current state, spec, and linking rules: `CLAUDE.md` → "SCC",
`reference/scc-specification.md`, `steel-etl/docs/linking-guide.md`.

## 2026-05-29 — `project` and `god` types added

Added during the truncated-link fix: 16 downtime projects and 9 individual gods got
flat `project/<id>` / `god/<id>` codes. Group headings ("Saints of Hell", etc.) were
adjudicated as containers and skipped. See
`steel-etl/docs/superpowers/plans/2026-05-29-truncated-link-fix.md`.

## 2026-06-04 — treasure hierarchy

Treasures reorganized into a `treasure/<tier>/<category>/<item>` hierarchy via the
non-code-producing `treasure-group` container. See
`steel-etl/docs/superpowers/plans/2026-06-04-treasure-hierarchy.md`.

## 2026-06-05 — Monsters book integrated

The Monsters book (`mcdm.monsters.v1`, 591 codes) added a nested
`monster/<category>/statblock/<item>` hierarchy (malice featureblocks as siblings of
the `statblock/` folder), plus `dynamic-terrain` and `retainer` types. See
`steel-etl/docs/superpowers/plans/2026-06-05-monsters-book.md`.

## 2026-06-06 — named feature-groups can contribute a path segment

A named feature-group can now contribute a path segment under a class/ancestry (not
just `common.*`) — used to group the fury's "Stormwight Kits" framework features
instead of dangling them at the class root. See
`steel-etl/docs/superpowers/plans/2026-06-06-link-audit-and-fury-grouping.md`.

## 2026-06-07 — grouped `rule.<group>/<term>` type

Added so every Draw Steel rules/glossary term is linkable: 109 codes (108 +
`rule.test/test-difficulty`, minted 2026-06-08 to close a Phase-3 annotation gap)
across 12 groups (`dice`, `character`, `health`, `resource`, `combat`, `damage`,
`test`, `downtime`, `negotiation`, `treasure`, `world`, `general`), each anchored to
the rules section that defines the term (e.g. `rule.combat/flanking` → `### Flanking`).
Every term's decision (new-rule / reuse-existing / skip) is recorded in
`steel-etl/docs/rule-term-mapping.md`; plan:
`steel-etl/docs/superpowers/plans/2026-06-07-rule-glossary-scc-linking.md`.

## 2026-06-07 — feature/ability/trait taxonomy settled (breaking)

`feature` is the umbrella, an `ability` is a feature with combat rigor
(`feature.ability.<entity>…`), and `trait` was **narrowed** to its rulebook homes —
ancestry traits + monster statblock passives (`feature.trait.<entity>…`) — while every
other non-ability feature (class/domain/college/kit/companion) became a plain `feature`
with the trait segment dropped from its code (`feature.<entity>…`, hub-and-spoke).
`feature_type` has three values (`ability`/`trait`/`feature`); `kit` and `companion`
are not trait homes. See
`steel-etl/docs/superpowers/specs/2026-06-07-feature-taxonomy-design.md` + its
implementation plan.

## 2026-06-08 — skills nested under their five groups

`skill/<item>` → grouped `skill.<group>/<item>`
(crafting/exploration/interpersonal/intrigue/lore), with each group a linkable
self-named-leaf landing page `skill.<group>/<group>` emitted by the new `skill-group`
container parser (landing shape superseded 2026-06-09, below). The `skill/` Browse root
renders `.sc-folder` group cards and each group a `.sc-card` grid. See
`steel-etl/docs/superpowers/plans/2026-06-08-skill-groups-nesting.md`.

## 2026-06-08 — heroes in-prose link sweeps complete

The heroes source reached ~17,527 SCC cross-reference links (12,381 to `rule.*`):
conditions, skills, movement types, negotiation motivations, culture benefits, combat
actions/maneuvers/free strikes, heroic resources, the full Introduction glossary, the
in-prose `rule.*` sweep across the whole document body, and the **forced-movement
subtype sweep** — every mechanical `push`/`pull`/`slide` instance links to
`movement/forced-movement` (the subtypes reuse that one code), skipping only
mundane/narrative/flavor-tagline uses, the section's own definition, and
already-linked glossary headwords. `creature`/`ability`/`target`/`ally`/`enemy` and
`damage` were linked conservatively (defining-sentence anchors only);
`side`/`line`/`wall`/`ground` deliberately left unlinked as low-yield
mundane-dominated words. The earlier combat-mechanic + ability-sweep tail and the
`rule.*` sweep were tracked as follow-ups, both archived in
`docs/followups-archive/2026-06-08-completed.md`. Rules:
`steel-etl/docs/linking-guide.md`; all 582 linkable terms:
`steel-etl/docs/linking-reference.md`.

## 2026-06-09 — skill-group landing-page in-prose sweep

Linked every prose reference to a skill group's landing page: multi-group "crafting or
exploration skill groups"-style phrases (each named group linked, the shared trailing
"skill group(s)" left plain) and "the <group> group" shorthand forms; skipped only the
five `##### <Group> Skills` definition paragraphs (self-ref) and generic "any/other
skill groups". 164 links, repointed to `skill.group/<g>` the same day (next entry).

## 2026-06-09 — group landings unified to `<type>.group/<member>`

`skill.group/<group>` and `monster.group/<category>` replaced the self-named-leaf form
(`skill.<g>/<g>`, `monster.<cat>/<cat>`). 56 codes re-minted (5 skill + 51 monster);
skill-leaf and statblock codes unchanged; the 164 in-prose skill-group links
repointed. Site-side the landing is relocated to its group index
(`<root>/group/<member>.md` → `<root>/<member>/index.md`), with only the intro lore
folded above the listing. See
`steel-etl/docs/superpowers/plans/2026-06-09-group-landing-scc-migration.md`.

## 2026-06-09 — SCC scheme versioned (spec v1.1)

Codes may carry an optional `scc.vN:` prefix (bare `scc:` ≡ implicit `scc.v1`); the
registry records a `scheme_version` (default `1`, distinct from the registry-file
`version`), surfaced in the published SCC API (`docs/api/v1/{index,scc,types}.json`
top-level + per-entry `resolve/*.json`); and a reserved non-identity **format** axis
(`#format` qualifier / HTTP `Accept` / `?format=`) lets the same entity be fetched as
md/json/yaml/dse-md without changing its identity or cache key. The `steel-etl`
resolver recognizes + normalizes both the prefix and `#format`, and **refuses to
resolve a non-current scheme version** against the current registry (a future
`scc.v2:` can never silently bind to v1 content). Spec changes are tracked in the
Revision History in `reference/scc-specification.md` §9. Restamping existing bare
`scc:` links to explicit `scc.v1:` is deferred (`FOLLOWUPS.md` #4), as are the
`/scc.v1/` website URL alias and the HTTP format entry point. Design + plan:
`steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md`,
`…/plans/2026-06-09-scc-scheme-versioning.md`.

## 2026-06-10 — bestiary trees moved into Browse; Bestiary tab repurposed

`monster/`, `dynamic-terrain/`, `retainer/` moved from the Bestiary tab into Browse
(high-fantasy-steel cards: `.sc-folder` roots, group landings with
Malice/Tactical-Stance featureblock cards + echelon-grouped statblock preview cards,
via `steel-etl/internal/site/bestiary_cards.go`) — **presentation/URL only, no SCC
re-mint**. The Bestiary tab became a Search & Filter utility for Directors (shipped
2026-06-10; see `docs/roadmap-archive/2026-06-11-completed.md`, was ROADMAP #7).
Wiring the bestiary pages into the in-prose link sweep is deferred (`FOLLOWUPS.md`
#5). See `steel-etl/docs/superpowers/specs/2026-06-10-bestiary-restructure-and-search-design.md`
+ `…/plans/2026-06-10-bestiary-restructure.md`.

## 2026-06-10 — Summoner book integrated

`mcdm.summoner.v1` (~221 codes) — the first book converted from PDF via the
fidelity-gated pipeline (`steel-etl/tools/pdf-extract/`; see
`steel-etl/docs/superpowers/plans/2026-06-09-summoner-ai-pdf-conversion.md`). Its
statblocks reuse the monsters-book machinery (`@type: monster-group` context →
`@type: statblock`), yielding `minion.<portfolio>.statblock/<id>`,
`fixture.<portfolio>.statblock/<id>`, `champion.<portfolio>.statblock/<id>`
(demon/elemental/fey/undead), `retainer.summoner.statblock/<id>`, and
echelon-versioned `rival.summoner.<echelon>.statblock/<id>`. Statblock parsing needed
no Go changes, but the bestiary site routing was generalized from monster-only to all
statblock roots (`isBestiaryGroupDir`/`usesFolderIndex`/`hoistStatblockPath`);
summoner creatures are marked "Summoner · <label>" on their cards (scc-derived), and
the mixed `retainer/` root renders monster retainer cards + a `Summoner` subgroup
folder card. Class/treasure/title content reuses the heroes patterns
(`feature.summoner.*`, `treasure.<echelon>.<type>/*`, `title/*`). Details:
`steel-etl/CLAUDE.md` → "Monsters book".

## 2026-06-11 — Summoner book fully link-swept

1,464 inline `scc:` links (1,292 cross-book to Heroes, 172 internal) — the first book
whose **statblocks** were linked. Required hardening the shared statblock parser
(`steel-etl/internal/content/statblock_parse.go`) against link-wrapping first
(dice-title `roll` link-stripped, tier/effect values kept verbatim). The
high-frequency relational nouns `enemy`/`ally`/`creature` are linked only at defining
anchors (matching the Heroes book's ~2–3 total) while `adjacent`/`strike` are linked
freely; ability keyword *tags* are never linked. See
`steel-etl/docs/superpowers/plans/2026-06-10-summoner-content-linking.md` and the
2026-06-11 note in `steel-etl/docs/linking-guide.md`.

## 2026-06-11 — PDF printing ≠ SCC version (settled)

The `.v1` in a source segment is the SCC *namespace* version (bumps only for a
breaking redefinition, e.g. a true 2nd Edition), never the errata printing — changing
`book:` to e.g. `mcdm.heroes.v1_01b` re-mints every heroes code and dangles ~19k links
(tried and reverted 2026-06-11). The source printing lives in non-identity `printing:`
frontmatter on the input doc (currently inert); wiring it as a build stamp (registry →
API → pages) and the removal/tombstone code-lifecycle model are deferred — see
`ROADMAP.md` #6 ("Printing provenance stamp + SCC code lifecycle") and
`steel-etl/docs/superpowers/specs/2026-06-11-printing-provenance-and-code-lifecycle-design.md`.

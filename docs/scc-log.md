# SCC change log

Dated history of changes to the SCC scheme, registry, and linking conventions.
**Append a dated entry here whenever the scheme/registry/linking rules change, and
update the current-state detail in [`scc-reference.md`](scc-reference.md) (plus the short
summary in `CLAUDE.md` → "SCC") at the same time.** Those state what is true *now*; how it
got that way lives here. Entries are chronological (oldest first); each links to the
plan/spec doc that has the full detail.

Current state, spec, and linking rules: [`scc-reference.md`](scc-reference.md),
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
`scc:` links to explicit `scc.v1:` was deferred (`FOLLOWUPS.md` #4 — **done
2026-06-18**, see below), as are the `/scc.v1/` website URL alias and the HTTP format
entry point. Design + plan:
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
`scc-reference.md` → "Printing provenance & code lifecycle" and
`steel-etl/docs/superpowers/specs/2026-06-11-printing-provenance-and-code-lifecycle-design.md`.

## 2026-06-11 — Printing provenance stamp shipped

The `printing:` frontmatter now flows as a non-identity build stamp: registry
`books` map (`classification.json`) → SCC API (`index.json`/`scc.json` top-level
`books`, per-entry `printing` in `resolve/*.json`) → site page frontmatter
(`printing`/`printing_book`, injected by the site builder's final
`applyPrintingStamps` pass when `v2/site.yaml` sets `registry:`) → a muted
"Source: Heroes · printing 1.01b" line rendered by the v2 content partial.
Initially only heroes (1,916 pages) carried a `printing:`; books without the
field are skipped. The `heroes-printing-1.01b` git tag marks the source; the
ingest convention (update frontmatter → edit content → tag
`<book>-printing-<version>`) lives in `steel-etl/CLAUDE.md`. No SCC identity
changes (`validate --scc-stable` clean). Plan:
`steel-etl/docs/superpowers/plans/2026-06-11-printing-provenance-stamp.md`;
site mechanics: `steel-etl/docs/site-builder.md`. The tombstone lifecycle half
remains deferred — settled design, no longer tracked as backlog (see
`scc-reference.md` → "Printing provenance & code lifecycle").

**2026-06-12 follow-up:** the remaining three books got their printings —
**monsters 1.01, beastheart 1.0, summoner 1.0** (tags `monsters-printing-1.01`,
`beastheart-printing-1.0`, `summoner-printing-1.0`). All **2,956** pages are now
stamped. Note the provenance line uses each book's *site label* (`books[].label`
in `v2/site.yaml`), so the Monsters book reads "Source: **Bestiary** · printing
1.01"; summoner-sourced creatures in the `monster/` browse tree correctly read
"Summoner", since the stamp keys off the page's own `scc:` book prefix, not its
directory.

## 2026-06-12 — Book display labels set to official names

Renamed all four `books[].label` values in `v2/site.yaml` to MCDM's official book
names: **Draw Steel: Heroes**, **Draw Steel: Monsters** (was "Bestiary"), **The
Beastheart**, **The Summoner**. Display-only — the labels drive the Read-tab book
cards and the printing-provenance footer (so the Monsters book now reads "Source:
Draw Steel: Monsters · printing 1.01"), nothing else. URL folders are unchanged
(`folder: bestiary` etc. stay), so no links, bookmarks, or SCC permalinks moved;
no SCC identity change (`validate --scc-stable` clean). Labels with a colon are
quoted in YAML (an unquoted `Draw Steel: Monsters` parses as a mapping). The
**Bestiary** Search & Filter tab is a separate utility and keeps its name.

## 2026-06-12 — Monsters book link sweep + rule-glossary

The Monsters book (`mcdm.monsters.v1`) was fully link-swept (FOLLOWUPS #5 direction 1):
**5,948 inline `scc:` links** added across `input/monsters/Draw Steel Monsters.md`
(4,759 cross-book to Heroes, 1,189 internal), covering Monster Basics, all ~50 creature
groups (lore + malice featureblocks + ~480 statblocks), Dynamic Terrain, and Retainers.

**New rule-glossary (registry 591 → 632, +41).** The Monster Basics chapter had no rule
codes of its own, so its pervasive vocabulary was minted first as `rule.<group>/<term>`
codes (via `@type: rule` heading annotations): **`rule.monster/*`** (9 — malice,
encounter-value, creature-free-strike, monster-trait, end-effect, villain-action, keyword,
squad, captain), **`rule.organization/*`** (6 — minion, horde, platoon, elite, leader,
solo), **`rule.role/*`** (9 creature roles), **`rule.keyword/*`** (17 general creature
keywords). Terms with an existing Heroes target (Signature Ability, conditions, movement,
characteristics, …) link cross-book rather than minting a duplicate. Decision record:
`steel-etl/docs/monster-rule-mapping.md`; term tables: `steel-etl/docs/monsters-linking-reference.md`.

**Statblock parser hardened** so links can live in the source without corrupting structured
data: `sbPowerRollRe` (labeled `**Power Roll + N:**` header), the title `name`/`cost`/
`ability_type` split (a markdown link's own `)` otherwise breaks the cost-paren regex), and
`stripBold` for the ability-table cells (`keywords`/`usage`/`distance`/`target`) all strip
link markup; effect/tier VALUES keep their links verbatim. `validate --scc-stable` clean
(additions only, no existing code changed). Plan + full detail:
`steel-etl/docs/superpowers/plans/2026-06-12-monsters-content-linking.md`. Remaining FOLLOWUPS
#5 half = direction 2 (links *into* monster pages from the other books).

## 2026-06-13 — Companion SCC restructure (Featureblock Plan 5a)

Beastheart companions moved out of the `feature-group.companion/*` namespace into the
`monster.companion.beastheart.*` family, mirroring the Monsters-book Rivals
(`monster.rivals.<echelon>.statblock/<id>`) — the prerequisite for minting embeddable
companion advancement-features entities (Plan 5b). A `beastheart` class subgroup segment
was inserted throughout. **85 codes re-pathed, clean 1:1** (registry total unchanged at 2997):

- container (×14): `feature-group.companion/wolf` → `monster.companion.beastheart.statblock/wolf`
- feature (×57): `feature.companion.wolf.level-N/<id>` → `feature.companion.beastheart.wolf.level-N/<id>`
- ability (×14): `feature.ability.companion.wolf.level-1/<id>` → `feature.ability.companion.beastheart.wolf.level-1/<id>`

Classifier-only change (`internal/content/feature.go` container + feature branches,
`ability.go` ability branch — a class segment appended only when non-empty so non-class
contexts never emit a double-dot path; `classID` resolves to `beastheart` from the
`## Beastheart` class ancestor). The companion still renders as a feature-group page
(`fm["type"]` unchanged) — the `.statblock` kind is an identity-only change for now
(spec §5). 13 inbound `scc:` links re-swept in the beastheart source. `freeze: false`,
so the registry rebuilt clean. Spec + full design:
`docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`;
plan: `docs/superpowers/plans/2026-06-13-companion-scc-restructure.md`. Next: Plan 5b
(companion advancement featureblocks), 5c (fixtures), 5d (docs/deploy); Plan 6 (retainers).

## 2026-06-14 — Companion advancement featureblocks (Featureblock Plan 5b)

Minted **14 `monster.companion.beastheart.advancement-features/<species>`** featureblock
container codes (registry 2997 → 3011). Per companion the three context-only
`##### Level N <C> Advancement Feature` separators were replaced by one
`##### <C> Advancement Features` header (`@type: featureblock`) and each advancement
feature's `@level: N` moved onto its own annotation — so the Level-3/6/10 features keep
their **unchanged** `feature.companion.beastheart.<species>.level-N/<id>` codes (level now
read from the feature's own annotation; the pipeline pushes a section's annotation before
its parser runs and `Lookup` includes the section level). `FeatureblockParser` gained a
companion branch (`internal/content/monster.go`): when companion context is present it
classifies as `monster.companion.<class>.advancement-features/<species>` and embeds the
child `@type:feature` sections as `features[]` (render-only; the children stay separately
coded) via the new `collectChildFeatures`. The standalone entity page renders as a Forged
Band card (`buildFeatureblockPage` + `.fb__band--adv` level bands). `type: featureblock`
validates against the existing `featureblock.schema.json` (no schema change). Compositing
the card onto the companion *statblock* page is deferred to the entity-embedding effort
(ROADMAP). Plan: `docs/superpowers/plans/2026-06-13-companion-advancement-featureblocks.md`.

## 2026-06-14 — Summoner fixtures → `monster.fixture.*` featureblocks (Featureblock Plan 5c)

Restructured the **4 Summoner fixtures** out of the `fixture.<element>.statblock/<id>`
statblock family into the `monster.fixture.<element>.*` featureblock family, parallel to
the companion 5a/5b scheme. Per fixture: a base **`monster.fixture.<element>.featureblock/<id>`**
(`type: featureblock`) + a sibling **`monster.fixture.<element>.advancement-features/<id>`**
holding the Level-5/9 tiers (net **+4** codes: 4 base re-pathed, 4 advancement new, 4 old
`fixture.*.statblock` removed; registry 3011 → 3015). `StatblockParser` returns early as a
featureblock when `@domain == fixture` (base stats via `fixtureStats` → loose `stats[]`,
base features via `ParseRichFeatures`); the advancement tiers were **source-split** into a
sibling `@type: featureblock | @id: <fixture-id>` section parsed by a new `FeatureblockParser`
fixture branch. **Zero inbound `scc:` links to fixtures**, `freeze: false` → clean rebuild,
nothing dangled. Site: **Plan 3's `internal/site/fixture_page.go` adapter retired** (fixtures
render through the shared `buildFeatureblockPage`; its `fbFeaturesFromRich` helper moved to
`featureblock_page.go`); `hoistStatblockPath` drops the non-leaf `featureblock/` segment
(fixture-scoped) so the base sits at `Browse/monster/fixture/<element>/<id>`; `bestiaryItemType`
re-includes the base as a searchable **`"fixture"`** facet (advancement-features excluded).
Plan: `docs/superpowers/plans/2026-06-14-fixture-featureblock-restructure.md`. Shipped on
`steel-etl@feat/companion-scc-restructure` (not yet merged/deployed — Plan 5d). Next: Plan 5d
(deploy), Plan 6 (retainers).

## 2026-06-14 — Advancement-features Browse flatten (companions + fixtures, nav-only)

**No SCC change** — Browse-navigation only. The advancement-features pages for beastheart
companions and summoner fixtures now **flatten** to a sibling of their base entity in the
v2 Browse tree: `…/advancement-features/<id>` → `…/<id>-advancement-features` (e.g.
`Browse/monster/companion/beastheart/wolf-advancement-features`,
`Browse/monster/fixture/demon/the-boil-advancement-features`), instead of nesting in an
`advancement-features/` sub-folder. The group index pairs each base card with its
advancement card on one row. SCC **codes are unchanged** (`…advancement-features/<id>`
kept; registry stays 3015) and the `/scc/…advancement-features/<id>/` permalink stub still
exists — now redirecting to the flattened page. This is the same deliberate **code≠path**
divergence as `hoistStatblockPath`: implemented as `flattenAdvancementFeaturesPath`
(`internal/site/build.go`, wired into the dest-path + `rewriteSectionLinks` mirror) +
`buildAdvancementPairContent` (`internal/site/advancement_pairs.go`, the 2-up
`.sc-cards--pairs` grid) + a `.sc-cards--pairs` CSS rule in v2. Spec + plan:
`steel-etl/docs/superpowers/specs/2026-06-14-advancement-features-nav-flatten-design.md`,
`steel-etl/docs/superpowers/plans/2026-06-14-advancement-features-nav-flatten.md`.

## 2026-06-14 — Featureblock structured-field `scc:` links now resolve at gen (FOLLOWUPS #9 fix)

**Linking fix, no scheme/registry change.** Featureblock / dynamic-terrain / malice (and
the new companion-advancement + fixture) pages were rendering **119** broken
`href="…scc:mcdm…"` cross-reference links in `v2/docs/Browse/` (want 0): the gen-time
link-resolution pass left raw `scc:` links in the **structured frontmatter fields** those
pages read (`features[]` bodies, power-roll `tiers`, `stats[].value`, `enhancements[].text`,
`sections[].text`), and `featureblock_page.go`'s `richInline`→`cardHref` prepended `../` to
the unresolved target → `../scc:…` (404). Statblock pages were already clean because they
read resolved *body* prose, not frontmatter.

Root cause was a type-switch gap in `internal/scc/resolver.go` `resolveValue`: it recursed
`[]any` / `map[string]any` / `[]string` / `string`, but the featureblock output emits
`features`/`stats`/`sections`/`enhancements` as **`[]map[string]any`** (`RichFeatureMaps`)
and power-roll `tiers` as **`map[string]string`** (`RichFeature.ToMap`) — both hit `default`
and passed through untouched. Added the two missing cases (no new resolve pass; fixes every
consumer of `md-linked`, incl. DSE). Post-fix: broken Browse `scc:` hrefs 119 → 0, raw `scc:`
in all `md-linked` output → 0, statblock islands unchanged at 0. Guard:
`TestResolverResolveFrontmatterTypedMapSlice` (`internal/scc/resolver_test.go`). Was
workspace FOLLOWUPS #9.

## 2026-06-15 — Summoner minions/champions/rivals → `monster.*` family

Re-minted the Summoner book's three remaining special-statblock families out of their
standalone domain roots into the `monster.*` family, completing the consolidation begun
for companions/fixtures (Plans 5a–5c). These are **plain statblocks** (no
featureblock/advancement-features machinery) — a domain-root re-mint only. `freeze:false`,
only **2 inbound `scc:` links** (both in the summoner source) repointed, registry count
unchanged (same entities, new codes; `gen --all` self-pruned the old roots).

Old → new codes:

- minion `minion.<portfolio>.statblock/<id>` → **`monster.minion.summoner.<portfolio>.statblock/<id>`**
- champion `champion.<portfolio>.statblock/<id>` → **`monster.champion.summoner.<portfolio>.statblock/<id>`**
- rival NPC `rival.summoner.<echelon>.statblock/<id>` → **`monster.rivals.<echelon>.statblock/<id>`**
  (the Rival Summoner now sits *beside* the Monsters-book rivals — same type path, distinguished
  only by `mcdm.summoner.v1` source + id; e.g. `rival-summoner` lands in the same echelon folder
  as `rival-fury`)
- rival summons `rival.summoner.<echelon>.statblock/<id>` → **`monster.rivals.<echelon>.summoner.minion/<id>`**
  (the source `@category: summoner` is dropped; echelon-scoped, so recurring names like
  `skeleton` stay distinct per echelon)

Implementation: Go-side mapping in `StatblockParser` (`internal/content/monster.go`,
`switch domain`), parallel to the existing `@domain: fixture` special-case; the `summoner`
class segment is hardcoded (these `@domain` values appear only in the Summoner book). Rival
split keys off the parsed `organization` (`Minion` → summons leaf; else → `.statblock` NPC).
Site: removed the dead top-level `minion/`/`champion/`/`rival/`/`fixture/` includes from
`v2/site.yaml` (all route through `monster/` now); extended `isBestiaryGroupDir`
(`internal/site/bestiary_cards.go`) to recognize the deeper `monster/<domain>/summoner/<portfolio>`
group dir so portfolio pages render rich statblock cards (the immediate-parent check missed
the inserted class segment). **Retainers** (`retainer.summoner.*`) are explicitly out of
scope — undecided, owned by the future retainer rework (Plan 6). Spec:
`docs/superpowers/specs/2026-06-14-summoner-statblocks-into-monster-family-design.md`;
plan: `docs/superpowers/plans/2026-06-14-summoner-statblocks-into-monster-family.md`.

## 2026-06-15 — common abilities flattened under `feature.ability.common` (FOLLOWUPS #17)

Common abilities no longer take a feature-group path segment, partly narrowing the
2026-06-06 "named feature-groups can contribute a path segment" rule: that rule still
applies under a **class/ancestry**, but a `@type: ability` sitting in a `common`
feature-group (the Combat chapter's **Maneuvers** / **Free Strikes** groups) now flattens
to `feature.ability.common/<id>` instead of `feature.ability.common.<group>/<id>` — we
don't sub-group common abilities the way class trees do. Five codes changed (freeze was
off, **zero inbound `scc:` links**, so no link churn):

- `feature.ability.common.maneuvers/{grab,knockback,escape-grab}` → `feature.ability.common/{…}`
- `feature.ability.common.free-strikes/{melee,ranged}-weapon-free-strike-combat` → **removed**

The two combat-chapter free strikes were duplicates of the canonical character-creation
`feature.ability.common/{melee,ranged}-weapon-free-strike`; their `@type: ability`
annotations were dropped (now bold-labeled tables) so they render inline in the Combat
Read page but mint no duplicate page/SCC code. Side effects: the
`feature/ability/common/` Browse landing became a pure parent-of-leaves and now renders
preview cards (no render-code change), and a `Stike` → `Strike` typo was fixed.
Implementation: `internal/content/ability.go` (common branch drops the group segment),
guard test `TestAbilityParserCommonAbilityUnderFeatureGroupStaysFlat`. This completes the
last open part of FOLLOWUPS #17 (the `god`/`project` card work landed 2026-06-15).

## 2026-06-16 — monster category slugs singularized (pre-freeze re-mint)

The Monsters-book monster-group category segment is now always **singular**
(`monster.goblins.statblock` → `monster.goblin.statblock`, group landing
`monster.group/goblins` → `monster.group/goblin`), matching spec §7.2 and the rest of the
`monster.*` family (`companion`/`fixture`/`minion`/`champion` + portfolios were already
singular). The book's plurality was count-driven (a section was titled plural only because
it happened to print several statblocks) and so unstable for an aggregating compendium;
singular is count-independent. 31 group slugs re-minted: 30 creature families via their
`@category` annotations in `input/monsters/Draw Steel Monsters.md`, plus `rivals → rival`,
which also touched the hardcoded path in `internal/content/monster.go`,
`internal/site/summoner_provenance.go`, and `internal/site/rival_summons.go` (the
Monsters-book rivals tree and the Summoner rival-summoner share it). 18 in-prose
`monster.group/<plural>` cross-reference links were repointed to the singular targets.
Plural names survive only as page **titles**. Registry was `frozen: false`, so this was a
clean re-mint with **no aliases** — the live site's old plural URLs stop resolving. Code
count unchanged (~3,013). Summoner / beastheart / fixture families untouched. Spec + plan:
`docs/superpowers/specs/2026-06-16-monster-category-slug-singularization-design.md`,
`docs/superpowers/plans/2026-06-16-monster-category-slug-singularization.md`.

## 2026-06-17 — `@classify: false` retires the converted-pixie example code

New annotation `@classify: false` (steel-etl): a section so marked is parsed and
rendered in place but never classified — no SCC code, no leaf page, no Browse page,
no Bestiary row. A statblock keeps rendering as an inline `.sb-wrap` card on its
container page (RenderSubtree stamps `{data-sb-inline="true"}`; the v2 `embed_cards`
post-pass builds the card from the inline markdown). Applied to the Summoner book's
**"Pixie Bellringer (Converted)"** minion-conversion example, which the book prints a
second time and which had been doubling up in the Bestiary/Browse as
`mcdm.summoner.v1/monster.statblock/pixie-bellringer-converted`. That code is retired;
registry `frozen: false` so `gen --all` simply stops minting it. Summoner 225 → 224,
total **3,013 → 3,012**. No aliases, no in-prose links pointed at the retired code.
Mechanics: steel-etl/ANNOTATION-GUIDE.md, the @classify: false row (Optional Fields).

## 2026-06-18 — bare `scc:` links restamped to explicit `scc.v1:` (FOLLOWUPS #4)

The deferred restamp from the 2026-06-09 scheme-versioning work (above) is done. All
**25,328** in-prose `scc:` links across the four book sources — heroes (17,528),
monsters (5,948), summoner (1,542), beastheart (310) — were rewritten from bare `scc:`
to the canonical explicit `scc.v1:`. Every occurrence was in markdown-link form
(`](scc:` → `](scc.v1:`); there were zero non-link uses and zero already-prefixed
links, so the sweep was a pure, balanced restamp (12,584 lines, equal insert/delete).
Bare `scc:` remains a permanent implicit-v1 alias, so nothing relying on the old form
breaks; this just makes the canonical form explicit everywhere. `gen --all` after the
sweep resolved cleanly — 3,012 codes across 4 books, **zero** resolver `WARN`s, no raw
`scc.v1:` leaking into the linked output. Still deferred (separate items): the
`/scc.v1/` website URL alias and the HTTP format entry point.

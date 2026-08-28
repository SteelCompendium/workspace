# SCC reference — current state

Deep reference for the **Steel Compendium Classification** system: the current taxonomy,
the entity-family schemes, and linking conventions. This is the "what is true now" detail
that used to bloat `CLAUDE.md`.

- **Spec + revision history:** `reference/scc-specification.md`
- **Dated history** of every scheme/registry/linking change: [`scc-log.md`](scc-log.md)
- **Linking rules:** `steel-etl/docs/linking-guide.md`; all linkable terms:
  `steel-etl/docs/linking-reference.md` (+ per-book `*-linking-reference.md`)

> Keep this file to **current state only**. When the scheme/registry/linking rules change,
> append the dated entry to [`scc-log.md`](scc-log.md) and update the affected section here
> (and the one-paragraph summary in `CLAUDE.md` → "SCC"). Do **not** add "on <date> X
> changed…" sentences here — that history is the log's job.

## What SCC is

Hierarchical classification used across all data repos: `source/type/item`
(e.g. `mcdm.heroes.v1/feature.ability.fury.level-1/gouge`). SCC codes are identifiers used
as website permalinks (`/scc/{code}/`), API keys, and cross-reference links.

Scheme spec is **v1.1**: the `scc.vN:` prefix is optional; bare `scc:` ≡ `scc.v1`. All
in-prose links in the four book sources carry the explicit `scc.v1:` prefix (restamped
2026-06-18, scc-log); bare `scc:` stays a permanent implicit-v1 alias.

### Why the entity's own `scc` field is bare but links are prefixed (don't "fix" this)

An entity's self-identity field is the **bare identity** with no scheme prefix; references
*to* it carry `scc.v1:`. This asymmetry is **intentional** — leave it alone:

```yaml
scc: mcdm.heroes.v1/class/fury                      # identity field — bare
skills:
  - 'gain the [Nature](scc.v1:.../skill.lore/nature) skill'   # reference — prefixed
```
```json
{ "scc": "mcdm.heroes.v1/class/fury", "type": "class" }
```

The two map onto two different axes of the [scheme-versioning design](../steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md):

- The **`scc` field value is the identity** (`source/type/item`) — the frozen cache key.
  The scheme version is *not* part of it.
- The **`scc.v1:` prefix is the reference form.** It "swaps in wherever the `scc` namespace
  token appears" (links, URNs, `/scc.v1/` URLs) because in free prose there is no
  surrounding key to signal "this string is an SCC reference" — the prefix *is* that signal.
  A structured `scc:` key already supplies that context, so its value stays bare.

**Do not rename the field key `scc` → `scc.v1`** (or bake the prefix into the value). The
registry's own precedent is a **sibling** `scheme_version: 1` field (next to `version`), not
a versioned code string or key — per-entity metadata mirrors that. A versioned *key* would
also churn on any future v2 mint (breaking every `data["scc"]` consumer, defeating v1/v2
coexistence) and is an awkward dotted JSON/YAML key (`.scc.v1` reads as nesting). If a
consumer ever genuinely needs scheme version per-record, add an additive sibling
`scheme_version` field (frontmatter + **both** schema copies + the validation allowlist) —
but it's globally `1` and already recorded at the registry / SCC-API top level, so it's
likely just noise. Decided 2026-06-18.

## Registry

3,086 codes across four books (exact as of 2026-08-21):

| Book | Codes |
|------|------:|
| heroes | 1,952 |
| beastheart | 241 |
| monsters | 662 |
| summoner | 231 |

(How each count reached its current value — and which plan moved it — is in
[`scc-log.md`](scc-log.md).)

## Taxonomy

`feature` is the umbrella:

- `feature.ability.<entity>…` — a feature with combat rigor (`ability`).
- `feature.trait.<entity>…` — **narrow**: ancestry traits + monster statblock passives only.
- `feature.<entity>…` — everything else (plain feature; hub-and-spoke).

## Gods & Religion

Gods and saints share a `religion.*` namespace (added 2026-06-18), paralleling `monster.*` /
`rule.*` — a namespace prefix spanning several distinct entity types:

- `religion.god/<id>` — deities (Val, Cavall, Cyrvis, plus the collective `lords-of-hell`).
- `religion.saint/<id>` — the ~28 legendary heroes / saints, **flat** (not nested under
  their god).
- `religion.domain` / `religion.order` / `religion.pantheon` — **reserved**, no entities
  minted (an upcoming MCDM product is expected to expand domains; the codes are kept free).

**Relationships are frontmatter links, never path nesting.** This is the load-bearing rule:
the book places several saints (Pentalion under Nikros, Eseld under Cyrvis, the Saints of
Hell under the Lords of Hell) as document *siblings* of their god, not inside its subtree,
and gods can belong to multiple pantheons — so parentage can't be path-derived. Instead:

- saint frontmatter: `patron` (→`religion.god/<id>`, plain text if none), `domains`, `ancestry`.
- god frontmatter: `domains`, `pantheon`, `alignment` (`good`/`evil`/`devil`), `god_class`
  (`elder`/`younger`/`space`/`devil`).

`domains` values are plain names today (extracted from the `**Domains:**` line); upgrading
them to `religion.domain/<id>` links is a future frontmatter-only follow-up once domain
pages exist. The world-glossary term `rule.world/saint` (the *concept*) is unchanged — it is
distinct from the `religion.saint/<id>` *instances*. Browse groups the tree under a
"Gods & Religion" umbrella (`god` → "Gods", `saint` → "Saints"). Plan:
`docs/superpowers/plans/2026-06-18-gods-religion-scc-buildout.md`.

## Companions (beastheart)

Live in the `monster.companion.beastheart.*` family, mirroring the Monsters-book Rivals:

- container: `monster.companion.beastheart.statblock/<species>`
- members: `feature[.ability].companion.beastheart.<species>.level-N/<id>`
- advancement-features: `monster.companion.beastheart.advancement-features/<species>`

The advancement-features entity embeds its Level-3/6/10 features as a Forged Band card on
its own page; compositing it onto the companion statblock page is pending (entity-embedding
effort — tracked as a Linear Backlog ticket). In Browse the advancement page **flattens** to a sibling of its
companion (`…/beastheart/<species>-advancement-features`, not a sub-folder) and the index
pairs the two on one row (nav-only; SCC code/permalink unchanged —
`flattenAdvancementFeaturesPath` / `buildAdvancementPairContent`).

## Fixtures (summoner)

Mirror the companion scheme:

- base: `monster.fixture.<element>.featureblock/<id>` (`type: featureblock`)
- advancement-features: `monster.fixture.<element>.advancement-features/<id>` (Level-5/9 tiers)
- advancement **members**: `feature.fixture.<element>.<base-id>.level-N/<member-id>` (×12,
  2026-06-19) — each Level-5/9 advancement feature is individually coded with its own leaf
  page, mirroring `feature.companion.*`. Base-inclusive: `size-increase` repeats across all
  four fixtures but lives in four distinct `<element>.<base-id>` namespaces (no collision).

Fixtures render through the shared `buildFeatureblockPage`, sit at
`Browse/monster/fixture/<element>/<id>`, and stay searchable as a `"fixture"` Bestiary
facet (member leaves are `feature` type, excluded from the bestiary). (The old
`fixture_page.go` site adapter was retired.) The advancement page **flattens** to a Browse
sibling (`…/fixture/<element>/<id>-advancement-features`) and pairs with its base on the
element index, same as companions (nav-only; code/permalink unchanged) — **and** its card is
**embedded on the base fixture's page** at build time (`embedFixtureAdvancement` injects the
`{data-scc}` marker the embed_cards post-pass transcludes, since the advancement block is a
parse-sibling of the base). The members keep their faithful `> ⭐️` blockquote form in source;
they are minted as **parser-emitted coded children** (no heading re-leveling / `ContextStack`
change). See `docs/superpowers/specs/2026-06-19-fixture-advancement-coded-members-design.md`.

## Summoner special statblocks

Portfolio minions/champions + the rival summoner live in the `monster.*` family alongside
companions/fixtures — these are plain statblocks, no featureblock machinery:

- minions: `monster.minion.summoner.<portfolio>.statblock/<id>`
- champions: `monster.champion.summoner.<portfolio>.statblock/<id>`, each paired since
  2026-08-08 (SC-138) with a coded **container** sibling
  `monster.champion.summoner.<portfolio>.advancement-features/<id>` (×4) holding the
  Level-10 advancement the book prints inside the stat block. Members stay
  inline/uncoded (the retainer container model, not the fixtures' coded children). The
  page renders through the shared featureblock card, so the members sit under a
  "Level 10 Advancement" band; `embedSiblingAdvancement` also transcludes that card back
  onto the champion's own page. Nav-only flatten as usual
  (`…/advancement-features/<id>` → `…/<id>-advancement-features`), but champion dirs are
  deliberately **excluded** from `buildAdvancementPairContent` — their base is a real
  statblock, so the bestiary group landing gives a richer preview card than the pair grid.

**Heroes-book summon (2026-08-21, SC-180).** The heroes book's one statblock — the
Elementalist's Source of Earth — is `mcdm.heroes.v1/monster.summon.elementalist.statblock/source-of-earth`,
the first `monster.*` code outside the monsters/summoner/beastheart books. `summon` is a
role branch in the established `monster.<role>.<class>` grammar; the source is authored to
the corpus-standard statblock shape right after its Summon Source of Earth ability, and
its Browse page sits at `monster/summon/elementalist/` (statblock segment hoisted). Any
future class-summon statblock (another book's, or an errata's) takes the same shape:
`monster.summon.<class>.statblock/<id>`.

The **Rival Summoner** NPC sits *beside* the Monsters-book rivals:
`monster.rival.<echelon>.statblock/<id>` (same type path — e.g. `rival-summoner` in the
same echelon folder as `rival-fury`). Its summoned creatures are
`monster.rival.<echelon>.summoner.minion.statblock/<id>`.

Go-side mapping lives in `StatblockParser` (`switch domain`, mirroring the `@domain:
fixture` case; the rival split keys off `organization == Minion`); `isBestiaryGroupDir`
recognizes the deeper `monster/<domain>/summoner/<portfolio>` group dir.

**Retainers.** The **Monsters-book** retainers joined the `monster.*` family in Plan 6
(2026-06-18): base `monster.retainer.statblock/<id>` (×21), plus coded **container** siblings
`monster.retainer.advancement-features/<id>` (×21) and `monster.retainer.role-advancement/<role>`
(×9), members inline/uncoded — the same treatment fixtures got (5c). Per-ability coding is
deferred (ROADMAP #15). The **Summoner-book** retainer folded in too (2026-06-21, reversing
Plan 6's "keep top-level") and is modeled like the Rival Summoner: the conjurer **Devil
Detective** is `monster.retainer.statblock/devil-detective` with a shared
`monster.retainer.advancement-features/devil-detective` featureblock; its summons
(Razor/Violent/Gorrre, `organization: Minion`) nest as
`monster.retainer.summoner.minion.statblock/<id>` — off the `Browse/monster/retainer/`
index, surfaced on the detective's page by `augmentSummonerRetainerPages`. So the landing
shows the 21 Monsters-book retainers + Devil Detective (distinguished by the `mcdm.summoner.v1`
source and "Summoner ·" eyebrow) + their advancement-features cards. See `docs/scc-log.md`
(2026-06-18, 2026-06-21) and `steel-etl/CLAUDE.md`.

## Group landings

Use the `<type>.group/<member>` shape (`skill.group/crafting`, `monster.group/devil`).
Grouped glossaries are `rule.<group>/<term>` and `skill.<group>/<item>`.

For monster groups the `<member>` slug is **singular** (`monster.group/goblin`), the same
canonical slug used by the group's statblock category (`monster.goblin.statblock/<id>`);
the plural group name ("Goblins") is preserved only as the page title.

## Linking

The heroes (~17,527 links), summoner (1,464), and monsters (5,948 — 4,759 cross-book to
heroes + 1,189 internal) sources are all fully link-swept. The remaining sweep work
(links *into* monster pages from other books) is tracked as SC-219.

## Printing provenance & code lifecycle

SCC separates **identity** (a permanent address — *codes are forever*) from **provenance**
(which source printing live data came from — metadata about a build). Conflating the two
breaks links, so the rules below are load-bearing. Full reasoning, rejected alternatives,
and the decision triggers:
[`2026-06-11-printing-provenance-and-code-lifecycle-design.md`](../steel-etl/docs/superpowers/specs/2026-06-11-printing-provenance-and-code-lifecycle-design.md).

### ⚠️ PDF printing ≠ SCC version

The `.v1` in a source segment is the SCC *namespace* version — it bumps only for a genuinely
breaking redefinition of a book's content model (a true 2nd Edition), **never** for errata.
Putting the printing in `book:` re-mints every code and dangles ~19k links (tried and
reverted — see [`scc-log.md`](scc-log.md)).

### Provenance stamp (shipped)

Printing lives in non-identity `printing:` frontmatter (heroes 1.01b, monsters 1.01,
beastheart/summoner 1.0) and flows as a build stamp: registry → SCC API → page footer line,
labelled by `v2/site.yaml` `books[].label`. Debug workflow: a code/URL → the page or API
reports its printing + git SHA → `git show <book>-printing-<version>` recovers the exact
source. Ingest convention (update `printing:`, edit, tag the commit): `steel-etl/CLAUDE.md`.

### Code lifecycle / tombstones (settled design, implementation deferred)

When MCDM removes or replaces an entity, SCC **never reuses or 404s a code**:

- The replacement is a new entity → a new code.
- The removed code becomes a **tombstone** carrying registry lifecycle metadata
  (`status: removed`, `removed_in: <printing>`, optional `superseded_by: <code>`); its page
  reads "removed in printing X, replaced by Y" with a link, rather than 404ing.

This scales with *removals* (rare — a handful per printing at most), not printings × all
codes. The implementation, plus the one open sub-decision (where tombstone content lives:
Option A annotated-retention-in-source vs. Option B registry-only), is **deferred until a
trigger fires** — MCDM shipping a removal/replacement, or announcing a true new edition.
Nothing is planned before then: this is reference, not backlog. The triggers and the A/B
trade-off live in the design doc linked above.

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

## Registry

~3,012 codes across four books:

| Book | Codes |
|------|------:|
| heroes | ~1,915 |
| beastheart | 242 |
| monsters | 632 |
| summoner | ~224 |

(How each count reached its current value — and which plan moved it — is in
[`scc-log.md`](scc-log.md).)

## Taxonomy

`feature` is the umbrella:

- `feature.ability.<entity>…` — a feature with combat rigor (`ability`).
- `feature.trait.<entity>…` — **narrow**: ancestry traits + monster statblock passives only.
- `feature.<entity>…` — everything else (plain feature; hub-and-spoke).

## Companions (beastheart)

Live in the `monster.companion.beastheart.*` family, mirroring the Monsters-book Rivals:

- container: `monster.companion.beastheart.statblock/<species>`
- members: `feature[.ability].companion.beastheart.<species>.level-N/<id>`
- advancement-features: `monster.companion.beastheart.advancement-features/<species>`

The advancement-features entity embeds its Level-3/6/10 features as a Forged Band card on
its own page; compositing it onto the companion statblock page is pending (entity-embedding
effort — see `ROADMAP.md`). In Browse the advancement page **flattens** to a sibling of its
companion (`…/beastheart/<species>-advancement-features`, not a sub-folder) and the index
pairs the two on one row (nav-only; SCC code/permalink unchanged —
`flattenAdvancementFeaturesPath` / `buildAdvancementPairContent`).

## Fixtures (summoner)

Mirror the companion scheme:

- base: `monster.fixture.<element>.featureblock/<id>` (`type: featureblock`)
- advancement-features: `monster.fixture.<element>.advancement-features/<id>` (Level-5/9 tiers)

Fixtures render through the shared `buildFeatureblockPage`, sit at
`Browse/monster/fixture/<element>/<id>`, and stay searchable as a `"fixture"` Bestiary
facet. (The old `fixture_page.go` site adapter was retired.) The advancement page
**flattens** to a Browse sibling (`…/fixture/<element>/<id>-advancement-features`) and pairs
with its base on the element index, same as companions (nav-only; code/permalink unchanged).

## Summoner special statblocks

Portfolio minions/champions + the rival summoner live in the `monster.*` family alongside
companions/fixtures — these are plain statblocks, no featureblock machinery:

- minions: `monster.minion.summoner.<portfolio>.statblock/<id>`
- champions: `monster.champion.summoner.<portfolio>.statblock/<id>`

The **Rival Summoner** NPC sits *beside* the Monsters-book rivals:
`monster.rival.<echelon>.statblock/<id>` (same type path — e.g. `rival-summoner` in the
same echelon folder as `rival-fury`). Its summoned creatures are
`monster.rival.<echelon>.summoner.minion/<id>`.

Go-side mapping lives in `StatblockParser` (`switch domain`, mirroring the `@domain:
fixture` case; the rival split keys off `organization == Minion`); `isBestiaryGroupDir`
recognizes the deeper `monster/<domain>/summoner/<portfolio>` group dir.

**Retainers** (`retainer.summoner.*`) stay top-level — out of scope, owned by the future
retainer rework (ROADMAP). See `steel-etl/CLAUDE.md` for the ingest convention.

## Group landings

Use the `<type>.group/<member>` shape (`skill.group/crafting`, `monster.group/devil`).
Grouped glossaries are `rule.<group>/<term>` and `skill.<group>/<item>`.

For monster groups the `<member>` slug is **singular** (`monster.group/goblin`), the same
canonical slug used by the group's statblock category (`monster.goblin.statblock/<id>`);
the plural group name ("Goblins") is preserved only as the page title.

## Linking

The heroes (~17,527 links), summoner (1,464), and monsters (5,948 — 4,759 cross-book to
heroes + 1,189 internal) sources are all fully link-swept. The remaining sweep work
(links *into* monster pages from other books) is tracked in `FOLLOWUPS.md`.

## ⚠️ PDF printing ≠ SCC version

The `.v1` in a source segment is the SCC *namespace* version, **never** the errata
printing. Putting the printing in `book:` re-mints every code and dangles ~19k links (tried
and reverted — see [`scc-log.md`](scc-log.md)). Printing lives in non-identity `printing:`
frontmatter (heroes 1.01b, monsters 1.01, beastheart/summoner 1.0) and flows as a build
stamp: registry → SCC API → page footer line, labelled by `v2/site.yaml` `books[].label`.
The tombstone lifecycle half is tracked in `ROADMAP.md`. Ingest convention:
`steel-etl/CLAUDE.md`.

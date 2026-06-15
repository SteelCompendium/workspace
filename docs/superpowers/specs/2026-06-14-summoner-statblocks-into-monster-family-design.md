# Summoner Champions / Minions / Rivals → `monster.*` family

**Date:** 2026-06-14
**Status:** Design approved, pending implementation plan
**Books affected:** `mcdm.summoner.v1`

## Problem

The Summoner book's special statblocks — portfolio **minions**, portfolio
**champions**, and the **rival summoner** family — currently mint SCC codes under
their own top-level domain roots (`minion.*`, `champion.*`, `rival.*`) and render
as top-level trees in Browse (`Browse/minion/…`, `Browse/champion/…`,
`Browse/rival/…`).

They are conceptually monsters and belong under the Monsters section in Browse,
beside the Monsters-book creatures, the beastheart companions
(`monster.companion.beastheart.*`), and the summoner fixtures
(`monster.fixture.<element>.*`) that were already moved there in Featureblock
Plans 5a–5c. This effort completes that consolidation for the remaining three
families.

Unlike companions/fixtures, these are **plain statblocks** — no advancement
features, no featureblock conversion. The change is a domain-root re-mint plus
the small site/config follow-ups that re-minting implies.

## Current state

SCC codes are derived in `StatblockParser` from the `@domain` / `@category` /
`@subcategory` context pushed by the enclosing `@type: monster-group` container
(`statblockDomain` + `compactPath(domain, category, subcategory, "statblock")` in
`steel-etl/internal/content/monster.go`).

| Family | Source annotation | Current code | Current Browse path |
|---|---|---|---|
| Minions | `@domain: minion \| @category: <portfolio>` | `minion.<portfolio>.statblock/<id>` | `minion/<portfolio>/<id>` |
| Champions | `@domain: champion \| @category: <portfolio>` | `champion.<portfolio>.statblock/<id>` | `champion/<portfolio>/<id>` |
| Rivals | `@domain: rival \| @category: summoner \| @subcategory: <echelon>` | `rival.summoner.<echelon>.statblock/<id>` | `rival/summoner/<echelon>/<id>` |

`portfolio` ∈ {demon, elemental, fey, undead}. `echelon` ∈ {1st-echelon,
2nd-echelon, 3rd-echelon, 4th-echelon}. Each rival echelon group contains one
**Rival Summoner** NPC (keyword `Rival`, role "… Elite Controller") plus several
**minion summons** (organization `Minion`, e.g. Skeleton, Grave Knight, Ceaseless
Mournling); duplicate summon names recur across echelons.

**Re-mint cost is low:** `pipeline.yaml` has `freeze: false`, and only **2 inbound
`scc:` links** exist across all source inputs — `minion.elemental.statblock/iron-reaver`
and `champion.undead.statblock/avatar-of-death`, both inside the summoner source.
No rival statblock has any inbound link. `gen --all` resets the registry up front,
so the old codes self-prune on the next deploy.

## Target SCC scheme

Leaf `statblock` is hoisted out of the Browse URL by the existing
`hoistStatblockPath`, identical to every other statblock; the table's Browse paths
reflect that hoist.

| Family | New code | Browse path |
|---|---|---|
| Minions | `monster.minion.summoner.<portfolio>.statblock/<id>` | `monster/minion/summoner/<portfolio>/<id>` |
| Champions | `monster.champion.summoner.<portfolio>.statblock/<id>` | `monster/champion/summoner/<portfolio>/<id>` |
| Rival NPC | `monster.rivals.<echelon>.statblock/<id>` | `monster/rivals/<echelon>/<id>` |
| Rival summons | `monster.rivals.<echelon>.summoner.minion/<id>` | `monster/rivals/<echelon>/summoner/minion/<id>` |

Worked examples:

- `mcdm.summoner.v1/monster.minion.summoner.demon.statblock/rasquine`
- `mcdm.summoner.v1/monster.champion.summoner.demon.statblock/demon-lords-aspect`
- `mcdm.summoner.v1/monster.rivals.2nd-echelon.statblock/rival-summoner`
- `mcdm.summoner.v1/monster.rivals.2nd-echelon.summoner.minion/skeleton`

### Design decisions

- **`summoner` class segment** is inserted for minions and champions (after the
  `monster.<domain>` root, before the portfolio), mirroring how companions insert
  `beastheart` (`monster.companion.beastheart.<species>`). The portfolio category
  is preserved as the next segment. This produces in-source redundancy with the
  `mcdm.summoner.v1` source prefix — intentional and consistent with the companion
  precedent, because the `monster.*` type path is meant to be book-independent.
- **The Rival Summoner NPC merges into the Monsters-book rivals.** It uses the
  exact type path `monster.rivals.<echelon>.statblock`, so `rival-summoner` lands
  in the *same* echelon folder as the Monsters-book rivals (`rival-fury`,
  `rival-conduit`, …). They are distinguished only by SCC source segment
  (`mcdm.summoner.v1` vs `mcdm.monsters.v1`) and item id; no path or registry-key
  collision. This is the "beside them" requirement.
- **Echelon segment** uses the Monsters-book format `<ordinal>-echelon`
  (`1st-echelon`, `2nd-echelon`, …) so the summoner rival NPC physically sits in
  the same folder as the Monsters-book rivals.
- **Rival summons** take the `summoner.minion` leaf, nested under the echelon
  (`monster.rivals.<echelon>.summoner.minion/<id>`). They stay echelon-scoped, so
  recurring summon names (Skeleton at every echelon) remain distinct codes.

## Implementation approach

**Go-side domain mapping in `StatblockParser`**, mirroring the existing
`@domain: fixture` special-case. The summoner source annotations stay simple
(`@domain: minion|champion|rival`); the parser maps those domains into the
`monster.*` family. Rationale: keeps the summoner source readable, matches the
fixture precedent, and avoids stuffing a multi-segment prefix into `@domain`.

Per family, in `StatblockParser.Parse` after `statblockDomain` resolves
`domain`/`category`/`subcategory`:

- `domain == "minion"` → `compactPath("monster", "minion", "summoner", category, "statblock")`
- `domain == "champion"` → `compactPath("monster", "champion", "summoner", category, "statblock")`
- `domain == "rival"` → split by the statblock's own organization/keyword:
  - **Rival Summoner NPC** (keyword contains `Rival`, i.e. *not* a minion) →
    `compactPath("monster", "rivals", subcategory, "statblock")`
  - **minion summons** (organization `Minion`) →
    `compactPath("monster", "rivals", subcategory, "summoner", "minion")`

The rival split detection mechanism (read the parsed `organization` field, which
is already populated from the statblock grid; `Minion` → summon, otherwise → NPC)
is an implementation detail for the plan. Note `category` for rivals is the
constant `summoner` in source and is *dropped* from the new code in favour of the
`summoner.minion` leaf for summons and nothing for the NPC.

**Assumption (documented):** hardcoding `summoner` as the class segment is safe
because these `@domain` values appear only in the Summoner book. If another book
ever adds champions/minions, revisit to source the class from context.

## Site / config changes

- **`v2/site.yaml`:** remove the now-dead top-level Browse includes `minion/`,
  `champion/`, `rival/`, and the already-stale `fixture/` (fixtures moved under
  `monster/` in Plan 5c) — everything now routes through the existing `monster/`
  include. Update the surrounding comment.
- **`bestiary_search.go` (`bestiaryItemType`):** the `minion/`/`champion/`/`rival/`
  prefix branches become dead once all four are under `monster/`. Simplify so the
  summoner statblocks continue to index as the `statblock` facet via the
  `monster/` prefix (unchanged search behavior). The rival summons
  (`type: statblock` under `monster/rivals/.../summoner/minion/`) likewise index
  as `statblock`.
- **`bestiary_cards.go`, `feature_index.go`, `cards.go`:** drop the now-dead
  `minion`/`champion`/`rival` (and stale `fixture`) top-level segment cases from
  the dir-classification lists; these segments now appear only nested under
  `monster/`.
- **Inbound links:** update the 2 in-source `scc:` links
  (`minion.elemental.statblock/iron-reaver` →
  `monster.minion.summoner.elemental.statblock/iron-reaver`;
  `champion.undead.statblock/avatar-of-death` →
  `monster.champion.summoner.undead.statblock/avatar-of-death`).

## Out of scope

- **Retainers** (`retainer.summoner.statblock/*`) stay top-level and untouched.
  Their fate is undecided and Plan 6 (retainer rework) owns that work.
- Bestiary search facet *granularity* (minions/champions still fold into the
  `statblock` facet rather than getting their own facets) — no change requested;
  the Bestiary tab is a static "coming soon" placeholder anyway.

## Verification

- `steel-etl classify --diff` shows exactly the expected re-mints (old `minion.*`,
  `champion.*`, `rival.*` codes removed; new `monster.minion.summoner.*`,
  `monster.champion.summoner.*`, `monster.rivals.*` codes added) and no other
  book's codes changed.
- `steel-etl validate` passes (no unresolvable links — the 2 inbound links are
  updated).
- After `gen --all` + `site`, the registry has no orphaned `minion.*`/`champion.*`/
  `rival.*` entries; Browse has no top-level `minion/`/`champion/`/`rival/` dirs;
  the rival summoner NPCs appear in `Browse/monster/rivals/<echelon>/` beside the
  Monsters-book rivals; minions/champions appear under
  `Browse/monster/minion/summoner/<portfolio>/` and
  `Browse/monster/champion/summoner/<portfolio>/`.
- Spot-check the rendered statblock pages and the `monster/rivals/<echelon>/`
  index pairs the NPC with its summons.

## Docs to update on completion

- `docs/scc-log.md`: dated entry describing the re-mint (counts, old→new shapes).
- Workspace `CLAUDE.md`: update the SCC current-state bullets (registry counts;
  add minion/champion/rival to the "moved under monster" narrative alongside
  companions/fixtures).
- `steel-etl/docs/statblocks.md`: note the summoner minion/champion/rival domain
  mapping and the rival NPC-vs-summons split.

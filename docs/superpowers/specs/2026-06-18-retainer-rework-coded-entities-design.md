# Retainer rework — coded entities (Featureblock Plan 6) — design

**Date:** 2026-06-18 · **Status:** approved design (decisions locked 2026-06-18), pre-implementation
**Scope:** steel-etl (Monsters-book source annotations, statblock + featureblock parsers, classifier, site renderer) + link re-sweep + docs. Workspace-level spec — it changes the **SCC scheme** (a workspace-level contract).
**Implements:** ROADMAP #9 ("Plan 6 — retainer advancement rework") — the last piece of the featureblock effort.
**Builds on / mirrors:** the companion restructure (Plan 5b, `monster.companion.beastheart.*`) and the fixture restructure (Plan 5c, `monster.fixture.<element>.*`). Spec lineage: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md` §8 explicitly deferred retainers to "Phase 6 (separate spec)"; this is that spec.

---

## 1. Why (motivation)

Today retainer advancement abilities have **no SCC identity**. The 21 retainer statblocks (Goblin Guide, Minotaur Gorer, …) live at `mcdm.monsters.v1/retainer.statblock/<id>` — the **only** bestiary family still outside the `monster.*` namespace — and their `######## Level N Retainer Advancement Ability` H8 sub-headings are deliberately uncollected (`collectDeepHeadings` skips exactly-8-`#`), folding into the statblock body. Plan 4 (`internal/site/retainer_page.go`) splits those out **site-side only** into a Forged Band card with no codes. The separate `#### Role Advancement Abilities` chapter (9 role groups) is likewise uncoded chapter prose.

The goal (user, 2026-06-18): **almost everything here should be its own coded entity** — the retainer statblock, each retainer ability, the advancement container, each advancement ability, the role-advancement containers, and each role ability. The driving use case is third-party tooling: a VTT that wants to show "the level-10 advancement ability" in a modal should be able to pull it up by SCC code. This makes retainers a full structural mirror of companions (Plan 5b), replacing Plan 4's ad-hoc site split with real, addressable entities.

## 2. Resolved decisions (locked 2026-06-18)

1. **Collection mechanism: source restructure** (mirror 5b/5c), **not** a global `collectDeepHeadings` H8 change. The global H8 rule is left untouched (it also governs the chapter's `Level N Role Advancement Ability` H8 and any other future H8 sub-detail); only the sections we explicitly edit move. ROADMAP #9's "collect the H8 headings" framing is superseded by this and will be reworded when the item is marked done.
2. **Full-granularity coding.** Every entity gets a code (§3), down to individual abilities — base and advancement, retainer and role.
3. **Base statblock restructured into `monster.*`.** `retainer.statblock/<id>` → `monster.retainer.statblock/<id>`, with the advancement sibling `monster.retainer.advancement-features/<id>` (symmetric kind-swap pair, like fixtures/companions). 0 inbound links → clean re-mint.
4. **Role Advancement Abilities included** (the 9 role groups), coded as per-role containers + per-ability children.
5. **Coding mechanism: annotated `@type: ability|trait` child sections** (the companion-source pattern). A standalone coded page is minted **only** for a real section in the document tree (`walk(doc.Sections)` → `scc.Classify`); `ParsedContent.Children` is **embed-only** and never produces a page. So every retainer ability must be **un-blockquoted into an annotated section** (heading = ability name, `@type: ability|trait`, `@level: N` for advancement/role) — exactly how companion abilities are authored (`<!-- @type: ability | @id: petrify --> ##### Petrify`). There is **no** "synthesize a coded child from a blockquote" mechanism, and building one would be net-new pipeline work — rejected.
6. **Rendering: re-compose the unified card via a retainer adapter** (generalize the proven `companion_statblock.go`). Coding the **base** abilities pulls them out of the statblock body into sections, so the build-time `.sb-wrap` card must be rebuilt from those sections rather than from body blockquotes. The retainer adapter reads stats from **frontmatter** (the existing `buildStatblockIsland` path — retainer grids already populate frontmatter) and features from the now-`@type:ability` sections (reusing `companionFeatures`' `parseStatblockIslandFeature` trick). This is the heaviest, regression-prone piece (render fidelity across 21 cards); it is mitigated by reusing the companion adapter, not inventing one.
7. **Single plan, staged** (not decomposed into separate plans), executed across multiple sessions if needed: Stage A namespace + advancement/role coding (no card change), Stage B base-ability coding + retainer card adapter, Stage C link-sweep + docs + deploy.

## 3. The SCC scheme (full entity tree)

All under `mcdm.monsters.v1`. `<id>` = retainer slug (e.g. `angulotl-hopper`); `<role>` = role slug (e.g. `ambusher`); `<name>` = ability/trait slug.

| Entity | Count | Code (type-path / item) |
|---|---|---|
| retainer statblock | 21 | `monster.retainer.statblock/<id>` |
| base ability (signature/active) | ~30 | `feature.ability.retainer.<id>/<name>` |
| base passive | ~20 | `feature.trait.retainer.<id>/<name>` |
| advancement container | 21 | `monster.retainer.advancement-features/<id>` |
| advancement ability | ~57 | `feature.ability.retainer.<id>.level-N/<name>` |
| role-advancement container | 9 | `monster.retainer.role-advancement/<role>` |
| role ability | ~25 | `feature.ability.retainer.role.<role>.level-N/<name>` |

Key properties:
- **Kind-swap pair.** `monster.retainer.statblock/<id>` and `monster.retainer.advancement-features/<id>` share group (`monster.retainer`) + item (`<id>`), differing only by kind segment — the future embed lookup is "same group/item, swap kind," exactly as for companions/fixtures/Rivals.
- **Level segment.** Base abilities/traits carry **no** level segment (they are innate to the statblock, and retainers vary in creature level 1–9, so a level segment would be meaningless). Advancement and role abilities carry `level-N` taken from their `Level N … Advancement Ability` heading.
- **Ability vs trait.** Active abilities (signature, encounter, triggered) classify as `feature.ability.*`; passive traits (e.g. *Toxiferous*) as `feature.trait.*` — the existing monster-statblock taxonomy (`feature_type` narrowed 2026-06-07: monster statblock passives are `trait`).
- **Role containers are role-keyed.** `monster.retainer.role-advancement/<role>` shares the `monster.retainer` group but its item space is the 9 roles, not retainer-ids — a distinct kind (`role-advancement`) so it never collides with `advancement-features`' retainer-id item space.
- **Re-mint, not freeze.** `freeze:false`; `validate --scc-stable` will report the 21 old `retainer.statblock/*` codes removed and the full tree added — intentional, recorded in `docs/scc-log.md`.

## 4. Source annotation changes

In `steel-etl/input/monsters/Draw Steel Monsters.md`:

1. **Group re-namespace.** The `<!-- @type: monster-group | @domain: retainer -->` / `#### Retainer Statblocks` annotation must classify its child statblocks as `monster.retainer.statblock/*` (today they are bare `retainer.statblock/*`). Exact annotation/parser change is an implementation detail; the constraint is the §3 target codes. (Parallel: fixtures gained the `monster` top segment via `compactPath("monster", "fixture", category, …)`; retainers need `compactPath("monster", "retainer", "", "statblock")`.)
2. **Base abilities → sections (×21 statblocks).** Un-blockquote each innate ability/passive in the statblock body into an annotated child section: `<!-- @type: ability | @id: <slug> -->` (or `@type: trait` for passives) with the ability name as the heading and the content as the section body (§5). The statblock's stat grid stays as-is.
3. **Advancement sibling (×21).** Replace each retainer's `######## Level N Retainer Advancement Ability` blocks with a sibling `@type: featureblock` container whose members are annotated, un-blockquoted ability sections (see §4.1).
4. **Role-advancement containers (×9).** The 9 `##### <Role> Abilities` groups under `#### Role Advancement Abilities` get `<!-- @type: featureblock | @id: <role> -->` (with whatever context yields `monster.retainer.role-advancement/<role>`); each `######## Level N Role Advancement Ability` block becomes an annotated `<!-- @type: ability | @level: N --> ######## <Ability Name>` member section.

### 4.1 Worked example (Angulotl Hopper, abbreviated)

```
<!-- @type: statblock -->
####### Angulotl Hopper
| …stat grid… |

<!-- @type: ability | @subtype: signature | @id: leapfrog -->
######## Leapfrog
| **Melee, Strike, Weapon** | **Main action** |
…
**Effect:** …

<!-- @type: trait | @id: toxiferous -->
######## Toxiferous
Whenever an adjacent enemy grabs the hopper…

<!-- @type: featureblock | @id: angulotl-hopper -->
####### Angulotl Hopper Advancement Features

<!-- @type: ability | @level: 4 | @id: leaping-attack -->
######## Leaping Attack
…
```

The advancement featureblock's `@id` must equal the base statblock slug so the codes share an item. Heading depth (H7/H8) only controls tree placement; the SCC code comes from the annotation + ancestor context, not the depth (`collectDeepHeadings` still caps H7+ at level 6 — unchanged). The ability content is un-blockquoted (leading `> ` stripped) so `AbilityParser` and the site ability-card renderer handle it like every heroes-book ability.

## 5. Coding mechanism — annotated `@type: ability|trait` sections

A standalone coded page is minted **only** for a real section in the document tree: the pipeline's `walk(doc.Sections)` calls `scc.Classify` per section. `ParsedContent.Children` (the kit `signature_ability` / feature `ability` map) is **embed-only** — consumed by the SDK transformer for transclusion, never walked for output. (Verified in `internal/pipeline/pipeline.go` and `internal/content/feature.go`.) So to give a retainer ability its own code, the ability must **be** a section.

Therefore every retainer ability blockquote is **un-blockquoted and promoted to an annotated section**, exactly as companion abilities are authored (`input/beastheart/Draw Steel Beastheart.md`):

```
<!-- @type: ability | @subtype: signature | @id: leapfrog -->
###### Leapfrog
<ability content (spec table, power roll, Effect) as the section body — NOT a blockquote>
```

- **Base abilities** become `@type: ability` (active) or `@type: trait` (passive) child sections of the statblock → `feature.ability|trait.retainer.<id>/<name>`. No `@level`.
- **Advancement abilities** become `@type: ability | @level: N` child sections of the per-retainer `@type: featureblock` advancement container → `feature.ability.retainer.<id>.level-N/<name>`.
- **Role abilities** become `@type: ability | @level: N` child sections of the per-role `@type: featureblock` container → `feature.ability.retainer.role.<role>.level-N/<name>`.

The container featureblocks embed their member sections into the card via `collectChildFeatures` — **extended to collect `@type: ability` children**, not just `@type: feature` (it currently switches on `"feature"` only; add an `"ability"` case). Members keep their own codes; the embed is render-only (the companion-advancement precedent, `FeatureblockParser` companion branch).

This is mechanical but large: ~130 ability blockquotes across the retainer section. A scripted transform is recommended, verified by regen + diff (§9). The ability content is currently blockquoted; promoting it to a section body means stripping the leading `> ` quote markers (the existing `AbilityParser` + site ability-card renderer expect un-blockquoted ability prose, as for every heroes-book ability).

## 6. Rendering

- **Advancement + role cards (Stage A — no statblock-card change).** The per-retainer `monster.retainer.advancement-features/<id>` and per-role `monster.retainer.role-advancement/<role>` featureblocks render as Forged Band cards (`renderFeatureblockCard`, `.fb__band--adv` leveled tiers) from their embedded member sections. The advancement card is transcluded beneath the statblock via the `embed_cards.go` pass (the companion-advancement embedding precedent, ROADMAP #12/#13), **replacing** Plan 4's `renderRetainerAdvancement` site split. Because retainer advancement abilities were *already* pulled out of the statblock card by Plan 4 (and role abilities are chapter prose), coding them needs **no** change to the statblock card.
- **Statblock card via the retainer adapter (Stage B — the heavy half).** Coding the **base** abilities pulls them out of the statblock body into sections, so the `.sb-wrap` card must be rebuilt from those sections. Add a retainer adapter (generalizing `companion_statblock.go`): it reuses the existing `buildStatblockIsland(fm, …)` for stats/meta/characteristics (retainer grids already populate frontmatter) but sources `Features` from the now-`@type:ability` sections — reusing `companionFeatures`' trick (synthesize a `• **Name**` title line, reuse `parseStatblockIslandFeature`) so no feature-parsing logic is duplicated. Render fidelity across all 21 cards is the gated risk (§9 visual check).
- **`retainer_page.go` retired (Stage B).** Plan 4's `splitRetainerAdvancement` / `renderRetainerAdvancement` and their wiring in `buildStatblockIslandPage` are removed once the advancement card is the embedded entity. Watch the shared helper `fbFeaturesFromRich` (also used by `retainer_page.go`) — relocate if needed, mirroring the 5c `fixture_page.go` retirement.

## 7. Link re-sweep + schema

- **Link re-sweep.** Inbound `scc:` links to retainer codes ≈ 0 (verified 2026-06-18: `grep` for `retainer\.` in `scc:` links → 0). After re-mint, re-run the link pipeline and `validate` to confirm nothing dangles, and re-point anything that surfaces. The newly-coded abilities become **new linkable targets** for future linking passes (regenerate `linking-reference.md`).
- **Schema / SDK.** The advancement + role containers are featureblock-shaped → `featureblock.schema.json` (both copies). The new `feature.ability|trait` children reuse the existing feature/ability schemas. Confirm both schema copies (`steel-etl/schemas` + `data-sdk-npm`) and the `internal/output/schema_validation_test.go` allowlist accept the output; update both copies + the allowlist if any field/discriminator is added (dual-schema-sync rule).

## 8. Follow-ups logged (NOT in this plan)

1. **Stale-docs fix.** ROADMAP #7 and `steel-etl/CLAUDE.md` / `docs/statblocks.md` still describe statblocks as client-side JSON islands awaiting build-time migration; in fact `buildStatblockIslandPage` renders build-time `.sb-wrap` and 0 built pages use the island mount (`steel-statblock.js` is dead code). Correct the docs and re-assess what genuinely remains of ROADMAP #7 (the entity-embedding half).
2. **Per-member coding for all featureblocks.** Fixtures (5c) and malice/terrain featureblocks keep their members **inline and uncoded**. The user's principle (any sub-part addressable by code) means they should gain per-member `feature.*` codes too, matching the granularity Plan 6 sets for retainers. Large, cross-cutting (every featureblock type) → its own ROADMAP item.

## 9. Verification

- `devbox run -- go build ./... && go vet ./... && go test ./...` green (run from `steel-etl/`, devbox-prefixed).
- `gen --all` + `steel-etl site --config ../v2/site.yaml` clean.
- `classify --diff` shows **only** the intended retainer delta: 21 `retainer.statblock/*` removed; the full §3 tree added. Record the registry count delta in `docs/scc-log.md`.
- Spot-check a built retainer page (e.g. Angulotl Hopper): unified `.sb-wrap` card (innate abilities only in the card), one embedded Forged Band advancement card below, and each ability reachable as a standalone page via its `/scc/<code>/` permalink. Role page: 9 role cards, member abilities reachable by code.
- No `sc-statblock-mount` regressions anywhere (islands stay retired).

## 10. Docs & bookkeeping (at implementation time)

- `docs/scc-log.md`: dated entry — retainers `retainer.statblock/*` → `monster.retainer.*` family; advancement-features + role-advancement containers; full per-ability coding; Plan 4 `retainer_page.go` retired; registry delta.
- `docs/scc-reference.md` + workspace `CLAUDE.md` SCC section: retainers now in the `monster.*` family; registry count; "Plan 6 done — featureblock effort complete."
- `steel-etl/CLAUDE.md` + `docs/statblocks.md`: retainer parsing/coding/routing; remove the "H8 retainer advancement folds into the body" description (now a coded sibling).
- `DESIGN.md`: retainer advancement/role-advancement as Forged Band card instances (replace the Plan 4 site-split mention).
- `ROADMAP.md`: mark #9 **done** (reworded away from the "collect H8 globally" framing); add the two §8 follow-ups (stale-docs fix; per-member coding for all featureblocks) as new ROADMAP/FOLLOWUPS items.
- Memory `featureblock-refactor-in-flight` / the featureblock-cards note: Plan 6 shipped; effort complete.

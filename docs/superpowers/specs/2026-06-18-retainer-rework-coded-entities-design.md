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
5. **Rendering: keep the unified build-time card.** Statblocks already render build-time `.sb-wrap` (the client-side island was retired; see §6). Because abilities stay as blockquotes in the statblock body (§5), the existing `renderStatblockCard` keeps producing one unified card with no change — coding them as children is additive, so unlike companions no re-composition adapter is needed. The advancement card embeds below.
6. **Coding mechanism: parser-emitted children**, not 50 hand-annotated `@type: ability` sections (§4) — minimizes source churn and leaves the build-time card unchanged.
7. **Single plan** (not decomposed into sub-plans), despite the size.

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
2. **Advancement sibling (×21).** For each retainer, cut its `######## Level N Retainer Advancement Ability` H8 block (heading + following blockquote, through the next H8 or end of statblock body) out of the `@type: statblock` body and paste it into a **new sibling** section immediately after, under the same `#### Retainer Statblocks` group:
   ```
   <!-- @type: featureblock | @id: angulotl-hopper -->
   ####### Angulotl Hopper Advancement Features

   ######## Level 4 Retainer Advancement Ability
   > 🗡 **Leaping Attack (Encounter)** …
   ######## Level 7 Retainer Advancement Ability
   > 🏹 **Three-Poison Dart (Encounter)** …
   ######## Level 10 Retainer Advancement Ability
   > ❗️ **Trip of the Tongue (Encounter)** …
   ```
   The `@id` must equal the base statblock's slug so the codes share an item. The base statblock body now ends at its last innate ability. (H8 inside the featureblock is still uncollected and demotes to a bold `**Level N Retainer Advancement Ability**` label — see §4.1.)
3. **Role-advancement containers (×9).** The 9 `##### <Role> Abilities` groups under `#### Role Advancement Abilities` get a `<!-- @type: featureblock | @id: <role> -->` annotation (with whatever context segment yields `monster.retainer.role-advancement/<role>`). Their member abilities stay as the H8 `######## Level N Role Advancement Ability` blocks.

### 4.1 Level-label parsing (implementation note)

`ParseRichFeatures` attaches `Level` from a standalone bold label `**Level N … Advancement Feature**` (`fbLevelLabelRe`). Retainer/role advancement uses H8 **headings** ending in "Advancement **Ability**" (not "Feature"), which `demoteOverflowHeadings` rewrites to a bold label `**Level N Retainer Advancement Ability**`. The plan must ensure the level is attached for this form — either broaden `fbLevelLabelRe` to also match "…Advancement Ability", or stamp the level explicitly as Plan 4's `retainer_page.go` did. This is the same gotcha Plan 4 handled; carry it forward.

## 5. Coding mechanism — parser-emitted child entities

Base and advancement/role abilities are coded **without** rewriting each ability blockquote into an annotated `@type: ability` section. Instead the parsers emit each body blockquote as a **child `feature.ability|trait` entity** (the established kit `signature_ability` / trait `ability` embed precedent: a child ability is parsed, stored in `ParsedContent.Children`, and also written as its own standalone output file when the pipeline walks the section tree). Consequences:

- **Statblock parser** (`StatblockParser`, `internal/content/monster.go`): for `@domain: retainer` statblocks, emit each body blockquote as a child `feature.ability|trait.retainer.<id>/<name>`. The blockquotes stay in the statblock body, so the build-time `.sb-wrap` renderer (`renderStatblockCard`) is unchanged and the card stays unified — the children are *additional* standalone entities, not a rendering change.
- **Featureblock parser** (`FeatureblockParser`, `internal/content/monster.go`): for the retainer advancement + role-advancement featureblocks, emit the container code (§3) **and** each member blockquote as a child `feature.ability.*.level-N/<name>`.

The plan must verify this mechanism against exactly how companion members are coded (Plan 5b `FeatureblockParser` companion branch + `collectChildFeatures`) and reuse that path where possible rather than inventing a parallel one.

## 6. Rendering

- **Statblock card — status quo.** Statblocks already render build-time `.sb-wrap` (`buildStatblockIslandPage` → `renderStatblockCard`; the JSON island is retired — 0 built pages use `sc-statblock-mount`). The card re-composes its abilities from the body blockquotes, so coding the abilities as children (§5) leaves the card unchanged and unified.
- **Advancement-features card — embedded below.** The `monster.retainer.advancement-features/<id>` featureblock renders as a Forged Band card (`renderFeatureblockCard`, `.fb__band--adv` leveled tiers) and is transcluded beneath the statblock via the `embed_cards.go` pass (the companion-advancement embedding precedent, ROADMAP #12/#13). This **replaces** Plan 4's `renderRetainerAdvancement` site-side split.
- **`retainer_page.go` retired.** Once the advancement card is a real embedded entity, Plan 4's `splitRetainerAdvancement` / `renderRetainerAdvancement` and their wiring in `buildStatblockIslandPage` are removed. (Watch the shared helper `fbFeaturesFromRich` — confirm no other caller breaks, mirroring the 5c `fixture_page.go` retirement.)
- **Role-advancement cards.** The 9 `monster.retainer.role-advancement/<role>` featureblocks render as Forged Band cards on the Role Advancement chapter page (and standalone pages); their member abilities are reachable as standalone coded pages.

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

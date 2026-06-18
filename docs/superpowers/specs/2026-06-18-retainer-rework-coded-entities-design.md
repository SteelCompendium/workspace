# Retainer rework — `monster.*` family + coded advancement containers (Featureblock Plan 6) — design

**Date:** 2026-06-18 · **Status:** approved design (scope locked to "Option A" 2026-06-18), pre-implementation
**Scope:** steel-etl (Monsters-book source annotations, statblock + featureblock parsers, classifier, site renderer/index) + link re-sweep + docs. Workspace-level spec — it changes the **SCC scheme** (a workspace-level contract).
**Implements:** ROADMAP #9 ("Plan 6 — retainer advancement rework") — the last piece of the featureblock effort.
**Mirrors:** the fixture restructure (Plan 5c, `monster.fixture.<element>.featureblock` + `…advancement-features`). Retainers get the **same container-level treatment** fixtures got: coded base + coded advancement container, members **inline/uncoded**.

---

## 1. Why (motivation)

Retainers are the **only** bestiary family still outside the `monster.*` namespace (`mcdm.monsters.v1/retainer.statblock/<id>`, ×21), and their advancement abilities have **no SCC identity** — the `######## Level N Retainer Advancement Ability` H8 sub-headings fold into the statblock body, split out **site-side only** by Plan 4 (`internal/site/retainer_page.go`) into a Forged Band card with no codes. The separate `#### Role Advancement Abilities` chapter (9 role groups) is uncoded prose.

Plan 6 brings retainers into the `monster.*` family and gives the **advancement and role-advancement groups their own coded container entities** (so a third-party tool can address "this retainer's advancement block" / "the Ambusher role-advancement block" by code), replacing Plan 4's ad-hoc site split with real entities — exactly parallel to fixtures (5c).

## 2. Scope decision — "Option A" (locked 2026-06-18)

Per-ability coding (each individual base/advancement/role ability as its own `feature.ability.*` entity) is **explicitly deferred** — it is blocked by a heading-infrastructure limit (§7), not by effort. Plan 6 ships the **container-level** restructure that the flat Monsters-book structure *does* support:

1. **Namespace.** `retainer.statblock/<id>` → `monster.retainer.statblock/<id>` (×21).
2. **Advancement containers.** New `monster.retainer.advancement-features/<id>` (×21), one per retainer, members **inline** (`features[]`, like fixtures/malice — uncoded).
3. **Role-advancement containers.** New `monster.retainer.role-advancement/<role>` (×9), members **inline**.
4. **Retire Plan 4** (`retainer_page.go` site split) in favour of the real entities.
5. **Members stay inline/uncoded** — and crucially they are **abilities** (combat rigor preserved), not "features" (§6/§8).

**Net new codes:** 21 base re-pathed + 21 advancement + 9 role = registry **+30** (21 old `retainer.statblock/*` removed, 51 added). `freeze:false` → clean re-mint; **0 inbound `scc:` links** (verified 2026-06-18) → nothing dangles.

## 3. The SCC scheme (Plan 6)

All under `mcdm.monsters.v1`. `<id>` = retainer slug; `<role>` = role slug.

| Entity | Count | Code (type-path / item) |
|---|---|---|
| retainer statblock | 21 | `monster.retainer.statblock/<id>` |
| advancement container | 21 | `monster.retainer.advancement-features/<id>` |
| role-advancement container | 9 | `monster.retainer.role-advancement/<role>` |

- **Kind-swap pair.** `monster.retainer.statblock/<id>` and `monster.retainer.advancement-features/<id>` share group (`monster.retainer`) + item (`<id>`), differing only by kind segment — the embed/lookup pattern used across `monster.*` (Rivals, companions, fixtures).
- **Kind segment naming.** `advancement-features` names the container's *role* (the advancement block), not its members' type — kept consistent with the companion/fixture family for uniform lookup, even though retainer members are abilities (§8). `role-advancement` is a distinct kind so its role-keyed item space never collides with the retainer-id item space of `advancement-features`.
- **Members are inline/uncoded** (`features[]`), exactly as fixtures (5c): `ParseRichFeatures(body)` → `RichFeatureMaps`. Per-member codes are the deferred §7 work.

## 4. Source annotation changes (`input/monsters/Draw Steel Monsters.md`)

1. **Base re-namespace — no source edit.** The `#### Retainer Statblocks` group already carries `@domain: retainer`; the namespace move is a **parser** change (§5), not a source edit.
2. **Advancement sibling (×21).** Move each retainer's `######## Level N Retainer Advancement Ability` blocks out of the `@type: statblock` body into a **sibling** section immediately after it, under the same `#### Retainer Statblocks` group:
   ```
   <!-- @type: statblock -->
   ####### Angulotl Hopper
   | …stat grid… |
   > 🗡 **Leapfrog (Signature Ability)** …      (innate abilities stay in the body)
   > ⭐️ **Toxiferous** …

   <!-- @type: featureblock | @id: angulotl-hopper -->
   ####### Angulotl Hopper Advancement Features
   > **Level 4 Retainer Advancement Ability**   (kept as a body label — see §4.1)
   > 🗡 **Leaping Attack (Encounter)** …
   > **Level 7 Retainer Advancement Ability**
   > 🏹 **Three-Poison Dart (Encounter)** …
   ```
   The featureblock `@id` **must equal** the base statblock slug so the codes share an item. The base statblock body keeps only its innate abilities.
3. **Role-advancement (×9).** Wrap the 9 `##### <Role> Abilities` groups under `#### Role Advancement Abilities` in a `<!-- @type: monster-group | @domain: retainer | @category: role-advancement -->` container, and annotate each role group `<!-- @type: featureblock | @id: <role> -->` (e.g. `@id: ambusher`). The `######## Level N Role Advancement Ability` blocks stay as body labels + blockquotes (members).

### 4.1 Level-label parsing (implementation note)

`ParseRichFeatures` attaches a member `Level` from a standalone bold label `**Level N … Advancement Feature**` (`fbLevelLabelRe`). Retainer/role advancement uses `Level N … Advancement **Ability**` (ends "Ability", not "Feature"); inside the featureblock the H8 heading is uncollected and `demoteOverflowHeadings` rewrites it to a bold label `**Level N Retainer Advancement Ability**`. The plan must attach the level for this form — broaden `fbLevelLabelRe` to also match "…Advancement Ability", matching what Plan 4's `retainerAdvLabelRe` already did. This keeps the `.fb__band--adv` leveled tiers.

## 5. Parser / classifier changes

- **`StatblockParser`** (`internal/content/monster.go`): add a `domain == "retainer"` branch so the base classifies as `compactPath("monster", "retainer", category, subcategory, "statblock")` → `monster.retainer.statblock/<id>` (parallel to the existing fixture/minion/champion/rival branches). The statblock body still holds the innate ability blockquotes → the build-time `.sb-wrap` card renders unchanged (§6).
- **`FeatureblockParser`** (`internal/content/monster.go`): add a `domain == "retainer"` branch (after companion, before/with fixture):
  - if `category == "role-advancement"` → `compactPath("monster", "retainer", "role-advancement")`, `ItemID = section.ID()` (= role slug);
  - else → `compactPath("monster", "retainer", "advancement-features")`, `ItemID = section.ID()` (= retainer slug);
  - both: `fm["features"] = RichFeatureMaps(ParseRichFeatures(body))` (inline members), reusing the fixture branch's shape.
- **No `collectDeepHeadings` / `ContextStack` change** — the flat level-6 model is untouched (that change is the §7 prerequisite for per-ability coding, deliberately out of scope).

## 6. Rendering

- **Statblock card — unchanged.** Retainer statblocks keep their innate ability blockquotes in the body, so `buildStatblockIslandPage` → `renderStatblockCard` produces the same build-time `.sb-wrap` card as today (the JSON island is already retired; §7 note). Only the `scc` code changed.
- **Advancement + role cards — own pages, fixture pattern.** Each `monster.retainer.advancement-features/<id>` and `monster.retainer.role-advancement/<role>` renders as a Forged Band card (`buildFeatureblockPage` → `renderFeatureblockCard`, `.fb__band--adv` leveled tiers) on its **own** page. The retainer Browse index pairs each statblock with its advancement card via `buildAdvancementPairContent` (the shipped fixture/companion index pairing). Members render with **full ability rigor** (power-roll tiers, keywords, action) — `RichFeature` carries `PowerRoll`/`Sections`, so abilities are not flattened to name+description.
- **No on-page embed (deferred).** Because advancement is a *sibling* (not a descendant) of the statblock in the flat tree, `embed_cards.go` cannot transclude it beneath the statblock on the statblock's own page (it embeds only `{data-scc}` descendants of a container's `RenderSubtree`). This is the same nesting limit as §7; the on-page embed returns "for free" once headers are fixed. Until then the advancement card lives on its own paired page (the fixture-5c behavior) — a deliberate change from Plan 4's body-appended card.
- **`retainer_page.go` retired.** Plan 4's `splitRetainerAdvancement` / `renderRetainerAdvancement` and their wiring in `buildStatblockIslandPage` are removed. Watch the shared helper `fbFeaturesFromRich` (also used there) — relocate it if needed, mirroring the 5c `fixture_page.go` retirement.
- **Bestiary / Browse categorization.** Retainers move from the `retainer.*` path to `monster.retainer.*`; update any path/type assumptions (`hoistStatblockPath`, `bestiaryItemType`, group landings, Browse index) the way 5c did for fixtures — confirm retainers still appear correctly in the Bestiary tab and Browse index.

## 7. Deferred: per-ability coding (blocked on a heading-infrastructure change)

Giving each individual ability its own `feature.ability.*` code requires every ability to be a **real section** in the document tree (the pipeline mints a page only for sections it walks; `ParsedContent.Children` is embed-only). In the Monsters book that is **structurally impossible today**: `collectDeepHeadings` maps every H7+ heading to level 6 and `ContextStack` rejects levels > 6, so an ability (H8) cannot nest *under* a statblock (H7) — they become siblings, and an ability has no statblock parent to inherit `<id>` context from. The clean fix (user direction, 2026-06-18) is to **rework the input doc's header levels** (and raise the level cap / preserve relative depth) so abilities nest properly — its own research + design + plan, on another day. Once that lands, per-ability coding (base + advancement + role → `feature.ability.retainer.<id>[.level-N]/<name>`) and companion-style on-page embedding both become straightforward. **Tracked as a ROADMAP item.**

## 8. Feature vs. ability (taxonomy guardrail)

Retainer advancement and role-advancement members are **abilities** (combat rigor — the book titles them "… Advancement **Ability**"), distinct from companion/fixture advancement *features*. The taxonomy is documented (`steel-etl/ANNOTATION-GUIDE.md` "Feature / ability / trait" callout; `steel-etl/CLAUDE.md` "Feature taxonomy"; `docs/superpowers/specs/2026-06-07-feature-taxonomy-design.md`). This plan respects it: (a) inline members keep ability structure in the card; (b) the deferred §7 coding mints `feature.ability.*` for them, never `feature.*`/`feature.trait.*`. The `advancement-features` kind segment is a container-role name, not a member-type claim.

## 9. Schema / SDK

The advancement + role containers are featureblock-shaped → covered by the existing `featureblock.schema.json` (both copies: `steel-etl/schemas` + `data-sdk-npm`). Confirm `internal/output/schema_validation_test.go` allowlist accepts them; no new discriminator expected (reuse `type: featureblock`). If any field is added, update **both** schema copies + the allowlist (dual-schema-sync rule).

## 10. Link re-sweep

Inbound `scc:` links to retainer codes ≈ 0 (verified 2026-06-18: `grep` for `retainer\.` in `scc:` links → 0). After re-mint, re-run the link pipeline + `validate` to confirm nothing dangles; regenerate `linking-reference.md` (the new containers become linkable targets).

## 11. Verification

- `devbox run -- go build ./... && go vet ./... && go test ./...` green (from `steel-etl/`, devbox-prefixed).
- `gen --all` + `steel-etl site --config ../v2/site.yaml` clean.
- `classify --diff`: only the intended retainer delta — 21 `retainer.statblock/*` removed; 21 `monster.retainer.statblock/*` + 21 `…advancement-features/*` + 9 `…role-advancement/*` added (registry **+30**). Record in `docs/scc-log.md`.
- Spot-check a built retainer page (e.g. Angulotl Hopper): statblock `.sb-wrap` card renders as before (innate abilities only); its `advancement-features` page renders a Forged Band card with Level-4/7/10 `.fb__band--adv` tiers preserving power rolls; the retainer index pairs them. A role page (e.g. Ambusher) renders its role abilities. Retainers appear under `monster/retainer/` in Browse + the Bestiary tab.
- No `sc-statblock-mount` regressions (islands stay retired).

## 12. Docs & bookkeeping (at implementation time)

- `docs/scc-log.md`: dated entry — retainers `retainer.statblock/*` → `monster.retainer.statblock/*`; new `…advancement-features` + `…role-advancement` containers (members inline); Plan 4 `retainer_page.go` retired; registry +30.
- `docs/scc-reference.md` + workspace `CLAUDE.md` SCC section: retainers now in the `monster.*` family; registry count; "Plan 6 (containers) done — per-ability coding deferred to the header-levels rework."
- `steel-etl/CLAUDE.md` + `docs/statblocks.md`: retainer parsing/routing now `monster.retainer.*`; advancement/role containers (inline members); Plan 4 retired; note the deferred per-ability coding + its header-level prerequisite.
- `DESIGN.md`: retainer advancement/role-advancement as Forged Band card instances (replace the Plan 4 site-split mention).
- `ROADMAP.md`: mark #9 **done** (container scope; reworded away from "collect H8 globally"); add follow-ups — (a) **header-levels rework → per-ability coding** (the §7 prerequisite + the per-member coding it unlocks for all featureblocks); (b) **stale-island-docs fix** (ROADMAP #7 / CLAUDE.md / statblocks.md still describe client-side islands though statblocks already render build-time `.sb-wrap`; 0 pages use `sc-statblock-mount`).
- Memory `featureblock-refactor-in-flight` / the featureblock-cards note: Plan 6 container scope shipped; per-ability coding deferred.

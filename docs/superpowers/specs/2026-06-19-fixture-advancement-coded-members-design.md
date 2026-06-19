# Fixture advancement features → coded members (companion model) — design

**Date:** 2026-06-19 · **Status:** approved design (decisions locked 2026-06-19), pre-implementation
**Scope:** steel-etl (Summoner-book source restructure for the 4 fixtures, featureblock + feature
parsers, classifier, site renderer/index) + link re-sweep + docs. Workspace-level spec — it
changes the **SCC scheme** (a workspace-level contract).
**Implements:** the narrowed first slice of ROADMAP #15. The original #15 ("header-levels rework
→ per-ability coding for statblocks & featureblocks") has been **scoped down** (2026-06-19): no
per-ability coding for monster/summoner **statblocks** and no per-feature coding for **retainers**
("juice isn't worth the squeeze"). The in-scope target is **player-controlled, featureblock-shaped**
content only — concretely the **4 summoner fixtures'** advancement features.
**Mirrors:** the beastheart **companion** advancement-features model (spec
`2026-06-13-companion-restructure-advancement-featureblocks-design.md`, Plan 5b). Fixtures adopt
that model **fully** — nested structure, coded child features, on-page embedding — for consistency.

---

## 1. Why (motivation)

The 4 summoner fixtures (`The Boil`/demon, `Primordial Crystal`/elemental, `Glade Pond`/fey,
`Barrow Gates`/undead) each carry an **advancement-features** block whose individual members
(`⭐️ Soul Rancor`, `⭐️ Size Increase`, …) have **no SCC identity**: today they are inline
blockquote members (`ParseRichFeatures` → `features[]`, uncoded), the malice/terrain/fixture
"inline members" model from Plan 5c.

Beastheart **companions** solve the exact same problem the right way: each advancement feature is
a real `@type: feature` child section with its own code (`feature.companion.<class>.<species>.level-N/<id>`),
embedded into the advancement card via `collectChildFeatures` and transcluded onto the companion's
own page via `embed_cards.go`. Fixtures are player-controlled summoned entities — a summoner player
needs to address "this fixture's level-5 advancement feature" by code — so they should get the same
treatment. This plan brings fixtures up to the companion model so their advancement members become
**individually coded** and **consistently structured/rendered** with companions.

## 2. Scope decision (locked 2026-06-19)

**In scope:** the **4 fixtures'** advancement-features members → individually coded `@type: feature`
sections (12 members total, see §3), mirroring companions in full (nesting + codes + on-page embed).

**Explicitly out of scope** (deferred / declined):
- **Per-ability coding for statblocks** — monster statblocks (458) *and* summoner minions/champions/rivals.
  Their abilities stay inline blockquotes, uncoded. (This is the bulk of the original #15; declined —
  not worth the cost, and it is the only thing that would require the heading-cap / `ContextStack`
  infrastructure change. That change is therefore **not** undertaken here.)
- **Per-feature coding for retainers** (Monsters book) — retainer base/advancement/role abilities stay
  as Plan 6 shipped them (inline/uncoded container members).
- **Fixture *base* abilities** (`⭐️ Hunger Thrush`, `⭐️ Oh, It Pops`, …) — these are statblock
  features, so per the rule above they **stay inline/uncoded** in the base statblock body. This is the
  one intentional divergence from companions (which code their base abilities as nested sections);
  confirmed acceptable 2026-06-19.

**Net effect:** +12 new `feature.*` codes; no statblock/`ContextStack`/`collectDeepHeadings` change.

## 3. The SCC scheme

All under `mcdm.summoner.v1`. The code is **base-inclusive**, mirroring the companion segment shape
`feature.companion.<class>.<species>.level-N/<id>` (class↔category, species↔base-fixture id) and the
existing fixture container `monster.fixture.<category>.advancement-features/<base-id>`:

```
feature.fixture.<category>.<base-id>.level-<N>/<member-id>
```

The 12 members:

| Fixture (category / base-id) | Code |
|---|---|
| demon / the-boil | `feature.fixture.demon.the-boil.level-5/soul-rancor` |
| | `feature.fixture.demon.the-boil.level-9/size-increase` |
| | `feature.fixture.demon.the-boil.level-9/fester-field` |
| elemental / primordial-crystal | `feature.fixture.elemental.primordial-crystal.level-5/terra-resonance` |
| | `feature.fixture.elemental.primordial-crystal.level-9/size-increase` |
| | `feature.fixture.elemental.primordial-crystal.level-9/magnified-strike` |
| fey / glade-pond | `feature.fixture.fey.glade-pond.level-5/garden-of-jest` |
| | `feature.fixture.fey.glade-pond.level-9/size-increase` |
| | `feature.fixture.fey.glade-pond.level-9/folly-field` |
| undead / barrow-gates | `feature.fixture.undead.barrow-gates.level-5/memento-mori` |
| | `feature.fixture.undead.barrow-gates.level-9/size-increase` |
| | `feature.fixture.undead.barrow-gates.level-9/open-the-gates` |

- **Base-inclusive is required** (decision 2026-06-19): a member like "Soul Rancor" belongs to *The
  Boil specifically*, so the base id is part of the kind, not just the category. (Although there is
  exactly one fixture per category today — so category alone would disambiguate — the base segment is
  the semantically correct, companion-consistent form and is future-proof.) The repeated
  `size-increase` across all four fixtures lives in four distinct `<category>.<base-id>` namespaces, so
  there is **no collision**.
- **Taxonomy:** members are `feature` (the book calls them "Fixture Advancement **Feature**"), not
  `ability`/`trait` — consistent with companion advancement *features*. `feature.fixture.*` parallels
  `feature.companion.*` (book source prefix already namespaces summoner vs. beastheart).
- **Unchanged codes:** the base `monster.fixture.<category>.featureblock/<base-id>` (×4) and the
  container `monster.fixture.<category>.advancement-features/<base-id>` (×4) keep their codes (the
  container only changes tree position, §6 — its classification inputs are unchanged).

## 4. Source restructure (`input/summoner/Draw Steel Summoner.md`, ×4 fixtures)

Adopt the companion structure: the advancement featureblock becomes a **child of the base** statblock,
and each advancement member becomes a real `@type: feature` heading section. This needs one more
heading level than today, so the whole fixture subtree shifts up into nestable (≤ H6) territory.
Everything stays ≤ H6, so `collectDeepHeadings`/`ContextStack` are **untouched**.

**Before** (The Boil; group H5, base H7, advancement H7, members inline):
```
<!-- @type: monster-group | @domain: fixture | @category: demon -->
##### Demon Portfolio Fixture
[lore]
<!-- @type: statblock -->
####### The Boil
*Hazard Support* / 2-col grid / > ⭐️ Hunger Thrush / > ⭐️ Oh, It Pops
<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features
> **Level 5 Fixture Advancement Feature**
> ⭐️ **Soul Rancor**
> [body]
> **Level 9 Fixture Advancement Feature**
> ⭐️ **Size Increase**
> [body]
> ⭐️ **Fester Field**
> [body]
```

**After** (group H3, base H4, advancement featureblock H5 nested under base, members H6):
```
<!-- @type: monster-group | @domain: fixture | @category: demon -->
### Demon Portfolio Fixture
[lore]
<!-- @type: statblock -->
#### The Boil
*Hazard Support* / 2-col grid / > ⭐️ Hunger Thrush / > ⭐️ Oh, It Pops      ← base abilities INLINE, unchanged
<!-- @type: featureblock | @id: the-boil -->
##### The Boil Advancement Features
<!-- @type: feature | @id: soul-rancor | @level: 5 -->
###### Soul Rancor
[body]
<!-- @type: feature | @id: size-increase | @level: 9 -->
###### Size Increase
[body]
<!-- @type: feature | @id: fester-field | @level: 9 -->
###### Fester Field
[body]
```

Notes / footguns:
- The `> **Level N Fixture Advancement Feature**` blockquote labels are **dropped** — the level now
  rides on each feature's `@level:` annotation (the companion form). (Contrast Plan 6 retainers, which
  kept blockquote `> **Level N …**` labels because their members stayed inline; here members become
  real sections, so the label becomes `@level:`.)
- Each member's body (the prose under the old `> ⭐️ **Name**`) moves verbatim under its new H6
  heading, **un-blockquoted**, as the feature body. Preserve any inline `scc.v1:` links exactly.
- The base statblock body (the 2-col grid + the `> ⭐️` inline base abilities) is **unchanged in
  content** — only its heading level changes (H7 → H4). Confirm `applyFixtureGrid` / `StatblockParser`
  still parse it identically at the shallower level (it keys on the body, not the heading level — §7
  verification).
- Repeat for elemental (`primordial-crystal`), fey (`glade-pond`), undead (`barrow-gates`).

## 5. Parser / classifier changes (no core-infra change)

1. **`FeatureblockParser` fixture branch** (`internal/content/monster.go`, the
   `domain == "fixture"` advancement-features branch ~line 233): replace the inline
   `fm["features"] = RichFeatureMaps(ParseRichFeatures(body))` with
   `fm["features"] = collectChildFeatures(section)` — the **exact** call the companion branch (~line
   217) already uses. The container code (`compactPath("monster","fixture",category,"advancement-features")`,
   `ItemID = section.ID()`) is unchanged.
2. **`FeatureParser`** (`internal/content/feature.go`): add a fixture branch parallel to the companion
   branch (~lines 114–129). When a `@type: feature` resolves a `domain == "fixture"` context, build
   `feature.fixture.<category>.<base-id>.level-N/<member-id>`:
   - `<category>` comes from the `@domain: fixture` monster-group context (the existing
     `statblockDomain(ctx, level)` helper returns domain+category).
   - `<base-id>` is the **enclosing featureblock's** slug. ⚠️ **Self-collision footgun:** the companion
     branch reads an ancestor via a *dedicated* key (`@companion`, which never appears on the child
     itself), so a plain `ctx.Lookup(level, "companion")` is safe. The fixture base-id is the
     featureblock's `@id`, but the member *also* has its own `@id` — so a naive `Lookup(level, "id")`
     returns the member's own id, not the base's. Resolve this one of two ways (implementer's choice,
     pick the cleaner): (a) look up `id` starting from the **parent** level (`section.HeadingLevel - 1`)
     so self is skipped; or (b) have the fixture advancement featureblock push a dedicated inheritable
     key (e.g. `@fixture: the-boil`) that children look up, exactly mirroring `@companion`. Option (b)
     is the closer companion mirror and avoids depending on `@id` propagation semantics.
   - `level-N` from the member's `@level:`; `<member-id>` from its `@id:`.
   - These members are plain `feature` (not `trait`/`ability`).
3. **No change** to `collectDeepHeadings` / `ContextStack` / the statblock parsers / the 458 monster
   statblocks. The flat level-6 model is left exactly as is.

## 6. Rendering & routing (adopt the companion model)

- **Advancement card — render-equivalent, now coded.** The advancement featureblock still renders as a
  Forged Band card (`buildFeatureblockPage` → `renderFeatureblockCard`, `.fb__band--adv` level tiers);
  its members now come from `collectChildFeatures` (coded child sections) instead of inline blockquotes.
  Each member heading carries a `{data-scc}` marker → per-heading permalink icon on the site.
- **On-page embedding — now enabled (companion parity).** Because the advancement featureblock is now a
  real **descendant** of the base fixture, `RenderSubtree` stamps its `{data-scc}` marker inside the base
  page body, and the existing `embed_cards.go` post-pass transcludes the advancement card inline on the
  base fixture's page (exactly as it does for companions). The advancement featureblock also keeps its
  own leaf page (it still has a code), same as companions.
- **Retire the fixture-specific pairing.** Plan 5c paired the sibling base+advancement as side-by-side
  folder cards via `buildAdvancementPairContent` and flattened the advancement path
  (`flattenAdvancementFeaturesPath`). With the companion (nested + embedded) model, the fixture
  advancement card lives **embedded on the base page** + its own leaf page — so the fixture branch of
  the pairing/flatten logic is removed (or made companion-shaped). Verify `hoistStatblockPath`,
  `bestiaryItemType` (base still a `"fixture"` facet; the advancement + member features excluded from
  the bestiary index), group landings, and the Browse tree still place fixtures correctly under
  `monster/fixture/<category>/…`.
- **SCC code stability:** moving the advancement featureblock from sibling to child does **not** change
  its code — domain/category still resolve from the H3 monster-group ancestor and `ItemID` is still the
  `@id` slug. Confirm with `classify --diff` (§7): the only deltas are the +12 new member features.

## 7. Schema / SDK

The advancement container is featureblock-shaped and already embeds `features[]` via the companion
path, so `featureblock.schema.json` (both copies: `steel-etl/schemas` + `data-sdk-npm`) already covers
it. Confirm `internal/output/schema_validation_test.go` allowlist accepts the fixture-with-child-features
variant (it already accepts the companion one). The new standalone `feature` leaves validate against the
existing feature schema. If any field is added, update **both** schema copies + the allowlist
(dual-schema-sync rule).

## 8. Link re-sweep

No inbound `scc:` links to these members exist today (they are new). After re-mint, re-run the link
pipeline + `validate` to confirm nothing dangles, and regenerate `steel-etl/docs/linking-reference.md`
(the 12 new feature codes become linkable targets). Optionally sweep the Summoner prose / the fixtures'
own cross-references to link the new member codes where the book references them.

## 9. Verification

- `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'` green.
- `gen --all` + `steel-etl site --config ../v2/site.yaml` clean.
- `classify --diff`: **only** the intended delta — +12 `feature.fixture.<cat>.<base>.level-N/<member>`
  codes; the 4 `monster.fixture.*.featureblock/*` and 4 `…advancement-features/*` codes **unchanged**;
  no statblock/retainer codes changed. Record in `docs/scc-log.md`.
- Registry count: previous + 12.
- Spot-check a built fixture page (The Boil): the base fixture card (`.fb-wrap` — fixtures are
  reclassified to `type: featureblock`, Plan 5c) renders as before (inline base abilities only); the
  advancement card renders Level-5/9 `.fb__band--adv` tiers with per-member
  permalink icons; the advancement card is **embedded inline on the base page** (companion parity) and
  also reachable as its own leaf; fixtures still appear under `monster/fixture/<category>/…` in Browse
  and as a `"fixture"` facet in the Bestiary tab.
- No `sc-statblock-mount` regressions (islands stay retired). No change to monster/retainer/minion/
  champion pages.

## 10. Docs & bookkeeping (at implementation time)

- `docs/scc-log.md`: dated entry — fixture advancement members now coded
  `feature.fixture.<cat>.<base>.level-N/<member>` (×12); fixtures adopt the companion nested+embedded
  model; Plan 5c fixture pairing retired; registry +12.
- `docs/scc-reference.md` + workspace `CLAUDE.md` SCC section: fixtures' advancement members are coded
  features (companion-style); registry count.
- `steel-etl/CLAUDE.md` + `docs/statblocks.md`: fixture advancement parsing now uses
  `collectChildFeatures` (coded child features) + companion-style on-page embedding; Plan 5c pairing
  retired; note base abilities remain inline (intentional divergence from companions).
- `DESIGN.md`: fixture advancement card now an embedded (companion-style) Forged Band instance.
- `ROADMAP.md`: record #15 narrowed — statblock/retainer per-ability coding declined; this fixture slice
  shipped. Keep #15's number per the permanent-id rule.
- Memory `featureblock-refactor-in-flight`: fixture members coded; statblock/retainer per-ability
  coding declined.

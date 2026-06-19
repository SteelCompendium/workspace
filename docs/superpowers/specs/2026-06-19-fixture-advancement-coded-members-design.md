# Fixture advancement features → coded members — design

**Date:** 2026-06-19 · **Status:** approved design — **redesigned 2026-06-19** after discovering the
original "re-level to H3" approach violated source faithfulness (see §2). Pre-implementation.
**Scope:** steel-etl (Summoner-book source annotation for the 4 fixtures, featureblock parser,
a new pipeline "classify parser-emitted coded children" capability, site renderer/index) + link
re-sweep + docs. Workspace-level spec — it changes the **SCC scheme** (a workspace-level contract).
**Implements:** ROADMAP **#16** (split out 2026-06-19 from #15). It is the first concrete slice of the
old #15 ("header-levels rework → per-ability coding") and **proves the annotation/parser-emitted-children
mechanism that #15 had written off as dead** (see §2.1). The remaining per-ability work (statblock
abilities, malice/terrain members, retainer abilities) stays in #15, deferred by scope choice.
**Relation to companions:** fixtures get the same *outcome* as beastheart companions — individually
coded advancement members, embedded on the base page — but by a **different mechanism** (see §2.2),
because the summoner book's faithful heading structure does not give fixtures the nesting depth
companions have.

---

## 1. Why (motivation)

The 4 summoner fixtures (`The Boil`/demon, `Primordial Crystal`/elemental, `Glade Pond`/fey,
`Barrow Gates`/undead) each carry an **advancement-features** block whose individual members
(`⭐️ Soul Rancor`, `⭐️ Size Increase`, …) have **no SCC identity**: today they are inline
blockquote members (`ParseRichFeatures` → `features[]`, uncoded), the malice/terrain/fixture
"inline members" model from Plan 5c.

Fixtures are player-controlled summoned entities — a summoner player needs to address "this fixture's
level-5 advancement feature" by code — so each advancement member should mint its own SCC code and
resolve to its own page, the same identity companion advancement features already have.

## 2. Design decisions (the redesign — read this before the mechanics)

The original spec proposed re-leveling the fixture subtree from its faithful book levels (group H5,
statblock/advancement H7) up to H3/H4/H5/H6 so the advancement block would nest under the base and
its members would nest under the advancement — the literal beastheart-companion structure. **That was
rejected 2026-06-19** on two grounds:

1. **Source faithfulness is binding.** The input doc's *prose* heading levels must mirror the PDF
   outline. In the book, `### 2nd-Level Features` → `#### Summoner's Dominion` → `##### <X> Portfolio
   Fixture` is the real hierarchy; the fixture group is genuinely an H5, with `#### New Portfolio
   Minion` + its minion statblocks as the following H4 sibling. Promoting the fixture groups to H3
   would misrepresent the book **and** re-parent New Portfolio Minion (and all its minions) under the
   Undead fixture. (Annotations were adopted partly *to keep the input faithful to the PDF* — so an
   approach that fights the PDF's outline is the wrong call.)
2. **The advancement block is a sibling, not a child.** The "<X> Advancement Features" featureblock is
   a **separate entity** that merely sits next to the base statblock under the monster-group — exactly
   like the Monsters-book malice featureblock sits beside its statblocks in a group. It is *not* a
   sub-component of the statblock. So there is no structural reason to nest it under the base.

### 2.1 The level-6 cap is the wall — and why we route around it instead of through it

`ContextStack` is hard-capped at H1–H6 (`internal/context/stack.go`, a `[7]Metadata`), and
`collectDeepHeadings` (`internal/parser/document.go`) maps **every** H7+ heading to level 6 (and drops
H8 entirely). With the fixture group faithfully at H5, the base statblock, the advancement block, and
any member heading all land at **level 6 as siblings** — there is exactly **one** usable nesting level
beneath the group. Therefore a member can **never** become a true tree-child of the advancement block
without either (a) the illegal re-leveling above, or (b) raising the cap (the cross-cutting
`collectDeepHeadings`/`ContextStack` rework that ROADMAP #15 describes and that was judged "not worth
the squeeze").

ROADMAP #15 concluded from this that **both** candidate mechanisms were dead — nested ability sections
*and* "synthesizing coded children from blockquotes" — because `ParsedContent.Children` is embed-only
(the pipeline mints a page only for a real section in the document tree). **That conclusion was too
strong.** We do **not** need tree-nesting to give a member a code: we add a small, reusable pipeline
capability — **classify parser-emitted coded children** — so a parser can hand back extra coded
entities (each with its own `TypePath`/`ItemID`/body) that the pipeline registers and writes as leaf
pages, exactly as if they had been their own sections. The advancement `FeatureblockParser` already
parses its blockquote members (name + level + body); it now also emits each as a coded child. No
heading re-leveling, no cap change, no `ContextStack`/`collectDeepHeadings` edit.

### 2.2 Locked decisions

- **Source stays faithful.** No heading levels change. Group H5, base statblock H7, advancement
  featureblock H7 (or a plain H6 child of the group — purely a readability choice, same internal
  level) — all unchanged.
- **Members stay as `> ⭐️ **Name**` blockquotes** inside the advancement block, with a per-member
  **inline annotation comment** (`<!-- @type: feature | @id: <slug> | @level: <N> -->`) the parser
  reads from the featureblock body. Converting members to `> ###### Name` blockquote-headings is
  **explicitly out of scope** (can revisit later). (Annotations are HTML comments — invisible in the
  rendered output — so they do not affect PDF faithfulness, which is about heading *levels*.)
- **Each member mints its own code and its own leaf page** containing just that feature — **not** a
  redirect to the parent featureblock (user decision 2026-06-19).
- **The advancement card embeds on the base statblock's page at build time** (not a render-time
  island), so the player sees the fixture's advancement features on the fixture's own page.
  **Implementation note (shipped 2026-06-19):** the embed is *additive* — the Plan-5c group-index
  base+advancement *pairing* is **kept**, not retired. (This spec originally said retire it; during
  implementation we confirmed beastheart companions keep BOTH the index pairing and the on-page
  embed, so fixtures match for full parity.)
- **No companion-style in-card nesting of members.** Because members are not tree-children of the
  advancement block, they render as the advancement card's Level-5/9 tiers (today's look) with a
  per-member permalink anchor, **and** as their own leaf pages — rather than as nested child sections
  embedded via `collectChildFeatures`. This is the one behavioural difference from companions; it is a
  consequence of the cap, and accepted.

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
  Boil specifically*, so the base id is part of the kind, not just the category. The repeated
  `size-increase` across all four fixtures lives in four distinct `<category>.<base-id>` namespaces, so
  there is **no collision**.
- **Taxonomy:** members are `feature` (the book calls them "Fixture Advancement **Feature**"), not
  `ability`/`trait` — consistent with companion advancement *features*. `feature.fixture.*` parallels
  `feature.companion.*`.
- **Unchanged codes:** the base `monster.fixture.<category>.featureblock/<base-id>` (×4) and the
  container `monster.fixture.<category>.advancement-features/<base-id>` (×4) keep their codes — only
  the rendering changes (pairing → embed), and their classification inputs are unchanged.

## 4. Source changes (`input/summoner/Draw Steel Summoner.md`, ×4 fixtures)

**No heading levels change.** The only edit is adding a per-member inline annotation comment so the
parser can mint each member's code. Keep the `> **Level N Fixture Advancement Feature**` labels and the
`> ⭐️ **Name**` member blockquotes exactly as they are. Preserve every inline `scc.v1:` link verbatim.

**Before** (The Boil advancement block, current source):
```
<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
> ⭐️ **Soul Rancor**
>
> You gain a [surge]… the first time in a round that your demon minions…

> **Level 9 Fixture Advancement Feature**
>
> ⭐️ **Size Increase**
>
> The boil is now size 3.
>
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy that starts their turn within 3 squares…
```

**After** (identical structure + heading level; one annotation comment added per member):
```
<!-- @type: featureblock | @id: the-boil -->
####### The Boil Advancement Features

> **Level 5 Fixture Advancement Feature**
>
<!-- @type: feature | @id: soul-rancor | @level: 5 -->
> ⭐️ **Soul Rancor**
>
> You gain a [surge]… the first time in a round that your demon minions…

> **Level 9 Fixture Advancement Feature**
>
<!-- @type: feature | @id: size-increase | @level: 9 -->
> ⭐️ **Size Increase**
>
> The boil is now size 3.
>
<!-- @type: feature | @id: fester-field | @level: 9 -->
> ⭐️ **Fester Field**
>
> Each non-abyssal enemy that starts their turn within 3 squares…
```

Notes / footguns:
- The annotation comment sits **between** the `> **Level N …**` label and the `> ⭐️ **Name**` blockquote
  (or immediately before each `⭐️` member). It is parsed by the `FeatureblockParser` from its own body
  — it does **not** rely on the document-level annotation→heading association (members are not headings).
  Because there is always blockquote prose between the last member annotation and the next real heading
  (the next fixture group), the standard backward-scan association cannot mis-attach a member annotation
  to a following section — but verify (§9) no spurious association appears.
- `@id` is the slugified member name (`Soul Rancor` → `soul-rancor`); `@level` matches the `> **Level N
  …**` band it sits under. Both are explicit (not derived) so renames/edits stay robust.
- The base statblock body (grid + `> ⭐️` base abilities) is **unchanged** — base abilities stay
  inline/uncoded (statblock features; the intentional divergence from companions, confirmed acceptable).
- Repeat for elemental (`primordial-crystal`), fey (`glade-pond`), undead (`barrow-gates`).

## 5. Parser / classifier changes

1. **New pipeline capability — classify parser-emitted coded children.** Add a field to
   `content.ParsedContent` for **coded children** (distinct from the existing embed-only
   `Children map[string]*ParsedContent`; e.g. `Members []*ParsedContent`, each carrying its own
   `Frontmatter`/`Body`/`TypePath`/`ItemID`). After the pipeline classifies + records a section's own
   code (`internal/pipeline/pipeline.go` walk, ~line 173), it iterates the parent's coded children:
   `scc.Classify` each, register it, detect duplicates, set `scc` frontmatter, and add it to the
   deferred `pending` writes so each gets a leaf page (its `PageBody` rendered like any other leaf).
   This is the small, reusable mechanism that unblocks coded blockquote members generally (it is the
   "synthesize coded children from blockquotes" path #15 had written off — see §2.1).
   **The same `CodedChildren` handling must also be added to `pipeline.CollectSCCCodes` (`collect.go`)**
   — the separate parse+classify walk that `validate --scc-stable` uses; otherwise the new member codes
   look "missing" from the stability check (found during implementation 2026-06-19).
2. **`FeatureblockParser` fixture branch** (`internal/content/monster.go`, the `domain == "fixture"`
   advancement-features branch, ~line 233): keep emitting `fm["features"] = RichFeatureMaps(...)` for
   the card, **and** also emit each member as a coded child. The parser reads the per-member inline
   annotations from its body to get `@id`/`@level`, builds each child's
   `TypePath = feature/fixture/<category>/<base-id>/level-<N>` (category from `statblockDomain(ctx)`,
   base-id from the featureblock's own `@id`/`ItemID`) and `ItemID = <member-id>`, with
   `Frontmatter{name, type: feature, level, fixture: <base-id>, category}` and `Body` = the member's
   prose. The container code (`monster.fixture.<category>.advancement-features/<base-id>`) and
   `ItemID` are **unchanged**.
3. **No `FeatureParser` change.** Members are not standalone `@type: feature` sections, so the
   feature-path branch the original plan added is **not** needed.
4. **No `collectDeepHeadings` / `ContextStack` / statblock-parser change.** The flat level-6 model is
   untouched; this slice deliberately does the infra-free path (§2.1).

## 6. Rendering & routing

- **Advancement card — render-equivalent, now coded.** The advancement featureblock still renders as a
  Forged Band card (`.fb__band--adv` Level-5/9 tiers) from its `features[]`. Each member tier heading
  carries a `{data-scc}` marker keyed to its member code → a per-member permalink icon on the site.
- **On-page embed on the base statblock page (build time).** The advancement card is transcluded inline
  onto the base fixture's page by the existing `embed_cards.go` `{data-scc}` post-pass. Because the
  advancement block is a **sibling** of the base (not a descendant), the base page must carry the
  advancement code's embed marker — inject it at build time (the base fixture page references its paired
  `…advancement-features/<base-id>` code). Confirm `embed_cards.go` then transcludes the finished
  advancement card beneath the base card.
- **Member leaf pages.** Each member code resolves to its own leaf page containing just that feature
  (user decision 2026-06-19), rendered as a `feature`/`.sc-trait` card from the child's body. Member
  permalink stubs (`/scc/<member-code>/`) point at that leaf page.
- **Pairing kept (shipped correction).** The fixture base+advancement group-index pairing
  (`buildAdvancementPairContent` / `flattenAdvancementFeaturesPath`) is **kept** — companions keep it
  alongside their on-page embed, so fixtures match. The embed was added via a single new helper
  `embedFixtureAdvancement` (`build.go`) that appends the advancement code's `{data-scc}` marker to the
  base page (the advancement is a parse-sibling, so `RenderSubtree` doesn't carry it) for the existing
  `embed_cards.go` post-pass to transclude. No change to `buildAdvancementPairContent`/`flatten`.
- **Bestiary facets unchanged.** Each base fixture stays a `"fixture"` facet; the advancement-features
  container **and** the new `feature.fixture.*` member leaves are excluded from the bestiary index.
- **SCC code stability:** none of the base/container codes change (rendering-only change).

## 7. Schema / SDK

The advancement container already embeds `features[]` (covered by `featureblock.schema.json`, both
copies). The new member leaves are plain `feature` documents and validate against the existing feature
schema. Confirm `internal/output/schema_validation_test.go` accepts them; if any field is added, update
**both** schema copies + the allowlist (dual-schema-sync rule).

## 8. Link re-sweep

No inbound `scc:` links to these members exist today (they are new). After mint, re-run the link
pipeline + `validate` to confirm nothing dangles, and **hand-add** the 12 new codes to
`steel-etl/docs/summoner-linking-reference.md` (the curated, canonical reference — the old generator was
retired). Optionally sweep the Summoner prose to link the new member codes where the book references them.

## 9. Verification

- `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'` green.
- `gen --all` + `steel-etl site --config ../v2/site.yaml` clean; no spurious annotation→heading
  mis-association (the member annotations must classify as members, not leak onto a following section).
- `classify --diff`: **only** the intended delta — +12 `feature.fixture.<cat>.<base>.level-N/<member>`
  codes; the 4 `monster.fixture.*.featureblock/*` and 4 `…advancement-features/*` codes **unchanged**;
  no statblock/retainer/minion/champion/rival codes changed. Record in `docs/scc-log.md`.
- Registry count: previous + 12.
- Spot-check The Boil's built page: base fixture card (inline base abilities only); advancement card
  with Level-5/9 tiers + per-member permalink icons, **embedded inline on the base page**; each member
  reachable at its own `/scc/<code>/` leaf page; fixtures still under `monster/fixture/<category>/…` in
  Browse and as a `"fixture"` facet in the Bestiary tab. No `sc-statblock-mount` islands. No change to
  monster/retainer/minion/champion pages.

## 10. Docs & bookkeeping (at implementation time)

- `docs/scc-log.md`: dated entry — fixture advancement members now coded
  `feature.fixture.<cat>.<base>.level-N/<member>` (×12); fixtures keep faithful headers; members coded
  via parser-emitted coded children (new pipeline capability) + inline annotations; advancement card now
  **embedded on the base page** (Plan-5c pairing retired); registry +12.
- `docs/scc-reference.md` + workspace `CLAUDE.md` SCC section: fixtures' advancement members are coded
  features (`feature.fixture.<cat>.<base>.level-N/<member>`); registry count.
- `steel-etl/CLAUDE.md` + `docs/statblocks.md`: fixture advancement members coded via the parser-emitted
  coded-children mechanism (no heading/cap change); advancement card embedded on the base page; Plan-5c
  pairing retired; base abilities remain inline (intentional divergence from companions).
- `DESIGN.md`: fixture advancement card now an embedded (companion-style placement) Forged Band instance.
- `ROADMAP.md`: #16 shipped; #15 narrowed (its "blockquote children are dead" framing corrected — see
  §2.1; per-ability statblock coding remains a deferred scope decision).
- Memory `featureblock-refactor-in-flight`: fixture members coded; the parser-emitted-coded-children
  mechanism now exists and generalizes; statblock/retainer per-ability coding still deferred (#15).

# Fixture Featureblock Restructure Implementation Plan (Featureblock Plan 5c)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. This plan is written for a FRESH session — re-read the cited files; do not assume prior context.

**Goal:** Restructure the 4 Summoner fixtures from `fixture.<element>.statblock/<id>` (a `type: statblock` routed to a card via Plan 3) into the `monster.fixture.<element>.*` family as real **featureblocks**: a base `monster.fixture.<element>.featureblock/<id>` (`type: featureblock`) plus a sibling `monster.fixture.<element>.advancement-features/<id>` carrying the Level-5/9 advancement features — parallel to the companion 5a/5b scheme.

**Architecture:** Plan 5c of the companion-restructure-advancement effort (spec: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md` §4). Fixtures are **featureblocks** (loose Stamina/Size header + feature list), so they get the same kept-kind scheme as companions: base `…featureblock/<id>` + sibling `…advancement-features/<id>`, members **inline** (`features[]`, no per-feature codes — the malice/terrain model, unlike companions whose members are separately coded). **Zero inbound `scc:` links to fixtures** (verified Plan 5b prep) so the re-mint dangles nothing. `freeze:false` → clean rebuild. This work **retires Plan 3's `internal/site/fixture_page.go` routing** (the base now renders as a plain `type: featureblock` page through `buildFeatureblockPage`).

**Tech Stack:** Go (steel-etl `internal/content`, `internal/site`), source markdown (`input/summoner`), table-driven Go tests. devbox: prefix every Go command with `devbox run -- go -C steel-etl …`. Continue on branch `steel-etl@feat/companion-scc-restructure` (5a+5b live there) OR a fresh `feat/fixture-featureblock-restructure` branched from it — executor's choice; keep all of Plan 5 on one lineage so 5d bumps the pointer once.

---

## Context: the fixture source + current behavior (READ THESE FIRST)

- **Source** (`input/summoner/Draw Steel Summoner.md`, the 4 fixtures ~lines 1488–1610). Each fixture is:
  ```
  <!-- @type: monster-group | @domain: fixture | @category: demon -->
  ##### Demon Portfolio Fixture          (H5 monster-group: sets @domain:fixture @category:demon context)
  <intro prose>
  <!-- @type: statblock -->
  ####### The Boil                       (H7 statblock)
  *Hazard Support*                        (italic role line → role/terrain_type via applyFixtureGrid)
  | **Stamina:** 20 + your level | **Size:** 2 |   (2-col grid)
  > ⭐️ **Hunger Thrush**                  (Level-0 base feature blockquote)
  > ⭐️ **Oh, It Pops**
  > **Level 5 Fixture Advancement Feature**   (advancement label blockquote)
  > ⭐️ **Soul Rancor**
  > **Level 9 Fixture Advancement Feature**
  > ⭐️ **Size Increase**
  > ⭐️ **Fester Field**
  ```
  The 4 fixtures: `the-boil`/demon, `primordial-crystal`/elemental, `glade-pond`/fey, `barrow-gates`/undead. **Confirm exact ids/headings by reading the source.**
- **Current codes:** `fixture.<element>.statblock/<id>` (4 total). Built by `StatblockParser` (`internal/content/monster.go:70`): `statblockDomain(ctx)` returns `domain="fixture"` (from `@domain: fixture`), `category=<element>`; typePath = `compactPath(domain, category, subcategory, "statblock")` = `fixture.<element>.statblock`. The `if domain == "fixture"` branch already sets `fm["statblock_kind"]="fixture"` and calls `applyFixtureGrid` (parses the 2-col grid → `stamina`/`size`, the italic role line → `role`/`terrain_type`).
- **Current rendering:** `fixture.*.statblock` pages are `type: statblock` + `statblock_kind: fixture`; Plan 3's `internal/site/fixture_page.go` (`buildFixturePage`) routes them to the Forged Band card (adapting frontmatter + `ParseRichFeatures(body)` with `.fb__band--adv` Level-5/9 bands). This whole adapter becomes unnecessary after 5c.
- **Shared mechanics (reuse, do NOT rebuild):** `ParseRichFeatures(body)` attaches `Level` from `> **Level N … Advancement Feature**` labels (`fbLevelLabelRe`, Plan 1). `RichFeatureMaps`. `compactPath`. `buildFeatureblockPage` renders `type: featureblock` pages (Plan 2); `renderFbFeats` groups `Level>0` into `.fb__band--adv` (Plan 3). The companion 5b `FeatureblockParser` companion branch is the pattern for adding a fixture branch.

### Target (per fixture, ×4)

| Entity | Today | Target |
|---|---|---|
| base | `fixture.demon.statblock/the-boil` (`type: statblock`) | `monster.fixture.demon.featureblock/the-boil` (`type: featureblock`) |
| advancement (new) | *(Level-5/9 inline in base)* | `monster.fixture.demon.advancement-features/the-boil` |
| members | inline (uncoded) | inline `features[]` (uncoded) — split by level |

**Design decision (advancement split): source restructure (parallel to companions/retainers).** Move the `> **Level 5/9 Fixture Advancement Feature**` blockquotes out of the statblock body into a **sibling** `@type: featureblock | @id: <fixture-id>` section ("`####### <Fixture> Advancement Features`") under the same monster-group. This avoids one-section→two-entity pipeline surgery and mirrors 5b. The base statblock keeps only Level-0 features.

---

## Task 1: Base fixture → `monster.fixture.<element>.featureblock` (`type: featureblock`)

Change the `StatblockParser` fixture branch so a `@domain: fixture` statblock classifies as a featureblock.

**Files:** `internal/content/monster.go` (`StatblockParser.Parse`, the `if domain == "fixture"` branch ~line 131); test `internal/content/content_test.go`.

- [ ] **Step 1 (test, RED):** add a test: a `@type: statblock` section under `@domain: fixture | @category: demon` context, id `the-boil`, body with the 2-col grid + base blockquotes, asserts: `scc.Classify(...)` == `mcdm.summoner.v1/monster.fixture.demon.featureblock/the-boil`; `fm["type"] == "featureblock"`; `stamina`/`size` still parsed (applyFixtureGrid preserved); `features[]` present with the Level-0 base features.
- [ ] **Step 2:** run → FAIL (`fixture.demon.statblock/the-boil`, `type: statblock`).
- [ ] **Step 3 (impl):** in the `if domain == "fixture"` branch: set `fm["type"] = "featureblock"`; drop `statblock_kind` (no longer needed); after `applyFixtureGrid`, populate `fm["features"] = RichFeatureMaps(ParseRichFeatures(body))`; and **return early** with `TypePath: compactPath("monster", "fixture", category, "featureblock")`, `ItemID: id`. Keep `applyFixtureGrid` for stamina/size/role/terrain_type → those become the featureblock's loose `stats[]`/eyebrow (confirm `fbDoc` reads `stamina`/`size`; if the fb card wants a `stats[]` array, map them like `fixtureStats` did in `fixture_page.go`). The non-fixture statblock path is unchanged.
- [ ] **Step 4:** run → PASS.
- [ ] **Step 5:** `devbox run -- go -C steel-etl test ./internal/content/...` → PASS.
- [ ] **Step 6:** commit `feat(scc): summoner fixture base -> monster.fixture.<element>.featureblock`.

> NOTE: at this point the base still contains the Level-5/9 blockquotes (so its `features[]` includes them as `.fb__band--adv` bands, like Plan 3). Task 2 splits them out. If you prefer, gate the split on Task 2's source change and keep Task 1 green by asserting only the base code/type/stamina.

## Task 2: Source restructure — split advancement into a sibling section (×4)

**Files:** `input/summoner/Draw Steel Summoner.md`.

- [ ] **Step 1:** For each of the 4 fixtures, cut the `> **Level 5 Fixture Advancement Feature**` … through end-of-statblock-body blockquotes out of the `@type: statblock` section and paste them into a NEW sibling section immediately after it, under the same `##### <X> Portfolio Fixture` monster-group:
  ```
  <!-- @type: featureblock | @id: the-boil -->
  ####### The Boil Advancement Features

  > **Level 5 Fixture Advancement Feature**
  > ⭐️ **Soul Rancor** …
  > **Level 9 Fixture Advancement Feature**
  > ⭐️ **Size Increase** …
  > ⭐️ **Fester Field** …
  ```
  The `@id` must equal the base fixture id (`the-boil`) so the codes share an item. (Confirm each fixture's id from its base `####### <Name>` heading slug.) Use a script or careful manual edits; **verify the base statblock body now ends at the last Level-0 feature.**
- [ ] **Step 2:** regenerate (`gen --all`) and confirm the base fixture `features[]` now has ONLY Level-0 features (no Level-5/9). Do not commit until Task 3 classifies the new sibling.

## Task 3: `FeatureblockParser` fixture-advancement branch

**Files:** `internal/content/monster.go` (`FeatureblockParser.Parse`); test `content_test.go`.

- [ ] **Step 1 (test, RED):** a `@type: featureblock | @id: the-boil` section under `@domain: fixture | @category: demon`, body = the Level-5/9 advancement blockquotes, asserts code == `mcdm.summoner.v1/monster.fixture.demon.advancement-features/the-boil`, `type: featureblock`, and `features[]` has the Level-5/9 features (with `level` 5 and 9 from `ParseRichFeatures`).
- [ ] **Step 2:** run → FAIL (malice fallback path → `monster.demon/the-boil` or similar).
- [ ] **Step 3 (impl):** in `FeatureblockParser.Parse`, add a fixture branch (AFTER the 5b companion branch, BEFORE the malice default): when `domain, _, _ := statblockDomain(ctx, level); domain == "fixture"`, build `TypePath: compactPath("monster", "fixture", category, "advancement-features")`, `ItemID: section.ID()` (= `the-boil`), `features[]` from `ParseRichFeatures(body)`. Return early. (Malice/terrain/companion branches untouched.)
- [ ] **Step 4–5:** run target test + full content package → PASS.
- [ ] **Step 6:** commit `feat: summoner fixture advancement-features featureblock (source + parser)` (include `input/` + `monster.go` + tests).

## Task 4: Retire Plan 3 fixture routing + dispatch check

**Files:** `internal/site/fixture_page.go`, `internal/site/build.go`, `internal/site/statblock_page.go`, tests.

- [ ] **Step 1:** Fixtures are no longer `type: statblock`, so `buildFixturePage` (Plan 3) is dead. Remove its dispatch from `build.go buildSection` and delete `internal/site/fixture_page.go` + `fixture_page_test.go` — BUT first confirm `fbFeaturesFromRich` (defined there, reused by `retainer_page.go` Plan 4!) is moved, not lost. Run `grep -rn 'fbFeaturesFromRich' internal/site/` — if `retainer_page.go` uses it, relocate `fbFeaturesFromRich` into `featureblock_page.go` (or keep a trimmed `fixture_page.go` with just that helper). Also remove the fixture guard in `buildStatblockIslandPage` (the `statblock_kind == "fixture"` early return) since fixtures are no longer statblocks.
- [ ] **Step 2:** `devbox run -- go -C steel-etl build ./... && devbox run -- go -C steel-etl test ./...` → green.
- [ ] **Step 3:** commit `refactor(site): retire fixture_page adapter; fixtures render as plain featureblocks`.

## Task 5: Regenerate, verify codes + cards, SCC

- [ ] **Step 1:** `gen --all`; assert: 4 `monster.fixture.<element>.featureblock/<id>` + 4 `monster.fixture.<element>.advancement-features/<id>` codes; **zero** `fixture.<element>.statblock/*` codes left; registry total = previous + 8 − 4 (4 base re-pathed, 4 advancement new → net +4). Confirm via `grep`.
- [ ] **Step 2:** `steel-etl site --config ../v2/site.yaml`; for each fixture, the base page (`v2/docs/Browse/monster/fixture/<element>/<id>.md`) and the advancement page both contain `class="fb-wrap"`; the advancement page has `data-level="5"`/`"9"` bands. The base page has NO `.sc-statblock-mount` island.
- [ ] **Step 3:** check the **Bestiary browser / group landings** still place fixtures correctly (they were `fixture.*.statblock`; now `monster.fixture.*`). Run `grep -rn 'fixture' internal/site/bestiary_*.go internal/site/cards*.go` and confirm any `fixture` type/path assumptions are updated. Fix + test if the Bestiary tab or Browse index miscategorizes them.
- [ ] **Step 4:** `classify --diff` shows only the intended fixture delta (4 removed `fixture.*.statblock`, 8 added `monster.fixture.*`). Schema: `type: featureblock` validates (Task verifies `internal/output` green).
- [ ] **Step 5:** commit any site/bestiary fixes.

## Task 6: Docs + bookkeeping

- [ ] `docs/scc-log.md`: 2026-06-14 entry — fixtures `fixture.<element>.statblock` → `monster.fixture.<element>.featureblock` + new `…advancement-features`; Plan 3 `fixture_page.go` retired; zero inbound links; net +4 codes.
- [ ] `steel-etl/CLAUDE.md` + `docs/statblocks.md`: fixtures are now `monster.fixture.*` featureblocks (base + advancement), rendered by `buildFeatureblockPage` (Plan 3 adapter retired). Workspace `CLAUDE.md` SCC bullet: 5c shipped; registry count.
- [ ] `DESIGN.md`: fixtures render via the featureblock card path directly (drop the `fixture_page.go` mention).
- [ ] Memory `project_featureblock_cards.md`: 5c shipped; remaining 5d, Plan 6.
- [ ] Commit docs (steel-etl branch + workspace). Do NOT bump the steel-etl pointer (Plan 5d).

## Self-Review notes (spec coverage)
- Spec §4 fixture scheme (`monster.fixture.<element>.featureblock` + `…advancement-features`, `type: featureblock`, kept-kind, inline members) → Tasks 1–3.
- Spec §5 "fixture base renders as a plain featureblock page; advancement as a separate entity card" → Tasks 1, 3, 5; Plan 3 retired (Task 4).
- "champion/minion/rival untouched" → only the `@domain: fixture` branches change; champion/minion are different domains.
- Risks flagged: `fbFeaturesFromRich` shared with retainer_page (Task 4 Step 1); Bestiary/Browse categorization (Task 5 Step 3); confirm `fbDoc` consumes stamina/size for the fixture loose header.

## Execution Handoff
Fresh session, subagent-driven. Order 1→2→3→4→5→6 (2 before 3; 4 after 3). Task 2 (source split ×4) is a careful controller/implementer edit, regen-verified. After 5c, only Plan 5d (deploy) and Plan 6 (retainers) remain.

## Status — SHIPPED 2026-06-14 (on `steel-etl@feat/companion-scc-restructure`, NOT merged/deployed)

All tasks done. Commits on the branch: `5de88d7` (Task 1 base parser + Task 3 advancement branch + tests), `1cf94cd` (Task 2 source split), `699402f` (review polish — dropped dead `statblock_kind` delete, strengthened advancement test), `3057d01` (Task 4 — `fixture_page.go` retired), `09b3fc1` (Task 5 — `hoistStatblockPath` featureblock hoist + `bestiaryItemType` fixture facet + tests), plus a workspace docs commit (Task 6).

- **Codes:** 8 fixture codes (4 `monster.fixture.<element>.featureblock/<id>` + 4 `…advancement-features/<id>`); zero `fixture.*.statblock` remain. Registry 3011 → **3015** (net +4).
- **Site:** base renders `.fb-wrap`, no statblock island; advancement page has Level-5/9 `.fb__band--adv` bands; base sits at `Browse/monster/fixture/<element>/<id>`, advancement at `…/advancement-features/<id>`; all 4 fixtures appear in the Bestiary search island as `"type":"fixture"`.
- **Design decisions made during execution:** (1) Tasks 1–3 implemented as one cohesive TDD unit (the Task 1 NOTE's sanctioned path) to avoid a broken intermediate. (2) User chose (2026-06-14) to **keep fixtures searchable** in the Bestiary (as a `"fixture"` facet) rather than browse-only. (3) The `featureblock/` hoist is scoped to `monster/fixture/` so a future `featureblock` segment in another bestiary tree isn't silently dropped.
- **Verified:** `go build ./...` + `go test ./...` green; `gen --all` + `site` clean. Reviews: spec ✅ + code-quality ✅ (data layer); code-quality ✅ (site fixes).
- **Remaining:** Plan 5d (deploy — merge branch, SDK sync (likely no-op), bump pointer, `just deploy`, verify live). Then Plan 6 (retainers).

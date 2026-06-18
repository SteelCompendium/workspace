# Completed follow-ups — archived 2026-06-18

Items pruned from [`FOLLOWUPS.md`](../../FOLLOWUPS.md) once finished. Kept here for
provenance (the detail fields save the next person a grep). Original FOLLOWUPS numbers
are noted; they do not correspond to the current numbering in the live file.

---

## `transform_indexes.py` is dead code for the current card index pages (was FOLLOWUPS #1)

**Status:** **done 2026-06-18.** Confirmed zero `Index.md`/`_Index.md` matches under
`v2/docs/Browse`, so the step was a no-op. Removed it from all three justfile blocks
(workspace `justfile` `deploy` + `deploy-v2`, `v2/justfile` `update`, with steps
renumbered), `git rm`'d `v2/scripts/transform_indexes.py` (the now-empty `scripts/` dir
went with it), and dropped its mention from `ARCHITECTURE.md` (the "Index transforms
(Python)" stage is gone; pipeline steps renumbered) and `docs/git-workflow.md`. Historical
dated plans that reference the script are left untouched (frozen history). Both justfiles
re-validated with `just --list`.

- **Identified:** 2026-06-04, card markdown-rendering / `.md`-link fix
- **What:** `v2/scripts/transform_indexes.py` (run as step 4 of the `just deploy-v2` / `update` recipe) only matches files named `_Index.md` or `Index.md` (capitalized) via `rglob`, and only rewrites markdown **tables** into `browse-index` lists. The current `steel-etl site` builder emits lowercase `index.md` pages rendered as raw-HTML `sc-card` grids (see `internal/site/cards.go`), which the script never matches and which contain no tables. So the step is effectively a **no-op** — it transforms nothing on a normal build.
- **Why it matters:** Dead pipeline step is misleading (it looks like index pages are post-processed when they aren't — this cost real debugging time tracing how card links resolve). Either remove the step from the justfile + delete the script, or confirm whether any remaining table-style `Index.md` pages still depend on it before deleting.
- **Context:** `v2/justfile` step 4 (`scripts/transform_indexes.py docs/Browse`); the script's `main()` globs `_Index.md` / `Index.md` only. Card pages are generated lowercase `index.md` by `buildCardsContent` in `steel-etl/internal/site/cards.go`. Confirm with `find v2/docs/Browse -name 'Index.md' -o -name '_Index.md'` (expected: none) before removing.
- **Effort:** XS (verify no matches, then drop the step + script)

---

## Featureblock / terrain / malice pages render broken `../scc:` cross-reference links (was FOLLOWUPS #9)

**Status:** **done 2026-06-14.** Fixed gen-side (fix option 1 — every consumer benefits): the link-resolution pass (`internal/scc/resolver.go` `resolveValue`) skipped two typed frontmatter container shapes the featureblock/terrain output uses — `[]map[string]any` (`features`/`stats`/`sections`/`enhancements`, via `RichFeatureMaps`) and `map[string]string` (power-roll `tiers`, via `RichFeature.ToMap`) — so their nested `scc:` links survived into `md-linked` and `featureblock_page.go`'s `richInline`→`cardHref` rendered them as `../scc:…`. Added both type-switch cases; broken `href="…scc:mcdm…"` count in `v2/docs/Browse/` went **119 → 0** (post-restructure count was 119, not the originally-noted 98) and raw `scc:` in all `md-linked` output is 0. Statblock islands stayed at 0 (no regression). Guard test: `TestResolverResolveFrontmatterTypedMapSlice` (`internal/scc/resolver_test.go`). scc-log 2026-06-14.

<details><summary>Original report (open)</summary>

**Status:** open — **CONFIRMED still present after the featureblock restructure (Plans 5a–5c) landed + deployed 2026-06-14.** The new companion advancement-features cards (`monster/companion/beastheart/wolf-advancement-features` — Dire Wolf's "frightened"; flattened from the old `…/advancement-features/wolf` path on 2026-06-14, see `docs/scc-log.md`) and fixture cards exhibit it too, alongside the original terrain/malice pages. Same root cause. Re-confirm the 98-page count post-deploy before acting.

- **Identified:** 2026-06-13, auditing statblock-island link resolution (the statblock *island* path is now clean — 0 unresolved links). This is a **different render path**: `internal/site/featureblock_page.go` (malice featureblocks + dynamic terrain), not `statblock_page.go`.
- **What:** **98 generated `v2/docs/Browse/` pages** emit broken anchor hrefs of the form `href="../scc:mcdm.heroes.v1/..."` — the raw `scc:` link was never resolved to a real page path, so the `../`-prefixed result 404s. Affected: all `dynamic-terrain/*` subdirs (~34 pages) and every monster family's `*-malice` featureblock (~64 pages).
- **Evidence (verify these are gone after the refactor):**
  - Count: `grep -rlE 'href="[^"]*scc:mcdm' v2/docs/Browse/ | wc -l` → **98** (want 0).
  - Example rendered HTML, `v2/docs/Browse/monster/lich/lich-malice.md`: `<a href="../scc:mcdm.heroes.v1/feature.common.main-actions/free-strike">free strike</a>` and `<a href="../scc:mcdm.heroes.v1/condition/dazed">dazed</a>` (in `.fb__feat-body` and `.sc-ability__tier`).
  - Example terrain, `v2/docs/Browse/dynamic-terrain/mechanisms/portcullis.md`: `[adjacent](scc:…)`, `[slowed](scc:…)` in `body:`/tier fields.
  - Contrast: statblock islands have **0** such leaks (`grep -rlE '"(body|text|low|mid|high|trailing|usage|cost|name|label)":"[^"]*scc:mcdm' v2/docs/Browse/ | wc -l` → 0).
- **Root cause (as of 2026-06-13):** the featureblock **structured fields** (`body`, power-roll tiers, `flavor`, `stats[].value`, enhancement `text`) retain **raw `scc:` links** in the gen output (`data/data-bestiary/en/md-linked/**`), unlike prose which the gen-time SCC resolver rewrites to relative `.md`. `featureblock_page.go` then runs those fields through `richInline` → `cardHref`, which only knows how to turn an already-resolved `.md` link into a directory URL (`"../" + dirURL`); handed a raw `scc:` target it just prepends `../` → `../scc:…`. So the gap is **gen-side**: featureblock structured text fields are not scc-resolved like prose. (Fixing it in the site renderer would mean teaching it to resolve `scc:` via the registry — the renderer already has a `registry:` path for printing stamps — but the cleaner fix is resolving at gen so every consumer benefits.)
- **Why:** 98 pages of broken cross-reference links; comprehensive linking is part of "done" (memory `comprehensive-linking-density`).
- **Fix options:** resolve `scc:` links inside the featureblock structured fields (`features[]` bodies, power-roll tiers, `flavor`, `stats[].value`, enhancement `text`) during the gen-time link-resolution pass (fixes every consumer), or resolve at site render time in `richInline` (`scc:` → permalink; contained to `internal/site`, also fixes malice + companion-advancement + fixture cards).
- **Effort:** S–M (likely a gen-side resolve pass over featureblock structured fields), **pending the featureblock refactor.**
- **Resolution:** took the gen-side option. Root cause was narrower than "fields not resolved" — `ResolveFrontmatter` *did* recurse, but `resolveValue`'s type switch only matched `[]any`/`map[string]any`/`[]string`/`string`; the featureblock output emits `features`/`stats` as `[]map[string]any` and tiers as `map[string]string`, both of which hit `default` and passed through untouched. Two added cases (no new resolve pass needed).

</details>

---

## Statblock build-time render: deferred cleanups (CSS-only interactivity; parser link pre-resolve) (was FOLLOWUPS #10)

**Status:** **done 2026-06-18.** Both cleanups landed.
- **10.2 (parser link pre-resolve)** — `resolveSbLinks` deleted; the `sbIsland` model now
  carries raw `.md` link targets and `richSb` (`statblock_card.go`) resolves them once at
  render via `cardHref`, the `richInline` shape. `companion_statblock.go` `metaVal` no longer
  pre-resolves. Guarded by `TestStatblockCard_GoldenEquivalence` (final HTML byte-identical)
  plus a new render-resolution assertion in `TestBuildStatblockIsland_PreservesRawLinksInAllFields`.
- **10.1 (CSS-only interactivity → retire `steel-statblock.js`)** — collapsible Villain/Malice
  bands are now native `<details>`/`<summary>` (`renderStatblockBand`); the sticky mini-header
  is a CSS scroll-driven animation (`@supports (animation-timeline: view())` → `view-timeline`
  on `.sb__head` inset by `--sticky-top`, revealing `.sb__sticky` over `exit 75–100%`; safe
  hidden fallback where unsupported). `steel-statblock.js` deleted + dropped from `mkdocs.yml`;
  statblocks now ship with **no JS**. The golden HTML, no longer re-capturable from the retired
  JS renderer, became a committed `renderStatblockCard` snapshot (regenerate with
  `STEEL_UPDATE_GOLDEN=1`). Docs updated: `statblocks.md`, `site-builder.md`, `v2/CLAUDE.md`,
  `statblock_card.go` header. **Deploy-verify (cannot reproduce locally — scroll/navigation.instant):**
  (a) the sticky reveal timing + park offset across font sizes and the <76.25em tabs breakpoint
  (tune `--sticky-top` / `animation-range`); (b) the `<details>` chevron/expand look; (c) the
  `statblock-featstyle` + `settings-panel` e2e suites against a fresh `mkdocs build`.

- **Identified:** 2026-06-14, brainstorming the statblock JSON-island → build-time HTML swap. Both items were explicitly scoped OUT of that effort to keep it a clean no-visual-change mechanism swap; capture them so they aren't lost.
- **What:**
  1. **CSS-only statblock interactivity.** After the swap, `steel-statblock.js` is slimmed to just `wire()` (collapsible bands) + the sticky mini-header scroll logic. Investigate replacing these with CSS: collapsible bands as `<details>/<summary>`, sticky header as `position: sticky`. Would retire the script entirely. (This was design "option B", deferred as riskier — the sticky logic measures Material's live chrome height via `chromeBottom()` because a CSS constant drifts when fonts/tabs change, and `<details>` won't trivially match the chevron animation.)
  2. **Statblock parser link pre-resolve removal.** The swap adds a thin `richSb()` that renders *already-resolved* links because the parse stage still pre-bakes hrefs via `resolveSbLinks` (a leftover need of the JSON island, which MkDocs never post-processed). Cleaner shape: hold raw `.md` links in the `sbIsland` model and resolve once at render via `cardHref` (the way `featureblock_page.go` does with `richInline`), dropping the `resolveSbLinks` pre-pass and folding `richSb` toward `richInline` + the `sb-term` class.
- **Why:** (1) deletes a whole client script and a class of navigation.instant hazards; (2) removes a render-stage special case and aligns the statblock and featureblock link paths (one resolve point, easier to reason about).
- **Context:** `v2/docs/javascripts/steel-statblock.js` (`wire`/`chromeBottom`/sticky), `v2/docs/stylesheets/steel-statblock.css`; `steel-etl/internal/site/statblock_page.go` (`resolveSbLinks`, `buildStatblockIsland`) + the new `statblock_card.go` (`richSb`). Both are pure cleanups — no visual/behavior change intended. Do #2 with the golden DOM-equivalence test from the swap still in place as a guard.
- **Effort:** (1) M (CSS + cross-browser/sticky verification); (2) S (parser tidy, guarded by the golden test).

---

## Echelon index pages render the old `browse-index` flat list instead of statblock preview cards (was FOLLOWUPS #16)

**Status:** **done 2026-06-15.** Added `isBestiaryEchelonDir` (`internal/site/bestiary_cards.go`) and widened `buildMonsterGroupContent`'s guard so an "Nth-echelon" subdir whose parent is a bestiary group landing renders through the existing flat-group path (`featureblockCards` + `statblockCards` + `groupSubdirCards`, `relPrefix=""`). All 16 echelon pages (`monster/{demons,rivals,undead,war-dogs}/{1st,2nd,3rd,4th}-echelon/index.md`) now emit `sb-cards` preview cards; the rivals `summoner/` subgroup renders as a folder card. Guard tests `TestIsBestiaryEchelonDir` + `TestMonsterGroupContent_EchelonSubdir`. Verified via a real `steel-etl site` build: 0 echelon pages left with `browse-index`. (Re-deploy needed to publish — `v2/docs` regenerated locally also surfaced unrelated featureblock `intro`→`body` drift.)

- **Identified:** 2026-06-15, auditing v2 index pages still rendering the pre-redesign style.
- **What:** The 16 echelon **sub-directory** index pages — `monster/{demons,rivals,undead,war-dogs}/{1st,2nd,3rd,4th}-echelon/index.md` — render the old `<div class="browse-index">` flat bullet link-list instead of the `sb-cards` statblock preview cards. The parent group landings (`monster/demons/index.md`, etc.) already render the per-echelon preview cards correctly; only the standalone echelon pages lag.
- **Why:** Consistency — the preview cards already exist and are used on the group landings; the echelon pages are a visible regression to the old style. No new card design needed, just routing.
- **Context:** Root cause in `steel-etl/internal/site/`: `buildIndexContent` (`build.go`) walks each echelon dir and falls through every card builder to the default `browse-index` branch because `buildMonsterGroupContent`'s guard (`isBestiaryGroupDir`/`isBestiaryTypeRootWithStatblocks` in `bestiary_cards.go`) doesn't match an echelon dir (its parent, not itself, is the group dir). Fix: recognize an echelon dir whose parent is a bestiary group dir and render it through the existing `featureblockCards` + `statblockCards` (+ `groupSubdirCards` for the rivals `summoner/` subgroup) — the same flat-group path, `relPrefix=""`. The `*-malice`/`rival-summoner` featureblock files in those dirs already route via `splitByType`.
- **Effort:** S (one guard helper + reuse existing renderers; guarded by a new bestiary_cards test).

---

## Non-monster `browse-index` index pages: `god`, `project`, `feature/ability/common` (was FOLLOWUPS #17)

**Status:** **done 2026-06-15** (god + project earlier same day; `feature/ability/common` resolved by restructure — see below).

- **Identified:** 2026-06-15, same audit as #16.
- **What:** Three index pages still rendered the old `browse-index` flat list rather than `sc-card` stat-cards: `Browse/god/index.md`, `Browse/project/index.md`, and `Browse/feature/ability/common/index.md` (free strikes / maneuvers).
- **Why:** Same consistency goal as #16; these are flat leaf types that were simply never added to the rich-card renderer.
- **god + project (done):** Added both to `richCardTypes` (`steel-etl/internal/site/cards.go`) with dedicated `godCard` (Domains label line + flavor; `hands-pray` crest) and `projectCard` (flavor + Project Goal stat + Roll/Prerequisite/Source lines; `hammer-wrench` crest — both crests match the Browse landing). The project labels embed links (`**[Item Prerequisite](…):**`), so a new `bodyLabeledLineLoose` matches labels markdown-stripped, and `firstUnlabeledProse` pulls flavor from *after* the leading stat lines. All site-only (reads the page body, no schema change). Tests: `TestGodCard`, `TestProjectCard`, `TestBodyLabeledLineLoose`, `TestFirstUnlabeledProse`, `TestBuildCardsContent_GodAndProject`. Verified via a real `steel-etl site` build (9 god cards, 16 project cards; Craft Treasure has no inline stats and correctly falls back to flavor).
- **`feature/ability/common` (done):** `feature/ability/common` was the *only* mixed feature node (subgroups `free-strikes/` + `maneuvers/` **and** direct ability leaves), so it alone fell through to `browse-index`. Rather than teach the renderer about mixed nodes, we **flattened the structure**: common abilities no longer take a feature-group path segment (`internal/content/ability.go` common branch), so `feature.ability.common.{maneuvers,free-strikes}/*` → `feature.ability.common/*`. That makes the dir a pure parent-of-leaves → it renders preview cards with no render-code change. The two combat-chapter free strikes (duplicates of the canonical character-creation ones) were de-classified to inline bold-label tables (no own page/code). 5 codes changed, zero inbound links. Guard test `TestAbilityParserCommonAbilityUnderFeatureGroupStaysFlat`; scc-log 2026-06-15.
- **Effort:** done.

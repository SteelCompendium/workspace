# Follow-ups

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below instead of chasing them now, and
**clear these before starting a new feature.** New features and larger efforts go in
`ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line; on a
periodic cleanup pass, completed items are moved to `docs/followups-archive/` and the
rest renumbered. **After renumbering, grep live docs (all repos: `CLAUDE.md`s,
`docs/*.md`, `v2/.repo-docs/`) for `FOLLOWUPS` item references and fix them** — dated
plan/spec/decision docs keep their as-written numbers (the archive preserves
"was FOLLOWUPS #N" handles). Most recent archive:
[`docs/followups-archive/2026-06-12-completed.md`](docs/followups-archive/2026-06-12-completed.md).

<!-- Template — copy for each item, numbering sequentially:
## N. Short title
**Status:** open
- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description
- **Why:** motivation / value
- **Context:** file paths, gotchas, anything that saves grep time
- **Effort:** XS (<1 h) / S (1–4 h) / M (1 day) / L (multi-day) -->

## 1. `transform_indexes.py` is dead code for the current card index pages

**Status:** open

- **Identified:** 2026-06-04, card markdown-rendering / `.md`-link fix
- **What:** `v2/scripts/transform_indexes.py` (run as step 4 of the `just deploy-v2` / `update` recipe) only matches files named `_Index.md` or `Index.md` (capitalized) via `rglob`, and only rewrites markdown **tables** into `browse-index` lists. The current `steel-etl site` builder emits lowercase `index.md` pages rendered as raw-HTML `sc-card` grids (see `internal/site/cards.go`), which the script never matches and which contain no tables. So the step is effectively a **no-op** — it transforms nothing on a normal build.
- **Why it matters:** Dead pipeline step is misleading (it looks like index pages are post-processed when they aren't — this cost real debugging time tracing how card links resolve). Either remove the step from the justfile + delete the script, or confirm whether any remaining table-style `Index.md` pages still depend on it before deleting.
- **Context:** `v2/justfile` step 4 (`scripts/transform_indexes.py docs/Browse`); the script's `main()` globs `_Index.md` / `Index.md` only. Card pages are generated lowercase `index.md` by `buildCardsContent` in `steel-etl/internal/site/cards.go`. Confirm with `find v2/docs/Browse -name 'Index.md' -o -name '_Index.md'` (expected: none) before removing.
- **Effort:** XS (verify no matches, then drop the step + script)

## 2. Settings panel: card-style toggle still triggers a full page reload

**Status:** dormant — control hidden 2026-06-09 (see #3); revisit when re-enabling.

- **Identified:** 2026-06-07, while building the live settings drawer (`v2/.repo-docs/plans/2026-06-07-live-settings-panel.md`).
- **What:** The "Ability card style" control in the new live settings drawer (`v2/docs/javascripts/settings-panel.js`) calls `location.reload()` on change, carried over from the old preferences page. Every other control in the drawer applies instantly via a `<html>` attribute / CSS variable with no reload.
- **Why it matters:** It conflicts with the drawer's "change settings without navigating away / see it live" goal for that one control — the reload closes the drawer and flashes the page.
- **Fix options:** Investigate whether classic↔modern can be a pure CSS/attribute swap (it already toggles `data-card-style` on `<html>`). If some ability-card markup is build-time only (the classic glyph badges vs. modern colored borders may be emitted by `steel-etl`, not pure CSS), document why the reload is required, or do a lighter in-place re-render of just the affected cards instead of a full reload.
- **Effort:** S (investigate + likely small JS/CSS change)

## 3. Settings panel: re-enable "Color theme" and "Ability card style" once fully supported

**Status:** open

- **Identified:** 2026-06-09, cleaning up the settings drawer.
- **What:** The "Color theme" select (Steel / Parchment / Obsidian → `data-sc-theme`) and the "Ability card style" select (Classic / Modern → `data-card-style`) were **hidden** from the drawer markup in `v2/docs/javascripts/settings-panel.js` because the alternate palettes/styles aren't fully baked. Only the markup was removed — the apply functions (`applySiteTheme`, `applyCardStyle`), their bindings (now null-guarded), `palette.css` `[data-sc-theme]` blocks, and `ability-cards.js` modern handling all remain in place.
- **Why it matters:** Half-finished controls were exposed to users. They're parked, not deleted, so re-enabling is just re-adding the two markup blocks (commented anchors mark both spots).
- **Fix options:** Finish the alternate palettes (most `--sc-*` brand tokens aren't overridden by `[data-sc-theme]`, so themes barely change the page today) and the Modern card style, then restore the markup. Fold #2 (card-style reload) into that work.
- **Effort:** M (design + CSS to make the themes/styles actually comprehensive)

## 4. Restamp bare `scc:` links to explicit `scc.v1:` across all inputs

**Status:** open (deferred deliberately)

- **Identified:** 2026-06-09, during the SCC scheme-versioning design (`steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md`).
- **What:** The SCC scheme now carries an explicit scheme-version prefix (`scc.v1`), with bare `scc:` defined as a permanent implicit-v1 alias. The canonical form is explicit, but the ~17,527 existing in-prose `scc:…` links and the registry were left bare to avoid a high-churn sweep. This follow-up restamps bare `scc:` → `scc.v1:` across all source inputs (heroes, beastheart, monsters, and the in-flight new sourcebook) and emits explicit going forward.
- **Why it matters:** Cosmetic/consistency only — bare and explicit are equivalent by definition, so nothing is broken meanwhile. Worth doing in one pass once the new sourcebook lands, rather than piecemeal.
- **Fix options:** Mechanical `scc:` → `scc.v1:` replace across `steel-etl/input/**/*.md` (guard against already-prefixed `scc.vN:` and against non-link `scc` text); update the registry to record `scheme_version`; confirm the resolver normalizes both forms. Coordinate timing with the new-sourcebook agent so it's a single sweep over all inputs.
- **Effort:** M (broad but mechanical; one sweep across all input docs + registry + regen)

## 5. Link the bestiary pages into the SCC cross-reference sweep

**Status:** **direction 1 (links out of / within Monsters) done 2026-06-12** — direction 2 still open. The Monsters source is fully link-swept: 5,948 `scc:` links (4,759 cross-book to Heroes, 1,189 internal), a new `rule.{monster,role,organization,keyword}` glossary minted from Monster Basics (591 → 632 codes), and full statblock-parser hardening against link-wrapping (every structured field). Plan: `steel-etl/docs/superpowers/plans/2026-06-12-monsters-content-linking.md`; scc-log 2026-06-12. **Remaining (direction 2 only):** links *into* monster/terrain/retainer pages from the *other* books' sources (heroes/beastheart/summoner referencing a monster by SCC) — see "What" item (2) below.

<em>Original (2026-06-11) context, now mostly addressed by direction 1:</em> the **Summoner book** statblocks were a working model (`steel-etl/docs/superpowers/plans/2026-06-10-summoner-content-linking.md`): link trait/ability effect prose + tier lines; leave dice-title lines, keyword rows, stat-grid labels, and creature keywords plain; link relational nouns `enemy`/`ally`/`creature` only at defining anchors but `adjacent`/`strike` freely.

- **Identified:** 2026-06-10, the bestiary restructure (Plan A: moved monster / dynamic-terrain / retainer trees from the Bestiary tab into Browse, `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-restructure.md`).
- **What:** The Monsters-book pages (statblocks, malice/Tactical Stance featureblocks, dynamic terrain, retainers) are now first-class Browse pages with their own SCC codes, but they are **not yet wired into the in-prose `scc:` cross-reference sweep** the heroes doc uses. Two directions are missing: (1) links *out of* the Monsters source — statblock keywords, inflicted conditions, abilities, movement types, etc. should link to their SCC pages; (2) links *into* monster pages — other books should be able to reference a monster/terrain/retainer by SCC.
- **Why:** Comprehensive linking is part of "done" for this project (see memory `comprehensive-linking-density`); the bestiary is currently an island.
- **Context:** Source is `steel-etl/input/monsters/Draw Steel Monsters.md` (hand-maintained; H7=statblock, H9=featureblock/terrain — see `steel-etl/CLAUDE.md` "Monsters book"). Follow `steel-etl/docs/linking-guide.md` + `docs/linking-reference.md`. Conditions/skills/movement terms are already linkable targets. Mind the one-heading-one-code gotcha (memory `rule-scc-type`). This is a sizable sweep, akin to the heroes-doc passes.
- **Effort:** L (multi-day sweep across the whole Monsters source)

## 7. Statblock island: shared family Malice band not embedded; retainer/fixture "With Captain" label

**Status:** open

- **Identified:** 2026-06-11, building the High-Fantasy Steel statblock client renderer. The design handoff is now archived at `reference/design-system/handoff/redesign/statblocks/README.md` (imported 2026-06-11; the malice band + captain label are its "Notes / nice-to-haves").
- **What:** Two deferred pieces of the statblock island (`steel-etl/internal/site/statblock_page.go` → `v2/docs/javascripts/steel-statblock.js`):
  1. **Malice band** — the design embeds the family's shared Malice featureblock into each statblock as a collapsible band (`renderStatblock` `data.malice`). The island currently omits it (the README marks it a non-blocking nice-to-have, and the family's `…-malice.md` featureblock still renders as its own Browse page). To wire it, associate each statblock with its group's malice featureblock at site-build time (the malice `.md` is a sibling in the group dir, e.g. `monster/devils/devil-malice.md`), parse its features the same way, and emit `island.malice = {name, sourceName, intro, features[]}`.
  2. **2×2 "With Captain" cell** — the island always labels the 4th meta cell "With Captain". Minions use it (captain bonus), but retainers/fixtures/solos have no captain; the design notes summoner statblocks replace it with "Free Strike Damage Type". Make the label/value context-driven (skip or relabel when there's no captain line in the body).
- **Why:** Full fidelity to the approved design (malice is a prominent part of monster statblocks) and correct secondary-stat labeling across creature types.
- **Context:** Island shape + parser in `statblock_page.go` (`buildStatblockIsland`, `sbMeta.Captain`); renderer band logic already present in `steel-statblock.js` (`band()` + `data.malice`) and CSS (`.sb__band--malice`), so this is a Go/data-association task, not a front-end one. Group-dir sibling lookup precedent: `bestiary_cards.go` (`splitByType` finds the featureblock vs. statblock split).
- **Effort:** M (malice association) + XS (captain label)

## 8. Link the remaining statblock usage-cell action terms to the rule glossary

**Status:** open

- **Identified:** 2026-06-13, fixing the statblock usage-cell link rendering (linked usage cells were stored/rendered link-free; now `statblock_page.go` resolves usage links like distance/target and `steel-statblock.js` renders usage via `rich()`).
- **What:** Only **17** of ~1,000 ability usage cells in the Monsters source are actually linked (`**[Triggered Action](scc:…/rule.combat/triggered-action)**`); the other ~960 are plain text — `Main action`, `Maneuver`, `Triggered action`, `Free triggered action`, `Free maneuver`, `Move action`, `1 Eidos`, etc. Sweep the source so every action-type usage cell links to its rule-glossary term, the way the 17 already do.
- **Why:** Comprehensive linking is part of "done" (memory `comprehensive-linking-density`); the renderer now surfaces these links, so the inconsistency (a handful clickable, the rest not) is visible to users. This is the natural completion of FOLLOWUPS #5 direction 1.
- **Context:** Source `steel-etl/input/monsters/Draw Steel Monsters.md` (usage = 2nd cell of the 2×2 ability spec table, `> | **<keywords>** | **<usage>** |`). Confirm each phrase has a `rule.combat/*` target before linking (`triggered-action` exists; verify `main-action`/`maneuver`/`move-action`/free-action variants in `steel-etl/docs/linking-reference.md` — mint any missing glossary codes per the one-heading-one-code gotcha, memory `rule-scc-type`). The parser already strips the surrounding `**bold**` and resolves links in the usage cell, so no parser change is needed — purely a source-annotation sweep. Heroes/summoner sources likely have the same gap in their ability tables — check and fold in if cheap.
- **Effort:** S–M (mechanical sweep, but verify/mint the action-term glossary targets first)

## 9. Featureblock / terrain / malice pages render broken `../scc:` cross-reference links

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

## 10. Statblock build-time render: deferred cleanups (CSS-only interactivity; parser link pre-resolve)

**Status:** open — **blocked on** the statblock build-time render swap landing first ([`docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md`](docs/superpowers/specs/2026-06-14-statblock-build-time-render-design.md)).

- **Identified:** 2026-06-14, brainstorming the statblock JSON-island → build-time HTML swap. Both items were explicitly scoped OUT of that effort to keep it a clean no-visual-change mechanism swap; capture them so they aren't lost.
- **What:**
  1. **CSS-only statblock interactivity.** After the swap, `steel-statblock.js` is slimmed to just `wire()` (collapsible bands) + the sticky mini-header scroll logic. Investigate replacing these with CSS: collapsible bands as `<details>/<summary>`, sticky header as `position: sticky`. Would retire the script entirely. (This was design "option B", deferred as riskier — the sticky logic measures Material's live chrome height via `chromeBottom()` because a CSS constant drifts when fonts/tabs change, and `<details>` won't trivially match the chevron animation.)
  2. **Statblock parser link pre-resolve removal.** The swap adds a thin `richSb()` that renders *already-resolved* links because the parse stage still pre-bakes hrefs via `resolveSbLinks` (a leftover need of the JSON island, which MkDocs never post-processed). Cleaner shape: hold raw `.md` links in the `sbIsland` model and resolve once at render via `cardHref` (the way `featureblock_page.go` does with `richInline`), dropping the `resolveSbLinks` pre-pass and folding `richSb` toward `richInline` + the `sb-term` class.
- **Why:** (1) deletes a whole client script and a class of navigation.instant hazards; (2) removes a render-stage special case and aligns the statblock and featureblock link paths (one resolve point, easier to reason about).
- **Context:** `v2/docs/javascripts/steel-statblock.js` (`wire`/`chromeBottom`/sticky), `v2/docs/stylesheets/steel-statblock.css`; `steel-etl/internal/site/statblock_page.go` (`resolveSbLinks`, `buildStatblockIsland`) + the new `statblock_card.go` (`richSb`). Both are pure cleanups — no visual/behavior change intended. Do #2 with the golden DOM-equivalence test from the swap still in place as a guard.
- **Effort:** (1) M (CSS + cross-browser/sticky verification); (2) S (parser tidy, guarded by the golden test).

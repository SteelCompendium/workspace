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

## 8. Featureblock card `features[]` bodies don't resolve `scc:` links

**Status:** open

- **Identified:** 2026-06-14, building the companion advancement-features cards (Plan 5b). Pre-existing — affects malice featureblock cards too.
- **What:** A featureblock's `features[]` frontmatter carries each feature's prose `body` verbatim from source, including raw `[term](scc:…)` links. The SCC link resolver rewrites `scc:` → relative `.md` only in markdown **bodies**, not frontmatter, so the Forged Band card (`renderFeatureblockCard` → `richInline`) renders these as literal `scc:…` hrefs. Visible on e.g. `monster/companion/beastheart/advancement-features/wolf` (Dire Wolf's "frightened" link) and existing malice cards (`arixx-malice` → `rule.dice/edge`, etc.).
- **Why:** Inline cross-reference links in card bodies should resolve like everywhere else.
- **Fix options:** resolve `scc:` links inside `features[]` bodies during the link-resolution pass (extend the resolver to walk known frontmatter feature-body fields), or resolve at site render time in `richInline` (map `scc:` → permalink). The latter is contained to `internal/site` and also fixes malice. Verify against both malice and companion-advancement cards.
- **Effort:** S

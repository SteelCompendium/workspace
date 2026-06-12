# Follow-ups

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below instead of chasing them now, and
**clear these before starting a new feature.** New features and larger efforts go in
`ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line; on a
periodic cleanup pass, completed items are moved to `docs/followups-archive/` and the
rest renumbered. Most recent archive: [`docs/followups-archive/2026-06-11-completed.md`](docs/followups-archive/2026-06-11-completed.md).

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

**Status:** open — **unblocked 2026-06-11.** The **Summoner book** statblocks were fully link-swept (`steel-etl/docs/superpowers/plans/2026-06-10-summoner-content-linking.md`), which required hardening the shared statblock parser (`statblock_parse.go`: `sbDiceRe` + a `linkDisplay` helper) so link-wrapping can't break extraction. That removes the parser blocker for the **Monsters** source, and the Summoner passes are a working model: link trait/ability effect prose + tier lines; leave dice-title lines, keyword rows, stat-grid labels, and creature keywords plain; link relational nouns `enemy`/`ally`/`creature` only at defining anchors (the Heroes book links them ~2–3× total) but `adjacent`/`strike` freely. Remaining scope below is now Monsters-specific.

- **Identified:** 2026-06-10, the bestiary restructure (Plan A: moved monster / dynamic-terrain / retainer trees from the Bestiary tab into Browse, `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-restructure.md`).
- **What:** The Monsters-book pages (statblocks, malice/Tactical Stance featureblocks, dynamic terrain, retainers) are now first-class Browse pages with their own SCC codes, but they are **not yet wired into the in-prose `scc:` cross-reference sweep** the heroes doc uses. Two directions are missing: (1) links *out of* the Monsters source — statblock keywords, inflicted conditions, abilities, movement types, etc. should link to their SCC pages; (2) links *into* monster pages — other books should be able to reference a monster/terrain/retainer by SCC.
- **Why:** Comprehensive linking is part of "done" for this project (see memory `comprehensive-linking-density`); the bestiary is currently an island.
- **Context:** Source is `steel-etl/input/monsters/Draw Steel Monsters.md` (hand-maintained; H7=statblock, H9=featureblock/terrain — see `steel-etl/CLAUDE.md` "Monsters book"). Follow `steel-etl/docs/linking-guide.md` + `docs/linking-reference.md`. Conditions/skills/movement terms are already linkable targets. Mind the one-heading-one-code gotcha (memory `rule-scc-type`). This is a sizable sweep, akin to the heroes-doc passes.
- **Effort:** L (multi-day sweep across the whole Monsters source)

## 6. `settings-core.test.js` fails — max-width drift (test says 500, code says 300)

**Status:** done — 2026-06-11 (v2 `fef309cf42`). **300 is the source of truth** — git history shows the cap was deliberately lowered 500→300 (`94eb30bd` "Setting the max manually-set width to 300em for finer control", after the earlier `83d22310` that raised it to 500), and the runtime derives the slider `max` from the single `WIDTH_MAX_EM` constant (`settings-panel.js:484` → `String(C.WIDTH_MAX_EM)`), so the whole system was already consistent at 300; only the test was stale. Updated the three stale `500` references in `tests/settings-core.test.js` (the `[44, 500]` test name, `clampEm(600)→300`, and `widthToControls("600em")→{em:300}`). Suite now 11/11 green. Test-only change (not part of the published site), so no deploy.

- **Identified:** 2026-06-10, running the v2 `node:test` suite while adding `ability-cards-core.test.js` for the statblock power-roll site fix.
- **What:** `v2/tests/settings-core.test.js` has **2 failing tests** (`node --test tests/` → 9 pass / 2 fail), both pre-existing and unrelated to the statblock work: (a) `"clampEm clamps to [44, 500] and snaps to step"` asserts `clampEm(600) === 500`, but `settings-core.js` defines `WIDTH_MAX_EM = 300`, so it returns `300`; (b) `"widthToControls maps stored width to slider state"` fails the same way (it routes through `clampEm` for an out-of-range stored width). The content-max-width cap was lowered 500→300 (the v2 footer/header / live-settings rework) without updating the test.
- **Why it matters:** A red test suite hides real regressions and erodes the "tests pass" signal. It's a one-sided drift — pick the source of truth and align the other side.
- **Fix options:** Decide the intended max content width. If 300 is correct, update the test's expectations (`clampEm(600) → 300`, the `[44, 500]` name, and the `widthToControls` case). If 500 is correct, bump `WIDTH_MAX_EM` back to 500 in `settings-core.js` (and check the slider's `max` in `settings-panel.js`/`steel-settings.css`). `settings-core.js:19` (`WIDTH_MAX_EM`), `settings-core.js:52` (`clampEm`), `tests/settings-core.test.js:38-49`.
- **Effort:** XS

## 7. Fixture statblocks: non-standard 2-column stat grid not parsed into size/stamina

**Status:** open

- **Identified:** 2026-06-11, during the Summoner link sweep's footgun verification (`docs/superpowers/plans/2026-06-10-summoner-content-linking.md`, Phase 3.2).
- **What:** The four Summoner **fixture** statblocks (`fixture.<portfolio>.statblock/*` — The Boil, Barrow Gates, etc.) use a simplified **2-column** stat table — `| **Stamina:** 20 + your level | **Size:** 2 |` — instead of the standard `**VALUE**<br>Label` grid the minion/champion/rival statblocks use. `parseStatGrid` (`steel-etl/internal/content/statblock_parse.go`, `cellRe`) doesn't recognize this form, so the fixture JSON has empty `size`/`speed`/`stamina` and the whole `**Stamina:** 20 + your level` string lands in `keywords[]`. Confirmed pre-existing (the grid line carries no links, so the 2026-06-11 link sweep did not cause it) and **fixture-only** (4 statblocks).
- **Why it matters:** Fixture statblock JSON in `data/data-summoner` has malformed/empty stat fields, so the SDK / data consumers and any stat-driven card get nothing for fixtures. The trait/ability blockquotes parse fine; only the stat grid is affected.
- **Fix options:** Teach `parseStatGrid` (or a fixture-specific path) to recognize the `**Label:** value` 2-column inline form and map `Stamina`/`Size` (and any others) into the structured fields, keeping the `+ your level` expression as the value. Add a `statblock_parse_test.go` case from The Boil. Mind the card-data-parity checklist if a new field is surfaced.
- **Effort:** S
- **Note (2026-06-11):** The new statblock island renderer (`steel-etl/internal/site/statblock_page.go`) reads `size`/`speed`/`stamina` from frontmatter, so fixture cards/blocks inherit this gap (those defenses show `—` until this is fixed). Not introduced by the island work.

## 8. Statblock island: shared family Malice band not embedded; retainer/fixture "With Captain" label

**Status:** open

- **Identified:** 2026-06-11, building the High-Fantasy Steel statblock client renderer (design handoff `redesign/statblocks/`).
- **What:** Two deferred pieces of the statblock island (`steel-etl/internal/site/statblock_page.go` → `v2/docs/javascripts/steel-statblock.js`):
  1. **Malice band** — the design embeds the family's shared Malice featureblock into each statblock as a collapsible band (`renderStatblock` `data.malice`). The island currently omits it (the README marks it a non-blocking nice-to-have, and the family's `…-malice.md` featureblock still renders as its own Browse page). To wire it, associate each statblock with its group's malice featureblock at site-build time (the malice `.md` is a sibling in the group dir, e.g. `monster/devils/devil-malice.md`), parse its features the same way, and emit `island.malice = {name, sourceName, intro, features[]}`.
  2. **2×2 "With Captain" cell** — the island always labels the 4th meta cell "With Captain". Minions use it (captain bonus), but retainers/fixtures/solos have no captain; the design notes summoner statblocks replace it with "Free Strike Damage Type". Make the label/value context-driven (skip or relabel when there's no captain line in the body).
- **Why:** Full fidelity to the approved design (malice is a prominent part of monster statblocks) and correct secondary-stat labeling across creature types.
- **Context:** Island shape + parser in `statblock_page.go` (`buildStatblockIsland`, `sbMeta.Captain`); renderer band logic already present in `steel-statblock.js` (`band()` + `data.malice`) and CSS (`.sb__band--malice`), so this is a Go/data-association task, not a front-end one. Group-dir sibling lookup precedent: `bestiary_cards.go` (`splitByType` finds the featureblock vs. statblock split).
- **Effort:** M (malice association) + XS (captain label)

## 9. Statblock CSS: kwusage mode rules silently lose to the flatten rule; `:not()` scope leak

**Status:** open

- **Identified:** 2026-06-11, fixing the feature-separator hr (line invisible + diamond off-center).
- **What:** Two latent specificity problems in `v2/docs/stylesheets/steel-statblock.css`:
  1. **Dead mode styling** — the flatten rule (`.sb .sb__features .sc-ability { … padding: 0 }`, (0,3,0)) beats both the crest sub-card chrome (`[data-sb-kwusage="crest"] .sb__feat { background; border-left; padding }`, (0,2,0)) and the non-crest base padding (`:not(…) .sb__feat { padding: .9rem .2rem }`, (0,2,0)). The crest "sub-card frame" design has therefore **never rendered** — crest features show as flat, unpadded tinted slabs (nearly invisible in light scheme).
  2. **`:not()` scope leak** — the non-crest separator rules use an unanchored `:not([data-sb-kwusage="crest"])`, which matches `body` (the attr lives on `<html>`), so the "non-crest" separators/gap/margins apply in **every** mode including crest. This leak is currently **load-bearing**: the default view is crest mode, and the user iterates on the separator look there. Anchor as `html:not(…)` only as part of a deliberate design decision.
- **Why deferred:** Fixing either changes statblock layouts site-wide in the default view (crest cards would appear; separators would vanish from crest mode) — a design decision, not a bug fix. Needs a call: is crest mode sub-cards (restore chrome + anchor `:not()`), or is the de facto flat+separator look the design (delete the dead crest chrome + dead padding rule)?
- **Context:** Watermark-kill footgun is now commented at the flatten rule (`steel-statblock.css` ~line 213); separator rules re-claim `display`/`opacity`/`mix-blend-mode` explicitly. Diagnostic script pattern: `/tmp/sb-separator-diag.cjs` (session 2026-06-11), based on `v2/tests/e2e/settings-panel.e2e.cjs`.
- **Effort:** S (CSS) + design decision

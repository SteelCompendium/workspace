# Follow-ups

<!-- next-id: 20 -->

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below — **take N from the `next-id` counter
above, then bump it** — instead of chasing them now, and **clear these before starting
a new feature.** New features and larger efforts go in `ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line; on a
periodic cleanup pass, completed items are moved to `docs/followups-archive/` keeping
their original number as a `(was FOLLOWUPS #N)` handle. **Numbers are permanent — never
reused, never renumbered**, so gaps in the live list (there's no #6) are expected and
there is no grep-and-fix step: a `#N` reference resolves forever. **Referenced `#N` not
in this file? It's completed — `grep -rn 'was FOLLOWUPS #N' docs/followups-archive/`.**
Most recent archive:
[`docs/followups-archive/2026-06-18-completed.md`](docs/followups-archive/2026-06-18-completed.md).

<!-- Template — copy for each item; take N from next-id above, then bump next-id:
## N. Short title
**Status:** open
- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description
- **Why:** motivation / value
- **Context:** file paths, gotchas, anything that saves grep time
- **Effort:** XS (<1 h) / S (1–4 h) / M (1 day) / L (multi-day) -->

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

**Status:** done 2026-06-18 — all 25,328 in-prose `scc:` links across the four book sources (heroes 17,528, monsters 5,948, summoner 1,542, beastheart 310) restamped `](scc:` → `](scc.v1:`. Every occurrence was in markdown-link form (zero non-link uses, zero already-prefixed), so it was a pure balanced restamp. `gen --all` after the sweep resolved cleanly (3,012 codes, 0 resolver WARNs, no raw `scc.v1:` leaked into linked output). Registry already recorded `scheme_version: 1` and the resolver already normalized both forms (shipped 2026-06-09). See `docs/scc-log.md` 2026-06-18.

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

## 15. Back-link class-owned statblocks/featureblocks to their owning class

**Status:** open

- **Identified:** 2026-06-15, while adding the Rival Summoner summons cards + summon→summoner back-links (`docs/superpowers/specs/2026-06-15-rival-summoner-summons-design.md`).
- **What:** Bestiary entities that belong to a hero **class** — beastheart companions (`monster.companion.beastheart.<species>` + their `…-advancement-features`) and summoner fixtures (`monster.fixture.<element>.<id>` + their `…-advancement-features`) — should carry an on-page back-link to their owning class page (`class/beastheart`, `class/summoner`). This is the class-owned analog of the rival summon→summoner back-link being built now; the rival back-link mechanism is the model to reuse.
- **Why:** These entities live deep under `monster/*` with no on-page pointer to the class that conjures/bonds them, so a reader landing on `monster/fixture/demon/the-boil` (or a companion species page) has no path back to the Summoner/Beastheart class that owns it. Provenance + navigation.
- **Context:** companion pages `v2/docs/Browse/monster/companion/beastheart/<species>(-advancement-features)`, fixture pages `v2/docs/Browse/monster/fixture/<element>/<id>(-advancement-features)`; class targets `class/beastheart.md`, `class/summoner.md`. Rendering lives in `steel-etl/internal/site/` (statblock + featureblock page builders); the relationship is derivable from the SCC type path's class segment (`companion.beastheart`, `fixture` under the summoner book). Keep separate from the rival effort — rivals are NPC statblocks, not class-owned.
- **Effort:** S–M (a shared "owning-class back-link" helper in the site page builders).

## 18. Stale "client-side statblock island" docs — statblocks already render build-time

**Status:** open

- **Identified:** 2026-06-18, investigating Plan 6 (retainer rework) rendering.
- **What:** Several docs still describe monster/retainer statblocks as **client-side JSON islands** awaiting a build-time-HTML migration, but that migration already shipped: `buildStatblockIslandPage` (`steel-etl/internal/site/statblock_page.go`) renders the build-time `.sb-wrap` card via `renderStatblockCard` (its own comment: "it no longer emits a JSON island"), **0** built pages contain `sc-statblock-mount`, and `v2/site/javascripts/steel-statblock.js` is dead code. Stale references: `ROADMAP.md` #7 (lists "move statblocks from client-side JSON island to build-time HTML" as open), `steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md` (describe the island as live).
- **Why:** The docs actively mislead — an agent reading them will believe statblocks need a migration that's done, and may mis-plan around a JSON island that no longer exists (it nearly derailed Plan 6's scoping).
- **Context:** Correct the three doc locations; **re-assess what genuinely remains of ROADMAP #7** — part (a) (island → build-time HTML) appears complete; part (b) (entity-embedding, `embed_cards.go`) partly shipped for Browse. Decide whether #7 is done, partly-done, or should be re-scoped, and delete the dead `steel-statblock.js` if nothing references it.
- **Effort:** S (doc correction + a grep to confirm `steel-statblock.js` is unreferenced before deleting).

## 19. Stale summoner statblock codes in `summoner-linking-reference.md`

**Status:** open

- **Identified:** 2026-06-19, hand-adding the fixture advancement member codes (ROADMAP #16) to the linking reference.
- **What:** The **Statblocks** section of `steel-etl/docs/summoner-linking-reference.md` lists summoner minions/fixtures/champions/rivals under their **pre-`monster.*`-rehoming** codes (e.g. `mcdm.summoner.v1/minion.demon.statblock/…`, `fixture.demon.statblock/the-boil`, `champion.demon.statblock/…`). The actual registry (Plan 5c/6) homes them under `monster.*`: `monster.minion.summoner.<portfolio>.statblock/<id>`, `monster.fixture.<element>.featureblock/<id>` (+ the new `feature.fixture.*` members), `monster.champion.summoner.<portfolio>.statblock/<id>`, `monster.rival.<echelon>.statblock/<id>`. (Summoner **retainers** — `retainer.summoner.statblock/<id>` — are correct, kept that way deliberately in Plan 6.)
- **Why:** Anyone authoring `scc.v1:` links from these curated codes will write dangling links; the reference is supposed to be the canonical linkable-target list.
- **Context:** Refresh the section against `classification.json` (`grep -oE "mcdm.summoner.v1/monster\.[a-z.]+statblock/[a-z-]+"` etc.). Pre-existing drift, not introduced by #16 — the #16 fixture-member subsection added 2026-06-19 is already correct. Likely the Monsters-book linking reference has similar drift worth a glance.
- **Effort:** S (mechanical code refresh in one curated table).

# Follow-ups

<!-- next-id: 32 -->

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

## 31. DSE modals are untouchable by the Steel theme (no `data-dse-theme` on the modal root)

**Status:** open

- **Identified:** 2026-07-21, SC-10 / Plan 20 Task 6 fix round (`draw-steel-elements`,
  worktree `steel-material`).
- **What:** Nothing under a `.dse-modal` can be themed from CSS today, because
  `data-dse-theme` never appears anywhere in a modal's ancestry. `ThemeService.apply()`
  (`src/framework/seams/theme.ts:80`) is the **single writer** of that attribute and it
  stamps only the per-element render root it is handed — called once, from
  `src/framework/pipeline.ts:380`, for an in-note element mount. `theme.ts:16-17` states
  the rule explicitly: state is per-root, "document.body is never touched" (popout safety,
  D3 §2.5). Obsidian `Modal`s, however, mount into `.modal-container` on `document.body`;
  `src/framework/kit/managedModal.ts:45-47` puts `.dse-modal` on `modalEl` and
  `.dse-modal__title` on `titleEl` there, and `:74-78` builds the footer's kit `.dse-btn`s
  under `contentEl`. All of that is outside every `[data-dse-theme]` subtree, so any
  selector of the form `[data-dse-theme='steel'] .dse-modal…` is dead CSS.
- **Why:** Task 6 wrote exactly such selectors, believing modals were covered, and they
  had to be removed as dead CSS in the fix round. Until this is resolved the plugin's
  modals stay on flat Obsidian chrome while every in-note surface is a forged Steel plate —
  a visible seam — and, worse, the seam is invisible to review: a `[data-dse-theme='steel']`
  modal rule *looks* correct in `styles-source.css`. The affected selectors, all removed
  from `draw-steel-elements/styles-source.css` in the fix round, were:
  - `.dse-modal__section` — was a member of the Steel sunken-cell `:is(…)` list (would have
    given the modal's side-by-side panels the statblock's boxed-cell grammar);
  - `[data-dse-theme='steel'] .dse-modal__title` (emboss) and
    `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-modal__title`
    (display face / uppercase / letter-spacing).
  Also still unreached, though the rule itself is correct and live for trackers, the hero
  sheet and the sidebar leaf: the Steel forged-controls rule
  (`[data-dse-theme='steel']:not([data-dse-print="on"]) :is(.dse-btn, .dse-tabs__tab)…`)
  never reaches modal **footer** buttons.
- **Context:** The fix is a **DOM/TS** change, which is why it could not be done inside
  Plan 20 (that plan forbids touching `src/`). Sketch: have `ManagedModal` stamp the theme
  on its own `dialogEl()` — e.g. call `themeService.apply(this.dialogEl(), this.lifecycle)`
  in `open()`, which also gets the live re-stamp on theme change for free via the existing
  `onChange` subscription. Two things to get right: (a) a modal has no `RenderContext`, so
  the `ThemeService` has to be reachable from the plugin instance rather than from `cx`
  (check how `ManagedModal`'s `App` is threaded); (b) popout safety — stamp the modal's own
  root in whatever window it opened in, never `document.body`, preserving the `theme.ts`
  contract. Once stamped, the three removed selectors can be restored verbatim, and the
  forged-controls rule reaches footer buttons with no edit at all. Cross-refs: the
  scope-limit comments left in `styles-source.css` on the forged-controls rule and on the
  tracker-headings rule both point at this item. Note there is no parity pair for modals
  (they are a plugin-only surface with no site counterpart), so
  `visual-harness/parity/selector-map.json`'s `expectedGaps` stays empty — this deferral is
  **not** a silenced gate finding.
- **Effort:** S (1–4 h), mostly wiring the `ThemeService` handle + a `managedModal` test
  asserting `data-dse-theme` lands on `modalEl`.

## 30. Facet-mode (any/all) toggle a11y polish: fixed aria-label
**Status:** open
- **Identified:** 2026-07-21, SC-88 final review (facet match-mode toggle)
- **What:** The `.sc-facet-mode` toggle uses `aria-pressed` plus a flipping visible
  label (`any`/`all`). Convention for `aria-pressed` is a *fixed* accessible name with
  changing state — add `aria-label="Require all selected values"` (kept constant) so
  screen readers announce "Require all selected values, pressed/not pressed", while
  the visible text keeps flipping.
- **Why:** Current form is interpretable but a mild toggle anti-pattern; two-line fix.
- **Context:** `v2/docs/javascripts/steel-feature-browser.js` + `steel-bestiary-browser.js`
  (`modeBtn` markup string in `facetRow` + the `.sc-facet-mode` click wiring). Keep both
  files byte-identical — the two browsers share the markup/CSS contract.
- **Effort:** XS

## 29. steel-etl gen/site output not fully deterministic run-to-run

**Status:** done (with caveat) — 2026-07-18, `steel-etl` `ff85a10` (landed to main): the
observed troubadour flake did NOT reproduce (16 consecutive full builds byte-identical),
but a static sweep found exactly one structural hazard of the suspected shape —
`fbFeatureAction` ranged a map with first-match-wins semantics — fixed as a
priority-ordered slice with a red/green determinism test. Every other map-range in
internal/* either sorts before emission or marshals through key-sorting yaml/json. If
the flake ever recurs, reopen WITH the captured diff of the flapping file.

- **Identified:** 2026-07-18, FOLLOWUPS #15 verification (A/B diffing full site builds); confirmed unrelated to the #15 change (reproduced with it reverted).
- **What:** Back-to-back `gen --all` + site builds occasionally produce a transient diff on unrelated pages (observed: troubadour feature pages). The #15 implementer worked around it by re-baselining; the #15 reviewer flagged that a non-deterministic build deserves its own tracked item.
- **Why:** Deterministic output is what makes A/B diff verification (and clean deploy commits) trustworthy; a flaky page diff can mask or fake regressions.
- **Context:** Detail in the session report `.superpowers/sdd/followups-15-report.md` (scratch; capture what's needed before archiving). Suspects: map-iteration order somewhere in the troubadour/feature aggregation path.
- **Effort:** S (reproduce, find the unordered iteration, sort it)

## 28. D7 hero-suite final-review tail (MED-1 + six LOWs)

**Status:** done — items 1–2 and 4–7 fixed in worktree f2 (`draw-steel-elements` `80abd63`,
2026-07-18, reviewed/approved; jest 1946). Item 3 (`onUpdate` full-remount collapses
expanded ability cards) deliberately NOT fixed — differential-update architecture change,
cosmetic-only; revisit only if it annoys in real use.

- **Identified:** 2026-07-18, D7 whole-branch opus final review (verdict SHIP; plan 18, worktree `f2`, plugin range `5c6e33d..903fe4a`). Full detail: the ledger `worktrees/f2/.superpowers/sdd/progress.md` + the final-review report (session scratch).
- **What:** Deferred non-blocking findings in `draw-steel-elements`:
  1. **MED-1** — `findStateSpan`/`splitDefnRaw` (`src/elements/hero/model.ts:393-452`) absorb trailing comments/blank lines *after* a state-last `state:` block into the removed span, so a `# comment` below `state:` is dropped on first persist (comment/whitespace only; no data loss).
  2. LOW — full-degrade stamina bar renders NaN width when every ref fails and no authored max (cosmetic).
  3. LOW — `ds-hero` `onUpdate` full-remount collapses expanded ability cards (tab state survives).
  4. LOW — missing test: authored `resource` override + resolved class simultaneously (gainHint source).
  5. LOW — missing test: sheet-level roll-disabled static fallback path.
  6. LOW — conditions chip text runs together (cosmetic, pre-existing pattern).
  7. LOW — mixed-EOL-after-anchor edge in the sidebar anchor stamper.
- **Why:** Keeps the SHIP verdict honest — none block merge, but MED-1 is a real (if tiny) authored-bytes fidelity gap in the flagship element's persist path.
- **Context:** Byte-stability tests in `test/unit/elements/hero/` show the pattern to extend; Task 8/9 reviews name the exact missing assertions.
- **Effort:** S (MED-1 + the two tests) / XS each for the cosmetic ones

## 23. Statblock sticky mini-header too bulky at phone widths

**Status:** done (pending Scott's taste check on deploy) — 2026-07-18 in worktree
site-followups (`v2` `75b4320259`, CSS-only compact phone variant): single-line truncating
name, second meta row hidden, tighter pills; sticky 22.5% → 9.3% of a 390×844 viewport,
desktop screenshots byte-identical. Before/after evidence: `.superpowers/sdd/shots-23/`
(main checkout scratch). Punt: hover `title` on truncated names needs a build-time markup
change (statblock_card.go) — do with the next statblock Go touch.

- **Identified:** 2026-07-01, P1 bug batch visual QA (`docs/superpowers/plans/2026-07-01-p1-v2-bugfix-batch.md` Task 3).
- **What:** On a 390px viewport, the statblock sticky mini-header (`.sb__sticky`, CSS scroll-driven reveal in `steel-statblock.css`) occupies ~40% of the screen while scrolled: large name + role wrap to multiple lines, then the stats row, then the movement/captain/immunity/weakness row. Pre-existing — NOT caused by the 2026-07-01 `.sc-head` mobile stacking (the sticky uses its own `sb__sticky-*` classes).
- **Why:** The sticky exists to keep core stats in view at the table; at phone widths it crowds out the content it's meant to annotate.
- **Fix options:** A compact phone variant — single-line name (smaller, truncate-with-title), drop row 2 (movement/captain/immunity/weakness), tighter stat pills; or suppress the sticky below a width breakpoint entirely (readers can re-scroll).
- **Context:** `v2/docs/stylesheets/steel-statblock.css` (`.sb__sticky*`); screenshot evidence in the 2026-07-01 session (`53-sb-mobile-feat`).
- **Effort:** S

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

**Status:** done — 2026-07-18, site-followups wave (`steel-etl` `68887ab`+`ace9bc8`+`36818f2`,
reviewed/approved, LANDED to main): (1) every monster statblock leaf page embeds its family's
shared Malice featureblock as a band (381 pages; open-by-default per the Villain-band
precedent; embedded compact cards correctly suppress it; standalone malice pages remain);
(2) the meta cell is context-driven — real "With Captain" values restored (a parsed-but-
never-read `with_captain` field was silently dropping them; 116 leaf pages), summoner
minions show "Free Strike Damage Type" (75 leaf pages), others drop the blank cell.
Not yet deployed — lands on the next `just deploy-v2`.

- **Identified:** 2026-06-11, building the High-Fantasy Steel statblock client renderer. The design handoff is now archived at `reference/design-system/handoff/redesign/statblocks/README.md` (imported 2026-06-11; the malice band + captain label are its "Notes / nice-to-haves").
- **What:** Two deferred pieces of the statblock island (`steel-etl/internal/site/statblock_page.go` → `v2/docs/javascripts/steel-statblock.js`):
  1. **Malice band** — the design embeds the family's shared Malice featureblock into each statblock as a collapsible band (`renderStatblock` `data.malice`). The island currently omits it (the README marks it a non-blocking nice-to-have, and the family's `…-malice.md` featureblock still renders as its own Browse page). To wire it, associate each statblock with its group's malice featureblock at site-build time (the malice `.md` is a sibling in the group dir, e.g. `monster/devils/devil-malice.md`), parse its features the same way, and emit `island.malice = {name, sourceName, intro, features[]}`.
  2. **2×2 "With Captain" cell** — the island always labels the 4th meta cell "With Captain". Minions use it (captain bonus), but retainers/fixtures/solos have no captain; the design notes summoner statblocks replace it with "Free Strike Damage Type". Make the label/value context-driven (skip or relabel when there's no captain line in the body).
- **Why:** Full fidelity to the approved design (malice is a prominent part of monster statblocks) and correct secondary-stat labeling across creature types.
- **Context:** Island shape + parser in `statblock_page.go` (`buildStatblockIsland`, `sbMeta.Captain`); renderer band logic already present in `steel-statblock.js` (`band()` + `data.malice`) and CSS (`.sb__band--malice`), so this is a Go/data-association task, not a front-end one. Group-dir sibling lookup precedent: `bestiary_cards.go` (`splitByType` finds the featureblock vs. statblock split).
- **Effort:** M (malice association) + XS (captain label)

## 8. Link the remaining statblock usage-cell action terms to the rule glossary

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `c34a8fd` + review
fix `0190eaf`): 1,685 usage cells linked across all four books (monsters 1,152, heroes
496+13, summoner 41, beastheart 2), reviewed/approved; 0 resolver WARNs, registry count
unchanged at 3,080. Left unlinked by design: 156× `-` (passive) and 4× `1 Eidos`
(resource cost, no glossary heading). Action-type terms map to `rule.combat/turn` per the
glossary's own pre-existing convention (no per-action-type headings exist).

- **Identified:** 2026-06-13, fixing the statblock usage-cell link rendering (linked usage cells were stored/rendered link-free; now `statblock_page.go` resolves usage links like distance/target and `steel-statblock.js` renders usage via `rich()`).
- **What:** Only **17** of ~1,000 ability usage cells in the Monsters source are actually linked (`**[Triggered Action](scc:…/rule.combat/triggered-action)**`); the other ~960 are plain text — `Main action`, `Maneuver`, `Triggered action`, `Free triggered action`, `Free maneuver`, `Move action`, `1 Eidos`, etc. Sweep the source so every action-type usage cell links to its rule-glossary term, the way the 17 already do.
- **Why:** Comprehensive linking is part of "done" (memory `comprehensive-linking-density`); the renderer now surfaces these links, so the inconsistency (a handful clickable, the rest not) is visible to users. This is the natural completion of FOLLOWUPS #5 direction 1.
- **Context:** Source `steel-etl/input/monsters/Draw Steel Monsters.md` (usage = 2nd cell of the 2×2 ability spec table, `> | **<keywords>** | **<usage>** |`). Confirm each phrase has a `rule.combat/*` target before linking (`triggered-action` exists; verify `main-action`/`maneuver`/`move-action`/free-action variants in `steel-etl/docs/linking-reference.md` — mint any missing glossary codes per the one-heading-one-code gotcha, memory `rule-scc-type`). The parser already strips the surrounding `**bold**` and resolves links in the usage cell, so no parser change is needed — purely a source-annotation sweep. Heroes/summoner sources likely have the same gap in their ability tables — check and fold in if cheap.
- **Effort:** S–M (mechanical sweep, but verify/mint the action-term glossary targets first)

## 15. Back-link class-owned statblocks/featureblocks to their owning class

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `c3714a6`,
reviewed/approved): `augmentClassOwnedBackLinks` (rival back-link pattern reused verbatim,
`.sb-backlink`), 36 pages gain the link (14 beastheart companion species ×2 pages, 4
summoner fixtures ×2), zero leaks into class landings/rival pages. Runs after
`embedItemCards` (ordering bug caught+fixed+documented in build.go). Devil Detective
retainer deferred by scope (structurally excluded).

- **Identified:** 2026-06-15, while adding the Rival Summoner summons cards + summon→summoner back-links (`docs/superpowers/specs/2026-06-15-rival-summoner-summons-design.md`).
- **What:** Bestiary entities that belong to a hero **class** — beastheart companions (`monster.companion.beastheart.<species>` + their `…-advancement-features`) and summoner fixtures (`monster.fixture.<element>.<id>` + their `…-advancement-features`) — should carry an on-page back-link to their owning class page (`class/beastheart`, `class/summoner`). This is the class-owned analog of the rival summon→summoner back-link being built now; the rival back-link mechanism is the model to reuse.
- **Why:** These entities live deep under `monster/*` with no on-page pointer to the class that conjures/bonds them, so a reader landing on `monster/fixture/demon/the-boil` (or a companion species page) has no path back to the Summoner/Beastheart class that owns it. Provenance + navigation.
- **Context:** companion pages `v2/docs/Browse/monster/companion/beastheart/<species>(-advancement-features)`, fixture pages `v2/docs/Browse/monster/fixture/<element>/<id>(-advancement-features)`; class targets `class/beastheart.md`, `class/summoner.md`. Rendering lives in `steel-etl/internal/site/` (statblock + featureblock page builders); the relationship is derivable from the SCC type path's class segment (`companion.beastheart`, `fixture` under the summoner book). Keep separate from the rival effort — rivals are NPC statblocks, not class-owned.
- **Effort:** S–M (a shared "owning-class back-link" helper in the site page builders).

## 18. Stale "client-side statblock island" docs — statblocks already render build-time

**Status:** done — 2026-07-18 in worktree site-followups (`steel-etl` `fabbd70`, superproject
`3e3678b`): reality verified (migration fully shipped; `steel-statblock.js` already deleted
in v2 `7fca6cc1d0`; statblocks.md/site-builder.md already accurate). Fixed the two genuinely
stale spots: ROADMAP #7 re-scoped to its one remaining piece (malice-band embedding ≡
FOLLOWUPS #7 item 1, effort M) and a misleading phrase in steel-etl/CLAUDE.md.

- **Identified:** 2026-06-18, investigating Plan 6 (retainer rework) rendering.
- **What:** Several docs still describe monster/retainer statblocks as **client-side JSON islands** awaiting a build-time-HTML migration, but that migration already shipped: `buildStatblockIslandPage` (`steel-etl/internal/site/statblock_page.go`) renders the build-time `.sb-wrap` card via `renderStatblockCard` (its own comment: "it no longer emits a JSON island"), **0** built pages contain `sc-statblock-mount`, and `v2/site/javascripts/steel-statblock.js` is dead code. Stale references: `ROADMAP.md` #7 (lists "move statblocks from client-side JSON island to build-time HTML" as open), `steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md` (describe the island as live).
- **Why:** The docs actively mislead — an agent reading them will believe statblocks need a migration that's done, and may mis-plan around a JSON island that no longer exists (it nearly derailed Plan 6's scoping).
- **Context:** Correct the three doc locations; **re-assess what genuinely remains of ROADMAP #7** — part (a) (island → build-time HTML) appears complete; part (b) (entity-embedding, `embed_cards.go`) partly shipped for Browse. Decide whether #7 is done, partly-done, or should be re-scoped, and delete the dead `steel-statblock.js` if nothing references it.
- **Effort:** S (doc correction + a grep to confirm `steel-statblock.js` is unreferenced before deleting).

## 19. Stale summoner statblock codes in `summoner-linking-reference.md`

**Status:** open

- **Identified:** 2026-06-19, hand-adding the fixture advancement member codes (ROADMAP #16) to the linking reference.
- **What:** The **Statblocks** section of `steel-etl/docs/summoner-linking-reference.md` lists summoner minions/fixtures/champions/rivals under their **pre-`monster.*`-rehoming** codes (e.g. `mcdm.summoner.v1/minion.demon.statblock/…`, `fixture.demon.statblock/the-boil`, `champion.demon.statblock/…`). The actual registry (Plan 5c/6) homes them under `monster.*`: `monster.minion.summoner.<portfolio>.statblock/<id>`, `monster.fixture.<element>.featureblock/<id>` (+ the new `feature.fixture.*` members), `monster.champion.summoner.<portfolio>.statblock/<id>`, `monster.rival.<echelon>.statblock/<id>`. (Summoner **retainers** re-minted to `monster.retainer.statblock/<id>` on 2026-06-21 — their four rows in the reference were corrected in that same change; the minion/fixture/champion/rival rows below remain the stale ones.)
- **Why:** Anyone authoring `scc.v1:` links from these curated codes will write dangling links; the reference is supposed to be the canonical linkable-target list.
- **Context:** Refresh the section against `classification.json` (`grep -oE "mcdm.summoner.v1/monster\.[a-z.]+statblock/[a-z-]+"` etc.). Pre-existing drift, not introduced by #16 — the #16 fixture-member subsection added 2026-06-19 is already correct. Likely the Monsters-book linking reference has similar drift worth a glance.
- **Effort:** S (mechanical code refresh in one curated table).

## 20. Strip the genuinely-dead per-card head CSS selectors superseded by `.sc-head`

**Status:** open — **scope narrowed 2026-06-24 (chrome-restore, steel-etl 754c31e / v2 da9641d); read this before deleting anything.**

- **Identified:** 2026-06-24, landing the unified 6-slot card header (`docs/superpowers/specs/2026-06-23-unified-card-header-design.md`).
- **⚠️ NOT dead — load-bearing:** `.sb__head` and `.fb__head` are **re-attached to the main head** by `renderCardHead`'s `Class` field (`statblock_card.go` sets `Class:"sb__head"`, `featureblock_page.go` `Class:"fb__head"`) and **carry the role-gradient band, centered diamond, role border, and the statblock sticky-reveal `view-timeline`**. Deleting them re-flattens the cards (the original regression this follow-up almost caused). Likewise the typography rules now re-pointed onto the new slots — `.sb__head .sc-head__left-primary`/`__right-primary`, `.fb__head .sc-head__*`, `.sc-trait > .sc-head*` (underline + name + eyebrow), `.sc-ability > .sc-head .sc-head__left-primary` — are **live**, not dead.
- **What's actually safe to strip:** only the selectors no Go renderer emits anymore — the inner head pieces of the OLD DOM: `.sb__head-row`, `.sb__kw`, `.sb__class`, `.sb__level`, `.sb__role`, `.sb__ev`, `.md-typeset .sb__name` (statblock); `.fb__eyebrow`, `.md-typeset .fb__name` (featureblock); `.sc-ability__head`/`__titles`/`__eyebrow`/`__corner`/`.sc-ability__name` (ability); `.sc-trait__head`/`__titles`/`__eyebrow`/`__tag`/`.sc-trait__name` (traits); `.sc-prev__head`/`__titles`/`__eyebrow`/`__tag`/`__name` (indexes). Keep `.sb__head`/`.fb__head` and the sub-feature wrappers `.sb__feat-head`/`.fb__feat-head`.
- **Why:** Dead inner selectors mislead the next agent and bloat the sheets — but the head-element + re-pointed-slot selectors are the chrome and must stay.
- **Context:** Confirm each candidate is unemitted before deleting: `grep -rn '<selector>' steel-etl/internal/site/*.go` returns nothing. Do NOT grep-and-delete by the `.X__head` prefix blindly — that catches the load-bearing `.sb__head`/`.fb__head`.
- **Effort:** S (mechanical, per-sheet — but verify against the live class list above first).

## 21. Verify the summoner-fixture `left-deck` provenance renders on live pages

**Status:** open

- **Identified:** 2026-06-24, landing the unified card header (the fixture `left-deck` path was the one slot with no unit-test fixture exercising the real page round-trip).
- **What:** A summoner fixture's `left-deck` provenance ("Summoner · ‹Element›") is derived by `fbOrigin(scc)` in `buildFeatureblockPage` (`steel-etl/internal/site/featureblock_page.go`), keyed off the SCC type-path `monster.fixture.<element>.featureblock`. `TestFbOrigin_Fixture` covers the helper, but no test renders a real fixture page end-to-end, so confirm on the deployed site that e.g. `Browse/monster/fixture/demon/the-boil` actually shows "Summoner · Demon" in the deck (and that the element segment title-cases correctly for multi-word elements, if any).
- **Why:** It's the only header slot whose data plumbing (SCC → deck) wasn't validated against a real generated page; a wrong/empty deck would silently drop fixture provenance.
- **Context:** Live page under `v2` (Brave per memory `reference_playwright_mcp_broken`), or grep the generated leaf: `grep -o 'sc-head__left-deck[^<]*</div>' v2/docs/Browse/monster/fixture/*/*.md`. If empty, the fixture frontmatter `scc` may not match the `monster.fixture.<element>.featureblock` shape `fbOrigin` expects — adjust the matcher.
- **Effort:** XS (verify; small matcher tweak only if it's wrong).

## 22. v2 deploy is racy — `mkdocs gh-deploy --force` with no concurrency guard

**Status:** done 2026-06-24 — added a workflow-level `concurrency: { group: pages-deploy, cancel-in-progress: false }` to `v2/.github/workflows/ci.yml`, so `ci` runs queue instead of racing: two pushes close together now deploy in order and `gh-pages` ends at the later commit (no force-push-clobber by an earlier build). Chose queue (not cancel) so a superseding run can't skip the final deploy. The optional `just deploy-v2` single-commit cleanup was **not** done — with the guard it's an efficiency nicety (avoids a redundant queued run), not a correctness fix; left for later if the extra run proves annoying.

- **Identified:** 2026-06-24, debugging "still no gradient" after the card-head chrome deploy.
- **What:** `v2/.github/workflows/ci.yml` runs `mkdocs gh-deploy --force` on **every** push to `main`, with **no `concurrency:` block**. Two pushes close together (here: the CSS chrome commit, then the deploy's `chore: update v2 site content` commit ~30s later) each spawn a `ci` run; both force-push `gh-pages`, and whichever finishes last wins. The earlier-content (CSS-only) run won, force-pushing `gh-pages` back to HTML that predated the content regen — so the live site served stale HTML (`class="sc-head"` without `sb__head`) even though both the CSS and the regenerated HTML were correct on `main`. Manual fix that worked: `gh run rerun <content-commit-run-id>` once nothing else was pushing.
- **Why:** Any normal deploy that also bumps another commit (e.g. a code change + its `chore: update v2 site content` pair — the standard `just deploy-v2` shape!) can silently publish the wrong build. This will recur.
- **Fix:** Add a concurrency guard to `ci.yml` so deploys serialize instead of racing, e.g. `concurrency: { group: pages-deploy, cancel-in-progress: false }` (queue — don't cancel, or a superseding run could skip the final deploy). Consider also having `just deploy-v2` make a **single** commit (or push superproject + v2 in an order that triggers one CI run), so there's only one deploy per logical deploy. Re-check after: two rapid pushes should end with `gh-pages` at the LATER commit.
- **Effort:** XS (add `concurrency:` to `ci.yml`) + S (optional deploy-recipe single-commit cleanup).

## 24. D6: vault-classification vs compendium-index timing mismatch

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `0fe7c6b`, 2026-07-18,
reviewed/approved): `CompendiumIndex.getEntry` gained the same path-derivation fallback as
`SccResolver.resolve` (opportunistic index-seeding, generation-guard preserved; getEntity/
getStatblock route through getEntry). `query()`/`resolveSlug()` stay index-only by scope.

`SccResolver.resolve` (used for `cx.sccAnchors` classification) tries path-derivation
against the managed compendium root first, falling back to the lazily-seeded frontmatter
index; `CompendiumIndex.getEntity`/`getEntry` (RefUnwrapView's typed-model lookup) is
index-only. A freshly-synced compendium file can classify `vault` via `sccAnchors.resolve`
before `CompendiumIndex` sees it, producing a transiently-misleading "found but not
renderable — re-sync" card where re-syncing won't help. Confirmed real (D6 Task 3 review,
2026-07-17), pinned by test, scoped out of the D6 build. Fix by waiting for
`metadataCache` to settle after sync, or giving `CompendiumIndex.getEntry` the same
path-derivation fallback `SccResolver.resolve` has.

## 25. steel-etl: DSELinkedGenerator drops Children — md-dse-linked kits never emit ds-feature fences

**Status:** done — fixed in worktree f2 (`steel-etl` `310ecef`, 2026-07-18): `WriteSection`
now recursively resolves+copies `Children`; verified red→green, full pipeline regen shows
exactly the expected 25 heroes kit files (+25 unified mirrors) gaining their fence. Lands
with the f2 worktree.

Found during the D6 MUST-FIX (2026-07-17, stash-diff-confirmed pre-existing):
`DSELinkedGenerator` never copies `Children` when deriving md-dse-linked from md-dse,
so md-dse-linked kit files have NEVER contained their ` ```ds-feature ` fence. Harmless
today (DSE consumes md-dse, not md-dse-linked, per F2 OD-3), but the format is
advertised as "identical except link encoding" — either fix the Children copy or
document the divergence in ARCHITECTURE's format table.

## 26. DSE: anchor passthrough for counter/negotiation/stamina-bar persisted models

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `d1d01d0`, 2026-07-18,
reviewed/approved): optional `_dse_anchor` passthrough on all three models, round-trip
byte-stable, D8 emission-order convention.

The sidebar host's `_dse_anchor` key survives parse/serialize for initiative and the four
D8 trackers, but counter, negotiation, and stamina-bar build fixed-field model instances
that drop unknown keys — if one of those is ever sent to the sidebar, its first persist
drops the anchor (the visible read-only degrade net catches it; no silent no-save). Root
fix: an optional passthrough field on those three models, per D8 spec §1.5. Low priority —
none has a sidebar mount today. (D8 final review, 2026-07-18.)

## 27. DSE stamina: winded boundary off-by-one in kit core + modal Spend Recovery unsynced

**Status:** done — fixed in worktree f2 (`draw-steel-elements` `a165341` + fix-round
`e8b19e8`, 2026-07-18, reviewed/approved): kit bar winded boundary now `<=` (RR "half or
below"); Spend Recovery gates on `recoveries_max`, decrements the counter, disables with
visible reason at zero, heals from the model's recoveryValue; recovery-spend math
consolidated into one shared helper; jest setTooltip mock now mirrors production
aria-label behavior (a mock/production divergence had hidden a stale-tooltip bug).

Two related items from D7 Task 4 review (2026-07-18): (a) the shared
`framework/kit/StaminaBarPanel.ts` bar-fill color uses `current < floor(max/2)` but the
rule is winded at half **or below** (`reference/draw-steel-reference.md:274-278`) — the
new winded badge is correct (`<=`), so the two indicators disagree at exactly half
stamina; fix the kit core with boundary-case golden updates as its own scoped change.
(b) `StaminaEditModal`'s pre-existing "Spend Recovery" quick button heals `floor(max/3)`
but never decrements the new `recoveries` counter and has no zero-remaining gate — sync
it with the D7 recoveries model.

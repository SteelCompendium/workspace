# Follow-ups

In-scope tangents found while working — important to fix, but they'd derail the task
at hand. Add a numbered `## N.` section below instead of chasing them now, and
**clear these before starting a new feature.** New features and larger efforts go in
`ROADMAP.md`, not here.

Each item keeps the detail fields (**Identified / What / Why / Context / Effort**) that
save the next person a grep. Mark a finished item with a `**Status:** done` line; on a
periodic cleanup pass, completed items are moved to `docs/followups-archive/` and the
rest renumbered. Most recent archive: [`docs/followups-archive/2026-06-08-completed.md`](docs/followups-archive/2026-06-08-completed.md).

<!-- Template — copy for each item, numbering sequentially:
## N. Short title
**Status:** open
- **Identified:** YYYY-MM-DD and the work it came up in
- **What:** brief description
- **Why:** motivation / value
- **Context:** file paths, gotchas, anything that saves grep time
- **Effort:** XS (<1 h) / S (1–4 h) / M (1 day) / L (multi-day) -->

## 1. Beastheart source says "Animal Handling"; the skill is "Handle Animals"

**Status:** open

- **Identified:** 2026-06-02, beastheart linking pass.
- **What:** The beastheart class skill grant (`Draw Steel Beastheart.md`, Basics, ~L294) reads "You gain the **Animal Handling** skill" and lists "Animal Handling" in the Quick Build. The actual Draw Steel skill is **Handle Animals** (`mcdm.heroes.v1/skill.interpersonal/handle-animals`). Left UNLINKED to avoid a display-text/term mismatch; "Navigate" and "Track" on the same line were linked.
- **Why:** Either the source has a naming inconsistency to correct (rename to "Handle Animals"), or it's an intentional alt-name that should be linked to `skill.interpersonal/handle-animals` with alt display text. Resolve, then link.
- **Context:** Single occurrence pair on one line. Confirm against the Beastheart PDF (book Basics page) before renaming source content. If renamed, also link it to `skill.interpersonal/handle-animals` (skills were nested under groups 2026-06-08).
- **Effort:** XS

## 2. Beastheart companion stat blocks not published to Browse (broken `feature-group/companion/*` links)

**Status:** open

- **Identified:** 2026-06-02, Read-tab-by-book work
- **What:** Companion stat blocks are emitted as `feature-group/companion/<name>.md` in `md-linked`, but `feature-group/` is **not** in `v2/site.yaml`'s Browse `include:` list, so companion pages are never published. Every `scc:.../feature-group.companion/<name>` cross-reference (≈7 distinct companions, ~26 link instances across the Beastheart class page and the new `Read/beastheart/the-beastheart-class.md` chapter) therefore dangles. Pre-existing on `main` (the Beastheart class page on the live site had the same broken links); the Read-tab work duplicated the links into the Read chapter but did not cause the root gap.
- **Why it matters:** Companion stat blocks are core Beastheart content; the links are clickable-but-404. Adding `feature-group/` to the Browse `include:` would publish them and resolve the links — but first confirm companions are *meant* to be standalone Browse pages vs. embedded-only in the class page (they already render inline in the class subtree). If standalone, also decide their index/title treatment.
- **Context:** `v2/site.yaml` Browse `include:`; companion sources in `data/data-beastheart/en/md-linked/feature-group/companion/`. `matchesSection` uses prefix matching, so `feature/` does **not** match `feature-group/`.
- **Effort:** S (one-line include + verify) once the design intent is confirmed.

## 3. `transform_indexes.py` is dead code for the current card index pages

**Status:** open

- **Identified:** 2026-06-04, card markdown-rendering / `.md`-link fix
- **What:** `v2/scripts/transform_indexes.py` (run as step 4 of the `just deploy-v2` / `update` recipe) only matches files named `_Index.md` or `Index.md` (capitalized) via `rglob`, and only rewrites markdown **tables** into `browse-index` lists. The current `steel-etl site` builder emits lowercase `index.md` pages rendered as raw-HTML `sc-card` grids (see `internal/site/cards.go`), which the script never matches and which contain no tables. So the step is effectively a **no-op** — it transforms nothing on a normal build.
- **Why it matters:** Dead pipeline step is misleading (it looks like index pages are post-processed when they aren't — this cost real debugging time tracing how card links resolve). Either remove the step from the justfile + delete the script, or confirm whether any remaining table-style `Index.md` pages still depend on it before deleting.
- **Context:** `v2/justfile` step 4 (`scripts/transform_indexes.py docs/Browse`); the script's `main()` globs `_Index.md` / `Index.md` only. Card pages are generated lowercase `index.md` by `buildCardsContent` in `steel-etl/internal/site/cards.go`. Confirm with `find v2/docs/Browse -name 'Index.md' -o -name '_Index.md'` (expected: none) before removing.
- **Effort:** XS (verify no matches, then drop the step + script)

## 4. Kit-flatten breaks cross-reference links to kit ability pages (mkdocs build warnings)

**Status:** open

- **Identified:** 2026-06-05, surfaced while verifying the `navigation.indexes` (section-index-pages) change with `mkdocs build`.
- **What:** The Browse `kit` group in `v2/site.yaml` uses `flatten: true`, relocating each kit ability page from `feature/ability/{kit}/{ability}.md` → `feature/ability/Kits/{kit}-{ability}.md`. But SCC cross-reference links in the source docs still point at the **un-flattened** path, so they 404. 6 such `not found among documentation files` warnings on a clean build: `Read/heroes/classes.md` (×3), `Read/heroes/rewards.md` (×1), `Read/heroes/treasures.md` (×1), and `Browse/treasure/leveled/weapon/blade-of-the-luxurious-fop.md` (×1) — e.g. link `Browse/feature/ability/sniper/patient-shot.md` vs actual page `Browse/feature/ability/Kits/sniper-patient-shot.md`. Affected kits seen: sniper, shining-armor, martial-artist, swashbuckler.
- **Why it matters:** Clickable-but-404 links to kit ability pages, plus persistent build warnings. The flatten is a site-builder transform, so source link text can't easily anticipate the rewritten path — the fix likely belongs in the flatten step (rewrite inbound links and/or emit a redirect stub at the old path), not in the source markdown.
- **Context:** Flatten logic: `groups[].flatten` in `steel-etl/internal/site/config.go` + `build.go`; the `Kits` group is defined in `v2/site.yaml` Browse section. Note the other 9 build warnings (`Read/beastheart/the-beastheart-class.md` → `feature-group/companion/*`) are a **separate** root cause already tracked in item #2 above, not this one.
- **Effort:** S

## 5. Settings panel: card-style toggle still triggers a full page reload

**Status:** dormant — control hidden 2026-06-09 (see #6); revisit when re-enabling.

- **Identified:** 2026-06-07, while building the live settings drawer (`v2/.repo-docs/plans/2026-06-07-live-settings-panel.md`).
- **What:** The "Ability card style" control in the new live settings drawer (`v2/docs/javascripts/settings-panel.js`) calls `location.reload()` on change, carried over from the old preferences page. Every other control in the drawer applies instantly via a `<html>` attribute / CSS variable with no reload.
- **Why it matters:** It conflicts with the drawer's "change settings without navigating away / see it live" goal for that one control — the reload closes the drawer and flashes the page.
- **Fix options:** Investigate whether classic↔modern can be a pure CSS/attribute swap (it already toggles `data-card-style` on `<html>`). If some ability-card markup is build-time only (the classic glyph badges vs. modern colored borders may be emitted by `steel-etl`, not pure CSS), document why the reload is required, or do a lighter in-place re-render of just the affected cards instead of a full reload.
- **Effort:** S (investigate + likely small JS/CSS change)

## 6. Settings panel: re-enable "Color theme" and "Ability card style" once fully supported

**Status:** open

- **Identified:** 2026-06-09, cleaning up the settings drawer.
- **What:** The "Color theme" select (Steel / Parchment / Obsidian → `data-sc-theme`) and the "Ability card style" select (Classic / Modern → `data-card-style`) were **hidden** from the drawer markup in `v2/docs/javascripts/settings-panel.js` because the alternate palettes/styles aren't fully baked. Only the markup was removed — the apply functions (`applySiteTheme`, `applyCardStyle`), their bindings (now null-guarded), `palette.css` `[data-sc-theme]` blocks, and `ability-cards.js` modern handling all remain in place.
- **Why it matters:** Half-finished controls were exposed to users. They're parked, not deleted, so re-enabling is just re-adding the two markup blocks (commented anchors mark both spots).
- **Fix options:** Finish the alternate palettes (most `--sc-*` brand tokens aren't overridden by `[data-sc-theme]`, so themes barely change the page today) and the Modern card style, then restore the markup. Fold #5 (card-style reload) into that work.
- **Effort:** M (design + CSS to make the themes/styles actually comprehensive)

## 7. Beastheart book still links hero skills with the old flat `skill/<item>` form

**Status:** open

- **Identified:** 2026-06-09, during the group-landing SCC migration deploy (`steel-etl site` emitted `WARN: unresolved scc link mcdm.heroes.v1/skill/track` etc.).
- **What:** `steel-etl/input/beastheart/Draw Steel Beastheart.md` has **25** cross-reference links (12 distinct skills) in the pre-2026-06-08 flat form `scc:mcdm.heroes.v1/skill/<item>` — `skill/track`, `skill/hide`, `skill/alertness`, `skill/endurance`, `skill/handle-animals`, `skill/intimidate`, `skill/magic`, `skill/nature`, `skill/navigate`, `skill/read-person`, `skill/search`, `skill/sneak`. These codes ceased to exist on 2026-06-08 when hero skills were grouped to `skill.<group>/<item>`; the sweep that day repointed the **heroes** doc but missed the **beastheart** doc. Unrelated to the group-landing migration (which touched only group landings, not leaf skills).
- **Why it matters:** Every deploy logs unresolved-link warnings, and these companion/statblock skill references render as dead links on the live site.
- **Fix options:** Repoint each `skill/<item>` → `skill.<group>/<item>` using the authoritative skill-id→group map in `steel-etl/docs/superpowers/plans/2026-06-08-skill-groups-nesting.md` (e.g. `skill/track` → `skill.intrigue/track`, `skill/nature` → `skill.lore/nature`, `skill/endurance` → `skill.exploration/endurance`). All 12 ids are in that map. Then re-gen and confirm zero `skill/<item>` warnings.
- **Effort:** S (mechanical per-id replace in one file + regen)

## 8. Restamp bare `scc:` links to explicit `scc.v1:` across all inputs

**Status:** open (deferred deliberately)

- **Identified:** 2026-06-09, during the SCC scheme-versioning design (`steel-etl/docs/superpowers/specs/2026-06-09-scc-scheme-versioning-and-format-design.md`).
- **What:** The SCC scheme now carries an explicit scheme-version prefix (`scc.v1`), with bare `scc:` defined as a permanent implicit-v1 alias. The canonical form is explicit, but the ~17,527 existing in-prose `scc:…` links and the registry were left bare to avoid a high-churn sweep. This follow-up restamps bare `scc:` → `scc.v1:` across all source inputs (heroes, beastheart, monsters, and the in-flight new sourcebook) and emits explicit going forward.
- **Why it matters:** Cosmetic/consistency only — bare and explicit are equivalent by definition, so nothing is broken meanwhile. Worth doing in one pass once the new sourcebook lands, rather than piecemeal.
- **Fix options:** Mechanical `scc:` → `scc.v1:` replace across `steel-etl/input/**/*.md` (guard against already-prefixed `scc.vN:` and against non-link `scc` text); update the registry to record `scheme_version`; confirm the resolver normalizes both forms. Coordinate timing with the new-sourcebook agent so it's a single sweep over all inputs.
- **Effort:** M (broad but mechanical; one sweep across all input docs + registry + regen)

## 9. Surface `scheme_version` in the published SCC resolution API

**Status:** done (2026-06-09) — `scheme_version` added top-level to `index/scc/types.json` and to each per-entry `resolve/*.json` (self-describing) via `apiResolveEntry`, threaded from `Registry.SchemeVersion()`. `entries[]` arrays kept lean. Deployed via `just deploy`.

- **Identified:** 2026-06-09, verifying the scheme-versioning deploy.
- **What:** The registry now records `scheme_version` (`steel-etl/classification.json`), but that file is **gitignored** — external tools consume the published API at `steelCompendium.github.io/docs/api/v1/` (`index.json`, `scc.json`, per-entry `resolve/*.json`), which does **not** include `scheme_version`. So the scheme version a code was minted under doesn't actually reach API consumers, partially undercutting the point of versioning (a 3rd-party tool can't tell which grammar a code uses).
- **Why it matters:** The whole motivation for the scheme version is forward-safety for external consumers; if it's only in an internal gitignored file, consumers can't act on it.
- **Fix options:** Add a `scheme_version` field (from `Registry.SchemeVersion()`) to `apiIndex` and `apiRegistry` in `steel-etl/internal/output/scc_api.go` (next to the existing `version`), thread it via a `SchemeVersion int` on `SCCAPIGenerator` set in `internal/pipeline/pipeline.go`, update `internal/output/scc_api_test.go`, then `just deploy-api`. **Design decision:** top-level only, or also embed in every per-entry `resolve/*.json` so a single-code fetch is self-describing? (Recommend: both the two index files and per-entry resolve files, so any single fetch carries it.)
- **Effort:** S (additive field + test + deploy-api)

## 10. Link the bestiary pages into the SCC cross-reference sweep

**Status:** open

- **Identified:** 2026-06-10, the bestiary restructure (Plan A: moved monster / dynamic-terrain / retainer trees from the Bestiary tab into Browse, `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-restructure.md`).
- **What:** The Monsters-book pages (statblocks, malice/Tactical Stance featureblocks, dynamic terrain, retainers) are now first-class Browse pages with their own SCC codes, but they are **not yet wired into the in-prose `scc:` cross-reference sweep** the heroes doc uses. Two directions are missing: (1) links *out of* the Monsters source — statblock keywords, inflicted conditions, abilities, movement types, etc. should link to their SCC pages; (2) links *into* monster pages — other books should be able to reference a monster/terrain/retainer by SCC.
- **Why:** Comprehensive linking is part of "done" for this project (see memory `comprehensive-linking-density`); the bestiary is currently an island.
- **Context:** Source is `steel-etl/input/monsters/Draw Steel Monsters.md` (hand-maintained; H7=statblock, H9=featureblock/terrain — see `steel-etl/CLAUDE.md` "Monsters book"). Follow `steel-etl/docs/linking-guide.md` + `docs/linking-reference.md`. Conditions/skills/movement terms are already linkable targets. Mind the one-heading-one-code gotcha (memory `rule-scc-type`). This is a sizable sweep, akin to the heroes-doc passes.
- **Effort:** L (multi-day sweep across the whole Monsters source)

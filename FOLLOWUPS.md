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

## 8. Summoner book: site-rendering refinement pass (formatting, not fidelity)

**Status:** open — refinement effort (kept on the `summoner-conversion` branches; not merged/deployed)

- **Identified:** 2026-06-10, on local-site review of the freshly converted Summoner book. The fidelity gate proves word-for-word accuracy but **strips markdown, so it never checks formatting/rendering** — these are all rendering-layer issues, the source `.md` is clean (zero stray `---`, zero `#` in heading text, zero unrendered `⟦glyph⟧` placeholders).
- **What (diagnosed root causes):**
  1. **Spurious `<hr>` (`---`) after the class chapter heading.** The book-faithful `RenderSubtree` injects a `---` between `# The Summoner Class` (empty-body chapter) and its immediate child `## Summoner` (the class node). Tied to the synthetic chapter+class split (see below). Renders as a horizontal rule on the site. (Confirmed: `v2/docs/Read/summoner/the-summoner-class.md` line 12.)
  2. **Power-roll panels don't render in ability cards.** Browse ability pages DO get the `.sc-ability` card, but the power-roll tier panel is empty (`sc-power-roll` count 0) — `renderAbilityCard`/its power-roll parser (`internal/site/ability_cards.go`) doesn't recognize the summoner tier format (`**Power Roll + Reason:**` + `- **≤11:** …` / `- **12-16:**` / `- **17+:**`). In the Read book-faithful chapter, abilities are plain markdown (no card) so tiers show as literal bulleted text incl. `≤11` — expected for Read, but the Browse card panel should populate. Likely related to the literal-prefix-regex fragility noted in memory `project_scc_link_breaks_literal_regexes`.
  3. **Headers showing `##`** (user-reported) — NOT reproduced in the built HTML during diagnosis (H7 statblock headings ARE normalized to H6 by RenderSubtree; no literal `#######` in output). Needs the user to point at the exact page; candidate is `{data-scc="…"}` attr_list not being processed on certain inline statblock headings.
  4. **Probably more** (user's words) — a full rendering pass is needed; the input doc itself is "not quite finished."
- **Structural note:** items (1) and the documented `+1 summoner` gate token both stem from the **synthetic `## Summoner` class node under a `# The Summoner Class` chapter** (single-class supplement). Collapsing to a single `@type: class` H1 (shifting sub-headings up one level) would likely remove both — but needs verifying it doesn't break the Read-tab per-book chapter grouping. Worth evaluating during the refinement.
- **Why it matters:** The content is faithful and complete, but the rendered presentation (HRs, unstyled power rolls) is below the bar for publishing. Must be cleared before merge/deploy.
- **Fix options:** (a) Extend `ability_cards.go`'s power-roll parser to accept the summoner tier format (also benefits any book using that exact form); (b) fix the empty-chapter `---` injection in `RenderSubtree` (or restructure the class node per the structural note); (c) get the exact `##`-in-header page from the user and trace the attr_list handling. Re-run `steel-etl site` + `mkdocs build` to verify each.
- **Effort:** M (site-render code in steel-etl + a structural decision + re-verify the whole book renders cleanly)

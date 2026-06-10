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

**Status:** done — 2026-06-10. Investigated against the generated output (plan: [`docs/superpowers/plans/2026-06-10-summoner-render-refinements.md`](docs/superpowers/plans/2026-06-10-summoner-render-refinements.md)). Two of the four diagnosed items were **non-issues**; the two real defects are fixed. Kept on the `summoner-conversion` branches (not merged/deployed).

- **Identified:** 2026-06-10, on local-site review of the freshly converted Summoner book. The fidelity gate proves word-for-word accuracy but **strips markdown, so it never checks formatting/rendering**.
- **Outcome per original item:**
  1. **Spurious `<hr>` (`---`) after the class chapter heading → NOT a bug.** It is **intentional site-wide styling**: `injectH1`/`injectHRAfterH1` (`steel-etl/internal/site/build.go:550‑604`) put a `# Title` + `---` header rule on *every* book-faithful page (every heroes Read page has it: `# Combat` + `---`). Not injected by `RenderSubtree`, not summoner-specific. No change.
  2. **Power-roll panels empty on *class* abilities → NOT a bug (selector misdiagnosis).** The diagnosis searched for CSS class `sc-power-roll`; the real class is `sc-ability__pr`. All 10 standalone class power-roll abilities render fully-populated tier panels. The renderer already handles the `**Power Roll + Reason:**` + `- **≤11:**` form. No change. **The genuinely broken power rolls are on *statblocks*** (see fix below).
  3. **Headers showing `##` → the H8 `########` leak (FIXED).** Retainer/rival statblocks carry H8 `######## Level N Retainer Advancement Ability` sub-labels, which are intentionally *not* collected as sections (they fold into the statblock body) and so leaked as literal hashes through `RenderSubtree`. `nodeBody` now demotes any 7+-hash heading to `**bold**` (`demoteOverflowHeadings`, `render_subtree.go`). Cross-book win — also clears the **183** Monsters-book instances. (steel-etl `7529e1e`.)
  4. **Statblock power rolls render as plain paragraphs (FIXED).** Statblock signature abilities encode the roll in the title (`🏹 **… 2d10 + R (Signature Ability)**`) + **three bare digit-led tier paragraphs** (verified across all 26 instances; 13 lack the WEAK/AVERAGE/STRONG keyword, so positional detection is required). New `ability-cards-core.js` (pure, UMD, `node:test`) + `transformStatblockPowerRolls()` in `ability-cards.js` badge them low/mid/high, reusing the existing `.power-roll-tiers` CSS. (v2 `2322b4d8b0`.)
- **Deferred (new item #9):** the statblock *data* layer (dice stuck in `name`, tiers in `prose`) — JSON/YAML only, not the site.
- **Remaining for the user:** the input doc itself was "not quite finished" — a final content pass is the user's, not a render-code task. A broad artifact sweep of 264 summoner pages found no other leaks (no unresolved `scc:` links, leaked `{data-scc}`, `⟦glyph⟧`, `[[ ]]`, or broken tables).

## 9. Statblock parser drops the dice-in-title power roll into prose (data-layer, not site)

**Status:** done — 2026-06-10 (steel-etl `a863c9e`). `parseStatblockFeature` now detects a `Name Nd10 + <char>` title (`sbDiceRe`), lifts the dice to `effects.roll`, cleans `name`, and maps the three bare digit-led tier lines (`sbBareTierRe`) to `tier1/2/3` by position. Reuses the existing `effects` fields (no schema change). Verified on regenerated data: **23/24** signature abilities now carry roll+tiers across all variants (`+ R`, `+ 2/3/4/5`, `+ highest characteristic`); the 24th (rival "Strike for Me") genuinely has no power roll and is correctly left as an effect. Monster labeled-form (`**Power Roll +**` + `**≤11:**`) is unaffected (dice path only triggers when the title carries dice). Test: `TestParseStatblockFeatureDiceInTitle`. **Known minor (pre-existing, separate):** the prose/effect path keeps the literal `**Effect:**` prefix in `effects[].effect`, and an `Effect:` line that follows a power roll is still dropped — true for the monster form too; out of scope here.

- **Identified:** 2026-06-10, while fixing #8 (statblock power-roll *site* rendering).
- **What:** For the summoner statblock signature-ability format (`🏹 **Molten Strike 2d10 + R (Signature Ability)**` + three bare digit-led tier lines), `parseStatblockFeature` (`steel-etl/internal/content/statblock_parse.go`) (a) leaves the dice notation inside the parsed `name` (e.g. `name: "Molten Strike 2d10 + R"` instead of `name: "Molten Strike"` + `roll: "2d10 + R"`), and (b) drops the three tier outcomes into `prose` rather than `effects.tier1/2/3`. Root cause: `sbPowerRollRe` only matches a `**Power Roll +**` header and `sbTierRe` only matches labeled `- **≤11:**` bullets — neither matches the dice-in-title / bare-tier form. Affects **26** summoner abilities.
- **Why it matters:** This is the **data** contract (JSON/YAML in `data/data-summoner`, consumed by the SDK / data repos), separate from the site (the site renders the md-linked blockquote and is already fixed in #8 via runtime JS). The minion/fixture/champion/retainer/rival statblock JSON currently has malformed `name` and no structured `effects` tiers.
- **Context:** `internal/content/statblock_parse.go` effects loop (~L191‑230); `sbTitleRe`/`sbParenRe`/`sbPowerRollRe`/`sbTierRe` (~L80). The Monsters book uses the labeled form (0 dice-in-title), so this is summoner-only today — but the parser should handle **both**. Add detection: if the title carries `\d+d\d+\s*\+`, strip it to `roll` and treat the following digit-led prose lines as `tier1/2/3` by position. Mirror the verified rule from `docs/superpowers/plans/2026-06-10-summoner-render-refinements.md`. Update `statblock_parse_test.go` + (if a new field) both schema copies per the card-data-parity checklist.
- **Effort:** S–M

## 10. `settings-core.test.js` fails — max-width drift (test says 500, code says 300)

**Status:** open

- **Identified:** 2026-06-10, running the v2 `node:test` suite while adding `ability-cards-core.test.js` for #8.
- **What:** `v2/tests/settings-core.test.js` has **2 failing tests** (`node --test tests/` → 9 pass / 2 fail), both pre-existing and unrelated to the #8 work: (a) `"clampEm clamps to [44, 500] and snaps to step"` asserts `clampEm(600) === 500`, but `settings-core.js` defines `WIDTH_MAX_EM = 300`, so it returns `300`; (b) `"widthToControls maps stored width to slider state"` fails the same way (it routes through `clampEm` for an out-of-range stored width). The content-max-width cap was lowered 500→300 (the v2 footer/header / live-settings rework) without updating the test.
- **Why it matters:** A red test suite hides real regressions and erodes the "tests pass" signal. It's a one-sided drift — pick the source of truth and align the other side.
- **Fix options:** Decide the intended max content width. If 300 is correct, update the test's expectations (`clampEm(600) → 300`, the `[44, 500]` name, and the `widthToControls` case). If 500 is correct, bump `WIDTH_MAX_EM` back to 500 in `settings-core.js` (and check the slider's `max` in `settings-panel.js`/`steel-settings.css`). `settings-core.js:19` (`WIDTH_MAX_EM`), `settings-core.js:52` (`clampEm`), `tests/settings-core.test.js:38-49`.
- **Effort:** XS

## 11. Heroes skill-group links 404 — resolve to old `skill/group/<member>.md` path

**Status:** open

- **Identified:** 2026-06-10, `mkdocs build` during the #8 verification (24 link warnings).
- **What:** In-prose links to a skill-group landing render as `Browse/skill/group/<member>.md`, but the **2026-06-09 group-landing migration relocated** that page to `Browse/skill/<member>/index.md` (and there is no `skill/group/` folder). So every such link 404s. **24** `not found among documentation files` warnings on a clean build, all on `Read/heroes/{perks,rewards}.md` (groups: crafting, exploration, intrigue, interpersonal, lore). The md-linked heroes source still carries the old relative form, e.g. `data/data-rules/en/md-linked/chapter/perks.md` → `[crafting skill group](../skill/group/crafting.md)`. (The `swashbuckler/fancy-footwork` warning in the same build is the separate Kits-flatten issue #4, not this.)
- **Why it matters:** Clickable-but-404 links to skill-group landing pages on live heroes content, plus persistent build warnings. The 2026-06-09 migration repointed the **site landing** but the **link target** still resolves to the pre-relocation path.
- **Fix options:** Make the `scc:…/skill.group/<member>` link resolver emit `skill/<member>/` (the relocated index) instead of `skill/group/<member>.md` — likely in the md-linked link-resolution / `groupLandingIndexDest` mapping (`steel-etl/internal/site/build.go`), mirroring how the page itself was relocated. Confirm against `docs/superpowers/plans/2026-06-09-group-landing-scc-migration.md`. Then re-gen heroes (`gen --book mcdm.heroes.v1`) + `steel-etl site` + `mkdocs build` and confirm zero `skill/group/` warnings. Cross-check the same pattern doesn't affect `monster.group/<category>` links.
- **Effort:** S

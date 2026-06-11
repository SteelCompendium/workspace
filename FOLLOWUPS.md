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

**Status:** done — 2026-06-11. "Animal Handling" is a typo in the MCDM Beastheart PDF (bug report submitted to MCDM); the actual skill is **Handle Animals**. Both occurrences (beastheart source L297 — the Skills grant + Quick Build) are **already linked** to `scc:mcdm.heroes.v1/skill.interpersonal/handle-animals` with "Animal Handling" kept as display text (faithful to the book's wording, correct link target). A full-tree sweep (`grep -rniE 'animal handling' steel-etl/input/`) found no other instances. Nothing left to link.

- **Identified:** 2026-06-02, beastheart linking pass.
- **What:** The beastheart class skill grant (`Draw Steel Beastheart.md`, Basics, ~L294) reads "You gain the **Animal Handling** skill" and lists "Animal Handling" in the Quick Build. The actual Draw Steel skill is **Handle Animals** (`mcdm.heroes.v1/skill.interpersonal/handle-animals`). Left UNLINKED to avoid a display-text/term mismatch; "Navigate" and "Track" on the same line were linked.
- **Why:** Either the source has a naming inconsistency to correct (rename to "Handle Animals"), or it's an intentional alt-name that should be linked to `skill.interpersonal/handle-animals` with alt display text. Resolve, then link.
- **Context:** Single occurrence pair on one line. Confirm against the Beastheart PDF (book Basics page) before renaming source content. If renamed, also link it to `skill.interpersonal/handle-animals` (skills were nested under groups 2026-06-08).
- **Effort:** XS

## 2. Beastheart companion stat blocks not published to Browse (broken `feature-group/companion/*` links)

**Status:** done — 2026-06-11. Added `feature-group/` to the Browse `include:` in `v2/site.yaml` (the root holds only `companion/`). Each companion already carries its own scc code (`mcdm.beastheart.v1/feature-group.companion/<name>`, `type: feature-group`) and permalink stub, so they're now first-class standalone Browse pages and the ~7 inbound links from `Browse/class/beastheart.md` resolve. Cleared the 7 `feature-group/companion/*` mkdocs warnings.

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

**Status:** done — 2026-06-11. Root cause generalized: `rewriteSectionLinks` (`steel-etl/internal/site/build.go`) rewrote cross-section relative links but did **not** mirror the destination-path relocations `buildSection` applies to every page — so any link whose *target* page was relocated (kit flatten, skill-group landing, statblock hoist) 404'd. Fixed by applying the same transforms to the link target: `groupLandingIndexDest` → else `applyGroups` (the kit flatten, gated on `<sourceDir>/kit/<kit>.md` existing — `cfg.SourceDirList()` is now threaded in) → `hoistStatblockPath`, mirroring the if/else-if/else + hoist at lines ~196-211. Cleared all 9 kit-ability warnings (sniper/swashbuckler/shining-armor/martial-artist). Tests: `TestRewriteSectionLinks_KitFlattenTarget` + new cases in `TestRewriteSectionLinks`. Same change resolved #14.

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

**Status:** done — 2026-06-11. Repointed all 25 links (12 distinct skills) in `steel-etl/input/beastheart/Draw Steel Beastheart.md` from `scc:mcdm.heroes.v1/skill/<item>` to the grouped `skill.<group>/<item>` form, using the group mapping derived from the live generated heroes data: intrigue (track ×4, hide ×4, sneak ×3, alertness ×2, search ×1), interpersonal (intimidate ×3, handle-animals ×2, read-person ×1), exploration (endurance ×1, navigate ×1), lore (magic ×2, nature ×1). Regen confirmed **zero** `WARN: unresolved scc link mcdm.heroes.v1/skill/*`; the md-linked output now carries resolved relative links (e.g. `../skill/intrigue/track.md`). (FOLLOWUPS #1's unlinked "Animal Handling" display-text instance is separate and still open.)

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

**Status:** open — **unblocked 2026-06-11.** The **Summoner book** statblocks were fully link-swept (`steel-etl/docs/superpowers/plans/2026-06-10-summoner-content-linking.md`), which required hardening the shared statblock parser (`statblock_parse.go`: `sbDiceRe` + a `linkDisplay` helper) so link-wrapping can't break extraction. That removes the parser blocker for the **Monsters** source, and the Summoner passes are a working model: link trait/ability effect prose + tier lines; leave dice-title lines, keyword rows, stat-grid labels, and creature keywords plain; link relational nouns `enemy`/`ally`/`creature` only at defining anchors (the Heroes book links them ~2–3× total) but `adjacent`/`strike` freely. Remaining scope below is now Monsters-specific.

- **Identified:** 2026-06-10, the bestiary restructure (Plan A: moved monster / dynamic-terrain / retainer trees from the Bestiary tab into Browse, `steel-etl/docs/superpowers/plans/2026-06-10-bestiary-restructure.md`).
- **What:** The Monsters-book pages (statblocks, malice/Tactical Stance featureblocks, dynamic terrain, retainers) are now first-class Browse pages with their own SCC codes, but they are **not yet wired into the in-prose `scc:` cross-reference sweep** the heroes doc uses. Two directions are missing: (1) links *out of* the Monsters source — statblock keywords, inflicted conditions, abilities, movement types, etc. should link to their SCC pages; (2) links *into* monster pages — other books should be able to reference a monster/terrain/retainer by SCC.
- **Why:** Comprehensive linking is part of "done" for this project (see memory `comprehensive-linking-density`); the bestiary is currently an island.
- **Context:** Source is `steel-etl/input/monsters/Draw Steel Monsters.md` (hand-maintained; H7=statblock, H9=featureblock/terrain — see `steel-etl/CLAUDE.md` "Monsters book"). Follow `steel-etl/docs/linking-guide.md` + `docs/linking-reference.md`. Conditions/skills/movement terms are already linkable targets. Mind the one-heading-one-code gotcha (memory `rule-scc-type`). This is a sizable sweep, akin to the heroes-doc passes.
- **Effort:** L (multi-day sweep across the whole Monsters source)

## 11. Summoner book: site-rendering refinement pass (formatting, not fidelity)

**Status:** done — 2026-06-10. Investigated against the generated output (plan: [`docs/superpowers/plans/2026-06-10-summoner-render-refinements.md`](docs/superpowers/plans/2026-06-10-summoner-render-refinements.md)). Two of the four diagnosed items were **non-issues**; the two real defects are fixed. Kept on the `summoner-conversion` branches (not merged/deployed).

- **Identified:** 2026-06-10, on local-site review of the freshly converted Summoner book. The fidelity gate proves word-for-word accuracy but **strips markdown, so it never checks formatting/rendering**.
- **Outcome per original item:**
  1. **Spurious `<hr>` (`---`) after the class chapter heading → NOT a bug.** It is **intentional site-wide styling**: `injectH1`/`injectHRAfterH1` (`steel-etl/internal/site/build.go:550‑604`) put a `# Title` + `---` header rule on *every* book-faithful page (every heroes Read page has it: `# Combat` + `---`). Not injected by `RenderSubtree`, not summoner-specific. No change.
  2. **Power-roll panels empty on *class* abilities → NOT a bug (selector misdiagnosis).** The diagnosis searched for CSS class `sc-power-roll`; the real class is `sc-ability__pr`. All 10 standalone class power-roll abilities render fully-populated tier panels. The renderer already handles the `**Power Roll + Reason:**` + `- **≤11:**` form. No change. **The genuinely broken power rolls are on *statblocks*** (see fix below).
  3. **Headers showing `##` → the H8 `########` leak (FIXED).** Retainer/rival statblocks carry H8 `######## Level N Retainer Advancement Ability` sub-labels, which are intentionally *not* collected as sections (they fold into the statblock body) and so leaked as literal hashes through `RenderSubtree`. `nodeBody` now demotes any 7+-hash heading to `**bold**` (`demoteOverflowHeadings`, `render_subtree.go`). Cross-book win — also clears the **183** Monsters-book instances. (steel-etl `7529e1e`.)
  4. **Statblock power rolls render as plain paragraphs (FIXED).** Statblock signature abilities encode the roll in the title (`🏹 **… 2d10 + R (Signature Ability)**`) + **three bare digit-led tier paragraphs** (verified across all 26 instances; 13 lack the WEAK/AVERAGE/STRONG keyword, so positional detection is required). New `ability-cards-core.js` (pure, UMD, `node:test`) + `transformStatblockPowerRolls()` in `ability-cards.js` badge them low/mid/high, reusing the existing `.power-roll-tiers` CSS. (v2 `2322b4d8b0`.)
- **Deferred (new item #12):** the statblock *data* layer (dice stuck in `name`, tiers in `prose`) — JSON/YAML only, not the site.
- **Remaining for the user:** the input doc itself was "not quite finished" — a final content pass is the user's, not a render-code task. A broad artifact sweep of 264 summoner pages found no other leaks (no unresolved `scc:` links, leaked `{data-scc}`, `⟦glyph⟧`, `[[ ]]`, or broken tables).

## 12. Statblock parser drops the dice-in-title power roll into prose (data-layer, not site)

**Status:** done — 2026-06-10 (steel-etl `a863c9e`). `parseStatblockFeature` now detects a `Name Nd10 + <char>` title (`sbDiceRe`), lifts the dice to `effects.roll`, cleans `name`, and maps the three bare digit-led tier lines (`sbBareTierRe`) to `tier1/2/3` by position. Reuses the existing `effects` fields (no schema change). Verified on regenerated data: **23/24** signature abilities now carry roll+tiers across all variants (`+ R`, `+ 2/3/4/5`, `+ highest characteristic`); the 24th (rival "Strike for Me") genuinely has no power roll and is correctly left as an effect. Monster labeled-form (`**Power Roll +**` + `**≤11:**`) is unaffected (dice path only triggers when the title carries dice). Test: `TestParseStatblockFeatureDiceInTitle`. **Known minor (pre-existing, separate):** the prose/effect path keeps the literal `**Effect:**` prefix in `effects[].effect`, and an `Effect:` line that follows a power roll is still dropped — true for the monster form too; out of scope here.

- **Identified:** 2026-06-10, while fixing #8 (statblock power-roll *site* rendering).
- **What:** For the summoner statblock signature-ability format (`🏹 **Molten Strike 2d10 + R (Signature Ability)**` + three bare digit-led tier lines), `parseStatblockFeature` (`steel-etl/internal/content/statblock_parse.go`) (a) leaves the dice notation inside the parsed `name` (e.g. `name: "Molten Strike 2d10 + R"` instead of `name: "Molten Strike"` + `roll: "2d10 + R"`), and (b) drops the three tier outcomes into `prose` rather than `effects.tier1/2/3`. Root cause: `sbPowerRollRe` only matches a `**Power Roll +**` header and `sbTierRe` only matches labeled `- **≤11:**` bullets — neither matches the dice-in-title / bare-tier form. Affects **26** summoner abilities.
- **Why it matters:** This is the **data** contract (JSON/YAML in `data/data-summoner`, consumed by the SDK / data repos), separate from the site (the site renders the md-linked blockquote and is already fixed in #8 via runtime JS). The minion/fixture/champion/retainer/rival statblock JSON currently has malformed `name` and no structured `effects` tiers.
- **Context:** `internal/content/statblock_parse.go` effects loop (~L191‑230); `sbTitleRe`/`sbParenRe`/`sbPowerRollRe`/`sbTierRe` (~L80). The Monsters book uses the labeled form (0 dice-in-title), so this is summoner-only today — but the parser should handle **both**. Add detection: if the title carries `\d+d\d+\s*\+`, strip it to `roll` and treat the following digit-led prose lines as `tier1/2/3` by position. Mirror the verified rule from `docs/superpowers/plans/2026-06-10-summoner-render-refinements.md`. Update `statblock_parse_test.go` + (if a new field) both schema copies per the card-data-parity checklist.
- **Effort:** S–M

## 13. `settings-core.test.js` fails — max-width drift (test says 500, code says 300)

**Status:** open

- **Identified:** 2026-06-10, running the v2 `node:test` suite while adding `ability-cards-core.test.js` for #8.
- **What:** `v2/tests/settings-core.test.js` has **2 failing tests** (`node --test tests/` → 9 pass / 2 fail), both pre-existing and unrelated to the #8 work: (a) `"clampEm clamps to [44, 500] and snaps to step"` asserts `clampEm(600) === 500`, but `settings-core.js` defines `WIDTH_MAX_EM = 300`, so it returns `300`; (b) `"widthToControls maps stored width to slider state"` fails the same way (it routes through `clampEm` for an out-of-range stored width). The content-max-width cap was lowered 500→300 (the v2 footer/header / live-settings rework) without updating the test.
- **Why it matters:** A red test suite hides real regressions and erodes the "tests pass" signal. It's a one-sided drift — pick the source of truth and align the other side.
- **Fix options:** Decide the intended max content width. If 300 is correct, update the test's expectations (`clampEm(600) → 300`, the `[44, 500]` name, and the `widthToControls` case). If 500 is correct, bump `WIDTH_MAX_EM` back to 500 in `settings-core.js` (and check the slider's `max` in `settings-panel.js`/`steel-settings.css`). `settings-core.js:19` (`WIDTH_MAX_EM`), `settings-core.js:52` (`clampEm`), `tests/settings-core.test.js:38-49`.
- **Effort:** XS

## 14. Heroes skill-group links 404 — resolve to old `skill/group/<member>.md` path

**Status:** done — 2026-06-11. Fixed together with #4 (shared root cause): `rewriteSectionLinks` now applies `groupLandingIndexDest` to link targets, so `skill/group/<member>.md` inbound links resolve to the relocated `skill/<member>/index.md` landing. Cleared all 64 `skill/group/*` warnings across class/career/ancestry pages. Also published the previously-unincluded `god/` and `project/` page trees (added to the Browse `include:` like `feature-group/` in #2 — both are substantive, scc-coded, cross-referenced content), clearing the remaining 3 god + 4 project warnings. **Net: 76 → 0 mkdocs build warnings.** See `steel-etl/internal/site/build.go` `rewriteSectionLinks` + `v2/site.yaml` Browse include.

- **Identified:** 2026-06-10, `mkdocs build` during the #8 verification (24 link warnings).
- **What:** In-prose links to a skill-group landing render as `Browse/skill/group/<member>.md`, but the **2026-06-09 group-landing migration relocated** that page to `Browse/skill/<member>/index.md` (and there is no `skill/group/` folder). So every such link 404s. **24** `not found among documentation files` warnings on a clean build, all on `Read/heroes/{perks,rewards}.md` (groups: crafting, exploration, intrigue, interpersonal, lore). The md-linked heroes source still carries the old relative form, e.g. `data/data-rules/en/md-linked/chapter/perks.md` → `[crafting skill group](../skill/group/crafting.md)`. (The `swashbuckler/fancy-footwork` warning in the same build is the separate Kits-flatten issue #4, not this.)
- **Why it matters:** Clickable-but-404 links to skill-group landing pages on live heroes content, plus persistent build warnings. The 2026-06-09 migration repointed the **site landing** but the **link target** still resolves to the pre-relocation path.
- **Fix options:** Make the `scc:…/skill.group/<member>` link resolver emit `skill/<member>/` (the relocated index) instead of `skill/group/<member>.md` — likely in the md-linked link-resolution / `groupLandingIndexDest` mapping (`steel-etl/internal/site/build.go`), mirroring how the page itself was relocated. Confirm against `docs/superpowers/plans/2026-06-09-group-landing-scc-migration.md`. Then re-gen heroes (`gen --book mcdm.heroes.v1`) + `steel-etl site` + `mkdocs build` and confirm zero `skill/group/` warnings. Cross-check the same pattern doesn't affect `monster.group/<category>` links.
- **Effort:** S

## 15. Fixture statblocks: non-standard 2-column stat grid not parsed into size/stamina

**Status:** open

- **Identified:** 2026-06-11, during the Summoner link sweep's footgun verification (`docs/superpowers/plans/2026-06-10-summoner-content-linking.md`, Phase 3.2).
- **What:** The four Summoner **fixture** statblocks (`fixture.<portfolio>.statblock/*` — The Boil, Barrow Gates, etc.) use a simplified **2-column** stat table — `| **Stamina:** 20 + your level | **Size:** 2 |` — instead of the standard `**VALUE**<br>Label` grid the minion/champion/rival statblocks use. `parseStatGrid` (`steel-etl/internal/content/statblock_parse.go`, `cellRe`) doesn't recognize this form, so the fixture JSON has empty `size`/`speed`/`stamina` and the whole `**Stamina:** 20 + your level` string lands in `keywords[]`. Confirmed pre-existing (the grid line carries no links, so the 2026-06-11 link sweep did not cause it) and **fixture-only** (4 statblocks).
- **Why it matters:** Fixture statblock JSON in `data/data-summoner` has malformed/empty stat fields, so the SDK / data consumers and any stat-driven card get nothing for fixtures. The trait/ability blockquotes parse fine; only the stat grid is affected.
- **Fix options:** Teach `parseStatGrid` (or a fixture-specific path) to recognize the `**Label:** value` 2-column inline form and map `Stamina`/`Size` (and any others) into the structured fields, keeping the `+ your level` expression as the value. Add a `statblock_parse_test.go` case from The Boil. Mind the card-data-parity checklist if a new field is surfaced.
- **Effort:** S
- **Note (2026-06-11):** The new statblock island renderer (`steel-etl/internal/site/statblock_page.go`) reads `size`/`speed`/`stamina` from frontmatter, so fixture cards/blocks inherit this gap (those defenses show `—` until this is fixed). Not introduced by the island work.

## 16. Statblock island: shared family Malice band not embedded; retainer/fixture "With Captain" label

**Status:** open

- **Identified:** 2026-06-11, building the High-Fantasy Steel statblock client renderer (design handoff `redesign/statblocks/`).
- **What:** Two deferred pieces of the statblock island (`steel-etl/internal/site/statblock_page.go` → `v2/docs/javascripts/steel-statblock.js`):
  1. **Malice band** — the design embeds the family's shared Malice featureblock into each statblock as a collapsible band (`renderStatblock` `data.malice`). The island currently omits it (the README marks it a non-blocking nice-to-have, and the family's `…-malice.md` featureblock still renders as its own Browse page). To wire it, associate each statblock with its group's malice featureblock at site-build time (the malice `.md` is a sibling in the group dir, e.g. `monster/devils/devil-malice.md`), parse its features the same way, and emit `island.malice = {name, sourceName, intro, features[]}`.
  2. **2×2 "With Captain" cell** — the island always labels the 4th meta cell "With Captain". Minions use it (captain bonus), but retainers/fixtures/solos have no captain; the design notes summoner statblocks replace it with "Free Strike Damage Type". Make the label/value context-driven (skip or relabel when there's no captain line in the body).
- **Why:** Full fidelity to the approved design (malice is a prominent part of monster statblocks) and correct secondary-stat labeling across creature types.
- **Context:** Island shape + parser in `statblock_page.go` (`buildStatblockIsland`, `sbMeta.Captain`); renderer band logic already present in `steel-statblock.js` (`band()` + `data.malice`) and CSS (`.sb__band--malice`), so this is a Go/data-association task, not a front-end one. Group-dir sibling lookup precedent: `bestiary_cards.go` (`splitByType` finds the featureblock vs. statblock split).
- **Effort:** M (malice association) + XS (captain label)

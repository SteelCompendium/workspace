# SC-142 / SC-65 — DSE user docs pass (report)

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc142-docs` (branch `sc142-docs`)
**Base:** dse main `73b156d`
**Commits:**

- `07cb6ca` docs: cover the 7.0.0 features that had no user docs (SC-142) — 4 new pages
- `cbf17fa` docs: accuracy sweep of the README and docs for 7.0.0 (SC-142, SC-65) — 17 files

**Gates:** `npm run tsc` clean; `npx jest` 164 suites / 2686 tests passed (1 skipped).
Diff is docs-only: `README.md` + `docs/**` (21 files, +934 / −122). No code, tests,
CHANGELOG, `.repo-docs/` or demo-vault touched. Commits carry no AI attribution.

**Binding requirements honored**

- (a) Display-family elements (`ds-kit`, `ds-condition`, `ds-treasure`, `ds-ancestry`,
  `ds-culture`, `ds-career`, `ds-class`, `ds-title`, `ds-perk`, `ds-complication`,
  `ds-rule`) are named **nowhere** in README or `docs/` — verified by grep. The only
  treatment of that surface is `ds-scc`'s existing "What it looks like is not a promise"
  paragraph in `compendium-sync.md` (renders a synced entry by code; the card's layout is
  not specified and changes as the plugin develops). No schemas, no field tables, no
  inline-YAML shapes.
- (b) The snapshot command now carries its *why*, in two places: a new
  "Copying an entry to homebrew from" section in `compendium-sync.md`, and
  `writing-blocks.md` → "Insert Draw Steel: compendium block (snapshot)". Both say it is a
  homebrew starting point, deliberately a copy that stops following the compendium, and
  both point at "Insert compendium reference" for live content.

---

## Per-file: what changed and why

### New pages

| File | Why it exists |
|---|---|
| `docs/writing-blocks.md` | `/ds`, the per-element **Insert Draw Steel: …** commands, in-fence key/enum autocomplete, the `authoringControls` pencil + form editor, reference-vs-snapshot (requirement b), **Send block to sidebar** / **Open Draw Steel sidebar** / the swords ribbon icon, and the per-block `prefs:` override (advanced). None of this was documented anywhere. |
| `docs/settings.md` | The entire settings tab was undocumented. Tours all ten pages (Appearance, Typography, Statblock display, Featureblock display, Element defaults, Rolling, Authoring, Compendium, Links, Initiative tracker), the three statblock presets and how "Custom" is derived, the Advanced sub-pages, the docked live preview, Obsidian settings-search integration, and per-page Reset. |
| `docs/hero-suite.md` | `ds-hero` + `ds-conditions` / `ds-resource` / `ds-surges` / `ds-tokens` — five registered elements with zero docs. Covers fields, compendium-derived stats and the degrade when a code can't resolve, the `[respite]` and **Edit definition** header actions, and the fact that play state is written back into `state:`. |
| `docs/gm-trackers.md` | `ds-encounter` / `ds-montage` / `ds-project` / `ds-party` — four registered elements with zero docs. Covers fields, the encounter builder's budget/band/victory output and its two hand-off buttons, montage reset semantics, project breakthroughs and `goal_code` resolution, party steppers and the victories→XP action. |

### Rewritten / corrected

| File | Change |
|---|---|
| `README.md` | Rebuilt as the community-store front door: licence line, Reading-mode caveat, **Install** (community store + the Obsidian 1.13.0 requirement and the 6.0.1 pin), a `/ds`-first **Quick start**, a full element inventory in three tables, compendium sync, settings summary, docs link, known limitations. Removed the stale **Future work** list (promised the negotiation tracker and "something with statblocks", both shipped) and the "this repo is in a very primitive state" known issue (SC-65). Development/Release sections kept. |
| `docs/index.md` | Rebuilt as the docs home + catalog: "Start here" (writing blocks / compendium / settings / migration), then all 22 registered elements grouped by use with a one-paragraph description, aliases and links. Previously listed 7 elements. |
| `docs/common-element-fields.md` | Full rewrite (SC-65's "legacy docs" in its purest form) — see the table below. |
| `docs/stamina-bar.md` | De-themed; alias line; fixed the "The Skills Element supports…" copy-paste; heading `Recoveries & Winded` → `Recoveries and Winded` (ambiguous slug between GitHub and mkdocs). |
| `docs/statblock.md` | Alias `ds-sb`; `/ds` + snapshot pointers; new "Use a creature from the compendium" (whole-block reference forms); new "Changing how statblocks look" pointing at the display settings. Legacy-key note verified accurate and kept. |
| `docs/featureblock.md` | New compendium-reference section + featureblock display-settings pointer. |
| `docs/Features.md` | Aliases; `/ds` pointer; new compendium-reference section; new "Rolling on ability cards" (the `rollingEnabled` gate). |
| `docs/initiative-tracker.md` | Statblock-reference list corrected (see table); encounter-builder hand-off and `/ds` mentioned; settings link. |
| `docs/compendium-sync.md` | Settings-as-pages wording; new snapshot section (requirement b); cross-link to the typed elements' reference form. |
| `docs/migrating-to-7.md` | Display-family bullet rewritten as `ds-scc` (requirement a); sync instructions corrected to the Compendium page; "legacy release" → "pre-7.0.0 release"; added stamina-redesign and settings-rebuild bullets; links to the new pages. |
| `docs/canvas-character-sheet.md` | Added the hero-suite blocks as canvas-friendly pieces. |
| `docs/Roll.md`, `docs/skills-element.md`, `docs/counter.md`, `docs/characteristics-element.md`, `docs/values-row-element.md`, `docs/negotiation-tracker.md` | Aliases, `.md` link fix, settings deep-links. No factual errors found in their field tables. |

---

## Accuracy-sweep findings

| Claim (before) | Wrong because | Now says |
|---|---|---|
| `common-element-fields.md`: "fields supported on all (Vue) Elements… The other Elements are still migrating over." | Vue was reverted 2026-04-06; there is no migration in progress and no Vue in the codebase. | Names the two elements that honour the fields, notes the stamina bar is always collapsible (its `collapsible:` flag is deliberately not honoured, `stamina-bar/view.ts`), points at the Element-defaults prefs. Also fixed the `collapse_defaut` typo. |
| `stamina-bar.md`: "Under the Steel theme it is icon-only" / "Under the Steel theme the whole cluster carries it" / "## The Steel theme's gauge" | SC-144 made Steel the only shipped theme and removed the picker; "under the Steel theme" implies an alternative that no longer exists. | Plain description of the shipped look ("## How to read the gauge"). |
| `initiative-tracker.md`: reference formats = path / **`Bestiary/Monsters/MonsterName`** / filename / wikilink | (1) SCC codes have resolved since SC-134 and are what the encounter builder writes — omitted entirely; (2) `Bestiary/Monsters/…` is a pre-7.0.0 compendium path that no longer exists after the 7.0.0 reorganisation. | Five formats, SCC code first with a verified real code; the compendium-relative example is now a 7.0.0 path (`DS Compendium/monster/goblin/statblock/goblin-stinker`). Example YAML updated likewise. |
| `migrating-to-7.md`: "**Compendium reference cards** — new card types for kits, conditions, treasures, ancestries, cultures, careers, classes, titles, perks, complications, and general rules" | Those elements are unregistered internal machinery (SC-149); advertising them as 7.0.0 features commits the project to a surface users can't even use (`main.ts` registers only `ds-scc`). | "**One block renders any compendium entry**" — `ds-scc` + the search-and-insert command. |
| `README.md`: "Future work — … Negotiation tracker / Something with statblocks… / Known Issues: this repo is in a very primitive state" | The negotiation tracker and statblocks shipped years ago; the "primitive state" line describes a 2024 repo and reads badly in a community-store listing. | Removed; replaced by an honest **Known limitations** (Reading-mode only; compendium paths still moving, prefer codes). |
| README/docs: no install instructions, no Obsidian version requirement | 7.0.0 is the first release with a hard `minAppVersion` (1.13.0) and a `versions.json` pin to 6.0.1 for older clients — the single most likely support question at release. | **Install** section in README, the requirement repeated in `docs/index.md`. |
| statblock / feature / featureblock docs: inline YAML presented as the only body | All three accept a whole-block reference (`scc.v1:` code, bare code, `[[wikilink]]`, `@path`) via `withReference`. | A "Use … from the compendium" section on each, with verified codes. |
| `compendium-sync.md`: "Open the settings and **scroll to** the Compendium section"; `migrating-to-7.md`: "open Settings → Draw Steel Elements, then click Sync compendium" | SC-131 replaced the one-scroll tab with a ten-page index; there is nothing to scroll to and the button is labelled **Sync** on the **Compendium** page. | Both corrected to the page path + button label. |
| Aliases (`ds-sb`, `ds-ct`, `ds-vr`, `ds-char`, `ds-nt`, `ds-stam`, `ds-ft`/`ds-feat`, `ds-it`/`ds-init`) | Registered in every definition, documented almost nowhere; users hit them in the `/ds` list and in other people's notes. | Documented on each element page and in the catalog. |
| `stamina-bar.md`: "The **Skills** Element supports Common Element Fields" | Copy-paste from `skills-element.md`. | Corrected, and made precise (always collapsible; honours `collapse_default`). |

**Checked and found already correct** (no edit needed): `docs/compendium-sync.md`'s
non-destructive/first-sync/decline-flow narrative and `docs/migrating-to-7.md`'s migration,
backup and report-note behaviour (both match `CompendiumSyncService` / the SC-125 flow);
`docs/Roll.md`'s field table and rolling rules; `docs/initiative-tracker.md`'s Malice
panel, action checklist and round controls; `docs/statblock.md`'s legacy-key note
(`roles:`/`ancestry:` still parse with a console warning, removed in 8.0.0);
`docs/negotiation-tracker.md`; the small character-sheet elements' field tables.

---

## Coverage: added vs. deliberately skipped

**Added** (previously undocumented, all now covered): `ds-hero`, `ds-conditions`,
`ds-resource`, `ds-surges`, `ds-tokens`, `ds-encounter`, `ds-montage`, `ds-project`,
`ds-party`, `ds-scc` (had a mention; now cross-linked from every relevant page), the whole
settings tab, the authoring surfaces (`/ds`, insert commands, in-fence autocomplete, the
form pencil), the sidebar, and the per-block `prefs:` override.

**Deliberately skipped**

- **The eleven display-family elements** — requirement (a). Not named anywhere.
- **`state.tokens_ref` on `ds-hero`** — it parses and round-trips but nothing reads it
  (`grep tokens_ref src/` finds no consumer; D7 deferred the wiring). Documenting it would
  promise a read-through that doesn't happen. The plugin's own `hero/example.yaml` still
  advertises it in a comment — worth removing when someone next touches that file.
- **`_computed` / `_dse_anchor` internals** — mentioned only as "leave these alone".
- **Field-by-field schema tables for the nine new elements** — the brief said match the
  existing tone and not write novels; the new pages give a worked example plus the 5–8
  fields that matter, and `/ds` + in-fence autocomplete cover the rest.
- **`ds-rule`** — internal (SC-149's fix round), never mentioned.
- **Encounter budget table numbers** — the shipped table is flagged "verify against Draw
  Steel core rules" throughout `budget.ts`; the docs describe what the tool shows and its
  supported range rather than presenting the numbers as authoritative.

---

## Stale screenshot flags (nothing regenerated, per brief)

Last commit date per asset. Everything except `roll.png` predates the Steel-era rendering
work, so all of these show a plugin that no longer looks like this:

| Asset | Last touched | Why it's stale |
|---|---|---|
| `compendium.png`, `compendium-download.png` | 2024-10-12 | **Highest priority.** Show the pre-SC-131 settings tab, which no longer exists in any form (one scroll page vs. today's ten navigable pages). Used in `compendium-sync.md`. |
| `stamina-bar.png`, `stamina-bar-modal.png` | 2025-09-05 | Predate the SC-132 stamina redesign: old flat green/yellow/red fill and blue temp strip, no crest, no Recovery markers, no Catch Breath. The prose beside them now describes something visibly different. |
| `statblock.png`, `statblock-side-by-side.png`, `sample.png` | 2024-10-06 | Predate the Steel statblock treatment and every SC-123/SC-146 display option. `sample.png` is the README hero image. |
| `initiative-tracker.png`, `.gif`, `initiative-tracker-stamina-modal.png`, `initiative-tracker-add-conditions.png`, `minion-stamina-pool-modal.png` | 2024-09/10 | Predate the Malice panel, the Malice log, the per-actor action checklist and the sidebar. |
| `feature.png`, `ability.png`, `ability-simple.png`, `simple_feature_power_roll.png` | 2024-10 / 2025-12 | Predate the current keyword/action-type band and the SC-130 crest fix. |
| `featureblocks.png` | 2026-01-19 | Predates the SC-123 featureblock display settings. |
| `characteristics.png`, `counter.png`, `skills.png`, `values-row.png`, `canvas-character-sheet.png`, `horizontalRule.png` | 2024-09/10 | Oldest assets; small elements, so drift is smaller, but still pre-Steel. |
| **No screenshots at all** | — | The new pages (hero suite, GM trackers, settings, writing blocks) ship text-only. `npm run obsidian-shots` can produce ground-truth captures if Scott wants images before release. |

---

## Concerns / follow-ups (not actioned — docs-only scope)

1. **"Budget unset — configure in settings" is a lie.** `encounter/view.ts` shows that
   string when `budgetTable` returns null (party outside 1–6 heroes / levels 1–10), but no
   settings page exposes the budget tables — nothing in `SettingsTab.ts` or `catalog.ts`
   mentions budget. `gm-trackers.md` documents the supported range honestly instead of
   repeating the string, but the UI text should be fixed (or the setting shipped).
2. **`hero/example.yaml` advertises `tokens_ref`** in a comment as "canonical party pool
   block", which nothing implements. That comment reaches users through `/ds` and the
   insert command.
3. **CHANGELOG 7.0.0 still says "renders under both the Steel theme and the ambient one"**
   (SC-123 entry) — out of scope here (brief: don't touch CHANGELOG), but it is now false
   post-SC-144.
4. **mkdocs has no `nav:`**, so the four new pages appear in whatever order the theme
   derives. If the published site's ordering matters, `mkdocs.yml` needs a nav block.
5. **Anchor-slug divergence**: GitHub and mkdocs slugify `&` and `/` in headings
   differently. Two headings were renamed to avoid it (`Recoveries and Winded`,
   `Project tracker`); a full link check over README + `docs/*.md` now passes with zero
   missing files or anchors.

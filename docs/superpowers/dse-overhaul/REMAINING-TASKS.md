# DSE Plugin — Remaining Task Backlog (for Linear "Steel Compendium" project)

> **⚠️ 2026-07-27 — version renumbering:** every "6.0.0" in this doc now means
> **7.0.0**. The 6.0.0 number is retired after `6.0.0-rc1` was accidentally published
> as a regular release (auto-updated users; got the plugin delisted from the community
> store). `6.0.1` = a re-release of 5.1.1 cut for recovery. Details:
> `docs/handoffs/HANDOFF.md` (2026-07-27 addendum) and the plugin CHANGELOG.

Paste-ready. All start in **Todo**. Everything below is the `draw-steel-elements` **Obsidian plugin** (renders in Obsidian; the v2 site is separate). Current state: D2 (element/kit redesign) + D3 (theming machinery + values) are done on the **`dse-framework`** branch (83 commits ahead of `main`, unlanded), released as **`6.0.0-rc1`**. Specs live in `docs/superpowers/dse-overhaul/`.

> **Full context for a fresh session:** the "you are here" router is `docs/handoffs/HANDOFF.md`; the detailed task-by-task build record is the SDD ledger at `worktrees/dse-framework/draw-steel-elements/.superpowers/sdd/progress.md`; per-phase plans are in `docs/superpowers/dse-overhaul/plans/`. This doc is self-contained enough to create the Linear issues on its own.

---

## 1. Land the D2 + D3 overhaul to `main` + cut 6.0.0
**Status:** Todo · **Type:** Release
Merge the framework/kit/theming rebuild off the `dse-framework` branch to `main` and ship the real release.
- Run the D3 Opus whole-increment review (deferred while Steel colors were provisional).
- `just wt-finish dse-framework` (lands the 83 commits + bumps the superproject pointer).
- Bump `6.0.0-rc1` → `6.0.0`, cut the GitHub release from `main`.
- **Blocked by:** wanting to settle the Steel look first (task #2) if you don't want to ship it bare.

## 2. "High Fantasy Steel" visual overhaul *(Scott adds screenshots + design docs)*
**Status:** Todo · **Type:** Design
The theming *machinery* is done (Legacy / Steel / print, 64 semantic tokens, live-switchable) but the Steel *look* is bare and needs real design work. This task is tuning the token **values** (+ possibly adding ornament/structure) — no architecture change.
- All Steel values are CSS in `styles-source.css` under `[data-dse-theme="steel"]` (+ the light variant + print), catalogued in `D3-token-map.md`.
- Scott to attach: screenshots of the current render (per element) + target design references / a design doc.
- Likely work: bolder/more-intentional surfaces, borders, spines, tier badges, ornament (metal bevels), spacing, the ◆ HR motif; per-element polish.
- Iteration is fast once we can *see* it → strongly pairs with task #3.

## 3. Visual feedback loop: let Claude see the rendered plugin (Obsidian) *(Scott's idea)*
**Status:** Todo · **Type:** Tooling / Research
Build a way for Claude to render + screenshot the plugin's output (the "Playwright for Obsidian" ask) so visual iteration isn't blind. Options to evaluate:
- **(a) Browser harness (most promising):** the elements are now framework-based *vanilla DOM* (Vue is gone), so a small Playwright/Chromium harness can mount each `ElementView` + `styles.css` + a chosen `data-dse-theme`, and screenshot it — no full Obsidian needed. Gives per-element, per-theme snapshots Claude can view.
- **(b) Headless Obsidian:** automate a real Obsidian (Electron) test vault + screenshot — higher fidelity, more setup/fragility.
- **(c) Obsidian screenshot/automation plugins** or the app's dev tooling.
- Deliverable: a repeatable `screenshot <element> <theme>` harness whose PNGs Claude can read. Unblocks #2 (and all future visual work).

## 4. D4 — Preferences system
**Status:** Todo · **Type:** Feature · **Spec:** `D4-preferences-spec.md` · **Near-term (D3 depends on it)**
The real settings-tab UI + pref catalog. `PreferenceStore` is already built; this builds the UI + descriptors.
- A **theme picker** (Legacy / Steel) — replaces the *temporary* command-palette theme-switch commands shipped in the RC.
- Prefs the D2 elements already emit attrs for: statblock **density** + **feature style**, initiative **portraits**, print preview.
- Persistence via plugin `saveData`.
- **First step (no plan yet):** draft the execution plan from the spec (reconcile vs the built `PreferenceStore`).

## 5. D5 — Rolling & interactivity
**Status:** Todo · **Type:** Feature · **Spec:** `D5-rolling-interactivity-spec.md`
Interactive dice rolling on the power-roll panels (a shared `RollService`, likely a new `cx.roll` seam). A *visible, useful* feature. **First step:** draft the plan (check whether `cx.roll` exists yet).

## 6. F2 — Data-unified SDK integration
**Status:** Todo · **Type:** Feature / Foundation · **Spec:** `F2-data-unified-sdk-integration-spec.md` · **Cross-repo gated**
Wire the plugin's `ReferenceService` to the consolidated `data-unified` SDK so elements can resolve SCC compendium references. Foundational for D6 + D8. **First step:** draft the plan + identify the exact cross-repo prerequisites (is `data-sdk-npm` plugin-consumable yet?).

## 7. D6 — Compendium-powered reference family
**Status:** Todo · **Type:** Feature · **Spec:** `D6-compendium-reference-spec.md` · **Depends on F2**
New elements/inline widgets that resolve + render compendium references (monsters, abilities, rules) via the SDK, built on the D2 kit (`renderFeature`/`cardHead`). **First step:** draft the plan (scaffold against a mock ReferenceService while F2 is gated).

## 8. D7 — Hero-facing suite
**Status:** Todo · **Type:** Feature · **Spec:** `D7-hero-suite-spec.md` · **Depends on D5/D6**
Player-facing hero sheet panels (likely a `HeroPanel<S>` framework base), built on the kit with persisted state. **First step:** draft the plan.

## 9. D8 — GM subsystems
**Status:** Todo · **Type:** Feature · **Spec:** `D8-gm-subsystems-spec.md` · **Depends on F2/D5**
A sidebar host (`RenderMode += "sidebar"` + a `SidebarBlockHost`) + GM trackers (encounter builder, parameterized tables, spendable Malice). **First step:** draft the plan (the sidebar host is the foundational sub-task).

## 10. D9 — Authoring & editing UX
**Status:** SHIPPED v1 (Plan 15, 2026-07-12) — deferrals below · **Type:** Feature · **Spec:** `D9-authoring-ux-spec.md` · F1-only
Make authoring DSE blocks easy: insert commands, a curated example/snippet palette, live-edit affordances (likely an optional `ElementDefinition.authoring` field). **First step:** draft the plan.

### D9 v1 deferral detail (relocated from the plugin repo, 2026-07-12)

D9 v1 shipped: 12 per-element Insert commands, the `/ds` scaffolder, key/enum autocomplete
inside `ds-*` fences, and the schema-driven form editor (pencil, gated by the default-OFF
`authoringControls` pref). Deferred out of v1:

- **Text importer** (§4) — pasted-text → `ds-*` block via the SDK's readers. Gated on F2
  (not yet landed): the reader/writer classes the importer needs
  (`AutoDataReader`/`MarkdownStatblockReader`/`MarkdownFeatureReader`/
  `MarkdownFeatureblockReader`/`YamlWriter`) already ship in the pinned `steel-compendium-sdk`
  (2.1.5) and are usable today, but their output won't carry the SDK 3.x
  `role`/`organization`/`keywords` fields the current statblock model doesn't have either —
  so the importer waits for F2's SDK 3.2 bump for field parity, not for the classes to
  exist. `authoring.sdkModel` (statblock/feature/featureblock, declared on those three
  elements' definitions) is the routing hook the importer will read; it already ships, so
  building the importer is purely additive once F2 lands.
- **Inline squiggle linter** (§5.2) — CM6 `registerEditorExtension` diagnostics for schema
  errors inside a `ds-*` fence. Block-level → per-line → CST precision ladder (OD-3); verify
  `@codemirror/lint` is available on the host CM6 surface before building (not bundled today
  — only `@codemirror/language` is a dependency) (OD-4).
- **Form "save anyway" escape hatch** (OD-6) — v1 hard-fails Save while the working data is
  schema-invalid; a "save anyway" override for power users mid-refactor is cataloged, not
  built.
- **Rich array/object form editors** — v1 renders any array/object/`$ref` field as a raw-YAML
  textarea sub-control (`formModel.ts`'s `widgetFor` fallback); per-shape structured editors
  are future scope.
- **Configurable `/ds` trigger prefix** (OD-2) — the trigger is fixed at `/ds…`; making it a
  setting is deferred until a real collision with another plugin's suggester is reported.
- **Editor-side form-EDIT of an existing block** (OD-D9-12) — the form editor is reachable
  only from the reading-mode pencil; there is no editor/Live-Preview `BlockHost` to write
  through yet (`src/framework/host/LivePreviewBlockHost.ts` is still a deliberately
  unimplemented stub — every member throws). Revisit once an editor `BlockHost` exists.

## 11. D2/D3 deferred follow-ups (polish)
**Status:** Todo · **Type:** Chore · Low priority
Accumulated minor items flagged during the build (all non-blocking, safe-to-defer; full list in the SDD ledger's "FOLLOWUPS" tags): kit `head:''`→`false` normalize; `aria-selected` on role-less divs → real role; the cardHead-contract test's positional `.dse-head {` grep; kit-index color-function scan symmetry; import-dead `CodeBlocks.ts` sweep + uncalled `labeledIcon`; `void prefs.set` `.catch` (once D4 wires real `saveData`); decide whether Legacy *prints* should be fully monochrome (currently tier/stamina colors show). Also: resolve the provisional Steel taste-calls (stamina-temp blue-vs-purple, crit/VP gold, act-spine hues) — folds into #2.

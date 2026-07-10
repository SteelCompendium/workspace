# D3 Plan 10 — Theming (Steel value layer + real ThemeService) + Print/Export (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the F3 harness. Lean plan: the token *intent* + value tables live in **D3-theming-print-spec.md** (`docs/superpowers/dse-overhaul/`); this file gives task boundaries, the **D2↔D3 name reconciliation**, files, and test focus. **Continues on `dse-framework` @ the post-D2 HEAD** (D2 is complete + Opus-approved; unlanded).

**Goal:** Own the `--dse-*` *value* layer — implement the real `ThemeService` on `PreferenceStore`, author the **Steel** theme value block (+ Steel-light) that swaps by `data-dse-theme="steel"`, and add **print/export mode** (`@media print` + `data-dse-print="on"`) — all on top of the **Legacy base D2 already shipped**, with zero element/structural changes.

**Architecture:** D2 built the structural CSS + the 67-name `DseTokenName` union + the Legacy `:root`/`[data-dse-element]` base values + the `data-dse-{theme,role,act,…}` attribute surface + a working in-memory `ThemeService` stub. **D3 supplies only VALUES** (Steel/Steel-light/Print blocks) + swaps the stub for a `PreferenceStore`-backed service. A theme switch = one `data-dse-theme` attribute write → CSS reflow → repaint (no JS re-render, popout-safe by construction). "Legacy = today" is already done + Opus-verified.

**Tech Stack:** vanilla TS, `PreferenceStore` (`framework/seams/prefs.ts`), `ThemeService` (`framework/seams/theme.ts`), `styles-source.css` value blocks, Jest/jsdom.

## ⚠️ Global Constraints (READ FIRST — the D2↔D3 reconciliation)

- **Use D2's ACTUAL token names — do NOT re-narrow `DseTokenName` or rename anything.** D2 shipped the union in `src/framework/tokens.ts` (67 names). The D3 spec (`D3-theming-print-spec.md` §1.2/§1.3) predates D2 and proposes DIFFERENT names; treat its **value tables as intent**, mapped onto D2's names:
  | D3-spec concept | → D2 actual token(s) |
  |---|---|
  | `hp-healthy/winded/dying/temp` | `stamina-healthy/-winded/-dying/-temp` (+ `stamina-track`) |
  | `text/text-muted/text-faint` | `fg/fg-muted/fg-faint` (+ `heading`) |
  | `damage`/`healing`/`warning`/`selected`/`taken-turn` | `danger` / *(no `healing` token — heal reuses `stamina-temp`, per T3)* / `warn` / `select` / `turn-done` |
  | `ability-strike/ranged/maneuver/triggered/area/passive/villain/special` | `act-main/-maneuver/-triggered/-move/-none/-trait` (**D2 uses the Draw Steel ACTION types, a different 6-value taxonomy — Steel-value them by action type, NOT the spec's 8 ability categories**) |
  | `tier-low/mid/high` | `tier-low/-mid/-high` (+ D2's extra `tier-crit`) |
  | `fx-plate/fx-bevel/fx-emboss/elevation-hover/accent-spine/hr-mark/transition` | `metal-grad` / `bevel` / `emboss` / *(elevation: none in D2 — add only if a Steel rule needs it)* / *(spine = the element's `--dse-act`/`--dse-role` alias, already wired)* / `rule`+`rule-fade` / *(transition: none in D2 — add only if needed)* |
  | `surface-hover`/`surface-overlay` | `hover` / *(no overlay token — reuse `surface-raised`/`card-bg`)* |
  | `role-*` (13, incl. `role-malice`) | `role-*` (12; **D2 has NO `role-malice`** — `malice` is standalone) |
  | (D2 extras with no D3-spec row) | `page-bg`, `chip-bg`, `touch-min`, `radius`, `pad`, `hairline-fade`, `crest-shape`, `metal-line`, `metal-faint`, `card-bg`, `badge-fg`, `vp`, `accent-fg`, `focus-ring`, `border-strong`, `font-display`, `font-mono` — give each a sensible Steel value (geometry tokens like `touch-min`/`radius`/`pad` usually stay theme-invariant). |
  Produce the authoritative name-map in Task 1 before authoring values.
- **Steel hex source of truth:** `v2/docs/stylesheets/palette.css` (`--sc-role-*`, `--sc-ability-*`, tiers, steel greys, teal accent) + `DESIGN.md` (bg/fg pairs, motion budget) + the D3-spec §1.2 Steel columns. Use `var(--sc-role-hexer, #5cc98a)` forward-compat chaining where the spec shows it. D3 owns a documented manual sync (OD-6).
- **Legacy base is DONE — do not touch it** except to *add* a value if a D2 token is missing a base entry (shouldn't happen; verify). Legacy = the unscoped `[data-dse-element]`/`:root` block; no `[data-dse-theme="legacy"]` block (Legacy IS the base).
- **Popout-safe / reflow-only** (D3 spec §2.1/§2.5): `ThemeService.apply` stamps `data-dse-theme` on the element's OWN root; never `document.body`; every subscription via `owner.register`. One writer of `data-dse-theme` (the service) — the `theme` pref descriptor MUST omit `attr` (the hard D4 contract, §2.2) so `prefs.reflect` doesn't double-stamp.
- Worktree only (`…/worktrees/dse-framework/draw-steel-elements`, branch `dse-framework`); devbox via workspace root; **NO AI/co-author trailers**; `tsc` 0; suite green; `build-no-check` clean. Push after each task.
- **OD defaults (proceeding on the D3-spec recommendations unless Scott redirects):** OD-1 default `steel` (already `DEFAULT_THEME_ID`); OD-2 print = a layer, not a pseudo-theme; OD-3 custom theme = snippet + advanced field (D4); OD-4 Steel fonts = Source Serif 4 fallback + Obsidian; OD-5 labels "Match Obsidian (Legacy)"/"Steel"; OD-6 manual palette sync; OD-7 full light Steel variant now.

## Task 1: Token reconciliation map + audit

**Files:** create `docs/superpowers/dse-overhaul/D3-token-map.md` (the authoritative D3-concept→D2-name table + the Steel/Legacy/Print value per D2 token); a test `test/dom/framework/token-coverage.test.ts` scaffold.
**Do:** enumerate all 67 `DSE_TOKEN_NAMES`; for each, record the Legacy base value (read from `styles-source.css`), the intended **Steel** value (map the D3-spec §1.2 Steel column + `palette.css`), and the **Print** value. Resolve every mismatch above (esp. `act-*` action-type Steel hues — assign each of main/maneuver/triggered/move/none/trait a distinct spine color from `palette.css`'s ability palette or a sensible action mapping; document the choice). Flag any token with no sensible Steel value as "= Legacy (theme-invariant)".
**Test focus:** a parse test that the map covers exactly the 67 union names (no missing/extra).
**Impl notes:** analysis task — the map is the input to Tasks 3–5. No behavior change.

## Task 2: Real `ThemeService` on `PreferenceStore`

**Files:** `src/framework/seams/theme.ts` (replace the in-memory `DseThemeService` body with a `PreferenceStore`-backed one — keep the `ThemeService`/`ThemeServiceInternal` signatures + `createThemeService` factory shape the pipeline already calls); `src/framework/seams/prefs.ts` (register/confirm the `theme` pref descriptor — `{key:'theme', default:'steel', attr:undefined, ui:{…}}`); wherever the pipeline constructs the service (`pipeline.ts`/`main.ts`). (D3 spec §2.2.)
**Do:** back `active` with `prefs.get('theme')`; the one upstream `prefs.subscribe('theme', plugin, …)` fans out to `onChange` listeners; `apply(root, owner)` stamps `data-dse-theme` + re-stamps on change + `owner.register`s the unsub (popout-safe). Keep `cssVar`. Ensure `theme` descriptor **omits `attr`** (single-writer). Do NOT build the settings-tab picker UI (D4) — only the descriptor + default + the service.
**Test focus:** `apply` stamps the active theme on the root; a `theme` pref change re-stamps every applied root + fires `onChange`; unsub on `owner.unload`; no `document.body` writes; default resolves to `steel`; `cssVar('accent')==='var(--dse-accent)'`. Reflow-only (no view teardown).
**Impl notes:** the pipeline already calls `cx.theme.apply(root, view)` pre-`onMount` — preserve that. This makes the theme a persisted pref instead of a constant.

## Task 3: The Steel value block (`[data-dse-theme="steel"]`)

**Files:** `styles-source.css` (add the Steel override block after the Legacy base); `test/dom/framework/theme-steel.test.ts`.
**Do:** author `[data-dse-element][data-dse-theme="steel"]{ … }` overriding every token whose Steel value differs from Legacy (per the Task-1 map): steel-charcoal surfaces (`surface #1a1e21`, `surface-raised #22272b`, …), graded warm-white `fg/-muted/-faint`, the one teal `accent #4db8c7`, semantic `stamina-*`/`role-*`/`act-*`/`tier-*` hues from `palette.css`, and the ornament family (`metal-grad` = the near-transparent metal sheen, `bevel`/`emboss` = the steel-chrome shadows, `rule`/`rule-fade` = steel). Role/act/tier accents carry meaning as spines/badges, never fills (DESIGN.md). Use `var(--sc-*, #hex)` chaining. Geometry tokens (`radius`, `pad`, `touch-min`) stay unless DESIGN.md changes them.
**Test focus:** with `data-dse-theme="steel"` on a root, a representative set of tokens resolve to the Steel values (computed-style or the raw declaration); the base (no attr) still resolves to Legacy (unchanged); every union token is present in the Steel block OR intentionally inherits Legacy (the build guard, Task 6).
**Impl notes:** the big design piece — heavily VISUAL (Scott reviews the rendered Steel look). Values are defined (palette.css + spec), so it's authoring, not inventing. Flag for Scott's rendered-site QA.

## Task 4: Steel light variant

**Files:** `styles-source.css` (`.theme-light [data-dse-element][data-dse-theme="steel"]{ … }`); extend `theme-steel.test.ts`.
**Do:** override only what shifts for light (surfaces `#f6f8f8`/`#edf0f0`, fg `#2c2e30`/muted/faint, the light-column ability/tier hues from `palette.css`); role hues stay light/dark-stable. (D3 spec §2.1 2b / §2.4.)
**Test focus:** under a `.theme-light` ancestor + `data-dse-theme="steel"`, surfaces/fg resolve to the light values; role hues unchanged from dark Steel.
**Impl notes:** OD-7 = full light variant now.

## Task 5: Print / export mode

**Files:** `styles-source.css` (`@media print { [data-dse-element]{…} }` + `[data-dse-element][data-dse-print="on"]{…}` sharing the Print value block + the print rules); `test/dom/framework/theme-print.test.ts`. (D3 spec §5.)
**Do:** the Print token column (surfaces→white, fg→near-black, `metal-*`/`bevel`/`emboss`/`hover`→off, `radius`→0, borders→grey hairlines; semantics `role-*`/`act-*`/`tier-*`/`stamina-*` keep a darkened legible value + `print-color-adjust:exact` where meaning-bearing) + the rules: force-expand collapsibles (`.dse-collapse__region{display:block!important}` + hide the chevron), hide interactive-only chrome (`.dse-btn`/`.dse-stepper`/tab bars/`.dse-cond--add` → `display:none`), `break-inside:avoid` on element roots + power-roll tables/char rows/ability cards. Composes over whichever theme is active (orthogonal to `data-dse-theme`).
**Test focus:** under `[data-dse-print="on"]`, surface tokens resolve white, interactive controls are hidden, a collapsed region is forced open; the print block composes over both Legacy and Steel (theme attr still present). (jsdom can't do `@media print`; test the `[data-dse-print="on"]` twin, which shares the value block.)
**Impl notes:** mirrors `v2/docs/stylesheets/print.css` conventions.

## Task 6: Build guard + fidelity assertions

**Files:** `test/dom/framework/token-coverage.test.ts` (finalize); a Legacy computed-value assertion test.
**Do:** the coverage guard — every `--dse-<name>` in `DSE_TOKEN_NAMES` appears in the Legacy base AND (is overridden in OR intentionally inherits) the Steel block + has a Print value (grep the sheet; fail on "added a token, forgot a theme" — D3 spec §7.3). The Legacy computed-value assertion: every token under a bare `[data-dse-element]` (no theme attr) equals the pre-D3 Legacy value (Legacy untouched). Steel/Print smoke coverage from Tasks 3–5.
**Test focus:** the guard fails if a token is missing from any required block; Legacy base is byte-unchanged.
**Impl notes:** the "did we forget Steel/Print for a token" net; pairs with the F1 boundary lint.

## Task 7 (optional / D4 seam): theme pref descriptor handoff note
**Files:** append to `docs/superpowers/dse-overhaul/D3-token-map.md` (or a short `D3↔D4-contract.md`).
**Do:** document the exact `theme` pref descriptor D4's picker must render (label/options per OD-5) + the hard `attr:undefined` contract + the `data-dse-print` command/pref D4 wires (OD-2). No code — a contract note so D4 doesn't regress the single-writer rule.

## Self-review (done)
- **Coverage:** D3 spec §1 (tokens) → Task 1 map + Tasks 3–5 values; §2 (ThemeService/reflow/popout) → Task 2; §3 (Legacy fidelity) → already D2 + Task 6 assertion; §4 (Steel) → Task 3/4; §5 (print) → Task 5; §6 (extensibility) → the override surface is inherent (scoped tokens) + Task 7 note; §7 (contracts/guard) → Task 2 (descriptor) + Task 6 (guard). ODs → proceeding on recommendations (flagged for Scott).
- **Reconciliation front-loaded:** Task 1 resolves D2-names-vs-D3-spec BEFORE any value authoring (the plan's biggest risk).
- **No element/structural change:** D3 is values + the service only; D2's structural CSS + the 67-name union + Legacy base are untouched. Persisted behavior/byte-compat N/A (pure CSS + a pref-backed service).
- **Visual gate:** Tasks 3/4 (Steel look) are Scott's rendered-site QA — flagged; the code is value-authoring from defined sources (palette.css/DESIGN.md), not invention.

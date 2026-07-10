# D2 Plan 08 — Foundation: token vocabulary + accessible kit + a11y default (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the harness. Lean plan: full widget specs are in **D2 §2.1–2.10**, the a11y standard in **D2 §4**, the token names + Legacy mappings in **D2 §6**; F1 §3.5 (`ThemeService`, `data-dse-element`/`data-dse-theme` scoping), §4.3 (`cx.session`), §4.5 (owner-bound listeners). This file gives task boundaries, files, test focus, spec-§ pointers.

**Goal:** Build the D2 reusable core — (1) the `--dse-*` **token vocabulary** with Legacy defaults (so DSE ships zero color literals and everything resolves to the user's Obsidian theme), (2) the vanilla **`framework/kit/`** widget catalog (10 accessible primitives), and (3) the **framework-default a11y standard**. This is the foundation Plan 09 (per-element redesign) builds on. It does NOT touch the elements yet — the new kit **coexists** with the current `kit/{componentWrapper,collapsible}` helpers until Plan 09 migrates elements off them.

**Architecture:** Kit modules live in `src/framework/kit/`, **must not import from `src/elements/`** (F1 OD-8 lint). Every kit factory: `widget(parent, opts, owner: Component): Handle` — registers ALL listeners via `owner.registerDomEvent` / teardown via `owner.register` (F1 §4.5; closes ML-3), returns a typed Handle with imperative in-place updates (`setValue`/`setOpen`; fixes CB-7's `container.empty()` rebuilds), emits semantic HTML + ARIA (§4), consumes only `--dse-*` tokens, sets dynamic values only as scoped custom properties (never `el.style.color`).

**Tech Stack:** vanilla TS + DOM, Obsidian `setIcon`/`setTooltip`/`Modal`, CSS custom properties, Jest (jsdom `dom` project for a11y/DOM tests).

## Global Constraints (from D2)

- **Worktree only:** `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` (branch `dse-framework`). node/npm via WORKSPACE devbox. Commits in the submodule; **NO AI/co-author trailers.**
- **OD decisions (Scott-confirmed 2026-07-05, all recommendations):** OD-1 **fresh `dse-*` BEM** class vocabulary (not `ds-*`); OD-2 role/action accents **Steel-only** (Legacy stays monochrome); OD-3 **no hover-lift** in-note; OD-4 no commercial fonts (`--dse-font-display`→Obsidian text font; tier badges stay CSS `clip-path`); OD-5 role accent from SDK role, grey fallback; OD-6 **unify the stamina modals** (Plan 09); OD-7 keep UI-state-in-note through migration, demote to `cx.session` later; OD-8 validate condition `color:` via `CSS.supports` + fall back to `--dse-fg-muted`.
- **Zero color literals / zero `el.style.color`** in DSE code (lint-enforced via the F3 harness). The ONLY `el.style.*` allowed is `setProperty("--dse-*", v)` for dynamic geometry (`--dse-fill`, `--dse-temp-fill`, `--dse-value-scale`, `--dse-condition-color`). (D2 §5 rule.)
- **A11y is a framework default (D2 §4):** kit controls are real `<button>`/`<input>`/`<a>`; every icon-only control has `aria-label`; `title=`→kit `tooltip`; state via `aria-pressed`/`aria-expanded`/`aria-controls`/tablist roles; real `disabled` property (NOT a `pointer-events:none` class — fixes CB-8); keyboard operable + arrow-key roving for tabs/radiogroups; `:focus-visible` ring on every kit control; ≥44×44px touch targets (`--dse-touch-min`); color never the sole signal; `aria-live="polite"` on changing values; `prefers-reduced-motion` disables animations; popout-safe (F1).
- **Coexistence:** do NOT delete or alter the existing `kit/componentWrapper.ts` / `kit/collapsible.ts` or any element — they stay live until Plan 09. The new D2 kit is additive (new files/exports). `tsc`=0; full suite green (currently 526 — new kit tests add to it). Reuse the F1 harness (`test/dom/`, the mock `Component`/`App`/`Modal`).

## File Structure
```
styles-source.css                          (Task 1 — the --dse-* Legacy token block as the BASE/default; D3 layers [data-dse-theme="steel"] overrides)
src/framework/tokens.ts                    (Task 1 — NARROW the existing DseTokenName [theme.ts:15 `= string`] to the union; theme.ts imports it. NOT under kit/ — seams must not import kit.)
src/framework/kit/iconButton.ts            (Task 2 — iconButton + buttonRow)
src/framework/kit/stepper.ts               (Task 2)
src/framework/kit/tooltip.ts               (Task 2)
src/framework/kit/divider.ts               (Task 2)
src/framework/kit/collapsible2.ts          (Task 3 — the D2 collapsible Handle; NEW, coexists w/ the old collapsible.ts)
src/framework/kit/tabs.ts                   (Task 3)
src/framework/kit/managedModal.ts           (Task 3 — DseModal + openManagedModal)
src/framework/kit/cardHead.ts               (Task 4)
src/framework/kit/powerRollPanel.ts         (Task 4 — powerRollPanel + tierBadge)
src/framework/kit/crest.ts                  (Task 4)
src/framework/kit/index.ts                  (Task 5 — barrel export; the framework-default :focus-visible in styles-source.css)
test/dom/kit/*.test.ts                      (per widget — DOM + a11y assertions)
```
CSS for the kit widgets' `.dse-*` classes goes in `styles-source.css`, authored against the Task-1 tokens (each task adds its widgets' rules).

---

## Task 1: Token vocabulary + Legacy defaults + `DseTokenName`

**Files:** Modify `styles-source.css`, `src/framework/seams/theme.ts` (import the narrowed type); Create `src/framework/tokens.ts`; Test `test/dom/kit/tokens.test.ts`.
**⚠️ Pre-checked facts:** `DseTokenName` ALREADY exists at `theme.ts:15` as `export type DseTokenName = string; // D3 narrows to a union`, and `DEFAULT_THEME_ID = 'steel'` (theme.ts:40) — so the pipeline stamps `data-dse-theme="steel"` by default. Therefore Legacy tokens are the **BASE**, not a `[data-dse-theme="legacy"]` block.
**Do:** author the **Legacy** `--dse-*` token block (D2 §6, ~45 tokens) in `styles-source.css` as the **base/default** — the correct layering is **Legacy = base (unscoped), Steel = override under `[data-dse-theme="steel"]` (D3's job)** — so a `steel`-themed element gets base+overrides and (until D3 ships Steel) the default renders Legacy. Put the base tokens where they're in scope for element roots (a `:root` block is simplest — custom-property defs there cascade; the closest `[data-dse-theme="steel"]` def later wins within a steel element). Map each token to its **Legacy value verbatim from §6** — structure/surface + text + accent → **Obsidian vars** (`--code-background`, `--text-normal`, `--interactive-accent`, `--font-*`, …); Steel-ornament tokens → **flat/none** (Legacy); semantic-game → today's literals (`--dse-stamina-healthy: limegreen`, tiers, `--dse-malice: red`, `--dse-select: #D50000`, …); **role/action accents Legacy = monochrome** (roles→`--dse-fg-muted`, actions→none) per OD-2. **NARROW** the existing `DseTokenName`: define the string-union of all ~45 names in a new `src/framework/tokens.ts` and change `theme.ts:15` to `import type { DseTokenName } from '../tokens'` (do NOT put it under `kit/` — seams must not import kit). `ThemeService.cssVar(name)` (theme.ts:72) already returns `var(--dse-${name})`, so nothing else changes there.
**Test focus:** every `DseTokenName` in the union has a matching `--dse-*` custom-property definition in the base block (assert the union ⊆ the sheet's defined props); no name collisions; `tsc` still resolves `cssVar`'s param against the narrowed union. (This is the **D2↔D3 reconciliation** — comment that D3 owns the values + adds the `[data-dse-theme="steel"]` layer.)
**Impl notes:** this is the foundation every widget + element references — get the names right (they're a contract with D3/D4). NO element/kit consumes them yet.

---

## Task 2: Kit control primitives — `iconButton`/`buttonRow`, `stepper`, `tooltip`, `divider`

**Files:** Create `src/framework/kit/{iconButton,stepper,tooltip,divider}.ts`; Modify `styles-source.css` (their `.dse-btn*`/`.dse-stepper*`/`.dse-hr*`/`.dse-vr` rules); Test `test/dom/kit/{iconButton,stepper,tooltip,divider}.test.ts`.
**Widgets (D2 §2.1/2.2/2.5/2.10 — exact APIs there):**
- `iconButton(parent, {icon?, label, text?, variant?, pressed?, disabled?, tooltip?, onClick}, owner)` → a real `<button>` (`.dse-btn`, variant/`[data-pressed]`/`[disabled]`); **required `label`** = aria-label; real `disabled` property (CB-8); `:focus-visible`; ≥44px via padding; `aria-pressed` when `pressed` given. + `buttonRow(parent, buttons[], owner)` → `.dse-btn-row`.
- `stepper(parent, {value, min?, max?, step?, editable?, label, format?, onChange}, owner)` → two `iconButton`s + value/`<input type=number>`; `role="group"`+aria-label; buttons `aria-label="Decrease/Increase {label}"`; value `aria-live="polite"`; auto-disable at min/max (real property); editable Enter/Escape no double-commit (CB-10); Handle `setValue`/`getValue`.
- `tooltip(el, text, {placement?})` → thin wrapper over Obsidian `setTooltip` (no custom DOM); callers still pass `aria-label` where the tooltip is the only name.
- `divider(parent, {axis:"h"|"v", ornament?}, owner?)` → `.dse-hr`(`__line--left/--right`,`__diamond`)/`.dse-vr`; Legacy = today's fade-line-with-diamond.
**Test focus (jsdom + a11y):** iconButton renders a real `<button>` with the aria-label, `disabled` blocks the onClick (Enter/click), `aria-pressed` reflects `pressed`, listeners bound to `owner` (torn down on owner unload); stepper announces via aria-live, disables at bounds, editable commits once on Enter and reverts on Escape; tooltip calls `setTooltip` (spy); divider DOM shape. Assert **no inline color / no `el.style.color`** in any widget.

---

## Task 3: Kit containers — `collapsible2`, `tabs`, `managedModal`

**Files:** Create `src/framework/kit/{collapsible2,tabs,managedModal}.ts`; Modify `styles-source.css`; Test `test/dom/kit/{collapsible2,tabs,managedModal}.test.ts`.
**Widgets (D2 §2.3/2.4/2.6):**
- `collapsible2(parent, {title?, titleEl?, open, persistKey?, onToggle}, owner)` → header `<button aria-expanded>` + `aria-controls` region; chevron `setIcon("chevron-right")` (CSS rotate, reduced-motion-safe); region hidden via the `hidden` attr (not inline `display:none`); when `persistKey` set, read/write open-state via `cx.session` (F1 §4.3) — but the kit takes `session` via opts or owner, NOT a direct `cx` import (keep the kit⊥elements boundary; pass a `session`/`persist` accessor in opts). Handle `{headerEl, contentEl, setOpen, isOpen}`. **NEW file — coexists with the old `collapsible.ts`/`componentWrapper.ts` (untouched).** (Named `collapsible2` to avoid clashing with the existing export; Plan 09 renames after the old is deleted.)
- `tabs(parent, {tabs:[{id,label,icon?}], selected, persistKey?, onSelect}, owner)` → `role="tablist"`/`tab`(`aria-selected`, roving `tabindex`)/`tabpanel`(`aria-labelledby`); **arrow-key + Home/End** nav; selection via `cx.session` (persistKey, same accessor pattern). Handle `select(id)`.
- `managedModal`: `class DseModal extends Modal` with `setDseTitle`, `body`, `footer(buttons)` (footer via `iconButton`s); + `openManagedModal(owner, factory)` opens + `owner.register(() => modal.close())` (F1 §4.5). `aria-labelledby`→title; initial focus first control; Escape/focus-trap (Obsidian defaults).
**Test focus:** collapsible toggles `aria-expanded` + `hidden`, persistKey round-trips through a fake session, chevron rotates (class); tabs roving tabindex + arrow/Home/End move selection + `aria-selected`, persist via fake session, only one panel visible; managedModal sets `aria-labelledby`, footer buttons are real `<button>`s with real `disabled`, `openManagedModal` closes on owner unload. No inline color.

---

## Task 4: Kit card grammar — `cardHead`, `powerRollPanel`/`tierBadge`, `crest`

**Files:** Create `src/framework/kit/{cardHead,powerRollPanel,crest}.ts`; Modify `styles-source.css`; Test `test/dom/kit/{cardHead,powerRollPanel,crest}.test.ts`.
**Widgets (D2 §2.7/2.8/2.9):**
- `cardHead(parent, {leftEyebrow?, name, leftDeck?, rightEyebrow?, rightPrimary?, rightDeck?, crest?}, owner)` → the 6-slot grid (`.dse-head`, `__eyebrow/__primary/__deck`, `--left/--right`, `--line/--chip`); `name` renders as a heading (`role="heading"`/appropriate `aria-level`); omitted slots collapse to a gap (no mislabeled placeholder). (Ports DESIGN.md `.sc-head`.)
- `powerRollPanel(parent, {chars?, rows:[{tier, md}], selectable?, selected?, onSelect?}, owner)` + `tierBadge(parent, tier)` → `.dse-pr` panel with 4 tier rows (`[data-tier="low|mid|high|crit"]`), each a badge (`.dse-pr__badge--t1/--t2/--t3/--crit`, **keep the existing `clip-path` shapes** — no font) + outcome text; in `selectable` mode each row is a `<button aria-pressed>` in a `role="radiogroup"` with arrow-key nav (exactly one tier). Color never the sole signal (row shows the range text).
- `crest(parent, {icon, size?})` → shield `<span>` with a `setIcon` glyph (`.dse-crest`); **Steel-only** — Legacy renders `display:none`; degrades to nothing if no icon.
**Test focus:** cardHead places each field in its slot, omitted slots absent, name is a heading; powerRollPanel renders 4 tiers with badges + text, selectable mode = radiogroup of real buttons with arrow-nav + `aria-pressed` (one selected), badges keep clip-path classes; crest hidden under Legacy theme (or `display:none` rule present) + renders the glyph. No inline color.
**Impl notes:** markdown in tier rows (`md`) renders via the owner-parented `renderMarkdown` pattern (F1) — pass a render callback in opts, don't import MarkdownRenderer into the kit directly if it breaks the boundary; mirror how elements call it.

---

## Task 5: Kit barrel + framework-default focus-visible + boundary/lint check

**Files:** Create `src/framework/kit/index.ts`; Modify `styles-source.css` (the one framework-default `:focus-visible` rule); Test `test/dom/kit/kit-index.test.ts` + confirm the import-boundary.
**Do:** a barrel `index.ts` re-exporting all D2 kit widgets (+ the existing helpers, unchanged) for ergonomic `import { iconButton, stepper, … } from "@framework/kit"`. Add the **single framework-default** rule `.dse-btn, .dse-stepper__btn, .dse-collapse__header, .dse-tabs__tab, .dse-pr__row[aria-pressed] { … } :focus-visible { outline: 2px solid var(--dse-focus-ring); outline-offset: 2px; }` (D2 §4.5) — or a shared `.dse-focusable` applied by the kit. Verify the F1 OD-8 import-boundary lint still passes (kit ⊥ elements) with the new files. Confirm the **whole D2 kit ships zero color literals + zero `el.style.color`** (grep/lint across `src/framework/kit/`).
**Test focus:** the barrel exports every widget; a grep-style test (or the F3 lint) asserts no `el.style.color`/color-literal in `kit/`; the focus-visible rule exists. Full suite green; tsc 0; build OK.
**Impl notes:** this closes the foundation — after Plan 08, the D2 kit + tokens exist and are tested standalone, unused by elements (they refactor onto it in Plan 09).

---

## Self-review (done)
- **Coverage:** D2 §2 (10 widgets) → Tasks 2–4; §4 (a11y) → baked into every widget + the §Task-5 focus-visible default; §6 (tokens) → Task 1; §5 (inline eviction rule) → enforced as a Global Constraint + the Task-5 lint (the actual per-element eviction is Plan 09). §3 (per-element redesign) is **Plan 09**, not here.
- **Coexistence:** the new kit is additive (new files, `collapsible2` name); no element or existing kit file is touched → the 526-test suite stays green throughout.
- **Boundary:** kit ⊥ elements preserved; `cx.session` reached via an injected accessor in opts, not a direct import.
- **No placeholders:** each task cites the D2 § + names the widgets/tokens; exact APIs live in D2 §2.x (the implementer reads them).
- **Kit⊥token contract:** Task 1 names the tokens D3/D4 depend on — get them verbatim from §6.

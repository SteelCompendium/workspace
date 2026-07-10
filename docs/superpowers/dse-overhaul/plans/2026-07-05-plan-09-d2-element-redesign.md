# D2 Plan 09 — Per-element redesign onto the kit + inline-style eviction (lean)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD on the harness. Lean plan: the per-element redesign detail is in **D2 §3.1–3.11 + §3.5b + §3.x**, the a11y standard in **§4**, the inline-style eviction map in **§5**, the tokens in **§6**, prefs in **§6b**; the kit widgets are in `src/framework/kit/` (Plan 08, D2 §2). This file gives task boundaries, files, test focus, §-pointers.

**Goal:** Refactor all **11 elements + 5 modals** onto the Plan-08 D2 kit — rebuild each `ElementView.onMount` (and the modals) from kit widgets, express every visual variation as a semantic `.dse-<id>__*` class under `[data-dse-element]` mapped to `--dse-*` tokens, and **evict the ~65 inline-style / hardcoded-color sites (SC-5)**. Retire the old `kit/{collapsible,componentWrapper}` helpers.

**Architecture:** This changes **DOM structure + CSS only** — NOT content, numbers, wording, or persistence. "Legacy = today's look" (the Plan-08 tokens already map to today's Obsidian vars/literals), so in the Legacy/default theme there is **no intended visual change**; the DOM becomes kit-based + accessible, and D3 later adds the Steel overlay. Persisted elements keep byte-identical YAML round-trip (serialize/parse unchanged) — only the rendered DOM changes. The golden DOM-equality tests from the migration plans (which pinned the OLD DOM) are **replaced** with new kit-DOM + a11y tests; persist byte-compat tests stay green.

**Tech Stack:** vanilla TS + DOM, the D2 kit (`iconButton`/`stepper`/`tooltip`/`divider`/`collapsible2`/`tabs`/`managedModal`/`cardHead`/`powerRollPanel`/`tierBadge`/`crest`), `--dse-*` tokens, Jest.

## Global Constraints (from D2)

- **Worktree only:** `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` (branch `dse-framework`). node/npm via WORKSPACE devbox. Commits in the submodule; **NO AI/co-author trailers.**
- **Build controls from the kit** — no hand-rolled `<div>` controls, no raw `addEventListener` (the kit's owner-bound listeners); every control real-semantic + accessible **by construction** (D2 §4). Elements import the kit from `@/framework/kit`.
- **Zero color literals / zero `el.style.color`** (lint via the F3/kit guard). The ONLY `el.style.*` allowed is `setProperty("--dse-*", v)` for dynamic geometry: `--dse-fill`, `--dse-temp-fill`, `--dse-value-scale`, `--dse-condition-color` (validated via `CSS.supports`, OD-8). (D2 §5.)
- **Semantic classes under `[data-dse-element]`** — `.dse-<id>__<part>` (BEM-ish); state via class/`data-*` attr, dynamic geometry via scoped custom property. Re-scope each element's CSS to its new `.dse-*` classes; **shared cross-element classes stay global** (the Plan-07/HR precedent).
- **Content is frozen:** layout/structure/CSS only — never change wording or numbers (SDK/YAML text renders verbatim). Persisted elements: **byte-identical serialize** (unchanged) — only DOM changes.
- **OD decisions (Scott-confirmed):** fresh `dse-*` names (OD-1); role/action accents **Steel-only** so Legacy stays monochrome (OD-2) — the `--dse-role`/`--dse-act` accents are **element-set aliases** (`data-dse-role="x"` → the element maps `--dse-role: var(--dse-role-<x>)`), failing safe to monochrome; no hover-lift (OD-3); Obsidian font (OD-4); SDK role + grey fallback (OD-5); unify the stamina modals (OD-6, Task 3); keep UI-state-in-note through migration, `cx.session` demotion allowed where the kit provides it (OD-7); validate condition `color:` (OD-8).
- **CB fixes ride the redesign:** CB-7 (Malice `setText` wiping chevrons → `stepper` in-place, Task 9), CB-8 (real `disabled`, everywhere), CB-10 (single-commit input, Counter/steppers), CB-4/CB-16 (Negotiation reset/dangling title, Task 7), CB-6 (initiative cell in-place refresh, Task 9).
- **A11y (D2 §4)** is inherited from the kit; add each element's `aria-label`s + `data-*` state; markdown via `this.renderMarkdown` (owner-parented; fixes ML-1). `tsc`=0; full suite green (currently 745). **Manual in-app visual-QA** is the acceptance gate for the rendered look (Scott reviews the v2 site output) — flag per task.
- **Retire on migration:** as each element moves off `mountComponentWrapper`/`mountCollapsibleHeading`, delete those old kit helpers once no consumer remains (final cleanup), and rename `collapsible2` → `collapsible`.

## Task 0: Kickoff — the 3 Plan-08 Opus fast-follows (do FIRST)

**Files:** Modify `src/framework/kit/powerRollPanel.ts` (+ its test), `src/framework/kit/collapsible2.ts` + `src/framework/kit/tabs.ts` + `src/framework/session.ts` (or new `kit/persist.ts`) + `src/framework/kit/index.ts`, the kit `.style`-guard tests.
**Do:** (1) **powerRollPanel radiogroup fix** — selectable rows: `role="radio"` + `aria-checked` inside the `role="radiogroup"` (a TRUE radiogroup; the roving/arrow mechanics already match) — replaces the `<button aria-pressed>` mismatch (orchestrator decision; the spec §2.8's "resolves to exactly one tier" intent = radiogroup). (2) **Move `SessionPersist`** off `collapsible2.ts` into a neutral module (`framework/session.ts` alongside `SessionStore`, or `kit/persist.ts`); update `collapsible2.ts` + `tabs.ts` imports + the barrel. (3) **Reconcile the per-file kit `.style` guards** (they ban ALL `.style`) to the `tsColorFindings` shape (ban `.style.color`/color props, **ALLOW** `setProperty('--dse-*', …)` geometry) so the geometry widgets in Tasks 3/4/9 don't trip them; widen the CSS literal-scan to `hwb/lab/lch/oklab/oklch/color()`.
**Test focus:** powerRollPanel selectable = radiogroup of `role="radio"`+`aria-checked` (exactly one checked, roving nav unchanged); SessionPersist importable from the neutral module + collapsible2/tabs still round-trip; the reconciled guard ALLOWS a `setProperty('--dse-fill', …)` sample but still bans `.style.color`/hex. Full suite green (745), tsc 0.
**Impl notes:** foundation-hardening; no element touched. Small but load-bearing (Negotiation Task 7 consumes the radiogroup; Tasks 3/4/9 consume the geometry-allowing guard).

## Task 1: Trivial static — Horizontal Rule + Values Row + Characteristics

**Files:** refactor `src/elements/{horizontal-rule,values-row,characteristics}/view.ts`; `styles-source.css` (new `.dse-hr*`/`.dse-statgrid*` classes); tests. (D2 §3.1/3.2/3.3.)
**Do:** HR `onMount` → `divider(root, {axis:"h", ornament:true})` (`.dse-hr*` — already the kit divider). Values Row + Characteristics → **unify onto one `.dse-statgrid`** grammar (`data-dse-element` distinguishes them): `__cell`/`__value`/`__label`; `value_height`/`name_height` → `el.style.setProperty("--dse-value-scale", n)` (sanctioned geometry) instead of inline `font-size`; preserve the `@media` column flip.
**Test focus:** HR renders the divider DOM (no visual change); statgrid renders cells/values/labels for both elements, value-scale via the custom property (no inline `font-size`), no inline color; persist N/A (static). Replace the old golden-DOM tests.
**Impl notes:** mechanical; no persistence. Kills the HR path's dependence on the old divider handling.

## Task 2: Skills

**Files:** `src/elements/skills/view.ts`; `styles-source.css`; test. (D2 §3.4.)
**Do:** wrap each skill group in the kit `collapsible2` (session-persisted open via the SessionPersist accessor — `cx.session` + `host.blockKey()`); items → `.dse-skills__item` + `.dse-skills__mark[data-on]` (status conveyed by shape + `aria-label`, not color alone); `.dse-skills__name`. Preserve `only_show_selected`/`collapsible`/`collapse_default` semantics.
**Test focus:** groups render collapsible (aria-expanded, session-persist across remount), marks reflect enabled/disabled with an accessible label, no inline color; behavior parity with today (session collapse). Interactive (no writeback).
**Impl notes:** first real element on the D2 collapsible; drops `mountComponentWrapper`/`mountCollapsibleHeading` for Skills.

## Task 3: Stamina Bar + the two stamina modals (SC-5 epicenter · OD-6 unify)

**Files:** `src/elements/stamina-bar/view.ts`; `src/views/{StaminaEditModal,MinionStaminaPoolModal}.ts` (unify onto `managedModal`); `styles-source.css`; tests. (D2 §3.5 + §3.5b.)
**Do:** the bar → `.dse-stamina` (`__track`/`__fill[data-state="healthy|winded|dying"]`/`__temp`/`__threshold`/`__num`); state color via **`[data-state]` class**, fill widths via `--dse-fill`/`--dse-temp-fill` (setProperty geometry) — **evict all inline colors/widths**; formalize the `:root --stamina-bar-color*` block onto the `--dse-stamina-*` tokens. Edit opens a `managedModal`; numeric adjust via `stepper` (Handle `setValue` updates the bar in place — no rebuild). **Unify** `StaminaEditModal` + `MinionStaminaPoolModal` into ONE `managedModal` template with an optional minion-list section (`.dse-sedit__apply/__quick/__temp/__minions`); all controls from `iconButton`/`stepper` (real `<button>` + `disabled` — CB-8); evict the ~30 `.style.*` sites (bar widths+colors, disabled styling, minion `crimson` → `--dse-danger`).
**Test focus:** bar renders with `[data-state]` + `--dse-fill` (no inline color/width), stepper edit updates in place + **persists byte-identical** (serialize unchanged) exactly once; the unified modal covers both the single-stamina and minion-pool cases, real disabled buttons, minion `crimson`→token; the CB-1/CB-2 minion nets stay green. Persist byte-compat unchanged.
**Impl notes:** the biggest SC-5 chunk; the modal unification is OD-6. Manual visual-QA of the bar + modal.

## Task 4: Counter

**Files:** `src/elements/counter/view.ts`; `styles-source.css`; test. (D2 §3.9.)
**Do:** value display + kit `stepper` (real disabled at min/max — CB-8; editable single-commit input — CB-10); `--dse-value-scale` for `value_height`/`name_height` (evict `CounterView`-style inline sizes); `.dse-counter__value/__name`.
**Test focus:** stepper ±/edit → model mutates → **exactly-one byte-compat** `replaceSource` (persist unchanged); value-scale via custom property (no inline font-size); read-only when `!canPersist` (the T3.5 `data-dse-readonly` still applies). Persist byte-compat unchanged.

## Task 5: Feature / Ability (establishes the shared card grammar)

**Files:** `src/elements/feature/view.ts`; `styles-source.css` (`.dse-feature*`, `.dse-section`, reuse `.dse-head`/`.dse-pr`); test. (D2 §3.6.)
**Do:** re-cast onto `cardHead` + `powerRollPanel` + titled `.dse-section` panels + a `[data-dse-act]` action-type spine (Steel-only accent; Legacy monochrome). `.dse-feature__meta` (KW/type/dist/target grid), `__flavor`; keep `.indent-N`. Markdown via `this.renderMarkdown` (ML-1) — pass it as the `powerRollPanel` `renderMd` callback. **This defines the feature grammar Tasks 6 reuse.**
**Test focus:** renders cardHead slots + 4-tier powerRollPanel + Effect/Trigger sections; `data-dse-act` set from the ability type (accent no-ops to monochrome in Legacy — fine); markdown parented to the view; static (no writes). Replace the golden-DOM test with kit-DOM + a11y assertions.

## Task 6: Featureblock + Statblock (reuse Feature's grammar)

**Files:** `src/elements/{featureblock,statblock}/view.ts`; `styles-source.css`; tests. (D2 §3.7 + §3.8.)
**Do:** both → `cardHead` (per-card fill maps in §3.7/§3.8) + role tint via **`data-dse-role`** (element maps `--dse-role: var(--dse-role-<role>)` from the SDK role, grey fallback — OD-5) + the shared `.dse-feature`/`.dse-pr` feature grammar (Task 5). Statblock adds `.dse-sb__meta` (info grid) + `.dse-sb__chars` + the `data-dse-density`/`data-dse-sb-featstyle` pref hooks (D4 owns the values; here just set the attrs from the pref reflection). **Coordinate with the in-flight featureblock render subsystem** ([[featureblock-refactor-in-flight]]) — treat overlaps as coordination, not rewrites.
**Test focus:** each renders cardHead + role attr + reused feature grammar; statblock has the pref-attr hooks; no word/number change; static. Statblock is the highest-value element — flag for careful manual visual-QA.

## Task 7: Negotiation (most click-divs · uses selectable radiogroup)

**Files:** `src/elements/negotiation/view.ts` (+ its sub-views); `styles-source.css`; test. (D2 §3.10.)
**Do:** rebuild on `cardHead` (fixes CB-16 dangling "Negotiation: ") + kit `tabs` (Make/Learn; active tab → `cx.session`, OD-7) + `powerRollPanel(selectable)` (the Task-0 radiogroup) + `iconButton`/`aria-pressed` bubbles for Patience/Interest. Every clickable bubble/tier/tab → a real control. `.dse-nt__patience/__interest/__argument/__motivations`. **CB-4** (de-singleton reset) lands in the rewrite. Persist byte-compat unchanged (only the tab/selected UI-state may demote to session per OD-7 — keep writing it through migration if simpler).
**Test focus:** tabs are a real tablist (roving), tiers a radiogroup, bubbles real buttons; a mutation persists byte-identical exactly once; reset works (CB-4); fully keyboard-navigable. Persist byte-compat unchanged.

## Task 8: Shared modals — Condition / Customize / Reset

**Files:** `src/views/{ConditionSelectModal,CustomizeConditionModal,ResetEncounterModal}.ts`; `styles-source.css`; tests. (D2 §3.x.)
**Do:** all three onto `managedModal`. Condition list items → `iconButton`/checkbox rows (`.dse-cond-item[aria-selected]`); CustomizeConditionModal keeps its native `<input type="color">` but the **preview** uses `--dse-condition-color` (validated via `CSS.supports`, OD-8/SD-2), not `el.style.color`; the customize cog reveals on hover **and** focus. ResetEncounterModal → managedModal confirm.
**Test focus:** each modal is a `managedModal` (aria-labelledby, real footer buttons, auto-close on owner unload); condition preview color validated + falls back to `--dse-fg-muted` on invalid input; no `el.style.color`.
**Impl notes:** these are consumed by Initiative (Task 9) — do before it.

## Task 9: Initiative (the a11y epicenter · migrates last)

**Files:** `src/elements/initiative/view.ts`; `styles-source.css`; test. (D2 §3.11.)
**Do:** every control from the kit onto the by-now-proven set: `.dse-init__turn` = `iconButton`(`aria-pressed`,`[data-taken]`); Malice = kit `stepper` (**CB-7 fix** — updates only the value, no `setText` wiping chevrons); creature grid cells = buttons (`aria-pressed`,`[data-selected]` — `--dse-select` token, not the `#D50000` inline ring; **CB-6** `data-instance-key` in-place refresh); stamina numbers `.dse-init__stamina[data-state]` (evict `red`/`green` inline → `--dse-stamina-*` tokens); conditions `.dse-cond` + `--dse-condition-color`; portraits toggle via `data-dse-portraits` (D4). Reuse the Task-8 modals. Evict `initiativeProcessor.ts`... wait, the processor is gone — evict the INLINE styles in `src/elements/initiative/view.ts` (the ported code) per §5.
**Test focus:** every former click-`div` is a real labelled focus-visible control; Malice ± updates in place (CB-7, no chevron wipe); cell selection via `[data-selected]`+`aria-pressed` (not inline color); stamina `[data-state]` (no inline color); a mutation persists byte-identical exactly once. Persist byte-compat unchanged. The a11y epicenter — careful manual visual-QA.

## Task 10: Cleanup — retire old kit helpers + rename collapsible2

**Files:** delete `src/framework/kit/{collapsible,componentWrapper}.ts` (once no element imports them — confirm via grep after Tasks 2/3/7); rename `collapsible2` → `collapsible` (update imports + the barrel + tests); `main.ts` if any wiring; F1 §6 step-10 leftovers (the empty `RegisterElements.ts`, dead `CodeBlocks.*`) optionally swept here.
**Test focus:** no dangling import of the deleted helpers (tsc=0); `collapsible` resolves to the D2 widget everywhere; full suite green.
**Impl notes:** the final tie-off — after this, the kit is the single control/container source and D2's element redesign is complete. Then D3 (theme values/Steel) + D4 (prefs) build on the `--dse-*`/`data-dse-*` contracts these tasks emit.

## Self-review (done)
- **Coverage:** D2 §3.1–3.11 + §3.5b + §3.x → Tasks 1–9; §5 (inline eviction) woven through each element's task; §4 (a11y) inherited from the kit + per-element `aria`/`data-*`; §6/§6b token+pref hooks emitted by the element tasks (D3/D4 own the values). The 3 Opus fast-follows → Task 0. Cleanup → Task 10.
- **Order/deps:** T0 kickoff first (radiogroup + guards + SessionPersist); Feature (T5) before Featureblock/Statblock (T6, reuse its grammar); shared modals (T8) before Initiative (T9); Initiative last (F1 §6, a11y epicenter, on the proven kit). Stamina bar+modals (T3) coupled.
- **Not content, not persistence:** DOM+CSS only; persisted elements keep byte-identical serialize; golden-DOM tests replaced with kit-DOM+a11y, persist byte-compat tests retained.
- **Legacy = today:** no intended visual change in Legacy/default (tokens map to today); D3 adds Steel. Manual in-app visual-QA is the look-acceptance gate (flagged per task).
- **No placeholders:** each task cites the D2 §; exact redesign detail lives in §3.X (implementer reads it).

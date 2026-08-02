# SC-104 / FOLLOWUPS #31 — Modal theming design (recon 2026-08-02, read-only Plan agent)

## 1. Recon: modal catalogue

`DseModal` (`src/framework/kit/managedModal.ts:28`) is the base class. Six concrete modals, all
constructed with only `app: App` **except** `FormModal`:

| Class | File | Ctor carries | Theme reachable at ctor? | Constructed from |
|---|---|---|---|---|
| `FormModal` | `src/authoring/FormModal.ts:50,61-68` | `cx: RenderContext` | **Yes** | `FormModal.ts:280` via `openManagedModal(owner, () => new FormModal(cx, def, source, validation))` |
| `CustomizeConditionModal` | `src/views/CustomizeConditionModal.ts:23,28-38` | `app: App` | No | `src/views/ConditionSelectModal.ts:181` |
| `AddConditionsModal` | `src/views/ConditionSelectModal.ts:37,43-54` | `app: App` | No | `src/elements/conditions/panel.ts:178`, `src/elements/initiative/view.ts:898` (both `this.cx.app`) |
| `MinionStaminaPoolModal` | `src/views/MinionStaminaPoolModal.ts:26` | `app: App` | No | `initiative/view.ts:687,765` |
| `ResetEncounterModal` | `src/views/ResetEncounterModal.ts:12,15` | `app: App` | No | `initiative/view.ts:189` |
| `StaminaEditModal` | `src/views/StaminaEditModal.ts:141` | `app: App` | No | `stamina-bar/view.ts:125`, `initiative/view.ts:545,801` |
| `LegacyCompendiumModal` | `src/views/LegacyCompendiumModal.ts:16` | `app: App` | No (caller is plugin; `this.frameworkV2.services.theme` reachable) | `main.ts:586` |

Key fact: every call site except `LegacyCompendiumModal` already has `cx` in scope and discards it
down to `.app`. `ThemeService.apply()` (`src/framework/seams/theme.ts:79-87`) is a plain function
of `(rootEl, owner)` — calling it a second time from `DseModal` is consistent with the seam's
existing contract (its `onChange` re-stamp is generic and owner-scoped).

## 2. Root cause — TWO gaps, not one

**Gap A (TS, matches FOLLOWUPS):** no modal element ever gets `data-dse-theme` stamped —
`apply()` is only called by `pipeline.ts:380` on in-note element roots.

**Gap B (CSS — NOT flagged by FOLLOWUPS #31; verified by grep):** every Steel redefinition of the
`--dse-*` custom properties is gated by the compound bare-presence selector
`[data-dse-element][data-dse-theme="steel"]`:
- dark base: `styles-source.css:3123`
- light twin: `styles-source.css:4480` (`.theme-light [data-dse-element][data-dse-theme="steel"]`)
- print twin: `styles-source.css:5259`, `:5268`

`.dse-modal` will never carry `data-dse-element` (pipeline stamps it only on in-note render roots,
`pipeline.ts:353`). So even after Gap A, every token consumed inside `.dse-modal` (`--dse-fg`,
`--dse-surface`, `--dse-border`, `--dse-font-display`, `--dse-sheen`, `--dse-metal-line`,
`--dse-chip-bevel`, `--dse-bevel`) still resolves to the **Legacy** `:root` fallback. This
contradicts FOLLOWUPS #31's claim that the forged-controls rule (`:4365-4372`) reaches footer
buttons "with no edit at all". **The stamp is necessary but not sufficient — CSS edits required.**

## 3. Design — minimal fix

**TS (Gap A), no constructor-signature churn across 6 classes + ~10 call sites:**
- `theme.ts`: module-level `const registry = new WeakMap<App, ThemeService>()` +
  `registerThemeServiceForApp(app, service)` / `themeServiceForApp(app)`. WeakMap keyed by `App`
  keeps test isolation automatic (matches the WeakMap precedent at
  `src/model/ComponentWrapper.ts:47`).
- `main.ts`: in `initializeElementFrameworkV2`, right after
  `const theme = createThemeService(prefs, plugin);` (`main.ts:205`):
  `registerThemeServiceForApp(app, theme);`. No unregister needed — superseded on next onload.
- `managedModal.ts`, in `DseModal.open()` (`:86-94`), **before** `super.open()`:
  ```ts
  const theme = themeServiceForApp(this.app);
  if (theme) theme.apply(this.dialogEl(), this.lifecycle);
  ```
  Graceful no-op where nothing registered → zero behavior change for the 14 existing
  `managedModal.test.ts` cases.
- Zero changes to the 6 modal subclasses or their call sites.

**CSS (Gap B), 3 widenings + restore 3 dead selectors:**
- Widen `:3123`, `:4480`, `:5259/:5268` from `[data-dse-element][data-dse-theme="steel"]` to
  `:is([data-dse-element], .dse-modal)[data-dse-theme="steel"]`. Surgical — does NOT flip other
  bare-`[data-dse-element]` rules (reduce-motion `:470-473`, print sizing `:5206/:5347`, base
  reset `:5148`, roll-bar family `:4923-4987`) onto modals.
  - REJECTED alternative: stamping `data-dse-element` on the modal — silently activates every
    other `[data-dse-element]`-gated rule in modals; wider blast radius, no product ask.
- Restore verbatim the 3 selectors FOLLOWUPS #31 noted as removed dead code (breadcrumb comments
  still in place): `.dse-modal__section` into the sunken-cell `:is(...)` list (comment at
  `:4374-4385`) and the two `.dse-modal__title` rules (comment at `:4387-4401`), scoped
  `[data-dse-theme='steel'] .dse-modal__title` / `…:not([data-dse-print="on"]) …`.
- Update stale SCOPE LIMIT comments at `:4359-4364` and `:4398-4401` (leave a resolution
  breadcrumb per repo convention, don't delete).
- No new `--dse-*` tokens.

NOTE (controller): line numbers are pre-plan-22; anchor by selector text, not line, when
implementing — plan 22's edits to styles-source.css will shift them.

## 4. Key answers

- **(a) Live theme switch with open modal:** handled free — `apply()`'s `onChange` subscription
  registers against the modal's own lifecycle Component; re-stamps like in-note roots (pattern
  proven at `test/dom/framework/seams.test.ts:161-189`).
- **(b) Popouts:** not broken — stamp targets the modal's own `dialogEl()` in whatever document it
  opened in; `document.body` never touched; invariant preserved verbatim.
- **(c) Steel CSS under `.dse-modal` today:** nothing resolves to Steel values (Gap B). CSS work
  required beyond the stamp.
- **(d) Jest:** `test/dom/kit/managedModal.test.ts` (14 tests) has zero theme awareness. New
  `describe('theme stamping (SC-104 / FOLLOWUPS #31)')`: initial stamp · live re-stamp ·
  unload tears down subscription · no-registered-service no-op. Mirror `seams.test.ts:154-217`.

## 5. Frozen-shot impact

**None.** `shoot.mjs` iterates `manifest.elements` only (`:75-76`) — never opens a modal.
`obsidian-camera.mjs`'s only modal code (`:392-410`) dismisses Obsidian's trust dialog.
`parity/selector-map.json` has no modal entries. None of the 98 frozen PNGs contain a modal.

## 6. Global constraints

Freeze rules unaffected (no modal in any frozen shot); no new tokens (`DSE_TOKEN_NAMES` unchanged;
token-coverage guard unaffected); devbox wrapping (`devbox run -- bash -c 'cd <worktree>/draw-steel-elements && …'`);
implement in the worktree, never the shared main checkout.

## 7. Implementation steps (single implementer task)

1. `theme.ts` — WeakMap registry + two exports.
2. `main.ts` — one registration line after `createThemeService` (~:205).
3. `managedModal.ts` — lookup+apply in `DseModal.open()` before `super.open()`.
4. `managedModal.test.ts` — 3-4 contract tests per §4(d).
5. `styles-source.css` — §3's 3 widenings + 3 restorations + comment updates (anchor by selector
   text; plan-22 shifts line numbers).
6. Full battery via devbox: tsc · jest (unit+dom) · shots · freeze 98/98 (expect byte-identical) ·
   parity 0/10/exit0. Optional: obsidian-shots ground-truth of one modal flow.

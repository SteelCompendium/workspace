# M2 — Long-term / Stretch Roadmap

Ambitious or deferred work that shouldn't block the core overhaul but should have a durable
home so it isn't re-discovered later. Each item notes why it's deferred and what has to be
true before it's worth starting. Nothing here is committed.

## 1. Live Preview build (deferred from F1) — **the big one**
- **Why deferred:** F1 makes the render pipeline *mode-agnostic* so LP is a drop-in, but the
  actual CodeMirror 6 widget/decoration implementation is a large effort of its own.
- **Preconditions:** F1 shipped; the mode-adapter seam proven in reading mode.
- **Scope sketch:** a CM6 `ViewPlugin`/widget layer that mounts F1 element views inline in the
  editor; handle edit⇄render transitions, cursor/selection, block boundaries, and perf on
  large notes. Reading mode and LP share one view implementation.
- **Risk:** highest-complexity item in the whole program; do it as its own spec → plan.

## 2. Tactical grid / battle map
- Draw Steel is grid-tactical. A map with token placement, movement, and the initiative
  tracker driving it. **Likely integrate with an existing map plugin** rather than build from
  scratch — evaluate before committing. XL.

## 3. Area-of-effect templates & tactical helpers
- Burst / line / cube / wall visualizers, line-of-effect and distance helpers. Depends on
  whether #2 (a map surface) exists. L–XL.

## 4. Shared / multiplayer session state
- Live-shared initiative/negotiation/encounter state across players (relay/sync backend).
  Big architecture + hosting question; almost certainly its own project. XL.

## 5. Localization (i18n) rollout
- `data-unified` is already locale-first (`en/…`). Once F2 lands the `en/` consumer, plan the
  UI-string extraction + multi-locale data selection so DSE can ship non-English content when
  the data exists. M. **Precondition:** F2.

## 6. Dice-plugin ecosystem integration
- Optional delegation to the Dice Roller plugin (and friends) once the DS-native roller (M1/A)
  exists. Keep native as default. M.

## 7. Performance & scale
- Large-note render cost, many-element pages, the compendium footprint in-vault. Profile once
  F1's pipeline exists; mirror the v2 site's perf learnings where relevant. M.

## 8. Community-plugin store optimization
- Full Obsidian submission Scorecard pass (the F3 audit seeds this): metadata, mobile, a11y,
  no-`innerHTML`, funding, screenshots. Do before/around a major release. S–M.

## 9. Public API for other plugins
- Today DSE exposes no programmatic API. If demand appears, expose a small typed API
  (register custom elements, query parsed data) once F1's registry is stable. M. **YAGNI until
  asked.**

## 10. Authoring power-tools (graduated from M1/E if they prove out)
- Full GUI editors, text importer, and in-editor schema language server can grow into a
  cohesive "authoring mode." Revisit after the M1/E first cut ships.

---

_As the core efforts (F/D) land, promote any item here into a numbered workspace `ROADMAP.md`
entry when it becomes real, per the workspace docs-routing rules._

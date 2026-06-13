# Completed follow-ups — archived 2026-06-12

Items pruned from [`FOLLOWUPS.md`](../../FOLLOWUPS.md) once finished. Kept here for
provenance (the detail fields save the next person a grep). Original FOLLOWUPS numbers
are noted; they do not correspond to the current numbering in the live file.

---

## Statblock CSS: kwusage mode rules silently lose to the flatten rule; `:not()` scope leak (was FOLLOWUPS #8)

**Status:** done

- **Identified:** 2026-06-11, fixing the feature-separator hr (line invisible + diamond off-center).
- **What:** Two latent specificity problems in `v2/docs/stylesheets/steel-statblock.css`:
  1. **Dead mode styling** — the flatten rule (`.sb .sb__features .sc-ability { … padding: 0 }`, (0,3,0)) beats both the crest sub-card chrome (`[data-sb-kwusage="crest"] .sb__feat { background; border-left; padding }`, (0,2,0)) and the non-crest base padding (`:not(…) .sb__feat { padding: .9rem .2rem }`, (0,2,0)). The crest "sub-card frame" design has therefore **never rendered** — crest features show as flat, unpadded tinted slabs (nearly invisible in light scheme).
  2. **`:not()` scope leak** — the non-crest separator rules use an unanchored `:not([data-sb-kwusage="crest"])`, which matches `body` (the attr lives on `<html>`), so the "non-crest" separators/gap/margins apply in **every** mode including crest. This leak is currently **load-bearing**: the default view is crest mode, and the user iterates on the separator look there. Anchor as `html:not(…)` only as part of a deliberate design decision.
- **Why deferred:** Fixing either changes statblock layouts site-wide in the default view (crest cards would appear; separators would vanish from crest mode) — a design decision, not a bug fix. Needs a call: is crest mode sub-cards (restore chrome + anchor `:not()`), or is the de facto flat+separator look the design (delete the dead crest chrome + dead padding rule)?
- **Context:** Watermark-kill footgun is now commented at the flatten rule (`steel-statblock.css` ~line 213); separator rules re-claim `display`/`opacity`/`mix-blend-mode` explicitly. Diagnostic script pattern: `/tmp/sb-separator-diag.cjs` (session 2026-06-11), based on `v2/tests/e2e/settings-panel.e2e.cjs`. The design's intent — only `crest` mode gives features the sub-card frame; the other kwusage modes are flat with diamond+line separators — is specified in `reference/design-system/handoff/redesign/statblocks/README.md` (preference contract), which should anchor the design decision.
- **Effort:** S (CSS) + design decision
- **Resolution:** Resolved 2026-06-12 by the `data-sb-featstyle` preference (design decision: both looks, user-selectable; kill rules pinned to specificity floors; `:not()` anchors removed). Spec: `v2/.repo-docs/plans/2026-06-12-statblock-feature-style.md`.

---

## Fixture statblocks: non-standard 2-column stat grid not parsed into size/stamina (was FOLLOWUPS #6)

**Status:** done

- **Identified:** 2026-06-11, during the Summoner link sweep's footgun verification (`docs/superpowers/plans/2026-06-10-summoner-content-linking.md`, Phase 3.2).
- **What:** The Summoner **fixture** statblocks (`fixture.<portfolio>.statblock/*` — The Boil, Barrow Gates, etc.) use a simplified **2-column** stat table — `| **Stamina:** 20 + your level | **Size:** 2 |` — plus an italic `*Hazard Support*` role line, instead of the standard `**VALUE**<br>Label` grid the minion/champion/rival statblocks use. `parseStatGrid` (`statblock_parse.go`, `cellRe`) didn't recognize this form, so fixture JSON had empty `size`/`speed`/`stamina` and the whole `**Stamina:** 20 + your level` string landed in `keywords[]`. Pre-existing and fixture-only.
- **Why it mattered:** Fixture statblock JSON in `data/data-summoner` had malformed/empty stat fields, so the SDK / data consumers and any stat-driven card got nothing.
- **Resolution:** Resolved 2026-06-12 as part of the featureblock data-layer effort (Plan 1 of `docs/superpowers/specs/2026-06-12-featureblock-cards-design.md`). `StatblockParser` now branches on SCC `domain == "fixture"` and calls `applyFixtureGrid` (`internal/content/monster.go`): maps `Stamina`/`Size` (keeping the `+ your level` expression), lifts the italic role line into `role`/`terrain_type`, deletes the garbage `keywords`, and stamps `statblock_kind: fixture`. `transformStatblock` emits `statblock_kind`/`terrain_type` into the SDK JSON; both schema copies declare them. Tests: `TestStatblockParser_Fixture` (`monster_test.go`) + `TestTransformStatblock_FixtureFields` (`statblock_transform_test.go`). See `steel-etl/docs/statblocks.md`.
- **Effort:** S (as estimated).

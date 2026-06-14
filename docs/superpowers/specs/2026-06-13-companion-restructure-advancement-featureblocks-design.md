# Companion restructure + advancement featureblocks — design (Featureblock Plan 5)

**Date:** 2026-06-13 · **Status:** approved design (all scheme decisions locked 2026-06-13), pre-implementation
**Scope:** steel-etl (beastheart + summoner source annotations, parsers, classifier, site renderer) + link re-sweep + docs. Workspace-level spec — it changes the **SCC scheme** (a workspace-level contract).
**Supersedes / extends:** the `2026-06-12-featureblock-cards-design.md` spec §3/§7 "Companion advancement" row. That spec assumed companion advancement was **site-render-only, no SCC change**. This is no longer true: per user decision (2026-06-13) companion advancement becomes a **separately-coded, separate-page featureblock entity**, and the companion itself is **restructured** into a `monster.companion.beastheart.*` namespace mirroring the Monsters-book Rivals. The retainer half of the original Plan 5/§3 moves to a new **Phase 6** (its own spec).

---

## 1. Why (motivation)

The original featureblock effort (Plans 1–4, shipped) brought malice/terrain/fixture/retainer-advancement content into the Forged Band card language **site-side only**, minting no SCC codes. Companion advancement is the last content type. Two things make it different:

1. **The future goal is embedding** — eventually the advancement table renders *inside* the displayed companion statblock. For that, the advancement table must be a **real entity** (its own SCC code) that the statblock can look up and embed, not an ad-hoc site-side body split.
2. **Companions are mis-namespaced today.** They live at `feature-group.companion/<name>`, a shape that does not parallel the Monsters-book Rivals (`monster.rivals.<echelon>.statblock/<id>`) and has no room for a sibling advancement entity. To add an embeddable advancement featureblock cleanly, the companion is first restructured into the `monster.*` family.

**Decision: restructure first, then advancement.** Building the advancement entity against today's `feature-group.companion` namespace would mint it in a doomed location and re-mint it during the restructure (double work, dangled links). The restructure is the prerequisite.

## 2. The SCC restructure (companions)

Companion features "take on more similarities to class features at this level" (user) — so the companion is a **statblock *identity*** whose members stay **separately-coded `feature.*` entities** (Option A: feature-rich, not absorbed into a statblock JSON the way Rivals' abilities are). A `beastheart` subgroup segment is inserted throughout, mirroring `monster.rivals.<echelon>`'s subgroup slot.

| Entity | Today | Phase 5 target |
|---|---|---|
| **statblock** (the companion) | `feature-group.companion/wolf` | `monster.companion.beastheart.statblock/wolf` |
| **advancement featureblock** (new) | *(none)* | `monster.companion.beastheart.advancement-features/wolf` |
| **statblock feature** (Level 1) | `feature.companion.wolf.level-1/retriever` | `feature.companion.beastheart.wolf.level-1/retriever` |
| **statblock ability** (Level 1) | `feature.ability.companion.wolf.level-1/clamping-jaws` | `feature.ability.companion.beastheart.wolf.level-1/clamping-jaws` |
| **featureblock feature** (Level 3/6/10) | `feature.companion.wolf.level-6/call-of-the-wild` | `feature.companion.beastheart.wolf.level-6/call-of-the-wild` |

Key properties:

- **Container vs. members.** `monster.companion.beastheart.statblock/wolf` and `monster.companion.beastheart.advancement-features/wolf` are two **landing/container** entities sharing group (`companion.beastheart`) + item (`wolf`), differing only by **kind segment** (`statblock` vs `advancement-features`) — exactly the `.statblock` kind-segment pattern from Rivals. The future embed lookup is then "same group/item, sibling kind."
- **Members keep independent codes.** Every companion feature/ability keeps a `feature.*`/`feature.ability.*` code (just gains the `beastheart` segment). They are **distributed by level** between the two containers: Level-1 members render on the statblock page; Level-3/6/10 members render on the advancement-features page.
- **All ~10–14 child codes per companion gain `beastheart`** → their identities change → the 13 inbound `scc:` links (§6) are re-swept. `validate --scc-stable` will report these as removed-old/added-new (expected, intentional — this is a deliberate scheme change, recorded in `docs/scc-log.md`).

## 3. Source annotation changes (beastheart)

Per-companion (×14), in `steel-etl/input/beastheart/Draw Steel Beastheart.md`:

1. **Companion container** — change the `#### <Companion>` annotation so it classifies as `monster.companion.beastheart.statblock/<id>` and pushes the `companion.beastheart.<id>` context segment to its children (instead of today's `feature-group | @companion: <id>` → `companion.<id>`). Exact annotation form is an implementation decision (§9); the constraint is the target codes in §2.
2. **Advancement grouping header (the user's ask).** Replace the three context-only separators
   ```
   <!-- @type: feature-group | @level: 3 --> ##### Level 3 <C> Advancement Feature
   <!-- @type: feature-group | @level: 6 --> ##### Level 6 <C> Advancement Feature
   <!-- @type: feature-group | @level: 10 --> ##### Level 10 <C> Advancement Feature
   ```
   with **one** grouping header that classifies as `monster.companion.beastheart.advancement-features/<id>`, titled **"<Companion> Advancement Features"**, and move each `@level: N` onto the advancement feature's **own** annotation so its code stays `feature.companion.beastheart.wolf.level-N/<id>`.
   - **Heading level: H5 child (locked).** The header is authored as an **H5 child** of the companion (`##### <Companion> Advancement Features`), staying inside the Wolf subtree. It is a *distinct entity* (own `advancement-features` code + own standalone page) **and** renders inline on the companion page via the subtree, where the site cards it (Plan-4-style split). This gives the embeddable entity + the on-page card with **no embedding mechanism** and no companion-page regression. (Heading level controls page/subtree placement; entity-status comes from the annotation, not the level — an H5 child is fully a separate SCC entity.)

The advancement features themselves (`###### My, What Big Teeth…`, etc.) are unchanged except for carrying their own `@level: N`.

## 4. Advancement featureblock entity (companions + fixtures)

A new container kind, **`advancement-features`**, holding the leveled advancement members and rendering as a Forged Band card (reusing the Plan 2–4 `renderFeatureblockCard` + `.fb__band--adv` leveled bands). Title = "<Name> Advancement Features".

- **Companions:** `monster.companion.beastheart.advancement-features/<id>` (§2). Members stay separately-coded `feature.*` entities (class-feature-like), distributed by level.
- **Fixtures (summoner): restructured to match (locked).** A fixture *is* a featureblock, so it follows the same pattern as the companion. Fixtures have **zero inbound `scc:` links** and **no separately-coded members** (their features are inline `features[]`, the malice/terrain model) — so the restructure dangles nothing and moves no member codes.

  | Entity | Today | Phase 5 target |
  |---|---|---|
  | base fixture | `fixture.demon.statblock/the-boil` | `monster.fixture.demon.featureblock/the-boil` |
  | advancement featureblock (new) | *(L5/9 inline in base today)* | `monster.fixture.demon.advancement-features/the-boil` |
  | members (base + advancement) | inline `features[]` | inline `features[]` — unchanged, uncoded |

  **Kept-kind scheme (locked):** the base keeps an explicit kind segment (`.featureblock`), peer to the advancement's `.advancement-features` — symmetric with the companion's `.statblock`/`.advancement-features`, mirroring the existing `monster.*.statblock` Rivals pattern and keeping the future embed lookup uniform ("same group+item, swap kind"). **Frontmatter `type:` flips** from `statblock` + `statblock_kind: fixture` (Plan 1) to **`type: featureblock`**, retiring the `statblock_kind` hack; Plan 3's fixture-routing (`fixture_page.go`) becomes unnecessary since the base now renders as a plain featureblock page.
- Champion/minion/rival are true statblocks (not featureblocks) → **untouched** this phase (their `monster.*` restructure is deferred, §8).

## 5. Site rendering

- **Companion render path: keep current (locked).** The companion page keeps its markdown stat-grid + feature sections; the `.statblock` kind segment is an **identity** change only. Converting the companion (and statblocks generally) to build-time HTML cards is a **separate ROADMAP effort** (§8) — not Phase 5 (avoids feature-creep).
- The advancement featureblock renders as a Forged Band card **below** the companion statblock content (mirrors the shipped retainer Plan 4 visual), via the existing `renderFeatureblockCard`/`renderFbFeats` (`.fb__band--adv` leveled tiers already CSS-styled). The H5-child placement means the site detects the advancement-features subtree in the companion page body and cards it (Plan-4-style), and the standalone advancement-features page renders the same card (Plan-2-style).
- Fixtures: the base now renders as a plain featureblock page (`type: featureblock`), Level-0 features only. The Level-5/9 advancement, currently rendered as `.fb__band--adv` bands *inside* the single fixture card (Plan 3), move into the separate `…advancement-features/<id>` entity's card.

## 6. Link re-sweep

13 inbound `scc:` links reference companion codes (all in `steel-etl/input/`). After the `beastheart`-segment insertion, re-point them (heroes/monsters/summoner/beastheart sources). The shared linking pipeline + `linking-reference.md` regenerate; `validate` confirms no dangling. (Small, bounded — verified by `grep` 2026-06-13.)

## 7. Schema / SDK

- The advancement-features container is a featureblock-shaped entity → covered by the existing `featureblock.schema.json` (both copies) if it emits the same `features[]`/`stats[]` shape; confirm whether a new `type:` discriminator value is needed or `type: featureblock` + a `kind` suffices. If a new discriminator/field is added, update **both** schema copies (`steel-etl/schemas` + `data-sdk-npm` `v3` branch) and the `schema_validation_test.go` allowlist (the dual-schema-sync rule).

## 8. Phasing & deferred work

- **Phase 5 (this spec):** companion restructure → companion advancement featureblocks → fixture advancement featureblocks → link re-sweep → render → docs.
- **Phase 6 (separate spec):** **retainer rework.** Today retainer advancement abilities have **no codes** (`########` H8 deliberately uncollected, folded into the statblock body — the basis of shipped Plan 4). Making retainers "the same way" means collecting H8, minting an advancement-features entity (and likely per-ability codes), and **replacing Plan 4's site-side split** with the data-layer entity. Bigger, data-layer + SCC change reopening shipped code — gets its own spec, plan, and `--scc-stable` scrutiny.
- **Deferred (future efforts, ROADMAP):**
  - Full summoner `monster.*` restructure of **champion / minion / rival** statblocks (Phase 5 restructures only the fixture among the four, since only it is a featureblock).
  - **Statblocks → build-time HTML.** Convert statblocks from JSON islands (`steel-statblock.js`) to build-time HTML cards (the Plan 2 `renderFeatureblockCard` path), and build the **entity-embedding** mechanism (embed an external entity into a page by SCC reference — e.g. Malice featureblocks into monster statblocks, and the companion advancement card into the companion statblock). This is the architecture that makes companion advancement embedding "real"; Phase 5's H5-child gives the on-page card without waiting for it.

## 9. Resolved decisions (locked 2026-06-13)

1. **Companion render path:** keep current markdown stat-grid rendering (identity-only change). Build-time-HTML conversion deferred to ROADMAP (§8, §10).
2. **Advancement header authoring level:** **H5 child** of the companion — separate entity + own page + inline on-page card, no embedding dependency (§3).
3. **Fixtures:** restructured to match companions (`monster.fixture.<element>.featureblock/<id>` + `…advancement-features/<id>`, `type: featureblock`); kept-kind scheme; champion/minion/rival restructure deferred (§4, §8).
4. **Schema discriminator:** reuse **`type: featureblock`** for the advancement-features container (and the restructured fixture base); covered by `featureblock.schema.json`.
5. **Kind segments kept** on both base and advancement (`.statblock`/`.featureblock` vs `.advancement-features`) — symmetric, mirrors the `monster.*.statblock` Rivals pattern, uniform embed lookup.

## 10. Docs & bookkeeping (at implementation time)

- `docs/scc-log.md`: dated entry — companion restructure (`feature-group.companion/*` → `monster.companion.beastheart.*`, `beastheart` segment inserted), advancement-features container kind, fixture advancement sibling; registry delta.
- workspace `CLAUDE.md` SCC section: update the companion/registry current-state bullets; the "only Plan 5 (companion cards) remains" line → Plan 5 (this) + Plan 6 (retainers).
- `ROADMAP.md`: add **Phase 6 retainer rework** and **deferred summoner `monster.*` restructure**.
- `steel-etl/CLAUDE.md` + `docs/statblocks.md`: companion/fixture advancement-features parsing + routing.
- `DESIGN.md`: advancement-features as a Forged Band card instance.
- Memory `project_featureblock_cards.md`: Plan 5 scope rewritten (restructure + advancement entities), Plan 6 = retainers.
- original `2026-06-12-featureblock-cards-design.md` §7 phasing: point Plan 5/6 at this spec.

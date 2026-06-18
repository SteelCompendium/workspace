# Completed roadmap items — archived 2026-06-18

Items pruned from [`ROADMAP.md`](../../ROADMAP.md) once finished. Kept here for
provenance. Original ROADMAP numbers are noted; they do not correspond to the current
numbering in the live file.

---

## Statblock preview-card default zones (poll resolved) (was ROADMAP #11)

**Status:** done 2026-06-18 — the community poll resolved, and the shipped default already
matches the outcome, so no change was needed.

- **Outcome:** the community ranked the **header most important, primary stats second**. In
  the `.sb-prev` preview card the header is **always shown** (not a toggle —
  `steel-etl/internal/site/statblock_preview.go:8`), and among the four toggleable zones the
  shipped default is `stats=on` with `meta`/`chars`/`feats` off. That makes the visible
  baseline header + primary stats — exactly the community ranking — so the placeholder
  default was already correct and was simply confirmed, not changed.
- **Where the default lives** (the three synced constants, left as-is): steel-etl
  `sbPreviewDefaults` (`internal/site/statblock_preview.go:57`), v2 `settings-core.js`
  `SBPREV_DEFAULTS` (`{ stats:"on", meta:"off", chars:"off", feats:"off" }`), and
  `v2/overrides/main.html`. Feature/design context:
  `docs/superpowers/plans/2026-06-15-statblock-preview-cards.md`, [`DESIGN.md`](../../DESIGN.md)
  "user-preference system".

---

## Inline item cards on the Read tab (was ROADMAP #13)

**Status:** done — Browse shipped 2026-06-17; Read shipped 2026-06-17 after the page-weight check passed.

The inline item-card embedding (abilities/features/traits/statblocks/featureblocks rendered
as their High-Fantasy Steel cards on container pages) was enabled for the **Read** tab too
by adding `Read` to `embed_card_sections` in `v2/site.yaml` (no code change — the
`embed_cards.go` pass is section-scoped). Read chapters reference items whose card-able
leaves live under Browse, so both sections are walked together and links rebase across the
section boundary (verified: `mkdocs build` clean, 0 broken-link warnings). The user
confirmed Browse class pages render snappily, clearing the page-weight gate. Heaviest pages:
`Read/heroes/classes.md` (~1.9M, 15,277 card elements) and `Read/bestiary/monsters.md`
(~4.5M, 415 statblock cards) — the bestiary mega-page is the one to watch. Design/plan:
`docs/superpowers/specs/2026-06-16-inline-item-cards-design.md`,
`docs/superpowers/plans/2026-06-16-inline-item-cards.md`.

---

## Printing provenance stamp + SCC code lifecycle (tombstones) (was ROADMAP #6)

**Status:** retired from the live roadmap 2026-06-18 — converted to reference, not closed as
"done." (a) The printing provenance stamp **shipped** 2026-06-11. (b) The code-lifecycle
(tombstone) model is **settled design, implementation deferred indefinitely**: it can't be
built until MCDM ships a removal/replacement or announces a true new edition (years out per
the user), so it doesn't belong in the active backlog. It now lives as **current-state SCC
reference** — [`docs/scc-reference.md`](../scc-reference.md) → "Printing provenance & code
lifecycle" — backed by the depth design doc
`steel-etl/docs/superpowers/specs/2026-06-11-printing-provenance-and-code-lifecycle-design.md`
(which records the decision triggers that should reopen the work). If a trigger fires,
open a fresh ROADMAP item for the implementation.

- **(a) shipped:** the heroes source's `printing: "1.01b"` frontmatter flows as a
  non-identity build stamp — registry `books` map → SCC API JSON (`books` + per-entry
  `printing`) → site page frontmatter/footer line — plus the `heroes-printing-1.01b` git tag
  (ingest convention in `steel-etl/CLAUDE.md`). Plan:
  `steel-etl/docs/superpowers/plans/2026-06-11-printing-provenance-stamp.md`.
- **(b) deferred design:** when MCDM removes/replaces an entity — new code for the
  replacement, `status: removed` / `removed_in` / `superseded_by` tombstone for the old one,
  never reuse or 404. The open sub-decision (Option A annotated-retention-in-source vs.
  Option B registry-only) stays undecided until a trigger fires.
- **Why it was parked:** debugging provenance (typo reports → source printing) without ever
  re-minting identities. The naive alternative — printing in the SCC source segment
  (`mcdm.heroes.v1_01b`) — was tried 2026-06-11 and instantly dangled ~19k links; the design
  doc records why that and the snapshot-all-versions model are rejected.

---

## v2 CI deploy build-time performance (~14 min → ~5 min) (was ROADMAP #5)

**Status:** closed 2026-06-18 — investigated, measured, and a fix verified locally on
2026-06-05; **not applied.** Closed at user request: the current ~14 min CI deploy time is
acceptable, so the verified fix is deliberately left on the shelf rather than shipped. Reopen
(new ROADMAP number) if deploy time becomes a pain point again.

**Distinct from item 1** (client-side page-load/render time). This was *CI build/deploy
wall-clock* time.

- **What:** Every push to `main` runs `mkdocs gh-deploy --force` (`v2/.github/workflows/ci.yml`)
  and takes ~14 min. Measured breakdown: **checkout ~248s** (`fetch-depth: 0` pulls the full
  ~800 MB git history) + **`mkdocs gh-deploy` ~557s** (build single-threaded CPU-bound, ~614s
  locally for 3,097 pages).
- **Root causes (cProfile):** (1) **Nav rendering (~half the build)** — Material re-renders the
  entire 3,097-item nav tree on *every* page → O(pages × nav-size), 9.5M `nav-item.html` macro
  calls. (2) **`roamlinks` plugin (~15%)** — v0.3.2 does a full `os.walk` of all 5,740 files
  (no early `break`) per bare-filename link.
- **Verified fix (unapplied):** adding **`navigation.prune`** took a local build
  **614s → 222s (−64%)**, no new warnings. Plus `fetch-depth: 1` in `ci.yml` (`ghp-import`
  force-pushes `gh-pages` independently and needs no `main` history, −~3.5 min). Items 1+2
  alone ≈ 14 min → ~5 min, both low-risk. Trade-off on `navigation.prune`: sidebar shows only
  the active branch (`navigation.tabs` keeps top nav).
- **Full detail / numbers:** `v2/.repo-docs/decisions/2026-06-05-ci-deploy-build-time-perf.md`
  (the verified fix and breakdown are preserved there even though never shipped).

---

## Summoner champion / minion / rival → `monster.*` restructure (was ROADMAP #8)

**Status:** done 2026-06-15 — all three summoner statblock trees moved into `monster.*` (scc-log 2026-06-15 "Summoner minions/champions/rivals → `monster.*` family"). Now `monster.minion.summoner.<portfolio>.statblock/*`, `monster.champion.summoner.<portfolio>.statblock/*`, and `monster.rival.<echelon>.statblock/*` (+ `monster.rival.<echelon>.summoner.minion/*` for the rival's summons — the rival NPC sits beside the Monsters-book rivals on the same type path rather than the anticipated `rival.summoner.<echelon>` form; `rivals`→`rival` slug singularized in c62753e). Zero top-level `champion.`/`minion.`/`rival.` segments remain in the registry; dead top-level site includes removed. (Retainers — `retainer.summoner.statblock` — were out of scope here; tracked as #9.)

- **What:** Move the remaining summoner statblock families (`champion.<portfolio>.statblock/*`, `minion.<portfolio>.statblock/*`, `rival.summoner.<echelon>.statblock/*`) into the `monster.*` namespace, parallel to how companions (5a) and fixtures (5c) were restructured — so all creature-like content lives under `monster.*`.
- **Why it matters:** Consistency of the SCC taxonomy; fixtures already moved, leaving these as the odd trees still rooted at top-level `champion/`/`minion/`/`rival/`.
- **Effort:** medium; mechanically similar to 5a/5c (classifier branch + link re-sweep — note these ARE link targets, unlike fixtures, so check inbound links first). `freeze:false` (summoner un-frozen).

# Completed roadmap items — archived 2026-06-18

Items pruned from [`ROADMAP.md`](../../ROADMAP.md) once finished. Kept here for
provenance. Original ROADMAP numbers are noted; they do not correspond to the current
numbering in the live file.

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

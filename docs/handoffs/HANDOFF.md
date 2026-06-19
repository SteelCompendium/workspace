# Handoff — 2026-06-19 (feature-taxonomy effort COMPLETE; pick next from ROADMAP)

## Active efforts
- **Feature level-grouping + `feature_source` taxonomy** — **COMPLETE & LIVE.** Both specs off the
  single brainstorm are shipped:
  - Spec A — grouping headers → `feature-group`: **DONE** (steel-etl `3328469`, v2 `10771af`).
    [`../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md`](../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md) → `## Status`.
  - Spec B — `feature_source: summoner|circle`: **DONE** (steel-etl `8564c3a`, v2 `28227b0`).
    [`../superpowers/plans/2026-06-19-summoner-feature-source.md`](../superpowers/plans/2026-06-19-summoner-feature-source.md) → `## Status`.
  - **Phase 2 of Spec B** (`circle-of-<name>` for the ~24 named-circle picks, validated against the
    per-level circle lookup tables) is the only remaining follow-on — **not yet specced/planned.**
- **ROADMAP #15 — Monsters/Summoner per-ability coding** — paused (separate effort, brainstorm-first).
  Canonical description: [`../../ROADMAP.md`](../../ROADMAP.md) → item #15. Untouched.

## You are here
**No work in flight.** The feature-taxonomy effort that spanned this session is fully shipped and
deployed. Pick the next thread with the user — candidates:
1. **Spec B Phase 2** (`circle-of-<name>`): tag the ~24 named-circle picks + extend the validate
   oracle to the per-level circle lookup tables. The renderers + value space are already
   forward-compatible (eyebrow title-cases any slug; facet is generic), so this is data + oracle only.
2. **ROADMAP #15** (per-ability coding for Monsters/Summoner retainer/advancement abilities) —
   brainstorm-first.
3. Whatever new the user brings.

## Verified state (as of 2026-06-19, commands below)
- **workspace** `main` @ `e69342e` (steel-etl pointer bump for Spec B), clean, pushed to `origin`.
- **steel-etl** `main` @ `8564c3a`, clean, pushed. Spec B = 6 commits `2967190`→`8564c3a` on top of
  Spec A's `3328469`.
- **v2** `main` @ `28227b0` (`chore: update v2 site content (steel-etl 8564c3a)`), clean, 0↔0 with
  `origin`. Includes the hand-authored JS commit `bb2b769` (Track facet) + the regenerated site.
- **Registry:** **3,063 codes** — unchanged by Spec B (`feature_source` is frontmatter-only, zero
  code change). `gen --all` clean.
- **Build/tests:** `go build ./...` clean; `go test ./...` → all `ok` (ran 2026-06-19).
- **feature_source live:** 26 circle + 81 summoner Summoner-book features tagged; circle eyebrow
  ("Summoner Circle Feature") on leaf-carded circle features; Track facet on `Browse/feature/index.md`.
- Nothing mid-edit.

## Gotchas & lessons (cross-cutting)
- **`feature_source` rides in frontmatter + SDK `metadata`, NOT the schema.** Feature/ability route
  through `transformAbility`/`transformTrait` → everything (class, level, subclass, feature_source)
  lands under `metadata` (`additionalProperties: true`). There is **no `feature`/`ability` entry in
  `schemaAllowedFields`** (adding a test case for one would `Fatalf`). So a card-surfaced feature/
  ability field is promoted via `setIfPresent(meta, …)` in `sdk_transform.go`, **not** a schema
  property — `subclass` is the precedent. The generic `card-data-parity.md` checklist (declare in
  both schema copies + allowlist) applies only to **passthrough** types.
- **The circle eyebrow only shows on leaf-CARDED features.** A feature with a standalone descendant
  (statblock/featureblock — e.g. Summoner's Dominion's fixtures) is left **uncarded** by the
  embed-deferral logic (Spec A's `bodyHasStandaloneDescendant`), so it has no eyebrow at all. Check a
  plain circle feature like `return-to-the-source` to verify eyebrow changes.
- **The feature-browser data island lives on `Browse/feature/index.md`** (`.sc-browse-mount`), not the
  per-level `level-N/index.md` pages (those render static `.sc-prev` cards via `renderPrevCard`). New
  `browseItem` JSON fields only show up in that one aggregate island.
- **`classify` has NO `--all` flag.** To check a single book's SCC code delta, set-diff its codes
  pristine-vs-edited (`classify <book.md>` stashed vs applied, `LC_ALL=C sort -u`, `comm`/`diff`).
  Per-file `classify --diff` floods with cross-book "removals".
- **`v2/docs` is generated — never hand-commit it.** Build to verify, then `git -C v2 restore docs/`
  + `git -C v2 clean -fdq docs/` (drops untracked generated dirs). `git restore`/`clean` leave tracked
  hand-authored sources like `docs/javascripts/*.js` intact. `just deploy-v2` regenerates + commits +
  pushes the generated trees and bumps the submodule pointer.
- **Push a hand-authored v2 source commit (JS/CSS) to `origin` BEFORE running a deploy**, and ensure
  local v2 is not behind origin. Spec A hit a non-fast-forward deploy push (local v2 behind a prior
  deploy) — fixed by `git -C v2 reset --hard origin/main` then redeploy. Spec B avoided it by pushing
  the JS commit first so v2 was 0↔0. **A `reset --hard origin/main` would discard an unpushed local
  source commit** — push it first.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git status --porcelain && git log --oneline -2                      # clean; HEAD = e69342e
git -C steel-etl rev-parse --short HEAD                             # 8564c3a
git -C steel-etl status --porcelain                                 # empty
git -C v2 rev-parse --short HEAD                                    # 28227b0 (full 28227b09463)
git -C v2 rev-list --left-right --count origin/main...HEAD          # 0   0
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./...'   # all ok
# oracle clean + feature_source emitted (expect 0 warnings, then circle/summoner counts):
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate "input/summoner/Draw Steel Summoner.md" 2>&1 | grep -ciE "feature_source mismatch|advancement table lists"'
```

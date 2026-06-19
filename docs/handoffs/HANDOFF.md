# Handoff — 2026-06-19 (Spec A shipped; Spec B awaiting plan)

## Active efforts
- **Feature level-grouping + `feature_source` taxonomy** — **IN FOCUS.** Two specs approved
  off one brainstorm. **Spec A is now SHIPPED + LIVE.** Spec B still needs a plan.
  - Spec A — grouping headers → `feature-group`: **DONE 2026-06-19.**
    [`../superpowers/specs/2026-06-18-level-grouping-annotation-standardization-design.md`](../superpowers/specs/2026-06-18-level-grouping-annotation-standardization-design.md)
    → `## Status`. Plan + execution log:
    [`../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md`](../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md)
    → `## Status`.
  - Spec B — `feature_source: summoner|circle`: **next up, no plan yet.**
    [`../superpowers/specs/2026-06-18-summoner-feature-source-design.md`](../superpowers/specs/2026-06-18-summoner-feature-source-design.md)
    → `## Status`.
- **ROADMAP #15 — Monsters/Summoner per-ability coding** — paused (separate effort, brainstorm-first).
  Canonical description: [`../../ROADMAP.md`](../../ROADMAP.md) → item #15. Untouched this session.

## You are here
**Write Plan B (`feature_source`) via `superpowers:writing-plans`, then execute it** — it's the
only remaining thread of the approved design. It's larger than Spec A: parser (`@feature_source`
annotation → frontmatter) + `validate` oracle + schema/SDK (BOTH copies — see CLAUDE.md "two
hand-synced copies") + card eyebrow + browser facet. Confirm scope/phasing with the user before
writing if anything in Spec B's `## Status` looks unsettled.

## Verified state (as of 2026-06-19, commands below)
- **workspace** `main` @ `8ef0430` (steel-etl pointer bump), clean, pushed to `origin`.
- **steel-etl** `main` @ `3328469`, clean, pushed to `origin`. Three Spec-A commits on top of
  `6880948`: `2a03210` (validate guard) → `70f011e` (summoner) → `3328469` (beastheart).
- **v2** `main` @ `10771af` (`chore: update v2 site content (steel-etl 3328469)`), clean, 0↔0
  with `origin` — Spec A is **live** (9 phantom summoner `*-level-features` Browse pages + scc
  stubs deleted).
- **Registry:** **3,063 codes** (was 3,072; −9 phantom summoner grouping codes). `gen --all` clean.
- **Build/tests:** `go build ./...` clean; `go test ./...` → all `ok` (ran 2026-06-19).
- **Still live + intact (DONE earlier this effort):** the embed-deferral fix
  (`bodyHasStandaloneDescendant`, steel-etl `71def61`) — re-verified by Spec A Task 4 Step 4
  (Summoner's Dominion renders its fixture cards). It is complementary to Spec A and must stay.
- Nothing is mid-edit. Spec B is **not** planned.

## Gotchas & lessons (cross-cutting)
- **`classify` has NO `--all` flag** (it's a `gen`/`validate` flag). Per-file `classify --diff`
  diffs the freshly-classified file against the **whole** registry, so it floods with spurious
  cross-book "removals" — useless as a per-book gate. To check a single book's code delta, set-diff
  its codes **pristine-vs-edited**: `classify <book.md>` with the edit stashed vs applied, sort with
  `LC_ALL=C sort -u`, then `comm`. (Spec A's plan had the wrong `classify --all --diff` command; this
  is how its registry gate was actually verified.)
- **`v2/docs` is generated — never hand-commit it.** Build locally only to verify; `git -C v2
  restore docs/` after (and `git -C v2 clean -fd docs/` to drop untracked generated dirs — a bare
  `gen --all` emits new `monster.retainer.*` output dirs that `restore` leaves behind). `just
  deploy-v2` regenerates + commits + pushes it and bumps the submodule pointer. See
  [`../git-workflow.md`](../git-workflow.md) → "Committing, merging & deploying".
- **Deploy push can reject (non-fast-forward)** if the local v2 clone is behind `origin` (a prior
  deploy landed there). For generated content the clean fix is `git -C v2 reset --hard origin/main`
  then re-run `just deploy-v2` — it regenerates from the current submodule on top of origin, giving a
  fast-forwardable commit whose diff is exactly your change. (Hit + resolved this session.)
- **`feature-group` detection keys off frontmatter `type`, never the code string** — `feature-group`
  / featureblock SCC codes are not uniform (`.featureblock/`, `.1st-echelon/`…). The `validate` guard
  matches the `@id` *shape* (`^\d+(st|nd|rd|th)-level-features$`), and the circle lookup containers
  (`1st-level-circle-features`, `5th-level-circle-feature`) deliberately don't match — they stay
  `feature`.
- **Spec B (carried forward):** `feature_source` slug = what grants the feature at the book's
  granularity — `summoner` (base) / `circle` (universal circle features) now; `circle-of-<name>` for
  the ~24 named-circle picks is **Phase 2**. Circle picks are all `@type: feature` (single
  `feature.schema.json`); advancement table is **validated, not generated**; `feature_source` is
  summoner-only this phase.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git status --porcelain && git log --oneline -2                      # expect clean; HEAD = 8ef0430
git -C steel-etl rev-parse --short HEAD                             # expect 3328469
git -C steel-etl status --porcelain                                 # expect empty
git -C v2 rev-parse --short HEAD                                    # expect 10771af (full sha 10771af5564)
git -C v2 rev-list --left-right --count origin/main...HEAD          # expect 0\t0
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./...'   # expect ok
# guard is clean on both converted books (expect 0):
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate "input/summoner/Draw Steel Summoner.md" 2>&1 | grep -c "level grouping"'
ls docs/superpowers/specs/2026-06-18-summoner-feature-source-design.md   # Spec B present (no plan yet)
```

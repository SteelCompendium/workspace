# Handoff — 2026-06-19 (feature taxonomy: Spec A planned, Spec B awaiting plan)

## Active efforts
- **Feature level-grouping + `feature_source` taxonomy** — **IN FOCUS.** Two specs approved
  this session off a single brainstorm. Spec A has a written plan and is ready to execute;
  Spec B still needs a plan. See "You are here".
  - Spec A — grouping headers → `feature-group`:
    [`../superpowers/specs/2026-06-18-level-grouping-annotation-standardization-design.md`](../superpowers/specs/2026-06-18-level-grouping-annotation-standardization-design.md)
    → `## Status`. Plan:
    [`../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md`](../superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md).
  - Spec B — `feature_source: summoner|circle`:
    [`../superpowers/specs/2026-06-18-summoner-feature-source-design.md`](../superpowers/specs/2026-06-18-summoner-feature-source-design.md)
    → `## Status` (no plan yet).
- **ROADMAP #15 — Monsters/Summoner per-ability coding** — paused (separate effort, brainstorm-first).
  Canonical description: [`../../ROADMAP.md`](../../ROADMAP.md) → item #15. Untouched this session.

## You are here
**Pick the next thread with the user — both branch off the now-approved design, neither is started:**
1. **Execute Plan A** (recommended — it's ready, bug-adjacent, one steel-etl PR). Use
   `superpowers:subagent-driven-development` (fresh subagent per task) or
   `superpowers:executing-plans`. Start at Plan A → Task 1 (the `validate` guard).
2. **Write Plan B** (`feature_source`) via `superpowers:writing-plans` — larger (parser +
   validate oracle + schema/SDK + card eyebrow + browser facet).

The user ended the prior session on exactly this fork ("write Plan B now or hold? / which
execution approach for A?") without answering — **confirm before starting either.**

## Verified state (as of 2026-06-19, commands below)
- **workspace** `main` @ `13926f8`, clean, pushed to `origin`. Holds both specs + Plan A + this handoff.
- **steel-etl** `main` @ `6880948`, clean. Includes this session's shipped embed fix `71def61`
  (`bodyHasStandaloneDescendant` in `internal/site/ability_cards.go`).
- **Already shipped + live this session (DONE, do not redo):** the *embed-deferral* rendering fix
  — feature/trait pages with a standalone descendant skip the inline trait-card transform so
  `embedItemCards` renders them. steel-etl PR #11 → `71def61`; v2 deploy `a3dfb49`. This fixed
  summoner fixture featureblocks (e.g. "The Boil") rendering as mangled Feature niches. It is
  **complementary to Spec A and must stay** (Plan A Task 4 re-verifies it).
- **Build/tests:** `go build ./...` clean; `go test ./internal/{site,cli,content}/` → all `ok`
  (ran 2026-06-19). No uncommitted steel-etl code.
- Nothing is mid-edit. Plan A is **not** executed; Plan B is **not** written.

## Gotchas & lessons (cross-cutting)
- **`v2/docs` is generated — never hand-commit it.** Building the site locally is for
  verification only; run `git -C v2 restore docs/` afterward. `just deploy-v2` regenerates +
  commits + pushes it (and bumps the steel-etl submodule pointer) after the steel-etl PR merges.
  See [`../git-workflow.md`](../git-workflow.md) → "Committing, merging & deploying".
- **`classify --all --diff` is the authoritative safety gate** for Plan A's conversions, not the
  card output: converting a grouping header to `feature-group` must remove **only** the phantom
  `…/Nth-level-features` codes and change **zero** child codes. Beastheart's conversion must be
  **zero-change**; revert that file if any beastheart code moves.
- **`feature-group` / featureblock SCC codes are NOT uniform** (`.featureblock/`,
  `.advancement-features/`, `.1st-echelon/`…), so detecting "is this a standalone/grouping" must
  key off the **frontmatter `type`**, never a substring of the code. (That's why the shipped
  embed fix prescans `entries` for `standaloneType`, and why Spec A's `validate` guard matches the
  `@id` shape, not the code.)
- **Spec B field decision:** `feature_source` slug = *what grants the feature at the book's
  granularity* — `summoner` (base) / `circle` (universal circle features) now; `circle-of-<name>`
  for the ~24 named-circle picks is **Phase 2** (validated by the per-level lookup tables, not the
  advancement table). Circle picks are all `@type: feature` (not abilities); there's a single
  `feature.schema.json` (abilities validate against it too).
- **Don't re-litigate settled forks** (all in the specs): keep the 3 "Circle Feature(s)" lookup
  headers as `feature`; advancement table is **validated, not generated**; convert Beastheart for
  consistency; `feature_source` is summoner-only this phase.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git status --porcelain && git log --oneline -3                      # expect clean; HEAD = 13926f8
git -C steel-etl rev-parse --short HEAD                             # expect 6880948
git -C steel-etl status --porcelain                                 # expect empty
git -C steel-etl grep -l bodyHasStandaloneDescendant -- internal/site/ability_cards.go  # embed fix present
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/{site,cli,content}/'  # expect ok
ls docs/superpowers/specs/2026-06-18-*-design.md \
   docs/superpowers/plans/2026-06-19-level-grouping-annotation-standardization.md       # all present
```

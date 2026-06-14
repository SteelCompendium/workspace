# HANDOFF — Featureblock Plan 5 (companion + fixture restructure)

**Date:** 2026-06-14 · **Status:** 5a + 5b + 5c shipped (on branch, NOT deployed); 5d (deploy) is the single next effort.

## You are here

The "featureblock cards" effort's Plan 5 = SCC restructure + embeddable advancement-entity. Full design: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`. Durable detail: memory `project_featureblock_cards.md`.

### Done — on `steel-etl@feat/companion-scc-restructure`, NOT merged/deployed
- **5a — companion SCC restructure** (`docs/superpowers/plans/2026-06-13-companion-scc-restructure.md`): companions → `monster.companion.beastheart.statblock/<species>`. Commits `2771b9b`→`bfd1937`.
- **5b — companion advancement-features** (`docs/superpowers/plans/2026-06-13-companion-advancement-featureblocks.md`): 14 `monster.companion.beastheart.advancement-features/<species>` entities. Commit `8450ed8` (+docs `8688431`). ⚠️ stray commit `1392a73` (a subagent's harmless dead-kit-helper removal + config tests) rides on the branch — keep or drop when finalizing.
- **5c — fixture restructure** (`docs/superpowers/plans/2026-06-14-fixture-featureblock-restructure.md`): 4 summoner fixtures → base `monster.fixture.<element>.featureblock/<id>` + sibling `…advancement-features/<id>`. Plan 3's `fixture_page.go` adapter retired; fixtures render via `buildFeatureblockPage`, sit at `Browse/monster/fixture/<element>/<id>`, kept searchable as a `"fixture"` Bestiary facet. Commits `5de88d7`, `1cf94cd`, `699402f`, `3057d01`, `09b3fc1`, docs `85d34e6`. See the plan's `## Status` for per-task detail + the keep-searchable decision.
- Registry 2997 → **3015**. Workspace docs (scc-log, CLAUDE.md, DESIGN.md, plan Status, this handoff) committed to `main`. **steel-etl submodule pointer intentionally NOT bumped** (`git status` shows `M steel-etl`) — that's 5d.

### Next — Plan 5d (deploy), execute in a fresh session
`docs/superpowers/plans/2026-06-14-companion-fixture-deploy.md`: merge `feat/companion-scc-restructure` → steel-etl main (decide keep/drop on stray `1392a73`), SDK sync (likely no-op — no schema change in 5a/5b/5c), bump the workspace steel-etl pointer, `just deploy`, verify live (Brave — companion + fixture pages, Bestiary "fixture" facet), then ROADMAP + Plan 6 stub.

### After Plan 5
- **Plan 6** — retainer rework (own advancement-features codes, mirroring companions/fixtures; collect uncollected H8). Spec/plan TBD.
- **ROADMAP** — statblocks → build-time HTML + entity-embedding (enables the on-companion-page advancement card, currently deferred); summoner champion/minion/rival `monster.*` restructure.

## Verified state (as of 2026-06-14)
- Branch: `steel-etl@feat/companion-scc-restructure`, working tree clean. Workspace `main`, only `M steel-etl` (pointer deferred to 5d).
- Build: `devbox run -- go -C steel-etl build ./...` → clean.
- Tests: `devbox run -- go -C steel-etl test ./...` → all 8 packages green.
- `gen --all` → 3015 codes; `site` → clean. 8 fixture codes (4 featureblock + 4 advancement-features), zero `fixture.*.statblock`.

## Gotchas
- devbox: every Go cmd prefixed `devbox run -- go -C steel-etl <args>` (run from workspace root).
- `freeze: false` — restructures rebuild the registry clean; `--scc-stable` deltas are informational.
- A feature reads its own `@level` (pipeline pushes a section's annotation before its parser; `Lookup` includes the section's level).
- `hoistStatblockPath` now also drops the `featureblock/` segment, scoped to `monster/fixture/` (only the 4 fixtures carry it).
- FOLLOWUPS #8: featureblock card `features[]` bodies don't resolve `scc:` links (pre-existing, malice too) — not a Plan 5 regression.

## Verification commands
```
git -C steel-etl branch --show-current        # feat/companion-scc-restructure
git -C steel-etl status --short               # clean
git status --short                            # only ' M steel-etl'
devbox run -- go -C steel-etl build ./...
devbox run -- go -C steel-etl test ./...
grep -oE '"mcdm\.summoner\.v1/[^"]*fixture[^"]*"' steel-etl/classification.json | sort -u   # 8 codes (after a gen --all)
```

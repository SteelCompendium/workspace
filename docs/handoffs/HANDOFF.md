# HANDOFF — Featureblock Plan 5 (companion + fixture restructure)

**Date:** 2026-06-14 · **Status:** 5a + 5b shipped (on branch, not deployed); 5c + 5d planned, awaiting execution in a fresh session.

## You are here

The "featureblock cards" effort's Plan 5 was **redesigned** (user, 2026-06-13) from a site-side card into an **SCC restructure + embeddable advancement-entity** effort. Full design: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`. Durable detail + scheme: memory `project_featureblock_cards.md`.

### Done (this session) — on `steel-etl@feat/companion-scc-restructure`, NOT merged/deployed
- **5a — companion SCC restructure** (`docs/superpowers/plans/2026-06-13-companion-scc-restructure.md`): companions `feature-group.companion/*` → `monster.companion.beastheart.statblock/<species>`; members gained a `beastheart` segment. 85 codes re-pathed 1:1, 13 links re-swept. Commits `2771b9b`→`bfd1937`.
- **5b — companion advancement-features** (`docs/superpowers/plans/2026-06-13-companion-advancement-featureblocks.md`): 14 `monster.companion.beastheart.advancement-features/<species>` entities; standalone Forged Band cards (level-3/6/10 bands) verified via `steel-etl site`. Commit `8450ed8` (+docs `8688431`, workspace `35b9900`). ⚠️ stray commit `1392a73` (a subagent's harmless dead-kit-helper removal + config tests) rides on the branch — keep or drop when finalizing.
- Registry 2997 → **3011**. Workspace docs committed to `main` (scc-log, CLAUDE.md, DESIGN.md, FOLLOWUPS #8). **steel-etl submodule pointer intentionally NOT bumped** (`git status` shows `M steel-etl`) — that's 5d.

### Next — execute in a fresh session (subagent-driven)
1. **5c — fixtures** (`docs/superpowers/plans/2026-06-14-fixture-featureblock-restructure.md`): summoner fixtures `fixture.<element>.statblock` → `monster.fixture.<element>.featureblock` + `…advancement-features`; retires Plan 3's `fixture_page.go`. Meatier than companions (statblock→featureblock flip + source split ×4 + Bestiary recategorization). Source structure documented in the plan (`input/summoner/Draw Steel Summoner.md` ~1488–1610).
2. **5d — deploy** (`docs/superpowers/plans/2026-06-14-companion-fixture-deploy.md`): merge branch, (SDK sync — likely no-op), bump pointer, `just deploy`, verify live (Brave), ROADMAP + Plan 6 stub.

### After Plan 5
- **Plan 6** — retainer rework (own advancement-features codes; collect uncollected H8). Spec/plan TBD.
- **ROADMAP efforts** — statblocks → build-time HTML + entity-embedding (enables the on-companion-page advancement card, currently deferred); summoner champion/minion/rival `monster.*` restructure.

## Gotchas
- devbox: `devbox run -- go -C steel-etl <args>` (devbox runs from workspace root; `-C steel-etl` targets the module).
- `freeze: false` — restructures rebuild the registry clean; `--scc-stable` deltas are informational, not failures.
- A feature reads its own `@level` (pipeline pushes a section's annotation before its parser; `Lookup` includes the section's level).
- FOLLOWUPS #8: featureblock card `features[]` bodies don't resolve `scc:` links (pre-existing, malice too) — not a Plan 5 regression.

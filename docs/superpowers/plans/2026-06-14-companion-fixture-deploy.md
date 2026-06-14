# Companion + Fixture Featureblock Deploy/Finalize Plan (Featureblock Plan 5d)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Run AFTER 5a+5b (+5c) have landed on the steel-etl branch. This is the merge + deploy + verify + roadmap-bookkeeping step. Re-read cited files (fresh session).

**Goal:** Ship Plans 5a–5c to the live site: merge the steel-etl feature branch, sync the SDK if needed, bump the workspace `steel-etl` submodule pointer, rebuild + deploy the v2 site, verify the live result, and record the deferred ROADMAP efforts + Plan 6 stub.

**Architecture:** Final step of the companion-restructure-advancement effort. **No new feature code** — integration, deploy, and bookkeeping only. The earlier plans intentionally deferred the pointer bump + v2 rebuild here so it happens once for the whole effort.

**Tech Stack:** git (steel-etl submodule + workspace + data-sdk-npm), devbox, `just deploy*` recipes. Prefix Go/just with `devbox run --`.

---

## Context (read first)
- **Branch state:** Plans 5a+5b (+5c) live on `steel-etl@feat/companion-scc-restructure` (or `…/feat/fixture-featureblock-restructure` if 5c branched separately — confirm with `git -C steel-etl log --oneline main..HEAD`). The workspace `steel-etl` submodule pointer is intentionally still at the pre-5a commit (`git status` shows `M steel-etl`).
- **Deploy flow** (workspace `CLAUDE.md` / `ARCHITECTURE.md`): `just deploy` = full pipeline (gen + API + v2). `just deploy-v2` = pipeline + v2 site. All `just deploy*` pass `gen --all`. Toolchain via devbox.
- **Schema/SDK:** 5b/5c added NO new schema fields (the advancement-features + fixture entities are `type: featureblock`, covered by the existing `featureblock.schema.json`; `transformFeatureblock` already handles `type: featureblock`). So **likely no SDK change** — Task 2 verifies and is a no-op if so.
- **Dual-schema-sync rule** (memory `reference_dual_schema_sync`): if any schema DID change, the canonical SDK copy is `data-sdk-npm` on the **`v3` branch**.

## Task 1: Merge the steel-etl feature branch
- [ ] `git -C steel-etl log --oneline main..HEAD` — review the full 5a/5b(/5c) commit set; confirm the stray `1392a73` (dead-kit-helper removal + config tests, a 5b subagent's unplanned-but-harmless commit) is acceptable to keep, or `git rebase`/drop it first if the user wants it out.
- [ ] `devbox run -- go -C steel-etl build ./... && devbox run -- go -C steel-etl test ./...` → green.
- [ ] Merge to steel-etl `main` (match prior convention — Plans 3/4 used `git merge` of the feat branch; e.g. `git -C steel-etl checkout main && git -C steel-etl merge --no-ff feat/companion-scc-restructure`). Do NOT push unless the user asks.

## Task 2: SDK sync (verify; likely no-op)
- [ ] Diff schemas: `git -C steel-etl diff main -- schemas/` over the effort — if `featureblock.schema.json` (or any) changed, mirror the change into `data-sdk-npm/src/schema/*.schema.json` on the **`v3` branch**, and confirm `internal/output/schema_validation_test.go` allowlists match. If nothing changed (expected), record "no SDK change" and skip. Also confirm the SDK `transformFeatureblock` emits the companion/fixture advancement entities correctly (they are `type: featureblock`).

## Task 3: Bump the workspace submodule pointer
- [ ] From the workspace root: `git add steel-etl && git commit -m "chore: bump steel-etl (companion+fixture featureblock restructure, Plan 5a-5c)"`. (This is the deferred pointer bump.)

## Task 4: Rebuild + deploy the v2 site
- [ ] `devbox run -- just deploy-v2` (gen --all + site + mkdocs build) — or `just deploy` if the SCC API should ship too (companion/fixture codes changed, so the API SHOULD refresh: prefer `just deploy`). Watch for errors.
- [ ] Confirm the build is clean and `validate --scc-stable` behaves as expected (the companion/fixture deltas are the intended changes; with `freeze:false` they're not hard failures).

## Task 5: Verify the live result (Brave via playwright-core — memory `reference_playwright_mcp_broken`, executablePath `/opt/brave.com/brave/brave`)
- [ ] **Companion statblock page** (new URL `…/Browse/monster/companion/beastheart/statblock/wolf/`): renders (stat grid + L1 features); the "Wolf Advancement Features" section is present.
- [ ] **Companion advancement-features page** (`…/advancement-features/wolf/`): Forged Band card with Level-3/6/10 bands.
- [ ] **Fixture base + advancement pages** (if 5c shipped): base `…/monster/fixture/demon/the-boil/` renders as a featureblock card (no statblock island); advancement page has Level-5/9 bands.
- [ ] **Old URLs:** the pre-restructure companion/fixture URLs (`…/feature-group/companion/wolf/`, `…/fixture/demon/.../the-boil/`) and `/scc/<old-code>/` permalinks now 404 (codes re-minted; beastheart/summoner are recent, un-frozen — broken old URLs are acceptable per the spec, no tombstones planned). Note any that matter.
- [ ] Bestiary tab / Browse indexes categorize companions + fixtures under their new `monster.*` locations.

## Task 6: ROADMAP + Phase 6 bookkeeping
- [ ] `ROADMAP.md`: add (a) **Statblocks → build-time HTML + entity-embedding** (retire `steel-statblock.js` island; embed Malice featureblocks into monster statblocks and the companion advancement card into the companion statblock — the deferred on-page card from spec §5/§8); (b) **Summoner champion/minion/rival `monster.*` restructure** (fixtures done in 5c; the other three deferred).
- [ ] `ROADMAP.md` (or a new `docs/superpowers/specs/` stub): **Plan 6 — retainer rework** — give retainer advancement abilities their own `monster.<group>.…advancement-features` codes (collect the currently-uncollected `########` H8 headings — `collectDeepHeadings`/`demoteOverflowHeadings`), replacing Plan 4's site-side body split. Its own spec/plan when started.
- [ ] Update memory `project_featureblock_cards.md`: 5a–5c shipped + deployed; Plan 6 next. Update `MEMORY.md` one-liner.
- [ ] Commit docs.

## Self-Review notes
- This plan ships, it doesn't build features. The only "code" risk is the merge + the SDK sync (Task 2, expected no-op). Verification (Task 5) is the real gate. Old-URL breakage is an accepted, documented consequence (un-frozen recent books, no tombstone lifecycle in scope).
- Sequencing: 1→2→3→4→5→6. If 5c is NOT done when 5d runs, drop the fixture lines from Tasks 4–6 and ship companions-only; re-run a trimmed 5d after 5c.

## Execution Handoff
Fresh session. After 5d, the companion+fixture featureblock effort is fully shipped; remaining: Plan 6 (retainers) + the two ROADMAP efforts (statblocks→build-time-HTML/embedding, summoner champion/minion/rival restructure).

## Status — SHIPPED + DEPLOYED 2026-06-14

All tasks done; the effort is **live**.
- **T1 merge:** `feat/companion-scc-restructure` → steel-etl `main` (`44d07a1`, `--no-ff`); kept the harmless stray `1392a73`. Build+test green on main.
- **T2 SDK sync:** confirmed **no schema change** across 5a–5c (`git diff 0eaf8c2 main -- schemas/` empty) → no-op.
- **T3 pointer:** workspace `steel-etl` submodule bumped to `44d07a1`.
- **T4 deploy:** `just deploy`. ⚠️ first run's API push was rejected (local clones of BOTH deploy repos — `steelCompendium.github.io` 9 behind, `v2` 15 behind — had un-pulled prior deploys). Reconciled by `git reset --hard origin/main` in each + fresh regen (API/site are fully generated, so reset+regen is the correct reconcile, not a manual merge), then `just deploy` again → both pushed (org `2e09d418`, v2 `ef6e17cce3a` stamped `steel-etl 44d07a1`). CI (`ci` + `pages-build-deployment`) green.
- **T5 verify (live):** new fixture base/advancement + companion base/advancement pages → 200 (fb-wrap cards, Level-5/9 bands confirmed in live HTML); old URLs `/Browse/fixture/demon/the-boil/` + `/Browse/feature-group/companion/wolf/` → 404 (re-minted, un-frozen, no tombstones — accepted per spec); API `monster.fixture.demon.featureblock/the-boil.json` → 200, `type: featureblock`.
- **T6 bookkeeping:** ROADMAP #7 (statblocks→build-time-HTML + entity-embedding), #8 (summoner champion/minion/rival `monster.*` restructure), #9 (Plan 6 retainer rework) added; memory + this status updated.

**Remaining:** Plan 6 / ROADMAP #9 (retainer rework). **Possible footgun:** if a separate automated deploy routine runs `just deploy*` from a checkout still at the OLD steel-etl pointer, it would regenerate old-code API/site and revert this — confirm any such routine uses the bumped pointer.

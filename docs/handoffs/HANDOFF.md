# Handoff — 2026-06-15

## Next up — Advancement-features preview cards (feature names + levels)
**Goal:** the **advancement-features** card on the companion (and summoner-fixture) group-landing
index should list the **features gained and the level each is gained at**, instead of being a
bare "Advancement Features" card — analogous to how the `.sb-prev` statblock preview lists each
feature's usage/cost. e.g. the Panther advancement card should show `L3 Cat and Mouse ·
L6 Single Bound · L10 Panther Spirit`.

- **The data is already there.** Advancement-features leaves are `type: featureblock` with the
  list in frontmatter: `features:` = `[{name, level, body}, …]` (see
  `v2/docs/Browse/monster/companion/beastheart/panther-advancement-features.md`). The full leaf
  page already renders these as "Level N Advancement" bands (`featureblock_page.go`); only the
  **index card** drops them.
- **Where:** `steel-etl/internal/site/advancement_pairs.go` — the adv slot is rendered as
  `card(p.adv, icon, "Advancement Features", name, "")`; the empty 5th arg is the card's inner
  HTML. Build that inner from the adv file's frontmatter `features[]` (name + level). Reuse the
  compact one-line-per-feature idiom from `renderStatblockFeatureLine` (`statblock_preview.go`)
  — here a level badge + name per row (no usage/cost). Check how `featureblock_page.go` parses
  the `features:` YAML list so you read it the same way.
- **Scope note:** the pair builder is shared by companions AND summoner fixtures, so this lands
  for both advancement-card kinds at once. Site-only (no SCC/schema change).
- **Process:** write a short plan via `superpowers:writing-plans`, then TDD it. It's small —
  comparable to one companion-adapter task.

## Other open tasks (not started)
- **Statblock preview default zones (ROADMAP #11)** — awaiting a community poll. Trivial: change
  the default in three synced places (`steel-etl sbPreviewDefaults`, v2 `settings-core.js`
  `SBPREV_DEFAULTS`, `overrides/main.html`). No work until the poll resolves.
- **Retainer rework (ROADMAP #9 / featureblock Plan 6)** — untouched.

## Current state (clean baseline)
- All three repos on `main`, clean, 0 unpushed. steel-etl `main` = `b7c0591` (companion adapter),
  workspace `main` = `ada6ce6` (submodule bump + ROADMAP #12 shipped + docs), v2 `main` =
  `74307690b` (deployed; CI `gh-deploy` publishes on push).
- ROADMAP #12 (companion statblock adapter) shipped + live this session — plan
  `docs/superpowers/plans/2026-06-15-companion-statblock-adapter.md`, memory
  `project_statblock_preview_cards`. `steel-etl` `go test ./...` + `go vet`: GREEN.

## Gotchas & lessons (cross-cutting — still true)
- **Three separate repos**, branched/merged/pushed independently: `steel-etl` (submodule), `v2`
  (separately-cloned, gitignored by workspace), `workspace`. **`origin/main` can advance
  mid-session** (a parallel effort shipped during #12) — always `git fetch origin` + rebase your
  branch onto it before merging. Bump the workspace submodule pointer (`git add steel-etl &&
  commit "chore: bump steel-etl to <sha>"`) only AFTER steel-etl `main` advances. `just deploy-v2`
  runs `gen --all` + `site`, commits regenerated `v2/docs/*`, and pushes v2 — but NOT
  steel-etl/workspace; push those yourself.
- **Run Go/node via devbox from the workspace root**, cd-ing inside: `devbox run -- bash -c 'cd
  steel-etl && go test ./internal/site/'`. A bare `devbox run -- go …` fails ("cannot find main
  module").
- **Build-order gotcha:** `buildSection` transforms statblock/companion leaves to HTML BEFORE
  `generateIndexPages` builds group landings, so index builders read already-transformed leaf
  bodies. Statblock previews recover features from `statblockFeatureCache`; companions cache the
  whole island in `companionStatblockCache` (both reset in `Build()`). NOTE: the advancement card
  reads the adv leaf's **frontmatter**, which survives the transform — so no cache needed for the
  next task.
- **`gen` book filter wants the book ID** (`--book mcdm.beastheart.v1`), not a short name. A bare
  `gen` skips the `books:` list; deploy recipes pass `--all`.
- **Don't hand-edit generated output** (`v2/docs/Browse/**`); `steel-etl site` overwrites it.
  CSS-only change → commit `v2/docs/stylesheets/*` + push v2 (CI rebuilds). Full content change →
  `just deploy-v2`.
- **Screenshots:** Playwright MCP is broken; use headless Brave (`/opt/brave.com/brave/brave
  --headless --no-sandbox --screenshot=… "file://…"`), against the built `v2/site/…` HTML.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git branch --show-current && git -C steel-etl branch --show-current && git -C v2 branch --show-current   # all: main
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ && go vet ./internal/site/'   # GREEN
# the next task's input data (advancement-features frontmatter):
sed -n '1,16p' v2/docs/Browse/monster/companion/beastheart/panther-advancement-features.md   # features: [{name, level, body}]
```

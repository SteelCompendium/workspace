# Handoff — 2026-06-15 (advancement cards shipped)

## Active efforts
None in flight. The previous "Next up" (advancement-features preview cards) **shipped + live
this session** — see "Just shipped" below. Pick the next item from
[`ROADMAP.md`](../../ROADMAP.md) / [`FOLLOWUPS.md`](../../FOLLOWUPS.md).

## You are here — pick the next task
No task is mid-flight; choose from ROADMAP. Natural candidates, in rough order:
- **ROADMAP #8** — build-time statblock embed: move monster/companion statblocks off the
  client JSON island to build-time HTML, then embed the **companion advancement-features card
  onto the companion statblock page** (the on-page composite deferred from Plan 5). This is the
  direct follow-on to the preview-card / companion-adapter work just finished.
- **ROADMAP #9** — Plan 6 retainer advancement rework (give retainer advancement its own
  `…advancement-features` SCC codes, replacing Plan 4's site-side body split).
- **ROADMAP #11** — blocked on a community poll (preview default-zone visibility); don't start.

## Just shipped this session — advancement-features preview cards
The `advancement-features` index card on companion + summoner-fixture group landings now lists
the **features gained and the level each is gained at** (e.g. Panther → `L3 Cat and Mouse ·
L6 Single Bound · L10 Panther Spirit`; fixtures advance at L5/L9), instead of a bare card.
- `advancementCardInner(dir, advFile)` in `steel-etl/internal/site/advancement_pairs.go` reads
  the adv leaf's frontmatter `features[]` (the `fbDoc` shape) → `<ul class="sc-card__advlist">`.
  No cache needed (frontmatter survives the leaf transform). CSS `.sc-card__adv*` in
  `v2/docs/stylesheets/steel-redesign.css`. Shared pair builder → companions + fixtures together.
- Plan: `steel-etl/docs/superpowers/plans/2026-06-15-advancement-preview-cards.md`.
- Memory: `project_statblock_preview_cards` (updated).

## Verified state (as of 2026-06-15, end of session)
- **All three repos on `main`, clean, 0 unpushed, 0 behind origin.** steel-etl `main` =
  `8daee93` (advancement card features), v2 `main` = `78859794fc8` (deployed content +
  CSS), workspace `main` = `b42932e` (submodule bump). CI `gh-deploy` publishes v2 on push.
- **Registry is now 3013 codes** (was 3015): a parallel effort that landed mid-session
  ("flatten common abilities under `feature.ability.common`", FOLLOWUPS #17) reduced it by 2.
  I rebased my work onto it cleanly — no overlap.
- `steel-etl` `go test ./internal/site/` + `go vet`: GREEN. Full `go test -race ./...`: GREEN.

## Gotchas & lessons (cross-cutting — still true)
- **Three separate repos**, pushed independently: `steel-etl` (submodule), `v2` (separately
  cloned, gitignored by workspace), `workspace`. **`origin/main` advanced on ALL THREE
  mid-session** this time (parallel flatten + deploy-recipe efforts). ALWAYS `git fetch origin`
  + rebase each repo onto its `origin/main` before pushing/deploying. Ship order that worked:
  rebase+test+push steel-etl → discard stale regen + commit CSS + rebase v2 → rebase workspace
  → `just deploy-v2` (regenerates fresh, commits v2 docs, pushes v2) → bump workspace submodule
  pointer (`git add steel-etl && commit "chore: bump steel-etl to <sha>"`) + push workspace.
  Do NOT `git submodule update` after rebasing steel-etl — it would detach and abandon your
  rebased commit; bump the pointer manually instead.
- **Run Go/node via devbox from the workspace root**, cd-ing inside: `devbox run -- bash -c 'cd
  steel-etl && go test ./internal/site/'`. A bare `devbox run -- go …` fails ("cannot find main
  module").
- **Build-order gotcha:** `buildSection` transforms statblock/companion leaves to HTML BEFORE
  `generateIndexPages` builds group landings. Statblock previews recover features from
  `statblockFeatureCache`; companions cache the whole island in `companionStatblockCache` (both
  reset in `Build()`). The advancement card reads the adv leaf's **frontmatter**, which survives
  the transform — so it needs no cache (unlike the preview cards).
- **`gen` book filter wants the book ID** (`--book mcdm.beastheart.v1`), not a short name. A bare
  `gen` skips the `books:` list; deploy recipes pass `--all`.
- **Don't hand-edit generated output** (`v2/docs/Browse/**`); `steel-etl site` overwrites it.
  CSS-only change → commit `v2/docs/stylesheets/*` + push v2 (CI rebuilds). Content change →
  `just deploy-v2` (regenerates + commits `v2/docs/*` + pushes v2; does NOT push steel-etl/workspace).
- **Screenshots:** Playwright MCP is broken; use headless Brave (`/opt/brave.com/brave/brave
  --headless --no-sandbox --screenshot=… "file://…"`), against the built `v2/site/…` HTML.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git branch --show-current && git -C steel-etl branch --show-current && git -C v2 branch --show-current   # all: main
git fetch origin -q && git -C steel-etl fetch origin -q && git -C v2 fetch origin -q
for r in . steel-etl v2; do echo "$r: $(git -C $r rev-list --left-right --count origin/main...HEAD)"; done   # all 0  0
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ && go vet ./internal/site/'   # GREEN
# the shipped feature (generated output): each companion/fixture adv card lists L<n> + name
grep -o 'advlvl">L[0-9]*' v2/docs/Browse/monster/companion/beastheart/index.md | sort | uniq -c   # 14× L3, L6, L10
```

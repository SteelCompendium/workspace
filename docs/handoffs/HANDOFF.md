# Handoff — 2026-06-15

## Active efforts
None in flight. The Beastheart companion statblock adapter (ROADMAP #12) shipped this session.

## Just shipped — Beastheart companion statblock adapter (ROADMAP #12)
All 12 beastheart companions now render as proper statblocks (previously a raw markdown table on the leaf + bare "Companion" `.sc-card`s on the index):
- **Leaf pages** (`Browse/monster/companion/beastheart/<species>.md`) embed the full `.sb-wrap` card, replacing the raw stat table; the `## …Advancement Features` section is kept verbatim below it.
- **Index** (`…/beastheart/index.md`) shows each base as a `.sb-prev` preview paired with its advancement-features card (kept the base↔advancement pairing — "Option A").
- Plan + full mechanics: [`docs/superpowers/plans/2026-06-15-companion-statblock-adapter.md`](../superpowers/plans/2026-06-15-companion-statblock-adapter.md) (`## Status` = shipped). Memory: `project_statblock_preview_cards` (companion section).
- New site-only code: `steel-etl/internal/site/companion_statblock.go` (`parseCompanionGrid`, `companionFeatures` reusing `parseStatblockIslandFeature` via a `"• **Name**"` title synthesis, `buildCompanionStatblockPage`, `companionStatblockCache`). Touched: `build.go` (chain + cache reset), `advancement_pairs.go` (index previews), `statblock_card.go` (`renderStatblockHead` omits empty EV), `statblock_preview.go` (`sbPreviewDefaultAttrs` helper). v2 CSS: `.sc-cards--pairs.sb-cards` in `steel-statblock.css`.

## Remaining / next candidates
- **Companion advancement-features card quality** — the `<species>-advancement-features.md` (`type: featureblock`) cards were explicitly LEFT AS-IS by #12 (user said it's a separate task). Their card quality/embedding is the natural follow-on. Not yet a ROADMAP item — add one via writing-plans if picked up.
- **Statblock preview default zones (ROADMAP #11)** — still open, awaiting a community poll. A 3-constant change (steel-etl `sbPreviewDefaults`, v2 `settings-core.js` `SBPREV_DEFAULTS`, `overrides/main.html`); no work until the poll resolves. Companion previews inherit the same global default automatically.
- **Retainer rework (ROADMAP #9 / featureblock Plan 6)** — untouched.

## Verified state (as of this handoff, AFTER the #12 deploy)
- All three repos on `main`, feature branches merged + deleted, pushed to `origin`.
  - `steel-etl` `main` advanced past `9863364` (companion adapter, 8 commits incl. the DRY refactor); the workspace submodule pointer bumped to it.
  - `v2` `main` = preview CSS + the `just deploy-v2` content commit, pushed; CI `gh-deploy` publishes on push.
  - workspace `main` = plan + docs (ROADMAP #12 shipped, DESIGN.md coverage note) + submodule bump.
- `steel-etl` full `go test ./...` + `go vet ./internal/site/`: GREEN. Final go-reviewer: no blocking issues.
- Verified end-to-end with headless-Brave screenshots: index shows 12 `.sb-prev` previews paired with advancement cards; the panther leaf shows the full `.sb-wrap` card (COMPANION role, defenses, Movement=Climb / Skills=Sneak link, characteristics, Pounce + Mighty Spring) then the verbatim advancement section.

## Gotchas & lessons (cross-cutting — unchanged, still true)
- **Three separate repos**, branched/merged/pushed independently: `steel-etl` (submodule), `v2` (separately-cloned, gitignored by workspace), `workspace`. Bump the workspace submodule pointer (`git add steel-etl && commit "chore: bump steel-etl to <sha>"`) only AFTER steel-etl `main` advances. `just deploy-v2` runs `gen --all` + `site`, commits the regenerated `v2/docs/*`, and pushes v2 — but NOT steel-etl/workspace; push those yourself.
- **Run Go/node via devbox from the workspace root**, cd-ing inside: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`. A bare `devbox run -- go …` fails ("cannot find main module").
- **Build-order gotcha:** `buildSection` transforms statblock/companion leaves to HTML BEFORE `generateIndexPages` builds group landings. Monsters recover features from `statblockFeatureCache` (stats are in frontmatter); companions cache the WHOLE island in `companionStatblockCache` (stats are in the body). Both reset in `Build()`.
- **`gen` book filter wants the book ID** (`--book mcdm.beastheart.v1`), not a short name. A bare `gen` skips the `books:` list; deploy recipes pass `--all`.
- **Don't hand-edit generated output** (`v2/docs/Browse/**`); `steel-etl site` overwrites it. CSS-only change → commit `v2/docs/stylesheets/*` + push v2 (CI rebuilds). Full content change → `just deploy-v2`.
- **Screenshots:** Playwright MCP is broken; use headless Brave (`/opt/brave.com/brave/brave --headless --no-sandbox --screenshot=… "file://…"`). `.sb-prev` previews need a `.sb-cards` ancestor with `data-sbprev-*` for zone defaults + the toggle JS; preview zones default to stats-on/rest-off.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git branch --show-current && git -C steel-etl branch --show-current && git -C v2 branch --show-current   # all: main
git -C steel-etl rev-parse --short HEAD                       # companion-adapter merge SHA
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ && go vet ./internal/site/'   # GREEN
# confirm the companion adapter is live in generated output:
grep -c 'class="sb-wrap"' v2/docs/Browse/monster/companion/beastheart/panther.md             # 1 (card embedded)
grep -c '<br>Size' v2/docs/Browse/monster/companion/beastheart/panther.md                    # 0 (raw table gone)
grep -o 'sb-prev\|sb-cards' v2/docs/Browse/monster/companion/beastheart/index.md | sort -u   # both present
```

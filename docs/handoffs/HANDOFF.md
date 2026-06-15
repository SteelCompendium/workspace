# Handoff — 2026-06-15

## Active efforts
- **Beastheart companion statblock previews / embedding** — IN FOCUS (not started). Resume at [`ROADMAP.md`](../../ROADMAP.md) **#12**. Needs its own plan (use `superpowers:writing-plans`) — it's parser work.
- **Statblock preview cards** — SHIPPED + LIVE 2026-06-15. Plan: [`docs/superpowers/plans/2026-06-15-statblock-preview-cards.md`](../superpowers/plans/2026-06-15-statblock-preview-cards.md) (`## Status` = shipped). Memory: `project_statblock_preview_cards`. Only follow-on is the default-zone poll (ROADMAP #11) — a 3-constant change, no work until the poll lands.

## You are here
Build the **companion `feature-group → sbIsland` adapter** so Beastheart companions render as `.sb-prev` statblock previews on their index (and, ideally, embed the full `.sb-wrap` card on the companion's own page). **First action:** write a plan for ROADMAP #12 with `superpowers:writing-plans`, then execute it. Do NOT start coding before the plan + the verify-restate gate.

### Why this exists (the finding that triggered the handoff)
The statblock preview cards (just shipped) render every creature statblock as a compact `.sb-prev` card via `renderStatblockPreviewCard(sbIsland, …)`. Companions DON'T render — not a routing/CSS issue, but because **companions aren't in the `sbIsland` data model**:
- Companion pages are `type: feature-group` (SCC `monster.companion.beastheart.statblock/<species>`), **not** `type: statblock`.
- Stats are a 4-row markdown **table** in the body (NOT frontmatter scalars); abilities are `##` sections (NOT blockquotes). Frontmatter has only `name`/`level`/`companion`/`type`.
- So `buildStatblockIsland(fm, body)` finds nothing → no card. The leaf page is a raw HTML table (0 `.sb-wrap`); the index (`buildAdvancementPairContent`) shows bare "Companion" `.sc-card`s.

The build-time statblock renderer IS reusable on any page (the JSON island was removed 2026-06-14), but it's **gated on having an `sbIsland`** — companions need an adapter to produce one. Full scope + file pointers + the build-order/`statblockFeatureCache` gotcha live in **ROADMAP #12** — read it; it's the spec-in-brief.

### Out of scope for #12 (separate task, per user)
The companion **advancement-features** featureblocks (`<species>-advancement-features.md`, `type: featureblock`) — their card quality/embedding is its own task. Leave them as-is; #12 is only about the companion **base** statblock.

## Verified state (as of 2026-06-15)
- All three repos on `main`, working trees clean, 0 unpushed (before this handoff's doc commit):
  - `steel-etl` `main` = `9863364` (preview cards + feature cache).
  - workspace `main` = `4c62d63` (submodule bumped to that); this handoff's doc commit lands on top.
  - `v2` `main` = `f23aa29` (preview CSS + 2 polish rounds), pushed; CI `gh-deploy` publishes on push.
- Preview cards are **live**: 71 group landings carry `.sb-cards` grids of `.sb-prev` cards (e.g. `/Browse/monster/draconians/`).
- steel-etl `internal/site` tests + `go vet`: GREEN (this session). v2 `settings-core.test.js`: 4 pass.
- Companion symptom reproducible at `v2/docs/Browse/monster/companion/beastheart/index.md` (generic cards) and `…/panther.md` (raw table, 0 `.sb-wrap`).

## Gotchas & lessons (cross-cutting)
- **Three separate repos**, branched/merged/pushed independently: `steel-etl` (submodule), `v2` (separately-cloned, gitignored by workspace — its CSS/JS commits land on its own `main`), `workspace`. Bump the workspace submodule pointer (`git add steel-etl && commit "chore: bump steel-etl to <sha>"`) only AFTER steel-etl `main` advances. `just deploy` pushes the API repo + v2, but NOT steel-etl/workspace — push those yourself.
- **Run Go/node via devbox from the workspace root**, cd-ing inside: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`. A bare `devbox run -- go …` runs in the workspace root and fails ("cannot find main module").
- **Build-order gotcha (will bite the adapter):** `buildSection` transforms every statblock leaf to `.sb-wrap` HTML BEFORE `generateIndexPages` builds group landings — so the index reads already-transformed leaves with no blockquote features. Monster previews recover features from a build-scoped `statblockFeatureCache` (keyed by scc, populated in `buildStatblockIslandPage`, reset in `Build()`). A companion adapter parsing features from the page body must handle the same ordering.
- **`buildIndexContent` builder order** (build.go): `buildAdvancementPairContent` → `buildCardsContent` → `buildFeatureIndexContent` → `buildMonsterGroupContent`. Companions are claimed by the FIRST (pair builder). Hook the adapter there, or make the pair builder defer for statblock-based bases.
- **Don't hand-edit generated output** (`v2/docs/Browse/**`); `steel-etl site` overwrites it. CSS-only change → just commit `v2/docs/stylesheets/*` and push v2 (CI rebuilds). Full content change → `just deploy-v2`.
- **Screenshots:** Playwright MCP is broken; use headless Brave (`/opt/brave.com/brave/brave --headless --screenshot=… "file://…"`). Preview zones default to stats-on/rest-off and `statblock-preview.js` reseeds grids from the global `<html data-sbprev-*>` — to capture all zones, neutralize that script + force the grid attrs, else it reseeds to default.

## Verification commands
```bash
cd /home/vexa/code/steel_compendium/workspace
git branch --show-current && git -C steel-etl branch --show-current && git -C v2 branch --show-current   # all: main
git -C steel-etl rev-parse --short HEAD                       # 9863364
git -C v2 rev-list --count origin/main..HEAD                  # 0 (pushed)
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ && go vet ./internal/site/'   # GREEN
# reproduce the companion gap:
grep -c 'class="sb-wrap"' v2/docs/Browse/monster/companion/beastheart/panther.md            # 0 (raw table, not a card)
sed -n '1,9p' v2/docs/Browse/monster/companion/beastheart/panther.md                         # type: feature-group; stats in body table
grep -o 'sb-prev\|sc-card' v2/docs/Browse/monster/companion/beastheart/index.md | sort | uniq -c   # sc-card only, no sb-prev
```

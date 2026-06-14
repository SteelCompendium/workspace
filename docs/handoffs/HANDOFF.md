# HANDOFF — Featureblock Plan 5 (companion + fixture restructure) — COMPLETE

**Date:** 2026-06-14 · **Status:** Plans 5a + 5b + 5c + 5d all SHIPPED + LIVE. The companion+fixture featureblock effort is **done**. Only Plan 6 (retainers) remains, as a fresh ROADMAP item.

## You are here

Nothing in-flight. The "featureblock cards" effort's Plan 5 (SCC restructure + embeddable advancement-entity) is fully shipped and deployed to production. Durable detail: memory `project_featureblock_cards.md`. Design spec: `docs/superpowers/specs/2026-06-13-companion-restructure-advancement-featureblocks-design.md`.

### What shipped (all live on steelcompendium.io)
- **5a** companions → `monster.companion.beastheart.statblock/<species>`.
- **5b** companion advancement-features entities (`monster.companion.beastheart.advancement-features/<species>`).
- **5c** summoner fixtures → `monster.fixture.<element>.featureblock/<id>` + `…advancement-features/<id>`; Plan 3's `fixture_page.go` retired; fixtures render via `buildFeatureblockPage`, sit at `Browse/monster/fixture/<element>/<id>`, searchable as a `"fixture"` Bestiary facet.
- **5d** merged to steel-etl `main` (`44d07a1`), workspace pointer bumped, `just deploy` (API + v2), live-verified.
- Registry **3015** codes.

### Next (when you want it) — Plan 6 = ROADMAP #9
Retainer advancement rework: give retainer advancement abilities their own `monster.<group>.…advancement-features` codes (collect the uncollected `########` H8 headings via `collectDeepHeadings`/`demoteOverflowHeadings`), replacing Plan 4's site-side body split. Mirrors companions (5b) / fixtures (5c). Needs its own spec/plan. Also ROADMAP #7 (statblocks→build-time-HTML + entity-embedding — enables the on-companion-page advancement card) and #8 (champion/minion/rival `monster.*` restructure) are open.

## Verified state (as of 2026-06-14)
- steel-etl `main` at `44d07a1`; workspace `main` pointer bumped to it. Working trees clean.
- Live: new companion/fixture + advancement pages 200 (fb-wrap cards, Level bands in HTML); old URLs 404 (accepted); API `monster.fixture.*` 200. CI green.
- `git status` (workspace): clean after the docs commit below.

## Gotchas
- devbox: every Go/just cmd prefixed `devbox run -- … -C steel-etl …` (from workspace root).
- `just deploy` pushes to TWO live repos (`steelCompendium.github.io` API + `v2` site → CI). Before deploying, `git -C <repo> fetch && git -C <repo> reset --hard origin/main` if local is behind — API/site are fully generated, so reset+regen is the clean reconcile (don't hand-merge generated JSON/markdown).
- **Footgun:** if a separate automated deploy routine runs from a checkout at the OLD steel-etl pointer, it would regenerate old-code output and revert this deploy. Confirm any such routine uses the bumped pointer (44d07a1+).
- `freeze: false` (beastheart/summoner) — restructures rebuild the registry clean; old re-minted URLs 404 with no tombstones (accepted, recent un-frozen books).
- FOLLOWUPS #9: featureblock/terrain/malice (+ now companion-advancement + fixture) card bodies don't resolve `scc:` links (pre-existing; confirmed still present post-deploy).

## Verification commands
```
git -C steel-etl log --oneline -1            # 44d07a1 (merge)
git status --short                           # clean
curl -s -o /dev/null -w '%{http_code}' https://steelcompendium.io/v2/Browse/monster/fixture/demon/the-boil/   # 200
curl -s -o /dev/null -w '%{http_code}' https://steelcompendium.io/v2/Browse/monster/companion/beastheart/advancement-features/wolf/  # 200
devbox run -- go -C steel-etl test ./...     # all green
```

# Handoff — 2026-07-20 (DSE 6.0.0 wave LANDED + DEPLOYED · SDK 3.0.0 on npm · only the plugin release cut remains)

## Where things stand (everything verified)
The entire DSE 6.0.0 wave is **landed, deployed, and live**:
- **`steel-compendium-sdk@3.0.0` on npm** (Scott published 2026-07-20). The unpublished
  3.0/3.1/3.2 line was collapsed into one 3.0.0 (consumer-safety note in its CHANGELOG:
  2.x version-range/tag consumers unaffected). v3 tip includes the reader's
  second-role-token warning (+5 tests, 407 total).
- **`draw-steel-elements` main @ `01822bd`** — the full 6.0.0 build (F2+D6+D8+D7 + HFS
  Steel theme, 32 elements), SDK pinned to npm 3.0.0. Gates green against the published
  SDK: tsc · jest 1981 · shots 295 (zero drift). Release-ready.
- **`steel-etl` main @ `e7ec4a2`** — all site/data work incl. the 2 cherry-picked DSE
  generator fixes (#25 Children copy + kit dedup) and the `sbIsland.Eyebrow` rename.
- **Deployed 2026-07-20** (Scott's go, full `just deploy` + manual completion):
  data-unified `012d474d` + release **`v4.20260720213840`** · SCC API `8d21cd8a` ·
  v2 site `55148acee4` — verified live by curl (malice bands, class back-links,
  SC-86/87 unlinks all serving).
- Workspace main: CHANGELOG has a dated **2026-07-20** deploy section; plan docs 16–19
  brought over from the f2 branch; handoff current.
- Linear: SC-1/2/3/6/10 (features) + SC-13/86/87 → **Done**. SC-11 = the release cut.

## The one remaining step (Scott): SC-11 — cut plugin 6.0.0
Plugin main `01822bd` is release-ready (manifest/LICENSE/lint clean — see
`.superpowers/sdd/sc-11-audit-report.md` for the audited checklist + exact commands):
```bash
cd draw-steel-elements   # main checkout, on main @ 01822bd
npm run build            # produces main.js + styles.css
# bump manifest.json/versions.json if not already at 6.0.0, then:
gh release create 6.0.0 main.js manifest.json styles.css --title "6.0.0" \
  --notes-file <(sed -n '/^## 6.0.0/,/^## 5.1.1/p' CHANGELOG.md | head -n -1)
```
Users then update in Obsidian and re-sync the compendium (guide:
`docs/migrating-to-6.md`). No community-catalog PR needed (plugin id unchanged).

## Loose ends (small, non-blocking)
- **f2 worktree**: all unique content landed; `just wt-rm f2` when convenient (the
  gitignored SDD ledger lives there — copy it first if you want the build history).
- The f2 origin branches (`f2` in plugin/steel-etl/superproject) can be deleted after
  wt-rm; everything is on main.
- Scott taste checks, whenever: statblock-head crest deviation (1-line revert,
  flagged in SC-10/plan 19), SC-76 close confirm, SC-84 zoom-dot recheck.
- FOLLOWUPS: only #2/#3 (settings-panel design, dormant) remain open.

## Gotchas & lessons (this window — keep)
- **wt-finish/wt-rm** (memory: wt-finish-footguns): devbox swallows recipe exit codes —
  never chain `wt-finish && wt-rm`; run from the MAIN checkout; verify origin log before
  wt-rm; clean generated churn first.
- **Stale-worktree landings**: a long-lived worktree's superproject pins go stale as main
  advances — `wt-finish` would REVERT other submodules. Land scoped: push only the
  submodules the branch uniquely advances (FF-check first), cherry-pick where diverged.
- **Deploy recipe**: `just deploy` steps cd into sub-repos that have their own justfiles —
  recipe-internal `just` calls must anchor `-f "$root/justfile"` (fixed c54676c after it
  aborted the first full deploy at release-data; the deploy was completed manually:
  release-data → deploy-api → deploy-v2).
- deploy churn: restore (never commit) org-site API-timestamp + devbox.lock dirt.
- GitHub Pages lags the gh-pages push by a few minutes (`gh api repos/<o>/<r>/pages/builds/latest`).

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace && git status -sb | head -1
git -C draw-steel-elements log --oneline origin/main -1   # 01822bd
git -C steel-etl log --oneline origin/main -1              # e7ec4a2
npm view steel-compendium-sdk version                      # 3.0.0
gh release view --repo SteelCompendium/data-unified --json tagName -q .tagName  # v4.20260720213840
curl -sL 'https://steelcompendium.io/v2/Browse/monster/devil/devil-clerk/' | grep -c 'Malice Features'  # 1
```
**Resume protocol:** verify the above; if SC-11 is cut (gh release 6.0.0 exists on
draw-steel-elements), mark SC-11 Done and archive this wave; otherwise the board is
clear — nothing is blocked on an agent.

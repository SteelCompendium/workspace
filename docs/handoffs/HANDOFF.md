# Handoff — 2026-07-27 addendum (⚠️ 6.0.0 is RETIRED — the plugin's next major is 7.0.0)

**Read this before acting on SC-11 below.** On 2026-07-07 the `6.0.0-rc1` release
candidate was published to `draw-steel-elements` as a **regular** GitHub release (not
marked pre-release). Consequences: Obsidian auto-updated existing users onto the RC
(~120 downloads), and around 2026-07-21/22 the plugin was **delisted from the Obsidian
community store** (`6.0.0-rc1` is not a valid `x.y.z` plugin version, and the registry
is now auto-mirrored by Obsidian's backend).

**Recovery (done 2026-07-27):**
- Deleted the `6.0.0-rc1` release + tag.
- Published **`6.0.1`** — byte-identical to 5.1.1 (tag on the 5.1.1 commit, manifest
  patched to 6.0.1) — so RC users get pulled back to stable via a normal update.
  6.0.1 chosen over 6.0.0 so version comparison beats an installed `6.0.0-rc1`.
- Plugin main: root `manifest.json`/`versions.json` → 6.0.1 (latest released);
  `package.json` → 7.0.0 (dev target); CHANGELOG/docs/deprecation strings renumbered
  (migration guide is now `docs/migrating-to-7.md`; the `roles:`/`ancestry:` shim and
  the legacy sync-command alias are now removed in **8.0.0**, not 7.0.0).
- Awaiting automatic re-listing in `community-plugins.json` (Obsidian's mirror runs
  ~hourly). **If still absent after ~2026-07-29**, contact Obsidian: resubmit via
  community.obsidian.md or ask in Discord `#plugin-dev` (the release is fixed; the
  listing needs their side).

**Rules going forward:** the version `6.0.0` is permanently retired — never cut it.
The overhaul release (everything the 2026-07-20 handoff below calls "6.0.0", and
everything Linear calls the 6.0.0 wave) ships as **7.0.0**. Scott has ruled the
current build is **not ready to release** — do not cut 7.0.0 without his go. Betas:
use BRAT, or at minimum tick "Set as a pre-release" and keep manifest versions
strictly `x.y.z`.

---

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

## The one remaining step (Scott): SC-11 — cut the plugin major (was 6.0.0, now **7.0.0** — see 2026-07-27 addendum; NOT ready per Scott)
Plugin main `01822bd` is release-ready (manifest/LICENSE/lint clean — see
`.superpowers/sdd/sc-11-audit-report.md` for the audited checklist + exact commands):
```bash
cd draw-steel-elements   # main checkout, on main @ 01822bd
npm run build            # produces main.js + styles.css
# bump manifest.json/versions.json to 7.0.0 (currently 6.0.1, the recovery release), then:
gh release create 7.0.0 main.js manifest.json styles.css --title "7.0.0" \
  --notes-file <(sed -n '/^## 7.0.0/,/^## 6.0.1/p' CHANGELOG.md | head -n -1)
```
Users then update in Obsidian and re-sync the compendium (guide:
`docs/migrating-to-7.md`). No community-catalog PR needed (plugin id unchanged).

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
**Resume protocol:** verify the above; if SC-11 is cut (gh release 7.0.0 exists on
draw-steel-elements), mark SC-11 Done and archive this wave; otherwise the board is
clear — nothing is blocked on an agent.

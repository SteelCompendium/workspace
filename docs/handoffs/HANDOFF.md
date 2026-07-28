# Handoff — Steel Compendium workspace (canonical router)

## Active efforts
- **Release / SC-11 → 7.0.0** — the session Scott is actively driving ("moving through"). The
  overhaul release cut. 6.0.1 recovery published; **7.0.0 NOT cut** (Scott: build not ready) — so
  **no agent action is pending here** (its resume protocol below confirms the board is clear).
  Full detail in the two dated sections BELOW (`6.0.0 RETIRED` addendum + `2026-07-20` wave) and
  `.superpowers/sdd/sc-11-audit-report.md`.
- **Steel UI parity** — paused, awaiting a Scott decision (added 2026-07-27, this session).
  Plan 20 (material) + plan 21 (typography/spacing/ink) are **LANDED into the 7.0.0-dev build**;
  plan 22 (body-text coherence) is **DRAFTED, not executed**. Resume at
  `docs/superpowers/dse-overhaul/plans/2026-07-27-plan-22-steel-body-text-coherence.md` (STATUS
  header) + gap inventory `docs/superpowers/dse-overhaul/2026-07-23-steel-ui-gap-inventory.md`.
  Per-task history: `.superpowers/sdd/progress.md` (gitignored scratch).

> **Overall: nothing is agent-actionable right now — both efforts wait on Scott.** Release is
> paused until he says 7.0.0 is ready to cut; Steel UI is paused until he answers the C1
> aesthetic question below. A resuming agent should verify state, restate, and **wait for his
> go** — do not start editing/building/releasing.

---

## Steel UI parity — you are here
**Next action is Scott's, not an agent's:** decide the **C1 aesthetic** — serif body text
*everywhere* (coherent, book-like) vs. keep the data-dense trackers/hero-sheet **sans** (UI
density). A freeze-verified before/after A/B was captured (ephemeral, see gotchas). His answer
gates plan-22 execution. Nothing is blocked on an agent; do **not** execute plan-22 or touch kit
without his call.

## Steel UI parity — verified state (2026-07-27)
- **Superproject** `main` = `origin/main` (`e7fad33`) + **2 unpushed** docs commits (plan-22
  draft + §C/§D audit `b6e9356`; this handoff update). Clean tree, FF-ahead — not diverged.
  Push is a clean fast-forward whenever Scott wants it.
- **dse submodule** @ `b7ea4af` (7.0.0-dev; `package.json` 7.0.0 / `manifest.json` 6.0.1). Plan
  20+21 Steel work **is present** (`f5923f8` is an ancestor); the release renumber did **not**
  touch `styles-source.css` (only version strings), so plan-22's CSS line refs still hold.
- **Landed & guarded** (gap inventory §A): body serif + open line-height + cool ink on the
  **card families**; extended parity gate + two jest contracts.
- **Plan 22 drafted, NOT executed.** Its one CSS change broadens that routing to *every* element
  root so the ~20 plugin-only families (hero sheet, trackers, negotiation, …) stop rendering
  sans body (finding **C1**). CSS-only, no DOM, freeze-safe.
- **No Steel worktrees exist** (removed after landing). Plan-22 needs a fresh
  `just wt-new steel-body` **off the current dse main (`b7ea4af`)**, then `npm ci`.
- **Gates last verified at `f5923f8`** (pre-renumber): tsc clean · jest **2010 / 144** · parity
  **0 GAPs / 10 WARNs / exit 0** · freeze **98/98**. The renumber changed one test's version
  string only — **re-run at `b7ea4af` to confirm** (see verification commands). Demo-vault build
  in the main checkout is from `f5923f8`; visually current (CSS unchanged), version strings stale.

## Steel UI parity — open decisions (Scott)
1. **C1 direction** (above) — gates plan-22. Before/after A/B captured.
2. **kit #32** — needs a theme-conditional-render design + a sanctioned `kit--steel-print`
   rebaseline (a Steel-only DOM change necessarily changes that frozen shot). Its own plan.
3. **#33 / #34 / #35** filed; **C6** font-token / true-slab bundle deferred.

## Steel UI parity — gotchas & lessons
- **Freeze check is bytes, not git** — `visual-harness/shots/` is gitignored so the plan's
  `git status` freeze check is vacuous. Use `bash
  /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <shots-dir>`
  (98 legacy+print PNGs vs sha256 baseline; `<shots-dir>` arg required now that steel-type is
  gone — its default path is dead).
- **Every new Steel CSS rule** must carry `[data-dse-theme='steel']:not([data-dse-print="on"])`
  or it changes the frozen `*--legacy-*`/`*--steel-print` shots. Only unfrozen steel-dark/light
  shots may change.
- **devbox**: wrap commands `bash -c` with an **absolute** `cd` (`devbox run --` ignores cwd);
  read a node exit code by running the command **last** with no trailing `echo` (the sh wrapper
  masks exit 1 as 0).
- **The parity gate covers only the 12 card-family pairs** (no site counterpart for plugin-only
  families), so C1's coherence can only be verified by **reading the shots**, not the gate.
- **C1 preview A/B is ephemeral** — it was `scratchpad/c1-preview/*.png` in a now-deleted
  session scratchpad; **regenerate** by applying plan-22 Task 1 in a worktree and re-shooting.
- **Plan-22 baseline refs are pre-renumber**: it cites `f5923f8` / "6.0.0" / "jest 2010" — the
  build is now `b7ea4af` / 7.0.0; treat those as "current dse main" and re-verify counts.

## Steel UI parity — verification commands
```bash
cd /home/scott/code/steelCompendium/workspace
git status -sb | head -1                                    # main …ahead 1 (unpushed plan-22 docs)
git log --oneline origin/main..main                          # the plan-22 docs commit only
git -C draw-steel-elements rev-parse --short HEAD            # b7ea4af (or later)
git -C draw-steel-elements merge-base --is-ancestor f5923f8 HEAD && echo "Steel work present"
ls docs/superpowers/dse-overhaul/plans/2026-07-27-plan-22-steel-body-text-coherence.md
# Re-verify Steel gates at current main (do this in a FRESH worktree, never the main checkout):
#   devbox run -- bash -c 'cd <wt>/draw-steel-elements && npm run tsc && npx jest 2>&1|tail -3 && npm run parity 2>&1|tail -3'
```

---

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

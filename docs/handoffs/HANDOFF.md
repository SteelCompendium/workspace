# Handoff — 2026-07-18 evening (DSE 6.0.0 fully release-prepped in `f2` · site waves landed · pending SDK publish)

## The one gate (Scott, ~5 min)
`just release 3.2.0` in `data-sdk-npm` (branch `v3` @ `a9dadb1` — changelog-prepped, incl.
the scc-schema declaration; recipe bumps the version itself, needs his npm auth). Detect:
`npm view steel-compendium-sdk version` → `3.2.0` (still `2.2.0` as of 2026-07-18 20:00).
THEN (autonomous): plan-04 Task 14 in the f2 worktree — swap plugin `package.json`
`"steel-compendium-sdk": "file:../data-sdk-npm"` → `"3.2.0"`, `npm install`, full gates
(baselines: tsc clean · jest **1970** · shots **164/295 PNGs** · obsidian-shots **131**),
live sync smoke vs data-unified release `v4.20260717013458`, `just wt-finish f2` (from the
MAIN checkout — see gotchas), then `just release-data` re-cut.

## State: worktree `f2` (branches pushed to origin as `f2`)
- Plugin `draw-steel-elements` @ **`ffbfec7`**: F2+D6+D8+D7 built (opus SHIP verdicts, 32
  elements) + FOLLOWUPS #24/#26/#27/#28 fixes + 6.0.0 release prep: migration guide
  (`docs/migrating-to-6.md`), sync-era docs corrections, SDK-3.x insert template,
  obsidianmd submission audit CLEAN (manifest/LICENSE PASS, lint wired in-repo), SC-4
  a11y roles, eslint **348 → 3** type-safety waves (survivors documented in-place; zero
  test edits; all 295 shots byte-identical).
- steel-etl-in-f2 @ `310ecef` (FOLLOWUPS #25: md-dse-linked kits regain ds-feature fence).
- Superproject @ `f804491`. Ledger: `worktrees/f2/.superpowers/sdd/progress.md`
  (authoritative build history). Plans 04/16/17/18 stamped BUILT.
- Records: Linear SC-6/SC-3/SC-1/SC-2 (features) + SC-4 — all **Awaiting** the gate;
  SC-11 carries the release-prep trail + exact human release commands
  (`.superpowers/sdd/sc-11-audit-report.md`).

## State: landed to main (NOT deployed — one `just deploy-v2` + `just deploy-api` shows all of it)
- steel-etl main @ **`c139dd4`**: malice bands (381 statblock pages), context-driven
  captain/damage-type cell (restored a parsed-but-never-read `with_captain`), 1,685
  usage-cell glossary links, 36 class-owned back-link pages (+ back-link first-child
  chrome fix, also fixing the older rival-pass duplicate-H1 bug on 13 live pages), SC-86/87
  idiomatic unlink sweep (23 unlinks), treasure extractor fields (SC-13) + scc schema
  declaration, deterministic fbIconAction. ROADMAP #7 done; FOLLOWUPS #7/#8/#15/#18/#23/#29
  all closed (only #2/#3 settings-panel design remain, dormant).
- v2 main @ `6c08c192bb`: compact phone sticky + README screenshots (SC-67).
- Deploy-preview evidence for Scott's yes/no: `.superpowers/sdd/shots-deploy-preview/`
  (9 live-vs-new pairs + 2 fixed shots) + `deploy-preview-report.md` (verdict: recommend).
  Other evidence dirs: `shots-23/` (mobile sticky), `shots-7/` (malice), `shots-67/`
  (READMEs), `shots-sc10/` + `sc-10-decisions.md` (taste multiple-choice, awaiting picks).

## Awaiting Scott (beyond the gate)
Deploy yes/no (evidence above) · SC-10 taste picks (4 decisions, recommendations posted) ·
SC-76 close confirm (30s) · SC-84 zoom-dot recheck · SC-11 release cut after landing.

## Gotchas & lessons (this window)
- **wt-finish/wt-rm (memory: wt-finish-footguns):** devbox swallows recipe exit codes —
  NEVER chain `wt-finish && wt-rm` (lost commits once; redone). Run wt-finish from the
  MAIN checkout only; verify "Landed and pushed" + origin log BEFORE wt-rm. Clean worktree
  churn first (org-site API timestamps, v2 generated docs from local builds).
- `.superpowers/` is gitignored in the worktree superproject — ledger persists on disk only.
- data/ clone does not propagate into worktrees; read fixtures from main checkout or regen.
- v2 CSS hides the injected statblock-page H1 only when h1+hr+card are ADJACENT — any
  page-level insertion before the card breaks it; insert INSIDE the card div (first child).
- Never-fabricate held twice: tier≥2 surge auto-spend (removed); jest `setTooltip` mock
  divergence hid a stale aria-label bug (mock now mirrors production).

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace && git status -sb | head -1
git -C ../worktrees/f2/draw-steel-elements log --oneline -3   # ffbfec7 …
git -C steel-etl log --oneline origin/main -3                  # c139dd4 …
git -C data-sdk-npm log --oneline origin/v3 -1                 # a9dadb1
tail -15 ../worktrees/f2/.superpowers/sdd/progress.md
devbox run -- bash -c 'cd ../worktrees/f2/draw-steel-elements && npx jest 2>&1 | grep Tests:'  # 1970
npm view steel-compendium-sdk version   # 2.2.0 = gate closed; 3.2.0 = run plan-04 Task 14
```
**Resume protocol:** read this + the f2 ledger; verify. If SDK 3.2.0 is live → plan-04
Task 14 → `wt-finish f2` (carefully, see gotchas) → `just release-data`. If Scott said
"deploy" → `just deploy-v2` + `just deploy-api` from the main checkout, then promote the
workspace CHANGELOG Unreleased section and mark SC-86/87 (+ site tickets) Done. Otherwise:
board is clear — gate-watch.

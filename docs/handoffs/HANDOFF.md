# Handoff — 2026-07-18 (DSE 6.0.0 wave BUILD-COMPLETE: F2+D6+D8+D7 in worktree `f2` · pending SDK publish)

## Active efforts
- **F2 + D6 + D8 + D7 — ALL BUILT, IN WORKTREE `f2`, NOT LANDED.** D7 (the final feature
  of the overhaul wave) finished 2026-07-18: plugin branch `f2` at `903fe4a`, worktree
  superproject `c2474d4`, steel-etl at `74d54d0`. Opus whole-branch verdicts: SHIP for all
  four efforts. Gates at tip: tsc · jest **1936** (142 suites) · shots **164** ·
  obsidian-shots **131** · **32 registered elements** (all five D7 elements visually
  verified in real Obsidian, incl. hero-in-sidebar ground truth).
  Records: Linear SC-6 (F2) + SC-3 (D6) + SC-1 (D8) + SC-2 (D7) — all **Awaiting**;
  worktree ledger `worktrees/f2/.superpowers/sdd/progress.md`; plans 04/16/17/18 stamped.
- **Landing gate (Scott, 5 min):** `just release 3.2.0` in `data-sdk-npm` (branch `v3` at
  `057140c`, changelog-prepped; recipe bumps version itself, needs his npm auth). THEN:
  plan-04 Task 14 in the f2 worktree (swap plugin `package.json`
  `"steel-compendium-sdk": "file:../data-sdk-npm"` → `"3.2.0"`, `npm install`, re-run full
  gates — new baselines: jest 1969, shots 164, obsidian-shots 131), live sync smoke vs
  data-unified release
  `v4.20260717013458`, `just wt-finish f2` (from the MAIN checkout), then
  `just release-data` re-cut. Detect gate opening: `npm view steel-compendium-sdk version`
  → `3.2.0` (still `2.2.0` as of 2026-07-18 morning).
- **Autonomy window through 2026-07-19** (memory: fable-autonomy-window): build without
  Scott, self-verify incl. UI; prep-not-run his npm/deploy/release actions.

## You are here
D7 wrapped (plan 18 stamped BUILT-SHIP, Linear SC-2 → Awaiting) AND the FOLLOWUPS
cleanup wave is done: **#24–#28 all fixed+reviewed in the f2 worktree** (plugin now at
`67b1539`, jest **1969**; steel-etl at `310ecef` — md-dse-linked kits regain their
ds-feature fence, 25 heroes kit files change on next regen; superproject `0cc8484`).
Review catches worth knowing: a jest `setTooltip` mock/production divergence hid a stale
aria-label bug (mock now mirrors production); Spend Recovery now gates on
`recoveries_max`. Workspace main `6356672` marks #24–#28 done. Remaining open FOLLOWUPS
(#2/#3/#7/#8/#15/#18/#23) are all v2-site/steel-etl content items — none DSE, none
blocking. The DSE wave is build-complete and review-clean; the only thing left is the
landing gate.

## Cross-repo state (all pushed)
- Worktree f2: plugin `67b1539`, steel-etl `310ecef`, superproject `0cc8484` — D7 = 15
  commits `5c6e33d..903fe4a` (surge-rule fix `74d2401`, sidebar-anchor schema fix
  `161bd45`, sweep `903fe4a`) + FOLLOWUPS wave `80abd63..67b1539`.
- data-sdk-npm v3 `057140c` (3.2.0 changelog-prepped, NOT published — npm latest 2.2.0).
- data-unified `f40b10b8` + release `v4.20260717013458` (contract-verified).
- Workspace main `05b9a8e`: FOLLOWUPS #24–#28 live; `release-data` recipe landed.
- Site fixes wave deployed+Done earlier (SC-66/79/80/81/82/83/84 etc.); SC-84 zoom-dot
  recheck, SC-13/76 confirmations, SC-77, SC-11 release call all await Scott.

## Gotchas & lessons (this window)
- `.superpowers/` is GITIGNORED in the worktree superproject — the ledger persists on disk
  only; plan stamps are the committed record.
- wt-finish must run from the MAIN checkout; it pushes each submodule to its
  .gitmodules-tracked branch (data-sdk-npm → v3, not main).
- data/ clone does not propagate into worktrees; read fixtures from the main checkout.
- Sidebar anchor stamping vs `additionalProperties:false` schemas: fixed framework-wide in
  `prepareModel` (`dataForSchemaValidation`, ANCHOR_KEY single source) — any future
  schema'd persisted element gets this for free.
- Obsidian camera: multi-panel sidebar leaves leak across ground-truth captures — detach
  `dse-sidebar` leaves before each capture (fixed in `903fe4a`); notes-gen needs the
  id→dirname override map for `heroic-resource`/`hero-tokens`.
- Never-fabricate held: a tier≥2 surge auto-spend invented by an implementer was caught in
  review and removed — surges are player-spent only.

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace && git status -sb | head -1   # 05b9a8e clean
git -C ../worktrees/f2/draw-steel-elements log --oneline -3                 # 67b1539 …
git -C ../worktrees/f2 log --oneline -2                                     # 0cc8484 …
tail -12 ../worktrees/f2/.superpowers/sdd/progress.md
devbox run -- bash -c 'cd ../worktrees/f2/draw-steel-elements && npx jest 2>&1 | grep Tests:'  # 1969
npm view steel-compendium-sdk version   # 2.2.0 = gate closed; 3.2.0 = run plan-04 Task 14
```
**Resume protocol:** read this + the f2 ledger; verify. If SDK 3.2.0 is live → plan-04
Task 14 → `wt-finish f2` → `just release-data`. Otherwise continue FOLLOWUPS cleanup in
the f2 worktree under the autonomy window.

# Handoff — 2026-07-18 (F2 + D6 + D8 BUILT pending SDK publish · autonomy window through 07-19)

## Active efforts
- **F2 + D6 + D8 — ALL BUILT, IN WORKTREE `f2`, NOT LANDED.** Plugin branch `f2` at
  `5c6e33d`, steel-etl at `74d54d0`, worktree superproject `64eda94`. Opus whole-branch
  reviews clean for all three. Gates at tip: tsc · jest 1725 · shots 139 ·
  obsidian-shots 110 (incl. sidebar-leaf + by-SCC recursion ground-truth cameras).
  Records: Linear SC-6 (F2) + SC-3 (D6) + SC-1 (D8), worktree ledger
  `worktrees/f2/.superpowers/sdd/progress.md`, plans 04/16/17 status stamps.
- **Landing gate (Scott, 5 min):** `just release 3.2.0` in `data-sdk-npm` (branch `v3`
  at `057140c`, changelog-prepped, build+jest green; recipe bumps version itself, needs
  his npm auth). THEN execute plan 04 Task 14 in the f2 worktree: swap plugin
  `package.json` `"steel-compendium-sdk": "file:../data-sdk-npm"` → `"3.2.0"`,
  `npm install`, re-run gates (tsc / jest 1292 / shots 64 / obsidian-shots 48), live
  sync smoke vs data-unified release `v4.20260717013458`, then `just wt-finish f2`.
- **Autonomy window through 2026-07-19** (memory: fable-autonomy-window): Scott
  delegated — build without him, self-verify incl. UI; prep-not-run his npm/deploy/release
  actions. Next build target: **D6** (spec `D6-compendium-reference-spec.md`) — build ON
  the f2 branch (it consumes SccResolver/sync), i.e. keep working in worktree `f2`.

## You are here
F2 + D6 + D8 done + verified. Next: D7 planning (spec `D7-hero-suite-spec.md`; consumes
D8's sidebar host + D5 rolling + D6 references) — build in the SAME f2 worktree/branch.
NOTE: npm latest for steel-compendium-sdk is still 2.2.0 — the 3.x line was NEVER
published; Scott's `just release 3.2.0` is the first 3.x publish. After publish: plan-04
Task 14 (swap plugin pin file:→3.2.0, npm install, full gates), `wt-finish f2`, then
`just release-data` re-cut from main checkout (publishes the D6 md-dse kit fix).

## Cross-repo state (all pushed)
- OD-2 landed: `just release-data` recipe on workspace main (`1be882c`); data-unified
  `f40b10b8` (has ds-sb/ds-fb); first release `v4.20260717013458` cut + contract-verified.
- OD-5 prepped: SDK v3 `057140c` (3.2.0 changelog + backfilled 3.0.0 entry).
- Site fixes wave done earlier: SC-66/79/80/81/82/83/84 deployed+Done (SC-84 awaiting
  Scott's zoom-dot recheck); SC-68/12/75 Done; SC-13/76 await Scott's confirmation.

## Verified state (2026-07-17)
- Workspace main clean/pushed; f2 worktree: plugin `dbfef73`, superproject `71b9202`,
  clean trees. Gates at `dbfef73`: tsc 0 · jest 93/1292 · shots 64/64 · obsidian-shots
  48/48.
- data-sdk-npm npm publish NOT run (package.json still says 3.1.0 until Scott releases).

## Gotchas & lessons (this window)
- data/ clone does NOT propagate into worktrees (empty there); read fixtures from the
  main checkout read-only, or regen locally.
- `.superpowers/sdd/` in the MAIN workspace is shared scratch — collides across efforts
  (a stale D2-era task-9 report was found there). Worktree-local ledger is authoritative.
- wt-finish must run from the MAIN checkout (recipe resolves ../worktrees/<name>); it
  pushes each submodule to its .gitmodules-tracked branch (data-sdk-npm → v3, not main).
- One implementer subagent died mid-flight (API error) — work was already committed;
  ledger + git log recovered it. File-first discipline works; keep it.
- plan 04's task headings had `---### Task N` typos — fixed in the worktree copy only.

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace && git status -sb | head -1
git -C ../worktrees/f2/draw-steel-elements log --oneline -3   # dbfef73 …
cat ../worktrees/f2/.superpowers/sdd/progress.md | tail -6
git -C data-sdk-npm log --oneline -1                          # 057140c
gh release view --repo SteelCompendium/data-unified --json tagName -q .tagName  # v4.20260717013458
devbox run -- bash -c 'cd ../worktrees/f2/draw-steel-elements && npx jest 2>&1 | grep Tests:'  # 1292
```
**Resume protocol:** read this + Linear SC-6 + the f2 ledger; verify; if Scott has
published SDK 3.2.0 (npm view steel-compendium-sdk version → 3.2.0), run Task 14 then
wt-finish f2. Otherwise continue D6 in the f2 worktree under the autonomy window.

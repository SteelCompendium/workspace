# SC-297 round 8 brief — re-rebase onto current mains + one comment fix + full gates

You are the SC-297 implementation worker (rounds 2, 2b, 4, 6). **You never call the tracker.**

## 1. Context

- Ledger `decisions.md` → "Round 7" (verdict APPROVE; the LOW and INFO; owner rulings).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. Verify `pwd`
  before any write; never write under `/home/scott/code/steelCompendium/workspace/`. Start:
  `v2` @ `27a021adbf`; superproject @ `117911b7`.

## 2. Task

1. **Fold the round-7 LOW** (reviewer's words, verbatim): *"`v2/docs/stylesheets/steel-statblock.css:60`:
   the comment claims `grep -rl 'sb-backlink' docs/Browse/` "matches only the three minion
   pages"; measured it matches **53** files. Only the line-start sibling form matches 3. The
   rule is correctly scoped and the round-6 commit message states the distinction correctly —
   comment drift only."* Fix the comment to state the sibling-form grep
   (`grep -rlE '^<p class="sb-backlink">'`) and the 3-page result. Commit in `v2`.
2. **Re-rebase.** In `v2`: `git fetch origin`; report `origin/main`'s sha (expected at or
   beyond `e2b6a9727621`, SC-300); `git rebase origin/main`. The reviewer pre-analyzed SC-300:
   its `sc-pins.js` hunks are in `mountLinkForm()` (ours are in `mountPinButton()`), its
   `steel-pins.css` change appends at line 94+ (ours edit lines 1-40) — expect zero conflicts;
   if any occur, resolve keeping both, and list every hunk. Then in the worktree superproject:
   `git fetch origin`; report `origin/main` (expected at or beyond `021cf25ac702`);
   `git rebase origin/main`; resolve the `v2` pointer to this branch's rebased tip at every
   replayed commit, any `DESIGN.md`/`CHANGELOG.md` conflicts as in round 6; then
   `git submodule update --init` for every non-`v2` submodule and report any pin that moved.
   `git add` only `v2`.
3. **Full gates on the rebased branch:** unit (expected ≥86, 0 fail — SC-300 may add tests);
   original e2e (6/8 with the same two pre-existing); SC-177's two e2e files and **SC-300's
   `tests/e2e/pins-layout.e2e.cjs`** (with `E2E_BASE`/`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` per
   `.repo-docs/development.md`); `chrome-panel.e2e.cjs` 245/245; `page-titles.e2e.cjs` 9/9.
   Pin flow once more on the merged code (pin from plate → `/pins/` → unpin) and confirm
   SC-300's compact My Table layout renders (one screenshot `sc297-r8-pinboard.png`).
4. Report `git log --oneline origin/main..HEAD` for both repos, both final shas, every pin.

## 3. Footguns

Devbox wrapper form; never pipe a gate through `tail`; per-run unique logs; foreground builds
with output redirected; no `devbox run` from inside `v2/`; never `git checkout -- .` in v2;
never push; on a bad rebase `git rebase --abort` and end with `STATUS: NEEDS_CONTEXT`. Leave
the main checkout's `AGENTS.md` dirt alone. You cannot message me.

## 4. Report and return

Append "## Round 8" to `sc297-round2-report.md` (refresh the executive summary). Return raw
facts: both `origin/main` shas rebased onto, conflict hunks (or "zero"), both final shas,
every gate count, pins moved, the pinboard shot path.

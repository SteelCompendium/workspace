# SC-651 r4 implementer report (rebase + battery + superproject shape)

## Summary
- Verdict: DONE. dse rebased onto develop `ad21dc87` (FETCH_HEAD was exactly that): `9e465377` (fix + 3 jsdom), `fcc7278e` (SET-D16 plain). No conflicts; `package*.json` unchanged cefa9ca8..ad21dc87, so no `npm ci`.
- Superproject on `origin/main` `63843336`: `b58ec168` (CHANGELOG, wording unchanged from aacf5adb) + `77165646` (ONE bump to `fcc7278e`). `log origin/main..HEAD` = exactly these 2; `ls-tree HEAD draw-steel-elements` = `fcc7278e9fba...`; `status --porcelain` empty. Old bump 913984ab dropped. Nothing pushed.
- tsc (incl. -p e2e) RC 0, lint RC 0. jest 13406 passed / 2 skipped / 0 failed (fresh).
- Lifecycle 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed, no re-runs.
- e2e full: `613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (second run; see below).
- styles.css sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` for both a clean `ad21dc87` export build and the rebased head; src diff vs ad21dc87 is only SettingsTab.ts Preset handler + e2e spec + jsdom test, so shots/freeze/parity carry (skipped).

## Details
- Rebase: `git rebase FETCH_HEAD` clean, 2 commits replayed. `git diff --stat ad21dc87 HEAD`: dropdowns.e2e.ts (+4/-4), SettingsTab.ts (+8/-1), settings-matrix.test.ts (+53).
- e2e first full run: `610/622 ok, 3 failed, 9 known-bug, coverage: 415/417` -- failures INIT-W10 (Expected 1 / Received 0; SC-654), SET-X03 (picker filter timeout; SC-657), SET-X04 (data.json differs, consequence of X03; SC-657): all brief-listed known flakes. Full re-run (log `sc651r4-e2e-rerun.log`) passed everything: 613/622, 0 failed. SET-D16 ok both times.
- Lifecycle: no flakes (G-S91, G-S97, G-S115 ok first time); plugin worktree git status clean afterward.
- Superproject mechanics: `reset --soft HEAD~1` + `restore --staged draw-steel-elements`, `rebase origin/main` clean (no CHANGELOG conflict), submodule HEAD stayed `fcc7278e`, then one `git add draw-steel-elements` bump commit.

Drive-by fixes: none. Follow-ups: none new (SC-664 already filed).

## Artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r4-impl/`: `sc651r4-tsc.log`, `sc651r4-lint.log`, `sc651r4-jest.log`, `sc651r4-e2e.log` (first run, 3 flakes), `sc651r4-e2e-rerun.log` (613/622), `sc651r4-base-build.log`, `sc651r4-base-export/styles.css`, `sc651r4-lc-part1.log` .. `sc651r4-lc-part7.log`.

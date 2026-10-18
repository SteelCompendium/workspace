# SC-408 landing round L1: report

**Executive summary**
1. Verdict: READY to `wt-finish` (nothing pushed). Both worktrees `git status --porcelain` empty.
2. New DSE head `1640ed0` (27 commits on `origin/develop` `7982deb`); `merge-base --is-ancestor origin/develop sc408-functest` = yes (FF-landable).
3. Superproject head `bf45f82` (merge of `origin/main` `f3dcced` into the branch; pointer-bump commit `b1dd4df` beneath it). `git ls-tree HEAD draw-steel-elements` = `1640ed0`; `git diff origin/main HEAD --stat` lists only PROJECT.md, SKILL.md, `draw-steel-elements`.
4. Range-diff `e9502a8..713b992` vs `7982deb..HEAD`: 27 of 27 commits `=` (no `!`/`<`/`>`); lock rebase was conflict-free; lock: 763 upstream packages, 0 changed/removed (only the root entry gained the e2e devDeps; 1148 total). No collision with SC-423 (it touches initiative repaintTurn/CSS/shoots; the branch's control-id stamping is in framework/kit + StaminaEditModal); nothing to merge by hand.
5. Gates (all read via a script file; rc 0): tsc incl. `-p e2e` clean; lint clean; jest **4725 passed / 1 skipped / 226 of 227 suites** (= 4721 + SC-423's 4, so no scratch-worktree jest needed); lifecycle **25/25** (port 9308); e2e **59/71 ok, 0 failed, 12 known-bug, coverage 47/47 pairs** x3 (`--shards=4`, ~32-33 s spec time each); shots **572**, 0 FAIL, `portrait mark parity OK (… 6 comparisons …)` present; freeze **276/276**; docs-shots initiative-tracker.gif `stable`; parity LAST **0 / 0 / 24**.
6. No count moved, so no AGENTS.md / e2e/README.md edit. No Claude/AI attribution in any commit.

## Conflict resolutions
- DSE: none (clean rebase, lock included).
- Superproject, `origin/main` merge: `.claude/orchestrate/PROJECT.md` auto-merged (branch: lifecycle+e2e required-to-land text in section 4; main's side kept intact). `.claude/skills/dse-verify/SKILL.md` conflicted in "Current expected numbers" only: branch side was the `CURRENT — dse sc408-functest … not yet landed` block; main side the SC-423 `CURRENT — dse develop @ 566888a + sc423-portrait-frame @ f3585f0` block. Kept both: new block `**CURRENT — dse \`develop\` @ \`1640ed0\` (2026-10-18; SC-408 landed — functional e2e pilot, e2e now required to land):**` with the measured numbers above, then main's SC-423 block verbatim with only its header word CURRENT -> PREVIOUS. No block says "not yet landed" / "F1 and F2".
- `origin/main` moved twice during the round (`7c424e8` -> `e9eff71` -> `f3dcced`, docs/changelog only); I aborted the first merge attempt and re-merged on `f3dcced`. If it moves again, re-run `git fetch && git merge origin/main` (docs-only, expected clean).
- Worktree submodules `data-sdk-npm`, `steel-etl`, `steelCompendium.github.io`, `v2` were checked out at stale pins (read as ` M`, which would abort `wt-finish`); I fast-forwarded their `sc408-functest` branches to the gitlink pins (each 0 commits ahead of its tracked origin branch, so `wt-finish` pushes only DSE `sc408-functest:develop`, 27 commits; `.gitmodules` branch for DSE = `develop`).

## Artifacts
- Range-diff: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-land1-range-diff.txt`
- Gate logs/rcs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/g/` (tsc, lint, jest, lifecycle, e2e1-3, shots, freeze.log, docs, parity)

Drive-by fixes: none. Follow-ups: none new (landing steps remain: copy ledger+reports to `docs/superpowers/dse-overhaul/build-ledgers/`, `just wt-rm sc408-jsdom`).

# SC-408 landing round L1: rebase onto the moved develop and main, re-run the battery

Scott ruled, in-session, 2026-10-18, verbatim: "land it". The ticket owner lands right after this
round. Your job is to make both branches fast-forward-landable and prove the gates on the result.
No product or test changes beyond what a rebase forces.

## 0. Context

1. Read the ledger `decisions.md` (this dir): "Scott's rulings", then the entries from "R3b" to the
   newest, "Scott in-session: 'land it'". Skim `sc408-fix3-report.md`'s summary for the last numbers.
2. DSE worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `713b992`, sitting on `e9502a8`. `origin/develop` is now `7982deb`
   (SC-423: 10 commits touching initiative `repaintTurn` / `data-pressed`, the acted-frame CSS, a new
   shots gate `assertPortraitMarkParity`, `docs/` initiative GIF, CHANGELOG).
3. Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest`, branch
   `sc408-functest`, head `04545a1`, forked from main at `4fcffbc`. `origin/main` is `7c424e8`. The
   branch only touches `.claude/skills/dse-verify/SKILL.md` and `.claude/orchestrate/PROJECT.md`;
   main has edited both since the fork. The worktree also carries an UNCOMMITTED submodule pointer.
4. Workers never call the tracker. Never touch the main checkout
   `/home/scott/code/steelCompendium/workspace` (shared state; Scott's live vault is in it).

## 1. Task

1. **DSE rebase.** `git fetch origin`, then rebase `sc408-functest` onto `origin/develop`. Resolve
   `package-lock.json` the same way as the two earlier rebases (take develop's lock, re-add only the
   e2e devDeps with `npm install`), and confirm no package that exists at `7982deb` changed version,
   integrity or flags. Save `git range-diff e9502a8..713b992 7982deb..HEAD` to a file and report
   any commit whose substance changed. If SC-423's commits collide with the control-id stamping in
   `src/features/initiative*` or elsewhere, keep both behaviours and say exactly what you did.
2. **Superproject.** In this order, so the gitlink merges as a fast-forward:
   a. Commit the pointer bump: `git add draw-steel-elements && git commit -m "chore: bump
      draw-steel-elements to <new short sha> (SC-408: functional e2e test pilot; e2e required to land)"`.
   b. `git fetch origin && git merge origin/main`. Resolve `SKILL.md` and `PROJECT.md` by keeping
      every addition from both sides. Confirm `git ls-tree HEAD draw-steel-elements` is your new DSE
      sha and that no other submodule pin differs from `origin/main`
      (`git diff origin/main HEAD --stat` must list only the two docs files and `draw-steel-elements`).
   c. In `SKILL.md` "Current expected numbers", write the post-landing block:
      `**CURRENT — dse \`develop\` @ \`<new sha>\` (2026-10-18; SC-408 landed — functional e2e pilot, e2e now required to land):**`
      with the numbers you measure in step 3, and demote main's SC-423 CURRENT block to
      `**PREVIOUS — …**` unchanged. No block may still say "not yet landed" or "F1 and F2".
3. **Battery** on the rebased DSE head, in dse-verify order (read the merged `SKILL.md`, including
   "THE exit-code footgun": read gate exit codes through a script file, never an echoed `$?` inside
   `bash -c`). `rm -f main.js styles.css` before jest; lifecycle on `DSE_LIFECYCLE_PORT=9308`.
   Expected:
   - tsc (incl. `tsc -p e2e`) and lint clean.
   - jest: 4721 passed / 1 skipped / 226 of 227 at the old base, plus SC-423's added tests (main's
     skill says SC-423 added 4). If the passed count is not exactly 4721 + SC-423's additions, run
     jest at `7982deb` in a scratch worktree under your scratch dir (remove it after) and explain
     the difference.
   - lifecycle 25/25.
   - `npm run e2e` three full runs at `--shards=4`: `59/71 ok, 0 failed, 12 known-bug, coverage:
     47/47 pairs` each.
   - shots 572, 0 FAIL, and the in-run line `portrait mark parity OK` present.
   - freeze `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/visual-harness/shots` → 276/276.
   - `npm run docs-shots -- --only=initiative-tracker.gif --check-stable` → `stable`.
   - parity LAST → 0 / 0 / 24.
   If any count moves, update the DSE `AGENTS.md` / `e2e/README.md` numbers that state it and commit.
4. Commit the SKILL.md block in the superproject worktree. No push. No Claude/AI attribution in any
   commit message. Both worktrees end `git status --porcelain` empty (move any scratch out).

Never `--headed` on DISPLAY `:1`. Kill only PIDs you spawned.

## 2. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-land1-report.md`, opening with
an executive summary of at most 10 lines: verdict (ready to `wt-finish` or blocked), the new DSE sha,
the superproject head sha, `merge-base --is-ancestor origin/develop sc408-functest` result, the
range-diff result, every gate number. Then the conflict resolutions (file, what each side added,
what you kept) and the absolute path of the range-diff file.

Return contract: your final text goes to the ticket owner, not a human. Give raw facts, shas, numbers
and the absolute path of every artifact. If the report write is blocked, return it inline. Redirect
long output to files. Run gates in the foreground; never background a job and wait for a
notification. Never key a wait on a scratch filename. You cannot message me; if you need input, end
with `STATUS: NEEDS_CONTEXT` and the question.

# SC-184 — pre-landing rebase + full battery (brief)

Owner: Fable ticket-owner, session 4931eaaf. Worker: orchestration:implementer.

## 0. Rules that apply to you

- You NEVER call the tracker (Linear) — not to read history, not to post. Everything you
  need is in files. Your final text goes to the ticket-owner, not a human.
- You cannot `SendMessage` me. A depth-2 agent cannot address its parent, and `to: "main"`
  routes to the TOP-LEVEL dispatcher, not me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do
  send a message anyway, its FIRST WORD must be `SC-184:`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Never background a gate and "wait for the notification"; run gates in
  the foreground with output redirected to a file, then read the file.
- If the report-file write is blocked by your harness, return the report inline.
- Devbox: Go/Node/Python/just are NOT on PATH. Always wrap:
  `devbox run -- bash -c 'cd <repo> && <cmd>'`. Devbox's `sh` wrapper eats `$?` /
  `$PIPESTATUS`, and piping a gate (`| tail`) eats failures — run gates via wrapper script
  files that capture the exit code, or bare commands with output redirected to files.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/decisions.md`
  (read it; the last two sections are the current ruling). Prior reports in the same dir:
  `sc184-impl-report.md`, `sc184-review-report.md`, `sc184-fixround-report.md`,
  `sc184-rereview-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc184-sidebar-investigation`.
  The plugin repo is `<worktree>/draw-steel-elements`, on branch `sc184-sidebar-investigation`
  @ `51ba4e8` (10 commits ahead of its base `1619396`). **Verify `pwd` before any write.**
  Never touch `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except
  to read the ledger dir and the `dse-verify` skill.
- Scott has APPROVED the branch as-is (ledger, 2026-08-29: "approved"). **You change no
  code, no tests, no docs.** This round is purely: rebase, re-verify, report.
- `origin/develop` has moved from `1619396` to **`778a341`** (SC-195 landed). Files SC-195
  touched that this branch also touches: `CHANGELOG.md`, `docs/initiative-tracker.md`,
  `styles-source.css`. A `git merge-tree` probe on 2026-08-29 predicted zero conflicts.
- The freeze baseline (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`)
  is 210 lines and SC-195 did not change it. Do NOT edit it.
- `package.json`'s obsidian version did not change between `1619396` and `778a341`, so
  `npm ci` is not expected to be needed; run it only if `package-lock.json` differs
  between those two shas (`git diff 1619396 778a341 --stat -- package-lock.json`).

## 2. Task

1. In `<worktree>/draw-steel-elements`: `git fetch origin` (inside THIS clone — worktree
   submodule clones have independent refs), confirm `git rev-parse origin/develop` is
   `778a341556be69bd5c885a1bdd1da2bb5d91db0c`, then `git rebase origin/develop`.
   - If a conflict appears: resolve it keeping BOTH sides' intent (SC-195's captain minion
     pool changes and SC-184's sidebar changes are disjoint features; a CHANGELOG conflict
     is two bullets under the same heading — keep both). Record every conflicted file and
     how you resolved it in the report. If a conflict is anything other than trivially
     additive, STOP with `STATUS: NEEDS_CONTEXT` and describe it.
   - Do not squash, reorder, or reword commits. The 10 commits must land as the same 10.
2. After the rebase, `git log --oneline origin/develop..HEAD` must show exactly 10 commits,
   and `git diff 51ba4e8 HEAD --stat -- . ':!CHANGELOG.md' ':!docs/initiative-tracker.md' ':!styles-source.css'`
   should be exactly the SC-195 delta (i.e. the branch's own content did not change). Report
   the new HEAD sha.
3. Run the FULL battery per the `dse-verify` skill
   (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) in its
   order: tsc, lint, jest, shots, freeze check, parity LAST, then obsidian-shots (a display
   was available on the last run, so it should be here too; if it is not, say so and skip).
   Read the skill for exact command shapes and the `host-copy pin PARTIAL` note (expected,
   not a failure).
4. Superproject probe only (NO rebase, NO commit — the dispatcher's landing skill owns the
   superproject): in `<worktree>` (the superproject), `git fetch origin` and run
   `git merge-tree $(git merge-base origin/main HEAD) origin/main HEAD` restricted to
   reading whether `CHANGELOG.md` conflicts. Report "clean" or the conflict hunk. Do not
   modify anything in the superproject.

## 3. Gates — expected numbers

Measured on this branch at `44158f7` (before rebase): jest **3417 passed / 1 skipped / 190
suites**; shots **474 PNGs, 0 FAIL**; freeze **210/210, 0 mismatches**; parity **0 GAPs / 0
undeclared / 16 DECLARED**; obsidian-shots **59/59**. SC-195 added tests, so the jest
passed count and suite count may rise; **any passed count below 3417, any suite below 190,
any shot FAIL, any freeze mismatch, or any parity GAP/undeclared is a red — report it as
such, do not "fix" it.** Footgun: a stale superproject pin can fail
`token-coverage.test.ts` via a stale `D3-token-map.md` copy — diagnose by comparing the
worktree's copy against the main checkout's before believing that failure, and clear it
with the test's `DSE_TOKEN_MAP_PATH` override pointed at the main checkout's copy.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-report.md`.
It MUST open with a ≤10-line executive summary: verdict (LAND-READY / RED / NEEDS_CONTEXT),
old sha → new sha, base sha, conflicts (none / list), each gate's measured number vs
expected, superproject CHANGELOG probe result. Details below the summary. Redirect gate
output to per-run files in that dir named `sc184-rebase-<gate>.log`.

## 5. Return contract

Your final text is for the ticket-owner: raw facts only — verdict, old/new/base shas,
conflicted files + resolution, each measured gate number, the superproject probe result,
and the absolute path of the report file and every log file. No prose, no recap.

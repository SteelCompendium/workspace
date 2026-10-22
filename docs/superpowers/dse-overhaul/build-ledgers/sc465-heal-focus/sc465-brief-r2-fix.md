# SC-465 r2 fix brief (implementer A) — three small folds from the r1 review

Your final text goes to the ticket-owner, not a human. Workers never call the tracker.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-decisions.md` (r1 review rulings at the bottom).
- Review report: `sc465-r1-review-report.md` in that dir (verdict APPROVE).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus`, branch `sc465-heal-focus`. Your head: dse `7f83724` on `e4c5cf6`; superproject `7671c43` on `6bf71ca`. First `git -C <abs path> fetch origin` in both; if `origin/develop` (dse) or `origin/main` (superproject) moved, rebase onto it and say so.
- Workspace-level files live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc465-heal-focus/CHANGELOG.md`), never under `/home/scott/code/steelCompendium/workspace/`.

## Task (the folds, findings verbatim from the review)

1. **LOW-1** `CHANGELOG.md:11-15`: "the bullet only mentions 'heal to full'. The fix also covers spending the last Recovery below max, which used to drop focus to body (probe B07). Optional clause to add." -> Add it. Keep the bullet plain and short.
2. **LOW-2** `test/dom/views/stamina-edit-modal.test.ts:1449`: "`const kill = btn(content, 'Full Heal')`. Rename to `fullHeal`."
3. **INFO-5** `test/dom/views/stamina-edit-modal.test.ts:1457`: "the helper's unit test leaves its root div in `document.body`." -> Remove it after the test (in the test or an afterEach), matching the file's existing cleanup pattern.

OUT OF SCOPE: SC-495 (kit stepper focus, and hardening the helper's `[tabindex]` selector). No source changes in `src/`.

Commit in dse (one commit for the test edits) and in the superproject (amend nothing; a new commit for the CHANGELOG). No pushes, no tags, no AI attribution trailers.

## Gates

Expected: tsc (+ `tsc -p e2e`) and lint clean; jest **5717 passed / 1 skipped / 238 of 239 suites**; full e2e **`104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** (required to land every dse change). Lifecycle/shots/freeze/parity: not needed (test-only + docs delta) unless you rebased onto a moved develop — then run the whole battery (lifecycle 31/31, shots 580, freeze 280/280, parity 0/0/24).

Footguns (mandatory): `devbox run -c /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements -- bash <script file>`; no `cd` in compound commands; exit codes recorded inside a script file; each gate one blocking foreground Bash call, no background jobs or Monitor; logs to files; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r2-fix-A/` with unique names, written with the Write tool; no glob `rm`; never `pkill` by pattern; `git -C <abs path>` always. Never key a wait-loop on a scratch filename or contents.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-r2-fix-report.md`, opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## Return contract

Raw facts: STATUS, dse sha + base, superproject sha + base, each gate summary line, absolute paths of the report and logs. You cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. Any message you send anyway starts with `SC-465:`.

# SC-465 r3 rebase brief (implementer A) — rebase onto dse develop c0e761b, full battery

Your final text goes to the ticket-owner, not a human. Workers never call the tracker.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-decisions.md` (bottom entries).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc465-heal-focus`, branch `sc465-heal-focus` everywhere. Your current heads: dse `ad52688` (adb0684, 7f83724, ad52688) on `e4c5cf6`; superproject `4a90f63` (dcca8c5, 4a90f63) on `acaa6f4`.
- dse `origin/develop` moved `e4c5cf6` -> **`c0e761b`** (SC-279: roll strip UX across 16 files incl. `visual-harness/entry.ts` and `shoot.mjs`; 12 new shots; 2 roll print lines rebaselined in the shared freeze baseline — a branch older than c0e761b reads 2 roll mismatches, yours must read 0).
- Workspace-level files live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc465-heal-focus/CHANGELOG.md`), never under `/home/scott/code/steelCompendium/workspace/`.
- Scott's live-vault dirt in the main checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected; ignore it.

## Task

1. `git -C /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements fetch origin`; confirm `origin/develop` = `c0e761b` (if newer, rebase onto the newer one and say so). Rebase your three commits onto it. Report every conflict and how you resolved it (file:hunk). Do not change behaviour while resolving.
2. `git -C /home/scott/code/steelCompendium/worktrees/sc465-heal-focus fetch origin`; rebase the superproject branch onto current `origin/main`. On a CHANGELOG `## Unreleased` conflict keep both bullets, ours first.
3. `npm ci` if `package.json` / lockfile changed in the range (check `git diff --stat e4c5cf6 c0e761b -- package.json package-lock.json`).
4. Run the whole battery once on the final head.
5. No pushes, no tags, no AI attribution trailers.

## Gates — expected on c0e761b + this branch

tsc (+ `tsc -p e2e`) and lint clean · jest **5743 passed / 1 skipped / 238 of 239 suites** (5737 + your 6) · lifecycle **31/31 ok, 0 failed** · e2e **`104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL, no ALLOWLISTED line · freeze **`freeze OK (280/280 …)`** (0 FAILED; if it reports mismatches, STOP and report — do not touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Footguns (mandatory): `devbox run -c /home/scott/code/steelCompendium/worktrees/sc465-heal-focus/draw-steel-elements -- bash <script file>`; no `cd` in compound commands; exit codes recorded inside a script file; each gate ONE blocking foreground Bash call (lifecycle, e2e, shots, freeze, parity separately), no `run_in_background`, no Monitor; long output to log files; private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r3-rebase-A/` with unique names, written with the Write tool; no glob `rm`; never `rm -rf` a shared `/tmp` glob or `.superpowers/`; never `pkill` by pattern (only verified-own PIDs: `pgrep -af "worktrees/sc465-heal-focus/"` or `readlink /proc/<pid>/cwd`); `git -C <abs path>` always; `DSE_LIFECYCLE_PORT=9291`. Never key a wait-loop on a scratch filename or its contents.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc465-heal-focus/sc465-r3-rebase-report.md`, ≤10-line executive summary first (shas + bases, conflicts yes/no, gate lines). If blocked, inline.

## Return contract

Raw facts: STATUS, dse sha + base + new commit list, superproject sha + base, conflicts (file + resolution), each gate's summary line, absolute paths of report and logs. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you send anyway starts with `SC-465:`.

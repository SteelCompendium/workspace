# SC-466 r3 rebase brief (implementer A, resumed)

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/decisions.md` (latest entries: dispatcher develop move + r3 ruling).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults`. Plugin branch `sc466-stamina-bar-defaults` is at `0c5022e` (5 commits on `0ce76dd`). Superproject worktree branch is at `52a22fa` (CHANGELOG commit).
- Wait condition: before rebasing, confirm `git -C <plugin repo> status --porcelain` is empty AND no process has `worktrees/sc466-stamina-bar-defaults/` in its command line (`pgrep -af "worktrees/sc466-stamina-bar-defaults/"`). The reviewer may still be finishing targeted jest there. If either is not clear, end with STATUS: NEEDS_CONTEXT, and do not wait in a loop.
- Workers never call the tracker. Scott's live-vault dirt in the main checkout is expected.

## 2. The task

1. `git -C …/draw-steel-elements fetch origin`, confirm `origin/develop` is `1c271b5` (or newer — if newer, use it and say so), `git -C …/draw-steel-elements rebase origin/develop`.
2. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults fetch origin`, confirm `origin/main` is `7e48d25` (or newer), rebase the worktree's superproject branch onto it. The unstaged ` M draw-steel-elements` pointer is expected — stash it or leave it as git allows, but do not commit a pointer bump (wt-finish does that). Keep the CHANGELOG bullet under `## Unreleased`; resolve CHANGELOG conflicts by keeping both sides' bullets.
3. If `package.json`'s obsidian version or deps changed across the rebase, `npm ci` first.
4. Report EVERY conflict: file, and whether you resolved it by hand. A hand resolution in `src/` or `test/` triggers a scoped review; say exactly what you chose.
5. Full dse-verify battery, in order.

## 3. Gates — expected at 1c271b5 + this branch

tsc (incl. `tsc -p e2e`) and lint clean · jest **5446 passed / 1 skipped / 232 of 233** (5428 base + our 18; after a shots run) · lifecycle **30/30** · e2e **89/93 ok, 0 failed, 4 known-bug, coverage 64/64** · shots **572**, 0 FAIL · freeze **276/276** (any delta = STOP and report) · parity **0 / 0 / 24 DECLARED**.

Exit codes: script files run with `devbox run -c /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements -- bash <abs script>`, writing their own rc file; numbers from the logs' summary lines. Private scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r3-impl-a1/`.

Run rules (unchanged): one gate per Bash call; no compound `cd`; `rm -f main.js styles.css` before jest; Write tool for scratch files; no glob `rm`; `DSE_LIFECYCLE_PORT=9293`; PID-only kills of processes whose command line contains `worktrees/sc466-stamina-bar-defaults/`; never `rm -rf /tmp/dse-obsidian-lifecycle-*` or anything under `.superpowers/`; never `--headed`/`DISPLAY=:1`; output to files; foreground gates; never key a wait-loop on a scratch filename or its contents; `git -C` everywhere; no tags/pushes; no AI attribution.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/sc466-r3-rebase-report.md`, ≤10-line executive summary first (new plugin sha, new superproject sha, conflicts y/n, gate numbers, e2e run id). If the write is blocked, return it inline.

## 5. Return contract

Raw facts: STATUS, shas, conflicts, measured numbers, artifact paths. You cannot `SendMessage` me; need input → STATUS: NEEDS_CONTEXT. If you message anyway, first word `SC-466:`.

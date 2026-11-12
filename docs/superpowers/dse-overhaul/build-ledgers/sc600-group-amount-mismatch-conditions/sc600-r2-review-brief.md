# SC-600 r2 — independent review brief (reviewer)

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc600-group-amount-mismatch-conditions/decisions.md` (ledger: Scott's ruling + code facts), then the r1 implementation brief `sc600-r1-impl-brief.md` and report `sc600-r1-impl-report.md` in the same dir.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions`; plugin at `…/draw-steel-elements/` on branch `sc600-group-amount-mismatch-conditions`. The diff under review is `git -C <worktree>/draw-steel-elements diff dcc53f0f..HEAD` plus the superproject changelog commit (`git -C <worktree> log -3`). Review at head sha `1116e06d`.
- You are reviewing; you do NOT fix. Do not commit to the branch. Scratch probes go in your own private dir (below) or a throwaway test file you delete (by literal path) before you finish; `git -C … status` must be clean when you return.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. The task

Scott's ruling, verbatim from the ledger: **"A"** —

> **A. Keep and adjust (recommended).** Keep the existing instances as they are. If `amount` goes up, add new instances at the end (full stamina, no conditions). If `amount` goes down, remove instances from the end of the list. Only the removed instances lose their state.

> This applies the same way to squad minions (which only keep conditions per minion; their shared stamina pool is not touched by this change) and to regular creatures and captains.

Adversarial review. **Execute and probe, do not just read.** At minimum:
- Run probes (jest scratch tests or a node script against the built model) for: grow/shrink on minion, regular and captain; non-sequential ids; duplicate ids in the input; non-numeric id beyond the trim point vs inside it; `amount: 0`; `instances: []` with amount 3; `instances` not an array; a statblock-sourced creature (max_stamina unset at parse, filled later by `resolveRefs`) that grows — do appended instances get the right stamina after the merge?; multi-squad groups (per-creature pools) — pool untouched; captain bonus reconciliation still correct after a minion count change.
- **Integrity probes (this writes into user notes):** round-trip a block where one group's amount was hand-edited: other groups byte-identical; kept instances keep conditions (incl. SC-592 plain-name format) and stamina; content above/below the block survives; two blocks in one note don't cross-talk; a second re-trigger (edit amount again) behaves.
- Check every other site that rebuilds instances on a length mismatch (`git grep -n "instances.length"` across `src/`, incl. `src/drawSteelAdmonition/EncounterData.ts` and any oracle/parity test comparing it to `model.ts`) — was each handled or correctly left alone?
- Check the e2e scenario actually exercises the hand-edit → UI save path in real Obsidian and would FAIL on `dcc53f0f` (if feasible, prove it by running the new scenario against the base). Check its title has no bracketed ticket id.
- Re-run tsc, lint, jest, and the e2e gate yourself (per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, read in parts). Expected at `dcc53f0f`: jest 10787 passed / 2 skipped fresh (+ the new tests); e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` plus the new scenario(s). Lifecycle/shots/freeze/parity: re-run only if the diff touches anything beyond the model, tests and e2e (state which you ran).
- Changelog bullet: in the worktree's superproject `CHANGELOG.md` under `## Unreleased`, plain and accurate.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc600-group-amount-mismatch-conditions/sc600-r2-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix for each.

## 4. Return contract

Final text to the ticket-owner, not a human: verdict, reviewed head sha, findings list (severity, file:line, one line each), measured gate numbers, absolute paths of the report and every probe/log artifact. No prose.

## 5. Footguns

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- Run every gate as one blocking FOREGROUND call; no `run_in_background`, no Monitor, no waiting for notifications.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command; record exit codes inside a script FILE and read each gate's summary line (devbox eats `$?`, `| tail` eats failures).
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r2-review/`, uniquely named files, created with the Write tool.
- `git -C <absolute path>` for every git command.
- **Never `rm -rf` a glob, especially a `/tmp` glob** (other efforts' lifecycle vaults and kept FAIL dirs live there). Delete only literal paths you created. No `rm` with a shell-variable target. Never `rm -rf` under `.superpowers/`. Never touch the freeze baseline.
- Never `pkill`/`killall` by pattern; kill only by PID inside YOUR worktree (`readlink /proc/<pid>/cwd`).
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you send anyway must start with `SC-600:`.

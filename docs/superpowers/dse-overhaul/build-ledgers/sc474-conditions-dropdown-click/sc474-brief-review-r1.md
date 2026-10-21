# SC-474 independent review brief — round 1

## 1. Context loading

- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/decisions.md`,
  then the implementer's report `sc474-impl-r1-report.md` in the same dir (exec summary first).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree (shared with the implementer, who is DONE — do not commit to it):
  `/home/scott/code/steelCompendium/worktrees/sc474-conditions-dropdown-click`, plugin repo `…/draw-steel-elements`, branch
  `sc474-conditions-dropdown-click`, head `8af4f9a` on `origin/develop` `3480231`; superproject head `da932cd`.
  Verify heads first. For any experiment that edits code (vacuity, probes), make a PRIVATE scratch worktree:
  `git -C <plugin repo> worktree add <scratchpad>/sc474-review-r1-<suffix>/wt <sha>` — never edit the shared worktree,
  never edit under `/home/scott/code/steelCompendium/workspace/` (except your report). Scott's live-vault dirt in the
  main checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected.
- **Every git command uses `git -C <absolute path>`.**

## 2. Task — adversarial review: execute and probe, do not just read

The change: with the Conditions modal's Add dropdown open, a mouse click on a row's cog or colour swatch must land.
Ticket text and owner rulings are in the ledger — quote them, do not paraphrase. Check in particular:
1. The mechanism keeps SC-186 HIGH-2's guarantees (see the comment blocks in `src/views/ConditionsModal.ts`): mouse pick
   on a menu item still adds; click-away (empty modal space, outside the modal, the modal's own header/close) still closes;
   mousedown inside menu/input never closes; drag-out / drag-in / mousedown-without-click (e.g. mouseup outside the window,
   or a mousedown that opens a native colour dialog) leaves no stuck "pending close" that fires on a LATER unrelated click;
   right-click and middle-click as before; Escape (SC-431) unchanged; SC-468 focus-after-pick unchanged; listener
   lifetime (registered via the modal lifecycle, removed on close — no leak across modal open/close).
2. Real-Obsidian probes: extra e2e scenarios in your private worktree (do not commit them to the branch) covering the
   cases in 1 that jsdom cannot model, especially the original bug for both cog and swatch, and a duration/effect chip.
3. Vacuity: revert the fix (keep the new tests) in your private worktree; the new jsdom tests and the new e2e scenario
   must FAIL. Report which.
4. Re-run the full battery at the branch head (dse-verify order). Expected: tsc/lint clean; jest 5336 + the branch's new
   tests / 1 skipped / 230 of 231 (231 of 232 if a suite was added); lifecycle 28/28; e2e 85/89 + new scenarios, 0 failed,
   4 known-bug, coverage all pairs; shots 572 0 FAIL; freeze 276/276; parity 0/0/24 DECLARED.
5. Scope: no CSS on `.dse-swatch`/`.dse-optchip` (SC-361/SC-356), and no CSS at all unless the ledger records it.
   Commits have no attribution trailers. Both CHANGELOG bullets present and accurate.

Findings by severity (BLOCKER/HIGH/MED/LOW/INFO) with file:line, failure scenario, and prescribed fix.

Footguns (mandatory): devbox `devbox run -c <dse dir> -- bash -c 'cd <dir> && <cmd>'`; its sh wrapper eats `$?`/`$PIPESTATUS`
and `| tail` eats failures — run gates via wrapper script FILES recording the exit code, output to log files. Scratch:
the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`
is shared — use ONLY `<scratchpad>/sc474-review-r1-<random 4-char suffix>/` with uniquely named scripts/logs. Never key a
wait-loop on a scratch filename or its contents (stale logs from other branches match). Redirect long output to files —
the 600s stream watchdog kills silent agents; run gates in the FOREGROUND (timeout ≤600000 ms), split if longer.
Lifecycle: own port `DSE_LIFECYCLE_PORT=9293`. Never `pkill`/`killall` by pattern — kill only a PID whose command line
contains your own path. Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*`) or `.superpowers/`; delete only paths
you created. Freeze baseline is read-only. A stale superproject pin can phantom-fail `token-coverage.test.ts` — diagnose per
dse-verify. Remove your private git worktree (`git worktree remove`) when done.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/sc474-review-r1-report.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED). If the write is blocked, return it inline.

## 4. Return contract

Your final text goes to the ticket-owner, not a human — raw facts: verdict, shas reviewed, finding count by severity with
one line each, measured gate numbers, vacuity result, and the absolute path of every evidence artifact. You cannot
`SendMessage` me (a depth-2 agent cannot reach its parent; `to: 'main'` goes to the dispatcher). If you need input, end with
STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-474:`.

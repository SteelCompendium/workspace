# SC-454 independent reviewer brief, round 1

## 1. Context loading
- Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc454-dead-codeblocks/decisions.md
- Implementer brief + report: same dir, `sc454-brief-impl-r1.md`, `sc454-impl-r1-report.md`
  (read the report's executive summary; verify its claims, do not trust them).
- Worktree: /home/scott/code/steelCompendium/worktrees/sc454-dead-codeblocks/draw-steel-elements,
  branch `sc454-dead-codeblocks`, base develop `ab34293`. The head sha is in the report.
- `git -C <absolute path>` for every git command. Do NOT edit or commit anything; you review only.
- dse-verify skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md
- You never call the tracker (Linear).

## 2. Task — execute and probe, do not just read
The ticket, verbatim:
> Delete it and its unit tests, after confirming it is unused (including from `e2e/` and
> `visual-harness/`). If something does still use it, switch that caller to the shared helper
> `src/framework/host/fenceLine.ts` that SC-290 added.

Check:
1. Is CodeBlocks truly unused at base `ab34293`? Grep yourself (src/, test/, e2e/, visual-harness/,
   scripts/, build/esbuild/jest configs, dynamic require/import strings, `RegisterElements.ts`,
   `main.ts`). Any real caller = HIGH.
2. Diff `ab34293..HEAD`: only the deletion, its tests, and comment/doc rewording? Any behavior change
   = HIGH. Comment rewording must keep byte-compat reasoning intact and not cite deleted files/lines
   as current (owner ruling in ledger). Leftover stale references (`grep -rn CodeBlocks`) — list them.
3. Was any deleted test the ONLY coverage of something still live (e.g. a `test.failing` oracle that
   test/dom/framework/reading-mode-host.test.ts relies on, or helpers that other tests import)? Check
   the deleted test file's imports/exports.
3b. A real caller existed: test/dom/views/minion-stamina-pool-modal.test.ts used
   `CodeBlocks.updateInitiativeTracker` as its `persist: true` callback. Owner ruling (ledger): rewrite
   it inline with `replaceFenceBody` from src/framework/host/fenceLine.ts. Verify: the three affected
   tests' assertions are unchanged; the new callback writes the same bytes the old one did for those
   fixtures (fence info string preserved, body = stringifyYaml(data).trim()); the tests would go red
   if the write were broken (mutate it and run them yourself, then revert — do not commit).
4. Re-run: tsc (incl. `tsc -p e2e`), lint, jest (record exact numbers vs 5262/1/230-of-231 minus the
   deleted tests), and the main.js sha256 comparison base-vs-head yourself (build in a scratch
   `git worktree add` of ab34293 at an absolute path under your private scratch folder; remove it
   afterwards with `git worktree remove`). If main.js is byte-identical, lifecycle/e2e/shots need not
   be re-run by you — say so; if it differs, re-run lifecycle and e2e.

## 3. Footguns
- Devbox: `devbox run -c <plugin dir> -- bash -c 'cd <dir> && ...'`; its sh wrapper eats `$?` and
  pipes eat failures — use wrapper script files capturing exit codes, output redirected to logs.
- Run gates in the FOREGROUND with output to files (600s stream watchdog). Never wait on a
  background-job notification.
- Shared scratchpad: use only
  /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc454-review-r1/
  with uniquely named scripts/logs. Never key a wait-loop on a scratch filename or its contents.
- Never pkill/killall by pattern; never rm -rf a shared glob or `.superpowers/`.
- `rm -f main.js styles.css` in the plugin root before jest.
- The main checkout's dse dirt (demo-vault, compendium-manifest.json) is Scott's live vault — ignore.
- If the report-file write is blocked, return the report inline.
- You cannot SendMessage me; if you need input end with STATUS: NEEDS_CONTEXT. If you send a
  message anyway, its first word must be `SC-454:`.

## 4. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc454-dead-codeblocks/sc454-review-r1-report.md
— opens with a ≤10-line executive summary (verdict: LAND-READY or FIXES NEEDED).

## 5. Return contract
Final text goes to the ticket-owner: verdict, head sha reviewed, findings by severity with file:line,
failure scenario and prescribed fix for each, measured gate numbers, both main.js hashes, and absolute
paths of every artifact. No prose.

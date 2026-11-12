# SC-601 r5 brief: scoped re-review of the r4 delta

You are a fresh independent reviewer for ticket SC-601. You review ONLY the r4 fix-round delta, not the whole effort. Your final text goes to the ticket-owner. **You never call the tracker (Linear).**

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/decisions.md` (sections "r3 result and owner rulings" and "Base moved" are the spec for this delta).
- r3 review report `sc601-r3-review-report.md` (MEDIUM-1, LOW-1 are what r4 had to fix) and the r4 report `sc601-r4-fix-report.md` (same dir). Verify its claims; don't trust them.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~320 KB, read in parts): "Lifecycle and e2e notes" (~line 177-182) and "Hover preview modals (SC-595)" (~line 405-412).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover`, dse branch `sc601-compendium-search-hover` (HEAD and the rebased shas are in the r4 report; base dse `origin/develop` `c6077860`). The delta to review is the r4 commits after the rebased equivalent of `ea849f11` (the r4 report names it). Also confirm the rebase onto `c6077860` is clean: `git -C <dse path> log --oneline c6077860..HEAD` shows only SC-601 commits, and `git -C <dse path> merge-base HEAD origin/develop` = `c6077860`.

## Task

1. MEDIUM-1 fixed? The block path re-checks the editor right before `replaceSelection`, the early check stays, and exactly one Notice is shown in every refusal path. Read every await between the pick and every write (reference, Shift inline link, block, Ctrl copy).
2. LOW-1 tests have teeth? Run mutants R2 (activeEditor re-target at choose), R4a (`some` for `every`), R4c (closed pane not refused), R5 (guard bound to the global `document`), and drop-the-late-recheck, in a scratch git worktree (`git -C <dse path> worktree add <your scratch>/dse-mut HEAD`, symlink `node_modules`; remove it afterwards with `git worktree remove <literal path>`). Each must be killed by jest. Do not commit to the branch.
3. G-S97 trial 9 is real: read it (does it hide the preview after the check and assert one Notice and nothing on disk?). Run `--only=G-S97` on the branch (green, 9/9) and on the bundle of the rebased pre-r4 commit (trial 9 red), using dse-verify footgun (9) (`git archive <sha> | tar -x -C <scratch>`, symlink `node_modules`, `node esbuild.config.mjs production`, `DSE_LIFECYCLE_BUNDLE=<scratch> node visual-harness/obsidian-lifecycle.mjs --only=G-S97`).
4. Re-run full jest (expected 10624 + this effort's tests, 2 skipped) and lifecycle part 6 (`--only=G-S92,G-S96,G-S97`, or G-S97 alone if the r4 report moved it to part 7) yourself; review the G-S96/G-S97 rebase conflict resolution in `visual-harness/obsidian-lifecycle.mjs` (SCENARIOS order G-S92, G-S96, G-S97, ..., G-S56 last; G-S96 untouched). Check the r4 report's e2e / shots / freeze / parity numbers against the expected CURRENT: e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`; shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147; freeze 280/280; parity 0/0/24; lifecycle 60/60 (21/16/9/4/7/3). Re-run any of them whose reported number is off or missing.
5. Out of scope: SC-611 (the jest SuggestModal mock's choose/close order). Do not report it again.

## Running gates

One blocking call per gate through a script file that captures the exit code inside the file: `devbox run -c <dse abs path> -- bash /abs/path/your-script.sh`. Read each gate's own summary line. The Bash tool backgrounds any call over 180 s: output to a log, wait with `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (`readlink /proc/<pid>/cwd` inside your worktree), repeat, then read the log. Never wait for a notification that may not come.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; stale logs from other branches match.
- Redirect long output to files; the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT`. If you message anyway, the first word must be `SC-601:`.
- Private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r5-<yourAgentId>/`, unique names, files written with the Write tool.
- **Never `rm -rf` a `/tmp` glob** (other efforts' lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`); delete only literal paths you created or your run printed. No `rm` with a shell-variable target. Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only your own PIDs.
- `git -C <absolute path>` always; never `cd` inside a compound command. No long `TMPDIR`.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and is expected.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/sc601-r5-rereview-report.md`, opening with a ≤10-line executive summary: LAND-READY or FIX REQUIRED, findings by severity, measured numbers. Findings carry file:line, a failure scenario and a prescribed fix. Final text to me: raw facts plus absolute paths of the report and every artifact.

## Addendum (owner, after r4)

r4 result: dse HEAD `ee113341` on `c6077860`. Commits: `6d1b56e9` (r2 fix, re-applied), `10f8aaf0` (r2 jest, re-applied), `dd838596` (MEDIUM-1 late re-check + ported tests), `a46b9617` (early block check refuses before any vault read), `ee113341` (G-S97, 9 trials, re-applied with `--3way`). The rebase was a reset + cherry-pick, not a plain rebase: verify with `git -C <dse path> range-diff 5f7c5336..ea849f11 c6077860..10f8aaf0` (or diff the src/test trees) that `6d1b56e9`/`10f8aaf0` carry exactly r2's `ddee8074`/`0e1154f2` content, and that the lifecycle diff vs `c6077860` is additions only (G-S96 untouched). The delta to review is `10f8aaf0..ee113341` plus that check. `a46b9617` is a behaviour addition the owner did not request: judge it. Claimed: jest 10659 / 1 skipped (cached harness css; fresh = 10658 / 2), lifecycle 60/60, part 6 230 s, e2e/shots/freeze/parity at CURRENT, trial 9 red on the `10f8aaf0` bundle and green on HEAD, mutants 23/23 killed (`sc601-r4-mutants-summary.txt`). Pre-r4 bundle for trial 9's red = built from `10f8aaf0`.

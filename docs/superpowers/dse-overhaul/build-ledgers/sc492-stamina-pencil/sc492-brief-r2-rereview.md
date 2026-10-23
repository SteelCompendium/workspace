# SC-492 r2 scoped re-review brief

You reviewed `d41d19d` in r1. This is a re-review of the **delta only**, not a fresh full pass.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-decisions.md` (r1 rulings: LOW-1, INFO-1 and INFO-4 folded; INFO-2 filed as SC-502; INFO-5 and INFO-3 dropped).
- Your r1 report: `sc492-r1-review-report.md`. The fix report: `sc492-r2-fix-report.md` (read its summary). Both are in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil`. The dse branch is now rebased onto origin/develop `2c61511` (SC-497 bumped the Obsidian host pin to 1.15.0; SC-478 added lifecycle G-S18). The superproject is rebased onto origin/main. Get the new head shas from the fix report and confirm them with `git -C`.
- The same footguns as r1 apply. Use a private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc492-rereview-r2/`. Do not commit. Leave the tree as you found it. Never call the tracker.

## Task

1. Use `git range-diff` (old: `d152ea4..d41d19d`, new: `2c61511..<head>`) to confirm the rebase carried the r1 commits unchanged. Then review the new commits: the LOW-1 comment, the INFO-1 pin test, and the INFO-4 `bar.contains(c)` guard plus its test.
2. Probe the new tests. The pin row and the INFO-4 case must fail on base `2c61511` with the src fix reverted, then pass on head. A `.dse-chrome` placed above the bar must not swallow bar clicks.
3. Re-run the full battery at head with plain shots, which no longer needs the HOME workaround. Expected numbers on `2c61511`:
   - jest: 5797 / 1 / 239 of 240, plus the branch's tests. That gives 240 of 241.
   - lifecycle: 34/34 (33 on base + G-S32). The LOW-1 header comment must match the real count.
   - e2e: 104/104 ok, 0 failed, 0 known-bug, 69/69 pairs.
   - shots: 592, 0 FAIL, with these lines:
     - `host-copy pin OK (… 1.15.0; 18 further rules …)`
     - `button host-leak OK (113 … 678 …)` with a 20-record boundary
     - `modal button host-leak OK (10 … 228 …)`
     - both text-scale lines, incl. `text scale once OK (107256 / 214 loads …)`
   - An `OBSIDIAN APP.CSS PIN DRIFT` warning with rc 0 is expected.
   - freeze: 280/280 OK.
   - parity: 0 GAPs / 0 undeclared / 24 DECLARED.
4. Re-confirm with one real-Obsidian probe on the new head: the pencil opens only the form, and a click on the bar opens the Stamina modal. Your r1 probe scenarios are reusable.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc492-stamina-pencil/sc492-r2-rereview-report.md`. Start it with a summary of 10 lines or fewer. Give the verdict as LAND-READY or FIX-REQUIRED, and list findings by severity with file:line. If the write is blocked, return the report inline.

Return: verdict, sha reviewed, gate numbers, finding counts, and evidence paths. Write it as raw facts. You cannot SendMessage me. If you need context, end with STATUS: NEEDS_CONTEXT. If you message anyway, start with `SC-492:`.

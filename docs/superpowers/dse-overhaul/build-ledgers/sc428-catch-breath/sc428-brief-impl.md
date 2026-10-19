# SC-428 implementer brief — round 1

## 1. Context loading (do this first)
- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/decisions.md` — it is the spec. **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc428-catch-breath`. DSE repo: `/home/scott/code/steelCompendium/worktrees/sc428-catch-breath/draw-steel-elements`, branch `sc428-catch-breath`. Verify `pwd`/paths before every write. **NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir.** Workspace-level files (e.g. `CHANGELOG.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc428-catch-breath/CHANGELOG.md`.
- **Every git command uses `git -C <absolute path>`** — never `cd X; git …` (a failed cd once ran git in the shared main checkout).
- Fetch/rebase first: `git -C <dse> fetch origin develop` then `git -C <dse> rebase origin/develop`. Expected base: `origin/develop` = `7644fb3`. If it has moved, rebase onto it and report the new sha.
- Read `draw-steel-elements/AGENTS.md` (and CLAUDE.md if present) and the `dse-verify` skill at `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` before running any gate.

## 2. The task (all four items of the ledger's "Spec" section, quoted there verbatim)
1. Catch Breath (strip button in `src/elements/stamina-bar/view.ts` ~196 AND `src/elements/hero/view.ts` ~426) is also disabled when `recoveryHealAmount(...) <= 0` (full Stamina, and recovery value 0), with a reason tooltip; a click in that state writes nothing.
2. The Recoveries popover's "Catch breath" button (`src/framework/kit/RecoveriesStrip.ts` ~196-201) is real-disabled with a reason whenever the strip button would be (0 Recoveries, dying, full Stamina / zero heal).
3. Recovery value 0 (max Stamina ≤ 2): the modal's Spend Recovery disabled reason (`StaminaEditModal.ts` ~640) says the recovery value is 0, not "Already at maximum Stamina". Update/remove the doc note there accordingly.
4. Clicking a Recoveries marker leaves keyboard focus ON that marker row (on the clicked marker, or the row's roving-tabindex target), so Tab/arrow navigation continues from it. Investigate why focus is lost (likely a re-render replacing the node) and fix at the root; mirror any existing focus-restore pattern in the framework rather than inventing a new one.

Owner rulings (ledger, verbatim): "Disabled-reason wording: one shared source of truth for each reason across strip button, popover button and modal Spend Recovery (no divergent strings)." Put the gating predicate + reason in one helper used by all three surfaces (and hero view) — look for where `recoveryHealAmount` and the modal's reason logic already live and extend there.

Ledger, verbatim: "Existing known-bug markers for SC-428 must be flipped to passing tests (jest `test.failing` in stamina-entry-points-matrix, stamina-recoveries-matrix, stamina-edit-modal-matrix; e2e `knownBug('SC-428')` x2 in e2e/specs/stamina-bar/stamina-recoveries.e2e.ts). Expected e2e after fix: 0 failed, known-bug count 11 -> 9." Rewrite each marker's test title to drop "[known bug SC-428]". Confirm each flipped test FAILS on the pre-fix code (git stash the src change, run that one file, restore) — report it. Add an e2e scenario (or extend an existing one) for item 4 if the SC-408 e2e found it in real Obsidian and no test covers it; follow `e2e/README.md` (manifest/coverage pairs).
Add jest tests for: the hero view's button (item 1), popover disabled at each of the three conditions with its reason text, the zero-recovery-value reason (item 3), focus retention (item 4, jsdom where feasible).

Docs: add a bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md` (user-facing wording). If DSE has its own CHANGELOG with an Unreleased section, add there too, following its convention.

Commit after every coherent step (small commits, conventional messages referencing SC-428). Do NOT add any Co-Authored-By/Claude attribution trailers. Never tag; never push.

## 3. Gates — full dse-verify battery in its order
Expected at base `7644fb3` (dse-verify "CURRENT"): tsc (incl. `tsc -p e2e`) + lint (incl. e2e/) clean · jest **4761 passed / 1 skipped / 227 of 228 suites** (yours: ≥ that, the flips keep count, new tests add — report exact) · lifecycle **25/25** · e2e **`OBSIDIAN-E2E done: 61/72 ok, 0 failed, 11 known-bug, coverage: 47/47 pairs`** → expected after fix **0 failed, 9 known-bug**, ok count +2 (plus any new scenarios), coverage Y/Y · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
If freeze goes red (a frozen print shot shows a Catch Breath button whose disabled state changed): do NOT touch the shared baseline. Ship `.superpowers/sdd/sc428-catch-breath/rebaseline.txt` (ready-to-apply hash lines) + before/after crops (PNG paths) and explain each moved line. Also tell me if any NON-frozen shot visibly changed (e.g. a disabled button at full stamina) with before/after paths — I need 1-2 images for Scott.

Footguns (mandatory):
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc428-catch-breath/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc428-catch-breath/draw-steel-elements && <cmd>'`. Devbox's sh eats `$?`/`$PIPESTATUS`, and `| tail` eats failures: run each gate via a wrapper SCRIPT FILE that writes the exit code to a per-run unique path, output redirected to a file — never streamed (the 600s stream watchdog kills silent agents).
- Run gates in the FOREGROUND. Never background a gate and wait for a notification — it will never come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern — other worktrees run the same gate commands. Kill only by PID whose command line contains `worktrees/sc428-catch-breath/`.
- Jest timeout-shaped red under load: re-run per dse-verify's rule before believing it.
- Stale superproject pin can phantom-fail `token-coverage.test.ts` — diagnose per dse-verify / use `DSE_TOKEN_MAP_PATH` pointed at the main checkout's copy; never edit the branch for it.
- Never `rm -rf` anything under `.superpowers/` except files you created in `sc428-catch-breath/`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-428:`.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/sc428-impl-r1-report.md`, opening with a ≤10-line executive summary.

## 5. Return contract
Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS, branch, head sha, rebase base sha, each gate's measured line + exit code, flipped-marker list with fail-before evidence, new tests, reason strings chosen (exact text), focus-loss root cause in one line, `Drive-by fixes:` and `Follow-ups:` lists, plus the absolute path of every evidence artifact (logs, screenshots, crops, rebaseline.txt).

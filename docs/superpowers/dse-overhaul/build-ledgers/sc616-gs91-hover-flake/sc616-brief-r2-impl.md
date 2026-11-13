# SC-616 r2 — implement the G-S91 harness fix (implementer)

You are a worker for the SC-616 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context to load

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/decisions.md` — read the "Owner rulings" O1-O4; they define this task.
2. r1 diagnosis: `.../sc616-gs91-hover-flake/sc616-r1-diagnosis-report.md` (executive summary + the "Recommended fix" section) and the prototype `sc616-r1-proto-harness-fix.diff.txt` (55 lines; your starting point).
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — about 360 KB, read in PARTS: lines 20-220 (battery, devbox wrapping, lifecycle/e2e notes, the exit-code footgun), lines 470-486 (Hover preview modals; SC-598 bullet), lines 1478-1484 (CURRENT numbers). Also grep it for "G-S83 authoring footguns" (~line 477) — footgun (12) is referenced by r1.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`; dse submodule `.../draw-steel-elements`, branch `sc616-gs91-hover-flake`, at dse develop `c0995beb`. First `git -C <dse path> fetch origin`; if `origin/develop` moved past `c0995beb`, rebase onto it and say so (run `npm ci` if `package.json` changed). Use `git -C <absolute path>` for every git command; verify paths before any write. The main checkout (`/home/scott/code/steelCompendium/workspace`) is shared: never write code there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected. The workspace-level files you might touch live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/` — never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir below, which is where reports go).

## 2. The task

Harness-only change to `draw-steel-elements/visual-harness/obsidian-lifecycle.mjs` (G-S91: `gs91Trial` ~line 1793 and the scenario judge ~line 8330). No `src/` change, no `styles.css` change.

Owner rulings, verbatim from the ledger:

> 2026-11-13 O1 (on r1): **No Scott decision needed.** The failing form is SC-598's documented residual (...). G-S91 was meant to test SC-598's promise (a click after the preview had its 10 ms, inside the old 150 ms), and its zero-length second press raced the residual instead. Fix = harness only, per r1's prototype: release the second press after an in-page 11 ms timer; measure the validity gate from the END of the opening click's dispatch (`gapEnd < 140`).

> 2026-11-13 O2: **fold in** r1's optional retry: a trial whose ONLY problem is the inconclusive-gap gate (gapEnd >= 140, i.e. the host was too slow for the trial to prove anything) is re-run, at most 2 retries, then FAILs loudly as today; retries are named in the scenario's outcome line. Only if the trial starts from fresh state (or the implementer resets it); a product failure (preview gone, modal gone, editor, focus) is NEVER retried.

Steps:
1. Apply the r1 prototype (`git -C <dse> apply` the diff, or hand-apply). Keep its explanatory comments accurate and short. Update the header comments for G-S91 (~line 180 file header and ~line 1793 JSDoc, ~line 8330 scenario comment) so they describe the new press shape and the `gapEnd` gate.
2. Implement O2's retry. First establish whether each `gs91Trial` call starts from fresh state (fixture files rewritten, preview/modal closed, stamina restored — note the `apply` trial writes `current_stamina: 18`). If a trial does not start fresh, reset what it needs before a retry, or restrict the retry to trials where a re-run is provably equivalent and say which. Retry ONLY when the inconclusive-gap problem is the trial's sole problem.
3. Never put a bracketed ticket id in a test/scenario title. G-S91 stays where it is in SCENARIOS (part 5; G-S56 stays last). No new scenario id.
4. Commit on the branch with a message like `fix(SC-616): G-S91 releases the second press after the preview's 10 ms helper timer; validity gate from the opening dispatch's end; inconclusive trials retried` (no bracketed id in any test title; commit messages are fine). Commit after every coherent step. No Co-Authored-By/AI attribution trailer.
5. Write a SKILL.md proposal (do NOT edit SKILL.md): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-dse-verify-proposal.md`, with exact replacement text for: the G-S91 flake bullet (~line 182: say the race and the fix, the measured before/after rates, and that a G-S91 FAIL is now a real signal except an inconclusive gap after retries); the SC-598 bullet's sentence about the residual if it should mention that G-S91 now releases after the helper timer; G-S83 footgun (12) if r1's finding bears on it (read it and decide; say why); battery row 4's part-5 timing note if your measured part-5 time moved; a new CURRENT block draft (dse sha TBD, numbers from your gates).

## 3. Gates (dse-verify) — expected numbers

Run in a fresh state on your final commit:
- tsc clean, lint clean.
- jest: expect **11682 passed / 2 skipped** in a fresh worktree (no jest change expected; if it differs, explain).
- lifecycle **61/61**, six `--only` parts (`--only=` takes comma-separated ids): part 1 `G-S7a … G-S9a` (21), part 2 `G-S9b … G-S40` (16), part 3 `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9), part 4 `G-S57,G-S62,G-S61,G-S56` (4), part 5 `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7; ~395 s), part 6 `G-S92,G-S96,G-S97,G-S99` (4). Read the exact part-1/part-2 id lists from SKILL row 4 / the harness SCENARIOS array. Report per-part time.
- e2e: **`OBSIDIAN-E2E done: 328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (known bugs SC-257, SC-355, SC-384).
- shots / freeze / parity CARRY if `main.js` and `styles.css` are byte-identical to a `c0995beb` build (SC-557 precedent: harness-only). Prove it: build both and compare sha256; report the hashes. If not identical, stop and report.
- Extra evidence for this ticket:
  - G-S91 alone **>= 10 runs** on the final commit: report pass count, each trial's `gap`/`gapEnd`, and any retries.
  - Red on the SC-598-reverted base: r1 built one at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r1-add63411/base598rev/` (see r1 report / `sc616-r1-build-base.sh.txt` for how it is used). Run your final G-S91 against it **>= 2 runs**: every non-dblq trial must FAIL for a product reason (preview gone), not the inconclusive gate, and the retry must NOT have fired for those product failures. If you cannot reuse r1's bundle, rebuild it the same way in your own scratch dir.

Run mechanics:
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command; devbox eats `$?` and `| tail` eats failures — run gates via a script FILE that records its own exit code, output redirected to a log file; read each gate's summary line.
- Each gate as ONE blocking foreground Bash call under 600 s (split lifecycle into its parts; batch G-S91 repeats ~5 per call). No `run_in_background`, no Monitor, no waiting for notifications.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r2-<yourAgentId>/`, uniquely named scripts and logs. Write scratch files with the Write tool.
- Never `rm -rf` a `/tmp` glob or any glob (other efforts' lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`); never `rm` with a shell-variable path; delete only literal paths you created. Never touch `.superpowers/` outside `sc616-gs91-hover-flake/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line or `readlink /proc/<pid>/cwd` is inside YOUR worktree.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-r2-impl-report.md`, opening with a <=10-line executive summary (commit sha, gate numbers, G-S91 head rate, base red-ness, retry behaviour). Copy the deciding logs into the same dir with `sc616-r2-` prefixes (gate logs, G-S91 repeat log, red-on-base log). If the report-file write is blocked, return the report inline. Put any deferred item under `Follow-ups:` and any obviously-correct local fix under `Drive-by fixes:`.

## 5. Footguns

- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-616:`.

## 6. Return contract

Final text: raw facts, no prose — STATUS, commit sha(s), clean-tree confirmation, each gate's summary line and number, main.js/styles.css hashes (head vs c0995beb), G-S91 head runs (pass/total, retries fired), base runs (fail form per trial), and the absolute path of every evidence artifact.

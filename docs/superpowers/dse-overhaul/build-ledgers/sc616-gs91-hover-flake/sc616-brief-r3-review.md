# SC-616 r3 — independent adversarial review of the G-S91 harness fix (reviewer)

You are a worker for the SC-616 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.
You did NOT author this change or its prototype; judge it on its own evidence.

## 1. Context to load

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/decisions.md` (goal; owner rulings O1-O4).
2. `.../sc616-gs91-hover-flake/sc616-r1-diagnosis-report.md` (executive summary; the cause and the failing timeline `sc616-r1-timeline-fail.txt`) and `sc616-r2-impl-report.md` (executive summary). Treat their claims as hypotheses to verify, not facts.
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — about 360 KB, read in PARTS: lines 20-220, lines 470-486 (Hover preview modals; the SC-598 bullet and its stated residual), lines 1478-1484.
4. SC-598's ledger for what G-S91 was built to prove: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/decisions.md` (O1, O9, O15).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake`; dse `.../draw-steel-elements`, branch `sc616-gs91-hover-flake` at `33dd0a1b` on dse develop `1516f894` (SC-563 landed; was c0995beb). Review `git -C <dse> diff 1516f894..33dd0a1b`. Use `git -C <absolute path>` for every git command. The main checkout is shared: never write code there; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected. Do not commit to the branch; probes are uncommitted and reverted before you finish (save them as `sc616-r3-*.diff.txt` in the ledger dir).

## 2. The task — execute and probe, not just read

The ticket's goal (verbatim): "Expected: G-S91 passes every run, or the trial is fixed so that it only fails when the product is wrong."

Probe at least:
1. **Not vacuous.** Does G-S91 still FAIL for a product reason when SC-598's fix is reverted (r1's `base598rev` bundle under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r1-add63411/`, or rebuild it yourself), in every non-dblq trial? Also try at least one targeted mutant of `DseModal.focusHoverPreviewNow` (e.g. the synthetic click removed, or `preventDefault` removed) and say which G-S91 trials catch it — compare with what the trial caught BEFORE this change (run the same mutant against `1516f894`'s harness). A mutant that the old trial caught and the new one misses is a HIGH finding.
2. **The 11 ms release.** Is "DOM timers run in due order, so Obsidian's 10 ms helper timer has run" sound? Edge cases: timer clamping/nesting, the helper timer being armed later than assumed (re-open path from an `.is-editing` preview gets no synthetic click — does `reopen` still test what it should?), the mousedown landing before the timer (does a mousedown inside the modal affect the helper?), a slow host where the 11 ms timer itself is delayed.
3. **The `gapEnd` gate.** Is measuring from the opening dispatch's END correct for the base (where the helper's 150 ms timer is armed then)? Can a slow run pass the gate while proving nothing?
4. **The retry.** Retries only the inconclusive-gap case, at most 2, never a product failure; trial state is fresh on retry (the `apply` trial writes `current_stamina: 18`). Try to make it retry a product failure, or mask one.
5. **Flake gone.** Re-run G-S91 alone on the head >= 6 times, including some under load or CPU throttle (r1's methods; uncommitted), and full lifecycle part 5 once.
6. Comment and docs accuracy in the diff; the SKILL proposal `sc616-dse-verify-proposal.md` (accurate numbers, no stale claims).
7. Confirm `main.js` / `styles.css` byte-identical to a `1516f894` build (so shots/freeze/parity carry).

Scope: G-S91 and what it exercises. Out of scope: closing SC-598's residual in the product (owner ruling O3: dropped).

## 3. Run mechanics

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc616-gs91-hover-flake/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command; devbox eats `$?` and `| tail` eats failures — script FILEs that record their own exit code, output redirected to a log.
- Each run as ONE blocking foreground Bash call under 600 s. No `run_in_background`, no Monitor, no waiting for notifications.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r3-<yourAgentId>/`, uniquely named files; write them with the Write tool.
- Never `rm -rf` a `/tmp` glob or any glob; never `rm` with a shell-variable path; delete only literal paths you created. Never touch `.superpowers/` outside `sc616-gs91-hover-flake/`.
- Never `pkill`/`killall` by pattern; kill only by PID inside YOUR worktree (`readlink /proc/<pid>/cwd`).
- Lifecycle: `--only=` takes comma-separated ids; part 5 is `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc616-gs91-hover-flake/sc616-r3-review-report.md`, opening with a <=10-line executive summary: verdict (LAND / FIX), findings count by severity. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. Copy deciding logs with `sc616-r3-` prefixes. If the report-file write is blocked, return it inline.

## 5. Footguns

- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-616:`.

## 6. Return contract

Final text: raw facts — verdict, findings (severity, file:line, one line each), run counts (head pass/total, base/mutant results), byte-identity hashes, branch sha + clean-tree confirmation, and the absolute path of every evidence artifact.

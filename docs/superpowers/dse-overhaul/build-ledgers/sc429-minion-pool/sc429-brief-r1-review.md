# SC-429 round 1 — independent adversarial review

## 1. Context loading
- Read: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc429-minion-pool/decisions.md (spec + owner rulings O1–O5) and the implementer's report sc429-r1-implement-report.md in the same dir (exec summary first; the body only where you need it).
- Branch under review: `sc429-minion-pool` in /home/scott/code/steelCompendium/worktrees/sc429-minion-pool/draw-steel-elements, head c1cc4fe, base a89ffd9 (develop). Review `git -C <that path> diff a89ffd9..c1cc4fe`.
- You did not write this code. Do NOT edit the branch; if you need scratch experiments, use a throwaway copy (`git worktree add /home/scott/code/steelCompendium/worktrees/sc429-review-scratch c1cc4fe` from that submodule, removed afterwards with `git worktree remove`) or uncommitted edits you revert before finishing (`git -C … status` clean at the end).
- `git -C <absolute path>` for every git command. Never write under /home/scott/code/steelCompendium/workspace/ except your report in the ledger dir. You never call the tracker.

## 2. The task — execute and probe, don't just read
Quoted rulings (decisions.md):
> - O1 (item 1): Checks the modal set AUTOMATICALLY (the "every remaining minion must die" auto-check) are reverted when that rule stops applying: those boxes un-check and re-enable; boxes the USER checked by hand keep their state. No state where more boxes are checked than the rule forced and the user chose.
> - O2 (item 2): On open, focus goes where the stamina edit modal puts it (mirror its behaviour — implementer verifies what that is and reports it). Never a stepper button.
> - O3 (item 3): The minion-count box's max is the number of LIVING minions in the squad.
> - O4 (item 4): When nothing is pending (no damage, no kills to select) the kill/select info line is hidden, not reworded. Any heal/refused-heal text is unaffected.
> - O5: Product fixes + jsdom tests only. No new e2e manifest pairs (that is SC-435). Full dse-verify battery must stay green with no rebaseline.

Probe at least: pool 0 -> 1 -> 0 -> 2 sequences with and without hand-checked boxes (does a hand-check survive; can the count of checked boxes ever exceed what is needed; Apply label/enabled state at each step); typed pool values vs stepper buttons reaching the same states; squads with dead members (count-box max, auto-check counting, kill counting); heals (raising pool above start) with the info line; Reset/Cancel/Escape after these sequences; that focus on open is genuinely where the stamina modal puts it in jsdom AND (if the lifecycle/e2e harness lets you) in real Obsidian; that the new tests fail on a89ffd9 (revert the src change in scratch and run them — vacuous tests are a known failure mode here). Run the jest suites for the modal and the full battery steps you judge necessary (at minimum jest full + lifecycle + e2e).
Expected numbers at base (dse-verify CURRENT row): jest 4769 passed / 1 skipped / 227 of 228 suites · lifecycle 25/25 · e2e `OBSIDIAN-E2E done: 62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots 572, 0 FAIL · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

Footguns: devbox (`devbox run -c <dse dir> -- bash -c 'cd <dse dir> && …'`; devbox eats exit codes and `| tail` eats failures — use wrapper script files or read the gate's summary line from a redirected log); run gates in the FOREGROUND, output redirected to a file (600s stream watchdog); never key a wait on a scratch filename/contents (stale logs from other branches exist) — use per-run unique paths with an `sc429-rev-` prefix; never pkill/killall by pattern — kill only PIDs whose command line contains your own worktree path; never touch `.superpowers/sdd/freeze-baseline.sha256` or delete anything under `.superpowers/` you didn't create; timeout-shaped jest reds under load → re-run that suite alone.

## 3. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc429-minion-pool/sc429-r1-review-report.md — opens with a ≤10-line executive summary (verdict APPROVE / APPROVE-WITH-NITS / CHANGES-REQUIRED, counts by severity, gate numbers you measured). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario (exact steps), and a prescribed fix. If the report write is blocked, return it inline.

## 4. Return contract
Final text goes to the ticket-owner, not a human: raw facts — verdict, finding count per severity with one-line titles, measured gate lines, and absolute paths of every artifact. You cannot SendMessage me (to: 'main' reaches the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you send anyway must start with `SC-429:`.

## 5. Also rule on (implementer follow-up, owner wants your view)
- The Apply Damage handler does not clamp the typed minion count to the living count (the box max is advisory). Over-counting only drives the pool toward 0. Say whether this is reachable by real input and whether a clamp belongs in this ticket (it is in scope if trivial — prescribe it as a LOW).

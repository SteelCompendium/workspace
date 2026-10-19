# SC-372 — round 3 brief (fix round): each text-size knob applies once

## 1. Context loading
- Ledger (binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/decisions.md — read the "r2 review rulings" section.
- Review report: sc372-r2-review-report.md (same dir). The spec you execute is its **§F1.4 "Implementation spec for r3 (no judgment calls)"**, steps 1–5, plus INFO-1 and INFO-4. Exact CSS: `sc372-r2-review/spec-once-block.css`. Sweep to port: `sc372-r2-review/gate-nesting.mjs`. Expected vacuity output: `sc372-r2-review/logs/gate-nesting-r1.log`.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements, branch `sc372-textscale` @ fcbcd09 on origin/develop a337460. `git -C … fetch origin` first; if origin/develop moved past a337460, rebase onto it and say so.
- Workspace-level docs (D3-token-map.md) live in YOUR worktree's superproject: /home/scott/code/steelCompendium/worktrees/sc372-textscale/docs/… — never under /home/scott/code/steelCompendium/workspace/ (only the ledger dir there is yours to write).
- You never call the tracker.

## 2. Task — rulings quoted from the ledger
- "HIGH-1 (F1 compounding, 9 containers): r3 executes sc372-r2-review-report.md §F1.4 steps 1-5 verbatim"
- "MEDIUM-1 (gate blind to compounding): folded — §F1.4 step 3."
- "LOW-2 (docs say \"keep consumers un-nested\"): folded — §F1.4 step 5."
- "INFO-1 (misleading `x 0.8` failure message): folded."
- "INFO-4 (`tokens.ts:123` \"eight scale-dependent roles\" vs 14 tokens): folded — reword."
- OUT OF SCOPE: "LOW-1 + F2 … TICKETED as SC-422 … do not touch SidebarPanel or any TS." Also INFO-2 and INFO-3 are dropped — don't do them.
- "§F1.4 step 5's last bullet (edit workspace `.claude/skills/dse-verify/SKILL.md`): NOT for r3" — do not edit dse-verify anywhere.
- Record the vacuity proof (§F1.4 step 4) and the divergence-test bite (step 2) in your report.
- Regenerate the four evidence PNGs (same names, same BEFORE = develop a337460 / AFTER = branch framing, text captions, colorblind-safe) so AFTER shows the r3 tree. The small-120 image must show the power-roll tier badges; state whether "12-16" still wraps. Overwrite `evidence/sc372-*.png`.
- Commit after each coherent step.

## 3. Gates — full dse-verify battery (lifecycle optional: no TS changes expected; run it if you touch any .ts under src/)
Expected (§F1.4 step 6): tsc/lint clean · jest 4439 passed (4438 + 1 divergence test) / 1 skipped / 220 of 221 suites (test 3 rewritten) · shots 568, 0 FAIL, `text scale OK (≥1104 + new rows)`, `text scale once OK (~102,063 comparisons over 197 loads)` · freeze `freeze OK (274/274 …)` (zero frozen bytes may move — if any do, stop and report with rebaseline.txt + crops, do not rebaseline) · parity 0 GAPs / 0 undeclared / 24 DECLARED, LAST.

## 4. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r3-fix-report.md, opening with a ≤10-line executive summary (verdict, dse sha, superproject sha, gate numbers, frozen bytes moved y/n). Logs under `logs/` with an `r3-` prefix.

## 5. Return contract
Final text → ticket-owner: raw facts (verdict, shas, each gate number, vacuity + bite results, "12-16" wraps y/n) + absolute path of every artifact. No prose.

## 6. Footguns (same as r1 — all still apply)
- Report write blocked → return it inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Redirect long output to files; gates in the FOREGROUND (≤600000 ms per call); never end your turn waiting on a background job.
- Devbox `bash -c 'cd /abs && cmd > /abs/log 2>&1'`; it eats exit codes; read summary lines.
- `git -C <absolute path>` always.
- No `pkill` by pattern; PIDs containing `worktrees/sc372-textscale/` only.
- Never touch the shared freeze baseline; never rm anything in `.superpowers/` outside `sc372-textscale/`.
- NEEDS_CONTEXT → end your turn with the question; any message you send starts with `SC-372:`.

# SC-372 — round 4 brief (scoped re-review of the r3 delta only)

## 1. Context loading
- Ledger (binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/decisions.md — "r2 review rulings".
- r2 review report (what was found + the spec r3 executed): sc372-r2-review-report.md §Findings and §F1.4. r3 fix report: sc372-r3-fix-report.md. Same dir.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc372-textscale/draw-steel-elements, branch `sc372-textscale`. Review ONLY the delta `git -C <dse> diff <rebased fcbcd09 = 98dcb22>..HEAD` (plus the superproject's D3-token-map change). The r1 code before fcbcd09 is already reviewed — not in scope. The branch was rebased onto 0ecb90e; the rebased equivalent of r1-tip fcbcd09 is 98dcb22 — diff 98dcb22..HEAD (verify with `git range-diff`).
- Do NOT commit to the branch. Scratch under `sc372-r4-rereview/` in the ledger dir. Leave `git status` as you found it.
- You never call the tracker.

## 2. Task — execute and probe
1. The CSS block matches `sc372-r2-review/spec-once-block.css` (diff it). No change to the token rule, prompt rule, or any consumer rule.
2. Exactly-once: at small/control/large 1.2 and 0.8, the 9 small + 3 control containers' inner text scales by exactly S (not S²), on screen and print; control still never moves on paper; defaults unchanged. Use the r2 oracle scripts in `sc372-r2-review/` (`enum.mjs`/`compare.mjs`/`run-enum.sh`) against the r3 build rather than writing new ones.
3. Over-broad registry check: no registered container makes a same-knob descendant INERT (ratio 1 where S is expected) — including nested element roots inside a container (the G-S6h party-slot statblock case).
4. Gate vacuity: remove the CSS block in a scratch copy → `TEXT SCALE COMPOUNDS` with the expected lines; divergence test fails on a 0.85em→0.86em edit. Confirm the new sweep covers what it claims (interaction/pref/chrome shots, print twin).
5. Docs (font-sizes.md, D3-token-map, CHANGELOG) say what the code does. INFO-1 and INFO-4 done. Nothing out of scope (SC-422 / TS / SidebarPanel / dse-verify) touched.
6. Re-run shots + freeze + parity yourself and jest.

Expected (r3-reported): tsc/lint clean · jest 4438 passed / 1 skipped / 220 of 221 suites — r3 DERIVED the 0ecb90e base as 4431 without measuring it; measure the base yourself (detached scratch worktree of 0ecb90e via `git -C <dse> worktree add <abs scratch path> 0ecb90e`, remove it after) and confirm branch = base + 7 · shots 568, 0 FAIL, `text scale OK (1146 comparisons)`, `text scale once OK (~102,063 comparisons over 197 loads)` · freeze `freeze OK (274/274 …)` · parity 0 / 0 / 24 DECLARED (LAST). (Use r3's report numbers if they differ and say why.)

Also view `evidence/sc372-small-120.png` and `evidence/sc372-control-120.png` and say whether the AFTER halves look right (no wrapping badge, no text bigger than its container).

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r4-rereview-report.md, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, finding counts by severity). Findings by severity with file:line, failure scenario, and prescribed fix.

## 4. Return contract
Final text → ticket-owner: verdict, counts, measured gate numbers, absolute artifact paths. No prose.

## 5. Footguns
- Report write blocked → return inline.
- Never key a wait-loop on a scratch filename/contents; read the process's own output or a per-run unique path.
- Redirect long output to files; gates in the FOREGROUND (≤600000 ms); never end your turn waiting on a background job.
- Devbox `bash -c 'cd /abs && cmd > /abs/log 2>&1'`; it eats exit codes; read summary lines.
- `git -C <absolute path>` always.
- No `pkill` by pattern; only PIDs containing `worktrees/sc372-textscale/`.
- Never touch the shared freeze baseline; never rm anything in `.superpowers/` outside `sc372-textscale/`.
- You cannot SendMessage me; NEEDS_CONTEXT → end your turn with the question; any message you send starts with `SC-372:`.

# SC-338 round 2 — scoped re-review brief (delta only)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/decisions.md` ("Owner rulings on r1 review").
- Your own r1 report: `…/sc338-r1-review-report.md`. The fix brief: `…/sc338-brief-r2-fix.md`. Fix report: `…/sc338-r2-fix-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus`. Review ONLY the delta: dse `7177033..c19069a (net r2+r3+r3b)`,
  superproject `74a71c7..00ada4b (or later, see report)`. Do not edit the branch; revert any probe byte-clean.
- You never call Linear. Process-kill rule: kill only PIDs whose command line contains `worktrees/sc338-chip-focus/`
  (`pgrep -af "worktrees/sc338-chip-focus/"`); never pkill by pattern.

Probe (execute, don't just read):
NOTE: r2 folded `.dse-swatch` into the fix; the owner then REVERTED it in r3 (ledger ruling R-r3; split to SC-361). The net
delta since your r1 review should therefore be comments + docs only. VERIFY that: no `.dse-swatch` selector, list membership or
test assertion survives anywhere in the dse diff `6c4f6aa..HEAD`, and the guard tests are byte-identical to r1 `7177033`.
1. The swatches behave exactly as on base `6c4f6aa` (real Obsidian spot-check: focused unpressed swatch still shows only the
   host grey halo, i.e. unchanged — this is SC-361's job now).
2. `evidence-r2/sc338-grid-rest.png` is a real base-vs-branch capture (not a simulation), labeled in text; spot-check one cell
   against your own r1 rest probe. `evidence-r1/sc338-chip-focus-grid.png` still matches the final head's chip pixels.
3. Source comments describe current code accurately, without process narration.
4. CHANGELOG + dse-verify wording is accurate (numbers match what you measure).
5. Gates: re-run jest, shots (host-leak line), freeze (expect 260/260), parity (0/0/16), camera modal-montage-edit + limits.

Report `…/sc338-chip-focus/sc338-r2-rereview-report.md`, ≤10-line executive summary first, verdict APPROVE / CHANGES-REQUIRED,
findings by severity with file:line. Final text to the ticket-owner: verdict, findings one line each, gate lines, report path.
Foreground only, per-run unique output files. If you need input end with STATUS: NEEDS_CONTEXT; any message starts `SC-338:`.

# SC-481 r5 — scoped re-review of the r4 fix-round delta

You (R3) reviewed r2 at d250e97 (your report: `sc481-r3-review-report.md`). The implementer has now addressed your findings. Review **only the delta** `d250e97..2c5887f` (use `git range-diff` if it was rebased). Final text goes to the ticket-owner. **Workers never call the tracker.**

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md` (r3 rulings).
- Fix brief: `sc481-brief-r4-fix.md`; fix report: `sc481-r4-fix-report.md` (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin `2c5887f` on ``4deb8cf``, superproject `3e74be1c`. Do not commit; leave `git status --short` empty (the unstaged submodule pointer in the superproject is expected).

## Task — execute and probe
1. HIGH-1: re-run your quote and callout twin probes (form Save upper then lower click → names; adoption off → wrong value / wrong-block write) in Reading view and Live Preview. All must be correct on HEAD.
2. MEDIUM-1: callout twins, default, upper click → no parse-error card, both cards correct.
3. LOW-1: confirm your mutant md (delete the lastWriteLine skip) is now caught by jest.
4. Confirm the new G-S53 quote/callout phases FAIL on d250e97 and 4deb8cf bundles and PASS on HEAD; re-try the r4 mutations.
5. Regression sweep of the delta: plain-fence twins (G-S53 base phases), different-body blocks 0 extra draws, nested/window sections that are NOT twins (a single counter in a callout, a quote with two different counters) get no extra remounts.
6. Owner ruling (verbatim, ledger 2026-11-01): "LP callout twins: SPLIT — filed SC-537 … Out of scope for SC-481". So Live Preview CALLOUT twins are expected to stay as on base — do not report that as a finding. DO verify (a) LP callout twins on HEAD behave exactly as on 4deb8cf (no worse: no error card, no new vanish, no extra wrong writes), and (b) LP plain-fence twins (G-S53 LP phase) are still fixed.
7. The drive-by `locateInSection` → `locateInSectionLines` split must be behavior-neutral (SC-455 write paths: quote/callout writes still land in the right fence). Check the CHANGELOG wording in the superproject is accurate for what HEAD does.
8. Re-run tsc, lint, jest, both lifecycle halves; spot-check e2e/shots/freeze/parity logs from r4 (re-run e2e if the delta could affect it).
Expected: tsc/lint clean · jest 6168 / 1 skipped · lifecycle 42/42 · e2e 124/124 87/87 · shots 592 0 FAIL 157/942 · freeze 280/280 · parity 0/0/24.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r5-rereview-report.md`, ≤10-line executive summary (LAND-READY / NOT), findings by severity with file:line, logs as `sc481-r5-*.log`. Return raw facts + absolute paths of every artifact.

## Footguns
Same as your r3 brief (`sc481-brief-r3-review.md` "Footguns" section) — all apply: foreground runs under 600 s, `devbox run -c <abs>`, `git -C`, no `cd &&`, Write tool for scratch, no variable/glob `rm`, kill only own PIDs, unique `DSE_LIFECYCLE_PORT`, private scratch `sc481-r5-review-<agentId>/`, NEEDS_CONTEXT instead of messaging, any message starts with `SC-481:`.

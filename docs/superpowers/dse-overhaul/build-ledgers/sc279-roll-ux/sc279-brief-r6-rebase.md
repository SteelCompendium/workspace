# SC-279 round 6 — rebase onto SC-406 + battery (implementer, resume)

DSE `origin/develop` moved `f8693b5` → `05a6ff3` (SC-406: experimental `data.json` switch, deferred-surface gating — touches `src/elements/roll/definition.ts` — legacy sync command removed). Freeze baseline unchanged at 274/274 by that landing.
Files both sides touched: `CHANGELOG.md`, `styles-source.css`, `visual-harness/entry.ts`.

1. `git -C /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements fetch origin`, then `git -C … rebase origin/develop` (expect base `05a6ff3`). Resolve conflicts keeping BOTH sides' intent; for CHANGELOG keep both entries under `## Unreleased`. `npm ci` if package.json changed.
2. Check ds-roll under SC-406 gating: the harness `roll` fixture + your new `roll-expanded*` shots must still render the strip (if the harness needs the experimental switch on for deferred elements, follow how SC-406 handled other deferred fixtures — do not invent a new mechanism). Card shots (`feature-rolled*`) must be unaffected.
3. If r5 re-review returned findings, I will send them separately — this round is ONLY the rebase.
4. Full dse-verify battery, parity last. Expected at new base: read the "CURRENT" numbers in the dse-verify SKILL.md (SC-406 may have updated them; if it did not, base = jest 4367+SC-406's tests — report what you measure, and run the battery once on a detached `origin/develop` clean checkout ONLY if a number looks off and you need the base to compare). Branch expectation: shots = base + 12, 0 FAIL; freeze = exactly the 2 roll print mismatches; if their hashes changed, regenerate `sc279-rebaseline.txt` (2 deterministic runs) and say so; parity 0/0/24 (or base's declared count if SC-406 changed it).
5. Report `sc279-r6-rebase.md` (≤10-line exec summary: new head sha, base sha, conflicts + how resolved, every gate number, rebaseline changed y/n). Final text: raw facts + paths.
Footguns as in the r2 brief (foreground gates; files not streams; devbox wrap & exit codes; `git -C` only; PID-only kills within `worktrees/sc279-roll-ux/`; never edit freeze-baseline.sha256; never rm -rf `.superpowers/` beyond sc279- files; never Linear; never push; NEEDS_CONTEXT instead of messaging, stray message first word `SC-279:`).

## Added after r5 (ledger "r5 re-review rulings") — fold into this round, after the rebase:
- r5 LOW-1: add the statblock villain-band roll-isolation test to `feature-roll.test.ts` (shape in `sc279-r5-rereview.md`, LOW-1); prove it fails with `statblock/view.ts` reverted to the pre-HIGH-1 version.
- r5 INFO-3: wrap the long DESIGN.md carve-out line (worktree superproject copy only) to the file's usual line width.
Everything else in r5 is out of scope (SC-410 hit-row fill is filed separately — do not touch).

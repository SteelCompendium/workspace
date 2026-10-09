# SC-127 round 10 — scoped re-review of the round-9 + 9b delta ONLY

You are the SC-127 reviewer (rounds 4/6/8), resumed. Review only the delta since the tree
you reviewed in round 8 (dse `4c05379` on `619c4bd`): the four r9 commits (accent formulas,
sentinel-accent generation + second in-run pass, manifest-based jest, `lightDefault`
return + jest-tested comparison helpers) and the r9b rebase onto `origin/develop`
`9ded832` (develop moved twice mid-round; 0 conflicts). The r9 report names the final shas; the ledger's 2026-09-25 and
2026-09-29 entries are the rulings. Foreground only, output to `sc127-r10-*` files; restore
every probe; no commits; no tracker.

Check with your own probes:
1. MED-B: every accent-derived token in the generated block is a formula over
   `var(--accent-h/s/l)`; under a red accent (`0 / 80% / 45%`) the dark twin's restated
   custom properties AND a rendered checkbox/tag colour equal the light twin's and
   realprint's. The non-default-accent in-run pass can-fail (bake one literal → DRIFTED)
   while the default-accent pass stays clean — the exact way the regression hid.
2. The two guard bugs r9 found in itself: the default-accent pass now compares like with
   like (`lightDefault`, a resolved value, not formula text); a missing/wrong-shaped map
   fails in jest (`obsidianLightIslandCompare.test.ts`) — can-fail one helper test; a
   guard exception can no longer surface as a generic "sweep exception" (or say that it
   still can, with the line).
3. LOW-C: the manifest-based jest test compares names AND values incl. mapping-only tokens
   (can-fail both), never skips in CI (how?), and the sheet comment is now true.
4. LOW-D: the three submodules match their pins; `git status --short` empty.
5. Rebase integrity: `git diff` of the branch vs `dfb7395` touches only SC-127 files;
   conflict resolutions in `styles-source.css` / `shoot.mjs` preserved both sides
   (spot-check the neighbouring tickets' rules still exist); generator `--check` clean.
6. Battery at the final sha (expect jest ≥ 4072 + develop's growth; shots 524 or develop's
   new count; freeze EXACTLY 131 twin FAILED / 0 realprint / 0 missing against the
   262-line baseline; parity 0/0/24 DECLARED — grown by unrelated landings, exit 0 is the contract); screen combos 0 moved vs `9ded832`; realprint 0
   moved; your own two clean sweeps reproduce `sc127-rebaseline.txt` (131 lines) byte for
   byte; scratch-apply → `freeze OK (262/262)`.
7. Commit hygiene; superproject points at the final dse sha and carries the CHANGELOG +
   SKILL.md edits (SKILL.md's newer rebaseline records intact).

Report `sc127-r10-rereview-report.md`, ≤10-line executive summary first (verdict
APPROVE / FIX ROUND; per-finding closed y/n; battery; realprint moved; rebaseline
verified). Final text: raw facts and paths.

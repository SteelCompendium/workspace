# SC-621 r5 — scoped re-review of the r4 delta (reviewer C, resumed)

Context: the ledger's "owner rulings on r3" (your findings, as ruled) and the r4 report `sc621-r4-fix-report.md` in
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/. Common brief (baseline now b1e4f027, SC-568 landed: test/ + jest.config only) still binds.
Do not commit; probe in scratch exports. Workers never call the tracker.

Scope — the DELTA only, not a fresh full pass:
1. `sc621-r4-range-diff*.txt` (or regenerate `git range-diff 14521bf0..56ad4d1c b1e4f027..96955985`): the rule code (`rebaseCardPin` gate)
   is byte-identical to what you reviewed; the only changes are the rebase (incl. any conflict resolution against SC-568's test/dom/_settleVaultReads.ts / reading-mode-host-pin changes — check those resolutions), comments, CHANGELOG, and G-S115 dead-code removal.
2. LOW-1..LOW-4 + the owner's "often not redrawn" note: each folded as ruled, wording true and plain.
3. G-S115 after the dead-code removal: still 9 cells; run lifecycle part 7 (`G-S108,G-S112,G-S115`) on a scratch export of the r4 head
   (`DSE_LIFECYCLE_BUNDLE` as you did), and once on a b1e4f027 base bundle G-S115 alone: (a)-(f) still red there.
4. jest: the twin + sweep files on the r4 head (and the full suite once if the host load allows; SC-624 flake at reading-mode-host-pin:682 is
   out of scope — re-run alone if it fires).
5. Superproject branch: ONE CHANGELOG commit on current workspace origin/main, no pointer commit.
6. Skill proposal numbers match r4's logs.
7. r4 switched the twin + sweep suites to SC-568's `settleVaultReads` and changed the sweep's per-cell cleanup from `jest.restoreAllMocks()` to
   `cacheSpy.mockRestore()` (commit 96955985): check no spy or mock leaks across cells / into other suites, and that the settle is not vacuous
   (e.g. a mutant that makes settle a no-op, or reverts the fix, still fails).

r4 head: dse 96955985 on b1e4f027 (8 commits); superproject ad3ae246 on workspace origin/main e7e34279.

Report `sc621-r5-rereview-report.md` (<=10-line exec summary, verdict LAND/FIX, findings by severity with file:line). Raw facts + artifact
paths in your final text.

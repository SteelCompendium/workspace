# SC-540 r4 brief — scoped re-review of the r3 delta (reviewer, resumed)

Context: `decisions.md` (r2 rulings + r3 entries) and `sc540-r3-fix-report.md` in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/`. Workers never call the tracker. Same rules as `sc540-brief-r1-impl.md` §4 (one blocking foreground call per gate, `devbox run -c <abs path>`, no `cd … &&`, `git -C`, private scratch `…/scratchpad/sc540-r4-review-<suffix>/`, no variable/glob rm, no pkill by pattern, unique lifecycle port e.g. 9547, no commits on the branch).

Scope — the DELTA only, not a fresh full pass:
1. `git range-diff eaf64ba6..992375b6 423e798d..31b6235b`: confirm the r1 commits are unchanged apart from conflict resolution; review the new commit(s) line by line.
2. HIGH-1 closed in real Obsidian LP on HEAD: ds-initiative Advance round and ds-project Add project roll in a callout (card, selection unmoved, written); Advance round in an LP embed (embed not selected). Re-check your r2 guards on HEAD briefly: + in callout, callout text still enters source, links plain + Ctrl, checkbox, Reading view unmarked.
3. The new climb-to-detached-top code: can it mark anything that is NOT a detached DSE subtree (e.g. a target re-parented elsewhere in the live DOM, a target in a different leaf/popout, a target that is the document)? Probe or reason with evidence.
4. G-S62 (g)/(h) FAIL on 992375b6, PASS on HEAD; the Reading-view phase FAILs on your "mark every `.callout`" mutant. Jest pin red on 992375b6 source.
5. Gates: lifecycle part 3 (`--only` the 10-id list) and e2e on HEAD; trust the implementer's other gate numbers unless something looks off. Expected: lifecycle part 3 10/10; e2e 124/124 0 known-bug 87/87.

Report: `sc540-r4-rereview-report.md` in the ledger dir, ≤10-line executive summary first (verdict LAND / FIX, findings by severity with file:line). Return raw facts + artifact paths. You cannot SendMessage me; for input end with STATUS: NEEDS_CONTEXT. Stray messages start with `SC-540:`.

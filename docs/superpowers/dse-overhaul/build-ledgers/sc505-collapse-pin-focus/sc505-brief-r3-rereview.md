# SC-505 r3 scoped re-review brief (reviewer B, resumed)

- Read the ledger's 2026-10-24 entries and `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r3-fix-report.md` (claims to verify).
- Scope: the r3 delta only — the rebase onto 7046eb0+ (range-diff efc17de..3717849 vs 7046eb0..rebased head; SC-494 touched block write-back + reserved keys — check the Pin write path and wrote-detection: all `=`, or judge any hand-resolved conflict) and the LOW-A / LOW-B / INFO-1 commits.
- Verify: RV-P17A/B (double embed in one pane) now keep focus on the pressed embed's Pin; RV-P07B, RV-P13, RV-P16 still pass; your RC mutation (no focusin listener) now turns a committed e2e red (CHR-F07); every claim/disarm branch the implementer kept goes red when removed (mutate each), and anything removed was truly redundant. New tests red on 3717849.
- Gates on head: tsc, lint, jest, e2e (full), lifecycle. Shots/freeze/parity only if the delta touches CSS, rendering or harness — say which you ran. Expected: jest 6043 + r3 new / 1 / 244 of 245; e2e 120 + r3 new, 0 failed, 0 known-bug, 84/84 + new; lifecycle 36/36.
- Same rules as before (no commits to the branch, throwaway worktree, new private scratch folder `sc505-r3-rereview-<4 chars>/`, fresh log names, no rm with variable targets, no glob rm, no background gates).
- Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r3-rereview-report.md`, ≤10-line summary first. Return raw facts + artifact paths.

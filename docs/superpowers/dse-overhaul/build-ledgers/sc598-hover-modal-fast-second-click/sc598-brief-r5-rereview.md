# SC-598 r5 brief — scoped re-review of the r4 delta (orchestration:reviewer, R1 resumed)

Same rules and footguns as your r3 brief (`sc598-brief-r3-review.md` §3; private scratch `.../scratchpad/sc598-r5-R1/`; edit nothing in the worktree; no tracker). Replacement-ready: a fresh reviewer reads the ledger (O13), `sc598-r3-review-report.md` (MEDIUM-1, LOW-1) and `sc598-r4-fix-report.md`.

Scope: the r4 delta only — dse `47950f45..eafbcce5` (and any range-diff if it was rebased) plus superproject ``7cb0fdaf` (2 commits on `e9ff3635`)` against workspace `origin/main`.

Check:
1. R14 as built matches O13 exactly; the doc comment is accurate.
2. In real Obsidian 1.15.1: your MEDIUM-1 gesture (open, Escape, re-open from the same preview by a press on "15", title press 1 ms and ~100 ms later) — no `.cm-editor`, focus not in the preview, Escape closes only the window, an outside click then closes the preview; RV and LP. A first open (G-S91's original trials) still green.
3. The new G-S91 `reopen rv` trial: red on your own `e0e49d4d` build, green on head; it asserts what its name says. Part 5 wall time ≤ ~420 s (re-run part 5).
4. The rewritten `.is-editing` jest test and the new mutants: kill the two R14 mutants (drop the `.is-editing` preventDefault; send the synthetic click for `.is-editing` too) in jest and/or G-S91.
5. jest 7317 passed / 2 skipped (I1: one test rewritten, count unchanged); e2e `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (RECOV-R07 real); styles sha `5e5ff488…`.
6. Superproject branch rebases/merges cleanly onto current workspace `origin/main`; CHANGELOG `## Unreleased` keeps SC-588's bullet and carries O13's text verbatim.
7. dse-verify proposal: INFO-6 clause present, R14 reflected, ready to apply.

Report: `sc598-r5-rereview-report.md` in the ledger dir, ≤10-line executive summary first (verdict LAND / FIX FIRST, severity counts, numbers measured). Evidence prefixed `sc598-r5-`. Final text: raw facts plus absolute paths of every evidence file.

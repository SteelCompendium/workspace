# SC-625 r4 — scoped re-review of the r3 delta (r2 reviewer resumed)

You reviewed r1 (`78d8658f`) in r2. Review ONLY what r3 changed. Context: ledger `decisions.md` (r2 rulings, the
superseded placement ruling, the baseline move to dse `8a81c5a7` / workspace main `8dd3c4a4`), the r3 brief
`sc625-r3-fix-brief.md` and the r3 report `sc625-r3-fix-report.md`, all in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc625-montage-unknown-yaml-keys/`. **You never call the tracker.**
Same worktree; same footguns as your r2 brief §3 (scratch dir `.../scratchpad/sc625-r4-rereview/`; no `rm` in /tmp or
the scratchpad; devbox script files; `git -C <abs>`; no pattern kills; never wait on a notification).

Check:
1. Rebase: the dse branch sits on `8a81c5a7` (`git merge-base --is-ancestor`), the montage `src/` diff vs base is the
   r1 fix plus r3's comment only (`git diff 8a81c5a7..HEAD -- src/`), and the e2e manifest conflict resolution kept
   both SC-439's rows and SC-625's (no dropped row, no duplicate id, coverage Y/Y).
2. Each fold matches its ruling (L-1 comment + integer-key unit test; L-2 CHANGELOG wording; L-3 six write-path rows +
   hostile keys `constructor` / `toString` / `hasOwnProperty` at both levels; I-3 two e2e tests from R2P-01/02 with
   free ids; I-5 comment). The new tests that should fail on base do (stash `src/` to `8a81c5a7`).
3. Superproject: `git -C <wt> log --oneline origin/main..HEAD` is exactly two commits (CHANGELOG, pointer bump), on
   current `origin/main`; the bump changes only the `draw-steel-elements` gitlink, to the final dse head; no
   `Co-Authored-By` or AI attribution in any commit on either branch.
4. Re-run e2e and jest yourself on the final head (lifecycle only if r3 touched `src/` beyond comments, or if r3's
   lifecycle evidence is missing or not seven `--only=` parts). Expected: from the r3 report; base numbers at
   `8a81c5a7`: jest 12552/1 with the shots cache (fresh 12551/2), e2e `478/500 ok, 0 failed, 22 known-bug, 287/287`.
5. `sc625-skill-proposal.md` is correct against what you measured.

Report: `sc625-r4-rereview-report.md` in the ledger dir, ≤10-line executive summary first (LAND-READY / FIX-NEEDED,
findings by severity with file:line, measured numbers). Final text to the ticket-owner: raw facts + artifact paths.
If blocked, end with `STATUS: NEEDS_CONTEXT`.

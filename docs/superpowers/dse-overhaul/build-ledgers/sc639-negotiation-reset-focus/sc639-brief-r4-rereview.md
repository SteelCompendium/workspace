# SC-639 r4 scoped re-review (resume of the r2 reviewer) — the r3 delta only

You reviewed 8ef9b641 in r2 (verdict LAND, LOW-1 + LOW-2). r3 folded both, rebased onto dse develop 5f962390 (SC-631 + SC-649 landed) and made the
superproject commits. Review the DELTA only, not a fresh full pass.

Read: the ledger (`decisions.md`) and `sc639-r3-implementer-report.md` in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/`.

Check:
1. Rebase fidelity: `git -C <plugin> range-diff e1be1775..8ef9b641 5f962390..<r3 head>` — the r1 commits are unchanged
   except for conflict resolution (report any); new commits are only the LOW-1/LOW-2 tests and driver changes.
2. LOW-1: NEGO-F08 / NEGO-L09 exist, run the mouse-from-seal path in real Obsidian (not focusByScript into the menu),
   and assert `{ inCard: true, ctl: 'negotiation.menu' }`; they go red with the restore-unconditionally-off mutant
   you used in r2 (or with view.ts reverted). Ids unique; no bracketed ticket id in titles.
3. LOW-2: `ring` reads `:focus-visible`; F01, L03, F08, L09 assert `ring: true`. r3 reports the `ring: false` mutant
   SURVIVES the e2e (script focus after an earlier key press shows the ring anyway) and is instead pinned by a new jsdom
   test that spies `focus()` options. Run the mutant yourself against jest and confirm that test goes red and is
   non-vacuous; then restore. Judge whether the e2e ring assertions are still worth keeping.
4. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus log --oneline origin/main..HEAD`
   shows exactly TWO commits on current workspace origin/main (fetch first): the CHANGELOG commit (one bullet under
   `## Unreleased`, at the top, accurate to the shipped behaviour) and ONE pointer bump whose gitlink equals the
   final plugin head. No interim pointer commits. Commit messages carry no co-author / AI attribution.
5. SC-649 overlap: on the rebase onto 5f962390, check the conflict resolutions in `e2e/driver/negotiation.ts` and `test/dom/elements/negotiation-bugs.test.ts` keep both sides (SC-649 tests intact).
6. Re-run jest fresh and the full e2e on the final head. Expected (r3-reported): plugin head a9f0af1d, superproject 6f657662 on origin/main f97c41bc; jest 13354 passed / 1 skipped with shots cache (13353 / 2 fresh); e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`.

Footguns: `git -C <abs path>` only; `devbox run -c <plugin abs path> -- bash <script>`; private scratch
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r4-a4a46cd240c97ef4f/`;
**never `rm`/`rmdir` anything in /tmp or the scratchpad**; never pkill by pattern; one blocking foreground call per gate;
leave the branch exactly as found. Never touch the tracker.

Report: `sc639-r4-rereview-report.md` in the ledger dir, ≤10-line executive summary first (inline if blocked). Final text:
verdict, findings by severity with file:line, measured numbers, evidence paths.

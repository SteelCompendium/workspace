# SC-568 r4 — scoped re-review of the r3 fix round (resume of the r2b reviewer)

Scope: ONLY the fix-round delta. Read `sc568-r3-report.md` (same dir) and the ledger's
"r2b review DONE" rulings entry. The branch is now rebased onto dse develop `9b94baf2`; review
`git -C /home/scott/code/steelCompendium/worktrees/sc568-jest-load-timeouts/draw-steel-elements diff <pre-fix sha from r3 report>..<last fix commit>`
(fix commits only, pre-rebase if the report lists them; else the range-diff), plus any rebase-time
conflict resolutions and any SC-586-test changes the r3 report names.

Concretely: head `2be69b95` on `9b94baf2`; the r3 fix commits are `b09e73c3..2be69b95`
(4 commits); the r1 commits beneath were only rebased. Check `git range-diff` for the r1 part
only if something looks off.

**Owner's specific question on LOW-3:** the implementer reports that replacing the new helper
`test/dom/_settleVaultReads.ts` with a no-op still passes all 169 tests, i.e. the "rebase finished
before the outside edit" precondition is still not ASSERTED. Your LOW-3 prescription was "poll
until `pin.lineStart` reaches the expected note line, with a bound, and assert it". Judge whether
what landed meets it; if not, say exactly what to change (file:line, the assertion), or whether
the precondition is genuinely unobservable and a drain-wait is the right floor.

Check:
1. MEDIUM-1, MEDIUM-2, LOW-3: re-run YOUR mutants (`.../scratchpad/sc568-r2b-rev/mut.sh` /
   `mutall.sh`) against the new head: each mutant the base `9b94baf2` catches, the branch must
   catch. Use your br/base scratch worktrees moved to the new shas (`git -C <wt> checkout --detach <sha>`),
   with `--testPathIgnorePatterns=zzsc568r2`.
2. LOW-4, INFO-5, INFO-7: applied as prescribed.
3. LOW-3: the waits poll an observable condition with a bound and assert it; no vacuity (precondition
   genuinely checked: show a mutant where the precondition fails reddens the test).
4. One contention run `taskset -c 0 npx jest -w 11` on the new head: 0 failed.
5. INFO-8: `sc568-skill-proposal.md` now accurate.
6. Bundle identity vs a `9b94baf2` build and no `src/`/`e2e/`/`visual-harness/` in the diff.

Report: `.../sc568-jest-load-timeouts/sc568-r4-rereview.md` (≤10-line exec summary first),
logs in `.../scratchpad/sc568-r2b-rev/logs/r4-*` (unique names). Verdict LAND-READY or FIX-ROUND,
findings by severity with file:line. Same footguns as before: no `rm` of any kind (`git clean -fqX`
for ignored bundles), no commits to the branch, never touch the tracker or main checkout, no
pattern kills, blocking foreground calls, `STATUS: NEEDS_CONTEXT` if blocked.

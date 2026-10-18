# SC-408 review round R3: scoped re-review of fix round F2 and the rebase

You did not write any of this code. Review **the delta only**, not the whole pilot. Two
independent reviews (R1, R2) already passed the pilot as land-ready at the pre-rebase head `1a33560`.

## 0. Context

1. Read the ledger `decisions.md` (same dir). Read "Scott's rulings" (verbatim) and the newest
   entries, from "Acting on Scott's rulings" through "F2 done".
2. Read the F2 brief `sc408-brief-fix2.md` and the author's report `sc408-fix2-report.md`.
3. DSE worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `a066544`, rebased onto `origin/develop` = `566888a`. The
   pre-rebase head `1a33560` still exists as an object. The superproject worktree
   `/home/scott/code/steelCompendium/worktrees/sc408-functest` has commits `279895b`, `74795d7`
   and `d72c46b` on top of `6e1427b`, plus an UNCOMMITTED submodule pointer: leave it as found.
4. Workers never call the tracker.

## 1. Execute and probe

1. **Rebase integrity.** Run `git range-diff be4f002..1a33560 566888a..cc05e7d`. Every pre-rebase
   commit must be present and unchanged in substance, apart from the `package-lock.json`
   resolution. In `package-lock.json` (`566888a` vs `a066544`), confirm no package that existed
   at `566888a` changed version, integrity or flags, and that only the e2e devDeps were added.
2. **F2 markers.** Each new `knownBug('SC-432'|'SC-433', …)` / `test.failing` asserts the RULED
   behaviour from the ledger, and fails today for that reason only. Locally simulate the fix in
   `src/` (revert byte-clean afterwards):
   - (a) disable Spend Recovery for creatures. The SC-432 markers must flip to "appears fixed" or
     fail. The no-pool-hero pins must not change.
   - (b) make the temp stepper a direct set. The SC-433 markers must flip, and the plain driver
     `[STAM-T11]` must stay green.
   Report which tests moved in each case.
3. **Coverage gate.** A full run reports 47/47 with every pair keeping a plain driver.
4. **Docs.** The dse-verify skill, PROJECT.md §4, DSE `AGENTS.md` and `e2e/README.md` say e2e is
   required to land any DSE change. Expected numbers match the measured ones. Nothing in them
   contradicts the rest of the skill.
5. **Battery** (dse-verify order, `rm -f main.js styles.css` before jest, lifecycle on
   `DSE_LIFECYCLE_PORT=9308`): tsc, lint, jest, lifecycle, `npm run e2e` ×3 at `--shards=4`,
   shots, freeze (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/visual-harness/shots`),
   parity last. Compare with the author's numbers: jest 4720 / 1 / 226 of 227, lifecycle 25/25,
   e2e 59 ok + 12 known-bug of 71, coverage 47/47, shots 572, freeze 276/276, parity 0/0/24.
   Also run jest at `566888a` in a scratch checkout (`git worktree add` under `/tmp`, removed
   afterwards) to confirm the 4718 baseline the author inferred.

Never `--headed` on DISPLAY `:1`. Kill only PIDs you spawned. Leave both worktrees byte-clean
(the superproject pointer stays as found) and say so.

## 2. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-r3-review.md`. Open
with an executive summary of at most 10 lines: the verdict (land-ready or another fix round),
counts by severity, the range-diff result, the simulated-fix results, and the battery numbers.
Then list findings (HIGH / MEDIUM / LOW / INFO), each with `file:line`, a failure scenario and a
prescribed fix.

Return contract: your final text goes to the ticket-owner, not a human. Give raw facts, numbers,
and the absolute path of every artifact. If the report write is blocked, return it inline.
Redirect long output to files. Run gates in the foreground; never background a job and wait for a
notification. Never key a wait on a scratch filename. You cannot message me; if you need input,
end with `STATUS: NEEDS_CONTEXT`.

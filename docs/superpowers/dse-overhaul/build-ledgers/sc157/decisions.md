# SC-157 — decisions ledger

Ticket: SC-157 "v2 site drops "With Captain" from statblock secondary stats — captained
minions never show it"
Worktree: `/home/scott/code/steelCompendium/worktrees/sc157-with-captain` (submodule
`steel-etl` on branch `sc157-with-captain`)
Tracked branch for `steel-etl`: `main`.

## Rulings (verbatim, dated)

### 2026-08-29 — Scott (comment on SC-157)

> approved, add the test, land the fix.

Context for the ruling: the 2026-08-23 investigation report (`sc157-report.md`) found the
production bug was already fixed on `main` by steel-etl commit `68887ab` (2026-07-18),
before the ticket was filed. The only delta on the branch is the regression test
`TestCaptainedMinion_EndToEnd` in `internal/site/statblock_page_test.go` (commit `091d0bc`,
test-only, +70 lines), proven red with the fix disabled and green with it restored
(`evidence/test-red.txt`, `evidence/test-green.txt`). "the fix" in the ruling therefore
means: land the test-only branch and close the ticket as already-fixed.

## Owner rulings

### 2026-09-04 — ticket-owner

- Branch is 5 commits behind `steel-etl` `origin/main` (`c7d6940`). Rebase before landing;
  re-run `go build ./... && go vet ./... && go test ./...`; re-prove red/green on the rebased
  tree so the test is known non-vacuous against current `main`.
- No CHANGELOG entry: the branch is test-only; the user-facing fix shipped 2026-07-18.

### 2026-09-04 — round 2 result (implementer)

Rebased cleanly onto `c7d6940`; head `d6bb008` (same single test-only commit). Gates exit 0
(8 ok / 0 FAIL). Red/green re-proven on the rebased tree (`evidence/sc157-r2-test-red.txt`
exit=1, `sc157-r2-test-green.txt` exit=0). Test asserts label + real value
(`+1 damage bonus to strikes`) in both `.sb__meta` and `.sb__sticky-row2`. No follow-ups.
Owner verified head/base/diff/evidence independently. **LAND-READY** reported to dispatcher.
Skipped a separate Opus review: test-only delta, Scott already approved it, and the round-2
implementer (a different identity from the author) did the scoped non-vacuity check.

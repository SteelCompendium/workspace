# SC-408 review round R2 — scoped re-review of fix round F1

You reviewed the pilot in R1 (`sc408-r1-review.md`). The author has now addressed your
findings in fix round F1. Review **the delta only** — not a fresh full pass.

## 0. Context

1. The ledger `decisions.md`, newest entry "Review R1 … Rulings" — what was folded, carried
   or dropped (L-4 → rollout; M-1 fix 4 and I-5 dropped; I-1/I-4 no action).
2. The fix brief `sc408-brief-fix1.md` and the author's report `sc408-fix1-report.md`
   (executive summary first).
3. Worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   diff `52f0099..1a33560`; superproject skill-docs commit `6e1427b` (after `85216b6`) on branch
   `sc408-functest`. Workers never call the tracker.

## 1. Execute and probe

1. **Per finding**: confirm each folded finding is actually fixed — re-run your own R1 probe
   where you had one (the `it.skip` probe, the stale-toast probe, a loose-pin "fails
   differently" probe, the coverage-without-driving probe, a wrong-block write).
2. **M-1 flake**: run ≥20 full `npm run e2e` runs at `--shards=4` with a parallel `npx jest`
   load on at least 5 of them; 0 failures expected. Any failure is a finding.
3. **Bite**: the new checks (M-2 pre-scan, L-2 known-bug-only gate, L-3 non-target fence
   check) fail when they should, and do not false-positive on the shipped specs.
4. **SC-431 marker**: STAM-S06 is a `knownBug('SC-431', …)` asserting the intended behaviour
   (first Escape reverts only the draft, modal stays open with the Damage pending; second Escape
   closes with no write) and is recorded as known-bug, not ok.
5. **STAM-R1X** catches your M29.
6. **Regressions from the delta**: re-run 4–6 of your R1 mutations that e2e caught (incl. M04
   and M21) to confirm the e2e layer still catches them after the driver changes (L-2's
   `press()` focus assertion and record-after-action could change behaviour).
7. **Battery**: tsc, lint (now covers `e2e/`), jest (`rm -f main.js styles.css` first),
   lifecycle (`DSE_LIFECYCLE_PORT=9308`), shots, freeze, parity — compare to the author's
   numbers.
8. **SIGINT** to run.mjs mid-run still leaves 0 survivors (I-2 touched the reaper).
9. **One sample failure bundle for the ticket owner**: apply one mutation that e2e catches
   (e.g. M04 Escape writes), run that one element, and copy the failure bundle's screenshot
   and summary to `/tmp/claude-1000/sc408-r2/sample-bundle/`; revert. Name the screenshot path
   in your return.

Leave both worktrees byte-clean (the pre-existing uncommitted superproject pointer stays as you
find it) and say so.

## 2. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-r2-review.md`,
opening with a ≤10-line executive summary: verdict (land-ready / another fix round), counts by
severity, per-finding confirmed/not, flake-run result, battery numbers. Then findings (HIGH /
MEDIUM / LOW / INFO) with `file:line`, failure scenario, prescribed fix.

Return contract: final text to the ticket-owner, not a human — raw facts, numbers, absolute
paths of every artifact. If the report write is blocked, return it inline. Redirect long output
to files; run gates in the foreground. Never key a wait on a scratch filename. You cannot message
me; if you need input, end with `STATUS: NEEDS_CONTEXT`.

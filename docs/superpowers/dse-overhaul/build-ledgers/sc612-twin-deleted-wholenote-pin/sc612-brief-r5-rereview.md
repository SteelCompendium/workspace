# SC-612 r5 — scoped re-review of the r4 delta (resume of reviewer-r3)

Read: the ledger section "owner rulings on r3" (decisions.md), the r4 brief (sc612-brief-r4-fix.md) and the r4 report (sc612-r4-fix-report.md), same dir. Common brief still binding (gates, footguns, return contract).

Scope: the delta only, r4 tip a06dba37 on base 1516f894 (rebased from c0995beb, so use `git -C <dse> range-diff c0995beb..1a8f624c 1516f894..a06dba37` and read the rule diff itself); superproject d9bca0ec on 4cfac4bf plus the superproject CHANGELOG change. Not a fresh full pass.

Check, executing not just reading:
- Rule P is your prototype's rule in production form: capped Myers, unique minimum equals the head-map line, deleted option counted, give-up keeps today's behaviour, twin gate kept, strictPins tail-first check kept. Look for an off-by-one in the placement ranges (`[s, e]`, `qe`), an unterminated trailing fence, CRLF, and the cap path (a twin note with a >400-line edit: what happens, and is it the documented residual).
- Re-run your fuzz (`sc612-r3-fuzz.test.ts.txt`, all three seeds) and the named repro on the r4 tip: twinned-ambiguous writes 0, unambiguous new refusals 0, corrupt writes 0.
- Real Obsidian: your H1 probe (`sc612-r3-obsidian-h1-probe-tip.log` setup) on the r4 bundle: all four cells refused with one Notice.
- r4 says the last two commits (comments / titles) were not run through the full battery: confirm they change no code.
- r4 deviation (ledger, accepted): LOW-3's pasted-closed-copy over an unterminated trailing fence is refused, not saved. Confirm base wrote the copy there.
- The new tests are not vacuous: red on c0995beb where claimed; a P mutant or two die.
- Timing inside `vault.process` acceptable (compare to your r3 numbers).
- Each r3 finding: fixed / not fixed, one line each. New findings by severity with file:line.
Re-run jest full and lifecycle part 7; others only if the delta suggests it.

Report: sc612-r5-rereview-report.md (<=10-line executive summary; verdict LAND / FIX). `git status --porcelain` empty in dse at the end; do not commit. Final text: verdict, finding table, numbers, artifact paths. Raw facts.

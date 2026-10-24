# SC-494 r2 — scoped re-review of the fix-round delta

You reviewed r1 (13b5df6) LAND-READY with LOW-1 + INFO-1..7. The owner's rulings are in the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/decisions.md` ("Review rulings", 2026-10-23). The implementer's r2 report: `sc494-r2-impl-report.md` in the same dir (summary first). All command rules from your r1 brief (`sc494-brief-r1-review.md` §3) still apply; new private scratch subfolder `.../scratchpad/sc494-r2-rereview-<your agent id>/`. Do not commit; leave both trees clean.

Review ONLY the delta, not a fresh full pass:
1. `git range-diff` of the r1 commits across the rebase onto origin/develop 054c9c5 (expect `=`; explain any change). Superproject rebased onto origin/main 83b800f.
2. LOW-1 (FOLD, reviewer's fix verbatim: "add a test that the toggle opens on, then flip it off and Save. The block should hold exactly one `collapse_default: false` line and re-render expanded."): the new test(s) fail under your r1 mutant (claim keys the model owns, FormModal.ts ~133) and pass at HEAD.
3. INFO-6 (FOLD: "one shared helper both call … Behaviour-preserving; no change to pipeline output."): read the helper; re-run your r1 384-case differential (`probe-head4` / `analyze.py` in your r1 scratch dir) at the new HEAD — zero differences from r1 HEAD's results in both the form's and the pipeline's written bytes. Mutant: swap the order inside the shared helper — tests go red.
4. INFO-5: CHANGELOG bullet now says literally that collapse lines below other settings move to the top; otherwise accurate.
5. Gates: re-run tsc/lint/jest/e2e/freeze at HEAD; accept A's lifecycle/shots/parity numbers if tied to the same tip. Expected: jest 6026 / 1 / 243 of 244 suites; lifecycle 36/36; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79; shots 592; freeze 280/280; parity 0/0/24.

Report `sc494-r2-rereview-report.md` in the ledger dir (≤10-line executive summary first; inline if blocked). Return raw facts: verdict, findings with severity + file:line, mutant results, differential count, gate numbers, evidence paths. You cannot message me; end with STATUS: NEEDS_CONTEXT if you need input. Any stray message's first word must be `SC-494:`.

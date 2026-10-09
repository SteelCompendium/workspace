# SC-127 round 11 — plumbing fixes for the round-10 LOW notes (guard/jest only)

You are the SC-127 implementer (resumed). Same worktree, branch, skills, FOREGROUND-only
gate discipline (output to `sc127-r11-*` files read on return; never wait on a background
job), footguns, no AI trailers, commit per coherent step. No tracker.

**Hard scope: `visual-harness/shoot.mjs` guard plumbing, `obsidian-light-island.mjs`'s
return shape, and jest tests ONLY. Do not touch `styles-source.css`, fixtures, or anything
that renders. STOP CONDITION: if after your changes ANY `*--steel-print.png` or
`*--steel-realprint.png` hash differs from `sc127-rebaseline.txt` / the shared baseline,
do not proceed — report which and why.** The sanction ask on the ticket already carries
the current hashes; they must not move.

Read: the ledger's 2026-10-01 round-10 entry; `sc127-r10-rereview-report.md` LOW notes.

> **L1** `shoot.mjs:5382-5386`: an exception inside the island guard still shows up as
> `FAIL sweep (exception)`, and every gate after it is skipped for that run. Fix: give the
> guard its own try/catch that names itself and exits 1.

> **L2:** removing `lightDefault` from the generator's return again (r9's bug 2) leaves
> jest 33/33 green; only a full sweep catches it, through L1's generic path. Fix: a jest
> test on the return shape.

> **L3:** the "extra, local-only" manifest-vs-sheet test is a tautology (it loops over the
> manifest's own keys and checks they are in the manifest). Deleting `--color-base-30`
> from both the block and the manifest leaves jest 33/33 green; only the in-run guard
> catches it. Fix: compare against the sheet-derived name set, or delete the test and its
> claim.

For L3, owner's preference: compare against the sheet-derived set when the pinned sheet
is present (skip with a printed reason otherwise) — and keep the comment honest. Can-fail
each: L1 (throw inside the guard → the named failure line + exit 1, later gates still
reported or the skip stated explicitly); L2 (drop `lightDefault` → red); L3 (delete a token
from block+manifest → red with the sheet present).

Then: `rm -f main.js styles.css && npx jest` (report count), one full `npm run shots`
(every OK line), hash check of all print/realprint shots vs `sc127-rebaseline.txt` and the
shared baseline (expect: 131 twin == rebaseline, 0 realprint moved), parity if shoot.mjs's
harness build changed anything (it should not). Commit; superproject pointer bump; append
"Round 11" to `sc127-r9-fix-report.md`; return contract with final shas.

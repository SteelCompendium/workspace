# SC-501 r3 scoped re-review brief (resume of the r2 reviewer)

Same rules as `sc501-r2-review-brief.md` (command shapes, private scratch folder — use
`<scratchpad>/sc501-r3rev-<agentId>/`, no variable/glob rm, no background gates, tracker off-limits,
no commits to the branch).

Scope: the DELTA only, not a fresh full pass.
- Inputs: ledger `sc501-decisions.md` ("Owner rulings on r2 review"), the implementer's
  `sc501-r3-impl-report.md`.
- 1) `git -C <worktree> range-diff a993a60..1918a29 efc17de..af8caae` — confirm the
  r2 commit is patch-identical after the rebase onto `efc17de`.
- 2) Review the new r3 commits against the three fold-in rulings (FU-1 box assertion + the input
  focus-visible skip branch now failing; LOW-1 modal scenario in the kind key; LOW-2 comment).
  Probe: break one input's and one checkbox's box in a scratch copy — each must exit 1 named.
  Check the input assertion cannot pass vacuously (zero tagged inputs).
- 3) Re-run shots + freeze yourself on the head; confirm 592 / 0 FAIL, freeze 280/280, and the
  host-leak lines match the implementer's report. Lifecycle/e2e only if the delta could reach them.
- Confirm nothing out of scope (SC-512, SC-513) was touched.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-r3-rereview-report.md`
(≤10-line exec summary first). Final text: verdict, finding counts by severity with file:line,
shas, numbers, absolute evidence paths. Can't SendMessage me — STATUS: NEEDS_CONTEXT if blocked;
any stray message starts with `SC-501:`.

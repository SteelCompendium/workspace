# SC-474 scoped re-review — round 1 (to the review-r1 reviewer)

Scope: the fix-r1 DELTA only (8af4f9a..e31e1a0 (dse head e31e1a0, superproject da932cd), plus the rebase onto c03db7a) — not a fresh full pass.
Context: ledger `decisions.md` (rulings on your findings), `sc474-fix-r1-report.md` (exec summary first), your own
`sc474-review-r1-report.md`, all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/`.
Worktree, footguns, and return contract are the same as your round-1 brief; use a NEW private scratch folder
`<scratchpad>/sc474-rereview-r1-<random 4-char suffix>/` and a private git worktree for any code experiment.

Check:
1. HIGH-1 fixed as prescribed: in real Obsidian, re-run your X4-P16 (icon search) and X4-P17 (custom colour, cancelled
   chooser) probes on the new head — the clicked control keeps focus and typing lands; INFO-2 (click-away on
   non-focusable space focuses "+ Add") preserved; cog/swatch/duration/effect focus (SC-468) unchanged; P01–P05 still green.
2. Vacuity of the new HIGH-1 tests: revert just the HIGH-1 change in a private worktree; the new jsdom test and e2e scenario must fail.
3. LOW-1 done (doc captured once; timer on `doc.defaultView`).
4. Rebase onto c03db7a clean; COND-E04/E05 pass SC-456's stricter fence check. Re-run tsc, lint, jest and e2e yourself at
   the head; trust the fixer's lifecycle/shots/freeze/parity unless the delta gives you reason to doubt them.
5. No CSS; no attribution trailers; any manifest/control-id addition follows the e2e README conventions.

Report `sc474-rereview-r1-report.md` (≤10-line exec summary first; verdict LAND-READY / FIX-REQUIRED; findings by severity
with file:line). Final text: raw facts + absolute artifact paths. NEEDS_CONTEXT if blocked; any message's FIRST WORD `SC-474:`.

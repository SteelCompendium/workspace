# SC-607 r5 — scoped re-review of the r4 delta (orchestration:reviewer; resume of the r3 reviewer)

Read: the ledger "Owner rulings on r3 (2026-11-12)" (binding), the common gates/footguns file (baseline now dse dcc53f0f), and
sc607-r4-fix-report.md (summary first), all in
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/.

Scope: the r4 DELTA only, not a fresh full pass. Use `git range-diff` (old base 622b0904..1daa7d8a vs new base dcc53f0f..c329ff35)
to show the r2 commits are unchanged by the rebase, then review the r4 commits:
1. F7: the only product-code change; does it change any behaviour beyond dropping a stale in-flight read on unload?
2. F6: do P19b and the move cells kill N6 and M19 on the final code (re-run those mutants yourself)? N10, N14, N11, N7 tests: real
   teeth? Are the N1, N2, N15 (and any other survivor) classifications right?
3. The re-modelled redraw tests (`host.rebind`): still meaningful; N18 is now recorded as equivalent ("only the old no-rebind models reached its branch") — is that sound, or can a state Obsidian produces (e.g. own + then a redraw then an outside edit) reach the own-write-first branch?
4. Docs: both CHANGELOGs and sc607-dse-verify-proposal.md are true to the measured behaviour, plain, and name F1 (move), F3, the
   >400-line-with-twin refusal, R-Q2a, and residuals F2 / F4; the stale SC-594 "Known limit" sentence is gone.
5. Gates: re-run jest and lifecycle part 6 on the final sha; spot-check the report's other numbers against its logs.
No commits to the branch; probes in scratch files removed by literal path; `git -C <dse> status --porcelain` empty at the end.
Report: same dir, sc607-r5-rereview-report.md (<=10-line summary first: verdict LAND / FIX; findings by severity with file:line;
gates measured). Private scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc607-r5-reviewer/.
Final text: raw facts + artifact paths.

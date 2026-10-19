# SC-372 — round 7 brief (scoped check of the r5 folds + r6 rebase), for the r4 reviewer

Context: ledger decisions.md ("r4 rulings", "Addendum ruling", the 1640ed0 entry); reports sc372-r5-rebase-report.md and sc372-r6-rebase-report.md. Branch `sc372-textscale` @ 6737031 on origin/develop 1640ed0. Never call the tracker; don't commit; scratch under sc372-r4-rereview/r7/.

Check only:
1. The r5 fold commits (INFO-1 tokens.ts comment, INFO-2 CHANGELOG, INFO-3 font-sizes.md, addendum catalog.ts help text, drive-by docs/settings.md) say what the ledger rulings say, and change nothing else.
2. The r6 rebase: `git range-diff` the pre-rebase branch (aebc0a9 on e9502a8) against HEAD. r6 reports NO conflicts (git auto-merged CHANGELOG.md, styles-source.css, shoot.mjs) — verify the auto-merges kept both sides' intent — especially `visual-harness/shoot.mjs`, where SC-408's additions and `assertTextScale` / `assertTextScaleOnce` / `TEXT_SCALE_PAGES` must all survive and still be called, and `styles-source.css`, where the SC-372 token rule and registry block must be byte-identical to pre-rebase and SC-408's CSS intact.
3. Re-run the gates whose result a bad resolution could fake: shots (both text-scale lines present and OK), freeze, parity. Run e2e once too: required to land (dse-verify step 4b; never `--headed`, never DISPLAY :1).

Expected numbers: as in sc372-r6-rebase-report.md (dse-verify CURRENT @ 1640ed0 + 7 jest tests).

Report: append a "## r7 scoped check" section to sc372-r4-rereview-report.md with a ≤5-line summary at its top (verdict LAND-READY / FIX-REQUIRED, counts). Final text → ticket-owner: verdict, counts, measured numbers, paths.

Footguns: report write blocked → inline · never key a wait-loop on a scratch filename/contents · gates in the FOREGROUND, output to files, never end your turn waiting on a background job · `git -C <abs>` · no pattern pkill · never touch the shared freeze baseline · NEEDS_CONTEXT → end your turn; any message starts `SC-372:`.

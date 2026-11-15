# SC-650 r7 fix report

## Summary
- STATUS DONE. dse head `42c26272` on origin/develop `fcc7278e` (rebased three times during r7: a9f0af1d -> cefa9ca8 -> ad21dc87 -> fcc7278e; all clean, none touched montage or windowHandoff). Not pushed; superproject untouched.
- LOW-C `2d874ec9`: `WindowSlot.beforeContents` (the content of each root present when the window opened). The fallback Notice needs a new root whose content matches none of them AND differs from the closing view's content. No timing. Jest OW18i (montage), O20c (initiative): callout rebuilt as a whole by the own save, sibling replaced with the same content, own root arrives 700 ms later: no Notice, focus lands.
- LOW-D `b165f44f`: jest OW18h, an edit that changes BOTH montages, exactly one Notice (early one for the first card, none when the open one's arrives) and focus lands on the open card.
- Mutants: H1 (drop the content snapshot) red on OW18i and O20c; H3 (`!noticed` guard in `act` removed) red on OW18h. OW18b..g / O20b stay green.
- Gates, by sha:
  - at `ad21dc87` (full battery): tsc/lint rc0; jest 13445 passed / 1 skipped; e2e `621/631 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`; lifecycle 64/64 (21, 16, 9, 4, 7, 4, 3); shots 592 PNGs, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.
  - at `cefa9ca8` (full battery, before the later moves): jest 13431/1; e2e `620/631`; lifecycle 64/64; shots/freeze/parity as above.
  - at `fcc7278e` = final head `42c26272`: tsc/lint rc0; jest 13448 passed / 1 skipped (= 13407 + 41); e2e `621/631 ok, 1 failed, 9 known-bug` where the one failure is NEGO-R05 ("no write ... after the action", negotiation, not touched by this branch); NEGO-R05 re-run alone passes on this head (`h-nego-r05.log`) and on a clean fcc7278e checkout (`h-nego-r05-base.log`): load flake. Lifecycle, shots, freeze, parity were NOT re-run at fcc7278e: its delta is `SettingsTab.ts`, settings dropdowns e2e and settings-matrix test (no CSS, no montage/initiative, no windowHandoff).
  - Earlier rounds at older shas: part 4 and 7 of lifecycle at 1bceaabf's tree ran green (r5), part 4 at the r7 tree pre-rebase 4/4.

## Notes
- Pre-existing limit: the early Notice (fallback) compares a new root's content with the closing view's and the snapshot; if the open card itself never reaches the slot (deleted) and another changed block arrives, the Notice shows from that block. An outside edit did happen.
- Reviewer scratch worktrees (dseP/dseR/dseM/dseQ/dseS/dseN) untouched.
- Doc: `.repo-docs/architecture.md` row (beforeContents, O20c, OW18b..i).

## Logs (scratchpad/sc650-r1-impl/)
ad21dc87 battery: g-tsc.log, g-lint.log, g-jest.log, g-e2e.log, g-life-part1..7.log, g-shots.log, g-freeze.log, g-parity.log. cefa9ca8 battery: cefa/. fcc7278e: h-tsc.log, h-lint.log, h-jest.log, h-e2e.log, h-nego-r05.log, h-nego-r05-base.log. Mutants: mut-H1-no-content-snapshot.log, mut-H3-act-no-noticed-guard.log (earlier mut-G*.log).

# SC-639 r3 implementer report

## Executive summary

- STATUS: DONE. Plugin branch `sc639-negotiation-reset-focus` head `a9f0af1d`, rebased onto dse develop `5f962390` (SC-649 landed; course correction followed, 2777484c skipped), pushed (force-with-lease; origin branch = `a9f0af1d`). Commits: `9ff629eb` fix, `cf40dd36` tests, `a9f0af1d` r3 tests.
- Rebase: no conflicts. SC-649's edits to `e2e/driver/negotiation.ts` (adds `GHOST_APPEAL`) and `test/dom/elements/negotiation-bugs.test.ts` (103 lines) merged automatically with mine (different hunks); both sides present, K05 still flipped. No SC-649-owned file edited.
- Superproject branch on workspace `origin/main` `f97c41bc` (moved twice during r3: 0a6aaebf, ae594671, then f97c41bc), exactly two commits: `3814730a` CHANGELOG, `6f657662` ONE pointer bump to `a9f0af1d`. Not pushed.
- LOW-1: e2e NEGO-F08 (RV) and NEGO-L09 (LP): focus on a Patience seal, mouse opens the menu, mouse chooses Reset: lands on the new options button, ring true.
- LOW-2: `ring` field on `focusState` / `focusAnywhere`, asserted `ring: true` in F01, L03, F08, L09. FINDING: the `ring: false` mutant at view.ts:204 SURVIVES all four in real Obsidian (see below), so a jsdom test now pins the `focusVisible` option and kills it.
- Gates on `a9f0af1d`: tsc + lint clean; jest 13354 passed / 1 skipped (shots cache present; 13353 / 2 fresh); lifecycle 64/64; e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; shots 592 (163/978, 40/240, 147); freeze 280/280; parity 0/0/24.

## LOW findings

- LOW-1: `e2e/specs/negotiation/focus.e2e.ts` NEGO-F08 (Tab to seal 1 so the ring is real, `openMenu`, mouse click on Reset, expect `{ inCard: true, ctl: 'negotiation.menu', ring: true }`); `e2e/specs/negotiation/live-preview.e2e.ts` NEGO-L09 (`focusByScript` to the seal, same steps, waits for focus to settle on the redrawn button). Ids grepped unused first; no ticket id in any title.
- LOW-2: `e2e/driver/negotiation.ts` `focusState` and `focusAnywhere` return `ring: !!a?.matches?.(':focus-visible')`. `ring: true` asserted in NEGO-F01, NEGO-L03, NEGO-F08, NEGO-L09.
- Ring mutant (`ring: focusAtOpen.ring` -> `ring: false` at `src/elements/negotiation/view.ts:204`): e2e `NEGO-F01, F08, L03, L09` all still ok (`e2e-mut-ring.log`). Cause: with `ring: false` the kit calls plain `focus({ preventScroll: true })` and Chromium decides the ring itself; after any earlier key press a script focus shows `:focus-visible`, and a mouse press that the click shield cancels (pointerdown / mousedown) never clears that modality. So real Obsidian cannot tell the two hand-overs apart in these flows. Added jsdom test in `test/dom/elements/negotiation-matrix.test.ts` ("the keyboard ring follows the old button: focus is handed over with focusVisible when it drew the ring, plain when it did not"): spies `HTMLElement.prototype.focus` and stubs `matches(':focus-visible')`. Result: passes on the fix (`10 passed` in the SC-639 filter), mutant run `1 failed, 9 passed` (that test). The e2e `ring: true` assertions stay (cheap regression guards for a hand-over that lands with no ring at all) but are not what kills the mutant. Restored with `git checkout -- src`; dse status clean.

## Commits

dse (on `5f962390`): `9ff629eb` fix(SC-639) · `cf40dd36` test(SC-639) Reset keeps focus on the options button · `a9f0af1d` test(SC-639) Reset from a seal with the mouse; ring checked.

`git -C /home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus log --oneline origin/main..HEAD`:
```
6f657662 chore: bump draw-steel-elements to a9f0af1d (SC-639: negotiation Reset keeps keyboard focus on the card)
3814730a docs(changelog): SC-639 negotiation Reset keeps keyboard focus on the card
```
Base `origin/main` = `f97c41bc` (docs: sc649 ledger Done entry). The CHANGELOG bullet is the ledger's, verbatim, at the top under `## Unreleased` (behaviour unchanged by r3). The bump commit touches only the submodule pointer; the changelog commit only `CHANGELOG.md`.

## Gates (a9f0af1d, 5f962390 base; measured)

- `TSC_RC=0`, `LINT_RC=0`.
- Jest: `Tests: 1 skipped, 13354 passed, 13355 total` rc 0 (shots cache present). Expected: baseline 13345 (cache) + 9 = 13354: the 8 r1 jsdom tests + 1 ring test; K05 counted passed in both. Fresh equivalent 13353 / 2 (base 13344 / 2 + 9).
- Lifecycle, 7 `--only=` parts, each `LC_RC=0`: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64. No flake hit. (An earlier full run on the 2777484c base also gave 64/64 and jest 13344/1; superseded by this run.)
- e2e: `OBSIDIAN-E2E done: 607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`. Expected: baseline 598/613, 15 known-bug + 5 new (NEGO-F05, F06, F07, L07, L08) + 2 new (NEGO-F08, L09) + 2 flipped (NEGO-F01, NEGO-L03) = 607 ok / 620 total, known-bug 13. No flake (INIT-W10 / SET-X03 / SET-X04 did not fire). (A first full e2e started on the 2777484c base was aborted by me when the course correction arrived; its log is `e2e-full-aborted-on-2777484c.log`, not a result.)
- Shots rc 0, 592 files, host-leak 163 / 978, modal host-leak 40 / 240, capture clip 147. Freeze `freeze OK (280/280 frozen print PNGs byte-identical`. Parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- dse `git status --short` empty; superproject `git status` clean.

## Drive-by fixes:

None.

## Follow-ups:

- The `ring` hand-over cannot be pinned in real Obsidian by these flows (see LOW-2). A flow that proves it would need a fresh session with no earlier key press and a real un-shielded pointer press; not worth a ticket.

## Evidence

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r3-a3085b0ce0f8b9a8b/`: `e2e-new.log` (F01/F05/F08/L03/L07/L09 ok), `e2e-mut-ring.log` (ring mutant: all ok), `jest-ring-ok.log`, `jest-ring-mut.log`, `tsc.log`, `lint.log`, `jest-full.log`, `lc-part1.log` .. `lc-part7.log`, `e2e-full.log`, `shots.log`, `freeze.log`, `parity.log`; older-base runs `jest-full-on-2777484c.log`, `lc-on-2777484c-part1..7.log`, `e2e-full-aborted-on-2777484c.log`; scripts `e2e-only.sh`, `jest-sc639.sh`, `lc.sh`. This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/sc639-r3-implementer-report.md`.

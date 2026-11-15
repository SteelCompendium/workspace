# SC-662 r7 rebase report (implementer I1)

**Executive summary**
- Rebased `sc662-sidebar-pending-saves` (old head `5774613e`) onto `origin/develop` `d62f0b26` (SC-656); then folded LOW-6 as one more commit. Final head `129beb18`, 16 commits above `d62f0b26`. Nothing pushed; the reviewer's scratch trees were not touched.
- `git range-diff bab0dbb2...5774613e d62f0b26...86a40ed9`: 13 commits `=` (unchanged), 2 `!` (the two conflict commits: the fix commit `c3d62639` -> `40b9261f`, import line in `windowHandoff.ts`; the docs commit `eb7532fa` -> `80e85f3e`, one sentence in `.repo-docs/architecture.md`). The LOW-6 commit is the 16th, on top.
- Conflict resolutions (both sides kept whole): (1) `windowHandoff.ts` import line: SC-656 had `{ captureControlFocus, controlSuccessor }`, mine `{ controlSuccessor, restoreControlFocus }` plus the `ControlFocusRules` type; the result is one value import with all three names and one type import with all four types. Everything else in the file merged without a conflict (my `finishOutsideRefresh` at the end, SC-656's new exports above it). (2) `architecture.md` windowHandoff row: kept SC-656's much longer row whole and added my one clause (every other element's windows take the shared rule in `ElementView.refreshFromOutside`, SC-662). `livePreviewFocusCarry.ts` (`ownSaveCarried`) merged with no conflict.
- Full battery at `129beb18`: tsc 0, lint 0, jest **13703 passed / 1 skipped** (shots cache), lifecycle **64/64** (21+16+9+4+7+4+3; G-S61 green, so no part-4 re-run), e2e **`658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`**, shots 592 / host-leak 163/978 / modal 40/240 / clip 147, freeze 280/280, parity 0 / 0 / 24.
- LOW-6 folded (below); mutant T1 killed by SF05.
- A first battery at the rebased head `86a40ed9` was stopped by me when the LOW-6 request came in, partway (tsc 0, lint 0, jest 13702 / 1, lifecycle parts 1 and 2 green); the final numbers above are from a fresh full run at `129beb18` only.

## Numbers against the owner's predictions

| gate | at `d62f0b26` (owner) | predicted with my tests | measured at `129beb18` |
|---|---|---|---|
| jest | 13642 / 1 | about 13702 / 1 | 13703 / 1 (13702 at `86a40ed9`, +1 SF05) |
| lifecycle | 63/64 (G-S61) | | 64/64 (G-S61 passed; load not high) |
| e2e | `646/655`, 417 pairs | 658/667, 418/418 | `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` |
| shots / freeze / parity | 592-163/978-40/240-147 / 280 / 0-0-24 | | the same |

No SET-X03/X04, INIT-W10 or NEGO-R05 flake appeared, so nothing was re-run.

## LOW-6: a form opened between an outside edit reaching the host cache and the panel refresh

- Reviewer's text: "a hero form opened in the few ms between an outside edit reaching the host cache and the panel refresh would be seeded from the old model but expect the new body, so its Save would overwrite the outside edit."
- Fix, `src/authoring/FormModal.ts` constructor: `expectBody = host.loadedBody ?? host.currentBody?.() ?? source` (`loadedBody` is what the card the user looks at holds; the cache second; the seed last).
- Test `SF05` in `formSaveRedraw.test.ts` (the SC-509 sidebar block): pinned hand-written hero; the outside edit (`surges: 1` to `surges: 4`) is put in the note and the host's cache is refreshed (`host.refresh()`, which updates the cache without telling the panel); then the Edit definition form opens and Save is pressed: refused with the dropped-write Notice, the outside edit stays, the form stays open. SF03 (hand-written hero saves) and SF04 (block really changed: refused) stay green.
- Mutant T1 (`expectBody = host.currentBody?.() ?? source`, the pre-fix order): SF05 red (1 failed in the 318-test run: `mutants.out`, `mut-T1-expectBody-currentBody-first.log`).

## Shared-file hunks (for SC-656)

`windowHandoff.ts`: import line only (resolution above); `finishOutsideRefresh` unchanged. No `src/framework/sidebar/*` hunk in r7.

## Drive-by fixes:
None.

## Follow-ups:
None new. No marker file was deleted this round (overwrote in place).

## Artifacts (scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r1-I1/`)

- Final battery: `r3bat-*.log`, `r3bat-*.rc`, `r3battery.progress`, `r3bat-head.txt` (= `129beb18`); the r5 battery logs of the same names were overwritten.
- Pre-fix partial: not kept (overwritten).
- Mutant: `mut-T1-expectBody-currentBody-first.log`, `mutants.out`; jest iteration `jest-r7a.log`.
- Old head before the rebase: `r7-oldhead.txt` (`5774613e`).

# SC-505 r3 fix + rebase report

## Executive summary
- STATUS: DONE. dse `ec354f4` on origin/develop `7046eb0` (rebased twice: 054c9c5, then 7046eb0); superproject `cce808f` (CHANGELOG only, no pointer bump) on origin/main `aa57411`. Nothing pushed.
- Range-diff `efc17de..3717849` vs `7046eb0..HEAD`: the 7 r1/r2 commits are all `=` (no conflict in src/ or test/; SC-494's pipeline.ts change auto-merged); the 3 r3 commits are new. Superproject: one CHANGELOG conflict (SC-494's bullet), resolved by keeping both, mine first.
- Commits: LOW-A `9fbc43e` (includes the claim-time-disarm removal), INFO-1 `9b41fef` (tests), LOW-B `ec354f4` (CHR-F07).
- Gates on ec354f4: tsc/lint clean; jest 6048 passed / 1 skipped / 244 of 245; lifecycle 36/36; e2e 123/123 ok, 0 failed, 0 known-bug, coverage 84/84 (+3 tests F07 F08 F09, no new pairs); shots 592 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- Pin write path after SC-494: CHR-F04/F05/F06/F08/F09 green and the registration "resolves true only when it wrote the note" jest test green (jest 6048 = 6043 base + 5 new).

## LOW-A (9fbc43e)
- Request scope is now the pressed COPY: innermost `.internal-embed, .markdown-embed` around the pressed button, else its `.workspace-leaf` (`focusHandoff.ts` `scopeOf`, `armChromeFocus`). Only a button in that scope may claim; the focusin guard treats only an item button in that scope as ours.
- The claim-time disarm is removed (it was what dropped focus in P17A: the twin rebuilt while focus sat on a Pin this request had just claimed). The pressed-button bookkeeping (`Request.pressed`, `Request.doc`, the `activeElement !== pressed` branch, the guard's `target === req.pressed` branch) is gone: the focusin guard cancels the request whenever the user moves, so "not free" at claim time can only mean the pressed button or an already-claimed Pin.
- Tests, red on 3717849-code, green after: jest `chromeFocusHandoff.test.ts` "pressing in the second embed: the first embed rebuilding first ..." and "pressing in the first embed: the second embed rebuilding after focus was handed over ..." (log `r3-red1.log`). e2e CHR-F08 (press in embed 1) red on the r2 code (`Expected "chrome.pin" Received "body"`, `r3-e2e-lowa-red.log`), green after. CHR-F09 (press in embed 0) is green on the r2 code in my fixture, so it is a guard only; the jest test for that order is red on r2 code. Real-Obsidian drivability: yes. New fixture `e2e/vaults/shipped/Stamina/embed-twice.md` (`![[Stamina/basic]]` twice, README table row), `openNote` now also accepts "every root has a live registry entry" (an embedded note's blocks carry the embedded file's sourcePath), new `dse.embeddedTarget(rel, lang)` declares the write target in the embedded file for the integrity check.

## LOW-B (ec354f4)
CHR-F07: Tab to Pin, Enter, wait for the write; Tab on to Collapse; `dse.externalEdit` inside the window; focus must not be on `chrome.pin`. Red with the `focusin` listener removed (`Expected: not "chrome.pin"`, `r3-e2e-lowb-red.log`), green after.

## INFO-1 (9b41fef) — status of every claim/disarm branch
| branch (`focusHandoff.ts`) | status | test that goes red without it |
|---|---|---|
| claim: no live request for this key | kept | "a rebuild of ANOTHER block (another key) does not claim" (also "lapses") |
| claim: button missing / not connected / already focused | kept | any claim test (button not yet connected -> observer) |
| claim: scope mismatch (other pane / other embed) | kept | M1: 4 red (HIGH-1 x2, LOW-A x2) |
| claim: `!focusIsFree` -> leave focus | kept | M2: "a rebuilt copy that appears while the pressed button still holds focus ..." red |
| claim: `focusControl` fails (hidden copy) | kept | "a copy that cannot take focus ..." |
| claim: disarm when focus is elsewhere | REMOVED (the guard owns it) | n/a |
| claim: "focus still on pressed button" | REMOVED | n/a |
| guard: item button in scope is ours | kept | M5: "rebuilt twice", LOW-A test 2 red |
| guard: scope clause | kept | M4: new test "focusing another copy's Pin button cancels it" red (first version of the test was vacuous; fixed by blurring before the rebuild) |
| guard: any other focus cancels | kept | "focus that lands anywhere but on the Pin button ..." red without the listener; CHR-F07 |
| settle: wrote=false disarm | kept | "a Pin that wrote nothing arms nothing" |
| settle: wrote=true shortens | kept | "a request that was never answered lapses" |
| settle: refocus pressed after no-write | kept | M6: "keyboard Pin that rebuilds nothing ..." red |
Mutation logs: `r3-mut-M1/M2/M4b/M5/M6.log` in the scratch folder.

## Gate lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-impl-q7x2/`)
- `g-tsc.log`, `g-lint.log` rc 0.
- `r3b-jest.log`: `Test Suites: 1 skipped, 244 passed, 244 of 245 total; Tests: 1 skipped, 6048 passed, 6049 total`.
- `r3b-lifecycle.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`.
- `r3b-e2e.log`: `OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`.
- `r3b-shots.log` rc 0: 592 PNGs, 0 FAIL, in-run lines as r1/r2 (host-copy pin OK 1.15.0, button host-leak 113/678, modal 228, text scale 1626, once 107256/214, chrome host-leak 18). SC-501's extra sweep lines did not appear as separate lines in my greps.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`. `r3b-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

Drive-by fixes: none. Follow-ups: none (SC-511 untouched).

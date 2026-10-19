# SC-428 scoped re-review, round 2 (delta 8e7e404..e7d869c + superproject b4243d4)

**Executive summary**
- VERDICT: **LAND**. All six r1 items (M1, M2(b), LOW-1, LOW-2, the Respite INFO, the popover-Enter INFO) are fixed as prescribed or as the owner ruled. 0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW / 3 INFO. Nothing was committed, and both trees are as I found them (DSE e7d869c clean; superproject b4243d4 with the unstaged submodule pointer it already had).
- Gates I ran at e7d869c (on origin/develop f818002), all rc 0: tsc and lint clean · jest `4840 passed / 1 skipped`, `227 of 228` suites · lifecycle `25/25 ok, 0 failed` · e2e `68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs`. These match the implementer's numbers.
- New tests fail without the fix. With the r2 tests run against the 8e7e404 source, jest has 9 failures (every new test) and e2e has RECOV-R10, R11 and R12 all FAIL. Reverting only adoptView fails the two jsdom adoption tests, and RECOV-R10 fails on the ring check after the write (`Expected false, Received true`). So the e2e row really guards the adoptView half.
- adoptView change: no regression found. The only caller is the claim path in `adoptView.ts`. A keyboard focus keeps its ring through the write for Catch Breath (ZZR-1) and for the marker row with an arrow key (ZZR-2), on head and with the old adoptView alike. Lifecycle 25/25 includes G-S3 (typing survives the adoption blur). Text inputs always match `:focus-visible`, so they are captured as `true` and restored exactly as before.

## Resolution check (r1 finding -> r2 change)
| r1 | prescribed / ruled | r2 | verified by |
|---|---|---|---|
| MEDIUM-1 | hand focus to the row when the focused Catch Breath disables | `RecoveriesStrip.ts` update: `cbHadFocus` check, then `pipsEl.focus({preventScroll:true})`, gated on `canPersist` | jsdom 3 cases (moves, stays when still enabled, never steals) + e2e RECOV-R11; both fail without the fix |
| MEDIUM-2(b) | `focusVisible:false` on click + adoptView keeps ring state | `RecoveriesStrip.ts` click handler `focusVisible:false`; `adoptView.ts` `FocusState.visible` captured with try/catch, restored via `focusVisible: state.visible` | RECOV-R10 ring asserts (fail with old adoptView) + `view-adoption.test.ts` x2 |
| LOW-1 | shared `REASON_RECOVERY_VALUE_UNKNOWN`, hero + modal | `'Max Stamina unknown'`; `catchBreathBlockedReason` checks null after none-left and dying (precedence kept); hero passes the null value; modal gets the new opt `recoveryValueUnknown` | entry-points R03 + Q16 tests, unit precedence rows; fail without the fix |
| LOW-2 | :84 asserts no write; :194 retitled | both done exactly | read |
| INFO Respite | labelWithReason | `labelWithReason('Respite', READ_ONLY_TOOLTIP)`, same string as before | read |
| INFO popover Enter | return focus on close | `if (cb.ownerDocument.activeElement === cb) pipsEl.focus(...)` before `closePopover()`; a mouse click (button never focused) is untouched | jsdom x2 + e2e RECOV-R12 (fails without the fix) |

## INFO
1. **Window-inactive capture, not verifiable here.** If the Obsidian window is inactive when an adoption happens, whether Chromium still reports `:focus-visible` decides the restored ring state. I tried `@electron/remote getCurrentWindow().blur()` (ZZR-3), but headless Xvfb without a window manager keeps `document.hasFocus()` true, so the result is inconclusive. Worst case: a keyboard user who switches windows inside the ~150 ms write window comes back without a ring until the next Tab. Optional hardening: when `!doc.hasFocus()`, leave `visible` undefined and omit the option. Not required.
2. **One test title overclaims.** `stamina-recoveries-matrix.test.ts` "a click asks for focus WITHOUT the focus ring …; the keyboard path does not suppress it": the second clause is not asserted in that test (the keyboard ring is covered by ZZR-1/2 and by RECOV-R11's path). Trim the title if convenient.
3. **Superproject CHANGELOG** (700cfc8 + b4243d4 on origin/main 0b1ec6f; `0b1ec6f..HEAD` only adds 10 lines, so no other bullet was lost). The wording is user-facing and accurate. One nit: "keyboard Catch Breath … keep focus on the row" is true only when the press disables the button (otherwise focus stays on the button). The DSE CHANGELOG line says it precisely ("a keyboard Catch Breath that fills Stamina … hands focus to the row").

## Artifacts
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/evidence/review-r2/`:
- gate logs and rc files: `r2-tsc.*`, `r2-lint.*`, `r2-jest.*`, `r2-lifecycle.*`, `r2-e2e.*`
- fail-without-fix: `r2fail-r2nofix.log` (all r2 source reverted to 8e7e404; 9 failed), `r2fail-r2noadopt.log` (only adoptView reverted; 2 failed), `r2e2e-r2nofix-fail.log` (R10/R11/R12 FAIL), `r2e2e-r2noadopt-probe.log` (R10 FAIL; ZZR keyboard ring probes ok)
- probes: `r2e2e-r2head-probe.log` (ZZR-1..3 on head), `zz-r2.e2e.ts` (the probe spec)

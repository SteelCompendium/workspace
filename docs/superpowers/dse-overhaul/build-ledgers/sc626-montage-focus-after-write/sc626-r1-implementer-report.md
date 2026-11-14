# SC-626 r1 implementer report

**Executive summary**
- STATUS: DONE (see Open questions for two mapping choices).
- dse branch `sc626-montage-focus-after-write`, rebased onto origin/develop `a5313f9d`; head `11fbded6` (4 commits: 48eff2d6 fix, 16b7389b jsdom + kit tests, 88699684 e2e, 11fbded6 manifest rows). Superproject untouched.
- Gates on `11fbded6`: tsc + lint clean · jest 12166 passed / 2 skipped fresh (12167 / 1 with the shots cache; fresh baseline at a5313f9d derived 12132, at f6e504c7 measured 12124 / 2) · e2e `437/446 ok, 0 failed, 9 known-bug, coverage: 235/235 pairs` · lifecycle 64/64 (7 parts: 21+16+9+4+7+4+3) · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 · freeze 280/280 · parity 0 GAP / 0 WARN / 24 declared.
- Fix: `MontageView.update()` captures the focused control before the rebuild and restores its successor after (kit `controlFocus.ts`), only when focus was inside the card or in a window opened from it that is writing. Windows record their opener at open.
- Kit extension (small, opt-in, initiative/conditions unchanged): `data-dse-focus-at` (which control, not which position) and per-family `fallbacks` (nearest usable equivalent). Live Preview carry reads the view's `controlFocusRules()`.

## Survey table (every montage rebuild path)

All writes and the strip toggle go through `MontageView.update()`. "After" is the control holding focus once the rebuild is done (jsdom `[F..]` / e2e `MONT-F..`).

| Path | Control before | After |
|---|---|---|
| End round (mid-run) | montage.bar.end-round | same (F01, MONT-F01/F07) |
| End round, last round (montage ends, End round gone) | montage.bar.end-round | montage.bar.back (F02, MONT-F07) |
| Undo, entries left | montage.bar.undo | same (F03) |
| Undo, last entry (Undo disabled) | montage.bar.undo | montage.bar.log (F04) |
| Undo of the winning entry | montage.bar.undo | montage.bar.log (F09) |
| Back to round N, more rounds to go back | montage.bar.back | same (F05) |
| Back to round 1 (Back gone) | montage.bar.back | montage.bar.end-round (F06, MONT-F12 Live Preview) |
| Reopen | montage.bar.reopen | montage.bar.log (F07) |
| Clear all | montage.bar.clear-all | montage.bar.log (F08); never lands on Clear all |
| Chrome Add a round / Reset progress | montage.chrome.* | same item (F10) |
| Strip toggle (open and close) | montage.strip | same (F11, MONT-F02) |
| Guide toggle | montage.guide | no rebuild, unchanged |
| Quick trio button (Success/Failure/Assist) | montage.quick.* | the recorded cell, same hero+round (`montage.cell`, F12, MONT-F11 Live Preview) |
| Recorded or past-empty cell, Save in the sheet | montage.cell | same cell by hero+round (F13) |
| Cell, win that makes empty past cells inert | montage.cell | same cell (named by `at`, not position) (F14) |
| Cell, Remove: past round | montage.cell | same cell (empty past cell) (F18) |
| Cell, Remove: round in play (becomes open socket, no Tab stop) | montage.cell | that socket's first quick button (`montage.quick.success`) (F18) |
| Bar Log an action, Log in sheet | montage.bar.log | same (F15, MONT-F03/F08/F13) |
| Bar Log, every hero has now acted (Log disabled) | montage.bar.log | montage.bar.end-round (F15, MONT-F08) |
| Bar Log, winning success (Log gone) | montage.bar.log | montage.bar.undo (F16) |
| Row "Log an action for <hero>" | montage.board.row-act | same hero's button (F17) |
| Row button, win that disables every row button | montage.board.row-act | montage.bar.undo (F17) |
| Board Add a hero window, Add | montage.board.add-hero | same (F19) |
| Chrome Add a hero window, Add | montage.chrome.add-hero | same (F19, MONT-F05) |
| Set limits window, Save | montage.chrome.set-limits | same (F20, MONT-F06) |
| Any window, Cancel / Escape (no write) | window control | untouched: Obsidian's own focus return to the still-present opener (F21) |
| Write with focus outside the card (mouse press, script click, outside input) | none | nothing pulled in (F23, MONT-F09) |
| Window opened with the mouse, closed by a write | none | nothing pulled in (F24, MONT-F10) |
| Window wrote, user moved focus meanwhile | window | left where the user put it (F25) |

## Nearest-equivalent mappings (`src/elements/montage/focusRules.ts`)
Families: `montage.cell.socket`, `montage.quick.{success,failure,assist}` -> `montage.cell`.
Fallbacks (first usable = enabled and focusable): log -> end-round, undo, back · undo -> log, end-round · back -> end-round, log, undo · end-round -> back, reopen, undo · reopen -> log, end-round, undo · clear-all -> log, end-round · row-act -> undo, reopen · cell -> log, end-round, undo. A family with an entry also skips an unusable control for the nearest usable one of its own family. Clear all is never a fallback target (a second Enter would wipe the montage).

## Files changed (dse)
- src: `framework/kit/controlFocus.ts` (FOCUS_AT_ATTR, `at` in the token, `fallbacks` param on `controlSuccessor`/`restoreControlFocus`, ControlFocusRules type), `framework/view.ts` (optional `controlFocusRules`), `framework/host/livePreviewFocusCarry.ts` (passes the view's rules), `elements/montage/view.ts` (capture/restore in `update`, window opener record), `elements/montage/BoardView.ts` (stamps `data-dse-focus-at` on cells and hero name cells), new `elements/montage/focusRules.ts`.
- tests: `test/dom/elements/montage-matrix.test.ts` (K03 flipped to `test`; new group `[F]` F01-F27), `test/dom/kit/controlFocus.test.ts` (+6), `test/dom/framework/livePreviewFocusCarry.test.ts` (+1), `e2e/specs/montage/focus.e2e.ts` (MONT-F01..F04 plain, F05..F13 new), `e2e/manifest/montage.ts` (press:Enter rows for quick.success F11 and back F12, required by the coverage gate).
- Live Preview: SC-602 carry confirmed to work, with the view's rules; MONT-F04 (End round), F11 (quick -> cell), F12 (Back gone -> End round), F13 (window Log) pass in real Obsidian Live Preview.

## Reverted-src red counts
- jsdom, `view.ts` reverted to f6e504c7: 22 red = F01-F20, F22 and K03. F21 (Cancel moves nothing) and F27 (rule ids are real controls) pass without the fix by nature (guards).
- Negatives killed by mutation: view captures unconditionally -> F23, F24, F26 red; kit `restoreControlFocus` without the free-focus check -> F25 red.
- Kit tests (6) and the carry test (1) need the new kit exports: red on revert (import).
- e2e, `view.ts` reverted: 11/13 red (MONT-F01..F08, F11..F13, 'Received: null'); MONT-F09/F10 (negatives) pass by nature.

## Drive-by fixes:
none.

## Follow-ups:
- `ElementView.update` default path has no generic focus hand-back; each element adds its own (initiative, montage). Could be pushed into the framework once a third element needs it.
- The hover/pinned sidebar refresh of a montage with a window open (initiative's SC-608) is not handled for the montage: its windows stay open across an outside edit as before.

## Open questions:
1. End round on the last round lands on Back to round N (reverses it), not Reopen/Clear all. Conservative but a taste call.
2. Remove on the round-in-play cell lands on the socket's first quick button (Success), because the socket itself is no Tab stop; the alternative is that hero's row button. Focusing logs nothing.

## Skill notes:
- dse-verify SKILL.md: current-numbers line becomes e2e `437/446 ok, 0 failed, 9 known-bug, 235/235 pairs` (known bugs SC-626 x4 retired), jest 12167 / 1 with the cache; the montage jsdom-marker line (`test.failing` K03 for SC-626) is stale; K group now holds only K04 (SC-631) as `test.failing`; new `[F]` group in montage-matrix. Fresh worktrees need `npm ci` (no node_modules).

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc626-r1-impl/)
jest-baseline.log (f6e504c7 fresh: 12124/2) · jest-rebased.log (12166/2) · jest-cached.log (12167/1) · jest-mm-revert-view.log · e2e-focus-1.log, e2e-focus-2.log (new MONT-F, 13/13) · e2e-focus-revert.log (11 red on revert) · e2e-full.log (first full run, coverage gate caught 2 unlisted pairs) · e2e-full3.log (rebased: 437/446) · lcR-part1..7.log (rebased lifecycle) · shots.log · freeze.log · parity.log · tsc.log · lint.log

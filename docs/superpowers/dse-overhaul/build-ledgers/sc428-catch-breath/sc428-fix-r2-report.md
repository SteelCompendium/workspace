# SC-428 fix round r2 report

**Executive summary**
- STATUS: DONE. DSE `sc428-catch-breath` head `e7d869c` on `origin/develop` `f818002` (moved 8ab5e91 -> f818002 mid-round; rebased, all gates re-run there). Superproject head `b4243d4` on `origin/main` `0b1ec6f` (CHANGELOG: both Unreleased bullets kept; submodule pointer left unstaged).
- All FOLD rulings applied: M1, M2(b), LOW-1 (hero + modal), LOW-2, Respite labelWithReason, popover keyboard-close focus return. SC-458 widgets untouched.
- Final battery at f818002 + head: tsc 0; lint 0; jest 4840 passed / 1 skipped / 227 of 228 suites; lifecycle 25/25; e2e 68/76 ok, 0 failed, 8 known-bug, coverage 51/51; shots 572, 0 FAIL, rc 0; freeze 276/276; parity 0/0/24. All exit 0.
- adoptView changed (FocusState.visible, restore with `focusVisible`): lifecycle 25/25 green with SC-260's scroll pinning in the base.

## Per-finding
| finding | commit | test(s) that fail without the fix |
|---|---|---|
| M1 keyboard Catch Breath fills Stamina -> focus to <body> | `e7d869c` | jsdom `[R04] keyboard focus is handed on...` "a keyboard Catch Breath that fills Stamina disables the focused button: focus moves to the marker row" (+ two guard tests: not disabled keeps focus, never-focused does not steal); e2e `[RECOV-R11]` |
| M2(b) mouse click draws no focus ring, ring state kept across adoption | `e7d869c` | jsdom `a click asks for focus WITHOUT the focus ring...`; view-adoption `focus: a mouse-set focus (no ring) is restored without the ring` / `a keyboard focus (ring showing) is restored with it`; e2e `[RECOV-R10]` now asserts `:focus-visible` false after the click and after the write |
| popover Catch breath via keyboard closes and drops focus | `e7d869c` | jsdom `the popover's Catch breath pressed from the keyboard closes the popover and returns focus to the marker row` (+ mouse click does not pull focus); e2e `[RECOV-R12]` |
| LOW-1 unresolved recovery value | `6f6ce0b` | entry-points `[R03] unresolved class + authored recoveries_max: ... Max Stamina unknown`, `[Q16] ... modal's Spend Recovery says the same`; unit `unknown recovery value (unresolved max)` + precedence rows + `zeroHealReason(null)` |
| LOW-2 overclaiming tests | `e7d869c` | `:84` now `expect(host.replaceSource).not.toHaveBeenCalled()`; `:194` retitled to what jsdom proves (e2e R10 is the re-draw proof) |
| Respite inline label | `6f6ce0b` | no behaviour change (`labelWithReason('Respite', READ_ONLY_TOOLTIP)`); existing heroSheet read-only assertion `Respite: Read-only in this context` covers it |

Fail-before (src stashed, same tests): jest 9 failed (`evidence/r2/jest-prefix.log`); e2e R10/R11/R12 0/3 ok (`evidence/r2/e2e-prefix.log`).

## Design notes
- Shared `REASON_RECOVERY_VALUE_UNKNOWN = 'Max Stamina unknown'` in `model/StaminaBar.ts`; `catchBreathBlockedReason` takes `recoveryValue: number | null`; precedence none left > dying > unknown > zero/at-max. Modal gets option `recoveryValueUnknown` (hero passes `stats.recoveryValue.value === null`).
- `RecoveriesStrip.update`: if the Catch Breath button held focus and is becoming disabled (canPersist), focus goes to the marker row first. Popover Catch breath handler: if it holds focus, focus the row before `closePopover()`.
- `focusVisible` is a Chromium 124+ FocusOptions key (Obsidian 1.14.4 is Chromium 150); older engines ignore it.
- e2e: ring assertion after the ArrowLeft key was dropped (Chromium does not turn the ring on for a key on an already focused row; the ring returns on Tab to the next control).
- Manifest: `recov.catch-breath` + `press:Enter`, `recov.pop.catch-breath` + `press:Enter` (coverage 49 -> 51 pairs).
- CHANGELOGs (DSE + superproject) gained one sentence each.

## Gates (final, evidence/r2final/*.log + .rc)
| gate | result | rc |
|---|---|---|
| tsc | clean | 0 |
| lint | clean | 0 |
| jest | 4840 passed / 1 skipped / 4841 total, 227 of 228 suites | 0 |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` | 0 |
| e2e | `OBSIDIAN-E2E done: 68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs` | 0 |
| shots | 572 PNGs, 0 FAIL | 0 |
| freeze | `freeze OK (276/276 ...)` | 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 0 |

## Drive-by fixes
- None.

## Follow-ups
- None new (SC-458 stays out of scope).

## Artifacts
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/evidence/r2final/` (final gate logs), `evidence/r2/` (fail-before, iteration logs)

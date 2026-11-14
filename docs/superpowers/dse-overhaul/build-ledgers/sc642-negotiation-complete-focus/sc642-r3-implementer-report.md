# SC-642 r3 implementer report (fix round)

## Executive summary

- STATUS: DONE. Final dse sha `09c879f2` on `sc642-negotiation-complete-focus`, rebased onto dse develop `10c271fe` (no package.json / lock change, no `npm ci` needed). Superproject untouched.
- Folded LOW-1, LOW-2, LOW-4, LOW-5, INFO-6 as ruled; LOW-3, SC-656, SC-639 and `NegotiationData.ts` not touched.
- LOW-5 decision: REMOVED `NegotiationView.controlFocusRules()`. It changed no observable behaviour (mutant M3 survived every test and the Live Preview probes: the in-handler hand-off puts focus on a chip before the carry captures, so the carry never sees `negotiation.complete`), so no test can kill it. SC-639 adds it back with its own entry and test.
- LOW-4: the hand-off now calls `scrollIntoView({ block: 'nearest' })` on the landing chip, in `NegotiationView.keepFocus` only (kit and other elements unchanged). 1 new jsdom test; red without the call.
- Gates: tsc + lint clean · jest 13318 passed / 1 skipped (shots cache present; 13317 / 2 fresh) · lifecycle 64/64 · e2e `591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 · freeze 280/280 · parity 0 / 0 / 24.

## Shas (old to new)

| Old (r1) | New | Subject |
|---|---|---|
| `d9fadf8d` | `b334c30d` | fix(SC-642): negotiation keeps keyboard focus on the card after Complete Argument (rebase of r1) |
| `01af056d` | `0b6eae24` | test(SC-642): Complete Argument keeps focus on the card (rebase of r1) |
| new | `9d46bea8` | fix(SC-642): scroll the landing chip into view; correct mechanism comments; drop `controlFocusRules` |
| new | `09c879f2` | test(SC-642): pin the scroll-into-view; correct mouse and mechanism comments; import order |

## What changed

- LOW-1 (comments): `src/framework/kit/controlFocus.ts` (header and the `fromDisabled` doc), `src/elements/negotiation/focusRules.ts` header, `e2e/specs/negotiation/focus.e2e.ts` (comment above `[NEGO-F02]`), `test/dom/kit/controlFocus.test.ts` (the `disarmed()` doc). They now say the blur is synchronous inside the click dispatch (2-3 ms, about 410 ms before the save), that focus is usually already on `<body>` when the restore runs, and that `fromDisabled` covers jsdom (and an engine that defers the blur). `fromDisabled` kept.
- LOW-2 (comments): `focus.e2e.ts` (`[NEGO-F04]`) and `live-preview.e2e.ts` (`[NEGO-L05]`) now say a pointer press does not move focus at all (the click shield cancels pointerdown / mousedown), so the scripted press stands for any press made while focus is outside the card. No keyboard-only gate.
- LOW-4: `src/elements/negotiation/view.ts` `keepFocus`: after a successful `restoreControlFocus`, `activeElement.scrollIntoView?.({ block: 'nearest' })`. Does nothing when no focus moved (returns early).
- LOW-5: `controlFocusRules()` and its `ControlFocusRules` import removed from `view.ts`.
- INFO-6: import order at `focus.e2e.ts:7` (`interestOf, onNthOfControl, openNego`).
- Test: `test/dom/elements/negotiation-matrix.test.ts` new test "the landing chip is scrolled into view (nearest: no scroll when it is already visible); nothing scrolls when no focus moved": stands in `HTMLElement.prototype.scrollIntoView` (jsdom has none), asserts one call with `{ block: 'nearest' }` and `this` = first appeal chip, and no call when focus was on the page; removes the stand-in afterwards.

Red check for the new test: with the `scrollIntoView` line replaced by `void 0`, `Tests: 1 failed, 376 skipped, 6 passed` (the new test only). Restored afterwards (`git checkout -- src`). The scroll itself is not covered in real Obsidian (the r2 P14 scenario was not re-probed); jsdom pins the call and its arguments.

## Gates (measured, on `09c879f2`)

- `TSC_RC=0`, `LINT_RC=0` (clean).
- Jest: `Tests: 1 skipped, 13318 passed, 13319 total` (with the shots cache from this worktree; fresh equivalent 13317 / 2 = base 13307 + 9 + 1), rc 0.
- e2e: `OBSIDIAN-E2E done: 591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` (as expected). INIT-W10 did not flake.
- Lifecycle (7 `--only=` parts): 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed, every `LC_RC=0`.
- Shots: rc 0, 592 files, host-leak 163 kinds / 978 comparisons, modal host-leak 40 / 240, capture clip 147.
- Freeze: `freeze OK (280/280 frozen print PNGs byte-identical`.
- Parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- dse `git status --short` empty after the battery.

## Drive-by fixes:

None.

## Follow-ups:

None new. (The `e2e/` grep for `controlFocusRules` hits only the built plugin copies under `e2e/.out/`, which are gitignored run output.)

## Open questions:

None.

## Skill notes:

SKILL.md numbers after this lands: jest 13317 passed / 2 skipped fresh (13318 / 1 with the cache) on top of develop `10c271fe` + this branch; e2e 591/608 ok, 17 known-bug, 416/416 pairs; the other gates unchanged.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r3-impl/`)

`tsc.log`, `lint.log`, `jest-final.log`, `jest-sc642.log`, `jest-mut-noscroll.log`, `e2e-full.log`, `lc-part1.log` ... `lc-part7.log`, `shots.log`, `freeze.log`, `parity.log`.

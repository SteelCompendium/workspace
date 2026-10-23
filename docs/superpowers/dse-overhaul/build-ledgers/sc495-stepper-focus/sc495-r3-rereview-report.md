# SC-495 r3 scoped re-review: the r3 delta only

## Executive summary
- Verdict: **APPROVE**. LOW-A and LOW-B are both closed, verified by running them. Nothing in `src/` triggers a stepper button with a programmatic click. There is no scope creep.
- Reviewed: dse `c4b51ce..c909c54` (489407b, 55a1bb8, c909c54) on `9f08f06`. The superproject is unchanged at `4cd1e12` on origin/main `3c7f392`.
- Severity: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 2.
- Gates on c909c54: tsc + tsc -p e2e clean; lint clean; jest 5860 passed / 1 skipped / 241 of 242 (load 6-12); e2e **114/114 ok, 0 failed, 0 known-bug, coverage 79/79** (rc 0).
- LOW-A in real Obsidian (PRB-15): Tab to the counter's "−", then a mouse click to 0. Focus goes to `<body>`, not the input. The wheel leaves the value at 0, a click away writes nothing, and the note stays `current_value: 0`. With r2's stepper.ts swapped in, CTR-F02 goes red ("Expected: not counter.input").
- Keyboard still moves focus with the ring: in a note, Space on "−" goes to `counter.input` (solid 2px), and Tab then reaches `counter.inc`. In the modal, Enter on Temp "−" goes to `sedit.temp.input` and Space on Stamina "+" goes to `sedit.stamina.input`. A mouse press in the modal (PRB-12) still moves nothing: value 0 and "Lose 5 Temp Stamina", unchanged by the wheel.
- LOW-B: ROLL-SF01 now drives Edges "−" 9 -> 0 with Enter. It asserts `roll.edges.value` with tabindex -1, `:focus-visible`, solid 2px, then Tab -> `roll.edges.inc`. The manifest row `roll.edges.dec press:Enter` is present, and coverage is 79/79 (78 plus the CTR-F02 `counter.dec click` row).

## Findings
No CRITICAL / HIGH / MEDIUM / LOW findings.

### INFO
1. **Programmatic-click survey (the brief's question).**
   - `src/` and `main.ts` contain no `.click()` and no `dispatchEvent(...)` click. The only hit is a comment at `iconButton.ts:9,131`.
   - No hotkey, command or parent forwards a click to a stepper button. Both buttons reach `commit` only through `iconButton`'s own `click` listener (`iconButton.ts:129-135`), which passes the real event (`stepper.ts:136,163`).
   - Every other path into `render()` uses `keyboard = false`: `setValue` (`stepper.ts` handle), the typed Enter/blur commit (`commitDraft` -> `commit(next)`), and the initial render. So none of them can move focus.
   - The remaining `detail === 0` activations outside the keyboard are assistive tech (a screen reader's "activate", voice-control "click"), which produce a synthesized click with detail 0. Moving focus to the value is the desired result for those users. Nothing to fix.
2. `showsFocusRing` was removed, which closes r1 INFO-4: one fewer copy of the `:focus-visible` read. The jest "pointer click on a keyboard-focused button" test (`test/dom/kit/stepper.test.ts`) mocks `:focus-visible` true and dispatches `detail: 1`. It pins the exact LOW-A shape.

## Scope check
`git diff --stat c4b51ce c909c54` touches:
- `src/framework/kit/stepper.ts` (event-detail gate; helper removed)
- `test/dom/kit/stepper.test.ts`
- `e2e/specs/counter/counter-focus.e2e.ts` (+CTR-F02)
- `e2e/specs/roll-bar/roll-bar-stepper-focus.e2e.ts` (Edges "−" step)
- `e2e/manifest/{counter,roll-bar}.ts` (one row each)

Nothing else.

## Probe log (real Obsidian 1.14.4; throwaway spec, never committed)
| id | scenario | result on c909c54 |
|---|---|---|
| PRB-12 | modal MOUSE Temp "−" x5, wheel x3 | focus BODY; value 0; Apply "Lose 5 Temp Stamina" before and after |
| PRB-13 | modal KEYBOARD Enter Temp "−" to 0, Tab | `sedit.temp.input` ring; Tab -> `sedit.temp.inc` |
| PRB-14 | modal KEYBOARD Space Stamina "+" to 20 | `sedit.stamina.input` ring |
| PRB-15 | note: Tab to counter "−", MOUSE click to 0, wheel, click away | focus BODY; wheel no effect; note `current_value: 0` (r2: written 3) |
| PRB-16 | note: MOUSE "−" to 0, no keyboard focus first | no move |
| PRB-17/18 | note: KEYBOARD Space "−" to 0 | `counter.input` ring after the write/redraw; Tab -> `counter.inc`; note 0 |
| PRB-PREF | prefs after the roll-bar spec | `{}`, no roll button |

Mutation: r2's `stepper.ts` (c4b51ce, keyboard read from `:focus-visible`) with `--only=CTR-F02,CTR-F01,ROLL-SF01` gives CTR-F02 FAIL, CTR-F01 ok, ROLL-SF01 ok, rc 1.

## Artifacts
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r3-review-w7j2/`:
- gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-e2e.log`, each with its `.rc`
- probes: `p-e2e-head.log`, `probe-head.jsonl`, `probe-src/probe.e2e.ts`
- mutation: `mut-r2stepper.e2e.log`

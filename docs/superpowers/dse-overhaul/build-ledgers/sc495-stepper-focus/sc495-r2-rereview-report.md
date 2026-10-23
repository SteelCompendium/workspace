# SC-495 r2 scoped re-review: the r2 delta only

## Executive summary
- Verdict: **APPROVE_WITH_FIXES**. All three r1 fixes are in and verified by running them. MEDIUM-1 is closed for the case I reported. LOW-1 is closed. LOW-2 is closed: ROLL-SF01 goes red under both mutations. There is no scope creep.
- Reviewed: dse `247bd27..c4b51ce` (58221aa, c4b51ce) on `9f08f06`. Superproject range-diff `6a176e6..64464bf` vs `3c7f392..4cd1e12`: 64464bf = 84e526c, plus a new 4cd1e12 that touches CHANGELOG only.
- Severity: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 2 / INFO 3.
- LOW-A: there is still a narrow way into MEDIUM-1, in notes only. Park keyboard focus on a counter's "−", then click it to 0 with the mouse. Focus moves into the input with the ring, a mouse wheel changes the value, and a click away WRITES it (note `current_value` 0 -> 3; base writes nothing).
- LOW-B: ROLL-SF01 drives "+" to max on both Edges and Banes. The owner ruling said "Edges to 0". The read-only "−" at min is not tested in real Obsidian (jest covers it).
- Gates on c4b51ce: tsc + tsc -p e2e clean; lint clean; jest 5859 passed / 1 skipped / 241 of 242; e2e 113/113 ok, 0 failed, 0 known-bug, coverage 77/77.
- Jest note: the first full jest run was 1 failed (5858) under load 23: the SC-485 squad-pool test in `initiative-default-keys.test.ts` timed out, which is unrelated to this diff. That file alone passes 25/25, and a full re-run at lower load is 5859 green.
- Shots and freeze were not re-run. The only non-test changes are `data-dse-control` attributes (no CSS selects them: 0 hits in `styles-source.css`) and focus logic that runs only on a key press. The implementer measured 592 shots, 0 FAIL, and freeze 280/280 on c4b51ce.

## Findings

### LOW-A: a mouse press on a button that already has keyboard focus still hands focus to the input (notes only)
- Where: `src/framework/kit/stepper.ts:196-199`. "Keyboard" is read from the BUTTON's `:focus-visible` state, not from the press.
- Why notes only: in a note, the click shield (`src/framework/pipeline.ts:220-239`) cancels the mousedown default, so a mouse click neither moves focus nor clears the button's keyboard `:focus-visible`. In a modal, a mouse click re-focuses the button without the ring, so the fix holds there (PRB-12).
- Measured (PRB-15, real Obsidian, `Counter/counter.md` at 1):
  1. `tabTo(counter.dec)`, then a real MOUSE click on it.
  2. Value 0; focus moves to `counter.input` with `:focus-visible` and the solid 2px ring.
  3. Three wheel notches over the number change the field (read 2 mid-way).
  4. Clicking the note title (blur) writes `current_value: 3`.
- Base: focus goes to `<body>`, the wheel does nothing, and nothing is written. A pure mouse press with no keyboard focus parked on the button moves nothing (PRB-16, OK).
- The precondition is narrow: keyboard focus on the very button, then the mouse. But the result is an unintended note write.
- Fix: decide "keyboard" from the activating event, not the focus state. A keyboard-activated `click` has `MouseEvent.detail === 0`; a real pointer click has `detail >= 1`. `iconButton`'s `onClick` already receives the event (`iconButton.ts:50,134`). Pass it into `commit` (`stepper.ts:145,172`: `onClick: (e) => commit(current - step, e.detail === 0)`) and require `keyboard && held && disabled` in `render()`. You can keep `showsFocusRing(held)` as a second condition.
- Tests: jest pointer tests dispatch `new MouseEvent('click', { detail: 1, bubbles: true })`. Add an e2e step (or a CTR-F02) that tabs to `counter.dec`, then `dse.click`s it to 0, and asserts focus is not `counter.input`, the wheel changes nothing, and nothing is written.

### LOW-B: ROLL-SF01 does not drive the read-only "−" to its minimum
- Where: `e2e/specs/roll-bar/roll-bar-stepper-focus.e2e.ts:25-51`. Both halves press "+" to 9. The owner ruling (ledger, r1-review LOW-2) says "Edges to 0 and Banes to 9".
- Effect: the read-only min path (focus to the value, then Tab reaches "+") is covered only by jest. It works in real Obsidian (r1 probe PRB-09 and its held Enter: Edges 9 -> 0 -> SPAN, Tab -> Increase Edges).
- Fix: after the Edges "+" half, Shift+Tab to `roll.edges.dec` (that is where focus already ends at line 41) and press Enter 9 times. Assert `roll.edges.value` has the ring, and Tab -> `roll.edges.inc`. Add a manifest row `'roll.edges.dec': c(['press:Enter'], ['SC-495'])` (coverage 78/78).

### INFO
1. **Owner question: duplicate `roll.launch` (and roll.* ids on ds-roll's bar). Rated harmless.**
   - Nothing assumes ids are unique. The driver's `pick` (`e2e/driver/dse.ts:73-77`) takes the first match or `{ nth }`. The README documents repeated ids (`control('recov.marker', { nth: 4 })`). Ids already repeat on shipped pilot surfaces: `init.cell.stamina` x3 and `init.cond.add` x2 in `Initiative/tracker.md` (r1 PRB-10 Tab walk).
   - The coverage gate (`state.ts:75-78`, `run.mjs`) keys on `(control id, kind)` pairs, so repeats make no difference there.
   - The censuses (`test/dom/e2eCensus.test.ts`, `e2e/specs/_census.e2e.ts`) check membership in a Set of manifest ids and scope only the stamina, initiative-stamina and conditions surfaces. Neither scans a feature, statblock or ds-roll.
   - ds-roll is `deferred: true` (inert without `experimental`), and e2e runs with experimental off.
   - The only cost: in a multi-roll feature, `focusedControl()` cannot say WHICH effect's bar holds focus. A future multi-roll test would scope by block plus `{ nth }`. Prescription: DROP. Keep the ids. Do not make them unique.
2. `setPrefs({})` does not leak. Under both mutations ROLL-SF01 failed, and the probe after it in the same shard (`PRB-PREF`, a new Obsidian session per spec file: pid 366085 -> 366305) read plugin data `{}` and found no `roll.launch` on `Feature/feature.md`, which means rolling is back off. Within the file, mocha's `after()` runs even when the test fails.
3. CHANGELOG (`4cd1e12`) meets LOW-1: no Malice, no "restarted at the top", names Edges and Banes, describes the real loss (Enter/Space, outline, screen reader), says "Using the mouse behaves as before", in plain words. If LOW-A is fixed, "Using the mouse behaves as before" becomes fully true.

## Probe log (real Obsidian 1.14.4; throwaway spec, never committed)
| id | scenario | result on c4b51ce |
|---|---|---|
| PRB-12 | modal: MOUSE Temp "−" x5 to 0, wheel x3 over the input | focus BODY; value 0; Apply "Lose 5 Temp Stamina" before and after the wheel (r1: 0 -> 2, "Lose 2") |
| PRB-13 | modal: KEYBOARD Enter Temp "−" to 0, then Tab | `sedit.temp.input`, `:focus-visible`, solid 2px; Tab -> `sedit.temp.inc` |
| PRB-14 | modal: KEYBOARD Space Stamina "+" to 20 | `sedit.stamina.input`, ring |
| PRB-15 | note counter: tabTo "−", then MOUSE click to 0, wheel, click away | `counter.input` WITH ring; wheel changes it; note written `current_value: 3` (LOW-A) |
| PRB-16 | note counter: MOUSE "−" to 0, no keyboard focus first | no move (focus on the reading-view div) |
| PRB-PREF | after ROLL-SF01 (failing), same shard | data `{}`, no roll button: no pref leak |

## Mutation table (ROLL-SF01, `--shards=1 --only=ROLL-SF01,PRB-PREF`)
| mutation | ROLL-SF01 | failure |
|---|---|---|
| drop `tabindex="-1"` (stepper.ts:167) | FAIL | `Expected "roll.edges.value", Received null` |
| drop `.dse-stepper__value:focus-visible` | FAIL | outline `none`/3px instead of `solid`/2px |

## Scope check
`git diff --stat 247bd27 c4b51ce` touches:
- `stepper.ts` (render gate + comment)
- `rollBar.ts` (import + 3 `control`/`stampControl` attributes)
- `rollController.ts` (+1 `control`)
- `test/dom/kit/stepper.test.ts` (pointer tests rewritten)
- e2e: SF03, the new roll-bar spec, the `roll-bar.ts` manifest, and the `Feature/feature.md` fixture

Nothing else. Nothing in SC-492/SC-489 code, and `focusNeighbourStop` is untouched.

## Artifacts
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc495-r2-review-k4p1/`:
- gates: `g-tsc.log`, `g-lint.log`, `g-jest.log` (green re-run), `g-jest-run1-loaded.log` (the load timeout), `g-jest-one.log`, `g-e2e.log`, each with its `.rc`
- probes: `p-e2e-head.log`, `probe-head.jsonl`, `probe-src/probe.e2e.ts`
- mutations: `mut-M3-no-tabindex.e2e.log`, `mut-M7-no-css.e2e.log`, `probe-M3-no-tabindex.jsonl`, `probe-M7-no-css.jsonl`

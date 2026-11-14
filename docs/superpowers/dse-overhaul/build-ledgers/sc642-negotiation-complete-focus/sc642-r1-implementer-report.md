# SC-642 r1 implementer report

## Executive summary

- STATUS: DONE. Final dse sha `01af056d` on branch `sc642-negotiation-complete-focus` (fix `d9fadf8d`, tests `01af056d`; on top of dse develop `12aaf5b5`, which `origin/develop` still was at start). Superproject untouched (only its `draw-steel-elements` pointer shows modified).
- Mechanism: Chromium focus fixup on the disabled Complete button (blur about 13 ms after the press, in both Reading view and Live Preview). No card rebuild is involved; the save lands about 450 ms later, after focus is already on body.
- Fix: capture the pressed control before the write, hand focus right after, via the shared kit helper `restoreControlFocus(..., { fromDisabled: true })` + a `fallbacks` entry. Landing: the first appeal chip (else first pitfall chip, else the lie box).
- Gates: tsc + lint clean; jest 13041 passed / 2 skipped (base 13032 / 2, +9); lifecycle 64/64; e2e `582/601 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs`; shots 592 (host-leak 163/978, modal 40/240, clip 147, unchanged); freeze 280/280; parity 0 / 0 / 24.
- SC-639 markers (`NEGO-F01`, `NEGO-L03`, jsdom `K05`) stayed red/known-bug: no side-effect fix, no NEEDS_CONTEXT.
- Every new test is red with the src change reverted or mutated (counts below). No Follow-ups that need a ticket beyond the two notes below.

## Mechanism (with evidence)

Temporary probe spec (deleted, not committed) installed page-side `focusin` / `focusout` / `blur` listeners plus a per-frame `activeElement` sampler, then pressed Enter on Complete (Tab to it in Reading view, `focusByScript` in Live Preview), base `12aaf5b5`:

```
RV: t=7 active=negotiation.complete | t=24 blur+focusout target=negotiation.complete(disabled) related=null | t=37 active=BODY | t=497 write seen
LP: t=11 active=negotiation.complete | t=30 blur+focusout target=negotiation.complete(disabled) related=null | t=49 active=BODY | t=553 write seen
```

The same node (still connected) is blurred 13-19 ms after the click handler disabled it (`ArgumentView.syncFooter -> setDisabled(true)`), by Chromium's focus fixup, about 450 ms BEFORE the debounced write. So in Live Preview the SC-602 carry never sees focus in the card at its capture point (the old widget is released after the blur), and in Reading view adoption has nothing to restore. Single cause, one mechanism in both modes; the ticket's guess was right. Final focus before the fix: BODY in both.

After the fix (same probe): focus moves to the first Motivation chip synchronously (`focusin` at t=49 / 74), stays through the save (a blur at t=461 / 467 and a refocus at t=490 / 524 are the Reading view adoption / the Live Preview redraw handing focus back to the same chip; the final state is the chip in both modes).

Evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r1-impl/probe-rv.json`, `probe-lp.json`, `probe-rv-final.json`, `probe-lp-final.json` (these four hold the AFTER-fix timelines; the BEFORE timelines are quoted above from the first probe run, whose json files the second run overwrote; the run itself is `e2e-probe1.log`).

## Mapping and rejected alternatives

Mapping: negotiation.complete (disabled by its own press) -> first usable control of the Argument tab, in Tab order: `negotiation.appeal.motivation` (first), else `negotiation.appeal.pitfall`, else `negotiation.mod.lie` (the one modifier that is always enabled), else the card root. The tier rows are never a landing. Code comment: `src/elements/negotiation/focusRules.ts`.

Rejected:
- the Complete button itself: it is disabled (no Tab stop), which is the bug;
- the first tier row: skips the appeals the next argument may still want, and does not exist once the write ended the negotiation (static tiers);
- the card root (`tabindex=-1`): a Tab from it re-enters at the card top, the same place with an extra step and no visible control;
- the pressed button's positional neighbour: it is the hint text, not a control;
- landing on the nearest of the tab's controls by position (the tier radiogroup, just above Complete): same objection as the first tier row.

## Survey of the other negotiation controls (Enter / Space / arrow from the keyboard; measured, real Obsidian, base vs after)

Probe: one test per row, fresh note each, focus by script, real key, wait for the write, read `activeElement`. The 18 rows (9 controls x RV, LP) are identical before and after the fix (diff of the two result files is empty). Complete and Reset measured by the e2e markers / probe above.

| Control (key) | Disables or rebuilds the pressed control? | Focus after, RV (today -> after fix) | Focus after, LP (today -> after fix) |
|---|---|---|---|
| Complete Argument (Enter) | disables itself | BODY -> first appeal chip | BODY -> first appeal chip |
| Reset (menu, Enter) | whole-card rebuild (SC-639, NOT fixed here) | BODY (NEGO-F01 known-bug stays) | BODY (NEGO-L03 known-bug stays) |
| Motivation chip (Enter) | in place | stays on chip | stays on chip |
| Pitfall chip (Enter) | in place | stays | stays |
| Lie box (Space) | in place | stays | stays |
| Patience seal (ArrowRight 3 to 4) | in place | stays on seal 4 | stays on seal 4 |
| Patience seal (ArrowLeft 1 to 0, ends the negotiation) | in place (Complete becomes disabled, but it is not the focused control) | stays on seal 0 | stays on seal 0 |
| Interest seal (ArrowDown 3 to 2) | in place | stays on seal 2 | stays on seal 2 |
| Tier row (ArrowDown) | in place | stays | stays |
| Spent chip on a card (Enter) | in place | stays | stays |
| Tab (ArrowRight) | in place | stays | stays |

By reading the code, no other negotiation control disables ITS OWN focused node: Same-argument / Reuse boxes change only the other lines; seals disable Complete (a different node). So nothing else shares the disabled-self mechanism; nothing was left unfixed for that reason. Evidence: `survey-before.jsonl`, `survey-after.jsonl` in the scratch folder (see Evidence).

## Design notes

- No Live Preview carry change was needed: the in-handler hand-off puts focus on a chip before the save, so the SC-602 carry captures the chip (same control id, nth 0) and re-focuses it on the redrawn widget. `NegotiationView.controlFocusRules()` (families none, fallbacks for `negotiation.complete`) is also provided so a carry that does catch focus on Complete lands in the same place, and so SC-639 can add its own entries to one value.
- Kit change (small, opt-in, inert for montage / initiative / conditions): `restoreControlFocus(root, focus, families, fallbacks, options)` takes `{ fromDisabled: true }`: a focused DISABLED control inside the root then counts as free (jsdom and the instant before Chromium's fixup keep a disabled node as `activeElement`). Without the option behaviour is identical (jest for montage / initiative / conditions and their e2e are green).
- Mouse: a pointer press on Complete also focuses the button in Chromium, so a mouse user gets focus on the first chip too, without the keyboard ring (the kit keeps the ring state of the pressed node, as SC-626 does). Consistent with the prior-art rule; flagging in case Scott would rather a mouse press moved nothing (that needs the ring bit, no extra code is available for it today).

## Files changed (dse submodule, 2 commits)

fix `d9fadf8d`:
- `src/framework/kit/controlFocus.ts` (the `fromDisabled` option + header note)
- `src/elements/negotiation/focusRules.ts` (new: the mapping and the rejected alternatives)
- `src/elements/negotiation/view.ts` (`controlFocusRules()`, `keepFocus` closure passed to ArgumentView)
- `src/drawSteelAdmonition/negotiation/ArgumentView.ts` (`completeArgument` wraps the old body, now `resolveArgument`, in `keepFocus`)

test `01af056d`:
- `e2e/specs/negotiation/focus.e2e.ts`: `[NEGO-F02]` flipped to a plain test and tightened to assert the landing control; new `[NEGO-F03]` (next Tab continues, chip 0 to chip 1), `[NEGO-F04]` (negative: scripted Complete with focus on the page keeps focus on the page)
- `e2e/specs/negotiation/live-preview.e2e.ts`: `[NEGO-L02]` flipped and tightened; new `[NEGO-L04]` (next Tab), `[NEGO-L05]` (negative)
- `e2e/driver/negotiation.ts`: `onNthOfControl` helper
- `test/dom/elements/negotiation-matrix.test.ts`: describe "SC-642" with 6 tests (first chip; pitfall chip then lie box fallbacks; negotiation-ending Complete; spent first chip; focus on the page; focus outside / on another card control)
- `test/dom/kit/controlFocus.test.ts`: 3 tests for `fromDisabled`

No new control, no manifest row (pairs 416/416 unchanged), no lifecycle scenario (`G-S134` unused; both modes are covered in e2e).

## Reverted-src red counts (new tests)

- Jest, `src/` reverted to `12aaf5b5`: 5 of the 9 new tests red (kit: `fromDisabled` hands focus off; negotiation: first chip, pitfall/lie fallbacks, ending Complete, spent first chip). The other 4 are negatives/inert-by-design (kit "without the option nothing moves", kit "never takes focus from a usable control / outside / no token", and the two negotiation negatives) and pass on revert by nature.
- Mutant check (kit guard dropped so the hand-off is unconditional, plus an always-present token): 4 red: the 2 negotiation negatives, the kit "never takes focus" test, and the kit "without the option" test. (That second kit test is inert-by-design on a plain revert but red under the mutant.)
- e2e, `src/` reverted: F02, F03, L02, L04 red (4 of 4 positives); F04 and L05 (negatives) pass on revert by nature. Mutant (unconditional hand-off): F04 and L05 red (2 of 2).
- Total: 9 jest + 6 e2e new/flipped tests; each is red under revert (positives) or under the mutant (negatives).

## Gates (measured)

- tsc (`npm run tsc`, incl. e2e project) clean, rc 0. lint clean, rc 0.
- Jest fresh before changes: `Tests: 2 skipped, 13032 passed, 13034 total`; after: `Tests: 2 skipped, 13041 passed, 13043 total` (289 suites passed, 1 skipped).
- Lifecycle 7 parts: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, 0 failed (G-S91 and G-S115 green first time; no re-run needed).
- e2e: `OBSIDIAN-E2E done: 582/601 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` (576/597 base + 2 flipped + 4 new). INIT-W10 did not flake.
- Shots: rc 0, 592 files, host-leak 163 kinds / 978 comparisons, modal host-leak 40 / 240, capture clip 147, all OK.
- Freeze: `freeze OK (280/280 frozen print PNGs byte-identical ...)`.
- Parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

## Drive-by fixes:

None.

## Follow-ups:

- SC-639 (Reset drops focus) is unchanged and still red (`NEGO-F01`, `NEGO-L03`, jsdom `K05` stay known-bug / `test.failing`). The kit + `focusRules.ts` + `controlFocusRules()` are ready for it: Reset rebuilds the card through `NegotiationView.update()` (default path), so the shape is capture before `super.update`, `restoreControlFocus(this.rootEl, focus, {}, NEGOTIATION_FOCUS_FALLBACKS)` after (no `fromDisabled`), plus an entry for `negotiation.menu` (the Reset menu is Obsidian's, outside the card; the options button is the natural landing). I did not touch `NegotiationData.ts` or the Reset path.
- Housekeeping, not a ticket: I wrote one stray file by mistake at `/tmp/claude-1000/-home-scott/code/steelCompendium/workspace/placeholder` (a typo in a path; I could not remove it under the no-rm rule). Harmless; delete it when convenient.

## Open questions:

- Landing control is the owner's/Scott's call per the ledger: first appeal chip (the closing comment should name it). If Scott prefers the tier radiogroup or the Complete hint, it is a one-line edit in `src/elements/negotiation/focusRules.ts` (plus the two `ctl:` assertions in `NEGO-F02` / `NEGO-L02` and the jsdom landing tests).

## Skill notes:

SKILL.md "Current expected numbers" / gate table go stale after this lands: jest `13041 passed / 2 skipped` fresh (13042 / 1 with the shots cache); e2e `582/601 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` (+6 ok, +4 total: NEGO-F03, F04, L04, L05 new; the 2 SC-642 markers NEGO-F02 / NEGO-L02 are plain tests, no new pair); lifecycle 64/64, shots 592, freeze 280/280, parity 0 / 0 / 24 unchanged. The known-bug list loses SC-642. Also a footgun worth a line: a Chromium focus fixup moves focus off a button disabled in place about 13 ms later, which jsdom cannot show (it keeps the disabled node as `activeElement`); a LP test needs the Argument tab visible (the tab is session-remembered, a previous test's Learn tab hides its controls from `focusByScript`).

## Evidence artifacts (absolute paths)

Scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r1-impl/`:
- `jest-base.log` (baseline 13032 / 2), `jest-final.log` (13041 / 2)
- `tsc.log`, `lint.log`
- `e2e-full.log` (582/601), `e2e-nego-focus.log` (F/L ids incl. SC-639 markers still known-bug), `e2e-revert.log` (src reverted), `e2e-mutant1.log` (unconditional-hand-off mutant)
- `jest-revert1.log`, `jest-mutant1.log`, `jest-some1.log`
- `lc-part1.log` ... `lc-part7.log`
- `shots.log`, `freeze.log`, `parity.log`
- `probe-rv.json`, `probe-lp.json`, `probe-rv-final.json`, `probe-lp-final.json`, `e2e-probe1.log`, `e2e-probe2.log`
- `survey-before.jsonl`, `survey-after.jsonl`, `e2e-survey-before.log`, `e2e-survey-before2.log`, `e2e-survey-after.log`, `e2e-survey-after2.log`

# SC-639 r1 implementer report

## Executive summary

- STATUS: DONE. Plugin branch `sc639-negotiation-reset-focus` head `8ef9b641` (fix `5d17cd17`, tests `8ef9b641`) on dse develop `e1be1775`. Superproject untouched. NOTE: `origin/develop` has MOVED to `2777484c` since the branch was cut (not rebased, per brief).
- Mechanism (measured, RV and LP): the options button keeps focus the whole time the menu is open (the menu moves no DOM focus; Escape leaves focus on the button). The click on Reset rebuilds the card (`update()`), the old button is detached, focusout fires on it (about 37 ms after the Enter), nothing refocuses: focus ends on BODY. LP: the SC-602 carry never sees focus in the card, so it hands nothing on.
- Fix (`src/elements/negotiation/view.ts`, `focusRules.ts`): capture "was focus in the card" when the menu OPENS; after the rebuild and BEFORE `persist()`, focus the NEW options button via the kit `restoreControlFocus`. Fallback chain: tab `negotiation.tab.argument`, then `negotiation.tab.learn-more`, then the card root (`tabindex=-1`). Focus outside the card at open: nothing moves.
- Gates: tsc + lint clean; jest 13335 passed / 2 skipped (base 13327 + 8); lifecycle 64/64 (7 parts); e2e `603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`; shots 592 (host-leak 163/978, modal 40/240, clip 147); freeze 280/280; parity 0/0/24.
- Markers flipped: K05, NEGO-F01, NEGO-L03 (known-bug 15 to 13). New: 8 jsdom, 5 e2e (F05, F06, F07, L07, L08). Mutants checked red (below).
- Mouse path: a mouse-chosen Reset from a page with no card focus stays on BODY before and after (no pull-in). With focus on a seal and a mouse press on the button, focus now lands on the new options button (before: BODY). Owner rules.

## Mechanism (probe, deleted, not committed)

Page-side `focusin`/`focusout`/`click`/`keydown` listeners plus a per-frame `activeElement` sampler, base `e1be1775`:

```
rv-key   : t=10 click(menu btn, detail 0) | t=49 focusout menu btn | t=77 active=BODY            FINAL BODY
lp-key   : t=14 click | t=51 focusout | t=75 active=BODY                                         FINAL BODY
rv-space : t=21 click | t=49 focusout | t=76 active=BODY                                         FINAL BODY
rv-mouse : (focus on BODY throughout; clicks detail 1 on the icon span and the menu item)       FINAL BODY
lp-mouse : same                                                                                  FINAL BODY
rv-esc   : Enter opens, 300 ms, Escape: no focusout at all, still on the options button          FINAL button
rv-sealmouse: seal focused, mouse click on button, mouse click on Reset: t=266 focusout(seal) at the menu-item click, t=288 BODY   FINAL BODY
```

So focus is on the button (or the seal) until the rebuild; there is no menu-takes-focus step. I had assumed one from the brief ("Obsidian's Menu takes focus"); it is false in 1.14.4, so capture-at-open and capture-at-reset-time give the same answer today. I kept capture at open (robust if a menu ever took focus; jsdom test pins it) and the code comments say what was measured.

After the fix (same probe):

```
rv-key   : focusout t=47, focusin options button t=73; RV adoption blur/refocus t=500/534       FINAL options button (RV)
lp-key   : focusout t=56, focusin t=83; LP redraw: focusout t=488, focusin t=519 (carry)         FINAL options button (LP)
rv-sealmouse: focusout seal t=168, focusin options button t=191                                  FINAL options button
rv-mouse / lp-mouse (page focus): no focus events                                                FINAL BODY
```

LP: the carry (`livePreviewFocusCarry.ts`) does hand focus on, but only because the in-handler restore has already put focus on the new button before the write: with the restore removed (mutant M1) NEGO-L03 and NEGO-L07 time out waiting for focus. Verified, not assumed.

## Where focus lands

- Focus was inside the card as the menu opened (any control of the card): the NEW card's `negotiation.menu` button, ring following how the old node showed it (`captureControlFocus.ring`). Whichever control held focus: the owner ruling says the options button.
- That button absent (SC-641 can hide the Reset item, not the button; guard only): first of `negotiation.tab.argument`, `negotiation.tab.learn-more` (chain in `NEGOTIATION_FOCUS_FALLBACKS`, kit semantics), else the card root with `tabindex=-1`.
- Focus on the page or outside the card at open: `null` token, nothing moves (kit also refuses when anything else holds focus).
- Restore runs after `await this.update(...)` and before `await this.persist()`. In RV the write adopts the view (same root) and adoption hands focus back; in LP the carry hands on. Untouched Reset (no write) keeps focus on the new button in both modes (NEGO-F06, NEGO-L07).
- Not added: `controlFocusRules()` on the view (SC-642 r3 removed it as unobservable; nothing here needs it: the carry's successor for the options button is its own family).

## Mouse path (report for the owner's ruling)

- Mouse click on the button and mouse click on Reset, focus on BODY first: BODY before, BODY after (nothing pulled in) in RV and LP (probes rv-mouse, lp-mouse; e2e NEGO-F07, NEGO-L08).
- Focus on a patience seal, then a mouse press on the button (the click shield moves no focus), mouse click on Reset: BODY before; the new options button after (the rule is "focus was inside the card at open"). If the owner wants mouse-only Resets to move nothing, the rule would need a keyboard test (`isKeyboardClick(event)` is already at hand in the click handler).

## Commits (dse, on e1be1775)

| sha | subject |
|---|---|
| `5d17cd17` | fix(SC-639): negotiation Reset hands keyboard focus to the rebuilt card's options button |
| `8ef9b641` | test(SC-639): negotiation Reset keeps keyboard focus on the options button |

Files: `src/elements/negotiation/view.ts`, `src/elements/negotiation/focusRules.ts` (new `RESET_LANDING` + fallback entry + header paragraph); `e2e/driver/negotiation.ts` (new `resetFromKeyboard` helper), `e2e/specs/negotiation/focus.e2e.ts`, `live-preview.e2e.ts`, `test/dom/elements/negotiation-bugs.test.ts` (K05 flipped, bracketed ticket id dropped from its title), `test/dom/elements/negotiation-matrix.test.ts` (new describe). `NegotiationData.ts` and SC-649's files untouched.

## Tests

jsdom (`negotiation-matrix.test.ts`, describe "SC-639: keyboard focus after Reset negotiation", 8 tests) + K05 flipped:
1. focus on the NEW button, old node detached, one write; 2. focus taken by the menu before Reset still lands (capture at open); 3. other card control focused at open lands on the options button; 4. page focus: no pull-in; 5. outside control keeps focus; 6. second Reset still on the button; 7. dismissed menu leaves no stale answer; 8. fallback chain (tab, then card root with tabindex -1).

e2e (ids checked unused first): NEGO-F01 flipped (now asserts `ctl: negotiation.menu`), NEGO-L03 flipped; new NEGO-F05 (Space-opened, then Enter reopens the menu from the landed button), NEGO-F06 (untouched Reset: no write, focus on button), NEGO-F07 (mouse Reset from page focus: no pull-in), NEGO-L07 (LP untouched), NEGO-L08 (LP mouse from page focus).

Mutants (all restored with `git checkout -- src`):
- M1 no restore: jest 5 failed (K05 + tests 1, 3, 2, 6); e2e F01, F05, F06, L03, L07 red (`ctl null` / focus wait timeout).
- M2 capture at reset time: jest test 2 red.
- M3 restore unconditionally: jest tests 4 and 7 red; e2e F07 and L08 red (`inCard true`).
- M4 land on the captured control's family: jest test 3 red.

## Gates (on `8ef9b641`, measured)

- tsc (incl. `tsc -p e2e`) `TSC_RC=0`; lint `LINT_RC=0`.
- jest fresh (no shots cache at run time): `Tests: 2 skipped, 13335 passed, 13337 total`, rc 0 (base 13327/2 + 8; K05 counted passed in both).
- lifecycle, 7 `--only=` parts, each log lists only its own ids: 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, every `LC_RC=0`, no flake re-run needed.
- e2e full: `OBSIDIAN-E2E done: 603/616 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs` (base 596/611, 15: +5 new tests, +2 flipped; no flake hit).
- shots rc 0, 592 files, host-leak 163 kinds / 978, modal host-leak 40 / 240, capture clip 147. (No rendering or CSS changed; run anyway.)
- freeze `freeze OK (280/280 frozen print PNGs byte-identical`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- dse `git status --short` empty after the battery.

## Drive-by fixes:

None.

## Follow-ups:

- A Space-opened Reset is racy in the DRIVER, not the product: an ArrowDown sent about 9 ms after the Space-opened menu appears is not consumed by the menu's key scope (the keydown reaches the document, no item is selected, Enter then does nothing). Measured on the BASE too (probe PROBE-RV-SPACE: 5 of 5 ok earlier, 2 of 5 ok later under the same load, no fix involved). `resetFromKeyboard` waits 300 ms after the menu shows, which makes NEGO-F05 stable (ran in the focused run and the full run). Nobody can press that fast, so no ticket for the product; the same race could bite any future Space-opened menu e2e.
- `origin/develop` moved `e1be1775` to `2777484c` during r1; a rebase before landing is the owner's call (the touched files are only negotiation view / focusRules / negotiation e2e / matrix test).
- The `test.failing` header of `negotiation-bugs.test.ts` and the e2e `knownBug` mentions of SC-639 elsewhere (docs, dse-verify skill "Current expected numbers") are not updated here: new CURRENT numbers (jest 13335/2, e2e 603/616 + 13 known-bug) belong to the final round with the pointer bump.

## Evidence artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r1-impl/`:
- probe spec (temporary, not in the repo): `zz-probe-sc639.e2e.ts.txt`; driver `e2e-probe.sh`
- before probes: `probe-before.log`, `probe-before.json` (rv-key, lp-key, rv-space, rv-mouse, lp-mouse), `probe-before2.log`, `probe-before2.json` (rv-esc, rv-sealmouse); Space race: `probe-space-base1..4.*`, `probe-spaceB1..4.*`, `probe-spaceC1..5.*`
- after probes: `probe-after.log`, `probe-after.json`
- focused e2e: `e2e-focus1.log`; mutants: `jest-mut-M1..M4.log`, `e2e-mut-M3.log`, `e2e-mut-M1.log`, scripts `mut.py`, `mut-jest.sh`, `mut-e2e.sh`
- gates: `tsc.log`, `lint.log`, `jest-full.log`, `lc-part1.log` .. `lc-part7.log`, `e2e-full.log`, `shots.log`, `freeze.log`, `parity.log`, `npmci.log`
- this report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/sc639-r1-implementer-report.md`

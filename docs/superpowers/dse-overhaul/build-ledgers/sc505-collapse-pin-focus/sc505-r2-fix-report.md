# SC-505 r2 fix-round report

## Executive summary
- STATUS: DONE. dse `3717849` on origin/develop `efc17de`; superproject `6e7f67d` (CHANGELOG only, no pointer bump) on origin/main `7e45f8d`. Nothing pushed.
- Rebase: dse had no conflicts, range-diff a993a60..37da2f2 vs efc17de..081ee27 = both commits `=`. Superproject: one CHANGELOG conflict (SC-493's bullet vs mine), resolved by keeping both, mine first.
- Folded: HIGH-1 (41f7327), MEDIUM-1 incl. follow-up 3 superseded (f4068c5), LOW-1 (cfb95d2, claim removed), follow-up 5 (fdd3bb7), LOW-2 (3717849). One commit per finding.
- Gates on 3717849: tsc/lint clean; jest 6020 passed / 1 skipped / 243 of 244 (+5 over the 6015 base); lifecycle 36/36; e2e 120/120 ok, 0 failed, 0 known-bug, coverage 84/84 (+2 tests F05 F06, no new pairs); shots 592, 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- CHANGELOG bullet re-checked: still true as written (the two-pane case now holds); unchanged.

## Per finding
- HIGH-1 `41f7327`. The request records the pressed button, its pane (`.workspace-leaf`) and document; a copy in another pane neither claims nor cancels; focus still on the pressed button is "ours" (`src/framework/chrome/focusHandoff.ts` `armChromeFocus`, `claimChromeFocus.attempt`; `pipeline.ts` passes `pressed`). Proof: jest `chromeFocusHandoff.test.ts` "the OTHER pane rebuilding first ..." and "with focus already free ..." (both red on 37da2f2: log `r2-red1.log`; green after). e2e CHR-F06 (two panes, Tab+Enter on Pin in the second pane, focus ends on that pane's Pin): red on the r1 focus code with `Expected "chrome.pin" / Received "body"` (`r2-e2e-h1-red.log`), green after.
- MEDIUM-1 `f4068c5`. (a) `requestPinToSidebar` now resolves `true` only when the note's text changed (`registration.ts` `report.wrote`); `settleChromeFocus(key, pressed, wrote)` drops the request at once when nothing was written (second press, strictBody, every Notice path). (b) a capture-phase document `focusin` guard cancels a waiting request when focus lands anywhere but the pressed button or this pane's Pin button (`focusHandoff.ts` `guardFocus`/`onFocusIn`), installed on arm, removed when none is live. Proof (red on 37da2f2, green after): jest "a Pin that wrote nothing ... arms nothing", "focus that lands anywhere but on the Pin button ... cancels it", and `registration.test.ts` "requestPinToSidebar resolves true only when it wrote the note". Mutation: guard listener disabled -> the cancel test goes red (`r2-mutG.log`). Follow-up 3 (unregistered Notice) is covered by (a).
- LOW-1 `cfb95d2`. DECISION: the adoptView claim is REMOVED. The case it served needs a Pin followed by an adoption; only a view's own write is adopted (a claim ticket recorded by `host.replaceSource`, `viewRegistry.ts`), and the pin's write comes from the sidebar binder, so no ticket exists and nothing adopts; the rebuilds are fresh renders or section re-insertions, which `mountChrome`'s claim and its observer cover. Deleting it left e2e CHR-F01..F04, F06 and all of jest `test/dom/framework` (1003) green; `adoptView.ts` is byte-identical to base again. The comment in `focusHandoff.ts` states the reasoning.
- Follow-up 5 `fdd3bb7`: one bullet in `e2e/README.md` (scope page-side selectors to `.markdown-reading-view`).
- LOW-2 `3717849`. New CHR-F05 Tabs straight to Pin on a fresh note; CHR-F02 reaches Expand with `dse.tabTo`. With the hand-off neutralised (`isKeyboardClick` -> false) CHR-F05 fails at Pin (`Expected "chrome.pin", Received "body"`) and CHR-F02 fails at the Collapse assertion after pressing Expand reached by Tab (`r2-e2e-low2-red.log`). F04 kept as the Collapse+Expand-then-Pin three-rebuild variant.

## Gate lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r1-impl-q7x2/`)
- `g-tsc.log`, `g-lint.log` rc 0.
- `r2-jest1.log`: `Test Suites: 1 skipped, 243 passed, 243 of 244 total; Tests: 1 skipped, 6020 passed, 6021 total`.
- `r2-lifecycle.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`.
- `r2-e2e-full.log`: `OBSIDIAN-E2E done: 120/120 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`.
- `r2-shots2.log` rc 0, 592 PNGs, 0 FAIL, in-run lines as r1 (host-copy pin OK 1.15.0, button host-leak 113/678, modal 228, text scale 1626, once 107256/214, chrome host-leak 18). `freeze OK (280/280 ...)`. `r2-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

Drive-by fixes: none (the `chromeInsideStaminaBar.test.ts` mock now resolves `false` to match the new return type).

Follow-ups: none new. SC-511 untouched.

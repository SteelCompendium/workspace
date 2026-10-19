# SC-428 independent review, round 1

**Executive summary**
- VERDICT: **FIX-FIRST**. 0 BLOCKER, 0 HIGH, 2 MEDIUM, 2 LOW, 4 INFO. Reviewed DSE `c78a06b..138f23a` (tree clean before and after; nothing committed).
- All four spec items are fixed on every surface (strip, hero strip, popover, modal), shown by a 14-state jsdom matrix run on head and on base. Disabled buttons write nothing on click, synthetic click, or Enter/Space. Reasons come from one source (`model/StaminaBar.ts`). Real Obsidian shows the hover tooltip on disabled controls, and disabled is not shown by color alone (opacity 0.5, cursor, and the reason in the label).
- Gates (measured by me, head 138f23a): tsc 0, lint 0, jest 4804 passed / 1 skipped / 227 of 228, lifecycle 25/25, e2e `66/74 ok, 0 failed, 8 known-bug, coverage: 49/49 pairs`. All exit 0. No SC-428 known-bug marker remains.
- Flipped markers fail on base: the head tests run against base src give 28 failing jest tests, and e2e RECOV-R03, R08 and R10 FAIL on base.
- **MEDIUM-1 (new focus loss):** when a keyboard Catch Breath heals to full, the button disables while it has focus, and real Chromium drops focus to `<body>`. On base, focus stayed. I validated a 2-line fix.
- **MEDIUM-2 (visible change, not raised with Scott):** a mouse click on a marker now draws the 2px `:focus-visible` ring on the row, and the ring stays through the write. Shots can't catch it. Either Scott accepts it, or apply the fix I validated (`focusVisible:false` plus adoptView keeping focus-visibility).
- Owner Q (unresolved max): not a regression. Base enabled the button and spent a Recovery for +0. The implementer's claim was wrong: head shows **"Recovery value is 0"**, not "Already at maximum Stamina". That is still inaccurate, because the value is unknown. Small fix in LOW-1.
- Base moved again: DSE `origin/develop` is now `8ab5e91` (SC-429, MinionStaminaPoolModal only; merge-tree shows 0 conflicts), and superproject `origin/main` is `af33778`. The superproject CHANGELOG commit `0147822` conflicts with main's Unreleased list (adjacent insertion; trivial to resolve).

## Gates (reviewer-run, DSE worktree, head 138f23a)
| gate | result | rc | log |
|---|---|---|---|
| tsc (incl. e2e) | clean | 0 | evidence/review-r1/tsc.134319.log |
| lint | clean | 0 | evidence/review-r1/lint.134329.log |
| jest | `Tests: 1 skipped, 4804 passed, 4805 total` / `227 passed, 227 of 228` | 0 | evidence/review-r1/jest.134350.log |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` (port 9287) | 0 | evidence/review-r1/lifecycle.135251.log |
| e2e | `OBSIDIAN-E2E done: 66/74 ok, 0 failed, 8 known-bug, coverage: 49/49 pairs` | 0 | evidence/review-r1/e2e.134453.log |

The remaining known-bug markers are SC-427 x3, SC-431, SC-432 and SC-433 x3, so none is for SC-428. Shots, freeze and parity were not re-run: the CSS change is one new rule, and the implementer reported a 0-diff byte compare.

## Probe matrix (jsdom, real pipeline; head vs base)
Source: `evidence/review-r1/zzReviewProbe.test.ts` → `probe-head.json` / `probe-base.json`. Each run used the popover editor on, then tried synthetic click, Enter and Space on the disabled buttons.
| state | head strip / popover | base | writes after disabled activation |
|---|---|---|---|
| 48/48 r6 | disabled "Already at maximum Stamina" both | enabled; click wrote rec 5, cur 48 | 0 |
| 47/48 r6 | enabled; heals +1 → then disabled w/ reason | enabled, stays enabled at 48 | — |
| max 2, 2/2 and 1/2 | disabled "Recovery value is 0" both | enabled; click spent a Recovery for +0 | 0 |
| 0 Recoveries | "No Recoveries remaining" both | strip disabled (no reason), popover ENABLED | 0 |
| dying 0 / -5 | "Can't catch breath while dying" both | strip disabled, popover ENABLED | 0 |
| temp 5 at 48/48 | disabled at max | enabled | 0 |
| 50/48 (over max) | disabled "Already at maximum Stamina" | enabled, spent for +0 | 0 |
| winded 20/48 | enabled, heals 16 | same | — |
| hero fury 48/48 | disabled w/ reason | enabled, toast "Caught breath: +0 Stamina, −1 Recovery" | — |
| hero unresolved class + recoveries_max 8 | disabled **"Recovery value is 0"** | enabled, spent a Recovery for +0 | — |
| modal max2 0/2, 2/2 | "Spend Recovery: Recovery value is 0" | "…Already at maximum Stamina" | — |
| modal 48/48 / 47/48 / none | at-max / enabled / No Recoveries | same | — |

Real Obsidian hover (`e2eprobe-head-hover.log`): the disabled strip shows `Catch Breath: Already at maximum Stamina` and `Catch Breath: No Recoveries remaining`; the popover shows `Catch breath: Already at maximum Stamina` (opacity 0.5, cursor default); the modal shows `Spend Recovery: Already at maximum Stamina`. All tooltips render.

## Findings

### MEDIUM-1: a keyboard Catch Breath that reaches full Stamina drops focus to `<body>` (new with SC-428)
- `src/framework/kit/RecoveriesStrip.ts:340` (`catchBreath.setDisabled(state.catchBreathDisabled)` in `update`). The cause is Chromium's focus fixup on a focused control that becomes disabled.
- Scenario (real Obsidian, `e2eprobe-head.log` ZZP-1, `recoveries.md` 12/30, rv 10): Tab to Catch Breath, then Enter (22/30; focus stays), then Enter (30/30). Head: `active = BODY`, and Shift+Tab lands on an Obsidian chrome button. Base (`e2eprobe-basesrc-headtests-base.log`): focus stays on `recov.catch-breath`, and Shift+Tab goes to `recov.markers`. Before SC-428 only spending the last Recovery could cause this. Now every Catch Breath that fills Stamina does, which is the same keyboard-focus class as spec item 4. The hero strip has the same issue.
- Fix (validated in a scratch copy, `evidence/review-r1/validated-fix.diff`; R01/R02a/R03/R06/ZZP-1 all ok, `e2eprobe-fixtry-fv5.log`): in `update()`, hand focus to the slider row before disabling:
  ```ts
  const cbHadFocus = catchBreath.buttonEl.ownerDocument.activeElement === catchBreath.buttonEl;
  catchBreath.setDisabled(state.catchBreathDisabled);
  if (cbHadFocus && state.catchBreathDisabled && opts.canPersist) pipsEl.focus({ preventScroll: true });
  ```
  With this, focus is on `recov.markers` after the write and Shift+Tab goes to `stamina.bar`. Add a jsdom test (focus cb, click at 47/48, expect activeElement === row) and an e2e row (Tab to Catch Breath, Enter to full, `focusedControl() === 'recov.markers'`).

### MEDIUM-2: a mouse click on a marker now shows the 2px focus ring on the row, and it stays through the write
- `RecoveriesStrip.ts:250` (`pipsEl.focus({ preventScroll: true })`) and `host/adoptView.ts:49` (restore uses a plain `focus()`). Ring CSS: `styles-source.css:15439` `.dse-stamina-rec__pips[tabindex]:focus-visible`.
- Scenario (`e2eprobe-head-fv.log`): click marker 5 → `fv=true outline=solid/2px` immediately and after the write. A native click on a `tabindex=0` element draws no ring. Here the click is prevented by the shield and focus is moved by script, so Chromium treats it as focus-visible. Every mouse user now sees an outline after each marker click. That is a visual change, static shots can't catch it, and "no shot changed" is not evidence against it.
- Options: (a) disclose to Scott and let him accept it (a screenshot of the ring after a click), or (b) the fix I validated (`e2eprobe-fixtry-fv4.log`: no ring on click, no ring after the write, ring returns on Tab to the next control; R05/R09/R10 ok). Change RecoveriesStrip to `pipsEl.focus({ preventScroll: true, focusVisible: false } as FocusOptions)`, and make adoptView capture `visible = active.matches(':focus-visible')` in `FocusState` and restore with `focus({ preventScroll: true, focusVisible: state.visible })`. Without the adoptView half, the write's re-focus brings the ring back (`e2eprobe-fixtry-fv3.log`). The adoptView change touches every adopted view, so the lifecycle gate is mandatory if (b) is chosen. Chromium 150 in Obsidian 1.14.4 supports `focusVisible` (probe ZZF-2).

### LOW-1 (owner question): a hero with unresolved max Stamina shows "Recovery value is 0"
- `src/elements/hero/view.ts:440` (`recoveryValue: this.stats.recoveryValue.value ?? 0`) → `model/StaminaBar.ts:249` → `zeroHealReason(0)`.
- Measured: a hero with an unresolved class and authored `recoveries_max: 8` shows Catch Breath disabled with `Catch Breath: Recovery value is 0`, not "Already at maximum Stamina" as the implementer report says. **Not a regression.** On base the button was enabled and a click wrote `recoveries: 5` with toast "Caught breath: +0 Stamina, −1 Recovery", which is spec item 1's bug. Disabled is the correct behavior. Only the wording is wrong: the recovery value is unknown, not 0. The hero modal bridge says the same thing (`max: 0`, `opts.recoveryValue` undefined → "Spend Recovery: Recovery value is 0").
- Fix (small): add `REASON_RECOVERY_VALUE_UNKNOWN = 'Max Stamina unknown'` (or similar) to `model/StaminaBar.ts`. In `HeroSheetView.catchBreathBlock`, return it when `this.stats.recoveryValue.value === null`, after the none-left and dying checks so precedence holds. Add one entry-points test (NO_SUCH_CLASS + `recoveries_max`). The modal half can use the same constant when the hero passes no `recoveryValue` and `recoveriesMax` is tracked; optional.

### LOW-2: two tests overstate what they prove
- `test/dom/views/stamina-recoveries-matrix.test.ts:84`: `expect(recoveriesOf(lastWrite(host))).not.toBe('5')` passes on any write other than 5. Use `expect(host.replaceSource).not.toHaveBeenCalled()` instead, as the sibling R03 tests do.
- `:194` "focus survives the click's own re-render": in jsdom `replaceSource` is a mock, so no section re-draw or adoption happens. The test only shows the row keeps focus through an in-place `update()`. Rename it, or note that e2e RECOV-R10 is the real proof. The coverage is real; the title says more than it proves.

### INFO
- **Base drift:** DSE `origin/develop` is `8ab5e91` (SC-429: `MinionStaminaPoolModal.ts`, its test, CHANGELOG), and `git merge-tree` shows 0 conflicts with this branch. Superproject `origin/main` is `af33778`. Worktree commit `0147822` (parent `e2cfcef`) conflicts in `CHANGELOG.md` at the Unreleased list (both sides insert at the top; keep both bullets). The ledger's "land-ready must be on c78a06b" is stale, so re-run the gates after rebasing.
- **CHANGELOG `0147822` wording:** user-facing and accurate ("At full Stamina (or a recovery value of 0, max Stamina 2 or less) … disabled with a reason tooltip …; after clicking a marker the arrow keys and Escape now work from the row, with no Tab first"). If MEDIUM-2 is accepted as-is, consider adding "the row shows its focus outline". The DSE `CHANGELOG.md` and `docs/stamina-bar.md` edits are also accurate.
- **`labelWithReason`:** matches SC-324's name-first pattern. Strip, popover, read-only strip and modal Spend Recovery all compose through it, and the old `spendRecoveryReasonLabel` delegates to it, so nothing composes twice. One sibling left inline in a touched file: `hero/view.ts:210` `` `Respite: ${READ_ONLY_TOOLTIP}` ``. Optional to convert. Other SC-324 labels are static strings.
- **Popover keyboard path (pre-existing, code reading only):** pressing the popover's "Catch breath" with the keyboard runs `closePopover()` (`RecoveriesStrip.ts:220`), which removes the focused button, so focus falls to `<body>`. Same on base and same class as MEDIUM-1. Folding `pipsEl.focus({preventScroll:true})` into that handler before `closePopover()` would close it. Optional.
- Focus fix root cause confirmed: `pipeline.ts:220-239` `armClickShield` preventDefaults capture-phase `mousedown`/`pointerdown`. The focus call is click-only, so it never fires on external edits or other blocks. ZZP-3: after blur plus an external `vault.process` edit, focus stays on BODY and `scrollTop` is 0. The popover path focuses the row (ZZP-4), and the row keeps focus through +/- clicks and the write. `preventScroll: true` is present.

## Artifacts
All in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/evidence/review-r1/`: the gate logs and rc files; `zzReviewProbe.test.ts` (jsdom probe) with `probe-head.json` and `probe-base.json`; `failbase.log` (head tests against base src: 28 failed); `e2eprobe-*.log` (focus, hover and focus-visible probes on head, base and the fix copy); `zz-review*.e2e.ts` (probe specs); `validated-fix.diff` (the MEDIUM-1 and MEDIUM-2(b) changes I tried; not applied to the branch).

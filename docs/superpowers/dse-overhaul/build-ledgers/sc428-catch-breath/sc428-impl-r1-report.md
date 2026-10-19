# SC-428 implementer report, round 1

**Executive summary**
- STATUS: DONE. DSE branch `sc428-catch-breath`, head `138f23a`, rebased onto `origin/develop` `c78a06b` (base moved 7644fb3 -> f8e050f -> a89ffd9 -> c78a06b; each rebased, SC-324's name-first label pattern adopted).
- All four items implemented; every SC-428 known-bug marker flipped and verified failing on pre-fix code.
- Final battery at c78a06b: tsc/lint clean; jest 4804 passed / 1 skipped / 227 of 228 suites; lifecycle 25/25; e2e 66/74 ok, 0 failed, 8 known-bug, coverage 49/49; shots 572, 0 FAIL; freeze 276/276 OK (no rebaseline); parity 0 GAP / 0 undeclared / 24 DECLARED. All exit 0.
- No shot changed at all (byte-compared pre-fix vs post-fix for stamina-bar + hero elements), so no sanction ask.
- Focus-loss root cause: the element click shield (`pipeline.ts armClickShield`) preventDefaults every non-editable pointerdown/mousedown in a card, and a prevented press cannot move focus. Not a re-render.

## Commits (DSE repo `/home/scott/code/steelCompendium/worktrees/sc428-catch-breath/draw-steel-elements`)
- `43fef1b` items 1-3: shared predicate/reasons, strip + hero + popover + modal, flips, unit tests
- `d145523` item 4: marker click focuses the slider row; e2e flips, [RECOV-R10]
- `cc029ca` docs: docs/stamina-bar.md + DSE CHANGELOG.md (7.0.0 unreleased list)
- `257a9fc` test: find a disabled Catch Breath by its icon
- `138f23a` labels lead with the name (SC-324 pattern), kit `labelWithReason`
- Superproject `0147822` (worktree root): CHANGELOG.md `## Unreleased` bullet. Submodule pointer NOT bumped (land step does it). No push, no tag.

## Design
- `src/model/StaminaBar.ts`: `catchBreathBlockedReason({remaining,dying,recoveryValue,current,max})` (precedence: none left, dying, zero heal), `zeroHealReason(recoveryValue)` (zero value wins over at-max), constants `REASON_*`. Used by stamina-bar view, hero view (gate AND the defensive guard in `catchBreath()`), and the modal (`zeroHealReason`, `REASON_NO_RECOVERIES`).
- Kit `labelWithReason(name, reason)` in `framework/kit/tooltip.ts`: SC-324 name-first label, used by strip, popover and modal.
- `RecoveriesStrip` state gains `catchBreathReason`; popover button is built on demand so it keeps the latest state and repaints in place; real `disabled`; extra CSS rule `.dse-stamina-rec__pop-cb[disabled]` (dim, mirrors `.dse-btn[disabled]`).
- Reason strings (exact):
  - bare: `No Recoveries remaining` | `Can't catch breath while dying` | `Recovery value is 0` | `Already at maximum Stamina`
  - strip: `Catch Breath: <reason>`; popover: `Catch breath: <reason>`; modal: `Spend Recovery: <reason>`; read-only strip unchanged `Catch Breath: Read-only in this context`
  - Enabled popover button has no aria-label (visible text is its name).
- Item 4 fix: in `RecoveriesStrip` marker-row click handler, `pipsEl.focus({preventScroll:true})` (kit "selection follows focus" pattern). The existing `adoptView` captureFocus/restore then carries focus through the write re-draw (verified in real Obsidian: focusout/REMOVED/focusin, row refocused).

## Flipped markers and fail-before evidence
Stash of src/css to 7644fb3, same test files, run, restore:
- jest: `stamina-entry-points-matrix` R03 x2; `stamina-recoveries-matrix` R03 x3 + R08 popover (3 cases + full) ; `stamina-edit-modal-matrix` Q16. Pre-fix run (4 files): 23 failed (log `evidence/jest-prefix-fail.log`; focus tests: 13 failed in the recoveries matrix file, `evidence/jest-focus-prefix-fail.log`). Post-fix: all pass.
- e2e: `knownBug('SC-428')` x2 became plain `[RECOV-R03]`, `[RECOV-R08]`. Pre-fix run of RECOV-R03,R05,R08,R09,R10: 0/5 ok, 5 failed (R03/R08 "not disabled"; R05/R09/R10 "control does not have focus (focus is on null)") — `evidence/e2e-prefix-fail.log`. Post-fix pass. Titles no longer contain "[known bug SC-428]".

## New / changed tests
- jest: unit `stamina-bar.test.ts` (catchBreathBlockedReason 7 cases + availability + zeroHealReason); recoveries matrix: reason text for 0 Recoveries / dying x2 / full (strip and popover), recovery-value-0 both buttons, disabled popover click writes nothing + stays open, open popover follows state in place, 4 focus tests ([R04]: focus row, survives update, popover mode + Escape, read-only inert); modal matrix Q16 x2 (zero value reason, precedence); entry-points hero R03 now also asserts the reason; `staminaRecoveries.test.ts` selectors/labels.
- e2e: `[RECOV-R10]` (focus on row after click, through the write, ArrowLeft with no Tab, Tab moves to Catch Breath); R05/R09 lost their Tab-first workaround; manifest: `recov.pop.catch-breath` + `click-disabled`, `recov.markers` + `press:Tab` (coverage 47 -> 49 pairs).

## Gates (final, base c78a06b, head 138f23a; logs in `evidence/final/`)
| gate | result | exit |
|---|---|---|
| tsc (incl. e2e) | clean | 0 |
| lint (incl. e2e/) | clean | 0 |
| jest | 4804 passed / 1 skipped / 4805 total; 227 of 228 suites | 0 |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed` | 0 |
| e2e | `OBSIDIAN-E2E done: 66/74 ok, 0 failed, 8 known-bug, coverage: 49/49 pairs` | 0 |
| shots | 572 PNGs, 0 FAIL | 0 |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical ...)` | 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 0 |

Note: a first jest run in a fresh worktree shows 2 skipped (the printTwin test skips until shots has created the cached app.css); after shots, 1 skipped.

## Visual
No shot changed (stamina-bar + hero elements byte-compared at 7644fb3-pre-fix vs fixed: 0 differences; the full 572 set identical to the earlier post-fix set). Images for Scott (real Obsidian, Steel):
- before (enabled at 30/30, 3 of 6): `evidence/before-full-stamina-catch-breath-ENABLED.png`
- after (dimmed, label `Catch Breath: Already at maximum Stamina`): `evidence/after-full-stamina-catch-breath-DISABLED.png`
- before popover at 0 Recoveries (enabled): `evidence/before-popover-zero-recoveries-ENABLED.png` (full-page failure screenshot)

## Drive-by fixes
- None beyond scope. (Doc note in `StaminaEditModal.recoverySpendResult` updated as the spec asked; `docs/stamina-bar.md` updated.)

## Follow-ups
- The click shield (preventDefault on every non-editable press) also means a click on any other roving-tabindex widget in a card (kit `track` slots, `powerRollPanel` rows, tabs) does not take keyboard focus; same class as item 4, fixed here only for the Recoveries row. Worth a ticket.
- Hero with unresolved max Stamina: `catchBreath` already used `max ?? current` so heal was 0; the button now reads disabled with "Already at maximum Stamina", which is slightly misleading for that edge (pre-existing data gap, SC-425 area).
- Evidence/probe artifacts live under the ledger dir `evidence/`; e2e failure bundles are in the DSE worktree `e2e/.out/` (gitignored).
- Environment: scratchpad `gate.sh` was overwritten by another session mid-run (cost one shots rc); I used a private `scratchpad/sc428-impl-r1/gate.sh` thereafter. Worktree `node_modules` was copied (cp -a) from the main checkout (same lockfile).

## Artifacts
- Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc428-catch-breath/evidence/final/{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log` (+ `.rc`)
- Fail-before: `.../evidence/jest-prefix-fail.log`, `jest-focus-prefix-fail.log`, `e2e-prefix-fail.log`
- Focus probe: `.../evidence/probe3.log` (post-fix focus event trace), `probe2.log` (pre-fix: pointerdown/click, no mousedown, no focusin), `zz-probe.e2e.ts.txt`
- Images: `.../evidence/after-full-stamina-catch-breath-DISABLED.png`, `before-full-stamina-catch-breath-ENABLED.png`, `before-popover-zero-recoveries-ENABLED.png`
- No rebaseline.txt (freeze green).

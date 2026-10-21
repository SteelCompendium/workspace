# SC-432 r1 implementation report

## Executive summary
- Verdict: DONE. Creatures: Spend Recovery disabled (never overridden by none-left / at-max). No-pool hero: button relabelled, confirm on FIRST press per modal session. Pool hero: unchanged.
- dse branch `sc432-free-recovery` head `1ddef76` (base `ab34293`, origin/develop unmoved, no rebase): `a52a5bd` feat, `89b1dff` e2e, `1ddef76` docs. Superproject `8511748` (CHANGELOG only; dse pointer NOT bumped, shows ` M draw-steel-elements`).
- Gates: tsc clean · lint clean · jest 5292 passed / 1 skipped / 230 of 231 suites · lifecycle 27/27 · e2e `88/91 ok, 0 failed, 3 known-bug, coverage: 59/59 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK` · freeze `276/276` (no rebaseline) · parity 0 gaps / 0 undeclared / 24 declared.
- Strings: button `Heal Recovery Value` (tooltip `Heal Recovery Value: Spends no Recovery`); creature tooltip `Spend Recovery: Creatures have no Recoveries`; dialog title `Heal without spending a Recovery?`, buttons `Cancel` / `Heal`.
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/evidence/` (4 shots + a tooltip variant).

## Entry-point survey (every host that opens `StaminaEditModal`)
| Host | file:line | hero/creature | pool? | Result now |
|---|---|---|---|---|
| ds-stamina-bar | `src/elements/stamina-bar/view.ts:157` | `isHero=true` always | pool iff `recoveries_max` set (`recoveriesTracked`) | pool: Spend Recovery unchanged; no pool (legacy block): Heal Recovery Value + confirm |
| initiative hero (numeric control + row bar, one closure) | `src/elements/initiative/view.ts:1437` | `true` | never (`StaminaBar.fromHero` has no recoveries) | Heal Recovery Value + confirm |
| initiative creature (detail row, bar, roster-cell dblclick) | `src/elements/initiative/view.ts:1881` | `false` | never | Spend Recovery disabled, creature reason |
| ds-hero sheet | `src/elements/hero/view.ts:380` | `true` | `tracked = recoveriesMax !== null`; passes `spendRecovery: tracked` | pool: unchanged; no pool: control not rendered at all (SC-132 H1), unchanged |
| minion pool modal | `src/views/MinionStaminaPoolModal.ts` | does not use `StaminaEditModal` (shares only helpers); no Spend Recovery | n/a | untouched |
Other grep hits (`LogActionModal.ts`, `staminaGauge.ts`, `model/StaminaBar.ts`) are comments only. Decision rule: `isCreature = !isHero`; `isFreeHeal = isHero && !recoveriesTracked`; `recoveriesTracked = recoveries_max !== undefined` (unchanged gate).

## Design notes
- `src/views/FreeHealConfirmModal.ts` (new, same shape as `ResetEncounterModal`: kit `DseModal`, Cancel first so it takes initial focus). Exports the shared strings (`FREE_HEAL_LABEL`, `FREE_HEAL_NOTE`, title/button constants, `freeHealConfirmMessage`). `REASON_CREATURE_NO_RECOVERIES` lives with the other reasons in `model/StaminaBar.ts` (SC-428 single source). Tooltips composed with kit `labelWithReason` (SC-324: name first, then reason; the visible text is the prefix of the aria-label).
- `StaminaEditModal`: first press of the free-heal button (only when the press would heal > 0) opens the confirm via `openManagedModal(this.lifecycle, …)`, so the dialog closes if the stamina modal does. Nothing is staged until Confirm; Confirm sets `freeHealConfirmed = true` (private field, per modal instance = per session) and stages via a shared `stageRecovery()` recomputed from live state, identical math to before. Cancel / Escape / X leave state untouched and `freeHealConfirmed` false (next press asks again). Reset does not reset the flag. The dialog's `onClose` refocuses the heal button.
- Creature branch in `refresh()` runs before the tracked/untracked branches, so it wins over none-left / at-max; `onClick` has an `isCreature` early-return backstop.
- Escape: real Obsidian 1.14.4 e2e (`STAM-Q13E`) shows Escape on the confirm closes only the confirm; stamina modal and its pending Damage survive and Apply still writes it. Nested-modal case needs no `escapeConsumer` work.
- Dialog copy: "This hero has no Recoveries tracked, so there is no Recovery to spend. Heal Recovery Value heals one Recovery's worth of Stamina (N) and does not track or spend a Recovery. You won't be asked again while this window is open." (N = recovery value).
- `e2e/driver/dse.ts` `modal(kind)` now selects `.modal-container .dse-modal:has(<kind marker>)` and counts per kind, so a confirm open over the stamina modal doesn't make `modal('stamina-edit')` ambiguous; new kind `free-heal-confirm`. (Slight loosening: a wrong-kind modal now reads as "no <kind> modal opened" rather than the old "is not a <kind> modal".)

## Test changes
- Jest `stamina-edit-modal-matrix.test.ts`: `[Q13] … [known bug SC-432]` `test.failing` describe -> plain creature suite (6 rows incl. at-max / none-left not overriding, synthetic click stages nothing) + new hero-no-pool matrix (7 positions incl. the 3-presses repro); the five `[current behaviour — SC-432 changes this]` position rows, `[Q16] max 3` and the other creature+pool rows converted to heroes with a pool (the engine math is hero-only now), suffixes removed.
- `stamina-edit-modal.test.ts`: the two `[current behaviour — SC-432 will relabel + confirm]` pins (:147, :263) rewritten, one at-max pin and the all-controls-are-buttons list updated to the new label; new `SC-432` describe (creature x5 + click + Reset; no-pool hero: label/tooltip, first press asks + stages nothing, Confirm, no re-ask incl. after Reset, Cancel + pending intact + asks again, Escape via the stand-in keymap, parent close closes dialog, at-max never asks, fresh modal asks again; pool hero unchanged).
- `test/dom/e2eCensus.test.ts`: census of the confirm dialog's two ids.
- e2e: `STAM-Q13` (rewritten: relabel, ask, nothing staged before Confirm, Confirm, no re-ask, note file gets 30 and has no `recoveries`/`recoveries_max`), new `STAM-Q13C` (Cancel; pending Damage survives; asks again; no write), `STAM-Q13E` (Escape only closes the dialog; Apply still writes the pending edit), `STAM-Q13P` (pool hero: no dialog, `recoveries: 2` in the note), `INIT-STAM-Q13` (knownBug -> plain: creature disabled + reason + click no-op + no write), `INIT-STAM-Q13H` (initiative hero: relabel, ask, Confirm, note gets 25). Manifest rows `sedit.free-heal.cancel` / `.confirm` (click). Coverage 57 -> 59 pairs.
- `grep -rn "SC-432"` in `test/ e2e/ src/ docs/`: only descriptive comments/titles for the new behaviour; no `known bug SC-432`, no `current behaviour — SC-432`.
- Docs: `docs/initiative-tracker.md`, `docs/stamina-bar.md`, `e2e/README.md` (example suffix made generic `SC-nnn`), superproject `CHANGELOG.md` Unreleased bullet.

## Notes on gates
- New worktree had no `node_modules`: ran `npm ci` (rc 0) and `npm run host-css` (fetch of the pinned app.css into gitignored `visual-harness/dist/`). Without the cached sheet jest shows 2 skipped (the `printTwinDeltaAllowedSet` it.skip is environment-conditional); with it, 1 skipped, matching baseline.
- Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`.
- Evidence taken with a scratch e2e spec (deleted, never committed) from real Obsidian 1.14.4: `evidence/sc432-a-creature-disabled-spend-recovery.png` (hover tooltip legible), `sc432-b-hero-no-pool-relabelled.png`, `sc432-b-hero-no-pool-relabelled-tooltip.png`, `sc432-c-confirmation-over-stamina-modal.png`, `sc432-d-hero-with-pool-unchanged.png`.
- No frozen shot changed; no `rebaseline.txt`.
- Commits carry no Claude/co-author trailer (Scott's global CLAUDE.md forbids it; it takes precedence over the attribution reminder).

## Follow-ups
- `ds-stamina-bar` always opens the modal as a hero (`isHero=true`, `stamina-bar/view.ts:157`); a bar that represents a monster has no way to say so, so it gets the no-pool hero heal (and floor of -max/2). Not changed here.
- The hero sheet with an unresolved class hides the button (SC-132) rather than showing a disabled/relabelled one; consistent with before, left as is.

## Drive-by fixes
None.

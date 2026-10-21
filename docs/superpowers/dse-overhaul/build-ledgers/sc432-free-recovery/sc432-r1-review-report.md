# SC-432 r1 independent review (reviewer B)

## Executive summary
- Verdict: **LAND-READY**. dse `1ddef76` on `ab34293`; superproject CHANGELOG `8511748`. Branch not modified (status before = after: dse clean, superproject ` M draw-steel-elements` only).
- Severity counts: BLOCKER 0 · HIGH 0 · MEDIUM 0 · LOW 2 · INFO 6.
- Re-run gates match the implementer's numbers exactly: tsc clean · lint clean · jest 5292 passed / 1 skipped / 230 of 231 · lifecycle 27/27 (port 9293) · e2e `88/91 ok, 0 failed, 3 known-bug, coverage: 59/59 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK` · freeze `276/276` · parity 0 gaps / 0 undeclared / 24 declared.
- Mutations: 9 product mutations, every one turns jest red; 6 run through the new e2e subset, every one turns e2e red. The tests are not vacuous.
- Real-Obsidian probes (11 scratch scenarios) all behave correctly: X, click outside, Escape, keyboard Enter, double-click, navigating away, an external edit, and an SC-340 adopting write all work with the confirmation open. A second block asks again and writes its own block.
- Classification: none of the 4 call sites misclassifies. No hero with a pool gets the relabel or the confirmation, and no creature signal is ignored. The DROP ruling on stamina-bar stands, because the bar schema has no creature field.
- The two LOWs are an e2e driver gap (host controls are not scoped to a modal, so the confirmation's X and backdrop have no e2e coverage) and a copy nit (the dialog's "(10)" is the Recovery value even when the heal will be capped).

## Gate re-runs (logs in this dir, `sc432-r1-review-<gate>.log`, each ends `RC=<rc>`)
| Gate | Measured | Implementer | rc |
|---|---|---|---|
| tsc (`tsc` + `tsc -p e2e`) | clean | clean | 0 |
| lint | clean | clean | 0 |
| jest (`rm -f main.js styles.css` first) | 5292 passed / 1 skipped / 230 of 231 | same | 0 |
| lifecycle (`DSE_LIFECYCLE_PORT=9293`) | 27/27 ok, 0 failed | same | 0 |
| e2e full | 88/91 ok, 0 failed, 3 known-bug (SC-433 ×3), coverage 59/59 | same | 0 |
| shots | 572 PNG, 0 FAIL, pressed toggle parity OK | same | 0 |
| freeze | 276/276 | same | 0 |
| parity | 0 gap / 0 undeclared / 24 declared | same | 0 |

## Probe results
### 1. Classification at every entry point
| Entry | file:line | Result |
|---|---|---|
| ds-stamina-bar / ds-stamina / ds-stam | `src/elements/stamina-bar/view.ts:157` (`isHero=true`) | Pool iff `recoveries_max` is set. Legacy block: relabelled and confirmed. `recoveries_max: 0`: probed, stays "Spend Recovery", disabled "No Recoveries remaining", no dialog. |
| initiative hero (numeric + bar) | `src/elements/initiative/view.ts:1437` | Always no-pool (`StaminaBar.fromHero` carries no recoveries; the `Hero` type has no recoveries field). `isHero` is forced by list placement (`initiative/model.ts:163/204`). |
| initiative creature (detail bar, numeric, roster dblclick) | `src/elements/initiative/view.ts:1881` | One function serves all 3 routes. Disabled with the creature reason. |
| minion pool | `MinionStaminaPoolModal` | Not a StaminaEditModal and has no Spend Recovery. Unaffected. |
| ds-hero sheet | `src/elements/hero/view.ts:380` | Pool: unchanged. No pool: `spendRecovery: tracked` hides the button (SC-132 H1, unchanged). |
No other host constructs `StaminaEditModal`, and no element embeds the stamina-bar view. `StaminaBarSchema.yaml` has no creature/hero field, so the DROP ruling stands.

### 2. Confirmation lifecycle in real Obsidian 1.14.4 (scratch spec `sc432-r1-review-probe-spec.log`, output `sc432-r1-review-probes.log`)
- **PROBE-X**: the confirmation's own X closes only the dialog. The pending "Lose 1 Stamina" survives, focus returns to the heal button, the next press asks again, and nothing is written.
- **PROBE-BG**: a click outside the dialog (viewport 5,5) closes only the dialog. Pending state is intact and nothing is written.
- **PROBE-NAV**: navigating the leaf to another note with the dialog open leaves 0 `.modal-container` and the note text byte-identical.
- **PROBE-EXT**: an external `vault.process` edit outside the block, with the dialog open. Obsidian does not re-render the unchanged section, so both modals stay. Confirm stages from live state ("Gain 9 Stamina" = -1 + 10) and Apply writes `current_stamina: 11` while keeping the external edit.
- **PROBE-ADOPT** (SC-340): in the initiative tracker, the hero modal stages Damage 15 and the dialog opens. A page-side roster-cell click then makes a real selection write. Both modals survive (adoption). Confirm gives "Lose 5 Stamina", and Apply writes Alice `current_stamina: 25` and keeps `selectedInstanceKey: 0-2`.
- **PROBE-TWO**: confirm and Apply on block 0, then open block 1. It asks again (the flag does not leak across modals or blocks), and the blocks end at 12 and 15.
- **PROBE-KBD**: Tab to the heal button and press Enter. The dialog opens with focus on Cancel; Enter cancels, nothing is staged, and focus returns to the heal button.
- **PROBE-DBL**: a double-click on the heal button leaves the dialog open (2 modals) with nothing staged. No flash-close and no bypass.
- Escape: covered by the shipped `STAM-Q13E`, which passed in the full run.

### 3. Note-file integrity
- **PROBE-BYTES / PROBE-NOMAX**: the Confirm path writes the new `current_stamina`, and `recoveries: 3` (when present without a max) is preserved. No `recoveries`/`recoveries_max` key is added, and nothing outside the block changes. The block also gains `collapsible`/`collapse_default`/`height`/`style` defaults, but **PROBE-BASEDMG** shows a plain Damage+Apply does exactly the same on this branch through code SC-432 does not touch. That is the pre-existing serializer (INFO-5), not SC-432.
- Cancel/Escape/X: `expectNoWrite` holds (shipped Q13C/Q13E plus PROBE-X/BG/NAV).
- Pool hero: `STAM-Q13P` (no dialog, `recoveries: 2`) and the jest pool rows are unchanged apart from the creature→hero conversion of the position matrix. That conversion is sound: the rows' expectations do not depend on the floor.

### 4. Tests are not vacuous (`sc432-r1-review-mutations.log`)
| Mutation | jest (321 targeted) | e2e subset (6) |
|---|---|---|
| M1 drop creature disable + backstop | 14 red | INIT-STAM-Q13 red |
| M1b drop only the refresh() creature branch | 12 red | n/a |
| M2 no confirmation | 16 red | Q13, Q13C, Q13E, INIT-Q13H red |
| M3 re-ask every press | 4 red | Q13 red |
| M4 Cancel/dismiss also stages | 9 red | Q13, Q13C, Q13E, INIT-Q13H red |
| M5 pool hero also asks | 28 red | Q13P red |
| M6 no relabel | 1 red | n/a |
| M7 stage before asking | 10 red | Q13, Q13C, Q13E, INIT-Q13H red |
| M8 session flag static (leaks across modals) | 13 red | n/a |
- `grep -rn SC-432 test e2e src docs`: 21 hits. None is `known bug SC-432`, `current behaviour — SC-432`, `knownBug('SC-432'` or `test.failing`; all are descriptive history. The remaining `test.failing`/`knownBug` are SC-425/SC-433/CB-*.
- Driver loosening (`e2e/driver/dse.ts:204`, `:has(<kind marker>)`): it cannot make an existing assertion vacuous. A wrong kind still fails ("no X modal opened"). A stray modal of another kind is still caught by the post-test orphan invariant (`e2e/driver/invariants.ts:103`, observed firing in my PROBE-ZERO first run), and no spec calls `closeModals()` before the invariants run. Per-kind uniqueness is kept.

### 5. Copy / accessibility
- The strings are literal, and no-pool copy never claims a spend: button "Heal Recovery Value"; tooltip "Heal Recovery Value: Spends no Recovery"; creature "Spend Recovery: Creatures have no Recoveries"; dialog title "Heal without spending a Recovery?", body "…does not track or spend a Recovery…"; buttons Cancel / Heal.
- The name-then-reason pattern is followed through kit `labelWithReason`. Each string has one source: `FREE_HEAL_*` in `src/views/FreeHealConfirmModal.ts:16-22` and `REASON_CREATURE_NO_RECOVERIES` in `src/model/StaminaBar.ts:222`. No duplicate literals in `src/`.
- Colour is never the only signal. Disabled is the real `disabled` attribute plus dimmed text plus the reason in the tooltip. The dialog buttons differ by their labels, and Cancel takes initial focus (the safe default).

## Findings

### LOW-1: e2e host controls are not scoped to a modal, so the confirmation's X and backdrop cannot be driven and are uncovered
- Where: `e2e/driver/dse.ts:84` (`scopeOf().control` resolves `HOST_CONTROLS` from the document root) and `:54-55` (`'modal.close'`, `'modal.backdrop'`). Manifest `e2e/manifest/stamina-edit-modal.ts` has no X/backdrop rows for the confirmation.
- Failure scenario: a future spec writes `dialog.control('modal.close')` while the confirmation is open. It resolves to the **stamina** modal's X (first in DOM, under the overlay) and fails with "click intercepted". Alternatively, a regression that made the confirmation's X or click-outside close both modals (dropping the pending edit) would pass the whole suite, because only Escape and Cancel are covered. My PROBE-X/PROBE-BG show today's behaviour is correct.
- Fix: in `scopeOf`, resolve host controls inside `root`'s own `.modal-container`. For example, select the last `.modal-container` that contains `root`, or use `root.parentElement.closest('.modal-container')` and query `.modal-header-button` / `.modal-bg` under it. Then add `[STAM-Q13X]` (X on the confirmation closes only it; pending survives; asks again; no write) and, optionally, the backdrop variant.

### LOW-2: the dialog quotes the Recovery value, not what this press will heal
- Where: `src/views/StaminaEditModal.ts:594` (passes `recoveryValueNow()`) and `src/views/FreeHealConfirmModal.ts:27`.
- Scenario: a hero at 25/30 presses Heal Recovery Value. The dialog says "heals one Recovery's worth of Stamina (10)", and Confirm stages +5 (capped at max). The statement is technically true (one Recovery's worth is 10) but can read as a promise.
- Fix (wording call for Scott at the evidence post): either keep it as is, or pass the press's actual `gain` (already computed at `:589`) and word it, e.g., "heals N Stamina (one Recovery's worth, up to your maximum)". No logic risk either way.

### INFO
1. **INFO-1:** `openManagedModal(this.lifecycle, …)` at `StaminaEditModal.ts:595` registers a fresh closer on the stamina modal's lifecycle for every ask, so repeated Cancel→press cycles add closures until that modal closes. `close()` is idempotent, so the cost is a few closures per session. No action needed.
2. **INFO-2:** after Confirm, `onDismissed` refocuses the heal button (`:603`). When the confirmed heal reaches max, that button is now disabled, so the focus call does nothing and focus falls to the body. The pool path does the same. Optional: fall back to the Apply button when the heal button is disabled.
3. **INFO-3:** for a block with `recoveries: N` but no `recoveries_max` (schema-legal), the existing presence gate classifies it as no-pool. The dialog then says "This hero has no Recoveries tracked", and `recoveries` is preserved untouched (PROBE-NOMAX). This matches `docs/stamina-bar.md` and the StaminaBar field comment. Not a regression.
4. **INFO-4:** the creature's disabled reason can only be read by hover, because disabled buttons cannot take focus. This is the existing SC-324 pattern shared with "No Recoveries remaining". Not new.
5. **INFO-5 (pre-existing, not SC-432):** any stamina-bar write on a legacy block re-serializes the block with the `collapsible: true`, `collapse_default: false`, `height: 1`, `style: default` defaults (PROBE-BASEDMG, plain Damage). Possibly worth a Backlog ticket if it isn't already known.
6. **INFO-6:** the driver loosening at `e2e/driver/dse.ts:204` is safe (see §4). The changed error text for a wrong-kind modal is still a failure.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-review-report.md`
- Gate logs: `.../sc432-r1-review-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity}.log`
- Mutation log: `.../sc432-r1-review-mutations.log`. Probe output: `.../sc432-r1-review-probes.log`. Probe spec source: `.../sc432-r1-review-probe-spec.log`.
- Scratch: a copy of dse at `<scratchpad>/mut-dse` (node_modules symlinked to the worktree's) plus wrapper scripts. All were deleted after the run, and nothing was written into the worktree except gitignored build outputs from the gates (`main.js`, `styles.css`, `visual-harness/shots`).

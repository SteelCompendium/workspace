# SC-432 r2 scoped re-review (reviewer B)

## Executive summary
- Verdict: **LAND-READY**. I reviewed only the delta dse `1ddef76..21a0244`. The superproject is unchanged at `8511748` (no CHANGELOG delta). The branch was not modified: status is the same before and after (dse clean; superproject ` M draw-steel-elements` only).
- Severity counts: BLOCKER 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 2.
- **LOW-1 is folded correctly.** Modal scopes now find `modal.close` and `modal.backdrop` inside their own `.modal-container`, and the new `[STAM-Q13X]` is real coverage. It goes red on three mutations: X/backdrop/Escape closing both modals, a backdrop-only close-both, and a dismissal that stages the heal. It also goes red when the driver scoping is reverted (the click is intercepted by the X underneath). The existing host-control callers STAM-F07b and F07c pass both with and without the scoping.
- **LOW-2 is folded correctly.** The copy is literal and matches the ledger wording: "...heals one Recovery's worth of Stamina (N), stopping at maximum Stamina, and does not track or spend a Recovery...". The jest assertion goes red when the phrase is reverted.
- Gates (my own runs, private wrapper `sc432-r2-rereview-scripts/sc432-r2b-gate.sh`; each log starts with a reviewer-B run stamp): tsc clean · lint clean · jest 5292 passed / 1 skipped / 230 of 231 · **e2e full `89/92 ok, 0 failed, 3 known-bug (SC-433 ×3), coverage: 59/59 pairs`, run id `20261020-175135-d678`, rc 0** (evidence of record) · freeze 276/276.
- Lifecycle, shots and parity were not re-run: the only `src/` change in the delta is one copy string in a dialog that no harness shot renders. Freeze passed against the r2 shots (13:39-13:43).

## Delta reviewed
- `e2e/driver/dse.ts:89-104` `scopeOf(root, isModal)`: with `isModal` it resolves host ids under `root.parentElement()`. The root is the kit `dialogEl()` (`.modal`, where `.dse-modal` is added at `managedModal.ts:48`), so its parent is the `.modal-container` that holds both the X and the `.modal-bg`. The lookup stays lazy, so it re-resolves the way the root does. Block and toast scopes keep the page-wide lookup.
- `e2e/driver/dse.ts:228`: `modal()` returns `scopeOf(..., true)`.
- `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:299-321` `[STAM-Q13X]`: X, then the backdrop (clicked 5 px in from the left edge of the backdrop, at mid-height, which is outside the centred dialog). After each it checks that the dialog is gone, the stamina modal still exists, and Apply still reads "Lose 1 Stamina". It then asks again and Apply writes `current_stamina: 1` with no `recoveries`.
- `src/views/FreeHealConfirmModal.ts:30` (copy) and `test/dom/views/stamina-edit-modal.test.ts:1185` (`toContain('stopping at maximum Stamina')`).

## Mutations (`sc432-r2-rereview-mutations.log`; private scratch copy, deleted afterwards)
| Mutation | jest (321 targeted) | e2e subset (Q13, Q13C, Q13E, Q13X, Q13P, F07b, F07c, S07) |
|---|---|---|
| none | 321 pass | 8/8 ok |
| MX1: X/backdrop/Escape close BOTH modals | 1 red (Escape test) | Q13E, Q13X red |
| MX2: X/backdrop/Escape STAGE the heal | 1 red | Q13E, Q13X red ("Gain 9 Stamina") |
| MX3: backdrop-only closes both | n/a | **Q13X red only**, so the backdrop step is independently load-bearing |
| MD1: driver scoping reverted (page-wide) | n/a | Q13X red (click intercepted on the stamina modal's X); F07b/F07c still ok |
| MC1: copy reverted | 1 red | n/a |

## Findings
### INFO
1. **INFO-1:** `e2e/driver/dse.ts:81` `withinContainer` strips the `.modal-container ` prefix. That works, but it is not strictly needed: an element-scoped `$('.modal-container .x')` from inside the container already matches only that container's descendants. It is harmless, and future host selectors that lack the prefix still work. No action.
2. **INFO-2:** jsdom has no X/backdrop coverage for the confirmation (the Obsidian mock lacks that chrome). Real-Obsidian Q13X covers it, so no action.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r2-rereview-report.md`
- Logs: `.../sc432-r2-rereview-{tsc,lint,jest,e2e,freeze,mutations}.log`
- Scripts (private): `.../sc432-r2-rereview-scripts/{sc432-r2b-gate.sh,sc432-r2b-mjest.sh,sc432-r2b-me2e.sh,sc432-r2b-mutate.py}`
- Scratch copy `<scratchpad>/sc432-r2b-mut-7f3e` and its outputs: deleted.

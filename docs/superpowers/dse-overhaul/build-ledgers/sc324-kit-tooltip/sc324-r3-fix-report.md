# SC-324 round 3 — fix report

**Executive summary**
- Verdict: DONE. All FOLD items from D2/D3 implemented; DROP items untouched.
- DSE `sc324-kit-tooltip`: 2b7ad20 (code+tests), 7b8dacc (release audit + DSE CHANGELOG). Superproject worktree: 9058a6a (CHANGELOG). Not pushed, no tags.
- tsc/lint clean; jest 4738 passed / 1 skipped / 227 of 228 (no net new tests: assertions added/updated in existing tests).
- lifecycle 25/25; e2e 59/71 ok, 0 failed, 12 known-bug (no SC-428 marker flipped), 47/47; shots 572, 0 FAIL; freeze OK (276/276); parity 0/0/24.

## Findings
| Finding | Change | Where | Test |
|---|---|---|---|
| D2 StaminaEditModal direct tooltip() / M1 reason replaced the name | Label is `Spend Recovery: <reason>` via `setLabel` in both branches (helper `spendRecoveryReasonLabel`); `tooltip` import dropped; stale comments rewritten | src/views/StaminaEditModal.ts (~182-190, ~598-615) | stamina-edit-modal.test.ts lifecycle (:239-281) + I3 (:451); stamina-edit-modal-matrix REASON_MAX/REASON_NONE; e2e STAM-Q09/Q10 (stamina-recoveries.e2e.ts:151,161) now expect the prefixed label. SC-428 `test.failing` Q16 changed to `.not.toContain('Already at maximum Stamina')` -- still fails (red-as-expected) for the right reason; SC-428 not fixed. e2e SC-428 knownBugs (RECOV-R03/R08) assert disabled state, not aria-label: unchanged, still known-bug. |
| M2 read-only Catch Breath | `catchBreath.setLabel(`Catch Breath: ${readOnlyTooltip}`)` | src/framework/kit/RecoveriesStrip.ts:~276 | heroSheet.test.ts read-only test and staminaRecoveries.test.ts canPersist:false test assert `'Catch Breath: Read-only in this context'` |
| L1 lifecycle exact selector | G-S4 uses `.dse-init__round-advance` | visual-harness/obsidian-lifecycle.mjs:881 | lifecycle 25/25 |
| L2 stale on-screen tooltip | kit `setLabel` -> `tooltip(buttonEl, label)` (setTooltip); mount keeps bare attribute write | src/framework/kit/iconButton.ts (setLabel, +import) | iconButton.test.ts: setLabel test now asserts setTooltip called once with (buttonEl, label, undefined) AND rendered aria-label; mount test still asserts no setTooltip |
| L3 grammar only | "Requires a Power Roll tier to be selected." | src/drawSteelAdmonition/negotiation/ArgumentView.ts:~400 | negotiation.test.ts substring updated |
| I4 / D2 release audit | marks SC-324 "fixed in dse 2b7ad20" | draw-steel-elements/docs/superpowers/dse-7.0.0-release-audit.md:439 (the file lives in the DSE repo, not the superproject) | n/a |
| CHANGELOGs | bullets name Spend Recovery / Catch Breath | draw-steel-elements/CHANGELOG.md; worktree CHANGELOG.md | n/a |
DROPPED, untouched: MinionStaminaPoolModal separator (I2), sc379/mock.js labels, other Complete Argument rewording.

## Gates (logs: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip/sc324-r3-<gate>-1792416790.log)
- tsc rc0; lint rc0
- jest: `Tests: 1 skipped, 4738 passed, 4739 total; Test Suites: 1 skipped, 227 passed, 227 of 228 total`
- lifecycle (port 9291): `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`
- e2e: `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`
- shots: 572 PNGs, rc0, no FAIL; text scale OK (1146), text scale once OK (102969/199 loads), portrait mark parity OK (6), turn mark parity OK (20)
- freeze: `freeze OK (276/276 …)`
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc0

Drive-by fixes: none (the stale StaminaEditModal comments were rewritten as part of the M1 change).
Follow-ups: none new.

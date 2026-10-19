# SC-324 round 1 — implementer report

**Executive summary**
- Verdict: DONE. Option (b) implemented: `IconButtonOptions.tooltip` removed; `label` is the one aria-label/hover string.
- DSE branch `sc324-kit-tooltip` (base origin/develop 0d69ec9, no rebase needed): 6f45472 (fix), 0afcb2f (DSE CHANGELOG). Superproject worktree: cfb7c00 (CHANGELOG + D2 spec). Not pushed, no tags.
- tsc (incl. e2e) clean; lint clean; jest 4738 passed / 1 skipped / 227 of 228 suites (baseline 4732, +6 new tests).
- lifecycle 25/25 ok; e2e 59/71 ok, 0 failed, 12 known-bug, coverage 47/47; shots 572, 0 FAIL, all in-run OK lines; freeze OK (276/276); parity 0 gaps / 0 undeclared / 24 declared.
- One judgment call to review: conditions "Roll save" was MERGED (not kept) -- see table.

## tooltip() call: removed
Evidence (shipped Obsidian 1.14.4 app.js, ~/.config/obsidian/obsidian-1.14.4.asar): `function oS(e,t,n){e.setAttribute("aria-label",t),rS(e,n),WM===e&&ZM(e,t,n)}` (setTooltip). `rS` only sets data-tooltip-position/classes/delay/gap when options are passed (kit passes none). `WM===e&&ZM` refreshes a tooltip already showing. The hover is a delegated handler: `t.on("pointerover","[aria-label]"...` reading `getAttribute("aria-label")`. So a bare aria-label produces the identical hover; no setTooltip call kept. Doc/comment blocks in iconButton.ts rewritten (label contract; "Known gap" and stale FOLLOWUPS #27 comment removed).

## Per-call-site table
| file:line (old) | old label | old tooltip (lost) | new label | rule |
|---|---|---|---|---|
| hero/view.ts:204 Respite | Respite | writable: "Restore Stamina + Recoveries; clear Surges, temp Stamina, and end-of-encounter conditions"; readOnly: "Read-only in this context" | "Respite: Restore Stamina + Recoveries; clear Surges, temp Stamina, and end-of-encounter conditions" / readOnly "Respite: Read-only in this context" | merge `label: explanation` |
| negotiation/ArgumentView.ts:401 Complete Argument | Complete Argument | "Resolve the Argument using the current state of motivations, pitfalls, etc. \nRequires Power Roll tier to be selected." | "Complete Argument: Resolve the Argument using the current state of motivations, pitfalls, etc.\nRequires Power Roll tier to be selected." (newline kept) | merge |
| views/CompendiumMigrationModal.ts:173 Sync without moving | Sync without moving (links will break) | "Downloads the new compendium and leaves your old files where they are. Links to compendium notes will stop working, and the move can no longer be done." | "Sync without moving: Downloads the new compendium ... can no longer be done." | merge (tooltip covers "links will break") |
| elements/conditions/panel.ts:107 Roll save | Roll save vs {name} | "Roll save (6+ ends)" | "Roll save vs {name} (6+ ends)" | merge. NOTE: ledger lists conditions "remove/save" as keep-label, but the save tooltip carries info absent from the label ("6+ ends"), so I merged to avoid losing it. Trivially revertible to label-only. |
| elements/conditions/panel.ts:122 Remove | Remove condition: {name} | "Remove" | unchanged | keep label (fuller) |
| framework/kit/conditionIcons.ts:128 | Remove condition: {name} | "{name}" | unchanged | keep label (fuller) |
| initiative/view.ts:457 Advance round | Advance round | gain!=0: "Advance round (+N Malice)"; else same | gain!=0: "Advance round (+N Malice)"; else "Advance round" | tooltip fuller -> use it |
| initiative/view.ts:712 turn box | Toggle turn taken: {name} | "Toggle to mark turn taken" | unchanged | keep label (fuller) |
| initiative/view.ts:778 portrait toggle | Toggle turn taken: {name} | "Click the portrait to mark this turn taken" | unchanged | keep label (fuller; hint redundant while hovering the portrait) |
| initiative/view.ts:858, :933 action chips | Toggle {label} action: {name} | "Toggle {label} action" | unchanged | keep label (fuller) |
| initiative/view.ts:1296 captain | Relieve/Make ... captain ... | "Relieve as captain"/"Make captain" | unchanged | keep label (fuller) |
| initiative/view.ts:2055 Add Condition | Add Condition | same | unchanged | equal, field dropped |
| chrome/mountChrome.ts:199, :220, :232 | Collapse/Expand {name}; item.label | identical | unchanged | equal, field dropped |

setLabel follow-ups: hero/view.ts:653 and chrome toggle (Collapse/Expand) and initiative selected/unselected cells are tooltip-free or already one-string; CompendiumMigrationModal stop.setLabel('Stopping…') and MinionStaminaPoolModal.setLabel are on buttons that had no differing tooltip. No setLabel flips drop an explanation.

## Tests (+6 net; jest total 4739 vs 4733)
- iconButton.test.ts: discard-asserting test replaced by 2 (aria-label equals label verbatim; mount does not call setTooltip).
- +1 each: hero Respite aria-label (also read-only label asserted in existing read-only test), negotiation Complete Argument, CompendiumMigrationModal sync label, conditions save label, malicePanel Advance round gain/no-gain.
- Tests that asserted the lost tooltip via a setTooltip spy (conditionIcons.test, initiative.test x2) now assert end-state aria-label only. Exact-string selectors updated to prefix: heroSheet (Respite), turnEconomy/malicePanel (Advance round, gain fixture), compendium-migration-modal footerBtn const, visual-harness/docs-manifest.mjs ('Complete Argument' click). No data-dse-control selectors existed for these.
- e2e specs/manifest needed no change (e2e 59/71 identical).

## Docs
- docs/superpowers/dse-overhaul/D2-ui-ux-overhaul-spec.md (superproject, §2.1 API and §2.5): tooltip option removed, contract stated. No iconButton/tooltip guidance in draw-steel-elements AGENTS.md/docs.
- CHANGELOG bullets: workspace CHANGELOG.md (worktree) under Unreleased; draw-steel-elements/CHANGELOG.md too (SC-423/SC-372 precedent).

## Gates (logs in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc324-kit-tooltip, suffix -1792413711.log)
- tsc: rc 0 (sc324-r1-tscF) ; lint: rc 0 (sc324-r1-lintF)
- jest: `Tests: 1 skipped, 4738 passed, 4739 total; Test Suites: 1 skipped, 227 passed, 227 of 228` (sc324-r1-jestF, run after shots so host-css cache exists; the first run in the fresh worktree showed 2 skipped because printTwinDeltaAllowedSet.test.ts self-skips with no cached obsidian-app.css).
- lifecycle (DSE_LIFECYCLE_PORT=9291): `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`
- e2e: `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`, exit 0
- shots: 572 PNGs, rc 0, no FAIL; text scale OK (1146 comparisons), text scale once OK (102969 comparisons over 199 loads), portrait mark parity OK (6 comparisons), turn mark parity OK (20 comparisons), host-copy pin OK, button host-leak OK (112 kinds, 672 comparisons)
- freeze: `freeze OK (276/276 frozen print PNGs byte-identical ...)`
- parity: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0

Drive-by fixes: none.
Follow-ups:
- StaminaEditModal.ts (~608-616) still calls kit `tooltip()` directly on an iconButton's buttonEl to re-stamp aria-label (works; now a redundant indirection vs setLabel). Left alone.
- visual-harness/sc379/mock.js:283 mock button labels do not mirror production (Complete Argument label is bare). Not painted; left alone.
- dse-7.0.0-release-audit.md:439 still lists SC-324 as an open bug.

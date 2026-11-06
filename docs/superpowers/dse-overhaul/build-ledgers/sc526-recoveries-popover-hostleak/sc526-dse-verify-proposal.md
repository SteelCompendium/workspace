# SC-526 — dse-verify SKILL.md proposal (for the dispatcher at landing)

Target file: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Two edits. `<LANDED>` = the landed dse develop sha.

## Edit 1 — "Button host-leak sweep" bullet (~line 249)

REPLACE this exact sentence:

> **Open gaps, deliberately not mounted:** the Recoveries popover (`staminaRecoveryPopover`) — its plain buttons leak host CSS, mounting it turns the sweep red (164 problems on `hero|dse-stamina-rec__pop-btn` / `-cb`); it is mounted by **SC-526** together with its CSS fix, never exempted.

WITH:

> The Recoveries popover is mounted since **SC-526** (see below); it was the one click-revealed control SC-513 left out, because its plain buttons leaked host CSS.

and INSERT, right after the SC-530 paragraph's sentence ending "…no shot or frozen byte moves (592 PNGs identical)." (before "The sweeps pin dice after load"):

> **163 kinds / 978 comparisons, same 34-record boundary, as of SC-526 (`<LANDED>`)**: the button sweep's prefs add `staminaRecoveryPopover:true`, and `mountClickRevealedForSweep` (`{ recoveriesPopover: true }`, button sweep only — the popover has no inputs or checkboxes) ends with a real click on the gallery hero's `.dse-stamina-rec__pips`. It must be the LAST click: any later click outside the popover closes it (the state passes never click — hover is `mouse.move`, focus is Tab + `focus()`). Two new kinds, `hero|dse-stamina-rec__pop-btn` (− and +) and `hero|dse-stamina-rec__pop-cb` (Catch breath). It FAILs by name if no popover with three visible buttons opens (`clicking the hero Recoveries markers (staminaRecoveryPopover on) opened no popover holding its three visible buttons (SC-526)`), and `assertSc526Tagged` FAILs for either key not tagged. Before SC-526's CSS fix the mount measured `BUTTON HOST-LEAK VIOLATED`, 164 problems (height 18 → 30px, Obsidian's plate shadow, colour, font, `display:flex`); the fix re-grounds both classes in the SC-203 family at their own compact height (Scott, 2026-11-05: "A looks better than A30" — − and + ~18px, Catch breath ~26px, also on phones). The `ds-stamina-bar` popover is the same component and classes and is not mounted separately (measured green in SC-526 r1); StaminaEditModal has no Recoveries strip. No capture sends the pref, so no shot or frozen byte moves (592 PNGs identical).

## Edit 2 — new CURRENT block (~line 1282); demote the existing CURRENT to PREVIOUS

> **CURRENT — dse `develop` @ `<LANDED>` (2026-11-05; SC-526 landed — the Recoveries popover's −, + and Catch breath keep the plugin's own compact look in Obsidian instead of Obsidian's 30px button style (CSS only, SC-203 re-grounding family); the button host-leak sweep opens the popover by a real click on the hero's markers, last):**
> tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6492 passed / 1 skipped / 257 of 258 suites** (+9 over 69b5c0d4's 6483) · lifecycle **52/52** (five `--only` parts 21 + 16 + 9 + 4 + 2) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, `button host-leak OK (163 … 978 …)`, 34-record boundary unchanged; modal 228, input 15/176, checkbox 7/116, prose 106 [212] unchanged; `capture clip OK (147 …)`; 592 PNGs sha-identical to `69b5c0d4` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-526 ticket-owner (battery by the r4 implementer at `6270e84a` on `69b5c0d4`; r3 independent review at `d40197c4` LAND-READY; r5 scoped re-review of the rebase + wording fixes); the dispatcher relayed, not re-ran.

(Numbers final as of dse `6270e84a`; `<LANDED>` is the only placeholder.)

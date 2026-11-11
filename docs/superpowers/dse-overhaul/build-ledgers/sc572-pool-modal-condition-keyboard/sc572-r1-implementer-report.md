# SC-572 r1 implementer report

## Executive summary
- Verdict: DONE (one design deviation for the owner to confirm: bare native `<button>`, not the kit `iconButton`; see below).
- Branch `sc572-pool-modal-condition-keyboard`, head `1305e0b4` (fix `cf34f3bd` + changelog `1305e0b4`); base dse develop `97a9c93b` (origin/develop unchanged after fetch). Not pushed, no tag.
- tsc (incl. `tsc -p e2e`) rc 0; lint (incl. `e2e/`) rc 0.
- jest: 7050 passed / 1 skipped (1 load timeout in `twin-reuse` SC-547 in the full run; that suite alone 53/53). Full-run line: `Tests: 1 failed, 1 skipped, 7049 passed, 7051 total`.
- lifecycle 21/21 + 16/16 + 9/9 + 4/4 + 2/2 = 52/52, 0 failed.
- e2e `OBSIDIAN-E2E done: 251/261 ok, 0 failed, 10 known-bug, coverage: 163/163 pairs` (was 249/260, 11 known-bug, 161/161; +1 scenario POOL-C05, SC-572 marker gone).
- shots 592 ok, rc 0 (first run hit the montage-board wheel gate once, unrelated flake; second run green); `button host-leak OK (163 … 978 …)` and `capture clip OK (147 …)` unchanged; freeze `freeze OK (280/280 …)`; parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## The tracker's model (file:line)
- `src/framework/kit/conditionIcons.ts:119-136`: `iconButton(...)` (kit `.dse-btn`, real `<button type="button">`, `aria-label`) + `.dse-cond`; label is `Remove condition: <name>` (line 129). Tracker styling: `styles-source.css` `[data-dse-element="initiative"] .dse-init .dse-cond` compact override (~:633-650).
- `src/framework/kit/iconButton.ts:100-141`: `button.dse-btn`, `type=button`, `aria-label` doubles as Obsidian's hover tooltip, `registerDomEvent` click.
- Naming wording: tracker = "Remove condition: Bleeding"; Conditions modal (`src/views/ConditionsModal.ts:324`) = "Remove Bleeding". I chose the ticket's and the Conditions modal's "Remove <name>" (ticket text says "Remove Bleeding").

## What changed
- `src/views/MinionStaminaPoolModal.ts:~556-566`: `createDiv` -> `createEl('button', { cls: 'condition-icon' })`, `type=button`, `aria-label="Remove <displayName>"`, `title` removed (aria-label is the hover tooltip; keeping `title` would double the tooltip). `data-dse-control="pool.condition"` stamp and click handler unchanged.
- `styles-source.css` `.dse-sedit__minions .condition-icon` (~:1978): added the (0,2,0) reset (display flex, centred, content-box, padding/border/radius 0, transparent background, no box-shadow, `font: inherit`, `white-space: inherit`). (0,2,0) beats Obsidian's `button` rules ((0,0,1)/(0,1,1) incl. `:hover`, `:focus-visible`). `.condition-icon:focus-visible` joined the one shared kit focus-ring rule (~:15563) (precedent: `.dse-condal__input`, `.dse-optchip`).
- `CHANGELOG.md` 7.0.0 section: one [FIX] bullet.
- Tests: jest matrix `test/dom/views/minion-stamina-pool-modal-matrix.test.ts` (SC-572 `test.failing` replaced by a plain test: BUTTON, `type=button`, `aria-label` "Remove Grabbed"/"Remove Bleeding", no `title`, not disabled/tabindex -1; moved into the condition-icons describe; `i.title` reads in 4 existing tests switched to a `conditionName` helper reading the aria-label, including the SC-574(b) `test.failing` SETUP line only, its marker untouched). e2e `pool-conditions.e2e.ts`: POOL-C04 (Enter) plain test + new POOL-C05 (Space), each asserts tagName BUTTON, aria-label "Remove Grabbed", Tab reaches, press removes one condition with exactly one write; `e2e/driver/pool.ts` `conditionTitles` reads the aria-label; `e2e/manifest/minion-pool-modal.ts` `pool.condition` -> `['click','press:Enter','press:Space']`, `['C01','C04','C05']`.

## Deviations / judgement calls for the owner
1. Not the kit `iconButton`/`.dse-btn`. Reusing it in the modal drags in Steel sheen/bevel/metal border (the (0,8,0) control-sheen rule), 1.75em min-size, hover plate, font-size rules; neutralising needs ~(0,9,0) overrides. The tracker avoids that only because its `.dse-cond` compact override is scoped under `[data-dse-element="initiative"] .dse-init`. I kept the semantics of the model (native button, `type=button`, aria-label name, shared kit focus ring, click wiring) and used a bare button like `.dse-optchip`/`.dse-swatch` do. If you want `iconButton` + `.dse-btn`, it is a CSS-heavy follow-up.
2. Hover tip changes from "Bleeding" to "Remove Bleeding" (the title was removed). The tracker's tooltip is its aria-label too.
3. jsdom cannot assert Enter/Space activation: jsdom does not turn keydown into a click on a native button, so a keydown test would be vacuous. jsdom asserts the native-button facts; real Enter and Space removal is proved in e2e POOL-C04 / POOL-C05 in real Chromium (both pass).

## Host-leak delta
None: `button host-leak OK (163 button kinds × 3 states … = 978 comparisons …)` before and after. `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … 228 comparisons)`. The pool modal's shot fixture (`initiativeFight` Goblin Squad) has NO conditions on its minions, so the modal shot and the host-leak sweep never mount a `.condition-icon`; the new button is not covered by that sweep, and freeze cannot move. To cover the gap I measured it by hand (below).

## Resting-look measurement (scratch, not committed)
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r1-impl-a917bb127a70492b5/probe-look.cjs` (Chromium, harness.css, real pinned `obsidian-app.css`, dark/light x with/without host x rest/hover): old `div.condition-icon` vs new `button.condition-icon`, 24 computed props + box/svg rects: identical in every case except `text-align` (start vs center; no text inside, no visual effect). Focus (Tab, host sheet on): `outline: solid 2px rgb(77,184,199)`, offset 2px, `box-shadow: none`.

## Freeze
`freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`. No rebaseline, no crops.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r1-impl-a917bb127a70492b5/`)
`tsc.log`, `lint.log`, `jest.log` (first full, pre-fix of my own svg assertion), `jest-final.log`, `jest-twin.log`, `e2e.log`, `shots-run1.log` (montage wheel flake), `shots-run2.log`, `freeze.log`, `parity.log`, `lc1.log`..`lc5.log`, `probe-look.cjs`.

## Drive-by fixes
None.

## Follow-ups
- Workspace `dse-verify` SKILL.md "Current expected numbers" and the e2e row (249/260, 11 known bugs listing SC-572, 161/161) need updating at landing: now 251/261, 10 known-bug (SC-572 removed), 163/163. Not edited (workspace-level, outside this round).
- Shots montage-board wheel gate (`MONTAGE BOARD CLIPS INSTEAD OF SCROLLING … A MOUSE WHEEL OVER THE BOARD DID NOT SCROLL IT`) failed once at loadavg ~3-17 and passed on re-run, unrelated to this change: possible flake worth a ticket.
- Pool-modal shot fixture has no conditions, so the modal host-leak sweep never covers `.condition-icon`; a fixture with a condition on a minion would put the new button under the sweep.
- Same keyboard/name gap for custom conditions is SC-574(a) (out of scope, marker untouched).

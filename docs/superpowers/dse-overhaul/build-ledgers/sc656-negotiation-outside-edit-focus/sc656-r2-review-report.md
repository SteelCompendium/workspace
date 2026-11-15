# SC-656 r2 — independent review report (R1)

## Executive summary
- **Verdict: FIX.** Head reviewed: dse `79a6b241` (range `42c26272..79a6b241`). Counts: CRIT 0 · HIGH 1 · MED 2 · LOW 3 · INFO 6.
- **HIGH-1:** the focus memory outlives a card that leaves the page for any reason other than the redraw. In a long note (Reading view and Live Preview), when the focused card scrolls out of the page, focus goes to `<body>`. A later outside edit to that card then **pulls focus into a DIFFERENT negotiation card**: the one the user is looking at, which the user never focused (PRB-14-*-top). This breaks the "never pull focus in" rule. Fix validated in real Obsidian (candidate G2: 9/9 NEGO-O green, PRB-14 fixed, all other probes unchanged).
- **MED-1:** in Reading view, an outside edit 0.5, 1.5 or 2.9 s after the user's own action drops focus to `<body>` (the 3 s `persist()` timer). Live Preview is not affected. A timer-free test is prescribed: skip only when the SC-602 carry armed for this release. With no skip at all, 37/37 own-write e2e tests stayed green.
- **MED-2:** if the outside edit disables the focused control, focus falls to `<body>`, against ruling fallback (a). Example: focus is on "Argument has already been made" and Sync adds an appealed motivation (PRB-5-*-sameDisabled). `negotiation.mod.same` and `negotiation.mod.reuse` have no fallback chain.
- **LOW:** two guards are untested: the silent guard in `noticeForNewRoot` (mutant X6 shows a Notice and survives every committed test) and the sidebar `update()` fallbacks (X7: sidebar Complete goes to `<body>` and survives). The jsdom `redraw()` order also differs from Chromium (X1 survives jsdom; only e2e kills it).
- **Tier carry (Q12):** feasible and contained. The guard must compare the standing (interest and patience), `currentArgument` and the spent set, not `currentArgument` alone, or a Sync that completed an empty argument elsewhere lets the user complete it twice.
- **Gates at 79a6b241:** tsc/lint rc 0 · jest 13465 passed / 1 skipped (cache) · e2e `631/640 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` · lifecycle 63/64 (G-S61 also fails on clean base, SC-668). Vacuity: jest 12/17 and e2e 7/9 red on base.

## Findings

### HIGH-1 — a stale focus memory pulls focus into a different card after the focused card scrolled away (RV and LP)
- **Where:** `src/framework/chrome/windowHandoff.ts:244-262` (`rememberFocus`: the memory is cleared only when focus leaves a card that is still in the document; a card that left the document keeps it, for as long as the view lives). `src/elements/negotiation/view.ts:77-79` uses it at unload with no check that focus was inside at the moment of the change. The slot is the one taken at the last `focusin`, which can be minutes old.
- **Scenario:** a long note has two negotiations far apart (or one far down). With the keyboard, the user focuses a chip of the top card, then scrolls down with the wheel. Reading view and CodeMirror both drop the far section's DOM, so the top root leaves the document and focus goes to `<body>`. The view stays loaded (`topEntryLive: true`), and its memory survives because the root left the document. Later, a Sync or another plugin edits the top block, which is off-screen. Its view unloads and hands off with the old slot `{index 0, count 1}`. The only negotiation root now in the pane is the BOTTOM card, also at index 0, count 1, in the same note. The hand-off claims it and focuses its chip. The next Space or Enter (Space is the page-down key in Reading view) presses that chip and **writes the other negotiation**.
- **Measured** (`probe-head5.jsonl`; PRB-14, a 400-paragraph note created at runtime): `PRB-14-rv-top` before = the top card's `appeal.motivation#1`; after scrolling, `active BODY, topConnected false, topEntryLive true, roots ["Bottom Frodo"]`. After the outside edit to the top card, focus is on **`appeal.motivation#1` of "Bottom Frodo"**. `PRB-14-lp-top` gives the same result in Live Preview. Control: the `*-bottom` variants (the edit goes to the card on screen) keep focus on `<body>`.
- **Why the obvious timer fix fails (measured):** in Reading view, the gap between the old root leaving the document and the old view unloading was 10-23 ms at normal speed, but **708 ms** with a slow redraw: Reading view unloads the old section only after the new one is drawn (`probe-gap.jsonl`). A candidate that dropped a detached card's memory after one task (`dse-F`, `probe-fixF.jsonl`) broke every Reading view hand-off (NEGO-O01..O03 red). Do not use a timer.
- **Prescribed fix (validated, `candG2-view.diff`, `probe-candG2.jsonl`):** apply the ruling literally: "only when focus was inside that card at the moment of the outside change". This follows the SC-470 scroll pin, which hooks the same `vault.on('modify')` (`registerFrameworkElements.ts:65`).
  - In the view constructor, `registerEvent(app.vault.on('modify', f => f.path === host.sourcePath && (this.atChange = focusNow())))`. `focusNow()` returns `{captureControlFocus(root), slotOf(root,'negotiation')}` when the root is connected and focus is inside it, else null. This also refreshes the slot at the moment of the change.
  - At unload, when the root is still connected with focus inside (Live Preview unloads before the DOM update), use the live memory. Otherwise (Reading view), use only `atChange`. Clear `atChange` after use.
  - Measured with G2: NEGO-O01..O09 9/9 green; PRB-14 rv/lp top → `<body>` (nothing pulled). PRB-1 (process and disk, RV/LP), PRB-2 (other pane, other card, same note in two panes, popout both ways), PRB-3 own writes, PRB-4-both rv/lp, PRB-6, PRB-7 burst, PRB-12 embed/callout rv/lp, PRB-13 twins and PRB-S slow redraw (with the 700 ms delay) are all identical to head.
  - G2 kept `rememberFocus` for the Live Preview live path. A first variant that captured the slot live at unload (G) put PRB-4-lp-both on `<body>`: sibling views are already unloading at that moment, so the count is off. Keep the focusin-time slot for Live Preview, as G2 does.
- **Tests to add:** e2e PRB-14-style (top card focused, scroll to the end, outside edit to the top card → focus on `<body>`, not in the bottom card) in RV and LP. jsdom: the `redraw()` helper must fire the vault `modify` before the redraw (the mock App needs `vault.on`), plus a negative: a detached card plus a modify while detached gives no hand-off.

### MED-1 — Reading view: an outside edit within 3 s of the user's own action loses focus (the timer own-write test)
- **Where:** `src/elements/negotiation/view.ts:56,68,78,84` (`OWN_WRITE_WINDOW_MS = 3000`, `lastPersistAt` stamped by `persist()`).
- **Measured** (`probe-headall.jsonl`, PRB-11: chip pressed with Enter, then an outside rename): RV at 500 / 1500 / 2900 ms → **`<body>`**; RV at 3500 ms → same chip. LP at 500 / 1500 / 2900 / 3500 ms → same chip each time. In Live Preview every own write builds a NEW view whose `lastPersistAt` is `-Infinity`, so the timer never bites there. In Reading view the own write is adopted (same view, no unload), so the timer is not needed there either. Its only effect is to drop the next outside edit.
- **Realistic trigger:** any plugin that rewrites the note right after a save (front-matter "updated" stamps, lint-on-save), or a Sync arriving from another device. Focus is lost on every chip press in Reading view.
- **Is a skip needed at all?** Mutant X14 removes the skip entirely. Measured (`mut-e2e-X14.*`): 37/37 green (NEGO-F01..F08, NEGO-L01..L09, NEGO-O01..O09, PRB-3 own chip/Complete/Reset/Spent in RV/LP, PRB-11). Own writes show the same single focus landing as head (no double move). In Live Preview a holder is started and then finds focus taken by SC-602's claim, so it does nothing. Jest OE14 is the only red test (it pins the timer).
- **Prescribed fix (timer-free, sound):** skip only when the SC-602 carry armed for THIS release.
  - `ViewRegistry.release` runs `beforeRelease` (`carryOwnSaveFocus`) BEFORE `removeChild(view)` (`viewRegistry.ts:241-253`), so the answer is known when the view's unload callback runs.
  - Add, in `host/livePreviewFocusCarry.ts`, `const carried = new WeakSet<HTMLElement>()` and `carried.add(entry.root)` when `carryOwnSaveFocus` returns true. Export `ownSaveCarried(root)`.
  - In the view: `if (!memory || ownSaveCarried(this.rootEl)) return;`. Drop `lastPersistAt`, the `persist()` override and `OWN_WRITE_WINDOW_MS`.
  - Why not SC-650's content snapshot: at the Live Preview unload the old view's host still holds the old body (the release happens while CodeMirror computes the new state), so own-versus-outside cannot be read from content without the editor state. The SC-602 signal is exactly "someone else will hand focus on". Reading the registry tickets directly works too (same window), but the "armed" flag says why the skip happens.
  - SC-662 does not list `livePreviewFocusCarry.ts` among its hunks.
- **Tests:** rewrite OE14: an own write armed by SC-602 → no hand-off; an outside edit 500 ms after an adopted own write (no unload) → hand-off. Add e2e RV "chip press, outside edit 500 ms later → same chip" (PRB-11-rv-500 shape).

### MED-2 — the outside edit disables the focused control → focus to `<body>` (ruling fallback (a))
- **Where:** `src/elements/negotiation/focusRules.ts:27` (chains exist only for `negotiation.complete` and `negotiation.menu`). `src/framework/kit/controlFocus.ts:137`: a family with no chain returns `pool[nth]` even when it is disabled, so `focusControl` fails.
- **Measured** (PRB-5): focus on `negotiation.mod.same` ("Argument has already been made"). The outside edit adds `currentArgument.motivationsUsed: [Higher Authority]`, and the redrawn box is `disabled`. After: **`<body>`** in RV and LP. Same exposure for `negotiation.mod.reuse` (enabled only while a spent motivation is appealed to; an outside edit that un-spends it disables the box). Controls checked that do not have the problem: tier rows (gone when the negotiation ends → card root, `tabindex=-1`, ruling OK); chips, seals, Spent, tabs and menu (never disabled while `canPersist`); Complete (has a chain).
- **Fix:** add `'negotiation.mod.same': ['negotiation.mod.lie', 'negotiation.appeal.motivation']` and `'negotiation.mod.reuse': ['negotiation.mod.lie', 'negotiation.appeal.motivation']` to `NEGOTIATION_FOCUS_FALLBACKS`. The lie box is never disabled and sits between the two. Each family has a single box, so with a chain, `controlSuccessor` skips the disabled box and lands on the lie box. The other users of the map (`keepFocus` for Complete, Reset, `update()`) never start from these families, so their behaviour does not change. Tests: jsdom OE (focus same, EDITED adds a motivation → lie box) and e2e RV.

### LOW-1 — the silent guard in `noticeForNewRoot` is untested (mutant X6 survives)
- `windowHandoff.ts:197` (`|| o.silent`). Dropping it shows the window Notice "The note changed outside, so this window closed without saving" on a window-less redraw when a block above is deleted and this one is changed. Measured with X6: PRB-4-rv/lp-delAboveChange `notices=1`; head `notices=0` (`probe-head4.jsonl`, `mut-e2e-X6.*`). OE08 (count changed) does not assert the Notice. Fix: OE08 asserts `Notice.notices.length === 0`, plus one jsdom case "delete above + change this one → no Notice" (the `noticeForNewRoot` path).

### LOW-2 — the sidebar `update()` fallbacks are untested (mutant X7 survives)
- `view.ts:94`. With `restoreControlFocus(..., {})`, a pinned Complete Argument (tier chosen) refreshed by an outside edit goes to **`<body>`** (`mut-e2e-X7.jsonl`). Head lands on the first Motivation chip (`probe-headall.jsonl` PRB-8-sidebar-complete-process). OE17 and NEGO-O09 only use a chip. Fix: an OE17 sub-case with Complete focused and a tier chosen → first Motivation chip.

### LOW-3 — the jsdom `redraw()` order differs from Chromium's; the focusout microtask is pinned only by e2e
- `test/dom/elements/negotiation-outside-edit.test.ts` `redraw()` dispatches `focusout` AFTER `root.remove()`. In real Chromium the focusout of a removed focused node arrives while the root still reports `isConnected`, so the microtask deferral (`windowHandoff.ts:254`) is load-bearing. Mutant X1 (synchronous clear) passes all 586 focused jsdom tests but turns NEGO-O01..O03 red (and PRB-1-rv / PRB-7-rv / PRB-13-rv go to `<body>`). The e2e gate protects it, so the risk is low. Fix: dispatch the `focusout` before `remove()` (while connected) in `redraw()`, or note in its comment that only e2e pins the deferral. (Moot if HIGH-1's G2 shape lands, since the unload no longer depends on the focusout path for Reading view.)

### INFO
- **I-1, delete-above-and-change:** a Sync that deletes a negotiation above and changes this one → `<body>` (PRB-4-rv/lp-delAboveChange). This is ruling fallback (b) working as designed. Named here because the land-ready comment should list it as a fallback Scott may want to redirect.
- **I-2, popout:** the focused card in a popout keeps focus there (PRB-2-popout-inside). With focus moved to a popout editor, the main window's redrawn card receives `document.activeElement` (the main document had kept the old chip as active). The popout editor kept focus (`popEditorFocused: true`). No focus was taken from the popout in headless Xvfb (no window manager; both documents report `hasFocus() true`, so OS-level activation is not measurable here).
- **I-3, mutants equivalent in practice:** X12 (`unloading` flag not set) and X13 (root published at the start of `onMount`) survive both jsdom and e2e (15/15 each). `onMount` is synchronous and the hand-off acts one task later; in LP the dying root at the slot is replaced before `act`. X10 (`??=` → `=`: listeners re-installed on each rebuild) survives: only a listener build-up across Resets, bounded by the view's life.
- **I-4, X5** (the silent guard in `act`) survives jsdom (the harness's `lastKnownBody` is null, so content `'' === ''`) but is killed by e2e NEGO-O01/O05 (Notice 1). Fine as is.
- **I-5, cost:** `rememberFocus`'s focusin runs `slotOf` (a scope `querySelectorAll` plus `content()` per root) on every focus move inside the card, including arrow-key moves across seals and tabs. Negligible.
- **I-6, Reset and other own writes** stay on the SC-639/SC-642 targets with no extra hand-off, also with the redraw delayed by 700 ms (`handoffs=0` in `probe-slow.jsonl`, PRB-3 / PRB-S chip and Complete). Outside edits with the 700 ms delay land after about 800 ms. With the user moving focus out in the gap, nothing is pulled in (PRB-S-*-outsideMoveOut).

## Q12 — carrying the chosen tier across an outside redraw (feasibility and risk)
- **Where the state lives:** `ArgumentView.selectedId` (`src/drawSteelAdmonition/negotiation/ArgumentView.ts:55`), private, one per mount. The RV/LP redraw builds a NEW view (RV before the old one unloads, LP after); the sidebar refresh rebuilds the same view through `update()` → `onMount` → a new `ArgumentView`. `NegotiationView` does not keep a reference to its `ArgumentView` today (a local in `onMount`).
- **What "unchanged" must compare:** everything the roll and the completion read or write: the standing (`standingOf(current_interest)`, `standingOf(current_patience)`), `currentArgument` (`motivationsUsed`, `pitfallsUsed`, `lieUsed`, `sameArgumentUsed`, `reusedMotivation`), the spent flag per motivation name, and the motivation and pitfall names. Every tier changes interest or patience (`ArgumentPowerRolls.ts:34-76`). A completion that changes nothing can only happen at a clamp, which means the negotiation has ended and the tier is not selectable. So this fingerprint detects every completion made elsewhere.
- **What goes wrong without it:** a guard over `currentArgument` alone fails exactly in the Sync case. A Sync that completed an EMPTY argument elsewhere leaves `currentArgument` empty but Patience 1 lower. The tier is carried, the user presses Complete, and Patience is spent twice. Today's behaviour (the tier resets) is safe: PRB-5-*-completeCompletedOutside lands on the first chip, and Complete stays disabled.
- **Prescribed guard and mechanism (contained):**
  - Add `NegotiationData.argumentKey()`, a canonical JSON of the fields above.
  - `ArgumentView` gets `chosenTier()` and `chooseTier(t)`. `chooseTier` is a no-op unless selectable; it sets `selectedId`, then calls `markChosen` and `syncFooter`.
  - `NegotiationView` keeps `this.argument`.
  - RV/LP: the unload passes `{tier, key}`. Add one optional field to `windowHandoff.ts`'s `OutsideCloseHandoff` / `WindowRootRecord` (an additive `receive?(carry)` on the record, called in `act` on the claimed root BEFORE `focusSuccessor`; the claim keeps its count guard). The new view applies the tier only when `argumentKey()` matches.
  - Sidebar `update()`: capture `{tier, key}` before `super.update`, re-apply after on a match.
  - Then Complete is usable again and focus lands on it (OE05/NEGO-O03/O07 change expectation).
  - New negatives: an outside completion (standing changed) → tier dropped → first chip; an outside chip toggle (`currentArgument` changed) → dropped; count changed → no claim → no carry.
- **Risk:** low and confined (negotiation files plus one additive field in `windowHandoff.ts`; SC-662 also adds only to that file). The safety rests entirely on the fingerprint, so the fingerprint needs its own jsdom tests, including the "Sync completed an empty argument" case.

## Probe table (real Obsidian 1.14.4, e2e driver, scratch spec `r2probe.e2e.ts`; head = `dse-A` at 79a6b241 unchanged)
| Probe | Result at head |
|---|---|
| 1 RV/LP × vault.process/disk × Complete(tier) / chip#2 / Learn tab / lie box / seal#2 (20) | same control (chip#2, tab, lie, seal#2) on the redrawn card, ring kept, no Notice, note holds the edit. Complete → first Motivation chip (button disabled) |
| 2 focus on the other card (2 blocks, edit the first), RV/LP | stays; no move |
| 2 other pane (LP editor of another note) | stays in that editor |
| 2 same note RV + LP panes | RV pane chip restored; nothing in pane 2 |
| 2 popout inside / popout away | popout chip restored / popout editor keeps focus (I-2) |
| 3 own chip / Complete / Reset / Spent, RV/LP, normal and 700 ms slow | SC-642/639 targets; `handoffs=0`; no double move |
| 4 two blocks: delete above (card 2 not redrawn) / both changed / insert above / delete above + change | stays / card-2 chip / stays (LP: off-screen insert, stays) / `<body>` (ruling b) |
| 5 mod.same disabled by the edit, RV/LP | **`<body>` (MED-2)** |
| 5 tier row, negotiation ended by the edit | card root (`tabindex=-1`) |
| 5 chip, ended / Complete, argument completed outside | chip#2 / first chip (Complete disabled) |
| 6 focus moved inside the card in the gap / moved out | the newly focused control / not pulled |
| 7 burst 100 ms, RV/LP | chip#2 on the final card |
| 8 pinned sidebar: tab (disk), Complete (tier), chip | tab / first chip / chip#2 |
| 9 plugin disabled with a hand-off pending (normal and 700 ms) | no throw, no console.error; the holder is gone |
| 10 30 redraws, 250 ms apart, RV/LP | focus never lost; plugin children back to base; live body observers 30 → 0; net document focusin listeners 0 (RV) / -1 (LP, a pre-existing listener removed) |
| 11 outside edit 0.5 / 1.5 / 2.9 / 3.5 s after own chip | **RV `<body>` ×3 (MED-1)**, chip at 3.5 s; LP chip ×4 |
| 12 embed / callout, RV/LP | chip#2 restored |
| 13 identical twins, change first / change second, RV/LP | twin-2 chip (the right card) |
| 14 long note, top card focused, scroll to end, edit bottom / top | `<body>` / **focus pulled into the BOTTOM card (HIGH-1)** |

## Vacuity and mutants
- Base `42c26272` with the new tests copied in: jest `12 failed, 5 passed` (OE01-07, 10, 13, 14, 16, 17 red; the negatives OE08/09/11/12/15 pass; `vac-jest-base.log`). e2e `2/9 ok, 7 failed` (O04/O08 negatives pass; `probe-vac-e2e.log`). Matches the implementer.
- My mutants (dse-M; jest = 7 focused files, 586 tests; e2e = NEGO-O plus selected probes):

| Mutant | jest | e2e |
|---|---|---|
| X1 focusout clears synchronously | survives | **killed** (O01-O03) |
| X2 focusout clears even when detached | killed (10) | killed (O01-O03) |
| X5 silent guard in `act` dropped | survives (equivalent in jsdom) | **killed** (O01, O05: Notice 1) |
| X6 silent guard in `noticeForNewRoot` dropped | survives | **survives** (probe only: Notice 1) → LOW-1 |
| X7 sidebar `update()` without fallbacks | survives | **survives** (probe only: sidebar Complete → `<body>`) → LOW-2 |
| X10 `??=` → `=` | survives | not run (leak only) |
| X11 own-write window 1000 ms | killed (OE14) | n/a |
| X12 `unloading` never set | survives | survives (15/15; equivalent in practice) |
| X13 root published before the card is built | survives | survives (15/15; equivalent in practice) |
| X14 own-write skip removed | killed (OE14 only) | 37/37 green (MED-1 evidence) |

## Battery at 79a6b241 (the implementer's worktree, as found)
- tsc rc 0 (empty output) · lint rc 0 · jest `Tests: 1 skipped, 13465 passed, 13466 total` (shots cache present) rc 0.
- e2e `OBSIDIAN-E2E done: 631/640 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` rc 0 (INIT-W 13/13, MONT-OW 9/9, NEGO-O 9/9 inside it).
- lifecycle (SEVEN parts, `--only=`, each log checked to print only its own ids): part 1 21/21 · part 2 16/16 · part 3 9/9 · part 4 3/4 · part 5 7/7 (G-S91 ok) · part 6 4/4 · part 7 3/3 (G-S115 ok). **Union 63/64.** G-S61 failed on head twice and also failed alone on clean base `42c26272` (`lc-s61-base.log`), each time with the same sub-case "(a) LP callouts, upper then middle: the recorder's disk read was torn in 8-12 frames in a row". So it is base-red on this host (SC-668), not a regression.
- shots / freeze / parity: not re-run. No CSS changed and no static DOM output changed (`publishWindowRoot` is a WeakMap; `tabindex=-1` is set only at hand-off time). The implementer's 592/163/978/40/240/147 · 280/280 · 0/0/24 stand.
- Working tree check: `git status --porcelain` of the implementer's dse worktree was empty before and after.

## Out of scope
- **OOS-1:** a pending (debounced, 400 ms) own write flushed at the unload of an outside redraw can write the old model over the outside edit (the base flush runs after the SC-656 callback). This is pre-existing and SC-662's territory; not probed in detail.
- **OOS-2 (relevant to SC-670):** HIGH-1's mechanism (a memory that outlives a card that left the document) would carry over to every element SC-670 generalises the helper to. Fix it in the shared helper (or in its use) before SC-670 copies it.

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r2-R1/)
- Probe spec `r2probe.e2e.ts`; summariser `summ.py`; per-run logs and JSONL: `probe-smoke.*`, `probe-headall.*`, `probe-head2.*`, `probe-head3.*`, `probe-head4.*`, `probe-head5.*` (head), `probe-slow.*` (700 ms delay), `probe-gap.*` (detach-to-unload gap), `probe-fixF.*` (rejected timer candidate), `probe-candG.*` / `probe-candG2.*` (validated HIGH-1 fix), `probe-vac-e2e.*` (base).
- Diffs: `candG2-view.diff` (HIGH-1 candidate), `gap-instrumentation.diff`, `slow-redraw-instrumentation.diff`.
- Mutants: `mutants.py`, `mut-jest.sh`, `mut-jest.out`, `mut-jest-*.log`, `mut-e2e.sh`, `mut-e2e-all.sh`, `mut-e2e-X*.{log,jsonl,rc}`.
- Vacuity: `vac-jest-base.log`, `probe-vac-e2e.log`.
- Gates: `g-tsc.log`, `g-lint.log`, `g-jest.log`, `g-static.rc`, `g-e2e-full.log`, `g-e2e.rc`, `lc-part1..7.log` / `.rc`.
- Scratch worktrees (detached, registered in the SC-656 dse git dir; `git worktree prune` once the scratchpad goes): `dse-A` (head + probe spec), `dse-B` (+ delay/counter instrumentation), `dse-M` (mutants, restored), `dse-base` (42c26272 + new tests), `dse-F` (timer candidate + gap logging), `dse-G` (G2 candidate).

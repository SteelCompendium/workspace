# SC-526 decisions ledger

Ticket: SC-526 — Recoveries popover buttons (−, +, Catch breath) take Obsidian's button styling.
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak (branch sc526-recoveries-popover-hostleak in every submodule).
dse base at worktree creation: develop 08c086c (2026-10-24).

## Task (ticket description, verbatim)
"Found by SC-513's survey. With the `staminaRecoveryPopover` setting on, clicking the hero's Recoveries pips opens a small popover with plain −, +, and Catch breath buttons (`RecoveriesStrip.ts:194-235`). Inside Obsidian these buttons pick up Obsidian's own button look: height 18px → 30px, Obsidian's plate shadow, its text colour and font, and `display: flex`.

Cause: `.dse-stamina-rec__pop-btn` and `.dse-stamina-rec__pop-cb` (`styles-source.css` ~1778, ~12807, ~12820) are plain `<button>`s outside the SC-203 re-grounding family (~17105ff). Without host CSS they also fall back to the browser's default font (Arial 13.33px).

**Task:** re-ground the two popover buttons (or move them into the kit button family), then turn on the sweep mount SC-513 left out: add `staminaRecoveryPopover:true` to the button sweep's prefs and real-click the gallery hero's `.dse-stamina-rec__pips` LAST, after every other mount (any later click outside closes the popover). The SC-513 survey measured this mount red with 164 problems, all on `hero|dse-stamina-rec__pop-btn` / `-cb`; it should go green. Also check the same popover inside StaminaEditModal's RecoveriesStrip (the modal pass, not measured). Needs before/after screenshots for Scott: the popover's look changes."

## Dispatcher instructions (2026-10-24, verbatim excerpt)
"read docs/superpowers/dse-overhaul/build-ledgers/sc356-hostleak-modal-buttons* and sc361-swatch-focus* first — host re-grounding blocks in styles-source.css, labelled "E."/"F."; current baselines in .claude/skills/dse-verify/SKILL.md CURRENT block). This is a visible change: if the fix changes how those buttons look, post before/after screenshots with an ask for Scott (he is colorblind — describe colours in words, don't rely on hue) and park. SC-513 (host-leak sweep for click-revealed buttons, harness) is in flight — coordinate if your fix needs a sweep change. If you add a lifecycle scenario, use G-S48."

## Known facts
- CURRENT (08c086c): jest 6099 / 1 skipped / 246 of 247; lifecycle 38/38; e2e 123/123, 0 failed, 0 known-bug, 87/87; shots 592, 0 FAIL, button host-leak 114/684 (12-record boundary); modal 228 (6-record boundary); input 164; checkbox 60; freeze 280/280; parity 0/0/24.
- SC-513 state (its ledger, 2026-10-24): r2 implementer committed bbed8f0 on its branch (A–C mounts, NOT D). Its r1 prototype 1fce912 (patch: .superpowers/sdd/sc513-hostleak-click-revealed/sc513-r1-proto-1fce912.patch) includes the D mount (prefs `staminaRecoveryPopover:true`, pips click last); measured VIOLATED, 164 problems, all hero|dse-stamina-rec__pop-btn/-cb. SC-513 ruled D out of scope pending this ticket; its dse-verify text names SC-526 as the open gap.
- Precedent SC-356: chips leaking Obsidian's look → Scott chose "A30" (plugin look at Obsidian's control height, `var(--input-height, 30px)`; phone 44px) from real-Obsidian camera shots of TODAY / A / A30.

## Owner rulings (2026-10-24)
- Fix = CSS only, in the SC-203 host re-grounding family; no markup change in RecoveriesStrip.ts unless the worker finds re-grounding impossible (then NEEDS_CONTEXT). Buttons take the card's font (`font: inherit` or the kit token), never the UA Arial default.
- The look is Scott's call: r1 builds option A (the popover's own authored look at its natural compact height, ~18-20px) and option A30 (same look, height = Obsidian's control height via `var(--input-height, 30px)`), and real-Obsidian camera shots of TODAY / A / A30, dark + light, desktop; phone height measured. Both the tracker hero's popover and StaminaEditModal's popover.
- Sweep coordination with SC-513: the landing sweep change (prefs + pips click last + modal-pass popover mount) is built ON TOP OF SC-513's landed mount helper. If SC-513 lands first, rebase and add D to its helper; r1 measures with the 1fce912 prototype mount on a local measurement branch that never lands. If SC-513 stalls past Scott's look ruling, owner re-decides.
- No exemption/allowlist for the popover buttons (SC-205 "never widen silently").
- CHANGELOG bullet required at implementation (user-visible look change).

## Rounds
- r1 (implementer, evidence): options A + A30 CSS, sweep measurement with the D mount, camera shots. Brief sc526-r1-brief.md, report sc526-r1-report.md.
- r1 dispatched 2026-10-24 (implementer identity aab0eb27…; it must NOT review its own work). Ticket flipped Backlog -> Awaiting.

## 2026-10-24 (dispatcher): SC-502 landed — dse develop 08c086c -> c558759
"dse develop has moved 08c086c → c558759 (SC-502 landed: a shared styles-source.css rule for the Live Preview chrome clip, plus lifecycle G-S44 and e2e CHR-L01; it touches the same stylesheet, so expect a rebase touch-point). New baselines: jest 6105 / 1 skipped / 247 of 248, lifecycle 39/39, e2e 124/124 with 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on c558759 (or newer), with the superproject rebased onto origin/main."
- ~~CURRENT (08c086c): jest 6099 / 1 skipped / 246 of 247; lifecycle 38/38; e2e 123/123~~ superseded: landing gates against c558759 numbers above (+ this ticket's own tests).
- Owner ruling: do NOT rebase under the running r1 evidence round (its option CSS is popover-only; SC-502's Live Preview chrome clip rule does not touch the popover, so the screenshots stay valid). The implementation round after Scott's look ruling rebases onto c558759 (or newer), resolves the styles-source.css touch-point, and runs the full battery against the c558759 baselines; superproject rebased onto origin/main before land-ready.

## r1 result (2026-10-24) — implementer aab0eb27…, report sc526-r1-report.md, evidence evidence-r1/
- Option A = 8266ea0 (local branch sc526-option-a); option A30 = 1f409bc on top (branch head). Measurement branches sc526-measure / -A / -A30 (never land). Base 08c086c.
- CSS only: new block G in the SC-203 family; both classes in section-B box-shadow list; both join the shared kit focus ring. 5 new jest tests in test/dom/theme/hostRegrounding.test.ts. jest 6104/1/246 of 247 on 1f409bc.
- Sweep with D mount: base VIOLATED 164 (hero) and 164 (stamina-bar); A and A30 both rc 0, hero 116 kinds/696, boundary 12 unchanged, modal 228, 592 PNGs identical, freeze 280/280.
- StaminaEditModal has NO RecoveriesStrip/popover (probe: 0 strips). The second popover site is the ds-stamina-bar element (same component, same classes).
- Real Obsidian: TODAY 30px; A −/+ 18.3px, Catch breath 25.8px; A30 30px desktop / 44px phone. A30 looks nearly identical to TODAY (owner eyeballed both montages). Keyboard focus ring changes to the kit's teal-cyan 2px outline (both options).

## Owner rulings on r1 follow-ups (2026-10-24)
- StaminaEditModal check: DROP — the modal has no popover (measured); the ticket's modal clause is moot. Say so on the thread.
- ds-stamina-bar popover sweep mount: DROP — same RecoveriesStrip component and selectors as the hero, measured green under A and A30 in r1; the hero mount (the ticket's ask) covers the CSS.
- Dark-scheme −/+ glyph contrast (pre-existing, every option): FILED SC-528 (Backlog, related SC-526). OUT of scope.
- Phone Catch breath weight 500 (unpinned, like every kit button; host model desktop-only): DROP — consistent with the kit family.
- app.emulateMobile() breaks the camera's CDP session: DROP — camera tooling note only; r1's per-element is-phone method is recorded in the report.
- ASKED SCOTT 2026-10-24: popover button look — A (compact) / A30 (30px, phone 44px). Owner recommends A30.
- 2026-10-24 ~15:19Z: ask posted (montages dark + light), ticket In Progress + Needs Review (labels DSE Plugin, Needs Review). Parked on Scott. r2 brief drafted as sc526-r2-brief.md (fill the ruling in verbatim before dispatch).

## SCOTT RULING — 2026-11-05 00:21Z (comment fb6e8020), verbatim:
> A looks better than A30

Answering the owner's ask (A = compact: − and + 18px, Catch breath 26px, also on phone; A30 = 30px desktop / 44px phone).
~~ASKED SCOTT 2026-10-24: popover button look — A (compact) / A30~~ answered: A. Owner recommendation A30 is not taken.
- Consequence: drop the A30 commit (1f409bc); land option A (8266ea0) ported onto current develop.

## 2026-11-04 (dispatcher): develop moved to d689b719; full battery per CURRENT block
"Your r1 bundles (dse `8266ea0` for A, `1f409bc` for A30, on `08c086c`) are far behind: dse develop is now `d689b719`, so rebase the chosen one onto it (or `just wt-new <name>` from `d689b719` and port it). Re-run the full battery from the CURRENT block in .claude/skills/dse-verify/SKILL.md (lifecycle 51/51 in the FIVE `--only` parts of row 4, G-S56 last; e2e 128/128 89/89; shots 592 0 FAIL, button host-leak 161/966 (the Recoveries popover entry should come off the known-leak list); freeze 280/280 plus any sanctioned rebaseline; parity 0/0/24), get a re-review, and write the dse-verify proposal to a file in your ledger. Next free lifecycle ids are G-S65 and G-S66 if you need one. ... no private DSE_LIFECYCLE_PORT needed since SC-551; use a private DSE_CAMERA_TMP for shots"
- ~~c558759 baselines~~ superseded by the d689b719 CURRENT block.
- 2026-11-05 ~00:40Z: ticket Awaiting, labels [DSE Plugin] (Ready for Agent removed). r2 dispatched (implementer a71b0555…, fresh identity): port option A onto d689b719, drop A30, add popover mount at end of mountClickRevealedForSweep, CHANGELOG, full battery. Brief sc526-r2-brief.md.
- Planned r3: independent review by a fresh orchestration:reviewer (NOT aab0eb27 = option-A author, NOT a71b0555 = r2 implementer).

## 2026-11-05 (dispatcher): SC-490 landed — dse develop d689b719 -> 248e202b
"New baseline: SC-490 landed, so dse develop is now `248e202b` (it was `d689b719`). It is a montage-only change: a sticky hero column in styles-source.css, the `montage board scroll OK` gate in shoot.mjs extended to fine/coarse × dark/light, and G-S13 extended. jest is now 6470 / 1 / 256 of 257. shots 592 0 FAIL 161/966; freeze 280/280 with no rebaseline. Rebase onto `248e202b` before your final battery."
- ~~jest 6460 / 1 / 256 of 257 (d689b719)~~ superseded: jest 6470 / 1 / 256 of 257 at 248e202b. Other numbers unchanged. Sent to r2 implementer mid-round.

## r2 result (2026-11-05) — implementer a71b0555…, report sc526-r2-impl-report.md
- dse d40197c4 = 179389d5 (option A ported) + d40197c4 (sweep mount + tests) on origin/develop 248e202b. Superproject 643185bb (CHANGELOG) on origin/main 1ee7c9af.
- Battery: tsc/lint clean; jest 6479/1/256 of 257 (+9); lifecycle 51/51 (21+16+9+4+1); e2e 128/128, 89/89; shots 592 0 FAIL, button 163/978, boundary 34 unchanged, PNGs sha-identical to develop; freeze 280/280; parity 0/0/24.
- Anti-vacuity: CSS reverted -> VIOLATED 164; click removed -> named FAILs. Both reverted.
- Next: r3 independent review (fresh reviewer).

## 2026-11-05 (dispatcher): SC-520 landed — dse develop 248e202b -> 7bd8040b
"SC-520 has landed, so dse develop is now `7bd8040b` (it was `248e202b`). The change is CSS only: three callout-chrome rules in the "Element chrome" section of styles-source.css. It adds lifecycle G-S49, so lifecycle is now **52/52**. Part 5 is `G-S59 G-S49` (2), and G-S49 sits before G-S56 in SCENARIOS order. jest is 6474 / 1 / 256 of 257 (6473/2 fresh). shots 592 0 FAIL 161/966; freeze 280/280 with no rebaseline. Rebase onto `7bd8040b` before your final battery or before you report land-ready."
- ~~jest 6470 / lifecycle 51/51 (248e202b)~~ superseded: jest 6474 (+9 SC-526 = 6483 expected) / 1 / 256 of 257; lifecycle 52/52 (part 5 = G-S59 G-S49).
- Owner ruling: do NOT rebase under the running r3 reviewer (reviewing d40197c4 on 248e202b). After r3: the r2 implementer (a71b0555, resumed) does the fix round (if any) + rebase onto 7bd8040b (or newer) + full battery; then a scoped re-review of the fixes + rebase delta by a fresh identity (not a71b0555, not aab0eb27; r3 reviewer acceptable for the re-review of a delta it did not author).

## r3 review (2026-11-05) — reviewer a9604886…, report sc526-r3-review-report.md: LAND-READY at d40197c4, 0 B/H/M, 2 LOW, 5 INFO
Owner rulings:
- LOW-1 (styles-source.css:15596-15597 comment says "the Stamina modal's" popover; it's the ds-stamina-bar element's): FOLD.
- LOW-2 (CHANGELOG.md:14 "text colour and font" -> "text colour and font size"): FOLD.
- INFO-5 (styles-source.css:17558-17559 "the gallery sweep never mounted them" -> "until SC-526 the gallery sweep never mounted them"): FOLD.
- INFO-1 (rebase both bases): FOLD — dse onto 7bd8040b (or newer), superproject onto origin/main bc75ebdd (or newer), full battery.
- INFO-2 (disabled Catch breath not a standing sweep kind): DROP — reviewer's host probe measured 0 changed properties for the disabled popover button in rest/hover; no disabled-specific host rule reaches it beyond what the rest-state re-grounding covers; the strip's own disabled Catch Breath kind is already compared since SC-527.
- INFO-3 (legacy unscoped theme still takes host fill/border/radius): DROP — predates SC-526, Steel is the only shipped theme (SC-144).
- INFO-4 (phone cursor/weight from host): already ruled DROP on r1.
- r4 = r2 implementer a71b0555 resumed (fix + rebase + battery). r5 = scoped re-review of the r4 delta by reviewer a9604886 (did not author it).

## 2026-11-05 ~04:00Z: weekly-limit 429 killed owner + r4 implementer; resumed 2026-11-06
- State at resume: no r4 commits (dse d40197c4 on 248e202b, superproject 643185bb), no r4 scratch folder, no harness process. origin/develop = 7bd8040b confirmed. Implementer a71b0555 resumed via SendMessage (not re-spawned) with the r4 task restated.

## 2026-11-06 (dispatcher): SC-349 landed — dse develop 7bd8040b -> 69b5c0d4
"harness-only. `snap()` in shoot.mjs grows the viewport for captures taller than 1200 CSS px, and there is a new `capture clip OK` in-run gate. Plugin bytes are unchanged. 143 PNGs change bytes. Any frozen line or PNG hash you computed on an older base must be recomputed on top of `69b5c0d4`. Freeze: the baseline took a sanctioned 40-line rebaseline ... and still reads 280/280. Other numbers: jest 6483 / 1 / 257 of 258; lifecycle 52/52; shots 592 0 FAIL 161/966. Rebase onto `69b5c0d4` before your final battery."
- ~~rebase onto 7bd8040b; jest 6483 = 6474 + 9 / 256 of 257~~ superseded: rebase onto 69b5c0d4; expected jest 6492 / 1 / 257 of 258 (6483 + 9); PNG identity vs a fresh 69b5c0d4 run; freeze 280/280 against the rebaselined file. Sent to r4 implementer mid-round.

## r4 result (2026-11-06) — implementer a71b0555, report sc526-r4-impl-report.md
- dse 6270e84a = 190d1d49 (A CSS + 5 tests) + 1901b894 (mount + 4 tests) + 6270e84a (LOW-1, INFO-5) on origin/develop 69b5c0d4. Superproject f99741d0 = ef4e60c3 (CHANGELOG) + f99741d0 (LOW-2) on origin/main e642f51b.
- Battery on 6270e84a: tsc/lint clean; jest 6492/1/257 of 258; lifecycle 52/52 (21+16+9+4+2); e2e 128/128, 89/89; shots 592 0 FAIL, button 163/978, boundary 34, capture clip OK, PNGs sha-identical to 69b5c0d4; freeze 280/280; parity 0/0/24.
- Next: r5 scoped re-review by reviewer a9604886 (resumed; did not author r4).

## r5 re-review (2026-11-06) — reviewer a9604886: LAND-READY at dse 6270e84a / superproject f99741d0; 0 B/H/M/L, 1 INFO
- INFO-1 (CHANGELOG "in the card's font" is accurate): DROP — no action, accurate.
- LAND-READY reported to dispatcher. dse-verify proposal: sc526-dse-verify-proposal.md (placeholder <LANDED> only).

## DONE (2026-11-06)
- LANDED by dispatcher: dse develop 6270e84a; workspace main 3de70f67 (pointer bump 4a469bc1); dse-verify edits applied in workspace 7afc764d; ledger preserved at docs/superpowers/dse-overhaul/build-ledgers/sc526-recoveries-popover-hostleak*; worktree removed.
- SC-526 closed Done (not deployed — deploy is Scott's call). Follow-up still open: SC-528 (dark-mode −/+ glyph contrast, Backlog).

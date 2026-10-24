# SC-501 decisions ledger

Ticket: SC-501 — Button host-leak sweep now skips 20 gallery records instead of 10 — confirm each new skip is legitimate.
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions (branch sc501-hostleak-exemptions in every submodule).
dse base at worktree creation: develop c98bd82 (2026-10-23).

## Task (from the ticket description, verbatim)
"`dse-verify` says to treat a new unexplained exemption as a real red. Each skipped record is a button the sweep does not check. **Task:** find which landing added the 10 records, and decide for each one whether skipping it is correct (for example, a button that is genuinely zero-sized) or hides a button that should be swept. Then record the explained boundary in `dse-verify`."

## Dispatcher instructions (2026-10-23, verbatim excerpt)
"Harness-only: visual-harness/shoot.mjs. Expected outcome is either a documented explanation of each of the 10 new exempt records (and a dse-verify text update for the dispatcher), or a fix that removes illegitimate exemptions — never widen exemptions silently. SC-498 (stamina-bar keyboard focus) is landing soon and may change gallery focus states; rebase onto it when told. If you add a lifecycle scenario, use G-S38."

## Known facts
- Last 10-record measurement: SC-356 land, dse ea56712 (2026-10-22, on develop 54f8f88): gallery 112 kinds / 672 comparisons; boundary 8 focus-visible disabled + 2 hover no hit point.
- d152ea4 (and c98bd82 per CURRENT): 113 kinds / 678; boundary 10 focus-visible disabled, 6 hover zero-sized, 2 hover no hit point, 2 focus-visible no box. SC-497 A/B: same on d152ea4 with 1.14.4 asar, so not the pin bump.
- Suspect per ticket: SC-279 roll strip. Range to bisect: ea56712..d152ea4 on develop.
- Boundary is aggregated by reason only (btnExemptionBoundary, shoot.mjs ~2715); records likely count per scheme (dark+light).

## Rulings
(none from Scott yet)

## Rounds
- r1 (survey, orchestration:reviewer): identify each of the 20 records by kind/state/scheme, attribute the 10 new ones to a landing, judge each legitimate vs hiding a sweepable button. Report: sc501-r1-survey-report.md.

## r1 survey result (2026-10-23) — reviewer, report sc501-r1-survey-report.md
- All 10 new records: ds-roll gallery section, SC-279 (ae8719f, landed c0e761b). Modifiers disclosure collapsed by default (rollBar.ts:112 open:false) -> steppers + Reset are 0x0 / no rects.
- 8 HIDE A BUTTON (hover zero-sized x6, focus-visible no box x2); 2 LEGITIMATE (focus-visible disabled on Reset, disabled at authored defaults, rollBar.ts:263).
- Old 2 hover no-hit-point = same initiative|dse-btn.dse-init__stamina as SC-356. SC-498 (b624eef) changes nothing here.
- Prototype fix (open Modifiers by real click before tagButtons): 113 / 678 OK, boundary 12 = 10 focus-visible disabled + 2 hover no hit point.
- Adjacent: input + checkbox sweeps also tag roll|dse-stepper__input and roll checkbox with no box (input line 164 vs expected 168, inferred).

## Owner rulings on r1 (2026-10-23)
- FIX (not document): open the roll strip's Modifiers disclosure by a real click in assertBtnHostLeak before tagButtons, with a loud assertion that no roll panel stays [hidden] (fail, never skip). Within dispatcher's "fix that removes illegitimate exemptions".
- FOLD: same click into assertInputHostLeak and assertCheckboxHostLeak (same cause, same file); implementer measures and explains the new input/checkbox lines.
- FOLD: permanent per-record listing in btnExemptionBoundary (distinct kind keys under each reason) so the next drift names its kinds. Applies to the gallery and modal passes that share the helper.
- No CHANGELOG bullet (harness-only, not user-facing). dse-verify text: owner drafts for the dispatcher at land-ready.
- r2 author = implementer; independent review = a fresh reviewer (the r1 reviewer designed the fix, so it does not review it).

## 2026-10-23 (dispatcher): SC-498 landed — dse develop c98bd82 -> b624eef
"SC-498 has landed: dse develop c98bd82 → b624eef. It makes the stamina bar a focusable Tab stop with a 2px shared focus outline, which may change gallery focus-visible records in the button host-leak sweep. Survey on b624eef, or re-check your exemption attribution against it. New baselines: jest 5889 / 1 skipped / 241 of 242, lifecycle 35/35, e2e 114/114 with 79/79, shots 592, freeze 280/280, parity 0/0/24."
- Owner: attribution already re-checked — r1 measured b624eef: 113 / 678 / 20, identical kinds and records to c98bd82 (stamina bar is a div[tabindex][role=group], not tagged by the button sweep). No re-survey.
- r2 must rebase onto b624eef and gate against the new baselines. Land-ready must be on b624eef (or newer). ~~Expected baselines at c98bd82 (jest 5872, lifecycle 34/34)~~ superseded by the b624eef numbers above.

## 2026-10-23 (dispatcher): SC-487 landed — dse develop b624eef -> a993a60
"dse develop has moved b624eef → a993a60 (SC-487 landed: block-name reading follows Obsidian's Live Preview rule in src/framework/host/blockPrefix.ts and related files, plus lifecycle G-S33; no gallery change expected). New baselines: jest 5958 / 1 skipped, lifecycle 36/36, e2e 114/114 with 0 known-bug and 79/79, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on a993a60 (or newer), with the superproject rebased onto origin/main."
- ~~Land-ready on b624eef; baselines jest 5889 / lifecycle 35/35~~ superseded: rebase onto a993a60, baselines above. Superproject branch must also be rebased onto origin/main at land-ready.

## r2 result (2026-10-23) — implementer, report sc501-r2-impl-report.md
- dse 1918a29 on a993a60 (one commit, shoot.mjs only). Gallery 113 / 678 OK, boundary 12 (10 focus-visible disabled: montage, negotiation, party stepper, roll Reset, roll stepper disabled, x2 each; 2 hover no hit point: initiative stamina). Modal 10/9/38/228, 6-record. Input 164, checkbox 60 (unchanged counts; r1's inference refuted — those sweeps never exempt box-less records; roll stepper input now 61x24 instead of 0x0). Can-fail verified (BUTTON HOST-LEAK VIOLATED, rc 1).
- Battery: tsc/lint clean; jest 5958/1/241 of 242; lifecycle 36/36; e2e 114/114, 0 known-bug, 79/79; shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.

## Owner rulings on r2 follow-ups (2026-10-23)
- FU-1 (input + checkbox sweeps have no box-presence assertion; a hidden control compares 0x0 vacuously and prints OK): PENDING reviewer measurement of how many input/checkbox records lack a box on 1918a29. If 0, FOLD a box-presence assertion into the r3 fix round (same blind-spot class as this ticket). If >0, file a Backlog ticket.
- FU-2 (enabled roll Reset never mounted in the gallery): needs a gallery fixture (entry.ts), outside the shoot.mjs-only constraint -> FILED SC-512 (Backlog, related to SC-501). OUT of scope for SC-501.
- FU-3 (focusTagged checks disabled before client rects): DROP — the boundary now names the kind, and a disabled button cannot take focus either way, so the reason label alone loses nothing.
- Review: fresh orchestration:reviewer (not the r1 designer, not the r2 author).

## 2026-10-23 (dispatcher): SC-493 landed — dse develop a993a60 -> efc17de
"dse develop has moved a993a60 → efc17de (SC-493 landed: the FormModal empty-box guard plus the new shared src/framework/blockBody.ts; no gallery or harness change). New baselines: jest 6003 / 1 skipped / 242 of 243, lifecycle 36/36, e2e 114/114 with 0 known-bug and 79/79, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on efc17de (or newer), with the superproject rebased onto origin/main."
- ~~Land-ready on a993a60; jest 5958 / 1 skipped~~ superseded by efc17de and the baselines above.
- Owner: do not rebase under the running r2 review (it reviews the 1918a29 delta; SC-493 touches no harness/gallery file). After review: the r3 round (fix round if findings, else a rebase-only round) rebases onto efc17de and re-runs the full battery; owner verifies the range-diff is patch-identical for the SC-501 commit(s).

## r2 review result (2026-10-23) — reviewer, report sc501-r2-review-report.md
APPROVE_WITH_NITS on 1918a29: 0 HIGH / 0 MEDIUM / 2 LOW / 4 INFO. Re-ran shots (592, 0 FAIL; PNGs byte-identical to a993a60) and freeze 280/280; can-fail probes all exit 1 named; click idempotent; assertion not vacuous; no exemption widened; no other collapsed disclosure hides a gallery control. FU-1 measurement: 0 box-less input / checkbox records, both schemes.

## Owner rulings on r2 review (2026-10-23)
- FU-1: measurement = 0 -> FOLD into r3: assert a box right after tagging in the input and checkbox sweeps (fail, named, never skip); turn the input focus-visible branch that silently skips a box-less input (shoot.mjs ~3321, ~3496-3511, per INFO-1) into a failure.
- LOW-1 (modal boundary kind key never names the modal, shoot.mjs:2703-2705, :3057): FOLD into r3 — include the scenario from the label sweepTaggedButtons already receives.
- LOW-2 (stale comment range c0e761b..c98bd82, shoot.mjs:2622): FOLD into r3 — say "until SC-501".
- INFO-1: covered by FU-1 fold.
- INFO-2 (controls that mount only on a click — ability roll bar in feature/statblock cards, rollController.ts:108-126; hero ability bodies, hero/view.ts:657-672 — are never swept): FILED SC-513 (Backlog, related to SC-501 + SC-512). OUT of scope for SC-501.
- INFO-3 (per-reason map redundant with per-kind map): DROP — harmless, and it still drives the per-reason header lines.
- INFO-4: no action.
- r3 = r2 implementer (fix + rebase onto efc17de + full battery). Scoped re-review = the r2 reviewer (did not author the fix).

## r3 result (2026-10-23) — implementer, report sc501-r3-impl-report.md
- dse head 054c9c5 on efc17de: af8caae (= 1918a29 rebased), 8925fac (FU-1 box assertion + input focus-visible no-box now fails; LOW-1 modal scenario in kind key), 054c9c5 (LOW-2 comment). Drive-by: hyphen -> em dash in the roll helper's problem strings.
- Host-leak counts unchanged (113/678/12; modal 10/9/38/228/6 now split x2 @MinionStaminaPoolModal, @MontageAddHeroModal, @StaminaEditModal; input 164; checkbox 60). Can-fail for input + checkbox exit 1 named.
- Battery: tsc/lint clean; jest 6003/1/242 of 243; lifecycle 36/36; e2e 114/114, 0 known-bug, 79/79; shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.
- Next: scoped re-review by the r2 reviewer (sc501-r3-rereview-brief.md), HEAD 054c9c5, rebased r2 commit af8caae.

## r3 scoped re-review (2026-10-23) — r2 reviewer, report sc501-r3-rereview-report.md
APPROVE, 0 HIGH / 0 MEDIUM / 0 LOW / 3 INFO. range-diff 1918a29 = af8caae. Re-ran shots 592 / 0 FAIL, freeze 280/280; host-leak lines match. Probes: hidden input, zero-width input, hidden checkbox, no inputs, no checkboxes -> each rc 1 named.
- INFO-1 (zero-width-with-rect reported as "no box at all", shoot.mjs:2675): DROP — wording nit, still fails.
- INFO-2 (input focus-visible still accepts disabled / visibility silently, shoot.mjs:3342-3344): DROP — outside the ruling; no gallery input is disabled or invisible today, and a box-less one is caught by the box check.
- INFO-3 (box check runs once, host-absent): DROP — not a regression; inputs still compare geometry with vs without host.

## LAND-READY (2026-10-23)
dse branch sc501-hostleak-exemptions @ 054c9c5 (af8caae, 8925fac, 054c9c5) on develop efc17de, ancestor verified. Superproject worktree at origin/main 7e45f8d, only dirt = dse pointer. No rebaseline, no CHANGELOG bullet (harness-only). dse-verify edits: sc501-dse-verify-proposal.md (LANDED_SHA = landed dse sha). Backlog filed: SC-512, SC-513.

# SC-527 decisions ledger

Ticket: SC-527 — Host-leak sweeps never check controls in states reached only by a click (pressed toggles, enabled Complete Argument, disabled after Respite).
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc527-hostleak-state-kinds (branch sc527-hostleak-state-kinds in every submodule).
dse base at worktree creation: develop ed368f6 (2026-10-24). Superproject worktree base: d8a109f.
Lifecycle id reserved if needed: G-S51.

## Task (from the ticket description, verbatim)
"Found by SC-513's survey. SC-513 makes the sweeps click to mount controls that are not in the gallery DOM at load. A related gap remains: some control kinds exist in the gallery but only reach a given state after a click, so the button sweep never compares that state (the same class as SC-512's enabled Reset).

Kinds seen only after a state change (sweep kind-key form):

* `initiative|…dse-init__turn|pressed|aria-pressed:true`, `…portrait-toggle|pressed|…`, `…action-toggle|pressed|…`, `…dse-init__cell|pressed|…`
* `negotiation|dse-nt__chip.dse-optchip|pressed|aria-pressed:true`, `…is-spent|aria-pressed:false`, `negotiation|dse-btn.dse-btn--accent` (Complete Argument enabled)
* `montage|dse-btn.dse-btn--accent|disabled`, `hero|dse-btn|disabled`, `hero|…stepper__btn|disabled` (after Respite, or with Surges at 0)

SC-450's pressed-parity gate covers part of the pressed family by other means. **Task:** decide per kind whether the sweep should reach the state by a real click in its own load (no capture change), and add it with a named failure if the state is not reached."

## Dispatcher instructions (2026-10-24, verbatim excerpt)
"Ledger: .superpowers/sdd/sc527-hostleak-state-kinds/ (decisions.md). Make your env with `just wt-new sc527-hostleak-state-kinds`; dse develop is ed368f6 (SC-513 just landed — its ledger is docs/superpowers/dse-overhaul/build-ledgers/sc513-hostleak-click-revealed/, read it first; CURRENT baselines in .claude/skills/dse-verify/SKILL.md). Overlap: SC-526 (parked on Scott) will later mount the Recoveries popover in the same sweep code — do not mount that popover; keep your changes easy to rebase under it. Lifecycle id G-S51 if you need one."

## Known facts (CURRENT, dse develop ed368f6)
- tsc/lint clean; jest 6112 passed / 1 skipped / 247 of 248 suites; lifecycle 39/39; e2e 124/124, 0 failed, 0 known-bug, coverage 87/87 pairs; shots 592, 0 FAIL; button host-leak OK 145 kinds / 870 comparisons, 28-record boundary (26 focus-visible disabled, 2 hover no-hit `initiative|dse-btn.dse-init__stamina`); modal 228; input 15 kinds / 176; checkbox 7 kinds / 116; prose 106 <p> [212] + 9 <img> [18] + 7 root props [476]; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED. Known flake: montage-board wheel (SC-521); lifecycle G-S14 flaked once in SC-513.
- SC-512/SC-513 mechanism (reuse it): sweep-only `galleryExtra` URL param appends extra gallery sections tagged `[data-dse-harness-extra=<id>]` (entry.ts); `probeSource(<el>,<probe-id>)` gives gate-only fixtures (not in FIXTURES, no shot); sweep-only prefs via `withSc513Mounts`; real Playwright clicks in the sweep's own dark/light loads before tagging; clicks ONLY in appended extra sections (clicking gallery sections moves existing kinds' first nodes); named FAIL per mount; dice pinned `Math.random = () => 0.5` in sweep load.
- SC-526 (Recoveries popover mount + its CSS fix) will edit the same sweep code later.

## Owner rulings (2026-10-24)
- Inherit SC-513's rules: reach states by REAL click (through the page, not internals) in the sweep's own load only; captures never perform these clicks, so zero shots / frozen bytes move. A photographed-state change would need a widening file and Scott's sanction (owner asks) — avoid.
- Every state change asserts it reached the expected state (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared; no existing kind's first node may move.
- Do NOT mount the Recoveries popover, do not add `staminaRecoveryPopover`, do not click the pips (SC-526). Keep SC-527's additions in their own helper/constants (e.g. `SC527_*`, one call site per sweep) so SC-526 rebases cleanly.
- No CHANGELOG bullet (harness-only). dse-verify text: owner drafts for the dispatcher at land-ready.
- A gate-only probe fixture with authored state (e.g. Surges 0) is acceptable where the ticket's kind is reachable that way, but a real click is preferred where the click is the user path; the survey says which per kind and why.

## Rounds
- r1 (survey + prototype, orchestration:reviewer): per-kind decision, recipe, measured lines. Brief sc527-r1-brief.md, report sc527-r1-survey-report.md.
- r1 dispatched 2026-10-24 (orchestration:reviewer, agent abb0c6465158755e8). Ticket flipped Backlog -> Awaiting.
- 2026-10-24: r1 reviewer killed by session-limit 429 mid can-fail probe ("Revert the break and verify."); dispatcher resumed it (same agent). Owner does not re-spawn.

## r1 result (2026-10-24) — reviewer abb0c6465158755e8, report sc527-r1-survey-report.md
- Gap confirmed at ed368f6: 9 of the ticket's 10 kinds absent; `hero|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` already compared since SC-513 (first node = probe hero ability-body "Decrease Edges"). No state-only input/checkbox kind exists.
- Discovery (204 depth-1 + 427 depth-2 clicks) found 3 beyond-ticket kinds: `negotiation|dse-nt__chip.dse-optchip.is-spent|pressed|aria-pressed:true`, `montage|dse-btn.dse-btn--danger` (Clear all), `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled` (montage complete after End round x2).
- SC-450/SC-423/SC-377 parity gates all run with the host sheet IN, so they prove repaint parity, not host invariance -> option (c) "covered by SC-450" not justified for any kind.
- Decision (a) real click for every kind, in 6 appended `galleryExtra` sections (`SC527_EXTRA = initiative,negotiation,negotiation,montage,montage,hero`), existing default fixtures, no entry.ts probe. Button sweep only. `reachStateKindsForSweep` runs BEFORE `mountClickRevealedForSweep` so SC-526's popover click can stay last.
- Prototype dse `sc527-r1-proto` @ b33616d (local, shoot.mjs +155/-2). Shots rc 0, 592 PNG sha256 identical, freeze 280/280; button 157 / 942, boundary 34 = 28 + 6 focus-visible disabled (`hero|dse-btn|disabled`, `montage|…accent|disabled`, `montage|…rowact|disabled`, x2); modal 228, input 15/176, checkbox 7/116, prose 106 [212]; first nodes 0 lost / 0 moved. Can-fail (wrong target) rc 1 named; host-only leak probe rc 1, 192 problems on exactly the 12 new kinds. No product leak.

## Owner rulings on r1 (2026-10-24)
- Beyond-ticket kinds (3): FOLD as prototyped. Same class, same ticket ("decide per kind"); they cost 2 sections and stay green. Expected: button 157 / 942, boundary 34.
- `hero|…stepper__btn|disabled`: ACCEPT "compared since SC-513 via another node" (one node per kind, as SC-513 INFO-1). No SC-527 assertion; a comment at the hero entry says so.
- `aria-checked` key gap (selected negotiation tier row shares the idle row's key): FILED SC-530 (Backlog, related SC-527). OUT of scope; the SC-527 comment block may cite SC-530.
- r2 = fresh orchestration:implementer productionizes from b33616d + r1 §4 "For r2" items: entry.ts galleryExtra comment names the SC-527 sections; jest seam test(s) like SC-513's (withSc527States appends last; reach-assertion selectors match the default fixtures); full battery. Independent review r3 = fresh orchestration:reviewer (the r1 reviewer authored the prototype, so it does not review).
- r2 dispatched 2026-10-24 (orchestration:implementer, agent a75f0bf6c8ff432a7). Brief sc527-r2-brief.md, report sc527-r2-impl-report.md.

## 2026-10-24 (dispatcher): SC-479 landed — dse develop ed368f6 -> 71437da
"FYI develop moved: SC-479 landed, dse develop is now 71437da (was ed368f6). It touches the Reading-view scroll pin (previewScrollPin.ts) and adds lifecycle G-S42; no shots-harness change. New baselines at 71437da: jest 6127 passed / 1 skipped / 247 of 248 · lifecycle 40/40 (full run ~14 min — run as two `--only` halves of 20 to fit a 600 s tool call) · e2e 124/124, 0 known-bug, 87/87 · shots 592, 0 FAIL, host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze 280/280 · parity 0/0/24. Rebase onto origin/develop before reporting land-ready. No reply needed."
- ~~Base ed368f6; jest 6112 / 1 / 247 of 248; lifecycle 39/39~~ superseded: r2 rebases onto 71437da; gates jest 6127 / 1 / 247 of 248 + new tests, lifecycle 40/40 (two --only halves of 20), e2e 124/124 0 known-bug 87/87. Host-leak SC-527 expectations unchanged (157/942, 34 boundary). PNG identity vs the ed368f6 list (SC-479 has no harness change); any differing PNG must be attributed by a clean 71437da base run.
- r2 told by SendMessage.

## 2026-10-24 — Paused by Scott (relayed by the dispatcher)
"PAUSE requested by Scott. ... Do not dispatch any new worker and post nothing to Linear."
Resume point:
- r2 implementer agent a75f0bf6c8ff432a7 (orchestration:implementer) told by the dispatcher to stop at a safe point and write a "PAUSED — partial" report (expected at sc527-r2-impl-report.md).
- dse branch sc527-hostleak-state-kinds @ 369b3a3 (r2 productionize + jest seam tests) on 044dd8e (r1 proto rebased) on origin/develop 71437da. Tree clean at pause snapshot. sc527-r1-proto @ b33616d untouched.
- Left: r2 full battery on the final head against 71437da baselines (jest 6127 + new tests, lifecycle 40/40 in two --only halves, e2e 124/124 87/87, shots 157/942 34 boundary, freeze 280/280, parity 0/0/24), jest break proofs, can-fail re-measure, report. Then r3 independent review (brief staged: sc527-r3-review-brief.md, fill <R2_HEAD>/<R2_BASE>), owner dse-verify proposal draft, land-ready report.
- On resume: SendMessage a75f0bf6c8ff432a7 to continue from its partial report (fresh implementer from the files if "No transcript found").
- Ticket SC-527 state: Awaiting (left as is; no Linear post during pause).

## 2026-10-24 — r2 PAUSED — partial (a75f0bf6c8ff432a7), report sc527-r2-impl-report.md
- dse sc527-hostleak-state-kinds @ 369b3a3 (044dd8e + 369b3a3) on origin/develop 71437da, clean, not pushed. Superproject worktree ff'd to origin/main 3eca7d31, only ` M draw-steel-elements`.
- Done on 369b3a3: tsc 0, lint 0, jest 6132/1/247 of 248 (+5), lifecycle 20/20 + 20/20 = 40/40, e2e 124/124 0 known-bug 87/87, shots rc 0 592 PNG sha256 = shots-base list, button 157/942 boundary 34, modal 228, input 15/176, checkbox 7/116, prose 106 [212]. Jest break proofs A/B/C each rc 1 (on ed368f6; tests unchanged by rebase).
- Left on resume (same worker via SendMessage): freeze (280/280), can-fail wrong-target re-probe on this head, list the 34 boundary records by name, parity LAST (0/0/24), superproject dirt check. Then r3 (fill <R2_HEAD>=369b3a3, <R2_BASE>=71437da), dse-verify proposal, land-ready.

## 2026-10-29 — Pause lifted by Scott (relayed by dispatcher)
"Pause lifted by Scott. The dispatcher has resumed your r2 implementer (a75f0bf6c8ff432a7) — do NOT resume or re-spawn it. dse develop is still 71437da. ... Linear writes are allowed again."
- r2 resumed by the dispatcher (same agent) for the remaining items. Owner waits for its report, then r3.

## r2 result (2026-10-29) — implementer a75f0bf6c8ff432a7, report sc527-r2-impl-report.md
- DONE: dse 369b3a3 (044dd8e + 369b3a3) on 71437da, clean, not pushed; superproject at origin/main 3eca7d31, only ` M draw-steel-elements`.
- tsc 0, lint 0, jest 6132/1/247 of 248 (+5), lifecycle 40/40 (20+20), e2e 124/124 0 known-bug 87/87, shots rc 0 592 identical, button 157/942 boundary 34, modal 228, input 15/176, checkbox 7/116, prose 106 [212], freeze 280/280, parity 0/0/24. Can-fail on final head rc 1 named. Jest breaks x3 rc 1.
- One e2e RECOV-R07 failure on the superseded ed368f6 head at load ~30 = known flake SC-517; not counted.
- r3 dispatched: fresh orchestration:reviewer (not the r1 prototype author, not r2). Brief sc527-r3-review-brief.md (R2_HEAD 369b3a3, R2_BASE 71437da).
- r3 reviewer agent a864fe80ab0735510 dispatched 2026-10-29.

## 2026-10-29 (dispatcher): SC-518 landed — dse develop 71437da -> 9be397e
"FYI develop moved: SC-518 landed, dse develop is now 9be397e (was 71437da). It touches block edit form focus (focusHandoff.ts, FormModal.ts, pipeline.ts) and adds lifecycle G-S50; no shots-harness change. New baselines at 9be397e: jest 6148 passed / 1 skipped / 248 of 249 · lifecycle 41/41 (halves 20 + 21) · e2e 124/124, 0 known-bug, 87/87 · shots 592, 0 FAIL, host-leak 145/870 · freeze 280/280 · parity 0/0/24. Rebase onto origin/develop before reporting land-ready (your jest will be 6148 + 5). No reply needed."
- ~~Base 71437da; jest 6132; lifecycle 40/40~~ superseded for land-ready: after r3, r4 rebase round (r2 implementer) onto 9be397e; gates on rebased head: tsc, lint, jest 6153 / 1 / 248 of 249, shots (157/942, 34 boundary, 592 identical), freeze 280/280, parity 0/0/24; lifecycle 41/41 + e2e 124/124 87/87 either re-run, or carried ONLY if built main.js + styles.css at the rebased head are byte-identical to a clean 9be397e build (SC-527 touches no src/). r3 continues reviewing 369b3a3 (its diff is unchanged by the rebase).

## r3 review result (2026-10-29) — reviewer a864fe80ab0735510, report sc527-r3-review-report.md
- LAND-READY on 369b3a3 (71437da): 0 HIGH / 0 MED / 2 LOW / 4 INFO. Shots 592 identical, freeze 280/280, button 157/942 boundary 34 (6 new legit). Leak probe head rc 1 on exactly the 12 SC527_EXPECT kinds; same on 71437da harness rc 0 (gap real). Not-reached probe rc 1, 6 named lines. Vacuity: none found. First nodes 0 lost / 0 moved. Jest 6/7 breaks caught (7th = runtime FAIL path, caught by browser probe). main.js/styles.css identical 71437da vs 369b3a3. SC-526 simulated: 0 merge conflicts, popover stays open after SC-527 clicks.

## Owner rulings on r3 (2026-10-29)
- LOW-1 (SC-527 hero section also matches SC-513's `[data-dse-harness-extra="hero"]`, shoot.mjs:2832/2857/2895/2904/2911): FOLD into r4, reviewer's fix: "one comment line at the SC-527 hero entry" (say the selector now matches two sections; SC-527's hero has no toggles/bodies/strips; future locators should address by `data-dse-harness-index` or the probe id).
- LOW-2 (shoot.mjs:2949 "(owner rules on them)"): FOLD, reviewer's fix verbatim: "(owner ruled: fold, SC-527 r1)".
- INFO-1 (reach check immediately after clicks, shoot.mjs:3069): FOLD — wrap the reach check in a bounded condition wait (`waitForFunction`, 5 s, as SC-513's sc513WaitFor), still a named FAIL on timeout. Removes a false-red flake path under load; cannot make it falsely green.
- INFO-2, INFO-3, INFO-4: no action (INFO-3 = owner's dse-verify draft, sc527-dse-verify-proposal.md).
- r4 = r2 implementer (author) fix round + rebase onto 9be397e. Scoped re-review = r3 reviewer (not the author).
- r4 dispatched 2026-10-29: SendMessage resume of r2 implementer a75f0bf6c8ff432a7 (fixes LOW-1, LOW-2, INFO-1 + rebase onto 9be397e). Scoped re-review planned: r3 reviewer a864fe80ab0735510.

## r4 result (2026-10-29) — r2 implementer, report sc527-r2-impl-report.md (r4 section)
- dse 4f73043 (c39e314 proto, 48f6671 r2, 4f73043 r4) on origin/develop 9be397e, clean, not pushed. Superproject at origin/main 90f93611, only ` M draw-steel-elements`.
- r4 commit shoot.mjs only: LOW-1 comment, LOW-2 wording, INFO-1 waitForFunction 5 s reach check.
- tsc 0, lint 0, jest 6153/1/248 of 249, shots rc 0 592 identical, button 157/942 boundary 34 (lines identical to r2), modal 228, input 15/176, checkbox 7/116, prose 106 [212], freeze 280/280, parity 0/0/24. Can-fail click rc 1 named; can-fail reach (never-matching selector) rc 1 named via the new wait path.
- main.js 9c3f3fcc… / styles.css ae45354b… byte-identical at 4f73043 and clean 9be397e -> develop's lifecycle 41/41 and e2e 124/124 87/87 carry.
- Scoped re-review -> r3 reviewer a864fe80ab0735510 (not the author).

## r4 scoped re-review (2026-10-29) — r3 reviewer, report sc527-r3-review-report.md (r4 section)
- LAND-READY, 0 findings. range-diff: rebase changed nothing in the reviewed commits; 4f73043 = exactly LOW-1 + LOW-2 + INFO-1 (shoot.mjs +13/-5); INFO-1 wait cannot go falsely green; node --check/tsc/SC-527 jest pass; builds byte-identical to 9be397e.

## LAND-READY (2026-10-29)
- dse branch sc527-hostleak-state-kinds @ 4f73043 (c39e314, 48f6671, 4f73043) on develop 9be397e, ancestor verified, tree clean. Superproject worktree at origin/main 90f93611, only dirt ` M draw-steel-elements` (pointer bump at landing).
- No widening, no rebaseline, no CHANGELOG (harness-only). dse-verify edits: sc527-dse-verify-proposal.md. Backlog filed: SC-530 (aria-checked key gap). Local branch sc527-r1-proto (b33616d) is survey-only, must not land.

## DONE (2026-10-29)
- Landed by the dispatcher: dse develop ff to 4f73043; workspace main 1fab455f (pointer bump 78c696c0); docs 8386d41d applied sc527-dse-verify-proposal.md (host-leak bullet, SC-530 open key gap, CURRENT @ 4f73043) and preserved this ledger at docs/superpowers/dse-overhaul/build-ledgers/sc527-hostleak-state-kinds/. Worktree removed; sc527-r1-proto not pushed. Ticket -> Done with closing comment.

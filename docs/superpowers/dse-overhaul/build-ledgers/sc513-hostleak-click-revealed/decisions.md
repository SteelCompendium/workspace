# SC-513 decisions ledger

Ticket: SC-513 — Host-leak sweeps never check buttons that only appear after a click (ability roll bar, hero ability bodies).
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed (branch sc513-hostleak-click-revealed in every submodule).
dse base at worktree creation: develop f89f69f (2026-10-24). Superproject base: 27f4c8c.

## Task (from the ticket description, verbatim)
"Found during SC-501's review. The host-leak sweeps in `npm run shots` compare every gallery control with and without Obsidian's host CSS, but only controls that exist when the gallery loads. Some controls are only created when the user clicks something, so the sweeps never see them:

* the ability roll bar in feature and statblock cards (`src/.../feature/rollController.ts:108-126`)
* hero ability bodies (`src/.../hero/view.ts:657-672`)

Unlike SC-501's collapsed Modifiers section, these are not hidden. They are not in the DOM at all, so nothing in the sweep's skip list ever shows them.

**Task:** list the click-to-mount controls in the gallery, then make the sweeps mount each one by a real click before tagging (the SC-205 rule "mount the chrome, don't exempt it"), with a failure if a mount produces nothing. Related: SC-512 (enabled roll Reset never mounted)."

## Dispatcher instructions (2026-10-24, verbatim excerpt)
"dse develop is f89f69f; read docs/superpowers/dse-overhaul/build-ledgers/sc501-hostleak-exemptions* and sc512-roll-reset-hostleak* first — SC-512's sweep-only `galleryExtra` approach may be reusable; harness-only: visual-harness/shoot.mjs, entry.ts; no capture may move frozen bytes; current baselines in .claude/skills/dse-verify/SKILL.md CURRENT block and its "Button host-leak sweep" bullet). Never widen exemptions silently; provide a dse-verify text proposal for the dispatcher. If you add a lifecycle scenario, use G-S47."

## Known facts
- CURRENT (f89f69f): jest 6078 / 1 skipped / 245 of 246; lifecycle 38/38; e2e 123/123, 0 failed, 0 known-bug, 87/87; shots 592, 0 FAIL; gallery `button host-leak OK (114 … 684 …)`, 12-record boundary (10 focus-visible disabled: montage, negotiation, party stepper, roll stepper, roll Reset disabled ×2 schemes; 2 hover no hit point initiative stamina ×2); modal 228 (6-record boundary); input 164; checkbox 60; freeze 280/280; parity 0/0/24. Known flake: montage-board wheel (SC-521).
- SC-501: sweeps open the roll strip's Modifiers disclosure by real click every dark/light load (`openRollModifiersForSweep`), FAIL if a roll panel stays hidden; input/checkbox sweeps FAIL on box-less tagged nodes.
- SC-512: `galleryExtra=roll` URL param, sent ONLY by the button sweep's URL; `entry.ts` appends a second roll strip; sweep real-clicks it. No capture sends galleryExtra, so no frozen byte moves.
- SC-512 r2 LOW-2 (feature ability roll strip never swept, rollController.ts:110) was dropped there as covered by this ticket.

## Rulings
(none from Scott yet)

## Owner rulings (2026-10-24)
- Mount by REAL click (dispatch through the page, not by calling internals), in the sweep's own load only. Captures never perform these clicks, so zero shots/frozen bytes move. If a photographed-state change is unavoidable, it needs a widening file and Scott's sanction (owner asks).
- Every mount asserts it produced the expected controls (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared.
- No CHANGELOG bullet (harness-only). dse-verify text: owner drafts for the dispatcher at land-ready.

## Rounds
- r1 (survey, orchestration:reviewer): inventory click-to-mount controls in the gallery + mount recipe per control + whether input/checkbox/modal sweeps are affected. Report sc513-r1-survey-report.md.

## 2026-10-24 ~12:03Z: owner + r1 reviewer killed by session-limit 429
- Reviewer resumed via SendMessage (same agent) after reset. State at resume: dse on sc513-r1-proto with uncommitted shoot.mjs prototype; no live gate process; origin/develop still f89f69f. Told to take the base measurement on a clean f89f69f tree.

## r1 survey result (2026-10-24) — reviewer, report sc513-r1-survey-report.md
- 4 in-scope click-to-mount controls: (A) ds-roll result card Reroll/Clear; (B) ability roll strip + result card in feature/featureblock/statblock (needs `rollingEnabled`, default off); (C) hero ability bodies (gallery hero's SCC refs unresolved -> no toggle; needs a probe hero with inline abilities); (D) Recoveries popover (needs `staminaRecoveryPopover`).
- Proto `sc513-r1-proto` @ 1fce912 (mounts) + faee4f4 (survey-only SC513_POPOVER=0 switch, must not land). Patch of 1fce912 saved: sc513-r1-proto-1fce912.patch.
- Popover off: button 145/870, boundary 28 (16 new, all focus-visible disabled Reset/stepper, legitimate), modal 228, input 15/176, checkbox 7/116, rc 0, 592 PNGs byte-identical, freeze 280/280. Popover on: VIOLATED, 164 problems, all hero|dse-stamina-rec__pop-btn / -cb (product CSS bug).

## Owner rulings on r1 (2026-10-24)
- D (popover): option (b). Product CSS bug FILED SC-526 (Backlog, related SC-513/SC-205), which also turns on the D mount and `staminaRecoveryPopover` in the sweep. OUT of scope for SC-513: do not add `staminaRecoveryPopover` to the sweep prefs, do not click the pips. Not an exemption — the mount is simply not added here; the dse-verify text names SC-526 as the open gap.
- Pref route: ACCEPT `rollingEnabled:true` in the button, input and checkbox sweep URLs only (sweep-only; measured no kind lost / no first-node shift).
- Probe hero: ACCEPT gate-only `probeSource('hero','probe-inline-abilities')` (not in FIXTURES, no shot).
- Gallery-section clicks: B clicks ONLY the appended `[data-dse-harness-extra=…]` sections (gallery statblock click shifts statblock|dse-collapse__header first node). First-node assertion: DROP — the locator is scoped to the extra sections by construction.
- Prose sweep coverage of C's body (hero ability body prose): FOLD into r2 — same ticket ("make the sweeps mount each one"); measure and report the prose line; if it goes red, stop and return NEEDS_CONTEXT.
- Dice pinning: FOLD only if an existing sweep-only seam (e.g. `fixedDice`) pins these rolls with no capture change; otherwise leave unpinned and say so.
- State-only kinds (pressed initiative/negotiation toggles, enabled Complete Argument, disabled-after-Respite): FILED SC-527 (Backlog). OUT of scope.
- r2 = fresh implementer productionizes from 1fce912 minus D; independent review = fresh reviewer (the r1 reviewer authored the prototype, so it does not review).

## Rounds (cont.)
- r2 (implementer, fresh): productionize A–C from 1fce912, prose sweep fold, tests, full battery. Brief sc513-r2-brief.md, report sc513-r2-impl-report.md.
- r3 (planned): independent review by a fresh orchestration:reviewer (not the r1 reviewer = prototype author, not the r2 implementer). Brief sc513-r3-review-brief.md.

## 2026-10-24 (dispatcher): SC-510 landed — dse develop f89f69f -> 08c086c
"dse develop has moved f89f69f → 08c086c (SC-510 landed: FormModal preview fix, plus renderErrorCard moved unchanged from src/framework/pipeline.ts into the new src/framework/errorCard.ts, still re-exported; no harness change). New baselines: jest 6099 / 1 skipped / 246 of 247, lifecycle 38/38, e2e 123/123 with 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on 08c086c (or newer), with the superproject rebased onto origin/main."
- ~~Base f89f69f; jest 6078 / 1 / 245 of 246~~ superseded: r2 rebases onto 08c086c and gates against jest 6099 / 1 / 246 of 247 + its new tests. Host-leak expectations unchanged (SC-510 has no harness/gallery change). Superproject worktree branch ff/rebased onto origin/main before land-ready.

## 2026-10-24 (dispatcher): SC-502 landed — dse develop 08c086c -> c558759
"dse develop has moved 08c086c → c558759 (SC-502 landed: a shared styles-source.css rule for the Live Preview chrome clip, plus lifecycle G-S44 and e2e CHR-L01; shots and host-leak unchanged at 114/684). New baselines: jest 6105 / 1 skipped / 247 of 248, lifecycle 39/39, e2e 124/124 with 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on c558759 (or newer), with the superproject rebased onto origin/main."
- ~~Base 08c086c; jest 6099 / 246 of 247, lifecycle 38/38, e2e 123/123~~ superseded: r2 rebases onto c558759; gates jest 6105 / 1 / 247 of 248 + new tests, lifecycle 39/39, e2e 124/124 0 failed 0 known-bug 87/87. Host-leak expectations unchanged. PNG identity: compare to r1's f89f69f list; any differing PNG must be attributed by a clean c558759 base run (SC-502 touched styles-source.css).

## r2 result (2026-10-24) — implementer, report sc513-r2-impl-report.md
- dse 324a68d (one commit) on c558759; superproject worktree ff'd to origin/main 5902c18, only ` M draw-steel-elements`.
- tsc/lint clean; jest 6112/1/247 of 248 (+7); lifecycle 39/39 (one G-S14 flake on the interim 08c086c head, green on re-run); e2e 124/124 0 known-bug 87/87; shots 592 0 FAIL: button 145/870, 28-record boundary (26 focus-visible disabled = base 10 + 16 new Reset/stepper feature/featureblock/statblock/hero ×2; 2 hover no hit point initiative stamina), modal 228, input 15/176, checkbox 7/116, prose 99→106 <p> (198→212), 9 img; PNG sha256 identical to f89f69f list; freeze 280/280; parity 0/0/24.
- Anti-vacuity rc 1 (no rollingEnabled; probe hero abilities []), named lines.
- Dice pinning: implemented as `Math.random = () => 0.5` in the sweep load — NOT an existing seam as the ruling required; reviewer to judge (keep vs drop).
- r3 = fresh independent reviewer.

## r3 review result (2026-10-24) — reviewer, report sc513-r3-review-report.md
- LAND-READY, 0 HIGH / 0 MED / 3 LOW / 3 INFO on 324a68d. Shots 592 all sha256 = f89f69f list, freeze 280/280, host-leak lines = r2. Leak probe (host-only min-height on result-card buttons): rc 1, 144 lines on exactly the 8 click-mounted result-card kinds; same probe on base harness green 114/684 (gap was real). Mount-nothing probe rc 1 named. First nodes: 0 lost / 0 moved. 4 jest breaks each rc 1.

## Owner rulings on r3 (2026-10-24)
- Dice pin: KEEP `Math.random = () => 0.5` in the sweep load. No sweep-only seam exists (`fixedDice` is capture-manifest only); r2 used the same one-liner the capture paths use; the "existing seam" condition is met in spirit (same mechanism), not literally. Bundle's other Math.random callers are unreachable from the sweeps.
- LOW-1 (entry.ts:1110-1115 galleryExtra comment says only the button sweep sends it): FOLD into r4, reviewer's fix verbatim: "reword it to name the four sweeps and both the SC-512 and SC-513 sections."
- LOW-2 (fixtures.test.ts:613 capture-URL test guards nothing): FOLD into r4 — rename it to what it actually checks ("absent keys stay `undefined`"), keep it (jest count unchanged).
- LOW-3 (third inline dice-pin copy, shoot.mjs:2855-2857): DROP — factoring would touch the capture paths (:551, :7988) that produce frozen bytes for a dedupe with no behavior gain.
- INFO-1 (hero-body copies share kind keys with the hero's own buttons, so not the compared node): DROP — one-node-per-kind design; the first-node check shows no displacement.
- INFO-2, INFO-3: no action (INFO-3 is the owner's dse-verify draft).
- r4 = r2 implementer (author) fix round; delta gates tsc, lint, jest, shots, freeze, parity + main.js byte-identity vs 324a68d (diff touches no src/, so lifecycle/e2e from 324a68d carry). Scoped re-review = r3 reviewer.

## r4 result (2026-10-24) — r2 implementer, report sc513-r2-impl-report.md (r4 section)
- dse ed368f6 (= 324a68d + one commit: entry.ts comment, fixtures.test.ts rename; 2 files, +11/-8) on c558759; superproject worktree ff'd to origin/main b35d9eb, only ` M draw-steel-elements`.
- tsc/lint clean; jest 6112/1/247 of 248; shots 592 0 FAIL rc 0, button 145/870 28-record, modal 228, input 15/176, checkbox 7 kinds / 116 (owner grep-verified r4-shots.log), prose 106 [212]; PNG sha256 = f89f69f list; freeze 280/280; parity 0/0/24.
- main.js b5a41fcc… and styles.css ae45354b… identical at 324a68d and ed368f6 -> lifecycle 39/39 and e2e 124/124 (measured on 324a68d) carry.
- r4 scoped re-review -> r3 reviewer (not the author).

## r4 scoped re-review (2026-10-24) — r3 reviewer, report sc513-r3-review-report.md (r4 re-review section)
- LAND-READY, 0 findings. Diff 324a68d..ed368f6 = only LOW-1 + LOW-2; tsc rc 0; fixtures.test.ts 121/121; build hashes identical.

## LAND-READY (2026-10-24)
- dse branch sc513-hostleak-click-revealed @ ed368f6 (324a68d, ed368f6) on develop c558759, ancestor verified. Superproject worktree branch at origin/main b35d9eb, only dirt ` M draw-steel-elements` (pointer bump at landing).
- No widening, no rebaseline, no CHANGELOG (harness-only). dse-verify edits: sc513-dse-verify-proposal.md. Backlog filed: SC-526 (popover CSS + D mount), SC-527 (state-only kinds).

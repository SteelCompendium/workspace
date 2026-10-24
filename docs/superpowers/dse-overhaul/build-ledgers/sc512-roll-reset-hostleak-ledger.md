# SC-512 decisions ledger

Ticket: SC-512 — Host-leak sweep never checks the roll strip's Reset button while it is enabled.
Owner: ticket-owner (Opus 5.5). Worktree: /home/scott/code/steelCompendium/worktrees/sc512-roll-reset-hostleak (branch sc512-roll-reset-hostleak in every submodule).
dse base at worktree creation: develop 38f94f4 (2026-10-24). Superproject base: 2bb85df.

## Task (from the ticket description, verbatim)
"The button host-leak sweep in `npm run shots` checks every gallery button with and without Obsidian's host CSS. The roll strip's Reset button is only ever mounted in its **disabled** state in the gallery: Reset is disabled while the strip is at its authored values (`src/framework/kit/rollBar.ts:263`), and no gallery fixture changes a modifier.

So the enabled Reset (rest, hover, keyboard focus) is never compared. Its own padding rule (`styles-source.css` ~15240, `padding-inline-start: 0`) is only checked through the disabled kind.

**Task:** add a gallery state where a roll strip has a changed modifier, so Reset is enabled, and confirm the sweep picks up an enabled `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` kind. This needs a gallery fixture change (`visual-harness/entry.ts`), which is why it was kept out of SC-501's `shoot.mjs`-only fix."

## Dispatcher instructions (2026-10-24, verbatim excerpt)
"harness-only, visual-harness/shoot.mjs and gallery fixtures; adding a new gallery state may add frozen print lines — if so produce a widening file per dse-verify; current baselines in .claude/skills/dse-verify/SKILL.md CURRENT block and its "Button host-leak sweep" bullet). Never widen exemptions silently. If you add a lifecycle scenario, use G-S43."

## Known facts
- Sweep kind key includes `|disabled` (shoot.mjs ~2322), so an enabled Reset is a NEW kind key distinct from the disabled one.
- SC-501's `openRollModifiersForSweep` (shoot.mjs ~2634) opens the collapsed Modifiers disclosure by real click on every sweep load; it is never called from a capture.
- CURRENT (38f94f4): gallery `button host-leak OK (113 … 678 …)`, 12-record boundary (10 focus-visible disabled incl. roll Reset disabled ×2, 2 hover no hit point initiative stamina ×2); modal 10/9/38/228 with 6-record boundary; input 164; checkbox 60; shots 592; freeze 280/280; jest 6027/1/243 of 244; lifecycle 36/36; e2e 114/114, 0 failed, 0 known-bug, 82/82; parity 0/0/24.

## Rulings
(none from Scott yet)

## Owner rulings (2026-10-24)
- The disabled Reset (and the other disabled roll kinds) must STAY compared — the enabled kind is added, not swapped in.
- Prefer a state reached by a REAL user interaction (click a modifier stepper), mirroring SC-501. Prefer zero new photographed shots / zero frozen-byte movement; if a new photographed state is unavoidable, ship a widening file per dse-verify (owner asks Scott).
- No CHANGELOG bullet (harness-only). dse-verify text: owner drafts for the dispatcher at land-ready.

## Rounds
- r1 (implementer): implement + full battery. Report sc512-r1-impl-report.md.

## 2026-10-24 (dispatcher): SC-505 landed — dse develop 38f94f4 -> a0365a4
"dse develop has moved 38f94f4 → a0365a4 (SC-505 landed: shared chrome keyboard focus for Collapse, Expand and Pin, plus new e2e; no gallery change expected). New baselines: jest 6052 / 1 skipped / 244 of 245, lifecycle 36/36, e2e 123/123 with 0 known-bug and 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on a0365a4 (or newer), with the superproject rebased onto origin/main."
- ~~Base 38f94f4; baselines jest 6027 / 243 of 244, e2e 114/114 with 82/82~~ superseded: r1 rebases onto a0365a4 and gates against the numbers above. Superproject branch rebased onto origin/main at land-ready. Gallery button sweep counts at a0365a4 must be re-measured on the base (SC-505 touches chrome buttons' focus) before attributing deltas to SC-512.

## 2026-10-24 (dispatcher): SC-509 landed — dse develop a0365a4 -> c2758a2
"dse develop has moved a0365a4 → c2758a2 (SC-509 landed: replaceSource `fromView` flag, plus lifecycle G-S40; no gallery change). New baselines: jest 6058 / 1 skipped / 245 of 246, lifecycle 37/37, e2e 123/123 with 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on c2758a2 (or newer), with the superproject rebased onto origin/main."
- ~~Base a0365a4; jest 6052 / 244 of 245, lifecycle 36/36~~ superseded: rebase onto c2758a2, baselines above. Base gallery sweep measurement may be taken on c2758a2 (SC-509 has no gallery change).

## 2026-10-24 ~06:42Z: owner + r1 implementer killed by session-limit 429
- Implementer resumed via SendMessage (same agent). State at resume: dse head 635b6df on c2758a2, clean; base sweep on c2758a2 measured 113 / 678, same 12-record boundary, shots 592. Branch battery to be (re-)run on final head.

## r1 result (2026-10-24) — implementer, report sc512-r1-impl-report.md
- dse 635b6df on c2758a2 (one commit; entry.ts, shoot.mjs, test/dom/visual-harness/fixtures.test.ts). Mechanism: harness param `galleryExtra=roll` appends a second roll strip, sent ONLY by the button sweep's URL; sweep real-clicks its Edges "+" every load; loud asserts (exactly one Reset, enabled, has box; first strip's Reset still disabled; key tagged).
- Gallery 113/678 -> 114/684 (one new kind: enabled `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset`); boundary unchanged 12; modal 228, input 164, checkbox 60 unchanged; base re-measured on c2758a2.
- jest 6062/1/245 of 246 (+4), lifecycle 37/37, e2e 123/123 0 known-bug 87/87, shots 592 0 FAIL, freeze 280/280, parity 0/0/24. No widening (no new photographed shot).
- Anti-vacuity: click disabled -> shots rc 1 with two problem lines per scheme.

## Owner rulings on r1 follow-ups (2026-10-24)
- Montage-board wheel flake (scrollLeft 0 of 1565 px under load ~14): FILED SC-521 (Backlog, related SC-512, SC-326). Out of scope here.
- dse-verify text: owner drafts for dispatcher at land-ready (114 / 684; galleryExtra note).
- r2 = independent review by a fresh orchestration:reviewer (implementer is author).

## r2 review result (2026-10-24) — reviewer, report sc512-r2-review-report.md
- LAND-READY, 0 HIGH / 0 MED / 2 LOW / 3 INFO. All 592 PNGs byte-identical base vs branch; enabled-Reset leak probe red on branch (6 lines, enabled kind only), green on base (gap was real); Reset-never-enables and swap-to-first-strip probes FAIL loudly.

## Owner rulings on r2 findings (2026-10-24)
- LOW-1 (missing Edges "+" stepper reported as a Reset failure, shoot.mjs:2691/:2713): FOLD into r3 fix round, reviewer's prescribed fix verbatim.
- LOW-2 (feature ability roll strip never swept, rollController.ts:110): DROP here — already covered by SC-513 ("the ability roll bar in feature and statblock cards (`src/.../feature/rollController.ts:108-126`)"). Out of scope for r3.
- INFO-1 (redundant `galleryIds` spread, fixtures.test.ts:514 + two later calls): FOLD into r3 (trivial, same commit area).
- INFO-2 (galleryExtra ignored outside gallery mode): DROP — consistent with its doc comment.
- INFO-3 (dse-verify wording 114/684 equals stale SC-338 figure): FOLD into the owner's dse-verify proposal (done by owner, not a worker).
- r3 = implementer (author) fixes; scoped re-review of the r3 delta by the r2 reviewer (not the author).

## 2026-10-24 (dispatcher): SC-519 landed — dse develop c2758a2 -> 253aa5f
"dse develop has moved c2758a2 → 253aa5f (SC-519 landed: the edit form picks up a pending card write, plus lifecycle G-S45; no gallery change). New baselines: jest 6074 / 1 skipped / 245 of 246, lifecycle 38/38, e2e 123/123 with 87/87, shots 592, freeze 280/280, parity 0/0/24. Land-ready must be on 253aa5f (or newer), with the superproject rebased onto origin/main."
- ~~Base c2758a2; jest 6058 (+4 = 6062), lifecycle 37/37~~ superseded: r3 rebases onto 253aa5f; expect jest 6074+4 = 6078 / 1 / 245 of 246, lifecycle 38/38; full battery on the rebased head (incl. lifecycle + e2e, so land-ready numbers are all measured on the land sha). Superproject ff to origin/main after the rebase.

## r3 result (2026-10-24) — implementer
- dse f89f69f on 253aa5f (a706ff7 = r1 rebased, f89f69f = r3). LOW-1 + INFO-1 fixed. Full battery on f89f69f: jest 6078/1/245 of 246, lifecycle 38/38, e2e 123/123 0 known-bug 87/87, shots 592 (114/684, 12-record boundary), freeze 280/280, parity 0/0/24. LOW-1 anti-vacuity: "found 0" line. Superproject ff'd to origin/main 104dd85, only ` M draw-steel-elements`.
- r3 scoped re-review -> r2 reviewer (not the author).

## r3 scoped re-review (2026-10-24) — r2 reviewer, report sc512-r3-rereview-report.md
- LAND-READY. range-diff r1 unchanged; delta only LOW-1 + INFO-1. shots 592 (114/684, 12-record), all PNG sha256 = base, freeze 280/280, parity 0/0/24, fixtures jest 114/114. LOW-1 anti-vacuity reproduced.
- Owner rulings: re-review INFO-1 (message hard-codes `roll.edges.inc`) DROP — naming nit, the message still fails loudly; INFO-2 DROP — matches the brief.
- LAND-READY: dse f89f69f on develop 253aa5f; superproject branch at origin/main 104dd85 with only ` M draw-steel-elements` (pointer bump at landing). dse-verify edits: sc512-dse-verify-proposal.md. No widening, no rebaseline, no CHANGELOG.

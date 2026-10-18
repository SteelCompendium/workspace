# SC-423 — decisions ledger

Ticket: SC-423 "Initiative: acted hero portrait shows its frame only after a re-render, not right after the click"
Worktree: /home/scott/code/steelCompendium/worktrees/sc423-portrait-frame (every submodule on branch `sc423-portrait-frame`)
DSE base: origin/develop @ 135716d (2026-10-18)
Owner session: 3d188a02-255e-4666-847b-3a56b55057a2

## Rulings (verbatim, dated)

- 2026-10-17 (ticket description, Scott-authored): the whole ticket body is the spec. Fix section verbatim:
  > In `repaintTurn`, also call `toggleAttribute('data-pressed', taken)` on `.dse-init__portrait-toggle`, or use the iconButton handle's own pressed setter. The other option is to raise the specificity of `:13848` above 0,8,0, the way `:13950+` does for the turn button.
  > Add a computed-style parity assertion, as `assertTurnMarkParity` does for the turn button.
  > After the fix, run `npm run docs-shots -- --only=initiative-tracker.gif` to regenerate the docs GIF.

## Owner decisions

- 2026-10-18: Do BOTH halves of the fix (TS: repaintTurn stamps data-pressed; CSS: raise the portrait acted-frame rule's specificity above the sheen rule), because the ticket's own analysis says the turn button needed the CSS half even after its TS was right, and "consistency is important" (Scott, 2026-06-19). Rationale recorded here so the brief can state it as scope, not as a ruling.
- 2026-10-18: Thread had zero comments at pickup. No supersessions.

## Rounds

- R1 implementer: dispatched 2026-10-18 (brief sc423-brief-r1-implement.md)
- R1 result (2026-10-18): DONE_WITH_CONCERNS at 379a5a5. Fix + 3 jest tests + `assertPortraitMarkParity` (4 comparisons) green; all gates green (jest 4461/1 skipped/220 of 221, shots 572 0 FAIL, lifecycle 25/25, freeze 276/276, parity 0/0/24). GIF step failed: `initiative-tracker.gif` was DOCS_MANUAL at base 135716d. Cause: SC-411 (Done) landed on origin/develop at 566888a AFTER the branch was cut; new develop's manifest has the gif entry (docs-manifest.mjs:490). SC-411 touched no src/, styles-source.css, or shoot.mjs.
- Owner decision 2026-10-18: R1b = rebase sc423-portrait-frame onto origin/develop 566888a, `npm ci` (SC-411 pinned gifenc/pngjs), regenerate the GIF via `npm run docs-shots -- --only=initiative-tracker.gif`, re-run tsc/lint/jest/shots/freeze/parity. Lifecycle not re-run (rebase brought no src/ change); reviewer may re-run.
- Owner eyeballed evidence 2026-10-18: before PNG = Frodo clicked, seal badge, no frame; after PNG = same click, 2px light-grey frame. Deciding evidence confirmed.
- Follow-up ruling: "other iconButtons mutated in place without setPressed" → covered by R2 review brief item 8 (audit, report, no fix). dse-verify numbers update → owner does it at land-ready as workspace doc bookkeeping.
- R1b result (2026-10-18): rebased onto 566888a, head a9d6dba (5 commits). GIF regenerated: 19 frames, 564324 bytes, --check-stable `stable`; frame 8 shows Frodo framed right after the click. Gates: tsc/lint clean, jest 4504/1 skipped/222 of 223, shots 572 0 FAIL (+ `portrait mark parity OK (4 comparisons)`), freeze 276/276, parity 0/0/24. Lifecycle not re-run (R1 had 25/25; no src change in the rebase).
- R2 reviewer dispatched 2026-10-18 (brief sc423-brief-r2-review.md), author-independent.
- R2 result (2026-10-18): APPROVE at a9d6dba; 0 HIGH/0 MED/3 LOW/2 INFO. Report sc423-r2-review-report.md.
- Owner rulings on R2 findings (2026-10-18):
  - LOW-1 (raised acted-frame rule sets only box-shadow; sheen's background-image/border-color still win if data-pressed drifts): FOLD into R3 — make the CSS half self-sufficient (background-image: none + the frame's border-color), not just reword.
  - LOW-2 (harness gate does not pin the CSS half): FOLD into R3 — strip data-pressed from the clicked-acted toggle, assert still matches rendered-acted, restore.
  - LOW-3 (`.dse-init__turn` BUTTON loop in repaintTurn also skips data-pressed): FOLD into R3 — same function, consistency; add jest assertion.
  - INFO-1 (`bash -c '...; echo EXIT=$?'` false green under devbox): owner verifies, then corrects dse-verify SKILL.md at land-ready (workspace doc bookkeeping).
  - INFO-2 (in-place aria-pressed setters outside initiative unaudited): FILE Backlog ticket linking SC-423; out of scope for R3.
- R3 result (2026-10-18): head f3585f0 (4 commits on a9d6dba: f7253b9 red test, f6c3ef1 LOW-3 TS, 06b5de6 LOW-1 CSS, f3585f0 LOW-2 gate). Gates via script-file rc: tsc/lint clean, jest 4505/1 skipped/222 of 223, shots 572 0 FAIL + `portrait mark parity OK (6 comparisons)`, freeze 276/276, parity 0/0/24. Gate proven red with box-shadow-only CSS and with CSS reverted.
- R4 scoped re-review dispatched 2026-10-18 to the R2 reviewer identity (delta a9d6dba..f3585f0 only).
- Owner doc bookkeeping 2026-10-18: dse-verify SKILL.md "THE exit-code footgun" corrected for the single-quote false green (uncommitted in main checkout until land-ready).
- R4 result (2026-10-18): APPROVE at f3585f0. 0 HIGH/MED/LOW, 1 INFO (INFO-R4-1: `color` differs with data-pressed stripped; paints no pixel; unreachable with the TS half). Owner ruling: DROP — no visible effect, reviewer says no action needed. All 572 shots byte-identical between a9d6dba and f3585f0 (0 of 288 screen PNGs changed).
- Chore (2026-10-18): DSE CHANGELOG bullet committed as 29207d1 (head). Workspace CHANGELOG + dse-verify committed in main checkout as 08abe0f (local, unpushed; landing carries it).
- LAND-READY 2026-10-18: draw-steel-elements sc423-portrait-frame @ 29207d1 on develop 566888a. Land-ready comment posted; ticket → In Progress + Needs Review.
- 2026-10-18 Scott: "land it and merge in" — owner runs land-stack directly (user instruction overrides the dispatcher-lands rule).
- Landing pre-flight: origin/develop had moved 566888a → e9502a8 (SC-390 sdk 3.1.0 bump; statblock-only + CHANGELOG). Rebased clean → head 7982deb (10 commits). R5 re-gate dispatched (npm ci + tsc/lint/jest/shots/freeze/parity) before wt-finish.
- R5 (2026-10-18): all gates green at 7982deb (jest 4505/1/222 of 223, shots 572, freeze 276/276, parity 0/0/24).
- LANDED 2026-10-18: dse develop e9502a8 → 7982deb (10 commits); workspace main 18bbc01 → 409f848 (merge; carries 08abe0f docs + 969705b pointer bump). Vault stash popped, state identical. Ledger preserved to docs/superpowers/dse-overhaul/build-ledgers/sc423-portrait-frame-ledger.md; worktree removed.

---

# Appendix: R1 implementer report (executive summary)

# SC-423 R1 + R1b implement report

## Executive summary (updated R1b)
- Verdict: DONE. Rebased onto origin/develop 566888a (no conflicts); head a9d6dba; log origin/develop..HEAD = 5 commits (4 R1 rebased + GIF).
- Commits: 45b50ca test(red), 4ed05f5 TS fix, 5ffe6ba CSS (0,9,0), 1e8256c assertPortraitMarkParity, a9d6dba regenerated docs GIF.
- Red-then-green (R1): initiative.test.ts -t SC-423 = 3 failed on unfixed code -> 123/123 after the TS fix.
- GIF regenerated via `docs-shots --only=initiative-tracker.gif`: 570381 -> 564324 bytes, 19 -> 19 frames (1632x1800, 11.3 s loop); `--check-stable` verdict: stable (same 564324 bytes, byte-identical). Frame 8 (right after Frodo's portrait click) shows the 2px frame; frame 7 is the pre-click.
- R1b gates: tsc clean; lint clean; jest 4504 passed / 1 skipped, 222 of 223 suites; shots 0 FAIL, 572 PNGs, `turn mark parity OK (20 comparisons)` + `portrait mark parity OK (4 comparisons ...)`; freeze OK (276/276), exit 0; parity 0 gaps / 0 undeclared / 24 declared, exit 0. Lifecycle not run in R1b (R1 on pre-rebase base: 25/25 ok).
- R5 (pre-landing re-gate on 7982deb, base e9502a8, no code changes): npm ci RC=0; tsc RC=0 clean; lint RC=0 clean; jest RC=0 4505 passed / 1 skipped, 222 of 223 suites; shots RC=0, 0 FAIL, 572 PNGs, turn parity 20 + portrait parity 6 comparisons; freeze OK 276/276; parity RC=0, 0 gaps / 0 undeclared / 24 declared; git status empty. Logs: logs/*-r5.log.
- Evidence: .../sdd/sc423/evidence/sc423-before-click-acted.png, sc423-after-click-acted.png, sc423-gif-frame-preclick.png, sc423-gif-frame-clicked.png; GIF /home/scott/code/steelCompendium/worktrees/sc423-portrait-frame/draw-steel-elements/docs/Media/initiative-tracker.gif.

## R1b
- `git fetch`/`rebase origin/develop` (566888a): clean, no conflicts. `npm ci` re-run (node v24.4.1 under devbox).
- GIF: manifest step list clicks `Toggle turn taken: Frodo Baggins` then Sam (steps 5-6 of 13), so the run order does click portraits. Before (develop's SC-411 GIF) 570381 B / 19 frames; after 564324 B / 19 frames. Frames extracted from the committed GIF: preclick = frame 7 (title committed, Frodo not acted), clicked = frame 8 (Frodo acted, 2px metal frame visible). All frames: logs/gifframes/f01..f19.png; contact sheet logs/gifframes/sheet.png.
- Gate numbers are my own on the rebased tree; no clean-develop run done for base comparison. Prior R1 (stale base) was jest 4461 / 220 of 221, shots 572, so SC-411 added 43 tests / 2 suites and 0 shot PNGs.
- Logs (logs/ dir, `-r1b` suffix): npmci, docs-shots, docs-shots-checkstable, tsc, lint, jest-full, shots, freeze, parity; initiative-tracker-before-r1b.gif / -after-r1b.gif.

## R1 body follows (R1 concern 1, the GIF, is resolved by R1b; shas below are pre-rebase)

## Changes
- src/elements/initiative/view.ts `repaintTurn`: portrait-toggle loop also `el.toggleAttribute('data-pressed', taken)` (present-as-empty / absent, same as iconButton.setPressed).
- styles-source.css 12b: acted-frame selector now `.dse-init__portrait-toggle.dse-btn:not(.dse-btn--accent):not(.dse-btn--ghost):not(.dse-btn--danger)[data-taken]` = (0,9,0) vs the sheen rule (0,8,0); comment cites SC-423 and the specificities. Still inside `:not([data-dse-print="on"])`; freeze unmoved.
- test/dom/elements/initiative.test.ts: 3 tests (click on/off flips data-taken + aria-pressed + data-pressed; rendered-acted un-toggled in place drops data-pressed; checkbox click repaints portrait data-pressed).
- visual-harness/shoot.mjs: `measurePortraitMarks` + `assertPortraitMarkParity`, wired after `assertTurnMarkParity(page)`. Uses the `fight` fixture (one hero rendered acted, one not; the `default` fixture has no acted hero). Clicks each portrait in place (asserts element survived, no rebuild), compares backgroundColor/backgroundImage/boxShadow/borderTopColor/borderTopWidth to the rendered-state portrait, both directions, dark and light. Also updated the now-stale comment on `measureTurnMarks`.


# Appendix: R2/R4 review report (executive summary)

# R4 — scoped re-review of the R3 fix round (a9d6dba..f3585f0)

## R4 executive summary
- Verdict: APPROVE. Head reviewed: f3585f0c1b82e4b2156bc149826751d277e0f899 (4 commits: f7253b9, f6c3ef1, 06b5de6, f3585f0). No HIGH, MEDIUM or LOW findings; 1 INFO. The tree was clean before and after.
- LOW-1 is fixed. In dark and light, a toggle with `data-taken` and `data-pressed` stripped computes the same as a rendered-acted toggle on background-color, background-image, box-shadow, border-color and border-width. That holds at rest, on real-mouse hover and on focus-visible. The implementer's border-color claim holds: rendered-acted border-top-color is the accent-fg colour (rgb(15,18,20) in dark, rgb(255,255,255) in light).
- LOW-2 is fixed. The gate prints `portrait mark parity OK (... 6 comparisons ...)`. With 06b5de6's CSS reverted, the gate goes red (4 violations: backgroundImage and borderTopColor, in both dark and light; exit 1). Restored by sha256 and status is clean.
- LOW-3 is fixed. After an in-place click, the group-header turn button and the hero-row turnbox button carry `data-pressed` (acted) or drop it (not acted), in all 8 combos of dark/light × portraits on/off, with no paint difference. With f6c3ef1's TS reverted, 2 SC-423 jest tests fail (exit 1).
- Rendering is unchanged. `npm run shots` at a9d6dba (scratch clone) vs f3585f0 (worktree): all 572 PNGs are byte-identical (288 screen + 284 print/realprint), so 0 screen bytes changed.
- Gates, with exit codes recorded by a script file:

  | Gate | Result |
  |---|---|
  | tsc | clean, rc 0 |
  | lint | clean, rc 0 |
  | jest | 4505 passed / 1 skipped / 222 of 223 suites, rc 0 |
  | shots | 572 PNGs, 0 FAIL, turn mark parity 20 + portrait mark parity 6, rc 0 |
  | freeze | OK (276/276), rc 0 |
  | parity | 0 gaps / 0 undeclared / 24 declared, rc 0 |

## R4 findings
**INFO-R4-1: a leftover `color` difference that paints nothing.**
- The stripped variant still differs from rendered-acted on `color`, which also reaches `-webkit-text-fill-color` and the inherited `::after` colour:
  - dark: rendered rgb(15,18,20) vs stripped rgba(220,226,230,.88);
  - light: rgb(255,255,255) vs rgb(44,46,48).
- A full computed-style diff of the toggle subtree (15 node/pseudo slots), filtered to properties that can paint on a rendered box, finds only these. That holds at rest, on hover and on focus-visible. The toggle has no text nodes of its own. `::after` has `content: ''` with explicit background and border colours. Every descendant (seal mark, svg, word) matches exactly, and so does the focus outline.
- Related: `border-color: var(--dse-accent-fg)` (`styles-source.css:13867`) paints nothing, because the border width is 0px. It exists only so the gate's `borderTopColor` key matches, and the rewritten comment at :13858-13864 says exactly that.
- No action needed. If the owner wants the rule to be fully self-sufficient, `color: var(--dse-accent-fg)` would close the computed gap too, and is likewise a no-op on paint.

## R4 artifacts
- Logs in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc423/logs/:

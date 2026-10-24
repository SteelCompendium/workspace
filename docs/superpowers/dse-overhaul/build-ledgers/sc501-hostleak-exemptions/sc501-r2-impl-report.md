# SC-501 r2 implementation report

## Executive summary
- STATUS DONE. dse branch sc501-hostleak-exemptions, head 1918a29 (one commit), rebased onto origin/develop a993a60 (SC-487). Only file: visual-harness/shoot.mjs.
- New helper openRollModifiersForSweep: real, idempotent click on each collapsed ds-roll Modifiers header, mouse parked at (0,0), loud assertion (no roll panel, or any still [hidden] / box-less, pushes a named problem so the sweep FAILS). Called per scheme page-load in assertBtnHostLeak, assertInputHostLeak, assertCheckboxHostLeak. Not called from any screenshot capture.
- btnExemptionBoundary now lists distinct kind keys (sorted, per-key count) under each reason line; gallery and modal passes both.
- Gallery: 113 kinds / 678 comparisons, 12-record boundary (10 focus-visible disabled + 2 hover no hit point), as predicted. Modal: unchanged 10/9/38/228, 6-record boundary. No new host-leak property difference anywhere.
- Input 164 and checkbox 60 are UNCHANGED. r1's inference ("4 missing because the roll input has no box") is REFUTED: those sweeps never exempt box-less records, they compared them anyway; what changed is that the roll input is now measured at 61.19x23.8 (was 0x0) and the roll checkbox has 1 client rect (was 0).
- Can-fail proven: selector sabotage gives BUTTON HOST-LEAK VIOLATED, rc 1.
- Battery on a993a60: tsc/lint clean, jest 5958/1 skipped/241 of 242, lifecycle 36/36, e2e 114/114 79/79, shots 592 0 FAIL, freeze 280/280, parity 0/0/24.

## Commits
- 1918a29 fix(SC-501): host-leak sweeps open the roll strip's Modifiers disclosure; boundary names its kinds

## Printed lines (verbatim from /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r2-impl/sc501r2-shots.log, a993a60)
```
button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)
  12 of those (kind,state) records sampled the node at rest because the mounted DOM cannot put it into that state — each one proved per record, never assumed, and the authoring chrome is MOUNTED for the sweep so this is no longer a claim about controls the product merely had not revealed:
      10× focus-visible: disabled
          montage|dse-btn|disabled ×2
          negotiation|dse-btn|disabled ×2
          party|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
          roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled ×2
          roll|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
      2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
          initiative|dse-btn.dse-init__stamina ×2

modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)
  not openable in the harness (3, no <button> of their own beyond the swept kit footers): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal
  6 of those (kind,state) records sampled the node at rest because the mounted DOM cannot put it into that state — each one proved per record, never assumed:
      6× focus-visible: disabled
          modal:(none)|dse-btn.dse-btn--accent|disabled ×6

input host-leak OK (14 input kinds × 6 states (rest/hover/disabled/focus-visible/placeholder/spinner) × dark/light = 164 comparisons against the real Obsidian app.css: every sampled property is identical with and without it; -webkit-app-region and unicode-bidi and fontFamily are excluded by design)

checkbox host-leak OK (3 plugin-authored checkbox kinds × 7 states [42] + 1 synthetic task-list checkbox × 7 states [14] + 2 synthetic task-list <li> decoration [4] × dark/light = 60 comparisons against the real Obsidian app.css under a real .markdown-preview-view.markdown-rendered ancestor: every sampled property is identical with and without it)
```
Kind count stayed 113 (no kind added or removed). The 10 = 8 old + 2 roll Reset disabled (dark+light); the 2 hover no-hit = initiative stamina (as in r1).

## Input / checkbox measurement (temporary probe, reverted, not committed)
Probe ran assertInputHostLeak + assertCheckboxHostLeak alone, with and without the click:
- without click: roll|dse-stepper__input 0x0 (dark, light); roll|(no class) checkbox 0 client rects.
- with click: roll|dse-stepper__input 61.19x23.8; roll checkbox 1 rect.
- both runs print 14 kinds / 164 comparisons and 3 kinds / 60 comparisons. 164 is not 14x6x2 because placeholder/spinner are counted only for inputs that have them; the inference of 4 missing was wrong. The click changes coverage (a box-less node's w/h and layout-dependent properties compared as 0), not the count.
- Probe logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r2-impl/sc501r2-probe-open.log, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r2-impl/sc501r2-probe-skip.log.

## Battery (a993a60 + 1918a29)
- tsc incl. e2e: clean (rc 0). lint incl. e2e: clean (rc 0).
- jest (after shots): Tests 1 skipped, 5958 passed, 5959 total; Suites 241 of 242 passed.
- lifecycle: OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed.
- e2e: OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs.
- shots: rc 0, 592 PNGs, 0 FAIL, OBSIDIAN APP.CSS PIN DRIFT warning present (expected, rc 0).
- freeze: freeze OK (280/280 frozen print PNGs byte-identical ...), no rebaseline.
- parity: 0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).
- Can-fail (temporary selector sabotage, reverted): BUTTON HOST-LEAK VIOLATED, "the roll strip's Modifiers disclosure could not be opened (1 of 1 panel(s) still [hidden] ...)", rc 1. Log: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r2-impl/sc501r2-canfail.log.
- Earlier gate runs on c98bd82 / b624eef (shots only) gave identical host-leak lines; superseded by the a993a60 run above.

## Tests
Harness-only change; no jest test covers these helpers (grep of test/ finds only name mentions), so none added. The in-run gates are the tests.

Drive-by fixes: none.

Follow-ups:
- Input and checkbox sweeps have no box-presence assertion or exemption boundary: a future collapsed/hidden control would again be compared as 0x0 and print OK. Consider a loud "tagged node has no client rects" check like the button sweep's "blocked" records.
- An enabled roll Reset (roll|...dse-rollbar__reset, no |disabled) is still never mounted in the gallery (r1 optional (a)).
- focusTagged tests disabled before getClientRects, so a disabled node in a hidden region reads "disabled" not "no box" (r1 optional (c)); the new click makes it moot for roll but not for the next hidden disclosure.

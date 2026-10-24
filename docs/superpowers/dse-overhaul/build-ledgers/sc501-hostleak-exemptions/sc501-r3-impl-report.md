# SC-501 r3 implementation report

## Executive summary
- STATUS DONE. Branch sc501-hostleak-exemptions rebased onto origin/develop efc17de (package.json unchanged, no npm ci). The r2 commit is now af8caae (was 1918a29).
- New commits: 8925fac (fix: FU-1 + INFO-1 + LOW-1), 054c9c5 (docs: LOW-2). Head 054c9c5. Only visual-harness/shoot.mjs touched.
- FU-1: assertTaggedHaveBox runs right after tagInputs and tagCheckboxes (every tagged node must have client rects and w,h > 0), pushes a named problem, never skips. The input focus-visible "renders no box" branch is now a failure, not an accepted exemption.
- LOW-1: modal boundary kind keys carry the scenario (3 lines x2 instead of one x6). Gallery output unchanged.
- LOW-2: comment now says "from c0e761b (SC-279) until SC-501". Problem strings use em dashes.
- Can-fail proven for both (sabotage = skip the Modifiers click, scratch-only, reverted): input sweep exits 1 naming roll|dse-stepper__input (box + focus-visible), checkbox sweep exits 1 naming roll|(no class).
- Battery at efc17de + 054c9c5: tsc/lint clean, jest 6003/1 skipped/242 of 243, lifecycle 36/36, e2e 114/114 79/79, shots 592 0 FAIL, freeze 280/280, parity 0/0/24. Host-leak counts unchanged.

## Commits
- af8caae fix(SC-501): host-leak sweeps open the roll strip's Modifiers disclosure; boundary names its kinds (rebased from 1918a29)
- 8925fac fix(SC-501): input and checkbox sweeps fail on a box-less node; modal boundary names its scenario
- 054c9c5 docs(SC-501): the roll-strip helper comment says the 8 records ran until SC-501, not to c98bd82

## Host-leak lines (verbatim, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r3-impl/sc501r3-shots.log)
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
          modal:(none)|dse-btn.dse-btn--accent|disabled @MinionStaminaPoolModal ×2
          modal:(none)|dse-btn.dse-btn--accent|disabled @MontageAddHeroModal ×2
          modal:(none)|dse-btn.dse-btn--accent|disabled @StaminaEditModal ×2

input host-leak OK (14 input kinds × 6 states (rest/hover/disabled/focus-visible/placeholder/spinner) × dark/light = 164 comparisons against the real Obsidian app.css: every sampled property is identical with and without it; -webkit-app-region and unicode-bidi and fontFamily are excluded by design)

checkbox host-leak OK (3 plugin-authored checkbox kinds × 7 states [42] + 1 synthetic task-list checkbox × 7 states [14] + 2 synthetic task-list <li> decoration [4] × dark/light = 60 comparisons against the real Obsidian app.css under a real .markdown-preview-view.markdown-rendered ancestor: every sampled property is identical with and without it)
```

## Can-fail proofs (scratch-only sabotage, reverted; no R3_ code is in the tree)
- input (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r3-impl/sc501r3-canfail-input.log, rc 1): "the tagged input roll|dse-stepper__input has no box at all — it would be compared as 0x0 ...", plus "has no box in the :focus-visible pass ... an input with no box is not an exemption" for host-absent and host-present, dark and light.
- checkbox (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r3-impl/sc501r3-canfail-checkbox.log, rc 1): "the tagged checkbox roll|(no class) has no box at all — ..." dark and light.

## Battery (efc17de + 054c9c5)
tsc incl. e2e clean; lint incl. e2e clean; jest 6003 passed / 1 skipped / 242 of 243 suites (after shots); lifecycle 36/36 ok; e2e 114/114 ok, 0 failed, 0 known-bug, 79/79 pairs; shots 592 PNGs, 0 FAIL, PIN DRIFT warning present, rc 0; freeze OK 280/280; parity 0 gaps / 0 undeclared / 24 declared.

Drive-by fixes: the roll helper's two problem strings changed " - " to an em dash (matches the rest of the file; the r2 reviewer's optional cosmetic).
Follow-ups: none new (SC-512, SC-513 already filed).

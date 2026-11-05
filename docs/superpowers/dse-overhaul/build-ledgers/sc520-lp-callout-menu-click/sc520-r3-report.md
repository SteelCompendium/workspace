# SC-520 r3 report

## Executive summary
- STATUS: DONE. dse `a62150c` on origin/develop `4f73043` (7 commits; r3 adds one: `a62150c`). Superproject `1b783d67` on origin/main `a15d81cc` (3 docs commits). Not pushed, pointer not bumped.
- INFO-1: the Live Preview panel clearance (`--dse-chrome-inset: 24px`) now applies to the OUTER block's anchor only (the reviewer's selector, `:not([data-dse-element] [data-dse-element] .dse-chrome-anchor, [data-dse-element] [data-dse-element].dse-chrome-anchor)`). Verified live in real Obsidian 1.15.0 LP: party with `hero_ref` counter and feature with an effect counter, in a callout: outer anchor 24px, nested counter anchor 10px; at top level both 10px; stamina bar (anchor is a descendant, not the root) in a callout 24px, at top level 10px. Panel/`</>` grid over 20 element types x {default, foldable} LP: 66/66 buttons across their whole face, `</>` 63/63, no overlap. G-S49 still ok.
- INFO-2: DESIGN.md (worktree superproject) now says "up to 9/255 of a colour step, card shadow only".
- jest pin updated to the new selector (+1 assertion, no new test).
- Gates on `a62150c`: tsc/lint clean; jest 6160 passed / 1 skipped / 248 of 249 (twice); lifecycle 42/42 (21/21 + 21/21, G-S49 ok); e2e 124/124 x2; shots 592, 0 FAIL, button host-leak 157/942, modal 228, input 15/176, checkbox 7/116, prose 106 [212]; freeze OK 280/280; parity 0/0/24.

## Details
- Rebase: dse onto `4f73043` (SC-527: shoot.mjs, entry.ts, fixtures.test.ts), no conflicts; superproject onto origin/main, no conflicts. package.json unchanged.
- CSS comment (styles-source.css, rule 3 in the callouts block) extended to say why only the outer anchor. Selector is two parts joined by a comma: the root itself as anchor (party, feature, counter ...) and a descendant anchor (stamina bar); both forms exercised live (`NEST` records: anchorIsRoot true and false).
- Probe: `sc520-r3-p8w2/probe-nest.js`, log `nest-head1.log`; survey `survey-head1-a.log` (`summ2.js` output: default|LP and fold|LP 66/66, ebb grid 0 bad, overlap none, geo ok).

## Drive-by fixes:
none.

## Follow-ups:
none new.

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r3-p8w2/`: `gate-tsc.log gate-lint.log gate-jest1.log gate-jest2.log gate-lc1.log gate-lc2.log gate-e2e1.log gate-e2e2.log gate-shots.log gate-freeze.log gate-parity.log nest-head1.log survey-head1-a.log probe-nest.js`.

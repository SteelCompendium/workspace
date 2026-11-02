# SC-540 r3 fix report

## Executive summary
- STATUS: DONE. Plugin HEAD `31b6235b` on `423e798d`; superproject HEAD `d4e68447` on `baab5315` (CHANGELOG only; submodule pointer not bumped; nothing pushed).
- Rebase: both clean, no conflict (range-diff: the 4 r1 commits are `=`, content-identical; `package.json` unchanged, no `npm ci` needed).
- Folded: HIGH-1 (reviewer's prescribed bubble listener that marks the detached click target's subtree; covers callouts and LP embeds), LOW-1 (Mod+A comment reworded), LOW-2 (G-S62 phase (i) Reading view).
- Red/green: jest 2 new tests FAIL on the `8f672965` source (51 pass), all 53 pass at HEAD. G-S62 (g) and (h) FAIL on a `8f672965` bundle (callout raw 0-0 -> 316-151; embed selected 0-0 -> 243-212), pass on HEAD; (i) passes on both and FAILs on a "mark every `.callout`" bundle (`[true,false]`).
- ds-project Add project roll in a callout on HEAD: stays a card, selection 0-0 (prev bundle: raw, 0-0 -> 332-144).
- Gates at HEAD: tsc/lint clean; jest 6282 passed / 1 skipped / 250 of 251; lifecycle 47/47 (21: 187 s, 16: 333 s, 10: 456 s); e2e 124/124 87/87 + pointer parked; shots 592 0 FAIL 161/966 modal 228 input 15/176 checkbox 7/116 prose 106 [212]; freeze 280/280; parity 0/0/24.
- Screenshot: `sc540-r3-head-advance-round-callout-card.png` (HEAD, callout "Init" still a card after Advance round, "Round 2").

## Rebase
- Plugin: `git rebase 423e798d` onto the fetched `origin/develop` (still `423e798d`): Successfully rebased, no conflict in `obsidian-lifecycle.mjs`. `git range-diff eaf64ba6..992375b6 423e798d..HEAD`: `e04a1d8c = b96299d0`, `c11f7d11 = 40223c54`, `98b4b65e = 1b6868a5`, `992375b6 = 8f672965`; new `a78a4837`, `fb71e8ac`, `31b6235b` (the three r3 commits).
- Superproject: `git rebase baab5315`: Successfully rebased (`5a18ee74` -> `4782634e`), then the r3 CHANGELOG commit `d4e68447`. The lifecycle/e2e runs were all after the rebase (they use `scripts/xvfb-owned.mjs`; displays `:160-:162`, port 9542).

## Commits (plugin)
- `a78a4837` test: 3 new jest tests; red on `8f672965` (2 fail: the callout and the embed variants of the detached-target pin; the Reading-view guard passes on base by design). Log `sc540-r3-evidence/jest-red.log`: `Tests: 2 failed, 51 passed, 53 total`.
- `fb71e8ac` fix: in `armClickShield`, a bubble `click` listener on the root: if the root is marked and `event.target` is no longer inside it, climb to the top of the detached subtree and add `interactive-child` there (the reviewer's prescribed code; no stop, no cancel). The comment block names the case (callout and embed, `Ah` 10/150 ms deferral, measured 0-0 -> 144-309). LOW-1: the Mod+A sentence now says Obsidian's Mod+A handler also reads the class but measured behaviour is the same with or without it. `livePreviewScrollHold.ts` did not repeat the overstated Mod+A claim (its SC-522 r3 sentence says "behave as on stock"), so only my own pointer sentence gained a clause about the embed gap. Green: `jest-green1.log`, 53/53. Built `main.js` sha256 prefix `bfe2f8427147` = the reviewer's fixprobe bundle.
- `31b6235b` lifecycle: G-S62 phases (g), (h), (i), fixtures `Lifecycle/callout-init.md`, `callout-init-src.md`, `callout-init-host.md`, header comment.
- Superproject `d4e68447`: CHANGELOG bullet extended (buttons that redraw the whole card; an embedded initiative no longer selected).

## Red/green (G-S62, in-tree harness, `DSE_LIFECYCLE_BUNDLE`, port 9543; logs in `sc540-r3-evidence/`)
- HEAD `lc-g62-head3.log`: ok, 97 s. New numbers: (g) card, selection 0-0, scrollTop 316; (h) written, selection 0-0, scrollTop 530; (i) disk [6,5], marked `[false,false]`; (a)-(f) as r1.
- `8f672965` bundle (`prev`, `main.js` `1e1036c0aeb1`) `lc-g62-prev.log`: FAIL, 100 s: (g) callout shown as markdown source (1 raw line), 0 of 0 roots in a callout widget, selection 0-0 -> 316-151; (h) host selection moved 0-0 -> 243-212 (embed selected). (a)-(f), (i) pass.
- "Mark every `.callout`" mutant (HEAD with `root.closest('.cm-content .cm-embed-block.cm-callout')` -> `root.closest('.callout')`, `main.js` `f67a6222ff20`) `lc-g62-mutreading.log`: FAIL (i) only: "a card in Reading view carries interactive-child: [true,false]".
- Probe (scratch, `probe3.mjs.txt`/`run3.sh`), same real click, `p3-head.log` vs `p3-prev.log`: Advance round in callout: HEAD written, sel 0-0, card (roots 1) / prev sel 316-151, raw 1, roots 0. ds-project Add project roll in a callout: HEAD written, sel 0-0, card / prev sel 332-144, raw. Screenshots: `sc540-r3-evidence/p3-head-projroll.png`, `p3-prev-advance.png` (and the deciding HEAD one in the report dir).

## Gates (HEAD `31b6235b`)
| Gate | Result |
|---|---|
| tsc (incl. `-p e2e`) | clean (11 s) |
| lint (incl. `e2e/`) | clean (14 s) |
| jest | before shots and after shots both `Tests: 1 skipped, 6282 passed, 6283 total`, `Test Suites: 1 skipped, 250 passed, 250 of 251 total` (53 s each; 6272 + 7 + 3). The worktree already had the cached `obsidian-app.css` from r1, so the "fresh worktree one fewer / 2 skipped" state was not measured |
| lifecycle part 1 `G-S7a … G-S9a` | `done: 21/21 ok, 0 failed`, 187 s |
| lifecycle part 2 `G-S9b … G-S40` | `done: 16/16 ok, 0 failed`, 333 s |
| lifecycle part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` | `done: 10/10 ok, 0 failed`, 456 s (under 540, no rebalance) |
| e2e | `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; `OBSIDIAN-E2E pointer parked at 0,0 on :200 (outside every window)`; 68 s |
| shots | rc 0, 677 s (the foreground call ran past its timeout; polled by PID); 592 files, 0 FAIL; `button host-leak OK (161 … 966 …)`, modal 228 comparisons / 38 kinds, input 15 kinds / 176, checkbox 7 kinds / 116, prose 106 [212] |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |
Tree clean after all gates.

## Drive-by fixes:
- None beyond the folded items (the `livePreviewScrollHold.ts` comment clause is part of the HIGH-1 comment update).

## Follow-ups:
- The fresh-worktree jest count (6281 / 2 skipped) was not re-measured this round (cached CSS present).
- Not re-run on this head, carried from r1/r2: the no-callout-mark bundle for G-S62 (a)/(b)/(e), and the eaf64ba6 bundle for (g)/(h) (those phases did not exist at r1; (g) and (h) were measured red on the `8f672965` bundle, which already contained the r1 fix).
- Scratch lifecycle-harness copies need a sibling `scripts/` directory since SC-546 (noted in the proposal).

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r3-fix-report.md`
- Proposal: `…/sc540-r3-dse-verify-proposal.md`
- Screenshot: `…/sc540-r3-head-advance-round-callout-card.png`
- Evidence: `…/sc540-r3-evidence/` (`lc-g62-head3.log`, `lc-g62-prev.log`, `lc-g62-mutreading.log`, `p3-*.log`/`.png`, `gate-*.log`, `jest-*.log`, `probe3.mjs.txt`, `run3.sh`)
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r3-impl-a1/` (bundles `head3`, `prev`, `mutreading`)
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source`

# SC-545 r7: scoped re-review of r6 (dse 09ece2eb on ea78ebf8, superproject 586c82ef)

## Executive summary
- **Verdict: LAND-READY.** Findings: HIGH 0, MEDIUM 0, LOW 0, INFO 3 (two are proposal wording only).
- Measured on 09ece2eb:
  - tsc, `tsc -p e2e` and lint: rc 0.
  - jest: **6415 passed / 1 skipped / 254 of 255 suites**.
  - lifecycle `G-S57 G-S61 G-S63` run once: **3/3 ok**, 248 s, port 9550.
  - G-S61 (e): 0 stale frames; G-S63 (b): "raw fence in the embed while off: 0 (no rebuild allowed)", 0 rebuilds.
- Mutant K (any DSE card in a Live Preview embed triggers the fallback), on HEAD's own source:
  - jest: **1 failed / 31 passed**. The failing test is the new embed twin ("an OWNED DSE card in a Live Preview embed does not trigger it …").
  - G-S63: **FAIL (b)**, "the fallback ran (1 setViewData(.., true) call(s))", 66 s. That is the r5 MEDIUM-1 fixed.
- SC-547 interplay: no problem. `remountReused.ts` differs from ea78ebf8 only by `mount` being public. `ReadingModeBlockHost.ts` is unchanged. Neither the remount path nor `remountReattached` reads or writes a `PassMemo`.
- Proposal: its numbers match r6's logs, and the five-part layout is right. Two wording slips (INFO-2, INFO-3).

## Item 1: r6 delta
- **G-S63 (b)** (`visual-harness/obsidian-lifecycle.mjs`, `offOn`'s new `whileOff` hook): it samples `.internal-embed pre > code[class*="language-ds-"]` in the host editor once, at the end of the 800 ms off dwell, just before `enablePlugin`. One rebuild is allowed only if that count is above 0; otherwise `rebuilds` must be 0.
  - Moment: right. r4's own sampler saw the raw fence appear about 110 ms after disable and stay through enable. My r5 sampler (15-20 ms steps) never saw a raw fence come and go within the off window. So a fence that appears in the window is still there at 800 ms.
  - Could it miss a real raw fence and then fail wrongly? Only if Obsidian made the embed raw in the few ms between the sample and `enablePlugin`. After enable it cannot go raw, because the processors are registered in the same synchronous `onload` as `run()`, before the fallback runs.
  - Could it see a spurious one and let mutant K through? The fixture has one embed holding one DSE fence. A raw match therefore means the real raw case, where one rebuild is the legitimate count, so K adds nothing it could hide behind. K passes only on such a raw run, which happened 0 times in r5's 18 toggles, and the r6 and r7 runs showed raw 0 as well.
  - Non-vacuous: measured here (mutant K FAILs (b)).
- **Jest embed twin** (`test/dom/framework/replugRemount.test.ts`, new test after the callout case). It covers owned, unowned, deferred and nested cards, expects `setViewData` calls of [0, 1, 0, 0], and `rebuilt === ['Note.md']`. Mutant K fails it.
- **LOW-2** (`src/framework/host/replugRemount.ts:196-200`): `dispose()` now re-marks every in-flight element; `remountWithin` still skips a detached one. Its jest case is "…CodeMirror has taken the widget off the page meanwhile: the element is marked again". Correct.
- **LOW-1 wording:** the architecture row and proposal now say "seen at SC-545 r4, not reproduced in r5's 18 toggles, trigger not identified". Accurate.

## Item 2: SC-547 interplay
- `git diff ea78ebf8..HEAD -- src/framework/host/remountReused.ts src/framework/host/ReadingModeBlockHost.ts`: the only change is `private async mount` becoming `async mount` (`remountReused.ts:57`).
- `PassMemo` is built fresh inside `reconcile()` (`remountReused.ts:~103-109`, `...newPassMemo()`), used synchronously in its loop over `registry.liveEntries()`, and dropped when the pass ends. `mount` neither takes nor touches a memo.
- In the editor update listener, `replug.remountReattached(update.view.dom)` runs first (`livePreviewReconcile.ts:34`) and only starts async mounts. The `reconcile` pass that follows sees only views that are already registered, and its memo is built from that same update's `view.state.doc`. A remount cannot read a stale memo: no memo outlives its pass, and the remount path never reads one.
- Real Obsidian: G-S57 ok (2/3 callouts, form Save, two blocks per callout, nested, far apart, title click) and G-S61 ok, on HEAD (`sc545-r7-gate-gs57-gs61-gs63.log`). The r5 probes P20 (off-page twins after off/on) and P13 (quick twin clicks after off/on) covered the overlapping behaviour before SC-547. SC-547 did not change that path's inputs, so I did not re-run them (bounded scope).

## Item 3: proposal (`sc545-dse-verify-proposal.md`)
- It matches r6's logs:
  - jest 6415 / 1 / 254 of 255 (`sc545-r6-gate-jest*.log`).
  - lifecycle 21 + 16 + 8 + 4 + 1 = 50 at 182 / 322 / 305 / 296 / 167 s (`sc545-r6-gate-lifecycle-part1..5.log`, all GATE-RC=0).
  - e2e 128/128, 89/89.
  - shots: 592 `ok …png` lines, 0 FAIL, button host-leak 161 kinds / 966 comparisons, modal 228.
  - freeze 280/280; parity 0 / 0 / 24.
- Layout: part 3 = `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63`, G-S63 last; part 4 = `G-S57 G-S62 G-S61 G-S56`, G-S56 last, unchanged; part 5 = `G-S59` alone. Base `ea78ebf8`.

## INFO
- INFO-1: in `--only=G-S57,G-S61,G-S63` the harness runs G-S63 first, because it follows file order and G-S63 sits before G-S57. That is as designed; in the real part 3 G-S63 is last.
- INFO-2 (proposal §1b): the replacement text gives part 3 as `(8; 302 s)`, but the next line says "measured 305 s at SC-545 r6". Use 305 s in the replacement, or say "302-305 s".
- INFO-3 (proposal §2 CURRENT block): "Numbers as measured by the SC-545 **r4** implementer on branch head `09ece2eb`" should read r6. The "fresh worktree 6414 / 2" figure is inferred, not measured: r6 ran fresh with the CSS cache present and got 6415 / 1. That matches the dse-verify convention but is worth a word.

## Evidence (all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/`)
- `sc545-r7-gate-tsc-lint.log`, `sc545-r7-gate-jest.log`, `sc545-r7-gate-gs57-gs61-gs63.log`
- Mutant K on HEAD source: `sc545-r7-mutK-jest.log`, `sc545-r7-gs63-mutK.log`; mutant definitions `sc545-r7-mutants.py.txt` (K = the insertion at the top of `hasUndrawnBlocks`' loop)
- Scratch (bundle `bundle-mutK`, sha b9c688d0…, exported source `src-mutK`): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r7-review-x7m2/`
- Tree: plugin `git status --porcelain` is empty; the superproject shows ` M draw-steel-elements` (pointer not bumped), as found. I removed only my own kept dir, `/tmp/dse-obsidian-lifecycle-TpPcLz` (the mutant K FAIL).

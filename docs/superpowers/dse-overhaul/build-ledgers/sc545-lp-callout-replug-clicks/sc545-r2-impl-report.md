# SC-545 r2 implementation report

## Executive summary
- **DONE.** Fix AB implemented on dse base `711f740d` (rebased from `f7c9c7ce` per the dispatcher update; SC-544's `flushPendingWrites` and the `onunload` stash coexist: the stash runs in `ViewRegistry.onunload`, after every view has unloaded and flushed).
- Plugin branch `sc545-lp-callout-replug-clicks`, HEAD **`1d655b8f`** (4 commits over `711f740d`: fix `5d64cdd3`, jest `be3365f4`, lifecycle `ce497314`, docs `1d655b8f`). Superproject commit **`c590a35b`** (CHANGELOG bullet only; the submodule pointer is NOT bumped).
- Gates at HEAD: tsc, `tsc -p e2e`, lint clean; jest **6327 passed / 1 skipped / 252 of 253 suites** (after shots; 6326 / 2 fresh; +20 tests, +1 suite); lifecycle **49/49 = 21 + 16 + 8 + 4**; e2e **128/128, 0 failed, coverage 89/89**; shots 592, 0 FAIL, host-leak 161/966; freeze **280/280**; parity **0 GAPs / 0 undeclared / 24 DECLARED**.
- Red/green: G-S63 **FAILS on a `711f740d` bundle** (phases a-f; g passes) and **PASSES on HEAD** (58 s alone, 312 s as part 3 with the other 7).
- Mutants: 8 run; every one is caught by jest (1-4: 3, 6, 5, 5 failures; 5-8: 1-2 failures) and 1-4 by G-S63 (1-3: a-e,g "fallback ran"; 4: phase f).
- Fallback scroll shift (pending write at disable, callout mid-note, tall note): **0 px** with the pixel restore (scrollTop 2559 -> 2559, card top 482 -> 482); **476 px** without it (2559 -> 2083, card top 482 -> 958, mutant 5).
- Deviations from the rulings: none. Placement follows the owner's later ruling (G-S63 at the end of part 3, four parts), not the brief's "part 2". 20 jest tests instead of ~12 (one per stated behavior).
- Drive-by fixes: none. Follow-ups: 4 (below).

## What changed (dse, `draw-steel-elements/`)
- `src/framework/host/replugRemount.ts` (new). Stash: `stashForReplug(entries)` writes `{ v: 1, ctx, alias, body }` under the key **`__dseReplugV1`** plus `data-dse-replug="1"` on the element of each live, connected card inside `.markdown-source-view` and `.cm-embed-block.cm-callout` or `.internal-embed`. The cross-version contract is documented in a comment at the key: versioned key, only Obsidian-owned objects (`ctx`, the element) and plain data (alias, body), never a reference into the old instance; `readReplugStash` validates the version, alias, body and the context's `sourcePath` / `addChild` / `getSectionInfo`, and a mismatch drops the mark and leaves the card to the fallback. `ReplugRemounter.run()` remounts each marked element (`replaceChildren()` then `ReusedElementRemounter.mount` with the widget's real ctx), awaits all draws, then runs the fallback: a markdown view that still has a raw `pre > code.language-ds-*` or an unowned (not in `registry.liveEntries()`), non-nested, non-`deferred` DSE root inside a callout/embed widget gets `setViewData(getViewData(), true)` + `setEphemeralState`, then the pixel `scrollTop` is put back at once and after two frames. `dispose()` (plugin unload): a run that has not started does nothing; a draw still in flight re-marks its element so the next instance redraws it; the fallback does not run.
- `viewRegistry.ts`: `onunload` calls `stashForReplug(this.entries)` before clearing. `remountReused.ts`: `mount` is public. `registerFrameworkElements.ts`: builds the `ReplugRemounter`, `plugin.register(() => replug.dispose())`, `workspace.onLayoutReady(() => void replug.run())`.
- Old click shield: its listeners are on the old root (`armClickShield(root)`), a child of the widget element, so `replaceChildren()` removes the root and the listeners with it. Verified in jest (old root `isConnected` false, one child in the element) and in G-S63 (tagged roots out of the document, new roots owned, + writes).
- Rapid off/on/off: jest pins it (draw in flight at dispose: the element is re-marked, the fallback does not run; the third instance redraws a single owned card; dispose before layout-ready: nothing happens and the marks stay).
- Test mock: `FakeWorkspace.onLayoutReady` / `layoutReady` / `__fireLayoutReady` added to `test/mocks/obsidian-core.ts` (real semantics: callback at once when the layout is ready). The core mock is shared with `visual-harness/shim/obsidian.ts`.
- Docs: `.repo-docs/architecture.md` (host table row + one paragraph). CHANGELOG bullet in the superproject worktree.

## Tests
- `test/dom/framework/replugRemount.test.ts`, 20 tests: stash marks a card in an LP callout and in an embed (2), only the contents the contract allows, skips Reading view / code-block widget / detached / null body; shape validation (wrong version, empty alias, non-string body, ctx without `addChild`, null ctx); remount mounts once per mark with the stashed ctx/alias/body and clears the mark; second run mounts nothing; skips a detached element and an unknown alias; a stash with a wrong shape is ignored and the note is left to the fallback; the normal path does not call `setViewData` (asserted twice: unit and the full off/on wiring); dispose before layout-ready; off/on/off with a draw in flight; fallback on a raw fence in a callout and in an embed (2), unowned vs owned/nested/deferred, ignored cases, pixel scroll restore; full wiring: unload stashes, layout-ready redraws a fresh owned root and its + writes; off, on, off, on; `ViewRegistry.onunload` stashes before clearing.
- Lifecycle G-S63 in `visual-harness/obsidian-lifecycle.mjs`, phases (a)-(g) as ruled. Every phase: real + first, tag, `disablePlugin`/`enablePlugin`, poll until the tagged cards are out of the document and the same number are drawn and owned by the live registry, real + writes (+1) and the card shows the note, no page error, no Notice; the fallback counted by a hook on the markdown view class's `setViewData` (`clear === true` only) and asserted 0 in a-e and g. Fixtures `Lifecycle/replug-*.md` (5 notes; `twin-callouts.md` reused). Uses `waitFor` polls; fixed sleeps only for the off dwell (800 ms) and settles.

## Gate numbers (all logs in this dir, `sc545-r2-gate-*.log`)
| Gate | Result |
|---|---|
| tsc + `-p e2e` | clean (rc 0) |
| lint | clean (rc 0) |
| jest (fresh) | 6326 passed / 2 skipped / 252 of 253 suites |
| jest (after shots) | **6327 passed / 1 skipped / 252 of 253 suites**, 0 failed (expected 6307 + 20) |
| lifecycle part 1 (port 9545) | 21/21, 187 s |
| lifecycle part 2 (9546) | 16/16, 328 s |
| lifecycle part 3 (9548) | 8/8, 312 s (G-S63 is the last) |
| lifecycle part 4 (9549) | 4/4, 294 s (G-S56 last) |
| e2e | `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`, 65 s |
| shots | 592 PNGs, 0 FAIL, host-copy pin OK, button host-leak 161 kinds / 966, modal 228 |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` (no frozen byte moved) |
| parity | 0 gaps, 0 undeclared, 24 declared |

## Red / green (G-S63)
- Red, `711f740d` bundle (git archive of that commit, esbuild production, main.js sha256 `1bb51153...`), `sc545-r2-red-gs63-711f740d.log`: FAIL, 110 s. (a) card still the pre-disable DOM, owned by no live view, + wrote nothing (disk [6] -> [6]); (b) same for the embed; (c) twin callouts: 2 of 2 stale, no write ([6,5] unchanged); (d) stale, the real click opens no Stamina modal; (e) stale, no write (scrollTop 2519 -> 2519 and 522 -> 522, since nothing was redrawn); (f) after enable 0 cards drawn (raw code), "no visible element to click"; (g) passes (plain fence redrawn by Obsidian, owned, Reading view + writes). Page errors/notices: none.
- Green, HEAD: `sc545-r2-green-gs63-alone.log` (58 s) and inside part 3 (`sc545-r2-gate-lifecycle-part3.log`): ok. Numbers: tagged = out of the document = drawn = owned in every phase, rebuilds 0 in a-e and g, (f) rebuilds 1 (the fallback, as expected), (a) disk [7], (c) [6,5] -> [6,6] -> [7,6] -> [7,7], (d) modal opened, (e) scrollTop 2519 -> 2519, card top 522 -> 522, (f) [7] then [8], (g) plain fence redrawn + Reading view [6,5].

## Mutants (source mutated in the worktree, built, reverted with `git checkout -- src`; worktree clean after each)
| # | Mutant | jest `replugRemount.test.ts` | G-S63 |
|---|---|---|---|
| 1 | no `stashForReplug` call in `onunload` | 3 fail (the two wiring tests, "onunload stashes") | FAIL a-e, g: "the fallback ran (1 setViewData)" (clicks still write: the fallback heals) |
| 2 | no remount (stash never read) | 6 fail | FAIL a-e, g (same message) |
| 3 | fallback fires always | 5 fail | FAIL a-e, g (same message) |
| 4 | fallback never fires | 5 fail | FAIL f only ("0 cards drawn, 1 before") |
| 5 | no pixel scroll restore | 1 fail (scroll restore) | not gated; probe: 2559 -> 2083 |
| 6 | dispose does not re-mark an in-flight draw | 2 fail | (jest only) |
| 7 | reader trusts any stash | 2 fail (shape validation) | (jest only) |
| 8 | stash without the widget filter | 1 fail (skips Reading view / code-block widget) | (jest only) |
Logs: `sc545-r2-mut-<n>-jest.log`, `sc545-r2-mut-<1..4>-gs63.log`.

## Fallback scroll shift (best effort, not a gate)
Probe `e-pending-mid` (r1 probe tooling, copied to my scratch): a callout in the middle of a tall note, a real + then a plugin disable within 30 ms, enable; the fallback fired once (`svClear=1`). With the restore: scrollTop **2559 -> 2559**, card top **482 -> 482** (0 px), cursor unchanged (`sc545-r2-probe-run2-green-pendingmid*.log/.json`). Without the restore (mutant 5): scrollTop **2559 -> 2083**, card top **482 -> 958** (476 px; `sc545-r2-probe-run3-mut5-noscrollrestore*`), matching r1's B prototype (2571 -> 2083). G-S63 (e) under mutant 1 (the fallback doing all the work) also kept 2519 -> 2519 and 522 -> 522. Undo history of a rebuilt note is lost, as ruled.

## Evidence
- Deciding screenshot: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-r2-lp-callout-after-off-on-plus-click-writes-7.png` (LP callout card after off/on and a real + click: shows 7, disk [6] -> [7]; from `sc545-r2-probe-run1-green-r545.json`).
- Logs in the same dir: `sc545-r2-gate-{tsc,lint,jest,jest-after-shots,lifecycle-part1..4,e2e,shots,freeze,parity}.log`, `sc545-r2-red-gs63-711f740d.log`, `sc545-r2-green-gs63-alone.log` (= `-run1.log`), `sc545-r2-mut-*`, `sc545-r2-probe-*`, `sc545-r2-pre-tsc.log`.
- Proposal: `sc545-dse-verify-proposal.md` (four parts, 48 -> 49, part 3 7 -> 8, G-S63 description, footguns, CURRENT block).
- Scratch (mine): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r2-impl-w1/` (bundles `bundle-red711`, `bundle-green1`, `bundle-mut1..5`, scripts, probe copy).

## Drive-by fixes:
None.

## Follow-ups:
1. A write that is pending when the plugin is turned off still goes through the fallback (the note changes under the callout while no processor exists, so Obsidian builds raw code there); that costs the note's undo history. A way to avoid it would be to flush before the unload's stash or redraw the callout from the stash after the write; left alone (ruled as accepted).
2. Hover popovers and canvas Live Preview cards are not covered (they are not markdown leaves; r1 noted this).
3. The jest mock `FakeWorkspace.onLayoutReady` is new (`test/mocks/obsidian-core.ts`); any test that wants the "layout not ready yet" case uses `workspace.layoutReady = false` + `__fireLayoutReady()`.
4. The lifecycle header comments and `SCENARIOS` list will conflict textually with whatever else lands in `obsidian-lifecycle.mjs` (SC-472 G-S59, SC-551); resolve at landing, G-S63 stays before G-S57 in the file and last in part 3.

Housekeeping: I deleted only the 5 `/tmp/dse-obsidian-lifecycle-*` kept-FAIL dirs my own red/mutant runs created. Other agents' dirs in `/tmp` were not touched.

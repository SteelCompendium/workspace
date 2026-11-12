# SC-589 r3 implementation report

**Executive summary**
- Verdict: DONE. All four r2 items folded (MEDIUM-1 wording, LOW-1 code, LOW-2, INFO Q07). `origin/develop` still `e0e49d4d`, no rebase.
- Branch `sc589-malice-quickadd-lost-on-rebuild`. dse head `853f3f18` (4 commits over r1's `d12e4675`: `97f20b77` fix, `a3ee43d4` jest, `c0cedef0` e2e + fixture, `853f3f18` dse CHANGELOG). Superproject `f8796a1f` (CHANGELOG only; pointer bump left unstaged). Nothing pushed.
- Gates: tsc + lint clean · jest 7326 passed / 2 skipped (r1: 7323; +3) · lifecycle 56/56 (21+16+9+4+6) · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (r1: 271/275; +INIT-M11) · `styles.css` sha256 still `5e5ff488...2b27` (checked after the e2e build and after the lifecycle builds), so shots / freeze / parity carry.
- Red first: the two new Q15 cases fail on r1 code (jest `2 failed, 169 passed`); e2e INIT-M11 fails on r1 code (focus on `<body>`, caret lost).
- Sidebar IS reachable in e2e cheaply (script pinning, as `sidebar-unpin-focus.e2e.ts` does), so the LOW-1 e2e case exists.

## Changes

**LOW-1 (code), `src/elements/initiative/view.ts` `update()` (~155-172).** `outside = model !== this.model && !this.resetRebuild`. When outside: `captureControlFocus(this.rootEl, FOCUS_FAMILIES)` before `super.update(model)` and `restoreControlFocus(...)` after. The caret comes back through the existing draft restore, so it works on this path too. Restore is a no-op when focus was outside the tracker (SC-588's never-pull-focus rule holds; pinned by Q16). `rebuildAndPersist` calls `update(this.model)` (same model, not "outside"), and `rebuildFromWrittenReset` calls `update(fresh)` with a different model but restores focus itself once `inert` is lifted, so a private `resetRebuild` flag (set around that one call, cleared in `finally`) keeps this wrapper out of its way. Without the flag the wrapper would try to focus inside the `inert` root.

**LOW-2.** The stored caret is `{field, start, end}` only (`direction` removed from the type, the capture and the `setSelectionRange` call); the comment says why. Q12 asserts `[start, end]` = `[2, 5]` only.

**INFO Q07.** Retitled to `a rebuild from outside (update() called with another model, as the sidebar's refresh does) keeps the draft`.

**MEDIUM-1 wording.** Both CHANGELOG entries now read "in Reading view and in the pinned sidebar tracker", mention the sidebar keeping your place in a box on an outside change, and end "In Live Preview the boxes are still emptied when the note saves a moment later (SC-605)". Files: `draw-steel-elements/CHANGELOG.md` (7.0.0 list) and the worktree superproject `/home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild/CHANGELOG.md`. SC-605 / SC-602 / SC-603 untouched.

## Tests added
- jest (`test/dom/elements/initiative-matrix.test.ts`, `[Q]` group): `[Q15]` x2 (outside refresh with the label box focused: rebuilt box holds focus, selection `[2,5]`, draft kept; outside refresh with Advance round focused: focus goes to the rebuilt button) and `[Q16]` (outside refresh never takes focus: elsewhere stays elsewhere, none stays `<body>`). A small local helper `outside()` reaches the view through `host.addChild`, as Q07 does. Red on r1 code: `jest-matrix-RED.log` = `2 failed, 169 passed` (both Q15); Q16 passes on r1 by design (it pins the unchanged rule). Green: `jest-matrix-green.log` = 171/171.
- e2e: `e2e/specs/initiative/malice-sidebar.e2e.ts`, `[INIT-M11] an outside change to the note keeps the draft, the focus and the caret of the sidebar tracker`: pins the tracker in the sidebar by script (fixture `e2e/vaults/shipped/Sidebar/initiative-pinned.md`, anchor `sbin01`), types `7` / `Feytouched`, focuses the label with `ytou` selected, `dse.externalEdit` Malice 3 to 8, waits for `Malice: 8`, then asserts amounts, focus on `init.malice.quickadd.label` inside `.dse-sidebar`, selection `[2, 6]`, and the label not in the note. Manifest row `M11` added to the label control. Red on r1 code: `e2e-M11-RED.log` (`ctl: null`, `inSidebar: false`); green: `e2e-M11-green.log` (1/1 ok).

## Gate lines
- tsc `rc=0` (incl. e2e), lint `rc=0`.
- jest (fresh, `rm -f main.js styles.css` first): `Test Suites: 1 skipped, 263 passed, 263 of 264 total` / `Tests: 2 skipped, 7326 passed, 7328 total`, `jest rc=0`.
- e2e: `OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, `e2e rc=0`.
- lifecycle: `21/21`, `16/16`, `9/9`, `4/4`, `6/6` = 56/56, each `lc rc=0`; parts run one after another (the tool backgrounded each after 180 s; a PID wait on this worktree's own process, no overlap).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` (unchanged, no CSS touched): shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280, parity 0/0/24 carried, not re-run.

Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r3-impl/`: `jest-full.log`, `jest-matrix-RED.log`, `jest-matrix-green.log`, `e2e-full.log`, `e2e-M11-RED.log`, `e2e-M11-green.log`, `lc-1.log` ... `lc-5.log`, `tsc.log`, `lint.log`, `r3-src.patch`.

## Drive-by fixes:
none.

## Follow-ups:
- dse-verify CURRENT entry needs 272/276 at land (dispatcher bookkeeping, as the owner noted).
- Superproject worktree shows `draw-steel-elements` modified (pointer to `853f3f18`), unstaged for the land step.

# SC-478 r2 implement report

## Executive summary
- **dse head `b17b3cd`** on base `54f8f88` (origin/develop at the final run; rebased 772c3cd -> 8d075db -> 95981f1 -> 8d890f9 -> 54f8f88). 3 commits: `088450f` fix (prototype + G-S18), `778eac1` fix (file-identity fold + header), `b17b3cd` test. **Superproject head `f980513`** on origin/main `46ae296` (1 commit: CHANGELOG). Pointer ` M draw-steel-elements` left unstaged. Nothing pushed.
- Final battery on 54f8f88, all measured: tsc (+e2e) rc 0; lint rc 0; jest **5617 passed / 1 skipped / 235 of 236 suites** (5601 base + 16 new); lifecycle **32/32 ok, 0 failed**; e2e **95/98 ok, 0 failed, 3 known-bug, coverage 66/66**; shots 580, 0 FAIL, `text scale OK (1626 …)`, `text scale once OK (104184 comparisons over 208 loads …)`; freeze **280/280**; parity **0 gaps / 0 undeclared / 24 declared**.
- Discrimination (`--only=G-S8,G-S15,G-S18`, 2 runs each, base 54f8f88): base bundle G-S18 FAIL 2/2; head 3/3 ok 2/2; control "restore never dispatched" G-S18 FAIL 2/2; control "no hold" G-S18 FAIL 2/2 (G-S8, G-S15 ok in all).
- File-identity measurement: a different file loaded into a Live Preview leaf is the SAME MarkdownView and SAME EditorView: `onLoadFile` -> `setViewData(data, clear=true)` -> `EditorView.setState(newState)`. No doc-changing transaction; every ViewPlugin is destroyed and re-created, so `destroy -> forget` already dropped the capture (present before, absent after, 5/5 navigations). The new explicit path guard covers a future `set`-transaction navigation.
- Mutation check: 15 guard removals, each turned at least one test red (table below).
- One flake: the first e2e on 8d075db read 71/91 with 16 "did not run" (four WDIO before-all hook timeouts at 45 s, machine load); the immediate rerun and every later run read green. Environment, not code.

## Fold 1: capture identity
Probe: `/tmp/.../sc478-r2-a8b4aaae43f31a06f/probe-nav.mjs.txt` (injected temporarily, not committed); result JSON `sc478-r2-NAV-head0-nav.json` and `sc478-r2-NAV-expose-nav.json` (the second used a temporary bundle exposing the hold instance on `window` so `captures.get(cm)` could be read; the source edit was reverted, `git status` clean).
Methods tried, Lifecycle/tall.md scrolled inside the tracker, to SC478/two.md (tracker), SC478/plain2.md (plain): `leaf.openFile`, `leaf.setViewState`, `workspace.openLinkText`, history back. Measured for all: same `leaf.view`, same `view.editor.cm`; order `onUnloadFile` -> `onLoadFile` (view.file already the new path) -> `setViewData(…, clear=true)` -> `EditorView.setState` (`cm.setState` seen, 26 plugins re-created) -> two update calls with effects only (`docChanged:false`, `userEvent ''`); scrollTop reset to 0. With the capture triggered by a manual `vault.trigger('modify', tall)`: `captures.get(cm)` true before setState, false after, 5/5.
Guard written to match: `Capture` records `path` and `owner` (the MarkdownView); `onUpdate` drops the capture (after consuming it) if `owner.file?.path !== path`; a view with no file is never captured. No TTL on the capture. The existing `destroy -> forget` is the measured path; the path check is defence in depth and is tested separately from it.

## Fold 2: mutation check (file `src/framework/host/livePreviewScrollHold.ts`, jest file `test/dom/framework/livePreviewScrollHold.test.ts`; script `mutate.py`, log `sc478-r2-mutation-check.log`; source restored from the script's saved copy, `git status` clean)
| guard | mutation | test that went red |
|---|---|---|
| user-scroll drop | removed the `scrollTop` within 1 px check | "the user wins: a scroll between the capture and the transaction drops the restore" |
| non-set: only `set` engages | removed the every-`isUserEvent('set')` return | "never engages on the user's own edit…" and "one update that carries a set AND a user transaction…" |
| non-set: consumed by first doc change | removed `captures.delete(view)` in onUpdate | "never engages on the user's own edit…" and "a capture belongs to one note…" |
| path filter | dropped `file.path !== path` | "captureViewsOf captures only Live Preview/Source views of that path" |
| mode filter | dropped `getMode() !== 'source'` | same test |
| no-DSE skip | removed `!widgets.length` return | "does not capture at the top, or a view without a drawn DSE widget" |
| at-top skip | removed `scrollTop <= 0` return | same test |
| hold release on mount | MutationObserver release made a no-op | "holds the replacement widget … released on mount" |
| hold release TTL | per-hold timer removed | "a hold that never sees a mount is released after PIN_TTL_MS; releaseAll() drops the rest" |
| pending-entry expiry | pending timer body removed | "a block drawn after PIN_TTL_MS is not held" (new) |
| releaseAll | body emptied | "a hold that never sees a mount…; releaseAll() drops the rest" |
| destroy releases holds | `forget` no longer releases | "destroy drops a pending restore and releases a live hold" (new) |
| destroy drops capture | `forget` no longer deletes the capture | "destroy (… setState …) drops the capture" (new) |
| file-identity guard | removed the path check in onUpdate | "a capture belongs to one note…" and "a leaf that shows no file…" (new) |
| file-identity: needs a file | removed `if (!path) return` | "a leaf that shows no file…" |

Suite: 9 prototype tests re-signed for `capture(view, owner)` + 7 new = 16.

## Deviations from the prototype
- `capture(view, owner)` takes the owning view (file identity); `Capture` gained `path`/`owner`. The prototype's jest tests were updated for it.
- Lifecycle merge: G-S14 (SC-457) kept whole; G-S18 is its own block after it. Header line for G-S18 reworded (G-S14 is no longer reserved).
- `livePreviewScrollHold.ts` header: added the file-load measurement and the accepted `userEvent "set"` dependency; reworded the stray "Needs nothing" sentence ("Not touched: …"). `previewScrollPin.ts` "Not covered (SC-478)" line became a pointer; `PIN_TTL_MS` exported, value unchanged.
- CHANGELOG bullet added under `## Unreleased`, right after SC-470's.
- Four rebases onto moving develop; no conflicts after the first (lifecycle file).

## Proposed text for the workspace `dse-verify/SKILL.md` (not edited)
Step 4 expect cell: replace the start with
`OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` and append to the id list: `…, SC-470 G-S15, SC-478 G-S18 — a Live Preview pane keeps its reading position when a tracker in it is redrawn (another pane, a popout, its own click, an outside write); G-S16 reserved for SC-471`. (Keep "~4.5 min"; G-S18 adds about 40 s.)
Lifecycle-gate paragraph, after the G-S14 entry:
> `G-S18` (SC-478: Live Preview scroll hold — `Lifecycle/tall.md` with a Live Preview pane parked 1500 px into the tracker; phases (a) another pane's DSE write, (b1) in-app `vault.process`, (b2) a write on disk via the file watcher, (c) the pane's own write. Per phase: write landed; anti-vacuity (the parked tracker root left the document); scrollTop identical in every frame and the same top line + offset; tracker drawn again at its old height; `data-dse-lp-hold` seen then released; selection unmoved. FAILs on the base bundle (3020 -> 2556, line 63 -> 160/285) and with the named control **"restore never dispatched"** (the `view.dispatch({ effects: restore })` call replaced by a no-op); the second control "no hold" (`applyHolds` returns at once) also FAILs. Build controls as temporary bundle variants and run them with `DSE_LIFECYCLE_BUNDLE`.)

CURRENT block numbers at this head: jest 5617 / 1 / 235 of 236, lifecycle 32/32, e2e 95/98 3 known-bug 66/66, shots 580, freeze 280/280, parity 0/0/24.

## Drive-by fixes
None.

## Follow-ups
- The G-S15 header comment in `visual-harness/obsidian-lifecycle.mjs` still says "G-S14 is reserved for SC-457" (stale; G-S14 landed). Left alone.
- Under heavy machine load (1-min load 20+) `npm run e2e` can time out four WDIO before-all hooks (45 s) and read 71/91; rerun when load is lower. Not a code issue.
- `npm run shots` takes over 10 minutes on this host, longer than the 10-minute foreground tool limit; I ran it detached and blocked on its PID.

## Artifacts (absolute paths)
Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`: this report; `sc478-r2-mutation-check.log`; `sc478-r2-NAV-head0-nav.json`, `sc478-r2-NAV-expose-nav.json`, `sc478-r2-nav-head0.log`, `sc478-r2-nav-expose.log`; `sc478-r2-disc{1,2}-{base,proto,proto-norestore,proto-nohold}.log`, `sc478-r2-disc-summary.log`; `sc478-r2-build.log`.
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r2-a8b4aaae43f31a06f/`: final gate logs `gate-{tsc7,lint7,jest7,lifecycle7,e2e7,shots7,parity7}.log` (+ `.rc`), `probe-nav.mjs.txt`, `mutate.py`, `bundles/{base,proto,proto-norestore,proto-nohold}`.

# SC-282 round 3 — fix-round report (implementer identity A, resumed)

## Executive summary

- Status: **DONE**. All 3 FOLD items from the r2 scoped re-review closed: LOW-A (loaded-leaf
  skip now pinned by a test), LOW-B (write failures now logged, not silently swallowed),
  LOW-C (stable `blockKey` now pinned by a test). Nothing else touched.
- Base unchanged: `origin/develop` still `c524fd2` (confirmed via `git fetch`, no rebase).
- LOW-B: `view.ts`'s `flushPersist` `.catch` now `console.error`s the failure before
  resolving waiters `false` — restores the one diagnostic LOW-2 (r2) had removed, without
  reintroducing the unhandled rejection LOW-2 existed to fix.
- LOW-A/LOW-C: both are TEST-only additions (the r2 source was already correct) — a new
  test drives `registerDseSidebar` with a loaded view to pin the plugin-listener's
  loaded-leaf skip, and a 3-line addition to an existing rename test pins the stable
  session key. Both mutations the reviewer identified (loaded-leaf skip removed, key
  rebuilt live) now **fail** — verified live, logs kept, both reverted.
- Gates (head `6c4f6aa`): tsc/lint clean; jest **3997 passed / 1 skipped / 3998 total, 206
  of 207 suites** (net **+1** over r2's 3996 — LOW-A's new test; LOW-C extended an existing
  test, no count change; 0 regressions, no flake); obsidian-lifecycle **6/6 ok, 0 failed**;
  shots **524, 0 FAIL**; freeze **260/260 byte-identical, 0 frozen bytes moved**; parity
  **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0**.

## Scope (from the ticket-owner's message, ruling the re-review's 3 LOW findings FOLD)

1. LOW-A — commit probe Q1 as a test so removing the loaded-leaf skip
   (`registration.ts:136`) fails the suite; prove it with that mutation.
2. LOW-B — the `.catch` in `view.ts:308-310` swallows every write failure; add a
   `console.error` (keep resolving waiters `false`).
3. LOW-C — a short assertion that the sidebar `blockKey` is unchanged across a rename
   (`SidebarBlockHost.ts:156`); prove reverting to the live-path key fails it.

Nothing else in scope. Out of scope: INFO-1/2/3 (no action, per the review), SC-354 (not
touched).

## Per-finding: what changed

### LOW-B — write failure now logged

**File:line:** `src/framework/view.ts`, `flushPersist`'s `.catch` (~line 308, after r2's
addition). Added `console.error('Draw Steel Elements: block write failed', error)` as the
first statement in the catch handler, before resolving every coalesced `persist()` waiter
with `false` (unchanged from r2). Matches the message shape already used by this file's own
callers (`elements/montage/view.ts`'s `'Draw Steel Elements: montage write failed'`,
`framework/seams/theme.ts`/`seams/prefs.ts`'s own `console.error` calls) — no new pattern
introduced. Not separately unit-tested this round: the re-review's own probe Q7 (EACCES,
silent) was record-only, not committed, and adding a dedicated test wasn't in the FOLD list
(only LOW-A and LOW-C named a test); `console.error` output isn't asserted by
`sidebarRename.test.ts`'s existing suite either way, so this fix is verified by direct
reading of the diff and by the shape-matching precedent above, not a new automated check.

### LOW-A — the loaded-leaf skip is now pinned by a test

**File:line:** `test/dom/framework/sidebarRename.test.ts`, new test `'LOW-A: a LOADED
sidebar leaf (registered via registerDseSidebar) is skipped by the plugin-level listener —
one save, root kept, no double-apply'` (adapted from the re-review's probe Q1). Calls
`registerDseSidebar(plugin as any, services)` (every other test in this file calls
`plugin.registerView` directly, which never registers the plugin-level rename/delete pair —
so this is the first committed test that exercises `patchDeferredSidebarLeaves`'s
`if (leaf.view instanceof DseSidebarView) continue;` guard, `registration.ts:136`, together
with an actually-loaded view), opens a real leaf, pins a block, renames the note, and
asserts: exactly one panel (no duplicate from a second, plugin-level patch racing the
view's own listener), exactly one `requestSaveLayout` call (not two), and the mounted
`[data-dse-element="counter"]` root is the SAME DOM node before and after (no double-apply
re-render, which would destroy live element state — an in-progress encounter, a pending
debounce — exactly the thing the whole in-place rename design exists to protect).

**Mutation confirmed:** removed the guard (`// MUTATION LOW-A: loaded-leaf skip removed`,
`registration.ts:136`) → the new test fails on the root-identity assertion (the plugin
listener's own `setState` call on the loaded view triggers `DseSidebarView.setState`, which
tears down and remounts every panel — a fresh DOM node, `toBe(root)` fails). Reverted
(`git checkout HEAD -- src/framework/sidebar/registration.ts`), confirmed clean.

### LOW-C — the stable `blockKey` is now pinned by a test

**File:line:** `test/dom/framework/sidebarRename.test.ts`, the pre-existing first rename
test (`'renaming a pinned note updates...'`) — 3 lines added: captures `panel` from
`view.addPanel(...)`'s return value (previously discarded), reads
`(panel as any).host.blockKey()` before the rename, and asserts it's unchanged after.

**Mutation confirmed:** reverted `SidebarBlockHost.blockKey()` to rebuild live from
`` `${this.backingFile.path}::${this.alias}::${this.anchorId}` `` instead of returning the
captured `sessionKey` (`SidebarBlockHost.ts:358`, `// MUTATION LOW-C: live path`) → the new
assertion fails (`"Note.md::ds-counter::aaa111"` expected, `"Renamed.md::ds-counter::aaa111"`
received). Reverted, confirmed clean (also re-ran `sidebarBlockHost.test.ts` alongside — its
own unrelated `blockKey` test still passes unchanged).

## Mutations re-verified

| Mutation | File:line | Result | Log |
|---|---|---|---|
| Loaded-leaf skip removed | `registration.ts:136` | **LOW-A test fails** (root identity) | `sc282-r3-mutation-noloadedskip.log` |
| `blockKey()` reverted to live path | `SidebarBlockHost.ts:358` | **LOW-C assertion fails** (key drifted) | `sc282-r3-mutation-livekey.log` |

Both applied, confirmed failing, then reverted (`git checkout HEAD -- <file>`; `git status`
clean after each).

## Gates

Base: `origin/develop` `c524fd2` — confirmed unchanged via `git fetch origin` at the start
of this round (no rebase needed). Devbox wrapping / gate-command-last / `rm -f main.js
styles.css` before jest, per `dse-verify`, throughout; every gate run in the foreground.

| Gate | Result | Log |
|---|---|---|
| 1. tsc | clean, exit 0 | `sc282-r3-tsc.log` |
| 2. lint | clean, exit 0 | `sc282-r3-lint.log` |
| 3. jest | **3997 passed / 1 skipped / 3998 total, 206 of 207 suites**, 0 failures. Delta over r2 head (3996/1/3997): **+1** — LOW-A's new test (LOW-C added no new test, only 3 lines to an existing one). No `sidebarEncounterHandoff` flake. | `sc282-r3-jest.log` |
| 4. obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (own Xvfb `:160`, port 9262) | `sc282-r3-obsidian-lifecycle.log` |
| 5. shots | 524 captures, 0 FAIL, every in-run gate OK | `sc282-r3-shots.log` |
| 6. freeze | `freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0 — **0 frozen bytes moved this round** | `sc282-r3-freeze.log` |
| 7. parity (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | `sc282-r3-parity.log` |

## Commits

Branch `sc282-sidebar-rename`, still on `origin/develop` `c524fd2` (no rebase this round).

1. `5dd14e4` — `fix(sidebar): SC-282 r3 (LOW-B) — log a block write failure instead of swallowing it silently`
2. `6c4f6aa` — `test(sidebar): SC-282 r3 (LOW-A, LOW-C) — pin the loaded-leaf skip and the stable blockKey`

Head sha: `6c4f6aa`. Base sha: `c524fd2` (unchanged from r2). No AI/Claude co-author
trailers, per the brief.

Files changed this round:
```
src/framework/view.ts                    | +11 -1  (LOW-B: console.error in flushPersist's .catch)
test/dom/framework/sidebarRename.test.ts | +44 -1  (LOW-A new test; LOW-C 3-line addition)
```

## Drive-by fixes

None.

## Follow-ups

None new this round. Carried from r2 (unchanged, still valid): the optional RN-4
real-Obsidian lifecycle scenario (reviewer's proven scenario ready to port if wanted as
permanent coverage), and SC-354 (pre-existing `modify`-listener leak, filed separately, not
touched).

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r3-fix-report.md`
- Ledger read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/decisions.md`
- Re-review read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r2-rereview-report.md`
- Gate logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/`):
  - `sc282-r3-tsc.log`, `sc282-r3-lint.log`
  - `sc282-r3-jest.log` (3997/1/3998)
  - `sc282-r3-obsidian-lifecycle.log` (6/6 ok)
  - `sc282-r3-shots.log` (524, 0 FAIL)
  - `sc282-r3-freeze.log` (260/260)
  - `sc282-r3-parity.log` (0/0/16)
  - `sc282-r3-mutation-noloadedskip.log`, `sc282-r3-mutation-livekey.log`
- Changed files (worktree `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename/draw-steel-elements`):
  - `src/framework/view.ts`
  - `test/dom/framework/sidebarRename.test.ts`

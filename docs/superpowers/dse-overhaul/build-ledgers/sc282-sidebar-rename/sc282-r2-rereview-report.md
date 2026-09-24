# SC-282 r2 scoped re-review (reviewer identity B)

## Executive summary

- **Verdict: LAND.** All six folded findings (MEDIUM-1, MEDIUM-2, LOW-1, LOW-2, LOW-3, INFO-5) are fixed. No BLOCKER, HIGH or MEDIUM findings. Counts: LOW 3, INFO 3. None of the findings needs another review round.
- **MEDIUM-1, proven in real Obsidian 1.14.2 with no manual patch (RN-4).** Rename on a deferred leaf: the state becomes `Dfr/y.md`, the leaf stays deferred, and both `getLayout()` and the on-disk `workspace.json` carry the new path. Revealing the leaf mounts the counter. Delete on a deferred leaf: `panels: []`, the leaf stays deferred, and revealing it shows the empty state. 0 errors.
- **No double-apply.** In real Obsidian, RN-1 keeps the loaded panel's root with the plugin listener live. In jest, Q1 gives 1 save and the same root. The mixed loaded + deferred case gives 1 `setState` and 2 saves (Q2). A folder rename with 3 child events gives 1 `setState` and 1 save (Q3), so there is no save storm.
- **Mutations.** The r1 survivors (delete-side prefix, no rebind) now fail. Three mutations survive, which is the reason for the LOW findings:
  - removing the loaded-leaf skip (**LOW-A**; my probe shows it would re-render loaded panels and destroy live state)
  - reverting the stable key (**LOW-C**)
  - removing the `.catch` (covered by RN-3 in real Obsidian)
- **LOW-B:** the new `.catch` swallows every write failure without a trace. With EACCES, the panel shows 4, the disk keeps 3, and nothing is logged.
- **Gates at head `6898b84`:** tsc and lint clean. jest 3996 passed / 1 skipped / 3997, 206 of 207 suites. Lifecycle 6/6. Shots 524, 0 FAIL. Freeze 260/260. Parity 0 / 0 / 16. All match the fix report. The tree is clean.

## Folded findings: verification

| r1 finding | Status | Evidence |
|---|---|---|
| MEDIUM-1 deferred leaves | **FIXED** | `registration.ts:60-79` (plugin-scoped pair) and `:133-155` (`patchDeferredSidebarLeaves`). Real Obsidian RN-4, parts A and B above (`sc282-r2-rereview-obsidian-probe.log`). The `noplugin` mutation (listener pair removed) fails 2 tests. |
| MEDIUM-2 test gaps | **FIXED** | P1, P2, P4 and P6 are in `sidebarRename.test.ts`. The `delprefix` mutation now fails 1 test (P6); r1 had 0 failures. The `norebind` mutation now fails 1 test (P2); r1 had 0 failures. |
| LOW-1 blockKey drift | **FIXED, unpinned** | `SidebarBlockHost.ts:156` captures the key once. Probe Q6: the key is unchanged across a rename, and two panels on one note get distinct keys. Reverting it (`livekey` mutation) fails 0 tests → LOW-C. |
| LOW-2 unhandled rejection | **FIXED, over-broad** | `view.ts:302-311`. Real Obsidian RN-3 (a pending write, then trash): errors `[]`. In r1 the same scenario gave 1 ENOENT rejection. The catch also hides real failures → LOW-B. |
| LOW-3 comment | **FIXED** | `SidebarPanel.ts:125-139` is now accurate, matching the RN-2 event order. |
| INFO-5 CHANGELOG | **FIXED** | `CHANGELOG.md:34-37` names background and collapsed tabs. That claim is now true (RN-4). |

## Findings

### LOW-A — The loaded-leaf skip carries weight but no committed test covers it
- **Where:** `src/framework/sidebar/registration.ts:136`, `if (leaf.view instanceof DseSidebarView) continue;`.
- **Failure scenario:** a later refactor drops or weakens this guard, for example by switching to an `isDeferred` check that some build doesn't have. The plugin listener fires *before* the view's own listener, because it was registered at plugin load. It would then call `DseSidebarView.setState` on a loaded view, which tears down and remounts every panel. That destroys live element state: an in-progress encounter or initiative, or a pending debounce.
- **Proof:** with the guard removed, the full committed suite still passes (`sc282-r2-rereview-mutation-noloadedskip.log`: 24/24). My probes Q1 and Q2 fail on the root-identity assertion (`…-noloadedskip-probes.log`). No committed test calls `registerDseSidebar` together with a *loaded* view.
- **Fix:** add probe Q1 to `sidebarRename.test.ts`: call `registerDseSidebar`, open a real view, pin, rename, then assert the same `[data-dse-element]` root and a save delta of exactly 1. It is about 15 lines; the source is in `sc282-r2-rereview-probe-jest.test.ts.txt`.

### LOW-B — The LOW-2 catch now swallows every write failure, with no log and no user signal
- **Where:** `src/framework/view.ts:308-310`.
- **Failure scenario (probe Q7):** `vault.process` rejects with EACCES, or EBUSY on Windows from a sync lock, or a full disk. `persist()` resolves `false`, nothing reaches `console.error` or `console.warn`, and there is no unhandled rejection. The panel shows 4 while the disk keeps 3, so the edit is silently lost.
- **What changed:** before r2, the same failure at least left a console stack trace (an unhandled rejection). The callers' own `try/catch` + `console.error` wrappers (`montage/view.ts:445-449`, `initiative/view.ts:161-166`, `negotiation/view.ts:121-126`) never fire, because `persist()` resolves instead of rejecting. The fix removed the only diagnostic.
- **Fix:** one line: `.catch((error) => { console.error('Draw Steel Elements: block write failed', error); for (const resolve of waiters) resolve(false); })`. The expected ENOENT after a note is deleted will then log once, which is acceptable. You could optionally skip the log when `!this.cx.host.canPersist` or the error is ENOENT. A user-facing Notice for a real I/O failure would be a separate ticket.

### LOW-C — The LOW-1 stable key has no committed test
- **Where:** `src/framework/host/SidebarBlockHost.ts:156` and `:358-360`.
- **Failure scenario:** a revert to the live path (the `livekey` mutation) passes the full `sidebarRename` and `sidebarBlockHost` suites (24/24). Session state would split again after a rename.
- **Fix:** add a 3-line assertion to an existing rename test: `host.blockKey()` is unchanged across `fireRename`. Probe Q6 shows the shape.

### INFO-1 — Consequences of the stable key (acceptable, but know them)
Probe Q6:
- A re-pin of the renamed block in a *second* leaf gets `R.md::ds-counter::aaa111`, while the original panel keeps `Note.md::…`. Two panels for the same block now keep separate session state (collapse, tabs), where before the rename they would have shared it.
- A new note created at the *old* path that holds a *copied* `_dse_anchor` gets the same key as the renamed panel (`equal=true`).

Both are cosmetic, in-memory only, and contrived. No action.

### INFO-2 — Narrow race while a deferred leaf is loading
`DeferredView.rerender()` reads `this.state` when it calls `leaf.setViewState`. If a rename fires after that read and before the real view's `onOpen` registers its listener, neither listener applies it: the plugin listener sees the leaf as `working` or not yet `DseSidebarView`, and the patch lands on a DeferredView that is already being discarded. The panel then shows "Note not found", and the SC-184 dismiss button is the fallback. The window is a few milliseconds during the reveal click. No action.

### INFO-3 — `patchDeferredSidebarLeaves` uses reference identity for "unchanged"
Where: `registration.ts:142-148`. The code is correct because both callers return the input object when nothing changes. A future caller that returns an equal copy would cause a `setState` and a save on every vault rename. It is documented in the function's doc comment. No action.

## Probes run

**Jest scratch suite** (7 probes). Source: `sc282-r2-rereview-probe-jest.test.ts.txt`. Log: `sc282-r2-rereview-probes.log`. All 7 pass at head.

| # | Probe | Result |
|---|---|---|
| Q1 | Loaded leaf with the plugin listener: rename | Root kept, 1 save |
| Q2 | Loaded leaf plus deferred stand-in | Both follow; root kept; 1 `setState`; saves = 2 |
| Q3 | Folder rename plus 3 child events (real order) on a deferred leaf, then an unrelated rename | 1 `setState`, 1 save; the unrelated rename adds 0 |
| Q4 | Deferred folder delete | Prefix sibling and the strict-body `body` field are kept; extra state keys are kept |
| Q5 | Deferred leaf with undefined state | No throw, no save |
| Q6 | Stable-key behaviour | See LOW-C and INFO-1 |
| Q7 | EACCES write failure | Silent; see LOW-B |

**Real Obsidian 1.14.2 scratch harness** (private Xvfb `:160`, port 9263). Source: `sc282-r2-rereview-probe-obsidian.mjs.txt`. Log: `sc282-r2-rereview-obsidian-probe.log`. Result: 4/4 ok.

| # | Probe | Result |
|---|---|---|
| RN-1 | Rename a pinned note | Unchanged from r1, and now with the plugin listener live: root kept, write lands, no ghost file |
| RN-2 | Folder rename | Folder event first, then children |
| RN-3 | Delete with a write pending | Errors `[]` (r1: 1 ENOENT) |
| RN-4 | Deferred leaf, rename then delete | Fixed with no manual patch (see summary) |

**Mutations.** Each was reverted, and `git status` was clean after each.

| Mutation | Result | Log |
|---|---|---|
| `delprefix` | 1 fail | `sc282-r2-rereview-mutation-delprefix.log` |
| `norebind` | 1 fail | `sc282-r2-rereview-mutation-norebind.log` |
| `noplugin` | 2 fail | `sc282-r2-rereview-mutation-noplugin.log` |
| `noloadedskip` | **0 fail** (Q1/Q2 fail) | `sc282-r2-rereview-mutation-noloadedskip.log`, `…-noloadedskip-probes.log` |
| `livekey` | **0 fail** | `sc282-r2-rereview-mutation-livekey.log` |
| `nocatch` | 0 fail (RN-3 covers it in real Obsidian) | `sc282-r2-rereview-mutation-nocatch.log` |

## Gates (reviewer re-run, head `6898b84`, base `c524fd2`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc282-r2-rereview-tsc.log` |
| lint | clean, exit 0 | `sc282-r2-rereview-lint.log` |
| jest | 3996 passed / 1 skipped / 3997; 206 of 207 suites; exit 0 | `sc282-r2-rereview-jest.log` |
| obsidian-lifecycle | 6/6 ok (`:160`, port 9262) | `sc282-r2-rereview-obsidian-lifecycle.log` |
| shots | 524, 0 FAIL | `sc282-r2-rereview-shots.log` |
| freeze | `freeze OK (260/260 …)`, exit 0 | `sc282-r2-rereview-freeze.log` |
| parity (last) | 0 gap(s), 0 undeclared, 16 declared, exit 0 | `sc282-r2-rereview-parity.log` |

**Tree state.** `git status --porcelain` was empty before and after, and HEAD is still `6898b84`. The probe files were removed from the worktree and their copies kept in the ledger dir. No harness temp dirs are left over. SC-354 was not touched.

## Recommendation

LAND. LOW-A (one test), LOW-B (one line) and LOW-C (three lines) together take about 20 minutes. They can go in before landing as a single commit without another review round, or be filed as one backlog ticket. If the owner folds them, I recommend doing LOW-B before landing: it is the only one that affects users, since it removes the only write-failure diagnostic.

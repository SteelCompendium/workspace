# SC-282 r1 — independent adversarial review (reviewer identity B)

## Executive summary

- **Verdict: FIX-FIRST** (a small round). No BLOCKER, no HIGH. Counts: MEDIUM 2, LOW 3, INFO 6.
- Reviewed DSE `c524fd2..72e9cdb` in worktree `sc282-sidebar-rename`. The core behavior works in **real Obsidian 1.14.2**. Checked in a scratch real-Obsidian harness: after a rename, the panel state, header, `getLayout()` and the on-disk `workspace.json` all carry the new path. The element root is kept. A write lands in the renamed note, with no ghost file and the prose intact, and the panel still tracks direct edits to the renamed note. A folder rename works, and the sibling `F/BarBaz.md` is untouched. Deleting a note or a folder removes its panel.
- **MEDIUM-1 (fold in): deferred leaves.** The ticket's bug still reproduces in real Obsidian when the DSE tab is in the background. The stale path goes into `workspace.json`, and revealing the tab shows `Note not found: Dfr/x.md`. This is common, because at startup Obsidian defers every background or collapsed sidebar tab. **A cheap fix exists and I proved it works in real Obsidian:** public `leaf.view.setState(patched)` on the DeferredView stores the new path, the leaf stays deferred, the layout serializes the new path, and on reveal the panel mounts correctly. Size S, about 35 lines of source plus 2 tests.
- **MEDIUM-2: test gaps.** The suite is not vacuous: removing the listener fails 7/7. But nothing tests write-back after a rename (the property the brief calls key). Test 2 models the folder-rename event order backwards compared with real Obsidian. The delete-side prefix guard and `rebindPath` both survive mutation.
- LOW: blockKey drift on rename; an unhandled ENOENT rejection on delete while a write is pending (confirmed in real Obsidian; the same class exists before this change); a wrong comment at SidebarPanel.ts:125-128.
- Gates (mine): tsc/lint clean · jest 3990 / 1 skipped / 3991, 206 of 207 suites · lifecycle 6/6 · shots 524, 0 FAIL · freeze 260/260 · parity 0 / 0 / 16. All match the implementer. Worktree left clean.

## Owner decisions vs code

- **D1** (ledger: "rewritten… the panel re-renders against the new file… layout is saved"). The rewrite and save match: `DseSidebarView.ts:139-151` → `SidebarPanel.ts:120-130`, then `requestSaveLayout`. **Deviation:** there is no re-render. The update happens in place. I recommend ratifying this (INFO-1). Real Obsidian RN-1 shows that writes and external-edit tracking both work without a re-render, and that live element state is kept.
- **D2** (a delete removes the panel and saves the layout): `DseSidebarView.ts:160-164` goes through the existing `removePanel`, which saves. Matches. The consequence is covered in INFO-4.
- **D3** (the `registerEvent(vault.on…)` shape): matches, but the listener is registered on the view (`DseSidebarView.ts:124-127`), not the plugin. Teardown is real. Obsidian's `View.close()` calls `unload()` and then `onClose()` (app.js 1.14.2). That scoping is also why the deferred-leaf gap exists (MEDIUM-1).
- **D4** (no visual change): freeze is 260/260 and parity is unchanged.

## Findings

### MEDIUM-1 — A deferred sidebar leaf never follows a rename or delete, and the stale state persists across restarts
- **Where:** `src/framework/sidebar/DseSidebarView.ts:92-96` and `:118-127`. The listeners live only on a loaded `DseSidebarView`.
- **Failure scenario (real Obsidian, RN-4 part A):**
  1. The DSE leaf is a background tab in the right sidebar and is deferred (`isDeferred: true`).
  2. Rename `Dfr/x.md` to `Dfr/y.md`.
  3. `leaf.view.getState()` still says `Dfr/x.md`, and `getLayout()` still serializes `Dfr/x.md`, so it is written to `workspace.json` and survives a restart.
  4. On reveal, the panel shows `data-dse-sidebar-unavailable="true"` and "Note not found: Dfr/x.md". This is exactly the ticket's bug.
- **How common:** common. In app.js 1.14.2, `WorkspaceLeaf.setViewState` builds a `DeferredView` (QI) instead of the real view when the incoming state has an icon and title (which serialized layout state always has) and `!containerEl.isShown()`. At startup that covers every sidebar tab that is not selected, and every tab in a collapsed sidebar. `openSidebarView` puts DSE in a new right-sidebar tab (`registration.ts:95`) next to the core tabs, so any restart where the user last looked at another right tab, or collapsed the sidebar, defers it until clicked. `getLeavesOfType` includes deferred leaves, because `QI.getViewType()` returns the real type.
- **Implementer's claim:** "No documented Obsidian API rewrites a deferred leaf's state without loading it." This is **incorrect**. `View.setState` is public, and on a DeferredView it only stores the state: `QI.setState = (e) => { this.state = e }`. `getViewState()` then serializes it. RN-4 part B, in real Obsidian: patched with `leaf.view.setState(..., {history:false})` → `stillDeferred: true`, `layoutHasNew: true` → reveal → `state: Dfr/z.md`, counter mounted, not unavailable.
- **Prescribed fix (fold into the fix round, size S):** add a plugin-scoped listener pair in `registerDseSidebar` (`registration.ts`, via `plugin.registerEvent`, which is D3's literal shape). Export `renamedPanelPath` and `isUnderDeletedPath` from `DseSidebarView.ts`.
  ```ts
  function patchUnloadedSidebarLeaves(app: App, rewrite: (p: SidebarPanelState) => SidebarPanelState | null /*drop*/): void {
    let changed = false;
    for (const leaf of app.workspace.getLeavesOfType(VIEW_TYPE_DSE_SIDEBAR)) {
      if (leaf.view instanceof DseSidebarView) continue;          // loaded: its own listener handles it
      const st = (leaf.view.getState() ?? {}) as Partial<DseSidebarState>;
      const before = st.panels ?? [];
      const after = before.map(rewrite).filter((p): p is SidebarPanelState => p !== null);
      if (after.length === before.length && after.every((p, i) => p.filePath === before[i].filePath)) continue;
      void leaf.view.setState({ ...st, panels: after }, { history: false });
      changed = true;
    }
    if (changed) app.workspace.requestSaveLayout();
  }
  // rename: p => { const n = renamedPanelPath(p.filePath, file, oldPath); return n === null ? p : { ...p, filePath: n }; }
  // delete: p => isUnderDeletedPath(p.filePath, file) ? null : p
  ```
  Tests: two jest tests using a DeferredView stand-in (`{ getViewType, getState, setState }` on a leaf, as in my probe P13), one for rename and one for delete. Optionally add a lifecycle scenario based on my RN-4 (it builds the deferred leaf with `createLeafInParent` and `selectTab(other)`, then calls `setViewState({type, state, icon, title})`, which is the same code path as startup). Also update the comment at `DseSidebarView.ts:118-122` and the CHANGELOG line.

### MEDIUM-2 — The new suite misses the key write-back property, models folder-rename order backwards, and leaves two guards unpinned
- **Where:** `test/dom/framework/sidebarRename.test.ts`.
- **Mutation results** (logs `sc282-r1-review-mutation-*.log`):
  - listener removed: 7/7 fail. Good, the suite is not vacuous.
  - bare `startsWith` on the rename side (`DseSidebarView.ts:375`): 1 fails. Good.
  - bare `startsWith(file.path)` on the delete side (`:386`): **7/7 pass.** The guard is unpinned, because test 4's sibling `Other.md` shares no prefix with `Folder`.
  - `rebindPath` call deleted (`SidebarPanel.ts:129`): **7/7 pass.** The mock preserves TFile identity, so the rebind is a no-op in every test. My probe P2 (the vault hands back a fresh TFile) does fail under this mutation.
- **Write-back missing:** no test clicks a control after a rename and asserts where the write landed. This is the thing a user loses if a regression makes the host keep an old path. It passes today (my probes P1, P3, P9, and real Obsidian RN-1/RN-2), but nothing guards it.
- **Backwards event order:** test 2 (`:138-140`) mutates the child TFile *before* firing the folder event. Real Obsidian does the opposite. RN-2 recorded `[["F/Qux","F/Bar","folder"],["F/Qux/n.md","F/Bar/n.md","file"]]`: the folder event fires while the child's path and `fileMap` key are still old, and `getAbstractFileByPath(newChildPath)` returns null at that moment.
- **Fix:** add three tests, lifted from my probe file:
  - **P1:** rename, click, write lands at the new path, the old path is absent, the prose is intact, and a direct edit to the new note is tracked.
  - **P4:** real order (folder event first, child TFile still old, then the child event), then click and write.
  - **P6:** folder delete of `Foo/Bar` spares `Foo/BarBaz.md`.

  Optionally add P2 (a non-identity rename) to pin `rebindPath`.

### LOW-1 — `SidebarBlockHost.blockKey()` changes on rename, which splits the session-store state
- **Where:** `src/framework/host/SidebarBlockHost.ts:344-346`, which returns `${this.backingFile.path}::…`.
- **Failure scenario:** probe P11 shows `Note.md::ds-counter::aaa111` becomes `Renamed.md::ds-counter::aaa111`. Some consumers capture the key at mount (chrome collapse `pipeline.ts:603`, tabs/collapsible persist objects, montage `montage/view.ts:83`, negotiation/hero/initiative tab persist) and keep writing under the old key. Others read it live (`roll/view.ts:84-85`) and lose their last-roll state after a rename. After the next remount (fallback remount or a restart of the view), captured state such as chrome collapse and the selected tab resets. The data is in-memory only, so the impact is cosmetic.
- **Fix:** make the sidebar key independent of the path. Capture it once in the constructor, e.g. `private readonly key = \`${backingFile.path}::${alias}::${anchorId}\``. The anchor is durable identity already. Alternatively, key it on `anchorId` alone when it is non-null.

### LOW-2 — Deleting a note while a write is pending throws an unhandled ENOENT rejection
- **Where:** `src/framework/view.ts:291-293` (`void this.cx.host.replaceSource(yaml).then(...)`, with no catch), reached from `DseSidebarView.ts:162` → `removePanel` → unload → `flushPersist` → `SidebarBlockHost.replaceSource` → `vault.process` on the deleted file.
- **Failure scenario (real Obsidian RN-3):** click `+`, then trash the note within 400 ms. The panel is removed correctly and no ghost file appears. Then `rejection: Error: ENOENT: no such file or directory, open '…/D/del.md'` goes to the console, and the persist waiters never resolve. The same class exists at base: at `c524fd2`, the pending write fires 400 ms after the delete and rejects the same way (`sc282-r1-review-probes-at-base.log`). D2 just makes the unload flush the trigger.
- **Fix:** `.catch(() => false)` before `.then` in `flushPersist` (resolve the waiters with `false`), or wrap `vault.process` in `SidebarBlockHost.replaceSource` in try/catch and return `false`. You can also file this separately.

### LOW-3 — The comment at `SidebarPanel.ts:125-128` is wrong about when the lookup misses
- **Where:** `SidebarPanel.ts:124-129`.
- **Problem:** the comment says a `getAbstractFileByPath(newPath)` miss is "not expected in practice". In real Obsidian it is the normal case for **every folder rename**, because the folder event fires before the child's `fileMap` entry is re-keyed (RN-2).
- **Why it still works:** Obsidian keeps TFile identity, and the next child event mutates the same TFile's `.path`. The header meanwhile uses the path-derived basename, which is correct. So `rebindPath` is dead code in real Obsidian (defensive only).
- **Fix:** correct the comment. Optionally, when the event's `file` is a `TFile` (direct rename), pass it straight through instead of re-resolving.

### INFO-1 — D1 says "re-renders"; the code updates in place
The in-place update is the better choice. It keeps live state and the root element (RN-1 checks `rootSame`, and probe P1 checks it too). The cost is the path captured at render time: LOW-1, and INFO-2 below. **Owner: amend D1 in the ledger to ratify it.**

### INFO-2 — `MarkdownRenderer.render(..., host.sourcePath, ...)` captures sourcePath at render time
Where: `src/framework/view.ts:234`. Markdown rendered inside an element resolves ambiguous or relative links against the old path until the next re-render. The impact is negligible. No action.

### INFO-3 — Leaked `modify` listener (pre-existing, not SC-282)
Two back-to-back `setState` calls while a mount is in flight leak one vault `modify` listener (`SidebarBlockHost.ts:226-235`). The listener registers on an owner that is already unloaded. Probe P8b shows it at head and also with src reverted to `c524fd2`. SC-282's own listeners do not leak: 4 open/close cycles plus a double `setState` still give rename=1, delete=1 while open and 0 after close (P8). **File separately.** Fix: have `SidebarPanel.mount` check that the panel is still loaded after `await host.refresh()`, and dispose the host's registration if it is not.

### INFO-4 — D2 consequence: sync and git flows can permanently remove pins
An external delete-then-recreate now permanently removes the pin. Examples: switching a git branch where the note is absent, or a sync client's delete/restore. Before this change, a panel could recover through the host's path-based `modify` listener. The owner chose this deliberately in D2; I note it for awareness only.

### INFO-5 — CHANGELOG overclaims
`CHANGELOG.md:30-34` says the panel follows "instead of turning into a permanent Note not found card". That is not true for deferred leaves until MEDIUM-1 is fixed. Adjust it with the fix.

### INFO-6 — The shared main checkout's DSE submodule is dirty, and not from this review
`workspace/draw-steel-elements` has changes in `demo-vault/Welcome.md` and `justfile`, plus untracked `compendium-manifest.json` and `demo-vault/montage 1.md`. All have mtime 2026-09-24 08:01:12, which is before this review was dispatched (brief 08:17). I did not touch them. Flagging because `deploy*` aborts on a dirty tree.

## Probes run

**Jest scratch suite (14 probes).** Source: `sc282-r1-review-probe-jest.test.ts.txt`. Log: `sc282-r1-review-probes.log`.

| # | Probe | Result |
|---|---|---|
| P1 | Rename → click → write lands in `Sub/Renamed.md`; old path absent; prose intact; `modifyCalls` only at the new path; external edit to the renamed note → panel shows 42 | PASS |
| P2 | Rename where the vault returns a fresh TFile | PASS (FAILS with the `rebindPath` mutation → the only test that pins it) |
| P3 | Write pending (debounce in flight) at rename time → lands at the new path | PASS |
| P4 | Real-Obsidian folder order (folder event first), `Foo/Bar` vs `Foo/BarBaz.md`, then write | PASS, sibling untouched |
| P5 | Nested folder `A/B`→`A/X`; cross-folder move; A→B→A | PASS |
| P6 | Unrelated delete → no change, no save; per-child plus folder delete (idempotent); prefix sibling survives | PASS, exactly 1 save |
| P7 | Delete with a pending write | Panel removed, no ghost; **unhandled rejection** → LOW-2 |
| P8 | 4 open/close cycles plus double `setState` → rename/delete listener count 1 while open, 0 after; `modify` 0 | PASS |
| P8b | Back-to-back `setState` with mount in flight | 1 leaked `modify` listener, also at base → INFO-3 |
| P9 / P10 | Rename during mount (before the priming read resolves) → mounted, state new, write at the new path | PASS |
| P11 | blockKey before and after | Drifts → LOW-1 |
| P12 | "Note not found" panel with host null; unrelated rename, and a rename onto its path | No throw, stays degraded (pre-existing) |
| P13 | DeferredView stand-in | Not patched (confirms the gap in jest) |

**Real Obsidian 1.14.2 scratch harness.** A copy of `obsidian-lifecycle.mjs` with my own fixtures and scenarios; private Xvfb `:160`/`:161`, port 9263. Source: `sc282-r1-review-probe-obsidian.mjs.txt`. Log: `sc282-r1-review-obsidian-probe.log`. Result: 4/4 ok.

| # | Probe | Result |
|---|---|---|
| RN-1 | Rename via `fileManager.renameFile` into a new nested folder | State, header, `getLayout()` and on-disk `workspace.json` carry the new path. Element root identical. Click → `current_value: 11` in the new file with prose intact; no file at the old path. External `vault.process` edit → panel shows 30. 0 errors. |
| RN-2 | Folder rename `F/Bar`→`F/Qux` | Event order recorded (folder first). State correct; write lands at `F/Qux/n.md`; `F/BarBaz.md` untouched; no ghost; 0 errors. |
| RN-3 | Trash a note while a write is pending; trash parent folder `F` | Panels removed; no ghost. Delete-event order `F/BarBaz.md, F/Qux(folder), F/Qux/n.md, F(folder)` (handled by either order). One ENOENT unhandled rejection → LOW-2. |
| RN-4 | Deferred leaf | Part A (control): stale state and layout, then "Note not found" on reveal. Part B: the `View.setState` patch keeps the leaf deferred, the layout carries the new path, and the panel mounts on reveal → MEDIUM-1. |

**Mutations.** Each was reverted, and `git status` was checked after each.

| Mutation | Log | Result |
|---|---|---|
| No listener | `mutation-nolistener` | 7/7 fail |
| Rename-side prefix | `mutation-renprefix` | 1 fail |
| Delete-side prefix | `mutation-delprefix` | 0 fail |
| No rebind | `mutation-norebind` | 0 fail; P2 fails (`mutation-norebind-probes`) |

**Obsidian source evidence.** Extracted from `~/.config/obsidian/obsidian-1.14.2.asar` into the scratchpad (not saved to the sdd dir):
- The adapter's `rename` triggers the folder, then each descendant.
- `TFolder.setPath` is not recursive.
- `View.open` = `load()` then `onOpen()`; `View.close` = `unload()` then `onClose()`.
- `QI` (DeferredView) `setState` only stores the state; `getLeavesOfType` matches `view.getViewType()`.
- The deferral condition is in `setViewState`.
- `Vault.process` → `adapter.process(file.path)` reads first, so ENOENT means no write (no ghost).

## Gates (reviewer re-run, head `72e9cdb`, base `c524fd2`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc282-r1-review-tsc.log` |
| lint | clean, exit 0 | `sc282-r1-review-lint.log` |
| jest | 3990 passed / 1 skipped / 3991; 206 of 207 suites; exit 0. Equals the implementer's count, and base 3983 + 7 new. No `sidebarEncounterHandoff` flake. | `sc282-r1-review-jest.log` |
| obsidian-lifecycle | 6/6 ok, 0 failed (`:160`, port 9262) | `sc282-r1-review-obsidian-lifecycle.log` |
| shots | 524 PNGs, 0 FAIL, all in-run gates OK | `sc282-r1-review-shots.log` |
| freeze | `freeze OK (260/260 …)`, exit 0 | `sc282-r1-review-freeze.log` |
| parity | 0 gap(s), 0 undeclared, 16 declared, exit 0 | `sc282-r1-review-parity.log` |

**Tree state.** `git status --porcelain` in the DSE worktree was empty before and after; HEAD is still `72e9cdb`. The probe files were deleted from the worktree and their copies kept in the sdd dir. The harness temp dirs were removed.

## Recommended fix-round scope (one implementer, S)

1. MEDIUM-1: the plugin-level patch for deferred leaves, plus 2 jest tests. Optionally a lifecycle scenario based on RN-4. Update the comment at `DseSidebarView.ts:118-122` and the CHANGELOG.
2. MEDIUM-2: add P1, P4 and P6 (and optionally P2) to `sidebarRename.test.ts`.
3. LOW-3: fix the comment. LOW-1: a stable sidebar blockKey (3 lines).
4. LOW-2: optional here; otherwise file it with INFO-3 as a backlog item.
5. Owner: amend D1 in the ledger to "follows in place (no re-render)".

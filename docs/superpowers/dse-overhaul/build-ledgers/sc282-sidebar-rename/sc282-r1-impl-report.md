# SC-282 round 1 implementer report

## Executive summary

- Status: **DONE**.
- D1 (rename follows) + D2 (delete removes) + D3 (registerEvent pattern) all implemented in
  `draw-steel-elements`, worktree `sc282-sidebar-rename`, branch `sc282-sidebar-rename`.
- Design: the vault `rename`/`delete` listeners live on `DseSidebarView` (registered in
  `onOpen`, torn down on close via the Component cascade) — not the plugin — so every open
  leaf independently keeps its own panels in sync with no cross-view lookup. A rename never
  touches the mounted element (no re-render, no teardown): only `SidebarPanelState.filePath`,
  the header's note link, and `SidebarBlockHost`'s backing `TFile` are rewritten, so a live
  encounter/initiative panel's in-progress state is never at risk.
- Base moved mid-task: started at `3b25127`, but `origin/develop` advanced to `c524fd2`
  (SC-328) with its own freeze-baseline update (16 Skills print lines) before I finished —
  rebased cleanly (one trivial CHANGELOG conflict) and re-ran the full battery on `c524fd2`.
- Tests: 7 new (`test/dom/framework/sidebarRename.test.ts`), confirmed red-first against the
  unfixed `src/` (7/7 fail), green after. `npm run obsidian-lifecycle` scenario NOT added —
  see "Obsidian-lifecycle harness" below for why.
- Gates (rebased head `72e9cdb`): tsc/lint clean; jest 3990 passed / 1 skipped / 3991 total,
  206 of 207 suites (net **+7**, exactly the new test file, 0 regressions); obsidian-lifecycle
  `6/6 ok, 0 failed`; shots 524, 0 FAIL; freeze `260/260` byte-identical, **0 frozen bytes
  moved**; parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0.
- Drive-by fixes: none. Follow-ups: one (deferred leaves — see below).

## Context

Ticket (verbatim, from the brief):

> The sidebar has no vault rename/delete listeners, so renaming a note that has a pinned
> panel yields a permanent "Note not found" card after restart (the SC-184 fix round adds a
> dismiss button, but the panel should follow the rename automatically). Implementation
> copies an existing vault-listener shape elsewhere in the plugin (~½ day per the round-2
> analysis).

Owner decisions (ledger, `.superpowers/sdd/sc282-sidebar-rename/decisions.md`): D1 rename
follows (rewrite `filePath`, re-render, save layout); D2 delete removes the panel and saves
layout (SC-184's dismiss button stays as the fallback for panels already stale from before
this fix); D3 copy the `plugin.registerEvent(app.vault.on(...))` shape from
`SccResolver.ts`/`CompendiumIndex.ts`; D4 no visual change intended.

## Design

### Where the listener lives: the view, not the plugin

`DseSidebarView.onOpen()` calls a new `registerVaultListeners()`, which registers exactly two
listeners via `this.registerEvent(this.services.app.vault.on('rename'|'delete', ...))` — the
same call shape `SccResolver.registerWatchers`/`CompendiumIndex` use, but scoped to the
`ItemView` Component (torn down automatically on close/unload) rather than the plugin. This
mirrors a precedent already in this exact file area: `SidebarBlockHost`'s own `vault.on
('modify', ...)` listener is registered via `owner.registerEvent(...)` (the owning
`SidebarPanel`), not `plugin.registerEvent`.

Two reasons for view-scoping over plugin-scoping:

1. Every panel a rename/delete needs to reach already lives on `this.panels` — a view-scoped
   listener needs no cross-view lookup. A plugin-scoped listener would have to enumerate
   every open sidebar leaf via `app.workspace.getLeavesOfType` on every vault rename/delete
   for the plugin's entire lifetime, almost all of which have nothing to do with the sidebar.
2. It naturally satisfies "every matching panel in every open DSE sidebar leaf updates"
   (brief item 2): each open leaf's `onOpen` registers its own listener, so N open leaves
   independently update their own panels with zero shared dedupe state to get wrong. Proved
   directly by the "two OPEN sidebar leaves" test below.

### Rename (D1): filePath/header/host rebind only — the mounted element is never touched

`DseSidebarView.handleVaultRename(file, oldPath)` iterates `this.panels`, matches each one via
`renamedPanelPath(panelPath, file, oldPath)` (exact match, or — only for a `TFolder` — a
`oldPath + '/'` prefix match, guarding against a sibling like `Foo/BarBaz.md` under folder
`Foo/Bar`), and calls `SidebarPanel.handleFileRenamed(newPath)` on each match, then one
`requestSaveLayout()` if anything changed.

`SidebarPanel.handleFileRenamed`:
1. Rewrites `this.state.filePath` — the thing `getState()` persists, and the thing
   `DseSidebarView.addPanel`'s `samePanelTarget` dedupe compares. This is why the "two panels
   on one note... rename" test also re-pins the same block afterward: it proves the rewritten
   `filePath` keeps dedupe correctly recognizing the panel post-rename (a stale `filePath`
   here would have reproduced exactly the duplicate-panel bug the brief warns about in item 2).
2. Refreshes the header's note-name link (`updateHeaderNoteLink` — a new `noteLinkEl` field
   captured once at render time; only its text/title/aria-label are re-stamped, not the whole
   header). The link's click handler already reads `state.filePath` live through its closure,
   so it was already correct without any change.
3. If a host is mounted, resolves a **fresh** `TFile` via `vault.getAbstractFileByPath
   (newPath)` and calls the new `SidebarBlockHost.rebindPath(freshFile)` (reassigns the
   private `backingFile` field — no longer `readonly`). Deliberately never assumes the same
   `TFile` object survives the rename (real Obsidian happens to keep identity stable and
   mutate `.path` in place, but relying on that is fragile and untestable without a shared
   mock change); always re-resolves instead.

Nothing here touches `bodyEl`, calls `pipeline.run()`, or removes/re-adds the mounted child —
satisfying brief item 5 ("no in-flight corruption") by construction rather than by a check: a
rename doesn't change the note's *text*, and `rebindPath` doesn't re-read the vault either
(`cachedContent`/`lastWritten`/`anchorLostNotified` all stay exactly as they were), so there is
nothing for the mounted `ElementView` to notice at all. The first test asserts this directly —
the `[data-dse-element="counter"]` root node reference is `===` identical before/after the
rename.

### Delete (D2): reuses the existing, already-idempotent removePanel path

`handleVaultDelete(file)` matches each panel the same way (`isUnderDeletedPath`, delete's
mirror of the rename matcher) and calls the existing `DseSidebarView.removePanel(panel)` for
each — no new removal logic. `removePanel` already requests a layout save and is already safe
to call twice on the same panel (SC-184's own guard), which is exactly what's needed if
Obsidian fires both a folder-level delete and per-child deletes for the same move.

### Folder rename/delete idempotency (brief item 1)

Neither handler uses a guard flag. Idempotency falls out of always comparing against the
panel's **current** `state.filePath`: whichever of a folder-level and a per-child event fires
second finds `state.filePath` already rewritten (or the panel already gone, for delete) and
simply doesn't match its own now-stale `oldPath` — correct regardless of event order. Verified
directly by the "renaming a parent folder" test (constructs both the moved-file rename AND the
folder-level rename, in that order, and asserts the single correct end state) — the two-events-
either-order claim itself isn't separately probed (both my synthetic events fire in one
deterministic order; a second run with the calls swapped was tried manually during
development and behaves identically, per the invariant above, but that manual check wasn't
committed as a second permanent test — the brief called for one test per stated behavior, not
combinatorial event-order coverage).

### Deferred leaves — reported as a follow-up, not fixed (brief item 3)

A deferred `WorkspaceLeaf` (`leaf.isDeferred`, obsidian 1.13.1's `@since 1.7.2`) never runs
`onOpen` — its view is a `DeferredView`, not `DseSidebarView` — so a rename/delete landing
while a sidebar leaf is deferred leaves that leaf's *persisted* panel state stale until the
leaf is next loaded. `WorkspaceLeaf` exposes no documented way to rewrite a deferred leaf's
serialized view state without loading it (`setViewState` is the only write path, and calling
it undefers the leaf) — the brief explicitly says not to force-load a deferred leaf just to
patch this. See Follow-ups below.

## Tests

`test/dom/framework/sidebarRename.test.ts`, 7 tests, against the real
`ElementPipeline`/`ElementRegistry` (ds-counter — the same simplest-persisted-element harness
style as `dseSidebarView.test.ts`):

1. Rename of the pinned note → `filePath` updated, header note link updated, layout save
   requested, mounted element root **unchanged** (`===`), not flagged unavailable.
2. Rename of a parent folder → matching panel's `filePath` rewritten; a sibling file sharing
   only a string prefix (`FolderExtra.md` vs folder `Folder`) is untouched (covers brief's
   "unrelated file / sibling with shared prefix" case in the same test, since both assertions
   come from the same one folder-rename event).
3. Delete of the pinned note → panel removed, layout save requested.
4. Delete of a parent folder → matching panel removed; an unrelated sibling panel survives.
5. Two panels pinned to the same note → both follow a rename; then re-pinning the same block
   at its new path still dedupes onto the existing panel (proves `samePanelTarget` still
   works post-rename).
6. Two OPEN sidebar leaves, each with a panel on the same note → both independently follow a
   rename (validates the view-scoped-listener design directly).
7. The listener is torn down when the leaf closes → firing rename/delete afterward touches
   nothing and doesn't throw.

**Harness notes** (documented in the test file's own header):
- The shared mock's `FakeVault.on()` is a deliberate no-op stub (see `obsidian-core.ts`'s own
  file header) and `Component.registerEvent` is *also* a no-op in the shared mock — so, same
  convention `sidebarInitiative.test.ts`'s `withRealModifyEvents` already established, this
  file locally monkey-patches `app.vault.on` for real 'rename'/'delete' delivery **and**
  `Component.prototype.registerEvent` (module-scoped to this file only — jest isolates
  modules per test file) to sugar over the mock's own already-working `register()`
  cleanup-on-unload path (exactly what `registerDomEvent` already does in that file). Without
  this second patch, test 7 ("listener torn down on close") would pass trivially regardless
  of whether the production code was correct, since the shared mock's `registerEvent` no-ops
  either way — no other sidebar test in the repo currently proves real listener teardown for
  the same reason (`SidebarBlockHost`'s own `modify`-listener teardown isn't asserted either).
- Added `FakeVault.rename(oldPath, newPath): TFile` to the shared mock
  (`test/mocks/obsidian-core.ts`), mirroring the file's existing `setFile`/`getContent`
  "test seeding helper (not part of the Obsidian API)" convention (and `FakeAdapter.rename`'s
  existing shape) — moves content and mutates the **same** `TFile` object in place
  (identity-preserving, like real Obsidian), so a test's `getAbstractFileByPath(newPath)`
  resolves correctly, the same way `SidebarPanel.handleFileRenamed` does in production. This
  is a pure addition (new method only) — no existing method's behavior changed, so no other
  test is affected.

**Red-first confirmation**: `git checkout HEAD~1 -- <the 3 src files>` (temporarily reverting
just the D1/D2/D3 implementation, tests unchanged) → all 7 new tests fail red, each on the
expected assertion (stale `filePath`, panel not removed, listener count 0 instead of 1, etc.)
→ `git checkout HEAD -- <same files>` restored the fix → green again. Not committed as a
separate artifact (no persistent log kept beyond the terminal output at the time), per the
brief's "verify however you like along the way... don't commit scratch checks."

### Obsidian-lifecycle harness (brief: "if cheap, add a scenario; if not, say why")

Not added. `visual-harness/obsidian-lifecycle.mjs`'s 6 scenarios are specifically about the
block **write** lifecycle jest cannot reproduce (real CodeMirror section re-draw/unload,
navigate-away flush timing, unterminated-fence-at-EOF relocation) — the harness's own header
comment says so directly. None of its helpers open the DSE sidebar leaf, pin a block, or drive
a vault rename; building that (a sidebar-opening helper, a pin helper, a real
`app.fileManager.renameFile` driver, DOM assertions against `.dse-sidebar__panel`) would be
new test infrastructure disproportionate to what this specific behavior needs. Unlike the
write-lifecycle gap, nothing about rename/delete event delivery, `TFile` identity, or
`Component` teardown is real-Obsidian-specific in a way jest's mocks can't faithfully model —
they're standard, well-documented Obsidian API contracts (the `.d.ts` signatures I built
against), not implementation-detail-dependent like section redraw. The jest suite already
drives the real `ElementPipeline`/`ElementRegistry`/`SidebarBlockHost` end to end; the one gap
a jest mock genuinely can't prove (real listener teardown) I closed with a targeted local
monkeypatch (test 7) rather than reaching for the much heavier real-Obsidian harness.

## Gates

Base at task start: `origin/develop` `3b25127` (matched the brief exactly, no rebase needed
initially). Mid-task, `origin/develop` advanced to `c524fd2` (SC-328: JSZip→fflate + 3 new
Crafting/Lore skills; the ticket-owner sent an in-session update naming this and the
corresponding freeze-baseline move) — rebased cleanly onto `c524fd2` (one CHANGELOG.md
ordering conflict, resolved by keeping both entries in insertion order) and ran the full
battery again there. All logs below are the `c524fd2`-rebased run unless marked otherwise.

Devbox: `devbox run -- bash -c 'cd .../draw-steel-elements && <cmd>'`, gate command last, no
pipe/tail/echo after it, per `dse-verify`. `rm -f main.js styles.css` before every jest run.

| Gate | Result | Log |
|---|---|---|
| 1. tsc | clean, exit 0 | `sc282-r1-tsc.log` |
| 2. lint | clean, exit 0 | `sc282-r1-lint.log` |
| 3. jest | **3990 passed / 1 skipped / 3991 total, 206 of 207 suites**, 0 failures. New base at `c524fd2` (measured separately in a proper worktree location — see below) is **3983 passed / 1 skipped / 3984 total, 205 of 206 suites**; delta **+7 passed / +7 total / +1 suite**, exactly the new test file, 0 regressions. No flake seen (`sidebarEncounterHandoff.test.ts` was green every run). | `sc282-r1-jest.log` |
| 4. obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (own Xvfb `:160`, own CDP port 9262 — never `:1`) | `sc282-r1-obsidian-lifecycle.log` |
| 5. shots | 524 captures, 0 FAIL (6 "fail"-matching lines are all false positives: the `montage-failed` fixture name and the word "failure" in the montage-track-widths gate's own OK line); every in-run gate OK (host-copy pin, button/input/table/list/inline/checkbox/prose host-leak, print-twin delta, nested corner-radius) | `sc282-r1-shots.log` |
| 6. freeze | `freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0 — **0 frozen bytes moved by SC-282 itself** | `sc282-r1-freeze.log` |
| 7. parity (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | `sc282-r1-parity.log` |

### Base-jest-count methodology note

The brief's stated base (3974/1/3975, 204/205) was for `3b25127`; after the mid-task rebase
the real comparison base is `c524fd2`. I measured it in a **separate scratch git worktree**
(`git worktree add`, `node_modules` symlinked from my own worktree to avoid a second
`npm ci`) to get a clean "before" figure independent of my own changes. That scratch worktree
lived under `/tmp`, which `test/dom/framework/token-coverage.test.ts` doesn't recognize as a
"known layout" (per `dse-verify`'s own documented footgun), so it silently skipped 2 extra
tests there (3 skipped instead of 1) — a location artifact, not a real count. Correcting for
it (the 2 tests would pass, not skip, from a proper worktree location) gives the
3983/1/3984 figure used in the delta above; both the scratch worktree and my own worktree were
removed/left as normal afterward (the scratch one via `git worktree remove --force`).

### Freeze false-alarm (worth recording precisely)

Before the mid-task rebase, running freeze against `3b25127`'s shots reported **16 checksum
mismatches**, all `skills*`/`chrome-skills-menu` `steel-print`/`steel-realprint` pairs — none
of which SC-282 touches (`git diff 3b25127 HEAD --stat` at the time showed only the 6 files
listed under Commits below). This was the stale local baseline: SC-328 had already landed on
`origin/develop` (as `c524fd2`) with its own sanctioned rebaseline of exactly those 16 lines
(3 new Crafting/Lore skills), and my worktree hadn't fetched it yet. Confirmed the cause
before reporting: `git diff` showed zero CSS/skills files touched by my own commits, and after
rebasing onto `c524fd2` the same shots run reports `260/260` clean. No baseline file was
touched by me at any point.

## Commits

Branch `sc282-sidebar-rename`, rebased onto `origin/develop` `c524fd2`.

1. `a5dfabd` — `feat(sidebar): SC-282 — a pinned panel follows a note rename and drops on delete`
   (D1/D2/D3 implementation: `SidebarBlockHost.rebindPath`, `SidebarPanel.handleFileRenamed`
   + header note-link refresh, `DseSidebarView`'s rename/delete listeners + matcher helpers)
2. `72e9cdb` — `test(sidebar): SC-282 — rename/delete vault-listener coverage` (the 7 new
   tests, `FakeVault.rename()`, CHANGELOG entry)

Head sha: `72e9cdb`. No AI/Claude co-author trailers, per the brief.

Files changed (`git diff c524fd2 HEAD --stat`):
```
CHANGELOG.md                             |   5 +
src/framework/host/SidebarBlockHost.ts   |  23 ++-
src/framework/sidebar/DseSidebarView.ts  |  96 +++++++++++-
src/framework/sidebar/SidebarPanel.ts    |  48 ++++++
test/dom/framework/sidebarRename.test.ts | 252 +++++++++++++++++++++++++++++++
test/mocks/obsidian-core.ts              |  18 +++
6 files changed, 439 insertions(+), 3 deletions(-)
```

## Drive-by fixes

None.

## Follow-ups

- **Deferred leaves aren't handled** (brief item 3, and see "Design" above for why): a
  rename/delete landing while a DSE sidebar leaf is deferred (`WorkspaceLeaf.isDeferred`)
  leaves that leaf's persisted panel state stale until the leaf is next loaded, at which
  point it will show the exact "Note not found"/debris state this ticket fixes for the
  non-deferred case, with SC-184's dismiss button as the existing fallback. No documented
  Obsidian API rewrites a deferred leaf's state without loading it, and the brief was
  explicit not to force-load one just to patch this — worth its own ticket if it's worth
  closing, since it would need either an Obsidian API that doesn't currently exist for this
  purpose, or accepting the force-load cost the brief ruled out here.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r1-impl-report.md`
- Ledger read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/decisions.md`
- Gate logs (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/`):
  - `sc282-r1-tsc.log`, `sc282-r1-lint.log` (rebased head)
  - `sc282-r1-tsc-base.log` (pre-rebase sanity check at `3b25127`, superseded)
  - `sc282-r1-jest.log` (rebased head, 3990/1/3991)
  - `sc282-r1-obsidian-lifecycle.log` (rebased head, 6/6 ok)
  - `sc282-r1-shots.log` (rebased head, 524, 0 FAIL)
  - `sc282-r1-freeze.log` (rebased head, 260/260)
  - `sc282-r1-parity.log` (rebased head, 0/0/16)
- Changed files (worktree `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename/draw-steel-elements`):
  - `src/framework/host/SidebarBlockHost.ts`
  - `src/framework/sidebar/DseSidebarView.ts`
  - `src/framework/sidebar/SidebarPanel.ts`
  - `test/dom/framework/sidebarRename.test.ts`
  - `test/mocks/obsidian-core.ts`
  - `CHANGELOG.md`

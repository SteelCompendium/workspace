# SC-282 decisions ledger — DSE sidebar: react to note rename/delete

Worktree: /home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename (branch sc282-sidebar-rename in every submodule)
Repo touched: draw-steel-elements (tracked branch `develop`; never touch `main`; never tag)
Base at start: origin/develop 3b25127 (SC-288 landed)

## Ticket text (Scott, 2026-08-29, verbatim)

> The sidebar has no vault rename/delete listeners, so renaming a note that has a pinned panel
> yields a permanent "Note not found" card after restart (the SC-184 fix round adds a dismiss
> button, but the panel should follow the rename automatically). Implementation copies an
> existing vault-listener shape elsewhere in the plugin (~½ day per the round-2 analysis).

No Scott comments on the thread as of 2026-09-24.

## Owner decisions (ticket-owner, 2026-09-24 — Scott may overrule)

- ~~D1 RENAME: a panel whose note is renamed/moved (including via a parent-folder rename) follows
  it: its persisted `filePath` is rewritten to the new path, the panel re-renders against the
  new file, and the workspace layout is saved so it survives a restart.~~ superseded by D1' (2026-09-24, r1 review INFO-1)
- D1' RENAME: a panel whose note is renamed/moved (including via a parent-folder rename) follows
  it IN PLACE (no re-render — the mounted element and its live state are kept): its persisted
  `filePath`, header link and host backing file are rewritten to the new path, writes land in the
  renamed note, and the workspace layout is saved so it survives a restart. This applies to
  deferred (not-yet-loaded) sidebar leaves too.
- D2 DELETE: a panel whose note is deleted (including via a parent-folder delete) is removed
  from the sidebar automatically, and the layout is saved. Rationale: the pinned block no longer
  exists; a "Note not found" card is exactly the stale state the ticket title asks to eliminate.
  Obsidian's trash-restore recreates the file as a new create event, so there is nothing to
  reattach to. The SC-184 dismiss button stays as the fallback for panels already stale from
  before this fix (e.g. renamed while the plugin was disabled).
- D3 Pattern: copy the existing vault-listener shape (SccResolver.ts:154-156 /
  CompendiumIndex.ts:177-179 — `plugin.registerEvent(app.vault.on(...))`), so listeners are torn
  down on unload.
- D4 No visual change intended → no Scott eye needed unless the freeze check moves (it must not).

## Base moves

- 2026-09-24: origin/develop -> c524fd2 (SC-328: JSZip->fflate, 6.0.2 hotfix merged forward, 3 new skills). Freeze baseline: 16 Skills print lines replaced, still 260; expected `freeze OK (260/260 …)` on c524fd2. npm ci required after rebase. Relayed to r1 implementer mid-round.

## Rounds

- r1 impl (implementer identity A): DSE 72e9cdb on c524fd2 (a5dfabd feat, 72e9cdb test+CHANGELOG). Listeners on DseSidebarView.onOpen; rename rewrites state in place (no re-render). Gates green: jest 3990/1/3991 (206/207 suites, +7), lifecycle 6/6, shots 524/0 FAIL, freeze 260/260, parity 0/0/16. Follow-up: deferred leaves unhandled — ruling pending r1 review's assessment.
- r1 review (reviewer identity B): dispatched 2026-09-24, brief sc282-brief-r1-review.md.

## r1 review rulings (ticket-owner, 2026-09-24) — review verdict FIX-FIRST, 0 BLOCKER / 0 HIGH / 2 MED / 3 LOW / 6 INFO

- MEDIUM-1 (deferred leaves never follow rename/delete; common at startup): FOLD into r2 — plugin-level patch via public `leaf.view.setState` on deferred views, per reviewer sketch.
- MEDIUM-2 (tests miss write-back, folder-event order backwards, delete-prefix + rebindPath unpinned): FOLD — add P1, P4, P6, P2.
- LOW-1 (blockKey changes on rename): FOLD — stable key captured at construction.
- LOW-2 (ENOENT unhandled rejection on delete-while-pending-write): FOLD — catch in flushPersist/replaceSource (one line, D2 makes it trigger).
- LOW-3 (wrong comment SidebarPanel.ts:125-128): FOLD.
- INFO-1: D1 amended to D1' above.
- INFO-2 (MarkdownRenderer sourcePath captured at render): DROP — negligible, next re-render fixes it.
- INFO-3 (pre-existing modify-listener leak): FILED SC-354 (Backlog, related to SC-282). OUT OF SCOPE for r2.
- INFO-4 (D2: external delete-then-recreate, e.g. git branch switch / sync restore, now permanently removes the pin): KEEP D2; mention to Scott in the land-ready comment as a reversible, non-blocking note.
- INFO-5 (CHANGELOG overclaims): FOLD — fix wording with MEDIUM-1.
- INFO-6 (main checkout DSE dirt): DROP — known Scott vault dirt, dispatcher handles.
- Identities: r2 fixer = implementer A (resume); scoped re-review = reviewer B (not an author).

- r2 fix (implementer A): DSE 6898b84 (4181343 fix, 6898b84 test) on c524fd2. jest 3996/1/3997 (206/207), lifecycle 6/6, shots 524/0 FAIL, freeze 260/260, parity 0/0/16. Surviving mutations now fail. No RN-4 lifecycle scenario (optional; accepted — reviewer's real-Obsidian probe re-run in r2 re-review covers it).
- r2 scoped re-review (reviewer B, not an author): dispatched 2026-09-24.
- r2 re-review (B): LAND, 0 B/H/M, 3 LOW, 3 INFO. Rulings (owner, 2026-09-24): FOLD all three into r3 (implementer A) — LOW-A commit probe Q1 as a test pinning the loaded-leaf skip (registration.ts:136); LOW-B console.error in the view.ts:308-310 catch so write failures stay visible; LOW-C 3-line stable-blockKey assertion. INFO items: no action. r3 delta re-review: reviewer B.
- r3 fix (A): DSE 6c4f6aa (5dd14e4 fix, 6c4f6aa test) on c524fd2. jest 3997/1/3998 (206/207), lifecycle 6/6, shots 524/0 FAIL, freeze 260/260, parity 0/0/16. r3 delta re-review (B) dispatched.
- r3 re-review (B): LAND, 0 findings above INFO. Owner: LAND-READY at 6c4f6aa on c524fd2.

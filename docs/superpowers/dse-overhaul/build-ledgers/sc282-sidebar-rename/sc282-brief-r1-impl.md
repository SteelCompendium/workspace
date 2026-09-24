# SC-282 round 1 — implementer brief

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/decisions.md`
  (the effort ledger — owner decisions D1–D4 are your spec).
- Useful prior art (read only what you need): the SC-288 ledger, same sidebar area, just landed:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc288-sidebar-stuck/`
  (decisions.md, sc288-r1-impl-report.md). SC-184's ledger: `.../build-ledgers/sc184-sidebar-investigation/`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename`. Repo:
  `/home/scott/code/steelCompendium/worktrees/sc282-sidebar-rename/draw-steel-elements`, branch
  `sc282-sidebar-rename`. **Verify `pwd` / `git branch --show-current` before any write.** Never
  write anything under `/home/scott/code/steelCompendium/workspace/` except your report files in
  the ledger dir named below.
- First: `git fetch origin && git rebase origin/develop` inside the DSE clone. Expected base:
  `origin/develop` = `3b25127` (if it has moved, rebase onto the new tip and report the sha).
  DSE tracks `develop`; never touch `main`; **never create a tag**.
- **You never call the tracker (Linear)** — not to read, not to post.
- Read `draw-steel-elements/AGENTS.md` (or CLAUDE.md) and the `dse-verify` skill at
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` before running gates.

## 2. The task

The DSE sidebar (`src/framework/sidebar/` — `DseSidebarView.ts`, `SidebarPanel.ts`,
`registration.ts`) has no vault rename/delete listeners. Each panel persists `filePath` in view
state; `SidebarPanel.ts:110-112` renders `Note not found: <path>` when that path is gone. Ticket
text (Scott, verbatim):

> The sidebar has no vault rename/delete listeners, so renaming a note that has a pinned panel
> yields a permanent "Note not found" card after restart (the SC-184 fix round adds a dismiss
> button, but the panel should follow the rename automatically). Implementation copies an
> existing vault-listener shape elsewhere in the plugin (~½ day per the round-2 analysis).

Implement owner decisions D1–D3 from the ledger (quoted):

> - D1 RENAME: a panel whose note is renamed/moved (including via a parent-folder rename) follows
>   it: its persisted `filePath` is rewritten to the new path, the panel re-renders against the
>   new file, and the workspace layout is saved so it survives a restart.
> - D2 DELETE: a panel whose note is deleted (including via a parent-folder delete) is removed
>   from the sidebar automatically, and the layout is saved. [...] The SC-184 dismiss button
>   stays as the fallback for panels already stale from before this fix.
> - D3 Pattern: copy the existing vault-listener shape (SccResolver.ts:154-156 /
>   CompendiumIndex.ts:177-179 — `plugin.registerEvent(app.vault.on(...))`), so listeners are
>   torn down on unload.

Things you must get right and say how you handled in the report:

1. **Folder rename/delete.** Handle a `TFolder` event by prefix (`oldPath + '/'`) whether or not
   Obsidian also fires per-child events — the handler must be idempotent so both orders work.
   Don't match `Foo/BarBaz.md` for folder `Foo/Bar`.
2. **Multiple panels on one note / multiple sidebar leaves.** Every matching panel in every
   open DSE sidebar leaf updates. Reuse the existing panel-identity/dedup logic
   (`DseSidebarView.ts` ~134-200, ~292) — after a rename, two panels must not become
   accidental duplicates or fail to dedup against a new pin of the same block.
3. **Where the listener lives.** Decide between the view (`onOpen`, torn down on close) and the
   plugin (`registration.ts`). If a sidebar leaf can exist without a loaded view (Obsidian's
   deferred views, `leaf.isDeferred` / `loadIfDeferred`, depending on the pinned obsidian API
   version in package.json), a rename while deferred still leaves stale state — handle it if
   the API allows it cheaply (e.g. rewriting the deferred leaf's view state), otherwise report
   it as a follow-up with the reason. Do not force-load deferred leaves just to handle this.
4. **Persistence.** After mutating panel state, make sure Obsidian's layout save picks it up
   (whatever the view already does for pin/unpin/dismiss — follow that path, e.g.
   `app.workspace.requestSaveLayout()`).
5. **No in-flight corruption.** The panel's rendered block (and any stateful element inside it,
   e.g. an encounter/combat block — see SC-288/SC-184 history about sidebar buttons wiping live
   combat state) must not be destroyed-and-rebuilt in a way that loses state the panel wouldn't
   also lose on a normal re-render. Prefer the same re-render path the panel already uses when
   its note changes. Any write into the user's note is out of scope — this ticket writes nothing
   to notes.

Tests (jest, per the repo's conventions — find the existing sidebar test files, e.g.
`sidebar*.test.ts`): rename of the note → panel filePath updated + re-rendered + layout save
requested; rename of a parent folder; rename of an unrelated file / sibling with a shared prefix
→ untouched; delete of the note → panel removed; delete of a parent folder; two panels on one
note; listener unregistered on unload/close. If the obsidian lifecycle harness
(`npm run obsidian-lifecycle`) makes adding a real-Obsidian rename scenario cheap, add one and
report it; if not, say why.

Commit after every coherent step (small, conventional messages, e.g. `feat(sidebar): SC-282 …`).
No co-author trailers or AI attribution in commits. Nothing uncommitted through a gate.

Out of scope: any visual/CSS change; any change to the SC-184 dismiss button's look; anything in
other repos. If you find an out-of-area bug, report it under `Follow-ups:` — do not fix it.

## 3. Gates (dse-verify battery, full, in order; foreground; output redirected to files)

Expected numbers at base `3b25127` (from SC-288 r3):
- tsc clean; lint clean, exit 0.
- jest (`rm -f main.js styles.css` in the plugin root first): **3974 passed / 1 skipped / 3975
  total, 204 of 205 suites** at base — yours = that plus your new tests, 0 failures. Known flake:
  `sidebarEncounterHandoff.test.ts` (SC-352) — if it alone fails, re-run once and report both.
- obsidian-lifecycle: `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed` (or 7/7 if you add a scenario).
  Private Xvfb only, never `:1`.
- shots 0 FAIL; freeze **`260/260`** byte-identical (this change must not move a single frozen
  byte — if it does, STOP and report; never touch the baseline file).
- parity LAST: `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0.

Devbox: `devbox run -- bash -c 'cd /abs/path/draw-steel-elements && <cmd>' > /abs/log 2>&1`
with the gate command LAST (devbox eats exit codes; never pipe a gate into `tail`). Read the
tool's own summary line as the truth.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc282-sidebar-rename/sc282-r1-impl-report.md`
and put gate logs next to it as `sc282-r1-<gate>.log`. The report opens with a ≤10-line
executive summary. Then: design (where the listener lives and why; the folder/deferred/dedup
handling), commit list with shas, gate table with measured numbers and log paths,
`Drive-by fixes:` and `Follow-ups:` sections.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, final DSE sha, measured
gate numbers, the path of every evidence artifact/log/report. No prose.

Footguns:
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run every gate in the FOREGROUND; never background a gate and wait for a
  notification (it never comes).
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes
  to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT
  and the question in your report. If you ever do send a message anyway, its FIRST WORD must be
  `SC-282:`.
- Never `rm -rf` the shared `.superpowers/` dir or anything in it but your own `sc282-*` files.

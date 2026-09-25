## Global Constraints

- Worktree: dse = `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements` (branch `sc340-view-adoption`, rebased in Task 0 onto dse `origin/develop` containing SC-343); superproject = `/home/scott/code/steelCompendium/worktrees/sc340-view-adoption` (branch `sc340-view-adoption`). Verify `pwd` before every write. NEVER write under `/home/scott/code/steelCompendium/workspace/draw-steel-elements`; workspace-level files (dse-verify skill, F1 spec) are edited in the worktree SUPERPROJECT, never under `/home/scott/code/steelCompendium/workspace/`. The local branch `sc340-spike` is throwaway — never merge or cherry-pick from it.
- Commands: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/draw-steel-elements && <cmd>'`. devbox eats `$?`/`$PIPESTATUS`: gate command LAST, no pipes, read the tool's own summary line. `rm -f main.js styles.css` before EVERY jest run.
- Gates per the dse-verify skill (in the superproject after SC-343: tsc → lint → jest → obsidian-lifecycle → shots → freeze → parity). Expected: 0 frozen bytes moved; parity `0 GAPs / 0 undeclared / 16 DECLARED`; lifecycle all ok.
- Commit messages `feat|fix|test|docs(<area>): SC-340 — …`. **No `Co-Authored-By` or any AI-attribution line.** Never push, merge, or tag; never tag or release draw-steel-elements.
- Real-Obsidian runs: headless Xvfb `:160–:199`, own CDP port, own user-data-dir, scratch vault copy; never display `:1`, never the worktree's `demo-vault/`.
- Spec numbers, verbatim: claim window **3000 ms**; claim key `(ctx.docId, sourcePath, body)` with bodies compared by SC-343's `normalizeBody`; focus-restore backstop **5000 ms**; kill switch = hidden `viewAdoption` key in `data.json`, default ON (`settings.viewAdoption !== false`), not shown in the Settings UI.
- Invariant (spec §6.1): nothing an adopted view depends on may be a child of the old render child. `host.addChild(view)` is used ONLY for non-reading hosts.
- Out of scope: Live Preview; `SidebarBlockHost`; removing `previewScrollPin`; ds-conditions' close-deferral (`conditions/panel.ts`, follow-up SC-344); fixing Obsidian's leaked embed copies.

## Review Focus

- **Two panes (or a pane + an embed) of the same note, write from either**: only the writer's instance keeps its view; the other shows the new data in a fresh view; exactly one file write per click. Pinned in Task 4 (jest, docId) and Task 8 (`G-S4`).
- **A pending write when the note is navigated away, the leaf closed, the mode toggled to Source, or the plugin disabled**: the write lands in the right block of the right note, and the registry ends with no view for a block no longer rendered. Pinned in Task 2 (jest) and Task 8 (`G-S6c`…`G-S6i`).
- **Typing in a focused input inside the block while an earlier click's write lands**: text, focus and caret survive; an editable stepper's half-typed draft is NOT committed by the adoption blur. Pinned in Task 4 (focus) / Task 6 (stepper) / Task 8 (`G-S3`).
- **A write that arrives within 3 s but whose rebuild never comes** (off-screen, hidden in Source mode > 3 s, a leaked embed copy): no view is adopted by the wrong section; the ticket simply expires; nothing leaks. Pinned in Task 4 (ticket expiry, never-loaded view) and Task 5 (collision).
- **The Edit (pencil) form opened after one or more adopted writes**: the form shows the CURRENT block body, and saving it cannot revert newer changes. Pinned in Task 6.

---


## Controller rulings that override the plan text (binding)

- SC-343 LANDED on dse origin/develop at `48ac20c` with SIX lifecycle scenarios (G-S7a, G-S7b, G-S6a, G-S6b, G-S5n, G-S6u), not five. Every "5/5" in the plan means **6/6**; SC-340's final gate is **19/19** (6 + 13), not 18/18.
- SC-343's host has more than its plan described (`locateUnterminatedTrailingFence`, `hasCloseInRange`, tolerant unterminated-EOF check, `knownBody` set inside the Vault.process callback). None of SC-340's consumed names changed. Invariant: `rebind` must never clear `knownBody`.
- HOVER POPOVERS ARE WRITABLE in Obsidian 1.14.2 (measured on base and head by SC-343's final review): their section resolves and a click writes the correct block. The plan's G-S6g ("hover renders read-only") and its stop-and-report branch are superseded — see the Task 8 dispatch.
- The dse-verify skill and F1 already describe the 6-scenario gate and the hover correction (landed with SC-343).

## Worker footguns (every dispatch)

- You never call the Linear tracker and never dispatch subagents.
- Run every gate in the FOREGROUND with a 600000 ms timeout and output redirected to a per-run file under this workspace dir, then read it; never background a job or use Monitor and wait for a notification (a job you start does not wake you — earlier workers stalled exactly this way). Never key a wait-loop on a scratch filename or its contents.
- You cannot SendMessage the controller. If you need input, end with STATUS: NEEDS_CONTEXT and the question.
- Never `rm -rf` the shared `/home/scott/code/steelCompendium/workspace/.superpowers/`; `/tmp` or scratch dirs you create are yours to delete.
- Timeout-shaped jest reds in the settings-tab/settings-preview suites: check `/proc/loadavg` and re-run before believing them.
- The local branch `sc340-spike` is throwaway: never merge or cherry-pick from it.

# SC-601 r1 brief: reproduce (or refute) in real Obsidian

You are the r1 reproduction worker for ticket SC-601. Your final text goes to the ticket-owner, not a human. **You never call the tracker (Linear)**: not to read history, not to post. Everything you need is in files.

## 1. Context to load (in this order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/decisions.md`.
2. The suspicion (verbatim from the ticket):
   > Hover over a link, click into the preview so it turns into an editor, then open the Compendium search from a command. A click in the search box or its background is likely to close the preview. A chosen result would then be inserted into an editor that no longer exists. Clicking a suggestion itself is expected to work.
   >
   > `CompendiumSearchModal` is an Obsidian `SuggestModal`, not a `DseModal`, so SC-595's click guard does not cover it. An editor command can open it while a hover preview is in source-editor mode (`activeEditor` is the popover's embed). A click in its input or background is neither inside the popover nor default-prevented, so the popover's window click listener (app.js:509, `m => m.defaultPrevented || h.contains(m.targetNode) || d.hide()`) would hide the preview. Suggestion clicks call `preventDefault` and survive.

   Source of the suspicion: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc597-hover-modal-keyboard-closes/sc597-r1-design-report.md` (line ~68 table row and §Follow-ups line ~218). It was found by reading, never measured.
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, about 320 KB, read in parts: the section "Hover preview modals (SC-595)" (around line 405-412; it documents what closes a preview: the window BUBBLE click listener, the window CAPTURE `T3` listener that hides an unfocused preview 5 ms after a click, the click-to-edit helper, and the G-S83 authoring footguns: how to do a real hover, where the popover instance lives, `DSE_CAMERA_TMP`, etc.), and "Lifecycle and e2e notes" (around line 177-182: the 180 s backgrounding of Bash calls). Grep for `G-S83` / `G-S91` to find how those scenarios drive a real hover preview in `visual-harness/obsidian-lifecycle.mjs`; reuse their helpers.
4. Product code: `draw-steel-elements/src/authoring/CompendiumSearchModal.ts`, `src/authoring/compendiumInsert.ts` (the commands that open it, ~lines 355/368), `src/framework/kit/textScaleRoot.ts` (references the modal), and `src/framework/.../managedModal.ts` (SC-595/SC-598 hover guards, for comparison only).
5. Prior landed ledgers for the same family: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc595-hover-form-click-closes*`, `sc597-*`, `sc598-*`. Skim their executive summaries only.

## 2. Worktree

- Path: `/home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover`; dse submodule at `.../draw-steel-elements` on branch `sc601-compendium-search-hover`, HEAD `5f7c5336` (dse `develop`). Verify with `git -C <abs path> log --oneline -1` and `pwd` before any write. No rebase needed unless `git -C <dse path> fetch origin` shows `origin/develop` moved past `5f7c5336`; if it did, rebase onto it and say so.
- Use `git -C <absolute path>` for every git command, never `cd X; git ...`.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared: never edit there. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected; do not flag or touch it.
- A fresh worktree's `node_modules` can be copied from the main checkout's `draw-steel-elements` (`cp -a`, package-lock identical) instead of `npm ci`.

## 3. The task: reproduce or refute, with measurements

Build a real-Obsidian probe (preferred shape: a scratch lifecycle scenario `G-S97` in `visual-harness/obsidian-lifecycle.mjs`, run with `--only=G-S97`; commit it on the branch so nothing sits uncommitted, but it is a probe, not yet a landing test). Drive it the way G-S83 / G-S91 do: a real hover over an internal link to a note whose content has a markdown body you can type in, then a real CDP click into the preview's body so it becomes a source editor (`.is-editing`; confirm `app.workspace.activeEditor` is the popover's embed, not the pane's editor).

Then open the Compendium search. Measure every path that a user could really use:

- **Opening paths:** (A) the plugin's command by its hotkey-equivalent path (`app.commands.executeCommandById(...)` while the focus is in the preview editor, which is what a hotkey does); (B) the command palette: a real Ctrl+P (CDP keys), type the command name, Enter; (C) any other opener the code has (e.g. a ribbon/sidebar/menu entry) if it can be reached while the preview is editing. Record which commands are `editorCallback`/`editorCheckCallback` and whether each is even available with the preview editing.
- **Clicks after it opens (real CDP mouse presses, not `el.click()`):** (1) in the search input, (2) on the modal background (`.modal-bg`), (3) on a non-input part of the modal box (e.g. the prompt's instructions area / padding), (4) on a suggestion. For each, at ~1.5 s after the click record: is the preview still in the DOM and shown, is it still `.is-editing`, is the search modal still open, where is `document.activeElement`.
- **The insert:** after each surviving or non-surviving state, choose a result (click a suggestion, and separately arrow-key + Enter). Record WHERE the text lands: the hovered note's file on disk (read it via `app.vault.read`), the pane's note, nowhere, or an exception (capture console errors and `window.onerror`). This is the user-facing consequence the ticket guesses at: "inserted into an editor that no longer exists".
- **Controls (so the result means something):** (i) the same open + clicks with the note in a normal pane (no hover); (ii) the same clicks with an Obsidian NATIVE SuggestModal opened from the editing preview (Quick switcher `switcher:open`, or the command palette itself): if the native one also closes the preview on an input click, the behavior is host-wide, not ours, and say so plainly; (iii) the same with a DseModal opener from SC-595's set, for contrast.
- Run each trial at least 3 times; note host load (`cat /proc/loadavg`) at the time.

Do NOT write a fix. If it reproduces, describe in the report (one short section) where a fix would go and what shape it could take (e.g. reuse of the SC-595 `DseModal` document click guard / anchor on the SuggestModal, or a capture of the target editor at open time), with file:line, but implement nothing in `src/`.

## 4. Gates

No product change, so no full battery. Required: the probe runs green as a harness (it completes and prints its measurements), and you state whether `node visual-harness/obsidian-lifecycle.mjs --only=G-S97` exits 0. Run devbox as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc601-compendium-search-hover/draw-steel-elements -- bash /abs/path/to/your-script.sh`, with exit codes captured inside the script file (devbox's `sh` wrapper eats `$?` in a `bash -c` string, and a pipe eats failures). Any Bash call over 180 s is moved to the background by the tool even with a long timeout: keep one lifecycle run per call, output to a log, and when waiting use `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (pick the pid whose `readlink /proc/<pid>/cwd` is your worktree's `draw-steel-elements`), then read the log. Never wait for a notification that may not come: poll the log or the pid.

## 5. Footguns (read every one)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents: the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it: the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me: a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-601:`.
- Scratch: make a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc601-r1-<yourAgentId>/` and name every script and log uniquely inside it. Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a `/tmp` glob** (other efforts' lifecycle vaults match `/tmp/dse-obsidian-lifecycle-*`). Delete only a literal path you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID whose `/proc/<pid>/cwd` or command line is inside YOUR worktree.
- Never `cd` inside a compound command; use `devbox run -c <abs path>` and `git -C <abs path>`.
- Do not set a long `TMPDIR` (Obsidian exits at start-up); use `DSE_CAMERA_TMP` under your scratch folder if you need a camera root.
- Never put a bracketed ticket id in a test title (the e2e runner reads titles for scenario ids).
- Do not edit `SKILL.md`. If you learn a harness footgun worth recording, put it in the report under "SKILL proposals".

## 6. Report and return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc601-compendium-search-hover/sc601-r1-repro-report.md`. It opens with a ≤10-line executive summary: REPRODUCED / NOT REPRODUCED / PARTLY (which paths), the user-visible consequence in one plain sentence, and whether the behavior is ours or host-wide (control ii). Then: a results table (path x click x outcome, trial counts), where the insert landed, the controls, Obsidian version, load, the probe's commit sha, and (if reproduced) the fix-location section. Sections `Drive-by fixes:` (should be none) and `Follow-ups:`.

If you take screenshots, save them under your private scratch folder and list their absolute paths; one before/after pair of the deciding trial is enough.

Final text to me: raw facts only (verdict, branch sha of the probe commit, measured numbers, exit code of the `--only=G-S97` run), plus the absolute path of the report and of every evidence artifact. No prose.

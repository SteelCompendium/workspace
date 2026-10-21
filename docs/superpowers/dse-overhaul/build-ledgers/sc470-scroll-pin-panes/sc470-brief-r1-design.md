# SC-470 r1 — design + measure round (reviewer): pin the reading views the SC-198 pin misses

You are a design/measure worker for ticket SC-470. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read history, not to post.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/decisions.md` — the spec (verbatim ticket text) and constraints. Read it fully.
- Prior evidence (SC-459, landed): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r1-measure-report.md` — read its executive summary, M1, M2, Finding F1. Its probe tooling is reusable: `sc459-r1-probe-block.mjs.txt`, `sc459-r1-run.sh`, `sc459-r1-build-bundles.sh` in the same dir (copies also in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc459-scroll-pin-gate/`).
- Code: `draw-steel-elements/src/framework/host/previewScrollPin.ts` (whole file, header explains the mechanism), its call site `ReadingModeBlockHost.ts` ~:596, construction in `registerFrameworkElements.ts` :53-76, the CSS rule `data-dse-scroll-pin` in `styles-source.css`, `viewRegistry.ts` (SC-340 adoption — writer-only), lifecycle G-S8 and G-S4 in `visual-harness/obsidian-lifecycle.mjs`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (lifecycle section: ports, Xvfb, `--only=`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes`, dse at `draw-steel-elements/` on branch `sc470-scroll-pin-panes` at `c03db7a` (= `origin/develop`). First: `git -C <dse abs path> fetch origin` and confirm `origin/develop` is still `c03db7a`; if it moved, report the new sha and continue on `c03db7a` (measure-only round). Verify `pwd`/paths before any write. If `node_modules` is missing, `npm ci` in the dse dir.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — never touch or report it. You do not work in the main checkout at all.

## 2. Task

Measure-and-design only. **Commit nothing to the branch** (prototype as a patch file in the ledger dir; revert every temporary source change with `git -C <abs> checkout -- <file>` and confirm `git -C <dse> status --porcelain` is empty at the end).

Ticket's fix direction (verbatim): "pin every open reading view of the file on a DSE write, and/or pin on the vault `modify` event for external changes."

Answer, by measuring in a real Obsidian 1.14.4 via the lifecycle harness (probe scenarios injected temporarily, as SC-459 r1 did):

1. **Reproduce** on `c03db7a` stock: (a) two panes on the same tall-tracker note, both scrolled, click in pane A → pane B scrollTop; (b) bare external `vault.process` / `vault.modify` of a tracker's body with the note open in reading view (also: an adapter-level write, i.e. `app.vault.adapter.write` followed by Obsidian's file-watcher pickup, which is the real Sync/git path — say whether the harness can produce it). Record start/min/max scrollTop and sizer inline min-height.
2. **Timing**: does Obsidian's vault `modify` event (a plugin `registerEvent(app.vault.on('modify', …))` handler) fire BEFORE the other views' preview rebuild empties the DSE section, for each of: the plugin's own write (`vault.process` from ReadingModeBlockHost), an external `vault.process`, and a file-watcher pickup? Measure, don't infer (e.g. log the frame/microtask of the handler vs the first frame where the sizer's min-height falls).
3. **Prototype** the smallest design that holds scrollTop in every reading view of the file for cases (a) and (b). Candidates — evaluate, don't assume:
   - D1: on our own write, pin every open `MarkdownView` of that file that is in preview mode (iterate `app.workspace` leaves), not only the writer's scroller.
   - D2: a vault `modify` listener that pins every open reading view of the modified file (covers both our writes and external ones; then the writer-side pin call may become redundant — say whether it can be removed or must stay because of timing).
   - D1+D2 or anything better you find.
   Constraints for the design: pin only views whose preview contains a DSE block (non-DSE content never clamped in SC-459 M1 — do not add phantom-space side effects to ordinary notes); keep every existing fail-safe in `previewScrollPin.ts` (no scroller / not scrolled / at top → no-op; TTL release); do NOT change `PIN_TTL_MS` (SC-472 is out of scope); popout windows must work (use the view's own `containerEl.ownerDocument`/`win`, never global `document`/`window`); listener registered via `plugin.registerEvent` so it unloads cleanly; no effect on Live Preview / Source panes (not in scope; say if they clamp, as information).
   Also check: does pinning the WRITER's view a second time (D2 firing after the existing pin) do anything harmful — re-arming the TTL, overwriting the pinned height with an already-collapsed one? The pin must capture the height BEFORE collapse; prove your design never captures a collapsed height.
4. **Gate design**: a new lifecycle scenario id (propose one name, e.g. `G-S13`, check the file for the next free id) or an extension of G-S8, covering (a) second pane and (b) external edit, that **discriminates**: FAIL on stock `c03db7a`, ok with your prototype, 3/3 each, and FAIL again with the CSS rule deleted. Include the same anti-vacuity tripwires as G-S8 phase 2 (the tracker in the observed pane was rebuilt; the sizer's inline min-height fell below the starting scrollTop; `data-dse-scroll-pin` present at the collapse). Keep the scenario's edits separate from G-S8's existing lines (SC-457/SC-471 are in flight elsewhere; minimize conflict surface).
5. Run the full lifecycle once with the prototype applied: expect `28/28 ok` plus your new scenario(s).

## 3. Rules / footguns (each cost real time once)

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc470-r1-<yourAgentId>/` — the scratchpad is shared by every agent; never use generic script names in its root. Write scripts there with the **Write tool**, not heredocs.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc470-scroll-pin-panes/draw-steel-elements -- <cmd>` (or a wrapper script file that `cd`s itself). **Never put `cd` inside a compound command**; use `git -C <absolute path>` for every git command.
- **No glob `rm`**, ever (not in scratch, not `/tmp/dse-obsidian-lifecycle-*`). Delete only exact paths you created and recorded. Never `rm -rf` anything under `.superpowers/`.
- Kill only by PID, and only a PID whose command line contains `worktrees/sc470-scroll-pin-panes/` (`pgrep -af "worktrees/sc470-scroll-pin-panes/"`). Never `pkill`/`killall` by pattern — other efforts run the same gates concurrently.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9370) and stay off Xvfb `:1`.
- Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`, and `| tail` eats failures: run gates via wrapper script files that record the exit code to a per-run file, with output redirected to a log in your scratch subfolder — never streamed (the 600s stream watchdog kills silent agents).
- **Run every gate in the FOREGROUND.** Do not background a run and wait for a notification — a job you start does not wake you. If something must run long, run it in the foreground with a long timeout.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-470:`.
- If the report-file write is blocked by your harness, return the report inline.

## 4. Outputs (ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/`)

- `sc470-r1-design-report.md` — **opens with a ≤10-line executive summary**: reproduction numbers, timing verdict, recommended design (D1/D2/…) with one-line why, gate scenario name + discrimination table summary, full-lifecycle result. Body: measurements, the design's exact code shape (file:line where it goes), risks, and anything that should be a separate ticket (as `Follow-ups:`).
- `sc470-r1-prototype.patch` — source + lifecycle-scenario changes, `git apply --check` clean on `c03db7a`.
- Logs/json evidence under the ledger dir with the `sc470-r1-` prefix (or your scratch subfolder — list every path).

## 5. Return contract

Final text: raw facts, no prose — verdict, measured numbers, recommended design, discrimination counts, full-lifecycle line, `git status --porcelain` empty confirmation, and the absolute path of every artifact you produced. `Follow-ups:` list for anything out of scope.

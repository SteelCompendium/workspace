# SC-478 r1 — design + measure round (reviewer): keep Live Preview panes from jumping to the top

You are a design/measure worker for ticket SC-478. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker (Linear)** — not to read history, not to post.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/decisions.md` — spec (verbatim ticket text) and constraints. Read it fully.
- Prior evidence (SC-470, landed at dse `1c271b5`, the Reading-view version of this fix): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc470-scroll-pin-panes/sc470-r1-design-report.md` (exec summary, §1 table row `lp-process`, §2 timing) and the SC-470 ledger `.../build-ledgers/sc470-scroll-pin-panes-ledger.md` (what landed and why). Reusable probe tooling (copy into your scratch subfolder, don't edit in place): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc470-scroll-pin-panes/sc470-r1-probe-block.mjs.txt`, `sc470-r1-run.sh`, `sc470-r1-build.sh`, `sc470-r1-build-variants.sh`, `sc470-r1-disc.sh`, `sc470-r1-probe-cost.mjs.txt`.
- Code (dse): `src/framework/host/previewScrollPin.ts` (whole file — the SC-198/SC-470 Reading pin: vault `modify` listener, per-pin stylesheet rule, MutationObserver floor, TTL), `src/framework/host/LivePreviewBlockHost.ts` (how a DSE block lives and writes in Live Preview), `BlockHost.ts`, `viewRegistry.ts`, `registerFrameworkElements.ts` (pin construction/wiring), lifecycle `visual-harness/obsidian-lifecycle.mjs` scenarios G-S8, G-S15 and G-S6c (Reading↔LP methodology).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (lifecycle section: ports, Xvfb, `--only=`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll`, dse at `draw-steel-elements/` on branch `sc478-livepreview-scroll` at `1c271b5` (= `origin/develop` at dispatch). First: `git -C /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements fetch origin` and confirm `origin/develop` is still `1c271b5`; if it moved, report the new sha and continue on `1c271b5` (measure-only round). Verify paths before any write. If `node_modules` is missing, `npm ci` in the dse dir.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — never touch or report it. You do not work in the main checkout at all.

## 2. Task

Measure-and-design only. **Commit nothing to the branch** (prototype as a patch file in the ledger dir; revert every temporary source change with `git -C <abs> checkout -- <file>` and confirm `git -C <dse abs> status --porcelain` is empty at the end).

Ticket (verbatim): "a Live Preview pane showing a tall tracker note jumps to the top when the tracker changes from another pane or from an external write (Sync, git, another plugin): `.cm-scroller` scrollTop 3018 -> 0, 2/2 on stock." … "Live Preview scrolls a CodeMirror scroller, which the pin does not touch; it needs its own measurement and mechanism."

Answer, by measuring in a real Obsidian 1.14.4 via the lifecycle harness (probe scenarios injected temporarily, as SC-470 r1 did):

1. **Reproduce** on stock `1c271b5`, recording `.cm-scroller` start/min/max scrollTop, scrollHeight per frame, and the DSE widget's height per frame:
   - (a) note open in two panes, B in Live Preview scrolled well down past the tracker(s), DSE control clicked in pane A (A in Reading, and separately A in Live Preview);
   - (b) external write with the note open in an LP pane: `vault.process`, `vault.modify`, and a Node `fs.writeFileSync` file-watcher pickup (the SC-470 harness produces this path);
   - (c) the WRITER itself in Live Preview (click a control in the LP pane you are scrolled in) — does the writer LP pane hold today? (information; in scope if it jumps);
   - (d) control: a tall non-DSE note in LP, same external write — does it hold? (If plain notes also jump, that is Obsidian's behaviour and our scope is DSE notes only — say so.)
   - (e) the scroll position variants that matter: viewport ABOVE the tracker, viewport ON the tracker, viewport BELOW the tracker. Say which jump and by how much.
2. **Mechanism — measure, don't infer.** Why does `.cm-scroller` go to 0 (or lose position)? Distinguish at least: (H1) Obsidian replaces the whole doc on external modify (one transaction replacing 0..len — CodeMirror then maps the scroll anchor to 0) vs a minimal diff; (H2) the DSE block widget is destroyed and re-created, mounts small/empty and grows later, so CM's height map shrinks and the browser clamps scrollTop; (H3) something else (CM scroll anchoring, `scrollIntoView` effects, focus/selection moves, our own code calling `scrollIntoView`/`focus`). Log the transactions the EditorView receives (changes, effects, `scrollIntoView` flag, userEvent), the frame where scrollTop first drops, and the widget's DOM lifecycle (destroy/create, `updateDOM`/`eq` if reachable).
3. **Prototype** the smallest design that holds the LP pane's reading position for (a), (b), and (c) if it jumps. Candidates — evaluate, don't assume:
   - L1: extend the existing pin to LP panes — a height floor on the CM content/sizer element of a `source`-mode view during the rebuild (same per-pin stylesheet rule + TTL machinery as the Reading pin);
   - L2: CodeMirror-native restore — capture `EditorView.scrollSnapshot()` (or the top visible line + offset) at `modify` time (before the rebuild, per SC-470's timing verdict — re-verify for LP), and dispatch it back after the rebuild settles;
   - L3: stop the shrink at its source — keep the DSE widget's height (or its old DOM) across a re-render if `LivePreviewBlockHost` controls that path;
   - or anything better you find. Prefer a mechanism that restores the *content* the user was looking at over one that restores a pixel offset, and say how each candidate behaves when the write changes the tracker's height (e.g. a row added above the viewport).
   Constraints: affect only views whose content contains a DSE block (no side effects on ordinary notes); popout windows must work (use the view's own `ownerDocument`/`win`, never global `document`/`window`); listeners via `plugin.registerEvent` so they unload cleanly; do NOT regress the Reading pin (G-S8, G-S15 still ok) and do NOT change `PIN_TTL_MS` (SC-472 is out of scope); do not edit `ReadingModeBlockHost.ts`, `fenceLine.ts` (SC-457 in flight) or `sidebar/registration.ts` (SC-471 in flight) — if a design needs one of them, say why and stop short; embeds (SC-479) out of scope; never steal focus or move the cursor/selection in the observed pane; never fight a user scroll (if the user scrolls during the rebuild, the user wins — say how your design ensures this).
   Measure the prototype's cost (main-thread ms per pinned/restored view) as SC-470 did with its cost probe.
4. **Gate design**: new lifecycle scenario **`G-S18`** (G-S14/G-S16 reserved for SC-457/SC-471, G-S17 offered to SC-466 — do not use those). It must cover (a) another pane's write and (b) an external write (and (c) if it jumps), and **discriminate**: FAIL on stock `1c271b5`, ok with your prototype, 3/3 each, and FAIL again with the new mechanism disabled at its narrowest point (name that point — it becomes the control). Include anti-vacuity tripwires like G-S8/G-S15's: the observed LP pane's DSE widget really was rebuilt; on stock the position really was lost (scrollTop fell / the top visible line changed); with the prototype the mechanism was engaged at the moment the position would have been lost. Keep the scenario's edits in a separate block from G-S8/G-S13/G-S15 to minimise conflict surface with in-flight scenarios.
5. Run the full lifecycle once with the prototype applied: expect `30/30 ok` plus `G-S18` = `31/31`.

## 3. Rules / footguns (each cost real time once)

- **Private scratch subfolder**: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc478-r1-<yourAgentId>/` — the scratchpad is shared by every agent; never use generic script names in its root. Write scripts and scratch files with the **Write tool**, not heredocs.
- Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc478-livepreview-scroll/draw-steel-elements -- <cmd>` (or a wrapper script file that `cd`s itself, run as `devbox run -c <that dir> -- bash <abs script path>`). **Never put `cd` inside a compound command**; use `git -C <absolute path>` for every git command. **One gate per Bash call.**
- **No glob `rm`**, ever (not in scratch, not `/tmp/dse-obsidian-lifecycle-*`). Delete only exact paths you created and recorded. Never `rm -rf` anything under `.superpowers/`.
- Kill only by PID, and only a PID whose command line contains `worktrees/sc478-livepreview-scroll/` (`pgrep -af "worktrees/sc478-livepreview-scroll/"`). Never `pkill`/`killall` by pattern — other efforts run the same gates concurrently.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9378) and stay off Xvfb `:1`.
- Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`, and `| tail` eats failures: run gates via wrapper script files that record the exit code to a per-run file, with output redirected to a log in your scratch subfolder — never streamed (the 600s stream watchdog kills silent agents).
- **Run every gate in the FOREGROUND** with a long timeout. Do not background a run and wait for a notification — a job you start does not wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-478:`.
- If the report-file write is blocked by your harness, return the report inline.

## 4. Outputs (ledger dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc478-livepreview-scroll/`)

- `sc478-r1-design-report.md` — **opens with a ≤10-line executive summary**: reproduction numbers per case (a)–(e), mechanism verdict, recommended design with one-line why, G-S18 discrimination summary, full-lifecycle result. Body: measurements, the design's exact code shape (file:line where it goes), cost, risks, and anything that should be a separate ticket (as `Follow-ups:`).
- `sc478-r1-prototype.patch` — source + lifecycle-scenario changes, `git apply --check` clean on `1c271b5`.
- Logs/json evidence under the ledger dir with the `sc478-r1-` prefix (or your scratch subfolder — list every path).

## 5. Return contract

Final text: raw facts, no prose — verdict, measured numbers, mechanism, recommended design, discrimination counts, full-lifecycle line, `git status --porcelain` empty confirmation, and the absolute path of every artifact you produced. `Follow-ups:` list for anything out of scope.

# SC-540 r1 brief — implementer: reproduce, fix, test, battery

You are the r1 implementer for Linear SC-540. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/decisions.md` — read all of it. It is the current state; the FIX RULE there is your spec.
- Prior art (read the named parts only):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc537-lp-callout-twins/sc537-r1-diag-report.md` §2.5 (this bug's measured cause) and §1 setup (how real CDP clicks + "park" were done).
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc522-lp-embed-scroll/sc522-r1-SRC-obsidian-embed-click-handler.txt` (the Obsidian click handler that honours `.interactive-child`) and G-S52 phase (e) in `visual-harness/obsidian-lifecycle.mjs` (real-mouse click in an LP embed; the "no `interactive-child` mark" control-bundle pattern via `DSE_LIFECYCLE_BUNDLE`).
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/sc544-r1-diag-report.md` §2.5 only (a throwaway SC-540 probe another agent ran; FYI).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source`, branch `sc540-lp-callout-click-source` in every submodule. Plugin at `…/draw-steel-elements` on dse `eaf64ba6` (= origin/develop at cut). Superproject at `53d4aa68`. Verify `pwd`/`git -C <path> rev-parse HEAD` before any write. First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `eaf64ba6`; if it moved, rebase onto it and say so.
- **The workspace-level files live in YOUR worktree's superproject** (`/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source/CHANGELOG.md`) — never under `/home/scott/code/steelCompendium/workspace/` (except your report files in the ledger dir). The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` "The battery, in order" table and the CURRENT block before running gates.

## 2. The task

### Step A — reproduce on base, in real Obsidian Live Preview (no code change yet)
Using the lifecycle harness's real Obsidian 1.15.0 (or a scratch copy of its driver), on the `eaf64ba6` bundle, measure:
1. A `> [!note]` callout holding a `ds-counter` at 5: real CDP mouse click on `+`. Record: disk value, whether the callout is now raw source (selection inside the callout range; the card gone), the editor selection before/after, `.cm-scroller` scrollTop before/after.
2. Keyboard: Tab/focus to the card's Edit pencil, Enter opens the edit form; Escape/cancel; is the callout raw after?
3. A real click on card whitespace (not a control) inside the callout.
4. Controls that must keep Obsidian's behaviour: click on callout body text outside the card, on the title, on the callout's `</>` button, a foldable `> [!note]-`/`+` chevron.
5. A DSE card inside a callout that contains an internal link (`[[…]]` in a feature/statblock effect, or whatever block renders a link): plain click opens the target; Ctrl-click opens in a new tab. Record base behaviour.
6. Plain fence outside any callout, the same + click (control: should already be clean).
Live Preview probe rule: scroll each block into view before acting on it; never count `.cm-embed-block`. Grep the Obsidian 1.15.0 app.js (extract from the asar the harness uses) for every use of `interactive-child` and list them with offsets — we need to know what else the class changes.

### Step B — fix (FIX RULE, quoted from the ledger)
> - Default fix: extend SC-522's `interactive-child` mark in `armClickShield` to DSE roots inside a Live Preview callout widget (selector from the measured DOM). Not a bubble `click` stopPropagation (SC-463's warning: it can swallow Obsidian's link handling) and not a blanket `preventDefault` on click (can kill link/checkbox defaults). Switch only with measured cause, reported.
> - Must hold in real Obsidian LP: a real mouse click on a control (+ on ds-counter) inside a callout writes and leaves the callout drawn as a card, editor selection unmoved, no scroll; keyboard Enter on the pencil opens the form and the callout stays a card; a click on card whitespace (not a control) also does not open the source (same as a plain fence).
> - Must NOT change: Obsidian's own callout controls (a click on callout text outside the card or on the title still enters source; the callout's `</>` still enters source; a foldable callout's chevron still folds); internal links inside a DSE card in a callout still open (plain click, and Ctrl/Cmd-click); plain fences, LP embeds (SC-522), Reading view unchanged.
> - Files: src/framework/pipeline.ts (+ its jest). Stay off src/framework/chrome/mountChrome.ts and chrome CSS (SC-520), off ReadingModeBlockHost.ts / viewRegistry.ts / view.ts / remountReused.ts / livePreviewReconcile.ts (SC-544/SC-537).
> - Gate: lifecycle G-S62 in part 3 before G-S56, real CDP mouse, FAILs on the eaf64ba6 bundle; plus jest pins for the selector (inside LP callout, not in Reading-view callout, not outside a callout).

Also: update the SC-522 comment block in `armClickShield` so it explains both cases. Nested cases: callout inside a callout, an LP embed inside a callout, a callout inside an embedded note — the mark must apply in each (measure at least callout-in-callout and embed-in-callout).

### Step C — tests
- Jest: tests written FIRST that fail on the eaf64ba6 source (record the red run), then pass.
- Lifecycle **G-S62** in `visual-harness/obsidian-lifecycle.mjs`, placed in part 3 BEFORE G-S56 (G-S56 replaces every leaf and must stay last; G-S62 sets up its own leaf). Real CDP mouse. Phases at minimum: (a) + in a callout: disk written, callout still drawn as a card (the widget's DSE root present and connected, not raw), selection unchanged, scrollTop unchanged; (b) Enter on the pencil opens the form, close, callout still a card; (c) a real click on callout text outside the card still enters source (control — proves the harness can see raw mode; anti-vacuity); (d) internal link in a card in a callout opens its target. Add fixtures under the harness's `Lifecycle/` convention. **Red/green:** G-S62 FAILs on an eaf64ba6 bundle (record which phases and the numbers) and on a "no callout mark" control bundle; PASSES on HEAD. Phase (c)/(d) pass on both (they are guards).
- Re-run SC-537's G-S57 and SC-522's G-S52 on HEAD with the fix and report them separately (they share this code path: callouts now stay drawn after a click).

### Step D — docs
- Superproject CHANGELOG.md (your worktree's copy) `## Unreleased`: one plain-words bullet (user-facing: clicking a button on a card inside a callout in Live Preview no longer turns the callout into its markdown text).
- Plugin `.repo-docs/` architecture note next to wherever SC-522's interactive-child mark is described, if there is one.
- Do NOT edit `dse-verify/SKILL.md`. Instead write proposed dse-verify text (the G-S62 clause for the battery table row 4, the new part-3 `--only` list, CURRENT numbers) to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r1-dse-verify-proposal.md`.

Commit after every coherent step (tests-red, fix, lifecycle, docs) in the plugin repo and the superproject; do not push; do not bump the superproject's submodule pointer.

## 3. Gates (dse-verify battery, in order) — expected numbers
Baselines at eaf64ba6 → your targets:
- tsc (incl. `tsc -p e2e`) / lint (incl. `e2e/`): clean.
- jest: 6262 + N new passed / 1 skipped / 249 of 250 suites (250 of 251 if you add a suite). Fresh worktree reads one fewer passed / 2 skipped until shots has run once — compare after shots.
- lifecycle: 46/46 → **47/47**, as THREE `--only` parts, each its own blocking foreground call: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56` (10). Report each part's count and seconds; if part 3 exceeds ~540 s, propose a rebalanced split in the proposal file.
- e2e: `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (plus the `pointer parked at 0,0` line).
- shots: 592, 0 FAIL, button host-leak 161/966 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212].
- freeze: `freeze OK (280/280 …)` — the fix adds a class only at click time in LP, so no frozen byte should move. If any does, STOP and report (rebaseline is a Scott sanction).
- parity (last): 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Command and safety rules (each cost real time once)
- Run each gate as ONE blocking foreground Bash call (lifecycle = three separate calls; e2e and shots separate calls). No `run_in_background`, no Monitor, no background jobs. Only exception: shots, if a foreground run is killed near 600 s under load — then start it with output to a unique log plus an rc file and POLL that log/rc file; never wait for a background-completion notice.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file and read each gate's own summary line.
- Write scratch scripts/logs with the Write tool into a PRIVATE folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r1-impl-<your agent id or a random suffix>/`, uniquely named files inside it. Never a generic `gate.sh`.
- No `rm` with a shell-variable target (it hangs on a permission prompt). Overwrite with `>` or use literal absolute paths. No glob `rm`.
- Never `pkill`/`killall` by pattern; kill only a PID you started, verified by `readlink /proc/<pid>/cwd` or a command line inside your worktree/scratch folder. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`). Never touch the shared `.superpowers/` dir beyond writing your own `sc540-` files.
- Use a unique `DSE_LIFECYCLE_PORT` (e.g. 9540) for probe / red-green runs if the harness allows.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r1-impl-report.md`. It must OPEN with a ≤10-line executive summary (STATUS, plugin + superproject shas, base reproduction numbers, the fix in one line, red/green, gate numbers). Then: Step A table (base), `interactive-child` usages in app.js, the fix, tests, red/green evidence, gates, `Drive-by fixes:` and `Follow-ups:` sections. Save 1-2 deciding screenshots (base: callout raw after a + click; HEAD: callout still a card after the same click) into the ledger dir as `sc540-r1-<what>.png` and name them in the report.
If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract
Your final text: raw facts only, no prose — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), shas, measured numbers, gate lines, plus the absolute path of every evidence artifact (report, screenshots, logs).
You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-540:`.
If the fix would need a visible pixel change, or the default fix breaks a "must NOT change" item and no listed alternative works, STOP with NEEDS_CONTEXT and the measurements.

# SC-537 r1 — reproduce in real Obsidian, root-cause, design the fix (no commits)

You are a diagnosis/design worker for ticket SC-537. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/decisions.md` (ticket facts quoted verbatim, overlaps, baselines).
- The SC-481 build ledger (the parent fix; this ticket is its split): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc481-twin-block-vanish/` — read `decisions.md`, `sc481-r1-diag-report.md` (root cause: Obsidian reuses the old rendered element for the next identical section with no processor call; Live Preview widget reuse at app.js 1.15.0 offset ~2656846) and `sc481-r4-fix-report.md` section "Live Preview (the 'also check')".
- SC-481 r4's Live Preview probe tooling (reuse it, do not trust it blindly): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r4-impl-b2/` — `harness-lp.mjs`, `lp.sh`, `mkprobe.py`, `lp-head*/p481-lp.json`. Copy what you need into your own scratch folder; never write into that folder.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (real-Obsidian lifecycle runs, devbox shapes).
- Plugin guidance: `/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/draw-steel-elements/AGENTS.md` (if present) and its `.repo-docs/architecture.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins`, plugin at `.../draw-steel-elements`, branch `sc537-lp-callout-twins`, HEAD must be dse `458abe3` (= origin/develop). Verify with `git -C <abs path> log --oneline -1` first. Never work in `/home/scott/code/steelCompendium/workspace/` (shared main checkout); its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- Fresh worktree: run `npm ci` in the plugin dir first if `node_modules` is missing.

## 2. The task (diagnosis + design only — commit NOTHING to the branch)
Ticket, verbatim: "in Live Preview, put two identical callouts in one note, each holding the same `ds-counter` block at 5. Click + in the upper one. Disk becomes [6,5], which is correct. The lower callout now shows 6 instead of 5. Clicking + in the lower callout writes the UPPER block (disk [7,5])."

Answer with measurements from **real Obsidian** (the lifecycle harness's Obsidian 1.15.0, not jsdom):

1. **Reproduce on 458abe3** with `Lifecycle/twin-callouts.md` in Live Preview: upper click then lower click (disk + each card's displayed value after each step), lower-first click, block edit form Save on the upper twin (e.g. a ds-counter name change, as G-S53 does) then a lower click — does it erase the edit (data loss)? Also: two identical callouts each holding two blocks; three identical callouts; nested callouts; a callout twin + a plain-fence twin with the same body (cross-surface). Note also why the upper callout is drawn as raw source after the click (does DSE's write move the editor cursor into it? is that a separate defect?).
2. **Mechanism, with file:line and a probe.** Exactly what Obsidian/CM6 does to the two callout widgets after the write: which widget DOM is kept/reused/destroyed (CM6 `WidgetType.eq`/`updateDOM`, decoration rebuild, Obsidian's callout widget class in app.js), whether any DSE code runs at all (MarkdownRenderChild onload/onunload, processor, registry), and which DSE view the lower card's clicks resolve to and why the write lands in the upper block (`LivePreviewBlockHost.ts`, `viewRegistry.ts`, `ReadingModeBlockHost.ts` `reusedBlockBody`/`fenceOnElement`, `remountReused.ts` `reconcile`). Prove it with a probe (logs per step), not by reading alone. Explain why SC-481 r4's 150 ms timer started from the processor never ran.
3. **Fix options** (2–3). Candidate hooks to evaluate: a CM6 `ViewPlugin`/`EditorView.updateListener` registered via `registerEditorExtension` that runs a reconcile after doc changes; a `MutationObserver` on the callout widget / the card root; a check at click/write time (resolve the target by the card's current position before writing — at least prevents the wrong-block write even if the display is stale); Obsidian private API as last resort. For each: where it changes, cost, risks (cross-talk between twins, SC-481's Reading-view and LP plain-fence behaviour must not regress, SC-518 twin focus, SC-340 adoption, scroll), how a lifecycle scenario (id **G-S57**, or new phases in G-S53 — recommend which) and jest would assert it. **Prototype the recommended option in-page if cheap** (injected into the real Obsidian page, not committed) and report whether it fixes display AND writes.
4. **Overlap check.** SC-522 (running, another effort) changes Live Preview scroll hold — `src/framework/host/livePreviewScrollHold.ts`. SC-520 (parked) changes chrome-in-callout CSS and a chrome click handler. State whether your recommended fix needs to touch either area (file names), and if so what exactly.

Probes: keep all probe scripts, injected harness copies, vaults and logs in your private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r1-diag-<your agentId>/`, uniquely named files. If you must temporarily modify a file in the worktree, restore it; the worktree must end with `git status --short` empty in the plugin and the superproject.

## 3. Gates
None required (no code change). Building `main.js` for probes is fine. CURRENT at 458abe3, for reference: lifecycle 42/42 (G-S53 includes callout-twin phases in Reading view).

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r1-diag-report.md`. It must open with a **≤10-line executive summary**: reproduced yes/no (which cases, incl. form-Save data loss yes/no), mechanism in one sentence with file:line, recommended fix in one sentence (and whether the prototype fixed display and writes), overlap with SC-522/SC-520 yes/no. Then the measurement table, probe evidence, options. Save 1–2 deciding screenshots (Live Preview, before/after, names describing what they show) in the ledger dir with the `sc537-r1-` prefix.

## 5. Return contract
Final text: raw facts, no prose — verdict, measured numbers, and the **absolute path of every evidence artifact** (report, screenshots, probe logs, probe scripts).

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every Obsidian/lifecycle run as ONE blocking foreground Bash call (under 600 s; scope with `--only=`). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; use `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file.
- Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target and no glob `rm` (both hang on a permission prompt nobody answers); overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern; kill only a PID you started, whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree or scratch folder. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only paths you created and recorded. Never touch the shared `.superpowers/` dir beyond writing your own `sc537-` files.
- Use a unique `DSE_LIFECYCLE_PORT` (e.g. 9537) so you don't collide with concurrent efforts.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-537:`.

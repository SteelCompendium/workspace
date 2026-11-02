# SC-481 r1 — reproduce in real Obsidian + root-cause (diagnosis round, no fix)

You are a diagnosis worker for ticket SC-481. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md` (ticket facts quoted verbatim, the SC-480 overlap, baselines).
- Prior evidence (read, do not trust blindly): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/sc457-review-r1-report.md` INFO-1, and the SC-457 reviewer's probe tooling in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-r1-be71a0a9/` (`sc457-r1-probe-run.sh`, `scripts/sc457-r1-probe-scenarios*.mjs`, `scripts/sc457-r1-inject.mjs`, `probe-head/R-TWINSEQ-FAIL-twin-vanished.png`). That tooling shows one way to inject probe scenarios into the real-Obsidian lifecycle harness.
- Related, just landed: SC-518 handles identical twins for focus — `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc518-form-save-focus/decisions.md` MEDIUM-1 ("Obsidian reuses the old upper section element at the twin's position, so the opener stays connected inside the lower card"). That is very likely the same Obsidian behaviour behind SC-481.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (how lifecycle / real Obsidian runs work, devbox shapes).
- Plugin sub-repo guidance: `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements/AGENTS.md` (if present).
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin at `.../draw-steel-elements`, branch `sc481-twin-block-vanish`, HEAD must be dse `9be397e` (= origin/develop). Verify with `git -C <abs path> log --oneline -1` before anything. Never work in `/home/scott/code/steelCompendium/workspace/` (shared main checkout); its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- Fresh worktree: run `npm ci` in the plugin dir first if `node_modules` is missing.

## 2. The task (diagnosis only — commit NOTHING to the branch)
Ticket, verbatim: "put two blocks of the same type with identical contents in one note, open it in Reading view, and click a control in one of them. The file on disk is correct: one block changes and the other is untouched. But the other block vanishes from Reading view until the note is closed and reopened."

Answer, with measurements from **real Obsidian** (the lifecycle harness's Obsidian, not jsdom):

1. **Reproduce on 9be397e.** Two identical ```` ```ds-counter ```` blocks in Reading view. Click Increase in the UPPER one, and separately (fresh note) in the LOWER one. Record per case: DOM count of DSE cards, which card remains, its displayed value, whether the remaining card's controls work, disk contents. Then also: a second block type with in-card controls (e.g. stamina or a montage — pick one that writes via the card), a block edit form Save (the non-view write path SC-509 redraws on) on one twin, and three identical twins (does only one vanish?). Also check the **sidebar** and **Live Preview** for the same click — does it happen there?
2. **Root cause, with file:line.** Is it Obsidian's Reading-view section diffing (reuse of the old section element / no post-processor call for the unchanged twin) interacting with DSE's view adoption (SC-340, `fromView` from SC-509), the pipeline's mount/unmount bookkeeping (e.g. a block-key or element-keyed registry that de-duplicates by body, an unload of the reused element's child), or something else? Prove it with a probe (e.g. log post-processor calls / MarkdownRenderChild onunload per section during the click), not by reading alone. Look at `src/framework/host/ReadingModeBlockHost.ts`, `src/framework/pipeline.ts` and whatever registry keys blocks.
3. **Fix options** (2–3), each with: where it changes, what it costs, risks (twins cross-talk, SC-518 twin focus, SC-479 scroll pin, SC-340 adoption keeping the live view, writes landing in the right block), and how a lifecycle scenario (id **G-S53**) would assert it. Recommend one.
4. **SC-480 dependency.** SC-480 asks Scott: "when more than one block matches, should DSE refuse the save and show the notice?" (about which block a stale/relocated save writes to). State plainly whether your recommended fix for SC-481 needs that answer, or is independent of it. If it depends, say exactly which choice changes what.
5. Optional, only if cheap (<15 min): was it ever working — e.g. the commit before SC-340's view adoption landed? Skip if expensive.

Probes: keep all probe scripts, injected harness copies, vaults and logs in your private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r1-diag-<your agentId>/`. If you must temporarily modify a file in the worktree to run a probe, restore it; the worktree must end with `git status --short` empty in the plugin and the superproject.

## 3. Gates
None required (no code change). Building `main.js` for probes is fine. Expected dse-verify CURRENT at 9be397e, for reference only: lifecycle 41/41.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r1-diag-report.md`. It must open with a **≤10-line executive summary**: reproduced yes/no (which surfaces), root cause in one sentence with file:line, recommended fix in one sentence, SC-480 dependency yes/no. Then the measurement table, the probe evidence, the options. Save 1–2 deciding screenshots (before/after the click, names describing what they show) in the ledger dir with the `sc481-r1-` prefix.

## 5. Return contract
Final text: raw facts, no prose — verdict (reproduced / root cause / recommendation / SC-480 dependency), measured numbers, and the **absolute path of every evidence artifact** (report, screenshots, probe logs, probe scripts).

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every Obsidian/lifecycle run as ONE blocking foreground Bash call (under 600 s; use `--only=` to scope). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; use `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file.
- Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target and no glob `rm` (both hang on a permission prompt nobody answers); overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern; kill only a PID you started, whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree or scratch folder. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only paths you created and recorded. Never touch the shared `.superpowers/` dir beyond writing your own `sc481-` files.
- Use a unique `DSE_LIFECYCLE_PORT` (pick something like 92xx) so you don't collide with concurrent efforts.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-481:`.

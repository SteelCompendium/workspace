# SC-545 r1 — reproduce in real Obsidian, root-cause, design the fix (no commits)

You are a diagnosis/design worker for ticket SC-545. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/decisions.md` (ticket facts verbatim, overlaps, baselines).
- Where the bug was seen: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r3-review-report.md` §3 item 4 (the `unload` probe). SC-537 build ledger: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc537-lp-callout-twins/` (r1 diag report explains Obsidian's Live Preview callout widget reuse and DSE's LP hosts).
- Probe tooling to reuse (copy into your own folder; never write into it): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r3-review-rv3/` — `harness-r537.mjs`, `r3-scenario.mjs`, `r3-instr.js`, `probe.sh`, `build.sh`. The r3 reviewer drove disable/enable via `app.plugins.disablePlugin/enablePlugin` over CDP.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (real-Obsidian lifecycle harness, devbox shapes).
- Plugin guidance: `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements/AGENTS.md` and its `.repo-docs/architecture.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks`, plugin at `.../draw-steel-elements`, branch `sc545-lp-callout-replug-clicks`, HEAD must be dse `f7c9c7ce` (= origin/develop). Verify with `git -C <abs path> log --oneline -1` first. Never work in `/home/scott/code/steelCompendium/workspace/` (shared main checkout); its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- Fresh worktree: run `npm ci` in the plugin dir first (node_modules is missing).

## 2. The task (diagnosis + design only — commit NOTHING to the branch)
Ticket, verbatim: "**Steps:** open a note with a `ds-counter` inside a callout in Live Preview. Turn Draw Steel Elements off and back on in Community plugins, without closing the note. Click + on the counter. **Result:** nothing is written to the file. There are no page errors. **Expected:** the click saves, or the card is redrawn so that it does."

Answer with measurements from **real Obsidian** (the lifecycle harness's Obsidian, not jsdom), on f7c9c7ce:

1. **Reproduce** exactly the ticket steps (disablePlugin + enablePlugin with the note open in Live Preview, then a real CDP click on +). Record disk before/after, the card's displayed value, page errors, console. Then map the boundary — which of these also fail after off/on:
   - (a) a `ds-counter` in a callout (the ticket case); (b) a plain fence `ds-counter` (not in a callout) in Live Preview; (c) the same in Reading view; (d) another block kind in a callout (e.g. a stamina bar or initiative tracker if cheap — but NOTE SC-535 below: off/on with an LP tracker on screen may hang Obsidian; if it hangs, record that as SC-535 overlap and move on, do not try to fix it); (e) does the card get redrawn at all after enable (is the DOM the old pre-disable DOM, a new one, or none)? (f) does editing the note (typing elsewhere), scrolling the callout off and back, or switching modes heal it? (g) a second off/on cycle.
2. **Mechanism, with file:line and a probe.** After `onunload`, what is left in the editor: old card DOM with dead listeners? A CM6 widget whose `eq` keeps the old DOM so Obsidian never calls the post-processor again on enable? Is the click handled by a stale plugin instance (old `this.app`/registry/closures, `isUnloaded` guard that silently drops the write), or by nobody? Which DSE code path drops it (e.g. `src/framework/pipeline.ts` click shield, `LivePreviewBlockHost.ts`, `viewRegistry.ts`, the write path) and why there is no error. Why does a plain fence (if it works) differ from a callout? Prove it with an instrumented probe (logs per step), not by reading alone. Check whether DSE's `onunload` should remove/neutralise its rendered elements, and whether enable re-renders open Live Preview views (Obsidian's `registerMarkdownCodeBlockProcessor` re-render on load, `app.workspace.updateOptions()`, `rerender`).
3. **Fix options** (2–3), e.g.: on load, force open markdown views to re-render DSE blocks (callouts included); on unload, tear down cards so the widget is rebuilt; make the stale card's click route to the live plugin instance. For each: where it changes (file:line), cost, risks (SC-537's callout-twin listener, SC-481 twin reuse, SC-540 click shield, scroll position (SC-472/SC-478), SC-535's hang, Reading view), and how a lifecycle scenario **G-S63** would assert it (phases, rough runtime in seconds — part 3 is near the tool limit, so propose which `--only` part it joins; G-S56 must stay last in its part) plus jest coverage. **Prototype the recommended option in-page if cheap** (injected into the real Obsidian page or a locally built bundle, not committed) and report whether the click then saves and the card shows the right value.
4. **Overlap check.** Running efforts: SC-544 (pending-write flush; a write pending at unload?), SC-472 (scroll pin), SC-551 (lifecycle/e2e CDP port handling), and SC-535 (off/on hang with an LP tracker; not ours). State whether your recommended fix touches their areas (file names) and whether SC-535 shares the cause.

Probes: keep all probe scripts, injected harness copies, vaults and logs in your private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r1-diag-<your agentId>/`, uniquely named files. If you must temporarily modify a file in the worktree, restore it; the worktree must end with `git status --short` empty in the plugin and the superproject.

## 3. Gates
None required (no code change). Building `main.js` for probes is fine. CURRENT at f7c9c7ce, for reference: jest 6297 / 1 skipped / 251 of 252 suites; lifecycle 47/47 as 21 + 16 + 10; e2e 128/128, 89/89.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-r1-diag-report.md`. It must open with a **≤10-line executive summary**: reproduced yes/no (which boundary cases fail), mechanism in one sentence with file:line, recommended fix in one sentence (and whether the prototype fixed it), G-S63 runtime estimate and proposed part, SC-535 overlap yes/no. Then the measurement table, probe evidence, options. Save 1–2 deciding screenshots (Live Preview, after off/on and a click; names describing what they show) in the ledger dir with the `sc545-r1-` prefix.

## 5. Return contract
Final text: raw facts, no prose — verdict, measured numbers, and the **absolute path of every evidence artifact** (report, screenshots, probe logs, probe scripts).

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every Obsidian/lifecycle run as ONE blocking foreground Bash call (under 600 s; scope with `--only=`). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; use `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file.
- Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target and no glob `rm` (both hang on a permission prompt nobody answers); overwrite with `>` or use fresh unique names.
- Never `pkill`/`killall` by pattern; kill only a PID you started, whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree or scratch folder. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — delete only paths you created and recorded. Never touch the shared `.superpowers/` dir beyond writing your own `sc545-` files.
- Use `DSE_LIFECYCLE_PORT=9545` (or 9546 for a second concurrent instance) for every Obsidian/lifecycle run so you don't collide with concurrent efforts; if your harness copy hardcodes a port, change it in your copy.
- If Obsidian hangs (SC-535), kill only your own Obsidian PID (verified as above) and continue.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-545:`.

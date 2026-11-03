# SC-545 r3 — independent adversarial review of the r2 implementation (no commits)

You are the SC-545 independent reviewer. You did not write this code. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/decisions.md` — "Owner rulings on r1" is authoritative (fix AB, versioned cross-version stash contract, fallback costs accepted, C rejected, D dropped, G-S63 at the end of part 3 per the dispatcher update).
- r1 diagnosis: `.../sc545-lp-callout-replug-clicks/sc545-r1-diag-report.md` (mechanism, Obsidian app.js 1.15.0 offsets, probe tooling under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r1-diag-k3p9/` — copy, never write into it; it includes `app-1.15.0.js`).
- r2 implementation report: `.../sc545-lp-callout-replug-clicks/sc545-r2-impl-report.md` and its gate logs `sc545-r2-*.log`; proposal `sc545-dse-verify-proposal.md`.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read-only).
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks`, plugin `.../draw-steel-elements`, branch `sc545-lp-callout-replug-clicks`, HEAD = `1d655b8f` on base `711f740d` (superproject `c590a35b`, CHANGELOG only). Verify with `git -C <abs path> log --oneline -1`. Review the diff `git -C <plugin> diff 711f740d..HEAD` plus the superproject CHANGELOG commit. Never work in `/home/scott/code/steelCompendium/workspace/`; its dse dirt is Scott's live vault — ignore it.

## 2. The task — execute and probe, not just read
Ticket, verbatim: "**Steps:** open a note with a `ds-counter` inside a callout in Live Preview. Turn Draw Steel Elements off and back on in Community plugins, without closing the note. Click + on the counter. **Result:** nothing is written to the file. There are no page errors. **Expected:** the click saves, or the card is redrawn so that it does."

1. Re-run the battery yourself on HEAD (tsc, `tsc -p e2e`, lint, jest, lifecycle in FOUR `--only` parts with G-S63 at the end of part 3, each part with its own port, e2e). Expected: jest 6307 + new tests passed / 1 skipped / 252 of 253 suites (verify the r2 numbers); lifecycle 49/49 as 21 + 16 + 8 + 4 (part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63`, part 4 `G-S57 G-S62 G-S61 G-S56`); e2e 128/128, 0 failed, 89/89; shots 592 0 FAIL 161/966; freeze 280/280; parity 0/0/24. Shots/freeze/parity: re-run only if r2's logs look off.
2. Red/green: G-S63 FAILs on a 711f740d bundle and PASSes on HEAD — measure it yourself. Is G-S63 vacuous anywhere (asserts that pass on base)? Mutate the source (your own mutants, beyond r2's) and see whether jest/G-S63 catch them.
3. Probe in real Obsidian (port 9547) beyond G-S63, e.g.: rapid off/on/off/on; disable then close the note then enable; two panes showing the same note; a hover popover / canvas card (expected uncovered — confirm nothing breaks); a callout edited while the plugin is off; the stash read by a mismatched version (hand-forge a stash with a wrong version/shape — fallback, no crash); the "update from a pre-fix build" path (load a 711f740d bundle, disable, swap in the HEAD bundle, enable); integrity: text above/below the block survives every write, two same-kind blocks don't cross-talk, a hand-edited block survives re-trigger; SC-537 twins and SC-540 click shield after off/on (callout must not open on a card click); scroll held in the normal path; the fallback's undo/scroll cost measured; memory/listener leaks (stash expandos left on elements, layout-ready handlers registered per enable without cleanup); no errors in console on disable while a remount is pending.
4. Contract: the stash holds only Obsidian-owned objects and plain data, has a versioned pinned key with a contract comment, and the reader validates shape (ruling). Check it.
5. Scope: changes outside the ruled files; overlap with SC-544 (landed in 711f740d: `flushPendingWrites` + re-entrancy guard in `viewRegistry.ts`/`ReadingModeBlockHost.replaceSource` — does the stash still run after the unload flush; does a flush during remount misbehave?), SC-472 (`registerFrameworkElements.ts`), SC-551 (harness ports), SC-535 (off/on hang — note anything, don't fix).
6. Review the dse-verify proposal text for accuracy (counts, four part lists, G-S56 still last in part 4) and the CHANGELOG bullet (plain words, accurate).

Probes and scratch: your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc545-r3-review-<your agentId>/`, uniquely named. Make no commits; restore any temporary edit; end with `git status --short` empty in plugin and superproject (or as you found it).

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc545-lp-callout-replug-clicks/sc545-r3-review-report.md`, opening with a **≤10-line executive summary**: verdict LAND-READY / NOT LAND-READY, counts by severity, gate numbers you measured, red/green result. Then findings by severity (HIGH/MEDIUM/LOW/INFO) each with file:line, failure scenario, and a prescribed fix. Logs as `sc545-r3-*.log` in the ledger dir.

## 4. Return contract
Final text: raw facts, no prose — verdict, measured numbers, findings list (severity + one line + file:line), and the **absolute path of every evidence artifact**.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run each gate as ONE blocking foreground Bash call (under 600 s; lifecycle as four separate `--only` calls). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc545-lp-callout-replug-clicks/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands; never `cd` inside a compound command; `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file.
- Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only a PID you started (check `readlink /proc/<pid>/cwd` or the command line is inside your worktree/scratch). Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`). Never touch the shared `.superpowers/` dir beyond your own `sc545-` files.
- `DSE_LIFECYCLE_PORT` 9547, 9550, 9551, 9552 (one per lifecycle part; 9547 for probes/e2e). Another SC-545 worker may use 9545/9546/9548/9549.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-545:`.

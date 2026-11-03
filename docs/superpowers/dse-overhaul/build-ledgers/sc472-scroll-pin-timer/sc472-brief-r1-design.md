# SC-472 r1 — reproduce under CPU load + design round (reviewer, no commits)

You are a worker for ticket-owner SC-472. **You never call the tracker (Linear)** — not to read history, not to post. Your context is this brief plus the files it names.

## 1. Context loading

Read first:
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/decisions.md` (current state; scope, evidence pointers).
- The build ledgers of the pins this ticket covers (read their ledger `.md` for the mechanism, then only the parts of the reports you need):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`
  `sc470-scroll-pin-panes-ledger.md`, `sc478-livepreview-scroll-ledger.md`, `sc479-embed-scroll-pin-ledger.md`, `sc522-lp-embed-scroll-ledger.md`, and `sc459-scroll-pin-gate-ledger.md`.
  Prior probe tooling you may reuse: `sc479-embed-scroll-pin/sc479-r1-probe-*.mjs.txt`, `sc479-r1-mkharness.cjs.txt`, `sc522-lp-embed-scroll/sc522-r1-probe-*.mjs.txt`, `sc522-r1-variant.sh`; SC-459's 8x-throttle evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r6-report.md` and `sc459-r6-throttle8-stock-1.log`.
- The source headers (they carry the mechanisms and measurements): `draw-steel-elements/src/framework/host/previewScrollPin.ts` (`PIN_TTL_MS = 2500` at :200) and `livePreviewScrollHold.ts` (TTL uses at ~:313, :428, :477).
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery rows 4/4b/5 (command shapes, lifecycle three `--only` parts) and the G-S8 / G-S15 / G-S18 / G-S42 / G-S52 entries.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer`, dse at `draw-steel-elements/` on branch `sc472-scroll-pin-timer` at **`ad018cd`** (= origin/develop). Run `git -C /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements fetch origin` and confirm `origin/develop` is still `ad018cd`; if it moved, report the new sha but work on `ad018cd`. Verify `pwd`/paths before any write. **This round commits nothing** — prototypes live as uncommitted edits or patch files; leave the tree clean at the end (`git -C … stash` or `git -C … checkout -- <files you touched>`; save your prototype as a `.patch` in the ledger dir first).

The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; never touch it.

## 2. The task

Owner's question (from the dispatcher's assignment, verbatim): "Decide whether the right fix is release-on-redraw everywhere (with the timer only as a backstop) rather than a longer timer; reproduce under CPU load first."

The ticket's own fix direction (not decided): "release the pin when the sizer's height has recovered, rather than only on a timer, and keep a timer as a backstop."

Do these, in order, and stop when you have the answer:

**A. Survey (short).** For every pin/hold that releases on, or is back-stopped by, `PIN_TTL_MS`, list file:line of: what arms it, every release condition, the timer. At least: the Reading-view note pin (SC-198/SC-470 floor rule), the SC-479 host pins + `overflow-anchor: none` for the pin's life, the SC-478 LP hold, the SC-522 LP embed-widget hold (its mount/redraw-batch release rule). Say which already release on the redraw and which rely on the timer alone. Also list every harness constant coupled to the TTL (`visual-harness/obsidian-lifecycle.mjs`: G-S8 ~L1631 "TTL 2500 ms + 2000 ms slack, hard cap 12 s", G-S18 ~L2391, G-S42 ~L3190, G-S52 ~L3970 "first sighting + 4500 ms", G-S15 ~L2217, and any `t.sleep(2500)` that waits out the TTL e.g. ~L1318/~L1465).

**B. Reproduce on stock `ad018cd` under CPU load.** For each timer-reliant pin, find the cheapest load that makes Obsidian's redraw land after the 2.5 s timer so scrollTop drops: CDP `Emulation.setCPUThrottlingRate` (SC-459 used 8x; 6x held) and, separately, one real-load run (e.g. a few busy-loop processes you start and kill BY PID — see footguns). Cases at minimum: G-S8's note with adoption off (the SC-459 case), the SC-470 LP-sibling-pane case, an SC-479 Reading host embed case (G-S42 geometry), an SC-522 LP embed case (G-S52 (a)). Record per case: write -> redraw latency, when the timer fired, scrollTop before/after. A case that never reproduces at 8x is a result; say so.

**C. Prototype release-on-redraw with the timer as a backstop**, for each pin that relies on the timer. The release should key on the redraw having happened and the content having its real height (e.g. sizer's natural height recovered / the new DSE root mounted / a MutationObserver batch like SC-522's), not on elapsed time. The backstop timer stays for writes Obsidian never redraws (adopted writes, no-op writes) — measure what the backstop should be (the cost of a long backstop is TTL-bounded phantom bottom space on adopted writes; SC-470's accepted trade). Consider also the alternative the owner must weigh: simply a longer timer (cost: longer phantom space on every adopted write). Re-run B's cases on the prototype at the same load: must hold. Also run, unloaded: adopted write (adoption on) — how long does the pin now stay? A redraw that never comes — backstop fires? Two writes 1 s apart — re-arm correct? Pin's own style-recalc cost unchanged (SC-470 Risk 1)?

**D. Recommend.** One design (release rule per pin + backstop value + harness constants to change + whether a new lifecycle scenario G-S59 under CPU throttle is worth it vs. extending G-S8/G-S42/G-S52 with a throttled phase; how it would discriminate — which control bundle FAILs it). Name the risks with numbers. If release-on-redraw is not right for some pin, say why.

Bound: four pin families, stop at a prototype. Do not explore unrelated scroll issues; list anything else you notice under Follow-ups.

## 3. Gates

This is a design round; no gate run is required. If you run lifecycle scenarios, use `--only=<ids>` and the command shapes in dse-verify row 4; the full lifecycle is 45/45 in three `--only` parts. Current expected numbers at `ad018cd`: jest 6245 passed / 1 skipped / 249 of 250 suites (fresh worktree 6244 / 2), lifecycle 45/45, e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/sc472-r1-design-report.md`. Every evidence file you keep goes in that same dir, prefixed `sc472-r1-` (the dir is shared global state). Prototype as `sc472-r1-prototype.patch`.

The report must OPEN with a ≤10-line executive summary: reproduced yes/no per pin with load level and numbers, recommended design in one line, backstop value, risks.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, plus the absolute path of every evidence artifact you produced. List `Follow-ups:` (things noticed, left alone) separately.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-472:`.
- Devbox: tools are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements -- <cmd>` (or `-- bash <script file>`). **Never a compound `cd X && …`**; never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS` and `bash -c '…; echo rc=$?'` always records 0: record exit codes from a script FILE run through devbox, and read each gate's summary line. Never pipe a gate into `tail`.
- **One gate per Bash call, in the foreground, blocking.** No `run_in_background`, no `Monitor`, no waiting on completion notices — they never wake you. If a run may pass 600 s (shots under load), start it with output to a unique log plus an rc file and poll that log/rc file with short foreground checks.
- Use `git -C <absolute path>` for every git command.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-<your agentId>/` with uniquely named scripts and logs; write scratch files with the Write tool, not heredocs.
- **Never `rm` with a shell-variable target** (`rm -f $S/x` hangs on a permission prompt). Never `rm -rf` a glob, never a shared `/tmp/dse-obsidian-lifecycle-*` glob, never `.superpowers/` — delete only a literal path you created. Overwrite logs with `>` instead.
- **Never `pkill`/`killall` by pattern** — concurrent efforts run the same commands. Kill only by PID, and only a PID whose command line contains `worktrees/sc472-scroll-pin-timer/` or whose `readlink /proc/<pid>/cwd` is inside it (`node visual-harness/shoot.mjs` has no path in its cmdline). Busy-loop load processes you start: record their PIDs and kill exactly those.
- Lifecycle uses its own Xvfb `:160–:199`, CDP port 9262; e2e `:200–:239`. Never `:1`. Other efforts (e.g. SC-537) may be running lifecycle concurrently — a port-busy exit 2 is environment; retry later. Check `/proc/loadavg` and record it with every timing measurement (other agents' load skews latency).

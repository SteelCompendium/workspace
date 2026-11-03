# SC-472 r3 — independent adversarial review of r2 (reviewer)

You are a worker for ticket-owner SC-472. **You never call the tracker (Linear)** — not to read history, not to post. You did not write this code; review it as an adversary.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/decisions.md` ("Owner rulings on r1" are the spec; the ledger wins over this brief).
- r1 design report `sc472-r1-design-report.md` and r2 report `sc472-r2-implement-report.md`, same dir (read executive summaries first; dive only where needed).
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery, lifecycle authoring rules, G-S8/15/18/42/52/56 entries.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer`, dse `draw-steel-elements/` branch `sc472-scroll-pin-timer` at **`ebd81e5e`** on develop **`eaf64ba6`**; superproject branch at **`276c3f71`**. `git -C … fetch origin` first; if develop moved, review on `ebd81e5e` anyway and report the new develop sha. **Do not commit to the branch.** Probes/controls are built from `git archive` exports in your scratch dir.

The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.

## 2. The task

Review `eaf64ba6..ebd81e5e` (dse) and the superproject CHANGELOG commit. **Execute and probe, not just read.** At least:

1. **Re-run gates:** tsc, lint, jest (expect 6302 passed / 1 skipped / 250 of 251 suites; fresh worktree 6301 / 2), lifecycle G-S8/G-S15/G-S18/G-S42/G-S52/G-S59 via `--only` (all ok), and the G-S59 discrimination once each: head ok, base bundle FAIL (a)+(b), plain-timer control FAIL (b). Check G-S59's anti-vacuity is real (it must FAIL as vacuous when no write's redraw lands after PIN_TTL_MS — e.g. run it with throttle 1x once).
2. **Correctness of the release rule:** can any pin release while the note is still collapsed (clamp)? Can any pin never release (stuck phantom space beyond the 20 s cap)? Re-pin during a redraw, two writes in flight, a write to a different note, plugin unload mid-pin, popout closed mid-pin, leaf navigated to another note mid-pin, hidden window. Risk 4 from r1 ("early release if the reader scrolls during a delayed redraw and virtualisation removes/re-inserts an arm-time root") — probe it.
3. **Owner follow-up to probe:** "SC-478 widget holds released by the timer, not on mount, in LP sibling runs" — sample pane B once in the LP sibling case at 8x: does the new backstop make that hold last longer, or a blank widget show longer, than stock? Numbers stock vs head.
4. **Risk 3 re-check:** Reading view, block deleted at the note's end, unloaded: blank-band duration and settled scrollTop, stock vs head (ruling: ACCEPT if ≤ stock + 1.5 s and the settled position equals stock's).
5. **64 px fix:** confirm the first pin no longer adds phantom space and a reader parked at the end is not snapped back at release; check nothing else depended on the padded height.
6. **Tests:** are the rewritten/new jest tests non-vacuous? Spot-check the mutation claims (pick 3 guards, remove each, the named test must go red).
7. **Cost:** per-frame work and rAF loop lifetime per pin, unloaded; nothing left running after release (no leaked rAF/observer/timer — check with a probe after 10 writes).
8. **Docs:** headers say what the code does; CHANGELOG bullet plain and accurate; `sc472-dse-verify-proposal.md` accurate (part layout fits 600 s per part, controls as measured).

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc472-scroll-pin-timer/sc472-r3-review-report.md`; evidence prefixed `sc472-r3-` in that dir. OPEN with a ≤10-line executive summary: verdict APPROVE / REQUEST_CHANGES, counts by severity, gate lines. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 4. Return contract

Final text to the ticket-owner, not a human: raw facts (verdict, shas, numbers), no prose, plus the absolute path of every evidence artifact.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-472:`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc472-scroll-pin-timer/draw-steel-elements -- <cmd>` (or `-- bash <script file>`). Never a compound `cd X && …`. Devbox eats `$?`; `bash -c '…; echo rc=$? > f'` always records 0 — record exit codes from a script FILE, read each gate's summary line, never pipe a gate into `tail`.
- One gate per Bash call, foreground, blocking. No `run_in_background`, no `Monitor`. If a run may pass 600 s, log + rc file and poll those.
- `git -C <absolute path>` for every git command.
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r3-<your agentId>/`, unique names; Write tool for scratch files, not heredocs.
- Never `rm` with a shell-variable target; never `rm -rf` a glob, a shared `/tmp/dse-obsidian-lifecycle-*` glob, or `.superpowers/`. Delete only literal paths you created.
- Never `pkill`/`killall` by pattern. Kill only PIDs whose cmdline contains `worktrees/sc472-scroll-pin-timer/` or whose `readlink /proc/<pid>/cwd` is inside it.
- Lifecycle Xvfb `:160–:199`, CDP 9262; e2e `:200–:239`; never `:1`. Port-busy exit 2 = environment, retry. Record `/proc/loadavg` with every timing.
- Never `just deploy*`, never `steel-etl site`, never a dse tag/release, never touch the freeze baseline.

## Addendum — r2's own findings to judge (owner, 2026-11-02)

9. **G-S59 design:** r2 found CDP 8x throttle alone did not reliably make phase (b)'s embed redraw late (0.4-0.5 s in some runs), so G-S59 also blocks the main thread for 4 s right after each write via a slow `modify` listener (throttle still applied). Judge: is this a faithful stand-in for the real mechanism (another pane's redraw blocking the main thread 3-10 s), or could it mask or manufacture behaviour real Obsidian never shows (e.g. the spin runs before/after DSE's own `modify` listener — does listener order matter to the pins armed in `modify`)? Is the anti-vacuity (a write must redraw after PIN_TTL_MS) still meaningful? Does it make G-S59 environment-fragile?
10. **Two deviations from r1's prototype** in `previewScrollPin.ts` (commit `c4f88bd7`): (i) a re-pin cancels a release check queued by the earlier redraw; (ii) a re-pin never lowers the sizer heights the next redraw must restore. Probe both for a stuck pin (never released before the 20 s cap) or a clamp.
11. Lifecycle is now 47/47 in FOUR `--only` parts (21 / 16 / 9 with G-S56 last / G-S59 alone); develop baselines at eaf64ba6: jest 6262 / 1 / 249 of 250, lifecycle 46/46, e2e 124/124 87/87, shots 592 161/966, freeze 280/280, parity 0/0/24. Head reports jest 6302 / 1 / 250 of 251, lifecycle 47/47.

# SC-533 r1 brief — measure the chrome border-width read with the profiler OFF (no product change)

## 1. Context loading
- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/decisions.md` (the ledger — current state; it outranks anything else).
- Prior evidence (the claim under test): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc522-lp-embed-scroll/sc522-r1-repro-report.md` lines 1-30 and 49 only. Its probe sources (`sc522-r1-probe-{common,lp,dom}.mjs.txt`, `sc522-r1-mkharness.cjs.txt`, `sc522-r1-run.sh`) are in the same dir and are a working CDP-into-real-Obsidian harness you may copy and adapt (copy into YOUR scratch dir; never edit the sc522 files). Its live scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae/` belongs to a RUNNING ticket (SC-522): read-only, never write, never run its scripts in place.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow`, dse at `.../draw-steel-elements`, branch `sc533-chrome-border-reflow`, expected HEAD `4deb8cf` (= origin/develop). First: `git -C <dse> fetch origin` and confirm `git -C <dse> rev-parse origin/develop` is `4deb8cf`; if it moved, rebase onto it and say so. Verify `pwd`-independence: use absolute paths everywhere.
- **You never call the tracker (Linear)** — not to read, not to post. The ledger and these files are your whole context.
- The code under test: `src/framework/chrome/mountChrome.ts` — `usedBorderPx()` (line ~93) and its only caller, the loop at line ~169-170, which for each of Top and Right does `getComputedStyle(anchor).border<Side>Width` and then `anchor.style.setProperty('--dse-chrome-frame-border-<side>', …)`. Note the read → write → read → write interleave, and that `mountChrome` runs once per chrome-bearing element (a tracker note may mount many).

## 2. The task — a measurement round. Do NOT change product code on the branch.
The ticket says: "**First step:** measure one tracker draw without the profiler, in Reading view and Live Preview. If the read costs real time, move it after layout or cache it." The dispatcher's instruction: "if the cost is not real, say so on the ticket and close it out with Scott rather than changing code." So this round answers ONE question with numbers: **does the border-width read cost real wall-clock time per tracker draw, or does it only absorb a style recalc the browser would pay at the next frame anyway?**

The trap to avoid: `getComputedStyle` forces a style recalc only when styles are dirty, and a profiler attributes the whole recalc to whoever reads first. If the same recalc would happen at the next frame regardless, removing the read moves the cost, it does not save it. The read only costs real time if (a) it forces SEVERAL recalcs per draw (thrash: interleaved writes between reads, or many mounts each forcing one) or (b) stubbing it measurably shortens the redraw.

Measure, profiler OFF (no CPU profiler, no tracing domain enabled during timed runs), in real Obsidian (same version the lifecycle gate uses, 1.15.0) under Xvfb you start yourself (never `:1`), with your own CDP port (pick one in 9530-9549 and check it's free):

1. **Scenes.** (R) a Reading-view note with the 25-hero tracker (the lifecycle fixture `embtracker.md` content is fine) opened directly; (LP) the same note in Live Preview; (E) a Reading-view host that embeds it (`embhost.md` shape) — the SC-522 scene where the cost was seen; and if cheap, (ELP) the same host in Live Preview. Trigger the redraw the same way SC-522 did (`app.vault.process` changing one value in the tracker block).
2. **Per draw, record** (≥ 10 reps per scene per variant, report median and p90):
   - `T_total`: from the `vault.process` call to the first rAF after the new DSE root has its children (same definition across variants).
   - Number of `usedBorderPx` calls per draw, and the wall time of each call (wrap with `performance.now()` in an instrumented bundle variant — the instrumentation must not itself read layout/style).
   - Number of `mountChrome` calls per draw.
3. **Variants** (temporary bundles built in YOUR scratch dir, never committed; build them from the worktree source with a patch you apply, build, then `git -C <dse> checkout -- src` to restore — or build from a scratch `git worktree add` of 4deb8cf under your scratch dir):
   - `stock` — 4deb8cf unmodified.
   - `instr` — stock + the timing counters only.
   - `stub` — `usedBorderPx` returns 0 without reading (geometry wrong, timing only).
   - `batched` — all reads for the anchor done before any write (read Top and Right, then set both). Optional, only if `stub` shows a real saving.
   Run variants interleaved (ABAB…) to cancel machine-load drift; record `uptime` load at start and end. The host is shared with other agents' gates, so note load and discard nothing silently.
4. **Verdict rule** (state which applies, with the numbers): the cost is REAL if `stub` beats `stock` on median `T_total` by more than the run-to-run spread (report the IQR) AND by ≥ 50 ms or ≥ 10 %; otherwise NOT REAL. Separately report the summed in-call time of `usedBorderPx` from `instr` (that is the "forced" share), and whether the first call per draw is the expensive one and later ones are cheap (the "it just paid the frame's recalc early" signature) or every call is expensive (thrash signature).

Do not build anything beyond these variants. No lifecycle scenario, no jest test, no commit on the branch this round. If the measurement cannot be made (environment), stop and return STATUS: NEEDS_CONTEXT with what blocked you.

## 3. Gates
None this round (no product change). The branch must end with `git -C <dse> status --porcelain` empty and HEAD still `4deb8cf` (or the rebased origin/develop). The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, never touch it. For reference only, the CURRENT battery at 4deb8cf is: jest 6153 passed / 1 skipped / 248 of 249 suites, lifecycle 41/41, e2e 124/124 ok, coverage 87/87.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-r1-measure-report.md`, opening with a ≤ 10-line executive summary (verdict REAL / NOT REAL, the stock vs stub medians per scene, calls per draw). Copy the raw per-rep data (JSON or CSV), the variant patches (`sc533-r1-variant-<name>.patch`) and your run script (as `.txt`) into the same dir, all `sc533-r1-` prefixed. Your private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r1-<your agent id or a random 8-hex suffix>/` — all scripts, logs, bundles and vaults go there, uniquely named.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, per-scene medians/p90/IQR for each variant, calls per draw, per-call times, load), no prose, plus the absolute path of every artifact you produced. If the report-file write is blocked by your harness, return the report inline. Report two lists at the end: `Drive-by fixes:` (should be none this round) and `Follow-ups:`.

## Footguns (all mandatory)
- Never `cd X && …` in a compound command. Use `git -C <abs path>` for every git command; use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements -- bash <script file>` for anything needing node/npm. Write scripts with the Write tool, not heredocs into scratch.
- Devbox eats exit codes: record them from inside a script file, and read each tool's own output lines as the truth.
- **No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` any shared `/tmp` pattern or the shared `.superpowers/` dir.** Write to fresh uniquely named files instead of deleting.
- **Never `pkill`/`killall` by pattern.** Kill only a PID you started and recorded, after checking `readlink /proc/<pid>/cwd` or its command line points into your own scratch dir / worktree. Other agents (SC-520, SC-522) are running real Obsidian + Xvfb right now.
- Run every timed batch as a blocking foreground call; no `run_in_background`, no `Monitor`, no waiting on a notification. Split work so each Bash call stays under 600 s. Redirect long output to a file in your scratch dir and read the file, rather than streaming.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read your process's own output, or write to a per-run unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-533:`.

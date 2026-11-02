# SC-533 r3 brief — independent adversarial review of the r2 fix

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/decisions.md` (current state; outranks this brief).
- r1 (measurement) and r2 (fix) reports, executive summaries first: `sc533-r1-measure-report.md`, `sc533-r2-fix-report.md`, `sc533-r2b-fix-report.md` (the final state) in the same dir; their harness scripts are there as `sc533-r{1,2}-*.txt`.
- Worktree dse: `/home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements`, branch `sc533-chrome-border-reflow`, branch HEAD `98ca88e`, base `4deb8cf` (origin/develop). `git -C <dse> fetch origin` first; review `git -C <dse> diff 4deb8cf..98ca88e`.
- **You never call the tracker (Linear).** You did not author this code.

## 2. The task — execute and probe, not just read
The fix (quoted from the ledger): r2 base "read both borders once BEFORE any custom-property write, and write the two vars on the PANEL element (`.dse-chrome`, the only consumer: styles-source.css ~16735) instead of the anchor, so the write dirties only the panel subtree. Pass bar: fix median within max(50 ms, 10 %) of stub in R and LP, and geometry byte-identical (shots/freeze unchanged)." — then the owner's 2026-10-30 ruling after that missed the bar: "TAKE `deferred`, refined — one module-level queue flushed in ONE requestAnimationFrame: read every pending anchor's two borders first, then write every panel's two vars (so many chrome mounts in one frame never interleave read/write). Skip (no read, no write) an entry whose panel is no longer connected; cancel on the owning Component's unload. Until the frame runs the panel uses the CSS `0px` fallback; it is display:none unless hovered/revealed, so at most a 1 px offset for one frame."

Probe at least:
0. **The deferred flush.** Popout windows (rAF from the anchor's own window, not the global; a mount in a popout and one in the main window in the same task), a window/tab that is hidden (rAF never fires: does anything leak or grow unbounded? does the queue hold strong refs to unloaded views?), a re-mount/adoption before the frame runs (old entry skipped, new panel gets its vars), unload before the frame (no write, no error), many mounts in one task (one rAF, all reads before all writes — verify with a probe in real Obsidian, not only jsdom), and a panel that is visible (hovered/focused, or revealed while collapsed) at the moment of a redraw: how far does it jump for that one frame?
1. **Correctness of the geometry.** Is every consumer of `--dse-chrome-frame-border-top/right` the panel itself (not a descendant pseudo-element, not the collapsed `.dse-chrome-summary`, not the anchor, not a print/steel/mobile/callout variant, not an element-specific override)? Grep sources AND the built `styles.css`. Can the panel ever be rebuilt, re-parented or moved to a different anchor after mount (sidebar pin, collapse/expand, adoption across a re-draw (SC-340), Live Preview widget reuse), losing the inline vars or keeping stale ones? Does anything read the vars back from the anchor (tests, e2e, visual-harness, parity)?
2. **The perf claim.** Re-run r2's harness yourself (copy into your own scratch dir) for at least scene R and LP with `stock` / `fix` / `stub`, profiler off, ≥ 8 draws each, variants interleaved; confirm fix ≈ stub within the pass bar. Check that the remaining single read is not just deferred to an equally expensive spot (e.g. the frame's own recalc got bigger): compare tPost, not just in-call time.
3. **Tests.** Does the new jsdom test actually fail on the old code (revert the src change in a scratch copy and run that one test)? Is it vacuous in jsdom (e.g. getComputedStyle spy never called because the anchor is detached)?
4. **Gates.** Spot-check the r2 report's gate lines; re-run jest and freeze yourself (freeze must be `freeze OK (280/280 …)`); re-run any gate whose reported numbers don't match CURRENT (jest 6153/1/248-of-249 plus the new tests, lifecycle 41/41, e2e 124/124 coverage 87/87, shots 592 0 FAIL host-leak 157/942, parity 0/0/24).
5. **Scope.** The diff must touch only `src/framework/chrome/mountChrome.ts`, its test(s) and `docs/superpowers/sc169-element-menu-panel-spec.md` (plus nothing in CSS, click handling, scroll-hold code). Flag anything else.

Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario for each, and a prescribed fix. Out of scope: SC-535 (plugin re-enable hang), SC-520, SC-522.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc533-chrome-border-reflow/sc533-r3-review-report.md`, opening with a ≤ 10-line executive summary (verdict APPROVE / FIX-REQUIRED, finding counts by severity, your measured medians). Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc533-r3-<random 8-hex>/`. Do not commit anything to the branch; leave `git -C <dse> status --porcelain` empty.

## 4. Return contract
Final text goes to the ticket-owner: raw facts (verdict, findings with file:line, measured numbers, gate lines you re-ran), no prose, plus absolute paths of every artifact. If the report write is blocked, return it inline. End with `Drive-by fixes:` (should be none) and `Follow-ups:`.

## Footguns (all mandatory)
- Never `cd X && …` in a compound command; `git -C <abs path>` always; `devbox run -c /home/scott/code/steelCompendium/worktrees/sc533-chrome-border-reflow/draw-steel-elements -- bash <script file>` for node/npm; scripts via the Write tool, not heredocs.
- Devbox eats exit codes; record them inside script files and read each gate's summary line. Never pipe a gate into `tail`.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` pattern or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a recorded PID whose cwd/command line is inside your worktree or scratch dir.
- Every gate / timed batch is ONE blocking foreground call under 600 s; no `run_in_background`, no `Monitor`. Redirect long output to a file and read it.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Never use display `:1`. Park the LP leaf on a Reading-view note before any plugin swap (SC-535).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; never touch the main checkout.
- You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT. If you ever send a message anyway, its first word must be `SC-533:`.

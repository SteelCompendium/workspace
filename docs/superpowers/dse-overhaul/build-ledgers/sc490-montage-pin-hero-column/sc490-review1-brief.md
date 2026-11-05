# SC-490 review1 brief — independent adversarial review of the pinned hero-name column

You are the independent reviewer for Linear ticket SC-490. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (current state of every decision): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/decisions.md` — the "Owner decisions" 1–9 are the spec you review against.
- Implementer brief and report: `sc490-r1-brief.md`, `sc490-r1-report.md` in the same dir (read the report's executive summary first; dive in only where needed). Evidence PNGs: `.../evidence/`.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc326-montage-scroll-ledger.md` (+ `sc326-montage-scroll/sc326-review1-report.md`, the review pattern that caught real bugs there).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (CURRENT block ~line 1282). DESIGN.md at `/home/scott/code/steelCompendium/workspace/DESIGN.md`.
- **Workers never call the tracker** — not to read, not to post.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column` (dse submodule `.../draw-steel-elements`, branch `sc490-montage-pin-hero-column`). Head under review: `b33787479e378ca724f153ee7b05931b8178482a` on base dse develop `0698550f`. `git -C <dse path> fetch origin` and report whether `origin/develop` moved. Do not commit to the branch; probes go in your private scratch folder. If you must try a fix to prove a finding, do it on a scratch copy (`git worktree add <your scratch>/... <sha>`), never the branch.

## 2. The task

Review the diff `0698550f..b33787479e378ca724f153ee7b05931b8178482a` against ledger decisions 1–9 and the ticket's "Things to watch" (quoted in `sc490-r1-brief.md` §2). **Execute and probe, do not just read**: render real boards in the visual harness's Chromium, scroll them, Tab through them, hover the row-action button, resize across the overflow threshold and across the 420px container breakpoint, toggle light/dark, coarse/fine pointer, emulate print. Specifically probe:
- A fitting board is pixel-identical to base (run freeze; also diff a few non-frozen montage shots against base yourself).
- The overflow-gating mechanism (if JS-set): correct at first paint, after a pane resize in both directions, after a write/rebuild (SC-326 scroll-restore path in view.ts), with two boards in one note, and cleaned up on unload (no leaked ResizeObserver).
- Pinned cells: opaque in both themes while overflowing (nothing shows through at mid-scroll), z-order above round cells and their hover/active states, the seal/quick-trio buttons in round cells never paint over the pinned column, the corner "+" and the row-action button stay clickable at any scroll position, and focus rings on pinned controls are not clipped.
- Tab and Shift+Tab walks from both ends: no Tab stop lands under the pinned column; Tab stops inside pinned cells never scroll the board; mouse click on a partly hidden cell does not jump the board under the press.
- ≤420px stacked layout: no sticky, layout identical to base. Print: no sticky, print bytes identical.
- The gate's can-fail proofs actually fail on the old code (re-run them yourself), and the gate is not vacuous (e.g. it really measures at mid-scroll, really hit-tests).
- The r1 resize "re-pin" workaround (ResizeObserver flips `data-overflow` off, forces a layout, flips it on, to fix a 1px sticky row-divider misalignment after a resize): probe for flicker, focus loss on a focused pinned control during a resize, ResizeObserver loop errors ("ResizeObserver loop completed with undelivered notifications"), and layout thrash during a continuous pane drag. Is the workaround needed and minimal?
- Re-run the full battery yourself (dse-verify order); report measured numbers against the expected ones in the r1 report.

## 3. Gates — expected numbers

At base `0698550f`: tsc + lint clean · jest 6378 / 1 / 253 of 254 (branch adds its own tests; fresh worktree reads one fewer passed / 2 skipped until shots has run) · lifecycle 49/49 in the five `--only` parts of SKILL.md row 4 (50/50 if the branch added G-S66) · e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592, 0 FAIL, button host-leak 161/966 · freeze `freeze OK (280/280 …)`, no rebaseline · parity 0 GAPs / 0 undeclared / 24 DECLARED. Use the branch's numbers from the r1 report as the comparison.

## 4. Command and safety rules (obey all)

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column/draw-steel-elements -- bash <script-file>`; never a compound `cd`; every git command `git -C <abs path>`.
- Record exit codes from a script file; redirect output to a log; read each gate's summary line; never pipe a gate.
- One gate per Bash call, foreground, blocking; lifecycle as five separate calls; no `run_in_background`, no Monitor (notifications never wake you). Only shots under heavy load may background, polled via its own log/exit-code file.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-<your agentId>/`, uniquely named scripts/logs, Write tool for files, private `DSE_CAMERA_TMP` inside it.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` under `/tmp` by pattern or the shared `.superpowers/`. Never `pkill`/`killall` by pattern — kill only by PID whose `readlink /proc/<pid>/cwd` is in your scratch or the worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Scott's live vault dirt in the main checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-review1-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-ROUND, counts by severity, measured gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, the probe that shows it (and its artifact path), and a prescribed fix. If the report-file write is blocked by your harness, return the report inline.

**Return contract:** final text to the ticket-owner — raw facts: verdict, head sha reviewed, counts by severity, measured gate lines, absolute paths of the report and every probe artifact (screenshots, logs). No prose padding.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-490:`.

# SC-520 r5 brief — rebase onto develop d689b719 + full battery (implementer)

If you are the r1–r4 implementer, resume. If you are a fresh agent, load everything from the files below. Your final text goes to the SC-520 ticket-owner, not a human.

## 1. Context loading
1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-decisions.md` — read the 2026-11-04/05 entries at the end (Scott's ruling, r5 plan, targets).
2. Prior reports (exec summaries first): `sc520-r1-impl-report.md`, `sc520-r2-fix-report.md`, `sc520-r3-report.md`, `sc520-r4-report.md`, reviews `sc520-r1-review-report.md`, `sc520-r2-rereview-report.md`, `sc520-r3-rereview-report.md` — all in the ledger dir.
3. Gates: read `.claude/skills/dse-verify/SKILL.md` from the CURRENT `origin/main` of the workspace (your worktree's superproject copy after you rebase it; never edit the main checkout's copy). Use its CURRENT block and row 4 (lifecycle FIVE `--only` parts).

**Workers never call the tracker (Linear).**

## 2. Scott's ruling (verbatim, 2026-11-05)
> "option B looks best, lets do that"

That is the already-built option B (panel ~14px left in Live Preview callouts with the block first). Rule F (callout is the sideways scroller) stays. No design change in this round.

## 3. The task
- Worktree `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click`: dse branch `sc520-lp-callout-menu-click` at `b746a3c` (7 commits on `4deb8cf`); superproject `273f2eda` on `49fc600a`.
- `git -C <worktree>/draw-steel-elements fetch origin`; rebase onto `origin/develop` (`d689b719` at dispatch; take newer if it moved and note it). Superproject: fetch and rebase onto `origin/main`; CHANGELOG `## Unreleased` conflicts keep all bullets. `npm ci` if package.json / lockfile changed.
- Expected conflicts (from the dispatcher):
  - `src/framework/chrome/mountChrome.ts` — SC-533 batched the panel border read per frame (`queueFrameBorders`, vars on the panel) next to the panel aria-label; our `click` `preventDefault` listener sits beside it. Keep both.
  - SC-540 added `armClickShield` handling in the callout click path (non-chrome card clicks inside a callout no longer open the source — formerly SC-463). Read what it does to `click`. Decide whether our panel/one-liner `click` `preventDefault` is now redundant, overlapping, or still needed. Keep the minimal correct set. G-S49 (real mouse, LP + RV, callout cases) is the judge; if you remove ours, show G-S49 still passing AND that a press on each panel button in a LP callout leaves the cursor unmoved. Report which you chose and why.
  - Lifecycle `visual-harness/obsidian-lifecycle.mjs` header/scenario list (many new scenarios since): keep G-S49 (our id), update the header count.
- Docs in YOUR worktree superproject (never `/home/scott/code/steelCompendium/workspace/`): keep the CHANGELOG bullet and DESIGN.md note accurate after the rebase.
- Draft the dse-verify CURRENT row for this change (one paragraph in the style of the existing CURRENT rows, plus the new lifecycle part layout including G-S49 and the G-S49 description line for row 4) and put it in your report under `## dse-verify proposal`. Do not edit SKILL.md.

## 4. Gates — full dse-verify battery on the final head (styles.css changes, so shots/freeze/parity MUST run)
Targets at `d689b719` + ours (ledger): tsc (incl. e2e) + lint clean · jest **6467 (6460 + our 7; explain any difference) / 1 skipped / 256 of 257** (after a shots run caches `obsidian-app.css`) · lifecycle **52/52**: the five CURRENT parts with G-S49 added to the G-S59 part (21 + 16 + 9 + 4 + 2; G-S56 stays last in part 4); each part one foreground call · e2e **`128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** (CHR-L01 load flake = SC-534: if only it fails, re-run once and report both) · shots **592, 0 FAIL, button host-leak 161/966** (modal 228, input 15/176, checkbox 7/116, prose 106 [212] if printed) · freeze **280/280** (if frozen bytes move, STOP with NEEDS_CONTEXT + rebaseline.txt + crops; never touch the shared baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED** last.

## 5. Shell rules (each has hung or wrecked a worker before)
- Fresh private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r5-<4 random chars>/`, unique names inside.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click/draw-steel-elements -- bash <script file>`; never `cd` inside a compound command. Record exit codes inside the script file; never pipe a gate; redirect to a log and read the summary line.
- One blocking foreground Bash call per gate / lifecycle part (timeout 600000). No `run_in_background` and no Monitor — EXCEPT shots, which may run in the background if it does not fit 600 s: then poll its own log file (unique per-run path) for the summary line; never wait for a completion notice.
- Shots: set a private `DSE_CAMERA_TMP` inside your scratch folder. No private `DSE_LIFECYCLE_PORT` needed (SC-551).
- `git -C <absolute path>` always. Write tool for scratch files.
- **No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a `/tmp` glob**; never touch `.superpowers/` outside your report file.
- Never `pkill`/`killall` by pattern; kill only by literal PID after checking its command line contains `worktrees/sc520-lp-callout-menu-click/` or `readlink /proc/<pid>/cwd` is inside it.
- Never key a wait-loop on a scratch filename or its contents from another run — stale logs match.
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- Commit after every coherent step; do not push, do not bump the pointer, do not land, never tag.

## 6. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r5-report.md`, opening with a ≤10-line executive summary (STATUS, new shas + bases, conflict resolutions, SC-540 decision, gate numbers). Then conflicts in detail, the SC-540 analysis, gates, `git range-diff 4deb8cf..b746a3c <newbase>..<newhead>` summary, `## dse-verify proposal`, `Drive-by fixes:`, `Follow-ups:`, artifacts with absolute paths. If the write is blocked, return it inline.

## 7. Return contract
Final text: STATUS, shas, measured numbers, absolute paths — raw facts, no prose. You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher); if you need input, end with STATUS: NEEDS_CONTEXT and the question in your report. Any message you do send starts with `SC-520:`.

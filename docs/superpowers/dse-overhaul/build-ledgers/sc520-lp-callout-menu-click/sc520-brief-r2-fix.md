# SC-520 r2 fix + rebase brief (implementer)

You are resuming as the SC-520 implementer (you wrote r1). If you are a fresh agent, load everything from files: this brief, the ledger, your r1 report, the review report. Your final text goes to the SC-520 ticket-owner, not a human.

## 1. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-decisions.md` — read the "RULINGS on review r1" entry (2026-10-29) and the 71437da relay entry.
2. Review report (findings, measurements, the reviewer's live-tested rule F): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r1-review-report.md`; reviewer scratch (probes `rv-probe-alt.js`, logs, crops; read-only): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-review-h3x8/`.
3. Your r1 report: `.../sc520-lp-callout-menu-click/sc520-r1-impl-report.md`; your scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r1-impl-k4v9/`.
4. Gates: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

**Workers never call the tracker (Linear).**

## 2. Worktree and rebase (do this FIRST)

- Worktree `/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click`, dse branch `sc520-lp-callout-menu-click` at `43d57e5` on `ed368f6`; superproject `c151b62` on `5902c18`.
- `git -C <worktree>/draw-steel-elements fetch origin`; rebase onto `origin/develop` (`71437da` at dispatch — SC-479, Reading-view scroll pin `previewScrollPin.ts` + lifecycle G-S42; also check for SC-526 in `styles-source.css`). Resolve conflicts keeping both sides; note the new base sha. `npm ci` only if package.json changed.
- Superproject: `git -C <worktree> fetch origin` and rebase onto `origin/main`; resolve CHANGELOG `## Unreleased` conflicts by keeping all bullets.
- Workspace-level files (CHANGELOG.md, DESIGN.md) live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc520-lp-callout-menu-click/CHANGELOG.md`) — never under `/home/scott/code/steelCompendium/workspace/`.
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- Commit after every coherent step. Do not push, do not bump the pointer, do not land, never tag.

## 3. The task — owner rulings (verbatim from the ledger)

> - MEDIUM-1 (callout with a chrome block loses sideways scroll for all its content) FOLD: adopt the reviewer's rule F (`.callout:has(> .callout-content …[data-dse-chrome]) { overflow-x: auto; overflow-y: hidden }` — the callout becomes the sideways scroller). ALSO try narrowing both callout rules to callouts whose FIRST content child is the chrome block (the only case where the panel overhangs the title; block-second hit fine on base) — adopt only if reliable in both LP and RV DOM; report either way. Add a wide-table-in-callout phase to G-S49 (real wheel deltaX moves a scroller; last column reachable) that FAILS on 43d57e5; jest pin for the rule. Fix the CSS comment, DESIGN.md note and CHANGELOG "nothing else changes" framing. The trade-off (title scrolls sideways with the content when a user scrolls such a callout) is a visible change -> goes to Scott in one batched ask with LOW-1, with crops. F is the default unless he says otherwise.
> - LOW-1 (Obsidian's `</>` covers Collapse's right 8px in a Live Preview callout; a press there opens the source) FOLD: default = option (b), give the panel the same 36px right clearance as the SC-502 one-liner, ONLY in Live Preview callouts (Reading view has no callout `</>`). Moves the panel ~28px left there -> Scott ask, batched with MEDIUM-1. Fix round produces revealed-panel crops for (a) unchanged, (b) moved, (c) panel stacked above `</>`, so Scott can pick. Extend G-S49 to hit-test Collapse across its whole width (fails on 43d57e5).
> - LOW-2 (flow-root rationale wrong) FOLD: reword the CSS comment, jest comment and DESIGN.md per the reviewer; drop the claim that G-S49 height checks prove flow-root.
> - INFO-1 ACCEPT (invisible <=5/255 shadow change in LP padding; Live Preview is not a frozen surface); fix the "pixel-identical" wording in docs/report.
> - INFO-3 FOLD the tighter census exclusion (exclude the two container elements themselves, keep descendants censused unless `[data-dse-chrome-item]`).

Notes:
- For (b): scope it to Live Preview callouts whose chrome panel would otherwise overlap the callout's `.edit-block-button`. Check every chrome element type at the top of a LP callout (the reviewer measured stamina/counter overlap 10x21.3, statblock 10x13.3, feature none) — all panel buttons and `</>` must hit-test across their full width afterwards. Do not move anything at the top level, in Reading view, or outside callouts.
- Crops for Scott (Live Preview, stamina bar first in a `> [!note]` callout, panel revealed, cropped tight to the callout's top-right, 2x): `crop-low1-a-unchanged.png`, `crop-low1-b-moved.png`, `crop-low1-c-stacked.png` (c may be produced by injecting CSS on the live page). For MEDIUM-1: `crop-med1-rest.png` (callout with stamina bar + wide table, at rest) and `crop-med1-scrolled.png` (same, scrolled fully right — shows the title scrolled with the content). Plus one combined labelled image `sc520-ask-crops.png` stacking them with plain text labels ("A: unchanged", "B: moved left", "C: panel on top", "Wide table at rest", "Wide table scrolled right"). Never rely on colour to tell them apart.
- New tests must FAIL on `43d57e5` (keep that bundle: build it into your scratch before you change code, or reuse `fix-bundle/` only if it matches 43d57e5) and pass on the new head. Record both logs.

## 4. Gates (full dse-verify battery on the final rebased head)

Targets at `71437da` + branch: tsc (incl. e2e) and lint clean · jest **6132 + your r2 additions passed / 1 skipped / 247 of 248** (compare after a shots run) · lifecycle **41/41** (40 on develop + G-S49) — the full run is ~14 min, so run it as two `--only` halves (≈20 + 21 ids) in two separate foreground calls · e2e **`124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** (CHR-L01 has a known pre-existing load flake, SC-534: if only CHR-L01 fails, re-run the full e2e once and report both) · shots **592, 0 FAIL**, button host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212] · freeze **280/280** (no rebaseline; if frozen bytes move, STOP with NEEDS_CONTEXT) · parity **0/0/24** last.

## 5. Shell rules (each has hung or wrecked a worker before)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r2-fix-<4 random chars>/`, unique names inside.
- `devbox run -c <abs dir> -- bash <script file>`; never `cd` in a compound command. Exit codes recorded inside a script file; never pipe a gate; redirect to a log and read the summary line.
- One blocking foreground Bash call per gate (timeout 600000). **No `run_in_background`, no Monitor, no background jobs.** Redirect long output — the 600s stream watchdog kills silent agents.
- `git -C <absolute path>` always. Write tool for scratch files.
- **No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a `/tmp` glob**; never touch `.superpowers/` outside your report file.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains `worktrees/sc520-lp-callout-menu-click/` or whose `readlink /proc/<pid>/cwd` is inside it.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match.

## 6. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-r2-fix-report.md`, opening with a ≤10-line executive summary (STATUS, new shas + bases, what changed per finding, gate numbers, path of `sc520-ask-crops.png`). Then per-finding detail, the first-child narrowing result, tests (FAIL on 43d57e5 / PASS log paths), gates, `Drive-by fixes:`, `Follow-ups:`, artifacts with absolute paths. If the write is blocked, return it inline.

## 7. Return contract

Final text to the ticket-owner: STATUS, shas, measured gate numbers, absolute paths of the report and every crop — raw facts, no prose. You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me); if you need input, end with STATUS: NEEDS_CONTEXT and the question in your report. Any message you do send starts with `SC-520:`.

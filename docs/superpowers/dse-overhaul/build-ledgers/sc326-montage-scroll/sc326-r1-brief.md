# SC-326 round 1 brief — implementer: montage board scrolls horizontally instead of clipping

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/sc326-decisions.md` — the decisions below are quoted from it; it wins over anything else.
- Background measurements: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-rereview2-report.md` (section "SC-326 (the round-3 follow-up)" and "MED-1 (NEW)" about `elementFromPoint` being viewport-relative — read only those two sections).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc326-montage-scroll`, plugin at `.../sc326-montage-scroll/draw-steel-elements`, branch `sc326-montage-scroll`. Verify `pwd`/paths before every write. **Never edit anything under `/home/scott/code/steelCompendium/workspace/`** except your report files in the ledger dir. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc326-montage-scroll/draw-steel-elements fetch origin` and confirm `origin/develop` is `188755b` (rebase onto it if it moved, and say so). Use `git -C <absolute path>` for EVERY git command — never `cd X; git …`.
- Read `draw-steel-elements/AGENTS.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running anything.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task

The montage board (`.dse-mt__board`) clips its right-hand round columns and the tally when the grid is wider than the card (high round counts; worse under `pointer: coarse`, where SC-299 set `--dse-mt-colmin: 9.2em`). Measured before: coarse, 900px pane, mid fixture — clipping starts at 5 rounds, 8 rounds hides +585.7px across 20 cells.

Owner decisions (verbatim from the ledger):

> 1. **Behaviour: horizontal scroll inside the board.** …
> 2. **Mechanism:** the board's frame clip (`.dse-mt__board { overflow: hidden }`, decoration tier, `styles-source.css` ~:4591) becomes `overflow-x: auto; overflow-y: hidden`, keeping border + radius on the visible frame. No change to the narrow (≤420px container) stacked layout.
> 3. **Zero pixel change when nothing overflows**: all frozen shots byte-identical, no rebaseline expected.
> 4. **Pinned (sticky) hero-name column while scrolling: NOT in this round.**
> 5. **Gate:** a real-Chromium "every cell reachable" check at high round counts, fine AND coarse pointer, with a can-fail proof (fails on the old `overflow: hidden`). Prefer a probe-local fixture over a new shot fixture so shot/freeze counts don't move.
> 6. Concurrent SC-422 (text-scale surfaces, CSS) — keep CSS edits scoped to the montage board rules.

Specifics:

- **CSS** in `styles-source.css` only (montage board rules). Check every other place that could still clip the board horizontally (`.dse-mt__board-wrap`, the montage card/section containers, print-scoped rules, the coarse block ~:4187) — the fix must make the overflow reachable in the real chain, not only on the one rule. Print: printing a scroll container clips like `hidden` did; leave print behaviour as-is unless it gets worse, and say what you found.
- Check that the board's interactive descendants (row action buttons, the coarse quick-trio, focus-visible outlines at the board's edges, any popover/menu anchored inside the board) behave no worse than before. `overflow-y: hidden` keeps vertical behaviour identical to today.
- Keyboard: tabbing to a control in a clipped column must scroll it into view (Chromium does this for scroll containers). Verify it.
- **Gate** — add an in-run check to `visual-harness/shoot.mjs` next to `assertMontageTrackWidths` / `assertMontageCoarseContainment` (same shape: loud named failure line, one `… OK (…)` line on success). It must, for a montage with a high round count (≥ 12 rounds; build the fixture inside the probe if the harness allows it, otherwise add the smallest fixture and report the shot-count delta), at a desktop-width pane, under BOTH fine and coarse pointer (reuse the coarse emulation the containment gate already uses):
  - assert the board is a horizontal scroll container when the grid overflows (`scrollWidth > clientWidth` and computed `overflow-x` is `auto`/`scroll`), and
  - assert EVERY cell (every hero × every round, plus the tally/total column and header cells) can be brought fully inside the board's visible frame by scrolling — e.g. `cell.scrollIntoView({inline:'nearest', block:'nearest'})` then compare its rect to the board's clientRect, and a hit-test on one control per cell after scrolling (mind MED-1: `elementFromPoint` is viewport-relative — scroll the page too, and report `null` hits as their own loud line, never as a wrong hit).
  - **Can-fail proof**: temporarily restore `overflow: hidden`, run the gate, capture the failure output, revert byte-clean (`git diff` empty for that hunk). Put both outputs in the report.
- A jest pin of the declaration if `test/dom/...montage...` already pins montage CSS declarations (SC-299 added `montage.test.ts` declaration pins — follow that pattern), with its own can-fail note.
- CHANGELOG: one bullet under `## Unreleased` in `draw-steel-elements/CHANGELOG.md` (follow its existing style). Do NOT touch the workspace-level `CHANGELOG.md`.
- Commit after every coherent step, on branch `sc326-montage-scroll`. Commit messages: no AI attribution trailers.

## 3. Gates (dse-verify battery, in order) — expected at base `188755b`

tsc (incl. `tsc -p e2e`) and lint clean · jest **5257 passed / 1 skipped / 229 of 230 suites** (plus your new tests; on a fresh worktree jest shows one fewer passed and 2 skipped until `npm run shots` has run once — compare after shots) · lifecycle **27/27 ok, 0 failed** · e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL, plus your new `… OK` line and the existing montage lines · freeze **`freeze OK (276/276 …)`** — must stay byte-identical, no rebaseline · parity **0 GAPs / 0 undeclared / 24 DECLARED**, exit 0.

`rm -f main.js styles.css` in the plugin root before `npx jest`. Use your own `DSE_LIFECYCLE_PORT` (e.g. 9286).

## 4. Footguns (mandatory)

- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc326-montage-scroll/draw-steel-elements && <cmd> > <log> 2>&1'`. Never trust an echoed `$?` inside `bash -c` (any quoting); read the tool's own summary line or devbox's own exit status. Never pipe a gate into `tail`.
- **Redirect long-running output to a file** rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND, one at a time (timeout up to 600000 ms). Do NOT background a gate and wait for a notification — it will never come.
- **Scratchpad is shared by every agent.** Use ONLY a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc326-r1-impl-<your agentId or a random suffix>/` with uniquely named scripts and logs. Never key a wait-loop on a scratch filename or its contents — stale logs from other branches will match.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc326-montage-scroll/`. Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir — delete only paths you created and recorded.
- Never touch the freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`). If any frozen shot moves, STOP and report it (with before/after crops) — do not rebaseline.
- Never create tags or releases. Never push. Never run `just deploy*` or `just wt-finish`.
- Load-sensitive jest suites (settings-tab, settings-preview, sidebarInitiative first test): on a timeout-shaped red, check `/proc/loadavg` and re-run before believing it.
- If the report-file write is blocked by your harness, return the report inline.
- **You cannot `SendMessage` me** — `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-326:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/sc326-r1-report.md`, opening with a **≤10-line executive summary**. Copy gate logs into the ledger dir as `sc326-r1-<gate>.log`.

Evidence: screenshots (Playwright, real Chromium, steel theme dark) of a ≥12-round montage at a desktop pane under coarse pointer — (a) at scrollLeft 0, (b) scrolled fully right showing the tally — plus the same before-fix at base `188755b` showing the clip (use a scratch `git worktree add` of the base into your private scratch folder, never re-point anything). Save as `sc326-r1-<name>.png` in the ledger dir.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — `STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, branch head sha(s), each gate's measured summary line, the can-fail output, the files changed, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of EVERY evidence artifact (report, logs, screenshots). No prose.

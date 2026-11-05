# SC-490 r1 brief — implementer: pin the montage hero-name column while the board scrolls sideways

You are the r1 implementer for Linear ticket SC-490. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the effort ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/decisions.md` — it is the current state of every decision. Follow its "Owner decisions" 1–9 exactly.
- Prior art (the SC-326 scroll fix this builds on): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc326-montage-scroll-ledger.md` and the reports in `.../build-ledgers/sc326-montage-scroll/` (skim `sc326-r3-report.md` and `sc326-review1-report.md` summaries for how the shots gate and the focus helper were built).
- Read `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column/draw-steel-elements/AGENTS.md` (if present) and the dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command shapes, freeze/parity rules; the CURRENT block ~line 1282). Read `/home/scott/code/steelCompendium/workspace/DESIGN.md` montage/board sections for the design language.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column` — dse submodule at `.../draw-steel-elements`, branch `sc490-montage-pin-hero-column`, currently at dse develop `0698550f`. Verify `pwd`/`git -C <path> rev-parse HEAD` before any write. Before starting: `git -C /home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column/draw-steel-elements fetch origin` and confirm `origin/develop` is still `0698550f`; if it moved, rebase onto it and say so in your report (the numbers below are for `0698550f`).

**The workspace-level files (CHANGELOG.md, DESIGN.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column/` — never under `/home/scott/code/steelCompendium/workspace/`.** The only things you write under `workspace/` are your report and evidence in the ledger dir.

The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign, never touch it.

## 2. The task

Scott, on SC-326 (2026-10-21), verbatim: "Pinning the hero column on the left is a great idea"

Ticket SC-490 (problem statement): since SC-326 a long montage scrolls sideways inside `.dse-mt__board` (`overflow-x: auto`). Scrolling to the later rounds and the Tally scrolls the hero-name column away, so you lose track of which row is which hero (on a coarse pointer the names already truncate, "K..", "B.."). Wanted: keep the hero-name column and the header corner cell pinned on the left while the round columns scroll under it.

Ticket "Things to watch", verbatim:
- "The pinned cells need an opaque background so rounds don't show through. Today the name cells use translucent banding over the card, so this is a look change on overflowing boards. The goal is that a board that fits looks exactly as before (freeze byte-identical)."
- "The row-action button and its hover state, the coarse-pointer layout, light, dark and print themes, and the ≤420px stacked layout (no pinned column there)."
- "Extend SC-326's gates: the shots-run `montage board scroll OK` check (every cell reachable, Tab stops fully visible) must still pass, and a pinned column must not cover the cell a Tab stop lands on. The focus-scroll helper in `BoardView.ts` (`keepFocusedCellInView`) has to account for the pinned column's width."

Implement per ledger "Owner decisions" 1–9. Key code anchors (dse submodule):
- `src/elements/montage/BoardView.ts` — `build()` (track list `--dse-mt-cols`), `keepFocusedCellInView` (~:127), `buildHeaderRow` (corner cell), hero rows.
- `styles-source.css` — `.dse-mt__board-corner` (~:4025), `.dse-mt__board-name` (~:4071), the `@container dse-mt (max-width: 420px)` blocks (~:4486, ~:5430), board frame + banding (~:4597–4720: `.dse-mt__board` overflow, name/cell banding `var(--dse-sheen-soft), rgba(255,255,255,0.015)` / light `rgba(0,0,0,0.012)`, the rowact hover reveal ~:4717, coarse-pointer block).
- `src/elements/montage/view.ts` — the rebuild + SC-326 scroll-restore path (overflow attribute must be correct after it).
- `visual-harness/shoot.mjs` — the `montage board scroll OK` gate (~:1100–1290). Note its existing "centre hit-tests to itself" check must now measure non-pinned cells to the right of the pinned column.
- Tests: `test/dom/elements/montage.test.ts`.

Commit after every coherent step (CSS, helper, gate, tests, CHANGELOG) — never leave work uncommitted across a gate run. Commit messages: no AI attribution trailers of any kind (Scott's global rule).

## 3. Evidence for Scott (required — he must see the look change)

Before you change any code, write a small probe script (in your private scratch folder, not in the repo) that renders a genuinely overflowing board (e.g. the gate's genuine probe-rounds source, 12 rounds, ~490px pane, 3 heroes with names long enough to truncate on coarse) in the visual harness's real Chromium, and captures board crops. Capture "before" on the untouched base, then "after" on your branch, same probe, same sizes:
- dark and light theme, fine pointer: (i) scrolled to mid-scroll, (ii) scrolled to the far end (Tally visible), (iii) at rest (scrollLeft 0) — at rest shows the opaque-background change on an overflowing board;
- one coarse-pointer crop per theme at the far end;
- one "after" crop with the row-action button hovered while scrolled (dark is enough).
Then make side-by-side composites (before left, after right, a text label "BEFORE" / "AFTER" burned in or in the filename) — one PNG per theme × state. Name files `sc490-r1-<theme>-<state>-before-after.png` in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/evidence/`. In your report, describe each image in prose naming colours plainly (e.g. "the name column is a solid dark grey-brown; round cells slide under it") — Scott is colorblind, so never let hue alone carry meaning.

## 4. Gates (dse-verify battery, in order, all from the dse submodule)

Expected at base `0698550f`: tsc + lint clean · jest **6378 / 1 skipped / 253 of 254 suites** (a fresh worktree reads 6377 / 2 until a shots run caches `visual-harness/dist/obsidian-app.css`; compare after shots) — yours = 6378 + your new tests · lifecycle **49/49** in the FIVE `--only` parts from SKILL.md row 4 (21 + 16 + 7 + 4 + 1; no private `DSE_LIFECYCLE_PORT` needed) — 49/49 unless you add G-S66 per decision 8 (then 50/50, G-S66 in part 3 or 4 before G-S56) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, button host-leak 161/966, plus your extended `montage board scroll OK` line · freeze **`freeze OK (280/280 …)`** with NO rebaseline — if any frozen byte moves, stop and report it (do not touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Also run the can-fail proofs from decision 7 (revert the sticky rule → the pinned check fails; restore the old `keepFocusedCellInView` → the Tab check fails); record the failing output lines, then restore.

Write proposed dse-verify CURRENT-block text (new numbers + the gate line wording) to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-dse-verify-proposal.md`. Do NOT edit `.claude/skills/dse-verify/SKILL.md` anywhere.

## 5. Command and safety rules (each has cost real time — obey all)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc490-montage-pin-hero-column/draw-steel-elements -- bash <script-file>`. Never a compound `cd X && …`; never `cd` inside a compound command. Every git command is `git -C <absolute path> …`.
- Exit codes: devbox's wrapper eats `$?` and pipes eat failures. Run each gate from a script file that records its own exit code to a uniquely named file, redirect output to a log file, and read the gate's own summary line. Never `| tail` a gate.
- **One gate per Bash call, foreground, blocking.** No `run_in_background`, no Monitor, no waiting for notifications — they never wake you. Lifecycle runs as five separate calls (one `--only` part each); e2e and shots one call each. Stay under the 600 s tool timeout. Only if shots must run under load longer than that, background it and poll its own log/exit-code file with short foreground checks.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-r1-<your agentId>/` with uniquely named scripts and logs. Use the Write tool for scratch files (no heredocs). Use a private `DSE_CAMERA_TMP` for shots inside that folder.
- **Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` anything under `/tmp` by pattern or the shared `.superpowers/` dir.** Delete only literal paths you created. Overwrite logs with `>` instead of deleting.
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never `npm ci` unless `package.json`'s obsidian version changed in a rebase.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc490-montage-pin-hero-column/sc490-r1-report.md`. It must OPEN with a ≤10-line executive summary (verdict, head sha, gate numbers, freeze result, mechanism chosen for decision 2 and why). Body: what changed (file:line), the opaque colours chosen per theme and how derived, the can-fail outputs, every evidence path with a prose description, `Drive-by fixes:` (only obviously-correct local fixes that cannot move a gate baseline) and `Follow-ups:` (anything left alone). If the report-file write is blocked by your harness, return the report inline.

**Return contract:** your final text goes to the ticket-owner — raw facts only: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse head sha, superproject head sha, each gate's measured summary line, freeze line, and the absolute path of EVERY artifact (report, proposal, each evidence PNG, gate logs). No prose padding.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task (e.g. a frozen byte moves and decision 2(b) also cannot hold it), end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-490:`.

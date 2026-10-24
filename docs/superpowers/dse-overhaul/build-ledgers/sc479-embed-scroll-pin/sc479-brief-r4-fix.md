# SC-479 r4 brief — fix round + rebase (implementer, resumed r2)

Final text goes to the ticket-owner. Workers never call the tracker.

## Context
- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc479-embed-scroll-pin/decisions.md` — read "Owner rulings on r3 findings" and the 2026-10-24 dispatcher move to f89f69f.
- r3 report `.../sc479-r3-review-report.md` (HIGH-1 section: failure numbers, the `alt-embanchor` bundle, the probe that measured text shift) and `.../sc479-r3-evidence/` (probe + build scripts; copy into your private scratch, never edit in place).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin`: dse branch `sc479-embed-scroll-pin` @ `84ba65a` on `253aa5f`; superproject @ `d53782a` on `104dd85` (dse pointer unstaged — keep it unstaged). Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject, never under `/home/scott/code/steelCompendium/workspace/`.

## Rulings (verbatim from the ledger)

> - **HIGH-1** (host-scroller `overflow-anchor: none` makes on-screen text jump when the write changes the embed's height and the reader is below it: remove a hero 16 -> -94 px, add a hero 16 -> 126 px, base text unmoved; 200 px padding above → 16 -> 216) → FOLD r3's measured fix: `.markdown-preview-view[data-dse-scroll-pin="id"] .internal-embed { overflow-anchor: none !important; }` instead of the rule on the scroller (r3 bundle `alt-embanchor`: G-S42 ok all 4 phases, every end/in case held, every shift case 0 px). Update jest exact-text tests + header; add **G-S42 phase (e)**: a height-changing write (add or remove a hero) with A parked below the embed — on-screen text must not move; add control **"anchoring stop on the scroller"** (= the 84ba65a rule) which must FAIL phase (e); the two existing controls stay.
> - **LOW-1** (header says shift happens only "if a future Obsidian…") → FOLD (rewrite with the HIGH-1 fix: anchoring stays on for the host; only embeds are excluded as anchor candidates).
> - **LOW-2** (`obsidian-lifecycle.mjs:2847` `t.sleep(1500)` after opening the second pane → `waitFor` the tracker in that pane) → FOLD (G-S42 is being edited anyway).

Phase (e) must not use a timed delay to win a race (dse-verify authoring rule); assert on per-frame samples from before the write, as the other phases do. Re-run your mutation check for the changed guard (the embed-anchor rule present only on host pins, removed on release/TTL/`releaseAll`).

## Rebase
After the fixes are committed: `git -C …/draw-steel-elements fetch origin develop` and rebase onto `origin/develop` (f89f69f at dispatch; use a newer tip if it moved and report it). On a lifecycle conflict keep every other scenario whole and re-apply only G-S42. Superproject: fetch and rebase onto latest `origin/main` (keep the dse pointer unstaged). `npm ci` only if `package.json`'s obsidian version changed.

## Gates on the final rebased head (full battery, dse-verify order)
tsc + lint clean · jest **6078 + SC-479's tests passed / 1 skipped / 245 of 246** · lifecycle **39/39** · e2e **123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs** · shots **592, 0 FAIL** with `button host-leak OK (114 … 684 …)` · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED** (last). Confirm `styles.css` is byte-identical to a base build.
Discrimination, 2 runs each, `--only=G-S8,G-S15,G-S18,G-S42`: head ok; base FAIL; "host pins without the anchoring rule" FAIL; "host pin disabled" FAIL; new "anchoring stop on the scroller" FAIL (phase (e)); G-S8/G-S15/G-S18 ok throughout. Report per-phase results for each bundle.

## Footguns (all still apply)
`devbox run -c <dse abs path> -- bash <script file>`; no `cd` in compound commands; `git -C` always; exit codes from inside a script file. **One blocking foreground gate per Bash call; no `run_in_background`, no detached subshells, no `Monitor`** (you slipped on this once in r2 — a full lifecycle can exceed 600 s: split it with `--only=` lists across calls if needed, and report the union). No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a shared `/tmp` glob. Never `pkill`/`killall` by pattern; kill only by PID inside your worktree. Scratch only in `…/scratchpad/sc479-r4-<agentId>/`, files written with the Write tool. Never key a wait-loop on a scratch filename or contents. Commit after each coherent step. No Co-Authored-By trailer (Scott's global CLAUDE.md).

## Report
`.../sc479-r4-fix-report.md` with a ≤10-line executive summary (shas, gates, discrimination table, HIGH-1 shift numbers before/after on your head). Updated proposed dse-verify text (lifecycle row 39/39 with G-S42, G-S42 entry with phases (a)–(e) and the three controls). Evidence under `.../sc479-r4-evidence/`. If the report write is blocked, return it inline. Final text: raw facts + absolute paths. Need input → end with STATUS: NEEDS_CONTEXT.

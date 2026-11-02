# SC-525 round 3 — fix round (implementer, resuming r1)

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-decisions.md` — read the section "Owner rulings on r2 findings (2026-11-01)"; it is your scope.
- Review report: `…/sc525-ref-nesting-retype/sc525-r2-review-report.md` — LOW-1 and INFO-3 are yours; read their full text. The reviewer's probe/test files are `sc525-r2-*` in that dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements`, branch `sc525-ref-nesting-retype`, head `af09bf2`, base `develop` @ `4deb8cf`. `git -C … fetch origin develop` first; if `origin/develop` moved past `4deb8cf`, rebase and say so.
- **You never call the tracker (Linear).**

## 2. Task
LOW-1 and INFO-3 only. Ledger rulings, verbatim:

> LOW-1 (same-view re-entrance double-mounts + orphan child; mutant M4 survives): FOLD into r3. Apply the reviewer's prescribed fix verbatim: per-resolution token in `IN_FLIGHT_REFS: Map<string, { view: ElementView<unknown> }>`; refuse when `cur && cur.view !== this && !cur.view.isUnloaded()`; `finally` deletes only if `IN_FLIGHT_REFS.get(guardKey) === token`; `private resolveGen = 0`, `const gen = ++this.resolveGen` at the start of `resolveAndMount`, and after each `await` `if (gen !== this.resolveGen) return;` before any errorCard/webCard/mountBase write. Plus the prescribed tests (same-ref and A→B variants, both release orders, one `.test-base-view`, ownedChildren back to pre-update count).

> INFO-3 (module-level IN_FLIGHT_REFS leaks across tests after a mid-hold failure): FOLD, test-side only (unique blockKey per harness setup in the SC-525 tests, or equivalent) — no new src export unless unavoidable.

Notes:
- The prescribed tests go in the `in-flight depth guard (SC-525)` describe of `test/dom/elements/refUnwrapView.test.ts`: hold, `run('@A')`, then `views[0].update(views[0].currentModel())`, release in both orders → exactly one `.test-base-view`, no nesting card, `ownedChildren` back to its pre-update count after a later `update`. A→B variant: only B's card at the end. Show them RED on `af09bf2` first (save the log), then green.
- Mutation: re-run r1's M1/M2 and the reviewer's M4 (drop `owner !== this` → now `cur.view !== this`) and M5; add M6 = drop the `resolveGen` checks. Every mutant must turn at least one test red.
- Check that a superseded resolution which returns early leaves nothing behind (no loaded orphan child, no map entry) — and that the self-reference case (reviewer's R3) still stops.
- **Out of scope — SC-536** (filed): the real-Obsidian cycle (MEDIUM-1) and the false nesting error with two live copies (MEDIUM-2). Do not add an ancestry guard, a depth cap, or any `RenderContext` change. Do not touch SC-481 (block save / identical-block redraw) or SC-522 (Live Preview scroll hold) areas.
- Commit inside the plugin after each coherent step (red tests, fix). No superproject pointer bump; never a tag.

## 3. Gates — `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)
Full battery on your final head, expected (develop @ `4deb8cf` + your r1 delta):
- tsc (incl. `-p e2e`) and lint (incl. `e2e/`) clean
- jest **6166 passed / 1 skipped / 248 of 249 suites** + this round's new tests (report the exact delta)
- lifecycle **41/41** (two `--only` halves, 20 + 21, one per Bash call)
- e2e **`124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**
- shots **592**, 0 FAIL, button host-leak 157/942 (34-record boundary), modal 228, input 15/176, checkbox 7/116, prose 106 [212]. Shots exceeds 600 s: run it with output to a file and, if the tool call times out, poll the run's own log/exit for completion — don't wait for a notification.
- freeze **280/280** (if anything moves, STOP and report — never touch the baseline)
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/sc525-r3-fix-report.md`, logs as `sc525-r3-*` there. Opens with a ≤10-line executive summary.

## 5. Return contract
Final text to the ticket-owner: verdict, commit shas, each gate's measured line, red→green test names, mutation table — no prose — plus the absolute path of every artifact. List `Drive-by fixes:` and `Follow-ups:`.

## Footguns (all mandatory)
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Redirect long output to a file; the 600 s stream watchdog kills silent agents.
- One blocking foreground Bash call per gate; no `run_in_background`, Monitor or `&` (shots: see above).
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc525-ref-nesting-retype/draw-steel-elements -- bash <script-file>`; never compound `cd X && …`; every git command `git -C <absolute path>`; record exit codes inside a script file.
- Never `rm` with a shell-variable or glob target; never `rm -rf` a shared `/tmp` glob or anything in `.superpowers/` you didn't create.
- Never `pkill`/`killall` by pattern; only PIDs whose command line or `/proc/<pid>/cwd` is inside this worktree.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc525-r3-fix/`, uniquely named files, created with the Write tool.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input → end with `STATUS: NEEDS_CONTEXT`. Any message you do send starts with `SC-525:`.

# SC-570 r2 — implement the RECOV-R07 test fix (implementer)

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/decisions.md` (ledger — rulings are authoritative), then the executive summary and §1-§2 of `sc570-r1-diagnosis.md` in the same dir (mechanism + probes).
- r1 artifacts (read-only, copy from them, never move/delete): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r1-reviewer-k7q2/` — `k7q2-prescribed-fix.diff` (the e2e change), `k7q2-jest-probe.test.ts.txt` (the jest probes P1-P5 to adapt), `k7q2-driver-probe.diff` (the env-gated lag / CPU-throttle probes used for red-on-base; NOT to be committed).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write`, dse at `draw-steel-elements/` on branch `sc570-recov-r07-double-write`, HEAD `79da77f8` (= dse origin/develop at dispatch). `git -C <abs>/draw-steel-elements fetch origin` then confirm `origin/develop` is still `79da77f8`; if it moved, rebase onto it and say so. `node_modules/` is already installed. Never work in `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (shared main checkout; its `demo-vault/` dirt is Scott's live vault — expected, never touch).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~320 KB — grep; read the battery table ~lines 20-135, devbox wrapping, the load-sensitive jest section, "Lifecycle and e2e notes (SC-480)").
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. The task (rulings quoted from the ledger)

> 2026-11-11 (after r1): r1 verdict **TEST** accepted — product writes are correct (debounce supersedes, flush serializes live model, adapter.process serializes writes; content right in every forced run). Fix = r1's prescribed e2e change (`dse.settle()` + `expectNoteBlock(... {current_stamina: 12, recoveries: 4})` before the Catch breath `waitForWrite` in RECOV-R07).

> 2026-11-11: amended: test-only fix may ALSO add jest cases to `test/dom/elements/staminaRecoveries.test.ts` pinning the one-window path the e2e now gives up — r1 probes P1 (dec, inc, inc, Catch breath within 399 ms → exactly one write, recoveries 3 / Stamina 22) P2 (Catch breath after the window → two writes, (4,12) then (3,22)) and P3 (as P2 with the stepper write held in flight across the Catch breath press and its write → (4,12) then (3,22), no stale re-write), asserting write CONTENT. No product change, no CHANGELOG entry.

> 2026-11-11: the implementer drafts `sc570-skill-proposal.md` (replace/remove the dse-verify SC-480 "RECOV-R07 is load-sensitive" bullet). Owner does not edit SKILL.md; dispatcher applies at landing.

Steps:
1. Apply the e2e change to `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` RECOV-R07 (per `k7q2-prescribed-fix.diff`). Do NOT rename the test or add a bracketed id to any title.
2. Add jest P1, P2, P3 to `test/dom/elements/staminaRecoveries.test.ts`, following that file's existing helpers/conventions (adapt r1's probe; don't duplicate scaffolding that already exists). Assert the content of every recorded write and the write count. Do NOT add P4/P5 unless already uncovered by existing tests and trivially small.
3. **Red-on-base proof for the e2e change:** with r1's uncommitted driver probe applied temporarily (lag 250 ms or CPU throttle 12x), RECOV-R07 FAILs without your spec change and passes with it. Run the stamina-recoveries spec alone for this. Then revert the probe (`git -C <abs> checkout -- <probe files>`); it must not be committed. For the jest cases: show they fail on a mutant (e.g. temporarily change `PERSIST_DEBOUNCE_MS` coalescing or make the flush serialize a click-time snapshot) and pass on real code; revert the mutant.
4. Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/sc570-skill-proposal.md`: the exact old bullet text and the replacement (or deletion), and a proposed CURRENT-numbers line shape for this landing. Do not edit SKILL.md.
5. Commit in the dse submodule on branch `sc570-recov-r07-double-write` (one or two commits, conventional `test(stamina-bar): …` messages; no Claude/AI attribution trailers). No CHANGELOG entry, no superproject edits. Commit after each coherent step.

## 3. Gates and expected numbers

Full battery minus the visual steps, in the worktree's `draw-steel-elements/`:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: baseline 7262 passed / 1 skipped with css cached (about 7261 / 2 in a fresh worktree) → expect baseline + your new cases. Report the exact count and whether css was cached.
- lifecycle: **55/55**, run as the five `--only` parts (each its own foreground call): `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59 G-S49 G-S73 G-S77 G-S83` (5). G-S56 stays LAST in its part. Report each part's count and wall time. If a part fails, re-run that scenario alone and check `/proc/loadavg` before believing it.
- e2e full: expect `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). Report the line, wall time and loadavg.
- Build `main.js` and `styles.css` and show their sha256 equals a clean `79da77f8` build's (build the reference in a scratch `git worktree add` of `79da77f8` at an absolute path in your scratch folder, or compare against `git show`-based build — your choice; record how). Byte-identical → shots 592 / freeze 280/280 / parity 0/0/24 carry; do not run shots/freeze/parity.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/sc570-r2-impl-report.md`, opening with a ≤10-line executive summary (shas, gate lines, red-on-base result).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS, commit shas, every gate's summary line, red-on-base results, `Drive-by fixes:` and `Follow-ups:` lists — no prose padding, plus the absolute path of every evidence artifact (logs, diffs) you produced.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r2-impl-<4 random chars>/` with uniquely named scripts and logs; the session scratchpad is shared by every agent — never a generic name like `gate.sh`. Create scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Run each gate as ONE blocking foreground call; no `run_in_background`, no Monitor, no waiting for a completion notice (it never comes).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write/draw-steel-elements -- bash <script-file>`; never `cd X && devbox …` compound commands. Devbox eats `$?` / `$PIPESTATUS` and `| tail` masks failures: record exit codes from inside a script file, read each gate's own summary line.
- Before `npx jest`: `rm -f main.js styles.css` in the plugin root (literal absolute paths). Jest timeouts under load (check `/proc/loadavg`) are not regressions — re-run the suite alone.
- **Never `rm -rf` a `/tmp` glob** (e.g. `/tmp/dse-obsidian-*`, `/tmp/dse-e2e-*`): a worker did this today and wiped other efforts' kept lifecycle FAIL dirs. Delete only literal paths you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same e2e/obsidian commands. Kill only a PID whose `readlink /proc/<pid>/cwd` or command line is inside YOUR worktree.
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Never put a bracketed ticket id (e.g. `[SC-570]`) in an e2e test title — the runner reads bracketed ids as scenario ids.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message, its FIRST WORD must be `SC-570:`.

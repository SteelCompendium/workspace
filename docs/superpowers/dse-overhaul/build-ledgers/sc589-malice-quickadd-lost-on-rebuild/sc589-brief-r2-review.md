# SC-589 r2 — independent adversarial review

You are the independent reviewer for ticket SC-589. You did not write this code. Execute and probe; do not just read.

## 1. Context loading

- Spec: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/decisions.md` (Owner rulings section is the acceptance criteria). The implementer's brief and report are in the same dir: `sc589-brief-r1-implement.md`, `sc589-r1-impl-report.md` (read the report's summary; treat its claims as claims to verify).
- **Workers never call the tracker** (Linear).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild`; plugin at `…/draw-steel-elements`, branch `sc589-malice-quickadd-lost-on-rebuild`. Diff under review: `git -C <plugin> log --oneline e0e49d4d..HEAD` (dse HEAD `d12e4675` (fix `d2885e05`, jest `ecc3deb8`, e2e+manifest+dse CHANGELOG `d12e4675`)) and the worktree superproject's CHANGELOG commit (`f8418870`). First `git -C <plugin> fetch origin` and report whether `origin/develop` is still `e0e49d4d`. Do not commit to the branch; if you need probe code, put it in a scratch copy or revert it, and say so.
- Battery reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~300 KB — read "The battery, in order", the devbox/exit-code sections, "Lifecycle and e2e notes" and the CURRENT entry; not the whole file).
- Prior art on the same rebuild path: SC-588 (`src/framework/kit/controlFocus.ts`, its use in `src/elements/initiative/view.ts`); ledgers in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc588-initiative-focus-after-rebuild/`.
- Scott's live vault dirt in the MAIN checkout's dse is expected; ignore it.

## 2. What to probe

1. Every rebuild path in the ruling: Advance round, Make/Relieve captain, Reset turns, Reset encounter → Yes, the - / + Malice stepper, collapse/expand of the Malice section, an external write to the note (edit the block text in the source while the draft is typed) — does the draft survive, and do the hint / Add-enabled state match it?
2. Add (button and Enter) clears the draft; a later rebuild does not resurrect the committed value. Invalid amounts (empty, `abc`, `-3`, `0`, decimals) — the restored box shows exactly what was typed, and Add behaves as on the base.
3. Two trackers on one note / the same note open in two panes / a hover preview + the main view: no cross-talk between drafts. A remount (close and reopen the note) — no stale draft leaks into a new view (ruling: not required to survive, must not corrupt).
4. Focus + caret: focus in a quick-add box when a rebuild happens (e.g. an external write while typing) — focus and caret/selection come back; no focus is pulled into the tracker by a rebuild when focus was outside it (SC-588 rule).
5. The note never contains the draft (inspect the file after each step).
6. Tests: the new jest cases fail on `e0e49d4d` (check out the base's `src/` into a scratch copy, or revert the src commit in a scratch worktree) and pass on HEAD; the e2e test title carries no bracketed ticket id; the M10 marker is a plain passing test and the known-bug comment is updated.
7. Real Obsidian: run e2e (and at least the lifecycle part containing the initiative scenarios, or all five if time allows) yourself.

## 3. Gates and expected numbers (at `e0e49d4d` baseline)

jest 7304 passed / 2 skipped fresh (expect higher with new tests) · lifecycle 56/56 in five `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4, G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6) · e2e baseline `270/274 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` → expect 0 failed, 4 known-bug (SC-257, SC-355, SC-384, SC-580), coverage Y/Y · shots/freeze/parity carry only if `styles.css` is byte-identical to a clean `e0e49d4d` build (verify the sha256 claim).

`rm -f main.js styles.css` in the plugin root before `npx jest`. On a timeout-shaped jest red, check `/proc/loadavg` and re-run that suite alone.

## 4. Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc589-malice-quickadd-lost-on-rebuild/draw-steel-elements -- bash <script file>`. Never trust an echoed `$?` inside `bash -c`; never pipe a gate. Capture exit codes in a script file and read each gate's own summary line.
- `git -C <absolute path>` for every git command; never `cd` in a compound command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc589-r2-review/`, uniquely named scripts/logs, written with the Write tool.
- **Never `rm -rf` a glob, never `rm` a `/tmp` glob, no `rm` with a shell-variable target.** Delete only literal paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/`.
- Never `pkill`/`killall` by pattern; kill only by PID whose cwd/command line is inside YOUR worktree.
- Each gate one blocking FOREGROUND call (lifecycle parts separately, e2e its own call, under 10 minutes). No `run_in_background`, no Monitor. Redirect output to files, then read them.
- Never key a wait-loop on a scratch filename or its contents.
- Never tag/release draw-steel-elements; never push; never `just wt-finish`.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-589:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc589-malice-quickadd-lost-on-rebuild/sc589-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, your gate numbers). Body: findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix; probe results per item in §2.

## 6. Return contract

Final text goes to the ticket-owner: raw facts — verdict, finding counts, gate numbers, shas — no prose, plus absolute paths of every artifact.

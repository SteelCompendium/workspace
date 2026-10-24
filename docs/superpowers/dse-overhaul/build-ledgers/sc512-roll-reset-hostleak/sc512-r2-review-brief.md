# SC-512 r2 brief — independent reviewer

You are the independent reviewer for SC-512. You did not author this work. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear).

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc512-roll-reset-hostleak/decisions.md` (task, dispatcher instructions, owner rulings — verbatim).
- The implementer's brief and report: `.../sc512-roll-reset-hostleak/sc512-r1-brief.md`, `.../sc512-r1-impl-report.md` (read the exec summary, then whatever you need).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (CURRENT block; "Button host-leak sweep" bullet ~line 197; widening rules ~line 380).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc512-roll-reset-hostleak`; plugin at `.../draw-steel-elements`, branch `sc512-roll-reset-hostleak`, expected head `635b6df` on base `c2758a2` (dse develop c2758a2). Do not commit to it; if you need to try a change, use a scratch `git worktree add` at an absolute path in your private scratch folder (below), or revert before finishing and say so.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore.

## 2. The task — execute and probe, not just read
Review the diff `c2758a2..635b6df` against the ticket and the owner rulings:
- "The disabled Reset (and the other disabled roll kinds) must STAY compared — the enabled kind is added, not swapped in."
- "Prefer a state reached by a REAL user interaction (click a modifier stepper), mirroring SC-501. Prefer zero new photographed shots / zero frozen-byte movement; if a new photographed state is unavoidable, ship a widening file per dse-verify (owner asks Scott)."
- Dispatcher: "Never widen exemptions silently."

Probe at least:
1. Re-run `npm run shots` yourself and confirm the new `button host-leak OK (…)` line, the boundary records/kinds, the modal/input/checkbox counts and freeze `280/280` (or the widening) match the report. Confirm the enabled `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` kind (no `|disabled`) is tagged and compared in all 3 states × 2 schemes, and the disabled one still is.
2. Anti-vacuity: make the new state fail to arise (e.g. stub the stepper click, or make Reset stay disabled) and confirm the sweep FAILS loudly rather than silently dropping the kind. Also confirm a genuine host leak on the enabled Reset would be caught (e.g. temporarily delete/alter the Reset's padding rule in the built CSS or styles-source so the host's `button` padding leaks, and see the sweep go red on the enabled kind).
3. Frozen bytes: confirm no existing capture's bytes moved, and that the new fixture/state never reaches a screenshot capture (or, if it does, that the widening file is correct and additions-only).
4. Other sweeps/gates the change could touch: parity, e2e/lifecycle (entry.ts is harness-only; confirm nothing else imports it), jest tests that enumerate gallery fixtures.
5. Code quality: comments accurate, assertion messages clear, no dead code, idempotence across dark/light loads.

## 3. Gates
Run shots + freeze + parity yourself (one blocking foreground call each). jest/lifecycle/e2e: re-run only if the diff touches anything they load; otherwise state why not. Expected at `c2758a2`: jest 6058 / 1 skipped / 245 of 246; lifecycle 37/37; e2e 123/123, 0 failed, 0 known-bug, 87/87; shots 592; freeze 280/280; parity 0/0/24.

## 4. Footguns (mandatory)
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc512-r2-review/`, uniquely named scripts/logs, written with the Write tool.
- `devbox run -c <abs plugin path> -- bash <script file>`; never `cd X && …` in a compound command; `git -C <abs path>` always.
- Exit codes recorded inside a script file, never via `bash -c '…; echo rc=$?'`.
- One blocking foreground gate per Bash call; no `run_in_background`, no Monitor; redirect output to a log file.
- No `rm` with a shell-variable target, no glob `rm`; never touch `.superpowers/` beyond your report, never `rm` `/tmp/dse-*` globs.
- Never `pkill`/`killall` by pattern; kill only PIDs whose `readlink /proc/<pid>/cwd` is in this worktree or your scratch worktree.
- Never key a wait-loop on a scratch filename or its contents.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with STATUS: NEEDS_CONTEXT and the question if you need input. Any message you send anyway must start with `SC-512:`.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc512-roll-reset-hostleak/sc512-r2-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-REQUIRED). Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario and prescribed fix. Then the probes you ran and their results.

## 6. Return contract
Raw facts: verdict, shas reviewed, measured numbers, findings count by severity, absolute paths of every artifact.

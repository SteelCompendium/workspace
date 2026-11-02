# SC-530 r3 — independent adversarial review (orchestration:reviewer)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, findings by severity with file:line, shas, measured numbers), plus absolute paths of every evidence artifact. Report file opens with a ≤10-line executive summary.

## 0. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc530-hostleak-aria-checked/decisions.md` (read all; the "Owner rulings" sections are the spec).
- r1 survey `sc530-r1-survey-report.md` and r2 implementation `sc530-r2-impl-report.md` in the same dir (exec summaries first; dive where you need to). r1 evidence/probe diffs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r1-a6e9f21b0f51c4756/`.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` battery table + "Button host-leak sweep" bullet; `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8.
- **You never call the tracker (Linear).** You did not author this code; review it as a stranger.

## 1. Environment
- Worktree `/home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked`, dse branch `sc530-hostleak-aria-checked` @ `2388872d` on `ad018cda`. `git -C <dse> fetch origin` and report origin/develop. Every git command `git -C <abs path>`.
- Do NOT commit to the branch. Probe edits are reverted with `git -C <dse> checkout HEAD -- <file>`; `git status --porcelain` empty at start and end (record both). Rebuild any gitignored build output you remove.
- Private scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r3-<your agentId>/`, unique names.

## 2. Review — execute and probe, don't just read
1. Diff `ad018cda..2388872d`: only harness/test files? any `src/` change? Built `main.js`/`styles.css` byte-identical to `ad018cda`?
2. Key correctness: `|checked` only for `aria-checked="true"`; the vertical-seal context suffix appends ONLY for seals in a vertical track; no other key in gallery or modal pass changes (measure base vs head with the sweep's own tag functions: kinds lost / renamed / first nodes moved, dark and light).
3. Can it fail? Re-run, on the head: a host-only leak on the checked tier row; on the vertical seal (idle and checked/current); a broken reach (no tier click). Each must go rc 1 naming the right kind. Also try to find a host-only leak that SHOULD be caught in this family and is not (e.g. a spent/horizontal-checked variant, a `mixed` value, another radio-like control anywhere the sweep tags). Look for vacuity: assertions that pass when nothing is tagged, selectors that can never match.
4. Shots on head: 592 PNGs sha256-identical to a `ad018cda` list (reuse r2's base list if its provenance is clear), freeze 280/280, button `161 … 966`, boundary 34 records identical names to base, modal 228, input 15/176, checkbox 7/116, prose 106 [212]. tsc, lint, jest (expected 6245 + r2's new tests, at base ad018cd / 1 skipped / 249 of 250). Break-prove r2's jest tests (each new test fails on a one-line break).
5. SC-526 rebase risk: SC-526 will later mount the Recoveries popover in the same sweep code (pref + pips click at the end of `mountClickRevealedForSweep`). Does SC-530's change conflict or interact (e.g. a popover radio carrying aria-checked)? Simulate if cheap.
6. Comments read correctly and cite SC-530; nothing in the Recoveries popover / `staminaRecoveryPopover` / pips touched (ruled out of scope).

## 3. Footguns (obey all)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked/draw-steel-elements -- bash <script file>`; no `cd` in compound commands; exit codes recorded inside script files written with the Write tool; never pipe a gate into `tail`.
- One gate per Bash call, foreground, output to a unique log. No background jobs/Monitor EXCEPT shots under load (dse-verify row 5): background with a unique per-run log + rc file, then poll that log/rc in foreground calls. Never wait on a completion notice; never key a wait on a generic scratch filename or another run's log.
- Never `rm` with a shell-variable target or a glob; never `rm -rf` under `/tmp/dse-*` or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs verified yours (`pgrep -af "worktrees/sc530-hostleak-aria-checked/"` or `readlink /proc/<pid>/cwd`).
- Redirect long output to files — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me. Need input → end with `STATUS: NEEDS_CONTEXT` + question. Any message you send starts with `SC-530:`.
- If the report write is blocked, return the report inline.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc530-hostleak-aria-checked/sc530-r3-review-report.md`: ≤10-line executive summary (verdict LAND-READY / NOT, finding counts by severity, key numbers), then findings HIGH/MED/LOW/INFO each with file:line, failure scenario, prescribed fix; then probes and measurements with evidence paths.

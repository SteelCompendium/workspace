# SC-487 independent review brief — round 1

## 1. Context loading

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/decisions.md` (rulings O1–O6 are the spec) and the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-impl-r1-report.md` (read its summary and measurement table; the rest as needed).
- Prior art: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/sc457-rereview-r4-report.md` (how the bug was found, R4-BREAK probe method).
- Gate rules and command shapes: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp`; dse at `.../draw-steel-elements`, branch `sc487-pin-zwsp`, base `origin/develop` = `d152ea4` (`git -C <path> fetch origin` and confirm). Review range: `d152ea4..HEAD` in dse plus the CHANGELOG commit(s) in the worktree superproject.
- **Do not modify the branch.** Probes go in a separate scratch clone or a throwaway `git worktree add` under your private folder (below), never into the reviewed worktree, and you remove only what you created.
- **You never call the tracker (Linear).** The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. The task

Adversarial review: execute and probe, don't just read.

1. **Measurement check.** Re-measure at least the trailing-U+200B, inside-the-name U+200B and trailing-U+FEFF openers in real Obsidian 1.14.4 (Reading view and Live Preview), with on-disk bytes confirmed (`xxd`). Does the implementer's table hold? Does the new `fenceLanguage` agree with Live Preview for every row, and does it never claim an opener neither mode renders?
2. **No regression of SC-457's table.** Every existing row of `test/unit/e2eIntegrity.test.ts` still expects what it expected at `d152ea4` (` ds-counter`, `ds-counter x`, trailing NBSP / U+3000 / FF, CRLF, etc.). Hunt for an opener that worked on `d152ea4` and breaks on HEAD.
3. **O1 guard.** Every entry point that can stamp `_dse_anchor` (chrome-menu Pin, `send-block-to-sidebar` command, initiative command, encounter builder hand-off, any other) refuses an unregistered alias with no vault write. Element ids (e.g. `statblock`) must not count as mountable (SC-471 MEDIUM-1). The Notice shows exactly once. No silent no-op is introduced where there was a Notice before.
4. **Integrity probes in real Obsidian** (O4): pin the trailing-U+200B block in Live Preview → anchor stamped, panel mounted, panel write lands; bytes above/below and the opening line incl. U+200B survive byte-for-byte; two same-kind blocks (one with U+200B, one without, same body) don't cross-talk on pin or write; CRLF note keeps CRLF.
5. **G-S33 is non-vacuous.** Run it on HEAD (passes) and against a build with the src change reverted (fails). A mutant of the guard alone and of the parse alone — does each make something fail?
6. Re-run the battery yourself at the reviewed head: tsc, lint, jest, lifecycle, e2e. Shots/freeze/parity may be taken from the implementer's logs if HEAD has only src/test changes since — say which you used.

Expected numbers: tsc + lint clean · jest 5769 + the new tests / 1 skipped · lifecycle `33/33 ok, 0 failed` · e2e `104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` · shots 592 / 0 FAIL · freeze `280/280` · parity 0 / 0 / 24. **Known environment issue (2026-10-23):** the system Obsidian auto-updated to 1.15.0, so `npm run shots` reports `HOST COPY DRIFTED` and stops before the host-leak and text-scale checks (PNGs still written, freeze still passes). That is not a finding against this branch; do not patch `shoot.mjs` or the pin. A pin-bump fix lands on develop separately, and shots get re-run after a rebase.

Command rules (each has stalled or broken a worker before):
- `devbox run -c <abs dse path> -- bash <script file>`. Never `cd` inside a compound command; every git command is `git -C <absolute path>`.
- Exit codes from a script FILE run through devbox; read each gate's own summary line.
- Scripts and logs ONLY in your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r1/`, uniquely named. Create files with the Write tool, not heredocs.
- No glob `rm`; delete only paths you created and recorded. Never touch `.superpowers/` outside `sc487-pin-zwsp/`.
- Each gate is ONE blocking foreground Bash call (split lifecycle / e2e / shots / parity). No `run_in_background`, no Monitor. Redirect output to a log file (the 600 s stream watchdog kills silent agents).
- Own `DSE_LIFECYCLE_PORT` (e.g. 9289). Never `pkill`/`killall` by pattern; kill only a PID you verified is yours (`readlink /proc/<pid>/cwd`).
- Never key a wait-loop on a scratch filename or its contents; the scratch dir is pre-populated across sessions.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-review-r1-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-FIRST, reviewed sha, finding counts by severity, gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. If the report-file write is blocked by your harness, return the report inline.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (verdict, sha, counts, numbers) plus the absolute path of every evidence artifact. You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, the first word must be `SC-487:`.

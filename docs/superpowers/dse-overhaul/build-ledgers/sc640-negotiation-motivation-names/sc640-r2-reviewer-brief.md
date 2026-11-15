# SC-640 r2 — independent reviewer brief

You are the independent reviewer for SC-640. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context

- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc640-negotiation-motivation-names/decisions.md` (ticket text verbatim + owner rulings 1-5 — the spec), then the executive summary and change list of `sc640-r1-implementer-report.md` in the same dir. Judge the CODE against the rulings, not the report's claims.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names`; plugin branch `sc640-negotiation-motivation-names` at head `fd702758`, base dse develop `a9f0af1d` (SC-639 landed; branch rebased; review the SC-640 commits only: `git -C <plugin> log a9f0af1d..HEAD`) (`git -C <plugin> fetch origin` and confirm `origin/develop`; if it moved, say so — do not rebase). Diff: `git -C <plugin> diff a9f0af1d..HEAD`. Superproject CHANGELOG commit `1eade0ec (parent d2d4e5fd)`.
- Do not commit to the branch. If you need scratch code changes (mutants), make them, test, and `git -C <plugin> checkout -- <file>` them back; confirm `git status` is clean at the end.
- **Workers never call the tracker.** Never edit the main checkout `/home/scott/code/steelCompendium/workspace/` (except your report). Its dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault: expected.

## 2. Task — execute and probe, not just read

1. Every name-keyed site: grep `src/` for any remaining `Map<string` / `.name ===` / `includes(` / `indexOf(` on motivations or pitfalls the fix missed (chrome summary, end band, focus, roll, serialize). A missed site = a finding.
2. Ruling 2 (one trimmed, case-insensitive rule everywhere): probe mixed spellings in `motivationsUsed` / `pitfallsUsed` vs entries; chip pressed state vs the roll tiers vs Same Argument vs Complete Argument must agree (SC-649's "what the card shows" invariant). Typed values (SC-638): `motivationsUsed: [5]` untouched round-trips as the number 5; a motivation `name: 2024`.
3. Ruling 3: duplicates (2 and 3 same-named, plus casing variants, plus several duplicated names at once): one chip per name, notice wording readable, per-row Spent writes only its own entry (verify the NOTE text), merged-chip spent / reuse logic, Complete spends every same-named entry, read-only host.
4. Ruling 4: nameless entries — label/aria/tooltip, chip works, the note never gains "Unnamed".
5. Integrity probes (writes into user files): text above/below the block survives; two negotiation blocks in one note don't cross-talk; a hand-edited block survives a re-trigger; unknown keys (SC-637) survive.
6. Mutation-check the new tests: revert key fix lines one at a time (e.g. back to name-keyed maps; drop the case-folding; `find` first in setMotivationUsed) and confirm at least one new test goes red each time. A test that stays green under its mutant is a finding.
7. Focus: SC-642's landing after Complete Argument (first Motivation chip) still works with merged chips; do not review SC-639 territory.
7b. The branch was rebased over SC-639 (Reset focus, `a9f0af1d`). Check the conflict resolution (`git range-diff` is unavailable across the pre-rebase head only if it was garbage-collected; otherwise pre-rebase head was `149268a8` (r1); the r1b commit was made before the rebase): nothing of SC-639's lost, its Reset-focus jsdom and e2e tests still pass, and merged chips do not break SC-639's focus landing.
8. Re-run: tsc, lint, full jest, and the e2e negotiation element (`npm run e2e -- --element=negotiation` or the README's form) plus ONE full e2e run (must end `0 failed`, `coverage: 417/417 pairs` unless the report justifies a new pair). Lifecycle/shots/freeze/parity: re-run freeze + parity only if the diff touches CSS or a frozen fixture.

Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read in parts; "Devbox wrapping", "Stale main.js", "THE exit-code footgun", "Lifecycle and e2e notes"). Baseline at `a9f0af1d`: jest 13353/2 fresh (13354/1 with shots cache) · e2e `607/620 ok, 0 failed, 13 known-bug, coverage: 417/417 pairs`. Expected on the branch: e2e 11 known-bug, implementer measured `611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs` and jest 13390/1 with the shots cache. Known e2e flakes: INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657) — a re-run passes.

## 3. Footguns

- Fresh worktree: `node_modules` may already exist from r1; if not, `npm ci` first.
- `rm -f` the literal `/home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names/draw-steel-elements/main.js` and `…/styles.css` before jest. **No other `rm`/`rmdir` anywhere, never in /tmp or the scratchpad, never a glob or a variable path.** Leave throwaway files in place.
- Run gates as blocking foreground calls with output to unique log files; no background waits, no Monitor. Never key a wait on a scratch filename or its contents. Redirect long output to a file (the 600 s stream watchdog kills silent agents). Exit codes only from a script file run via `devbox run -c <abs plugin dir> -- bash <script>`.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r2-rev/`, unique names; write files with the Write tool.
- `git -C <absolute path>` always; never `cd` inside compound commands; never `pkill` by pattern (kill only PIDs whose `/proc/<pid>/cwd` is in this worktree). `grep` is ugrep: use `command grep -a` on `e2e/run.mjs`.
- Never put a bracketed ticket id in a test title.
- You cannot `SendMessage` me; `to: 'main'` is the dispatcher. Need input → end with `STATUS: NEEDS_CONTEXT` + question. Any message you send anyway starts with `SC-640:`.
- If the report write is blocked, return it inline.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc640-negotiation-motivation-names/sc640-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, finding counts by severity, gate numbers you measured). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, and the prescribed fix. Mutation table.

## 5. Return contract

Raw facts: verdict, findings one line each with severity + file:line, measured gate lines, absolute paths of the report and every log/evidence file.

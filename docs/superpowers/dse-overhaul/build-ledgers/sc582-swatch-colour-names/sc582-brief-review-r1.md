# SC-582 independent review brief, round 1

## 1. Context loading

- Ledger (source of truth for what was asked): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc582-swatch-colour-names/decisions.md`. Owner rulings O2-O7 are binding; judge the work against them, and say if you think a ruling itself is wrong.
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc582-swatch-colour-names/sc582-impl-r1-report.md` (read its summary; do not take its claims on trust).
- Implementer's brief (what it was told): `.../sc582-swatch-colour-names/sc582-brief-impl-r1.md` — its gate section, footguns section, lifecycle part id lists and devbox command shapes apply to you verbatim.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names`. Plugin repo `draw-steel-elements` on branch `sc582-swatch-colour-names`; base dse `develop` `d0561a68`. Review `git -C <plugin abs path> diff d0561a68..HEAD` and the superproject's `git -C <worktree abs path> diff origin/main..HEAD` (CHANGELOG only expected; no pointer bump yet).
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~400 KB, read in parts). Do not edit it.
- You never call the tracker (Linear). You do not commit to the branch — you are a reviewer. Make probe edits only in a way you fully revert (and verify `git status` clean afterwards), or in a scratch copy.

## 2. The task

Adversarial review: execute and probe, do not just read. At minimum:

1. Correctness against O2/O3: every preset swatch's accessible name is exactly its colour name; the title tooltip unchanged; focus after a swatch click and after a custom pick equal to a preset (any letter case) lands on the named swatch. Probe the paths the implementer did NOT test (e.g. a note YAML colour in upper case; re-opening the window; two condition rows not cross-talking; the custom input's label unchanged per O4).
2. Test strength: revert only `src/` to `d0561a68` and run the new/changed jest tests — they must fail; restore and confirm `git status` clean. Report counts.
3. Leftovers: grep src, test, e2e, visual-harness, docs for `Color #` and `` `Color ${`` and stale "SC-582 will rename" comments. Check no e2e test title contains a bracketed ticket id (the e2e runner reads titles for scenario ids).
4. Re-run gates yourself: tsc, lint, jest, and the e2e run (expect `OBSIDIAN-E2E done: 290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` or the implementer's stated new totals). Re-run lifecycle part 4 (`G-S57,G-S62,G-S61,G-S56`) only if the diff touches anything the lifecycle reads; otherwise state why you skipped it. Freeze: verify the implementer's 280/280 claim from its log; re-run shots+freeze only if any CSS / harness rendering changed.
5. Changelog entries (dse `CHANGELOG.md` 7.0.0 section and the worktree superproject `CHANGELOG.md` Unreleased): accurate, plain, colours named in words, visible consequence first.

Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc582-rev-r1/` (prefix files `sc582-rev-`). Same footguns as the implementer brief section 4 — no glob or variable `rm`, never `rm -rf` a `/tmp` glob, no pattern `pkill`, `git -C` with absolute paths, redirect gate output to files, foreground gates.

You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT`. If you ever send a message anyway, its first word must be `SC-582:`. If the report write is blocked, return the report inline.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc582-swatch-colour-names/sc582-rev-r1-report.md`, opening with a ≤10-line executive summary: verdict (LAND / FIX), finding counts by severity, measured gate numbers. Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a failure scenario, and a prescribed fix.

## 4. Return contract

Your final text goes to the ticket-owner, not a human: verdict, findings one line each, gate numbers, report path, evidence paths. No prose.

## 5. Owner addendum after R1

The implementer reported plugin head `dcec985a` (fix `b59913b5`), superproject CHANGELOG commit `b4d0526e`, all gates green. It flagged that its test (c) (custom-input `change` to `#1E8449`) may not exercise the case-insensitive match because jsdom may lowercase `<input type=color>` values. Determine whether that is so; if the case-insensitive path in `setColor`'s focus lookup is untested, say how to test it (e.g. driving `setColor` with an upper-case hex by another route) and grade it.

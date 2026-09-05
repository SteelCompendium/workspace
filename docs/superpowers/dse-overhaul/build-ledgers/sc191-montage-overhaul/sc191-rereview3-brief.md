# SC-191 re-review 3 — scoped re-check of the fix-4 delta ONLY

You are the `orchestration:reviewer` that wrote `sc191-rereview2-report.md` (reviewer-L),
or a fresh replacement — if fresh, read that report's executive summary, "M-A" and "§2c"
sections first; they are the checklist. **Scoped delta check, not a fresh pass.** Final
text goes to the SC-191 ticket-owner (an agent): raw facts, no prose. **Never call the
tracker (Linear).** You cannot message the ticket-owner; if you need input, end with
`STATUS: NEEDS_CONTEXT` and the question at the top of your report. A stray message's
FIRST WORD must be `SC-191:`.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
  — last entry (2026-09-04, re-review-2 findings) is the ruling fix 4 implemented.
- Fix brief + report: `sc191-fix4-brief.md`, `sc191-fix4-report.md` (same dir). Every
  claim in the report is a claim to verify.
- Worktree (verify `pwd`; write nothing under `workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `c2a5cec`, base `origin/develop` `9227dd9`. Do not
  rebase. **The delta is `git diff eeabdc9..c2a5cec`.**
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Your own probes from re-review 2 are reusable:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/rereview2b/{probe-pipfix.mjs,probe-h1.mjs}`.

## 2. Task

1. **M-A**: re-run the print pip measurement on the final tree — `::after` computed
   background under print is the gold-brown print ink (`rgb(138,106,0)` or the token's
   print resolution), and the pip crop histogram shows non-zero fill pixels for BOTH ▲ and
   ▼ on the default (un-pinned) and strip-pinned print fixtures. Confirm the new test can
   fail (break the fill rule, red, revert). Confirm the fill lives in the flat print block
   (no nesting-specificity trap).
2. **2c**: on `montage-done` every round header is `past`; on `mid` the current round
   header is still "in play"; on a round-exhausted complete fixture (`failed` or construct
   one) headers are all `past`. Confirm the new tests can fail.
3. **Delta hygiene**: `git diff eeabdc9..c2a5cec --stat` — only the files the brief
   names (styles-source.css, BoardView.ts, the two test files, CHANGELOG.md if touched)
   plus nothing else. Flag anything outside that set.
4. **Regressions**: none expected; check the strip's screen-side pip still renders with
   the Steel gold + rim (unchanged bytes for `montage-strip-pinned--steel-dark.png` vs
   the fix-3 run — compare against your `rereview2b/logs/shots1.sha`).

## 3. Gates — full battery on the final tree, output to files

| Gate | Expected |
|---|---|
| tsc / lint | clean, exit 0 |
| jest | the fix-4 report's number (≥ 3694 / 1 skipped / 195 suites), exit 0 |
| shots ×2 | 508 PNGs, 0 ERROR, byte-identical; `host-copy pin OK` (1.14.0), `button host-leak OK` (678), `input host-leak OK` |
| check-freeze | exactly the 2 montage print lines FAILED, 0 others |
| parity | 0 / 0 / 16 |

Freeze package: `rebaseline.txt` (2) and `widening.txt` (14) hashes == YOUR run
(`sha256sum -c`), 0 collisions with the 210-line baseline. Compare against your
re-review-2 hashes and state which of the 16 lines moved (expected: all strip-bearing
print captures for the pip fill; `montage-done` also for the header). View the two
`--steel-print-after.png` crops and state in words that the pips are visible on the seals.

## 4. Bounds / report / return

Fix nothing; temporary breakage reverted; `git status --short` empty at the end. Report:
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-rereview3-report.md`,
written incrementally, ≤10-line executive summary first with verdict **LAND-READY /
FIX-ROUND-5**. Probes/logs under a per-run unique dir
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/rereview3/`.
Return: STATUS, verdict, per-item table, freeze result + moved lines, battery numbers,
crop description, artifact paths, `git status --short`. If the report write is blocked,
return it inline.

## 5. Footguns

Devbox wrapper; `sh` eats `$?`; never pipe a gate; redirect long output to files; never
background a gate and wait for a notification; no scratch-filename wait loops; never edit
the freeze baseline; never tag or push; stale superproject pin diagnosis for
`token-coverage`.

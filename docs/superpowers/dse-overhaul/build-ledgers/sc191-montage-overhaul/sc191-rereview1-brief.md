# SC-191 re-review 1 — scoped re-review of the fix-1 delta ONLY

You are the `orchestration:reviewer` that wrote `sc191-review1-report.md` (or a fresh
replacement — if so, read that report first; its findings are the checklist). This is a
**scoped re-review of the delta**, not a fresh full pass. Final text goes to the SC-191
ticket-owner (an agent): raw facts, no prose. **Never call the tracker (Linear).** You
cannot message the ticket-owner; if you need input, end with `STATUS: NEEDS_CONTEXT` and
the question at the top of your report. A stray message's FIRST WORD must be `SC-191:`.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
  — its final section lists which review-1 findings were folded (H-1, H-2, M-1..M-5, L-1,
  L-2, L-3, L-4, L-6, I-5, I-8) and which were dropped by ruling (L-5, I-1, I-2, I-3, I-4,
  I-6, I-7). **Do not re-raise a dropped finding.**
- Fix brief + report: `sc191-fix1-brief.md`, `sc191-fix1-report.md` (same dir). Treat every
  claim in the report as a claim to verify.
- Worktree (verify `pwd`; write nothing under `workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `7d4451a`. **The delta is `git diff b2f696e..7d4451a`.**
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. Task

For each folded finding: VERIFIED-FIXED / NOT-FIXED / REGRESSED, with file:line and how you
proved it (run the thing — the H-1 boundary probes, the print computed-style measurement
for H-2, the light-scheme wash measurement for M-2, the role=row histogram for M-4, the
width measurement for M-5, the L-2/L-6 probes). Confirm each new test is capable of
failing (break one assertion per finding class, revert). Look for regressions the delta
could have introduced in the slice-1/2 surfaces you already reviewed — and nothing else;
do not expand into slices 3–4.

Freeze package: re-run `npm run shots` twice + `check-freeze.sh`. Expected: exactly the 2
montage print lines mismatch, 0 others; `rebaseline.txt` (2 lines) hashes == your run;
`widening.txt` (10 lines: `montage-{done,failed,mid,narrow,old-shape}--steel-{print,realprint}.png`)
hashes == your run, no filename collides with the baseline. **View the "after" print crop**
`sc191-freeze-montage--steel-print-after.png`: no bordered white boxes, no half-opacity
cells, inked limit tracks, and state what it shows in words.

Battery on the final tree, in order, output to files: tsc/lint clean; jest ≥ the fix-1
report's number; shots 498 PNGs 0 FAIL byte-identical ×2; freeze as above; parity 0/0/16.

## 3. Bounds

Fix nothing; temporary breakage reverted; `git status --short` empty of tracked changes at
the end. Do not re-review the mocks. Keep the report short — this is a delta.

## 4. Report + return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-rereview1-report.md`,
≤10-line executive summary first with verdict **CLEAR-FOR-SLICE-3 / FIX-ROUND-2** and any
new finding by severity with file:line. Probe scripts/logs under a per-run unique dir in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`.
Return: `STATUS`, verdict, per-finding table, freeze result, battery numbers, the "after"
crop description, artifact paths, `git status --short`. If the report write is blocked,
return it inline.

## 5. Footguns

Devbox wrapper; `sh` eats `$?`; never pipe a gate; redirect long output to files; never
background a gate and wait for a notification; no scratch-filename wait loops; never edit
the freeze baseline; never tag; stale superproject pin diagnosis for `token-coverage`.

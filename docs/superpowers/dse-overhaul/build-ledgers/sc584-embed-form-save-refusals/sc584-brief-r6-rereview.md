# SC-584 r6 — scoped re-review of the r5 fix round (reviewer, resumed). Execute and probe.

You reviewed r1 (r2) and r3 (r4). The implementer rebased onto dse develop b4e7b4f4 (SC-566) and made the r5 fix
round on your r4 findings. Review the DELTA only. Final text to the ticket-owner, raw facts. Workers never call the
tracker. Every footgun of sc584-brief-r2-review.md §3 still applies.

## 1. Load
Ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/: decisions.md
("Owner rulings on r4"), sc584-brief-r5-fix.md, sc584-r5-fix-report.md (claims — verify). Range: the r5 commits on top
of the rebased r1+r3 commits (report lists them); `git range-diff` against `734d7745..3e81f9a5` to confirm the rebase
changed nothing else.

## 2. Check
- CRITICAL-1 closed: your block-embed and heading-embed two-counter callout shapes land in the + (lower) counter in jest
  and real Obsidian, RV and LP; G-S77 is real (fails on 3e81f9a5 / b4e7b4f4 bundles as the report claims).
- Record-first (or the guarded fallback, whichever r5 chose): attack it again with your r4 INFO-1 list (refused +, two
  + rounds, + / outside edit / +, Save then a second form, 600-line-stale record, part redrawn, callout deleted, sibling
  host, + on A then pencil on B, card pins, rename) plus remount onto a twin (`remountReused.ts:63`, mK) and unload.
- The implementer's NO-+ probe answer (two identical counters in one callout, pencil on the lower, Save): verify the
  cells it reports.
- MEDIUM-1 (CHANGELOGs + proposal accurate), LOW-1 (mK killed), LOW-2 (record nulled on unload).
- Re-run on HEAD: tsc, lint, jest, lifecycle part 3 and part 5 (`G-S59 G-S49 G-S73 G-S77`, 4/4), e2e. Expected: jest
  b4e7b4f4 7088/1 with the CSS cache (fresh 7087/2) + SC-584 net tests (report says how many); part 3 9/9; part 5 4/4;
  e2e `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`; styles.css = a clean b4e7b4f4
  build.

## 3. Report
sc584-r6-rereview-report.md, ≤10-line executive summary first (verdict SHIP / FIX FIRST, counts). Gate logs
sc584-r6-gate-<name>.log. Scratch: your sc584-r2-reviewer/ folder (new names). Return: verdict, counts, one line per
finding (severity, file:line, scenario), gate lines, `git status --porcelain` of the dse worktree (empty), absolute
paths of every artifact.

## 4. Owner additions after the r5 report (dse 796f5a87, 11 commits over b4e7b4f4; superproject fa43eb02)
- Range: dse `b4e7b4f4..796f5a87`; range-diff against `734d7745..3e81f9a5` (r1+r3 commits should be `=`).
- r5 chose the GUARDED variant (in `takePin`, a form whose own block was found inside a callout window takes the
  host's own-write record; guard `ownFence.lineStart !== section.lineStart`), not record-first (it broke the "embed
  redrawn after the +, 1000 lines changed around it" test). Attack the guard: a callout whose counter IS the first line
  of the section window (guard false) with a twin counter after it; a non-callout window with two fences; nested
  callouts; a quoted fence inside a heading section.
- jest now 7122/2 fresh; lifecycle part 5 `G-S59 G-S49 G-S73 G-S77` 4/4 (G-S77 27 s), 54/54 total.

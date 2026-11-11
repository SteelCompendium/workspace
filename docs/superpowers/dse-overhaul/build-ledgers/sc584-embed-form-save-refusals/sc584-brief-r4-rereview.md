# SC-584 r4 — scoped re-review of the r3 fix round (reviewer, resumed). Execute and probe.

You reviewed 525115b0 in r2. The implementer has rebased the branch onto dse develop 734d7745 (SC-572 then SC-575) and made the
r3 fix round. Review the DELTA only — not a fresh full pass. Final text to the ticket-owner, raw facts. Workers never
call the tracker. Every footgun of sc584-brief-r2-review.md §3 still applies (re-read them).

## 1. Load
Ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/:
decisions.md ("Owner rulings on r2" = what r3 had to do), sc584-brief-r3-fix.md, sc584-r3-fix-report.md (claims —
verify). Range: the r3 commits on top of the rebased r1 commits (the report lists them; compare `git range-diff` of
the old r1 range eeed5182..525115b0 against the new one to confirm the rebase changed nothing else).

## 2. Check
- HIGH-1 closed: your P1 P1d P2 P2n P3 refuse on HEAD (re-run sc584-r2-probe.test.ts.txt adapted to HEAD); case 1
  (short note, heading hover, whole long-note hover F3) still lands in jest and in real Obsidian (your r2 probe
  harness; keyboard path for the hover case, see SC-595).
- Attack the host-last-write record: a sibling host's write (same block in a second pane), a stale record reused by a
  later unrelated form open, two + rounds then the pencil, + then an outside edit then a second +, + on block A then
  the pencil on identical block B's card, record after a failed/refused write, note renamed between + and pencil.
- LOW-1 (P5 lands; callout `^id` still lands in the embedded callout; wrong-callout probes P11/P12 still refused/right),
  LOW-2 (mA mF mG mH killed or equivalent), LOW-3 (card-write behaviour no wider than base; G-S73), LOW-4 ((zc)
  replaced/labelled), MEDIUM-1/2 (CHANGELOG + proposal accurate; SC-595 not claimed fixed).
- Re-run on HEAD: tsc, lint, jest, lifecycle parts 3 and 5 (+ G-S77 if added), e2e. Expected: jest 734d7745 7085/1 with
  the CSS cache (fresh: one fewer passed, 2 skipped) + net new tests; part 3 9/9; part 5 3/3 (4/4 with G-S77); e2e
  `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs`; styles.css = a clean 734d7745
  build.

## 3. Report
sc584-r4-rereview-report.md in the ledger dir, ≤10-line executive summary first (verdict SHIP / FIX FIRST, counts by
severity). Gate logs sc584-r4-gate-<name>.log. Scratch: your existing sc584-r2-reviewer/ folder (new file names).
Return: verdict, counts, one line per finding (severity, file:line, scenario), gate summary lines, `git status
--porcelain` of the dse worktree (must be empty), absolute paths of every artifact.

## 4. Owner additions after the r3 report (r3 is DONE on base 734d7745: dse 3e81f9a5, superproject 43f99341)
- Range: dse `734d7745..3e81f9a5` (8 commits); range-diff against the old r1 range `eeed5182..525115b0`.
- (zm) now expects a LANDING in the lower block when the + makes it read like the block above (was a refusal):
  confirm the write goes into the form's own block only, in RV and LP, and that no twin shape is widened.
- The record keeps a full note string per embed/hover host until that host's next write: check it is released on
  host unload / view teardown and can never be consumed by a different host or a later unrelated form open.
- Callout + then pencil now gets its form pin from the record (INFO-3 partial): probe P13 with and without a +.
- e2e flaked twice at loadavg 20-28 (RECOV-R07 = SC-517, CENSUS-07): report whether either recurs for you.

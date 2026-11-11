# SC-584 r8 — scoped re-review of the r7 fix round (reviewer, resumed). Execute and probe.

Review the DELTA of r7 (structural guard + construct sweep) over 796f5a87. Final text to the ticket-owner, raw facts.
Workers never call the tracker. Every footgun of sc584-brief-r2-review.md §3 still applies.

## 1. Load
Ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/: decisions.md
("Owner rulings on r6"), sc584-brief-r7-fix.md, sc584-r7-fix-report.md (claims and the sweep table — verify). Range:
r7 commits over 796f5a87 (report lists them; if the base moved, range-diff the earlier commits).

## 2. Check
- Your r6 CRITICAL-1 shapes (header-less quote, first-line twin; block + heading embed; RV + LP) land in the lower
  counter in jest and real Obsidian.
- The guard is structural: try to find ANY window shape where a form's body search after a + still picks a twin
  (constructs in the r7 sweep and any the sweep missed: list item with two fences, a fence inside a table cell or HTML
  block if Obsidian renders one, a footnote, a quote inside a list, a callout inside a list). Fill gaps in the
  implementer's table with your own cells.
- The plain-window path (a card whose section is exactly its own plain fenced block) is unchanged from b4e7b4f4 except
  where the ruling says; "embed redrawn after the +, 1000 lines changed around it" still never lands in a twin.
- Record attacks Q1-Q10 still hold; G-S77's new trials are real (fail on the 796f5a87 bundle).
- MEDIUM-1: both CHANGELOGs and the proposal truthful (incl. the owner's note: block embed refused on develop; only the
  heading embed wrote the upper counter on develop).
- Re-run on HEAD: tsc, lint, jest, lifecycle part 3 and part 5, e2e. Expected: jest f2889351 7098 passed with the CSS cache (fresh one fewer, 2 skipped) + SC-584 net (report gives it);
  part 3 9/9; part 5 4/4; e2e `OBSIDIAN-E2E done: 256/263 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (base f2889351, SC-567);
  styles.css = a clean f2889351 build (the report gives the sha).

## 3. Report
sc584-r8-rereview-report.md, ≤10-line executive summary (verdict SHIP / FIX FIRST, counts). Gate logs
sc584-r8-gate-<name>.log. Return: verdict, counts, one line per finding, gate lines, `git status --porcelain` of the dse
worktree (empty), absolute paths of every artifact.

## 4. Owner additions after the r7 report (base f2889351; dse 0c7eb1ed, 14 commits; superproject 2e571b09)
- Range: r7 commits over the rebased r5 head; range-diff `b4e7b4f4..796f5a87` vs the rebased equivalents (must be `=`).
- jest 7169/2 fresh on HEAD; lifecycle part 5 = `G-S59 G-S49 G-S73 G-S77` 4/4 (G-S77 now 10 trials).
- Characterize cheaply (owner will file or drop): the r7 sweep says a + on a counter inside a list item / ordered list
  item / footnote is not written (base and HEAD). Is that refused in the note itself too, or only in an embed? With a
  Notice or silently? One or two real-Obsidian cells.

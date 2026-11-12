# SC-594 r3 — independent adversarial review of the hover / embed card-write rule (reviewer)

You are the r3 independent reviewer for ticket SC-594 (draw-steel-elements, "DSE"). You did not design or write this code. Your
final text goes to the ticket-owner, not a human: raw facts (verdict, findings by severity with file:line, shas, numbers), no
prose. **Workers never call the tracker** (Linear). This brief is self-contained and replacement-ready.

**Execute and probe, do not just read.** Write probe tests, drive real Obsidian through the lifecycle harness, run mutants, re-run
the gates. This area has a history: SC-584 needed three review rounds because a body search in a stale multi-block window kept
picking the identical twin. Assume the same class is still hiding somewhere and hunt for it.

## 1. Context to load
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/
- decisions.md (all; the rulings are the spec's authority).
- sc594-brief-r2-impl.md (what the implementer was asked for) and sc594-r2-impl-report.md (what it says it did — verify, don't trust).
- sc594-r1-design-report.md §A (measurements of what a hover card sees) — read the measurements, but form your own view of the rule;
  do not treat the design as correct.
- sc594-brief-common-gates-footguns.md — gates, expected numbers, binding footguns.
Prior art: /home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc584-embed-form-save-refusals/
(decisions.md Log; sc584-r4/r6-rereview-report.md for the twin attacks that worked before; sc584-r7-sweep-table.txt) and
sc480-twin-save-after-note-change/decisions.md.
Gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (~330 KB, read in parts): 1-218, "Block edit
form Save and embeds (SC-556)" (~335), "Hover preview modals (SC-595)" (~396; real-mouse hover footguns).

Worktree: /home/scott/code/steelCompendium/worktrees/sc594-hover-heading-card-write, dse branch sc594-hover-heading-card-write
(review range below). Do not commit to the branch. Probes go uncommitted in the
worktree and are saved as `.txt` copies in the ledger dir (sc594-r3-probe-*.txt); restore a clean `git status` at the end (literal
paths only).

REVIEW RANGE: dse e0e49d4d..0bf5989d (6 commits: b9e0f7aa fix, 0d02f083 / f37d9f00 / 9f1b1432 tests, 4250a2cb G-S92, 0bf5989d
CHANGELOG); superproject worktree branch 088a24fb (CHANGELOG only). Implementer's numbers: jest 7616 passed / 2 skipped; lifecycle
57/57 (p5 425 s); e2e 270/274 0 failed 4 kb 169/169; styles 5e5ff488 = base.
Owner-flagged points to cover (from decisions.md "Owner rulings on r2"): the memo binding deviation (first lookup OR next hover-link
event on the same hoverParent) and its stated residual (another link's event arriving before the popover exists); mutant mL2 (the r7
guard for cards) survives — equivalent or a test gap? Already ruled FOLD (do not report as findings): the stale SC-595 CHANGELOG clause,
the >180 s Bash note.

## 2. What to attack (minimum; add your own)
1. **Never a write into a twin** (SC-480 / G-S73 invariant), for card (+ / -) writes in hover previews (heading, block, whole-note)
   and embeds (`![[note#H]]`, `![[note#^id]]`), RV and LP, across constructs (plain fence, callout, header-less quote, quote whose
   first line is a fence, nested quote/callout, list item, footnote), with outside edits before the click, between two clicks, and
   identical blocks/sections added or moved.
2. **The `hover-link` record and the per-popover memo.** Pass-over: popover X open, pointer crosses link Y on the same hoverParent
   (Y's popover never opens), then + in X — with Y naming a heading whose body is identical to X's. Two panes, nested popovers, a
   popover redrawn after an outside edit, a popover opened by keyboard / Ctrl-hover, the plugin loaded while a popover is open, the
   buffer overflowing. Measure in real Obsidian when the first lookup happens relative to popover creation.
3. **Second + in the same preview** via the host's own `lastWrite` record — any shape where the record places the pin on the wrong
   block (record kept across a remount onto a twin, `setMountedBody`, section unload).
4. **No regressions:** forms (SC-584 G-S77 shapes, the r7 structural guard), non-embedded cards, SC-340 / SC-544 write ordering
   (the conditional await), SC-549 (+ then typing within 400 ms), RECOV-R07 / the 400 ms persist debounce.
5. **Tests with teeth:** run the implementer's mutants yourself and add your own; check G-S92 fails on an e0e49d4d bundle and that
   its control (scripted click inside the 17-44 ms window) really lands inside the window (not a vacuous no-write).
6. **Docs:** both CHANGELOG bullets and sc594-dse-verify-proposal.md say only what the code guarantees.

## 3. Gates
Re-run on HEAD: tsc, lint, jest (full), lifecycle part 5 (with G-S92) and part 3, e2e, styles.css sha vs a clean build of the base.
Expected numbers in sc594-brief-common-gates-footguns.md (adjusted by the implementer's reported jest delta and G-S92).

## 4. Footguns
All of sc594-brief-common-gates-footguns.md, binding. Private scratch folder (create it):
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc594-r3-review/
NEVER `rm -rf` a /tmp glob (a worker did this today and wiped other efforts' kept lifecycle FAIL dirs).

## 5. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc594-hover-heading-card-write/sc594-r3-review-report.md, opening with an
executive summary of at most 10 lines (verdict SHIP / FIX FIRST; counts by severity). Findings by severity (CRITICAL / HIGH / MEDIUM /
LOW / INFO), each with file:line, the failure scenario, base vs HEAD behaviour, evidence path, and a prescribed fix. Then gate numbers
(each gate's own summary line, part wall times).

## 6. Return contract
Final text: verdict, counts by severity, HEAD sha reviewed, each gate's summary line, `git status --porcelain` of the dse worktree,
and the absolute path of every artifact.

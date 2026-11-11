# SC-584 r7 — fix round on the r6 re-review (implementer)

Final text to the ticket-owner: raw facts. **Workers never call the tracker.** Every binding footgun of
sc584-brief-r1-impl.md §4 and sc584-brief-r3-fix.md §5 still applies (re-read them).

## 1. Load
Ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/: decisions.md
("Owner rulings on r6" + the owner's CHANGELOG note just above it), sc584-r6-rereview-report.md, sc584-r6-probe.test.ts.txt
(the reviewer's jest probes for the header-less quote shapes), sc584-r6-candidate-fix.py.txt, sc584-r5-fix-report.md.
Worktree /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals; dse HEAD 796f5a87 on base
b4e7b4f4 (develop has not moved; `git -C <dse> fetch origin` and rebase if it has, report the sha), superproject fa43eb02.

## 2. Rulings (verbatim from the ledger)
- "CRITICAL-1 (…): FOLD into r7. This is the THIRD round of the same class (a body search in a stale multi-block window
  picks the twin), so stop patching shapes: the guard must be structural — use the own-write record for a form whenever
  the card's section window is NOT exactly its own plain fenced block (reviewer's candidate: `(parseOpenFence(section.text,
  section.lineStart)?.prefix ?? 'x') !== ''`, or an equivalent that also covers a plain window holding more than one
  fence). Required sweep: enumerate every Obsidian construct where one section/window holds a fence plus other content
  (callout, header-less quote, nested quote/callout, list item / indented fence, a quote whose first line is a fence,
  two fences in one list item, footnote if possible) and for each, + on the lower of two identical counters then pencil
  then Save: jest for all (block embed + heading embed, RV- and LP-style hosts), real Obsidian for at least header-less
  quote and list item (add to G-S77). Report a table: construct x embed shape x base/HEAD."
- "MEDIUM-1 (…): FOLD — reword after r7, together with the owner's own CHANGELOG note above (block embed REFUSED on
  develop; only the heading embed wrote the upper counter on develop)." Owner note: "'(before, in a block embed it wrote
  the upper one with no Notice, and in a heading embed it already did)' is wrong against released develop — on b4e7b4f4
  the block embed REFUSED (Notice); only the unreleased r3 wrote the upper one; the heading embed wrote the upper one on
  develop. … say the heading embed used to write the upper counter, and drop the block-embed claim." CHANGELOG text must
  describe the mechanism truthfully (when the form uses the + record and when it does not). Superproject CHANGELOG is
  /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals/CHANGELOG.md, never the main checkout's.
  Update sc584-dse-verify-proposal.md §1 to the final guard.

Keep: every existing intended test (incl. "embed redrawn after the +, 1000 lines changed around it" — if the structural
guard makes that one refuse for a multi-block window, that is acceptable ONLY as a Notice refusal and must be stated;
it must never land in a twin). Out of scope: SC-594, SC-595, SC-596.

## 3. Gates (base b4e7b4f4). Expected:
- tsc (incl. `-p e2e`), lint clean.
- jest: r5 was 7122 passed / 2 skipped fresh; + r7's new tests.
- lifecycle 54/54 in five parts (part 5 `G-S59 G-S49 G-S73 G-S77`); report wall times; part 5 must stay ≤ ~480 s.
  Since only host code and G-S77 change, you may run parts 3 and 5 plus part 1 for the land gate ONLY IF you also run
  parts 2 and 4 — i.e. run all five (land gate requires lifecycle).
- e2e `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (RECOV-R07 = SC-517, CENSUS-07 =
  SC-593 known load flakes: re-run alone, then one more full run).
- styles.css = clean b4e7b4f4 build (`5e5ff488…`) -> shots/freeze/parity carry.
- Red: the new sweep tests that land on HEAD must fail on 796f5a87 for the header-less-quote first-line shape; G-S77's
  new trials fail on the 796f5a87 bundle. Mutants: the r5 set on the final code + one that restores the r5 guard.

## 4. Report / return
Scratch .../scratchpad/sc584-r7-implementer/ (create; unique names). Gate logs sc584-r7-gate-<name>.log in the ledger
dir. Report sc584-r7-fix-report.md (≤10-line executive summary; the sweep table; one line per ruling; commits; gate
lines; red; mutants; `Drive-by fixes:`; `Follow-ups:`). Return: STATUS, base sha, dse HEAD, superproject HEAD,
`git status --porcelain` both, gate summary lines, absolute paths of every artifact. You cannot SendMessage me;
NEEDS_CONTEXT if needed (stray messages start `SC-584:`).

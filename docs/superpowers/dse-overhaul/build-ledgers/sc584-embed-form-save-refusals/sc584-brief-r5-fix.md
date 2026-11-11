# SC-584 r5 — fix round on the r4 re-review, after a rebase onto dse develop b4e7b4f4 (implementer)

Final text to the ticket-owner: raw facts. **Workers never call the tracker.** Self-contained and replacement-ready;
every binding footgun of sc584-brief-r1-impl.md §4 and sc584-brief-r3-fix.md §5 still applies (re-read them).

## 1. Load
Ledger dir /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/:
decisions.md ("Owner rulings on r4" is your spec, quoted below), sc584-r4-rereview-report.md (CRITICAL-1 scenario,
cells, candidate fix), sc584-r4-probe.test.ts.txt (the reviewer's jest probes incl. the CRITICAL-1 shapes — adapt them),
sc584-r3-fix-report.md (your r3 report).
Worktree /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals; dse HEAD 3e81f9a5, superproject
43f99341.

## 2. Step 0 — rebase
SC-566 landed: dse develop is **b4e7b4f4** (minion pool modal text only). `git -C <dse> fetch origin`, rebase onto
origin/develop (report the sha if it moved further), `npm ci` if package.json changed. Clean b4e7b4f4 styles.css build
in your scratch folder for the CSS comparison.

## 3. Rulings (verbatim from the ledger)
- "CRITICAL-1 (…): FOLD into r5 — a wrong-block write this ticket introduced (block embed) plus its pre-existing twin
  (heading embed), one fix. Direction: for a FORM pin in an embed/hover, when this host's own-write record exists and
  its body equals the body at open, the record is the most exact position — prefer it over any body-matched own fence
  (record-first for forms); if record-first breaks an intended test, fall back to the reviewer's guarded fix (`if
  (forForm && embedded && this.ownFence.lineStart !== section.lineStart) { const w = this.pinFromLastWrite(); if (w)
  return w; }` before `const pin = …` in `takePin`) and say why. Jest tests for both shapes (block embed + heading
  embed; RV-style and LP-style hosts) and a lifecycle phase for both, in a NEW scenario G-S77 in part 5 (part 3
  measured 499 s — no more phases in G-S64)."
- "Probe-and-report only (no fix unless it is the same lines): the same callout with two identical counters and NO +
  first — pencil on the lower counter, Save. Where does it write on base and on HEAD (jest + Obsidian)? Owner then
  rules (SC-596 or fold)."
- "MEDIUM-1 (CHANGELOGs claim 'an identical counter elsewhere in the note is never chosen'): FOLD — reword to what is
  true after r5 (both CHANGELOGs + proposal)." Superproject CHANGELOG is
  /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals/CHANGELOG.md — never the main checkout's.
- "LOW-1 (record cleared in `setMountedBody` matters via `remountReused.ts:63`; mK not equivalent; untested): FOLD —
  add a test that kills mK."
- "LOW-2 (record never nulled on unload): FOLD — one line in `onRenderChildUnload` (hygiene, cheap)."
Out of scope: SC-594, SC-595, SC-596 (except what the probe above reports).

G-S77: new scenario in `visual-harness/obsidian-lifecycle.mjs`, inserted before G-S56 in SCENARIOS order (G-S56 stays
LAST), run in the fifth part `G-S59 G-S49 G-S73 G-S77`; lifecycle header/count 53 -> 54. Must FAIL on the 3e81f9a5
bundle (block-embed shape) and on b4e7b4f4 (heading shape), and pass on yours; keep the logs. If part 5 would exceed
~480 s, say so and propose a split. Update sc584-dse-verify-proposal.md (G-S77 row, part 5 ids, 54/54, part wall times).

## 4. Gates on the rebased branch (b4e7b4f4). Expected:
- tsc (incl. `-p e2e`), lint clean.
- jest: b4e7b4f4 CURRENT 7088 passed / 1 skipped with the CSS cache (fresh 7087/2) + SC-584's net (+27 at r3) + r5's
  new tests.
- lifecycle 54/54 in five parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54
  G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4); `G-S59 G-S49 G-S73 G-S77` (4). Wall times.
- e2e `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (RECOV-R07 = SC-517 and
  CENSUS-07 = SC-593 are known load flakes: if one fails, re-run it alone and then one more full run).
- styles.css = clean b4e7b4f4 build -> shots 592 / host-leak 163/978 / modal host-leak 39/234 / clip 147, freeze
  280/280, parity 0/0/24 carry. If it differs, STOP: NEEDS_CONTEXT.
- Mutants: re-run your r3 set on the final code plus mK and one for the CRITICAL-1 fix (e.g. drop the record-first
  branch).

## 5. Scratch, report, return
Scratch: .../scratchpad/sc584-r5-implementer/ (create; unique names). Gate logs: ledger dir sc584-r5-gate-<name>.log.
Report: sc584-r5-fix-report.md (≤10-line executive summary first; one line per ruling; design; probe answer; commits;
gate lines; red-on-base; mutants; `Drive-by fixes:`; `Follow-ups:`).
Return: STATUS, base sha, dse HEAD, superproject HEAD, `git status --porcelain` both, gate summary lines, absolute paths
of every artifact. You cannot SendMessage me; NEEDS_CONTEXT if you need input (stray messages start `SC-584:`).

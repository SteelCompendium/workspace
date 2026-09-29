# SC-232 round 3 — independent adversarial review of the Option A branch

You are an independent Opus reviewer. You did not write this code. Your final text goes to the
ticket-owner, not a human: raw facts only. Workers never call the tracker (Linear).
**Execute and probe, do not just read.**

## Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`
   (the "Owner rulings" section is the spec).
2. Survey (what Option A is and why): `.../sc232-cardname-scale/sc232-r1-survey-report.md`
   — executive summary + §6. Scripts in `.../r1-survey/scripts/`.
3. Implementer's report: `.../sc232-cardname-scale/sc232-r2-implement-report.md` (exec summary
   first; body where you need it). Evidence in `.../r2-evidence/`.
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, dse branch
   `sc232-cardname-scale`. Diff: `git -C <wt>/draw-steel-elements diff origin/develop...HEAD`.
   `git fetch origin` inside the clone first; expected `origin/develop` = `619c4bd` (report
   if it moved). **You make no commits** unless told; scratch goes to
   `.../sc232-cardname-scale/r3-*` or your session scratchpad.
5. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## Probe list (minimum)

1. **Print leak.** Re-run `npm run shots` and `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots`
   yourself: expected `freeze OK (260/260 …)`. Also construct a case the frozen set may not
   cover: realprint / export paths, and any print path that does not set `data-dse-print="on"`
   on an ancestor the new selectors key on (check how print is actually applied).
2. **Selector correctness.** Every family gets its site size and nothing else does: nested
   sub-feature heads inside statblocks/featureblocks stay generic 27px; a feature embedded in
   something else; modals (`.dse-modal` — note `:is([data-dse-element], .dse-modal)
   .dse-head__primary--left` ~7523); the reference-card family; the sidebar / by-SCC nested
   cards. Measure computed styles, don't read CSS.
3. **Side effects.** Any non-name text node whose computed size moved (em chains, row-gap,
   crest centering, right-rail centering). Head heights before/after.
4. **Narrow.** The container-width step-down: does it trigger at the right width, mirror the
   site's rule, and use the plugin's existing container mechanism? Name line counts and any
   mid-word break in the `*-narrow` captures. Does it collide textually or semantically with
   SC-284 (unlanded; its hunks are ~13588 and ~13671 of `styles-source.css`; the branch may be
   visible read-only via `git -C /home/scott/code/steelCompendium/workspace/draw-steel-elements branch -a`)?
   Try a trial merge of the two branches in a throwaway clone/worktree of YOUR OWN (never the
   main checkout) and report conflicts.
5. **Parity pairs.** Are the new pairs real (can they fail)? Prove it: temporarily revert the
   rule in a scratch copy and show the pairs WARN/GAP. Parity must read 0 GAPs / 0 undeclared
   WARNs / 16 DECLARED / exit 0 at the branch head.
6. **Gates.** Re-run tsc, lint, jest (`rm -f main.js styles.css` first; expect 4038 passed /
   1 skipped / 208 of 209 suites / 3 snapshots, or the implementer's stated count if it added
   tests), parity. Lifecycle only if the diff touches anything beyond CSS/JSON/comments.
7. **Evidence honesty.** Do the composites in `r2-evidence/` show what their labels say? Is
   the "Option B" column actually 27px everywhere?

## Rules

- **Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/`** (or your own throwaway path). Never `pkill`/`killall`
  by pattern.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`, gate command LAST, output redirected
  to a per-run unique log; read the tool's summary line. Foreground only — never background a
  job and wait for a notification. Never key a wait loop on a scratch filename or contents.
- Never touch the shared main checkout's working tree, dse `main`, or the freeze baseline.
  Never `rm -rf` the shared `.superpowers/` dir.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` the ticket-owner. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question; if you message anyway, the first word is `SC-232:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r3-review-report.md`,
opening with a **≤10-line executive summary** (verdict: LAND-READY-AS-PROPOSAL / FIX-FIRST;
counts by severity). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line,
failure scenario, and prescribed fix. Final text: verdict + finding list + artifact paths.

## Additional probes (owner, after reading the round-2 report)

8. **Harness change `690582f`** (`visual-harness/entry.ts`, `shoot.mjs`: `scrollToPrint`).
   Is it the right fix, zero-behavior-change for every other entry, and does the print twin
   still capture the same bytes? Is the screen capture still showing the `--stuck` state?
9. **Parity site-baseline regeneration in `611c638`** (site-inventory.json + 28 site-shots).
   It picked up ~7 weeks of unrelated live-site drift. Verify it is legitimate (which v2 build
   / site it was generated from, whether the drift is real site change vs environment
   artifact), and whether it would conflict with other unlanded branches that also touch
   `visual-harness/parity/baseline/` (list the local branches that do; read-only).
10. **The 8 new `ink` declarations** currently cite SC-367; the owner ruled they must cite
   **SC-368** (filed for exactly this). Flag as a finding; confirm they are scheme-scoped and
   are genuinely only `ink` (no size row hidden among them).
11. **The pre-existing 0-width grid column** the implementer saw on 4 nested names in
   `statblock-sticky-narrow`: confirm it exists at base `619c4bd`, and whether SC-284's branch
   fixes it (trial-merge probe from item 4).

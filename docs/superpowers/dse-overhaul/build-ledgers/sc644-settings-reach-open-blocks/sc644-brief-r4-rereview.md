# SC-644 r4 brief — scoped re-review + evidence screenshots

Final text goes to the SC-644 ticket-owner, not a human. Raw facts only.

## 0. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md` (read
  the "r2 result" rulings and the r3 entry).
- Your own r2 report: `sc644-r2-review-report.md`. The author's r3 report: `sc644-r3-impl-report.md` (read after forming
  your view of the delta). r3 brief: `sc644-brief-r3-implementer.md`.
- Same worktree, same safety rules as your r2 brief (`sc644-brief-r2-reviewer.md` §0-§2): no tracker, no edits to tracked
  code, no `rm` in /tmp or the scratchpad, no pkill by pattern, poll your own pid, `--only=` with an equals sign.
  New scratch subfolder: `…/scratchpad/sc644-r4-rev/`.

## 1. Scoped re-review (the DELTA only, not a fresh full pass)

- Rebase: `git range-diff 620d5774..92940547 12aaf5b5..<r1 commits rebased>` — r1 commits must be unchanged in substance.
  Branch must sit on dse `origin/develop` (12aaf5b5 or newer — check), superproject on current workspace `origin/main` with
  exactly: one CHANGELOG commit + ONE pointer bump to the final dse head. Diff of the superproject vs origin/main: only
  `CHANGELOG.md` and `draw-steel-elements`.
- Also the r3b delta (author's follow-up, ruled FOLD in the ledger "r3 result"): the hero sheet's "Edit definition"
  button hands focus back when removed while focused. The author ran only tsc/lint/jest on r3b — YOUR full e2e and
  lifecycle runs are the final-head gates, so they must be on the final head sha.
- Each folded finding (MEDIUM-1, LOW-1..6) closed as prescribed (or the author's stated deviation is right). Re-run your
  r2 probes (P2b, P3, P5, P10, P11, P12, R2P-01..03) against the new head; re-run the mutants that survived (M11) and the
  new tests' mutants.
- LOW-6 touched the shared e2e driver: confirm the author's two full e2e runs, and run one full e2e yourself.
- Gates you re-run: tsc, lint, jest, e2e full. Lifecycle: all 7 parts ONLY if the delta touches `src/framework/` beyond
  what r2 saw in a way lifecycle exercises (chrome mount / focus) — it does (LOW-1, LOW-5), so run it.

Baselines at dse `12aaf5b5` (workspace main `9978681a`; SC-638 landed): jest 13032 / 2 fresh (13033 / 1 cache) ·
lifecycle 64/64 · e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal
40/240, clip 147 · freeze 280/280 · parity 0/0/24. Expected: known-bug 19, 0 failed, coverage 416/416 (author measured `580/599 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` on 3a0e79a3; final head is `16737a8e`, superproject `b6a33ee0` on `ea6b4582`; jest 13070 / 1 cache). SC-638 changed the
shared e2e driver (`openNote` times out on an error card unless `{ errorCard: true }`) — check the author's merge with LOW-6.

## 2. Evidence screenshots for Scott (only if your verdict is LAND)

Scott reviews from images on the ticket. Produce THREE before/after images from REAL Obsidian on the final head (an e2e
probe spec in your private copy, like R2P-01, calling `browser.saveScreenshot` / element screenshots — never `--headed`,
never `DISPLAY=:1`). Same open note throughout, no reopen unless stated. Crop to the block plus a little margin; compose each
pair side by side into ONE PNG with a plain text label above each half ("Before: …" / "After: …"). Scott is colourblind:
the labels must carry the meaning, never a colour.

1. `sc644-shot-collapsible.png` — an open stamina bar (`Stamina/basic.md`) with its Collapse button; then after switching
   **Collapsible by default** OFF in settings: the Collapse button is gone, block still open.
2. `sc644-shot-editbutton.png` — experimental switch ON; an open block without the pencil; then after switching **Show edit
   button on rendered blocks** ON: the pencil is there. If cheap, add the open hero sheet's "Edit definition" button as a
   second row (MEDIUM-1).
3. `sc644-shot-startcollapsed.png` — an open block expanded; after switching **Start collapsed** ON: still expanded
   (unchanged); after reopening the note: collapsed. Three panels.

Write them into the ledger dir (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/`).
Look at each one yourself and say in one line per image what it shows.

## 3. Report

`sc644-r4-rereview-report.md`, ≤10-line exec summary first (verdict LAND / FIX, findings by severity, gate numbers, shot
paths). Findings with file:line and prescribed fix. Final text: the summary plus absolute paths of every artifact. If the
report write is blocked, return it inline. If you need input, end with `STATUS: NEEDS_CONTEXT`.

# SC-690 r4 — scoped re-review of the r3 fix delta

You reviewed `43574bfe` in r2 (FIX-REQUIRED). The implementer has made a fix round. Re-review
**the delta only** — not a fresh full pass. You fix nothing; you never call the tracker.

## Load

- Ledger (rulings on each of your findings, and new owner call O6):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-decisions.md`
- Fix report (executive summary first):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r3-fix-report.md`
- The delta:
  `git -C /home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero/draw-steel-elements diff 43574bfe..a84fa7a5`
  and the superproject branch `sc690-montage-remove-hero` at `980ac82c` (docs only) vs its r2 head `0c6aec5f`.

## Check, with evidence

1. **HIGH-1** closed: run the FULL e2e yourself at `a84fa7a5`. It must exit 0 with no
   `coverage gate FAILED` line. Report the last 5 lines and the exit code.
2. **MED-1** closed: the new near-miss test exists and your M5 mutant (trimmed / case-insensitive
   match) now dies. Re-run that mutant in a scratch clone.
3. **LOW-1** closed: two same-name heroes with different `skills_used` — the second chip removes
   the second item; the live-model re-check at Remove time still refuses to write over an outside
   edit (roster changed under the window: item at that index is no longer the picked hero, roster
   shorter than the index, picked hero moved to another index).
4. **LOW-2** closed: the three doc statements are now true; no new overclaim.
5. **LOW-3 / LOW-4 / O6**: the button reads "Remove <name>" after a pick and plain "Remove"
   (disabled) before; its accessible name matches; an 80-character name does not blow out the
   footer; the status line exists in the accessibility tree from open; the short-window PNG shows
   the line visible and one scrollbar (or the fix report states the kit limit and what it measured).
   Did the new button text break Enter/Escape handling, focus return, or any SC-627/SC-650 path you
   probed in r2? Re-run your r2 probe spec against the new head where it still applies.
6. **The two nits** (census describe title; D06 cited for Cancel).
7. **Regressions in the delta**: anything changed that no finding asked for; any test weakened;
   any new control x gesture pair missing from the manifest.

## Gates

tsc + lint + full jest + full e2e yourself. Shots + freeze yourself if the delta touches CSS
(expected 592 and 280/280, 0 FAILED). Lifecycle (64/64) and parity (0 / 0 / 24): confirm from the
r3 logs in `…/sc690-montage-remove-hero/sc690-r3-logs/`, reading the actual tail of each log and
its exit code, not the report's quote.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r4-rereview-report.md`,
opening with a ≤10-line executive summary: verdict **LAND-READY / FIX-REQUIRED**, each r2 finding
closed or open, new findings by severity with file:line, gate lines. If the write is blocked,
return it inline. Final text: raw facts for the ticket-owner, plus the absolute path of every
artifact. Use a new private scratch folder
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-review-r4/`.
All r2 footguns apply unchanged (git -C absolute paths; devbox run -c with script files; blocking
foreground gates with output to fresh uniquely named logs; no Monitor / run_in_background; no rm
with variable or glob targets; never pkill by pattern; do not edit or commit in the worktree; you
cannot message the owner — end with STATUS: NEEDS_CONTEXT if you need input, and any stray message
must start with `SC-690:`).

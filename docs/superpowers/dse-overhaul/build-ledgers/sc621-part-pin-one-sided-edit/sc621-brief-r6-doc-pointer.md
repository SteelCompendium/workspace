# SC-621 r6 — residual wording fix + the single pointer bump (implementer B, resumed)

Spec: ledger "owner rulings on r5". Common brief still binds (footguns; no glob/variable rm; git -C; no pushes/tags/attribution).

1. **dse, comment only** (`src/framework/host/ReadingModeBlockHost.ts`, the SC-621 comment in `rebaseCardPin`, ~:1057-1060): replace
   "(b) three residuals stay written, as before, because no rule over the text can see them: R1, ...; R2, ... (the cheapest reading keeps
   the drawn-from counter); R3, ..." with wording that gives each its true reason, e.g.:
   "(b) three residuals stay written, as before: R1, a move among text-identical blocks, and R2, the drawn-from section deleted while a
   neighbour is renamed to its name (the cheapest reading keeps the drawn-from counter), which no rule over the text can see; R3, a change
   of more than LINE_MAP_MAX_EDITS lines around the block in the same write, which `placedUniquely` cannot price, so the agreed map stands
   (SC-612's accepted cap)."
   One new commit (`docs:` prefix, no attribution). No code change.
2. **CHANGELOG** (worktree superproject /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit/CHANGELOG.md, the SC-621
   bullet): replace "Three cases are still written, as before, because the note's text cannot tell them apart: an identical counter moved to
   another place among the identical ones, the shown section deleted while a neighbouring section is renamed to its name, and, in a note with
   identical counters, an outside change of more than about 400 lines in the same write." with:
   "Three cases are still written, as before: an identical counter moved to another place among the identical ones, and the shown section
   deleted while a neighbouring section is renamed to its name (the note's text cannot tell these apart); and, in a note with identical
   counters, an outside change of more than about 400 lines in the same write (too large for the plugin to compare)."
   AMEND the existing single CHANGELOG commit (`ad3ae246`) — the superproject keeps ONE CHANGELOG commit.
3. **Skill proposal**: if `sc621-skill-proposal.md` states the same single reason for all three residuals, fix it the same way.
4. **Gates**: tsc and lint clean; build and compare main.js sha256 with r4's bundle (r5 measured `a866bb27…`) — must be identical (esbuild
   drops comments); if it differs, STOP and return NEEDS_CONTEXT. styles.css still `18730938…`. No other gate needed (behaviour unchanged).
5. **Superproject**: `git -C <worktree> fetch origin`; rebase the branch onto current `origin/main`; then commit exactly ONE pointer bump of
   `draw-steel-elements` to the final dse head, message `chore: bump draw-steel-elements to <short sha> (SC-621: <short plain summary>)`, on
   top of the CHANGELOG commit. Verify `git -C <worktree> log --oneline origin/main..HEAD` shows exactly 2 commits (CHANGELOG, bump),
   `git -C <worktree> status --porcelain` is clean (ignoring gitignored scratch), and `git -C <worktree> ls-tree HEAD draw-steel-elements`
   equals the dse head. No push.
6. Report `sc621-r6-report.md` (<=10-line summary: dse head, superproject head + origin/main base, the two diffs inline (`git show` of the
   comment commit and of the CHANGELOG hunk), main.js/styles sha256, tsc/lint). Raw facts + paths in your final text.

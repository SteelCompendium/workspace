# SC-544 r6 — test/doc folds from the r5 re-review (no src change)

You are resumed as SC-544's implementer. Final text goes to the ticket-owner. **Workers never call the tracker.**

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/decisions.md`. The "r5 scoped re-review DONE" and "owner rulings on r5" entries govern this round.
- The re-review report is `sc544-r5-rereview-report.md` in the same dir (LOW-1..3, INFO).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks`: plugin af73981b on eafe76e1 (= origin/develop now), superproject edba2fb5 on 55588e9a (= origin/main now). Before you start, fetch and check: if either base moved, rebase onto it.

## Folds (ruling, verbatim: "FOLD LOW-1, LOW-2, LOW-3 and the "mount order, writer last" wording (test/doc/proposal only — no src change).")
1. **LOW-1.** In the guard jest case, add a names assertion after `twin-reuse.test.ts:831`: `expect(t.names()).toEqual(['Twin','Edited','Twin'])` (adapt to the helper's real name).
2. **LOW-2.** Add two cases to `view-registry.test.ts`:
   - two flush rounds on one registry both flush (this catches a guard that is never reset);
   - a throwing sibling does not leave the guard on.
   The reviewer's scratch versions are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r5-review-af6d13a061fdaf760/guard-probe.test.ts`. Copy them, and never write into that folder.
3. **LOW-3.** In `sc544-dse-verify-proposal.md` §2, the CURRENT block to replace is the **eafe76e1** one (SC-511, SKILL.md:1258), not eaf64ba6. Update the CURRENT numbers (jest 6297, if that is what you measure).
4. **Wording.** Where architecture.md (and the `replaceSource` call-site comment, if it says the same) says "registry (document) order", change it to the order the views were mounted, with the writer last.

## Red checks (log each)
- Mutant MG1 (remove the guard reset, so the guard sticks on): the new LOW-2 case must go red.
- The new names assertion must go red under jest mutant m1 (remove the flush call).
- Restore the source after each mutant. `git status` must be clean apart from your commits.

## Gates
- tsc (incl. `-p e2e`) and lint: clean.
- jest: expect **6297 passed / 1 skipped / 251 of 252** (6295 + 2).
- No lifecycle, e2e, shots, freeze or parity run is needed: there is no src, harness or CSS change. Confirm with `git diff --stat af73981b..HEAD`. If you did have to rebase onto a moved base, say so and run the full battery as in r4.

Commit (test commit, then docs/comment commit).

## Report
Write `sc544-r6-fold-report.md` in the ledger dir, opening with a ≤5-line summary: shas, jest numbers, red checks, diff stat. Put logs in the same dir as `sc544-r6-*.log`. Final text: raw facts plus artifact paths.

## Footguns
All r4 footguns apply:
- Run `devbox run -c <plugin abs path> -- bash <script file>`.
- Use `git -C` for git commands, and never `cd X && …`.
- Use the Write tool for scratch files.
- No `rm` with a variable target and no glob `rm`.
- Run one foreground gate per Bash call.
- Use your private scratch `.../scratchpad/sc544-r6-impl-b1/`.
- To ask for input, end with STATUS: NEEDS_CONTEXT. If you message anyway, the first word must be `SC-544:`.

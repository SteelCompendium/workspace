# SC-656 r8 — scoped re-review of the r7 delta (fresh identity)

You are a scoped re-reviewer for ticket SC-656. You did not write this code. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear). Never push anything. Do not commit to the
branch.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/decisions.md`
  (read "Owner rulings on r6").
- The finding text: `.../sc656-r6-rereview-report.md` sections "LOW-C", "LOW-D" (same dir).
- The implementer's r7 report: `.../sc656-r7-fix-report.md` (same dir).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc656-negotiation-outside-edit-focus/draw-steel-elements`,
  branch `sc656-negotiation-outside-edit-focus`. Range: `57d57a03..d62f0b26` on dse develop `bab0dbb2`.
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read in parts: "The battery,
  in order", "THE exit-code footgun", "Lifecycle and e2e notes").
- The previous reviewer's probe spec: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r6-R1/r6probe.e2e.ts`
  (and `candG-input-scope.diff`, the prescribed LOW-C fix). To run a probe spec, copy it into a scratch dse worktree
  (`git -C <plugin dir> worktree add <your scratch dir>/dse-r8 <head sha>`, `node_modules` symlinked from the plugin
  dir) under `e2e/specs/negotiation/`, and run `npm run e2e -- --only=<ids>` there. Never add it to the branch.

## Task

1. Diff `57d57a03..d62f0b26`: LOW-C hunk equals `candG-input-scope.diff` (or explain each difference); LOW-D test
   exists and pins the silent-handoff no-Notice guard; the "R4 CANDIDATE" comment is gone. Nothing else changed.
2. Re-run the r6 probes at head (RV + LP): key press in the gap, held key in the gap, pointer press elsewhere in the
   gap, and the MED-A cases (own write → blur → `previewMode.rerender`; edit above → rerender; long note scroll-away →
   rerender). Expected: key cases keep focus; MED-A cases leave focus on the page.
3. Mutants (at least 3): revert the "input target outside the card" condition (expect the key-in-gap test red);
   remove the `!o.silent` Notice guard (expect the LOW-D test red); clear on wheel never.
4. Gates at head: tsc, lint, jest (expect the r7 report's number, 13642 / 1 with cache), one full e2e (expect
   `646/655 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`; SET-X03/X04,
   INIT-W09/W10, NEGO-R05 are load flakes: re-run the failed ids once), lifecycle parts 4
   (`--only=G-S57,G-S62,G-S61,G-S56`) and 7 (`--only=G-S108,G-S112,G-S115`) with the equals sign. G-S61 is red on base
   on this host (SC-668). Part 7 takes ~200 s: log to a unique file + rc file and poll it.

## Footguns

- `devbox run -c <abs plugin dir> -- bash <script-file>`; never `cd` inside a compound command; record exit codes inside
  the script file; read each gate's summary line.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc656-r8-<your agent id>/`,
  unique names; Write tool for scratch files.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, no `rm` with a variable target.**
  Leave throwaway files in place. Never glob-delete `/tmp/dse-*`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is in your worktree/scratch.
- `git -C <abs path>` for every git command.
- Long output to files. Never key a wait-loop on a scratch filename from another run.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a
  message anyway, its FIRST WORD must be `SC-656:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc656-negotiation-outside-edit-focus/sc656-r8-rereview-report.md`
— ≤10-line executive summary first (verdict LAND / FIX, counts by severity), findings with file:line and evidence,
probe table, mutant table, gate summary lines, log paths.

Final text: raw facts — STATUS, verdict, head sha, gate numbers, report and log paths.

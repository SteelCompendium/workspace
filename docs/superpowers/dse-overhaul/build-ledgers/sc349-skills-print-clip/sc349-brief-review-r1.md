# SC-349 independent review brief, round 1

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/decisions.md`.
- The implementer's brief and report in the same dir: `sc349-brief-impl-r1.md`,
  `sc349-report-impl-r1.md` (read its executive summary first, then what you need), and its
  deliverables (`rebaseline.txt`, `rebaseline-skills-only.txt`, `sc349-clipped-list.txt`, crops).
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (battery, devbox wrapping, exit-code footgun, Freeze semantics incl. the capture-artifact case,
  CURRENT block).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip`, plugin
  `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip/draw-steel-elements`, branch
  `sc349-skills-print-clip`. Head under review: `d34b0fe` (3 commits on `origin/develop` `0ce76dd`). Review the diff `git -C <plugin> diff origin/develop...HEAD`. Do NOT
  commit to the branch. NOTHING is written under `/home/scott/code/steelCompendium/workspace/draw-steel-elements`
  (the shared main checkout; its `demo-vault/` dirt is Scott's live vault — expected, ignore it).
- **Workers never call the tracker** (Linear).

## 2. The task — execute and probe, don't just read

Owner ruling (verbatim, from the ledger):

> Fix the mechanism, not the skills family alone: no browser-camera capture may come out clipped.
> Hard constraint: every capture that is NOT clipped today must stay byte-identical (the fix only
> changes behaviour for captures taller than the viewport).

Probe at least:
1. Re-run `npm run shots` yourself on the branch head; confirm the 572 count, the new in-run gate
   line, and that your run's hashes equal the implementer's `rebaseline.txt` (determinism across
   agents) and that `freeze` FAILS for exactly the `rebaseline.txt` set.
2. Independently verify the "unclipped captures byte-identical" claim: build the base
   (`origin/develop` `0ce76dd`, e.g. a detached `git worktree add` of the plugin into your private scratch
   folder, or `git stash`-free checkout of a separate clone — never touch the branch's tree) and
   compare ALL 572 PNG hashes base vs head. Every differing file must be in the clipped list.
3. Look for clipped captures the implementer's classifier missed: e.g. a capture whose blank tail
   is not pure background, or one clipped by a different mechanism (fullPage paths, hover/click
   shots, modal shots, narrow widths, gallery). Eyeball the after-PNGs of the tallest few.
4. Does the viewport enlargement change layout of the tall capture (vh units, sticky/fixed
   elements, `position: fixed` menus, the `chrome-*` menu captures, media queries keyed on height)?
   Compare a moved capture's top 2400 device rows base vs head — they should be pixel-identical;
   if not, explain why and whether it matters.
5. Does the new in-run gate actually fail? Probe it by temporarily disabling the fix in a scratch
   copy (never commit) and confirm the run fails loudly, then restore.
6. Viewport restore: after a tall capture, are later captures taken at the original viewport (order
   dependence)? A leaked enlarged viewport would silently change later shots.
7. Re-run tsc, lint, jest (expect 5408 passed / 1 skipped / 231 of 232 suites at 0ce76dd, plus any new tests; lifecycle baseline 29/29) and
   parity (0 GAPs / 0 undeclared / 24 DECLARED). Lifecycle/e2e only if the diff touches anything
   outside `visual-harness/` (say which you ran).

8. The implementer also found a second effect: click/hover shots scroll the page, leaving the TOP of
   `#mount` blank (e.g. `montage-guide-open--steel-print`), and fixed it with page-coordinate
   measurement. Verify that claim and that the fix is right for it.
9. Audit-only (no fix): do `visual-harness/docs-shots.mjs` and any other browser-context scripts in
   `visual-harness/` clip the same way? Report yes/no per script with evidence; I rule on scope.

Findings by severity (HIGH / MED / LOW / INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/sc349-report-review-r1.md`,
opening with a ≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, head sha, finding counts
by severity, whether your hashes match `rebaseline.txt`).

## 4. Return contract

Final text goes to the ticket-owner: raw facts, no prose, plus absolute paths of every evidence
artifact you produced.

## 5. Footguns

- If the report-file write is blocked, return the report inline.
- Private scratch ONLY: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-review-r1/`.
  Write scratch files with the Write tool. Unique script/log names.
- Devbox: `devbox run -c <abs plugin dir> -- bash -c '<cmd> > <abs log> 2>&1; echo rc=$? > <abs rc>'`
  or a wrapper script file. Never pipe a gate into `tail`. Never `cd` inside a compound command; use
  `git -C <abs path>`. One gate per Bash call. Run gates in the FOREGROUND (timeout up to 600000 ms);
  never background a gate and wait for a notification.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains your own path.
- Never glob `rm`; delete only paths you created and recorded. Never touch the shared freeze
  baseline or `check-freeze.sh`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end
  with STATUS: NEEDS_CONTEXT and the question. Any message you do send starts with `SC-349:`.

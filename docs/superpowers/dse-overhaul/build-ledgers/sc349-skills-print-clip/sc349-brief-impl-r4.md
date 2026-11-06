# SC-349 implementer brief, round 4: rebase onto develop `d689b719` after Scott's sanction

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/decisions.md`
  (read it all; it is the current state). Your earlier reports in the same dir: `sc349-report-impl-r1.md`,
  `-r2.md`, `-r3.md`. Reviews: `sc349-report-review-r1.md`, `-r2.md`.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Re-read
  the battery table (rows 4 and 5 have changed: lifecycle runs as FIVE `--only` parts, shots may exceed 600 s),
  "Freeze semantics" (division of labor) and the CURRENT block.
- **Workers never call the tracker.**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip`; plugin
  `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip/draw-steel-elements`, branch
  `sc349-skills-print-clip` @ `e2b17f1` (4 commits on `bc4a0c5`). Never write under
  `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (the shared main checkout; its `demo-vault/`
  dirt is Scott's live vault — expected, ignore it).

## 2. Scott's ruling (verbatim, from the ledger)

> **2026-11-05 00:28Z, SC-349 comment `f5db4077`:** "sanctioned" — replying to the ask (comment `34b7ebbd`) whose
> options were "sanctioned" = all 40 lines (`rebaseline.txt`) or "skills only" = 8 lines. **This sanctions all 40 lines.**
> ... Applies to the 40 names; if the rebase onto current develop moves a different set, the ask must be amended.

So: the full un-clip stays (no skills-only narrowing). Your job is to carry it onto current develop and
recompute the hash file there.

## 3. The task

develop has moved 356 commits since `bc4a0c5`. `visual-harness/shoot.mjs` alone gained ~1,300 lines across 26
commits (new in-run gates, new fixtures; 592 shots now; the main sweep context is still `900×1200` at ~line 7173).

A. `git -C <plugin> fetch origin`. Rebase onto `origin/develop` (`d689b719`; if the tip has moved, use the tip
   and report its sha). Resolve conflicts keeping both sides' intent; list every conflict hunk you resolved and
   how. `npm ci` if `package.json`/lockfile changed (they almost certainly did). Commit only what the rebase
   needs; no AI attribution; do not push.
B. Check the fix still covers every screenshot path. Since `bc4a0c5`, new capture paths or helpers may call
   `screenshot(` without going through your grown-viewport path. Grep every `screenshot(` call site in
   `visual-harness/shoot.mjs` and say for each whether it is covered, exempt (named), or not applicable.
C. **Base run.** Make a detached scratch worktree of the plugin at the rebase base:
   `git -C <plugin> worktree add --detach <scratch>/r4-base <base sha>`, `npm ci` there, run shots there. Expect
   592, 0 FAIL, and the freeze check against the shared baseline reads `freeze OK (280/280 …)`. (If base freeze
   is not 280/280, stop: STATUS NEEDS_CONTEXT.) When you are done, remove that scratch worktree with
   `git -C <plugin> worktree remove --force <literal absolute path>`. Never use `rm` on it.
D. **Head runs.** Run shots twice at the rebased head. Requirements:
   - The two head runs are byte-identical (all PNGs).
   - Every PNG that differs base vs head is a capture the fix grew (taller than the viewport, or scroll-blanked top).
     Every other PNG is byte-identical. List any exception, and treat it as a defect.
   - Freeze against the shared 280-line baseline: list the FAILED names. Write `rebaseline-r4.txt` in the ledger
     dir (`<sha256>  <filename>`, baseline format) for every frozen line that moves.
   - **Compare the failed set to the 40 names in `rebaseline.txt`.** Report, prominently: names in both, names
     only in r4 (new movers), and names only in the old 40 (no longer moving). Do NOT edit `rebaseline.txt`.
   - A scratch copy of the baseline with `rebaseline-r4.txt` applied passes `sha256sum -c` (rc 0, 280/280).
   - Report how many of the shots added since `bc4a0c5` were grown, and whether any of them is frozen.
E. If the new set differs from the 40, make before/after crops for each new mover's changed region, named
   `sc349-r4-<id>-before.png` / `-after.png` in the ledger dir. About 900 device px tall each.

## 4. Gates at the rebased head (one gate per Bash call)

Expected (dse-verify CURRENT at `d689b719`, plus your 9 tests / 1 suite):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6469 passed / 1 skipped / 257 of 258 suites** (develop 6460/1/256 of 257 + yours; explain any other number;
  a fresh worktree reads one fewer passed and 2 skipped until shots has run once)
- lifecycle **`51/51 ok, 0 failed`** as the union of FIVE `--only` parts exactly as row 4 of the battery table lists them
  (G-S56 stays last in the fourth part; G-S59 alone). Each part is one foreground Bash call. No `DSE_LIFECYCLE_PORT`
  is needed since SC-551
- e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`**
- shots **592, 0 FAIL**, with every in-run gate line printed (the CURRENT block quotes `161/966` for one of them;
  report the literal lines), plus your `capture clip OK (…)` line naming the gallery exemption
- freeze: exactly the set from step D FAILED; applied-copy rc 0
- parity (LAST) **0 GAPs / 0 undeclared / 24 DECLARED**

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/sc349-report-impl-r4.md`, opening
with an executive summary of 10 lines or fewer. It must give the rebased head sha and the base sha; the conflicts
resolved (count); the moving frozen set compared with the 40 (same / plus X / minus Y); the grown count; and the
literal gate lines.

## 6. Return contract

Final text goes to the ticket-owner: raw facts, no prose, absolute paths of every artifact. Separate
`Drive-by fixes:` from `Follow-ups:`.

## 7. Footguns

- If the report-file write is blocked, return the report inline.
- Private scratch ONLY: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-impl-r4/`
  (create it). Unique, r4-prefixed names. Write scratch files with the Write tool, not heredocs.
- Use a private `DSE_CAMERA_TMP` for every shots run, a fresh dir inside your scratch folder, one per run.
- Devbox: `devbox run -c <abs plugin dir> -- bash -c '<cmd> > <abs log> 2>&1; echo $? > <abs rc>'`, or a wrapper
  script file. Never pipe a gate into `tail`. Never `cd` inside a compound command; use `git -C <abs path>`.
  One gate per Bash call.
- Shots is the ONLY gate you may start in the background (it can exceed 600 s under load). Start it with output
  to a per-run unique log and rc file, then poll with foreground calls such as
  `for i in $(seq 1 55); do [ -f <abs rc> ] && break; sleep 10; done; cat <abs rc> 2>/dev/null; tail -3 <abs log>`,
  repeated until the rc file exists. Never end your turn waiting for a notification; it will not come. Every other gate runs
  in the foreground with timeout 600000.
- Never key a wait on a scratch file another run could have written. Your per-run unique rc/log paths are fine.
- Never `pkill`/`killall` by pattern. Kill only by literal PID whose command line contains your own path.
- Never `rm` with a variable target, and never a glob `rm` (especially under `/tmp`). Delete only literal paths you
  created. Never touch the shared `freeze-baseline.sha256` or `check-freeze.sh`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT
  and the question. Any message you do send starts with `SC-349:`.

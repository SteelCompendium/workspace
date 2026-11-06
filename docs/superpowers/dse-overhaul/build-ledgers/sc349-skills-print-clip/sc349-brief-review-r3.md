# SC-349 scoped re-review brief, round 3 (after the rebase onto current develop)

## 1. Context

- Ledger `decisions.md`, implementer reports `sc349-report-impl-r4.md` (summary first), your own
  `sc349-report-review-r1.md` / `-r2.md`, all in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc349-skills-print-clip/`.
- Plugin `/home/scott/code/steelCompendium/worktrees/sc349-skills-print-clip/draw-steel-elements`, branch
  `sc349-skills-print-clip`, head `25abfce2`, base `origin/develop` `248e202b` (see `sc349-report-impl-r4.md`; the implementer reports 0 conflicts, `rebaseline-r4.txt` byte-equal to `rebaseline.txt`). Do not commit; never write under
  the shared main checkout. Workers never call the tracker.
- Scott's ruling (verbatim, ledger): "sanctioned", which sanctions all 40 lines. "Applies to the 40 names; if
  the rebase onto current develop moves a different set, the ask must be amended."

## 2. Scope: the rebase only, not a fresh full pass

1. **Conflict resolutions.** Compare the branch's diff against its base (`git diff <base>...HEAD`) with the
   approved diff `bc4a0c5...e2b17f1` (still reachable by sha). Any semantic change beyond the rebase's needs is
   a finding. Check every conflict hunk the implementer lists.
2. **Coverage of new capture paths.** Since `bc4a0c5`, develop added capture paths, gates and fixtures. Verify the
   implementer's call-site table: is there any `screenshot(` path that can clip and bypasses the grown-viewport
   path and the shot-time rect check?
3. **Interaction with the new in-run gates** on develop (e.g. the gate quoted as `161/966`): does growing the
   viewport change what they measure, or do they run on a grown viewport and pass by accident?
4. **Hashes.** Run shots once yourself at head (private `DSE_CAMERA_TMP`). Your PNGs must equal the implementer's
   head runs, and the freeze FAILED set must equal `rebaseline-r4.txt`. Check the implementer's comparison of that
   set with the 40 sanctioned names. For any PNG that differs base vs head, spot-check that it was grown.
5. develop is now `248e202b` (SC-490 added a sticky montage hero column and a 4-context board-scroll gate). Check the grown viewport
   does not interact with the sticky column (the montage captures are in the grown set).
6. Re-run jest (expect 6479 passed / 1 skipped / 257 of 258 suites) and parity (0/0/24). Lifecycle and e2e only if the
   rebase changed anything outside `visual-harness/` and `test/`.

Findings by severity with file:line, a failure scenario and a prescribed fix.

## 3. Report

`sc349-report-review-r3.md` in the ledger dir, opening with an executive summary of 10 lines or fewer: APPROVE or
FIX-REQUIRED, the head sha, finding counts, and whether your hashes match `rebaseline-r4.txt`.

## 4. Return contract and footguns

Final text goes to the ticket-owner: raw facts, plus absolute artifact paths.
- If the report write is blocked, return the report inline.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc349-review-r3/`.
  Write files with the Write tool.
- `devbox run -c <abs plugin dir> -- bash -c '<cmd> > <abs log> 2>&1; echo $? > <abs rc>'`. One gate per call. No
  compound `cd`; use `git -C`. Shots may be backgrounded only with polling of its own rc file. Everything else runs
  in the foreground.
- No pattern kill (literal PIDs only). No `rm` with a variable target, and no glob `rm`. Never touch the shared freeze
  baseline. Probes go in a scratch clone, never the branch worktree.
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT. Any message you do send starts with `SC-349:`.

# SC-547 r2 brief — independent adversarial review of the r1 per-pass fence-list cache

You are the independent reviewer for ticket SC-547. You did not write this code. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/decisions.md` (read in full).
- r1 brief: `…/sc547-lp-twin-check-perf/sc547-brief-r1-impl.md`; r1 report: `…/sc547-lp-twin-check-perf/sc547-r1-impl-report.md`
  (read the exec summary, then whatever you need to check claims).
- The original finding: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc537-lp-callout-twins/sc537-r5-rereview-report.md`
  (§3 and §5 LOW-1). The SC-537 r5 probe harness (read-only; copy what you need):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r5-review-a1c8475e199b5ef3f/`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf`, plugin branch `sc547-lp-twin-check-perf`
  at HEAD `cb56f128` on dse `develop` `0698550f` (superproject branch 04aaaafd on origin/main f31c142a). The r1b rebase is in the `## r1b rebase` section of the r1 report. Verify with `git -C … log --oneline -1` before starting.
  **Make no commits and leave the tree clean** (`git status --porcelain` empty before and after; restore any mutant).
- Never work in the shared main checkout `/home/scott/code/steelCompendium/workspace/` except to read the ledger/skill.
  Its dse dirt (Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault; ignore it.

## 2. What to probe — execute, do not just read
1. **Equivalence.** The cache must pick the same fence for every entry as the uncached path. Build adversarial callouts
   and compare cached vs uncached resolution (a jest-level harness of your own in scratch, or a temp test you delete):
   twins, mixed aliases, nested quotes/callouts, a callout containing a non-DSE fence, an unterminated last fence,
   tildes vs backticks, a fence with whitespace before the language, two callouts back to back, a section where
   `getSectionInfo` is null.
2. **Cache lifetime.** Prove it cannot leak across passes: a doc change between two passes, a viewport change that
   brings a new callout in, an edit inside the callout that adds/removes a fence. Find every caller of `fenceOnElement`
   and confirm the uncached callers behave as on develop.
3. **Real Obsidian.** Re-run G-S57 and G-S61 (lifecycle `--only=G-S57 G-S61`, or part 4 `G-S57 G-S62 G-S61 G-S56`) on HEAD.
   Re-run the r5 probe cases `far`, `far-form`, `raw-lower-100`, `many-scroll`, `many-write` on HEAD (no false remounts,
   no stale cards). Owner ruling on the many-scroll scroll jumps (verbatim from the ledger): "Reviewer re-runs many-scroll
   on the rebased branch AND on the new develop; if the jumps appear on develop too, DROP for this ticket (scroll pin is
   SC-472's area, now landed). Only a jump that appears on HEAD and not on develop is a finding." Independently re-measure `cost-big` on HEAD and on `0698550f` — confirm or refute the r1 numbers.
4. **Mutants.** (a) drop the cache — the r1 scan-count test must go red; (b) make the cache survive across passes
   (e.g. hoist it out of the pass scope) — something must go red (jest or G-S57); if nothing does, that is a finding.
5. **Scope check.** The diff must not change which updates run a pass (`livePreviewReconcile.ts` guard), and must not
   touch `replaceSource` (SC-552), the LP callout click path (SC-545), or the scroll pin (SC-472).
6. **Gates.** Re-run tsc, lint, jest, lifecycle (five parts), e2e. Expected: tsc/lint clean; jest = r1b's reported
   count (≈ 6380 / 1 / 253 of 254); lifecycle 49/49 as 21 + 16 + 7 + 4 + 1 (part 1 `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5
   G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a`, part 2 `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13
   G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40`, part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52`, part 4 `G-S57 G-S62
   G-S61 G-S56`, part 5 `G-S59` alone — G-S57, G-S61 and G-S59 must be ok); e2e `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`. Shots/freeze/parity
   only if `styles.css` changed vs `0698550f` (compare built bytes).

## 3. Harness footguns
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc547-lp-twin-check-perf/draw-steel-elements -- bash <script file>`.
  No compound `cd X && …`. Exit codes from inside a script file. Never pipe a gate into `tail`.
- One gate per Bash call, foreground, blocking; each lifecycle part its own call; under 600 s. No `run_in_background`,
  no `Monitor`, no waiting on a notification. Redirect long output to a log file.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc547-r2-review-<your agentId>/`;
  unique names; write files with the Write tool. Use a private `DSE_CAMERA_TMP` under it for any camera run.
- Never key a wait-loop on a scratch filename or its contents.
- `rm`: never a shell-variable target, never a glob, never a shared `/tmp` pattern; never anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd/command line is in your worktree or scratch.
- Every git command as `git -C <absolute path> …`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc547-lp-twin-check-perf/sc547-r2-review-report.md`, opening with
a ≤10-line executive summary (verdict LAND-READY / FIX-NEEDED, finding counts by severity, your re-measured cost-big
numbers vs r1's). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, prescribed fix.
Copy logs with the `sc547-r2-` prefix into the ledger dir. If the report-file write is blocked, return it inline.

## 5. Return contract
Raw facts only: verdict, HEAD sha reviewed, finding list (severity + one line each), measured numbers, gate summary
lines, absolute paths of every artifact. You cannot `SendMessage` me; for input end with STATUS: NEEDS_CONTEXT and the
question. If you ever send a message anyway, its first word must be `SC-547:`.

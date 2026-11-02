# SC-534 r3 — independent review of the CHR-L01 simplification

You are the independent reviewer for ticket SC-534. You did not write this change. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/decisions.md` — read it
  all (r1 verdict, owner rulings on r1 — they define what the change must and must not do).
- r1 evidence: executive summary of `…/sc534-e2e-chrl01-flake/sc534-r1-report.md`. r2 implementer report: executive
  summary of `…/sc534-e2e-chrl01-flake/sc534-r2-impl-report.md`, and its gate logs `sc534-r2-gate-*.log`.
- Worktree: plugin `/home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements`, branch
  `sc534-e2e-chrl01-flake`, HEAD `fe44be1d` on dse develop `dabfb518`. Verify before anything. Do not commit; do not
  rebase.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (e2e section). CURRENT at
  `dabfb518`: e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- The main checkout shows dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) —
  Scott's live vault, expected; ignore it. Never write in the main checkout except your report in the ledger dir.

## 2. The task — execute and probe, not just read

Review `git -C <plugin> diff dabfb518..HEAD` (must touch only `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`).

1. **Proves no less than before.** List every assertion of the old spec and map each to the new one. Anything dropped
   besides the re-hover loop, `waitStable()` and the `{ cdp: true }` option is a finding.
2. **Anti-vacuity, re-run yourself on HEAD's spec:** revert SC-502's Live Preview clip-lift rule
   (`styles-source.css`, the `clip-path: inset(-96px …)` rule; r1's diff
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r1-a1/sc534-r1-anti-vacuity-C1-clip-lift-reverted.diff.txt`
   shows the shape — line numbers may have moved at dabfb518) and run `--only=CHR-L01` ×2: it must FAIL; give the line.
   Also probe the click: with the panel forced to stay hidden at click time (or Collapse covered by an overlay —
   your design), does the default `dse.click` fail loudly ("element click intercepted" or not-displayed) rather than
   click through? That is the claim behind ruling D. Read `e2e/driver/dse.ts` `click()`: it says a non-interactable-geometry error falls back to the CDP path — check whether that fallback could silently turn an intercepted click into a CDP click (which would make the comment at the new spec's click line false), and say which errors take it.
3. **Flake resistance:** with r1's instrumentation (`…/sc534-r1-a1/sc534-r1-probe-instrumentation.diff.txt`, the
   `e2e/driver/session.ts` + `e2e/run.mjs` hunks only), run HEAD's CHR-L01 under churn 150 ms + park ×10 and CPU x20
   ×5. Then revert all probes.
4. **One full `npm run e2e`** on the clean tree: summary line + the pointer-parked line.
5. Comment quality: the new comments must be literal and correct (the earlier flakes were the shared-Xvfb pointer
   crossing fixed by SC-539, not Live Preview layout or load). Any leftover dead code / unused import.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, prescribed fix. Verdict: LAND or
FIX-FIRST. At the end `git -C <plugin> status --short` must print nothing (rebuild `main.js`/`styles.css` from the
clean tree if you replaced them).

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc534-e2e-chrl01-flake/sc534-r3-review-report.md`
opening with a **≤10-line executive summary** (verdict, finding counts, anti-vacuity result, probe k/n, full-run line).

## 4. Return contract

Final text: raw facts only — verdict, findings (severity, file:line, one line each), measured numbers — plus the
**absolute path of every evidence artifact**. `Follow-ups:` separately. No prose padding.

## 5. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc534-r3-<yourAgentId>/`;
  every script and log there, uniquely named. Use the Write tool for scratch files — **no heredocs**.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Each run / batch is ONE blocking foreground Bash call under 10 minutes. No `run_in_background`, no Monitor, no
  background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc534-e2e-chrl01-flake/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; no `cd X && …`. Devbox eats `$?`: record exit codes inside the script file.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob or the shared
  `.superpowers/` dir.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc534-e2e-chrl01-flake/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e uses its own Xvfb; never `:1`, never `--headed`. Do not run CPU-burn stress tools.
- Copy any e2e failure bundle (`e2e/.out/<run>/<test-id>/`) to your scratch folder right after the run.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question
  in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-534:`.

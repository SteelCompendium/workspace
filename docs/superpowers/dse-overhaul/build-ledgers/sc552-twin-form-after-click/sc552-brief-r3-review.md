# SC-552 r3 brief — independent adversarial review (execute and probe; no commits)

You are the independent reviewer for Linear ticket SC-552. You did not write this code and did not design it. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/decisions.md` — ticket facts, owner rulings on r1 (scope = B+K WIDE, K-strict, unterminated-fence pin, registry child Component; global strict = SC-556 out of scope; r5 case dropped), SC-549 coverage, baselines.
- Design: `.../sc552-r1-diag-report.md` (§2 mechanism, §3 options, §5 test design). Implementation report: `.../sc552-r2-impl-report.md` (read its executive summary, then what you need).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click`, plugin branch `sc552-twin-form-after-click`. Review range: `0698550f..260763ab` (rebased onto 0698550f, SC-472 landed) (r2b report: sc552-r2b-rebase-report.md; 10 commits; confirm `git -C <plugin> log --oneline 0698550f..HEAD`). Superproject CHANGELOG commit: `c64edebc`. Run `git -C <plugin> fetch origin` and report whether `origin/develop` moved past 0698550f.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for command shapes and rules.
- **You never call the tracker (Linear).** The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; expected.

## 2. The task — execute and probe, not just read
1. Re-run the battery on HEAD (tsc, lint, jest, lifecycle in the five `--only` parts incl. G-S64 in part 3, e2e). Shots/freeze/parity: re-run if `styles.css` or rendered DOM changed vs 0698550f, else state that it is byte-identical and trust r2.
   Also check the rebase seam with SC-472: `ReadingModeBlockHost.replaceSource` calls `scrollPin.pin()` and SC-472 changed the pin/hold release; G-S59, G-S18, G-S42, G-S52 must pass, and probe one pinned form Save in LP with the note scrolled (reading position kept).
2. Red/green yourself: build a 0698550f bundle (`git archive`) and confirm G-S64 FAILs (a)-(k) on it and PASSes on HEAD; confirm the jest red set.
3. Your own mutants beyond r2's (e.g. pin taken lazily, mapLine off-by-one, K keeps forms with no pin, K-strict writes anyway, the wide pin not cleared after the fromView write, registry child Component never removed).
4. Real-Obsidian probes (reuse `sc552-r1-probe-*` in the ledger dir): the ticket steps on all four surfaces and two panes; 2 and 4 twins; the residual (outside edit, in-app and on disk, while the form is open); **SC-549's steps** (+ middle then in-app/on-disk edit of the upper within 400 ms, and LP typing in the upper callout title) — the owner needs your verdict on whether SC-549 is fixed; quick-click cases of G-S61 still clean; SC-519's G-S45 case still clean.
5. **Integrity probes (this code writes into user files):** content above/below the blocks survives; two same-kind blocks don't cross-talk; hand-edited content in another block survives a pinned Save; a user-deleted block (form kept open by K) leads to no write + Notice, and the remaining twin is untouched; unterminated trailing fence; CRLF notes; a note with more than the line-diff edit cap (fallback path, no wrong write that base would not also make); the wide pin across many quick clicks (no extra writes vs base, SC-544's "5 quick clicks = 1 write").
6. Lifecycle/contract: K keeps a form open only while its note is still shown in some pane (r2b F2: navigate-away and pane close must close it, phases (r)/(s)); plugin disable closes it; no growth of registry children across N form opens; sidebar forms unchanged.
7a. F1 (pre-existing on base): a form Save on an unterminated trailing fence leaves one blank line before the closing fence. Check whether repeated Saves ACCUMULATE blank lines, on base 0698550f and HEAD; report both.
7. Overlap/scope: diff touches nothing in `previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`, the SC-540 click shield in `pipeline.ts`; no body search / new refusal (SC-480); the proposal file `sc552-dse-verify-proposal.md` is accurate; `.claude/skills/dse-verify/SKILL.md` untouched; CHANGELOG wording matches what was measured (and claims nothing about SC-556's case).

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario for each, and a prescribed fix. Verdict: LAND-READY or NOT.

## 3. Gates — expected numbers
From r2b on 260763ab: tsc/lint clean · jest 6422 passed / 1 skipped / 255 of 256 suites with the app.css cache (base 6378 / 1 / 253 of 254 at 0698550f) · lifecycle 50/50 in FIVE parts (part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S64`; part 4 `G-S57 G-S62 G-S61 G-S56`; part 5 `G-S59` alone; each part under 540 s) · e2e `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. No private `DSE_LIFECYCLE_PORT` needed; a private `DSE_CAMERA_TMP` for shots.

## 4. Footguns (mandatory)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements -- <cmd>`; never `cd` in a compound command; `git -C <abs path>` always.
- Exit codes from a script FILE run through devbox; read each gate's summary line; never pipe a gate into `tail`.
- One gate per Bash call, foreground, output to a file; no `run_in_background`, no Monitor. Never key a wait on a scratch filename or contents; read the process's own output or a per-run unique path.
- Redirect long output to files (600 s stream watchdog).
- Private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r3-<your agentId>/`, uniquely named files written with the Write tool. Evidence kept → ledger dir with `sc552-r3-` prefix.
- Never `rm` with a shell-variable target; never a glob `rm` under /tmp. Delete only your own run's dirs by literal path; list any left.
- Never `pkill`/`killall` by pattern; kill only by PID whose `readlink /proc/<pid>/cwd` is in this worktree.
- Commit nothing; mutants are uncommitted and reverted; `git status --short` (plugin and superproject) must read the same before and after — report both.
- Never touch `.superpowers/` outside `sc552-*` names.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway starts with `SC-552:`.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-r3-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, gate numbers, red/green, SC-549 verdict).

## 6. Return contract
Raw facts, no prose: verdict, findings list (severity, file:line, one line each), gate summary lines, red/green, mutants table, SC-549 verdict with numbers, tree status, and the absolute path of every evidence artifact.

# SC-546 decisions ledger — e2e runner can take another runner's Xvfb display

Effort: `sc546-e2e-xvfb-race`. Worktree: `/home/scott/code/steelCompendium/worktrees/sc546-e2e-xvfb-race`
(every submodule on branch `sc546-e2e-xvfb-race`). dse base: `develop` @ `97284051`.
Ticket owner: Opus 5.5 (posts with `--model opus-5.5`). Priority Low; labels DSE Plugin, Bug.

## Task as given by the dispatcher (2026-11-02, verbatim excerpts)

> Reproduce the race first (two e2e runners started together). Check whether the lifecycle harness's
> display picking (:160–:199) has the same race and say so in the ledger. Harness-only expected; never
> touch display :1. Overlap: SC-534 (running) works on the CHR-L01 spec and may run many e2e runs
> concurrently — coordinate through the dispatcher if your repro needs exclusive use of :200–:239. At
> land-ready put any proposed dse-verify text in a proposal file (don't edit SKILL.md in the branch).
> Report land-ready to the dispatcher and stop; the dispatcher lands.

Ticket "Expected" (verbatim): "a runner only uses a display whose Xvfb it started itself (for example,
check its own Xvfb process is still alive after the socket appears, or use Xvfb's `-displayfd` to get
the number from the server)."

## Base moves

- 2026-11-02 — dispatcher: SC-537 landed, dse `develop` is now **`dabfb518`** (was 97284051; LP callout-twin
  src + lifecycle G-S57, no e2e change). ~~Rebase target 97284051~~ superseded: rebase target **dabfb518**.
  Baselines at dabfb518: jest 6262 passed / 1 skipped / 249 of 250 · lifecycle **46/46** (three parts
  21 + 16 + 9; part 3 = `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S57,G-S56`, G-S56 last, ~360 s) ·
  e2e 124/124 87/87 · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24. Byte-identity check for
  `main.js`/`styles.css` is now against a build of dabfb518.

- 2026-11-02 — dispatcher: SC-534 landed, dse `develop` is now **`eaf64ba6`** (was dabfb518). Test-only:
  `e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`, `e2e/driver/dse.ts` (ClickOptions.cdp removed);
  `e2e/run.mjs` untouched. Baselines unchanged. ~~Rebase target dabfb518~~ superseded: rebase target
  **eaf64ba6**. Owner ruling: r2 keeps reviewing `cfb16433` (the move touches none of the SC-546 files); the
  post-review fix round (or a rebase-only round if r2 is clean) rebases onto eaf64ba6 and re-runs tsc, lint,
  jest and two full e2e runs (e2e specs and driver changed); lifecycle is not re-run (no lifecycle or helper
  change in the move).

## Scott rulings

(none yet)

## Owner findings (2026-11-02, from reading the code at 97284051)

- **e2e `e2e/run.mjs:347-375` `startXvfb`:** pre-check skips a number whose socket or lock exists, spawns
  `Xvfb :n`, then polls 40 x 100 ms: `if (child.exitCode !== null) break` then `if socket exists -> mine`.
  Race: two runners both pass the pre-check for the same n, both spawn; the winner creates lock +
  socket; the loser's Xvfb is still starting up (or has not yet been reaped as exited) when its poll sees
  the winner's socket, so it returns the winner's display. The exitCode guard only helps if the loser's
  Xvfb has already exited AND node has processed the exit event before the socket check.
- **Lifecycle `visual-harness/obsidian-lifecycle.mjs:413-431` `startXvfb` (range :160-:199): SAME RACE,
  worse.** It picks the first free n once, spawns, then polls only "socket exists" (no exitCode check,
  no retry on the next number). A lost race returns the other run's display whenever that socket
  exists. Mitigating fact: the default CDP port is fixed (`DSE_LIFECYCLE_PORT` default 9262, :122), so
  two lifecycle runs on default ports collide on the port (exit 2) — the display race bites when the
  runs use different ports (workers often set `DSE_LIFECYCLE_PORT`, e.g. 9287 in SC-539 logs).
- **`visual-harness/docs-shots.mjs:256-284`** (range :99-:129, preferred :99): same "socket exists ->
  mine" pattern. Not a gate, run rarely.
- Footgun: `e2e/run.mjs` reads as a BINARY file to grep (the Claude grep wrapper prints nothing).
  Use `grep -a`.

## Owner rulings

- 2026-11-02 — Scope: fix e2e (the ticket) AND lifecycle (same race, required gate, run concurrently
  by many owners) AND docs-shots (same pattern; folds in for free if all three share one helper).
  One small shared helper that proves ownership; each caller keeps its own range.
- 2026-11-02 — Ownership proof: the display counts as ours only when OUR Xvfb process says so — use
  `-displayfd <fd>` on the explicit `:n` (Xvfb writes the number to the fd only once it is listening;
  a server that lost the lock exits without writing), with the lock-file PID check
  (`/tmp/.X<n>-lock` holds the server PID) as a belt if `-displayfd` misbehaves on this Xvfb build.
  Keep the explicit ranges (never let Xvfb pick a number itself: that would land on :0/:2 near :1).
  Implementer measures `-displayfd` on devbox Xvfb 21.1.24 before relying on it.
- 2026-11-02 — Repro needs no exclusive :200-:239: the base repro runs with a TEMPORARY, uncommitted
  range constant in a private range (:5300-:5339), plus a start barrier, then is reverted. No request
  to the dispatcher for exclusivity.
- 2026-11-02 — Gates: tsc, lint, jest, lifecycle (THREE `--only` parts), e2e. Shots/freeze/parity
  carried from 97284051 if `main.js`/`styles.css` are byte-identical (harness-only).

- 2026-11-02 — r1 measured: `-displayfd` Xvfb creates NO `/tmp/.X<n>-lock`, so the lock-PID belt is not
  available; belt used instead = our child alive + socket exists. Mixed old/new fleet exclusion sent to r2.
- 2026-11-02 — r1 follow-up "resolveXvfb() copy-pasted in all three callers": DROP — duplication only, no
  defect, unrelated to the race.

- 2026-11-02 — r2 finding rulings: LOW-1 (old un-rebased lifecycle runner adopts a new runner's display,
  16/20; r1 "cannot both end up on one display" claim wrong) FOLD — docs sentences in both READMEs + the
  dse-verify proposal + an appended correction in the r1 report; also flag it to the dispatcher at land-ready.
  LOW-2 (signal during the helper's wait spawns an orphan next candidate) FOLD — `shouldStop` option.
  INFO-1 (spawn error waits out the timeouts, misleading "no free X display") FOLD. INFO-2 (belt branch and
  wrong-number reply untested) FOLD — two jest cases. INFO-3 (netns lock-file guard) DROP — every runner
  shares one network namespace; theoretical. INFO-4 (comment "stays alive") FOLD — wording. INFO-5 DROP —
  no action, same as base.

- 2026-11-02 — r4 INFO rulings: INFO-A (`xvfb-owned.mjs:33` range doc comment above the wrong declaration)
  FOLD. INFO-C (`visual-harness/README.md:343-344` caveat should name docs-shots too) FOLD. INFO-D (proposal
  wording) FOLD — owner edited the proposal file directly (ledger file, not branch). INFO-B (a second,
  misleading "no free X display" line after "received SIGTERM"; rc 2 and cleanup are correct) DROP — log
  wording seen only while the run is already being killed; fixing it would re-open lifecycle for a cosmetic.

## Rounds

| Round | Role | Agent | Status |
|---|---|---|---|
| r1 repro + implement | implementer | ad6b4d97081917fbd | DONE 2026-11-02, HEAD `cfb16433` on dabfb518 (5 commits). Base repro: real e2e pairs 7/10 shared a display; fn-level e2e 24/40, lifecycle 40/40, docs-shots 40/40. Fix: 0/10, 0/40 x3, stress 0/100. Gates: tsc/lint clean, jest 6267/2 skipped fresh (6261+6 new), lifecycle 21+16+9 = 46/46, e2e 124/124 87/87 x2, main.js/styles.css byte-identical to dabfb518. Report `sc546-r1-impl-report.md`, proposal `sc546-r1-dse-verify-proposal.md`. |
| r2 independent review | reviewer | ac9b24cdf93900c5c | DONE 2026-11-02: LAND, 0 BLOCKER/IMPORTANT, 2 LOW, 5 INFO. Base repro 9/10 shared, head 0/10; e2e 124/124 87/87; lifecycle part 3 9/9; jest test not vacuous (4/6 fail on old logic). Report `sc546-r2-review-report.md`. |
| r3 fix round + rebase eaf64ba6 | implementer (r1 identity, resumed) | ad6b4d97081917fbd | DONE 2026-11-02: HEAD `4b14600d` on eaf64ba6 (8 commits). All 5 folds in; orphans 0 (e2e 0/1, lc 0/4); spawn error fails in ms naming the binary; 4 new jest cases, each mutation fails 1/10. Gates: tsc/lint rc0; jest 6271/2 fresh (= 6272/1 cached; 250 of 251); lifecycle 21+16+9 = 46/46; e2e 124/124 87/87 x2; sha256 identical to eaf64ba6; stress 0/100. Report `sc546-r3-fix-report.md`. |
| r4 scoped re-review of the r3 delta | reviewer (r2 identity, resumed) | ac9b24cdf93900c5c | DONE 2026-11-02: LAND, 0 BLOCKER/IMPORTANT/LOW, 4 INFO. Rebase patch-identical; orphans lc 0/4, e2e 0/3; spawn errors fast in all callers; mutations each fail 1 test; e2e 124/124 87/87. Report `sc546-r4-rereview-report.md`. |
| r5 comment/docs fix (INFO-A, INFO-C) | implementer (resumed) | ad6b4d97081917fbd | DONE 2026-11-02: `423e798d` (3 files, 4+/4-); tsc/lint rc0, xvfbOwned 10/10, sha256 unchanged. |
| r6 diff check of r5 | reviewer (resumed) | ac9b24cdf93900c5c | DONE 2026-11-02: LAND, nothing wrong. |

**LAND-READY 2026-11-02:** dse branch `sc546-e2e-xvfb-race` @ `423e798d` on develop `eaf64ba6`. Land-ready comment
posted on SC-546. Reported to the dispatcher. Proposal file for dse-verify: `sc546-r1-dse-verify-proposal.md`.

**DONE 2026-11-02:** landed by the dispatcher — dse `develop` @ `423e798d`; workspace `main` merge `e10ddcfa` +
bookkeeping `830b8489` (ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc546-e2e-xvfb-race*`,
dse-verify proposal applied to rows 4/4b, "Xvfb ownership (SC-546)" bullet, new CURRENT block). Worktree
removed. Landed comment posted (`sc546-comment-landed.md`); SC-546 -> Done. Not deployed.

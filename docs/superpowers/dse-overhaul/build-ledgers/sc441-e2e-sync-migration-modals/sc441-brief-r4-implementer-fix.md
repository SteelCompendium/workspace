# SC-441 round 4 — implementer fix round

Your final text goes to the SC-441 ticket-owner, not a human. Self-contained: a fresh worker can
pick this up from the files alone. **Workers never call the tracker.**

## 1. Context loading

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/decisions.md`:
  read **O22** and **O23** (bottom). O1-O21 still bind.
- Review report (the findings, verbatim — this is your task list):
  `…/sc441-e2e-sync-migration-modals/sc441-r3-review-report.md`, sections HIGH, MEDIUM, LOW, INFO
  (lines ~14-92) and "New product bugs" (~152-169). Each finding has file:line, how it was shown,
  and the prescribed fix. Follow the prescribed fix unless it is wrong; if you deviate, say why.
- The reviewer's probe scripts are in
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-review-r3/`
  (`sc441r3-mut.py`, `sc441r3-reverse.py`, `sc441r3-z01.ts.txt`, …) — reuse them to prove each
  fix (read, do not edit them; copy into your own folder if you need to change one).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals`, dse branch
  `sc441-e2e-sync-migration-modals`, head `88ea9c87` on dse `develop` @ `4b233886`. First
  `git -C <worktree>/draw-steel-elements fetch origin`; if `origin/develop` moved off `4b233886`,
  do NOT rebase — note the sha in the report.
- Prior reports: `sc441-r1-implementer-report.md` (phase A + `## Phase B`).

## 2. The task

Fold every finding per ledger O23, quoted:

> **O23. Fix round r4 scope: FOLD every HIGH, MEDIUM and LOW finding (H1, M1-M5, L1-L5) with the
> review's prescribed fixes, plus I1** (the fixture stub THROWS on an unknown URL instead of
> answering 404 — r2 brief: "a request that falls through throws"). DROPPED: I2 (`os.tmpdir()`
> fallback outside `run.mjs`; every other guard check still applies), I3 (equivalent mutant), I4
> (bounded polls, no finding). M1 note: E09 going red under SC-653's plan is expected — it is the
> plain current-behaviour test the SC-653 fixer updates (cross-effort note above). No product
> change in the fix round.

And add the SC-706 marker per O22, quoted:

> **O22. New ticket: SC-706** … e2e `knownBug('SC-706')` asserting the correct behaviour, quoted
> from the review: "a Sync into a changed Destination never overwrites a file the plugin did not
> install there, and asks first if the folder holds files".

Build it from the reviewer's `sc441r3-z01.ts.txt` repro. Its side effects stay inside the
disposable vault and `resetSyncTree()` must return to pristine after it (it changes the
Destination setting: restore it).

For each finding, prove the fix: H1 — re-run the reviewer's sorted-order probe and show M28 / M30
/ M10 pass under BOTH orders; M2 / M5 — the reversed-describe probe and a forced mid-run failure
leave the next scenario green; M3 / M4 — the `obs` and `iic` mutants now go red (name the
catching test), then revert; M1 — the K01 / K02 behaviour under the reviewer's option (i), option
(ii) and `sc653plan` probes. Mutants are made in the working tree and reverted by naming the file
(`git -C <abs> checkout -- <file>`), never `checkout -- .`.

Commit after every coherent step (`test(SC-441): …`), no AI attribution or co-author trailers, no
push, no superproject commit. Product source unchanged (`git diff 4b233886..HEAD -- src main.ts
styles.css` must stay the two window files' attributes).

If you find another product bug: commit, finish the round, return `NEEDS_CONTEXT` once before the
full battery (ledger O8 / O16).

## 3. Gates

Baselines at `4b233886`: jest 14730 / 2 fresh; lifecycle 64/64; e2e `843/852 ok, 0 failed, 9
known-bug, 486/486 pairs`; shots 592; freeze 280/280; parity 0 / 0 / 24. Yours at `88ea9c87`:
jest 14913 / 2 fresh; e2e `927/947 ok, 0 failed, 20 known-bug, coverage: 539/539 pairs`.

Expected after r4: tsc (incl. `tsc -p e2e`) + lint rc 0; jest 0 failed (report counts; the jest
twin of K02 changes); `--element=sync` alone 3 times, 0 failed every time; then ONE full e2e:
`0 failed, coverage: 539/539 pairs`, known-bug 21 (+1 for SC-706) and total 948 if you add exactly
one test — report the actual numbers. Lifecycle / shots / freeze / parity only if product source
changed (it must not).

Known flakes elsewhere (INIT-W09/W10 SC-654, SET-X03/X04 SC-657, NEGO-R05/R08): re-run alone, report
either way.

## 4. Footguns (all from r1/r2 briefs, still binding)

- One blocking foreground call per gate; output to a uniquely named log under your existing
  folder `…/scratchpad/sc441-impl-r1/`, prefix `sc441r4-`. Gates over 180 s: start with output to a
  log, wait with `timeout 175 tail --pid=<pid> -f /dev/null` on your own pid (check
  `readlink /proc/<pid>/cwd` is inside your worktree). No `run_in_background`, no Monitor.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches
  match. Redirect long output to files (600 s stream watchdog).
- Private `DSE_CAMERA_TMP` per e2e run; never set `DSE_LIFECYCLE_PORT`.
- No `rm` in `/tmp` or the scratchpad, no glob or variable `rm`; never touch `.superpowers/` outside
  your report. Kill only by literal PID whose cwd is in your worktree; never `pkill` by pattern.
- `git -C <abs>` and `devbox run -c <abs>/draw-steel-elements -- bash <script>`; no compound `cd`;
  scratch files with the Write tool.
- The main checkout's dse dirt is Scott's live vault: expected, never touch or run against it.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me; `to: "main"` reaches the dispatcher. Need input → end with
  `STATUS: NEEDS_CONTEXT`. If you ever message anyway, first word `SC-441:`.

## 5. Report and return

Append `## Round 4 (fix)` to `sc441-r1-implementer-report.md`, opening with a ≤10-line executive
summary: status, head sha, per-finding fixed / deviated (one line each with its proof), gate lines,
new bugs. Write it as you go.

Final text, raw facts: `STATUS`, head sha, per-finding line, gate summary lines, log paths.

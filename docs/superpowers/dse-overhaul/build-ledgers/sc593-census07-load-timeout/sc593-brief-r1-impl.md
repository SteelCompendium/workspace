# SC-593 round 1 — implementer brief: make e2e CENSUS-07 robust to machine load

## 1. Context loading

- Read the effort ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc593-census07-load-timeout/decisions.md`.
- Read the dse-verify skill's battery section: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-217 (the table, devbox wrapping, lifecycle/e2e notes, THE exit-code footgun). It is ~300 KB; read only those parts plus "Current expected numbers" (line ~1386) as needed.
- Read `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 (project footguns) — every one applies.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc593-census07-load-timeout`. The plugin repo is its `draw-steel-elements/` submodule, on branch `sc593-census07-load-timeout`, at `c3fd8323` (= origin/develop at dispatch). First: `git -C /home/scott/code/steelCompendium/worktrees/sc593-census07-load-timeout/draw-steel-elements fetch origin` and confirm `origin/develop` is still `c3fd8323`; if it moved, rebase onto it and say so in your report.
- Verify with `pwd`/absolute paths before every write: ALL edits go under that worktree, never under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout). Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- **You never call the tracker (Linear)** — not to read history, not to post. The ledger is your context.

## 2. The task

Ticket SC-593: e2e `[CENSUS-07]` (`draw-steel-elements/e2e/specs/_census.e2e.ts:95`) failed once on its 45 s mocha timeout (`e2e/wdio.conf.mts:47`) in a full e2e run at loadavg ~27; it passed alone. Ticket ask (verbatim): "A gate that fails only under load costs a re-run each time it fires. Make it robust to load, or give it a load-aware timeout."

Failing evidence: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc572-r4-rerev-be71a0a9/e2e.log` (lines ~27 and ~192-210). Read-only; do not modify or delete anything in that dir.

Owner's analysis (see ledger): CENSUS-07 runs five `eventfulNodes` scans of the tracker scope, two of them back-to-back on identical state. `eventfulNodes` (`e2e/driver/census.ts:27`) does one SEQUENTIAL CDP round trip per node in scope (`DOMDebugger.getEventListeners`) plus one per eventful node (`Runtime.callFunctionOn`), and never releases the remote objects. Under load each round trip is slow, so cost = nodes x latency x 5.

Do this, in order:

1. **Measure first.** Instrument (temporarily, uncommitted) or time CENSUS-07 alone at c3fd8323: total wall time, per-scan time, node count per scan, eventful-node count, and the current loadavg. Run alone with the runner's grep (see `e2e/run.mjs` / `DSE_E2E_GREP`). Record numbers.
2. **Make the scan cheap, preserving its result exactly.** Candidate approaches (probe, choose, justify):
   - `DOMDebugger.getEventListeners` with `depth: -1` (and `pierce` as appropriate) on the scope root, using each listener's `backendNodeId` to attribute listeners to nodes — one call per scan instead of one per node. Verify the result is identical (same node set, same events) against the old per-node method on every census scope (CENSUS-01..09), not just CENSUS-07.
   - Or: issue the per-node calls concurrently (bounded `Promise.all`) and batch the per-eventful-node attribute read into a single `Runtime.callFunctionOn` / evaluate.
   - Release remote objects (an `objectGroup` + `Runtime.releaseObjectGroup`) so repeated scans don't accumulate handles.
   - Drop CENSUS-07's duplicate scan (lines ~99-100: compute `eventfulNodes` once, use it for both assertions).
   The driver change helps every census test; keep `eventfulNodes`'s signature and returned shape unchanged.
3. **Measure again** (same conditions; report before/after). Then measure under load: run CENSUS-07 alone while the host is loaded — either the host's natural load (report loadavg) or a synthetic CPU load you start and KILL BY PID afterwards (e.g. N `node -e 'for(;;){}'` processes, N ≈ 2x cores; record their PIDs; kill only those PIDs). Report wall time under load before and after.
4. **Only if** CENSUS-07 still takes more than ~50% of its 45 s budget under load after step 2, add a measured backstop: a per-test `this.timeout(...)` on CENSUS-07 (mocha `function ()` form) with a comment citing the measurements. Do not change the global 45 s timeout. Do not split CENSUS-07 into new scenario ids without coming back to me first (STATUS: NEEDS_CONTEXT).

Hard constraints:
- The scenario id stays `[CENSUS-07]`. **Never put a bracketed ticket id (e.g. `[SC-593]`) in any test title** — the e2e runner reads bracketed tokens in titles as scenario ids (SC-577). Ticket ids go in comments only.
- Coverage must stay `164/164 pairs`; total tests stay 265 (or explain any change).
- No auto-retries (the config forbids them by design: "a flake is a bug in the test or the product").
- Commit inside the dse submodule after each coherent step (`git -C <abs path> commit`), message prefix `test(SC-593):` or `fix(SC-593):`. No co-author / AI attribution trailers. Do not push. Do not touch the superproject.

## 3. Gates (dse-verify battery; expected numbers at c3fd8323)

Run the full battery on your final commit, each gate as ONE blocking foreground call (no `run_in_background`, no Monitor), output redirected to a uniquely named log, exit codes captured via a script FILE run through `devbox run -c <worktree>/draw-steel-elements -- bash <script>` (see dse-verify "THE exit-code footgun"; never trust an echoed `$?` in `bash -c`):

- `npm run tsc` clean · `npm run lint` clean, exit 0
- `npx jest` → **7200 passed / 1 skipped** (2 skipped / one fewer passed before a shots run has cached `obsidian-app.css` — compare after shots, or note it)
- `npm run obsidian-lifecycle` in FIVE `--only` parts (each its own foreground call, < 600 s): `G-S7a … G-S9a` (21) · `G-S9b … G-S40` (16) · `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9) · `G-S57 G-S62 G-S61 G-S56` (4) · `G-S59 G-S49 G-S73 G-S77` (4). Take the exact id lists from dse-verify's table. G-S56 stays last in its part. Union must be **54/54 ok, 0 failed**.
- `npm run e2e` → **`260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`**, exit 0 (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). If an unrelated load-sensitive test fails (RECOV-R07 / SC-517 / SC-570, CHR-L01 / SC-534), re-run it alone and report both; do not "fix" it.
- `npm run shots` → 592 shots, host-leak 163/978, modal host-leak 39/234, capture clip 147 (if > 600 s under load: unique log + rc file and poll the LOG/rc file).
- Freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc593-census07-load-timeout/draw-steel-elements/visual-harness/shots` → 280/280, 0 FAILED.
- `npm run parity` LAST → 0 GAPs / 0 undeclared WARNs / 24 declared, exit 0.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc593-census07-load-timeout/sc593-r1-impl-report.md`. Open it with a ≤10-line executive summary (verdict, final dse sha, before/after CENSUS-07 timings quiet and loaded, gate numbers). Keep scratch (scripts, logs) in a private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc593-r1-impl/` with uniquely named files.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, commit shas, measured numbers, gate summary lines — no prose, plus the absolute path of every evidence artifact (report, logs). Separate `Drive-by fixes:` (made) from `Follow-ups:` (left alone).

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every gate as a blocking foreground call. Never start a gate in the background and wait for a completion notice — it never comes.
- **Never `rm -rf` (or `rm` at all) a glob, a shared `/tmp` path, or a variable-expanded path.** A worker today wiped other efforts' kept lifecycle FAIL dirs with a `/tmp` glob. Delete only literal absolute paths you created and recorded — or delete nothing. Never touch `.superpowers/` outside `sc593-census07-load-timeout/`.
- Never `pkill`/`killall` by pattern; kill only PIDs you started (or whose command line / `readlink /proc/<pid>/cwd` is inside YOUR worktree).
- Every git command as `git -C <absolute path>`; never `cd X; git …`. Never `cd` inside a compound command; use `devbox run -c <abs path> -- …`. Use the Write tool for scratch files.
- Devbox eats `$?` / `$PIPESTATUS`; never pipe a gate into `tail`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-593:`.

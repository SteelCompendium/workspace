# SC-519 r2 brief — independent adversarial review

You are the independent reviewer for SC-519, round 2. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc519-form-stale-open/sc519-decisions.md` (the only source of rulings).
- The implementer's brief and report in the same dir: `sc519-brief-r1-impl.md`, `sc519-r1-impl-report.md` (read the executive summary, then the body as needed).
- Background: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh/sc509-r3-review-report.md` (INFO-1 = this ticket; INFO-2 = related, ruled no-action) and the SC-509 ledger next to that dir.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gates, lifecycle authoring rule, CURRENT numbers).
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc519-form-stale-open`, branch `sc519-form-stale-open`. Review range: dse `c2758a2..1e97599`, superproject `2bfd07d..9797d3c`. `git -C <dse path> fetch origin` first and report whether `origin/develop` is still c2758a2.
- Do not commit to the branch. Probes go in scratch (throwaway test files you delete by literal path, or a `git stash` you pop, or a separate `git worktree add` into your private scratch folder). Leave the branch exactly at HEAD when done; say so.
- Never edit in the main checkout `/home/scott/code/steelCompendium/workspace/`; its dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected.
- **You never call the tracker.**

## 2. The task — execute and probe, do not just read

Ticket expected behavior (from the ledger): "opening the form flushes, or waits for, the view's pending write, so the form starts from what the card shows."

1. Re-run red/green: the new jest test fails on c2758a2 and passes on HEAD; G-S45 FAILs against a c2758a2 bundle (`DSE_LIFECYCLE_BUNDLE`) and passes on HEAD.
2. Mutation check: revert or weaken the fix in at least 3 ways (e.g. skip the await, flush without re-reading the body, flush only for Reading host) and confirm a test catches each.
3. Real Obsidian probes (lifecycle harness or your own throwaway scenario): Reading view, Live Preview, sidebar, ds-hero "Edit definition"; double-click pencil during the flush; flush-write failure path; no-pending-write path (no extra write, no delay); twins / two counters in one note; text outside the block byte-identical; SC-509's G-S40 behavior (form Save redraws the card) still holds.
4. Check the lifecycle authoring rule: no timed delay inside a G-S45 step used to win a race against Obsidian; flag any fixed waits.
5. Look for regressions in the view's persist/flush contract (`view.ts` persist/flushPersist, unload flush, coalesced persist promises, dropped-write Notice and rate limit), adoption (`adoptView.ts`, SC-509 `fromView`), and any other opener of the form.
6. Run the full dse-verify battery on HEAD and compare to the expected numbers: tsc/lint clean · jest 6058 passed / 1 skipped / 245 of 246 suites at c2758a2 plus the new tests (after a shots run) · lifecycle 38/38 · e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0 GAPs / 0 undeclared / 24 DECLARED (last).

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT.

## 3. Shell rules (obey exactly)

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/draw-steel-elements -- <cmd>`; never `cd` inside a compound command; every git command as `git -C <absolute path>`.
- One blocking foreground gate per Bash call (timeout 600000); no `run_in_background`, no Monitor, no background jobs. Redirect long output to a log and read the summary line.
- Exit codes from a script file run via `devbox run -c <dse path> -- bash <script>`, writing rc to a fresh uniquely named file.
- Scratch: only your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc519-r2-review-<suffix>/`, uniquely named files, written with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a `/tmp` glob or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only by PID whose cmdline or `/proc/<pid>/cwd` is in your worktree or scratch.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9293). Never `DISPLAY=:1` / `--headed`.
- Never key a wait-loop on a scratch filename or its contents.
- No tags, releases, pushes, deploys, `wt-finish`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc519-form-stale-open/sc519-r2-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, red/green facts, gate numbers). Inline if the write is blocked.

## 5. Return contract

Final text to the ticket-owner: raw facts — verdict, finding counts and one line each, shas reviewed, measured gate numbers, absolute paths of every evidence artifact. You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway must start with `SC-519:`.

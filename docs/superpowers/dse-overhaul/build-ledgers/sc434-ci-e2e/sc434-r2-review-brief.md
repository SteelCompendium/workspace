# SC-434 r2 brief — independent review of the CI e2e job

Your final text goes to the ticket-owner, not a human. Raw facts only.

## 0. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/decisions.md`.
- The implementer's brief and report (read the brief for the requirements; treat the report's
  claims as claims to verify, not facts):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r1-brief.md`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r1-report.md`.
- Worktree plugin dir: `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements`,
  branch `sc434-ci-e2e`, head `029d012a`, base develop `fcc7278e`. Review `git diff fcc7278e..029d012a`.
- **You never call the tracker.** Never push, never open a PR, never tag. Do not commit to the
  branch: findings only.
- The footguns section of the r1 brief (§4) applies to you verbatim: devbox shapes, no `rm` in
  /tmp or the scratchpad, kill only your own PIDs, poll long jobs by PID, unique paths in your
  own private scratch dir
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-<suffix>/`.

## 1. What to review — execute and probe, do not just read

The job will run on GitHub `ubuntu-latest` (24.04, 4 vCPU for a public repo), and nobody can
run it there before Scott's go-ahead. Your job is to find every way it fails or misleads on
its first real run, and every way it could be green while proving nothing.

Probe at least:
1. YAML validity and Actions semantics: run `actionlint` if you can get it (e.g.
   `devbox run -c <plugin dir> -- bash -c 'go run github.com/rhysd/actionlint/cmd/actionlint@latest <file>'`
   or a downloaded release binary in your scratch dir); otherwise parse with yq and check by hand.
2. Cache key: does it actually change when the Obsidian pin changes? Does the path match where
   `e2e/run.mjs` writes on a runner (`XDG_CACHE_HOME` unset, `HOME=/home/runner`)? Does a
   restore of a partial/corrupt cache break the run?
3. Sandbox / AppArmor fix: is it correct for ubuntu-24.04 runners, and is it the least
   invasive? Does it leak into local runs (Scott's machine) or change local behaviour?
4. apt list: compare against what Electron 3x / Obsidian 1.14.4 actually loads (`ldd` on the
   cached Obsidian binary from `~/.cache/dse-e2e-obsidian` vs a stock ubuntu-24.04 package set
   if you can determine it).
5. Failure artifact: does the `if:` condition fire on a test failure AND on a coverage-gate
   failure (exit 1) AND on exit 2 (whatever run.mjs uses it for)? Does the uploaded path
   contain the screenshot? Retention and size.
6. "Green while proving nothing": could the job pass with 0 tests run, a skipped coverage gate,
   a missing `main.js`, or a stale build? Show it cannot (or show it can).
7. No retries anywhere (no continue-on-error, no retry wrappers, no wdio retries).
8. Permissions (least privilege), `timeout-minutes`, concurrency, fork-PR behaviour.
9. Any change outside `.github/` and `e2e/README.md`: review it as runtime code.
10. Re-run the implementer's local CI simulation script once yourself at the reviewed sha
    (4 cores via `taskset -c 0-3`, the shard count the job uses, `CI=true`, `DISPLAY` unset,
    fresh clone, copied cache). Record wall time and the summary line. Expected:
    `OBSIDIAN-E2E done: 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`.
    Known load flakes INIT-W10 (SC-654), SET-X03/SET-X04 (SC-657) pass on re-run; any other
    failure is real.

## 2. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r2-review.md`,
opening with a <=10-line executive summary (verdict: APPROVE / APPROVE WITH FIXES / BLOCK).
Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, the failure
scenario, and the prescribed fix. If the report-file write is blocked, return it inline.
You cannot SendMessage me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question.
Final text: verdict, sha reviewed, measured numbers, absolute paths of every artifact.

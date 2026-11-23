# SC-434 r1 brief — implementer: e2e job for draw-steel-elements GitHub CI

Your final text goes to the ticket-owner, not a human. Raw facts only.

## 0. Context loading (do this first)

- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/decisions.md`
  (the ledger: rulings, scope, constraints). It replaces the ticket thread.
- **You never call the tracker (Linear)** — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e`. Plugin dir:
  `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements`, branch
  `sc434-ci-e2e`, base develop `fcc7278e`. First: `git -C <plugin dir> fetch origin` and
  confirm `origin/develop` is still `fcc7278e`; if it moved, rebase onto it and say so.
- Use `git -C <absolute path>` for every git command, never `cd X; git …`. Verify `pwd`
  / paths before any write. Never write under `/home/scott/code/steelCompendium/workspace/`
  except the ledger dir above (the main checkout is shared; its dse dirt — modified
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md` — is
  Scott's live vault, expected, not yours).
- Read the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  in PARTS (it is ~490 KB): "The battery, in order" (lines ~20-247, especially row 4b and the
  e2e notes: Xvfb `:200-:239` via `scripts/xvfb-owned.mjs` (SC-546), shards, coverage gate,
  exit codes, how `main.js` is built, the Obsidian cache) and "Current expected numbers"
  (line ~1532 on). Also read `draw-steel-elements/e2e/README.md`, `e2e/run.mjs` (use
  `command grep -a` — plain grep treats run.mjs as binary), `e2e/wdio.conf.mts`, and the
  existing `.github/workflows/plugin-ci.yml`.
- Prior art ledgers (only if you need them):
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435*..sc439*`.

## 1. The task

Add a real-Obsidian e2e job to `draw-steel-elements/.github/workflows/plugin-ci.yml` that
runs the full `npm run e2e` (no `--only`, so the coverage gate applies) on every push to
main/develop and on pull_request — the same triggers the file already has. Scope from the
ticket (ledger, "Ticket scope"):

- A separate job (parallel to `test`), `ubuntu-latest`. Install `xvfb` plus whatever
  Electron/Obsidian runtime libraries ubuntu-24.04 lacks. Find out the real list; do not
  guess — the `wdio-obsidian-service` sample plugin ships a GitHub Actions workflow
  (check its repo / the package in `node_modules` / its README), use that as the reference.
- **Ubuntu 24.04 restricts unprivileged user namespaces (AppArmor)**, which breaks Electron's
  sandbox on GitHub runners. Find out how `wdio-obsidian-service` / its sample workflow
  handle it (a `--no-sandbox` arg, `sysctl kernel.apparmor_restrict_unprivileged_userns=0`,
  or something else) and pick the least invasive fix. Say which and why.
- Node version: match the plugin's devbox pin (`draw-steel-elements/devbox.json`; the
  existing job uses 24 — confirm they agree).
- `npm ci`, then the e2e. Find out whether `npm run e2e` builds `main.js` itself or needs a
  build step first.
- Cache the Obsidian download. The cache dir is `${XDG_CACHE_HOME:-~/.cache}/dse-e2e-obsidian`
  (override `OBSIDIAN_CACHE`). Key it on the pinned Obsidian version (1.14.4) — derive the
  key from where the pin actually lives in the repo (so a version bump busts the cache), not
  a hard-coded string, if that is reasonably possible.
- Find out whether the Obsidian download hits the GitHub API (rate limits for unauthenticated
  runner calls); if it does, pass `GITHUB_TOKEN` in env.
- Shards: GitHub's standard runner for a PUBLIC repo is 4 vCPU / 16 GB (the ticket text says
  2 cores — that is outdated; confirm from GitHub docs if you can reach them, otherwise say
  you could not). Choose `--shards` from your measurements in §2.
- On failure (`if: failure()`), upload `e2e/.out/` with `actions/upload-artifact`
  (include hidden files if the dir needs it; set a sane retention, e.g. 14 days). Make sure
  the screenshot is actually inside what gets uploaded.
- **No retries** (ledger: SC-408 rule). Do not add `continue-on-error`, retry wrappers, or
  wdio `specFileRetries`.
- A `timeout-minutes` on the job, set from measured runtime with headroom.
- Comment the job the way the existing file comments its steps (why, not what).
- Update `draw-steel-elements/e2e/README.md` with a short "CI" section (what runs, where the
  failure artifact is, the cache key, no retries). Do NOT edit the dse-verify SKILL.md; if it
  needs a change, write the proposed text to
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r1-skill-proposal.md`.
- If CI needs a small change in `e2e/run.mjs` or the driver (e.g. an env switch for the
  sandbox), keep it minimal and explain it. Out of scope: porting the lifecycle gate (SC-449),
  fixing the known flakes INIT-W10 (SC-654), SET-X03/SET-X04 (SC-657) — report them if seen.

Commit in the plugin repo on branch `sc434-ci-e2e` after each coherent step. **Never push
anything to origin**, never open a PR, never create a tag or release. The owner gets Scott's
go-ahead for the first push.

## 2. Local CI simulation (there is no docker/act on this host)

Build a script that runs the workflow's `run:` steps for the e2e job, in order, against a
FRESH clone of your committed branch, so nothing in the worktree (node_modules, built
`main.js`, `e2e/.out`) leaks in:

- Fresh clone: `git clone <plugin dir> <your private scratch dir>/clone` then checkout your
  branch sha.
- Fresh Obsidian cache for ONE run to prove the cache-miss path (set `OBSIDIAN_CACHE` to an
  empty dir in your scratch dir; record download size/time). For the other runs, copy the
  shared cache (`cp -a ~/.cache/dse-e2e-obsidian <scratch>/obs-cache`) rather than
  re-downloading, and point `OBSIDIAN_CACHE` at the copy.
- `CI=true` in env, `DISPLAY` UNSET (as on a runner).
- Simulate the runner's CPU with `taskset -c 0-3` (4 cores). Measure:
  (a) `--shards=4` under 4 cores, run twice;
  (b) `--shards=2` under 4 cores, once.
  Record wall time, the summary line, and every failure id per run. A failure that is not one
  of the known flakes is a real problem: diagnose it (read the bundle in `e2e/.out/`).
- Broken-test proof (the ticket's "Done means"): in the scratch clone only (never commit it),
  break one cheap assertion in one e2e spec, run that part of the e2e
  (`--only=<ID>` is fine here) through the same script, and show: non-zero exit, and the
  `e2e/.out/<run>/<test-id>/` dir contains the screenshot PNG at the path your upload step
  would pick up. List the files.

Expected full-run summary (dse-verify CURRENT, at `fcc7278e`):
`OBSIDIAN-E2E done: 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`.

## 3. Gates (dse-verify)

- A fresh worktree has no `node_modules`: `npm ci` once in the plugin dir before the first
  gate, via `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log.
- Run in the WORKTREE (not the clone): tsc clean; lint clean; jest `13406 passed / 2 skipped`
  fresh (jest default timeout is 30 s since SC-568; treat "Exceeded timeout" as a real hang);
  full e2e `613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (your 4-core
  simulation run counts if it ran your final sha; say which).
- Lifecycle `npm run obsidian-lifecycle` 64/64 is REQUIRED only if you changed anything
  outside `.github/` and `e2e/README.md`. If you did, run it in SEVEN parts with `--only=`
  (equals sign — with a space it runs the whole suite), comma-separated ids, one part per
  call, logging to a file and polling the pid:
  1. `G-S7a … G-S9a` (21) — take the exact id list from SCENARIOS order in
     `visual-harness/obsidian-lifecycle.mjs`; 2. `G-S9b … G-S40` (16);
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`; 4. `G-S57,G-S62,G-S61,G-S56`;
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`; 6. `G-S92,G-S96,G-S97,G-S99`;
  7. `G-S108,G-S112,G-S115` (~200 s).
  G-S91 FAIL is real unless it says host too slow after two re-runs; G-S115 (g) may flake
  (SC-633): re-run part 7 once. If G-S97 fails, first restore
  `demo-vault/.obsidian/appearance.json` (SC-622).
- Shots / freeze / parity: not needed for a `.github/` + README-only change; if you touched
  `src/` or `visual-harness/`, stop and report NEEDS_CONTEXT first.

## 4. Footguns (each has cost real time)

- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound
  command; devbox's sh wrapper eats `$?`/`$PIPESTATUS` and `| tail` eats failures — record exit
  codes inside a script file run through devbox, and read each gate's summary line.
- Bash tool calls over ~180 s get backgrounded and a background job's completion notice does
  NOT wake you. Run each long step as: start it with output to a uniquely named log, record
  its PID, then poll the PID (`kill -0`) and the log in short foreground calls. Redirect long
  output to files, never stream it (a 600 s silent-agent watchdog exists).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir holds stale
  logs from other sessions. Use your own per-run unique paths.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-<your agent id or a random suffix>/`.
  Unique script and log names inside it. Write scratch files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (permission
  prompts hang background workers). Leave throwaway files in place. No glob deletes, no `rm`
  with a variable path anywhere.
- Never `pkill`/`killall` by pattern: other worktrees run the same gates. Kill only a PID whose
  command line contains your worktree/scratch path, or whose `readlink /proc/<pid>/cwd` is
  inside it.
- The e2e runner reads test titles for scenario ids: never put a bracketed ticket id in a test
  title.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT`
  and the question; I will resume you. If you ever message anyway, the first word must be
  `SC-434:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r1-report.md`.
It must open with a <=10-line executive summary. Then: final branch sha(s); the job YAML
(full text); every decision you made in §1 with the evidence (sandbox fix, apt list, cache
key, GITHUB_TOKEN yes/no, shards choice); the simulation table (run, cores, shards, wall
time, summary line, failure ids); the broken-test proof (exit code, file listing); gate
numbers; `Drive-by fixes:` and `Follow-ups:` lists; and what can only be verified on GitHub.

Final text to me: verdict, shas, measured numbers, and the absolute path of every evidence
artifact (report, logs, the broken-test screenshot).

# SC-434 r5 brief — rebase, GitHub trial of the `e2e` CI job (draft PR), broken-test proof, land-ready prep

You are an implementer worker for ticket SC-434. Your final text goes to the ticket-owner (an
agent), not a human. **Workers never call the tracker (Linear)** — not to read, not to post.
You cannot spawn agents.

## 1. Context loading (read these first, in this order)

1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/decisions.md` — the
   ledger. Current state, Scott's rulings verbatim. The thread is NOT your source; this is.
2. Executive summaries only (first ~15 lines) of
   `.../sc434-ci-e2e/sc434-r3-report.md` and `.../sc434-ci-e2e/sc434-r4-rereview.md`, and the
   section "Broken-test proof" (line ~120) of `.../sc434-ci-e2e/sc434-r1-report.md`.
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — only the
   sections "The battery, in order" (rows 1-4b), "Devbox wrapping", "THE exit-code footgun",
   "Lifecycle and e2e notes". Do not read the whole 2400-line file.
4. `/home/scott/code/steelCompendium/workspace/.claude/skills/land-stack/SKILL.md` §1 (pre-flight
   checks 0, a, b) and §2 — you do NOT land; you prepare a branch that passes those checks.
5. `/home/scott/code/steelCompendium/workspace/docs/worktrees-and-submodules.md` (for step F).

Paths:

- Worktree (superproject): `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e` — branch `sc434-ci-e2e`.
- Plugin repo (submodule clone): `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements`
  — branch `sc434-ci-e2e`, head `e2cf866e` (5 commits over develop `42c26272`), NOT yet pushed.
- GitHub repo: `SteelCompendium/draw-steel-elements` (public). `gh` is authenticated.
- Ledger dir (reports, evidence): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/`
- Your private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc434-r5-impl/`
  (create it; every script and log you write goes there under a unique name).

The branch changes ONLY `.github/workflows/plugin-ci.yml` (new job `e2e`) and `e2e/README.md`
(a CI section). It was independently reviewed and approved at `e2cf866e`.

## 2. Scott's ruling (verbatim from the ledger) and what it covers

The ask he answered, first line: "may I push the `sc434-ci-e2e` branch of draw-steel-elements to
GitHub and open a draft pull request against `develop`, so the new e2e job runs once on GitHub
before it lands?"

Its three steps:

1. "Push the branch and open a **draft** pull request against `develop`. The job should finish green in about 8–12 minutes."
2. "Push one extra commit that breaks one check in one test (NEGO-C01). The job must go red, and its `e2e-out` download must contain that test's screenshot. This is the ticket's "Done means" proof. I will post the run link and the screenshot here."
3. "Drop that commit, confirm the job is green again, and close the pull request **without merging**. The branch then lands through the normal landing flow."

Scott's reply, 2026-11-22, verbatim: **"yes"**

**Hard limits — the yes covers exactly this and nothing else:**

- The ONLY ref you may write on origin is the branch `sc434-ci-e2e` of `SteelCompendium/draw-steel-elements`.
  Never push to `develop`, `main`, or any other branch or repo. Never push the superproject.
- **Never create a tag or a release.** Never merge the PR. Never mark it ready for review.
  Never `--delete-branch`. Never change repo settings, branch protection, secrets, or caches.
- "Drop that commit" = one `--force-with-lease` push of `sc434-ci-e2e` back to the green head
  (exact command in step D). No other force push, ever.
- Commit messages and the PR title/body: **no co-author trailers, no "Generated with", no AI
  attribution of any kind**, no `@mentions`, no emoji.
- Before the first push, list the triggers of every file in
  `draw-steel-elements/.github/workflows/` at your rebased head. If any workflow OTHER than
  `Plugin CI` (`plugin-ci.yml`) would run on a feature-branch push or a pull_request and it
  publishes, deploys, releases or writes anywhere: STOP, do not push, return NEEDS_CONTEXT.

## 3. The task, step by step

Every git command is `git -C <absolute path> …` — never `cd X && git …` (a failed `cd` once
ran a `reset --hard` in the shared main checkout). Verify with `git -C … rev-parse --show-toplevel`
before any write. Implementation never happens under `/home/scott/code/steelCompendium/workspace/`
(the main checkout); its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
`demo-vault/*.md`) is Scott's live vault — ignore it, do not report it.

### A. Rebase and local gates

1. In the plugin repo: `git fetch origin`, then rebase `sc434-ci-e2e` onto **`origin/develop` =
   `3b47e55b710c1bbf7afe9f245c4c1b99e0ea8672`** (if origin/develop is no longer that sha, rebase
   onto the new tip and report the sha). Develop added 3 fixture-table lines to `e2e/README.md`;
   a conflict there is resolved by keeping both sides. `package.json` is unchanged between
   `42c26272` and `3b47e55b`, so no `npm ci` is needed unless `node_modules` is missing.
   The diff vs `origin/develop` must still touch only the two files above.
2. Gates, per `dse-verify` (devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements -- bash <script file>`;
   exit codes recorded by the script file, output redirected to a log; one blocking foreground
   call per gate; nothing in the background). Expected at `3b47e55b`:
   - `npm run tsc` clean; `npm run lint` clean, exit 0.
   - `npx jest`: **13855 passed / 2 skipped** (fresh worktree, no shots cache). If this worktree
     happens to have the shots cache it reads 13856 / 1. `rm -f main.js styles.css` in the plugin
     root first only if dse-verify says it still applies (literal paths, no variables in `rm`).
   - `npm run obsidian-lifecycle`: **64/64, or 63/64 with G-S61 (torn-read) as the only failure**
     — G-S61 is red on base too (SC-668) and is not yours.
   - `npm run e2e`: summary line **`OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`**.
     Known load flakes: INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05. If a full run
     fails ONLY on those ids, record it and re-run once; report both runs.
   - shots / freeze / parity are NOT run: the branch changes no TS or CSS. Prove it instead:
     report `git diff --stat origin/develop..sc434-ci-e2e`.
   You may run B.1–B.2 (push + PR) before the lifecycle and e2e gates so the GitHub run and the
   local gates overlap — the local gate is then your foreground call while GitHub works.
   tsc, lint and jest come before the push.
3. Run `actionlint` on the workflow if a binary is still around (the r2/r3 reports name its
   path); if not, skip and say so.

### B. Green trial on GitHub

1. `git -C <plugin> push origin sc434-ci-e2e` (plain push; the branch does not exist on origin).
2. Open the draft PR:
   `gh pr create -R SteelCompendium/draw-steel-elements --draft --base develop --head sc434-ci-e2e --title "CI trial: real-Obsidian e2e job (SC-434) - will be closed unmerged" --body-file <file>`
   Body (plain, 3-4 lines): this draft PR exists only to run the new `e2e` job of Plugin CI once
   on GitHub's runner before it lands; one commit will deliberately break a test to prove the
   failure artifact, then be dropped; the PR will be closed without merging and the branch
   lands through the normal flow.
3. Find the `pull_request` run of `Plugin CI` for your head sha
   (`gh run list -R … --branch sc434-ci-e2e --json databaseId,headSha,event,status,conclusion,url`).
   Wait with blocking foreground calls of at most 9 minutes each, output to a uniquely named
   log: `timeout 540 gh run watch <id> -R … --exit-status --interval 30 > <log> 2>&1`. Repeat
   until `gh run view <id> --json status,conclusion` says completed. No background jobs, no
   Monitor, no `sleep`.
4. Record for the run: URL, conclusion of EVERY job, the `e2e` job's per-step durations
   (`gh run view <id> --json jobs`), the cache step's hit/miss line, the cache-save step outcome,
   the `OBSIDIAN-E2E done: …` line from the e2e job log
   (`gh run view --job <jobId> -R … --log > <file>`, then grep), the runner image/CPU lines if
   printed. Save the e2e job log to the ledger `evidence/` dir as `sc434-r5-gh-green1-e2e-job.log`.
5. **Expected: all jobs green, e2e line `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`.**
   If the run is NOT green:
   - (i) the `e2e` job failed and the ONLY failed test ids are among INIT-W10, SET-X03, SET-X04,
     NEGO-R05: download the artifact (as in C.3) into `evidence/sc434-r5-gh-green1-flake/`,
     record the ids, then `gh run rerun <id> -R … --failed` ONCE and watch again. Still red →
     STOP, report.
   - (ii) the failure is the environment or the workflow itself (Obsidian or chromedriver does
     not start, a missing shared library, the cache step, a timeout, artifact upload): diagnose
     from the logs. You may push **at most 2 fix commits**, each changing ONLY the `e2e` job in
     `.github/workflows/plugin-ci.yml` (and the CI section of `e2e/README.md` if it describes
     what you changed), each a normal new commit, each followed by a watched run. List them under
     `Fixes made on GitHub:` with sha, diff summary and why — the owner will send them to an
     independent re-review. Not green after 2 → STOP, report with logs. Never add a retry.
     Never touch test code or product code to get green.
   - (iii) any other test fails: download the artifact, STOP, report.
   - An existing job (tsc/lint/jest/build/parity) fails: compare against the latest develop run
     (`44819577392`, green); STOP and report.

Call the green head sha **GREEN** from here on.

### C. Broken-test proof (red run)

1. In the plugin repo, break exactly one assertion of NEGO-C01, as r1 did locally:
   `sed -i "s/'Interest 3 · Patience 3')/'Interest 9 · Patience 9')/" e2e/specs/negotiation/chrome.e2e.ts`
   Check `git -C … diff --stat` shows exactly 1 file, 1 line changed, inside the NEGO-C01 test.
   If the string moved, break the equivalent single assertion in NEGO-C01 and say what you did.
   Commit: `SC-434 trial: deliberately break NEGO-C01 (will be dropped, do not merge)`. Call its
   sha **BROKEN**. Plain `git push origin sc434-ci-e2e`.
2. Watch the new run as in B.3. **Expected: job `e2e` fails; NEGO-C01 is the only failed id
   (summary about `657/667 ok, 1 failed, 9 known-bug`); every other job green; the step timeout
   did not fire.** Save the e2e job log as `evidence/sc434-r5-gh-red-e2e-job.log`.
3. Artifact: list it (`gh api repos/SteelCompendium/draw-steel-elements/actions/runs/<id>/artifacts`),
   expect one named `e2e-out-1`, record its size. Download into a NEW empty directory:
   `gh run download <id> -R … -n e2e-out-1 -D /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-artifact/`
   Find `…/NEGO-C01/screenshot.png`; record its path, byte size and `file` output. Look at it
   (Read tool) and describe in one line what it shows. Copy it to
   `evidence/sc434-r5-gh-red-NEGO-C01-screenshot.png` and `error.txt` to
   `evidence/sc434-r5-gh-red-NEGO-C01-error.txt`. List what else the NEGO-C01 folder holds.
   If the artifact is missing or has no screenshot: that is a real defect in the job — STOP and
   report (do not proceed to D until the owner answers), leaving BROKEN on the branch.

### D. Drop the commit, green again, close the PR

1. Local: `git -C <plugin> reset --hard <GREEN>`; verify `rev-parse HEAD` = GREEN, status clean.
2. Remote, exactly: `git -C <plugin> push --force-with-lease=sc434-ci-e2e:<BROKEN> origin <GREEN>:sc434-ci-e2e`
3. Watch the run this triggers at GREEN (B.3 method). Expected: all green, same e2e summary
   line; this run should show a cache HIT for the Obsidian cache — record hit/miss and the e2e
   job's step durations. Save the log as `evidence/sc434-r5-gh-green2-e2e-job.log`.
   If no run starts within ~3 minutes (same sha already ran), `gh run rerun <green1 id>` is NOT
   wanted; instead report that GitHub did not start a run and close out.
4. `gh pr close <n> -R SteelCompendium/draw-steel-elements --comment "Trial done: green run, deliberate red run with the failure artifact, green again. Closing unmerged; the branch lands through the normal flow."`
   No `--delete-branch`. Verify: `gh pr view <n> --json state,isDraft,mergedAt` → CLOSED, not
   merged. Verify `git ls-remote origin sc434-ci-e2e develop` → branch at GREEN, develop
   unchanged at the sha you rebased onto. Verify no tag was created (`git ls-remote --tags origin | wc -l`
   before the first push and at the end — same count).

### E. Timing sanity (owner's open INFO-3)

From the real runs: is the e2e step comfortably inside its 25-minute step timeout and the job
inside 30? Report the numbers (cache-miss run and cache-hit run); do not change the timeouts
unless a run actually hit one (then that is a B.5(ii) fix).

### F. Superproject branch, land-ready shape

The workspace-level files live in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/` — never under `/home/scott/code/steelCompendium/workspace/`.

1. `git -C /home/scott/code/steelCompendium/worktrees/sc434-ci-e2e fetch origin`. The superproject
   branch `sc434-ci-e2e` has no commits of its own (base `f66b58ce`); bring it to current
   **`origin/main` = `1c877748`** (report the sha if it moved).
2. Other submodules' pins moved on main since the worktree was cut. Bring each submodule you
   did NOT change to the pin `origin/main` records, keeping it on its `sc434-ci-e2e` branch
   (not detached) — per `docs/worktrees-and-submodules.md`. Do not touch `draw-steel-elements`
   this way.
3. ONE commit in the superproject: the `draw-steel-elements` pointer bump to GREEN. Message:
   `chore: bump draw-steel-elements to <GREEN short> (SC-434: Plugin CI runs the real-Obsidian e2e suite)`.
   No CHANGELOG entry (CI is not user-facing). No other file. Do not push.
4. Prove land-stack §1 pre-flight: (0) the worktree's `.gitmodules` says
   `submodule.draw-steel-elements.branch = develop`; (a) `origin/develop` is an ancestor of
   GREEN; (b) gitlink scope vs `origin/main` shows ONLY `draw-steel-elements`;
   `git status --porcelain` empty in the superproject worktree and in the plugin repo.

## 4. Footguns (each has cost real time here)

- Devbox: tools are not on PATH. `devbox run -c <abs plugin dir> -- bash <script file>`; the
  script records `$?` to a file; never pipe a gate into `tail`; never `cd` in a compound command.
- No `rm` with a shell variable or a glob in the path; never `rm -rf` a shared `/tmp` pattern
  (e.g. `/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent effort). Delete only a
  literal path you created.
- Never `pkill`/`killall` by pattern. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside
  `worktrees/sc434-ci-e2e/`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the
  process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Keep every blocking call under 10 minutes (split lifecycle / e2e into
  separate calls; e2e accepts `--shards=N`).
- Use the Write tool for scratch files (no heredocs into scratch).
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input
  mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see
  your completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be your ticket key (`SC-434:`).
- Commit after every coherent step; nothing sits uncommitted through a gate.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r5-report.md`.
It must open with a ≤10-line executive summary. Then raw facts:

- STATUS: DONE | NEEDS_CONTEXT | BLOCKED (and at which step).
- Shas: develop base, GREEN, BROKEN, superproject commit. `git diff --stat origin/develop..GREEN`.
- Local gates: each gate's measured summary line and exit code, log paths.
- PR number + URL + final state. For each GitHub run (green1, red, green2, any rerun/fix runs):
  run id, URL, head sha, per-job conclusion, e2e summary line, e2e job total and per-step
  seconds, cache hit/miss, artifact name and size (or "none").
- Red-run artifact: path of the downloaded folder, of the screenshot copy, of the error text;
  one-line description of the screenshot.
- `Fixes made on GitHub:` (or "none"). `Drive-by fixes:` (or "none"). `Follow-ups:` (or "none").
- Pre-flight outputs from F.4.
- The filesystem path of EVERY evidence artifact you produced.

Your final message to me: the same raw facts, compact — verdict, shas, run URLs, measured
numbers, evidence paths. No prose.

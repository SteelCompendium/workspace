# SC-434 r5 report: rebase, GitHub trial of the `e2e` job, broken-test proof, land-ready prep

## Executive summary

- STATUS: DONE. No deviations from the brief; no fixes were needed on GitHub.
- Rebased `sc434-ci-e2e` onto origin/develop `3b47e55b`, no conflicts. GREEN = `f42546b89ea71c2e465fdb075332cef0405ddeac`. Diff vs develop: 2 files, +187 (`plugin-ci.yml`, `e2e/README.md`).
- Local gates at GREEN: tsc 0, lint 0, jest 13855 passed / 2 skipped, lifecycle 64/64 (7 parts), e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`.
- Draft PR #82 (https://github.com/SteelCompendium/draw-steel-elements/pull/82), now CLOSED, not merged.
- green1 (run 45104797704): all jobs green, e2e `658/667 ok, 0 failed, 9 known-bug, 418/418`, cache miss then saved; job 494 s, e2e step 405 s.
- red (run 45108995763, BROKEN `a6bda3ffbde97c2fb03c8b4a735f3472f74a3dce`): `e2e` failed, NEGO-C01 the only failed id (`657/667 ok, 1 failed, 9 known-bug`), artifact `e2e-out-1` (3,150,088 B) holds `NEGO-C01/screenshot.png` (1440x1100 PNG, 64,354 B).
- green2 (run 45109824506, GREEN again via the one `--force-with-lease` push): all green, same summary line, cache hit; job 359 s, e2e step 290 s.
- Timing: max e2e step 405 s of 1500 s; max job 494 s of 1800 s. No timeout fired.
- Superproject: one commit `88b6098272fe383053c165b4b83dc0400ddaf5c7` on `sc434-ci-e2e` over origin/main `1c877748`, pointer bump to GREEN only; not pushed. Pre-flight (0), (a), (b) pass; both worktrees clean.
- Tag count on origin: 47 before, 47 after. origin develop still `3b47e55b`; origin sc434-ci-e2e at GREEN.

## Shas

| Name | Sha |
|---|---|
| develop base (origin/develop, rebased onto, unchanged at the end) | `3b47e55b710c1bbf7afe9f245c4c1b99e0ea8672` |
| GREEN (plugin branch head, now on origin) | `f42546b89ea71c2e465fdb075332cef0405ddeac` |
| BROKEN (dropped; only existed on origin during the red run) | `a6bda3ffbde97c2fb03c8b4a735f3472f74a3dce` |
| origin/main (superproject base) | `1c87774877eb5bd782449326253782e1e3e30cea` |
| superproject pointer-bump commit (local only) | `88b6098272fe383053c165b4b83dc0400ddaf5c7` |

Branch over develop (5 commits, rebased from `e2cf866e`): `fea6ae8d` job, `7f17749d` README, `cfc409cd` comment, `96379bdc` r3 fixes, `f42546b8` find-not-compgen. The rebase had no conflicts (the three fixture lines that develop added to `e2e/README.md` merged automatically). `package.json` unchanged between `42c26272` and `3b47e55b`; `node_modules` present, no `npm ci`.

`git diff --stat origin/develop..GREEN`:
```
 .github/workflows/plugin-ci.yml | 164 ++++++++++++++++++++++++++++++++++++++++
 e2e/README.md                   |  23 ++++++
 2 files changed, 187 insertions(+)
```
shots / freeze / parity not run: the branch changes no TS or CSS (the stat above is the proof).

## Workflow-trigger check before the first push

At the rebased head, `draw-steel-elements/.github/workflows/` holds two files. `plugin-ci.yml` (`Plugin CI`): `push` to main/develop and `pull_request`. `ci.yml` (`ci`, the one with `contents: write`): `push` to `main` and `develop` only, so it does not run on a feature-branch push or a pull_request. Nothing else ran on the trial (the run list showed only `Plugin CI` runs for the branch).

## Local gates (GREEN, worktree `.../worktrees/sc434-ci-e2e/draw-steel-elements`, devbox script files, exit codes read from the scripts' `.rc` files)

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean | 0 |
| `npm run lint` | clean (`eslint src main.ts e2e`) | 0 |
| `npx jest` (after `rm -f main.js styles.css`: stale Nov 15 build artifacts, gitignored) | `Test Suites: 1 skipped, 300 passed, 300 of 301 total`; `Tests: 2 skipped, 13855 passed, 13857 total` (fresh worktree, no shots cache) | 0 |
| `npm run obsidian-lifecycle`, 7 `--only` parts | p1 21/21, p2 16/16, p3 9/9, p4 4/4 (G-S61 passed this time), p5 7/7, p6 4/4, p7 3/3 = 64/64 ok, 0 failed | all 0 |
| `npm run e2e -- --shards=4` (one run, no flakes, no re-run) | `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` | 0 |

actionlint: no binary on this host any more (the r2 reviewer's `bin/actionlint` is gone from scratch), so skipped. The GitHub runs parsed and ran the workflow.

Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-local-gates/` (`gate-tsc`, `gate-lint`, `gate-jest`, `gate-lc-p1`..`p7`, `gate-e2e-run1`, each `.log` and `.rc`).

## Pull request

#82, https://github.com/SteelCompendium/draw-steel-elements/pull/82, draft, base `develop`, head `sc434-ci-e2e`. Title `CI trial: real-Obsidian e2e job (SC-434) - will be closed unmerged`. Closed with the brief's comment; `gh pr view 82 --json state,isDraft,mergedAt` = `CLOSED`, `isDraft` true, `mergedAt` null. No `--delete-branch`; the branch remains on origin at GREEN.

## GitHub runs (workflow `Plugin CI`, jobs: `test`, `e2e`; there is no separate tsc/lint/build/parity job in this workflow)

| | green1 | red | green2 |
|---|---|---|---|
| run id / URL | 45104797704 https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45104797704 | 45108995763 https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45108995763 | 45109824506 https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45109824506 |
| event / head sha | pull_request / GREEN | pull_request / BROKEN | pull_request / GREEN |
| `test` job | success, 275 s | success, 282 s | success, 336 s |
| `e2e` job | success, 494 s | failure, 367 s | success, 359 s |
| workflow wall | 498 s | 372 s | 363 s |
| e2e summary line | `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` | `657/667 ok, 1 failed, 9 known-bug, coverage: 418/418 pairs`; only failure `NEGO-C01` | `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` |
| Obsidian download cache (key `dse-e2e-obsidian-Linux-X64-1.14.4-launcher-3.3.0`) | MISS ("Cache not found"); saved after the run | HIT | HIT |
| cache-completeness check / save | ran / "Cache saved" (13 s) | skipped / skipped (step failed) | skipped / skipped (hit) |
| artifact | none (total_count 0) | `e2e-out-1`, 3,150,088 B | none (total_count 0) |
| upload step | skipped | success (3 s) | skipped |

Per-step seconds of the `e2e` job (from the step timestamps):

| Step | green1 (miss) | red (hit) | green2 (hit) |
|---|---|---|---|
| Set up job | 1 | 3 | 3 |
| checkout | 2 | 6 | 5 |
| setup-node (npm cache hit in all three) | 6 | 8 | 8 |
| Install dependencies (`npm ci`) | 63 | 43 | 44 |
| Resolve pinned Obsidian version | 0 | 1 | 0 |
| Restore Obsidian cache | 0 (miss) | 4 | 4 |
| End-to-end tests (real Obsidian, 4 shards) | 405 | 296 | 290 |
| completeness check | 0 | skipped | skipped |
| Save Obsidian cache | 13 | skipped | skipped |
| Upload failure bundles | skipped | 3 | skipped |

Runner: `Image: ubuntu-24.04`, image version `20261116.376.1`, provisioner `20261111.635`. No CPU/model line is printed in the job log. Node 24.22.3 from the hosted tool cache. The log shows only the Node 20 deprecation annotation (actions forced to Node 24), no other warning; the `Obsidian download cache is incomplete` warning did not appear.

The red run did not need to be a cache miss: the green1 save created the cache on the PR's ref, and the red and green2 runs on the same PR restored it. After the branch lands, the first develop push will miss and seed the develop-scope cache (PR caches are not visible to develop, develop caches are visible to PRs).

Job logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-green1-e2e-job.log`, `.../sc434-r5-gh-red-e2e-job.log`, `.../sc434-r5-gh-green2-e2e-job.log`. Run JSON (jobs, steps, timestamps): `.../evidence/sc434-r5-local-gates/green1.json`, `red.json`, `green2.json`.

## Broken-test proof (red run)

- Edit: `sed -i "s/'Interest 3 · Patience 3')/'Interest 9 · Patience 9')/" e2e/specs/negotiation/chrome.e2e.ts`; `git diff --stat` = 1 file, 1 insertion, 1 deletion, line 14 inside `[NEGO-C01]`. The string had not moved. Commit message: `SC-434 trial: deliberately break NEGO-C01 (will be dropped, do not merge)` (BROKEN above).
- Job log: `OBSIDIAN-E2E NEGO-C01 FAIL: ... Expected: StringContaining "Interest 9 · Patience 9" | Received: "NEGOTIATION: Convincing Frodo to remember the taste of strawberries (Interest 3 · Patience 3)"`; then `done: 657/667 ok, 1 failed, 9 known-bug`; `Process completed with exit code 1`. The 25-minute step timeout did not fire (296 s). The `Upload failure bundles` step ran and uploaded `e2e-out-1`.
- Artifact: `gh api .../actions/runs/45108995763/artifacts` = one artifact `e2e-out-1`, 3,150,088 B, not expired. Downloaded into a new directory `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-artifact/` (9.6 MB unpacked). Layout: `<run>/` = `20261123-035901-3a97/`, holding `NEGO-C01/` plus the 9 known-bug test folders (`COND-C04 COND-N04 COND-N05 NEGO-W06 NEGO-W07 SET-G06 SET-L01 SET-L02 SET-L03`, each with a `screenshot.png`), `plugin/`, `results/`, `coverage/`, and `coverage.json`.
- Screenshot path: `.../evidence/sc434-r5-gh-red-artifact/20261123-035901-3a97/NEGO-C01/screenshot.png`, 64,354 bytes, `PNG image data, 1440 x 1100, 8-bit/color RGB, non-interlaced`. It shows the real Obsidian window (file explorer on the left, note `Negotiation / basic`) with the negotiation card collapsed to its one-line form: "NEGOTIATION: Convincing Frodo to remember the taste of strawberries (Interest 3 · ..." with an expand chevron, ABOVE / BELOW text around it.
- Copies: `.../evidence/sc434-r5-gh-red-NEGO-C01-screenshot.png` and `.../evidence/sc434-r5-gh-red-NEGO-C01-error.txt`.
- The NEGO-C01 folder holds: `screenshot.png`, `dse-root.png`, `dse-root.html`, `modals.html`, `events.json`, `versions.json`, `vault-path.txt`, `error.txt`, `note-before.Negotiation_basic.md`, `note-after.Negotiation_basic.md`, `note.Negotiation_basic.md.diff`, `vault-copy/`.

## Drop the commit

`git reset --hard f42546b8` (HEAD verified = GREEN, status clean), then exactly: `git -C <plugin> push --force-with-lease=sc434-ci-e2e:a6bda3ffbde97c2fb03c8b4a735f3472f74a3dce origin f42546b89ea71c2e465fdb075332cef0405ddeac:sc434-ci-e2e` (`+ a6bda3ff...f42546b8 ... (forced update)`). GitHub started the run for GREEN about 3 minutes after the push (04:06:28Z), so the brief's "no run started" branch did not apply, and no rerun was used. That is the only force push.

## Final origin state

`git ls-remote origin sc434-ci-e2e develop main`: `sc434-ci-e2e` = GREEN `f42546b8`, `develop` = `3b47e55b` (unchanged), `main` = `e38d4de4` (untouched). `git ls-remote --tags origin | wc -l` = 47 before the first push and 47 at the end. Nothing was tagged, released or merged.

## Timing sanity (E, INFO-3)

- e2e step (timeout 25 min = 1500 s): 405 s on the cache-miss run (includes the Obsidian + chromedriver download), 296 s and 290 s on the cache-hit runs. Peak is 27 % of the step timeout.
- e2e job (timeout 30 min = 1800 s): 494 s (miss), 367 s (red), 359 s (hit). Peak is 27 % of the job timeout. No timeout was approached; none changed. The `test` job runs in parallel (275-336 s) and is not the long pole.

## Superproject branch (F), worktree `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e`

- Fetched; `origin/main` = `1c877748`. The branch had no commits of its own, so `git merge --ff-only origin/main` moved it from `f66b58ce`. Between `f66b58ce` and `1c877748` only the `draw-steel-elements` gitlink changed among the submodules; the other seven already matched main's pins and are all on branch `sc434-ci-e2e` (checked with `rev-parse` of each HEAD against `origin/main:<path>`), so no submodule needed moving.
- ONE commit `88b60982`: `chore: bump draw-steel-elements to f42546b8 (SC-434: Plugin CI runs the real-Obsidian e2e suite)`; `git show --stat`: `draw-steel-elements | 2 +-`, no other file; no CHANGELOG entry. Not pushed. No trailers or attribution in any commit I made (the plugin branch's earlier commits are the already-reviewed r1/r3 commits).
- land-stack §1 pre-flight outputs:
  - (0) `.gitmodules`: `submodule.draw-steel-elements.branch = develop`
  - (a) `git -C <plugin> merge-base --is-ancestor origin/develop HEAD`: true (develop `3b47e55b`)
  - (b) `git diff --raw origin/main..HEAD`: `:160000 160000 3b47e55b f42546b8 M draw-steel-elements` and nothing else
  - `git status --porcelain`: 0 lines in the superproject worktree, 0 lines in the plugin repo; plugin HEAD = GREEN.

## Fixes made on GitHub

None.

## Drive-by fixes

None.

## Follow-ups

1. Cache scope (already in r1's list, now observed): the Obsidian download cache saved by a PR run is visible only to that PR. After landing, the first `develop` push will be a cold run (about 400 s e2e step) and save a develop-scope cache; later PRs restore it.
2. On a PR, a force-push back to a sha that already ran gets a fresh run (it started about 3 minutes after the push in this trial); worth knowing if the owner wants to repeat the trial.
3. Node 20 deprecation annotation appears on every run (`actions/cache`, `checkout`, `setup-node`, `upload-artifact` at v4); same as r1's follow-up 3, not changed.
4. The workflow does not make `e2e` a required check; unchanged per the owner's default.

## Evidence artifacts (all absolute)

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r5-report.md` (this file)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-green1-e2e-job.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-e2e-job.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-green2-e2e-job.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-artifact/` (full downloaded `e2e-out-1`)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-NEGO-C01-screenshot.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-gh-red-NEGO-C01-error.txt`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sc434-r5-local-gates/` (local gate logs + `.rc`, and the three run JSONs)
- Raw scratch (not durable): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc434-r5-impl/`

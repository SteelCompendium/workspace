**Ask: may I push the `sc434-ci-e2e` branch of draw-steel-elements to GitHub and open a draft pull request against `develop`, so the new e2e job runs once on GitHub before it lands?** A reply of "yes" is enough. Nothing has been pushed yet.

The new CI job runs the full real-Obsidian e2e suite on every push to `develop`/`main` and on every pull request. It is written, reviewed and passes locally. The checks I can't do on this machine can only happen on GitHub: that Obsidian starts on GitHub's Ubuntu 24.04 runner, that the cache works, and that a failing run uploads the screenshot. Plugin CI only runs on pushes to `develop`/`main` and on pull requests, so a draft pull request is the only way to try it before landing.

**What I would do with a yes:**

1. Push the branch and open a **draft** pull request against `develop`. The job should finish green in about 8–12 minutes.
2. Push one extra commit that breaks one check in one test (NEGO-C01). The job must go red, and its `e2e-out` download must contain that test's screenshot. This is the ticket's "Done means" proof. I will post the run link and the screenshot here.
3. Drop that commit, confirm the job is green again, and close the pull request **without merging**. The branch then lands through the normal landing flow. The first push to `develop` runs the job there, which covers "green on `develop`".

The alternative is to skip the pull request, land it, and watch the first `develop` run. Then a broken first run is red on `develop` itself. I recommend the pull request.

**One default you can overrule:** I will **not** make `e2e` a required check in GitHub's branch protection. Landings push straight to `develop` with no pull request, and a required check would block those pushes. The local e2e run stays the landing rule, as you set on SC-408.

**For your information, nothing to decide:**

* **No retries**, per your SC-408 rule that a flake is a bug. INIT-W10 (SC-654), SET-X03/SET-X04 (SC-657) and NEGO-R05 are known to flake under heavy load on this machine. None failed in 7 local runs pinned to 4 cores. If one does fail on GitHub, the job shows a red X (failed) and the existing tickets cover it.
* **Cost:** the repo is public, so GitHub's standard runners cost nothing.
* **Runner:** pinned to `ubuntu-24.04`, not `ubuntu-latest`, because GitHub is moving `ubuntu-latest` to 26.04 starting this month.
* **The UI question from SC-408:** the tests start their own invisible screen, and Obsidian's launcher already turns off the Linux sandbox that Ubuntu 24.04 restricts. No extra packages are needed.

+++ Mechanics

* Branch `sc434-ci-e2e` @ `e2cf866e`, on develop `42c26272`. It changes only `.github/workflows/plugin-ci.yml` (a new job, `e2e`) and `e2e/README.md` (a CI section).
* Job: `npm ci`, then `npm run e2e -- --shards=4` (the full run, coverage gate on). The step timeout is 25 minutes and the job timeout is 30. Permissions are `contents: read`.
  * Obsidian cache key: OS, architecture, the Obsidian pin read from `e2e/run.mjs` (1.14.4) and the `obsidian-launcher` version. The cache is saved only when it is complete.
  * The `e2e-out-<attempt>` artifact is uploaded on failure or cancel and kept for 14 days.
  * Pull request runs cancel the older run on a new push; `develop`/`main` runs never cancel.
* Local simulation: a fresh clone, `CI=true`, no display, `taskset` to 4 cores, 4 shards. Results:
  * 6 runs at `fcc7278e`, one of them from an empty cache: all `613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, with the e2e step taking 342–677 s.
  * At `42c26272`: `622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` in 347 s.
* Broken-test proof done locally: exit 1, with `e2e/.out/<run>/NEGO-C01/screenshot.png` present.
* Gates at the head: tsc and lint are clean; jest gives 13447 passed / 2 skipped, which is the fresh-worktree number.
* Review: an independent review found 2 MEDIUM and 4 LOW issues, and no blocker. All are fixed except one LOW, which was dropped: a strict version parse that fails loudly. The scoped re-review of the fixes approved them.

+++

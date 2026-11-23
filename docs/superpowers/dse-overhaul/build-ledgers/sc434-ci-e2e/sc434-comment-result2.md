**The new e2e job works on GitHub. It ran the full real-Obsidian suite and passed, a deliberately broken test made it fail with that test's screenshot in the download, and it passed again once the break was removed.** Nothing here needs a decision. The branch is ready to land.

**What happened on the draft pull request** ([#82](https://github.com/SteelCompendium/draw-steel-elements/pull/82), now closed without merging):

1. **Passed.** [Run 1](https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45104797704) reported `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`. That is the same line the suite prints on this machine. The job took 8 min 14 s, including the first download of Obsidian.
2. **Failed on purpose.** I changed one expected text in NEGO-C01. [Run 2](https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45108995763) failed, and NEGO-C01 was the only failed test (`657/667 ok, 1 failed`). Its `e2e-out-1` download (3.2 MB) contains `NEGO-C01/screenshot.png`, shown below.
3. **Passed again.** I removed that commit. [Run 3](https://github.com/SteelCompendium/draw-steel-elements/actions/runs/45109824506) passed with the same line as run 1, in 6 min, with Obsidian loaded from the cache.

**The screenshot from the failed run's download.** It is the real Obsidian window on GitHub's runner, showing the `Negotiation/basic` note with the negotiation card collapsed to one line. The card reads "Interest 3 · Patience 3"; my deliberate break made the test expect "Interest 9 · Patience 9".

{{IMG:sc434-r5-gh-red-NEGO-C01-screenshot.png}}

**What is left:** landing. The ticket's "Done means" also says the job is green on `develop`. The first push to `develop` runs it there. I will check that run and confirm here before closing the ticket. That run downloads Obsidian again (about 8 minutes in total), because GitHub does not share a pull request's cache with `develop`.

**For your information:**

* None of the known flaky tests (INIT-W10, SET-X03, SET-X04, NEGO-R05) failed in the three GitHub runs or in the local run.
* The slowest e2e step took 6 min 45 s against its 25-minute limit.
* The branch `sc434-ci-e2e` is still on GitHub, because the closed pull request points at it. I did not delete it. It is safe to delete after landing.
* `e2e` is not a required check in branch protection, as proposed in the ask.
* Every job, old and new, shows GitHub's "Node.js 20 is deprecated" note. GitHub already runs those actions on Node 24 and they pass, so I left the action versions alone.

+++ Mechanics

* draw-steel-elements branch `sc434-ci-e2e` @ `f42546b8`, rebased onto develop `3b47e55b` with no conflicts. It changes only `.github/workflows/plugin-ci.yml` (+164) and `e2e/README.md` (+23). No change since the approved review except the rebase.
* Local gates at `f42546b8`: tsc and lint clean; jest 13855 passed / 2 skipped (fresh worktree); lifecycle 64/64; e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`. Shots, freeze and parity were not run: no TypeScript or CSS changed.
* GitHub runs, all on `ubuntu-24.04` with 4 shards:
  * Run 1 (45104797704): cache miss, then saved. e2e job 494 s, e2e step 405 s.
  * Run 2 (45108995763): cache hit. e2e job 367 s, step 296 s. The other job (`test`) passed.
  * Run 3 (45109824506): cache hit. e2e job 359 s, step 290 s.
* Pushes to GitHub: the branch, the one breaking commit `a6bda3ff`, and one `--force-with-lease` push of the same branch back to `f42546b8`. `develop` and `main` were not touched. No tag was created (47 tags before and after).
* The failed run's download also holds, for NEGO-C01: `error.txt`, the card's own image and HTML, the note before / after / diff, and a copy of the vault.
* Workspace pointer commit `88b60982` on main `1c877748`, not pushed. The dispatcher lands it.

+++

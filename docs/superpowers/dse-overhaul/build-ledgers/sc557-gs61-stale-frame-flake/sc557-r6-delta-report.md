# SC-557 r6 delta check: `41c03e60..d689b719` (dse, base `31d8f779`)

## Executive summary
- **Verdict: LAND.** HIGH 0 / MEDIUM 0 / LOW 1 (proposal wording only) / INFO 1.
- **Delta** (+8/-4, `visual-harness/obsidian-lifecycle.mjs`, entirely inside G-S61):
  - The recorder now counts torn reads in a row (`R.tornRun`, `R.tornLongest`, `:5721-5722`).
  - `wrongCards` fails a phase on 3 or more in a row (`:5624`). That check runs after the pending/counted check and before the cap.
  - The outcome line now prints `(longest run L)`, and the comment says why. It reads plainly and does what the r4 LOW-A asked.
- **Probe T on `d689b719`**, run from a `git archive HEAD` export by following proposal §3 step by step, with `sc557-r5-tool-probe-patch.py` from the ledger: **FAIL in all 9 recorded phases** with "the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run". N is 124-177. On `41c03e60` the same probe passed.
- **Green G-S61 alone, idle** (no loops; 1-min loadavg 0.36): **ok**. Longest torn run 0 in every phase. 0 counted, 0 pending; catching up at most 1 frame / 17 ms.
- **LOW-C:** proposal §3's Bundle bullet says that leaving `DSE_LIFECYCLE_BUNDLE` unset uses "the plugin's own fresh build ... (the harness builds it)". That is wrong. The harness does not build (`npm run obsidian-lifecycle` = `npm run build-no-check && node …`), and a `git archive` copy has no `main.js`. My export had none until I built it. All four commands pass `DSE_LIFECYCLE_BUNDLE` explicitly, so the commands themselves work.
- Tree: the plugin is clean, and the superproject shows ` M draw-steel-elements`, both unchanged. Nothing committed, no tracker calls. Only the 2 runs the brief asked for.

## Findings

### LOW-C: proposal §3 Bundle bullet claims the harness builds the plugin
- Where: `sc557-dse-verify-proposal.md:39`.
- Scenario: someone follows "leave it unset" in a `git archive` copy, which is the place §3 itself recommends running from. `bundleDir` defaults to the copy (`obsidian-lifecycle.mjs:6447`), and the copy has no `main.js`, so the run cannot load the plugin.
- Fix: replace "Leave it unset to use the plugin's own fresh build in the tree you run from (the harness builds it)" with: "Unset, it loads `main.js`/`styles.css` from the tree you run from. The harness does not build them, so first run `node esbuild.config.mjs production` (or `npm run build-no-check`) in that tree." Text only, and the dispatcher can fold it when applying the proposal.

### INFO-1: following §3 literally, the exit code is lost, as the proposal warns
- With the command shape `devbox run -c <plugin> -- bash -c 'cd <scratch> && … node … > <log> 2>&1'`, the `rc=` I echoed inside the same `bash -c` read 0 on the FAIL run.
- That is devbox's wrapper eating `$?`, which §3 already warns about ("Read the exit code from a script file … the log's `OBSIDIAN-LIFECYCLE G-S61 FAIL` line is the result"). The warning is accurate; no change needed.

## Steps run (proposal §3, literally)
1. `git -C <plugin> archive HEAD | tar -x -C <scratch>/r6-tree` (HEAD = `d689b719`), then `ln -s <plugin>/node_modules <scratch>/r6-tree/node_modules`.
2. `python3 -I <ledger>/sc557-r5-tool-probe-patch.py <tree>/visual-harness/obsidian-lifecycle.mjs <tree>/visual-harness/obsidian-lifecycle-probe.mjs`: rc 0.
3. The bundle, built per the "build of a given commit" recipe in the same tree (`node esbuild.config.mjs production`): main.js `8e969de2…`, styles.css `93be34af…`, byte-identical to before.
4. T: `devbox run -c <plugin> -- bash -c 'cd <tree> && DSE_LIFECYCLE_BUNDLE=<tree> SC557_BADREAD=torn SC557_INJ=2:7:400 node visual-harness/obsidian-lifecycle-probe.mjs --only=G-S61 > <log> 2>&1'`. Result: G-S61 FAIL. The per-phase lines show `u` 8-25, torn equal to the number of frames, and failed 0.
5. Green: the same shape with the unpatched `visual-harness/obsidian-lifecycle.mjs` and no probe env. Result: G-S61 ok, torn 0 (longest run 0) in all 9 phases.

## Artifacts
- Ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/`:
  - Logs: `sc557-r6-T.log`, `sc557-r6-green-idle.log`, `sc557-r6-build.log`.
  - `sc557-r6-summary.log`.
  - Tools: `sc557-r6-tool-steps.sh`, `sc557-r6-tool-sum.py`.
- Export: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r2-review-r2k7vx/r6-tree/` (with `visual-harness/obsidian-lifecycle-probe.mjs`).
- The harness kept the FAIL dir `/tmp/dse-obsidian-lifecycle-1BtoYk` (not deleted).

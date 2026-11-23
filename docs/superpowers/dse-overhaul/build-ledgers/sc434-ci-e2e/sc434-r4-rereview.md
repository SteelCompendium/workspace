# SC-434 r4 scoped re-review: r3 delta at `e2cf866e`

## Summary

- **Verdict: APPROVE.** No BLOCKER, HIGH, MEDIUM or LOW findings; three INFO notes. Reviewed head `e2cf866e9cce98f7431a6d8f88cd34daf210d161` on `sc434-ci-e2e`, base develop `42c26272` (equal to `origin/develop`).
- **Rebase is clean.** `git range-diff fcc7278e..029d012a 42c26272..e2cf866e` shows the three r1 commits unchanged (`=`): `4b59ee39`, `c3cc908e` and `ed48b440`. On top come only `c08f5823` and `e2cf866e`. `git diff --stat 42c26272..e2cf866e` touches exactly `.github/workflows/plugin-ci.yml` and `e2e/README.md`.
- **r2 findings are fixed.** MEDIUM-1, MEDIUM-2, LOW-1, LOW-3, LOW-4, the artifact-name INFO and the README INFO are all folded in correctly. LOW-2 was dropped by the owner, and I agree: the strict sed fails loudly.
- **Deviation (1), `find` instead of `compgen`: accepted.** It was needed. Devbox's bash (`/nix/store/...-bash-5.3p3`) gives `compgen: command not found`, while `/bin/bash` has it. Under bash `-e`, my `compgen` line would have reported "incomplete" for a complete cache. `find` works in both.
- **Deviation (2), concurrency group by ref for PRs and by run id for pushes: accepted.** It is better than my snippet. Even with `cancel-in-progress: false`, GitHub replaces an existing *pending* run in the same group. A shared push group could therefore silently drop a develop push.
- **actionlint v1.7.7: 0 errors.** The shellcheck and pyflakes rules were off, as in r2.
- **The completeness check behaves correctly under both bashes.** I ran it against 10 cache variants under system bash and devbox bash: only the complete cache gives `complete=true`. Every other variant warns and exits 0.
- **No new full sim needed.** The implementer's `622/631 ok, 0 failed, 9 known-bug, 417/417` at `e2cf866e` matches dse-verify CURRENT at `42c26272`. Nothing I found casts doubt on it.

## Probes

### actionlint

`.../sc434-r2-rv/bin/actionlint -verbose .github/workflows/plugin-ci.yml` found 0 parse errors and 0 errors. This also type-checks the new expressions: concurrency at `:117-118`, `run_attempt` at `:246`, and the step `env:` at `:216`.

### Completeness-check shell (`plugin-ci.yml:212-226`)

- The step body was extracted from the committed YAML with the `yaml` package and run with `-e`, the same way the runner runs it.
- The 10 variants were hard-link copies of the cached Obsidian download: complete, no asar, no installer, no chromedriver, an empty chromedriver version dir, only `obsidian-versions.json`, an empty dir, the asar present only as a leftover `.tmp.` scratch dir, a wrong `OBSIDIAN_VERSION`, and a missing cache dir.
- Results were identical under `/bin/bash` (Ubuntu 22.04) and devbox bash 5.3p3:
  - complete: `rc=0`, output `complete=true`;
  - all 9 others: `rc=0`, no output, `::warning::Obsidian download cache is incomplete; not saving it`.
- The find depth is right: `-mindepth 2 -maxdepth 2` under `electron-chromedriver/linux-x64` matches `<version>/chromedriver`.
- The implementer's sim also points this step at the prepared cache (`evidence/sim.mjs:58`), so their r10 "check silent" result was measured on the cache the run actually used.
- `compgen` check: devbox bash gives `compgen: command not found`; `/bin/bash` gives `compgen -G` OK.

### `if:` expressions (read against Actions semantics; not executable locally)

Steps: check `:214` `!cancelled() && cache-hit != 'true'`; save `:229` `!cancelled() && complete == 'true'`; upload `:243` `failure() || cancelled()`; e2e step timeout 25 at `:201`.

| State | Check | Save | Upload |
|---|---|---|---|
| green, cache miss | runs, prints `complete=true` | runs | skipped |
| green, exact hit | skipped | skipped (output empty) | skipped |
| red e2e (exit 1 or 2), miss | runs | only if complete | runs |
| red e2e, hit | skipped | skipped | runs |
| e2e step timeout (step fails) | runs | only if complete | runs |
| job cancelled (superseded PR, or job timeout) | skipped | skipped | runs |
| `npm ci` / pin step fails before the cache dir is known | runs, warns "incomplete" (INFO-1) | skipped | runs (`if-no-files-found: warn`) |
| restore errors (cache service down; v4 only warns) | runs | if complete | n/a |

All states behave as intended. The step-timeout row relies on a step timeout "killing the process" and marking the step failed, rather than cancelling the job; that can only be confirmed on a real run.

### Concurrency (`:116-118`)

- `github.event_name == 'pull_request' && github.ref || github.run_id` gives `e2e-refs/pull/<n>/merge` for a PR and `e2e-<run id>` for a push.
- A push therefore never shares a group, so no push is ever pending-replaced or cancelled. A re-run of the same run keeps its run id, which is harmless.
- `cancel-in-progress` is true only for pull_request.
- It is job-level, so the `test` job is unaffected.

### Launcher key (`:155-161`, `:174`, `:233`)

The sim recorded `launcher=3.3.0`. The restore and save keys are identical strings.

## Findings

### INFO-1: misleading warning when an early step fails

- Where: `plugin-ci.yml:214`.
- When `npm ci` or the pin step fails, the check still runs (`cache-hit` is empty, so not `'true'`). With `OBSIDIAN_CACHE` unset it prints "Obsidian download cache is incomplete".
- Harmless: the save is skipped and the step exits 0. Optional: add `&& steps.pin.outcome == 'success'` to the check's `if:`.

### INFO-2: an upload on every superseded PR run

- Where: `plugin-ci.yml:243`.
- `cancelled()` now also fires for every PR run that a newer push cancels, so those runs upload a partial `e2e/.out/` (up to about 9 MB, kept 14 days).
- That is noise, not harm. Since the e2e step timeout now covers the hang case, `failure() || (cancelled() && github.event_name != 'pull_request')` would drop the noise, at the cost of losing the rare PR job-timeout outside the e2e step. Either is defensible; I would leave it.

### INFO-3: headroom after the step timeout is about 3 minutes

- Where: `plugin-ci.yml:123`, `:201`.
- Before the e2e step: checkout, setup-node, `npm ci` (about 10-30 s) and restore (185 MB). So a 25-minute step timeout lands at about minute 26-27.
- That leaves about 3 minutes for the check, the save (only on a miss) and the upload. That is enough for a hang's small bundle set. Optional: `timeout-minutes: 35` on the job, if the first real runs show the setup steps are slow.

The pin step's launcher read (`:155`) fails before its own `::error` line, because `bash -e` exits on the failing `node` inside the assignment. It still fails loudly, so no change is needed.

## Working tree

`git status --porcelain` in the plugin worktree is empty before and after, and HEAD is `e2cf866e`. Nothing was committed, pushed or deleted.

## Artifacts

- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/r4-check-probe.sh` (the probe)
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/r4-check-system-bash.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/r4-check-devbox-bash.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/r4-plugin-ci.yml` (the YAML at `e2cf866e`)
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/r4-variants/` (the hard-link cache variants)

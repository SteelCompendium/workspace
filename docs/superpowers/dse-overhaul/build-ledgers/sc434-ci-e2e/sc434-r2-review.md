# SC-434 r2 review: e2e job in Plugin CI (draw-steel-elements `029d012a`)

## Executive summary

- **Verdict: APPROVE WITH FIXES.** No blockers, no highs. Two MEDIUM, four LOW, a few INFO.
- Reviewed `git diff fcc7278e..029d012a`: `.github/workflows/plugin-ci.yml` (+106) and `e2e/README.md` (+22) only. There is no runtime change, so nothing changes for local runs.
- I re-ran the 4-core sim at `029d012a` (fresh clone, `CI=true`, no `DISPLAY`, `taskset -c 0-3`, shards from the YAML = 4, copied cache): `OBSIDIAN-E2E done: 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`. e2e step 440.3 s, total 450.2 s, host load 2.6 at the start, about 24 at the peak. No flakes.
- `actionlint` v1.7.7: 0 errors (the shellcheck rule was unavailable). Sandbox, apt, Xvfb, cache path, no-retry and the "green while proving nothing" guards all check out.
- MEDIUM-1: the save-on-failure cache step can freeze an empty or partial Obsidian cache under an immutable key. After that, every run re-downloads and nothing ever re-saves.
- MEDIUM-2: if the job hits its 30-minute timeout, GitHub cancels it, so the `if: failure()` upload never runs. The hang case, where the bundle matters most, uploads nothing. Fix: a step-level timeout on the e2e step.
- LOW: no `permissions:` block (the repo default is already `read`, verified); the PINNED extractor is strict (it fails loudly, which is fine); the cache key ignores the obsidian-launcher version; no `concurrency`.
- The `ubuntu-24.04` pin is right on the merits (see INFO-1).

## Findings

### MEDIUM-1: a red run can freeze an incomplete Obsidian cache under the immutable key

- Where: `.github/workflows/plugin-ci.yml:174-179` (save `if: !cancelled() && cache-hit != 'true'`). Related: `e2e/run.mjs:464-465` creates the cache dir (`fs.mkdirSync(cache)`) before the build at `:479`, the Xvfb start at `:495` and wdio's download in onPrepare.
- Scenario: a cold run (first develop push, or a new pin) fails after `run.mjs` has started but before every download has finished. Causes include a build break (exit 2 at `:480`), Xvfb failing, or a network error between the installer, the asar and the chromedriver downloads. The e2e step fails, and the save step still runs, because `!cancelled()` is true and the restore missed. `@actions/cache` `resolvePaths` globs with `implicitDescendants: false` and only rejects a path that does not exist. An existing empty directory, or one holding only `obsidian-versions.json` plus some of the assets, is tarred and saved under `dse-e2e-obsidian-Linux-X64-1.14.4`.
- Effect: every later run gets an exact hit (`cache-hit == 'true'`), so the save step is skipped forever. The launcher fills in the missing pieces each run. My probe showed this works: a restored cache missing `obsidian-app/` re-downloaded the asar and passed, `rc=0`. But the healed copy is never saved. Every run then pays the cold download (about 75 s) and the `raw.githubusercontent.com` / release-asset network exposure. With no retries, a network blip on that path turns the job red. A cache that is in use is never evicted, so this lasts until the pin changes. Develop's cache is the fallback for every PR, so a poisoned develop entry slows every PR.
- `atomicCreate` (obsidian-launcher `chunk-S3PDIAWB.js:17`) prevents a *corrupt* asset dir, but not a *missing* one. So "partial" is the realistic case, not "corrupt".
- Fix: add a completeness check and gate the save on it. For example, insert before the save step:
  ```yaml
      - name: Check the Obsidian download is complete
        id: obsidian-complete
        if: ${{ !cancelled() && steps.obsidian-cache.outputs.cache-hit != 'true' }}
        run: |
          v='${{ steps.pin.outputs.version }}'
          c="$OBSIDIAN_CACHE"
          if [ -x "$c/obsidian-installer/linux-x64/Obsidian-$v/obsidian" ] \
             && [ -f "$c/obsidian-app/obsidian-$v.asar" ] \
             && compgen -G "$c/electron-chromedriver/linux-x64/*/chromedriver" > /dev/null; then
            echo "complete=true" >> "$GITHUB_OUTPUT"
          else
            echo "::warning::Obsidian cache incomplete; not saving it"
          fi
  ```
  Then set the save `if: ${{ !cancelled() && steps.obsidian-complete.outputs.complete == 'true' }}`. The layout above matches the local cache: `obsidian-installer/linux-x64/Obsidian-1.14.4/obsidian`, `obsidian-app/obsidian-1.14.4.asar`, `electron-chromedriver/linux-x64/43.7.7/chromedriver`. If the check uses `x64`, add a comment that it must change if the job ever moves to arm.

### MEDIUM-2: a job-level timeout skips the failure upload, which loses the bundle in the hang case

- Where: `.github/workflows/plugin-ci.yml:110` (`timeout-minutes: 30`, job level only) and `:185` (`if: ${{ failure() }}`).
- Scenario: the suite stalls long enough to hit the 30-minute job timeout (a wdio or chromedriver session wedged in onPrepare or session creation, which mocha's 45 s per-test timeout does not bound, or a runner slow enough to stretch a full run). GitHub's docs: job `timeout-minutes` is "the maximum number of minutes to let a job run before GitHub automatically cancels it". Under a cancellation, `failure()` is false, so "Upload failure bundles" never runs. The bundles of tests that had already failed, plus `results/*.jsonl`, are lost. Those are exactly the evidence needed to diagnose the stall. The save step is skipped too (`!cancelled()`), which is the correct outcome there.
- Fix: put a step timeout on the e2e step, for example `timeout-minutes: 25` on "End-to-end tests (real Obsidian)" (`:170-172`), and keep the job's 30 as the backstop for setup and upload. A step timeout "kills the process" and marks the step failed, so `failure()` fires and the upload runs. Optionally also make the upload `if: ${{ failure() || cancelled() }}`. I could not confirm on a real runner whether `failure()` stays false after a job timeout. The docs call it a cancellation, and the step-level timeout is right whichever way that goes.

### LOW-1: no `permissions:` block

- Where: the `e2e:` job (`:105`). The workflow has none either.
- Facts: `gh api repos/SteelCompendium/draw-steel-elements/actions/permissions/workflow` returns `"default_workflow_permissions":"read"`, so the token is read-only today. The job runs PR-controlled code (`npm ci` lifecycle scripts, the specs) and needs no token scope. The upstream sample workflow sets `permissions: {}`. If someone changes that repo setting, this job silently gets a write token.
- Fix: add `permissions: { contents: read }` on the e2e job (or the workflow; the `test` job needs no more than that).

### LOW-2: the PINNED extractor is strict, but fails loudly

- Where: `:132`. Probed against variants of the pin line: `const PINNED = '1.15.0';` gives `1.15.0` (the key busts correctly). Double quotes, `export const`, a trailing `// note`, no spaces around `=`, and `'1.15.0-beta.1'` each give an empty result, which hits the `::error` and `exit 1`. This is the right failure mode: it cannot quietly run under a wrong or empty key. A formatter pass or a beta pin would turn CI red until someone edits the sed.
- Fix (optional): `sed -n "s/^\(export \)\{0,1\}const PINNED *= *['\"]\([^'\"]*\)['\"].*/\2/p"`, keeping the empty-check.

### LOW-3: the cache key ignores the obsidian-launcher version

- Where: `:150`, `:179`. The key is os, arch and pin only. obsidian-launcher / wdio-obsidian-service are 3.3.0. A launcher upgrade that changes the cache layout (for example new dir names) would restore an obsolete tree on an exact hit. The new launcher would download every run, and nothing would ever re-save (the same freeze as MEDIUM-1).
- Fix: in the pin step, also `echo "launcher=$(node -p "require('./node_modules/obsidian-launcher/package.json').version")" >> "$GITHUB_OUTPUT"` (`npm ci` has already run), and add `-${{ steps.pin.outputs.launcher }}` to both keys. This busts only on a launcher bump, not on every lockfile change, so the implementer's reason for leaving the lockfile out still holds.

### LOW-4: no concurrency group

- Where: the e2e job. Rapid pushes to one PR each start a full 7-12 minute real-Obsidian run. It costs nothing on a public repo, but the results arrive late and out of date.
- Fix: job-level `concurrency: { group: e2e-${{ github.ref }}, cancel-in-progress: ${{ github.event_name == 'pull_request' }} }`. Do not cancel on develop or main pushes. A cancelled run skips the upload and save steps, which is correct.

### INFO

1. **`ubuntu-24.04` pin.** I agree with it on the merits. The no-apt analysis and the Xvfb-on-the-image claim are about the 24.04 image (`toolset-2404.json` `apt.common_packages` contains `xvfb`). A floating label would change the library set under the job during the 26.04 migration. Follow-up: bump it deliberately after a trial run on `ubuntu-26.04`.
2. **Sandbox.** `--no-sandbox` is pushed on Linux at `node_modules/wdio-obsidian-service/dist/index.js:2923` (the chromedriver session) and `node_modules/obsidian-launcher/dist/chunk-S3PDIAWB.js:1939` (the launcher's own spawns). With it, Chromium never attempts the userns or SUID sandbox, so 24.04's `apparmor_restrict_unprivileged_userns` and the non-SUID extracted `chrome-sandbox` do not matter. This is the least invasive option: no `sysctl`, no change to the job or the code, and it does not leak into local runs. Chromedriver is pinned explicitly (`wdio:chromedriverOptions.binary`, `index.js:2944`), so the image's own `chromedriver` on PATH cannot be picked up.
3. **apt list.** `readelf -d` on the cached `obsidian` lists 31 NEEDED libraries: `libffmpeg` (bundled), glib/gobject/gio, nspr, nss/nssutil/smime, atk, atk-bridge, cups, dbus, cairo, gtk-3, pango, X11, Xcomposite, Xdamage, Xext, Xfixes, Xrandr, gbm, expat, xcb, xkbcommon, udev, asound, atspi, plus libc/libm/libgcc. Each one maps 1:1 to a direct `Depends` of `google-chrome-stable` 157.0.8103.78, which the image ships (`libgtk-3-0` is the first alternative, ahead of `libgtk-4-1`). EGL, GLES and Vulkan are bundled in the installer dir. Corroboration: both upstream wdio-obsidian-service workflows run Obsidian on `ubuntu-latest` (24.04 until this month) using the image's `Xvfb`, with no library install, only a window manager. Electron 43.7.7 / Chrome 150. Only a real runner can fully prove this (the host is 22.04).
4. **Failure artifact.** Every non-zero exit fails the step, so `failure()` fires on a test failure (exit 1), a coverage-gate failure (exit 1, `run.mjs:603`) and an environment error (exit 2, `:604-612`, `:631`). The path `e2e/.out/` with `include-hidden-files: true` contains `<run>/<test-id>/screenshot.png`; r1's broken run left 2.4 MB, and a green run leaves 8.6 MB, both measured. With `if-no-files-found: warn` and 14-day retention this is fine. Unverified hedge: a manual "Re-run failed jobs" may collide on the artifact name `e2e-out` under upload-artifact v4; `overwrite: true` is a cheap guard.
5. **Green while proving nothing: not possible.** Zero tests gives exit 2 (`:608-611`). An empty spec tree is a UsageError (`:152`). `.skip`/`.only`/`xit` is refused (`:166-170`). An expected id with no result counts as a failure (`:574-580`). The coverage gate is skipped only with `--only`/`--element` (`:582`), and the job passes neither; no environment variable can make a run partial (`DSE_E2E_GREP` comes from args only). A missing `main.js` is an EnvError (`:484`). A stale build is impossible: the checkout is fresh, `main.js` is gitignored, and `build-no-check` runs every time (`:479`). Caveat (not CI-specific): CI does not assert N/M, so a deleted spec whose pairs are still covered by other tests would pass. Same as locally.
6. **No retries.** None in the diff, `wdio.conf.mts:44` `specFileRetries: 0`, no mocha `retries`. wdio's `connectionRetryCount` is an HTTP request retry, not a test retry.
7. **Fork PRs.** `pull_request` (not `_target`), no secrets used, a read-only token, cache restored from the base branch and saved to the PR's own scope. First-time contributors need approval before it runs.
8. **Sim fidelity gap.** The sim runs under `devbox run`, with nix Xvfb, devbox node 24.12 and host libs. The runner uses apt Xvfb 21.1.12 at `/usr/bin/Xvfb` (`run.mjs:339` finds it via `which`) and setup-node 24.x. The host has no system Xvfb, so the apt path could not be exercised locally. The sim also points `OBSIDIAN_CACHE` at the prepared copy, so the `$GITHUB_ENV` value (`/home/runner/.cache/dse-e2e-obsidian`) is only checked by reading the code: `run.mjs:464` honours `OBSIDIAN_CACHE` first, and `${{ env.X }}` sees variables set through `GITHUB_ENV` in earlier steps.
9. **Shards=4 on 4 vCPU** maximises exposure to the load-sensitive flakes (SC-654, SC-657). Neither r1's five runs nor mine (peak host load about 24) hit them. Accept, and watch the first develop runs.
10. **Docs nit.** `e2e/README.md:72-74` carries dated sim timings that will go stale. This is acceptable in a README; it could point to the r1 report instead.
11. **Branch protection.** The check name will be `e2e` under `Plugin CI` (no `name:`). Making it required is a repo setting, a follow-up.

## Re-run of the local CI simulation

| Run | sha | Cores | Shards | Cache | e2e step | Total | Host load (start / peak / end) | Summary | Failures |
|---|---|---|---|---|---|---|---|---|---|
| rv-s4 | 029d012a | 0-3 | 4 (YAML) | warm copy | 440.3 s | 450.2 s | 2.6 / ~24.7 / 8.8 | 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs | none |

`npm ci` took 9.9 s. The pin step gave `version=1.14.4` and `OBSIDIAN_CACHE=/home/scott/.cache/dse-e2e-obsidian` (as `$HOME` expands here). The pointer was parked. 47 `WARN webdriver: stale element` lines, the same count as r1's r3 log, so this is benign and pre-existing.

Partial-cache probe (`--only=NEGO-C01`, cache missing `obsidian-app/`): the asar was re-downloaded and the test passed, `rc=0`, in 12 s. A partial restore does not break the run; it only fails to heal the saved cache (MEDIUM-1).

## Probes run

- `actionlint` v1.7.7 (built with `go install` into scratch) on the reviewed file and on the base file: 0 errors each. The shellcheck and pyflakes rules were disabled because those tools are absent.
- The PINNED sed against 7 line variants (LOW-2).
- `gh api` (read-only): the repo is public; the default workflow permissions are `read`; the existing caches are the develop playwright cache (274 MB) and the npm cache (82 MB); the latest develop Plugin CI run at `fcc7278e` succeeded.
- `@actions/cache` source (`cache.ts`, `cacheUtils.ts` `resolvePaths`): an existing empty directory passes path validation (MEDIUM-1).

Working tree: `git status --porcelain` before and after is identical (empty), and HEAD is still `029d012a`. The superproject's ` M draw-steel-elements` was already there before this review. Nothing was committed or pushed, and nothing was deleted.

## Artifacts

- Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r2-rv/`
  - sim log: `.../sc434-r2-rv/runs/rv-s4/sim.log` (the clone and `e2e/.out` are under `.../sc434-r2-rv/runs/rv-s4/clone/`)
  - sim driver: `.../sc434-r2-rv/run-sim.sh` (uses r1's `evidence/sim.mjs` unchanged)
  - partial-cache probe: `.../sc434-r2-rv/probe-partial.sh`, `.../sc434-r2-rv/probe-partial.log`
  - actionlint binary and install log: `.../sc434-r2-rv/bin/actionlint`, `.../sc434-r2-rv/actionlint-install.log`
  - git status snapshots: `.../sc434-r2-rv/status-before.txt`, `.../sc434-r2-rv/status-after.txt`

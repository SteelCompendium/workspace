# SC-434 r1 report: e2e job for draw-steel-elements GitHub CI

## Executive summary

- Verdict: DONE_WITH_CONCERNS. Nothing pushed; nothing outside `.github/workflows/plugin-ci.yml` and `e2e/README.md` changed.
- Branch `sc434-ci-e2e` in `draw-steel-elements`, base `fcc7278e` (origin/develop confirmed unchanged after fetch). Commits: `4e7a0506` (job), `e907ecae` (README CI section, timeout 30, pin note), `029d012a` (comment-only fix; parsed YAML identical to `e907ecae`).
- New job `e2e`, parallel to `test`: full `npm run e2e -- --shards=4`, no `--only`, coverage gate on, no retries, cache, artifact upload on failure, `timeout-minutes: 30`.
- Local CI simulation (4 pinned cores, fresh clone, `CI=true`, no `DISPLAY`): 5 full runs, every one `OBSIDIAN-E2E done: 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, no flakes seen. e2e step wall: 4 shards 342 s / 368 s (final sha) / 533 s (cold cache) / 677 s (host load 16-25); 2 shards 623 s.
- Broken-test proof: exit 1, `e2e/.out/<run>/NEGO-C01/screenshot.png` (60 080 B PNG) present.
- Gates (worktree, `e907ecae`; `029d012a` differs by one comment): tsc clean, lint clean, jest 13406 passed / 2 skipped. Lifecycle not run (nothing outside `.github/` and `e2e/README.md` changed).
- Two deviations from the brief to rule on: `runs-on: ubuntu-24.04` instead of `ubuntu-latest` (GitHub is migrating `ubuntu-latest` to 26.04 this month); no apt step and no sandbox workaround (evidence below).
- Only verifiable on GitHub: AppArmor/sandbox behaviour, apt-free runtime libs, cache restore/save, artifact upload of a dot-dir, runner speed, branch-protection check name.

## Final shas

`/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements`, branch `sc434-ci-e2e`:
`4e7a0506`, `e907ecae28cc4f0ea0cd49cf9e8d87c0bb647854`, `029d012aeb94c8b345502a544c59720b601f016b` (HEAD).
No commit attribution trailers (Scott's global rule overrides the harness reminder).
Superproject untouched (no pointer bump made).

## The job (full text, as committed at HEAD)

See `/home/scott/code/steelCompendium/worktrees/sc434-ci-e2e/draw-steel-elements/.github/workflows/plugin-ci.yml`, the `e2e:` job (lines after the existing `test` job). Steps, in order:
checkout@v4; setup-node@v4 (24, cache npm); `npm ci`; "Resolve pinned Obsidian version and cache dir" (id `pin`); `actions/cache/restore@v4` (id `obsidian-cache`); "End-to-end tests (real Obsidian)" (id `e2e`, `npm run e2e -- --shards=4`); `actions/cache/save@v4` (`if: !cancelled() && cache-hit != 'true'`); `actions/upload-artifact@v4` (`if: failure()`, name `e2e-out`, path `e2e/.out/`, `include-hidden-files: true`, `if-no-files-found: warn`, `retention-days: 14`).

```yaml
  e2e:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Resolve pinned Obsidian version and cache dir
        id: pin
        run: |
          pin="$(sed -n "s/^const PINNED = '\([0-9][0-9.]*\)';.*/\1/p" e2e/run.mjs)"
          if [ -z "$pin" ]; then
            echo "::error file=e2e/run.mjs::could not read the PINNED Obsidian version"
            exit 1
          fi
          echo "version=$pin" >> "$GITHUB_OUTPUT"
          echo "OBSIDIAN_CACHE=$HOME/.cache/dse-e2e-obsidian" >> "$GITHUB_ENV"
      - name: Restore Obsidian download cache
        id: obsidian-cache
        uses: actions/cache/restore@v4
        with:
          path: ${{ env.OBSIDIAN_CACHE }}
          key: dse-e2e-obsidian-${{ runner.os }}-${{ runner.arch }}-${{ steps.pin.outputs.version }}
      - name: End-to-end tests (real Obsidian)
        id: e2e
        run: npm run e2e -- --shards=4
      - name: Save Obsidian download cache
        if: ${{ !cancelled() && steps.obsidian-cache.outputs.cache-hit != 'true' }}
        uses: actions/cache/save@v4
        with:
          path: ${{ env.OBSIDIAN_CACHE }}
          key: dse-e2e-obsidian-${{ runner.os }}-${{ runner.arch }}-${{ steps.pin.outputs.version }}
      - name: Upload failure bundles
        if: ${{ failure() }}
        uses: actions/upload-artifact@v4
        with:
          name: e2e-out
          path: e2e/.out/
          include-hidden-files: true
          if-no-files-found: warn
          retention-days: 14
```

(The committed file carries the why-comments on every step, in the style of the existing file; they are omitted here only for length.)

## Decisions and evidence

**Reference workflow.** `wdio-obsidian-service`'s own `.github/workflows/test.yaml` and its sample plugin's `test.yaml` (fetched from GitHub, copies in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-impl/wdos-test.yaml` and `sample-test.yaml`). On Linux they install only a window manager (`herbstluftwm dzen2 x11-xserver-utils`), start `Xvfb` by hand, set no sandbox workaround, and install no Electron libraries. They use `actions/cache` on `.obsidian-cache` keyed on a hash of a generated versions file.

**Sandbox / AppArmor: no fix needed.** `node_modules/wdio-obsidian-service/dist/index.js:2923` pushes `--no-sandbox` into `goog:chromeOptions.args` on every Linux session; `obsidian-launcher` (`dist/chunk-S3PDIAWB.js:1938`) does the same for its own spawns, with the comment "Workaround for SUID issue on linux". With `--no-sandbox` Chromium never tries the user-namespace or SUID sandbox, so `kernel.apparmor_restrict_unprivileged_userns=1` on 24.04 is irrelevant. The upstream sample workflow does nothing about it either. I did NOT add a `sysctl` step (invasive, unneeded). If the first GitHub run dies with a sandbox error, the fallback is one `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` step. I could not test AppArmor locally (host is Ubuntu 22.04, no such sysctl).

**apt list: none.** (a) `xvfb` (2:21.1.12) is in the ubuntu-24.04 image's toolset (`actions/runner-images` `toolset-2404.json` `apt.common_packages`; Ubuntu2404-Readme lists it), and `run.mjs` finds `Xvfb` via `which`. (b) Libraries: `readelf -d` on the pinned Obsidian binary lists 31 NEEDED sonames (gtk3, nss/nspr, atk, atk-bridge, cups, dbus, cairo, pango, X11/Xcomposite/Xdamage/Xext/Xfixes/Xrandr, gbm, expat, xcb, xkbcommon, udev, asound, atspi plus glibc). I mapped all 76 distro packages `ldd` resolves for `obsidian` and `chrome_crashpad_handler` to Ubuntu noble names (t64 renames included) and computed the dependency closure of `google-chrome-stable` from Google's apt index plus noble's Packages: 74 of 76 are in it; the two exceptions are `libunistring2` (no noble package of that name: renamed `libunistring5`, a base-system lib) and `libwayland-server0` (a direct dependency of noble's `libgbm1` 24.0.5, which is in the closure; the newer `libgbm1` in noble-updates replaced the entry in my merged index, so the link was lost in my script, not in the distro). The 24.04 image ships Google Chrome 157 (Ubuntu2404-Readme), so every runtime library is present. Scripts and lists: `.../scratchpad/sc434-r1-impl/noble/closure.py`, `host-pkgs.txt`. This is inference, not a run on a 24.04 image: see "only on GitHub". Fallback if wrong: `sudo apt-get install -y libgtk-3-0t64 libnss3 libasound2t64 libgbm1 libxss1 libxtst6`.

**Runner image pin.** `actions/runner-images` README announcement: "`ubuntu-latest` label will use Ubuntu 26.04 in November 2026", migration "gradual ... 1-2 months". Today is 2026-11-15, so a floating label can change under a real-Electron suite. The job is pinned to `ubuntu-24.04`; the existing `test` job is untouched. Flip to `ubuntu-latest` if you prefer; one line.

**Node.** `devbox.json` pins `nodejs@24`; existing job uses `node-version: 24`; `engines` is `>=22.15`. New job uses 24.

**Build step.** None: `e2e/run.mjs` lines 478-480 run `npm run --silent build-no-check` itself before copying `main.js`/`styles.css`/`manifest.json`.

**Cache.** Dir `${XDG_CACHE_HOME:-~/.cache}/dse-e2e-obsidian`; the job sets `OBSIDIAN_CACHE=$HOME/.cache/dse-e2e-obsidian` explicitly via `$GITHUB_ENV` so cache path and runner agree. Key `dse-e2e-obsidian-<runner.os>-<runner.arch>-<PINNED>` where `PINNED` is sed-extracted from `const PINNED = '1.14.4'` in `e2e/run.mjs` (the single place the pin lives), so a bump busts the key and nothing else needs editing. A cold cache measured 531 MB on disk, 185 MB `tar -czf` (the shared local cache is 998 MB only because it also holds an old chromedriver 21.4.1). Restore and save are split so the cache is saved when the e2e step fails (default post-job save skips on failure); an interrupted download cannot poison it, because `obsidian-launcher` downloads into a `.tmp` scratch dir and renames (`atomicCreate`). The key does not include the lockfile on purpose (a dependency bump would otherwise re-download ~530 MB).

**GITHUB_TOKEN: no.** The GitHub API (`fetchGitHubAPI`, `obsidian-launcher/dist/chunk-S3PDIAWB.js:260`) is called only from `updateVersions` (lines 683, 701: collecting version metadata). The e2e path fetches `obsidian-versions.json` from `raw.githubusercontent.com` (30-minute cache, falls back to the cached copy on a network error) and the app / installer from `github.com` release assets. Proof: the cold-cache simulation ran with `GITHUB_TOKEN=invalid-token-proof` in the environment (the launcher would send it as a Bearer header and fail with "GitHub API error") and passed (`runs/r1-miss-s4`). Residual risk: an unauthenticated `raw.githubusercontent.com` throttle on a cold-cache run; a warm cache falls back to its stored versions file.

**Shards: 4.** GitHub docs ("GitHub-hosted runners reference", fetched 2026-11-15): standard runners for public repositories: Linux x64, 4 vCPU, 16 GB RAM, 14 GB SSD, labels `ubuntu-latest`/`ubuntu-24.04`/`ubuntu-22.04`/`ubuntu-26.04`; free and unlimited for public repos (the ticket's "2 cores" is outdated, as the sample plugin comment is). `run.mjs` would pick `min(4, floor(4/3))` = 1 on that runner. Measured on 4 pinned cores (table below): 4 shards 342-677 s, 2 shards 623 s. The ranges overlap because the host was shared and loaded (load average 3 to 25 on 12 cores, other agents' e2e/jest runs), so the evidence for 4 over 2 is suggestive, not clean: the quietest 4-shard runs (342 s, 368 s) are about 40% faster than the 2-shard run, which ran at similar load (load 3-10). No memory measurement was taken (16 GB; each Obsidian renderer is about 300 MB RSS).

**Timeout: 30 min.** Whole-job sim wall times were 351-703 s (6-12 min); 30 min is about 2.5x the worst measured and still bounds a hung Obsidian.

**Failure artifact.** Path `e2e/.out/` with `include-hidden-files: true` (`.out` is a dot-directory; upload-artifact v4.4+ skips hidden files by default). Verified locally that the screenshot is inside it (broken-test proof). A full green run leaves about 8.6 MB in `e2e/.out/` (per-run `plugin/` copy, results, coverage); a failing test adds its bundle (~2.4 MB total for the 1-test broken run).

**No retries.** No `continue-on-error`, no retry wrapper, `specFileRetries: 0` untouched.

**No `run.mjs` / driver change was needed.**

## Simulation

Method: `sim.mjs` parses the committed `plugin-ci.yml` from the fresh clone and executes the `run:` steps of job `e2e` in order (`bash -e`, `GITHUB_ENV`/`GITHUB_OUTPUT` files emulated, `CI=true`, `GITHUB_ACTIONS=true`, `DISPLAY` unset, `taskset -c 0-3`); `uses:` steps are replaced by hand (checkout = `git clone` of the branch sha; cache = `OBSIDIAN_CACHE` pointed at a prepared dir). `--shards` is overridden per run only where noted. Host: 12 cores, Ubuntu 22.04, shared with other agents (load average noted). Sim ran through `devbox run` (Node 24.12, devbox Xvfb), not a 24.04 image. Scripts: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/evidence/sim.mjs`, `run-sim.sh`.

| Run | sha | Cores | Shards | Cache | e2e step wall (total sim) | Host load avg (1 min) | Summary | Failure ids |
|---|---|---|---|---|---|---|---|---|
| r1-miss-s4 | 4e7a0506 | 0-3 | 4 | empty (cold; `GITHUB_TOKEN=invalid-token-proof`); download+extract 73 s (03:15:52 to 03:17:05) | 533 s (549 s) | 8-14 | 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs | none |
| r2-s4a | 4e7a0506 | 0-3 | 4 | warm copy | 677 s (703 s) | 16-25 | same | none |
| r3-s4b | 4e7a0506 | 0-3 | 4 | warm copy | 342 s (352 s) | 6-8 | same | none |
| r4-s2 | 4e7a0506 | 0-3 | 2 | warm copy | 623 s (632 s) | 3-10 | same | none |
| r6-final | e907ecae | 0-3 | 4 (as in YAML) | warm copy | 368 s (378 s) | 9-10 | same | none |

`npm ci` in a fresh clone: 16.2 s (npm cache warm). No INIT-W10 / SET-X03 / SET-X04 flake appeared in any of the five full runs, including r2 under load 16-25. `OBSIDIAN-E2E WARN pointer NOT parked` never appeared. `029d012a` differs from `e907ecae` by comment text only (YAML parsed JSON identical), so r6-final counts as the e2e gate run for the final workflow.

Logs: `.../evidence/sc434-sim-r1-miss-s4.log`, `-r2-s4a.log`, `-r3-s4b.log`, `-r4-s2.log`, `-r5-broken.log`, `sc434-sim-seq.log`; r6-final log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-impl/runs/r6-final/sim.log`.

## Broken-test proof

In the scratch clone only (never committed): `sed -i "s/'Interest 3 · Patience 3')/'Interest 9 · Patience 9')/" e2e/specs/negotiation/chrome.e2e.ts` (NEGO-C01, an `expect(...).toHaveText(stringContaining(...))`), run through the same script with `--only=NEGO-C01` (`runs/r5-broken`, sha `4e7a0506` + patch). Result: `OBSIDIAN-E2E NEGO-C01 FAIL: ... Expected: StringContaining "Interest 9 · Patience 9" | Received: "NEGOTIATION: Convincing Frodo ... (Interest 3 · Patience 3)"`, `done: 0/1 ok, 1 failed`, step exit code **1** (sim exit 1; a runner would stop and run the `failure()` upload step).

Files under `e2e/.out/` (what the upload step takes), `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-impl/runs/r5-broken/clone/e2e/.out/`:
```
20261115-085534-6199/NEGO-C01/screenshot.png        60080 B  (full Obsidian window, shows the collapsed card)
20261115-085534-6199/NEGO-C01/dse-root.png          18918 B
20261115-085534-6199/NEGO-C01/dse-root.html, modals.html, events.json, versions.json, vault-path.txt
20261115-085534-6199/NEGO-C01/error.txt
20261115-085534-6199/NEGO-C01/note-before.Negotiation_basic.md, note-after.Negotiation_basic.md, note.Negotiation_basic.md.diff
20261115-085534-6199/NEGO-C01/vault-copy/
20261115-085534-6199/plugin/{data.json,main.js,manifest.json,styles.css}
20261115-085534-6199/results/491555.jsonl, coverage/491555.jsonl, coverage.json
coverage.json
```
Copies kept outside the clone: `.../evidence/sc434-broken-test-NEGO-C01-screenshot.png`, `.../evidence/sc434-broken-test-NEGO-C01-error.txt`.

## Gate numbers (worktree `.../worktrees/sc434-ci-e2e/draw-steel-elements`, at `e907ecae`; `029d012a` = comment-only on top)

- `npm run tsc` (incl. `tsc -p e2e`): clean, exit 0 (`scratchpad/sc434-r1-impl/gate-tsc.log`).
- `npm run lint`: exit 0; only the pre-existing `.eslintignore` deprecation warning (`gate-lint.log`).
- `npm test` (jest, fresh worktree, no shots cache): `Tests: 2 skipped, 13406 passed, 13408 total`; `Test Suites: 1 skipped, 293 passed, 293 of 294`; 108 s (`gate-jest.log`). The `findDriftedTokens` TypeError traces in that log are stderr from tests that assert on child-process errors; they are not failures.
- Full e2e: `OBSIDIAN-E2E done: 613/622 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (r6-final, 4 cores, 4 shards, final workflow).
- Lifecycle: not run (brief: required only if something outside `.github/` and `e2e/README.md` changed; nothing did). Shots/freeze/parity: not needed.

All logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc434-r1-impl/`.

## Drive-by fixes

None.

## Follow-ups

1. Branch protection / required status: the check name will be `e2e` (job id; no `name:`) under workflow `Plugin CI`. Scott's SC-408 ruling ("make it required to land") implies adding it to the required checks once it is green on develop. That is a repo setting, not a file.
2. The existing `test` job (and `ci.yml`) still use `ubuntu-latest`; the 26.04 migration can change them. Only relevant if they start failing.
3. The workflow uses `actions/*@v4` for consistency with the file; the upstream sample uses newer majors (checkout/upload-artifact v7, cache v6). Node-20-runtime deprecation warnings may appear. Not changed.
4. Cache scoping: caches created by a PR are only visible to that PR and its descendants; a cache created on `develop`/`main` is visible to PRs. Expect each new PR to be cold until a develop push has seeded the cache.
5. Documentation outside my scope: a proposed dse-verify SKILL.md note is in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc434-ci-e2e/sc434-r1-skill-proposal.md` (not applied). The workspace `AGENTS.md`/`CHANGELOG.md` were not touched (CI is not user-facing).
6. Flake exposure: INIT-W10 (SC-654) and SET-X03/X04 (SC-657) were not seen in 5 loaded runs, but with no retries they will turn the job red when they occur; slower real runners may raise the odds.

## What can only be verified on GitHub

- That the sandbox claim holds on a real 24.04 AppArmor runner (Obsidian starts, session opens).
- That no apt step is needed (libraries inferred from the Chrome dependency closure, not run on the image).
- `actions/cache/restore` + `save` behaviour: key resolution from the sed output, `${{ env.OBSIDIAN_CACHE }}` taking the `$GITHUB_ENV` value, hit on the second run (`cache-hit` output), `~/` vs `$HOME` expansion.
- `upload-artifact` with `path: e2e/.out/` and `include-hidden-files: true` producing an artifact whose root holds `<run>/<test-id>/screenshot.png` (needs a deliberately failing run; a PR with a broken test is the way, since a feature-branch push alone does not trigger the workflow).
- Real runner timing (CPU speed and shard behaviour on a 4 vCPU Azure VM) and therefore whether `timeout-minutes: 30` and `--shards=4` are right.
- Raw download of `obsidian-versions.json` and the release assets from a runner IP on a cold cache.
- The `ubuntu-24.04` label and the Ubuntu 26.04 migration timing.

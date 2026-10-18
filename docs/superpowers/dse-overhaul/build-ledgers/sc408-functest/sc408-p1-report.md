# SC-408 pilot round P1: report

**Executive summary**
1. Verdict DONE. DSE branch `sc408-functest`, head `4464180` (5 commits on `be4f002`; `origin/develop` still `be4f002`, no rebase). Nothing pushed.
2. `npm run e2e` works end to end: build, private Xvfb `:200`, pinned Obsidian 1.14.4 (app + installer, Chrome 150), 4 scenarios. Full run **11.4 s wall**, `OBSIDIAN-E2E done: 3/4 ok, 0 failed, 1 known-bug`, exit 0. Repeatability: **5/5 identical runs** (11.7-12.0 s), flake 0.
3. 4-shard focus proof: 4 duplicate blur-commit specs on one Xvfb, **4/4 ok** (9.96 s). Same 4/4 with focus emulation off (3/3 runs), because a bare Xvfb has no window manager; `document.hasFocus()` is true with emulation and false without. Emulation stays on as insurance.
4. **B7 verdict: reproduces in real Obsidian, narrower than S1 said.** A click on Apply's own padding (target = the disabled button) is swallowed (modal stays open, Apply enabled afterwards); a click on its label text works. Same on Chrome 150 and Chrome 106. STAM-S13 (edge click) is wrapped in `knownBug('B7-pending-ticket', ...)`; STAM-S13b (label click) is a normal passing scenario. Owner: file the ticket, P2 swaps the key.
5. Gates: tsc clean (now includes `e2e/`), lint clean, jest **220 of 221 suites / 4451 passed / 2 skipped** vs baseline at `be4f002` **220 of 221 / 4448 / 2** (+3 = the pendingWrites tests), lifecycle **25/25 ok** (254.9 s, port 9308), e2e as above.
6. Also proved: headed against my own private Xvfb `:245` (never `:1`), `--obsidian=installed` (installer 1.1.16, Chrome 106), deliberate failure (exit 1 + 12-entry bundle), knownBug fixed/failed-differently paths, invariants catching page error / orphan modal / outside-block edit, SIGTERM/SIGINT/SIGKILL-of-Obsidian reaping (0 leftovers). End state: no process of mine alive.
7. Deviations are small (see below): no junit reporter, own fixture reset instead of the service's `resetVault`, plugin `data.json` kept as `e2e/vaults/plugin-data.shipped.json`, `.ts` driver with an `.mts` config.

## Commits (draw-steel-elements, branch sc408-functest)
- `8c4b37c` deps: exact-pinned devDependencies; `package-lock.json` (versions of all 761 existing packages unchanged; the diff is mostly reformatting + 385 new packages)
- `3d8b848` seam: `ElementView.hasPendingWrite()` + `ViewRegistry.pendingWrites()` + 3 jest tests
- `1421c5f` e2e layer: run.mjs, wdio.conf.mts, driver, vault, 3 proof scenarios, tsconfig/`npm run tsc`/gitignore
- `4c799db` README, focus banner, interrupted-run handling, readable failure summary
- `4464180` tsc fix in my own registry test (root tsc covers `test/`)

## Files added / changed
Added (all under `draw-steel-elements/`):
- `e2e/run.mjs` (entry point), `e2e/wdio.conf.mts`, `e2e/tsconfig.json`, `e2e/README.md`
- `e2e/driver/{dse,recorders,invariants,artifacts,knownBug}.ts` plus helpers `env.ts`, `page.ts` (CDP eval), `state.ts`, `session.ts` (root mocha hooks), `cleanup.ts`
- `e2e/vaults/shipped/Stamina/basic.md`, `e2e/vaults/shipped/.obsidian/{app,appearance}.json`, `e2e/vaults/plugin-data.shipped.json` (`{}`: no `"experimental": true`)
- `e2e/specs/stamina-bar/stamina-modal.e2e.ts` (STAM-D01, STAM-K01, STAM-S13 known-bug, STAM-S13b)
Changed: `package.json` (devDeps, `e2e` script, `tsc` = `tsc --noEmit && tsc --noEmit -p e2e`), `package-lock.json`, `tsconfig.json` (exclude `e2e`, `node_modules`), `.gitignore` (`e2e/.out/`), `src/framework/view.ts` and `src/framework/host/viewRegistry.ts` (seam, no DOM change), `test/dom/framework/{element-view,view-registry}.test.ts` (+3 tests).
jest does not pick up `e2e/` (its `testMatch` is `test/unit|dom` only; specs are `*.e2e.ts`).

Pinned versions: webdriverio 9.32.0, @wdio/cli / local-runner / mocha-framework / spec-reporter 9.32.0, @wdio/globals 9.31.3, expect-webdriverio 6.1.0, wdio-obsidian-service 3.3.0, @types/mocha 10.0.10, tsx 4.23.15 (all from the S2 probe lock). `mocha` itself is bundled by @wdio/mocha-framework (10.8.2).

## Design deviations from S2 section 4
- **No junit reporter** (not in your dependency list; `@wdio/junit-reporter` is a one-line add for CI later). Spec reporter only; results also go to `e2e/.out/<run>/results/*.jsonl`.
- **Own fixture reset, not `obsidianPage.resetVault()`.** The service's `resetVault` uses `Dirent.parentPath` (Node >= 20.12); the DSE-dir devbox shape runs Node 20.11.1 and it threw. `driver/dse.ts resetFixtures()` rewrites changed notes / recreates missing / deletes strays through Obsidian's vault API instead (works on Node 20.11.1 and 24.4.1; both verified).
- **Window size via Electron remote** (`require('electron').remote.getCurrentWindow().setSize`), because chromedriver `window/rect` and CDP `Browser.getWindowForTarget` are unsupported by the Electron 43 driver (the service's default window is 1024x800, too small for the modals). Falls back to a CDP device-metrics override.
- **Invariants run inside the test**, not in an `afterEach` hook: a root `beforeEach` wraps `test.fn`, so a violation fails that test. A failing `afterEach` makes mocha skip the rest of the suite. Hook failures in a spec's own `beforeEach` still skip the suite; `run.mjs` therefore counts any pre-scanned id with no result line as `FAIL: did not run`.
- **Config is `.mts`, driver/specs are `.ts`** (CJS under tsx; no `"type":"module"` in the repo). Works as is. wdio loads TS through the tsx devDependency.
- **Plugin data** is `e2e/vaults/plugin-data.shipped.json`, staged as `data.json` into a per-run plugin dir (`data.json` is globally gitignored, so it cannot live at `vaults/shipped/.obsidian/plugins/.../data.json`). The driver asserts `settings.experimental !== true` at session start.
- `control()` signature: bare string = `data-dse-control` id (P2), `{css}` / `{name}` until then. Migration of a call site is mechanical.
- `knownBug(ticket, title, fn, { failsWith })`: optional `failsWith` regex pins what fails ("failed differently" otherwise). Title carries `[known bug <ticket>]`.
- Extras beyond the brief: `click(el, { inset })` (click the control's own edge, needed for B7), `dse.closeModals()`, duplicate-`[ID]` check (usage error), coverage kinds `click-disabled` and `press:<key>`.
- `run.mjs` tracks descendants by polling `/proc` plus a `DSE_E2E_RUN_ID` environment tag, then kills by PID only; Xvfb range `:200-:239`; keeps the 12 newest `e2e/.out` runs.

## Proofs (raw numbers)
Shape unless noted: `cd workspace && devbox run -- bash -c 'cd <dse> && npm run e2e ...'` (Node 24.4.1). Logs in `/tmp/claude-1000/sc408-p1/`.
- **Full headless**: 11.38 s wall, `done: 3/4 ok, 0 failed, 1 known-bug`, exit 0 (`gate-e2e-final.log`). Per test: D01 1028 ms, K01 425 ms, S13 (known-bug, 2.3 s because it waits 1.5 s to observe the swallowed click) 2269 ms, S13b 846 ms. First-ever run after cache seeding downloaded the Electron 43 chromedriver (~160 MB; cache now 998 MB).
- **`--only=STAM-K01`**: exit 0, 1/1, 7.5 s. **`--only=NOPE-1`**: exit 2, `usage: --only names unknown test id(s): NOPE-1 (known: ...)`, 1.3 s. Also exit 2: `--bogus`, `--obsidian=matrix` ("not implemented yet"), `--element=nope`, `--shards=0`.
- **Repeatability x5** (full e2e): all exit 0, `3/4 ok, 0 failed, 1 known-bug`; wall 11.78, 11.97, 11.79, 11.70, 11.77 s (`repeat-1..5.log`). Also green under the Node 20.11.1 shape (11.3 s, `node20.log`).
- **4-shard focus proof** (4 temp spec files, `[FOC-1..4]`, type `12` into Stamina then click the modal title; Apply label must read "Lose 3 Stamina"): 4/4 ok, 0 failed, 9.96 s, all four sessions `hasFocus true` (`focus-4shard.log`, `focus-4shard-b.log`). Control with `enableFocusEmulation()` commented out: 4/4 ok x3 (`focus-4shard-noemu-*.log`) with `hasFocus false` in all four sessions. So one Xvfb with 4 parallel Obsidians works; the fallback of one Xvfb per worker was not needed. Temp dir deleted, not committed. (The no-WM Xvfb tolerates a focus-less page; a real WM or a headed display is where emulation should matter, not proven here.)
- **`--headed`** against my own Xvfb `:245` (started by me by PID, killed after; `DSE_E2E_HEADED_DISPLAY=:245`, `--headed --slow=250 --only=STAM-D01`): exit 0, 1/1, 2156 ms test time (vs ~1030 ms headless: 4 actions x 250 ms of outline+hold). Banner printed "headed on display :245". I never ran `--headed` on `:1`.
- **`--obsidian=installed`**: `installed /usr/bin/obsidian (installer 1.1.16) + obsidian-1.14.4.asar`, Chrome 106.0.5249.199. STAM-D01 alone: exit 0, 7.9 s. Full suite: 4/4 plus the 4 focus specs then present, 7/8 ok, 1 known-bug, exit 0, 17.8 s (`installed-full.log`). Installer version is read from the binary's `resources/app.asar` package.json.
- **Deliberate failure** (STAM-D01 expecting `temp_stamina: 3`): exit 1, `done: 2/4 ok, 1 failed, 1 known-bug`, summary line `FAIL: expect(received).toMatchObject(expected) | ... [bundle ...]`. Bundle `e2e/.out/<run>/STAM-D01/` held 12 entries: `dse-root.html dse-root.png error.txt events.json modals.html note-after.Stamina_basic.md note-before.Stamina_basic.md note.Stamina_basic.md.diff screenshot.png vault-copy/ vault-path.txt versions.json` (`modal.png` appears when a modal is open). Assertion reverted. (That run dir was pruned later by the 12-run retention; the B7 bundle below is a kept copy of the same bundle shape.)
- **knownBug paths** (scratch, deleted): a passing marker fails with `known bug SC-999 appears fixed - remove the marker`; `failsWith` mismatch fails with `failed differently than pinned`; a pinned failure counts as known-bug.
- **Invariants** (scratch, deleted): a `console.error` in the page, an orphaned modal, and an edit outside the fence each fail their test with the invariant message; a clean control passes. The registry collisions/ambiguous check is ported but I did not provoke it.
- **Reaping**: SIGTERM at 7 s, SIGINT at 3 s and at 1.2 s: exit 2, "received SIGINT, cleaning up", 0 leftovers (9 children reaped in the 7 s case). SIGKILL of the Obsidian main process mid-test: wdio reports ECONNREFUSED, exit 1, 0 processes carrying the run id left, no chromedriver.
- **After everything**: `pgrep -af "worktrees/sc408-functest/"` and `pgrep -af chromedriver` print nothing (ignoring my own shell), `/tmp/.X11-unix` holds only `X1` (Scott's) and `X161` (not mine: another agent's lifecycle display; mine used `:160`, `:200`, `:245`, all gone).

## Gates (dse-verify order)
1. `npm run tsc`: clean, 10.5 s (`gate-tsc.log`).
2. `npm run lint`: clean, exit 0 (`gate-lint.log`; the `.eslintignore` warning is pre-existing).
3. `rm -f main.js styles.css && npx jest`: **baseline at `be4f002` (measured before my first commit): 220 passed / 1 skipped / 220 of 221 suites, 4448 passed, 2 skipped, 4450 total**; **after: 220 / 1 / 220 of 221, 4451 passed, 2 skipped, 4453 total**, 0 failures, no flake (`jest-baseline.log`, `jest-after.log`; both run with the DSE-dir devbox shape, Node 20.11.1; load average 2-3 at start). Note the brief's recorded figure (4367/216) was stale; SC-417 and later added suites.
4. `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle`: **25/25 ok, 0 failed**, exit 0, 4m15s (`gate-lifecycle.log`).
5. `npm run e2e`: per Proofs.
No rendered DOM or CSS changed (the seam adds a method and a counter only), so shots / freeze / parity were not run, per the brief.

## B7 evidence (for filing the ticket)
- Mechanism (DOM event traces, `scr-b7-*.log`): the Apply button is `disabled` until the Stamina input's blur commits the draft. Click on the label span (button centre): `pointerdown SPAN`, then `change`/`blur` on the input, `mouseup`, **`click` on the span**, the modal closes and writes (works on both Chromes). Click on the button's own padding (3 px in from its left edge, 135x24 button): `pointerdown BUTTON.dse-btn--accent [disabled]`, `change`, `blur` (the input commits, Apply enables), `pointerup`, and **no `click` reaches the button** (Chrome 150: the click lands on the footer div; Chrome 106: no click at all). Result: modal still open, Apply now enabled and labelled "Lose 3 Stamina", nothing written.
- So S1's "first Apply click swallowed" is real but only for presses outside the label text. Fix direction unchanged (S1): keep Apply enabled while a draft is dirty, or commit on `input`.
- Evidence: `/tmp/claude-1000/sc408-p1/evidence/b7-STAM-S13-bundle/` (`modal.png` shows Stamina 12, Apply = "Lose 3 Stamina" after the swallowed click; `screenshot.png`, `modals.html`, `error.txt`, `events.json`, note before/after). Event traces: `/tmp/claude-1000/sc408-p1/evidence/scr-b7-{pinned,installed}.log` (label click) and `scr-b7-edge-{pinned,installed}.log` (padding click). Ticket key placeholder `B7-pending-ticket` appears once in `e2e/specs/stamina-bar/stamina-modal.e2e.ts`.

## Evidence paths
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-p1-report.md`
- All logs: `/tmp/claude-1000/sc408-p1/` (`gate-*.log`, `repeat-1..5.log`, `focus-4shard*.log`, `headed.log`, `installed*.log`, `deliberate-fail.log`, `kb-scratch.log`, `inv-scratch.log`, `sigterm*.log`, `sigint-*.log`, `crash.log`, `node20.log`, `jest-baseline.log`, `jest-after.log`)
- Evidence copies: `/tmp/claude-1000/sc408-p1/evidence/` (`b7-STAM-S13-bundle/`, `coverage.json`, `scr-b7-*.log`)
- Latest run output: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/e2e/.out/` (gitignored; includes `coverage.json`)
- Obsidian cache: `/home/scott/.cache/dse-e2e-obsidian` (seeded by `cp -a` from the S2 probe cache: app 1.14.4, installer 1.14.4, chromedriver 21.4.1; the Electron 43 chromedriver for the pinned installer was downloaded on first run)

## Drive-by fixes:
None.

## Follow-ups:
- **File the B7 ticket** (owner): narrower than S1 (padding click only); evidence above.
- **Node version split**: `devbox run` from `workspace/` gives Node 24.4.1; from inside `draw-steel-elements/` it gives nvm Node 20.11.1 (the DSE `devbox.json` has no Node; `package.json` engines says >=22.15). The e2e works on both, but anything else relying on the engines floor may not.
- `wdio-obsidian-service` `resetVault` breaks on Node < 20.12 (`Dirent.parentPath`); the driver avoids it. Worth remembering if someone reintroduces the service helper.
- The e2e coverage keys are still CSS/name labels (`css:...`, `name:...`); P2's control ids replace them. `e2e/.out/coverage.json` is merged per run from per-worker jsonl.
- `run.mjs` retention keeps 12 runs; a heavy proof session prunes evidence quickly (copy bundles you want to keep).
- Registry collisions/ambiguous invariant is ported but only exercised on the all-zero path.
- A `beforeEach` that throws inside a spec (e.g. `openNote` failing) still makes mocha skip that suite's remaining tests; `run.mjs` reports them as `did not run` failures. Consider calling `openNote` inside a shared helper per test if that matters for P2's ~40 scenarios.
- CI job, `earliest`/`matrix` Obsidian modes, junit reporter, and the lifecycle port are rollout, untouched.

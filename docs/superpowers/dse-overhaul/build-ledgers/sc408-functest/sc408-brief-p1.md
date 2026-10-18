# SC-408 pilot round P1 — real-Obsidian e2e infrastructure + 3 proof scenarios

## 0. Context loading (do this first)

1. Read and obey `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-brief-common.md`.
2. Read the ledger `decisions.md` in the same dir — especially the 2026-10-17 "Architecture",
   "Pilot", and "Known-bug convention" entries. They are binding.
3. Read the design you are implementing: `sc408-s2-tooling.md` §4 (all of it) and §5. You
   implement THAT design. Where this brief is more specific, this brief wins.
4. Skim `sc408-s1-stamina-inventory.md` §2 rows A/S/T/F/K/W and §3 B7 (you write STAM-S13
   to confirm B7).
5. Reference implementation you are porting helpers FROM:
   `visual-harness/obsidian-lifecycle.mjs` (PAGE_HELPERS, AUTO_DISMISS_TRUST_DIALOG, vault
   `modify` recorder, integrity checks, Xvfb spawn, PID-tracked cleanup). And S2's working
   probe: `/tmp/claude-1000/sc408-wdio-probe/proj/` (`wdio.conf.mjs`, `specs/*.e2e.mjs`,
   `package.json`) plus its 1.6 GB Obsidian download cache at
   `/tmp/claude-1000/sc408-wdio-probe/obsidian-cache/`.
6. Worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, base `be4f002` (= `origin/develop`). Run
   `git -C <that path> fetch origin` and confirm `origin/develop` is still `be4f002`; if it
   moved, rebase onto it and say so in your report.
7. Workers never call the tracker (Linear).

## 1. The task

Scott's ask (verbatim, ledger): "I want to make sure that the dozens of interactions that are
possible in the stamina modal actually function properly, for example. what is the best way
to go about this? I want the tests to be comprehensive and able to be ran relatively easily
to find regressions and other bugs. If this test requires the use of the screen ( can't use
laptop while it runs) then thats okay."

Build the L2 e2e layer's infrastructure and prove it with three scenarios. P2 (a later round)
adds control ids, the manifest, and the full stamina scenario set on top of what you build —
so build the driver API to carry ~40 scenarios per surface without changes.

Deliverables, all inside the DSE repo:

1. **Dependencies** — devDependencies pinned to EXACT versions (no `^`): `webdriverio`,
   `@wdio/cli`, `@wdio/local-runner`, `@wdio/mocha-framework`, `@wdio/spec-reporter`,
   `wdio-obsidian-service` (3.3.0), plus whatever else the design needs (`mocha` types,
   `expect-webdriverio` comes with wdio). Use the versions the S2 probe resolved where
   possible (read its `package-lock.json`). `npm install` updates `package-lock.json`;
   commit both.
2. **`e2e/` layout per S2 §4.2**: `run.mjs`, `wdio.conf.mts` (or `.mjs` if TS config proves
   awkward — say which and why), `tsconfig.json`, `driver/{dse,recorders,invariants,artifacts,knownBug}.ts`,
   `vaults/shipped/` (real `.md` fixture notes + minimal `.obsidian/` config with
   `experimental` OFF — i.e. no `"experimental": true` in the plugin's `data.json`),
   `specs/stamina-bar/stamina-modal.e2e.ts`, `.out/` gitignored.
   Root `tsconfig.json` must exclude `e2e/`; `npm run tsc` must ALSO type-check `e2e/`
   (`tsc --noEmit && tsc --noEmit -p e2e`). jest must not pick up `e2e/` specs.
3. **`npm run e2e`** → `run.mjs`, which:
   - builds the plugin first (`npm run build-no-check`), like the lifecycle gate;
   - ALWAYS starts its own private Xvfb in the display range `:200–:239` (pick a free one;
     never `:1`, never `:99`, never `:160–:199`), sets `DISPLAY` explicitly for children, and
     never inherits the shell's `DISPLAY` (agent shells export `DISPLAY=:1`, which is Scott's
     real screen). Xvfb comes from devbox (the repo devbox has `xvfb`; see how
     `visual-harness/docs-shots.mjs` finds it);
   - `--headed`: use `DSE_E2E_HEADED_DISPLAY` if set, else `:1`; forces 1 shard; `--slow=<ms>`
     pauses and outlines the target before each action. **You must NOT run `--headed` on `:1`
     yourself — Scott may be using his screen.** Prove the headed path by pointing
     `DSE_E2E_HEADED_DISPLAY` at a private Xvfb you start yourself;
   - flags: `--element=<dir under specs/>`, `--only=<ID,…>` (mocha grep on `[ID]` in titles;
     an unknown id is a usage error, exit 2, ids pre-scanned from spec titles),
     `--shards=<n>` (default `min(4, floor(nproc/3))`), `--obsidian=pinned|installed`
     (`pinned` default = app 1.14.4 + installer 1.14.4; `installed` = `/usr/bin/obsidian` +
     newest `~/.config/obsidian/*.asar` with the installer version read from the binary — S2
     found it needs `installerVersion` set explicitly); `earliest`/`matrix` may be stubbed
     with a clear "not yet" exit 2;
   - Obsidian download cache at `$XDG_CACHE_HOME/dse-e2e-obsidian` (default
     `~/.cache/dse-e2e-obsidian`), overridable by `OBSIDIAN_CACHE`. Seed it ONCE by copying
     (`cp -a`, not move) the needed version dirs from the S2 probe cache so you do not
     re-download;
   - exit codes 0 = all ok, 1 = a test failed, 2 = environment/usage; final summary line
     `OBSIDIAN-E2E done: N/M ok, F failed, K known-bug` (plus `coverage:` later in P2);
   - reaps every child it spawned (Xvfb, chromedriver, Obsidian) by PID on exit, including
     SIGINT/SIGTERM and failures mid-startup (S2 saw a leaked chromedriver).
4. **Driver API** (`driver/dse.ts`), specs import ONLY from `driver/`: `openNote(path)`
   (reset vault copy to fixture state + open in Reading view + mark recorders), `block(lang,
   n?)` scoped to the visible reading view, `control(selector)` (for P1 a CSS selector or
   accessible name; P2 switches to `data-dse-control` ids — design the signature so that is
   a drop-in), `modal(kind)` (exactly one open `.dse-modal`, else fail), `click` (real pointer
   via wdio `element.click()`; CDP `Input.dispatchMouseEvent` fallback), `type(el, text,
   {replace})` (real key events), `press(key)`, `waitForWrite(path, action)` (resolves on
   vault `modify`, no sleeps; returns write count), `expectNoWrite(path, action)`,
   `expectNoteBlock(path, lang, n?)` (read via `app.vault.read`, nth fence, js-yaml parse).
   Record every (control, kind) driven into `e2e/.out/coverage.json` now, even though the P2
   gate consumes it.
5. **Invariants after every test** (`invariants.ts`): no uncaught page errors / console
   errors since the test's mark, no orphaned `.modal-container`, note integrity (content
   outside the edited block byte-identical to fixture), and the view-registry collision
   stats the lifecycle checks (port them).
6. **Failure artifacts** per S2 §4.5 under `e2e/.out/<run>/<test-id>/`.
7. **`knownBug(ticket, title, fn)`** per the ledger convention: passes while the assertion
   fails, FAILS when it starts passing (message: "known bug <ticket> appears fixed — remove
   the marker"). Counted separately in the summary line.
8. **Source seam**: `viewRegistry.pendingWrites()` (S2 §4.3: live views with a pending
   `persistTimer` or an in-flight write; `src/framework/view.ts` ~266), exposed so the driver
   can wait for write-idle in `expectNoWrite` instead of a fixed window. Keep it minimal,
   add a jest unit test for it, and do not change any rendered DOM.
9. **Focus emulation**: CDP `Emulation.setFocusEmulationEnabled({enabled:true})` on every
   session (S2 §4.7).
10. **Three proof scenarios** (S2 §4.3 sketch; adapt selectors to the real DOM):
    `[STAM-D01]` Damage less than temp → temp absorbs, one write, note matches;
    `[STAM-K01]` Escape closes without writing; `[STAM-S13]` type a new Stamina value then
    click Apply directly → first click applies (this is S1's B7). If STAM-S13 reproduces B7
    in real Obsidian, keep the correct-behaviour assertion and wrap it in
    `knownBug('B7-pending-ticket', …)`; report the evidence (screenshot + DOM) so the owner
    can file the ticket and you will swap in the real key in P2. If it does NOT reproduce,
    keep it as a normal passing scenario and report that.
11. **Docs**: a short `e2e/README.md` (what it is, the commands, headless vs headed, the
    cache, the layering rule of thumb from S2 §4.1, how to add a scenario). Keep it to one
    screen. The dse-verify skill and AGENTS.md edits are P2/owner work — do not edit them.

Commit after every coherent step (`git -C <dse path> add … && git -C <dse path> commit -m
"test(SC-408): …"`). Do not push. Commit messages must NOT contain any Claude/AI attribution
or co-author trailers.

## 2. Proofs you must run and report (numbers, not adjectives)

- `npm run e2e` full (3 scenarios) headless: wall time, summary line, exit code.
- `npm run e2e -- --only=STAM-K01` and `--only=NOPE-1` (expect exit 2).
- **Repeatability**: run the full e2e 5 times back to back; report pass counts (flake = 0
  expected; any flake is a finding, never retried away).
- **4-shard focus proof**: make a temporary spec dir with the blur-commit scenario
  (STAM-S13's typing step followed by a click-away that should commit) duplicated into 4
  spec files, run `--shards=4`, report results; then delete the temporary dir (not
  committed). If parallel blur fails, try one Xvfb per worker and report which works.
- `--headed` against a private Xvfb display you start (never `:1`), one scenario.
- `--obsidian=installed`, one scenario.
- A deliberate failure: temporarily break one assertion, run, confirm exit 1 + the artifact
  bundle contents (list files), then revert.
- After everything: `pgrep -af "worktrees/sc408-functest/"` and `pgrep -af chromedriver` —
  report that nothing you started is still alive.

## 3. Gates (dse-verify skill; run in this order, absolute paths, devbox-wrapped)

1. `npm run tsc` — clean (now includes `e2e/`).
2. `npm run lint` — clean.
3. `rm -f main.js styles.css` then `npx jest` — baseline at `be4f002` was last recorded as
   **4367 passed / 1 skipped / 215 of 216 suites** at `9ad919d`; SC-417 has landed since, so
   FIRST measure the baseline on a clean checkout of `be4f002` (stash nothing — measure
   before your first commit) and report baseline vs after. Expected after = baseline + your
   new `pendingWrites` tests, zero new failures. Timeout reds in settings-tab /
   settings-preview under load are noise (check `/proc/loadavg`, re-run).
   Known ~3% flake: `sidebarInitiative` "SC-288 r2" (SC-383).
4. `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle` — **25/25 ok**, exit 0.
5. `npm run e2e` — per §2.
(Shots / freeze / parity are not needed this round: you change no rendered DOM or CSS. If you
find you had to, stop and report STATUS: NEEDS_CONTEXT.)

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-p1-report.md`,
opening with a ≤10-line executive summary (verdict, final sha, gate numbers, e2e timings,
repeatability, 4-shard result, B7 verdict). Then: files added, design deviations from S2 §4
with reasons, the proofs' raw numbers, and evidence paths. `Drive-by fixes:` and
`Follow-ups:` buckets at the end.

Return contract: your final text goes to the ticket-owner, not a human — raw facts (verdict,
shas, measured numbers), no prose, plus the absolute path of every evidence artifact
(report, logs, screenshots, artifact bundles). If the report-file write is blocked, return
the report inline. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question.

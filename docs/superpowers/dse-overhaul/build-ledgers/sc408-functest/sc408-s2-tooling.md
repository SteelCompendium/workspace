# SC-408 S2: test-tooling architecture for a real-Obsidian behaviour suite

**Executive summary** (dse `sc408-functest` @ `be4f002`; tree clean before and after; nothing committed)
1. **Recommend C+: WebdriverIO + `wdio-obsidian-service` 3.3.0 as the launcher and runner, under a DSE-owned driver layer** (`e2e/driver/`, carrying over the lifecycle's hard-won helpers). Scenarios are TS files per surface. A **coverage manifest** lists every control × interaction kind, and a census plus an exercised-set check fail the build when a control has no scenario. jsdom keeps the combinatorial logic matrix. Real Obsidian proves every control end-to-end through real input to the note file, plus the needs-real-Obsidian set. Later, port the lifecycle gate onto the same driver so there is only one real-Obsidian harness.
2. **Measured lifecycle (port 9308):** subset G-S1+G-S2 **48.6 s, 2/2 ok** (build 0.5 s, Obsidian cold start ≈3–4.4 s, G-S1 33 s, G-S2 8.4 s, teardown 2 s). Full gate **259.8 s, 25/25 ok** (cold start 3.1 s, mean 10.2 s per scenario, almost all of it fixed `sleep()`s).
3. **Measured wdio probe (same 1.14.4 app):** warm run **7.0 s wall** for 2 real stamina-modal tests (1.5 s of test time). The 4 spec files took 24.3 s serially and **12.5 s with 4 parallel Obsidians**. A raw-CDP passthrough works (`Input.insertText`), with round trips of 2.7 ms (CDP) and 6.5 ms (`execute`). It worked against both the downloaded installer and Scott's installed one. Playwright is out: `connectOverCDP` fails on every installer, and `_electron.launch` fails on every installer ≥1.5 because the inspect fuse is off.
4. **Estimate:** about 300 real-Obsidian interactions take **~7.5 min serially, ~2–3 min on 4 shards** with event-driven waits. In the current lifecycle style (fixed sleeps) they would take about 45 min.
5. **Risk 1, flake:** focus/blur in parallel windows, the 400 ms debounce, and the trust dialog appearing at random times. Fixes: CDP focus emulation, waits keyed to writes plus a write-idle seam, the ported trust auto-dismiss, and no auto-retries. **Risk 2, runtime drift and a third-party dependency:** the gate today runs the **1.14.4 app on Scott's 2023 1.1.16 installer (Chrome 106)**, while a fresh install is Chrome 150. A single-maintainer service is also tied to chromedriver↔Electron versions. Fixes: pin the app and installer versions, run a matrix, keep a shared cache, and confine the third-party code behind our driver.

---

## 1. What exists today

### 1.1 `visual-harness/obsidian-lifecycle.mjs` (1,523 lines, the mandatory gate, 25 scenarios)
- **Spawn:** creates its own Xvfb (`:160–:199`, 1600×1200) and a scratch dir from `mkdtemp`, holding the vault (a `demo-vault` copy without plugins or workspace, plus the inline `FIXTURES` strings), a `udd` (`obsidian.json` registering the vault, the newest `~/.config/obsidian/obsidian-*.asar` copied in) and the freshly built `main.js/styles.css/manifest.json`. `data.json` has `experimental: true`. It then spawns `/usr/bin/obsidian --user-data-dir --remote-debugging-port` (`:1434`). It refuses to start if the port already serves CDP (`:1403-1410`) and validates `--only` (an unknown id exits 2, `:1392`).
- **Attach:** a raw CDP WebSocket on the `app://obsidian.md` page target (`Cdp` class `:208`; it rejects pending calls on socket close so a crash cannot wedge the run). It installs `AUTO_DISMISS_TRUST_DIALOG` (a MutationObserver that closes Obsidian's "trust the author" modal, which appears at random times across a run, `:296-348`) and `PAGE_HELPERS` (recorders for `vault.on('modify')`, Notices, `error`/`unhandledrejection`/`console.error`, `:267`).
- **Input, mixed:**
  - Most scenarios use **synthetic DOM events** via `Runtime.evaluate` (`el.click()`, `dispatchEvent(new MouseEvent('dblclick'))`, `.focus()`), e.g. `clickIncrease` `:411`, and G-S1/G-S2 `:710-785`.
  - Only the SC-377 scenarios (G-S9*) use **real input**: `realClick` sends `Input.dispatchMouseEvent` move/press/release at the element's centre (`:445`), `key()` sends `Input.dispatchKeyEvent` (`:455`), and text goes through `Input.insertText`.
  - SC-377 is the proof that this matters. The click shield `preventDefault`ed every mousedown, so real clicks never focused inputs. jsdom and every `.focus()`-based scenario stayed green (comment at `:1182-1185`).
- **Assertions:** they read three things.
  - The **note file on disk** (`fs.readFileSync`, `t.read` `:376`, `counterValues`, `integrity()`, which checks closed fences, an unchanged block count and no stray text `:380`).
  - The **DOM** via evaluated expression strings.
  - **Plugin internals**: `viewRegistry.liveEntries()/stats` (collisions/ambiguous), and `__lcTag` expandos that prove a root was adopted rather than rebuilt.
  - Errors and Notices are compared against a `mark()`.
- **Failure artifacts:** one full-window PNG (`Page.captureScreenshot`) per failed scenario. The temp dir (vault + udd) is kept only when a FAIL shot exists (`:1499`). There is no DOM snapshot, no console dump and no note before/after.
- **Timing:** fixed sleeps everywhere: `open` +700 ms, `reset` +1000 ms, and 1100–1500 ms after every write to cover the 400 ms `PERSIST_DEBOUNCE_MS` (`src/framework/view.ts:23`).
- **Reusable as a general driver:** Xvfb/port/udd/vault setup and cleanup, the `Cdp` class, the trust-dialog observer, the page recorders, `realClick`/`key`/`insertText`, `readingScope` (it avoids the hidden Live Preview sibling), `integrity()`, the registry stats, and `enterMode` (Reading vs Live Preview).
- **Lifecycle-specific:** the inline FIXTURES, the G-S* bodies, the `__lcTag` adoption probes, and the timing-gap loops (30/150/380 ms).
- **Ergonomics problem for scale:** every interaction is a hand-built JS string (``t.ev(`${t.root(TRACKER)}.querySelectorAll('.dse-init__group--enemies .dse-init__cell')[1].click()`)``). That is fine for 25 scenarios and painful for 300+.

### 1.2 `visual-harness/obsidian-camera.mjs` (2,096 lines)
- Uses the same raw-CDP plumbing, on `:1` by default (`DSE_CAMERA_DISPLAY`).
- **Why not Playwright (`:31-35`):** "`chromium.connectOverCDP()` fails against Obsidian's Electron with 'Browser.setDownloadBehavior: Browser context management is not supported'". **Still true** with Playwright 1.61.1 (§3.D probe).
- The comment never considered `_electron.launch`. That path works only on Scott's old installer (§3.D).

### 1.3 `visual-harness/docs-shots.mjs`
- Starts its own Xvfb (default `:99`, `DSE_DOCS_DISPLAY`) and then reuses the camera's `--docs` mode. Same pattern, no new mechanism.

### 1.4 jest (`jest.config.ts`, `test/setup/`, `test/mocks/`, `test/fakes/`)
- Two projects: `unit` (node) and `dom` (jsdom). `dom-setup.ts` installs Obsidian's `HTMLElement` prototype extensions (`createEl`, `empty`, `toggleClass`…), an `activeDocument` alias and a `CSS.supports` shim. `experimental-on.ts` forces the gate ON.
- `test/mocks/obsidian-core.ts` (1,392 lines) fakes `App`/`FakeVault`/`FakeWorkspace`/`Plugin`/`Setting`/`Menu`/`Notice`/`MarkdownRenderer`/`WorkspaceLeaf`.
- **`Modal`** (`:591`) is a bare div appended to `body`. It has no Scope/Escape handling, no backdrop click, no focus trap, and no real `.modal-container` stacking.
- `test/fakes/fakeObsidian.ts` is a richer vault/adapter for refs/data tests.
- The stamina modal already has 64 jsdom tests (`test/dom/views/stamina-edit-modal.test.ts`). They drive controls via `.click()` and by setting `.value`.

### 1.5 CI (`.github/workflows/plugin-ci.yml`)
- Runs tsc, lint, `npm test -- --ci`, the bundle build, a Playwright Chromium install and `npm run parity`.
- **There is no real-Obsidian step**: neither lifecycle nor camera runs in CI. `ci.yml` is only the mkdocs deploy.

## 2. Measurements

| Run | Result | Wall | Breakdown |
|---|---|---|---|
| `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle -- --only=G-S2,G-S1` | 2/2 ok, exit 0 | **48.6 s** | build 0.5 s; one-off `devbox install` for Xvfb 1.6 s; Obsidian spawn → plugin loaded → start line 2.8 s; **G-S1 33.1 s**; **G-S2 8.4 s**; cleanup 2.0 s |
| same, full gate | **25/25 ok**, exit 0 | **259.8 s** | cold start 3.1 s after the build; scenarios 4.0–36.6 s (G-S9e 36.6, G-S1 33.6, G-S9f 18.3, G-S9d 17.6, G-S4 15.5); mean 10.2 s |
| lifecycle G-S1+G-S2+G-S9b with `DSE_LIFECYCLE_BIN=` the downloaded **1.14.4 installer (Chrome 150)** | 3/3 ok | 55.2 s | the raw harness is installer-agnostic, and needs no `--no-sandbox` on this host |

`--only` passes through npm correctly: npm appends `-- …` args to the end of the script string, i.e. to the `node visual-harness/obsidian-lifecycle.mjs` command, after `build-no-check`.

The ≈10 s per scenario is not intrinsic to real Obsidian. It is roughly 1 s of `reset` sleep, plus 0.7 s of `open` sleep, plus 1.1–1.5 s of sleep per write, repeated. The wdio probe below did the same "open note → open modal → type → Damage → Apply → assert note" in about 1.2 s, using event-driven waits.

**Runtime discovery.** `/usr/bin/obsidian` → `/opt/Obsidian` is installer **1.1.16** (Electron 21, **Chrome 106.0.5249.199**, confirmed via `/json/version`). Every lifecycle and camera run therefore executes the 1.14.4 app on Chrome 106. The upstream metadata lists 1.14.4's `minInstallerVersion` as 1.5.8, and its own installer as Electron 43 / **Chrome 150.0.7871.250**. A user who installs Obsidian today runs Chrome 150. The DSE `manifest.json` `minAppVersion` is 1.13.0 and `isDesktopOnly: false`.

## 3. Options

### A. More jsdom tests in jest
- **Fidelity ceiling with today's fakes.** jsdom cannot see:
  - **Layout or hit-testing:** `getBoundingClientRect` is 0. An overlay covering a button, `pointer-events`, `visibility` and overflow clipping (the SC-334 sideways scroll) are all invisible.
  - **Default actions:** there is no focus-on-mousedown (the SC-377 class), no native Tab traversal and no Enter-submits.
  - **Real event order:** blur → click (S1's **B7**: typing then clicking the disabled Apply; the blur enables it and the click is swallowed).
  - **Obsidian's `Modal`:** Scope/Escape, backdrop click and focus trapping are not faked.
  - **The write lifecycle:** the section re-render after a write, adoption vs rebuild, the debounce flush on navigate-away, durable locate, and hover popovers being writable (G-S6g).
  - **CSS or theme interaction, popout windows, or real Notice stacking.**
  - Also, `updateCallback` is often a `jest.fn`, so the modal → element → note wiring is unproven.
- **What it does well.** It is very fast (ms per test), deterministic, and needs no display. It runs in CI already, and it is ideal for the combinatorial matrix: clamp math, labels × states, hero vs creature, temp absorption, disabled states, parse edge cases. **S1 found most of its 16 suspected bugs with 34 jsdom probes (26 red).** B1, B3–B6 and B8–B16 are logic bugs, not wiring bugs.
- **Verdict:** a necessary layer, not sufficient. It cannot answer Scott's question ("do the interactions actually function") for the wiring, focus, event-order and lifecycle classes.

### B. Generalize the raw-CDP harness into a framework
- **Fidelity:** the same as real Obsidian, if it uses real input only. Full CDP access: focus emulation, `CSS.forcePseudoState`, `DOMDebugger.getEventListeners`, timing at ms granularity.
- **We would have to build:**
  - a runner (describe/it, hooks, selection, unknown-id rejection, parallel workers, junit for CI);
  - actionability (visible, enabled, stable, hit-test at the click point);
  - auto-waiting locators and retrying matchers;
  - per-worker isolation;
  - version download and pinning, plus a matrix;
  - failure artifacts and a CI recipe.
  That is about 1–1.5k lines of new infrastructure to own. Version pinning could borrow `obsidian-launcher` as a library.
- **Pros:** no new framework, works on any binary without chromedriver, and the code is already debugged.
- **Cons:** we maintain a bespoke test framework forever, and agents have no public documentation to learn it from.

### C. WebdriverIO + `wdio-obsidian-service` (probed in `/tmp/claude-1000/sc408-wdio-probe/`)
- **Package:** `wdio-obsidian-service` 3.3.0 (modified 2026-10-06, MIT, by jesse-r-s-hines). Depends on `obsidian-launcher` 3.3.0. Peers: `webdriverio ^9.18`. Node ≥18.20. Install cost: 551 packages, 163 MB, 19 s, done in a scratch dir and **never in the worktree**.
- **How it gets Obsidian:** `obsidian-launcher` downloads the app asar and the installer (AppImage, extracted) plus the matching **Electron chromedriver** into `cacheDir`. Version metadata comes from `obsidian-versions.json` on GitHub raw (314 versions, auto-updated upstream).
  - **Offline:** `cachedFetch` uses a 30-minute TTL and **falls back to the cached copy on network error**. Downloads are cached, so it works offline after the first run per version.
  - **Pinning:** `browserVersion: '1.14.4'`, plus `installerVersion` ('earliest'/'latest'/exact). `binaryPath` and `appPath` accept a local install.
- **Probe results** (2 real tests: open `stamina.md` → click the bar → type `3` in the Apply box → Damage → footer Apply → wait for `temp_stamina: 2` in the vault; Escape closes the modal):
  - First run, download included: **34.7 s**. Warm: **7.0 s wall, 1.5 s of test time**. Steps: resetVault 40 ms, modal open ≈0.2 s, write landed ≈0.7 s after the clicks.
  - 4 spec files: **24.3 s serially vs 12.5 s with `maxInstances: 4`**, all four on one Xvfb, all green. That is about 5 s of fixed cost per spec file, for launching Obsidian.
  - `binaryPath=/usr/bin/obsidian` with the default installer metadata **fails**: chromedriver 120 vs Chrome 106. With `installerVersion: '1.1.16'` it fetched the right chromedriver and **passed** (42.7 s cold). So wdio can test Scott's actual installer **and** the current one.
  - Raw CDP from wdio: `browser.sendCommandAndGetResult('Input.insertText', …)` works. The CDP round trip is 2.7 ms, `browser.execute` 6.5 ms, and `$().isDisplayed()` 20 ms. The lifecycle's timing-gap scenarios (30/150/380 ms) are portable.
  - Cache size: ~790 MB for 2 installers + 2 chromedrivers + 1 app. The probe dir totals 1.9 GB, including node_modules and a third installer.
  - One wart: a session that **failed to start** leaked its `chromedriver` process (the service's `after` hook threw on an undefined browser). I killed it by PID.
- **Fidelity:** real input via the W3C actions → chromedriver → CDP `Input.*` chain. ChromeDriver's element click does the actionability and hit-test check ("element click intercepted"). The session is real Obsidian, so it shares B's fidelity minus nothing; CDP passthrough covers the rest.
- **What it provides out of the box:**
  - selection through mocha `--spec`/`--grep`, plus `--bail`, `retries` and reporters (spec, junit);
  - parallel isolated instances, each with its own vault copy and its own config dir;
  - `resetVault` (in place, ms) and `reloadObsidian` (a full reset);
  - `executeObsidian(({app}) => …)`;
  - a version matrix, mobile emulation (`emulateMobile`), and a documented GitHub Actions setup.
- **Footgun:** wdio's built-in `autoXvfb` uses an Xvfb **only when `DISPLAY` is unset**. Agent shells here export `DISPLAY=:1`, so a bare `wdio run` **would open Obsidian windows on Scott's screen**. The runner must own the display (§4.4).

### D. Playwright `_electron.launch` / `connectOverCDP` (probed with the repo's Playwright 1.61.1)
- `connectOverCDP` fails on both installers with `Browser.setDownloadBehavior: Browser context management is not supported`. This confirms the camera comment.
- `_electron.launch` **works on `/usr/bin/obsidian` (1.1.16)** and **times out on the 1.5.8 installer**. The reason is visible in the Electron fuses:
  - 1.1.16 has `RunAsNode=1`, `EnableNodeCliInspectArguments=1`.
  - 1.5.8 has `RunAsNode=0`, `EnableNodeCliInspectArguments=0`.
  - Playwright's Electron mode needs the Node inspector, so it works only on obsolete installers and breaks when Scott updates.
- **Verdict:** not viable. That reconciles with the camera's comment, which only ever tried `connectOverCDP`.

### Scorecard

| | A jsdom | B raw-CDP framework | **C wdio + service** | D Playwright |
|---|---|---|---|---|
| Sees wiring / focus / event order / layout / lifecycle bugs | no | yes | **yes** | n/a (dead on current installers) |
| Speed per interaction | ~ms | ~1 s (with event waits) | **~0.4–1.2 s measured** | — |
| Flake risk | very low | medium | medium (same causes as B) | — |
| Authoring ergonomics for hundreds of tests | good | build it ourselves | **good, documented, familiar to agents** | — |
| Maintenance we own | low | **high** (a whole framework) | driver layer + manifest | — |
| Needs a display | no | Xvfb | Xvfb | — |
| Parallel | jest workers | build it | **`maxInstances`, measured 2× at 4** | — |
| Version pinning / matrix | n/a | build it, or borrow obsidian-launcher | **built in** | — |
| CI | already | possible, after building it | **documented recipe** | — |
| Fit with the battery | already in it | same style as lifecycle | new step plus a second framework (mocha) beside jest | — |

## 4. Recommendation: C, under a DSE-owned driver layer and a coverage manifest

**Why C over B:** everything B would have to build — a runner, actionability, auto-wait, parallel isolation, version pinning and a matrix, reporters, a CI recipe — is exactly what wdio plus the service already does, maintained and documented. The lifecycle's distinctive knowledge (trust dialog, recorders, integrity, registry stats, Reading vs Live Preview scoping, timing gaps) is about 300 lines of helpers, and those port as the driver layer.

The trade-off is a second test framework (mocha) and about 160 MB of devDependencies. That is the standard arrangement, and the service's README prescribes it: jest for unit tests, mocha for e2e. The fidelity is the same as B, and the wdio CDP passthrough removes B's only real advantage.

### 4.1 Layering policy (what goes where)

| Layer | Runs in | Owns |
|---|---|---|
| L0 unit | jest node | models, parse, math (unchanged) |
| L1 jsdom | jest dom | **the combinatorial matrix**: every variant of every control's logic (values × states × host kind), labels and disabled reasons, table-driven. S1's 26 red probes belong here. |
| L2 **e2e behaviour** (new) | wdio + real Obsidian | **every manifest (control, kind) pair at least once, end-to-end, through real input, asserting the note file + DOM**. Each needs-real-Obsidian interaction (focus/blur order, Escape/backdrop, hit-testing, adoption across a write, Live Preview) is tested with its variants. After every test, cross-cutting invariants run automatically: no page errors, no orphaned modals, note integrity, registry `collisions == ambiguous == 0`. |
| L3 lifecycle | today raw CDP; **phase 2 ported onto the L2 driver** | write-lifecycle timing edges (G-S*), keeping their ids and the `OBSIDIAN-LIFECYCLE` line contract until the port |

Rule of thumb: if a bug would show in a jsdom table, test it there. If it needs a real browser event, a real Modal, layout or a real write, it needs an L2 scenario.

**Shipped specs run with `experimental` OFF** (the real 7.0.0 product). Deferred-element specs use a second vault config with it ON. Today's lifecycle runs only ON.

### 4.2 Layout (all inside `draw-steel-elements/`)

```
e2e/
  run.mjs                 # the ONE entry point: display, binary, flags, summary line, exit 0/1/2
  wdio.conf.mts           # capabilities from run.mjs env; autoXvfb:false; reporters spec+junit
  tsconfig.json           # own types (@wdio/globals, mocha, wdio-obsidian-service); root tsconfig excludes e2e/
  driver/                 # DSE-owned; specs import ONLY this, never wdio-obsidian-service directly
    dse.ts                #   openNote/block/control/click/type/press/expectNoteBlock/expectNoWrite/waitForWrite
    recorders.ts          #   ported PAGE_HELPERS + AUTO_DISMISS_TRUST_DIALOG + focus emulation
    invariants.ts         #   afterEach: errors, orphan modals, integrity, registry stats
    artifacts.ts          #   failure bundle (§4.5)
    knownBug.ts           #   expected-failure marker (owner ruling: pilot encodes correct behaviour)
  vaults/shipped/         # real .md fixture notes (Scott can open them by hand) + .obsidian config, experimental off
  vaults/experimental/
  specs/<surface>/*.e2e.ts
  manifest/<surface>.ts   # coverage manifest (§4.6)
  .out/                   # gitignored: junit, coverage.json, failure bundles
```

The root `tsconfig.json` `include` is `**/*.ts`. `e2e/` must be excluded there, because jest's `expect` and expect-webdriverio's global types collide. Add `tsc -p e2e` to `npm run tsc` so it stays one gate.

The Obsidian cache goes in a **shared** `~/.obsidian-cache` (`OBSIDIAN_CACHE`), never per worktree: it is about 300–800 MB per version set, and there are many worktrees.

### 4.3 Scenario authoring API, sketched against the stamina modal

Ids are in the title (`[STAM-xx]`), matching the manifest and S1's inventory ids. Every action is real input. `click()` records the (control, kind) pair for coverage.

```ts
// e2e/specs/stamina-bar/stamina-modal.e2e.ts
import { dse, knownBug } from '../../driver/dse';

describe('stamina-edit-modal (from ds-stamina)', () => {
  beforeEach(() => dse.openNote('Stamina/basic.md'));   // resetVault + open Reading view + recorders mark

  it('[STAM-D01] Damage less than temp: temp absorbs it, Stamina unchanged, one write', async () => {
    const bar = dse.block('stamina-bar');                 // scoped to the visible reading view, first root
    await dse.click(bar.control('stamina.bar'));          // real pointer, hit-tested
    const modal = await dse.modal('stamina-edit');         // exactly one open .dse-modal, else fail
    await dse.type(modal.control('sedit.apply-amount'), '3', { replace: true });
    await dse.click(modal.control('sedit.damage'));
    await expect(modal.control('sedit.apply')).toHaveText(expect.stringContaining('3'));
    const w = await dse.waitForWrite('Stamina/basic.md', async () => {
      await dse.click(modal.control('sedit.apply'));
    });                                                    // resolves on the vault 'modify' event, no sleep
    expect(w.count).toBe(1);
    await expect(modal.root).not.toBeExisting();
    await dse.expectNoteBlock('Stamina/basic.md', 'ds-stamina-bar')
      .toMatchObject({ current_stamina: 15, temp_stamina: 2 });
  });

  it('[STAM-K01] Escape closes without writing', async () => {
    await dse.click(dse.block('stamina-bar').control('stamina.bar'));
    const modal = await dse.modal('stamina-edit');
    await dse.type(modal.control('sedit.apply-amount'), '5', { replace: true });
    await dse.click(modal.control('sedit.damage'));
    await dse.expectNoWrite('Stamina/basic.md', () => dse.press('Escape'));   // waits for write-idle, then mods === 0
    await expect(modal.root).not.toBeExisting();
  });

  // S1 B7 (Chromium-confirmed). Per the owner ruling, the pilot confirms it in Obsidian. If it
  // reproduces, it becomes knownBug('SC-4xx', …), which passes while the bug exists and FAILS
  // once fixed, telling us to drop the marker.
  it('[STAM-S13] type a new Stamina value, then click Apply directly: the first click applies', async () => {
    await dse.click(dse.block('stamina-bar').control('stamina.bar'));
    const modal = await dse.modal('stamina-edit');
    await dse.type(modal.control('sedit.stamina.input'), '12', { replace: true });   // focus stays in the input
    await dse.waitForWrite('Stamina/basic.md', () => dse.click(modal.control('sedit.apply')));
    await dse.expectNoteBlock('Stamina/basic.md', 'ds-stamina-bar').toMatchObject({ current_stamina: 12 });
  });
});
```

Driver internals that matter:
- **`click`** uses wdio `element.click()`: chromedriver actions plus the intercepted-click hit-test. It falls back to the CDP `Input.dispatchMouseEvent` path for coordinates and pseudo-elements.
- **`type`** uses `setValue`/`addValue`, which are real key events. `insertText` is available for IME-style input.
- **`press`** uses `browser.keys`.
- **`waitForWrite`** and **`expectNoWrite`** use the ported `vault.on('modify')` recorder.
  - **Recommended small source seam:** `viewRegistry.pendingWrites()` returns the live views with a pending `persistTimer` or an in-flight write (`ElementView.persistTimer`, `src/framework/view.ts:266`). With it, negative assertions wait for idle instead of a fixed 400 ms + margin quiet window. Without the seam, use a quiet window of `PERSIST_DEBOUNCE_MS + 400 ms`.
- **`expectNoteBlock`** reads the file through `app.vault.read`, finds the n-th fence of that language and parses it with js-yaml.

### 4.4 Runner commands, selection, headless vs headed

```
npm run e2e                                   # full suite: headless, pinned Obsidian, auto shards, coverage gate ON
npm run e2e -- --element=stamina-bar          # → --spec e2e/specs/stamina-bar/**
npm run e2e -- --surface=stamina-edit-modal   # specs whose manifest surface matches
npm run e2e -- --only=STAM-D01,STAM-S13       # mocha grep on "[ID]"; an unknown id → exit 2 (ids pre-scanned from spec titles)
npm run e2e -- --headed [--slow=300] [--pause-on-fail]
npm run e2e -- --obsidian=pinned|installed|earliest|matrix
npm run e2e -- --shards=4
```

- **`run.mjs` builds the plugin first**, like lifecycle.
- **Default is headless.** `run.mjs` **always** starts a private Xvfb (proposed range `:200–:239`, so it never collides with lifecycle `:160–:199` or docs `:99`). It sets `DISPLAY` explicitly and `autoXvfb: false`. It never inherits the agent shell's `DISPLAY=:1`. Scott can keep using the laptop.
- **`--headed`** uses `DISPLAY=:1` (or `DSE_E2E_HEADED_DISPLAY`) and forces one shard. `--slow` adds a pause and a 2 px outline highlight on the target before each action, so Scott can follow. `--pause-on-fail` drops into `browser.debug()` and leaves the window open.
  - The instance is still sandboxed (own config dir and vault copy) and never touches `~/.config/obsidian`.
  - CDP input is synthetic to the renderer, so Scott's own mouse does not steer it. Focus emulation (below) keeps window-focus changes from breaking blur-based tests.
- **Exit codes** follow the lifecycle convention: 0 ok, 1 test failure, 2 environment. **Summary line** `OBSIDIAN-E2E done: N/M ok, F failed, K known-bug`, for the battery's read-the-text rule.
- **Obsidian versions:**
  - `pinned` (default): app 1.14.4 + installer 1.14.4, Chrome 150, i.e. what a new user gets.
  - `installed`: `/usr/bin/obsidian` + the newest `~/.config/obsidian/*.asar`, with the `installerVersion` read from the binary. This is Scott's own setup, currently Chrome 106.
  - `earliest`: `minAppVersion` 1.13.0 on its earliest installer.
  - `matrix`: all of the above. Run it before a release.

### 4.5 Failure artifacts (`e2e/.out/<run>/<test-id>/`, from an `afterTest` hook)
- full-window PNG (`saveScreenshot`) plus a clip of the DSE root and of the open modal;
- the `outerHTML` of the block root and of every `.modal-container`;
- the touched notes before (fixture) and after, with a unified diff;
- page errors, console errors, Notices and vault `modify` events since the test's mark;
- the Obsidian app, installer and Chrome versions;
- the kept vault copy path;
- the junit XML for CI.

### 4.6 Coverage manifest (a new control with no scenario fails the build)

**Stable control ids.** Kit factories (`iconButton`, `stepper`, button/input helpers in `src/framework/kit/`) take a `control` option and stamp `data-dse-control="sedit.damage"`. Ids do not depend on copy, so they survive dynamic labels such as Spend Recovery's tooltip-as-name or "Gain N Stamina…". jsdom tests get stable selectors too.

```ts
// e2e/manifest/stamina-edit-modal.ts
export default surface('stamina-edit-modal', {
  reach: ['stamina-bar:stamina.bar', 'initiative:init.detail.stamina', 'hero:hero.stamina'],
  controls: {
    'sedit.apply-amount': ['type', 'enter', 'blur'],
    'sedit.damage': ['click'], 'sedit.healing': ['click'],
    'sedit.stamina.input': ['type', 'blur'], 'sedit.stamina.inc': ['click'], 'sedit.stamina.dec': ['click'],
    'sedit.temp.input': ['type'], 'sedit.temp.inc': ['click'], 'sedit.temp.dec': ['click', 'click-disabled'],
    'sedit.kill': ['click'], 'sedit.full-heal': ['click'], 'sedit.spend-recovery': ['click', 'click-disabled'],
    'sedit.reset': ['click'], 'sedit.no-change': ['click'],
    'sedit.apply': ['click', 'click-disabled'], 'modal.close': ['click', 'escape', 'backdrop'],
  },
});
```

Three checks:
1. **Census, in jest, in CI, no Obsidian.** A `test/dom/e2eCensus.test.ts` mounts each manifest surface through its jsdom recipe. It fails if any interactive node (`button,input,select,textarea,[role=button],[tabindex],[contenteditable]`) under a DSE root or modal lacks `data-dse-control`, or carries an id not in the manifest.
2. **Census in real Obsidian** (`specs/_census.e2e.ts`). It uses CDP `DOMDebugger.getEventListeners` to find **non-semantic nodes with click, pointer or key listeners**, the div-with-a-listener controls jsdom cannot see, and fails on any without an id.
3. **Exercised set.** The driver records every (control, kind) it drives into `e2e/.out/coverage.json`. In a full run, the runner fails if any manifest pair was exercised by zero tests, and lists the missing pairs. `--only`/`--element` runs skip this gate but print the coverage. S1's 150-row inventory seeds the stamina manifests.

### 4.7 Parallel sharding
- `maxInstances = --shards` (default `min(4, floor(nproc/3))`; nproc is 12 here, and the host is shared with other agents).
- One spec file per surface or sub-surface. wdio shards by spec file, and each file gets its own Obsidian (≈5 s launch).
- **The driver enables CDP `Emulation.setFocusEmulationEnabled({enabled:true})` on every session.** With several Obsidian windows on one X display, only one has OS focus, and Chromium suppresses focus and blur events in an unfocused page. That is precisely the class these tests check (click-away saves, B7). The measured 4-way run passed a type-and-click test, but blur-commit scenarios were not exercised in parallel. The pilot must prove this, or fall back to one Xvfb per worker.

### 4.8 Battery and CI
- **Battery:** a new step **4b `npm run e2e`**, after the lifecycle (it also builds `main.js`) and before shots. It is mandatory for any change to `src/` interactive code; `--element` is for iteration. In phase 2 the lifecycle scenarios move into `e2e/specs/lifecycle/` on the same driver, with ids `G-S*` unchanged, and step 4 folds into 4b. `obsidian-camera` stays raw CDP: it is a camera, not a test suite. The dse-verify skill gains the command shapes and the `DISPLAY` footgun.
- **CI: yes.** Add a `plugin-ci.yml` job on `ubuntu-latest`: `npm ci`, cache `~/.obsidian-cache` keyed on the pinned versions, then `xvfb-run -a npm run e2e -- --obsidian=pinned --shards=2`, uploading `e2e/.out` on failure. Notes:
  - Downloads on a cache miss are about 300 MB (installer + chromedriver) from GitHub releases.
  - The service's sample plugin ships exactly this workflow.
  - The lifecycle could join CI the same way after the phase-2 port. **Today no real-Obsidian test runs in CI.**
- **Retries:** off by default. A flake is a bug in the test or the product. Instead, keep a quarantine list in `e2e/quarantine.json`, which each entry must cite a ticket for.

### 4.9 Run-time estimate

Measured unit costs:
- about 0.4 s for a test without a write (open, interact, assert DOM);
- about 1.2 s for a test with a write (it includes the 400 ms debounce);
- about 40 ms for `resetVault`;
- about 5 s per spec file (Obsidian launch).

| Volume | Serial | 4 shards | Note |
|---|---|---|---|
| ~300 interactions (≈1.0 s avg) in ~30 spec files | 300 s + 150 s ≈ **7.5 min** | **≈2–2.5 min** (3–4 min under host load) | |
| S3's ~450 shipped interactions | ≈10 min | ≈3–3.5 min | |
| lifecycle-style fixed sleeps (≈9 s/scenario) × 300 | ≈45 min | — | why event-driven waits are mandatory regardless of tool |

Negative assertions without the write-idle seam add about 0.8 s each. Expect about 20–30% of tests to have one, which adds about 1–1.5 min serial.

## 5. Risks and trade-offs
1. **Flake: focus, timing, and host dialogs.** Parallel windows lose OS focus, debounce-based writes race with assertions, and Obsidian's trust dialog appears at random times (the lifecycle documents it appearing mid-keystroke).
   - Mitigations: focus emulation; waits keyed to `vault.on('modify')` and the `pendingWrites()` seam, never `sleep()`; the ported trust observer (the probe never saw the dialog under wdio, but keep the guard); invariants after every test; no retries.
2. **Runtime drift and third-party code.**
   - The gate today tests Chrome 106 while new users run Chrome 150.
   - `wdio-obsidian-service` has a single maintainer, and chromedriver must match each Electron version.
   - A failed session start leaked a chromedriver in the probe.
   - Mitigations: pin the app and installer, run the matrix, keep the shared cache (offline-safe after the first fetch), and confine the service to `driver/` and `wdio.conf.mts`. If it is abandoned, swapping in `obsidian-launcher` alone or our own Cdp class touches only the driver. Run.mjs reaps chromedriver and Obsidian children by PID on exit.
3. **Manifest upkeep.** Every control needs an id and a manifest row. That is the point, because it makes "comprehensive" checkable, but it is ongoing work. The census makes forgetting fail loudly rather than silently.
4. **A second framework.** mocha + expect-webdriverio sits beside jest, and the matchers differ subtly. It is contained to `e2e/` with its own tsconfig.
5. **Disk:** about 0.3–0.8 GB of cache per pinned version set, about 2 GB for the full matrix. Shared across worktrees.
6. **Scott's installer** is below the metadata minimum for 1.14.4. `--obsidian=installed` still passed the probe, but Obsidian may prompt him to reinstall. Advise updating the installer, and keep `installed` in the matrix while he runs it.

## 6. Pilot scope (proposed next round)
- Scaffold `e2e/`, `run.mjs`, the driver and the recorders.
- Stamp `data-dse-control` in the StaminaEditModal kit call sites only.
- Write the stamina manifest from S1's inventory.
- Write about 25–40 scenarios: one per manifest pair, plus the needs-real-Obsidian set, plus B7 and B2 real-Obsidian confirmation (owner ruling).
- Add the jsdom census for that surface, and the exercised-set gate.
- Prove 4-shard focus emulation with a blur-commit scenario.
- Measure, then propose the dse-verify skill and CI edits.

---

## Evidence
- Lifecycle subset log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-s2-lifecycle-run.log`
- Lifecycle full log (per-scenario timestamps): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-s2-lifecycle-full.log`
- Lifecycle on the 1.14.4 installer: `/tmp/claude-1000/sc408-wdio-probe/lifecycle-installer-1.14.4.log`
- wdio probe: config `/tmp/claude-1000/sc408-wdio-probe/proj/wdio.conf.mjs`; specs `/tmp/claude-1000/sc408-wdio-probe/proj/specs/{stamina,cdp}.e2e.mjs`; logs `/tmp/claude-1000/sc408-wdio-probe/run-system.log` (chromedriver mismatch), `run-download.log` (cold), `run-warm.log`, `run-4spec-serial.log`, `run-4spec-par4.log`, `run-installer1116.log`, `run-cdp.log`
- Playwright probe: `/tmp/claude-1000/sc408-wdio-probe/pw/probe.mjs`, `/tmp/claude-1000/sc408-wdio-probe/pw/probe.log`, `/tmp/claude-1000/sc408-wdio-probe/pw/probe2.log`
- Package metadata and READMEs: `/tmp/claude-1000/sc408-wdio-probe/meta/`
- Helper scripts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3c516b12-e836-4966-953a-f8a1d5356c04/scratchpad/{tsrun.mjs,wdio-run.sh,pw-run.sh,pw-run2.sh,ver.sh}`

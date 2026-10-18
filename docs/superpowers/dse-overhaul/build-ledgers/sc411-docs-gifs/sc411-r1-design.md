# SC-411 r1 — design / survey / encoder spike

**Executive summary** (≤10 lines)
1. **Encoder:** `gifenc@1.0.3` + `pngjs@7.0.0` (both MIT, 0 deps, exact-pinned devDeps). Initiative spike, 19 frames: 216,430 B @1x / 620,615 B @2x, ~0.5 s encode. ffmpeg is linuxbrew-only; Playwright's ffmpeg has no GIF encoder (measured).
2. **Elements:** 22 registered = 13 shipping + 9 deferred. 6 shipping elements are interactive: browser camera for initiative, negotiation, counter and feature rolling; real Obsidian for stamina-bar and montage (both open a modal). Optional 7th: initiative conditions modal (Obsidian).
3. **Determinism:** frames and GIFs are byte-identical across runs in both cameras with two runner-only knobs. Browser: `--disable-partial-raster` (13/13 identical; without it 1 in 6 runs differed by 1 px). Obsidian: freeze-CSS (5/5 identical; without it 1 in 3 differed by 8 px). So: strict byte-identity check.
4. **Top risk (Scott):** 5 items on the ticket's minimum list are deferred in 7.0.0 (encounter + sidebar, party, surges, ds-roll, ds-conditions), which SC-407 bars from the docs. Proposal: conditions → initiative ConditionsModal, power roll → feature-card rolling, park the rest.
5. **Risk 2:** browser camera runs `experimental` ON, so hover shows the deferred "Pin to sidebar" chrome (seen in spike frames). Needs a harness `experimental=0` param; no shot moves.
6. Steel-dark is already the docs default. The plugin devbox.json has no node (falls to nvm v20 < engines 22.15), a risk to "fresh clone + devbox".

---

## 0. Environment facts found on the way (owner-relevant)

- `origin/develop` = `a3374601c89401198bdbc0e2f1b4ff2a41163496` (unchanged; no rebase needed).
- **Devbox picks its project from the caller's cwd, not from the `cd` target.** `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && …'` issued from `workspace/draw-steel-elements/` uses *that* directory's devbox.json. The plugin's `devbox.json` has **no `nodejs`** (only github-cli, jq, xvfb), so node falls through to the host's nvm **v20.11.1**. That is below `engines.node >=22.15`, and the camera needs the global `WebSocket`. The workspace devbox (`devbox run -c <worktree superproject>`) gives node **v24.4.1**, but it has no Xvfb. `docs-shots.mjs` finds Xvfb by path in the plugin's `.devbox/nix/profile/default/bin` (`docs-shots.mjs:161`), so the combination works. My `npm ci` ran under node 20 because of this. Every spike run afterwards used `-c` with node 24.
- Superproject `.venv/` was created by the workspace devbox init hook. It is gitignored (`.gitignore:14`).

## A. Element enumeration

Source of truth: `main.ts:290 registerFrameworkElementDefinitions` plus `src/elements/*/definition.ts`. `deferred: true` is what `docs-deferred-guard.cjs` reads, pinned by `test/unit/build/docsDeferredGuard.test.ts`.

| id | aliases | status | interactive? | docs page | docs image today |
|---|---|---|---|---|---|
| initiative | ds-it, ds-init, ds-initiative, ds-initiative-tracker | ship | **yes** (card writes and modals) | initiative-tracker.md (+ running-an-encounter.md) | `initiative-tracker.gif` (hand-recorded, 1,105,037 B, 723 frames, 72 s, pre-Steel look) + `initiative-tracker.png` + 3 modal PNGs |
| negotiation | ds-nt, ds-negotiation, ds-negotiation-tracker | ship | **yes** (card only, no modal) | negotiation-tracker.md | `negotiation.png` (lines 11, 37). **`negotiation.gif` (518,135 B, 591 frames, pre-Steel look) is referenced by no doc.** |
| counter | ds-ct, ds-counter | ship | **yes** (stepper, typed value) | counter.md | counter.png |
| stamina-bar | ds-stam, ds-stamina, ds-stamina-bar | ship | **yes** (bar opens StaminaModal; recovery pips; Catch Breath) | stamina-bar.md | stamina-bar.png, stamina-bar-modal.png |
| montage | ds-montage | ship | **yes** (quick-log, "Log an action…" sheet modal, end round) | gm-trackers.md | montage.png, montage-sheet-modal.png |
| feature | ds-ft, ds-feat, ds-feature | ship | **yes, pref-gated**: `rollingEnabled` (default OFF, documented in settings.md:158) adds a roll button and click-a-tier rolling | Features.md | feature.png, simple_feature_power_roll.png |
| statblock | ds-sb, ds-statblock | ship | static (rolling also applies; ticket says static → no GIF) | statblock.md, styling-statblocks.md | statblock.png, statblock-side-by-side.png |
| featureblock | ds-fb, ds-featureblock | ship | static | featureblock.md | featureblocks.png |
| skills | ds-skills | ship | static (only the generic chrome "hide unowned" toggle, session-only) | skills-element.md | skills.png |
| characteristics | ds-char, ds-characteristics | ship | static | characteristics-element.md | characteristics.png |
| values-row | ds-vr, ds-value-row, ds-values-row | ship | static | values-row-element.md | values-row.png |
| horizontal-rule | ds-hr, ds-horizontal-rule | ship | static | horizontal-rule.md | horizontalRule.png |
| scc | ds-scc | ship | static (link clicks are Obsidian navigation) | compendium-sync.md | scc-reference.png |
| roll | ds-roll, ds-r, ds-power-roll | **deferred** | yes | none (SC-407 removed Roll.md) | none |
| encounter | ds-encounter | **deferred** (+ sidebar deferred) | yes | none | none |
| party | ds-party | **deferred** | yes | none | none |
| conditions | ds-conditions, ds-cond | **deferred** | yes (modal) | none | none |
| surges | ds-surges | **deferred** | yes | none | none |
| heroic-resource | ds-resource | **deferred** | yes | none | none |
| hero-tokens | ds-tokens | **deferred** | yes | none | none |
| project | ds-project | **deferred** | yes | none | none |
| hero | ds-hero | **deferred + hidden** | yes | none | none |

**Mapping the ticket's minimum list onto shipping elements:**

| ticket item | maps to | camera | reason |
|---|---|---|---|
| initiative tracker | `initiative` | **browser** | Title, acted, round, malice stepper and Amount row are all in-card DOM. The browser host's `replaceSource` is a no-op (`entry.ts:1935`), but every one of these updates paints in place (view.ts header "UPDATE STRATEGY"), so what the GIF shows is identical. |
| negotiation tracker | `negotiation` | **browser** | Seals, chips, tabs, power-roll rows and Complete Argument are pure card. No modal (`src/elements/negotiation` has 0 modal files). |
| counter / stepper | `counter` | **browser** | Pure card. |
| stamina (bar + modal) | `stamina-bar` | **Obsidian** | The interaction *is* the StaminaModal. The browser Modal shim has no positioning or backdrop (`docs-manifest.mjs:96-103` `MONTAGE_MID` comment). |
| conditions (modal) | **initiative's ConditionsModal** (`ds-conditions` is deferred) | **Obsidian** | Modal, as above. This would be a *second* initiative GIF (`initiative-tracker-conditions.gif`). Owner or Scott decides whether "one GIF per element" allows it. |
| montage | `montage` | **Obsidian** | The primary flow is the "Log an action…" sheet (gm-trackers.md:51). The browser shim would publish a box that does not exist in the product. |
| power roll / roll | **feature-card rolling** (`ds-roll` is deferred) | **browser** | The roll result renders in the card, with no modal. Dice must be seeded (Math.random, see C). |
| encounter → sidebar | `encounter` + sidebar | — | **Both deferred**. Not publishable in 7.0.0. |
| party award, surges | `party`, `surges` | — | **Deferred**. Not publishable in 7.0.0. |

**Where browser mocks would make a capture misleading:**
- (1) Any modal: stamina, conditions, the montage sheet, the minion pool. The shim's modal is a bare div appended to `<body>`.
- (2) **Any hover in the browser camera reveals the element chrome with the deferred "Pin to sidebar" item.** `pipeline.ts:735` gates it on `isExperimental()`, and the harness forces that ON (`entry.ts:103`). This is visible as a clipped strip of chrome icons at the top of my browser frames. Obsidian docs mode runs OFF, so the item is absent there.
- (3) The browser camera never re-renders after a write (no section re-draw or SC-340 adoption). That is fine for the four browser GIFs, because each one's updates paint in place. A GIF whose *point* is "the write lands and survives" belongs in Obsidian.
- (4) Font: the harness vendors a sans `--font-text` while Obsidian shows a serif card body (visual-harness/README "Known deltas"). Between browser and Obsidian spike frames, the two looked indistinguishable for initiative.

## B. Entry-shape design

### Shape (added to `DOCS_SHOTS`, same array, so the orphan report, `--only` and the deferred guard keep working)

```js
{
  out: 'initiative-tracker.gif',
  kind: 'gif',
  source: 'browser',            // or 'obsidian'
  // what to mount — exactly the PNG shapes:
  element: 'initiative', fixture: 'default',          // browser
  // note: 'stamina-bar' | body: fence(...)           // obsidian (reuses docsNoteName/`body`)
  prefs: { rollingEnabled: true },                    // browser: existing prefs param; obsidian: entry.pref-style set+restore
  seed: 7,                                            // optional: Math.random seeded (dice)
  dpr: 2,                                             // budget fallback 2 -> 1 like PNGs (GIF budget ~1 MB)
  frame: 'element',                                   // 'element' (union of element root + any .dse-modal, + PAD) | 'leaf'
  cursor: true,                                       // synthetic pointer overlay (default true)
  steps: [ … ],
}
```

### Step vocabulary

Each step is *action → settle → capture*. Every step captures one frame unless it says `capture: false`.

| step | meaning |
|---|---|
| `{ hold }` (no action) | Capture the current state, typically the resting first frame or the last frame. |
| `{ click: sel }` | Move the synthetic cursor to the centre of `sel`, then send a **real** pointer click. Browser: `locator.click()`. Obsidian: CDP `Input.dispatchMouseEvent` press and release. This replaces the camera's current `el.click()`, which fires no pointer, hover or focus events. |
| `{ type: text, into?: sel, select?: true, every?: n }` | Focus `into`, select-all when `select`, insert the text with real key events, and capture every `n` characters (a typing animation). |
| `{ press: 'Enter' }` | Real key event. |
| `{ hover: sel }` | Move both cursors only, for hover-revealed UI. |
| `{ waitFor: sel }` | Wait until a selector exists, e.g. a modal's `.dse-modal__body` after a click. |
| `write: true` (modifier on any action) | **Wait for the block write**, then settle. Obsidian: poll `app.vault.adapter.read(note)` until the text changes (measured 454–615 ms after the action, roughly `PERSIST_DEBOUNCE_MS` = 400), then wait 500 ms for the re-render and adoption. Browser: wait for a `window.__dseHarnessWrites` counter that `makeHarnessHost.replaceSource` increments (one harness-only line). A `write: true` step that produces no write within 5 s **fails the entry**: either the script is wrong or the product is. |
| `hold: ms` | How long this frame stays on screen. It becomes the GIF frame delay; there are never duplicate frames. Consecutive identical frames are merged and their delays added (implemented in the spike encoder). |
| `capture: false` | Act without capturing. |

**Selector convention:** a step selector is resolved **inside the element root** (`[data-dse-element="<id>"]` in the active leaf for Obsidian, `#mount` for the browser), so it can never hit a second copy. The prefix `modal:` resolves inside `.dse-modal`, which Obsidian appends to `body`. Use DSE classes plus `aria-label`, which tests and the lifecycle gate already treat as contract. Never use positional `:nth-child` for content. The names below were measured from the DOM:
- **Initiative:** `.dse-init__title-text`, `textarea` (the title editor), `button.dse-init__portrait-toggle[aria-label="Toggle turn taken: <name>"]`, `button.dse-stepper__btn[aria-label="Increase Malice"]`, `input.dse-init__malice-quickadd-amount`, `input.dse-init__malice-quickadd-label`, `button.dse-init__malice-quickadd-btn`, `button.dse-init__round-advance`, `.dse-cond--add`, `.dse-init__stamina`, `.dse-init__cell[data-instance-key]`.
  - Note: `.dse-init__turn` (the icon twin) is **not visible**, so a click on it fails. Use `portrait-toggle`.
- **Negotiation:** `.dse-track__slot[aria-label="Patience N"]`, `.dse-tabs__tab`, `button.dse-nt__chip[data-kind=motivation|pitfall|spent]`, `button.dse-pr__row[data-tier=low|mid|high|crit]`, `button[aria-label="Complete Argument"]`.
- **Counter:** `button.dse-stepper__btn[aria-label="Increase <name>"]`, `input.dse-counter__value`.
- **Stamina:** `.dse-stamina--clickable`, `.dse-stamina-rec__pips`, `button[aria-label="Catch Breath"]`.
- **Montage:** `button.dse-mt__quick[data-kind=success|failure|assist]`, `.dse-mt__actionrow button[aria-label="Log an action…"]`, `button[aria-label="End round N"]`, `.dse-mt__cell[data-hero][data-round]`.
- **Feature:** `button.dse-roll-btn`.

### Where it lives

- `visual-harness/docs-gif.mjs` (new): manifest validation for `kind: 'gif'`, plus `runGifSteps(driver, entry)`, which drives the step list over a small driver interface (`click`, `type`, `press`, `hover`, `waitFor`, `waitWrite`, `rectOf`, `screenshotPng`, `prepareFrame`). There are two drivers:
  - a Playwright-page driver, used by `docs-shots.mjs`'s browser half;
  - a CDP driver, used by `obsidian-camera.mjs --docs` as a new `kind === 'gif'` branch in step 3h. It reuses the existing `openNote`, `setPluginTheme`, `setChromeBg('dark')` (`:1677`), `clearNotices`, `closeModals` and `docsNoteName`.
- `visual-harness/gif-encode.mjs` (new): `encodeGif(pngBuffers, holds, crop) → Uint8Array`. It is shared by both halves, deterministic, and pure JS.
- Frames are written to `visual-harness/dist/docs-gif-frames/<out>/NN.png` (gitignored `dist/`) for review. They never go to `docs/Media` or `shots/`.
- **Shared with the PNG path:**
  - the manifest and its `body`/`note`/`canvas` note mechanism (`docsNoteName` already strips any extension: `/\.[a-z]+$/i`);
  - compendium seeding, the Xvfb lifecycle, the dark chrome and steel theme, the docs-mode experimental-OFF seeding (`camera-data-json.cjs`);
  - the deferred guard, which already covers `source: 'browser'` gif entries because it keys on `source` + `element`;
  - the byte budget idea: 2x unless over budget, then 1x.
- **Harness additions (none moves a shot, because defaults are unchanged and shots never pass the new parameters):**
  - `entry.ts` gains `experimental=0` (→ `setExperimental(false)`, removes the deferred chrome) and the `__dseHarnessWrites` counter;
  - optionally a `seed=` parameter. Alternatively, `page.addInitScript` from the runner, which keeps product code untouched; I recommend the runner-side approach.

### Concrete sample: initiative (the spike's exact script)

```js
{
  out: 'initiative-tracker.gif', kind: 'gif', source: 'browser',
  element: 'initiative', fixture: 'default', dpr: 2, cursor: true,
  steps: [
    { hold: 1500 },                                                      // resting
    { click: '.dse-init__title-text', hold: 500 },                       // editor opens
    { type: 'Ambush at the Ford', into: 'textarea', select: true, every: 5, hold: 160 },
    { press: 'Enter', write: true, hold: 900 },                          // title committed
    { click: 'button.dse-init__portrait-toggle[aria-label="Toggle turn taken: Frodo Baggins"]', write: true, hold: 900 },
    { click: 'button.dse-init__portrait-toggle[aria-label="Toggle turn taken: Samwise Gamgee"]', write: true, hold: 900 },
    { click: 'button.dse-stepper__btn[aria-label="Increase Malice"]', write: true, hold: 500 },
    { click: 'button.dse-stepper__btn[aria-label="Increase Malice"]', write: true, hold: 900 },
    { click: 'input.dse-init__malice-quickadd-amount', hold: 300 },
    { type: '3', into: 'input.dse-init__malice-quickadd-amount', hold: 400 },
    { click: 'input.dse-init__malice-quickadd-label', hold: 200 },
    { type: 'Villain action', into: 'input.dse-init__malice-quickadd-label', every: 5, hold: 160 },
    { click: 'button.dse-init__malice-quickadd-btn', write: true, hold: 1200 },   // Amount row added (Malice 7 → 10)
    { click: 'button.dse-init__round-advance', write: true, hold: 2000 },          // Round 2, turns reset
  ],
}
```

The spike result was 19 frames and an 11.3 s loop. The contact sheet is `r1-spike/run1/gif-contact.png`.

## C. Determinism

Hazards, what neutralises each one, and the evidence (all measured on this machine):

| hazard | browser | Obsidian |
|---|---|---|
| **Raster noise** (1–8 px, Δ1–2 on antialiased edges after interaction repaints) | **`chromium.launch({ args: ['--disable-partial-raster'] })`.** Without it: 5/6 runs identical, `run4` frame 17 differed at 1 px Δ1. With pointer parking: frames 9, 13 and 18 differed at 2–5 px Δ≤2. Injecting transition-kill CSS did *not* fix it (`kill2`/`kill3` differ). With the flag: **8/8 identical (`pr1–8`), and 5/5 with parking (`prp1–5`).** | Same flag passed to Electron: **no effect** (`obsp1–3`: 2/3 differ). |
| CSS transitions/animations (focus ring, hover) | Playwright `screenshot({ animations: 'disabled' })`. With `animations: 'allow'`, `anim1` vs `anim2` differed at frame 18. | **Inject freeze CSS** `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}`. Without it: `obs1–3` 1/3 differ (frame 1, 8 px Δ1 on the focused title textarea ring). With it: **`obsk1–5` 5/5 identical.** |
| Caret blink | Playwright `caret: 'hide'` (default) | the freeze CSS (`caret-color: transparent`); the PNG modal path blurs instead (`obsidian-camera.mjs` ~1984) |
| Hover/focus state | Deterministic given identical pointer positions. The synthetic cursor is DOM, so its position is deterministic. **Park the real pointer** outside the element before each capture, so the chrome is never hover-revealed and hover is not timing-dependent. Requires the raster flag (measured above). | Same parking, plus **remove `.tooltip`**: Obsidian's aria-label tooltips ("Advance round", "Add Malice log entry") appeared in spike frames 8–9, and their appearance is timer-driven. |
| Font loading | `await document.fonts.ready` after mount | existing 600 ms settle and the theme wait |
| Notices / toasts | remove `.notice` before every capture (both cameras) | existing `clearNotices` |
| Dice / `Math.random` (feature rolling) | `page.addInitScript` seeded PRNG (`entry.seed`) | `Runtime.evaluate` to override `Math.random` with the same PRNG before the first step. `NATIVE_DICE` (`src/framework/roll/service.ts:32`) is the only randomness found. No `Date.now`, `Math.random` or uuid in the initiative, negotiation, montage, counter or stamina views, the kit, or `view.ts`. The malice log stores `{round, amount, label}` and no timestamp. |
| Write timing | `write: true` waits on the counter, never on a sleep | `write: true` polls the note text, then settles |
| Window/viewport size | fixed context viewport, crop = union of per-frame element and modal rects + PAD | existing udd geometry seed (1440x1100) on a 1600x1200 Xvfb; one fixed clip for every frame |
| Obsidian self-update | n/a | The asar updates to the latest release on warm-up, so bytes can drift *across Obsidian releases*. The same is already true of the PNGs. Stability is defined per environment. |
| Encoder | gifenc has no randomness: identical frames gave identical GIF sha in all 13 identical-frame runs (`020ef16a…` ×5, `06aa3353…` ×8, `8a589ffa…` ×5) | same |

**Stability check, concretely:** `npm run docs-shots -- --only=<x>.gif --check-stable` captures the entry twice in one process. It asserts (a) the same frame count and (b) a **byte-identical sha256 of every raw PNG frame**. On a mismatch it prints the frame indices, the differing pixel count and the max channel delta, then exits 1. Because the GIF is a pure function of the frames, (b) implies an identical GIF.

Measured cost of the check is about 1x the capture time per GIF: browser about 6 s, Obsidian about 10 s once spawned. Strict identity is justified by the data above. A fallback tolerance, if real Obsidian ever proves flaky over time, would be "≤ 0.01 % of pixels, max Δ ≤ 2". That is the worst noise observed, and it never survived as a visible change.

**Existing Obsidian docs PNGs (control):** `minion-stamina-pool-modal.png` (pre-click + write + modal), `initiative-tracker-add-conditions.png` and `montage-sheet-modal.png` were each regenerated 2x on a private Xvfb `:131` / CDP 9311 / scratch udd. All six outputs were **byte-identical to the committed files** (`8a28344f…`, `8b410b97…`, `8d032686…`), at 16–22 s per run including spawn.

## D. Encoder decision (spike)

Spike: browser harness, `initiative/default`, steel/dark, 1x, viewport 1000x1400, crop 784x826, 19 captured frames, 11.32 s loop. Capture took 5.3–6.3 s including launch.

| candidate | bytes | encode | frames | 2-run byte-identical | fidelity vs source (mean abs err /255, worst pixel) | qualifies? |
|---|---|---|---|---|---|---|
| **gifenc 1.0.3 + pngjs 7.0.0, global palette + transparent-diff** | **216,430** (1x) / 620,615 (2x, 1568x1651) | 0.40–0.54 s (1x) / 1.52 s (2x); PNG decode+crop 0.9–1.4 s / 3.6 s | 19 | **yes** (sha `06aa3353d0f3dcb9…` ×8) | 1.51 avg, worst Δ11: a mid-green stamina-bar pixel came out slightly darker green | **yes**: npm devDeps, `npm ci` installs them |
| gifenc, naive per-frame local palette | 1,190,940 | 0.36–0.40 s | 19 | yes | 1.62, worst Δ9 | over budget; rejected |
| ffmpeg 8.1.2 palettegen(stats_mode=diff) + paletteuse(dither=none, diff_mode=rectangle) | 239,957 | 0.29 s | 20 (adds a trailing concat frame) | yes (`4917cc45…` ×2) | 0.17 avg, **worst Δ51**: a reddish-brown edge pixel of the **red** Malice digit became **neutral grey** | **no**: linuxbrew only. It would have to go in a devbox.json. The *plugin's* devbox.json is the natural home, since that is where xvfb lives and where docs-shots resolves binaries, not the workspace one. It is a large nix closure for no visible gain. |
| ffmpeg, bayer dither | 258,141 | 0.26 s | 20 | — | 0.61 | as above |
| Playwright's bundled ffmpeg (`~/.cache/ms-playwright/ffmpeg-1011`) | — | — | — | — | — | **no**: encoders are `png`, `libvpx`, `mjpeg` only, with no gif muxer and no palettegen (measured with `-encoders`/`-filters`) |
| already in node_modules | — | — | — | — | — | No GIF encoder exists. `fflate` is deflate only. `playwright-core/lib/utilsBundle` exports a pngjs `PNG`, but it is an internal bundle under a caret-ranged dependency. Not a contract. |
| sharp 0.35.5 | not tried | | | | | Apache-2.0, native libvips, much heavier, awkward for animation. Rejected on weight. |

**Visual palette check** (looked at `r1-spike/run1/gif-frames/g18.png` and `r1-spike/palette-zoom-f13-src-gifenc-ffmpeg.png`, a 2x zoom with source, gifenc and ffmpeg side by side). I saw no colour artefact in the gifenc output:
- the **green** stamina bars keep their two-tone gradient and the thin **amber/orange** threshold tick;
- the **red** Malice number stays red;
- the **teal/cyan** focus ring on the label input is crisp;
- the dark diagonal hatching on "acted" hero rows survives;
- there is no banding in the dark slate card backgrounds and no dither speckle.

ffmpeg's output is equally clean at normal zoom. Its one bad pixel is the red-to-grey edge described above.

**Real Obsidian frames, same encoder:** 10 frames at 1044x879 encode to 195,833 B in 0.32 s.

**Recommendation:** `"gifenc": "1.0.3"` (MIT, Matt DesLauriers, 0 deps, last published 2022, README carries an "experimental" badge, ~200 lines of LZW + PnnQuant, vendorable if it ever rots) and `"pngjs": "7.0.0"` (MIT, 0 deps). Exact pins, matching the repo's `esbuild 0.25.9` style.

Two encoder rules:
- Encode with one global palette of 255 colours plus a reserved transparent index, and dispose=1.
- **Sample** pixels for the palette (e.g. every 4th pixel across all frames) instead of concatenating whole frames. The 2x spike concatenation peaked at **607 MB RSS**.

## E. Docs / gate facts

**References to the two GIFs, all of which must change when they become generated:**
- `docs/initiative-tracker.md:7`: `![initiative-tracker](Media/initiative-tracker.gif)`. This is the only doc reference to either GIF.
- `negotiation.gif`: no doc reference at all. Ticket item 4 means `docs/negotiation-tracker.md` gains it, probably replacing or joining the line-11 PNG.
- `README.md` has no GIF today; ticket item 4 adds initiative. `README.md:158-159` reads "The two animated GIFs are the only images a human still has to record by hand"; rewrite it.
- `visual-harness/docs-manifest.mjs:442-452` `DOCS_MANUAL` lists both GIFs; they become `DOCS_SHOTS` entries and `DOCS_MANUAL` shrinks to `favicon.ico`.
- `visual-harness/README.md:290-291` ("the two animated GIFs").
- `CHANGELOG.md:544` is history; leave it and add an `## Unreleased` bullet instead.
- `docs/superpowers/dse-7.0.0-release-audit.md:57` (Negotiation row: "Open: SC-388 (re-record negotiation.gif)") and `:331` ("(SC-388 negotiation.gif is hand-recorded)"). These are the SC-388 hand-record notes the acceptance says to replace with SC-411.

**Theme:** steel-dark is already the default.
- Browser half: `docs-shots.mjs:99` sets `{ theme: 'steel', bg: shot.bg ?? 'dark' }`.
- Obsidian half: `obsidian-camera.mjs:1677` runs `setChromeBg('dark')` before every docs capture and calls `setPluginTheme(elSel, 'steel')` per entry.
- There is no theme axis since SC-144.

**`docs-shots` and `visual-harness/shots/`:**
- The success path writes only to `docs/Media`: `outDir` (`docs-shots.mjs:45`) and `--out` (`obsidian-camera.mjs:1592`).
- **Exception:** on a failed docs entry, `errorShot` writes `visual-harness/shots/docs-<out>--ERROR.png` (`obsidian-camera.mjs:752` uses `shotsDir`, called at `:2037`), and a blocked plugin writes `shots/CAMERA-BLOCKED.png` (`:702`). The gates are not moved: freeze checks only listed names, and these are new untracked names. Still, "never writes to shots/" is not literally true.
- `:2037`'s `.replace(/\.png$/, '')` would name a gif failure `docs-initiative-tracker.gif--ERROR.png`; cosmetic. Suggest routing docs error shots to `visual-harness/dist/docs-errors/`.

**Jest:**
- No test enumerates `docs/Media` or validates manifest entries.
- `test/unit/build/docsDeferredGuard.test.ts` is the only manifest-adjacent test. It needs **no change** if gif entries keep `source` + `element`, because the guard applies to them as-is. Add one assertion that a `kind: 'gif', source: 'browser'` entry for a deferred element is refused.
- If the guard is extended to `source: 'obsidian'` gif entries (it currently skips them, since that half runs with the switch OFF and would show the placeholder), its "allows obsidian entries" assertion (line ~25) changes.
- New tests worth adding:
  - `gif-encode` determinism: 3 synthetic frames give a fixed sha, and identical frames merge;
  - gif-entry validation: unknown step key, `write` on a non-action, an unknown `modal:` target.

## F. Per-element scripts (proposed) and runtime

| GIF (docs page) | camera | script, in order | ~frames | ~size |
|---|---|---|---|---|
| `initiative-tracker.gif` (initiative-tracker.md:7 + README) | browser | as in B | 19 | 216 kB @1x / 621 kB @2x (measured) |
| `negotiation.gif` (negotiation-tracker.md) | browser | resting → Appeal to Higher Authority chip (tiers recompute) → select tier row `mid` → Complete Argument (`write`; Patience/Interest seals move) → click Patience seal 2 (`write`) → Mark spent on Peace (`write`) → "Learn Motivation/Pitfall" tab → back to "Make an Argument" | 9–12 | ~200–350 kB @1x (card is ~1.3x the initiative height) |
| `counter.gif` (counter.md) | browser | resting → Increase ×3 (`write` each) → Decrease ×1 → click value, select, type `25`, Enter (`write`) | 7–8 | ~30–60 kB |
| `feature-roll.gif` (Features.md, "Rolling") | browser, `prefs: { rollingEnabled: true }`, `seed` | resting (roll button visible) → click `button.dse-roll-btn` (result bar, tier row lit) → roll again (second seeded result, different tier) → click a tier row (the documented "clicking a tier row rolls it") | 4–5 | ~150–300 kB (tall card) |
| `stamina-bar.gif` (stamina-bar.md) | **Obsidian**, `note: 'stamina-bar'` (recoveries fixture) or `body` | resting → click `.dse-stamina--clickable` → `waitFor: 'modal:.dse-modal__body'` → type 7 in Apply → Damage (`write`) → close → spend a recovery pip (`write`) → Catch Breath (`write`) | 9–11 | ~150–250 kB |
| `montage.gif` (gm-trackers.md) | **Obsidian**, `body: MONTAGE_MID` | resting → quick-log success for Kira in round 3 (`write`) → "Log an action…" → sheet → choose Bram / Failure / skill → Log (`write`) → board updated → End round 3 (`write`) | 10–12 | ~250–400 kB |
| *(optional)* `initiative-tracker-conditions.gif` (initiative-tracker.md:414, running-an-encounter.md:70) | **Obsidian**, `body: INITIATIVE_WITH_SQUAD` | Add Condition on Frodo → ConditionsModal → "Add condition" → type "Ble" → pick Bleeding (`write`) → close → condition icon on the row | 7–8 | ~150 kB |
| encounter, party, surges, `ds-roll`, `ds-conditions` | — | **deferred: no GIF in 7.0.0** (re-enable when un-deferred; the guard enforces this) | — | — |

**Runtime:**
- **Browser:** about 0.3 s per frame captured (about 0.75 s on `write` steps, because of the 400 ms debounce), plus 1.5 s per entry for load. Decode and encode add about 0.1 s per frame at 1x, about 0.27 s at 2x. The 4 browser GIFs (~40–45 frames) come to **about 35–50 s**.
- **Obsidian:** inside the docs camera's existing single session, about 1.2 s per `write` frame (0.45–0.62 s measured write latency + 0.5 s settle + capture) and about 0.4 s otherwise. The 2–3 Obsidian GIFs (~30 frames) come to **about 30–45 s**, plus encode.
- **Total** adds about **1.5–2 min** to today's ~4 min `docs-shots`. Each `--check-stable` run doubles the cost for that entry.

## G. Risks / open questions (ranked)

1. **Scope conflict with SC-407 (needs Scott).** Five of the ticket's minimum items are deferred in 7.0.0: encounter and the sidebar, party, surges, `ds-roll`, and `ds-conditions`. Publishing them contradicts "docs describe only the shipped set". Proposal:
   - "conditions" means initiative's ConditionsModal;
   - "power roll" means feature-card rolling;
   - encounter, party and surges are parked (Backlog ticket: "add GIFs when un-deferred, 7.1.0").
   Also ask whether a second initiative GIF (conditions) is in scope.
2. **The browser camera publishes deferred UI on hover** ("Pin to sidebar" chrome, `pipeline.ts:735`). It needs the harness `experimental=0` parameter, pointer parking, or both. Recommendation: both.
3. **Acceptance says "fresh clone + devbox".** The plugin's devbox.json supplies Xvfb but **no node**. From the plugin dir this machine gets nvm node v20.11.1, below `engines >=22.15`, and the camera needs the global `WebSocket`. Node only comes from the *workspace* devbox. Add `nodejs@24` (or `@22`) to the plugin's devbox.json, or state the workspace devbox as the entry point. With the gifenc choice, no new system binary is needed.
4. **Determinism depends on two run-only knobs** (browser `--disable-partial-raster`, Obsidian freeze CSS). Without them, roughly 1 in 3–6 runs differs by 1–8 pixels. Both are runner-side and touch no product code. Pin them with the `--check-stable` mode and a unit test on the launch args.
5. **Dice randomness** in the feature-roll GIF needs a seeded `Math.random`. In Obsidian the override is app-wide, which is fine for a scratch instance.
6. **Obsidian tooltips and hover chrome** in Obsidian frames: remove `.tooltip` and park the pointer before each capture (observed in spike frames 8–9).
7. **Encode memory at 2x** reached 607 MB peak with whole-frame palette concatenation. Sample the pixels instead.
8. **Obsidian self-update** moves Obsidian-camera GIF bytes across Obsidian releases, as it already does for the PNGs. Not a run-to-run flake.
9. **Global palette across a modal GIF.** The dimmed backdrop adds colours. If the worst-pixel error grows, add a per-entry `palette: 'local'` escape hatch, measured per GIF in r2.
10. **The synthetic cursor is a design choice.** The old GIFs showed a real pointer; headless captures paint none. Scott may prefer it off. One flag controls it.
11. Minor: docs error shots land in `visual-harness/shots/` (E). `.dse-init__turn` is not the visible acted control; use `portrait-toggle`.
12. Brief footgun for future workers: `devbox run -- bash -c 'cd X && …'` resolves the devbox *project* from the caller's cwd. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs -- bash -c '…'` to get node 24.

## Evidence index (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/r1-spike/`)

- `scripts/spike-capture.mjs`: browser capture (flags `--dpr --cursor --park --anim --killcss --detflags`).
- `scripts/spike-encode.mjs`: gifenc encoders.
- `scripts/obs-spike.mjs` + `scripts/obs-spike.sh`: real Obsidian on Xvfb :131, CDP 9311.
- `scripts/obs-run.sh`: docs-shots `--only` control.
- `scripts/explore.mjs`: DOM control dump.
- `pr1/gifenc-global-diff.gif`: **recommended-config spike GIF** (216,430 B, sha256 `06aa3353d0f3dcb969f3fa40e43400ed5960190a8455c045695aa04d5b7c8291`).
- `pr1/ffmpeg-pal-nodither.gif` (`4917cc45…`), `pr1/ffmpeg-pal-bayer.gif` (`cf66f598…`).
- `dpr2/gifenc-global-diff.gif` (620,615 B, `9dc69241…`).
- `obsk1-enc/gifenc-global-diff.gif`: real-Obsidian frames (195,833 B, `f33ca94f…`).
- `run1/gif-contact.png`, `run1/gif-frames/g18.png`, `obs1/contact.png`, `palette-zoom-f13-src-gifenc-ffmpeg.png`: frames looked at.
- `nondet-*.png`: zoomed diffs of the flaky frames.
- `*/frames.json` + `*/encode.json`: per-run frame sha256s and sizes for every run. Frame PNGs were kept for run1, run4, pr1, park1, park2, obs1, obs3, obsk1.
- `old-gif/*-contact.png`: contact sheets of the two hand-recorded GIFs.
- `obsidian/*.png|log`: docs-shots control runs.

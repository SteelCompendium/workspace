# F4 — Visual Feedback Harness ("let Claude see the rendered plugin")

**Linear:** SC-9 · **Status:** spec approved (Scott, 2026-07-10) · **Repo:** `draw-steel-elements`
(branch `dse-framework`) · **Author:** brainstormed with Scott 2026-07-10

## Goal

A repeatable, scriptable way to render each DSE element exactly as the plugin renders it and
capture PNG screenshots per **element × theme × background**, so Claude (and Scott) can *see*
the plugin's output without opening Obsidian. This is the force multiplier for SC-10 (the
"High Fantasy Steel" visual overhaul) and for pre-release visual QA.

**v1 scope (decided):** static-per-element snapshots only. No modals, no hover/focus states,
no interaction scripting, no CI visual-regression gates. Those are natural follow-ups on the
same page, not part of v1.

**Fidelity bar (decided):** *close-enough*, not pixel-identical. The harness vendors
Obsidian's **default-theme** CSS variables (dark + light) as the backdrop; final "Legacy looks
unchanged" sign-off remains Scott's eyes in real Obsidian. Automating actual
Obsidian/Electron was considered and rejected (heavy, fragile, slow; pixel truth isn't needed
for design iteration).

## Why the browser approach works (verified 2026-07-10)

- The `obsidian` npm package is **types-only at runtime**; all 976 jest tests already mount
  every element through the **real `ElementPipeline`** in jsdom against the 511-line mock
  `test/mocks/obsidian.ts`.
- `main.ts` exports `registerFrameworkElementDefinitions(registry)` — the single source of
  truth for the 11 migrated elements — and tests already import it from `main` under the
  mock. The harness reuses it, so the element list can never drift from the plugin.
- esbuild already bundles with `obsidian` external; a second tiny esbuild target aliasing
  `obsidian` → a browser shim produces a fully static page.
- The styles are one plain `styles.css`; themes are attribute-driven
  (`data-dse-theme="steel"`, `data-dse-print`), so the whole theme matrix is reachable by
  stamping attributes.

## Architecture

All new code lives in **`visual-harness/`** at the `draw-steel-elements` repo root (named to
avoid colliding with F3's *test*-harness vocabulary), on the **`dse-framework`** branch in
the existing worktree. Dev-only; nothing ships in the plugin bundle.

```
visual-harness/
  shim/obsidian.ts     # browser-grade obsidian shim (jest-free)
  vars.css             # vendored Obsidian default-theme variables (.theme-dark/.theme-light)
  entry.ts             # mounts one element (or the gallery) per URL params
  index.html           # static page: vars.css + styles.css + harness bundle
  fixtures/<element>/  # curated source blocks, default.md (+ optional named extras)
  shoot.mjs            # Playwright camera: sweep matrix -> shots/*.png
  shoot-url.mjs        # bonus: screenshot any URL (live v2 site / SC-67)
  esbuild.mjs          # harness build config (alias obsidian -> shim, .md-as-text loader)
  shots/               # output PNGs (git-ignored)
  dist/                # built page bundle (git-ignored)
```

### 1. Jest-free obsidian shim

`test/mocks/obsidian.ts` calls `jest.fn()` at module top level, so it cannot ship to a
browser. Refactor:

- Extract the jest-free core (all classes/functions except the `jest.fn` wrappers for
  `request`/`requestUrl`) into **`test/mocks/obsidian-core.ts`**.
- `test/mocks/obsidian.ts` re-exports the core and re-adds the jest wrappers.
  **`moduleNameMapper` and all existing tests are unchanged** — the existing 976-test suite
  is the regression gate for this refactor.
- `visual-harness/shim/obsidian.ts` re-exports the core and overrides for visuals:
  - `setIcon` → real **Lucide** SVGs (`lucide` npm package — the same icon set Obsidian
    uses), falling back to the `data-icon` stamp for unknown ids.
  - `MarkdownRenderer.render` → a small real renderer (**`marked`**), so prose inside
    elements looks like prose instead of raw markdown.
  - `Notice` → a floating toast div (visible if an element fires one during mount).
  - `request`/`requestUrl` → plain async stubs returning empty results (no `jest`).

### 2. Vendored theme variables — `vars.css`

Hand-vendored values for Obsidian's **default theme**, scoped `.theme-dark` / `.theme-light`
(the same body classes Obsidian uses), covering the ~30 non-`--dse-*` variables
`styles-source.css` consumes (`--text-normal`, `--background-primary`,
`--background-modifier-border`, `--radius-s`, `--size-*`, `--font-*`, `--tag-*`,
`--color-base-*`, `--interactive-accent`, `--icon-color`, …) plus Obsidian's default font
stack and base text sizing. A comment header records the vendoring source + date. Kept
deliberately small: **only what the styles actually reference** (re-grep at build time is a
follow-up, not v1).

### 3. Entry + page — `entry.ts`, `index.html`

- Builds the registry via `registerFrameworkElementDefinitions` (imported from `main`) and
  the **real seams**, mirroring the test convention: `createThemeService`,
  `createPreferenceStore` (in-memory storage), `createReferenceService`,
  `createValidationService`, `createSessionStore`, real `ElementPipeline`.
- Host: a static `BlockHost` per mount — `mode: "reading"`, `canPersist: true`,
  `replaceSource` = async no-op returning `true` (elements render their normal editable
  look; nothing actually persists). `&readonly=1` flips `canPersist: false` +
  `sourcePath: ""` to show the read-only affordance.
- URL params: `?element=<id>&fixture=<name>&theme=legacy|steel&bg=dark|light&print=1`
  `&readonly=1`, or `?gallery=1&theme=…&bg=…` for the all-elements contact sheet (each
  element in a labeled section, `default` fixture).
- Theme application goes through the real `ThemeService` (`setActive('steel')`), print via
  the `data-dse-print` attribute — the same code paths the plugin uses, not hand-stamped CSS.
- Fixtures are **bundled into the page** by esbuild's text loader (`.md` imports), so the
  page runs from `file://` — no server, no ports, deterministic.
- Animations disabled via a tiny CSS override (`*{transition:none!important;
  animation:none!important}`) for deterministic shots.

### 4. Fixtures

One `default.md` per element (11 total), harvested from the test SAMPLEs and README
examples — **realistic content** (a real statblock, a mid-encounter initiative block, a
feature with a power roll), not lorem. Optional extra named fixtures where one block can't
show the element's range (e.g. `feature/with-cost.md`). Fixture files are the raw code-block
*body* (no fence); the entry supplies the language/alias.

### 5. Camera — `shoot.mjs`

Playwright (Chromium, dev dependency) drives the built page:

- **Default sweep:** every element × `{legacy, steel}` × `{dark, light}` + `steel`-print →
  `shots/<element>--<theme>-<bg>.png` (print: `shots/<element>--steel-print.png`), plus
  per-combo contact sheets `shots/gallery--<theme>-<bg>.png`. Deterministic names so
  before/after diffing is trivial.
- Narrowing flags: `--element=<id>` `--theme=…` `--bg=…` `--fixture=…` `--readonly`.
- Fixed viewport (900 px wide, deviceScaleFactor 2 for crisp PNGs); waits for fonts +
  network idle; screenshots clip to the element's bounding box (gallery: full page).
- **Error handling:** after each mount the script checks for `.dse-error-card` (the
  pipeline's failure render) and a page-error listener; any hit → the shot is still saved
  (suffixed `--ERROR`) and the run **exits nonzero naming the element/fixture**, so a broken
  fixture can't silently produce a healthy-looking sweep.

### 6. npm scripts + invocation

```
npm run shots         # build harness (esbuild) + full sweep
npm run shots -- --element=statblock --theme=steel   # narrowed
npm run shot-url -- https://steelcompendium.io/v2/ shots/v2-home.png   # bonus (SC-67)
```

Run via the workspace devbox (node is not on PATH):
`devbox run -- bash -c "cd <worktree>/draw-steel-elements && npm run shots"`.
One-time setup: `npx playwright install chromium` (+ `--with-deps` if system libs are
missing on this Linux box).

## Dependencies added (all dev-only)

`playwright`, `lucide`, `marked`. No runtime/plugin-bundle impact; `manifest.json` untouched.

## Testing

- The `obsidian-core.ts` extraction is gated by the **existing 976-test suite** (unchanged
  `moduleNameMapper` → any behavioral drift fails immediately).
- The harness's own gate is **`npm run shots` green**: it exercises build + mount of all 11
  elements through the real pipeline and fails loudly on any error card. (This effectively
  smoke-tests the plugin's whole render path outside jest — a bonus stability check for the
  6.0.0 "existing features stable" gate.)
- No jest tests for the harness page itself in v1 (it's tooling; the camera run is the test).

## Consumption contract (for agents)

After `npm run shots`, Read PNGs from `visual-harness/shots/`:
`<element>--<theme>-<bg>.png` for singles, `gallery--<theme>-<bg>.png` for overviews.
Re-run narrowed after a CSS change; diff by filename. If the run exits nonzero, an element
failed to mount — fix before trusting any shot.

## Out of scope for v1 (follow-ups)

- Modals, hover/focus/interaction states (Playwright can script these on the same page).
- Visual-regression assertions in CI (pixel-diff gates).
- Community-theme backdrops (only the default theme is vendored).
- Auto-regenerating `vars.css` from a grep of `styles-source.css`.

## Success criteria

1. One devbox command produces fresh PNGs of **all 11 elements** in legacy/steel ×
   dark/light (+ steel print) with no error cards.
2. Claude can Read the PNGs and give concrete, correct visual feedback (verified by Scott
   spot-checking a few shots against real Obsidian).
3. The existing test suite still passes 100% after the mock-core extraction; `tsc --noEmit`
   stays at 0.

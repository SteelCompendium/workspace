# F5 — Real-Obsidian CDP Camera (ground-truth screenshots)

**Status:** spec draft (2026-07-10, awaiting Scott's review) · **Repo:** `draw-steel-elements`
(branch `dse-framework`) · **Depends on:** F4 (built — Plan 11) · **Linear:** SC-9 follow-on
(the "real Obsidian" half); serves SC-10 sign-off and SC-11's "Legacy looks unchanged" gate.

## Goal

Pixel-true screenshots of DSE elements rendered by **actual Obsidian** — the plugin loaded in
a real vault, Obsidian's real CSS/renderer/fonts — driven headlessly enough that an agent can
run one command and Read the PNGs. This is the ground-truth layer above F4's fast browser
harness: F4 for iteration, F5 for truth (Steel sign-off, Legacy-unchanged verification,
vendored-vars drift checks — e.g. re-verifying the two Steel findings F4 logged).

**Decisions locked with Scott (2026-07-10):**
- **Second Obsidian instance**, spawned by the camera with its own `--user-data-dir` — no
  changes to Scott's daily Obsidian launch. A window appears on the desktop (display `:1`)
  during a run; that's accepted.
- **The existing demo vault moves into the repo** (`draw-steel-elements/demo-vault/`),
  git-managed. The plugin reaches the vault via a **committed relative symlink**
  `demo-vault/.obsidian/plugins/draw-steel-elements -> ../../..` (the repo root already holds
  `manifest.json`; `main.js`/`styles.css` are build outputs the camera builds first).

## Vault migration (one-time task)

Copy `/home/scott/Documents/draw-steel-elements-demo/` → `demo-vault/` in the repo, with:

- **Committed:** the hand-made test notes (`Test Statblock.md`, `Test Negotiation.md`,
  `test ability.md`, `Welcome.md`, `Untitled.canvas`), the images (`token_1.png`,
  `rogue.png`, `steelcompendium.png`), and `.obsidian/` config
  (`app.json`, `appearance.json`, `community-plugins.json`, `core-plugins.json`,
  `core-plugins-migration.json`, `graph.json`).
- **NOT committed (gitignored):** `DS Compendium/` (~25 MB / ~2.5k files — regenerable
  output of the plugin's CompendiumDownloader; committing generated compendium content into
  the plugin repo is wrong), `.obsidian/workspace.json` (session churn),
  `.obsidian/plugins/*` **except** the `draw-steel-elements` symlink (BRAT/advanced-canvas
  are third-party installs; `community-plugins.json` may keep listing them — Obsidian
  silently skips absent plugins).
- The `draw-steel-elements` plugin folder (a stale built copy) is **replaced by the
  symlink**.
- The original vault in `~/Documents` is left untouched by the camera work; once this lands,
  Scott switches his Obsidian to the repo copy and deletes/archives the original (his call —
  the camera never touches the old path).

## Architecture

New pieces in `visual-harness/` (naming keeps the F4 contract):

```
visual-harness/
  obsidian-camera.mjs   # the F5 camera: build → notes → launch → CDP attach → shots
  notes-gen.mjs         # FIXTURES → demo-vault/Harness/<element>.md (generated, gitignored)
demo-vault/             # the migrated vault (see above)
```

1. **Build:** run the plugin build (`npm run build-no-check`) so `main.js`/`styles.css` at
   the repo root are current — the vault sees them through the symlink.
2. **Note generation:** `notes-gen.mjs` imports the F4 `FIXTURES` (single source of truth)
   and writes one note per element into `demo-vault/Harness/` — a heading + a fenced code
   block using the element's **primary alias** with the `default` fixture body.
   `demo-vault/Harness/` is gitignored (regenerated every run).
3. **Launch:** spawn the system Obsidian (`/usr/bin/obsidian`) with
   `--user-data-dir=<scratch>/obsidian-harness-udd --remote-debugging-port=9222` and the
   vault, on `DISPLAY=:1`. The user-data-dir is seeded (or first-run automated via CDP) so
   the vault is registered/trusted with community plugins enabled — the known first-run
   wrinkles (vault picker, Restricted Mode/trust prompt) are handled inside the camera,
   empirically; the spec requires only that a cold run reaches a loaded vault without human
   input.
4. **Attach:** Playwright `chromium.connectOverCDP('http://localhost:9222')`, find the
   workspace window, wait for `app.workspace.layoutReady` and the DSE plugin to be enabled.
5. **Shoot:** per element × theme axis: `app.workspace.openLinkText('Harness/<element>', …)`
   in **reading mode**, wait for the rendered `[data-dse-element]`, screenshot its bounding
   box → `visual-harness/shots/<element>--obsidian-<theme>-<bg>.png`. Theme axes:
   - plugin theme legacy⇄steel via the plugin's own ThemeService (evaluate through
     `app.plugins.plugins['draw-steel-elements']` or the temp command) — the same code path
     a user hits;
   - Obsidian dark/light via the app's theme API (implementation detail; whatever
     `app.changeTheme`/vault config mechanism the installed version exposes).
6. **Teardown:** quit the spawned instance (CDP or process kill), leaving Scott's own
   Obsidian untouched. Errors follow F4's contract: failed shots get `--ERROR` names, the
   run exits nonzero listing them.

## Interface

```
npm run obsidian-shots                       # full sweep: 11 elements × {legacy,steel} × {dark,light}
npm run obsidian-shots -- --element=statblock --theme=steel
```

Output naming is `<element>--obsidian-<theme>-<bg>.png` — sortable next to F4's
`<element>--<theme>-<bg>.png` so an agent can diff harness-vs-truth pairs directly.

## Out of scope for v1

- Print-mode shots (F4 covers the preview twin; real print QA stays manual Ctrl-P).
- Interactivity/modals; Scott's community themes; hot-reload watch mode (the camera builds
  per run — a Hot Reload dev loop is a nice later addition, not v1).
- CI: this camera needs a display and an Obsidian binary; it is a local tool. (xvfb-run via
  nix is a known escape hatch if we ever want it windowless — not v1.)
- Windows/macOS support (Linux-only, this box).

## Testing

- `notes-gen` gets a jest test (FIXTURES → note bodies contain the exact fixture text +
  primary alias fence).
- The camera itself is gated by its own run (F4 precedent: the sweep is the test) — plus the
  final comparison: an agent Reads an F4 PNG and an F5 PNG of the same element and confirms
  they show the same content (fidelity gaps documented, not silently absorbed).
- The vault migration is gated by Scott opening the repo vault in Obsidian once and
  confirming his demo setup still works.

## Success criteria

1. One devbox command yields real-Obsidian PNGs of all 11 elements in all four theme/bg
   combos with no human interaction after launch approval.
2. The two F4 Steel findings (invisible tier-badge labels; act-spine text clipping) are
   re-verified against ground truth — confirming they're real (or exposing them as
   harness artifacts, which itself proves F5's value).
3. Scott's daily Obsidian setup is unaffected; the demo vault works from its new repo home.

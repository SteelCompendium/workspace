# SC-112 spike ledger — `queryLocalFonts()` inside Obsidian's Electron (Task 1)

Plan: `docs/superpowers/dse-overhaul/plans/2026-08-02-plan-23-sc112-font-settings.md` Task 1.
Brief: `.superpowers/sdd/2026-08-02-plan-23-sc112-font-settings/task-1-brief.md`.
Worktree: `/home/scott/code/steelCompendium/worktrees/font-settings/draw-steel-elements`
(branch `font-settings`, dse base `ccf465e`). No product-code diff — `git status` clean in
the submodule throughout; scratch probe code lived outside the worktree
(`/tmp/claude-1000/.../scratchpad/qlf-probe.mjs`) and is not committed.

## Step 1: baseline re-verification (worktree, after `npm ci`)

| Gate | Expected | Actual |
|---|---|---|
| `npm run tsc` | clean | clean (no output) |
| `npx jest` | 2022/144 | **2022 passed / 144 suites passed**, 3 snapshots passed, exit 0 |
| `npm run shots` | regenerates | 169 shots written, no errors |
| freeze check | `freeze OK (101/101 …)` | `freeze OK (101/101 legacy+print PNGs byte-identical)` |
| `npm run parity` | 0 GAPs / 10 WARNs / exit 0 | **0 gap(s), 10 warning(s)**, exit 0 — the documented FOLLOWUPS #39/#40 set (4× featureblock margin, 6× section-head/pr-head ink+letter-spacing), unchanged composition |
| `ls visual-harness/shots/*.png \| wc -l` | 169 | **169** |

All baselines match the plan header's expected numbers exactly — no drift to record.

## Step 2: probe availability

**Method.** Adapted `visual-harness/obsidian-camera.mjs`'s spawn+CDP client (the `Cdp`
class, `jsonList`, `evaluate`, `seedUdd`, `spawnObsidian`, `killChild`) into a standalone
throwaway probe (`qlf-probe.mjs`, kept in the session scratchpad, never copied into the
worktree/repo). The probe skips the harness-note/plugin-load requirements the real camera
needs (it doesn't screenshot an element) — it just spawns a scratch-`--user-data-dir`
Obsidian instance, attaches over raw CDP to the `app://obsidian.md` page target, waits for
`layoutReady`, and runs `Runtime.evaluate` (`awaitPromise: true`, `returnByValue: true`)
with `userGesture` set per-call as CDP's evaluate params allow. Ran it three times: twice
against the bundled 2023-era app layer as installed (`/usr/bin/obsidian` → Obsidian AppImage
shell), and once after triggering the app's own self-update mechanism (downloads a newer
`obsidian-<ver>.asar` into the scratch `udd` and loads it **in the same process**, per
`obsidian.log` — no restart needed) and waiting 6s for it to settle before probing. All
three runs produced byte-identical results.

**Environment probed** (`process.versions` + `navigator.userAgent`, evaluated in-page):

```json
{
  "apiVersion": "unknown",
  "electron": "21.4.1",
  "chrome": "106.0.5249.199",
  "node": "16.16.0",
  "ua": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) obsidian/1.1.16 Chrome/106.0.5249.199 Electron/21.4.1 Safari/537.36"
}
```

`apiVersion` reads "unknown" because the probe never trusts/enables the plugin (restricted
mode) — irrelevant to this spike, which only needs `window`/`navigator` surface. Important
finding in its own right: **the self-update only swaps the JS-level `obsidian.asar` app
layer; the Electron/Chromium shell itself stays pinned to whatever the installed binary
bundles** (Electron 21.4.1 / Chromium 106.0.5249.199, a 2022-era build) — confirmed by
`obsidian.log`, which shows the updated asar (`obsidian-1.13.4.asar`) downloaded and loaded
mid-session while `process.versions.electron`/`chrome` stayed identical before and after.
So "Obsidian version" and "Chromium version" are two independent axes here; the Chromium
engine governing Web-Platform API availability is the older, shell-pinned one regardless of
which Obsidian app version is "current." Chrome 106 postdates Local Font Access General
Availability (Chrome 103+), so this is not a version-currency risk for the feature itself.

**(a) `typeof window.queryLocalFonts`:**

```json
{ "threw": false, "value": "function" }
```

**(b) `navigator.permissions.query({ name: 'local-fonts' })`** (wrapped — the name did not
throw on this Chromium):

```json
{ "threw": false, "value": { "ok": true, "state": "granted" } }
```

**(c) `await queryLocalFonts()` WITH `userGesture: true`:**

```json
{
  "threw": false,
  "value": {
    "available": true,
    "resolved": true,
    "count": 424,
    "sample": [
      { "family": "Abyssinica SIL", "fullName": "Abyssinica SIL", "style": "Regular" },
      { "family": "Ani", "fullName": "Ani", "style": "Regular" },
      { "family": "AnjaliOldLipi", "fullName": "AnjaliOldLipi", "style": "Regular" }
    ]
  }
}
```

**(d) same call WITHOUT the gesture flag** — byte-identical result to (c):

```json
{
  "threw": false,
  "value": {
    "available": true,
    "resolved": true,
    "count": 424,
    "sample": [
      { "family": "Abyssinica SIL", "fullName": "Abyssinica SIL", "style": "Regular" },
      { "family": "Ani", "fullName": "Ani", "style": "Regular" },
      { "family": "AnjaliOldLipi", "fullName": "AnjaliOldLipi", "style": "Regular" }
    ]
  }
}
```

**Activation requirement: none observed.** `queryLocalFonts()` resolved with the full font
list on the very first call, with no user-gesture flag needed and no permission prompt shown
(`navigator.permissions.query` already reported `"granted"` before either call ran). This is
Electron's session permission-request behavior: `queryLocalFonts()`'s permission check routes
through Electron's `session.setPermissionRequestHandler`/`setPermissionCheckHandler` (main
process), and **Obsidian's Electron shell does not register a handler that denies or
gates `'local-fonts'`** — Electron's documented default when no handler is registered is to
**allow** the request. Confirmed behaviorally, not assumed: no modal/prompt ever appeared
(checked `.modal-container` after each call — only the standard "Do you trust the author of
this vault?" plugin-trust modal was ever present, unrelated to font access), and the
`userGesture: false` call succeeded identically to the `userGesture: true` call.

## Step 3: verdict

**Outcome A — usable.** `queryLocalFonts()` is exposed, unconditionally permitted (`granted`,
no prompt, no gesture requirement observed), and returns a real, useful 424-entry system font
list (`{family, fullName, style}` per entry) inside Obsidian's Electron on this machine —
confirmed identically on both the as-installed app layer and the self-updated one, so this
is not an artifact of a stale bundled build. Obsidian versions probed: app layer
`obsidian/1.1.16` (as-installed) and `1.13.4` (self-updated, same session) — both running
under the fixed shell `Electron 21.4.1` / `Chromium 106.0.5249.199`.

**Task 8 path selected: Outcome A.** The font control gets the "List installed fonts" flow:
dropdown initially shows the curated list; a click affordance (satisfying user activation,
belt-and-suspenders even though this Electron didn't require it) calls `queryLocalFonts()`,
de-duplicates by `family`, sorts, and merges into the dropdown for the session. Must be
feature-detected (`'queryLocalFonts' in window`) since the plugin is not desktop-only
(`isDesktopOnly: false`) and mobile WebViews lack the API — Outcome B's curated+Custom
control is still built unconditionally as the shared base/fallback (per the plan: "Outcome A
only adds the population flow").

**Caveat for Task 8 to carry forward:** this result is single-machine/single-Electron-build
evidence. Because the behavior hinges on Electron's session permission-handler registration
(a main-process concern, not something the plugin controls) rather than a spec-guaranteed
default, a *different* Obsidian installation/shell/OS could in principle register a stricter
handler or ship an older Chromium lacking the API — hence Task 8's feature-detection
(`'queryLocalFonts' in window`) and graceful fallback to the curated list are load-bearing,
not decorative, even though this Outcome A is unconditional-allow.

## Step 4

Committed in the workspace repo (not the submodule) — see commit list in the task report.

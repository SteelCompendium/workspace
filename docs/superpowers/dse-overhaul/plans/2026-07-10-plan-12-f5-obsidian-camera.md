# F5 Real-Obsidian CDP Camera Implementation Plan (Plan 12)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ground-truth screenshots — every DSE element rendered by an actual spawned Obsidian instance in the git-managed demo vault, captured over CDP into the same `shots/` contract as F4.

**Architecture:** The demo vault moves into the repo (`demo-vault/`, plugin symlinked into `.obsidian/plugins/`). `notes-gen.mjs` writes one note per element from the F4 fixtures. `obsidian-camera.mjs` spawns a second Obsidian (`--user-data-dir` scratch + `--remote-debugging-port=9223`, display `:1`), attaches via Playwright `connectOverCDP`, drives the vault through the app's own APIs (`app.workspace.openLinkText`, the plugin's `frameworkV2.services.theme.setActive`, the app dark/light theme API), and clips each `[data-dse-element]` to a PNG. Task 3 is an explicit **spike** — first-run automation (vault registration, restricted-mode/trust) is settled empirically there before the full sweep is built on it.

**Tech Stack:** Node .mjs scripts, Playwright (already installed, F4), the system Obsidian (`/usr/bin/obsidian` → `/opt/Obsidian/obsidian`, v1.13.x), jest for the drift gates.

**Spec:** `docs/superpowers/dse-overhaul/F5-obsidian-camera-spec.md` · **Plan 11 (F4) is the base** — branch `dse-framework` @ `b608541`.

## Global Constraints

- **Repo/branch:** all changes in the worktree
  `/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements` on branch
  **`dse-framework`**. Never touch the main checkout.
- **Node invocation:** node/npm/npx are NOT on PATH:
  `devbox run -- bash -c "cd /home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements && <cmd>"`
  from `/home/scott/code/steelCompendium/workspace`.
- **⚠️ NEVER disturb Scott's own Obsidian.** His instance is running (AppImage, default
  config at `~/.config/obsidian`). The camera uses its OWN `--user-data-dir` under the
  session scratchpad, its OWN debug port **9223**, and only ever kills the child process it
  spawned. Never write to `~/.config/obsidian`, never touch
  `~/Documents/draw-steel-elements-demo` (the migration COPIES from it, read-only).
- **Gates after every task:** `npx tsc --noEmit` → 0; `npx jest` → green (992 before this
  plan; only goes up). Do not commit red.
- **Commit hygiene:** no AI-attribution trailers; `git push origin dse-framework` after each
  task's commit.
- **Vault hygiene:** `demo-vault/DS Compendium/`, `demo-vault/.obsidian/workspace.json`,
  `demo-vault/.obsidian/plugins/*` (except the `draw-steel-elements` symlink), and
  `demo-vault/Harness/` are git-ignored. `visual-harness/shots/` stays git-ignored.
- The plugin's shipped surface (`src/`, `main.ts`, `styles-source.css`, `manifest.json`,
  `esbuild.config.mjs`) is untouched by this plan.

---

### Task 1: Vault migration into the repo

**Files:**
- Create: `demo-vault/` (copied content + the plugin symlink)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `demo-vault/` at the repo root — the camera's vault. The plugin loads through
  the committed relative symlink `demo-vault/.obsidian/plugins/draw-steel-elements` →
  `../../..`. Committed: hand-made notes (`Test Statblock.md`, `Test Negotiation.md`,
  `test ability.md`, `Welcome.md`, `Untitled.canvas`), images (`token_1.png`, `rogue.png`,
  `steelcompendium.png`), `.obsidian/{app,appearance,community-plugins,core-plugins,core-plugins-migration,graph}.json`.

- [ ] **Step 1: Copy the vault (read-only source)**

```bash
SRC=/home/scott/Documents/draw-steel-elements-demo
WT=/home/scott/code/steelCompendium/worktrees/dse-framework/draw-steel-elements
cp -a "$SRC" "$WT/demo-vault"
```

- [ ] **Step 2: Replace the stale plugin copy with the symlink**

```bash
rm -rf "$WT/demo-vault/.obsidian/plugins/draw-steel-elements"
ln -s ../../.. "$WT/demo-vault/.obsidian/plugins/draw-steel-elements"
# verify it resolves to the repo root:
test -f "$WT/demo-vault/.obsidian/plugins/draw-steel-elements/manifest.json" && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Append the vault gitignores**

Append to `.gitignore`:

```
# F5 demo vault (Plan 12): generated/third-party/session content stays untracked
demo-vault/DS Compendium
demo-vault/Harness
demo-vault/.obsidian/workspace.json
demo-vault/.obsidian/plugins/*
!demo-vault/.obsidian/plugins/draw-steel-elements
```

(The `!` re-include keeps ONLY the symlink tracked. Note: git tracks the symlink itself, not
what it points into — no recursion.)

- [ ] **Step 4: Verify the tracked-vs-ignored split**

```bash
cd "$WT"
git check-ignore -q "demo-vault/DS Compendium" && echo ignored-ok
git check-ignore -q demo-vault/.obsidian/workspace.json && echo ws-ignored-ok
git check-ignore -q demo-vault/.obsidian/plugins/obsidian42-brat && echo brat-ignored-ok
git check-ignore -q demo-vault/.obsidian/plugins/draw-steel-elements && echo BAD-SYMLINK-IGNORED || echo symlink-tracked-ok
git add -n demo-vault | wc -l   # dry-run: expect a SMALL count (~12 files), NOT thousands
```

Expected: `ignored-ok`, `ws-ignored-ok`, `brat-ignored-ok`, `symlink-tracked-ok`, and a
dry-run add count around 12 (if it's in the hundreds, an ignore rule is wrong — STOP).

- [ ] **Step 5: Gates, commit, push**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → 992 green (vault is outside every glob).

```bash
git add .gitignore demo-vault
git commit -m "feat(harness): migrate demo vault into repo with plugin symlink (F5)"
git push origin dse-framework
```

---

### Task 2: `aliases.json` drift gate + `notes-gen.mjs`

**Files:**
- Create: `visual-harness/aliases.json`, `visual-harness/notes-gen.mjs`
- Test: `test/dom/visual-harness/aliases.test.ts`

**Interfaces:**
- Consumes: `visual-harness/fixtures/<element>/default.md` (F4), `registerFrameworkElementDefinitions` (drift gate only).
- Produces: `aliases.json` = `{ "<elementId>": "<primaryAlias>" }` ×11 (a plain-node-readable
  mirror of `def.aliases[0]`, CI-pinned against the registry);
  `node visual-harness/notes-gen.mjs` → writes `demo-vault/Harness/<elementId>.md` per
  fixture dir: `# <elementId>` + a fenced block whose language is the primary alias and whose
  body is `default.md` verbatim. Task 3/4 open these notes.

- [ ] **Step 1: Write the failing drift-gate test**

```ts
// test/dom/visual-harness/aliases.test.ts — F5 (Plan 12): aliases.json is the plain-node
// mirror of each element's primary alias (def.aliases[0]) for notes-gen.mjs, which cannot
// import TS. This equality pin means alias/element drift breaks CI, not the camera.
import * as fs from 'fs';
import * as path from 'path';
import { createElementRegistry } from '../../../src/framework/registry';
import { registerFrameworkElementDefinitions } from 'main';

test('aliases.json mirrors registry primary aliases exactly', () => {
	const registry = createElementRegistry();
	registerFrameworkElementDefinitions(registry);
	const expected: Record<string, string> = {};
	for (const def of registry.all()) expected[def.id] = def.aliases[0];
	const actual = JSON.parse(
		fs.readFileSync(path.join(__dirname, '../../../visual-harness/aliases.json'), 'utf8'),
	);
	expect(actual).toEqual(expected);
});
```

- [ ] **Step 2: Run it — FAIL (file missing)**

Run: `npx jest test/dom/visual-harness/aliases.test.ts` → FAIL (ENOENT).

- [ ] **Step 3: Create `visual-harness/aliases.json`**

```json
{
	"horizontal-rule": "ds-hr",
	"skills": "ds-skills",
	"stamina-bar": "ds-stam",
	"negotiation": "ds-nt",
	"initiative": "ds-it",
	"feature": "ds-ft",
	"featureblock": "ds-fb",
	"statblock": "ds-sb",
	"counter": "ds-ct",
	"values-row": "ds-vr",
	"characteristics": "ds-char"
}
```

- [ ] **Step 4: Test passes**

Run: `npx jest test/dom/visual-harness/aliases.test.ts` → PASS. (If any pair mismatches, the
registry is truth — fix the JSON.)

- [ ] **Step 5: Write `visual-harness/notes-gen.mjs`**

```js
#!/usr/bin/env node
// visual-harness/notes-gen.mjs — F5 (Plan 12): FIXTURES → demo-vault Harness notes.
// One note per element: heading + a fenced block (primary alias) with the default fixture
// body verbatim. demo-vault/Harness/ is git-ignored and regenerated every camera run.
// Plain node (no TS): fixture bodies come from the fixture files themselves; primary
// aliases from aliases.json (CI-pinned against the registry by aliases.test.ts).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repo = path.dirname(dir);
const aliases = JSON.parse(fs.readFileSync(path.join(dir, 'aliases.json'), 'utf8'));
const fixturesDir = path.join(dir, 'fixtures');
const outDir = path.join(repo, 'demo-vault', 'Harness');

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const ids = fs.readdirSync(fixturesDir).filter((d) => fs.existsSync(path.join(fixturesDir, d, 'default.md')));
for (const id of ids) {
	const alias = aliases[id];
	if (!alias) {
		console.error(`no primary alias for element '${id}' in aliases.json`);
		process.exit(1);
	}
	const body = fs.readFileSync(path.join(fixturesDir, id, 'default.md'), 'utf8');
	const fenced = body.length ? '```' + alias + '\n' + body.replace(/\n?$/, '\n') + '```\n' : '```' + alias + '\n```\n';
	fs.writeFileSync(path.join(outDir, `${id}.md`), `# ${id}\n\n${fenced}`);
	console.log(`wrote Harness/${id}.md (${alias})`);
}
if (ids.length !== Object.keys(aliases).length) {
	console.error(`fixture dirs (${ids.length}) != aliases (${Object.keys(aliases).length})`);
	process.exit(1);
}
console.log(`${ids.length} notes generated`);
```

- [ ] **Step 6: Run + verify output**

```bash
node visual-harness/notes-gen.mjs        # -> "11 notes generated"
ls demo-vault/Harness | wc -l            # -> 11
head -3 "demo-vault/Harness/statblock.md"   # -> "# statblock", blank, "```ds-sb"
git status --short demo-vault | grep Harness && echo BAD-TRACKED || echo ignored-ok
```

- [ ] **Step 7: Gates, commit, push**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → 993 green (992 + 1).

```bash
git add visual-harness/aliases.json visual-harness/notes-gen.mjs test/dom/visual-harness/aliases.test.ts
git commit -m "feat(harness): notes-gen + CI-pinned aliases map (F5)"
git push origin dse-framework
```

---

### Task 3: SPIKE — launch, attach, one ground-truth shot

This task settles the empirical unknowns; Task 4 builds the sweep on what it proves. The
deliverable is a WORKING minimal camera + a report documenting each mechanism that worked.

**Files:**
- Create: `visual-harness/obsidian-camera.mjs` (v0 — single-shot spike; Task 4 grows it)

**Interfaces:**
- Produces: `node visual-harness/obsidian-camera.mjs --spike` → exactly one PNG,
  `visual-harness/shots/statblock--obsidian-legacy-dark.png`, of the REAL Obsidian render;
  plus (in the task report) the proven answers Task 4 needs: first-run/trust automation,
  reading-mode forcing, dark/light theme API, quit mechanism.

- [ ] **Step 1: Seed + spawn**

Implement and verify, in `obsidian-camera.mjs`:

- Scratch user-data-dir: `<scratchpad>/obsidian-harness-udd` (take the scratchpad root from
  an env var `DSE_CAMERA_TMP`, default `/tmp/claude-1000/dse-obsidian-camera`). Seed
  `<udd>/obsidian.json` before first launch:
  `{"vaults":{"dseharness0001":{"path":"<abs repo>/demo-vault","ts":<now>,"open":true}}}`.
- Spawn: `/usr/bin/obsidian --user-data-dir=<udd> --remote-debugging-port=9223 --window-size=1440,1100`
  with `env DISPLAY=:1`, detached from the devbox shell (plain `spawn`, keep the pid).
- Poll `http://localhost:9223/json/version` (plain `fetch`) until ready (≤30 s).

Acceptance: an Obsidian window opens the demo vault (visible on Scott's display) without a
vault-picker.

- [ ] **Step 2: Attach + get the app handle**

- `const browser = await chromium.connectOverCDP('http://localhost:9223')`; find the page
  whose `url()` starts with `app://obsidian.md` (the workspace window; ignore devtools/
  background targets).
- `await page.waitForFunction(() => window.app?.workspace?.layoutReady === true, null, { timeout: 30000 })`.
- **Trust/Restricted Mode:** if `app.plugins.plugins['draw-steel-elements']` is undefined,
  drive the app's own APIs from `page.evaluate`:
  `await app.plugins.setEnable(true); await app.plugins.enablePluginAndSave('draw-steel-elements');`
  and re-check. If a modal dialog still blocks (EULA/trust prompt that has no API), take a
  full-window screenshot, save it as `visual-harness/shots/SPIKE-BLOCKED.png`, and report
  BLOCKED describing the dialog — do NOT guess-click coordinates.

Acceptance: `page.evaluate(() => !!window.app.plugins.plugins['draw-steel-elements'].frameworkV2)` → true.

- [ ] **Step 3: Open the note in reading mode + shoot**

- Ensure notes exist (`node visual-harness/notes-gen.mjs` first) and the plugin build is
  current (`npm run build-no-check` before spawn).
- Open: `await app.workspace.openLinkText('Harness/statblock', '', false)`; then force
  reading view on the active leaf (`leaf.setViewState({ type: 'markdown', state: { file: 'Harness/statblock.md', mode: 'preview' } })`
  or the equivalent that works — document which).
- Wait for a rendered `[data-dse-element]` in the workspace leaf container; get its
  `getBoundingClientRect()` via evaluate; screenshot with
  `page.screenshot({ clip, path: 'visual-harness/shots/statblock--obsidian-legacy-dark.png' })`.
- Confirm dark/light control works (needed by Task 4, prove it now): from evaluate, switch
  the app base theme — try `app.changeTheme('moonstone')` / `app.changeTheme('obsidian')`;
  fallback `app.vault.setConfig('theme','moonstone'); app.updateTheme()`. Document which
  call works on this Obsidian version (don't shoot light yet — just prove the switch
  visibly happens and switch back).
- Quit: prefer `app.commands.executeCommandById('app:quit')` via evaluate; fallback
  `child.kill()`. Ensure the script NEVER exits leaving the child alive (try/finally).

Acceptance: the PNG exists and shows the statblock as rendered by real Obsidian (dark,
legacy). Run `npx tsc --noEmit` → 0 and `npx jest` → 993 (untouched) before committing.

- [ ] **Step 4: Commit + push**

```bash
git add visual-harness/obsidian-camera.mjs
git commit -m "feat(harness): obsidian CDP camera spike — launch, attach, one shot (F5)"
git push origin dse-framework
```

Report MUST include: the exact working mechanisms for (a) first-run/vault registration,
(b) plugin enablement/trust, (c) reading-mode forcing, (d) dark/light switching, (e) quit —
plus any surprises (dialogs, timing, focus).

---

### Task 4: Full camera — matrix sweep, flags, error contract

**Files:**
- Modify: `visual-harness/obsidian-camera.mjs` (spike v0 → full camera), `package.json` (script)

**Interfaces:**
- Consumes: the spike's proven mechanics (use them EXACTLY — the spike report is part of your
  brief), `demo-vault/Harness/` notes, `aliases.json` ids.
- Produces: `npm run obsidian-shots` =
  `node visual-harness/notes-gen.mjs && npm run build-no-check && node visual-harness/obsidian-camera.mjs`
  → **44 PNGs**: `<element>--obsidian-<theme>-<bg>.png` for 11 elements ×
  `{legacy,steel}` × `{dark,light}`. Flags `--element= --theme= --bg=` narrow the matrix
  (same semantics as `shoot.mjs`: bad values → exit 2 naming them). Failures → `--ERROR`
  suffix + exit 1 listing them; guaranteed child teardown via try/finally.

- [ ] **Step 1: Grow the spike into the sweep**

Structure (reusing F4's `shoot.mjs` conventions — arg parsing, failure list, exit codes):

- One spawn/attach for the WHOLE run (launching Obsidian per shot is minutes; per run is
  seconds). Iterate elements in the outer loop, themes/bgs inner, so note-opens are
  minimized: open note once, then flip `frameworkV2.services.theme.setActive('legacy'|'steel')`
  and the app dark/light per combo, waiting for the re-render/re-stamp between shots
  (`data-dse-theme` attribute on the element root reflects the active theme — wait on it).
- Plugin theme via
  `app.plugins.plugins['draw-steel-elements'].frameworkV2.services.theme.setActive(t)`
  (the exact path `main.ts`'s dse-cycle-theme command uses; it live-reflows rendered roots).
- Dark/light via the spike-proven call; wait for `document.body.classList` to reflect
  `theme-dark`/`theme-light` before shooting.
- Per shot: fresh `getBoundingClientRect()` (theme flips can resize), clip-screenshot to the
  F5 name. Scroll the element fully into view first; if it's taller than the window, use the
  rect anyway (CDP clips beyond viewport) and note it.
- Errors per combo (element missing, timeout, evaluate throw) → record
  `{ outName, errors }`, save `--ERROR` shot if a screenshot is possible, CONTINUE the sweep
  (F4 fix-round semantics). try/finally guarantees quit/kill.

- [ ] **Step 2: Add the npm script**

In `package.json` scripts, after `"shot-url"`:

```json
		"obsidian-shots": "node visual-harness/notes-gen.mjs && npm run build-no-check && node visual-harness/obsidian-camera.mjs",
```

- [ ] **Step 3: Full sweep**

Run: `npm run obsidian-shots`
Expected: exit 0; `ls visual-harness/shots/*--obsidian-*.png | wc -l` → **44**, none
`--ERROR`.

- [ ] **Step 4: Narrowed runs**

Run: `npm run obsidian-shots -- --element=statblock --theme=steel` → exactly 2 files
rewritten (`statblock--obsidian-steel-dark.png`, `statblock--obsidian-steel-light.png`).
Run: `npm run obsidian-shots -- --theme=bogus` → exit 2 naming the value, zero shots.

- [ ] **Step 5: Gates, commit, push**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → 993 green.

```bash
git add visual-harness/obsidian-camera.mjs package.json
git commit -m "feat(harness): full obsidian camera — 44-shot matrix with error contract (F5)"
git push origin dse-framework
```

---

### Task 5: Ground-truth adjudication + docs

**Files:**
- Modify: `visual-harness/README.md`, `CLAUDE.md` (one-line addition to the existing
  Visual harness section)

**Interfaces:**
- Consumes: the 44 F5 PNGs + F4's 59.
- Produces: docs a cold agent can operate both cameras from; the F4-vs-F5 fidelity notes.

- [ ] **Step 1 (ORCHESTRATOR, not the implementer): adjudicate the Steel findings**

The controller Reads `statblock--steel-dark.png` (F4) next to
`statblock--obsidian-steel-dark.png` (F5) and rules on the two logged findings (invisible
tier-badge labels; act-spine text clipping): real in ground truth, or F4 artifacts. Outcome
goes to the ledger + the SC-10 Linear comment.

- [ ] **Step 2: Extend `visual-harness/README.md`**

Add an "Obsidian camera (ground truth)" section in the file's existing voice:

```markdown
## Obsidian camera (ground truth)

    npm run obsidian-shots                         # 44 PNGs: 11 elements × legacy/steel × dark/light
    npm run obsidian-shots -- --element=statblock --theme=steel

Spawns a REAL Obsidian instance (its own user-data-dir + debug port 9223 — your own
Obsidian is untouched; a window appears on the desktop during the run) against the
git-managed `demo-vault/`, opens a generated note per element (`demo-vault/Harness/`,
regenerated each run from the F4 fixtures via `notes-gen.mjs` + `aliases.json`), and
screenshots each element over CDP.

Output: `shots/<element>--obsidian-<theme>-<bg>.png` — named to diff directly against the
browser harness's `<element>--<theme>-<bg>.png`. Browser shots iterate fast; obsidian shots
are the truth. Same failure contract as `shots`: `…--ERROR.png` + exit 1; bad flag values
exit 2. Needs a display (`:1`) and the system Obsidian; it is a local tool, not CI.
```

Adjust wording to match what actually shipped (Task 4 behavior), plus any fidelity
differences the adjudication in Step 1 surfaced (fonts, spacing, markdown rendering) as a
short "known deltas vs browser shots" list.

- [ ] **Step 3: CLAUDE.md line**

In the existing "Visual harness (see it rendered)" section, add one sentence:
`npm run obsidian-shots` produces ground-truth PNGs from a real spawned Obsidian
(`<element>--obsidian-<theme>-<bg>.png`) — slower; use it for sign-off, the browser
harness for iteration.

- [ ] **Step 4: Final battery, commit, push**

Run: `npx tsc --noEmit` → 0. Run: `npx jest` → 993 green. Run: `npm run shots` → 59 clean.
Run: `npm run obsidian-shots` → 44 clean.
Run: `git log --format='%b' b608541..HEAD | grep -iE 'co-authored|generated with'` → empty.

```bash
git add visual-harness/README.md CLAUDE.md
git commit -m "docs(harness): obsidian camera docs + fidelity notes (F5)"
git push origin dse-framework
```

---

## Post-plan (orchestrator, workspace repo)

- `docs/superpowers/dse-overhaul/README.md`: F5 row → built.
- Ledger entries per task; Linear SC-9 comment (F5 shipped + adjudication outcome), SC-10
  comment if the Steel findings' status changed.
- Scott's manual gate: open `demo-vault/` in his own Obsidian once, confirm his demo setup
  works from the repo copy (then retire `~/Documents/draw-steel-elements-demo` at his
  leisure).

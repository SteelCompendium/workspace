# Steel Material Parity (SC-10 follow-up) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

> **STATUS 2026-07-21: DRAFT — READY TO EXECUTE.** Written against `draw-steel-elements`
> main @ `01822bd` (6.0.0, not yet released) and the live site at steelcompendium.io/v2
> (v2 main `55148acee4`, deployed 2026-07-20). Baselines: tsc clean · jest **1981** ·
> shots **295 PNGs** · obsidian-shots **131**.

**Goal:** Make the plugin's Steel theme visually match the live v2 site by porting the
**material layer** (sheen gradients, inset bevels, hairline borders, tier/role colour
washes, metal text colours) that plan 19 skipped — and install an automated
site-vs-plugin parity gate so this class of drift cannot silently pass review again.

**Architecture:** Plan 19 ported the site's *structure* (card grammar, ◆ ornament,
typography, crest, boxed panels) and assumed a prior recon claim that "the colour tokens
already match the site verbatim." That claim was half-true and the resulting build is
structurally right but flat. This plan (a) captures a **machine-readable style inventory**
from the live site — the reference artifact, replacing stale ad-hoc screenshots; (b)
extracts the same inventory from the plugin harness; (c) diffs them into a gap report;
(d) closes the gaps on the **shared kit primitives** so one rule cascades to all 32
elements; (e) freezes the result as a repeatable `npm run parity` gate plus jest
computed-style assertions.

**Tech Stack:** TypeScript/CSS (`draw-steel-elements`), Playwright (already a devDependency
— drives both the live-site capture and the harness extraction), Node ESM tooling under
`visual-harness/`, jest + jsdom for the assertion gate.

---

## Why this failed the first time (read before starting)

The plan-19 recon reported *"SC-10 token-value work (colors, role/act/tier hues) is already
landed and matches the site verbatim."* Verified 2026-07-21, that is **precisely half
right**, and the half that is wrong is the whole visible problem:

- **Tokens ARE ported, with byte-identical values.** The site's `--fx-metal-grad/-line/-faint`
  exist in the plugin as `--dse-metal-grad/-line/-faint` with the *same* literals
  (`linear-gradient(180deg, #e3e7e9 0%, #a9b0b5 48%, #686f74 100%)`, `rgba(176,183,187,.5)`,
  `rgba(176,183,187,.16)`). A grep for `--fx-metal` returns 0 only because of the rename.
- **They are almost never consumed.** `--dse-metal-grad` is consumed **once** in the entire
  stylesheet (the crest). `--dse-metal-line`/`-faint` are consumed 4× each. The site applies
  its equivalents to *every* chip, section head, power-roll head and panel.
- **Two tokens are genuinely missing**: the site's flat metal text colours `--fx-metal`
  (`#a9b0b5` dark / `#5f676c` light) and `--fx-metal-bright` (`#d9dee1` / `#2c3338`) have no
  `--dse-*` counterpart.

So this is an **application gap, not a palette gap.** The fix is additive CSS on shared
primitives — no DOM changes, no token re-derivation, no structural rework.

**The verification failure matters as much as the code failure.** Every plan-19 task
compared a plugin screenshot to a site screenshot and reported "close match" — because the
reviewer (human and agent) was pattern-matching *layout*, which was correct. Nothing in the
gate could fail on "the surfaces are flat." Task 2 and Task 7 exist to make that impossible:
parity is asserted on **computed styles**, where "flat" is a concrete, failing value.

## Decision: do NOT unify the site and plugin codebases (yet)

Scott asked whether one set of code could drive both, and noted 6.0.0 hasn't shipped so the
breaking-change window is open. Recommendation: **share the tokens and the verification, not
the code — now**; revisit full CSS sharing after this lands, as ROADMAP material.

- **Sharing the renderer is never worth it.** The site renders build-time HTML from Go
  (`steel-etl/internal/site/`); the plugin renders runtime DOM from TypeScript against a
  different data source with interactive state. Unifying means rewriting one in the other's
  language.
- **Sharing the CSS is plausible but badly timed.** Only the *presentational card family*
  overlaps (~40–60%); the plugin also owns trackers, hero sheet, sidebar, modals, Legacy
  theme and print, which have no site counterpart. Sharing would require migrating the
  plugin's entire `dse-` class vocabulary to the site's `sc-` names — which would invalidate
  the 295-PNG golden baseline and the Legacy-freeze proof, i.e. destroy the safety net *at
  the same moment* we're making a large visual change. Two risky things at once, with no
  stable reference to verify against.
- **The 6.0.0 window is real but not decisive.** 6.0.0 is already breaking, so one more
  breaking change is cheap — but the *value* of unification is future drift prevention, and
  Tasks 1/2/7 deliver most of that (a shared token contract + an automated parity gate)
  without touching a single class name.
- **Sequencing:** achieve parity first, then consolidate the mechanism if the gate proves
  insufficient. Consolidating first means refactoring toward a target we haven't defined.

**Action:** Task 8 files a ROADMAP item for "extract a shared steel-design token/CSS package"
recording this reasoning and the concrete seam (the token contract from Task 1), so a future
7.0.0 can take it with evidence.

## Global Constraints

- **LEGACY-FREEZE is absolute.** Every `*--legacy-{dark,light}.png` in
  `visual-harness/shots/` must remain **byte-identical** (verify with `cmp`) across every
  task. All new CSS is scoped under `[data-dse-theme="steel"]`. The sole sanctioned
  exception in plan 19 was the hero grid bug; there is **no** sanctioned exception here.
- **`*--steel-print.png` must also stay byte-identical** unless a task explicitly says
  otherwise — print is a separate parked decision (SC-4). Scope new rules with
  `:not([data-dse-print="on"])` where plan 19's Task 1 established the pattern.
- **No DOM changes.** This is a CSS-only plan except where a task explicitly adds a token or
  a test file. If a gap appears to need markup, STOP and report it rather than changing DOM —
  the DOM is what the 1981 jest tests and 295 goldens pin.
- **No new runtime dependencies.** Playwright is already a devDependency; use it.
- **Gates after every task:** `npm run tsc` clean · full `npx jest` green (baseline **1981**,
  plus tests a task explicitly adds) · `npm run shots` runs clean · Legacy/print freeze
  proven by `cmp`.
- **Environment:** every command runs through devbox from the repo, wrapped in `bash -c`
  because `devbox run --` ignores the surrounding `cd`:
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && <cmd>'`
  (use the absolute path — a bare `cd draw-steel-elements` resolves against the devbox project
  root and can silently hit the wrong checkout).
- **Never fabricate a colour.** Every value written into the plugin must be traceable to the
  captured site inventory (Task 1) or to an existing `--dse-*` token. If the site has no
  counterpart for a plugin-only surface, derive it from an existing token with a documented
  formula and say so in the commit message.

## File Structure

**New — capture & parity tooling (`draw-steel-elements/visual-harness/parity/`):**
- `site-capture.mjs` — Playwright crawl of a live-site URL list → screenshots +
  `site-inventory.json` (computed styles per selector, per theme).
- `urls.json` — the curated live-site URL list (data, so it can grow without code changes).
- `selector-map.json` — site selector ⇄ plugin selector pairs, with the property set to
  compare. **The contract.**
- `plugin-capture.mjs` — same extraction against the harness → `plugin-inventory.json`.
- `diff.mjs` — inventory diff → `parity-report.md` + non-zero exit on regressions.
- `README.md` — how to run, how to add a surface, how to read the report.

**Committed artifacts (`draw-steel-elements/visual-harness/parity/baseline/`):**
- `site-inventory.json` — the captured reference (regenerate deliberately, review the diff).
- `site-shots/` — fresh reference PNGs from the live site.

**Modified — the material layer:**
- `draw-steel-elements/styles-source.css` — Steel token additions + material rules on the
  shared primitives (`.dse-head__*--chip`, `.dse-section__head`, `.dse-pr__head`,
  `.dse-pr__badge`, `.dse-feature__meta`, `.dse-card__*`, `.dse-fb__*`, `.dse-sb`).
- `draw-steel-elements/package.json` — add `parity` + `parity:site` scripts.
- `draw-steel-elements/test/dom/theme/steelMaterial.test.ts` — **new**, computed-style
  assertions that fail on flat surfaces.

**Docs:**
- `docs/superpowers/dse-overhaul/D3-token-map.md` — new tokens + the material contract.
- `draw-steel-elements/CHANGELOG.md` — 6.0.0 Steel bullet amended.
- workspace `CHANGELOG.md`, `ROADMAP.md` (the shared-package item), `FOLLOWUPS.md` if gaps
  are deferred.

---

### Task 1: Capture the live site as a machine-readable style inventory

Replaces the stale `.superpowers/sdd/shots-hfs-recon/` screenshots with a fresh, complete,
**reproducible** reference. The JSON inventory — not the PNGs — is what later tasks verify
against.

**Files:**
- Create: `visual-harness/parity/urls.json`
- Create: `visual-harness/parity/site-capture.mjs`
- Create: `visual-harness/parity/README.md`
- Create (generated, committed): `visual-harness/parity/baseline/site-inventory.json`,
  `visual-harness/parity/baseline/site-shots/*.png`

**Interfaces:**
- Produces: `site-inventory.json` shaped
  `{ capturedAt, siteCommit, entries: { "<pageId>": { "<selector>": { "<prop>": "<computed value>" } } } }`
  — consumed by Tasks 2, 3, 4, 5, 6, 7.
- Produces: `visual-harness/parity/urls.json` — an array of
  `{ id, url, waitFor, note }` — extended by Task 6.

- [ ] **Step 1: Write the URL list.** Cover every element family the plugin renders, plus
  the variants that exercise different colour paths (roles, tiers, malice). Create
  `visual-harness/parity/urls.json`:

```json
[
  { "id": "ability-powerroll",  "url": "https://steelcompendium.io/v2/Browse/feature/ability/tactician/level-1/mark/",        "waitFor": ".sc-ability", "note": "power roll + tier rows (tier wash)" },
  { "id": "ability-noroll",     "url": "https://steelcompendium.io/v2/Browse/feature/ability/shadow/level-1/black-ash-teleport/", "waitFor": ".sc-ability", "note": "effect-only card, spend clause" },
  { "id": "statblock-minion",   "url": "https://steelcompendium.io/v2/Browse/monster/goblin/goblin-warrior/",                  "waitFor": ".sb-wrap",    "note": "horde/harrier role tint" },
  { "id": "statblock-leader",   "url": "https://steelcompendium.io/v2/Browse/monster/human/human-bandit-chief/",               "waitFor": ".sb-wrap",    "note": "leader, no-org role fallback" },
  { "id": "statblock-solo",     "url": "https://steelcompendium.io/v2/Browse/monster/ashen-hoarder/ashen-hoarder/",            "waitFor": ".sb-wrap",    "note": "solo; villain actions band" },
  { "id": "statblock-companion","url": "https://steelcompendium.io/v2/Browse/monster/companion/beastheart/bear/",              "waitFor": ".sb-wrap",    "note": "companion + class back-link" },
  { "id": "featureblock-malice","url": "https://steelcompendium.io/v2/Browse/monster/devil/devil-malice/",                     "waitFor": ".fb-wrap",    "note": "malice band + per-option glyphs" },
  { "id": "kit",                "url": "https://steelcompendium.io/v2/Browse/kit/panther/",                                    "waitFor": ".sc-card, .sc-kit", "note": "kit card + signature ability" },
  { "id": "condition",          "url": "https://steelcompendium.io/v2/Browse/condition/bleeding/",                             "waitFor": ".md-content", "note": "reference/glossary card" },
  { "id": "ancestry",           "url": "https://steelcompendium.io/v2/Browse/ancestry/devil/",                                 "waitFor": ".md-content", "note": "trait tree, nested sections" },
  { "id": "class",              "url": "https://steelcompendium.io/v2/Browse/class/fury/",                                     "waitFor": ".md-content", "note": "class page, stats strip, act spines" },
  { "id": "treasure",           "url": "https://steelcompendium.io/v2/Browse/treasure/leveled/armor/rampant-shield/",          "waitFor": ".md-content", "note": "leveled treasure rows" }
]
```

> **Note for the implementer:** these URLs are believed-live but **verify each one returns
> 200 and the `waitFor` selector exists** before capturing. If a URL 404s or the selector
> never appears, find the correct page by browsing
> `https://steelcompendium.io/v2/Browse/` and **fix `urls.json`** — do not silently skip it.
> Record any URL you changed in the commit message.

- [ ] **Step 2: Write the capture script.** Create `visual-harness/parity/site-capture.mjs`:

```js
// visual-harness/parity/site-capture.mjs — capture the LIVE v2 site as the parity reference.
// Emits baseline/site-inventory.json (computed styles) + baseline/site-shots/*.png.
// Run: npm run parity:site
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const urls = JSON.parse(fs.readFileSync(path.join(dir, 'urls.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(dir, 'selector-map.json'), 'utf8'));
const outDir = path.join(dir, 'baseline');
const shotDir = path.join(outDir, 'site-shots');
fs.mkdirSync(shotDir, { recursive: true });

// The property set that defines "material". Extend here, never per-selector.
const PROPS = [
  'background-image', 'background-color', 'box-shadow',
  'border-top-color', 'border-top-width', 'border-top-style', 'border-radius',
  'color', 'font-family', 'font-size', 'font-weight', 'font-variant-caps',
  'letter-spacing', 'text-transform',
];

const siteSelectors = [...new Set(map.pairs.map(p => p.site))];

const browser = await chromium.launch();
const entries = {};
for (const scheme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const u of urls) {
    const res = await page.goto(u.url, { waitUntil: 'networkidle' });
    if (!res || !res.ok()) throw new Error(`${u.id}: HTTP ${res && res.status()} for ${u.url}`);
    // Force the colour scheme via the site's own toggle attribute.
    await page.evaluate(s => document.body.setAttribute('data-md-color-scheme', s === 'dark' ? 'slate' : 'default'), scheme);
    await page.waitForSelector(u.waitFor, { timeout: 15000 });
    await page.waitForTimeout(300); // let CSS transitions settle

    const styles = await page.evaluate(({ selectors, props }) => {
      const out = {};
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (!el) continue;                       // absent on this page — fine
        const cs = getComputedStyle(el);
        out[sel] = Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p).trim()]));
      }
      return out;
    }, { selectors: siteSelectors, props: PROPS });

    entries[`${u.id}--${scheme}`] = styles;
    await page.screenshot({ path: path.join(shotDir, `${u.id}--${scheme}.png`), fullPage: false });
    console.log(`captured ${u.id}--${scheme} (${Object.keys(styles).length} selectors)`);
  }
  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(outDir, 'site-inventory.json'), JSON.stringify({
  capturedAt: new Date().toISOString(),
  note: 'Reference captured from the LIVE site. Regenerate deliberately; review the diff.',
  entries,
}, null, 2) + '\n');
console.log(`wrote baseline/site-inventory.json (${Object.keys(entries).length} page/scheme entries)`);
```

- [ ] **Step 3: Seed the selector map.** Task 2 completes it; this task needs it to exist so
  the capture knows what to sample. Create `visual-harness/parity/selector-map.json`:

```json
{
  "note": "site selector <-> plugin selector. The parity contract. Add a pair when a surface is ported.",
  "pairs": [
    { "id": "card",          "site": ".sc-ability",              "plugin": ".dse-feature",            "why": "card surface + border/radius" },
    { "id": "section",       "site": ".sc-ability__section",     "plugin": ".dse-section",            "why": "boxed panel surface" },
    { "id": "section-head",  "site": ".sc-ability__section-head","plugin": ".dse-section__head",      "why": "sheen gradient + hairline" },
    { "id": "chip",          "site": ".sc-ability__cost",        "plugin": ".dse-head__deck--chip",   "why": "forged chip: sheen + inset bevel" },
    { "id": "pr-head",       "site": ".sc-ability__pr-head",     "plugin": ".dse-pr__head",           "why": "power-roll head sheen" },
    { "id": "tier-row",      "site": ".sc-ability__tier",        "plugin": ".dse-pr__row",            "why": "tier-coloured wash" },
    { "id": "head",          "site": ".sc-head",                 "plugin": ".dse-head",               "why": "card head typography" },
    { "id": "statblock",     "site": ".sb-wrap",                 "plugin": ".dse-sb",                 "why": "statblock plate + role tint" },
    { "id": "featureblock",  "site": ".fb-wrap",                 "plugin": ".dse-fb",                 "why": "featureblock band" }
  ]
}
```

> **Implementer:** `.dse-pr__row` and `.dse-sb` are *asserted* here from the class-vocabulary
> scan; **verify each plugin selector actually exists** in `styles-source.css` /
> rendered harness DOM before relying on it, and correct the map if a name differs. A wrong
> selector silently yields "absent" and would hide a gap — Task 2 Step 4 catches this.

- [ ] **Step 4: Wire the npm script.** In `package.json` `scripts`, add:

```json
"parity:site": "node visual-harness/parity/site-capture.mjs"
```

- [ ] **Step 5: Run the capture.**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run parity:site'`
Expected: one `captured <id>--<scheme>` line per URL per scheme (24 lines for 12 URLs), then
`wrote baseline/site-inventory.json`. Any HTTP error throws — fix the URL and re-run.

- [ ] **Step 6: Eyeball the captured PNGs.** Open at least
  `baseline/site-shots/ability-powerroll--dark.png`, `statblock-minion--dark.png`,
  `featureblock-malice--dark.png` and confirm they show real pages (not cookie walls, not
  404s, not half-loaded). Delete and re-capture any that look wrong.

- [ ] **Step 7: Write the README.** Create `visual-harness/parity/README.md` explaining: what
  the inventory is, that it is the reference of record, `npm run parity:site` regenerates it
  (deliberate act — review the JSON diff), `npm run parity` checks the plugin against it, and
  how to add a surface (add a pair to `selector-map.json`, re-run both).

- [ ] **Step 8: Commit.**

```bash
git add visual-harness/parity package.json
git commit -m "feat(parity): capture the live v2 site as a machine-readable style inventory"
```

---

### Task 2: Extract the plugin's inventory and produce the gap report

**Files:**
- Create: `visual-harness/parity/plugin-capture.mjs`
- Create: `visual-harness/parity/diff.mjs`
- Modify: `package.json` (add `parity` script)
- Modify: `visual-harness/parity/selector-map.json` (correct/complete the pairs)

**Interfaces:**
- Consumes: `baseline/site-inventory.json`, `selector-map.json` (Task 1).
- Produces: `visual-harness/parity/plugin-inventory.json` (gitignored — regenerated) and
  `visual-harness/parity/parity-report.md`; `npm run parity` exits non-zero on gaps.
  Tasks 3–6 drive this report to zero.

- [ ] **Step 1: Write the plugin extractor.** It renders each harness element and samples the
  same properties. Create `visual-harness/parity/plugin-capture.mjs`:

```js
// visual-harness/parity/plugin-capture.mjs — sample the plugin harness with the SAME property
// set as site-capture.mjs, so the two inventories are directly comparable.
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const map = JSON.parse(fs.readFileSync(path.join(dir, 'selector-map.json'), 'utf8'));
const harness = `file://${path.join(dir, '..', 'index.html')}`;

const PROPS = [
  'background-image', 'background-color', 'box-shadow',
  'border-top-color', 'border-top-width', 'border-top-style', 'border-radius',
  'color', 'font-family', 'font-size', 'font-weight', 'font-variant-caps',
  'letter-spacing', 'text-transform',
];

// Elements whose render exercises the mapped surfaces.
const ELEMENTS = ['feature', 'statblock', 'featureblock', 'kit', 'condition'];
const pluginSelectors = [...new Set(map.pairs.map(p => p.plugin))];

const browser = await chromium.launch();
const entries = {};
for (const bg of ['dark', 'light']) {
  for (const el of ELEMENTS) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
    await page.goto(`${harness}?element=${el}&theme=steel&bg=${bg}`);
    await page.waitForFunction(() => window.__dseHarnessDone === true, { timeout: 20000 });
    const styles = await page.evaluate(({ selectors, props }) => {
      const out = {};
      for (const sel of selectors) {
        const node = document.querySelector(sel);
        if (!node) continue;
        const cs = getComputedStyle(node);
        out[sel] = Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p).trim()]));
      }
      return out;
    }, { selectors: pluginSelectors, props: PROPS });
    entries[`${el}--${bg}`] = styles;
    await page.close();
    console.log(`sampled ${el}--${bg} (${Object.keys(styles).length} selectors)`);
  }
}
await browser.close();
fs.writeFileSync(path.join(dir, 'plugin-inventory.json'),
  JSON.stringify({ capturedAt: new Date().toISOString(), entries }, null, 2) + '\n');
console.log('wrote plugin-inventory.json');
```

> **Implementer:** confirm the harness query params (`element`/`theme`/`bg`) and the
> `window.__dseHarnessDone` flag by reading `visual-harness/shoot.mjs` lines 40–55, which
> already drives the harness this way. Match whatever it does; do not invent params.

- [ ] **Step 2: Write the diff.** It reports three failure classes; "flat where the site has a
  gradient" is the one that would have caught plan 19. Create `visual-harness/parity/diff.mjs`:

```js
// visual-harness/parity/diff.mjs — compare plugin-inventory against the site baseline.
// Exit 1 if any MATERIAL gap remains. Writes parity-report.md.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const site = JSON.parse(fs.readFileSync(path.join(dir, 'baseline', 'site-inventory.json'), 'utf8'));
const plug = JSON.parse(fs.readFileSync(path.join(dir, 'plugin-inventory.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(dir, 'selector-map.json'), 'utf8'));

const isFlat = v => !v || v === 'none';
const firstSite = sel => {          // first captured occurrence of a site selector, dark scheme
  for (const [k, v] of Object.entries(site.entries)) if (k.endsWith('--dark') && v[sel]) return v[sel];
  return null;
};
const firstPlug = sel => {
  for (const [k, v] of Object.entries(plug.entries)) if (k.endsWith('--dark') && v[sel]) return v[sel];
  return null;
};

const rows = [];
for (const pair of map.pairs) {
  const s = firstSite(pair.site);
  const p = firstPlug(pair.plugin);
  if (!s) { rows.push({ sev: 'WARN', pair, msg: `site selector ${pair.site} never captured — check urls.json` }); continue; }
  if (!p) { rows.push({ sev: 'WARN', pair, msg: `plugin selector ${pair.plugin} never rendered — check selector-map.json` }); continue; }
  // 1. Material: site has a gradient, plugin is flat.
  if (!isFlat(s['background-image']) && isFlat(p['background-image']))
    rows.push({ sev: 'GAP', pair, msg: `flat surface: site background-image="${s['background-image']}", plugin="none"` });
  // 2. Material: site has a bevel/shadow, plugin has none.
  if (!isFlat(s['box-shadow']) && isFlat(p['box-shadow']))
    rows.push({ sev: 'GAP', pair, msg: `no bevel: site box-shadow="${s['box-shadow']}", plugin="none"` });
  // 3. Material: site has a visible hairline, plugin has none.
  if (s['border-top-style'] !== 'none' && p['border-top-style'] === 'none')
    rows.push({ sev: 'GAP', pair, msg: `no hairline: site border-top ${s['border-top-width']} ${s['border-top-color']}` });
}

const gaps = rows.filter(r => r.sev === 'GAP');
const out = [
  '# Steel material parity report', '',
  `Site baseline captured: ${site.capturedAt}`, `Plugin sampled: ${plug.capturedAt}`, '',
  `**${gaps.length} material gap(s), ${rows.length - gaps.length} warning(s).**`, '',
  ...rows.map(r => `- **${r.sev}** \`${r.pair.id}\` (${r.pair.site} → ${r.pair.plugin}): ${r.msg}`),
  '',
].join('\n');
fs.writeFileSync(path.join(dir, 'parity-report.md'), out);
console.log(out);
process.exit(gaps.length === 0 ? 0 : 1);
```

- [ ] **Step 3: Wire the script.** Add to `package.json` `scripts`:

```json
"parity": "npm run harness:build && node visual-harness/parity/plugin-capture.mjs && node visual-harness/parity/diff.mjs"
```

Also add `visual-harness/parity/plugin-inventory.json` and
`visual-harness/parity/parity-report.md` to `.gitignore` (regenerated artifacts).

- [ ] **Step 4: Run it — expect FAILURE, and fix the selector map from the WARNs.**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run parity'`
Expected: exit 1 with a list of `GAP` rows (this is the baseline gap set that Tasks 3–6
close). **Any `WARN` about a selector that never rendered is a bug in `selector-map.json`,
not a real gap** — correct the selector (inspect the harness DOM) and re-run until zero
WARNs remain. Record the starting GAP count in the commit message.

- [ ] **Step 5: Commit.**

```bash
git add visual-harness/parity package.json .gitignore
git commit -m "feat(parity): plugin inventory extractor + site-vs-plugin gap report (N gaps baseline)"
```

---

### Task 3: Port the material primitives (the core fix)

Adds the two missing metal text tokens and a **sheen + bevel + hairline** treatment to the
shared primitives. Because these classes are produced by the kit for every element, this one
task should close the majority of the gap report.

**Files:**
- Modify: `draw-steel-elements/styles-source.css` (Steel token block ~line 3114 and the
  light variant ~line 3802; then the primitive rules)

**Interfaces:**
- Consumes: `parity-report.md` (Task 2) — the GAP list is the worklist.
- Produces: `--dse-metal`, `--dse-metal-bright`, `--dse-sheen`, `--dse-bevel` tokens
  consumed by Tasks 4, 5, 6.

- [ ] **Step 1: Add the missing tokens.** In the `[data-dse-element][data-dse-theme="steel"]`
  block (dark, alongside the existing `--dse-metal-grad` at ~line 3141) add — values copied
  verbatim from the site's `steel-redesign.css:15-19`:

```css
	/* Flat metal text colours — the site's --fx-metal / --fx-metal-bright (steel-redesign.css:15-16).
	   Chip text and section tags read as brushed metal, not body grey. */
	--dse-metal: #a9b0b5;
	--dse-metal-bright: #d9dee1;
	/* The material overlays. Translucent so they compose over ANY surface token
	   (site technique: steel-ability-cards.css:117,160,184). */
	--dse-sheen: linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.14));
	--dse-sheen-soft: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0));
	--dse-bevel: inset 0 1px 0 rgba(255,255,255,.08), 0 1px 3px rgba(0,0,0,.3);
```

  And in the `.theme-light [data-dse-element][data-dse-theme="steel"]` block (~line 3802),
  the light-scheme counterparts (site `steel-redesign.css:25-26` + `:119`):

```css
	--dse-metal: #5f676c;
	--dse-metal-bright: #2c3338;
	--dse-sheen: linear-gradient(180deg, rgba(255,255,255,.9), rgba(0,0,0,.04));
	--dse-sheen-soft: linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,0));
	--dse-bevel: inset 0 1px 0 rgba(255,255,255,.6), 0 1px 3px rgba(0,0,0,.12);
```

  Also add inert defaults to the **base** token block (~line 2995, next to
  `--dse-metal-grad: none;`) so Legacy resolves to nothing:

```css
	--dse-metal: inherit;
	--dse-metal-bright: inherit;
	--dse-sheen: none;
	--dse-sheen-soft: none;
	--dse-bevel: none;
```

- [ ] **Step 2: Apply the chip treatment.** Append a Steel-scoped block (keep it next to the
  existing Steel rules; scope with `:not([data-dse-print="on"])` per plan 19 Task 1):

```css
/* --- Steel material: forged chips ------------------------------------------
   Site parity: .sc-ability__cost (steel-ability-cards.css:115-119) — sheen
   gradient + inset bevel + hairline is what reads as "stamped metal". Applying
   it to the shared chip modifiers covers every element's head chips at once. */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) :is(
	.dse-head__eyebrow--chip,
	.dse-head__primary--chip,
	.dse-head__deck--chip
) {
	background-image: var(--dse-sheen);
	border: 1px solid var(--dse-metal-line);
	border-radius: 7px;
	box-shadow: var(--dse-bevel);
	color: var(--dse-metal-bright);
}
```

- [ ] **Step 3: Apply the panel/section treatment.**

```css
/* --- Steel material: boxed panels ------------------------------------------
   Site parity: .sc-ability__section-head / .sc-ability__pr-head
   (steel-ability-cards.css:160,184) — a soft top-light sheen over the head
   strip plus a hairline separating it from the body. */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) :is(
	.dse-section__head,
	.dse-pr__head,
	.dse-fb__adv-head
) {
	background-image: var(--dse-sheen-soft);
	border-bottom: 1px solid var(--dse-metal-faint);
}
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-section {
	border: 1px solid var(--dse-metal-faint);
	border-radius: 8px;
	overflow: hidden; /* keeps the head sheen inside the rounded corner */
}
```

- [ ] **Step 4: Apply the metal text colour to small-caps tags.**

```css
/* Site parity: .sc-ability__section-head .tag (steel-ability-cards.css:186-187). */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) :is(
	.dse-section__head,
	.dse-head__eyebrow--line
) {
	color: var(--dse-metal-bright);
}
```

- [ ] **Step 5: Rebuild and re-run parity.**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run parity'`
Expected: GAP count **substantially lower** than Task 2's baseline (chip, section-head,
pr-head, section rows should clear). Remaining gaps are Tasks 4–6's worklist.

- [ ] **Step 6: Prove the Legacy + print freeze.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run shots'
cd /home/scott/code/steelCompendium/workspace/draw-steel-elements
git status --porcelain visual-harness/shots/ | grep -E 'legacy|steel-print' && echo "FREEZE VIOLATED" || echo "freeze OK"
```

Expected: `freeze OK` (no legacy/print PNG modified). If violated, the new rule leaked out of
the Steel scope — fix the selector, do not rebaseline.

- [ ] **Step 7: Full gates + commit.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run tsc && npx jest 2>&1 | tail -5'
git add styles-source.css visual-harness/shots
git commit -m "feat(steel): port the site's material layer — sheen, bevel, hairline on shared primitives"
```

---

### Task 4: Tier and role colour washes

The site bleeds the tier/role colour into its rows and bands; the plugin renders them grey.
This is the most *visible* remaining colour gap.

**Files:**
- Modify: `draw-steel-elements/styles-source.css`

**Interfaces:**
- Consumes: `--dse-tier-*` / role tint tokens (already defined — verify names before use)
  and `--dse-sheen*` (Task 3).

- [ ] **Step 1: Confirm the existing tier/role token names.**

Run: `grep -nE '\-\-dse-(tier|role)[a-z0-9-]*:' styles-source.css | head -20`
Expected: the tier and role tint tokens with their values. **Use these exact names below** —
if they differ from `--dse-tier-low/mid/high`, substitute the real ones.

- [ ] **Step 2: Add the tier-row wash.** Site parity:
  `.sc-ability__tier` (`steel-ability-cards.css:166-171`) — a left-anchored colour wash that
  fades out by 60%, plus a 3px left border in the tier colour:

```css
/* --- Steel material: tier rows --------------------------------------------
   Site parity: steel-ability-cards.css:166-171. --t is the per-row tier colour;
   the wash is what makes tier rows read as coloured rather than grey. */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-pr__row {
	border-left: 3px solid var(--t, var(--dse-rule));
	background-image: linear-gradient(90deg,
		color-mix(in srgb, var(--t, transparent) 8%, transparent), transparent 60%);
}
[data-dse-element][data-dse-theme="steel"] .dse-pr__row:has(.dse-pr__badge--t1)   { --t: var(--dse-tier-low); }
[data-dse-element][data-dse-theme="steel"] .dse-pr__row:has(.dse-pr__badge--t2)   { --t: var(--dse-tier-mid); }
[data-dse-element][data-dse-theme="steel"] .dse-pr__row:has(.dse-pr__badge--t3)   { --t: var(--dse-tier-high); }
[data-dse-element][data-dse-theme="steel"] .dse-pr__row:has(.dse-pr__badge--crit) { --t: var(--dse-tier-crit); }
```

> **Implementer:** if `.dse-pr__row` does not exist (Task 2 Step 4 would have WARNed), find
> the real tier-row class in the rendered harness DOM and use it. If `:has()` is unavailable
> in the Obsidian Electron version pinned by `minAppVersion` (0.15.0 — check, Electron may
> predate `:has()`), fall back to setting `--t` on the row from the badge modifier class
> already present on the row itself, or add a `data-tier` attribute **only if** the DOM
> already carries one — do **not** add new DOM.

- [ ] **Step 3: Verify the tier wash visually.**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run shots -- --element=feature'`
Then **read** `visual-harness/shots/feature--steel-dark.png` and compare against
`visual-harness/parity/baseline/site-shots/ability-powerroll--dark.png`. The `≤11 / 12-16 /
17+ / crit` rows must show a left-edge colour wash, not flat grey.

- [ ] **Step 4: Freeze check + gates + commit.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run shots && npm run tsc && npx jest 2>&1 | tail -5'
cd /home/scott/code/steelCompendium/workspace/draw-steel-elements
git status --porcelain visual-harness/shots/ | grep -E 'legacy|steel-print' && echo "FREEZE VIOLATED" || echo "freeze OK"
git add styles-source.css visual-harness/shots
git commit -m "feat(steel): tier-coloured row washes (site parity)"
```

---

### Task 5: Crest accent, statblock role band, featureblock band

**Files:**
- Modify: `draw-steel-elements/styles-source.css`

- [ ] **Step 1: Colour the crest glyph.** On the site the crest's inner glyph carries the
  accent colour (compare `baseline/site-shots/ability-powerroll--dark.png` — blue figure —
  against the plugin's grey). Find the crest rule
  (`grep -n 'dse-crest' styles-source.css`) and add, Steel-scoped:

```css
/* Site parity: the crest glyph is accent-tinted, the shield stays brushed metal. */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-crest__glyph {
	color: var(--dse-accent);
}
```

> Verify `--dse-accent` exists (`grep -n '\-\-dse-accent' styles-source.css`); if the accent
> token has another name, use it. If the crest glyph class differs, use the real one.

- [ ] **Step 2: Give the statblock head its role-tinted gradient band.** Site parity:
  `steel-statblock.css` — sample the captured value for `.sb-wrap` /
  the statblock head in `baseline/site-inventory.json` and mirror it:

```css
/* Site parity: role-tinted header band. --dse-role-tint is set per-statblock by
   the existing role plumbing (F2 role||organization fallback). */
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-sb .dse-head {
	background-image: linear-gradient(180deg,
		color-mix(in srgb, var(--dse-role-tint, transparent) 22%, transparent),
		transparent 78%);
	border-bottom: 1px solid var(--dse-metal-line);
}
```

> **Read the captured site value first** and match its direction/stops rather than accepting
> these numbers blind — the exact ramp is in
> `baseline/site-inventory.json` under the statblock entries. Adjust to match; note the
> source line in the commit.

- [ ] **Step 3: Featureblock band sheen.**

```css
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-fb__band--adv,
[data-dse-element][data-dse-theme="steel"]:not([data-dse-print="on"]) .dse-fb .dse-head {
	background-image: var(--dse-sheen-soft);
	border-bottom: 1px solid var(--dse-metal-faint);
}
```

- [ ] **Step 4: Verify visually against the captured references.**

Run `npm run shots`, then **read** and compare each pair:
- `shots/statblock--steel-dark.png` vs `parity/baseline/site-shots/statblock-minion--dark.png`
- `shots/featureblock--steel-dark.png` vs `parity/baseline/site-shots/featureblock-malice--dark.png`
- `shots/feature--steel-dark.png` vs `parity/baseline/site-shots/ability-powerroll--dark.png`

Note any residual difference in the commit message; genuine deferrals go to FOLLOWUPS.

- [ ] **Step 5: Freeze check + gates + commit.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run shots && npm run tsc && npx jest 2>&1 | tail -5'
cd /home/scott/code/steelCompendium/workspace/draw-steel-elements
git status --porcelain visual-harness/shots/ | grep -E 'legacy|steel-print' && echo "FREEZE VIOLATED" || echo "freeze OK"
git add styles-source.css visual-harness/shots
git commit -m "feat(steel): crest accent + statblock role band + featureblock band (site parity)"
```

---

### Task 6: Drive the gap report to zero

Tasks 3–5 target the primitives; this task walks whatever remains, including families with no
site counterpart.

**Files:**
- Modify: `draw-steel-elements/styles-source.css`
- Modify: `visual-harness/parity/urls.json`, `selector-map.json` (add surfaces as needed)
- Modify: workspace `FOLLOWUPS.md` (for justified deferrals)

- [ ] **Step 1: Re-run parity and read the report.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run parity'
cat visual-harness/parity/parity-report.md
```

- [ ] **Step 2: Close each remaining GAP** by extending the Steel rules, always preferring a
  shared primitive over a per-element rule. For every fix, cite the site source
  (`file:line` or the inventory entry) in a CSS comment.

- [ ] **Step 3: Handle plugin-only surfaces.** Trackers, hero sheet, sidebar and modals have
  no site counterpart, so parity cannot check them. Give them the same material vocabulary by
  reusing `--dse-sheen*`/`--dse-bevel`/`--dse-metal-*` so they read as one system. Do **not**
  invent new colours. Then read `shots/hero--steel-dark.png`,
  `shots/initiative--steel-dark.png`, `shots/encounter--steel-dark.png` and confirm they look
  coherent with the card family.

- [ ] **Step 4: Defer honestly.** Any gap that cannot be closed without a DOM change gets a
  numbered `FOLLOWUPS.md` item (take N from the `next-id` counter, then bump it) naming the
  selector, the site value, the plugin value, and why DOM is required. **Do not** silence a
  gap by editing the selector map.

- [ ] **Step 5: Verify zero (or documented) gaps.**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run parity'`
Expected: exit 0. If deferrals exist, add their `pair.id` to an `"expectedGaps": []` array in
`selector-map.json`, have `diff.mjs` treat those as WARN not GAP, and reference the FOLLOWUPS
number in the array's sibling `"note"`.

- [ ] **Step 6: Full gates + freeze + commit.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run shots && npm run tsc && npx jest 2>&1 | tail -5'
cd /home/scott/code/steelCompendium/workspace/draw-steel-elements
git status --porcelain visual-harness/shots/ | grep -E 'legacy|steel-print' && echo "FREEZE VIOLATED" || echo "freeze OK"
git add styles-source.css visual-harness/parity visual-harness/shots
git commit -m "feat(steel): close remaining material parity gaps; harmonize plugin-only surfaces"
```

---

### Task 7: Lock parity in as a permanent gate

Parity checked once is parity lost next quarter. This makes "the surfaces are flat" a
**failing test**, not a missed eyeball.

**Files:**
- Create: `draw-steel-elements/test/dom/theme/steelMaterial.test.ts`
- Modify: `draw-steel-elements/visual-harness/parity/README.md`

**Interfaces:**
- Consumes: the material tokens from Task 3.

- [ ] **Step 1: Write the failing test.** jsdom does not compute gradients from a stylesheet,
  so assert on the **rule text** — that each primitive carries a non-`none` background-image
  and a bevel under Steel. Create `test/dom/theme/steelMaterial.test.ts`:

```ts
import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// The material contract: these Steel-scoped primitives MUST carry a sheen and/or bevel.
// Guards the plan-19 regression where the structure shipped but every surface was flat.
const css = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'styles-source.css'), 'utf8');

const steelBlocksFor = (selector: string): string[] => {
	// Collect every rule body whose selector list mentions `selector` AND the steel theme.
	const rules: string[] = [];
	const re = /([^{}]+)\{([^{}]*)\}/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(css))) {
		const sel = m[1];
		if (sel.includes(selector) && sel.includes('[data-dse-theme="steel"]')) rules.push(m[2]);
	}
	return rules;
};

describe('Steel material contract', () => {
	it('defines the material tokens in the Steel block', () => {
		for (const token of ['--dse-metal:', '--dse-metal-bright:', '--dse-sheen:', '--dse-bevel:']) {
			expect(css).toContain(token);
		}
	});

	it.each([
		['.dse-head__deck--chip', /background-image:\s*var\(--dse-sheen/],
		['.dse-section__head', /background-image:\s*var\(--dse-sheen/],
		['.dse-pr__head', /background-image:\s*var\(--dse-sheen/],
	])('%s carries a sheen under Steel', (selector, pattern) => {
		const blocks = steelBlocksFor(selector);
		expect(blocks.length).toBeGreaterThan(0);
		expect(blocks.some(b => pattern.test(b))).toBe(true);
	});

	it('chips carry an inset bevel under Steel', () => {
		const blocks = steelBlocksFor('.dse-head__deck--chip');
		expect(blocks.some(b => /box-shadow:\s*var\(--dse-bevel\)/.test(b))).toBe(true);
	});

	it('tier rows carry a colour wash under Steel', () => {
		const blocks = steelBlocksFor('.dse-pr__row');
		expect(blocks.some(b => /color-mix\(/.test(b))).toBe(true);
	});
});
```

- [ ] **Step 2: Run it — expect PASS** (Tasks 3–4 already implemented the contract).

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npx jest test/dom/theme/steelMaterial.test.ts'`
Expected: all pass. **If any fail, the corresponding Task 3/4 rule is missing or renamed —
fix the CSS, not the test.**

- [ ] **Step 3: Prove the test actually guards.** Temporarily delete the
  `background-image: var(--dse-sheen);` line from the chip rule, re-run the test, confirm it
  **FAILS**, then restore the line and confirm it passes. (A gate that cannot fail is not a
  gate — this is the step plan 19 lacked.)

- [ ] **Step 4: Document the workflow** in `visual-harness/parity/README.md`: run
  `npm run parity` after any Steel CSS change; regenerate the site baseline with
  `npm run parity:site` **only** when the site itself changes, and review the JSON diff in
  the PR.

- [ ] **Step 5: Full gates + commit.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run tsc && npx jest 2>&1 | tail -5'
git add test/dom/theme/steelMaterial.test.ts visual-harness/parity/README.md
git commit -m "test(steel): material contract assertions — flat surfaces now fail the suite"
```

---

### Task 8: Contact sheets, docs, and wrap

**Files:**
- Create: `.superpowers/sdd/shots-parity/` (side-by-side sheets for Scott — session scratch)
- Modify: `docs/superpowers/dse-overhaul/D3-token-map.md`
- Modify: `draw-steel-elements/CHANGELOG.md`
- Modify: workspace `CHANGELOG.md`, `ROADMAP.md`

- [ ] **Step 1: Run the full battery.**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run tsc && npx jest 2>&1 | tail -5 && npm run shots && npm run parity'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/draw-steel-elements && npm run obsidian-shots 2>&1 | tail -5'
```

Expected: tsc clean · jest ≥1981+new · shots 295 · parity exit 0 · obsidian-shots 131.
Record the exact numbers.

- [ ] **Step 2: Build side-by-side contact sheets** for the five headline families (feature,
  statblock, featureblock, kit, condition), each pairing
  `visual-harness/parity/baseline/site-shots/<id>--dark.png` with the matching
  `visual-harness/shots/<element>--steel-dark.png`, into
  `.superpowers/sdd/shots-parity/NN-<family>--{site,plugin}.png`. **Read every pair** and
  write a one-line verdict per family in the report.

- [ ] **Step 3: Update the token map.** In
  `docs/superpowers/dse-overhaul/D3-token-map.md`, document `--dse-metal`,
  `--dse-metal-bright`, `--dse-sheen`, `--dse-sheen-soft`, `--dse-bevel`, their site
  provenance (`steel-redesign.css:15-29`, `steel-ability-cards.css:115-119,160,184`), and the
  rule that **material belongs on shared primitives, never per-element**.

- [ ] **Step 4: Changelogs.** Amend the plugin `CHANGELOG.md` 6.0.0 Steel bullet to state the
  theme matches the site's material treatment (it currently over-claims a match that plan 19
  did not deliver). Add a workspace `CHANGELOG.md` `## Unreleased` bullet.

- [ ] **Step 5: File the shared-package ROADMAP item.** Add a numbered item to
  `ROADMAP.md` (take N from its `next-id` counter, then bump): "Extract a shared
  steel-design token/CSS package for site + plugin" — recording the Task 1 token contract as
  the seam, the ~40–60% overlap estimate, the `sc-`/`dse-` class-vocabulary migration as the
  main cost, and that the parity gate (Tasks 2/7) is the cheaper interim answer.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "docs: steel material parity — token map, changelogs, shared-package roadmap item"
```

---

## Self-review

**Spec coverage.** Scott's asks map as follows: *fresh live-site screenshots instead of stale
workspace ones* → Task 1 (Steps 1–6, incl. explicit verification that each URL is live and
covers pages that previously had no shot); *be very thorough since I can't verify* → Tasks 2
and 7 replace human eyeballing with a machine gate that fails on flat surfaces, and Task 7
Step 3 proves the gate can fail; *the actual visual fix* → Tasks 3–6; *site/plugin parity
mechanism* → Task 2 + Task 7 (automated), Task 8 Step 5 (the deeper consolidation, recorded
with reasoning rather than silently dropped).

**Placeholder scan.** No "TBD"/"handle edge cases"/"similar to Task N". Every CSS step ships
literal declarations; every token value is copied verbatim from a cited site source line.
Three places instruct the implementer to *verify a name and correct it* (`.dse-pr__row`,
`.dse-sb`, `--dse-accent`, the harness query params) — these are deliberate: the plan states
the asserted value, the evidence for it, and the exact failure mode if it is wrong, rather
than pretending certainty I do not have. Task 2 Step 4 mechanically catches all of them.

**Type/name consistency.** `--dse-metal`, `--dse-metal-bright`, `--dse-sheen`,
`--dse-sheen-soft`, `--dse-bevel` are introduced once (Task 3 Step 1) and reused unchanged in
Tasks 4, 5, 6, 7. `site-inventory.json` / `plugin-inventory.json` / `selector-map.json` /
`parity-report.md` keep the same names and shapes across Tasks 1, 2, 6, 7. The `PROPS` array
is identical in `site-capture.mjs` and `plugin-capture.mjs` — if one changes, both must.

**Known risk.** The single biggest risk is a wrong plugin selector in `selector-map.json`
silently reporting "absent" instead of a gap. Task 2 Step 4 makes zero-WARNs a precondition
for proceeding, and Task 6 Step 4 forbids silencing a gap by editing the map.

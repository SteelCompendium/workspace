# P1 — v2 UX Bug Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the five shipped UX defects found in the 2026-07-01 UX review: mobile statblock-name collapse, hidden page titles on class/chapter pages, the bare 404 page, the leftover `index_old` page (which is also the phantom "Browse Rules" sidebar entry), and home-page polish.

**Architecture:** All changes live in the `v2` repo (CSS in `docs/stylesheets/`, a Jinja override in `overrides/`, hand-authored markdown in `static_content/` + `docs/index.md`). No steel-etl change. Verification is via the repo's existing e2e pattern (playwright-core driving Brave against a local `mkdocs build` + `http.server`).

**Tech Stack:** MkDocs Material, CSS (`:has()` selectors), Jinja2 template override, playwright-core e2e (`tests/e2e/*.e2e.cjs`), node:test.

**Context docs:** UX findings: workspace `docs/superpowers/specs/2026-07-01-v2-ux-analysis.md` §2. v2 rules: `v2/CLAUDE.md` (never edit `docs/Browse|Read|scc` generated content — the only generated-file edits below are *deletions* whose static_content source is also deleted, so regen does not resurrect them). Design language: workspace `DESIGN.md`.

## Global Constraints

- Work in an isolated worktree (`just wt-new p1-bugfix` from the workspace root), never the shared main checkout. Land with `just wt-finish p1-bugfix`.
- All shell commands need the devbox toolchain: prefix with `devbox run --` (run from the workspace root of the worktree, e.g. `devbox run -- mkdocs build` executed with cwd `<worktree>/v2`).
- Never hand-edit generated output under `v2/docs/Browse/`, `v2/docs/Read/`, `v2/docs/scc/` — exception in Task 4 is a *deletion* paired with deleting its `static_content` source.
- Client JS must be `navigation.instant`-safe (register via `document$`, not `DOMContentLoaded`) — applies to Task 5's template only if you add script; the tasks below add none.
- No commit-attribution trailers (no Co-Authored-By).
- Local build for e2e: `cd v2 && devbox run -- mkdocs build && devbox run -- python3 -m http.server 8124 --directory site &`

---

### Task 1: E2E regression test for visible/hidden page titles

**Files:**
- Create: `v2/tests/e2e/page-titles.e2e.cjs`

**Interfaces:**
- Produces: an executable regression test used by Task 2 to prove the fix. Run:
  `devbox run -- node tests/e2e/page-titles.e2e.cjs` (cwd `v2`, after build+serve on port 8124).

The test asserts, on the locally built site:
1. `/Browse/class/fury/` — the `<h1>` **is visible** (currently fails: `display:none`).
2. `/Read/heroes/classes/` — the `<h1>` **is visible** (currently fails).
3. `/Browse/feature/ability/fury/level-1/brutal-slam/` — the `<h1>` **is hidden** (card supplies the title; must not regress).
4. `/Browse/monster/goblin/goblin-warrior/`, `/Browse/kit/panther/`, `/Browse/monster/goblin/goblin-malice/` — `<h1>` hidden (statblock/kit/featureblock leaves keep their card-head titles).

- [ ] **Step 1: Write the failing e2e test**

Copy the `resolvePlaywrightCore()` helper verbatim from `v2/tests/e2e/nav-drawer-keep.e2e.cjs` (lines 22–40), then:

```js
/*
 * page-titles.e2e.cjs — regression test for the H1 hide rules.
 * Leaf card pages hide the duplicate markdown H1 (the card renders the name);
 * class pages and Read chapters have no card-head replacement and MUST keep
 * their H1. See docs/superpowers/specs/2026-07-01-v2-ux-analysis.md §2.2.
 *
 * Run:
 *   cd v2
 *   devbox run -- mkdocs build
 *   devbox run -- python3 -m http.server 8124 --directory site &
 *   devbox run -- node tests/e2e/page-titles.e2e.cjs
 */
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

function resolvePlaywrightCore() { /* … copy from nav-drawer-keep.e2e.cjs … */ }

const BASE = process.env.E2E_BASE || "http://127.0.0.1:8124/";
const BRAVE = process.env.BRAVE_PATH || "/opt/brave.com/brave/brave";

const CASES = [
  { url: "Browse/class/fury/",                                   visible: true  },
  { url: "Read/heroes/classes/",                                 visible: true  },
  { url: "Browse/feature/ability/fury/level-1/brutal-slam/",     visible: false },
  { url: "Browse/monster/goblin/goblin-warrior/",                visible: false },
  { url: "Browse/kit/panther/",                                  visible: false },
  { url: "Browse/monster/goblin/goblin-malice/",                 visible: false },
];

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  let failures = 0;
  for (const c of CASES) {
    await page.goto(BASE + c.url, { waitUntil: "domcontentloaded" });
    const shown = await page.evaluate(() => {
      const h1 = document.querySelector(".md-content h1");
      if (!h1) return false;
      return getComputedStyle(h1).display !== "none" && h1.offsetHeight > 0;
    });
    const ok = shown === c.visible;
    console.log(`${ok ? "PASS" : "FAIL"} ${c.url} h1 ${shown ? "visible" : "hidden"} (want ${c.visible ? "visible" : "hidden"})`);
    if (!ok) failures++;
  }
  await browser.close();
  if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
  console.log("page-titles e2e: all pass");
})();
```

- [ ] **Step 2: Run it to verify it fails on the two visible-title cases**

```bash
cd v2 && devbox run -- mkdocs build
devbox run -- python3 -m http.server 8124 --directory site &
devbox run -- node tests/e2e/page-titles.e2e.cjs
```
Expected: `FAIL Browse/class/fury/ h1 hidden (want visible)` and `FAIL Read/heroes/classes/ …`; the four leaf cases PASS. Exit code 1.

- [ ] **Step 3: Commit the failing test**

```bash
git -C v2 add tests/e2e/page-titles.e2e.cjs
git -C v2 commit -m "test: e2e regression for leaf-vs-container H1 visibility"
```

---

### Task 2: Scope the H1-hide CSS to true leaf pages

**Files:**
- Modify: `v2/docs/stylesheets/steel-ability-cards.css:209-216`
- Modify: `v2/docs/stylesheets/steel-statblock.css:46-53`
- Modify: `v2/docs/stylesheets/steel-kit.css:11-14`
- Modify: `v2/docs/stylesheets/steel-featureblock.css:31-34`

**Interfaces:**
- Consumes: Task 1's e2e test.
- Produces: the corrected selector pattern `h1:first-child:has(+ hr + .<card>)` used by later plans (P3 adds `.sc-classhead` to this family).

Every generated leaf page is `# Name` → `---` → `<card element>` as adjacent siblings (verified for `.sc-ability`, `.sb-wrap`, `.sc-kit`, `.fb-wrap`). The current rules key on the card existing *anywhere* as a typeset child (`.md-typeset:has(> .sc-ability) > h1:first-child`), which also matches class pages and Read chapters that embed cards mid-flow. Re-key on **adjacency**.

- [ ] **Step 1: Replace the rule in steel-ability-cards.css**

Replace lines 209–216 with:

```css
/* ── generated ability/trait pages ──────────────────────────────
   steel-etl renders the card AS the page body, but still injects a
   markdown "# Name" (+ its --- rule) so MkDocs has a page title for
   the nav, browser tab, and TOC. On those LEAF pages the card is the
   immediate sibling of the h1+hr pair — hide the duplicate title by
   ADJACENCY, not by mere presence of a card: class pages and Read
   chapters also contain top-level .sc-ability cards mid-flow and
   must keep their titles (they have no card-head replacement).
   Regression test: tests/e2e/page-titles.e2e.cjs. */
.md-typeset > h1:first-child:has(+ hr + .sc-ability),
.md-typeset > h1:first-child + hr:has(+ .sc-ability) { display: none; }
```

- [ ] **Step 2: Replace the rule in steel-statblock.css**

Replace lines 51–52 (keeping the comment block above, updated):

```css
/* Hide the injected "# Name" H1 (+ its --- rule) ONLY when the .sb-wrap card
   directly follows it (a statblock leaf page). Adjacency-keyed so container
   pages embedding statblocks keep their own titles. */
.md-typeset > h1:first-child:has(+ hr + .sb-wrap),
.md-typeset > h1:first-child + hr:has(+ .sb-wrap) { display: none; }
```

- [ ] **Step 3: Replace the rule in steel-kit.css**

```css
/* ── MkDocs H1 hide (the plate carries its own name) — leaf pages only ── */
.md-typeset > h1:first-child:has(+ hr + .sc-kit),
.md-typeset > h1:first-child + hr:has(+ .sc-kit) { display: none; }
```

- [ ] **Step 4: Replace the rule in steel-featureblock.css**

```css
/* ── MkDocs H1 hide (the card carries its own name) — leaf pages only ── */
.md-typeset > h1:first-child:has(+ hr + .fb-wrap),
.md-typeset > h1:first-child + hr:has(+ .fb-wrap) { display: none; }
```

- [ ] **Step 5: Rebuild and run the e2e test**

```bash
cd v2 && devbox run -- mkdocs build
devbox run -- node tests/e2e/page-titles.e2e.cjs
```
Expected: all 6 cases PASS, exit 0.

- [ ] **Step 6: Visual spot-check**

Open `http://127.0.0.1:8124/Browse/class/fury/` — "Fury" title shows above the intro prose; `http://127.0.0.1:8124/Browse/feature/ability/fury/level-1/brutal-slam/` — no duplicate "Brutal Slam" above the card.

- [ ] **Step 7: Commit**

```bash
git -C v2 add docs/stylesheets/steel-ability-cards.css docs/stylesheets/steel-statblock.css docs/stylesheets/steel-kit.css docs/stylesheets/steel-featureblock.css
git -C v2 commit -m "fix: hide duplicate H1 only on true card leaf pages (adjacency-keyed)"
```

---

### Task 3: Stack the card-head right rail on narrow screens

**Files:**
- Modify: `v2/docs/stylesheets/steel-cardhead.css:119-123`
- Create: `v2/tests/e2e/cardhead-mobile.e2e.cjs`

**Interfaces:**
- Consumes: the `.sc-head` 6-slot grid (`steel-cardhead.css:13-49`).
- Produces: mobile stacking behavior other card work must preserve (all right-rail slots flow under the left stack at ≤30em).

Problem: `.sc-head { grid-template-columns: auto minmax(0,1fr) auto }` — column 3 (right rail) is content-sized, column 2 (the name) is the only shrinkable track. On a 390px phone a statblock's right-primary ("HORDE HARRIER", 1.35rem) squeezes the name to letter-per-line vertical wrap.

- [ ] **Step 1: Write the failing e2e test**

`v2/tests/e2e/cardhead-mobile.e2e.cjs` (same `resolvePlaywrightCore` boilerplate as Task 1):

```js
/*
 * cardhead-mobile.e2e.cjs — at a 390px viewport the statblock name must not
 * wrap letter-by-letter. We assert the h2 name renders in ≤ 2 line boxes:
 * height ≤ 2.4 × line-height. Run like the other e2e tests (build + :8124).
 */
"use strict";
// … resolvePlaywrightCore boilerplate …
const BASE = process.env.E2E_BASE || "http://127.0.0.1:8124/";
const BRAVE = process.env.BRAVE_PATH || "/opt/brave.com/brave/brave";

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: BRAVE, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(BASE + "Browse/monster/goblin/goblin-warrior/", { waitUntil: "domcontentloaded" });
  const m = await page.evaluate(() => {
    const el = document.querySelector(".sb__head .sc-head__left-primary");
    const cs = getComputedStyle(el);
    return { h: el.getBoundingClientRect().height, lh: parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.04 };
  });
  const lines = m.h / m.lh;
  const ok = lines <= 2.4;
  console.log(`${ok ? "PASS" : "FAIL"} goblin-warrior name renders in ~${lines.toFixed(1)} line boxes (want ≤ 2.4)`);
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd v2 && devbox run -- node tests/e2e/cardhead-mobile.e2e.cjs
```
Expected: FAIL — the name currently occupies ~7 line boxes.

- [ ] **Step 3: Extend the narrow-screen block in steel-cardhead.css**

Replace the existing block at lines 119–123:

```css
/* Mobile: wrap busy slots to a second line; never truncate. */
@media (max-width: 30em) {
  .sc-head__left-deck.sc-head__slot--line,
  .sc-head__slot--mini { white-space: normal; overflow-wrap: anywhere; }
}
```

with:

```css
/* Mobile: the right rail's content-sized column starves the name track
   (grid cols are auto · minmax(0,1fr) · auto), wrapping long names letter-
   by-letter. At phone widths drop the third column entirely and flow the
   right-rail slots UNDER the left stack (lanes 4–6), left-aligned. Empty
   slots are omitted from the DOM (writeCardHeadSlot), so unused lanes
   collapse. Regression test: tests/e2e/cardhead-mobile.e2e.cjs. */
@media (max-width: 30em) {
  .sc-head__left-deck.sc-head__slot--line,
  .sc-head__slot--mini { white-space: normal; overflow-wrap: anywhere; }

  .sc-head { grid-template-columns: auto minmax(0, 1fr); }
  .sc-head__right-eyebrow { grid-area: 4 / 2; }
  .sc-head__right-primary { grid-area: 5 / 2; }
  .sc-head__right-deck    { grid-area: 6 / 2; }
  .sc-head__right-eyebrow,
  .sc-head__right-primary,
  .sc-head__right-deck { justify-self: start; text-align: left; margin-left: 0; }
  .sc-head__right-primary { margin-top: .18rem; }
  /* crest still spans every lane in column 1 (rule at top of file uses 1/-1) */
}
```

- [ ] **Step 4: Rebuild, rerun the test**

```bash
cd v2 && devbox run -- mkdocs build && devbox run -- node tests/e2e/cardhead-mobile.e2e.cjs
```
Expected: PASS.

- [ ] **Step 5: Visual QA at 390px**

Check these in a 390px viewport (screenshot each): `Browse/monster/goblin/goblin-warrior/` (main head stacks: MONSTER / GOBLIN WARRIOR / Goblin, Humanoid / Level 1 / Horde Harrier / EV 3), `Browse/feature/ability/fury/level-1/brutal-slam/` (ability card head), a statblock **sub-feature** head (Spear Charge — its Signature chip now sits under the name; confirm it reads acceptably, and if it looks broken scope the stack rules with `:not(.sb__feat-head > .sc-head):not(.fb__feat-head > .sc-head)` instead), and `Browse/kit/panther/`.

- [ ] **Step 6: Commit**

```bash
git -C v2 add docs/stylesheets/steel-cardhead.css tests/e2e/cardhead-mobile.e2e.cjs
git -C v2 commit -m "fix: stack card-head right rail under the name on narrow screens"
```

---

### Task 4: Delete the leftover index_old page (also removes the phantom "Browse Rules" sidebar entry)

**Files:**
- Delete: `v2/static_content/docs/Browse/index_old.md`
- Delete: `v2/docs/Browse/index_old.md` (committed generated copy — its static source is gone, so `steel-etl site` will not recreate it)

The old Browse index was parked as `index_old.md`, is live at `/Browse/index_old/`, is search-indexed, and — because its H1 is "Browse Rules" — appears in the sidebar as a "Browse Rules" item duplicating the section index.

- [ ] **Step 1: Delete both files**

```bash
git -C v2 rm static_content/docs/Browse/index_old.md docs/Browse/index_old.md
```

- [ ] **Step 2: Rebuild and verify**

```bash
cd v2 && devbox run -- mkdocs build
test ! -e site/Browse/index_old/index.html && echo GONE
grep -rl "index_old" site/sitemap.xml || echo "not in sitemap"
```
Expected: `GONE` and `not in sitemap`.

- [ ] **Step 3: Verify the sidebar entry is gone**

Serve and load `/Browse/` — the primary sidebar under "Browse" must no longer show a "Browse Rules" child item (the section title itself remains).

- [ ] **Step 4: Commit**

```bash
git -C v2 commit -m "chore: remove leftover index_old Browse page (phantom 'Browse Rules' nav entry)"
```

---

### Task 5: Custom 404 page

**Files:**
- Create: `v2/overrides/404.html`

**Interfaces:**
- Consumes: Material's `main.html` template (already overridden in `v2/overrides/main.html` — extend that, keeping its SCC/settings head logic).

- [ ] **Step 1: Create the template**

```html
{% extends "main.html" %}

{% block content %}
<h1>Page not found</h1>
<p>This page doesn't exist — it may have moved when the site was reorganized.
Stable <code>/scc/…</code> permalinks never break, but older deep links can.</p>

<p><strong>Try search</strong> (press <kbd>/</kbd> or use the box in the header) — every
rule, ability, class, and monster is indexed.</p>

<div class="grid cards" markdown>
  <ul>
    <li><p><strong><a href="{{ config.site_url }}/Browse/">Browse the rules</a></strong><br>
        Look up abilities, classes, conditions, kits, monsters, and more.</p></li>
    <li><p><strong><a href="{{ config.site_url }}/Read/">Read the books</a></strong><br>
        Chapters in book order.</p></li>
    <li><p><strong><a href="{{ config.site_url }}/Bestiary/">Bestiary search &amp; filter</a></strong><br>
        Find any statblock by level, EV, role, or keyword.</p></li>
    <li><p><strong><a href="{{ config.extra.bug_report_url }}">Report a broken link</a></strong><br>
        If something on the site linked you here, tell us.</p></li>
  </ul>
</div>
{% endblock %}
```

Note: `grid cards` markdown attributes don't process inside raw Jinja HTML — the `<ul>` inside `<div class="grid cards">` is the already-rendered form Material's CSS styles (check the built `site/Browse/index.html` for the exact expected DOM: `<div class="grid cards"><ul><li>…`). If the styling doesn't take, fall back to plain `<p>` links — content over chrome.

- [ ] **Step 2: Build and verify**

```bash
cd v2 && devbox run -- mkdocs build
grep -o "Page not found" site/404.html && grep -o "Browse/" site/404.html | head -1
```
Expected: both grep hits.

- [ ] **Step 3: Serve and verify a wrong URL renders it**

`python3 -m http.server` serves its own 404, not the site's — verify by opening `http://127.0.0.1:8124/404.html` directly and checking the three links resolve (they are absolute `https://steelcompendium.io/v2/...` URLs from `config.site_url` — correct in production; just confirm they're present). Real-path verification happens on the deployed site (GitHub Pages serves `404.html` for misses under `/v2/`).

- [ ] **Step 4: Commit**

```bash
git -C v2 add overrides/404.html
git -C v2 commit -m "feat: custom 404 with search hint and section links"
```

---

### Task 6: Home page polish

**Files:**
- Modify: `v2/docs/index.md`

Three edits (all in the hand-authored landing page — `docs/index.md` is NOT generated):

- [ ] **Step 1: Align the brand line**

Replace the H1 (line 5) and the following italic license paragraph stays as-is:

```markdown
# Steel Compendium

_A searchable, linkable reference for the **Draw Steel** TTRPG — curated by Xentis._
```

(Header/site name says "Steel Compendium: Draw Steel Rules"; the H1 said "Xentis' Draw Steel Compendium". If the user prefers keeping the possessive title, revert this step only — it's isolated.)

- [ ] **Step 2: Collapse the legacy data repos**

Wrap the entire "Legacy data repos" card body list (the `*Per-book…*` through the `data-adventures-md` line inside the second card of the "Data Formats" grid) in a `<details>`:

```markdown
-   ### :material-folder-clock:{ .sc-crest } Legacy data repos

    ---

    **Deprecated.** Superseded by the consolidated
    [data-unified](https://github.com/SteelCompendium/data-unified) repo.

    <details markdown>
    <summary>Show the 12 legacy repos</summary>

    *(existing list content, unchanged)*

    </details>
```

- [ ] **Step 3: Build + eyeball**

```bash
cd v2 && devbox run -- mkdocs build
```
Open `/` — hero title reads "Steel Compendium"; legacy repos collapsed behind a summary.

- [ ] **Step 4: Commit**

```bash
git -C v2 add docs/index.md
git -C v2 commit -m "polish: home brand line + collapse legacy repo list"
```

---

### Task 7: Land the branch

- [ ] **Step 1: Full local build + whole e2e suite**

```bash
cd v2 && devbox run -- mkdocs build
devbox run -- node tests/e2e/page-titles.e2e.cjs
devbox run -- node tests/e2e/cardhead-mobile.e2e.cjs
devbox run -- node --test tests/
```
Expected: all pass (the `node --test` suite is pre-existing and unaffected).

- [ ] **Step 2: Land**

```bash
just wt-finish p1-bugfix
```
(From the workspace root primary checkout; pushes the v2 commits + superproject pointer bump.)

- [ ] **Step 3: After the next `just deploy-v2`, verify live**

Check https://steelcompendium.io/v2/Browse/class/fury/ (title visible), a statblock on a phone-width window, and https://steelcompendium.io/v2/Browse/index_old/ (404s — and shows the new 404 page).

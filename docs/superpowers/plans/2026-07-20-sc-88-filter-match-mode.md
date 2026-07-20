# SC-88: Facet Match-Mode (any/all) for Feature & Bestiary Filters — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selecting multiple Keyword chips currently ORs them (`Area || Fire`); add a per-facet "match any / match all" toggle so users can require ALL selected keywords (`Area && Fire`) on both the Features browser and the Bestiary browser.

**Architecture:** The filter surfaces are pure client-side JS in the `v2` repo — `steel-feature-browser.js` (Features tab) and `steel-bestiary-browser.js` (Bestiary tab) each build chip facets from a JSON data island and filter in a local `matches()` function. Both currently OR within a facet and AND across facets. We extract the per-facet pick-matching into a new shared, DOM-free UMD core module (`sc-facet-core.js`, following the established `<name>-core.js` + `node --test` pattern), add a `mode` ("any"/"all") per facet, and surface an "any ⇄ all" toggle button on facets whose field is genuinely multi-valued (in practice: Keyword — the only facet where AND is satisfiable, since an item holds one Type/Role/Level but many keywords). steel-etl is NOT involved; no generated content changes.

**Tech Stack:** Vanilla ES5-style browser JS (UMD modules, no build step), `node --test` unit tests, MkDocs Material site (`navigation.instant`-safe mounting already handled by the existing scripts).

## Global Constraints

- **Work in an isolated worktree**, never the shared main checkout: `just wt-new sc-88` → edit in `../worktrees/sc-88/` → land with `just wt-finish sc-88` (run from the main checkout, NEVER chained with `&&`; see `docs/worktrees-and-submodules.md`). All file paths below are relative to the worktree root.
- All edited files live in the **`v2` submodule** — commits happen inside `v2/`; `wt-finish` handles the superproject pointer bump.
- `docs/javascripts/`, `docs/stylesheets/`, `mkdocs.yml`, `tests/` are safe to edit (NOT generated). Never touch `v2/docs/Browse|Read|scc`.
- Node is only available through devbox: run tests as `devbox run -- bash -c 'cd <worktree>/v2 && node --test tests/<file>.test.js'`. Full suite uses the glob form `node --test tests/*.test.js` (this Node rejects a directory argument).
- New client JS must be `navigation.instant`-safe — the new module is pure (no DOM, no listeners), and all DOM wiring stays inside the existing `mount()` functions, which already re-run per navigation. No new `document$` subscriptions are needed.
- Match the surrounding code style: ES5 `var`/`function`, UMD wrapper identical to `steel-feature-browser-core.js`, 2-space indent.
- No AI/Claude attribution in commit messages.
- UI copy: the toggle reads exactly `any` / `all` (lowercase, matching the small-caps chip typography).

---

### Task 1: Shared pure matcher module `sc-facet-core.js`

**Files:**
- Create: `v2/docs/javascripts/sc-facet-core.js`
- Test: `v2/tests/sc-facet-core.test.js`

**Interfaces:**
- Consumes: nothing (pure, dependency-free).
- Produces (used by Tasks 2 & 3 via `window.SCFacetCore`):
  - `matchesPicks(value, picks, mode)` → boolean. `value`: an item's raw field value (string | string[] | null | undefined | ""). `picks`: `{ [pickedValue: string]: true }` or null. `mode`: `"any"` (default, OR) or `"all"` (AND). Empty/absent `picks` always matches.
  - `isMultiValued(items, key)` → boolean — true iff some item's `item[key]` is an array with length ≥ 2 (i.e. "all" mode is ever satisfiable for ≥2 picks, so the toggle is worth showing).
  - `valuesOf(value)` → string[] — normalizes a field value to an array (`null`/`""` → `[]`).

- [ ] **Step 1: Write the failing test**

Create `v2/tests/sc-facet-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const Core = require("../docs/javascripts/sc-facet-core.js");

const AREA_FIRE = { Area: true, Fire: true };

test("valuesOf normalizes scalars, arrays, and empties", () => {
  assert.deepStrictEqual(Core.valuesOf(null), []);
  assert.deepStrictEqual(Core.valuesOf(undefined), []);
  assert.deepStrictEqual(Core.valuesOf(""), []);
  assert.deepStrictEqual(Core.valuesOf("Fire"), ["Fire"]);
  assert.deepStrictEqual(Core.valuesOf(3), ["3"]);
  assert.deepStrictEqual(Core.valuesOf(["Area", "Fire"]), ["Area", "Fire"]);
});

test("empty or missing selection matches everything, both modes", () => {
  assert.strictEqual(Core.matchesPicks(["Area"], {}, "any"), true);
  assert.strictEqual(Core.matchesPicks(["Area"], {}, "all"), true);
  assert.strictEqual(Core.matchesPicks(null, {}, "any"), true);
  assert.strictEqual(Core.matchesPicks("Fire", null, "all"), true);
});

test("any-mode ORs picks over array values", () => {
  assert.strictEqual(Core.matchesPicks(["Fire", "Magic"], AREA_FIRE, "any"), true);
  assert.strictEqual(Core.matchesPicks(["Magic"], AREA_FIRE, "any"), false);
});

test("any-mode works on single-valued (string) fields", () => {
  assert.strictEqual(Core.matchesPicks("Fire", AREA_FIRE, "any"), true);
  assert.strictEqual(Core.matchesPicks("Magic", AREA_FIRE, "any"), false);
});

test("all-mode requires every picked value", () => {
  assert.strictEqual(Core.matchesPicks(["Area", "Fire", "Magic"], AREA_FIRE, "all"), true);
  assert.strictEqual(Core.matchesPicks(["Area", "Magic"], AREA_FIRE, "all"), false);
  assert.strictEqual(Core.matchesPicks(["Fire"], AREA_FIRE, "all"), false);
});

test("all-mode on a single-valued field: one pick can match, two never can", () => {
  assert.strictEqual(Core.matchesPicks("Fire", { Fire: true }, "all"), true);
  assert.strictEqual(Core.matchesPicks("Fire", AREA_FIRE, "all"), false);
});

test("empty value never matches a non-empty selection", () => {
  assert.strictEqual(Core.matchesPicks(null, AREA_FIRE, "any"), false);
  assert.strictEqual(Core.matchesPicks([], AREA_FIRE, "all"), false);
});

test("unknown mode falls back to any", () => {
  assert.strictEqual(Core.matchesPicks(["Fire"], AREA_FIRE, undefined), true);
});

test("numeric levels match string picks (chips store strings)", () => {
  assert.strictEqual(Core.matchesPicks(3, { "3": true }, "any"), true);
});

test("isMultiValued detects a >=2-value array on any item", () => {
  const items = [
    { keywords: ["Area", "Fire"], role: "Brute" },
    { keywords: ["Magic"], role: "Ambusher" }
  ];
  assert.strictEqual(Core.isMultiValued(items, "keywords"), true);
  assert.strictEqual(Core.isMultiValued(items, "role"), false);
  assert.strictEqual(Core.isMultiValued(items, "missing"), false);
  assert.strictEqual(Core.isMultiValued([], "keywords"), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd v2 && node --test tests/sc-facet-core.test.js'`
Expected: FAIL — `Cannot find module '../docs/javascripts/sc-facet-core.js'`

- [ ] **Step 3: Write the implementation**

Create `v2/docs/javascripts/sc-facet-core.js`:

```js
/*
 * sc-facet-core.js — pure, DOM-free facet-selection matching shared by the
 * Features browser (steel-feature-browser.js) and the Bestiary browser
 * (steel-bestiary-browser.js).
 * UMD: exports for node:test, attaches to window.SCFacetCore in the browser.
 * Loaded BEFORE both browser scripts in mkdocs.yml.
 *
 * A facet selection is { value: true, … } (empty = facet inactive). `mode`
 * decides how multiple picks combine (SC-88):
 *   "any" (default) — item matches if it carries at least one picked value (OR)
 *   "all"           — item must carry every picked value (AND); only ever
 *                     satisfiable for ≥2 picks on array-valued fields
 *                     (keywords), which is why the UI shows the toggle only
 *                     where isMultiValued() is true.
 */
;(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SCFacetCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // item's raw field value → array of strings ("" / null / undefined → none)
  function valuesOf(v) {
    if (v == null || v === "") return [];
    if (!Array.isArray(v)) return [String(v)];
    return v.map(function (x) { return String(x); });
  }

  // Does an item's field value satisfy the picked set under `mode`?
  // Empty selection always matches (the facet is inactive).
  function matchesPicks(value, picks, mode) {
    picks = picks || {};
    var wanted = Object.keys(picks);
    if (!wanted.length) return true;
    var vals = valuesOf(value);
    if (mode === "all") {
      for (var i = 0; i < wanted.length; i++) {
        if (vals.indexOf(wanted[i]) === -1) return false;
      }
      return true;
    }
    for (var j = 0; j < vals.length; j++) {
      if (picks[vals[j]]) return true;
    }
    return false;
  }

  // Whether any item carries ≥2 values under `key` — i.e. whether "all" mode
  // is ever satisfiable for multiple picks and the any/all toggle worth showing.
  function isMultiValued(items, key) {
    for (var i = 0; i < items.length; i++) {
      var v = items[i] && items[i][key];
      if (Array.isArray(v) && v.length > 1) return true;
    }
    return false;
  }

  return { valuesOf: valuesOf, matchesPicks: matchesPicks, isMultiValued: isMultiValued };
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd v2 && node --test tests/sc-facet-core.test.js'`
Expected: PASS — 10 tests, 0 failures.

- [ ] **Step 5: Commit (inside the `v2` submodule)**

```bash
cd v2
git add docs/javascripts/sc-facet-core.js tests/sc-facet-core.test.js
git commit -m "feat(browse): add shared facet match core with any/all modes (SC-88)"
```

---

### Task 2: Register the module + wire the Features browser + toggle UI/CSS

**Files:**
- Modify: `v2/mkdocs.yml` (extra_javascript list, ~line 161)
- Modify: `v2/docs/javascripts/steel-feature-browser.js` (facet defs ~line 148, state ~line 156, clear handler ~line 198, chip wiring ~line 205, `matches()` ~line 214, `facetRow()` ~line 269)
- Modify: `v2/docs/stylesheets/steel-indexes.css` (after the `.sc-chip__dot` rule, ~line 296)

**Interfaces:**
- Consumes: `window.SCFacetCore.matchesPicks(value, picks, mode)` and `window.SCFacetCore.isMultiValued(items, key)` from Task 1.
- Produces (reused verbatim by Task 3):
  - CSS classes `.sc-facet-mode` (the toggle button) and `.sc-facet-mode.is-all` (AND state) in `steel-indexes.css`.
  - Markup/behavior contract: `<button type="button" class="sc-facet-mode" data-facet="<key>" aria-pressed="false" title="...">any</button>` rendered right after the facet's `.lbl`; clicking flips `state.mode[key]` between `"any"`/`"all"`, syncs `textContent`/`is-all`/`aria-pressed`, and re-renders. "Clear filters" resets every mode to `"any"`.

- [ ] **Step 1: Register the core module in mkdocs.yml**

In `v2/mkdocs.yml`, in the `extra_javascript:` list, add `javascripts/sc-facet-core.js` immediately BEFORE `javascripts/steel-feature-browser-core.js`:

```yaml
  - javascripts/sc-facet-core.js
  - javascripts/steel-feature-browser-core.js
  - javascripts/steel-feature-browser.js
  - javascripts/steel-bestiary-browser.js
```

- [ ] **Step 2: Wire the Features browser**

In `v2/docs/javascripts/steel-feature-browser.js`, five edits:

(a) Below the existing `var Core = …SCFeatureBrowserCore…` line (~line 28), add:

```js
  // Shared per-facet pick matching (any/all modes), loaded before this script.
  var FacetCore = (typeof window !== "undefined" && window.SCFacetCore) || null;
```

(b) In `mount()`, right after the `var facets = [ … ].filter(…)` block (~line 154), flag which facets get the toggle, and extend `state` with a mode map (replace the existing `var state = …; facets.forEach(…)` lines):

```js
    // any/all toggle only where AND is satisfiable: array-valued fields (keywords).
    facets.forEach(function (f) { f.multi = FacetCore.isMultiValued(items, f.key); });

    var state = { q: "", sort: "name", sel: {}, mode: {} };
    facets.forEach(function (f) { state.sel[f.key] = {}; state.mode[f.key] = "any"; });
    state.sel.klass = {};
    state.sel.subclass = {};
```

(c) In the `elClear` click handler (~line 198), after the `facets.forEach(function (f) { state.sel[f.key] = {}; });` line, add:

```js
      facets.forEach(function (f) { state.mode[f.key] = "any"; });
      root.querySelectorAll(".sc-facet-mode.is-all").forEach(function (b) {
        b.classList.remove("is-all"); b.textContent = "any"; b.setAttribute("aria-pressed", "false");
      });
```

(d) After the `root.querySelectorAll(".sc-chip").forEach(…)` wiring block (~line 212), add the toggle wiring:

```js
    root.querySelectorAll(".sc-facet-mode").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.dataset.facet;
        var all = state.mode[k] !== "all";
        state.mode[k] = all ? "all" : "any";
        btn.textContent = all ? "all" : "any";
        btn.classList.toggle("is-all", all);
        btn.setAttribute("aria-pressed", all ? "true" : "false");
        render();
      });
    });
```

(e) In `matches()` (~line 219), replace the generic per-facet loop body — currently:

```js
      for (var k in state.sel) {
        if (k === "klass" || k === "subclass") continue; // handled as one OR-group below
        var picks = Object.keys(state.sel[k]);
        if (!picks.length) continue;
        var v = it[k];
        var has = Array.isArray(v)
          ? v.some(function (x) { return state.sel[k][x]; })
          : state.sel[k][String(v)];
        if (!has) return false;
      }
```

with:

```js
      for (var k in state.sel) {
        if (k === "klass" || k === "subclass") continue; // handled as one OR-group below
        if (!FacetCore.matchesPicks(it[k], state.sel[k], state.mode[k])) return false;
      }
```

(f) In `facetRow(f)` (~line 269), render the toggle after the label for multi-valued facets — replace the `return` statement with:

```js
    var modeBtn = f.multi
      ? '<button type="button" class="sc-facet-mode" data-facet="' + f.key + '" aria-pressed="false" ' +
        'title="Match any selected value (OR) — click to require all (AND)">any</button>'
      : "";
    return '<div class="sc-browse__facet"><span class="lbl">' + esc(f.label) + '</span>' + modeBtn +
      '<div class="sc-browse__chips">' + chips + '</div></div>';
```

- [ ] **Step 3: Add the toggle CSS**

In `v2/docs/stylesheets/steel-indexes.css`, directly after the `.sc-chip__dot` rule (~line 296), add:

```css
/* any/all match-mode toggle on multi-valued facets (Keyword) — SC-88. Sits
   between the facet label and its chips; "all" state borrows the chip on-accent. */
.sc-facet-mode {
  display: inline-flex; align-items: center; cursor: pointer; user-select: none;
  font-family: var(--md-small-header-font); font-variant: small-caps; text-transform: lowercase;
  letter-spacing: .03em; font-size: .72rem; color: var(--md-default-fg-color--lighter);
  padding: .02rem .45rem; margin-left: .4rem; border-radius: 999px;
  border: 1px dashed var(--fx-metal-faint); background: transparent;
  transition: color .15s ease, border-color .15s ease, background .15s ease; }
.sc-facet-mode:hover { color: var(--md-default-fg-color); border-color: var(--fx-metal-line); }
.sc-facet-mode.is-all {
  color: #06232a; background: var(--md-accent-fg-color);
  border: 1px solid var(--md-accent-fg-color); font-weight: 600; }
[data-md-color-scheme="default"] .sc-facet-mode.is-all { color: #f3f8f8; }
```

- [ ] **Step 4: Verify — unit suite still green, then behavior in a real build**

Run: `devbox run -- bash -c 'cd v2 && node --test tests/*.test.js'`
Expected: PASS (all existing suites + the new one; the feature browser has no DOM test harness — its wiring is verified live below).

Serve the worktree's site locally: from the MAIN checkout run `devbox run -- just local-deploy sc-88`, open `http://127.0.0.1:8123`, go to a Features browse page (e.g. Browse → Features), then:
1. Confirm the Keyword facet row shows a small `any` pill after its label, and single-valued facets (Type, Level, Action) do NOT.
2. Select `Area` + `Fire` → count matches today's OR behavior.
3. Click the pill → it reads `all`, highlights, and the result count drops to only features carrying BOTH keywords (spot-check a result card shows both chips).
4. Click `Clear filters` → chips clear AND the pill returns to `any` unhighlighted.
5. Navigate to another page and back (client-side nav) → the browser still mounts and the toggle still works (`navigation.instant` safety).

- [ ] **Step 5: Commit**

```bash
cd v2
git add mkdocs.yml docs/javascripts/steel-feature-browser.js docs/stylesheets/steel-indexes.css
git commit -m "feat(browse): any/all keyword match toggle on the Features browser (SC-88)"
```

---

### Task 3: Wire the Bestiary browser

**Files:**
- Modify: `v2/docs/javascripts/steel-bestiary-browser.js` (module head ~line 13, `mount()` facets ~line 63, state ~line 71, clear handler ~line 113, chip wiring ~line 124, `matches()` ~line 146, `facetRow()` ~line 217)

**Interfaces:**
- Consumes: `window.SCFacetCore` (Task 1) and the `.sc-facet-mode` CSS + markup/behavior contract (Task 2 — the classes and button markup must match exactly so the same stylesheet rules apply).
- Produces: nothing further.

- [ ] **Step 1: Wire the bestiary browser**

In `v2/docs/javascripts/steel-bestiary-browser.js`, five edits mirroring Task 2:

(a) After the `"use strict";` line (~line 14), add:

```js
  // Shared per-facet pick matching (any/all modes), loaded before this script.
  var FacetCore = (typeof window !== "undefined" && window.SCFacetCore) || null;
```

(b) In `mount()`, after the `var facets = [ … ].filter(…)` block (~line 69), and extending the state line (replace the existing `var state = …; facets.forEach(…)` lines):

```js
    // any/all toggle only where AND is satisfiable: array-valued fields (keywords).
    facets.forEach(function (f) { f.multi = FacetCore.isMultiValued(items, f.key); });

    var state = { q: "", sort: "name", dir: 1, sel: {}, mode: {}, lvlMin: null, lvlMax: null, evMin: null, evMax: null };
    facets.forEach(function (f) { state.sel[f.key] = {}; state.mode[f.key] = "any"; });
```

(c) In the `elClear` click handler (~line 113), after `facets.forEach(function (f) { state.sel[f.key] = {}; });`, add:

```js
      facets.forEach(function (f) { state.mode[f.key] = "any"; });
      root.querySelectorAll(".sc-facet-mode.is-all").forEach(function (b) {
        b.classList.remove("is-all"); b.textContent = "any"; b.setAttribute("aria-pressed", "false");
      });
```

(d) After the `root.querySelectorAll(".sc-chip").forEach(…)` wiring block (~line 131), add:

```js
    root.querySelectorAll(".sc-facet-mode").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.dataset.facet;
        var all = state.mode[k] !== "all";
        state.mode[k] = all ? "all" : "any";
        btn.textContent = all ? "all" : "any";
        btn.classList.toggle("is-all", all);
        btn.setAttribute("aria-pressed", all ? "true" : "false");
        render();
      });
    });
```

(e) In `matches()` (~line 146), replace:

```js
      for (var k in state.sel) {
        var picks = Object.keys(state.sel[k]);
        if (!picks.length) continue;
        var v = it[k];
        var has = Array.isArray(v) ? v.some(function (x) { return state.sel[k][x]; }) : state.sel[k][String(v)];
        if (!has) return false;
      }
```

with:

```js
      for (var k in state.sel) {
        if (!FacetCore.matchesPicks(it[k], state.sel[k], state.mode[k])) return false;
      }
```

(f) In `facetRow(f)` (~line 217), replace the `return` statement with:

```js
    var modeBtn = f.multi
      ? '<button type="button" class="sc-facet-mode" data-facet="' + f.key + '" aria-pressed="false" ' +
        'title="Match any selected value (OR) — click to require all (AND)">any</button>'
      : "";
    return '<div class="sc-browse__facet"><span class="lbl">' + esc(f.label) + '</span>' + modeBtn +
      '<div class="sc-browse__chips">' + chips + "</div></div>";
```

- [ ] **Step 2: Verify live**

With `devbox run -- just local-deploy sc-88` still serving, open the Bestiary tab:
1. The Keyword facet shows the `any` pill; Type/Role/Organization/Size do not.
2. Select two keywords (e.g. `Undead` + `Horror`), flip to `all` → the table narrows to creatures carrying both; the count line updates.
3. `Clear filters` resets chips, ranges, AND the pill to `any`.
4. Confirm the encounter-builder `+` buttons in the results table still work (the render path was touched).

- [ ] **Step 3: Commit**

```bash
cd v2
git add docs/javascripts/steel-bestiary-browser.js
git commit -m "feat(bestiary): any/all keyword match toggle on the Bestiary browser (SC-88)"
```

---

### Task 4: Full verification, docs, and landing

**Files:**
- Modify: `CHANGELOG.md` (workspace root — main checkout, after landing)
- Land: worktree `sc-88` via `just wt-finish sc-88`

**Interfaces:**
- Consumes: everything above, complete and committed inside `v2/` in the worktree.
- Produces: SC-88 ready for Scott's `just deploy-v2` (deploy itself is Scott's call — do NOT run deploy recipes).

- [ ] **Step 1: Full unit suite**

Run: `devbox run -- bash -c 'cd v2 && node --test tests/*.test.js'`
Expected: PASS, zero failures.

- [ ] **Step 2: Verify the worktree is clean and land it**

```bash
cd <worktree-root> && git status --porcelain        # expect: only "M v2" pointer
git add v2 && git commit -m "chore: bump v2 (SC-88 facet match-mode toggle)"
```

Then from the MAIN checkout (`/home/scott/code/steelCompendium/workspace`), run standalone (never `&&`-chained):

```bash
devbox run -- just wt-finish sc-88
devbox run -- just wt-rm sc-88
```

- [ ] **Step 3: Changelog entry (main checkout, workspace root)**

Add under `## Unreleased` in `CHANGELOG.md` (create a `### Added` sub-heading above the existing plugin-6.0.0 one if none exists for site work):

```markdown
- **Keyword filters can now require ALL selected keywords** (SC-88) — the Features and
  Bestiary browsers' Keyword facet gained an `any`/`all` toggle: `any` keeps today's
  match-any behavior, `all` narrows to entries carrying every selected keyword
  (e.g. Area **and** Fire). Single-valued facets (Type, Role, Level…) are unchanged.
```

```bash
git add CHANGELOG.md && git commit -m "docs(changelog): SC-88 facet match-mode toggle under Unreleased"
git push origin main
```

- [ ] **Step 4: Update Linear SC-88**

Comment on SC-88 summarizing the change (any/all toggle on Keyword facets of both browsers, shared `sc-facet-core.js` with unit tests, awaiting deploy) and move it to **Awaiting**.

---

## Out of scope (deliberate)

- **Exclusion (NOT) chips and free-text query operators** (`keyword:fire -area`): the mode map (`state.mode[key]`) and pure matcher give these a natural seam later; YAGNI now.
- **The Source facet's klass/subclass OR-group** (feature browser): a class chip and its subclass chips are hierarchical alternatives — AND across them is not meaningful; it keeps its dedicated `matchesSource` path untouched.
- **URL-persisted filter state**: separate feature if ever wanted.
- **steel-etl/data changes**: none needed; facets are built client-side from the existing data islands.

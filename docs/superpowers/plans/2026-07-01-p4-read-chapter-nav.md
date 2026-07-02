# P4 — Read-Tab Chapter Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the book-faithful Read chapters navigable as a *reading* experience: (1) prev/next chapter links, (2) a collapsible "In this chapter" mini-TOC at the top of every chapter, (3) "resume where you left off" scroll restore. The classes chapter is 677,000px tall — readers currently get no map and no way back to where they stopped.

**Architecture:** v2-only. (1) is Material's built-in `navigation.footer` feature flag. (2) and (3) are new client scripts following the repo's `*-core.js` (pure, node:test-tested CommonJS) + `*.js` (DOM mount via Material's `document$`, instant-nav-safe) convention. No steel-etl change — the mini-TOC is built client-side from the page's own headings.

**Tech Stack:** MkDocs Material feature flag, vanilla JS (`document$` observable), node:test, localStorage.

**Context docs:** `v2/CLAUDE.md` (the `navigation.instant` client-script rules — REQUIRED reading), existing exemplars `v2/docs/javascripts/settings-core.js` + `settings-panel.js`, `nav-drawer-keep-core.js` + `nav-drawer-keep.js`, tests in `v2/tests/`.

## Global Constraints

- Isolated worktree: `just wt-new p4-readnav` / `just wt-finish p4-readnav`.
- Client JS MUST register via Material's `document$` observable (never `DOMContentLoaded`), be idempotent per page swap, and tear down `window`/`document` listeners it adds (`navigation.instant` swaps the body without a page load).
- Core logic in `<name>-core.js` as CommonJS-compatible modules (the existing pattern: attach to `window.X` for the browser AND `module.exports` when available), tested with `node --test tests/`.
- localStorage keys use the `sc-` prefix (existing settings do).
- No commit-attribution trailers.

---

### Task 1: Prev/next chapter links (`navigation.footer`)

**Files:**
- Modify: `v2/mkdocs.yml` (theme `features` list, after `- navigation.path`)

- [ ] **Step 1: Add the feature flag**

In `theme.features`, add:

```yaml
    # Prev/next page links at the bottom of every page — primarily for Read
    # chapters (book-order reading). Order comes from the nav, which .nav.yml
    # files already sort by source position for Read.
    - navigation.footer
```

- [ ] **Step 2: Build and verify**

```bash
cd v2 && devbox run -- mkdocs build && devbox run -- python3 -m http.server 8124 --directory site &
```
Open `/Read/heroes/the-basics/`, scroll to bottom: footer shows "Previous: Introduction / Next: Making a Hero" (labels per nav order). Spot-check the first and last chapter of a book (edges link into the adjacent book/tab per nav order — acceptable).

- [ ] **Step 3: Commit**

```bash
git -C v2 add mkdocs.yml
git -C v2 commit -m "feat: prev/next page footer links (navigation.footer)"
```

---

### Task 2: Chapter mini-TOC — core module

**Files:**
- Create: `v2/docs/javascripts/chapter-toc-core.js`
- Test: `v2/tests/chapter-toc-core.test.js`

**Interfaces:**
- Produces (consumed by Task 3's mount script):
  - `isReadPage(pathname)` → bool — true for `/Read/<book>/<chapter>/` leaf pages (NOT `/Read/` or `/Read/<book>/` indexes).
  - `buildTocModel(headings)` — input `[{level, text, id}]` (h2/h3 only), output `[{text, id, children: [{text, id}]}]`.
  - `renderTocHTML(model, title)` → HTML string for `<details class="sc-chtoc">…`.

- [ ] **Step 1: Write the failing tests**

`v2/tests/chapter-toc-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const C = require("../docs/javascripts/chapter-toc-core.js");

test("isReadPage matches chapter leaves only", () => {
  assert.ok(C.isReadPage("/v2/Read/heroes/classes/"));
  assert.ok(C.isReadPage("/v2/Read/bestiary/monster-basics/"));
  assert.ok(!C.isReadPage("/v2/Read/"));
  assert.ok(!C.isReadPage("/v2/Read/heroes/"));       // book index
  assert.ok(!C.isReadPage("/v2/Browse/class/fury/"));
});

test("buildTocModel nests h3 under preceding h2", () => {
  const m = C.buildTocModel([
    { level: 2, text: "Basics", id: "basics" },
    { level: 3, text: "Turns", id: "turns" },
    { level: 3, text: "Rounds", id: "rounds" },
    { level: 2, text: "Kits", id: "kits" },
  ]);
  assert.strictEqual(m.length, 2);
  assert.strictEqual(m[0].text, "Basics");
  assert.deepStrictEqual(m[0].children.map(c => c.id), ["turns", "rounds"]);
  assert.strictEqual(m[1].children.length, 0);
});

test("buildTocModel tolerates a leading h3 (no h2 parent yet)", () => {
  const m = C.buildTocModel([{ level: 3, text: "Loose", id: "loose" }]);
  assert.strictEqual(m.length, 1);
  assert.strictEqual(m[0].text, "Loose");
});

test("renderTocHTML emits details with anchor links", () => {
  const html = C.renderTocHTML(
    [{ text: "Basics", id: "basics", children: [{ text: "Turns", id: "turns" }] }],
    "In this chapter");
  assert.match(html, /<details class="sc-chtoc"/);
  assert.match(html, /<a href="#basics">Basics<\/a>/);
  assert.match(html, /<a href="#turns">Turns<\/a>/);
  assert.match(html, /In this chapter/);
});

test("renderTocHTML escapes heading text", () => {
  const html = C.renderTocHTML([{ text: "A <b>& B", id: "a", children: [] }], "t");
  assert.match(html, /A &lt;b&gt;&amp; B/);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd v2 && devbox run -- node --test tests/chapter-toc-core.test.js
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`v2/docs/javascripts/chapter-toc-core.js`:

```js
/* chapter-toc-core.js — pure logic for the Read-chapter "In this chapter"
 * mini-TOC. DOM mounting lives in chapter-toc.js. Tested by
 * tests/chapter-toc-core.test.js (node --test). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SCChapterToc = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // /…/Read/<book>/<chapter>/ — exactly two non-empty segments after Read.
  function isReadPage(pathname) {
    const m = /\/Read\/([^/]+)\/([^/]+)\/?$/.exec(pathname || "");
    return !!m;
  }

  function buildTocModel(headings) {
    const model = [];
    let current = null;
    (headings || []).forEach(function (h) {
      if (h.level === 2 || !current) {
        current = { text: h.text, id: h.id, children: [] };
        model.push(current);
        if (h.level === 3) current = null; // loose h3 becomes its own top entry
      } else if (h.level === 3) {
        current.children.push({ text: h.text, id: h.id });
      }
    });
    return model;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderTocHTML(model, title) {
    let h = '<details class="sc-chtoc"><summary>' + esc(title) + "</summary><ul>";
    model.forEach(function (top) {
      h += '<li><a href="#' + esc(top.id) + '">' + esc(top.text) + "</a>";
      if (top.children.length) {
        h += "<ul>";
        top.children.forEach(function (c) {
          h += '<li><a href="#' + esc(c.id) + '">' + esc(c.text) + "</a></li>";
        });
        h += "</ul>";
      }
      h += "</li>";
    });
    return h + "</ul></details>";
  }

  return { isReadPage: isReadPage, buildTocModel: buildTocModel, renderTocHTML: renderTocHTML };
});
```

- [ ] **Step 4: Run tests**

```bash
cd v2 && devbox run -- node --test tests/chapter-toc-core.test.js
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git -C v2 add docs/javascripts/chapter-toc-core.js tests/chapter-toc-core.test.js
git -C v2 commit -m "feat: chapter mini-TOC core (model + renderer)"
```

---

### Task 3: Chapter mini-TOC — mount script + styles + registration

**Files:**
- Create: `v2/docs/javascripts/chapter-toc.js`
- Modify: `v2/docs/stylesheets/steel-indexes.css` (append the `.sc-chtoc` block)
- Modify: `v2/mkdocs.yml` (extra_javascript: add `chapter-toc-core.js` + `chapter-toc.js` after `keyboard-nav.js`)

- [ ] **Step 1: Write the mount script**

`v2/docs/javascripts/chapter-toc.js`:

```js
/* chapter-toc.js — injects a collapsible "In this chapter" mini-TOC at the top
 * of Read chapter pages, built from the page's own h2/h3 headings. Logic in
 * chapter-toc-core.js. instant-nav safe: re-runs per document$ emission and is
 * idempotent (guards on an existing .sc-chtoc). */
(function () {
  "use strict";
  function init() {
    const C = window.SCChapterToc;
    if (!C || !C.isReadPage(location.pathname)) return;
    const content = document.querySelector(".md-content .md-typeset");
    if (!content || content.querySelector(".sc-chtoc")) return; // idempotent
    const headings = Array.prototype.slice
      .call(content.querySelectorAll("h2[id], h3[id]"))
      .map(function (el) {
        return {
          level: el.tagName === "H2" ? 2 : 3,
          text: (el.textContent || "").replace(/¶/g, "").trim(),
          id: el.id,
        };
      });
    if (headings.length < 4) return; // short chapters don't need a map
    const model = C.buildTocModel(headings);
    const holder = document.createElement("div");
    holder.innerHTML = C.renderTocHTML(model, "In this chapter");
    const h1 = content.querySelector("h1");
    const anchor = h1 ? h1.nextElementSibling : content.firstElementChild;
    content.insertBefore(holder.firstElementChild, anchor);
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init); // static-serve fallback
})();
```

- [ ] **Step 2: Append styles to steel-indexes.css**

```css
/* ── Read-chapter mini-TOC (chapter-toc.js) ── */
.md-typeset .sc-chtoc {
  margin: 1rem 0 1.6rem; padding: .5rem .9rem;
  border: 1px solid var(--fx-metal-line); border-radius: .5rem;
  background: var(--fx-metal-faint);
}
.md-typeset .sc-chtoc > summary {
  cursor: pointer; font-family: var(--md-small-header-font);
  font-variant: small-caps; text-transform: lowercase; letter-spacing: .06em;
  color: var(--md-default-fg-color--light);
}
.md-typeset .sc-chtoc ul { margin: .4rem 0 .2rem 1rem; columns: 2; column-gap: 2rem; }
.md-typeset .sc-chtoc ul ul { columns: 1; margin-left: .9rem; font-size: .9em; }
.md-typeset .sc-chtoc li { break-inside: avoid; margin: .1rem 0; }
@media (max-width: 45em) { .md-typeset .sc-chtoc ul { columns: 1; } }
```

- [ ] **Step 3: Register the scripts in mkdocs.yml**

In `extra_javascript`, after `- javascripts/keyboard-nav.js`:

```yaml
  - javascripts/chapter-toc-core.js
  - javascripts/chapter-toc.js
```

- [ ] **Step 4: Build + verify**

```bash
cd v2 && devbox run -- mkdocs build && devbox run -- python3 -m http.server 8124 --directory site &
```
Open `/Read/heroes/classes/`: a collapsed "In this chapter" box sits above the intro; expanding lists the 9 h2 sections with h3 children in two columns; anchors jump. `/Read/heroes/` (book index) and Browse pages show nothing. **Instant-nav check happens on the deployed site** (per CLAUDE.md this class of bug doesn't reproduce on a static serve) — after deploy, click between two chapters and confirm the box appears on both without duplication.

- [ ] **Step 5: Commit**

```bash
git -C v2 add docs/javascripts/chapter-toc.js docs/stylesheets/steel-indexes.css mkdocs.yml
git -C v2 commit -m "feat: collapsible 'In this chapter' mini-TOC on Read chapters"
```

---

### Task 4: Resume-reading — core module

**Files:**
- Create: `v2/docs/javascripts/read-resume-core.js`
- Test: `v2/tests/read-resume-core.test.js`

**Interfaces:**
- Produces: `storageKey(pathname)` → `"sc-read-pos:/v2/Read/heroes/classes/"` (null for non-Read pages, reusing `SCChapterToc.isReadPage` semantics via its own copy — keep core modules dependency-free); `shouldOffer(savedY, pageHeight, viewportH)` → bool (true when savedY > 1.5 × viewport and > 5% of page); `clampY(savedY, pageHeight, viewportH)` → number (never past bottom).

- [ ] **Step 1: Write the failing tests**

`v2/tests/read-resume-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const R = require("../docs/javascripts/read-resume-core.js");

test("storageKey only for Read chapter pages", () => {
  assert.strictEqual(R.storageKey("/v2/Read/heroes/classes/"), "sc-read-pos:/v2/Read/heroes/classes/");
  assert.strictEqual(R.storageKey("/v2/Read/heroes/"), null);
  assert.strictEqual(R.storageKey("/v2/Browse/class/fury/"), null);
});

test("shouldOffer requires meaningful depth", () => {
  assert.ok(R.shouldOffer(5000, 600000, 900));       // deep into a long chapter
  assert.ok(!R.shouldOffer(800, 600000, 900));       // less than 1.5 viewports
  assert.ok(!R.shouldOffer(NaN, 600000, 900));
  assert.ok(!R.shouldOffer(300, 4000, 900));         // < 5% of a short page
});

test("clampY never exceeds scrollable range", () => {
  assert.strictEqual(R.clampY(999999, 10000, 900), 9100);
  assert.strictEqual(R.clampY(500, 10000, 900), 500);
  assert.strictEqual(R.clampY(-5, 10000, 900), 0);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd v2 && devbox run -- node --test tests/read-resume-core.test.js
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`v2/docs/javascripts/read-resume-core.js`:

```js
/* read-resume-core.js — pure logic for Read-chapter scroll restore.
 * DOM/storage wiring in read-resume.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SCReadResume = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function storageKey(pathname) {
    return /\/Read\/[^/]+\/[^/]+\/?$/.test(pathname || "")
      ? "sc-read-pos:" + pathname
      : null;
  }
  function shouldOffer(savedY, pageHeight, viewportH) {
    if (!isFinite(savedY) || savedY <= 0) return false;
    return savedY > viewportH * 1.5 && savedY > pageHeight * 0.05;
  }
  function clampY(savedY, pageHeight, viewportH) {
    const max = Math.max(0, pageHeight - viewportH);
    return Math.min(Math.max(0, savedY), max);
  }
  return { storageKey: storageKey, shouldOffer: shouldOffer, clampY: clampY };
});
```

- [ ] **Step 4: Run tests**

```bash
cd v2 && devbox run -- node --test tests/read-resume-core.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C v2 add docs/javascripts/read-resume-core.js tests/read-resume-core.test.js
git -C v2 commit -m "feat: read-resume core (key/offer/clamp logic)"
```

---

### Task 5: Resume-reading — mount script + styles + registration

**Files:**
- Create: `v2/docs/javascripts/read-resume.js`
- Modify: `v2/docs/stylesheets/steel-indexes.css` (append `.sc-resume` block)
- Modify: `v2/mkdocs.yml` (extra_javascript after `chapter-toc.js`)

- [ ] **Step 1: Write the mount script**

```js
/* read-resume.js — remembers your scroll position per Read chapter
 * (localStorage, debounced) and offers a dismissible "Resume reading"
 * chip on return. instant-nav safe: document$-driven, tears down its
 * scroll listener on every swap. Logic: read-resume-core.js. */
(function () {
  "use strict";
  let teardown = null;

  function init() {
    if (teardown) { teardown(); teardown = null; }
    const R = window.SCReadResume;
    if (!R) return;
    const key = R.storageKey(location.pathname);
    if (!key) return;

    // 1. offer resume
    document.querySelectorAll(".sc-resume").forEach(function (n) { n.remove(); });
    const saved = parseInt(localStorage.getItem(key) || "", 10);
    const pageH = document.body.scrollHeight;
    if (R.shouldOffer(saved, pageH, window.innerHeight) && window.scrollY < 100) {
      const chip = document.createElement("button");
      chip.className = "sc-resume";
      chip.type = "button";
      const pct = Math.round((saved / pageH) * 100);
      chip.textContent = "Resume reading (" + pct + "%) ↓";
      chip.addEventListener("click", function () {
        window.scrollTo({ top: R.clampY(saved, document.body.scrollHeight, window.innerHeight), behavior: "auto" });
        chip.remove();
      });
      document.body.appendChild(chip);
      setTimeout(function () { chip.remove(); }, 15000); // auto-dismiss
    }

    // 2. track position (debounced)
    let t = null;
    function onScroll() {
      if (t) clearTimeout(t);
      t = setTimeout(function () {
        if (window.scrollY > 200) localStorage.setItem(key, String(window.scrollY));
        else localStorage.removeItem(key);
      }, 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    teardown = function () {
      window.removeEventListener("scroll", onScroll);
      if (t) clearTimeout(t);
    };
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: Append styles**

```css
/* ── "Resume reading" chip (read-resume.js) ── */
.sc-resume {
  position: fixed; bottom: 1.2rem; left: 50%; transform: translateX(-50%);
  z-index: 10; cursor: pointer;
  border: 1px solid var(--fx-metal-line); border-radius: 2em;
  padding: .45rem 1rem; font-size: .8rem;
  font-family: var(--md-small-header-font);
  background: var(--md-default-bg-color); color: var(--md-default-fg-color);
  box-shadow: 0 2px 10px rgba(0,0,0,.25);
}
.sc-resume:hover { color: var(--md-accent-fg-color); border-color: currentColor; }
```

- [ ] **Step 3: Register in mkdocs.yml**

```yaml
  - javascripts/read-resume-core.js
  - javascripts/read-resume.js
```

- [ ] **Step 4: Build + verify**

Serve locally; open `/Read/heroes/classes/`, scroll ~halfway, reload → chip appears bottom-center ("Resume reading (~50%) ↓"); click → jumps. Scroll back to top, reload → no chip (position cleared under 200px). Non-Read pages → no chip, no listener.

- [ ] **Step 5: Full test suite + commit**

```bash
cd v2 && devbox run -- node --test tests/
git -C v2 add docs/javascripts/read-resume.js docs/stylesheets/steel-indexes.css mkdocs.yml
git -C v2 commit -m "feat: resume-reading chip on Read chapters"
```

---

### Task 6: Land + post-deploy instant-nav verification

- [ ] **Step 1: Land**

```bash
just wt-finish p4-readnav
```

- [ ] **Step 2: After the next `just deploy-v2`, verify on the live site**

Instant-nav specifics that a static serve can't reproduce (per `v2/CLAUDE.md`): navigate Read → chapter → another chapter → Browse → back to the chapter. Confirm: exactly one mini-TOC per chapter page, resume chip does not appear on Browse pages, no duplicated scroll listeners (scroll a chapter, navigate away, navigate back — localStorage key updates only while on the chapter).

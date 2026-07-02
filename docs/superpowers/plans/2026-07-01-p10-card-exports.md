# P10 — Card Export Buttons (Markdown / PNG) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Copy as Markdown" and "Download PNG" actions on entity leaf pages (abilities, statblocks, featureblocks, kits) so users can paste rules into Discord/notes or drop card images into VTT handouts.

**Architecture:** Markdown source: steel-etl already replaces leaf bodies with HTML cards — a new central step in `buildSection` stashes the *pre-card* markdown body in a `<template class="sc-src">` island appended to carded pages (one hook, all four card types). v2 `sc-export.js` adds the buttons beside the existing copy-link control and (a) copies the template text, (b) rasterizes the card node to PNG via a vendored `html-to-image` (no CDN — the site has no runtime CDN deps today besides tablesort).

**Tech Stack:** Go (one buildSection hook + tests), vanilla JS, vendored `html-to-image` (MIT, ~13KB min), node:test.

**Depends on:** nothing (independent of P1–P9); coordinate with P8/P7 only for button placement in the card head.

## Global Constraints

- Isolated worktree: `just wt-new p10-export` / `just wt-finish p10-export`.
- SITE-ONLY steel-etl change; the `<template>` must be appended AFTER the card body with a preceding blank line (mkdocs raw-HTML block rules) and its content HTML-escaped (`html.EscapeString`) so markdown inside can't break the page.
- Strip the SCC annotation/link syntax from the stashed markdown: the md-linked body contains relative `.md` links — rewrite them to absolute `https://steelcompendium.io/v2/...` URLs? **No** — out of scope; keep the body as-is except stripping nothing. The copied markdown is for humans; relative links degrade to plain text gracefully. (If this proves annoying, a follow-up can rewrite links; don't block v1.)
- Vendored JS goes in `v2/docs/javascripts/vendor/html-to-image.min.js` with a comment noting version + license + source URL.
- No commit-attribution trailers.

---

### Task 1: steel-etl — stash the pre-card markdown in a template island

**Files:**
- Modify: `steel-etl/internal/site/build.go` (buildSection, around the card-transform chain at lines ~304-345)
- Create: `steel-etl/internal/site/export_src.go`
- Test: `steel-etl/internal/site/export_src_test.go`

**Interfaces:**
- Produces: `func appendSourceTemplate(carded []byte, origBody string) []byte` — appends `\n\n<template class="sc-src" data-fmt="md">…escaped body…</template>\n`.
- Consumes (in build.go): the page `data` *before* any card transform (capture `origBody` from `splitFrontmatter`), and a `carded` flag — set true when any of `buildAbilityCardPage` / `buildStatblockIslandPage` / `buildFeatureblockPage` / `buildKitPage` / `buildCompanionStatblockPage` returned ok.

- [ ] **Step 1: Write the failing test**

`steel-etl/internal/site/export_src_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

func TestAppendSourceTemplate(t *testing.T) {
	carded := []byte("---\nname: X\n---\n\n<article class=\"sc-ability\">card</article>")
	out := string(appendSourceTemplate(carded, "# X\n\n**Melee** & <b>bold</b>\n"))
	if !strings.Contains(out, `<template class="sc-src" data-fmt="md">`) {
		t.Fatal("template missing")
	}
	if !strings.Contains(out, "&lt;b&gt;bold&lt;/b&gt;") {
		t.Error("body must be HTML-escaped")
	}
	if !strings.Contains(out, "&amp;") {
		t.Error("ampersand must be escaped")
	}
	if !strings.HasSuffix(strings.TrimRight(out, "\n"), "</template>") {
		t.Error("template must be appended at the end")
	}
	// the card body must still be present, before the template
	if strings.Index(out, "sc-ability") > strings.Index(out, "sc-src") {
		t.Error("template must come after the card")
	}
}
```

- [ ] **Step 2: Run → FAIL; implement**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestAppendSourceTemplate -v
```

`steel-etl/internal/site/export_src.go`:

```go
package site

// Export-source island: carded leaf pages (ability/statblock/featureblock/
// kit/companion) get their ORIGINAL markdown body stashed in a hidden
// <template class="sc-src"> so the v2 "Copy as Markdown" control
// (sc-export.js) can read it client-side. <template> content is inert —
// browsers don't render it and search doesn't index it. SITE-ONLY.

import "html"

func appendSourceTemplate(carded []byte, origBody string) []byte {
	out := string(carded)
	out += "\n\n<template class=\"sc-src\" data-fmt=\"md\">" +
		html.EscapeString(origBody) + "</template>\n"
	return []byte(out)
}
```

- [ ] **Step 3: Wire into buildSection**

In `build.go`, before the first card transform (line ~304), capture the original body; after the last card transform (after `buildCompanionStatblockPage`, before `injectH1`):

```go
		// (before the buildAbilityCardPage block:)
		_, origBody := splitFrontmatter(string(data))
		wasCarded := false
```
change each transform block from `if card, ok := …; ok { data = card }` to also set `wasCarded = true`, then before `data = injectH1(data)`:

```go
		// Stash the pre-card markdown for the client-side export control.
		if wasCarded {
			data = appendSourceTemplate(data, origBody)
		}
```

- [ ] **Step 4: Tests + integration**

```bash
cd steel-etl && devbox run -- go test ./...
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
grep -c "sc-src" v2/docs/Browse/feature/ability/fury/level-1/brutal-slam.md   # 1
grep -c "sc-src" v2/docs/Browse/monster/goblin/goblin-warrior.md              # 1
grep -c "sc-src" v2/docs/Browse/class/fury.md                                 # 0 (not carded; P3's landing is additive, not a card replacement — if P3 landed and set wasCarded, exclude it there)
```
Also compare page sizes before/after (`du -sh v2/docs/Browse`) — expect a modest increase; statblock bodies are a few KB each.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/export_src.go internal/site/export_src_test.go internal/site/build.go
git -C steel-etl commit -m "feat(site): stash pre-card markdown in sc-src template for export"
```

---

### Task 2: v2 — Copy-as-Markdown button

**Files:**
- Create: `v2/docs/javascripts/sc-export.js`
- Modify: `v2/docs/stylesheets/steel-copylink.css` (append button styles)
- Modify: `v2/mkdocs.yml` (extra_javascript after the scc-card-copy pair)

- [ ] **Step 1: Write the script**

```js
/* sc-export.js — "Copy as Markdown" (from the sc-src template island) and
 * "Download PNG" (html-to-image over the card node) on carded leaf pages.
 * instant-nav safe; buttons injected beside the copy-link control. */
(function () {
  "use strict";
  function cardNode() {
    return document.querySelector(".md-content .sb-wrap, .md-content .md-typeset > .sc-ability, .md-content .fb-wrap, .md-content .sc-kit");
  }
  function init() {
    if (document.querySelector(".sc-export")) return;   // idempotent
    const tpl = document.querySelector("template.sc-src");
    const card = cardNode();
    if (!tpl || !card) return;
    const host = card.querySelector(".sc-head") || card;

    const bar = document.createElement("span");
    bar.className = "sc-export";

    const mdBtn = document.createElement("button");
    mdBtn.type = "button"; mdBtn.className = "sc-export__md";
    mdBtn.title = "Copy as Markdown"; mdBtn.textContent = "MD";
    mdBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(tpl.content.textContent.trim()).then(function () {
        mdBtn.textContent = "✓"; setTimeout(function () { mdBtn.textContent = "MD"; }, 1200);
      });
    });
    bar.appendChild(mdBtn);

    if (window.htmlToImage) {
      const pngBtn = document.createElement("button");
      pngBtn.type = "button"; pngBtn.className = "sc-export__png";
      pngBtn.title = "Download card as PNG"; pngBtn.textContent = "PNG";
      pngBtn.addEventListener("click", function () {
        bar.style.visibility = "hidden";   // keep the buttons out of the shot
        window.htmlToImage.toPng(card, { pixelRatio: 2, backgroundColor: getComputedStyle(document.body).backgroundColor })
          .then(function (url) {
            bar.style.visibility = "";
            const a = document.createElement("a");
            a.download = (location.pathname.split("/").filter(Boolean).pop() || "card") + ".png";
            a.href = url; a.click();
          })
          .catch(function () { bar.style.visibility = ""; pngBtn.textContent = "✗"; });
      });
      bar.appendChild(pngBtn);
    }
    host.appendChild(bar);
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: Styles (append to steel-copylink.css)**

```css
/* ── export buttons (sc-export.js) — quiet chips beside the copy-link ── */
.sc-export { display: inline-flex; gap: .25rem; margin-left: .4rem; }
.sc-export button {
  border: 1px solid var(--md-default-fg-color--lightest); border-radius: .3em;
  background: none; cursor: pointer; color: var(--md-default-fg-color--lighter);
  font-size: .55rem; letter-spacing: .05em; padding: .1rem .3rem; line-height: 1.2;
}
.sc-export button:hover { color: var(--md-accent-fg-color); border-color: currentColor; }
```

- [ ] **Step 3: Register + verify markdown copy**

mkdocs.yml extra_javascript: `- javascripts/sc-export.js` (after `scc-card-copy.js`). Build, serve, open Brutal Slam: an "MD" chip in the card head; click → clipboard holds the original markdown (`# Brutal Slam`… with the ability table). Statblock page → full statblock source markdown. Verify placement doesn't collide with the copy-link / P7 pin (adjust `margin-left` or host if so).

- [ ] **Step 4: Commit**

```bash
git -C v2 add docs/javascripts/sc-export.js docs/stylesheets/steel-copylink.css mkdocs.yml
git -C v2 commit -m "feat: copy-as-markdown export on carded leaf pages"
```

---

### Task 3: PNG export (vendored html-to-image)

**Files:**
- Create: `v2/docs/javascripts/vendor/html-to-image.min.js`
- Modify: `v2/mkdocs.yml` (extra_javascript BEFORE sc-export.js)

- [ ] **Step 1: Vendor the library**

Download `html-to-image` (latest 1.x) minified UMD build; save with a header comment:

```
/*! html-to-image v1.11.x | MIT | https://github.com/bubkoo/html-to-image
    Vendored 2026-07 for the card PNG export (sc-export.js). */
```

Register in mkdocs.yml *before* `sc-export.js`:
```yaml
  - javascripts/vendor/html-to-image.min.js
```
The UMD global is `htmlToImage` — matches the `window.htmlToImage` guard in Task 2 (buttons appear only when the lib loaded).

- [ ] **Step 2: Verify rendering fidelity**

Download PNGs of: Brutal Slam (ability), Goblin Warrior (statblock — includes the role gradient band; the sticky header must NOT appear: it's positioned out of view, if it leaks into the shot add `.sb__sticky { display: none !important }` under a `.sc-export-shooting` class toggled around the capture), Goblin Malice (featureblock), Panther (kit). Check: custom fonts render (html-to-image inlines webfonts — the Draw Steel glyph font must survive; if glyphs drop, pass `fontEmbedCSS` or accept fallback and note it), dark/light themes both produce readable cards.

- [ ] **Step 3: Weight check**

The lib adds ~13KB min to every page load. If that's unacceptable, lazy-load it on first PNG click (`import()` or script injection) — decide by measuring; the simple always-load is fine at current page weights.

- [ ] **Step 4: Commit + land**

```bash
git -C v2 add docs/javascripts/vendor/html-to-image.min.js mkdocs.yml
git -C v2 commit -m "feat: PNG card export (vendored html-to-image)"
just wt-finish p10-export
```

**Post-deploy:** verify a PNG download on the live site (fonts served from the real origin behave differently than localhost), and paste a copied markdown block into Discord to sanity-check formatting.

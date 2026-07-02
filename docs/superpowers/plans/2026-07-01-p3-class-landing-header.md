# P3 — Class Landing Header + Jump Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Browse class page (`/Browse/class/<name>/`, 11 pages) a proper landing: a card-style header (name, "Class" eyebrow, source book, potency strip) plus an in-page jump bar built from the page's `##` sections — replacing today's experience of unanchored prose on an 82,000px page.

**Architecture:** A new steel-etl leaf transform `buildClassLandingPage` (mirroring `buildKitPage`) detects `type: class` pages, prepends a `.sc-classhead` card (head via the shared `renderCardHead`) and a `.sc-classnav` anchor bar derived from the body's `##` headings, and leaves the body untouched. v2 gets one new stylesheet. The injected markdown `# Name` is hidden by the same adjacency-keyed rule family established in P1.

**Tech Stack:** Go (steel-etl `internal/site`), CSS, mkdocs.yml extra_css.

**Depends on:** P1 Task 2 (the adjacency-keyed H1-hide pattern; this plan adds the `.sc-classhead` variant). Can be built independently; land after P1.

**Context docs:** `steel-etl/CLAUDE.md`, `steel-etl/docs/site-builder.md`, workspace `DESIGN.md` (card header system), the 6-slot head contract in `steel-etl/internal/site/card_head.go`.

## Global Constraints

- Isolated worktree: `just wt-new p3-classhead` / `just wt-finish p3-classhead`.
- Go via devbox: `devbox run -- go test ./...` (cwd steel-etl).
- SITE-ONLY change — no data-repo, schema, or SCC change.
- Never hand-roll a card head — build it through `renderCardHead(cardHeadSlots)` (`card_head.go`). Head markup must be **contiguous** (no blank lines) so `md_in_html` passes it through.
- Read chapters are `type: chapter` — the transform must key on `type: class` only (verified: `Read/heroes/classes.md` is `type: chapter`).
- Beastheart lacks `strong_potency`/`weak_potency`/`average_potency` frontmatter — the potency strip must render only when present.
- No commit-attribution trailers.

---

### Task 1: `pySlugify` — anchor slugs matching python-markdown's toc

**Files:**
- Create: `steel-etl/internal/site/class_page.go`
- Test: `steel-etl/internal/site/class_page_test.go`

**Interfaces:**
- Produces: `func pySlugify(s string) string` — replicates python-markdown `toc` default slugify (what MkDocs uses for heading ids): strip markdown links/attr-lists, lowercase, drop non-`[a-z0-9 _-]` runes, spaces→`-`.
- Produces: `func headingText(line string) string` — `"## 1st-Level Features {data-scc=\"x\"}"` → `"1st-Level Features"` (strips the `##` prefix, any trailing `{…}` attr-list, and unwraps `[text](url)` links).

- [ ] **Step 1: Write the failing tests**

`steel-etl/internal/site/class_page_test.go`:

```go
package site

import "testing"

func TestPySlugify(t *testing.T) {
	cases := []struct{ in, want string }{
		{"Basics", "basics"},
		{"1st-Level Features", "1st-level-features"},
		{"Stormwight Kits", "stormwight-kits"},
		{"Gods & Religion", "gods-religion"},
	}
	for _, c := range cases {
		if got := pySlugify(c.in); got != c.want {
			t.Errorf("pySlugify(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestHeadingText(t *testing.T) {
	cases := []struct{ in, want string }{
		{"## Basics", "Basics"},
		{`## 2nd-Level Features {data-scc="mcdm.heroes.v1/x/y"}`, "2nd-Level Features"},
		{"## [Kits](../kit/index.md)", "Kits"},
	}
	for _, c := range cases {
		if got := headingText(c.in); got != c.want {
			t.Errorf("headingText(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run to verify failure**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestPySlugify|TestHeadingText' -v
```
Expected: compile error (undefined functions).

- [ ] **Step 3: Implement in class_page.go**

```go
package site

// Class landing header + jump bar (.sc-classhead / .sc-classnav).
// buildClassLandingPage prepends a renderCardHead-based header card and an
// anchor nav (from the body's ## sections) to every `type: class` Browse page.
// SITE-ONLY. See workspace docs/superpowers/plans/2026-07-01-p3-class-landing-header.md.

import (
	"html"
	"regexp"
	"strings"
)

var (
	attrListRe = regexp.MustCompile(`\s*\{[^{}]*\}\s*$`)
	mdLinkRe   = regexp.MustCompile(`\[([^\]]*)\]\([^)]*\)`)
	slugDropRe = regexp.MustCompile(`[^a-z0-9 _-]`)
)

// headingText extracts the display text of a "## Heading" line: strips the
// hash prefix, a trailing {attr-list} (RenderSubtree's data-scc stamps), and
// unwraps markdown links.
func headingText(line string) string {
	s := strings.TrimSpace(strings.TrimLeft(strings.TrimSpace(line), "#"))
	s = attrListRe.ReplaceAllString(s, "")
	s = mdLinkRe.ReplaceAllString(s, "$1")
	return strings.TrimSpace(s)
}

// pySlugify replicates python-markdown's default toc slugify so our anchor
// hrefs match the ids MkDocs generates: lowercase, strip everything but
// [a-z0-9 _-], collapse spaces to single hyphens.
func pySlugify(s string) string {
	s = strings.ToLower(s)
	s = slugDropRe.ReplaceAllString(s, "")
	s = strings.Join(strings.Fields(s), "-")
	return s
}
```

- [ ] **Step 4: Run tests**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestPySlugify|TestHeadingText' -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/class_page.go internal/site/class_page_test.go
git -C steel-etl commit -m "feat(site): heading-text + python-markdown slug helpers for class landing"
```

---

### Task 2: `buildClassLandingPage`

**Files:**
- Modify: `steel-etl/internal/site/class_page.go`
- Test: `steel-etl/internal/site/class_page_test.go` (append)
- Modify: `steel-etl/internal/site/build.go` (hook into `buildSection`'s card chain, after the `buildKitPage` block at ~line 329)

**Interfaces:**
- Consumes: `splitFrontmatter(string) (fm, body string)`, `parseFrontmatterField(fm, key)`, `stripMD(string) string`, `renderCardHead(cardHeadSlots)` + `hLine/hChip` (all existing in the package).
- Produces: `func buildClassLandingPage(data []byte) ([]byte, bool)` — `(data,false)` for non-class pages; otherwise the same frontmatter + a body of `<section class="sc-classhead">…</section>` + jump nav + original body.

Output body shape (before injectH1 runs — injectH1 will prepend `# Name` + `---`, which the Task 4 CSS hides by adjacency):

```
<section class="sc-classhead"><header class="sc-head">…</header><div class="sc-classhead__pot">…</div></section>
<nav class="sc-classnav"><a href="#basics">Basics</a>…</nav>

<original body>
```

Head slots: LeftEyebrow `Class` · LeftPrimary the name (NameTag `h2`) · LeftDeck the `printing_book` value · right rail empty. Potency strip: three cells (Weak/Average/Strong) from `weak_potency`/`average_potency`/`strong_potency`, `stripMD`-ed and HTML-escaped; the whole strip is omitted when all three are empty (beastheart).

- [ ] **Step 1: Write the failing test**

Append to `class_page_test.go`:

```go
const classPageFixture = `---
name: Fury
printing_book: "Draw Steel: Heroes"
scc: mcdm.heroes.v1/class/fury
strong_potency: '[Might](../rule/character/might.md)'
average_potency: '[Might](../rule/character/might.md) − 1'
weak_potency: '[Might](../rule/character/might.md) − 2'
type: class
---

Intro prose.

## Basics

body

## 1st-Level Features

body

## Stormwight Kits

body
`

func TestBuildClassLandingPage(t *testing.T) {
	out, ok := buildClassLandingPage([]byte(classPageFixture))
	if !ok {
		t.Fatal("class page not transformed")
	}
	s := string(out)
	for _, want := range []string{
		`<section class="sc-classhead">`,
		`sc-head__left-primary`,     // renderCardHead emitted the name slot
		`>Fury</h2>`,                // name as h2
		`Draw Steel: Heroes`,        // left deck
		`sc-classhead__pot`,         // potency strip
		`Might − 2`,                 // weak potency, link-stripped
		`<nav class="sc-classnav">`,
		`<a href="#basics">Basics</a>`,
		`<a href="#1st-level-features">1st-Level Features</a>`,
		`<a href="#stormwight-kits">Stormwight Kits</a>`,
		"Intro prose.",              // body preserved
	} {
		if !strings.Contains(s, want) {
			t.Errorf("output missing %q", want)
		}
	}

	// non-class pages pass through
	if _, ok := buildClassLandingPage([]byte("---\ntype: ability\nname: X\n---\nbody\n")); ok {
		t.Error("ability page must not be transformed")
	}

	// no potency frontmatter → no potency strip (beastheart)
	noPot := strings.NewReplacer(
		"strong_potency: '[Might](../rule/character/might.md)'\n", "",
		"average_potency: '[Might](../rule/character/might.md) − 1'\n", "",
		"weak_potency: '[Might](../rule/character/might.md) − 2'\n", "",
	).Replace(classPageFixture)
	out2, _ := buildClassLandingPage([]byte(noPot))
	if strings.Contains(string(out2), "sc-classhead__pot") {
		t.Error("potency strip must be omitted when frontmatter lacks potencies")
	}
}
```

(Add `"strings"` to the test file imports.)

- [ ] **Step 2: Run to verify failure**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestBuildClassLandingPage -v
```
Expected: compile error — `undefined: buildClassLandingPage`.

- [ ] **Step 3: Implement**

Append to `class_page.go`:

```go
// buildClassLandingPage rewrites a `type: class` page to open with a
// .sc-classhead card (shared 6-slot head) + a .sc-classnav jump bar over the
// body's ## sections. The body itself is preserved verbatim below. Returns
// (data, false) for every other page type.
func buildClassLandingPage(data []byte) ([]byte, bool) {
	fm, body := splitFrontmatter(string(data))
	if strings.TrimSpace(parseFrontmatterField(fm, "type")) != "class" {
		return data, false
	}
	name := stripMD(parseFrontmatterField(fm, "name"))
	book := unquote(strings.TrimSpace(parseFrontmatterField(fm, "printing_book")))

	head := renderCardHead(cardHeadSlots{
		NameTag:     "h2",
		LeftEyebrow: hLine("Class"),
		LeftPrimary: hLine(html.EscapeString(name)),
		LeftDeck:    hLine(html.EscapeString(book)),
	})

	var card strings.Builder
	card.WriteString(`<section class="sc-classhead">`)
	card.WriteString(head)
	card.WriteString(classPotencyStrip(fm))
	card.WriteString(`</section>`)

	if nav := classJumpNav(body); nav != "" {
		card.WriteString("\n" + nav)
	}
	return []byte("---\n" + fm + "\n---\n\n" + card.String() + "\n\n" + body), true
}

// classPotencyStrip renders the Weak/Average/Strong potency cells, or "" when
// the class carries no potency frontmatter (beastheart).
func classPotencyStrip(fm string) string {
	type pot struct{ label, field string }
	pots := []pot{{"Weak", "weak_potency"}, {"Average", "average_potency"}, {"Strong", "strong_potency"}}
	var cells []string
	for _, p := range pots {
		v := stripMD(unquote(strings.TrimSpace(parseFrontmatterField(fm, p.field))))
		if v == "" {
			continue
		}
		cells = append(cells, `<span class="sc-classhead__potcell"><span class="l">`+p.label+
			` potency</span><span class="v">`+html.EscapeString(v)+`</span></span>`)
	}
	if len(cells) == 0 {
		return ""
	}
	return `<div class="sc-classhead__pot">` + strings.Join(cells, "") + `</div>`
}

// classJumpNav builds the anchor bar from the body's ## headings (H2 only —
// class pages have ~12: Basics, per-level features, subclass/kits sections).
func classJumpNav(body string) string {
	var links []string
	for _, line := range strings.Split(body, "\n") {
		if !strings.HasPrefix(line, "## ") {
			continue
		}
		txt := headingText(line)
		if txt == "" {
			continue
		}
		links = append(links, `<a href="#`+pySlugify(txt)+`">`+html.EscapeString(txt)+`</a>`)
	}
	if len(links) == 0 {
		return ""
	}
	return `<nav class="sc-classnav" aria-label="Class sections">` + strings.Join(links, "") + `</nav>`
}
```

Note: `unquote` lives in `bestiary_search.go` (same package). If `stripMD` does not already exist with that exact name, locate the markdown-link stripper the index cards use (grep `func stripMD` in `internal/site/`) and use that name consistently — the tests are the contract.

- [ ] **Step 4: Run tests**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestBuildClassLandingPage -v && devbox run -- go test ./internal/site/
```
Expected: PASS.

- [ ] **Step 5: Hook into buildSection**

In `build.go`, after the `buildKitPage` block (line ~329-331), add:

```go
		// Class pages → landing header card + section jump bar. Site-only;
		// runs before injectH1 like the cards above.
		if card, ok := buildClassLandingPage(data); ok {
			data = card
		}
```

- [ ] **Step 6: Full package test + commit**

```bash
cd steel-etl && devbox run -- go test ./...
git -C steel-etl add internal/site/class_page.go internal/site/class_page_test.go internal/site/build.go
git -C steel-etl commit -m "feat(site): class landing header card + jump bar (.sc-classhead/.sc-classnav)"
```

---

### Task 3: v2 stylesheet for the class landing

**Files:**
- Create: `v2/docs/stylesheets/steel-class.css`
- Modify: `v2/mkdocs.yml` (extra_css list, after `steel-cardhead.css`)

**Interfaces:**
- Consumes: `.sc-head` layout from steel-cardhead.css; tokens `--fx-metal-line`, `--fx-metal-faint`, `--md-default-fg-color--light` (palette.css / steel-redesign.css).
- Produces: the `.sc-classhead` H1-hide rule (same adjacency family as P1).

- [ ] **Step 1: Create the stylesheet**

```css
/* steel-class.css — class landing header (.sc-classhead) + jump bar
   (.sc-classnav). Head layout comes from steel-cardhead.css; this sheet only
   plates the card and styles the potency strip + anchor pills.
   Emitted by steel-etl internal/site/class_page.go. */

/* Hide the injected "# Name" H1 (+ --- rule) ONLY when the class card
   directly follows it — same adjacency family as the other leaf cards
   (see steel-ability-cards.css). */
.md-typeset > h1:first-child:has(+ hr + .sc-classhead),
.md-typeset > h1:first-child + hr:has(+ .sc-classhead) { display: none; }

.md-typeset .sc-classhead {
  max-width: 47rem; margin: 1.7rem auto 0; padding: 1.1rem 1.2rem;
  border: 1px solid var(--fx-metal-line);
  border-radius: .65rem;
  background: var(--fx-metal-faint);
}

/* potency strip: three uniform cells under the head */
.sc-classhead__pot {
  display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .8rem;
}
.sc-classhead__potcell {
  display: inline-flex; flex-direction: column; gap: .1rem;
  border: 1px solid var(--fx-metal-line); border-radius: .35rem;
  padding: .3rem .6rem; background: var(--md-default-bg-color);
}
.sc-classhead__potcell .l {
  font-variant: small-caps; text-transform: lowercase; letter-spacing: .06em;
  font-size: .78rem; color: var(--md-default-fg-color--light);
}
.sc-classhead__potcell .v { font-size: .95rem; }

/* jump bar: wrapping pill row, sticky-free (the right TOC handles deep nav) */
.md-typeset .sc-classnav {
  max-width: 47rem; margin: .7rem auto 0;
  display: flex; flex-wrap: wrap; gap: .35rem;
}
.md-typeset .sc-classnav a {
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: .35em; padding: .14rem .5rem;
  font-family: var(--md-small-header-font);
  font-variant: small-caps; text-transform: lowercase; letter-spacing: .04em;
  font-size: .82rem; line-height: 1.3; color: var(--md-default-fg-color--light);
}
.md-typeset .sc-classnav a:hover {
  color: var(--md-accent-fg-color); border-color: currentColor;
}
```

- [ ] **Step 2: Register in mkdocs.yml**

In `extra_css`, add after `- stylesheets/steel-cardhead.css`:

```yaml
  - stylesheets/steel-class.css
```

- [ ] **Step 3: Commit**

```bash
git -C v2 add docs/stylesheets/steel-class.css mkdocs.yml
git -C v2 commit -m "feat: class landing header + jump bar styles"
```

---

### Task 4: End-to-end verification

- [ ] **Step 1: Regenerate the site content**

From the worktree root:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
head -30 v2/docs/Browse/class/fury.md
```
Expected: frontmatter → `# Fury` → `---` → `<section class="sc-classhead">…<nav class="sc-classnav">…` → original prose. All 11 class pages under `v2/docs/Browse/class/` carry the card; `v2/docs/Read/heroes/classes.md` does **not** (`type: chapter`).

```bash
grep -L "sc-classhead" v2/docs/Browse/class/*.md   # expect: only index.md
grep -c "sc-classhead" v2/docs/Read/heroes/classes.md   # expect: 0
```

- [ ] **Step 2: Build + browser check**

```bash
cd v2 && devbox run -- mkdocs build && devbox run -- python3 -m http.server 8124 --directory site &
```
Open `/Browse/class/fury/`: header card shows Class / FURY / Draw Steel: Heroes + three potency cells + a 12-pill jump bar; clicking "1st-Level Features" scrolls to that section (anchor ids match); no duplicate "Fury" title above the card. Check `/Browse/class/beastheart/` (no potency strip, no crash) and mobile 390px (card head stacks per P1 Task 3).

- [ ] **Step 3: Run the P1 e2e suite (title visibility must still hold)**

```bash
devbox run -- node tests/e2e/page-titles.e2e.cjs
```
Expected: all pass — the fury case's h1 is *hidden* again now, **update the expectation for `Browse/class/fury/`** from `visible: true` to `visible: false` with a comment pointing at the `.sc-classhead` replacement (the reader-facing title is now the card head, which is the correct end state).

- [ ] **Step 4: Land**

```bash
just wt-finish p3-classhead
```

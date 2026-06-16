# Inline Item Cards on Container Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render embeddable items (abilities, features, traits, statblocks, featureblocks) as their finished High-Fantasy Steel cards inline on the Browse-tab container pages that contain them, by transcluding each item's already-built leaf card keyed by its `{data-scc}` marker — site-only, leaving the `data/` repos as plain markdown.

**Architecture:** A new site-builder post-pass (`internal/site/embed_cards.go`) runs after `generateIndexPages` in `Build()`. It walks the configured sections (default `["Browse"]`) twice: first to build a `scc → card-HTML` map from every card-able leaf page, then to rewrite each container page — for every `{data-scc="X"}` heading whose code is in the map, it keeps the heading and replaces the heading's inlined sub-tree with the mapped card, swallowing nested markers. No card renderer is touched; finished leaf cards are relocated verbatim.

**Tech Stack:** Go 1.26 (steel-etl, run via `devbox run -- bash -c 'cd steel-etl && go …'`). Spec: [`docs/superpowers/specs/2026-06-16-inline-item-cards-design.md`](../specs/2026-06-16-inline-item-cards-design.md).

---

## Pre-flight

- [ ] **Confirm the site package builds and tests pass on the branch**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`
Expected: PASS (clean baseline before any change).

- [ ] **Read the key context** (do not skip): `steel-etl/internal/site/build.go` — the `Build()` post-pass sequence (lines ~95-148) you will hook into, plus the helpers you will reuse: `splitFrontmatter` (~1029), `parseFrontmatterField` (~1047), `stripLeadingHeading` (~639). `steel-etl/internal/site/config.go` — the `Config` struct (~line 12).

---

### Task 1: Config knob `EmbedCardSections`

**Files:**
- Modify: `steel-etl/internal/site/config.go` (the `Config` struct)
- Test: `steel-etl/internal/site/embed_cards_test.go` (create)

- [ ] **Step 1.1: Add the field to `Config`**

In `config.go`, add this field to the `Config` struct, right after the `SearchExclude` field:

```go
	// EmbedCardSections lists section names (e.g. "Browse") whose container
	// pages get embeddable items (abilities/features/traits/statblocks/
	// featureblocks) replaced inline with their finished leaf cards
	// (embed_cards.go). Empty means the default ["Browse"]. Site-only.
	EmbedCardSections []string `yaml:"embed_card_sections,omitempty"`
```

- [ ] **Step 1.2: Write a failing test for the default-section helper**

Create `steel-etl/internal/site/embed_cards_test.go`:

```go
package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEmbedCardSectionsDefault(t *testing.T) {
	if got := embedCardSections(&Config{}); len(got) != 1 || got[0] != "Browse" {
		t.Errorf("default = %v, want [Browse]", got)
	}
	cfg := &Config{EmbedCardSections: []string{"Browse", "Read"}}
	if got := embedCardSections(cfg); len(got) != 2 || got[1] != "Read" {
		t.Errorf("explicit = %v, want [Browse Read]", got)
	}
}
```

- [ ] **Step 1.3: Run it — expect a build failure (undefined: embedCardSections)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestEmbedCardSectionsDefault'`
Expected: build failure `undefined: embedCardSections`. That is RED.

- [ ] **Step 1.4: Create `embed_cards.go` with the helper**

Create `steel-etl/internal/site/embed_cards.go`:

```go
package site

// Site-only post-pass: replace embeddable items inlined in a container page's
// RenderSubtree body (ability/feature/trait/statblock/featureblock sections,
// each carrying a {data-scc="<code>"} heading marker) with that item's finished
// leaf card, transcluded by code. The card renderers (ability_cards.go,
// statblock_card.go, featureblock_page.go, trait_cards.go) are unchanged — this
// only relocates the HTML they already produced into the pages that contain the
// item. The data/ output repos are produced by the pipeline and never see this.
// Design: docs/superpowers/specs/2026-06-16-inline-item-cards-design.md.

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// embedCardSections returns the configured section names, defaulting to Browse.
func embedCardSections(cfg *Config) []string {
	if len(cfg.EmbedCardSections) == 0 {
		return []string{"Browse"}
	}
	return cfg.EmbedCardSections
}
```

- [ ] **Step 1.5: Run the test — expect PASS**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestEmbedCardSectionsDefault'`
Expected: PASS.

- [ ] **Step 1.6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/config.go internal/site/embed_cards.go internal/site/embed_cards_test.go
git commit -m "feat(site): EmbedCardSections config + embed_cards scaffold"
```

---

### Task 2: `leafCard` — extract a card-able leaf's code + card HTML

**Files:**
- Modify: `steel-etl/internal/site/embed_cards.go`
- Test: `steel-etl/internal/site/embed_cards_test.go`

- [ ] **Step 2.1: Write the failing test**

Append to `embed_cards_test.go`:

```go
func TestLeafCard(t *testing.T) {
	// A card-able leaf as buildSection writes it: frontmatter + injected H1
	// + hr + the finished card HTML.
	ability := "---\nname: Repent\nscc: x/feature.ability.censor.level-1/repent\ntype: ability\n---\n\n# Repent\n\n---\n\n<article class=\"sc-ability\">REPENT CARD</article>"
	scc, card, ok := leafCard(ability)
	if !ok {
		t.Fatal("expected card-able ability leaf")
	}
	if scc != "x/feature.ability.censor.level-1/repent" {
		t.Errorf("scc = %q", scc)
	}
	if card != `<article class="sc-ability">REPENT CARD</article>` {
		t.Errorf("card = %q (H1/hr not stripped?)", card)
	}

	// A non-card-able type (a class container page) is rejected.
	class := "---\nname: Censor\nscc: x/class.censor\ntype: class\n---\n\n# Censor\n\nbody"
	if _, _, ok := leafCard(class); ok {
		t.Error("class type should not be card-able")
	}

	// A page with no scc is rejected.
	noscc := "---\nname: X\ntype: ability\n---\n\n# X\n\n---\n\ncard"
	if _, _, ok := leafCard(noscc); ok {
		t.Error("missing scc should be rejected")
	}
}
```

- [ ] **Step 2.2: Run it — expect build failure (undefined: leafCard)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestLeafCard'`
Expected: build failure `undefined: leafCard`. RED.

- [ ] **Step 2.3: Implement `leafCard` + the type set**

Append to `embed_cards.go`:

```go
// cardableType is the set of frontmatter `type` values whose leaf page body is
// a finished card eligible for inline transclusion. Mirrors the leaf transforms
// in buildSection (ability_cards.go: ability/feature/trait; statblock_card.go:
// statblock; featureblock_page.go: featureblock/dynamic-terrain).
var cardableType = map[string]bool{
	"ability":         true,
	"feature":         true,
	"trait":           true,
	"statblock":       true,
	"featureblock":    true,
	"dynamic-terrain": true,
}

// leafCard extracts a card-able leaf page's scc code and its card HTML (the file
// body with the injected "# Name\n\n---\n\n" head stripped). ok=false for pages
// whose type is not card-able or that lack an scc.
func leafCard(content string) (scc, card string, ok bool) {
	fm, body := splitFrontmatter(content)
	if fm == "" {
		return "", "", false
	}
	if !cardableType[strings.TrimSpace(parseFrontmatterField(fm, "type"))] {
		return "", "", false
	}
	scc = strings.TrimSpace(parseFrontmatterField(fm, "scc"))
	if scc == "" {
		return "", "", false
	}
	card = strings.TrimSpace(stripLeadingHeading(strings.TrimLeft(body, "\n")))
	return scc, card, true
}
```

- [ ] **Step 2.4: Run the test — expect PASS**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestLeafCard'`
Expected: PASS.

- [ ] **Step 2.5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/embed_cards.go internal/site/embed_cards_test.go
git commit -m "feat(site): leafCard extracts card HTML from a card-able leaf page"
```

---

### Task 3: `spliceCards` — the heading-walking replacement engine

**Files:**
- Modify: `steel-etl/internal/site/embed_cards.go`
- Test: `steel-etl/internal/site/embed_cards_test.go`

- [ ] **Step 3.1: Write the failing test**

Append to `embed_cards_test.go`. The body mimics a class page: a structural `## Basics`, a structural `## 1st-Level Features`, then three card-able features — `Wrath` (with a non-coded `#### Wrath in Combat` sub-part), `Judgment` (with a nested coded ability that must be swallowed, not duplicated), and `Censor Order`. One heading (`Unknown`) has a code that is NOT in the map and must be left alone with its body intact.

```go
func TestSpliceCards(t *testing.T) {
	body := strings.Join([]string{
		"",
		"# Censor",
		"",
		"---",
		"",
		"## Basics",
		"",
		"Class flavor paragraph.",
		"",
		"## 1st-Level Features",
		"",
		`### Wrath {data-scc="W"}`,
		"",
		"wrath inlined body",
		"",
		"#### Wrath in Combat",
		"",
		"combat sub body",
		"",
		`### Judgment {data-scc="J"}`,
		"",
		`#### Judgment {data-scc="JA"}`,
		"",
		"ability inlined body",
		"",
		`### Unknown {data-scc="U"}`,
		"",
		"unknown body",
		"",
		`### Censor Order {data-scc="CO"}`,
		"",
		"order inlined body",
	}, "\n")

	cards := map[string]string{
		"W":  "<section>WRATH-CARD</section>",
		"J":  "<section>JUDGMENT-CARD</section>",
		"CO": "<section>ORDER-CARD</section>",
		// "JA" intentionally absent — it is swallowed under J.
		// "U" intentionally absent — not card-able.
	}

	got, n := spliceCards(body, "x/class.censor", cards)
	if n != 3 {
		t.Fatalf("spliced %d cards, want 3", n)
	}

	// Structural headings + page body preserved.
	for _, keep := range []string{"# Censor", "## Basics", "Class flavor paragraph.", "## 1st-Level Features"} {
		if !strings.Contains(got, keep) {
			t.Errorf("dropped structural content %q", keep)
		}
	}
	// Card-able headings kept (TOC + permalink anchor) and cards inserted.
	for _, keep := range []string{
		`### Wrath {data-scc="W"}`, "WRATH-CARD",
		`### Judgment {data-scc="J"}`, "JUDGMENT-CARD",
		`### Censor Order {data-scc="CO"}`, "ORDER-CARD",
	} {
		if !strings.Contains(got, keep) {
			t.Errorf("missing kept heading/card %q", keep)
		}
	}
	// Inlined markdown bodies of replaced items are gone (swallowed).
	for _, gone := range []string{
		"wrath inlined body", "combat sub body", "#### Wrath in Combat",
		"ability inlined body", `#### Judgment {data-scc="JA"}`, "order inlined body",
	} {
		if strings.Contains(got, gone) {
			t.Errorf("inlined body %q should have been swallowed", gone)
		}
	}
	// Unknown (non-card-able) heading + its body left untouched.
	if !strings.Contains(got, `### Unknown {data-scc="U"}`) || !strings.Contains(got, "unknown body") {
		t.Error("non-card-able heading must be left intact with its body")
	}
}
```

- [ ] **Step 3.2: Run it — expect build failure (undefined: spliceCards)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSpliceCards'`
Expected: build failure `undefined: spliceCards`. RED.

- [ ] **Step 3.3: Implement `spliceCards` + heading helpers**

Append to `embed_cards.go`:

```go
// dataSCCHeadingRe matches an ATX heading carrying a {data-scc="<code>"}
// attr_list marker (the per-item markers RenderSubtree stamps on descendants).
var dataSCCHeadingRe = regexp.MustCompile(`^(#{1,6})\s+.*\{data-scc="([^"]+)"\}\s*$`)

// atxHeadingRe matches any ATX heading line; len(submatch 1) is the level.
// Headings deeper than H6 were already demoted to bold by RenderSubtree
// (demoteOverflowHeadings), so 1-6 covers every heading reaching this pass.
var atxHeadingRe = regexp.MustCompile(`^(#{1,6})\s`)

// headingLevel returns a line's ATX heading level (1-6), or 0 if not a heading.
func headingLevel(line string) int {
	if m := atxHeadingRe.FindStringSubmatch(line); m != nil {
		return len(m[1])
	}
	return 0
}

// spliceCards rewrites a container page body: for every {data-scc} heading whose
// code is a card-able leaf in cards (and is not the page's own code), the
// heading is kept and its inlined sub-tree (down to the next heading of level <=
// its own) is replaced by the leaf card. Headings whose code is absent, or that
// carry no code, are left intact and descended into. Returns the new body and
// the number of cards spliced.
func spliceCards(body, ownSCC string, cards map[string]string) (string, int) {
	lines := strings.Split(body, "\n")
	out := make([]string, 0, len(lines))
	spliced := 0
	for i := 0; i < len(lines); i++ {
		line := lines[i]
		m := dataSCCHeadingRe.FindStringSubmatch(line)
		if m == nil {
			out = append(out, line)
			continue
		}
		level, code := len(m[1]), m[2]
		card, ok := cards[code]
		if !ok || code == ownSCC {
			out = append(out, line) // keep + descend; children may be card-able
			continue
		}
		// Card-able: keep the heading, drop its inlined sub-tree, insert the card.
		out = append(out, line, "", card, "")
		spliced++
		// Skip the swallowed sub-tree: every following line up to (not incl.) the
		// next heading whose level <= this heading's level.
		for i+1 < len(lines) {
			if lv := headingLevel(lines[i+1]); lv > 0 && lv <= level {
				break
			}
			i++
		}
	}
	return strings.Join(out, "\n"), spliced
}
```

- [ ] **Step 3.4: Run the test — expect PASS**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSpliceCards'`
Expected: PASS.

- [ ] **Step 3.5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/embed_cards.go internal/site/embed_cards_test.go
git commit -m "feat(site): spliceCards heading-walking replacement engine"
```

---

### Task 4: `embedItemCards` — the disk-walking orchestrator

**Files:**
- Modify: `steel-etl/internal/site/embed_cards.go`
- Test: `steel-etl/internal/site/embed_cards_test.go`

- [ ] **Step 4.1: Write the failing integration test (temp docs dir)**

Append to `embed_cards_test.go`. It lays out a tiny Browse tree — one ability leaf and one class container that inlines it — runs `embedItemCards`, and asserts the container got the card while the leaf is untouched.

```go
func TestEmbedItemCards(t *testing.T) {
	docs := t.TempDir()
	browse := filepath.Join(docs, "Browse")
	leafDir := filepath.Join(browse, "feature", "ability", "censor", "level-1")
	classDir := filepath.Join(browse, "class")
	for _, d := range []string{leafDir, classDir} {
		if err := os.MkdirAll(d, 0755); err != nil {
			t.Fatal(err)
		}
	}

	leaf := "---\nname: Repent\nscc: x/feature.ability.censor.level-1/repent\ntype: ability\n---\n\n# Repent\n\n---\n\n<article class=\"sc-ability\">REPENT-CARD</article>\n"
	if err := os.WriteFile(filepath.Join(leafDir, "repent.md"), []byte(leaf), 0644); err != nil {
		t.Fatal(err)
	}

	class := strings.Join([]string{
		"---", "name: Censor", "scc: x/class.censor", "type: class", "---", "",
		"# Censor", "", "---", "",
		"## 1st-Level Features", "",
		`### Repent {data-scc="x/feature.ability.censor.level-1/repent"}`, "",
		"repent inlined markdown body", "",
	}, "\n")
	classPath := filepath.Join(classDir, "censor.md")
	if err := os.WriteFile(classPath, []byte(class), 0644); err != nil {
		t.Fatal(err)
	}

	cfg := &Config{DocsDir: docs}
	count, errs := embedItemCards(cfg)
	if len(errs) != 0 {
		t.Fatalf("errs: %v", errs)
	}
	if count != 1 {
		t.Fatalf("rewrote %d container pages, want 1", count)
	}

	got, _ := os.ReadFile(classPath)
	gs := string(got)
	if !strings.Contains(gs, "REPENT-CARD") {
		t.Error("class page should contain the transcluded card")
	}
	if strings.Contains(gs, "repent inlined markdown body") {
		t.Error("inlined markdown should have been replaced")
	}
	if !strings.Contains(gs, `### Repent {data-scc="x/feature.ability.censor.level-1/repent"}`) {
		t.Error("item heading should be kept")
	}
	if !strings.HasPrefix(gs, "---\nname: Censor") {
		t.Error("frontmatter must be preserved")
	}

	// The leaf page itself is not a container and is left byte-for-byte.
	gotLeaf, _ := os.ReadFile(filepath.Join(leafDir, "repent.md"))
	if string(gotLeaf) != leaf {
		t.Error("leaf page should be untouched")
	}
}
```

- [ ] **Step 4.2: Run it — expect build failure (undefined: embedItemCards)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestEmbedItemCards'`
Expected: build failure `undefined: embedItemCards`. RED.

- [ ] **Step 4.3: Implement `embedItemCards`**

Append to `embed_cards.go`:

```go
// embedItemCards is the Build() post-pass. Over the configured sections it
// builds a scc -> card-HTML map from every card-able leaf, then rewrites each
// container page in place, splicing leaf cards under their {data-scc} headings.
// Returns the number of container pages rewritten plus any errors.
func embedItemCards(cfg *Config) (int, []string) {
	var dirs []string
	for _, s := range embedCardSections(cfg) {
		dir := filepath.Join(cfg.DocsDir, s)
		if _, err := os.Stat(dir); err == nil {
			dirs = append(dirs, dir)
		}
	}

	var errs []string

	// Pass A: scc -> card HTML, from every card-able leaf page.
	cards := map[string]string{}
	for _, dir := range dirs {
		filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
				return nil
			}
			data, rErr := os.ReadFile(path)
			if rErr != nil {
				errs = append(errs, fmt.Sprintf("embed read %s: %v", path, rErr))
				return nil
			}
			if scc, card, ok := leafCard(string(data)); ok {
				cards[scc] = card
			}
			return nil
		})
	}

	// Pass B: splice into container pages (those still holding markdown
	// {data-scc} heading markers; leaf cards are HTML and never match).
	count := 0
	for _, dir := range dirs {
		filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
				return nil
			}
			data, rErr := os.ReadFile(path)
			if rErr != nil {
				errs = append(errs, fmt.Sprintf("embed read %s: %v", path, rErr))
				return nil
			}
			fm, body := splitFrontmatter(string(data))
			if fm == "" || !strings.Contains(body, `{data-scc="`) {
				return nil
			}
			ownSCC := strings.TrimSpace(parseFrontmatterField(fm, "scc"))
			newBody, n := spliceCards(body, ownSCC, cards)
			if n == 0 {
				return nil
			}
			out := "---\n" + fm + "\n---" + newBody
			if wErr := os.WriteFile(path, []byte(out), 0644); wErr != nil {
				errs = append(errs, fmt.Sprintf("embed write %s: %v", path, wErr))
				return nil
			}
			count++
			return nil
		})
	}

	return count, errs
}
```

- [ ] **Step 4.4: Run the test — expect PASS**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestEmbedItemCards'`
Expected: PASS.

- [ ] **Step 4.5: Run the whole site package (regression)**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'`
Expected: PASS.

- [ ] **Step 4.6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/embed_cards.go internal/site/embed_cards_test.go
git commit -m "feat(site): embedItemCards post-pass orchestrator"
```

---

### Task 5: Wire `embedItemCards` into `Build()`

**Files:**
- Modify: `steel-etl/internal/site/build.go` (`BuildResult` struct ~line 27; `Build()` ~after line 117)

- [ ] **Step 5.1: Add a result counter**

In `build.go`, add to the `BuildResult` struct (after `PrintingStamps int`):

```go
	EmbeddedCards  int
```

- [ ] **Step 5.2: Call the post-pass after index/bestiary passes**

In `Build()`, immediately after the bestiary-search block (the `if ok, err := buildBestiarySearchPage(...)` block, ~line 117) and before the `// Apply search exclusion` loop, insert:

```go
	// Inline item cards: over the configured sections (default Browse), replace
	// each embeddable item inlined in a container page (its {data-scc} heading)
	// with that item's finished leaf card. Runs after every leaf + index page is
	// written; before the frontmatter-only passes below. Site-only — the data/
	// repos are produced by the pipeline and are unaffected.
	embedCount, embedErrs := embedItemCards(cfg)
	result.EmbeddedCards = embedCount
	result.Errors = append(result.Errors, embedErrs...)
```

- [ ] **Step 5.3: Build + test the package**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/site/'`
Expected: PASS.

- [ ] **Step 5.4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add internal/site/build.go
git commit -m "feat(site): run embedItemCards post-pass in Build()"
```

---

### Task 6: Real build + verification (Browse)

**Files:** none (verification only). The two repos: workspace root is the parent of `steel-etl/` and `v2/`.

- [ ] **Step 6.1: Regenerate the site from current ETL output**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```
Expected: clean run (build summary printed, no errors). This rewrites `v2/docs/Browse/**`.

- [ ] **Step 6.2: Assert cards embedded + inlined markdown gone on the Censor page**

```bash
cd /home/vexa/code/steel_compendium/workspace/v2/docs/Browse
grep -c 'class="sc-trait\|class="sc-ability' class/censor.md   # expect many (cards present)
grep -c 'sb-wrap' class/beastheart.md                          # expect >=1 (statblock embed)
grep -c 'data-scc=' class/censor.md                            # kept item headings remain
```
Expected: the first two counts are non-zero; the page now carries card HTML. Spot-check that `## Basics` and the advancement table survive: `grep -n '## Basics\|Censor Advancement Table' class/censor.md` → both present.

- [ ] **Step 6.3: Build the MkDocs site and time it**

```bash
cd /home/vexa/code/steel_compendium/workspace/v2
time devbox run -- mkdocs build
```
Expected: clean build. Note the wall-clock time and compare to a normal build (the perf gate for the later Read decision). Record the number in the PR/handoff.

- [ ] **Step 6.4: Visual spot-check for the user**

Serve and screenshot `Browse/class/censor` (a feature-dense page) and `Browse/class/beastheart` (statblock embed), dark scheme, showing the embedded cards under their headings. Use the Brave + playwright-core pattern from memory (`/opt/brave.com/brave/brave`). Save to `/tmp/embed-censor.png`, `/tmp/embed-beastheart.png`; show both to the user. Confirm: cards render under their kept headings, no leftover raw markdown stat tables, no duplicated abilities.

- [ ] **Step 6.5: Commit the regenerated v2 docs (v2 repo)**

```bash
cd /home/vexa/code/steel_compendium/workspace/v2
git add docs/Browse
git commit -m "build: embed inline item cards on Browse container pages"
```

---

### Task 7: Config knob in site.yaml + docs

**Files:**
- Modify: `v2/site.yaml`
- Modify: `steel-etl/CLAUDE.md`
- Modify: `steel-etl/docs/site-builder.md`

- [ ] **Step 7.1: Document the knob in `v2/site.yaml`**

Add, near the top-level keys (e.g. after `search_exclude:`), the explicit default so enabling Read later is a one-line edit:

```yaml
# Sections whose container pages embed inline item cards (abilities, features,
# traits, statblocks, featureblocks) in place of their inlined markdown. Browse
# only for now; add "Read" here after the page-weight check on the long Classes
# chapter passes. See docs/superpowers/specs/2026-06-16-inline-item-cards-design.md.
embed_card_sections:
  - Browse
```

- [ ] **Step 7.2: Rebuild to confirm the explicit config behaves identically**

```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
cd v2 && git diff --stat docs/Browse | tail -1
```
Expected: clean run; `git diff` shows no change vs. Task 6's output (the explicit `[Browse]` equals the default).

- [ ] **Step 7.3: Add a Key-files row + note in `steel-etl/CLAUDE.md`**

In the Key files table, after the `statblock_card.go` row, add:

```
| `internal/site/embed_cards.go` | Site-only post-pass: transcludes finished leaf cards inline on container pages by `{data-scc}` code (Browse via `embed_card_sections`) |
```

- [ ] **Step 7.4: Document the pass in `steel-etl/docs/site-builder.md`**

Add a section (placement: after the page-transform/card descriptions):

```markdown
## Inline item cards (`embed_cards.go`)

A site-only `Build()` post-pass (after index generation) that makes a container
page — a `RenderSubtree` body such as a class page — show its embedded items as
the same High-Fantasy Steel cards their own leaf pages show, instead of plain
inlined markdown. It builds a `scc → card-HTML` map from every card-able leaf
(`type` ∈ ability/feature/trait/statblock/featureblock/dynamic-terrain) in the
configured sections (`embed_card_sections`, default `["Browse"]`), then for each
`{data-scc="X"}` heading in a container page keeps the heading and replaces its
inlined sub-tree with the mapped card, swallowing nested markers (the recursive
feature/trait leaf cards already contain their children). The card renderers are
untouched — finished HTML is relocated. The shared `PageBody` that feeds the
`data/` repos is never modified. Design:
`docs/superpowers/specs/2026-06-16-inline-item-cards-design.md`.
```

- [ ] **Step 7.5: Commit (both repos)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add CLAUDE.md docs/site-builder.md
git commit -m "docs: inline item-card embedding post-pass"

cd /home/vexa/code/steel_compendium/workspace/v2
git add site.yaml
git commit -m "config: embed_card_sections (Browse) for inline item cards"
```

---

## Self-review checklist (completed during plan authoring)

- **Spec coverage:** Component 1 (post-pass) → Tasks 2-5; map build (Pass A) → Task 4; splice engine + heading/swallow rule → Task 3; Component 2 (config) → Tasks 1, 7; staging/perf gate → Task 6 (timing) + Task 7 (knob); testing (unit + build assertion + visual) → Tasks 2-4, 6; out-of-scope Read/visual/data untouched → respected (no pipeline edits; default Browse-only).
- **Placeholder scan:** none — every code/test block is complete and concrete.
- **Type consistency:** `embedCardSections`, `cardableType`, `leafCard`, `dataSCCHeadingRe`, `atxHeadingRe`, `headingLevel`, `spliceCards`, `embedItemCards`, `Config.EmbedCardSections`, `BuildResult.EmbeddedCards` are used identically across Tasks 1-7.

## Out of scope (tracked as follow-up after the perf check)

- Read-tab embedding — add `Read` to `embed_card_sections` once Task 6.3's timing on the long Classes chapter is acceptable.
- Any card visual change (renderers frozen).
- Any pipeline / `data-*` output change.

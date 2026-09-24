# Book-text search gap-fill + rule pages (SC-329) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every word of the four books findable from site search without duplicate
results, and give ten high-value Heroes rules sections their own Browse pages.

**Architecture:** steel-etl's site builder stops excluding the Read tab from search
wholesale; instead it marks `data-search-exclude=""` on every Read heading whose section
(or an ancestor's) already has a Browse page, so Material indexes only uncovered book text.
The v2 search worker labels book results with their book. Ten `rule.*` annotations in the
Heroes source create the new Browse pages (and automatically drop their Read copies from
the index).

**Tech Stack:** Go (steel-etl, `internal/site`), MkDocs Material 9.7 search plugin, vanilla
JS search worker (MiniSearch, `node:test`), Markdown book source with `<!-- @type -->`
annotations.

**Spec:** `docs/superpowers/specs/2026-09-23-book-search-gap-fill-design.md` (workspace
root). Read it before starting any task.

## Global Constraints

- **Worktree only.** All work happens in `/home/scott/code/steelCompendium/worktrees/sc329-book-search`
  (every submodule is on branch `sc329-book-search`). Never edit
  `/home/scott/code/steelCompendium/workspace` (the shared main checkout). Below, `$WT`
  means that worktree path — write it out literally in commands (shell vars do not persist
  between tool calls).
- **Tooling via devbox:** `devbox run -- bash -c 'cd <absolute path> && <cmd>'` (devbox
  resets cwd to the devbox root; `$PIPESTATUS` / `${var:-x}` break under its `sh` wrapper).
- **Never commit generated output:** `data/`, `v2/docs/**` (Browse/Read/scc and every other
  file steel-etl writes there), `v2/site/`, `steelCompendium.github.io/docs/api/`,
  `steel-etl/classification.json`, `steel-etl/output/`. Local verification builds
  regenerate these; revert them before committing (commands given where it matters).
- **Commits:** commit inside the submodule you changed (steel-etl or v2) on branch
  `sc329-book-search`; workspace-level docs commit in the superproject. **No
  `Co-Authored-By` or any AI-attribution trailer** in commit messages. Do not push.
- **Exact values from the spec:** config key `search_uncovered_only`; attribute text
  `data-search-exclude=""`; book-label separator `" · "` (space, U+00B7 middle dot, space);
  the ten SCC codes exactly as listed in Task 4.
- **Payload budget:** indexed Read docs may add at most **+30%** to the index's non-Read
  bytes; above that, stop and report instead of shipping.

## Review Focus

- A covered subtree followed by a shallower uncovered heading (`#### Size and Space`
  covered → `### Movement` must NOT inherit coverage) — pinned in Task 1's
  `TestMarkCoveredHeadings`.
- Running the marker twice (rebuild over already-marked pages) must not double-append the
  attribute or change the file — pinned in Task 1's `TestMarkCoveredHeadings_Idempotent`.
- YAML frontmatter lines starting with `#` (comments) must never be treated as headings —
  pinned in Task 1's `TestMarkCoveredHeadings` (frontmatter comment line).
- A book result whose page-level doc did not itself match the query (only a section
  matched) must still show the book label on the group title — pinned in Task 3's
  "label on a non-matching page doc" test.
- Exact-title lookups of Browse pages must not start losing to same-named uncovered Read
  sections (e.g. a Read `## Treasures` section vs a Browse page titled "Treasures") —
  pinned by Task 5's `search-bench --gate` sweep (≥95% #1) plus the `size and space`
  absence guard.

---

### Task 1: steel-etl — coverage detection and heading marking (pure functions)

**Files:**
- Create: `steel-etl/internal/site/search_coverage.go`
- Test: `steel-etl/internal/site/search_coverage_test.go`

**Interfaces:**
- Consumes: `splitFrontmatter(content string) (frontmatter, body string)` and
  `parseFrontmatterField(fm, key string) string` (both in `build.go`).
- Produces (used by Task 2):
  - `collectIndexedCodes(sectionDir string, codes map[string]bool) []string` — adds every
    SCC code represented in `sectionDir` (page `scc:` frontmatter + heading `data-scc`) to
    `codes`; returns error strings.
  - `markCoveredHeadings(content string, covered map[string]bool) (string, int)` — returns
    new content + number of headings newly marked.
  - `applyUncoveredOnlySearch(docsDir, sectionName string, covered map[string]bool) (pages, headings int, errs []string)`.

- [ ] **Step 1: Write the failing tests**

Create `steel-etl/internal/site/search_coverage_test.go`:

```go
package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const (
	covSize     = "mcdm.heroes.v1/rule.character/size"
	covShifting = "mcdm.heroes.v1/movement/shifting"
	covWalk     = "mcdm.heroes.v1/movement/walk"
	// A code whose section has no Browse page (e.g. site.yaml excludes it):
	// its Read copy must stay searchable.
	covNoBrowse = "mcdm.heroes.v1/feature.trait.ancestry-traits/devil-traits"
)

func TestMarkCoveredHeadings(t *testing.T) {
	covered := map[string]bool{covSize: true, covShifting: true, covWalk: true}
	in := strings.Join([]string{
		"---",
		"name: Combat",
		"# a YAML comment, not a heading",
		"---",
		"",
		"# Combat {.sc-chtitle}",
		"Intro.",
		`#### Size and Space {data-scc="` + covSize + `"}`,
		"Size text.",
		"###### Creature Sizes Table",
		"### Movement",
		"Move freely through an ally's space.",
		"#### Can't Cut Corners",
		`#### Shifting {data-scc="` + covShifting + `"}`,
		"#### Movement Types",
		`##### Walk {data-scc="` + covWalk + `"}`,
		"###### Walk Detail   ",
		"### End of Combat",
		"#### How Combat Ends",
		"```",
		"# code, not a heading",
		"```",
		`#### Devil Traits {data-scc="` + covNoBrowse + `"}`,
	}, "\n")
	want := strings.Join([]string{
		"---",
		"name: Combat",
		"# a YAML comment, not a heading",
		"---",
		"",
		"# Combat {.sc-chtitle}",
		"Intro.",
		`#### Size and Space {data-scc="` + covSize + `" data-search-exclude=""}`,
		"Size text.",
		`###### Creature Sizes Table {data-search-exclude=""}`,
		"### Movement",
		"Move freely through an ally's space.",
		"#### Can't Cut Corners",
		`#### Shifting {data-scc="` + covShifting + `" data-search-exclude=""}`,
		"#### Movement Types",
		`##### Walk {data-scc="` + covWalk + `" data-search-exclude=""}`,
		`###### Walk Detail {data-search-exclude=""}`,
		"### End of Combat",
		"#### How Combat Ends",
		"```",
		"# code, not a heading",
		"```",
		`#### Devil Traits {data-scc="` + covNoBrowse + `"}`,
	}, "\n")

	got, n := markCoveredHeadings(in, covered)
	if got != want {
		t.Errorf("markCoveredHeadings mismatch\n got:\n%s\nwant:\n%s", got, want)
	}
	if n != 5 {
		t.Errorf("marked %d headings, want 5", n)
	}
}

func TestMarkCoveredHeadings_Idempotent(t *testing.T) {
	covered := map[string]bool{covSize: true}
	in := `#### Size and Space {data-scc="` + covSize + `"}` + "\n###### Creature Sizes Table\n"
	once, n1 := markCoveredHeadings(in, covered)
	twice, n2 := markCoveredHeadings(once, covered)
	if n1 != 2 {
		t.Errorf("first pass marked %d, want 2", n1)
	}
	if n2 != 0 || twice != once {
		t.Errorf("second pass must be a no-op: marked %d\n%s", n2, twice)
	}
}

func writeCoverageFile(t *testing.T, root, rel, content string) {
	t.Helper()
	path := filepath.Join(root, rel)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestCollectIndexedCodes(t *testing.T) {
	dir := t.TempDir()
	// A container page: its own code in frontmatter, a coded child inline under
	// its own heading, and a heading-looking line inside fenced code (ignored).
	writeCoverageFile(t, dir, "rule/combat/condition.md",
		"---\nname: Conditions\nscc: mcdm.heroes.v1/rule.combat/condition\ntype: rule\n---\n\n# Conditions\n\n"+
			"## Bleeding {data-scc=\"mcdm.heroes.v1/condition/bleeding\"}\n\nText.\n\n"+
			"```\n## Fake {data-scc=\"mcdm.heroes.v1/rule.combat/fake\"}\n```\n")
	// Quoted frontmatter value.
	writeCoverageFile(t, dir, "class/fury.md", "---\nname: Fury\nscc: \"mcdm.heroes.v1/class/fury\"\ntype: class\n---\n\n# Fury\n")
	// Non-markdown files are ignored.
	writeCoverageFile(t, dir, "notes.txt", "scc: mcdm.heroes.v1/rule.combat/ignored\n")

	codes := map[string]bool{}
	if errs := collectIndexedCodes(dir, codes); len(errs) > 0 {
		t.Fatalf("errors: %v", errs)
	}
	want := []string{
		"mcdm.heroes.v1/rule.combat/condition",
		"mcdm.heroes.v1/condition/bleeding",
		"mcdm.heroes.v1/class/fury",
	}
	for _, c := range want {
		if !codes[c] {
			t.Errorf("missing code %s", c)
		}
	}
	if len(codes) != len(want) {
		t.Errorf("got %d codes, want %d: %v", len(codes), len(want), codes)
	}
}

func TestCollectIndexedCodes_MissingDir(t *testing.T) {
	codes := map[string]bool{}
	if errs := collectIndexedCodes(filepath.Join(t.TempDir(), "nope"), codes); len(errs) > 0 {
		t.Errorf("missing dir must not error: %v", errs)
	}
	if len(codes) != 0 {
		t.Errorf("missing dir must add no codes: %v", codes)
	}
}

func TestApplyUncoveredOnlySearch(t *testing.T) {
	dir := t.TempDir()
	combat := "---\nname: Combat\ntype: chapter\n---\n\n# Combat\n\n" +
		`#### Size and Space {data-scc="` + covSize + `"}` + "\n\nSize text.\n\n### Movement\n\nMove freely.\n"
	tests := "---\nname: Tests\ntype: chapter\n---\n\n# Tests\n\nNo coded headings.\n"
	writeCoverageFile(t, dir, "Read/heroes/combat.md", combat)
	writeCoverageFile(t, dir, "Read/heroes/tests.md", tests)

	pages, headings, errs := applyUncoveredOnlySearch(dir, "Read", map[string]bool{covSize: true})
	if len(errs) > 0 {
		t.Fatalf("errors: %v", errs)
	}
	if pages != 2 || headings != 1 {
		t.Errorf("pages=%d headings=%d, want 2 and 1", pages, headings)
	}
	got, _ := os.ReadFile(filepath.Join(dir, "Read/heroes/combat.md"))
	if !strings.Contains(string(got), `#### Size and Space {data-scc="`+covSize+`" data-search-exclude=""}`) {
		t.Errorf("covered heading not marked:\n%s", got)
	}
	if !strings.Contains(string(got), "### Movement\n") {
		t.Errorf("uncovered heading must stay unmarked:\n%s", got)
	}
	if strings.Contains(string(got), "search:") {
		t.Errorf("uncovered-only pages must not get a search: frontmatter key:\n%s", got)
	}
	untouched, _ := os.ReadFile(filepath.Join(dir, "Read/heroes/tests.md"))
	if string(untouched) != tests {
		t.Errorf("page without covered headings must be byte-identical:\n%s", untouched)
	}

	if p, h, e := applyUncoveredOnlySearch(dir, "Missing", nil); p != 0 || h != 0 || e != nil {
		t.Errorf("missing section: got %d %d %v", p, h, e)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go test ./internal/site/ -run "MarkCoveredHeadings|CollectIndexedCodes|ApplyUncoveredOnlySearch" 2>&1 | tail -20'`
Expected: FAIL — `undefined: markCoveredHeadings` (and the other two functions).

- [ ] **Step 3: Write the implementation**

Create `steel-etl/internal/site/search_coverage.go`:

```go
package site

// Book-text search gap-fill (SC-329). Sections listed in `search_uncovered_only`
// (v2: Read) are indexed by Material's search EXCEPT headings whose section a
// fully-indexed section (v2: Browse) already carries: those get
// data-search-exclude="" in their attr_list, so every piece of book text is
// findable exactly once — from its Browse page when it has one, from the book
// otherwise. Material opens a new index section at EVERY heading
// (material/plugins/search/plugin.py Parser), so every covered heading is
// marked, not only the root of a covered subtree. Heading-level exclusion is
// safe from the tag-name-keyed skip-set bug that forced markSearchExcluded's
// <address> wrapper: headings never nest, so the heading's own close tag
// clears it. Spec: workspace
// docs/superpowers/specs/2026-09-23-book-search-gap-fill-design.md.

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	// atxHeadingRe matches an ATX heading line ("### Title {attrs}").
	atxHeadingRe = regexp.MustCompile(`^(#{1,6})[ \t]+\S`)
	// headingSCCRe extracts the code RenderSubtree stamps on a coded heading.
	headingSCCRe = regexp.MustCompile(`data-scc="([^"]+)"`)
	// trailingAttrListRe matches a heading's trailing attr_list block.
	trailingAttrListRe = regexp.MustCompile(`\{[^{}]*\}$`)
	// fenceRe matches a fenced-code delimiter line.
	fenceRe = regexp.MustCompile("^[ \t]{0,3}(```|~~~)")
)

// searchExcludeAttr is the explicit key="" form: it does not rely on
// attr_list's bare-key parsing, and Material only tests the key's presence.
const searchExcludeAttr = `data-search-exclude=""`

// bodyStart returns the index of the first line after YAML frontmatter (0 when
// there is none, or it is unterminated).
func bodyStart(lines []string) int {
	if len(lines) == 0 || lines[0] != "---" {
		return 0
	}
	for i := 1; i < len(lines); i++ {
		if lines[i] == "---" {
			return i + 1
		}
	}
	return 0
}

// forEachHeading calls fn with the index and level of every ATX heading line
// outside YAML frontmatter and fenced code.
func forEachHeading(lines []string, fn func(i, level int)) {
	fence := ""
	for i := bodyStart(lines); i < len(lines); i++ {
		if m := fenceRe.FindStringSubmatch(lines[i]); m != nil {
			switch {
			case fence == "":
				fence = m[1]
			case m[1] == fence:
				fence = ""
			}
			continue
		}
		if fence != "" {
			continue
		}
		if m := atxHeadingRe.FindStringSubmatch(lines[i]); m != nil {
			fn(i, len(m[1]))
		}
	}
}

// collectIndexedCodes adds every SCC code represented in sectionDir to codes:
// each page's `scc:` frontmatter, plus each heading's data-scc (a container
// page renders its coded children inline under their own headings — e.g.
// rule.combat/condition carries every condition/*). A missing dir adds nothing.
func collectIndexedCodes(sectionDir string, codes map[string]bool) []string {
	var errs []string
	filepath.Walk(sectionDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}
		data, readErr := os.ReadFile(path)
		if readErr != nil {
			errs = append(errs, fmt.Sprintf("read %s: %v", path, readErr))
			return nil
		}
		content := string(data)
		fm, _ := splitFrontmatter(content)
		if code := parseFrontmatterField(fm, "scc"); code != "" {
			codes[code] = true
		}
		lines := strings.Split(content, "\n")
		forEachHeading(lines, func(i, _ int) {
			if m := headingSCCRe.FindStringSubmatch(lines[i]); m != nil {
				codes[m[1]] = true
			}
		})
		return nil
	})
	return errs
}

// markCoveredHeadings adds data-search-exclude="" to every covered heading: one
// whose data-scc code is in covered, or that sits under such a heading.
// Returns the new content and how many headings it marked. Idempotent: an
// already-marked heading is left alone and not counted.
func markCoveredHeadings(content string, covered map[string]bool) (string, int) {
	lines := strings.Split(content, "\n")
	type open struct {
		level   int
		covered bool
	}
	var stack []open
	marked := 0
	forEachHeading(lines, func(i, level int) {
		for len(stack) > 0 && stack[len(stack)-1].level >= level {
			stack = stack[:len(stack)-1]
		}
		// The top of the stack already folds in its own ancestors' coverage.
		isCovered := len(stack) > 0 && stack[len(stack)-1].covered
		if m := headingSCCRe.FindStringSubmatch(lines[i]); m != nil && covered[m[1]] {
			isCovered = true
		}
		stack = append(stack, open{level, isCovered})
		if isCovered && !strings.Contains(lines[i], "data-search-exclude") {
			lines[i] = withSearchExclude(lines[i])
			marked++
		}
	})
	return strings.Join(lines, "\n"), marked
}

// withSearchExclude appends the exclusion attribute inside a heading's
// trailing attr_list, or adds a new one.
func withSearchExclude(line string) string {
	line = strings.TrimRight(line, " \t")
	if trailingAttrListRe.MatchString(line) {
		return line[:len(line)-1] + " " + searchExcludeAttr + "}"
	}
	return line + " {" + searchExcludeAttr + "}"
}

// applyUncoveredOnlySearch marks the covered headings on every page of a
// search_uncovered_only section. Returns pages visited and headings marked;
// pages with nothing to mark are not rewritten.
func applyUncoveredOnlySearch(docsDir, sectionName string, covered map[string]bool) (int, int, []string) {
	sectionDir := filepath.Join(docsDir, sectionName)
	if _, err := os.Stat(sectionDir); os.IsNotExist(err) {
		return 0, 0, nil
	}
	pages, headings := 0, 0
	var errs []string
	filepath.Walk(sectionDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}
		data, readErr := os.ReadFile(path)
		if readErr != nil {
			errs = append(errs, fmt.Sprintf("read %s: %v", path, readErr))
			return nil
		}
		pages++
		out, n := markCoveredHeadings(string(data), covered)
		if n == 0 {
			return nil
		}
		headings += n
		if writeErr := os.WriteFile(path, []byte(out), 0644); writeErr != nil {
			errs = append(errs, fmt.Sprintf("write %s: %v", path, writeErr))
		}
		return nil
	})
	return pages, headings, errs
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go test ./internal/site/ -run "MarkCoveredHeadings|CollectIndexedCodes|ApplyUncoveredOnlySearch" -v 2>&1 | tail -20 && go vet ./internal/site/'`
Expected: all five tests PASS; `go vet` silent.

- [ ] **Step 5: Commit (in the steel-etl submodule)**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl
git add internal/site/search_coverage.go internal/site/search_coverage_test.go
git commit -m "feat(site): detect Browse-covered headings for uncovered-only search (SC-329)"
```

---

### Task 2: steel-etl — wire `search_uncovered_only` into the build; switch v2 to it

**Files:**
- Modify: `steel-etl/internal/site/config.go:26-27` (add field after `SearchExclude`)
- Modify: `steel-etl/internal/site/build.go:27-37` (`BuildResult`), `:231-236` (call site),
  `:465-470` (comment only)
- Modify: `steel-etl/internal/site/search_boost.go:1-11` (header comment only)
- Modify: `steel-etl/internal/cli/site.go:47` (print line)
- Modify: `v2/site.yaml` (the `search_exclude:` block near the end)
- Modify: `ARCHITECTURE.md`, `steel-etl/AGENTS.md:70`, and any other doc found by the grep
  in Step 7
- Test: `steel-etl/internal/site/config_test.go`, `steel-etl/internal/site/build_test.go`

**Interfaces:**
- Consumes (Task 1): `collectIndexedCodes`, `applyUncoveredOnlySearch`.
- Produces: `Config.SearchUncoveredOnly []string` (yaml `search_uncovered_only`);
  `BuildResult.SearchUncoveredPages int`, `BuildResult.SearchExcludedHeadings int`.

- [ ] **Step 1: Write the failing tests**

Append to `steel-etl/internal/site/config_test.go`:

```go
func TestLoadSiteConfig_SearchUncoveredOnly(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "site.yaml")
	content := "docs_dir: ./docs\nsearch_uncovered_only:\n  - Read\n"
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	cfg, err := LoadSiteConfig(path)
	if err != nil {
		t.Fatalf("LoadSiteConfig failed: %v", err)
	}
	if len(cfg.SearchUncoveredOnly) != 1 || cfg.SearchUncoveredOnly[0] != "Read" {
		t.Errorf("SearchUncoveredOnly = %v", cfg.SearchUncoveredOnly)
	}
	if len(cfg.SearchExclude) != 0 {
		t.Errorf("SearchExclude = %v, want empty", cfg.SearchExclude)
	}
}
```

Append to `steel-etl/internal/site/build_test.go`:

```go
// SC-329: an uncovered-only section is indexed except the headings a Browse
// page already carries.
func TestBuild_SearchUncoveredOnly(t *testing.T) {
	srcDir := t.TempDir()
	files := map[string]string{
		"rule/character/size.md": "---\nname: Size and Space\nscc: mcdm.heroes.v1/rule.character/size\ntype: rule\n---\n\nSize text.\n",
		"chapter/combat.md": "---\nname: Combat\nscc: mcdm.heroes.v1/chapter/combat\ntype: chapter\n---\n\n# Combat\n\n" +
			"#### Size and Space {data-scc=\"mcdm.heroes.v1/rule.character/size\"}\n\nSize text.\n\n" +
			"### Movement\n\nMove freely through an ally's space.\n",
	}
	for rel, content := range files {
		path := filepath.Join(srcDir, rel)
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	docsDir := filepath.Join(t.TempDir(), "docs")
	os.MkdirAll(docsDir, 0755)

	cfg := &Config{
		SourceDir: srcDir,
		DocsDir:   docsDir,
		Sections: []SectionConfig{
			{Name: "Browse", Include: []string{"rule/"}},
			{Name: "Read", Include: []string{"chapter/"}},
		},
		SearchUncoveredOnly: []string{"Read"},
	}
	result, err := Build(cfg)
	if err != nil {
		t.Fatalf("Build failed: %v", err)
	}
	if result.SearchExcludedHeadings != 1 {
		t.Errorf("SearchExcludedHeadings = %d, want 1 (errors: %v)", result.SearchExcludedHeadings, result.Errors)
	}
	if result.SearchUncoveredPages == 0 {
		t.Error("SearchUncoveredPages = 0, want the Read pages counted")
	}

	read, err := os.ReadFile(filepath.Join(docsDir, "Read", "chapter", "combat.md"))
	if err != nil {
		t.Fatalf("read Read page: %v", err)
	}
	content := string(read)
	if !strings.Contains(content, `#### Size and Space {data-scc="mcdm.heroes.v1/rule.character/size" data-search-exclude=""}`) {
		t.Errorf("covered heading not marked:\n%s", content)
	}
	if !strings.Contains(content, "### Movement\n") {
		t.Errorf("uncovered heading must stay unmarked:\n%s", content)
	}
	fm, _ := splitFrontmatter(content)
	if strings.Contains(fm, "search:") {
		t.Errorf("Read page must not carry a search: frontmatter key:\n%s", fm)
	}

	browse, err := os.ReadFile(filepath.Join(docsDir, "Browse", "rule", "character", "size.md"))
	if err != nil {
		t.Fatalf("read Browse page: %v", err)
	}
	if strings.Contains(string(browse), "data-search-exclude") {
		t.Errorf("Browse page must never be marked:\n%s", browse)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go test ./internal/site/ -run "SearchUncoveredOnly" 2>&1 | tail -20'`
Expected: compile FAIL — `unknown field SearchUncoveredOnly` / `result.SearchExcludedHeadings undefined`.

- [ ] **Step 3: Add the config field**

In `steel-etl/internal/site/config.go`, directly after the `SearchExclude` field:

```go
	// SearchUncoveredOnly lists sections (v2: Read) that are search-indexed
	// except for the headings whose section a fully-indexed section (Browse)
	// already carries — those are marked data-search-exclude (search_coverage.go,
	// SC-329).
	SearchUncoveredOnly []string `yaml:"search_uncovered_only,omitempty"`
```

- [ ] **Step 4: Add the result fields and the build pass**

In `steel-etl/internal/site/build.go`, `BuildResult` — add after `SearchExclude  int`:

```go
	SearchUncoveredPages   int
	SearchExcludedHeadings int
```

(then run `gofmt` in Step 6 to realign the struct).

Directly after the existing `// Apply search exclusion` loop (the one calling
`applySearchExclusion`, ~L231-236) and before `// Copy static content overrides`, insert:

```go
	// SC-329: uncovered-only sections are indexed minus every heading that a
	// fully-indexed section (Browse) already carries (search_coverage.go).
	if len(cfg.SearchUncoveredOnly) > 0 {
		covered := map[string]bool{}
		for _, s := range cfg.Sections {
			if searchExcluded(cfg.SearchExclude, s.Name) || searchExcluded(cfg.SearchUncoveredOnly, s.Name) {
				continue
			}
			result.Errors = append(result.Errors, collectIndexedCodes(filepath.Join(cfg.DocsDir, s.Name), covered)...)
		}
		for _, sectionName := range cfg.SearchUncoveredOnly {
			pages, headings, errs := applyUncoveredOnlySearch(cfg.DocsDir, sectionName, covered)
			result.SearchUncoveredPages += pages
			result.SearchExcludedHeadings += headings
			result.Errors = append(result.Errors, errs...)
		}
	}
```

Replace the comment above `if !searchExcluded(cfg.SearchExclude, section.Name) {` (~L465-467)
with:

```go
		// Per-type search ranking boost — skipped for search_exclude sections
		// (applySearchExclusion later prepends its own `search:` key and YAML
		// forbids duplicate keys). search_uncovered_only sections (Read) get the
		// normal per-type boost; their `chapter` type is unmapped, so default 1.
```

- [ ] **Step 5: Update the search_boost.go header comment and the CLI output**

In `steel-etl/internal/site/search_boost.go`, replace the header-comment sentence
`Injected in buildSection for non-search-excluded sections only — Read pages get \`search: exclude\` later (applySearchExclusion) and MUST NOT carry a second \`search:\` YAML key.`
with:
`Injected in buildSection for every section not in search_exclude (those get \`search: exclude\` later via applySearchExclusion and MUST NOT carry a second \`search:\` YAML key). v2's Read tab is search_uncovered_only (SC-329): its chapter pages are unmapped here, so they keep the default boost 1 and Browse pages win ties.`
(Keep the comment's line wrapping at ~80 columns.)

In `steel-etl/internal/cli/site.go`, after the `Search exclude:` Printf line add:

```go
	fmt.Printf("Search uncovered-only: %d pages, %d covered headings excluded\n", result.SearchUncoveredPages, result.SearchExcludedHeadings)
```

- [ ] **Step 6: Run the full steel-etl suite**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && gofmt -l ./internal/ && go vet ./... && go test ./... 2>&1 | tail -25'`
Expected: `gofmt -l` prints nothing (if it lists files, run `gofmt -w` on them and re-run);
all packages `ok`. The pre-existing `TestBuild_SearchExclusion` /
`TestApplySearchExclusion_*` still pass (`search_exclude` stays supported).

- [ ] **Step 7: Switch v2 to the new key, update docs**

In `v2/site.yaml`, replace:

```yaml
# Exclude these sections from search (avoids duplicate results)
search_exclude:
  - Read
```

with:

```yaml
# Search coverage (SC-329). Read is indexed EXCEPT the headings whose section a
# Browse page already carries (steel-etl marks those data-search-exclude), so
# every piece of book text is findable exactly once: text with no Browse page
# (movement basics, Director guidance, worked examples…) comes up from Read,
# everything else from its Browse page. `search_exclude` (whole sections) is
# still supported but unused here.
search_uncovered_only:
  - Read
```

Docs:
- `ARCHITECTURE.md`: after the `- **Section mapping** -- …` bullet (~L94), add a bullet:
  `- **Search coverage** -- Browse is fully indexed; Read is indexed only where no Browse page carries the text. \`search_coverage.go\` marks every Read heading whose section (or an ancestor's) has a Browse page with \`data-search-exclude=""\` (\`v2/site.yaml\` \`search_uncovered_only: [Read]\`, SC-329); Material opens an index section per heading, so each covered heading is marked. A section that later gains a Browse page drops out of Read's index automatically.`
- `steel-etl/AGENTS.md:70`: change `**search exclusion** for Read pages` to
  `**uncovered-only search indexing** for Read pages (\`search_coverage.go\`)`.
- Run `grep -rn -i "search_exclude\|search exclusion\|applySearchExclusion\|excluded from search" /home/scott/code/steelCompendium/worktrees/sc329-book-search/{ARCHITECTURE.md,steel-etl/docs,v2/.repo-docs} 2>/dev/null`
  and update any remaining statement that Read is excluded from search so it describes
  uncovered-only indexing (leave dated history/log entries as they are).

- [ ] **Step 8: Commit (steel-etl, v2, superproject)**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl
git add internal/site/config.go internal/site/build.go internal/site/search_boost.go internal/cli/site.go internal/site/config_test.go internal/site/build_test.go AGENTS.md docs
git commit -m "feat(site): search_uncovered_only indexes book text no Browse page carries (SC-329)"
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2
git add site.yaml .repo-docs
git commit -m "feat: index uncovered Read text in search (search_uncovered_only, SC-329)"
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search
git add ARCHITECTURE.md
git commit -m "docs: Read search coverage is uncovered-only (SC-329)"
```

(`git add` of an unchanged path is a no-op; if a commit reports "nothing to commit", that
repo had no changes for this task — say so in your report.)

---

### Task 3: v2 search worker — label book results with their book

**Files:**
- Modify: `v2/docs/javascripts/sc-search-core.js` (constants near the top; `search()`
  result building; the exported object at the bottom)
- Test: `v2/tests/sc-search-core.test.js` (append)
- Modify: `v2/.repo-docs/decisions/2026-09-06-custom-search-worker.md` (append addendum)

**Interfaces:**
- Consumes: nothing from other tasks (independent of Tasks 1-2; the index only gains
  `Read/…` docs once they land).
- Produces: `SCSearchCore.BOOK_LABELS` (object `folder → label`),
  `SCSearchCore.bookLabel(location) → string` (`""` when not a known book location),
  `SCSearchCore.pageTitle(location, title) → string`.

- [ ] **Step 1: Write the failing tests**

Append to `v2/tests/sc-search-core.test.js` (it already requires `node:test`,
`node:assert`, MiniSearch as `MiniSearch`, and the core as `Core`):

```js
// SC-329: Read (book) results carry their book on the group's page title —
// chapter titles collide across books (each book has an "Introduction").
const fs = require("fs");
const path = require("path");

const BOOK_DOCS = [
  { location: "Read/heroes/combat/", title: "Combat", text: "Draw Steel: Heroes · Chapter 10" },
  { location: "Read/heroes/combat/#movement", title: "Movement", text: "Your hero can move freely through an ally's space." },
  { location: "Read/summoner/introduction/", title: "Introduction", text: "Summoners freely call on allies." },
  { location: "Browse/class/fury/", title: "Fury", text: "Rage freely.", boost: 4 },
];

test("SC-329: book page docs carry the book label; sections and Browse do not", () => {
  const engine = Core.createEngine(MiniSearch, BOOK_DOCS);
  const items = engine.search("freely", {}).items;
  const all = items.flat();
  const combat = all.find((d) => d.location === "Read/heroes/combat/");
  const movement = all.find((d) => d.location === "Read/heroes/combat/#movement");
  const intro = all.find((d) => d.location === "Read/summoner/introduction/");
  const fury = all.find((d) => d.location === "Browse/class/fury/");
  // The heroes combat page doc did not match "freely" itself — it is the page
  // doc pushed for its matching section, and must still be labeled.
  assert.strictEqual(combat.title, "Combat · Draw Steel: Heroes");
  assert.strictEqual(movement.title, "Movement");
  assert.strictEqual(intro.title, "Introduction · The Summoner");
  assert.strictEqual(fury.title, "Fury");
});

test("SC-329: label on a non-matching page doc (only a section matched)", () => {
  const engine = Core.createEngine(MiniSearch, BOOK_DOCS);
  const group = engine.search("ally", {}).items.find((g) => g.some((d) => d.location === "Read/heroes/combat/#movement"));
  const page = group.find((d) => d.location === "Read/heroes/combat/");
  assert.strictEqual(page.score, 0);
  assert.strictEqual(page.title, "Combat · Draw Steel: Heroes");
});

test("SC-329: bookLabel / pageTitle edge cases", () => {
  assert.strictEqual(Core.bookLabel("Read/bestiary/goblins/"), "Draw Steel: Monsters");
  assert.strictEqual(Core.bookLabel("Read/heroes/combat/#movement"), "Draw Steel: Heroes");
  assert.strictEqual(Core.bookLabel("Read/"), "");
  assert.strictEqual(Core.bookLabel("Read/unknown-book/x/"), "");
  assert.strictEqual(Core.bookLabel("Read/constructor/x/"), "");
  assert.strictEqual(Core.bookLabel("Browse/rule/combat/movement/"), "");
  assert.strictEqual(Core.pageTitle("Read/unknown-book/x/", "X"), "X");
});

test("SC-329: BOOK_LABELS mirrors v2/site.yaml books (folder → label)", () => {
  const yaml = fs.readFileSync(path.join(__dirname, "..", "site.yaml"), "utf8");
  const block = yaml.split(/^books:[ \t]*$/m)[1].split(/^\S/m)[0];
  const fromYaml = {};
  block.split(/^\s*- key:/m).slice(1).forEach((chunk) => {
    const folder = /^\s*folder:\s*(\S+)\s*$/m.exec(chunk)[1];
    const label = /^\s*label:\s*"?(.*?)"?\s*$/m.exec(chunk)[1];
    fromYaml[folder] = label;
  });
  assert.deepStrictEqual(Core.BOOK_LABELS, fromYaml);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && node --test tests/sc-search-core.test.js 2>&1 | tail -25'`
Expected: the four new tests FAIL (e.g. `Combat` !== `Combat · Draw Steel: Heroes`,
`Core.bookLabel is not a function`); pre-existing tests pass.

- [ ] **Step 3: Implement**

In `v2/docs/javascripts/sc-search-core.js`, after the `var LEAD = 64;` line add:

```js
  // SC-329: Read (book) results label their group's page title with the book —
  // chapter titles collide across books ("Introduction"). Mirrors v2/site.yaml
  // `books:` (folder → label); tests/sc-search-core.test.js fails on drift.
  var BOOK_LABELS = {
    heroes: "Draw Steel: Heroes",
    beastheart: "The Beastheart",
    summoner: "The Summoner",
    bestiary: "Draw Steel: Monsters"
  };
```

After the `normalize` function add:

```js
  function bookLabel(location) {
    var m = /^Read\/([^/#]+)\//.exec(String(location || ""));
    return m && Object.prototype.hasOwnProperty.call(BOOK_LABELS, m[1]) ? BOOK_LABELS[m[1]] : "";
  }

  // Page-level docs only (location without "#"); display-only, never scored.
  function pageTitle(location, title) {
    var label = bookLabel(location);
    return label ? title + " · " + label : title;
  }
```

In `search()`, change the hit entry's title line from

```js
          title: highlight(stripTags(d.title), terms),
```

to

```js
          title: d.location === page ? pageTitle(page, highlight(stripTags(d.title), terms)) : highlight(stripTags(d.title), terms),
```

and the pushed page doc (the `g.push({ location: pd.location, title: stripTags(pd.title), …`
line) to

```js
          g.push({ location: pd.location, title: pageTitle(pd.location, stripTags(pd.title)), text: "", score: 0, terms: {} });
```

In the returned object at the bottom add `BOOK_LABELS: BOOK_LABELS, bookLabel: bookLabel, pageTitle: pageTitle,`.

Note: `titleTier` still scores against the raw `d.title` — the label is appended after
scoring, so ranking is unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && node --test tests/ 2>&1 | tail -15'`
Expected: every test file passes (0 failures).

- [ ] **Step 5: ADR addendum**

Append to `v2/.repo-docs/decisions/2026-09-06-custom-search-worker.md`:

```markdown
## Addendum 2026-09-23 — book results (SC-329)

The index now includes Read-tab (book) sections that no Browse page carries (steel-etl
`search_uncovered_only: [Read]`; covered headings are `data-search-exclude`). Book
results rank at the default boost, below boosted Browse pages. The worker appends the
book to a book result group's page title ("Combat · Draw Steel: Heroes") via
`BOOK_LABELS`, which mirrors `site.yaml` `books:` and is drift-tested. Display-only:
scores use the raw title. Spec: workspace
`docs/superpowers/specs/2026-09-23-book-search-gap-fill-design.md`.
```

- [ ] **Step 6: Commit (v2 submodule)**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2
git add docs/javascripts/sc-search-core.js tests/sc-search-core.test.js .repo-docs/decisions/2026-09-06-custom-search-worker.md
git commit -m "feat(search): label book results with their book (SC-329)"
```

---

### Task 4: Heroes source — ten rule codes, cross-reference links, SCC docs

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md` (10 annotation lines + 5 link edits)
- Modify: `steel-etl/docs/rule-term-mapping.md` (Movement + Argument rows)
- Modify: `docs/scc-log.md` (append entry), `docs/scc-reference.md` (Registry table),
  `AGENTS.md` (SCC summary counts) — workspace superproject

**Interfaces:**
- Consumes: nothing from Tasks 1-3.
- Produces: the ten codes below (Task 5's bench expects `Browse/rule/combat/movement/`).

- [ ] **Step 1: Record the baseline**

The registry is generated and gitignored; seed the worktree with the main checkout's
copy (read-only use) so stability can be checked, then capture baseline validate output:

```bash
cp /home/scott/code/steelCompendium/workspace/steel-etl/classification.json /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl/classification.json
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && mkdir -p output && go run ./cmd/steel-etl validate --scc-stable > output/sc329-validate-before.txt 2>&1; tail -5 output/sc329-validate-before.txt'
```

Expected: no SCC-stability errors (note any pre-existing warnings; they are not yours).

- [ ] **Step 2: Add the ten annotations**

Insert each annotation on its own line **immediately above** its heading (no blank line
between — the existing form, e.g. `<!-- @type: rule | @group: combat | @id: triggered-action -->`
directly above `#### Triggered Actions and Free Triggered Actions`). Each heading line
below occurs exactly once in the file; match on the full line.

| Heading line (exact) | Annotation line to insert above it |
|---|---|
| `### Movement` | `<!-- @type: rule \| @group: combat \| @id: movement -->` |
| `### Hide and Sneak` | `<!-- @type: rule \| @group: test \| @id: hide-and-sneak -->` |
| `### Assist a Test` | `<!-- @type: rule \| @group: test \| @id: assist-a-test -->` |
| `### End of Combat` | `<!-- @type: rule \| @group: combat \| @id: end-of-combat -->` |
| `#### Stacking Unique Effects` | `<!-- @type: rule \| @group: combat \| @id: stacking-effects -->` |
| `#### Ending Effects` | `<!-- @type: rule \| @group: combat \| @id: ending-effects -->` |
| `#### Roll Against Multiple Creatures` | `<!-- @type: rule \| @group: dice \| @id: multiple-targets -->` |
| `### Making Arguments` | `<!-- @type: rule \| @group: negotiation \| @id: argument -->` |
| `### NPC Response and Offer` | `<!-- @type: rule \| @group: negotiation \| @id: offer -->` |
| `### Opening a Negotiation` | `<!-- @type: rule \| @group: negotiation \| @id: opening -->` |

(The `\|` above is Markdown-table escaping; the file gets a plain `|`.) Before inserting,
check the line directly above each heading: if it is already an `<!-- @type … -->`
annotation, STOP and report — the spec assumed these headings are unannotated.

- [ ] **Step 3: Retarget the explicit cross-references**

Exactly four occurrences of `Hide and Sneak in Chapter 9: [Tests]` exist (verify with
`grep -c`). Replace each `Hide and Sneak in Chapter 9: [Tests]` with
`[Hide and Sneak](scc.v1:mcdm.heroes.v1/rule.test/hide-and-sneak) in Chapter 9: [Tests]`
(the chapter link that follows is kept). Exactly one occurrence of
`See Making Arguments below` exists; replace it with
`See [Making Arguments](scc.v1:mcdm.heroes.v1/rule.negotiation/argument) below`.

```bash
F="/home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl/input/heroes/Draw Steel Heroes.md"
grep -c 'Hide and Sneak in Chapter 9: \[Tests\]' "$F"      # expect 4
grep -c 'See Making Arguments below' "$F"                    # expect 1
sed -i 's/Hide and Sneak in Chapter 9: \[Tests\]/[Hide and Sneak](scc.v1:mcdm.heroes.v1\/rule.test\/hide-and-sneak) in Chapter 9: [Tests]/g; s/See Making Arguments below/See [Making Arguments](scc.v1:mcdm.heroes.v1\/rule.negotiation\/argument) below/' "$F"
grep -c 'rule.test/hide-and-sneak' "$F"                      # expect 4
grep -c 'rule.negotiation/argument' "$F"                     # expect 1
```

- [ ] **Step 4: Validate stability and generate**

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go run ./cmd/steel-etl validate --scc-stable > output/sc329-validate-after.txt 2>&1; tail -5 output/sc329-validate-after.txt; diff output/sc329-validate-before.txt output/sc329-validate-after.txt'
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all 2>&1 | tail -15'
```

Expected: validate shows no stability violations and the diff shows no new errors (new
codes are additions, which are allowed). `gen` completes; any unresolved-link warnings
must not mention the ten new codes.

- [ ] **Step 5: Verify the generated pages**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/data/data-unified/en/books/heroes/md-linked/rule
ls combat/movement.md combat/end-of-combat.md combat/stacking-effects.md combat/ending-effects.md test/hide-and-sneak.md test/assist-a-test.md dice/multiple-targets.md negotiation/argument.md negotiation/offer.md negotiation/opening.md
grep -c "move freely through an ally" combat/movement.md        # expect 1
grep -c "^#### Can't Cut Corners" combat/movement.md             # expect 1
grep -l "rule/test/hide-and-sneak.md" ../feature/common/maneuvers/hide.md   # expect the file path printed
jq '.codes | length' /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl/classification.json
jq '[.codes[] | select(startswith("mcdm.heroes.v1/"))] | length' /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl/classification.json
```

Expected: all ten files exist; the movement page carries the reported rule and its
subsections; the Hide maneuver page links to the new page (if the relative link path
differs, `grep -rl "hide-and-sneak" ../feature/common/maneuvers/` and confirm the link
resolves to the new file); record both registry counts (expected 3,096 and 1,962 if the
baseline was 3,086 / 1,952 — use the **measured** numbers in the docs below).

- [ ] **Step 6: Update rule-term-mapping.md**

In `steel-etl/docs/rule-term-mapping.md`:
- The `| Movement | … |` row: Decision `new-rule`, Code
  `mcdm.heroes.v1/rule.combat/movement`, Anchor `` `### Movement` `` (keep the existing
  line-number style of the table — use the heading's current line in the source), Notes:
  `SC-329: minted as the umbrella movement rules page (its section holds the movement types, terrain and forced movement, like rule.combat/condition holds the conditions). Was a reuse of movement/walk.`
- The `| Argument | … |` row: Decision `new-rule`, Code
  `mcdm.heroes.v1/rule.negotiation/argument`, Anchor `` `### Making Arguments` `` (current
  line), Notes: `SC-329: minted at the Making Arguments section (the earlier "no standalone heading" note was wrong).`

- [ ] **Step 7: Update the SCC docs (workspace superproject)**

- `docs/scc-log.md` — append at the end:

```markdown
## 2026-09-23 — ten Heroes rule pages (SC-329)

Minted `rule.*` codes for ten rules sections that had no Browse page, found while fixing
search coverage of book text: `rule.combat/movement` (umbrella over the `movement/*`
entries, like `rule.combat/condition`), `rule.combat/end-of-combat`,
`rule.combat/stacking-effects`, `rule.combat/ending-effects`, `rule.test/hide-and-sneak`,
`rule.test/assist-a-test`, `rule.dice/multiple-targets`, `rule.negotiation/argument`,
`rule.negotiation/offer`, `rule.negotiation/opening`. The book's explicit "see Hide and
Sneak" (×4) and "See Making Arguments below" cross-references now link to them. Registry
<MEASURED_TOTAL> codes (heroes <MEASURED_HEROES>). See
`docs/superpowers/specs/2026-09-23-book-search-gap-fill-design.md`.
```

  replacing `<MEASURED_TOTAL>` / `<MEASURED_HEROES>` with the Step 5 numbers (formatted
  with a thousands comma, e.g. `3,096`).
- `docs/scc-reference.md` "## Registry": update the total line to
  `<MEASURED_TOTAL> codes across four books (exact as of 2026-09-23):` and the heroes row.
- `AGENTS.md` "## SCC": update `Registry is **3,086 codes** across four books (heroes 1,952, …)`
  to the measured total and heroes count.

- [ ] **Step 8: Revert generated churn, run tests, commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search
git -C steelCompendium.github.io status --short | head     # gen writes the SCC API here
git -C steelCompendium.github.io checkout -- . && git -C steelCompendium.github.io clean -fdq docs/api
git -C steelCompendium.github.io status --short             # expect empty
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go test ./... 2>&1 | tail -5'
git -C steel-etl status --short                             # expect only the two files below
cd steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/rule-term-mapping.md
git commit -m "feat(heroes): ten rule pages — movement, hide and sneak, negotiation, … (SC-329)"
cd .. && git add docs/scc-log.md docs/scc-reference.md AGENTS.md
git commit -m "docs: SCC log + counts for the ten SC-329 rule codes"
```

Leave `data/` and `steel-etl/classification.json` in place (gitignored; Task 5 reuses them).

---

### Task 5: End-to-end build, search bench, payload budget, changelog

Depends on Tasks 1-4.

**Files:**
- Modify: `v2/tests/search/bench.cjs` (NAMED list + new ABSENT guard)
- Modify: `CHANGELOG.md` (workspace, `## Unreleased`)

**Interfaces:**
- Consumes: Task 2's `search_uncovered_only` behavior, Task 3's labels, Task 4's
  `Browse/rule/combat/movement/`.

- [ ] **Step 1: Add the bench cases**

In `v2/tests/search/bench.cjs`, append to the `NAMED` array:

```js
  // SC-329: book text is searchable; covered text comes from its Browse page.
  { q: "move freely through an ally's space", want: ["Browse/rule/combat/movement/"], top: 3 },
  { q: "can't cut corners", want: ["Browse/rule/combat/movement/"], top: 3 },
  { q: "your first session", want: ["Read/heroes/making-a-hero/"], top: 3 },
```

After the `NAMED` array add:

```js
// SC-329 no-duplicate guard: a heading Browse already carries must not ALSO be
// indexed from Read. Each query is the exact title of a covered Read heading;
// its own Read anchor must not appear anywhere in the results, while its Read
// page must still be indexed (so the guard cannot pass vacuously).
const ABSENT = [
  { q: "can't cut corners", loc: "Read/heroes/combat/#cant-cut-corners", page: "Read/heroes/combat/" },
  { q: "size and space", loc: "Read/heroes/combat/#size-and-space", page: "Read/heroes/combat/" },
];
```

In `main()`, directly after the named-queries `for` loop (before `if (GATE)`), add:

```js
  for (const a of ABSENT) {
    const items = await query(a.q);
    const leaked = items.some((g) => g.some((d) => d.location === a.loc));
    const pageIndexed = idx.docs.some((d) => d.location === a.page);
    const ok = !leaked && pageIndexed;
    namedOK = namedOK && ok;
    console.log(`  ${ok ? "ok  " : leaked ? "LEAK" : "NOPAGE"} "${a.q}" → ${a.loc} ${leaked ? "present" : "absent"}; ${a.page} ${pageIndexed ? "indexed" : "NOT indexed"}`);
  }
```

and change the gate message text `all named queries` to `all named + absent queries`.

- [ ] **Step 2: Build the site in the worktree**

(`data/` must hold Task 4's `gen` output; if it is missing, re-run Task 4 Step 4's `gen`
command first.)

```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/steel-etl && go run ./cmd/steel-etl site --config /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2/site.yaml 2>&1 | tail -12'
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && /home/scott/code/steelCompendium/workspace/v2/.venv/bin/mkdocs build 2>&1 | tail -5
```

Expected: the site output includes `Search uncovered-only: <N> pages, <M> covered headings excluded`
with N > 0 and M in the thousands, and `Errors:` absent (or only pre-existing ones —
compare against a run of the same command on `origin/main` only if in doubt). `mkdocs
build` finishes (font warnings are fine). The venv binary is the main checkout's
(read-only use — the worktree has no `.venv`).

- [ ] **Step 3: Inspect the index**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2
node -e '
const idx = require("./site/search/search_index.json");
const has = (l) => idx.docs.some((d) => d.location === l);
const read = idx.docs.filter((d) => d.location.startsWith("Read/"));
const bytes = (a) => Buffer.byteLength(JSON.stringify(a));
const other = idx.docs.filter((d) => !d.location.startsWith("Read/"));
console.log("docs total", idx.docs.length, "read", read.length);
console.log("uncovered present  your-first-session:", has("Read/heroes/making-a-hero/#your-first-session"));
console.log("covered absent     size-and-space:", !has("Read/heroes/combat/#size-and-space"));
console.log("covered absent     movement (Task 4):", !has("Read/heroes/combat/#movement"));
console.log("covered absent     cant-cut-corners:", !has("Read/heroes/combat/#cant-cut-corners"));
console.log("browse present     rule/combat/movement:", has("Browse/rule/combat/movement/"));
console.log("read bytes", bytes(read), "non-read bytes", bytes(other), "growth", (100 * bytes(read) / bytes(other)).toFixed(1) + "%");
'
ls -l site/search/search_index.json | awk "{print \"raw bytes\", \$5}"; gzip -c site/search/search_index.json | wc -c | awk '{print "gzip bytes", $1}'
```

Expected: every presence/absence line prints `true`; growth ≤ 30% (if above, STOP and
report — do not continue). Record all numbers for the report.

(If the Read anchor slugs differ from the ones above — e.g. `#cant-cut-corners` is
spelled differently — find the real ones with
`node -e 'require("./site/search/search_index.json").docs.filter(d=>/Read\/heroes\/combat\//.test(d.location)).slice(0,40).forEach(d=>console.log(d.location))'`
and adjust; report any adjustment.)

- [ ] **Step 4: Run the bench gate and the UI e2e**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && node tests/search/bench.cjs --gate 2>&1 | tail -30'
```

Expected: `gate: PASS`, every named line `ok`, both absent lines `ok`. If the exact-title
sweep drops below 95% or a named query misses, investigate the misses it prints (e.g. a
Browse page losing to a same-named Read section) and report them — do not tune ranking
constants without reporting first.

Then the real-UI check (serves the built site; stop the server afterwards):

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && (devbox run -- python3 -m http.server 8124 --directory /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2/site >/dev/null 2>&1 &) ; sleep 3
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc329-book-search/v2 && node tests/e2e/search.e2e.cjs'
pkill -f "http.server 8124"
```

Expected: all three cases `ok`. (The script needs Brave at `/opt/brave.com/brave/brave`
and `playwright-core` in the npx cache; if either is missing, report that rather than
installing anything.)

- [ ] **Step 5: CHANGELOG**

In the workspace `CHANGELOG.md`, add as the first bullet under `## Unreleased`:

```markdown
- **v2 site: search now reaches the book text itself (SC-329).** Rules that only lived in
  a book chapter — like "you can move freely through an ally's space…" under Combat ›
  Movement — never showed up in search, because the Books tab was excluded to avoid
  duplicate results. Search now includes every book section that has no Browse page of
  its own (labeled with its book, e.g. "Combat · Draw Steel: Heroes") and still skips the
  ones that do, so nothing appears twice. Ten rules sections also got their own Browse
  pages: Movement, Hide and Sneak, Assist a Test, End of Combat, Stacking Unique Effects,
  Ending Effects, Roll Against Multiple Creatures, Making Arguments, NPC Response and
  Offer, and Opening a Negotiation.
```

- [ ] **Step 6: Revert build churn and commit**

```bash
cd /home/scott/code/steelCompendium/worktrees/sc329-book-search
git -C v2 status --short | grep -v '^ M tests/search/bench.cjs' | head   # generated docs churn
git -C v2 checkout -- docs && git -C v2 clean -fdq docs
git -C v2 status --short                                                 # expect only tests/search/bench.cjs
git -C steelCompendium.github.io status --short                         # expect empty (else revert as in Task 4 Step 8)
git -C v2 add tests/search/bench.cjs && git -C v2 commit -m "test(search): SC-329 bench — book text found, covered text never duplicated"
git add CHANGELOG.md && git commit -m "docs: changelog — search reaches book text (SC-329)"
```

`v2/site/` is gitignored; leave it for the screenshot step.

---

### Task 6 (controller, not a subagent): screenshots + ticket update

Run by the session controller after Task 5's review passes — it is Scott-facing.

- [ ] Serve `v2/site` from the worktree (`python3 -m http.server 8124 --directory …/v2/site`)
  and capture with playwright-core + Brave (same launcher as `tests/e2e/search.e2e.cjs`):
  1. **Before** — live `https://steelcompendium.io/v2/`: search panel for
     `move freely through an ally's space`.
  2. **After** — local build: the same query's search panel.
  3. **After** — local `Browse/rule/combat/movement/` page (top of page).
  4. **After** — a book result showing the book label, e.g. query `your first session`.
- [ ] Post one SC-329 comment via the orchestration plugin's `linear-post.py` with the
  images inline (`{{IMG:<basename>}}`), the index size numbers from Task 5 Step 3, and a
  closing **"What you're approving"** section: land branch `sc329-book-search` (steel-etl,
  v2, workspace) and deploy.
- [ ] File one Linear **Backlog** ticket (related to SC-329) for the deferred rule pages —
  the spec's "Deferred to a Backlog ticket" list, including the note that `## Treasures` /
  `## Titles` need narrower anchors.
- [ ] Landing (`just wt-finish sc329-book-search`, per the `land-stack` skill) and deploy
  (`just deploy`) happen **only after Scott approves** in chat or on the ticket.

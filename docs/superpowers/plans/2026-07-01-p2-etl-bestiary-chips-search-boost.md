# P2 — Bestiary Size-Chip Cleanup + Search Ranking Boosts Implementation Plan

> **Status: EXECUTED — shipped & live 2026-07-02.** All tasks completed and verified on production; kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (a) Stop dynamic-terrain area descriptions ("any area; the area can't be moved through") from appearing as Size filter chips on the Bestiary page; (b) fix search ranking so canonical pages (classes, rules, conditions) outrank monster statblocks for their own names ("fury" currently returns four Rival Fury statblocks above the Fury class).

**Architecture:** Both fixes are in `steel-etl`'s site builder. (a) normalizes the `size` field in the Bestiary search island (`internal/site/bestiary_search.go`); (b) adds a new `applySearchBoost` pass in `buildSection` (`internal/site/build.go`) that injects Material's per-page `search: boost:` frontmatter keyed on the page's `type:` — Browse sections only (Read is search-excluded and must not get a second `search:` YAML key).

**Tech Stack:** Go (`go test ./internal/site/`), MkDocs Material `search.boost` frontmatter.

**Context docs:** UX findings §2.3 + §2.7 in workspace `docs/superpowers/specs/2026-07-01-v2-ux-analysis.md`. `steel-etl/CLAUDE.md` (devbox, site builder). `steel-etl/docs/site-builder.md`.

## Global Constraints

- Work in an isolated worktree: `just wt-new p2-search` / land with `just wt-finish p2-search`.
- Go toolchain via devbox: `devbox run -- go test ./...` (cwd `steel-etl`).
- steel-etl is **site-only** for both changes — no data-repo/schema change, no SCC change.
- JSON keys of `bestiaryItem` are consumed by `v2/docs/javascripts/steel-bestiary-browser.js` — do not rename existing keys.
- No commit-attribution trailers.

---

### Task 1: Normalize the Size facet in the bestiary island

**Files:**
- Modify: `steel-etl/internal/site/bestiary_search.go` (add `sizeFacet`, use it at line 99)
- Test: `steel-etl/internal/site/bestiary_search_test.go` (append tests)

**Interfaces:**
- Produces: `func sizeFacet(kind, size string) string` — canonical creature sizes pass through; free-text terrain/fixture areas become `"Area"`; any other non-canonical value becomes `"Special"`.
- Consumes: `bestiaryItem.Size` (string, `internal/site/bestiary_search.go:29`), populated at line 99 from `statField(fm, "size", "Size")`.

Canonical Draw Steel sizes observed in the live chip row: `1T 1S 1M 1L 1S-2 2 "2 or 3" 3 4 5`. Junk values are all dynamic-terrain area strings.

- [ ] **Step 1: Write the failing test**

Append to `steel-etl/internal/site/bestiary_search_test.go`:

```go
func TestSizeFacet(t *testing.T) {
	cases := []struct{ kind, size, want string }{
		{"statblock", "1S", "1S"},
		{"statblock", "1M", "1M"},
		{"statblock", "1S-2", "1S-2"},
		{"statblock", "2 or 3", "2 or 3"},
		{"statblock", "5", "5"},
		{"terrain", "any area; the area can't be moved through", "Area"},
		{"terrain", "one or more squares of difficult terrain", "Area"},
		{"terrain", "the area of the corridor to be blocked", "Area"},
		{"fixture", "one square that can't be moved through", "Area"},
		{"terrain", "2", "2"},          // canonical stays canonical even on terrain
		{"statblock", "weird text", "Special"},
		{"statblock", "", ""},
	}
	for _, c := range cases {
		if got := sizeFacet(c.kind, c.size); got != c.want {
			t.Errorf("sizeFacet(%q, %q) = %q, want %q", c.kind, c.size, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestSizeFacet -v
```
Expected: compile error — `undefined: sizeFacet`.

- [ ] **Step 3: Implement**

In `bestiary_search.go`, add near `unquote` (also add `"regexp"` to imports):

```go
// canonicalSizeRe matches real creature sizes: "1T"/"1S"/"1M"/"1L", bare
// numbers, the variable forms "1S-2" and "2 or 3".
var canonicalSizeRe = regexp.MustCompile(`^\d+[TSML]?(-\d+)?( or \d+)?$`)

// sizeFacet normalizes the Size filter value. Statblock sizes pass through;
// dynamic-terrain / fixture pages carry free-text area descriptions in their
// `size` frontmatter which would each become their own filter chip — bucket
// those under "Area". Anything else non-canonical becomes "Special" so the
// chip vocabulary stays closed.
func sizeFacet(kind, size string) string {
	if size == "" || canonicalSizeRe.MatchString(size) {
		return size
	}
	if kind == "terrain" || kind == "fixture" {
		return "Area"
	}
	return "Special"
}
```

Then change line 99 from:

```go
			Size:         stripMD(statField(fm, "size", "Size")),
```
to:
```go
			Size:         sizeFacet(kind, stripMD(statField(fm, "size", "Size"))),
```

- [ ] **Step 4: Run the tests**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestSizeFacet -v && devbox run -- go test ./internal/site/
```
Expected: PASS, and the full site package still passes.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/bestiary_search.go internal/site/bestiary_search_test.go
git -C steel-etl commit -m "fix(site): bucket free-text terrain sizes as 'Area' in bestiary facet"
```

---

### Task 2: Per-type search boost frontmatter

**Files:**
- Create: `steel-etl/internal/site/search_boost.go`
- Test: `steel-etl/internal/site/search_boost_test.go`
- Modify: `steel-etl/internal/site/build.go` (call site in `buildSection`, immediately before the `os.WriteFile` at line ~347)

**Interfaces:**
- Produces: `func applySearchBoost(data []byte) []byte` — injects `search:\n  boost: <n>\n` after the opening `---` of the frontmatter when the page's `type:` has a mapping; returns input unchanged otherwise.
- Consumes: `parseFrontmatterField(fm, "type")` and `splitFrontmatter` (both already in the site package), the existing injection idiom from `applySearchExclusion` (`build.go:886-891`).

Boost mapping (Material multiplies the page score):

| frontmatter `type` | boost | rationale |
|---|---|---|
| `class` | 4 | "fury"/"null"/"shadow" should hit the class first |
| `ancestry`, `condition`, `rule`, `movement`, `negotiation` | 3 | table-lookup terms |
| `skill`, `kit`, `culture`, `career`, `perk`, `title`, `complication`, `project`, `god`, `saint`, `treasure` | 2 | canonical entity pages |
| `statblock`, `featureblock` | 0.6 | 555 statblocks pollute name queries |
| `dynamic-terrain` | 0.7 | |
| everything else (feature/ability/…) | — (no injection, default 1) | |

- [ ] **Step 1: Write the failing test**

`steel-etl/internal/site/search_boost_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

func TestApplySearchBoost(t *testing.T) {
	classPage := "---\nname: Fury\ntype: class\n---\n\n# Fury\n"
	got := string(applySearchBoost([]byte(classPage)))
	if !strings.HasPrefix(got, "---\nsearch:\n  boost: 4\nname: Fury\n") {
		t.Errorf("class page: boost not injected after opening ---:\n%s", got)
	}
	if !strings.Contains(got, "# Fury") {
		t.Errorf("class page: body lost")
	}

	sb := "---\nname: Goblin Warrior\ntype: statblock\n---\nbody\n"
	got = string(applySearchBoost([]byte(sb)))
	if !strings.Contains(got, "search:\n  boost: 0.6\n") {
		t.Errorf("statblock: want boost 0.6, got:\n%s", got)
	}

	ability := "---\nname: Brutal Slam\ntype: ability\n---\nbody\n"
	if got := string(applySearchBoost([]byte(ability))); got != ability {
		t.Errorf("ability: must be unchanged (default boost), got:\n%s", got)
	}

	noFM := "# Plain page\n"
	if got := string(applySearchBoost([]byte(noFM))); got != noFM {
		t.Errorf("page without frontmatter must be unchanged")
	}
}
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestApplySearchBoost -v
```
Expected: compile error — `undefined: applySearchBoost`.

- [ ] **Step 3: Implement**

`steel-etl/internal/site/search_boost.go`:

```go
package site

// Per-type search ranking boosts (Material's `search: boost:` page
// frontmatter). Canonical reference pages outrank the 555 monster statblocks
// for their own names ("fury" → the class, not four Rival Fury statblocks).
// Injected in buildSection for non-search-excluded sections only — Read pages
// get `search: exclude` later and MUST NOT carry a second `search:` key.
// See workspace docs/superpowers/specs/2026-07-01-v2-ux-analysis.md §2.7.

import "strings"

var searchBoostByType = map[string]string{
	"class":           "4",
	"ancestry":        "3",
	"condition":       "3",
	"rule":            "3",
	"movement":        "3",
	"negotiation":     "3",
	"skill":           "2",
	"kit":             "2",
	"culture":         "2",
	"career":          "2",
	"perk":            "2",
	"title":           "2",
	"complication":    "2",
	"project":         "2",
	"god":             "2",
	"saint":           "2",
	"treasure":        "2",
	"statblock":       "0.6",
	"featureblock":    "0.6",
	"dynamic-terrain": "0.7",
}

// applySearchBoost injects `search:\n  boost: <n>` at the top of the page
// frontmatter when the page type has a boost mapping. Pages without
// frontmatter, or with an unmapped type, pass through unchanged.
func applySearchBoost(data []byte) []byte {
	content := string(data)
	if !strings.HasPrefix(content, "---\n") {
		return data
	}
	fm, _ := splitFrontmatter(content)
	typ := strings.TrimSpace(parseFrontmatterField(fm, "type"))
	boost, ok := searchBoostByType[typ]
	if !ok {
		return data
	}
	rest := strings.TrimPrefix(content, "---\n")
	return []byte("---\nsearch:\n  boost: " + boost + "\n" + rest)
}
```

Note: check `splitFrontmatter`'s exact signature at `build.go:1116` before wiring (it takes the full content string; confirm whether it returns `(frontmatter, body)` with or without delimiters and adjust the `typ` extraction accordingly — the test drives correctness).

- [ ] **Step 4: Wire into buildSection**

In `build.go`, immediately before `data = injectH1(data)` (line ~345), add:

```go
		// Per-type search ranking boost — skip search-excluded sections
		// (applySearchExclusion later prepends its own `search:` key and
		// YAML forbids duplicates).
		if !searchExcluded(cfg.SearchExclude, section.Name) {
			data = applySearchBoost(data)
		}
```

And add the tiny helper (or reuse an existing membership check if `applySearchExclusion`'s caller has one — check `build.go:146` first and reuse its condition):

```go
// searchExcluded reports whether section name is listed in search_exclude.
func searchExcluded(excluded []string, name string) bool {
	for _, e := range excluded {
		if e == name {
			return true
		}
	}
	return false
}
```

- [ ] **Step 5: Run the tests + full package**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run TestApplySearchBoost -v && devbox run -- go test ./...
```
Expected: PASS everywhere.

- [ ] **Step 6: Integration check — run the site build and inspect output**

```bash
cd <worktree-root> && devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
head -5 v2/docs/Browse/class/fury.md          # expect: ---\nsearch:\n  boost: 4
head -5 v2/docs/Browse/monster/goblin/goblin-warrior.md   # expect boost: 0.6
head -5 v2/docs/Read/heroes/classes.md        # expect search: exclude (NO boost line)
head -5 v2/docs/Browse/feature/ability/fury/level-1/brutal-slam.md  # expect NO search: key
```
(Requires generated `data/` — if `data/data-unified` is missing run `devbox run -- go run ./cmd/steel-etl gen --all --config pipeline.yaml` first, cwd steel-etl.)

- [ ] **Step 7: Verify YAML stays valid**

```bash
cd v2 && devbox run -- mkdocs build 2>&1 | grep -i "error\|warning" | head
```
Expected: no new YAML frontmatter errors.

- [ ] **Step 8: Commit**

```bash
git -C steel-etl add internal/site/search_boost.go internal/site/search_boost_test.go internal/site/build.go
git -C steel-etl commit -m "feat(site): per-type search.boost frontmatter for Browse pages"
```

---

### Task 3: Verify ranking on a built site + land

- [ ] **Step 1: Manual search-ranking check**

Serve the built site (`http.server 8124`), open it in Brave, search "fury" — the Fury class page must now rank above the Rival Fury statblocks; search "jump" — the movement/skill Jump pages above War Dog Blood Jumper. (The e2e harness pattern from `tests/e2e/` can automate this if flakiness is suspected; manual is acceptable here.)

- [ ] **Step 2: Bestiary chips check**

Open `/Bestiary/` — the Size row must show only `1T 1S 1S-2 1M 1L 2 "2 or 3" 3 4 5 Area` (order may differ; no sentence-length chips).

- [ ] **Step 3: Land**

```bash
just wt-finish p2-search
```

- [ ] **Step 4 (post-land): deploy note**

The change reaches production on the next `just deploy-v2` (which regenerates `v2/docs/` and rebuilds the search index).

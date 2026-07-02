# P5 — Per-Class Ability Table Index Implementation Plan

> **Status: EXECUTED — shipped & live 2026-07-02.** All tasks completed and verified on production; kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On each per-class ability index (`/Browse/feature/ability/<class>/`, 11 pages + `common/`), show a sortable **all-abilities table** (Name · Lv · Cost · Action · Distance · Target) below the existing level folder cards — today you cannot see a single ability name without clicking into a level bucket.

**Architecture:** steel-etl site-only. `buildFolderIndex` (`internal/site/feature_index.go`) already renders those pages' folder cards; a new `abilityTable(dir, subdirs)` appends an HTML table built from each leaf's frontmatter (all fields — `name`, `level`, `cost`, `subtype`, `action_type`, `distance`, `target` — already exist on every generated ability page). Sorting comes free from the site's existing tablesort.js. One small CSS block in v2.

**Tech Stack:** Go, HTML table, tablesort.js (already loaded site-wide), CSS.

**Context docs:** `steel-etl/internal/site/feature_index.go` header comment (index node kinds), `steel-etl/docs/site-builder.md`, workspace `docs/superpowers/specs/2026-07-01-v2-ux-analysis.md` §3.3.

## Global Constraints

- Isolated worktree: `just wt-new p5-abtable` / `just wt-finish p5-abtable`.
- Go via devbox; SITE-ONLY (no data-repo/schema/SCC change).
- Frontmatter values may contain markdown links (`distance: '[Melee](../../../../rule/combat/melee.md) 1'`) — always strip via the package's existing markdown-stripper (used at `bestiary_search.go:93`; confirm its name — referred to as `stripMD` below) and HTML-escape.
- Row links must be **directory URLs relative to the index page** (`level-1/brutal-slam/`) because raw-HTML hrefs are not rewritten by mkdocs.
- No commit-attribution trailers.

---

### Task 1: `abilityTable` renderer

**Files:**
- Create: `steel-etl/internal/site/ability_table.go`
- Test: `steel-etl/internal/site/ability_table_test.go`

**Interfaces:**
- Produces: `func abilityTable(dir string, subdirs []string) string` — walks `dir/<subdir>/*.md` (skipping `index.md`), reads frontmatter, returns the `<div class="sc-abtable">…<table>…` HTML block, or `""` when no ability leaves found.
- Produces: `func isAbilityClassDir(dir string) bool` — true when the dir's path ends `feature/ability/<class>` (exactly one segment after `ability`).
- Consumes: `splitFrontmatter`, `parseFrontmatterField`, `stripMD`, `unquote`, `readFile`, `naturalLess` (all existing in package `site`).

- [ ] **Step 1: Write the failing test**

`steel-etl/internal/site/ability_table_test.go`:

```go
package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeAbilityFixture(t *testing.T, dir, rel, fm string) {
	t.Helper()
	p := filepath.Join(dir, rel)
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte("---\n"+fm+"\n---\n\nbody\n"), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestIsAbilityClassDir(t *testing.T) {
	if !isAbilityClassDir("docs/Browse/feature/ability/fury") {
		t.Error("fury dir should match")
	}
	if isAbilityClassDir("docs/Browse/feature/ability") {
		t.Error("ability root should not match")
	}
	if isAbilityClassDir("docs/Browse/feature/ability/fury/level-1") {
		t.Error("level dir should not match")
	}
	if isAbilityClassDir("docs/Browse/feature/trait/censor") {
		t.Error("trait tree should not match")
	}
}

func TestAbilityTable(t *testing.T) {
	dir := t.TempDir()
	writeAbilityFixture(t, dir, "level-1/brutal-slam.md",
		"name: Brutal Slam\nlevel: \"1\"\nsubtype: signature\naction_type: Main action\n"+
			"distance: '[Melee](../../rule/combat/melee.md) 1'\ntarget: One creature or object\ntype: ability")
	writeAbilityFixture(t, dir, "level-5/my-turn.md",
		"name: My Turn!\nlevel: \"5\"\ncost: 9 Ferocity\naction_type: Free triggered\n"+
			"distance: '[Melee](../../rule/combat/melee.md) 1'\ntarget: The triggering creature\ntype: ability")
	writeAbilityFixture(t, dir, "level-1/index.md", "name: Level 1\ntype: index")

	html := abilityTable(dir, []string{"level-1", "level-5"})
	for _, want := range []string{
		`<div class="sc-abtable">`,
		`<a href="level-1/brutal-slam/">Brutal Slam</a>`,
		`<a href="level-5/my-turn/">My Turn!</a>`,
		`<td data-sort="1">1</td>`,   // numeric level sort key
		`Signature`,                  // signature shown as the cost
		`9 Ferocity`,
		`Melee 1`,                    // md link stripped
		`Free triggered`,
	} {
		if !strings.Contains(html, want) {
			t.Errorf("table missing %q\n%s", want, html)
		}
	}
	if strings.Contains(html, "Level 1</a>") {
		t.Error("index.md must be skipped")
	}
	if abilityTable(t.TempDir(), nil) != "" {
		t.Error("empty dir must yield empty string")
	}
}
```

- [ ] **Step 2: Run to verify failure**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestIsAbilityClassDir|TestAbilityTable' -v
```
Expected: compile error.

- [ ] **Step 3: Implement**

`steel-etl/internal/site/ability_table.go`:

```go
package site

// Per-class "all abilities" table for the feature/ability/<class>/ index
// pages: one sortable row per ability leaf across every level bucket, so a
// player can survey a class's abilities without clicking into each level.
// Sorting is client-side via the site-wide tablesort.js. SITE-ONLY.
// See workspace docs/superpowers/plans/2026-07-01-p5-class-ability-table.md.

import (
	"html"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// isAbilityClassDir reports whether dir is a per-class ability bucket dir:
// …/feature/ability/<class> (exactly one path segment after "ability").
func isAbilityClassDir(dir string) bool {
	parts := strings.Split(filepath.ToSlash(dir), "/")
	for i, p := range parts {
		if p == "feature" && i+2 == len(parts)-1 && parts[i+1] == "ability" {
			return true
		}
	}
	return false
}

type abilityRow struct {
	name, href, level, cost, action, distance, target string
}

// abilityTable renders the sortable ability table for a class dir, reading
// each leaf's frontmatter. Returns "" when the dir holds no ability leaves.
func abilityTable(dir string, subdirs []string) string {
	var rows []abilityRow
	for _, sub := range subdirs {
		entries, err := os.ReadDir(filepath.Join(dir, sub))
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() || !strings.HasSuffix(e.Name(), ".md") ||
				e.Name() == "index.md" || e.Name() == "_Index.md" {
				continue
			}
			fm, _ := splitFrontmatter(readFile(filepath.Join(dir, sub, e.Name())))
			if strings.TrimSpace(parseFrontmatterField(fm, "type")) != "ability" {
				continue
			}
			cost := stripMD(unquote(strings.TrimSpace(parseFrontmatterField(fm, "cost"))))
			if cost == "" && strings.TrimSpace(parseFrontmatterField(fm, "subtype")) == "signature" {
				cost = "Signature"
			}
			rows = append(rows, abilityRow{
				name:     stripMD(parseFrontmatterField(fm, "name")),
				href:     sub + "/" + strings.TrimSuffix(e.Name(), ".md") + "/",
				level:    unquote(strings.TrimSpace(parseFrontmatterField(fm, "level"))),
				cost:     cost,
				action:   stripMD(unquote(strings.TrimSpace(parseFrontmatterField(fm, "action_type")))),
				distance: stripMD(unquote(strings.TrimSpace(parseFrontmatterField(fm, "distance")))),
				target:   stripMD(unquote(strings.TrimSpace(parseFrontmatterField(fm, "target")))),
			})
		}
	}
	if len(rows) == 0 {
		return ""
	}
	sort.Slice(rows, func(i, j int) bool {
		if rows[i].level != rows[j].level {
			return naturalLess(rows[i].level, rows[j].level)
		}
		return naturalLess(rows[i].name, rows[j].name)
	})

	var sb strings.Builder
	sb.WriteString(`<div class="sc-abtable">` + "\n")
	sb.WriteString(`<table><thead><tr><th>Ability</th><th>Lv</th><th>Cost</th>` +
		`<th>Action</th><th>Distance</th><th>Target</th></tr></thead><tbody>` + "\n")
	for _, r := range rows {
		dash := func(s string) string {
			if s == "" {
				return "—"
			}
			return html.EscapeString(s)
		}
		sb.WriteString(`<tr><td><a href="` + html.EscapeString(r.href) + `">` +
			html.EscapeString(r.name) + `</a></td>` +
			`<td data-sort="` + html.EscapeString(r.level) + `">` + dash(r.level) + `</td>` +
			`<td>` + dash(r.cost) + `</td>` +
			`<td>` + dash(r.action) + `</td>` +
			`<td>` + dash(r.distance) + `</td>` +
			`<td>` + dash(r.target) + `</td></tr>` + "\n")
	}
	sb.WriteString("</tbody></table>\n</div>\n")
	return sb.String()
}
```

- [ ] **Step 4: Run tests**

```bash
cd steel-etl && devbox run -- go test ./internal/site/ -run 'TestIsAbilityClassDir|TestAbilityTable' -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/ability_table.go internal/site/ability_table_test.go
git -C steel-etl commit -m "feat(site): sortable per-class ability table renderer"
```

---

### Task 2: Hook the table into the class index pages

**Files:**
- Modify: `steel-etl/internal/site/feature_index.go` — inside `buildFolderIndex` (line ~109), after the folder-card grid closes.

- [ ] **Step 1: Wire in**

`buildFolderIndex` closes its `.sc-folders` div and returns; before the return, append:

```go
	// Per-class ability dirs additionally get the all-abilities table below
	// the level folder cards ("see everything at a glance").
	if isAbilityClassDir(dir) {
		if tbl := abilityTable(dir, subdirs); tbl != "" {
			sb.WriteString("\n## All " + dirToTitle(dirName) + " abilities\n\n" + tbl + "\n")
		}
	}
```

(Place it after the loop that writes the folder cards and the closing `sb.WriteString("</div>\n")` — read the tail of `buildFolderIndex` first and put the block immediately before its final `return`.)

- [ ] **Step 2: Full package tests**

```bash
cd steel-etl && devbox run -- go test ./...
```
Expected: PASS (existing feature-index golden tests may assert exact index content — if one fails, update its expectation to include the new section, verifying the diff is only the added table).

- [ ] **Step 3: Integration — regenerate and inspect**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
grep -c "sc-abtable" v2/docs/Browse/feature/ability/fury/index.md    # expect 1
grep -o 'href="level-1/brutal-slam/"' v2/docs/Browse/feature/ability/fury/index.md
grep -c "sc-abtable" v2/docs/Browse/feature/ability/index.md         # expect 0 (root untouched)
grep -c "sc-abtable" v2/docs/Browse/feature/ability/fury/level-1/index.md  # expect 0 (leaf buckets keep preview cards)
```

- [ ] **Step 4: Commit**

```bash
git -C steel-etl add internal/site/feature_index.go
git -C steel-etl commit -m "feat(site): all-abilities table on per-class ability indexes"
```

---

### Task 3: v2 styling + sort verification

**Files:**
- Modify: `v2/docs/stylesheets/steel-indexes.css` (append)

- [ ] **Step 1: Append styles**

```css
/* ── per-class all-abilities table (ability_table.go) ── */
.md-typeset .sc-abtable table { width: 100%; }
.md-typeset .sc-abtable th { white-space: nowrap; }
.md-typeset .sc-abtable td:nth-child(2) { text-align: center; }
@media (max-width: 45em) {
  /* phones: drop the two widest columns; name/level/cost/action survive */
  .md-typeset .sc-abtable th:nth-child(n+5),
  .md-typeset .sc-abtable td:nth-child(n+5) { display: none; }
}
```

- [ ] **Step 2: Build + verify sorting**

```bash
cd v2 && devbox run -- mkdocs build && devbox run -- python3 -m http.server 8124 --directory site &
```
Open `/Browse/feature/ability/fury/`: the level folder cards render as before, followed by "All Fury abilities" with ~50 rows. Click the "Lv" header — rows re-sort (tablesort.js binds to rendered tables; if the header doesn't sort, check `v2/docs/javascripts/tablesort.js` for how it selects tables — it may require the table inside `article`; adjust the wrapper div to match whatever selector it uses rather than changing the JS). Click an ability name — lands on its leaf card.

- [ ] **Step 3: Mobile check**

At 390px only Ability/Lv/Cost/Action columns show; no horizontal scroll.

- [ ] **Step 4: Commit + land**

```bash
git -C v2 add docs/stylesheets/steel-indexes.css
git -C v2 commit -m "style: per-class ability table (responsive columns)"
just wt-finish p5-abtable
```

**Post-deploy check:** `/Browse/feature/ability/censor/` and `/Browse/feature/ability/common/` render tables; `/Browse/feature/ability/fury/stormwight-kits/…` rows link correctly (subdir with non-level name).

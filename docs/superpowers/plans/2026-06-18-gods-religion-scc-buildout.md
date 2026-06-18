# Gods & Religion SCC Build-out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the Heroes book's Gods & Religion content into a proper `religion.*` SCC namespace — re-home gods under `religion.god/<id>`, extract the ~28 saints as flat `religion.saint/<id>` entities with their own Browse pages, reserve `religion.domain` / `religion.order` / `religion.pantheon` for future content, and capture god/saint relationships (patron, domains, pantheon, alignment) as frontmatter.

**Architecture:** steel-etl is a Go ETL pipeline. Each annotated source heading carries `<!-- @type: … -->`; a registered `ContentParser` turns it into a `ParsedContent` whose `TypePath` + `ItemID` are joined by `scc.Classify` into an SCC code (`source/typepath.joined.by.dots/itemid`). The code maps to an output file via `SCCToFilePath` (dots → directory separators), which the v2 site builder maps into the Browse tab and renders as `.sc-card` index pages. Relationships are **frontmatter links, never path nesting** — this is the load-bearing decision that handles cross-pantheon saints, the Lords of Hell collective patron, and saints that sit as document-siblings of their god.

**Tech Stack:** Go 1.26 (devbox), `go test` (table-driven, `-race`), MkDocs Material (v2 site via `steel-etl site`), hand-maintained annotated markdown source.

**Run all Go commands through devbox from the workspace root**, e.g. `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/'`.

---

## Background facts (verified against the codebase)

- **`scc.Classify`** (`steel-etl/internal/scc/classifier.go:14`) joins `TypePath` with `.`, so `TypePath=["religion","god"]`, `ItemID="cavall"` → `mcdm.heroes.v1/religion.god/cavall`.
- **`SCCToFilePath`** (`steel-etl/internal/output/generator.go:50`) expands dots to path separators → `religion/god/cavall.md`. So a single Browse include `religion/` covers god **and** saint subtrees.
- **`FullBodySource`** (`steel-etl/internal/parser/section.go:60`) folds **unannotated** descendant headings into a parent's body but **skips annotated** ones. So once a saint H5 gets `@type: saint`, it stops folding into its god's `Body`; the book-faithful `PageBody` (`RenderSubtree`) still renders it inline on the god/chapter page.
- **Parsers never auto-inherit ancestor path context** unless they read the context stack. `RuleParser` (`steel-etl/internal/content/rule.go`) is the model: it sets a flat `TypePath` so codes stay flat regardless of nesting. `GodParser` / `SaintParser` follow this — `religion.god` / `religion.saint` are always flat.
- **Gods have no JSON schema** (no `god.schema.json` in either `steel-etl/schemas/` or `data-sdk-npm/src/schema/`), and `god` is **not** in `schema_validation_test.go`'s `schemaAllowedFields` map. The schema-validation test is driven by a hardcoded `tests` table, not by walking output, so it only checks types it explicitly lists. **Therefore saints/gods need no schema work** — adding `saint` and new god frontmatter fields does not touch schemas or that test, *as long as we do not add a saint case to that test's table.*
- **`godCard`** (`steel-etl/internal/site/cards.go:422`) already reads the `**Domains:**` body line via `bodyLabeledLine(body, "Domains")` and renders flavor. `god` is in `richCardTypes` (`cards.go:44`) and dispatched in `cardFor` (`cards.go:163`). Saints mirror this.
- **SCC codes are NOT frozen** (`classification.freeze` is currently off). Re-minting god codes is allowed right now; this is the last pass before the user freezes. ⚠️ Do **not** put the errata printing in `book:` (re-mints everything — see steel-etl CLAUDE.md).

## Entity data (source of truth for the annotation tasks)

Heading levels vary; classification ignores level (it keys off the annotation). All saints are flat `religion.saint/<id>`; patron is an explicit `@patron` (a `religion.god` id, or plain text if no god entity).

**Gods** (`religion.god/<id>`), with new frontmatter annotations:

| Heading (line ≈) | @id | @pantheon | @alignment | @god_class | Notes |
|---|---|---|---|---|---|
| Val (`27215`) | `val` | `arcadia` | `good` | `elder` | already `@type: god` |
| Ord (`27284`) | `ord` | `dwarf` | `good` | `elder` | already |
| Kul (`27335`) | `kul` | `orc` | `good` | `elder` | already |
| Adûn (`27588`) | `adun` | `vasloria` | `good` | `younger` | already |
| Cavall (`27645`) | `cavall` | `vasloria` | `good` | `younger` | already |
| Salorna (`27742`) | `salorna` | `vasloria` | `good` | `younger` | already |
| Nikros the Tyrant (`27827`) | `nikros` | `vasloria` | `evil` | `younger` | **currently UNANNOTATED H5 — add `@type: god`** |
| Cyrvis (`27859`) | `cyrvis` | `vasloria` | `evil` | `younger` | **currently UNANNOTATED H5 — add `@type: god`** |
| Nebular the Star Mother (`27919`) | `nebular` | `timescape` | `good` | `space` | already |
| OV the Wave Pilot (`27968`) | `ov` | `timescape` | `good` | `space` | already |
| Devil Gods (`27501`) | `lords-of-hell` | `hell` | `devil` | `devil` | **annotate this H3 as the collective god; `@name: Lords of Hell`** |

**Saints** (`religion.saint/<id>`), each annotated `<!-- @type: saint | @id: … | @patron: … -->` (add `@name` only where the heading text isn't the entity name). Domains come from each section's existing `**Domains:**` line — no `@domains` annotation needed.

| Heading | @id | @patron | @name override? |
|---|---|---|---|
| A Sea of Suns | `a-sea-of-suns` | `val` | — |
| The Taste of Morning | `the-taste-of-morning` | `val` | — |
| Ripples of Honey on a Shore of Gold | `ripples-of-honey-on-a-shore-of-gold` | `val` | — |
| Yllin Dyrvis | `yllin-dyrvis` | `val` | — |
| Thyll Hylacae | `thyll-hylacae` | `val` | — |
| Illwyv li Orchiax | `illwyv-li-orchiax` | `val` | — |
| Zarok the Law-Giver | `zarok-the-law-giver` | `ord` | — |
| Valak-koth the Seeker | `valak-koth-the-seeker` | `ord` | — |
| Stakros the Engineer | `stakros-the-engineer` | `ord` | — |
| Khorvath Who Slew a Thousand | `khorvath-who-slew-a-thousand` | `kul` | — |
| Grole the One-Handed | `grole-the-one-handed` | `kul` | — |
| Khravila Who Ran Forty Leagues | `khravila-who-ran-forty-leagues` | `kul` | — |
| Mahsiti the Weaver | `mahsiti-the-weaver` | `kul` | — |
| Prexaspes the Stargazer | `prexaspes-the-stargazer` | `kul` | — |
| Atossa the Shepherd | `atossa-the-shepherd` | `kul` | — |
| Thellasko the Great Designer | `thellasko` | `lords-of-hell` | `@name: Thellasko the Great Designer` (keep id `thellasko` — see Task 7 restamp) |
| Uryal the Subtle | `uryal-the-subtle` | `lords-of-hell` | — |
| Kuryalka the False Principle | `kuryalka-the-false-principle` | `lords-of-hell` | — |
| Gaed the Confessor | `gaed-the-confessor` | `adun` | — |
| Gryffyn the Stout | `gryffyn-the-stout` | `adun` | — |
| Llewellyn the Valiant | `llewellyn-the-valiant` | `cavall` | — |
| Gwenllian the Fell-Handed | `gwenllian-the-fell-handed` | `cavall` | — |
| Draighen the Warden | `draighen-the-warden` | `salorna` | — |
| Eriarwen the Wroth | `eriarwen-the-wroth` | `salorna` | — |
| Pentalion the Paladin | `pentalion-the-paladin` | `nikros` | — |
| Eseld of the Eye | `eseld-of-the-eye` | `cyrvis` | — |
| The Calling of Lady Magnetar | `lady-magnetar` | `nebular` | `@name: Lady Magnetar` |
| The Calling of Cho'kassa the Time Rider | `chokassa-the-time-rider` | `ov` | `@name: Cho'kassa the Time Rider` |

**God links to restamp** (Task 7): 23 occurrences across `adun`(10), `cavall`(9), `nebular`(2), `salorna`(1) → `religion.god/<id>`; `thellasko`(1) → **`religion.saint/thellasko`** (now a saint).

---

## File Structure

**New files:**
- `steel-etl/internal/content/saint.go` — `SaintParser` (flat `religion.saint/<id>`, `@patron` + body Domains → frontmatter).
- `steel-etl/internal/content/saint_test.go` — `SaintParser` unit tests.

**Modified files:**
- `steel-etl/internal/content/god.go` — `TypePath` → `["religion","god"]`; parse Domains + `@pantheon`/`@alignment`/`@god_class`/optional `@name`.
- `steel-etl/internal/content/helpers.go` — add `extractDomains` (shared `**Domains:**` parser) + `headingName` (`@name` override helper).
- `steel-etl/internal/content/registry.go` — register `SaintParser`.
- `steel-etl/internal/content/project_god_test.go` — update god `TypePath` expectation; add saint to the registry test.
- `steel-etl/internal/content/helpers_test.go` — `extractDomains` tests.
- `steel-etl/input/heroes/Draw Steel Heroes.md` — god/saint annotations + god-link restamp.
- `steel-etl/internal/site/cards.go` — add `saint` to `richCardTypes`, `cardFor` dispatch, and a `saintCard`.
- `steel-etl/internal/site/cards_test.go` — saint card test.
- `v2/site.yaml` — Browse include `god/` → `religion/`.
- Docs: `steel-etl/ANNOTATION-GUIDE.md`, `docs/scc-log.md`, `docs/scc-reference.md`, `reference/scc-specification.md`, root `CLAUDE.md` (SCC summary + count), `steel-etl/CLAUDE.md` (parser count).

---

## Task 1: `extractDomains` + `headingName` helpers

**Files:**
- Modify: `steel-etl/internal/content/helpers.go`
- Test: `steel-etl/internal/content/helpers_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/helpers_test.go`:

```go
func TestExtractDomains(t *testing.T) {
	cases := []struct {
		name string
		body string
		want []string
	}{
		{"standard line", "**Domains:** Creation, Life, Love, Protection\n\nProse.", []string{"Creation", "Life", "Love", "Protection"}},
		{"two domains", "**Domains:** Life, War", []string{"Life", "War"}},
		{"no line", "Just prose, no domains.", nil},
		{"trims spaces", "**Domains:**  Sun ,  Storm ", []string{"Sun", "Storm"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := extractDomains(c.body)
			if len(got) != len(c.want) {
				t.Fatalf("extractDomains() = %v, want %v", got, c.want)
			}
			for i := range got {
				if got[i] != c.want[i] {
					t.Errorf("extractDomains()[%d] = %q, want %q", i, got[i], c.want[i])
				}
			}
		})
	}
}

func TestHeadingName(t *testing.T) {
	if got := headingName(&parser.Section{Heading: "Val"}); got != "Val" {
		t.Errorf("headingName plain = %q, want Val", got)
	}
	s := &parser.Section{Heading: "Devil Gods", Annotation: map[string]string{"name": "Lords of Hell"}}
	if got := headingName(s); got != "Lords of Hell" {
		t.Errorf("headingName override = %q, want Lords of Hell", got)
	}
}
```

Add `"github.com/SteelCompendium/steel-etl/internal/parser"` to the test file imports if not present.

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run "TestExtractDomains|TestHeadingName"'`
Expected: FAIL — `undefined: extractDomains`, `undefined: headingName`.

- [ ] **Step 3: Write minimal implementation**

Add to `steel-etl/internal/content/helpers.go` (add `"github.com/SteelCompendium/steel-etl/internal/parser"` to imports):

```go
// domainsLineRe matches the "**Domains:** A, B, C" stat line used by gods and
// saints in the Gods and Religion chapter.
var domainsLineRe = regexp.MustCompile(`(?m)^\*\*Domains:\*\*\s*(.+)$`)

// extractDomains pulls the comma-separated domain list from a god/saint body's
// "**Domains:**" line into a trimmed slice. Returns nil when the line is absent.
func extractDomains(body string) []string {
	m := domainsLineRe.FindStringSubmatch(body)
	if m == nil {
		return nil
	}
	var out []string
	for _, part := range strings.Split(m[1], ",") {
		if v := strings.TrimSpace(part); v != "" {
			out = append(out, v)
		}
	}
	return out
}

// headingName returns the entity's display name: the @name annotation override
// when present (used where the book heading differs from the entity, e.g. the
// "Devil Gods" section that defines the Lords of Hell), else the cleaned heading.
func headingName(s *parser.Section) string {
	if s.Annotation != nil {
		if n := strings.TrimSpace(s.Annotation["name"]); n != "" {
			return n
		}
	}
	return CleanHeading(s.Heading)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run "TestExtractDomains|TestHeadingName"'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/content/helpers.go internal/content/helpers_test.go
git -C steel-etl commit -m "feat(content): add extractDomains + headingName helpers for religion entities"
```

---

## Task 2: GodParser → `religion.god` + relational frontmatter

**Files:**
- Modify: `steel-etl/internal/content/god.go`
- Test: `steel-etl/internal/content/project_god_test.go`

- [ ] **Step 1: Update the failing test**

In `steel-etl/internal/content/project_god_test.go`, replace the `TestGodParser` `TypePath` assertion (currently expects `[god]`) and add field assertions. Replace lines 71-73 with:

```go
	if len(result.TypePath) != 2 || result.TypePath[0] != "religion" || result.TypePath[1] != "god" {
		t.Errorf("TypePath = %v, want [religion god]", result.TypePath)
	}
```

Then add a new test:

```go
func TestGodParserFrontmatter(t *testing.T) {
	section := &parser.Section{
		Heading:    "Cavall",
		Annotation: map[string]string{"type": "god", "id": "cavall", "pantheon": "vasloria", "alignment": "good", "god_class": "younger"},
		BodySource: "**Domains:** Life, Love, Protection, War\n\nThe god of duty.",
	}
	result, err := (&GodParser{}).Parse(context.NewContextStack(nil), section)
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if result.Frontmatter["pantheon"] != "vasloria" {
		t.Errorf("pantheon = %v, want vasloria", result.Frontmatter["pantheon"])
	}
	if result.Frontmatter["alignment"] != "good" {
		t.Errorf("alignment = %v, want good", result.Frontmatter["alignment"])
	}
	if result.Frontmatter["god_class"] != "younger" {
		t.Errorf("god_class = %v, want younger", result.Frontmatter["god_class"])
	}
	domains, _ := result.Frontmatter["domains"].([]string)
	if len(domains) != 4 || domains[0] != "Life" || domains[3] != "War" {
		t.Errorf("domains = %v, want [Life Love Protection War]", result.Frontmatter["domains"])
	}
}

func TestGodParserNameOverride(t *testing.T) {
	section := &parser.Section{
		Heading:    "Devil Gods",
		Annotation: map[string]string{"type": "god", "id": "lords-of-hell", "name": "Lords of Hell"},
		BodySource: "The seven Archdukes of Hell.",
	}
	result, _ := (&GodParser{}).Parse(context.NewContextStack(nil), section)
	if result.Frontmatter["name"] != "Lords of Hell" {
		t.Errorf("name = %v, want Lords of Hell", result.Frontmatter["name"])
	}
	if result.ItemID != "lords-of-hell" {
		t.Errorf("ItemID = %q, want lords-of-hell", result.ItemID)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestGodParser'`
Expected: FAIL — `TypePath = [god], want [religion god]` and missing frontmatter fields.

- [ ] **Step 3: Write the implementation**

Replace the body of `steel-etl/internal/content/god.go`'s `Parse` with:

```go
func (p *GodParser) Parse(ctx *context.ContextStack, section *parser.Section) (*ParsedContent, error) {
	name := headingName(section)

	id := section.ID()
	if id == "" {
		id = Slugify(name)
	}

	fm := map[string]any{
		"name": name,
		"type": "god",
	}
	if d := extractDomains(section.FullBodySource()); d != nil {
		fm["domains"] = d
	}
	for _, key := range []string{"pantheon", "alignment", "god_class"} {
		if v, ok := section.Annotation[key]; ok && v != "" {
			fm[key] = v
		}
	}

	return &ParsedContent{
		Frontmatter: fm,
		Body:        section.FullBodySource(),
		TypePath:    []string{"religion", "god"},
		ItemID:      id,
	}, nil
}
```

(`section.Annotation` is safe to index even when nil in Go — a nil map read returns the zero value — but the loop only runs over keys; nil-map indexing yields `"", false`, so no panic.)

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestGodParser'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/content/god.go internal/content/project_god_test.go
git -C steel-etl commit -m "feat(content): re-home gods under religion.god with pantheon/alignment/domains frontmatter"
```

---

## Task 3: SaintParser (`religion.saint/<id>`)

**Files:**
- Create: `steel-etl/internal/content/saint.go`
- Create: `steel-etl/internal/content/saint_test.go`
- Modify: `steel-etl/internal/content/registry.go`
- Modify: `steel-etl/internal/content/project_god_test.go` (registry coverage)

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/content/saint_test.go`:

```go
package content

import (
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/context"
	"github.com/SteelCompendium/steel-etl/internal/parser"
)

func TestSaintParser(t *testing.T) {
	p := &SaintParser{}
	if p.Type() != "saint" {
		t.Errorf("Type() = %q, want saint", p.Type())
	}

	section := &parser.Section{
		Heading:    "Llewellyn the Valiant",
		Annotation: map[string]string{"type": "saint", "id": "llewellyn-the-valiant", "patron": "cavall"},
		BodySource: "**Domains:** Life, Protection\n\nA legendary knight.",
	}
	result, err := p.Parse(context.NewContextStack(nil), section)
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}
	if result.Frontmatter["type"] != "saint" {
		t.Errorf("type = %v, want saint", result.Frontmatter["type"])
	}
	if result.Frontmatter["name"] != "Llewellyn the Valiant" {
		t.Errorf("name = %v", result.Frontmatter["name"])
	}
	if result.Frontmatter["patron"] != "cavall" {
		t.Errorf("patron = %v, want cavall", result.Frontmatter["patron"])
	}
	domains, _ := result.Frontmatter["domains"].([]string)
	if len(domains) != 2 || domains[0] != "Life" {
		t.Errorf("domains = %v, want [Life Protection]", result.Frontmatter["domains"])
	}
	if result.ItemID != "llewellyn-the-valiant" {
		t.Errorf("ItemID = %q", result.ItemID)
	}
	if len(result.TypePath) != 2 || result.TypePath[0] != "religion" || result.TypePath[1] != "saint" {
		t.Errorf("TypePath = %v, want [religion saint]", result.TypePath)
	}
}

func TestSaintParserNameOverride(t *testing.T) {
	section := &parser.Section{
		Heading:    "The Calling of Lady Magnetar",
		Annotation: map[string]string{"type": "saint", "id": "lady-magnetar", "patron": "nebular", "name": "Lady Magnetar"},
		BodySource: "**Domains:** Life, Sun\n\nProse.",
	}
	result, _ := (&SaintParser{}).Parse(context.NewContextStack(nil), section)
	if result.Frontmatter["name"] != "Lady Magnetar" {
		t.Errorf("name = %v, want Lady Magnetar", result.Frontmatter["name"])
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestSaintParser'`
Expected: FAIL — `undefined: SaintParser`.

- [ ] **Step 3: Write the implementation**

Create `steel-etl/internal/content/saint.go`:

```go
package content

import (
	"github.com/SteelCompendium/steel-etl/internal/context"
	"github.com/SteelCompendium/steel-etl/internal/parser"
)

// SaintParser handles @type: saint sections — the legendary heroes/saints in the
// Gods and Religion chapter. Saints are flat (religion.saint/<id>): a saint's
// patron god is an explicit @patron annotation, never path nesting, because the
// book places several saints (Pentalion, Eseld, the Saints of Hell) as document
// siblings of their god rather than inside its subtree. Mirrors GodParser.
type SaintParser struct{}

func (p *SaintParser) Type() string { return "saint" }

func (p *SaintParser) Parse(ctx *context.ContextStack, section *parser.Section) (*ParsedContent, error) {
	name := headingName(section)

	id := section.ID()
	if id == "" {
		id = Slugify(name)
	}

	fm := map[string]any{
		"name": name,
		"type": "saint",
	}
	if v, ok := section.Annotation["patron"]; ok && v != "" {
		fm["patron"] = v
	}
	if d := extractDomains(section.FullBodySource()); d != nil {
		fm["domains"] = d
	}

	return &ParsedContent{
		Frontmatter: fm,
		Body:        section.FullBodySource(),
		TypePath:    []string{"religion", "saint"},
		ItemID:      id,
	}, nil
}
```

Register it in `steel-etl/internal/content/registry.go` — add after the `GodParser` line (line 36):

```go
	r.Register(&GodParser{})
	r.Register(&SaintParser{})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestSaintParser'`
Expected: PASS

- [ ] **Step 5: Add saint to the registry coverage test**

In `steel-etl/internal/content/project_god_test.go`, update `TestProjectGodRegistered` slice:

```go
	for _, typ := range []string{"project", "god", "saint"} {
```

- [ ] **Step 6: Run the full content package + commit**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/'`
Expected: PASS

```bash
git -C steel-etl add internal/content/saint.go internal/content/saint_test.go internal/content/registry.go internal/content/project_god_test.go
git -C steel-etl commit -m "feat(content): add SaintParser (religion.saint/<id>) with explicit patron"
```

---

## Task 4: Annotate gods in source (Heroes book)

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md`

No tests; verification is the `gen` + `classify --diff` run in Task 8. Make every edit exactly as listed; use the **Gods** table at the top of this plan for the values.

- [ ] **Step 1: Upgrade the six already-annotated gods with relational frontmatter**

For each existing `<!-- @type: god | @id: <x> -->` comment (val, ord, kul, adun, cavall, salorna, nebular, ov), extend it to include `@pantheon`, `@alignment`, `@god_class` per the Gods table. Example — line 27214:

```
<!-- @type: god | @id: val | @pantheon: arcadia | @alignment: good | @god_class: elder -->
```

Do the same for ord (`27283`), kul (`27334`), adun (`27587`), cavall (`27644`), salorna (`27741`), nebular (`27918`), ov (`27967`).

- [ ] **Step 2: Annotate the two unannotated evil gods**

Insert an annotation comment immediately **above** each heading.

Above `##### Nikros the Tyrant` (`27827`):
```
<!-- @type: god | @id: nikros | @pantheon: vasloria | @alignment: evil | @god_class: younger -->
```

Above `##### Cyrvis` (`27859`):
```
<!-- @type: god | @id: cyrvis | @pantheon: vasloria | @alignment: evil | @god_class: younger -->
```

- [ ] **Step 3: Annotate the Lords of Hell collective god**

Insert immediately **above** `### Devil Gods` (`27501`):
```
<!-- @type: god | @id: lords-of-hell | @name: Lords of Hell | @pantheon: hell | @alignment: devil | @god_class: devil -->
```

- [ ] **Step 4: Verify annotations parse without classification errors**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --config pipeline.yaml --book heroes'` (use the actual validate invocation; if flags differ, run `go run ./cmd/steel-etl validate --help` first).
Expected: no "unknown type" / duplicate-SCC errors for the new god codes.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add "input/heroes/Draw Steel Heroes.md"
git -C steel-etl commit -m "content(heroes): annotate gods with pantheon/alignment/god_class; add evil gods + Lords of Hell"
```

---

## Task 5: Annotate saints in source (Heroes book)

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md`

Use the **Saints** table at the top of this plan. Every saint H5 heading gets an annotation comment on the line immediately above it.

- [ ] **Step 1: Reclassify Thellasko from god to saint**

At line `27513`, replace:
```
<!-- @type: god | @id: thellasko -->
```
with:
```
<!-- @type: saint | @id: thellasko | @name: Thellasko the Great Designer | @patron: lords-of-hell -->
```

- [ ] **Step 2: Annotate all remaining saints**

For each saint in the table, insert its annotation comment immediately above the saint's `#####` heading. Examples:

Above `##### A Sea of Suns` (`27229`):
```
<!-- @type: saint | @id: a-sea-of-suns | @patron: val -->
```

Above `##### Zarok the Law-Giver` (`27296`):
```
<!-- @type: saint | @id: zarok-the-law-giver | @patron: ord -->
```

Above `##### Pentalion the Paladin` (`27843`):
```
<!-- @type: saint | @id: pentalion-the-paladin | @patron: nikros -->
```

Above `##### Eseld of the Eye` (`27871`):
```
<!-- @type: saint | @id: eseld-of-the-eye | @patron: cyrvis -->
```

Above `##### The Calling of Lady Magnetar` (`27930`):
```
<!-- @type: saint | @id: lady-magnetar | @name: Lady Magnetar | @patron: nebular -->
```

Above `##### The Calling of Cho'kassa the Time Rider` (`27981`):
```
<!-- @type: saint | @id: chokassa-the-time-rider | @name: Cho'kassa the Time Rider | @patron: ov -->
```

Repeat for **every** row in the Saints table (Taste of Morning, Ripples…, Yllin Dyrvis, Thyll Hylacae, Illwyv li Orchiax, Valak-koth, Stakros, Khorvath, Grole, Khravila, Mahsiti, Prexaspes, Atossa, Uryal, Kuryalka, Gaed, Gryffyn, Llewellyn, Gwenllian, Draighen, Eriarwen).

- [ ] **Step 3: Verify all 28 saints are annotated**

Run:
```bash
grep -c "@type: saint" "steel-etl/input/heroes/Draw Steel Heroes.md"
```
Expected: `28`.

- [ ] **Step 4: Commit**

```bash
git -C steel-etl add "input/heroes/Draw Steel Heroes.md"
git -C steel-etl commit -m "content(heroes): extract 28 saints as religion.saint entities with patron links"
```

---

## Task 6: Browse cards for saints

**Files:**
- Modify: `steel-etl/internal/site/cards.go`
- Test: `steel-etl/internal/site/cards_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/site/cards_test.go` (match the package + existing test style in that file; if tests there call `cardFor`/`saintCard` directly, mirror that — otherwise test `saintCard` directly):

```go
func TestSaintCard(t *testing.T) {
	fm := "name: Llewellyn the Valiant\ntype: saint\npatron: cavall\n"
	body := "**Domains:** Life, Protection\n\nA legendary knight of Cavall."
	out := saintCard(fm, body, "llewellyn-the-valiant.md", "Llewellyn the Valiant")
	if !strings.Contains(out, "Llewellyn the Valiant") {
		t.Errorf("saintCard missing name:\n%s", out)
	}
	if !strings.Contains(out, "Saint") {
		t.Errorf("saintCard missing type label:\n%s", out)
	}
	if !strings.Contains(out, "Domains") {
		t.Errorf("saintCard missing Domains line:\n%s", out)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSaintCard'`
Expected: FAIL — `undefined: saintCard`.

- [ ] **Step 3: Write the implementation**

In `steel-etl/internal/site/cards.go`:

1. Add `saint` to `richCardTypes` (line 44):
```go
	"movement": true, "negotiation": true, "god": true, "saint": true, "project": true,
```

2. Add a dispatch case in `cardFor` after the `"god"` case (line 164):
```go
	case "saint":
		return saintCard(fm, body, file, name)
```

3. Add the `saintCard` function next to `godCard`:
```go
// saintCard renders a saint (legendary hero): the Domains line + flavor prose,
// mirroring godCard. Patron is a frontmatter relationship and is not surfaced on
// the index card (it shows on the leaf page / is available to future tooling).
func saintCard(fm, body, file, name string) string {
	inner := ""
	if v := bodyLabeledLine(body, "Domains"); v != "" {
		inner += lineBlock("Domains", inlineMD(v))
	}
	if f := firstUnlabeledProse(body); f != "" {
		inner += flavorDiv(f, 240)
	}
	if inner == "" {
		inner = blurbBlock(bodyBlurb(body, 96))
	}
	return card(file, "god", "Saint", name, inner)
}
```

(Reuses the `"god"` crest icon — no new SVG needed.)

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSaintCard'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/cards.go internal/site/cards_test.go
git -C steel-etl commit -m "feat(site): render saint Browse cards (religion.saint)"
```

---

## Task 7: Restamp god links in source

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md`

The 23 in-prose `…/god/<id>` links must move to the new codes. `thellasko` becomes a **saint**.

- [ ] **Step 1: Restamp the four gods that stay gods**

Run from the workspace root:
```bash
perl -0pi -e 's{scc\.v1:mcdm\.heroes\.v1/god/(adun|cavall|nebular|salorna)\b}{scc.v1:mcdm.heroes.v1/religion.god/$1}g' "steel-etl/input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 2: Restamp the Thellasko link to the saint code**

```bash
perl -0pi -e 's{scc\.v1:mcdm\.heroes\.v1/god/thellasko\b}{scc.v1:mcdm.heroes.v1/religion.saint/thellasko}g' "steel-etl/input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Verify no stale god links remain**

```bash
grep -c "mcdm.heroes.v1/god/" "steel-etl/input/heroes/Draw Steel Heroes.md"
```
Expected: `0`.

```bash
grep -oE "mcdm\.heroes\.v1/religion\.(god|saint)/[a-z0-9-]+" "steel-etl/input/heroes/Draw Steel Heroes.md" | sort | uniq -c
```
Expected: 23 occurrences across `religion.god/{adun,cavall,nebular,salorna}` + `religion.saint/thellasko` (note: links to `…/god/val|ord|kul` did not exist in prose, so they won't appear — that's fine).

- [ ] **Step 4: Commit**

```bash
git -C steel-etl add "input/heroes/Draw Steel Heroes.md"
git -C steel-etl commit -m "content(heroes): restamp god/<id> links to religion.god (thellasko -> religion.saint)"
```

---

## Task 8: site.yaml + full pipeline regen & validation

**Files:**
- Modify: `v2/site.yaml`

- [ ] **Step 1: Repoint the Browse include**

In `v2/site.yaml`, replace the `- god/` line (line 74) with:
```yaml
      - religion/
```

(`SCCToFilePath` writes `religion/god/*` and `religion/saint/*`, so the single `religion/` include covers both. The `religion/` parent folder's nav label is derived from the directory name; if a prettier "Gods & Religion" label is desired, that's handled by the site builder's folder-title logic — leave default `Religion` unless Task 9 review wants the override.)

- [ ] **Step 2: Build the binary and run the full Go test suite**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go test -race ./...'`
Expected: PASS across all packages.

- [ ] **Step 3: Regenerate the heroes book and inspect the new codes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book heroes'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --config pipeline.yaml --diff'
```
Expected in the diff: `religion.god/<id>` for all 11 gods (incl. lords-of-hell), `religion.saint/<id>` for all 28 saints, removal of the old flat `god/<id>` codes. Confirm **no** `religion.domain/*` codes were minted (domains are reserved-only).

- [ ] **Step 4: Confirm output files landed in the religion tree**

```bash
ls data/data-rules/religion/god/ data/data-rules/religion/saint/ 2>/dev/null | head -50
```
(Adjust the data dir to whatever `pipeline.yaml`'s linked generator base is.) Expected: `cavall.md`, `lords-of-hell.md`, …, `llewellyn-the-valiant.md`, `thellasko.md`, etc.

- [ ] **Step 5: Build the v2 site and spot-check a saint page renders**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'`
Then confirm a saint Browse page + the religion index exist:
```bash
ls v2/docs/Browse/religion/saint/ | head
test -f v2/docs/Browse/religion/index.md && echo "religion index OK"
```
Expected: saint pages present; religion index present. Confirm the restamped links resolve (no `gen`-time `WARN: unresolvable` for `religion.god/*` or `religion.saint/thellasko`).

- [ ] **Step 6: Commit site config + regenerated baseline if the repo tracks it**

```bash
git -C v2 add site.yaml
git -C v2 commit -m "feat(site): Browse religion tree (gods + saints) replaces flat god include"
```
(Do **not** hand-commit generated `data/` or `v2/docs/Browse/**` — those are produced by `just deploy*`. This commit is config only.)

---

## Task 9: Documentation

**Files:**
- Modify: `steel-etl/ANNOTATION-GUIDE.md`, `docs/scc-log.md`, `docs/scc-reference.md`, `reference/scc-specification.md`, root `CLAUDE.md`, `steel-etl/CLAUDE.md`

- [ ] **Step 1: ANNOTATION-GUIDE.md — document the new annotations**

Add `saint` to the type list and document the religion annotations: `@type: god` now takes optional `@pantheon`/`@alignment`/`@god_class`/`@name`; `@type: saint` takes `@id`/`@patron`/optional `@name`; domains are read from the `**Domains:**` body line (not an annotation).

- [ ] **Step 2: docs/scc-log.md — dated entry**

Prepend a dated entry under today (2026-06-18) describing: new `religion.*` namespace; `god/<id>` → `religion.god/<id>` (re-mint, 23 links restamped); 28 saints extracted as `religion.saint/<id>`; Thellasko god→saint; Lords of Hell collective god; `religion.domain`/`religion.order`/`religion.pantheon` **reserved** (no entities); relationships carried as frontmatter (patron/domains/pantheon/alignment/god_class).

- [ ] **Step 3: docs/scc-reference.md — current-state update**

Document the `religion.*` taxonomy: the entity types, the reserved types, and the "relationships are frontmatter, never path nesting" rule with the saint-patron rationale.

- [ ] **Step 4: reference/scc-specification.md — scheme update**

Add `religion.god` / `religion.saint` to the type catalog and note `religion.domain`/`religion.order`/`religion.pantheon` as reserved.

- [ ] **Step 5: Update the SCC summaries + counts in CLAUDE.md files**

Root `CLAUDE.md`: update the SCC summary (gods/saints now under `religion.*`) and the registry count (run `classify` to get the new total). `steel-etl/CLAUDE.md`: bump the parser count in `registry.go`'s description (25 → 26) and add a one-line note in the SCC section about the `religion.*` namespace.

- [ ] **Step 6: Commit docs**

```bash
git -C steel-etl add ANNOTATION-GUIDE.md CLAUDE.md
git -C steel-etl commit -m "docs: document religion.* SCC namespace (gods, saints, reserved types)"
git add docs/scc-log.md docs/scc-reference.md reference/scc-specification.md CLAUDE.md
git commit -m "docs: record religion.* SCC namespace build-out"
```

(Two commits: the steel-etl submodule, then the workspace. The `chore: bump steel-etl to <sha>` pointer commit happens at deploy time per the git-workflow doc — not here.)

---

## Self-Review notes (for the executor)

- **Spec coverage:** gods re-homed (T2/T4), saints extracted (T3/T5), domains *reserved not minted* (verified T8 step 3), evil gods promoted (T4), Thellasko reclassified (T5 step 1), Lords of Hell collective (T4 step 3), relationships as frontmatter (T2/T3), Browse pages (T6/T8), links restamped (T7), docs (T9).
- **Type consistency:** parser frontmatter keys (`name`, `type`, `domains`, `patron`, `pantheon`, `alignment`, `god_class`), `TypePath` (`["religion","god"]` / `["religion","saint"]`), and id slugs are used identically across tasks and the data tables.
- **Deferred by design (not gaps):** `religion.domain/order/pantheon` entities; upgrading god/saint `domains:` from names to `religion.domain/<id>` links (a future frontmatter-only follow-up once domain pages exist); a dedicated saint crest SVG (reuses the god crest). The freeze itself is the user's separate step after this lands.
- **Watch-outs:** keep the errata printing out of `book:` frontmatter; do not add a `saint` case to `schema_validation_test.go` (gods/saints are intentionally schema-less); after `gen` confirm no `religion.domain/*` codes appear.
```

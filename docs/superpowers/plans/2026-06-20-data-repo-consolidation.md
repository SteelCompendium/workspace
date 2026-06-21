# Data-Repo Consolidation + i18n-Ready Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the four per-book data outputs + the cross-book aggregate into the single (reused) `data-unified` repo with a locale-top, Browse(`unified/`)+Read(`books/<slug>/`) layout, with the aggregate now spanning all formats.

**Architecture:** The pipeline already writes per-book outputs (md/json/yaml/md-linked/md-dse/md-dse-linked + stripped) to each book's `base_dir/<locale>/<format>`, and builds the cross-book aggregate once in `RunSharedOutputs`. We insert a `books/<slug>` path segment into the per-book path and a `unified/<format>` segment into the aggregate path, point every book's `base_dir` at `../data/data-unified`, and extend the aggregate from md-only to all formats by reusing the existing per-format generators. Then we repoint the site build + homepage, deprecate the old repos, and sync docs.

**Tech Stack:** Go 1.26 (steel-etl), `just`, YAML config (`pipeline.yaml`, `v2/site.yaml`), MkDocs Material (v2 site).

## Global Constraints

- **Toolchain via devbox.** Go is not on PATH. Run every Go/just command as `devbox run -- bash -c 'cd steel-etl && go <...>'` (see [[devbox-go-invocation]] memory). Bare `devbox run -- go` fails.
- **Book directory slugs (exact):** `heroes`, `monsters`, `beastheart`, `summoner`.
- **Target repo:** reuse existing `SteelCompendium/data-unified` (local clone `data/data-unified`). No GitHub rename in this effort.
- **Formats published (per book):** `md`, `json`, `yaml`, `md-linked`, `md-dse`, `md-dse-linked`, plus `clean` (stripped) where enabled (heroes only today).
- **Unified aggregate:** all six structured formats (`md`, `json`, `yaml`, `md-linked`, `md-dse`, `md-dse-linked`); navigation `_index` markdown under `unified/md/_index/` only. `clean` is NOT aggregated.
- **Locale is the top path segment:** `<locale>/unified/...` and `<locale>/books/<slug>/...`. Default locale `en`.
- **No SCC change.** SCC codes/registry are untouched; this is output-location only. No `docs/scc-log.md` entry.
- **Do NOT touch** `data-sdk-npm` or `draw-steel-elements` code (link-only on old-repo READMEs).
- **Commits:** no AI attribution / co-author trailers (global user rule).
- Spec: `docs/superpowers/specs/2026-06-20-data-repo-consolidation-design.md`.

## Target layout (single `data-unified` repo)

```
en/
  unified/{md,json,yaml,md-linked,md-dse,md-dse-linked}/<type>/<item>
  unified/md/_index/<type>.md + README.md
  books/<slug>/{md,json,yaml,md-linked,md-dse,md-dse-linked}/<type>/<item>
  books/heroes/clean/<inputfile>.md
```

## File structure / what each task touches

| Task | Files | Responsibility |
|------|-------|----------------|
| 1 | `internal/pipeline/config.go` (+ `config_test.go`) | Add `Output.Dir` slug field; propagate in `EffectiveBookConfig`; add `BookOutputDir` helper |
| 2 | `internal/pipeline/pipeline.go`, `internal/cli/gen.go` (+ tests) | Insert `books/<slug>` into per-book paths (all formats + stripped) via the helper |
| 3 | `internal/pipeline/pipeline.go` (+ `aggregate_allformat_test.go`) | All-format unified aggregate via `buildAggregateGenerators`; wire into `RunSharedOutputs` |
| 4 | `pipeline.yaml` | Repoint all books + aggregate + stripped at `../data/data-unified`; add `dir:` slugs |
| 5 | `justfile` | `clone-all` + `deploy` operate on the single `data-unified` repo |
| 6 | `v2/site.yaml` | `source_dirs` → `data-unified/en/books/<slug>/md-linked` |
| 7 | `v2/docs/index.md` | Homepage "Data Repos" link list → single consolidated repo |
| 8 | `data/data-rules/README.md`, `data/data-bestiary/README.md` | Deprecation READMEs (one-time push) |
| 9 | (verification only) | i18n readiness smoke test: `gen --locale es` |
| 10 | `ARCHITECTURE.md`, `CLAUDE.md`, `ROADMAP.md` | Docs sync |

---

### Task 1: Add book-slug config field + path helper

**Files:**
- Modify: `steel-etl/internal/pipeline/config.go` (`OutputConfig` struct ~L33-42; `EffectiveBookConfig` ~L105-124)
- Test: `steel-etl/internal/pipeline/config_test.go`

**Interfaces:**
- Produces: `OutputConfig.Dir string` (yaml `dir`); `func (c *Config) BookOutputDir(locale string) string` returning `filepath.Join(c.ResolvePath(c.Output.BaseDir), locale, "books", c.Output.Dir)`.
- Consumed by: Task 2 (per-book paths), Task 3 reads `Output.Aggregate.OutputDir`.

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/pipeline/config_test.go`:

```go
func TestBookOutputDir(t *testing.T) {
	cfg := &Config{
		ConfigDir: "/repo/steel-etl",
		Output:    OutputConfig{BaseDir: "../data/data-unified", Dir: "heroes"},
	}
	got := cfg.BookOutputDir("en")
	want := "/repo/data/data-unified/en/books/heroes"
	if got != want {
		t.Fatalf("BookOutputDir = %q, want %q", got, want)
	}
}

func TestEffectiveBookConfigCarriesDir(t *testing.T) {
	base := &Config{
		ConfigDir: "/repo/steel-etl",
		Output:    OutputConfig{BaseDir: "../data/data-unified", Dir: "heroes", Formats: []string{"md"}},
	}
	eff := base.EffectiveBookConfig(BookConfig{
		Book:   "mcdm.monsters.v1",
		Input:  "./input/monsters/x.md",
		Output: OutputConfig{BaseDir: "../data/data-unified", Dir: "monsters"},
	})
	if eff.Output.Dir != "monsters" {
		t.Fatalf("eff.Output.Dir = %q, want monsters", eff.Output.Dir)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run "BookOutputDir|EffectiveBookConfigCarriesDir" -v'`
Expected: FAIL — `eff.Output.Dir undefined (type OutputConfig has no field Dir)` / `cfg.BookOutputDir undefined`.

- [ ] **Step 3: Add the `Dir` field**

In `config.go`, in `OutputConfig` (after `BaseDir`):

```go
type OutputConfig struct {
	BaseDir   string          `yaml:"base_dir"`
	Dir       string          `yaml:"dir"` // book slug under <locale>/books/ (heroes, monsters, …)
	Formats   []string        `yaml:"formats"`
	// … unchanged …
}
```

- [ ] **Step 4: Propagate `Dir` in `EffectiveBookConfig`**

In `EffectiveBookConfig`, after the `BaseDir` override block (~L113):

```go
	if b.Output.BaseDir != "" {
		out.BaseDir = b.Output.BaseDir
	}
	if b.Output.Dir != "" {
		out.Dir = b.Output.Dir
	}
```

- [ ] **Step 5: Add the `BookOutputDir` helper**

Add near `EffectiveBookConfig` in `config.go`:

```go
// BookOutputDir returns the per-book output root for a locale:
//   <ResolvePath(BaseDir)>/<locale>/books/<slug>
// e.g. ".../data/data-unified/en/books/heroes". Format subdirs (md, json, …)
// are appended by the caller.
func (c *Config) BookOutputDir(locale string) string {
	return filepath.Join(c.ResolvePath(c.Output.BaseDir), locale, "books", c.Output.Dir)
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run "BookOutputDir|EffectiveBookConfigCarriesDir" -v'`
Expected: PASS (both).

- [ ] **Step 7: Commit**

```bash
git -C steel-etl add internal/pipeline/config.go internal/pipeline/config_test.go
git -C steel-etl commit -m "feat(pipeline): add book-slug Output.Dir + BookOutputDir helper"
```

---

### Task 2: Insert `books/<slug>` into per-book output paths

The per-book path is built in two places: `gen.go:164-165` (md, printed) and `pipeline.go:348-353` (`baseDir` for json/yaml/variants), plus the stripped path at `pipeline.go:396-408`. Route all three through `BookOutputDir`.

**Files:**
- Modify: `steel-etl/internal/cli/gen.go` (~L163-165)
- Modify: `steel-etl/internal/pipeline/pipeline.go` (`buildGenerators` ~L347-353, stripped ~L397-408)
- Test: `steel-etl/internal/pipeline/pipeline_paths_test.go` (new)

**Interfaces:**
- Consumes: `Config.BookOutputDir(locale)` (Task 1).
- Produces: per-book generator `BaseDir`s of the form `<...>/en/books/<slug>/<format>`. Task 6 (`site.yaml`) and Task 3 rely on this exact shape for `md-linked`.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/pipeline/pipeline_paths_test.go`:

```go
package pipeline

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/output"
	"github.com/SteelCompendium/steel-etl/internal/scc"
)

// baseDirOf extracts the BaseDir field from the known generator types.
func baseDirOf(g output.Generator) string {
	switch t := g.(type) {
	case *output.MarkdownGenerator:
		return t.BaseDir
	case *output.JSONGenerator:
		return t.BaseDir
	case *output.YAMLGenerator:
		return t.BaseDir
	case *output.LinkedGenerator:
		return t.BaseDir
	case *output.DSEGenerator:
		return t.BaseDir
	case *output.DSELinkedGenerator:
		return t.BaseDir
	}
	return ""
}

func TestPerBookPathsIncludeBooksSlug(t *testing.T) {
	cfg := &Config{
		Book:      "mcdm.heroes.v1",
		Locale:    "en",
		ConfigDir: "/repo/steel-etl",
		Output: OutputConfig{
			BaseDir:  "../data/data-unified",
			Dir:      "heroes",
			Formats:  []string{"md", "json", "yaml"},
			Variants: VariantsConfig{Linked: true, DSE: true, DSELinked: true},
		},
	}
	mdOut := filepath.Join(cfg.BookOutputDir("en"), "md")
	gens := buildGenerators(cfg, mdOut, "", scc.NewRegistry(), nil)

	wantSuffixes := map[string]bool{
		filepath.Join("en", "books", "heroes", "md"):            false,
		filepath.Join("en", "books", "heroes", "json"):          false,
		filepath.Join("en", "books", "heroes", "yaml"):          false,
		filepath.Join("en", "books", "heroes", "md-linked"):     false,
		filepath.Join("en", "books", "heroes", "md-dse"):        false,
		filepath.Join("en", "books", "heroes", "md-dse-linked"): false,
	}
	for _, g := range gens {
		bd := baseDirOf(g)
		for suf := range wantSuffixes {
			if strings.HasSuffix(bd, suf) {
				wantSuffixes[suf] = true
			}
		}
	}
	for suf, seen := range wantSuffixes {
		if !seen {
			t.Errorf("no generator BaseDir ended with %q", suf)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run TestPerBookPathsIncludeBooksSlug -v'`
Expected: FAIL — generators end with `en/md`, `en/json`, … (no `books/heroes`).

- [ ] **Step 3: Update `buildGenerators` baseDir construction**

In `pipeline.go`, replace the baseDir block (~L347-353):

```go
	// Base output directory: <BaseDir>/<locale>/books/<slug>
	baseDir := mdOutputDir
	if cfg.Output.BaseDir != "" {
		baseDir = cfg.BookOutputDir(locale)
	} else if baseDir == "" {
		baseDir = filepath.Join("books", cfg.Output.Dir)
	}
```

Then in the `md` case (~L358-362), make md use `baseDir` consistently (ignore the legacy `mdOutputDir` so all formats share one root):

```go
		case "md":
			generators = append(generators, &output.MarkdownGenerator{BaseDir: filepath.Join(baseDir, "md")})
```

(The `mdOutputDir` param stays in the signature — still used for logging/printf in `gen.go` — but no longer drives the md generator dir.)

- [ ] **Step 4: Update the stripped path**

In `pipeline.go` stripped block (~L397-408), nest stripped under the book's `clean/` dir:

```go
	if cfg.Output.Stripped.Enabled && cfg.Output.Stripped.OutputDir != "" {
		inputBase := filepath.Base(cfg.Input)
		if inputBase == "" || inputBase == "." {
			inputBase = "output.md"
		}
		generators = append(generators, &output.StrippedGenerator{
			OutputPath: filepath.Join(cfg.BookOutputDir(locale), "clean", inputBase),
			RawInput:   rawInput,
		})
	}
```

- [ ] **Step 5: Update the md output path in `gen.go`**

In `gen.go`, replace L164-165:

```go
	mdOutputDir := filepath.Join(cfg.BookOutputDir(locale), "md")
```

(Add `"path/filepath"` to imports if not already present — check the import block.)

- [ ] **Step 6: Run the test + full package**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ ./internal/cli/ -run "Path|Gen" -v && go build ./...'`
Expected: PASS; build clean.

- [ ] **Step 7: Commit**

```bash
git -C steel-etl add internal/pipeline/pipeline.go internal/cli/gen.go internal/pipeline/pipeline_paths_test.go
git -C steel-etl commit -m "feat(pipeline): nest per-book output under <locale>/books/<slug>"
```

---

### Task 3: All-format unified aggregate

Today `RunSharedOutputs` zeroes `Formats`/`Variants` so `buildGenerators` emits only a md-only `AggregateGenerator` (+ scc_map/api). Replace the aggregate half with a dedicated `buildAggregateGenerators` that returns per-format generators pointed at `unified/<format>` (reusing the existing format generators) plus the md `AggregateGenerator` for `_index`.

**Files:**
- Modify: `steel-etl/internal/pipeline/pipeline.go` (remove aggregate from `buildGenerators` ~L410-415; add `buildAggregateGenerators`; call it in `RunSharedOutputs` ~L309)
- Test: `steel-etl/internal/pipeline/aggregate_allformat_test.go` (new)

**Interfaces:**
- Consumes: `cfg.Output.Aggregate.{Enabled,OutputDir}`, `cfg.Output.Formats`, `cfg.Output.Variants`, `scc.NewResolver`, `cfg.Output.ParseLinkMode()`.
- Produces: `func buildAggregateGenerators(cfg *Config, sccRegistry *scc.Registry, locale string) []output.Generator`. Each generator's `BaseDir` is `Join(ResolvePath(Aggregate.OutputDir), locale, "unified", <format>)`.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/pipeline/aggregate_allformat_test.go`:

```go
package pipeline

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/SteelCompendium/steel-etl/internal/scc"
)

func TestBuildAggregateGeneratorsAllFormats(t *testing.T) {
	cfg := &Config{
		Locale:    "en",
		ConfigDir: "/repo/steel-etl",
		Output: OutputConfig{
			Formats:   []string{"md", "json", "yaml"},
			Variants:  VariantsConfig{Linked: true, DSE: true, DSELinked: true},
			Aggregate: AggregateConfig{Enabled: true, OutputDir: "../data/data-unified"},
		},
	}
	gens := buildAggregateGenerators(cfg, scc.NewRegistry(), "en")

	want := []string{"md", "json", "yaml", "md-linked", "md-dse", "md-dse-linked"}
	for _, format := range want {
		suffix := filepath.Join("en", "unified", format)
		found := false
		for _, g := range gens {
			if strings.HasSuffix(baseDirOf2(g), suffix) {
				found = true
			}
		}
		if !found {
			t.Errorf("no aggregate generator for %q (suffix %q)", format, suffix)
		}
	}
}
```

Add a local `baseDirOf2` helper in this test file that also handles `*output.AggregateGenerator` (reuse the type switch from `baseDirOf` plus an `*output.AggregateGenerator` case returning `t.BaseDir`).

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run TestBuildAggregateGeneratorsAllFormats -v'`
Expected: FAIL — `buildAggregateGenerators undefined`.

- [ ] **Step 3: Add `buildAggregateGenerators`**

Add to `pipeline.go`:

```go
// buildAggregateGenerators returns the cross-book "unified" aggregate generators,
// one per configured format/variant, all pointed at
// <Aggregate.OutputDir>/<locale>/unified/<format>. The md generator is the
// AggregateGenerator (it also builds the _index navigation pages); the other
// formats reuse the standard per-format generators (they merge across books
// because RunSharedOutputs feeds every book's items to the same instances).
func buildAggregateGenerators(cfg *Config, sccRegistry *scc.Registry, locale string) []output.Generator {
	if !cfg.Output.Aggregate.Enabled || cfg.Output.Aggregate.OutputDir == "" {
		return nil
	}
	root := filepath.Join(cfg.ResolvePath(cfg.Output.Aggregate.OutputDir), locale, "unified")
	resolver := scc.NewResolver(sccRegistry, ".md")
	linkMode := cfg.Output.ParseLinkMode()

	var gens []output.Generator
	for _, format := range cfg.Output.Formats {
		switch format {
		case "md":
			gens = append(gens, &output.AggregateGenerator{BaseDir: filepath.Join(root, "md")})
		case "json":
			gens = append(gens, &output.JSONGenerator{BaseDir: filepath.Join(root, "json")})
		case "yaml":
			gens = append(gens, &output.YAMLGenerator{BaseDir: filepath.Join(root, "yaml")})
		}
	}
	if cfg.Output.Variants.Linked {
		gens = append(gens, &output.LinkedGenerator{BaseDir: filepath.Join(root, "md-linked"), Resolver: resolver, LinkMode: linkMode})
	}
	if cfg.Output.Variants.DSE {
		gens = append(gens, &output.DSEGenerator{BaseDir: filepath.Join(root, "md-dse")})
	}
	if cfg.Output.Variants.DSELinked {
		gens = append(gens, &output.DSELinkedGenerator{BaseDir: filepath.Join(root, "md-dse-linked"), Resolver: resolver, LinkMode: linkMode})
	}
	return gens
}
```

- [ ] **Step 4: Remove the md-only aggregate from `buildGenerators`**

Delete the aggregate block in `buildGenerators` (~L410-415, the `if cfg.Output.Aggregate.Enabled { … &output.AggregateGenerator{ BaseDir: …"md"} }`). Leave scc_map and scc_api untouched.

- [ ] **Step 5: Wire the aggregate into `RunSharedOutputs`**

In `RunSharedOutputs`, `RunSharedOutputs` currently zeroes Formats/Variants then calls `buildGenerators`. Build aggregate generators from the **original** `cfg` (non-zeroed) and append them. Replace the generator-build section (~L284-312):

```go
	// scc_map / scc_api come from buildGenerators with per-book formats zeroed.
	shared := *cfg
	out := cfg.Output
	out.Formats = nil
	out.Variants = VariantsConfig{}
	out.Stripped.Enabled = false
	out.Aggregate.Enabled = false // aggregate handled separately, all-format
	shared.Output = out

	// … (registry load block unchanged) …

	generators := buildGenerators(&shared, "", registryPath, sccRegistry, nil)
	// All-format unified aggregate uses the original (non-zeroed) cfg formats.
	generators = append(generators, buildAggregateGenerators(cfg, sccRegistry, localeOf(cfg))...)
	if len(generators) == 0 {
		return nil
	}
```

Add a tiny `locale(cfg)` helper or inline `cfg.Locale` with `"en"` fallback (match the existing pattern at `buildGenerators` L340-343):

```go
func localeOf(cfg *Config) string {
	if cfg.Locale == "" {
		return "en"
	}
	return cfg.Locale
}
```

and use `buildAggregateGenerators(cfg, sccRegistry, localeOf(cfg))`.

- [ ] **Step 6: Run the unit test + a real aggregate smoke check**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/pipeline/ -run "Aggregate|Path" -v && go build ./...'`
Expected: PASS; build clean.

- [ ] **Step 7: Commit**

```bash
git -C steel-etl add internal/pipeline/pipeline.go internal/pipeline/aggregate_allformat_test.go
git -C steel-etl commit -m "feat(pipeline): unified aggregate spans all formats, not just md"
```

---

### Task 4: Point `pipeline.yaml` at the single repo + add slugs

**Files:**
- Modify: `steel-etl/pipeline.yaml`

**Interfaces:** consumes Task 1/2/3 (the `dir:` field + path logic). Produces the config that makes `gen --all` write only `data/data-unified/`.

- [ ] **Step 1: Edit primary book output**

In `pipeline.yaml`, set the primary `output`:

```yaml
output:
  base_dir: ../data/data-unified
  dir: heroes
  formats:
    - md
    - json
    - yaml
  variants:
    linked: true
    dse: true
    dse_linked: true
  stripped:
    enabled: true
    output_dir: ../data/data-unified
  aggregate:
    enabled: true
    output_dir: ../data/data-unified
  scc_api:
    enabled: true
    output_dir: ../steelCompendium.github.io/docs/api
    base_url: https://steelcompendium.io/v2
    site_config: ../v2/site.yaml
  scc_map:
    enabled: true
    output_file: ./output/scc-to-path.json
```

(`stripped.output_dir` now points at the repo root; the `clean/` + locale + book nesting is added by Task 2's stripped path code.)

- [ ] **Step 2: Edit the `books:` list**

```yaml
books:
  - book: mcdm.monsters.v1
    input: ./input/monsters/Draw Steel Monsters.md
    output:
      base_dir: ../data/data-unified
      dir: monsters
  - book: mcdm.beastheart.v1
    input: ./input/beastheart/Draw Steel Beastheart.md
    output:
      base_dir: ../data/data-unified
      dir: beastheart
  - book: mcdm.summoner.v1
    input: ./input/summoner/Draw Steel Summoner.md
    output:
      base_dir: ../data/data-unified
      dir: summoner
```

- [ ] **Step 3: Clear the stale `data-unified/en` tree and regenerate**

The old aggregate lived at `data/data-unified/en/md`; the new layout writes `en/unified` + `en/books`. Remove the old tree so no stale files linger, then run a full build.

Run:
```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace && rm -rf data/data-unified/en && cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all'
```
Expected: completes; prints per-book lines + "Regenerating cross-book shared outputs".

- [ ] **Step 4: Verify the on-disk layout**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
ls data/data-unified/en           # expect: books  unified
ls data/data-unified/en/books     # expect: beastheart  heroes  monsters  summoner
ls data/data-unified/en/books/heroes   # expect: clean json md md-dse md-dse-linked md-linked yaml
ls data/data-unified/en/unified   # expect: json md md-dse md-dse-linked md-linked yaml
ls data/data-unified/en/unified/md/_index | head   # expect: README.md + per-type .md
# Negative: nothing rewritten into the old per-book dirs
git -C data/data-rules status --short | head     # expect: empty (untouched)
git -C data/data-bestiary status --short | head  # expect: empty (untouched)
```
Expected: layout as annotated; old repos untouched.

- [ ] **Step 5: Commit the config**

```bash
git -C steel-etl add pipeline.yaml
git -C steel-etl commit -m "config(pipeline): consolidate all books + all-format aggregate into data-unified"
```

---

### Task 5: `justfile` — single-repo clone + deploy

**Files:**
- Modify: `justfile` (`clone-all` data_repos list ~L48-51; `deploy` push loop ~L115)

**Interfaces:** consumes the new pipeline output. Produces a deploy that commits/pushes only `data-unified`.

- [ ] **Step 1: Collapse the `clone-all` data_repos list**

Replace the `data_repos=( data-bestiary data-rules data-unified )` array (~L48-51) with:

```bash
    # Consolidated data repo (single pipeline output target)
    data_repos=(
        data-unified
    )
```

- [ ] **Step 2: Collapse the `deploy` push loop**

Replace `for repo in data-bestiary data-rules data-unified; do` (~L115) with:

```bash
    for repo in data-unified; do
```

Update the nearby comment (~L112-114) to drop the obsolete "data-beastheart / data-summoner / data-rules-clean are local-only" note (those are gone; only `data-unified` is a clone now).

- [ ] **Step 3: Verify just parses + dry inspection**

Run: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace && just --summary >/dev/null && grep -n "data-unified" justfile'`
Expected: `just --summary` succeeds; only `data-unified` appears in the data sections.

- [ ] **Step 4: Commit**

```bash
git add justfile
git commit -m "chore(justfile): clone/deploy only the consolidated data-unified repo"
```

---

### Task 6: `v2/site.yaml` — repoint `source_dirs`

**Files:**
- Modify: `v2/site.yaml` (`source_dirs` L8-12)

**Interfaces:** consumes Task 2's `books/<slug>/md-linked` paths. Produces a site build that reads from the consolidated repo.

- [ ] **Step 1: Replace `source_dirs`**

```yaml
source_dirs:
  - ../data/data-unified/en/books/heroes/md-linked
  - ../data/data-unified/en/books/beastheart/md-linked
  - ../data/data-unified/en/books/summoner/md-linked
  - ../data/data-unified/en/books/monsters/md-linked
```

- [ ] **Step 2: Build the site and confirm books still present**

Run:
```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
ls /home/scott/code/steelCompendium/workspace/v2/docs/Browse        # expect monster/, class/, feature/, etc.
ls /home/scott/code/steelCompendium/workspace/v2/docs/Browse/monster/companion/beastheart 2>/dev/null | head
```
Expected: site builds; Browse contains monsters + beastheart companions + summoner (no missing books).

- [ ] **Step 3: Commit (site.yaml only; generated docs/ handled by deploy)**

```bash
git -C v2 add site.yaml
git -C v2 commit -m "config(site): read content from consolidated data-unified repo"
```

---

### Task 7: Homepage data-repo links

**Files:**
- Modify: `v2/docs/index.md` (the "Data Repos" link list, ~L60-100)

**Interfaces:** none (content only).

- [ ] **Step 1: Read the current block**

Run: `sed -n '55,105p' /home/scott/code/steelCompendium/workspace/v2/docs/index.md` (review exact wording/structure before editing).

- [ ] **Step 2: Replace the multi-repo + legacy list with the single repo**

Collapse the current per-book + legacy-per-format bullet lists into one canonical entry. Use this content (adapt surrounding headers to the file's existing markdown structure):

```markdown
    - [data-unified](https://github.com/SteelCompendium/data-unified) — the consolidated data repo: every book in every format.
      - **Browse** — `en/unified/<format>/` — all content aggregated by type (`md`, `json`, `yaml`, `md-linked`, `md-dse`, `md-dse-linked`).
      - **Read** — `en/books/<book>/<format>/` — book-faithful, source-ordered (`heroes`, `monsters`, `beastheart`, `summoner`).

    The former per-book / per-format repos (`data-rules`, `data-bestiary`, `data-rules-md`, `data-bestiary-json`, `data-md-dse`, …) are superseded by `data-unified`.
```

Remove the obsolete `data-rules` / `data-bestiary` / `data-md*` / `data-rules-*` / `data-bestiary-*` / `data-adventures-md` bullets (~L63-99).

- [ ] **Step 3: Commit**

```bash
git -C v2 add docs/index.md
git -C v2 commit -m "docs(v2): point homepage data links at consolidated data-unified repo"
```

---

### Task 8: Deprecation READMEs on the old published repos

`data-rules` and `data-bestiary` are real GitHub repos no longer receiving output. Give each a deprecation README and push it once (these repos are no longer in the deploy loop, so this is a manual one-time migration). The orphan local dirs (`data-beastheart`, `data-summoner`, `data-rules-clean`) were never published — just delete them locally.

**Files:**
- Create: `data/data-rules/README.md`, `data/data-bestiary/README.md` (in the gitignored clones)

- [ ] **Step 1: Write the deprecation README for data-rules**

Create `data/data-rules/README.md`:

```markdown
# ⚠️ Deprecated — moved to `data-unified`

This repo (the Draw Steel **Heroes** book data) has been consolidated into the single
**[`data-unified`](https://github.com/SteelCompendium/data-unified)** repo.

Find this book's content at:

- **Book-faithful:** `en/books/heroes/<format>/` (`md`, `json`, `yaml`, `md-linked`, `md-dse`, `md-dse-linked`)
- **Aggregated with every other book, by type:** `en/unified/<format>/`

This repo is frozen and will not receive further updates.
```

- [ ] **Step 2: Write the deprecation README for data-bestiary**

Create `data/data-bestiary/README.md` (same as above but "**Monsters** book" and `en/books/monsters/`).

- [ ] **Step 3: Commit + push both old repos (one-time)**

```bash
git -C data/data-rules add README.md
git -C data/data-rules commit -m "docs: deprecate — consolidated into data-unified"
git -C data/data-rules push

git -C data/data-bestiary add README.md
git -C data/data-bestiary commit -m "docs: deprecate — consolidated into data-unified"
git -C data/data-bestiary push
```
Expected: both pushes succeed.

- [ ] **Step 4: Remove the orphan local output dirs**

Run: `rm -rf /home/scott/code/steelCompendium/workspace/data/{data-beastheart,data-summoner,data-rules-clean}`
(They are gitignored local-only artifacts now superseded by `data-unified/en/books/*`. No commit needed.)

---

### Task 9: i18n-readiness smoke test

Prove the layout scales to a new language with zero code change: a locale run produces a parallel top-level folder. (English fallback content — no translation exists yet.)

- [ ] **Step 1: Run a locale build (English fallback)**

Run:
```bash
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace/steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all --locale es'
```
Expected: completes; writes an `es/` tree.

- [ ] **Step 2: Verify the parallel layout**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
ls data/data-unified            # expect: en  es
ls data/data-unified/es/books   # expect: beastheart  heroes  monsters  summoner
ls data/data-unified/es/unified # expect: json md md-dse md-dse-linked md-linked yaml
```
Expected: `es/` mirrors `en/` structurally — i18n-ready confirmed.

- [ ] **Step 3: Clean up the smoke-test artifact + restore en**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
rm -rf data/data-unified/es
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all'
```
Expected: `es/` gone; `en/` regenerated as the committed state. (No commit — `data/` is gitignored; this task is verification only.)

---

### Task 10: Docs sync

**Files:**
- Modify: `ARCHITECTURE.md` (output-targets table + the "Output (7 targets)" diagram block + the multi-book gotcha)
- Modify: `CLAUDE.md` (the `data/` bullet under "Layout")
- Modify: `ROADMAP.md` (item #10 — note the repo-consolidation half delivered)

- [ ] **Step 1: Update ARCHITECTURE.md output targets**

In the `steel-etl gen` outputs table, collapse the per-repo rows into the consolidated layout. Replace the `data/data-rules/*`, `data/data-rules-clean/`, and `data/data-unified/en/md` rows with rows describing:
- `data/data-unified/en/books/<slug>/<format>` — per-book, all six variants + `clean` (book-faithful / Read)
- `data/data-unified/en/unified/<format>` — cross-book aggregate, all six variants (Browse)

Update the ASCII diagram's "Output (7 targets)" list to the new single-repo targets, and fix the "Section mapping … reads `data/data-rules/en/md-linked`" line and the **multi-book gotcha** to reference `data/data-unified/en/books/<slug>/`.

- [ ] **Step 2: Update CLAUDE.md `data/` bullet**

Replace the `data/` "Layout" bullet:

```markdown
- `data/` -- The single generated output repo `data-unified` (reused as the consolidated
  product). Layout: `en/unified/<format>/` (Browse: everything aggregated by type) and
  `en/books/<slug>/<format>/` (Read: book-faithful — `heroes`, `monsters`, `beastheart`,
  `summoner`). All six formats + `clean`. Do not edit directly.
```

- [ ] **Step 3: Update ROADMAP #10**

Under item #10 "Phase 4.5 — Consumer migration", add a status note:

```markdown
- **2026-06-20 — repo-consolidation half DONE.** All four books + the cross-book aggregate now
  publish to the single `data-unified` repo (`en/unified/` Browse + `en/books/<slug>/` Read,
  all formats); the orphaned `data-beastheart`/`data-summoner`/`data-rules-clean` dirs and the
  legacy per-book `data-rules`/`data-bestiary` repos are retired (deprecation READMEs added).
  i18n layout is ready (`<locale>/` top-level; smoke-tested with `--locale es`). Still pending:
  pointing `draw-steel-elements` + the SDK at the new locations and the formal deprecation
  timeline. Spec/plan: `docs/superpowers/{specs,plans}/2026-06-20-data-repo-consolidation*`.
```

- [ ] **Step 4: Commit**

```bash
git add ARCHITECTURE.md CLAUDE.md ROADMAP.md
git commit -m "docs: data-repo consolidation — architecture, router, roadmap #10"
```

---

## Final verification

- [ ] **Full Go test suite + vet:** `devbox run -- bash -c 'cd steel-etl && go test ./... && go vet ./...'` → all pass.
- [ ] **Clean full build writes only the one repo:** `rm -rf data/data-unified/en && devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all'` → `data/data-unified/en/{unified,books}` populated; `git -C data/data-rules status` and `git -C data/data-bestiary status` clean.
- [ ] **Site builds with all four books:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'` → Browse has monster/beastheart/summoner content.
- [ ] **Acceptance criteria 1-8** in the spec each map to a completed task (see self-review below).

## Self-Review (against spec)

**Spec coverage:**
- Layout (unified + books, locale-top) → Tasks 1-4. ✓
- All-format unified aggregate → Task 3. ✓
- Reuse `data-unified`, no rename → Task 4 config + Global Constraints. ✓
- Publish everything (6 variants + clean) → Tasks 2 (clean), 4 (config). ✓
- justfile single repo → Task 5. ✓
- Site: `site.yaml` source_dirs + homepage links → Tasks 6, 7. ✓
- Old repos deprecation READMEs, no dual-publish, SDK/plugin untouched → Task 8 + Global Constraints. ✓
- i18n readiness (ready not active) → Task 9. ✓
- Docs sync (ARCHITECTURE, CLAUDE, ROADMAP #10) → Task 10. ✓
- No SCC change / no scc-log entry → Global Constraints (no task needed). ✓

**Placeholder scan:** none — every code/edit step shows concrete content.

**Type consistency:** `Output.Dir` (Task 1) used in `BookOutputDir` (Task 1), consumed in Tasks 2-4; `buildAggregateGenerators(cfg, sccRegistry, locale)` signature consistent between Task 3 definition and its `RunSharedOutputs` call; generator `BaseDir` field name matches all five existing generator structs (verified against source).

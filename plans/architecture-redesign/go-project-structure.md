# Go Project Structure: `steel-etl`

## Repository

New repo: `SteelCompendium/steel-etl` (or could live in a subdirectory of the workspace initially during development)

## Module Layout

```
steel-etl/
├── cmd/
│   └── steel-etl/
│       └── main.go                  # Entry point
├── internal/
│   ├── cli/
│   │   ├── root.go                  # cobra root command
│   │   ├── gen.go                   # `steel-etl gen` — run pipeline
│   │   ├── classify.go              # `steel-etl classify` — SCC operations
│   │   ├── validate.go              # `steel-etl validate` — check annotations
│   │   └── strip.go                 # `steel-etl strip` — remove annotations from markdown
│   │
│   ├── parser/
│   │   ├── annotations.go           # Pre-pass: extract <!-- @key: value --> from raw text
│   │   ├── annotations_test.go
│   │   ├── document.go              # Parse annotated markdown into structured Document
│   │   ├── document_test.go
│   │   ├── section.go               # Section: heading + body + children + metadata
│   │   └── section_test.go
│   │
│   ├── context/
│   │   ├── stack.go                 # Hierarchical context stack (see context-stack.md)
│   │   └── stack_test.go
│   │
│   ├── content/
│   │   ├── registry.go              # Content parser registry (type → parser)
│   │   ├── parser.go                # ContentParser interface
│   │   ├── ability.go               # AbilityParser
│   │   ├── ability_test.go
│   │   ├── statblock.go             # StatblockParser
│   │   ├── statblock_test.go
│   │   ├── class.go                 # ClassParser
│   │   ├── kit.go                   # KitParser
│   │   ├── chapter.go               # ChapterParser (passthrough)
│   │   ├── feature.go               # FeatureParser + FeatureGroupParser
│   │   ├── ancestry.go              # AncestryParser
│   │   ├── career.go                # CareerParser
│   │   ├── culture.go               # CultureParser
│   │   ├── perk.go                  # PerkParser
│   │   ├── title.go                 # TitleParser
│   │   ├── treasure.go              # TreasureParser
│   │   ├── condition.go             # ConditionParser
│   │   ├── complication.go          # ComplicationParser
│   │   ├── monster.go               # MonsterParser
│   │   └── helpers.go               # Shared parsing utilities (power roll, tables, etc.)
│   │
│   ├── scc/
│   │   ├── classifier.go            # Derive SCC from context stack annotation hierarchy
│   │   ├── classifier_test.go
│   │   ├── registry.go              # Classification registry (read/write classification.json)
│   │   ├── registry_test.go
│   │   ├── resolver.go              # SCC code → file path / URL resolution
│   │   └── resolver_test.go
│   │
│   ├── output/
│   │   ├── generator.go             # OutputGenerator interface
│   │   ├── markdown.go              # Emit per-section .md with YAML frontmatter
│   │   ├── markdown_test.go
│   │   ├── json.go                  # Emit per-section .json
│   │   ├── yaml.go                  # Emit per-section .yaml
│   │   ├── linked.go                # Inject SCC cross-reference links
│   │   ├── dse.go                   # Obsidian DSE formatting variant
│   │   ├── stripped.go              # Annotation-free markdown copy
│   │   ├── aggregate.go             # Full-book assembly, index files
│   │   ├── sccmap.go                # SCC-to-path mapping (scc-to-path.json)
│   │   └── frontmatter.go           # YAML frontmatter builder (shared by markdown/json/yaml)
│   │
│   ├── pipeline/
│   │   ├── pipeline.go              # Orchestrator: parse → classify → output
│   │   ├── config.go                # Pipeline config (read pipeline.yaml)
│   │   └── config_test.go
│   │
│   └── locale/
│       ├── locale.go                # Locale resolution, path management
│       └── locale_test.go
│
├── testdata/
│   ├── heroes_excerpt.md            # Small annotated markdown for testing
│   ├── expected/                    # Expected output fixtures
│   │   ├── md/
│   │   ├── json/
│   │   └── yaml/
│   └── classification.json          # Test classification registry
│
├── go.mod
├── go.sum
├── Makefile                         # or justfile for build/test/install
└── README.md
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `github.com/yuin/goldmark` | CommonMark markdown parser with extensible AST |
| `github.com/yuin/goldmark-meta` | YAML frontmatter parsing for goldmark |
| `github.com/spf13/cobra` | CLI framework |
| `github.com/spf13/viper` | Configuration management (optional, for complex config) |
| `gopkg.in/yaml.v3` | YAML reading/writing |
| `encoding/json` | JSON output (stdlib) |
| `regexp` | Annotation pre-pass (stdlib) |
| `text/template` | Output template rendering if needed (stdlib) |

## CLI Commands

### `steel-etl gen`

Run the full pipeline for one or more books.

```bash
# Generate all outputs for the Heroes book
steel-etl gen --config pipeline.yaml

# Generate only markdown output
steel-etl gen --config pipeline.yaml --format md

# Generate for a specific locale
steel-etl gen --config pipeline.yaml --locale es

# Generate all books
steel-etl gen --config pipeline.yaml --all
```

### `steel-etl validate`

Check annotations and content structure without generating output.

```bash
# Validate annotations in a markdown file
steel-etl validate input/heroes/Draw\ Steel\ Heroes.md

# Validate that all SCC codes are stable (no changes to existing codes)
steel-etl validate --scc-stable input/classification.json
```

### `steel-etl classify`

SCC classification operations.

```bash
# Show the SCC classification for all sections in a document
steel-etl classify input/heroes/Draw\ Steel\ Heroes.md

# Export scc-to-path mapping
steel-etl classify --export-map scc-to-path.json
```

### `steel-etl strip`

Remove annotations from markdown, producing a clean copy.

```bash
# Strip annotations and write to output file
steel-etl strip input/heroes/Draw\ Steel\ Heroes.md --output clean/Heroes.md
```

## Build and Distribution

```bash
# Build
go build -o steel-etl ./cmd/steel-etl

# Install locally
go install ./cmd/steel-etl

# Cross-compile for distribution
GOOS=darwin GOARCH=arm64 go build -o steel-etl-darwin-arm64 ./cmd/steel-etl
GOOS=linux GOARCH=amd64 go build -o steel-etl-linux-amd64 ./cmd/steel-etl
GOOS=windows GOARCH=amd64 go build -o steel-etl-windows-amd64.exe ./cmd/steel-etl
```

## Testing Strategy

- **Unit tests** for each content parser using small markdown fixtures
- **Unit tests** for annotation extraction, context stack, SCC classification
- **Integration tests** using `testdata/heroes_excerpt.md` — run full pipeline, compare output against `testdata/expected/`
- **Golden file tests** for output generators — compare generated output byte-for-byte against known-good files
- Target: 80%+ coverage overall, 100% for SCC classification module

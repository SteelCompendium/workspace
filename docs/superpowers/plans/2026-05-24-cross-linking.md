# Cross-Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add link density filtering (`all`/`first`/`none`) to the SCC resolver, update all callers, wire it into the CLI, and migrate the source document's legacy links.

**Architecture:** The `LinkMode` enum lives in the `scc` package alongside the resolver. `ResolveLinks()` gains a `mode` parameter. Each output generator passes its mode through. The `gen` CLI command gets a `--link-mode` flag that overrides the default (`all`).

**Tech Stack:** Go, cobra CLI, table-driven tests, `devbox run --` for all Go commands.

**Spec:** `docs/superpowers/specs/2026-05-24-cross-linking-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `internal/scc/resolver.go` | Modify | Add `LinkMode` type, update `ResolveLinks()` signature, add `first`/`none` logic |
| `internal/scc/resolver_test.go` | Modify | Add table-driven tests for `LinkFirst`, `LinkNone`, unresolved-link stripping |
| `internal/output/linked.go` | Modify | Pass `LinkMode` to `ResolveLinks()`, add `LinkMode` field to struct |
| `internal/output/linked_test.go` | Modify | Update calls to match new signature, add mode-specific tests |
| `internal/output/dse_linked.go` | Modify | Pass `LinkMode` to `ResolveLinks()`, add `LinkMode` field to struct |
| `internal/output/dse_linked_test.go` | Modify | Update calls to match new signature |
| `internal/pipeline/pipeline.go` | Modify | Pass `LinkMode` from config to generators |
| `internal/pipeline/config.go` | Modify | Add `LinkMode` field to output config |
| `internal/cli/gen.go` | Modify | Add `--link-mode` flag |
| `input/heroes/Draw Steel Heroes.md` | Modify | Migrate 2 legacy colon-format links to slash format |

---

### Task 1: Add LinkMode type and update ResolveLinks signature

**Files:**
- Modify: `internal/scc/resolver.go`
- Test: `internal/scc/resolver_test.go`

- [ ] **Step 1: Write failing tests for LinkAll mode (existing behavior)**

Update all existing test calls to pass `LinkAll` explicitly. This verifies the signature change compiles correctly and existing behavior is preserved.

In `internal/scc/resolver_test.go`, change every call from:

```go
got := resolver.ResolveLinks(tt.input, "")
```

to:

```go
got := resolver.ResolveLinks(tt.input, "", scc.LinkAll)
```

And in `TestResolverWithAliases`:

```go
got := resolver.ResolveLinks(input, "", scc.LinkAll)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/scc/ -v -run TestResolver
```

Expected: compilation error — `ResolveLinks` doesn't accept 3 arguments yet.

- [ ] **Step 3: Add LinkMode type and update ResolveLinks**

In `internal/scc/resolver.go`, add the `LinkMode` type after the imports and before the `Resolver` struct:

```go
type LinkMode int

const (
	LinkAll   LinkMode = iota // resolve every scc: link
	LinkFirst                 // resolve first occurrence per SCC code, strip duplicates
	LinkNone                  // strip all scc: links to plain display text
)
```

Update the `ResolveLinks` method signature and implementation:

```go
// mdLinkRe matches a full markdown link wrapping an scc: protocol reference.
// Group 1 = display text, group 2 = SCC code.
var mdLinkRe = regexp.MustCompile(`\[([^\]]+)\]\(scc:([a-zA-Z0-9._\-]+/[a-zA-Z0-9._\-]+/[a-zA-Z0-9._\-]+)\)`)

func (r *Resolver) ResolveLinks(content string, relativeTo string, mode LinkMode) string {
	if mode == LinkNone {
		return mdLinkRe.ReplaceAllString(content, "$1")
	}

	seen := map[string]bool{}

	return mdLinkRe.ReplaceAllStringFunc(content, func(match string) string {
		parts := mdLinkRe.FindStringSubmatch(match)
		if len(parts) < 3 {
			return match
		}
		displayText := parts[1]
		sccCode := parts[2]

		if !r.registry.Contains(sccCode) {
			if canonical, ok := r.registry.ResolveAlias(sccCode); ok {
				sccCode = canonical
			} else {
				fmt.Fprintf(os.Stderr, "WARN: unresolved scc link %q\n", sccCode)
				return displayText
			}
		}

		if mode == LinkFirst {
			if seen[sccCode] {
				return displayText
			}
			seen[sccCode] = true
		}

		resolved := sccToRelPath(sccCode, r.ext)
		return "[" + displayText + "](" + resolved + ")"
	})
}
```

Add `"fmt"` and `"os"` to the imports.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/scc/ -v -run TestResolver
```

Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/scc/resolver.go internal/scc/resolver_test.go && git commit -m "feat: add LinkMode to ResolveLinks (all mode preserves existing behavior)"
```

---

### Task 2: Add tests for LinkFirst and LinkNone modes

**Files:**
- Test: `internal/scc/resolver_test.go`

- [ ] **Step 1: Write failing tests for LinkNone**

Append to `internal/scc/resolver_test.go`:

```go
func TestResolverLinkNone(t *testing.T) {
	reg := NewRegistry()
	reg.Add("mcdm.heroes.v1/class/fury")
	reg.Add("mcdm.heroes.v1/condition/dazed")

	resolver := NewResolver(reg, ".md")

	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "strips single link",
			input: "See [Fury](scc:mcdm.heroes.v1/class/fury) for details.",
			want:  "See Fury for details.",
		},
		{
			name:  "strips multiple links",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) causes [dazed](scc:mcdm.heroes.v1/condition/dazed).",
			want:  "Fury causes dazed.",
		},
		{
			name:  "plain text unchanged",
			input: "No links here.",
			want:  "No links here.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolver.ResolveLinks(tt.input, "", LinkNone)
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 2: Write failing tests for LinkFirst**

Append to `internal/scc/resolver_test.go`:

```go
func TestResolverLinkFirst(t *testing.T) {
	reg := NewRegistry()
	reg.Add("mcdm.heroes.v1/class/fury")
	reg.Add("mcdm.heroes.v1/condition/dazed")

	resolver := NewResolver(reg, ".md")

	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "first occurrence linked, second stripped",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) and [Fury](scc:mcdm.heroes.v1/class/fury) again.",
			want:  "[Fury](class/fury.md) and Fury again.",
		},
		{
			name:  "different codes each get one link",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) [dazed](scc:mcdm.heroes.v1/condition/dazed) [Fury](scc:mcdm.heroes.v1/class/fury).",
			want:  "[Fury](class/fury.md) [dazed](condition/dazed.md) Fury.",
		},
		{
			name:  "single occurrence kept",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) is great.",
			want:  "[Fury](class/fury.md) is great.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolver.ResolveLinks(tt.input, "", LinkFirst)
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/scc/ -v -run "TestResolverLink(None|First)"
```

Expected: all new tests pass (implementation was done in Task 1).

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/scc/resolver_test.go && git commit -m "test: add LinkFirst and LinkNone resolver tests"
```

---

### Task 3: Add test for unresolved link stripping

**Files:**
- Modify: `internal/scc/resolver_test.go`

- [ ] **Step 1: Write test for unresolved links**

The existing test `"unknown scc left as-is"` uses a bare `scc:` reference (not wrapped in a markdown link). Update it and add a new test for the markdown-link case, which should strip to display text per the design spec.

In `internal/scc/resolver_test.go`, add a new test function:

```go
func TestResolverUnresolvedLinks(t *testing.T) {
	reg := NewRegistry()
	reg.Add("mcdm.heroes.v1/class/fury")

	resolver := NewResolver(reg, ".md")

	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "unresolved markdown link stripped to display text",
			input: "See [Unknown](scc:mcdm.heroes.v1/class/unknown) for details.",
			want:  "See Unknown for details.",
		},
		{
			name:  "resolved link still works",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) is here.",
			want:  "[Fury](class/fury.md) is here.",
		},
		{
			name:  "mix of resolved and unresolved",
			input: "[Fury](scc:mcdm.heroes.v1/class/fury) and [Nope](scc:mcdm.heroes.v1/class/nope).",
			want:  "[Fury](class/fury.md) and Nope.",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := resolver.ResolveLinks(tt.input, "", LinkAll)
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}
```

- [ ] **Step 2: Run tests**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/scc/ -v -run TestResolverUnresolved
```

Expected: PASS — the updated `ResolveLinks` already strips unresolved markdown links to display text and logs a warning.

- [ ] **Step 3: Update the old "unknown scc left as-is" test**

The existing `TestResolverResolveLinks` has a test case `"unknown scc left as-is"` that uses a bare `scc:` reference without markdown link syntax. Since the new resolver only matches `[text](scc:...)` markdown links, bare `scc:` references will be left as-is (they don't match `mdLinkRe`). This is correct behavior — bare `scc:` references without link syntax aren't valid links.

Update the test case name to clarify:

```go
{
	name:  "bare scc reference without link syntax unchanged",
	input: "See scc:mcdm.heroes.v1/class/unknown for details.",
	want:  "See scc:mcdm.heroes.v1/class/unknown for details.",
},
```

Also update the `"inline scc link"` and `"multiple links"` test cases. These use bare `scc:` references too. With the new regex that only matches `[text](scc:...)`, bare references won't be resolved. Update them to use markdown link syntax:

```go
{
	name:  "markdown link resolved",
	input: "See [Gouge](scc:mcdm.heroes.v1/feature.ability.fury.level-1/gouge) for details.",
	want:  "See [Gouge](feature/ability/fury/level-1/gouge.md) for details.",
},
{
	name:  "multiple markdown links",
	input: "[Fury](scc:mcdm.heroes.v1/class/fury) and [dazed](scc:mcdm.heroes.v1/condition/dazed)",
	want:  "[Fury](class/fury.md) and [dazed](condition/dazed.md)",
},
```

- [ ] **Step 4: Run full resolver test suite**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/scc/ -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/scc/resolver_test.go && git commit -m "test: add unresolved link stripping tests, update bare-reference tests"
```

---

### Task 4: Update LinkedGenerator to pass LinkMode

**Files:**
- Modify: `internal/output/linked.go`
- Modify: `internal/output/linked_test.go`

- [ ] **Step 1: Update test to pass LinkMode**

In `internal/output/linked_test.go`, update the `LinkedGenerator` struct initialization in `TestLinkedGenerator_WriteSection` to include a `LinkMode` field, and update the `ResolveLinks` call expectation.

First, add the `scc` import alias if needed. The test file already imports `scc`.

The test doesn't call `ResolveLinks` directly — it calls `gen.WriteSection()` which calls it internally. So the test itself doesn't need to change its call pattern, but the `LinkedGenerator` struct needs a `LinkMode` field.

Update the struct initialization in all test functions from:

```go
gen := &LinkedGenerator{
	BaseDir:  dir,
	Resolver: resolver,
}
```

to:

```go
gen := &LinkedGenerator{
	BaseDir:  dir,
	Resolver: resolver,
	LinkMode: scc.LinkAll,
}
```

Do this for `TestLinkedGenerator_WriteSection`, `TestLinkedGenerator_NilAndEmpty`, and `TestLinkedGenerator_UnresolvedLinks`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/output/ -v -run TestLinkedGenerator
```

Expected: compilation error — `LinkedGenerator` doesn't have a `LinkMode` field yet.

- [ ] **Step 3: Add LinkMode field to LinkedGenerator**

In `internal/output/linked.go`, update the struct and `WriteSection` method:

```go
type LinkedGenerator struct {
	BaseDir  string
	Resolver *scc.Resolver
	LinkMode scc.LinkMode
}
```

Update the `WriteSection` method to pass the mode:

```go
resolved := &content.ParsedContent{
	Frontmatter: parsed.Frontmatter,
	Body:        g.Resolver.ResolveLinks(parsed.Body, sccCode, g.LinkMode),
	TypePath:    parsed.TypePath,
	ItemID:      parsed.ItemID,
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/output/ -v -run TestLinkedGenerator
```

Expected: all pass.

- [ ] **Step 5: Update the UnresolvedLinks test expectation**

The existing `TestLinkedGenerator_UnresolvedLinks` test expects unresolved `scc:` links to remain as-is in the output. With the new behavior, unresolved markdown-syntax links are stripped to display text. Update the assertion:

In `internal/output/linked_test.go`, in `TestLinkedGenerator_UnresolvedLinks`, change:

```go
// Unresolved link should remain as-is
if !strings.Contains(string(data), "scc:mcdm.heroes.v1/feature.ability.fury.level-1/unknown") {
	t.Error("expected unresolved scc: link to remain unchanged")
}
```

to:

```go
// Unresolved markdown link should be stripped to display text
if strings.Contains(string(data), "scc:") {
	t.Error("expected unresolved scc: link to be stripped")
}
if !strings.Contains(string(data), "See Unknown link.") {
	t.Error("expected display text to remain after stripping unresolved link")
}
```

- [ ] **Step 6: Run tests and verify**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/output/ -v -run TestLinkedGenerator
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/output/linked.go internal/output/linked_test.go && git commit -m "feat: pass LinkMode through LinkedGenerator"
```

---

### Task 5: Update DSELinkedGenerator to pass LinkMode

**Files:**
- Modify: `internal/output/dse_linked.go`
- Modify: `internal/output/dse_linked_test.go`

- [ ] **Step 1: Add LinkMode field to DSELinkedGenerator**

In `internal/output/dse_linked.go`, update the struct:

```go
type DSELinkedGenerator struct {
	BaseDir  string
	Resolver *scc.Resolver
	LinkMode scc.LinkMode
}
```

Update the `WriteSection` call:

```go
Body:        g.Resolver.ResolveLinks(parsed.Body, sccCode, g.LinkMode),
```

- [ ] **Step 2: Update tests**

In `internal/output/dse_linked_test.go`, update all `DSELinkedGenerator` initializations to include `LinkMode: scc.LinkAll`:

```go
gen := &DSELinkedGenerator{
	BaseDir:  dir,
	Resolver: resolver,
	LinkMode: scc.LinkAll,
}
```

Do this in `TestDSELinkedGenerator_WriteSection_Ability`, `TestDSELinkedGenerator_WriteSection_Condition`, and `TestDSELinkedGenerator_NilAndEmpty`.

- [ ] **Step 3: Run tests**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./internal/output/ -v -run TestDSELinkedGenerator
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/output/dse_linked.go internal/output/dse_linked_test.go && git commit -m "feat: pass LinkMode through DSELinkedGenerator"
```

---

### Task 6: Wire LinkMode into pipeline config and generator construction

**Files:**
- Modify: `internal/pipeline/config.go`
- Modify: `internal/pipeline/pipeline.go`

- [ ] **Step 1: Check the current config structure**

Read `internal/pipeline/config.go` to find the `VariantsConfig` struct where `Linked` is defined.

- [ ] **Step 2: Add LinkMode to the pipeline config**

In `internal/pipeline/config.go`, add a `LinkMode` field to the `OutputConfig` struct:

```go
type OutputConfig struct {
	BaseDir   string         `yaml:"base_dir"`
	Formats   []string       `yaml:"formats"`
	Variants  VariantsConfig `yaml:"variants"`
	LinkMode  string         `yaml:"link_mode"` // "all", "first", "none" (default: "all")
	// ... rest of existing fields
}
```

Add a helper method to parse the string into the enum:

```go
func (o *OutputConfig) ParseLinkMode() scc.LinkMode {
	switch strings.ToLower(o.LinkMode) {
	case "first":
		return scc.LinkFirst
	case "none":
		return scc.LinkNone
	default:
		return scc.LinkAll
	}
}
```

Add `"strings"` and the `scc` package to the imports.

- [ ] **Step 3: Update buildGenerators to pass LinkMode**

In `internal/pipeline/pipeline.go`, in the `buildGenerators` function, update the linked generator construction:

```go
if cfg.Output.Variants.Linked {
	generators = append(generators, &output.LinkedGenerator{
		BaseDir:  filepath.Join(baseDir, "md-linked"),
		Resolver: resolver,
		LinkMode: cfg.Output.ParseLinkMode(),
	})
}
```

And the DSE-linked generator:

```go
if cfg.Output.Variants.DSELinked {
	generators = append(generators, &output.DSELinkedGenerator{
		BaseDir:  filepath.Join(baseDir, "md-dse-linked"),
		Resolver: resolver,
		LinkMode: cfg.Output.ParseLinkMode(),
	})
}
```

- [ ] **Step 4: Build to verify compilation**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go build ./...
```

Expected: compiles successfully.

- [ ] **Step 5: Run full test suite**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./... -race
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/pipeline/config.go internal/pipeline/pipeline.go && git commit -m "feat: wire LinkMode from pipeline config to generators"
```

---

### Task 7: Add --link-mode CLI flag to gen command

**Files:**
- Modify: `internal/cli/gen.go`

- [ ] **Step 1: Add the flag**

In `internal/cli/gen.go`, add to the `init()` function:

```go
genCmd.Flags().String("link-mode", "", "link density mode: all, first, none (default: all)")
```

- [ ] **Step 2: Apply the flag override in runGen**

In `runGen`, after the existing CLI overrides, add:

```go
if linkMode, _ := cmd.Flags().GetString("link-mode"); linkMode != "" {
	cfg.Output.LinkMode = linkMode
}
```

- [ ] **Step 3: Add the flag display in the output**

After the existing variant print lines, add:

```go
if cfg.Output.LinkMode != "" {
	fmt.Printf("LinkMode: %s\n", cfg.Output.LinkMode)
}
```

- [ ] **Step 4: Build and test**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go build ./... && devbox run -- go test ./... -race
```

Expected: compiles, all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add internal/cli/gen.go && git commit -m "feat: add --link-mode CLI flag to gen command"
```

---

### Task 8: Migrate legacy scc: links in source document

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (line 98)

- [ ] **Step 1: Replace the 2 legacy colon-format links**

On line 98 of `input/heroes/Draw Steel Heroes.md`, replace:

```
[Ancestries](scc:mcdm.heroes.v1:chapter:ancestries)
```

with:

```
[Ancestries](scc:mcdm.heroes.v1/chapter/ancestries)
```

And replace:

```
[Classes](scc:mcdm.heroes.v1:chapter:classes)
```

with:

```
[Classes](scc:mcdm.heroes.v1/chapter/classes)
```

- [ ] **Step 2: Verify no other legacy links remain**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -n "scc:[a-zA-Z0-9._-]*:" input/heroes/Draw\ Steel\ Heroes.md
```

Expected: no output (no remaining colon-separated scc links).

- [ ] **Step 3: Verify the new links match registry codes**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -o "scc:[a-zA-Z0-9._/-]*" input/heroes/Draw\ Steel\ Heroes.md
```

Expected output:

```
scc:mcdm.heroes.v1/chapter/ancestries
scc:mcdm.heroes.v1/chapter/classes
```

Verify these exist in `classification.json`:

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && jq '.codes[]' classification.json | grep -E "chapter/(ancestries|classes)"
```

Expected: both codes found.

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "fix: migrate legacy scc: links to slash format"
```

---

### Task 9: Integration test — run the full pipeline

- [ ] **Step 1: Run the pipeline with default mode (all)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml
```

Expected: pipeline completes without errors. Check that the linked output has resolved links:

```bash
grep -r "\[.*\](.*\.md)" ../data/data-rules/en/md-linked/ | head -5
```

- [ ] **Step 2: Run the pipeline with --link-mode=first**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml --link-mode=first
```

Expected: pipeline completes. Spot-check a file that would have duplicate links to verify only the first is linked.

- [ ] **Step 3: Run the pipeline with --link-mode=none**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml --link-mode=none
```

Expected: pipeline completes. Verify linked output has no markdown links from SCC codes:

```bash
grep -r "scc:" ../data/data-rules/en/md-linked/ | head -5
```

Expected: no output (all scc: links stripped).

- [ ] **Step 4: Reset to default mode**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml
```

Re-run with default to restore normal output.

- [ ] **Step 5: Run full test suite one final time**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./... -race -cover
```

Expected: all tests pass, coverage reported.

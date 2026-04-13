# Hierarchical Context Stack

## Overview

The context stack is a core data structure used during AST walking. It tracks annotation metadata at each heading depth, enabling content parsers to look up ancestor metadata without knowing their position in the document.

## How It Works

The stack is an array indexed by heading level (H1=1 through H6=6), plus a document-level slot for frontmatter metadata.

### Push

When the walker encounters an annotated heading at level N:
1. Clear all stack entries from level N through 6 (pop deeper context)
2. Set stack[N] to the annotation metadata

### Lookup

When a content parser needs ancestor metadata (e.g., "what class am I in?"):
1. Walk from the current level upward to level 1, then document level
2. Return the first match for the requested key

### Example Walkthrough

Given this document:

```markdown
---
book: mcdm.heroes.v1
---

<!-- @type: chapter | @id: classes -->
# Classes

<!-- @type: class | @id: fury -->
## Fury

<!-- @type: feature-group | @level: 1 -->
### 1st-Level Features

<!-- @type: ability | @id: gouge | @cost: 3 Ferocity -->
#### Gouge

...ability content...

<!-- @type: ability | @id: blood-for-blood | @cost: 5 Ferocity -->
#### Blood for Blood!

...ability content...

<!-- @type: feature-group | @level: 2 -->
### 2nd-Level Features

<!-- @type: ability | @id: savage-rush | @cost: 5 Ferocity -->
#### Savage Rush

...ability content...

<!-- @type: class | @id: shadow -->
## Shadow

<!-- @type: feature-group | @level: 1 -->
### 1st-Level Features

<!-- @type: ability | @id: disengage | @subtype: signature -->
#### Disengage

...ability content...
```

The stack evolves as follows:

**At `# Classes` (H1):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2-6: (empty)
```

**At `## Fury` (H2):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: fury}           ← pushed
H3-6: (empty)
```

**At `### 1st-Level Features` (H3):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: fury}
H3:   {type: feature-group, level: 1}   ← pushed
H4-6: (empty)
```

**At `#### Gouge` (H4):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: fury}
H3:   {type: feature-group, level: 1}
H4:   {type: ability, id: gouge, cost: 3 Ferocity}  ← pushed
H5-6: (empty)
```

The AbilityParser for Gouge calls:
- `ctx.Lookup("class")` → walks H4→H3→H2, finds `fury` at H2
- `ctx.Lookup("level")` → walks H4→H3, finds `1` at H3
- `ctx.Lookup("book")` → walks H4→H3→H2→H1→Doc, finds `mcdm.heroes.v1` at Doc

**At `#### Blood for Blood!` (H4):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: fury}
H3:   {type: feature-group, level: 1}
H4:   {type: ability, id: blood-for-blood, cost: 5 Ferocity}  ← replaced (same level)
H5-6: (empty)
```

**At `### 2nd-Level Features` (H3):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: fury}
H3:   {type: feature-group, level: 2}   ← replaced (same level)
H4-6: (empty)                           ← cleared (deeper levels wiped)
```

Now any H4 ability under this H3 will see `level: 2` instead of `level: 1`.

**At `## Shadow` (H2):**
```
Doc:  {book: mcdm.heroes.v1}
H1:   {type: chapter, id: classes}
H2:   {type: class, id: shadow}         ← replaced (same level)
H3-6: (empty)                           ← cleared (deeper levels wiped)
```

All context below H2 is wiped. The Fury class context is gone. Any abilities under Shadow will now see `class: shadow`.

## Go Implementation Sketch

```go
package parser

// Metadata holds key-value pairs from an annotation
type Metadata map[string]string

// ContextStack tracks annotation metadata by heading depth
type ContextStack struct {
    document Metadata   // from document frontmatter
    levels   [7]Metadata // index 1-6 for H1-H6, index 0 unused
}

// NewContextStack creates a stack with document-level metadata
func NewContextStack(docMeta Metadata) *ContextStack {
    return &ContextStack{document: docMeta}
}

// Push sets metadata at a heading level, clearing all deeper levels
func (s *ContextStack) Push(headingLevel int, meta Metadata) {
    if headingLevel < 1 || headingLevel > 6 {
        return
    }
    // Clear this level and everything below it
    for i := headingLevel; i <= 6; i++ {
        s.levels[i] = nil
    }
    s.levels[headingLevel] = meta
}

// Lookup searches for a key from the given level upward through
// all ancestor levels and finally the document metadata.
// Returns the value and the level where it was found (-1 for document).
func (s *ContextStack) Lookup(fromLevel int, key string) (string, bool) {
    // Search from current level upward
    for i := fromLevel; i >= 1; i-- {
        if s.levels[i] != nil {
            if val, ok := s.levels[i][key]; ok {
                return val, true
            }
        }
    }
    // Fall back to document-level metadata
    if val, ok := s.document[key]; ok {
        return val, true
    }
    return "", false
}

// AncestorsOfType returns all ancestor metadata entries that have
// the given @type value, from shallowest to deepest.
// Useful for building the full type path for SCC classification.
func (s *ContextStack) AncestorsOfType(fromLevel int) []Metadata {
    var ancestors []Metadata
    for i := 1; i < fromLevel; i++ {
        if s.levels[i] != nil {
            ancestors = append(ancestors, s.levels[i])
        }
    }
    return ancestors
}

// Current returns the metadata at the given heading level
func (s *ContextStack) Current(headingLevel int) Metadata {
    if headingLevel < 1 || headingLevel > 6 {
        return nil
    }
    return s.levels[headingLevel]
}

// Document returns the document-level metadata
func (s *ContextStack) Document() Metadata {
    return s.document
}
```

## SCC Derivation from Context Stack

The SCC classifier uses the context stack to build classification codes:

```
Source:  ctx.Document()["book"]              → "mcdm.heroes.v1"
Type:   derived from ancestor @type chain   → "feature.ability.fury.level-1"
Item:   ctx.Current(level)["id"]            → "gouge"
```

The type derivation walks ancestors and maps `@type` values to SCC type components:

| Ancestor @type | Contributes to type path |
|---------------|-------------------------|
| `ability` | `feature`, `ability` (base type components) |
| `class` with id `fury` | `fury` (class context) |
| `feature-group` with level `1` | `level-1` (level context) |

The content parser builds the TypePath array, which is joined with `.` to form the SCC type component. Examples:
- `["feature", "ability", "fury", "level-1"]` → `feature.ability.fury.level-1`
- `["feature", "trait", "fury", "level-1"]` → `feature.trait.fury.level-1`
- `["feature", "trait", "fury", "level-1", "boren"]` → `feature.trait.fury.level-1.boren`
- `["chapter"]` → `chapter`
- `["class"]` → `class`
- `["kit"]` → `kit`

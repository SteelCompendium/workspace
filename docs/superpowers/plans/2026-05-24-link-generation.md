# Link Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the reusable artifacts (reference table + linking guide) and validate the linking workflow on the first chapter, so the remaining 20 chapters can be linked following the established process.

**Architecture:** A Python script generates the reference table from `classification.json`. A hand-authored linking guide defines rules, the progress matrix, and step-by-step instructions. The first chapter (Introduction) is linked as a worked example to validate the process. Remaining chapters follow the same guide.

**Tech Stack:** Python (reference table generator), markdown (guide + reference table), `devbox run --` for tooling.

**Spec:** `docs/superpowers/specs/2026-05-24-link-generation-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `steel-etl/scripts/gen_linking_reference.py` | Create | Reads `classification.json`, outputs reference table markdown |
| `steel-etl/docs/linking-reference.md` | Create (generated) | Display name / variants / SCC code tables organized by type |
| `steel-etl/docs/linking-guide.md` | Create | Linking rules, uncertainty markers, workflow instructions, progress matrix |
| `steel-etl/input/heroes/Draw Steel Heroes.md` | Modify | Strip pre-existing links, then add scc: links chapter by chapter |

---

### Task 1: Write the reference table generator script

**Files:**
- Create: `steel-etl/scripts/gen_linking_reference.py`

- [ ] **Step 1: Create the script**

Create `steel-etl/scripts/gen_linking_reference.py`:

```python
#!/usr/bin/env python3
"""Generate linking-reference.md from classification.json.

Reads the SCC registry and outputs a markdown file with display names,
plural variants, and SCC codes organized by type category.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path


IRREGULAR_PLURALS = {
    "dwarf": "dwarves",
    "elf": "elves",
    "high-elf": "high elves",
    "wode-elf": "wode elves",
    "fury": "furies",
    "memonek": "memoneks",
}

# Types to include in the reference table (skip feature.* for now)
LINKABLE_TYPES = [
    "class",
    "ancestry",
    "career",
    "kit",
    "perk",
    "complication",
    "title",
    "treasure",
    "chapter",
]


def slug_to_display(slug: str) -> str:
    """Convert a kebab-case slug to a display name.

    Examples:
        dragon-knight -> Dragon Knight
        mages-apprentice -> Mage's Apprentice
        watch-officer -> Watch Officer
    """
    # Special case: mages-apprentice -> Mage's Apprentice
    slug = slug.replace("mages-apprentice", "mage's apprentice")
    return slug.replace("-", " ").title()


def make_plural(slug: str, display: str) -> str:
    """Generate the plural form of a display name."""
    if slug in IRREGULAR_PLURALS:
        return slug_to_display(IRREGULAR_PLURALS[slug])

    low = display.lower()
    if low.endswith("s") or low.endswith("x") or low.endswith("sh") or low.endswith("ch"):
        return display + "es"
    if low.endswith("y") and low[-2] not in "aeiou":
        return display[:-1] + "ies"
    return display + "s"


def parse_code(code: str) -> tuple[str, str]:
    """Extract (type, item_id) from an SCC code.

    Examples:
        mcdm.heroes.v1/class/fury -> (class, fury)
        mcdm.heroes.v1/career/criminal -> (career, criminal)
    """
    parts = code.split("/")
    if len(parts) < 3:
        return ("", "")
    type_part = parts[1]
    item_id = parts[2]
    return (type_part, item_id)


def main():
    registry_path = Path(__file__).parent.parent / "classification.json"
    output_path = Path(__file__).parent.parent / "docs" / "linking-reference.md"

    if not registry_path.exists():
        print(f"Error: {registry_path} not found", file=sys.stderr)
        sys.exit(1)

    with open(registry_path) as f:
        registry = json.load(f)

    # Group codes by type
    by_type = defaultdict(list)
    for code in registry["codes"]:
        type_name, item_id = parse_code(code)
        if type_name in LINKABLE_TYPES:
            by_type[type_name].append((item_id, code))

    # Generate markdown
    lines = [
        "# Linking Reference Table",
        "",
        "Generated from `classification.json`. Used by AI sessions to add scc: links",
        "to the input document. See `linking-guide.md` for rules and workflow.",
        "",
        f"**Total linkable terms:** {sum(len(v) for v in by_type.values())}",
        "",
    ]

    for type_name in LINKABLE_TYPES:
        entries = by_type.get(type_name, [])
        if not entries:
            continue

        entries.sort(key=lambda x: x[0])

        lines.append(f"## {type_name.title()}s ({len(entries)} terms)")
        lines.append("")
        lines.append("| Display Name | Variants | SCC Code |")
        lines.append("|-------------|----------|----------|")

        for item_id, scc_code in entries:
            display = slug_to_display(item_id)
            plural = make_plural(item_id, display)
            lines.append(f"| {display} | {plural.lower()} | `{scc_code}` |")

        lines.append("")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n")
    print(f"Written {output_path} ({sum(len(v) for v in by_type.values())} terms)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script**

```bash
devbox run -- bash -c 'cd steel-etl && python3 scripts/gen_linking_reference.py'
```

Expected: `Written steel-etl/docs/linking-reference.md (312 terms)`

- [ ] **Step 3: Review the output**

```bash
head -40 /home/vexa/code/steel_compendium/workspace/steel-etl/docs/linking-reference.md
```

Verify: tables are formatted correctly, display names look right (e.g., "Dragon Knight" not "Dragon-Knight"), plurals are sensible (e.g., "dwarves" not "dwarfs").

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add scripts/gen_linking_reference.py docs/linking-reference.md && git commit -m "feat: add reference table generator and initial linking-reference.md"
```

---

### Task 2: Write the linking guide

**Files:**
- Create: `steel-etl/docs/linking-guide.md`

- [ ] **Step 1: Create the linking guide**

Create `steel-etl/docs/linking-guide.md`:

```markdown
# Linking Guide

Instructions for adding scc: cross-reference links to the input document
(`input/heroes/Draw Steel Heroes.md`). Designed to be picked up by any AI
session and followed step by step.

## Reference

- **Reference table:** `docs/linking-reference.md` — all linkable terms with display names, variants, and SCC codes
- **Link format:** `[Display Text](scc:mcdm.heroes.v1/type/id)`
- **Input document:** `input/heroes/Draw Steel Heroes.md`

## Linking Rules

### Link when

- The term refers to a game mechanic (a class, career, ancestry, kit, condition, etc.)
- Link ALL instances of the term — density filtering is handled by the pipeline at build time
- Bolded terms that reference game mechanics (e.g., glossary entries: `**Criminal:** a career choice...` should become `**[Criminal](scc:mcdm.heroes.v1/career/criminal):** a career choice...`)
- Terms inside nested child sections of their own parent definition (e.g., "Fury" mentioned in a Fury ability description — when extracted, the ability page needs a link back to its class)

### Don't link when

- The term is used as ordinary English, not referencing the game mechanic ("fighting criminals" ≠ the Criminal career)
- The term appears in its own section heading (`## Fury` does not link to itself)
- The text is inside an annotation comment (`<!-- @type: ... -->`)

### Case and variants

- Match case-insensitively: "fury", "Fury", and "FURY" all match
- Handle plurals: "criminals" should link with display text "criminals" to the Criminal career SCC code
- Handle possessives: "Fury's" should link "Fury's" to the Fury class SCC code (include the possessive in the display text)
- Use the reference table for known plural forms; use judgment for unlisted variants

### Pre-existing links

- **First pass (current):** Strip ALL pre-existing links before adding scc: links. Both old `scc:` links and PDF-origin links are stale. Replace `[text](url)` with just `text` for non-scc links, and remove scc: links entirely before re-linking.
- **Future passes:** When re-running after a PDF update, preserve existing `scc:` links and only add new ones.

### Uncertainty marker

When unsure whether a term is a game reference or flavor text:

```
<!-- REVIEW: is this a game reference? -->[Criminal](scc:mcdm.heroes.v1/career/criminal)<!-- /REVIEW -->
```

Grep for flagged cases: `grep -n "<!-- REVIEW:" input/heroes/Draw\ Steel\ Heroes.md`

## Workflow

### For each chapter

1. Find the chapter in the progress matrix below
2. Find the next incomplete type column for that chapter
3. Read the chapter text (between its `<!-- @type: chapter -->` marker and the next chapter marker)
4. If the "Strip Links" column is not done for this chapter, strip all pre-existing links first
5. Using the reference table for the current type, add scc: links to all game mechanic references
6. Use `<!-- REVIEW: -->` markers for uncertain cases
7. Update the progress matrix cell to `done`
8. Commit: `git commit -m "link: add {type} links to {chapter} chapter"`

### Validation

After completing all passes, run the pipeline and check for warnings:

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep WARN
```

Warnings indicate unresolved SCC codes (typos or missing registry entries).

## Progress Matrix

| Chapter | Lines | Strip Links | Classes | Ancestries | Careers | Kits | Perks | Complications | Titles | Treasures | Chapters |
|---------|-------|------------|---------|-----------|---------|------|-------|--------------|--------|-----------|----------|
| Introduction | 7-589 | - | - | - | - | - | - | - | - | - | - |
| The Basics | 590-1055 | - | - | - | - | - | - | - | - | - | - |
| Making a Hero | 1056-1263 | - | - | - | - | - | - | - | - | - | - |
| Ancestries | 1264-3199 | - | - | - | - | - | - | - | - | - | - |
| Background | 3200-3206 | - | - | - | - | - | - | - | - | - | - |
| Cultures | 3207-3493 | - | - | - | - | - | - | - | - | - | - |
| Careers | 3494-4065 | - | - | - | - | - | - | - | - | - | - |
| Classes | 4066-17606 | - | - | - | - | - | - | - | - | - | - |
| Kits | 17607-18580 | - | - | - | - | - | - | - | - | - | - |
| Perks | 18581-18946 | - | - | - | - | - | - | - | - | - | - |
| Complications | 18947-20167 | - | - | - | - | - | - | - | - | - | - |
| Tests | 20168-20408 | - | - | - | - | - | - | - | - | - | - |
| Skills | 20409-20856 | - | - | - | - | - | - | - | - | - | - |
| Combat | 20857-21636 | - | - | - | - | - | - | - | - | - | - |
| Negotiation | 21637-22187 | - | - | - | - | - | - | - | - | - | - |
| Downtime Projects | 22188-23215 | - | - | - | - | - | - | - | - | - | - |
| Rewards | 23216-23220 | - | - | - | - | - | - | - | - | - | - |
| Treasures | 23221-25258 | - | - | - | - | - | - | - | - | - | - |
| Titles | 25259-26339 | - | - | - | - | - | - | - | - | - | - |
| Gods and Religion | 26340-27294 | - | - | - | - | - | - | - | - | - | - |
| For the Director | 27295-28721 | - | - | - | - | - | - | - | - | - | - |
```

- [ ] **Step 2: Verify the line ranges are correct**

```bash
wc -l /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

Expected: ~28721 lines. The line ranges come from the chapter marker positions found via `grep -n '<!-- @type: chapter'`.

- [ ] **Step 3: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add docs/linking-guide.md && git commit -m "docs: add linking guide with rules, workflow, and progress matrix"
```

---

### Task 3: Strip all pre-existing links from the input document

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md`

- [ ] **Step 1: Count pre-existing links**

```bash
grep -cP '\[([^\]]+)\]\(([^)]+)\)' /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

Note the count for comparison after stripping.

- [ ] **Step 2: Strip all markdown links to plain text**

Use a Python one-liner to replace `[text](url)` with `text` across the entire file:

```bash
devbox run -- python3 -c "
import re, sys
from pathlib import Path

p = Path('/home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw Steel Heroes.md')
content = p.read_text()

# Strip markdown links: [text](url) -> text
stripped = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)

p.write_text(stripped)

original_count = len(re.findall(r'\[([^\]]+)\]\([^)]+\)', content))
remaining_count = len(re.findall(r'\[([^\]]+)\]\([^)]+\)', stripped))
print(f'Stripped {original_count - remaining_count} links ({remaining_count} remaining)')
"
```

Expected: all links stripped, 0 remaining.

- [ ] **Step 3: Verify no links remain**

```bash
grep -cP '\[([^\]]+)\]\(([^)]+)\)' /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

Expected: 0 (or only links inside annotation comments, which the regex shouldn't match).

- [ ] **Step 4: Verify the document still parses correctly**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | tail -5
```

Expected: pipeline completes, same section/classified counts as before.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "chore: strip all pre-existing links from input document"
```

- [ ] **Step 6: Update the progress matrix**

In `steel-etl/docs/linking-guide.md`, mark ALL rows in the "Strip Links" column as `done`.

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add docs/linking-guide.md && git commit -m "docs: mark strip-links step complete in progress matrix"
```

---

### Task 4: Link the Introduction chapter (worked example)

This task validates the full workflow on the shortest chapter (lines 7-589). All type passes are done in one go since the Introduction is primarily prose overview.

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md` (lines 7-589)
- Modify: `steel-etl/docs/linking-guide.md` (progress matrix)

- [ ] **Step 1: Read the Introduction chapter**

```bash
sed -n '7,589p' /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

- [ ] **Step 2: Link all types in the Introduction**

Read the reference table (`docs/linking-reference.md`) for all types. Scan the Introduction text for references to any game mechanic term. For each match:

- If clearly a game mechanic reference: wrap in `[Term](scc:mcdm.heroes.v1/type/id)`
- If uncertain: wrap in `<!-- REVIEW: is this a game reference? -->[Term](scc:mcdm.heroes.v1/type/id)<!-- /REVIEW -->`
- If clearly ordinary English: leave as-is

Known references likely in the Introduction:
- Class names (Fury, Shadow, Conduit, etc.) — referenced when describing what makes Draw Steel different
- Ancestry names (possibly)
- Chapter references (Ancestries, Classes — these were the 2 original links)

Apply the edits to the input document.

- [ ] **Step 3: Verify the links are well-formed**

```bash
grep -n "scc:" /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md | head -20
```

Verify: all links use the full slash-separated SCC format, no stale colon format.

- [ ] **Step 4: Check for uncertainty markers**

```bash
grep -n "<!-- REVIEW:" /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

Review and resolve any flagged cases.

- [ ] **Step 5: Run the pipeline to verify**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep WARN
```

Expected: no WARN messages (all linked SCC codes should be in the pre-seeded registry).

- [ ] **Step 6: Update the progress matrix**

In `steel-etl/docs/linking-guide.md`, mark all type columns for the Introduction row as `done` (or `N/A` for types not present in the Introduction).

- [ ] **Step 7: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Introduction chapter"
```

---

### Task 5: Link remaining chapters

Each remaining chapter follows the same process as Task 4. Work through chapters in document order, processing all types per chapter in a single pass. One commit per chapter.

The 20 remaining chapters, in order:

| # | Chapter | Lines | Approx Size |
|---|---------|-------|-------------|
| 1 | The Basics | 590-1055 | 465 lines |
| 2 | Making a Hero | 1056-1263 | 207 lines |
| 3 | Ancestries | 1264-3199 | 1,935 lines |
| 4 | Background | 3200-3206 | 6 lines |
| 5 | Cultures | 3207-3493 | 286 lines |
| 6 | Careers | 3494-4065 | 571 lines |
| 7 | Classes | 4066-17606 | 13,540 lines |
| 8 | Kits | 17607-18580 | 973 lines |
| 9 | Perks | 18581-18946 | 365 lines |
| 10 | Complications | 18947-20167 | 1,220 lines |
| 11 | Tests | 20168-20408 | 240 lines |
| 12 | Skills | 20409-20856 | 447 lines |
| 13 | Combat | 20857-21636 | 779 lines |
| 14 | Negotiation | 21637-22187 | 550 lines |
| 15 | Downtime Projects | 22188-23215 | 1,027 lines |
| 16 | Rewards | 23216-23220 | 4 lines |
| 17 | Treasures | 23221-25258 | 2,037 lines |
| 18 | Titles | 25259-26339 | 1,080 lines |
| 19 | Gods and Religion | 26340-27294 | 954 lines |
| 20 | For the Director | 27295-28721 | 1,426 lines |

**For each chapter, follow this process:**

1. Read the chapter text: `sed -n '{start},{end}p' input/heroes/Draw\ Steel\ Heroes.md`
2. Read the full reference table: `docs/linking-reference.md`
3. Apply linking rules from `docs/linking-guide.md`
4. Add scc: links for ALL types in a single pass (classes, ancestries, careers, kits, perks, complications, titles, treasures, chapters)
5. Use `<!-- REVIEW: -->` markers for uncertain cases
6. Verify: `grep -n "scc:" input/heroes/Draw\ Steel\ Heroes.md | wc -l` (count should increase)
7. Check for warnings: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep WARN`
8. Resolve any `<!-- REVIEW: -->` markers
9. Update progress matrix in `docs/linking-guide.md`
10. Commit: `git commit -m "link: add cross-reference links to {Chapter Name} chapter"`

**Note on the Classes chapter:** At 13,540 lines, this is by far the largest chapter. It should be split into sub-passes by class (Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent, Troubadour) with one commit per class section. Find class section boundaries with:

```bash
grep -n '<!-- @type: class' input/heroes/Draw\ Steel\ Heroes.md
```

---

### Task 6: Final validation

- [ ] **Step 1: Count total links added**

```bash
grep -c "scc:" /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

- [ ] **Step 2: Verify no REVIEW markers remain**

```bash
grep -c "<!-- REVIEW:" /home/vexa/code/steel_compendium/workspace/steel-etl/input/heroes/Draw\ Steel\ Heroes.md
```

Expected: 0

- [ ] **Step 3: Run full pipeline**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml' 2>&1 | grep -E "WARN|Sections|Written"
```

Expected: no WARN messages, same section/classified counts as before.

- [ ] **Step 4: Verify progress matrix is complete**

All cells in the progress matrix should be `done` or `N/A`.

- [ ] **Step 5: Final commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add docs/linking-guide.md && git commit -m "docs: mark all chapters complete in linking progress matrix"
```

# Beastheart Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the *Draw Steel: Beastheart* supplement into `steel-etl` as a new book (`mcdm.beastheart.v1`), publish it on the v2 site, and emit it in all alternate formats (json/yaml/dse) like `data-rules`.

**Architecture:** A vertical slice goes through the full chain first — salvage the marker-pdf markdown, clean + annotate the core class plus **one** companion species (Wolf) plus the fiction, then carry it through `steel-etl gen` and onto the site — to de-risk the two novel code changes (companion SCC path encoding, multi-book site ingestion) before the bulk annotation of the other 13 species. Companion species are encoded into existing SCC types via a new `@companion:` annotation that splices a `companion.<species>` segment into the type-path.

**Tech Stack:** Go 1.26 (steel-etl pipeline + site builder), annotated Markdown source, MkDocs Material (v2 site), devbox toolchain. All Go/just/node commands MUST be prefixed with `devbox run --` (tools are not on PATH).

**Design spec:** `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`

**Ground-truth PDF:** `/home/vexa/Downloads/Draw_Steel_Beastheart_v1.0.pdf` — read-only reference for cleanup. **NEVER commit this PDF to any git repo.** PDF file-page = book-page + 4.

---

## Status / Handoff (as of 2026-06-01)

**Phases 1–5: DONE & deployed.** Phase 6: ~75% done & deployed. Phase 7: not started.
All three repos (workspace, steel-etl, v2) are on `main`, clean, synced to the
SteelCompendium org. Build green, all Go tests pass. `gen --book mcdm.beastheart.v1`
→ **139 classified**. Live on the v2 site.

**Done (Phase 6):**
- All **14 companion species** (stat blocks, signature abilities, traits, level-3/6/10 advancements) — PDF-verified.
- Class **re-leveled to H1**; features: Basics, Wild Nature, Ferocity, Rampage, Heart of the Beast (+ Heart of the Beast & Feral Strike abilities).
- All **14 trinkets/leveled treasures** + **8 perks**.
- **1st-level Wild Nature subclass kit**: 4 maneuvers + 4 triggered actions.
- **2nd-Level Wild Nature features** (Stormheart, Supersniffer, This One's Yours, Watchdog) + **2nd-Level Wild Nature abilities** (8, PDF-verified power rolls).
- **Beastheart Abilities** container (H2 feature, `@level: 1`) + the **4 signature abilities** (Bodyswap, Come On!, Covering Fire, Stormrage) — PDF-verified (book p.23 / PDF p.27), at-will (`@subtype: signature`, no `@cost`), path `feature.ability.beastheart.level-1/`. Deployed live 2026-06-02.
- **All 20 Beastheart HEROIC abilities** (`@cost: N Ferocity`) — PDF-verified, deployed live 2026-06-02. Level-gated to match the book's tier-unlock structure (NOT all level-1 — the book places higher tiers under higher level-feature sections; confirmed by the level progression table):
  - 3-Ferocity (4) + 5-Ferocity (4) → `level-1` (PDF p.28)
  - 7-Ferocity (4: Death and Violence [triggered], Head to Head, Jaws of Death, Shieldbreaker) → `level-3` (PDF p.32)
  - 9-Ferocity (4: Deadshot, Dogpile, One Two Three Heave, Rip Them Apart!) → `level-5` (PDF p.34)
  - 11-Ferocity (4: Life-Drinking Wound, On the Razor's Edge, Ride or Die, Turn the World To Ash) → `level-8` (PDF p.38)
  - Structure: `### Heroic Abilities` → `#### N-Ferocity Ability` chooser → `##### / #### <ability>`.
- **All 16 Wild Nature subclass abilities** (`@subclass` + `@cost: N Ferocity`) — PDF-verified, deployed live 2026-06-02. Mirror the 2nd-level Wild Nature ability pattern (group headers `#### Nth-Level <Subclass> Abilities`):
  - **6th-Level** (8 @ 9 Ferocity) → `level-6`: Sic 'Em!, Stare Down (guardian); Soft Underbelly, Wraith Heart (prowler); Lead the Pack, Rolling Thunder (punisher); Elements Unleashed, Killing Frost (spark) — PDF p.35-36.
  - **9th-Level** (8 @ 11 Ferocity) → `level-9`: Banshee Howl, Relentless (guardian); Behold the Face of Chaos, Let's Take This Outside (prowler); Battle Frenzy, Juggernaut (punisher); For the Pack! (free triggered), Wild Hunt (spark) — PDF p.39-40.
  - **SUBCLASS NOW SURFACED (2026-06-02):** `@subclass` is read by AbilityParser + FeatureParser and carried into JSON/YAML/md-linked **metadata** (via `sdk_transform.go`). Decision (user's call): subclass is reference metadata, NOT a path segment — keeps the SCC code a stable fetch-by-id reference and avoids the un-subclassed / multi-subclass / duplication problems. `parseSubclass` emits a string for one value, `[]string` for comma-separated. All 12 WN passive features (2nd/5th/8th) tagged; the 32 WN abilities already carried it. SCC codes unchanged. To add subclass to any future content (incl. backfilling Heroes), just add `@subclass: X` to the annotation.
- **All per-level class features (levels 2–10) + Kit** (`@type: feature | @id | @level: N`) — deployed live 2026-06-02. 32 features at `feature.trait.beastheart.level-N/`: 2nd (perk, everyones-best-friend); 3rd (companion-advancement-feature); 4th (characteristic-increase, perk, rampage-improvement, skill, unleash-the-beast); 5th (i-can-take-it, melt-away, there-for-each-other, wildfire-pyre — the WN passives); 6th (perk, become-the-beast); 7th (characteristic-increase, feral-heart, rampage-improvement, skill); 8th (born-to-run, built-for-violence, nature-will-not-harm-us, reflexes-perfected, perk); 9th (avatar-of-the-green); 10th (characteristic-increase, companion-advancement-feature, final-evolution, perk, ferox, rampage-improvement, skill); + Kit (level-1). Repeated generic features (perk/skill/characteristic-increase/rampage-improvement/companion-advancement-feature) are distinguished by their level segment. Normalized H2/H3 feature headings → H4, stripped span/bold/page-image artifacts. **212 classified.**

- **Phase 6 leftovers DONE** (deployed live 2026-06-02). **Companion area restructured to avoid FullBodySource species-absorption:** `## Companion` is now the feature (`@id: companion`, body = intro + Customizing Your Companion); inserted an unannotated `## Companion Stat Blocks` H2 so the feature body stops there and the 14 species (H3) stay grouped under it; the trailing combat rules promoted to H2 features `## Companion Rules` (`@id: companion-rules`) and `## Adding and Subtracting Actions` (`@id: adding-and-subtracting-actions`). **Beasthearts and Magic Treasure** is now a feature (`@id: beasthearts-and-magic-treasure`) with Consumables/Trinkets/Leveled Items folded into its body (demoted to H5). Final artifact sweep done (stray `_page_24` image removed; user's own cleanup pass already removed most `®`/`£`/spans). **216 classified.**
  - ⚠️ **Merge-artifact fix:** the user's `beastheart-input-cleanup` branch (merged as `e944af2`) re-introduced raw duplicate power-roll tier blocks into Rolling Thunder (level-6) and Juggernaut (level-9) — removed in `e76354d`. Lesson: re-gen + spot-check after any external merge to the input doc.

**Remaining — Phase 7 only:** SCC cross-ref links, scc_api/aggregate
for beastheart (currently disabled for secondary books via `EffectiveBookConfig`),
`validate --scc-stable`. Full detail in project memory
`project_beastheart_integration.md` and in `docs/handoffs/HANDOFF.md`.

**Key facts for whoever continues:**
- Annotation pattern for abilities: `<!-- @type: ability | @id: X | @level: L | @cost: N Ferocity [| @subclass: Y] -->`, strip `(N Ferocity)` from the heading, then a 2-row table `| **keywords** | **action** |` / `| **📏 distance** | **🎯 target** |`, then `**Effect:**`/`**Spend N Ferocity:**`, power roll `**Power Roll + Stat:**` then `- **≤11:** …` / `- **12-16:** …` / `- **17+:** …`.
- Potency notation: `M < WEAK` / `M < AVERAGE` / `M < STRONG` (also `A <`, `P <`). Marker misreads Intuition "I" as "1" — fix every `+ 1 damage` that should be `+ I damage`.
- Power-roll tiers DO parse (verified): check YAML output's `tier1/2/3`, NOT JSON `metadata.tier1` (JSON nests them differently).
- `@subclass` is captured in source but NOT surfaced by the AbilityParser to frontmatter/path. Subclass→2nd-level-feature map (PDF p.26): Guardian→Watchdog, Prowler→Supersniffer, Punisher→This One's Yours, Spark→Stormheart.
- `git commit` combined with other commands in one Bash call is blocked by a hook — run commits as their own command.
- Deploy: `devbox run -- just deploy-v2` (a hook auto-commits/pushes the v2 generated docs; the recipe's own commit step then says "nothing to commit"). After deploy, bump the workspace gitlinks (`git add steel-etl v2 && git commit && git push`).

---

## File Structure

| File | Create/Modify | Responsibility |
|------|---------------|----------------|
| `steel-etl/input/beastheart/Draw Steel Beastheart.md` | Create (salvage) → edit | Annotated source of truth for the book |
| `steel-etl/pipeline.yaml` | Modify | Register the `mcdm.beastheart.v1` book + output dir |
| `steel-etl/internal/content/ability.go` | Modify | Splice `companion.<species>` into ability type-path |
| `steel-etl/internal/content/feature.go` | Modify | Splice `companion.<species>` into trait/feature-group type-path |
| `steel-etl/internal/content/ability_test.go` | Create/Modify | Tests for companion ability paths |
| `steel-etl/internal/content/content_test.go` | Modify | Tests for companion feature/feature-group paths |
| `steel-etl/internal/site/config.go` | Modify | Add `SourceDirs []string` config field |
| `steel-etl/internal/site/build.go` | Modify | Ingest multiple source dirs; track each entry's source |
| `steel-etl/internal/site/build_test.go` | Modify | Tests for multi-source ingestion |
| `steel-etl/internal/site/config_test.go` | Create/Modify | Tests for SourceDirs back-compat |
| `v2/site.yaml` | Modify | Add beastheart md-linked dir to the source list |
| `data/data-beastheart/` | Generated | Beastheart structured output (do not hand-edit) |

---

## Phase 1: Salvage

The `origin/beastheart` branch is 80 commits behind `main` and carries one useful file plus stray committed `docs/` output. We take only the markdown onto a fresh branch.

### Task 1.1: Create working branch and salvage the markdown

**Files:**
- Create: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Confirm you are on the integration branch in the workspace repo**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
git branch --show-current
```
Expected: `beastheart-integration` (created during brainstorming). If not, run `git checkout beastheart-integration`.

- [ ] **Step 2: Create the steel-etl working branch and salvage only the markdown**

The markdown lives on `origin/beastheart` in the `steel-etl` repo. Bring just that one file onto a fresh branch cut from steel-etl's current `main`.
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git fetch origin
git checkout -b beastheart-integration main
git checkout origin/beastheart -- "input/beastheart/Draw Steel Beastheart.md"
```

- [ ] **Step 3: Verify the file landed and nothing else came with it**

Run:
```bash
git status --short
```
Expected: exactly one new file staged — `input/beastheart/Draw Steel Beastheart.md`. No `docs/` files. Confirm line count:
```bash
wc -l "input/beastheart/Draw Steel Beastheart.md"
```
Expected: `3049`.

- [ ] **Step 4: Commit the raw salvage**

```bash
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "chore: salvage raw beastheart marker-pdf markdown"
```

---

## Phase 2: Slice cleanup (class + Wolf + fiction)

Clean ONLY the sections needed for the vertical slice, verifying every change against the PDF. Leave the other 12 species raw for now (they get cleaned in Phase 6). Read the PDF with the Read tool, pages as needed.

**Target sub-sections for the slice:**
- Fiction: "THE BEASTHEART & THE FAERIES" (source L107–378)
- Class basics + Wild Nature + Companion rules + Heart of the Beast + Ferocity + Rampage (L379–466, L1120–1231)
- **Wolf** species only (L1081–1119)
- Strip: credits (L1–82), Table of Contents (L83–106), Creator License (L3025–end)

### Task 2.1: Add document frontmatter and strip non-content

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Add YAML frontmatter at the very top of the file**

Insert as the first lines of the file:
```yaml
---
book: mcdm.beastheart.v1
source: MCDM
title: Draw Steel Beastheart
---
```

- [ ] **Step 2: Delete the credits, contractors, playtesters, and Table of Contents blocks**

Remove the `## CREDITS` through the end of `# Table of Contents` (original L1–106). Keep the `# Draw Steel` H1 only if you want a book title heading; otherwise remove it (the frontmatter `title` drives output). Recommended: remove it — the per-section parsers do not need a book-level H1.

- [ ] **Step 3: Delete the Creator License block at the end**

Remove `# Draw Steel` / `## DRAW STEEL CREATOR LICENSE` through end of file (original L3025–end).

- [ ] **Step 4: Verify the file still parses as markdown and commit**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && head -8 "input/beastheart/Draw Steel Beastheart.md"'
```
Expected: the YAML frontmatter block.
```bash
cd steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "chore: add beastheart frontmatter, strip credits/toc/license"
```

### Task 2.2: Clean the fiction chapter

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Read the PDF pages for the fiction (PDF pages ~1–3) to confirm text fidelity**

Use the Read tool on `/home/vexa/Downloads/Draw_Steel_Beastheart_v1.0.pdf` pages `1-3`. Compare against source L107–378.

- [ ] **Step 2: Normalize the fiction heading and remove art glyphs**

Set the fiction's top heading to a single H1/H2 the chapter parser expects, strip the stray `£`/`®` art markers and the leading art-icon glyph on the first paragraph, and remove any `<span id="page-N-0">` anchors. Keep the prose verbatim otherwise.

- [ ] **Step 3: Verify no stray glyphs remain in the fiction range**

Run (adjust line range to the current fiction span):
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
grep -nE '£|®|<span id=' "input/beastheart/Draw Steel Beastheart.md" | head
```
Expected: no matches within the fiction section.

- [ ] **Step 4: Commit**

```bash
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "chore: clean beastheart fiction chapter"
```

### Task 2.3: Clean the core class + Wolf sections

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Read the PDF pages covering the class basics and the Wolf entry**

Use the Read tool on the relevant PDF pages (class basics ~pp.4–6; companions list — find the Wolf page). Confirm: header levels, the Wolf signature ability's action-type icon, its base trait, and the Level 3/6/10 advancement names.

- [ ] **Step 2: Normalize header levels into the canonical nesting for the slice**

Marker-pdf emitted peers at random depths. Restructure the slice content to this nesting (do NOT add annotations yet — that is Phase 3):
```
## The Beastheart Class
### Basics
### Wild Nature           (will become @type: feature, the subclass anchor text)
### Companion             (companion rules)
### Heart of the Beast
### Ferocity
### Rampage
### Wolf                  (species container)
#### Clamping Jaws        (signature ability)
#### Retriever            (base trait)
#### Level 3 Wolf Advancement Feature
##### My, What Big Teeth You Have
#### Level 6 Wolf Advancement Feature
##### Call of the Wild
#### Level 10 Wolf Advancement Feature
##### Dire Wolf
```

- [ ] **Step 3: Recover the ability-type icon for Clamping Jaws**

The raw heading was `#### t **Clamping Jaws**`. The leading `t` is a mangled action-type icon. Read the PDF to determine the real action type (main action / maneuver / triggered action) and note it — it becomes the `@action`/`@subtype` value in Phase 3. Remove the stray glyph from the heading text so the heading reads `#### Clamping Jaws`.

- [ ] **Step 4: Reflow the Clamping Jaws power-roll / ability table**

Ensure the ability's 2×2 stat table (keywords/action, distance/target) and the `**Power Roll + <Characteristic>:**` tier lines are intact markdown tables/lines (the parser in `internal/content/ability.go` extracts these). Cross-check tier values (`≤11`, `12–16`, `17+`) against the PDF.

- [ ] **Step 5: Verify no stray glyphs/anchors remain in the slice range and commit**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
grep -nE '<span id=|\bl \*\*|\bt \*\*|\be \*\*|\bg \*\*|®|£' "input/beastheart/Draw Steel Beastheart.md" | head
```
Expected: no matches inside the cleaned slice range (other species still raw — that is fine).
```bash
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "chore: clean beastheart class basics and Wolf species"
```

---

## Phase 3: Slice annotation

Add `@type` annotations to the cleaned slice. Annotation syntax: an HTML comment immediately before the heading (see `steel-etl/ANNOTATION-GUIDE.md`).

### Task 3.1: Annotate the fiction and class container

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Annotate the fiction chapter**

Before the fiction's top heading:
```markdown
<!-- @type: chapter | @id: the-beastheart-and-the-faeries -->
```

- [ ] **Step 2: Annotate the class**

Before `## The Beastheart Class`:
```markdown
<!-- @type: class | @id: beastheart -->
```

- [ ] **Step 3: Annotate the core-rule features (Companion rules, Heart of the Beast, Ferocity, Rampage, Wild Nature)**

Each gets a `@type: feature` (they are non-ability class features under the beastheart class). Example before `### Ferocity`:
```markdown
<!-- @type: feature | @id: ferocity -->
```
Apply the same pattern to `Companion`, `Heart of the Beast`, `Rampage`, and `Wild Nature`.

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "feat: annotate beastheart fiction and class container"
```

### Task 3.2: Annotate the Wolf species with companion encoding

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Annotate the species container**

Before `### Wolf` — the `@companion` field is what Phase 4 splices into the SCC path; `@level: 1` provides the base level for the signature ability and base trait:
```markdown
<!-- @type: feature-group | @companion: wolf | @level: 1 -->
```

- [ ] **Step 2: Annotate the signature ability and base trait**

Before `#### Clamping Jaws` (use the action type recovered in Task 2.3 Step 3):
```markdown
<!-- @type: ability | @subtype: signature | @id: clamping-jaws -->
```
Before `#### Retriever`:
```markdown
<!-- @type: feature | @id: retriever -->
```

- [ ] **Step 3: Annotate the three advancement containers and their features**

Before `#### Level 3 Wolf Advancement Feature`:
```markdown
<!-- @type: feature-group | @level: 3 -->
```
Before `##### My, What Big Teeth You Have`:
```markdown
<!-- @type: feature | @id: my-what-big-teeth-you-have -->
```
Repeat for Level 6 (`@level: 6`, feature `Call of the Wild`) and Level 10 (`@level: 10`, feature `Dire Wolf`).

- [ ] **Step 4: Commit**

```bash
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "feat: annotate Wolf species with @companion encoding"
```

---

## Phase 4: Companion SCC path injection (code, TDD)

Make the parsers read the `@companion` context value and splice `companion.<species>` into the type-path. All annotation keys already flow into the context stack via `context.Metadata(section.Annotation)` in `internal/pipeline/collect.go`, so no pipeline change is needed.

### Task 4.1: Inject companion into ability type-path

**Files:**
- Modify: `steel-etl/internal/content/ability.go:90-103`
- Test: `steel-etl/internal/content/content_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/content_test.go`:
```go
func TestAbilityCompanionTypePath(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.beastheart.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "beastheart"})
	ctx.Push(3, context.Metadata{"type": "feature-group", "companion": "wolf", "level": "1"})

	section := &parser.Section{
		Heading:      "Clamping Jaws",
		HeadingLevel: 4,
		Annotation:   map[string]string{"type": "ability", "subtype": "signature", "id": "clamping-jaws"},
	}
	parsed, err := (&AbilityParser{}).Parse(ctx, section)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	got := scc.Classify("mcdm.beastheart.v1", parsed.TypePath, parsed.ItemID)
	want := "mcdm.beastheart.v1/feature.ability.companion.wolf.level-1/clamping-jaws"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
	if parsed.Frontmatter["companion"] != "wolf" {
		t.Errorf("companion frontmatter = %v, want wolf", parsed.Frontmatter["companion"])
	}
}
```
Ensure the test file imports `"github.com/SteelCompendium/steel-etl/internal/scc"` (add if missing).

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestAbilityCompanionTypePath -v'
```
Expected: FAIL — path is `feature.ability.beastheart.level-1/...` (no companion segment).

- [ ] **Step 3: Implement the injection in `ability.go`**

In `internal/content/ability.go`, replace the type-path build block (currently lines ~90–103) with:
```go
	// Look up companion species from context (beastheart book).
	companionID, _ := ctx.Lookup(section.HeadingLevel, "companion")
	if companionID != "" {
		fm["companion"] = companionID
	}

	// Build type path: feature.ability.{parent}.level-{N}
	// Companion abilities use feature.ability.companion.{species}.level-{N}.
	typePath := []string{"feature", "ability"}
	if companionID != "" {
		typePath = append(typePath, "companion", companionID)
	} else if parentID != "" {
		typePath = append(typePath, parentID)
	} else {
		groupID := findAncestorID(ctx, section.HeadingLevel, "feature-group")
		typePath = append(typePath, "common")
		if groupID != "" {
			typePath = append(typePath, groupID)
		}
	}
	if levelStr != "" {
		typePath = append(typePath, "level-"+levelStr)
	}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestAbilityCompanionTypePath -v'
```
Expected: PASS.

- [ ] **Step 5: Run the full content package tests (no regressions)**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test -race ./internal/content/'
```
Expected: PASS (existing heroes-path tests unaffected — no `companion` key present there).

- [ ] **Step 6: Commit**

```bash
cd steel-etl
git add internal/content/ability.go internal/content/content_test.go
git commit -m "feat: encode companion species into ability SCC path"
```

### Task 4.2: Inject companion into feature (trait) type-path

**Files:**
- Modify: `steel-etl/internal/content/feature.go:76-94`
- Test: `steel-etl/internal/content/content_test.go`

- [ ] **Step 1: Write the failing test**

Add to `content_test.go`:
```go
func TestFeatureCompanionTypePath(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.beastheart.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "beastheart"})
	ctx.Push(3, context.Metadata{"type": "feature-group", "companion": "wolf", "level": "1"})
	ctx.Push(4, context.Metadata{"type": "feature-group", "level": "3"})

	section := &parser.Section{
		Heading:      "My, What Big Teeth You Have",
		HeadingLevel: 5,
		Annotation:   map[string]string{"type": "feature", "id": "my-what-big-teeth-you-have"},
	}
	parsed, err := (&FeatureParser{}).Parse(ctx, section)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	got := scc.Classify("mcdm.beastheart.v1", parsed.TypePath, parsed.ItemID)
	want := "mcdm.beastheart.v1/feature.trait.companion.wolf.level-3/my-what-big-teeth-you-have"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureCompanionTypePath -v'
```
Expected: FAIL — path uses `beastheart` instead of `companion.wolf`.

- [ ] **Step 3: Implement the injection in `feature.go`**

In `internal/content/feature.go`, after the existing `classID`/`kitID`/`ancestryID` lookups (around line 52) add:
```go
	// Companion species (beastheart book) takes precedence over class in the path.
	companionID, _ := ctx.Lookup(section.HeadingLevel, "companion")
	if companionID != "" {
		fm["companion"] = companionID
	}
```
Then change the type-path build block (currently lines ~77–88) so the companion branch comes first:
```go
	// Build type path: feature.trait.{parent}.level-{N}[.{kit}]
	// Companion traits use feature.trait.companion.{species}.level-{N}.
	typePath := []string{"feature", "trait"}
	if companionID != "" {
		typePath = append(typePath, "companion", companionID)
	} else if classID != "" {
		typePath = append(typePath, classID)
	} else if ancestryID != "" {
		typePath = append(typePath, ancestryID)
	} else if kitID == "" {
		groupID := findAncestorID(ctx, section.HeadingLevel, "feature-group")
		typePath = append(typePath, "common")
		if groupID != "" {
			typePath = append(typePath, groupID)
		}
	}
	if levelStr != "" {
		typePath = append(typePath, "level-"+levelStr)
	}
	if kitID != "" {
		typePath = append(typePath, kitID)
	}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureCompanionTypePath -v'
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd steel-etl
git add internal/content/feature.go internal/content/content_test.go
git commit -m "feat: encode companion species into trait SCC path"
```

### Task 4.3: Classify the companion feature-group container

Give each species its own SCC code/page (`feature-group.companion/<species>`) so it has a navigable landing entity. Feature-groups are normally unclassified; only those carrying a `@companion` annotation become classified.

**Files:**
- Modify: `steel-etl/internal/content/feature.go:14-29`
- Test: `steel-etl/internal/content/content_test.go`

- [ ] **Step 1: Write the failing test**

Add to `content_test.go`:
```go
func TestFeatureGroupCompanionClassified(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{"book": "mcdm.beastheart.v1"})
	ctx.Push(2, context.Metadata{"type": "class", "id": "beastheart"})

	section := &parser.Section{
		Heading:      "Wolf",
		HeadingLevel: 3,
		Annotation:   map[string]string{"type": "feature-group", "companion": "wolf", "level": "1"},
	}
	parsed, err := (&FeatureGroupParser{}).Parse(ctx, section)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	got := scc.Classify("mcdm.beastheart.v1", parsed.TypePath, parsed.ItemID)
	want := "mcdm.beastheart.v1/feature-group.companion/wolf"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestFeatureGroupPlainUnclassified(t *testing.T) {
	ctx := context.NewContextStack(context.Metadata{})
	section := &parser.Section{
		Heading:      "1st-Level Features",
		HeadingLevel: 3,
		Annotation:   map[string]string{"type": "feature-group", "level": "1"},
	}
	parsed, err := (&FeatureGroupParser{}).Parse(ctx, section)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(parsed.TypePath) != 0 || parsed.ItemID != "" {
		t.Errorf("plain feature-group should be unclassified, got path=%v id=%q", parsed.TypePath, parsed.ItemID)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run "TestFeatureGroupCompanionClassified|TestFeatureGroupPlainUnclassified" -v'
```
Expected: `TestFeatureGroupCompanionClassified` FAILS (empty path); `TestFeatureGroupPlainUnclassified` PASSES.

- [ ] **Step 3: Implement conditional classification in `FeatureGroupParser.Parse`**

Replace the body of `FeatureGroupParser.Parse` (lines ~14–29) with:
```go
func (p *FeatureGroupParser) Parse(ctx *context.ContextStack, section *parser.Section) (*ParsedContent, error) {
	fm := map[string]any{
		"name": section.Heading,
		"type": "feature-group",
	}

	if level, ok := section.Annotation["level"]; ok {
		fm["level"] = level
	}

	result := &ParsedContent{
		Frontmatter: fm,
		Body:        section.FullBodySource(),
	}

	// Companion species containers (beastheart) are first-class: classify them
	// as feature-group.companion/{species}. Plain feature-groups stay unclassified.
	if companion, ok := section.Annotation["companion"]; ok && companion != "" {
		fm["companion"] = companion
		result.TypePath = []string{"feature-group", "companion"}
		result.ItemID = companion
	}

	return result, nil
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run "TestFeatureGroupCompanionClassified|TestFeatureGroupPlainUnclassified" -v'
```
Expected: both PASS.

- [ ] **Step 5: Run the full content + scc package tests**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test -race ./internal/content/ ./internal/scc/'
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd steel-etl
git add internal/content/feature.go internal/content/content_test.go
git commit -m "feat: classify companion feature-group containers"
```

### Task 4.4: Register the beastheart book and generate the slice

**Files:**
- Modify: `steel-etl/pipeline.yaml`

- [ ] **Step 1: Add the beastheart book entry**

In `steel-etl/pipeline.yaml`, under the `books:` list (after the monsters entry), add:
```yaml
  - book: mcdm.beastheart.v1
    input: ./input/beastheart/Draw Steel Beastheart.md
    output:
      base_dir: ../data/data-beastheart
```

- [ ] **Step 2: Run the pipeline**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml'
```
Expected: completes without error; reports writing beastheart output.

- [ ] **Step 3: Verify the companion SCC codes were produced**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
find data/data-beastheart -path '*companion*wolf*' | head -20
```
Expected: files under a `feature.ability.companion.wolf.level-1` / `feature.trait.companion.wolf.level-3` etc. path, plus a `feature-group.companion/wolf` entry. Spot-check one JSON file has `"companion": "wolf"` in its frontmatter/fields:
```bash
grep -rl '"companion"' data/data-beastheart/en/json | head
```

- [ ] **Step 4: Verify heroes output is unchanged (no collateral diffs)**

Run:
```bash
git -C /home/vexa/code/steel_compendium/workspace status --short data/data-rules | head
```
Expected: no changes to `data/data-rules` (heroes book deterministic). If there are changes, investigate before continuing.

- [ ] **Step 5: Commit the pipeline config**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add pipeline.yaml
git commit -m "feat: register mcdm.beastheart.v1 book in pipeline"
```

---

## Phase 5: Multi-source site ingestion (code, TDD)

The site builder reads a single `source_dir`. Add support for a list so beastheart's `md-linked` output is merged into the type-organized Browse tree alongside heroes.

### Task 5.1: Add `SourceDirs` to site config (back-compatible)

**Files:**
- Modify: `steel-etl/internal/site/config.go:12-39,113`
- Test: `steel-etl/internal/site/config_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/site/config_test.go` (create the file if absent, package `site`):
```go
package site

import "testing"

func TestSourceDirsBackCompat(t *testing.T) {
	// A config using only the legacy singular source_dir should expose it via SourceDirList().
	cfg := &Config{ConfigDir: "/cfg", SourceDir: "/cfg/a"}
	cfg.normalizeSources()
	got := cfg.SourceDirList()
	if len(got) != 1 || got[0] != "/cfg/a" {
		t.Fatalf("back-compat: got %v, want [/cfg/a]", got)
	}
}

func TestSourceDirsList(t *testing.T) {
	cfg := &Config{ConfigDir: "/cfg", SourceDirs: []string{"/cfg/a", "/cfg/b"}}
	cfg.normalizeSources()
	got := cfg.SourceDirList()
	if len(got) != 2 || got[0] != "/cfg/a" || got[1] != "/cfg/b" {
		t.Fatalf("list: got %v, want [/cfg/a /cfg/b]", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSourceDirs -v'
```
Expected: FAIL — `SourceDirs`, `normalizeSources`, and `SourceDirList` do not exist.

- [ ] **Step 3: Add the field and helpers in `config.go`**

In the `Config` struct (after `SourceDir`), add:
```go
	// SourceDirs lists multiple md-linked output directories to merge (multi-book).
	// If empty, the singular SourceDir is used. Resolved relative to ConfigDir.
	SourceDirs []string `yaml:"source_dirs"`
```
Add these methods to `config.go`:
```go
// normalizeSources folds the legacy singular SourceDir into SourceDirs and
// resolves every entry relative to the config directory.
func (c *Config) normalizeSources() {
	if len(c.SourceDirs) == 0 && c.SourceDir != "" {
		c.SourceDirs = []string{c.SourceDir}
	}
	for i, d := range c.SourceDirs {
		c.SourceDirs[i] = c.ResolvePath(d)
	}
}

// SourceDirList returns the resolved source directories.
func (c *Config) SourceDirList() []string {
	return c.SourceDirs
}
```
In `LoadSiteConfig`, replace the line `cfg.SourceDir = cfg.ResolvePath(cfg.SourceDir)` with a call to normalize AFTER `ConfigDir` is set:
```go
	cfg.normalizeSources()
```
(Leave `DocsDir` and `StaticContent` resolution as-is.)

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestSourceDirs -v'
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd steel-etl
git add internal/site/config.go internal/site/config_test.go
git commit -m "feat: add multi-source SourceDirs to site config"
```

### Task 5.2: Walk multiple source dirs in the builder

**Files:**
- Modify: `steel-etl/internal/site/build.go:45-48,97-117,131`
- Test: `steel-etl/internal/site/build_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/site/build_test.go`:
```go
func TestWalkSourceDirsMerges(t *testing.T) {
	a := t.TempDir()
	b := t.TempDir()
	if err := os.MkdirAll(filepath.Join(a, "class"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(b, "class"), 0755); err != nil {
		t.Fatal(err)
	}
	os.WriteFile(filepath.Join(a, "class", "fury.md"), []byte("---\nname: Fury\n---\n"), 0644)
	os.WriteFile(filepath.Join(b, "class", "beastheart.md"), []byte("---\nname: Beastheart\n---\n"), 0644)

	entries, err := walkSourceDirs([]string{a, b})
	if err != nil {
		t.Fatalf("walk: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("got %d entries, want 2", len(entries))
	}
	// Each entry must remember which source dir it came from.
	for _, e := range entries {
		if e.sourceDir != a && e.sourceDir != b {
			t.Errorf("entry %q has unexpected sourceDir %q", e.relPath, e.sourceDir)
		}
	}
}
```
Ensure `build_test.go` imports `os` and `path/filepath`.

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestWalkSourceDirsMerges -v'
```
Expected: FAIL — `walkSourceDirs` and `sourceEntry.sourceDir` do not exist.

- [ ] **Step 3: Add `sourceDir` to `sourceEntry` and the `walkSourceDirs` helper**

In `build.go`, extend the struct (lines ~97–101):
```go
// sourceEntry represents a markdown file found in a source directory.
type sourceEntry struct {
	relPath   string // relative to its source dir (e.g., "class/fury.md")
	absPath   string
	sourceDir string // the source dir this entry came from
}
```
Update `walkSourceDir` to record `sourceDir`, and add a multi-dir wrapper:
```go
func walkSourceDir(dir string) ([]sourceEntry, error) {
	var entries []sourceEntry
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || !strings.HasSuffix(path, ".md") {
			return nil
		}
		rel, _ := filepath.Rel(dir, path)
		entries = append(entries, sourceEntry{relPath: rel, absPath: path, sourceDir: dir})
		return nil
	})
	return entries, err
}

// walkSourceDirs merges entries from multiple source dirs (later dirs append).
func walkSourceDirs(dirs []string) ([]sourceEntry, error) {
	var all []sourceEntry
	for _, d := range dirs {
		entries, err := walkSourceDir(d)
		if err != nil {
			return nil, err
		}
		all = append(all, entries...)
	}
	return all, nil
}
```

- [ ] **Step 4: Use `walkSourceDirs` in `Build` and fix the group base path**

In `Build` (line ~45), replace:
```go
	entries, err := walkSourceDir(cfg.SourceDir)
```
with:
```go
	entries, err := walkSourceDirs(cfg.SourceDirList())
```
In `buildSection` (line ~131), replace the `cfg.SourceDir` argument to `applyGroups` with the entry's own source dir so group cross-referencing stays within the correct book:
```go
		destRel, parentName := applyGroups(entry.relPath, section.Groups, entry.sourceDir)
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestWalkSourceDirsMerges -v'
```
Expected: PASS.

- [ ] **Step 6: Run the full site package tests (no regressions)**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go test -race ./internal/site/'
```
Expected: PASS. If an existing test referenced `cfg.SourceDir` directly for walking, update it to set `SourceDirs` / call `normalizeSources()`.

- [ ] **Step 7: Commit**

```bash
cd steel-etl
git add internal/site/build.go internal/site/build_test.go
git commit -m "feat: merge multiple source dirs in site builder"
```

### Task 5.3: Wire beastheart into v2 site config and build the slice page

**Files:**
- Modify: `v2/site.yaml:5`

- [ ] **Step 1: Replace the singular source with a list in `v2/site.yaml`**

Change:
```yaml
source_dir: ../data/data-rules/en/md-linked
```
to:
```yaml
source_dirs:
  - ../data/data-rules/en/md-linked
  - ../data/data-beastheart/en/md-linked
```

- [ ] **Step 2: Build the site**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```
Expected: completes; reports copied files and SCC stubs.

- [ ] **Step 3: Verify the Wolf page and SCC permalink stub exist**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
find v2/docs/Browse -path '*wolf*' | head
ls v2/docs/scc | grep -i 'mcdm.beastheart' | head
```
Expected: a Wolf companion page under `Browse/` and `scc/` redirect stub directories for the beastheart codes.

- [ ] **Step 4: Build the MkDocs site to confirm it renders**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd v2 && mkdocs build 2>&1 | tail -20'
```
Expected: build succeeds (warnings about unrelated pages are acceptable; no errors referencing beastheart files).

- [ ] **Step 5: Commit the site config**

```bash
cd /home/vexa/code/steel_compendium/workspace/v2
git add site.yaml
git commit -m "feat: ingest beastheart md-linked into v2 site"
```

**🎯 De-risking milestone reached:** one species is live end-to-end. Pause for review before the bulk annotation in Phase 6.

---

## Phase 6: Replicate across remaining content

With the chain proven, clean + annotate the rest. Work one species at a time so each is independently verifiable. Apply the exact patterns from Phases 2–3.

### Task 6.1: Clean + annotate the remaining 13 companion species

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: For each species, clean then annotate, then regenerate**

Species list (source order): Basilisk, Bear, Boar, Condor, Deinonychus, Drake, Elemental Spark, Gummy Ball, Hellhound, Lightbender, Panther, Spider, Sporeling. For EACH species:
  1. Read the species' PDF page(s) for fidelity.
  2. Apply the Task 2.3 cleanup (normalize headers to the species nesting, recover the action-type icon on the signature ability, reflow tables, strip glyphs/anchors).
  3. Apply the Task 3.2 annotation (`@type: feature-group | @companion: <species> | @level: 1` on the container; signature ability; base trait(s); the three advancement containers + features). Use the `@id` slug from the heading.
  4. Note: some species have MULTIPLE base traits or extra abilities (e.g. Drake has *Elementally Attuned* + *Shared Scales*) — annotate each with its own `@type`.

- [ ] **Step 2: Regenerate and verify each species classifies**

After each species (or in batches), run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml'
find data/data-beastheart -path '*companion*' -name '*.md' | sed -E 's#.*/companion/([^/.]+).*#\1#' | sort -u
```
Expected: each cleaned species' slug appears.

- [ ] **Step 3: Commit per species (or per batch)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "feat: clean + annotate <species> companion"
```

### Task 6.2: Clean + annotate the non-companion sections

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Annotate the Wild Nature archetypes (subclasses) and their abilities**

The 4 archetypes (Guardian, Prowler, Punisher, Spark) and their leveled maneuvers / triggered actions / abilities. Model each archetype as `@type: feature` under the beastheart class (path `feature.trait.beastheart.level-1/<archetype>`); annotate each archetype ability as `@type: ability` with its `@level` and Ferocity `@cost`. Recover action-type icons against the PDF.

- [ ] **Step 2: Annotate the beastheart heroic abilities by Ferocity cost**

Signature + 3/5/7/9/11-Ferocity abilities (`@type: ability`, `@cost: N Ferocity`, `@level` from the level-features container they sit under). Set `@subtype: signature` on the signature ability.

- [ ] **Step 3: Annotate Rewards (trinkets, leveled treasures) and Perks**

Trinkets and leveled armor/weapon treasures → `@type: treasure` (match how heroes annotates treasures — check `grep -n '@type: treasure' input/heroes/"Draw Steel Heroes.md"` for field conventions, e.g. `@echelon`). Perks (Exploration/Intrigue/Interpersonal) → `@type: perk` (check `@type: perk` conventions in heroes, e.g. `@perk-group`).

- [ ] **Step 4: Regenerate, then verify annotation coverage**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --config pipeline.yaml 2>&1 | tail -30'
```
Expected: validate reports no unknown types and acceptable annotation coverage for the beastheart book. Address any "unannotated section" warnings by annotating or intentionally leaving as prose.

- [ ] **Step 5: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "feat: annotate beastheart subclasses, abilities, rewards, perks"
```

---

## Phase 7: Polish & deploy

### Task 7.1: SCC cross-reference links

**Files:**
- Modify: `steel-etl/input/beastheart/Draw Steel Beastheart.md`

- [ ] **Step 1: Add cross-reference links for linkable terms**

Following `steel-etl/docs/linking-guide.md`, add `[term](scc:...)` links for conditions, skills, movement types, etc., referenced in the beastheart text. Do NOT add links inside headings (per the linking rules).

- [ ] **Step 2: Regenerate and verify links resolve**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml'
```
Expected: no unresolved-link errors for the beastheart book.

- [ ] **Step 3: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl
git add "input/beastheart/Draw Steel Beastheart.md"
git commit -m "feat: add beastheart SCC cross-reference links"
```

### Task 7.2: Full validation and deploy

- [ ] **Step 1: Run the complete Go test suite**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- bash -c 'cd steel-etl && go test -race ./...'
```
Expected: PASS.

- [ ] **Step 2: Verify SCC stability**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml && go run ./cmd/steel-etl validate --scc-stable --config pipeline.yaml 2>&1 | tail'
```
Expected: no SCC codes changed on a second run (deterministic).

- [ ] **Step 3: Run the full deploy and eyeball the site**

Run:
```bash
cd /home/vexa/code/steel_compendium/workspace
devbox run -- just deploy-v2
```
Then spot-check in a browser: a companion page (e.g. Bear), an ability statblock, the fiction chapter under Read, and an SCC permalink redirect (`/scc/mcdm.beastheart.v1/...`).

- [ ] **Step 4: Final commit of generated v2 changes (if deploy didn't auto-commit)**

```bash
cd /home/vexa/code/steel_compendium/workspace/v2
git add -A
git commit -m "feat: publish beastheart to v2 site"
```

---

## Self-Review

**Spec coverage:**
- Book identity (separate `mcdm.beastheart.v1` + `data-beastheart`) → Task 4.4. ✅
- Companion encoding in SCC path via `@companion` → Tasks 4.1–4.3. ✅
- Reuse existing types (no new top-level type) → Tasks 4.1–4.3 reuse ability/feature/feature-group. ✅
- Content scope (keep fiction, strip credits/TOC/license) → Tasks 2.1, 2.2, 3.1. ✅
- PDF verification → Tasks 2.2, 2.3, 6.1, 6.2 read the PDF. ✅
- Alternate forms (json/yaml/dse) → automatic via Task 4.4 `gen` (existing generators). ✅
- Multi-book site ingestion → Tasks 5.1–5.3. ✅
- Vertical slice first → Phases 2–5 (Wolf), then Phase 6. ✅
- PDF never committed → stated in header; salvage (Task 1.1) only touches the markdown. ✅

**Placeholder scan:** Manual content phases (2, 3, 6, 7) describe operations on book text that cannot be pre-written verbatim, but each gives the exact annotation syntax, target structure, and a verification command. Code phases (4, 5) contain complete code. No `TODO`/`TBD` left.

**Type consistency:** `sourceEntry.sourceDir`, `walkSourceDirs`, `Config.SourceDirs`, `normalizeSources`, `SourceDirList` are defined in Task 5.1/5.2 and used consistently. `@companion` context key + `companionID` variable consistent across Tasks 4.1–4.3. SCC examples consistent with the spec table.

# Content Linking Implementation Plan — COMPLETE

> **Followed by (2026-05-29):** the [truncated-link fix](../../../steel-etl/docs/superpowers/plans/2026-05-29-truncated-link-fix.md), which corrected links this pass left truncated/mis-typed and grew the registry to 1,754 codes / 17 types / 441 linkable terms. The historical figures below (416 terms / 14 categories / 312) are preserved as a record of this plan's state and are now superseded.

> **Update 2026-05-28:** The SCC registry was expanded with 104 new codes (conditions, skills, movement, negotiation, culture). 22 flat duplicate codes were cleaned up. The linking reference table now has 416 terms across 14 categories. See the [SCC Link Audit plan](../../../.claude/plans/peppy-hopping-koala.md) for details and linking progress (7/18 chapters done for new types, 100 new links added). New types require **AI-driven disambiguation** — scripted regex is not appropriate.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `scc:` cross-reference links to all 20 remaining chapters of `input/heroes/Draw Steel Heroes.md`, covering all 416 linkable terms across 14 categories (expanded from 312/9 on 2026-05-28).

**Architecture:** Each task processes one chapter (or a group of tiny chapters). The worker reads the chapter text, consults the reference table (`docs/linking-reference.md`), and wraps every game mechanic reference in `[Display Text](scc:CODE)` markdown links. Link density filtering happens at build time — the source document gets the maximal link set. The Classes chapter (13,541 lines) is split into 10 sub-tasks (intro + 9 class sections).

**Tech Stack:** Markdown content editing, `devbox run --` for pipeline validation.

**Spec:** `steel-etl/docs/linking-guide.md` (linking rules, workflow, progress matrix)

**Prior work:** Introduction chapter (lines 7–589) is complete. The Basics chapter (lines 590–1055) has 10 existing links from prior work that should be preserved and extended.

---

## Reference Documents

Before starting any task, the worker MUST read these files:

1. **`steel-etl/docs/linking-guide.md`** — Linking rules, what to link / not link, case handling, uncertainty markers, workflow
2. **`steel-etl/docs/linking-reference.md`** — All 312 linkable terms with display names, variants, and SCC codes

## Linkable Term Types (312 total)

| Type | Count | High-frequency? | Notes |
|------|-------|-----------------|-------|
| Classes | 9 | Yes — appear in nearly every chapter | censor, conduit, elementalist, fury, null, shadow, tactician, talent, troubadour |
| Ancestries | 12 | Yes — appear in most chapters | devil, dragon knight, dwarf, hakaan, high elf, human, memonek, orc, polder, revenant, time raider, wode elf |
| Chapters | 21 | Medium — appear in cross-references | Link when the text explicitly references another chapter by name |
| Careers | 18 | Medium — dense in Careers chapter, scattered elsewhere | criminal, gladiator, soldier, sage, artisan, etc. |
| Kits | 25 | Medium — dense in Kits chapter, some in Classes | panther, mountain, shining armor, sniper, etc. |
| Perks | 47 | Low — mostly in Perks chapter | arcane trick, brawny, familiar, etc. |
| Complications | 100 | Low — mostly in Complications chapter | amnesia, antihero, exile, etc. |
| Titles | 61 | Low — mostly in Titles chapter | knight, noble, demigod, etc. |
| Treasures | 19 | Low — mostly in Treasures chapter | Leveled treasure categories |

**Now also linkable** (added to registry 2026-05-28 — see `peppy-hopping-koala.md` plan):

| Type | Count | High-frequency? | Notes |
|------|-------|-----------------|-------|
| Conditions | 9 | **Very high** — ~663 mentions | bleeding, dazed, frightened, grabbed, prone, restrained, slowed, taunted, weakened. **Disambiguation required:** mundane English vs. game condition. |
| Skills | 57 | High — in careers, cultures, class features | All 5 skill groups. **Disambiguation required:** "the Climb skill" (link) vs. "climb the wall" (don't). |
| Movement | 13 | High — combat + ability descriptions | forced-movement, shifting, difficult-terrain, fly, teleport, etc. |
| Negotiation | 12 | Low — mostly in Negotiation chapter | benevolence, discovery, freedom, etc. **Highly ambiguous** in ordinary language. |
| Culture | 13 | Low — mostly in Cultures chapter | nomadic, rural, urban, bureaucratic, academic, etc. |

**Still NOT linkable:** individual abilities/features (these are section-internal).

## Linking Rules (Summary)

Full rules are in `steel-etl/docs/linking-guide.md`. Key points:

- **Link ALL instances** — density filtering is handled by the pipeline at build time
- **Link format:** `[Display Text](scc:mcdm.heroes.v1/type/id)`
- **Case-insensitive matching:** "fury", "Fury", "FURY" all match — use the text's original casing as display text
- **Plurals:** "criminals" links with display text "criminals" → `[criminals](scc:mcdm.heroes.v1/career/criminal)`
- **Possessives:** "Fury's" → `[Fury's](scc:mcdm.heroes.v1/class/fury)`
- **Bolded terms:** `**Criminal:** description` → `**[Criminal](scc:mcdm.heroes.v1/career/criminal):** description`
- **Don't link:** section's own heading, annotation comments, ordinary English usage ("fighting criminals" the concept vs. "Criminal" the career)
- **Uncertainty:** `<!-- REVIEW: is this a game reference? -->[term](scc:code)<!-- /REVIEW -->`

## Validation Commands

After each chapter, run these from the `steel-etl/` directory:

```bash
# Check for unresolved links (typos, wrong codes)
devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml 2>&1 | grep WARN

# Check no legacy colon-format links remain
grep -n "scc:[a-zA-Z0-9._-]*:" "input/heroes/Draw Steel Heroes.md"

# Count links added in this chapter (replace LINE_START and LINE_END)
sed -n 'LINE_START,LINE_ENDp' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

## Progress Matrix Update

After each task, update `steel-etl/docs/linking-guide.md` progress matrix. Mark each completed type with the link count (e.g., `done (15)`) or `-` if no links of that type were applicable.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `input/heroes/Draw Steel Heroes.md` | Modify (all tasks) | Add scc: links chapter by chapter |
| `docs/linking-guide.md` | Modify (all tasks) | Update progress matrix after each chapter |

---

### Task 1: Link The Basics chapter (lines 590–1055)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 590–1055)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** This chapter already has 10 scc: links (class and chapter references from prior work). Extend with remaining classes, ancestries, and chapters. Careers, kits, and other types have minimal presence here.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers (if mentioned by name as game mechanics)

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '590,1055p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

Scan every line for game mechanic references. Preserve the 10 existing links. Add new links for:
- Class names: fury, tactician, conduit, shadow, talent, elementalist, censor, null, troubadour (and plurals/possessives)
- Ancestry names: human, dwarf, orc, devil, dragon knight, hakaan, high elf, memonek, polder, revenant, time raider, wode elf
- Chapter cross-references: any explicit references like "see Tests", "see Classes", etc.

Do NOT link terms used as ordinary English (e.g., "talent" meaning skill/ability, "shadow" meaning darkness, "null" as a general concept, "fury" meaning anger). Only link when referring to the game mechanic.

- [ ] **Step 4: Validate**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '590,1055p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

Verify the count is reasonable (expect 15–40 links for a 466-line narrative chapter).

- [ ] **Step 5: Update progress matrix**

In `docs/linking-guide.md`, update The Basics row with link counts per type.

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to The Basics chapter"
```

---

### Task 2: Link Making a Hero chapter (lines 1056–1263)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 1056–1263)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** This chapter walks through hero creation. It references all 9 classes and all 12 ancestries by name, plus careers, kits, and chapter cross-references. 208 lines.

**Primary term types:** Classes, Ancestries, Chapters, Careers, Kits
**Secondary term types:** Complications, Perks (if mentioned as part of character creation steps)

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '1056,1263p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

Scan every line. This chapter lists character creation steps and likely mentions classes, ancestries, careers, kits, complications, and perks by name. Link ALL game mechanic references.

- [ ] **Step 4: Validate**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '1056,1263p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

- [ ] **Step 5: Update progress matrix**

- [ ] **Step 6: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Making a Hero chapter"
```

---

### Task 3: Link small chapters — Background, Rewards (lines 3200–3206, 23216–23220)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 3200–3206 and 23216–23220)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** Background is 7 lines, Rewards is 5 lines. Both are likely too short to contain linkable game mechanic references. Verify and mark as done.

- [ ] **Step 1: Read both chapter sections**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '3200,3206p' "input/heroes/Draw Steel Heroes.md"
echo "---"
sed -n '23216,23220p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 2: Add scc: links if any game mechanic terms are present**

If either chapter contains class, ancestry, or other game mechanic names, add links. If they're purely introductory text with no specific game terms, mark both as done with `-` for all types.

- [ ] **Step 3: Update progress matrix**

- [ ] **Step 4: Commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Background and Rewards chapters"
```

---

### Task 4: Link Cultures chapter (lines 3207–3493)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 3207–3493)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 287 lines. Cultures are tied to ancestries — expect heavy ancestry references. May also reference careers.

**Primary term types:** Ancestries, Chapters
**Secondary term types:** Classes, Careers

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '3207,3493p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

Focus on ancestry names (all 12) and any career or class cross-references. Watch for ordinary English usage of "human" — in most cases in this chapter it will be a game ancestry reference.

- [ ] **Step 4: Validate**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '3207,3493p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

- [ ] **Step 5: Update progress matrix and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Cultures chapter"
```

---

### Task 5: Link Ancestries chapter (lines 1264–3199)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 1264–3199)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 1,936 lines covering 12 ancestries. Each ancestry section describes traits and abilities, often referencing other ancestries, classes, and conditions. Dense cross-referencing expected.

**Primary term types:** Classes, Ancestries (cross-refs between ancestries), Chapters
**Secondary term types:** Careers, Kits

**Important:** Each ancestry has its own `## Heading` — do NOT link the ancestry name in its own heading. DO link the ancestry name when mentioned inside another ancestry's section (e.g., "dwarves" mentioned in the Hakaan section).

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

Read in two passes due to size:

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '1264,2200p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '2200,3199p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

Work through each ancestry section (12 sections). For each:
- Link class names when referenced (e.g., "fury", "conduit")
- Link other ancestry names when cross-referenced
- Link chapter names in cross-references
- Do NOT link the ancestry in its own section heading

- [ ] **Step 4: Validate**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '1264,3199p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

Expect 30–80 links for a 1,936-line chapter with 12 ancestry sections.

- [ ] **Step 5: Update progress matrix and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Ancestries chapter"
```

---

### Task 6: Link Careers chapter (lines 3494–4065)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 3494–4065)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 572 lines covering 18 careers. Each career grants skills and may reference classes, ancestries, or perks.

**Primary term types:** Classes, Ancestries, Careers (cross-refs), Chapters, Perks
**Secondary term types:** Kits

**Important:** Do NOT link a career name in its own section heading. DO link when one career section mentions another career.

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '3494,4065p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '3494,4065p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

- [ ] **Step 5: Update progress matrix and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Careers chapter"
```

---

### Task 7: Link Classes chapter — intro section (lines 4066–4552)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 4066–4552)
- Modify: `docs/linking-guide.md` (progress matrix — partial, note "Classes intro" done)

**Context:** 487 lines. The Classes chapter intro explains how classes work, references all 9 classes, and describes shared mechanics like heroic resources, abilities, and kits.

**Primary term types:** Classes, Ancestries, Kits, Chapters
**Secondary term types:** Careers

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '4066,4552p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '4066,4552p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Classes intro section"
```

---

### Task 8: Link Classes chapter — Censor (lines 4553–6005)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 4553–6005)

**Context:** 1,453 lines. The Censor class section: abilities, features, subclass options. Will reference other classes, ancestries, kits, and conditions (conditions NOT linkable).

**Primary term types:** Classes (cross-refs to other classes), Ancestries, Kits
**Secondary term types:** Chapters

**Important:** Do NOT link "Censor" in the `## Censor` heading. DO link "Censor" when it appears in ability descriptions within this section (self-references within ability text are useful — when extracted, the ability page needs a link back to its class).

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '4553,6005p' "input/heroes/Draw Steel Heroes.md"
```

Read in two passes if needed (first 750 lines, then remaining).

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '4553,6005p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Censor class section"
```

---

### Task 9: Link Classes chapter — Conduit (lines 6006–7793)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 6006–7793)

**Context:** 1,788 lines. Same approach as Task 8.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '6006,6900p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '6900,7793p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '6006,7793p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Conduit class section"
```

---

### Task 10: Link Classes chapter — Elementalist (lines 7794–9343)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 7794–9343)

**Context:** 1,550 lines. Same approach as Task 8.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '7794,8550p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '8550,9343p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '7794,9343p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Elementalist class section"
```

---

### Task 11: Link Classes chapter — Fury (lines 9344–10926)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 9344–10926)

**Context:** 1,583 lines. Same approach as Task 8.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '9344,10130p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '10130,10926p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '9344,10926p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Fury class section"
```

---

### Task 12: Link Classes chapter — Null (lines 10927–12210)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 10927–12210)

**Context:** 1,284 lines. Same approach as Task 8. **Caution:** "Null" can appear as a generic programming/game term — only link when it refers to the Null class.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '10927,11600p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '11600,12210p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '10927,12210p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Null class section"
```

---

### Task 13: Link Classes chapter — Shadow (lines 12211–13487)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 12211–13487)

**Context:** 1,277 lines. Same approach as Task 8. **Caution:** "Shadow" can mean darkness/shadow in flavor text — only link when referring to the Shadow class.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '12211,12850p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '12850,13487p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '12211,13487p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Shadow class section"
```

---

### Task 14: Link Classes chapter — Tactician (lines 13488–14641)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 13488–14641)

**Context:** 1,154 lines. Same approach as Task 8.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '13488,14070p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '14070,14641p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '13488,14641p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Tactician class section"
```

---

### Task 15: Link Classes chapter — Talent (lines 14642–16179)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 14642–16179)

**Context:** 1,538 lines. Same approach as Task 8. **Caution:** "talent" can mean natural ability in English — only link when referring to the Talent class.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '14642,15400p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '15400,16179p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '14642,16179p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Talent class section"
```

---

### Task 16: Link Classes chapter — Troubadour (lines 16180–17606)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 16180–17606)

**Context:** 1,427 lines. Same approach as Task 8.

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '16180,16890p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '16890,17606p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '16180,17606p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" && git commit -m "link: add cross-reference links to Troubadour class section"
```

---

### Task 17: Link Kits chapter (lines 17607–18580)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 17607–18580)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 974 lines covering 25 kits. Each kit describes stats and may reference classes, ancestries, and other kits.

**Primary term types:** Classes, Kits (cross-refs), Chapters
**Secondary term types:** Ancestries

**Important:** Do NOT link a kit in its own section heading. DO link when one kit references another.

- [ ] **Step 1: Read the reference documents**

Read `docs/linking-guide.md` and `docs/linking-reference.md` in full.

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '17607,18580p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '17607,18580p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Kits chapter"
```

---

### Task 18: Link Perks chapter (lines 18581–18946)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 18581–18946)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 366 lines covering 47 perks. Perks may reference careers (which grant them), classes, and skills.

**Primary term types:** Classes, Careers, Perks (cross-refs), Chapters
**Secondary term types:** Ancestries, Kits

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '18581,18946p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '18581,18946p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Perks chapter"
```

---

### Task 19: Link Complications chapter (lines 18947–20167)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 18947–20167)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 1,221 lines covering 100 complications. Each complication is a short narrative block. Some reference classes, ancestries, and other game mechanics. Many complication names are common English words — only link when referring to the specific complication mechanic.

**Primary term types:** Classes, Ancestries, Complications (cross-refs), Chapters
**Secondary term types:** Careers, Kits

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '18947,19560p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '19560,20167p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

**Caution:** Many complications have names that are common English phrases (e.g., "Lucky", "Hunter", "Exile", "Pirate", "Loner"). Only link when the text refers to the specific complication by name as a game mechanic, not when used as ordinary English.

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '18947,20167p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Complications chapter"
```

---

### Task 20: Link Tests chapter (lines 20168–20408)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 20168–20408)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 241 lines. Explains the test/skill check system. May reference classes and ancestries in examples.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers, Skills (not linkable — no SCC codes for individual skills)

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20168,20408p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20168,20408p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Tests chapter"
```

---

### Task 21: Link Skills chapter (lines 20409–20856)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 20409–20856)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 448 lines. Lists all skills with descriptions. May reference classes, ancestries, and careers in skill usage examples.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20409,20856p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20409,20856p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Skills chapter"
```

---

### Task 22: Link Combat chapter (lines 20857–21636)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 20857–21636)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 780 lines. Core combat rules. References classes and ancestries in examples, conditions in rules text (not linkable), and chapter cross-references.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Kits, Careers

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20857,21636p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '20857,21636p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Combat chapter"
```

---

### Task 23: Link Negotiation chapter (lines 21637–22187)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 21637–22187)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 551 lines. Social encounter rules. References classes and ancestries in examples.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '21637,22187p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '21637,22187p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Negotiation chapter"
```

---

### Task 24: Link Downtime Projects chapter (lines 22188–23215)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 22188–23215)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 1,028 lines. Downtime activities between adventures. References classes, ancestries, skills, and other chapters.

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers, Kits

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '22188,22700p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '22700,23215p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '22188,23215p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Downtime Projects chapter"
```

---

### Task 25: Link Treasures chapter (lines 23221–25258)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 23221–25258)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 2,038 lines. Treasure tables and item descriptions. References classes, ancestries, kits.

**Primary term types:** Classes, Ancestries, Kits, Treasures (cross-refs), Chapters
**Secondary term types:** Careers

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (three passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '23221,23900p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '23900,24600p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '24600,25258p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '23221,25258p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Treasures chapter"
```

---

### Task 26: Link Titles chapter (lines 25259–26339)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 25259–26339)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 1,081 lines covering 61 titles. Each title is a short block describing rewards and abilities. Some title names are common English words ("Knight", "Noble", "Marshal").

**Primary term types:** Classes, Ancestries, Titles (cross-refs), Chapters
**Secondary term types:** Careers, Kits, Complications

**Caution:** Only link title names when they refer to the specific title mechanic, not when used as ordinary English (e.g., "knight" meaning any armored warrior vs. the Knight title).

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '25259,25800p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '25800,26339p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '25259,26339p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Titles chapter"
```

---

### Task 27: Link Gods and Religion chapter (lines 26340–27294)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 26340–27294)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 955 lines. Describes gods, saints, domains, and religious mechanics. Heavy ancestry references (gods associated with specific ancestries), some class references (conduit, censor).

**Primary term types:** Classes, Ancestries, Chapters
**Secondary term types:** Careers

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '26340,27294p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '26340,27294p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to Gods and Religion chapter"
```

---

### Task 28: Link For the Director chapter (lines 27295–28721)

**Files:**
- Modify: `input/heroes/Draw Steel Heroes.md` (lines 27295–28721)
- Modify: `docs/linking-guide.md` (progress matrix)

**Context:** 1,427 lines. Director (GM) guidance. References classes, ancestries, and various game mechanics in advice and examples.

**Primary term types:** Classes, Ancestries, Careers, Chapters
**Secondary term types:** Kits, Complications

- [ ] **Step 1: Read the reference documents**

- [ ] **Step 2: Read the chapter text (two passes)**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '27295,28010p' "input/heroes/Draw Steel Heroes.md"
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '28010,28721p' "input/heroes/Draw Steel Heroes.md"
```

- [ ] **Step 3: Add scc: links**

- [ ] **Step 4: Validate and commit**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && sed -n '27295,28721p' "input/heroes/Draw Steel Heroes.md" | grep -o "scc:" | wc -l
```

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "link: add cross-reference links to For the Director chapter"
```

---

### Task 29: Final validation — full pipeline run and link audit

- [ ] **Step 1: Run full test suite**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go test ./... -race
```

Expected: all tests pass.

- [ ] **Step 2: Run pipeline and check for warnings**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml 2>&1 | grep WARN
```

Expected: no WARN output (all scc: codes resolve). If there are warnings, fix the typos in the source document.

- [ ] **Step 3: Count total links**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -c "scc:" "input/heroes/Draw Steel Heroes.md"
```

Report the total. Expected: 500–2000 links across all chapters.

- [ ] **Step 4: Check for any remaining legacy link formats**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -n "scc:[a-zA-Z0-9._-]*:" "input/heroes/Draw Steel Heroes.md"
```

Expected: no output.

- [ ] **Step 5: Check for REVIEW markers that need resolution**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -cn "<!-- REVIEW:" "input/heroes/Draw Steel Heroes.md"
```

Report the count. These are uncertainty markers left by linking workers — they should be reviewed but are not blocking.

- [ ] **Step 6: Spot-check linked output**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && grep -r "\[.*\](class/" ../data/data-rules/en/md-linked/chapter/ | wc -l
```

Verify links appear in the linked output across multiple chapters.

- [ ] **Step 7: Test with --link-mode=first**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml --link-mode=first 2>&1 | tail -3
```

Expected: pipeline completes without errors.

- [ ] **Step 8: Restore default mode and commit any fixes**

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml
```

If any fixes were needed, commit:

```bash
cd /home/vexa/code/steel_compendium/workspace/steel-etl && git add "input/heroes/Draw Steel Heroes.md" docs/linking-guide.md && git commit -m "fix: resolve link warnings from final validation"
```

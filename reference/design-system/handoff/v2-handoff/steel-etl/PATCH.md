# steel-etl patch — rich category-index cards

> **STATUS: ✅ SHIPPED — reference only.** This `internal/site` wire-up for the flat category-index
> stat-cards is live. Read it as the template for how a generator branch hooks into
> `buildIndexContent` — the open **`FEATURE-INDEXES.md`** task adds a sibling branch the same way.
> Not an open task itself.

Two changes in `internal/site/`:

### 1. New file: `internal/site/cards.go`
Copy `cards.go` from this folder into `steel-etl/internal/site/`. It's in `package site`
and only calls existing helpers (`splitFrontmatter`, `parseFrontmatterField`, `dirToTitle`,
`fileToTitle`, `naturalLess`, `titleCase`).

### 2. One hook in `internal/site/build.go`
At the very top of `buildIndexContent`, add the early-return. Diff:

```go
 func buildIndexContent(dir, dirName string, files, subdirs []string) string {
+	// Rich stat-cards for supported index types (kit, …); falls back below.
+	if cards, ok := buildCardsContent(dir, dirName, files, subdirs); ok {
+		return cards
+	}
+
 	title := dirToTitle(dirName)

 	sort.Slice(files, func(i, j int) bool { return naturalLess(files[i], files[j]) })
```

That's it. Every flat index now renders a `.sc-cards` grid: **kit, class, ancestry, career,
treasure, perk, title, complication, culture, condition, skill, movement, negotiation**. The
nested aggregations (**feature**, **ability**) are excluded (they have subdirs / the expand UI)
and keep their existing lists — `buildCardsContent` returns `ok=false` for those, so the caller
falls through unchanged.

---

## Build & deploy
```bash
cd steel-etl
go build ./...            # confirms cards.go compiles
go test ./internal/site/  # existing tests still pass (kit index isn't asserted in build_test.go)
just <your-site-target>   # or: go run ./cmd/... site -c ../v2/site.yaml
```
Then in `v2`: `mkdocs serve` and spot-check `/Browse/kit/`, `/Browse/class/`, `/Browse/career/`,
`/Browse/complication/`, `/Browse/treasure/`.

> The generated card HTML is a single raw-HTML block (no blank lines inside the
> `<div class="sc-cards">`), so `md_in_html` passes it through verbatim — the inline-SVG
> crests need no emoji processing. If your Markdown setup still wraps it oddly, the fix is to
> keep the block contiguous (it already is) or add `markdown="0"` to the wrapper.

## What each card reads (frontmatter / body)
| Type | Shape | Shows |
|---|---|---|
| kit | grid | armor/weapon · **two stat rows** (Stamina/Speed/Stability/Disengage, then Melee/Ranged Dmg/Distance) · signature ability |
| class | grid | Heroic Resource · primary-characteristic chips · **clamped primer** (first 1–2 prose ¶, CSS line-clamps to 4 lines) |
| ancestry | grid | Signature Trait · **first-paragraph flavor** |
| career | grid | flavor line (“In defining your career…” stripped) · **Languages/Project Pts/Renown/Wealth** boxes · Skills + Perk text |
| treasure | grid | treasure-type · Level/Rarity boxes · keyword chips · effect blurb *(unchanged this pass)* |
| perk | **wide** | perk-group label · prerequisite inline · blurb |
| title | grid | echelon label · **full flavor (untruncated)** · prerequisite |
| complication | **wide** | description/flavor above benefit/drawback (combined “Benefit and Drawback” falls back to the benefit text) |
| culture | grid | environment/organization/upbringing chips · **Skill Options** line |
| condition · skill · movement · negotiation | grid | crest + first-sentence blurb (skill cap raised to 220 chars so short skills don’t ellipsize) |

### Frontmatter fields this pass newly relies on
Mostly already emitted; verify these exist in the `md-linked` output (the generator degrades
gracefully — missing numeric fields show `0`/`—`, missing text is just omitted):

- **kit:** `disengage_bonus`, `ranged_damage_bonus`, and a distance field (`distance_bonus` →
  `ranged_distance_bonus` → `melee_distance_bonus`, first non-empty wins). Armor/weapon prefer
  explicit `armor:`/`weapon:` fields, then parse `equipment_text` (the bare-weapon fallback now
  resolves “…wield a bow.” → **Bow** instead of the old “— weapon”). **If `equipment_text` keeps
  mis-parsing, wire the cards to the Kit-table chapter as discussed** — that table carries every
  stat in one place and is the more reliable source.
- **career:** `languages` (count of the YAML list, else the field value), `skills`.
- **culture:** `skill_options` (list joined with “, ”, or a string).
- **title:** `prerequisites` (falls back to `prerequisite`).

**No data-repo change** — everything is read from existing frontmatter, plus page bodies for
flavor/primers and the kit signature ability (parsed in the site layer only).

## Notes / tunables
- `richCardTypes` is the allow-list, `wideCardTypes` marks the full-width editorial types
  (complication, perk), and `cardFor()`'s switch is the dispatch — each type has its own `xCard()`
  builder, so tweak any card in isolation. Simple (name-only) types fall to the `default` blurb
  card; their crest comes from `typeIcon`.
- Crest icons are inline SVG in `iconPaths` — swap any path to taste.
- Kit type label is data-derived (keywords `Psionic`/`Magic` → wand crest + that label, else
  `Martial` + shield). The kit card now emits **two** stat rows via two `statsBlock` calls
  (CSS tucks the second under the first); melee & ranged boxes are independent so a kit can
  populate both (e.g. Cloak and Dagger).
- Wide cards use `wideCard()` (crest · name column · body) and keep the `.sc-fil` filigree-corner
  hover; the body holds escaped HTML (a `.sc-card__line` and/or `.sc-card__flavor`).
- Stat grids size to their column count; blurbs/flavor are markdown-stripped, then truncated
  (`flavorDiv(text, 0)` = no truncation, used for titles).

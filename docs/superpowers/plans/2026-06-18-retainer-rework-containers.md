# Retainer rework — `monster.*` namespace + coded advancement/role containers (Featureblock Plan 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Written for a FRESH session — re-read the cited files; do not assume prior context.

**Goal:** Move the 21 Monsters-book retainers into the `monster.*` family (`retainer.statblock/<id>` → `monster.retainer.statblock/<id>`) and give their advancement + role-advancement groups their own coded **container** entities (`monster.retainer.advancement-features/<id>` ×21, `monster.retainer.role-advancement/<role>` ×9), members **inline/uncoded** — full parity with fixtures (Plan 5c) — replacing Plan 4's site-side split.

**Architecture:** Spec `docs/superpowers/specs/2026-06-18-retainer-rework-coded-entities-design.md` (Option A). Retainers are true statblocks (build-time `.sb-wrap` card) whose advancement/role groups become **featureblocks** with inline ability members, exactly like fixtures 5c. **Per-ability coding is explicitly out of scope** (blocked by the flat H7+/level-6 heading model — spec §7; deferred to a header-levels rework). Parser changes in `internal/content/monster.go`; source restructure in `input/monsters/Draw Steel Monsters.md`; Plan 4 retirement + index/bestiary fixes in `internal/site/`.

**Tech Stack:** Go (steel-etl `internal/content`, `internal/site`), source markdown, table-driven Go tests. Toolchain via **devbox** — Go is not on PATH; prefix every Go command, run from the module root: `devbox run -- go -C steel-etl test ./...` (or `cd steel-etl` first). Per workspace memory, the reliable form is `devbox run -- bash -c 'cd steel-etl && go …'`.

**Repo & branch:** All code+source changes are in `steel-etl/`. Before Task 1:
```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl && git fetch origin -q && git checkout -b feat/retainer-rework-containers origin/main
git submodule update --init . 2>/dev/null || true
```
The workspace `steel-etl` pointer bump happens at deploy time, not in this plan.

---

## Context: what already exists (do NOT rebuild)

- **Ground truth — retainer source shape** (`input/monsters/Draw Steel Monsters.md`, ~line 27671):
  ```
  <!-- @type: monster-group | @domain: retainer -->
  #### Retainer Statblocks

  <!-- @type: statblock -->
  ####### Angulotl Hopper
  |  …stat grid (3 rows)… |
  > 🗡 **Leapfrog  (Signature Ability)** …        (innate abilities — blockquotes)
  > ⭐️ **Toxiferous** …
  ######## Level 4 Retainer Advancement Ability    (H8 separator — uncollected, folds into body)
  > 🗡 **Leaping Attack (Encounter)** …
  ######## Level 7 Retainer Advancement Ability
  > 🏹 **Three-Poison Dart (Encounter)** …
  ######## Level 10 Retainer Advancement Ability
  > ❗️ **Trip of the Tongue (Encounter)** …
  ```
  21 `@type: statblock` entries under `#### Retainer Statblocks`. Some retainers are missing a tier (e.g. only Level 7 + 10). Confirm by reading.
- **Separate Role Advancement chapter** (~line 27237): `#### Role Advancement Abilities` (currently an unannotated H4 with intro prose + a `###### Retainer Advancement Table`), then 9 `##### <Role> Abilities` groups (`Ambusher`…`Support`), each with `######## Level N Role Advancement Ability` H8 blocks. These are role-keyed (any retainer of that role), NOT per-retainer.
- **`StatblockParser.Parse`** (`internal/content/monster.go:70`): `statblockDomain(ctx, level)` returns `(domain, category, subcategory)` from context; `typePath := compactPath(domain, category, subcategory, "statblock")`; a `switch domain` adds `monster.*` prefixes for fixture/minion/champion/rival. For `@domain: retainer` today there is **no** case → `typePath = ["retainer","statblock"]`.
- **`FeatureblockParser.Parse`** (`internal/content/monster.go:189`): companion branch (`ctx.Lookup … "companion"`) and fixture branch (`domain == "fixture"`) return early with `compactPath("monster", <group>, …, "advancement-features"|"featureblock")` and `fm["features"] = RichFeatureMaps(ParseRichFeatures(body))`. The malice default follows.
- **`ParseRichFeatures`** (`internal/content/featureparse.go`) attaches a member `Level` from a standalone bold label via `fbLevelLabelRe = ^\*\*Level\s+(\d+)\b[^*]*\*\*$` — this **already matches** `**Level 4 Retainer Advancement Ability**`. It does **not** match a `######## Level 4 …` heading. So the source restructure must turn those H8 headings into bold labels (Task 3/4).
- **`renderFbFeats`** wraps `Level > 0` runs in `.fb__band--adv` tiers (already CSS-styled). `buildFeatureblockPage` renders a `type: featureblock` page.
- **Plan 4** (`internal/site/retainer_page.go`): `splitRetainerAdvancement` + `renderRetainerAdvancement`, wired into `buildStatblockIslandPage` (`internal/site/statblock_page.go:136,148`). This is what we retire.
- **Index pairing**: `buildAdvancementPairContent` (`internal/site/advancement_pairs.go`) pairs a base entity with its `…advancement-features` card on the group index (fixtures/companions). `advancement_pairs.go:123` keys on `pathHasSegment(dir, "fixture")` — extend to retainers.
- **Path/categorization**: `hoistStatblockPath` / `flattenAdvancementFeaturesPath` (`internal/site/build.go:569,601`); `bestiaryItemType` (`internal/site/bestiary_search.go:37`, already returns `"retainer"`); Browse type-index in `cards.go`/`feature_index.go` (`pathHasSegment(dir,"retainer")`). These already understand a `retainer` path segment — after the move the segment is still `retainer` (now under `monster/`), so most keep working; Task 6 audits the deltas.

---

## Task 1: `StatblockParser` retainer branch → `monster.retainer.statblock`

**Files:**
- Modify: `internal/content/monster.go` (`StatblockParser.Parse`, the `switch domain` ~line 108)
- Test: `internal/content/monster_test.go` (or the file holding statblock parser tests — confirm with `grep -rln 'StatblockParser\|statblock.statblock\|fixture.demon' internal/content/*_test.go`)

- [ ] **Step 1: Write the failing test**

Add a test that a `@type: statblock` section under `@domain: retainer` context classifies into the `monster.*` family. Use the existing test helper pattern in the chosen test file (find an existing fixture/statblock test and mirror its setup — context stack push of `{"domain":"retainer"}`, then `StatblockParser{}.Parse`). Assert:

```go
func TestStatblockParser_Retainer(t *testing.T) {
	ctx := context.NewContextStack(nil)
	ctx.Push(4, map[string]string{"domain": "retainer"}) // mirrors `#### Retainer Statblocks`
	sec := &parser.Section{Heading: "Angulotl Hopper", HeadingLevel: 6,
		BodySource: "|  Angulotl, Humanoid | - | Level 1 | Harrier Retainer | EV - |\n\n> 🗡 **Leapfrog (Signature Ability)**\n>\n> **Effect:** Jump."}
	got, err := (&StatblockParser{}).Parse(ctx, sec)
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{"monster", "retainer", "statblock"}; !reflect.DeepEqual(got.TypePath, want) {
		t.Errorf("TypePath = %v, want %v", got.TypePath, want)
	}
	if got.ItemID != "angulotl-hopper" {
		t.Errorf("ItemID = %q, want angulotl-hopper", got.ItemID)
	}
}
```
(Confirm the exact `context.ContextStack` push signature + `parser.Section` fields against a neighbouring test; adjust the literal to match. Add `reflect` to imports if absent.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_Retainer -v'`
Expected: FAIL — `TypePath = [retainer statblock]`.

- [ ] **Step 3: Write the minimal implementation**

In `internal/content/monster.go`, add a `retainer` case to the `switch domain` in `StatblockParser.Parse` (the block at ~line 108, alongside `minion`/`champion`/`rival`):

```go
	case "retainer":
		// Monsters-book retainers join the monster.* family (Plan 6).
		typePath = compactPath("monster", "retainer", category, subcategory, "statblock")
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_Retainer -v'`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/content/monster.go internal/content/*_test.go
git commit -m "feat(scc): retainer statblock -> monster.retainer.statblock"
```

---

## Task 2: `FeatureblockParser` retainer branch (advancement + role containers)

**Files:**
- Modify: `internal/content/monster.go` (`FeatureblockParser.Parse`, after the fixture branch ~line 236)
- Test: same content test file as Task 1

- [ ] **Step 1: Write the failing tests**

```go
func TestFeatureblockParser_RetainerAdvancement(t *testing.T) {
	ctx := context.NewContextStack(nil)
	ctx.Push(4, map[string]string{"domain": "retainer"})
	body := "**Level 4 Retainer Advancement Ability**\n\n> 🗡 **Leaping Attack (Encounter)**\n>\n> **Effect:** Jump and strike."
	sec := &parser.Section{Heading: "Angulotl Hopper Advancement Features", HeadingLevel: 6,
		Annotation: map[string]string{"id": "angulotl-hopper"}, BodySource: body}
	got, _ := (&FeatureblockParser{}).Parse(ctx, sec)
	if want := []string{"monster", "retainer", "advancement-features"}; !reflect.DeepEqual(got.TypePath, want) {
		t.Errorf("TypePath = %v, want %v", got.TypePath, want)
	}
	if got.ItemID != "angulotl-hopper" {
		t.Errorf("ItemID = %q", got.ItemID)
	}
	feats, _ := got.Frontmatter["features"].([]map[string]any)
	if len(feats) == 0 {
		t.Fatalf("expected inline features, got %v", got.Frontmatter["features"])
	}
	if lv, _ := feats[0]["level"].(int); lv != 4 {
		t.Errorf("member level = %v, want 4 (fbLevelLabelRe must attach it)", feats[0]["level"])
	}
}

func TestFeatureblockParser_RoleAdvancement(t *testing.T) {
	ctx := context.NewContextStack(nil)
	ctx.Push(4, map[string]string{"domain": "retainer", "category": "role-advancement"})
	sec := &parser.Section{Heading: "Ambusher Abilities", HeadingLevel: 5,
		Annotation: map[string]string{"id": "ambusher"},
		BodySource:  "**Level 4 Role Advancement Ability**\n\n> 🗡 **Go for the Jugular (Encounter)**\n>\n> **Effect:** Bleed."}
	got, _ := (&FeatureblockParser{}).Parse(ctx, sec)
	if want := []string{"monster", "retainer", "role-advancement"}; !reflect.DeepEqual(got.TypePath, want) {
		t.Errorf("TypePath = %v, want %v", got.TypePath, want)
	}
	if got.ItemID != "ambusher" {
		t.Errorf("ItemID = %q, want ambusher", got.ItemID)
	}
}
```
(Confirm `section.ID()` returns the `@id` annotation value — check `parser.Section.ID()`. If `ID()` derives only from the heading, set the test heading/annotation so `id` resolves to the expected slug, and have the impl use `id` computed at the top of `Parse` as the existing fixture branch does.)

- [ ] **Step 2: Run to verify they fail**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_Retainer -v'`
Expected: FAIL — both fall through to the malice default (`monster/<…>` or `retainer/<id>`), wrong TypePath.

- [ ] **Step 3: Write the minimal implementation**

In `internal/content/monster.go`, add the retainer branch in `FeatureblockParser.Parse` immediately **after** the fixture branch (the `if domain == "fixture"` block ending ~line 236) and **before** the `// kind:` malice default:

```go
	// Retainer advancement / role-advancement containers (Monsters book, Plan 6).
	// Under @domain: retainer this featureblock is either a per-retainer
	// "<Name> Advancement Features" block, or — when the enclosing group carries
	// @category: role-advancement — a per-role "<Role> Abilities" block. Members are
	// inline abilities (uncoded; the malice/terrain/fixture model); their leveled
	// bands come from the **Level N … Advancement Ability** bold labels.
	if domain, category, _ := statblockDomain(ctx, section.HeadingLevel); domain == "retainer" {
		if feats := ParseRichFeatures(body); len(feats) > 0 {
			fm["features"] = RichFeatureMaps(feats)
		}
		kind := "advancement-features"
		if category == "role-advancement" {
			kind = "role-advancement"
		}
		return &ParsedContent{
			Frontmatter: fm,
			Body:        body,
			TypePath:    compactPath("monster", "retainer", kind),
			ItemID:      id,
		}, nil
	}
```

- [ ] **Step 4: Run to verify they pass**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestFeatureblockParser_Retainer -v'`
Expected: PASS (both).

- [ ] **Step 5: Full content package green**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/...'`
Expected: PASS — companion/fixture/malice featureblock tests unaffected (retainer branch only fires for `domain == "retainer"`).

- [ ] **Step 6: Commit**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add internal/content/monster.go internal/content/*_test.go
git commit -m "feat(scc): retainer advancement + role-advancement featureblock containers"
```

---

## Task 3: Source restructure — advancement siblings (×21)

For each of the 21 retainer statblocks, move its trailing `######## Level N Retainer Advancement Ability` blocks out of the `@type: statblock` body into a **sibling** `@type: featureblock` section, converting the H8 separator headings into bold labels.

**Files:** `input/monsters/Draw Steel Monsters.md` (the `#### Retainer Statblocks` range, ~27671 to the end of the retainers chapter).

- [ ] **Step 1: Inventory the retainers**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
awk 'NR>=27671 && /^####### [^#]/{print NR": "$0}' "input/monsters/Draw Steel Monsters.md"
grep -n '^######## Level .* Retainer Advancement Ability' "input/monsters/Draw Steel Monsters.md"
```
Record each statblock heading → slug and which advancement tiers it has (some lack a tier). Expected 21 statblocks, ~57 advancement headings.

- [ ] **Step 2: Apply the transform**

For each `<!-- @type: statblock --> ####### <Name>` section in the range, find the first `######## Level N Retainer Advancement Ability` line. Everything from that line to just before the next `<!-- @type: statblock -->` (or the chapter end) is the advancement region. Rewrite it as:

```
<!-- @type: featureblock | @id: <name-slug> -->
####### <Name> Advancement Features

**Level 4 Retainer Advancement Ability**

> 🗡 **Leaping Attack (Encounter)** …

**Level 7 Retainer Advancement Ability**

> 🏹 **Three-Poison Dart (Encounter)** …
```
i.e. (a) insert the `@type: featureblock | @id: <slug>` annotation + `####### <Name> Advancement Features` heading at the region start; (b) rewrite each `######## Level N Retainer Advancement Ability` heading → a standalone bold label line `**Level N Retainer Advancement Ability**`; (c) leave the ability blockquotes verbatim. `<name-slug>` MUST equal the base statblock's `section.ID()` slug (default: `Slugify(<Name>)`) so base + advancement share an item.

This is mechanical but per-statblock; a script is recommended. Starting point (review + adjust against the real file — do **not** run blind):

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
python3 - <<'PY'
import re, pathlib
p = pathlib.Path("input/monsters/Draw Steel Monsters.md")
lines = p.read_text().split("\n")
# Restrict to the Retainer Statblocks block: from its monster-group to the next #### at col0.
start = next(i for i,l in enumerate(lines) if l.strip()=="#### Retainer Statblocks")
end = next((i for i in range(start+1,len(lines)) if re.match(r'^#### [^#]', lines[i])), len(lines))
def slug(s): return re.sub(r'[^a-z0-9]+','-', s.strip().lower()).strip('-')
out, i = lines[:start], start
cur_name=None
seg=lines[start:end]
res=[]
j=0
while j < len(seg):
    l=seg[j]
    m=re.match(r'^####### (.+)$', l)
    if m and not l.startswith('########'):
        cur_name=m.group(1).strip(); res.append(l); j+=1; continue
    a=re.match(r'^######## (Level \d+ Retainer Advancement Ability)\s*$', l)
    if a:
        # first advancement heading for this statblock: open the sibling featureblock once
        if not (res and res[-1].startswith('<!-- @type: featureblock')):
            res.append("")
            res.append(f"<!-- @type: featureblock | @id: {slug(cur_name)} -->")
            res.append(f"####### {cur_name} Advancement Features")
            res.append("")
        res.append(f"**{a.group(1)}**")
        j+=1; continue
    res.append(l); j+=1
p.write_text("\n".join(out+res+lines[end:]))
print("done")
PY
```
NOTE: this opens **one** featureblock per statblock on the first advancement heading and converts subsequent headings to bold labels (they append into the same featureblock because no new `#######` statblock intervenes). Verify the output by eye for 2–3 statblocks before trusting it; fix the script if a retainer's advancement region is shaped differently.

- [ ] **Step 3: Verify by regeneration**

Run (consult `steel-etl/CLAUDE.md` for the exact `gen` invocation; retainers are in `mcdm.monsters.v1`, so use `--book monsters` or `--all`):
```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
devbox run -- bash -c 'cd "$PWD" && go run ./cmd/steel-etl gen --book monsters --config pipeline.yaml' 2>&1 | tail -5
grep -c 'monster.retainer.advancement-features/' classification.json   # expect 21
grep -c 'monster.retainer.statblock/' classification.json              # expect 21
```
Expected: 21 advancement containers, 21 base statblocks, and a base statblock's `features[]` (data output) no longer includes the advancement abilities. Confirm one container's output has Level-4/7/10 members with levels:
```bash
find data -ipath '*retainer*advancement-features*angulotl*' -name '*.md' | head
```

- [ ] **Step 4: Commit**

```bash
git add "input/monsters/Draw Steel Monsters.md"
git commit -m "feat(monsters): split retainer advancement into coded featureblock siblings"
```

---

## Task 4: Source restructure — role-advancement containers (×9)

**Files:** `input/monsters/Draw Steel Monsters.md` (the `#### Role Advancement Abilities` range, ~27237–27670).

- [ ] **Step 1: Wrap the chapter section in a retainer context**

Change the `#### Role Advancement Abilities` heading's preceding annotation so it pushes `@domain: retainer | @category: role-advancement` context (a non-classified container, so its intro prose + the `###### Retainer Advancement Table` still render on the chapter page but mint no code):
```
<!-- @type: monster-group | @domain: retainer | @category: role-advancement -->
#### Role Advancement Abilities
```

- [ ] **Step 2: Annotate each of the 9 role groups + convert level headings**

For each `##### <Role> Abilities` (Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Mount, Support), insert the annotation and convert its `######## Level N Role Advancement Ability` headings to bold labels:
```
<!-- @type: featureblock | @id: ambusher -->
##### Ambusher Abilities

**Level 4 Role Advancement Ability**

> 🗡 **Go for the Jugular (Encounter)** …

**Level 7 Role Advancement Ability**
…
```
`@id` = the role slug (lowercase single word). Leave ability blockquotes verbatim.

- [ ] **Step 3: Verify by regeneration**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
devbox run -- bash -c 'cd "$PWD" && go run ./cmd/steel-etl gen --book monsters --config pipeline.yaml' 2>&1 | tail -5
grep -oE 'monster.retainer.role-advancement/[a-z-]+' classification.json | sort -u   # expect 9 roles
```
Expected: `ambusher artillery brute controller defender harrier hexer mount support`.

- [ ] **Step 4: Commit**

```bash
git add "input/monsters/Draw Steel Monsters.md"
git commit -m "feat(monsters): role-advancement featureblock containers (9 roles)"
```

---

## Task 5: Retire Plan 4 (`retainer_page.go`)

The retainer advancement is now a real entity; the site-side split is dead.

**Files:**
- Modify: `internal/site/statblock_page.go` (`buildStatblockIslandPage`, ~136–149)
- Delete: `internal/site/retainer_page.go`, `internal/site/retainer_page_test.go`
- Test: `internal/site/statblock_page_test.go` (confirm no test depends on the split)

- [ ] **Step 1: Check shared-helper usage**

Run: `grep -rn 'fbFeaturesFromRich\|splitRetainerAdvancement\|renderRetainerAdvancement\|retainerRoleKey' internal/site/ | grep -v _test`
If `fbFeaturesFromRich` is **only** used by `retainer_page.go`, deleting the file is clean. If another file uses it, it already lives elsewhere (relocated in 5c) — verify with `grep -rn 'func fbFeaturesFromRich'` and do NOT delete that definition.

- [ ] **Step 2: Simplify `buildStatblockIslandPage`**

In `internal/site/statblock_page.go`, replace the retainer-split tail of `buildStatblockIslandPage` (the lines using `splitRetainerAdvancement` / `renderRetainerAdvancement`) with the plain card path:

```go
	island := buildStatblockIsland(fm, body)
	if scc := strings.TrimSpace(parseFrontmatterField(fm, "scc")); scc != "" {
		statblockFeatureCache[scc] = island.Features
	}
	card := renderStatblockCard(island)
	return []byte("---\n" + fm + "\n---\n\n" + card), true
```
(Drop the `base, advGroups := splitRetainerAdvancement(body)` line and the `adv := renderRetainerAdvancement(...)` line; feed the full `body` to `buildStatblockIsland`. The advancement blockquotes are no longer in the statblock body — they moved to the sibling featureblock in Task 3 — so this is also correct for data fidelity.)

- [ ] **Step 3: Delete Plan 4 files**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git rm internal/site/retainer_page.go internal/site/retainer_page_test.go
```

- [ ] **Step 4: Build + test**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/site/...'`
Expected: PASS. If a `statblock_page_test.go` test asserted the retainer split, update it to expect the plain card (no advancement appended).

- [ ] **Step 5: Commit**

```bash
git add internal/site/statblock_page.go internal/site/statblock_page_test.go
git commit -m "refactor(site): retire Plan 4 retainer split; advancement is a real entity"
```

---

## Task 6: Browse/Bestiary categorization + index pairing

After the move, retainer pages sit under `monster/retainer/` and gain `advancement-features` / `role-advancement` siblings. Make Browse + the Bestiary tab + the index pairing handle them like fixtures.

**Files:** `internal/site/advancement_pairs.go`, `internal/site/build.go` (`hoistStatblockPath`/`flattenAdvancementFeaturesPath`), `internal/site/bestiary_search.go`, `internal/site/cards.go` / `feature_index.go`; relevant tests.

- [ ] **Step 1: Pair retainer base + advancement on the index**

In `internal/site/advancement_pairs.go`, the pairing currently keys on `pathHasSegment(dir, "fixture")` (~line 123). Add `retainer`:
```go
	if pathHasSegment(dir, "fixture") || pathHasSegment(dir, "retainer") {
```
(Read the surrounding function first; match whatever predicate shape it uses so retainer statblock+advancement pages pair on the `monster/retainer/` index exactly as fixtures do.)

- [ ] **Step 2: Path hoist/flatten**

Confirm `hoistStatblockPath` (`build.go:569`) drops the `statblock/` segment for `monster/retainer/...` and `flattenAdvancementFeaturesPath` (`build.go:601`) flattens `…/advancement-features/<id>` beside the base for retainers (the fixture/companion behavior). If either is scoped to specific segments (fixture/companion), extend to `retainer`. Add/adjust a test mirroring the fixture case.

- [ ] **Step 3: Bestiary + role-advancement placement**

`bestiaryItemType` (`bestiary_search.go:37`) already returns `"retainer"` — confirm it still fires for the new `monster/retainer/` path and that role-advancement pages don't pollute the bestiary creature list (role-advancement is not a creature; ensure it's treated like an advancement/featureblock page, not a statblock row). Add a test if behavior changes.

- [ ] **Step 4: Build + test + regenerate the site**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/site/...'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml' 2>&1 | tail -5
```
Confirm:
```bash
ls ../v2/docs/Browse/monster/retainer/ | head
grep -rl 'fb-wrap' ../v2/docs/Browse/monster/retainer/ | grep -i advancement | head   # advancement cards present
grep -rl 'sb-wrap' ../v2/docs/Browse/monster/retainer/ | head                          # statblock cards present
```

- [ ] **Step 5: Commit**

```bash
git add internal/site/
git commit -m "feat(site): retainer Browse/Bestiary categorization + index pairing"
```

---

## Task 7: Full regen + SCC stability + schema

**Files:** none (verification); commit only if tracked files changed.

- [ ] **Step 1: Whole-module build/vet/test**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'`
Expected: all green.

- [ ] **Step 2: Full regen + classify delta**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml' 2>&1 | tail -5
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --diff' 2>&1 | grep -i retainer | head -40
```
Expected delta: **removed** 21 `retainer.statblock/*`; **added** 21 `monster.retainer.statblock/*` + 21 `monster.retainer.advancement-features/*` + 9 `monster.retainer.role-advancement/*`. Registry net **+30**. No other family changes.

- [ ] **Step 3: Schema validation**

`type: featureblock` is already covered by `featureblock.schema.json` (both copies). Confirm `internal/output` tests pass (Step 1 covers this). If `schema_validation_test.go` flags a field, update **both** schema copies (`steel-etl/schemas` + `data-sdk-npm`) + the allowlist (dual-schema-sync rule).

- [ ] **Step 4: Visual spot-check**

Serve/build v2 and open Angulotl Hopper: `.sb-wrap` statblock card renders innate abilities only; its advancement page shows a Forged Band card with Level-4/7/10 `.fb__band--adv` tiers preserving power rolls; the retainer index pairs them; an Ambusher role page renders. (If serving is impractical, record as a manual follow-up rather than blocking.)

- [ ] **Step 5: Commit (if needed)**

`data/` is gitignored; usually nothing to commit. If a tracked schema file changed, commit it.

---

## Task 8: Docs, ROADMAP, follow-ups

**Files:** `docs/scc-log.md`, `docs/scc-reference.md`, workspace `CLAUDE.md`, `steel-etl/CLAUDE.md`, `steel-etl/docs/statblocks.md`, `DESIGN.md`, `ROADMAP.md` (all in the workspace repo except the two steel-etl files).

- [ ] **Step 1: SCC log + reference**

`docs/scc-log.md`: dated 2026-06-18 entry — retainers `retainer.statblock/*` → `monster.retainer.statblock/*`; new `…advancement-features` (×21) + `…role-advancement` (×9) containers, members inline; Plan 4 `retainer_page.go` retired; registry +30. Update `docs/scc-reference.md` + the workspace `CLAUDE.md` SCC summary (retainers now in `monster.*`; new registry count; "Plan 6 containers done; per-ability coding deferred").

- [ ] **Step 2: steel-etl docs**

`steel-etl/CLAUDE.md` + `steel-etl/docs/statblocks.md`: retainers now `monster.retainer.*` (base + advancement + role-advancement containers, inline members); Plan 4 retired; note the deferred per-ability coding + its header-level prerequisite (spec §7). `DESIGN.md`: retainer advancement/role-advancement as Forged Band card instances (replace the Plan 4 mention).

- [ ] **Step 3: ROADMAP**

`ROADMAP.md`: mark **#9 done** (container scope; reword away from "collect H8 globally"). Add two new items (take N from the `next-id` counter, bump it):
  1. **Header-levels rework → per-ability coding.** Rework the Monsters/Summoner input docs' header levels (and raise the level-6 cap / preserve relative depth) so abilities nest under statblocks, unblocking per-ability `feature.ability.*` codes for retainers (base + advancement + role) and per-member coding for **all** featureblocks (fixtures, malice, terrain), plus companion-style on-page advancement embedding. Spec §7.
  2. **Stale-island-docs fix.** ROADMAP #7 + `steel-etl/CLAUDE.md` + `docs/statblocks.md` still describe client-side JSON islands; statblocks already render build-time `.sb-wrap` (`buildStatblockIslandPage`; 0 built pages use `sc-statblock-mount`; `steel-statblock.js` is dead). Correct the docs and re-assess what remains of #7 (the entity-embedding half).

- [ ] **Step 4: Memory**

Update the featureblock-cards / `featureblock-refactor-in-flight` memory note: Plan 6 container scope shipped 2026-06-18; per-ability coding deferred to the header-levels rework. (Saved via Write tool, not committed.)

- [ ] **Step 5: Commit docs**

```bash
cd /home/scott/code/steelCompendium/workspace/steel-etl
git add CLAUDE.md docs/statblocks.md && git commit -m "docs: retainers in monster.* family (Plan 6 containers)"
cd /home/scott/code/steelCompendium/workspace
git add docs/scc-log.md docs/scc-reference.md CLAUDE.md DESIGN.md ROADMAP.md
git commit -m "docs: Plan 6 retainer rework — scc log, roadmap #9 done + follow-ups"
```

---

## Deploy (separate, after review — NOT part of task execution)

Per `docs/git-workflow.md`: merge the `steel-etl@feat/retainer-rework-containers` branch, then bump the workspace `steel-etl` pointer (`chore: bump steel-etl to <sha>`) and run `just deploy` (regenerates + commits + pushes generated output). Do not hand-commit generated `data/` or `v2/docs/`. The user decides when to deploy.

---

## Self-Review notes (spec coverage)

- Spec §3 scheme (3 container types, +30 codes) → Tasks 1 (base), 2 (parser), 3–4 (source), 7 (verify delta). ✓
- Spec §4.1 (fbLevelLabelRe already matches; restructure converts H8 headings → bold labels) → Tasks 3–4 explicitly rewrite headings to `**Level N …**`; Task 2 test asserts the level attaches. ✓
- Spec §5 (parser branches, no `collectDeepHeadings`/`ContextStack` change) → Tasks 1–2; no infra file touched. ✓
- Spec §6 (statblock card unchanged; advancement own paired page; Plan 4 retired; bestiary/Browse) → Tasks 5–6. ✓
- Spec §8 (members are abilities — ability rigor preserved, code as `feature.ability.*` when coded later) → Task 2 uses `ParseRichFeatures` (carries PowerRoll/Sections); §7 deferral noted in Task 8 ROADMAP item. ✓
- Spec §7 deferral + §12 follow-ups (header-levels rework; stale-island docs) → Task 8 Step 3. ✓
- **Risk acknowledged:** Tasks 3–4 are scripted source surgery — every step is regen-verified (Task 3 Step 3, Task 4 Step 3, Task 7 Step 2) before commit; the script is a reviewed starting point, not a blind run.

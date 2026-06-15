# Summoner Statblocks → `monster.*` Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-mint the Summoner book's portfolio minions, portfolio champions, and rival-summoner family from their standalone `minion.*`/`champion.*`/`rival.*` SCC roots into the `monster.*` family so they live under `Browse/monster/…` beside the Monsters-book creatures, companions, and fixtures.

**Architecture:** Go-side domain mapping in `StatblockParser` (mirroring the existing `@domain: fixture` special-case): the summoner source keeps simple `@domain: minion|champion|rival` annotations; the parser rewrites the resulting `TypePath` into the `monster.*` family. Rivals split per-statblock — the Rival Summoner NPC keeps a `.statblock` leaf (lands beside the Monsters-book rivals), its minion summons get a `.summoner.minion` leaf. The site builder needs no functional change (the `minion`/`champion`/`rival` path segments still exist, now nested under `monster/`); only dead top-level `v2/site.yaml` includes are removed.

**Tech Stack:** Go (steel-etl), `go test`, the steel-etl `gen`/`classify`/`validate`/`site` CLIs, devbox toolchain, MkDocs (v2 site).

**Repo layout note:** This work spans three git repos. Parser + tests live in the **steel-etl** sub-repo; `site.yaml` in the **v2** sub-repo; spec/plan/scc-log/CLAUDE.md in the **workspace** root repo. Commit each change in its own repo. Do steel-etl work on a feature branch (e.g. `feat/summoner-statblocks-monster-family`); the Plan 5a–5c work rode on `feat/companion-scc-restructure`, so confirm with the user whether to branch off that or off `main`.

**Devbox reminder:** Go is not on PATH. Run Go/CLI commands as `devbox run -- bash -c 'cd steel-etl && <cmd>'` from the workspace root.

---

## File Structure

| File | Repo | Responsibility | Change |
|---|---|---|---|
| `steel-etl/internal/content/monster.go` | steel-etl | `StatblockParser.Parse` — builds statblock `TypePath` | Modify (add minion/champion/rival domain mapping) |
| `steel-etl/internal/content/monster_test.go` | steel-etl | parser unit tests | Modify (add `TestStatblockParser_SummonerDomains`) |
| `steel-etl/input/summoner/Draw Steel Summoner.md` | steel-etl | annotated source | Modify (update 2 inbound `scc:` links) |
| `v2/site.yaml` | v2 | Browse section includes | Modify (remove dead top-level includes) |
| `docs/scc-log.md` | workspace | dated SCC history | Modify (add entry) |
| `CLAUDE.md` | workspace | SCC current-state bullets | Modify |
| `steel-etl/docs/statblocks.md` | steel-etl | statblock reference | Modify (note the mapping) |

---

## Task 1: Minion + champion domain mapping (parser)

**Files:**
- Modify: `steel-etl/internal/content/monster.go` (around line 151)
- Test: `steel-etl/internal/content/monster_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/monster_test.go`. The header-grid body format matches the real source (header row → separator → stat rows); `parseStatGrid` reads `organization`/`role` from the third header cell.

```go
func TestStatblockParser_SummonerMinionChampion(t *testing.T) {
	body := "| — | Demon | Minion Ambusher | - | 1 Malice |\n" +
		"|:-:|:-:|:-:|:-:|:-:|\n" +
		"| **1S**<br>Size | **4**<br>Speed | **3**<br>Stamina | **0**<br>Stability | **2**<br>Free Strike |\n"

	cases := []struct {
		name     string
		domain   string
		category string
		want     string
	}{
		{"Rasquine", "minion", "demon", "monster/minion/summoner/demon/statblock"},
		{"Demon Lord's Aspect", "champion", "demon", "monster/champion/summoner/demon/statblock"},
	}
	for _, tc := range cases {
		t.Run(tc.domain, func(t *testing.T) {
			sec := newSection(tc.name, 7, map[string]string{"type": "statblock"}, body)
			ctx := context.NewContextStack(nil)
			ctx.Push(5, map[string]string{"domain": tc.domain, "category": tc.category})

			got, err := (&StatblockParser{}).Parse(ctx, sec)
			if err != nil {
				t.Fatal(err)
			}
			if strings.Join(got.TypePath, "/") != tc.want {
				t.Errorf("TypePath = %v, want %s", got.TypePath, tc.want)
			}
			if got.Frontmatter["type"] != "statblock" {
				t.Errorf("type = %v, want statblock", got.Frontmatter["type"])
			}
		})
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_SummonerMinionChampion -v'`
Expected: FAIL — `TypePath = [minion demon statblock], want monster/minion/summoner/demon/statblock`

- [ ] **Step 3: Write minimal implementation**

In `steel-etl/internal/content/monster.go`, find (≈ line 151):

```go
	typePath := compactPath(domain, category, subcategory, "statblock")
```

Replace it with:

```go
	typePath := compactPath(domain, category, subcategory, "statblock")

	// Summoner book special statblocks fold into the monster.* family (parallel
	// to companions/fixtures). These @domain values appear only in the Summoner
	// book, so the "summoner" class segment is hardcoded; revisit if another book
	// gains minions/champions.
	switch domain {
	case "minion":
		typePath = compactPath("monster", "minion", "summoner", category, "statblock")
	case "champion":
		typePath = compactPath("monster", "champion", "summoner", category, "statblock")
	}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_SummonerMinionChampion -v'`
Expected: PASS (both subtests)

- [ ] **Step 5: Commit** (in the steel-etl repo)

```bash
cd steel-etl && git add internal/content/monster.go internal/content/monster_test.go && git commit -m "feat: fold summoner minions/champions into monster.* family"
```

---

## Task 2: Rival domain mapping with NPC/summon split (parser)

The Rival Summoner NPC (organization `Elite`) → `monster.rivals.<echelon>.statblock`; its minion summons (organization `Minion`) → `monster.rivals.<echelon>.summoner.minion`. The source `@category: summoner` is dropped; `@subcategory` is the echelon (`1st-echelon`…`4th-echelon`).

**Files:**
- Modify: `steel-etl/internal/content/monster.go` (the `switch domain` added in Task 1)
- Test: `steel-etl/internal/content/monster_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestStatblockParser_SummonerRival(t *testing.T) {
	npcBody := "| — | Humanoid, Rival | Level 2 Elite Controller | - | EV 16 |\n" +
		"|:-:|:-:|:-:|:-:|:-:|\n" +
		"| **1M**<br>Size | **5**<br>Speed | **80**<br>Stamina | **0**<br>Stability | **3**<br>Free Strike |\n"
	summonBody := "| — | Undead | Signature Minion Harrier | - | 1 Malice |\n" +
		"|:-:|:-:|:-:|:-:|:-:|\n" +
		"| **1S**<br>Size | **6**<br>Speed | **3**<br>Stamina | **0**<br>Stability | **1**<br>Free Strike |\n"

	cases := []struct {
		name, heading, body, want string
	}{
		{"npc", "Rival Summoner", npcBody, "monster/rivals/2nd-echelon/statblock"},
		{"summon", "Skeleton", summonBody, "monster/rivals/2nd-echelon/summoner/minion"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			sec := newSection(tc.heading, 7, map[string]string{"type": "statblock"}, tc.body)
			ctx := context.NewContextStack(nil)
			ctx.Push(5, map[string]string{
				"domain": "rival", "category": "summoner", "subcategory": "2nd-echelon",
			})

			got, err := (&StatblockParser{}).Parse(ctx, sec)
			if err != nil {
				t.Fatal(err)
			}
			if strings.Join(got.TypePath, "/") != tc.want {
				t.Errorf("TypePath = %v, want %s (org=%v)", got.TypePath, tc.want, got.Frontmatter["organization"])
			}
		})
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_SummonerRival -v'`
Expected: FAIL — both subtests get `monster/rival/...`-less paths (current `rival/summoner/2nd-echelon/statblock`).

- [ ] **Step 3: Write minimal implementation**

Extend the `switch domain` in `steel-etl/internal/content/monster.go` (added in Task 1) with a `rival` case:

```go
	case "rival":
		// The Rival Summoner NPC sits beside the Monsters-book rivals
		// (monster.rivals.<echelon>.statblock); its minion summons nest under
		// monster.rivals.<echelon>.summoner.minion. The source @category
		// ("summoner") is dropped; @subcategory is the echelon.
		if org, _ := fm["organization"].(string); org == "Minion" {
			typePath = compactPath("monster", "rivals", subcategory, "summoner", "minion")
		} else {
			typePath = compactPath("monster", "rivals", subcategory, "statblock")
		}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/content/ -run TestStatblockParser_SummonerRival -v'`
Expected: PASS (both subtests)

- [ ] **Step 5: Run the full content package + build to confirm no regressions**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./... && go build ./...'`
Expected: PASS / clean build

- [ ] **Step 6: Commit** (steel-etl repo)

```bash
cd steel-etl && git add internal/content/monster.go internal/content/monster_test.go && git commit -m "feat: fold summoner rivals (NPC + summons) into monster.rivals family"
```

---

## Task 3: Update the 2 inbound `scc:` links in source

Re-minting changes two referenced codes. Both links live in `steel-etl/input/summoner/Draw Steel Summoner.md`.

**Files:**
- Modify: `steel-etl/input/summoner/Draw Steel Summoner.md`

- [ ] **Step 1: Locate the two stale links**

Run:
```bash
cd steel-etl && grep -n "minion.elemental.statblock/iron-reaver\|champion.undead.statblock/avatar-of-death" "input/summoner/Draw Steel Summoner.md"
```
Expected: two line hits.

- [ ] **Step 2: Rewrite both links**

Replace (exact strings):
- `scc:mcdm.summoner.v1/minion.elemental.statblock/iron-reaver` → `scc:mcdm.summoner.v1/monster.minion.summoner.elemental.statblock/iron-reaver`
- `scc:mcdm.summoner.v1/champion.undead.statblock/avatar-of-death` → `scc:mcdm.summoner.v1/monster.champion.summoner.undead.statblock/avatar-of-death`

- [ ] **Step 3: Verify no stale references remain**

Run:
```bash
cd steel-etl && grep -rn "scc:[^)]*\b\(minion\|champion\)\.[a-z]*\.statblock/\|scc:[^)]*\brival\.summoner" "input/summoner/Draw Steel Summoner.md"
```
Expected: no output (no remaining links to the old roots).

- [ ] **Step 4: Commit** (steel-etl repo)

```bash
cd steel-etl && git add "input/summoner/Draw Steel Summoner.md" && git commit -m "fix: repoint 2 summoner scc links to monster.* family"
```

---

## Task 4: Regenerate + verify the re-mint

**Files:** none edited; runs the pipeline and inspects output.

- [ ] **Step 1: Diff the classification before regenerating**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl classify --book summoner --diff'`
Expected: old `minion.*`/`champion.*`/`rival.summoner.*` codes shown as removed; new `monster.minion.summoner.*`/`monster.champion.summoner.*`/`monster.rivals.*` codes shown as added. No other book's codes appear.

- [ ] **Step 2: Run the full multi-book pipeline (resets + self-prunes the registry)**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all'`
Expected: completes without error. (`gen --all` resets the registry up front and cleans output dirs, so old `minion/`/`champion/`/`rival/` output trees are removed.)

- [ ] **Step 3: Confirm new codes in generated data + old roots gone**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
ls data/data-summoner/en/md-linked/ | grep -E '^(minion|champion|rival)$' && echo "STALE ROOTS PRESENT" || echo "old roots gone"
grep -h '^scc:' data/data-summoner/en/md-linked/monster/minion/summoner/demon/statblock/rasquine.md
grep -h '^scc:' data/data-summoner/en/md-linked/monster/rivals/2nd-echelon/statblock/rival-summoner.md
grep -h '^scc:' data/data-summoner/en/md-linked/monster/rivals/2nd-echelon/summoner/minion/skeleton.md
```
Expected: "old roots gone"; codes `mcdm.summoner.v1/monster.minion.summoner.demon.statblock/rasquine`, `…/monster.rivals.2nd-echelon.statblock/rival-summoner`, `…/monster.rivals.2nd-echelon.summoner.minion/skeleton`.

- [ ] **Step 4: Validate links resolve**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl validate --book summoner'`
Expected: no unresolvable-link warnings for the two repointed links (no `WARN:` referencing iron-reaver / avatar-of-death).

- [ ] **Step 5: Commit regenerated data** (each affected `data/data-*` is its own sub-repo)

```bash
cd /home/scott/code/steelCompendium/workspace/data/data-summoner && git add -A && git commit -m "chore: regen summoner data — statblocks under monster.* family"
```
(If `data-bestiary`/others show diffs from `gen --all`, commit those in their repos too; expected to be no-ops unless stale.)

---

## Task 5: Build the v2 site + verify Browse placement

The site Go code needs no functional change: `bestiaryGroupParents`, `pathHasSegment`, and `usesFolderIndex` all still match the `minion`/`champion`/`rival` segments now nested under `monster/`, and `hoistStatblockPath` keys off `parts[0]=="monster"`. Only dead top-level includes are removed.

**Files:**
- Modify: `v2/site.yaml`

- [ ] **Step 1: Remove the dead top-level Browse includes**

In `v2/site.yaml`, in the Browse section `include:` list, delete these four lines and update the preceding comment:

```yaml
      # Summoner book statblock trees (portfolio minions/fixtures/champions +
      # the rival summoner) reuse the same bestiary cards as monster/retainer.
      - minion/
      - fixture/
      - champion/
      - rival/
```

Replace with a single updated comment (no includes — these all route through `monster/`):

```yaml
      # Summoner portfolio minions/champions, fixtures, and the rival summoner
      # all live under monster.* now (folded in via StatblockParser), so they
      # arrive through the monster/ include above — no separate top-level trees.
```

- [ ] **Step 2: Build the site**

Run: `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'`
Expected: completes without error.

- [ ] **Step 3: Verify Browse tree — no stale top-level dirs, correct nesting**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
ls v2/docs/Browse/ | grep -E '^(minion|champion|rival|fixture)$' && echo "STALE TOPLEVEL" || echo "no stale toplevel"
ls v2/docs/Browse/monster/minion/summoner/demon/
ls v2/docs/Browse/monster/champion/summoner/demon/
ls v2/docs/Browse/monster/rivals/2nd-echelon/ | grep -E 'rival-summoner|rival-fury|summoner'
ls v2/docs/Browse/monster/rivals/2nd-echelon/summoner/minion/
```
Expected: "no stale toplevel"; rasquine page under minion tree; champion page present; `rival-summoner` AND `rival-fury` both directly under `monster/rivals/2nd-echelon/` plus a `summoner/` subdir; skeleton page under `…/summoner/minion/`.

- [ ] **Step 4: Spot-check rendered pages render as statblock cards (not raw)**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
grep -l 'sb-wrap' v2/docs/Browse/monster/minion/summoner/demon/*.md v2/docs/Browse/monster/rivals/2nd-echelon/summoner/minion/*.md
```
Expected: the moved statblock pages contain rendered `.sb-wrap` markup. If a moved tree renders as a bare/broken index instead, inspect `internal/site/cards.go` / `bestiary_cards.go` for the extra nesting depth (`monster/minion/summoner/<portfolio>` is one level deeper than Monsters-book groups) and adjust, then re-run Steps 2–4.

- [ ] **Step 5: Commit** (v2 repo)

```bash
cd v2 && git add site.yaml docs/Browse && git commit -m "feat: route summoner statblocks through monster/ Browse tree"
```
(Confirm whether generated `docs/Browse` is committed in this repo per its convention; if it's gitignored/CI-built, commit only `site.yaml`.)

---

## Task 6: Documentation

**Files:**
- Modify: `docs/scc-log.md` (workspace)
- Modify: `CLAUDE.md` (workspace)
- Modify: `steel-etl/docs/statblocks.md`

- [ ] **Step 1: Add a dated `docs/scc-log.md` entry**

Prepend a `## 2026-06-14 — Summoner minions/champions/rivals → monster.* family` entry: state the old→new code shapes (minion `minion.<portfolio>.statblock` → `monster.minion.summoner.<portfolio>.statblock`; champion analog; rival NPC `rival.summoner.<echelon>.statblock` → `monster.rivals.<echelon>.statblock`; summons → `monster.rivals.<echelon>.summoner.minion`), note `freeze:false` + 2 inbound links repointed, the Go-side `StatblockParser` mapping, and that retainers are explicitly out of scope (Plan 6). Link the spec `docs/superpowers/specs/2026-06-14-summoner-statblocks-into-monster-family-design.md`.

- [ ] **Step 2: Update the SCC current-state bullets in workspace `CLAUDE.md`**

In the SCC section, extend the "moved under monster" narrative (currently companions + fixtures) to include the summoner minions/champions/rivals, and update the linking line if registry counts shift. Mention the rival-summoner NPC sits beside the Monsters-book rivals.

- [ ] **Step 3: Note the mapping in `steel-etl/docs/statblocks.md`**

Add the summoner minion/champion/rival domain→`monster.*` mapping and the rival NPC-vs-summons split (organization `Minion` → `summoner.minion` leaf) to the statblocks reference, beside the existing fixture (Plan 5c) note.

- [ ] **Step 4: Commit docs** (workspace repo for scc-log + CLAUDE.md; steel-etl repo for statblocks.md)

```bash
cd /home/scott/code/steelCompendium/workspace && git add docs/scc-log.md CLAUDE.md docs/superpowers/specs/2026-06-14-summoner-statblocks-into-monster-family-design.md docs/superpowers/plans/2026-06-14-summoner-statblocks-into-monster-family.md && git commit -m "docs: summoner statblocks → monster.* family (scc-log, CLAUDE, spec, plan)"
cd steel-etl && git add docs/statblocks.md && git commit -m "docs: note summoner minion/champion/rival monster.* mapping"
```

---

## Self-Review notes

- **Spec coverage:** minion mapping (Task 1), champion mapping (Task 1), rival NPC + summons split (Task 2), inbound-link repoint (Task 3), re-mint verification incl. `classify --diff`/`validate`/no-orphans (Task 4), site.yaml cleanup + Browse-placement verification incl. rival-NPC-beside-Monsters-rivals (Task 5), docs incl. scc-log/CLAUDE/statblocks + retainers-out-of-scope (Task 6). All spec sections covered.
- **Type consistency:** `compactPath` returns `[]string`; tests compare `strings.Join(got.TypePath, "/")`. Detection uses `fm["organization"].(string) == "Minion"`, which the parser populates before line 129 (verified against generated data: summons `organization: Minion`, rival NPC `organization: Elite`).
- **Empirical fallback:** the site-rendering depth risk (one level deeper than Monsters-book groups) is handled by Task 5 Step 4's explicit check + remediation pointer rather than a speculative pre-written edit, since the site code is expected to need no change.

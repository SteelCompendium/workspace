# Monster Category Slug Singularization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-slug every Monsters-book monster category to singular (`monster.goblins.statblock` → `monster.goblin.statblock`) before the SCC registry is frozen, so the monster family matches spec §7.2 and the rest of the `monster.*` family.

**Architecture:** The category slug is derived in one place — `MonsterParser` reads each group's `@category` annotation and seeds it as context for the group landing **and** its statblocks. So 30 creature families are a pure source-annotation change (edit the existing `@category` value). The 31st slug, `rivals → rival`, is special: its path is hardcoded in three Go files (`monster.go`, `summoner_provenance.go`, `rival_summons.go`) because the Monsters-book rivals tree and the Summoner-book rival-summoner share it — those literals and their tests change in lockstep. Then re-mint the (unfrozen) registry with `gen --all` and update docs.

**Tech Stack:** Go (steel-etl, a git submodule), annotated markdown source, `just` recipes, devbox toolchain. SCC registry `classification.json` is generated + gitignored (`freeze: false`).

**Repo split (important):** Source `.md`, the three Go files, the five `*_test.go` files, and `docs/statblocks.md` live in the **steel-etl submodule** (own remote `origin` → `SteelCompendium/steel-etl`, branch `main`). `docs/scc-log.md`, `docs/scc-reference.md`, `reference/scc-specification.md`, and this plan/spec live in the **workspace** repo, which records a `chore: bump steel-etl to <sha>` submodule pointer. Read `docs/git-workflow.md` before committing/pushing.

**Spec:** `docs/superpowers/specs/2026-06-16-monster-category-slug-singularization-design.md`

---

## Pre-flight

- [ ] **Step 0: Confirm toolchain + clean baseline**

From the workspace root (`/home/vexa/code/steel_compendium/workspace`):

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/content/... ./internal/site/... 2>&1 | tail -5'
```

Expected: build succeeds, tests PASS. This is the green baseline before any change.

---

## Task 1: Singularize the `rivals` slug (rival) — code + source + tests, atomic

The Monsters-book `## Rivals` group and the Summoner rival-summoner share one tree
(`monster.rivals.<echelon>.statblock`). The group's category comes from the source
`@category` annotation; the Summoner rival-summoner path comes from hardcoded Go literals.
**Both halves must flip to `rival` in the same commit** or the tree splits in two
(`monster.rival/...` vs `monster.rivals/...`).

**Files:**
- Modify: `steel-etl/input/monsters/Draw Steel Monsters.md:17277` (the `@category: rivals` annotation)
- Modify: `steel-etl/internal/content/monster.go:163-170`
- Modify: `steel-etl/internal/site/summoner_provenance.go:35-43`
- Modify: `steel-etl/internal/site/rival_summons.go:82`
- Modify (comment only): `steel-etl/internal/content/feature.go:31`
- Test: `steel-etl/internal/content/monster_test.go`, `steel-etl/internal/site/summoner_provenance_test.go`, `steel-etl/internal/site/rival_summons_test.go`, `steel-etl/internal/site/statblock_page_test.go`, `steel-etl/internal/site/bestiary_cards_test.go`

- [ ] **Step 1: Update the test expectations to `rival` (RED)**

In `steel-etl/internal/content/monster_test.go`, `TestStatblockParser_SummonerRival` asserts the old paths (lines 276–277):

```go
		{"npc", "Rival Summoner", npcBody, "monster/rivals/2nd-echelon/statblock"},
		{"summon", "Skeleton", summonBody, "monster/rivals/2nd-echelon/summoner/minion"},
```

Change them to:

```go
		{"npc", "Rival Summoner", npcBody, "monster/rival/2nd-echelon/statblock"},
		{"summon", "Skeleton", summonBody, "monster/rival/2nd-echelon/summoner/minion"},
```

Then flip every remaining `rivals` path literal in the four site test files. Inspect and edit each:

```bash
cd steel-etl
grep -nE 'monster[./]rivals' internal/site/summoner_provenance_test.go internal/site/rival_summons_test.go internal/site/statblock_page_test.go internal/site/bestiary_cards_test.go
```

For each hit, replace the path segment `rivals` → `rival` (i.e. `monster/rivals` → `monster/rival` and `monster.rivals` → `monster.rival`) in the **expectation/fixture strings**. These are pure-rename edits; do them by hand from the grep output so you don't touch unrelated text. (The `rival_summons.go` directory-scan fixtures build `monster/rivals/<echelon>/...` paths — those become `monster/rival/...`.)

- [ ] **Step 2: Run the tests to verify they FAIL**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/... ./internal/site/... 2>&1 | tail -20'
```

Expected: FAIL. Failures show the code still emits `monster/rivals/...` while tests now expect `monster/rival/...` (e.g. `TestStatblockParser_SummonerRival`, the provenance + summons tests).

- [ ] **Step 3: Flip the source annotation**

In `steel-etl/input/monsters/Draw Steel Monsters.md`, line 17277:

```html
<!-- @type: monster | @category: rivals -->
```

becomes:

```html
<!-- @type: monster | @category: rival -->
```

- [ ] **Step 4: Flip the Go literals**

In `steel-etl/internal/content/monster.go`, the `case "rival":` block (lines 162–171). Update both `compactPath` literals and the explanatory comment:

```go
	case "rival":
		// The Rival Summoner NPC sits beside the Monsters-book rivals
		// (monster.rival.<echelon>.statblock); its minion summons nest under
		// monster.rival.<echelon>.summoner.minion. The source @category
		// ("summoner") is dropped; @subcategory is the echelon.
		if org, _ := fm["organization"].(string); org == "Minion" {
			typePath = compactPath("monster", "rival", subcategory, "summoner", "minion")
		} else {
			typePath = compactPath("monster", "rival", subcategory, "statblock")
		}
```

In `steel-etl/internal/site/summoner_provenance.go`, both `case` guards (lines 36 and 42) match `seg[1] == "rivals"`. Change each to `seg[1] == "rival"`, and update the path comments (lines 11–18, 35, 41) from `monster.rivals.*` to `monster.rival.*`.

In `steel-etl/internal/site/rival_summons.go`, line 82:

```go
	rivalsDir := filepath.Join(sectionDir, "monster", "rivals")
```

becomes:

```go
	rivalsDir := filepath.Join(sectionDir, "monster", "rival")
```

Update the surrounding `monster/rivals` comments (lines 40, 77) to `monster/rival`.

In `steel-etl/internal/content/feature.go`, line 31, update the prose comment `monster.rivals.<echelon>.statblock` → `monster.rival.<echelon>.statblock` (accuracy only).

- [ ] **Step 5: Run the tests to verify they PASS (GREEN)**

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test -race ./internal/content/... ./internal/site/... 2>&1 | tail -20'
```

Expected: build OK, all tests PASS.

- [ ] **Step 6: Commit (in the steel-etl submodule)**

```bash
cd steel-etl
git add input/monsters/"Draw Steel Monsters.md" internal/content/monster.go internal/content/feature.go internal/site/summoner_provenance.go internal/site/rival_summons.go internal/content/monster_test.go internal/site/summoner_provenance_test.go internal/site/rival_summons_test.go internal/site/statblock_page_test.go internal/site/bestiary_cards_test.go
git commit -m "refactor: singularize rivals monster slug (rivals -> rival)"
```

---

## Task 2: Singularize the 30 creature-family `@category` annotations

Each Monsters-book group already carries an explicit `@category` annotation, so this is a
value edit on 30 unique lines. No parser behavior changes (the slug passes through), so
there is no failing unit test to write — verification is the re-mint in Task 3. The
illustrative species unit tests are updated here for corpus consistency (they stay green).

**Files:**
- Modify: `steel-etl/input/monsters/Draw Steel Monsters.md` (30 `@category` lines)
- Modify: `steel-etl/internal/content/monster_test.go` (illustrative `goblins`/`basilisks` fixtures)

- [ ] **Step 1: Rewrite the 30 plural `@category` values to singular**

From the workspace root, run this anchored substitution (each pattern matches the full
annotation tail ` @category: <plural> -->`, so there is no risk of touching prose):

```bash
F='steel-etl/input/monsters/Draw Steel Monsters.md'
perl -i -pe '
  s/\@category: angulotls -->/\@category: angulotl -->/;
  s/\@category: animals -->/\@category: animal -->/;
  s/\@category: basilisks -->/\@category: basilisk -->/;
  s/\@category: bugbears -->/\@category: bugbear -->/;
  s/\@category: demons -->/\@category: demon -->/;
  s/\@category: devils -->/\@category: devil -->/;
  s/\@category: draconians -->/\@category: draconian -->/;
  s/\@category: dragons -->/\@category: dragon -->/;
  s/\@category: dwarves -->/\@category: dwarf -->/;
  s/\@category: elementals -->/\@category: elemental -->/;
  s/\@category: elves-high -->/\@category: elf-high -->/;
  s/\@category: elves-shadow -->/\@category: elf-shadow -->/;
  s/\@category: elves-wode -->/\@category: elf-wode -->/;
  s/\@category: giants -->/\@category: giant -->/;
  s/\@category: gnolls -->/\@category: gnoll -->/;
  s/\@category: goblins -->/\@category: goblin -->/;
  s/\@category: griffons -->/\@category: griffon -->/;
  s/\@category: hobgoblins -->/\@category: hobgoblin -->/;
  s/\@category: humans -->/\@category: human -->/;
  s/\@category: kobolds -->/\@category: kobold -->/;
  s/\@category: lightbenders -->/\@category: lightbender -->/;
  s/\@category: minotaurs -->/\@category: minotaur -->/;
  s/\@category: ogres -->/\@category: ogre -->/;
  s/\@category: orcs -->/\@category: orc -->/;
  s/\@category: radenwights -->/\@category: radenwight -->/;
  s/\@category: time-raiders -->/\@category: time-raider -->/;
  s/\@category: trolls -->/\@category: troll -->/;
  s/\@category: voiceless-talkers -->/\@category: voiceless-talker -->/;
  s/\@category: war-dogs -->/\@category: war-dog -->/;
  s/\@category: wyverns -->/\@category: wyvern -->/;
' "$F"
```

- [ ] **Step 2: Verify exactly 30 group annotations changed and none were missed**

```bash
cd steel-etl
# No plural creature-family @category values should remain (rival already done in Task 1):
grep -nE '@category: (angulotls|animals|basilisks|bugbears|demons|devils|draconians|dragons|dwarves|elementals|elves-|giants|gnolls|goblins|griffons|hobgoblins|humans|kobolds|lightbenders|minotaurs|ogres|orcs|radenwights|time-raiders|trolls|voiceless-talkers|war-dogs|wyverns) -->' input/monsters/"Draw Steel Monsters.md" || echo "OK: no plural family slugs remain"
# Spot-check a few singulars are present:
grep -nE '@category: (goblin|dragon|war-dog|elf-high|voiceless-talker) -->' input/monsters/"Draw Steel Monsters.md"
```

Expected: the first command prints `OK: no plural family slugs remain`; the second lists the singular annotations.

- [ ] **Step 3: Update the illustrative species unit tests to singular (stays green)**

In `steel-etl/internal/content/monster_test.go`, the manually-pushed fixtures use
`goblins`/`basilisks`. These pass regardless (the parser just passes the value through),
but update them so the test corpus reflects the new canonical slugs:

- `TestStatblockParser` (≈ lines 26, 37): `ctx.Push(2, map[string]string{"category": "goblins"})` → `"goblin"`, and the expected `"monster/goblins/statblock"` → `"monster/goblin/statblock"`.
- `TestMonsterParser` (≈ lines 62, 70, 73): the `@category: goblins` annotation, `ItemID` `"goblins"`, and `TypePath` comment → `goblin`.
- `TestFeatureblockParser` (≈ lines 89, 99): `ctx.Push(... "category": "goblins")` and `"monster/goblins"` → `goblin`.
- `TestFeatureblockParser_Metadata` (≈ line 182): `ctx.Push(... "category": "basilisks")` → `"basilisk"`.

```bash
grep -nE 'goblins|basilisks' internal/content/monster_test.go   # find each occurrence to edit
```

- [ ] **Step 4: Run the content tests (still GREEN)**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/content/... 2>&1 | tail -10'
```

Expected: PASS.

- [ ] **Step 5: Commit (in the steel-etl submodule)**

```bash
cd steel-etl
git add input/monsters/"Draw Steel Monsters.md" internal/content/monster_test.go
git commit -m "feat: singularize monster category slugs (30 creature families)"
```

---

## Task 3: Re-mint the registry and verify the new codes

`freeze: false`, and `gen --all` resets the registry up front (`resetRegistryForRebuild`)
so it self-prunes orphaned plural codes. Run it twice: the second pass resolves in-prose
`scc:` links against the now-complete re-slugged registry (the established
baseline-reset / gen-twice convention).

**Files:** none edited — this regenerates `steel-etl/classification.json` (gitignored) and the `data/` output (gitignored locally; published by deploy).

- [ ] **Step 1: Regenerate (twice)**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all && go run ./cmd/steel-etl gen --config pipeline.yaml --all' 2>&1 | tail -15
```

Expected: two clean pipeline runs, no `freeze` errors. Note any residual `WARN:` lines about unresolvable `scc:` links (see Step 3).

- [ ] **Step 2: Assert no plural monster codes remain, and new singular codes exist**

```bash
cd steel-etl
# Should print nothing (no stragglers):
grep -oE '"mcdm\.monsters\.v1/monster\.(goblins|orcs|dragons|demons|devils|dwarves|war-dogs|giants|humans|elves-[a-z]+|animals|trolls|ogres|kobolds|gnolls|hobgoblins|bugbears|basilisks|griffons|wyverns|draconians|elementals|minotaurs|angulotls|radenwights|lightbenders|time-raiders|voiceless-talkers|rivals)[^"]*"' classification.json && echo "!! PLURAL CODES STILL PRESENT" || echo "OK: no plural monster codes"
# New singular codes present (sample):
grep -oE '"mcdm\.monsters\.v1/monster\.(goblin|dragon|war-dog|elf-high|rival)\.[^"]*"' classification.json | sort -u | head
```

Expected: `OK: no plural monster codes`, and the sample lists singular codes such as `monster.goblin.statblock/worg`, `monster.war-dog.1st-echelon.statblock/...`, `monster.rival.4th-echelon.statblock/rival-fury`.

- [ ] **Step 3: Confirm the rivals tree is unified and link warnings are benign**

```bash
cd steel-etl
# rival-fury (Monsters) and rival-summoner (Summoner) must both live under monster.rival:
grep -oE '"[^"]*monster\.rival\.[^"]*(rival-fury|rival-summoner)[^"]*"' classification.json
# Re-run gen capturing warnings; any unresolved scc: links should NOT reference monster.<plural>:
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all 2>&1 1>/dev/null | grep -i "WARN" || echo "no warnings"'
```

Expected: both rival statblocks resolve under `monster.rival.*`; warnings (if any) do not name a `monster.<plural>` target. If a warning *does* name a plural monster path, a source `scc:` link still points at an old slug — grep the inputs for it and fix, then re-run.

---

## Task 4: Update current-state documentation

Historical (dated) plans/specs stay frozen; only update the living docs.

**Files:**
- Modify: `docs/scc-log.md` (workspace)
- Modify: `docs/scc-reference.md` (workspace)
- Modify: `reference/scc-specification.md` (workspace)
- Modify: `steel-etl/docs/statblocks.md` (submodule)

- [ ] **Step 1: Append a dated entry to `docs/scc-log.md`**

Add a new section at the end (match the existing `## YYYY-MM-DD — title` format):

```markdown
## 2026-06-16 — monster category slugs singularized (pre-freeze re-mint)

The Monsters-book monster-group category segment is now always **singular**
(`monster.goblins.statblock` → `monster.goblin.statblock`, group landing
`monster.group/goblins` → `monster.group/goblin`), matching spec §7.2 and the rest of the
`monster.*` family (`companion`/`fixture`/`minion`/`champion` + portfolios were already
singular). 31 group slugs re-minted (30 creature families via their `@category`
annotations; `rivals → rival` also touched the hardcoded path in `monster.go`,
`summoner_provenance.go`, and `rival_summons.go`). Plural names survive only as page
**titles**. Registry was `frozen: false`, so this was a clean re-mint with **no aliases**;
the live site's old plural URLs stop resolving. Code count unchanged (~3,015). Summoner /
beastheart / fixture families untouched. Spec + plan:
`docs/superpowers/{specs/2026-06-16-monster-category-slug-singularization-design.md,plans/2026-06-16-monster-category-slug-singularization.md}`.
```

- [ ] **Step 2: Note singular category in `docs/scc-reference.md`**

In the "Group landings" section, append a sentence:

```markdown
For monster groups the `<member>` slug is **singular** (`monster.group/goblin`), the same
canonical slug used by the group's statblock category (`monster.goblin.statblock/<id>`);
the plural group name ("Goblins") is preserved only as the page title.
```

Confirm the registry count line still reads ~3,015 (the re-mint re-slugs codes but does not change their number) and leave it unchanged.

- [ ] **Step 3: Clarify §7.2 and fix the plural examples in `reference/scc-specification.md`**

In §7.2 ("Singular Type Names"), append:

```markdown
This includes the monster category segment: `monster.goblin.statblock/<id>`, never
`monster.goblins.…`. The plural group name from the sourcebook survives only as the page
display title, never in the code.
```

In the §2.2 Type Taxonomy table and §2.4 examples, change the plural monster samples to
singular with the `.statblock` segment, e.g. `mcdm.monsters.v1/monster.ogres/ogre-warrior`
→ `mcdm.monsters.v1/monster.ogre.statblock/ogre-warrior`.

- [ ] **Step 4: Update current-state `monster.rivals.*` references in `steel-etl/docs/statblocks.md`**

```bash
cd steel-etl
grep -nE 'monster[./]rivals' docs/statblocks.md
```

For each current-state hit (the rival-summoner reuse section, ≈ lines 104, 229, 230, 235),
change `monster.rivals` → `monster.rival` / `monster/rivals` → `monster/rival`. Leave any
genuinely historical narration intact, but these describe live behavior — update them.

- [ ] **Step 5: Commit docs (two repos)**

```bash
# steel-etl submodule:
cd steel-etl && git add docs/statblocks.md && git commit -m "docs: monster category slug now singular (rivals -> rival)"
# workspace repo:
cd .. && git add docs/scc-log.md docs/scc-reference.md reference/scc-specification.md && git commit -m "docs: record monster category slug singularization"
```

---

## Task 5: Bump the submodule, then deploy (publish gate)

- [ ] **Step 1: Push steel-etl and record the submodule bump**

```bash
cd steel-etl
git log --oneline origin/main..HEAD          # review the 3 steel-etl commits
git push origin HEAD:main                     # or open a PR per docs/git-workflow.md
etl_sha="$(git rev-parse --short HEAD)"
cd ..
git add steel-etl
git commit -m "chore: bump steel-etl to ${etl_sha} (monster category slugs singular)"
```

- [ ] **Step 2: Final full build before publishing**

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./... 2>&1 | tail -5'
```

Expected: build OK, all tests PASS.

- [ ] **Step 3: Deploy (OUTWARD-FACING — confirm before running)**

`just deploy` regenerates and **pushes to the live data repos, the org SCC-API repo, and the v2 site**, replacing the old plural URLs. This is the publish point — get explicit go-ahead before running it.

```bash
devbox run -- just deploy
```

- [ ] **Step 4: Post-deploy spot-check**

After the v2 site rebuilds, verify a sample of re-slugged pages resolve and a removed
plural URL is gone:

- `…/scc/mcdm.monsters.v1/monster.goblin.statblock/worg/` → resolves to the worg page.
- `…/scc/mcdm.monsters.v1/monster.group/goblin/` → the "Goblins" group landing (title still plural).
- `…/scc/mcdm.monsters.v1/monster.rival.4th-echelon.statblock/rival-fury/` → resolves; its "Summons" card still renders.
- A Summoner rival-summoner page still shows its provenance eyebrow ("Rival Summoner · Echelon N").
- The old `…/monster.goblins.statblock/worg/` no longer resolves (expected — clean re-mint, no aliases).

---

## Notes for the executor

- **Devbox:** Go is not on PATH. Every Go/just command runs under `devbox run -- …` from the workspace root; `go.mod` is in `steel-etl/`, hence the `bash -c 'cd steel-etl && …'` wrapper.
- **Two repos:** keep steel-etl commits (source/code/tests/statblocks.md) separate from workspace commits (scc-log/scc-reference/scc-specification + the submodule bump). The spec was already committed to the workspace on branch `scc/monster-category-singularize`.
- **`classification.json` and `data/` are gitignored** — never commit them from steel-etl/workspace; `just deploy` publishes the regenerated `data/` to the separate data repos.
- **No aliases by design** — do not add `monster.<plural>` → `monster.<singular>` entries to the registry; the re-mint is clean (pre-freeze).
</content>

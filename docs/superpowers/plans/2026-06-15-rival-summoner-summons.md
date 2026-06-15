# Rival Summoner ⇄ Summons Cross-References Implementation Plan

## Status

**Done (2026-06-15)** — shipped via subagent-driven development on branch
`feat/rival-summoner-summons` (merged to `main` + deployed). steel-etl commits:
`ff9bb11` (`rivalSummonsCards`), `f3f3a28` (`augmentRivalSummonerPages`), `d380ea4`
(wired into `Build`), `04b5ef0` (docs); v2: `5f3664a` (`.sb-backlink` CSS) + regenerated
Browse. Full test suite green, final cross-repo review passed. All four echelons render a
`## Summons` block; each summon back-links to its Rival Summoner; Monsters-book rivals are
untouched. No SCC/schema/data change. Docs: steel-etl `docs/site-builder.md` +
`docs/statblocks.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the v2 site, append a `## Summons` block of rich statblock cards to each Rival Summoner page and a back-link to its Rival Summoner on each summon page, derived from the Browse directory tree.

**Architecture:** A new post-write pass `augmentRivalSummonerPages(sectionDir)` in `steel-etl/internal/site/` runs after page + index generation (so sibling summon pages exist on disk). For each `monster/rivals/<echelon>/` that has a `summoner/minion/` subdir, it detects the conjurer page (summoner-book scc + `organization != Minion`), appends a `## Summons` card grid (via a new `rivalSummonsCards` helper that reuses the existing per-card renderer), and prepends a back-link to each summon page. No SCC/schema/data change.

**Tech Stack:** Go (steel-etl), `go test`, the `steel-etl site` CLI, devbox toolchain; one small CSS rule in v2.

**Repo layout:** All Go work is in the **steel-etl** repo; the `.sb-backlink` CSS is in the **v2** repo; the plan/spec/docs are in the **workspace** repo. Do the work on a new branch `feat/rival-summoner-summons` off `main` in each repo touched (steel-etl, v2, workspace).

**Devbox reminder:** Go is not on PATH. Run Go/CLI commands as `devbox run -- bash -c 'cd steel-etl && <cmd>'` from the workspace root.

**Branch setup (do once before Task 1):**
```bash
cd /home/scott/code/steelCompendium/workspace
for r in steel-etl v2 .; do git -C "$r" checkout main && git -C "$r" pull --ff-only origin main && git -C "$r" checkout -b feat/rival-summoner-summons; done
```

---

## File Structure

| File | Repo | Responsibility | Change |
|---|---|---|---|
| `steel-etl/internal/site/rival_summons.go` | steel-etl | New: `rivalSummonsCards` helper + `augmentRivalSummonerPages` pass + `findRivalSummonerPage` | Create |
| `steel-etl/internal/site/rival_summons_test.go` | steel-etl | New: unit tests for the helper + the pass | Create |
| `steel-etl/internal/site/build.go` | steel-etl | Call the pass from `Build` after `generateIndexPages` (~line 94) | Modify |
| `v2/docs/stylesheets/steel-statblock.css` | v2 | `.sb-backlink` style | Modify |
| `steel-etl/docs/site-builder.md` | steel-etl | Document the pass | Modify |
| `steel-etl/docs/statblocks.md` | steel-etl | Cross-reference note | Modify |

Reused (unchanged): `statblockCard`, `bestiaryLeafCard`, `readFile`, `splitFrontmatter`, `parseFrontmatterField`, `naturalLess`, `fileToTitle`, `echelonDirRe` (all in `internal/site/`).

---

## Task 1: `rivalSummonsCards` helper

A card-grid renderer like `statblockCards`, but with the file-read directory **separate** from the href base (the existing `statblockCards` joins `dir/relPrefix/f` for *both* reading and href, so it can't take a `../` href prefix without corrupting the read path).

**Files:**
- Create: `steel-etl/internal/site/rival_summons.go`
- Create (test): `steel-etl/internal/site/rival_summons_test.go`

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/rival_summons_test.go`:

```go
package site

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const summonSkeletonFM = `keywords:
    - Undead
level: 1
name: Skeleton
organization: Minion
role: Harrier
size: 1S
speed: 6
type: statblock
scc: mcdm.summoner.v1/monster.rivals.2nd-echelon.summoner.minion/skeleton
`

const summonGraveKnightFM = `keywords:
    - Undead
name: Grave Knight
organization: Minion
role: Brute
size: 1M
speed: 6
type: statblock
scc: mcdm.summoner.v1/monster.rivals.2nd-echelon.summoner.minion/grave-knight
`

func TestRivalSummonsCards(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "skeleton.md"), []byte("---\n"+summonSkeletonFM+"---\n\nbody\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "grave-knight.md"), []byte("---\n"+summonGraveKnightFM+"---\n\nbody\n"), 0644); err != nil {
		t.Fatal(err)
	}

	got := rivalSummonsCards(dir, "../summoner/minion", []string{"skeleton.md", "grave-knight.md"})
	for _, want := range []string{
		`<div class="sc-cards">`,
		`href="../summoner/minion/skeleton/"`,      // href base applied, .md → dir URL
		`href="../summoner/minion/grave-knight/"`,
		`<div class="sc-card__name">Skeleton</div>`,
		`<div class="sc-card__name">Grave Knight</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("rivalSummonsCards missing %q in:\n%s", want, got)
		}
	}
	// natural sort: grave-knight before skeleton.
	if strings.Index(got, "Grave Knight") > strings.Index(got, "Skeleton") {
		t.Errorf("cards not natural-sorted:\n%s", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestRivalSummonsCards -v'`
Expected: FAIL — `undefined: rivalSummonsCards`

- [ ] **Step 3: Write minimal implementation**

Create `steel-etl/internal/site/rival_summons.go`:

```go
package site

import (
	"fmt"
	"html"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// rivalSummonsCards renders the statblock .md files in readDir as a .sc-cards
// grid. Unlike statblockCards, the file-read directory (readDir) is separate from
// the href base (hrefBase, relative to the page embedding the cards) so the block
// can be placed on a page that is not the files' parent index — e.g. the Rival
// Summoner page, one level above its summons' echelon index.
func rivalSummonsCards(readDir, hrefBase string, files []string) string {
	if len(files) == 0 {
		return ""
	}
	sort.Slice(files, func(i, j int) bool { return naturalLess(files[i], files[j]) })
	var sb strings.Builder
	sb.WriteString("<div class=\"sc-cards\">\n")
	for _, f := range files {
		fm, body := splitFrontmatter(readFile(filepath.Join(readDir, f)))
		name := parseFrontmatterField(fm, "name")
		if name == "" {
			name = fileToTitle(f)
		}
		href := filepath.ToSlash(filepath.Join(hrefBase, f))
		sb.WriteString(bestiaryLeafCard(readDir, fm, body, href, name))
	}
	sb.WriteString("</div>\n")
	return sb.String()
}
```

(The `fmt`/`html`/`os` imports are used by `augmentRivalSummonerPages` in Task 2; add them now so the file compiles after Task 2. If Go complains about unused imports at this step, temporarily drop `fmt`/`html`/`os` and re-add them in Task 2 Step 3.)

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestRivalSummonsCards -v'`
Expected: PASS

- [ ] **Step 5: Commit** (steel-etl repo)

```bash
cd steel-etl && git add internal/site/rival_summons.go internal/site/rival_summons_test.go && git commit -m "feat: rivalSummonsCards — card grid with separate read-dir and href base"
```

---

## Task 2: `augmentRivalSummonerPages` pass

The pass: for each `monster/rivals/<echelon>/` with a `summoner/minion/` subdir, append `## Summons` (forward) to the conjurer page and a back-link (back) to each summon page. Idempotent.

**Files:**
- Modify: `steel-etl/internal/site/rival_summons.go`
- Modify (test): `steel-etl/internal/site/rival_summons_test.go`

- [ ] **Step 1: Write the failing test**

Append to `steel-etl/internal/site/rival_summons_test.go`:

```go
// rivalSummonerFM is a summoner-book conjurer (organization Elite, not Minion).
const rivalSummonerFM = `name: Rival Summoner
organization: Elite
role: Controller
type: statblock
scc: mcdm.summoner.v1/monster.rivals.2nd-echelon.statblock/rival-summoner
`

// rivalFuryFM is a co-located Monsters-book rival — must NOT get a summons block.
const rivalFuryFM = `name: Rival Fury
organization: Solo
role: Brute
type: statblock
scc: mcdm.monsters.v1/monster.rivals.2nd-echelon.statblock/rival-fury
`

func writeStatblockPage(t *testing.T, path, frontmatter, name string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	body := "---\n" + frontmatter + "---\n\n# " + name + "\n\n---\n\n" +
		`<div class="sb-wrap" data-creature="x"><article class="sb">stats</article></div>` + "\n"
	if err := os.WriteFile(path, []byte(body), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestAugmentRivalSummonerPages(t *testing.T) {
	sec := t.TempDir()
	ech := filepath.Join(sec, "monster", "rivals", "2nd-echelon")
	writeStatblockPage(t, filepath.Join(ech, "rival-summoner.md"), rivalSummonerFM, "Rival Summoner")
	writeStatblockPage(t, filepath.Join(ech, "rival-fury.md"), rivalFuryFM, "Rival Fury")
	minion := filepath.Join(ech, "summoner", "minion")
	writeStatblockPage(t, filepath.Join(minion, "skeleton.md"), summonSkeletonFM, "Skeleton")
	writeStatblockPage(t, filepath.Join(minion, "grave-knight.md"), summonGraveKnightFM, "Grave Knight")

	n, errs := augmentRivalSummonerPages(sec)
	if len(errs) != 0 {
		t.Fatalf("unexpected errors: %v", errs)
	}
	if n != 3 { // 1 forward (rival-summoner) + 2 back-links (skeleton, grave-knight)
		t.Errorf("augment count = %d, want 3", n)
	}

	rs := readFile(filepath.Join(ech, "rival-summoner.md"))
	for _, want := range []string{
		"## Summons",
		`href="../summoner/minion/skeleton/"`,
		`href="../summoner/minion/grave-knight/"`,
	} {
		if !strings.Contains(rs, want) {
			t.Errorf("rival-summoner page missing %q", want)
		}
	}

	// Monsters-book rival must be untouched.
	if rf := readFile(filepath.Join(ech, "rival-fury.md")); strings.Contains(rf, "## Summons") {
		t.Errorf("rival-fury must not get a Summons block:\n%s", rf)
	}

	// Each summon page gets exactly one back-link to the Rival Summoner.
	sk := readFile(filepath.Join(minion, "skeleton.md"))
	if c := strings.Count(sk, "sb-backlink"); c != 1 {
		t.Errorf("skeleton sb-backlink count = %d, want 1", c)
	}
	if !strings.Contains(sk, `href="../../../rival-summoner/"`) {
		t.Errorf("skeleton missing back-link href:\n%s", sk)
	}
	if !strings.Contains(sk, "Summoned by") {
		t.Errorf("skeleton missing back-link label:\n%s", sk)
	}
	// Back-link sits before the statblock card.
	if strings.Index(sk, "sb-backlink") > strings.Index(sk, `<div class="sb-wrap"`) {
		t.Errorf("back-link should precede the sb-wrap card:\n%s", sk)
	}

	// Idempotent: a second run adds nothing.
	n2, _ := augmentRivalSummonerPages(sec)
	if n2 != 0 {
		t.Errorf("second run count = %d, want 0 (idempotent)", n2)
	}
	if c := strings.Count(readFile(filepath.Join(ech, "rival-summoner.md")), "## Summons"); c != 1 {
		t.Errorf("Summons block duplicated on re-run (count=%d)", c)
	}
}

func TestAugmentRivalSummonerPages_NoTree(t *testing.T) {
	// No monster/rivals dir → no-op, no error.
	n, errs := augmentRivalSummonerPages(t.TempDir())
	if n != 0 || len(errs) != 0 {
		t.Errorf("expected no-op, got n=%d errs=%v", n, errs)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestAugmentRivalSummonerPages -v'`
Expected: FAIL — `undefined: augmentRivalSummonerPages`

- [ ] **Step 3: Write minimal implementation**

Append to `steel-etl/internal/site/rival_summons.go`:

```go
// findRivalSummonerPage returns the conjurer page in an echelon dir: the statblock
// .md file (not index.md) from the summoner book (scc prefix mcdm.summoner.) whose
// organization is not "Minion". This selects the Rival Summoner NPC and ignores the
// co-located Monsters-book rivals (rival-fury, …) and the minion summons.
func findRivalSummonerPage(echelonDir string) (file, name string, ok bool) {
	ents, err := os.ReadDir(echelonDir)
	if err != nil {
		return "", "", false
	}
	for _, e := range ents {
		if e.IsDir() || e.Name() == "index.md" || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		fm, _ := splitFrontmatter(readFile(filepath.Join(echelonDir, e.Name())))
		scc := strings.TrimSpace(parseFrontmatterField(fm, "scc"))
		org := strings.TrimSpace(parseFrontmatterField(fm, "organization"))
		if strings.HasPrefix(scc, "mcdm.summoner.") && org != "Minion" {
			return e.Name(), strings.TrimSpace(parseFrontmatterField(fm, "name")), true
		}
	}
	return "", "", false
}

// listSummonFiles returns the statblock .md files (not index.md) in a summon dir.
func listSummonFiles(summonDir string) []string {
	ents, err := os.ReadDir(summonDir)
	if err != nil {
		return nil
	}
	var files []string
	for _, e := range ents {
		if e.IsDir() || e.Name() == "index.md" || !strings.HasSuffix(e.Name(), ".md") {
			continue
		}
		files = append(files, e.Name())
	}
	return files
}

// augmentRivalSummonerPages adds Rival Summoner ⇄ summons cross-references under
// sectionDir/monster/rivals: a "## Summons" card block on each Rival Summoner page
// and a "Summoned by" back-link on each summon page. Derives the relationship from
// the tree (a Rival Summoner's summons are its sibling summoner/minion/* set), runs
// after pages are written, and is idempotent. Returns the number of pages modified.
func augmentRivalSummonerPages(sectionDir string) (int, []string) {
	rivalsDir := filepath.Join(sectionDir, "monster", "rivals")
	if _, err := os.Stat(rivalsDir); err != nil {
		return 0, nil
	}
	ents, err := os.ReadDir(rivalsDir)
	if err != nil {
		return 0, []string{fmt.Sprintf("read %s: %v", rivalsDir, err)}
	}

	count := 0
	var errs []string
	for _, e := range ents {
		if !e.IsDir() || !echelonDirRe.MatchString(e.Name()) {
			continue
		}
		echelonDir := filepath.Join(rivalsDir, e.Name())
		summonDir := filepath.Join(echelonDir, "summoner", "minion")
		if _, err := os.Stat(summonDir); err != nil {
			continue // echelon with no summoner/minion subtree
		}
		rivalFile, rivalName, ok := findRivalSummonerPage(echelonDir)
		if !ok {
			continue
		}
		summonFiles := listSummonFiles(summonDir)
		if len(summonFiles) == 0 {
			continue
		}
		rivalBase := strings.TrimSuffix(rivalFile, ".md")

		// Forward: append "## Summons" + cards to the Rival Summoner page.
		rivalPath := filepath.Join(echelonDir, rivalFile)
		page := readFile(rivalPath)
		if !strings.Contains(page, "## Summons") {
			cards := rivalSummonsCards(summonDir, "../summoner/minion", summonFiles)
			page = strings.TrimRight(page, "\n") + "\n\n## Summons\n\n" + cards + "\n"
			if err := os.WriteFile(rivalPath, []byte(page), 0644); err != nil {
				errs = append(errs, fmt.Sprintf("write %s: %v", rivalPath, err))
			} else {
				count++
			}
		}

		// Back: prepend a back-link to each summon page (before the .sb-wrap card).
		backlink := fmt.Sprintf(`<p class="sb-backlink">Summoned by <a href="../../../%s/">%s</a></p>`,
			rivalBase, html.EscapeString(rivalName))
		for _, sf := range summonFiles {
			sp := filepath.Join(summonDir, sf)
			spage := readFile(sp)
			if strings.Contains(spage, "sb-backlink") {
				continue
			}
			i := strings.Index(spage, `<div class="sb-wrap"`)
			if i < 0 {
				continue // not a rendered statblock page; nothing to anchor to
			}
			spage = spage[:i] + backlink + "\n\n" + spage[i:]
			if err := os.WriteFile(sp, []byte(spage), 0644); err != nil {
				errs = append(errs, fmt.Sprintf("write %s: %v", sp, err))
			} else {
				count++
			}
		}
	}
	return count, errs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestAugmentRivalSummonerPages -v'`
Expected: PASS (both `TestAugmentRivalSummonerPages` and `_NoTree`)

- [ ] **Step 5: Run the full site package + build**

Run: `devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ && go build ./...'`
Expected: PASS / clean build

- [ ] **Step 6: Commit** (steel-etl repo)

```bash
cd steel-etl && git add internal/site/rival_summons.go internal/site/rival_summons_test.go && git commit -m "feat: augmentRivalSummonerPages — Rival Summoner summons block + summon back-links"
```

---

## Task 3: Wire the pass into `Build`

**Files:**
- Modify: `steel-etl/internal/site/build.go` (in `Build`, right after `generateIndexPages` at ~line 92-94)

- [ ] **Step 1: Add the call**

In `steel-etl/internal/site/build.go`, find:

```go
	indexCount, indexErrs := generateIndexPages(cfg.DocsDir, genericSections)
	result.IndexPages = indexCount
	result.Errors = append(result.Errors, indexErrs...)
```

Insert immediately after it:

```go
	// Rival Summoner ⇄ summons cross-references: a "## Summons" card block on each
	// Rival Summoner page + a back-link on each summon page. Runs after pages and
	// indexes are written (it reads the sibling summon pages from disk). No-op when
	// there is no monster/rivals tree (e.g. Monsters book absent). Scoped to generic
	// sections (the bestiary lives in Browse).
	for _, s := range genericSections {
		if _, rErrs := augmentRivalSummonerPages(filepath.Join(cfg.DocsDir, s.Name)); len(rErrs) > 0 {
			result.Errors = append(result.Errors, rErrs...)
		}
	}
```

- [ ] **Step 2: Build + full test**

Run: `devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./internal/site/'`
Expected: clean build, PASS

- [ ] **Step 3: Commit** (steel-etl repo)

```bash
cd steel-etl && git add internal/site/build.go && git commit -m "feat: run augmentRivalSummonerPages after index generation in site build"
```

---

## Task 4: `.sb-backlink` CSS

**Files:**
- Modify: `v2/docs/stylesheets/steel-statblock.css`

- [ ] **Step 1: Check the file exists and inspect its tokens**

Run: `sed -n '1,15p' /home/scott/code/steelCompendium/workspace/v2/docs/stylesheets/steel-statblock.css`
Expected: the statblock stylesheet (confirms the file path; note any `--sc-*` color vars in use).

- [ ] **Step 2: Append the rule**

Append to `v2/docs/stylesheets/steel-statblock.css`:

```css
/* Back-link from a summon statblock to the Rival Summoner that conjures it
   (steel-etl augmentRivalSummonerPages). Sits above the .sb-wrap card. */
.sb-backlink {
  font-size: 0.85rem;
  font-style: italic;
  margin: 0 0 0.75rem;
  opacity: 0.85;
}
.sb-backlink a {
  font-weight: 600;
}
```

- [ ] **Step 3: Commit** (v2 repo)

```bash
cd v2 && git add docs/stylesheets/steel-statblock.css && git commit -m "feat: .sb-backlink style for summon → Rival Summoner link"
```

---

## Task 5: Build the real site + verify

**Files:** none edited; runs the site builder and inspects output.

- [ ] **Step 1: Regenerate data + build the site**

Run:
```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```
Expected: both complete without error.

- [ ] **Step 2: Verify the Rival Summoner page has the Summons block**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
grep -c '## Summons' v2/docs/Browse/monster/rivals/2nd-echelon/rival-summoner.md
grep -o 'href="\.\./summoner/minion/[a-z-]*/"' v2/docs/Browse/monster/rivals/2nd-echelon/rival-summoner.md | sort -u
```
Expected: `1`; one href per summon (e.g. `href="../summoner/minion/skeleton/"`, `…/grave-knight/`, `…/ceaseless-mournling/`).

- [ ] **Step 3: Verify Monsters-book rivals are untouched + summons have back-links**

Run:
```bash
cd /home/scott/code/steelCompendium/workspace
echo -n "rival-fury has Summons (want 0): "; grep -c '## Summons' v2/docs/Browse/monster/rivals/2nd-echelon/rival-fury.md
echo -n "skeleton back-link (want 1): "; grep -c 'sb-backlink' v2/docs/Browse/monster/rivals/2nd-echelon/summoner/minion/skeleton.md
grep -o 'href="\.\./\.\./\.\./rival-summoner/"' v2/docs/Browse/monster/rivals/2nd-echelon/summoner/minion/skeleton.md
echo "=== all four echelons got a Summons block (want 4) ==="
grep -rl '## Summons' v2/docs/Browse/monster/rivals/*/rival-summoner.md | wc -l
```
Expected: `0`; `1`; the back-link href prints; `4`.

- [ ] **Step 4: Commit regenerated v2 Browse** (v2 repo)

```bash
cd /home/scott/code/steelCompendium/workspace/v2 && git add docs && git commit -m "chore: regenerate Browse with Rival Summoner summons cross-references"
```
(If the v2 repo's convention is to regenerate Browse only at deploy, skip this and let deploy handle it — confirm with the recent v2 git log.)

---

## Task 6: Documentation

**Files:**
- Modify: `steel-etl/docs/site-builder.md`
- Modify: `steel-etl/docs/statblocks.md`

- [ ] **Step 1: Document the pass in `site-builder.md`**

Add a short subsection describing `augmentRivalSummonerPages`: what it matches (`monster/rivals/<echelon>/` with a `summoner/minion/` subdir), the conjurer detection (summoner-book scc + `organization != Minion`, so Monsters-book rivals are skipped), both directions (forward `## Summons` cards via `rivalSummonsCards`; back `sb-backlink`), why it runs post-write (needs sibling summon pages on disk), and that it's idempotent.

- [ ] **Step 2: Cross-reference note in `statblocks.md`**

Near the summoner rival mapping note, add: the Rival Summoner page renders a `## Summons` card block of its `summoner/minion/*` siblings, and each summon links back via `.sb-backlink` (site-only, `augmentRivalSummonerPages`).

- [ ] **Step 3: Commit** (steel-etl repo)

```bash
cd steel-etl && git add docs/site-builder.md docs/statblocks.md && git commit -m "docs: Rival Summoner summons cross-references (site-builder, statblocks)"
```

---

## Self-Review notes

- **Spec coverage:** forward `## Summons` cards (Tasks 1+2), conjurer detection skipping Monsters-book rivals (Task 2 `findRivalSummonerPage`), back-link with computed `../../../` href (Task 2), post-write timing (Task 3), idempotence (Task 2 test), CSS (Task 4), real-build verification incl. all-echelons + rival-fury-untouched (Task 5), docs (Task 6). All spec sections covered.
- **Type consistency:** `rivalSummonsCards(readDir, hrefBase string, files []string) string`, `augmentRivalSummonerPages(sectionDir string) (int, []string)`, `findRivalSummonerPage(echelonDir string) (file, name string, ok bool)`, `listSummonFiles(summonDir string) []string` — used consistently across tasks. Reused helpers (`bestiaryLeafCard`, `readFile`, `splitFrontmatter`, `parseFrontmatterField`, `naturalLess`, `fileToTitle`, `echelonDirRe`) verified to exist in `internal/site/`.
- **Path math:** forward href base `../summoner/minion` (rival page URL is one level above the echelon index); back-link `../../../rival-summoner/` (summon URL is three levels below the echelon) — both verified against the rendered link depths on existing pages.
- **No data/SCC/schema change** — site-only, consistent with the spec.

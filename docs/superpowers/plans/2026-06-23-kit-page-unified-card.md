# Kit Page Unified Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each v2 kit page as one cohesive High-Fantasy Steel `.sc-kit` plate (header + flavor + equipment box + all-8 bonus grid + a Signature Ability band) with the signature-ability `.sc-ability` card fused flush beneath it.

**Architecture:** A new build-time renderer `buildKitPage` in `steel-etl/internal/site/kit_page.go`, wired into `buildSection` next to the other `buildXPage` card builders (runs before `injectH1`). It builds the plate as a **contiguous raw-HTML block** (no blank lines, so `md_in_html` passes it verbatim — exactly like `renderAbilityCard`) from frontmatter, then leaves the body's existing `### <name> {data-scc="…"}` signature-ability heading marker **after** the closed plate. The existing global `embedItemCards` post-pass transcludes the standalone `.sc-ability` card beneath the marker; `v2/docs/stylesheets/steel-kit.css` fuses plate + card into one continuous card. Site-only: the shared data repos are untouched.

**Tech Stack:** Go (steel-etl, `internal/site` package), CSS (MkDocs Material, `md_in_html`, `attr_list`), the existing `.sc-card__stats` stat-grid markup + `--fx-*`/`--sc-*` design tokens.

## Global Constraints

- **Site-only.** Never touch the shared data repos (Obsidian / JSON / YAML / plain md) or schemas. All work is in `steel-etl/internal/site` + `v2/docs/stylesheets` + `v2/mkdocs.yml`.
- **Content is frozen.** Equipment text, bonus values, and flavor are rendered verbatim from frontmatter — never reworded.
- **Predictable lookup.** The bonus grid always shows all 8 fixed slots in the same positions; absent bonuses render as `—`.
- **Contiguous raw HTML.** The `.sc-kit` plate must contain **no blank lines** so `md_in_html` passes it through verbatim (the standing rule for `.sc-ability`/`.sb-wrap`/`.fb-wrap` cards).
- **Compose tokens.** CSS composes existing `--fx-*` ornament + `--sc-*` palette tokens; no new brand colors, no new icons (the `kit` backpack crest already exists). Both `slate` (default) and `default` (light) schemes must work.
- **Toolchain:** Go is not on PATH — prefix every Go command with `devbox run --`. Run from the worktree root `../worktrees/kit-page-card`.
- **Build commands:** `devbox run -- go test ./...` (steel-etl), `devbox run -- mkdocs build` (v2, from `v2/`).

## File Structure

- **Create** `steel-etl/internal/site/kit_page.go` — `buildKitPage`, `renderKitPlate`, `kitKind`, `kitSignatureMarker`. One responsibility: turn a `type: kit` page into the `.sc-kit` plate. Reuses package-level helpers from `cards.go`/`build.go`/`embed_cards.go` (`statsBlock`, `crestSVG`, `inlineMD`, `cardFlavor`, `bonusShort`, `orZero`, `orDash`, `firstField`, `parseFrontmatterField`, `signatureFromBody`, `splitFrontmatter`, `dataSCCHeadingRe`).
- **Create** `steel-etl/internal/site/kit_page_test.go` — unit tests for the above.
- **Modify** `steel-etl/internal/site/build.go` — wire `buildKitPage` into `buildSection` after the `buildFeatureblockPage` block (~line 323), before `injectH1`.
- **Create** `v2/docs/stylesheets/steel-kit.css` — `.sc-kit` plate, header band, equipment box, band heads, H1 hide, signature-card fusion.
- **Modify** `v2/mkdocs.yml` — register `stylesheets/steel-kit.css` in `extra_css` after `steel-ability-cards.css`.
- **Modify** `DESIGN.md` (workspace) — add the kit page card row to the Component systems table.

---

### Task 1: `renderKitPlate` — the contiguous `.sc-kit` plate

**Files:**
- Create: `steel-etl/internal/site/kit_page.go`
- Test: `steel-etl/internal/site/kit_page_test.go`

**Interfaces:**
- Consumes (all package-level, already defined): `parseFrontmatterField(fm, key string) string`, `crestSVG(icon string) string`, `cardFlavor(fm, body string) string`, `inlineMD(s string) string`, `signatureFromBody(body string) (name, sigType, keywords string)`, `bonusShort/orZero/orDash(s string) string`, `firstField(fm string, keys ...string) string`, `statsBlock(stats [][3]string) string`, `dataSCCHeadingRe *regexp.Regexp`.
- Produces: `renderKitPlate(fm, body string) string` (contiguous raw HTML, no blank lines), `kitKind(body string) string`, `kitSignatureMarker(body string) string`.

- [ ] **Step 1: Write the failing test**

Create `steel-etl/internal/site/kit_page_test.go`:

```go
package site

import (
	"strings"
	"testing"
)

// A representative kit body as the md-linked page carries it (pre-embed): a
// flavor paragraph, ## Equipment / ## Kit Bonuses sections, and a Signature
// Ability section whose ability heading carries the {data-scc} marker stamped by
// RenderSubtree. signatureFromBody reads the keyword table row for kind detection.
const kitTestBody = `The Ranger kit outfits you with medium armor and weapons.

## Equipment

You wear medium armor and wield a bow and a medium weapon.

## Kit Bonuses

**Stamina Bonus:** +6 per echelon

**Speed Bonus:** +1

## Signature Ability

### Hamstring Shot {data-scc="mcdm.heroes.v1/feature.ability.ranger/hamstring-shot"}

| **Ranged, Strike, Weapon** | **Main action** |
|----------------------------|-----------------|
`

const kitTestFM = "equipment_text: You wear medium armor and wield a bow and a medium weapon.\n" +
	"flavor: The Ranger kit outfits you with medium armor and weapons.\n" +
	"melee_damage_bonus: +1/+1/+1\n" +
	"name: Ranger\n" +
	"ranged_distance_bonus: \"+5\"\n" +
	"speed_bonus: \"+1\"\n" +
	"stamina_bonus: +6 per echelon\n" +
	"type: kit"

func TestRenderKitPlate(t *testing.T) {
	got := renderKitPlate(kitTestFM, kitTestBody)
	wants := []string{
		`<section class="sc-kit sc-fil">`,
		`<div class="sc-kit__eyebrow">Martial Kit</div>`,        // ranged/strike/weapon → not psionic/magic
		`<div class="sc-kit__name">Ranger</div>`,
		`class="sc-kit__crest"`,                                  // backpack crest
		`The Ranger kit outfits you with medium armor`,           // flavor, untruncated
		`<div class="sc-kit__band-head">Equipment</div>`,
		`You wear medium armor and wield a bow and a medium weapon.`,
		`<div class="sc-kit__band-head">Kit Bonuses</div>`,
		`<div class="l">Stamina per Echelon</div>`,
		`<div class="l">Stability</div>`,                          // absent bonus still gets a fixed slot
		`<div class="l">Ranged Dist</div>`,
		`<div class="sc-kit__band-head">Signature Ability</div>`, // sig band head present (body has a marker)
		`</section>`,
	}
	for _, w := range wants {
		if !strings.Contains(got, w) {
			t.Errorf("plate missing %q\n--- got ---\n%s", w, got)
		}
	}
	// The +6-per-echelon stamina bonus is shortened to its value (per kitCard).
	if !strings.Contains(got, `+6`) || strings.Contains(got, `+6 per echelon`) {
		t.Errorf("stamina bonus should be shortened to its value\n%s", got)
	}
	// Absent stability/melee-distance render as an em dash, never dropped.
	if c := strings.Count(got, "—"); c < 3 {
		t.Errorf("expected >=3 em-dash placeholders for absent bonuses, got %d\n%s", c, got)
	}
	// Contiguity: md_in_html requires no blank lines in the raw-HTML plate.
	if strings.Contains(got, "\n\n") {
		t.Errorf("plate must be a contiguous block (no blank lines) for md_in_html\n%s", got)
	}
}

func TestKitKind(t *testing.T) {
	cases := map[string]string{
		"### A\n\n| **Psionic, Strike** | x |": "Psionic",
		"### A\n\n| **Magic, Ranged** | x |":   "Magic",
		"### A\n\n| **Weapon, Melee** | x |":   "Martial",
		"":                                     "Martial",
	}
	for body, want := range cases {
		if got := kitKind(body); got != want {
			t.Errorf("kitKind(%q) = %q, want %q", body, got, want)
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../worktrees/kit-page-card && devbox run -- go test ./steel-etl/internal/site/ -run 'TestRenderKitPlate|TestKitKind' -v`
Expected: FAIL — `undefined: renderKitPlate` / `undefined: kitKind`.

- [ ] **Step 3: Write minimal implementation**

Create `steel-etl/internal/site/kit_page.go`:

```go
package site

import (
	"html"
	"strings"
)

// kitKind derives the kit's family label (Martial / Magic / Psionic) the same way
// the preview card (kitCard) does — from the signature ability's keyword line.
func kitKind(body string) string {
	_, _, keywords := signatureFromBody(body)
	switch {
	case strings.Contains(keywords, "Psionic"):
		return "Psionic"
	case strings.Contains(keywords, "Magic"):
		return "Magic"
	}
	return "Martial"
}

// kitSignatureMarker returns the kit body's signature-ability heading line — the
// sole {data-scc} heading on a kit page — verbatim (trailing whitespace trimmed),
// so it survives into the output for the embedItemCards post-pass to splice the
// `.sc-ability` card beneath it. Returns "" when the kit has no signature ability.
func kitSignatureMarker(body string) string {
	for _, line := range strings.Split(body, "\n") {
		if dataSCCHeadingRe.MatchString(line) {
			return strings.TrimRight(line, " \t")
		}
	}
	return ""
}

// renderKitPlate builds the contiguous (no blank-line) raw-HTML `.sc-kit` plate
// from frontmatter so md_in_html passes it through verbatim. The signature
// ability card is NOT rendered here — only its band head; the card is spliced
// beneath the (closed) plate by embedItemCards via the preserved {data-scc} marker.
func renderKitPlate(fm, body string) string {
	name := strings.TrimSpace(parseFrontmatterField(fm, "name"))

	var sb strings.Builder
	sb.WriteString(`<section class="sc-kit sc-fil">` + "\n")

	// Header band — backpack crest + "<Kind> Kit" eyebrow + name.
	sb.WriteString(`<div class="sc-kit__head"><span class="sc-crest sc-kit__crest"><span>` +
		crestSVG("kit") + `</span></span>` + "\n")
	sb.WriteString(`<div class="sc-kit__titles"><div class="sc-kit__eyebrow">` +
		html.EscapeString(kitKind(body)+" Kit") + `</div>` + "\n")
	sb.WriteString(`<div class="sc-kit__name">` + html.EscapeString(name) + `</div></div></div>` + "\n")

	// Flavor — untruncated; links rendered to real anchors via inlineMD.
	if f := cardFlavor(fm, body); f != "" {
		sb.WriteString(`<div class="sc-kit__flavor">` + inlineMD(f) + `</div>` + "\n")
	}

	// Equipment band — verbatim sentence (links rendered). &nbsp; reserves the box
	// when a kit lacks equipment (matches kitCard).
	equip := strings.TrimSpace(parseFrontmatterField(fm, "equipment_text"))
	if equip == "" {
		equip = "&nbsp;"
	} else {
		equip = inlineMD(equip)
	}
	sb.WriteString(`<div class="sc-kit__band"><div class="sc-kit__band-head">Equipment</div>` + "\n")
	sb.WriteString(`<div class="sc-kit__equip">` + equip + `</div></div>` + "\n")

	// Kit Bonuses band — two rows of 4 fixed slots (mirrors kitCard exactly).
	stam := bonusShort(parseFrontmatterField(fm, "stamina_bonus"))
	spd := orZero(parseFrontmatterField(fm, "speed_bonus"))
	stab := orZero(parseFrontmatterField(fm, "stability_bonus"))
	dis := orZero(firstField(fm, "disengage_bonus", "disengage"))
	melee := orDash(strings.TrimSpace(parseFrontmatterField(fm, "melee_damage_bonus")))
	ranged := orDash(strings.TrimSpace(parseFrontmatterField(fm, "ranged_damage_bonus")))
	meleeDist := orDash(strings.TrimSpace(parseFrontmatterField(fm, "melee_distance_bonus")))
	rangedDist := orDash(strings.TrimSpace(parseFrontmatterField(fm, "ranged_distance_bonus")))
	sb.WriteString(`<div class="sc-kit__band"><div class="sc-kit__band-head">Kit Bonuses</div>` + "\n")
	sb.WriteString(statsBlock([][3]string{
		{stam, "Stamina per Echelon", ""}, {spd, "Speed", ""}, {stab, "Stability", ""}, {dis, "Disengage", ""},
	}))
	sb.WriteString(statsBlock([][3]string{
		{melee, "Melee Dmg", "is-dmg"}, {ranged, "Ranged Dmg", "is-dmg"},
		{meleeDist, "Melee Dist", ""}, {rangedDist, "Ranged Dist", ""},
	}))
	sb.WriteString(`</div>` + "\n")

	// Signature Ability band head — only when the body carries a signature ability;
	// the card itself is spliced beneath the plate by embedItemCards.
	if kitSignatureMarker(body) != "" {
		sb.WriteString(`<div class="sc-kit__band sc-kit__band--sig"><div class="sc-kit__band-head">Signature Ability</div></div>` + "\n")
	}

	sb.WriteString(`</section>` + "\n")
	return sb.String()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ../worktrees/kit-page-card && devbox run -- go test ./steel-etl/internal/site/ -run 'TestRenderKitPlate|TestKitKind' -v`
Expected: PASS.

Note: `statsBlock`'s `</div>\n` followed by the next line's `  <div` leaves a single `\n` (no blank line), so the contiguity assertion holds. If it fails on `\n\n`, confirm no helper appends a trailing blank line.

- [ ] **Step 5: Commit**

```bash
cd ../worktrees/kit-page-card/steel-etl
git add internal/site/kit_page.go internal/site/kit_page_test.go
git commit -m "feat(site): renderKitPlate — High-Fantasy Steel kit plate

Claude-Session: https://claude.ai/code/session_018r698zkm7rkvBKoM2gVDkp"
```

---

### Task 2: `buildKitPage` + `buildSection` wiring

**Files:**
- Modify: `steel-etl/internal/site/kit_page.go`
- Modify: `steel-etl/internal/site/build.go` (after the `buildFeatureblockPage` block, ~line 321-323)
- Test: `steel-etl/internal/site/kit_page_test.go`

**Interfaces:**
- Consumes: `renderKitPlate`, `kitSignatureMarker` (Task 1); `splitFrontmatter(content string) (frontmatter, body string)`, `parseFrontmatterField`.
- Produces: `buildKitPage(data []byte) ([]byte, bool)` — returns `(carded, true)` for `type: kit`, else `(data, false)`. The carded output is `---\n<fm>\n---\n\n<plate>` plus, when a signature ability exists, `\n\n<markerLine>\n` after the closed plate.

- [ ] **Step 1: Write the failing test**

Append to `steel-etl/internal/site/kit_page_test.go`:

```go
func TestBuildKitPage_NonKitUnchanged(t *testing.T) {
	in := []byte("---\ntype: ability\nname: Dragon Breath\n---\n\nbody\n")
	out, ok := buildKitPage(in)
	if ok {
		t.Fatalf("expected ok=false for type: ability")
	}
	if string(out) != string(in) {
		t.Fatalf("non-kit data should pass through unchanged")
	}
}

func TestBuildKitPage_PreservesMarkerAfterPlate(t *testing.T) {
	in := []byte("---\n" + kitTestFM + "\n---\n\n" + kitTestBody + "\n")
	out, ok := buildKitPage(in)
	if !ok {
		t.Fatalf("expected ok=true for type: kit")
	}
	s := string(out)
	marker := `### Hamstring Shot {data-scc="mcdm.heroes.v1/feature.ability.ranger/hamstring-shot"}`
	if !strings.Contains(s, marker) {
		t.Fatalf("output must preserve the signature-ability {data-scc} marker for embed\n%s", s)
	}
	// The marker MUST come AFTER the closed plate, else embedItemCards' swallow
	// (to the next heading / EOF) would eat the </section> close.
	if strings.Index(s, "</section>") > strings.Index(s, marker) {
		t.Fatalf("marker must follow </section> so embed cannot swallow the plate close\n%s", s)
	}
	// Frontmatter is preserved verbatim.
	if !strings.HasPrefix(s, "---\n"+kitTestFM+"\n---\n\n") {
		t.Fatalf("frontmatter must be preserved verbatim\n%s", s)
	}
	// The original ability table markdown is dropped (embed supplies the card).
	if strings.Contains(s, "Ranged, Strike, Weapon") {
		t.Errorf("original ability markdown should be dropped; embed supplies the card\n%s", s)
	}
}

func TestBuildKitPage_NoSignatureAbility(t *testing.T) {
	body := "A simple kit.\n\n## Equipment\n\nA dagger.\n"
	fm := "equipment_text: A dagger.\nname: Simple\ntype: kit"
	out, ok := buildKitPage([]byte("---\n" + fm + "\n---\n\n" + body))
	if !ok {
		t.Fatalf("expected ok=true")
	}
	s := string(out)
	if strings.Contains(s, "Signature Ability") {
		t.Errorf("kit without a signature ability must omit the Signature Ability band\n%s", s)
	}
	if !strings.Contains(s, `<div class="sc-kit__band-head">Equipment</div>`) {
		t.Errorf("plate should still render without a signature ability\n%s", s)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../worktrees/kit-page-card && devbox run -- go test ./steel-etl/internal/site/ -run 'TestBuildKitPage' -v`
Expected: FAIL — `undefined: buildKitPage`.

- [ ] **Step 3: Write minimal implementation**

Add to `steel-etl/internal/site/kit_page.go` (above `renderKitPlate`):

```go
// buildKitPage rewrites a `type: kit` page body into the unified High-Fantasy
// Steel `.sc-kit` plate. The signature-ability heading marker is preserved AFTER
// the (closed) plate so the embedItemCards post-pass transcludes its standalone
// `.sc-ability` card beneath it (steel-kit.css fuses the two into one card).
// Returns (newData, true) for kit pages; (data, false) otherwise. Frontmatter is
// preserved verbatim; injectH1 (next in buildSection) prepends the hidden "# Name".
//
// SITE-ONLY: runs against generated md-linked pages; the shared data repos are
// untouched.
func buildKitPage(data []byte) ([]byte, bool) {
	fm, body := splitFrontmatter(string(data))
	if parseFrontmatterField(fm, "type") != "kit" {
		return data, false
	}
	newBody := renderKitPlate(fm, body)
	if marker := kitSignatureMarker(body); marker != "" {
		// Blank line BEFORE the marker so MkDocs ends the raw-HTML plate block and
		// parses the heading; embed then splices the card here.
		newBody += "\n\n" + marker + "\n"
	}
	return []byte("---\n" + fm + "\n---\n\n" + newBody), true
}
```

Wire it into `steel-etl/internal/site/build.go` immediately after the `buildFeatureblockPage` block (the one ending ~line 323), before the `embedFixtureAdvancement` call:

```go
		// Kit pages → the High-Fantasy Steel .sc-kit plate (header + equipment +
		// bonus grid + Signature Ability band). The signature-ability card is
		// spliced beneath by the embedItemCards post-pass via the preserved
		// {data-scc} marker. Site-only; runs before injectH1 like the cards above.
		if card, ok := buildKitPage(data); ok {
			data = card
		}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../worktrees/kit-page-card && devbox run -- go test ./steel-etl/internal/site/ -run 'TestBuildKitPage|TestRenderKitPlate|TestKitKind' -v`
Expected: PASS.

Then the full package + build, to confirm nothing else broke:
Run: `cd ../worktrees/kit-page-card && devbox run -- go build ./... && devbox run -- go test ./steel-etl/internal/site/`
Expected: build OK, tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ../worktrees/kit-page-card/steel-etl
git add internal/site/kit_page.go internal/site/kit_page_test.go internal/site/build.go
git commit -m "feat(site): buildKitPage — unify kit page into .sc-kit card

Claude-Session: https://claude.ai/code/session_018r698zkm7rkvBKoM2gVDkp"
```

---

### Task 3: `steel-kit.css` + mkdocs registration

**Files:**
- Create: `v2/docs/stylesheets/steel-kit.css`
- Modify: `v2/mkdocs.yml` (`extra_css`, after `steel-ability-cards.css`)

**Interfaces:**
- Consumes: tokens `--fx-card-bg`, `--fx-bevel`, `--fx-emboss`, `--fx-metal`, `--fx-metal-faint`, `--fx-metal-bright`, `--sc-steel-lighter`, `--md-*` (already defined upstream in the load order). The `.sc-card__stats`/`.sc-card__stat` grid markup styles itself via `steel-redesign.css` (global selectors, not scoped to `.sc-card`).
- Produces: visual styling only — no Go interface. Verified in Task 4.

- [ ] **Step 1: Create the stylesheet**

Create `v2/docs/stylesheets/steel-kit.css`:

```css
/* ============================================================
   steel-kit.css — Draw Steel KIT pages, High-Fantasy Steel.
   Loads AFTER steel-ability-cards.css. The kit page is one forged
   `.sc-kit` plate (header + flavor + equipment box + all-8 bonus
   grid + a Signature Ability band); the signature-ability
   `.sc-ability` card is spliced beneath by the embedItemCards
   post-pass (via the preserved {data-scc} marker) and fused flush
   here. The bonus grid reuses .sc-card__stats from steel-redesign.css.
   ============================================================ */

/* ── MkDocs H1 hide (the plate carries its own name) ── */
.md-typeset:has(> .sc-kit) > h1:first-child,
.md-typeset:has(> .sc-kit) > h1:first-child + hr { display: none; }

/* ── PLATE ── */
.md-typeset .sc-kit {
  position: relative; max-width: 47rem; margin: 1.7rem auto 0;
  padding: 0 1.2rem 1.1rem;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: .65rem .65rem 0 0;          /* open bottom: the ability card completes it */
  background: var(--fx-card-bg);
  box-shadow: var(--fx-bevel), 0 10px 26px rgba(0,0,0,.36);
  color: var(--md-default-fg-color);
}
[data-md-color-scheme="default"] .md-typeset .sc-kit {
  border-color: var(--md-default-fg-color--lightest);
  box-shadow: var(--fx-bevel), 0 5px 14px rgba(0,0,0,.09);
}

/* ── HEADER band: backpack crest · "<Kind> Kit" eyebrow · name ── */
.sc-kit__head {
  display: flex; align-items: center; gap: .85rem;
  margin: 0 -1.2rem .9rem; padding: 1rem 1.2rem 1.05rem;
  border-bottom: 1px solid var(--fx-metal-faint);
}
.sc-kit__crest { flex: 0 0 auto; }
.sc-kit__titles { min-width: 0; }
.sc-kit__eyebrow {
  font-family: var(--md-small-header-font); font-variant: small-caps;
  text-transform: uppercase; letter-spacing: .08em; font-size: .82rem;
  color: var(--md-accent-fg-color); margin-bottom: .1rem;
}
.md-typeset .sc-kit__name {
  margin: 0; font-family: var(--md-large-header-font); text-transform: uppercase;
  font-size: 2rem; line-height: 1; color: var(--sc-steel-lighter);
  text-shadow: var(--fx-emboss); letter-spacing: .01em; text-wrap: balance;
}

/* ── FLAVOR ── */
.sc-kit__flavor {
  font-size: .92rem; line-height: 1.55; color: var(--md-default-fg-color--light);
  margin: 0 0 1rem; text-wrap: pretty;
}
.md-typeset .sc-kit__flavor a { color: var(--md-typeset-a-color); text-decoration: none; }
.md-typeset .sc-kit__flavor a:hover { text-decoration: underline; }

/* ── BANDS (Equipment / Kit Bonuses / Signature Ability) ── */
.sc-kit__band { margin-top: 1rem; }
.sc-kit__band-head {
  font-family: var(--md-small-header-font); font-variant: small-caps;
  text-transform: uppercase; letter-spacing: .07em; font-size: .8rem;
  color: var(--fx-metal); margin-bottom: .45rem;
  padding-bottom: .25rem; border-bottom: 1px solid var(--fx-metal-faint);
}
.sc-kit__band--sig { margin-bottom: 0; }
.sc-kit__band--sig .sc-kit__band-head { border-bottom: 0; margin-bottom: 0; }

/* ── EQUIPMENT box ── */
.sc-kit__equip {
  background: rgba(0,0,0,.22); border: 1px solid var(--fx-metal-faint);
  border-radius: 6px; padding: .65rem .8rem;
  font-size: .92rem; line-height: 1.5; color: var(--md-default-fg-color);
}
[data-md-color-scheme="default"] .sc-kit__equip { background: rgba(0,0,0,.04); }
.md-typeset .sc-kit__equip a { color: var(--md-typeset-a-color); text-decoration: none; }
.md-typeset .sc-kit__equip a:hover { text-decoration: underline; }

/* The bonus grid (.sc-card__stats / .sc-card__stat) is styled globally by
   steel-redesign.css — no per-.sc-kit rules needed. Pin its top margin so it
   tucks under the band head consistently. */
.sc-kit .sc-card__stats { margin-top: .2rem; }

/* ── SIGNATURE ABILITY fusion ──
   embedItemCards leaves: </section>, the (redundant) marker heading, then the
   spliced .sc-ability card. Hide the marker heading and butt the card flush to
   the plate's open bottom so the two read as one continuous card. */
.md-typeset .sc-kit + h3[data-scc] { display: none; }
.md-typeset .sc-kit + h3[data-scc] + .sc-ability {
  max-width: 47rem; margin: 0 auto 1.7rem;
  border-top-left-radius: 0; border-top-right-radius: 0;
}
```

- [ ] **Step 2: Register the stylesheet**

In `v2/mkdocs.yml`, add the line after `steel-ability-cards.css` (line ~121):

```yaml
  - stylesheets/steel-ability-cards.css
  - stylesheets/steel-kit.css
  - stylesheets/steel-statblock.css
```

- [ ] **Step 3: Verify the site builds**

Run: `cd ../worktrees/kit-page-card/v2 && devbox run -- mkdocs build 2>&1 | tail -5`
Expected: build completes without CSS/config errors (the `extra_css` entry resolves to a real file).

- [ ] **Step 4: Commit**

```bash
cd ../worktrees/kit-page-card/v2
git add docs/stylesheets/steel-kit.css mkdocs.yml
git commit -m "feat(v2): steel-kit.css — unified kit page card styling

Claude-Session: https://claude.ai/code/session_018r698zkm7rkvBKoM2gVDkp"
```

---

### Task 4: End-to-end build, visual verification, and docs

**Files:**
- Modify: `DESIGN.md` (workspace — Component systems table)

**Interfaces:** none (verification + docs).

- [ ] **Step 1: Regenerate the site and inspect a kit page**

Run (from the worktree root):
```bash
cd ../worktrees/kit-page-card
devbox run -- go run ./steel-etl/cmd/steel-etl gen --config steel-etl/pipeline.yaml --all
devbox run -- go run ./steel-etl/cmd/steel-etl site --config v2/site.yaml
```
Then inspect the generated page:
Run: `sed -n '1,60p' v2/docs/Browse/kit/ranger.md`
Expected: a `<section class="sc-kit sc-fil">` plate with the header, flavor, equipment box, two `.sc-card__stats` rows (all 8 cells, `—` for absent), a `Signature Ability` band head, then `</section>`, then the `### Hamstring Shot {data-scc="…"}` marker, then the spliced `<article class="sc-ability" …>` card.

If the `<article class="sc-ability">` is NOT present after the marker, the embed post-pass didn't run/splice — confirm `embedItemCards` covers the Browse section and the marker line matches `dataSCCHeadingRe` exactly (`### Name {data-scc="…"}`, no extra attrs in the braces).

- [ ] **Step 2: Visual check in the browser**

Serve and screenshot the Ranger kit page in both schemes (Playwright-core + Brave executablePath `/opt/brave.com/brave/brave`, per the project's browser-automation note):
```bash
cd ../worktrees/kit-page-card/v2 && devbox run -- mkdocs serve -a localhost:8003 &
```
Open `http://localhost:8003/Browse/kit/ranger/`. Confirm: the H1 is hidden; the plate reads as one forged card; the equipment box + bonus grid match the preview card's look; the signature-ability card sits flush beneath the Signature Ability band (no double name heading, no gap); both `slate` and `default` schemes look correct. Tune the fusion values in `steel-kit.css` (the `margin`/`border-radius` on `.sc-kit` and `.sc-kit + h3[data-scc] + .sc-ability`) if the card seam shows a gap or misaligned width, then re-`mkdocs build`.

Also spot-check a kit with a different kind (e.g. a Magic/Psionic kit) and one whose source lists multiple weapons, to confirm the eyebrow label and equipment wrapping.

Stop the server when done.

- [ ] **Step 3: Update DESIGN.md**

In `DESIGN.md` (workspace), add a row to the "Component systems" table (after the Featureblocks row):

```markdown
| Kit pages (unified `.sc-kit` forged plate — header + flavor + equipment box + all-8 bonus grid + a Signature Ability band, with the signature-ability `.sc-ability` card spliced beneath via the preserved `{data-scc}` marker and fused flush by CSS; reuses the preview card's `.sc-card__stats` grid) | build-time `steel-etl/internal/site/kit_page.go` + `v2/docs/stylesheets/steel-kit.css` | `docs/superpowers/specs/2026-06-23-kit-page-unified-card-design.md` |
```

- [ ] **Step 4: Commit the docs change**

```bash
cd ../worktrees/kit-page-card
git add DESIGN.md
git commit -m "docs(design): record the unified kit page card component

Claude-Session: https://claude.ai/code/session_018r698zkm7rkvBKoM2gVDkp"
```

- [ ] **Step 5: Land the work**

Once verified, land all touched submodules + the superproject pointer bump together:
Run: `cd /home/vexa/code/steel_compendium/workspace && devbox run -- just wt-finish kit-page-card`
Expected: pushes `steel-etl`, `v2`, and the workspace superproject (DESIGN.md + spec + plan + pointer bumps). Deploy (`just deploy-v2`) is a separate, explicit step done from the main checkout — not part of this plan.

---

## Notes on the chosen mechanism (read before implementing)

- **Why the marker sits *after* the closed plate, not nested inside it.** `embedItemCards`/`spliceCards` is line-based: it keeps the `{data-scc}` heading and replaces everything from the next line to the next ATX heading of level ≤ the marker's (or EOF) with the card. A signature ability is the last section, so a wrapping `</section>` placed *after* the marker would be swallowed, breaking the HTML. Closing the plate **before** the marker and fusing with CSS gives the same one-card visual without touching the (shared) embed pass. This is the same sibling-card pattern class pages already use.
- **The plate is contiguous raw HTML with no `markdown` attribute** — like `renderAbilityCard`/`renderStatblockCard` — so MkDocs passes it through verbatim. Keep it free of blank lines (the Task 1 test enforces this).
- **Do not alter the `{data-scc}` braces.** `dataSCCHeadingRe` requires the line to end with `{data-scc="…"}`; adding a class inside the braces breaks the match and the card won't splice. The redundant marker heading is hidden via CSS adjacency instead.

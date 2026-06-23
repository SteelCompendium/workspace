# Unified Card Header ("6-slot header") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every entity card's hand-rolled header with one shared 6-slot header renderer + CSS contract, so the same kind of field always lands in the same place.

**Architecture:** A new `internal/site/card_head.go` exposes `renderCardHead(cardHeadSlots)` emitting a `<header class="sc-head">` with six positional slots (left/right × eyebrow/primary/deck), each rendered as line/chip/mini-title. A new `v2/docs/stylesheets/steel-cardhead.css` styles `.sc-head`. Each existing renderer (statblock, ability, trait, featureblock, sub-features, previews) is migrated to build a `cardHeadSlots` and call the shared renderer. The flat-list Feature Style is a pure CSS reflow of the same DOM.

**Tech Stack:** Go 1.26 (steel-etl, via devbox), MkDocs Material CSS (v2). Tests are Go `strings.Contains` assertions on rendered HTML, plus golden `.island.json`/`.golden.html` fixtures under `internal/site/testdata/statblock_golden/`.

**Spec:** `docs/superpowers/specs/2026-06-23-unified-card-header-design.md` (read it first).

## Global Constraints

- **Edit in an isolated worktree, never the shared main checkout** (CLAUDE.md rule 1). All code edits here are in submodules (`steel-etl`, `v2`). See Pre-flight.
- **Toolchain is devbox-only**: prefix every Go/just command with `devbox run --` (e.g. `devbox run -- go test ./internal/site/...`). Go is not on PATH.
- **Never hand-edit generated output** (`data/`, `v2/docs/Browse|Read|scc/`). Only edit `steel-etl/internal/site/*.go` and `v2/docs/stylesheets/*.css` + `v2/mkdocs.yml`.
- **`extra_css` order matters** (`v2/mkdocs.yml`): a sheet may only use tokens from sheets above it.
- **Slot vocabulary is fixed**: columns `left`/`right`; lanes `eyebrow`/`primary`/`deck`; render styles `line` (default) / `chip` / `mini`. `left-primary` is always the name.
- **Provenance format** is `class · subclass` (middle dot `·`, U+00B7).
- **Empty slots are omitted** (leave a gap) — never promote or reflow to fill.
- Working directory for all Go commands: the `steel-etl/` dir inside the worktree.

---

## Pre-flight (do once, before Task 1)

- [ ] **Create the worktree** (from the workspace root):

```bash
just wt-new card-header        # ../worktrees/card-header: every submodule on branch card-header
cd ../worktrees/card-header
```

- [ ] **Confirm the baseline builds and tests pass:**

```bash
devbox run -- go -C steel-etl test ./internal/site/...
```
Expected: PASS (establishes a green baseline before changes).

---

## Task 1: Shared header component (`card_head.go`)

**Files:**
- Create: `steel-etl/internal/site/card_head.go`
- Test: `steel-etl/internal/site/card_head_test.go`

**Interfaces:**
- Produces:
  - `type cardHeadSlot struct { HTML string; Style string }` — `Style` ∈ `""`(=line)/`"line"`/`"chip"`/`"mini"`.
  - `func hLine(h string) cardHeadSlot`, `func hChip(h string) cardHeadSlot`, `func hMini(h string) cardHeadSlot`
  - `type cardHeadSlots struct { Crest, RoleKey, NameTag string; LeftEyebrow, LeftPrimary, LeftDeck, RightEyebrow, RightPrimary, RightDeck cardHeadSlot }`
  - `func renderCardHead(s cardHeadSlots) string` — emits `<header class="sc-head">…`. `NameTag` defaults to `h3`. Empty-HTML slots are omitted. `RoleKey` (if set) is emitted as `data-role` on `right-primary`.

- [ ] **Step 1: Write the failing test**

```go
// steel-etl/internal/site/card_head_test.go
package site

import (
	"strings"
	"testing"
)

func TestRenderCardHead_AllSlots(t *testing.T) {
	got := renderCardHead(cardHeadSlots{
		Crest:        `<span class="crest"></span>`,
		RoleKey:      "brute",
		NameTag:      "h2",
		LeftEyebrow:  hLine("Monster"),
		LeftPrimary:  hLine("Goblin Cutter"),
		LeftDeck:     hLine("Goblin, Humanoid"),
		RightEyebrow: hChip("Level 1"),
		RightPrimary: hMini("Minion Harrier"),
		RightDeck:    hChip("EV 4"),
	})
	for _, want := range []string{
		`<header class="sc-head">`,
		`<span class="crest"></span>`,
		`class="sc-head__slot sc-head__left-eyebrow sc-head__slot--line">Monster</div>`,
		`<h2 class="sc-head__slot sc-head__left-primary sc-head__slot--line">Goblin Cutter</h2>`,
		`class="sc-head__slot sc-head__left-deck sc-head__slot--line">Goblin, Humanoid</div>`,
		`class="sc-head__slot sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
		`class="sc-head__slot sc-head__right-primary sc-head__slot--mini" data-role="brute">Minion Harrier</div>`,
		`class="sc-head__slot sc-head__right-deck sc-head__slot--chip">EV 4</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}

func TestRenderCardHead_OmitsEmptySlotsAndDefaultsNameTag(t *testing.T) {
	got := renderCardHead(cardHeadSlots{
		LeftPrimary:  hLine("Cleave"),
		RightPrimary: hMini("Signature"),
		RightDeck:    hChip("Main Action"),
	})
	if strings.Contains(got, "left-eyebrow") || strings.Contains(got, "left-deck") || strings.Contains(got, "right-eyebrow") {
		t.Errorf("empty slots should be omitted:\n%s", got)
	}
	if !strings.Contains(got, `<h3 class="sc-head__slot sc-head__left-primary sc-head__slot--line">Cleave</h3>`) {
		t.Errorf("NameTag should default to h3:\n%s", got)
	}
	if strings.Contains(got, "data-role=") {
		t.Errorf("no RoleKey set, should emit no data-role:\n%s", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run TestRenderCardHead -v`
Expected: FAIL — `undefined: renderCardHead` / `cardHeadSlots`.

- [ ] **Step 3: Write the implementation**

```go
// steel-etl/internal/site/card_head.go
package site

import (
	"fmt"
	"html"
	"strings"
)

// cardHeadSlot is one slot of the shared 6-slot card header. HTML is the
// already-safe inner HTML (callers escape, or pass rich inline HTML); an empty
// HTML omits the slot. Style selects the render: "line" (default), "chip", or
// "mini" (the mini-title).
type cardHeadSlot struct {
	HTML  string
	Style string
}

func hLine(h string) cardHeadSlot { return cardHeadSlot{HTML: h, Style: "line"} }
func hChip(h string) cardHeadSlot { return cardHeadSlot{HTML: h, Style: "chip"} }
func hMini(h string) cardHeadSlot { return cardHeadSlot{HTML: h, Style: "mini"} }

// cardHeadSlots is the full 6-slot header model (left/right × eyebrow/primary/
// deck). LeftPrimary is the name (present on every card). NameTag is the
// heading element for the name ("h3" default). Crest is optional crest HTML
// rendered beside the left column. RoleKey, when set, is emitted as data-role
// on right-primary for accent coloring.
type cardHeadSlots struct {
	Crest, RoleKey, NameTag                string
	LeftEyebrow, LeftPrimary, LeftDeck     cardHeadSlot
	RightEyebrow, RightPrimary, RightDeck  cardHeadSlot
}

// renderCardHead emits the contiguous (no blank-line) <header class="sc-head">
// so md_in_html passes it through verbatim.
func renderCardHead(s cardHeadSlots) string {
	nameTag := s.NameTag
	if nameTag == "" {
		nameTag = "h3"
	}
	var b strings.Builder
	b.WriteString(`<header class="sc-head">`)

	b.WriteString(`<div class="sc-head__stack">`)
	if s.Crest != "" {
		b.WriteString(s.Crest)
	}
	b.WriteString(`<div class="sc-head__col sc-head__col--left">`)
	writeCardHeadSlot(&b, "left-eyebrow", "div", s.LeftEyebrow, "")
	writeCardHeadSlot(&b, "left-primary", nameTag, s.LeftPrimary, "")
	writeCardHeadSlot(&b, "left-deck", "div", s.LeftDeck, "")
	b.WriteString(`</div></div>`)

	b.WriteString(`<div class="sc-head__rail sc-head__col--right">`)
	writeCardHeadSlot(&b, "right-eyebrow", "div", s.RightEyebrow, "")
	writeCardHeadSlot(&b, "right-primary", "div", s.RightPrimary, s.RoleKey)
	writeCardHeadSlot(&b, "right-deck", "div", s.RightDeck, "")
	b.WriteString(`</div>`)

	b.WriteString(`</header>`)
	return b.String()
}

// writeCardHeadSlot writes one slot element if it has content. lane is e.g.
// "left-eyebrow"; tag is the element name; roleKey, when non-empty, is emitted
// as data-role.
func writeCardHeadSlot(b *strings.Builder, lane, tag string, sl cardHeadSlot, roleKey string) {
	if strings.TrimSpace(sl.HTML) == "" {
		return
	}
	style := sl.Style
	if style == "" {
		style = "line"
	}
	fmt.Fprintf(b, `<%s class="sc-head__slot sc-head__%s sc-head__slot--%s"`, tag, lane, style)
	if roleKey != "" {
		fmt.Fprintf(b, ` data-role="%s"`, html.EscapeString(roleKey))
	}
	fmt.Fprintf(b, `>%s</%s>`, sl.HTML, tag)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run TestRenderCardHead -v`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/card_head.go internal/site/card_head_test.go
git -C steel-etl commit -m "feat(site): add shared renderCardHead 6-slot header component"
```

---

## Task 2: Shared CSS contract (`steel-cardhead.css`)

**Files:**
- Create: `v2/docs/stylesheets/steel-cardhead.css`
- Modify: `v2/mkdocs.yml:119` (add the sheet after `steel-redesign.css`/`steel-settings.css`, before `steel-ability-cards.css`)

**Interfaces:**
- Produces the `.sc-head` layout + `.sc-head__slot--line|chip|mini` + mobile-wrap + flat-list hooks consumed by every later task. No Go dependency.

This task has no Go test; verify by building the site and eyeballing. The CSS composes existing tokens (`--md-small-header-font`, `--md-large-header-font`, `--fx-metal`, `--md-default-fg-color--light`, `--role`, `--sc-role-*`) — see DESIGN.md §Token vocabulary.

- [ ] **Step 1: Create the stylesheet**

```css
/* steel-cardhead.css — the shared 6-slot card header (.sc-head).
   Two columns (left "stack" / right "rail"), three lanes (eyebrow/primary/deck).
   Every entity card composes this; per-card sheets add only color/spine specifics.
   Tokens come from palette.css + steel-redesign.css (load order: after
   steel-settings.css, before steel-ability-cards.css). */

.sc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.sc-head__stack { display: flex; align-items: start; gap: .9rem; min-width: 0; }
.sc-head__col--left { display: flex; flex-direction: column; min-width: 0; }
.sc-head__rail { display: flex; flex-direction: column; align-items: flex-end; text-align: right; flex: 0 0 auto; }

/* lanes share emphasis on both sides. eyebrow = small context (small-caps),
   primary = the headline, deck = quiet detail. */
.sc-head__slot { margin: 0; min-width: 0; }

/* --line: a text line. The eyebrow carries the ◆ marker via ::before. */
.sc-head__slot--line { font-family: var(--md-small-header-font); }
.sc-head__left-eyebrow.sc-head__slot--line,
.sc-head__right-eyebrow.sc-head__slot--line {
  font-variant: small-caps; text-transform: lowercase; letter-spacing: .07em;
  font-size: .9rem; color: var(--md-default-fg-color--light); display: flex; align-items: center; gap: .5rem;
}
.sc-head__left-eyebrow.sc-head__slot--line::before {
  content: ""; width: .5rem; height: .5rem; transform: rotate(45deg);
  background: var(--fx-metal); flex: 0 0 auto;
}
.sc-head__left-deck.sc-head__slot--line,
.sc-head__right-deck.sc-head__slot--line {
  font-variant: small-caps; letter-spacing: .05em; font-size: .82rem; color: var(--md-default-fg-color--light);
}

/* the name (left-primary) and the right mini-title: the two "title" slots. */
.md-typeset .sc-head__left-primary {
  font-family: var(--md-large-header-font); text-transform: uppercase;
  font-size: 1.5rem; line-height: 1.04; color: var(--md-default-fg-color);
}
.sc-head__slot--mini {
  font-family: var(--md-large-header-font); text-transform: uppercase;
  font-size: 1.35rem; line-height: 1.04; color: var(--role, var(--md-default-fg-color));
}

/* --chip: a compact pill. */
.sc-head__slot--chip {
  font-family: var(--md-small-header-font); font-variant: small-caps; text-transform: lowercase;
  letter-spacing: .04em; font-size: .82rem; color: var(--md-default-fg-color--light);
  border: 1px solid var(--md-default-fg-color--lightest); border-radius: .35em;
  padding: .05rem .4rem; margin-top: .12rem;
}

/* Mobile: wrap busy slots to a second line; never truncate. */
@media (max-width: 30em) {
  .sc-head__left-deck.sc-head__slot--line,
  .sc-head__slot--mini { white-space: normal; overflow-wrap: anywhere; }
}

/* Flat-list Feature Style hook: sub-feature heads inline name · cost · usage.
   Card-tier heads are unaffected (they don't set these data-attrs on .sc-head). */
[data-sb-featstyle="flat"] .sb__feat .sc-head,
[data-fb-featstyle="flat"] .fb__feat .sc-head {
  display: inline; gap: 0;
}
[data-sb-featstyle="flat"] .sb__feat .sc-head__stack,
[data-sb-featstyle="flat"] .sb__feat .sc-head__rail,
[data-fb-featstyle="flat"] .fb__feat .sc-head__stack,
[data-fb-featstyle="flat"] .fb__feat .sc-head__rail { display: inline; }
[data-sb-featstyle="flat"] .sb__feat .sc-head__col--left,
[data-fb-featstyle="flat"] .fb__feat .sc-head__col--left { display: inline; }
[data-sb-featstyle="flat"] .sb__feat .sc-head__slot--mini,
[data-sb-featstyle="flat"] .sb__feat .sc-head__slot--chip,
[data-fb-featstyle="flat"] .fb__feat .sc-head__slot--mini,
[data-fb-featstyle="flat"] .fb__feat .sc-head__slot--chip {
  display: inline; border: 0; padding: 0; font-size: inherit; color: var(--md-default-fg-color--light);
  text-transform: none; font-variant: normal;
}
[data-sb-featstyle="flat"] .sb__feat .sc-head__slot--mini::before,
[data-sb-featstyle="flat"] .sb__feat .sc-head__slot--chip::before,
[data-fb-featstyle="flat"] .fb__feat .sc-head__slot--mini::before,
[data-fb-featstyle="flat"] .fb__feat .sc-head__slot--chip::before { content: " · "; }
```

- [ ] **Step 2: Register the sheet in `v2/mkdocs.yml`**

Insert after line 120 (`- stylesheets/steel-settings.css`), so the per-card sheets below can override it:

```yaml
  - stylesheets/steel-settings.css
  - stylesheets/steel-cardhead.css
  - stylesheets/steel-ability-cards.css
```

- [ ] **Step 3: Build the site to verify CSS loads with no errors**

Run: `devbox run -- mkdocs build -f v2/mkdocs.yml` (mkdocs is pip-installed; build via mkdocs, not on the shellenv PATH).
Expected: build completes; no missing-file warning for `steel-cardhead.css`.

- [ ] **Step 4: Commit**

```bash
git -C v2 add docs/stylesheets/steel-cardhead.css mkdocs.yml
git -C v2 commit -m "feat(v2): add shared .sc-head card-header stylesheet"
```

---

## Task 3: Migrate the statblock head

**Files:**
- Modify: `steel-etl/internal/site/statblock_page.go` (add `KindNoun` to `sbIsland`; derive it)
- Modify: `steel-etl/internal/site/statblock_card.go:286-309` (`renderStatblockHead`)
- Test: `steel-etl/internal/site/statblock_card_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `hLine`/`hChip`/`hMini` (Task 1).
- Produces: `func statblockKindNoun(scc string) string` → "Monster"/"Companion"/"Retainer"/"Summon"; `sbIsland.KindNoun string`.

Statblock keywords move from above the name (`sb__kw`) to `left-deck` (below it). The right column (Level / Org+Role / EV) maps 1:1 onto right eyebrow/primary/deck.

- [ ] **Step 1: Write the failing test**

```go
func TestRenderStatblockHead_SixSlot(t *testing.T) {
	d := sbIsland{
		KindNoun: "Monster", Name: "Goblin Cutter", Ancestry: "Goblin, Humanoid",
		Level: "1", Role: "Minion Harrier", RoleKey: "harrier", EV: "4",
	}
	got := renderStatblockHead(d)
	for _, want := range []string{
		`<header class="sc-head">`,
		`sc-head__left-eyebrow sc-head__slot--line">Monster</div>`,
		`<h2 class="sc-head__slot sc-head__left-primary sc-head__slot--line">Goblin Cutter</h2>`,
		`sc-head__left-deck sc-head__slot--line">Goblin, Humanoid</div>`,
		`sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
		`sc-head__right-primary sc-head__slot--mini" data-role="harrier">Minion Harrier</div>`,
		`sc-head__right-deck sc-head__slot--chip">EV 4</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}

func TestStatblockKindNoun(t *testing.T) {
	cases := map[string]string{
		"mcdm.monsters.v1/monster.goblin.statblock/cutter":              "Monster",
		"mcdm.beastheart.v1/monster.companion.beastheart.statblock/wolf": "Companion",
		"mcdm.monsters.v1/monster.retainer.statblock/squire":            "Retainer",
		"mcdm.summoner.v1/monster.minion.summoner.fire.statblock/x":      "Summon",
	}
	for scc, want := range cases {
		if got := statblockKindNoun(scc); got != want {
			t.Errorf("statblockKindNoun(%q) = %q, want %q", scc, got, want)
		}
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'TestRenderStatblockHead_SixSlot|TestStatblockKindNoun' -v`
Expected: FAIL — `d.KindNoun undefined` / `undefined: statblockKindNoun` / old `sb__head` markup.

- [ ] **Step 3: Add `KindNoun` to the island + the kind-noun helper**

In `statblock_page.go`, add the field to `sbIsland` (next to `Ancestry`):

```go
	Ancestry        string      `json:"ancestry"`
	KindNoun        string      `json:"kindNoun"`
```

Set it in `buildStatblockIsland` (in the returned `sbIsland{…}` literal, after `Ancestry: ancestry,`):

```go
		Ancestry: ancestry,
		KindNoun: statblockKindNoun(parseFrontmatterField(fm, "scc")),
```

Add the helper (e.g. at the end of `statblock_page.go`):

```go
// statblockKindNoun derives the card's kind-noun from its SCC type-path:
// companion/retainer families and summoner summons read truer than "Monster".
func statblockKindNoun(scc string) string {
	_, rest, ok := strings.Cut(strings.TrimSpace(scc), "/")
	if !ok {
		return "Monster"
	}
	typePath, _, _ := strings.Cut(rest, "/")
	switch {
	case strings.Contains(typePath, "companion"):
		return "Companion"
	case strings.Contains(typePath, "retainer"):
		return "Retainer"
	case strings.Contains(typePath, "summoner"), strings.Contains(typePath, "rival"):
		return "Summon"
	default:
		return "Monster"
	}
}
```

- [ ] **Step 4: Rewrite `renderStatblockHead`**

Replace the body of `renderStatblockHead` (`statblock_card.go:286-309`) with:

```go
func renderStatblockHead(d sbIsland) string {
	level := ""
	if strings.TrimSpace(d.Level) != "" {
		level = "Level " + sbEsc(d.Level)
	}
	ev := ""
	if strings.TrimSpace(d.EV) != "" {
		ev = "EV " + sbEsc(d.EV)
	} else if strings.TrimSpace(d.Cost) != "" {
		// Summoner statblocks bought with a resource carry a generic cost in the EV slot.
		ev = sbEsc(d.Cost)
	}
	return renderCardHead(cardHeadSlots{
		NameTag:      "h2",
		RoleKey:      d.RoleKey,
		LeftEyebrow:  hLine(sbEsc(d.KindNoun)),
		LeftPrimary:  hLine(sbEsc(d.Name)),
		LeftDeck:     hLine(sbEsc(d.Ancestry)),
		RightEyebrow: hChip(level),
		RightPrimary: hMini(sbEsc(d.Role)),
		RightDeck:    hChip(ev),
	})
}
```

- [ ] **Step 5: Run the new + existing statblock tests**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'Statblock' -v`
Expected: the two new tests PASS. `TestRenderStatblockHead_OmitsEmptyEV` may now reference removed markup (`EV 32` still appears via `right-deck`) — if it asserts old class names, update its assertions to the `sc-head__right-deck … >EV 32</div>` form. Golden HTML fixtures will differ.

- [ ] **Step 6: Regenerate + review golden fixtures**

Run: `devbox run -- env STEEL_UPDATE_GOLDEN=1 go -C steel-etl test ./internal/site/ -run Golden`
Then: `git -C steel-etl diff internal/site/testdata/statblock_golden/`
Expected: diffs are confined to head markup (`sb__head`→`sc-head`, keywords moved below the name). Confirm no body/stat changes.

- [ ] **Step 7: Run the full site package + commit**

Run: `devbox run -- go -C steel-etl test ./internal/site/...`
Expected: PASS.

```bash
git -C steel-etl add internal/site/statblock_page.go internal/site/statblock_card.go internal/site/statblock_card_test.go internal/site/testdata/statblock_golden
git -C steel-etl commit -m "feat(site): migrate statblock head to shared 6-slot header"
```

---

## Task 4: Migrate the ability card head

**Files:**
- Modify: `steel-etl/internal/site/ability_cards.go:244-260` (the head block in `renderAbilityCard`)
- Test: `steel-etl/internal/site/ability_cards_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `actionInfo` (existing), `costBadge`/`costPrevHTML` (existing).
- The head's left-deck (class · subclass) reads frontmatter `class`/`subclass`; usage → `right-deck` chip, cost → `right-primary` mini-title, level → `right-eyebrow` chip.

- [ ] **Step 1: Write the failing test**

```go
func TestAbilityCard_SixSlotHead(t *testing.T) {
	fm := "name: Black Ash Teleport\ntype: ability\naction_type: Maneuver\ncost: Signature\nclass: shadow\nsubclass: college-of-black-ash\nlevel: 1"
	got := renderAbilityCard(fm, "")
	for _, want := range []string{
		`<header class="sc-head">`,
		`sc-head__left-eyebrow sc-head__slot--line">Ability</div>`,
		`sc-head__left-primary sc-head__slot--line">Black Ash Teleport</h3>`,
		`sc-head__left-deck sc-head__slot--line">Shadow · College Of Black Ash</div>`,
		`sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
		`sc-head__right-primary sc-head__slot--mini">Signature</div>`,
		`sc-head__right-deck sc-head__slot--chip">Maneuver</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run TestAbilityCard_SixSlotHead -v`
Expected: FAIL — old `sc-ability__eyebrow` markup, no `sc-head`.

- [ ] **Step 3: Add a provenance helper + rewrite the head block**

Add near the top of `ability_cards.go`:

```go
// abilityOrigin builds the left-deck provenance "Class · Subclass" from
// frontmatter (slug → Title Case, "-" → space). Either part may be absent.
func abilityOrigin(fm string) string {
	var parts []string
	for _, key := range []string{"class", "subclass"} {
		if v := strings.TrimSpace(parseFrontmatterField(fm, key)); v != "" {
			parts = append(parts, titleCase(strings.ReplaceAll(v, "-", " ")))
		}
	}
	return strings.Join(parts, " · ")
}
```

Replace the head block (`ability_cards.go:250-260`, from `// head: crest · titles · cost` through the closing `</div>` of `sc-ability__head`) with:

```go
	level := ""
	if lv := strings.TrimSpace(parseFrontmatterField(fm, "level")); lv != "" {
		level = "Level " + html.EscapeString(lv)
	}
	b.WriteString(renderCardHead(cardHeadSlots{
		Crest:        fmt.Sprintf(`<span class="sc-crest sc-ability__crest"><span class="sc-ability__glyph">%s</span></span>`, html.EscapeString(act.glyph)),
		LeftEyebrow:  hLine("Ability"),
		LeftPrimary:  hLine(html.EscapeString(name)),
		LeftDeck:     hLine(html.EscapeString(abilityOrigin(fm))),
		RightEyebrow: hChip(level),
		RightPrimary: hMini(html.EscapeString(cost)),
		RightDeck:    hChip(html.EscapeString(act.label)),
	}))
```

(The pre-head line `dia := ...` and `<article …>` opener stay; `act` and `cost` are already computed above this block.)

- [ ] **Step 4: Run new + existing ability tests**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run Ability -v`
Expected: new test PASS. If an existing test asserts `sc-ability__eyebrow`, update it to the `sc-head__right-deck …` (usage) form.

- [ ] **Step 5: Commit**

```bash
git -C steel-etl add internal/site/ability_cards.go internal/site/ability_cards_test.go
git -C steel-etl commit -m "feat(site): migrate ability card head to shared 6-slot header"
```

---

## Task 5: Migrate the trait/feature card head

**Files:**
- Modify: `steel-etl/internal/site/trait_cards.go` (`wrapTraitSection` + its two callers `renderTraitCard`, `renderTraitNode`)
- Test: `steel-etl/internal/site/trait_cards_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `featureNoun` (existing), `traitEyebrowPrefix`/`traitEyebrow` (existing — repurposed as the origin), `traitTag` data.
- `wrapTraitSection` changes signature to take structured pieces instead of a pre-built `eyebrow`/`tag` string.

The current eyebrow `"<Class> Feature · <subclass>"` splits: the **noun** ("Feature"/"Trait") → `left-eyebrow`; the **source · subclass** → `left-deck`. The `traitTag` cost/level split → `right-eyebrow` (level) + `right-primary` (cost).

- [ ] **Step 1: Write the failing test**

```go
func TestTraitCard_SixSlotHead(t *testing.T) {
	fm := "name: Black Ash Teleport\ntype: feature\nclass: shadow\nsubclass: college-of-black-ash\nlevel: 1"
	got := renderTraitCard(fm, "Some body.")
	for _, want := range []string{
		`sc-head__left-eyebrow sc-head__slot--line">Feature</div>`,
		`sc-head__left-primary sc-head__slot--line">Black Ash Teleport</h3>`,
		`sc-head__left-deck sc-head__slot--line">Shadow · College Of Black Ash</div>`,
		`sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}

func TestTraitCard_AncestryReadsTrait(t *testing.T) {
	fm := "name: Stone Skin\ntype: trait\nancestry: dwarf"
	got := renderTraitCard(fm, "Some body.")
	if !strings.Contains(got, `sc-head__left-eyebrow sc-head__slot--line">Trait</div>`) {
		t.Errorf("ancestry feature eyebrow should read Trait:\n%s", got)
	}
	if !strings.Contains(got, `sc-head__left-deck sc-head__slot--line">Dwarf</div>`) {
		t.Errorf("left-deck should be the ancestry provenance:\n%s", got)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'TestTraitCard_SixSlotHead|TestTraitCard_AncestryReadsTrait' -v`
Expected: FAIL — old `sc-trait__eyebrow` markup.

- [ ] **Step 3: Split the origin from the noun, and rewrite `wrapTraitSection`**

Add to `trait_cards.go` (origin = the eyebrow minus the noun):

```go
// traitOrigin is the left-deck provenance: "<Source> · <subclass>" with the
// feature-noun stripped (the noun is the left-eyebrow). Built from the same
// pieces as traitEyebrowPrefix/traitEyebrow.
func traitOrigin(fm string) string {
	src := ""
	for _, key := range []string{"class", "ancestry", "kit"} {
		if v := strings.TrimSpace(parseFrontmatterField(fm, key)); v != "" {
			src = titleCase(strings.ReplaceAll(v, "-", " "))
			break
		}
	}
	if fs := strings.TrimSpace(parseFrontmatterField(fm, "feature_source")); fs != "" && fs != "summoner" && src != "" {
		src = strings.TrimSpace(src + " " + titleCase(strings.ReplaceAll(fs, "-", " ")))
	}
	if sub := strings.TrimSpace(parseFrontmatterField(fm, "subclass")); sub != "" {
		if src != "" {
			src += " · " + titleCase(strings.ReplaceAll(sub, "-", " "))
		} else {
			src = titleCase(strings.ReplaceAll(sub, "-", " "))
		}
	}
	return src
}
```

Change `wrapTraitSection` to take the slot pieces and emit the shared head. New signature + body:

```go
// wrapTraitSection assembles one <section class="sc-trait …"> with the shared
// 6-slot head + body, as a single contiguous block. noun/origin/level/cost feed
// the head slots; origin/level/cost may be empty.
func wrapTraitSection(cls, attrs, crest, noun, origin, name, level, cost, bodyHTML string) string {
	levelChip := ""
	if strings.TrimSpace(level) != "" {
		levelChip = "Level " + html.EscapeString(level)
	}
	head := renderCardHead(cardHeadSlots{
		Crest:        crest,
		LeftEyebrow:  hLine(html.EscapeString(noun)),
		LeftPrimary:  hLine(html.EscapeString(name)),
		LeftDeck:     hLine(html.EscapeString(origin)),
		RightEyebrow: hChip(levelChip),
		RightPrimary: hMini(html.EscapeString(strings.TrimSpace(cost))),
	})
	var b strings.Builder
	fmt.Fprintf(&b, "<section class=\"%s\" data-action=\"trait\"%s>\n", cls, attrs)
	b.WriteString(head)
	b.WriteString("\n<div class=\"sc-trait__body\">\n")
	b.WriteString(bodyHTML)
	b.WriteString("</div>\n</section>\n")
	return b.String()
}
```

- [ ] **Step 4: Update the two callers**

In `renderTraitCard` (replace the `eyebrow`/`tag` lines + the `return`):

```go
	noun := featureNoun(parseFrontmatterField(fm, "type"))
	origin := traitOrigin(fm)
	level := strings.TrimSpace(parseFrontmatterField(fm, "level"))
	if level == "" {
		if m := sccLevelRe.FindStringSubmatch(parseFrontmatterField(fm, "scc")); m != nil {
			level = m[1]
		}
	}
	cost := strings.TrimSpace(parseFrontmatterField(fm, "cost"))
	intro, children := parseTraitTree(body)
	prefix := traitEyebrowPrefix(fm)
	bodyHTML, leadProse := renderTraitBody(intro, children, prefix)
	cls := "sc-trait sc-trait--crest"
	if leadProse {
		cls += " sc-trait--lead"
	}
	return wrapTraitSection(cls, traitFeatureAttrs(children), traitCrest(), noun, origin, name, level, cost, bodyHTML)
```

In `renderTraitNode` (sub-trait: noun is empty — the parent card already declares it; origin is the inherited prefix + own subclass; level from scc):

```go
	intro, _ := parseTraitTree(n.content)
	bodyHTML, _ := renderTraitBody(intro, n.children, prefix)
	level := ""
	if m := sccLevelRe.FindStringSubmatch(n.scc); m != nil {
		level = m[1]
	}
	origin := ""
	if n.subclass != "" {
		sub := titleCase(strings.ReplaceAll(n.subclass, "-", " "))
		if prefix != "" {
			origin = prefix + " · " + sub
		} else {
			origin = sub
		}
	}
	return wrapTraitSection("sc-trait", "", "", "", origin, strings.TrimSpace(n.name), level, n.cost, bodyHTML)
```

Remove the now-unused `traitTag` function if nothing else references it (check with `grep -rn traitTag internal/site`); if other code uses it, leave it.

- [ ] **Step 5: Run trait tests**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run Trait -v`
Expected: new tests PASS. Update any existing test asserting `sc-trait__eyebrow`/`sc-trait__tag` to the `sc-head__…` forms.

- [ ] **Step 6: Commit**

```bash
git -C steel-etl add internal/site/trait_cards.go internal/site/trait_cards_test.go
git -C steel-etl commit -m "feat(site): migrate trait/feature card head to shared 6-slot header"
```

---

## Task 6: Migrate the featureblock card head

**Files:**
- Modify: `steel-etl/internal/site/featureblock_page.go:148-190` (`fbEyebrow` → slot helpers; head block in `renderFeatureblockCard`)
- Test: `steel-etl/internal/site/featureblock_page_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `fbDataRole` (existing).
- Produces: `func fbKindNoun(doc fbDoc) string`, `func fbTypeRole(doc fbDoc) string` (combined "type + Role").

The current single-line `fbEyebrow` unpacks: kind-noun → `left-eyebrow`; type+role combined → `right-primary` mini-title; level → `right-eyebrow`; EV (from `doc.Stats`) → `right-deck`. The rest of `doc.Stats` stays in the existing `fb__stats` body grid (unchanged).

- [ ] **Step 1: Write the failing test**

```go
func TestFeatureblockCard_SixSlotHead(t *testing.T) {
	doc := fbDoc{
		Kind: "dynamic-terrain", Name: "Spike Pit", TerrainType: "Trap", Role: "Hazard", Level: 1,
		Stats: []fbStat{{Name: "EV", Value: "2"}, {Name: "Stamina", Value: "3 per square"}},
	}
	got := renderFeatureblockCard(doc)
	for _, want := range []string{
		`sc-head__left-eyebrow sc-head__slot--line">Dynamic Terrain</div>`,
		`sc-head__left-primary sc-head__slot--line">Spike Pit</h2>`,
		`sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
		`sc-head__right-primary sc-head__slot--mini" data-role="hazard">Trap Hazard</div>`,
		`sc-head__right-deck sc-head__slot--chip">EV 2</div>`,
		`class="fb__stats"`, // remaining loose stats still render in the body grid
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run TestFeatureblockCard_SixSlotHead -v`
Expected: FAIL — old `fb__eyebrow` markup.

- [ ] **Step 3: Add the kind-noun + type+role helpers + an EV extractor**

```go
// fbKindNoun is the left-eyebrow kind-noun for a featureblock family card.
func fbKindNoun(doc fbDoc) string {
	switch {
	case doc.Kind == "dynamic-terrain":
		return "Dynamic Terrain"
	case doc.Kind == "fixture":
		return "Fixture"
	case doc.Kind == "malice":
		return "Malice"
	case doc.Kind == "advancement":
		return "Advancement"
	default:
		return "Featureblock"
	}
}

// fbTypeRole combines the descriptive type and combat role the way the book
// does ("Trap Hazard"), for the right-primary mini-title. Either part may be absent.
func fbTypeRole(doc fbDoc) string {
	return strings.TrimSpace(strings.TrimSpace(doc.TerrainType) + " " + strings.TrimSpace(doc.Role))
}

// fbEV pulls the "EV" loose stat for the right-deck chip ("" if absent).
func fbEV(stats []fbStat) string {
	for _, st := range stats {
		if strings.EqualFold(strings.TrimSpace(st.Name), "EV") {
			return "EV " + strings.TrimSpace(st.Value)
		}
	}
	return ""
}
```

- [ ] **Step 4: Replace the head block in `renderFeatureblockCard`**

Replace `featureblock_page.go:186-190` (the `<header class="fb__head">…</header>` block) with:

```go
	level := ""
	if doc.Level > 0 {
		level = fmt.Sprintf("Level %d", doc.Level)
	}
	b.WriteString(renderCardHead(cardHeadSlots{
		NameTag:      "h2",
		RoleKey:      fbDataRole(doc),
		LeftEyebrow:  hLine(html.EscapeString(fbKindNoun(doc))),
		LeftPrimary:  hLine(html.EscapeString(name)),
		LeftDeck:     hLine(html.EscapeString(strings.TrimSpace(doc.Eyebrow))),
		RightEyebrow: hChip(html.EscapeString(level)),
		RightPrimary: hMini(html.EscapeString(fbTypeRole(doc))),
		RightDeck:    hChip(html.EscapeString(fbEV(doc.Stats))),
	}))
	b.WriteString("\n")
```

(`doc.Eyebrow` is used here as the `left-deck` provenance. **Verify what it holds for a fixture** before relying on it: `grep -rn "Eyebrow" internal/site/featureblock_page.go internal/content/*.go`. The spec requires a fixture's `left-deck` to read `class · subclass` (e.g. "Summoner · Fire"). If `doc.Eyebrow` is not already that string, add a `fbOrigin(doc fbDoc) string` helper that derives it from `doc.Scc` — mirroring `statblockKindNoun` (Task 3): split the type-path `monster.fixture.<element>.…`, and return `"Summoner · " + titleCase(<element>)`. Use `hLine(html.EscapeString(fbOrigin(doc)))` for `LeftDeck` in that case, and add a test asserting `sc-head__left-deck …>Summoner · Fire</div>` for a fixture `fbDoc`. `fbEyebrow` is now unused — delete it and its references; confirm with `grep -rn fbEyebrow internal/site`.)

- [ ] **Step 5: Run featureblock tests**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run Featureblock -v`
Expected: new test PASS. Update existing tests asserting `fb__eyebrow` (e.g. `featureblock_page_test.go:92` "Malice Features") — under the new model "Malice" is the `left-eyebrow` noun; adjust the assertion to `sc-head__left-eyebrow … >Malice</div>`.

- [ ] **Step 6: Commit**

```bash
git -C steel-etl add internal/site/featureblock_page.go internal/site/featureblock_page_test.go
git -C steel-etl commit -m "feat(site): migrate featureblock card head to shared 6-slot header"
```

---

## Task 7: Migrate sub-feature heads + flat-list collapse

**Files:**
- Modify: `steel-etl/internal/site/statblock_card.go:110-125` (head block in `renderStatblockFeature`)
- Modify: `steel-etl/internal/site/featureblock_page.go` (the per-feature head — `renderFbFeature`/equivalent that emits `fb__feat-eyebrow`)
- Test: `steel-etl/internal/site/statblock_card_test.go`, `featureblock_page_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `sbACT`/`sbCostBadge` (existing).
- Sub-feature head: `left-primary` = name only; `right-primary` = cost (mini); `right-deck` = usage (chip). No eyebrow/deck/level. The `.sb__feat`/`.fb__feat` article wrapper is unchanged, so the flat-list CSS hook from Task 2 targets it.

- [ ] **Step 1: Write the failing test**

```go
func TestStatblockFeature_SixSlotHead(t *testing.T) {
	f := sbFeature{Name: "Cleave", Action: "main", Usage: "Main Action", Cost: "Signature", Kind: "ability"}
	got := renderStatblockFeature(f)
	for _, want := range []string{
		`sc-head__left-primary sc-head__slot--line">Cleave</h3>`,
		`sc-head__right-primary sc-head__slot--mini">Signature</div>`,
		`sc-head__right-deck sc-head__slot--chip">Main Action</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
	if strings.Contains(got, "sc-head__left-eyebrow") || strings.Contains(got, "sc-head__right-eyebrow") {
		t.Errorf("sub-feature must not emit eyebrow lanes:\n%s", got)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run TestStatblockFeature_SixSlotHead -v`
Expected: FAIL — old `sb__feat-eyebrow`/`sb__feat-titles` markup.

- [ ] **Step 3: Replace the statblock sub-feature head block**

Replace `statblock_card.go:110-125` (from `// head:` through the `sb__feat-head` closing `</div>`) with:

```go
	// head: crest + inline icon (CSS shows one) · name · cost(mini) · usage(chip)
	b.WriteString(`<div class="sb__feat-head">`)
	crest := `<span class="sc-crest sb__feat-crest"><span class="sb__feat-glyph">` + a.glyph + `</span></span>` +
		`<span class="sb__feat-icon"><span class="sb__feat-glyph">` + a.glyph + `</span></span>`
	usage := f.Usage
	if usage == "" && f.Kind == "passive" {
		usage = "Trait"
	}
	b.WriteString(renderCardHead(cardHeadSlots{
		Crest:        crest,
		LeftPrimary:  hLine(richSb(f.Name)),
		RightPrimary: hMini(richSb(f.Cost)),
		RightDeck:    hChip(richSb(usage)),
	}))
	b.WriteString(`</div>`)
```

(Drop the old `sbCostBadge(f.Cost)` corner — cost now lives in `right-primary`. The `sb__feat-head` wrapper is kept so the flat-list CSS hook and existing layout rules still match.)

- [ ] **Step 4: Replace the featureblock sub-feature head**

In `renderFbFeat` (`featureblock_page.go:322`), replace the head block (lines 325-339, from `// head: icon …` through the `fb__feat-head` closing `</div>\n`) with:

```go
	// head: icon · name · cost(mini) · usage(chip)
	b.WriteString("<div class=\"fb__feat-head\">")
	crest := ""
	if ic := strings.TrimSpace(f.Icon); ic != "" {
		crest = fmt.Sprintf("<span class=\"fb__feat-icon\">%s</span>", html.EscapeString(ic))
	}
	b.WriteString(renderCardHead(cardHeadSlots{
		Crest:        crest,
		LeftPrimary:  hLine(html.EscapeString(strings.TrimSpace(f.Name))),
		RightPrimary: hMini(html.EscapeString(strings.TrimSpace(f.Cost))),
		RightDeck:    hChip(richInline(strings.TrimSpace(f.Usage))),
	}))
	b.WriteString("</div>\n")
```

(The `costBadge` corner is dropped — cost is now `right-primary`. The `fb__feat-head`/`fb__feat` wrappers stay so the flat-list CSS hook still matches.)

- [ ] **Step 5: Run sub-feature tests + regenerate statblock goldens**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'Feature|Statblock|Featureblock' -v`
Then regenerate goldens (head markup changed inside statblock cards):
`devbox run -- env STEEL_UPDATE_GOLDEN=1 go -C steel-etl test ./internal/site/ -run Golden`
Review: `git -C steel-etl diff internal/site/testdata/statblock_golden/` — diffs confined to feature heads.

- [ ] **Step 6: Verify flat-list collapse in the browser**

Build + open the site, open a statblock, toggle Feature Style → Flat list in the settings drawer. Expected: each feature reads `Name · Cost · Usage` inline, no rail/eyebrow. (CSS from Task 2; no Go change needed.)

```bash
devbox run -- mkdocs build -f v2/mkdocs.yml
```

- [ ] **Step 7: Commit**

```bash
git -C steel-etl add internal/site/statblock_card.go internal/site/featureblock_page.go internal/site/statblock_card_test.go internal/site/featureblock_page_test.go internal/site/testdata/statblock_golden
git -C steel-etl commit -m "feat(site): migrate sub-feature heads to shared header + flat-list collapse"
```

---

## Task 8: Migrate preview/index cards

**Files:**
- Modify: `steel-etl/internal/site/feature_index.go:430-522` (`renderTraitPrev`, `renderAbilityPrev`)
- Modify: `steel-etl/internal/site/statblock_preview.go` (already calls `renderStatblockHead` — verify it now emits `sc-head`; no change expected beyond confirmation)
- Test: `steel-etl/internal/site/feature_index_test.go`

**Interfaces:**
- Consumes: `renderCardHead`, `abilityOrigin`/`traitOrigin` patterns (mirror Tasks 4/5 using `browseItem` fields), `actionByKey` (existing).
- The preview's head uses the same slots as the full card; the preview-specific body (flavor, foot markers, keyword chips) is unchanged below the head.

- [ ] **Step 1: Write the failing test**

```go
func TestAbilityPrev_SixSlotHead(t *testing.T) {
	it := browseItem{Kind: "ability", Name: "Black Ash Teleport", Action: "maneuver",
		Cost: "Signature", Klass: "Shadow", Subclass: "College Of Black Ash", levelStr: "1", Href: "x/"}
	got := renderAbilityPrev(it, false)
	for _, want := range []string{
		`sc-head__left-eyebrow sc-head__slot--line">Ability</div>`,
		`sc-head__left-primary sc-head__slot--line">Black Ash Teleport</h3>`,
		`sc-head__left-deck sc-head__slot--line">Shadow · College Of Black Ash</div>`,
		`sc-head__right-eyebrow sc-head__slot--chip">Level 1</div>`,
		`sc-head__right-primary sc-head__slot--mini">Signature</div>`,
		`sc-head__right-deck sc-head__slot--chip">Maneuver</div>`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("missing %q in:\n%s", want, got)
		}
	}
}

func TestTraitPrev_SixSlotHead(t *testing.T) {
	it := browseItem{Kind: "feature", Name: "Black Ash Teleport", Klass: "Shadow",
		Subclass: "College Of Black Ash", levelStr: "1", Href: "x/"}
	got := renderTraitPrev(it, false)
	if !strings.Contains(got, `sc-head__left-eyebrow sc-head__slot--line">Feature</div>`) {
		t.Errorf("missing Feature eyebrow:\n%s", got)
	}
	if !strings.Contains(got, `sc-head__left-deck sc-head__slot--line">Shadow · College Of Black Ash</div>`) {
		t.Errorf("missing origin deck:\n%s", got)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'TestAbilityPrev_SixSlotHead|TestTraitPrev_SixSlotHead' -v`
Expected: FAIL — old `sc-prev__eyebrow` markup.

- [ ] **Step 3: Rewrite the two preview heads**

In `renderAbilityPrev`, replace the head construction (the `sc-prev__head`/`sc-prev__titles`/`sc-prev__eyebrow` block + its `tag`) with a `renderCardHead` call, keeping the `<a class="sc-prev …">` wrapper and the body (`flavor`, `kw`, `foot`):

```go
	act := it.Action
	if act == "" {
		act = "main"
	}
	meta, ok := actionByKey[act]
	if !ok {
		meta = actionByKey["main"]
	}
	origin := strings.TrimSpace(html.EscapeString(it.Klass))
	if it.Subclass != "" {
		if origin != "" {
			origin += " · " + html.EscapeString(it.Subclass)
		} else {
			origin = html.EscapeString(it.Subclass)
		}
	}
	level := ""
	if it.levelStr != "" {
		level = "Level " + html.EscapeString(it.levelStr)
	}
	head := renderCardHead(cardHeadSlots{
		Crest:        `<span class="sc-crest sc-prev__crest"><span class="sc-prev__glyph">` + html.EscapeString(meta[1]) + `</span></span>`,
		LeftEyebrow:  hLine("Ability"),
		LeftPrimary:  hLine(html.EscapeString(it.Name)),
		LeftDeck:     hLine(origin),
		RightEyebrow: hChip(level),
		RightPrimary: hMini(html.EscapeString(it.Cost)),
		RightDeck:    hChip(html.EscapeString(meta[0])),
	})
	return "<a class=\"sc-prev sc-prev--ability sc-fil\" data-action=\"" + html.EscapeString(act) +
		"\" href=\"" + html.EscapeString(it.Href) + "\">" + head + flavor + kw + foot + "</a>\n"
```

(`flavor`, `kw`, `foot` are the existing preview-body variables — keep their construction above the head, unchanged.)

Then rewrite `renderTraitPrev`'s head the same way (full code, do not skip — the engineer may read tasks out of order):

```go
	noun := featureNoun(it.Kind)
	origin := strings.TrimSpace(html.EscapeString(it.Klass))
	if it.Subclass != "" {
		if origin != "" {
			origin += " · " + html.EscapeString(it.Subclass)
		} else {
			origin = html.EscapeString(it.Subclass)
		}
	}
	level := ""
	if it.levelStr != "" {
		level = "Level " + html.EscapeString(it.levelStr)
	}
	cost := ""
	if it.Tag != "" { // trait preview "cost" pill (e.g. "1 Point")
		cost = html.EscapeString(it.Tag)
	}
	head := renderCardHead(cardHeadSlots{
		Crest:        `<span class="sc-crest sc-prev__crest"><span class="sc-prev__glyph">` + traitGlyph + `</span></span>`,
		LeftEyebrow:  hLine(html.EscapeString(noun)),
		LeftPrimary:  hLine(html.EscapeString(it.Name)),
		LeftDeck:     hLine(origin),
		RightEyebrow: hChip(level),
		RightPrimary: hMini(cost),
	})
	flavor := ""
	if it.Flavor != "" {
		flavor = "<div class=\"sc-prev__flavor\">" + html.EscapeString(it.Flavor) + "</div>"
	}
	return "<a class=\"sc-prev sc-prev--trait sc-fil\" data-action=\"trait\" href=\"" +
		html.EscapeString(it.Href) + "\">" + head + flavor + traitFootMarker(it) + "</a>\n"
```

- [ ] **Step 4: Confirm `statblock_preview.go` inherits the new head**

`renderStatblockPreviewCard` already calls `renderStatblockHead` (now emitting `sc-head`). Add a guard test:

```go
func TestStatblockPreview_UsesSharedHead(t *testing.T) {
	got := renderStatblockPreviewCard(sbIsland{KindNoun: "Monster", Name: "Goblin Cutter", Level: "1"}, "x/", "")
	if !strings.Contains(got, `<header class="sc-head">`) {
		t.Errorf("preview should use shared head:\n%s", got)
	}
}
```

- [ ] **Step 5: Run preview tests**

Run: `devbox run -- go -C steel-etl test ./internal/site/ -run 'Prev|Preview' -v`
Expected: PASS. Update any existing assertion on `sc-prev__eyebrow`.

- [ ] **Step 6: Full package test + commit**

Run: `devbox run -- go -C steel-etl test ./internal/site/...`
Expected: PASS.

```bash
git -C steel-etl add internal/site/feature_index.go internal/site/feature_index_test.go internal/site/statblock_preview.go internal/site/statblock_preview_test.go
git -C steel-etl commit -m "feat(site): migrate preview cards to shared 6-slot header"
```

---

## Final verification (after all tasks)

- [ ] **Full steel-etl test suite + vet:**

```bash
devbox run -- go -C steel-etl test ./...
devbox run -- go -C steel-etl vet ./...
```
Expected: PASS / clean.

- [ ] **Build the site and spot-check the four card families** (statblock, ability, feature/trait, featureblock/fixture) plus the flat-list toggle and a narrow viewport (mobile wrap):

```bash
devbox run -- env -C steel-etl go run ./cmd/steel-etl site --config ../v2/site.yaml
devbox run -- mkdocs build -f v2/mkdocs.yml
```
Then open the built site (Brave per the reference memory) and confirm: same eyebrow/name/deck/rail on every card; statblock keywords now below the name; flat-list inlines `name · cost · usage`; nothing truncated at narrow width.

- [ ] **Land the work** (from the workspace root): `just wt-finish card-header` — pushes each touched submodule (`steel-etl`, `v2`) + the superproject pointer bump. Then deploy per CLAUDE.md (`just deploy-v2`) when ready.

---

## Notes for the implementer

- **Do not edit generated output.** Card HTML is produced by these Go renderers at build time; never touch `v2/docs/Browse|Read|scc/` or `data/`.
- **Golden fixtures** live at `steel-etl/internal/site/testdata/statblock_golden/`. Regenerate with `STEEL_UPDATE_GOLDEN=1` only after confirming the rendered diff is intentional (head markup only).
- **Existing tests asserting old class names** (`sc-ability__eyebrow`, `sc-trait__eyebrow`, `sb__kw`, `fb__eyebrow`, `sb__feat-eyebrow`, `sc-prev__eyebrow`) will fail by design as each task lands — update them to the `sc-head__…` equivalents in the same task. Grep before each commit: `grep -rn '__eyebrow\|sb__kw\|__feat-eyebrow' internal/site/*_test.go`.
- **Per-card CSS sheets** (`steel-ability-cards.css`, `steel-statblock.css`, `steel-traits.css`, `steel-featureblock.css`, `steel-indexes.css`) keep their crest/spine/color rules but no longer need their own head/eyebrow/title/tag rules — those are superseded by `steel-cardhead.css`. Removing the dead head rules is optional cleanup; doing it per-sheet as you migrate each card keeps the diff honest.

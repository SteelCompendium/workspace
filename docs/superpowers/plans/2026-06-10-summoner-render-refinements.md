# Summoner Site-Render Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two *real* summoner book-render defects found during review — (1) H8 retainer-advancement sub-headings leaking as literal `########` text, and (2) statblock signature-ability power rolls rendering as undifferentiated plain paragraphs instead of tier-badge rows.

**Architecture:** Fix (1) is a server-side render normalization in steel-etl's `RenderSubtree` (one helper in `render_subtree.go`), benefiting every book (Monsters has 183 of these, summoner 5). Fix (2) is a client-side DOM enhancement in v2's `ability-cards.js`, following the established `*-core.js` UMD + `node:test` pattern (mirrors `settings-core.js`/`settings-panel.js`): a pure, testable detection module plus a DOM transform that reuses the **existing** `.power-roll-tiers/.power-roll-row/.power-roll-badge` CSS (already in `tables.css`) — no new CSS.

**Tech Stack:** Go 1.26 (`go test`), vanilla browser JS (`node --test`), MkDocs Material. All Go/node commands run under devbox: prefix with `devbox run --`.

---

## Background: what was investigated and ruled out

FOLLOWUPS.md #8 listed three issues. Investigation against the generated output found:

- **"Spurious `---` after the class heading" → NOT a bug.** `injectH1`/`injectHRAfterH1` (`steel-etl/internal/site/build.go:550‑604`) deliberately put a `# Title` + `---` header rule on *every* book-faithful page (every heroes Read page has it: `# Combat` + `---`). Site-wide intentional styling. No change.
- **"Power-roll panels empty" on *class* abilities → NOT a bug (selector misdiagnosis).** The followup searched for class `sc-power-roll`; the real class is `sc-ability__pr`. All 10 standalone class power-roll abilities render fully-populated panels. No change.
- **The genuinely broken power rolls are on *statblocks*** (minion/fixture/champion/retainer/rival), a different format the renderer never handled — that is Task 2 below.
- **"`##` in headers" → the H8 `########` leak** — Task 1 below.

**Out of scope (recorded as a follow-up, not fixed here):** the statblock *data* layer. `parseStatblockFeature` (`statblock_parse.go`) leaves the dice notation inside the ability `name` (e.g. `name: "Molten Strike 2d10 + R"`) and drops the tier outcomes into `prose` instead of `effects.tier1/2/3`, because `sbPowerRollRe`/`sbTierRe` only match the labeled `**Power Roll +**`/`**≤11:**` form. This affects JSON/YAML output (data repos), not the site. Capture as a new FOLLOWUPS item after this plan ships; do **not** expand this plan to cover it.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `steel-etl/internal/content/render_subtree.go` | Book-order subtree → markdown | Add `demoteOverflowHeadings`; call it in `nodeBody`. Import `regexp`. |
| `steel-etl/internal/content/render_subtree_test.go` | RenderSubtree tests | Add one test for the demotion. |
| `v2/docs/javascripts/ability-cards-core.js` | **New.** Pure, DOM-free statblock-tier detection (UMD). | Create. |
| `v2/tests/ability-cards-core.test.js` | **New.** `node:test` unit tests for the core. | Create. |
| `v2/docs/javascripts/ability-cards.js` | Runtime DOM enhancements | Add `transformStatblockPowerRolls()`; call it in the classic-style branch of `init()`. |
| `v2/mkdocs.yml` | JS load order | Register `ability-cards-core.js` immediately before `ability-cards.js`. |

---

## Task 1: Demote overflow (H7+) headings to bold in RenderSubtree

**Why:** Draw Steel statblocks use H8 (`######## Level N Retainer Advancement Ability`) for advancement sub-labels. By design these are **not** collected as sections (they fold into the statblock body — see `steel-etl/CLAUDE.md` Monsters section). CommonMark caps headings at H6, so 7+ `#` render as literal hash text. `RenderSubtree` emits the body verbatim, so they leak. Demoting any 7+‑hash heading line to `**bold**` keeps them as the body sub-labels they're meant to be, with no TOC pollution.

**Files:**
- Modify: `steel-etl/internal/content/render_subtree.go`
- Test: `steel-etl/internal/content/render_subtree_test.go`

- [ ] **Step 1: Write the failing test**

Add to `steel-etl/internal/content/render_subtree_test.go`:

```go
func TestRenderSubtree_DemotesOverflowHeadings(t *testing.T) {
	// Retainer statblocks carry H8 "Level N … Advancement Ability" sub-labels,
	// which are NOT collected as sections and would otherwise leak as literal
	// "########" text. They must demote to bold body labels.
	sb := &parser.Section{
		Heading:      "Devil Detective",
		HeadingLevel: 6,
		Annotation:   map[string]string{"type": "statblock"},
		BodySource:   "> ⭐️ **Soulsight**\n\n######## Level 4 Retainer Advancement Ability\n\n> 🏹 **Soul Sleuth**",
	}
	got := RenderSubtree(sb, nil)
	if strings.Contains(got, "#######") {
		t.Errorf("7+ hash heading must not leak as literal hashes:\n%s", got)
	}
	if !strings.Contains(got, "**Level 4 Retainer Advancement Ability**") {
		t.Errorf("overflow heading should demote to bold:\n%s", got)
	}
	// A genuine blockquote in the same body must be untouched.
	if !strings.Contains(got, "> ⭐️ **Soulsight**") {
		t.Errorf("statblock blockquotes must be preserved:\n%s", got)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `devbox run -- go test ./internal/content/ -run TestRenderSubtree_DemotesOverflowHeadings -v`
(run from `steel-etl/`)
Expected: FAIL — output still contains `########` and lacks the bolded label.

- [ ] **Step 3: Write the implementation**

In `steel-etl/internal/content/render_subtree.go`, update the import block to add `regexp`:

```go
import (
	"regexp"
	"strings"

	"github.com/SteelCompendium/steel-etl/internal/parser"
)
```

Add the regex + helper near the bottom of the file (after `nodeBody`):

```go
// overflowHeadingRe matches an ATX heading deeper than H6 (7+ leading '#').
// CommonMark caps headings at H6, so these render as literal hashes. Draw Steel
// statblocks use H8 for retainer "Level N … Advancement Ability" sub-labels,
// which are intentionally not collected as sections (they fold into the
// statblock body); demote them to bold so they don't leak as raw '########'.
var overflowHeadingRe = regexp.MustCompile(`(?m)^#{7,}[ \t]+(.+?)[ \t]*$`)

// demoteOverflowHeadings rewrites every 7+-hash heading line to a bold label.
func demoteOverflowHeadings(body string) string {
	return overflowHeadingRe.ReplaceAllString(body, `**$1**`)
}
```

Update `nodeBody` to apply it (this single spot covers both the inline Read-chapter render and the standalone statblock page, since both go through `RenderSubtree`):

```go
// nodeBody returns a section's immediate body, un-blockquoted for ability
// sections (whose statblocks are blockquoted in source), with any overflow
// (7+ hash) heading demoted to bold.
func nodeBody(section *parser.Section) string {
	body := section.BodySource
	if section.Type() == "ability" {
		body = stripBlockquotePrefix(body)
	}
	return demoteOverflowHeadings(body)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `devbox run -- go test ./internal/content/ -run TestRenderSubtree_DemotesOverflowHeadings -v`
Expected: PASS

- [ ] **Step 5: Run the full content package tests (no regressions)**

Run: `devbox run -- go test ./internal/content/...`
Expected: PASS (all existing RenderSubtree tests still green).

- [ ] **Step 6: Commit**

```bash
cd steel-etl
git add internal/content/render_subtree.go internal/content/render_subtree_test.go
git commit -m "fix(render): demote H7+ statblock sub-headings to bold so they don't leak as literal hashes"
```

---

## Task 2: Render statblock power-roll tiers as badge rows on the site

**Why:** Statblock signature abilities encode the power roll in the **title** as dice notation (`🏹 **Molten Strike 2d10 + R (Signature Ability)**`) followed by **exactly three bare tier-outcome paragraphs**, each starting with its damage value:

```
> 🏹 **Molten Strike 2d10 + R (Signature Ability)**
>
> | **Magic, Melee, Strike** | **Main action** |
> | **📏 Melee 2** | **🎯 One creature or object per minion** |
>
> 4 fire damage; shift 3
> 6 fire damage; shift 4
> 8 fire damage; shift 5
>
> **Effect:** …
```

Statblocks aren't carded server-side (they pass through as raw blockquotes), and the existing `transformPowerRolls` only matches the *class* form (`<p><strong>Power Roll…</strong>` + a `<ul>` of `**≤11:**` items). So these three lines render as plain, undifferentiated paragraphs. The robust, verified signal (holds for all 26 instances, including the 13 with no WEAK/AVERAGE/STRONG potency keyword): inside an ability blockquote whose title carries dice notation, the first contiguous run of *bare, digit-led* `<p>` paragraphs are the tiers, mapped low/mid/high by position.

**Files:**
- Create: `v2/docs/javascripts/ability-cards-core.js`
- Create: `v2/tests/ability-cards-core.test.js`
- Modify: `v2/docs/javascripts/ability-cards.js`
- Modify: `v2/mkdocs.yml`

- [ ] **Step 1: Write the failing test for the pure core**

Create `v2/tests/ability-cards-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const Core = require("../docs/javascripts/ability-cards-core.js");

test("hasStatblockDiceRoll detects inline dice notation in titles", () => {
  assert.ok(Core.hasStatblockDiceRoll("Molten Strike 2d10 + R (Signature Ability)"));
  assert.ok(Core.hasStatblockDiceRoll("Grasping Appendages 2d10 + 5 (Signature Ability)"));
  assert.ok(Core.hasStatblockDiceRoll("Diabolic Probe 2d10 + highest characteristic"));
  assert.strictEqual(Core.hasStatblockDiceRoll("Call Forth (1+ Essence)"), false);
  assert.strictEqual(Core.hasStatblockDiceRoll("Soulsight"), false);
  assert.strictEqual(Core.hasStatblockDiceRoll(""), false);
  assert.strictEqual(Core.hasStatblockDiceRoll(null), false);
});

test("isTierLine matches bare damage-led tier outcomes only", () => {
  assert.ok(Core.isTierLine("5 acid damage; M < WEAK weakened (EoT)"));
  assert.ok(Core.isTierLine("11 corruption damage; R < 2 slowed (save ends)"));
  assert.ok(Core.isTierLine("2 damage"));
  assert.strictEqual(Core.isTierLine("Effect: After the squad uses this ability…"), false);
  assert.strictEqual(Core.isTierLine("Trigger: You use a triggered action."), false);
  assert.strictEqual(Core.isTierLine(""), false);
});

test("tierKeyAt maps position to low/mid/high", () => {
  assert.strictEqual(Core.tierKeyAt(0), "low");
  assert.strictEqual(Core.tierKeyAt(1), "mid");
  assert.strictEqual(Core.tierKeyAt(2), "high");
  assert.strictEqual(Core.tierKeyAt(3), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd v2 && node --test tests/ability-cards-core.test.js`
Expected: FAIL — `Cannot find module '../docs/javascripts/ability-cards-core.js'`.

- [ ] **Step 3: Write the pure core module**

Create `v2/docs/javascripts/ability-cards-core.js`:

```js
/*
 * ability-cards-core.js — pure, DOM-free helpers for ability-card enhancements.
 * UMD: exports for node:test, attaches to window.AbilityCardsCore in the browser.
 * Loaded BEFORE ability-cards.js in mkdocs.yml.
 *
 * Statblock signature abilities encode their power roll in the TITLE as dice
 * notation ("Nd10 + <characteristic>"), followed by exactly three bare tier
 * outcome paragraphs (each starting with the damage value) — unlike class
 * abilities, which use a "Power Roll +" header + a labeled "≤11/12-16/17+" list.
 */
;(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AbilityCardsCore = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // "2d10 + R", "2d10 + 5", "2d10 + highest characteristic"
  var DICE_RE = /\d+d\d+\s*\+/;
  // A tier outcome line starts with its damage number: "5 acid damage; …".
  var TIER_LEAD_RE = /^\s*\d+\b/;
  // Position → tier key (≤11 / 12-16 / 17+).
  var TIER_ORDER = ["low", "mid", "high"];

  function hasStatblockDiceRoll(titleText) {
    return DICE_RE.test(titleText || "");
  }

  function isTierLine(text) {
    return TIER_LEAD_RE.test(text || "");
  }

  function tierKeyAt(index) {
    return TIER_ORDER[index] || null;
  }

  return {
    DICE_RE: DICE_RE,
    hasStatblockDiceRoll: hasStatblockDiceRoll,
    isTierLine: isTierLine,
    tierKeyAt: tierKeyAt
  };
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd v2 && node --test tests/ability-cards-core.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the DOM transform into ability-cards.js**

In `v2/docs/javascripts/ability-cards.js`, add a reference to the core near the top of the IIFE (just after `"use strict";`):

```js
  var Core = (typeof window !== "undefined" && window.AbilityCardsCore) || null;
```

Add this function immediately after `transformPowerRolls()` (before `colorPowerRollTiers`):

```js
  /**
   * Statblock power rolls: an ability blockquote whose TITLE carries dice
   * notation ("Nd10 + X") is followed by the first contiguous run of bare,
   * digit-led tier paragraphs (≤3). Replace that run with a single
   * .power-roll-tiers badge group (low/mid/high by position), reusing the same
   * markup transformPowerRolls emits so the existing CSS styles it.
   */
  function transformStatblockPowerRolls() {
    if (!Core) return;
    var blockquotes = document.querySelectorAll(".md-typeset blockquote");
    for (var i = 0; i < blockquotes.length; i++) {
      var bq = blockquotes[i];
      var titleStrong = bq.querySelector("p strong");
      if (!titleStrong || !Core.hasStatblockDiceRoll(titleStrong.textContent)) continue;

      // Walk direct children in order; collect the first contiguous run of
      // bare (no leading <strong>), digit-led <p> tier lines.
      var run = [];
      var node = bq.firstElementChild;
      while (node) {
        if (node.tagName === "P") {
          var lead = node.querySelector("strong:first-child");
          if (!lead && Core.isTierLine(node.textContent)) {
            run.push(node);
            if (run.length === 3) break;
          } else if (run.length > 0) {
            break; // run ended (e.g. the **Effect:** paragraph)
          }
        }
        node = node.nextElementSibling;
      }
      if (run.length < 2) continue;
      if (run[0].getAttribute("data-power-roll-transformed")) continue;

      var wrapper = document.createElement("div");
      wrapper.className = "power-roll-tiers";
      wrapper.setAttribute("data-power-roll-transformed", "");

      for (var k = 0; k < run.length; k++) {
        var tier = Core.tierKeyAt(k);
        var row = document.createElement("div");
        row.className = "power-roll-row";

        var badge = document.createElement("span");
        badge.className = "ds-glyph power-roll-badge power-roll-badge--" + tier;
        badge.textContent = TIER_GLYPHS[tier];

        var effect = document.createElement("span");
        effect.className = "power-roll-effect";
        effect.innerHTML = run[k].innerHTML;

        row.appendChild(badge);
        row.appendChild(effect);
        wrapper.appendChild(row);
      }

      run[0].parentNode.insertBefore(wrapper, run[0]);
      for (var m = 0; m < run.length; m++) {
        run[m].parentNode.removeChild(run[m]);
      }
    }
  }
```

Then call it in `init()`, in the classic-style branch alongside `transformPowerRolls()`:

```js
  function init() {
    classifyAbilityCards();
    if (useClassicStyle()) {
      transformPowerRolls();
      transformStatblockPowerRolls();
    } else {
      colorPowerRollTiers();
    }
    wrapWideTables();
  }
```

(`TIER_GLYPHS` is already defined at the top of the IIFE; reuse it. `transformStatblockPowerRolls` must run before `wrapWideTables` so the spec `<table>` is still a direct child during the children-walk — `init()` already orders it this way.)

- [ ] **Step 6: Register the core in mkdocs.yml (load order matters)**

In `v2/mkdocs.yml`, in the `extra_javascript:` list, add `ability-cards-core.js` immediately **before** `ability-cards.js`:

```yaml
  - javascripts/ability-cards-core.js
  - javascripts/ability-cards.js
```

- [ ] **Step 7: Re-run the core unit tests (still green)**

Run: `cd v2 && node --test tests/ability-cards-core.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd v2
git add docs/javascripts/ability-cards-core.js docs/javascripts/ability-cards.js \
        tests/ability-cards-core.test.js mkdocs.yml
git commit -m "feat(v2): badge statblock power-roll tiers (dice-in-title + bare tier lines)"
```

---

## Task 3: Rebuild + verify end-to-end

**Why:** Both fixes only show up after re-running the pipeline (`gen`) and the site builder (`site`), then `mkdocs build`. Confirm the H8 leak is gone and statblock tiers carry badges, with no new build warnings.

**Files:** none (verification only).

- [ ] **Step 1: Regenerate summoner data + rebuild the site**

Run (from workspace root):

```bash
devbox run -- bash -c '
  cd steel-etl &&
  go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.summoner.v1 &&
  go run ./cmd/steel-etl site --config ../v2/site.yaml'
```

Expected: completes with no `unresolved scc link` or panic. (If `--book mcdm.summoner.v1` is rejected, confirm the id with `grep -n 'mcdm.summoner' pipeline.yaml` and use that, or fall back to `gen --all`.)

- [ ] **Step 2: Confirm the H8 leak is gone**

Run (from workspace root):

```bash
grep -rnE '^#{7,}' v2/docs/Read/summoner/ v2/docs/Bestiary/minion/ \
  v2/docs/Browse/champion/ v2/docs/Browse/fixture/ v2/docs/Browse/retainer/ 2>/dev/null
grep -rn 'Level 4 Retainer Advancement Ability' v2/docs/Read/summoner/other-summoners.md
```

Expected: first command prints **nothing** (no leaked hashes); second shows the label now wrapped as `**Level 4 Retainer Advancement Ability**`.

- [ ] **Step 3: Confirm statblock tier lines survive into the built page**

Run:

```bash
sed -n '/Burning\/Healing Rain/,/Minuscule/p' v2/docs/Bestiary/minion/fey/statblock/pixie-hydrain.md
```

Expected: the three tier paragraphs (`5 acid damage…`, `7 acid damage…`, `9 acid damage…`) are present in the markdown (the badge wrapping is applied client-side at runtime by `ability-cards.js`, so it won't appear in the `.md` — that is expected).

- [ ] **Step 4: mkdocs build with no new warnings**

Run: `devbox run -- mkdocs build` (from `v2/`)
Expected: build succeeds; no *new* `not found among documentation files` warnings beyond the ones already tracked in FOLLOWUPS #2/#4.

- [ ] **Step 5: Visual spot-check (browser)**

Per memory `reference_playwright_mcp_broken`, use Playwright via the Brave executable (`/opt/brave.com/brave/brave`), or have the user eyeball locally. Load `Bestiary/minion/fey/statblock/pixie-hydrain` and confirm:
- The three power-roll lines now show the `!`/`@`/`#` tier badges (DrawSteelGlyphs), like a class ability card.
- `Read/summoner/other-summoners.md` shows **bold** "Level N Retainer Advancement Ability" labels, not `########`.

- [ ] **Step 6: Final commit (if any generated/tracked files changed)**

The `data/` tree is gitignored build output and `v2/docs/Browse|Read|Bestiary` are generated — do **not** commit them. Only the source changes from Tasks 1–2 are committed (already done). If `git status` in `steel-etl/` or `v2/` shows only generated output, there is nothing further to commit.

---

## Post-plan bookkeeping

- [ ] Update **FOLLOWUPS.md #8**: mark it `**Status:** done`, and rewrite the body to record the findings — issues (1) and (2) of the original entry were non-issues (intentional HR styling; `sc-ability__pr` selector misdiagnosis), the real fixes were the H8 demotion + statblock power-roll badges.
- [ ] Add a **new FOLLOWUPS item** for the deferred statblock *data* gap (Task 3 "Out of scope" above): `parseStatblockFeature` leaves dice in `name` and tiers in `prose` for the dice-in-title format; this affects JSON/YAML (`effects`), not the site. Cross-book (monsters use the labeled form, so it's summoner-specific today, but the parser should handle both).

---

## Self-Review

**Spec coverage:** H8 leak → Task 1. Statblock power rolls on the site → Task 2. Verification → Task 3. The two "non-issues" are explicitly documented as no-change. The data-layer gap is explicitly deferred with a follow-up. ✓

**Placeholder scan:** every code step shows complete code; every command shows the exact invocation and expected output. ✓

**Type/name consistency:** `demoteOverflowHeadings`/`overflowHeadingRe` (Task 1) used consistently. `hasStatblockDiceRoll`/`isTierLine`/`tierKeyAt` defined in the core (Step 3) and consumed in `transformStatblockPowerRolls` (Step 5) with matching names; `TIER_GLYPHS` and `power-roll-tiers/row/badge--<tier>` classes match the existing `transformPowerRolls` output and the CSS in `tables.css`. ✓

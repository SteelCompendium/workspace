# Search Ranking Fix (SC-306) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Typing an item's exact name in the site search returns that item first.

**Architecture:** Part A fixes what steel-etl feeds Material's indexer (embedded cards excluded, nested feature cards get ids, sub-1 boosts dropped). Part B swaps Material's lunr search worker for our own MiniSearch-based worker that speaks the same 4-message protocol and ranks exact titles first. A replayable bench (`v2/tests/search/bench.cjs`) measures both against the real index and gates landing.

**Tech Stack:** Go (steel-etl `internal/site`), mkdocs-material 9.7.6, MiniSearch 7.2.0 (vendored UMD), node:test, playwright-core e2e.

**Spec:** `docs/superpowers/specs/2026-09-06-search-ranking-design.md` — read it first; the acceptance numbers and the worker protocol table live there.

## Global Constraints

- Work in an isolated worktree: `just wt-new sc306-search` → `../worktrees/sc306-search`. Every path below is relative to that worktree root. Never edit the shared main checkout.
- Devbox wraps every toolchain call: `devbox run -- bash -c '<cmd>'` from the worktree root (`go`, `node`, `mkdocs`, `just` are not on PATH).
- Never hand-edit generated output (`v2/docs/Browse/**`, `v2/docs/Read/**`, `data/**`). Content changes go through steel-etl.
- Commits: no AI attribution trailers (Scott's global rule). Two-level commits: inside the submodule (`steel-etl/`, `v2/`), then the superproject pointer bump — `just wt-finish sc306-search` does the pointer bumps at the end (Task 10).
- Node tests run as `node --test tests/*.test.js` (glob, not a directory) from `v2/`.
- Material's worker protocol is fixed (spec table): SETUP `{type:0,data:{config,docs,options}}` → `{type:1}`; QUERY `{type:2,data:string}` → `{type:3,data:{items,suggest?}}`.
- Card-head feature ids use the prefix `sc-feat-` (`sc-` alone is taken by settings-panel ids).

---

### Task 1: Bench harness + production baseline (v2)

**Files:**
- Create: `v2/tests/search/bench.cjs`
- Modify: `v2/justfile` (add `search-bench` recipe after `build:`)

**Interfaces:**
- Produces: `node tests/search/bench.cjs [--worker <path>] [--index <path|url>] [--sample N] [--gate]` — prints a rank histogram for exact-title queries plus named-query hits; `--gate` exits 1 when unique-title #1 < 95% or any named query misses. Used by Tasks 5, 7, 10.

- [ ] **Step 1: Write the harness**

```js
#!/usr/bin/env node
/*
 * bench.cjs — replay a search worker against a built search_index.json and
 * score it (SC-306). Engine-agnostic: it speaks mkdocs-material's worker
 * message protocol (0 setup / 1 ready / 2 query / 3 result), so it drives
 * Material's own worker and ours (docs/javascripts/sc-search-worker.js) alike.
 *
 * Usage (from v2/):
 *   node tests/search/bench.cjs                       # our worker vs site/search/search_index.json
 *   node tests/search/bench.cjs --worker site/assets/javascripts/workers/search.*.min.js
 *   node tests/search/bench.cjs --index https://steelcompendium.io/v2/search/search_index.json
 *   node tests/search/bench.cjs --gate                # exit 1 below the spec thresholds
 *
 * Sweep: every Browse page whose title is unique is queried by its exact title
 * (deterministic sample, default 500); we record where that page ranks.
 * Named: the spec's regression queries with their expected top pages.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const WORKER = path.resolve(opt("--worker", "docs/javascripts/sc-search-worker.js"));
const INDEX = opt("--index", "site/search/search_index.json");
const SAMPLE = parseInt(opt("--sample", "500"), 10);
const GATE = args.includes("--gate");
const THRESHOLD = 0.95;

const NAMED = [
  { q: "fury", want: ["Browse/class/fury/"], top: 1 },
  { q: "brutal slam", want: ["Browse/feature/ability/fury/level-1/brutal-slam/"], top: 1 },
  { q: "goblin warrior", want: ["Browse/monster/goblin/goblin-warrior/"], top: 1 },
  { q: "fog of war", want: ["Browse/feature/ability/tactician/level-2/fog-of-war/"], top: 1 },
  { q: "to the death", want: ["Browse/feature/ability/fury/level-1/to-the-death/"], top: 1 },
  { q: "free strike", want: ["Browse/feature/common/main-actions/free-strike/"], top: 1 },
  { q: "hide", want: ["Browse/skill/intrigue/hide/", "Browse/feature/common/maneuvers/hide/"], top: 2 },
  { q: "knockback", want: ["Browse/feature/ability/common/knockback/", "Browse/feature/common/maneuvers/knockback/"], top: 2 },
];

async function loadIndex(src) {
  if (/^https?:/.test(src)) return (await fetch(src)).json();
  return JSON.parse(fs.readFileSync(src, "utf8"));
}

// Worker shim: the worker file runs in this process with `self`,
// addEventListener, postMessage and importScripts stubbed.
function loadWorker(file) {
  let handler = null;
  const out = [];
  global.self = global;
  global.addEventListener = (_t, h) => { handler = h; };
  global.postMessage = (m) => out.push(m);
  global.location = { href: "https://example.invalid/v2/javascripts/" + path.basename(file) };
  global.importScripts = (...files) => {
    for (const f of files) {
      const mod = require(path.resolve(path.dirname(file), f));
      if (/minisearch/i.test(f)) global.MiniSearch = mod.default || mod;
      if (/sc-search-core/.test(f)) global.SCSearchCore = mod;
    }
  };
  // eslint-disable-next-line no-eval
  eval(fs.readFileSync(file, "utf8"));
  if (!handler) throw new Error("worker registered no message handler");
  const send = async (msg) => {
    out.length = 0;
    await handler({ data: msg });
    while (!out.length) await new Promise((r) => setTimeout(r, 5));
    return out[0];
  };
  return { send };
}

const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();
const pageOf = (grp) => (grp.find((d) => !d.location.includes("#")) || grp[0]).location;

async function main() {
  const idx = await loadIndex(INDEX);
  const w = loadWorker(WORKER);
  const t0 = Date.now();
  const ready = await w.send({ type: 0, data: { config: idx.config, docs: idx.docs, options: { suggest: true } } });
  if (ready.type !== 1) throw new Error("worker did not report ready");
  console.log(`worker: ${path.relative(process.cwd(), WORKER)}  index: ${INDEX}  docs: ${idx.docs.length}  setup: ${Date.now() - t0} ms`);

  const query = async (q) => (await w.send({ type: 2, data: q })).data.items;

  // Sweep
  const pages = idx.docs.filter((d) => !d.location.includes("#") && d.location.startsWith("Browse/") && !d.location.endsWith("/index/"));
  const count = {};
  for (const p of pages) { const t = strip(p.title).toLowerCase(); count[t] = (count[t] || 0) + 1; }
  const uniq = pages.filter((p) => count[strip(p.title).toLowerCase()] === 1);
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const sample = uniq.slice().sort(() => rnd() - 0.5).slice(0, SAMPLE);
  const hist = { 1: 0, "2-3": 0, "4-10": 0, ">10": 0, missing: 0 };
  const byType = {};
  const misses = [];
  for (const p of sample) {
    const q = strip(p.title);
    const items = await query(q);
    const rank = items.findIndex((g) => pageOf(g) === p.location) + 1;
    hist[rank === 0 ? "missing" : rank === 1 ? 1 : rank <= 3 ? "2-3" : rank <= 10 ? "4-10" : ">10"]++;
    const type = p.location.split("/").slice(1, 3).join("/");
    byType[type] = byType[type] || { n: 0, top1: 0 };
    byType[type].n++;
    if (rank === 1) byType[type].top1++;
    else misses.push({ q, rank, loc: p.location, top: items[0] ? pageOf(items[0]) : "-" });
  }
  const top1 = hist[1] / sample.length;
  console.log(`\nexact-title sweep (${sample.length} unique-title pages): #1 ${(top1 * 100).toFixed(1)}%  ` +
    Object.entries(hist).map(([k, v]) => `${k}: ${v}`).join("  "));
  const abil = byType["feature/ability"];
  if (abil) console.log(`feature/ability: ${abil.top1}/${abil.n} at #1`);
  misses.sort((a, b) => b.rank - a.rank);
  for (const m of misses.slice(0, 15)) console.log(`  ${String(m.rank || "-").padStart(3)}  "${m.q}"  [${m.loc}]  top=${m.top}`);

  // Named
  console.log("\nnamed queries:");
  let namedOK = true;
  for (const n of NAMED) {
    const items = await query(n.q);
    const tops = items.slice(0, n.top).map(pageOf);
    const hit = tops.some((t) => n.want.includes(t));
    namedOK = namedOK && hit;
    console.log(`  ${hit ? "ok  " : "MISS"} "${n.q}" → ${items[0] ? pageOf(items[0]) : "-"}`);
  }

  if (GATE) {
    const pass = top1 >= THRESHOLD && namedOK;
    console.log(`\ngate: ${pass ? "PASS" : "FAIL"} (need #1 ≥ ${THRESHOLD * 100}% and all named queries)`);
    process.exit(pass ? 0 : 1);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
```

- [ ] **Step 2: Add the just recipe** to `v2/justfile` after the `build:` recipe:

```
# SC-306: score the site search worker against a built index (run `just build` first).
# Flags pass through: --worker <path> --index <path|url> --sample N --gate
search-bench *args:
    node tests/search/bench.cjs {{args}}
```

- [ ] **Step 3: Record the production baseline** (Material's worker from the venv, production index):

```bash
devbox run -- bash -c 'cd v2 && W=$(ls .venv/lib/python*/site-packages/material/templates/assets/javascripts/workers/search.*.min.js) && node tests/search/bench.cjs --worker "$W" --index https://steelcompendium.io/v2/search/search_index.json'
```

Expected: `#1` about 52%, `feature/ability` about 45/100, named queries `brutal slam`, `goblin warrior`, `fog of war`, `to the death` MISS. Paste the output into the SC-306 ledger (Task 10 uses it as "before").

- [ ] **Step 4: Commit** (inside `v2/`)

```bash
git add tests/search/bench.cjs justfile
git commit -m "test(search): add worker replay bench for SC-306 ranking work"
```

---

### Task 2: Drop the sub-1 search boosts (steel-etl)

**Files:**
- Modify: `steel-etl/internal/site/search_boost.go` (the `searchBoostByType` map + header comment)
- Modify: `steel-etl/internal/site/search_boost_test.go:20-24`
- Modify: `steel-etl/docs/site-builder.md` (§ `internal/site/search_boost.go`)

- [ ] **Step 1: Update the failing test.** In `TestApplySearchBoost`, replace the statblock block with:

```go
	// SC-306: statblocks rank at the default boost — "Goblin Warrior" must find the
	// goblin warrior, not lose to any boosted page that merely says "warrior".
	sb := "---\nname: Goblin Warrior\ntype: statblock\n---\nbody\n"
	if got := string(applySearchBoost([]byte(sb))); got != sb {
		t.Errorf("statblock: must be unchanged (default boost), got:\n%s", got)
	}
	for _, typ := range []string{"featureblock", "dynamic-terrain"} {
		page := "---\nname: X\ntype: " + typ + "\n---\nbody\n"
		if got := string(applySearchBoost([]byte(page))); got != page {
			t.Errorf("%s: must be unchanged (default boost), got:\n%s", typ, got)
		}
	}
```

- [ ] **Step 2: Run it to see it fail**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run TestApplySearchBoost'
```
Expected: FAIL (`statblock: must be unchanged`).

- [ ] **Step 3: Delete the three entries** `"statblock": "0.6"`, `"featureblock": "0.6"`, `"dynamic-terrain": "0.7"` from `searchBoostByType`, and replace the file's header comment with:

```go
// Per-type search ranking boosts (Material's `search: boost:` page
// frontmatter). Canonical reference pages outrank statblocks for their own
// names ("fury" should find the Fury class, not four Rival Fury statblocks).
// Statblocks, featureblocks and dynamic terrain sit at the default boost (1):
// the old 0.6/0.7 demotions buried monsters under their own names ("Goblin
// Warrior" lost to "Warrior Priest") — SC-306. Injected in buildSection for
// non-search-excluded sections only — Read pages get `search: exclude` later
// (applySearchExclusion) and MUST NOT carry a second `search:` YAML key.
// See workspace docs/superpowers/specs/2026-07-01-v2-ux-analysis.md §2.7 and
// docs/superpowers/specs/2026-09-06-search-ranking-design.md.
```

- [ ] **Step 4: Run the package tests**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'
```
Expected: PASS.

- [ ] **Step 5: Update `steel-etl/docs/site-builder.md`** § `internal/site/search_boost.go`: remove the mention of statblock/featureblock 0.6 and dynamic-terrain 0.7, add one sentence: "Statblocks, featureblocks and dynamic terrain use the default boost since SC-306 (the demotion buried monsters under their own names)."

- [ ] **Step 6: Commit** (inside `steel-etl/`)

```bash
git add internal/site/search_boost.go internal/site/search_boost_test.go docs/site-builder.md
git commit -m "site: drop sub-1 search boosts so monsters rank for their own names (SC-306)"
```

---

### Task 3: Exclude embedded cards from the search index (steel-etl)

**Files:**
- Modify: `steel-etl/internal/site/embed_cards.go` (`spliceCards`, the `{data-scc}` insertion line ~338; add two helpers)
- Modify: `steel-etl/internal/site/embed_cards_test.go` (new test)

**Interfaces:**
- Produces: `markSearchExcluded(html string) string`, `stripFeatIDs(html string) string`. Task 4's ids (`id="sc-feat-…"`) are what `stripFeatIDs` removes.

- [ ] **Step 1: Write the failing test** (append to `embed_cards_test.go`):

```go
// SC-306: a container page's embedded card is a copy of a leaf the index
// already holds, and its id-less card heading pollutes the enclosing section
// title in Material's indexer. Spliced copies are flagged data-search-exclude
// and lose their nested feature ids (no duplicate DOM ids on pages that embed
// several blocks). The {data-sb-inline} branch is NOT touched — those
// statblocks have no leaf and must stay indexed.
func TestSpliceCards_SearchExcludesEmbeddedCards(t *testing.T) {
	cards := map[string]cardEntry{
		"W": {
			html: "<section class=\"sc-trait\" data-action=\"trait\">\n" +
				"<h3 class=\"sc-head__slot\">Wrath</h3>\n" +
				"<article class=\"sc-ability sb__feat\"><h3 class=\"sc-head__slot\" id=\"sc-feat-judgment\">Judgment</h3></article>\n" +
				"</section>",
			dir: "Browse/feature/censor/level-1/wrath",
		},
	}
	body := "\n# Censor\n\n### Wrath {data-scc=\"W\"}\n\nwrath inlined body\n"
	got, n := spliceCards(body, "", "Browse/class/censor", cards)
	if n != 1 {
		t.Fatalf("spliced %d, want 1:\n%s", n, got)
	}
	if !strings.Contains(got, `<section data-search-exclude="" class="sc-trait"`) {
		t.Errorf("embedded card root must carry data-search-exclude:\n%s", got)
	}
	if strings.Contains(got, `id="sc-feat-`) {
		t.Errorf("embedded copy must not carry nested feature ids:\n%s", got)
	}
	if strings.Count(got, "data-search-exclude") != 1 {
		t.Errorf("attribute must be on the root only:\n%s", got)
	}
}

func TestMarkSearchExcluded(t *testing.T) {
	cases := map[string]string{
		`<section class="a">x</section>`:      `<section data-search-exclude="" class="a">x</section>`,
		`<article data-k="1">x</article>`:     `<article data-search-exclude="" data-k="1">x</article>`,
		`<div class="sc-kit">x</div>`:         `<div data-search-exclude="" class="sc-kit">x</div>`,
		`plain text with no root`:             `plain text with no root`,
	}
	for in, want := range cases {
		if got := markSearchExcluded(in); got != want {
			t.Errorf("markSearchExcluded(%q)\n got %q\nwant %q", in, got, want)
		}
	}
}
```

- [ ] **Step 2: Run to see it fail**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run "TestSpliceCards_SearchExcludes|TestMarkSearchExcluded"'
```
Expected: compile error (`undefined: markSearchExcluded`).

- [ ] **Step 3: Implement.** In `embed_cards.go` add (near the top, with the other regexes; add `"regexp"` to imports if missing):

```go
// cardRootRe matches a leaf card's opening root tag (the card HTML starts with
// it — leafCard trims the injected heading and surrounding whitespace).
var cardRootRe = regexp.MustCompile(`^<(section|article|div)\b`)

// featIDRe matches the nested feature-card head ids minted by featID.
var featIDRe = regexp.MustCompile(` id="sc-feat-[^"]*"`)

// markSearchExcluded flags a spliced leaf card so Material's search indexer
// skips it (SC-306). The leaf page already indexes the card; on a container
// page the copy only adds duplicate hits, and its id-less card heading would
// be glued onto the enclosing section's title by Material's HTML parser
// (it compares context elements by tag name only). No root tag → unchanged.
func markSearchExcluded(html string) string {
	return cardRootRe.ReplaceAllString(html, `<$1 data-search-exclude=""`)
}

// stripFeatIDs removes nested feature-card ids from an embedded copy: a
// container that embeds several statblocks would otherwise repeat
// id="sc-feat-free-strike" and the like. The leaf keeps its ids.
func stripFeatIDs(html string) string {
	return featIDRe.ReplaceAllString(html, "")
}
```

and change the `{data-scc}` insertion line in `spliceCards` from

```go
		out = append(out, line, "", rebaseLinks(entry.html, entry.dir, containerDir), "")
```
to
```go
		card := markSearchExcluded(stripFeatIDs(rebaseLinks(entry.html, entry.dir, containerDir)))
		out = append(out, line, "", card, "")
```

- [ ] **Step 4: Run the package tests**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/'
```
Expected: PASS. If an existing splice test asserts the exact spliced HTML and now fails only on the new attribute, update its expectation (the attribute is the intended change) — anything else failing is a real regression.

- [ ] **Step 5: Commit**

```bash
git add internal/site/embed_cards.go internal/site/embed_cards_test.go
git commit -m "site: exclude embedded cards from the search index (SC-306)"
```

---

### Task 4: Give nested feature cards ids (steel-etl)

**Files:**
- Create: `steel-etl/internal/site/feat_id.go`, `steel-etl/internal/site/feat_id_test.go`
- Modify: `steel-etl/internal/site/card_head.go` (`cardHeadSlots` + `writeCardHeadSlot`), `card_head_test.go`
- Modify: `steel-etl/internal/site/statblock_card.go` (`renderStatblockFeature` ~line 101–120, feature loop ~line 336) and the `sbFeature` struct (`grep -n 'type sbFeature struct' internal/site/*.go`)
- Modify: `steel-etl/internal/site/featureblock_page.go` (`renderFbFeats` ~line 326, `renderFbFeat` ~line 386) and the `fbFeature` struct
- Modify: `steel-etl/docs/site-builder.md`

**Interfaces:**
- Produces: `featID(seen map[string]int, name string) string`; `cardHeadSlots.NameID string`; `sbFeature.ID`, `fbFeature.ID`.

- [ ] **Step 1: Failing tests.** `feat_id_test.go`:

```go
package site

import "testing"

func TestFeatID(t *testing.T) {
	seen := map[string]int{}
	if got := featID(seen, "Grasping Appendages"); got != "sc-feat-grasping-appendages" {
		t.Errorf("got %q", got)
	}
	if got := featID(seen, "Free Strike"); got != "sc-feat-free-strike" {
		t.Errorf("got %q", got)
	}
	if got := featID(seen, "Free Strike"); got != "sc-feat-free-strike-2" {
		t.Errorf("duplicate must get a suffix, got %q", got)
	}
	if got := featID(seen, "  "); got != "sc-feat-feature" {
		t.Errorf("empty name falls back, got %q", got)
	}
}
```

Append to `card_head_test.go`:

```go
// SC-306: nested feature cards carry an id so Material's search indexer opens
// a real section for them instead of gluing the name onto the parent title.
func TestRenderCardHead_NameID(t *testing.T) {
	got := renderCardHead(cardHeadSlots{
		LeftPrimary: hLine("Grasping Appendages"),
		NameID:      "sc-feat-grasping-appendages",
	})
	want := `<h3 class="sc-head__slot sc-head__left-primary sc-head__slot--line" id="sc-feat-grasping-appendages">Grasping Appendages</h3>`
	if !strings.Contains(got, want) {
		t.Errorf("want %s in:\n%s", want, got)
	}
	if got := renderCardHead(cardHeadSlots{LeftPrimary: hLine("X")}); strings.Contains(got, " id=") {
		t.Errorf("no NameID → no id attribute:\n%s", got)
	}
}
```

- [ ] **Step 2: Run to see them fail**

```bash
devbox run -- bash -c 'cd steel-etl && go test ./internal/site/ -run "TestFeatID|TestRenderCardHead_NameID"'
```
Expected: compile errors (`undefined: featID`, unknown field `NameID`).

- [ ] **Step 3: Implement `feat_id.go`:**

```go
package site

import "fmt"

// featID mints the id for a nested feature card head (a statblock's or
// featureblock's feature). Material's search indexer opens a new index section
// only for headings WITH an id; an id-less heading that shares its tag with the
// enclosing section's heading gets glued onto that section's TITLE instead
// ("Demon Lord's AspectGrasping AppendagesWarping Strike…"), which is what
// buried exact-name searches (SC-306). seen dedupes within one block: a second
// "Free Strike" becomes sc-feat-free-strike-2. Top-level card heads stay
// id-less on purpose — the page H1 already owns that title.
func featID(seen map[string]int, name string) string {
	base := "sc-feat-" + slugify(name)
	if base == "sc-feat-" {
		base = "sc-feat-feature"
	}
	seen[base]++
	if n := seen[base]; n > 1 {
		return fmt.Sprintf("%s-%d", base, n)
	}
	return base
}
```

- [ ] **Step 4: Implement `NameID`.** In `card_head.go`:
  - `cardHeadSlots`: add `NameID string` after `Class` (comment: `// SC-306: id for the name slot; set only on nested feature cards (featID)`).
  - `writeCardHeadSlot(b, lane, tag string, sl cardHeadSlot, roleKey string)` → add a trailing `id string` parameter; after the `data-role` write add:
    ```go
    	if id != "" {
    		fmt.Fprintf(b, ` id="%s"`, html.EscapeString(id))
    	}
    ```
  - In `renderCardHead`, pass `s.NameID` for the `left-primary` call and `""` for the other five.

- [ ] **Step 5: Thread the ids.** Statblock: add `ID string` to `sbFeature`; in `renderStatblockFeature` set `NameID: f.ID` in the `renderCardHead(cardHeadSlots{…})` call; in the feature loop (`for _, f := range d.Features {` ~line 336) declare `seen := map[string]int{}` before the loop and `f.ID = featID(seen, f.Name)` as the loop's first statement (both the villain and feat branches then render with the id). Featureblock: add `ID string` to `fbFeature`; in `renderFbFeats` declare `seen := map[string]int{}` before its loop and set `f.ID = featID(seen, f.Name)` before `renderFbFeat(b, f)`; in `renderFbFeat` set `NameID: f.ID`.

- [ ] **Step 6: Assert at the block level.** In `statblock_card_test.go` find the test that renders a whole statblock (`grep -n 'func Test' internal/site/statblock_card_test.go`; the one whose input has ≥1 feature) and add:

```go
	if !strings.Contains(got, ` id="sc-feat-`) {
		t.Errorf("statblock feature heads must carry sc-feat- ids (SC-306):\n%s", got)
	}
```
Do the same in `featureblock_page_test.go` for the full-page render test.

- [ ] **Step 7: Run the whole module**

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./...'
```
Expected: PASS. If a golden/fixture test fails **only** because rendered heads now carry `id="sc-feat-…"`, regenerate that golden the way its test file documents and say so in the commit body; any other diff is a regression — stop and report.

- [ ] **Step 8: Docs.** In `steel-etl/docs/site-builder.md` add to the card-head section (near `renderCardHead`): "Nested feature cards (statblock and featureblock features) carry `id="sc-feat-<slug>"` (`featID`, deduped per block) so Material's indexer sections them; top-level heads stay id-less. Embedded copies on container pages are flagged `data-search-exclude` and have those ids stripped (`spliceCards`). SC-306."

- [ ] **Step 9: Commit**

```bash
git add internal/site/feat_id.go internal/site/feat_id_test.go internal/site/card_head.go internal/site/card_head_test.go internal/site/statblock_card.go internal/site/statblock_card_test.go internal/site/featureblock_page.go internal/site/featureblock_page_test.go docs/site-builder.md
git commit -m "site: id nested feature card heads so search sections them (SC-306)"
```

---

### Task 5: Build locally and measure Part A

**Files:** none (verification gate).

- [ ] **Step 1: Regenerate and build the site** (no commit — `update`'s second arg is the push flag):

```bash
devbox run -- bash -c 'cd v2 && just update false && mkdocs build'
```
Expected: builds without errors; `v2/site/search/search_index.json` exists.

- [ ] **Step 2: Sanity-check the index shape**

```bash
devbox run -- bash -c 'cd v2 && python3 - <<EOF
import json
d=json.load(open("site/search/search_index.json"))
docs=d["docs"]
print("docs",len(docs),"bytes",len(json.dumps(d)))
bad=[x["title"] for x in docs if "Brutal SlamHit" in x["title"] or "AspectGrasping" in x["title"]]
print("polluted titles:",len(bad))
print("nested feature sections:",[x["location"] for x in docs if "#sc-feat-" in x["location"]][:3])
EOF'
```
Expected: `polluted titles: 0`; at least one `…#sc-feat-…` location listed; docs count lower than production's 5,401 is fine (embedded copies gone), but nested-feature sections add some back.

- [ ] **Step 3: Bench with Material's worker** (Part A alone)

```bash
devbox run -- bash -c 'cd v2 && W=$(ls .venv/lib/python*/site-packages/material/templates/assets/javascripts/workers/search.*.min.js) && node tests/search/bench.cjs --worker "$W"'
```
Expected: exact-title `#1 ≥ 85%`; `brutal slam` and `goblin warrior` now `ok`; `fog of war` may still MISS (wildcard — Part B's job). Record the output for SC-306. If `#1 < 85%`, look at the printed misses: a polluted title means a card head we did not cover (add it to Task 4's callers); a boosted page outranking the leaf means an embed path `spliceCards` doesn't see (report, don't hack around).

---

### Task 6: MiniSearch + ranking core (v2)

**Files:**
- Create: `v2/docs/javascripts/vendor/minisearch.min.js`
- Create: `v2/docs/javascripts/sc-search-core.js`
- Create: `v2/tests/sc-search-core.test.js`

**Interfaces:**
- Produces: `SCSearchCore.createEngine(MiniSearch, docs) → { search(query, {suggest}) → {items, suggest?} }`; helpers `tokenize`, `normalize`, `processTerm`, `titleTier`, `highlight`, `snippet`. Task 7's worker calls `createEngine` and `search` only.

- [ ] **Step 1: Vendor MiniSearch 7.2.0** (MIT):

```bash
cd v2
curl -sL https://cdn.jsdelivr.net/npm/minisearch@7.2.0/dist/umd/index.min.js -o docs/javascripts/vendor/minisearch.min.js
printf '%s\n' '/*! MiniSearch v7.2.0 | MIT | https://github.com/lucaong/minisearch' '    Vendored 2026-09-06 for the custom search worker (sc-search-worker.js, SC-306). */' | cat - docs/javascripts/vendor/minisearch.min.js > /tmp/ms.js && mv /tmp/ms.js docs/javascripts/vendor/minisearch.min.js
devbox run -- bash -c 'cd v2 && node -e "const M=require(\"./docs/javascripts/vendor/minisearch.min.js\"); const C=M.default||M; console.log(typeof C, typeof new C({fields:[\"t\"]}).search)"'
```
Expected: `function function`.

- [ ] **Step 2: Write the failing tests** `tests/sc-search-core.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert");
const MS = require("../docs/javascripts/vendor/minisearch.min.js");
const MiniSearch = MS.default || MS;
const Core = require("../docs/javascripts/sc-search-core.js");

// Shapes mirror Material's search_index.json docs; boosts mirror steel-etl's table.
const DOCS = [
  { location: "Browse/class/fury/", title: "Fury", text: "You do not temper the heat of battle within you.", boost: 4 },
  { location: "Browse/class/fury/#fury-abilities", title: "Fury Abilities", text: "Signature Ability Brutal Slam Hit and Run To the Death!", boost: 4 },
  { location: "Browse/feature/ability/fury/level-1/brutal-slam/", title: "Brutal Slam", text: "<p>Brutal Slam Fury Level 1 Signature Melee Weapon Strike</p>" },
  { location: "Browse/feature/ability/fury/level-1/to-the-death/", title: "To the Death!", text: "Fury signature ability." },
  { location: "Browse/monster/goblin/goblin-warrior/", title: "Goblin Warrior", text: "Goblin Warrior Level 1 Harrier" },
  { location: "Browse/monster/goblin/", title: "Goblins", text: "Goblin Warrior Goblin Sniper Goblin Monarch" },
  { location: "Browse/kit/warrior-priest/", title: "Warrior Priest", text: "A warrior priest kit.", boost: 2 },
  { location: "Browse/class/talent/", title: "Talent", text: "Talent class", boost: 4 },
  { location: "Browse/class/talent/#talent-ward", title: "Talent Ward", text: "Entropy Ward Repulsive Ward", boost: 4 },
  { location: "Browse/feature/ability/tactician/level-2/fog-of-war/", title: "Fog of War", text: "Fog of War Tactician Level 2" },
  { location: "Browse/dynamic-terrain/fieldworks/hidey-hole/", title: "Hidey-Hole", text: "A hidey-hole fieldwork." },
  { location: "Browse/skill/intrigue/hide/", title: "Hide", text: "Hide skill", boost: 2 },
];
const engine = Core.createEngine(MiniSearch, DOCS);
const top = (q) => engine.search(q).items[0][0].location;
const pages = (q) => engine.search(q).items.map((g) => g.find((d) => !d.location.includes("#")).location);

test("processTerm lowercases, strips diacritics and a plural s", () => {
  assert.strictEqual(Core.processTerm("Goblins"), "goblin");
  assert.strictEqual(Core.processTerm("Boss"), "boss");
  assert.strictEqual(Core.processTerm("Éclat"), "eclat");
  assert.strictEqual(Core.processTerm("Is"), "is");
});

test("titleTier: exact 100, prefix 10, all-terms 3, else 1", () => {
  assert.strictEqual(Core.titleTier("Goblin Warrior", "goblin warrior"), 100);
  assert.strictEqual(Core.titleTier("Goblin Warrior", "Goblin"), 10);
  assert.strictEqual(Core.titleTier("Goblin Warrior", "goblin war"), 10);
  assert.strictEqual(Core.titleTier("Warrior Priest", "priest warrior"), 3);
  assert.strictEqual(Core.titleTier("Warrior Priest", "goblin"), 1);
  assert.strictEqual(Core.titleTier("To the Death!", "to the death"), 100);
});

test("exact title beats a boosted section whose title merely contains the words", () => {
  assert.strictEqual(top("Brutal Slam"), "Browse/feature/ability/fury/level-1/brutal-slam/");
});

test("all terms required: 'fog of war' never surfaces the Wards", () => {
  assert.strictEqual(top("fog of war"), "Browse/feature/ability/tactician/level-2/fog-of-war/");
  assert.ok(!pages("fog of war").includes("Browse/class/talent/"));
});

test("no trailing wildcard on earlier terms: goblin warrior beats warrior priest", () => {
  assert.strictEqual(top("goblin warrior"), "Browse/monster/goblin/goblin-warrior/");
});

test("exact title beats a prefix match", () => {
  assert.strictEqual(top("hide"), "Browse/skill/intrigue/hide/");
});

test("stop words are kept", () => {
  assert.strictEqual(top("to the death"), "Browse/feature/ability/fury/level-1/to-the-death/");
});

test("boost breaks exact-title ties: 'fury' → the class page", () => {
  assert.strictEqual(top("fury"), "Browse/class/fury/");
});

test("every group carries its page doc; section-only hits get the page at score 0", () => {
  const items = engine.search("entropy").items;
  assert.strictEqual(items.length, 1);
  const page = items[0].find((d) => d.location === "Browse/class/talent/");
  assert.ok(page, "page doc present");
  assert.strictEqual(page.score, 0);
  assert.strictEqual(items[0][0].location, "Browse/class/talent/#talent-ward");
});

test("OR fallback when AND finds nothing, with missing terms flagged", () => {
  const items = engine.search("goblin zzzz").items;
  assert.ok(items.length > 0);
  assert.strictEqual(items[0][0].terms.goblin, true);
  assert.strictEqual(items[0][0].terms.zzzz, false);
});

test("title and snippet are highlighted, snippet is tag-free", () => {
  const d = engine.search("brutal slam").items[0][0];
  assert.strictEqual(d.title, "<mark>Brutal</mark> <mark>Slam</mark>");
  assert.ok(d.text.startsWith("<mark>Brutal</mark> <mark>Slam</mark> Fury"), d.text);
  assert.ok(!/<p>/.test(d.text));
});

test("suggest completes the last token from the top title", () => {
  assert.deepStrictEqual(engine.search("gob", { suggest: true }).suggest, ["goblin"]);
  assert.deepStrictEqual(engine.search("goblin", { suggest: true }).suggest, []);
  assert.strictEqual(engine.search("gob").suggest, undefined);
});

test("empty query → no items", () => {
  assert.deepStrictEqual(engine.search("   ").items, []);
});
```

- [ ] **Step 3: Run to see them fail**

```bash
devbox run -- bash -c 'cd v2 && node --test tests/sc-search-core.test.js'
```
Expected: fails with `Cannot find module '../docs/javascripts/sc-search-core.js'`.

- [ ] **Step 4: Implement `docs/javascripts/sc-search-core.js`:**

```js
/*
 * sc-search-core.js — pure, DOM-free ranking for the site search (SC-306).
 * Replaces mkdocs-material's lunr ranking; the search UI, the index
 * (search_index.json) and the worker message protocol stay Material's.
 * UMD: exports for node:test, attaches to self.SCSearchCore in the worker
 * (loaded there by sc-search-worker.js via importScripts).
 *
 * Rules (workspace docs/superpowers/specs/2026-09-06-search-ranking-design.md):
 *   - every query term required (AND); prefix match on the LAST term only;
 *     no stop-word removal ("To the Death!" must be findable)
 *   - score × title tier: exact title 100 · title starts with query 10 ·
 *     all terms in title 3 · else 1; page `boost` (frontmatter search.boost)
 *     applies through MiniSearch's boostDocument and breaks ties
 *   - results grouped per page in Material's {items: Doc[][]} shape; each
 *     group holds its page-level doc (score 0 if it did not match itself)
 */
;(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SCSearchCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TOKEN_RE = /[\n\r\p{Z}\p{P}]+/u; // MiniSearch's default split
  var TITLE_BOOST = 8;
  var MAX_GROUPS = 300;
  var SNIPPET = 320;
  var LEAD = 64;

  function stripTags(s) { return String(s || "").replace(/<[^>]+>/g, ""); }

  function processTerm(t) {
    t = String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.length > 3 && t.charAt(t.length - 1) === "s" && t.slice(-2) !== "ss") t = t.slice(0, -1);
    return t;
  }

  function splitWords(s) { return String(s || "").split(TOKEN_RE).filter(Boolean); }

  function tokenize(s) { return splitWords(stripTags(s)).map(processTerm); }

  function normalize(s) { return tokenize(s).join(" "); }

  // 100 exact · 10 prefix · 3 all terms present (last term as prefix) · 1
  function titleTier(title, query) {
    var t = normalize(title), q = normalize(query);
    if (!q) return 1;
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 10;
    var terms = q.split(" "), words = t.split(" ");
    var all = terms.every(function (term, i) {
      var last = i === terms.length - 1;
      return words.some(function (w) { return last ? w.indexOf(term) === 0 : w === term; });
    });
    return all ? 3 : 1;
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // Whole-word matcher for the query terms: earlier terms may carry the plural
  // s that processTerm strips, the last term is a prefix. Single-letter terms
  // ("Muse's" → "s") are not highlighted.
  function markRe(terms) {
    var parts = terms.filter(function (t) { return t.length > 1; }).map(function (t, i, arr) {
      var e = escapeRe(t);
      return i === arr.length - 1 ? e + "\\w*" : e + "s?";
    });
    return parts.length ? new RegExp("(?<![\\w])(" + parts.join("|") + ")", "giu") : null;
  }

  function highlight(s, terms) {
    var re = markRe(terms);
    return re ? s.replace(re, "<mark>$1</mark>") : s;
  }

  function snippet(text, terms) {
    var plain = stripTags(text).replace(/\s+/g, " ").trim();
    var re = markRe(terms), start = 0;
    if (re) { var m = re.exec(plain); if (m) start = Math.max(0, m.index - LEAD); }
    var out = plain.slice(start, start + SNIPPET);
    if (start > 0) out = "…" + out;
    if (start + SNIPPET < plain.length) out += "…";
    return highlight(out, terms);
  }

  function createEngine(MiniSearch, docs) {
    var byLocation = new Map();
    var records = docs.map(function (d, i) {
      byLocation.set(d.location, d);
      return { id: i, location: d.location, title: stripTags(d.title), text: stripTags(d.text), boost: d.boost || 1 };
    });
    var ms = new MiniSearch({
      fields: ["title", "text"],
      storeFields: ["location", "boost"],
      tokenize: splitWords,
      processTerm: processTerm,
      searchOptions: {
        boost: { title: TITLE_BOOST, text: 1 },
        prefix: function (_term, i, terms) { return i === terms.length - 1; },
        boostDocument: function (_id, _term, stored) { return (stored && stored.boost) || 1; }
      }
    });
    ms.addAll(records);

    function suggestFor(items, terms) {
      var last = terms[terms.length - 1];
      for (var i = 0; i < items.length; i++) {
        var words = tokenize(items[i][0].title);
        for (var j = 0; j < words.length; j++) {
          if (words[j] !== last && words[j].indexOf(last) === 0) return [words[j]];
        }
      }
      return [];
    }

    function search(query, options) {
      var terms = tokenize(query);
      if (!terms.length) return { items: [] };
      var hits = ms.search(query, { combineWith: "AND" });
      var fallback = false;
      if (!hits.length) { hits = ms.search(query, { combineWith: "OR" }); fallback = true; }

      var groups = new Map();
      hits.forEach(function (h) {
        var d = byLocation.get(h.location);
        if (!d) return;
        var matched = h.queryTerms || h.terms || [];
        var termsMap = {};
        terms.forEach(function (t) { termsMap[t] = !fallback || matched.indexOf(t) >= 0; });
        var page = h.location.split("#")[0];
        var g = groups.get(page);
        if (!g) { g = []; groups.set(page, g); }
        g.push({
          location: d.location,
          title: highlight(stripTags(d.title), terms),
          text: snippet(d.text, terms),
          score: h.score * titleTier(d.title, query),
          terms: termsMap
        });
      });

      var items = [];
      groups.forEach(function (g, page) {
        g.sort(function (a, b) { return b.score - a.score; });
        if (!g.some(function (x) { return x.location === page; })) {
          var pd = byLocation.get(page);
          if (!pd) return; // orphan section — the client needs a page doc per group
          g.push({ location: pd.location, title: stripTags(pd.title), text: "", score: 0, terms: {} });
        }
        items.push(g);
      });
      items.sort(function (a, b) { return b[0].score - a[0].score; });
      items = items.slice(0, MAX_GROUPS);

      var out = { items: items };
      if (options && options.suggest) out.suggest = suggestFor(items, terms);
      return out;
    }

    return { search: search };
  }

  return {
    createEngine: createEngine,
    tokenize: tokenize,
    normalize: normalize,
    processTerm: processTerm,
    titleTier: titleTier,
    highlight: highlight,
    snippet: snippet
  };
});
```

- [ ] **Step 5: Run the tests**

```bash
devbox run -- bash -c 'cd v2 && node --test tests/sc-search-core.test.js'
```
Expected: all pass. If the OR-fallback test fails on `terms.zzzz`, MiniSearch's hit exposes matched query terms as `queryTerms` (7.x) — confirm with `console.log(Object.keys(hit))` and adjust the `matched` line, not the test.

- [ ] **Step 6: Run the whole v2 unit suite**

```bash
devbox run -- bash -c 'cd v2 && node --test tests/*.test.js'
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add docs/javascripts/vendor/minisearch.min.js docs/javascripts/sc-search-core.js tests/sc-search-core.test.js
git commit -m "search: MiniSearch ranking core with exact-title-first scoring (SC-306)"
```

---

### Task 7: Worker + Material hook, bench Part B

**Files:**
- Create: `v2/docs/javascripts/sc-search-worker.js`
- Modify: `v2/overrides/main.html` (append a `scripts` block override)

**Interfaces:**
- Consumes: `SCSearchCore.createEngine` / `.search` (Task 6); bench (Task 1).

- [ ] **Step 1: Write the worker** `docs/javascripts/sc-search-worker.js`:

```js
/*
 * sc-search-worker.js — drop-in replacement for mkdocs-material's search
 * worker (SC-306). Same message protocol as Material 9.7.6 — 0 setup /
 * 1 ready / 2 query / 3 result — so the stock search UI keeps working; only
 * the ranking changes (sc-search-core.js). overrides/main.html points
 * Material's __config.search at this file. Not an extra_javascript entry:
 * it runs in a Worker, never on the page.
 *
 * Verify after a Material upgrade: `just build && just search-bench --gate`
 * (.repo-docs/troubleshooting.md → "Search results wrong after upgrade").
 */
importScripts("./vendor/minisearch.min.js", "./sc-search-core.js");

var MS = (typeof MiniSearch !== "undefined" && MiniSearch.default) || MiniSearch;
var state = null;

addEventListener("message", function (ev) {
  var msg = ev.data || {};
  if (msg.type === 0) {
    var data = msg.data || {};
    var suggest = !!(data.options && data.options.suggest);
    state = { engine: SCSearchCore.createEngine(MS, data.docs || []), suggest: suggest };
    postMessage({ type: 1 });
    return;
  }
  if (msg.type === 2) {
    if (!state) { postMessage({ type: 3, data: { items: [] } }); return; }
    try {
      postMessage({ type: 3, data: state.engine.search(String(msg.data || ""), { suggest: state.suggest }) });
    } catch (e) {
      console.warn("sc-search: query failed", e);
      postMessage({ type: 3, data: { items: [] } });
    }
  }
});
```

- [ ] **Step 2: Hook it in.** Append to `overrides/main.html`:

```
{#-
  SC-306: point mkdocs-material's search at our own worker (exact-title-first
  ranking; docs/javascripts/sc-search-worker.js, ADR
  .repo-docs/decisions/2026-09-06-custom-search-worker.md). The bundle reads
  #__config once when it executes, so this must run BEFORE super().
  If Material ever renames __config or its "search" key, the try/catch leaves
  the stock worker in place and `just search-bench --gate` catches the regression.
-#}
{% block scripts %}
<script>
(function () {
  var c = document.getElementById("__config");
  if (!c) return;
  try {
    var j = JSON.parse(c.textContent);
    j.search = "{{ 'javascripts/sc-search-worker.js' | url }}";
    c.textContent = JSON.stringify(j);
  } catch (e) { /* leave Material's worker in place */ }
})();
</script>
{{ super() }}
{% endblock %}
```

- [ ] **Step 3: Build and check the hook landed**

```bash
devbox run -- bash -c 'cd v2 && mkdocs build && grep -c "sc-search-worker.js" site/Browse/class/fury/index.html && ls site/javascripts/sc-search-worker.js site/javascripts/vendor/minisearch.min.js'
```
Expected: `1` and both files listed.

- [ ] **Step 4: Bench our worker with the gate**

```bash
devbox run -- bash -c 'cd v2 && node tests/search/bench.cjs --gate'
```
Expected: `gate: PASS` — `#1 ≥ 95%`, all named queries `ok`. Setup time printed under 3000 ms. If a named query misses, print its top 3 with `--sample 0` style debugging (temporarily call `query()` in bench) and fix the ranking rule in the core with a new unit test first; do not special-case pages.

- [ ] **Step 5: Manual browser check** (serve + look):

```bash
devbox run -- bash -c 'cd v2 && python3 -m http.server 8124 --directory site' &
```
Open `http://127.0.0.1:8124/Browse/`, type "Brutal Slam", "Fog of War", "Goblin Warrior", "gob" (suggestion ghost text should offer "goblin"). Confirm the results dropdown still shows highlighted titles and teasers, and DevTools console shows no worker errors. Kill the server afterwards.

- [ ] **Step 6: Commit**

```bash
git add docs/javascripts/sc-search-worker.js overrides/main.html
git commit -m "search: swap Material's lunr worker for the MiniSearch worker (SC-306)"
```

---

### Task 8: Browser e2e for the search box

**Files:**
- Create: `v2/tests/e2e/search.e2e.cjs`

- [ ] **Step 1: Write the test.** Copy `resolvePlaywrightCore()` and the browser `launch` lines verbatim from `tests/e2e/page-titles.e2e.cjs` (same Brave + `executablePath` setup, same `E2E_BASE` / `BRAVE_PATH` env handling), then:

```js
/*
 * search.e2e.cjs — SC-306: the real search UI, driven through the custom
 * worker, returns the exact-title page first.
 * Run (from v2/): devbox run -- mkdocs build
 *                 devbox run -- python3 -m http.server 8124 --directory site &
 *                 devbox run -- node tests/e2e/search.e2e.cjs
 */
const CASES = [
  ["Brutal Slam", "/Browse/feature/ability/fury/level-1/brutal-slam/"],
  ["Goblin Warrior", "/Browse/monster/goblin/goblin-warrior/"],
  ["Fog of War", "/Browse/feature/ability/tactician/level-2/fog-of-war/"],
];

(async () => {
  const { chromium } = resolvePlaywrightCore();
  const browser = await chromium.launch({ executablePath: BRAVE_PATH, headless: true });
  const page = await browser.newPage();
  let failed = 0;
  try {
    await page.goto(BASE + "Browse/", { waitUntil: "networkidle" });
    const box = "[data-md-component=search-query]";
    for (const [q, want] of CASES) {
      await page.click(box);
      await page.fill(box, "");
      await page.keyboard.type(q);
      await page.waitForSelector(".md-search-result__item a.md-search-result__link", { timeout: 20000 });
      const href = await page.$eval(".md-search-result__item a.md-search-result__link", (a) => a.getAttribute("href"));
      const ok = href.includes(want);
      console.log(`${ok ? "ok  " : "FAIL"} "${q}" → ${href}`);
      if (!ok) failed++;
    }
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
})();
```

- [ ] **Step 2: Run it**

```bash
devbox run -- bash -c 'cd v2 && (python3 -m http.server 8124 --directory site >/dev/null 2>&1 &) && sleep 1 && node tests/e2e/search.e2e.cjs; pkill -f "http.server 8124"'
```
Expected: three `ok` lines, exit 0. If Brave is missing on this machine, say so in the report rather than skipping silently.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/search.e2e.cjs
git commit -m "test(e2e): search box returns exact-title page first (SC-306)"
```

---

### Task 9: Docs, ADR, changelog

**Files:**
- Create: `v2/.repo-docs/decisions/2026-09-06-custom-search-worker.md`
- Modify: `v2/.repo-docs/decisions/README.md` (table row), `v2/.repo-docs/architecture.md` (plugins line ~167 + scripts table ~118), `v2/.repo-docs/troubleshooting.md`, `v2/AGENTS.md` (one line in the testing conventions bullet), workspace `CHANGELOG.md` (`## Unreleased`)

- [ ] **Step 1: ADR** `v2/.repo-docs/decisions/2026-09-06-custom-search-worker.md`:

```markdown
# Custom search worker (MiniSearch) behind Material's search UI

**Date:** 2026-09-06 · **Status:** accepted · **Ticket:** SC-306

## Context

Users reported that typing an item's exact name buried it. Replaying the
production index through Material's own worker showed only 52% of unique-title
pages ranked #1 (45% for class abilities). Causes: id-less card headings glued
onto section titles by Material's indexer (fixed in steel-etl, same ticket), a
hard-wired trailing wildcard on every term, OR semantics with no exact-match
bonus, stop-word removal, and sub-1 boosts on statblocks. The wildcard and OR
behaviour live inside Material's worker bundle and are not configurable.

## Decision

Keep Material's search UI, index plugin and `search_index.json`; replace only
the worker. `overrides/main.html` rewrites `__config.search` before the bundle
runs, pointing at `docs/javascripts/sc-search-worker.js`, which speaks
Material's 4-message protocol and delegates ranking to `sc-search-core.js`
(MiniSearch 7.2.0, vendored). Ranking: AND, prefix on the last term only, no
stop words, score × title tier (exact 100 / prefix 10 / all-terms 3), page
boost as tie-breaker, grouped per page.

## Consequences

- Exact-title queries rank #1 ≥ 95% on the bench (`just search-bench --gate`).
- Material upgrades can break the hook (`__config` shape) or the protocol; the
  bench and `tests/e2e/search.e2e.cjs` are the tripwire. The hook fails soft
  (stock worker stays) — a silent regression, hence the gate.
- Alternatives rejected: Algolia (third party, eligibility), `indexing: titles`
  (loses body search), forking Material's TS worker (build chain for no gain).
  A purpose-built entity search (typeahead + facets on the Bestiary tab) remains
  the long-term direction and could replace this worker.
```

Add its row to the table in `decisions/README.md`.

- [ ] **Step 2: architecture.md.** Plugins list: `- \`search\`: built-in index plugin; the **runtime worker is ours** (\`sc-search-worker.js\`, ADR 2026-09-06)`. Scripts table: add rows for `sc-search-core.js` ("pure ranking core; node:test") and `sc-search-worker.js` ("Worker script, not an `extra_javascript` entry; wired by `overrides/main.html`").

- [ ] **Step 3: troubleshooting.md.** New section:

```markdown
### Search results wrong or stock-looking after a mkdocs-material upgrade

**Symptom:** exact names stop ranking first, or `just search-bench --gate` fails.

**Cause:** `overrides/main.html` rewrites `#__config`'s `search` field to our
worker before `bundle.*.js` runs. If Material renames that element/key, the
hook fails soft and Material's lunr worker silently comes back; if the worker
message protocol changes (types 0/1/2/3, `{items: Doc[][]}`), ours stops
answering.

**Fix:** compare the new `templates/base.html` `{% block config %}` and the
worker bundle's message handling against the spec table in workspace
`docs/superpowers/specs/2026-09-06-search-ranking-design.md`; adjust the hook
or `sc-search-worker.js`; re-run `just build && just search-bench --gate` and
`tests/e2e/search.e2e.cjs`.
```

- [ ] **Step 4: AGENTS.md (v2).** In the testing-conventions bullet add: "Search ranking is scored, not eyeballed: `just build && just search-bench --gate` (replays the worker against the built index; threshold in the spec)."

- [ ] **Step 5: CHANGELOG.md (workspace) → `## Unreleased`:**

```markdown
- **Search finds what you typed (SC-306).** Typing an item's exact name now
  returns that page first (52% → ≥95% of unique titles on the bench). Container
  pages no longer re-index the cards they embed, monster names are no longer
  demoted, and the search ranking now runs in our own worker: all words
  required, exact titles first, no stop-word stripping ("To the Death!" works).
```

- [ ] **Step 6: Commit** (v2 and workspace separately)

```bash
cd v2 && git add .repo-docs AGENTS.md && git commit -m "docs: custom search worker ADR, architecture + troubleshooting (SC-306)"
cd .. && git add CHANGELOG.md docs/superpowers/specs/2026-09-06-search-ranking-design.md docs/superpowers/plans/2026-09-06-search-ranking.md && git commit -m "docs: SC-306 search ranking spec, plan, changelog"
```

---

### Task 10: Land and report

- [ ] **Step 1: Final gates in the worktree**

```bash
devbox run -- bash -c 'cd steel-etl && go build ./... && go test ./...'
devbox run -- bash -c 'cd v2 && node --test tests/*.test.js && just update false && mkdocs build && node tests/search/bench.cjs --gate'
```
Expected: all PASS.

- [ ] **Step 2: Land** with the `land-stack` skill: `just wt-finish sc306-search` (pushes `steel-etl` and `v2`, bumps the superproject pointers), then `just wt-rm sc306-search`. Do not run `just deploy*` — Scott decides deploy timing.

- [ ] **Step 3: Report on SC-306** (ticket-owner posts via the orchestration `linear-post.py`, never raw MCP): before/after bench tables (Task 1 baseline, Task 5 Part A, Task 7 Part B), the named-query list, the ADR path, and that deploy is pending. Under **What you're approving**: "deploy-v2 with this landed; approve = run `just deploy-v2`". Flag `Needs Review`.

- [ ] **Step 4: Follow-up ticket** (Backlog, links SC-306): "Entity search — typeahead with type/class/level badges and facets on the Bestiary Search & Filter tab; could subsume the custom worker." Workers report it to the ticket-owner, who files it.

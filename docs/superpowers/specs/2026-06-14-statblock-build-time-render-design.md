# Statblock build-time rendering — approved design

**Date:** 2026-06-14 · **Status:** approved design, pre-implementation
**Scope:** steel-etl (new site renderer) + v2 (slim the client script, tests, docs). Workspace-level spec because it spans repos.

Moves the creature statblock off its **JSON island + client renderer** and onto the
**build-time HTML** model that `featureblock_page.go` already uses — the same shift the
featureblock cards design called out as "Architecture choice B"
([`2026-06-12-featureblock-cards-design.md`](2026-06-12-featureblock-cards-design.md)).
Content and visuals are frozen: this is a pure mechanism swap, the rendered statblock
must look byte-for-byte the same.

## Motivation

Statblocks render today by emitting a `<script type="application/json"
class="sc-statblock-data">` data island that `v2/docs/javascripts/steel-statblock.js`
parses and mounts into the `.sb-wrap` DOM on the client. That works for a dedicated
statblock page (the island *is* the page body), but it's a **whole-page takeover**: one
statblock per page, rendered only if the JS runs, on the navigation.instant mount path.

The long-term goal is statblock cards rendering inline on *any* page (book chapter pages,
previews, search results). Build-time HTML is the prerequisite: a renderer that returns
an HTML string can be called anywhere the site builder assembles a page, needs no client
JS to appear, and renders identically everywhere. Featureblocks were deliberately built
this way for exactly this reason; this brings statblocks in line.

This effort is scoped to the **mechanism swap only**. Actually embedding statblocks into
chapter pages is the follow-on it unblocks, not part of this work.

## What stays, what changes

The statblock site path splits cleanly into a **parse stage** (markdown → `sbIsland`
struct) and an **output stage** (`sbIsland` → page body). Only the output stage changes.

```
BEFORE: type:statblock page
  → buildStatblockIslandPage → buildStatblockIsland (parse) → sbIsland
  → json.Marshal → <div.sc-statblock-mount><script>…</script></div>
  → [browser] steel-statblock.js render() builds .sb-wrap DOM

AFTER:  type:statblock page
  → buildStatblockIslandPage → buildStatblockIsland (parse) → sbIsland
  → renderStatblockCard(sbIsland) → .sb-wrap HTML  (done at build time)
  → [browser] steel-statblock.js wire() only (collapse + sticky behavior)
```

- **Unchanged (the hard, well-tested part):** `buildStatblockIsland`,
  `parseStatblockIslandFeatures`, `parseStatblockIslandFeature`, the title/dice/table/
  tier parsing, `resolveSbLinks`, `sbActionKind`, and the `sbIsland`/`sbFeature`/… model
  structs in `statblock_page.go`. The parser is hardened against scc link-wrapping with
  many edge cases — we do not touch it.
- **Changed:** the tail of `buildStatblockIslandPage` swaps `json.Marshal` + the
  `sc-statblock-mount` wrapper for `renderStatblockCard(...)`.
- **Removed:** the JSON island entirely. It has exactly one consumer (the render script);
  nothing else reads `sc-statblock-data` (the SDK statblock JSON is a separate transform;
  the bestiary search builds its own island).

## Component 1 — the Go renderer (`internal/site/statblock_card.go`)

New file (mirrors `featureblock_page.go` so `statblock_page.go` stays parse-focused),
holding `renderStatblockCard(d sbIsland) string` plus sub-renderers that are 1:1 ports of
their `steel-statblock.js` counterparts so the DOM is identical:

| Go function | Ports JS function | Emits |
|---|---|---|
| `renderStatblockCard` | `render` | `.sb-wrap` > sticky + `<article class="sb">` (head, defenses, meta, chars, features) |
| `renderStatblockSticky` | `renderSticky` | `.sb__sticky` mini-header node (present in markup; revealed by JS on scroll) |
| `renderStatblockMeta` | `renderMeta` | 2×2 `.sb__meta` (immunity/weakness/movement/captain) |
| `renderStatblockChars` | `renderChars` | `.sb__chars` characteristic boxes |
| `renderStatblockFeature` | `renderFeature` | `article.sc-ability.sb__feat` (head, ku, dt, power roll, sections, trailing, enhancements) |
| `renderStatblockBand` | `band` | collapsible `<section class="sb__band" data-open="true">` |
| `renderStatblockSpecField` | `specField` | `.sb__field` cells (CSS reflows by `data-sb-*`) |

The feature split — normal features vs `kind === "villain"` → a "Villain Actions" band —
moves into `renderStatblockCard`. The DOM is emitted **interaction-ready**: Go writes the
collapsible band markup (`data-open="true"`) and the full `.sb__sticky` node verbatim, so
the client script only *attaches behavior*, never builds structure. The shared family
Malice band stays omitted (it isn't in the island data today — no change, tracked under
the existing FOLLOWUPS #7).

## Component 2 — inline-markdown / link handling (`richSb`)

The JS `rich()` does three things to feature text: HTML-escape, `**bold**` → `<b>`, and
`[text](href)` → `<a class="sb-term" href>`. The existing Go `richInline`
(`ability_cards.go`) does the first two but (a) **re-resolves** the href via `cardHref`
and (b) omits the `sb-term` class.

The statblock parse stage *already* baked resolved hrefs into the model via
`resolveSbLinks` (it had to, for the JSON island that MkDocs never post-processes). So the
renderer must convert *already-resolved* links and must **not** re-run `cardHref`.

**Decision:** add a thin statblock-specific `richSb(s string) string` to
`statblock_card.go`: escape → `**bold**` → `<b>`, and `[text](href)` → `<a
class="sb-term" href="href">text</a>` with the href passed through unchanged. This keeps
the parser untouched (lowest regression risk, true to "swap mechanism only") and
reproduces the `sb-term` anchor class the current DOM carries.

*Deferred (FOLLOWUPS):* the cleaner shape is to hold raw `.md` links in the model and
resolve once at render (the way featureblocks do via `richInline`/`cardHref`), dropping
the `resolveSbLinks` pre-pass. That widens the diff into the hardened parser, so it is out
of scope here.

## Component 3 — slim `steel-statblock.js`

Strip the file to its runtime-only behaviors — the two things that genuinely cannot move
to build time:

1. **Collapsible bands** — `wire()`'s `.sb__band-head` click toggles.
2. **Sticky mini-header** — the rAF-throttled scroll/resize handler that reveals
   `.sb__sticky` and computes `--sticky-top` from Material's live chrome height
   (`chromeBottom()`), plus `teardown()` to release listeners across navigation.instant
   page swaps.

Keep `wire()`, `teardown()`, `chromeBottom()`, and the `document$`/init plumbing —
**retargeted** from "find `.sc-statblock-mount`, parse JSON, mount" to "find every
`.sb-wrap`, call `wire()` on it." Delete `render`, `mount`, `renderFeature`,
`renderMeta`, `renderChars`, `renderSticky`, `band`, `specField`, `costBadge`, `rich`,
`esc`, `el`, `ACT`, `TIER_GLYPH`. The `window.SCStatblock` export shrinks or is removed
(verify no external callers first; none expected). Net ≈ 390 → ≈ 90 lines. The
`mkdocs.yml` load order is unchanged. The slim script stays navigation.instant-safe
(subscribes to `document$`, idempotent `init`, tears down listeners).

## Testing

Per the chosen high-rigor path:

1. **Golden DOM-equivalence (the core guarantee).** A small `node` harness renders the
   *current* JS `render()` over a representative `sbIsland` set and saves the HTML as
   golden fixtures; a Go test (`statblock_card_test.go`) feeds the same inputs to
   `renderStatblockCard` and asserts DOM-equivalence (whitespace-normalized). Representative
   variants — the easy-to-miss ones:
   - solo creature **with a villain-action band**
   - a minion
   - a summoner **dice-in-title** signature (power roll formula in the title)
   - a creature with a **passive trait** feature (no keyword/usage table)
   - a **retainer with advancement** (island base only; advancement card is appended
     separately by `retainer_page.go` and is unaffected)
2. **Live regression.** `v2/tests/e2e/statblock-featstyle.e2e.cjs` and
   `settings-panel.e2e.cjs` already drive the rendered `.sb-wrap` and the `data-sb-*`
   preference system; they must still pass. They wait on `.sb-wrap`, which now exists at
   load instead of after a client mount — a good incidental check that build-time DOM is
   present without JS having to construct it.
3. **Visual.** card + flat screenshots of `Browse/monster/arixx/arixx/` before vs. after.

## Docs

- `steel-etl/docs/statblocks.md` — the island → build-time HTML change; new
  `statblock_card.go`.
- `steel-etl/CLAUDE.md` — the `statblock_page.go` key-files line (now parse-only) + the
  new renderer file.
- `v2/CLAUDE.md` / `v2/.repo-docs` — note statblocks no longer use the JSON-island
  navigation.instant pattern; the slim wiring script still must be `document$`-safe.

## Out of scope

- Any visual change (this is a no-visual-change swap; the golden + screenshots prove it).
- CSS-only interactivity (`<details>` bands, pure-CSS sticky) — a separate, riskier
  cleanup deferred to FOLLOWUPS.
- The parser link-handling refactor in Component 2 — deferred to FOLLOWUPS.
- Embedding statblocks inline in chapter/Read pages — the goal this unblocks; a follow-on
  effort (ROADMAP), mostly site-builder plumbing once `renderStatblockCard` exists.
- The shared family Malice band (already-tracked FOLLOWUPS #7).

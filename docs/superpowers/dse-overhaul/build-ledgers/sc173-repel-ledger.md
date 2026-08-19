# SC-173 — Talent's Repel renders as prose + stray TOC entry

Implementer report. Worktree `/home/scott/code/steelCompendium/worktrees/sc173-repel`.

## Result

| | |
|---|---|
| Commit | `a59b5a4` in `steel-etl` (branch `sc173-repel`) |
| Diagnosis confirmed | **Yes**, with one correction — see below |
| Headings fixed | 6 (3 Talent, 3 Null) |
| Sweep hits | 6 fixed, 12 ambiguous (Beastheart), all listed below |
| SCC registry | **byte-identical**, 3085 codes, all permalinks unchanged |
| Tests | `go vet` clean; `go test ./...` 8/8 packages ok, 0 failures |
| Superproject pointer | left **unstaged** (` M steel-etl`) |
| Generated output | **not committed**; `v2` + `steelCompendium.github.io` reset clean |
| Linear | one comment posted; state/labels untouched |

## Diagnosis: confirmed, with a correction

The orchestrator's diagnosis was right about the source defect and its location:
`steel-etl/input/heroes/Draw Steel Heroes.md:15140` had `#### Repel` while its
Telekinesis/Telepathy siblings were `##### `. The `@subclass` marker was correct.

**Correction to the stated mechanism.** The failure is not that the inner `> ###### Repel`
callout "is no longer nested where the ability renderer expects it" — that renderer is fine,
and Repel's own leaf page (`Browse/feature/talent/level-1/repel.md`) rendered perfectly all
along. The actual chain is:

1. `#### Repel` made Repel a **sibling** of `#### 1st-Level Tradition Features` rather than a
   member, so on the class page it emerged as a top-level `### Repel {data-scc=… data-subclass=…}`
   markdown heading instead of being swallowed into the container's card.
2. The site builder's inline-card pass (`internal/site/embed_cards.go`) then failed to splice
   a card under it, leaving raw markdown — the bare spec table with the 📏/🎯 glyphs.
3. Because a real markdown heading survived, python-markdown's TOC picked it up. (Both the
   feature heading *and* the ability heading, so "Repel" appeared **twice** in the sidebar.)

Step 2 has its own independent cause, which is the most important finding here — see
"Latent code bug" below.

## Fixes applied (all clear-cut)

All six are one-character edits (`####` → `#####`), no reflow. Each is confirmed a container
member by that container's **own member table**, and each container's sibling containers in
the same class already nest at H5.

| File:line | Heading | Was | Now | Container (proof) |
|---|---|---|---|---|
| `input/heroes/Draw Steel Heroes.md:11870` | Chilling Readiness | H4 | H5 | Null `5th-Level Tradition Feature` table |
| `input/heroes/Draw Steel Heroes.md:11875` | Inertial Fulcrum | H4 | H5 | same |
| `input/heroes/Draw Steel Heroes.md:11880` | Instant Action | H4 | H5 | same |
| `input/heroes/Draw Steel Heroes.md:15140` | **Repel** | H4 | H5 | Talent `1st-Level Tradition Features` table |
| `input/heroes/Draw Steel Heroes.md:16118` | Stasis Shield | H4 | H5 | Talent `8th-Level Tradition Features` table |
| `input/heroes/Draw Steel Heroes.md:16138` | Universal Connection | H4 | H5 | same |

Corroboration for the Null trio: the Null's **2nd**- and **8th**-level tradition containers
already nest their members at H5 (`##### Entropic Adaptability`, `##### Inertial Dampener`, …).
Only the 5th-level one was flat. Same class, same construct — unambiguous.

## Sweep

Scope: all four books, `steel-etl/input/*/*.md`. Two rules, both false-positive-free.

- **R1 sibling-run uniformity** — a maximal run of consecutive `@type: feature` headings that
  each carry `@subclass` must be level-uniform. Catches Repel / Stasis Shield / Universal Connection.
- **R2 container membership** — a feature named in a container's member table (`|` rows with
  `scc:` links) must be a *descendant* of that container. Catches the Null trio *and*,
  independently, the Talent trio.

R2 is deliberately **convention-relative**: a flat container is only reported when the same
file also contains a container that *does* nest. Without that, the Beastheart book (uniformly
flat by house style) would drown the signal.

A third rule was tried and **discarded**: "level skip" (child more than one level below its
parent) produced **147 hits of pure noise** — these books skip levels as an authoring norm
(chapters run H1→H3; Beastheart runs H3→H5 with no H4 at all; Monsters uses H7/H9), and the
parser normalizes via its context stack. Not a defect class.

### Ambiguous — NOT fixed, needs a ruling (12)

`input/beastheart/Draw Steel Beastheart.md` — every "Wild Nature Feature" container keeps its
members at the container's own level (H5), with no nesting anywhere in the book:

| Line | Heading | Container |
|---|---|---|
| 1520 | Stormheart | `2nd-Level Wild Nature Feature` (H5) |
| 1525 | Supersniffer | same |
| 1530 | This One's Yours | same |
| 1546 | Watchdog | same |
| 1843 | I Can Take It | `5th-Level Wild Nature Feature` (H5) |
| 1848 | Melt Away | same |
| 1853 | There For Each Other | same |
| 1858 | Wildfire Pyre | same |
| 2143 | Born to Run | `8th-Level Wild Nature Feature` (H5) |
| 2148 | Built for Violence | same |
| 2153 | Nature Will Not Harm Us | same |
| 2158 | Reflexes Perfected | same |

Why left alone: (a) the book is **internally consistent** — no counter-example establishes a
nested form, unlike Null/Talent; (b) the book skips H4 entirely (H3 → H5), so the nesting
target would be **H6, which the book already uses for ability headings** (`###### This One's Yours`
at line 1535) — a collision with `collectDeepHeadings` conventions; (c) it is a book-wide
restructuring decision, not a typo fix. **These do render as raw prose today**, so they are
user-visible — but their cheaper fix is the code bug below, not a content change.

Minor related finding: line 1530's heading uses a straight apostrophe while the member table
at line 1516 uses a curly one (`This One’s Yours`). The `scc:` link still resolves; only
name-matching is affected. Worth normalizing whenever beastheart is touched.

## Latent code bug found (reported, NOT fixed) — recommend its own ticket

`steel-etl/internal/site/embed_cards.go:118`

```go
var dataSCCHeadingRe = regexp.MustCompile(`^(#{1,6})\s+.*\{data-scc="([^"]+)"\}\s*$`)
```

The pattern requires `}` **immediately** after the code, so any heading carrying an extra
attr_list attribute — `data-subclass`, `data-cost` — never matches and is never spliced with
its card. It renders as raw markdown prose. This is why Repel looked broken once it escaped
its container, and it is entirely independent of heading level.

Proof it is not a content problem: **Fury's `Marauder of the Primordial Chaos`**
(`Draw Steel Heroes.md:10353`) is a legitimately top-level 6th-level feature — it is listed in
the class advancement table alongside Perk and Aspect Ability — and it renders as raw prose
purely because it carries `@subclass: stormwight`. Likewise the Summoner's 5th-level circle
features are *correctly* nested (container H3, members H4) and still render as prose.

Blast radius, measured after the content fix: **60 headings across 8 generated pages** remain
unspliced — Beastheart (13 ×2 pages), Summoner (12 ×2 pages + 8 on the circle-feature page),
Fury (1 ×2 pages).

I prototyped the one-line widening (`"([^"]+)"[^}]*\}`) and re-ran the site build: it changes
**8 files**, exactly the ones above. I reverted it — it is a visual change across five class
pages in three books and deserves its own review, not a silent ride-along on a heading fix.
Note it would *not* have fixed SC-173 correctly on its own: spliced headings keep their
markdown heading line, so Repel would have gained a card but **kept its stray TOC entry**. The
content fix was the right fix for this ticket.

## Durable test (committed)

`steel-etl/internal/parser/heading_levels_lint_test.go` — `TestBookHeadingStructure`, 291 lines,
globs `../../input/*/*.md`, implements R1 + R2 above.

- On the **pre-fix** sources it fails with 9 errors covering all 6 fixed headings (each caught
  by one or both rules).
- On the **post-fix** sources it passes.
- Beastheart is correctly silent (convention-relative rule); the reasoning is documented in the
  file's header comment so the pending decision is visible to the next reader.

## Generated-output diff

Baseline captured by running `gen --all` + `site` on **unmodified** sources first (necessary:
the committed `v2/docs` was already stale by 40 files from prior SC-138 work, so `git diff`
alone would not have been clean evidence). Diff is baseline vs. post-fix.

`v2/docs` — 10 files changed, 0 added, 0 removed:

```
Browse/class/null.md
Browse/class/talent.md
Browse/feature/index.md                                     (options count only: 2 records)
Browse/feature/null/level-5/5th-level-tradition-feature.md
Browse/feature/null/level-5/index.md                        ("1 option" -> "4 options")
Browse/feature/talent/level-1/1st-level-tradition-features.md
Browse/feature/talent/level-1/index.md                      ("6 options" -> "7 options")
Browse/feature/talent/level-8/8th-level-tradition-features.md
Browse/feature/talent/level-8/index.md                      ("5 options" -> "7 options")
Read/heroes/classes.md
```

`data/data-unified` — 13 files changed, 0 added, 0 removed (the heroes `clean` full-book
markdown, plus `md-linked` for the two class pages, the three container pages and the classes
chapter, mirrored into `en/unified/`).

`Browse/feature/index.md` was verified **semantically** (it is a one-line JSON island): the only
delta is `options` 6→7 and 5→7 on the two Talent containers. **No index entries added or removed** —
every fixed feature keeps its own leaf page and its own index record.

Unchanged counters across the run: 3085 classified items, 3085 SCC stubs, 3090 files copied,
527 index pages, 34 search-excluded, 3085 printing stamps.

## SCC verification

- `classification.json` is **byte-identical** to the pre-fix baseline (`diff -q` clean). The
  level segment comes from the feature group, not the parent heading, so no code moved.
- 3085 codes before and after.
- All five affected codes still registered and stubbed:
  `feature.talent.level-1/repel`, `feature.ability.talent.level-1/repel`,
  `feature.talent.level-8/stasis-shield`, `feature.ability.talent.level-8/stasis-shield`,
  `feature.talent.level-8/universal-connection` — each with `v2/docs/scc/<code>/index.html` present.

## Evidence

**Real browser screenshots** (not markdown fallback). Both sites built with `mkdocs build`,
served over `http.server`, driven with `playwright-core` + Brave per
`v2/.repo-docs/troubleshooting.md`.

Before — `#/Browse/class/talent/`: Repel as plain prose, bare spec table with 📏/🎯, sitting
as its own top-level section; sidebar TOC shows `1st-Level Tradition Features → Repel → Repel →
Talent Abilities`.

After: Repel is a nested `.sc-trait` feature card containing a full Triggered Action
`.sc-ability` card (crest, keyword chips, Distance/Targets rail, Trigger/Effect panels), and
the TOC goes `1st-Level Tradition Features → Talent Abilities`.

Machine-checked assertions from the harness:

| | before | after |
|---|---|---|
| Repel present as a markdown heading | `heading` | `card` |
| `Repel` in section TOC | `true` | `false` |

Artifacts in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/sc173/`:
`before-repel.png`, `after-repel.png`, `before-toc.png`, `after-toc.png`, `before-docs/`,
`after-docs/`, `before-data/`, `site-before/`, `site-after/`, `sweep2.py`, `shot.js`.

Both screenshots are posted **inline** on SC-173 in a single comment, per the `linear-flow`
skill's rule that Scott reviews visual work from images on the ticket. The comment is written
for a user (no jargon) and says the fix ships with the next site deploy. Status and labels were
not touched.

## Concerns / follow-ups for the orchestrator

1. **The `dataSCCHeadingRe` regex bug is the bigger defect** and is still live: 60 headings
   across 8 pages render as raw prose. Recommend a ticket. One-line fix, measured 8-file blast
   radius, needs a visual review pass.
2. **Beastheart's 12 flat container members** need a content ruling (nest at H6 vs. keep the
   book's flat house style). If the regex bug is fixed they render correctly *without* any
   content change, which argues for leaving beastheart alone — worth deciding together with #1.
3. `v2/docs` on `main` is stale by ~40 files from earlier SC-138 work (pre-existing, not from
   this change). It will resolve on the next `just deploy*`, but it means `git diff` against the
   committed generated tree is not a reliable signal for anyone reviewing this branch.
4. Nothing was committed in `v2` or `steelCompendium.github.io`; both were reset to clean after
   verification, so the worktree carries only the `steel-etl` commit plus the unstaged pointer.

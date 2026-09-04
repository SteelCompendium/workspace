# SC-157 — v2 site drops "With Captain" from statblock secondary stats

## Summary

**Finding: the underlying bug was already fixed on `main` before this worktree branched**
(commit `68887ab`, `feat(site): context-driven statblock captain/damage-type label
(FOLLOWUPS #7 piece 2)`, 2026-07-18) — before SC-157 was filed (2026-08-11). No code
change to production logic was needed. What I added instead: the missing regression
test that would have caught this bug (and will catch any future regression of it), plus
full-corpus verification that every real captained minion in the current build renders
correctly and matches the DSE plugin's presentation exactly.

I did not skip the investigation on the strength of the git log alone — I ran the real
pipeline (`gen` + `site`) in the worktree, read the rendered HTML for a real captained
minion, checked all 116 captained minions in the corpus, and confirmed the fix by
red/green-testing (temporarily disabling the fix reproduces exactly the dropped-cell
symptom the ticket describes; restoring it passes).

## Root cause (historical — already fixed)

- **Where it was parsed and carried correctly all along:**
  `steel-etl/internal/content/statblock_parse.go:246-247` (`ParseStatblockFields`) reads
  the stat grid's "With Captain" cell into `fm["with_captain"]` whenever the cell isn't a
  `-` placeholder. This function was never the problem.
- **Where it was dropped (fixed):** `steel-etl/internal/site/statblock_page.go`,
  `buildStatblockIsland` — before commit `68887ab`, the `.sb__meta` 4th cell (`Meta.Captain`)
  was built from `sbCaptainRe` matching body prose (`"With Captain: ..."`), a convention
  that appears exactly once in the whole corpus (the one `@classify:false` illustrative
  example). The real per-minion bonus lived in the `with_captain` *frontmatter* field
  (already parsed correctly by `ParseStatblockFields`, per above) but `buildStatblockIsland`
  never read it — so every real captained minion's grid cell rendered as `With Captain -`
  (see commit message, `git show 68887ab`, for the pre-fix code and its own description of
  this exact defect).
- **The fix** (still in place, `steel-etl/internal/site/statblock_page.go:178-190`,
  `statblockMeta4`): derives the 4th cell contextually — Summoner-book statblocks get
  "Free Strike Damage Type"; Monsters-book statblocks with a real `with_captain` value get
  `{Label: "With Captain", Value: <fm value>}`; the one illustrative body-prose example
  keeps its regex fallback; everything else (solos/leaders/retainers, blank cell) drops the
  4th cell entirely rather than showing a meaningless blank label. Both the full card's
  `.sb__meta` grid and the `.sb__sticky-row2` mini-header bar (`renderStatblockMeta` /
  `renderStatblockSticky` in `steel-etl/internal/site/statblock_card.go`) consume this same
  `sbCaptain` value, so the fix covers both render surfaces in one place — no special-casing
  needed at the render layer.

## DSE-plugin parity check (read-only, `draw-steel-elements/src/elements/statblock/view.ts`)

Compared the site's rendering against the plugin's secondary-stats ledger
(`statblockMetaCells` / `statblockStickyParts`, `view.ts:185-224`):

- **Card grid order**: Immunity, Weakness, Movement, [With Captain if present] — site's
  `.sb__meta` matches exactly (`statblock_page.go` `Meta: sbMeta{...}` field order feeds
  `statblock_card.go`'s `renderStatblockMeta`).
- **Sticky/mini-header order**: Movement, With Captain, Immunity, Weakness — deliberately
  different from the card order (movement/captain lead because that's what a GM re-checks
  mid-turn). Site's `renderStatblockSticky` matches this exactly, and its own comment
  (`view.ts:213`) explicitly cites `renderStatblockSticky`'s `metaPairs` as its source of
  truth.
- **Conditional presence**: plugin only pushes the captain cell `if (sb.withCaptain)`
  (`view.ts:193`); site only shows it `if v := ...; v != ""` (`statblock_page.go:183`).
  Same rule, same result — no blank "With Captain -" cell on either side.

No presentation drift found between plugin and site.

## Fix / change made

No production code changed (root cause already fixed, verified above). Added a Go test:

- `steel-etl/internal/site/statblock_page_test.go` — `TestCaptainedMinion_EndToEnd` (plus
  its fixture `angulotlCleaverBody`, a verbatim excerpt of the Angulotl Cleaver's real
  book-source stat grid, `input/monsters/Draw Steel Monsters.md`).

This closes a real test gap: the existing `TestStatblockMeta4` only unit-tests
`statblockMeta4` against hand-written frontmatter strings, and the existing golden
fixtures (`minion.island.json` etc.) all have an *empty* captain value (per the `68887ab`
commit message itself: "none of the four carried a real captain bonus"). Nothing in the
test suite exercised the full **parse → render** path with a real populated
`with_captain` value before this change.

The new test:
1. Calls `content.ParseStatblockFields` (the real production entry point used by
   `StatblockParser.Parse`, `internal/content/monster.go:78`) on the raw table, and
   asserts `with_captain` survives into the fields map.
2. YAML-marshals those fields into frontmatter exactly as the real pipeline does (mirrors
   `inlineStatblockCard` in `internal/site/embed_cards.go:245-246`).
3. Runs `buildStatblockIslandPage` (the real site-build entry point for `type: statblock`
   pages) on the resulting page.
4. Asserts the rendered HTML contains "With Captain" + the real value in **both** the
   `.sb__meta` grid and the `.sb__sticky-row2` bar.

**Red/green proof the test is a genuine guard**: I temporarily reverted `statblockMeta4`'s
`with_captain` frontmatter read (reproducing the pre-`68887ab` behavior) and reran the new
test — it failed exactly as expected (see `evidence/test-red.txt`). Restored the real code
(verified `git diff` shows only the test file changed) and reran — green (see
`evidence/test-green.txt`).

## Verification (real render, not reasoning)

Ran the actual pipeline in the worktree:

```
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all'
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
```

Then read the real generated page for a real captained minion, **Angulotl Cleaver**
(`mcdm.monsters.v1/monster.angulotl.statblock/angulotl-cleaver`, book source
`input/monsters/Draw Steel Monsters.md:1836-1842`, With Captain = "+1 damage bonus to
strikes"), at `v2/docs/Browse/monster/angulotl/angulotl-cleaver.md`. See
`evidence/angulotl-cleaver-rendered.md` (full file) and `evidence/after-*.html` (isolated
snippets) for the captured output — reproduced below:

**Sticky row2** (mini-header bar):
```html
<div class="sb__sticky-row2"><span class="sm"><b>Movement</b>Climb, swim</span><span class="sm"><b>With Captain</b>+1 damage bonus to strikes</span><span class="sm"><b>Immunity</b>Poison 2</span><span class="sm"><b>Weakness</b>—</span></div>
```

**Full card `.sb__meta` grid**:
```html
<div class="sb__meta"><div class="sb__field sb__field--meta"><span class="sb__field-l">Immunity</span><span class="sb__field-v">Poison 2</span></div><div class="sb__field sb__field--meta"><span class="sb__field-l">Weakness</span><span class="sb__field-v">—</span></div><div class="sb__field sb__field--meta"><span class="sb__field-l">Movement</span><span class="sb__field-v">Climb, swim</span></div><div class="sb__field sb__field--meta"><span class="sb__field-l">With Captain</span><span class="sb__field-v">+1 damage bonus to strikes</span></div></div>
```

**Before (simulated pre-fix behavior, from the red/green test)** — same statblock, same
build, with `statblockMeta4`'s frontmatter read disabled — the cell is silently absent
from both surfaces:
```html
<div class="sb__sticky-row2"><span class="sm"><b>Movement</b>Climb, swim</span><span class="sm"><b>Immunity</b>Poison 2</span><span class="sm"><b>Weakness</b>—</span></div>
...
<div class="sb__meta"><div class="sb__field sb__field--meta"><span class="sb__field-l">Immunity</span>...</div><div class="sb__field sb__field--meta"><span class="sb__field-l">Weakness</span>...</div><div class="sb__field sb__field--meta"><span class="sb__field-l">Movement</span>...</div></div>
```
(No "With Captain" field at all — exactly the ticket's symptom.)

**Full-corpus check**: every one of the 116 statblocks in the generated Monsters-book
Browse output that carry a `with_captain:` frontmatter value show the matching
`With Captain</span><span class="sb__field-v">...` text in their rendered `.sb__meta`
block — 0 missing (`evidence/corpus-check.txt`).

```
devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'
```
All packages pass, including the new `TestCaptainedMinion_EndToEnd`
(`ok  github.com/SteelCompendium/steel-etl/internal/site`).

## Cleanliness

`gen`/`site` were run in the worktree to produce evidence; before finishing, ran
`git checkout -- . && git clean -fdq docs site` equivalents in every submodule that holds
generated content (`steel-etl` — `data/` is a sibling clone outside the submodule, also
reset; `v2/docs`). `git status` in the worktree shows only the intended test-file change.

## Files

- `steel-etl/internal/site/statblock_page_test.go` — new end-to-end regression test
  (only change on the branch).
- (Read-only, referenced) `steel-etl/internal/content/statblock_parse.go` — where
  `with_captain` is parsed from the raw grid.
- (Read-only, referenced) `steel-etl/internal/site/statblock_page.go` — where the fix
  (`statblockMeta4`) already lives.
- (Read-only, referenced) `steel-etl/internal/site/statblock_card.go` — where both render
  surfaces (`renderStatblockMeta`, `renderStatblockSticky`) consume `sbCaptain`.
- (Read-only, referenced) `draw-steel-elements/src/elements/statblock/view.ts` — the DSE
  plugin's secondary-stats ledger, confirmed to match presentation.

## Commit

Branch `sc157-with-captain`, worktree
`/home/scott/code/steelCompendium/worktrees/sc157-with-captain/steel-etl`. See git log for
the commit sha (test-only change).

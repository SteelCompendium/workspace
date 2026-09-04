# SC-11x Kit Trio — Report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio`, branch `sc11x-kit-trio`.
Order landed: SC-116 → SC-119 → SC-115 (per the ticket's stated dependency order).

Gate command used throughout (steel-etl):

```
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/steel-etl && go build ./... && go vet ./... && go test ./...'
```

All three commits build/vet/test clean at the point they landed (see per-ticket sections).
Full final state: `go build ./... && go vet ./... && go test ./...` — BUILD_OK / VET_OK / all
packages `ok`.

Commits, oldest first:

**`steel-etl` submodule** (the Go pipeline/site-builder changes — the primary deliverable):

| Ticket | SHA | Subject |
|---|---|---|
| SC-116 | `c31e701` | feat(kit): emit kit_type frontmatter; stop keyword-sniffing (SC-116) |
| SC-119 | `d0e8c67` | fix(kit): unify Browse kit tile absent-bonus formatting to dashes (SC-119) |
| SC-115 | `6415f04` | feat(kit): render the signature ability as a full inline card on the Browse kit tile (SC-115) |

**`v2` submodule** (CSS for SC-115's new markup + the container-width card-head bug found
while verifying it):

| Ticket | SHA | Subject |
|---|---|---|
| SC-115 | `7e56d40e63` | fix(kit): style the inline signature-ability card on the Browse kit tile (SC-115) |

**Workspace superproject** (`sc11x-kit-trio` branch, `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio` itself — a `DESIGN.md` doc cross-reference only; submodule pointer bumps are left for the landing step, not done here per the no-push/no-deploy instruction):

| Ticket | SHA | Subject |
|---|---|---|
| SC-115 | `4a3e470` | docs(design): note the container-width variant of the card-head narrow-column fix (SC-115) |

Worktree is otherwise clean: `git status --short` at the worktree root shows only the
expected `M steel-etl` / `M v2` submodule-pointer diffs (uncommitted — landing/`wt-finish`
territory, out of this task's scope), no other dirt. `data/`, `v2/docs`, `v2/site`, and
`steelCompendium.github.io/docs/api/` (all touched by the verification `gen --all`/`site`/
`mkdocs build` runs) were reset/cleaned (`git checkout -- . && git clean -fdq …`) before
finishing.

---

## SC-116 — Emit kit kind (Martial / Magic / Psionic) as frontmatter

### What changed

- **`steel-etl/internal/content/kit.go`** — `KitParser.Parse` now derives `kit_type`
  (`Martial`/`Magic`/`Psionic`) ONCE, at parse time, from the signature ability's
  `keywords` (`deriveKitType`, substring match for "Psionic"/"Magic", else "Martial" —
  also the default for a kit with no signature ability at all). An explicit `@kit-type:`
  annotation still wins (checked first; unused in the real corpus today, but preserved).
  `kit_type` was already a declared field in `schemas/kit.schema.json` /
  `data-sdk-npm/src/schema/kit.schema.json` (and the TS SDK's `Kit.ts`/`KitDTO.ts`) — it
  had simply never been emitted (0 occurrences in the corpus, confirmed by plan-24/SC-100).
  **No schema, SDK, or `schema_validation_test.go` allowlist changes were needed** — all of
  that scaffolding already existed; `kit_type` just needed a real value.
- **`steel-etl/internal/site/kit_page.go`** — `kitKind(fm, body string) string` now reads
  `kit_type` frontmatter first; the old signature-ability body-keyword sniff is kept only as
  a defensive fallback for pre-migration content (never exercised against real pipeline
  output post-fix).
- **`steel-etl/internal/site/cards.go`** — `kitCard` (the Browse kit index tile) now calls
  the *same* shared `kitKind(fm, body)` instead of duplicating its own inline sniff-and-switch
  — this is the literal "stop keyword-sniffing... duplicated elsewhere" fix.

### The interesting finding: yes, SC-116 changed real kit kinds — a genuine bug fix

`kitCard`'s old sniff ran `signatureFromBody(body)` against the tile's **body**, but by the
time `buildCardsContent`/`kitCard` runs (during `generateIndexPages`, which happens AFTER
`buildSection` has already rewritten every kit leaf's body into the finished `.sc-kit` plate
HTML via `buildKitPage`), that body **no longer contains a "## Signature Ability" heading or
keyword table** — `buildKitPage` replaced the whole page body with the plate, leaving only a
single trailing `{data-scc}` marker heading. So the sniff regex could never match, and every
kit tile silently fell through to the "Martial" default.

Confirmed empirically, before this fix, on the real (regenerated) corpus:

```
$ grep -o 'sc-card__type">[^<]*' v2/docs/Browse/kit/index.md | sort | uniq -c
     25 sc-card__type">Martial Kit
```

All 25 kit tiles — including Battlemind (a Psionic kit) and Arcane Archer / Spellsword /
Warrior Priest (Magic kits) — showed **"Martial Kit"**. Meanwhile the kit **detail** pages
(`kit_page.go`'s `renderKitPlate`, which runs on the RAW pre-transform body during
`buildSection`, before the sniff-breaking rewrite happens) already got it right:

```
$ grep -o 'sc-head__left-eyebrow[^>]*>[^<]*' battlemind.md arcane-archer.md guisarmier.md
battlemind.md:...>Psionic Kit
arcane-archer.md:...>Magic Kit
guisarmier.md:...>Martial Kit
```

After SC-116 (frontmatter regenerated from the real book source, then site rebuilt):

```
$ grep -o 'sc-card__type">[^<]*' v2/docs/Browse/kit/index.md | sort | uniq -c
      3 sc-card__type">Magic Kit
     21 sc-card__type">Martial Kit
      1 sc-card__type">Psionic Kit
```

21 Martial / 3 Magic (Arcane Archer, Spellsword, Warrior Priest) / 1 Psionic (Battlemind) —
now matching the (always-correct) detail pages exactly. The corpus-wide `kit_type` values
emitted by the pipeline:

```
Arcane Archer | Magic       Battlemind | Psionic      Spellsword | Magic
Warrior Priest | Magic      (all other 21 kits)      | Martial
```

Evidence files (scratchpad, not part of the deliverable):
`/tmp/claude-1000/.../scratchpad/sc11x/kit-index-BEFORE.md` (git `HEAD` at task start — all
Martial) vs `kit-index-AFTER-sc116-sc119.md` (post-fix — correct split).

### Tests added

- `steel-etl/internal/content/kit_test.go`:
  - `TestKitParser_KitTypeFromSignatureKeywords` — Psionic/Magic/Martial signature-keyword
    cases (table-driven, mirrors real kits: Battlemind/Arcane Archer/Panther).
  - `TestKitParser_KitTypeDefaultsMartialWithoutSignature` — no-signature-ability default.
  - `TestKitParser_KitTypeAnnotationOverride` — explicit `@kit-type:` still wins.
- `steel-etl/internal/site/kit_page_test.go`:
  - `TestKitKind` (rewritten for the new `kitKind(fm, body)` signature) — frontmatter-first
    cases.
  - `TestKitKind_FallbackSniff` — the old body-sniff, now exercised only as the fallback.
  - **`TestKitKind_MisBucketRegression`** — the test that would have caught the real bug: it
    builds a POST-TRANSFORM-shaped body (plate HTML + a bare `{data-scc}` marker, no "##
    Signature Ability" text — exactly what `kitCard` actually receives in production) and
    asserts (a) the fallback-only path mis-buckets a real Psionic kit as "Martial" (proving
    the historical bug), and (b) with `kit_type` frontmatter present, the SAME body now
    correctly reads "Psionic".

### Verification

`go build && go vet && go test ./...` all clean at commit `c31e701`. Full `gen --all` +
`site` regenerated against the real book corpus (see counts above) — read directly from
`v2/docs/Browse/kit/index.md` and several `v2/docs/Browse/kit/*.md` detail pages
(Battlemind, Arcane Archer, Guisarmier, Panther).

---

## SC-119 — Kit Browse tile: unify absent-bonus formatting to dashes

### What changed

- **`steel-etl/internal/site/cards.go`** — `kitCard`'s two `statsBlock` calls now both use
  `kitBonus()` (previously only row 2 did; row 1 used `bonusShort`/`orZero`, which rendered
  an absent bonus as `"0"`). `kitBonus()` already existed in `kit_page.go`
  (`renderKitPlate`'s helper) with the exact target semantics ("the approved all-8 grid uses
  '—' for every absent bonus", including stripping a trailing `" per …"` qualifier into the
  label). `bonusShort`/`orZero` are now unused and were deleted.

### Verification (real corpus, Boren — an all-absent stormwight kit)

Before (row 1 zeros, row 2 dashes — the exact inconsistency the ticket describes):

```html
<div class="sc-card__stat"><div class="v">0</div><div class="l">Stamina per Echelon</div></div>
<div class="sc-card__stat"><div class="v">0</div><div class="l">Speed</div></div>
<div class="sc-card__stat"><div class="v">0</div><div class="l">Stability</div></div>
<div class="sc-card__stat"><div class="v">0</div><div class="l">Disengage</div></div>
<div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Melee Dmg</div></div>
<div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Ranged Dmg</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Melee Dist</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Ranged Dist</div></div>
```

After — uniform dashes across all 8 slots:

```html
<div class="sc-card__stat"><div class="v">—</div><div class="l">Stamina per Echelon</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Speed</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Stability</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Disengage</div></div>
<div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Melee Dmg</div></div>
<div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Ranged Dmg</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Melee Dist</div></div>
<div class="sc-card__stat"><div class="v">—</div><div class="l">Ranged Dist</div></div>
```

Now matches the kit **detail** page (`renderKitPlate`) and, per SC-100 Design §4, the DSE
plugin's Steel kit composition exactly.

### Tests added

- `steel-etl/internal/site/cards_test.go`:
  - `TestKitCardAbsentBonusesAreDashes` — Boren-shaped all-absent kit, asserts zero `"0"`
    values and exactly 8 dashes.
  - `TestKitCardMixedBonusesRow1Dashes` — the regression test: row 1 must dash a SPECIFIC
    absent bonus even when other row-1 bonuses ARE present (guards against a fix that only
    blanket-dashes a fully-empty kit); also asserts a present bonus still renders its value.

### Verification

`go build && go vet && go test ./...` all clean at commit `d0e8c67`. Regenerated site read
directly (`v2/docs/Browse/kit/index.md`, Boren tile, before/after captured above).

---

## SC-115 — Kit Browse tile: render the signature ability as a full inline ability card

### What changed

- **`steel-etl/internal/site/embed_cards.go`** — `embedItemCards`'s former private "Pass A"
  (scc → finished card HTML, walking the Browse tree) is extracted into its own function,
  **`buildLeafCardIndex(cfg) (map[string]cardEntry, []string)`**. `embedItemCards` now takes
  that map as a parameter (`embedItemCards(cfg, cards)`) instead of rebuilding it — both call
  sites (see below) are guaranteed to see the identical leaf-card index.
- **`steel-etl/internal/site/build.go`** — `Build()` now calls `buildLeafCardIndex(cfg)` once,
  right after the `buildSection` loop writes every leaf page to disk (including every
  signature-ability leaf), and stashes it in a build-scoped package var
  (`kitSignatureCardIndex`) — early enough for `generateIndexPages` (which runs before
  `embedItemCards`) to use it. `docsRootDir` (also package-scoped, `= cfg.DocsDir`) is stashed
  the same way so `cards.go` can compute a directory's docs-relative path without threading an
  extra parameter through the whole `generateIndexPages` call chain
  (`generateIndexesRecursive` → `buildIndexContent` → `buildCardsContent`).
- **`steel-etl/internal/site/cards.go`**:
  - `kitSignatureCardHTML(body, containerDir string) string` — finds the kit's
    signature-ability `{data-scc}` marker (the one `buildKitPage` preserves after the closed
    plate for exactly this purpose), looks it up in `kitSignatureCardIndex`, and returns that
    leaf's finished `.sc-ability` card HTML **rebased** (`rebaseLinks`, already used by
    `embedItemCards`) from the leaf's own docs-relative directory to the tile's.
  - `kitCard`'s signature grew a `containerDir` parameter; its old one-line `sigBlock`
    (type + name only — confirmed already DEAD in production, see SC-116's finding: it read
    `signatureFromBody(body)` against the same already-carded body) is replaced by
    `inner += kitSignatureCardHTML(body, containerDir)`. `sigBlock` itself (now unused) was
    deleted.
  - `docsRelDir(absDir string) string` — small helper computing the `"Browse/kit"`-style
    docs-relative form from `docsRootDir`.
  - `buildCardsContent`'s single `cardFor(...)` call site now passes `docsRelDir(dir)` as the
    new `containerDir` arg; `cardFor`'s signature grew the same parameter (unused by every
    non-kit card type).
- **`v2/docs/stylesheets/steel-redesign.css`** (separate `v2` submodule commit) — the dead
  `.sc-card__sig`/`.sc-card__dot`/`.sc-card__sig-label`/`.sc-card__sig-name` rules (styled the
  retired one-liner) are replaced with `.sc-card__sig-card` (margin/rule-line spacing only —
  see comment in the CSS for why no z-index/stacking fix was needed: `.sc-ability` already
  sets `position: relative` in `steel-ability-cards.css`, so it naturally paints above the
  card's `.sc-card__link` stretched-link overlay by normal CSS positioned-descendant paint
  order, being the later element in DOM order).
- **`v2/docs/stylesheets/steel-cardhead.css`** + **`DESIGN.md`** (same `v2` submodule commit
  for the CSS; `DESIGN.md` is a separate workspace-superproject commit) — see "A real display
  bug found (and fixed)" below.

### A real display bug found (and fixed) while verifying via mkdocs render

**This is exactly why the task says "render, don't reason."** The first mkdocs render of the
Panther/Arcane Archer/Battlemind tiles showed the ability name wrapping **letter-by-letter**
("EX / PL / OD / IN / G / AR / RO / W" for "Exploding Arrow") — the shared `.sc-head`
3-column grid (`steel-cardhead.css`) sizes its middle (name) column as `minmax(0, 1fr)`
against two `auto`-sized side columns (crest + right rail). That grid was designed for the
ability card's native full-width homes (a standalone leaf page, or the ~47rem kit detail
plate) — nested inside a ~20rem Browse grid tile, the right rail's content-sized column
starves the name track down to a sliver, and `overflow-wrap: break-word` degrades to
breaking inside every word.

`steel-cardhead.css` already documents and fixes the **identical** failure mode for phone
viewports (`@media (max-width: 30em)`, comment: "the right rail's content-sized column
starves the name track... wrapping long names letter-by-letter" — regression test
`v2/tests/e2e/cardhead-mobile.e2e.cjs`) — but that fix is keyed to *viewport* width, and
this trigger is *container* width, so the media query doesn't reach it. I applied the
identical "drop the third column, stack the right rail under the left stack" treatment,
scoped to `.sc-card__sig-card .sc-head` instead of the breakpoint (right after the phone
block in the same file). Also added a short cross-reference in `DESIGN.md`'s card-head
section noting this container-width variant, so a future nesting of `.sc-head` into another
narrow container reaches for the same pattern instead of rediscovering it.

**Before** (`kit-index-rendered.png`, scratchpad) — "EXPLODING ARROW" and "UNMOORING"
degenerate into vertical letter-stacks, crest and chips overlapping the broken text.
**After** (`kit-index-rendered-fixed.png`, scratchpad, screenshot embedded in this report
session) — both names render cleanly on 1–2 lines, "SIGNATURE" / "MAIN ACTION" correctly
drop to a left-aligned line under the name, matching the mobile pattern exactly. Verified for
both a Magic kit (Arcane Archer / "Exploding Arrow") and a Psionic kit (Battlemind /
"Unmooring") — both kinds, confirming SC-116's `kit_type` split renders correctly end to end
alongside SC-115's inline card and SC-119's dashes (all three tickets visible together in one
screenshot: eyebrow kind label, row-1 dashes, full inline ability card).

### Verification (real corpus)

Regenerated the full site (`gen --all` + `site`); every one of the 25 kit tiles now carries
the full inline card:

```
$ grep -c "sc-card__sig-card" v2/docs/Browse/kit/index.md
25
```

Panther tile, after (abbreviated — full head/flavor/keywords/power-roll/effect all present,
identical in substance to the card the kit DETAIL page gets via `embedItemCards`):

```html
  <div class="sc-card__sig-card"><article class="sc-ability sc-fil" data-action="main">
<header class="sc-head">...<h3 ...>Devastating Rush</h3>...<div class="sc-head__slot sc-head__left-deck sc-head__slot--line">Panther</div>...
<div class="sc-head__slot sc-head__right-primary sc-head__slot--mini">Signature</div><div class="sc-head__slot sc-head__right-deck sc-head__slot--chip">Main Action</div></header>
<p class="sc-ability__flavor">The faster you move, the harder you hit.</p>
<div class="sc-ability__kw"><span class="sc-ability__chip"><a href="../rule/combat/melee/">Melee</a></span>...</div>
<div class="sc-ability__rail">...</div>
<div class="sc-ability__pr">
<div class="sc-ability__pr-head">...<span class="chars"><a href="../rule/character/might/">Might</a> or <a href="../rule/character/agility/">Agility</a></span></div>
<div class="sc-ability__pr-rows">
<div class="sc-ability__tier" data-tier="low"><span class="badge">!</span><span class="res">3 + M or A damage</span></div>
<div class="sc-ability__tier" data-tier="mid"><span class="badge">@</span><span class="res">6 + M or A damage</span></div>
<div class="sc-ability__tier" data-tier="high"><span class="badge">#</span><span class="res">13 + M or A damage</span></div>
</div>
</div>
<div class="sc-ability__section">
<div class="sc-ability__section-head">...<span class="tag">Effect</span></div>
<div class="sc-ability__section-body"><p>You can move up to 3 squares straight toward the target before this <a href="../rule/combat/strike/">strike</a>, ...</p></div>
</div>
</article></div>
```

**Link rebasing verified**: on the kit DETAIL page (`panther.md`, one directory level
deeper than the index — `Browse/kit/panther/`), the same ability's links read
`href="../../rule/combat/melee/"` (2 `../`); spliced into the shallower `Browse/kit/` INDEX
tile, they correctly read `href="../rule/combat/melee/"` (1 `../`) — `rebaseLinks` recomputed
the relative depth correctly for the new host page.

Before (same tile, post SC-116/119, pre SC-115) — no signature-ability presence AT ALL
(confirms the old `sigBlock` path was already dead, per SC-116's finding):

```
$ grep -c "sc-card__sig" kit-index-AFTER-sc116-sc119.md
0
```

### Tests added

- `steel-etl/internal/site/cards_test.go`:
  - `TestKitCardSpliceSignatureAbility` — populates `kitSignatureCardIndex` with a fake leaf
    entry, asserts the tile splices the leaf's HTML AND correctly rebases an internal link
    from a deep leaf directory to a shallow container directory (`Browse/kit`).
  - `TestKitCardNoSpliceWithoutIndex` — no index populated (the pre-SC-115 / direct-unit-test
    state) → no `sc-card__sig-card` wrapper emitted, no crash.
  - `TestDocsRelDir` — `docsRootDir` set/unset cases for the new helper.
- `steel-etl/internal/site/embed_cards_test.go`:
  - `TestBuildLeafCardIndex` — the extracted function returns the leaf keyed by its scc, with
    the right `entry.html` (H1/hr stripped) and `entry.dir` (docs-relative).
  - `TestEmbedItemCards` updated to call `buildLeafCardIndex` then pass the result into
    `embedItemCards(cfg, cards)` (signature change).

### Verification

`go build && go vet && go test ./...` all clean at commit `6415f04`. Full site regenerated
and read directly, per above. mkdocs render: see "Rendered evidence" below (this build takes
several minutes over the full ~3,090-file docs tree; results appended once the run finished).

---

## Rendered evidence (mkdocs)

Invoked read-only against the worktree's own `mkdocs.yml`, output to the worktree's `site/`
(never the main checkout):

```
/home/scott/code/steelCompendium/workspace/v2/.venv/bin/mkdocs build -f mkdocs.yml \
  -d /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/site
  (run from /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/v2)
```

Two runs: the first (pre-CSS-fix) surfaced the letter-wrap bug above; the second (post-fix)
confirms the fix. Both exited 0:

```
INFO    -  Documentation built in 328.85 seconds   (first run — found the bug)
INFO    -  Documentation built in 317.00 seconds   (second run — confirmed the fix)
[exited with code 0]
```

Screenshots (headless `google-chrome --headless --screenshot`, 1400×2400, against
`site/Browse/kit/index.html`):
`kit-index-rendered.png` (pre-fix, shows the letter-wrap bug) and
`kit-index-rendered-fixed.png` (post-fix — clean render; shows Magic-kit and Psionic-kit
eyebrow labels from SC-116, row-1 dashes from SC-119, and the full inline signature-ability
cards from SC-115, all together). Both viewed directly in this session; not embedded inline
here (binary PNGs) — read from the scratchpad path below, or regenerate:

```
cd /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/v2
/home/scott/code/steelCompendium/workspace/v2/.venv/bin/mkdocs build -f mkdocs.yml \
  -d /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/site
google-chrome --headless --disable-gpu --no-sandbox --window-size=1400,2400 \
  --screenshot=/tmp/kit-index.png \
  file:///home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/site/Browse/kit/index.html
```

Raw HTML/markdown evidence lives at
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/13b30d29-df64-4265-95ec-c8c88bc10c54/scratchpad/sc11x/`
(scratchpad — not part of the deliverable, referenced here for traceability):
`kit-index-BEFORE.md` (task-start `HEAD`), `kit-index-AFTER-sc116-sc119.md`,
`kit-index-AFTER-sc115.md`.

---

## Cleanliness

`steel-etl` (5 files touched, 3 source commits) and `v2` (2 stylesheet files, 1 source
commit) are left exactly as committed — no generated content in either. The verification
`gen --all` / `site` / `mkdocs build` runs dirtied `v2/docs/*` (28 kit-related files),
`steelCompendium.github.io/docs/api/*` (the SCC API — a side effect of `gen --all` sharing
the pipeline run), and the worktree-root `site/` directory (the read-only mkdocs invocation's
output dir); all were reset before finishing: `git checkout -- . && git clean -fdq docs site`
in `v2`, `git checkout -- . && git clean -fdq docs` in `steelCompendium.github.io`, `rm -rf
site` at the worktree root. `data/` is untracked/gitignored at the workspace level and left
for the next `gen` to regenerate. Final `git status --short` at the worktree root shows only
`M steel-etl` / `M v2` (submodule pointer diffs — landing territory, intentionally left
uncommitted per the no-push/no-deploy instruction).

## Follow-ups noted (NOT written to FOLLOWUPS.md per instructions — report only)

- `steel-etl/schemas/kit.schema.json` and `data-sdk-npm/src/schema/kit.schema.json` have a
  **pre-existing, unrelated** one-line description drift (the SDK copy carries a "BETA —
  subject to change without notice." prefix the steel-etl copy lacks). Not touched by this
  work (kit_type's field declaration itself is identical in both); noted for a future
  `docs/superpowers` schema-sync pass since `docs/card-data-parity.md` says the two must be
  hand-synced.
- The Browse kit index tiles now vary noticeably in height (a kit's full ability card can be
  much taller than its stat grid), since `.sc-cards` is a CSS grid with default row-stretch
  behavior — shorter neighboring tiles in the same row get extra bottom whitespace. SC-115's
  own ticket text explicitly allows this ("collapsed/progressive-disclosure is acceptable if
  the tile grid can't take the height") and I judged the plain full-render to be the correct,
  literal reading of "render the signature ability as a full inline ability card" for a first
  pass; a follow-up could revisit collapse/progressive-disclosure if Scott finds the height
  variance visually noisy in practice.
- The container-width card-head fix (steel-cardhead.css, SC-115) has a viewport-width sibling
  with its own permanent regression test (`v2/tests/e2e/cardhead-mobile.e2e.cjs`, playwright).
  I verified the container-width fix manually (headless Chrome screenshots, both before and
  after) rather than writing a companion `.e2e.cjs` — that harness resolves `playwright-core`
  dynamically from an npx cache with no `package.json` at the `v2` root to pin/run it through,
  and the task's test requirement was scoped to steel-etl's Go conventions. A follow-up could
  add `cardhead-nested.e2e.cjs` (same line-count assertion, against a kit index tile instead
  of a phone viewport) if Scott wants this fix under permanent regression coverage.

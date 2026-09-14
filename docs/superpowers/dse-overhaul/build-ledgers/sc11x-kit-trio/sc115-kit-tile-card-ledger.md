# SC-115 ledger (landed 2026-09-14, v2 2f4e8e2fd4, workspace faa1bde)

# SC-115 — decisions ledger

Effort: sc115-kit-tile-card. Worktree: /home/scott/code/steelCompendium/worktrees/sc115-evidence
(branch `sc115-evidence` in every submodule). Owner session a8005d8c-2936-4a2b-9d8d-02a28a445155.

## State at 2026-09-14

The SC-115 code landed with the sc11x-kit-trio branch on 2026-09-04 and deployed 2026-09-13:
- steel-etl origin/main: `83513bc` (inline card on the Browse kit tile), `96406f7` (re-walk
  the leaf-card index before embedItemCards). Later `5035174` (SC-306) touched the splice.
- v2 origin/main: `f9347707dd` (tile CSS), later `006c24b69f` (SC-306 spacing under .sc-embed).
- Current heads: steel-etl `f90da5f`, v2 `55dc19639f`.
- The "before" commits: steel-etl `71002ce` (= 83513bc^), v2 `9782209ec5` (= f9347707dd^).

The ticket was never closed; the only open item is Scott's screenshot request.

## Scott's rulings (verbatim, dated)

- 2026-08-29 (SC-115 comment): "Can I see a before/after screenshot"

## 2026-09-14 — evidence round

- Worker (implementer) produced before/after captures; report `sc115-evidence-report.md`.
  Before = steel-etl 71002ce + v2 9782209ec5 (revert conflicted; historical fallback).
  Numbers: page 9,349 → 27,503 px; Shining Armor tile 333 → 1,150 px; 25 tiles, single column.
- Owner eyeballed the two tile crops + the viewport shot. Before tile showed NO signature line
  at all (sigBlock was not rendering). Posted comment `sc115-comment-evidence.md`; flipped to
  In Progress + Needs Review. Ask: close as-is, or collapse the card by default (follow-up round).
- Noted but not filed: shared `.sc-ability` card renders "SIGNATURE" as a large heading larger
  than the kit-name subtitle; asked Scott whether to file.

## Scott's rulings (continued)

- 2026-09-14 (SC-115 comment): "This is fine

  As for the "Signature" text being so large, can you reduce it - all cards have this problem so you can reduce it globally"

  → Tile treatment approved as-is (no collapse). New in-ticket scope: shrink the "SIGNATURE"
  heading on the shared ability card globally (v2 stylesheet). Design change → DESIGN.md note +
  CHANGELOG Unreleased bullet. Low-risk CSS-value work: no independent review round; owner
  eyeballs the crops, Scott's eye is the gate.
- 2026-09-14: peer session "workspace-ac" is landing sc315-stroke (v2 + superproject) and running
  `just deploy-v2` on the main checkout. v2 origin/main will move past 55dc19639f — the SC-115
  CSS commit must be rebased onto the new v2 main before landing.

## 2026-09-14 — SIGNATURE shrink round

- Round 1 (implementer): element is the shared head's `.sc-head__slot--mini`
  (v2 `steel-cardhead.css`). Changed from display face 32.4px to small-header small-caps
  .92rem (18.4px = source-subtitle size). v2 `f286c68b`, superproject `47203478`.
  Owner eyeballed kit-tile and 9-Ferocity cost crops: reads correctly as metadata.
- Owner ruling: the global rule also hits the PROJECT card goal numeral, which SC-315
  (v2 23ef567398, 2026-09-12) deliberately set at display size. Fix round 2 adds a project
  override restoring the pre-change display styling, plus featureblock + project crops so
  Scott sees every place the global rule reaches. Kit-tile crop recaptured as element crop.
- Follow-up noted (not filed): `.sb__head .sc-head__right-primary` (statblock) keeps its own
  1.4rem override — untouched; fold in later only if Scott extends the complaint there.
- Round 2 done: v2 `2f4e8e2fd4` (rebased onto origin/main e1b3a96108), superproject `94a140c91d`
  (v2 pointer bump unstaged — landing does it). Project goal numeral protected (32.4px both
  sides); featureblock role text shrinks (shown to Scott, exception offered). Owner eyeballed
  featureblock + recaptured kit-tile crops. Posted `sc115-comment-sig.md`; In Progress +
  Needs Review. LAND-READY pending Scott's "land it".

---

# SC-115 — before/after screenshot evidence

## Executive summary

- **BEFORE method:** historical pre-SC-115 commits (steel-etl `71002ce`, v2 `9782209ec5`) —
  the preferred `git revert` of `83513bc`/`96406f7` in steel-etl conflicted on
  `internal/site/cards.go`/`cards_test.go`, so per the brief I aborted it and fell back to
  the historical checkout for both repos. This means the BEFORE build also lacks the later
  unrelated SC-297 (chrome panel) and SC-306 (embed spacing) changes present in AFTER.
- **AFTER build:** steel-etl `f90da5f`, v2 `55dc19639f` (current tracked heads).
- **BEFORE build:** steel-etl `71002ce`, v2 `9782209ec5`.
- **Kit tiles on page:** 25 in both builds.
- **Full-page height:** BEFORE 9,349px vs AFTER 27,503px (+18,154px, ~2.9x taller — 25
  tiles × ~727px of newly-rendered inline ability-card content each).
- **Shining Armor tile height:** BEFORE 333.3px vs AFTER 1,150.3px (+817px).
- **Theme:** site default (media-query driven `prefers-color-scheme`; no explicit
  `data-md-color-scheme`/`data-theme` was set by JS in a scripted headless run) — renders
  light, since Playwright's default emulated color scheme is light.
- PNGs and this report are all under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc115-kit-tile-card/`.

## What SC-115 changed (for context)

`kitCard` (`steel-etl/internal/site/cards.go`) previously reduced a kit's signature
ability to a one-line type+name summary (`sigBlock`), which per the landing commit message
was already dead in production — the BEFORE build's tile confirms this: no signature
block renders at all before the fix, the tile ends after the equipment stat grid. SC-115
replaced it with the DSE plugin's full inline `.sc-ability` card (keywords, action chip,
power-roll tiers, effect text) via `83513bc` (steel-etl) + `f9347707dd` (v2 CSS), plus a
required fix `96406f7` (re-walk the leaf-card index before `embedItemCards`).

## Method

Both builds were produced entirely inside the worktree
`/home/scott/code/steelCompendium/worktrees/sc115-evidence` (every submodule on branch
`sc115-evidence`), following the `gen` + `site` steps from the `deploy-v2` justfile recipe
(never `just deploy*`, no pushes, no commits made to land):

```
cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --all
cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml
cd v2 && mkdocs build
python3 -m http.server <port> --directory v2/site
```

Screenshots were taken with `playwright-core` driving Brave
(`/opt/brave.com/brave/brave`, headless, `--no-sandbox`) per
`v2/.repo-docs/troubleshooting.md` § "Browser E2E: the Playwright MCP is broken, but
Playwright via Brave works" — viewport 1280×900, `deviceScaleFactor: 1`, no forced color
scheme (site default). The page was `http://127.0.0.1:<port>/Browse/kit/`.

**AFTER:** built at the worktree's already-checked-out heads — steel-etl `f90da5f`, v2
`55dc19639f`.

**BEFORE:** attempted `git -C steel-etl revert --no-edit 96406f7 83513bc` — `96406f7`
reverted cleanly, but `83513bc` conflicted (`internal/site/cards.go`,
`internal/site/cards_test.go`); per the brief's instruction on conflict, I ran
`git revert --abort`, reset both repos back to the AFTER heads (the v2 revert of
`f9347707dd` had succeeded cleanly but was discarded to keep both repos on the same
method), and instead did `git reset --hard 71002ce` (steel-etl) and
`git reset --hard 9782209ec5` (v2) on the `sc115-evidence` branches — the pre-SC-115
commits named in the brief and confirmed to equal `83513bc^` / `f9347707dd^`. This is a
strictly older snapshot: it also drops SC-297 (hover chrome panel) and SC-306 (`.sc-embed`
spacing), which are unrelated to SC-115 but land after it.

Gen + site + `mkdocs build` were re-run against that snapshot, served on a second port,
and screenshotted identically.

**Cleanup:** after capturing, both submodule branches were `git reset --hard` back to the
AFTER heads (steel-etl `f90da5f`, v2 `55dc19639f`), confirmed clean; generated dirt was
removed with `git -C v2 clean -fdq docs site && git -C v2 checkout -- docs/Browse
docs/Read docs/scc docs/pins.md` and `git -C steelCompendium.github.io checkout --
docs/api/v1/` (never `git checkout -- .` in v2). Both local HTTP servers (ports 8124,
8125) were killed. Final `git status` in steel-etl, v2, steelCompendium.github.io, and the
superproject is clean.

## Screenshots

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc115-kit-tile-card/`:

| File | Description |
|---|---|
| `sc115-before-kit-index-full.png` | Full-page capture of `/Browse/kit/`, BEFORE (steel-etl `71002ce`, v2 `9782209ec5`) |
| `sc115-after-kit-index-full.png` | Full-page capture of `/Browse/kit/`, AFTER (steel-etl `f90da5f`, v2 `55dc19639f`) |
| `sc115-before-tile-shining-armor.png` | Element crop of the Shining Armor kit tile, BEFORE |
| `sc115-after-tile-shining-armor.png` | Element crop of the Shining Armor kit tile, AFTER |
| `sc115-after-kit-index-viewport.png` | Plain 1280×900 viewport capture at scroll top, AFTER, showing grid density at first glance |

Shining Armor was used as directed — its signature ability "Protective Attack" has a
3-tier power-roll table (≤11 / 12-16 / 17+), which is the example named in the brief.

## Measured numbers

| Metric | BEFORE | AFTER |
|---|---|---|
| Full-page height (`document.documentElement.scrollHeight`) | 9,349px | 27,503px |
| Kit tiles on page (`.sc-cards > .sc-card`) | 25 | 25 |
| Shining Armor tile height (`getBoundingClientRect().height`) | 333.3125px | 1150.3125px |
| mkdocs build wall time | 238.56s | 209.68s |

Raw measurement JSON (from the same Playwright run that produced each screenshot) is
inline above; the per-run JSON files (`sc115-before-measurements.json`,
`sc115-after-measurements.json`) were written to the scratchpad, not the shared ledger
dir, and are not part of the deliverable set.

## Drive-by fixes

None — no code was changed; this ticket is evidence-only.

## Follow-ups

None beyond what's already on the ledger. The BEFORE tile confirming "no signature block
renders at all" (the old `sigBlock` path was dead code reading a heading that no longer
existed in the carded body) is already documented in the `83513bc` commit message and the
ledger — no new finding to report.

---

# SC-115 — shrink the ability cost/type ("SIGNATURE") line, globally

## Executive summary

- **Element:** `.sc-head__slot--mini` (the shared 6-slot card header's right-primary
  "mini-title" slot; renders in `steel-etl/internal/site/card_head.go` as
  `<div class="sc-head__slot sc-head__right-primary sc-head__slot--mini" ...>`). It holds
  an ability's resource cost ("9 Ferocity"), the "Signature" fallback, "Free Strike", a
  statblock/featureblock role, or a project's goal number — one shared class, so one CSS
  edit fixes all of them.
- **CSS change:** in `v2/docs/stylesheets/steel-cardhead.css`, swapped the base
  `.sc-head__slot--mini` recipe from the large-header display font (Forum, 2px
  tracking/stroke, uppercase, `calc(1.35rem * --md-large-header-scale)`) to the
  small-header subtitle recipe (Petrona, small-caps, `.92rem`, `.05em` letter-spacing) —
  matching `.sc-head__left-deck.sc-head__slot--line` (the "Shining Armor"/"Fury" subtitle).
  `--role` color fallback kept for statblock/featureblock accent tinting.
- **Font-size before -> after** (computed, 1280px viewport, default theme): mini
  **32.4px -> 18.4px**; ability name stays **44.4px**; deck subtitle stays **18.4px** —
  mini now equals the subtitle exactly and is well under half the name.
- **v2 sha:** `f286c68b6a6c7bed6c718de3a11dd0f00e23221a`
- **Superproject sha:** `47203478d0d907cda91111e644db0a4590598285` (v2 pointer left
  unstaged, per instructions — lands with the effort)
- **mkdocs build:** exit **0** both times (before: 240.77s, after: 226.06s)
- **PNGs and measurement JSON:** all under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc115-kit-tile-card/`,
  filenames `sc115-sig-{before,after}-{kit-tile,ability-cost,kit-detail}.png` +
  `sc115-sig-{before,after}-measurements.json`.

## 1. Element and what else it renders

`hMini()` (`steel-etl/internal/site/card_head.go`) sets `Style: "mini"`, rendered by
`renderCardHead`/`writeCardHeadSlot` as class
`sc-head__slot sc-head__right-primary sc-head__slot--mini` (plus `data-role` on
role-colored cards). Callers of `RightPrimary: hMini(...)`:

| File | What it puts in the slot |
|---|---|
| `ability_cards.go` | an ability's `cost` frontmatter (e.g. "9 Ferocity", "Free Strike"), or `"Signature"` when `subtype: signature` and no cost is set |
| `featureblock_page.go` | a featureblock's type/role text, or a sub-feature's cost |
| `trait_cards.go` | a trait card's cost |
| `feature_index.go` | a feature-index card's cost |
| `class_page.go` | a class's joined primary stats |
| `project_cards.go` | (via a nested `.num` span that reasserts its own font-family) the project's goal number |
| `statblock_card.go` | a statblock's role (`hMini`), separate from the villain-cost `hChip` path |

`.sb__head .sc-head__right-primary` (full statblock card) and `.sb-prev`/`.sc-prev`
(preview cards) already had their own `font-size` overrides (1.4rem / 1.05rem / 1.3rem)
more specific than the base rule, so those are unaffected by this change; only the bare
default — the one every ability, featureblock, trait, feature-index, and class-page card
was using — shrinks.

## 2. The CSS change

```diff
-.sc-head__slot--mini {
-  font-family: var(--md-large-header-font); font-weight: var(--md-large-header-weight); letter-spacing: var(--md-large-header-tracking); -webkit-text-stroke: var(--md-large-header-stroke) currentColor; text-transform: uppercase;
-  font-size: calc(1.35rem * var(--md-large-header-scale)); line-height: 1.04; color: var(--role, var(--md-default-fg-color));
-}
+.sc-head__slot--mini {
+  font-family: var(--md-small-header-font); font-weight: var(--md-small-header-weight);
+  font-variant: small-caps; text-transform: lowercase; letter-spacing: .05em;
+  font-size: .92rem; line-height: 1.1; color: var(--role, var(--md-default-fg-color--light));
+}
```

One rule, one file. Reducing only `font-size` while keeping the large-header
family/tracking/stroke was tried mentally and rejected: the 2px tracking + 2px stroke are
tuned for display-size text (per DESIGN.md, sizes are a multiplier off a display base) and
would read as chunky, over-spaced noise at a subtitle size — so the whole small-caps
subtitle recipe was adopted instead, matching `left-deck` exactly. A pre-existing
`[data-fb-featstyle="flat"]` override already reset `font-variant: normal; text-transform:
none` on this class for the inline "flat" feature style — it composes correctly with the
new small-caps default with no further edit needed.

## 3. Screenshots and measurements

All three renders captured at viewport 1280x900, `deviceScaleFactor: 1`, site default
theme (Playwright via Brave, `/opt/brave.com/brave/brave`, headless), element-boundingBox
crops. Before = current committed head (no code change); after = with the CSS edit.

| Place | Before file | After file | mini text |
|---|---|---|---|
| Browse kit index, Shining Armor tile (`.sc-card__sig-card`, narrow-container layout) | `sc115-sig-before-kit-tile.png` | `sc115-sig-after-kit-tile.png` | "Signature" |
| Heroic ability page with a resource cost: Fury "Debilitating Strike" (`/Browse/feature/ability/fury/level-5/debilitating-strike/`) | `sc115-sig-before-ability-cost.png` | `sc115-sig-after-ability-cost.png` | "9 Ferocity" |
| Kit detail page: `/Browse/kit/shining-armor/`, embedded signature-ability card | `sc115-sig-before-kit-detail.png` | `sc115-sig-after-kit-detail.png` | "Signature" |

Computed `getComputedStyle(...).fontSize` (identical across all three places, since the
rule and root font-size don't vary by page):

| | Before | After |
|---|---|---|
| `.sc-head__slot--mini` | 32.4px | 18.4px |
| `.sc-head__left-primary` (ability name, reference) | 44.4px | 44.4px (unchanged) |
| `.sc-head__left-deck` (source subtitle, reference) | 18.4px | 18.4px (unchanged) |

Raw JSON: `sc115-sig-before-measurements.json`, `sc115-sig-after-measurements.json`.

## 4. Commits

- **v2** `f286c68b6a6c7bed6c718de3a11dd0f00e23221a` —
  `style(ability): shrink the ability type/cost line to subtitle weight, globally (SC-115)`
  — 1 file changed (`docs/stylesheets/steel-cardhead.css`).
- **Superproject** `47203478d0d907cda91111e644db0a4590598285` —
  `docs: shrink the ability cost/type line to subtitle weight, globally (SC-115)` — 2
  files changed (`DESIGN.md`, `CHANGELOG.md`). The `v2` submodule pointer is left
  unstaged in the working tree (not committed), per instructions — the landing step
  bumps it.

DESIGN.md: extended the "Card header system" section's render-style bullet to name
`--mini` alongside `--line`/`--chip` and state the new hierarchy explicitly — `name >
source subtitle ≈ type/cost line > chips` — with a pointer to SC-115.

CHANGELOG.md: added an `## Unreleased` bullet, `**Site: an ability's cost/type line no
longer competes with its name for size (SC-115).**`, in the voice/format of the
neighboring bullets, placed above the existing SC-115 (kit-tile) entry.

## 5. Gates

- **mkdocs build:** exit 0 both runs (before-edit: 240.77s; after-edit: 226.06s). Logs:
  `/tmp/claude-1000/.../scratchpad/sc115/mkdocs-before.log`,
  `.../mkdocs-after.log` (scratchpad, not a deliverable — quoted for traceability only).
- **Class unchanged in built HTML:** `grep -o 'class="[^"]*sc-head__slot--mini[^"]*"'
  site/Browse/kit/shining-armor/index.html` → still
  `sc-head__slot sc-head__right-primary sc-head__slot--mini` after the CSS edit (Go/HTML
  untouched, confirmed no Go-side change was needed).
- **New rule present in served CSS:**
  `site/stylesheets/steel-cardhead.css` — `.sc-head__slot--mini { font-family:
  var(--md-small-header-font); ... font-size: .92rem; ... }` confirmed present verbatim
  post-build.
- v2 has no CSS test battery; the render/screenshot pair above is the gate, per the
  brief and the ledger ruling ("owner eyeballs the crops").

## 6. Cleanup

- `git -C v2 clean -fdq docs site && git -C v2 checkout -- docs/Browse docs/Read
  docs/scc docs/pins.md` — ran; also reverted an unrelated `devbox.lock` drift
  (`python3@latest` plugin_version bump from a devbox auto-notice) before committing, so
  the v2 commit carries only the CSS file.
- `git -C steelCompendium.github.io checkout -- docs/api/v1/` — ran (no-op, already
  clean).
- Both http.server instances I started (ports 8177, 8178) were killed. A pre-existing,
  unrelated `http.server 8124` process (not started by me this session) was left alone.
- Final `git status -sb` in v2, steel-etl, steelCompendium.github.io: all clean (branch
  `sc115-evidence`, no changes). Superproject: only the expected unstaged `v2` pointer
  diff remains.
- steel-etl: untouched, no commits — the fix was CSS-only, no Go-side change was needed.

## Drive-by fixes

None. The only adjacent cleanup was reverting an unrelated `devbox.lock` line that a
devbox background version-check notice touched during this session — reverted before
committing, not shipped, not claimed as a fix.

## Follow-ups

- The single shared `.sc-head__slot--mini` rule now also shrinks the statblock **role**
  text on `.fb__head` (featureblock — no font-size override exists there, so it now
  reads at .92rem instead of the prior 1.35rem) and the **project goal number**'s
  container font-size (its `.num` child keeps its own display font-family, so "GOAL
  3,000" keeps the display face but is now sized at .92rem instead of 1.35rem — a
  visibly smaller goal numeral). Both are inherent to "reduce it globally" as ruled, but
  Scott has only seen ability cards; worth a quick look at a project card and a
  featureblock card next time either comes up, in case the goal numeral or the
  featureblock role reads too small now. Not fixed here — no independent design call was
  made for those two cases, and the brief scoped this round to ability cards' rendering
  places.
- `.sb__head .sc-head__right-primary` (full statblock card, non-preview) keeps its own
  `1.4rem` override and was NOT touched — its role text still reads close to the display
  scale. If the same "all cards have this problem" complaint extends there too, that's a
  second, separate override to shrink; left alone since it wasn't in evidence and touching
  it wasn't asked for.

## Round 2

### Executive summary

- **Project goal numeral protected:** added `.pj__head .sc-head__right-primary` override
  in `steel-project.css`, restoring the exact pre-SC-115 display recipe (large-header
  font/weight/tracking/stroke, uppercase, `calc(1.35rem * var(--md-large-header-scale))`,
  line-height 1.04, `var(--md-default-fg-color)`). This resolves the Round-1 follow-up
  about the project goal number shrinking.
- **Computed font-size on "Build Airship" project card, `.sc-head__right-primary`:**
  32.4px before -> **32.4px after** (pixel-identical, confirmed).
- **Rebase:** `origin/main` had moved to `e1b3a96108` ("fonts: display stroke scales with
  size, 0.02em instead of 2px", SC-315) — rebased the `sc115-evidence` branch onto it
  cleanly (no conflicts); this also means `--md-large-header-stroke` is now `0.02em`
  instead of `2px`, which the project override picks up automatically via the token, not
  a hardcoded value.
- **v2 sha (round 2):** `2f4e8e2fd4a1c508836730a5dc4c1298eadf5a80` (parent
  `180a9c5743...` = round-1 commit, rebased onto `e1b3a96108`, i.e. `origin/main`).
- **Superproject sha (round 2):** `94a140c91d8248485ad68ee5bd615148e6aaa6a4`.
- **mkdocs build:** exit 0 both times (before-render at `55dc19639f`'s CSS: 247.91s;
  final after-render: 261.36s).
- **New PNGs**, all under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc115-kit-tile-card/`:
  `sc115-sig-before-featureblock.png`, `sc115-sig-after-featureblock.png`,
  `sc115-sig-before-project.png`, `sc115-sig-after-project.png`, and a **recaptured**
  `sc115-sig-before-kit-tile.png` / `sc115-sig-after-kit-tile.png` (element crop, sticky
  header no longer bleeding into frame).

### 1. Rebase

`git -C v2 fetch origin` found `origin/main` had moved `55dc19639f..e1b3a96108`
(`fonts: display stroke scales with size, 0.02em instead of 2px (SC-315)`, a peer
session's follow-up — changes `--md-large-header-stroke` from `2px` to `0.02em` in
`custom_font.css`). `git -C v2 rebase origin/main` replayed the round-1 SC-115 commit
cleanly (no conflicts, CSS-only, disjoint files) — new sha
`180a9c5743a...` (short `180a9c5743`).

### 2. Project card override (item 1)

`v2/docs/stylesheets/steel-project.css`, added immediately before the existing
`.pj__head .sc-head__right-primary .num` rule (which already reasserted the display
font-family for the numeral itself but not the size/tracking/stroke/case/color that live
on the parent slot):

```diff
+/* SC-115/SC-315: the shared .sc-head__slot--mini rule (steel-cardhead.css) was
+   demoted globally to a .92rem small-caps subtitle for every OTHER card's cost/type
+   text — but that would silently undo the SC-315 ruling above for this one card.
+   Pin the project head's right-primary back to exactly its pre-SC-115 display
+   recipe (this selector's higher specificity wins over the shared class), so "GOAL
+   3,000" stays pixel-identical to before the global shrink. */
+.pj__head .sc-head__right-primary {
+  font-family: var(--md-large-header-font); font-weight: var(--md-large-header-weight); letter-spacing: var(--md-large-header-tracking); -webkit-text-stroke: var(--md-large-header-stroke) currentColor; text-transform: uppercase;
+  font-size: calc(1.35rem * var(--md-large-header-scale)); line-height: 1.04; color: var(--md-default-fg-color);
+}
 .pj__head .sc-head__right-primary .num {
   font-family: var(--md-large-header-font); font-weight: var(--md-large-header-weight);
   font-variant-numeric: tabular-nums;
 }
```

Selector specificity: `.pj__head .sc-head__right-primary` is two classes (0,2,0),
beating the shared `.sc-head__slot--mini` (0,1,0) regardless of stylesheet load order —
confirmed this is the selector that wins (no need to touch `--mini` itself for this
case).

**Verification** (computed `getComputedStyle(...).fontSize` on the "Build Airship"
project card, `/Browse/project/build-airship/`, viewport 1280x900, `deviceScaleFactor:
1`, default theme):

| | Before (pre-round CSS, `55dc19639f`) | After (round-1 + round-2 CSS) |
|---|---|---|
| `.sc-head__right-primary` ("Goal 3,000") | 32.4px | **32.4px** |
| `.sc-head__right-primary .num` ("3,000") | 32.4px | 32.4px |
| `.sc-head__left-primary` (name, reference) | 38.4px | 38.4px |

Screenshots confirm pixel-identical rendering: `sc115-sig-before-project.png` vs
`sc115-sig-after-project.png` — same "GOAL 3,000" size/weight/case/color in both.

### 3. Featureblock + project crops, and the kit-tile recapture (items 2 & 3)

**Method for "before":** rather than reverting/re-diffing commits, checked out the three
CSS files touched between `55dc19639f` and the final state
(`docs/stylesheets/custom_font.css`, `steel-cardhead.css`, `steel-project.css`) at
`55dc19639f` via `git checkout 55dc19639f -- <files>` (stashing the uncommitted project
override first with `git stash push -- docs/stylesheets/steel-project.css`), rebuilt,
screenshotted, then `git checkout HEAD -- <files>` + `git stash pop` to restore the final
round-2 state before rebuilding "after". No markdown/content files changed between
`55dc19639f` and `HEAD` (both intervening commits are CSS-only), so `docs/Browse` content
is identical in both renders — only the three stylesheets differed.

**Featureblock place:** `/Browse/dynamic-terrain/mechanisms/pillar/` ("Pillar", a
Mechanism dynamic-terrain fixture) — its `right-primary` mini slot shows the role text
"Hazard Hexer".

| | Before | After |
|---|---|---|
| `.sc-head__slot--mini` ("Hazard Hexer") | 32.4px | 18.4px |
| `.sc-head__left-primary` ("Pillar", reference) | 50.4px | 50.4px |

Files: `sc115-sig-before-featureblock.png`, `sc115-sig-after-featureblock.png`. This is
the shrink flagged as a Round-1 follow-up (featureblock role was riding the same shared
rule, unlike the project card) — confirmed here to actually happen, and left as-is per
this round's brief (only the project card got an exception).

**Project place:** `/Browse/project/build-airship/` — see §2 above. Files:
`sc115-sig-before-project.png`, `sc115-sig-after-project.png`.

**Kit-tile recapture:** the original `sc115-sig-after-kit-tile.png` (and its `-before-`
twin) used `page.screenshot({ clip: boundingBox })` right after
`scrollIntoViewIfNeeded()`, which could land the element's top edge exactly at the
viewport's scroll-top, coinciding with Material's sticky top nav bar. Fixed by scrolling
an extra ~90px past the element's top (`window.scrollBy(0, rect.top - 90)`) before
re-measuring and clipping, so the crop starts comfortably below the sticky chrome. Both
`sc115-sig-before-kit-tile.png` and `sc115-sig-after-kit-tile.png` were recaptured with
this method and now show only a thin ~4px sliver of the page's own top edge, no header
text/controls bleeding into the frame. Measurements unchanged from round 1 (mini: 32.4px
-> 18.4px; name stays 44.4px).

### 4. Gates

- **mkdocs build:** exit 0 both renders this round — before (checked-out `55dc19639f`
  CSS): 247.91s; final after (round-1 + round-2 CSS, post-rebase): 261.36s. Logs in
  scratchpad (`mkdocs-r2-before.log`, `mkdocs-r2-after.log`), exit codes captured via
  wrapper files per the devbox footgun.
- No Go/HTML change was needed for either item — CSS-only, confirmed by `git -C steel-etl
  status -sb` staying clean throughout.

### 5. Commits

- **v2** `2f4e8e2fd4a1c508836730a5dc4c1298eadf5a80` —
  `style(project): keep the goal numeral at display size after the global mini-slot
  shrink (SC-115, SC-315)` — 1 file changed (`docs/stylesheets/steel-project.css`),
  10 insertions. Parent: `180a9c5743` (round-1 commit, rebased onto `e1b3a96108` /
  `origin/main`).
- **Superproject** `94a140c91d8248485ad68ee5bd615148e6aaa6a4` —
  `docs: note the project card's goal-numeral exception to the mini-slot shrink (SC-115,
  SC-315)` — 1 file changed (`DESIGN.md`), added a sentence naming the project-card
  exception to the type-hierarchy note from round 1. `v2` pointer again left unstaged
  (not committed) — lands with the effort.

### 6. Cleanup

- Restored an unrelated `devbox.lock` drift (`python3@latest` plugin_version, from a
  devbox background version-check notice) twice this round before each commit — not
  shipped.
- `git -C v2 clean -fdq docs site && git -C v2 checkout -- docs/Browse docs/Read
  docs/scc docs/pins.md` — ran after the final (round-2) build. `git -C
  steelCompendium.github.io checkout -- docs/api/v1/` — ran (no-op).
- Killed the two http.server instances started this round (ports 8179, 8180).
- Final `git status -sb`: v2, steel-etl, steelCompendium.github.io all clean on
  `sc115-evidence`; superproject shows only the expected unstaged `v2` pointer diff.

## Drive-by fixes (round 2)

None.

## Follow-ups (round 2)

- Confirmed and left as-is per this round's scope: the featureblock role text (e.g.
  "Hazard Hexer" on `.fb__head`) still shrinks along with every other consumer of the
  shared `.sc-head__slot--mini` rule (32.4px -> 18.4px) — only the project card got an
  exception this round, per the coordinator's item 1. If a featureblock role also needs
  protecting at display size, that's a third override (`.fb__head .sc-head__right-primary`)
  the same shape as the project one, not yet made.
- `.sb__head .sc-head__right-primary` (full statblock card) still keeps its own
  `1.4rem` override, untouched, unaffected by either round.

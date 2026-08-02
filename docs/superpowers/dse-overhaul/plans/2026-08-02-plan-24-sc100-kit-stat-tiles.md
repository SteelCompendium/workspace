# SC-100 — Kit Stat-Tile Rebuild + Theme-Conditional Rendering (Plan 24)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking. Read the workspace `dse-verify` and `linear-flow`
> skills before running gates or touching SC-100 — this plan references their procedures, it
> does not restate them.

> **STATUS 2026-08-02: DRAFT — direction approved (Option A), execution awaiting Scott's
> go-ahead on this plan text.** Written against `draw-steel-elements` main @ `ccf465e`
> (plans 22 / SC-104 / SC-105 / SC-108 landed). Baselines per the dse-verify skill as of dse
> `0a3ce4d`: tsc clean · jest **2016 / 144 suites** · shots **169** · obsidian-shots **132** ·
> parity **0 GAPs / 10 WARNs / exit 0** · freeze **101/101**. These drift — Task 1 records
> the real numbers at the execution commit before anything changes.

**Goal:** Rebuild the `ds-kit` card's Steel rendering from a plain label-value list into the
converged best-of-both composition — the site's head grammar (backpack crest + "◆ MARTIAL
KIT" eyebrow via the shared `cardHead`), the site's boxed Equipment band, the site's 2×4
stat-tile grid **including — dash tiles for absent bonuses** (real information the current
list omits), and the plugin's richer inline signature-ability card (kept — it beats the
site's tile). Doing this requires the codebase's first **theme-conditional render** — a
properly designed, framework-sanctioned pattern, not a hack — because the Legacy DOM must
keep rendering byte-identically while the Steel DOM restructures, and `kit--steel-print.png`
takes its **one sanctioned rebaseline**.

**Tickets:** SC-100 (FOLLOWUPS #32 + gap-inventory §B kit + §D2). Needs before/after
evidence on the issue per linear-flow — this is the most visible structural change of the
overhaul.

---

## Binding rulings (Scott, 2026-08-02)

1. **The v2 site is MVP-state — a reference, not gospel.** Converge on the BEST design.
   Where the plugin is better, keep the plugin's take and **file a v2-site ticket** to bring
   the site up (see "v2-site tickets to file" below; Task 1's fresh side-by-side read may
   append more — route new site-side gaps into that section / Linear, never silently
   regress the plugin to match the site).
2. **Target composition:** the site's head grammar (crest + kind eyebrow via the shared
   `cardHead`) + the site's stat-tile grid **with dash tiles for absent bonuses** + the
   plugin's richer signature-ability sub-render, kept.
3. **Option A:** design theme-conditional rendering properly, and accept exactly **one
   sanctioned rebaseline: `kit--steel-print.png`**. `kit--legacy-{dark,light}.png` stay
   byte-identical.

## Architecture — the theme-conditional render pattern (THE design core)

**Verified current facts** (all re-checked at `ccf465e` — several claims in the older
plan-21 analysis have drifted):

- Kit renders through the shared `DisplayCardView` + `CardLayout`
  (`src/elements/shared/CardLayout.ts`), driven by `kitLayout`
  (`src/elements/display/layouts.ts:28`) via the `displayFamily()` factory
  (`src/elements/display/displayFamily.ts`) — the same view class all **13**
  display-family registrations use (11 elements incl. `rule`, plus statblock/feature's
  shared machinery around it). It emits `.dse-card__title/__subtitle/__badges/__flavor/
  __rows/__body`; it does not use `cardHead` and has no stat-tile primitive.
- The pipeline stamps `data-dse-theme` **before** `view.mount()` (pipeline.ts —
  `cx.theme.apply(root, view)` precedes `view.mount(root, model)`), and `cx.theme.active`
  is synchronously readable at any time. (The old "stamped after mount" claim is stale.)
- A theme switch today is **reflow, not re-render**: `ThemeService.apply()` registers an
  `onChange` that re-writes the attribute only (`src/framework/seams/theme.ts:79-87`).
  Nothing re-renders a mounted view on theme change — the pattern must add that.
- The harness renders each theme/bg combo as a **separate page load** with
  `theme.setActive(params.theme)` before the pipeline runs (`visual-harness/entry.ts`),
  so per-shot `cx.theme.active` is always correct at mount.
- **Print cannot be a render branch**: `data-dse-print` is the `printPreview` pref's
  reflected attribute (`src/prefs/catalog.ts`), pure CSS, applied to whatever DOM the
  active theme built. `kit--steel-print` renders the *steel* DOM ⇒ a Steel kit DOM rebuild
  necessarily changes it. Hence the sanctioned rebaseline.
- The freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`) is now **101** lines;
  exactly three are kit: `kit--legacy-dark.png`, `kit--legacy-light.png`,
  `kit--steel-print.png` (lines 54-56).
- The parity gate's only display-family pair is `card-ref` (`.dse-card` ↔ the site kit
  index tile `.sc-card`, `visual-harness/parity/selector-map.json`) — it compares material
  on the pair roots, so the rebuild must **keep `.dse-card` as the Steel plate root class**.

**The pattern — "theme-scoped composition slot on CardLayout, branch at mount, re-render on
theme change":**

- `CardLayout<M>` gains an optional **`steel?: SteelCardComposition<M>`** slot. Absent (the
  default, and the state of all 12 non-kit display layouts after this plan) ⇒ **zero
  behavior change**: one theme-agnostic DOM, exactly today's code path.
- `DisplayCardView.onMount` branches **once, at mount**: `cx.theme.active === 'steel' &&
  layout.steel` ⇒ render the Steel composition; **any other theme — legacy AND any future
  snippet theme id (`DseThemeId` is an open union) — renders the existing DOM builder,
  moved verbatim into a `renderLegacy()` private method, not copied.** The legacy DOM is
  the canonical fallback.
- **Re-render on theme change:** when (and only when) `layout.steel` exists, the view
  registers `cx.theme.onChange` (owner-registered via `this.register(...)`, so teardown is
  automatic and popout-safe). The handler computes the new branch; if it differs from the
  rendered one, the view tears down **its own card subtree only** — unload its owned
  children, remove the `.dse-card` node it created (NOT `rootEl.empty()`, which would also
  destroy pipeline-owned siblings like the authoring pencil appended after mount) — and
  re-renders. `ThemeService.apply`'s existing attribute re-stamp continues untouched.
- **Why not an `ElementDefinition`-level flag + pipeline re-run:** the view already owns
  the DOM lifecycle and receives `cx` at construction; a pipeline-driven re-run would
  re-parse/re-validate for what is purely a view concern, and `ElementView.update()`'s
  default (unload children + empty + onMount) is already 90% of a remount. The
  definition-level surface stays untouched; the pattern is documented as THE sanctioned
  way any future view does theme-aware composition (see Task 5's `.repo-docs` step).
- **Invariants (contract-tested in Task 2):**
  1. A layout without `steel` renders byte-identical DOM under every theme.
  2. A layout with `steel` renders the legacy DOM verbatim under every non-steel theme.
  3. A live theme switch swaps the DOM in both directions without touching pipeline-owned
     siblings, and unloads the outgoing branch's owned children (no listener leaks).
  4. Print never branches the render — it stays a CSS attribute on either DOM.

## Design — the Steel kit composition

Mirrors `steel-etl/internal/site/kit_page.go` (`renderKitPlate`) + `cards.go` (`kitCard`),
adapted to the plugin's primitives. Root stays `.dse-card` (parity pair + material CSS).

1. **Head** — shared `cardHead()` (`src/framework/kit/cardHead.ts`) with
   `crest: { icon: 'backpack', size: 'lg' }` and `leftEyebrow: '<Kind> Kit'`,
   `name: m.name`. The Steel ◆ eyebrow styling already exists
   (`styles-source.css:~3657`, SC-10) and the crest is Steel-only by construction.
   **Kind derivation** mirrors the site's `kitKind`: sniff the signature ability's
   keywords for "Psionic"/"Magic", else "Martial" — from `m.signature_ability.keywords`
   inline; from the resolved source body in by-SCC hybrid mode (where
   `signature_ability` is undefined — frontmatter-only model). Corpus fact (verified):
   `kit_type`/`armor`/`weapon` are **never emitted** in real data, so the Steel branch
   drops the subtitle + armor/weapon badges (dead inline-only decoration; the equipment
   band carries the real information). Site-side convergence → ticket 2 below.
2. **Flavor** — existing `.dse-card__flavor`, from the model.
3. **Equipment band** — boxed panel: small-caps band-head "Equipment" + the verbatim
   `equipment_text` sentence through `renderMarkdown` (scc links live). Always rendered
   (site parity; `&nbsp;`-style reservation when empty).
4. **Kit Bonuses band** — band-head "Kit Bonuses" + **two rows of 4 fixed stat tiles**
   (large value over small-caps label): `Stamina per Echelon / Speed / Stability /
   Disengage` then `Melee Dmg / Ranged Dmg / Melee Dist / Ranged Dist` (dmg tiles carry an
   accent class like the site's `is-dmg`). Absent bonus ⇒ **"—"**; a `" per …"` qualifier
   is stripped from the value (it lives in the label) — port the site's `kitBonus()`
   semantics exactly.
5. **Signature Ability** — band-head "Signature Ability", then the **existing**
   `renderFeatureList` sub-render unchanged (inline mode). This is the kept
   plugin-is-richer surface.
6. **Body / hybrid mode** — inline: unchanged (`kitLayout.body` already suppresses
   `content` when a signature ability renders). By-SCC hybrid: the composition renders
   from frontmatter fields (all present in hybrid), and the trailing source-body render
   **strips the `Equipment` and `Kit Bonuses` headed sections** (now presented
   structurally by the bands) while keeping the flavor-dedup guard and the signature
   section — whose nested `ds-feature` fence must keep recursing into a real card
   (the `by-scc-kit--obsidian-recursion` ground-truth shot proves this path). If the
   section-stripping proves fragile against real compendium files, fall back to the
   current whole-body render and report the duplication for Scott's call — do not ship a
   half-working stripper silently.
7. **Stat-tile primitive** — a new kit builder (e.g. `src/framework/kit/statTiles.ts`,
   value/label/accent cells, dash-aware) with its own class grammar. **Do NOT modify
   `CharacteristicsGrid.ts` or the `.dse-statgrid` DOM** — characteristics/hero/values-row
   legacy shots are frozen; evaluate borrowing its *CSS shapes* only. New CSS may target
   the new nodes (they cannot leak into legacy shots — the legacy DOM never contains
   them), but screen-only material (sheen/metal/washes) still carries the
   `[data-dse-theme='steel']:not([data-dse-print="on"])` guard so `kit--steel-print`
   comes out **flat, print-appropriate** (D3 print spec) — its change is sanctioned, not
   exempt from print design rules.

## §D2 decision — other display-family elements

**Sequenced as a follow-up, NOT implemented in this plan.** Rationale: (a) the sanctioned
rebaseline covers **exactly one file** — every additional family's Steel composition
changes its own frozen `*--steel-print.png` and needs its own sign-off; (b) the site's
class/career counterparts (`.sc-classhead`, `careerCard` stat boxes) need their own
composition read — folding them in would bloat the review surface of an already very
visible change. This plan builds the **generic** seam (`CardLayout.steel` +
`DisplayCardView` branch + stat-tile primitive) so each follow-up family is layout-data +
CSS + one sanctioned rebaseline. Task 5 files the follow-up ticket.

## Global Constraints

- **LEGACY-FREEZE:** `kit--legacy-{dark,light}.png` and **every other** frozen PNG stay
  byte-identical — including all 12 non-kit display families in ALL schemes and
  `*--steel-print.png` for everything except kit. Expected freeze result during this plan:
  **`100/101` with exactly one mismatch, `kit--steel-print.png`** — any other mismatch is
  a bug, fix it (dse-verify: narrow the selector / fix the branch), never touch the
  baseline mid-plan.
- **The rebaseline is a landing-time act, not an execution-time one.** Procedure (extends
  dse-verify's freeze semantics — this is the sanctioned third case beyond "never edit" /
  "additions only"): after Scott approves the after-shots on SC-100, replace **only** the
  `kit--steel-print.png` hash line in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`
  with the approved worktree shot's `sha256sum`; count stays 101; re-run `check-freeze.sh`
  → `freeze OK (101/101 …)`. Task 5 documents the exception in the dse-verify skill.
- **Non-kit display elements: byte-identical DOM in every theme** (contract-tested).
  Legacy kit DOM: same code path moved, not rewritten — existing jest DOM assertions keep
  passing against the legacy branch.
- **Parity stays 0 GAPs / 10 WARNs / exit 0.** `.dse-card` remains the Steel plate root.
  If the rebuild legitimately changes the `card-ref` pair's read, that is a
  selector-map/deferral conversation per the dse-verify skill, not a silent number bump.
- **No new `--dse-*` tokens** — reuse the existing token vocabulary (SC-105's font tokens,
  material tokens). If a genuinely new token is unavoidable, STOP and report (tokens.ts is
  out of scope).
- **No changes outside `draw-steel-elements`** except workspace docs + Linear. The v2-site
  items are TICKETS (below), not code in this plan.
- **Environment / gates / commits:** everything per the **dse-verify skill** (devbox
  `bash -c` with absolute paths, exit-code footgun, battery order, parity-last). Commit
  messages carry **no AI/Claude attribution or co-author trailers**.

## Execution

**Worktree (required).** From `/home/scott/code/steelCompendium/workspace`:
`devbox run -- bash -c 'just wt-new steel-kit'` → work in
`/home/scott/code/steelCompendium/worktrees/steel-kit/draw-steel-elements` (branch
`steel-kit`); `npm ci` first.

**Stop condition: do NOT land, do NOT rebaseline.** Finish, post evidence, set SC-100 to
In Progress + `Needs Review` (linear-flow). Scott approves the visuals, then the rebaseline
+ `just wt-finish steel-kit` happen from the main checkout.

**Final report:** commit shas per task · gate numbers (tsc / jest / shots / obsidian-shots
if display available / parity / freeze — freeze expected `100/101`, sole mismatch
`kit--steel-print.png`) · per-scheme kit visual verdicts · links to the SC-100 evidence
comments · the tickets filed.

---

### Task 1: Recon, baselines, and "before" evidence

**Files:** none modified (worktree setup + captures only).

- [ ] **Step 1: Worktree + baseline gates.** `just wt-new steel-kit`, `npm ci`, then run the
  full dse-verify battery untouched and record the REAL numbers at this commit (jest suite
  count, shots count, parity 0/10, freeze 101/101). These are the regression floor.
- [ ] **Step 2: Capture the "before" set.** From the untouched worktree:
  `kit--steel-dark.png`, `kit--steel-light.png`, `kit--steel-print.png`,
  `kit--legacy-dark.png`; plus the site references — the live kit index tile and a kit
  detail page (e.g. Panther/Battlemind; `npm run shot-url` per the harness README, or the
  existing plan-21 contact-sheet pair `04-kit--{site,plugin}.png` if regeneration is
  unavailable).
- [ ] **Step 3: Post the baseline to SC-100** per linear-flow: the "before" plugin shot and
  the site design-reference shots as **root attachments** with state-naming titles
  ("Baseline — kit steel-dark", "Design reference — site kit tile / detail plate"). Move
  SC-100 to **Awaiting** (agent actively working) if not already.
- [ ] **Step 4: Verify the load-bearing architecture facts** against the worktree commit
  (they are re-verified as of `ccf465e`, but plans 23+/SC-1xx work may land between this
  draft and execution): theme apply-before-mount in `pipeline.ts`; reflow-only
  `onChange` in `seams/theme.ts`; the 3 kit lines in the freeze baseline; the `card-ref`
  parity pair; `DisplayCardView`'s current DOM grammar. If any has moved, STOP and update
  this plan's affected steps before writing code.
- [ ] **Step 5: Side-by-side design read** (site tile + site detail plate vs plugin card,
  both schemes): confirm the target composition's slot list against what the site
  actually renders today, and note any additional plugin-is-better site-side gaps →
  append them to this plan's "v2-site tickets to file" section (superproject edit,
  committed in Task 5).

### Task 2: The theme-conditional seam in DisplayCardView (framework core)

**Files:** Modify `src/elements/shared/CardLayout.ts`;
new/extended tests in `test/dom/elements/` (e.g. `displayCardThemeBranch.test.ts`).

- [ ] **Step 1: `SteelCardComposition<M>` + the branch.** Add the optional `steel` slot to
  `CardLayout<M>` (declarative: `eyebrow(m, source?)`, `crestIcon`, `bands` — equipment /
  stat-tiles / features / body policy — shaped so Task 3 fills it without new view code
  beyond the renderers). Refactor `DisplayCardView.onMount` into `renderLegacy()` (the
  current body **moved verbatim** — same statements, same order, so the legacy DOM cannot
  drift) and `renderSteel()` (stub for now), selected by
  `cx.theme.active === 'steel' && !!layout.steel`. Track the view-created card node and
  rendered branch as private fields.
- [ ] **Step 2: Re-render on theme change.** When `layout.steel` exists, register
  `this.register(cx.theme.onChange(...))`: recompute the branch; if changed → unload this
  view's owned children, remove the tracked card node (never `rootEl.empty()`), re-render.
  Guard against firing before first mount and after unload (owner registration handles
  the latter; assert the former).
- [ ] **Step 3: Contract tests** (offline jest, real `createThemeService` over a prefs
  store, as `displayFamily.test.ts` already does): (a) a steel-less layout renders
  byte-identical `outerHTML` under `legacy`, `steel`, and a snippet id (`'parchment'`);
  (b) a layout WITH `steel` renders the legacy DOM verbatim under `legacy` + snippet ids;
  (c) `setActive('legacy') → setActive('steel')` and back swaps the DOM both directions,
  preserves a sibling node appended to root after mount (the pencil stand-in), and the
  outgoing branch's owned children are unloaded; (d) prove each can fail (break the
  branch condition, watch it fail, restore — plan-22 style evidence).
- [ ] **Step 4: Gates + commit.** tsc clean · jest green (existing display tests must pass
  UNCHANGED — the legacy path moved, not changed) · `npm run shots` + freeze **101/101**
  (no layout has `steel` yet ⇒ zero pixels change anywhere).
```bash
git add src/elements/shared/CardLayout.ts test/dom/elements/
git commit -m "feat(display): theme-conditional composition seam in DisplayCardView (SC-100)"
```

### Task 3: The Steel kit composition (stat tiles, bands, head)

**Files:** New `src/framework/kit/statTiles.ts`; modify `src/elements/display/layouts.ts`
(kitLayout.steel), `src/elements/shared/CardLayout.ts` (renderSteel), `styles-source.css`;
tests: split/extend `test/dom/elements/displayFamily.test.ts` + new
`test/dom/elements/kitSteel.test.ts`.

- [ ] **Step 1: `statTiles()` kit primitive.** Value-over-label tile row builder with
  fixed-slot dash semantics and an accent-class hook (`is-dmg` equivalent). New class
  grammar; do not touch `CharacteristicsGrid`/`.dse-statgrid` DOM (frozen elsewhere) —
  borrow its CSS shapes by reference only.
- [ ] **Step 2: `kitLayout.steel`** per the Design section: cardHead (backpack crest, kind
  eyebrow via the ported `kitKind`/`kitBonus` semantics), flavor, Equipment band, 2×4
  Kit Bonuses tiles with dashes, Signature Ability band + existing `renderFeatureList`,
  hybrid body-section stripping with the stated fallback. `renderSteel()` in
  DisplayCardView executes the composition through the same `renderMarkdown` /
  duplicate-guard machinery the legacy path uses.
- [ ] **Step 3: CSS** — bands, band-heads, tiles, head-in-card integration: Steel screen
  styling (material tokens, serif/small-caps per DESIGN.md) + **flat print treatment**
  for the same nodes (this styles the sanctioned new `kit--steel-print`). Screen-only
  material carries the standard steel+not-print guard.
- [ ] **Step 4: Tests.** Existing kit DOM assertions in `displayFamily.test.ts` /
  `displayCardHybrid.test.ts` become explicit **legacy-branch** tests
  (`setActive('legacy')`) — assertions unchanged, proving the old DOM still renders.
  New `kitSteel.test.ts`: eyebrow text ("Martial Kit" / "Psionic Kit" from keywords,
  hybrid body-sniff), crest present, 8 tiles in order with "—" for the example fixture's
  absent bonuses and the `per echelon` qualifier stripped into the label, equipment band
  verbatim, sig band + feature card present, hybrid mode strips Equipment/Kit Bonuses
  sections but keeps the signature fence, and non-kit families still byte-identical
  across themes.
- [ ] **Step 5: Gates.** tsc · jest · `npm run shots` → freeze expected **`100/101`, sole
  mismatch `kit--steel-print.png`** (anything else = leak, fix before proceeding) ·
  `npm run parity` LAST → 0/10/exit 0.
```bash
git add src/framework/kit/statTiles.ts src/elements/display/layouts.ts src/elements/shared/CardLayout.ts styles-source.css test/
git commit -m "feat(kit): Steel stat-tile composition — cardHead crest/eyebrow, equipment band, dash tiles (SC-100)"
```

### Task 4: Visual verification + "after" evidence + review gate

**Files:** none (captures, Linear, report).

- [ ] **Step 1: Read the shots** — `kit--steel-{dark,light}.png` against the site
  references (composition, tile order, dashes, eyebrow, crest, sig card);
  `kit--legacy-{dark,light}.png` unchanged (freeze already proves bytes — still LOOK at
  them); `kit--steel-print.png` (flat, print-appropriate, no screen material). If a
  display is available: `npm run obsidian-shots` and read `kit--obsidian-*` +
  `by-scc-kit--obsidian-recursion.png` (the nested-fence recursion must survive the
  hybrid body-stripping). Skip honestly if headless.
- [ ] **Step 2: Rebuild for the live vault** (`npm run build-no-check`, per dse-verify) so
  Scott's in-vault look at the worktree plugin matches the shots.
- [ ] **Step 3: Post the after-evidence** per linear-flow: inline before/after pairs
  (steel-dark, steel-light, steel-print, and the legacy-unchanged proof) in a narrating
  SC-100 comment, including the freeze `100/101` statement and the pending-rebaseline
  procedure. Set **In Progress + `Needs Review`**.

### Task 5: Docs, tickets, and wrap

**Files:** Plugin `.repo-docs/architecture.md` + `CHANGELOG.md`; workspace `CHANGELOG.md`,
`FOLLOWUPS.md`, `docs/superpowers/dse-overhaul/2026-07-23-steel-ui-gap-inventory.md`,
`.claude/skills/dse-verify/SKILL.md`, this plan file (ticket-section updates); Linear.

- [ ] **Step 1: Document the pattern.** Plugin `.repo-docs/architecture.md`: the
  theme-conditional composition seam (branch condition, legacy-as-canonical-fallback for
  snippet themes, re-render-on-change mechanics, the four invariants, print-is-CSS-only).
  This is the reference every future `layout.steel` adopter reads.
- [ ] **Step 2: Freeze-exception doc.** dse-verify `SKILL.md` freeze section: add the
  sanctioned single-line rebaseline case (dated, SC-100, `kit--steel-print.png` only,
  procedure as in Global Constraints) so the "never edit the baseline" rule stays honest.
- [ ] **Step 3: Changelogs + status.** Plugin + workspace `CHANGELOG.md` under Unreleased
  (user-facing: Steel kit card rebuilt — crest/eyebrow head, equipment band, stat-tile
  grid with dash tiles; legacy theme unchanged). FOLLOWUPS **#32 → done** (dated, with
  the §D2-sequenced note). Gap inventory: §B kit entry closed, §D2 pointed at the
  follow-up ticket.
- [ ] **Step 4: File the tickets.** In Linear (team Steel Compendium): the v2-site tickets
  from the section below (plus any Task 1 additions), and the plugin follow-up —
  **"§D2: Steel compositions for the remaining display families (class/career/…)"** —
  noting each family needs its own sanctioned `*--steel-print` rebaseline sign-off and
  that the seam/primitive now exist. Link all of them from SC-100.
- [ ] **Step 5: Commits** (submodule docs in the worktree; superproject docs as their own
  commit; no pointer bump, no push, no landing — stop per the Execution section).

---

## v2-site tickets to file (ruling 1 — bring the site up where the plugin wins)

Ready to paste; file in Task 5 Step 4 and link from SC-100. Task 1 Step 5 may append more.

**1. Kit Browse tile: render the signature ability as a full inline ability card (adopt
the plugin's sub-render)**

The DSE plugin's `ds-kit` card renders the kit's signature ability as a complete inline
ability card — keywords, action chip, power-roll tier table, effects — via its shared
feature renderer, and SC-100 kept it because it is richer than the site. The site's kit
*detail* page already splices the full `.sc-ability` card beneath the plate
(`embedItemCards`), but the Browse kit index tile (`kitCard` in
`steel-etl/internal/site/cards.go`) still reduces the signature ability to a one-line
`sigBlock` (type + name). Bring the tile up to the plugin's standard: render the full
ability card inline on the tile (collapsed/progressive-disclosure is acceptable if the
tile grid can't take the height — the information should be reachable without leaving the
index). Evidence: SC-100 before/after set (plugin steel-dark kit card vs site kit tile).

**2. Emit kit kind (Martial / Magic / Psionic) as frontmatter; stop keyword-sniffing in
the kit renderers**

Both site kit renderers derive the kit's kind by sniffing the signature ability's keyword
line out of the page body (`kitKind` in `steel-etl/internal/site/kit_page.go`, duplicated
in `cards.go`), because the SDK's declared `Kit.kit_type` field is emitted **nowhere** in
the corpus (verified: 0 occurrences in `data-unified` kit yaml/md frontmatter; `armor`/
`weapon` are equally dead). Promote the derived kind into the ETL's kit frontmatter per
the card⇄data parity checklist (`steel-etl/docs/card-data-parity.md`: parser emit → both
schema copies → validation allowlist → card reads the field with body fallback), then
consume it in `kitCard`/`renderKitPlate` — and the DSE plugin's by-SCC hybrid mode (which
today has no principled way to know the kind without re-sniffing the source body, as
SC-100 had to) gets it for free.

---

## Self-review

**Spec coverage.** FOLLOWUPS #32 (crest/eyebrow, stat-tile grid, boxed equipment) → Tasks
2-3; dash tiles (ruling 2's "real information") → Task 3 Steps 1-2; keep-the-sig-render →
Design §5 / Task 3; the freeze/architecture question that deferred plan 21 Task 4 → the
Architecture section + Task 2; sanctioned `kit--steel-print` rebaseline → Global
Constraints (landing-time, single hash line) + Task 4 evidence; §D2 → explicit sequencing
decision + Task 5 ticket; ruling 1's site tickets → dedicated section + Task 1 Step 5
append path + Task 5 filing.

**Verified-against-code.** Every architectural claim was re-read at `ccf465e`, and three
drifted facts are corrected in-plan: theme is stamped BEFORE mount (not after); the freeze
set is 101 (not 98); baselines are jest 2016/shots 169 (Task 1 re-records at execution).
Site composition ported from the real `kit_page.go`/`cards.go` (dash + `per`-qualifier
semantics from `kitBonus`, kind from `kitKind`), not from memory. Corpus facts
(`kit_type`/`armor`/`weapon` dead; hybrid model is frontmatter-only) checked directly.

**Known risks.** (1) Hybrid body-section stripping is the least-certain mechanic — it has
an explicit fallback + report path (Design §6) and a ground-truth recursion shot guarding
the nested fence. (2) The re-render path interacting with pipeline-owned siblings — pinned
by Task 2 Step 3(c)'s pencil-survival test. (3) Freeze leakage from new CSS — new-node
classes can't appear in legacy DOM, and the `100/101 sole-mismatch` expectation makes any
leak loud at Task 3 Step 5. (4) Parity depends on `.dse-card` remaining the plate root —
stated as a hard constraint. (5) No parity/gate coverage exists for the Steel composition
itself — the shot-read + Scott's Needs Review are the visual authority, stated honestly
rather than implied by a gate.

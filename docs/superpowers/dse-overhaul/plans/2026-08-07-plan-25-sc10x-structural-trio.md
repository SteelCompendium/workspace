# SC-103 / SC-102 / SC-101 — The Structural Trio (Plan 25)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking. Read the workspace `dse-verify` and `linear-flow`
> skills before running gates or touching the tickets — this plan references their procedures,
> it does not restate them.

> **STATUS 2026-08-07: DRAFT — awaiting Scott's decisions (§"Scott decisions") before
> execution.** Written against `draw-steel-elements` main @ `f09f6cc` (SC-121 batches 1–4
> landed; freeze rebaselines applied, count 107). Baselines per the dse-verify skill at fork:
> tsc clean · jest **2190 / 154 suites** · shots **179** · obsidian-shots **141** ·
> freeze **107/107** · parity **0 GAPs / 10 WARNs / exit 0**. These drift — Task 1 records the
> real numbers at the execution commit before anything changes. (The `guards` worktree is
> retargeting parity pairs in parallel and may land `0 GAP / 0 WARN + declared`; see
> §"Interaction with the guards branch".)

**Goal:** close the last three DOM-level parity items gating the DSE 7.0.0 release —
SC-103 (statblock diamond notch placement), SC-102 (action-type spine context + the missing
`villain` action type), SC-101 (featureblock option cost + per-option bars).

**Tickets:** SC-103 (FOLLOWUPS #35), SC-102 (FOLLOWUPS #34 + the SC-121 Batch-3 villain
root-cause comment), SC-101 (FOLLOWUPS #33). All three are children of **SC-97** (the release
gate) in project **DSE 7.0.0**. Each needs before/after evidence on its issue per linear-flow.

---

## Plan-time discoveries that CHANGE the tickets' assumptions

Read these first — three of them invert the tickets' stated shape. Every claim below was
re-verified in code at `f09f6cc`; file:line references are exact.

### D1 — SC-101's "#37 fixture gap" is CLOSED. (Verified; refutes the ticket.)

SC-101's description says *"#37 notes that the Steel `.dse-fb__adv-head` and
`.dse-fb__band--adv` rules are rendered by no harness fixture … Worth fixing #37's fixture
first so this work is actually visible."* **That is stale.** SC-108 (FOLLOWUPS #37) was
completed **2026-08-02** and added exactly that fixture:

- `visual-harness/entry.ts:73-101` — the harness-local `featureblockAdvancement` template
  literal ("Tiered Idol", `featureblock_type: Fixture`), registered at `entry.ts:151` as
  `featureblock: { default: featureblockDefault, advancement: featureblockAdvancement }`.
- It emits **two** Level>0 runs (two Level-3 features, then one Level-6), i.e. **two
  `.dse-fb__band--adv` bands** with their `.dse-fb__adv-head` sub-heads — lighting both
  previously-unrendered rules.
- Its shots exist and **three are frozen**: `featureblock-advancement--legacy-dark.png`,
  `featureblock-advancement--legacy-light.png`, `featureblock-advancement--steel-print.png`
  (the documented 98 → 101 freeze widening, dse-verify skill § "Freeze semantics").

**Action:** no blocker, no prerequisite fixture work. Task 6 Step 4 edits SC-101's description
to strike the stale paragraph.

### D2 — SC-101 does NOT need DOM work. It is reachable as Steel-scoped CSS. (Inverts the ticket.)

SC-101 is filed as "Feature (DOM) · §B structural". Both halves are CSS-reachable on the
**existing** DOM:

- **Per-option bars.** There is *no* single continuous rail node. The "one continuous accent
  rail" is **N adjacent per-option pseudo-elements that visually fuse**: every option already
  has its own wrapper `div.dse-feature` (created per option at
  `src/elements/feature/renderFeature.ts:161`, one per `configs` entry from
  `renderFeature.ts:144-147`), each `position: relative` (`styles-source.css:39-42`), each
  carrying `[data-dse-act]` + an inline `--dse-act` (`renderFeature.ts:171-172`), each drawing
  `.dse-feature[data-dse-act]::before { position:absolute; top:0; bottom:0; left:0; width:3px;
  background: var(--dse-act, none) }` (`styles-source.css:57-68`). They read as one unbroken
  line only because `.dse-feature__nested > .dse-feature` is separated by **padding, not
  margin/gap** (`styles-source.css:184-192`), and because both featureblock fixtures use
  `feature_type: trait` for every option so every spine is the same `--dse-act-trait` hue.
  **Adding a gap + a per-card frame breaks them into discrete bars — pure CSS.**
- **Option cost.** Plugin: `cardHead(..., rightEyebrow: feature.cost ? '' : undefined, ...)`
  then `md(String(feature.cost).trim(), head.slots.rightEyebrow!, true)`
  (`renderFeature.ts:213-230`) ⇒ a `span.dse-head__eyebrow--right.dse-head__eyebrow--chip`,
  styled as the "forged cost chip" at `styles-source.css:4021-4027`. Site: the cost goes in
  **`RightPrimary` as `hMini`** (`steel-etl/internal/site/featureblock_page.go:385-392`,
  `card_head.go:20`) ⇒ `.sc-head__slot--mini` = `font-family: var(--md-large-header-font);
  text-transform: uppercase; font-size: 1.35rem; line-height: 1.04; color: var(--role, …)`
  (`v2/docs/stylesheets/steel-cardhead.css:111-114`).
  **`.dse-head` is a real CSS grid** — `display:grid; grid-template-columns: auto minmax(0,1fr)
  auto; grid-template-rows: auto auto auto` (`styles-source.css:6039-6046`) with explicit
  `grid-area` placement per slot (`:6067-6075`). So the right column's eyebrow/primary rows can
  be **re-placed in CSS** without touching `cardHead.ts` or `renderFeature.ts`.
  - **DOM order stays consistent with visual order** after the swap: the cost span is created
    first (`cardHead.ts:96`) and lands on row 2; the `ability_type` span is created second
    (`cardHead.ts:97`) and lands on row 3. Top-to-bottom visual order == DOM order ⇒ no
    reading-order/a11y regression.
  - **Slot-collision check (must verify in Task 1):** `renderFeature.ts:213-224` passes
    `rightDeck` **never**, so the deck row is free in every feature card. `rightPrimary` is
    `feature.ability_type ? '' : undefined` — for the featureblock `default` fixture the three
    options are `feature_type: trait` with **no `ability_type`**, so today only the eyebrow row
    is occupied. The rule must therefore degrade correctly when the primary row is absent.

**Consequence:** SC-101 becomes CSS-only, needs no theme-conditional render, and is *smaller*
than SC-102 — the opposite of the assumed ordering. See §"Sequencing".

### D3 — SC-101 and SC-102 are two halves of ONE site rule. (Not two independent fixes.)

Verified in the site sheets: the accent spine is a **nested-card frame**, not a standalone-card
ornament. The site draws the *identical* declaration in both nested contexts and **nothing** in
the standalone context:

| context | site selector | declaration |
|---|---|---|
| standalone ability card | `.sc-ability` (`steel-ability-cards.css:63-68`) | **no `border-left` anywhere.** `--act` only tints the crest glyph (`:87`), the eyebrow text (`:94`) and a 7px diamond (`:95`) |
| nested in **statblock** | `[data-sb-featstyle="card"] .sb__feat` (`steel-statblock.css:301-304`) | `background: rgba(0,0,0,.16); border-left: 3px solid var(--act); border-radius: 9px; padding: .7rem .85rem .78rem` |
| nested in **featureblock** | `[data-fb-featstyle="card"] .fb__feat` (`steel-featureblock.css:161-162`) | **byte-identical declaration** |

Light scheme in both: `background: rgba(0,0,0,.022)` (`steel-statblock.css:306`,
`steel-featureblock.css:162`). Both nested lists carry a real gap:
`.fb__feats { … gap: .65rem }` (`steel-featureblock.css:122`).

So SC-102's "remove the spine on standalone" and SC-101's "per-option bars" are the **same
convergence expressed on complementary selectors**. The plugin can distinguish the contexts
today with **zero DOM change**: a standalone card is the only one whose pipeline root carries
`[data-dse-element='feature']` (`styles-source.css:74`); a nested card is always
`.dse-feature__nested > .dse-feature` under `.dse-sb` or `.dse-fb`.

**Scope consequence:** the nested frame is one rule for `:is(.dse-sb, .dse-fb)`. Applying it to
featureblock only would leave the plugin's statblock features fused while its featureblocks are
framed — an internal inconsistency the site does not have. This plan implements the shared
rule and therefore **SC-101's blast radius includes `statblock--steel-*`**. Flagged as Scott
decision **S-4**.

### D4 — SC-103's notch is a real DOM node that renders in EVERY theme. (Constrains the fix.)

The ◆ is **not** a pseudo-element. `src/framework/kit/divider.ts:36-44` creates
`div.dse-hr > span.dse-hr__line--left + span.dse-hr__diamond + span.dse-hr__line--right`, and
the statblock inserts it as a **flat sibling after `.dse-sb__chars`** from `renderFeatures`
(`src/elements/statblock/view.ts:272`, guarded by the `features?.length` early return at
`:271`). Its CSS (`styles-source.css:5843-5878`) is **completely unguarded** — no
`[data-dse-theme]`, no `[data-dse-print]` — so it renders in Legacy too, and it is asserted
unconditionally by tests (`test/dom/elements/statblock.test.ts:368`, `test/dom/kit/divider.test.ts:21,48-54`,
`test/dom/kit/kit-index.test.ts:245-249`).

⇒ **Moving the node in TS would move `statblock--legacy-{dark,light}.png`. Forbidden.** The fix
must be Steel-scoped CSS: hide `.dse-sb > .dse-hr` under Steel and paint the site's notch as a
new `::after` on the head band. Two supporting facts:

- The site's notch is `.sb__head::after` — `content:""; position:absolute; left:50%; bottom:0;
  width:9px; height:9px; transform: translate(-50%,50%) rotate(45deg); background: var(--role);
  box-shadow: 0 0 0 4px var(--sb-plate-solid), 0 0 0 5px color-mix(in srgb, var(--role) 40%,
  var(--sb-plate-solid))` (`steel-statblock.css:97-103`). Note: **role-hued, 9px, no flanking
  lines**, halo by outer rings. The plugin's `.dse-hr` is **14px, neutral `--dse-rule`, with two
  fade lines and an `inset` page-bg ring**.
- The site has **no divider at all** between chars and features (`.sb__chars`
  `steel-statblock.css:198-203` is followed directly by `.sb__features` `:240`).
- The plugin's Steel head band rule
  (`styles-source.css:5008-5030`, `[data-dse-theme='steel']:not([data-dse-print="on"])
  .dse-sb[data-dse-role] > .dse-head`) declares **no `position`**, and neither does the
  `.dse-head` base (`:6039-6046`). `position: relative` must be added before an absolutely
  positioned `::after` can anchor to it.
- The band rule requires `[data-dse-role]`. The statblock fixture has `role: ""` **but**
  `organization: Leader`, and `statblockHeaderParts` returns `role: statblock.role ||
  statblock.organization` (`view.ts:147`) ⇒ `roleOf('Leader')` ⇒ `data-dse-role="leader"` is
  set. The band (and therefore the new notch) **does** render in the fixture. Re-verify in
  Task 1.

### D5 — the `feature` fixture is a FALSE villain. (Trap; do not "fix" it.)

`src/elements/feature/example.yaml:5` declares `ability_type: Villain Action 1` but `:10`
declares `usage: Main action`. Because of the `??` at `renderFeature.ts:79`, `usage` wins and
the card maps to `act='main'` (red spine, `sword` crest). **After the SC-102 fix it still maps
to `main`** — the dash-fix only affects `usage: "-"`. So `feature--*` shots do **not** move from
the `actionTypeOf` change (only from the standalone-spine change).

The data is nevertheless semantically wrong. **Do not edit `example.yaml`** — it is the D9
single-sourced authoring example and its `feature--legacy-*` shots are freeze-pinned. File it
as a FOLLOWUPS item instead (Task 6). The honest way to prove the villain path standalone is a
**new harness fixture** (`feature: { default, villain }`), which produces new shot names and is
invisible to the freeze check by construction — see Scott decision **S-5**.

### D6 — the only fixture that renders a real villain action is the statblock.

`src/elements/statblock/example.yaml` has three abilities with `usage: "-"` + `icon: ☠️`:
`Shoot!` (`:93-101`, `ability_type: Villain Action 1`), `Form Up!` (`:106-114`,
`Villain Action 2`), `Lead From the Front` (`:121-133`, `Villain Action 3`). They render today
with **no `data-dse-act`, no spine, no crest, no Steel lane padding** — that is the SC-121
Batch-3 bug, catalog item B-4.

Same data also lives in `test/fixtures/statblock/human-bandit-chief.yaml:97,110,125` (consumed
by `test/dom/elements/statblock.test.ts:385-387,457-459`) and
`src/views/SettingsPreview.ts:115,128,143` (the settings-tab live preview — it will visibly
gain spines/crests; that is desirable, but check the preview still fits).

### D7 — the site's villain hue collides with its main-action hue.

Site villain red is `#e0584b` = `--sc-role-controller` (`v2/docs/stylesheets/palette.css:18`),
applied as `.sb__feat[data-action="villain"] { --act: #e0584b }` (`steel-statblock.css:244`) and
`.fb__feat[data-action="villain"] { --act: var(--sc-role-controller) }`
(`steel-featureblock.css:128`). The site's main-action red is `--sc-act-main` — the plugin
mirrors it as `--dse-act-main: var(--sc-act-main, #e74c3c)` dark / `#c0392b` light. **`#e0584b`
and `#e74c3c` are both mid-reds and will be hard to tell apart on a 3px spine.** There is no
`--sc-act-villain` token anywhere in the site palette (only `--sc-ability-villain: #922b21`
dark / `#e57373` light in `palette.css:73,185`, used solely by a legacy blockquote rule in
`extra.css:370`). Hue choice is Scott decision **S-3**.

---

## Global constraints

These are non-negotiable and apply to **all** tasks.

- **LEGACY-FREEZE is absolute.** Every `*--legacy-{dark,light}.png` stays byte-identical.
  This is the hard bound on all three items: it forbids SC-103's DOM move (D4), forbids
  relocating the cost in `cardHead`/`renderFeature` (D2), and makes SC-102's DOM change
  (a new `data-dse-act` value + a crest node on villain cards) a **leak risk that the freeze
  gate must clear** — see the SC-102 task's Step "legacy no-op proof".
- **Print is CSS, never a render branch.** `data-dse-print` is the `printPreview` pref's
  reflected attribute (`src/prefs/catalog.ts`), applied over whatever DOM the active theme
  built. `*--steel-print.png` therefore renders the Steel DOM with print CSS. Corollary: a
  theme-agnostic DOM change reaches print unavoidably; a `[data-dse-theme='steel']:not(
  [data-dse-print="on"])`-scoped CSS change does **not** reach print at all.
- **The two-tier Steel scoping rule (this plan's core discipline).** Every new rule picks a
  tier deliberately and says which in a comment:
  - **structure** (grid placement, gaps, padding, which node draws what) → `[data-dse-theme='steel']`
    (no print exclusion) — *if and only if* Scott takes **S-1 = "print follows structure"*;
  - **material** (backgrounds, sheen, shadows, washes, hues beyond a hairline) →
    `[data-dse-theme='steel']:not([data-dse-print="on"])`, always, no exceptions.
  Under **S-1 = "print stays"** every rule takes the `:not([data-dse-print="on"])` guard and the
  only frozen file that moves is the one SC-102 cannot avoid.
- **Freeze expectations are stated per task and any other mismatch is a bug.** Never edit
  `freeze-baseline.sha256` mid-plan. Rebaselines happen **at landing, after Scott's sanction**,
  one hash line per approved file, count unchanged — dse-verify skill § "Sanctioned single-line
  rebaselines". Each rebaselined file needs its own dated sign-off entry appended to that skill.
- **No new `--dse-*` tokens — EXCEPT the one SC-102 explicitly sanctions.** `--dse-act-villain`
  is the single permitted addition and it comes with the full token-guard arithmetic checklist
  (SC-102 Task, Step 2). Any *other* token need ⇒ STOP and report.
- **No tags, no releases, no RCs.** SC-97 is the release gate (Scott, 2026-07-31).
- **Environment / gates / commits:** everything per the **dse-verify** skill — devbox
  `bash -c` with absolute paths, the **exit-code footgun** (the gate command must be the LAST
  thing in the `bash -c` string; no `| tail`, no `; echo`), battery order, **parity last**.
  Commit messages carry **no AI/Claude attribution and no co-author trailers**.
- **Worktree only.** Never edit `draw-steel-elements/` in the shared main checkout.
- **No changes outside `draw-steel-elements`** except workspace docs (`FOLLOWUPS.md`,
  `CHANGELOG.md`, the gap inventory, the dse-verify skill, `D3-token-map.md`) and Linear.
  **Note `D3-token-map.md` is in the workspace superproject and is gate-enforced** — see the
  SC-102 task, Step 2.

## Execution

**Worktree (required).** From `/home/scott/code/steelCompendium/workspace`:

```bash
devbox run -- bash -c 'just wt-new sc10x-structural'
```

→ work in `/home/scott/code/steelCompendium/worktrees/sc10x-structural/draw-steel-elements`
(branch `sc10x-structural`); `npm ci` first. **One worktree for all three items** — they
overlap on `statblock--steel-print.png` (SC-102 and, under S-4, SC-101), so a single
consolidated rebaseline round at landing is both cheaper and more honest than three.

Also copy this plan into the worktree (`.superpowers/sdd/sc10x-structural/`) and commit it
there per the plan-24 precedent.

**Stop condition: do NOT land, do NOT rebaseline.** Finish all three, post per-item evidence,
set each ticket to In Progress + `Needs Review`. Scott approves the visuals per item; the
rebaseline + `just wt-finish sc10x-structural` happen afterwards from the main checkout.

**Final report:** commit shas per task · gate numbers per task (tsc / jest / shots / freeze /
parity, obsidian-shots only if a display is available) · per-scheme visual verdicts · links to
the three evidence comments · the FOLLOWUPS/tickets filed.

---

## Sequencing

**SC-103 → SC-102 → SC-101**, revised from the ticket family's assumed order with reasons:

1. **SC-103 first** — unchanged from the assumption. Smallest, self-contained, touches only
   the statblock head band + one Steel `display:none`, and it is the cleanest place to settle
   decision **S-1** (print policy) on a tiny surface before the bigger items inherit it.
2. **SC-102 second** — unchanged. It carries the **only mandatory** frozen-shot movement
   (`statblock--steel-print.png`, unavoidable via the theme-agnostic DOM change), the token
   arithmetic, and the cross-repo `D3-token-map.md` guard. Doing it before SC-101 means the
   `statblock--steel-print` delta is already sanctioned when SC-101 (under S-4) adds to it.
3. **SC-101 third** — **but it is no longer the largest** (D2: CSS-only, no DOM, no seam). It
   is placed last because its nested-frame rule is the complement of SC-102's standalone-spine
   rule (D3): "remove the spine where it does not belong" then "restyle it where it does" reads
   as one coherent diff, and both edit the same `styles-source.css` region.

**Revised size ranking (plan-time):** SC-102 > SC-101 > SC-103. The tickets assume
SC-101 > SC-102 > SC-103.

**The plan-24 `CardLayout.steel` seam is NOT reusable here.** Featureblock is a bespoke
`FeatureblockElementView extends ElementView<FeatureblockConfig>`
(`src/elements/featureblock/view.ts:55`), reached via `definition.ts:35`'s
`createView` and wrapped by `withReference` (`definition.ts:41` → `RefUnwrapView.ts:232`). It
has no `CardLayout`. `DisplayCardView`/`CardLayout` (`src/elements/shared/CardLayout.ts`, seam
at `:166`, branch at `:301-303`, `renderSteel()` at `:410`) are used **only** by
`src/elements/display/displayFamily.ts:70,142`. Porting featureblock onto the seam would be a
large refactor — and D2 makes it unnecessary. Statblock is likewise a bespoke view. **No task
in this plan touches the seam.**

## Frozen-shot impact map

The freeze baseline is **107** lines: `*--legacy-{dark,light}.png` + `*--steel-print.png`.
`*--steel-{dark,light}.png` are **not** frozen and change freely.

| item | frozen shots moved — **S-1 = "print follows structure"** (recommended) | frozen shots moved — **S-1 = "print stays"** |
|---|---|---|
| **SC-103** | `statblock--steel-print.png` | *(none)* |
| **SC-102** | `statblock--steel-print.png` **(mandatory, unavoidable)** · `feature--steel-print.png` (standalone-spine removal) | `statblock--steel-print.png` **(mandatory)** |
| **SC-101** | `featureblock--steel-print.png` · `featureblock-advancement--steel-print.png` · `statblock--steel-print.png` *(only if S-4 = shared nested rule)* | *(none)* |
| **union to rebaseline** | **4 lines**: `statblock--steel-print.png`, `feature--steel-print.png`, `featureblock--steel-print.png`, `featureblock-advancement--steel-print.png` | **1 line**: `statblock--steel-print.png` |

**Must NOT move, in either policy — any movement is a leak, fix the selector, never the baseline:**
`statblock--legacy-{dark,light}.png`, `feature--legacy-{dark,light}.png`,
`featureblock--legacy-{dark,light}.png`, `featureblock-advancement--legacy-{dark,light}.png`,
`kit--legacy-{dark,light}.png`, `kit--steel-print.png`, and all 90-odd other frozen lines.

**Why `kit--steel-print.png` is safe:** kit's Steel composition renders its signature ability
through `renderFeatureList` ⇒ `.dse-feature__nested > .dse-feature`, which is **not** inside
`.dse-sb`/`.dse-fb` and **not** under `[data-dse-element='feature']`. Both new selector families
miss it by construction. **Verify this explicitly** (SC-101 Task, Step 4) — it is the single
most likely accidental-reach in the plan.

**Freeze count stays 107** unless Scott takes **S-5** (new standalone villain fixture), which
is an **additions-only widening to 110** — `feature-villain--legacy-{dark,light}.png` +
`feature-villain--steel-print.png`, per the dse-verify skill's widening procedure (append
lines, never reorder, bump the two literal count strings in `check-freeze.sh`).

## Interaction with the guards branch (conflict note for the lander)

The `guards` worktree (`/home/scott/code/steelCompendium/worktrees/guards`) is retargeting the
parity pairs in parallel — closing FOLLOWUPS #39/#40, i.e. the 10 documented WARNs, potentially
landing `0 GAP / 0 WARN + declared`. Its `draw-steel-elements` submodule was still at `f09f6cc`
(no commits yet) when this plan was written.

1. **Textual conflict is likely.** Both branches edit `styles-source.css` and
   `visual-harness/parity/selector-map.json`. Whichever lands second rebases.
2. **Semantic conflict is the real risk.** #39/#40's fixes add pairs — `.fb-wrap`/`.sb-wrap`
   block-margin pairs and `section-tag`/`pr-chars` like-for-like pairs. If guards *also* adds a
   pair on the **nested feature card** (site `.sb__feat`/`.fb__feat` ↔ plugin
   `.dse-sb/.dse-fb .dse-feature__nested > .dse-feature`), then SC-101's nested frame (D3) moves
   that pair's read — **in the correct direction**, toward the site. A newly-retargeted pair
   could go GAP→clean or clean→GAP depending on land order.
3. **Mitigation, both directions:** whoever lands second re-runs `npm run parity` **after** the
   rebase, not before, and reports the number against the *other* branch's declared expectation
   — not against this plan's `0/10`. This plan's Task 7 (final integration) owns that re-check.
4. **Do not "fix" a parity number by editing `expectedGaps`.** `diff.mjs` refuses to run unless
   every entry carries a workspace FOLLOWUPS number; a new deferral needs its own filed number.

---

## Scott decisions

**All five are open. S-1, S-3 and S-4 gate execution; S-2 and S-5 can be answered at the
task boundary.** Post them as ONE decision comment on SC-97 (with SC-101/102/103 linked), per
linear-flow: In Progress + `Needs Review`, options inline with the trade-offs beside them.

### S-1 — Does Steel **print** follow the structural convergence, or stay as it is? (cross-cutting; gates all three)

Print is a pure CSS attribute over the Steel DOM. Every CSS rule in this plan can be scoped to
reach print or not. The question is a policy, not three separate calls.

- **(a) Print follows structure; material stays screen-only. (RECOMMENDED.)** Placement, gaps,
  padding and which node draws what apply in print; backgrounds/sheen/shadows keep the
  `:not([data-dse-print="on"])` guard so print stays flat and ink-economical per the D3 print
  spec. Screen and print then describe the *same* card. **Cost: 4 sanctioned rebaseline lines.**
- **(b) Print stays as-is.** Everything takes the print guard. **Cost: 1 rebaseline line**
  (SC-102's is unavoidable). **Price:** a printed Steel featureblock keeps the chip cost and the
  fused rail while the screen shows display-text costs and discrete bars; a printed statblock
  keeps the notch under the characteristics strip while the screen has it under the head band.
  That is a structural divergence between two renderings of the same card, which the codebase
  has so far never had (print has only ever differed in *material*).

*Recommendation: (a).* The precedent it extends is plan 24's — SC-100 accepted a sanctioned
`kit--steel-print` rebaseline precisely so print would render the new Steel *structure* flat
rather than render the old structure.

### S-2 — SC-103: how faithful to the site's notch? (taste)

The site's is **9px, `var(--role)`-hued, straddling the band's bottom border, halo by two outer
`box-shadow` rings, no flanking lines**. The plugin's `.dse-hr` is **14px, neutral
`var(--dse-rule)`, flanked by two fade lines, halo by an `inset` ring** (D4).

- **(a) Full site fidelity (RECOMMENDED):** under Steel, hide `.dse-sb > .dse-hr` entirely and
  paint a 9px role-hued `::after` on the head band. Matches the site exactly, including the site
  having **no** chars↔features divider.
- **(b) Move only:** keep the existing 14px neutral `.dse-hr` look but relocate it under the
  band. Less churn, but it then reads as a *divider* on a band edge rather than the site's
  *notch*, and it keeps a neutral hue where the site keys the role.

*Note:* (a) removes a visual separator between the characteristics strip and the feature list.
Confirm in the after-shots that the features still read as a distinct section (the Steel gutter
rule `styles-source.css:4979-4983` and the feature frames from SC-101/S-4 should carry it).

### S-3 — SC-102: the `--dse-act-villain` hue, and its light/print twin (taste; D7)

There is no `--sc-act-villain` in the site palette; the site reuses `#e0584b`
(`--sc-role-controller`).

- **(a) Site-exact, light/dark stable:** `#e0584b` in both Steel blocks and both print blocks.
  Maximum site fidelity; **breaks the act-block convention** (every other `act-*` token has a
  darkened light twin) and may read weak on white.
- **(b) Site hue dark + darkened light twin (RECOMMENDED):** `#e0584b` dark; `#b03a2e`
  (or Scott's pick) for Steel-light and both print blocks — consistent with
  `act-main #e74c3c → #c0392b`, `act-move #e8a13a → #b9770e`, etc.
- **(c) Differentiate from main-action red.** Per D7, `#e0584b` (villain) vs `#e74c3c` (main)
  are near-indistinguishable on a 3px spine. If Scott wants them separable, villain wants a
  distinctly darker/deeper red (e.g. `#922b21`, which is the site's own
  `--sc-ability-villain` dark value, `palette.css:73`) — a deliberate, documented divergence
  from the site's statblock literal. **This is the one place where site-fidelity and legibility
  actually conflict; flag it in the decision comment with the two swatches side by side.**

Also in scope: **the villain crest icon.** `crestIconFor()` (`renderFeature.ts:99-116`) is the
only exhaustive switch over `ActionType`; today's Lucide names are `main→sword`,
`maneuver→user`, `triggered→zap`, `move→footprints`, `none→circle-dashed`, `trait→star`.
Proposed: **`villain→skull`** (the site's classifier glyph is ☠,
`v2/docs/javascripts/ability-cards.js:22`). Alternative: `crown`.

### S-4 — SC-101: is the nested-card frame shared with the statblock, or featureblock-only? (scope; D3)

- **(a) Shared — one rule for `:is(.dse-sb, .dse-fb)` (RECOMMENDED).** Matches the site exactly
  (byte-identical declarations in both its sheets, D3) and keeps the plugin internally
  consistent. **Cost:** adds `statblock--steel-print.png` to SC-101's blast radius — which
  SC-102 already moves, so under S-1(a) the union is unchanged at 4 lines and the statblock's
  after-shots simply need to be reviewed once for both items.
- **(b) Featureblock-only.** Strictly the ticket's letter. Leaves the plugin's statblock
  features fused while its featureblocks are framed — an inconsistency the site does not have,
  and a near-certain follow-up ticket.

### S-5 — SC-102: add a standalone `feature-villain` harness fixture? (coverage; D5)

The `feature` fixture is a **false** villain (D5) and cannot be corrected in place (it is the D9
single-sourced authoring example and its legacy shots are frozen). So today the villain path is
proven **only** inside the statblock fixture.

- **(a) Add it (RECOMMENDED).** A harness-local `feature: { default, villain }` variant,
  exactly the SC-108 pattern (`entry.ts:73-101`). New shot names are invisible to the freeze
  check by construction; optionally widen the baseline **107 → 110** to pin them. Gives the
  standalone villain card (crest + tinting + **no** spine, per D3) its own golden PNG.
- **(b) Skip.** Statblock coverage only; the standalone villain card ships unshot.

---

## Task 1: Recon, baselines, and "before" evidence

**Files:** none modified (worktree setup + captures only).

- [ ] **Step 1: Worktree + baseline gates.** `just wt-new sc10x-structural`, `npm ci`, then run
  the full dse-verify battery **untouched** and record the REAL numbers at this commit (tsc,
  jest suites/tests, shots count, freeze `N/107`, parity GAP/WARN/exit). These are the
  regression floor. If freeze is not `107/107`, STOP and reconcile before writing any code.
- [ ] **Step 2: Re-verify every load-bearing fact** in §"Plan-time discoveries" against the
  worktree commit — D1 (the `featureblock-advancement` fixture at `entry.ts:73-101,151`),
  D2 (`.dse-head` grid at `styles-source.css:6039-6075`; `rightDeck` never passed at
  `renderFeature.ts:213-224`), D3 (the three site selectors), D4 (`divider.ts:36-44`,
  `statblock/view.ts:272`, the unguarded `.dse-hr` CSS, `data-dse-role="leader"` on the
  fixture), D5/D6 (the two example.yaml files), D7 (the palette values). **If any has moved,
  STOP and update this plan before writing code.**
- [ ] **Step 3: Capture the "before" set.** `npm run shots`, then keep:
  `statblock--steel-{dark,light,print}.png`, `statblock--legacy-dark.png`,
  `feature--steel-{dark,light,print}.png`, `featureblock--steel-{dark,light,print}.png`,
  `featureblock-advancement--steel-{dark,light}.png`.
- [ ] **Step 4: Capture the site design references — BOTH schemes** (dse-verify skill, Scott's
  rule 2026-08-03: dark carries design features light lacks, and dark is the reference he
  reviews against). A monster statblock page (head band + notch + villain-action band + framed
  features) and a malice featureblock page (option cost as display text + per-option bars), in
  dark **and** light. Use `npm run shot-url` per the harness README.
- [ ] **Step 5: Post the baselines** per linear-flow. Per-ticket **root attachments** with
  state-naming titles ("Baseline — statblock steel-dark", "Design reference — site featureblock
  option costs (dark)", …). Move SC-101/102/103 to **Awaiting** (an agent is actively working
  them).
- [ ] **Step 6: Post the decision comment** for §"Scott decisions" on **SC-97**, linking all
  three tickets, with the S-2/S-3 option images inline (site reference vs current plugin, and
  the S-3 swatch pair). Set SC-97 **In Progress + `Needs Review`**. **Execution of Tasks 2-5
  is blocked on S-1, S-3 and S-4.**

## Task 2: SC-103 — the statblock diamond notch

**Files:** `styles-source.css`; `test/dom/theme/` (a Steel contract test).

- [ ] **Step 1: Suppress the misplaced divider under Steel.** Scope **exactly**
  `.dse-sb > .dse-hr` — never `.dse-hr` globally (it is a shared kit primitive used by the
  featureblock at `featureblock/view.ts:133`, the condition list at `styles-source.css:1359`,
  and `ds-horizontal-rule`, all of which have their own frozen shots).
  Tier per **S-1** (this is structure). Do **not** touch `divider.ts` or `statblock/view.ts` —
  D4: the node must keep rendering in Legacy, and three test files assert it unconditionally.
- [ ] **Step 2: Paint the notch on the head band.** Add `position: relative` to
  `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-sb[data-dse-role] > .dse-head`
  (`styles-source.css:5008-5030`) — or to a new structure-tier twin if S-1(a) requires the
  positioning to reach print — plus an `::after` porting `steel-statblock.css:97-103`:
  `content:""; position:absolute; left:50%; bottom:0; width:9px; height:9px;
  transform: translate(-50%,50%) rotate(45deg); background: var(--dse-role);
  box-shadow: 0 0 0 4px var(--dse-surface), 0 0 0 5px color-mix(in srgb, var(--dse-role) 40%,
  var(--dse-surface))`. `--dse-surface` is the plugin's stand-in for the site's
  `--sb-plate-solid` — the same substitution the band rule above already documents at
  `styles-source.css:5000-5007`. Honour S-2.
  **Support floor:** `color-mix()` needs the same `@supports`/fallback discipline the band rule
  uses (SC-121 M-1; `test/unit/build/cssSupportFloor.test.ts` enforces it). Give the halo a
  flat-hue first declaration before the `color-mix` one, exactly as the band does.
- [ ] **Step 3: Decide the featureblock twin.** The featureblock has the identical band
  (`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-fb > .dse-head`,
  `styles-source.css:5050-5063`) and the site gives it the identical notch
  (`.fb__head::after`, `steel-featureblock.css:65-69`), and the featureblock *also* renders a
  `.dse-hr` (`featureblock/view.ts:133`). **This is in SC-101's family, not SC-103's** — but it
  is the same two rules. Implement it here **only if** S-4 = (a) (shared-rule posture);
  otherwise leave it and note it in the SC-101 evidence comment. Either way it adds
  `featureblock--steel-print.png` + `featureblock-advancement--steel-print.png` to the union
  only under S-1(a) — which SC-101 already moves under S-1(a). Record the choice.
- [ ] **Step 4: Contract test.** Extend `test/dom/theme/steelMaterial.test.ts` (or a sibling):
  under `steel`, `.dse-sb > .dse-hr` is suppressed and the band carries the notch; under
  `legacy`, the `.dse-hr` node **and** its computed visibility are unchanged and the band has no
  `::after`. Prove it can fail (break the scope, watch it fail, restore).
- [ ] **Step 5: Gates.** tsc · jest · `npm run shots` · freeze — expected **`106/107`, sole
  mismatch `statblock--steel-print.png`** under S-1(a), or **`107/107`** under S-1(b). Any other
  mismatch is a leak: narrow the selector, never touch the baseline.
- [ ] **Step 6: Evidence + gate comment on SC-103.** Inline before/after pairs (steel-dark,
  steel-light, steel-print, plus the legacy-unchanged proof) in one narrating comment, with the
  freeze statement and the pending-rebaseline procedure. Set **In Progress + `Needs Review`**.

```bash
git add styles-source.css test/
git commit -m "fix(steel): move the statblock diamond notch to the head band (SC-103)"
```

## Task 3: SC-102 part 1 — the `villain` ActionType

**Files:** `src/elements/feature/renderFeature.ts`; `src/framework/tokens.ts`;
`styles-source.css`; six test files; **workspace `docs/superpowers/dse-overhaul/D3-token-map.md`**.

- [ ] **Step 1: Fix `actionTypeOf` — the `usage: "-"` shadow, then the villain branch.**
  `src/elements/feature/renderFeature.ts:77-89`. Line 79 uses `??`, so the truthy placeholder
  string `"-"` short-circuits and `ability_type` is never read. Treat a dash-only/blank `usage`
  as **absent**, then match villain **before** the generic `action` catch-all — `"Villain Action
  1"` contains `"action"`, so a villain branch placed after line 87 is dead code. Add
  `'villain'` to the `ActionType` union at `:48` and a `villain → <icon>` arm to
  `crestIconFor()` at `:99-116` (S-3).
  **Do not otherwise change precedence:** `usage` must keep winning over `ability_type` when it
  is a real value, or the `feature` fixture flips (D5) and `feature--*` shots move for the wrong
  reason. Also confirm `Feature.isTrait()` still excludes villain cards — it is
  `(!keywords || !keywords.length) && !usage && !distance && !target`
  (`node_modules/steel-compendium-sdk/dist/model/Feature.js:50-52`); with `usage: "-"` truthy it
  does, but the dash-fix must **not** be applied inside `isTrait`.
- [ ] **Step 2: The token, across all five blocks + both guards.** Declare `'act-villain'` in
  `src/framework/tokens.ts:96-102`, then add a value to **every** block:
  1. Legacy base `:root` — `styles-source.css:3152-3160` → **must be `none`**
     (`test/dom/kit/tokens.test.ts:139` iterates every `act-*` token and asserts `none`).
  2. Steel dark — `styles-source.css:3378-3383`.
  3. Steel light — `styles-source.css:5736-5741`.
  4. `@media print` Steel — `styles-source.css:6554-6559`.
  5. Print-preview twin — `styles-source.css:6563-6568`.
  Leave the **neutral** print block (`:6493`ff) alone — `test/dom/framework/theme-print.test.ts:176`
  asserts `act-*` is absent there.
  **Token-guard arithmetic — every hard-coded count (75 → 76 overall):**
  | file:line | change |
  |---|---|
  | `test/dom/kit/tokens.test.ts:76` | `75` → `76` (+ the arithmetic comment at `:68-75`, "6 actions" → 7) |
  | `test/dom/framework/theme-steel.test.ts:249` | `67` → `68` |
  | `test/dom/framework/theme-steel.test.ts:411-412` | `34` → `35` (both assertions) |
  | `test/dom/framework/theme-steel.test.ts:171-176` | add `act-villain` to the `STEEL_DARK` literal map |
  | `test/dom/framework/theme-steel.test.ts:360-365` | add `act-villain` to the `STEEL_LIGHT` literal map |
  | `test/dom/framework/theme-print.test.ts:186` | `6` → `7` ("the Steel-scoped twin darkens the 6 act spines") |
  | `test/dom/framework/theme-print.test.ts:127-135` | add `act-villain` to the `PRINT_STEEL` literal map |
  | `test/dom/framework/token-coverage.test.ts:290` | `67` → `68` |
  | `test/dom/framework/token-coverage.test.ts:300` | `53` → `54` |
  | `test/dom/framework/token-coverage.test.ts:259-264` | add `'act-villain': 'none'` to `LEGACY_MAP` |
  Unchanged: `theme-steel.test.ts:250` (8), `token-coverage.test.ts:291` (8), `:307` (22),
  `theme-print.test.ts:174` (47). Derived and self-correcting: `token-coverage.test.ts:308,333`.
  **⚠ THE CROSS-REPO GUARD:** `test/dom/framework/token-coverage.test.ts:75` asserts
  `rows.length === DSE_TOKEN_NAMES.length` against the **workspace superproject** file
  `docs/superpowers/dse-overhaul/D3-token-map.md` (resolution candidates at
  `token-coverage.test.ts:22-26`; overridable via `DSE_TOKEN_MAP_PATH`). That doc has **75**
  `| `--dse-<name>` |` rows today, the `act-*` rows at lines 299-304. **Add a
  `--dse-act-villain` row with its Legacy / Steel / Steel-light / Print columns** or jest fails
  in the submodule because of a superproject file. This is a superproject edit — commit it
  separately (Task 6).
- [ ] **Step 3: The legacy no-op proof.** The DOM now gains `data-dse-act="villain"` +
  `--dse-act` + a crest node on the statblock fixture's three villain cards (D6). Argue AND
  measure that Legacy is unaffected: the spine is `background: var(--dse-act, none)` on an
  absolutely-positioned `::before` (no layout), `--dse-act-villain: none` in Legacy, and the
  crest is `display: none` in the Legacy base. **The freeze gate is the proof** —
  `statblock--legacy-{dark,light}.png` must stay byte-identical. If either moves, the crest is
  taking grid space or a base rule keys off `[data-dse-act]`; fix the scoping, do not rebaseline.
- [ ] **Step 4: Tests.** Extend the act-mapping table at `test/dom/elements/feature.test.ts:483-497`
  (6 rows → 7). **Update `feature.test.ts:294-300`** — the "lone-dash Keywords/Type ⇒ `--empty`"
  test builds a `usage: "-"` card that will now gain `data-dse-act="villain"`; adjust the
  assertion deliberately, do not delete it. `feature.test.ts:504-511` (`usage: Gibberish ritual`
  ⇒ nothing set) survives unchanged — confirm. Add statblock DOM assertions that the three
  villain abilities carry `data-dse-act="villain"` and a crest
  (`test/dom/elements/statblock.test.ts`, whose fixture `test/fixtures/statblock/human-bandit-chief.yaml:97,110,125`
  already has the data).
- [ ] **Step 5: Gates.** tsc · jest · `npm run shots` · freeze — expected **`106/107`, sole
  mismatch `statblock--steel-print.png`** (cumulative with Task 2, which moves the same file).
  Read `statblock--steel-{dark,light}.png`: the three villain cards must now show the spine +
  crest, and check the lane padding
  (`styles-source.css:3392`, `[data-dse-theme='steel'] .dse-feature[data-dse-act] { padding-left:
  calc(3px + 0.55em) }` — **no print guard**, so it reaches print) has not misaligned anything.
- [ ] **Step 6: Check `SettingsPreview`.** `src/views/SettingsPreview.ts:115,128,143` renders the
  same three villain actions in the settings tab's live preview; it will visibly gain spines and
  crests. Confirm it still fits (obsidian-shots if a display is available; otherwise inspect the
  DOM and say so honestly).

```bash
git add src/elements/feature/renderFeature.ts src/framework/tokens.ts styles-source.css test/
git commit -m "fix(feature): map villain actions to their own action type (SC-102)"
```

## Task 4: SC-102 part 2 — the spine is a nested frame, not a standalone ornament

**Files:** `styles-source.css`; `test/dom/theme/`. *(Optional per S-5: `visual-harness/entry.ts`.)*

- [ ] **Step 1: Remove the standalone spine under Steel.** Per D3 the site's `.sc-ability`
  carries **no** `border-left`; `--act` only tints the crest glyph
  (`steel-ability-cards.css:87`), the eyebrow (`:94`) and a 7px diamond (`:95`). Suppress
  `.dse-feature[data-dse-act]::before` **only** in the standalone context — the discriminator
  is the pipeline root attribute `[data-dse-element='feature']`, present on a standalone card
  and never on a nested one (`styles-source.css:74`). Also drop the reserved lane
  (`styles-source.css:3392`'s `padding-left`) in that context, or the card keeps a 3px gutter
  with nothing in it. Tier per S-1.
  **Keep the `--act` tinting** — do not remove the accent, only the bar. If the plugin's crest
  or eyebrow does not currently take `--dse-act`, note the gap rather than inventing it here.
- [ ] **Step 2 (optional, S-5): the standalone villain fixture.** Add
  `feature: { default: featureDefault, villain: featureVillain }` to `visual-harness/entry.ts`
  with a harness-local literal following the SC-108 pattern (`entry.ts:67-101`) — an
  `ability_type: Villain Action 1` card with **no `usage`** so it maps through the new branch.
  New shot names (`feature-villain--*`) cannot collide with a frozen name, so the freeze check
  is unaffected until the baseline is deliberately widened 107 → 110 (dse-verify widening
  procedure: append, never reorder, bump the two literal counts in `check-freeze.sh`).
- [ ] **Step 3: Contract test.** Under `steel`, a standalone `[data-dse-element='feature']` card
  draws no spine while a `.dse-sb`-nested card does; under `legacy`, both are unchanged. Prove
  it can fail.
- [ ] **Step 4: Gates.** tsc · jest · `npm run shots` · freeze — expected **`105/107`** under
  S-1(a) (`statblock--steel-print.png` + `feature--steel-print.png`), or **`106/107`** under
  S-1(b). Read `feature--steel-{dark,light}.png` against the site's standalone card reference.
- [ ] **Step 5: Evidence + gate comment on SC-102.** One narrating comment with inline
  before/after pairs for BOTH halves: the villain actions lighting up inside the statblock
  (Task 3) and the standalone card losing its spine (this task), plus the legacy-unchanged
  proof and the freeze statement. Set **In Progress + `Needs Review`**.
  **State explicitly** that band-vs-inline villain *grouping* is NOT in this change — see the
  §"Deferred: the villain band" note below — so Scott reviews what is actually there.

```bash
git add styles-source.css visual-harness/entry.ts test/
git commit -m "fix(steel): the action spine is a nested-card frame, not a standalone ornament (SC-102)"
```

## Task 5: SC-101 — featureblock option cost + per-option bars

**Files:** `styles-source.css`; `test/dom/theme/`. **No TS.**

- [ ] **Step 1: The nested-card frame (the "per-option bars").** Port
  `[data-fb-featstyle="card"] .fb__feat` / `[data-sb-featstyle="card"] .sb__feat`
  (byte-identical, D3) onto `.dse-feature__nested > .dse-feature` scoped by S-4's answer —
  `:is(.dse-sb, .dse-fb)` under (a), `.dse-fb` only under (b):
  - **structure tier:** a real gap on the list (site `.fb__feats { gap: .65rem }`,
    `steel-featureblock.css:122`) replacing today's padding-only rhythm
    (`styles-source.css:184-192`), plus `border-radius: 9px` and
    `padding: .7rem .85rem .78rem`;
  - **material tier (always `:not([data-dse-print="on"])`):** `background: rgba(0,0,0,.16)`
    dark / `rgba(0,0,0,.022)` light. **Use translucent black, NOT `--dse-surface-sunken`** —
    SC-100's dark-mode material finding (plugin `.repo-docs/architecture.md`, "Dark-mode
    material rule"): the site's richness is the parent card's gradient bleeding through a
    translucent-black fill, and the sunken white wash occludes it.
  The spine `::before` (`styles-source.css:57-68`) stays as the bar; give it a matching
  left-side radius (or let the card's `border-radius` + a clip do it) so each bar reads as
  discrete. **Fail-safe caveat:** an option whose action type does not map gets **no**
  `[data-dse-act]` and no spine (`renderFeature.ts:167-173`). Key the *frame* on `.dse-feature`
  and the *bar* on `[data-dse-act]`, so an unmapped option gets a frame with no bar — matching
  the site, which always frames and lets `--act` fall back.
- [ ] **Step 2: The option cost as display text.** Re-place and restyle the cost slot in CSS
  only (D2), scoped to the featureblock context so statblock/standalone cost chips keep the
  site's forged pill (`.sb__feat-corner .sc-ability__cost`, `steel-statblock.css:338` — the site
  itself keeps the pill in statblocks and uses the mini only in featureblocks):
  - move `.dse-head__eyebrow--right` from `grid-area: 1 / 3` to the primary row and
    `.dse-head__primary--right` down to the deck row (`styles-source.css:6067-6075`);
  - strip the chip chrome from the cost (`styles-source.css:6111-6122` base +
    `:4021-4027` the Steel forged-chip rule) and restyle it as the site's
    `.sc-head__slot--mini` (`steel-cardhead.css:111-114`): `font-family: var(--dse-font-title);
    text-transform: uppercase; font-size: 1.35em; line-height: 1.04; color: var(--dse-role,
    var(--dse-heading))`. **Match the px/em target, not the site's rem literal** — the site's
    rem base is 20px, the plugin's 16px (gap inventory §A).
  - fix `align-self` for both moved slots (the eyebrow row has none; the primary row has
    `align-self: center`), and confirm the rule degrades when `ability_type` is absent (the
    featureblock `default` fixture's three options have none, D2).
- [ ] **Step 3: Featureblock notch twin,** if deferred from Task 2 Step 3 and S-4 = (a).
- [ ] **Step 4: The `kit--steel-print.png` non-reach proof.** Kit's Steel composition renders
  its signature ability through `renderFeatureList` ⇒ `.dse-feature__nested > .dse-feature`,
  which is neither inside `.dse-sb`/`.dse-fb` nor under `[data-dse-element='feature']`. **Assert
  this, don't assume it:** a contract test that a kit card's nested feature gets no frame and no
  cost re-placement, plus the freeze gate showing `kit--steel-print.png` unmoved.
- [ ] **Step 5: Contract tests.** Under `steel`: a featureblock option's cost renders as
  display text (not a chip) on the primary row; consecutive options are separated (non-zero
  gap) and each carries its own frame; under `legacy`, the featureblock DOM and computed styles
  are unchanged. Prove each can fail.
- [ ] **Step 6: Gates.** tsc · jest · `npm run shots` · freeze — under S-1(a) + S-4(a) expected
  **`103/107`**, mismatches exactly `statblock--steel-print.png`, `feature--steel-print.png`,
  `featureblock--steel-print.png`, `featureblock-advancement--steel-print.png`; under S-1(b)
  expected **`106/107`**, sole mismatch `statblock--steel-print.png`. **Anything else is a
  leak.** Then `npm run parity` LAST.
- [ ] **Step 7: Evidence + gate comment on SC-101**, inline before/after for steel-dark,
  steel-light, steel-print, the advancement fixture, and the legacy-unchanged proof. Set
  **In Progress + `Needs Review`**.

```bash
git add styles-source.css test/
git commit -m "feat(steel): featureblock option cost as display text + per-option accent bars (SC-101)"
```

## Task 6: Docs, tickets, and wrap

**Files:** plugin `.repo-docs/architecture.md` + `CHANGELOG.md`; workspace `CHANGELOG.md`,
`FOLLOWUPS.md`, `docs/superpowers/dse-overhaul/2026-07-23-steel-ui-gap-inventory.md`,
`docs/superpowers/dse-overhaul/D3-token-map.md`, `.claude/skills/dse-verify/SKILL.md`, this
plan file; Linear.

- [ ] **Step 1: `D3-token-map.md`** — the `--dse-act-villain` row (already required by Task 3
  Step 2 for jest to pass; this step is the superproject **commit**, separate from the
  submodule commits).
- [ ] **Step 2: Document the convergence** in the plugin's `.repo-docs/architecture.md`: "the
  action spine is a nested-card frame, not a standalone ornament" (D3), with the three
  contexts and their selectors — this is the rule a future contributor will otherwise
  re-break. Add the `villain` ActionType to whatever enumerates the vocabulary.
- [ ] **Step 3: dse-verify skill** — append the dated sanctioned-rebaseline entries (one per
  file actually rebaselined, with its ticket) to the freeze section, and, if S-5(a) was taken,
  the 107 → 110 widening entry.
- [ ] **Step 4: Ticket hygiene.** **Edit SC-101's description to strike the stale #37 paragraph
  (D1)** — SC-108 closed it 2026-08-02. Close FOLLOWUPS #33/#34/#35 (dated, `**Status:** done`).
  Update the gap inventory §B: strike the featureblock / feature-spine / statblock-notch bullets
  and record the D2/D3/D4 findings (§B was written pre-SC-108 and assumes all three need DOM).
- [ ] **Step 5: File the follow-ups** — take numbers from `FOLLOWUPS.md`'s `<!-- next-id: 51 -->`
  counter, bumping it each time:
  - **`src/elements/feature/example.yaml` is a false villain** (D5): `:5` says
    `ability_type: Villain Action 1`, `:10` says `usage: Main action`. Semantically wrong demo
    data; cannot be fixed in place (D9 single-source + frozen legacy shots), so it needs a
    deliberate call (change the data and rebaseline `feature--legacy-*`, or change the
    `ability_type` to match the usage).
  - **Villain-action *grouping*** — see below.
  - Anything Task 1 Step 2's re-verification turned up.
- [ ] **Step 6: Changelogs.** Plugin + workspace `CHANGELOG.md` under Unreleased, user-facing:
  villain actions now render with their own accent and crest; featureblock options read as
  separate cards with display-text costs; the statblock's diamond notch sits on the head band;
  standalone ability cards no longer carry a left spine.
- [ ] **Step 7: Commits.** Submodule docs in the worktree; superproject docs as their own
  commit. **No pointer bump, no push, no landing** — stop per §Execution.

## Task 7: Final integration re-check (run LAST, after any rebase)

- [ ] **Step 1: Rebase onto whatever landed** from the `guards` branch, then re-run the full
  battery — **parity last, and read the number against the guards branch's declared
  expectation, not this plan's `0/10`** (§"Interaction with the guards branch").
- [ ] **Step 2: If a parity pair legitimately changed its read** because of this plan's DOM/CSS
  work, that is a selector-map / deferral conversation per dse-verify — **not** a silent number
  bump and **not** an `expectedGaps` edit (`diff.mjs` refuses entries without a filed FOLLOWUPS
  number).
- [ ] **Step 3: Consolidated rebaseline request.** Post one comment on **SC-97** listing every
  frozen file to be rebaselined with its owning ticket and Scott's per-ticket approval link, so
  the landing agent applies the union in one pass with one dated sign-off block.

---

## Deferred: the villain **band** (grouping), and its relationship to SC-123

**Not in this plan.** Recorded here because it is the obvious next question when Scott sees the
after-shots.

**Verified site behaviour.** The site's default is **banded**:
`v2/docs/javascripts/settings-panel.js:30-33` — `SB_DEFAULTS = { …, villain: "banded", … }` —
and the `steel` preset (`:36`), which is the plugin's reference look, also sets
`villain: "banded"`. `inline` is the *other* option
(`[data-sb-villain="inline"]`, `steel-statblock.css:474-477`, which unwraps the band).

**What banded actually is.** A collapsible `<details>` grouping villain actions into their own
section: `.sb__band--villain` (`steel-statblock.css:403-421,434-449`) with
`background: color-mix(in srgb, #e0584b 6%, transparent)`, a `summary.sb__band-head` carrying a
crest, a `DrawSteelGlyphs` glyph, an uppercase title and a rotating chevron, over a
`.sb__band-body` flex column.

**Why it is deferred rather than built now.**

1. **The plugin has no band concept at all.** `grep -rn 'malice\|band' src/elements/statblock/*.ts`
   returns one comment. Villain actions render as ordinary siblings in the feature list. Banding
   means new grouping logic in `renderFeatures`, a band head, and print-open behaviour — a much
   larger DOM change than SC-102's title ("standalone card action spine") describes, and it
   would swamp the review surface of the three items this plan exists to close.
2. **It is literally a setting in SC-123.** SC-123's 18-setting inventory names `villain`
   (banded vs inline) explicitly and says *"`villain` should sequence with SC-102 (shares the
   new action-type work)"*. This plan **delivers that shared work** — the `villain` ActionType,
   the token, the hue, the crest — which is exactly what SC-123 needs to implement both
   presentations plus the pref. Building only the default presentation here would pre-empt
   SC-123's design and still leave the pref unbuilt.
3. **The infrastructure already exists**, so the deferral is cheap: `.dse-collapse` is a shipped
   primitive (`.dse-collapse__header` / `__region` / `__chevron`), and print already forces
   collapsed regions open — `[data-dse-print="on"] .dse-collapse__region[hidden] { display:
   block !important }` (`styles-source.css:6623-6624`).

**Recommendation:** file the band as a FOLLOWUPS item (Task 6 Step 5) linked from both SC-102
and SC-123, and **do not** ship a `data-dse-sb-villain` attribute in this plan. Shipping the
attr with only one presentation implemented would make the attribute a lie: its site-default
value is `banded`, and `banded` would not render. When SC-123 builds it, the attr and both
presentations arrive together — and SC-123 owns whether it is 7.0.0-blocking. **If Scott wants
banded inside 7.0.0, it should be its own plan against this plan's landed action-type work, not
a fourth task bolted onto this one.**

---

## Self-review

**Spec coverage.** SC-103 → Task 2 (+ S-2). SC-102's original ask (#34, standalone spine) →
Task 4 Step 1; SC-102's routed-in villain root-cause (SC-121 Batch 3, catalog B-4) → Task 3
(the `usage: "-"` shadow at `renderFeature.ts:79`, the `villain` ActionType, `--dse-act-villain`
across all 5 token blocks with the full guard arithmetic, the crest); the band-vs-inline
presentation question → answered, verified, and explicitly deferred with reasons (§"Deferred").
SC-101 → Task 5 (option cost as display text, per-option bars) with the #37 claim verified and
refuted (D1). Freeze discipline → §"Global constraints" + a per-task expected number + the
impact map. Parity → Task 7 + the guards conflict note. Scott sanction rounds → one gate comment
per item (Tasks 2/4/5, batched per ticket) + a consolidated rebaseline request at Task 7.

**Verified-against-code.** Every file:line in this plan was read at `f09f6cc`. Four claims in the
tickets / the (dated) gap inventory are corrected in-plan: **D1** the #37 fixture exists
(SC-108, 2026-08-02; freeze already widened to include it); **D2** SC-101 needs no DOM;
**D3** SC-101 and SC-102 are one site rule on complementary selectors; **D4** the notch is a
theme-agnostic DOM node, so SC-103 cannot move it in TS. The site side was read from the real
sheets (`steel-statblock.css`, `steel-featureblock.css`, `steel-ability-cards.css`,
`steel-cardhead.css`, `palette.css`), the real generator
(`steel-etl/internal/site/featureblock_page.go`, `card_head.go`) and the real defaults
(`settings-panel.js`), not from memory.

**Known risks.**
1. **SC-102's legacy no-op is argued, not yet measured.** A new `data-dse-act` value and a crest
   node land in the theme-agnostic DOM; `statblock--legacy-{dark,light}.png` staying
   byte-identical is the *only* real proof (Task 3 Step 3). If the crest takes grid space in
   Legacy, this becomes a scoping problem to solve, not a rebaseline to request.
2. **SC-101's grid re-placement is the least-certain mechanic.** It relies on `.dse-head` being
   a real grid with explicit `grid-area` per slot and on the deck row being free. Both were
   verified, but the `ability_type`-present case (statblock abilities) is a different occupancy
   than the featureblock fixture's. If it proves fragile, fall back to restyling the cost
   **in place** on the eyebrow row (display text, no chip chrome) and report the residual
   row-position divergence for Scott's call — **do not** relocate the slot in
   `renderFeature.ts`, which would move six frozen legacy shots.
3. **`kit--steel-print.png` is the most likely accidental reach** — hence an explicit non-reach
   proof (Task 5 Step 4) rather than a hope.
4. **The `guards` branch will conflict**, textually in `styles-source.css` and semantically in
   the parity pairs. Task 7 owns the re-check; land order decides who rebases.
5. **No parity-gate coverage exists for any of these three surfaces.** The shot-read plus
   Scott's `Needs Review` are the visual authority here — stated honestly rather than implied
   by a green gate.

# SC-169 spec + prototype — worktree report

**Status:** COMPLETE (spec + working prototype + evidence + Linear post). Not a rollout.
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc169-menu-panel/draw-steel-elements`
**Branch:** `sc169-menu-panel`, rebased onto `origin/develop` = `e7442f2` (contains `a2fc374`).
**Final sha:** `1ac671a1b4024802d4de6451ef0d9861fb264554` (single commit, no AI attribution).
**Superproject pointer:** unstaged (`M draw-steel-elements` in `worktrees/sc169-menu-panel`).
**Freeze baseline:** NOT touched. Shared main checkout: NOT touched. Display `:1`: not used.

## Deliverables

- Spec: `draw-steel-elements/docs/superpowers/sc169-element-menu-panel-spec.md`
  (10 sections: slot API, panel shape, collapse semantics, CSS contract, mobile, print,
  prototype/evidence, open questions, rollout plan).
- Evidence PNGs (light + dark of each state, plus print):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc169/evidence/` — 13 files,
  `01-hover-panel-statblock-{dark,light}`, `02-hover-panel-hero-{dark,light}`,
  `03-stacked-ownership-{dark,light}`, `04-collapsed-trio-{dark,light}`,
  `05-mobile-{dark,light}`, `06-print-statblock-panel-absent`,
  `07-print-collapsed-prints-in-full`, `08-print-mobile-absent`.
- Linear: ONE comment on SC-169 (`3aa4ecc3-6246-49d0-82e1-4d5d0d7a9f8b`), 10 images inline,
  ownership treatment presented as titled options A/B/C. Issue state and labels UNCHANGED.

## Implementation

New: `src/framework/chrome/{types,mountChrome,collapsedKey,platform,index}.ts`.

- `ElementDefinition.chrome?: ElementChrome<M>` — presence IS the opt-in. Absent ⇒ zero DOM,
  zero attributes, zero CSS reach.
- `ElementChrome.summary(ctx) → { label, name?, detail? }` (structure, not a joined string;
  called lazily at collapse time so live models read current) + optional `items(ctx)`.
- `withReference()` LIFTS a base def's chrome through the ref wrapper (`liftChrome`), so all
  14 reference-capable elements need one slot on their base def at rollout.
- Panel is anchored to `view.authoringAnchor()` (SC-145's "visible card frame" contract),
  positioned `bottom: 100%; margin-bottom: -1px; right: .6em`, hover/focus-within revealed,
  collapse toggle kept as last child ⇒ right-to-left growth.
- For a chrome-bearing element the `authoringControls` pencil becomes a panel item; gate
  unchanged (`canPersist && !noAuthoringButton && authoringControls`).
- Reserved top-level `collapsed:` key popped in `prepareModel` (before schema validation and
  before `def.parse`, exactly like `prefs:`); user toggles in `SessionStore`
  `(host.blockKey(), "chrome.collapsed")`; never writes the note.
- `StaminaBarView` gained an `authoringAnchor()` override (its card frame is the kit
  collapsible's region, not root).
- `Platform` added to `test/mocks/obsidian-core.ts`; `setChromeMobileOverride()` is the seam.
- `mkdocs.yml`: `exclude_docs: superpowers/` — `docs/` is the PUBLISHED mkdocs source in this
  repo and has no explicit `nav:`, so an internal spec would otherwise appear as a section on
  steelcompendium.io. **Could not be validated locally (mkdocs is not in the repo devbox);
  `exclude_docs` needs mkdocs >= 1.5, and CI installs current `mkdocs-material`.**

## Prototype elements

`ds-statblock` (nested `.dse-sb` frame, `withReference`-wrapped, name summary),
`ds-hero` (root frame, `noAuthoringButton`, name summary),
`ds-stamina` (key-data summary `Stamina (31/48)`, nested anchor).

## Harness

- `visual-harness/entry.ts`: new `CHROME_SHOTS` manifest list; new params `stack=` (mount N
  elements in a column, no gallery headings), `pad=` (padding on `#mount` — the above-the-edge
  panel is otherwise clipped out of the `#mount` locator screenshot), `mobile=1`;
  `data-dse-harness-index` on each section so a stacked capture can name which element to hover;
  new fixtures `{statblock,hero,stamina-bar}/collapsed`.
- `visual-harness/shoot.mjs`: `chromeShots` loop + `opts.hover`
  (`page.locator(sel).first().hover()`, the exact opposite of the interaction shot's
  `mouse.move(0,0)` park).
- 8 new capture ids ⇒ 24 new shot names, all new ⇒ freeze baseline untouched by construction.
  A widening is optional and is a landing decision (names listed in the spec §8).

## Tests

- New `test/dom/framework/chrome.test.ts` — 25 tests across 6 sections: opt-in, panel shape,
  collapse (both layers + session + note-never-written), serializer round-trip, mobile, and a
  CSS-text print-absence gate.
- `test/dom/elements/statblock.test.ts` — the two "only control is the villain disclosure"
  claims now filter `[data-dse-chrome-item]` (framework-owned disclosures) rather than
  counting raw buttons; +1 new test pinning that the framework adds exactly collapse+expand.
- `test/dom/framework/authoringAnchor.test.ts` — the statblock case now asserts the pencil is
  a chrome PANEL item (still inside `.dse-sb`, no longer a direct child), and that there is
  exactly one pencil.

## Battery at `1ac671a` (base `e7442f2`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2758 passed / 1 skipped / 166 suites** (167 total, 1 skipped suite), 3 snapshots |
| `npm run shots` | **227**, 0 FAIL (base 203; +24 = 9 collapsed fixtures + 15 chrome shots) |
| `check-freeze.sh` | **`freeze OK (67/67 steel-print PNGs byte-identical)`**, exit 0 |
| `npm run parity` | **0 gaps / 0 undeclared warnings / 16 declared**, exit 0 |

Jest base was not independently measured at `e7442f2`; this branch adds 26 tests
(25 chrome + 1 statblock) and removes none, so the base is 2732 passed.

`npm run obsidian-shots` / `docs-shots`: NOT run (per brief — no display).

## Print invariance — why 67/67 held

1. `.dse-chrome, .dse-chrome-summary { display: none }` in the **unscoped base**; every
   revealing rule is `[data-dse-theme='steel']:not([data-dse-print="on"])`-scoped.
2. Both class names also added to the two existing print hide-lists (greppability).
3. Panel is out of flow; the only chrome that occupies layout (the mobile `margin-top`) is
   print-excluded.
4. Collapse rules are print-excluded ⇒ a collapsed element prints in FULL (matches print
   rule 3 for the kit collapsible).
5. The pencil relocation is print-invisible: `[data-dse-print="on"] .dse-btn { display: none }`
   already hid the card-corner pencil — proven by the baseline itself, where
   `statblock--steel-print.png` and `statblock-edit-btn--steel-print.png` carry the SAME sha256.

## Open questions put to Scott (Linear comment §6)

1. Ownership treatment: **A** seated tab (shipped) / **B** tucked under the card's top border /
   **C** seated tab + downward notch.
2. YAML key spelling: `collapsed:` (shipped) vs namespaced `dse_collapsed:`.
   `collapse_default:` is unusable — already means "start the inner Stamina Bar wrapper
   collapsed" on `ds-stamina`; `collapsible:` is the wrong axis.
3. `ds-stamina`'s own kit-collapsible "Stamina Bar" header is now redundant — remove at
   rollout? (Visible change + a sanctioned rebaseline of `stamina-bar--steel-print.png`.)
4. Should the panel stay reachable while collapsed (today only the expand button is)?
5. Reference bodies collapse to the reference text, not the resolved name — fix at rollout?

Two more open items live only in the spec doc (§9.4, §9.6), not the Linear ask:
- the existing edit pencil is already absent from print — stated so nobody "fixes" it;
- `withPrefOverrides` has the same latent double-emit against a raw-splicing serializer
  (`ds-hero`) that `withCollapsedDefault` guards against. Pre-existing; FOLLOWUPS candidate.

## Concerns / risks for the orchestrator

1. **`mkdocs.yml exclude_docs` is unvalidated locally.** If docs CI errors on an unrecognised
   config key, either bump mkdocs or move the spec to `.repo-docs/superpowers/`.
2. **Test-contract edits.** Three pre-existing assertions were deliberately changed (statblock
   ×2, authoringAnchor ×1) because chrome legitimately adds framework-owned controls and moves
   the pencil. Each carries a comment explaining what superseded what — worth a reviewer's eye.
3. **`ds-stamina`'s double collapse** is live on the branch: the kit wrapper header AND the
   chrome collapse both exist. Intentional (removing the wrapper moves a frozen shot), visible
   in the stacked/mobile evidence shots, and open question 3.
4. **Mobile reserved space is on the ROOT while the panel is anchored to the CARD**, so for
   `ds-stamina` (whose card starts below its wrapper header) the always-visible panel sits
   beside that header rather than in the reserved band. Harmless today; revisit if the wrapper
   stays.
5. **No real-Obsidian verification.** Browser harness only. `Platform.isMobile` is exercised
   through the override seam, never against a real mobile host.
6. **Freeze widening not prepared.** 24 new shot names are unpinned; if the orchestrator wants
   them frozen, that is an additions-only widening of 8 `*--steel-print.png` lines
   (`chrome-{hover-statblock,hover-hero,stacked-hover,collapsed-trio,mobile}` +
   `{statblock,hero,stamina-bar}-collapsed`) at landing.
# SC-169 round 2 — implementer report

**Status:** complete, committed, Linear comment posted. Nothing landed; nothing in the shared
main checkout touched; the freeze baseline is unmodified.

- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc169-menu-panel/draw-steel-elements`
- **Branch:** `sc169-menu-panel`
- **Final sha:** `65c3aba` (single new commit; the round-1 commit rebased to `53cf2ec`)
- **Base:** rebased onto `origin/develop` `da96da2`
- **Linear:** one comment on SC-169 (`53737ff6-7f8f-4ebb-9d68-dfdf6227ea5c`), 24 inline images.
  Issue state and labels untouched.
- **Evidence:** `.superpowers/sdd/sc169/evidence/round2/`
- **Rebaseline ask:** `.superpowers/sdd/sc169/rebaseline.txt` (+ `rebaseline-README.md`)

---

## The rebase

Four conflicts, all resolved by keeping both sides:

- `src/framework/pipeline.ts` — import block (`watchPrintMedia` vs the chrome imports).
- `visual-harness/entry.ts` — `parseParams` (`scroll`/`scrollTo` vs `pad`), the
  `SCROLL_SHOTS`/`CHROME_SHOTS` declarations, `mountFromParams`'s mount setup, and the two
  manifest sites.
- `visual-harness/shoot.mjs` — the manifest list and the `--element` validity check.

**The one that mattered:** SC-170 made `snap(page, combo, params, captureId, opts)` the sole
owner of the print medium, the `print=1` param, `--readonly` and the output name, precisely so
a new sweep loop cannot forget them (SC-160's loop did, and shot five realprints under screen
media). The SC-169 chrome loop was written against the old signature and built its own
`theme`/`bg`/`print` params. It now hands its combo to `snap` and contributes only the
chrome-specific params. Verified by the in-run assertions: print-twin parity 86/86 and
print-class coverage clean, both of which the old shape would have broken.

No CHANGELOG conflict (the round-1 branch never touched it).

---

## What shipped, per ruling

### 1. Placement (measured, then fixed, then gated)

Round-1 measurement: **34.59px** inset from the card's right edge on `ds-statblock`,
**9.59px** on `ds-hero` / `ds-stamina`. Three independent causes:

1. `.dse-sb > :not(.dse-head) { margin-inline: 1.5rem }` — statblock's own content gutter
   reached the panel (the panel is one of the card's children). 24 of the 25px. Fixed with
   `margin: 0 !important` on the panel; the comment in `styles-source.css` explains why
   `!important` rather than a specificity race (the rules it must beat are per-element and
   arbitrarily specific, and a rollout element could out-specify anything I wrote).
2. `right: 0.6em` — resolved against the panel's inherited font-size. Now
   `--dse-chrome-inset: 10px`, declared once on `.dse-chrome-anchor`.
3. Absolute offsets resolve against the containing block's **padding** box; the reader
   measures the frame's **border** box. Differs by the frame's border width whenever the
   anchor IS the framed card. CSS cannot read that, so `mountChrome` reads it once at mount
   (`getComputedStyle(anchor).border{Top,Right}Width`) and publishes
   `--dse-chrome-frame-border-{top,right}`, which the sheet subtracts. A style read, not a
   layout read; a detached node yields 0 (pre-correction geometry, never a crash). The
   `setProperty('--dse-*')` form is the SC-5-sanctioned `.style` use.

**After: inset 10.00px, overlap 0.00px, all three families.**

### 2. Layering

`margin-bottom: -1px` (the round-1 "shared hairline" seated tab) is gone; the panel's bottom
margin edge lands on the frame's border-box top via
`bottom: calc(100% + var(--dse-chrome-frame-border-top, 0px))`. The card's own border is the
panel's floor. `StaminaBarView.authoringAnchor()` also moved from the (unframed) kit
collapsible region to `.dse-stamina__cluster`, the plate that actually draws the amber/red
state border — so "above the frame" and "above the border" became the same statement.

**The gate is `assertChromePlacement` in `visual-harness/shoot.mjs`, not jest.** jsdom
computes no layout — every `getBoundingClientRect` there is zeros — so a geometry assertion
written in the suite would pass vacuously forever. The harness re-measures three families per
run and exits 1 naming what moved. `test/dom/framework/chromeRound2.test.ts` pins the CSS
declarations the measurement depends on, so a regression is named in the suite too.

### 3. YAML keys

Three reserved keys with a documented ladder (`framework/chrome/collapsedKey.ts` header is the
canonical write-up):

| key | ladder |
|---|---|
| `collapsible:` | key → `collapsibleDefault` pref (default true) |
| `collapsed:` | key → `collapse_default:` → `collapseDefault` pref (default false) |

`collapsed:` beats `collapse_default:`. `collapsible: false` drops the collapse control and,
if that leaves the panel empty, the panel is not mounted at all (`mountChrome` returns
`undefined`).

**The claiming rule is the load-bearing part.** `collapsed:` is always popped. The legacy pair
is popped only when the definition **has `chrome`** AND **does not** set
`collapseKeysOwnedByModel`. Both halves earned their place:

- *Without the chrome check*, `ds-skills` broke — the pipeline popped its ComponentWrapper
  fields before `def.parse`, and 6 tests across `skills.test.ts` / `pref-overrides.test.ts`
  went red. Gating on `chrome` gives the ~30 un-rolled-out elements a zero blast radius.
- *Without `collapseKeysOwnedByModel`*, `ds-stamina` would have lost its model fields to the
  framework, letting ComponentWrapper's `?? true`/`?? false` rewrite the author's values on
  the next write-back.

### 4. `ds-stamina`

Kit collapsible removed; bar mounts onto root. Backward compat verified by test and by shot:
`collapse_default: true` still starts collapsed, block body byte-identical (the model still
owns and re-emits the key, so the framework's serializer wrapper deliberately does not).

Two behaviour changes, both deliberate, both flagged to Scott:

- `collapsible: false` is honoured (the D1 "StaminaBar.vue always passed `!disable_click`"
  quirk retired).
- The user's toggle is session-persisted (the old wrapper passed no `SessionPersist`).

### 5. Collapsed form

- Ruling 4: `[data-dse-collapsed='on'] .dse-chrome { display: none !important }` — the panel
  is suppressed outright, not emptied. (Worth noting: this was already the *de facto*
  behaviour for elements whose anchor is nested, because the collapse rule hid the anchor's
  subtree. Statblock, whose anchor is root, kept its panel. The explicit rule makes it
  uniform.)
- Ruling 5: new `ElementView.chromeSummary()` seam, consulted before `def.chrome.summary()`.
  `RefUnwrapView` records `{model, def}` on the mountBase success path and answers from it, so
  a resolved reference reports the entry's real name through whichever definition actually
  rendered it (`baseForType` may pick a different family than the wrapper's own base — that
  is the right label to show). Cleared on `onUpdate`. Covered end-to-end against the real
  Goblin Stinker fixture, plus the unresolved-degrade case.

### 6. HFS

E1 (chamfer) shipped: `clip-path` polygon on the leading edge. `clip-path` clips a
`box-shadow` away entirely, so the lift is re-cast as `filter: drop-shadow(...)`, which follows
the clipped silhouette. Pure paint — the panel's box, and therefore every placement
measurement, is unaffected. E2/E3 exist only in the evidence renderer, never as shipped CSS.

---

## Battery at `65c3aba`

| gate | result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2897 passed / 1 skipped / 172 suites / 3 snapshots**, exit 0 (base 2846+1skip/170 → +51, +2 suites) |
| `npm run shots` | **346 ok / 0 FAIL**, exit 0 |
| — in-run chrome placement | `chrome placement OK (3 element families: inset 10.00px …, 0 border overlap)` |
| — in-run print-twin parity | `print-twin parity OK (86 capture ids byte-identical)` |
| — in-run print-class coverage | clean |
| `check-freeze.sh` | **16 FAILED** = 10 sanctioned (below) + 6 pre-existing develop drift |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 |

`obsidian-shots` not run (no display; out of scope by instruction).

Jest delta (+51) is 20 new cases in `chromeRound2.test.ts` plus rewrites; the four
`stamina-bar.test.ts` wrapper cases and three `pref-overrides.test.ts` cases were rewritten
against the new mechanism rather than deleted — same contracts (the D4 pref ladder, the
authored default, the `collapsible` flag, session behaviour), new DOM.

Shots 290 → 346: +56 = 14 new combos-worth of captures (4 new CHROME_SHOTS entries × 4 combos
= 16, 2 new stamina fixtures × 4 = 8, and the pre-existing chrome shots the base did not have).

---

## The rebaseline (10 lines) — needs Scott's sanction, NOT applied

`.superpowers/sdd/sc169/rebaseline.txt`, with the full rationale in `rebaseline-README.md`
and before/after PNGs under `evidence/round2/rebaseline/{before,after}/`.

**Ten, not two.** The brief predicted a single twin pair; the real answer is five `ds-stamina`
capture ids × print twin + realprint: `stamina-bar`, `stamina-bar-dying`,
`stamina-bar-recoveries`, `stamina-bar-winded`, `stamina-rail`. Every harness fixture that
renders a `ds-stamina` carried the removed header. Each pair's two hashes are identical to
each other (the SC-170 invariant holding across the change).

Verified: deterministic across two independent runs; **every BEFORE hash re-derived from a
detached `origin/develop` and matched the live baseline 10/10**; `sha256sum -c rebaseline.txt`
against the final sweep passes 10/10. `ds-hero` and `ds-statblock` print bytes are identical
to develop's despite carrying the same chrome — the standing proof the panel never reaches
paper.

---

## ⚠️ Pre-existing freeze drift on `develop` — NOT SC-169's

`check-freeze.sh` **already fails on `origin/develop` (`da96da2`) itself**, on 6 lines:
`hero{,-sparse,-narrow}--steel-{print,realprint}`.

Proven, not inferred: a full `npm run shots` sweep at a **detached `origin/develop`** in this
worktree reports exactly those 6 and nothing else; the hero shot is deterministic on this
machine (two runs, `de03cc1f…` both times for `hero--steel-print.png`, vs the baseline's
`e5465a99…`); and the same 6 fail at the SC-169 branch tip with byte-identical output, so the
branch changes nothing about them.

Either a hero change landed without its rebaseline, or those lines were pinned from a
different environment. **Needs its own diagnosis.** A fully green `check-freeze.sh` is not
reachable on this branch until it is resolved — do not read the branch's 16 as 16 of ours.

---

## Open questions for Scott (also in the Linear comment)

1. **D or B** for the ownership treatment. D shipped (needs no over-painting trick, so it
   cannot crop a coloured frame under any element's CSS); B is a one-line switch.
2. **E1, E2 or E3** for the panel style. E1 shipped (his own diagonal example).
3. **The two `ds-stamina` behaviour changes** — `collapsible: false` honoured; session
   persistence.
4. **A whole-block reference body cannot carry an authored `collapsed:`.** The body IS the
   reference, so `collapsed: true\nscc.v1:…` is not valid YAML and error-cards. The user's own
   collapse works and persists. Options: accept; support a mapping form (`ref:` + keys); or
   put framework keys on the fence info string. No work done — flagged, and the test file
   documents the workaround it uses (a SessionStore seed).
5. **The two global collapse preferences now reach every chrome element.** They used to touch
   only `ds-skills` and `ds-stamina`'s inner wrapper. Defaults unchanged (`collapseDefault`
   false, `collapsibleDefault` true), so nobody is affected until they opt in — but at rollout
   `collapseDefault: true` will start every panelled card collapsed.

## Concerns

- **The `margin: 0 !important` is a real (if justified) escalation.** It is the only way to
  make placement independent of what a future element author writes in their own card CSS,
  and the rule is commented at length, but a reviewer should agree with the trade rather than
  discover it.
- **The runtime border read** (`getComputedStyle` at mount) is the one piece of the placement
  fix that is not pure CSS. It is a style read, not a layout read, so it does not force
  reflow, and it degrades to the old geometry on a detached node — but it is a per-mount
  `getComputedStyle` on every chrome-bearing element, and at rollout that is 14+ families.
  If it ever shows up in a profile, the alternative is a per-element declared constant, which
  is a rollout footgun instead.
- **`chrome-placement-trio--steel-*` is a weak picture** (three elements ~10,000px apart in
  one frame). It is kept because the capture ids are cheap and it is a real regression
  surface, but the *readable* proof is `evidence/round2/placement-proof--{dark,light}.png`,
  composed by `render-placement.mjs`, which is what went to Linear.
- **`docs/superpowers/sc169-element-menu-panel-spec.md` §4.1 now contradicts its own round-1
  argument** (it argued at length that `collapsible:`/`collapse_default:` were the wrong keys).
  The section is rewritten and labelled "ROUND 2 — supersedes the single-key design", but the
  file reads as a document that changed its mind, because it did.
- **Rollout is not done.** Three elements opt in; the other 14 reference-capable families and
  the trackers are still a follow-on phase, and the `collapseKeysOwnedByModel` flag is a thing
  a rollout author must remember for `ds-skills` if it ever gets chrome. That requirement is
  documented on the registry field.
# SC-169 round 3 — rollout report

**Branch:** `sc169-menu-panel` (worktree `sc169-menu-panel`), rebased onto `origin/develop`
`3bc7685`.
**Final sha:** `c15a4b4` — one round-3 commit on top of the two rebased round-1/2 commits
(`11f370d`, `3bff1e4`). Superproject pointer left unstaged.
**Scott's gate:** SC-169, 2026-08-18 — *"Option D and E3. Sanctioned"*.

---

## 1. The rebase first, and what it settled

The branch was rebased from `da96da2` onto `origin/develop` `3bc7685` before anything was
touched, and the battery was re-run at that state.

**It closed the round-2 report's loudest open item.** Round 2 flagged six
`hero{,-sparse,-narrow}--steel-{print,realprint}` lines as failing `check-freeze.sh` *on
develop itself* and asked for a separate diagnosis. There is nothing to diagnose: they were the
**SC-156 rebaseline landing mid-flight**. Post-rebase the freeze check reports exactly the 10
sanctioned stamina lines and nothing else.

Post-rebase, pre-change baseline: tsc clean · lint clean · jest **2904 passed / 1 skipped / 174
suites** · shots **346, 0 FAIL** · placement OK (3 families, 10.00px) · print-twin parity 86/86
· freeze = the 10 stamina lines.

---

## 2. Task 1 — E3 shipped as the real panel style

E1's chamfer block is **deleted**, not disabled, and the base `.dse-chrome` rule now carries
the crown. Concretely:

| | E1 (was) | E3 (now) |
|---|---|---|
| silhouette | `clip-path: polygon(...)`, `border-top-left-radius: 0`, extra left pad | plain rounded box, radius restored, `padding: 0 1px` |
| lift | `box-shadow: none` + `filter: drop-shadow(0 -2px 4px …)` (a filter was *required* — `clip-path` clips a box-shadow away) | `box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 -3px 7px rgb(0 0 0 / 34%)` |
| geometry | — | **unchanged**; E3 is a pure paint change |

Dropping `clip-path`/`filter` is worth more than tidiness: the panel can no longer clip its own
shadow or a focus ring.

**The light-theme arm is new.** E3's honest weakness at the taste gate was "in light mode it is
nearly invisible" — a white hairline over `--dse-surface-raised` (#edf0f0) is a ~2% luminance
step. On light the crown is carried by contrast instead: the hairline goes to full white and
the plate's top border is deepened one step to `#a9b1b5`, so the edge reads dark → bright lip →
plate; the cast shadow drops to 15% black (34% under a light card reads as grime, not lift).
The deepened edge is a **literal, not a `color-mix()` of the token** — deliberately, so the
panel stays off the SC-171 support-floor ladder (a `var()`-bearing `color-mix()` needs a static
twin plus an `@supports` gate, which is a lot of machinery for one hairline).

**D's geometry is intact and gated:** `chrome placement OK (7 element families: inset 10.00px
from the card's right edge, 0 border overlap)`.

**Evidence-only CSS:** none was ever in the repo. A/B/C and E2/E3 were rendered by
`evidence/round2/render-options.mjs`, which injects over the shipped sheet; that script is
untouched and is now historical. Nothing to remove.

---

## 3. Tasks 2 + 3 — the opt-in table

31 elements in, 2 out. Every row's collapsed line is **executably pinned** in
`test/dom/framework/chromeRollout.test.ts` against the same harness fixture the sweep
photographs, and the roster itself in `test/dom/framework/chrome.test.ts` ("ROUND 3 — the
rollout roster"), so neither can rot silently.

`Summary` below is the literal rendered text (the label uppercases in CSS). Every row's
fixture is `default` unless noted.

### Wave 1 — reference-capable card families (15)

| Element | Summary (from its fixture) | Decision / mechanism |
|---|---|---|
| `ds-statblock` | `Statblock: Human Bandit Chief` | already in (round 1) |
| `ds-feature` | `Feature: Coverage Strike` | IN — name only; `Feature.name` is optional in the SDK, so a nameless trait folds to bare "FEATURE" rather than an invented title |
| `ds-featureblock` | `Featureblock: Angulotl Malice (3)` | IN — name + feature count |
| `ds-kit` | `Kit: Panther` | IN — **one line in `displayFamily()`** covers all ten typed families |
| `ds-condition` | `Condition: Bleeding` | ” |
| `ds-treasure` | `Treasure: Color Cloak (Blue)` | ” |
| `ds-ancestry` | `Ancestry: Human` | ” |
| `ds-culture` | `Culture: Urban` | ” |
| `ds-career` | `Career: Politician` | ” |
| `ds-class` | `Class: Tactician` | ” |
| `ds-title` | `Title: Back From the Grave` | ” |
| `ds-perk` | `Perk: Familiar` | ” |
| `ds-complication` | `Complication: Chosen One` | ” |
| `ds-rule` | `Rule` | IN — one line in `genericCard()`; inline bodies carry no name, and the `!== cfg.name` guard suppresses a degenerate "RULE: Rule" |
| `ds-scc` | (resolved family's line, e.g. `Kit: Panther`) | **IN — overturns the spec's "never" list.** See §4 |

The display families' name is `layout.title(model)` — the exact string the expanded card prints
in its own head — so folding a card can never show a different name than unfolding it.

### Wave 2 — hero suite + GM trackers (16)

| Element | Summary (from its fixture) | Decision / mechanism |
|---|---|---|
| `ds-hero` | `Hero: Torin Stonefist` | already in (round 1) |
| `ds-stamina` | `Stamina (15/20)` | already in (round 1) |
| `ds-conditions` | `Conditions (3)` | IN — count; `(0)` is reported, not suppressed ("no conditions" is the state a reader wants confirmed) |
| `ds-resource` | `Resource: Ferocity (4)` | IN — the **resolved** resource name via `resolveResource`, not the raw `class:` key, so it matches the panel's own title |
| `ds-surges` | `Surges (2)` | IN — the pool is one number |
| `ds-tokens` | `Hero tokens: Session 12 party pool (3)` | IN — optional author label + tally |
| `ds-skills` | `Skills (3 selected)` | IN + **`collapseKeysOwnedByModel: true`**. Worded because "SKILLS (12)" could mean listed or had |
| `ds-encounter` | `Encounter: Ambush at the ford (EV 0)` | IN — `EV n` from the `_computed` display cache, falling back to the group count. *The harness has no compendium, so its EV computes 0; in a real vault this is "(EV 42)"* |
| `ds-montage` | `Montage: Cross the Ashfall Wastes (round 1 · 0/5)` | IN — round + the success track; failures left to the open card (two fractions stop being scannable) |
| `ds-project` | `Project: Craft Teleportation Platform (340/1500)` | IN — accrued/goal; accrued alone when no goal is authored |
| `ds-party` | `Party (2 heroes)` | IN — worded count (a bare "(4)" could be levels or victories) |
| `ds-initiative` | `Initiative (round 1 · 2v1)` | IN — round + the combatant split; the round alone doesn't answer "is this still the fight I think it is" |
| `ds-counter` | `Counter: Health (10/20)` | IN — current alone when uncapped |
| `ds-characteristics` | `Characteristics (2/1/0/-1/3)` | IN — the five scores in their fixed Draw Steel order |
| `ds-values-row` | `Values (3 values)` | IN **for consistency**, with eyes open: a one-line strip saves no height by folding, but the panel is where the edit affordance and every future item live |
| `ds-negotiation` | `Negotiation: Convincing Frodo … (Interest 3 · Patience 3)` | IN — the one summary spending its budget on two labelled values, because either hitting its floor ends the negotiation |

### Deliberately OUT (2)

| Element | Why |
|---|---|
| `ds-hr` | No body, no name, nothing to fold, nowhere to seat a panel. Also the standing witness in `chrome.test.ts` that "no slot" = zero extra DOM. |
| `ds-roll` | An inline dice affordance, not a card. |

### `stamina-rail`

Not an element — a `NARROW_SHOTS` capture of `ds-stamina` at 300px. It inherits the element's
chrome automatically and is one of the 5 sanctioned stamina capture ids. No decision needed;
recorded because the brief asked.

---

## 4. Why `ds-scc` is IN (a deliberate deviation from the spec)

The spec's §10 listed `horizontal-rule`, `roll` and `scc` as "never — trivial or bodiless".
That reasoning does not survive contact with SC-149:

1. `ds-scc` is not trivial. It renders a full statblock/kit/feature card.
2. Post-SC-149 it is the **only public reference element** — `ds-kit` & co. are no longer
   code-block languages a user can write.
3. The pipeline reads `def.chrome` off the **block's own def**, never off the family it
   resolves to. Verified by reading `pipeline.ts`, not assumed.

Together those mean that leaving the slot off would have made the entire wave-1 rollout
invisible in a real vault while looking complete in the harness. It is IN.

The slot's **presence** is the opt-in; its body is nearly inert, and correctly so. Every
`ds-scc` body parses to `{kind:'ref'}` or `{kind:'invalid'}`, never `inline`, so `liftChrome`'s
non-inline arm supplies the pre-resolution fallback and `RefUnwrapView.chromeSummary()`
overrides it once the lookup settles. Anchoring is correct because `RefUnwrapView.onMount`
**awaits** resolution, so `view.authoringAnchor()` already returns the resolved child's card
frame when `mountChrome` reads it.

---

## 5. The defect the rollout exposed, and fixed

**A collapsed root-framed element rendered a box inside a box.** The collapse rule hides root's
*children*; it cannot hide the root, which carries the attribute and hosts the summary bar.
That is harmless only when the visible card frame is a nested node — which all three prototype
elements happened to be (`.dse-sb`, `.dse-hero`, `.dse-stamina__cluster`), so rounds 1 and 2
never saw it. Nine of the newly opted-in families paint the plate on the ROOT (the shared
card-ground selector list: `feature`, `featureblock`, `counter`, and all six GM trackers) and
showed the summary bar nested inside their own still-painted, still-padded plate.

Fixed with one rule in the COLLAPSED block: while collapsed the root drops padding, background,
border colour and shadow. Margins are untouched (block rhythm is not part of the plate) and the
border is made transparent rather than removed, so the box does not change width. `!important`,
for the same reason the two rules beside it use it. Pinned in `chromeRollout.test.ts`; the
before/after is visible between the two generations of
`evidence/round3/collapsed-wave2-trackers--dark.png`.

Found by looking at the evidence, not by a gate — worth noting, because no automated check in
this repo would have caught it.

---

## 6. Verification widened, not just re-run

- **`assertChromePlacement`: 3 → 7 element families.** Chosen to cover every distinct *anchor
  shape* the rollout produces rather than to be exhaustive: nested frame through
  withReference (`statblock` `.dse-sb`, `kit` `.dse-card`), framed root (`feature`, `counter`,
  `negotiation` — a static card, a small persisted card, a large tracker), view-supplied nested
  anchor (`stamina-bar`, `hero`). One inset number out of all seven.
- **New harness param `collapse=1`** — after mount, CLICK each element's own collapse control
  (and fail the run if an element has none or does not collapse). This is what made
  photographing 31 collapsed elements possible without 31 near-duplicate fixtures, and it
  drives the real toggle rather than stamping the attribute, so a shot taken this way proves
  the control works.
- **3 new collapsed fixtures + 2 new CHROME_SHOTS** (`kit`/`feature`/`encounter` collapsed;
  `chrome-hover-card`, `chrome-collapsed-rollout`) — 5 new capture ids, all new names, so
  additions-only against the freeze baseline.
- **New suite `test/dom/framework/chromeRollout.test.ts`** — 31 pinned summary lines + a
  completeness check that fails if a chrome-bearing element has no row.
- **Four pre-existing suites updated**, each because an element it tests newly carries chrome:
  `feature`/`featureblock` ("no interactive controls" → no interactive controls *outside*
  chrome, via the new `test/dom/_chromeTestUtils.ts` — a filter, not a relaxation, so a real
  control creeping into a card body still fails), `initiative` T-9 (read-only: the panel mounts,
  and the assertion now also pins that the *edit* item does not), `authoringAnchor` (counter's
  pencil is a panel item now; the case still uniquely proves the root-anchor shape, and the
  pre-chrome contract stays under test on the synthetic `wideCardDef()`).

---

## 7. Freeze delta — exactly the sanctioned stamina set

```
stamina-bar--steel-print.png             stamina-bar--steel-realprint.png
stamina-bar-dying--steel-print.png       stamina-bar-dying--steel-realprint.png
stamina-bar-recoveries--steel-print.png  stamina-bar-recoveries--steel-realprint.png
stamina-bar-winded--steel-print.png      stamina-bar-winded--steel-realprint.png
stamina-rail--steel-print.png            stamina-rail--steel-realprint.png
```

Ten lines, five pairs, nothing else — with E3 live and 28 additional elements carrying chrome.

**And the hashes are byte-identical to round 2's file**, regenerated from the rebased tree.
That is the strongest statement available here: a rebase across four landings, a material
change and a 28-element rollout moved not one print byte.

- `rebaseline.txt` regenerated as PAIRS; each pair's twin hash **equals** its realprint hash
  (the SC-170 invariant, holding across the change).
- **Deterministic ×2 over the whole sweep**: two independent full `npm run shots` runs, a
  `sha256sum` of all 366 PNGs byte-identical between them.
- Before/after PNGs staged at `evidence/round3/rebaseline/{before,after}/`; the `after` copies
  were hash-verified against `rebaseline.txt`.
- `rebaseline-README.md` rewritten for round 3.

Not applied by this agent — the orchestrator applies it at landing, per `dse-verify`.

---

## 8. Docs

| Where | What |
|---|---|
| workspace `DESIGN.md` | New component-map row + a full subsection, "The element chrome panel": form factor, D geometry, E3 material (incl. the light retune), hover/mobile/print rules, and the collapsed one-liner grammar with the label/name/detail discipline |
| `docs/common-element-fields.md` | Rewritten as **"The element menu, and collapsing a block"** — plain language, no YAML knowledge assumed: what the menu is, the two hover exceptions (mobile, print), what collapsing shows and what it remembers, the three fields with an example, the vault-wide defaults, which elements have it, and the ref-body limitation |
| `docs/index.md` | Link text updated |
| `docs/writing-blocks.md`, `settings.md`, `advanced-usage.md` | The three "adds a pencil to each rendered block" lines now say where the pencil actually is |
| `docs/skills-element.md` | Documents that skills now has *two* ways to fold, and that the three fields drive both |
| plugin `CHANGELOG.md` | The 7.0.0 bullet updated from "statblock, hero sheet or stamina bar" to the whole rollout |
| workspace `CHANGELOG.md` | New `## Unreleased` bullet |
| `docs/superpowers/sc169-element-menu-panel-spec.md` | Status → round 3 complete; new §3.1b (E3) and §4.3a (the collapsed-root fix); §10 rewritten as the finished rollout incl. the `ds-scc` reversal; §9b = answered at the round-3 gate, §9c = still open; four stale round-1 passages corrected (the `right: .6em` / `margin-bottom: -1px` table rows and the "reference bodies show the code" note, all superseded in round 2) |
| workspace `FOLLOWUPS.md` | **#76** — `ds-skills` still carries its own disclosure header |

---

## 9. Battery at the final sha (base `3bc7685`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2972 passed / 1 skipped / 175 suites / 3 snapshots** (base 2904/174 → +68, +1 suite) |
| `npm run shots` | **366, 0 FAIL** (346 → +20 = 5 new capture ids × 4 classes) |
| chrome placement | **OK — 7 element families, inset 10.00px, 0 border overlap** |
| print-twin parity | **OK — 91 capture ids byte-identical** |
| `check-freeze.sh` | 10 mismatches = **exactly** the sanctioned stamina set; 0 others |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, exit 0 |
| `npm run obsidian-shots` | NOT run — needs a display, and `:1` is out of bounds for this agent |

Jest's +68: 31 rollout summary rows + 2 new chromeRollout cases + 33 new
`visual-harness/fixtures.test.ts` mount cases and roster rows, less the tests reshaped in §6.

---

## 10. Concerns for the orchestrator

1. **`ds-skills` ships with two collapse mechanisms** (FOLLOWUPS #76). By ruling 3's logic its
   "Skills" header should go the way `ds-stamina`'s did; that costs 2 more frozen print lines
   and therefore its own sanction, which round 3 did not have. This is the one place the
   rollout knowingly leaves the inconsistency Scott named.
2. **`ds-scc` opting in contradicts the spec's written "never" list.** Reasoned in §4 and
   documented in the code, but it is a judgment call made without asking, and it is the change
   most worth a second opinion.
3. **A freeze WIDENING is available and not taken.** The 5 new capture ids
   (`kit-collapsed`, `feature-collapsed`, `encounter-collapsed`, `chrome-hover-card`,
   `chrome-collapsed-rollout`) are new names, invisible to the gate. Pinning them is
   additions-only and needs no sanction — a landing decision.
4. **The harness's encounter EV reads 0** in the collapsed line because the harness has no
   compendium to price monsters against. The summary code is right; the picture understates it.
   A reviewer seeing "(EV 0)" should not read it as a bug.
5. **`ds-values-row` and `ds-characteristics` gain little from collapsing** (they are already
   one row). They are in for consistency and because the panel is the future home of every
   per-element action; easy to reverse if Scott would rather they stayed bare.
6. **`obsidian-shots` was not run.** No live-vault verification of the rollout was performed by
   this agent.
# SC-169 — adversarial executing review (element menu panel + whole-element collapse)

**Branch/commit reviewed:** `sc169-menu-panel` @ `c15a4b4` (3 commits on develop `3bc7685`)
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc169-menu-panel/draw-steel-elements`
**Reviewer:** independent (did not write the feature). Every claim below was executed.

## VERDICT: **FIX ROUND**

One HIGH finding, reproduced in real Obsidian, makes a `collapsed: true` element **vanish
completely and unrecoverably** after an ordinary settings toggle. Everything else in the
feature is in very good shape — the battery reproduces to the number, the print invariants
hold in bytes *and* in a real PDF export, placement is 10.00px on all 31, the collapsed-root
fix is real, the `ds-scc` reversal is correct, and the test narrowings are honest (mutation
proven). The fix is small and local; nothing else needs redesign.

---

## Findings, severity ranked

### H-1 (HIGH — blocker). An in-place view rebuild destroys the chrome panel and the collapsed bar. A collapsed element becomes an invisible, unrecoverable, zero-height block.

`mountChrome` is called **once**, by the pipeline, after `view.mount()`. It appends the
summary bar to `root` and the panel to `view.authoringAnchor()`. But `ElementView.update()`
(framework/view.ts:134) does `this.rootEl.empty()` + `onMount()` for every view that does not
define `onUpdate` — **which is every element view in the plugin** (checked all 19). So any
in-place rebuild wipes both chrome nodes, and nothing remounts them.

The attribute `data-dse-collapsed="on"` lives on `root`, which survives `empty()`. The CSS
then hides every rebuilt child
(`[data-dse-collapsed='on'] > *:not(.dse-chrome):not(.dse-chrome-summary){display:none!important}`)
and the round-3 rule strips the root's own plate. Net result: **height 0, nothing painted, no
expand control anywhere.**

**Real-Obsidian reproduction** (own Xvfb `:96`, scratch vault + udd, Obsidian 1.9.x):

1. Note with a `ds-statblock` carrying `collapsed: true` (no user action needed).
2. Toggle **Enable dice rolling** (or **Click to roll**) in settings — `prefs.set('rollingEnabled', true)`.
3. Both statblocks disappear from the page entirely. Measured immediately after the flip:

```
H1-a AFTER PREF FLIP {
  stillInDom: true, collapsed: 'on',
  bar: false, panel: false, h: 0, childCount: 2,
  childCls: [ 'dse-sb__sticky=none', 'dse-sb=none' ]
}
H1-a AFTER 3s (self-heal?) { firstH: 0 }      <- no recovery
```

Screenshot: `sc169/evidence-review/11-after-pref-flip.png` — "Expanded statblock:" and
"Collapsed statblock:" headings with nothing underneath.

Jsdom twin (same outcome): a `collapsed: true` statblock + `deps.prefs.set('rollingEnabled', true)`
→ `.dse-chrome-summary` and `.dse-chrome` both `null`.

**Reachable rebuild paths** (all use the default `update()`):

| Path | Trigger | Self-heals? |
|---|---|---|
| `statblock`, `feature`, `featureblock` | `cx.prefs.subscribe('rollingEnabled' / 'rollClickToRoll')` remount | **NO** (no persist ⇒ no echo) |
| `feature` | `setCharacteristicProvider()` (hero binding) | NO |
| `project` | "Add project roll", "Log respite" | yes, ~1–3 s later via the persist echo (new node) |
| `party` | "Award victories", "Convert victories to XP" | yes, same way |
| `montage` | record-test, Reset | yes |
| `negotiation` | Reset | yes |
| `SidebarPanel.handleExternalChange` (`previous.update(model)`, SidebarPanel.ts:167) | external note edit while a block is sidebar-hosted | **NO** |

Measured for `project` in real Obsidian: panel gone immediately after the click, back 3 s
later on a *different* DOM node — so a persisting tracker only flickers; the pref-subscription
and sidebar paths are permanent.

This pattern is technically pre-existing (SC-145's edit pencil was mounted the same way and
also vanished), but it was invisible: the pencil is default-OFF and losing it is cosmetic.
SC-169 turns it into "the block disappears and cannot be brought back".

**Suggested shape of the fix** (author's call): make chrome survive a rebuild — e.g. have
`ElementView.update()`'s default path preserve/re-append the chrome nodes, or move the
mount into a view hook the rebuild re-runs, or have the pipeline re-run `mountChrome` after
an update. A regression test should collapse a statblock, flip `rollingEnabled`, and assert
the summary bar is still present.

---

### M-1 (MEDIUM). `collapsed:` on a **prose-bodied** card element produces a parse error card, and the docs don't say so.

`ds-rule` (the `genericCard` family) takes a free-prose body. Adding the documented top-level
key breaks the block:

```
ds-rule, body = "collapsed: true\n<the shipped rule example prose>"
→ 1 error card: "Rule: failed to render (parse) Implicit keys need to be on a single line at line 2"
```

The same is true of any whole-block SCC reference body (`ds-kit` with `scc.v1:…` + `collapsed: true`
→ "Implicit map keys need to be followed by map values"). `docs/common-element-fields.md`
discloses **only** the `ds-scc` case ("One limitation worth knowing"), and its table says
flatly "You can set any of these on the block itself, as a top-level line", while "Which
elements have this" includes every card element. A user following the docs on `ds-rule` gets
an error card.

Not a crash and not data loss; a docs/behaviour mismatch. Cheapest fix is one sentence
generalising the limitation to "any block whose body is not a YAML mapping — a compendium
reference, or a prose-bodied rule block".

### M-2 (MEDIUM, process). The workspace-level docs for this ticket are sitting **uncommitted in the shared main checkout**.

`/home/scott/code/steelCompendium/workspace` `git status`:

```
 M CHANGELOG.md      (+13, the SC-169 Unreleased bullet)
 M DESIGN.md         (+66, "The element chrome panel")
 M draw-steel-elements
```

The worktree's own superproject carries only the submodule pointer. Per the workspace
CLAUDE.md rule 1 the main checkout is shared global state and `just deploy*` hard-aborts on
(or historically clobbered) a dirty tree — these two edits are one `deploy` away from being an
obstacle or a loss. FOLLOWUPS #76 *is* committed (`next-id` correctly at 77). Orchestrator
action, not an author fix.

### L-1 (LOW). A `ds-scc` block whose body is not an SCC code collapses to a nameless bar.

Body `not a code at all` → the ref-notice card renders (no error card, correct), chrome mounts,
and collapsing it gives a bar reading just `SCC REFERENCE` with an expand chevron. Honest, no
crash, but the fold hides the notice that tells the user what went wrong. Cosmetic.

### L-2 (LOW, informational). Two knowingly-deferred items are still open, both already on the ticket.

FOLLOWUPS #76 (`ds-skills` keeps a second disclosure header) and the `ds-values-row` /
`ds-characteristics` "folding saves nothing" question. Both are Scott calls, both correctly
documented (`docs/skills-element.md` explicitly describes the double fold). Not review blockers.

---

## What was verified, and how

### 1. Note safety — CLEAN
- Collapse → expand via the real controls: **`replaceSource` never called** (jsdom spy, 600 ms
  debounce window each way) and the note file on disk is **byte-identical** in real Obsidian
  before/after both a collapse and an expand.
- `collapsed:`/`collapsible:`/`collapse_default:` never reach `def.parse` (spied `parse`, key
  set empty) and are popped before schema validation.
- Existing `ds-stamina` note with `collapse_default: true` → starts collapsed. ✅
- `collapsible: false` on `ds-stamina` → no collapse item **and no panel at all**. ✅
- Non-boolean values (`collapsed: "yes"`, `collapsed: 1`, `collapsible: maybe`,
  `collapse_default: []`) → `console.warn` + ignored, **0 error cards** in all four. ✅
- Whole-block reference bodies: cannot carry authored keys (see M-1); user collapse works and
  is session-persisted. ✅

### 2. The `ds-scc` reversal — **the reversal is RIGHT**
- The claim checks out by code read *and* by execution: `mountChrome` is called from exactly
  one place, `if (def.chrome)` in `pipeline.ts`, off the **block's own** def. Nothing in
  `RefUnwrapView` mounts chrome. Without the slot on `ds-scc`, a real vault's `ds-scc` block —
  post-SC-149 the only public reference element — would have **no panel at all**, making the
  entire wave-1 rollout invisible outside the harness while the harness looked complete.
- Resolved-family behaviour probed end to end against real md-dse fixtures:

| body | error cards | collapsed line | root `data-dse-element` |
|---|---|---|---|
| `scc.v1:…/kit/panther` | 0 | `Kit: Panther` | `kit` |
| `scc.v1:…/rule.combat/turn` | 0 | `Rule: Taking a Turn` | `rule` |
| `scc.v1:…/monster.goblin.statblock/goblin-stinker` | 0 | `Statblock: Goblin Stinker` | `statblock` |
| non-resolving code | 0 | `SCC reference: mcdm.heroes.v1/kit/nope-not-here` | — |
| garbage body | 0 (ref-notice) | `SCC reference` (L-1) | — |

  The panel and the summary come from the **resolved** family (label + real name), never the
  code, and a non-resolving code degrades honestly rather than crashing.

### 3. Print invariants — CLEAN, and stronger than the report claims
- `check-freeze.sh` at `c15a4b4` on my own clean sweep: **exactly the 10 sanctioned stamina
  lines, nothing else** (5 pairs, each pair's twin hash == its realprint hash), exit 1 as
  expected for a pending rebaseline. (`freeze rc=0` through a `devbox … ; echo $?` is the
  documented exit-code footgun — run directly it is `rc=1`.)
- `rebaseline.txt` **reproduces exactly** from my sweep: `diff` of the file against my own
  `sha256sum` of the same 10 files is empty.
- **Collapsed prints in full, proven in bytes:** `kit-collapsed--steel-print.png` is
  byte-identical to `kit--steel-print.png` (same for `feature` and `encounter`), while the
  `--steel-dark` twins differ. Same for the realprint class.
- 5 new capture ids (`kit-collapsed`, `feature-collapsed`, `encounter-collapsed`,
  `chrome-hover-card`, `chrome-collapsed-rollout`): **0 collisions** with the 144-line
  baseline, and twin == realprint for each → an additions-only widening is available.
- **Real Obsidian, print media emulated live:** every chrome-bearing root reports
  `.dse-chrome` `display:none`, `.dse-chrome-summary` `display:none`, the collapsed
  statblock's `.dse-sb` `display:block`, and `margin-top: 8px` (i.e. the 2.1em mobile reserve
  is gone) **even with `data-dse-chrome-mobile="on"` still stamped**.

### 4. Placement + layering across ALL 31 — CLEAN
Extended the 7-family gate to every chrome-bearing element the harness can mount (30 elements
+ the `winded` and `dying` stamina variants; `ds-scc` has no harness fixture and was covered
via its resolved families):

```
measured: 32 of 34   inset min/max: 10 / 10   spread 0.00px
negative gaps (panel over border): []
non-10 insets: []
no chrome: horizontal-rule, roll        <- the two deliberate opt-outs
```

Every anchor is the full-width card node (anchorW == rootW everywhere). Winded (amber) and
dying (red) stamina frames measure `gap = 0.00` — the panel rests exactly on the border row
and never in it. In real Obsidian the hovered statblock measured `inset: 10, gap: 0`.
`ds-hero` correctly carries only `collapse` (opts out of the generic pencil).

### 5. Root-framed collapse fix — CLEAN
Drove the real collapse control (`collapse=1`) on all 30 mountable elements and measured the
collapsed root: **`padding: 0px`, `background-image: none`, `border-color: transparent`,
`box-shadow: none`, panel `display: none`, zero visible non-chrome children, and root height ==
bar height** (±2px, the retained transparent border) on every one — including all nine
root-framed families (feature, featureblock, counter, encounter, montage, project, party,
initiative, negotiation). No box-in-a-box, no leftover chrome. **0 problems.**

### 6. Interactions / lifecycle
- Hover in → `opacity 0→1`, `pointer-events auto`; hover out → `0`. Verified with a real CDP
  mouse move in Obsidian, not a synthetic event.
- `:focus-within` twin present in the sheet (keyboard reach).
- Collapse survives a **full pipeline re-render** (session-keyed) ✅ — but **not** an in-place
  `update()` (H-1).
- Mount/unmount ×50: exactly one `.dse-chrome` per root, no accumulation.
- Read-only host (`canPersist: false`, i.e. canvas/embeds): root gets `data-dse-readonly="true"`,
  the **panel mounts** (collapse only) and the **edit item is absent even with
  `authoringControls: true`** — correct gating.
- `authoringControls: true` + persistable: exactly one pencil, inside `.dse-chrome`, none in
  the card corner.
- SC-160 sticky header + panel coexist (`.dse-sb__sticky` on root, panel inside `.dse-sb`, panel
  last child); both `z-index: 3`, panel later in DOM order so it wins, and they occupy
  disjoint bands (panel above the card's top edge, sticky pinned inside it).
- SC-158 `strictBody`: only `ds-scc` sets it, and `withReference` sets `serialize: undefined`,
  so the `withCollapseKeys` wrapper can never write into a strict body. ✅
- Popout windows: `usedBorderPx` reads through `el.ownerDocument.defaultView`, so the border
  measurement is per-window — correct by construction (not executed).

### 7. Real Obsidian + PDF — PASS
Own Xvfb `:96`, scratch `--user-data-dir`, own CDP port, scratch vault; never touched `:1` or
`npm run obsidian-shots`. Hover-reveal, collapse/expand, note-untouched, mobile branch
(`opacity 1`, root `margin-top: 33.6px`) and print media all verified above.

**PDF verdict: PASS.** Exported via Electron `webContents.printToPDF` (the mechanism Obsidian's
own Export-to-PDF uses) with two collapsed statblocks on the page. The PDF renders **both
statblocks in full** — name, level, role, EV, the five stat tiles, immunity/weakness/movement,
characteristics — with **no menu panel and no collapsed one-liner bar anywhere**. Text
extraction confirms it (`Human Bandit Chief … 1M 5 80 1 …`, `Goblin Sneak … 1S 7 20 0 …`; no
summary-bar text). Rendered page: `sc169/evidence-review/pdf-page-1.png`.

### 8. Tests — the narrowings are honest
- `chromeRollout.test.ts`: 31 pinned lines + a real completeness check
  (`registry.all().filter(d => d.chrome !== undefined && d.id !== 'scc')` must equal the table).
- `chrome.test.ts` roster + the `ds-hr` "no slot = zero extra DOM" witness.
- **Mutation test of `_chromeTestUtils.ts`**: injected a stray `<button>` into `renderFeature`'s
  root → `feature.test.ts` and `featureblock.test.ts` both went **red** with the offending node
  named ("Expected Array [] / Received 3 and 4 entries"). The filter is a filter, not a
  relaxation. Reverted.
- `initiative` T-9 and `authoringAnchor` narrowings each add a *stronger* pin than they
  removed (edit item absent under read-only; exactly one pencil, and it is in the panel).

### 9. Battery at `c15a4b4` — reproduces exactly

| Gate | Report claims | I measured |
|---|---|---|
| `npm run tsc` | clean | clean, rc 0 |
| `npm run lint` | clean | clean, rc 0 |
| `npx jest` | 2972 / 1 skipped / 175 suites | **2972 passed, 1 skipped, 175 suites, 3 snapshots**, rc 0 |
| `npm run shots` | 366, 0 FAIL | **366 ok, 0 FAIL** |
| chrome placement | OK 7 families, 10.00px, 0 overlap | **OK, 7 families** (+ my own 32-case sweep: 10.00px, spread 0.00) |
| print-twin parity | 91/91 | **91 capture ids byte-identical** |
| `check-freeze.sh` | 10 stamina lines only | **exactly those 10**, nothing else |
| `npm run parity` | 0/0/16 | **0 gaps, 0 undeclared, 16 declared**, rc 0 |

Load at jest time: 1-min 9.2 — no timeout-shaped noise.

---

## Cleanup

All probes removed. `draw-steel-elements` is clean at `c15a4b4` (`git status --porcelain` empty);
the superproject shows only the expected unstaged submodule pointer. Xvfb `:96` killed, no
Obsidian processes left, `:1` untouched. `visual-harness/shots/` was regenerated and
`main.js`/`styles.css` rebuilt — both gitignored build artifacts.

Evidence (screenshots, PDF, probe logs) left at
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/`
(`obsidian-out/`, `logs/`) — copy anything you want to keep before the scratchpad is reaped.

---

# Fix round 1

**Commit:** `410b28c` on `sc169-menu-panel` (on top of the reviewed `c15a4b4`).
Same worktree. Written by the reviewer (the implementer's session was gone), so the
findings and the fixes share one head — flagged rather than hidden.

**Status: all three findings closed. H-1 re-verified in real Obsidian.**

## H-1 (blocker) — CLOSED

**Root cause, restated precisely.** Chrome and the collapsed bar are pipeline-owned DOM
inside view-owned DOM, mounted exactly once. `ElementView.update()`'s default path empties
`rootEl` and re-runs `onMount`; `data-dse-collapsed` lives on the root and survives that.

**Fix — one framework hook, at the funnel.**

1. `framework/view.ts`: `update()` now ends in an afterRender hook, in **both** branches
   (a subclass with its own `onUpdate` is not exempt — `RefUnwrapView`'s empties `rootEl`
   too). The pipeline registers it before `mount()`, so even a rebuild kicked off from
   inside `onMount` is covered.
2. **The hook is keyed on the element ROOT, not on the view** — the design decision that
   makes it actually work. The view that re-renders a root is not always the view the
   pipeline mounted: `RefUnwrapView` mounts a **child** `ElementView` onto the same root
   node, and for a `ds-statblock`/`ds-feature` body it is that *child* that subscribes to
   the roll preferences and calls `update()`. My first attempt stored the hook on the
   pipeline's own view instance; it passed the counter and ref cases and **failed the
   statblock/feature pref-flip cases** — i.e. the exact reported bug. A `WeakMap` keyed on
   the node means every rebuilder finds the same hook with nothing to forward.
3. `pipeline.ts`: the chrome/pencil mount is now a closure re-run by that hook. It reads
   everything lazily at call time — `view.authoringAnchor()` (a brand-new node after every
   rebuild), `view.currentModel()`, and the `authoringControls` pref (which may have
   flipped since mount; flipping a pref is itself a rebuild trigger). Each remount owns a
   fresh `Component` that the previous one is unloaded from, so listeners cannot
   accumulate; the D9 pencil is restored on the same path.
4. `ensureCollapseInvariant(root)` runs after **every** render including the first: if the
   collapsed attribute is set and root has no direct-child summary bar, the attribute is
   dropped. A forgotten fold is a nuisance; an invisible unrecoverable block is not.

**Real-Obsidian re-verification** (own Xvfb `:96`, own CDP port, scratch vault + udd —
`evidence-review/fix1-obsidian.log`, `evidence-review/21-after-pref-flip.png`). Same repro
as the finding: collapse one statblock, leave a second authored `collapsed: true`, toggle
**Enable dice rolling**.

```
PASS  H-1 both statblocks still visible, collapsed and expandable after the pref flip
      laidOut: [ {collapsed:on, bar:true, text:"Statblock: Human Bandit Chief", h:40, expand:true, panels:1},
                 {collapsed:on, bar:true, text:"Statblock: Goblin Sneak",       h:40, expand:true, panels:1} ]
PASS  H-1 the rebuilt collapsed element expands again   {collapsed:null, h:478, card:true, panel:1}
PASS  H-1 the project panel survives its own button click   {beforePanel:true, afterPanel:true, panels:1}
PASS  note still contains the authored keys and no framework writes
```

(The review's failing capture is `11-after-pref-flip.png`, two empty headings; the fixed
one is `21-after-pref-flip.png`, two collapsed one-liners with expand chevrons.)

## M-1 — CLOSED (made to work, not documented around)

`prepareModel` now **peels** leading `collapsed:`/`collapsible:`/`collapse_default:` lines
off the raw source and re-parses what is left — **strictly as a rescue in the existing
parse-failure catch**, so a body that already parses is never peeled and every YAML-mapping
element keeps popping the keys from parsed data byte-identically. If the re-parse also
fails, the ORIGINAL error propagates (the peel must never rewrite an unrelated syntax
error's message). The peeled keys win over the parsed reading and join the serializer's
re-emit list. `parseHandlesRawBody` and `acceptsWholeBlockRef` bodies get the peeled body
too, so `ds-scc`'s own messages describe what the author wrote.

Consequence: the round-3 "known gap" is closed — a whole-block reference **can** now be
authored collapsed. Verified in real Obsidian:

```
PASS  M-1 `collapsed: true` above an SCC code: no parse error card, starts collapsed
      {errors:0, parseErr:false, collapsed:"on", bar:"SCC reference: mcdm.heroes.v1/kit/panther"}
```

Worth recording: the prose half (`ds-rule`) is **not reachable in a real vault** — the
display families are `INTERNAL_DISPLAY_ELEMENTS`, registered only in the harness since
SC-149, which is the same fact that justifies the `ds-scc` reversal. The prose path is
still fixed (same code path, and a future public prose element would hit it), but the
user-facing half of M-1 is the reference body.

Docs corrected accordingly: `docs/common-element-fields.md`'s "One limitation worth
knowing" is replaced by "Blocks that aren't a list of fields" (write the field as the first
line, above the code or the prose — with both examples); the plugin CHANGELOG bullet says
the same in one clause; the spec's §"Known gap" and open question 1 are marked resolved.

## L-1 — CLOSED

`ElementChrome` gains an optional per-model `collapsible(ctx)` veto, ANDed with the
author's key (it can only ever remove the control). `withReference`'s lifted slot returns
false for `kind: 'invalid'` only, so a body that is not a reference at all keeps its notice
on screen, while a **well-formed but unresolved** reference keeps its collapse control (the
author's code is a real, nameable thing worth folding). Verified in real Obsidian:

```
PASS  L-1 invalid ds-scc: notice kept, no collapse control
      {notice:"`not a code at all` is not a full SCC co…", collapse:false, bar:false, collapsed:null}
```

## Can-fail proof

| Reverted | Result |
|---|---|
| `runAfterRender(this.rootEl)` in `update()` commented out | **9 of 21** cases in the new suite fail |
| the `chrome.collapsible?.(ctx)` veto dropped | the L-1 case fails |
| (M-1) — the new cases assert 0 error cards where `c15a4b4` measurably produced 1 (review §M-1) | |

## Battery at `410b28c`

| Gate | Result |
|---|---|
| `npm run tsc` | clean, rc 0 |
| `npm run lint` | clean, rc 0 |
| `npx jest` | **2993 passed / 1 skipped / 176 suites / 3 snapshots** (2972/175 → **+21, +1 suite**) |
| `npm run shots` | **366, 0 FAIL** |
| chrome placement | **OK — 7 element families, inset 10.00px, 0 border overlap** |
| print-twin parity | **OK — 91 capture ids byte-identical** |
| print-class coverage | OK (in-run assertion, no failures) |
| `check-freeze.sh` | **exactly the 10 sanctioned stamina lines, nothing else** — unchanged by this round |
| `rebaseline.txt` | still reproduces byte-for-byte from this sweep; twin == realprint per pair |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, rc 0 |

Zero print bytes moved: the re-mount is screen chrome and the peel only ever fires on a
body that used to error-card.

## One hazard found while running the battery (pre-existing, NOT introduced here)

**A built `main.js` at the plugin root silently shadows `main.ts` for jest, and jest
creates that file itself.** `visual-harness/entry.ts` imports `'../main'` (a relative
specifier, so the `'^main$'` → `<rootDir>/main.ts` moduleNameMapper entry does not apply),
and jest's default `moduleFileExtensions` puts `js` before `ts`. `test/unit/build/
cssNesting.test.ts` runs the production esbuild, which **writes `main.js`** — so every jest
run leaves behind the artifact that will shadow the source on the next one.

Measured: with a `main.js` present, the same tree reports **67 failures** across
`chromeRollout`, `visual-harness/fixtures` and `sidebarEncounterHandoff`
(`view.setAfterRender is not a function` — the stale bundle's classes); with it deleted,
green. This cost a false-red diagnosis mid-fix and will do the same to anyone who runs
`npm run build*` (or the battery twice) before jest.

Not fixed here (out of scope, and it touches the shared test config). The one-line remedy
is a `moduleNameMapper` entry alongside the existing one:

```js
'^\\.\\./main$': '<rootDir>/main.ts',
```

Worth its own FOLLOWUPS number. **Protocol until then: `rm -f main.js styles.css` before
`npx jest`** — every jest number in this report was measured that way.

## Cleanup

Probes removed; `main.js`/`styles.css` deleted again. The worktree is clean at `410b28c`
(`git status --porcelain` empty). Xvfb `:96` killed, no Obsidian processes left, `:1`
untouched. Fix-round evidence in `evidence-review/` (`20`/`21`/`22-*.png`,
`fix1-obsidian.log`, `fix1-shots.log`).
# SC-169 fix round 1 — scoped re-review (delta `c15a4b4..410b28c`)

**Branch:** `sc169-menu-panel` @ `410b28c` · **Worktree:**
`/home/scott/code/steelCompendium/worktrees/sc169-menu-panel/draw-steel-elements`
**Reviewer:** fresh eyes (did not write the findings and did not write the fix).
**Scope:** the fix-round delta only — 11 files, +794/−101. Everything below was executed.

## VERDICT: **LAND**

H-1 is genuinely closed, by the mechanism the fix claims and for the reason it claims. I
reproduced the original failure's exact trigger in jsdom **and** in real Obsidian (own Xvfb
`:97`, own CDP port, scratch vault + user-data-dir) across every rebuild path named in the
finding, including the one the author says his first attempt failed — the resolved
`ds-scc` → statblock reference. No accumulation, no note writes, no error cards. The
can-fail proof reproduces to the number (9 failures, all in the new suite). M-1 and L-1
behave as described, including the edges the fix round did not test. The battery reproduces
exactly.

Three LOW findings, none blocking. **L-B is a two-line docs edit I'd take before landing**
(it moves no code and re-runs no gate): the new user-doc section and the CHANGELOG clause
teach a `ds-rule` fence that is not registered in production.

---

## 1. H-1 — chrome survives a rebuild. **VERIFIED, in both engines.**

### Code shape (read, then executed)

- `ElementView.update()` (view.ts:190-199) ends in `runAfterRender(this.rootEl)` in **both**
  branches — the `onUpdate` branch no longer early-returns. ✔
- The hook is a `WeakMap<HTMLElement, () => void>` keyed on the **root node**
  (`AFTER_RENDER`, view.ts:654), not on the view. ✔
- `pipeline.ts:611` calls `registerAfterRender(root, …)` **before** `host.addChild(view)` and
  before `await view.mount(...)`; the first render's leg is run explicitly right after. ✔
- The keying claim is real, not decorative: with `makeHost('ds-feature')` capturing what the
  pipeline hands to `host.addChild`, the pipeline's view is a **`RefUnwrapView`**, and the
  `FeatureElementView`/`StatblockElementView` that subscribes to `rollingEnabled` is a CHILD
  mounted on the same root. A view-keyed hook would not fire for the reported repro. ✔

### The reported repro, jsdom

`collapsed: true` statblock + `deps.prefs.set('rollingEnabled', true)`, and the same with a
user-clicked collapse: attr `on`, bar present, expand button present, text
`Statblock: Human Bandit Chief`, `panels: 1`, `bars: 1` after every flip; clicking expand
gives back `.dse-sb` with the attribute gone.

Additional probes I wrote (not in the author's suite):

| Probe | Result |
|---|---|
| `ds-scc` → **resolved statblock** (`monster.goblin.statblock/goblin-stinker`) authored `collapsed: true`, then `rollingEnabled` **and** `rollClickToRoll` flips | `{attr:on, bar:true, text:"Statblock: Goblin Stinker", panels:1, bars:1}` after each; expand → `.dse-sb` back. **0 error cards.** |
| listener / Component accounting over 6 rebuilds | first mount `{added:4, removed:0, ownedChildren:2}` → after 6 rebuilds `{added:16, removed:12, ownedChildren:2}` ⇒ **4 live listeners, constant**; `panels:1, bars:1` |
| `replaceSource` spy across collapse + 3 rebuilds + expand, 700 ms past the debounce | **0 calls** |
| two pref flips fired in the same tick (concurrent `update()`s) | `{attr:on, bar:true, panels:1, bars:1}` — no doubling |
| `setCharacteristicProvider` | **not reachable on a pipeline-mounted view.** Its only caller is `hero/view.ts:754`, on a `FeatureElementView` that `ds-hero` constructs itself, mounted on a node inside the hero card — `runAfterRender` on that node finds no hook and no-ops. The review's H-1 table listed this path; it cannot destroy pipeline chrome either before or after the fix. |
| SidebarPanel path | `handleExternalChange`'s fast path is `previous.update(model)` on the mounted view ⇒ hook fires (pinned by the author's counter test). Its fallback does `panelEl.empty()` + a fresh `pipeline.run`, which builds a **new** root and registers a new hook — no stale-hook hazard. |

### The reported repro, REAL OBSIDIAN (own Xvfb `:97`, port 9297, scratch vault + udd; `:1` never touched)

Note with 6 blocks: an authored-`collapsed` statblock, a plain statblock (collapsed by a
real click on the chrome control), an authored-`collapsed` **resolved** `ds-scc` statblock
reference, an invalid `ds-scc`, an authored-`collapsed` well-formed-but-unresolved `ds-scc`,
and a `ds-project` tracker.

```
1-initial            [collapsed:on bar:true "Statblock: Human Bandit Chief" panels:1 h:40]
                     [collapsed:null ... h:701]
                     [collapsed:on bar:true "Statblock: Goblin Stinker"     panels:1 h:40]   <- ds-scc, resolved
                     [scc invalid: notice kept, collapseBtn:0, panels:0, collapsed:null]
                     [scc unresolved: collapsed:on "SCC reference: mcdm.heroes.v1/kit/nope-not-here"]
2-after-user-collapse  all three statblocks collapsed, one bar + one panel each
3-after-pref-flip      IDENTICAL — every bar present, h:40, expand button present
3b-after-3s            IDENTICAL (no flicker, no late self-heal needed)
4-after-6-rebuilds     IDENTICAL — panels:1 bars:1 on every root
5b-after-a-rebuild-following-an-authoringControls-flip
                       pencils:1 panels:1 bars:1 on every chrome-bearing root
6-after-expand         h 40 → 701 on both statblocks; card back
9-total-error-cards    0
```

The note: the two statblock fences and all three `ds-scc` fences are **byte-identical**
before/after every collapse, expand, pref flip and rebuild (diffed against the seed text).
The only change to the file is inside the `ds-project` fence, from the tracker button I
clicked deliberately.

Screenshots + raw results: `scratchpad/rr-shots/`, `rr-shots2/`, logs
`scratchpad/logs/obsidian-rr.log`, `obsidian-rr2.log`.

### Mutation

`runAfterRender(this.rootEl)` commented out, full `npx jest` (with the `rm -f main.js
styles.css` protocol):

```
Test Suites: 1 failed, 1 skipped, 175 passed
Tests:       9 failed, 1 skipped, 2984 passed
```

All 9 are `chromeRerender.test.ts` → "H-1 — chrome survives every rebuild path" (every case
in that describe). Matches the author's "9 of 21". Worth recording: **exactly one suite goes
red** — nothing else in 176 suites pins this behaviour, so that file is the whole guard.
Reverted; tree clean at `410b28c`.

## 2. `ensureCollapseInvariant(root)` — cannot fire spuriously

It is the **last statement of `mountPipelineChrome`**, run synchronously immediately after
`mountChromeFor`, and `mountChrome` creates the summary bar synchronously whenever
`collapsible` is true (mountChrome.ts:173). There is no await between the bar's creation and
the check, so there is no window in which a legitimately collapsed element is seen without
its bar. The only ways to reach the removal are (a) `collapsible` resolved false this render,
or (b) `mountChrome` early-returned (`!collapsible && items.length === 0`) — in both cases
the attribute is genuinely stale and dropping it is correct.

Executed: session says collapsed + block says `collapsible: false` → `{attr:null, bar:false,
panels:0}`, element renders expanded (not an invisible hole). Across all H-1 probes above the
attribute was never dropped while a bar existed.

## 3. M-1 — the peel. Rescue-only, verified; two edge gaps

**Byte-identity for bodies that parse.** `jest.spyOn(statblockElement, 'parse')` on a mapping
body whose first line is `collapsed: true`: the `source` argument is `=== ` the original
string, including the key line. The peel never ran. ✔

**Prose body / reference body.** `collapsed: true` + a two-paragraph prose `ds-rule` body →
0 error cards, `{attr:on, bar:true, text:"Rule"}`. `collapsed: true` + `scc.v1:…/kit/panther`
→ 0 error cards, `text:"Kit: Panther"`. The docs' exact example (**bare** code, no `scc.v1:`
prefix) → `{attr:on, text:"Kit: Panther", errs:0}`. `collapse_default: true` and
`collapsed: false` on prose behave correctly. `collapsible: false` on a reference body
removes the control. ✔

**Unrelated syntax error keeps its own message.** `name: {unclosed` alone →
"Flow map in block collection must be sufficiently indented and end with a } **at line 2**";
with `collapsed: true` prepended → the *same* message **at line 3** — i.e. the ORIGINAL
error, computed on the ORIGINAL source, so the line number still points at the user's file. ✔

**`collapsed: true` on line 2 of a prose body:** error card,
"Implicit keys need to be on a single line at line 1". Identical to the pre-existing failure
of *any* prose body containing a mid-body `word: word` line (`Note: this is prose.\nMore
prose.` fails the same way at `c15a4b4` and today). Not a regression; the docs say "the first
lines of the block", so the supported form is documented, the unsupported one is not called
out. Acceptable.

**L-A (LOW) — the peel misses CRLF and `True`.** Executed:

| source | peeled | result |
|---|---|---|
| `collapsed: true\r\nSome rule prose.\r\n\r\nSecond para.` | `{}` | **error card** (parse), no chrome, no collapse |
| `collapsed: true\r\nname: …` (mapping body) | n/a | fine — YAML handles CRLF, the rescue is never needed |
| `  collapsed: true\nprose` | `{}` | not peeled (deliberate: top-level only) |
| `collapsed: True\nprose` | `{}` | not peeled — **but a mapping body accepts `True`**, since YAML parses it as a boolean |
| `collapsed:true\nname: x` | `{collapsed:true}` | peeled (more lenient than YAML — harmless) |
| `collapsed: true\ncollapsed: false\nx` | `{collapsed:true}` | first wins, as documented |

`LEADING_KEY_LINE_RE` anchors on `[ \t]*$`, so a `\r` left by `split('\n')` defeats it. A
CRLF note (any file authored outside Obsidian on Windows) silently loses the whole M-1 fix
and gets the error card the round was written to remove. One-character fix
(`[ \t\r]*$`, or split on `/\r?\n/`); `True`/`False` is a second alternation. Both are
"the same three keys read two different ways depending on body shape", which is the exact
inconsistency M-1 set out to remove. Not a blocker: it fails closed (error card, same as
before the fix), and the mapping path is untouched.

**L-C (LOW) — a fold can now hide an error card.** `collapsed: true` + a body that parses
only after the peel and then fails at the reference stage *after* mount:

```
root: data-dse-collapsed="on"
children: ["dse-error-card", "dse-chrome-summary", "dse-chrome"]
```

The collapse rule hides every non-chrome child, so the reader sees a one-line bar and no
error. Recoverable — the expand chevron is right there — so this is not the H-1 shape. Its
user-facing cousin appeared in real Obsidian: an authored-collapsed **unresolved** `ds-scc`
folds its "Not installed locally." notice behind an honest `SCC reference: <code>` bar, which
the fix's own L-1 comment argues for deliberately. Flagging it only because it is the same
species as L-1 and could be closed the same way (a `collapsible` veto when root holds an
error card), if Scott wants the two answers consistent.

**Serializer re-emit of peeled keys is inert today**, by construction: the only bodies that
can be peeled belong to `ds-scc` (`serialize: undefined` via `withReference`) and the display
family (no `serialize`), so `withCollapseKeys` can never write a peeled key into a prose or
reference body. Good.

## 4. L-1 — the per-model veto. Verified, real Obsidian included

- `ElementChrome.collapsible(ctx)` is ANDed at pipeline.ts:607 —
  `collapsible && (chrome.collapsible?.(ctx) ?? true)` — so it can only remove. ✔
- `withReference`'s lifted slot returns `model.kind !== 'invalid'` — false for `invalid`
  **only**. ✔
- Invalid `ds-scc` (`not a code at all`), with the session ALREADY saying collapsed:
  notice kept ("`not a code at all` is not a full SCC code…"), `collapseBtn: 0`, no bar,
  `data-dse-collapsed` absent. Same in real Obsidian. ✔
- Well-formed but unresolved: keeps the control, collapses to
  `SCC reference: mcdm.heroes.v1/kit/nope-not-here`. ✔
- `collapsible: false` still wins everywhere: on a statblock (no control, no bar, no panel),
  on a prose body, on a reference body, on an invalid `ds-scc` (`errs: 0`, notice kept), and
  over a session value that says collapsed. ✔
- With `authoringControls` on, the invalid `ds-scc` gets a panel holding **only** the pencil
  and still no collapse control — the `!collapsible && items.length === 0` branch behaving
  as designed.

## 5. Docs / CHANGELOG / spec

- Spec §"Round-3 known gap" and open question 1 are both marked resolved and point at
  `peelLeadingCollapseKeys` + the new test file. Accurate.
- `docs/common-element-fields.md` → "Blocks that aren't a list of fields": the reference half
  is accurate, including the bare-code example (executed → "Kit: Panther", 0 errors), and
  "In a block that *is* a list of fields, a collapse field can go anywhere in the list" is
  true (`extractCollapseKeys` reads parsed data).
- **L-B (LOW, user-facing) — the `ds-rule` half of the new docs section and of the CHANGELOG
  clause describes a fence users cannot type.** `ruleElement` is in
  `INTERNAL_DISPLAY_ELEMENTS` (src/elements/display/index.ts:167), whose only registrar is
  `visual-harness/entry.ts:1023`; `main.ts` has not registered it since SC-149 — the fix
  report says so itself ("the prose half is not reachable in a real vault"), and then the
  user doc ships the example anyway. `docs/common-element-fields.md` is the **only** user doc
  in the repo that mentions `ds-rule`, and this delta introduced the mention. A reader who
  copies it gets an unrendered code block. Worse, its example body is a single paragraph,
  which even in the harness folds to a YAML scalar and takes the reference path (I measured a
  "Compendium not installed" card for `Some rule prose.` with and without the key) — so the
  example would not render a prose card even where the element exists.
  **Suggested edit (docs + CHANGELOG, no code):** keep the reference half, drop the rule
  half — "a compendium reference block, whose body is only the entry's code" — and leave the
  prose support as an unadvertised property of the framework.

## 6. Battery at `410b28c` (rm -f main.js styles.css before every jest)

| Gate | Expected | Measured |
|---|---|---|
| `npm run tsc` | clean | clean, rc 0 |
| `npm run lint` | clean | clean, no findings |
| `npx jest` | 2993 / 1 skipped / 176 | **2993 passed, 1 skipped, 176 suites, 3 snapshots**, rc 0 (load 1.0 at start) |
| `npm run shots` | 366 / 0 FAIL | **366 ok, 0 FAIL**, rc 0 |
| chrome placement | OK | **OK — 7 families, inset 10.00px, 0 border overlap** |
| print-twin parity | 91/91 | **OK — 91 capture ids byte-identical** |
| print-class coverage | OK | in-run assertion, no failure |
| `check-freeze.sh` | the 10 stamina lines | **exactly those 10 (5 twin+realprint pairs), nothing else**, rc 1 as expected |
| `rebaseline.txt` | reproduces | **byte-identical** to my own sha256 sweep (sorted diff empty) |
| twin == realprint | per pair | **OK for all 5 stamina pairs and all 6 new ids** |
| new capture ids vs the 144-line baseline | 0 collisions | **0** for `kit-collapsed`, `feature-collapsed`, `encounter-collapsed`, `chrome-hover-card`, `chrome-collapsed-rollout` **and** `chrome-legacy-keys` (6, not 5 — the sixth is from an earlier round on the same branch; also uncolliding) |
| `npm run parity` | 0/0/16 | **0 gaps / 0 undeclared / 16 declared**, rc 0 |

## 7. Nothing outside the delta; no shared-checkout writes

`git diff --stat c15a4b4..410b28c` = the 11 files listed in the fix report and nothing else.
The shared freeze baseline is untouched (144 lines, mtime 08-18 08:30, hours before this
session). Worktree is clean at `410b28c` (`git status --porcelain` empty).

Two process notes, neither caused by this delta or by me:
- M-2 is **resolved** — the main checkout's CHANGELOG.md/DESIGN.md edits are committed; the
  superproject now shows only the expected ` M draw-steel-elements` pointer.
- The main checkout's `draw-steel-elements` submodule is nonetheless dirty:
  ` M demo-vault/Welcome.md` + `?? compendium-manifest.json`, both mtime **08-18 08:30**
  (pre-session, from an earlier live-vault run). `deploy*` hard-aborts on a dirty tree, so
  someone should clean it.

## Follow-ups worth numbering

1. **L-A** — `peelLeadingCollapseKeys` misses `\r\n` line endings and `True`/`False`.
2. **L-B** — drop the `ds-rule` example from `docs/common-element-fields.md` and the
   CHANGELOG clause (unregistered element). *Recommended before landing; docs-only.*
3. **L-C** — a collapsed element can fold an error card / ref-notice out of sight; decide
   whether the L-1 veto should extend to "root rendered an error".
4. **FOLLOWUPS #77** (already filed) — the stale `main.js` shadow. Confirmed again here: it
   is written by `cssNesting.test.ts` on every jest run and by `build-no-check`.

## Cleanup

Probe test files removed from the worktree; `main.js`/`styles.css` deleted; worktree clean at
`410b28c`. My Xvfb `:97` killed (`/tmp/.X11-unix/` back to `X1` only), the Obsidian child it
spawned exited with it, `:1` never touched, scratch vault + udd left under
`/tmp/claude-1000/…/scratchpad/rr-vault` and `/tmp/claude-1000/dse-sc169-rereview-camera`.
Evidence: `scratchpad/logs/{jest-full,jest-mutation,shots,freeze,parity,obsidian-rr,obsidian-rr2}.log`,
`scratchpad/rr-shots*/`.

---

# Polish round (re-review findings L-A / L-B / L-C)

**Commit:** `062a109` on `sc169-menu-panel`, on top of the re-reviewed `410b28c`.
Written by the re-reviewer, at the coordinator's direction, from the repros above.

## L-A — CLOSED. The peel now agrees with the mapping reading by construction.

The first cut hand-wrote the value pattern as `(true|false)` anchored on `[ \t]*$`. The two
readings of the same three keys therefore disagreed, and I measured exactly where — `yaml`
v2 at its defaults, which is byte-for-byte what Obsidian's `parseYaml` ships:

| written | mapping body (`parseYaml`) | old peel | now |
|---|---|---|---|
| `true` / `false` | boolean | peeled | peeled |
| `True` `TRUE` `False` `FALSE` | **boolean** | **rejected** | peeled |
| `!!bool true`, `true # why` | boolean | rejected | peeled |
| `yes` `no` `on` `off` `y` `n` `1` | **string/number** ⇒ `extractCollapseKeys` warns and ignores | rejected | **left alone** (agrees) |
| `collapsed: true` in a **CRLF** body | boolean (the parser handles CRLF) | **rejected** ⇒ parse-error card | peeled |
| `collapsed:true` (no space) | not a mapping at all | peeled | **left alone** (agrees) |

Implementation: the candidate line is now PARSED with the same `parseYaml`, and accepted only
when it yields exactly `{<key>: <boolean>}` — so there is no second vocabulary to keep in
sync. A trailing `\r` is stripped before the test (a lone `\r` is part of the scalar:
`parseYaml('collapsed: true\r')` is `{collapsed: 'true\r'}`), and the surviving lines keep
their own, so a CRLF body is handed on byte-identically apart from the peeled lines.
One narrowing, deliberate: `collapsed:true` is no longer rescued, because YAML does not read
it as a key either — that leniency was the accident, not the contract.

**Tests (+4, all in `chromeRerender.test.ts`'s M-1 describe):** every boolean spelling
accepted and every non-boolean left alone; CRLF peel with a byte-identical remainder plus the
lone-`\r` whole-document case; a CRLF prose body rendering collapsed with 0 error cards; and
`collapsed: True` reaching the SAME collapsed state on a mapping body and on a `ds-scc`
reference body.

**Can-fail:** restoring the old line reading (literal `(true|false)`, `[ \t]*$`) fails
**exactly those 4** and passes the other 21.

## L-B — CLOSED. No user doc names an internal fence.

`docs/common-element-fields.md` → "Blocks that aren't a list of fields" and the plugin
CHANGELOG bullet now describe only the compendium-reference case. The `ds-rule` example is
gone from both: `ruleElement` has been in `INTERNAL_DISPLAY_ELEMENTS` since SC-149 (registered
only by `visual-harness/entry.ts`), so the example told users to write a fence that renders as
a plain code block. The framework still supports a prose body — it is simply no longer
advertised. `docs/` now contains no mention of `ds-rule`.

## L-C — RULED, no change.

A collapsed element can fold an error card / ref-notice out of sight. Left as-is: the expand
chevron recovers it, and it is consistent with "collapse hides the body". Recorded here so the
next reader knows it was decided rather than missed.

## Gates at `062a109`

Test/docs-only plus one function's line reading — no CSS, no element DOM, no fixture, no
harness file. I ran the visual gates anyway rather than argue from the file list:

| Gate | Result |
|---|---|
| `npm run tsc` | clean, rc 0 |
| `npm run lint` | clean |
| `npx jest` (rm protocol) | **2997 passed / 1 skipped / 176 suites / 3 snapshots**, rc 0 (2993 → **+4**) |
| `npm run shots` | **366 ok, 0 FAIL**, rc 0 |
| chrome placement | OK — 7 families, 10.00px, 0 overlap |
| print-twin parity | OK — 91 capture ids byte-identical |
| `check-freeze.sh` | **exactly the same 10 stamina lines**, nothing else — unmoved by this round |
| `rebaseline.txt` | still reproduces byte-for-byte from this sweep |
| `npm run parity` | **0 gaps / 0 undeclared / 16 declared**, rc 0 |

Touched files (4): `src/framework/chrome/collapsedKey.ts`,
`test/dom/framework/chromeRerender.test.ts`, `docs/common-element-fields.md`, `CHANGELOG.md`.
Worktree clean at `062a109`; `main.js`/`styles.css` deleted; no shared-checkout writes; the
freeze baseline untouched.

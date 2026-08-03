# SC-112: User-Customizable Fonts (settings UI + size scales) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking. Gate mechanics (command shapes, devbox wrapping,
> exit-code footguns, freeze/parity semantics) live in the workspace **`dse-verify` skill** —
> read it before running any gate; this plan does not restate them. Evidence conventions
> (inline before/after screenshots on the Linear issue) live in the **`linear-flow` skill**.

> **STATUS 2026-08-02: DRAFT — awaiting Scott's go-ahead.** Written against
> `draw-steel-elements` main @ `ccf465e` (SC-105 six-slot vocabulary + Source Serif 4 400
> landed). Baselines verified today: jest **2022 / 144 suites** (exit 0, main checkout) ·
> freeze baseline **101** hashes · parity expectation **0 GAPs / 10 WARNs / exit 0** ·
> token union **73** (`tokens.test.ts:75`), Steel **66 overridden / 7 invariant**
> (`token-coverage.test.ts:267-268`), Print **52 / 21** (`:275,279`). Shots **169** /
> obsidian-shots **132** are the dse-verify skill's numbers at `0a3ce4d` — re-verify in
> Task 1 Step 1. Binding design decisions: `.superpowers/sdd/sc112-decisions.md`
> (Scott, 2026-08-02) — this plan implements them, it does not reopen them.
>
> **RULING 2026-08-02 (Scott):** resolves Self-review risk #1 below ("Fonts-are-Steel-only
> is an inference, not a ruling") — it is no longer open. The legacy plugin shipped with
> zero font options and simply inherited the Obsidian vault fonts; that behavior IS the
> product's default, not a Steel-only fallback. Two consequences, both folded into this
> plan: **(1)** every one of the six font pickers gets an explicit first/default option
> labeled **"Default (Obsidian vault fonts)"** — this is today's `var(--font-text)`
> resolution, it writes no override, and it is what Legacy renders no matter what else
> ships (Task 6 Step 3, Task 8 Step 3). **(2)** whether non-default overrides should ALSO
> reach Legacy renders is not decided here — it's an explicit investigate-then-gate: cheap
> → ship it, expensive → skip it. That investigation is new **Task 5**; its SHIP/SKIP
> verdict is a load-bearing input to Task 6's and Task 8's help text and DoDs (both are
> written below to cover either outcome).

**Goal:** Ship the SC-112 preference surface the SC-105 vocabulary was built for: six
user-settable font slots (3 primary pickers — Title / Body / Controls; 3 advanced —
Card-body / Label / Mono, defaulting to "same as X" chains), font selection by **dropdown**
(with a `queryLocalFonts()` spike deciding whether it lists installed fonts), two size
sliders mirroring the site exactly (Text 0.6–1.4, Card 0.8–1.2, step .05, symmetric about
1.0), and the one deliberate visual change: **Controls' default flips from ambient sans to
"same as Body" serif** (including the plan-22 stepper exclusion re-pointing to the chain).

**Architecture:**

- **Write mechanism — css-bearing pref descriptors, stamped per-root by `reflect()`.**
  Prefs currently reach CSS exclusively as `data-dse-*` attributes: `PrefDescriptor.attr`
  (`src/framework/seams/prefs.ts:29`) is stamped on every element root by `reflect()`
  (`prefs.ts:189-197`), called from the pipeline (`src/framework/pipeline.ts:381`).
  Attributes cannot carry arbitrary font-family strings or numeric factors, so this plan
  extends the same seam rather than inventing a parallel one: `PrefDescriptor` gains an
  optional `css: { varName: string; toCss(value): string | null }` slot, and `reflect()`
  writes `rootEl.style.setProperty(varName, css)` when `toCss` returns a string, and
  `removeProperty` when it returns `null` (the default/sentinel case) — the exact
  remove-on-default semantics the site uses (`v2/docs/javascripts/settings-panel.js:80-103`),
  but **per element root, never `document.documentElement`**, preserving the per-root /
  popout-safe stamping architecture (`src/framework/seams/theme.ts:16-17`). Inline custom
  properties on the root override both the Legacy `:root` token base
  (`styles-source.css:2993-2997`) and the Steel block (`:3166-3169`) for that root's
  subtree — no new stylesheet, no specificity games, no per-window `<style>` injection.
  `ThemeService` is NOT the vehicle: it owns exactly one attribute (`theme.ts:10-12`) and
  the pref catalog already owns descriptor-driven reflection. No new "PrefCss seam" module
  is needed — this is `reflect()`'s existing job, widened by one field.
- **Modals:** `DseModal.open()` stamps only the theme attribute today
  (`src/framework/kit/managedModal.ts:96-102`, via the SC-104 `WeakMap<App, ThemeService>`
  registry, `theme.ts:132-145`). Without a twin for prefs, a user's font choices would skip
  every modal (`.dse-modal` is a first-class member of the Steel token scope,
  `styles-source.css:3144`). Task 2 adds the mirrored `registerPrefsForApp`/`prefsForApp`
  WeakMap in `seams/prefs.ts` plus a narrow `reflectCss(rootEl, owner)` store method
  (css-bearing descriptors only — modals must NOT receive the attr prefs like
  `data-dse-density`), called from `DseModal.open()` beside the theme stamp.
- **Fonts default to the vault; whether overrides reach Legacy is gated, not assumed.**
  Every `--dse-font-*` *consumer* rule is Steel-scoped today
  (`[data-dse-theme='steel']:not([data-dse-print="on"])` — Body `:3487`, Card-body `:3498`,
  titles `:3433` etc.), so at the current selectors the pickers move pixels under Steel
  only; under Legacy the tokens resolve but nothing consumes them, and Obsidian's own
  appearance settings govern. Per Scott's 2026-08-02 ruling this status quo is exactly what
  the **"Default (Obsidian vault fonts)"** option promises everywhere — Legacy is never
  worse off than today regardless of the gate outcome. Task 5 investigates whether widening
  the same consumer selectors to be theme-agnostic (dropping the `[data-dse-theme='steel']`
  qualifier, keeping the print exclusion) is a contained, freeze-safe change; if it is,
  Task 5 ships it and non-default picker choices reach Legacy too. If it isn't (a sprawl of
  inheritance exclusions or a freeze break), Task 5 skips it, pickers stay Steel-scoped for
  non-default choices, and the Default option's help text says so explicitly. Either
  outcome is a valid, recorded completion — see Task 5.
- **Scales are theme-independent** (site precedent: `--sc-content-scale`/`--sc-card-scale`
  apply regardless of site theme, `v2/docs/stylesheets/extra.css:16-21,61`): two new tokens
  `text-scale`/`card-scale` (default `1` in `:root`), consumed by theme-unscoped but
  **print-excluded** rules — text scale as a `font-size: calc(1em * var(--dse-text-scale))`
  multiplier on element roots (adapting the site's `calc(0.8rem * var(--sc-content-scale))`
  to the plugin's inherited-em sizing), card scale as `zoom: var(--dse-card-scale)` on the
  card hosts (the site's exact mechanism for `.sb-wrap`, `extra.css:61`). Print never
  scales (`:not([data-dse-print="on"])` on the consumers keeps the frozen
  `*--steel-print.png` set safe **by construction**, not just at default values).
- **The Controls flip is a value change, not a selector change:** `:root`'s
  `--dse-font-controls: var(--font-text)` (`:2997`) becomes `var(--dse-font-body)` — a
  byte-identical resolution under Legacy (Body is `var(--font-text)` there) and the serif
  face under Steel (the visible change). The frozen steel-print shots are protected by
  pinning `--dse-font-controls: var(--font-text)` in the neutral print block (`:5316`).
  The four `font: inherit` kit controls (`.dse-btn:4669`, `.dse-collapse__header:4801`,
  `.dse-tabs__tab:4840`, `button.dse-pr__row:5016`) are re-pointed to the token so the
  Controls picker actually governs them (SC-105 deferred exactly this call —
  `docs/superpowers/dse-overhaul/build-ledgers/sc105-font-tokens-design.md` §1 "The
  Controls decision").
- **Slot independence has two known CSS debts to pay before pickers can diverge values**
  (both documented in-code as deferred-to-SC-112): the Body-vs-Card-body specificity race
  (`styles-source.css:3471-3486` — the Body rule's `(0,4,0)` compound beats the Card-body
  rule's `(0,3,0)` on feature/featureblock roots), and the ~9 Label-shaped consumers that
  ride the Body/Card-body ambient with no explicit `font-family`
  (sc105-font-tokens-design.md §1.B — they must graduate to
  `font-family: var(--dse-font-label)` pins or the Label picker silently does nothing for
  them). Both fixes are pixel-no-ops at defaults because the chains make all slots resolve
  identically today.

**Tech Stack:** TypeScript (`src/framework/seams/prefs.ts`, `src/prefs/catalog.ts`,
`src/views/SettingsTab.ts`, `src/framework/kit/managedModal.ts`, `src/framework/tokens.ts`);
CSS (`styles-source.css`); jest (`unit` + `dom` projects); the visual harness + real-Obsidian
CDP camera (`visual-harness/obsidian-camera.mjs`) for the spike and evidence shots.

---

## Global Constraints

- **LEGACY-FREEZE is absolute — freeze stays 101/101** after every task. Never rebaseline.
  Command shape + semantics: the **dse-verify skill**. The Controls flip (Task 3) is a
  *steel-dark/steel-light* change only — those shots are not frozen; if freeze trips, a
  rule leaked into legacy/print scope. Fix the scope, never the baseline.
- **Parity stays 0 GAPs / exactly the documented 10 WARNs / exit 0** after every task that
  touches Steel CSS (Tasks 3, 4, 6). WARN-set semantics: dse-verify skill.
- **All commands run devbox-wrapped with absolute paths** per the dse-verify skill —
  including its exit-code footgun rules (gate command LAST in the `bash -c` string; no
  `$PIPESTATUS`).
- **`npm run tsc` clean and the full `npx jest` suite green after every task** (baseline
  2022/144 — new tests raise the count; record actuals per task).
- **Never touch the print exclusion pattern** (`:not([data-dse-print="on"])`) on existing
  rules; every NEW font/scale consumer rule that could move print pixels must carry it.
- **Defaults must reproduce today's look** (the D4 legacy-fidelity bar,
  `src/prefs/catalog.ts:13-14`, guarded by `test/unit/prefs/catalog.test.ts:22`) — with the
  ONE sanctioned exception this plan exists to ship: the Steel-screen Controls default
  flip, whose before/after evidence is mandatory (Task 3).
- **Every pref default stays a primitive** (`catalog.ts:19-21` — the sparse-persist strict
  equality invariant, `seams/prefs.ts:163`). The font sentinels are `''` (string), the
  scale defaults `1` (number) — both primitives.
- **No AI/Claude attribution or co-author trailers** in any commit message.
- **Worktree required; stop condition: do NOT land.** From the workspace root:
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/workspace && just wt-new sc112-fonts'`
  → work in `/home/scott/code/steelCompendium/worktrees/sc112-fonts/draw-steel-elements`
  (branch `sc112-fonts`); `npm ci` first. Finish, report, post evidence to SC-112 per the
  linear-flow skill. Scott lands with `just wt-finish sc112-fonts` from the MAIN checkout.

---

### Task 1: Feasibility spike — `queryLocalFonts()` inside Obsidian's Electron

**Files:** No product code. Output = a spike ledger at
`docs/superpowers/dse-overhaul/build-ledgers/sc112-qlf-spike.md` (workspace repo) + the
Task 8 outcome selection. Scratch probe code stays out of the commit.

The dropdown decision (`sc112-decisions.md` §3) hinges on whether Chromium's
`queryLocalFonts()` is exposed, permitted, and useful inside Obsidian's Electron. The
camera already attaches to a real spawned Obsidian over raw CDP and runs
`Runtime.evaluate` in the app page (`visual-harness/obsidian-camera.mjs:20-24,230`), and
CDP's `Runtime.evaluate` accepts `userGesture: true` — which matters because the API
requires transient user activation.

- [ ] **Step 1: Re-verify baselines in the worktree.** After `npm ci`: `npm run tsc`
  (clean), `npx jest` (expect 2022/144), `npm run shots` + freeze check (expect
  `freeze OK (101/101 …)`), `npm run parity` (0/10/exit0), `ls visual-harness/shots/*.png | wc -l`
  (expect 169; if drifted, record actual and why). Record all numbers in the ledger.
- [ ] **Step 2: Probe availability.** Adapt the camera's spawn+CDP client (or run the
  camera with a temporary probe — either way, throwaway code) to evaluate, in the real
  Obsidian page: (a) `typeof window.queryLocalFonts`; (b)
  `navigator.permissions.query({ name: 'local-fonts' })` state (wrap — the name may throw
  in older Chromium); (c) `await queryLocalFonts()` **with** `userGesture: true` — record
  resolved count and 3 sample `{family, fullName, style}` entries, or the exact rejection
  (`SecurityError` / `NotAllowedError` / permission prompt behavior); (d) the same call
  **without** the gesture flag, to characterize the activation requirement. Electron only
  consults a session permission-request handler if the app registered one — record which
  behavior Obsidian actually exhibits, don't assume.
- [ ] **Step 3: Write the verdict + select the Task 8 path.** In the ledger: raw evidence
  from Step 2, Obsidian version probed, and ONE of:
  - **Outcome A — usable:** the Task 8 font control gains a "List installed fonts" flow:
    dropdown initially shows the curated list; a click affordance (satisfying user
    activation) calls `queryLocalFonts()`, de-duplicates by `family`, sorts, and merges
    into the dropdown for the session. Must be feature-detected (`'queryLocalFonts' in
    window`) — the plugin is NOT desktop-only (`manifest.json` `isDesktopOnly: false`),
    and mobile WebViews lack the API entirely.
  - **Outcome B — unusable (absent, denied, or empty):** dropdown = bundled face
    ("Source Serif 4") + curated common list + "Custom…" free-text escape hatch. This is
    also Outcome A's fallback branch, so **Task 8 builds the curated+Custom control
    unconditionally; Outcome A only adds the population flow.**
- [ ] **Step 4: Commit the ledger** (workspace repo, not the submodule):
  `docs(sc112): queryLocalFonts spike verdict for the font dropdown`.

**Verification:** ledger exists with raw CDP output pasted; baseline numbers recorded; no
product-code diff in the plugin worktree (`git status` clean in the submodule).

---

### Task 2: Seam — css-bearing pref descriptors (`reflect()` writes custom properties)

**Files:** Modify `src/framework/seams/prefs.ts`, `src/framework/kit/managedModal.ts`,
`main.ts` (one registration call); add `test/unit/framework/prefsCss.test.ts` (or extend
the existing prefs seam suite — follow the repo's current suite layout).

- [ ] **Step 1: Extend `PrefDescriptor`** (`seams/prefs.ts:25-32`) with
  `css?: { varName: string; toCss(value: DsePrefs[K]): string | null }` — `varName` the
  full custom-property name (e.g. `'--dse-font-title'`), `toCss` returning `null` for
  "default — remove the override". Keep `K` correlation as `attr`/`default` do.
- [ ] **Step 2: Teach `reflect()`** (`prefs.ts:189-197`) to stamp css-bearing descriptors
  alongside attr-bearing ones: on initial reflect and on every subscribe callback,
  `toCss(value)` → `rootEl.style.setProperty(css.varName, v)` or
  `rootEl.style.removeProperty(css.varName)`. Same owner-scoped subscription lifecycle as
  attrs.
- [ ] **Step 3: Add `reflectCss(rootEl, owner)`** to `PreferenceStore` — identical loop
  restricted to css-bearing descriptors (no `data-dse-*` stamping). Add the
  `WeakMap<App, PreferenceStore>` registry (`registerPrefsForApp`/`prefsForApp`) mirroring
  `theme.ts:132-145` verbatim (same doc-comment rationale: modals only carry `app`).
  Register in `main.ts` right beside `registerThemeServiceForApp`.
- [ ] **Step 4: Wire `DseModal.open()`** (`managedModal.ts:96-102`): after the theme stamp,
  `prefsForApp(this.app)?.reflectCss(this.dialogEl(), this.lifecycle)` — graceful no-op on
  a bare test App, matching the theme lookup's contract.
- [ ] **Step 5: Tests.** Unit-test with a stub descriptor: set → inline var present on the
  root; set back to default → `removeProperty` ran (style attribute clean, matching the
  site's remove-on-default semantics); subscription re-stamps on change; `reflectCss`
  stamps css vars but NOT attrs; modal wiring covered via the registry (register a store,
  open a `DseModal` against a stub App per the existing managedModal test pattern —
  check `test/` for its current suite before writing a new harness).
- [ ] **Step 6: Gates + commit.** tsc clean · jest green (record new count) · shots +
  freeze 101/101 (no descriptor carries `css` yet — provably inert) ·
  `git commit -m "feat(prefs): css-bearing descriptors — reflect() writes per-root custom properties (SC-112)"`.

**Verification:** new tests fail if `setProperty`/`removeProperty` calls are dropped;
freeze/parity untouched (no catalog changes yet).

---

### Task 3: The Controls default flip — "same as Body" serif (THE visible change)

**Files:** Modify `styles-source.css`, `test/dom/framework/token-coverage.test.ts`,
`test/dom/framework/theme-steel.test.ts`, `test/dom/framework/theme-print.test.ts`,
`test/dom/kit/tokens.test.ts`, `test/dom/theme/steelTypography.test.ts`.

This is the one deliberate pixel change (`sc112-decisions.md` §1). Scope: Steel
**screen** only. Legacy resolves byte-identically; print is explicitly pinned sans.

- [ ] **Step 1: Capture the BEFORE evidence.** From the untouched worktree state, copy the
  stepper-bearing steel shots aside (at minimum `hero--steel-dark.png` and
  `initiative--steel-dark.png`, plus one steel-light twin) to an evidence dir outside
  `shots/` (they'd be overwritten). These are the "before" halves for the linear-flow
  inline pair.
- [ ] **Step 2: Flip the chain.** `:root` (`styles-source.css:2997`):
  `--dse-font-controls: var(--font-text)` → `var(--dse-font-body)`; rewrite the trailing
  `/* Steel/Print invariant — join font-mono */` comment (now wrong) to state the SC-112
  ruling: Controls defaults to "same as Body" — serif under Steel screen, ambient under
  Legacy, pinned sans in print. Update the stale "deliberately ABSENT here
  (Steel-invariant, joins font-mono)" comments in the Steel block (`:3163-3165`) and the
  token-block invariance note (`:3142-3143`).
- [ ] **Step 3: Pin print.** Add `--dse-font-controls: var(--font-text);` to the neutral
  print block (`[data-dse-element][data-dse-print="on"]`, `:5316`) with a comment naming
  the freeze as the reason. Do NOT add it to the Steel print twin (`:5378`) — the neutral
  block already covers both.
- [ ] **Step 4: Re-point the four `font: inherit` controls.** Extend the existing
  Steel-scoped stepper exclusion rule (`:3576-3579`) — or add a sibling rule in the same
  pattern — so `.dse-btn`, `.dse-collapse__header`, `.dse-tabs__tab`, and
  `button.dse-pr__row` get `font-family: var(--dse-font-controls)` under
  `[data-dse-theme='steel']:not([data-dse-print="on"])`. Leave their kit-base
  `font: inherit` declarations (`:4669,4801,4840,5016`) untouched (Legacy behavior
  unchanged). At the flipped default this is pixel-neutral for buttons/tabs/collapse/pr-row
  (they already inherit the serif ambient — sc105-font-tokens-design.md §1B); it exists so
  the Controls picker governs them once values can diverge. Rewrite the stepper rule's
  now-stale "byte-identical value … pure rename" comment (`:3570-3575`).
- [ ] **Step 5: Update the guards.** `token-coverage.test.ts`: `LEGACY_MAP:196`
  `'font-controls': 'var(--dse-font-body)'`; remove `font-controls` from
  `PRINT_INVARIANT` (`:151`, set size 21→20 at `:279`); print overridden 52→53 (`:275`);
  Steel counts unchanged (66/7 — `font-controls` legitimately stays in `STEEL_INVARIANT`
  `:143`: still no Steel-block definition; fix its "always sans" comment `:140-141`).
  `theme-steel.test.ts` (`:70-73,100,109` region) and `theme-print.test.ts` (`:139`):
  update the mirrored sets/values the same way. `tokens.test.ts:104`:
  `rootValue('font-controls')` → `'var(--dse-font-body)'`. Extend the
  `steelTypography.test.ts` chain-contract suite (`:223-252`) with the Controls chain
  (`--dse-font-controls: var(--dse-font-body)` in `:root`) and the print pin
  (`var(--font-text)` in the print block). **Prove one can fail:** temporarily revert the
  `:root` flip, watch the new assertion fail, restore.
- [ ] **Step 6: Gates.** tsc · jest · shots · **freeze 101/101** (the load-bearing check:
  print pinned + legacy byte-identical) · **parity 0/10/exit0** (steppers have no site
  counterpart pair; if a WARN/GAP appears, the re-point leaked somewhere it shouldn't).
- [ ] **Step 7: AFTER evidence + visual verdict.** Read the regenerated
  `hero--steel-dark.png` / `initiative--steel-dark.png` (+ light twin) against the Step 1
  copies: stepper digits now serif; buttons/tabs/collapse visually unchanged. One-line
  verdict per shot in the task report. Keep both halves for the Task 9 Linear comment
  (linear-flow: pair posted inline BEFORE flagging Needs Review).
- [ ] **Step 8: Commit.**
  `git commit -m "feat(steel): Controls slot defaults to 'same as Body' — steppers join the serif; print pinned sans (SC-112)"`.

**Verification:** freeze 101/101 proves legacy+print byte-frozen; the before/after pair
proves the intended steel-screen change and nothing else.

---

### Task 4: Slot independence — pay the two deferred CSS debts (visual no-op)

**Files:** Modify `styles-source.css`, `test/dom/theme/steelTypography.test.ts`.

At current defaults every slot resolves identically, so both fixes must land as pixel
no-ops — but without them the Task 6 pickers would lie (Card-body divergence ignored on
feature/featureblock roots; Label divergence ignored everywhere).

- [ ] **Step 1: Fix the Body/Card-body specificity race** (documented at
  `styles-source.css:3471-3486`). Give the Card-body rule (`:3498-3501`) a compound form
  that actually matches the feature/featureblock ROOTS (the current descendant form
  `[data-dse-theme='steel'] :is(…)` cannot match a root that carries the theme attr
  itself) and beats/ties-after the Body rule's `(0,4,0)` compound (`:3487-3489`) — e.g.
  `[data-dse-theme='steel']:not([data-dse-print="on"]):is([data-dse-element='feature'],[data-dse-element='featureblock']):not([data-dse-error-stage])`
  placed after the Body rule, keeping the existing descendant forms for the inner
  `.dse-sb`/`.dse-card` hosts. **Verify the DOM reality first** (which nodes carry
  `data-dse-theme` vs `.dse-sb`/`.dse-card`; nested by-SCC feature roots) against the
  harness DOM, then prove divergence works: set `--dse-font-card-body` to a visibly
  different family via devtools/harness override and confirm feature/featureblock/statblock
  bodies follow Card-body while a non-card family (e.g. encounter) follows Body. Update
  the `:3471-3486` comment — the deferral is paid.
- [ ] **Step 2: Graduate the Label consumers.** Add Steel-scoped
  (`:not([data-dse-print="on"])`) `font-family: var(--dse-font-label)` pins for the
  inherited-ambient Label set from sc105-font-tokens-design.md §1.B: chip/eyebrow rules
  (`.dse-head__eyebrow--chip`/`--line`), `.dse-section__title` (all 3 occurrences),
  statgrid labels (`.dse-sb__item-l`, `.dse-sb__kv-l`), the roster header row,
  `.dse-pr__head`, tier-badge text, and the EV/cost chip (`.dse-head__deck--chip`) —
  re-grep each selector's current line before editing; the §1.B list is the checklist,
  the file is the truth. No-op at defaults (Label chains to Title; Title==Body face
  today).
- [ ] **Step 3: Contract tests.** Extend `steelTypography.test.ts`: (a) the Card-body rule
  contains the root-compound feature/featureblock form (source-text assertion, same
  comment-stripped/quote-tolerant machinery); (b) a Label-routing assertion — at least
  `.dse-section__title` and one statgrid label carry
  `font-family: var(--dse-font-label)` under Steel scope. Prove each can fail
  (revert-fail-restore), then keep.
- [ ] **Step 4: Gates + commit.** tsc · jest · shots · freeze 101/101 · parity 0/10/exit0
  (the Label pins touch parity-mapped nodes — section-head/pr-head WARN composition must
  stay exactly the documented 10) · visual spot-read of `statblock--steel-dark.png` +
  `feature--steel-dark.png` (unchanged) ·
  `git commit -m "feat(steel): make the six font slots independently routable — card-body root compound + label pins (SC-112)"`.

**Verification:** freeze+parity prove the no-op; the Step 1 divergence probe proves the
slots actually separate.

---

### Task 5: Legacy-support investigation + gate — do user overrides reach Legacy renders?

**Files:** No product code by default. Output = an investigation ledger at
`docs/superpowers/dse-overhaul/build-ledgers/sc112-legacy-font-gate.md` (workspace repo),
following Task 1's ledger pattern. If the verdict is SHIP: also modify
`styles-source.css` (widen the Steel-scoped `--dse-font-*` consumer selectors — Body
`:3487`, Card-body `:3498`, titles `:3433`, and the Controls/Label/Mono siblings, per
Task 3/Task 4's final selector shapes — to be theme-agnostic, keeping every
`:not([data-dse-print="on"])` exclusion) and the matching guard tests
(`token-coverage.test.ts` LEGACY_MAP/STEEL_INVARIANT sets, `theme-steel.test.ts`,
`steelTypography.test.ts`) wherever a Steel-only assertion becomes theme-agnostic.

Per Scott's 2026-08-02 ruling this is an investigate-then-gate, not a commitment either
way. **"Default (Obsidian vault fonts)"** — the option every picker gets (Task 6 Step 3,
Task 8 Step 3) — already covers the do-nothing case identically under both themes, so this
task's only open question is whether NON-default picker choices should also move Legacy
pixels.

- [ ] **Step 1: Confirm the current Legacy surface.** Re-grep (line numbers drift) each of
  the six slots' Steel-scoped consumer rules as landed by Task 3/Task 4. Confirm Legacy has
  no explicit font-family consumer rule for any slot — Obsidian's own CSS governs by
  inheritance, exactly as the Architecture note states. List the full rule set that would
  need widening.
- [ ] **Step 2: Prototype the theme-agnostic rewrite.** For each listed rule, drop the
  `[data-dse-theme='steel']` qualifier and keep `:not([data-dse-print="on"])`. Because
  every slot's `:root` default already resolves to `var(--font-text)` — directly (Title,
  Body) or via chain (Controls → Body per Task 3; Card-body/Label → Body/Title per Task 4;
  Mono → `var(--font-monospace)`) — the widened rule's computed value at default prefs
  should be byte-identical to what Obsidian already supplies Legacy via inheritance: a
  computed no-op.
- [ ] **Step 3: Prove or disprove the no-op.** Run the full battery (dse-verify skill) with
  the widened selectors live, at DEFAULT prefs. **Freeze 101/101 is the proof** — it
  renders exactly this surface. Enumerate every case that does NOT hold byte-identical
  (nested contexts, mono/code spans, any Legacy-side rule that already sets its own
  `font-family` and would now lose to the widened rule, popout windows via the per-root
  stamping architecture) — each needs its own `:not(...)` exclusion, added and re-tested
  one at a time.
- [ ] **Step 4: Apply the gate and record the verdict.**
  - **Contained** (freeze holds at 101/101, and the Step 3 exclusion list is short and
    enumerable — Scott's bar: "easy add-in") → **SHIP:** keep the widened selectors + their
    exclusions; extend the guard tests to match; update Task 6 Step 3's and Task 8 Step 3's
    help text to state fonts apply under both Steel and Legacy; record "SHIP" + the
    exclusion list + freeze/parity numbers in the ledger.
  - **Sprawling** (freeze breaks and stays broken across a growing exclusion list, or the
    exclusions don't converge — Scott's bar: "a ton of work") → **SKIP:** revert to the
    Steel-scoped-only selectors (status quo, zero code diff from Task 4's end state);
    pickers stay Steel-only for non-default choices; the "Default (Obsidian vault fonts)"
    option's help text (Task 6 Step 3, Task 8 Step 3) states Legacy always uses the vault
    fonts, regardless of any picker selection; record "SKIP" + the evidence that tripped it
    in the ledger.
  - Both are valid completions of this task — the ledger states which was chosen and why.
- [ ] **Step 5: Gates + commit.** tsc · jest · shots · **freeze 101/101** (mandatory either
  way — SHIP must prove it holds with the widened rules live; SKIP proves nothing moved,
  since the revert restores Task 4's end state) · parity 0/10/exit0 if CSS changed · commit
  the ledger (workspace repo):
  `docs(sc112): Legacy font-override investigation verdict (SHIP|SKIP)`; if SHIP, a second
  commit in the submodule:
  `feat(steel): widen font-slot consumer rules to apply under Legacy too (SC-112)`.

**Verification:** ledger records the enumerated rule set, the Step 3 evidence (freeze
numbers with the widened rules live), and an unambiguous SHIP/SKIP verdict; Task 6 and
Task 8's help text/DoDs are written below to already match whichever verdict lands — no
follow-up edit to this plan needed once Task 5 completes.

---

### Task 6: Font-slot pref descriptors + curated list + sanitizer

**Files:** Modify `src/prefs/catalog.ts`; add `src/prefs/fontStacks.ts` (curated list +
value builder + sanitizer); extend `test/unit/prefs/catalog.test.ts` + a new unit suite
for the sanitizer/builder.

- [ ] **Step 1: Augment `DsePrefs`** (catalog.ts module augmentation, `:25-46`) with six
  string prefs: `fontTitle`, `fontBody`, `fontControls`, `fontCardBody`, `fontLabel`,
  `fontMono` — default `''` = the **"Default (Obsidian vault fonts)"** sentinel (Scott's
  2026-08-02 ruling; maps to `toCss → null`, i.e. no inline override; the CSS chains from
  Tasks 3-4, and Task 5's consumer selectors, govern what actually resolves).
- [ ] **Step 2: `fontStacks.ts`.** (a) `sanitizeFamily(input)`: split on commas, trim,
  strip `;{}()"'\` + control chars, drop empties, quote tokens containing spaces, rejoin;
  return `null` if nothing survives (treated as default). (b)
  `fontCss(slot, family)`: `"<sanitized>"` + the slot's fallback tail — Title/Body:
  `var(--font-text)`; Controls/Card-body: `var(--dse-font-body)`; Label:
  `var(--dse-font-title)`; Mono: `var(--font-monospace)` (the §5 fallback story,
  sc105-font-tokens-design.md). (c) `CURATED_FONTS`: `Source Serif 4` (bundled) plus a
  small cross-platform serif/sans set modeled on the site's `FONT_OPTIONS`
  (`settings-panel.js:47-73`) — e.g. Georgia, Palatino Linotype, Times New Roman, Inter,
  system-ui, Arial; mono list for the Mono slot (JetBrains Mono, Fira Code,
  ui-monospace). Labels only — values are bare family names; `fontCss` builds the stack.
- [ ] **Step 3: Descriptors.** Add the six to `DSE_PREF_DESCRIPTORS` via `d()`
  (`catalog.ts:84-88`): no `attr`; `css: { varName: '--dse-font-<slot>', toCss: (v) =>
  v === '' ? null : fontCss(slot, v) }`. New `PrefGroup` `'Typography'` inserted in the
  union (`:48-53`) and `GROUP_ORDER` (`:56-62`) after `'Appearance'`. `ui`: `control:
  'font'` (new PrefUi kind, typed in Task 8); `advanced: true` on
  fontCardBody/fontLabel/fontMono; labels "Title font" / "Body font" / "Controls font" /
  "Card body font" / "Label font" / "Monospace font". **Per Scott's 2026-08-02 ruling,
  every one of the six dropdowns' first/default option is uniformly labeled "Default
  (Obsidian vault fonts)"** (value `''`) — this is today's `var(--font-text)` behavior for
  every slot (directly for Title/Body, via the Task 3/4 chains for the other four) and
  what Legacy always renders. Help text per slot names this explicitly, and its closing
  clause depends on Task 5's verdict: **if SHIP,** "…applies under both the Steel and
  Legacy themes"; **if SKIP,** "…applies under the Steel theme; Legacy always uses the
  vault fonts above, regardless of this setting." Write whichever clause matches Task 5's
  recorded verdict (Task 5 runs before this task, per plan order). Note: until Task 8 the
  settings tab renders these rows without a control (`SettingsTab.ts:164-195` switch has
  no `'font'` case) — acceptable mid-plan state, called out in the task report.
- [ ] **Step 4: Per-block `prefs:`** — no change needed: css-bearing keys have no `attr`,
  so `extractPrefOverrides` warns+ignores them (`src/framework/prefOverrides.ts:53-57`).
  Add a one-line comment there naming font/scale prefs as intentionally global-only.
- [ ] **Step 5: Tests.** Sanitizer/builder table tests (quotes stripped, spaced names
  quoted, stack pass-through, injection attempts neutralized, `null` on empty);
  catalog: six descriptors present, defaults `''` (primitive invariant suite picks them
  up automatically), `toCss('')` is `null` and `toCss('Georgia')` ends with the right
  fallback tail per slot; legacy-fidelity test (`catalog.test.ts:22`) extended — all six
  default to no inline override.
- [ ] **Step 6: End-to-end smoke via the seam.** One dom test: build a store + reflect a
  root, `set('fontTitle', 'Georgia')` → root inline style contains
  `--dse-font-title: "Georgia", var(--font-text)`; back to `''` → gone.
- [ ] **Step 7: Gates + commit.** tsc · jest · shots + freeze 101/101 (defaults inert) ·
  `git commit -m "feat(prefs): six font-slot preferences with curated stacks + sanitizer (SC-112)"`.

**Verification:** the smoke test pins the whole chain descriptor→reflect→inline var;
freeze proves default inertness.

---

### Task 7: Size scales — tokens, consumer rules, snap, descriptors

**Files:** Modify `src/framework/tokens.ts`, `styles-source.css`, `src/prefs/catalog.ts`,
`src/prefs/fontStacks.ts` (or a sibling `scale.ts` for snap), token/test guards
(`token-coverage.test.ts`, `tokens.test.ts`, `theme-steel.test.ts`, `theme-print.test.ts`,
`steelTypography.test.ts` or a new scale contract suite), unit tests.

- [ ] **Step 1: Tokens.** Add `'text-scale'`, `'card-scale'` to `DSE_TOKEN_NAMES`
  (`tokens.ts:15-103`) with a comment marking them user-scale tokens (theme-invariant,
  print-excluded consumers). `:root` defaults `--dse-text-scale: 1; --dse-card-scale: 1`.
  Guard arithmetic: union 73→**75** (`tokens.test.ts:75`); `LEGACY_MAP` +2;
  `STEEL_INVARIANT` +2 → **9** (`token-coverage.test.ts:143,268`; mirror in
  `theme-steel.test.ts:73`); `PRINT_INVARIANT` +2 → **22** (post-Task-3 20 + 2;
  `:151,279`; mirror `theme-print.test.ts:139`); Steel overridden stays 66, print stays 53.
- [ ] **Step 2: Snap helper.** Port the site's `snap()` semantics exactly
  (`settings-core.js:28-43`): clamp to [min,max], round to nearest .05 step, default on
  non-finite. Constants: TEXT 0.6/1.4/.05/1, CARD 0.8/1.2/.05/1 (`settings-core.js:22-23`
  — both ranges already symmetric about 1.0, which is what centers the default thumb; the
  plugin inherits that property by using the same ranges). Unit tests mirror the site's
  edge cases (out-of-range clamps, mid-step rounding, NaN→default).
- [ ] **Step 3: Consumer rules.** Theme-unscoped, print-excluded:
  - Text: `[data-dse-element]:not([data-dse-print="on"]) { font-size: calc(1em * var(--dse-text-scale)); }`
    — at default this computes to the inherited size (audit found no element-root-level
    `font-size` declaration this could override; the freeze run is the proof). Nested
    element roots (by-SCC kit→feature) would compound the multiplier — add the nested
    reset `[data-dse-element] [data-dse-element]:not([data-dse-print="on"]) { font-size: 1em; }`
    (source-ordered after) and verify against the by-scc-kit fixture.
  - Card: `zoom: var(--dse-card-scale)` on the card hosts
    (`.dse-sb`, `.dse-card`, and the feature/featureblock root-compound from Task 4),
    print-excluded; same nested reset (`zoom: 1` for a card host inside another element
    root) so a referenced card doesn't double-zoom — the site zooms exactly one wrapper
    (`extra.css:61`).
  - **Fallback if freeze trips on the always-present `font-size` rule:** move the write
    into the descriptors' `toCss` output as inline `font-size`/`zoom` values via a second
    css entry — guaranteed absent at defaults. Prefer the token+rule form; use the
    fallback only on evidence, and say so in the report.
- [ ] **Step 4: Descriptors.** `textScale` / `cardScale`: default `1` (number), no attr,
  `css: { varName: '--dse-text-scale'|'--dse-card-scale', toCss: (v) => snap(v) === 1 ?
  null : String(snap(v)) }` (remove-at-default = site behavior,
  `settings-panel.js:92-103`). `ui`: group `'Typography'`, `control: 'slider'` with
  `min/max/step` carried in the ui shape (Task 8 renders them), labels "Text size" /
  "Card size".
- [ ] **Step 5: Contract + evidence.** Source-text contract test: both consumer rules
  exist and carry `:not([data-dse-print="on"])`; the nested resets exist. Visual
  evidence via the real-Obsidian camera pattern (the camera already drives plugin
  services over CDP — `frameworkV2.services.theme.setActive` precedent,
  `obsidian-camera.mjs:6`): evaluate
  `app.plugins.plugins['draw-steel-elements'].frameworkV2.services.prefs.set('textScale', 1.4)`
  (then `cardScale` 1.2/0.8) against a statblock note and screenshot each — text visibly
  scales, card zooms, no layout breakage, sliders' extremes usable. If no display is
  available, do the same through the browser harness page's console and say which vehicle
  produced the evidence.
- [ ] **Step 6: Gates + commit.** tsc · jest · shots + **freeze 101/101** (the critical
  check for the always-present rules at default 1) · parity 0/10/exit0 ·
  `git commit -m "feat(prefs): text & card size scales mirroring the site ranges (SC-112)"`.

**Verification:** freeze proves default inertness of both consumer rules; the scale
screenshots prove the effect and the nested-reset correctness.

---

### Task 8: Settings-tab UI — Typography group (3 primary + 3 advanced + 2 sliders)

**Files:** Modify `src/prefs/catalog.ts` (PrefUi typing), `src/views/SettingsTab.ts`,
`styles-source.css` (only if the advanced disclosure needs cosmetic rules); dom tests for
the renderer.

- [ ] **Step 1: Type the new controls.** `PrefUi` (`catalog.ts:65-76`): widen `control`
  to `'toggle' | 'select' | 'text' | 'font' | 'slider'`; add `advanced?: boolean` and
  `slider?: { min: number; max: number; step: number }`.
- [ ] **Step 2: Advanced disclosure.** In `renderPrefSections` (`SettingsTab.ts:68-105`),
  within a group render non-advanced rows first, then advanced rows inside a collapsed
  `<details>` ("Advanced") — keep the group reset button resetting ALL members including
  advanced (it already iterates the full member list, `:83-88`).
- [ ] **Step 3: `'font'` renderer** in `renderRow` (`:164-195`): an Obsidian dropdown
  with, in order: the default option — fixed label **"Default (Obsidian vault fonts)"**
  (Scott's 2026-08-02 ruling; value `''`, identical wording across all six pickers; help
  text underneath carries the Steel/Legacy-reach clause per Task 6 Step 3, matching
  Task 5's SHIP/SKIP verdict), the curated entries for the slot, then `Custom…`. A current
  value not in the list selects `Custom…` and reveals a text input (`setting.addText`)
  holding the raw value; text edits save through the normal `save()` path (sanitization
  happens in `toCss`, but reject-to-default obviously-empty input). Outcome A only (per
  the Task 1 ledger): a "List installed fonts" affordance inside the row populates the
  dropdown from `queryLocalFonts()` on click (user activation), feature-detected,
  graceful fallback to the curated list.
- [ ] **Step 4: `'slider'` renderer:** `setting.addSlider` with
  `setLimits(min, max, step)` from `ui.slider`, `setDynamicTooltip()`, plus a percent
  value label (`Math.round(v*100) + '%'`) updated on change — the site's
  `set-scale-val` affordance (`settings-panel.js:531-541`). Values pass through `snap`
  before `save()`.
- [ ] **Step 5: Live-apply sanity.** No new wiring needed — `prefs.set` notifies
  subscribers synchronously and `reflect()` re-stamps live roots (`SettingsTab.ts:10-14`);
  the statblock SettingsPreview under the Statblock group will visibly change font/scale
  while the tab is open. Confirm by hand in the dev vault.
- [ ] **Step 6: Tests + evidence.** Dom tests: a `'font'` descriptor renders a dropdown
  whose change persists via `prefs.set`; `''` round-trips; custom value shows the text
  input; a `'slider'` descriptor renders with the right limits and snaps. Evidence
  screenshot of the whole Typography section (real Obsidian settings dialog via the
  camera CDP, or a window shot) for the Task 9 Linear comment.
- [ ] **Step 7: Gates + commit.** tsc · jest · shots + freeze 101/101 · parity untouched ·
  `git commit -m "feat(settings): Typography section — font pickers (3 primary + 3 advanced) and size sliders (SC-112)"`.

**Verification:** renderer tests + the settings screenshot; live-apply confirmed against
a rendered element.

---

### Task 9: Contracts sweep, docs, changelog, final battery, evidence

**Files:** `docs/superpowers/dse-overhaul/D3-token-map.md`, plugin `CHANGELOG.md`,
workspace `CHANGELOG.md`, plugin `.repo-docs/` (prefs/architecture pages that describe
the descriptor pattern), `.claude/skills/dse-verify/SKILL.md` numbers if drifted,
workspace `FOLLOWUPS.md` if any tangent surfaced.

- [ ] **Step 1: D3-token-map.md.** +2 rows (`text-scale`, `card-scale`); update the
  `font-controls` Legacy value + the SC-105 amendment note with the SC-112 flip and the
  print pin; note the Label graduation and the Card-body root-compound.
- [ ] **Step 2: Docs.** Plugin `.repo-docs/`: document the `css`-bearing descriptor
  mechanism next to the attr vocabulary (adding a font/scale pref = adding a descriptor,
  unchanged principle); update the plugin CLAUDE.md "Preferences (D4)" bullet if it
  still says attrs are the only reflection. Check `DESIGN.md` for any "Controls default
  sans" claim and align it with the flip.
- [ ] **Step 3: Changelogs.** Plugin `CHANGELOG.md`: user-facing entry (font pickers,
  size sliders, Controls-serif change called out honestly as a visual change under
  Steel, the Legacy font-support gate outcome from Task 5 stated plainly — SHIP or SKIP).
  Workspace `CHANGELOG.md` `## Unreleased`: one bullet (plugin font settings shipped).
- [ ] **Step 4: Full battery** per the dse-verify skill, in order, recording every
  number: tsc · jest (final count vs 2022/144 baseline) · shots (count vs 169) · freeze
  **101/101** · parity **0/10/exit0** · obsidian-shots if a display is available (count
  vs 132).
- [ ] **Step 5: Linear evidence + report.** Per the linear-flow skill: post the Task 3
  before/after stepper pair, one scale-extremes shot, and the Typography-section
  screenshot inline in an SC-112 comment narrating the changes; set In Progress +
  `Needs Review`. Final report: per-task commit shas, gate numbers, the `queryLocalFonts`
  spike verdict, the Legacy font-support gate verdict (Task 5, SHIP or SKIP), and the
  explicit reminder that the worktree is NOT landed (`just wt-finish sc112-fonts` is
  Scott's).
- [ ] **Step 6: Commit** docs (workspace repo) + any plugin doc file (submodule) as
  separate commits, no pointer bump, no push.

**Verification:** battery numbers recorded verbatim; SC-112 comment contains the inline
images; no push anywhere.

---

## Self-review

**Decision coverage.** `sc112-decisions.md` §1 (Controls flip incl. stepper re-point +
evidence) → Task 3; §2 (3 primary + 3 advanced, "same as X" defaults) → Tasks 6+8 (the
`''` sentinel maps to the CSS chains SC-105 shipped and `steelTypography.test.ts:223-252`
pins); §3 (dropdown + spike + degradation) → Tasks 1+8; §4 (site-exact scale ranges/step/
symmetry) → Task 7 (constants copied from `settings-core.js:22-23`, snap semantics from
`:28-35`). **Scott's 2026-08-02 ruling** (uniform "Default (Obsidian vault fonts)" option +
Legacy easy/hard gate, superseding the open question in Self-review risk #1 below) → Task 5
(the investigation + gate) and Task 6 Step 3 / Task 8 Step 3 (the picker wording it drives).

**Verified-against-code claims.** Token values and lines (`:2997`, `:3166-3169`,
`:3487-3501`, `:3576-3579`, `:5316`, `:5378`), guard counts (73 / 66-7 / 52-21 at
`tokens.test.ts:75`, `token-coverage.test.ts:267-279`), the `font: inherit` sites
(`:4669,4801,4840,5016`), reflect/pipeline/modal wiring (`prefs.ts:189-197`,
`pipeline.ts:381`, `managedModal.ts:96-102`), and the per-block prefs exclusion
(`prefOverrides.ts:53-57`) were all read at `ccf465e` today. Line numbers will drift
under edit — each task says re-grep before editing; selectors and values are the
contract, not the line numbers.

**Guard arithmetic** (executor cross-check): after Task 3 — union 73, Steel 66/7, Print
**53/20**, `LEGACY_MAP['font-controls'] = 'var(--dse-font-body)'`; after Task 7 — union
**75**, Steel 66/**9**, Print 53/**22**, `LEGACY_MAP` +2. If the real numbers differ,
find out why before "fixing" a test. This arithmetic is the SKIP-path (status-quo
selector scoping) baseline; if Task 5's verdict is SHIP, the widened selectors change
which tokens are Legacy-consumed, and the STEEL_INVARIANT/LEGACY_MAP/PRINT_INVARIANT
bucket membership for those tokens needs re-deriving against the actual test file at that
point — Task 5 Step 4's guard-test update covers this, it is not re-litigated here.

**Known risks, in order:**

1. **RESOLVED by Scott's 2026-08-02 ruling — was an inference, now a decision + gate.**
   The prior open question ("should pickers also restyle Legacy?") is answered: every
   picker's default is explicitly **"Default (Obsidian vault fonts)"** (the legacy
   plugin's only-ever behavior, now named rather than left implicit), and whether
   non-default choices reach Legacy is Task 5's investigate-then-gate, not a plan-time
   guess. Residual risk moved from "is this the right product call" to "does the
   investigation call it correctly": Task 5's freeze-based no-op proof (Step 3) is the
   actual evidence; a false SHIP (an exclusion missed, freeze silently degraded) is the
   failure mode, which is why freeze 101/101 is a mandatory gate on Task 5 itself, not
   just a downstream check.
2. **The always-present scale rules under the freeze.** `font-size: calc(1em * 1)` on
   every element root should be computationally invisible; the audit found no competing
   root-level `font-size`, but the freeze run is the real proof, and the inline-write
   fallback is specified (Task 7 Step 3) if it trips.
3. **`queryLocalFonts` in Electron is genuinely unknown** — which is why it is Task 1,
   with both outcomes fully specified and Outcome B (curated+Custom) built
   unconditionally as the shared base.
4. **DOM-shape assumptions in the specificity fix** (which nodes carry theme attrs vs
   `.dse-sb`/`.dse-card`; nested by-SCC roots) are flagged for verification against the
   harness DOM before editing (Task 4 Step 1), with a divergence probe as proof.
5. **Nested-root compounding** for both scales has an explicit reset + the by-scc-kit
   fixture as its check.

**Placeholder scan.** Every step names a real file, selector, token, count, or line
verified today; the deliberate verify-at-execution points (drifted line numbers, DOM
shape, spike outcome, obsidian-shots availability) each state their failure mode and the
gate that catches them.

# DSE Overhaul — Planning Program

Master index for the **Draw Steel Elements (DSE)** Obsidian-plugin overhaul. This is a
**planning-only** program: it produces specs and plans now (authored largely by Fable deep
analysis, orchestrated by Opus), to be **implemented in later sessions**. No code changes
happen as part of this program.

> **Why these live in the workspace repo, not `draw-steel-elements/`:** DSE is a git
> submodule and the shared main checkout gets reset by `just deploy*`. Staging the whole
> multi-week program here avoids that footgun. Specs may be relocated into the DSE repo at
> execution time.

## The shape

A **keystone re-architecture**: an **Element Framework v2 (F1)** defines a mode-agnostic
render pipeline and the injection seams for theming / preferences / SCC-link resolution.
The downstream design work (UI, theming, preferences, new elements) is planned as thin
layers on top of F1 rather than patched 11× across today's per-element processors.

## Effort map & status

*Status is two-part — **spec** (this planning program's output) vs **build** (implementation
on the `dse-framework` branch). The old single "landed" column meant spec-landed and read as
build status after the build started; split 2026-07-10.*

| ID | Effort | Depends on | Author | Spec | Build |
|----|--------|-----------|--------|------|-------|
| **F1** | Element Framework v2 (keystone) | — | Fable | ✅ approved | ✅ built (Plans 01–02) |
| **F2** | Data-unified + SDK 3.x integration | (F1 seam) | Fable | ✅ approved | ⛔ gated on cross-repo prereqs |
| **F3** | Health audit + test harness | — | Fable | ✅ approved | ✅ built (Plan 01) |
| **F4** | Visual feedback harness (Linear SC-9) | F1 built | Opus | ✅ approved (2026-07-10) | ✅ built + landed (Plan 11) |
| **F5** | Real-Obsidian CDP camera (ground truth) | F4 | Opus | ✅ approved (2026-07-10) | ✅ built + landed (Plan 12) |
| **D1** | Vue removal / first migration | F1, F3 | Fable | ✅ approved | ✅ built |
| **D2** | UI/UX overhaul (High-Fantasy Steel) | F1 | Fable | ✅ approved | ✅ built + landed |
| **D3** | Theming (+ Legacy theme) + print/export | F1 | Fable | ✅ approved | ✅ built + landed (Steel look pending design pass, Linear SC-10) |
| **D4** | Preferences system | F1 | Fable | ✅ approved | ✅ built + landed (Plan 13) |
| **D5** | Rolling & interactivity (M1/A) | F1 | Fable | ✅ approved | ✅ built + landed (Plan 14) |
| **D6** | Compendium-powered reference family (M1/D) | F1, F2 | Fable | ✅ approved | not started (no plan yet) |
| **D7** | Hero-facing suite (M1/B) | F1 | Fable | ✅ approved | not started (no plan yet) |
| **D8** | GM subsystems (M1/C) | F1, F2 | Fable | ✅ approved | not started (no plan yet) |
| **D9** | Authoring & editing UX (M1/E) | F1 | Fable | ✅ approved | ✅ built + landed (Plan 15) |
| **M0** | This master roadmap + sequencing | — | Opus | ✅ finalized | — |
| **M1** | New-Element ideation menu | — | Opus | ✅ drafted — awaiting your curation | — |
| **M2** | Long-term / stretch roadmap | — | Opus | ✅ drafted | — |

## Decisions register

Locked decisions that constrain every spec:

1. **Keystone re-architecture** (not incremental). F1 is the foundation; D2/D3/D4/D5 build on it.
2. **Live Preview:** the F1 render pipeline is **mode-agnostic by design** (reading mode now,
   CM6 Live Preview later). The actual LP implementation is **deferred** to a downstream plan
   (tracked in M2), and must be a drop-in against F1's pipeline — never a re-architecture.
3. **No Vue.** Baseline tech is **vanilla TypeScript + DOM**. The 2026-04-06 revert decision is
   honored and finished under D1.
4. **New tech is opt-in via Scott.** Any proposed new dependency/framework is written up as an
   explicit **"Open Decision — needs Scott"** with cost/benefit. Fable never adopts tech
   unilaterally.
5. **Plans only.** No code changes, no builds/installs, no commits as part of this program.
6. **Backwards compat.** Today's look ships as a selectable **"Legacy" theme** (D3).

## Open decisions needing Scott

Each spec surfaces its own "Open Decisions"; cross-cutting ones are promoted here with the
Fable-recommended default. Unless overridden, downstream specs proceed on the defaults.

**From F1 (Element Framework v2):**
| OD | Decision | Recommended default | Owned by |
|----|----------|--------------------|----------|
| OD-1 | Reactivity helper for interactive views | None now; decide an in-repo ~40-line `Signal<T>` before the Initiative migration | F1 step 8 |
| OD-2 | Preference storage backend | Plugin `saveData` (per-vault) over `localStorage` (per-device) | D4 |
| OD-3 | Persisted write-behind | Debounced ~400ms + flush-on-unload (vs write-per-click) | F1 |
| OD-4 | Validation coverage | `schema.yaml` for every non-SDK element; keep hard-fail | F1 migration |
| OD-5 | `selectedInstanceKey` | Keep persisting through migration; revisit demotion to session after | F1 |
| OD-6 | Alias hygiene | Keep all current aliases forever | F1 |
| OD-7 | Statblock interactivity | Migrate statblock as `static`; new interactivity = new effort | F1 step 6 / ROADMAP |
| OD-8 | Import-boundary ESLint rule | Yes, add in step 0 (framework ⊥ elements) | F1 step 0 |

**From F2 (Data-unified + SDK 3.x):**
| OD | Decision | Recommended default | Owned by |
|----|----------|--------------------|----------|
| OD-1 ⚠️ | md-dse statblock files have **no `ds-sb` block** (694 statblocks unrenderable, tracker refs break) | **steel-etl** emits `ds-sb`/`ds-fb` in md-dse + regen | **cross-repo (steel-etl)** |
| OD-2 ⚠️ | data-unified has no releases to download | **deploy pipeline** publishes `md-dse-unified-en.zip` release assets | **cross-repo (deploy)** |
| OD-3 | Ship `md-dse` (raw scc links) vs `md-dse-linked` | `md-dse` + a vault-wide anchor-rewrite post-processor | F2 |
| OD-4 | Homebrew `ds-sb` `roles`/`ancestry` rename compat | one-cycle legacy-key shim + deprecation warning | F2 |
| OD-5 ⚠️ | npm SDK 3.1.0 lags data (missing cost/flavor/fixture/featureblock fields) | **publish SDK 3.2.0 from HEAD**, then pin exactly | **cross-repo (data-sdk-npm)** |
| OD-6 | Legacy `DS Compendium` cleanup on first sync | confirmed "move to trash" offer, default no-op | F2 |
| OD-7 | Web fallback to `steelcompendium.io/scc/{code}/` | on (click-time only; toggle provided) | F2 |

**From F3 (Health audit + test harness):**
| OD | Decision | Recommended default | Owned by |
|----|----------|--------------------|----------|
| OD-1 | CodeBlocks write atomicity (CB-3) | Fix now as quick win (`Vault.process` + per-file queue) | F3 quick win |
| OD-2 | Fence-alias on save (CB-5) | Preserve the alias the user wrote (stop canonical rewrite) | F3 |
| OD-3 | Canvas persistence (SD-3, private API, silently drops edits) | Drop canvas *persistence* → read-only + notice until official API | F3/F1 |
| OD-4 | Compendium delete semantics | `FileManager.trashFile` + confirm modal (also F2 OD-6) | F3/F2 |
| OD-5 | minAppVersion (real floor likely ≥1.4) | Verify, then bump | F3 |
| OD-6 | CI strictness ramp | Informational one cycle, then required | F3 |
| OD-7 | Dead DOM processors (StaminaBar/Skills) | Keep as D1 seed material; delete after D1 | F3/D1 |
| OD-8 | Test-only deps (`js-yaml`, `jest-environment-jsdom`) | Approve (dev-only) | F3 |

**Two confirmed data-corruption bugs (one-line fixes) to hit early — from F3:**
- **CB-1 (crit):** `MinionStaminaPoolModal.ts:226` operator-precedence bug clamps the minion
  stamina pool to the *alive-minion count*. Fix: parenthesize `(len ?? 0) * max`.
- **CB-2 (high):** `MinionStaminaPoolModal.ts:447` condition-removal writes an empty fence
  language, destroying the initiative-tracker block. Fix: pass the real language.

### ⚠️ Cross-repo critical path (from F2)

DSE's data integration (a **6.0.0**, breaking on the `ds-sb` YAML contract + source switch)
is **gated on three upstream changes in other repos**, which must land — and a data-unified
release be cut — *before* DSE can ship:

1. **data-sdk-npm:** publish **SDK 3.2.0** from HEAD (npm 3.1.0 lacks fields the data already emits).
2. **steel-etl:** emit `ds-sb`/`ds-fb` blocks in the `md-dse` format + regenerate.
3. **deploy pipeline:** publish `data-unified` GitHub Release zip assets.

These are outside DSE and likely each warrant a workspace `ROADMAP.md` entry. **None block
the *planning* program** — the D-wave specs can be written now — but they gate DSE 6.0.0
*implementation*. Flagged for Scott.

### Proposed additive F1 touches (from D-specs — fold in when F1 is implemented)

D-specs are allowed to propose **additive, back-compatible** extensions to F1's interfaces
(never breaking renames). Collected here so F1 implementation absorbs them in one pass:

- **D9 → `ElementDefinition.authoring?`** (optional): curated `example`, `sdkModel` hint,
  per-field authoring metadata — powers insert-scaffolds/forms/importer. Additive.
- **D5 → `RenderContext.roll?`** (`RollService`): shared roll engine handle so views invoke
  the DS power-roll math; pure engine core is injectable/testable. Additive.
- **D7 → `HeroPanel<S>`** framework base (a lightweight `Component` sub-view mirroring
  `ElementView`'s mount/update, for composed panels): the container/presentational split the
  hero sheet needs; coordinate with F1/D2. Additive (new class, not a signature change).
- **D8 → `RenderMode += "sidebar"`** + a third `SidebarBlockHost` (file+anchor-backed, so
  trackers persist across note navigation): F1 already anticipated added `BlockHost`s; this
  widens the mode enum. Additive. Also the first real consumer of F1's `onUpdate`.

### ⚠️ Migration constraints (surfaced during the build — must be honored)

- **Initiative & Negotiation migration (D1 / F1 §6 steps 8–9) MUST use a custom
  `resolveRefs` + `autoResolveRefs: false`**, scoped to the `statblock` field, with
  **field-level MERGE semantics** (copy `name`/`max_stamina`/`image` off the resolved block,
  keep the string) — NOT the default whole-YAML deep-walk, which *replaces* the value. The
  documented user-facing statblock syntax is **bare paths** (`statblock: "Thorn Dragon"`),
  which the new provider-chain `ReferenceService` deliberately no longer auto-resolves. Using
  the default path would silently break every existing vault's encounter blocks.
  *(FW Task 3 + final review, 2026-07-02.)*
- **General migration rule:** migrate elements with **`autoResolveRefs: false`** unless an
  element *specifically* wants whole-YAML `@`/`[[…]]` expansion — most don't (only initiative
  ever resolved refs). This also avoids the reserved-`scc:` provider throwing (until F2) on
  any bare `scc:`/`scc.vN:` value.

- **YAML serializer fidelity (persisted elements with free text):** Obsidian's `stringifyYaml`
  is the **`yaml` npm package, not js-yaml** (corrects the F3 §4.2 assumption). The harness mock
  uses js-yaml — byte-identical for **scalar** DTOs (Stamina Bar ✓), but **free-text fields
  diverge in line-folding** (Negotiation motivations, Initiative notes, Counter labels). Before
  migrating Negotiation / Initiative / Counter: **DECIDED 2026-07-02 — add `yaml` as a
  test-only devDependency** (it IS Obsidian's real serializer) so free-text byte-compat is
  faithful; do it in the pre-Negotiation/Initiative kit-hardening pass. *(D1 Task 3.)*

### 🔵 Open decision needing Scott — `autoResolveRefs` framework default

The final review flags this as **decide-before-D-wave**: the pipeline's `autoResolveRefs`
currently defaults **ON** (deep-walk all raw YAML for refs unless a def opts out). Since only
one legacy element ever resolved refs (initiative, via a custom field-merge that needs
`autoResolveRefs:false` anyway), **default-ON is a footgun** for every other element. **Recommendation:
flip the framework default to OFF (opt-in via `autoResolveRefs: true`)** — matches legacy
behavior, removes the `scc:`/wikilink error-card footgun. One-line pipeline change + a test +
a small F1 §3.1 amendment. **DECIDED 2026-07-02: flipped to opt-in (default OFF)** —
implemented in the framework-hardening pass; F1 §3.1/§2.4 amended.
- **D4 → `PreferenceStore.reflect(pin?)`** *(conditional — only if OD-D4-3 non-default)*:
  optional exclusion set for per-block overrides; the default D4 plan avoids touching F1.

## Implementation sequencing (for the Opus build sessions)

The 12 specs form a DAG. Recommended execution order — each milestone is independently
shippable, and none of the planning below is blocked, but these are the *build* gates:

- **M-A · Hotfix (do first, independent).** F3 quick wins → **5.1.2**: CB-1 + CB-2
  (data-corruption, one-line each), CB-4 (negotiation cross-tracker bug), ML-1 (render
  leak), BT-5/SC-4 (`versions.json`). Zero dependency on the overhaul.
- **M-B · Cross-repo prerequisites (parallel, in other repos).** Gate for the 6.0.0 data
  work: SDK 3.2.0 release · steel-etl `ds-sb`/`ds-fb` in `md-dse` + regen · data-unified
  release publishing. (F2 §6.)
- **M-C · Framework core.** F1 step 0 (`src/framework/` scaffold + import-boundary lint) +
  F3 jest harness. **Fold the additive F1 touches in here** (authoring field, `cx.roll`,
  `HeroPanel`, `RenderMode`+`sidebar`) so the interfaces are complete in one pass. Everything
  below depends on this.
- **M-D · Element migration + Vue removal.** D1 (HR→Skills→StaminaBar, kills Vue) then the
  rest onto F1 (F1 §6 steps 5–9: Feature→Featureblock→Statblock→Counter→Negotiation→
  Initiative). Golden test per element as it moves.
- **M-E · Presentation layer.** After the D2↔D3 token reconciliation (below): kit (D2),
  theming + Legacy + print (D3), preferences (D4). Tightly coupled — build together.
- **M-F · Data integration.** F2 (non-destructive sync + SDK 3.x + SCC resolver) → **6.0.0**.
  Gated on M-B.
- **M-G · New capabilities.** D5 (rolling; F1 only), D6 (compendium reference; needs F2),
  D9 (authoring; F1 registry). Parallelizable.
- **M-H · Composite features.** D8 (sidebar host + GM trackers) then D7 (hero suite; consumes
  D5 roll engine + D6 references + D8 sidebar). Encounter Builder + spendable Malice gated on
  M-B/F2 and the Monsters-book math gap below.

## Cross-spec reconciliation (resolve before the relevant milestone)

- **D2 ↔ D3 token vocabulary (before M-E).** D2 and D3 independently named overlapping tokens
  (D2 `--dse-stamina-healthy`/`--dse-tier-crit`/`--dse-act-*`; D3 `--dse-hp-*`/`tier-low|mid|
  high`/ability-type accents). Unify the `DseTokenName` union once — D3 owns values, D2
  consumes. Small, saves churn.
- **Additive F1 touches (at M-C).** Fold the four tracked extensions into F1's interfaces in
  one pass (see the register above).
- **`theme` descriptor omits `attr` (D3 ↔ D4).** Already agreed independently by both specs;
  don't regress it (avoids double-stamping `data-dse-theme`).
- **Monsters-book combat math (before M-H).** Encounter EV/budget, Malice per-round gain, and
  XP/Victory rates are absent from the workspace `reference/` (Heroes-only). Source them from
  the Monsters book / Director's Guide, or D8's parameterized tables stay "verify."

## Dispatch waves (complete)

- **Wave 1 ✅** F1, F2, F3 — deep-code-analysis foundations. Reviewed, approved on defaults.
- **Wave 2 ✅** D1–D9 — nine bundled design specs, each built on the finalized F1 seams.
- **Opus M-docs ✅** M0 (this file), M1 (ideation), M2 (stretch).

- **Wave 3 (writing-plans) — partial; approach pivoted.** Landed in `plans/`:
  `01` test harness ✅ (12 tasks, commit-per-task) · `04` data integration ✅ (14 tasks; add
  commit-steps at execution) · `02` framework core ⚠️ truncated at Task 3 · `03` migrations ❌
  not written. **Lesson: giant writing-plans docs via Fable are a token bomb** — 4 in parallel
  drained a full 5-hour window twice.
- **Pivot:** do NOT regenerate `02`/`03` as docs. Implement the **framework core from the F1
  spec** and **migrations from the D1 spec** directly via `subagent-driven-development`
  (task-by-task, commit each, review gates) — resilient to session limits. Keep `01`/`04` as
  banked plans. Pace Fable: **one task-subagent at a time**, never a fan-out.

### Build progress / resume point

- **✅ Plan 01 (test harness) — DONE.** Worktree `dse-framework` (all submodules branched),
  `draw-steel-elements` @ `da7094e`. 14 commits, `14 suites / 111 tests / 3 snapshots`, zero
  `src/` changes. Opus whole-branch review: **ready to merge**. Built via subagent-driven-
  development (haiku transcription / sonnet setup+reviews / opus final). 5 `test.failing`
  encode CB-1/CB-2/CB-3/CB-5/DC-6 (promote to plain `test()` when each bug is fixed). SDD
  ledger: `<worktree>/draw-steel-elements/.superpowers/sdd/progress.md`.
- **✅ Plan 02 (framework core) — DONE.** `src/framework/` @ `2adcb1e` — registry, pipeline
  (+ error boundary), mode-agnostic `ElementView`, atomic `ReadingModeBlockHost` write path
  (CB-3/CB-5 fixed), the three seams, wired into `main.ts` **alongside legacy (zero
  user-visible change, new registry empty)**. 12 commits, 228 tests / 0 regressions / 0 new
  tsc. Opus whole-increment review: **"ready to build the D-wave on this: Yes"** (traced a
  full persisted-block flow; seams compose; LP seam is a clean drop-in).
- **✅ D1 (Vue removal + first 3 migrations) — DONE.** `dse-framework` @ `186b6f4`. HR
  (static), Skills (interactive), Stamina Bar (persisted) migrated onto the framework via the
  `registerFrameworkElements` wiring loop + `framework/kit/`; the other 8 elements stay legacy
  (coexisting, exactly-once registration proven). **Vue fully gone** (deps + lockfile + SFCs +
  esbuild plugin); `vue-tsc`→`tsc` with **all 11 legacy type errors fixed (tsc now 0)**; CI
  type-check hard-gated. 308 tests. Opus whole-increment review: **"sound to continue the
  D-wave" — pattern proven to generalize to the remaining 8.**
- **✅ Plan 05 (kit hardening + Negotiation) — DONE.** `dse-framework` @ `cd73e70`. The 3 D1
  gating fixes ((A) per-cycle listener/modal teardown; (B) faithful `yaml` serializer + free-text
  golden; (C) `.dse-error-card` CSS) + **Negotiation** migrated (self-contained persisted
  tracker — it has NO external refs; the custom-`resolveRefs` work turned out Initiative-only).
  343 tests. Opus: ready-to-merge. Bonus: removed a legacy write-on-render footgun.
- **✅ Plan 06 (Initiative) — DONE.** `dse-framework` @ `e5680ae`. The largest/riskiest element:
  sync `parse` + async `resolveRefs` split (bare-path `statblock` via an additive
  `ReferenceService.resolveBarePath`), 13 persist sites, 5 modals, a reusable read-only
  affordance (`data-dse-readonly` stamp + badge), CSS re-scope; **CB-1/CB-2 data-corruption
  bugs fixed** (nets green); legacy 533-line processor retired. 423 tests. Opus: ready-to-land.
- **✅ Plan 07 (the easy 6) — DONE.** `dse-framework` @ `e40ad2c`. Feature/Featureblock/Statblock
  (SDK-backed static, RAW parse, `{sourcePath}` ctx shim) + Counter (persisted, stamina-bar
  shape) + Values Row + Characteristics (trivial static). 526 tests. Opus: ready-to-land.
  **This EMPTIES `RegisterElements.ts`.**
- **🏁 D-WAVE ELEMENT MIGRATION COMPLETE.** All **11 elements on Framework v2**; Vue gone; every
  legacy processor retired; `RegisterElements.ts` registers nothing. Built on **Fable**
  (implementers + reviewers) + **Opus** (per-plan whole-increment review). Branch `dse-framework`
  `b80a8a9`→`e40ad2c`. NOT `wt-finish`ed — Scott's call (deploy decided separately).
- **▶ Next:** (1) **land the branch** (`just wt-finish dse-framework`) — see the current
  `docs/handoffs/HANDOFF.md` for the landing steps (the untracked `docs/superpowers/dse-overhaul/`
  planning docs, the FOLLOWUPS bundle, and one manual Obsidian visual-QA of the read-only badge
  on a Skills collapse block). (2) The **D2–D9 feature specs** (UI/theming/prefs/rolling/etc.,
  each a thin layer on F1) + **F2 data integration** (gated on the cross-repo prerequisites) +
  the **F1 §6 step-10 cleanup** (delete the empty `RegisterElements.ts` + sweep dead
  `CodeBlocks.updateCounter`/etc.). The SDD ledger `<worktree>/.superpowers/sdd/progress.md`
  carries the full task-by-task history + the deferred-Minors bundle.

**Build strategy:** implement the **framework foundation** (harness → framework core → first
migrations + Vue removal) with **Fable now** — highest-leverage, decisions-settled code,
best use of the expiring Fable access — in an **isolated worktree** (`just wt-new`), TDD, with
a **review gate** after the framework core stands. Everything else (D2–D9 features, F2 data)
stays planned and gets implemented **just-in-time with Opus** at its milestone.

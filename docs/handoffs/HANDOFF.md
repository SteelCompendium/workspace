# Handoff — Steel Compendium workspace (canonical router)

> # ⛔ NEVER TAG OR RELEASE `draw-steel-elements`
> **Standing order (Scott, 2026-07-31):** *"7.0.0 will not be ready to cut until the visual
> overhauls to DSE are fully complete. Do not make any tags (even rc tags... that's how we got
> into the mess)."*
>
> No tags. No GitHub releases. **No RC or pre-release tags either.** `6.0.0-rc1` shipped as a
> regular release, auto-updated ~120 users onto an RC, and got the plugin **delisted from the
> community store** — costing a permanently retired major version and a throwaway `6.0.1`.
> Releasing is **Scott's action alone**: prepare the commands, never run them. Betas use BRAT.
> Full rule: [`../working-preferences.md`](../working-preferences.md) → "Deploy & landing".
>
> **Release gate: 7.0.0 ships only when SC-97 (Steel UI parity) is complete.**

## 2026-08-02 session end — state snapshot
**Landed to main today (all pushed):** the steel-body stack (SC-99 serif coherence all families ·
SC-108 fixture coverage, freeze 98→101 · SC-104 modal theming) and the SC-105 pair (six-slot font
token vocabulary, `--dse-font-display` retired · Option B: SS4 400 weight, body at true book
weight — Scott's pick, landed byte-identical to his approved swatch). All Linear issues Done with
before/after attachments. dse main @ `ccf465e`.
**Three repo-local skills now live** (`.claude/skills/`): `dse-verify`, `linear-flow`,
`land-stack` — procedures single-sourced out of the docs; use them instead of pasting footguns
into briefs.
**Remaining for 7.0.0 (SC-97):** SC-112 (six-slot settings UI + scales — biggest build, fully
unblocked) · SC-100 + SC-106 (Scott decisions; swatches offered) · SC-101/102/103 (structural) ·
SC-109/110/111 (guards). No worktrees exist; nothing in flight.

## 2026-08-03 — IN-FLIGHT STATE (compact-safety snapshot; trust ledgers over memory)
- **Plan 24 / SC-100: LANDED + DONE.** Scott approved gate round 3 (crest head, gradient-bleed
  dash tiles, sunk Equipment band, kept ability card). All 5 tasks complete, final whole-branch
  review MERGEABLE (0C/0I). dse main @ edc69b4, workspace merge ff4c9d4. The sanctioned
  `kit--steel-print.png` single-hash rebaseline was applied at landing → freeze 101/101 again
  (procedure + dated sign-off recorded in the dse-verify skill). Ledger preserved at
  docs/superpowers/dse-overhaul/build-ledgers/kit-tiles-sc100-ledger.md; worktree removed.
  Spin-offs filed + linked from SC-100: SC-119 (orZero/orDash), SC-120 (§D2 families);
  SC-117 got a scope note (ability-card interior's shared --dse-surface-sunken selectors).
- **Plan 23 / SC-112: LANDED + DONE** (Scott approved 2026-08-03). All 9 tasks + mid-plan
  rebase over SC-100 + final whole-branch review (caught & fixed I1: Legacy chained-picker
  tails hit the IACVT-dead :root set — nested var() fallbacks, Chromium-proven). dse main @
  809b9e8, workspace merge 3081071. Final battery: jest 2138/150 · freeze 101/101 · parity
  0/10 · obsidian-shots 132/132. Ledger preserved at build-ledgers/font-settings-sc112-
  ledger.md; worktree removed. FOLLOWUPS #42 (double slider label), #43 (generalize
  print-anchor guard), #44 (modal text-scale asymmetry) filed. NO release/tag made.
- **SC-121 filed (2026-08-03, gates 7.0.0): Steel UI refinement pass** — Scott's cleanup
  call. ROADMAP #19. **Catalog sweep DONE** (4 parallel agents, 22 defects, inventories +
  catalog in `.superpowers/sdd/sc121-audit/`); synthesis posting to SC-121 w/ batches.
  Routing: C-1 (families lack kit cardhead) → SC-120; nesting → SC-122.
- **SC-122: LANDED + DONE (2026-08-03)** — compiled CSS shipped un-flattened native nesting,
  silently dropped on old-Electron Obsidian (Chromium 106; auto-update never upgrades the
  shell); live in released 6.0.1 ~1 year; browser-harness gates structurally blind to it.
  Fix: esbuild target `["es2018","chrome106"]` + no-nesting build guard (can-fail proven,
  228→0). Plugin main @ 8871463, workspace merge 3bf34ec. Six families structurally
  recovered in real Obsidian (evidence inline on SC-122). Verification:
  `.superpowers/sdd/sc121-audit/nesting-verification.md`. Stepper-size bug INDEPENDENT
  (stays SC-121 batch 1). jest guard suite now 2141/151.
- **SC-121: DONE, FULLY LANDED (2026-08-04, dse main @ f09f6cc, workspace b33a3d5).** All
  4 batches + Scott's tweak round (crest face token inversion fixed; type chip
  right-aligned per site kwusage default; stat-row gaps). C-5 sanctioned by Scott →
  5-hash rebaseline applied, freeze **107/107**, dated sign-off in dse-verify skill.
  Pass artifacts preserved: build-ledgers/sc121-refinement-{catalog,batch-ledger}.md.
  Landed along the way: SC-106 hues (e50a761), SC-122 nesting fix (8871463). Notable
  finds fixed: dead --dse-font-mono, color-mix/text-wrap floor violations (+ 14-row floor
  guard), dead hero container query, unstyled form editor, table clip. Spin-offs: SC-123
  (site display-settings parity, 18-setting inventory — Scott to scope 7.0.0-or-after),
  SC-124 (PDF link fidelity, Backlog, post-7.0.0 per Scott), villain-action root cause on
  SC-102 (usage:"-" shadows ability_type). FOLLOWUPS #46-#50 (45 fixed in-pass). 3 modal
  taste items on the ticket, non-blocking. Battery at landing: jest 2190/154 · freeze
  107/107 · parity 0/10.
- **PLAN 25 (structural trio SC-101/102/103): ALL 7 TASKS COMPLETE, final whole-branch
  review in flight (2026-08-07).** Worktree sc10x-structural: workspace @ 9cd08cd, dse @
  ef7821d, REBASED onto main (guards+B6; FOLLOWUPS renumbered #51/52/53→#53/54/55).
  Shipped: notch on both families' head bands, villain ActionType (cost-prefix classifier
  matching steel-etl verbatim — works on real corpus; two shapes archaeology documented),
  standalone spine removal, shared nested-card frame + display-text costs, corpus-shaped
  fixtures (statblock-villain-corpus, feature-villain). Battery @ tip: jest 2289/155 ·
  shots 199 · freeze 114/119 (5 sanction-pending: statblock/feature/featureblock/
  featureblock-advancement/feature-spend --steel-print; widening 113→119 applied,
  .pre-plan25-bak backups) · parity 0/0/18-declared exit 0. **AWAITING Scott's 5-print-shot
  sanction on SC-102 (comment f8bbaadf, Needs Review set; S-decisions executed under
  recommendations, S-3 shipped scheme-invariant #e0584b).** Land via land-stack + 5-hash
  rebaseline on approval.
- **SC-109/110/111: DONE + landed** (parity declared-deferrals contract + CI; SC-111
  closed by process evidence). 4-divergence decision set parked on SC-110 (no urgency).
- **SC-125 filed** (link-preserving migration, 7.0.0 project, QUEUED — Scott: not until
  plugin done; design = shipped path-mapping, NOT SCC codes — codes changed in refactor).
- **SC-117 FIX WAVE IMPLEMENTED OVERNIGHT (2026-08-07/08, worktree sc117-audit, UNLANDED,
  awaiting Scott's visual gate):** B1 token flip (both scopes, site literals), B2 alpha
  ladder (+ flagged-for-veto --spend border -> metal-faint), B3 section-title recipe, B4
  chip cells; B5 SKIPPED (ships via plan-25's shared frame — close as delivered); R1
  FOLLOWUPS #52 line-height (parity declaration HEALED -> anti-rot forced removal, 18->16
  declared — mechanism proven in production); R2 (#56) BLOCKED on plan-25 (rules live
  there; recommendation flipped to candidate A — statblock role-gate is deliberate).
  Opus review: all PASS, 4M/4L; fix round closed M1 (hover-contaminated B6 capture —
  3-line baseline correction, print line was never contaminated), M2 (boxed-cell borders
  -> metal-faint), M3 (check-freeze now distinguishes missing vs mismatch, exits 0 on
  clean-producible — script + backup in .superpowers/sdd/), M4 (parity bg-blindness
  recorded in parity README + skill: background-color sampled but NEVER compared — file
  guard-extension ticket at landing, polarity-check first), L2 (card badge, last defect
  instance). dse @ a7050c2, workspace @ 2f32dca. Battery: jest 2249/155 · shots 189 ·
  freeze exit 0 (113/119 producible, new semantics) · parity 0/0/16. Evidence + addendum
  on SC-117 (comments 26fec165 + 34f98123). L1/L3/L4 report-noted for the gate.
- **BOTH LANDED 2026-08-08 (Scott approved both):** SC-117 fix wave (dse a7050c2, Done;
  spin-offs SC-126 parity bg-guard, SC-127 print-capture fidelity) and plan-25 structural
  trio (dse e0c93ae, workspace a0919bf; 5-hash rebaseline applied w/ dated sign-off,
  freeze 119/119 CLEAN; SC-101/102/103 Done; ledger preserved in build-ledgers/). The two
  branches' rebase was CSS-conflict-free — independently derived site values agreed.
  Print-shot dark-on-dark question answered: longstanding harness capture artifact
  (print-tokens-over-dark-scheme), NOT a bug — SC-127 fixes capture fidelity post-landing.
- **NEW CONVENTION (Scott, 2026-08-08): Linear approval asks must be self-contained in the
  LAST comment** ("What you're approving" section, evidence re-inlined) — recorded in
  docs/working-preferences.md + linear-flow skill.
- **SC-128 filed** (horizontal rules: site's two variants — ornate diamond+dots+fade vs
  plain diamond+line; reconcile with SC-103's landed notch first; interacts w/ FOLLOWUPS
  #56). Under SC-97 → SC-97 CANNOT close yet.
- **STATE (updated 2026-08-08 evening — Scott away several hours, working autonomously):**
  **LANDED today:** SC-128 (dse 77d55f3, SC-97's ornate rule + #56, Done) · SC-129 (v2
  5bb5bf6e04, site crest centering + scaling-rider proof, Done — NOTE: the v2 push
  auto-deployed the site; consequence corrected on-ticket) · SC-134 (dse 6e2f2dd, tracker
  resolves scc.v1: refs via SccRefProvider + genuine round-trip/negative-control tests,
  Done — 1 review round: I1 vacuous-test finding fixed) · SC-133 (dse 704396f, modal math:
  RC-3 magnitude clamp, RC-4 honest capped Spend Recovery w/ CB-8 disable+reason, RC-5
  take-higher anchored to LIVE pending temp, Done — 2 review rounds; reviewer executed
  jsdom probes, caught critical stale-anchor corruption in round 1; implementer's rebased
  Spend-Recovery accounting independently verified superior to reviewer's own sketch).
  Battery at current dse main 704396f: jest 2335/155 · shots 204 · freeze 119/119 ·
  parity 0/0/16. FOLLOWUPS filed today: #57 (legacy ds-hr paints nothing), #58 (SCC
  predicate 5 copies), #59 (initiative SCC-ref error UX + portrait warn), #60 (minion pool
  modal RC-3 twin). #58 COLLISION pending: sc137-138 worktree filed its own "#58" —
  renumber to #61 at that landing.
  **GATED ON SCOTT (Needs Review):** SC-130 (plugin crest, dse d3a5590 on sc130-crest —
  em-nudge, scale-proof, freeze-inert) · SC-131 (settings: NEW option D = Obsidian 1.13
  native declarative getSettingDefinitions + native search, spike PROVEN in sandbox 1.13.4,
  minAppVersion 0.15.0→1.13.0 verdict; vs built A/B/C shell; dse aa8f273+69d1eb8) ·
  SC-137 (9 essence-cost traits silently dropped by title-format slip; source normalization
  + corpus guard; steel-etl 9789b4d) · SC-138 (champion L10 advancements banded like
  beastheart; +4 SCC codes 3081→3085; steel-etl 6c42d8f) — both on sc137-138-summoner ·
  SC-78 (close-as-Done ask posted).
  **IN FLIGHT:** SC-132 round 3 (worktree sc132-stamina, Opus) — Scott's component-level
  feedback (comment d76531ae): NO layout pick yet; building option strips for temp-stamina
  materials (ephemeral), recovery-marker shapes/labels (diamonds dead — read as ornaments),
  Catch Breath control (answer function factually; remove-chip option), C height ladder
  (incl. A-channel-in-C hybrid), A temp-edge separator fix (suspected CSS bug), base-max
  mark options (the "unfamiliar separator" on winded-with-temp), dying-effect strip
  (keepers), 1-2 fresh directions, conditions-location factual answer + chips mock.
  Multi-layout-per-context is affirmed direction (D-style rail for sidebar).
  NOTHING new lands without Scott. dse landings serialize; every branch rebases at landing.
- **2026-08-10 (close of wave): SC-136, SC-107, SC-4 ALL LANDED + DONE** — dse main
  `9fb56f5` (SC-136 0a37cb8: CI skip-guard + lint gate live, token-map test KEPT per
  Scott's conditional "if we need it, approved" — it's the only token↔D3-doc sync
  enforcement; SC-107 9fb56f5: hero grid align-start + sparse fixture, shots 234).
  SC-4 closed: item 7 (Legacy-print monochrome) = leave-as-is per Scott ("don't care
  about print exports; easiest for now"), future print-exports effort owns it. Battery at
  final main: jest 2503/159+1skip · shots 234 · freeze 137/137 · parity 0/0/16 · lint
  clean, gated in CI. **SC-11 DEFERRED → Todo: Scott bug-hunts the plugin manually
  first; release sequence stays staged on the ticket; as bugs are filed the orchestrator
  fixes them.** SC-135 parked (Scott: "another day"; plan + 7 questions on the ticket).
  DSE 7.0.0 project board: every ticket Done except SC-11 (Todo, Scott's hunt) and
  SC-135 (parked). No worktrees exist; nothing in flight.
- **2026-08-10 (night): SC-125 LANDED + DONE** (dse ff63dde, workspace 980517f) under
  Scott's conditional approval — the backup condition (edited files copied to a sibling
  `<root> backup (pre-7.0.0)` folder BEFORE any rename; unbackupable = unmigrated) built
  and probe-verified; 5 impl rounds + 5 review rounds total. Landing incident: the SC-136
  agent had leaked its dse-verify skill edit into the MAIN checkout — caught by
  wt-finish's dirty-abort, relocated into the sc136-ci worktree as commit be885b7, main
  restored. **SC-11's wait-for-SC-125 recommendation is now satisfied — 7.0.0 can be cut
  at dse ff63dde whenever Scott runs the staged sequence.** Still gated: SC-136, SC-107,
  SC-4 (print-monochrome decision), SC-135 (plan discussion).
- **2026-08-10 (evening): the DSE 7.0.0 tail wave — ALL SIX DELIVERED, all gated on Scott.**
  SC-136 (CI: workspace-doc test skip-guard, FOLLOWUPS #61 lint debt cleared, lint wired
  into Plugin CI; the "ci"-vs-"Plugin CI" mystery = a mislabeled docs-deploy job; branch
  sc136-ci) · SC-107 (hero grid align-items:start Steel-scoped + sparse fixture; freeze
  unmoved; sc107-grid) · SC-4 (audit: 7 of 8 items already fixed; one live decision —
  Legacy-print monochrome — gated w/ screenshot; sc4-polish, superproject-only commit) ·
  SC-135 (plan-only: scc.v1: links unregistered; "prompt then nothing" = Live Preview;
  phased rec = click-handler now, sync-time link-format setting maybe; 7 open questions) ·
  SC-125 (migration: map from PUBLISHED release, 83.34% final coverage all-unmatched-
  explained, rename engine w/ write-ahead state + pending re-offer + danger-consent sync;
  survived FOUR probe-driven review rounds — C1/C2/C3/C3c stranding mechanisms all fixed +
  independently reproduced; branch sc125-migration, stack 85761df→8db9c6b→e9d56ba→66bf67c,
  LANDABLE) · SC-11 (release prep comment: exact sequence staged, versions verified;
  recommendation = cut after SC-125 lands). Main-checkout note: `npm run build` failing =
  stale node_modules vs SC-131's obsidian 1.13.1 typings; npm ci fixes (footgun index).
  The `orchestrate` skill now exists (.claude/skills/orchestrate/) — Scott's preferred
  mode, incl. new-machine bootstrap for his work computer.
- **2026-08-10 (later): SC-132 LANDED · SC-97 CLOSED — THE HIGH-FANTASY STEEL OVERHAUL IS
  COMPLETE.** dse main `97c71d2` (workspace `6bf9727`). Scott's four gate answers executed:
  crest light-rim fix (shared `.dse-crest` bevel-shadow artifact, pre-existing), rail state
  word dropped, rail dying = red border + red gradient ground, 5-line rebaseline SANCTIONED
  + applied with `freeze-baseline.sha256.pre-sc132-bak` backup and dated record in
  dse-verify SKILL.md; baseline WIDENED 119 → 137 (SC-132's five fixtures + SC-128's missed
  `statblock-roleless-corpus`). Battery at close: tsc clean · jest 2414/156 · shots 229/0 ·
  freeze 137/137 · parity 0/0/16 (CI). Design+impl ledgers preserved in
  docs/superpowers/dse-overhaul/build-ledgers/ (8 sc132-* files). Review trail: whole-branch
  Opus review caught a free-healing regression on the newly-editable hero sheet (H1, fixed
  via full recovery bridge with equality-pinned heal rate); scoped re-review regenerated all
  229 shots to prove the fix round pixel-inert. **7.0.0 is UNBLOCKED. Next: SC-11 release
  prep — PREP ONLY, Scott alone tags/releases, NO TAGS EVER by agents** (manifest/version
  already 7.0.0 + versions.json gating landed with SC-131; changelog written; remaining:
  stage the exact release commands + changelog slice on SC-11). Non-blocking tail: SC-110
  divergence set, SC-123 scoping, SC-125 (migration, now eligible — "plugin finished"
  condition met), SC-126/127, FOLLOWUPS #57-#62, SC-139.
- **2026-08-10 update:** SC-131 LANDED (dse 74adb05, Done — native declarative settings,
  FOLLOWUPS #61 hand-merged). SC-137 LANDED (steel-etl, Done). SC-138 LANDED twice-refined
  (steel-etl e64a063, Done — Scott diagnosed the source markdown as the real bug; parser
  allowlist reverted in favor of putting Champion Action/1 Eidos in standard fields; also
  fixed a live DSE bug: "1 Eidos" in usage → no spine/crest). SC-78 Done. SC-139 filed
  (Backlog: featureblock-before-statblock card order). FOLLOWUPS #62 = statblock-sidebar
  callout loss. **SC-132 design LOCKED after 7 rounds** (Scott's own layout: left crest
  spanning two rows, state word + big numerals/max/violet temp chip top row, full-width
  gauge bottom; N1 hairline separators; stable crest + living icon breathing at
  winded/dying; R6 fill-in cells G4-grouped; Model M + optional popover setting; dying =
  red border+ground w/ grey-steel divider; two-line rail). **PRODUCTION IMPLEMENTATION
  IN FLIGHT** (worktree sc132-stamina): re-author + integrate (hero stepper row deleted →
  bar canPersist:true; modal preview temp segment = SC-133 RC-1/RC-2 fold; candidate
  harness deleted) + EXPECTED print-freeze sanction request at the gate (SC-100
  precedent). Rail state-word and rail dying-ground go to Scott both-ways at the gate.
  SC-97 closes when SC-132 lands → then SC-11 release prep (Scott alone, NO TAGS).
- **2026-08-09 update:** SC-130 LANDED (dse f50b3bc, Done; SC-97 closes when SC-132's winner
  lands). SC-131 IMPLEMENTED per Scott's rulings (D-pages · Path A · minAppVersion 1.13.0 ·
  bottom-docked sticky preview) and REVIEW-CLEAN after 2 rounds (branch sc131-settings @
  2075f7b, jest 2354/155; reviewer decompiled obsidian-1.13.4.asar and proved the .d.ts
  render-lifecycle claim false — preview ownership now per-mount w/ cleanup contract;
  versions.json gating fixed, version-bump.mjs restored, manifest 7.0.0). Awaiting Scott's
  gate. **SC-131 LANDING CHECKLIST:** (1) FOLLOWUPS.md in the worktree is a STALE-BASE edit —
  merging wholesale would delete main's #57-#60 and roll next-id back; renumber its new
  entry (worktree "#57", lint-debt) to the next free number and hand-merge. (2) Same hazard
  in worktree sc137-138-summoner (its "#58" → renumber). (3) One-line comment fix at
  SettingsPreview.ts:9-11 (still describes the deleted per-display() owner). (4) L4 noted:
  popout-window destroy leaks one preview Component (bounded; FOLLOWUPS candidate).
  SC-132 ROUND 4 posted (branch @ 88601df): shield-blue temp strips (S1 rec), sub-bar
  placement, R6 fill-in cells (rec), G4 grouping, Model M interaction (markers SET count —
  RAW: losing recoveries common/multiple, regaining exists in exactly 2 effects); flagged
  that blue temp REVERSES the ratified SC-10/SC-106 blue=maneuver reservation (token
  question is ask #1). Scott's queue: SC-132 picks · SC-131 gate · SC-137 · SC-138 · SC-78.
- **7.0.0 remaining gate:** the five above + SC-130 (queued) + taste tail (modal items,
  SC-110 divergence set — no urgency) + SC-123 scoping + SC-125 (queued) → SC-97 closes
  when SC-128/129/130/132 land → SC-11 release checklist (Scott alone, NO TAGS).
- **Design-authority note (Scott, 2026-08-08):** stamina redesign delegated to agents via
  candidates-first (no site counterpart = original design in the Steel vocabulary);
  ClaudeDesign app is the agreed escalation path if no candidate lands.
- **SC-118 (site bug): DONE + deployed** (steel-etl b184b6a, site verified live; new SCC code
  rule.downtime/crafting-and-research-events-table, registry 3,081).
- **SC-117** (dark-mode richness audit): **IN 7.0.0 scope (Scott's call)**; runs after plan 23
  lands; first lead = sweep all --dse-surface-sunken consumers (2 kit-scope hits already fixed).
- Ledgers: .superpowers/sdd/2026-08-02-plan-23-*/progress.md (live); plan-24's preserved copy
  in build-ledgers/. Landing: font-settings via land-stack when Tasks 8-9 + final review clear.

## Active efforts
- **Release / SC-11 → 7.0.0** — the overhaul release cut. 6.0.1 recovery published; **7.0.0 NOT
  cut** (Scott: build not ready) — so **no agent action is pending here**. ✅ The community-store
  re-listing prerequisite is now **satisfied** (verified 2026-07-31, SC-96 closed). Full detail in
  the two dated sections BELOW (`6.0.0 RETIRED` addendum + `2026-07-20` wave) and
  `.superpowers/sdd/sc-11-audit-report.md`.
- **Steel UI parity → SC-97** — **ACTIVE.** Plan 19 (theme port) + plan 20 (material) + plan 21
  (typography/spacing/ink) are **LANDED into the 7.0.0-dev build**; plan 22 (body-text coherence)
  is **drafted, unblocked (C1 decided 2026-08-01), worktree ready — SC-99 is executable now**.
  Resume at
  `docs/superpowers/dse-overhaul/plans/2026-07-27-plan-22-steel-body-text-coherence.md` (STATUS
  header) + gap inventory `docs/superpowers/dse-overhaul/2026-07-23-steel-ui-gap-inventory.md`.
  Per-task history: `.superpowers/sdd/progress.md` (gitignored scratch).
  > ⚠️ **"Landed" ≠ "done."** Plans 20/21 hardened only the **5 of 32 element families** the
  > parity gate covers — the serif/ink routing in `styles-source.css:3439-3442` targets exactly
  > four selectors (`feature`, `featureblock`, `.dse-sb`, `.dse-card`). The ~20 plugin-only
  > families still render sans body, and every §B structural gap is open. **SC-97** carries the
  > full remaining scope; SC-10 was closed early (2026-07-20) and does not cover it.

> **Overall:** the **release** waits on Scott (7.0.0 not ready; never tag — see banner). **Steel
> UI is now agent-actionable**: C1 is decided and **SC-99 / plan 22 can be executed** in the
> existing `steel-body` worktree. Still Scott's alone: SC-100 (kit), SC-105 (font tokens/slab),
> SC-106 (taste-calls). Do not touch kit, and do not land — plan 22's stop condition holds
> (finish, report, Scott runs `just wt-finish steel-body`).

## 2026-07-31 — Linear ↔ repo reconciliation (drift audit)
Scott flagged possible duplicate-agent work across plans 19-22 and suspected Linear drift. Audited;
findings:
- **No code work was lost or duplicated.** Plans 19/20/21 ran *sequentially* in separate worktrees
  (`f2`/HFS → `steel-material` → `steel-type`), all landed, all worktrees since removed. Zero
  orphaned `steel-*`/`hfs`/`plan*` branches in the superproject or any submodule.
- **What the concurrent agents DID clobber was `.superpowers/sdd/` — it lives in the shared MAIN
  checkout, not per-worktree.** `progress-plan20-archive.md` says outright: *"(Previous ledger for
  SC-88 — complete and landed — overwritten here.)"* Other tells: `task-3-report-{d3,d4,sc88}.md`,
  `task-8-report.plan-18-stale.md`, and plan 21's Task 5 report self-catching a leak into the main
  checkout. **Lesson: give each effort a namespaced ledger filename (`p21-*`) from task 1, or keep
  the ledger inside its own worktree.** Build history was lost; nothing shippable was.
- **Linear fixed:** SC-91 → Done (encounter-builder minion EV; shipped + deployed 2026-07-29 but
  never moved), SC-96 → Done (store re-listed, verified), SC-11 retitled (the "land the overhaul"
  half finished 2026-07-20; only the release cut remains), **SC-97 created** for the Steel UI
  parity effort — plans 20/21/22 had *no* Linear representation at all.
- **Docs fixed:** workspace `CHANGELOG.md` Unreleased said "plugin 6.0.0" (→ 7.0.0, and the
  `roles:`/`ancestry:` shim removal corrected to 8.0.0); `REMAINING-TASKS.md` was badly stale (it
  still described D2/D3 as unlanded on `dse-framework` with everything Todo) — rewritten as a
  superseded pointer to Linear, keeping only its unique D9-deferral and D2/D3-polish catalogs.
- **Worktrees removed:** `f2` and `cardhead-spacing`, both verified fully landed. `wt-status`
  reported f2's `steel-etl` as *2 commits ahead* — **false alarm, verified by patch-id**: both were
  cherry-picked to steel-etl main as `e7ec4a2` / `51930c5` (identical patch-ids). f2's gitignored
  SDD ledger + briefs were preserved first to
  `docs/superpowers/dse-overhaul/build-ledgers/`. Tree is now worktree-free and clean.
- **Still unverified:** the Steel gates have not been re-run since the `f5923f8` → `b7ea4af`
  renumber (see below).

---

## Steel UI parity — you are here (2026-08-02: the steel-body stack is LANDED)
**Three issues COMPLETE and LANDED to main (superproject merge `eb346a3`, dse `0a3ce4d`) after
Scott's visual review (shots + live modal check in the worktree demo-vault). Landed set:**
- **SC-99 / plan 22** — serif body text on ALL ~32 element families (C1/C2 closed). Scott's
  rulings applied: EV chip joined the uniform chip family (carve-out removed); steppers stay sans
  as the future Controls-slot default.
- **SC-108 / #37** — featureblock `advancement` fixture + sidebar light shot; shots 169,
  obsidian-shots 132; **freeze widened 98→101 additions-only** (the check-freeze baseline is
  machine-local gitignored scratch — see gotchas).
- **SC-104 / #31** — Steel theme reaches modals: WeakMap registry + `DseModal.open()` stamp
  (src/ change, deliberate) + 4 token-gate widenings to `:is([data-dse-element], .dse-modal)`.

**Final branch gates (execution-verified by independent reviewers):** tsc clean · jest
**2016/144** · shots **169** · obsidian-shots **132** · parity **0 GAPs/10 WARNs/exit 0** ·
freeze **101/101** · token-coverage green · all commits attribution-free.

**LANDED 2026-08-02** via `just wt-finish steel-body`: dse `b7ea4af..0a3ce4d` (11 commits) on
origin/main; superproject merge `eb346a3` (5 docs commits + pointer bump `68b0e41`). Ledgers +
designs preserved to `docs/superpowers/dse-overhaul/build-ledgers/steel-body-*`. Worktree removed
after verification. Post-landing note: the deliverable `main.js`/`styles.css` are untracked build
artifacts — rebuild (`npm run build-no-check`) before any live-vault review; the harness compiles
its own bundle so gates stay green while the vault build lags (learned during Scott's SC-104
modal review).

Full per-task record: `.superpowers/sdd/{2026-07-27-plan-22-steel-body-text-coherence,
sc108-fixture-coverage,sc104-modal-theming}/progress.md` (gitignored scratch).

Scott also asked for **user-customisable fonts** → **SC-112** (now **in 7.0.0 scope, gates the
release**; **SIX** settable slots — Title/Body/Card-body/Label/**Controls** (interactive
components, Scott-confirmed 2026-08-02)/Mono — plus Text/Card size scales). **SC-105** defines
the token vocabulary SC-112 consumes. Site precedent to copy:
`v2/docs/stylesheets/custom_font.css` (4 family slots) + `v2/docs/javascripts/settings-core.js`
(`--sc-content-scale` 0.6–1.4, `--sc-card-scale` 0.8–1.2, both symmetric about 1.0 on purpose).

Kit (#32 / SC-100) still needs his call — do **not** touch it.

## Steel UI parity — verified state (2026-07-27, re-verified 2026-07-31)
- **Superproject** `main` = `origin/main` (`a6cfbf9`) — the 2026-07-27 docs commits were pushed,
  and two site deploys have landed since (SC-95 statblock action labels, 2026-07-29). Every
  submodule HEAD equals its `origin` tracked branch. **No worktrees exist** (both removed
  2026-07-31).
- **dse submodule** @ `b7ea4af` (7.0.0-dev; `package.json` 7.0.0 / `manifest.json` 6.0.1). Plan
  20+21 Steel work **is present** (`f5923f8` is an ancestor); the release renumber did **not**
  touch `styles-source.css` (only version strings), so plan-22's CSS line refs still hold.
- **Landed & guarded** (gap inventory §A): body serif + open line-height + cool ink on the
  **card families**; extended parity gate + two jest contracts.
- **Plan 22 drafted, NOT executed.** Its one CSS change broadens that routing to *every* element
  root so the ~20 plugin-only families (hero sheet, trackers, negotiation, …) stop rendering
  sans body (finding **C1**). CSS-only, no DOM, freeze-safe.
- **A `steel-body` worktree EXISTS** (created 2026-08-01 off dse `b7ea4af`, `npm ci` done, plan 22
  Task 1 Step 2 applied but uncommitted). Resume in it; do not cut a new one.
- **Gates last verified at `f5923f8`** (pre-renumber): tsc clean · jest **2010 / 144** · parity
  **0 GAPs / 10 WARNs / exit 0** · freeze **98/98**. The renumber changed one test's version
  string only — **re-run at `b7ea4af` to confirm** (see verification commands). Demo-vault build
  in the main checkout is from `f5923f8`; visually current (CSS unchanged), version strings stale.

## Steel UI parity — the full release scope is now in Linear (2026-07-31)
`SC-97` is the umbrella and carries a sub-issue index + suggested order. **It blocks SC-11.**

| Issue | Item | Kind |
|---|---|---|
| ~~SC-98~~ | ~~C1 direction~~ — **DECIDED 2026-08-01: serif everywhere (a)** | ✅ Done |
| **SC-99** | **Plan 22** — body-text coherence at the theme root (C1/C2) | CSS · biggest win · **unblocked, worktree ready** |
| SC-100 | #32 + D2 — kit / display stat-tile grid rebuild | DOM + Scott decision |
| SC-104 | #31 — Steel theme can't reach modals | TS |
| SC-108 | #37 — three Steel rules no fixture renders | Test gap |
| SC-101 | #33 — featureblock option cost + per-option bars | DOM |
| SC-105 | C6 + slab — body-font token / bundle a real slab | Scott + chore |
| SC-106 | Provisional Steel taste-calls (hues, gold) | Scott |
| SC-109 | #36 — wire `npm run parity` into CI | CI |
| SC-111 | Re-verify the gate battery at current main | Verification |
| SC-102 / SC-103 | #34 action spine · #35 statblock notch | DOM |
| SC-107 / SC-110 | C3 whitespace · #39/#40 parity WARNs | Cosmetic / gate precision |

**Open decisions needing Scott specifically:** SC-100 (kit: own plan vs theme-branched render vs
drop), SC-105 (font token vocabulary + whether to bundle an OFL slab — now coupled to SC-112),
SC-106 (provisional hues/gold). *SC-98 (C1) was answered 2026-08-01: serif everywhere.*

## Linear conventions — read before touching the board
`Todo` = not started · `In Progress` + **`Needs Review`** = needs Scott · `Awaiting` = an agent
is actively on it **or** it's blocked on something **external** · `Backlog` = someday.
**Never park internally-blocked work in `Awaiting` — that's `Todo`.** When you need Scott's
input, set `In Progress` + `Needs Review` (both) so it surfaces in his filter, and comment what
he's being asked to look at. Full rule: [`../working-preferences.md`](../working-preferences.md).

**Currently awaiting Scott (7):** SC-100 (kit approach), SC-105 (font tokens + slab — now
coupled to SC-112), SC-106 (taste-calls) · SC-76 (close confirm), SC-84 (zoom-dot recheck),
SC-77 (site check-in), SC-78 (Fable planning effort — looks complete, confirm close).
**SC-112** (customizable fonts) is filed but not release-gating — Scott to confirm that call.

## Steel UI parity — gotchas & lessons
- **Verification command shapes, devbox wrapping, and the freeze/parity mechanics** now live
  in the `dse-verify` skill (`.claude/skills/dse-verify/`) — read it before gating any DSE
  change.
- **Every new Steel CSS rule** must carry `[data-dse-theme='steel']:not([data-dse-print="on"])`
  or it changes the frozen `*--legacy-*`/`*--steel-print` shots. Only unfrozen steel-dark/light
  shots may change.
- **The parity gate covers only the 12 card-family pairs** (no site counterpart for plugin-only
  families), so C1's coherence can only be verified by **reading the shots**, not the gate.
- ~~**C1 preview A/B is ephemeral**~~ — **regenerated 2026-08-01 and preserved** at
  `.superpowers/sdd/shots-c1-ab/{before,after}/` (6 families, steel-dark). Note `.superpowers/`
  is gitignored: copy anything you need to keep out of it before removing a worktree.
- **Plan-22 baseline refs are pre-renumber**: it cites `f5923f8` / "6.0.0" / "jest 2010" — the
  build is now `b7ea4af` / 7.0.0; treat those as "current dse main" and re-verify counts.

## Steel UI parity — verification commands
```bash
cd /home/scott/code/steelCompendium/workspace
git status -sb | head -1                                    # main …ahead 1 (unpushed plan-22 docs)
git log --oneline origin/main..main                          # the plan-22 docs commit only
git -C draw-steel-elements rev-parse --short HEAD            # b7ea4af (or later)
git -C draw-steel-elements merge-base --is-ancestor f5923f8 HEAD && echo "Steel work present"
ls docs/superpowers/dse-overhaul/plans/2026-07-27-plan-22-steel-body-text-coherence.md
# Re-verify Steel gates at current main (do this in a FRESH worktree, never the main checkout):
#   devbox run -- bash -c 'cd <wt>/draw-steel-elements && npm run tsc && npx jest 2>&1|tail -3 && npm run parity 2>&1|tail -3'
```

---

# Handoff — 2026-07-27 addendum (⚠️ 6.0.0 is RETIRED — the plugin's next major is 7.0.0)

**Read this before acting on SC-11 below.** On 2026-07-07 the `6.0.0-rc1` release
candidate was published to `draw-steel-elements` as a **regular** GitHub release (not
marked pre-release). Consequences: Obsidian auto-updated existing users onto the RC
(~120 downloads), and around 2026-07-21/22 the plugin was **delisted from the Obsidian
community store** (`6.0.0-rc1` is not a valid `x.y.z` plugin version, and the registry
is now auto-mirrored by Obsidian's backend).

**Recovery (done 2026-07-27):**
- Deleted the `6.0.0-rc1` release + tag.
- Published **`6.0.1`** — byte-identical to 5.1.1 (tag on the 5.1.1 commit, manifest
  patched to 6.0.1) — so RC users get pulled back to stable via a normal update.
  6.0.1 chosen over 6.0.0 so version comparison beats an installed `6.0.0-rc1`.
- Plugin main: root `manifest.json`/`versions.json` → 6.0.1 (latest released);
  `package.json` → 7.0.0 (dev target); CHANGELOG/docs/deprecation strings renumbered
  (migration guide is now `docs/migrating-to-7.md`; the `roles:`/`ancestry:` shim and
  the legacy sync-command alias are now removed in **8.0.0**, not 7.0.0).
- Awaiting automatic re-listing in `community-plugins.json` (Obsidian's mirror runs
  ~hourly). **If still absent after ~2026-07-29**, contact Obsidian: resubmit via
  community.obsidian.md or ask in Discord `#plugin-dev` (the release is fixed; the
  listing needs their side).

**Rules going forward:** the version `6.0.0` is permanently retired — never cut it.
The overhaul release (everything the 2026-07-20 handoff below calls "6.0.0", and
everything Linear calls the 6.0.0 wave) ships as **7.0.0**. Scott has ruled the
current build is **not ready to release** — do not cut 7.0.0 without his go. Betas:
use BRAT, or at minimum tick "Set as a pre-release" and keep manifest versions
strictly `x.y.z`.

---

# Handoff — 2026-07-20 (DSE 6.0.0 wave LANDED + DEPLOYED · SDK 3.0.0 on npm · only the plugin release cut remains)

## Where things stand (everything verified)
The entire DSE 6.0.0 wave is **landed, deployed, and live**:
- **`steel-compendium-sdk@3.0.0` on npm** (Scott published 2026-07-20). The unpublished
  3.0/3.1/3.2 line was collapsed into one 3.0.0 (consumer-safety note in its CHANGELOG:
  2.x version-range/tag consumers unaffected). v3 tip includes the reader's
  second-role-token warning (+5 tests, 407 total).
- **`draw-steel-elements` main @ `01822bd`** — the full 6.0.0 build (F2+D6+D8+D7 + HFS
  Steel theme, 32 elements), SDK pinned to npm 3.0.0. Gates green against the published
  SDK: tsc · jest 1981 · shots 295 (zero drift). Release-ready.
- **`steel-etl` main @ `e7ec4a2`** — all site/data work incl. the 2 cherry-picked DSE
  generator fixes (#25 Children copy + kit dedup) and the `sbIsland.Eyebrow` rename.
- **Deployed 2026-07-20** (Scott's go, full `just deploy` + manual completion):
  data-unified `012d474d` + release **`v4.20260720213840`** · SCC API `8d21cd8a` ·
  v2 site `55148acee4` — verified live by curl (malice bands, class back-links,
  SC-86/87 unlinks all serving).
- Workspace main: CHANGELOG has a dated **2026-07-20** deploy section; plan docs 16–19
  brought over from the f2 branch; handoff current.
- Linear: SC-1/2/3/6/10 (features) + SC-13/86/87 → **Done**. SC-11 = the release cut.

## The one remaining step (Scott): SC-11 — cut the plugin major (was 6.0.0, now **7.0.0** — see 2026-07-27 addendum; NOT ready per Scott)
Plugin main `01822bd` is release-ready (manifest/LICENSE/lint clean — see
`.superpowers/sdd/sc-11-audit-report.md` for the audited checklist + exact commands):
```bash
cd draw-steel-elements   # main checkout, on main @ 01822bd
npm run build            # produces main.js + styles.css
# bump manifest.json/versions.json to 7.0.0 (currently 6.0.1, the recovery release), then:
gh release create 7.0.0 main.js manifest.json styles.css --title "7.0.0" \
  --notes-file <(sed -n '/^## 7.0.0/,/^## 6.0.1/p' CHANGELOG.md | head -n -1)
```
Users then update in Obsidian and re-sync the compendium (guide:
`docs/migrating-to-7.md`). No community-catalog PR needed (plugin id unchanged).

## Loose ends (small, non-blocking)
- ~~**f2 worktree**~~ — **removed 2026-07-31**, verified fully landed; its SDD ledger + briefs
  were preserved to `docs/superpowers/dse-overhaul/build-ledgers/`.
- The stale **origin** branches (`f2` in plugin/steel-etl/superproject, plus `sc10-steel`,
  `sc4-init-fix`, `d4-prefs`, `d5-rolling`, `d9-authoring`, `dse-framework`) can all be deleted —
  everything is on main. Not done yet; purely cosmetic.
- Scott taste checks, whenever: statblock-head crest deviation (1-line revert,
  flagged in SC-10/plan 19), SC-76 close confirm, SC-84 zoom-dot recheck.
- FOLLOWUPS: only #2/#3 (settings-panel design, dormant) remain open.

## Gotchas & lessons (this window — keep)
- **wt-finish/wt-rm** (memory: wt-finish-footguns): devbox swallows recipe exit codes —
  never chain `wt-finish && wt-rm`; run from the MAIN checkout; verify origin log before
  wt-rm; clean generated churn first.
- **Stale-worktree landings**: a long-lived worktree's superproject pins go stale as main
  advances — `wt-finish` would REVERT other submodules. Land scoped: push only the
  submodules the branch uniquely advances (FF-check first), cherry-pick where diverged.
- **Deploy recipe**: `just deploy` steps cd into sub-repos that have their own justfiles —
  recipe-internal `just` calls must anchor `-f "$root/justfile"` (fixed c54676c after it
  aborted the first full deploy at release-data; the deploy was completed manually:
  release-data → deploy-api → deploy-v2).
- deploy churn: restore (never commit) org-site API-timestamp + devbox.lock dirt.
- GitHub Pages lags the gh-pages push by a few minutes (`gh api repos/<o>/<r>/pages/builds/latest`).

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace && git status -sb | head -1
git -C draw-steel-elements log --oneline origin/main -1   # 01822bd
git -C steel-etl log --oneline origin/main -1              # e7ec4a2
npm view steel-compendium-sdk version                      # 3.0.0
gh release view --repo SteelCompendium/data-unified --json tagName -q .tagName  # v4.20260720213840
curl -sL 'https://steelcompendium.io/v2/Browse/monster/devil/devil-clerk/' | grep -c 'Malice Features'  # 1
```
**Resume protocol:** verify the above; if SC-11 is cut (gh release 7.0.0 exists on
draw-steel-elements), mark SC-11 Done and archive this wave; otherwise the board is
clear — nothing is blocked on an agent.

## 2026-08-10 (evening) — Scott's bug-hunt wave 1: settings parity (SC-146 / SC-123)

Scott filed SC-140–146 from his manual bug hunt. He directed: start with the Statblock
Display settings; SC-146 + SC-123 both worked now (he doesn't care which ticket carries
what). SC-140/141/143/144/145 remain queued (Todo, untouched).

- **SC-146: LANDED, In Progress + Needs Review (close-out ask posted).** dse main
  `9083dbe`, ws merge `5b766a2`, bookkeeping `88a34ef`. Full pipeline: audit (ledgered at
  docs/superpowers/dse-overhaul/build-ledgers/sc146/) → 7 fixes → adversarial review
  (Critical: gridc label/value inversion under Steel) → fix round → delta re-review LAND.
  Battery at landed sha: tsc/lint clean · jest 2514+1skip/159 · shots 254 · freeze
  **149/149** (widened 137→149 additions-only for 4 new statblock pref fixtures;
  recorded dated in dse-verify SKILL.md; backup freeze-baseline.sha256.pre-sc146-fixround-bak)
  · parity 0/0/16.
- **SC-123: fix round 1 + rebase IN FLIGHT (Awaiting).** Worktree `sc123-settings-ports`.
  Implementation landed 7 new prefs (kwUsage, distTarget, sbCharLine, sbCharBox, sbVillain,
  fbFeatureStyle, fbStats) via conditional DOM — default output proven byte-identical
  (40-render DOM diff) — presets widened 4→9. Review: 4 Medium (worst: per-block override
  of conditional-DOM keys renders corrupt "+2Might") + 9 Low; fix-round agent has findings
  + post-fix rebase instructions (keep-both merges; adopt ◆ separators for fb flat;
  battery vs 149-line baseline; any new frozen names reported for orchestrator to apply).
  Parked for Scott at gate time: preset migration (existing Sourcebook/Index users derive
  "Custom") and the 2 site-divergent defaults (sbCharLine, sbVillain — distTarget claim was
  an audit error, corrected). FOLLOWUPS #54 (villain band) is DONE by this work — flip the
  status line at SC-123 landing.
- **Board sweep per Scott:** SC-120 + SC-65 added to DSE 7.0.0 project (SC-65 related to
  SC-142/144). SC-124/127 deliberately left out (print-export territory, Scott's SC-4
  ruling); SC-126 left out (QA infra).
- **Open question to Scott (conversation, no ticket yet):** display-family authoring
  surface — recommended collapsing ds-kit/ds-class/… into one reference-first `ds-card`
  before 7.0.0 (schemas are already public in the SDK npm as a DATA contract, but the
  plugin authoring contract is uncommitted and the family has never shipped; frees
  ds-class for his future character-management vision). Awaiting his call; if approved,
  file a ticket in DSE 7.0.0 and orchestrate.
- Main checkout: stray untracked draw-steel-elements/compendium-manifest.json (from
  Scott's build) removed pre-landing.

### SC-123 LANDED (same evening, later)
dse main `e141582`, ws merge `b6e805a`. Fix round cleared all 4 Medium + cheap Lows
(perBlock warn-and-ignore for the 3 conditional-DOM keys; print consistency; legacy border
fallbacks; distTarget default corrected everywhere + dated §8 correction appended to the
SC-146 audit), rebased over SC-146 cleanly (presets verified carrying both sides), fb ◆
separator twin added, delta re-review LAND (all live-probed). Battery at landed sha:
tsc/lint clean · jest 2540+1skip/159 · shots 314 · freeze **188/188** (orchestrator applied
+36 SC-123 variants +3 hero-sparse pre-existing gap-fix at landing; recorded in dse-verify
SKILL.md; backup pre-sc123-landing-bak) · parity 0/0/16. FOLLOWUPS #54 → DONE.
SC-123 → In Progress + Needs Review; Scott's open calls on the ticket ask: preset migration
(existing Sourcebook/Index users derive "Custom"), 2 site-divergent defaults (sbCharLine,
sbVillain — rec: leave), sticky-header + link-toggle defer proposals, per-block support for
conditional-DOM keys (feature, own ticket if wanted).

### Display families ruled INTERNAL for 7.0.0 (Scott, 2026-08-10/11) + SDK beta notices landed
Scott's rulings on the ds-* display family (conversation): keep the ten elements but
**internal** — no verbose schema docs in the DSE plugin (requirement pinned on SC-142);
reference-by-SCC is the story (already live-resolving + offline via synced vault copy;
no staleness gap — only the "Insert compendium block" SNAPSHOT command bakes YAML).
ds-card: NOT adding (internal marking makes it unnecessary). data-sdk-npm `v3` now at
`a4c2a3e`: 10 family schemas (ancestry/career/class/complication/condition/culture/kit/
perk/title/treasure) marked "BETA — subject to change without notice" (README stability
section + schema descriptions + model comments + integration.md); statblock/feature/
featureblock untouched/stable; 407/407 tests green. ws merge `ba74ec1`.
PENDING Scott's go: remove display families from the snapshot insert command in 7.0.0
(recommended; reference + inline-link inserts stay; sb/feature/fb keep snapshots).

## 2026-08-11 — Scott's 5-hour go: 7.0.0 ticket sweep (autonomous window)

Scott: "Go for implementing the things/tickets we talked about that are to be included in
7.0.0... If you finish those tickets, you can start working on the other tickets I added
today... mostly bug fixes and I dont think they need much (or any) approval from me."
Convention this window: bugs land + go Done with evidence (he vetoes by reopening).

**LANDED + DONE (dse main progression e141582 → 20a78e2):**
- SC-143 `94cfb17` — kit band-heads 12.8px→16px (rem-root conversion miss; orchestrator-
  eyeballed in lieu of review per right-sizing).
- SC-140 `c196222` — sync-status live refresh (ManifestStore.onChange + live mount on the
  SC-131 cleanup contract). FOLLOWUPS #63 filed (sync buttons lack busy state).
- SC-145 `5abfa62` — authoringAnchor() seam; pencil inside card everywhere; hr buttonless.
  Freeze widened 188→200 (12 lines, review-verified, recorded in dse-verify).
- SC-141 `23ed677` — FEATURE_TYPE_RE claims ability/trait (716 files were unreferenceable
  by code!); slug twin tie-break (92 keys); FEATUREBLOCK_TYPE_RE claims dynamic-terrain;
  action-chip actionTypeOf; featureblock feature_type SHIM (→ SC-155 upstream ticket:
  SDK fromDTO throws on all 152 corpus featureblocks). SC-156 filed (hero example.yaml
  ships 2 invalid codes; needs 9-line sanction).
- SC-149 `20a78e2` — ds-scc catch-all live; ten typed aliases + ds-rule retired (ds-rule =
  orchestrator ruling, flagged for Scott veto on ticket); friendly notice cards; insert
  routing on shared family regexes; H-1 element-restamp with stylesheet-parity oracle.
**Earlier same evening:** SDK beta notices landed (data-sdk-npm v3 a4c2a3e); SC-150/151
filed (Backlog); SC-142 carries thin-docs + snapshot-rationale requirements.

**IN FLIGHT:** SC-144 legacy-theme removal — implementer executing the 7-phase plan
(.superpowers/sdd/sc144/sc144-removal-plan.md; KEY: legacy IS the unscoped base, zero CSS
deleted; freeze 200→66 steel-print-only via sc144-freeze-baseline-66.txt + skill patch
file, orchestrator applies both at landing; silent settings migration). Then review →
land. THEN: SC-142 + SC-65 docs (after SC-144 to avoid docs/ conflicts).
**Board after this window:** 7.0.0 project has SC-11 (cut, Scott), SC-135 (parked),
SC-146/SC-123 (landed, Needs Review asks pending Scott), SC-156 (needs sanction),
SC-120 (design-gated), SC-142/SC-65 (docs, queued), SC-144 (in flight).

### Window complete (2026-08-11 early AM): 8 landed, board clear except Scott-gated items
Final landings after the last entry: **SC-144** `73b156d` (legacy theme removed; freeze
RETIRED 200→66 steel-print-only — new regime documented in dse-verify SKILL.md;
check-freeze.sh patched; FOLLOWUPS #49 archived, #57 rewritten print-only, #64 sweep filed;
workspace CHANGELOG bullet) and **SC-142/SC-65 docs pass** `cbf17fa` (README rewritten with
install/migration; 4 new pages — writing-blocks, settings, hero-suite, gm-trackers; all 22
elements documented; display families named nowhere; snapshot-why present; SC-65's legacy
readme content gone). dse main final: `cbf17fa`. Battery at final: jest 2686 · shots 200 ·
freeze 66/66 · parity 0/0/16 · tsc/lint clean.
**For Scott (Needs Review):** SC-146 + SC-123 close-outs, SC-142 (accuracy pass landed —
decide if the tutorials/screenshots ambition is phase-2 or pre-7.0.0; ALL screenshots
except roll.png are stale, list in the sc142 ledger; regeneration needs his display).
**Scott-gated remainders:** SC-11 (cut), SC-135 (parked), SC-156 (9-line sanction),
SC-120 (design), SC-155 (upstream SDK/ETL pick). No worktrees except sc142 (remove after
his review if he wants screenshot work in it — actually removed; regenerate if needed).

## 2026-08-11 (day) — Scott's review round + the camera dividend

Scott returned comments on 107/146/142. All actioned; dse main now `4615db6`:
- **SC-107** — his earlier "approved" had landed but the Done save silently no-op'd; state fixed.
- **SC-146 round 2** — his 3 findings: ledger = NO defect (stale build; site measured identical
  ×0.8 rem-root; the 4th cell = With Captain, which the SITE drops → SC-157 filed); flat
  separator now the site's full fading-lines recipe; head-notch clearance fixed screen+print.
  Re-review LAND pending his sanction of a 17-line steel-print rebaseline (pure ~9px vertical
  shift, forensically verified; rebaseline-17.txt in sdd/sc146/round2/). **GATED: In Progress
  + Needs Review — awaiting "sanctioned", then land worktree sc146-round2 (branch kept;
  worktree ALIVE, commit a9e3ac5 + auto-rebases cleanly).**
- **SC-142 phases 2a+2b LANDED** — headless docs-shots pipeline (Xvfb; obsidian-shots now
  headless too; 40 images automated) + six tutorials (Getting Started etc., camera can shoot
  Obsidian's own UI). GATED: Needs Review — Scott to read Getting Started, then Done.
- **Camera dividend: 3 real bugs found by pointing real cameras at the product** —
  SC-158 (sidebar _dse_anchor corrupted ds-scc; strictBody fix LANDED+Done, `4120f47`),
  SC-159 (search modal rows had NO CSS; fix LANDED+Done, `4615db6`; FOLLOWUPS #66 filed:
  dead --dse-* tokens outside element roots, no gate sees them), SC-157 (site drops
  With Captain — Todo, site-side). FOLLOWUPS #65 (same-code sidebar bind) also filed.
- **Session note:** hit the 200-subagent cap; continuing via SendMessage RESUMES of prior
  agents (works fine). New sessions reset the cap; CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION
  raises it.

**Awaiting Scott:** SC-146 sanction (then land sc146-round2 — the ONLY live worktree),
SC-142 confirm, SC-123 rulings, SC-158's no-migration veto window, SC-11 cut, SC-135,
SC-156 sanction, SC-155/SC-157 scheduling.

### SC-146 SANCTIONED + ROUND 2 LANDED (Scott: "146 is good to go")
dse main `3a9242f`, ws `5cccff3`. Freeze 66→67 (17-line sanctioned rebaseline + with-captain
widening; recorded in dse-verify SKILL.md; backup pre-sc146r2-bak). Battery at landed sha:
jest 2698+1skip · shots 203 · freeze 67/67 · parity 0/0/16. SC-146 → Done. No live worktrees.
Scott reviewing: SC-142, SC-123, SC-158 veto window.

### SC-123 rulings executed, defaults flip LANDED — SC-123 → Done (2026-08-12/13)
Scott's 4 rulings (his SC-123 comment; his "sc-132" messages were a typo): no preset
migration; defaults FLIPPED to site parity (sbCharLine 'two', sbVillain 'banded' —
"nobody has this code yet... do the correct thing"); sticky header → SC-160 (7.0.0, spec'd);
link toggle dropped; per-block structural → SC-161 (Backlog). Flip landed dse `221acc9`
(review: zero findings; 18-line statblock-family print rebaseline applied, count 67,
recorded in dse-verify; backup pre-sc123-defaults-bak). FOLLOWUPS #67 (steel preset ≡
defaults coupling). jest 2702 · shots 203 · freeze 67/67 · parity 0/0/16.
SC-158 veto window closed (Scott: "sc-158 is fine"). Remaining at Scott: SC-142 Getting
Started read-through, SC-11 cut, SC-135, SC-156.

## 2026-08-16 — SC-163: dse branching model changed (develop = mainline, main = 6.0.1)
Scott's directive executed with all gates green: origin/develop = full 7.0.0 line
(efdced2, incl. new plugin-ci develop trigger); origin/main FORCE-RESET to the 6.0.1 tag
(0645aca) so the gh-pages docs deploy (ci.yml, main-push-triggered) shows released content
only; main-7.0-backup (221acc9) kept as belt-and-braces. .gitmodules dse branch → develop
(all just machinery follows); workspace pin bumped to efdced2; local main checkout
submodule now ON develop; git-workflow.md owns the policy. **ALL FUTURE dse LANDINGS
TARGET develop** (wt-finish does this automatically now); at a release Scott FFs main to
the release sha (docs deploy fires) then tags. In-flight wave (sc147-inserts,
sc153-sidebar-dup, sc154-tracker-layout, sc152-sheet-styling — cut from 221acc9, an
ancestor of develop) lands normally onto develop with the usual rebase.

### 2026-08-16 — SC-165 sanctioned (Scott: "sc-165 sanctioned")
SC-165 (strip render-inert `metadata:` from snapshot insert output; synced files unchanged)
is greenlit for 7.0.0. Spawn cap means it queues for the first identity that frees, in the
dispatch queue with SC-160 (sticky header). In flight right now: SC-153 review (aab4d301),
SC-154+162 impl (a1984a), SC-164 mike impl (a13092b), SC-135 phase 1 impl (a4c1daa);
SC-152 independent review also queued (must not be aab4d301, its author). Still gated on
Scott: SC-156 3-line print sanction (unblocks landing sc147-inserts → closes SC-147/148/156).

### 2026-08-16 — SC-164 LANDED+Done; SC-154 impl complete; agent pool down to 2
SC-164 mike-versioned docs landed to develop (`9bb24c3`, ws a3ed2e8; ledger preserved).
Live gh-pages verified (root→latest, /dev/ banner, 14 legacy deep-link redirects; rollback
sha 5d662f0 on the ticket). Two flags on the ticket for Scott: main lacks branch protection
(stray pre-release push to main runs the OLD gh-deploy --force and wipes mike's layout) and
main's manifest.json (5.1.1) ≠ its tag (6.0.1) — self-heals at the 7.0.0 manifest bump.
SC-153 review returned FIX ROUND (Major: "Open in sidebar" regenerates the fence and
destroys live combat state; Medium: orphan panel after user deletes fence) — fix round 1
dispatched to aab4d301 (reviewer-as-fixer; original implementer transcript gone); LOW/INFO
deferred as FOLLOWUPS #68/#69. SC-154+162 impl complete on sc154-tracker-layout (326a8d5,
6 measured layout fixes + shield/skull fallback icons; 2-file steel-print freeze delta,
hashes at .superpowers/sdd/sc154/rebaseline.txt — needs Scott sanction at landing).
**Agent pool: a1984a + a13092b transcripts EXPIRED; spawn cap still 200/200 (fresh spawn
retried+refused). Live: aab4d301 (SC-153 fix), a4c1daa (SC-135 ph1).** Queue: SC-152 review
(MUST be a4c1daa — aab4d301 authored), SC-154 review (either), SC-153 re-review (prefer
not-aab4d301 or orchestrator), SC-165 impl (sanctioned), SC-160 impl. Stale sc133-134-bugs
worktree removed (tickets Done 08-08, tip ancestor of develop, trees clean).

### 2026-08-16 (cont) — SC-153 fix round 1 green; SC-167 filed; aab4d301 → SC-154 review
SC-153 fix `ff56aca` on sc153-sidebar-dup: bind-don't-rewrite (state survives re-press),
orphan-panel sweep (`stillAddressable`); full battery green (jest 2712+1skip · shots 203 ·
freeze 67/67 · parity 0/0/16), can-fail proven both directions. Fixer=reviewer (aab4d301),
so the SCOPED RE-REVIEW of 102b43c..ff56aca(+docs note) needs DIFFERENT eyes — queued for
the post-restart fresh pool. SC-167 filed (Backlog: explicit re-sync action; SC-153 ships
the site-docs snapshot note per the docs-clarity rule — aab4d301 adding it to the branch
now, then starting the SC-154+162 adversarial review). Scott plans a session restart to
reset the spawn cap once in-flight agents drain.

### 2026-08-16 (late) — pool DRAINED; two Scott gates live; safe to restart session
SC-154 fix round 1 done (`32236ed`: quick-add widths 6em/9.5em, placeholders verified
complete BY PIXELS; battery green; rebaseline.txt regenerated — encounter hash unchanged
from round 0, initiative moved). Evidence preserved to .superpowers/sdd/sc154/evidence/
(scratchpad dies with the session). SANCTION ASK LIVE on SC-154 (In Progress+Needs Review,
3 inline images). FOLLOWUPS #71 (input width ≡ placeholder coupling). SC-135 phase 1 DONE
on sc135-links (`51c3f18`, battery green +19 tests, docs section in) but the implementer
found LP links are CM6 spans, not anchors — the handler may not fire on the PRIMARY bug
surface; 30-SECOND MANUAL TEST ASK LIVE on SC-135 (In Progress+Needs Review). Its agent
died at the finish line on the usage-window limit (resets 2:10am ET) — work was already
committed. **Both agent identities now idle/dead — NOTHING in flight; Scott can restart
whenever.** Post-restart queue: SC-153 scoped re-review (102b43c..a0c23e4, fresh eyes),
SC-154 scoped re-review (326a8d5+32236ed, fresh eyes), SC-152 review (NOT aab4d301),
SC-165 impl (sanctioned), SC-160 impl. Scott gates: SC-156 sanction, SC-154 sanction,
SC-135 LP click test, SC-152 taste gate (post-review), SC-11 cut.

### 2026-08-16 (later) — Scott returns: SC-154 round 2 wanted; SC-135 LP confirmed broken
Scott on SC-154: "still looking really rough" — comprehensive spacing pass required
(3 named examples + "other issues"); round-2 brief at .superpowers/sdd/sc154/round2-brief.md;
sanction ask superseded (hashes will move again). SC-154 → Todo (no agent free; aab4d301
transcript EXPIRED). Scott's LP test + pasted DOM confirmed SC-135 concern #1: cm-link
spans, no anchor — phase 1b (CM6 EditorView extension: posAtCoords → link-at-position →
same actions; keep DOM handler as safety net; end-to-end xdotool proof required) dispatched
to a4c1daa (RESUMED fine — the usage-limit death was transient). SC-135 → Awaiting.
Pool: a4c1daa on SC-135 1b; NOTHING else live. Queue: SC-154 round 2, SC-153+SC-154
re-reviews, SC-152 review, SC-165, SC-160.

### 2026-08-16 (night) — SC-135 phase 1b DONE end-to-end; a4c1daa → SC-154 round 2
Phase 1b `5e56f6a` on sc135-links: CM6 extension (sccLinkAtPos.ts pure resolver +
sccLinkCm6.ts registerEditorExtension, Prec.highest REQUIRED — Obsidian's core mousedown
otherwise swallows it silently; recorded as a repo footgun candidate). PROVEN twice on
real Obsidian with OS-level clicks: folded-LP plain click navigates; raw-syntax plain
click only moves cursor; Ctrl-click navigates; Source-mode Ctrl-click navigates. Battery
green (jest 2742+1skip/169, shots 203, freeze 67/67, parity 0/0/16). Concern: popout CM6
coverage reasoned, not e2e-verified. SC-135 → Todo (done pending independent review+land;
a4c1daa authored BOTH phases — review needs different eyes, post-restart). a4c1daa now on
SC-154 round 2 (Awaiting). Queue unchanged otherwise.

### 2026-08-16 — SC-169 (element menu panel) written up; rulings taken; spec phase queued
Scott filed SC-169 (7.0.0): standard hover menu panel + whole-element collapse for HFS
containers. His 4 rulings recorded on the ticket (collapse = YAML default + session
toggles, never note-writes; edit icon gated by authoringControls; card-like opt-in only;
mobile = always-visible panel + top space, Platform.isMobile). Spec-phase brief at
.superpowers/sdd/sc169/spec-brief.md — dispatch when capacity frees (taste gate before
rollout). Queue: SC-154 r2 (in flight, a4c1daa) → re-reviews 153/154/135 → SC-152 review
→ SC-165 → SC-160 → SC-169 spec.

## 2026-08-16 (session restart) — spawn cap RESET; full parallel fan-out
Scott restarted the CLI (/resume); cap confirmed reset (fresh spawns work). Killed agent's
SC-154 round-2 partial work (uncommitted view.ts + styles-source.css, tsc/lint clean) left
in the worktree — new implementer told to build on it critically, not discard. SIX agents
live in parallel: SC-154 round 2 (impl, from partial), SC-153 scoped re-review
(102b43c..a0c23e4), SC-135 phases 1+1b review (efdced2..5e56f6a), SC-152 review
(221acc9..3e67b60), SC-165 impl (new wt sc165-snapshot-meta off develop 9bb24c3),
SC-160 impl (new wt sc160-sticky-header off 9bb24c3). Linear: SC-165/160/135/154 Awaiting.
Still queued: SC-169 spec phase (brief at .superpowers/sdd/sc169/spec-brief.md).
Scott gates open: SC-156 sanction (sc147-inserts landing), SC-154 sanction (after r2),
SC-152 taste (after review), SC-11 cut.

### 2026-08-16 (late) — three reviews back, three fix rounds live; SC-170 filed
SC-153 re-review: code LAND, 3 text/edge fixes (stale CHANGELOG line, misleading Notice on
"Create tracker block", orphan sweep must skip degraded ds-scc panels) → fix round 2 to the
reviewer. SC-135 review: FIX ROUND — H-1 middle-click navigates TWICE (mousedown+auxclick
both fire; delete auxclick), M-1 docs sentence broken, M-2 phase-1b tests vacuous (reviewer
proved real CM6 jsdom coverage feasible), L-3 multicursor gating, L-6 popout Set leak → fix
round to the reviewer; L-1/L-2/L-4 deferred as FOLLOWUPS #72; Prec.highest requirement
CONFIRMED by execution; CM6 correctly external in esbuild. SC-152 review: FIX ROUND — H-1
ds-hero double-plated (.dse-hero already IS the plate), H-2 heroic-resource/surges crop
because their padding selectors are DEAD (class on root vs descendant selector), H-3 real
@media print gets the full Steel plate — PRE-EXISTING, filed SC-170 (7.0.0, Todo), M-1
canvas-character-sheet.png stale (obsidian-sourced) → fresh fix-round agent (reviewer
transcript expired). Live: SC-154 r2, SC-153 fr2, SC-135 fr1, SC-152 fr1, SC-165, SC-160.
Queued: SC-169 spec, SC-170.

### 2026-08-16 — SC-165 LANDED to develop (`c39cf4f`) + Done
Review LAND (render fidelity proven byte-identical across 3 families; stronger than the
branch's own proof); text-only fix round (docs no longer overclaim; fidelity assertion
adopted as 3 permanent tests, can-fail proven — it catches deny-list overreach the delete
sweep structurally cannot). ws 30733d1; ledger preserved. develop moved 9bb24c3→c39cf4f:
in-flight branches cut from 9bb24c3 (sc160, sc169) rebase trivially; older ones
(sc147/152/153/154 from 221acc9, sc135 from efdced2) rebase at landing as usual —
CHANGELOG adjacent-hunk conflicts expected (keep-both). Reviewer footgun recorded in
dse-verify (double-quoted \$? through devbox reports false 0). Load-sensitive jest suites
noted: settings-tab/settings-preview time out at 5s under CPU saturation — re-run before
believing red there. Live: SC-154 r2, SC-153 fr2, SC-135 fr1, SC-152 fr1, SC-160, SC-169.
Queued: SC-170.

## 2026-08-17 (early) — SC-153 LANDED (with an INCIDENT); usage window killed 4 agents
**SC-153 landed to develop `a2fc374` + Done** (ws 6bdc630, ledger preserved). Rebased
221acc9→c39cf4f clean; jest 2729 = 2714+15 (SC-165) exact.
**INCIDENT:** wt-finish pushed sc153 to dse **main** (0645aca→a2fc374) — the sc153
worktree's superproject predates SC-163 so its .gitmodules said `branch = main`.
Recovery, all lease-guarded: dse main force-reset back to 0645aca (6.0.1); branch pushed
to develop; superproject gitlink conflict resolved by hand (merge 6bdc630, .gitmodules
kept develop). SECOND-ORDER: the restore push ran the OLD ci.yml (`gh-deploy --force`) →
gh-pages WIPED to a single mkdocs commit → force-restored to mike tip 0b3752f (latest=
6.0.1, dev, versions.json, redirects). Then found: **SC-164's develop→dev deploy has
FAILED in CI on every run** (checkout has no gh-pages → mike push non-FF) — SC-164
REOPENED (Todo) with the fix (fetch gh-pages before mike deploy); must land before SC-11.
Prevented recurrence: sc147/sc152/sc154 worktrees had the same stale .gitmodules → each
got a superproject-only "sync .gitmodules" commit; land-stack pre-flight step 0 added;
git-workflow.md documents both footguns.
**Usage window limit (resets ~1:50am ET / next window) killed 4 agents mid-task:** SC-154
r2 (was writing its Linear comment — check worktree for committed work), SC-135 scoped
re-review (battery green, mutation probes not started), SC-160 impl (mid harness
manifest), SC-169 spec (mid shoot.mjs). All resumable by SendMessage or fresh dispatch;
worktrees hold their state. SC-152 fr1 DONE (`4c92257`): hero un-double-plated, dead
resource/surges selectors fixed → 2-line print rebaseline (heroic-resource, surges)
NEEDS SANCTION; canvas-character-sheet.png stale-pending; SC-152 comment/ask NOT yet
posted (one image uploaded). Next: post SC-152 ask, resume the 4 killed agents, SC-164
CI fix, SC-170.

### 2026-08-17 — SC-164 CI fix LANDED (`e7442f2`) + Done; SC-154 r2 + SC-152 asks live
CI fix (shallow explicit-refspec gh-pages fetch before mike) landed to develop; the landing
push was the live test: **develop ci run SUCCEEDED (first ever)**, gh-pages 032d296 on top
of mike tip 0b3752f, versions.json = 6.0.1/latest + dev. SC-164 Done. SC-154 round 2 done
(`975fde6`, 12 defects incl. Scott's 3 = one root cause; 44-combo zero-inset sweep) — TASTE
+ 2-line print SANCTION ask live (In Progress+Needs Review). SC-152 fr1 done (`4c92257`) —
2-line print SANCTION + 2 taste calls ask live. Scott's queue: SC-154, SC-152, SC-156.
Live agents: SC-135 scoped re-review (resumed), SC-160 (fresh, from WIP), SC-169 spec
(resumed). Queued: SC-170. develop tip e7442f2 — all four in-flight branches now behind it
(rebase at landing; expected trivial except CHANGELOG keep-both).

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
- **SC-122 DISCOVERED + FILED (Urgent, 2026-08-03): compiled CSS ships un-flattened native
  nesting** — silently dropped on old-Electron Obsidian (dev vault = Chromium 106; Obsidian
  auto-update never upgrades the shell). 231 nested rules / 21 families; initiative/
  negotiation/hero collapse in real Obsidian while browser-harness gates (Chromium 149) see
  nothing. **LIVE in released 6.0.1 (~1 year).** Verified end-to-end (CDP probes both
  runtimes): `.superpowers/sdd/sc121-audit/nesting-verification.md`. Fix = one-line esbuild
  CSS target (chrome106) + no-nesting build guard; agent implementing in worktree
  sc122-nesting. Stepper-size bug is INDEPENDENT (base .dse-btn 44px touch-min; stays in
  SC-121). **SC-122 lands before any SC-121 fix batch.**
- **SC-106 unblocked (Scott, 2026-08-03):** act-spine hues per `reference/colors.md`
  (Main red/Maneuver blue/Triggered green/Move orange-yellow/None theme-bw/Traits purple);
  temp-stamina + crit/VP gold = agent judgment. Implementing in worktree sc106-hues
  (+ tier-badge text tint lead); ends at Needs Review taste gate w/ before/after inline.
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

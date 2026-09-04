# SC-116 — decisions ledger (kit kind frontmatter)

Ticket: SC-116 "Emit kit kind (Martial / Magic / Psionic) as frontmatter; stop keyword-sniffing in the kit renderers"
Owner: Fable ticket-owner, session 4931eaaf-23fa-45a6-9d71-eaf64645d32d (2026-09-04)

## Where the work lives

The implementation was done in an EARLIER session on the shared trio worktree
`/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio` (branch `sc11x-kit-trio` in every
submodule). It is shared with SC-119 and SC-115 — one commit each in `steel-etl`:

- `c31e701` feat(kit): emit kit_type frontmatter; stop keyword-sniffing (SC-116)
- `d0e8c67` fix(kit): unify Browse kit tile absent-bonus formatting to dashes (SC-119)
- `6415f04` feat(kit): render the signature ability as a full inline card on the Browse kit tile (SC-115)

Prior-round evidence: `.superpowers/sdd/sc11x/sc11x-report.md`.
The dispatcher-assigned worktree name `sc116-kit-kind-frontmatter` was NOT created — the
existing trio worktree is the one that lands.

## Rulings (verbatim, dated)

### 2026-08-29 — Scott, on the 2026-08-23 "Done — …" report (SC-116)

> approved, land it

Context of what he approved (the report's ask): "**What you're approving:** land the trio. Note
this is a **data change** — it adds a field to emitted kit frontmatter, so it regenerates
`data-unified` on the next deploy."

## Owner state (2026-09-04)

- Labels: `Ready for Agent` removed 2026-09-04 (Scott's answer is in the thread; work resumed).
  Status stays `Awaiting` (agent actively working).
- Dispatcher told (SendMessage to main): branch is shared with SC-119/SC-115; one landing covers
  all three; do not run parallel owners on the worktree.
- The prior session's report shows NO independent review was run on the trio (gates only:
  build/vet/test). Landing-bound runtime code that regenerates `data-unified` → review is
  mandatory (ticket-owner §5). Review round 1 dispatched 2026-09-04 (Opus reviewer, brief:
  `sc116-review-r1-brief.md`, report: `sc116-review-r1.md`).
- Rebase state at dispatch: steel-etl branch 5 behind `origin/main` (c7d6940), v2 branch 3
  behind `origin/main`; no upstream file overlaps with the branch's files in either repo.
  Superproject worktree 91 behind `origin/main` — expect DESIGN.md / CHANGELOG.md merge
  reconciles at landing (land-stack routine).
- Gap found: no `## Unreleased` CHANGELOG bullet for this user-facing site change (every kit
  tile on the Browse index said "Martial Kit"; now 21 Martial / 3 Magic / 1 Psionic). Folded
  into the fix/rebase round.

## Owner rulings on prior-round follow-ups (from `sc11x-report.md` "Follow-ups noted")

1. **Schema description drift (steel-etl vs data-sdk-npm copies)** — DROP. Measured
   2026-09-04: 10 of 13 schema pairs differ by exactly one line, and every difference is the
   same "BETA — subject to change without notice." prefix on the SDK copy's top-level
   description; field declarations are identical. That is a deliberate SDK-side beta banner,
   not sync drift. Not a ticket.
2. **Browse kit tile height variance (full inline ability card)** — belongs to SC-115, not
   SC-116. Not ruled here; flagged to the dispatcher in the land-ready report so SC-115's
   owner (or Scott) sees it.
3. **Companion e2e test for the container-width card-head fix** — belongs to SC-115. Same
   handling as (2).

## Cross-owner coordination (2026-09-04)

- SC-119 has its own owner (ledger `.superpowers/sdd/sc119-kit-dash-format/sc119-decisions.md`).
  Agreed: `d0e8c67` rebases intact; SC-119-specific review findings are left unfixed under an
  "SC-119" heading in my review report for that owner's ruling; SC-119's CHANGELOG bullet
  (supplied verbatim by that owner) goes in my fix round's changelog commit; the land-ready
  report carries the post-rebase SC-119 sha + final steel-etl sha, and I message them to that
  owner directly.
- SC-115: no owner has made contact. My fix round writes its CHANGELOG bullet; SC-115-specific
  review findings are likewise left under an "SC-115" heading for whoever owns it (dispatcher
  told in the land-ready report).
- SC-119 owner, 2026-09-04: `d0e8c67` DEPENDS on `c31e701` (a trial cherry-pick of `d0e8c67`
  alone onto origin/main conflicted in `cards.go` — it was written on SC-116's frontmatter-first
  `kind` logic). Commit order `c31e701` → `d0e8c67` → `6415f04` must survive the rebase; no
  reordering or splitting. Corroboration: `.superpowers/sdd/sc119-kit-dash-format/sc119-round1-report.md`
  (gates green on main + that fix; Boren all 8 slots `—`, Shining Armor `+12 / +1 / +2/+2/+2`).
  The duplicate `sc119-kit-dash-format` worktree is removed; `sc11x-kit-trio` is the only path.

## Review round 1 result (2026-09-04) — `sc116-review-r1.md`

Verdict FIX-FIRST: 0 CRITICAL / 1 HIGH / 1 MED / 3 LOW / 3 INFO. SC-116 (`c31e701`) in isolation
is LAND-READY; the blocker is in SC-115 (`6415f04`), which lands in the same push. Blast radius
of the data change measured at merge-base vs branch: 300 files, all under `kit/`, +300/-0 lines
(one `kit_type` line per kit per format). Kit split re-derived from the source book: 21/3/1,
all 25 assignments match. 25/25 kit JSON pass both schema copies. Mutation probes 3/3 caught.

### Owner rulings on the findings

- **HIGH-1** (SC-115 code: `build.go` hoisted `buildLeafCardIndex` above the summoner augment
  passes; `embedItemCards` splices stale leaf cards; `Read/summoner/other-summoners.md` loses
  58,464 bytes — 5 `## Summons` grids, 1 `## Advancement Features`, 17 "Summoned by" lines) —
  **FOLD into this fix round as a separate `(SC-115)`-tagged commit.** Reason: the trio lands in
  one push (`d0e8c67` depends on `c31e701`; no reordering), no SC-115 owner has surfaced, and
  landing SC-116 without this fix ships a live-page regression. Dispatcher informed.
- **MED-1** (no test guards the pass-ordering invariant) — **FOLD**, same commit as HIGH-1.
- **LOW-1** (`deriveKitType` substring-matches raw markdown incl. link targets) — **FOLD**
  (SC-116 commit): strip `[X](Y)` → `X` before matching; substring stays deliberate for
  `Magic; Light Weapon`.
- **LOW-2** (`@kit-type:` precedence keys on key presence, not non-empty value) — **FOLD**
  (SC-116 commit), one-liner.
- **LOW-3** (three silent `Martial` defaults) — **FOLD a warning** if the parser path already
  has a warning mechanism; otherwise leave for the validate-check follow-up (do not invent a
  new diagnostics channel in a fix round).
- **INFO-1** (5 behind) — rebase is in the round.
- **INFO-2** (two build-scoped globals) — **DROP**: same pattern as the existing
  `statblockFeatureCache`; `Build()` was already non-reentrant.
- **INFO-3** (`parseKeywords` mis-splits) — **FILED** SC-295 (Backlog, ETL, related SC-116).

### Owner rulings on the reviewer's follow-ups

1. LOW-3 validate check — covered by the LOW-3 ruling above (warning if cheap; else drop —
   the emitted `kit_type` is now visible in the data, so a mislabel is no longer silent).
2. INFO-3 — SC-295 filed.
3. DSE `ds-kit` reader still sniffs (`layouts.ts:48-60`, comment says "until SC-116") —
   **FILED** SC-296 (Backlog, DSE Plugin, related SC-116 + SC-100): prefer `m.kit_type`.
4. Schema `kit_type` description still says `"Martial", "Caster", "Stormwight"` — **FOLD**:
   update the example list in BOTH copies (`steel-etl/schemas/kit.schema.json` and the
   worktree's `data-sdk-npm/src/schema/kit.schema.json`, branch `sc11x-kit-trio`, tracked
   branch `v3`). The landing therefore advances `data-sdk-npm` too — dispatcher informed.
5. Land order / rebase — in the round.

## Fix + rebase round 1 result (2026-09-04) — `sc116-fix-r1-report.md`

Rebased clean (plain, non-interactive, order preserved). steel-etl onto origin/main `d6bb008`
(origin advanced one test-only commit past the brief's `c7d6940`; no overlap), v2 onto
`9782209ec5`. New shas:

- steel-etl HEAD `81263e9`: `2785608` (SC-116) → `71002ce` (SC-119) → `83513bc` (SC-115) →
  `96406f7` fix(site) re-walk leaf-card index (SC-115, HIGH-1/MED-1) → `2704a1f` fix(kit)
  LOW-1/LOW-2 (SC-116) → `762f58d` docs(schema) (SC-116) → `81263e9` docs(kit) CLAUDE.md.
- v2 HEAD `f9347707dd` (SC-115 CSS, rebased).
- data-sdk-npm HEAD `a4ce584` on `sc11x-kit-trio` over tracked `v3` `a4c2a3e` (schema
  description only).
- superproject HEAD `b297b1d` docs(changelog) three bullets; pointer bumps left uncommitted.

Gates: build/vet/test all ok (8 packages). gen --all: 3086 items / 4 books. site: 3091 files,
529 index pages. Kit index 21/3/1. `other-summoners.md` 217,633 bytes / 5 Summons / 1
Advancement Features / 17 sb-backlink — regression fixed. FF-safe: steel-etl, v2 true.
Superproject conflict predictor (fork `fd8d20c`): CHANGELOG.md, DESIGN.md (routine).

LOW-3: skipped by the implementer per ruling — no warning mechanism reachable from
`KitParser.Parse`; the only warn level is `steel-etl validate`'s CLI issue-walk. **Owner ruling:
DROP.** `kit_type` is now an emitted, visible field (and the Browse index shows the kind), so a
future mislabel is no longer silent; a validate check is not worth a ticket.

Next: scoped re-review (round 2) by the round-1 reviewer (author-independent: the fixer was a
separate Sonnet implementer).

## Re-review round 2 result (2026-09-04) — `sc116-review-r2.md`

LAND-READY with one MED caveat. All items PASS except 1b: the new
`TestEmbedItemCards_ReflectsLeafMutationAfterEarlyIndex` calls `buildLeafCardIndex` /
`embedItemCards` directly and never `Build()`, so reverting Commit A's `build.go` re-walk leaves
the suite GREEN — the test does not guard the ordering invariant HIGH-1 broke (MED-1 not
actually satisfied). HIGH-1 itself is fixed (page byte-identical to baseline).

**Owner ruling: FIX NOW (fix round 2), not file.** A guard test that cannot fail on the
regression it exists for is the vacuous-test failure mode this pipeline exists to catch; the
reviewer says scaffolding already exists at `internal/site/build_test.go:61/:394/:529`. Small,
same area, same commit family (SC-115 tag). Acceptance: reverting the `build.go` re-walk hunk
must turn the new test RED; with it, GREEN. Then a mutation-probe-only re-check by the reviewer.

## Fix round 2 result (2026-09-04)

steel-etl `093da29` test(site): `TestBuild_EmbeddedCardsSeeSummonerRetainerAugments` drives real
`Build(cfg)`; PASS at HEAD, FAIL (naming missing `## Summons` and `sb-backlink`) with Commit A's
re-walk reverted in a scratch clone; gates all ok. Round 3 = reviewer mutation-probe of this
one test; land-ready follows a PASS.

## Round 3 result + LAND-READY (2026-09-04)

Reviewer mutation probe: new test PASS at `093da29`, FAIL with the re-walk reverted (both
markers named), gates all ok, worktree unchanged, no wrong-reason pass (asserts on the container
page, drives real `Build(cfg)`). **Verdict LAND-READY.**

Final land-ready state (trio, one landing):
- worktree `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio`, branch `sc11x-kit-trio`
- steel-etl `093da29` (8 commits over origin/main `d6bb008`; FF-safe) — tracked `main`
- v2 `f9347707dd` (1 commit over origin/main `9782209ec5`; FF-safe) — tracked `main`
- data-sdk-npm `a4ce584` (1 commit over origin/v3 `a4c2a3e`; FF-safe) — tracked `v3`
- superproject `b297b1d` (2 commits: DESIGN.md note `4a3e470`, CHANGELOG `b297b1d`); pointer
  bumps for steel-etl / v2 / data-sdk-npm left UNCOMMITTED for the landing step; predicted
  superproject merge conflicts: CHANGELOG.md, DESIGN.md (keep both sides)
- worktree `data/data-unified` is dirty from gen (scratch clone, not a submodule) — ignore
- Land-ready comment posted to SC-116; ticket stays Awaiting until the dispatcher reports landed,
  then → Done. SC-119 owner notified of final shas. SC-115 has no owner in contact: its
  land-ready/Done bookkeeping falls to the dispatcher or to me on request.

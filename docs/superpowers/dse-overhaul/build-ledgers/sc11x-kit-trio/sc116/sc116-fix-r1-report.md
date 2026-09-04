# SC-116 — fix + rebase round 1 (implementer report)

## Executive summary

Rebased steel-etl (onto `origin/main` `d6bb008`, one commit past the brief's expected
`c7d6940` — a test-only, non-overlapping addition; fetched and confirmed before rebasing)
and v2 (onto `origin/main` `9782209ec5`, exact match) — both plain, non-interactive, both
clean, commit order `c31e701`→`d0e8c67`→`6415f04` preserved as `2785608`→`71002ce`→`83513bc`.
Applied Commit A (HIGH-1/MED-1, build.go re-walk fix + guard test), Commit B (LOW-1/LOW-2
fixed + tested; LOW-3 skipped per owner ruling — no warning mechanism exists on the parser
path), Commit C (schema description, both repos). Gates: build/vet/test all green, zero vet
output. `gen --all` + `site` both succeeded; Browse kit split is exactly 21 Martial / 3 Magic
/ 1 Psionic; `other-summoners.md` is exactly 217,633 bytes / 5 `## Summons` / 1
`## Advancement Features` / 17 `sb-backlink` — HIGH-1 fix validated end-to-end. Worktree
cleaned; root `git status --short` shows only `M data-sdk-npm` / `M steel-etl` / `M v2`, all
four submodules' porcelain status empty. FF-safe true for steel-etl and v2. Superproject
conflict-predictor: `CHANGELOG.md`, `DESIGN.md` (expected). No conflicts encountered anywhere
— no NEEDS_CONTEXT stop required.

**Status: DONE**

## 1. Rebase

- steel-etl: `git fetch origin` inside the worktree clone found `origin/main` at `d6bb008`
  (bumped one commit past the brief's expected `c7d6940` since dispatch — `d6bb008`
  `test(site): SC-157 — lock in captained-minion With Captain end-to-end`, a test-only
  addition to `internal/site/statblock_page_test.go`, no overlap with this branch's 9 files).
  Plain `git rebase origin/main`: **clean, no conflicts**, exit 0.
- v2: `git fetch origin` found `origin/main` at `9782209ec5` — exact match to the brief's
  expected sha. Plain `git rebase origin/main`: **clean, no conflicts**, exit 0.
- Commit order preserved: `c31e701`→`2785608`, `d0e8c67`→`71002ce`, `6415f04`→`83513bc`.

New shas after rebase (before the fix commits):
- steel-etl: `2785608` (SC-116) → `71002ce` (SC-119) → `83513bc` (SC-115)
- v2: `f9347707dd`

## 2. Review findings

### Commit A — `fix(site): re-walk the leaf-card index before embedItemCards (SC-115)`

sha `96406f7`. Files: `internal/site/build.go`, `internal/site/embed_cards_test.go`.

- **HIGH-1** fixed exactly as prescribed: `build.go:163` (post-rebase line numbers may
  differ slightly) now re-walks with `freshCards, freshErrs := buildLeafCardIndex(cfg)`
  before calling `embedItemCards(cfg, freshCards)`, instead of reusing the early
  `leafCards` index taken before the `augmentRivalSummonerPages` /
  `augmentSummonerRetainerPages` / `buildBestiarySearchPage` passes. Doc comment at the
  early index's call site now states the invariant explicitly.
- **MED-1** fixed: added `TestEmbedItemCards_ReflectsLeafMutationAfterEarlyIndex` in
  `internal/site/embed_cards_test.go` — builds an early index, mutates the leaf on disk
  (simulating an augment-* pass), then asserts (a) embedding with the **stale** early
  index does NOT see the mutation (documents the failure mode) and (b) embedding with a
  **freshly re-walked** index does. This guards the exact pass-ordering invariant HIGH-1
  broke.

Acceptance measured (see §5 below): `Read/summoner/other-summoners.md` is byte-identical
to the merge-base numbers (217,633 bytes; 5 `## Summons`; 1 `## Advancement Features`; 17
`sb-backlink`), and `Browse/kit/*` shows the expected 21/3/1 split.

### Commit B — `fix(kit): SC-116 review round 1 — link-safe kind match, annotation guard`

sha `2704a1f`. Files: `internal/content/kit.go`, `internal/content/kit_test.go`.

- **LOW-1** fixed: `deriveKitType` now strips markdown link targets to display text via
  the package's existing `contentMdLinkRe` (`\[([^\]]*)\]\([^)]*\)` → `$1`, already used
  by `flavor.go`) before the `Contains(joined, "Magic"/"Psionic")` match. Doc comment
  notes substring (not exact-equality) matching is deliberate for the real
  `"Magic; Light Weapon"` keyword. Test: `TestKitParser_KitTypeIgnoresLinkTargets` — a
  keyword linked to a target containing "Magic" (display text "Melee") must NOT flip a
  Martial kit; `"Magic; Light Weapon"` (no link) must still read Magic.
- **LOW-2** fixed: the annotation branch at `kit.go` now only sets `fm["kit_type"] = v`
  when `strings.TrimSpace(v) != ""`, so a blank/whitespace-only `@kit-type:` value falls
  through to derivation instead of suppressing it and emitting `kit_type: ""`. Test:
  `TestKitParser_KitTypeAnnotationEmptyValueFallsThroughToDerivation`.
- **LOW-3** — **not fixed, per owner ruling**. Checked `internal/content`,
  `internal/parser`, `internal/pipeline` for a warning/diagnostic mechanism reachable
  from `KitParser.Parse`: none exists. The only `"warn"` level in the codebase belongs to
  `steel-etl validate`'s CLI-only issue-collection walk (`internal/cli/validate.go`,
  `internal/cli/feature_source_check.go`) — a separate command with its own tree walk,
  not accessible from the parser path. Per the owner's ruling ("If none exists, do not
  invent one — skip LOW-3 and say so under Follow-ups"), skipped. See Follow-ups below.

### Commit C — schema description, both copies

- steel-etl: sha `762f58d` — `schemas/kit.schema.json:24` example list changed from
  `"Martial", "Caster", "Stormwight"` to `"Martial", "Magic", "Psionic"`.
- data-sdk-npm: sha `a4ce584` (branch `sc11x-kit-trio`, tracked `v3` at `a4c2a3e`) — same
  change to `src/schema/kit.schema.json:24`.
- Post-change `diff` of the two files: differs **only** by the SDK copy's top-level
  `"BETA — subject to change without notice. "` description prefix, as before — confirmed.

## 3. Changelog

One commit in the superproject: `docs(changelog): kit Browse tile trio (SC-116, SC-119,
SC-115)`, sha `b297b1d`. Three bullets added at the top of `## Unreleased` in
`/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/CHANGELOG.md`, in order SC-116,
SC-119 (pasted verbatim from the brief, unedited), SC-115.

## 4. Docs

`steel-etl/CLAUDE.md`, under the "Kits" bullet (`~line 162` in the rebased file) in the
embedded-child-abilities section, one sentence added: "`kit_type` (Martial / Magic /
Psionic) is derived at parse time from the signature ability's keywords by
`deriveKitType` (SC-116); an explicit `@kit-type:` annotation wins." Commit sha `81263e9`.

## 5. Gates

All run via `devbox run -- bash -c 'cd .../steel-etl && <cmd>'`, output redirected to
per-run files under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`.

- `go build ./...` → exit 0, no output. (`gate-build.log`)
- `go vet ./...` → exit 0, **zero vet output**. (`gate-vet.log`)
- `go test ./...` → exit 0, all packages `ok`:
  `cli 0.010s, content 0.560s, context (cached), output 1.475s, parser 0.514s,
  pipeline 0.922s, scc (cached), site 0.108s`. `cmd/steel-etl` — no test files.
  (`gate-test.log`)
- `go run ./cmd/steel-etl gen --config pipeline.yaml --all` → exit 0. "Shared outputs
  regenerated over 3086 classified items from 4 books." (`gate-gen.log`)
- `go run ./cmd/steel-etl site --config ../v2/site.yaml` → exit 0. Sections built: 2,
  Files copied: 3091, Index pages: 529, Nav files: 6, Search exclude: 34, SCC stubs: 3086,
  Printing stamps: 3086. (`gate-site.log`)

Post-build verification:

- `grep -o 'sc-card__type">[^<]*' v2/docs/Browse/kit/index.md | sort | uniq -c`:
  ```
        3 sc-card__type">Magic Kit
       21 sc-card__type">Martial Kit
        1 sc-card__type">Psionic Kit
  ```
  Matches the required 21 Martial / 3 Magic / 1 Psionic exactly.
- `v2/docs/Read/summoner/other-summoners.md`: **217,633 bytes**; `## Summons` **5**;
  `## Advancement Features` **1**; `sb-backlink` **17** — byte-identical to the
  merge-base numbers the reviewer measured. HIGH-1 fix confirmed working end-to-end on a
  real full pipeline + site build, not just the unit test.

## Drive-by fixes

None.

## Follow-ups

1. **LOW-3 diagnostic** (not fixed this round, per owner ruling) — a
   `steel-etl validate` check (or new parser-path warning mechanism) for a `@type: kit`
   section whose signature ability yields zero keywords, so a future source edit can't
   silently re-mislabel a kit as Martial with no diagnostic. `internal/content` has no
   warning/diagnostic channel today; adding one is a design choice outside this fix
   round's scope.

## 6. Worktree cleanliness

- v2: `git clean -fdq docs site` then `git checkout -- docs/Browse docs/Read docs/scc`
  (never `git checkout -- .`) → `git status --porcelain` empty.
- steelCompendium.github.io: `git checkout -- .` then `git clean -fdq docs` →
  `git status --porcelain` empty.
- No worktree-root `site/` directory was present (nothing to remove).
- steel-etl, data-sdk-npm: already clean (no generated-output writes touch these repos'
  working trees beyond the committed source changes).
- `data/data-unified` (a sibling generated-output clone, **not** a superproject
  submodule per `.gitmodules` — confirmed) is left dirty from the `gen --all` run; out of
  scope for this cleanup step (not listed in the brief, and not a submodule the
  superproject's status reflects).
- Final `git status --short` at the worktree root
  (`/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio`):
  ```
   M data-sdk-npm
   M steel-etl
   M v2
  ```
  Each of steel-etl / v2 / steelCompendium.github.io / data-sdk-npm's
  `git status --porcelain` is empty.

## 7. Landing preflight numbers

- steel-etl: `git merge-base --is-ancestor origin/main sc11x-kit-trio` → **FF-safe** (true).
- v2: `git merge-base --is-ancestor origin/main sc11x-kit-trio` → **FF-safe** (true).
- Superproject conflict-predictor (`fork` = `git merge-base origin/main sc11x-kit-trio` =
  `fd8d20c`):
  ```
  CHANGELOG.md
  DESIGN.md
  ```
  Both expected (per the ledger's INFO-1/land-order note about the 91-behind superproject
  worktree needing a DESIGN.md/CHANGELOG.md merge reconcile at landing).

## Final commit shas (in order)

**steel-etl** (rebased onto `origin/main` `d6bb008`), HEAD `81263e9`:
1. `2785608` feat(kit): emit kit_type frontmatter; stop keyword-sniffing (SC-116)
2. `71002ce` fix(kit): unify Browse kit tile absent-bonus formatting to dashes (SC-119)
3. `83513bc` feat(kit): render the signature ability as a full inline card on the Browse kit tile (SC-115)
4. `96406f7` fix(site): re-walk the leaf-card index before embedItemCards (SC-115) — Commit A
5. `2704a1f` fix(kit): SC-116 review round 1 — link-safe kind match, annotation guard — Commit B
6. `762f58d` docs(schema): kit_type examples match what is emitted (SC-116) — Commit C
7. `81263e9` docs(kit): note kit_type derivation (SC-116)

**v2** (rebased onto `origin/main` `9782209ec5`), HEAD `f9347707dd`:
1. `f9347707dd` fix(kit): style the inline signature-ability card on the Browse kit tile (SC-115)

**data-sdk-npm** (branch `sc11x-kit-trio`, tracked `v3` at `a4c2a3e`), HEAD `a4ce584`:
1. `a4ce584` docs(schema): kit_type examples match what is emitted (SC-116) — Commit C

**Superproject** (worktree branch `sc11x-kit-trio`), HEAD `b297b1d`:
1. `b297b1d` docs(changelog): kit Browse tile trio (SC-116, SC-119, SC-115)

Submodule pointer diffs (`M steel-etl`, `M v2`, `M data-sdk-npm`) left UNCOMMITTED per the
brief — the landing step's move, not this round's.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-fix-r1-report.md`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/steel-etl-rebase.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/v2-rebase.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/commitA-test.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/commitA-build.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/commitB-test.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/commitB-build.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/gate-build.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/gate-vet.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/gate-test.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/gate-gen.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/gate-site.log`

Modified/created source files (all under
`/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/`):
- `steel-etl/internal/site/build.go`
- `steel-etl/internal/site/embed_cards_test.go`
- `steel-etl/internal/content/kit.go`
- `steel-etl/internal/content/kit_test.go`
- `steel-etl/schemas/kit.schema.json`
- `steel-etl/CLAUDE.md`
- `data-sdk-npm/src/schema/kit.schema.json`
- `CHANGELOG.md` (superproject)

## Fix round 2 (2026-09-04)

Scoped re-review (`sc116-review-r2.md`, item 1b): MED-1's guard test
(`TestEmbedItemCards_ReflectsLeafMutationAfterEarlyIndex`) calls `buildLeafCardIndex` /
`embedItemCards` directly and never calls `Build()`, so it asserts nothing about the call
order `Build()` uses them in — the HIGH-1 regression could be reintroduced in `build.go`
with every gate green. Fix: added a `Build()`-level guard test. One new commit, steel-etl
sha **`093da29`**, on top of the prior round's HEAD `81263e9` (no rebase, amend, or
reorder — plain fast-forward addition).

### New test

`TestBuild_EmbeddedCardsSeeSummonerRetainerAugments` in `internal/site/build_test.go`. It
drives the real `Build(cfg)` over a source tree shaped like the real bug: a summoner-book
retainer statblock (`monster/retainer/devil-detective.md`) + its minion summon
(`monster/retainer/summoner/minion/razor.md`) — the exact shape
`augmentSummonerRetainerPages` rewrites, adding `"## Summons"` to the retainer and an
`sb-backlink` to the minion — plus a `class/summoner.md` container page that transcludes
both leaves by their `{data-scc}` marker. It asserts the built container page carries both
post-augment markers.

### (a) Passes with the current `build.go`

```
devbox run -- bash -c 'cd .../steel-etl && go test ./internal/site/... -run TestBuild_EmbeddedCardsSeeSummonerRetainerAugments -v'
=== RUN   TestBuild_EmbeddedCardsSeeSummonerRetainerAugments
--- PASS: TestBuild_EmbeddedCardsSeeSummonerRetainerAugments (0.01s)
PASS
ok  	github.com/SteelCompendium/steel-etl/internal/site	0.012s
```

### (b) Fails when Commit A's re-walk hunk is reverted

Done in a throwaway scratch clone (`git clone` of the worktree's `steel-etl` at `81263e9`
into
`/tmp/claude-1000/.../scratchpad/r2-revert-clone`, never the worktree itself), with the new
(then-uncommitted) `build_test.go` copied in and `build.go`'s re-walk hunk manually reverted
back to `embedCount, embedErrs := embedItemCards(cfg, leafCards)` (dropping the
`freshCards`/`freshErrs` re-walk). `go build ./...` still exits 0 (the regression is silent
at compile time, matching the round-2 review's own probe). Then:

```
go test ./internal/site/... -run TestBuild_EmbeddedCardsSeeSummonerRetainerAugments -v
=== RUN   TestBuild_EmbeddedCardsSeeSummonerRetainerAugments
    build_test.go:1494: class page missing the retainer's post-augment "## Summons" grid
        (embedItemCards spliced a stale pre-augment leaf card):
        ...
    build_test.go:1497: class page missing the minion's post-augment sb-backlink
        (embedItemCards spliced a stale pre-augment leaf card):
        ...
--- FAIL: TestBuild_EmbeddedCardsSeeSummonerRetainerAugments (0.01s)
FAIL
FAIL	github.com/SteelCompendium/steel-etl/internal/site	0.013s
```

Both failure messages name the specific missing marker (`"## Summons"` and
`sb-backlink`) — the test fails exactly the way HIGH-1's regression would reintroduce it,
and the two dumped page bodies show the container spliced the retainer's/minion's
pre-augment `.sb-wrap` cards with neither marker present. The scratch clone was deleted
afterward; the worktree itself was never modified during this probe.

### (c) Restored — full gates green

Run in the actual worktree (current, fixed `build.go` + the new committed test):

```
go build ./...   → BUILD_EXIT:0
go vet ./...     → VET_EXIT:0   (zero output)
go test ./...    → TEST_EXIT:0  — cli, content, context, output, parser, pipeline, scc
                                  (all cached ok), site 0.105s (fresh)
```

### Cleanliness

Worktree root `git status --short`: `M data-sdk-npm`, `M steel-etl`, `M v2` — unchanged
from round 1, nothing else. `git status --porcelain` empty in all four submodules
(steel-etl, v2, data-sdk-npm, steelCompendium.github.io).

### New steel-etl HEAD

`093da29` `test(site): Build()-level guard for the leaf-card index ordering invariant (SC-115)`
— on top of `81263e9` (round 1's final commit); the trio's rebase/order from round 1
(`2785608` → `71002ce` → `83513bc`) is untouched.

### Artifacts

- Report (this file, appended):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-fix-r1-report.md`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/r2-newtest.log` — (a)
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/r2-revert-test.log` — (b), full failure output
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/r2-gate-build.log`,
  `r2-gate-vet.log`, `r2-gate-test.log` — (c)
- Modified file:
  `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/steel-etl/internal/site/build_test.go`

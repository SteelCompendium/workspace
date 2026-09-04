# SC-116 — scoped re-review, round 2 (delta only)

**Verdict: LAND-READY with one MED caveat** (owner's call whether to fix now or file).

| # | Item | Result |
|---|---|---|
| 1a | HIGH-1 fix — `build.go` re-walk + invariant doc comment | **PASS** |
| 1b | MED-1 guard test fails if the re-walk is removed | **FAIL** — reverting the re-walk leaves `./internal/site` fully green; the new test never calls `Build()` |
| 1c | `other-summoners.md` re-measured: 217,633 B / 5 / 1 / 17; kit index 21/3/1 + 25 sig cards | **PASS** |
| 2 | LOW-1 link-stripping, LOW-2 empty-annotation guard, both mutation-probed; LOW-3 skip documented | **PASS** |
| 3 | Commit C description-only, both copies, 25/25 validate | **PASS** |
| 4 | Rebase integrity — order preserved, all three patches byte-identical, FF-safe ×3 | **PASS** |
| 5 | Cleanliness — `M data-sdk-npm` / `M steel-etl` / `M v2`, all submodules empty; CHANGELOG + CLAUDE.md present | **PASS** |
| 6 | Gates — build / vet / test | **PASS** (0, 0, all 8 packages ok) |

One-line reason: the HIGH-1 regression is genuinely gone end-to-end (site delta vs
`origin/main` is exactly 26 files, all `Browse/kit`), but the MED-1 test that was supposed to
stop it coming back does not actually guard `build.go`.

Shas verified: steel-etl `81263e9` over `origin/main` `d6bb008`; v2 `f9347707dd` over
`9782209ec5`; data-sdk-npm `a4ce584` over `origin/v3` `a4c2a3e`; superproject `b297b1d`.

---

## The one FAIL — MED-1's guard test does not guard `build.go`

`internal/site/embed_cards_test.go` — `TestEmbedItemCards_ReflectsLeafMutationAfterEarlyIndex`.

**Probe.** In a throwaway clone at `81263e9` I reverted Commit A's `build.go` hunk exactly
(back to `embedCount, embedErrs := embedItemCards(cfg, leafCards)`, dropping the re-walk) and
ran the suite:

```
go build ./...        → exit 0
go test ./internal/site/  → ok  github.com/SteelCompendium/steel-etl/internal/site  0.095s
```

**Green.** The regression can be reintroduced in `build.go` with every gate passing.

**Why.** The test calls `buildLeafCardIndex` and `embedItemCards` directly and hands them a
stale index in one subtest and a fresh one in the other. That documents the two helpers'
behaviour — which was never in doubt — but asserts nothing about the order `Build()` calls
them in, which is the whole of HIGH-1. It is a behaviour note, not a regression guard.

**Prescribed fix.** Make it a `Build()`-level test; `internal/site/build_test.go` already
drives `Build(cfg)` against temp source/docs dirs in ~10 places (e.g. `build_test.go:61`,
`:394`, `:529`), so the scaffolding exists. Shape: a source tree containing a summoner
retainer leaf + its summon leaves (whatever `augmentSummonerRetainerPages`,
`summoner_retainer.go:21`, rewrites) plus a container page carrying that leaf's
`{data-scc}` marker; run `Build(cfg)`; assert the container page contains
`sb-backlink` / `## Summons`. That assertion fails the moment the re-walk is removed.
Keep the existing two subtests as-is — they are useful documentation — and add the
`Build()`-level one alongside.

**Severity: MED, not a blocker.** No live defect ships: HIGH-1 itself is fixed and verified
end-to-end (below). Only the future-proofing is missing.

---

## Everything else — measured

### Item 1 — HIGH-1 fix (Commit A `96406f7`)

`build.go` matches the prescribed shape verbatim:

```go
	freshCards, freshErrs := buildLeafCardIndex(cfg)
	result.Errors = append(result.Errors, freshErrs...)
	embedCount, embedErrs := embedItemCards(cfg, freshCards)
```

The invariant is documented at **both** sites — an eight-line `INVARIANT:` block at the early
index's call site naming the three augment passes and the failure mode, plus a two-line
re-walk rationale at the embed call. Better than prescribed.

Full `gen --all` + `site` at `81263e9` in an isolated clone (never the worktree):

| metric | `origin/main` `d6bb008` | branch `81263e9` |
|---|---|---|
| `Read/summoner/other-summoners.md` bytes | 217,633 | **217,633** (`cmp` → identical) |
| `^## Summons` / `^## Advancement Features` / `sb-backlink` in that file | 5 / 1 / 17 | **5 / 1 / 17** |
| site-wide files containing `sb-backlink` / `## Summons` / `## Advancement Features` | — | **54 / 6 / 2** (round-1 merge-base values) |
| `Browse/kit/index.md` `sc-card__type` | 25 × Martial Kit | **3 Magic / 21 Martial / 1 Psionic** |
| `sc-card__sig-card` | 0 | **25** |
| `"0"` stat values / `—` stat values | 43 / — | **0 / 109** |

**Whole-branch site delta vs `origin/main`: 26 files, 100 % under `Browse/kit`.** No page
outside the kit tree changes — the HIGH-1 collateral is gone and nothing new appeared.

**Whole-branch data delta vs `origin/main`: 300 files, 100 % under `kit/`, +300 / −0** —
`kit_type: Martial` ×210, `Magic` ×30, `Psionic` ×10, `"kit_type": "Martial",` ×42,
`"Magic",` ×6, `"Psionic",` ×2. Byte-for-byte the same shape round 1 measured against the old
merge-base, so the rebase over 6 upstream commits changed nothing about the blast radius.
Emitted kit split re-confirmed from the regenerated corpus: 21 / 3 / 1.

### Item 2 — LOW-1 / LOW-2 / LOW-3 (Commit B `2704a1f`)

- **LOW-1** — `kit.go:110` now runs
  `contentMdLinkRe.ReplaceAllString(strings.Join(keywords, " "), "$1")` before matching.
  `contentMdLinkRe` is the package's existing `\[([^\]]*)\]\([^)]*\)` from `flavor.go:9`
  (reused, not duplicated). Display text is kept, targets dropped; substring matching is
  retained with the `Magic; Light Weapon` rationale in the doc comment — exactly the
  prescription, including the reason exact-equality was rejected.
  **Mutation probe:** reverting to the unstripped join →
  `TestKitParser_KitTypeIgnoresLinkTargets/Link_Target_Not_Display_Text` **FAILS**
  (`kit_type = Magic, want Martial`). The test's second case pins
  `Magic; Light Weapon` → `Magic`, so a future switch to exact-equality is also caught.
- **LOW-2** — `kit.go:41` is now
  `if v, ok := ann["kit-type"]; ok && strings.TrimSpace(v) != ""`. **Mutation probe:**
  dropping the `TrimSpace` clause →
  `TestKitParser_KitTypeAnnotationEmptyValueFallsThroughToDerivation` **FAILS**
  (`kit_type = "  ", want derived Magic`). `TestKitParser_KitTypeAnnotationOverride`
  (non-empty `Stormwight`) still passes, so precedence is intact.
- **LOW-3** — skipped. The fix report says so and why in three places (§2 Commit B, the
  commit message body, and Follow-ups #1: no warning channel reachable from
  `KitParser.Parse`; the only `warn` level belongs to `steel-etl validate`'s CLI issue walk).
  Independently confirmed against the owner's ruling in `decisions.md`
  ("Owner ruling: DROP"). **Consistent — no action.**

### Item 3 — Commit C (`762f58d` steel-etl, `a4ce584` data-sdk-npm)

Description-only, one line each, identical text in both copies:
`"The category of kit (e.g., \"Martial\", \"Magic\", \"Psionic\")."`.
`diff` of the two `kit.schema.json` files → **one hunk**, the SDK copy's
`"BETA — subject to change without notice. "` top-level description prefix; nothing else.
Re-ran `validate.py` (draft 2019-09, `jsonschema` 4.26.0, local `$ref` registry) against the
freshly generated corpus at `81263e9`: **25/25 pass `steel-etl/schemas/kit.schema.json`** and
**25/25 pass `data-sdk-npm/src/schema/kit.schema.json`**.

### Item 4 — Rebase integrity

Commit order preserved and each rebased patch is **byte-identical** to its pre-rebase
original (`git show <sha> --format="" -U3` compared pairwise; `--stat` also identical):

| pre-rebase | post-rebase | subject | patch |
|---|---|---|---|
| `c31e701` | `2785608` | SC-116 | identical |
| `d0e8c67` | `71002ce` | SC-119 | identical |
| `6415f04` | `83513bc` | SC-115 | identical |
| `7e56d40e63` | `f9347707dd` | SC-115 CSS (v2) | identical |

Fix commits sit on top in the stated order: `96406f7` (A) → `2704a1f` (B) → `762f58d` (C) →
`81263e9` (CLAUDE.md). FF-safe confirmed independently: steel-etl `true`, v2 `true`,
data-sdk-npm `true` (`a4ce584^` == `origin/v3` `a4c2a3e`). No upstream regression — the site
delta vs `origin/main` touches only `Browse/kit`, and the data delta only `kit/`, so none of
the six steel-etl / three v2 upstream commits' areas moved.

### Item 5 — Cleanliness and docs

Worktree root `git status --short`: `M data-sdk-npm`, `M steel-etl`, `M v2` — nothing else.
`git status --porcelain` empty in all four submodules (steel-etl, v2, data-sdk-npm,
steelCompendium.github.io). CHANGELOG: `b297b1d`, +13 lines, three bullets at the top of
`## Unreleased` in SC-116 → SC-119 → SC-115 order, all readable and accurate (SC-116's cites
21/3/1 and Battlemind; SC-119's the Boren `0 0 0 0` → `— — — —` case; SC-115's notes the
tile-height consequence). `steel-etl/CLAUDE.md:162` carries the one-sentence
`deriveKitType` note appended to the existing Kits bullet — router-appropriate, no history.

### Item 6 — Gates (at `81263e9`, isolated clone)

```
go build ./...  BUILD_EXIT=0
go vet ./...    VET_EXIT=0   (zero output)
go test ./...   TEST_EXIT=0  — cli 0.010s, content 0.426s, context 0.004s, output 1.434s,
                               parser 0.436s, pipeline 0.890s, scc 0.007s, site 0.120s
gen --all  → "Shared outputs regenerated over 3086 classified items from 4 books."
site       → Sections 2, Files copied 3091, Index pages 529, Nav files 6,
             Search exclude 34, SCC stubs 3086, Printing stamps 3086
```

---

## INFO (no action asked)

- `worktrees/sc11x-kit-trio/data/data-unified` is a git repo (not a superproject submodule)
  and is left with 3 dirty paths from the fix round's `gen --all`. Matches the fix report's
  §6 note; `just deploy*` resets it with `reset --hard` anyway. Recording, not a finding.
- Round 1's `sc116-blast/mb` baseline (`7ef2284`) is now stale — the branch rebased 6 upstream
  commits forward, so a docs diff against it shows 409 files of upstream noise. Round 2's
  numbers all use `origin/main` `d6bb008`, which is also the current merge-base.

---

## Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r2.md`

Scratchpad root
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`:

- `r2-commitA.diff`, `r2-commitB.diff` — the fix commits as reviewed
- `sc116-r2/r2-gates.txt` — build / vet / test at `81263e9`
- `sc116-r2/r2-gen.log`, `r2-site.log` — branch pipeline + site
- `sc116-r2/r2-gen-base.log`, `r2-site-base.log` — `origin/main` `d6bb008` baseline
- `sc116-r2/r2-data-diff-files.txt`, `r2-data-diff-full.txt` — data delta (300 files, +300/−0)
- `sc116-r2/r2-site-diff-files.txt` — site delta (26 files, all `Browse/kit`)
- `sc116-r2/r2-site-vs-mb.txt` — stale-baseline comparison (see INFO)
- `sc116-r2/mut/` — mutation clone (restored clean after each probe)
- `sc116-r2/{head,base}/` — the two isolated build trees with their `data/` and `v2/docs/`
- `sc116-blast/validate.py` — the JSON-Schema validator (reused from round 1)

---

## Round 3 — mutation probe of the new Build()-level guard

**Verdict: LAND-READY.** Item 1b's FAIL is resolved. All four checks PASS.

Sha: steel-etl `sc11x-kit-trio` HEAD **`093da29`** — "test(site): Build()-level guard for the
leaf-card index ordering invariant (SC-115)", one commit on `81263e9`,
`internal/site/build_test.go` +57 / −0, no production code touched. All work in an isolated
clone under the scratchpad; the worktree was never built into.

| # | Check | Result |
|---|---|---|
| 1 | `TestBuild_EmbeddedCardsSeeSummonerRetainerAugments` at `093da29` | **PASS** (`--- PASS … (0.01s)`) |
| 2 | Same test with Commit A's `build.go` re-walk reverted | **FAIL, as required** — both assertions fire |
| 3 | `go build ./... && go vet ./... && go test ./...` at `093da29` | **PASS** — 0 / 0 (zero vet output) / all 8 packages `ok` |
| 4 | Worktree unchanged | **PASS** |

### (2) — the failure message

Reverting the hunk back to `embedCount, embedErrs := embedItemCards(cfg, leafCards)` (removing
the `freshCards, freshErrs := buildLeafCardIndex(cfg)` re-walk) makes the package fail:

```
--- FAIL: TestBuild_EmbeddedCardsSeeSummonerRetainerAugments (0.01s)
    build_test.go:1494: class page missing the retainer's post-augment "## Summons" grid
        (embedItemCards spliced a stale pre-augment leaf card):
        …
    build_test.go:1497: class page missing the minion's post-augment sb-backlink
        (embedItemCards spliced a stale pre-augment leaf card):
        …
FAIL	github.com/SteelCompendium/steel-etl/internal/site	0.106s
```

Both assertions fire, and each names the exact marker it expected — a maintainer who
reintroduces the bug is told what broke and why. The re-walk was restored and the test
re-run green (`ok … 0.012s`); the clone's `git status --porcelain` is empty.

### Read-through — nothing that would pass for the wrong reason

- Assertions read **`docs/Browse/class/summoner.md`** — the container that transcludes the two
  leaves — not the leaves themselves. Asserting on the leaf (the failure mode the brief warned
  about) would have passed under the mutation, since the augment passes still run and still
  rewrite the leaves; it does not.
- The fixture is the real bug's shape: a `monster/retainer` statblock plus its
  `monster/retainer/summoner/minion` summon (what `augmentSummonerRetainerPages`,
  `summoner_retainer.go:21`, rewrites) and a class page carrying **both** leaves'
  `{data-scc}` markers. Both markers are asserted, so a partial regression on either the
  `## Summons` grid or the `sb-backlink` is caught independently.
- It drives the real `Build(cfg)` — no hand-sequenced calls to `buildLeafCardIndex` /
  `embedItemCards` — so it constrains `build.go`'s ordering itself, which is exactly what
  `TestEmbedItemCards_ReflectsLeafMutationAfterEarlyIndex` could not.
- `Build` errors are `t.Fatalf`'d, so the test cannot silently vacuum-pass on a failed build,
  and it passes at `093da29` — proving the augment passes do reach the container when the
  re-walk is present, so the mutation's failure is attributable to the re-walk alone.
- Test-only change: `--stat` shows `internal/site/build_test.go` as the sole file, so round 2's
  measured numbers (site delta 26 files all `Browse/kit`; data delta 300 files +300/−0;
  `other-summoners.md` 217,633 B / 5 / 1 / 17) carry forward unchanged.

### (4) — worktree state

Root `git status --short`: `M data-sdk-npm`, `M steel-etl`, `M v2` — nothing else.
`git status --porcelain` empty in all four submodules. HEADs: steel-etl `093da29`,
v2 `f9347707dd`, data-sdk-npm `a4ce584`, steelCompendium.github.io `5a71d2b7`.

### Round 3 artifacts

- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc116-r3/r3-commit.diff`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc116-r3/r3-gates.txt`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc116-r3/r3-mutation-full.txt`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc116-r3/clone/` (restored clean)

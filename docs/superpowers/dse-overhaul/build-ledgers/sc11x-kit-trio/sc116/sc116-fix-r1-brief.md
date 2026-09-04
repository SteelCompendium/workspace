# SC-116 — fix + rebase round 1 (brief)

You are an implementer (Sonnet) dispatched by the SC-116 ticket-owner. **Workers never call the
tracker (Linear)** — not to read history, not to post. Your final text goes to the ticket-owner,
not a human.

## Context loading (read these first, in order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/decisions.md`
2. Review round 1 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r1.md`
3. Prior implementation report (exec summary + SC-116 section):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc11x/sc11x-report.md`

Scott's ruling (verbatim, 2026-08-29): "approved, land it". Nothing in this round changes what
he approved — it fixes review findings, rebases, and adds the missing changelog/docs lines.

## Where the code is

Worktree: `/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio` — verify `pwd` is under it
before ANY write. Workspace-level files (`CHANGELOG.md`) live in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/CHANGELOG.md` — never under
`/home/scott/code/steelCompendium/workspace/`.

- `steel-etl`, branch `sc11x-kit-trio`, HEAD `6415f04` (3 commits: `c31e701` SC-116, `d0e8c67`
  SC-119, `6415f04` SC-115). Tracked branch `origin/main`, expected sha `c7d6940` — `git fetch
  origin` INSIDE the worktree's steel-etl clone (its refs are independent of the main checkout)
  and confirm before rebasing.
- `v2`, branch `sc11x-kit-trio`, HEAD `7e56d40e63` (1 commit). Tracked `origin/main`, expected
  `9782209ec5`.
- Superproject branch `sc11x-kit-trio` at `4a3e470`. Leave the `M steel-etl` / `M v2` submodule
  pointer diffs UNCOMMITTED — the pointer bump is the landing step's move, not yours.

## Task, in order

1. **Rebase.** Plain `git rebase origin/main` in `steel-etl` and in `v2` — **never interactive,
   never reorder, squash, or split the three steel-etl commits.** `d0e8c67` (SC-119) depends on
   `c31e701` (SC-116): it was written on top of SC-116's frontmatter-first `kind` logic in
   `cards.go`, and a cherry-pick of it alone conflicts. The order `c31e701` → `d0e8c67` →
   `6415f04` must be the order after the rebase too. (Both rebases should apply cleanly —
   no upstream file overlaps were found at dispatch; if a conflict appears, stop and report it
   with `STATUS: NEEDS_CONTEXT` rather than resolving by guesswork). After rebase, record the
   new shas of all four commits.
2. **Review findings.** Apply each SC-116 finding below exactly as prescribed, in a new commit
   `fix(kit): SC-116 review round 1 — <what>`. Do not amend the reviewed commits. **Findings the
   reviewer filed against SC-119 (`d0e8c67`) or SC-115 (`6415f04`) are NOT yours to fix** —
   those tickets' owners rule on them separately; leave that code untouched unless a finding
   below is explicitly marked for you.

   The findings below are quoted from `sc116-review-r1.md` (read the full text there, lines
   26–127, for mechanism and measurements). The owner has ruled which you fix and in which
   commit. Nothing else from the report is in scope.

   **Commit A — `fix(site): re-walk the leaf-card index before embedItemCards (SC-115)`**
   — this is SC-115's code, folded into this round by owner ruling because the trio lands in
   one push. Apply exactly:

   > **HIGH-1** — `internal/site/build.go:90` (new `buildLeafCardIndex` call) vs
   > `internal/site/build.go:163` (`embedItemCards(cfg, leafCards)`). Three passes run
   > **between** those two points and rewrite card-able leaf pages: `augmentRivalSummonerPages`
   > (`build.go:134`), `augmentSummonerRetainerPages` (`build.go:144`),
   > `buildBestiarySearchPage` (`build.go:152`). Those edits are now invisible to
   > `embedItemCards`, which splices the stale pre-augment HTML into container pages.
   > Measured: `Read/summoner/other-summoners.md` 217,633 → 159,169 bytes; `## Summons` 5→0;
   > `## Advancement Features` 1→0; `sb-backlink` 17→0.
   >
   > **Prescribed fix** (validated): keep the early index for `kitSignatureCardIndex`, but
   > recompute a fresh index for the embed pass. At `build.go:163` replace
   > `embedCount, embedErrs := embedItemCards(cfg, leafCards)` with
   > ```go
   > 	// Re-walk: the augment-* passes above rewrite card-able leaves after the
   > 	// early index was taken for kitCard (SC-115); embedding must see them.
   > 	freshCards, freshErrs := buildLeafCardIndex(cfg)
   > 	result.Errors = append(result.Errors, freshErrs...)
   > 	embedCount, embedErrs := embedItemCards(cfg, freshCards)
   > ```
   > Add a doc comment at `build.go:83` recording the invariant ("the index handed to
   > `embedItemCards` must be taken after every leaf-mutating pass").

   > **MED-1** — No test guards the pass-ordering invariant HIGH-1 broke. Prescribe: a test
   > that writes a container page + a leaf, mutates the leaf between index-build and embed, and
   > asserts the mutation appears in the container — or, cheaper, a `Build()`-level golden
   > assertion that a summons back-link survives into its Read chapter.

   Acceptance for Commit A (the reviewer measured these on a patched clone): `steel-etl site`
   output for `v2/docs/Read/summoner/other-summoners.md` is byte-identical to the merge-base
   build (217,633 bytes; 5 `## Summons`; 1 `## Advancement Features`; 17 `sb-backlink`), and
   `Browse/kit/*` output is identical to the unpatched branch. Run `site` twice (before/after
   your change is NOT needed — compare against the numbers above) and report the four counts.

   **Commit B — `fix(kit): SC-116 review round 1 — link-safe kind match, annotation guard`**:

   > **LOW-1** — `internal/content/kit.go:99-108`. `keywords` are *unstripped* markdown, e.g.
   > `[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)`, so `strings.Contains(joined, "Magic")`
   > also sees every link URL. Prescribe: strip link targets before matching, keeping display
   > text — `[X](Y)` → `X` — which preserves the real `Magic; Light Weapon` case that
   > exact-equality matching would *regress*. Note in the doc comment that substring (not
   > equality) is deliberate for that reason.

   > **LOW-2** — `internal/content/kit.go:40-44` sets `fm["kit_type"] = v` for any annotation
   > value; `kit.go:87` then skips derivation on `if _, ok := fm["kit_type"]; !ok`. An
   > annotation that parses to an empty value suppresses derivation and emits `kit_type: ""`.
   > One-line fix: only set from the annotation when `strings.TrimSpace(v) != ""`, or change
   > the guard at `kit.go:87` to test for a non-empty value.

   > **LOW-3** — `internal/content/kit.go:56-89`: three silent paths to the `Martial` default
   > ((a) no signature-ability child; (b) `abilityParser.Parse` error swallowed at `kit.go:60`;
   > (c) no keyword row). Prescribe: emit a pipeline warning when a `@type: kit` section's
   > signature ability yields zero keywords.

   Owner ruling on LOW-3: emit the warning ONLY through a warning/diagnostic mechanism the
   parser path already has (look at how neighbouring parsers report non-fatal problems). If
   none exists, do not invent one — skip LOW-3 and say so under `Follow-ups:`.
   Add a unit test for each of LOW-1 (a keyword linked to a target containing "Magic" must NOT
   flip a Martial kit; `Magic; Light Weapon` must still read Magic) and LOW-2.

   **Commit C — schema description, both copies** — the reviewer's follow-up 4, folded by
   owner ruling: `steel-etl/schemas/kit.schema.json:24` and the worktree's
   `data-sdk-npm/src/schema/kit.schema.json:24` both describe `kit_type` as
   `(e.g., "Martial", "Caster", "Stormwight")`; the pipeline emits only
   `Martial` / `Magic` / `Psionic`. Change the example list in BOTH files to
   `(e.g., "Martial", "Magic", "Psionic")` — description text only, no type change. Two
   commits, one per repo: steel-etl `docs(schema): kit_type examples match what is emitted
   (SC-116)`; data-sdk-npm (branch `sc11x-kit-trio`, in the worktree) same message. Then
   `diff` the two files: they must differ ONLY by the SDK copy's top-level "BETA —"
   description prefix, as before.

3. **Changelog.** Add THREE bullets at the top of `## Unreleased` in the worktree superproject's
   `CHANGELOG.md` (house style: bold lead sentence naming the visible change and the ticket
   key, then plain-English detail for a non-technical reader). Order: SC-116, SC-119, SC-115.

   - **SC-116 bullet — write it.** It must say, literally: every kit tile on the site's Browse
     kit index used to say "Martial Kit" — a hidden bug, because the keyword sniff ran against
     a page body that no longer carried the keyword line — and the tiles now read
     21 Martial / 3 Magic / 1 Psionic, matching the kit detail pages (Battlemind is the Psionic
     one); and the kit data files gain a `kit_type` field (Martial / Magic / Psionic) that the
     DSE plugin and the API can read instead of re-deriving it.
   - **SC-119 bullet — paste VERBATIM (supplied by SC-119's owner; do not edit):**

     - **Site: kit Browse tiles show "—" for every absent bonus, matching the kit detail page and the DSE plugin (SC-119).** The Browse kit index tile rendered an absent bonus as "0" on its first stat row (Stamina / Speed / Stability / Disengage) but as "—" on its second (Melee and Ranged Dmg / Dist). Both rows now use the detail page's `kitBonus()` helper, so a kit with no bonus in a slot shows a dash everywhere — Boren's tile reads `— — — —` on both rows instead of `0 0 0 0` over `— — — —`.

   - **SC-115 bullet — write it.** It must say: the Browse kit index tile now renders the kit's
     signature ability as the full ability card (keywords, action, power-roll tiers, effects) —
     the same card the kit detail page shows — instead of a one-line type + name; tiles in a
     row therefore vary in height. Mention the SC-115 key.

   One superproject commit: `docs(changelog): kit Browse tile trio (SC-116, SC-119, SC-115)`.
4. **Docs.** In the worktree's `steel-etl/CLAUDE.md`, under the "Kits" bullet in the
   embedded-child-abilities section (~line 169), add one sentence: `kit_type` (Martial / Magic /
   Psionic) is derived at parse time from the signature ability's keywords by
   `deriveKitType` (SC-116); an explicit `@kit-type:` annotation wins. Keep it to one sentence
   — that file is a router. Commit in steel-etl as `docs(kit): note kit_type derivation (SC-116)`.
5. **Gates** (steel-etl): `go build ./... && go vet ./... && go test ./...` — expected all
   packages `ok`, zero vet output. Then a full `gen --all` + `site` build; confirm
   `v2/docs/Browse/kit/index.md` has exactly 21 `Martial Kit` / 3 `Magic Kit` / 1 `Psionic Kit`
   `sc-card__type` values (`grep -o 'sc-card__type">[^<]*' | sort | uniq -c`).
6. **Clean up generated dirt** so the worktree is landing-clean: in `v2`, ONLY
   `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc` (NEVER
   `git checkout -- .` in v2 — `docs/stylesheets/` and `docs/javascripts/` are hand-authored);
   in `steelCompendium.github.io`, `git checkout -- . && git clean -fdq docs`; `rm -rf` the
   worktree-root `site/` if present. Final `git status --short` at the worktree root must show
   only `M steel-etl` / `M v2`; each submodule's `git status --porcelain` must be empty.
7. **Landing preflight numbers** (read-only, from the worktree): for steel-etl and v2,
   `git merge-base --is-ancestor origin/main sc11x-kit-trio && echo FF-safe`; for the
   superproject, `fork=$(git merge-base origin/main sc11x-kit-trio); comm -12 <(git diff
   origin/main...sc11x-kit-trio --name-only | sort) <(git diff "$fork"...origin/main
   --name-only | sort)` — report the intersecting files (CHANGELOG.md / DESIGN.md are expected).

## Footguns

- Devbox: Go/Node/just are not on PATH. Always
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/steel-etl && <cmd>'`.
  Devbox's `sh` wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate through `| tail`. Redirect
  output to a per-run unique file and read the file.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Never background a gate and wait on it; run it in the foreground.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent, and
  `to: 'main'` routes to the TOP-LEVEL dispatcher, not to the owner. If you need input, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever send a
  message anyway, its FIRST WORD must be `SC-116:`.
- Out of scope (already ruled by the owner, do not touch): the steel-etl/data-sdk-npm schema
  "BETA —" description-prefix drift (deliberate); kit-tile height variance; a companion
  cardhead e2e test; `parseKeywords` mis-splits (filed as SC-295); the DSE plugin's `ds-kit`
  reader (separate Backlog ticket, other repo); INFO-2's build-scoped globals (dropped).

## Report

Write to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-fix-r1-report.md`.
**Open with a ≤10-line executive summary**: rebase result, findings fixed (by id), gate results
with numbers, final shas per repo, worktree cleanliness. Then per-finding detail (what changed,
file:line), the exact gate commands and their outputs' key lines, and `Drive-by fixes:` /
`Follow-ups:` sections (empty is fine).

## Return contract

Your final text: raw facts only — new shas (steel-etl, v2, superproject), gate results, kit
split counts, FF-safe results, conflict-predictor file list, and the absolute path of every
artifact you produced. No prose.

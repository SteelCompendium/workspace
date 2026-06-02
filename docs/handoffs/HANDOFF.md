# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–6 DONE (all class content: companions, all abilities, all per-level features,
  Companion/Companion Rules/Adding & Subtracting Actions/Beastheart Treasure features,
  rewards, perks — all live). Phase 7 (cross-ref links + scc_api) not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**ALL Beastheart class content DONE — Phases 1–6 complete (2026-06-02, deployed live).**
steel-etl `e76354d`, workspace `33b5b70`, v2 `07f3151f6b`. **216 classified.** Latest
chunk: Companion area + treasure rules (see plan `## Status` for the restructure details)
and a merge-artifact fix.

**Only two things remain on the beastheart effort:**

1. **(User-requested, SEPARATE TASK) Surface `@subclass` in the output data.** The
   `@subclass: guardian|prowler|punisher|spark` annotation is captured on all Wild Nature
   abilities (1st/2nd/6th/9th-level) but the AbilityParser does NOT surface it to
   frontmatter or the SCC path. Needs a parser change mirroring how `@companion` is
   spliced (`internal/content/ability.go` ~line 90; also `feature.go` for the WN passive
   features at 2nd/5th/8th level which don't even carry `@subclass` yet). Decide whether
   subclass becomes a path segment (`feature.ability.beastheart.guardian.level-6/...`) or
   just a frontmatter field. If path-segment, it changes SCC codes — coordinate with the
   freeze/registry. **This is the next thing the user will likely want.**

2. **Phase 7 (polish):** SCC cross-reference links in the beastheart text (per
   `docs/linking-guide.md`); enable scc_api/aggregate for beastheart (currently disabled
   for secondary books via `EffectiveBookConfig` in the pipeline) so it joins the SCC API
   / data-unified; `validate --scc-stable`.

⚠️ **Lesson from this session:** an external merge to the input doc (the user's
`beastheart-input-cleanup` branch) silently re-introduced raw duplicate power-roll tier
blocks (Rolling Thunder, Juggernaut). **Always re-gen + spot-check ability tiers after any
merge that touches `input/beastheart/Draw Steel Beastheart.md`.** If reconstructing any
remaining raw statblock: OCR damage = Intuition "I"→"1", potency `m<v`/`P<WEAK`→`P < WEAK`,
jumbled fields, dropped tier prefixes. Verify against PDF (file-page = book-page + 4).

## Verified state (as of 2026-06-02)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean except this handoff/plan doc edit
  (commit & push it).
  - Work HEADs: steel-etl `e76354d`, v2 `07f3151f6b`, workspace `33b5b70`.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 216, Written: 1296 files`. 14 companion species present.
- **Deployed:** v2 site pushed to org; GitHub Pages serves the live beastheart content.
- No long-running processes. devbox provides Go/just/node (not on system PATH).

## Gotchas & lessons (cross-cutting)

- **PDF is ground truth and must NEVER be committed** to any repo:
  `/home/vexa/Downloads/Draw_Steel_Beastheart_v1.0.pdf`. Read it via the Read tool
  (PDF pages). **File-page = book-page + 4.**
- **Marker OCR damage** on ability statblocks: Intuition "I" → "1"; potency badges
  became `m<v`/`m<s` → rewrite as `M < AVERAGE` / `M < STRONG`; fields jumbled;
  power-roll tier prefixes (`≤11`) sometimes dropped. Verify every value vs PDF.
- **Power-roll tiers parse fine** — confirm via the **YAML** output (`tier1/2/3`),
  not JSON `metadata.tier1` (JSON nests them under a different key).
- **`@subclass`** annotation is captured in source but the AbilityParser does NOT
  surface it to frontmatter or the SCC path. Subclass grouping would need a small
  parser change mirroring `@companion`. Subclass→2nd-level-feature map (PDF p.26):
  Guardian→Watchdog, Prowler→Supersniffer, Punisher→This One's Yours, Spark→Stormheart.
- **`gen` only processes the primary book by default** — use `--book mcdm.beastheart.v1`
  (or `--all`). The `books:` array was inert before this effort; fixed via
  `EffectiveBookConfig` (secondary books disable aggregate/scc_api/scc_map/stripped).
- **A hook blocks `git commit` when combined with other commands** in one Bash call.
  Run each `git commit` as its own command.
- **`deploy-v2`**: a hook auto-commits & pushes the v2 generated docs, so the recipe's
  own commit step reports "nothing to commit" / "Everything up-to-date" — that's
  expected, not a failure. After deploying, bump the workspace gitlinks:
  `git add steel-etl v2 && git commit -m '…' && git push`.
- **Document structure:** beastheart class is H1; species are H3 feature-groups with
  `@companion`; abilities H4; advancement features H5. Class context lives at level 1
  so H2 sub-sections can be annotated without clobbering it.

## Verification commands

```bash
cd /home/vexa/code/steel_compendium/workspace
# git state (expect: all main, clean, in sync)
for r in . steel-etl v2; do echo "$r:"; git -C $r status -sb | head -1; done
# build + tests (expect: BUILD OK, all ok)
devbox run -- bash -c 'cd steel-etl && go build ./... && echo BUILD OK && go test ./... 2>&1 | grep -E "FAIL|^ok"'
# gen beastheart (expect: Classified: 216)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

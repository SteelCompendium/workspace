# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–5 done; Phase 6 ~98% (companions, all subclass abilities, rewards, perks,
  signature + 20 heroic abilities, **all per-level class features L2–10 + Kit** all live);
  only the Companion intro + treasure-rules prose remain. Phase 7 not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**ALL Beastheart abilities + ALL per-level class features (L2–10) + Kit DONE
(2026-06-02, deployed live).** steel-etl `7a7ed86`, workspace `057aca3`, v2 `219babc1bb`.
**212 classified.** Per-level features at `feature.trait.beastheart.level-N/` (repeated
generic features perk/skill/characteristic-increase/rampage-improvement distinguished by
level segment). Pattern: `@type: feature | @id: <slug> | @level: N`, headings normalized
to H4. See plan `## Status` for the full list.

**Two user-relevant items remain:**

1. **(User-requested, SEPARATE TASK) Surface `@subclass` in the output data.** The
   `@subclass: guardian|prowler|punisher|spark` annotation is captured on all Wild Nature
   abilities (1st/2nd/6th/9th-level) but the AbilityParser does NOT surface it to
   frontmatter or the SCC path. Needs a parser change mirroring how `@companion` is
   spliced (`internal/content/ability.go` ~line 90, and `feature.go` for the WN passive
   features which also lack `@subclass` entirely). Decide whether subclass becomes a path
   segment (`feature.ability.beastheart.guardian.level-6/...`) or just a frontmatter field.
   If path-segment, it changes SCC codes — coordinate with the freeze/registry.

2. **Finish Phase 6 (small):** the `## **Companion**` intro rules section (H2 parent of
   the 14 species H3) is still UNannotated — annotating absorbs all species via
   FullBodySource, so restructure first (move species to siblings, or split the rules
   prose). Plus the "Beastheart & Magic Treasure" rules block (Consumables/Trinkets/
   Leveled Items, 1st-level prose) and a final stray-image/`<span>`/page-number sweep.

Then **Phase 7:** SCC cross-ref links, enable scc_api/aggregate for beastheart (currently
disabled for secondary books via `EffectiveBookConfig`), `validate --scc-stable`.

⚠️ Any remaining raw statblocks have systematic OCR damage (Intuition "I" → "1", potency
`m<v`/`P<WEAK` → normalize to `P < WEAK`, jumbled/duplicated field order, dropped tier
prefixes, stray glyphs/images). **Each needs the PDF** — don't annotate from marker text
alone. Clean regions (`### Heroic Abilities`, the level-feature sections) are the format
templates. PDF file-page = book-page + 4.

## Verified state (as of 2026-06-02)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean except this handoff/plan doc edit
  (commit & push it).
  - Work HEADs: steel-etl `7a7ed86`, v2 `219babc1bb`, workspace `057aca3`.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 212, Written: 1272 files`. 14 companion species present.
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
# gen beastheart (expect: Classified: 212)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

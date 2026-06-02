# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–5 done; Phase 6 ~92% (companions, subclass 1st/2nd/6th/9th-level abilities,
  rewards, perks, **signature + all 20 heroic abilities** all live); Phase 7 not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**Signature + all 20 heroic abilities + all 16 Wild Nature subclass abilities DONE
(2026-06-02, deployed live).** steel-etl `2cd1bb0`, workspace `b056e3d`, v2 `5d16c7823b`.
- Heroic abilities level-gated (3/5-Fer→L1, 7-Fer→L3, 9-Fer→L5, 11-Fer→L8); `@cost`
  carries the tier.
- Subclass abilities: 6th-Level (8 @ 9 Fer)→`level-6`, 9th-Level (8 @ 11 Fer)→`level-9`,
  annotated `@subclass: guardian|prowler|punisher|spark` (mirrors the 2nd-level Wild
  Nature ability pattern). NOTE: `@subclass` is captured but NOT surfaced by the
  AbilityParser to frontmatter/path — documented only.
See the plan `## Status` for the full per-ability list + PDF pages.

**Continue Phase 6: the remaining non-ability class content (no more abilities left).**
What's left, roughly in book order — all still marker-raw:
- **5th/8th-Level Wild Nature passive Features** — the per-subclass feature tables (e.g.
  5th: There For Each Other / Melt Away / I Can Take It / Wildfire Pyre — already present
  as `#### NAME` prose blocks but UNannotated; 8th: Reflexes Perfected / Born to Run /
  Built for Violence / Nature Will Not Harm Us). Annotate as `@type: feature`. Subclass
  not surfaced anyway, so plain features under their level section.
- **Per-level feature lists (3rd–10th):** Characteristic Increase, Perk, Skill, Rampage
  Improvement, Companion Advancement, Feral Heart, Unleash the Beast, Become the Beast,
  Avatar of the Green, the 10th-level capstones, etc. Mostly short prose `@type: feature`.
- **Companion intro feature** — the H2 parent of the 14 species (annotating it absorbs all
  species into its body via FullBodySource — decide handling, maybe leave unannotated).
- **Kit reference** (`#### Kit`), and a final pass to strip leftover `![](_page_N...)`
  image refs and `<span id=...>` / page-number artifacts.
Then **Phase 7:** SCC cross-ref links, enable scc_api/aggregate for beastheart (currently
disabled for secondary books via `EffectiveBookConfig`), `validate --scc-stable`.

⚠️ Statblocks/sections have systematic OCR damage (Intuition "I" → "1", potency `m<v`/
`P<WEAK` → normalize to `P < WEAK`, jumbled/duplicated field order, dropped power-roll
tier prefixes, stray glyphs/images). **Each needs the PDF** — do not annotate from marker
text alone. The clean ability regions (`### Heroic Abilities`, the 6th/9th-level subclass
blocks) are the format templates. PDF file-page = book-page + 4.

## Verified state (as of 2026-06-02)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean except this handoff/plan doc edit
  (commit & push it).
  - Work HEADs: steel-etl `2cd1bb0`, v2 `5d16c7823b`, workspace `b056e3d`.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 180, Written: 1080 files`. 14 companion species present.
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
# gen beastheart (expect: Classified: 180)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

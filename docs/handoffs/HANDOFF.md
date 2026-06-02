# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–5 done; Phase 6 ~88% (companions, subclass 1st/2nd-level, rewards,
  perks, **signature + all 20 heroic abilities** all live); Phase 7 not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**Signature abilities + ALL 20 heroic abilities DONE (2026-06-02, deployed live).**
steel-etl `7bdb9a3`, workspace `ea923f8`, v2 `0a32391858`. Heroic abilities are
level-gated to mirror the book (3/5-Fer → level-1, 7-Fer → level-3, 9-Fer → level-5,
11-Fer → level-8); `@cost: N Ferocity` carries the tier. See the plan `## Status` for
the full list + which PDF page each tier came from.

⚠️ **Scope lesson that matters for the next chunk:** the 9-Ferocity and 11-Ferocity
"ability" lists in the source are SPLIT. Only the abilities under the plain
`N-Ferocity Ability` chooser are *heroic* abilities (done). The ones under
`6TH-LEVEL <SUBCLASS> ABILITIES` (9 Ferocity) and `9TH-LEVEL <SUBCLASS> ABILITIES`
(11 Ferocity) are **Wild Nature subclass abilities** — still raw, still TODO.

**Continue Phase 6: the Wild Nature subclass abilities (the next obvious chunk).**
16 abilities total, still marker-raw:
- **6th-Level Wild Nature** (8 @ 9 Ferocity): Sic 'Em!, Stare Down (Guardian);
  Soft Underbelly, Wraith Heart (Prowler); Lead the Pack, Rolling Thunder (Punisher);
  Elements Unleashed, Killing Frost (Spark). Source between `6th-Level Features` and
  `7th-Level Features`. PDF p.35-36.
- **9th-Level Wild Nature** (8 @ 11 Ferocity): Banshee Howl, Relentless (Guardian);
  Behold the Face of Chaos, Let's Take This Outside (Prowler); Battle Frenzy,
  Juggernaut (Punisher); For the Pack!, Wild Hunt (Spark). Source between
  `9th-Level Features` and `10th-Level Features`. PDF p.39.

Annotate these like the **2nd-level Wild Nature abilities** (already done — grep
`@subclass:` for the template): `@type: ability | @id: X | @level: 6|9 | @cost: N
Ferocity | @subclass: guardian|prowler|punisher|spark`. Then `gen --book
mcdm.beastheart.v1` + verify YAML tiers + commit + `deploy-v2` + bump workspace gitlink.

⚠️ Statblocks have systematic OCR damage (Intuition "I" → "1", potency `m<v`/`P<WEAK`
→ normalize to `P < WEAK`, jumbled/duplicated field order, dropped power-roll tier
prefixes, stray glyphs). **Each needs the PDF** — do not annotate from marker text alone.
The clean heroic-ability region (`### Heroic Abilities`) is the format template.

## Verified state (as of 2026-06-02)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean except this handoff/plan doc edit
  (commit & push it).
  - Work HEADs: steel-etl `7bdb9a3`, v2 `0a32391858`, workspace `ea923f8`.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 164, Written: 984 files`. 14 companion species present.
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
# gen beastheart (expect: Classified: 164)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

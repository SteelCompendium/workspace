# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–5 done; Phase 6 ~80% (companions, subclass 1st/2nd-level, rewards,
  perks, **signature abilities** all live); Phase 7 not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**Signature abilities DONE (2026-06-02, commit `bf44751` / workspace bump `d984d66`,
deployed live).** Bodyswap, Come On!, Covering Fire, Stormrage all PDF-verified and
landing at `feature.ability.beastheart.level-1/` under a new `## Beastheart Abilities`
H2 feature (`@id: beastheart-abilities | @level: 1`).

**Continue Phase 6: annotate the main Beastheart HEROIC abilities by Ferocity cost.**
Single next action: start with the **3-Ferocity abilities** — grep for
`HEROIC ABILITIES` / `3-Ferocity Ability` (don't trust line numbers; the file shifts
every edit) in `steel-etl/input/beastheart/Draw Steel Beastheart.md`. PDF ground truth
is **book p.24 → PDF p.28** (3-Ferocity + 5-Ferocity) and following pages for
7/9/11-Ferocity. **Restructure then annotate**: fix `#### HEROIC ABILITIES` →
`### Heroic Abilities` (peer of `### Signature Ability` under the Beastheart Abilities
H2), strip the stray `<span id=...>`, then for each heroic ability fix `## **Name (N
Ferocity)**` → `#### Name`, strip the `(N Ferocity)` from the heading, and build the
statblock. Then `gen --book mcdm.beastheart.v1` + verify YAML tiers + commit +
`deploy-v2` + bump workspace gitlink. Work in committed chunks (per Ferocity tier).

⚠️ Heroic ability statblocks have systematic OCR damage (Intuition "I" → "1",
potency `m<v`/`P<WEAK`, jumbled field order, dropped power-roll tier prefixes, stray
glyphs like `🕲`). **Each needs the PDF** — do not annotate from marker text alone.

**Pattern reminder for heroic abilities:** `@type: ability | @id: X | @cost: N Ferocity`
(NO `@level` needed — they inherit `@level: 1` from the Beastheart Abilities feature,
matching how signatures inherit). Strip `(N Ferocity)` from the heading. Many have a
`**Spend 1 Ferocity:**` rider and inline potencies (`P < WEAK` etc.) in the tier lines.
Mark the signature ability's analog `@subtype: signature` only for signatures (done).
See the now-clean signature region just above `HEROIC ABILITIES` as the format template.

## Verified state (as of 2026-06-02)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean except this handoff/plan doc edit
  (commit & push it).
  - Work HEADs: steel-etl `bf44751`, v2 `097e4fe312`, workspace `d984d66`.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 144, Written: 864 files`. 14 companion species present.
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
# gen beastheart (expect: Classified: 144)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

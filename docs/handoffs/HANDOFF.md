# Handoff — 2026-06-01

## Active efforts

- **Beastheart integration** — IN FOCUS. Resume at
  `docs/superpowers/plans/2026-06-01-beastheart-integration.md` → `## Status / Handoff`.
  Spec: `docs/superpowers/specs/2026-06-01-beastheart-integration-design.md`.
  Deep project state in agent memory `project_beastheart_integration.md`.
  Phases 1–5 done; Phase 6 ~75% (companions, subclass 1st/2nd-level, rewards,
  perks all live); Phase 7 not started.
- **SCC address-bar rewrite retirement** — ✅ complete & merged (prior session,
  2026-05-31). No in-flight work. (Was the previous content of this file; archived in git.)
- **Other `plans/` efforts** (`architecture-redesign`, `schema-enrichment`,
  `sdk-schema-alignment`, `content-linking`) — not touched; see each plan's own doc.

## You are here

**Continue Phase 6: annotate the main Beastheart heroic abilities.** Single next
action: start with the **signature abilities** (Bodyswap, Come On!, Covering Fire,
Stormrage) — grep for `#### **Beastheart Abilities**` / `SIGNATURE ABILITY` (don't
trust line numbers; the file is ~3091 lines and shifts every edit) in
`steel-etl/input/beastheart/Draw Steel Beastheart.md`. Read the matching PDF page
(book p.26 → PDF p.30/31) first, **restructure then annotate**, then `gen` + verify
+ commit + `deploy-v2`. Work in committed chunks (per subclass / per Ferocity tier),
as the rest of Phase 6 was done.

⚠️ The remaining ability statblocks have systematic OCR damage (Intuition "I" →
"1", jumbled field order, broken power-roll tier prefixes). **Each needs the PDF to
be accurate** — do not annotate them from the marker text alone.

⚠️ The signature-ability region is also structurally mangled — you must **clean
headings, not just prepend annotations**: a stray `## Come` heading split from
`#### Come On!`, `## **Covering Fire**` at the wrong heading level, a leaked image
line, and a corrupted Stormrage block. **Signature abilities are used at will (no
Ferocity cost)** — annotate them `@type: ability | @subtype: signature` with NO
`@cost`; the Ferocity-cost pattern (`@cost: N Ferocity`) applies to the 3/5/7/9/11
heroic abilities, not signatures.

## Verified state (as of 2026-06-01)

- **Branches:** workspace, steel-etl, v2 all on `main`, in sync with `origin/main`
  (the SteelCompendium org). Working trees clean **once this handoff commit lands**
  (the commit that adds this file + the plan's `## Status` section is the only
  expected diff; commit & push it).
  - Work HEADs (stable): steel-etl `7e56a2a`, v2 `93549979c8`. Workspace HEAD was
    `d05a90d` and advances by one with the handoff commit.
- **Build:** `devbox run -- bash -c 'cd steel-etl && go build ./...'` → OK.
- **Tests:** `devbox run -- bash -c 'cd steel-etl && go test ./...'` → all packages **ok** (no failures).
- **Gen:** `devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1'`
  → `Classified: 139, Written: 834 files`. 14 companion species present.
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
# gen beastheart (expect: Classified: 139)
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --config pipeline.yaml --book mcdm.beastheart.v1 2>&1 | tail -1'
# companion species (expect: 14)
find data/data-beastheart/en/json/feature-group/companion -name '*.json' | wc -l
```

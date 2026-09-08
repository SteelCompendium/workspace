# SC-308 review — round 4 (scoped re-review of the r3 fix round)

Reviewer: same independent identity as r3 (did not author the fixes).
Delta: steel-etl `8a4ce06..bdab23e` (5 commits, 15 files), superproject `ca88d94` → `9bfdf15` (rebased).
data-sdk-npm unchanged this round (`69c8d49`), v2 unchanged (`09aabfe41f`).
Regression base: steel-etl `5035174`, regenerated fresh this round.

## Executive summary (≤10 lines)

1. **Verdict: MERGEABLE.** All 7 r3 findings verified fixed. 0 CRITICAL, 0 IMPORTANT, 0 LOW new; 7 INFO.
2. C-1 **OK** — `Read/bestiary/monsters.md` carries **19** "End Effect" section heads at HEAD and 19 at base
   (r3 lost all 19); Solo Turns 18→**21**, Ajax Turns 1→1, total section heads 1193→**1196** (no loss, +3 gain).
3. C-2 **OK** — all **14** beastheart advancement pages render 3 bodies for 3 articles (0 empty); "Heart of
   Stone" prose present on the companion page, `Browse/class/beastheart.md` and the Read chapter.
4. **Lost rendered body lines vs base: 2 instances on 2 pages, both the same exploding-mill-wheel re-split —
   word-multiset over all 349 changed pages shows 0 lost words. Genuine content loss = 0.**
5. I-1 **OK** — Soul Steal → `{cost: "3 Malice", …}`, Solo Monster → `{name: "End Effect", …}`; cost entries
   19→**155** (+136 Malice), 154-entry leak list now empty; widened regex proved non-over-matching on 14 adversarial cases.
6. L-2 **OK** (`.fb__feat-intro` 122→124, emitted for prose-with-attached-roll; `.fb__feat-trailing` elsewhere);
   L-1/L-3 doc sentences and the CHANGELOG `power_roll` parenthetical present and accurate.
7. L-4 **OK** — `git diff origin/main..HEAD --stat` = `CHANGELOG.md` only (21 insertions), 0 commits behind.
8. Gates: `gofmt -l` 10 pre-existing files (identical list), `go vet` clean, `go test -race -count=1 ./...` **8/8 ok**,
   `gen --all` exit 0, `site --config ../v2/site.yaml` exit 0; 8/8 new/updated tests present and passing.
9. Golden: **0 HTML hunks**; 3 island JSONs gain a redundant `effects` array mirroring `body` — additive only.
10. Schema: **164 failing docs at base and 164 at HEAD**, identical keys; hygiene clean; tree restored.

---

## Per-finding verdicts

| r3 finding | verdict | evidence |
|---|---|---|
| C-1 table-less statblock traits lose labeled sections | **OK** | `internal/site/statblock_page.go:544-566` — `f.Effects` no longer nulled; `f.Body` set only when every entry is nameless+costless. 19/19 "End Effect" and 21 "Solo Turns" section heads on `Read/bestiary/monsters.md`; arixx/wode-hag/dragons/lich/werewolf/xorannox all restored; `gnoll-cackler`'s pseudo-feature keeps its `iron-jawed snare` text. |
| C-2 featureblock features with no `effects[]` render empty | **OK** | `internal/site/featureblock_page.go:462-471` falls back to `renderFbFeatFlatFallback`; `internal/content/monster.go:419-428` populates `Effects` in `collectChildFeatures`. 14/14 advancement pages: articles=3, bodies=3. |
| I-1 linked labels not extracted to cost/name (154 entries) | **OK** | `internal/content/featureparse.go:118` + `internal/site/ability_cards.go:124` widened to `^\*\*((?:\[[^\]]*\]\([^)]*\)\|[^*:])+?):\*\*\s*(.+)$`; both call sites store `linkDisplay(m[1])`. Corpus: cost entries 19→155 (`2 Malice` 61, `3 Malice` 46, `1 Malice` 23, `5 Malice` 12, `2+ Malice` 7, `1+ Malice` 4, `4 Malice` 2), `name: End Effect` ×19, 12 distinct names total, all plausible — no junk from over-matching. |
| L-1 Trigger divergence documented | **OK** | `docs/statblocks.md` +12 lines: states the data/site divergence is deliberate, why both are correct, and the "Trigger not first" caveat. |
| L-2 `.fb__feat-intro` restored | **OK** | `internal/site/featureblock_page.go:495-510`. Site-wide `.fb__feat-intro` 122→124; verified on exploding-mill-wheel `Deactivate` (intro + Agility Test panel, trailing prose after). |
| L-3 `power_roll` first-vs-last documented | **OK** | `docs/statblocks.md` +6 lines and CHANGELOG parenthetical (superproject `9bfdf15`). |
| L-4 superproject rebase | **OK** | `origin/main..HEAD --stat` = `CHANGELOG.md \| 21 +`; `HEAD..origin/main` = 0. |

## Gate numbers (measured this round)

- `gofmt -l ./internal ./cmd` → 10 files, byte-identical to the base list, none touched by the delta.
- `go vet ./...` → no output.
- `go test -race -count=1 ./...` → 8/8 `ok` (7 packages + `cmd/steel-etl` no test files).
- Targeted run of the 8 new/updated tests (`TestBuildStatblockIsland_SoloMonsterTrait`,
  `TestRenderFbFeat_NoEffectsFallsBackToFlatBody`, `TestRenderFbFeat_RollessProseStaysTrailing`,
  `TestRenderFbFeat_ProseWithAttachedRoll`, `TestCollectChildFeatures_PopulatesEffects`,
  `TestParseStatblockFeatures_SoulSteal_LinkedLabels`, `TestParseStatblockFeatures_LinkedEndEffectName`,
  `TestParseRichFeatures_LinkedLabelParagraph`) → `ok`.
- `gen --all --config pipeline.yaml` exit 0; `site --config ../v2/site.yaml` exit 0 (never `pipeline.yaml`).
- Golden diff (`sc308-r4-golden-diff.txt`) judged: 0 hunks in all 4 `.golden.html`; `devil-high-judge`,
  `link-test`, `minion` island JSONs each gain an `effects` array whose single entry's `effect` equals the
  already-present `body`. Purely additive; no HTML/DOM change, no text lost or reordered.

## Regression sweep vs `steel-etl@5035174` (fresh base build this round)

- data: **5136 changed, 0 added, 0 removed** (r3 was 4968 — the +168 are the I-1 cost/name extractions).
- site: **349 changed, 0 removed**, 5 only-in-HEAD (`index.md`, `javascripts`, `Media`, `.nav.yml`,
  `stylesheets` — protected paths the scratch harness does not populate).
- **Rendered-body loss (`lostcheck.py`, frontmatter stripped, tags stripped, entities unescaped):
  2 line instances on 2 pages** — `Browse/dynamic-terrain/siege-engines/exploding-mill-wheel.md` and its
  `Read/bestiary/dynamic-terrain.md` aggregate, both the same string. Hand-verified as a **re-split, not a
  loss**: both halves ("…its movement stops and it explodes. Each creature and object in a 5 burst centered
  on the wheel is targeted by the following power roll." and "A burning creature takes 1d6 fire damage at the
  start of each of their turns. A burning object takes 1d6 fire damage at the end of each round.") occur
  exactly once in HEAD's rendered body; the base merged two source paragraphs into one `trailing` blob, HEAD
  keeps them as two entries (document-faithful).
- **Word-level check across all 349 changed pages: `FILES_WITH_LOST_WORDS: 0`, `TOTAL_LOST_WORD_INSTANCES: 0`.**
- Added lines: 157 pages / 963 instances; 45 lines longer than 70 chars, **every one with count 1** — no
  duplication. Spot-verified `Browse/monster/lizardfolk/lizardfolk-grunt.md` "Net Trap": the Effect prose and
  its Agility Test panel are absent at base and present at HEAD (a C-1 gain, not a regression).
- Class-count deltas (site-wide): `sc-ability__section-head` 5831→5882, `sc-ability__pr-head` 3125→3389,
  `sc-ability__enh` 608→611, `sb__feat-body` 2842→2804 / `sb__feat-trailing` 104→142 (38 trait paragraphs move
  class, see INFO-3), `fb__feat-body` 732→0 / `fb__feat-trailing` 18→808 / `fb__feat-intro` 122→124.

## Re-verification that r3's accepted behaviour did not regress

- Snackies for Sweeties: data still exactly the ruled shape (`Effect`+`Power Roll + 3`+3 tiers, then
  `Special`+3 tiers); DOM order `section(Effect) → pr(Power Roll) → section(Special) → pr(Agility Test)`. ✅
- Derived test labels: 221 (r3) → **261** (r4) site-wide (Agility 156, Might 43, Presence 24, Reason 20,
  Intuition 18); the +40 come entirely from features that only now render. 8/8 random samples
  (`war-dog-tetherite`, `lizardfolk-scaletooth`, `giant-malice`, `fire-giant-red-fist`, `vampire-lord`,
  `lord-syuul`, `dwarf-reel-winch`, `basalt-stone-giant`) each follow a matching bold `**<Char> test**` in
  their own entry's prose — `SAMPLES_WITHOUT_MATCHING_BOLD_TEST: 0`.
- Widened-label over-match probe (14 adversarial strings compiled against the exact production regex):
  `**Agility test** to remove…` → NO-MATCH; `A creature can attempt an **Agility test**…` → NO-MATCH;
  `**Piloted (+4 EV)** …` → NO-MATCH; `**Sticky Stakes** ability in addition to: something` → NO-MATCH;
  `Some prose with a colon: and a **bold** phrase.` → NO-MATCH; linked labels, `**Effect:**`,
  `**Spend 1 Ferocity:**`, `**[Villain Action](scc.v1:x/y) 3:**`, `**Trigger:**` all MATCH with the correct
  label; `**A:** b **C:** d` captures `A` (lazy quantifier, first label wins).
- `internal/site/build.go` and `schemas/` untouched this round (0 files in the delta) — the `docs_dir` guard
  and both schema copies are exactly as reviewed and accepted in r3.
- `v2` untouched this round (`09aabfe41f`); `sc-dice.js` unchanged; `data-sdk-npm` unchanged (`69c8d49`).

## Data contract

`jsonschema` Draft 2020-12 with a `referencing.Registry` seeded by filename and `$id`:
BASE **164** failing docs, HEAD-vs-steel-etl-schemas **164**, HEAD-vs-SDK-schemas **164** — identical documents
and identical error keys in all three runs (`keywords` 119, `weaknesses` 58, `immunities` 27; 513 statblock +
156 featureblock checked). 0 introduced, 0 touching `effects`/`roll`/`tier*`/`name`/`cost`/`trigger`.

## Hygiene

No `Co-Authored-By` / `Claude` / `Generated with` / `🤖` / `Claude-Session` trailer in any r4 commit
(steel-etl or superproject); sole author `Scott Tomaszewski`; nothing pushed
(`git branch -r --contains` empty for `bdab23e` and `9bfdf15`); no generated output committed (the delta
touches only `docs/`, `internal/`, and the 3 golden island JSONs); superproject diff vs `origin/main` is
`CHANGELOG.md` only. Main checkout `/home/scott/code/steelCompendium/workspace` never written to;
`git status --porcelain` unchanged (` M draw-steel-elements`, ` M steelCompendium.github.io`).

---

## INFO (no action required to land)

- **INFO-1** Three raw-label leaks remain in the data (`**2d10 + highest characteristic:**` ×2,
  `**Wave of Blood:**` ×1). They are standalone bold labels with no body in the same paragraph, so the
  regex's trailing `(.+)$` cannot match — **pre-existing, identical at base and at r3**, and not part of the
  154 I-1 entries. Optional follow-up, not a regression.
- **INFO-2** `renderFbFeatFlatFallback` (`internal/site/featureblock_page.go:525`) never fires in production
  now that `collectChildFeatures` populates `Effects` (`.fb__feat-body` count is 0 site-wide). It is covered
  by `TestRenderFbFeat_NoEffectsFallsBackToFlatBody` only — intentional defence-in-depth, worth keeping.
- **INFO-3** 38 statblock trait paragraphs move from `.sb__feat-body` to `.sb__feat-trailing` (the C-1 fix
  routes those traits through the Effects walk). `v2/docs/stylesheets/steel-statblock.css:410-411` gives
  `.sb__feat-body` `margin-top:.45rem` vs the shared `.55rem`, so those paragraphs gain 0.1rem of top margin.
  Cosmetic, arguably correct where a section now sits above them.
- **INFO-4** The golden island JSONs now duplicate a pure-prose passive's `body` into `effects[0].effect`.
  Test-only data (written for the in-repo Brave capture script); additive and harmless, but the two fields are
  now redundant for that shape.
- **INFO-5** 8 features render raw markdown table junk (`… | |--------------------------|---------------:| | …`)
  inside a card body — malformed source rows missing a leading `|` (e.g. `input/monsters/Draw Steel Monsters.md`
  L14784 lizardfolk "Net Trap", L11203 gnoll "Iron Jaws"). **Identical count at base and HEAD (8 = 8)**, so it
  is pre-existing and not caused by this branch — but it is now more visible because the surrounding feature
  finally renders its real content. Candidate for a separate source-fix ticket.
- **INFO-6** Derived-label panels rose 221 → 261 purely because previously-invisible features now render;
  sampling confirms no over-application.
- **INFO-7** During this review `gen --all` rewrote `steelCompendium.github.io/docs/api/v1/*.json` (the SCC API
  output target) and `v2/docs`; both were restored, and `data/data-unified` is gitignored scratch.

## Artifacts

Scratch (session-local):
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/1ef34ad4-89db-4dcb-99a9-ac3d665aaffa/scratchpad/sc308-review-r4-20260907/`
— `lostcheck.py`, `lost-body.txt`, `lost-words.txt`, `added-body.txt`, `label-samples.txt`, `validate.py`,
`data-diff.txt`, `site-diff.txt`, `gofmt.txt`, `vet.txt`, `test.txt`, `gen-head.log`, `site-head.log`,
`gen-base.log`, `site-base.log`, `regex/main.go` (the adversarial label-regex harness).
Repo: `.superpowers/sdd/sc308/sc308-r4-golden-diff.txt` (implementer's, judged and confirmed).

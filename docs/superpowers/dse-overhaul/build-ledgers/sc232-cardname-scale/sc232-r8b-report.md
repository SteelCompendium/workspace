# SC-232 round 8b — print-moving card-head slot fixes (W3 → W2, W7, W4, W1b, Signature wording)

## Executive summary

- Head: dse `fa9addc` on branch `sc232-cardname-scale`. No superproject pointer bump this
  round (per the dispatcher's explicit instruction — the dispatcher bumps it at landing).
  Base unchanged: `origin/develop` `5a20d5f`.
- Item 1+2+3+6 (W3, W2, W7, Signature normalization — combined, commit `ef4e1ff`): DONE.
  Moves 78 lines / 39 ids.
- Item 4 (W4, statblock kind-noun + keywords — commit `b68e97f`): DONE. Moves bytes on 24
  of those 39 ids (measured), 0 new ids.
- Item 5 (W1b, kit signature parent-kit name — commit `fa9addc`): DONE. **0 lines** —
  print-neutral, measured (the left-deck slot it fills is Steel screen-only by design).
- Item 7 (summoner origin): **DROPPED**, one line why — it needs the site's multi-branch
  SCC-prefix parser (`summonerProvenanceEyebrow`, 5+ distinct cases + echelon decoding),
  not a trivial field read, per both this round's own bar and round 8a's prior finding.
- **Rebaseline: 78 lines, 39 ids** (`rebaseline.txt`). Determinism: 3 independent full
  `npm run shots` runs, byte-identical. Cross-check: a scratch copy of the shared baseline
  with these 78 lines substituted reads `sha256sum -c --quiet` **exit 0** against the final
  head's shots (all 260 lines) — confirmed twice (right after building `rebaseline.txt`, and
  again at the final gate battery).
- Gates: tsc/lint clean; jest **4170 passed / 1 skipped / 4171 total, 212/213 suites** (base
  4118/1/4119, 211/212 — one unrelated flaky suite reproduced-clean on a quiet re-run, see
  §Gates); lifecycle **19/19**; shots **540, 0 FAIL**; freeze — the ONLY FAILED lines are
  exactly the 78-line rebaseline set (verified 3×); parity **0 gap(s), 0 undeclared, 26
  declared, exit 0**.
- Evidence: `sc232-slots-neutral.png` (round 8a's composite, re-shot with the Site column in
  dark, per the ask), `sc232-slots-print-screen.png` (5 rows, screen), `sc232-print-before-
  after.png` (4 rows, steel-print crops) — every tile DOM-verified, not eyeballed.

## Step 0 — rebase check

`git fetch origin`: `origin/develop` is still exactly `5a20d5f` (unchanged since round 8a).
No rebase needed.

## Items 1+2+3+6 — W3, W2, W7, Signature normalization (commit `ef4e1ff`)

**Combined into one commit, not the brief's ideal 4 separate ones** — a deliberate,
disclosed departure, not an oversight. W2 is explicitly stated in the brief as needing W3
first ("because the right-eyebrow holds the cost today"); item 6's `normalizeSignatureWording`
call lives inside W3's own `rightPrimaryOf`, not a separable toggle; W7 touches the exact
same cardHead-building block and the exact same meta-band gate as W3. All four genuinely
share one function in `renderFeature.ts`. See that commit's own message for the full
per-sub-item breakdown; summary:

- **W3** (r7 survey d1/d3/b10): `rightPrimaryOf` — ONE right-primary slot, a priority chain
  (cost, else "Signature" when `metadata.subtype` is `signature`, else `ability_type`)
  replacing the old independent cost-in-eyebrow / ability_type-in-primary split. Forged-pill
  CSS moved `.dse-head__eyebrow--chip` → `.dse-head__primary--chip` (scoped to
  `.dse-feature`); SC-101's featureblock re-lane simplified (no more grid-area swap — every
  family's JS now writes the right slot directly; only the un-box + display-typography
  override survives, retargeted to the same slot). The consolidated theme-agnostic
  font-family block's featureblock arm updated to match.
- **W2** (b2/b6): `levelOf` — right-eyebrow "Level N" from `metadata.level`, falling back to
  the `level-N` segment of `metadata.scc`.
- **W7** (b3/b9): standalone feature + kit signature right-deck = `usage`; the duplicated
  meta "Type" chip drops for them (`!opts.featBlockIcon`) — a featureblock OPTION keeps its
  Type chip and today's lanes, per the brief's own words (pinned by a new DOM test).
- **Item 6**: `normalizeSignatureWording` — "Signature Ability" → "Signature"
  (`statblock_page.go:404-415`, case-insensitive), applied wherever `ability_type` reaches
  `rightPrimaryOf`.
- `compendiumInsert.ts`'s snapshot-trim allowlist (SC-165, round 8a's own correction)
  extended with `level`/`scc`/`subtype` — the new metadata keys these items read.

Tests: 25 new unit cases (`levelOf`, `normalizeSignatureWording`, `rightPrimaryOf` — every
branch) + DOM assertions updated across `feature.test.ts`, `featureblock.test.ts`,
`steelMaterial.test.ts` and `compendiumSearchModal.test.ts` for the new slot locations, plus
a new DOM case pinning that a featureblock option keeps its Type meta chip.

## Item 4 — W4, statblock kind-noun + keywords (commit `b68e97f`)

`statblockHeaderParts`'s left-eyebrow was the keywords line — the site puts the KIND-NOUN
there (`statblockKindNoun`, ported from `statblock_page.go:245-261`: buckets
`metadata.scc`'s SCC type-path substring into Monster/Companion/Retainer/Summon, "Monster"
default) and moves keywords to the left-deck (the same provenance slot feature/ability heads
use, SC-232 W1). Closes survey b11 + d2 together — same two-field swap on the same return
shape. No word/number changes to this file's own frozen fallback strings ('Level N/A', 'No
Role', 'EV N/A') — a slot relocation, not a fallback edit. The sticky mini-header needs no
change: it never surfaced left-eyebrow/left-deck at all.

Tests: `statblockHeader.test.ts` updated + 6 new cases for `statblockKindNoun`'s bucketing
(monster/companion/retainer/summoner/rival/no-scc-fallback); `statblock.test.ts` updated for
the new slot locations and item 6's wording in its no-content-loss pin.

## Item 5 — W1b, kit signature parent-kit name (commit `fa9addc`, final head)

The INLINE `signature_ability` (kitLayout's own Kit-model field) carries no `metadata` at
all, so W1's `leftDeckOf` alone renders no left-deck for it. `renderFeatureList` gains a
`leftDeckFallback` option; `kitLayout`'s signature-ability render call passes the kit's own
`m.name` ("Panther") — matching the site's inline signature-ability card
(`ability_cards.go:322-327`).

**Measured print-neutral, not assumed:** a detached scratch worktree at this commit's parent
(`b68e97f`) vs this commit produced byte-IDENTICAL hashes for all 78 rebaseline lines (`diff`
empty). Cause: the cardHead left-deck slot is Legacy-hidden and Steel **screen-only** revealed
by design (`.dse-feature .dse-head__deck--left`, SC-232 round 8a W1) —
`:not([data-dse-print="on"])` gates the reveal, so print never shows left-deck content at
all, source-independent. Confirmed visually too: the print crop for "Devastating Rush" shows
no "Panther" line at all (see `sc232-print-before-after.png` row 2 and the crop discussion
below). The survey's own r7 estimate for this sub-item ("8 lines: kit, kit-collapsed,
chrome-hover-card, chrome-collapsed-rollout") predates round 8a's final CSS design; those 4
ids DO move, but for W3/W7's reasons (commit `ef4e1ff`), not W1b's — `rebaseline-map.md` has
the full measured breakdown.

Test: `kitSteel.test.ts` — the Panther kit's inline "Devastating Rush" card now shows
"Panther" in its left-deck.

## Item 7 — summoner origin: DROPPED

Not attempted. The site's `summonerProvenanceEyebrow` (`internal/site/summoner_provenance.go`)
is a real multi-branch SCC-prefix parser — 5+ distinct segment-count/prefix cases (rival
minion, rival statblock, minion-summoner, champion-summoner, …) plus echelon-number decoding
(`echelonNum`) — not a single field read. This fails both this round's own bar ("only if it
is purely data-driven") and matches round 8a's own report's identical conclusion about the
featureblock summoner-origin half of the same survey item (W5/b12). Follow-up, not this
round's scope.

## Rebaseline deliverables

- **`rebaseline.txt`** (this ledger directory): 78 `<sha256>  <filename>` lines, same format
  as `freeze-baseline.sha256`, for the 39 ids whose bytes changed. **Never touched the
  shared baseline itself** — only read from it (for the scratch-copy cross-check) and only
  wrote to this worktree's own ledger-directory deliverable.
- **`rebaseline-map.md`** (this ledger directory): the full per-item id breakdown, with its
  measurement method stated up front (a scratch worktree per commit + pairwise `sha256sum`
  diffs across three stages — a real measurement, not inferred from reading the code) and
  the explicit note that this is NOT a clean partition (items 1-3+6 and item 4 both touch
  most of the same 24 statblock-family ids, for different reasons on the same frozen
  capture).
- **Determinism**: 3 independent full `npm run shots` runs at the final head (the two this
  round plus the one folded into the final gate battery below) — every one of the 78 lines'
  hashes byte-identical across all three, `diff` empty each time.
- **Scratch-baseline cross-check**: `/tmp/sc232b-scratch-baseline.sha256` (session-scratch,
  not preserved in the ledger dir — the exit-0 result is what's recorded) — the shared
  `freeze-baseline.sha256` copied, its 78 relevant lines replaced with `rebaseline.txt`'s
  hashes (0 names in `rebaseline.txt` failed to match an existing baseline line), then
  `sha256sum -c --quiet` against the final head's own shots: **exit 0**, confirmed twice
  (once right after building `rebaseline.txt`, once again at the final gate battery, each
  time against a freshly regenerated shots directory). The shared `freeze-baseline.sha256`
  file on disk was never modified — it was only ever read from, to make the scratch copy.

## Evidence

All under `.../sc232-cardname-scale/r8-evidence/`. Every tile captured at
`deviceScaleFactor: 1` (1 image px = 1 CSS px), cropped to the card head only, pasted at
native size, never rescaled; text labels on every row/column; no color-coding. Every tile's
slot text verified by DOM query (`dom-verified-text.json` / `dom-verified-text-print-
screen.json`), not eyeballed.

- **`sc232-slots-neutral.png`** (round 8a's composite, re-shot for this round's ask): same 4
  rows (Determination / Mark / Growing Ferocity / Devil Malice), **Site column now dark**
  (`colorScheme: 'dark'` browser context — Material for MkDocs renders dark whenever the
  browser prefers it and no palette choice is stored client-side, confirmed live: body
  background flips from `rgb(255,255,255)` to `rgb(26,30,33)`). "This branch" column
  re-shot at the round 8b final head too, so it now additionally shows the Level/usage
  chips round 8b added — every slot now matches Site exactly (previously Mark/Growing
  Ferocity were missing their right-eyebrow/right-deck, explicitly noted as deferred W2/W7
  items in round 8a's report; that gap is now closed).
- **`sc232-slots-print-screen.png`** (5 rows, screen dark, this round's own ask): ability
  w/ cost (Coverage Strike / Apex Predator on site — Coverage Strike has no site page, so
  the Site column uses a real site entity of the same shape), kit signature (Devastating
  Rush — same entity all 3 columns), statblock head (Human Bandit Chief), statblock
  sub-feature (Whip and Magic Longsword), a Level-N ability (Mark).
- **`sc232-print-before-after.png`** (4 rows, `steel-print` crops, before | after, one
  representative id per item — W2 is omitted here since it's measured print-neutral, see
  Item breakdown below): `feature--steel-print` (Coverage Strike, item 1/W3 — "5 Malice"
  moves from the eyebrow chip to the primary slot, "Main action" newly appears below it);
  `kit--steel-print` (Devastating Rush, items 3+5/W7+W1b — "Main action" newly appears;
  "Panther" does NOT appear anywhere in either column, confirming item 5's print-neutrality
  visually as well as by hash); `statblock--steel-print` (Human Bandit Chief, item 4/W4 —
  eyebrow "Human, Humanoid" → "Monster", keywords reappear as their own line below the
  name); `statblock` sub-feature crop (Whip and Magic Longsword, item 6 — "Signature
  Ability" → "Signature").

## Gates (full battery, dse-verify order)

| Gate | Base (`5a20d5f`, round 8a's own measurement — unchanged, `origin/develop` did not move) | Head (`fa9addc`) |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `npx jest` (`rm -f main.js styles.css` first) | 4118 passed / 1 skipped / 4119 total / 211 of 212 suites | **4170 passed / 1 skipped / 4171 total / 212 of 213 suites, 3 snapshots** — one run hit a single failure in `sidebarEncounterHandoff.test.ts` (unrelated to this round: sidebar/session-anchor handoff, nothing to do with cardHead/statblock/kit) under `/proc/loadavg` 13.0; reproduced clean in isolation immediately (10/10) and clean on a full re-run at load 9.8 (the dse-verify skill's own documented load-sensitivity footgun, for a different suite than its two named examples) — reported here as the confirmed-clean number |
| `npm run obsidian-lifecycle` (own `DSE_LIFECYCLE_PORT=9297`) | not re-measured (unaffected) | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0** |
| `npm run shots` | 532 (round 8a base), 0 FAIL | **540, 0 FAIL** (unchanged from round 8a's own head — no new fixtures this round) |
| `check-freeze.sh` | `freeze OK (260/260)` | **`FREEZE VIOLATED (78 checksum mismatches, 0 missing)`** — this round is print-MOVING by design; every one of the 78 FAILED lines is exactly `rebaseline.txt`'s set (diff-verified), and the scratch-baseline substitution check (above) confirms nothing else leaked |
| `npm run parity` | — | **`0 gap(s), 0 undeclared warning(s), 26 declared deferral(s)`, exit 0** — unchanged composition; no new/remapped pair needed despite the slot relocations (parity's mapped selectors already targeted the right DOM nodes; the site comparison staying green with 0 new gaps is itself a positive signal that the new slot placements match the live site's real structure) |

## Drive-by fixes

None this round.

## Follow-ups

- **Item 7 (summoner origin in the featureblock left-deck)**: needs the site's
  `summonerProvenanceEyebrow` SCC-prefix parser ported — a real multi-case algorithm, not a
  field read. Dropped per this round's own "trivially data-driven" bar.
- **Print-moving sanction**: this round's 78-line rebaseline needs Scott's written sanction
  before the dispatcher applies it to the shared `freeze-baseline.sha256` at landing — not
  requested or obtained by this worker, per the rules.
- The `/tmp/sc232b-*` capture scripts and intermediate crop PNGs are session-scratch, not
  preserved in the ledger dir; the composites and `dom-verified-text*.json` files are the
  preserved record. Re-running the evidence capture is cheap (the scripts' logic is fully
  described in this report and `rebaseline-map.md`) if the dispatcher wants the raw
  intermediates on file.

## Rules compliance

- Never touched dse `main`, never tagged, never pushed. No `just deploy*`. Never edited the
  shared `freeze-baseline.sha256` or `check-freeze.sh` — only read from them; the scratch
  cross-check used a copy at `/tmp/sc232b-scratch-baseline.sha256`.
- Every long gate (`obsidian-lifecycle`, `npm run shots` ×3, `npm run parity`) ran to
  completion in the foreground; none was killed. No process was killed this round at all —
  every `pgrep -af "worktrees/sc232-cardname-scale/"` check before each background-then-
  waited command came back empty beforehand.
- Every detached scratch worktree (`sc232b-stage1`, `sc232b-stage2`,
  `sc232b-base-evidence2`) was created under `/home/scott/code/steelCompendium/worktrees/`,
  used, and `git worktree remove --force`'d immediately after — confirmed via
  `git worktree list` showing only the real worktree at the end of each phase. The shared
  main checkout was never touched.
- Commits: one per coherent step (2 code commits for round 8b's 6 items — deliberately
  combined per the disclosure above — plus 1 CHANGELOG-only commit, no pointer bump).

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r8b-report.md`
- Rebaseline deliverables:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline.txt` (78 lines),
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline-map.md`
- Evidence composites:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-slots-neutral.png` (re-shot),
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-slots-print-screen.png` (new),
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/sc232-print-before-after.png` (new)
- Evidence DOM-verified text:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/dom-verified-text.json` (updated),
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r8-evidence/dom-verified-text-print-screen.json` (new)
- dse commits (branch `sc232-cardname-scale`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements`):
  `ef4e1ff` (items 1-3+6), `b68e97f` (item 4), `fa9addc` (item 5 — **final dse head**).
- Worktree superproject commit
  (`/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`): `6fe097f`
  (CHANGELOG only, no pointer bump — **final superproject head for this round; the
  `draw-steel-elements` submodule shows dirty in `git status`, intentionally, for the
  dispatcher's own pointer-bump commit at landing**).
- Changed source files (round 8b, on top of round 8a's):
  `draw-steel-elements/src/elements/feature/renderFeature.ts`,
  `draw-steel-elements/src/elements/statblock/view.ts`,
  `draw-steel-elements/src/elements/display/layouts.ts`,
  `draw-steel-elements/src/authoring/compendiumInsert.ts`,
  `draw-steel-elements/styles-source.css`.
- Changed/new test files:
  `draw-steel-elements/test/unit/elements/renderFeature.test.ts`,
  `draw-steel-elements/test/unit/model/statblockHeader.test.ts`,
  `draw-steel-elements/test/dom/elements/feature.test.ts`,
  `draw-steel-elements/test/dom/elements/featureblock.test.ts`,
  `draw-steel-elements/test/dom/elements/statblock.test.ts`,
  `draw-steel-elements/test/dom/elements/kitSteel.test.ts`,
  `draw-steel-elements/test/dom/theme/steelMaterial.test.ts`,
  `draw-steel-elements/test/dom/authoring/compendiumSearchModal.test.ts`.
- CHANGELOG: `sc232-cardname-scale/CHANGELOG.md` (worktree superproject).

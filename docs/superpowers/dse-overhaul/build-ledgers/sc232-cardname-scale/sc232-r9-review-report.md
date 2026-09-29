# SC-232 r9: independent review of the card-head SLOT work (rounds 8a + 8b), dse `fa9addc` on `5a20d5f`

## Executive summary

- **Verdict: FIX-FIRST.** Counts: CRITICAL 0 / HIGH 1 / MEDIUM 2 / LOW 5 / INFO 10.
- **Freeze: `rebaseline.txt` is mechanically sound.**
  - Its 78 names are exactly the FAILED set, and every hash matches.
  - The PNGs are byte-identical across 3 shot runs (540/540).
  - With the rebaseline applied to a scratch copy of the baseline, `check-freeze.sh` reads `freeze OK (260/260 …)`.
  - The print crops show no overlaps, clipping or collapsed rows.
  - **But the package carries HIGH-1, so it must be regenerated after the fix and must not be sanctioned as is.**
- **Site fidelity.** I compared 25 real entities (the md-dse corpus through the harness, against the live site through `/v2/scc/<code>/`). Every standalone trait, ability, class-feature and kit-signature head slot matches the site exactly. That covers subclass, the `feature_source` circle, kit slugs, level-from-scc, the "Signature" fallback, abilities with no cost, and common abilities.
- **HIGH-1: W7 (usage moves into the head right-deck) was applied to every statblock sub-feature.**
  - The site deliberately keeps usage out of those heads.
  - The Type chip is gone from the statblock meta band, so the `kwUsage` preference's action-type half is dead for statblocks.
  - This moves print bytes and is baked into the 78-line rebaseline.
- **MEDIUM-1:** a compendium snapshot no longer renders the same head as its source. Retainer/Summon statblocks paste as "Monster"; a malice featureblock loses its "Malice" eyebrow.
- **MEDIUM-2:** a synced (by-SCC) kit's signature ability has no "Panther" left-deck, although the code comments and the CHANGELOG say it does.
- **Gates:** tsc and lint clean; jest 4170/1/212 of 213/3; lifecycle 19/19; shots 540; parity 0/0/26. `origin/develop` is unchanged at `5a20d5f`.

## Method

- **Scratch clones** under `scratchpad/r9/`:
  - `base` (`5a20d5f`) and `head` (`fa9addc`), each carrying only the r7 survey's `?src=` harness patch so a real fence body can be injected.
  - The worktree itself was never edited. Its git status is unchanged (dse clean; the superproject shows only its existing ` M draw-steel-elements`).
- **Plugin side:** 25 real md-dse files from `data/data-unified` (2026-09-24), rendered in the Steel dark 900px harness (`plugin-heads.mjs`).
- **Site side:** the same 25 entities on the live site, 1440px dark, through `/v2/scc/<scc>/` (`site-heads.mjs`). The comparison table is `logs/cmp.txt`.
- **Other probes:**
  - hand-authored synthetic fences (`synth/`)
  - a snapshot-fidelity jest probe, added to the scratch clone only (`scripts/r9SnapshotFidelity.test.ts`)
  - a narrow rail-overlap probe
  - the wrap table
  - print and screen crops, base against head (`r9-heads-{print,dark}-base-vs-head.png`)
  - a corpus scan (`corpus.py`)
- **Gates** were run in the worktree.
- **Process note.** Shots run 2 hung in the post-capture inline host-leak sweep (0 CPU for more than 15 minutes; a second session's shots run on the `sc318` worktree was running at the same time). All 540 PNGs had already been written. I killed my own wrapper by PID (322322, whose command line contains the worktree path). I then killed its now-orphaned `npm`/`node` children (322323, 322334). Their own command lines do not contain the path, but I checked that their cwd is the worktree and that their parent is 322322 before killing them. Run 3 re-checks that the in-run gates complete (see the Gates section).

## Findings

### HIGH-1: W7 is over-applied; statblock sub-features show usage in the head, which the site forbids

**Where:**
- `src/elements/feature/renderFeature.ts:571-572`: `rightDeckText = !opts.featBlockIcon && feature.usage …`
- `:619` and `:683`: the Type meta cell now exists only when `opts.featBlockIcon` is set.

Statblock/view.ts calls `renderFeatureList(…, opts)` without `featBlockIcon` (`statblock/view.ts:452,457,461,488`), so every statblock ability is treated like a standalone card.

**Spec:**
- Survey §3 W7 and the r8b brief item 3 both say: "Standalone feature + kit signature: right-deck = usage."
- The site's `statblock_card.go:134-138` says: "The action TYPE (usage) is deliberately NOT in the head; it reads in the keyword/action block below."
- Live check: Human Bandit Chief's usage renders only as `a.sb-term` inside `.sb__field-v`, in the body (`site-sbfeat.mjs`).

**Measured (plugin head against site):**
- A right-deck chip now appears on every statblock ability:
  - Human Bandit Chief: "Main action", "Maneuver", "Triggered action"
  - Gnoll Gnasher: "Main action"
  - Demon Lord's Aspect: "Main action", "Free triggered action"
  - Rival Summoner: "Main action" ×2, "Triggered action"
  - Angulotl Pollywog: "Main action"
- The site shows none of these.
- The meta band lost its Type cell on every statblock ability: base `KeywordsMagic, Melee, Strike, WeaponType…` becomes head `Keywords…` with no Type (`logs/meta-{base,head}.json`), with `kwUsage=grid` too.
- Each sub-feature head grows by about 20–25px, both on screen and in print (visible in `r9-heads-print-base-vs-head.png`: Kneel, Peasant! gains a "Maneuver" chip; Whip and Magic Longsword gains "Main action").

**Consequences:**
1. A new site divergence on the most-used card family.
2. The `kwUsage` preference help text (`src/prefs/catalog.ts:549`: "keyword + action-type band … Applies to every ability card — standalone, and inside statblocks") is false for statblocks.
3. The rebaseline map attributes statblock-id moves to "their nested sub-features' … usage relocate the same way". Those bytes would be sanctioned for a change that contradicts the site.

**Fix:**
1. Add an explicit option, for example `RenderFeatureOptions.usageInHead`. Set it only for the standalone `FeatureView` (a by-SCC nested kit fence renders as a standalone root, so it is covered) and for `kitLayout`'s inline signature.
2. Gate `rightDeckText` and the Type-cell removal on it, so statblock (and featureblock) sub-features keep today's meta Type cell and have no head usage.
3. Re-run the shots and **regenerate `rebaseline.txt` and `rebaseline-map.md`**. Statblock ids still move for W3, W4 and item 6, but their hashes will change.
4. Add a jest pin: no `.dse-head__deck--right` inside `.dse-sb .dse-feature`.

### MEDIUM-1: compendium snapshot fidelity is broken for the W4 and W5 slots

**Where:**
- `src/authoring/compendiumInsert.ts:161-181` (`trimSnapshotDTO`) keeps `metadata` only for `type === 'feature'`. Statblocks keep the full drop.
- The comment at `:95` ("statblock and featureblock snapshots are unaffected — neither element ever reads `.metadata`") has been false since `b68e97f` (`statblock/view.ts:158` reads `metadata.scc`).
- The featureblock snapshot DTO does not carry `kind` either (`featureblock/view.ts:81,118-119`).

**Measured** (a scratch jest probe running the real `insertFullBlock` → pipeline on 6 corpus entities; `logs/snapfid.log`): 3 of 6 fail.

| Entity | Synced head | Pasted-snapshot head |
|---|---|---|
| Gnoll Gnasher | eyebrow "Retainer" | eyebrow "Monster" |
| Archer Spittlich | eyebrow "Summon" | eyebrow "Monster" |
| Devil Malice | eyebrow "Malice" | no eyebrow |

The three feature entities (subclass ability, kit signature, class feature) pass, because the 9-key narrowing is correct for features. The SC-165 suite stays green only because its cases (goblin-stinker = "Monster"; pillar has no `kind`) cannot see the gap.

**Failure scenario:** a GM inserts a full-block snapshot of a retainer or summon to homebrew it, and the pasted card silently reads "Monster". The same happens with a malice featureblock, whose eyebrow disappears. This is exactly the silent-gap class SC-165 exists to prevent.

**Fix:**
- Keep a narrowed `metadata: {scc}` for statblock snapshots.
- Carry `kind` through the featureblock snapshot (DTO or trim).
- Add a retainer statblock and a malice featureblock to `SNAPSHOT_CASES`.
- Correct the `:95` comment.

Write integrity is otherwise fine: the YAML is produced by `stringifyYaml`, and there is no other key change.

### MEDIUM-2: a synced (by-SCC) kit's signature ability renders no kit-name left-deck

**Where:**
- `src/elements/display/layouts.ts:343-357`: the hybrid branch renders the nested fence through `renderMarkdown`, with no fallback.
- The `leftDeckFallback` doc at `src/elements/feature/renderFeature.ts:200-205` claims "a by-SCC nested `ds-feature` fence … already carries `metadata.kit` and needs no fallback".

**Measured:**
- The nested ```` ```ds-feature ```` fence inside `md-dse/kit/panther.md` has `metadata` keys `action_type, distance, effects, flavor, keywords, name, power_roll_characteristic, subtype, target, tier1-3`. It has no `kit`, no `class` and no `scc`.
- Rendered, its left-deck is empty. The live site kit page shows "Panther" (`logs/cmp.txt`, kit/panther).
- The standalone ability file (`feature/ability/panther/devastating-rush.md`) does carry `metadata.kit`, and the survey's b8 row was measured on that file, not on the kit's nested fence.
- The superproject CHANGELOG repeats the claim ("falling back to a kit's name for a kit's own signature ability (inline or synced)").

**Failure scenario:** every real synced kit card in Scott's vault takes this path, and it still misses exactly the lower-left line Scott's ruling was about.

**Fix:**
- Data side (preferred): have steel-etl emit `kit:` (and ideally `scc`) into the kit's nested signature-fence metadata. This needs a Backlog ticket and a data redeploy.
- Or, plugin side: in the hybrid band, fill `.dse-feature > .dse-head` left-deck slots that are missing, using the kit name, after the nested render.
- Correct the two comments and the CHANGELOG line either way.

### LOW-1: summoner-book statblocks: the left-deck shows raw keywords where the site shows summoner provenance

`statblock/view.ts:159`. The site replaces the keyword line with `summonerProvenanceEyebrow` (plus the domain parenthetical):

| Entity | Site | Plugin |
|---|---|---|
| Archer Spittlich | "Summoner Minion · Demon" | "Abyssal, Demon" |
| Demon Lord's Aspect | "Summoner Champion · Demon" | "Abyssal, Demon" |
| Rival Summoner | "Rival Summoner · Echelon 2" | "Humanoid, Rival" |

W4 marked this as optional. Item 7's drop note covers only the featureblock half. Fix: port the helper or file a follow-up, and say so in the Scott ask.

### LOW-2: the right-deck usage is not normalized like the site's `actionInfo`

`renderFeature.ts:571-572` shows the raw `usage`. In the corpus, 485 of about 620 `usage` values are SCC markdown links, so the chip holds a link. The site maps usage to canonical labels (`ability_cards.go:88-110`), and the plugin does not:

| Raw usage | Site label | Plugin shows |
|---|---|---|
| "Triggered" | "Triggered Action" | "Triggered" |
| "Free triggered" | "Free Triggered Action" | "Free triggered" |
| "Move" | "Move Action" | "Move" |
| "Free maneuver" | "Maneuver" | "Free maneuver" |

Letter-case differences are hidden by small-caps (the rendered text matched the site for Main action and Maneuver). Fix: port the `actionInfo` label mapping for the head chip.

### LOW-3: `rightPrimaryOf` silently drops `ability_type` when `cost` is also set

**Where:** `renderFeature.ts:448-450`.

**Failure scenario:** a hand-authored block with `cost: 2 Malice` and `ability_type: Villain Action 1` shows "Villain Action 1" nowhere on the card (synthetic `f6.md`, base against head). The corpus has 0 such features and the docs' examples don't combine the two.

**Fix:** keep `ability_type` visible when a cost wins the right-primary. For example, put it in the right-eyebrow when there is no level.

### LOW-4: the `kwUsage` help text is stale

**Where:** `src/prefs/catalog.ts:549`.

Standalone ability cards now carry usage in the head, not in the band. After HIGH-1 is fixed, the text should say the band's action type applies only to statblock and featureblock abilities.

### LOW-5: the CHANGELOG bullet overclaims and carries process text

**Where:** superproject `CHANGELOG.md`, the second SC-232 bullet.

- "inline or synced" is false (MEDIUM-2).
- "Fixture", "Dynamic Terrain" and "Advancement" never appear: the corpus `kind` values are only `malice` (126) and `feature` (2), and dynamic-terrain and fixture fences carry no `kind`.
- "pending Scott's sanction before it lands on `develop`" is process text in a user-facing bullet.

## INFO

1. **Exact site matches** (every slot compared; `logs/cmp.txt`):
   - Mark
   - Revelator ("Censor · Exorcist", Level 2, 5 Wrath, Maneuver)
   - Fade ("Cloak And Dagger": the site title-cases the slug the same way, so no mismatch)
   - Two Shot ("Rapid Fire")
   - Devastating Rush (standalone)
   - Bodyswap and Back Blasphemer! (Signature fallback)
   - Grab (common ability: no deck, no level)
   - Determination ("Human", 2 Points)
   - Draconian Guard ("Dragon Knight")
   - both Growing Ferocity files (Feature / Fury / Level 1; the boren kit feature correctly picks class first)
   - Nature Watch ("Summoner Circle · Storms", Level 5)
   - the statblock kind-nouns: Monster, Retainer, Summon (for both summoner-book and monsters-book rivals)
   - statblock sub-feature right-primary: "Signature", "1+ Malice"
   - the Devil Malice "Malice" eyebrow
2. **Pre-existing gaps, identical at base and not introduced by this branch:**
   - Summoner statblocks show "Level 0" and a bare "EV"; the site omits the level chip and shows the essence cost ("3 essence for two minions").
   - Dynamic-terrain and fixture featureblocks miss the site's "Featureblock" eyebrow, type+role right-primary ("Hazard Hexer", "Hazard Support"), "EV 2" and "Summoner · Demon" left-deck.
   - The r7 survey did not list the type+role/EV gap. Candidate follow-up.
3. **Missing data** (synthetic hand-authored fences):
   - No "undefined" and no "Level undefined" anywhere.
   - Blank or whitespace metadata values are ignored.
   - An empty `metadata: {}` renders identically to develop.
   - A usage of "-" renders no chip.
   - An unknown `kind` gives "Featureblock" (site parity).
   - A statblock with no keywords mounts an empty `.dse-head__deck--left` span (base mounted an empty eyebrow span; the corpus has 0 keyword-less statblocks). Consider `leftDeck: keywords.length ? … : undefined`.
4. **Freeze detail:**
   - Run 1: `FREEZE VIOLATED (78 …)`, and the FAILED set equals `rebaseline.txt`'s names exactly; every current hash equals `rebaseline.txt`.
   - Scratch baseline with the 78 lines substituted, checked with a copy of `check-freeze.sh` run against it: `freeze OK (260/260 …)`.
   - Run 2: all 540 PNG hashes are identical to run 1 (`hashdiff.txt` empty).
   - `rebaseline-map.md` explains all 39 ids; the W1b "0 lines" claim holds, because the left-deck is print-hidden.
5. **Print eyeball.** `r9-heads-print-base-vs-head.png` covers 20 heads across feature, villain, featureblock ×3 fixtures, kit, statblock and villain-corpus. There are no overlaps, clipped chips or collapsed rows. The new right-deck chips use the existing dim print chip style.
6. **Narrow (SC-284).** At 300px, screen and print, the Revelator, Determination, Human Bandit Chief and Rival Summoner heads place the level, cost and usage chips in rows 4, 5 and 6 of column 2, with 0 overlaps and 0 clipping (`narrow-slots-head.log`). The name fallback holds: the wrap table matches base for all 114 names at widths of 480px or less.
7. **SC-231 keyword chips are intact.** Only the Type cell went away (see HIGH-1 for the statblock part).
8. **The sticky statblock mini-header's text is identical** base against head ("HUMAN BANDIT CHIEF Leader …"). It reads only name and role, so W4 does not reach it.
9. **Gates:**
   - tsc and lint clean.
   - Jest 4170 passed / 1 skipped / 212 of 213 suites / 3 snapshots, matching the implementer's figure.
   - `obsidian-lifecycle` (port 9297): 19/19.
   - Shots: 540. Runs 1 and 3 completed every in-run gate. Run 2 hung (see Method).
   - Parity: 0 gaps / 0 undeclared / 26 declared, exit 0.
10. **compendiumInsert `6828e11` + `ef4e1ff`.** Narrowing the feature snapshot to 9 keys (`ancestry, class, kit, subclass, feature_source, type, level, scc, subtype`) is correct and safe for features: fidelity holds on 3 of 3 feature entities, and the round trip is render-inert. The defect is statblock/featureblock only (MEDIUM-1).

## Gates: shots run 3

- Run 3 completed normally (exit 0) and printed every in-run gate OK line. No shot had errors.
- All 540 PNGs are byte-identical to run 1 (`hash3.txt`), so 3 of 3 runs are deterministic.
- Freeze:
  - scratch-applied baseline: `freeze OK (260/260 …)`
  - shared baseline: `FREEZE VIOLATED (78 …)`, exactly the pending set
- The run-2 hang was environmental and has not recurred.

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r9-review-report.md`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r9-evidence/r9-heads-print-base-vs-head.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r9-evidence/r9-heads-dark-base-vs-head.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r9-evidence/scripts/`: the probes, `corpus.py`, `entities.json`, `r9SnapshotFidelity.test.ts`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r9-evidence/synth/`: hand-authored fences
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r9-evidence/logs/`:
  - site/plugin comparison: `cmp.txt`, `site-heads.json`, `plugin-heads-{base,head}.json`
  - snapshot probe: `snapfid.log`
  - freeze: `freeze1.log`, `failed1.txt`, `hash1.txt`, `hash2.txt`, `hashdiff.txt`, `scratch-baseline-applied.sha256`
  - gate logs, `meta-*.json`, the wrap logs, `narrow-slots-head.log`

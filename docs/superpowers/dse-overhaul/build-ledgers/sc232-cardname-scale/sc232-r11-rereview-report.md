# SC-232 r11: scoped re-review of the round-10 fixes (dse `f3085d5` on `fa9addc`)

## Executive summary

- **Verdict: LAND-READY-AS-PROPOSAL.** CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 2 (both are doc or evidence wording) / INFO 5. `origin/develop` is still `5a20d5f`.
- **HIGH-1: fixed.** Across 25 real entities, statblock abilities carry 0 usage chips in the head, and every one has its meta "Type" cell back. The `kwUsage=grid` statblock band is byte-for-byte the same as develop's. Standalone abilities and kit signatures keep the chip, with the site's label ("Main Action", "Maneuver") as plain text (0 `<a>` elements).
- **LOW-2: fixed.** Every usage chip now reads exactly as on the site.
- **MEDIUM-1: fixed.** The r9 snapshot-fidelity probe passes 6 of 6, including Gnoll Gnasher ("Retainer"), Archer Spittlich ("Summon") and Devil Malice ("Malice").
- **LOW-3: fixed.** A block with both a cost and an `ability_type` shows both: the cost in the right-primary and the `ability_type` in the right-eyebrow. This holds for a standalone ability and for a statblock ability. Residual: when a level is also present, the `ability_type` still vanishes (INFO-1).
- **MEDIUM-2 (comments) and LOW-4/LOW-5 are now true.** The comments in `renderFeature.ts:200-214` and `layouts.ts:333-341`, the `kwUsage` help text, and the CHANGELOG all correctly state that a synced kit signature has no kit name yet (SC-375).
- **Freeze.**
  - The FAILED set equals `rebaseline.txt` exactly: 78 lines, 39 ids.
  - My independent shots run reproduces every one of its 78 hashes, so it is deterministic against the implementer's runs.
  - With the rebaseline applied, a scratch copy of the baseline reads `freeze OK (260/260)`.
  - Nothing is broken in print (checked in my own develop-vs-head crops and in `r8-evidence/sc232-print-before-after.png`).
- **The 19 new tests are real.** I reverted each fix in a scratch clone, and the matching tests failed every time: 7 mutations, 1 to 5 failures each.
- **Gates:** tsc and lint clean; jest 4189 passed / 1 skipped / 212 of 213 suites / 3 snapshots; shots 540, 0 FAIL; parity 0/0/26, exit 0.

## Method

Scratch clones under `scratchpad/r11/`:
- `head` (`f3085d5`), with the r7 `?src=` harness patch
- `mut` (`f3085d5`), for the mutation runs

I reused the r9 scripts, the r9 base (develop `5a20d5f`) plugin data and the base crops. I re-captured the live site: 0 of 25 entities changed since r9.

Everything ran in the foreground; I had no background jobs, killed no processes, made no commits, and never touched the shared checkout or baseline. The worktree is unchanged: dse is clean at `f3085d5` and the superproject shows only its existing ` M draw-steel-elements`. The r10 scratch worktree `sc232-r10-scratch-fa9addc` is gone.

## (1) The r9 site comparison, re-run (`logs/cmp.txt`)

**Remaining slot differences against the site: 13.** All are pre-existing or already filed; none are new:
- Summoner statblock left-deck provenance, 3 entities: SC-373.
- Summoner "Level 0" / bare "EV", 5 slots: pre-existing, identical on develop.
- Dynamic-terrain and fixture type+role/EV and "Summoner · Demon", 5 slots: SC-374.

**Statblock abilities** (Human Bandit Chief, Gnoll Gnasher, Violent, Archer Spittlich, Demon Lord's Aspect, Rival Summoner, Angulotl Pollywog):
- 0 right-deck usage chips.
- The meta Type cell is present: "type main action", "type maneuver", "type triggered action", and so on.
- 13 Type cells in total, against 0 at r9.

**Meta band and sticky header** (`logs/meta-head.json` against r9's develop capture):
- The statblock bands, including `kwUsage=grid`, are identical to develop, so the setting works on statblocks again.
- Only the standalone features (Mark, the feature fixture) drop their Type cell, as intended.
- The sticky header text is identical.

**Standalone and kit-signature usage chips** (`rdlink.mjs`):

| Entity | Raw usage | Chip |
|---|---|---|
| Mark | `[Maneuver](scc.v1:…)` | `<p>Maneuver</p>`, 0 anchors |
| Revelator | `[Maneuver](scc.v1:…)` | `<p>Maneuver</p>`, 0 anchors |
| Kit panther nested fence | `Main action` | "Main Action" |

The meta band on the same pages does contain links, so the harness is rendering markdown and the check is not vacuous. Every standalone right-deck chip now equals the site's text exactly ("Main Action", "Maneuver"), where r9 had "Main action".

## (2) Snapshot fidelity (`logs/snapfid.log`)

The r9 probe, unchanged, runs the real `insertFullBlock` → pipeline on 6 corpus entities: **6 passed**.

| Entity | Synced eyebrow | Snapshot eyebrow |
|---|---|---|
| Gnoll Gnasher | Retainer | Retainer |
| Archer Spittlich | Summon | Summon |
| Devil Malice | Malice | Malice |

The feature cases still match. Code check (`compendiumInsert.ts`, commit `e1705ba`): statblock metadata is narrowed to `{scc}`, and featureblock `kind` is read off the unwrapped model and written as a top-level YAML key. There is no other change to what gets written.

## (3) LOW-3 (`logs/synth-head.json`)

| Block | Right-eyebrow | Right-primary | Right-deck | Meta |
|---|---|---|---|---|
| `f6` (standalone: cost 2 Malice + Villain Action 1 + Main action) | Villain Action 1 | 2 Malice | Main Action | — |
| `s2` (statblock ability, same fields) | Villain Action 1 | 2 Malice | — | Type cell kept |
| `s1` (keyword-less statblock) | — | — | — | — |

- On develop, `f6` showed the right-eyebrow "2 Malice" and the right-primary "Villain Action 1". Both values are still shown.
- `s1`: no left-deck slot at all (no empty span).

## (4) Freeze

- `check-freeze.sh`: `FREEZE VIOLATED (78 checksum mismatches, 0 missing)`. The sorted FAILED names equal `rebaseline.txt`'s 78 names (39 distinct ids) with an empty diff.
- All 78 current hashes equal the hashes in `rebaseline.txt` (written 2026-09-27 20:18 by a different run), so my single run confirms determinism.
- A scratch copy of `check-freeze.sh` with the rebaseline substituted into a scratch baseline reads `freeze OK (260/260 …)`.
- Since r9's fa9addc shots, 36 frozen ids changed bytes: the 35 the map lists (all 39 except the 4 featureblock ids), plus `statblock-narrow`, which is not frozen. This matches `rebaseline-map.md`'s round-10 section.
- **Print eyeball.** `r11-heads-print-develop-vs-head.png` shows 20 heads across feature, villain, featureblock ×3 fixtures, kit, statblock and villain-corpus. Statblock abilities no longer carry usage chips in print. There are no overlaps, clipped chips or collapsed rows. `r8-evidence/sc232-print-before-after.png` is also clean (see LOW-2 for its framing).

## (5) The new tests: can they fail? (`logs/mut-*.log`)

Jest is 4189, which is 4170 + 19:
- 9 `usageLabelOf` unit cases
- the HIGH-1 statblock DOM pin
- the featureblock-`kind` snapshot test
- 8 new `test.each` rows from the 2 new `SNAPSHOT_CASES` (retainer, malice featureblock)

LOW-3 and the empty left-deck are pinned by edits to existing assertions.

Each fix reverted in the scratch clone:

| Fix reverted | Test run | Result |
|---|---|---|
| HIGH-1 gate back to `!opts.featBlockIcon` | statblock.test | 1 failed |
| HIGH-1 Type cell back to `featBlockIcon` only | statblock.test | 2 failed |
| LOW-2 "main" returns the raw text | renderFeature.test + feature.test | 5 failed |
| LOW-3 displaced `ability_type` removed | feature.test | 2 failed |
| MEDIUM-1 statblock metadata fully dropped | compendiumSearchModal.test | 5 failed |
| MEDIUM-1 featureblock `kind` not written | compendiumSearchModal.test | 2 failed |
| Empty left-deck back to `''` | statblockHeader + statblock tests | 2 failed |

## Findings

### LOW-1: the CHANGELOG says "a statblock or featureblock ability keeps today's layout", which is not quite true

**Where:** superproject `CHANGELOG.md`, second SC-232 bullet.

**What changed for statblock abilities:**
- The cost chip moved from the right-eyebrow to the right-primary (W3). For example, "1+ Malice" on Rival Summoner, and "Shoot!"'s "Villain Action 1" is now the forged primary chip.
- "Signature Ability" became "Signature".
- With LOW-3, a displaced `ability_type` now sits in the right-eyebrow.

Only the usage/Type-cell placement is unchanged from develop.

**Fix:** reword to something like "a statblock or featureblock ability keeps its action type in the keyword band (the site's placement); its cost now reads beside the name". A text-only change.

### LOW-2: the sanction evidence compares against the wrong "before"

**Where:** `r8-evidence/sc232-print-before-after.png`.

**Problem:** Scott is sanctioning a move from the shared baseline, which is develop. The image's "before" is `fa9addc` (round 8b), not develop. Its row labels are also cut off ("Human Bandit (", "LOV").

**Fix:** for the ask, use a develop → head crop set. `r11-evidence/r11-heads-print-develop-vs-head.png` is one (20 heads). The alternative is to regenerate the r8 image with develop on the left.

### INFO

1. **LOW-3 residual.** When `metadata.level` is present, the level wins the right-eyebrow and a cost-displaced `ability_type` still vanishes (synthetic `f8.md`: Level 4 + 3 Malice + Villain Action 2 → "Villain Action 2" is not shown). This needs a leveled hand-authored villain action with a cost; the corpus has 0 features with both cost and `ability_type`.
2. **SC-284's narrow captures are not frozen.** `statblock-narrow` and `featureblock-narrow` are not in the shared baseline, so their print bytes (changed here) are unguarded. That is a widening decision for the owner, not for this branch.
3. **`usageLabelOf` matches substrings of the whole string, including a link's URL,** as the site's `actionInfo` does. No corpus usage URL trips it (the usage URLs are `rule.combat/turn|triggered-action|free-maneuver`).
4. **Coverage.** The parity pairs still cover only names. Usage and kind-noun parity rest on this r9/r11 entity comparison and the jest pins, not the parity gate.
5. **Tests I did not re-run:** lifecycle. The implementer reports 19/19, and the round-10 delta touches no lifecycle-relevant path (render slots, the snapshot trim, help text).

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r11-rereview-report.md`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r11-evidence/r11-heads-print-develop-vs-head.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r11-evidence/logs/`:
  - comparison: `cmp.txt`, `site-heads.json`, `plugin-heads-head.json`, `meta-head.json`
  - probes: `snapfid.log`, `synth-head.json`
  - freeze: `freeze.log`, `failed.txt`, `hash.txt`, `changed-since-r9.txt`
  - gates: `shots.log`, `jest.log`, `parity.log`
  - mutations: `mut-*.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r11-evidence/scripts/`: `rdlink.mjs`, `mutate.sh`, `mut2.py`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r11-evidence/synth/`: `f8.md`, `s2.md`

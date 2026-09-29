# SC-232 round 8b — print-moving card-head slot fixes (W3 → W2, W7, W4, kit-signature parent kit, "Signature" wording)

Same worktree, branch, rules, and return contract as round 8a
(`.../sc232-cardname-scale/sc232-brief-r8a-slots-neutral.md` — re-read its "Rules"). Workers
never call Linear. Start by reading `decisions.md` ("Owner rulings, round 7" binds this round)
and the survey `sc232-r7-slot-survey-report.md` §1 and §3 rows W2, W3, W4, W7, W1 (kit-signature
note), plus your own `sc232-r8a-report.md`. `git fetch origin`; if `origin/develop` moved since
8a, rebase first and say so.

Owner ruling (verbatim from the ledger): "implement W1, W8, W5 (+ fixtures a1–a3) first
(print-neutral), then W3 → W2, W7, W4 and W1's inline-kit-signature parent-kit name
(print-moving), each item its own commit(s) so any one can be dropped. 'Signature Ability' ->
'Signature' normalization: include as its own commit (its ids are a subset of W4's 27
statblock ids, so it adds no lines once W4 is in)." And: "Print-moving items ship ONE combined
`rebaseline.txt` (final-state hashes) + a per-item map of which ids each item moves +
before/after crops per item. No baseline edit without Scott's written sanction."

## Items (one commit each, tests with each, in this order)

1. **W3 right-rail remap for features** (survey §3 W3): standalone feature cost → right-primary
   mini; "Signature" fallback when `subtype: signature`; `ability_type` → right-primary when no
   cost; statblock sub-feature parenthetical → right-primary chip (keep the ORIGINAL wording
   here — normalization is item 6). Move the forged-pill CSS and simplify SC-101's featureblock
   re-lane as the survey says. Check SC-284's narrow re-placement arms (rows 4–6) still place
   the right rail correctly under 480px — measure.
2. **W2 level chip**: right-eyebrow "Level N" from `metadata.level` (or `scc` `level-N`).
3. **W7 usage chip**: standalone feature + kit signature right-deck = `usage`; drop the
   duplicated meta "Type" chip in SC-231's rewritten meta band (landed) — read SC-231's code
   first; don't undo its keyword-chip work.
4. **W4 statblock kind-noun + keywords**: `statblock/view.ts` `statblockHeaderParts`:
   left-eyebrow = kind-noun from `metadata.scc` (port `statblockKindNoun`; fallback "Monster");
   left-deck = keywords. The sticky mini-header shares these parts — check it. Statblock fixture
   gains `metadata.scc` (a3) only if needed to exercise the kind-noun.
5. **W1b kit signature parent-kit name**: the inline kit signature's left-deck carries the
   parent kit's name when `metadata.kit` is absent (`layouts.ts` per survey).
6. **"Signature Ability" → "Signature"** normalization on statblock sub-features.

## Freeze deliverables (the heart of this round)

- After ALL items, run shots twice (two separate full runs) and confirm every changed frozen
  PNG hashes identically across both runs (determinism).
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline.txt`:
  `<sha256>  <filename>` lines for every frozen file whose bytes changed, final state, same
  format as `freeze-baseline.sha256`. Never edit the shared baseline itself.
- `rebaseline-map.md`: for each item, the frozen ids it moves (derive by measuring: rebuild with
  each item reverted in a scratch clone, or by DOM diff per item — state the method). Cross-check
  every id in `rebaseline.txt` is explained by at least one item, and every "before" hash is
  the current baseline's line (so nothing unrelated slipped in).
- Freeze gate result at your head: the only FAILED lines must be exactly the `rebaseline.txt`
  set; with `rebaseline.txt` substituted into a SCRATCH copy of the baseline (your scratch
  path, not the shared file), `check-freeze.sh` against that copy must read 260/260 (+ any
  widening lines for new fixture ids from 8a).

## Evidence (no commit) — `.../sc232-cardname-scale/r8-evidence/`

- `sc232-slots-print-screen.png`: per item, the representative head — **Before (develop)** |
  **This branch** | **Site**, 1 image px = 1 CSS px, head crops only, text labels, no
  color-coding. Rows: ability card with cost, kit signature (usage + parent kit + Signature),
  statblock head (kind-noun + keywords), statblock sub-feature ("Signature"), a Level-N ability.
- `sc232-print-before-after.png`: print (steel-print) crops, before | after, for one
  representative id per item (4–6 rows), same scale, labelled with the capture id.
- Keep each composite ≤ ~2000px tall; split rather than downscale.

## Gates at the final head

tsc, lint clean; jest green (state base vs head); lifecycle 19/19 (own port); shots 0 FAIL;
freeze as above; parity 0 GAPs / 0 undeclared / 26 DECLARED (if a new pair or a remapped slot
changes a parity row, state exactly which and why).

## Report

`.../sc232-cardname-scale/sc232-r8b-report.md`, ≤10-line executive summary first (head sha,
per-item status + frozen lines moved, rebaseline line count, determinism check, gate numbers),
then detail, `Drive-by fixes:`, `Follow-ups:`. Final text: verdict, shas, numbers, artifact paths.

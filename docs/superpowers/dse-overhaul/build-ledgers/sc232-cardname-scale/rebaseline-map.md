# SC-232 rebaseline map — round 8b base + round 10 fix attribution

**Updated round 10b (2026-09-27)** to add the round 10 fix round's own attribution (a new
final section below) on top of round 8b's unchanged items 1-5. The id/line-count total is
UNCHANGED (78 lines / 39 ids) — round 10 fix changed BYTES on most of those same 39 ids,
it did not add or remove any id. `rebaseline.txt` (this directory) still holds exactly one
current hash per line; it was independently re-verified at dse head `f3085d5` (round 10
fix's final head) in this update: two full `npm run shots` runs byte-identical, the
`check-freeze.sh` FAILED set exactly equals `rebaseline.txt`'s 78 filenames (sorted-diff
empty both directions), every one of `rebaseline.txt`'s 78 hashes equals the corresponding
file's real sha256 at this head, and a scratch copy of the shared baseline with these 78
lines substituted in reads `freeze OK (260/260)`. No regeneration of `rebaseline.txt` was
needed — the round-10 worker's own 20:18 write already matched this head byte-for-byte.

## Round 8b's own method and items 1-5 (unchanged by this update)

**Method (measured, not assumed):** built a detached scratch worktree at each of the
round's 3 commits (`ef4e1ff` = items 1+2+3+6 combined; `b68e97f` = item 4 (W4); `fa9addc`
= item 5 (W1b), the final head), ran the full `npm run shots` sweep at each, and diffed
the `sha256sum` of every one of the 78 frozen lines between consecutive stages. A line
that changes bytes between stage N-1 and stage N is attributed to whatever landed in
stage N. This is a real measurement (three full shots sweeps + pairwise hash diffs), not
inferred from reading the code.

**Total: 78 lines, 39 distinct ids** (every id counted once per twin+realprint pair).
`rebaseline.txt` (this directory) is the final-state hash for every one of them,
determinism-checked across two independent full `npm run shots` runs at the final head
(byte-identical, `diff` empty) and cross-checked against a scratch copy of the shared
baseline with these 78 lines substituted in — `sha256sum -c` on that scratch copy against
the final head's shots reads **exit 0, 0 mismatches** (all 260 lines), confirming every
changed byte is accounted for and nothing else leaked.

**Not a clean partition.** Nearly every id is touched by more than one item — expected,
since items 1-3 (W3/W2/W7) change every NESTED sub-feature's right-rail slots (inside every
statblock, featureblock and kit fixture that has one), while item 4 (W4) separately changes
the STATBLOCK'S OWN head bytes (kind-noun + keywords) on the exact same frozen captures.
"Item X moves id Y" below means X's own landing measurably changed Y's bytes — not that X
is the only cause.

## Items 1+2+3+6 (W3, W2, W7, Signature normalization — commit `ef4e1ff`)

Moves all 78 lines / 39 ids (measured against `origin/develop` `5a20d5f`, before any round
8b commit). 15 of the 39 ids are touched ONLY by this commit (item 4 makes no further byte
change to them; item 5 makes no further byte change to anything, see below):

`chrome-collapsed-rollout`, `chrome-hover-card`, `feature`, `feature-collapsed`,
`feature-list`, `feature-spend`, `featureblock`, `featureblock-featstyle-flat`,
`featureblock-stats`, `featureblock-stats-ledger`, `kit`, `kit-collapsed`,
`statblock-sticky`, `statblock-sticky-nometa`, `statblock-sticky-off`.

The other 24 ids (every other statblock-family id, plus three chrome compositions that
embed a statblock) are ALSO touched by this commit (their nested sub-features' cost/
ability_type/usage relocate the same way) — see item 4 below for the same ids' second,
independent change.

Cause, by sub-item (all in `renderFeature.ts`'s one cardHead-building block + its CSS):
- **W3** (cost/"Signature" fallback/ability_type → the ONE right-primary slot, forged-pill
  CSS retargeted): every id whose head or a nested sub-feature carries a cost or
  ability_type — `feature*`, `kit*`, `featureblock*`, every `statblock*` (their nested
  sub-features almost always carry one or the other).
- **W2** (right-eyebrow "Level N"): no frozen fixture carries `metadata.level` — 0 lines
  from this sub-item alone (confirmed: every moved id's cause traces to W3/W7/item 6, not
  a new Level chip appearing anywhere in the frozen corpus).
- **W7** (usage → right-deck, Type meta chip dropped for standalone/kit-signature): `kit`,
  `kit-collapsed` (the signature ability's own usage chip + a dropped Type chip),
  `chrome-hover-card`/`chrome-collapsed-rollout` (compositions containing a feature/kit
  card with `usage` set).
- **Item 6** ("Signature Ability" -> "Signature"): folded into W3's own `rightPrimaryOf` —
  every statblock id whose nested sub-feature's `ability_type` is literally "Signature
  Ability" in the frozen fixture (verified live in the DOM-text check below) moves for
  this reason too, inseparably from W3's own move of the same node.

## Item 4 (W4, statblock kind-noun + keywords — commit `b68e97f`)

Moves 24 ids (measured: stage-`ef4e1ff` vs stage-`b68e97f` hash diff), **no new ids beyond
the 39 above** — every one of these 24 was already moved by items 1-3+6 for the nested
sub-feature reason above; this commit ADDITIONALLY changes the statblock's own head
(left-eyebrow keywords -> kind-noun, keywords -> left-deck):

`chrome-collapsed-trio`, `chrome-hover-statblock`, `chrome-placement-trio`, `statblock`,
`statblock-charbox-on`, `statblock-charbox-onword`, `statblock-charline-two`,
`statblock-collapsed`, `statblock-columns-wide`, `statblock-disttarget-ledger`,
`statblock-disttarget-text`, `statblock-edit-btn`, `statblock-featstyle-flat`,
`statblock-kwusage-grid`, `statblock-kwusage-ledger`, `statblock-kwusage-text`,
`statblock-roleless-corpus`, `statblock-stats-gridc`, `statblock-stats-ledger`,
`statblock-sticky-narrow`, `statblock-sticky-unscrolled`, `statblock-villain-banded`,
`statblock-villain-corpus`, `statblock-with-captain`.

(`statblock-sticky`/`-nometa`/`-off` do NOT move for this item — the sticky mini-header
never surfaces left-eyebrow/left-deck at all, confirmed in round 8b's own commit message
and unaffected here; `-narrow`/`-unscrolled` DO move because those two captures show the
full card's own head above/beside the sticky bar, not just the bar.)

## Item 5 (W1b, kit signature parent-kit name — commit `fa9addc`, final head)

**Moves 0 lines — print-neutral, measured.** Stage-`b68e97f` vs the final head's hashes
are byte-IDENTICAL for all 78 lines (`diff` empty). Cause: the cardHead left-deck slot
(where the parent kit's name now falls back to) is Legacy-hidden and Steel **screen-only**
revealed by design (`styles-source.css`'s `.dse-feature .dse-head__deck--left` rule,
SC-232 round 8a W1) — `:not([data-dse-print="on"])` gates the reveal, so print never shows
ANY left-deck content, regardless of source (metadata-derived or this item's fallback).
This is the same reason round 8a's W1 itself measured 0 frozen print lines. The survey's
own estimate for this sub-item ("8 lines: kit, kit-collapsed, chrome-hover-card,
chrome-collapsed-rollout" — r7 survey §3, W1's frozen-print column) predates round 8a's
final CSS design and undercounts this: those 4 ids DO move, but for W3/W7's reasons
(commit `ef4e1ff`), not W1b's.

## Cross-check (round 8b, still valid)

Every filename in `rebaseline.txt` is one of the 39 ids named above (78 = 39 × 2).
Every "before" hash implicit in this map (the state before `ef4e1ff`) is the CURRENT
shared `freeze-baseline.sha256`'s own line for that name — verified mechanically: the
scratch-copy substitution above only replaces lines whose name already existed in the
shared baseline (0 unmatched names), and the post-substitution scratch copy reads
`sha256sum -c --quiet` exit 0 against the final head's own shots.

## Round 10 fix (r9 independent review HIGH-1, LOW-2, LOW-3 — commit `6f19b8b`)

**Method (measured, not assumed, round 10b):** a detached scratch worktree already existed
at `fa9addc` (round 8b's final head, i.e. immediately before any round-10 commit) with its
own `npm run shots` output already on disk. A fresh `npm run shots` sweep was run at the
current head (`f3085d5`, after all four round-10 commits: `6f19b8b`, `31f54d8`, `e1705ba`,
`f3085d5`). Every one of `rebaseline.txt`'s 78 filenames' sha256 was compared between the
two directories (a real byte diff of real shots output, not inferred from reading the
code).

**35 of the 39 ids changed bytes; 4 did not.** The 4 unchanged: `featureblock`,
`featureblock-featstyle-flat`, `featureblock-stats`, `featureblock-stats-ledger`. The 35
that moved:

`chrome-collapsed-rollout`, `chrome-collapsed-trio`, `chrome-hover-card`,
`chrome-hover-statblock`, `chrome-placement-trio`, `feature`, `feature-collapsed`,
`feature-list`, `feature-spend`, `kit`, `kit-collapsed`, `statblock`,
`statblock-charbox-on`, `statblock-charbox-onword`, `statblock-charline-two`,
`statblock-collapsed`, `statblock-columns-wide`, `statblock-disttarget-ledger`,
`statblock-disttarget-text`, `statblock-edit-btn`, `statblock-featstyle-flat`,
`statblock-kwusage-grid`, `statblock-kwusage-ledger`, `statblock-kwusage-text`,
`statblock-roleless-corpus`, `statblock-stats-gridc`, `statblock-stats-ledger`,
`statblock-sticky`, `statblock-sticky-narrow`, `statblock-sticky-nometa`,
`statblock-sticky-off`, `statblock-sticky-unscrolled`, `statblock-villain-banded`,
`statblock-villain-corpus`, `statblock-with-captain` (i.e. every one of the 39 EXCEPT the
4 featureblock ids above).

**Attribution to a single commit, not three separable sub-items — disclosed, same
convention as round 8b's own combined commit.** `6f19b8b` combines HIGH-1, LOW-2 and LOW-3
into one commit because, per that commit's own message, "all three edit the same ~20-line
cardHead-building block in `renderFeature.ts`." The other three round-10 commits are
measured print-neutral by construction, not just assumed:

- `31f54d8` (empty left-deck slot omitted for a keyword-less statblock) touches only
  `statblock/view.ts`'s left-deck slot, which is Legacy-hidden and Steel **screen-only**
  revealed (`:not([data-dse-print="on"])`, the same reveal gate that made round 8b's own
  W1b print-neutral) — print can never show it regardless of whether it's an empty span or
  omitted entirely. 0 real corpus statblocks are keyword-less; the only fixture this
  reaches is the harness's own `NO_FEATURES`, which isn't in the 39-id frozen set at all.
- `e1705ba` (MEDIUM-1, `compendiumInsert.ts` paste-snapshot fidelity) touches only the
  compendium search-modal's paste/insert DTO-trimming code path. **Verified unreachable
  from the frozen corpus by construction**: `grep -rn "trimSnapshotDTO|compendiumInsert"
  visual-harness/` returns 0 hits — nothing in the shots harness's render path calls this
  module at all, so it cannot move a single frozen byte.
- `f3085d5` (MEDIUM-2 correction, LOW-4, LOW-5) is comment/doc/help-text/CHANGELOG only —
  confirmed by reading its diff to `src/elements/display/layouts.ts` and
  `src/elements/feature/renderFeature.ts`: every changed line is inside a `/* ... */` or
  `//` comment block; `src/prefs/catalog.ts`'s one changed line is a settings help string,
  never read by the render path the shots harness exercises.

Since the fa9addc→head diff (which spans all four commits together) shows exactly the same
35-id set that `6f19b8b` alone would produce, and the other three commits are independently
proven unable to reach the frozen corpus, all 35 moved ids are attributed to `6f19b8b`.

**Per-cause detail (measured via the same DOM-verified capture used for this round's
evidence, `r8-evidence/dom-verified-text-print-screen.json`):**

- **LOW-2 (`usageLabelOf` canonical relabeling)** moves every id whose head or a nested
  sub-feature already had a right-deck usage chip under round 8b's W7/HIGH-1-buggy state
  AND whose raw `usage` value's canonical label differs in case/wording from the raw
  fixture text. Directly observed: `feature`/`kit*` (standalone/kit-signature — the
  opt-in `usageInHead` families) go from raw `"Main action"` to canonical `"Main Action"`
  (a real byte change — confirmed live: `ability-cost`/`kit-signature` rows in
  `sc232-print-before-after.png`). `level-ability` (Mark)'s raw usage `"Maneuver"` maps to
  the identical canonical string `"Maneuver"` (`usageLabelOf`'s own `a.includes('maneuver')
  → 'Maneuver'` branch) — a case where LOW-2 fires but produces byte-identical output,
  which is why `level-ability` was never in the 78-line rebaseline to begin with (it's a
  harness-only literal, not one of the 39 frozen ids).
- **HIGH-1 (usage-in-head opt-in restricted to standalone/kit-signature)** moves every
  `statblock*` id whose nested sub-feature(s) carry a `usage` field: round 8b's buggy state
  showed a spurious right-deck usage chip AND suppressed the meta "Type" cell on every such
  statblock ability; round 10's head shows no chip and restores the Type cell. Directly
  observed on the real `human-bandit-chief` fixture (used by 24 of the 39 ids, per round
  8b's own item-4 list, plus the `chrome-*` compositions that embed it): sub-feature "Whip
  and Magic Longsword" goes from `rightDeck: "Main action"` / `typeMetaCell: (missing)` to
  `rightDeck: null` / `typeMetaCell: "Main action"`; sub-feature "Kneel, Peasant!" (this
  round's own new evidence row) goes from `rightDeck: "Maneuver"` / `typeMetaCell:
  (missing)` to `rightDeck: null` / `typeMetaCell: "Maneuver"`. This is also why every
  `feature*`/`kit*` id is UNAFFECTED by HIGH-1 itself (only by LOW-2, above) — those
  families already had `usageInHead` correctly true both before and after; HIGH-1 only
  changes the STATBLOCK (and by extension chrome-composited) side of the gate.
- **LOW-3 (displaced `ability_type` falls back to the right-eyebrow)** fires only when a
  feature/sub-feature carries BOTH `cost` and `ability_type` in the same frozen fixture.
  No new right-eyebrow chip was observed on any of the 39 ids' DOM-verified captures this
  round (every eyebrow slot the evidence checked is unchanged or explained by LOW-2/HIGH-1
  above) — measured 0 additional lines attributable to LOW-3 alone on the real frozen
  corpus, the same "0 lines, confirmed" shape as round 8b's own W2 finding.
- **Why the 4 `featureblock*` ids are untouched:** a featureblock OPTION's `usageInHead` is
  not set (HIGH-1's opt-in is standalone-Feature-view and kit-signature-only, and
  `featureblock`'s own render path never sets it either before or after this round — see
  the round 10 `6f19b8b` commit message's "every other `renderFeatureList` caller
  (statblock sub-features, featureblock options) keeps today's meta Type cell"), so LOW-2's
  relabeling has no right-deck chip to touch on that path and HIGH-1 changes nothing for
  it; the frozen featureblock fixtures (`featureblock`, `-featstyle-flat`, `-stats`,
  `-stats-ledger`) carry no `cost`+`ability_type` pair either, so LOW-3 doesn't fire on
  them. Measured, not assumed: their hashes are byte-identical fa9addc→head (see the diff
  above).

**Not a clean partition, same disclosure as round 8b:** most `statblock*` ids move for BOTH
LOW-2-shaped and HIGH-1-shaped reasons on the SAME frozen fixture (e.g. `human-bandit-chief`
has both a `usage`-bearing sub-feature that used to show a chip (HIGH-1) — LOW-2 has no
further effect there since the chip is now gone entirely, not relabeled). "Round 10 fix
moves id Y" means the round's own landing measurably changed Y's bytes, via one or both of
LOW-2/HIGH-1 as detailed above — not that every sub-item independently touches it.

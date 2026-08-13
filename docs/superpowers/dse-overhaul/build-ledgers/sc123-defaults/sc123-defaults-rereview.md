# SC-123 — review of the two site-divergent statblock defaults flip

**Verdict: LAND.** The flip (`sbCharLine` `'one'`→`'two'`, `sbVillain` `'inline'`→`'banded'`)
is real end-to-end, matches the site's own `SB_DEFAULTS` exactly, the preset invariant is
genuinely enforced in both directions (proven with two independent scratch-mutations, not
just trusted), the retargeted guards still catch what they existed to catch, and the
rebaseline is exact — 18 names, 18 hashes, independently reproduced byte-for-byte, nothing
outside the statblock family moved. No findings.

Reviewer: independent, worktree `/home/scott/code/steelCompendium/worktrees/sc123-defaults`,
single commit `221acc9` on dse main `3a9242f`. No code modified in the worktree; two
throwaway scratch-mutation probes were run against a `/tmp` copy of the tree and discarded.
Worktree `git status` clean; superproject shows only the expected unstaged
`draw-steel-elements` pointer bump.

---

## Battery — reproduced independently at `221acc9`

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | 0 |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation warning) | 0 |
| `npx jest` | **2702 passed / 1 skipped / 2703 total, 165 passed suites (1 skipped) of 166, 3 snapshots** | 0 |
| `npm run shots` | **203 `ok` lines, 0 FAIL** | 0 |
| `check-freeze.sh <shots>` | **`FREEZE VIOLATED`, exactly the 18 named statblock lines, nothing else** | 1 (expected) |
| `npm run parity` (last) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`** | 0 |

Every number matches the implementer report's battery section exactly, including the
implementer's own correction of the assignment's quoted base commit (report measured the
real baseline at `3a9242f`, not the assignment's `4615db6`) — re-verified as accurate: `HEAD~1`
is `3a9242f` (`fix(statblock,steel): SC-146 round 2...`), and `4615db6` is its parent.

**Shared workspace state.** No `.pre-sc123-defaults*` backup exists (landing hasn't
happened), and this branch's diff touches nothing under `.superpowers/`. The shared
`freeze-baseline.sha256` at the main workspace checkout is 67 lines, containing exactly 18
`statblock*` lines — matching the report's stated pre-landing baseline size precisely.

---

## Probe 1 — the flip is real end-to-end: CONFIRMED

- **Site's own defaults.** `v2/docs/javascripts/settings-panel.js:30-33`'s `SB_DEFAULTS`
  reads `charline: "two", ... villain: "banded"` — matches the flip exactly.
- **jsdom + computed DOM check**, re-read from the shipped diff and independently confirmed
  passing in the full jest run: at default prefs, `.dse-sb__char` mounts three children
  (`dse-sb__char-box`/`-v`/`-l`, i.e. the site's split DOM) with `cell.textContent ===
  'M+2Might'`; the villain-corpus fixture mounts a real `.dse-sb__band.dse-sb__band--villain`
  with the three villain cards, and the main run keeps the five non-villain cards
  (`data-dse-act="villain"` absent from the main run, `data-dse-act="main"` present).
- **Non-default paths still work.** `sbCharLine:'one'` collapses back to one merged node,
  text verbatim `'Might +2'`; `sbVillain:'inline'` builds no band, one flat list, source
  order — both opt-in tests present and passing.
- **Real-browser confirmation.** `.superpowers/sdd/sc123/defaults/sc123-beforeafter.png`
  (eyeballed) shows exactly this: the AFTER card's characteristics rail is the stacked
  number-over-label form, and villain actions sit inside a headed "VILLAIN ACTIONS"
  collapsible band with a chevron — everything else on the card (header, stat blocks,
  immunity/weakness/movement, the signature ability) is pixel-identical between the two
  columns.

## Probe 2 — preset derivation: CONFIRMED, both directions independently broken and caught

- `deriveSbPreset(makeStore())` on a fresh (untouched) store derives `'steel'`, asserted
  directly in the shipped test — re-run, passing.
- **Scratch-mutation, direction 1** (`SB_PRESETS.steel.sbCharLine` reverted to `'one'` while
  the descriptor default stays `'two'`): re-ran `test/unit/prefs/catalog.test.ts` in
  isolation → **3 failed** (the new member-for-member invariant test, plus a second
  pre-existing preset-derivation test that also independently checks bundle-vs-default
  equality).
- **Scratch-mutation, direction 2** (reverted, then the descriptor's own `default:` for
  `sbVillain` changed to `'inline'` while `SB_PRESETS.steel` stays `'banded'`): re-ran the
  same suite → **4 failed** (one more than direction 1, because this mutation also moves the
  site-parity defaults test — expected collateral of the specific mutation chosen, not a
  guard weakness).
- Both directions of drift are genuinely caught, not merely asserted to be caught.

## Probe 3 — guard-narrowing honesty: judged, both narrowings hold

| Guard | Narrowing | Still catches its regression? |
|---|---|---|
| Content-loss tests (`NO content loss: ... bandit chief` / `... featureless fixture`) | Now explicitly render at `sbCharLine:'one'` | **Yes.** These compare against literal legacy strings (`"Might +2"`, `"Presence N/A"`) that only the merged cell produces — the split spells the same words as `M+2Might`, so pinning them to `'one'` keeps the comparison meaningful rather than making it always-pass-by-construction. The default shape's own no-content-loss claim is not silently dropped: it is asserted separately, per-part, in the characteristics DOM tests (box/value/label content, all five cells, formatting parity for negative/zero/missing). Nothing was quietly weakened — the assertion moved to where it is still literal. |
| "Mounts NO interactive controls" | Split into two tests: at defaults, "exactly one control, and it's the villain band's disclosure, not an editing affordance"; the absolute zero-controls form kept under `sbVillain:'inline'` | **Yes, on both counts.** The default-state test doesn't just count controls — it identifies the one it found by exact `className` (`dse-collapse__header`) and checks `aria-expanded` is present (a toggle attribute, not an input), so an accidental extra `<button>`/`<input>`/`<select>`/`<textarea>`/`[tabindex]` sneaking into the default card would still fail (`toHaveLength(1)` and/or the className check). The absolute form (`sbVillain:'inline'`) still asserts a hard zero, so the "this element never becomes interactive-by-accident" claim is preserved in full at the one config where it's actually still true. Neither test is vacuous. |

No guard in this diff was found to have become vacuous.

## Probe 4 — rebaseline file: VERIFIED byte-for-byte

- All 18 names in `rebaseline.txt` are a set-exact match against the 18 `statblock*` lines
  currently in the shared 67-line baseline (diffed — identical sets).
- Independently regenerated `npm run shots` from an emptied `shots/` dir; `check-freeze.sh`
  reported `FREEZE VIOLATED` with **exactly** the same 18 names, no more, no fewer (the other
  49 lines all read `: OK`).
- Re-hashed my own 18 regenerated PNGs and diffed against `rebaseline.txt` sorted the same
  way: **byte-for-byte identical** — the report's prepared hashes are not stale or
  hand-edited, they are exactly what this commit produces.
- Eyeballed three before/after crops: the composed `sc123-beforeafter.png` (villain-corpus,
  screen scale) plus two of my own independently regenerated print shots
  (`statblock-with-captain--steel-print.png`, `statblock-roleless-corpus--steel-print.png`).
  All three show precisely the characteristics-rail restack and the villain-action banding
  (where villain actions exist) and nothing else — headers, stat grids,
  immunity/weakness/movement text, ability cards, the roleless fixture's Champion band
  layout, all pixel-identical to what the two-pref change alone would produce. The
  roleless-corpus fixture confirms the report's own explanation for its presence in the
  18: it has no villain actions (no band appears) and moved solely because the chars rail
  split.

## Probe 5 — battery: table above, all numbers match exactly, including the correct freeze
exit code (1, with precisely 18 names) rather than a false green.

## Probe 6 — collateral / CHANGELOG: clean

Full diffstat (10 files, +158/-64 plus 5 binary PNGs) reviewed: `CHANGELOG.md` (one accurate
entry, prose matches the shipped behavior exactly — old/new labels, preset consequence, and
correctly notes this lands pre-7.0.0 because it changes existing render output; minor
stylistic note, not a finding: it carries no `[BREAKING]`/`[STEEL]` bracket tag the way six
other genuinely-breaking entries do, though `feat(prefs)!:` is a breaking-change commit — a
cosmetic default flip with a toggle back is arguably closer to the many untagged/`[STEEL]`
look-and-feel entries already in this file than to the `[BREAKING]` set, which is reserved
for structural/schema/compatibility breaks; not blocking), `src/prefs/catalog.ts` (the four
functional lines plus rewritten prose, matches §1 of the report exactly), the three test
files (all reviewed in probes 1-3 above), and the 5 docs PNGs — exactly the
`docs-shots`-regenerated statblock-bearing set the report claims (`settings-statblock.png`,
`statblock.png`, `statblock-side-by-side.png`, `tutorial-print-preview.png`,
`tutorial-reading-mode.png`), no others. No collateral changes found anywhere in the diff.

---

## Recommendation

**LAND.** Every claim in the implementer report was independently reproduced rather than
trusted: the battery numbers match exactly, the freeze delta is the exact 18 lines with
byte-identical after-hashes, the preset invariant genuinely fails in both drift directions
(proven, not asserted), the narrowed guards still catch what they existed to catch, and the
visual diff is confirmed — by eye, across three separate crops — to be exactly the two
reshapes and nothing else. No findings block this from landing.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc123/sc123-defaults-rereview.md`

# SC-123 — flip the two site-divergent statblock defaults: report

**Status:** complete, unlanded. Branch `sc123-defaults`, worktree
`/home/scott/code/steelCompendium/worktrees/sc123-defaults`.
**Commit:** `221acc9` — `feat(prefs)!: default characteristics and villain actions to the site's shapes (SC-123)`.
Superproject pointer left unstaged. Shared freeze baseline **not touched**.

**Base note:** the assignment named `4615db6`, but the worktree's HEAD is **`3a9242f`**
(`4615db6` is its parent — an SC-146 round-2 fix landed in between). I measured the real
baseline at HEAD rather than trusting the quoted numbers, per the dse-verify standing rule.
The only difference is jest: **2698 + 1 skipped / 165 suites** at `3a9242f`, not 2695.
Everything else matched the quoted baseline exactly (shots 203, freeze 67/67, parity 0/0/16).

**Sanction basis:** Scott's ruling on SC-123, 2026-08-12 — *"Again, nobody has this code
yet. We dont have to worry about breaking anyone. Lets do the correct thing."*

---

## 1. What changed

`src/prefs/catalog.ts`, four functional lines (the rest of the diff is comments):

| Pref | Was | Now | Site's value |
|---|---|---|---|
| `sbCharLine` | `'one'` | **`'two'`** | `two` ✅ |
| `sbVillain` | `'inline'` | **`'banded'`** | `banded` ✅ |
| `SB_PRESETS.steel.sbCharLine` | `'one'` | **`'two'`** | — |
| `SB_PRESETS.steel.sbVillain` | `'inline'` | **`'banded'`** | — |

**Verified, not assumed:** `sbCharBox` is `'off'` and `distTarget` is `'grid'`, and both
already match the site's own `SB_DEFAULTS` (settings-panel.js:31-33). `distTarget` in
particular is the one the SC-146 audit's S8 row misread as `text`; the SC-123 fix round's
M-4 corrected that, and this branch does not disturb it. **After this change no default in
the statblock group diverges from the site.**

The two prose blocks that argued *for* the divergence (the `DsePrefs` type comment and the
`SB_PRESETS` header) are rewritten to record the ruling instead, and both help strings move
"— the default —" onto the new value.

### The preset invariant, made explicit

`SB_PRESETS.steel` had to move with the defaults, and the reason is worth stating because it
is invisible at a glance: the preset label is **derived, never stored** (`deriveSbPreset`).
If the bundle and the defaults disagree by even one member, a fresh install matches no bundle
and opens its dropdown reading **"Custom"** — a state the user never chose, with nothing
failing anywhere. Before this ticket the two disagreed *deliberately* and `steel` was defined
as "the plugin's home look"; now they are the same thing, so the agreement is a real
invariant. A new test pins it in both directions (same key set, same value per key) plus the
consequence itself (`deriveSbPreset(makeStore()) === 'steel'`).

## 2. Conditional DOM — guards retargeted, not deleted

`'two'` and `'banded'` are now the DEFAULT build paths in `statblock/view.ts`
(`charsAreSplit()` / `renderFeatures()`). The "default output preservation" guards that
pinned the *old* shapes are obsolete as written, so each was retargeted to pin the new
default, with the old shape kept under an explicit opt-in in reverse:

| Guard | Before | After |
|---|---|---|
| chars at defaults | one merged text node | **split `box/value/label`**, `M+2Might` |
| chars, opt-in | `sbCharLine:'two'` splits | **new:** `sbCharLine:'one'` collapses back to `Might +2` |
| chars remount round trip | default → boxed → back to merged | **default (split) → `'one'` → back to split** |
| villain at defaults | no band, one flat list | **band present**, main run keeps the non-villain features |
| villain, opt-in | `'banded'` builds the band | **new:** `'inline'` builds no band |
| feature list | 8 cards in one list | **5 in the main run + 3 in the band**, all 8 named, source order |

Two consequences I did **not** paper over:

- **The content-loss tests now run at `sbCharLine:'one'` explicitly.** They compare against
  the legacy view tree's output as verbatim strings (`"Might +2"`, `"Presence N/A"`), which
  only the merged cell produces — the split spells the same words as `M+2Might`. Pinning
  them keeps the comparison literal; the default shape's own no-loss claim is asserted
  per-part in the characteristics tests instead of being quietly dropped.
- **The statblock is no longer control-free at defaults.** The band is a real
  `collapsible()`, so the default card now ships one disclosure button. Rather than delete
  the "mounts NO interactive controls" guard, it is narrowed to what is still true — never
  writes back, exactly one control, and that control is a disclosure (`aria-expanded`), not
  an input — and the absolute no-controls form is kept in a second test under
  `sbVillain:'inline'`.

`perBlock: false` warn-and-ignore semantics are untouched; the three conditional-DOM keys
are still global-only and `pref-overrides.test.ts` needed no change.

## 3. Freeze impact — 18 of 67 lines

Measured, not predicted. `npm run shots` before and after, both from an emptied `shots/`.

**Exactly 18 frozen lines move. Every one is statblock-family, and every statblock-family
line in the baseline is in the list — 18 of 18. Nothing outside the family moves.** That is
precisely the blast radius two statblock-only prefs should have, and the cross-check runs
both ways (no statblock line survived unchanged; no non-statblock line changed).

```
statblock--steel-print.png
statblock-charbox-on--steel-print.png
statblock-charbox-onword--steel-print.png
statblock-charline-two--steel-print.png
statblock-columns-wide--steel-print.png
statblock-disttarget-ledger--steel-print.png
statblock-disttarget-text--steel-print.png
statblock-edit-btn--steel-print.png
statblock-featstyle-flat--steel-print.png
statblock-kwusage-grid--steel-print.png
statblock-kwusage-ledger--steel-print.png
statblock-kwusage-text--steel-print.png
statblock-roleless-corpus--steel-print.png
statblock-stats-gridc--steel-print.png
statblock-stats-ledger--steel-print.png
statblock-villain-banded--steel-print.png
statblock-villain-corpus--steel-print.png
statblock-with-captain--steel-print.png
```

Three of those look surprising until you see why, and each is a *confirmation* rather than a
worry:

- **`statblock-charline-two`** already pins `sbCharLine: two`, so the chars rail did not
  move — it moved because it inherits the *other* new default and now bands its villains.
  **`statblock-villain-banded`** is the mirror case.
- **`statblock-roleless-corpus`** has no villain actions at all, so only the chars split
  moved it — which is why it is in the list rather than absent.
- The `kwusage-*` / `disttarget-*` / `stats-*` / `featstyle-*` / `columns-wide` / `edit-btn`
  variants each pin one unrelated pref and inherit both new defaults.

**Ready-to-apply hashes:**
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc123/defaults/rebaseline.txt`
(18 lines). Verified before writing:

- all 18 names already exist in the baseline → this is a **rebaseline, not a widening**;
- all 18 hashes genuinely differ from the baseline's (no no-op lines padding the list);
- baseline size after replacement is **still 67**;
- **deterministic**: two independent `npm run shots` runs produced the same 18 names and the
  same hashes (`sha256sum -c rebaseline.txt` → 0 non-OK lines on the second run).

**Nothing else could have caused the movement.** `git diff --stat` over `src/`,
`styles-source.css` and `visual-harness/` shows one file changed — `catalog.ts` — and its
only non-comment hunks are the four lines in §1.

### Before / after

`.superpowers/sdd/sc123/defaults/` also holds the composed before/after
(`sc123-beforeafter.png`, the villain-corpus card at screen scale). In prose, since the
frozen shots are print captures and hue carries nothing here:

- **Characteristics rail.** Before: five cells each reading as one line, `Might +2`,
  `Agility +3`, …. After: the number sits alone on the first line at a larger size with the
  name beneath it in small caps — same five cells, same order, same values, restacked.
- **Villain actions.** Before: `Shoot!`, `Form Up!` and `Lead From the Front` sat in the main
  feature run in source order, indistinguishable in structure from the other cards. After:
  they are lifted into one framed region below the rest, headed by a disclosure row with a
  chevron, a skull crest and the words "Villain Actions". The main run keeps every
  non-villain feature and loses none. Print and export render the band open.

## 4. Docs screenshots

`npm run docs-shots` on an isolated **Xvfb display `:131`** (`:1` never touched; `:99`/`:100`
avoided). Of the 17 regenerated images, **five changed — all statblock-bearing**:

```
docs/Media/settings-statblock.png
docs/Media/statblock.png
docs/Media/statblock-side-by-side.png
docs/Media/tutorial-print-preview.png
docs/Media/tutorial-reading-mode.png
```

The other 12 came back byte-identical. Spot-checked `statblock.png`: it now shows the stacked
rail and the Villain Actions band with all three villain actions inside.

## 5. Battery (verbatim, at `221acc9`)

```
npm run tsc     → clean, exit 0
npm run lint    → clean, exit 0
npx jest        → Test Suites: 1 skipped, 165 passed, 165 of 166 total
                  Tests:       1 skipped, 2702 passed, 2703 total
                  Snapshots:   3 passed, 3 total
npm run shots   → 203 PNGs, 0 FAIL, exit 0
check-freeze.sh → FREEZE VIOLATED, exit 1 — exactly the 18 enumerated lines, nothing else
npm run parity  → **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**, exit 0
npm run docs-shots → 17 images written, exit 0 (Xvfb :131)
```

Against the measured baseline at `3a9242f`: jest 2698 → **2702 (+4)** — the four new tests
(the preset invariant, `sbCharLine:'one'`, `sbVillain:'inline'`, and the no-controls form);
shots **203, unchanged** (no fixture added); parity **0/0/16, unchanged**; freeze **18
expected mismatches** and no others.

### Parity, precisely

**No delta, and no deferral healed.** The declared set is byte-identical to main's: 8 entries
/ 16 rows, FOLLOWUPS #39 (statblock-wrap + featureblock-wrap block margins ×8), #51
(section-tag type scale ×6), #40 (pr-chars ink ×2). None of the 16 concerns the
characteristics rail or villain placement, so moving those toward the site could not close
any of them — the gate maps neither surface. Worth stating plainly rather than implying good
news: this change makes the plugin look more like the site, but **the parity gate did not
measure that improvement**, because no mapped selector pair covers either surface. No new gap
or undeclared warning appeared either, which is the part the gate *can* attest.

## 6. Landing steps for the orchestrator

1. `cp freeze-baseline.sha256 freeze-baseline.sha256.pre-sc123-defaults-bak` (keep forever).
2. Replace the 18 named lines with those in `sc123/defaults/rebaseline.txt`. Count stays 67;
   `diff` against the backup should show exactly 18 changed lines and no additions/removals.
3. Re-run `check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots` → expect
   `freeze OK (67/67 steel-print PNGs byte-identical)`, exit 0.
4. Record the dated sanction in the `dse-verify` skill under "Sanctioned rebaselines",
   citing Scott's 2026-08-12 SC-123 comment and this report.

## 7. Concern

**The `steel` preset and the descriptor defaults are now required to be identical, and only
one test knows it.** Before this change they were deliberately different, so the pair could
drift freely; now any future default change silently breaks preset derivation — a fresh
install would open reading "Custom" with every gate green, because nothing else observes the
relationship. I added a two-directional test and wrote the reasoning into the `SB_PRESETS`
comment, which is the best available guard, but it is a convention enforced in one place
rather than a structural impossibility. The structural fix — deriving `SB_PRESETS.steel` from
the descriptor defaults instead of restating them — is a small refactor I deliberately did
not make here, because it changes a shared exported constant's shape and this branch's job is
a two-value flip with a measured freeze delta. Worth its own ticket if the pair ever drifts
once.

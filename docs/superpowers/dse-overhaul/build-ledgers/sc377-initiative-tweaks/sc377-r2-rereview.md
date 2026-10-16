# SC-377 R2: scoped re-review (dse `e9174e1..309894a`)

## Executive summary

- **VERDICT: PASS-WITH-FIXES. LAND-READY: NO, one fix needed first.** The tip is `309894a` (verified). The battery reproduces every claim.
- **INFO-R1 is closed for one-line titles.** Rest / editing / committed are identical (0.000px). Harness: 28.063 / 65.000 / 118.391 in all 3 phases, named and unnamed, dark and light. Real Obsidian 1.14.4: 0.000px in 8 of 8 cases (theme × Reading view/Live Preview × named/unnamed).
- `assertTitleLineStable` is not vacuous: fed the e9174e1 CSS, it fails 12 checks. The jest edits replace an obsolete contract; they do not weaken anything.
- **NEW-MEDIUM-R2: the implementer's "known limit" is not an edge case.** In a sidebar-width tracker, any title that wraps still jumps on open and on save. That includes the plugin's own example name, "The Ford of Bruinen" (19 characters).
  - Harness at 300px: every name of 19 characters or more jumps 28px per wrapped line (84px for the 53-character fixture).
  - Real Obsidian, 280px-wide tracker: 56.13 → 28.06 → 56.13.
  - Nothing is clipped or lost: the full value is in the input and scrolls horizontally.
  - This is exactly the shift Scott asked to have evened out, and in the tracker's main sidebar use. Fix it now (small fix below).
- Rest look:
  - Named trackers: pixel-identical to `e9174e1` in every unfrozen steel-dark/light shot.
  - Unnamed trackers: 18 ids × 2 schemes changed. The only change is that the prompt sits in a title-height line, so the card is about 15.7 CSS px taller (the report says ~12). The approved look is kept.
- Battery: tsc/lint clean; jest 4273/1 ×3; lifecycle 25/25; shots 556/0 FAIL, title line stable OK (8), turn mark parity OK (20), all host-leak sweeps OK; freeze 38 `initiative*` mismatches with 44/44 hashes unchanged; parity 0/0/24.

## Findings

**NEW-MEDIUM-R2: a wrapped title still jumps when it is opened and saved, and at sidebar width ordinary names wrap.** `styles-source.css` `.dse-init__title-input` (`height: 1.2em`) + `src/elements/initiative/view.ts` `buildTitle`

- Defect: the editor is a one-line input exactly one h2 line tall. A heading that wraps onto N lines collapses to 1 line while editing and expands again on commit. Everything below jumps by (N−1) × 28.06px each time.
- Harness, named fixture at three widths (`sc377-r2rev-wrap-lengths.mjs`), rest height → editing height:

  | width | name length | rest → editing |
  |---|---|---|
  | 300px | 13 characters | 28 → 28 |
  | 300px | 18 characters | 28 → 28 |
  | 300px | 19 characters ("The Ford of Bruinen", the shipped example) | 56 → 28 |
  | 300px | 25 / 31 characters | 56 → 28 |
  | 300px | 53 characters | 112 → 28 |
  | 400px | 31 characters | 56 → 28 |
  | main | all | no shift |

- Real Obsidian, sidebars collapsed, window 400px (tracker 280px wide), "The Ford of Bruinen": title 56.13 → 28.06 → 56.13, Heroes line 98.47 → 70.41 → 98.47. At window 460px (tracker 340px) there is no shift.
- Why this cannot ship as a "known limit":
  - The 300px sidebar is the tracker's canonical play-time placement ("Keep it visible while you play").
  - The shipped example name triggers it.
  - Scott's only remaining ask was "I want the shift evened out when saving a title", and he will not review again.
- Not affected: content. The full text is in the input (scrollWidth 628 vs clientWidth 232), End shows its tail, Enter commits it unchanged, and nothing is clipped from the saved name. Evidence: `sc377-r2rev-wrap300-*`.
- Fix (small, pick one):
  - (a) Preferred, minimal: at `startEdit` set `heading.style.minHeight = heading.getBoundingClientRect().height + 'px'` before swapping in the input, and clear it in `finish()`. Opening no longer moves anything. Saving an unchanged or same-length name moves nothing. A save only moves the content if the new name genuinely needs a different number of lines.
  - (b) Use an auto-height `<textarea>` (rows = wrapped lines, Enter commits). This shows the wrapped name while editing.
  - Then extend `assertTitleLineStable` with a 300px `named` case (the `initiative-named-narrow` shape), so the gate covers wrapping.

**INFO-R2a: report inaccuracy.** An unnamed tracker grows about 15.7 CSS px, not "about 12". That is the heading +11.75 plus the em-based `margin-bottom: 0.4em` growing with the h2 size; 30–32 device px at 2× in all 36 changed shots.

**INFO-R2b: magic number.** `calc(var(--dse-fs-label) / 1.462 / var(--dse-fs-large-scale))` hard-codes the h2's em factor. It measures exactly 13.6px (= label) today in the harness and in real Obsidian, but it silently drifts if the h2 size token changes. A comment documents it. Optional: a computed check in the new gate that the prompt `::before` font-size equals the label size.

## Verification

1. **Shift, one-line titles.**
   - Harness `measureTitleLine` (from shoot.mjs) at main width: dark/light × named/unnamed, rest = editing = committed = 28.063 / 65.000 / 118.391.
   - Real Obsidian (`F-R2`, own Xvfb `:160` / CDP 9291), obsidian and moonstone × Reading view/Live Preview × named/unnamed:
     - title height 28.063 in every phase;
     - Heroes line +70.406 from the root top in every phase, so dEdit = dCommit = 0;
     - prompt `::before` 13.6px;
     - input 28.063px at 23.392px font.
2. **Rest look.** My own full shots run at `e9174e1` (scratch worktree) compared against `309894a`: 36 of 280 unfrozen screen PNGs changed. They are all unnamed-fixture `initiative*` ids plus `chrome-initiative-menu`, in both schemes:
   - `chrome-initiative-menu`
   - `initiative-captain-bonus`, `-cell-selected`, `-controls`, `-controls-narrow`
   - `initiative-fight`, `-fight-500`, `-fight-narrow`
   - `initiative-log-open`, `-mark-seal`
   - `initiative-no-images`, `-no-images-narrow`
   - `initiative-portraits-off`
   - `initiative-roster`, `-roster-500`, `-roster-narrow`
   - `initiative-squads`, `-squads-500`

   Each grew 30–32 device px in height. The named ids (`initiative`, `initiative-narrow`, `initiative-named`, `initiative-named-narrow`) are byte-identical. Side by side (`sc377-r2rev-unnamed-rest-before-after-steel-{dark,light}.png`), the prompt is unchanged (same small caps, same size, same position). Only the gap under it grows; the cards below are identical. A strict pixel shift-diff is noisy because the card's background hatch is anchored to the taller box, so the judgment is visual plus the CSS diff, which touches only the title block. The approved look is kept. All print bytes are identical.
3. **Known limit.** See NEW-MEDIUM-R2.
4. **Gate and tests.**
   - shoot.mjs's own `measureTitleLine` + `assertTitleLineStable`, run with `dist/harness.css` swapped for the `e9174e1` build at runtime (tree untouched), print `TITLE LINE SHIFT`: named +6.656 while editing; unnamed +22.313 while editing and +15.656 committed; both schemes; 12 problems. On the shipped CSS the gate prints OK.
   - The jest change swaps an obsolete contract (the `:has()` selector, now gone) for "no rule sizes the empty heading itself" plus "input is display:block / 1.2em". That is not a weakening, and the computed proof lives in the gate.
5. **Battery at `309894a`.**
   - `npm run tsc` / `npm run lint`: clean.
   - `npx jest` ×3: `Tests: 1 skipped, 4273 passed, 4274 total`, `Test Suites: 1 skipped, 213 passed, 213 of 214 total`, all green (no SC-383 red).
   - Lifecycle: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`.
   - `npm run shots`: 556 PNGs, 0 FAIL. `title line stable OK (… 8 comparisons …)`, `turn mark parity OK (… 20 comparisons …)`. Host-leak sweeps all OK: chrome; button 112/672; input 14/164; table, list, inline, checkbox and prose; host-copy pin OK. Print-twin delta OK (138 ids).
   - `check-freeze.sh`: `FREEZE VIOLATED (38 checksum mismatches, 0 missing)`. All `initiative*`, and the set equals `rebaseline.txt`. `rebaseline.txt` + `widening.txt`: 44/44 OK, md5 unchanged.
   - `npm run parity`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0.
6. **Final.**
   - Open: NEW-MEDIUM-R2 only. Everything from earlier rounds is closed.
   - Out of scope by ruling: SC-381/382/383/384 and the stale gif hand-off.
   - **LAND-READY: NO.** It becomes YES once NEW-MEDIUM-R2 is fixed (option a or b) and a 300px wrapped-title case is added to `assertTitleLineStable` and passes.

## State left behind

- dse `git status --porcelain` is empty, and the tip is still `309894a`.
- The scratch `e9174e1` worktree was removed and pruned.
- No lifecycle temp dirs from my runs remain (none failed), and no processes remain.

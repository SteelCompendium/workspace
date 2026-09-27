# SC-284 round 1 — implementer report

**STATUS: DONE_WITH_CONCERNS** (green on every gate but freeze, which needs Scott's
sanction for a 3-pair rebaseline — deliverable is ready, nothing was edited unilaterally).

- Final DSE sha: `97aa19a` on branch `sc284-cardhead-narrow`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow/draw-steel-elements`
  (rebased on `origin/develop` `6c4f6aa`, already current — no rebase needed).
- Mechanism: `.dse-head` is now a named `inline-size` query container
  (`container-type: inline-size; container-name: dse-head`); `@container dse-head
  (max-width: 480px)` re-places the right rail's 3 children into column 2, rows 4/5/6,
  left-aligned. Threshold stated in `px` (480), not `em` — matches the brief's
  determinism instruction.
- Gates: tsc clean/0, lint clean/0, jest **3999 passed / 1 skipped / 206 of 207 suites**/0,
  obsidian-lifecycle **6/6 ok, 0 failed**/0, shots **532 PNGs, 0 FAIL**/0 (524 baseline +
  8 new: `statblock-narrow`, `featureblock-narrow` × 4 combos each), parity **0 GAPs / 0
  undeclared / 16 DECLARED**/0.
- Freeze: **FREEZE VIOLATED (6 checksum mismatches, 0 missing)** — `encounter-narrow`,
  `montage-narrow`, `statblock-sticky-narrow`, each twin+realprint. Deterministic across
  2 clean sweeps (byte-identical), each "before" hash verified to already match the live
  `freeze-baseline.sha256`. Genuine, unavoidable consequence (see §3). Baseline **not
  edited**; `rebaseline.txt` produced for the ticket-owner to carry to Scott.
- Did not land. No tags/RCs touched. No files written outside the worktree/ledger dir.

---

## 1. What changed and why

`.dse-head`'s third grid column (`auto`) starved to min-content at a sidebar-leaf width
(~300px) because nothing narrowed it — the site's `@media (max-width: 30em)` stacking
rule was never ported to the plugin. A viewport query can't fire there (the *window* is
wide; only the card is narrow), so the trigger has to be the card's own width. Per the
brief's preferred mechanism: `.dse-head` becomes its own `inline-size` query container,
and `@container dse-head (max-width: 480px)` re-places the right-rail's three children
(never the container itself — a container query container can't requery itself; see the
SC-121 Batch 4 precedent already in `styles-source.css` ~:5912, cited in my comment) into
column 2 rows 4/5/6, left-aligned, with the right-primary getting a small top margin. The
third track is never redeclared — it's `auto`, so it collapses to 0 width once nothing
sits in it. Crest and both right chips stay visible throughout (nothing hidden).

No `white-space: nowrap` (or similar) exists anywhere in the cardHead block or on any
`.dse-head__{eyebrow,primary,deck}--{chip,line}` rule — checked via full-file grep. The
one-word-per-line symptom is purely the grid track's min-content squeeze, not a
white-space rule, so I did not port v2's redundant `white-space: normal; overflow-wrap:
anywhere` mobile-block lines — DSE's chips already default to `white-space: normal` and
adding a no-op would be scope creep against "keep the change confined to the cardHead
block."

## 2. Per-consumer probe table

| Consumer | `.dse-head` parent context | Wide (900px) unchanged? | Narrow (300px) stacks? | Containment side effect? |
|---|---|---|---|---|
| statblock | direct block child of `.dse-sb` (div) | Yes (byte-identical wide shot) | Yes — all 3 right slots (Level/org-role/EV) move under the name | None — block box, not shrink-to-fit |
| featureblock | direct block child of `.dse-fb` (div) | Yes (byte-identical) | Yes (`stats` fixture: Level/EV) | None |
| feature (renderFeature.ts) | direct block child of `.dse-feature` (div, `position: relative` only) | Not separately shot (no dedicated narrow fixture existed; covered structurally via statblock/featureblock's nested feature cards, see rebaseline crop below) | Yes | None — block box |
| montage (HeadView.ts) | flex item, `.dse-mt__head { display:flex } > :first-child { flex: 1 1 auto }` alongside the chrome menu button | Yes (byte-identical) | Yes (existing `montage-narrow` fixture; moves the frozen print bytes — see §3) | **Probed explicitly** (the brief's named footgun): a `flex-basis:auto` item's max-content contribution collapses to 0 under `inline-size` containment, but it's the sole `flex-grow:1` item next to a `flex:0 0 auto` button, so the grow step still fills 100% of the remaining row width — confirmed empirically (wide shot byte-identical; narrow shot correctly full-width, not collapsed) |
| negotiation | flex item, same `.dse-nt__head` pattern as montage | Not separately shot (negotiation's `buildHead` never populates any right-rail slot — `leftEyebrow`/`name` only, so there is no right rail to regress) | N/A — no right rail to stack | Same flex-item shape as montage; not independently re-verified with a shot since there's nothing on the right to move, but the CSS mechanism is identical |
| roll | direct block child of `.dse-roll` (div) | — | — (roll's `cardHead` call passes only `name`, no right rail) | None |
| project | direct block child of `.dse-prj__head` (div, no CSS rule at all) | — | — (only `rightEyebrow` populated in the default fixture; no dedicated narrow fixture added — out of the "at least 3" scope the brief asked for) | None |
| encounter | direct block child of `.dse-enc__head` (div, no CSS rule) | Yes (pre-existing `encounter-narrow` shot; wide untouched) | Yes — pre-existing narrow fixture moves the frozen print bytes (§3) | None |
| party | direct block child of `.dse-party__head` (div, no CSS rule) | — | — (`cardHead(...,{name:'Party'})` only — no right rail) | None |

**Footgun probes explicitly ruled out:** layout containment (baseline export / abspos
containing-block side effects) — ~~`container-type: inline-size` applies inline-size
containment only, not `layout`/full `size`~~. **CORRECTED in round 2 (review LOW-1):**
this was false on Obsidian's shipped runtime floor (Electron 21.4.1 / Chromium 106 —
the asar self-updates, Electron does not). There, `container-type: inline-size` DOES
establish layout and style containment in addition to inline-size containment (matching
the repo's own existing stamina-host precedent at `styles-source.css` ~:11631); current
Chromium (including the harness's own Playwright build) has since narrowed this to
inline-size-only, which is why a harness-only check missed it. The conclusion is
unchanged, for the reason actually checked: nothing in any head relies on baseline
export, and every abspos/fixed descendant of a head already anchors at or inside that
same head (`.dse-sb[data-dse-role] > .dse-head`, `.dse-fb > .dse-head`, `.dse-crest`),
so `.dse-head` becoming their containing block changes nothing observable. Grid-item-in-
an-`auto`-track collapse — none of the 9 consumers place `.dse-head` as a grid item at
all (it is always either a block child or a flex item; the montage/negotiation flex case
is covered above).

## 3. Freeze: 3 pre-existing narrow captures legitimately move

`encounter-narrow`, `montage-narrow`, and `statblock-sticky-narrow` (all pre-existing,
already-frozen `NARROW_SHOTS`/`PREF_SHOTS` entries pinned at 300px) render the SAME DOM
under print as under screen (print is a CSS attribute layered over whatever DOM the
active rule built — it can't be branched around, the standing rule in every prior
rebaseline entry in `freeze-baseline.sha256`'s history). Since the harness pins these
captures' `#mount` to 300px explicitly for BOTH the screen and print/realprint passes,
the new `@container dse-head` rule correctly fires there under print too, exactly as it
does on screen — this is the fix doing its job, not a bug. **Only these 3 pairs moved; no
full-width (900px) print capture for any consumer moved** — confirmed by the
byte-identical wide-width before/after shots in `evidence/` and by freeze reporting
exactly these 6 lines and nothing else, twice.

Verification performed (not asserted):
- Ran `npm run shots` + `check-freeze.sh` **twice** on the branch tip: identical 6-line
  mismatch set both times.
- Hashed the 6 moved files after each of those 2 runs and diffed them: **byte-identical**
  (`diff` empty).
- Checked out `origin/develop` `6c4f6aa` (detached, worktree returned to the branch
  afterward; tree was clean at every step — verified with `git status --short`) and
  re-shot each of the 3 ids individually: each "before" hash matches the corresponding
  line in the live `freeze-baseline.sha256` **exactly** (`grep`-verified, shown in the
  transcript).
- `rebaseline.txt` was generated from the branch-tip "after" bytes, not hand-edited.

**`freeze-baseline.sha256` was NOT touched.** Deliverable:
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/rebaseline.txt`
(6 lines, `<sha256>  <filename>`, deterministic across 2 sweeps) — for the ticket-owner to
carry to Scott per the standing sanctioned-rebaseline procedure. If sanctioned, the
baseline count stays at **260** (no widening — these 3 names already existed; only their
bytes move).

## 4. Regression guard added

- `visual-harness/entry.ts` `NARROW_SHOTS`: 2 new entries — `statblock-narrow` (fixture
  `default`, all 3 right-rail slots populated) and `featureblock-narrow` (fixture
  `stats`, Level+EV populated) — alongside the pre-existing `montage-narrow`. Together:
  a plain-block-child head (statblock/featureblock) and a flex-row-embedded head
  (montage) at 300px. 8 new PNGs (2 ids × 4 combos), additions-only, not in the frozen
  baseline (new names are invisible to `sha256sum -c` by construction).
- `test/dom/kit/cardHead.test.ts`: 2 new tests in the existing "grid CSS contract"
  describe block — asserts `.dse-head` declares `container-type: inline-size` +
  `container-name: dse-head`, and that `@container dse-head (max-width: 480px)`
  re-places the right-rail children into column 2 rows 4/5/6 left-aligned without
  hiding the crest or either chip (`not.toMatch(/display:\s*none/)`).

## 5. Files changed

- `draw-steel-elements/styles-source.css` — the container + narrow-form CSS block
  (cardHead §2.7 section).
- `draw-steel-elements/test/dom/kit/cardHead.test.ts` — 2 new CSS-contract tests.
- `draw-steel-elements/visual-harness/entry.ts` — 2 new `NARROW_SHOTS` entries.
- `draw-steel-elements/CHANGELOG.md` — 1 bullet under the repo's unreleased section
  (`## 7.0.0 (unreleased; previously numbered 6.0.0)` — this repo's convention; there is
  no literal `## Unreleased` heading in this CHANGELOG).

No changes to `cardHead.ts` (CSS-only sufficed), and none of the excluded areas
(`renderFeature.ts`, `.dse-feature__kw*`, `.dse-feature__meta-cell--keywords`,
`.dse-feature__meta-value`, ds-feature example, ds-skills, `.dse-optchip`, by-SCC rule
eyebrow, modal text scale) were touched.

## 6. Commits (branch `sc284-cardhead-narrow`, on top of `origin/develop` `6c4f6aa`)

1. `7923377` — feat(head): SC-284 narrow (stacked) form for cardHead (the CSS)
2. `3999296` — test(head): SC-284 pin the .dse-head narrow-form CSS contract
3. `498e0b5` — test(harness): SC-284 narrow-shot coverage for cardHead consumers
4. `97aa19a` — docs(changelog): SC-284 narrow cardHead form

Superproject pointer for `draw-steel-elements` is modified but **not committed** — this
round did not land (per session operating constraints: report LAND-READY /
PARKED-NEEDS-REVIEW, don't land).

## 7. Drive-by fixes

None.

## 8. Follow-ups

- **`project` and `roll` consumers have no narrow-width fixture coverage at all** (roll
  and project/negotiation never populate a right rail in their existing fixtures, so
  there was nothing to regress-test there; `project`'s `rightEyebrow`-only case is
  untested at 300px). Not a defect of this change — just unphotographed surface. Worth a
  ticket if Scott wants full narrow-fixture parity across every `cardHead(` consumer.
- **`feature`'s standalone narrow form has no dedicated fixture** either (only reached
  indirectly via statblock/featureblock's nested feature cards, visible in the
  `statblock-sticky-narrow` rebaseline crop). Same as above — not required by this
  ticket's "at least 3" bar, but a gap if full consumer coverage is wanted later.
- **`check-freeze.sh`'s current exit code is 0 even on `FREEZE VIOLATED`**, not the `1`
  the `dse-verify` skill doc describes ("exit 0 on 0 mismatches, 1 on any mismatch").
  Measured directly (`echo EXITCODE_IS_$?` immediately after the bare command, no pipe,
  no masking) — reproducible. Not something I touched or fixed (out of this ticket's
  scope and not a file the brief named), but worth a ticket since a dispatcher/CI step
  gating purely on exit code would silently pass through a real freeze violation.

## 9. Evidence artifacts (absolute paths)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/`:

- `rebaseline.txt` — the 6-line sanction deliverable (§3).
- `evidence/sc284-compare-narrow.png` — the single composite (before | after, one row
  each for statblock / montage / featureblock, labeled) via ImageMagick `montage`-style
  compositing (`magick` on PATH).
- `evidence/sc284-statblock-narrow-{before,after}.png`,
  `evidence/sc284-featureblock-narrow-{before,after}.png`,
  `evidence/sc284-montage-narrow-{before,after}.png` — full narrow-width (300px) browser
  harness shots (`--steel-dark`), before = `origin/develop` `6c4f6aa` behavior (montage
  via its own pre-existing fixture; statblock/featureblock via entry.ts's new fixture
  IDs cherry-picked onto `6c4f6aa` with no CSS change, then discarded — worktree returned
  clean to the branch tip before any further gate work).
- `evidence/sc284-statblock-wide-{before,after}.png`,
  `evidence/sc284-montage-wide-{before,after}.png`,
  `evidence/sc284-featureblock-wide-{before,after}.png` — full-width (900px, the
  harness default) shots, **byte-identical before/after** (`cmp -s`, verified) proving
  nothing changed at normal note width.
- `evidence/sc284-rebaseline-{encounter-narrow,montage-narrow,statblock-sticky-narrow}-print-full-{before,after}.png`
  — the full frozen `--steel-print.png` bytes for each of the 3 sanction-needed pairs.
- `evidence/sc284-rebaseline-{encounter-narrow,montage-narrow,statblock-sticky-narrow}-print-crop.png`
  — labeled before/after crops of the same 3, for quick visual review.

Real-Obsidian sidebar shots (`obsidian-camera.mjs`'s sidebar-leaf mode) were **not**
captured — the browser harness's narrow shots (the brief's explicit fallback) already
give clean, direct before/after coverage including the frozen-print proof above, and a
real-Obsidian capture would not add information the print-twin/realprint gate (which
already renders under a pinned real-Obsidian sheet, SC-202) doesn't already cover.

## 10. Gate logs (per-run unique files, for the record)

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc284-gates/`
(scratchpad — not a durable path; numbers are restated above for the record):
`tsc.log`, `lint.log`, `jest1.log`, `lifecycle.log`, `shots-final.log` (532 PNGs, 0 FAIL),
`freeze3.log` (6 mismatches, deterministic), `parity1.log` (0/0/16 DECLARED).

---

# Round 2 (fix round — independent review APPROVE_WITH_FIXES)

**STATUS: DONE.** All 4 review findings (MEDIUM-1, LOW-1, LOW-2, LOW-3) folded per
owner ruling. Rebased onto `origin/develop` `619c4bd` (clean, CHANGELOG both-entries
resolved automatically — no conflict markers). Final DSE sha: **`33b58c3`** on branch
`sc284-cardhead-narrow`. Gates: tsc/lint clean/0; jest **4041 passed / 1 skipped / 208 of
209 suites**/0; obsidian-lifecycle **19/19 ok, 0 failed**/0 (SC-340 expanded this gate
from 6 to 19 scenarios — not a regression, the new floor); shots **532 PNGs, 0 FAIL**/0,
deterministic across 3 runs; parity **0 GAPs / 0 undeclared / 16 DECLARED**/0. Freeze:
**exactly the same 6 lines** as round 1 (`encounter-narrow`, `montage-narrow`,
`statblock-sticky-narrow`, twin+realprint each) — nothing else moved on the rebase.
Regenerated `rebaseline.txt` from the rebased bytes: byte-identical to round 1's values
(none of MEDIUM-1/LOW-1/LOW-2 touch these 3 captures), verified deterministic across 2
shots runs, and verified `freeze OK (260/260 …)` exit 0 against a **temp copy** of the
baseline (`/tmp/.../scratchpad/sc284-gates/freeze-tmp/`) — the shared baseline was never
touched (confirmed by hash before/after this round). MEDIUM-1 override list: only one
pair of pre-existing higher-specificity rules exists on any `.dse-head__*--right`
selector anywhere in `styles-source.css` — `[data-dse-theme='steel'] .dse-fb
.dse-feature > .dse-head > .dse-head__eyebrow--right`/`__primary--right` at ~:7889/:7901
— grepped exhaustively; no `deck--right` override exists anywhere, and no other
`grid-area` declaration touches a `.dse-head` slot outside the cardHead block itself.

## R2.1 Rebase (step 1)

`git fetch origin` then `git rebase origin/develop` inside the worktree's DSE clone:
clean, no conflicts (`CHANGELOG.md`'s two hunks — develop's SC-340 entries at its own
lines, this branch's SC-284 insertion at its own — merged automatically; both entries
present in the result, verified by `grep`). `package.json`/`package-lock.json` unchanged
between `6c4f6aa` and `619c4bd` (`git diff` empty) — no `npm ci` needed. Commits
`d3a7d5a`/`1d24f08`/`4e5ecec`/`56f0585` are round 1's four commits, replayed onto
`619c4bd` with new shas (content unchanged — confirmed by re-reading the rebased
`styles-source.css`/`entry.ts`/`cardHead.test.ts`/`CHANGELOG.md` before making any new
edit).

## R2.2 MEDIUM-1 (step 2)

**Fix:** added, inside the SAME `@container dse-head (max-width: 480px)` block, two
matching-specificity arms:

```css
[data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__eyebrow--right { grid-area: 5 / 2; }
[data-dse-theme='steel'] .dse-fb .dse-feature > .dse-head > .dse-head__primary--right { grid-area: 6 / 2; }
```

This mirrors the existing Steel remap's own lane logic (cost/eyebrow-right rides the
*visual* primary lane; ability_type/primary-right rides the *visual* deck lane) — so the
narrow form's rows 5/2 and 6/2 (the same rows the base arms use for the primary/deck
lanes) are the correct targets, not rows 4/2 and 5/2. Equal specificity to the
unconditional rules at ~:7889/:7901 + later source position wins the cascade only where
the container query matches; wide width (where the query never matches) is untouched.

**Exhaustive grep of every `grid-area:` declaration in `styles-source.css`:** 3022,
3027, 3031 (an unrelated `grid-template-areas` shorthand target, not `.dse-head`), 10969,
10993, 11044, 11173 (initiative-roster grid, unrelated), 11801 (`grid-area: auto`,
unrelated), 12305, 12310, 12324, 12328 (another unrelated tracker grid). The ONLY
`.dse-head`-related hits: 13608/13611/13615/13618/13621/13625 (the base 6-slot lane
placement) and 13696/13699/13702 (my own narrow-form arms) plus the two new arms just
added. **No `deck--right` override exists anywhere** — confirmed, nothing else needed
there.

**Measured** (Playwright script against the built harness, `element=featureblock&
fixture=stats&width=300`, "Blood Debt" sub-feature head):

| | name width | name lines | cost chip position |
|---|---|---|---|
| Before (MEDIUM-1 unfixed) | 81.27px | 2 | still column 3 (x=186, beside the name) |
| After (this fix) | 180.27px | 1 | stacked below (y=592, left-aligned) |

**Jest:** added one assertion (`the featureblock sub-feature Steel remap gets a
matching-specificity narrow arm`) inside the existing CSS-contract describe block,
asserting the full selector + `grid-area: 5/2` and `6/2` appear inside the `@container`
block — a plain text match on the single-class selector (the round-1 test) cannot see a
specificity loss, only a missing rule, so this checks the actual override. `npx jest
test/dom/kit/cardHead.test.ts`: 24 passed (was 23 before this test).

Commit: `9253d4b`.

## R2.3 LOW-1 (step 3)

No code change — comment + report accuracy only. Corrected the `container-type`
paragraph at `styles-source.css` ~13589 to state that on Obsidian's shipped runtime
floor (Electron 21.4.1 / Chromium 106 — the asar self-updates to 1.14.2, Electron does
not) `container-type: inline-size` establishes layout AND style containment in addition
to inline-size containment, matching the repo's own existing stamina-host precedent
(~:11631) rather than the narrower current-Chromium behavior the harness alone would
show. Restated why this is harmless for every consequence actually checked: no head
relies on baseline export; every abspos/fixed descendant of a head already anchors at or
inside that same head. Also corrected the round-1 report (§2, "Footgun probes explicitly
ruled out" — see the strikethrough/correction inline above). Commit: `df8f7b8`.

## R2.4 LOW-2 (step 4)

Corrected the symptom description in both the CSS comment (folded into the LOW-1 commit,
same paragraph) and `CHANGELOG.md` (separate commit `33b58c3`): it is the NAME column
(`minmax(0, 1fr)`) that starves and wraps a word (often a letter) per line — the right
rail keeps its own max-content width and stays on one line. The CHANGELOG bullet's
"featureblock" claim is now accurate (MEDIUM-1 fixed in this round), so it was kept, not
scoped out.

## R2.5 Battery (step 5) — exact numbers

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **4041 passed / 1 skipped / 4042 total, 208 of 209 suites**, exit 0 |
| `npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 (SC-340 grew this from 6 to 19 scenarios — the new expected floor, not a regression) |
| `npm run shots` | **532 PNGs, 0 FAIL**, exit 0 — run 3 times, deterministic |
| `check-freeze.sh` (live baseline) | `FREEZE VIOLATED (6 checksum mismatches, 0 missing)` — **exactly** `encounter-narrow`/`montage-narrow`/`statblock-sticky-narrow` twin+realprint, same as round 1, both freeze runs |
| `npm run parity` | **0 GAPs / 0 undeclared warnings / 16 DECLARED**, exit 0 |

No other frozen line moved on the rebase (freeze reported the same 6 names both times,
nothing more) — so the "check whether it also moves on a clean 619c4bd" contingency
never applied.

## R2.6 rebaseline.txt (step 6)

Regenerated from the rebased branch tip's bytes (not carried over from round 1, though
the values are identical — none of this round's fixes touch these 3 captures). Verified:
2 `npm run shots` runs on the rebased tree produced byte-identical hashes for all 6 moved
files (`diff` empty). Built a temp copy of `freeze-baseline.sha256` (Python script,
scratchpad-only) with exactly these 6 lines swapped — verified additions-only-style
diff: **6 lines changed, 0 added, 0 removed**, 260 lines total, same as live. Ran
`check-freeze.sh` against that temp copy + the rebased shots dir: **`freeze OK (260/260
frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`,
exit 0.** The live shared `freeze-baseline.sha256` was never opened for writing —
verified by re-hashing it before and after this round (unchanged).
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/rebaseline.txt`
is the deliverable, ready for the ticket-owner to carry to Scott.

## R2.7 Evidence (step 7)

- **`evidence/sc284-featureblock-narrow-after.png`** — regenerated (full narrow shot,
  branch tip, 600×1616). **`evidence/sc284-featureblock-narrow-before.png`** — also
  regenerated (pre-SC-284, `619c4bd` + this round's `entry.ts` fixture id only, no CSS
  change; same dimensions as round 1's before, 600×1658, confirming reproducibility).
- **`evidence/sc284-compare-narrow.png`** — rebuilt. The featureblock row now crops the
  **"Blood Debt" / "3 MALICE" option head** (y≈900-1300 of the full shot) instead of only
  the top head — before: "BLO/OD/DEB/T" over 4 lines with the cost chip still beside it;
  after: "BLOOD DEBT" on one line with "3 MALICE" stacked below, left-aligned. Statblock
  and montage rows are unchanged from round 1 (top head, still accurate — MEDIUM-1 never
  touched them, confirmed by re-diffing the underlying crops against round 1's).
- **`evidence/sc284-rebaseline-statblock-sticky-narrow-print-crop.png`** (LOW-3) —
  recropped to y≈0-500 of the full print images (was y≈0-400, which cut off before the
  stacked chip). Now shows the "Signature Ability" chip stacked below "Whip and Magic
  Longsword" in the AFTER panel, with a caption noting the scrolled state (the top head
  is above this crop) and the ~55px downward shift.
- **`evidence/sc284-rebaseline-heads-compare.png`** — new. One row per moved print shot
  (`encounter-narrow`, `montage-narrow`, `statblock-sticky-narrow`), before | after,
  labeled, head region only (y≈0-400 of each full print image).
- Wide-width evidence (`sc284-{statblock,montage,featureblock}-wide-{before,after}.png`)
  re-verified **byte-identical** after this round's changes (`cmp -s`) — MEDIUM-1 only
  fires inside the `@container` at ≤480px, so 900px width is untouched.

## Files changed (round 2, cumulative with round 1)

- `draw-steel-elements/styles-source.css` — MEDIUM-1 arms + LOW-1/LOW-2 comment fix (both
  inside the existing cardHead §2.7 block).
- `draw-steel-elements/test/dom/kit/cardHead.test.ts` — 1 new assertion.
- `draw-steel-elements/CHANGELOG.md` — LOW-2 wording fix (same bullet, no new bullet).
- Round 1's files (`visual-harness/entry.ts`) unchanged in round 2.

## Commits (round 2, on top of `origin/develop` `619c4bd`)

1. `9253d4b` — fix(head): SC-284 r2 MEDIUM-1 — featureblock sub-feature heads now stack too
2. `df8f7b8` — docs(head): SC-284 r2 LOW-1 — correct the containment comment
3. `33b58c3` — docs(changelog): SC-284 r2 LOW-2 — describe the symptom correctly

(Round 1's 4 commits were replayed onto `619c4bd` by the rebase with new shas —
`d3a7d5a`/`1d24f08`/`4e5ecec`/`56f0585` — content unchanged.)

## Drive-by fixes

None.

## Follow-ups

Unchanged from round 1 (§8 above) — no new follow-ups this round. The `check-freeze.sh`
exit-code follow-up from round 1 was ruled DROP by the owner (decisions.md,
2026-09-25): the script does `exit 1` on mismatch; round 1's measurement went through
devbox's `sh` wrapper, which eats exit codes even without a pipe or double-quoted `$?`
(a footgun class beyond the two the `dse-verify` skill names) — confirmed correct in this
round by reading `check-freeze.sh`'s own source rather than re-measuring through devbox.

## Evidence artifacts (absolute paths, round 2 additions/changes)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/`:

- `rebaseline.txt` — regenerated from rebased bytes (values unchanged from round 1).
- `evidence/sc284-featureblock-narrow-{before,after}.png` — regenerated.
- `evidence/sc284-compare-narrow.png` — rebuilt (featureblock row now shows the option
  head).
- `evidence/sc284-rebaseline-statblock-sticky-narrow-print-crop.png` — recropped
  (LOW-3).
- `evidence/sc284-rebaseline-heads-compare.png` — new (all 3 moved print shots, head
  region, before/after, labeled).
- Unchanged from round 1 (re-verified, not regenerated):
  `evidence/sc284-{statblock,montage}-{narrow,wide}-{before,after}.png`,
  `evidence/sc284-rebaseline-{encounter-narrow,montage-narrow,statblock-sticky-narrow}-print-full-{before,after}.png`,
  `evidence/sc284-rebaseline-{encounter-narrow,montage-narrow}-print-crop.png`.

## Gate logs (round 2, per-run unique files)

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc284-gates/`:
`r2-tsc.log`, `r2-lint.log`, `r2-jest.log`, `r2-lifecycle.log`, `r2-shots1.log`,
`r2-shots2.log`, `r2-shots3.log`, `r2-shots-final.log`, `r2-freeze1.log`,
`r2-freeze2.log`, `r2-freeze-final.log`, `r2-parity1.log`,
`r2-freeze-tmp-applied.log` (the temp-baseline verification), `blooddebt-after.log` /
`blooddebt-before.log` (the MEDIUM-1 measurement), `freeze-tmp/` (the temp baseline copy
+ script, scratchpad-only, never touching the shared file).

---

# Round 3 (rebase + re-gate only — Scott sanctioned, no code changes)

**STATUS: DONE.** Rebase-and-re-gate only, no CSS/TS/test edits — Scott approved the
look ("thats fine") and sanctioned the 6-line freeze rebaseline ("sanctioned") on
2026-09-25. Target moved mid-round from `b029baa` to `272c444` (SC-231 landed while I was
already rebasing onto `b029baa`) — caught via a live re-fetch, re-rebased onto the
correct tip. **Final DSE sha: `825ea51`** on branch `sc284-cardhead-narrow`, base
`origin/develop` `272c444`. Gates: tsc/lint clean/0; jest **4112 passed / 1 skipped / 211
of 212 suites**/0; obsidian-lifecycle **19/19 ok, 0 failed**/0; shots **532 PNGs, 0
FAIL**/0 (2 runs, deterministic); parity **0 GAPs / 0 undeclared / 16 DECLARED**/0.
Freeze: **exactly our 6 lines** (`encounter-narrow`/`montage-narrow`/
`statblock-sticky-narrow`, twin+realprint) — nothing else, confirmed on 2 separate
shots runs against the final `272c444`-based tip. `rebaseline.txt` regenerated: **6
lines**, hashes **identical to round 2's** (none of our commits' fixes touch these 3
captures, and neither SC-236/SC-255's 28-line rebaseline nor SC-231's 55-line rebaseline
touched them either — all 3 "before" hashes in the live baseline still match round 2's
evidence byte-for-byte). Verified `freeze OK (260/260 …)` exit 0 against a fresh temp
baseline copy. Shared baseline confirmed untouched (re-hashed before/after: unchanged,
`dce9656f0907169bf8e3091057e7c724`).

## R3.1 Target correction (mid-round)

Dispatched instructions named `b029baa` (SC-243, SC-230, SC-272, SC-236, SC-255 landed
since `619c4bd`). I fetched, confirmed `origin/develop` was exactly `b029baa`, and
rebased — clean except one CHANGELOG.md conflict (see R3.2), resolved by keeping all
entries; `package.json`/`package-lock.json` unchanged (`git diff 619c4bd..b029baa` on
both, empty — no `npm ci`). Full battery run on that tip: tsc/lint clean, jest 4104
passed/1 skipped/211 of 212 suites, obsidian-lifecycle 19/19 ok, shots 532/0 FAIL, freeze
run 1 exactly our 6 lines. **On the second shots run (verifying determinism), freeze
reported 61 mismatches** — not a regression in my branch: mid-task, the dispatcher sent
a correction that `origin/develop` had moved to `272c444` (SC-231, one-chip-per-keyword,
landed between my two fetches) and its own rebaseline had already updated the shared
baseline for 55 unrelated lines (`feature*`, `chrome-collapsed-rollout/trio`,
`chrome-placement-trio`, `chrome-hover-statblock`, 20 `statblock*` ids) — my `b029baa`
rebase was now stale against a baseline built for `272c444`. Re-fetched (`origin/develop`
confirmed `272c444`), re-ran `git rebase origin/develop` from the current branch tip
(which fast-forwarded the rebase target from `b029baa` to `272c444` in one pass, since
`b029baa` is `272c444`'s ancestor) rather than trying to reuse the stale intermediate
state.

## R3.2 Rebase (final, onto `272c444`)

`git fetch origin` then `git rebase origin/develop`: **one conflict**, `CHANGELOG.md`
(same shape as rounds 1→2's rebase — develop's newly-landed entries and this branch's
SC-284 entry both insert at the top of the `## 7.0.0 (unreleased…)` bullet list).
Resolved by keeping **all** entries, SC-284's own bullet placed immediately after the
newly-landed ones, matching the position it already had relative to SC-328 below it.
Verified no conflict markers remain (`grep -rn '^<<<<<<<\|^=======\|^>>>>>>>' CHANGELOG.md`
— empty) before `git add` + `git rebase --continue`. **No `styles-source.css` conflict**
at either rebase (`b029baa` or `272c444`) — SC-231's `.dse-feature__kw*` changes and
SC-236/SC-230/SC-272/SC-255's areas never touch the cardHead block, so git's 3-way merge
applied cleanly. `package.json`/`package-lock.json`: `git diff b029baa..272c444` on both,
empty — no `npm ci`. All 7 of this branch's commits replayed with new shas (content
unchanged from round 2, confirmed by inspecting each rebased file before running any new
command): `53a7c40`/`53fcf75`/`2920913`/`b38aa3f`/`00cbcf1`/`50346a8`/`825ea51`.

## R3.3 Full battery (final tip, `825ea51` on `272c444`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **4112 passed / 1 skipped / 4113 total, 211 of 212 suites**, exit 0 |
| `npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 |
| `npm run shots` | **532 PNGs, 0 FAIL**, exit 0 — run twice, deterministic |
| `check-freeze.sh` (live baseline) | `FREEZE VIOLATED (6 checksum mismatches, 0 missing)` — **exactly** `encounter-narrow`/`montage-narrow`/`statblock-sticky-narrow` twin+realprint, both freeze runs, nothing else |
| `npm run parity` (last) | **0 GAPs / 0 undeclared warnings / 16 DECLARED**, exit 0 |

No other frozen line moved on either rebase target — the "check whether it also moves on
a clean base first" contingency never applied to our branch (the 61-mismatch reading in
R3.1 was the stale-target artifact, not a real regression: re-verified as exactly 6 once
rebased onto the correct `272c444` tip).

## R3.4 "Before" hash drift check (statblock-sticky-narrow especially)

Per the dispatcher's specific ask (statblock-sticky-narrow's card contains nested
feature cards, which SC-231's one-chip-per-keyword change could plausibly have touched):
grepped the current live `freeze-baseline.sha256` for all 3 of our filenames' "before"
hashes and diffed them against round 2's `evidence/sc284-rebaseline-*-print-full-before.png`
files (which capture the pre-SC-284 bytes). **All 3 match exactly**:

| Capture | Live baseline hash | round-2 evidence "before" hash |
|---|---|---|
| `encounter-narrow--steel-print.png` | `4f43d268…` | `4f43d268…` (identical) |
| `montage-narrow--steel-print.png` | `0427d613…` | `0427d613…` (identical) |
| `statblock-sticky-narrow--steel-print.png` | `04b36ce3…` | `04b36ce3…` (identical) |

(realprint siblings match identically too, same check.) SC-231 did not touch any of our
3 "before" states — including `statblock-sticky-narrow`, whose `with-captain` fixture's
scrolled nested ability head ("Whip and Magic Longsword") apparently never renders a
Keywords line in that view, so the chip-per-keyword change had nothing to touch there.

## R3.5 rebaseline.txt (regenerated against the CURRENT baseline)

Regenerated from the final `272c444`-based tip's bytes. Hashes: **byte-identical to
round 2's `rebaseline.txt`** (`eda3767d…`/`2009550e…`/`e66e9b58…`/`cb2bb4f9…`/
`45ab6801…`/`4739144a…` — unchanged across all 3 rounds' rebases, since none of our own
commits nor either intervening landing's rebaseline touches these 3 captures). Verified
deterministic: matches both shots runs on this round's `272c444` tip (and, by the R3.4
check above, the "before" side of the diff is still valid too). Built a **temp copy**
of the current live baseline (Python script, scratchpad-only —
`/tmp/.../scratchpad/sc284-gates/freeze-tmp-r3/`) with exactly these 6 lines swapped
(diff: 6 changed, 0 added, 0 removed, 260 lines total — same as live). Ran
`check-freeze.sh` against that temp copy: **`freeze OK (260/260 frozen print PNGs
byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0.** The shared
`freeze-baseline.sha256` was never opened for writing — re-hashed (md5) before and after
this round: `dce9656f0907169bf8e3091057e7c724`, unchanged.
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/rebaseline.txt`
is the deliverable, current against `272c444`, ready to apply at landing.

## Files changed / commits (round 3)

No source files changed beyond the rebase's mechanical replay + the CHANGELOG conflict
resolution (which kept content identical to round 2's bullet, just repositioned relative
to newly-landed entries). Commits on top of `origin/develop` `272c444`:

1. `53a7c40` — feat(head): SC-284 narrow (stacked) form for cardHead
2. `53fcf75` — test(head): SC-284 pin the .dse-head narrow-form CSS contract
3. `2920913` — test(harness): SC-284 narrow-shot coverage for cardHead consumers
4. `b38aa3f` — docs(changelog): SC-284 narrow cardHead form
5. `00cbcf1` — fix(head): SC-284 r2 MEDIUM-1 — featureblock sub-feature heads now stack too
6. `50346a8` — docs(head): SC-284 r2 LOW-1 — correct the containment comment
7. `825ea51` — docs(changelog): SC-284 r2 LOW-2 — describe the symptom correctly

## Drive-by fixes

None.

## Follow-ups

None new this round.

## Evidence artifacts

Unchanged from round 2 — no evidence regeneration requested or needed this round (no
visual/behavioral change, rebase + re-gate only). All still valid: absolute paths under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/evidence/`,
listed in round 2's own artifact section above.

## Gate logs (round 3, per-run unique files)

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc284-gates/`:
`r3-tsc.log`/`r3-lint.log`/`r3-jest.log`/`r3-lifecycle.log`/`r3-shots1.log`/
`r3-freeze1.log`/`r3-shots2.log`/`r3-freeze2.log`/`r3-parity1.log` (the stale
`b029baa`-based run, R3.1); `r3b-tsc.log`/`r3b-lint.log`/`r3b-jest.log`/
`r3b-lifecycle.log`/`r3b-shots1.log`/`r3b-freeze1.log`/`r3b-shots2.log`/
`r3b-freeze2.log`/`r3b-parity1.log` (the final `272c444`-based run, authoritative);
`r3-freeze-tmp-applied.log` + `freeze-tmp-r3/` (the temp-baseline verification,
scratchpad-only).

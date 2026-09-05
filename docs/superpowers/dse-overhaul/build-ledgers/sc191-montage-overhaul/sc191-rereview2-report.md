# SC-191 re-review 2 — report (reviewer-L, fresh)

**COMPLETE.**

Worktree: `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`
Branch `sc191-montage-overhaul` @ `eeabdc9`, base `origin/develop` `9227dd9`. Delta: `git diff 9bdcf70..eeabdc9`
(13 files, +706/-130). Tree clean before and after (`git status --short` empty both times).

## Executive summary

**Verdict: FIX-ROUND-4.** Battery is fully green and matches every expected number
(tsc/lint clean; jest 3694 passed / 1 skipped / 195 suites; shots 508 PNGs, 0 ERROR,
byte-identical across 2 runs, all in-run gate lines OK incl. 1.14.0 pin / 678 button /
input; freeze exactly the 2 expected montage FAILED; parity 0/0/16). All 14 freeze-package
hashes match my own run; 0 widening collisions. Nine of the ten folded findings are
VERIFIED-FIXED (M-1, M-2, M-3, M-4, L-2, L-3, L-5, L-6, I-3; I-1 confirmed pre-existing),
each with a can-fail proof. Two things block landing, both in the bytes about to be
sanctioned:
- **M-A (MEDIUM, new)** `styles-source.css:5081-5085` — H-1's ▲/▼ rider pip paints
  **nothing** under print (`::after` background `rgba(0,0,0,0)`, 0 gold pixels measured);
  the fix-3 report's "`#8a6a00`" claim is false. Fix is one declaration, proven live.
- **2c: DEFECT (LOW).** `BoardView.ts:316` keys the round header off `current_round`
  ALONE; the cell path (`:200`) and the settled mock (`mock6.js:1704`) both also gate on
  `complete`, so a limit-ended `montage-done` prints "ROUND 3 · IN PLAY" over cells that
  all read `past`. One-line fix.
Both move montage print bytes ⇒ `rebaseline.txt`, `widening.txt` and both after-crops must
be regenerated before the sanction ask reaches Scott. No regressions in slice-1/2 surfaces.

## §3 Battery — full run on `eeabdc9` (all logs in `…/scratchpad/rereview2b/logs/`)

| Gate | Expected | Actual | Verdict |
|---|---|---|---|
| `npm run tsc` | clean, exit 0 | clean, `tsc_exit=0` | MATCH |
| `npm run lint` | clean, exit 0 | clean (only the pre-existing `.eslintignore` deprecation notice), `lint_exit=0` | MATCH |
| `rm -f main.js styles.css && npx jest` | 3694 passed / 1 skipped / 195 suites, exit 0 | `Test Suites: 1 skipped, 194 passed, 194 of 195 total` / `Tests: 1 skipped, 3694 passed, 3695 total` / 3 snapshots, 21.7 s, `jest_exit=0` | MATCH |
| `npm run shots` ×2 | 508 PNGs, 0 ERROR, byte-identical | run1 508 / run2 508, 0 ERROR both, `diff shots1.sha shots2.sha` empty (508/508 byte-identical), both exit 0 | MATCH |
| in-run gate lines | see below | all present, both runs | MATCH |
| `check-freeze.sh` | exactly 2 FAILED | exactly `montage--steel-print.png` + `montage--steel-realprint.png` FAILED; **0 other FAILED, 0 `FAILED open or read`**; exit 1 (expected — that is the sanctioned-rebaseline signal) | MATCH |
| `npm run parity` | `0 gap(s), 0 undeclared, 16 declared`, exit 0 | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, `parity_exit=0` | MATCH |

In-run gate lines (verbatim, run 1; run 2 identical):

- `montage track widths OK (success 413.13px === failure 413.13px, montage:mid, 6/3 limits)`
- `chrome host-leak OK (18 family/scheme combos …)`
- `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.14.0; 21 further rules … 0 unclassifiable)`
- `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)` + the 12-record exemption boundary (8 focus-visible disabled, 2 hover no-hit-point, 2 focus-visible visibility:hidden)
- `input host-leak OK (13 input kinds × 6 states … = 154 comparisons … Obsidian 1.14.0)`
- `print-twin parity OK (126 capture ids byte-identical: preview twin === real print)`
- `nested corner-radius OK`

### Freeze package

- `rebaseline.txt` — 2 lines, both `74176eb8ee6b7f82459360f275866b1adc27d502caf94da9d2ff69c485e3b130`.
  `sha256sum -c` against MY run's shots dir: both `OK`, exit 0.
- `widening.txt` — 14 lines = `montage-{mid,done,failed,old-shape,narrow,guide-open,strip-pinned}` × print/realprint.
  `sha256sum -c` against MY run: 14/14 `OK`, exit 0. Twin == realprint within every pair.
- Collision check against the 210-line baseline: `comm -12` of the widening filenames and the
  baseline filenames = **0 hits**. The 2 rebaseline names ARE in the baseline (correct — they are
  the two lines being replaced). The baseline holds exactly 2 `montage` lines today.
- `freeze-baseline.sha256` untouched by me (`git status --short` on it is empty).
- Note: `montage-mid` and `montage-guide-open` share a hash (`424bd573…`) — the guide renders
  expanded in print regardless of its screen disclosure state, so the two fixtures print
  identically. Consistent with the L-2/H-1 print design, not a capture defect.

## §2a — H-1 (strip print layout): **PARTIALLY FIXED** — one new MEDIUM

Probe: `…/rereview2b/probe-h1.mjs` → `…/rereview2b/logs/probe-h1.json`. Six real
Playwright cases (default + mid fixtures; print-preview twin `print=1`, real
`emulateMedia({media:'print'})`, and screen; strip un-pinned and pinned).

### VERIFIED-FIXED (everything except the pip ink)

Measured under print (identical for the print twin AND real print media, `default` and
`mid` fixtures, pinned and un-pinned):

| Claim | Measured |
|---|---|
| rows laid out as a real grid | `.dse-mt__tier-row` computes `display: grid`, `grid-template-columns: 51.36px 204.11px 204.11px 204.11px` (review-2 measured `block` / `none`) |
| 4 tier rows × 3 difficulty columns | `rowCount = 4`, tiers `['low','mid','high','crit']`; head cols `['Easy','Medium','Hard']` |
| badges present | `badgeCount = 4`, `.dse-pr__badge` with the real range strings (`≤11`, `12-16`, `17+`, `crit`), non-zero width |
| seals with their words | `sealCount = 12`; kinds success/failure per book; success ring `rgb(26,122,58)` = `#1a7a3a` (`--dse-turn-done`), failure ring `rgb(170,17,17)` = `#a11` (`--dse-danger`), both 2px, `border-radius: 50%`; each cell carries `.dse-mt__tier-word-kind` + `.dse-mt__tier-word-rider` ("success"/"with a consequence" etc.) |
| L-2 strip hint print-hidden | `.dse-mt__strip-hint` computes `display: none` under print, `display: block` on screen (both pin states). **VERIFIED-FIXED.** |
| dedup, print side | print (both fixtures, both pin states): `.dse-mt__guide-tiers-stub` `display: block`, `.dse-mt__guide-tiers-full` `display: none` |
| dedup, screen side (the fix-3 specificity fix) | screen + strip NOT pinned: stub `display: none`, full `display: block`. screen + strip pinned: stub `display: block`, full `display: none`. **Exactly the contract; VERIFIED-FIXED.** |

Files: `styles-source.css:5024-5104` (the montage print tier), `:5116`/`:5120` (screen-side
flat print-excluded dedup), `:5096` (`.dse-mt__strip-hint { display: none }`).

### NEW FINDING — M-A (MEDIUM): the ▲/▼ rider pip paints **nothing** on paper; the fix-3 report's `#8a6a00` claim is false

**`styles-source.css:5081-5085`** — the print rule for `.dse-mt__tier-pip::before, ::after`
declares `content`/`position`/`inset` only. Its own comment (`:5068-5073`) asserts *"its fill
(`::after`, `var(--dse-vp)`) … already exist[s] in the Steel rule"*. That premise is false:
the Steel declaration that carries the fill is `styles-source.css:4849-4853`
(`.dse-mt__tier-pip::after { inset: 1px; background: var(--dse-vp); … }`), nested inside the
Steel skin tier opened at **`styles-source.css:4078`**
(`[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"]) .dse-mt`) —
it is print-**excluded** by that very guard, and the print block never restates the fill.
Same for the `::before` rim, which the comment correctly writes off.

**Measured (computed style, print, both pseudo-elements, all 7 pips, `default` + `mid`, twin
and real print):**

```
pip ::before  background-color: rgba(0, 0, 0, 0)   clip-path: polygon(0px 0px, 100% 0px, 50% 100%)
pip ::after   background-color: rgba(0, 0, 0, 0)   background-image: none   inset: 0px
```
vs. the same node on screen: `::after` = `rgb(224, 176, 80)`, `::before` = `rgba(176,183,187,0.5)`.

**Measured (real pixels, not computed style)** — a 25×22 px crop centred on the first reward
pip and the first consequence pip, `magick … histogram`:

- print twin AND real print, reward and consequence: colours present are only the seal ring
  `#1A7137`, the card ground `#1E1F1E`, and 3 antialias greys. **Zero gold pixels.**
  (`…/rereview2b/pip-default-{printtwin,realprint}-{reward,consequence}.png`)
- screen, same crop: **45 px of `#DDB053`** + 8 blend px — the pip paints.
  (`…/rereview2b/pip-pinned-screen-reward.png`)

The pip therefore is a correctly-shaped, correctly-seated **13.11 × 10.88 px transparent
box** on paper. Visible in the sanction crops themselves: no ▲/▼ mark sits on any seal in
`sc191-freeze-montage--steel-print-after.png` or
`sc191-freeze-montage-strip-pinned--steel-print-after.png`, while the strip's own printed
legend line one row below still reads *"a rider rides the seal's corner: ▲ with a reward ·
▼ with a consequence"* — a printed legend pointing at a mark the paper does not carry.

**Failure scenario.** A Director PDF-exports the montage. Row `≤11 / Easy` prints a green
success seal with no mark and the words "success / with a consequence"; row `17+ / Easy`
prints an identical bare green seal with "success / with a reward". The legend directly
below promises a corner mark distinguishing them. The rider is still legible from the
words (the colourblind rule holds — meaning survives), so this is not HIGH; but it is the
exact half of review-2 H-1's own failure text (*"no gold pips"*) that fix 3 reported as
fixed and is not, and it is baked into the two `rebaseline.txt` bytes and the 14
`widening.txt` bytes that go to Scott as the sanction ask.

**Also a test-coverage gap that let it through:** `test/dom/elements/montage-strip.test.ts`
(the `SC-191 fix round 3 (H-1/L-2)` describe) asserts the pip's `position: absolute`, the two
`clip-path` polygons, and that the `.dse-mt__tier-pip { … }` block does **not** contain
`--dse-metal-line` — it never asserts the pip has any fill at all, so it passes vacuously on
a pip with zero ink.

**Prescribed fix (one declaration, proven live, do NOT apply — I am the reviewer).** Split
`::after` out of `styles-source.css:5081-5085` and give it the fill:

```css
[data-dse-print="on"][data-dse-element="montage"] .dse-mt__tier-pip::after {
	background: var(--dse-vp);
}
```

Proof it is sufficient (`…/rereview2b/probe-pipfix.mjs`, runtime `addStyleTag` injection,
no file touched): on the print root `--dse-vp` already resolves to **`#8a6a00`** (and
`--dse-metal-line` to `none`, as the comment says). Before injection `::after` background =
`rgba(0,0,0,0)` and the crop has 0 gold px; after injection `::after` = `rgb(138, 106, 0)`
and the same crop has **61 px of `#896A00`** forming the triangle
(`…/rereview2b/pipfix-injected-reward.png`). Add a paired assertion to the strip test that
the print `::after` rule carries `var(--dse-vp)`. Applying this moves the montage print
bytes again, so `rebaseline.txt`, `widening.txt` and both after-crops must be regenerated
before the sanction ask goes to Scott.

### After-crop descriptions (both byte-identical to my own regenerated shots)

`sha256` check: `sc191-freeze-montage--steel-print-after.png` and
`…-realprint-after.png` both `74176eb8…` == my `visual-harness/shots/montage--steel-print.png`;
`sc191-freeze-montage-strip-pinned--steel-print-after.png` `01f3c5c2…` == my
`montage-strip-pinned--steel-print.png`. So the crops ARE the sanction bytes.

**`sc191-freeze-montage--steel-print-after.png`** (1520×2510, the `example.yaml` default
fixture, strip un-pinned). Light-on-dark print ground (the pre-existing, documented harness
artifact). Top: dim eyebrow "Montage Test", title "Cross the Ashfall Wastes", sub-line
"1 hero · one action each per round", and a boxed "Round 1 / 2" chip top-right. Then **"Test
tiers"** and a fully laid-out bordered table: header row `Easy | Medium | Hard`; four tier
rows keyed by the shipped Power-Roll badges `≤11` (red), `12-16` (amber), `17+` (green),
`crit` (gold), each cell a green ✓-in-circle or red ✗-in-circle seal beside two stacked
words ("success" / "with a consequence" etc.). **No ▲/▼ pip is visible on any seal** (finding
M-A). Below the table: the crit sentence, then the legend "a rider rides the seal's corner:
▲ with a reward · ▼ with a consequence" (the ▲/▼ glyphs there are text and do print). Then
the board — `Hero | Round 1 (in play) | Round 2 (to come) | Tally`, one row "Kira / to act /
– / ✓0 ×0". Then the outcome band: hourglass, "This montage / Not started", "2 hero actions
left"; the Successes track (5 empty slots, "5 from Total Success") and the Failures track
(3 empty hatched-capable slots, "3 more ends it"); the partial-success rule line. Then a
hairline and the foot guide, header "Running a montage test · test tiers · limits ·
outcomes", whose "Each test" area shows **only the stub** ("The full tier table is pinned
above the board.") plus the two-column "The montage" / "At the table" blocks. No screen-only
chrome, no strip hint, no ⋯ menu, no bottom action bar. Nothing run-on; the H-1 blob is gone.

**`sc191-freeze-montage-strip-pinned--steel-print-after.png`** (1520×3606, the `mid` fixture
with the strip clicked open). Same head, plus the description paragraph ("Forty miles of
volcanic waste…"), sub-line "5 heroes · one action each per round", chip "Round 3 / 3".
Identical fully-laid-out "Test tiers" table (again **no pips on the seals**) and the same
legend line. Then the full five-hero board: columns `Hero | Round 1 (done) | Round 2 (done) |
Round 3 (in play) | Tally`; each cell a ✓ / ✗ / ⊕ mark over its skill word (Kira Nature ✓ +
Alertness ✓; Bram Endurance ✓ + Lift ✗ with a note-page glyph; Osric Climb ✗ + note glyph,
Search ⊕; Yenna Lead ✓ + Persuade ⊕; Talin Navigate ✓ + Track ⊕), round-3 cells all "to
act", tallies at right. Outcome band: flag glyph, "If it ended now / Partial Success", "5
hero actions left"; Successes track 5 filled + 1 empty ("1 from Total Success"), Failures
track 2 filled **hatched** + 1 empty ("1 more ends it") — the colourblind shape channel
survives print; then the "+3" rule line. Then **Notes**: the two consequence notes with their
`✗ hero round · skill` leads, and a ◆ "One success from Total Success" line. Then the foot
guide, "Each test" again showing **only the stub** (correct — the strip is pinned and prints
its own table), plus the limits/at-the-table columns.

## §2a — the rest of the folded findings

Probe test file (temporary, `test/dom/elements/zz-rereview2-probe.test.ts`, **deleted before
finishing**): 10 tests, all green (`…/rereview2b/logs/probe-jest2.log`). It runs the real
`ElementPipeline`, not a stub.

| Finding | Verdict | How I proved it |
|---|---|---|
| **H-1** | **PARTIALLY FIXED** — layout/badges/seals/words/dedup fixed; pip ink NOT fixed (new **M-A**) | see §2a H-1 above |
| **M-1** | VERIFIED-FIXED | `BoardView.ts:156` `rowActDisabled = !this.canPersist \|\| complete`. On `montage-done` **all 5** per-row chips report `disabled === true`; clicking every one of them mounts **no** modal (`document.body.childElementCount` unchanged) and, after `PERSIST_DEBOUNCE_MS × 3`, `host.replaceSource` has **0** calls. Separately, `new LogActionModal(app, { mode: { kind:'new', hero:'Kira', round: model.rounds + 1 } })` on `fixture-mid` (rounds 3, round 4 requested) opens with `button[aria-label="Log"].disabled === true` — `LogActionModal.ts:400-405` bounds the round `>= 1 && <= this.model.rounds`. |
| **M-2** | VERIFIED-FIXED | `model.ts:176-190` reassembles into §B.5 order. **Fresh model** (`rounds/limits/successes/failures/current_round/_dse_anchor` only, `entries` and `participants` both `undefined` after parse) → `addMontageHero` + `logMontageEntry` → `serialize` top-level keys = `title, description, rounds, success_limit, failure_limit, successes, failures, participants, entries, current_round, _dse_anchor` — exactly §B.5. **Old-shape block** (`fixture-old-shape.yaml`, no `entries`) → `logMontageEntry` + `addMontageHero` → `title, rounds, success_limit, failure_limit, successes, failures, participants, entries, current_round`. In both cases `serialize(parse(parseYaml(out), out)) === out` — the second serialize is byte-identical. |
| **M-3** | VERIFIED-FIXED | Sheet opened through the real bar button: `.dse-mt__sheet-tierhint-diff` texts = `['easy','medium','hard']`; the three `.dse-mt__sheet-tierhint-pair` nodes read `easy≤11`, `medium12-16`, `hard17+` — the word is bound to its badge inside one nowrap pair (`LogActionModal.ts:38-42`, `:272-281`). |
| **M-4** | VERIFIED-FIXED | NEW mode (bar → Log an action…): `.dse-modal__title` matches `^\S+ · round \d+$`, `.dse-mt__sheet-sub` = `next hero yet to act in the round in play`. EDIT mode (click Kira/round 1 on `fixture-mid`): title `Kira · round 1`, sub `recorded as a success with Nature` (`LogActionModal.ts:120-137`, article helper `:61-63`). |
| **L-2** | VERIFIED-FIXED | see the H-1 table above — computed `display: none` under print, `block` on screen. `styles-source.css:5094-5097`. |
| **L-3** | VERIFIED-FIXED | `view.ts:151-154`. On `montage-done` the complete bar's buttons in DOM order are exactly `['Undo','Clear all']` (limit hit → not reopenable), `Clear all` carries `dse-btn--danger`. On a round-exhausted variant (limits raised, `current_round: 4`) they are `['Undo','Reopen','Clear all']`. **Undo reopens:** logged a Success through the real sheet on `fixture-mid` (successes 5/6) → bar flips `data-complete="on"`, persisted `successes: 6`; clicking `Undo` **on that complete bar** → next persist has `successes: 5`, `montageTallies(...).complete === false`, bar back to `data-complete="off"` with `Log an action…` present again. |
| **L-5** | VERIFIED-FIXED | `docs/gm-trackers.md` — the `entries: []` line is gone from the YAML example (`grep -n 'entries: \[\]'` over the file: **0 hits**). |
| **L-6** | VERIFIED-FIXED | `docs/gm-trackers.md:93-99` — the running-totals paragraph ("the block's own kept totals, not something recomputed from the board … never silently overwritten by a recount") is present. |
| **I-3** | VERIFIED-FIXED | `view.ts:275-284` (`openTrackedModal`). Captured the live `MontageView` off a spy on `onMount`, then 4× (open the sheet by clicking a cell → click Cancel): `_children`/`_registeredCallbacks` = `2/2` at start and `2/2 2/2 2/2 2/2` after each cycle — **flat**, both fields. |
| **I-1** | CONFIRMED PRE-EXISTING (drop stands) | `src/elements/negotiation/model.ts:25,33` and `src/elements/counter/model.ts:22,30` both do exactly `stringifyYaml(model).trim()` against a model the pipeline built from `parseYaml(source)` — the identical pair montage uses. 15 element `model.ts` files import `stringifyYaml`. Comment loss is plugin-wide framework behaviour, not montage's. |

### Can-fail proofs (break the FIX, watch the SHIPPED test go red, revert)

Every break was applied to `src`/`styles-source.css`, never to the test, and reverted with
`git checkout --` (`…/rereview2b/canfail.sh`, logs `…/logs/canfail-*.log`):

| Class | Break applied | Result |
|---|---|---|
| H-1 strip | print `.dse-mt__tier-row` `display: grid` → `block` | `montage-strip.test.ts` **1 failed / 18 passed** — "the tier row gets an actual GRID layout under print" |
| M-1 | `rowActDisabled = !this.canPersist \|\| complete` → `!this.canPersist` | `montage.test.ts` **1 failed / 74 passed** — "M-1 guard 1: the per-row … chip is disabled on a complete montage" |
| M-2 | `serialize` body → `return stringifyYaml(model).trim();` | `montage-serialize.test.ts` **2 failed / 39 passed** — both fix-round-3 M-2 tests |
| L-3 | removed `this.buildUndoButton(...)` from the `complete` branch | `montage.test.ts` **2 failed / 73 passed** — the COMPLETE-state bar test and the complete-bar Undo test |
| I-3 | `openTrackedModal` body → `return openManagedModal(this, factory);` | `montage.test.ts` **1 failed / 74 passed** — "I-3: repeated sheet opens/closes do not accumulate permanent closers" |
| 2b input coverage | renamed `.dse-mt__sheet-rollchar` → `.dse-mt__ZZZ-rollchar` in the SC-202 block's rules | `inputHostCoverage` + `inputHostRegrounding` **3 failed / 35 passed**, incl. "elements/montage/LogActionModal.ts: .dse-mt__sheet-rollchar (input, type=number)" |

Tree restored after every break (`git status --short` clean of tracked changes).

## §2b — SC-202 rebase integration: **VERIFIED**

- In MY own `npm run shots` (both runs): `host-copy pin OK (… the host model is verbatim
  Obsidian 1.14.0; 21 further rules … 0 unclassifiable)`; `button host-leak OK (113 button
  kinds × 3 states … = **678** comparisons …)`; `input host-leak OK (13 input kinds × 6
  states … = 154 comparisons against the real Obsidian app.css … Obsidian 1.14.0)`.
- Dead classes: `grep -rn 'dse-mt__skill-input\|dse-mt__char-input' src styles-source.css
  test visual-harness` → **4 hits, all inside comments** documenting the rename
  (`test/dom/theme/inputHostRegrounding.test.ts:26-27`,
  `test/unit/build/inputHostCoverage.test.ts:99-100`, `styles-source.css:15224-15225`).
  **Zero live selectors and zero `src/` call sites.** All 10 rule-side occurrences in the
  SC-202 block now name `.dse-mt__sheet-input` / `.dse-mt__sheet-rollchar` (groups 1, 2, 3
  + the `:focus-visible` list + the exemption note's own list).
- Coverage of the sheet's real inputs is genuine, not asserted-by-comment: the rename
  can-fail proof above shows `test/unit/build/inputHostCoverage.test.ts` goes red naming
  `elements/montage/LogActionModal.ts: .dse-mt__sheet-rollchar (input, type=number)` the
  moment the CSS stops covering it. `.dse-mt__sheet-input` is emitted from
  `LogActionModal.ts:333`/`:375` and `ConfigModals.ts:20,60,67`;
  `.dse-mt__sheet-rollchar` from `LogActionModal.ts:298`.
- One accuracy note on the fix-3 report's wording: this was not a pure rename. The SC-202
  block previously gave the two old montage classes only GROUP-1/3 treatment under a
  documented ancestor-scope exemption; the new pair additionally gets a **GROUP-2
  plain-field rule** (`styles-source.css:15234-15241`) because they sit shallow inside the
  sheet modal. That is the right call and is documented in place — but it is a real added
  rule, not a find-and-replace. It moves no frozen bytes (freeze: only the 2 expected).

## §2c — owner addendum: the "IN PLAY" round-3 header on a complete montage → **DEFECT**

**Answer to the question asked:** the header's label is keyed off **`current_round` ALONE**.

`src/elements/montage/BoardView.ts:316-320`:

```ts
private roundState(round: number): RoundState {
	if (round < this.model.current_round) return 'past';
	if (round === this.model.current_round) return 'current';
	return 'future';
}
```

and the header loop calls it raw — `BoardView.ts:116` `const state = this.roundState(r);`,
`:122-125` `text: state === 'current' ? 'in play' : state === 'past' ? 'done' : 'to come'`.
No completeness term anywhere on that path.

**But the CELL path already has one.** `BoardView.ts:200`:
`const state = complete ? 'past' : this.roundState(round);` — `complete` computed once at
`:70` (`montageTallies(this.model).complete`) and threaded down through
`buildHeroRow(:136,:198)`. So the guard exists in the file; it was inlined at ONE of the two
call sites. `buildHeaderRow(:95)` never receives `complete`.

**Measured on the shipped `montage-done` fixture** (probe, real pipeline):

```
round heads: [["1","past","done"], ["2","past","done"], ["3","current","in play"]]
round-3 cells: Kira/past Bram/past Osric/past Yenna/past Talin/past
complete = true   current_round 3   rounds 3   successes 6/6   failures 2/3
```

So within one render the round-3 **header** says `current` / "in play" while every
round-3 **cell** underneath it says `past`. Visible in
`visual-harness/shots/montage-done--steel-light.png` (crop:
`…/rereview2b/2c-header-crop2.png`): `ROUND 1 done · ROUND 2 done · ROUND 3 **IN PLAY**`, the
round-3 header numeral and label painted in the live teal accent with the teal underline
rule beneath the column, on a card whose band reads Total Success.

**Is `montage-done` limit-ended or round-exhausted?** **Limit-ended, mid-round.**
`successes: 6 >= success_limit: 6` → complete via the success limit;
`isExhausted` is FALSE (`failures 2 < failure_limit 3` and `current_round 3` is not
`> rounds 3`). Round 3 is genuinely unfinished — Osric, Yenna and Talin have no round-3
entry — so this is exactly the "ended mid-round" case the question names, and it is the
only kind of complete montage that can show the mismatch (a round-exhausted one has
`current_round = rounds + 1`, so no header matches `current` at all).

**What the settled mock does — `visual-harness/sc191/mock6.js:1703-1706`:**

```js
function roundState(r) {
	if (d.complete) return 'past';
	return r < m.current_round ? 'past' : r === m.current_round ? 'current' : 'future';
}
```

The mock's guard is **inside `roundState`**, so it governs the header (`mock6.js:1723`,
`:1728`), the cells (`:1773`) and the foot row (`:1911`) alike: on a complete montage the
mock shows **every** round header as `done`, never "in play".

**Classification: DEFECT** (not consistent-with-mock). It diverges from the settled mock and
from the board's own cells in the same render, and it tells a Director a finished montage
still has a live round.

**One-line fix (do NOT apply — I am the reviewer).** Restore the mock's guard at the shared
helper, `src/elements/montage/BoardView.ts:316`:

```ts
private roundState(round: number): RoundState {
	if (montageTallies(this.model).complete) return 'past';
	…
}
```

`montageTallies` is already imported in this file (used at `:70`). The `complete ? 'past' :`
at `:200` then becomes redundant but harmless — removing it too is the tidier version and
makes the file match the mock exactly. Severity if the owner wants one: **LOW** (cosmetic,
one label on one fixture-shape) — but it moves the `montage-done` and `montage-mid`-family
shot bytes, so if it is fixed it must be fixed **before** the freeze package goes to Scott,
not after.

## §2d — regressions in the slice-1/2 surfaces the delta could touch

Scope held to model / serialize / board / outcome band. No regression found.

- **Outcome band:** `OutcomeBandView.ts` is **not in `git diff 9bdcf70..eeabdc9`** at all.
- **model / serialize:** the reassembly in `model.ts:176-190` can only drop a key that
  `parse()` could have put on the model. `parse()` (`model.ts:141-162`) is an explicit
  whitelist of exactly those 11 keys — it never copies unknown YAML keys onto the model —
  so the new fixed-order rebuild is lossless relative to the old `stringifyYaml(model)`.
  Unknown-key loss was already the pre-fix-3 behaviour and is unchanged. `participants`/
  `entries` omit-when-empty in `serialize` matches `parse`'s own omit rules (`:154`,`:157`),
  so no round-trip asymmetry is introduced. Verified live by the two M-2 idempotence checks.
- **board:** the only BoardView change is the added `|| complete` disable term on the row
  chip; cell rendering, tallies, dedup and states are untouched by the delta.
- **bar button order (live state) unchanged:** `Log an action…` · `Undo` · `End round N` —
  the refactor moved `Undo` into `buildUndoButton()` but kept the call before the
  `End round` push (`view.ts:212`). Confirmed by the shipped fix-round-2 bar tests staying
  green.
- **Cross-element:** `check-freeze.sh` reports **0 FAILED besides the 2 expected montage
  lines** across the other 208 baseline entries — no other element's print bytes moved.
- Full jest is green at **3694 passed / 1 skipped / 195 suites**, which includes the whole
  slice-1/2 montage suite.

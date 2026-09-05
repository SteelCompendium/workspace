# SC-191 review 2 — final independent review: slices 3–4 + whole-element integrity

## Executive summary

**Verdict: FIX-ROUND. 1 HIGH, 4 MEDIUM** (plus 6 LOW, 6 INFO).
Battery on `8cd9d30` is fully green and matches the brief exactly: tsc/lint clean; jest **3643 passed / 1 skipped / 192 suites**; shots **508 PNGs, 0 ERROR, byte-identical across two clean sweeps**; freeze **exactly the 2 montage print lines, 0 others**; parity **0 GAPs / 0 undeclared / 16 declared**, exit 0. `rebaseline.txt` (2) + `widening.txt` (14) verify 16/16 against my own runs; the widening is collision-free additions-only. Badge measures **51.25 × 22.14 px, padding 4.608px 4.032px**, digit-identical to a shipped Power Roll badge in the same run; the gold pip is `--dse-vp` #e0b050 + `--dse-sheen-soft` + a 1 px `--dse-metal-line` rim, ▲/▼ per rider, #8a6a00 in print; 7 rider cells, words in every cell; 300 px does not side-scroll; all **eight §C integrity probes PASS in a real vault flow**; all six fix-2 items PASS; a11y clean (0 unnamed, 0 unreachable, 0 `role="table"`).
**H-1:** the cheat-sheet strip has **no print layout** — every strip rule is in the print-excluded Steel tier, but print force-opens every collapsible — so it prints as an unlaid-out run-on blob; **with the strip pinned the printed card loses the tier table entirely** (the guide stands down to a pointer at the blob). This is baked into the exact bytes the sanctioned rebaseline would pin, so it must be fixed and the freeze package regenerated **before** the ask reaches Scott.
**M-1:** on a complete montage the per-row chip stays live and, after `End round N`, writes an entry at `round = rounds + 1` — invisible and un-editable on the board while its tally applies. **M-2:** `entries` serialises out of §B.5's fixed key order on the fresh-block/old-shape path, churning the user's file twice. **M-3 / M-4:** the sheet drops the settled mock's difficulty words on the tier hint and its subject-line title (it repeats its own eyebrow instead).
Nothing was fixed; the worktree is clean at `8cd9d30`.

## Provenance

- Worktree `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `8cd9d30d043d66593e0640d8706b5da8bfa93e67`, base
  `origin/develop` `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` (unmoved).
- `git status --short` at start: **empty** (clean).
- Review diff `7d4451a..8cd9d30 -- src test visual-harness docs styles-source.css CHANGELOG.md`
  (21 files, +3268/−145), plus a coherence skim of `69eb5f7..8cd9d30 -- src/elements/montage`.
- Per-run artifact dir:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/review2/`
- I fixed nothing. Nothing in the worktree was edited except one temporary probe test file,
  removed at the end (path recorded in Artifacts).

## Battery — measured on `8cd9d30`

| Gate | Expected (brief) | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean, exit 0** | `logs/tsc.log`, `logs/tsc.exit` |
| `npm run lint` | clean | **clean, exit 0** (only the pre-existing `.eslintignore` deprecation warning) | `logs/lint.log`, `logs/lint.exit` |
| `rm -f main.js styles.css && npx jest` | 3643 / 1 skipped / 192 suites | **3643 passed / 1 skipped / 3644 total / 192 suites / 3 snapshots, exit 0** | `logs/jest.log`, `logs/jest.exit` |
| `npm run shots` ×2 | 508 PNGs, 0 FAIL, byte-identical | **508 PNGs both runs, identical filename sets, 0 `-ERROR` files; `sha256sum` diff of all 508 across the two runs is EMPTY** | `logs/shots-1.log`, `logs/shots-2.log`, `logs/run1.sha256`, `logs/run2.sha256`, `logs/shots-sha-diff.txt` |
| `check-freeze.sh` | exactly the 2 montage print lines, 0 others | **`montage--steel-print.png: FAILED`, `montage--steel-realprint.png: FAILED` — exactly those two, nothing else** | `logs/freeze.log` |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 16 declared | (see Parity section) | `logs/parity.log` |

Both shots runs were started from an `rm -rf visual-harness/shots` so the producible-name
list is real, not inherited from an earlier sweep.

**Host-copy pin (machine condition, NOT a finding).** Both sweeps exit 1 on
`HOST COPY DRIFTED` (`~/.config/obsidian/obsidian-1.14.0.asar` vs `PINNED_OBSIDIAN =
'1.13.7'`; the bump is SC-202's and has not landed on `origin/develop`). The abort is the
final in-run assertion, strictly after every PNG is written — 508 files present, 0 with the
`-ERROR` suffix `snap()` appends on a real capture failure, and the filename sets of the two
runs are identical. The three in-run assertions that precede it printed OK in **both** of my
runs, the same set slices 3/4 recorded:

```
chrome placement OK (7 element families: inset 10.00px from the card's right edge, 0 border overlap)
montage track widths OK (success 413.13px === failure 413.13px, montage:mid, 6/3 limits)
chrome host-leak OK (18 family/scheme combos: …)
```

The **button host-leak sweep** (`assertBtnHostLeak`) sits behind the abort and did **not**
run in either sweep. Per the brief this is recorded as **owed to the post-SC-202 re-gate**,
not as a finding. I touched nothing in `obsidian-host-pin.mjs`, `shoot.mjs`'s host model,
the `styles-source.css` host listing, or the asar.

## Freeze package — regenerated hashes vs. my own two runs

`rebaseline.txt` (2 lines) + `widening.txt` (14 lines) were concatenated and run through
`sha256sum -c` inside my run-2 shots directory: **16/16 OK, exit 0** (`logs/pkg-check.log`).

- `rebaseline.txt`: both lines `3792de475e245b6b692518f54b8fee5932c41b331afc4d9fb2403d1648d5c32f`
  — twin == realprint, and both names are present in the live 210-line baseline (they are the
  two lines the sanction moves; baseline currently holds `8e5cc6ae…` for both).
- `widening.txt`: 14 lines = 7 new capture ids × twin+realprint
  (`montage-mid`, `montage-done`, `montage-failed`, `montage-old-shape`, `montage-narrow`,
  `montage-guide-open`, `montage-strip-pinned`). Every pair twin == realprint. Scripted
  collision check against the live baseline: **0 hits — additions-only**, so no sanction is
  needed for it.
  Note `montage-mid` and `montage-guide-open` share one hash (`ad135a25…`); that is correct,
  not a mistake — print forces every `kit/collapsible` region open, so the two ids render the
  same page under print.
- `montage-sheet-log` contributes 0 freeze lines (dark/light only — its click target is a
  `.dse-btn`, plugin-wide print-hidden, so the print combos are genuinely un-clickable).
  Confirmed in my own run's name list: only `montage-sheet-log--steel-{dark,light}.png` exist.

**After-print crop, viewed and described:** (see the "Approved-look and print" section below.)

## Parity

`npm run parity` (run LAST, after the freeze check): **0 gap(s), 0 undeclared warning(s),
16 declared deferral(s), exit 0** (`logs/parity.log:30`). Composition unchanged from the
documented set — FOLLOWUPS #39 × 8 rows (`statblock-wrap`/`featureblock-wrap`
margin-top/-bottom × 2 schemes), #51 × 6 rows (`section-tag` font-size/line-height/
letter-spacing × 2 schemes), #40 × 2 rows (`pr-chars:ink` × 2 schemes). No `DEAD
DECLARATION`, no new entry. **Not a finding.**

## Slice 3 — strip + guide, measured

### Badge (spec §J1) — PASS

Playwright probe (`measure.mjs`, one browser session, both surfaces measured from live
`getBoundingClientRect()` + `getComputedStyle()`), montage `mid` at the default width with
the strip clicked open, vs. the shipped Power Roll badge on the `roll` element in the same
run:

| tier | strip `.dse-mt__tier-key .dse-pr__badge` | shipped `.dse-pr__badge` |
|---|---|---|
| `t1` `≤11` | **51.25 × 23.14 px**, padding `4.608px 4.032px`, content width `43.1875px`, `font-size 14.4px` | **51.25 × 23.14 px**, padding `4.608px 4.032px`, content width `43.1875px`, `14.4px` |
| `t2` `12-16` | **51.25 × 22.14 px**, padding `4.608px 4.032px` | **51.25 × 22.14 px**, padding `4.608px 4.032px` |
| `t3` `17+` | **51.25 × 22.14 px**, padding `4.608px 4.032px` | **51.25 × 22.14 px**, padding `4.608px 4.032px` |
| `crit` | **51.25 × 22.14 px**, padding `4.608px 4.032px` | **51.25 × 22.14 px**, padding `4.608px 4.032px` |

Digit-for-digit identical on all four tiers, including the `t1` 1 px taller box — which is
present *identically in the shipped component*, so it is the pre-existing `≤` glyph-height
quirk, not something the strip introduced. `max-width: none`, no inline style, no local
width rule on the badge: §J1's fix is a **grid-track** width
(`.dse-mt__tier-row { grid-template-columns: var(--dse-mt-key, 3.21em) … }`), and the mock's
`width:100%; max-width:4.6em` override is genuinely absent from `src/`. At 300 px the badge
drops to **45.55 × 20.70 px at `font-size 12.8px`** (`--dse-fs-caption`) — the `2.85em`
narrow key §J1 predicts. Log: `logs/measure.json`.

### Pip (spec §J2) — PASS

Measured on both schemes and under print (`pip.mjs`):

- **Fill `--dse-vp`**: `rgb(224, 176, 80)` = `#e0b050` — the **same single value in dark and
  light**, as §J2 requires.
- **Sheen `--dse-sheen-soft`**: `linear-gradient(rgba(255,255,255,0.035), rgba(255,255,255,0))`
  on the fill box.
- **Rim `--dse-metal-line`, 1 px**: outer `::before` `rgba(176,183,187,0.5)` dark /
  `rgba(95,103,108,0.45)` light, fill `::after` at `inset: 1px`.
- **Shape**: reward `clip-path: polygon(50% 0, 100% 100%, 0 100%)` (▲), consequence
  `polygon(0 0, 100% 0, 50% 100%)` (▼), on both rim and fill, keyed off the CELL's
  `data-rider`.
- **Print ink**: `--dse-vp` resolves to `#8a6a00` under print media, exactly §J2's value.
- **Rider count**: **7 of 12 cells** carry a pip; 0 non-rider cells carry one. This matches
  `mock6.js`'s `STRIP6` verbatim (low: Easy+Hard consequence; mid: Medium consequence;
  high: Easy reward; crit: all three reward) — spec §G's prose "six" is the miscount the
  ledger already dropped (2026-09-02 ruling), and I re-derived seven off `mock6.js:545-578`
  independently.
- **Words present in every cell**: `everyCellHasWord: true`; every rider cell also renders
  `with a reward` / `with a consequence` beside the pip.

**Greyscale legibility (colour removed).** With hue stripped, reward vs. consequence is
carried by the **triangle's direction** — ▲ (apex up) reward, ▼ (apex down) consequence —
and, redundantly, by the literal words `with a reward` / `with a consequence` printed beside
every marked cell. The seal itself is a second, independent channel: success is a ✓ glyph in
an open ring, failure an ✗ glyph on a hatched pressed disc (the hatch is a
`repeating-linear-gradient`, i.e. texture, not colour). Colour never carries a distinction
alone anywhere in the strip. Captures: `r2-strip-pinned-dark.png`, `r2-strip-pinned-light.png`.

### 300 px — PASS

`#mount` `scrollWidth === clientWidth === 300` with the strip pinned; `.dse-mt` 264/264,
`.dse-mt__board` 230/230, `.dse-mt__board-wrap` 232/232, `.dse-mt__outcome` 230/230,
`.dse-mt__actionrow` 232/232, `.dse-mt__tier-rows` 204/204 — **no horizontal scroll anywhere
on the card**. The only residual `scrollWidth` excesses are 2–5 px on `.dse-mt__tier-seal` /
`.dse-mt__tier-mark` (the pip is deliberately positioned `right:-0.34em` outside the seal
box) and 2 px on the two `.dse-mt__track`s; none of those nodes is a scroll container and
none reaches the card edge. Capture: `r2-narrow-300-pinned-dark.png`.
With the **guide** open at 300 px, `#mount` is still 300/300; the guide's tier table
overflows its own block (`scrollWidth 352` vs `clientWidth 204`) inside
`overflow-x: auto` — i.e. it side-scrolls in place, which is the round-4 judgment call the
ledger records as standing (2026-08-29, "tier table side-scrolling at 300px … drew no
objection"). Capture: `r2-narrow-300-guide-dark.png`.

### Carry-over tests L-3 / L-4 — PASS, and proven able to fail

Both exist and are real gates, not tautologies. Proven by mutating the production source,
re-running, then `git checkout --` (tree restored, verified):

- L-3 `test/unit/model/montage-serialize.test.ts:320` "participants is omitted when absent,
  and when authored as an empty array". Mutation: `model.ts:155`
  `d.participants.length > 0` guard removed → **FAILS**.
- L-4 `test/dom/elements/montage.test.ts:569` "two same-round notes list in ROSTER order,
  not alphabetical order". Mutation: `OutcomeBandView.ts:161` `rosterIndex` sort key →
  `localeCompare` → **FAILS**.

Exactly those two failed and nothing else (`logs/canfail.log`: `2 failed, 108 passed`).

### Collapsibles — session persistence, zero vault writes, pinned-stub dedup — PASS

Probes `S1`–`S3` (`zzreview2-probes.test.ts`), the first through a real
`ReadingModeBlockHost` + `FakeVault`:

- **S1 — zero vault writes.** Six toggles (strip ×3, guide ×3) inside a real vault flow,
  then three full debounce windows: `app.vault.modifyCalls.length === 0` and the note's
  bytes are `toBe(before)` — identical. Nothing about pinned/open state reaches the note.
- **S2 — independent + persistent.** Opening the guide leaves the strip closed; a *fresh
  host* with the same `SessionStore` and `blockKey` re-renders with the guide open and the
  strip closed, and `replaceSource` was never called.
- **S3 — pinned-stub dedup.** Closed strip: the guide renders **2** `.dse-mt__guide-table`s
  (tiers + limits). Pinning the strip collapses the "Each test" block to
  `[data-stub="on"]` carrying only the title `Each test` and the lede *"The full tier table
  is pinned above the board."* — no table inside it — leaving **1** table in the guide; the
  guide's header hint changes to `limits · outcomes · at the table`. Unpinning restores 2.
  Exactly the ledger's 2026-08-29 / round-5 behaviour.

## Approved-look comparison (captures vs. the ledger PNGs)

Compared, region for region: `montage-strip-pinned--steel-{dark,light}.png` vs
`sc191-r7-pip-gold-{dark,light}.png`; `montage-sheet-log--steel-dark.png` vs
`sc191-r5-sheet-log-dark.png`; `montage-narrow--steel-dark.png` vs
`sc191-r6-pip-narrow-dark.png`; `montage-mid`/`montage-done` vs `sc191-r5-*` and
`mock6.js`'s own `actionBar()`/`sheet()` source.

**Colours named in prose** (Scott is colourblind — every one of these is a second channel,
never the only one):
- Tier badges: **red** `≤11`, **amber** `12-16`, **green** `17+`, **gold** `crit`, each with
  a matching 3 px left edge on its row and a wash fading out at 12 %. The *range text inside
  the badge* is the primary channel; colour only reinforces.
- Seals: success is a **green** open ring around a ✓; failure is a **red** ring around an ✗
  on a dark hatched pressed disc. Glyph + the small-caps word `success` / `failure` beside
  it carry the meaning; the hatch is texture, not hue.
- Pip: a **warm gold** triangle with a **steel-grey** rim on the seal's bottom-right —
  ▲ apex-up = reward, ▼ apex-down = consequence, with the words `with a reward` /
  `with a consequence` printed beside every marked cell.
- Outcome band: verdict word (`Not started` / `Partial Success` / `Total Success` /
  `Total Failure`) plus a flag/hourglass/diamond glyph; the two tracks are outlined slots
  that fill, with the **failure** track's filled slots **hatched** so the two tracks differ
  by texture as well as by hue. The brink alert is a **gold** band whose meaning is carried
  by its sentence (`One success from Total Success`) and a ◆ glyph.
- No crest on any hero name cell (`.dse-mt__board-name [class*=crest]` = **0**). The three
  crest nodes on the card are the card head's own `kit/cardHead` crest (spec §D keeps it)
  and the outcome band's verdict glyph — neither is the hero-cell crest the 2026-08-28
  ruling deleted.
- **No bright white** in dark. In light, the only near-white values on the card are the
  kit's own `.dse-btn` chrome (`rgb(237,240,240)` button ground, `rgb(255,255,255)` label on
  the accent button) — plugin-wide button vocabulary, not montage-authored, and print-hidden.
  Nothing montage-authored is near-white in either scheme (`brightWhite_dark: []`).

**Visible differences from the approved look**, and whether spec/ledger sanctions them:

| # | Difference | Sanctioned? |
|---|---|---|
| 1 | Open sockets show `to act` and the WHOLE cell opens the sheet; the mock draws a ✓/✗/⊕ quick-record trio inside the cell | **Yes** — fix-round-1 M-1, in the ledger's 2026-09-02 fold (a `div[role=button]` cannot nest real buttons) |
| 2 | The ⋯ is the SC-169 hover-revealed chrome panel, not a bar button | **Yes** — spec §D ("Delete `view.ts`'s hand-rolled `iconButton`+`Menu`") |
| 3 | The ⋯ carries FOUR items; the mock's menu and spec §D list five | **Yes** — ledger 2026-09-03 ruling (Clear all moved to the done bar) |
| 4 | The sheet's tier hint renders three bare `.dse-pr__badge`s; `mock6.js:1577-1585` renders each tier as a `diff` word (`easy`/`medium`/`hard`) **plus** the band | **NO** — see M-3 |
| 5 | The sheet's title is the eyebrow repeated; `mock6.js:1518` sets the title to the subject (`Kira · round 3`) | **NO** — see M-4 |
| 6 | The sheet drops the mock's skill hint `optional · +2 when applicable` (`mock6.js:1607`) | **NO** — see L-5 |
| 7 | The strip prints as an unlayouted run-on block | **NO** — see H-1 |
| 8 | The `montage-sheet-log` capture shows the modal with no card box, no backdrop, on a white page ground | **Yes** — harness `Modal`-shim limitation, ledger 2026-09-03 filed as SC-294; slice 4's real-Obsidian `docs/Media/montage-sheet-modal.png` is the substitute |

## The after-print crop — viewed and described

`sc191-freeze-montage--steel-print-after.png` is byte-identical
(`3792de47…`) to `sc191-freeze-montage--steel-realprint-after.png`, to my own run's
`montage--steel-print.png`/`montage--steel-realprint.png`, and to both lines of
`rebaseline.txt` — i.e. the crop IS the frozen shot, verified by `sha256sum`, not a
lookalike.

What it shows, top to bottom: the head (`MONTAGE TEST` eyebrow, `Cross the Ashfall Wastes`,
the `1 hero · one action each per round` deck, a `Round 1 / 2` chip); **then the cheat-sheet
strip, rendered as unstyled flowing text** — a run-together `EasyMediumHard` head line, then
four lines reading e.g. `≤11 ✓successwith a consequence ✗failure ✗failurewith a consequence`
with the three difficulty columns collapsed into one sentence, the words jammed
(`successwith`), the tier badges shrunk to ~18 px boxes with no fill, and no gold pips at
all; then the strip's foot sentence and rider legend, which DO print correctly as ordinary
paragraphs; then the board, which prints correctly (aligned `Hero` / `Round 1` / `Round 2` /
`Tally` columns, `to act`, `−`, `✓0 ✗0`); then the outcome band — hourglass glyph,
`This montage / Not started`, `2 hero actions left`, both limit tracks as outlined empty
slots with the tails `5 from Total Success` and `3 more end it`, and the rule line
`Partial Success needs successes to lead failures by 2 — currently +0.`; then the foot
guide, **expanded and correctly laid out** (`Power roll | Easy | Medium | Hard` with all four
tier rows, the limits table, the five "At the table" bullets). No buttons, no pencil marks,
no `+ Add a hero` — the print rules for write affordances all hold. The whole capture is
dark-on-dark: that is the known shared harness print-ink artifact the ledger already dropped
(2026-09-02, I-7), identical on other elements, not a montage defect.

The contrast between the well-laid-out guide and the unlaid-out strip in the *same* capture
is the direct evidence for finding **H-1** below.

## Integrity probes — spec §C, all eight, in a REAL vault flow

All eight run through `ReadingModeBlockHost` + the `FakeVault`, driving the **production**
sheet/bar/chrome DOM (never a unit stub), in
`/tmp/…/scratchpad/review2/probes/zzreview2-probes.test.ts` (moved out of the worktree at
the end of the review; see Artifacts). Run log: `logs/probes-6.log` — **28 passed / 28**.

| # | §C probe | Result | Probe |
|---|---|---|---|
| 1 | Content above/below the block survives a write | **PASS** — frontmatter, an `# H1`, prose, a sibling ```` ```ds-statblock ```` block and a trailing `## After` section are byte-identical after a real sheet Log; exactly 1 `vault.modify` | `P1` |
| 2 | Two montage blocks in one note don't cross-talk | **PASS** — logging into A leaves B byte-identical to its authored YAML; then logging into B leaves A's post-first-write body byte-identical; 2 writes total. Session state independent too (pinning A's strip leaves B's closed) | `P2` |
| 3 | A hand-edited YAML value survives a re-trigger and the next write | **PASS** — `success_limit: 9`; a second `pipeline.run()` writes nothing (0 `modify` calls), and the next real write still reads `success_limit: 9` alongside the deltaed `successes` | `P3` |
| 4 | A user-deleted block regenerates cleanly from a fresh paste of the example | **PASS** — `example.yaml` mounts to `data-dse-element="montage"` with the board, the 1-hero roster, the `Not started` band and the action bar; rendering writes nothing | `P4` |
| 5 | An old-shape block edited through the UI writes the new shape with nothing lost | **PASS on content, FAIL on key order (see M-2)** — `title`, `success_limit`, `failure_limit`, `failures`, `_dse_anchor`, all prior `skills_used` and the new one survive; `successes: 4 → 5` (a delta, never a recount to 1); a one-item `entries:` list appears. But `entries` is emitted **last**, out of spec §B.5 order | `P5` |
| 6 | A block whose entries disagree with its scalars keeps the scalars | **PASS** — scalars hand-set to 3/1 against 10 entries; the band reads from the scalars, and the next write is `successes: 4`, never a recount to 6 | `P6` |
| 7 | Read-only: every montage control disabled/badged, zero writes | **PASS** — `data-dse-readonly` present; **0** montage `⋯` items; every board and action-bar button `disabled`; all 15 interactive cells carry `aria-disabled="true"` and clicking every one of them opens no sheet; `replaceSource` never called. The only enabled buttons anywhere are the two `kit/collapsible` headers and the framework chrome's own expand/collapse — reading affordances, not writes | `P7` |
| 8 | Rapid repeated edits coalesce into one debounced write | **PASS** — three `End round N` clicks 10 ms apart on an 8-round block produce **1** `vault.modify` and the file lands at `current_round: 6`, never mid-model | `P8` |

Supporting probes beyond the eight: `F1`–`F11` (fix-round-2 controls, sheet a11y, roll
affordance, note round-trip), `S1`–`S3` (collapsibles), `K1`–`K3` (key order, complete-state
row chip, sheet head).

## Fix round 2 — the four ruled items, probed

| Item | Result |
|---|---|
| `End round N` is the ONLY round-advance control | **PASS.** `F1`: logging an action through the real sheet writes `current_round: 3` unchanged. Source audit: `current_round` is written in exactly three places — `parse()` (`model.ts:158`, defaulting), `resetMontageProgress()` (`model.ts:420`, `= 1`), and `endMontageRound()` (`model.ts:438`, `+= 1`). No other mutation helper touches it. |
| `End round N` increments and writes once | **PASS.** `F2`: one click on `End round 3` → exactly 1 `replaceSource`, `current_round: 4`. |
| Ending the final round resolves the outcome band | **PASS.** `F3`: `mid` (3/3) shows `Partial Success` live; after `End round 3` the bar flips to `data-complete="on"`, `Log an action…` is gone, and `Reopen` + `Clear all` appear, verdict still `Partial Success`. |
| `Undo` removes the most recent entry and restores tallies | **PASS.** `F4`: log an assist with `skill: Scout` → written; `Undo` → the new entry is gone (`skill: Scout` absent), tallies back to `successes: 5 / failures: 2`, and the cell reads `data-kind="none"`. `F4b`: `Undo` is `disabled` with no entries. Tie-break is log order (`entries[entries.length-1]`), matching §B.5. |
| Done bar: `Reopen` + danger `Clear all` | **PASS.** `F5`: on `montage-done` (success limit reached) the bar shows **only** `Clear all` — no `Reopen`. On a rounds-exhausted block (`current_round: 4`, `rounds: 3`, neither limit hit) `Reopen` renders; clicking it writes `rounds: 4` and flips the bar back to `data-complete="off"`, i.e. it extends the montage by one round and resumes at the round already current. `F5b`: failure-limit completion also shows no `Reopen`. **Reopen in each end case:** rounds-exhausted → offered, adds one round, play resumes; success-limit reached → not offered; failure-limit reached → not offered; those two are final and `Clear all` is the only way back. Matches the ledger's stated rule. |
| The ⋯ has exactly four items, `Clear all` NOT among them | **PASS.** `F6`: the montage-owned chrome ids are exactly `montage-add-round`, `montage-add-hero`, `montage-set-limits`, `montage-reset-progress`; `montage-clear-all` is `null`. (The panel's other ids — `expand`, `pin`, `collapse` — are the framework's own.) Verified against `mock6.js:1408-1465`'s `actionBar()`: DOM order, labels and the danger variant all match. |

## Sheet, per-cell edit, notes, a11y

- **`openManagedModal` per spec §D — PASS.** `LogActionModal extends DseModal`; `view.ts:249`
  and `:323`/`:334` all go through `openManagedModal(this, factory)`, which registers the
  F1 §4.5 view-unload-closes-modal contract. New and correct-existing flows both work
  end to end through a real vault (`P1`, `P5`, `P6`).
- **Keyboard / Escape — PASS.** `F8`: Cancel writes nothing; closing the dialog the way
  Escape closes it (Obsidian `Modal`'s own default, which `managedModal.ts`'s header says is
  deliberately not reimplemented) writes nothing. The jsdom `Modal` mock has no Escape
  binding of its own, so the keystroke itself is not exercisable in this harness — the
  reachable assertion is that dismissal without pressing Log/Save performs zero writes,
  which holds.
- **A11y — PASS.** `F9`: dialog carries `aria-labelledby` pointing at its title; 0 unnamed
  `button`/`input`/`textarea`; 0 with `tabindex="-1"`; every `[role="group"]` (Hero, Round,
  Result) carries an `aria-label`. On the card itself (`measure.mjs`): 26 controls, **0
  unnamed**, **0 unreachable**, roles present are only `heading` and `button`, and
  `role="table"/"row"/"cell"/"grid"` count is **0** — review-1's M-4 fix is intact. Both
  collapsible headers track `aria-expanded`. 15 cells carry `role="button"` + `tabindex="0"`.
- **Roll affordance — PASS.** `F10`: with `cx.roll` present the sheet renders
  `button[aria-label="Roll a test"]`; clicking it flips the pressed chip to `Success` and
  writes `(14, tier 2) — success` into an `aria-live="polite"` readout. With `roll`
  undefined the button is absent.
- **Per-cell edit + note — PASS.** `F11`: a note typed in the sheet round-trips to
  `data-noted="on"` + a `.dse-mt__cell-notemark` on the cell and the text appears in the
  outcome band. Editing an outcome deltas the stored scalars and the band (existing
  `montage.test.ts` "correcting an entry" plus my `P6`).

## Findings

### HIGH

#### H-1 — the cheat-sheet strip has no print layout, so it prints as an unlaid-out run-on block; with the strip pinned the printed card loses the tier table entirely

`styles-source.css:4628-4900` (the whole `.dse-mt__strip` / `.dse-mt__tier-*` block) sits
inside the Steel skin tier opened at `styles-source.css:4055`
(`[data-dse-theme='steel'][data-dse-element="montage"]:not([data-dse-print="on"]) .dse-mt`).
**Not one strip rule lives above that line** — a scripted check finds zero
`dse-mt__strip`/`dse-mt__tier-` rules below `:4055`. The foot guide, by contrast, has its
*layout* in the structural, print-reaching tier (`:3923-3996`, inside
`[data-dse-element="montage"] .dse-mt` at `:3572`) and only its *colour* in the Steel tier
(`:4552+`). Spec §E names three base-tier exceptions — board grid, outcome band, guide panel
— and the strip was correctly excluded from that list on the assumption it would not render
on paper. It does: the plugin-wide print rule
`.dse-collapse__region[hidden] { display: block !important }` force-opens **every**
`kit/collapsible`, including a strip the Director never opened.

Measured under `emulateMedia({media:'print'})` (`probe2.mjs`): the region's `hidden`
attribute is still set but computed `display: block`; `.dse-mt__tier-rows` and
`.dse-mt__tier-row` both compute `display: block` with `grid-template-columns: none`; the
tier badge measures **18.5 px wide** with a transparent background (vs 51.25 px on screen);
the pip computes `position: static` with a transparent fill. Strip height on paper: 256 px.

**Failure scenario.** A Director exports a montage note to PDF (or hits Ctrl-P). Between the
brief and the board they get a 256 px block of run-together text: a head line reading
`EasyMediumHard`, then four lines shaped
`≤11 ✓successwith a consequence ✗failure ✗failurewith a consequence` — three difficulty
columns collapsed into one sentence, words jammed together, no gold pips, badges reduced to
tiny unfilled boxes. It is unreadable as a table and actively misleading, because nothing
marks where the Easy column ends and Medium begins. **Worse, if the Director had pinned the
strip** (a normal thing to do — it is why the pin exists), the round-5/6 dedup fires and the
foot guide prints only the stub *"Each test — The full tier table is pinned above the
board."* while the thing "above the board" is that blob. The printed card then contains **no
legible tier table anywhere**. Seen directly in `montage-strip-pinned--steel-print.png`,
which is one of the 14 lines `widening.txt` would pin, and in
`sc191-freeze-montage--steel-print-after.png`, which is one of the 2 lines the **sanctioned
rebaseline** would pin. Landing as-is makes this look the new golden and puts it in front of
Scott as the thing he is sanctioning.

**Prescribed fix** (either, both one rule):
1. *Preferred, and smaller.* Hide the strip on paper —
   `[data-dse-print="on"][data-dse-element="montage"] .dse-mt__strip { display: none }`,
   beside the existing `.dse-mt__board-addhero` / `.dse-mt__cell-editmark` print rules at
   `styles-source.css:4947-4958`. Nothing is lost: the foot guide already prints the whole
   book table correctly. It also needs the dedup to stop firing under print, so
   `GuideView.build` must render the full "Each test" block on paper regardless of
   `stripOpen` — cleanest as a print-only CSS pair (render both, `display:none` the stub on
   screen-when-pinned / the table on print) or by having `view.ts:116` pass `false` when the
   host is printing. Without that half, fix 1 alone still leaves the pinned case with no
   table.
2. *Alternative.* Move the strip's **layout** rules (the `.dse-mt__tier-row` grid,
   `.dse-mt__tier-rows`, `.dse-mt__tier-cell`/`-mark`/`-word` flex, the pip's
   `position: absolute`) into the structural tier the way the guide's are, leaving colour in
   the Steel tier — plus the same dedup carve-out, or the strip and the guide stub print as
   a table and a pointer to it.

Either way the two montage print lines move again, so **`rebaseline.txt`, `widening.txt` and
the after crops must be regenerated before the sanction ask goes to Scott.**

### MEDIUM

#### M-2 — `entries` is serialised out of spec §B.5's fixed key order on the old-shape / fresh-block upgrade path, churning the user's file twice

`src/elements/montage/model.ts:350-352` (`logMontageEntry`) does `m.entries = entries` on a
model where `parse()` never materialised the key, because
`src/elements/montage/model.ts:156-157` only assigns `model.entries` when the input already
had entries. JS object key order is insertion order and `serialize()` is
`stringifyYaml(model)` (`model.ts:163-165`), so the new key lands **after**
`current_round` and `_dse_anchor`. Spec §B.5 states the key order as fixed:
`title, description, rounds, success_limit, failure_limit, successes, failures,
participants, entries, current_round, _dse_anchor`.

Measured (`K1`, real vault, `example.yaml` — i.e. the block the docs tell users to paste):

```
write 1 key order: title rounds success_limit failure_limit successes failures participants current_round _dse_anchor entries
write 2 key order: title rounds success_limit failure_limit successes failures participants entries current_round _dse_anchor
```

**Failure scenario.** A Director pastes the documented example, logs their first action, and
the note now holds a block that violates the schema's own stated order. The *next* thing they
log re-parses that file into schema order and re-emits it, so the whole `entries:` list plus
`current_round` and `_dse_anchor` move — a second, gratuitous whole-block diff in their vault
(and in git, for anyone versioning their vault) that no user action explains. §B.5's stated
invariant `serialize(parse(x)) === x` for canonical inputs is also violated for every file
this path produces. The same defect applies to `addMontageHero` (`model.ts:395-399`) for a
block authored without `participants`.

**Prescribed fix.** Materialise the key in schema position rather than appending it. The
minimal, local change is in `parse()`: build the object with the slot present and delete it
when empty — or, since `serialize` owns the contract, have `serialize()` reassemble the model
into the fixed order before stringifying, e.g.

```ts
export function serialize(model: MontageModel): string {
    const ordered = {} as MontageModel;
    if (model.title !== undefined) ordered.title = model.title;
    if (model.description !== undefined) ordered.description = model.description;
    ordered.rounds = model.rounds; ordered.success_limit = model.success_limit;
    ordered.failure_limit = model.failure_limit; ordered.successes = model.successes;
    ordered.failures = model.failures;
    if (model.participants?.length) ordered.participants = model.participants;
    if (model.entries?.length) ordered.entries = model.entries;
    ordered.current_round = model.current_round;
    if (model._dse_anchor !== undefined) ordered._dse_anchor = model._dse_anchor;
    return stringifyYaml(ordered).trim();
}
```

That also closes the `undefined`-valued `entries` key `resetMontageProgress()`
(`model.ts:421`) leaves behind. Add a regression test asserting the emitted key order after a
log on an entries-less model — `test/unit/model/montage-serialize.test.ts` already has the
fixed-key-order test shape to extend, and today it only exercises models that *arrive* with
`entries`.

#### M-1 — on a COMPLETE montage the per-row "Log an action for X" chip stays live, and after `End round N` it writes an entry into a round the board cannot render

`src/elements/montage/BoardView.ts:136-166`: `buildHeroRow` receives `complete` but uses it
only for the cells (`:169`, `:192`). The per-row control at `:149-166` is gated on
`this.canPersist` alone, so it stays enabled on a finished montage even though
`view.ts:141-185`'s action bar has deliberately stood down to `Reopen` + `Clear all` and
`view.ts:147` returns before ever rendering `Log an action…`. Its target round is
`this.model.current_round` (`:148`, `:160`), which after `endMontageRound()` can be
`rounds + 1`.

Measured (`F7`, the real DOM): on `mid` after one `End round 3` click, all **5** row chips
report `disabled: false`; clicking one opens the sheet; the Round chip group renders chips
`1..3` with **`aria-pressed` false on every one of them** (round 4 has no chip), yet
`LogActionModal.refreshValidity` (`LogActionModal.ts:347-350`) only requires
`selectedRound > 0`, so `Log` reports `disabled: false`; clicking it writes
`- hero: … round: 4` and applies the tally. The rebuilt board then has **3** round columns
and **0** cells at `data-round="4"`.

**Failure scenario.** Director ends the last round, then remembers Talin never logged his
action. Talin's row still shows an enabled "Log an action for Talin" chip. The sheet opens
with no round selected — nothing tells them the round is out of range — and Log is live.
They press it. `successes` goes up by one, the outcome band moves, and the entry itself is
invisible on the board and unreachable by the only editor the element has (clicking its
cell), so it can never be corrected or removed through the UI once it stops being the most
recent entry. Only hand-editing the YAML, or `⋯ → Add a round` / `Reopen` (which is not
offered when a limit was hit), brings the column into existence. `K2` shows the weaker
limit-complete variant: on `montage-done` all 5 chips are enabled and logging bumps
`successes: 6 → 7` on a montage the card says is over.

**Prescribed fix.** Two independent guards, both cheap:
1. `BoardView.ts:149` — pass `complete` through and set
   `disabled: !this.canPersist || complete` on the row chip (and give it the same
   real-disabled treatment the rest of the board uses), so the row control stands down with
   the bar it mirrors.
2. `LogActionModal.ts:347` — tighten `refreshValidity` to
   `this.selectedRound >= 1 && this.selectedRound <= this.model.rounds`, so the sheet can
   never commit a round the board has no column for, whatever opens it. Add a test that
   opening the sheet with an out-of-range round leaves `Log` disabled.

#### M-3 — the sheet's tier hint drops the difficulty words the settled mock renders, leaving three unlabelled ranges at the adjudication moment

`src/elements/montage/LogActionModal.ts:242-247` renders the lead `success starts at`
followed by three bare `tierBadge()` calls. The canonical design
(`visual-harness/sc191/mock6.js:1577-1585`) renders each tier as **two** spans — a
`mt5-tierhint__diff` carrying the word `easy` / `medium` / `hard` and a
`mt5-tierhint__band` carrying `≤11` / `12–16` / `17+` — and the mock's own comment calls
this line "the ADJUDICATION MOMENT … the one line the decision actually needs, which is
where each difficulty's SUCCESS starts." Scott approved that surface
(`sc191-r5-sheet-log-dark.png`, which reads `SUCCESS STARTS AT  EASY ≤11  MEDIUM 12–16
HARD 17+`).

Measured (`K3`): the shipped hint's full text content is `success starts at≤1112-1617+`.

**Failure scenario.** A Director rolls a 13 on a Hard test and opens the sheet to adjudicate.
The hint shows three ranges with no difficulty attached to any of them. To use it they must
already know that the badges are ordered easy→hard — which is exactly the fact the hint
exists to supply. For a colourblind reader the badges' red/amber/green is not a usable
substitute for the missing words.

**Prescribed fix.** Render the difficulty word beside each badge, per the mock: in
`renderResultField`, wrap each `tierBadge()` in a span that also carries a
`.dse-mt__sheet-tierhint-diff` label (`easy`/`medium`/`hard`), and give the pair a `nowrap`
group so the line wraps between the lead and the group, never between two tiers (the mock's
own stated rule). Extend the sheet a11y test to assert all three words are present.

#### M-4 — the sheet's title repeats its own eyebrow and drops the mock's subject line, so a pre-filled dialog no longer says which row it will write

`src/elements/montage/LogActionModal.ts:103-113`. New mode sets the modal title to
`Log an action` (`:103`) and then writes the *same string* as the eyebrow (`:107`). The
canonical mock (`visual-harness/sc191/mock6.js:1508-1524`) sets eyebrow = `Log an action`,
title = **`Kira · round 3`** — the row the sheet will write — and sub = `next hero yet to act
in the round in play`, with the explicit comment: *"Naming it in the title is what makes a
pre-filled dialog safe: you can see what it will change before you change anything."*
Edit mode has the same loss: mock title `Bram · round 2` / sub `recorded as a failure with
Lift`, shipped title `Correct a logged action` / sub `change who / round / result / skill
together — nothing writes until Save`.

Measured (`K3`):
`{"title":"Log an action","eyebrow":"Log an action","sub":"nothing writes until Log"}`.

**Failure scenario.** A Director clicks a cell on a five-hero, three-round board to correct
an entry. The dialog says only "Correct a logged action" — nothing names *which* hero and
round is loaded. The Hero and Round chip rows do show the selection, but they are also
editable controls, so the safety property the mock designed for (read the subject before you
touch anything) is gone; a mis-clicked cell is corrected without the Director noticing which
one they were on.

**Prescribed fix.** In `onOpen`, set `setDseTitle(`${hero} · round ${round}`)` from the
resolved selection and keep `Log an action` / `Correct` as the eyebrow only; restore the
mock's sub-lines (`next hero yet to act in the round in play` for new mode, a one-line
summary of the recorded entry for edit mode). Assert title ≠ eyebrow in the sheet test.

### LOW

- **L-1 — the sheet CSS block's comment claims a Steel scoping gate it does not have.**
  `styles-source.css:4970-4977` says "every rule below still carries the Steel scoping gate
  for consistency with the rest of the sheet, the same choice `.dse-condal-modal` made." The
  block (`:4978-5300`) contains **zero** `[data-dse-theme='steel']` selectors; the cited
  precedent's block has **four** (`:1918`, `:1986`, `:2040`, `:2100`). Harmless today (Steel
  is the only theme since SC-144, and a modal never prints or freezes) but the comment is
  false, and the polarity/no-white audits future reviewers run key off exactly these gates.
  *Fix:* either add the gate to the visual rules or correct the comment to say the sheet is
  deliberately ungated because there is one theme.

- **L-2 — the strip's screen-state hint prints.** `src/elements/montage/StripView.ts:93-96`
  appends `pinned` / `easy · medium · hard` to the header; the header is print-visible, so the
  paper copy reads `Test tiers pinned` (visible in `montage-strip-pinned--steel-print.png`).
  "Pinned" is a screen affordance state and means nothing on paper. *Fix:* print-hide
  `.dse-mt__strip-hint` alongside whatever H-1's fix does with the strip.

- **L-3 — logging the winning success removes `Undo` in the same breath.**
  `view.ts:141-147`: when the logged entry reaches `success_limit`, `montageTallies().complete`
  flips true and the bar stands down to `Reopen`/`Clear all` — so the `Undo` for the entry that
  *just* completed the montage is gone. (`Reopen` is also withheld because a limit was hit, per
  the ruling.) Recovery exists — click the cell, press `Remove` — but the one-click undo the
  Director just earned is exactly the case they are most likely to need. *Fix:* keep `Undo` in
  the complete-state bar when `entries` is non-empty, or note the Remove path in
  `docs/gm-trackers.md`'s "Undoing the last thing you logged" paragraph.

- **L-4 — the sheet drops the mock's skill hint.** `LogActionModal.ts:297-310` renders no hint
  under the Skill field; `mock6.js:1607` renders `optional · +2 when applicable` there (in the
  non-warning slot, a distinction round 4/5 spent effort establishing). The `+2` is a rule the
  Director needs at the same moment as the tier hint. *Fix:* add the hint span, using
  `.dse-mt__sheet-hint` (already defined at `styles-source.css:5052`), not `.dse-mt__sheet-warn`.

- **L-5 — the documented YAML example teaches a shape the serializer deliberately deletes.**
  `docs/gm-trackers.md:83` shows `entries: []`. §B.5 forbids emitting `[]` and
  `sanitizeEntries` (`model.ts:118-139`) returns `undefined` for it, so the first write
  silently removes the line the doc told the user to type. *Fix:* drop `entries: []` from the
  example (the key is created on first log), or show it with one real entry.

- **L-6 — "stored, never recomputed" is in the changelog but not in the user docs.**
  `CHANGELOG.md` explains that `successes`/`failures` are authoritative and never recounted
  from the board; `docs/gm-trackers.md`'s montage section never mentions it. A user who
  hand-edits `successes:` (or opens a pre-SC-191 block) sees a board and a banner that
  disagree with no explanation and no recount affordance — and §B.3 says no recount ships,
  deliberately. Under Scott's rule that anything withheld gets documented, this is the one
  behaviour that qualifies. *Fix:* one sentence in the montage section — the tallies under the
  banner are the running totals kept in the block, the board shows the individual tests, and
  the tracker never re-derives one from the other.

### INFO

- **I-1 — YAML comments inside a `ds-montage` block do not survive the first write.** Probe
  `P5b`: a `# my montage` comment is gone after one logged action. This is the plugin-wide
  `stringifyYaml` round-trip property (every persisted element behaves this way), not a
  montage regression — recorded because the brief asked about "comments if any".
- **I-2 — the `montage-sheet-log` capture has limited review value.** The harness `Modal` shim
  renders no card box, no backdrop, and the page ground behind it is white even in the dark
  combo. Ledger 2026-09-03 filed this as SC-294 and slice 4's real-Obsidian
  `docs/Media/montage-sheet-modal.png` is the substitute; the capture still proves the sheet's
  own DOM/theming, which is what it is for.
- **I-3 — every sheet open adds a permanent closer to the view.**
  `openManagedModal(this, …)` (`view.ts:249`, `:323`, `:334`) registers
  `owner.register(() => modal.close())` on the long-lived `MontageView`, and `commit()`'s
  `update()` does not clear the view's own registrations. `close()` is idempotent so each is a
  no-op after dismissal; the cost is one closure per sheet open for the life of the rendered
  block. Matches the SC-186 precedent; noted, not asked to change.
- **I-4 — the light scheme's brightest values on the card are kit chrome, not montage CSS.**
  `rgb(237,240,240)` `.dse-btn` ground and `rgb(255,255,255)` on the accent button's label —
  both plugin-wide `kit/iconButton` vocabulary and both print-hidden. Dark scheme has zero
  values with all channels ≥ 235. The ledger's 2026-08-26 "bright white must go" ruling was
  about the hero crest and the test-result circles, both of which are gone (0 crests in any
  hero name cell; the seals are ringed, not filled).
- **I-5 — the button host-leak sweep did not run** in either of my shots sweeps: the SC-205
  host-copy pin aborts first (Obsidian 1.14.0 vs pinned 1.13.7, SC-202's bump not yet on
  `origin/develop`). Owed to the post-SC-202 re-gate, per the brief — not a finding, and I
  changed nothing about the pin, the host model, the listings or the asar.
- **I-6 — spec §G's "six rider cells" is still wrong at seven** in the spec text; the code and
  tests are right (I re-derived seven independently off `mock6.js:545-578`). The ledger already
  dropped this (2026-09-02); repeated only so the spec text does not get treated as a gate by a
  future reader.

## Docs (spec §H) — PASS with two LOW notes

- **`docs/gm-trackers.md`** "Montage Test tracker (`ds-montage`)" is rewritten in plain,
  user-facing language and describes the element **as shipped after fix round 2**: logging via
  the bar button / a cell click, correcting via the pencil-marked cell, the Note field and
  where notes surface, the skill-reuse warning ("it never blocks you"), both collapsibles,
  **End round N** named as "the only way to advance the round short of hand-editing the
  block", **Undo** scoped to "the single most recent entry", the done-state **Reopen** vs
  **Clear all** with the limit-is-final distinction spelled out, and the **four** ⋯ items with
  an explicit note that Clear all and Reset progress are the same reset reached two ways. Two
  images are wired: `Media/montage.png` (regenerated off the `mid` fixture, bar now showing
  Log/Undo/End round 3) and `Media/montage-sheet-modal.png` (real-Obsidian modal capture).
- **Deferral rule** ("anything we are delaying needs to get clearly documented"): nothing in
  slices 3–4 ships deferred behaviour that reaches a user undocumented, which matches the
  owner ruling of 2026-09-02. The one behaviour that is deliberately *withheld* and not
  documented anywhere a user reads is the no-recount rule — see **L-6**.
- **dse `CHANGELOG.md`** — one `[FEATURE]` bullet under `## 7.0.0 (unreleased)`, in the repo's
  existing voice, naming `description` and `entries[]`, the additive/no-migration story, the
  bar's four controls and the ⋯'s four items (corrected by fix round 2). Present and accurate.
- **`docs/migrating-to-7.md`** — a feature-list bullet at :222, no migration note (correct per
  §B.4: purely additive).
- **Workspace `CHANGELOG.md` `## Unreleased` bullet — correctly placed.** It exists **only** in
  the worktree superproject
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/CHANGELOG.md`
  (uncommitted, `M CHANGELOG.md`, as the brief instructs). The shared main checkout
  `/home/scott/code/steelCompendium/workspace/CHANGELOG.md` has **no** SC-191/montage bullet
  under `## Unreleased` — grep finds montage only in dated historical entries at :381/:422/:428.
  The main checkout's `git status --short` shows only the pre-existing `m draw-steel-elements`
  submodule marker. Nothing of mine touched it.

## Regression checks on slices 1–2 (not re-reviewed, per the brief)

- Whole-element diff `69eb5f7..8cd9d30 -- src/elements/montage` skimmed for coherence: the
  slice-1/2 surfaces (`model.ts` parse/serialize/`montageOutcome`/`montageTallies`/
  `montageBandCopy`, `HeadView`, `BoardView`, `OutcomeBandView`, the five fixtures) are
  extended, never rewritten; `RoundTrackView`/`ParticipantsView` are deleted as planned.
- Review-1's folded fixes are still in place and still load-bearing: H-1 (`partial` no longer
  gated on `exhausted`, `model.ts:195-200`), L-1 (vacuous-limit tails, `model.ts:487-508`),
  L-2 (an unrecognised `result` is preserved and its note survives, `model.ts:96-139` +
  `BoardView.ts:193-220`), L-6 (one shared per-hero dedup, `BoardView.ts:321-334`), M-1 (cell
  is a `div[role=button]`, not a nested real button), M-4 (`role="table"` count is **0** on the
  live card; the tally cell carries a readable `aria-label`), L-3/L-4 (proven able to fail
  above), H-2 (`.dse-mt__board-addhero` print-hidden — verified 0 visible under print).
- Freeze moved exactly the two lines slice 2 moved and no others, across both of my sweeps,
  which is the byte-level statement that slices 3–4 broke nothing in the frozen surface.

## Artifacts

All under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/review2/`:

- **Probe suite (the eight §C probes + 20 more):** `probes/zzreview2-probes.test.ts` — moved
  here from `test/dom/elements/` at the end of the review so the worktree is clean. To re-run:
  copy it back to `<clone>/test/dom/elements/` and
  `npx jest test/dom/elements/zzreview2-probes.test.ts`.
- **Measurement probes:** `measure.mjs` (badge box vs shipped Power Roll badge, pip census,
  300 px overflow, bright-white sweep, a11y sweep, print twin), `pip.mjs` (pip fill/rim/clip
  per scheme + print ink), `probe2.mjs` (guide narrow overflow, strip under print, crest
  placement).
- **Gate logs:** `logs/tsc.log` `logs/lint.log` `logs/jest.log` (+ `.exit` files),
  `logs/shots-1.log` `logs/shots-2.log` `logs/run1.sha256` `logs/run2.sha256`
  `logs/run1.names` `logs/run2.names` `logs/shots-sha-diff.txt` `logs/freeze.log`
  `logs/parity.log` `logs/pkg-check.log` `logs/canfail.log` (L-3/L-4 can-fail proof)
  `logs/probes-1.log`…`logs/probes-6.log` `logs/measure.json` `logs/measure.err`.
- **Captures I made:** `r2-strip-pinned-dark.png`, `r2-strip-pinned-light.png`,
  `r2-narrow-300-pinned-dark.png`, `r2-narrow-300-guide-dark.png`,
  `r2-print-twin-fullpage.png`, `r2-cmp-shipped-strip.png`, `r2-cmp-sheet-bottom.png`,
  `r2-crop-strip-pinned-print-top.png`, `r2-crop-strip-pinned-print-bot.png`.
- **Freeze package reviewed (not modified), ledger dir
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`:**
  `rebaseline.txt`, `widening.txt`,
  `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png`.
- **This report:**
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-review2-report.md`

`git status --short` in the clone at the end: **empty**. In the worktree superproject:
`M CHANGELOG.md` + `M draw-steel-elements` — both pre-existing (slice 4's uncommitted
workspace bullet and the inherent submodule pointer diff), neither mine. I fixed nothing and
edited no shipped file; the two temporary source mutations used for the L-3/L-4 can-fail
proof were reverted with `git checkout --` and re-verified.

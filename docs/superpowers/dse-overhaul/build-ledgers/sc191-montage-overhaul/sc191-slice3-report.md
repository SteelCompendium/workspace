# SC-191 slice 3 report — the reference surfaces: cheat-sheet strip + foot guide, badge fix, gold pip

## Executive summary

STATUS: DONE. Base `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` (matched dispatch, no rebase,
no `npm ci`). Commit `0c8fc27ac0d50fe2c75383aaecaeedaddb4865e0` on `sc191-montage-overhaul`,
not pushed, no tag. Two new `kit/collapsible` regions — `StripView` (cheat-sheet, closed by
default, above the board) and `GuideView` (foot rules panel, closed by default, expanded in
print) — session-persisted, reading nothing from the model. The strip's tier badges are the
real shipped `tierBadge()` DOM (§J1's fix: no width override, the key GRID TRACK is sized
instead); the rider mark is a CSS-only gold pip (§J2). Battery: tsc/lint clean, jest
3593/1 skipped/192 suites, shots 506 PNGs (498+8 new) byte-identical ×2 with 0 ERROR files,
freeze exactly the 2 slice-2 montage lines FAILED (0 others), parity 0/0/16. `npm run
shots`'s own exit code is 1 from an **unrelated, machine-wide, pre-existing** SC-205
host-copy-pin drift (Obsidian self-updated to 1.14.0 past the pinned 1.13.7) that aborts the
sweep's *final* in-run assertion on every DSE branch here, strictly *after* all 506 shots are
written — the reported numbers above are unaffected. Badge measured 51.25×22.14px, padding
4.608px/4.032px, identical to the shipped Power Roll badge (3 of 4 tiers; the 4th matches a
pre-existing, unrelated glyph quirk in both). 300px does not side-scroll. Greyscale legible.

## Base / commit

- `git fetch origin develop`: tip `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732` — matched the
  dispatch-expected `69eb5f7` exactly. No rebase, no `npm ci` needed.
- Branch tip before this slice: `7d4451a` (fix round 1). Slice 3 commit:
  `0c8fc27ac0d50fe2c75383aaecaeedaddb4865e0` — "SC-191 slice 3 — strip, guide, badges, gold
  pip". Not pushed. No tag/release created. Superproject pointer untouched: `git status
  --short` in the superproject worktree shows only the inherent working-tree submodule
  pointer diff, `git diff --cached --stat` is empty (never staged).

## Scope delivered

- **`src/elements/montage/StripView.ts`** (new) — the cheat-sheet strip. `kit/collapsible`
  (`persist: {session, blockKey, slot: 'montage.strip'}`, `open: false`), a hint span
  ("pinned" / "easy · medium · hard") appended to the header. Content: a `.dse-mt__strip-well`
  holding a head row (Easy/Medium/Hard columns) and four tier rows (low/mid/high/crit), each
  row's key built by `kit/tierBadge()` — the real `.dse-pr__badge .dse-pr__badge--{t1,t2,t3,
  crit}` DOM, not a lookalike — and three cells (seal + optional pip + words). Foot sentence +
  legend. Reads nothing from the model (spec §B.2 — pure rules text, transcribed once from the
  canonical `mock6.js`'s `STRIP6` and Draw Steel Heroes:20471).
- **`src/elements/montage/GuideView.ts`** (new) — the foot rules panel. `kit/collapsible`
  (`slot: 'montage.guide'`, `open: false`). Three blocks: "Each test" (the full four-tier ×
  three-difficulty table, or — when the strip is pinned open — a one-line pointer stub with
  **no** orphan line, since round 6's strip already carries the crit row the round-5 stub had
  to state separately), "The montage" (limits by difficulty), "At the table" (five rules).
- **`src/elements/montage/view.ts`** — mounts both between brief/board and after the outcome
  band respectively, at `blockKey = this.cx.host.blockKey()`. The strip's `onToggle` fires
  `() => void this.update(this.model)` — a full unload-children-and-remount (the same shape
  Reset already uses, never persisted, never writes the note) — so a LIVE toggle keeps the
  guide's dedup correct without the two views reaching into each other; the guide's own toggle
  is a synchronous, kit-only DOM show/hide (no rebuild needed, its content never depends on
  anything else).
- **`styles-source.css`** — **§J1's fix**: the mock's bug (`.mt6-row__key .dse-pr__badge {
  width: 100%; max-width: 4.6em }`, a 45% stretch past the shipped 51.25px box) is *deleted by
  never being written* — `.dse-mt__tier-key` carries no width/max-width rule on the badge at
  all. Instead the GRID TRACK is sized to the badge's own border box:
  `grid-template-columns: var(--dse-mt-key, 3.21em) repeat(3, minmax(0, 1fr))`, narrowing to
  `2.85em` under `@container dse-mt (max-width: 420px)` (plus a font-size-only, non-width
  narrow rule on the badge itself, since 2.85em is the badge's border box at
  `--dse-fs-caption`, not the row's default `--dse-fs-secondary` — the math in §J1's own
  citation). The tier wash is `.dse-pr__row`'s `--t`/`--tw` recipe copied verbatim at `edge`
  reach (12%, ledger 2026-08-30). **§J2's pip**: CSS-only (no `<svg>`) — an outer clipped box
  in steel-grey (`--dse-metal-line`) with a fill box inset 1px in gold (`--dse-vp`) plus a
  faint top-down sheen (`--dse-sheen-soft`), `clip-path: polygon(...)` for ▲ (reward) / ▼
  (consequence), keyed off the cell's `data-rider`. **Tier placement**: the guide's LAYOUT is
  in the structural (print-reaching) tier — one of spec §E's three named exceptions, alongside
  the board grid and outcome band; the guide's COLOUR is Steel-only. The strip's whole block
  (layout + colour, one tier) is Steel-only/print-excluded — spec §E does not name it as
  needing print reach.
- **`visual-harness/entry.ts`** — `montage-strip-pinned` / `montage-guide-open`
  `INTERACTION_SHOTS` entries (one real click each on `.dse-mt__strip .dse-collapse__header` /
  `.dse-mt__guide .dse-collapse__header`, fixture `mid`).

## A finding worth flagging plainly: spec §G's rider count

Spec §G's test-description prose says "the pip renders on exactly the six rider cells." The
**canonical source** — spec §A's own design freeze, which names `mock6.js`'s `STRIP6` constant
authoritative, and the book table it transcribes (Draw Steel Heroes:20471) — carries **seven**:
low (≤11) has two ("with a consequence" on Easy and Hard), mid (12-16) has one (Medium), high
(17+) has one (Easy), and crit has three (all three difficulties, "success with a reward" on a
nat 19-20). Counted directly off `mock6.js:545-578`'s `STRIP6.rows`, not a guess — and
StripView.ts transcribes that data verbatim (spec §B.2/§D: read nothing but rules text). This
is a miscount in the spec's own prose against its own cited source, not a design conflict
between two decisions — I implemented and tested the number the canonical data actually
produces (seven), and did not silently drop a rider the book states. Documented in
`montage-strip.test.ts`'s file header and its own test name. No code decision was needed; this
is a documentation-accuracy note, filed under Follow-ups below.

## Tests

- **`test/dom/elements/montage-strip.test.ts`** (new, 12 tests): both regions closed by
  default (aria-expanded/hidden, correct DOM position — brief→strip→board→outcome→guide);
  clicking the strip persists ONLY to `SessionStore` at `(blockKey, 'montage.strip')`, never
  `host.replaceSource`; the guide persists independently at `(blockKey, 'montage.guide')`; open
  state persists across a re-render (fresh host, same session+blockKey); **spec §C integrity
  probe 2, applied to session state**: two blocks under one session store keep independent
  strip/guide state; a LIVE strip toggle rebuilds the element so the guide's dedup follows
  immediately (checked both directions: pin → stub, unpin → full table restored); the four tier
  rows carry `.dse-pr__badge--{t1,t2,t3,crit}` and the shipped range strings in book order, with
  no inline style on the badge; the pip renders on exactly the seven rider cells (not spec §G's
  "six" — see above), keyed off `data-rider`, never on a bare cell, including the crit row's
  three; every rider states its word beside the pip; the closed-strip guide renders the full
  "Each test"/"The montage"/"At the table" content; keyboard/a11y (real tab-reachable
  `<button>`s, non-empty accessible name, `aria-expanded` tracked); source hygiene (style
  guard).
  **Shown red**: `git stash push -u -- <the 5 touched/new source files>`, re-ran the file
  against the pre-slice tree → all 12 tests failed (`Cannot read properties of null` on the
  header queries, `ENOENT` on the style-guard file reads) — log:
  `.../scratchpad/sc191-slice3/jest-strip-red.log`. Stash popped, re-verified 12/12 green —
  log: `.../scratchpad/sc191-slice3/jest-strip-2.log`.
- **`test/unit/model/montage-serialize.test.ts`** (extend, fix-round-1 L-3 follow-up): one new
  test, "participants is omitted when absent, and when authored as an empty array" — mirrors
  the existing `entries` omission test, pinning the `d.participants.length > 0` guard
  specifically (the fix itself landed in fix round 1; this closes the coverage gap the
  follow-up named).
- **`test/dom/elements/montage.test.ts`** (extend, fix-round-1 L-4 follow-up): one new test,
  "L-4: two same-round notes list in ROSTER order, not alphabetical order" — an inline fixture
  with roster order `[Yenna, Bram]` (Yenna first in `participants`) and `entries[]` authored
  `[Bram, Yenna]` (Bram first), so roster order, alphabetical order and authored-array order all
  disagree; asserts Yenna's note lists first. The existing `mid`-fixture test only ever
  exercised the case where roster and alphabetical order coincide (the gap the follow-up
  named).

## Gates — full `dse-verify` battery, final tree, post-commit

| Gate | Expected (dispatch) | Measured | Log |
|---|---|---|---|
| `npm run tsc` | clean | **clean** | `tsc-final.log` |
| `npm run lint` | clean, exit 0 | **clean, exit 0** | `lint-final.log` |
| `rm -f main.js styles.css && npx jest` | 3579 + new | **3593 passed / 1 skipped / 192 suites** (+14: 12 in montage-strip.test.ts, 1 in montage-serialize.test.ts, 1 in montage.test.ts) | `3-jest-final.log` |
| `npm run shots` ×2 | 498+new ids, 0 FAIL, byte-identical | **506 PNGs both runs (498 + 8 new: montage-strip-pinned×4, montage-guide-open×4), 0 ERROR-suffixed files; `sha256sum` of all 506 files byte-identical across the two runs (empty diff)** — see "The host-pin condition" below for why the sweep's own exit code needed a second measurement path | `run1.sha256`, `run2.sha256`, diff empty |
| `check-freeze.sh` | exactly the 2 montage lines, 0 others | **`montage--steel-print.png: FAILED`, `montage--steel-realprint.png: FAILED` — exactly those 2, verified against BOTH shot runs independently** | `freeze-1.log`, `freeze-2.log` |
| `npm run parity` (last) | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, real exit 0 (parity's own script never calls the host-pin check — unaffected by the condition below) | `parity-1.log` |

**Freeze — the exactly-2-lines acceptance criterion, verified directly, twice:**
```
FREEZE VIOLATED:
montage--steel-print.png: FAILED
montage--steel-realprint.png: FAILED
```
No other line failed, in either of the two independent shot runs. `rebaseline.txt` **NOT
touched** (brief §2: "Do not regenerate rebaseline.txt here — slice 4 regenerates it from the
final tree"). Path (unchanged from fix-1):
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt`.

### The host-pin condition — a real, machine-wide, pre-existing environmental abort, not a regression

Obsidian self-updated on this machine to `1.14.0` (`~/.config/obsidian/obsidian-1.14.0.asar`),
newer than the SC-205 host-copy pin's modelled version (`PINNED_OBSIDIAN = '1.13.7'` in
`visual-harness/obsidian-host-pin.mjs`). A full (unfiltered) `npm run shots` therefore aborts
with `HOST COPY DRIFTED` + `process.exit(1)` at its **final** in-run assertion
(`assertHostCopyPinnedToObsidian`, called after `assertChromeHostLeak` and before
`assertBtnHostLeak`) — on **every** DSE branch on this machine right now, confirmed
independently by a peer agent working a different DSE worktree concurrently who hit the exact
same asar path/version. Per that agent's explicit, sound guidance (and my own judgement): I did
**not** touch `PINNED_OBSIDIAN`, `obsidian-host-pin.mjs`, or `shoot.mjs`'s host model — that is
a develop-level chore owned elsewhere, and fixing it here would collide with it.

**Why the reported numbers above are still trustworthy despite the abort:**
- Image capture (`snap()`, all 506 PNGs) runs to completion **before** the final assertion
  phase — the abort happens strictly after every shot (including all new montage ids) is
  already written to disk. 0 files carry the `-ERROR` suffix `snap()` appends on a real capture
  failure.
- `check-freeze.sh` and the `sha256sum` byte-identical comparison read files directly off disk
  — neither depends on `shoot.mjs`'s own exit code.
- `npm run parity`'s own script (`plugin-capture.mjs` + `diff.mjs`) never calls the host-pin
  assertion at all — confirmed by inspection (`grep` for the function name across
  `visual-harness/parity/`, zero hits) — so parity is entirely unaffected.
- A **narrowed** `--element=montage` run (`node visual-harness/shoot.mjs --element=montage`)
  skips the host-pin/chrome assertions by construction (`if (!args.element) { … }` guards them
  in `shoot.mjs`) and completes its **full** pipeline green, including montage's own in-run
  gates: `print-twin parity OK (8 capture ids byte-identical: preview twin === real print)`,
  `nested corner-radius OK`, and `montage track widths OK (413.13px === 413.13px)` — log:
  `.../scratchpad/sc191-slice3/shots-montage-1.log`.

**A second finding along the way — a devbox exit-code footgun beyond `dse-verify` SKILL.md's
documented cases.** `devbox run -- bash -c '<cmd>; echo X=$?'`, even single-quoted with no
pipe, reported `X=0` for a `process.exit(1)` call — reproduced with a 2-line minimal repro
(`console.log("before exit"); process.exit(1);`), which the SAME devbox wrapper reported as
`X=0` while plain `bash -c` (no devbox) correctly reported `X=1`. This is why the numbers above
come from **plain `bash`/`npm`/`node`** runs (confirmed on-PATH via nvm, identical
`node --version`/`npm --version` to the devbox-wrapped ones) rather than `devbox run --` for
every exit-code-sensitive step in this slice's final verification pass — `tsc`/`lint`/`jest`
were still run via the standard devbox wrapper per the brief, but those three are read from
their own printed **content** (an empty tsc/lint output, jest's `Tests:` summary line), never
from exit code, so the devbox bug does not touch their trustworthiness. Filed as a Follow-up
below — worth adding to the skill.

## Acceptance criteria — measured

- **Badge box** (Playwright probe, `getBoundingClientRect()` + `getComputedStyle()`, same
  script run, both surfaces): the strip's tier badges (`.dse-mt__tier-key .dse-pr__badge`) on
  `montage`/`mid`/dark/pinned measure **51.25 × 22.14px, padding 4.608px 4.032px** for the
  `12-16`/`17+`/`crit` rows — identical, digit-for-digit, to the shipped Power Roll badge
  (`ds-roll`/`default`/dark, `.dse-pr__badge`) measured in the same script run. The fourth row
  (`≤11`/`t1`) measures **51.25 × 23.14px** in **both** the strip and the shipped badge — a
  pre-existing 1px taller box on the `t1` tier specifically (the SC-10/SC-121 `≤` glyph-height
  quirk documented in `styles-source.css` at that badge's own rule), present identically in the
  component being reused, not introduced by this slice. Padding is `4.608px`/`4.032px` on all
  four tiers, in both surfaces. Probe: `.../scratchpad/sc191-slice3/probe-final.mjs` (deleted
  from the worktree after use — never committed); log:
  `.../scratchpad/sc191-slice3/probe-6.log`.
- **Greyscale legibility**: `montage-strip-pinned--steel-dark.png` converted to greyscale
  (ImageMagick `-colorspace Gray`, manual check — same convention as fix-1's I-4 finding, no
  capture-id churn). The ▲/▼ pip shape, the seal ring styles, and the check/X glyphs plus the
  "with a reward"/"with a consequence" words all stay legible with zero hue information;
  compared directly against the approved `sc191-r7-pip-gold-grey-dark.png` reference in the
  ledger dir — same read. File: `.../scratchpad/sc191-slice3/montage-strip-pinned-greyscale.png`.
- **300px does not side-scroll**: with the strip clicked open at `width: 300`, `#mount`'s
  `scrollWidth === clientWidth === 300`; the strip's own rows container
  (`.dse-mt__tier-rows`) also has no internal overflow (`scrollWidth === clientWidth === 204`).
  Log: `.../scratchpad/sc191-slice3/probe-6.log` ("300px OVERFLOW CHECK"); screenshot
  `.../scratchpad/sc191-slice3/narrow-pinned-check.png`.
- **Freeze shows only the slice-2 pair**: confirmed above, twice.

## Approved-look comparison

Compared `montage-strip-pinned--steel-{dark,light}.png` against
`sc191-r7-pip-gold-{dark,light}.png`, and the greyscale conversion against
`sc191-r7-pip-gold-grey-dark.png`, and `montage-narrow--steel-dark.png` (strip pinned, via the
narrow-pinned probe screenshot) against `sc191-r6-pip-narrow-dark.png`. **No deliberate
difference from the approved look** — the shipped strip's composition, badge shapes, tier wash,
seal rings, and pip geometry match the reference PNGs region-for-region. The only visible
delta between the shipped render and the r6/r7 reference PNGs is the BOARD below the strip
(the r6/r7 mocks show slice-4's live edit pencils/log-action buttons; the shipped board shows
slice-2/fix-1's real-disabled stub controls, per those slices' own scope) — not a strip/guide
difference.

**Colours, named in prose** (Scott is colourblind; shape and words carry every state, colour
only reinforces): the pip is a **warm gold** triangle (`--dse-vp`, the same value the crit tier
badge and the outcome band's "brink" alert already use) with a **steel-grey** rim
(`--dse-metal-line`) and a faint top-down sheen. The seal ring is the board's own language: a
**green** ring for success, a **red** hatched-pressed disc for failure — always paired with a
check/X glyph and the word "success"/"failure". The tier row's left edge and background wash
use the same four hues the shipped Power Roll badges already use (red/amber/green/gold for
≤11/12-16/17+/crit) — decoration on the row's own label, never the sole channel for anything.

## Integrity probes (spec §C)

This slice adds no new NOTE write path (strip/guide are session-only, never `replaceSource` —
verified directly in `montage-strip.test.ts`). All eight:

1. **Content above/below survives a write** — PASS, unaffected. Inherited coverage
   (`montage.test.ts`'s persisted-write-path test), re-verified green in the full run.
2. **Two `ds-montage` blocks don't cross-talk** — PASS, **and extended this slice**. The
   existing vault-level test (Reset on block A leaves block B's YAML untouched) re-verified
   green; **new**: `montage-strip.test.ts`'s own probe proves the SAME independence for
   *session* state — two blocks under one `SessionStore`, opening block A's strip leaves block
   B's strip closed.
3. **A hand-edited YAML value survives a re-trigger** — PASS, unaffected. No new write path
   this slice; the model-level contract (slice 1's serialize oracle) and Reset's narrow
   field-list (unchanged) both still hold.
4. **A user-deleted block regenerates cleanly** — PASS, unaffected. `example.yaml` untouched.
5. **An old-shape block upgraded on write loses nothing** — PASS, unaffected. No new
   entries-write path this slice (that's slice 4's sheet); slice 1/2's delta-write and
   old-shape-render coverage stands, re-verified green.
6. **A block whose entries disagree with its scalars keeps the scalars** — PASS, unaffected.
   Slice 1's model-level test, re-verified green.
7. **Read-only hosts render zero write affordances, zero writes** — PASS, unaffected AND
   verified to still apply with the strip/guide present: `canPersist: false` is not consulted by
   either view (collapsing/expanding is not a note write, so it is never gated on
   persist-capability — SessionStore is available regardless of vault-write capability); the
   existing read-only DOM test (no Reset menu, `host.replaceSource` never called) re-verified
   green in the full run with both new regions mounted.
8. **Rapid clicks coalesce into one debounced write** — PASS by inheritance, not re-tested here.
   No new debounced-persist path this slice; the framework's generic `persist()` mechanism is
   unmodified, and the only persist-triggering control (Reset) is unchanged.

## Drive-by fixes

None. Everything shipped is new code (StripView/GuideView) or additive wiring in files this
slice already had to touch for its own scope; no pre-existing bug in a touched file was found
and fixed in passing.

## Follow-ups (left for the ticket-owner to judge)

- **Spec §G's rider-count prose says "six", the canonical mock/book data says seven** — see
  the dedicated section above. A documentation-accuracy note against the spec's own text, not a
  design conflict; no code change was needed since the canonical source (mock6.js/the book) is
  unambiguous and StripView.ts transcribes it verbatim.
- **The SC-205 host-copy pin is stale against this machine's installed Obsidian** (1.14.0 vs.
  pinned 1.13.7), aborting the full `npm run shots` sweep's final in-run assertion on every DSE
  branch here. Confirmed environmental, not diff-related, by an independent peer agent working a
  different worktree concurrently. A develop-level chore (re-extract the host model, bump
  `PINNED_OBSIDIAN` + the provenance comment, keep the `styles-source.css`
  `[SC205-HOST-RULES]` listing in step) — not touched here per explicit instruction and my own
  judgement that it is out of this slice's scope and would collide with whoever owns it.
- **A devbox exit-code footgun beyond `dse-verify` SKILL.md's documented cases**: `devbox run
  -- bash -c '<cmd>; echo X=$?'`, single-quoted, no pipe, can still report `X=0` for a command
  that called `process.exit(1)` — reproduced with a minimal 2-line repro script. Worth a line in
  the skill's "THE exit-code footgun" section; I did not edit that skill file myself (it is
  workspace-level, out of this worktree's scope) but flag it here since it directly shaped how
  this slice's shots/freeze verification had to be structured.
- No other in-scope tangents met the drive-by bar or warrant a new Backlog ticket beyond what's
  listed above.

## Scope notes (interpretation calls made, not spec inconsistencies)

- **No `role="table"` on the strip's tier-rows grid or the guide's table grids.** The mock's
  `attr(rows, {role: 'table'})` / `attr(t, {role: 'table'})` is exactly the pattern fix-round-1's
  M-4 finding flagged and removed from `BoardView.ts` for the same reason (a `role="table"` with
  no owned `role="row"`/`role="cell"` children is an invalid ARIA mapping — AT announces "a
  table with no rows"). I did not repeat that mistake in new code this slice; both grids render
  as plain, readable flowing content instead.
- **`.dse-mt__strip`/`.dse-mt__guide` naming**: the collapsible root carries `.dse-collapse` (the
  kit's own class) plus a second semantic class, the same "kit class + a bespoke second class"
  gesture `BoardView`'s cells and `initiative`'s `.dse-init__cell` already use for `iconButton`.
- **The strip's whole CSS block (layout + colour) lives in one Steel-only tier** rather than
  being split structural/Steel like the board/outcome-band/guide — spec §E names only three
  things needing print reach (board grid, outcome band, guide panel), and the strip is not one
  of them, so there was nothing to split.

## Artifacts

- Commit: `0c8fc27ac0d50fe2c75383aaecaeedaddb4865e0` (branch `sc191-montage-overhaul`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`)
- This report:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-slice3-report.md`
- New source: `src/elements/montage/StripView.ts`, `src/elements/montage/GuideView.ts`
- New test: `test/dom/elements/montage-strip.test.ts`
- Sample rendered PNGs (reviewer eyeballing, not gate artifacts), all under
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements/visual-harness/shots/`:
  `montage-strip-pinned--steel-{dark,light,print,realprint}.png`,
  `montage-guide-open--steel-{dark,light,print,realprint}.png`, `montage-narrow--steel-dark.png`.
- Approved-look comparison inputs (unchanged, ledger dir):
  `sc191-r7-pip-gold-{dark,light}.png`, `sc191-r7-pip-gold-grey-dark.png`,
  `sc191-r6-pip-narrow-dark.png`.
- Gate logs (all under
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-slice3/`):
  `tsc-final.log` (`1-tsc-final.log`), `lint-final.log` (`2-lint-final.log`), `3-jest-final.log`,
  `jest-strip-red.log` (montage-strip.test.ts red-before-green), `jest-strip-2.log` (green),
  `shots-clean1-*.log` / `shots-run2-final.log` (the two full-sweep runs, incl. the
  `HOST COPY DRIFTED` abort text), `run1.sha256` / `run2.sha256` (byte-identical proof),
  `freeze-1.log` / `freeze-2.log`, `parity-1.log`, `shots-montage-1.log` (the narrowed
  `--element=montage` run, full pipeline green), `probe-6.log` (badge measurement + 300px
  overflow check, final version), `narrow-pinned-check.png`,
  `montage-strip-pinned-greyscale.png`, `exit-test.mjs` (the devbox exit-code repro),
  `commit.log`.

# SC-299 re-review 2 (scoped) — delta since re-review 1

## Executive summary

- **Verdict: FIX ROUND NEEDED — but the shipped plugin behaviour is land-ready.** All three
  folded findings are VERIFIED-FIXED by measurement; both new findings are in the *harness
  gate* and one *code comment*, not in anything a user touches. The owner may reasonably
  land and file a follow-up instead.
- Status: **HIGH-1 VERIFIED-FIXED** (24/24 coarse configurations: 560/700/900 px × 3/4/5/8
  rounds × real-Obsidian-sheet on/off — 0 containment violations, 0 wrong-writes, hit-tested
  at *every* recorded cell on a *real* N-round DOM) · **LOW-1 VERIFIED-FIXED** (no
  aria-label/title/role/tabindex; AX tree has zero "nothing logged" nodes; trio + group still
  exposed) · **LOW-2 VERIFIED-FIXED** (`ground: lightValue('chip-bg')`).
- **Gate CAN-FAIL PROVEN**: with the three fix declarations removed, the gate exits 1 printing
  `CONTAINMENT: Kira round 3 — cell 87.67px, trio 141.59px, overflow left 26.95px / right 26.97px`
  (×5 heroes) and `WRONG-WRITE: … hit BUTTON[aria-label="Log a success for Kira in round 3"] (round 3)`
  (×5) — matching my review-1 measurement (27.0 px) to 0.05 px. `matchMedia('(pointer: coarse)')`
  verified true in-page.
- **NEW: 1 MED, 1 LOW, 3 INFO.** MED — the gate reports an out-of-viewport probe as a
  WRONG-WRITE and clears its own viewport by **47 px**. LOW — the "stays on ONE row" claim in
  the CSS comment and the round-3 report is false as shipped (measured: 2 rows everywhere).
- Gate lines, verbatim (dse `b2e40d1` / ws `f229603`, exit 0 each):
  - tsc: clean, no output · lint: clean, no output
  - jest: `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3902 passed, 3903 total` / `Snapshots: 3 passed, 3 total`
  - shots: `montage quick-trio containment OK (6 configurations: 560/700/900px panes + 4/5/8-round track lists, mid fixture, pointer: coarse — every .dse-mt__quick box stays inside its own .dse-mt__cell; the width series also confirms elementFromPoint 6px inside a recorded cell's right edge always returns that cell)` · `host-copy pin OK (…Obsidian 1.14.2…)` · `button host-leak OK (114 button kinds × 3 states … = 684 comparisons…)` · `montage track widths OK` · 506 s, exit 0
  - freeze: `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
  - parity (last): `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`
- Working tree pristine (both trees `git status --porcelain` empty); 7 probe files deleted;
  `styles-source.css` restored and the harness rebuilt after the can-fail injections.

---

## 1. Replay spot-check

`git diff 96e2238 9ddadb5 --stat` ≡ `git diff 5a5ed49 6e5f35c --stat` (7 files,
`484 insertions(+), 25 deletions(-)`, identical per-file). Stripped-patch diff = **4 lines,
one hunk header** (`@@ -40,7` → `@@ -51,7` in `CHANGELOG.md`). Replay clean; not re-reviewed.

## 2. Folded findings — verified by measurement

### HIGH-1 — VERIFIED-FIXED (both halves)

Real Chromium, `{ hasTouch: true, isMobile: true }`, `matchMedia('(pointer: coarse)')`
confirmed true in-page. I built a **real N-round DOM** (cloned the open-socket cell and the
round heads so every row has `2 + N` children, then wrote the track list exactly as
`BoardView.ts:92` does) — so unlike the in-run gate's synthetic rewrite, no `grid-column`
pinning was needed and implicit auto-placement is genuinely correct. I also hit-tested
**every** recorded cell, not only round 2, and ran the whole matrix twice: with and without
`sheet=1` (Obsidian's real pinned app.css), because the gate navigates without it.

| pointer | sheet | panes | rounds | `--dse-mt-colmin` | button box | containment | wrong-writes |
|---|---|---|---|---|---|---|---|
| coarse | off | 560/700/900 | 3,4,5,8 | `9.2em` (resolves) | 44.0×44.0 | **0 violations** | **0** |
| coarse | on | 560/700/900 | 3,4,5,8 | `9.2em` | 44.0×44.0 | **0 violations** | **0** |
| fine | on | 560/700/900 | 3,4,5,8 | unset (fallback `5.2em`) | 19.72×19.72 | 0 | 0 |

24 coarse configurations, 12 fine controls, all clean. Fine-pointer layout is byte-unchanged
(`flex-wrap: nowrap`, `max-width: none`, cell widths 83.2–161.1 px exactly as before the
branch) — the `var(--dse-mt-colmin, 5.2em)` fallback does what it claims.

`--dse-mt-colmin` resolution verified end-to-end: `getComputedStyle(board)
.getPropertyValue('--dse-mt-colmin')` → `9.2em` under coarse, empty under fine, and the
computed `grid-template-columns` widens accordingly (147.2 px hard minimum vs 83.2 px).

### Gate `assertMontageCoarseContainment` — CAN-FAIL PROVEN

I extracted the function **verbatim** from `visual-harness/shoot.mjs` (147 lines, brace-matched,
no edits) into a throwaway runner and exercised it against real, rebuilt harness bundles
(`npm run harness:build` after each source edit). Its call site (`shoot.mjs:4918`) is an
unconditional `await` inside the `if (!args.element)` block, i.e. it runs on every full sweep —
and it did, in my own clean run (OK line above).

| `styles-source.css` state | gate exit | what it printed |
|---|---|---|
| shipped (all three declarations) | **0** | the OK line |
| `flex-wrap: wrap` removed | 0 | OK line — *correct*: measured, buttons span 141.6 px inside a 147.2 px cell (2.8 px slack), nothing escapes, no wrong-write |
| `max-width: 100%` removed | 0 | OK line — *correct*, same reason |
| `--dse-mt-colmin: 9.2em` removed | **1** | `WRONG-WRITE: … Talin's round-2 cell … hit null` (see MED-1 — right verdict, wrong diagnosis) |
| **all three removed (the original HIGH-1)** | **1** | 5× `CONTAINMENT: … cell 87.67px, trio 141.59px, overflow left 26.95px / right 26.97px` + 5× `WRONG-WRITE: … hit BUTTON[aria-label="Log a success for <hero> in round 3"] (round 3)` |

The gate fails loudly on the real defect, with the exact geometry review-1 measured
(26.95/26.97 px vs my 27.0 px). It does not fire on either containment declaration removed in
isolation — which is correct, because neither removal alone reintroduces the hazard at any
configuration I measured; both are pinned textually by the new jest CSS-contract test
(`test/dom/elements/montage.test.ts:1572-1596`), so that layer catches them. Two-layer design,
sound. `styles-source.css` was restored (`git checkout`) and the harness rebuilt after every
injection; the tree is clean.

### LOW-1 — VERIFIED-FIXED

`src/elements/montage/BoardView.ts:266-272` (`if (!isEmptyCurrentCell) cell.setAttribute(...)`).
Measured in a real browser on the empty current-round cell: `role: null`, `tabindex: null`,
**`aria-label: null`**, `title: null`, `aria-disabled: null`. Chromium AX tree
(`Accessibility.getFullAXTree`): **zero** nodes named `…nothing logged…` (was
`generic: "Kira, round 3: nothing logged — log an action"` before). The trio is still fully
exposed — `button: "Log a success/failure/an assist for Kira in round 3"` ×3 plus
`group: "Quick log for Kira, round 3"`, none ignored — and recorded cells keep
`role="button"` + `aria-label="Kira, round 1: success with Nature — edit"`.

### LOW-2 — VERIFIED-FIXED

`test/dom/framework/lightContrast.test.ts:236` now reads `ground: lightValue('chip-bg')`.
Jest green, including the `CAN-FAIL PROOF` invariant that iterates every pin.

### SC-326 (the round-3 follow-up)

Confirmed pre-existing: `.dse-mt__board { border-radius; overflow: hidden }`
(`styles-source.css:4284-4285`) dates to SC-191 slice 3 (`d2148a8`), is untouched by this
branch's diff, and at the **pre-branch `5.2em`** minimum clipping already occurs at 8 rounds
on a 900 px pane under coarse (5 cells clipped, worst +73.7 px). **One measured caveat the
owner should have, since it bears on SC-326's priority rather than on this branch's
correctness:** the shipped `9.2em` moves the onset from 8 rounds to **5** (5 cells, +144.1 px)
and, at 8 rounds, from +73.7 px to **+585.7 px / 20 cells**. The mechanism is not introduced
here; its reach is measurably widened.

---

## 3. NEW findings

### MED-1 (NEW) — the containment gate reports an out-of-viewport probe as a WRONG-WRITE, and clears its own viewport by 47 px

**`visual-harness/shoot.mjs:672`** (`viewport: { width: 1000, height: 1000 }`) and
**`:725-733`** (`const hit = document.elementFromPoint(x, y); … if (hitCell !== cell) wrongWrites.push(…)`).

`elementFromPoint` is **viewport-relative** and returns `null` for any point below the
viewport. The gate probes the vertical centre of every hero's round-2 cell, but never scrolls
the cell into view and never distinguishes `hit === null` ("nothing is painted there / the
point is off-screen") from `hitCell !== cell` ("a different cell's control is on top"). Both
land in `wrongWrites` and print as
`WRONG-WRITE: 6px inside <hero>'s round-2 cell's right edge hit null[aria-label="null"] (round null)`.

Measured, in the gate's own context shape (1000×1000, coarse, `mid` fixture, 560 px pane):

| configuration | Kira | Bram | Osric | Yenna | **Talin** |
|---|---|---|---|---|---|
| shipped (`9.2em`, 2-row trio) | y=416 | y=551 | y=685 | y=819 | **y=953 — in viewport, 47 px of margin** |
| `5.2em` (3-row trio) | y=441 | y=624 | y=807 | y=990 | **y=1172 — OFF-SCREEN, `hit = NULL`** |

That is exactly the misleading failure in the variant-c row of §2's table: the gate was right
to go red (dropping `--dse-mt-colmin` is a regression) but the message it printed names a
wrong-write that does not exist, and points the reader at
`@media (pointer: coarse) → .dse-mt__cell-quick / .dse-mt__board` for a problem that is really
"the board got taller than my viewport".

Failure scenario: a sixth hero in `fixture-mid`, a slightly taller row, or any future change
that adds ~50 px above the board turns `npm run shots` red on a healthy tree with a message
that sends the next agent hunting a phantom wrong-write. 47 px is not a margin; it is a
coincidence.

**Prescribed fix (both parts):**

1. `shoot.mjs:672` — give the coarse context a tall viewport, e.g.
   `viewport: { width: 1000, height: 2400 }`. Nothing in this gate captures a PNG, so height
   costs nothing and no frozen byte can move.
2. `shoot.mjs:725-733` — classify a null hit separately, so the gate can never call it a
   wrong-write:

```js
const hit = document.elementFromPoint(x, y);
if (!hit) { offscreen.push({ hero: cell.getAttribute('data-hero'), y }); continue; }
const hitCell = hit.closest('.dse-mt__cell');
if (hitCell !== cell) { wrongWrites.push(…); }
```

and report `offscreen` as its own loud line (`PROBE POINT OFF-SCREEN — widen the gate's
viewport; this is not a wrong-write`). Optionally belt-and-braces:
`cell.scrollIntoView({ block: 'center' })` before re-reading the rect.

Re-verify by re-running the variant-c injection (drop `--dse-mt-colmin` only): the gate must
still exit 1, but now naming the real containment/geometry regression rather than a null hit.

### LOW-1 (NEW) — "stays on ONE row" is false as shipped

**`styles-source.css:3862`** — "*GEOMETRY (`--dse-mt-colmin`, `.dse-mt__board`) — widen the
round column itself under coarse so the trio stays on **ONE row** at ordinary round counts;
wrapping above is the safety net for extreme round counts / narrow panes, **not the everyday
look***" — and the same claim in the round-3 report §2.

Measured (coarse, real Chromium; `.dse-mt__cell` has `padding: 11.52px` each side, so the
trio's containing block is the cell width minus 23.04 px, and the trio's min-content is
`3 × 44 + 2 × 4.8 = 141.6 px`):

| `--dse-mt-colmin` | pane | cell | content box | trio | **rows** | cell height |
|---|---|---|---|---|---|---|
| `5.2em` (no part 2) | 560 | 87.7 | 64.6 | 64.6×141.6 | **3** | 183.0 |
| **`9.2em` (shipped)** | 560 | 147.2 | 124.1 | 124.2×92.8 | **2** | 134.2 |
| **`9.2em` (shipped)** | 900 | 154.3 | 131.3 | 131.3×92.8 | **2** | 134.2 |
| `10.4em` | 560/900 | 166.4 | 143.4 | 141.6×44.0 | **1** | 85.4 |
| `11em` | 560/900 | 176.0 | 153.0 | 141.6×44.0 | **1** | 85.4 |

The trio wraps to two rows in **every** coarse configuration I measured — including the
roomiest one (3 rounds at a full 900 px pane). What `9.2em` actually buys is *three rows → two
rows*, and a cell 183 → 134.2 px tall. One row needs a content box ≥ 141.6 px, i.e.
`--dse-mt-colmin ≥ 10.4em`. This is not a correctness defect — containment and the
no-wrong-write invariant hold at 9.2, 10.4 and 11 em alike — but it is the same class of
finding as review-1's LOW-1/LOW-2, which this round fixed: a comment asserting something the
code measurably does not do, left for the next reader to trust.

**Prescribed fix — owner's ruling, because the two options trade against SC-326:**
(a) correct the comment (and the ledger line) to say what it does — "keeps the trio at two
rows instead of three, and keeps the columns from collapsing" — leaving `9.2em`; or
(b) raise to `--dse-mt-colmin: 10.4em`, making the claim true (measured: one row, cell 85.4 px),
at the cost of pushing SC-326's clipping onset below 5 rounds. (a) is the conservative choice
given SC-326 is already open.

### INFO (NEW) — the gate's containment invariant measures the `max-width`-capped container, not the buttons

`shoot.mjs:714-724` measures `.dse-mt__cell-quick`'s rect. With `max-width: 100%` that rect is
pinned to the cell's content box and cannot exceed the cell — so invariant 1 can only ever fire
when `max-width` is *also* absent (which is precisely the variant that did fire). What can
paint outside are the flex **items**. Measured under the `flex-wrap: nowrap` injection: the
container stayed 124.2 px (−11.52 px inside the cell on each side) while the three buttons
spanned 141.6 px — still 2.8 px inside the cell, so nothing escaped, but the gate would not
have seen it if it had. Benign while `flex-wrap: wrap` is declared (with wrap, a button can
only escape if one single button were wider than the whole content box). Cheap hardening if
touching the gate for MED-1 anyway: measure the union of the `.dse-mt__quick` boxes, or each
button, instead of the container.

### INFO (NEW) — the gate navigates without `sheet=1`; verified harmless

`shoot.mjs:681` builds its query without `sheet: '1'`, so it measures without Obsidian's real
pinned `app.css`, unlike every screen capture in the sweep. I re-ran my full 12-configuration
coarse matrix **with** `sheet=1` and every number is identical (button 44.0×44.0, trio
124.2×92.8 / 131.3×92.8, 0 violations, 0 wrong-writes). No fidelity gap in practice; worth one
line in the gate's own doc comment so the next reader does not have to re-derive it.

### INFO (NEW) — SC-326 onset moves 8 rounds → 5 rounds

See §2's SC-326 paragraph. Data for the owner's triage of the existing ticket, not a new one.

---

## 4. Delta hygiene

- 3 dse commits (`7f9227a`, `fcfb705`, `b2e40d1`) + ws `f229603`; **no attribution trailers**
  in any of them (grepped `6e5f35c..HEAD` and `8685b65..HEAD`, 0 hits).
- `git diff 6e5f35c b2e40d1` touches only the 5 files the round-3 report names; no drive-bys.
- jest 3902 (+21 over re-review-1's 3881: SC-126's own tests from the rebase, plus this
  round's 2 new tests — the geometry-seam DOM test at `montage.test.ts:205-210` and the CSS-
  contract test at `:1572-1596`). No test deleted; the one changed assertion
  (`montage.test.ts:257`) had become factually wrong under the LOW-1 fix and now pins the
  absence it should.
- SC-126's `background-color` comparator is live (`visual-harness/parity/{site,plugin}-capture.mjs:15-18`)
  and fired 0 rows; parity 0/0/16 unchanged.

## Artifacts

- Gate logs: `sc299-rv3-{tsc,lint,jest,shots,freeze,parity}.log` in this directory.
- No new evidence images: every claim above is a measurement, and the numbers are in the
  tables rather than in a screenshot.

## Reproduction of MED-1

Playwright context `{ hasTouch: true, isMobile: true, viewport: { width: 1000, height: 1000 } }`
(the gate's own shape), `…/visual-harness/index.html?element=montage&fixture=mid&theme=steel&bg=dark`,
`#mount` width 560, then:

```js
document.querySelector('.dse-mt__board').style.setProperty('--dse-mt-colmin', '5.2em');
const c = [...document.querySelectorAll(".dse-mt__cell[data-round='2']")].pop(); // Talin
const r = c.getBoundingClientRect();
document.elementFromPoint(r.right - 6, r.top + r.height / 2);   // → null  (y = 1172 > 1000)
```

The shipped `9.2em` puts that same point at y = 953.

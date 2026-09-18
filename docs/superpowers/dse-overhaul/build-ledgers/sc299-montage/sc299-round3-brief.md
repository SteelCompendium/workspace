# SC-299 round 3 — implementer brief: rebase onto the moved tracked branches (+ any re-review fixes)

You are an `orchestration:implementer` for the SC-299 ticket-owner. **Workers never call the
tracker (Linear).** Final text goes to the ticket-owner, not a human.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-decisions.md`
- Prior reports in that dir: `sc299-round2-report.md`, `sc299-rereview1-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc299-montage` (superproject, branch
  `sc299-montage`, head `69b8002` on `728f514`) and its submodule
  `…/sc299-montage/draw-steel-elements` (branch `sc299-montage`, head `9ddadb5` on `96e2238`).
  **Verify `pwd` before any write; never touch `/home/scott/code/steelCompendium/workspace/`.**

## 2. Task
### 2.1 Rebase dse
`git fetch origin` INSIDE the worktree submodule clone; rebase `sc299-montage` onto
`origin/develop` **`5a5ed49`** (SC-126: parity harness `compare.cjs`/`selector-map.json`/README,
dse-verify numbers, CHANGELOG — no CSS/fixtures). Expect at most a `CHANGELOG.md` conflict:
keep BOTH sides. `package.json` unchanged → no `npm ci` unless `git diff 96e2238..5a5ed49 --
package.json package-lock.json` says otherwise.
### 2.2 Rebase the superproject
In the worktree superproject: `git fetch origin`; rebase `sc299-montage` onto `origin/main`
**`8685b65`**. Expect a `CHANGELOG.md` conflict under `## Unreleased` (keep both bullets) and a
`draw-steel-elements` pointer conflict — resolve the pointer to YOUR rebased dse head, never
to main's. Do NOT touch `docs/handoffs/HANDOFF.md` or any other file main changed.
### 2.3 Re-review fixes (if any)
Owner rulings (verbatim from the ledger `sc299-decisions.md`, entry "Re-review 1 DONE 2026-09-18") — read them there first; they are the acceptance criteria. Then the reviewer's own text, verbatim, from `sc299-rereview1-report.md`:

# SC-299 re-review 1 (scoped) — delta since review 1

## Executive summary

- **Verdict: FIX ROUND NEEDED** — every review-1 finding is VERIFIED-FIXED, but MED-1's fix
  introduced **one NEW HIGH**: under `pointer: coarse` the now-44px trio overflows its own
  grid cell and steals the hit-test from the neighbouring round's cell — a **wrong-write**,
  measured, not inferred. Everything else is land-ready.
- Status table (all measured/executed, never read):

| Finding | Status | Evidence |
|---|---|---|
| MED-1 coarse target | **VERIFIED-FIXED** | `(pointer: coarse)` matched: box **44×44 px**, `min-width/min-height: 44px`, centre spacing **48.8 px**; fine pointer unchanged at 19.72×19.72 / 22.59 px |
| MED-2 ARIA pruning | **VERIFIED-FIXED** | Chromium AX tree (CDP `Accessibility.getFullAXTree`) now exposes all 15 `button` nodes + 5 `group` nodes; cell `role`/`tabindex`/`aria-disabled` all absent; Tab reaches the trio; cell click still opens the sheet |
| LOW-1 false precedent | **VERIFIED-FIXED** | `styles-source.css:3802-3812` |
| LOW-2 DOM-order comment | **VERIFIED-FIXED** | `styles-source.css:4182-4185` |
| LOW-3 docs caveat | **VERIFIED-FIXED** (deviation **ACCEPTED**) | `docs/gm-trackers.md:118-121`; my literal text was wrong — see §2 |
| LOW-4 disabled ink | **VERIFIED-FIXED** | read-only host: all three buttons `color: rgba(220,226,230,0.62)` (= `--dse-fg-muted`), no green/red |
| INFO-4 hover note | **VERIFIED** | `styles-source.css:4438-4444` |
| INFO-5 contrast pin + retake | **VERIFIED** (deviation **ACCEPTED**) | ratios recomputed exactly: 4.51 / 1.77 / 3.27; light retake legible — see §2 |
| INFO-8 CHANGELOG blank line | **VERIFIED-FIXED** | ws `69b8002` |
| — | **NEW: 1 HIGH, 2 LOW, 2 INFO** | §3 |

- Gate lines, verbatim (re-run at dse `9ddadb5` / ws `69b8002`; exit 0 each):
  - tsc: clean, no output · lint: clean, no output
  - jest: `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3881 passed, 3882 total` / `Snapshots: 3 passed, 3 total`
  - freeze: `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
  - shots/parity not re-run (round 2's numbers check out — see §4).
- Working tree left pristine; all nine `sc299-probe-*.mjs` files deleted.

---

## 1. Replay spot-check (b5cb7d9 = reviewed 1762555 onto 96e2238)

`git diff e12c6bd 1762555 --stat` and `git diff 96e2238 b5cb7d9 --stat` are **identical**
(6 files, `362 insertions(+), 10 deletions(-)`, same per-file counts). Diffing the two
patches with `index` lines stripped yields **4 lines of difference — one hunk header**
(`@@ -30,7 +30,11 @@` → `@@ -40,7 +40,11 @@` in `CHANGELOG.md`, SC-196 having added 10
lines above). The replay is byte-clean; I did not re-review it.

## 2. The two documented deviations — judged

### LOW-3's literal wording — **deviation ACCEPTED; the implementer was right and I was wrong**

I prescribed "reopen it first, or use **Log an action…**". I checked
`src/elements/montage/view.ts:148-193`: `buildActionBar` has `if (complete) { …Undo /
Reopen / Clear all… return; }` — `Log an action…` is built only *after* that `return`, in
the `!complete` path. So it is never an *alternative* to reopening; my text would have
shipped a false instruction. I also confirmed `montageReopenable` (`model.ts:490-496`)
returns `false` whenever a limit was hit, so "a limit is final" is exact. The shipped
sentence — "…but only while the montage is still in play. Once it's finished, reopen it
first (only possible if it simply ran out of rounds; a limit is final)." — is correct and
strictly better than what I asked for. Exactly the check my own finding invited; taking it
and disclosing it is the right call.

### INFO-5's "danger icon not pinned" — **deviation ACCEPTED**

Three independent verifications:

1. **The ground is real.** The Steel *light* block declares `--dse-chip-bg: #eaeeef` — a
   flat opaque hex (the dark block's is `rgba(220,226,230,0.06)`, but `lightContrast.test.ts`
   reads the light block only). The claim "no compositing needed" holds.
2. **The arithmetic is exact.** Recomputed independently (WCAG relative luminance) against
   `#eaeeef`: `turn-done` new `#147c40` = **4.51:1** (pin's `measured`), old `#5cc98a` =
   **1.77:1**, `danger` old `#e74c3c` = **3.27:1**, new `#bb2d1f` = 5.12:1. Every figure in
   the deviation is correct to 2 d.p.
3. **The justification is real, not invented.** `test/dom/framework/lightContrast.test.ts:311-321`
   (`CAN-FAIL PROOF`) iterates **every** entry in `PINS` and asserts `survivors` is empty —
   so a `danger` pin at 3.27 ≥ 3.0 would break that test file-wide, not just fail to add
   value. Narrowing to the one pin that functions as a guard is correct.

**Light retake reviewed** (`evidence/sc299-r2-montage-mid--steel-light.png`, byte-identical
to the current shots dir; crop at `sc299-rv2-mid-light-trio-crop.png`): the ✓ is now solid
dark green and the ✕ solid dark red on the light chip — the "faint" observation from
review-1's visual pass is resolved, as INFO-5 predicted.

---

## 3. NEW findings

### HIGH-1 (NEW, introduced by MED-1's fix) — the coarse-pointer trio overflows its cell and hijacks the neighbouring cell's taps

**`styles-source.css:3831-3851`** (the new `@media (pointer: coarse)` block) against
**`src/elements/montage/BoardView.ts:92`** (`cols.push('minmax(5.2em, 1fr)')`).

The trio is now `3 × 44 px + 2 × 4.8 px gap = 141.6 px` wide. The board's round columns are
`minmax(5.2em, 1fr)` ≈ 83 px minimum. Whenever a round column is narrower than 141.6 px —
i.e. the whole grid layout above the 420 px container breakpoint, which is where the
`@container` row layout does *not* apply — `.dse-mt__cell-quick` (a `display:flex`,
`justify-content:center` span with no `max-width`) simply **spills out of its cell on both
sides**, and `.dse-mt__board-wrap` does **not** grow a scrollbar to absorb it
(`scrollWidth === clientWidth` in every case measured).

Measured (real Chromium, `hasTouch + isMobile`, montage `mid`, steel dark):

| container | pointer | round-column width | trio width | overflow each side |
|---|---|---|---|---|
| 900 px (full) | fine | 161.1 | 64.9 | none |
| 900 px (full) | **coarse** | 154.3 | 141.6 | none (6.4 px spare) |
| 700 px | **coarse** | 134.3 | 141.6 | **3.6 px** |
| 560 px | **coarse** | 87.7 | 141.6 | **27.0 px** |

Round count matters as much as width: re-writing the sanctioned geometry seam's own value
(`--dse-mt-cols` with N round tracks) at a **full 900 px** pane under coarse gives
round-column widths of 90.2 px at **4 rounds** (25.7 px overflow each side) and 83.2 px at 5
and 8 rounds (29.2 px). So this is not an edge case reserved for narrow panes — **a 4-round
montage on any coarse-pointer device overflows at full desktop width.** (Round-count figures
are approximate: measured by rewriting the track list on the 3-cell `mid` DOM. The
width-parameterised rows above are exact.)

**This is a wrong-WRITE, not just a visual overlap.** `document.elementFromPoint` at a point
**inside** Bram's round-2 (recorded) cell — 6 px in from its right edge, vertically centred
— at 560 px:

- fine pointer → `DIV.dse-mt__cell[Bram, round 2: failure with Lift… — edit]` ✔
- **coarse pointer → `BUTTON.dse-mt__quick[Log a success for Bram in round 3]`** ✘

So a Director tapping what is drawn as "Bram, round 2 — edit" silently logs a **brand-new
success in round 3**. Look at `sc299-rv2-coarse-560-OVERLAP.png`: the ✓ button sits on top
of the round-2 column's `ALERTNESS` / `LIFT` / `SEARCH` cells and the ⊕ sits on top of the
Tally column's chips; `sc299-rv2-fine-560-ok.png` is the same view on a fine pointer, intact.
`sc299-rv2-coarse-700-OVERLAP.png` shows the milder 3.6 px case.

No gate catches this: the shots harness never emulates `pointer: coarse` (which is exactly
why MED-1 asked for a CSS-contract test — that test pins the declarations, not the geometry
they produce), and freeze/parity are print- and site-scoped.

**Prescribed fix — verified by measurement, not proposed blind.** I A/B'd three candidates
by injecting each into the live coarse page at 560 px and re-running the hit-test:

| candidate | trio width | rows | hit-test inside the round-2 cell |
|---|---|---|---|
| none (current HEAD) | 141.6 | 1 | ✘ `Log a success for Bram in round 3` |
| `max-width: 100%` alone | 64.6 | 1 | ✘ still the round-3 button (flex items refuse to shrink below `min-width`) |
| **`max-width: 100%` + `flex-wrap: wrap`** | 64.6 | 3 | ✔ `DIV.dse-mt__cell` |
| that + `.dse-mt__cell { min-width: 0 }` | 64.6 | 3 | ✔ (adds nothing over the above) |

So add to the existing coarse block:

```css
@media (pointer: coarse) {
	.dse-mt__cell-quick {
		gap: 0.3em;
		max-width: 100%;
		flex-wrap: wrap;   /* both lines are required — max-width alone does not contain it */
	}
	…
}
```

The trio then reflows to 2+1 (or 3×1 in a very narrow column) inside its own cell, 44 px
targets intact. A nicer one-row alternative, if the owner prefers it, is to widen the column
under coarse through the geometry seam: `BoardView.ts:92` →
`minmax(var(--dse-mt-colmin, 5.2em), 1fr)` with `--dse-mt-colmin: 9.2em` set in the coarse
block (still one `setProperty` call, so spec §D's seam rule holds). Either way the fix needs
its own jest CSS-contract assertion (nothing else guards coarse) **and** a re-run of a
coarse `elementFromPoint` probe — a declaration test alone would not have caught this one.

### LOW-1 (NEW) — `aria-label` now sits on a role-less `div` (naming a `generic` node)

**`src/elements/montage/BoardView.ts:261`** sets `cell.setAttribute('aria-label', ariaLabel)`
unconditionally, but after the MED-2 fix the empty current-round cell has no role. ARIA 1.2
prohibits an accessible name on `role="generic"`; axe-core flags this as
`aria-prohibited-attr`. Chromium does still surface it — the AX dump shows
`generic: "Kira, round 3: nothing logged — log an action"` — so an AT may announce a name
promising "log an action" on something that is not a control.

Mitigating, and the reason I am not calling it higher: in Obsidian `aria-label` **is** the
hover-tooltip mechanism (SC-196's own decompile note in `kit/iconButton.ts`: `setTooltip`
writes only `aria-label` and the hover renderer reads it back), so this attribute is doing
real mouse-affordance work here, not sitting dead.

**Fix (owner's call):** either move it to `title` for this one cell shape (keeps a native
tooltip, drops the prohibited ARIA name) — or keep it and add a one-line comment saying it is
deliberate and why. Do not silently leave it unexplained: the surrounding comments now argue
the ARIA case in detail and this is the one loose end in that argument.

### LOW-2 (NEW) — the new contrast pin hard-codes its ground and will go stale silently

**`test/dom/framework/lightContrast.test.ts:222-241`** pins `ground: '#eaeeef'` as a literal.
That value is `--dse-chip-bg` in the Steel light block (`styles-source.css:6468`-adjacent
light block), and the same file already has a table for exactly this shape: `FILL_INK`
(`:250-269`) compares two *declared* tokens via `lightValue(fill)` / `lightValue(ink)`, so it
tracks changes automatically. As written, a future edit to `--dse-chip-bg` leaves the pin
measuring against a ground that is no longer rendered, and it passes anyway.

**Fix:** either set `ground: lightValue('chip-bg')` in the `PINS` entry (`lightValue` is
already module-scope and the sheet is read at import time, so this works as-is), or add the
pair to `FILL_INK` as `{ fill: 'chip-bg', ink: 'turn-done', threshold: 3.0, measured: 4.51 }`
and keep the `PINS` row for its can-fail proof. The first is a one-token change.

### INFO (NEW) — `to act` wraps to two lines under coarse + narrow

At a 300 px container under `pointer: coarse` the hint's box goes 35.4 × 16.8 → 28.6 × 33.6
px, i.e. `to / act` on two lines, because the 44 px trio consumes the row. No clipping, no
overflow (`cellOverflows: false`, `wrapScrollW === wrapClientW`), and the narrow row layout
is otherwise fine. Cosmetic only; `white-space: nowrap` on `.dse-mt__cell-hint` inside the
coarse block would fix it if the owner cares. Flagged because no capture will ever show it.

### INFO (NEW) — the read-only empty current cell is now fully inert

With `role`/`tabindex`/`aria-disabled` all dropped, on a read-only host that cell is a plain
`div` carrying only an `aria-label`. Owner ruling I-6 ("explicit read-only states, never a
dead end") is still satisfied — the three real, `disabled`, `aria-label`led buttons inside it
are what AT now announces, and I verified 0 writes from any click/keypress in review 1 —
but the previously-announced "disabled control" wrapper is gone. Correct per the MED-2 fix as
prescribed; naming it so the owner ratifies it rather than discovers it.

---

## 4. Gates and why shots/parity were not re-run

- tsc / lint: clean, exit 0 (`sc299-rv2-tsc.log`, `sc299-rv2-lint.log`).
- jest (after `rm -f main.js styles.css`): `Tests: 1 skipped, 3881 passed, 3882 total` —
  matches the round-2 report exactly, and is +37 over review-1's 3844 (+34 SC-196, +3 this
  round), as claimed (`sc299-rv2-jest.log`).
- freeze against the current shots dir: `freeze OK (260/260 …)`, exit 0
  (`sc299-rv2-freeze.log`).
- Shots/parity left alone, and the round-2 numbers independently corroborated:
  `montage-mid--steel-print` and `montage-mid--steel-dark` in the current shots dir are
  **byte-identical** to the copies I took in review 1 (`cmp` clean) — so MED-1's coarse twin
  and MED-2's attribute removal moved zero print bytes and zero screen-dark bytes, exactly as
  expected (media-gated CSS; attributes carry no styling). `montage-mid--steel-light`
  **differs**, as SC-196's darkened light tokens require, and equals the round-2 evidence PNG
  byte-for-byte.

## 5. Delta hygiene

- 5 fix commits `3f540f5`, `f2653df`, `cd9ba4d`, `328e956`, `9ddadb5` + superproject
  `69b8002`; **no attribution trailers** in any of them.
- Each commit's body traces to a named review-1 finding; no drive-by changes in the diff
  (`git diff b5cb7d9 9ddadb5` touches only the five files the report names).
- The keydown guard `closest('.dse-mt__cell-quick')` was removed with the role — correct and
  necessary: the cell's keydown handler now only exists for recorded and past-empty cells,
  neither of which ever contains `.dse-mt__cell-quick`.
- MED-2 behaviour re-verified in a real browser: Tab order from the row button runs
  `Log an action for Kira` → the two recorded cells (still `role=button`, unchanged) → the
  three quick buttons; the empty current cell is not a tab stop; a click on the `to act`
  hint (cell surface, outside the trio) opens the sheet pre-filled `["Kira","3","Success"]`.

## 6. A note on §"cross-talk message" in the round-2 report

Out of my scope to adjudicate, but worth passing up: the round-2 implementer reports
receiving an in-session message claiming it had died at a rate limit, and asks whether a
duplicate round-2 implementer ran against the same worktree. I saw **no** evidence of a
second writer — the 5 commits form one linear chain on `96e2238`, every one traces to a
review-1 finding, `git status` is clean, and the shots dir's mtimes are a single 22:59 sweep.
Nothing in the tree needs remediation on that account.

## Artifacts

- Gate logs: `sc299-rv2-{tsc,lint,jest,freeze}.log` in this directory.
- Evidence: `sc299-rv2-coarse-560-OVERLAP.png` (HIGH-1, the wrong-write overlap),
  `sc299-rv2-coarse-700-OVERLAP.png` (the 3.6 px case), `sc299-rv2-fine-560-ok.png`
  (the same view on a fine pointer, for contrast), `sc299-rv2-mid-light-trio-crop.png`
  (INFO-5 retake, 2× crop).

## Reproduction of HIGH-1

Playwright context `{ hasTouch: true, isMobile: true }` (which is what makes Chromium match
`(pointer: coarse)` — confirmed in-page via `matchMedia`), then
`file://…/visual-harness/index.html?element=montage&fixture=mid&theme=steel&bg=dark&sheet=1&width=560`,
then:

```js
const r2 = document.querySelector('.dse-mt__cell[data-hero="Bram"][data-round="2"]').getBoundingClientRect();
document.elementFromPoint(r2.right - 6, r2.top + r2.height / 2).getAttribute('aria-label');
// coarse → "Log a success for Bram in round 3"      ← the bug
// fine   → null (the element is the round-2 cell)   ← correct
```


Implementation notes from the owner:
- HIGH-1: do BOTH parts of the ruling (containment + `--dse-mt-colmin` under coarse). The
  in-run shoot.mjs gate runs under `page.emulateMedia`/context `hasTouch:true, isMobile:true`
  (whatever makes `(pointer: coarse)` match — prove it matches by evaluating
  `matchMedia('(pointer: coarse)').matches` inside the gate and failing loudly if it does not).
  Print an OK line like the other in-run gates (`montage quick-trio containment OK (…)`); a
  violation must fail `npm run shots` with the measured numbers. Keep the gate cheap (one
  page, three pane widths, three track-list rewrites).
- LOW-1: remove the aria-label from that one cell state only; recorded/past-empty cells keep
  theirs (they still carry role=button).
- Every fix gets a test; update `test/dom/elements/montage.test.ts` CSS-contract assertions
  for the new coarse declarations and `lightContrast.test.ts` for LOW-2.
- Evidence: after the fix, capture the same three coarse-pointer shots the reviewer took
  (560/700/900, mid fixture) into `evidence/sc299-r3-coarse-{560,700,900}.png`.

### 2.4 Commit
dse: nothing new to commit unless 2.3 applies (then conventional messages, no trailers).
Superproject: after the rebase the pointer bump commit must point at the rebased dse head —
amend/redo `chore: bump draw-steel-elements submodule pointer (SC-299 r3)` as needed. No push. No tags.

## 3. Gates (full battery, post-rebase)
Per `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (it was
updated by SC-126 — read its "Current expected numbers" again), in order, devbox-wrapped absolute
paths, output to `…/sc299-montage/sc299-r3-<gate>.log`, gate command LAST in `bash -c`:
tsc, lint, `rm -f main.js styles.css && npx jest`, shots, freeze
(`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <shots dir>`),
parity LAST. Expected: clean / clean / jest ≥ 3881 passed (report actual) / `host-copy pin
OK|PARTIAL`, `button host-leak OK (114 kinds …)`, 0 FAIL / `freeze OK (260/260 …)` — any
mismatch = STOP and report, never touch the baseline / parity `0 GAPs / 0 undeclared / 16
DECLARED / exit 0` — SC-126 added a background-color comparator; if it now fires on anything
montage-related, STOP and report the exact rows (do not add a declared deferral).

## 4. Report
`…/sc299-montage/sc299-round3-report.md`, ≤10-line executive summary first: verdict, dse
head + base, ws head + base, conflicts and resolution, every gate line verbatim. Then
`Drive-by fixes:` / `Follow-ups:`. Return contract: raw facts only + artifact paths.

## 5. Footguns
- Report write blocked → return inline. Never key a wait-loop on a scratch filename/contents.
  Redirect long output to files; run gates in the FOREGROUND; never background a gate and wait.
  You cannot SendMessage the owner; `to:'main'` is the dispatcher — need input → end turn with
  `STATUS: NEEDS_CONTEXT`; if you message anyway, FIRST WORD `SC-299:`. Devbox eats `$?`;
  `| tail` masks failures. Never `rm -rf` under `.superpowers/`; never edit
  `freeze-baseline.sha256`. Gate logs go in the LEDGER dir above, never in the worktree.

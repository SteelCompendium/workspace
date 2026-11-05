# SC-490 review1 report: independent review of the pinned hero-name column

## Executive summary

- **Verdict: LAND-READY.** dse head reviewed `b33787479e378ca724f153ee7b05931b8178482a` (base `0698550f`), superproject `6567425a`. Findings: **0 HIGH · 0 MEDIUM · 1 LOW · 6 INFO**.
- I re-ran the full battery myself. Every number matches r1: tsc + lint clean · jest **6387 / 1 / 253 of 254** · lifecycle **49/49** (21 + 16 + 7 + 4 + 1) · e2e **`128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`** · shots **592**, 0 FAIL, host-leak **161/966**, `montage board scroll OK` (fine AND coarse) · freeze **`freeze OK (280/280 …)`**, no rebaseline · parity **0 gap(s) / 0 undeclared / 24 declared**.
- A board that fits is unchanged. I rendered `--element=montage` in a scratch worktree at base: **34/34 `montage*` PNGs byte-identical** to the branch's shots.
- All the can-fail proofs fail as claimed, and the gate is not vacuous. I ran five mutations on a scratch copy and each one turned the gate red with its own failure prefix: no sticky; old focus handler; no z-index; translucent fill; pinned cells not exempt from the focus scroll.
- The resize re-pin is needed. Without it, 20 of 32 configurations show a misaligned row divider after a row-height change. With it, every divider is aligned. During continuous drags it caused no flicker, no focus loss, no ResizeObserver loop errors and no wrong-state frames. Cost: about 1–2 ms per frame.
- **LOW-1** (the owner's card-tone question). `--dse-card-bg` does not change at runtime through any preference, accent, Obsidian theme, callout or embed. The literal fills still drift from the real look as the board sits lower on the card's gradient:
  - typical card: ≤2–3 levels per channel;
  - a long brief: **5–6 levels (dark) / 7–8 levels (light)**, with the seam against round 1 at 5–9 levels against 1–2 at base.
  - The literals are also silently coupled to the two `--dse-card-bg` definitions. The prescribed fix is a guard or a token (see LOW-1); the drift itself comes from decision 3's solid fill.
- Moved since base: dse `origin/develop` is now **`ea78ebf8`** (SC-547; touches files SC-490 does not) and superproject `origin/main` is **`64fcd141`** (SC-547 also edits `CHANGELOG.md` `## Unreleased`). A rebase and gate re-run are due before landing.

## Gates (measured by me; logs in my scratch dir `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-a7e5ad5d9f152a0e1/`)

| Gate | Measured | r1 | Log |
|---|---|---|---|
| tsc | rc 0, clean | same | `S/rv1-tsc.log` |
| lint | rc 0 (only the old `.eslintignore` warning) | same | `S/rv1-lint.log` |
| jest | `Tests: 1 skipped, 6387 passed, 6388 total` · `Test Suites: 1 skipped, 253 passed, 253 of 254 total` | same | `S/rv1-jest.log` |
| lifecycle | 21/21 · 16/16 · 7/7 · 4/4 · 1/1 = **49/49**. G-S13: `both hero columns pinned` over 133–145 frames for each of 6 writes, A held 699 and B held 1208 | same | `S/rv1-lc1..5.log` |
| e2e | `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs` | same | `S/rv1-e2e.log` |
| shots | 592 PNGs, 0 FAIL, rc 0, `button host-leak OK (161 … 966 comparisons …)`, `montage board scroll OK (… fine: 1359px grid in a 690px frame, 96 cells reachable, 6 pinned cells … 85 Tab + 85 Shift+Tab stops (5 + 6 in pinned cells …); coarse: 2255px grid …)` | same | `S/rv1-shots-r1793685022.log` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)` | same | `S/rv1-freeze.log` |
| parity | `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`, rc 0 | same | `S/rv1-parity.log` |
| montage base vs head (extra) | `34 identical, 0 differ, 0 missing` | 34/34 | `S/base-montage.log` |

Working tree: `git status --porcelain` was empty in the worktree superproject and in its dse submodule both before and after the run. dse HEAD is still `b3378747`. I did my probes in three detached scratch worktrees under `S/` and removed them at the end; their diffs are saved as `S/wt-head-scratch.diff` and `S/wt-mut-scratch.diff`.

## Probes run (real harness Chromium, `probe-rounds-12`, 490px pane unless stated)

The full output is in `S/run-main-head.log` (head) and `S/run-main-base.log` (base). Images are in `S/out-main-head/`.

- **(a) Opaque pinned column, in both themes, both pointers, at mid-scroll and at the far end.** Every round cell and header was turned magenta, with 40px magenta box-shadows and 6px outlines on everything inside the cells. The pinned column stayed unchanged apart from 14–18 px at the frame's two left rounded-corner arcs (INFO-1). Images: `S/out-main-head/<pointer>-<theme>-<mid|end>-magenta.png`. The same 4×2 states pass with the real colours.
- **(c) The add-hero "+" and all 5 row-action buttons hit-test to themselves** at 5 points each (4 corners and the centre), at rest, mid and end, fine and coarse, dark and light: 24/24 true. At base, at mid-scroll they are scrolled away (false), which is the bug this ticket fixes.
- **(d) A real mouse click (fine, after hovering) or a real tap (coarse) on the first row action at mid-scroll opens the sheet.** Modals 0 → 1 and the board does not move (386 → 386 fine, 770 → 770 coarse).
- **(e) Focus rings on pinned controls are not clipped.** A keyboard Tab from "+" reaches the row action with `:focus-visible` and a `solid 2px` outline at a 2px offset, drawn fully. Images: `S/out-main-head/fine-dark-focusring-rowact-mid.png` and `…/coarse-light-focusring-addhero-mid.png` (all 8 are in that folder).
- **(f) A real press on a cell 30 px under the pinned column** ("Kira, round 6 … — edit"): the board does not move on press or release (446 → 446 → 446), the click reaches the cell and its sheet opens. Base behaves the same, because the framework click shield cancels mousedown, so a press never moves focus. Coarse tap: same result.
- **(g) Continuous pane drag**, 760 → 430 → 760 in 3px steps (222 frames, 40 of them where the board fits), with a keyboard-focused row action:
  - pin state wrong on **0** frames in every configuration;
  - focus kept and still `:focus-visible`;
  - **0** error events and **0** console errors (no "ResizeObserver loop …");
  - ResizeObserver callback median 1.1–1.9 ms, max 3.1–10.2 ms;
  - frame time median 16.7–19.2 ms on head against 16.7–29.8 ms on base (machine noise; the re-pin did not measurably slow frames).
- **(h) The 420px container breakpoint.** At 400, 380 and 360 px: `data-overflow=off`, `position: relative`, `z-index: auto`, stacked fill (`rgba(0,0,0,.3)` dark / `.07` light), `box-shadow: none`. These are the same computed values as base. Back at 490 and 760: `on`, sticky, solid fill, edge rule. `montage-narrow*` is among the 34 byte-identical PNGs.
- **(i) Emulated print media** on an overflowing, scrolled board: `data-dse-print=on`, `overflow-x: visible`, name cell `position: relative` with a transparent fill, the same as base. The attribute measures `off` there. Freeze 280/280.
- **(j) Observer cleanup.** In the harness the count of board ResizeObservers grows 1 → 5 over 4 quick-trio rebuilds. That is a harness artefact (INFO-2). With a host that really loads the view, one rebuild leaves **made 2, live 1** (scratch jest test, `S/jest-leak.log`; test text in `S/wt-head-scratch.diff`). The jest unload test covers view unload.
- **Re-pin needed and minimal?** `S/snap-head.log`, `S/snap-norepin.log`, misaligned PNGs in `S/out-snap/`. A row-height change on an already-pinned board, without a pane resize (name-row padding, or text size): **no-re-pin mutation 20/32 misaligned** (divider 1 device px off at fine/coarse × dark/light × 1x/2x). **Head: 0 divider misalignments.** The 8 head "misses" are all light coarse, at the bottom of the tall coarse board: they are the tone drift of LOW-1 crossing my 14-level threshold, not dividers (same rows in the no-re-pin run, stripes every 4px).
- **`scroll-padding-inline-start`, which r1 declined without measuring (`S/run-scrollpad.log`).** With a 100px padding, a Tab or a programmatic focus on a pinned row action at mid-scroll moves the board **386 → 202**. As shipped it stays at 386. This confirms r1's reasoning; the ledger ACCEPT stands.
- **Two boards in one note, a write or rebuild, then adoption in real Obsidian:** covered by the extended G-S13 (both boards pinned on every sampled frame of 6 writes). I re-ran it in part 2 (above).
- **Can-fail proofs and gate non-vacuity.** I re-ran only the board-scroll gate (extracted from the branch's `shoot.mjs`) on a scratch copy with one mutation each. Logs: `S/canfail-<m>.log`.
  - `none` (control): `montage board scroll OK …`, gate rc 0.
  - `nosticky`: `PINNED COLUMN NOT STICKY — at rest: corner is position relative` (×6), plus `MOVED`.
  - `oldfocus`: `TAB FOCUS NOT FULLY VISIBLE — Shift+Tab: Talin, round 8: … 86.7px of its left edge lies under the 99.2px pinned hero column` (also round 9 at 3.5px, 7, 6, 5 and 1).
  - `nozindex` (sticky without z-index): `PINNED CELL COVERED — mid-scroll: corner centre hit SPAN.dse-mt__rhead-w belonging to board-rhead r4`. So the hit-test is real.
  - `translucent` (dark solid dropped): `PINNED CELL NOT OPAQUE — at rest: name cell Kira background-color rgba(255, 255, 255, 0.016)`.
  - `noearlyreturn` (pinned cells not exempt from the focus handler): `a stop in a PINNED cell moved the board (628.0px -> 529.0px)`.

## Findings

### LOW-1: the pinned fills are literal colours copied from `--dse-card-bg`; they drift on a tall card and are silently coupled to the token

**Where:** `draw-steel-elements/styles-source.css:4716-4729` (`#23292d` / `#f8f9f9` name cells, `#21282b` / `#fcfdfd` corner). These are copied from `--dse-card-bg` at `:6994` (dark `linear-gradient(160deg, #232a2e, #181c1f)`) and `:14306` (light `#ffffff → #eef1f1`). `test/dom/elements/montage.test.ts:2160` requires a literal `#rrggbb`.

**Can the surface under the board vary at runtime?** I checked every source the owner listed.
- **DSE preferences** (`src/prefs/catalog.ts`): none sets a colour. The scale prefs change geometry only. `printPreview` sets `data-dse-print`, and the print tier never pins.
- **Variants and density:** `sbDensity` is for statblocks only.
- **Obsidian theme and accent:** `--dse-card-bg` is a hard-coded gradient in the two steel token blocks. Only light versus dark selects between them (`.theme-light` ancestor). The pin follows that with `body.theme-light &`, the same predicate the base banding uses.
- **Callout, embed, sidebar:** the `.dse-mt` card paints its own opaque gradient, so nothing behind the card shows. A sidebar under 420px is the stacked layout, which does not pin.
- **Legacy and print blocks** set `--dse-card-bg: none`, but the pin lives only in the steel non-print tier.

So nothing changes the token at runtime. What does vary is **where on the card's 160deg gradient the board sits.** The card spans head, brief, strip, board, outcome band and guide. A solid fill cannot follow the gradient, while the old translucent banding did.

**Measured** (`S/out-tone/tone.txt`, `S/out-tone/tone2.txt`; base and head at scrollLeft 0, where the layout is identical; per-pixel max difference per channel inside the name column; "seam" = pinned cell against the first round cell beside it):

| Card | Dark: name column drift / seam (base seam) | Light: name column drift / seam (base seam) |
|---|---|---|
| Gate-size card (5 heroes, no brief, board 128–141px into the card) | 2 / 2–3 (2) | 3 / 3–4 (1–2) |
| 5 heroes + a ~2,500-character brief (board 772–1196px into the card) | 5–6 / 5–7 (1) | 7–8 / 7–9 (2) |
| 8 heroes + brief | 5–6 / 6–7 (1–2) | 6–7 / 7–8 (2) |
| 25 heroes + brief | 6 / 5–6 (1) | 7–8 / 7–8 (2) |

The r1 report's "within 1–2 levels per channel" holds only for the gate-size card in dark; light is already 3 there.

**Failure scenario:** a Director writes a long brief, and the montage is viewed in light theme. On an overflowing board the pinned name column is a flat near-white `#f8f9f9`, while the rounds beside it fade to about `#f0f3f3` toward the bottom. The pinned column reads as a slightly brighter strip, 7–9 levels against 1–2 before. The 1px edge line softens the step but does not hide the lighter strip.

A second, latent failure: anyone who retunes `--dse-card-bg` (two token blocks) gets a pinned column that no longer matches, and nothing fails.

DESIGN.md rule 3 ("compose existing tokens") and the plugin-only surfaces note at `styles-source.css:11338` ("not one new colour is introduced") both point the other way. These are the montage tier's only solid hex fills; the precedents elsewhere are the crest and seal discs at `:8846` and `:14212`.

**Prescribed fix** (owner's choice; none of these removes the drift, which comes from decision 3's solid fill):
- **A, the minimum. No new token, no look change.**
  - Add a cross-reference comment at both `--dse-card-bg` definitions (`:6994`, `:14306`) pointing at the SC-490 literals.
  - Add a jest guard in the SC-490 describe. It parses both gradients' stops from the token blocks and asserts each pinned literal lies inside the stops' per-channel range, after removing the cell's own tint. Retuning the token then turns the guard red.
- **B, token-derived (decision 3 asks to report new tokens):**
  - Add one token, `--dse-card-solid`, to the two steel token blocks: dark `#20262a`, light `#fafbfb`. Set it to `none`/`transparent` in the legacy and print blocks and register it in `src/framework/tokens.ts`.
  - Compose the existing banding over it:
    - name, dark: `var(--dse-sheen-soft), linear-gradient(rgba(255,255,255,.015), rgba(255,255,255,.015)), var(--dse-card-solid)`;
    - name, light: `linear-gradient(rgba(0,0,0,.012), rgba(0,0,0,.012)), var(--dse-card-solid)`;
    - corner: the existing header gradient `, var(--dse-card-solid)`. The corner lands 1–2 levels off r1's top-edge `#21282b`.
  - Relax `montage.test.ts:2160` to accept `var(--dse-card-solid)`.
- **C, exact. Removes the drift, at the cost of more JS:** BoardView already measures in `trackOverflow`. It could write the card's size and each pinned cell's offset in the card as custom properties. The pinned cells would then draw `var(--dse-card-bg)` itself with a matching `background-size`/`background-position`, needing a ResizeObserver on the card as well. I would not do this now.

Recommendation: **A** (or **B** if the owner accepts one token), plus showing Scott a light-theme long-brief crop in the land-ready comment so he judges the drift himself. In prose: the pinned column is a flat near-white; the rounds beside it are a hair greyer toward the bottom.

### INFO-1: the scrolled content shows through at the frame's left corner arcs

`styles-source.css:4709-4714`. The sticky cells are composited separately from the scrolled content, so at the antialiased pixels of the frame's top-left and bottom-left `border-radius` arcs, 20–50% of whatever is scrolled under them shows through. Measured with magenta rounds: 18 px at 1x, 37 px at 2x (`S/run-bleed.log`, `S/out-bleed/`). With real colours (dark round headers and cells under dark pinned cells) the difference is a few levels and invisible. No action.

### INFO-2: the harness never loads a view, so in the harness every rebuild keeps its old observer

`visual-harness/entry.ts:2155` (`addChild: (child) => child`). Owner-registered teardown never runs in the harness: board ResizeObservers go 1 → 5 over 4 rebuilds, and SC-326's `restoreBoardScroll` MutationObservers leak the same way. In jest with a loading host and in real Obsidian, `unloadOwnedChildren` disconnects (scratch test: made 2, live 1). No defect in the plugin. Worth one line in the proposal's footguns: "a harness probe cannot measure teardown; use jest with a loading `addChild`".

### INFO-3: the re-pin runs on every resize while the board overflows, including width-only resizes

`BoardView.ts:146-151`. The glitch needs a row-height change, and a width change that keeps the board overflowing leaves the columns at their floors, so row heights do not change. The callback still forces one extra layout per callback: 1–2 ms median, max 10 ms, no visible cost. Optional trim: remember the board's last `contentRect.height` from the observer entry and re-pin only when it changed. The jest re-pin test would need a height in its fake entry. Not required.

### INFO-4: the shots gate measures dark theme only

`visual-harness/shoot.mjs` (`bg: 'dark'` in `assertMontageBoardScroll`). Light-theme opacity is pinned only by the jest CSS contract (`montage.test.ts:2150-2161`) and by my probe (a) in light: unchanged under magenta except at the arcs. Optional: run the same check in light too, or just measure step 6 there.

### INFO-5: no shot shows an overflowing board

All 34 montage PNGs are byte-identical to base, which is decision 2 working. As a result the pinned look and the sub-pixel divider alignment are gated by computed-style and hit-test checks plus scratch pixel probes, never by a stored PNG. This was a known DROP (ledger, r1 Follow-up 5). Noted only so nobody reads the 34/34 as visual coverage of the pin.

### INFO-6: base moved; rebase before landing

- dse `origin/develop` went `0698550f` → `ea78ebf8` (SC-547: `src/framework/host/ReadingModeBlockHost.ts`, `remountReused.ts`, `test/dom/framework/twin-reuse.test.ts`). None of these overlaps SC-490's six files. The jest total will rise by SC-547's tests.
- Superproject `origin/main` went `3ba3f721` → `64fcd141`. Its SC-547 changelog entry sits under `## Unreleased`, the same spot as SC-490's first bullet: expect a one-hunk text conflict.
- The dse-verify proposal's CURRENT numbers need recomputing after the rebase.

## Things I checked and found sound (no finding)

- **Decision 1:** exactly the corner and the name cells pin (`PINNED_CELLS`, `BoardView.ts:57`). Round headers, cells and the Tally scroll. No vertical pin.
- **Decision 2(b):** the overflow attribute is set synchronously at build and then by an owner-registered ResizeObserver over the frame and the rounds + 2 header cells.
  - Correct after the SC-326 restore path: `sync(false)` runs before `restoreBoardScroll`, and G-S13 holds on every frame.
  - Correct after a pane resize in both directions: probe (g), 0 bad frames.
  - Two boards: G-S13.
  - Popout-safe: it uses `ownerDocument.defaultView.ResizeObserver`.
- **Decision 3:** solid fills (see LOW-1). The edge rule is `inset -1px 0 0 var(--dse-metal-line)`: an existing token, no layout move, no drop shadow.
- **Decision 4:** the stacked reset at `styles-source.css:5487-5496` has the same specificity as the pin and comes later in the file, so it wins. The computed values match base (probe (h)). The print tier is untouched (freeze 280/280, probe (i)).
- **Decision 5:** the hover and focus reveal works fine and coarse; the button is never covered (probe (c)), a real click or tap opens the sheet (d), and the ring is intact (e).
- **Decision 6:**
  - The focus helper's arithmetic matches the spec, and jest pins it.
  - Tab stops in pinned cells never move the board: the gate, plus the `noearlyreturn` mutation, which turns it red.
  - No Tab stop lands under the column in either direction (gate).
  - `scroll-padding-inline-start` was rightly declined (measured: 386 → 202).
- **Decision 7:** every gate clause is present and non-vacuous: mid-scroll "underneath > 0" anti-vacuity, a real hit-test, the two-direction Tab walk, and the fits/re-pin step. Five mutations each fail it.
- **Decision 8:** no new scenario; the G-S13 header carries no fixed total.
- **Decision 9:** the superproject `CHANGELOG.md` `## Unreleased` bullet is present and user-facing. DESIGN.md has no montage section, so leaving it alone is correct. SKILL.md is untouched, and the proposal file exists.
- **Z-order:** nothing inside a montage cell sets a z-index, transform or `position: absolute` above `auto` (the absolute note and edit marks sit inside their own cells). The read-only badge (`z-index: 1`, top right) and the chrome panel (`z-index: 3`, above the card) never overlap the pinned column.

## Artifacts

All under `S` = `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc490-review1-a7e5ad5d9f152a0e1/`:
- **Gate logs:** `rv1-tsc.log`, `rv1-lint.log`, `rv1-jest.log`, `rv1-lc1.log`…`rv1-lc5.log`, `rv1-e2e.log`, `rv1-shots-r1793685022.log`, `rv1-freeze.log`, `rv1-parity.log` (each with a `.rc`, except shots, whose rc is the log's `END … rc=0` line); `base-montage.log`.
- **Probes:** `probe-main.mjs`, then `run-main-head.log`, `run-main-base.log`, `out-main-head/` (magenta and focus-ring PNGs), `out-main-base/`.
- **Tone:** `probe-tone.mjs`, `probe-tone2.mjs`, `out-tone/tone.txt`, `out-tone/tone2.txt`, `out-tone/tone-*.png`.
- **Divider alignment:** `probe-snap.mjs`, `snap-head.log`, `snap-norepin.log`, `out-snap/`.
- **Bleed:** `probe-bleed.mjs`, `run-bleed.log`, `out-bleed/`.
- **Scroll padding:** `probe-scrollpad.mjs`, `run-scrollpad.log`.
- **Can-fail:** `canfail.sh`, `mut.py`, `gate-only-gen.mjs`, `canfail-none.log`, `canfail-nosticky.log`, `canfail-oldfocus.log`, `canfail-nozindex.log`, `canfail-translucent.log`, `canfail-noearlyreturn.log`.
- **Leak:** `jest-leak.log`; scratch diffs `wt-head-scratch.diff`, `wt-mut-scratch.diff`.

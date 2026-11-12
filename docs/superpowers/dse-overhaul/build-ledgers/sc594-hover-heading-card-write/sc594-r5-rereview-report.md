# SC-594 r5 scoped re-review of the r4 delta (reviewer-r3 af5a9cc3), dse c36973e5 on b5d18f79, superproject bcdb8848

**Executive summary**
- **Verdict: FIX FIRST (docs only).** CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 2 · INFO 4. No code change is required to land.
- **HIGH-1 is closed in real Obsidian, RV and LP.** Swap, paste and delete with a lagging cache are each refused (nothing written, one Notice). The 0bf5989d bundle writes in all three. G-S92 (j) is red on a 0bf5989d bundle and green on HEAD.
- **The conditional one-place check is fine.** Unique body plus stale cache: refused in every shape (the hanging-line check is unconditional). The wrong-block landings I found need a FRESH cache with one heading of that name left, so the "always" variant would not refuse them either.
- **Setext heading in real Obsidian:** refused with a twin (RV and LP) and also with a unique body (a cost already documented). The twin is never written.
- **LOW-2 hardening holds.** P2, P2b, P3 and P3b are refused. In real Obsidian there are no false refusals for the ticket shape, a block hover, a whole-note hover (G-S92 (a)-(k)), a closing `##`, a lower-case link, or a nested `#Top#Tracker` (RV and LP).
- **MEDIUM-1 (docs, pre-existing behaviour):** with a fresh cache the + follows the link's CURRENT target. The preview never redraws when the part's text is unchanged (measured over 1.5 s). So "first of two `## Tracker` sections deleted" and "heading names swapped" write the other counter, as base does too. Both CHANGELOGs and proposal item (2) claim these are refused.
- LOW-1: the block-link residual (`^a` preview bound to `^b`) still writes the twin in jest; the DOM cannot tell two block previews apart, and the docs say the residual is closed. LOW-2: mutant mZ6 (a heading regex that accepts a `#tag` line) survives.
- Mutants: all 33 r4 mutants reproduce exactly (mM survives, equivalent); mine: mZ3 and mZ5 killed, mZ6 survives.
- Gates on c36973e5: tsc/lint clean · jest 7658 passed / 2 skipped · lifecycle p5 7/7 (445 s) · p3 9/9 (402 s) · e2e 272/276 ok, 0 failed, 4 known-bug, 169/169 · styles.css 5e5ff488 = a clean b5d18f79 build.

## Rebase check
`git range-diff e0e49d4d..0bf5989d b5d18f79..e4d96a0d`: the 5 r2 code/test commits are `=` (unchanged: 46f42255, dc10b3ec, 88830cc8, ec64b48a, 6141877a). Only the CHANGELOG commit (e4d96a0d) differs, in context lines (the SC-589 bullet above it). The r4 delta is e4d96a0d..c36973e5 (7 commits).

## 1. HIGH-1 (verify in real Obsidian)
Scratch scenario T7 (as in r3): a heading hover `[[src#Tracker]]` with identical counters under `## Tracker` and `## Other`, an outside `vault.process` edit, then a scripted + on the old card in the same task. At the click the cache still had the old lines (`Tracker@4`).

| edit | c36973e5 RV | c36973e5 LP | 0bf5989d (r3) |
|---|---|---|---|
| `## Other` moved above `## Tracker` | refused, 1 Notice, `[5,5]` | refused, 1 Notice | wrote Other |
| identical `## Tracker` pasted above | refused, 1 Notice, `[5,5,5]` | n/a | wrote the top one |
| `## Tracker` section deleted | refused, 1 Notice, `[5]` | refused, 1 Notice | wrote the counter under `## Other` |

**The conditional one-place check (owner's question).** The hanging-line check (`ReadingModeBlockHost.ts:1010`, `named.includes(start)`) runs whether or not the body is unique. With a stale cache, the cache's line is a heading line in the text only when it still is that heading. Every unique-body plus stale-cache shape I built is refused:
- jest J20 deleted;
- the r5 probes;
- T7 delete, where the body is unique after the deletion.

The landings that remain (MEDIUM-1) all happen with a fresh cache and exactly one `## Tracker` left in the text, so `named.length === 1` and the "always" variant would not refuse them either. Where "always" would differ (two headings of that name, unique body: J7 / J11), the conditional rule can only go wrong if the hovered section was both moved below another section of the same name AND edited, all in one outside edit. I count that as acceptable.

**Setext (owner follow-up 1), real Obsidian T10:** `Tracker` over `---` with a twin under `## Other`, real hover and real click. Refused with 1 Notice in RV (`[5,5]`) and in LP (`[5,5]`). A setext heading with a unique body is refused too (`[5]`, 1 Notice; the documented cost). The twin is never written.

## 2. LOW-2 hardening
- jest (`sc594-r5-probe-jest.test.ts.txt`, with the preview DOM Obsidian draws): P2 (open before load, pass-over `#Other`), P2b (pass-over `[[Note]]`, twin above), P3 and P3b (the residual) are all refused, and the note is unchanged.
- `popoverShows`: the units R5 pass (heading, other heading, whole note, block). The null-binding at registration is killed by mD6 (J21).
- **No false refusals in real Obsidian:**
  - G-S92 (a)-(k) pass on HEAD (part 5 below): heading in RV/LP, short note, block hover, second +, callout, whole-note hover, hover X then Y.
  - T11 (`## Tracker ##`, closing hashes), T12 (`[[src#tracker log]]` for `## Tracker Log`) and T13 (`[[src#Top#Tracker]]`) all land in the hovered counter (`[6,5]`, no Notice) in RV and LP.
  - The jest probes R4 for closing hashes and case refuse, but that is the jest cache mock's own `resolveSubpath` (no closing-hash strip, exact case), not the product.

## 3. Tests with teeth
- r4 mutants re-run with the r4 runner (copied as `sc594-r5-probe-mutate.py.txt`) against the three committed suites (496 tests): every count matches `sc594-r4-mutants.log`.
  - mL2 2 (J19); mX10 1 and mX12 1 (J22); mG 1 (J10); mN 1 (J17); mY1-mY4 2 each; mY5 49; mD1 4; mD2-mD6 1-2 each.
  - mA through mS as r4 reported. mM survives (equivalent).
- Reviewer mutants on the r4 code:
  - mZ3 (any heading of that name instead of the hanging line): killed by J20 swap.
  - mZ5 (names compared case-sensitively): killed by the `atxHeadings` unit test.
  - mZ6 (`#{1,6}[ \t]*`, which counts a `#Tracker` tag line as a heading): **survives**, LOW-2.
- **G-S92 (j) is red on a 0bf5989d bundle** (0bf5989d's `ReadingModeBlockHost.ts` + `hoverLinks.ts` built in this tree; main.js `7705dbfb…`). `sc594-r5-gs92-on-0bf5989d.log` gives only `G-S92 FAIL: (j) … a + was written into a counter, values [6,5]; expected the one Notice …, got []`, and every other trial passes. (k) is a meaningful regression guard: it is the only real-Obsidian trial where two previews are bound one after the other on one parent with the DOM check active. It is not a red test (green on 0bf5989d), as r4 says.

## Findings

### MEDIUM-1: with a fresh cache, a stale preview's + follows the link's CURRENT target, and the docs claim these shapes are refused (behaviour pre-existing, the claim is new)
- **Where:** dse `CHANGELOG.md` SC-594 bullet ("A click is also no longer written into a counter you did not hover when the note was edited from outside … a counter whose section was edited, moved, pasted over or removed from outside before the click"), the same in the superproject worktree `CHANGELOG.md`, and `sc594-dse-verify-proposal.md` §2 "Still refused" item (2) and "The 17-44 ms window".
- **Measured (real Obsidian, scratch T9).** After an outside edit, the metadata cache catches up in 6-45 ms (RV 12-45 ms, LP 6-8 ms; n = 6, names swap). When the hovered part's TEXT is unchanged, **the preview is never redrawn**: the old card stayed connected through 1.5 s in every trial (`tGone: null`). The old card is then clickable with a fresh cache:

  | edit (fresh cache, scripted click) | c36973e5 RV | c36973e5 LP | base b5d18f79 |
  |---|---|---|---|
  | first of two identical `## Tracker` sections deleted (the hovered one) | wrote the other `## Tracker` counter (`[6]`), no Notice (2 of 2) | wrote it (1 of 2 runs; the other refused) | RV wrote, LP wrote |
  | the two heading names swapped (hovered counter now under `## Other`) | wrote the counter now under `## Tracker` (`[5,6]`) | same (2 of 2) | RV wrote, LP refused |

  Jest R2 / R3 reproduce both.
- **Severity:** the delete shape is G-S73's own invariant (a block deleted from outside is never written into its identical twin). It needs two same-named sections with identical counters, and the hovered one deleted. It is pre-existing on base and not a regression; the renamed-headings shape is arguably correct (the preview now shows `#Tracker`'s section, which IS the other counter's). What is new is the docs' claim. The "(the preview not redrawn yet)" / "17-44 ms" framing is wrong for edits that leave the part's text unchanged: the window does not close.
- **Fix (land):** reword both CHANGELOG bullets and proposal item (2). Suggested text: "removed from outside — unless another section of the same name with the same contents is left, which then receives the click (as before)". Add a "Known limit" line to the proposal: with a fresh cache the click follows what the link names now, and a preview whose part text did not change is not redrawn. **Fix (optional, Backlog):** give a hover card a pin of the note as drawn: `cachedRead` at mount plus `cardLinkLine` on that text with the then-fresh cache. At click, map that line through `mapLine` and require it to equal the link's line now. That refuses the delete shape and keeps the hovered block in the swap shape.

### LOW-1: the block-link residual is not closed by the DOM check, but the docs say "this closes the residual"
- **Where:** `hoverLinks.ts` `popoverShows` (a block link only needs `data-type=block`), proposal §2 "The DOM cross-check" ("This closes the residual r2 named"), and the CHANGELOG ("one that does not show the link it was opened for").
- **Scenario (jest R1):** a `^a` preview whose first lookup binds a `^b` event (the residual: `^b`'s event before the popover exists), with identical blocks. The `^b` marker check passes at B, so **B is written** (`[5,6]`). It cannot be reached by a real pointer in 1.15.1 (r3 INFO-1), and the heading residual IS closed (P3).
- **Fix:** proposal wording: "closes it for heading links; two block previews cannot be told apart by the DOM (no id is rendered), so the block residual stays as unreachable-by-pointer". No code change.

### LOW-2: mutant mZ6 survives (`atxHeadings` accepting `#Tracker` with no space)
- **Where:** `src/framework/host/headingNames.ts:26`. A `#tag` line would count as a heading of that name.
- The live effect is small: it can only add a match, so a refusal by the count, or a stale-cache hanging line landing on a tag line followed by an identical part.
- **Fix:** add `#Tracker` (a tag line) to the `atxHeadings` unit test's input.

### INFO
- **INFO-1, `## Tracker: one`:** still refused, as ruled. The CHANGELOG and proposal (5) list it.
- **INFO-2, the r4 report's "Follow-ups" 1:** now measured (§1 setext).
- **INFO-3, styles:** `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for HEAD and for the b5d18f79 versions of the two changed `src` files (main.js `0d3653ca…` vs `0a369b34…`, the same as r4's), so shots / freeze / parity carry.
- **INFO-4, base comparison:** I did not re-run G-S92 on a b5d18f79 bundle (r2's e0e49d4d red evidence stands; SC-589 touched only initiative/view.ts).

## Gates (c36973e5; logs in the ledger dir)
- tsc incl. `tsc -p e2e`: `rc=0`, `rc_e2e=0`. lint: `lint_rc=0` (`sc594-r5-gate-tsc-lint.log`).
- jest: `Test Suites: 1 skipped, 264 passed, 264 of 265 total` / `Tests: 2 skipped, 7658 passed, 7660 total` (52 s; `sc594-r5-gate-jest.log`).
- lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S92`: `OBSIDIAN-LIFECYCLE done: 7/7 ok, 0 failed`, wall 445 s, loadavg 0.70; G-S92 ok with (j) "nothing written, one Notice" and (k) `[5,6]` (`sc594-r5-gate-lifecycle-part5.log`).
- lifecycle part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`, wall 402 s, loadavg 1.26 (`sc594-r5-gate-lifecycle-part3.log`).
- e2e: `OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (SC-257, SC-384, SC-580, SC-355), rc=0, 130 s (`sc594-r5-gate-e2e.log`).
- styles.css: identical to a clean b5d18f79 build (`sc594-r5-gate-styles-css.log`).

## Artifacts (ledger dir)
- `sc594-r5-probe-jest.test.ts.txt`: probes P2, P2b, P3, P3b, R1-R6; ran uncommitted, now removed.
- `sc594-r5-probe-jest-head.txt`
- `sc594-r5-mutants.txt` and `sc594-r5-probe-mutate.py.txt` (the r4 mutants plus mZ3, mZ5, mZ6)
- `sc594-r5-probe-lifecycle-scenario.mjs.txt` and `sc594-r5-probe-make-scratch.py.txt`
- `sc594-r5-probe-obsidian.txt`: every real-Obsidian record (HEAD, plus the base T9 comparison)
- `sc594-r5-gs92-on-0bf5989d.log`
- `sc594-r5-gate-*.log`

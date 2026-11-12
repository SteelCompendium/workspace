# SC-607 r3 independent adversarial review (reviewer-r3), dse 1daa7d8a on 622b0904

**Executive summary**
- **Verdict: FIX (docs + tests; no code change required).** 0 new different-counter writes: every different-counter write I could build on 1daa7d8a also writes at 622b0904 (11 jest probe cells, 0 regressions); 160 base TWIN sweep cells -> refused; G-S99 red 7/7 on a 622b0904 bundle, control green; the amended R-Q3 guard closes the hover mount race in real Obsidian (refused; with the guard switched off the same cell writes the other counter).
- **MEDIUM F1:** a MOVED section (unique body, no identical counter anywhere) is refused for as long as the preview stays open. Base saved it. Seen in real Obsidian: embed and hover, base `[9,6]` no Notice, head `[9,5]` and one Notice. This class is not among the accepted R-Q2 classes and neither CHANGELOG names it. r2's mutant M19 survived because no test has a move. M19 is NOT a safe fix: it re-opens 3 shapes that write a different counter. The owner decides: document it, or find a narrower rule.
- **LOW:** F2 the redraw race (P9: an outside edit redraws the preview and a second one lands within ~20-23 ms, measured; the guard skips) is an undocumented residual. F3 an unrelated outside edit inside the hover mount window refuses that card for good (P8; real Obsidian, base saved twice). F4 the R-Q2c give-up writes a different counter in the N5 family (P10, P11b; base does too). F5 the CHANGELOGs and the proposal leave out F1-F4, residual (2) and the >400-line refusal. The proposal's mutant claims are stale (M9 anchor, "M19 not constructible").
- **Tests with teeth:** r2's 28 mutants re-run on 1daa7d8a: 22 killed / 6 survived, the same as r2 (M9 needed its anchor fixed). My 13 mutants: 5 killed, 8 survived. **N6** (no strict check after the link places the pin) is a real gap: my P19b (a block form opened, then the upper of two adjacent identical blocks deleted, Save) writes the twin under N6 and is refused at head. The 4 redraw tests without `rebind` are not vacuous: they are the ONLY tests that kill N18 (own-write-first branch, 14 tests), but they reach it through a state Obsidian does not produce.
- **Gates (re-run):** tsc and lint clean · jest 11510 passed / 1 skipped (warm worktree, = r2's 11509/2 fresh) · lifecycle p6 `G-S92 G-S96 G-S97 G-S99` 4/4 297 s, p5 7/7 390 s · e2e `280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (141 s) · styles.css `5e5ff488…dc2b27` is identical to a clean 622b0904 build, so shots, freeze and parity carry.
- **G-S91:** 0/6 failed on the branch and 0/6 on the base, run alternately at load 0.6-1.3, plus 1/1 green in part 5. The branch does not raise the rate. **Baseline moved:** dse develop is now **d0561a68** (SC-580/SC-583, conditions only, no file overlap) and workspace origin/main is 5d4611a3. Both need a rebase before land-ready.

## 1. Invariant hunt (jest)

Probe: `sc607-r3-probe.test.ts.txt` (90 cells, copied into the tree for each run and removed by its literal path). It ran on the head sources and on a scratch worktree of 622b0904. Table: `sc607-r3-jest-probe-table.txt`.

Each probe is judged against the counter the card was drawn from. SAME means that counter was written; DIFFERENT means another counter was.

| probe | 622b0904 | 1daa7d8a | note |
|---|---|---|---|
| P1a-d three identical `## Tracker` sections (adjacent, or with unique paragraphs between); first / middle / last deleted; hover + embed | refused | refused | the link names two places (SC-594) |
| P2a/b moved to the end + TOP edited, an identical Other (card, form) | SAME | **refused** | the move is ambiguous with an identical twin: acceptable |
| P2c moved below an identical Other (the same text as a swap) | SAME | **refused** | indistinguishable from the swap: must refuse |
| **P2d/e/f the hovered section moved, body unique** (to the end / below Other / below 30 filler lines), hover + embed | SAME | **refused** | **F1** |
| P2g control: a paragraph added above | SAME | SAME | |
| P3 +, unrelated edit, + (stale), names swapped, + | SAME | SAME | |
| P4 / P5 + then redraw (rebind / NEW card), then the first of two now-identical sections deleted, + | DIFFERENT | refused | fixed |
| P6 race (names swapped before the card's read, cache fresh), hover, `embed.data` = drawn | DIFFERENT | refused | the guard closes it |
| P6 the same, `embed.data` absent / not a string | DIFFERENT | DIFFERENT | ruled: skip on absence |
| P6 the same, embed (no popover) | DIFFERENT | DIFFERENT | documented embed window |
| P7 race: the first of two adjacent identical deleted; hover / embed | DIFFERENT | refused / DIFFERENT | the part occurs twice in the stale data: the guard still applies |
| **P8 race: an UNRELATED edit before the card's read; two clicks** (hover) | SAME | **refused x2** | **F3** |
| **P9 redraw race** (the part edited, so a new card; a second write before its read deletes the section and edits a lower counter to match) hover + embed | DIFFERENT | DIFFERENT | **F2** (guard skipped: the part is not in the stale data) |
| P9c the same without the race | DIFFERENT | refused | fixed |
| **P10 give-up (+1000 lines): Tracker deleted, Other renamed Tracker and edited to match**, hover + embed | DIFFERENT | DIFFERENT | **F4** |
| P10b the same, no give-up | DIFFERENT | refused | |
| P11 give-up N5 (`^pa` deleted, `^pb` edited to match) | refused | refused | the link has no marker |
| **P11b give-up N5 + the marker renamed to `^pa`** | DIFFERENT | DIFFERENT | **F4** |
| P11c the same, no give-up | DIFFERENT | refused | |
| P12 form, names swapped, Save; P13 swap with the cache lagging | DIFFERENT / refused | refused | |
| P14 no edit, three + with rebind redraws | SAME | SAME | |
| P15 no edit, + then a NEW-card redraw, the new part also in the stale data (hover) | SAME | refused | accepted residual (2) |
| P16 whole-note hover / embed / plain card x card / form x {none, unrelated, identical added above, other deleted, names swapped} (30 cells) | SAME | SAME | no change |
| P19a/c form opened BEFORE the edit: adjacent identical sections, upper deleted / names swapped | refused / SAME | refused / SAME | |
| P19b block form opened on `^pa`, then `^pa` (upper of two adjacent identical) deleted, Save | (not run at base) | refused | kills N6 (see §3) |

Different-counter writes at head: **11 cells, all also DIFFERENT at base.**
- 6 are documented residuals: the embed window (P6 embed x3, P7 embed) and the hover with no `embed.data` (P6 hover absent / not a string, x2).
- 2 are the undocumented redraw race (P9 hover + embed: F2).
- 3 are the undocumented give-up N5 family (P10 hover + embed, P11b: F4).

r2's 768-cell sweep, re-run cell by cell on both sources (`sc607-r3-sweep-base-vs-head.txt`):
- A -> A: 424
- TWIN -> refused: 160
- refused -> refused: 168
- A -> refused: 16, all the accepted R-Q2a class (block link, lower of two adjacent identical blocks hovered, upper deleted)
- refused -> A: 0
- no-edit / unrelated-edit cells changed: 0

## 1b / Real Obsidian 1.15.1 (scratch bundles; harness copy `R607`; logs `sc607-r3-obsidian-*.log`)

The instrumented head build changes only two things (`sc607-r3-instrument.py.txt`):
- `__r3Delay` moves the card's snapshot (the metadata cache AND the `cachedRead`) later by that many ms;
- `__r3NoGuard` turns the guard off.

| cell | 622b0904 | 1daa7d8a | observation |
|---|---|---|---|
| race-guard: heading hover; names swapped after Obsidian's read and before the card's snapshot (1500 ms window) | n/a | **refused, 1 Notice** | Obsidian's read was 127 ms before the snapshot call (same as r1's 104-128). Guard: `eq:false holdsPart:true partCount:2` |
| race-noguard: the same with the guard off | n/a | **writes the lower `[5,6]`, no Notice** | the shape is reached, so the refusal above comes from the guard |
| race-adj: the first of two adjacent identical deleted in the window | n/a | refused | |
| race-lp: Live Preview host | n/a | refused | |
| race-unrel: an unrelated edit (TOP) in the window, two clicks | **saved 6, then 7** | **refused both** | F3 |
| emb3-lp: Live Preview heading embed, three identical, first deleted | refused | refused | |
| embform-swap: heading embed, names swapped, form opened after, Save | **wrote "Edited" into the other counter** | refused | a new real cell; the embed form is fixed |
| embmove-rv: heading embed, unique Tracker moved to the end | **saved `[9,6]`** | **refused `[9,5]`, 1 Notice** | **F1**; the embed was not redrawn (old card still mounted 1.8 s later) |
| hovmove-rv: the same as a hover | **saved `[9,6]`** | **refused** | **F1** |
| plus-del: real +, then the first of two "identical" sections deleted | n/a | shape not reached | The plugin writes the YAML in its own key order, so after a + the twins no longer have the same text, and Obsidian redrew (a new card). |
| gap-hover / gap-embed: an outside edit that changes the part | n/a | redraw: new card's snapshot call 23 ms / 20 ms after the write | No Obsidian `read` / `cachedRead` in between: the redraw draws from the write itself. This is the F2 window. |
| crlf-ctl: CRLF note, hover, no edit, real + | **refused** | refused | pre-existing (follow-up), not SC-607 |
| odd-ctl / odd-emb: frontmatter, `&amp;`, `**md**`, `[[link\|alias]] #tag`, `## X ##`, setext, unicode headings; hover + embed | n/a | saved, `metaOk:true` | `metaMatchesText` does not refuse these |
| plain-rv / plain-lp | n/a | every snapshot `whole:true` | nothing is held for plain cards |
| ctl | saved | saved | |

Does the amended guard open a hole?
- **A part that occurs twice in the stale data does NOT open one.** The guard still applies (`partCount:2`, refused).
- **The guard is skipped only when the stale data does not hold the part.** That happens only after a redraw that mounts a NEW card. The race there is F2: about 20-23 ms after an outside write that redraws the preview.

## 2. No regressions where base saved

- Whole-note hover, whole-note embed and plain cards, card and form, 30/30: the same at 622b0904 and at head (P16).
- Sweep no-edit and unrelated-edit cells: 0 changed.
- Real Obsidian: ctl, odd-ctl and odd-emb save.
- **Exceptions where base saved and head refuses:**
  - **moves (F1);**
  - an unrelated edit inside the hover mount window (F3);
  - the accepted R-Q2a class (16 sweep cells);
  - residual (2) (P15).

## 3. Tests with teeth

The mutants ran in a scratch worktree at 1daa7d8a. The suites were drawn-pin, pin, hover-card, form-pin and lineMap: 4194 tests (`sc607-r3-mutants.log`).

**r2's 28 mutants:**
- M1 17, M1b 50, M2 67, M3 64, M4 1, M6 1, M9 1 (anchor fixed to `snapshotDrawn(true)`), M10 1, M11 10, M12 247, M13 25, M14 3, M15 1, M16 1, M17 2, M20 220, M21 1, M23 1, M24 220, M25 1, M26 1, M27 53 killed.
- M5, M7, M8, M18, M19, M22 survived.
- 22/6, the same as r2. r2's M1-M19 numbers were measured before 192cfdb1, and its M9 anchor no longer exists at 1daa7d8a.

**Mine (13):**

| mutant | change | result |
|---|---|---|
| N1 | drop the `seq <= seqAtPin` filter | survived (defence in depth: no re-bind lands between the pin and its rebase) |
| N2 | drop the `drawnToken` check | survived (reads resolve in order) |
| N4 | do not await the snapshot read | killed 247 |
| N6 | the link-placed pin is not made strict | **survived. A real gap: P19b writes the twin under N6** (`sc607-r3-jest-probe-under-N6-M19.txt`); G-S99 (e2) covers it only in real Obsidian |
| N7 | not strict in the "part IS the note" branch | survived (rare) |
| N8 | the own-write fallback is not strict | killed 49 |
| N9 | `metaMatchesText` without the headings check | killed 1 |
| N10 | without the end-of-text check | survived (no test) |
| N11 | give-up only when BOTH maps give up | survived (the tests make both give up) |
| N14 | the drawn-as-whole-note path removed | survived (no test) |
| N15 | own-write seq 0 | survived (`?? ownFrom()` fallback) |
| N16 | every snapshot treated as rebound (guard off for mounts) | killed 1 |
| N18 | the own write never places the pin when the link places it | killed 14 |

The 14 tests that kill N18 are exactly the redraw models that set `section.current = …` without `host.rebind`:
- hover-card J5 (line 190), J17 (line 553);
- form-pin `+ (part redrawn after +)` x12.

**Vacuity:**
- These models are not vacuous: they are the only tests of the own-write-first link branch.
- They reach that branch through a state Obsidian does not produce. In a real redraw the re-bind snapshot is newer, so the drawn branch decides.
- hover-card J18 (line 335) is not in the kill list: it is not load-bearing for N18.

**Fix:** fold-in as ruled (call `host.rebind`). Then either keep one explicit own-first unit test, or record N18 as equivalent once no model reaches it. Add P19b (form opened, then upper adjacent identical deleted, Save -> refused) to kill N6. Add a P2d/P2e move pin (refused or saved, per the F1 ruling).

**M19 as a fix for F1** (probe under M19):
- P2d and P2f save, but P2e still refuses.
- It re-opens P10b, P11c and P9c to DIFFERENT.
- Not a safe fix.

**G-S99 at base:** re-run on a clean 622b0904 bundle with the branch harness (`sc607-r3-gs99-on-base-622b.log`).
- 7/7 non-control cells red: (a) RV `[6]`, (a) LP `[6]`, (b) `[5,6]`, (c) `[6]`, (d) `[5,6]`, (e2) and (e3) "form closed after the refused Save".
- The control is green (`[6,5]`, no Notice), so it is not vacuous.

## 4. G-S91 (SC-616)

- Alternating runs, each one Bash call, ~51 s (`sc607-r3-gs91-alternating-6x6.log`):
  - branch 0/6 failed (second press 42-106 ms);
  - base 0/6 failed (39-83 ms);
  - load 0.6-1.3.
- Part 5 at load ~2-3: G-S91 ok.
- The branch does not raise the rate. r2's failures came under higher load.
- The per-mount `cachedRead` does run for G-S91's card (it is a card in a hover). It only reads and changes no DOM, focus or popover state, and G-S91 alone took 50-52 s on both bundles.

## 5. Cost

- Plain cards (RV 4 mounts, LP 2) hold nothing (`whole:true`).
- A part card holds one reference to the vault's cached string plus one cache object. These are dropped on unload, re-bind and re-mount.
- **NIT F7** (`ReadingModeBlockHost.ts:578`): `onRenderChildUnload` sets `drawn = null` but leaves `drawnToken` / `drawnRead`. A read still in flight at unload (3-23 ms) fills `drawn` again on the unloaded host, and it is held until the host is collected. No correctness effect found.
- Timings did not move:

| measure | r3 | r2 |
|---|---|---|
| p6 | 297 s | 297 s |
| p5 | 390 s | 392 s |
| e2e | 141 s | 148 s |
| jest full | 61 s | |
| G-S91 alone | 50-52 s | 50-52 s at base |

## 6. Docs

- **F5 (LOW) dse `CHANGELOG.md` (+ lines 33-40) and superproject `CHANGELOG.md` (b3b94384):** "Rare new refusals" lists only "an identical block added or deleted right next to …" and "a preview that could not be placed".
  - Missing: a section moved while its preview stays open (F1; Scott-visible and persistent); an outside edit within ~0.1 s of opening a hover preview, after which that preview refuses every click (F3); the >400-line rewrite with the counter twice (R-Q2c control); residual (2).
  - The headline "no longer writes a different, identical counter" is absolute. Residuals still write: the embed window (~7 ms), the redraw race (~20 ms, F2), a hover without `embed.data`, and the give-up N5 family (F4).
  - Fix: add the move refusal in plain words, plus one clause such as "except in rare races within a few hundredths of a second of an outside change".
- **Stale sentence in BOTH CHANGELOGs:** the SC-594 entry in the same Unreleased block still says "Known limit (SC-607, as before this fix): a preview left open after the section it shows was deleted or renamed from outside follows what its link names now, so with two sections of the same name and identical counters the click can be saved in the other one." It is at dse `CHANGELOG.md:69-71` and superproject `CHANGELOG.md:72-74`. SC-607 removes that limit. Fix: drop it, or point to the SC-607 entry ("fixed by SC-607 above").
- **Proposal `sc607-dse-verify-proposal.md`:**
  - "Residuals" should add (4) the redraw race (measured 20-23 ms, no Obsidian read in between), (5) the persistent hover-window refusal after an unrelated edit, and (6) give-up N5 family writes (P10/P11b, same as base).
  - "New refusals" should add the move class.
  - The CURRENT block's mutant line should say: M1-M19 re-measured at 1daa7d8a, 22/6 unchanged; M19 IS constructible (moves) but is not a safe fix; N6 gap and P19b.
  - Section 3's G-S91 sentence ("branch 3 of 6") should add r3's 0/6 vs 0/6 at low load.

## Findings by severity

**MEDIUM**

**F1. A moved section is refused while its preview stays open, where base saved.**
- `src/framework/host/ReadingModeBlockHost.ts:1042-1049` (`mapLineStrict(from.text, whole, from.line)`; `typeof at === 'string' || at.line !== linkLine` -> return) with `src/framework/host/lineMap.ts:57-66`.
- Scenario: a dashboard `![[party#Tracker]]` stays open while the user moves `## Tracker` to the end of party.md in another pane. The embed is not redrawn, and every + / Save in it is refused with "changed on disk first" until the dashboard is reopened. Base wrote the moved counter correctly.
- Cause: the map anchors on the fence-opening line, which is the same text in every counter. Myers pairs it with another block's fence (P2e: line 6 -> Other's fence) or calls it deleted or disagreeing (P2d).
- Fix (owner ruling needed): (a) accept it as a refusal class and name it in both CHANGELOGs and the proposal, with a jest pin (P2d/P2e refused). Or (b) find a narrower rule than M19: M19 fixes 2 of 3 move shapes but re-opens P10b, P11c and P9c (base-DIFFERENT N5-family writes). My recommendation is (a).

**LOW**

**F2. The redraw race is not guarded and not documented** (`ReadingModeBlockHost.ts:1037-1040`).
- An outside write changes the part, so the preview mounts a NEW card. A second outside write lands within ~20-23 ms, before that card's snapshot, and deletes the section while editing another counter to match. The stale `embed.data` does not hold the new part, so the guard is skipped and the other counter is written (P9). Base writes it too.
- Fix: document it as residual (4). No code fix is available (no fresher Obsidian handle; the redraw reads nothing).

**F3. An unrelated outside edit inside the hover mount window (~104-128 ms) makes that card refuse every click until the preview is redrawn.**
- Location: `ReadingModeBlockHost.ts:1040` (`shown !== drawn.text`).
- Seen in P8 and in real Obsidian race-unrel (base saved twice). This refusal is not tied to a click within ~20-45 ms of the write: it lasts for the card's lifetime.
- Fix: document it, or (better) when `shown !== drawn.text`, use `shown` as the drawn-from text. The part must occur exactly once in `shown`, else refuse. `mapLineStrict(shown, whole, partLine)` must equal `linkLine`. This closes the same race and saves the unrelated-edit case.

**F4. The R-Q2c give-up fallback writes a different counter in the N5 family** (`ReadingModeBlockHost.ts:1043-1048`).
- Shape: the drawn counter is deleted, another counter is edited to the same body and given the link's heading name or `^id`, and 1000 lines change around it (P10 hover + embed, P11b). Base writes it too. Without the give-up the same edits are refused (P10b, P11c).
- Fix: document it as a residual of R-Q2c. The uniqueness test cannot see "another counter edited to read like it".

**F5. The docs are incomplete or stale (§6).**
- Location: dse `CHANGELOG.md:33-40` and `:69-71` (stale SC-594 "Known limit (SC-607 …)"), superproject `CHANGELOG.md:16-22` and `:72-74`, `sc607-dse-verify-proposal.md`.
- Fix: as listed in §6.

**F6. Test gaps.**
- N6 survives: add P19b (`reading-mode-host-drawn-pin.test.ts`).
- M19 survives because there is no move cell: add P2d/P2e per the F1 ruling.
- N10 and N14 have no test (the end-of-text cache check; a part that was the whole note as drawn).
- The redraw-without-rebind fold-in must keep the own-first branch covered or record N18 as equivalent.

**NIT**

**F7.** `ReadingModeBlockHost.ts:578`: also clear `drawnToken` / `drawnRead` on unload.

## Follow-ups (not SC-607)

- A CRLF note in a hover with an identical twin: + refused at base and head (real Obsidian crlf-ctl). This is pre-existing (the part / `cardLinkLine` with `\r\n`). Worth a Backlog ticket.

## Gates measured

- tsc + lint: clean (`sc607-r3-gate-tsc.log`, `sc607-r3-gate-lint.log`).
- jest: 11510 passed / 1 skipped, 61 s (`sc607-r3-gate-jest.log`).
- lifecycle p6: 4/4, 297 s (`sc607-r3-gate-lifecycle-p6.log`).
- lifecycle p5: 7/7, 390 s (`sc607-r3-gate-lifecycle-p5.log`).
- e2e: `280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (`sc607-r3-gate-e2e.log`).
- styles.css: `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, the same as the 622b0904 build.
- Branch state: dse branch head 1daa7d8a and `git status --porcelain` empty at the end. The superproject worktree shows only ` M draw-steel-elements` (the uncommitted pointer, as r2 left it).

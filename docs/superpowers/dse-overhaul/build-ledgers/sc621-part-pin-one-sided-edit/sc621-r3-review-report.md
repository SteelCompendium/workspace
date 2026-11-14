# SC-621 r3: independent adversarial review (reviewer C)

**Executive summary**
- **Verdict: LAND.** The code needs no change. I recommend folding LOW-1 to LOW-3 (CHANGELOG / code-comment wording) into the land commit. LOW-4 (dead G-S115 code) is optional.
- **Findings:** CRITICAL 0, HIGH 0, MEDIUM 0, LOW 4, INFO 5. No different-counter write outside the ruled residuals (R1 move, R2 rename, the >400-line cap). No new refusal outside the ruled class. No own-write refusal.
- **Real Obsidian 1.15.1**, 26 cells on each bundle (G-S115's 9 plus 17 of my own):
  - 14521bf0 (main.js `e303ca6d`): **15 WROTE THE OTHER COUNTER** with no Notice (a-f, j-q2); 2 refused (i, u); 9 saved correctly.
  - 56ad4d1c (main.js `954ebe64`): **17 refused with exactly one Notice** (forms stay open); 9 controls saved into the drawn-from counter; 0 other-counter writes.
- **My jest probe** (11 new layouts x own edits x all 18 click ways x T1/T2): 72,600 cells on each tree.
  - T1 (36,300, deterministic), on the fix: other-counter writes only in R1 324, R2 648, and >400-line edits 474 (all with line distance >= 401).
  - New refusals: 1,446, all oracle-ambiguous and twinned; 0 unambiguous; refused->A 0.
  - CRLF probe: 12/12 ticket cells refused on the fix, 12/12 wrote the other counter on base; 8/8 controls saved.
- **Mutants** (twin + sweep files). Killed: M0 no gate 25, M2 drawn-only 2, M3 invert 31, M4 refuse all twinned 9, M5 now-only 22, M6 now-vs-now 25. M7 (no twin guard) survived; it is a cost guard, near-equivalent.
- **The sweep oracle binds:** "written in an ambiguous twinned cell" fires 26/18/26 times (M0/M5/M6), and "refused although nothing is ambiguous" fires 60 times (M4).
- **Red on 14521bf0:** 25 failed / 10 passed of 35, matching r2. G-S115 on the 14521bf0 bundle: (a)-(f) wrote the other counter; (g)-(i) ok.
- **Battery** (re-run):
  - Full jest on 56ad4d1c: 11867 passed / **1 failed** / 2 skipped. The failure is a load flake at reading-mode-host-pin.test.ts:682 (load 17.9). It passes alone 3/3 (146/146) on 56ad4d1c and on 14521bf0. It is pre-existing and not reachable by this change (INFO-2).
  - Lifecycle part 7 `G-S108,G-S112,G-S115`: 3/3, 197 s. Part 6 `G-S92,G-S96,G-S97,G-S99`: 4/4, 296 s.
- dse HEAD `56ad4d1c` (origin/develop `14521bf0`, not moved), `git status --porcelain` empty. Superproject `0dcc3bb3`; ` M draw-steel-elements` as r2 left it, by design.

## 1. What was run (all probes in scratch exports; the worktree was never edited)
Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-r3-revC/`.

**Exports and bundles**
- `git archive` exports: `fix-tree` (56ad4d1c), `base-tree` (14521bf0), `mut-tree` (56ad4d1c, mutated per run), `obs-orig` (56ad4d1c harness as committed) and `obs-r3` (56ad4d1c harness + my cells).
- node_modules are symlinked to the worktree's.
- Bundles were built with `node esbuild.config.mjs production`:
  - base main.js `e303ca6d…`, fix main.js `954ebe64…`; these equal r2's.
  - styles.css `18730938…` on both, so there is no CSS change and shots, freeze and parity carry.
- Lifecycle ran from `obs-orig` / `obs-r3` with `DSE_LIFECYCLE_BUNDLE=<fix-tree|base-tree>`.

**Jest probe** (`sc621-r3-probe-tail.ts.txt` + `sc621-r3-make-probe.py.txt`)
- It reuses the committed sweep's infrastructure (lines 1-385 of `reading-mode-host-part-pin-sweep.test.ts`: renderer, cache model, oracle and `run`), patched to add T2.
- It adds 11 layouts of my own:
  - `blk-quad-lowmark`: four identical counters;
  - `blk-triple-topmark` and `blk-triple-twomarks`;
  - `blk-prose-sep`: twins separated by prose;
  - `blk-in-sections`: block twins in different sections;
  - `blk-far-prose`: 40 prose lines on each side;
  - `blk-twin-far-apart`: 30 lines between the twins;
  - `sec-quad-named`;
  - `sec-named-prose-between`;
  - `sec-named-far`;
  - `sec-named-mixed-diff`.
- Edits: the committed `editsFor` family, plus:
  - an `^id` mark moved to another counter;
  - two counters deleted;
  - a counter bumped together with P deleted, and the rename variants;
  - an identical pair pasted below, an identical twin pasted at the top;
  - every delete / move / paste combined with an edit far away (`x0` / `y39`) or with 1 / 50 / 395 / 401 lines inserted at the top (the capped `editDistance` boundary).
- All 18 click ways (hover / embed RV / embed LP x card / form x no + / + redrawn / + stale), T1 and T2.
- Base and fix outcomes are joined per cell. The analysis is in `sc621-r3-probe-analysis.txt`.

**Other probes**
- CRLF probe: built from the SC-619 `reading-mode-host-crlf-hover.test.ts` infrastructure (raw CRLF offsets in the cache model). It covers ticket shapes A and C in LF and CRLF, hover and embed, card and form, plus controls (`sc621-r3-crlf-tail.ts.txt`, `sc621-r3-crlf-probe.log`).
- Real Obsidian: G-S115's cell function, with 17 extra cells patched into a scratch harness copy (`sc621-r3-patch-harness.py.txt`) and per-cell `R3-REC` lines.

## 2. Findings

### LOW-1: the docs name only two written residuals; a third, the >400-line cap, is reachable in the ticket's own shape
**Where**
- `CHANGELOG.md:11-18` in the superproject worktree, and `src/framework/host/ReadingModeBlockHost.ts:1053-1059` (the SC-621 comment).
- The CHANGELOG says "Two cases are still written … an identical counter moved … and the shown section deleted while a neighbouring section is renamed".

**Cell** (jest, T1, fix 56ad4d1c and base alike, no Notice)
- Ticket shape C, with 395 lines pasted at the top in the same write: `blk-far-prose del-P-keepmark-pre+top+far395` (line distance 402).
- Observed: the click writes the other counter (`OTHER:a`).
- The same happens in `blk-triple-twomarks` and `blk-quad-lowmark` (9 such (layout, edit) cells in the hover-card subset; 474 T1 cells in all, every one with line distance drawn->now >= 401; minimum measured 401, `sc621-r3-probe-analysis.txt`).

**Mechanism**
- P sits in the common tail that `mapLineOf` trims, so `mapLineStrict` agrees and does not give up. The `'gave up'` branch's twin count is never reached.
- `placedUniquely` then returns true when it cannot price the placement (`best === null`, ReadingModeBlockHost.ts:1239).

**Status:** this is the ledger's accepted out-of-scope residual (">400-line one-sided edits where the capped distance gives up"), not a regression: base writes the same cells.

**Code alternative I measured and do NOT recommend** (`sc621-r3-cap-variant.txt`): "twinned and the drawn->now distance is over 400: refuse" at the rebase.
- It turns only 9 of 132 ambiguous other-counter writes into refusals; the rest go through other unpriced paths.
- It adds 92 unambiguous refusals.

**Fix (docs only):**
- In the CHANGELOG, after the two cases, add: "and, in a note with identical counters, an outside change of more than about 400 lines in the same write."
- In the code comment, add "(c) R3: more than LINE_MAP_MAX_EDITS lines changed around the block: `placedUniquely` cannot price it and the agreed map stands (SC-612's accepted cap)".
- Add the same line to `sc621-skill-proposal.md` §3 residuals.

### LOW-2: the CHANGELOG does not tell the user about the mirror refusal
**Where:** `CHANGELOG.md:13-15`.

**What it says:** the bullet describes the refusal when the shown counter is removed, and "when … an identical counter was added next to yours".

**What it omits:** the most common new refusal, which the tests pin as "the mirrors":
- the OTHER identical counter removed (or another one in the same run of identical counters) with a line on one side edited;
- the user's own counter untouched; the click is refused with the Notice.

**Measured** (jest T1): 1,446 new refusals, all oracle-tied.
- Most are `del-<other>` / `del-<other>+del-<other>` / `ins-twin-*-adj` in my layouts.
- In real Obsidian, the mirror is byte-identical to cells (a) and (e).

**Fix:** "The same holds when, in the same outside change, an identical counter next to yours was added **or removed** (the note then reads the same either way)."

### LOW-3: CHANGELOG wording "a preview of a note open in its own pane (SC-612)"
**Where:** `CHANGELOG.md:17-18`.

**Problem:** SC-612 is about a note open in its own pane, not a preview of it.

**Fix:** "…and a note open in its own pane (SC-612) are not affected."

### LOW-4: dead G-S115 code (template leftovers for shape B, which r1 found unreachable)
**Where:** `visual-harness/obsidian-lifecycle.mjs`. Unused:
- `GS115_C6` (:2477);
- `GS115_NOTE.twin` (:2482);
- the edits `del-first+end`, `del-first+top` (:2492-2493) and `del-low-keepmark+end` (:2496);
- the whole `if (plus) { … }` block in `gs115Cell` (:2550-2565, `rec.afterPlus` / `cardsAfterPlus` / `sameHostAfterPlus`).

The scenario always passes `plus: false` (:9177).

**Evidence that the `plus` path works:** I used it for cells (r), (s) and (t). All saved, with the same host adopted after the +.

**Fix:** delete them, or add one own-write control cell such as my (r): `twin`, `#Tracker`, hover RV card, own +, then + again with no outside edit -> `[7,6]`.

### INFO-1: M7 (`placedUniquely` without the twin guard) survives
- "A note without identical counters is never refused by this rule" (CHANGELOG, comment) is a property of the guard. No test pins it.
- This is near-equivalent because a reachable non-twin cell redraws its part first. As in SC-612 Q2, the guard is a cost guard.
- No action.

### INFO-2: the full-jest failure is a pre-existing load flake, not SC-621
- `reading-mode-host-pin.test.ts:682` ("SC-556: … an outside edit elsewhere in the source note … Save still lands") failed once in the full run (load 17.91).
- The `embedded()` helper calls `host.pinPosition()` with no settle after mount. Under load, the mount read is not done, `drawn` is null, and `from === null` makes the rebase refuse.
- The note has no twins, so the SC-621 branch is not evaluated (`twinned` false).
- Passes alone 3/3 on 56ad4d1c and once on 14521bf0 (146/146 each, load 25), `sc621-r3-jest-pin-alone.log`.
- Follow-up candidate for SC-568 (jest timing on a loaded host): `await settle()` before `pinPosition()` in that describe.

### INFO-3: the T2 timing in a 2 ms-settle harness is racy on both trees
- On the same fix tree, 21 of 7,692 T2 "no +" cells change outcome between two runs (A <-> refused; one refused -> OTHER, which is R1/R2). This is `sc621-r3-probe-analysis.txt` with the `t2-fix-rerun` comparison.
- The outside write sometimes lands before the rebase's `cachedRead`, which makes the cell T1.
- So base-vs-fix flips in T2 (49) are noise, not the fix. All T2 other-counter writes are R1, R2 or >400.
- The committed sweep is T1-only and the twin file's T2 tests use 25 ms, so the branch's tests are not affected.

### INFO-4: running full jest writes `main.js` / `styles.css` into the dse root
- The `test/unit/build/*` tests build the bundle in the dse root.
- They appeared at 18:20 during my run (sha `954ebe64` / `18730938`). I removed both by literal path, so the worktree is as found.
- Worth a line in dse-verify ("Stale main.js" already warns about the reverse).

### INFO-5: lifecycle wall times for the skill proposal
- Part 7: 197 s (r2: 195 s). Part 6: 296 s (r2: 292 s).
- G-S115 alone: 71 s on the base bundle. My 26-cell extended version: 210 s.

## 3. Real Obsidian cells (`sc621-r3-obsidian-cells-{base,fix}.log`, base re-run of p and w in `-base-pw.log`)
One note per cell, an outside `vault.process` write, then the old card's + (or the pencil and Save) once the cache moved.

| id | note / link | where | click | outside write | 14521bf0 | 56ad4d1c |
|---|---|---|---|---|---|---|
| a-f | G-S115 | (as committed) | | | 6 wrote other | 6 refused, 1 Notice |
| g, h | G-S115 controls | | | | saved | saved |
| i | G-S115 | | | | refused | refused |
| j | 3 identical counters, `^p` under the bottom one | hover RV | card | bottom deleted (mark kept) + TOP | wrote the middle one | refused, 1 Notice |
| k | same | embed LP | form | same | wrote the middle one | refused, form open |
| l | 4 identical named sections | hover LP | card | Tracker deleted, Other renamed Tracker + END | wrote other | refused |
| m | same | embed RV | form | same | wrote other | refused, form open |
| n | CRLF named | hover RV | card | (A) in CRLF | wrote other | refused |
| o | CRLF named | embed LP | card | same | wrote other | refused |
| p | CRLF, `^p` under the lower twin | hover RV | card | (C) in CRLF | wrote other | refused |
| q | twins inside callouts under named sections | hover RV | card | (A) | wrote other | refused |
| q2 | same | embed RV | card | same | wrote other | refused |
| r | adjacent Tracker sections 5/6 | hover RV | own + then + | none | [7,6] | [7,6] |
| s | same | embed RV | own + then + | TOP edited | [7,6] | [7,6] |
| t | low twins | embed LP | own + then + | TOP edited | [5,7] | [5,7] |
| u | low twins | hover RV | card | `^p` moved to the upper + TOP | refused | refused |
| v | named | embed LP | card | END edited | [6,5] | [6,5] |
| w | quad named, link `#Third` | hover RV | card | Tracker deleted + Other renamed + END | [5,6,5] | [5,6,5] |
| x | CRLF named | hover RV | card | TOP | [6,5] | [6,5] |
| y | callout named | hover RV | card | END | [6,5] | [6,5] |

Every reached cell had `clicked: true` and `oldCardGone: false` (the shape was reached).

## 4. Docs checks
- **CHANGELOG** (`0dcc3bb3`): plain words, and it states the repeat-until-reopen property ("keeps refusing on every click until you reopen it"). LOW-1/2/3 above.
- **Code comment** (ReadingModeBlockHost.ts:1053-1059): it states (a) repeat-until-reopen and (b) R1/R2. LOW-1 adds R3.
- **Skill proposal:** its numbers match r2's logs (parts 183/336/414/300/392/292/195 s; jest 11868/2; red 25/10; M2 2 failed; G-S115 71 s base / 73 s fix; (a)-(f) red on `e303ca6d`).

## 5. Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/)
- **Report:** `sc621-r3-review-report.md` (this file).
- **Battery logs:** `sc621-r3-jest-full.log`, `sc621-r3-jest-pin-alone.log`, `sc621-r3-lc-part7.log`, `sc621-r3-lc-part6.log`, `sc621-r3-lc-base-G-S115.log`, `sc621-r3-red-on-base.log`.
- **Real Obsidian:** `sc621-r3-obsidian-cells-base.log`, `sc621-r3-obsidian-cells-base-pw.log`, `sc621-r3-obsidian-cells-fix.log`, `sc621-r3-patch-harness.py.txt`.
- **Jest probe:** `sc621-r3-probe-tail.ts.txt`, `sc621-r3-make-probe.py.txt`, `sc621-r3-probe-analysis.txt`, `sc621-r3-crlf-tail.ts.txt`, `sc621-r3-crlf-probe.log`.
- **Mutants:** `sc621-r3-mutate.py.txt`, `sc621-r3-mutants.log`, `sc621-r3-cap-variant.txt`.
- **Raw JSON** (scratch, not copied: about 20 MB each): `…/scratchpad/sc621-r3-revC/probe-{base,fix}-all.json`, `far-fix-T1*.json`, `far-cap-T1*.json`, `t2-fix-rerun.json`.
- **Cleanup:** the lifecycle temp dirs my base runs kept (`/tmp/dse-obsidian-lifecycle-jm4jat`, `-kCdKta`, `-uEDVPt`) were removed by literal path.

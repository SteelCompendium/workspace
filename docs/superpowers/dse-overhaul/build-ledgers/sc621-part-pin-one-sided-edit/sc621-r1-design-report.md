# SC-621 r1: diagnosis, measurement and fix design (reviewer A)

**Executive summary**
- **Gap measured: YES, at df92a3f6.** Real Obsidian 1.15.1: **16/16** reachable ticket cells **WROTE THE OTHER COUNTER**, with no Notice: (A) heading hover and heading embed, RV and LP, + and form; (C) block hover and block embed, RV and LP, + and form. Jest sweep, 21,060 cells: **180** different-counter writes in oracle-ambiguous cells, and **588** writes in twinned ambiguous cells in all. Seeded fuzz, 15,612 cells (seeds 1-6): 48 and 96.
- **Root cause:** `rebaseCardPin` (ReadingModeBlockHost.ts:1044-1052) accepts the drawn->now placement when `mapLineStrict` agrees with the link. When every change is on ONE side of the twins, both maps trim the untouched side first, so they agree on the survivor. The write-time rule P (`pinnedTarget`:1186) then compares now with now and sees no change.
- **Proposed rule (P at the rebase):** after `mapLineStrict` agrees with `linkLine`, a block that is twinned (in the note it was drawn from, or now) is placed only when `placedUniquely(whole, {from.text, from.line}, at.line)` holds. This is SC-612's rule, reused as is: +7/-0 lines (`sc621-r1-proto-ruleP-rebase.diff.txt`).
- **Sweep (21,060), base -> prototype:** OTHER->refused 180, A->refused 408, refused->A 0, X->Y 0; writes in ambiguous cells 588 -> **0**; new refusals in unambiguous cells **0**. **Fuzz** (15,612 cells, seeds 1-6): other-counter writes 48 -> **0**; writes in ambiguous cells 96 -> **0**; new refusals 48, all ambiguous; 0 unambiguous.
- **Real Obsidian on the prototype:** 16/16 ticket cells write nothing and show one Notice (forms stay open); 12/12 controls saved. Full jest on the prototype: 11844 passed / 2 skipped (= 11817 + 27 new), 0 flips. Lifecycle G-S92/96/99/108/112: 5/5 ok on the prototype bundle.
- **New refusals:** all 456 (408 sweep + 48 fuzz) are inside the ruled class (an identical counter added or removed next to the drawn-from one by an outside edit, in a twin note, oracle tie). One caveat to flag: in a preview that is not redrawn, the refusal **persists until the preview is reopened** (measured). This is the same property SC-607 F1 already accepted (Q1).
- **Failing-test commit: dse `4ba95740`** (on df92a3f6), `test/dom/framework/reading-mode-host-part-pin-twin.test.ts`, 27 tests. **18 are red on df92a3f6**: 14 ticket shapes and 4 mirrors. All 27 are green on the prototype.
- **Residuals** (base and prototype both still write them; the oracle is unambiguous): text-identical moves, and "drawn-from section deleted + a neighbour renamed to its name" where the cheapest reading keeps the drawn-from counter. 1,128 sweep cells and 160 fuzz cells, unchanged from base (§F).

## 0. Setup and what was run
- Worktree dse `sc621-part-pin-one-sided-edit` at df92a3f6 (= origin/develop after `fetch`, it did not move). `npm ci` in the worktree (it had no node_modules).
- Jest measurement harness (`sc621-r1-part-sweep.test.ts.txt`) copied into `test/dom/framework/` per run and removed by its literal path. The prototype was applied with `git apply` and restored with `git checkout -- <file>` by literal path (`sc621-r1-run-measure.sh.txt`). `git status --porcelain` was empty after every run.
- Real Obsidian ran in `git archive df92a3f6` scratch exports (`base-tree`, `proto-tree` = base + diff; node_modules symlinked; built with `node esbuild.config.mjs production`). The worktree's harness was never edited.
  - main.js: base `aed2fbaf…`, proto `945baedb…`.
  - styles.css: `18730938…` on both, so there is no CSS change.
  - The probe harness copy (`obsidian-lifecycle-p621.mjs`, spliced by `sc621-r1-make-scratch.py.txt`) lives only in those exports.
- Run: targeted jest (sweep / fuzz / new file / drawn-pin) while iterating; full jest once (prototype); lifecycle only G-S92, G-S96, G-S99, G-S108, G-S112 (prototype bundle, one call each). No shots, freeze, parity or e2e.

## A. The gap at df92a3f6

### A.1 Which shapes reach `rebaseCardPin` with a stale card
A preview is redrawn (new hosts, nothing stale to click) when its part's text changes (measured SC-607). So the gap needs these together:
- an outside write that deletes the drawn-from counter;
- the part's text left unchanged;
- the link still resolving;
- `cardLinkLine` still accepting it, on the note as drawn and now (with a twinned body: exactly ONE heading of that name, or exactly ONE `^id` marker).

That rules out the literal "two counters under one heading" (deleting one changes the part, so the preview is redrawn) and two same-name sections (`named.length !== 1` at :1111 refuses the drawn note). The reachable shapes are:
- **(A) heading link**: `## Tracker` + counter, `## Other` + identical counter. One write deletes the Tracker section, renames `## Other` to `## Tracker` and edits a line on one side (END, or `## After`). The part (`['', C, '']`) is unchanged, and the link now names the old Other counter.
- **(B) heading link through the own-write record** (jest only, see A.3): two adjacent `## Tracker` sections made identical by the card's own +. The first is deleted and END edited.
- **(C) block link**: two identical counters separated by a blank line, `^p` under the LOWER one. The lower counter is deleted with the blank above it, its `^p` line left (now under the upper one), and TOP is edited.

In every one of these, the note after the write is **text-identical** to "the OTHER counter deleted with the same edit" (the mirror). The oracle calls them ambiguous.

### A.2 Jest (SC-607 harness extended with SC-612 layouts)
- `sc621-r1-part-sweep.test.ts.txt`: 17 layouts.
  - Heading-section layouts: `sec-twin`, `sec-twin+diff-below/above`, `sec-triple+diff`, `sec-named`, `sec-named+prose`.
  - Block layouts: twin-blank lowmark / upmark / bothmark, blank2, tight, `+diff-below/above`, `tight-diff-neighbour`, `triple+diff`, `triple-midmark`, `uniq`.
  - Every edit (none, TOP/END, delete P or another counter, delete with the `^id` line kept, edit P, move P, insert an identical counter, bump, rename / swap names), each alone and with TOP / END / `## After` edited in the same write.
  - Crossed with: heading hover, heading embed, block hover, block embed; RV/LP (embeds); card/form; no + / + redrawn (rebind) / + stale; **two timings**: T1 (the outside write lands before the click, so before the rebase) and T2 (between the rebase and the write).
- Cells whose part changes (Obsidian redraws) are skipped. The oracle is SC-612's LCS placement cost from the note as the round began (mount, or after the own +) to now, independent of lineMap. Ground truth comes from block ids.

| | cells | saved (A) | refused | OTHER, ambiguous | OTHER, unambiguous (residual) | writes in twinned-ambiguous cells |
|---|---|---|---|---|---|---|
| base df92a3f6 | 21060 | 10788 | 8964 | **180** | 1128 | **588** |
| prototype | 21060 | 10380 | 9552 | **0** | 1128 (same cells) | **0** |

- The 180 base other-counter writes are **all T1**: hover RV and embed RV/LP; card and form; `no +` (A, C) and `+ redrawn` (B).
- **T2 is already refused at base**: SC-612's rule P at write time (`pinnedTarget`:1186) prices `pin.text` = the note at the rebase.
- Tables: `sc621-r1-sweep-flips.txt`, `sc621-r1-sweep-new-refusals.txt`.

### A.3 Real Obsidian 1.15.1 (scratch probe, `sc621-r1-obsidian-{base,proto}-table.txt`, raw `P621-REC` lines in the `.log`s)
The cell flow is G-S99's: an outside `vault.process`, then a scripted + (or the pencil, then Save) on the OLD card once the metadata cache has caught up.

| shape | cells | base df92a3f6 | prototype |
|---|---|---|---|
| (A) heading hover RV/LP, heading embed RV/LP x + / form | 8 | **8 WROTE OTHER COUNTER**, 0 Notice (form closed) | 8 refused, 1 Notice each, form stays open |
| (C) block hover RV/LP, block embed RV/LP x + / form | 8 | **8 WROTE OTHER COUNTER**, 0 Notice | 8 refused, 1 Notice each |
| (B) heading hover/embed after own +, first Tracker deleted + END/TOP | 10 | not reached: the preview IS redrawn ~16-61 ms after the write (adopted host confirmed, `sameHostAfterPlus` true) in 8; reached in 2 LP cells: refused, 1 Notice | not reached in 9; 1 LP card refused, 1 Notice |
| variants: (A) + TOP instead of END, (C) + END instead of TOP | 4 | refused, 1 Notice (the maps disagree) | refused, 1 Notice |
| controls: no edit, TOP only (A, B, C; hover + embed, RV card) | 12 | saved into the drawn-from counter, 0 Notice | same |

- (B) is a jest-model gap only: real Obsidian redraws that preview, or base refuses it.
- The mirror cells are byte-identical notes to the ticket cells, so they were not run separately in Obsidian. Jest covers them.
- Run 1 of base (`sc621-r1-obsidian-base-run1.log`) had a probe bug: the control cells never clicked because the cache signature did not change. Run 2 fixes it (it clicks after 250 ms).

## B. Root cause (df92a3f6)
1. `lineMap.ts:58-68` `mapLineStrict`: "agree" means the head-first and tail-first maps return the same line. With every change on one side of the identical run, both diffs trim the untouched side first and pair the drawn-from block with the survivor. The tie is invisible to the pair of maps (the SC-612 r1 finding, here for part pins).
2. `ReadingModeBlockHost.ts:1044` `const at = mapLineStrict(from.text, whole, from.line);` and `:1051` `else if (typeof at === 'string' || at.line !== linkLine) return;`. The survivor IS where the link points now (`linkLine`, :1019), so both checks pass. `:1052-1056` places the pin on the survivor and marks it strict.
3. At write time, `pinnedTarget` (:1179-1191) maps `pin.text` (= `whole` at the rebase) to the content. For T1 they are equal, so rule P (`placedUniquely`, :1186/:1209) prices no change. The only step that saw the outside write was the rebase, and it had no rule P.
4. The own-write path (`from = ownFrom()`, :1031, shape B) goes through the same `:1044-1052`.

## C. Fix design

### C.1 The rule (prototype `sc621-r1-proto-ruleP-rebase.diff.txt`, +7/-0, ReadingModeBlockHost.ts after :1051)
```ts
} else if (typeof at === 'string' || at.line !== linkLine) return;
else {
	const drawnPin = { text: from.text, lineStart: from.line };
	if (this.twinned(whole, drawnPin) && !this.placedUniquely(whole, drawnPin, at.line)) return;
}
```
- This is SC-612's rule P, unchanged, at the drawn -> now step. The block the card was drawn from is placed only on its unique cheapest placement, priced with the capped Myers `editDistance` over everything around it, and only when that placement is the head map's answer (`at.line` = `linkLine`).
- Gate: `twinned` (the known body is twice in the note as drawn, or now), as SC-612's. A note without twins runs nothing new.
- `mapLineStrict`'s tail-first agreement stays, as defence in depth (SC-612 Q7).
- The `'gave up'` branch (>400 lines) is untouched: `placedUniquely` returns true when it cannot price anyway.
- No new heuristic, no lineMap change.

### C.2 Sweep: base -> prototype (21,060 cells)
- Flips: A->A 10380, **A->refused 408**, OTHER->OTHER 1128, **OTHER->refused 180**, refused->refused 8964, **refused->A 0**, **X->Y 0**.
- Required checks:
  - writes in oracle-ambiguous twinned cells: **0** (base 588);
  - new refusals in oracle-unambiguous cells: **0**. All 408 are ambiguous and twinned. The 960 + 72 unambiguous refusals are pre-existing and identical on both: SC-594's two-same-name-headings refusal and others;
  - different-counter writes in ambiguous cells: **0**.

### C.3 Seeded fuzz (`SC621_MODE=fuzz`)
- Random notes: 2-4 sections or counters, 70% value 5, random `^id` markers, separators.
- 1-3 random outside writes: delete any (with or without its `^id` line kept), delete P, paste an identical counter, edit a line, type prose, delete a blank, bump, make a twin, rename or swap a heading, move P.
- Crossed with: card/form x no + / + redrawn / + stale x T1/T2. Only no-redraw cells are run.

| run | cells | base OTHER-ambiguous | base writes in ambiguous | proto OTHER-ambiguous | proto writes in ambiguous | A->refused | refused->A | unambiguous new refusals |
|---|---|---|---|---|---|---|---|---|
| seeds 1-3 x 300 notes | 3528 | 22 | 40 | **0** | **0** | 18 (all amb/twinned) | 0 | **0** |
| seeds 4-6 x 1000 notes | 12084 | 26 | 56 | **0** | **0** | 30 (all amb/twinned) | 0 | **0** |

### C.4 Mutants of the prototype (`sc621-r1-mutants.log`)
Scope: the new test file plus the SC-607 drawn-pin sweep, 829 tests.

| mutant | result | killed by |
|---|---|---|
| M8 rule off (= base) | killed, 18 failed | the 14 ticket shapes and the 4 mirrors |
| M3 twin gate on the note now only | killed, 18 | (A)/(C): the twin is gone now |
| M4 price now -> now (`{whole, linkLine}`) | killed, 18 | every ticket shape |
| M5 only for the mount snapshot (`from === fromDrawn`) | killed, 5 | (B) own-write path |
| M6 only for the own-write record | killed, 13 | (A), (C) |
| M1 no twin gate | survived | equivalent on the sweep (0 flips vs the prototype, `sc621-r1-M1-sweep-vs-proto.txt`); the gate is a cost guard (a note without twins runs nothing new), as in SC-612 Q2 |
| M2 twin gate on the drawn note only | survived on the tests; **killed by the sweep**: 12 writes in ambiguous cells (`blk-uniq ins-twin-above-adj+top`: an identical counter pasted right above a unique drawn-from one, TOP edited; `sc621-r1-M2-sweep-vs-proto.txt`) | recommend r2 adds that cell as a named test |
| M7 price at `linkLine` instead of `at.line` | equivalent: `at.line === linkLine` is already required on the line above | none |

### C.5 Full jest and lifecycle on the prototype
- Full jest: **11844 passed / 2 skipped**, 11846 total, 149 s. That is the baseline 11817 / 2 plus the 27 new tests, with 0 flips in existing tests (`sc621-r1-jest-full-proto.log`).
- Lifecycle on the proto bundle (scratch export, harness as committed), one call each:

| scenario | result | wall |
|---|---|---|
| G-S92 | ok | 102 s |
| G-S96 | ok | 75 s |
| G-S99 | ok | 73 s |
| G-S108 | ok | 67 s |
| G-S112 | ok | 66 s |

## D. Failing tests (committed)
- dse `4ba95740` on df92a3f6, branch `sc621-part-pin-one-sided-edit`: `test/dom/framework/reading-mode-host-part-pin-twin.test.ts`, 27 tests. No source change. No bracketed id in any title.
- **Red on df92a3f6: 18** (`sc621-r1-red-on-base.log`). Every one fails on `expect(r.after).toBe(r.now)`: a counter was written.
  - Ticket shapes (14):
    - (A) heading hover / embed RV / embed LP x card / form (6);
    - (B) heading hover card / form, embed RV card, embed LP form (4);
    - (C) block hover card / form, block embed RV card, block embed LP form (4).
  - Mirrors (4), written at base, refused on the prototype:
    - the Other section deleted + END edited (2);
    - the second Tracker deleted after the own + (1);
    - the upper counter deleted + TOP edited (1).
- **Green on both: 9.**
  - 7 controls:
    - no edit (2);
    - TOP + END edited (2);
    - the Other counter changed to 9 + END (twinned as drawn, unique now: one placement);
    - own + then TOP edited;
    - block, the upper changed to 9 + TOP.
  - 2 second-timing tests (T2: refused at base by SC-612's write-time rule).
- **Green on the prototype: 27/27** (`sc621-r1-green-on-proto.log`).

## E. G-S115 proposal (`sc621-r1-gs115-proposal.mjs.txt`, template only; not added to the harness)
- Nine cells, one note each:
  - (a) heading hover RV card (A);
  - (b) heading hover LP form (A);
  - (c) heading embed RV card (A);
  - (d) heading embed LP form (A);
  - (e) block hover RV card (C);
  - (f) block embed RV form (C);
  - (g) control: A, TOP edited, + -> [6,5];
  - (h) control: C, no edit, + -> [5,6];
  - (i) A with TOP instead of END: refused on both.
- (a)-(f) wrote the other counter in the base probe and are refused with one Notice on the prototype. (g)-(i) are green on both. Every cell was run as the P621 probe, which uses the same cell function and edits.
- Placement: part 7 (`--only=G-S108,G-S112,G-S115`), after G-S112 and before G-S56 in SCENARIOS. Estimated ~80 s (9 x ~8.7 s measured), so part 7 goes from ~130 s to ~210 s (over 180 s: poll the pid).
- Lifecycle becomes 64/64.

## F. Questions for the owner

### Q1. New refusals: all inside the ruled class, with one property to confirm
- Count: 408 sweep + 18 fuzz (seeds 1-3) + 30 fuzz (seeds 4-6). Every one is oracle-ambiguous and twinned, after an outside edit that deletes or inserts a counter identical to the drawn-from one.
- What the cells are:
  - the mirrors: the OTHER twin deleted with a one-sided edit (`del-a+top`, `del-b+end/afterH`, tight `del-a`);
  - an identical counter inserted next to it with a one-sided edit (`ins-twin-*-adj+top/end/afterH`, including a section with another heading but an identical counter right below the hovered one).
- None comes without an outside edit, and none is in a note without twins.
- **Flag (persistence):** in a preview that is not redrawn, the refusal repeats on every click until the preview is reopened or redrawn. Measured on the prototype (`sc621-r1-persist-proto.log`):
  - click 1: refused, 1 Notice;
  - click 2: refused, 1 Notice;
  - a card mounted on the note now (reopened): saved, 0 Notice.
- Base already behaves this way for every SC-607 refusal (SC-607 F1/F3, accepted). The owner's class says "not persistent". **Is "persists until the preview is reopened" acceptable for these, as it was for SC-607?** My recommendation is yes: same mechanism, same Notice, and reopening resolves it.

### Q2. Residuals (base and prototype both write; the oracle is unambiguous; unchanged by the rule): `sc621-r1-residual-other.txt`
- (R1) **A move among identical blocks** (`move-P-end`, 792 sweep cells). The note text does not change at all (e.g. `sec-twin`, one Tracker section moved below the other), so no line map can see it. This is the accepted SC-612 N5/N6 class.
- (R2) **The drawn-from section deleted + a neighbour renamed to its name**, where the cheapest reading keeps the drawn-from counter (`del-P-rename-d` / `-a`, 336 sweep cells).
  - Example cell: `sec-twin+diff-below del-P-rename-d + redrawn` T1, `[## Tracker 6, ## Tracker 6, ## Other 9]` -> `[## Tracker 6, ## Tracker 9]`.
  - The truth is "the first deleted, Other renamed", which costs 9. Reading it as "the second counter and the Other heading line deleted" costs 7 and keeps the drawn-from counter uniquely.
  - Any text-based rule writes it. It needs + / + redrawn (the twin made by the own +) or two equal-valued counters plus a rename.
  - Recommend: accept as a residual of the R1 kind (an outside edit whose cheapest reading is not what happened). Record it in the dse-verify residual list.
- Fuzz: 160 (seeds 1-3) + 450 (seeds 4-6) cells, the same on base and prototype.

### Q3. Not taken
- `mapLineStrict` itself is not changed. Putting the cost check in lineMap would need the fence spans (host knowledge).
- The fix is not extended to the `'gave up'` branch. It is already gated on a unique body; >400 lines is an accepted SC-607 residual.

## Artifacts (all in this dir, prefixed `sc621-r1-`)
- Diff: `proto-ruleP-rebase.diff.txt`. Test file: committed at dse `4ba95740`.
- Jest harness and tools:
  - `part-sweep.test.ts.txt`
  - `summarize.py.txt`
  - `run-measure.sh.txt`, `run-pair.sh.txt`, `run-mut-sweeps.sh.txt`
  - `mutate.py.txt`, `run-mutants.sh.txt`, `run-jest-full.sh.txt`
- Jest results:
  - `sweep-flips.txt`, `sweep-new-refusals.txt`, `fuzz-flips.txt` (seeds 1-3), `fuzz-s456-flips.txt`, `residual-other.txt`, `M1-sweep-vs-proto.txt`, `M2-sweep-vs-proto.txt`, `mutant-M{1,2}-*.diff.txt`
  - `mutants.log`, `jest-full-proto.log`, `red-on-base.log`, `green-on-proto.log`, `persist-proto.log`
- Obsidian probe:
  - `p621-fixtures.mjs.txt` (as of the C-extra run: the ticket edit runs in every mode; the main runs used RV-card-only for the C ticket edit), `p621-scenario.mjs.txt`
  - `make-scratch.py.txt`, `run-obsidian.sh.txt`, `obs-table.py.txt`, `build-trees.sh.txt`, `build-trees.log`
  - `obsidian-base.log`, `obsidian-base-run1.log`, `obsidian-base-C.log`, `obsidian-proto.log`, `obsidian-proto-C.log`, `obsidian-{base,proto}-table.txt`
- Lifecycle: `lc-proto-G-S{92,96,99,108,112}.log`, `run-lc.sh.txt`.
- G-S115: `gs115-proposal.mjs.txt`.
- Raw jsonl (large, scratch only): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc621-r1-reviewerA/meas-*.jsonl`.

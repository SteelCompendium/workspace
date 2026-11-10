# SC-556 r7 scoped re-review: r6 delta (dse a3ac0769 on develop 2ee2e405, superproject 63ea40ff)

**Verdict: FIX FIRST.** Findings: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 2 LOW, 2 INFO.
- **MEDIUM-1 and MEDIUM-2 (r5) are fixed.** Measured in real Obsidian 1.15.1:
  - + then the pencil in a heading embed of a 1,200-line note saves, in Reading view and Live Preview.
  - A block embed `^id` of the lower of two identical blocks writes the embedded block, in a short note and a long one, in Reading view and Live Preview.
  - A nested embed works.
- **MEDIUM-A (hard rule, constructed in jest):** a metadata cache that lags the note can still verify a BLOCK embed's position onto an identical twin. For a `^id` subpath the anchor-line check only compares "```ds-counter" with "```ds-counter". Save then writes the twin, in a short note and a long one.
- **MEDIUM-B (measured in real Obsidian, already on base 6270e84a):** a hover preview of a block link `[[note#^blk]]` in a short note with an identical block above has no `src`. Its pin is never rebased (the text occurs twice), and `mapLine` maps the partial pin onto the UPPER block. Save writes the twin, with nothing changed outside. The same root writes the twin after an outside edit seen through a stale embed (K3).
- LOW-1: the CHANGELOG says a non-unique text is refused "in a long note". It does not say that a short note writes the twin.
- LOW-2: mutation V2 survives (the link's-note check is untested). The dse-verify proposal is slightly stale.
- Gates: tsc and lint rc 0. jest t30: 6622 passed / 2 skipped / 258 of 259 (as expected). Lifecycle part 3: 9/9, with G-S64 (x), (y), (xa), (ya) and (xb) green.
- The rebase lost nothing. `range-diff` shows the 4 earlier patches as `=`. `git diff 2ee2e405 a3ac0769` touches only SC-556 files: no `e2e/`, and no G-S59 hunk.

## Findings

### MEDIUM-A: a lagging metadata cache can verify a block embed's position onto a twin (breaks the hard verify rule)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:841-855` (`verifiedPinLine`), `:846` (the anchor check `lines[start] === sectionLines[0]`) and `:803`.
- **Mechanism:** for `![[note#^blk]]` the section text starts with the block's own fence line. So the anchor check passes on ANY fence of the same language. The body check passes on any identical twin.
- **Scenario:** the cache was built before an edit that shifted the note so that the twin now sits on the cache's old `^blk` line. The form is opened inside the cache-lag window (the cache is parsed asynchronously after a modify; `cachedRead` already has the new text). The position verifies on the twin, and Save writes it.
- **Measured** (jest, `probe-r7.log`): the note has 7 lines inserted above the twin since the cache was built, and `blocks.blk` is at line 9 (now the twin's fence).
  - K1 short note: `pinLine=9 twinFence=9`, `ok=true names=["Edited","Twin"]`. The embedded block is #2, so the twin was written.
  - K5 long note: the same result.
- **Plausibility:** narrow. It needs the cache to lag the read, and the shift has to put a twin exactly on the old line. But the owner's rule was "never a position that could land on a twin", and this lands on one.
- **Fix:** for a `^id` subpath, also check that the block's id marker ends the block at the candidate position. That is, the first non-blank line after the close fence is `^blk`, or ends with ` ^blk`. Otherwise reject. A heading subpath already has a distinctive anchor (the heading line). Add K1 as a test.

### MEDIUM-B: a pin that was not rebased is still mapped as if it were a whole note, and lands on a twin (already on base)
- **Where:** `ReadingModeBlockHost.ts:803` (both paths null → the pin is left as the part's text) and `:898-899` (`pinnedTarget` maps a partial pin through `mapLine` against the whole note).
- **Measured in real Obsidian** (scratch scenario X-R7HOV, `lc-r7emb.log` on HEAD, `lc-r7hov-base.log` on 6270e84a):
  - The setup: a hover preview of `[[r5-bas-src#^blk]]`. The section is `{lines: 6, lineStart: 0}` and `src` is `null`. The note is short, with an identical counter above the `^blk` one.
  - Edit pencil, rename, Save: `names ["Edited","Twin"]` on HEAD and on base. The UPPER block, the one not shown, was written. No Notice, the form closed, and nothing changed outside.
- **Same root, jest:**
  - K2: no `src`, no cache, short note → the twin is written.
  - K3: a heading embed whose block was edited from outside before the form opened, while the embed still shows the old text, with a twin above holding the old body → the twin is written (the old r5 J2b, still present).
  - In long notes the same paths are refused, because the 400-edit limit happens to stop them.
- **Status:** on base too, not a regression. It is the hover sibling of MEDIUM-2, which the owner folded as "exactly this ticket's class". It is not the r6-dropped hover case, which was a refusal and not a wrong write.
- **Fix:** mark a pin taken inside an embed that did not rebase (e.g. a `partial: true` flag, or a `WeakSet` beside `pinRebased`). `pinnedTarget` should then return null for it: refuse, with the Notice and the form left open, instead of a `mapLine` guess. That also makes the CHANGELOG's hover sentence true in short notes. Add K2 and K3 as tests and the hover case as a G-S64 phase.

### LOW-1: the CHANGELOG fallback sentence is incomplete
- **Where:** dse `CHANGELOG.md:32` and workspace `CHANGELOG.md:17`.
- **Problem:** "in a hover preview, or when Obsidian's index of the note is behind a change, it finds the embedded part by its text instead, and if that text is not unique in a long note Save is refused". In a SHORT note with a non-unique text it writes another block (MEDIUM-B).
- **Fix:** after MEDIUM-B, write "if that text is not unique, Save is refused". Drop "in a long note".

### LOW-2: an untested defence, and small staleness in the proposal
- **V2 survives:** removing the link's-note check at `ReadingModeBlockHost.ts:828` (`dest.path !== file.path`) fails no test. The "link to another note" case still passes because verification then places the right block. It is defence in depth, but untested. Fix: add a case where the other note's subpath would verify onto a different block of this note.
- **`sc556-dse-verify-proposal.md`:**
  - The header still says "Refreshed at r4".
  - Footgun 5 still lists lifecycle G-S59 as a load flake. It passes since SC-561 (CURRENT says so).
  - Footgun 3 keeps an "Older note (r4)" paragraph that mostly repeats itself.

  Fix: refresh the header, drop G-S59 from footgun 5, trim footgun 3.

### INFO-1: nested embed (measured, cheap)
- The setup: host → `![[r7-mid]]` → `![[r5-h-src#Tracker]]`, with the 1,200-line source.
- The card's nearest `src` is `r5-h-src#Tracker`.
- + then pencil saves (`names ["Edited"] values ["6"]`), and a plain Save saves.
- Canvas file nodes were not measured.

### INFO-2: the checks you asked for
1. **MEDIUM-1:** + then pencil in a heading embed of a long note saves, in Reading view and Live Preview (`lc-r7emb.log` rows 9–11; G-S64 (xa)/(ya) green).
2. **MEDIUM-2:** block embed `^id` with a twin above saves into the embedded block, short (Reading view and Live Preview) and long (Reading view), and the long block embed saves in Reading view and Live Preview.
   - An outside edit of a block-embedded block: nothing written, the outside change kept, the form closes with the redraw.
3. **Hard rule:** a renamed heading or a link to another note with the same basename steps aside safely (implementer tests; K4: `dest` is another file → falls back → right block). A lagging cache on a BLOCK subpath does not step aside (MEDIUM-A).
4. **Fallback text search:** it never chooses between identical runs (S1 is killed). But when it gives up, the partial pin is still mapped (MEDIUM-B).
5. **Mutations:** see the table below.
6. **Nested embed:** INFO-1.
7. **Docs:** LOW-1 and LOW-2.
8. **Rebase integrity:** clean (see the summary).

## Mutations
`mutations.txt`; the 6 touched jest files; unmutated 343/343.

| Mutation | Failed tests |
|---|---|
| M1 pin-only for kept forms only | 6 |
| M2 rate limit back for form Saves | 4 |
| M3 force card writes too | 3 |
| M4 sidebar never forces | 1 |
| M5 notify ignores force | 5 |
| M6 forced Notice does not restart the clock | 1 |
| M7 unsavable not forced | 1 |
| M8 note-gone not forced | 1 |
| M9 `reported` not set on a drop | 9 |
| R1 no rebase | 13 |
| R2 no await | 13 |
| S1 take the first of two runs | 1 |
| R4 no trailing-blank trim | 1 (killed now) |
| V1 no anchor-line check | 1 |
| **V2 no link's-note check** | **0 (survives, LOW-2)** |
| V3 no body check | 1 |
| V4 subpath path skipped | 4 |

## Gates
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-review-r7/` (`$S`). Exit codes come from `gate.sh`.

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0 | `$S/gate-tsc.log` |
| lint | rc 0 | `$S/gate-lint.log` |
| jest `--testTimeout=30000` | rc 0. `Test Suites: 1 skipped, 258 passed, 258 of 259 total` · `Tests: 2 skipped, 6622 passed, 6624 total` | `$S/gate-jest-t30.log` |
| touched jest files | 343/343 | `$S/mut-UNMUTATED.log` |
| lifecycle part 3 | `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`; G-S64 (x), (y), (xa), (ya), (xb) "Save landed in the embedded block … twin above and every other byte untouched, no Notice" | `$S/gate-lc-part3.log` |

Probe artifacts:
- `$S/r7-probes.diff`: `r7-probe.test.ts` (K1–K5) and the X-R7EMB / X-R7HOV scratch scenarios with their fixtures.
- `$S/probe-r7.log`, `$S/lc-r7emb.log`, `$S/lc-r7hov-base.log`.
- `$S/mutations.txt`, `$S/mutate.py`, `$S/mutate-all.sh`.

Trees are as found: dse clean at a3ac0769, superproject 63ea40ff with ` M draw-steel-elements`, and the scratch worktree removed.

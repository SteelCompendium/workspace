# SC-619 r3 independent review (reviewer C), dse `19942fe6` on develop `3a5986d3`, superproject `e66cd274`

**Executive summary**
- **Verdict: LAND.** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 5 INFO. No write into a different counter was found in 73 real-Obsidian cells (42 new adversarial cells, 31 r1 cells re-run), in base-vs-fix pairs, or in jest probes.
- Every CRLF heading-hover + / - / form Save that the LF note saves now also saves, into the HOVERED counter, and the note keeps its line endings byte for byte. This holds in RV and LP, for #Tracker and #Other, unique counters, no blank line, two blank lines, a trailing space, closing `##`, frontmatter, a heading at the end of the note, nested same-name headings with unique bodies, minus, and two + in a row. Every refusal stays byte-identical to the outside edit, with one Notice.
- CR-only notes (SC-460, r2's open follow-up) are now **measured**. They save and refuse exactly like LF on both base and fix. The part starts with `\r`, the branch does not fire, and nothing changed for them.
- **LOW-1 (regression, in the safe direction):** a CRLF note converted to LF from outside while its heading hover stays open, then +. Base saved into the hovered counter; the fix REFUSES with the Notice. Measured in real Obsidian (`crlf2lf-hov`) and in jest. Cause: in the drawn-from call, `cardLinkLine` reads the CRLF terminator of the stale CRLF snapshot. Scott's ruling covers it ("save nothing with a notice is fine"). Owner chooses: document it, or apply the measured 3-line alternative.
- **LOW-2 (test gap):** no jest test pins *which* line's terminator the condition reads. Mutant `eols[start + 1]` survives all 20 tests. Real Obsidian distinguishes the two (mixed note `mixC`). Add one jest test.
- My numbers: jest fresh **11815 passed / 1 skipped / 0 failed** (total 11816 = r2's 11814 + 2; the extra pass is `printTwinDeltaAllowedSet`, which runs because r2's shots run left `visual-harness/dist/obsidian-app.css`). Lifecycle part 7 **2/2 (129 s)**. tsc + lint clean. G-S112 against base src: **FAIL on (a)(b)(c)(d)(g), (e)(f) pass**, which is independent red proof.
- The CHANGELOG bullet is fine. The skill proposal needs 3 small corrections (INFO-4). Before landing: dse develop has moved to `1cc54eac` (SC-616, which changed `visual-harness/obsidian-lifecycle.mjs` only), so rebase and re-run lifecycle.

## 1. Gates I ran (all logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc619-r3-reviewer/`)

| gate | where | result | log |
|---|---|---|---|
| jest full, fresh (`rm -f main.js styles.css`) | branch worktree 19942fe6 | 276 suites + 1 skipped; **11815 passed / 1 skipped / 0 failed**, 85 s, rc 0 | `r3-jest-full.log` |
| lifecycle part 7 `G-S108,G-S112` | branch worktree | **2/2 ok**, 129 s, rc 0 | `r3-lc-p7.log` |
| tsc (+e2e), lint (+e2e) | branch worktree | rc 0/0 (the test file is eslint-ignored by config) | `r3-tsclint.log` |
| G-S112 alone, base src (3a5986d3 `ReadingModeBlockHost.ts`, harness 19942fe6) | scratch `wtbase` | **FAIL: (a)(b)(c)(d)(g) values [5,5] / names Twin,Twin + Notice (d leaves its modal open); (e)(f) pass** | `r3-lc-gs112-base.log` |
| mutation of the SC-619 jest file (11 mutants) | scratch `wtfix` | see section 4 | `r3-mutants.log` |
| real-Obsidian probe cells | scratch `wtfix` (fix) / `wtbase` (base src) | 73 fix + 42 base + 12 alt-fix cells | `r3-cells-fix.txt`, `r3-cells-base.txt`, `r3-cells-altfix.txt` (raw: `r3-fix-b1..4.log`, `r3-base-b3/4.log`, `r3-altfix-cells.log`) |

How I checked G-S112's assertions by reading them:
- The refusal phases (e) and (f) compare the note byte for byte with the text the outside edit left (`note !== edited`) and require exactly one Notice. Correct.
- The save phases check the values (the twin keeps 5), the names (`['Twin','Twin']`, or `['Edited','Twin']` for (d)), the text outside the fences, no Notice, all-CRLF, and that the part starts with `\n`. Correct. INFO-5 covers the twin's own fence bytes.

## 2. Real-Obsidian cells (Obsidian 1.15.1, real mouse; base = 3a5986d3 src, fix = 19942fe6)

How to read the outcome column:
- REFUSED = the note is byte-identical to the note before the click (the outside edit included), with the Notice.
- WROTE = which counter changed.
- In every WROTE cell the EOL profile (CRLF / LF / CR counts) was unchanged and the text outside the fences was unchanged.

**r1's 31 cells, re-run on the fix:** every one gives r1's fix outcome. Refused: the swap cells (RV, LP, form, and `#Other`) and adjdel. Saved into the hovered counter: TOP, plus2 (5->7), nogap, trail, twin, lower, LP, uniq, block hover, embeds, the forms, whole-note hover and embed.

**New adversarial cells (base -> fix):**

| cell | note | action | base | fix |
|---|---|---|---|---|
| lf / crlf / crlf-LP sectmove | twin; the hovered section moved to the end | + | REFUSED | REFUSED (all 3) |
| lf / crlf delctr | the hovered counter deleted from outside | + | no card left (preview redrawn), nothing written | same |
| lf-2blank / crlf-2blank | two blank lines under the heading | + | LF Tracker / **CRLF REFUSED** | Tracker / Tracker |
| mixA | CRLF note, `## Tracker` line ends LF | + | Tracker | Tracker |
| mixB | LF note, only `## Tracker` line ends CRLF | + | REFUSED | **Tracker** |
| mixB-other | same note, hover #Other (an LF heading) | + | Other | Other |
| mixC | CRLF note, the blank line under `## Tracker` ends LF | + | REFUSED | **Tracker** |
| lf / crlf swapnogap; mixswap; lf swapnogap2; mixswap2 | names swapped; one section without a blank line; mixed EOLs where the line is `mix…` | + | REFUSED | REFUSED (all) |
| cr twin / uniq / form | CR-only note | + / Save | Tracker / Tracker / Edited | same |
| cr swap / cr adjdel | CR-only note | + | REFUSED | REFUSED |
| lf / crlf setext | setext headings | + | REFUSED (both) | REFUSED (both) |
| lf / crlf endnote | `## Tracker` section last, no final newline | + | LF Tracker / CRLF REFUSED | Tracker / Tracker |
| lf / crlf fm | frontmatter | + | LF Tracker / CRLF REFUSED | Tracker / Tracker |
| lf / crlf nest | `## Tracker` + `### Tracker`, identical bodies | + | REFUSED (both) | REFUSED (both) |
| lf / crlf nestuniq | same, different bodies | + | LF Tracker / CRLF REFUSED | Tracker / Tracker |
| lf / crlf callout | `> ## Tracker` inside a callout | + | Obsidian opens no preview card (both) | same, not reachable |
| lf / crlf closing | `## Tracker ##` | + | LF Tracker / CRLF REFUSED | Tracker / Tracker |
| crlf form LP | | Save | REFUSED | Edited into Tracker |
| crlf minus | | - | REFUSED | Tracker 5->4 |
| lf / crlf swap-lower | hover #Other, names swapped | + | REFUSED | REFUSED |
| crlf adjdel LP | | + | REFUSED | REFUSED |
| **lf2crlf** | LF note converted to CRLF from outside, preview open | + | REFUSED | REFUSED |
| **crlf2lf** | CRLF note converted to LF from outside, preview open | + | **Tracker (saved)** | **REFUSED** (LOW-1) |

Answer to the review question:
- **Different (identical) counter: none written.** In a mixed-EOL swap (`mixswap`), `cardLinkLine` on the note as it is now places the twin. Jest probe: `linkNow=12`, the counter now under `## Tracker`; base returns null. The SC-607 drawn-from rule then refuses it, both in real Obsidian and in jest.
  - This is the same layering as the pure-LF swap, where `cardLinkLine` also points at the twin (r1: "link 15") and SC-607 refuses.
  - So the fix reaches no state that an LF layout does not already reach. INFO-1.
- **LF behaviour:** unchanged in every LF cell, with one exception. The note in LOW-1 is LF at the click, but its preview was drawn from CRLF.

## 3. Findings

### LOW-1: a CRLF -> LF conversion while a heading hover is open now refuses (base saved)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:1116`, the condition `splitWithEols(whole).eols[start] === '\r\n'`. It runs with `whole = drawn.text` when called from `drawnFrom` at `:1023`.
- **Scenario:**
  1. A CRLF note's `[[n#Tracker]]` hover is open.
  2. An outside tool (git autocrlf, a sync client, an editor's EOL conversion) rewrites the note as LF.
  3. Obsidian redraws the preview with the LF part (measured: the section head goes `"\n\r\n```…"` -> `"\n```…"`). The card keeps its mount snapshot, which is the CRLF note.
  4. Press +. `cardLinkLine` runs on the note as it is now: LF, the branch is off, so it is placed. The drawn-from call runs `cardLinkLine` on the CRLF snapshot with the LF part, which starts with `\n` for the legitimate blank line. The CRLF heading terminator in the snapshot fires the branch, the legitimate blank line is dropped, the alignment fails, and the write is refused with "changed on disk first".
- **Evidence:** base 3a5986d3 wrote 5->6 into Tracker with no Notice; the fix refuses with one Notice (`crlf2lf-hov`, `r3-cells-base.txt` vs `r3-cells-fix.txt`).
  - Jest (`r3-probe-eolconv.test.ts.txt`, same host with no rebind): fix `ok=false notices=1`; base `ok=true`.
  - The mirror case (LF -> CRLF) refuses on both base and fix.
- **Severity:** LOW. The change is in the safe direction, which Scott's 2026-11-10 ruling covers. It is rare, and reopening the preview saves.
- **Fix: owner's choice.**
  - **(a)** Accept it and document it. Add one sentence to the skill proposal and the code comment: "a note whose line endings were converted from outside while its heading hover is open can refuse until the preview is reopened."
  - **(b)** Take the EOL evidence from the note as it is now, not from the drawn snapshot. Measured diff: `r3-alt-fix.diff`, +3/-3. `cardLinkLine` gets optional `eolText` / `eolMeta` (default: `whole` / `meta`), and `drawnFrom` passes `whole` plus the current cache. Measured on the alternative:
    - jest: 12 `reading-mode-host*` suites pass (4460 tests); all 4 conversion probes save.
    - real Obsidian: 12 cells. `crlf2lf` and `lf2crlf` both save into Tracker. Every swap, adjdel, sectmove and mixswap refusal holds. Twin, form and LF saves are unchanged (`r3-cells-altfix.txt`).
    - Not run on the alternative: the full battery and G-S112.
  - If (b) is taken, add the probe as a jest test.

### LOW-2: no jest test pins which line's terminator the condition reads
- **Where:** `test/dom/framework/reading-mode-host-crlf-hover.test.ts`. Mutant M6 (`eols[start + 1]` in place of `eols[start]`) passes all 20 tests.
- **Scenario:** a future refactor reads the wrong line's terminator. In a mixed note, CRLF heading line over an LF blank line (`mixC`), real Obsidian gives the part `"\n\n```ds-counter\r\n…"`. The fix saves it (measured); M6 would refuse it again.
- **Fix:** add one jest test for that mixed note, part `hoverPart(text, '## Tracker')`, expecting a save into Tracker with the bytes kept. It kills M6, and M11 too if the test also covers the LF-heading control. The brief listed this check ("does the condition read the right line's terminator?").

### INFO
1. **The mixed-EOL swap places the twin at the `cardLinkLine` layer.** The SC-607 drawn-from rule refuses it, as in the pure-LF swap (section 2). No change is needed. The `cardLinkLine` docblock and SKILL say the drawn-from rule is what refuses swaps; that holds here too.
2. **Mutants that survive and are equivalent in Obsidian 1.15.1:**
   - M2, no `hovered !== null`: an embed's part starts at the heading.
   - M4, no `blockId === null`: a block part starts at the fence.
   - M5, no `startsWith('\n')`: a CRLF heading hover's part always starts with `\n` today; the guard is for a future slice.
   - M11, `eols !== '\n'`: a lone CR followed by `\n` is a CRLF.
   - M7, `own` with `relLine`: `own` is used only when `known === null`, and every test sets a known body.

   Killed: M1 (2 tests: the LF control and the mixed control), M3, M8, M9, M10 (8 tests each; M10 = revert gives exactly r2's "8 red").
3. **Cost.** `splitWithEols(whole)` now also runs for LF heading hovers whose part starts with a blank line (the common LF shape), twice per rebase. It is O(n) next to the existing `splitLines(whole)`, so the cost does not matter.
4. **`sc619-skill-proposal.md` accuracy.** The numbers, the test counts (8 + 7 + 4 + 1 = 20) and the part-7 timings check out (mine 129 s). Three corrections:
   - (i) §1 "Not measured: CR-only notes": now measured (r3). CR-only notes save and refuse like LF. The part starts with `\r`, the branch does not fire, and base already behaved the same.
   - (ii) §1 "an LF note never takes the branch": qualify it with LOW-1. The branch can fire in the drawn-from call when the snapshot is CRLF and the note is now LF. Or drop the sentence if alternative (b) is taken.
   - (iii) Consider one clause in SKILL "Heading hover shape" (~line 451). Today it reads "a heading hover's section is the heading's body (`lineStart` 1)". In a CRLF note it is `lineStart` 2 with a leading `\n`. Also: a heading inside a callout gets no hover preview card in 1.15.1 (measured, LF and CRLF).
5. **G-S112 save phases** check the twin by its value and name, not by its fence bytes. The plugin re-serializes only the written block, and the values plus the outside-the-fences check make a twin write visible. Acceptable; no change needed.

### Checked, no finding
- **CHANGELOG** (`e66cd274`, the worktree's `CHANGELOG.md` top of `## Unreleased`): user-facing, plain words, "CRLF" glossed as "a Windows-style file", and the scope is accurate (the not-affected shapes and the refusals). The main checkout's CHANGELOG is untouched.
- **Diff scope:** `ReadingModeBlockHost.ts` +9/-4, the test file +362, the lifecycle +151. No styles. No drive-bys.

## 4. Mutation table (`r3-mutants.log`; SC-619 jest file, 20 tests)
M1 no EOL check: 2 fail · M2 no hovered: 0 · M3 rel unadjusted: 8 · M4 no blockId: 0 · M5 no startsWith: 0 · **M6 eols[start+1]: 0** · M7 own with relLine: 0 · M8 line with relLine: 8 · M9 no slice: 8 · M10 revert: 8 · M11 eols !== '\n': 0. Source restored (verified byte-equal).

## 5. Land notes for the owner
- dse `origin/develop` moved to `1cc54eac` (SC-616, 3 commits, `visual-harness/obsidian-lifecycle.mjs` only, +60/-33); workspace main moved to `eef07402`. The SC-619 branch also edits that file, in the header and around G-S108/G-S112. Rebase, then re-run at least lifecycle parts 5 and 7 and jest.
- Tree hygiene: the branch plugin, the superproject worktree and the main checkout's dse status are byte-identical before and after (`r3-status-before.txt` / `r3-status-after.txt`). `appearance.json` was not touched. The scratch worktrees `wtfix` / `wtbase` were removed by exact path (node_modules symlinks unlinked first), and the one kept lifecycle temp dir (`/tmp/dse-obsidian-lifecycle-8gsC31`, from the G-S112 base red run) was deleted by exact path. Nothing was committed or pushed.

# SC-619 r1: diagnosis, failing tests, fix design (dse 1f1ae442, branch `sc619-crlf-hover-refusal`)

**Executive summary**
- **Refusing check:** `cardLinkLine`, the every-line part compare at `src/framework/host/ReadingModeBlockHost.ts:1126`. The part is misaligned at `:1118-1124`. The other checks (`snapshotDrawn` / `metaMatchesText`, the R-Q3 guard, `mapLineStrict`, `countByBody`, `placedUniquely`) are never reached. `pinnedTarget:1174` only reports the result: the pin stays partial, so the target is `miss` and the "changed on disk first" Notice shows.
- **Measured input (real Obsidian 1.15.1, instrumented 1f1ae442):** Obsidian cuts a heading HOVER's part starting one character after the heading line's content. In an LF note that character is the LF. In a CRLF note it is the CR, so the part starts with a stray LF: `"\n\r\n```ds-counter\r\n…"` (84 chars, card `lineStart` 2; LF: `"\n```ds-counter\n…"`, 75 chars, `lineStart` 1). The part has one extra line, and cardLinkLine compares it one line too low: `part[1]=""` against the note's line 6 (the fence).
- **Not twin-specific:** a CRLF heading hover with a UNIQUE counter is refused too. So is a heading hover's block edit form Save (the SC-596 path), in Reading view and Live Preview. A heading with no blank line before its fence is also refused (it fails one step earlier, `partStart === null`).
- **Not affected (saved at base, CRLF kept):** a block hover `[[n#^id]]`, a heading embed `![[n#H]]` (Reading view and Live Preview; its part starts at the heading), a block embed, an embed form Save, and a whole-note hover or embed.
- **Inputs that are fine:** `cachedRead` and `hoverPopover.embed.data` are both raw CRLF and equal. The metadata-cache offsets are raw (CRLF counted), so `metaMatchesText` returns true. The snapshot is kept as `part`.
- **Failing tests:** commit `7ef96b18` adds `test/dom/framework/reading-mode-host-crlf-hover.test.ts` (19 tests). On 1f1ae442 it is 7 red, 12 green. Full branch jest: 11800 passed / 7 failed / 2 skipped. The 7 red: the ticket (+ #Tracker); + #Other; unique counter; hover form Save; no blank line under the heading; TOP edited; two + with a redraw.
- **Fix (one sentence):** in `cardLinkLine`, when a heading HOVER's part starts with `'\n'` and the note's heading line `start` ends in `'\r\n'`, drop that one LF and use `relLine - 1`. The part is then compared line for line exactly as the LF note's part, and every later check (SC-594 / SC-607 / SC-612) runs unchanged.
- **Prototype measured:** 31/31 real-Obsidian cells give the LF outcome. Every CRLF refusal (names swapped, adjacent twin deleted, form after swap, Live Preview) still refuses at the same step as in LF. Jest on the prototype: 11805 passed + 4 skipped = 11809, 0 failed (2 extra skips come from the scratch tree having no sibling compendium). Mutants: 2 of 3 killed. M2, which drops the hover-only guard, is equivalent.
- **G-S112 (part 7): recommended,** with 6 phases (section 5). The SC-612 fuzz could not catch this: its CRLF notes use a plain host (a `div`, the whole note as its section), so it never reaches `rebaseCardPin` / `cardLinkLine`. The hover suites have no CRLF note and hand-build an LF part.

## 1. Method

- I made a scratch worktree of 1f1ae442 at `scratchpad/sc619-r1-reviewer/inst` (now removed). I instrumented `ReadingModeBlockHost.ts` with `globalThis.__r1Trace` (`r1-instrument.py`):
  - the snapshot inputs (part / text, CR or not, `metaMatchesText` and why);
  - each rebase step (the link line, the drawn-from line, the guard, `mapLineStrict`);
  - every `return null` in `cardLinkLine` (numbered: `r1-null-labels.txt`) and in `pinnedTarget`;
  - the write target.
- The R619 scenario was spliced into a copy of the lifecycle harness inside the scratch tree, never the branch (`r1-make-scratch.py`, `r1-scenario.mjs`, run by `r1-run-obsidian.sh`). It used:
  - real mouse hover and click (`gs83Kit`);
  - the form opened by a real pencil click, the raw text edited, Save by real click;
  - outside edits through `app.vault.process` with regexes that keep CRLF.
- The prototype fix (`r1-fix.py`, diff `r1-fix-prototype.diff`) went onto the same instrumented tree, and all cells were re-run.

## 2. Measurements (real Obsidian 1.15.1; base = instrumented 1f1ae442, fix = + prototype)

N = DSE Notices. "start" = the card's `getSectionInfo` `lineStart` and the start of its part text. For form cells, "names" is the first two counters' `name:`.

| cell | eol | shape | link | action | part | base | fix |
|---|---|---|---|---|---|---|---|
| lf-twin-hov | LF | hover rv | #Tracker | + | start 1 `"\n```ds-counter\n…"` | [6,5] N0 | [6,5] N0 |
| **crlf-twin-hov** (the ticket) | CRLF | hover rv | #Tracker | + | start 2 `"\n\r\n```ds-counter\r…"` | **[5,5] N1** | [6,5] N0 |
| crlf-twin-hov-lower | CRLF | hover rv | #Other | + | start 2 | **[5,5] N1** | [5,6] N0 |
| crlf-twin-hov-lp | CRLF | hover lp | #Tracker | + | start 2 | **[5,5] N1** | [6,5] N0 |
| crlf-uniq-hov | CRLF | hover rv | #Tracker (unique) | + | start 2 | **[5,9] N1** | [6,9] N0 |
| crlf-twin-hovform | CRLF | hover rv | #Tracker | form Save | start 2 | **Twin,Twin N1** | Edited,Twin N0 |
| crlf-uniq-hovform | CRLF | hover rv | #Tracker (unique) | form Save | start 2 | **Twin,Twin N1** | Edited,Twin N0 |
| lf-nogap-hov | LF | hover rv | #Tracker, fence under heading | + | start 0 `"```ds-counter\n…"` | [6,5] N0 | [6,5] N0 |
| crlf-nogap-hov | CRLF | hover rv | same | + | start 1 `"\n```ds-counter\r\n…"` | **[5,5] N1** (null#10) | [6,5] N0 |
| lf-trail-hov / crlf-trail-hov | LF / CRLF | hover rv | `## Tracker␠␠` | + | start 1 / start 2 | [6,5] N0 / **[5,5] N1** | [6,5] N0 / [6,5] N0 |
| crlf-top-hov | CRLF | hover rv | #Tracker, TOP edited from outside | + | start 2 | **[5,5] N1** | [6,5] N0 |
| crlf-plus2-hov | CRLF | hover rv | #Tracker, + then + after the redraw | ++ | start 2 | **[5,5] N1** | [7,5] N0 |
| lf/crlf-twin-blkhov, crlf-uniq-blkhov | LF/CRLF | hover rv | #^ta | + | start 0 `"```ds-counter\r\n…"` | [6,5] / [6,5] / [6,9] N0 | same |
| lf/crlf-twin-emb, crlf-twin-emb-lp, crlf-uniq-emb | LF/CRLF | embed rv/lp | #Tracker | + | start 2 `"## Tracker\r\n\r\n```…"` | [6,5]… N0 | same |
| crlf-twin-blkemb | CRLF | embed rv | #^ta | + | start 0 | [6,5] N0 | same |
| crlf-twin-embform | CRLF | embed rv | #Tracker | form Save | start 2 | Edited,Twin N0 | same |
| crlf-twin-whole-hov / -emb | CRLF | hover / embed | (whole note) | + | start 6 (the whole note) | [6,5] N0 (whole-note pin) | same |
| lf-swap-hov | LF | hover rv | #Tracker; names swapped from outside | + | start 1 | refused N1 (strict line 6 ≠ link 15) | same |
| crlf-swap-hov / -lp | CRLF | hover rv / lp | same | + | start 2 | refused N1 (null#11) | **refused N1 (strict line 6 ≠ link 15, as LF)** |
| crlf-swap-hovform | CRLF | hover rv | same | form Save | start 2 | refused N1 | **refused N1 (as LF)** |
| lf-adjdel-hov | LF | hover rv | upper of 2 adjacent `## Tracker` deleted | + | start 1 | refused N1 (drawn: null#7, from=None) | same |
| crlf-adjdel-hov | CRLF | hover rv | same | + | start 2 | refused N1 (null#11) | **refused N1 (null#7, from=None, as LF)** |

Every CRLF save left the note all-CRLF (`stillCR` true in every record; SC-453 holds).

What each input holds (CRLF twin, base trace `r1-obsidian-base-inst-1.log`):
- **Hover part (`getSectionInfo().text`):** CRs kept. It starts with a lone `\n`: Obsidian cut it at the heading's `position.end.offset + 1`, which is the CR. `lineStart` 2, `lineEnd` 7.
- **`cachedRead`:** CRLF, 236 chars.
- **`hoverPopover.embed.data`:** CRLF, 236 chars, equal to the `cachedRead` text. The guard's `eq` is true; no LF normalisation anywhere.
- **Metadata cache:** heading `Tracker` at line 4, offset 33, and the text at that offset is `"## Tracker\r\n"`. So the offsets are raw. The last section ends at line 24, offset 234; the tail is `"\r\n"`. `metaMatchesText` returns true and the snapshot is kept as `part`.
- **`cardLinkLine` (now and drawn):**
  - `start` 4. `lines[4]` is `"## Tracker"` and `part[0]` is `""`, so the second branch (`lines[start+1] === part[0]`) puts `partStart` at 5.
  - The loop then compares `part[1]=""` with `lines[6]="```ds-counter"` → **return null at :1126**.
  - With no link line and no own write, `from` is null, so the pin stays partial: `pinnedTarget` returns null (`:1174`), the target is `miss`, and the dropped-write Notice shows.

## 3. Failing tests (commit `7ef96b18`, test only, no `src/` change)

File: `test/dom/framework/reading-mode-host-crlf-hover.test.ts`. No bracketed ids in titles.

**The model:**
- Each hover part is cut from the raw note at `heading end + 1`, up to the next heading. The model test checks the cut against the measured 84 / 75-char texts.
- Each embed part starts at its heading; a block part is the block's own lines.
- `embed.data` is the raw note.
- The cache carries raw offsets and a `sections` end.
- Outside edits keep the note's EOL.

Red on 1f1ae442 (7). Each one fails because the CRLF heading hover is refused (note unchanged, `replaceSource` false):
1. `SC-619: + in the hover of [[Note#Tracker]], an identical counter under ## Other: saved into Tracker, the note stays all-CRLF, no Notice`
2. `SC-619: + in the hover of [[Note#Other]] (the lower of the two identical counters): saved into Other`
3. `SC-619: + in the hover of a heading whose counter is unique in the note: saved (the refusal is not about the twin)`
4. `SC-619: a block edit form Save in the hover (the SC-596 pin, pinOnly): saved into the hovered counter`
5. `SC-619: the fence right under the heading (no blank line: the part is the LF, then the fence): saved`
6. `SC-619: an unrelated outside edit above before the click (TOP edited): saved`
7. `SC-619: two + in a row, the preview redrawn between them (Obsidian slices the new part the same way; rebind): both land in the hovered counter`

Green on 1f1ae442 and on the prototype (12):
- **The model test.**
- **7 refusal parity tests.** Each runs the same shape in an LF and a CRLF note and asserts nothing written plus exactly the "changed on disk first" Notice for both:
  - names swapped (card);
  - names swapped (form);
  - upper of two adjacent `## Tracker` deleted;
  - two `## Tracker` with a section between, the hovered first one deleted;
  - hovered counter edited from outside while its twin holds the old value;
  - hovered unique section moved to the end (SC-607 F1, refused in LF);
  - the hover window race (names swapped after `embed.data`, before the card's read).
- **4 controls:** the LF ticket shape saves; a CRLF block hover `#^ta` saves; a CRLF heading embed saves; a mixed note whose heading line ends in LF (part starts `"\r\n```"`) saves.

At base the CRLF refusals pass trivially, because everything refuses. They exist to hold the fix.

Logs:
- `r1-jest-crlf-hover-base.log` (file at base: 7 failed / 12 passed);
- `r1-jest-branch-full-7ef96b18.log` (11800 passed / 7 failed / 2 skipped);
- `r1-jest-probe-host-suites.log` (all 11 `reading-mode-host*` suites with the prototype: 4455/4455);
- `r1-jest-probe-full.log` (full run with the prototype: 11805 passed / 4 skipped / 0 failed. The 2 extra skips are `migrationCensus`, which needs the sibling compendium checkout that a scratch tree lacks. In the branch worktree expect **11807 passed / 2 skipped**).

tsc and lint are clean with the test file (`r1-tsc-lint-tests.log`).

## 4. Fix design

**Where:** `ReadingModeBlockHost.cardLinkLine` (1f1ae442 `:1084-1139`), and only there. It is the one place that lines the part up against note lines. The other users of `sectionText` do not depend on that alignment:
- `whole === sectionText`;
- the guard's `sectionText.trim()`, which trims the stray LF;
- the `drawn.text === null` whole-note case.

**Normalisation point:** replace `const part = splitLines(sectionText);` (`:1113`) with:

```ts
// SC-619: Obsidian slices a heading HOVER's part from one character after the heading line's content (measured, 1.15.1): the line break in an LF
// note, but the CR in a CRLF note, where the part then starts with the LF of the heading line's own CRLF (its line 0 is the rest of the heading
// line, every line one lower than in an LF note, `lineStart` one more). That LF is dropped and the card's line in the part moved up one: the part
// is then compared, line for line, exactly as the same LF note's part.
const crlfHover = hovered !== null && blockId === null && sectionText.startsWith('\n') && splitWithEols(whole).eols[start] === '\r\n';
const part = splitLines(crlfHover ? sectionText.slice(1) : sectionText);
const rel = crlfHover ? relLine - 1 : relLine;
```

Then use `rel` for `relLine` in `const line = partStart + rel;` (`:1127`) and in `blockBodyLines(part, rel, rel + …)` (`:1137`). Import `splitWithEols` from `./lineEnding`. That is the whole change (+10 / −4, `r1-fix-prototype.diff`).

**Why it is safe:**
- **LF is unchanged.** The condition needs the heading line's own terminator to be `\r\n`, so an LF note never takes the branch. The LF control test kills mutant M1, which drops that condition.
- **CRLF goes through every LF gate.** After the LF is dropped, a CRLF part goes through the same gates as the LF part:
  - the heading-line check (`named.includes(start)`) and, while twinned, the one-heading rule;
  - every line compared;
  - a fence of the known body at the line;
  - the drawn-from strict map (`mapLineStrict` must agree with the link line);
  - the R-Q3 guard;
  - R-Q2c;
  - `pinnedTarget`, with `twinned` / `placedUniquely`.
- **The traces match LF.** In real Obsidian, crlf-swap gave link 15 / from 6 / strict line 6 → refused, and crlf-adjdel gave drawn null#7 → refused. Both are exactly the LF traces.
- **The write path does not change.** `replaceFenceBlock` already keeps CRLF.

**Scope:**
- Heading hovers only (`blockId === null`, `hovered !== null`).
- Block hovers, embeds and whole-note pins save already. Their parts start at the block or heading, never with the stray LF, so the branch is never true for them. M2, which drops `hovered !== null`, survives every test because it is equivalent today. I keep it for clarity: the measured slicing quirk is a hover's.

**Forward compatibility:** if a later Obsidian cuts after the whole CRLF, the part starts on the blank line (`"\r\n```"`) or on the fence. `crlfHover` is then false and the existing branches place it.
- The one exception is a hypothetical mixed note: heading line CRLF, then an LF-only blank line, then the fence. Under such an Obsidian that note's part would be `"\n```"`, and the fix would drop the wrong LF. The result is a refusal, never a write (the line compare fails).

**Probe cells the implementer must keep or add:**
- The 19 tests in `reading-mode-host-crlf-hover.test.ts` (all green with the prototype).
- Recommended CRLF mirrors in the SC-607 sweep: add an `eol` axis to `reading-mode-host-drawn-pin.test.ts`'s `run()`, at least for `kind=heading, shape=hover` (2 modes × 2 clicks × 5 edits × caches × 3 plus ≈ 72 cells). Build the note with `\r\n` and take the hover part from the raw text at `heading end + 1`, not `['', …].join('\n')`. Assert `expected(c)` unchanged, plus all-CRLF after a save. That sweep (`del-upper-sep`, `swap`, cache `lagging`, `+ redrawn` / `+ stale`) is what SC-607 proved; a CRLF axis proves the fix adds no write the LF rule refuses.
- One CRLF mirror each of the hover-card J4 shape (the hovered counter edited from outside → refused), the J5 shape (second + while the part is stale → saved), and an SC-612 rule-P twin in a heading hover (adjacent identical sections, either deleted → refused). The first two are covered in spirit by the new file; the third is covered for the upper deletion.

**What not to do:**
- Normalising `sectionText` in `readSection` or `takePin` would move `ownFence`'s `lineStart` and the snapshot's `partText === text` compare for every host.
- Comparing LF-stripped copies of the note and part would not fix it: the extra line comes from the slice, not the CRs.

## 5. Lifecycle G-S112 (part 7): warranted

The bug lives in Obsidian's slicing, which jest can only copy by hand. If a future Obsidian changes the slice, only a real-Obsidian scenario shows it.

One CRLF source note per phase, reset each time. Run it in part 7 after G-S108. 7 cells at about 8 s each, measured; expect about 60-70 s, so part 7 takes about 130-140 s.

| phase | note / shape | action | assert |
|---|---|---|---|
| a | CRLF, identical counters under `## Tracker` / `## Other`; Reading-view hover `[[src#Tracker]]` | real + | values [6,5], 0 Notices, note all-CRLF, text outside the fences unchanged |
| b | the same, Live Preview host (Ctrl-hover) | real + | [6,5], 0 Notices, all-CRLF |
| c | the same, hover `[[src#Other]]` | real + | [5,6] |
| d | the same, Reading-view hover | pencil → form, `name: Edited`, real Save | first counter Edited, second Twin, 0 Notices, all-CRLF |
| e | the same; heading names swapped from outside (CRLF-preserving) while the preview is open | real + | [5,5], exactly one "changed on disk first" Notice, all-CRLF |
| f | CRLF, two ADJACENT identical `## Tracker` sections; the hovered (upper) deleted from outside | real + | the surviving counter is still 5, one Notice |
| (g, optional) | CRLF, fence right under the heading (no blank line) | real + | [6,5] |

- **Red on a 1f1ae442 bundle:** a, b, c, d (and g) fail; e and f pass.
- **Green with the fix:** all phases. These are measured cells `crlf-twin-hov`, `-lp`, `-lower`, `crlf-twin-hovform`, `crlf-swap-hov`, `crlf-adjdel-hov`, `crlf-nogap-hov`. Copy the mechanics from `r1-scenario.mjs`:
  - `K.hover` and `K.click`;
  - `clickRevealed` for the pencil;
  - the `EDITS` regexes with `\r?\n`;
  - the all-CRLF check `!/[^\r]\n/.test(text)`.
- **Authoring note:** compare values and names, not fixture text. The plugin rewrites the YAML in its own key order (dse-verify "Lifecycle and e2e notes").

## 6. Why the existing coverage missed it

- **SC-612 fuzz** (`reading-mode-host-whole-pin-fuzz.test.ts`):
  - About 15% of its layouts are CRLF, but the host is a plain `document.createElement('div')` with the WHOLE note as its section. That is never `.markdown-embed` or `.hover-popover`, so `takePin` never makes a partial pin and `rebaseCardPin` / `cardLinkLine` never run.
  - It covers the whole-note path, `pinnedTarget` / `placedUniquely` / `mapLine` on CRLF, and that path is fine: `crlf-twin-whole-hov` and `-emb` save in real Obsidian.
- **SC-594 / SC-596 / SC-607 hover suites** (`reading-mode-host-hover-card`, `-drawn-pin`, `-form-pin`, `-pin`):
  - They contain no CRLF note.
  - Their heading-hover part is hand-built as `['', ...CTR, ''].join('\n')` with `lineStart` 1. That is the LF slice, not Obsidian's offset slice, so a CRLF note could not have been modelled even with `\r\n` added.
- **Lifecycle:** G-S10 (SC-453) covers CRLF only for plain cards. No lifecycle scenario hovers a CRLF note.

## 7. Risks and notes for the implementer

- **The mechanism is my inference.** I measured the slice offset in 1.15.1 only (part lengths 84 / 75, lineStart 2 / 1, and the no-blank-line part `"\n```"` with lineStart 1). The mechanism I infer from them is `position.end.offset + 1`. A trailing-space heading (`## Tracker␠␠`) cuts the same way: its end offset includes the spaces.
- **CR-only notes (SC-460) were not measured.** The heading line ends in a lone `\r`, so the branch does not fire. If Obsidian's `+1` skips that CR, the part is LF-shaped and placed as before.
- **Setext headings:** unchanged. `named` reads ATX only, as before.
- **The extra `splitWithEols(whole)`:** it runs only when the part starts with `'\n'`, which includes every LF heading hover with a blank line under the heading. Cost: one extra O(n) split per `cardLinkLine` call, two per rebase. Negligible. Reading the terminator by offset would avoid it if wanted.
- **Mutant results** (`r1-mutants.log`):
  - M1 (no EOL condition): killed by the LF control.
  - M2 (no `hovered` restriction): survived, equivalent today.
  - M3 (part normalised, `relLine` not shifted): killed, 7 tests.
- **Overlap:** SC-621 (`rebaseCardPin` one-sided edit) is the same function family. There is no overlap with `cardLinkLine`, but expect rebase conflicts in the same file.
- **User-facing:**
  - CHANGELOG `## Unreleased` bullet, e.g. "A + / - or a form Save in a hover preview of a heading of a note saved with Windows line endings is saved again (it showed 'changed on disk first')."
  - In the dse-verify SKILL "What `cardLinkLine` checks", add the CRLF hover slice fact (part starts `"\n\r\n"`, lineStart one more).

## 8. Working tree

- **Branch commit:** `7ef96b18` (test file only, on 1f1ae442). Not pushed. No tags.
- **Branch worktree status:** clean. `node_modules` was installed (`npm ci`, needed for later rounds) and `.devbox/` was created; both are ignored. Jest's `main.js` / `styles.css` / `main.css` were removed. The superproject env shows ` M draw-steel-elements` (the pointer moved by the new commit).
- **Scratch worktrees:** `inst` and `probe` were removed with `git worktree remove`.
- **Main checkout:** not touched.

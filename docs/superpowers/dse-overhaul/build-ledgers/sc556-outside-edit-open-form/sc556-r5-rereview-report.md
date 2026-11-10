# SC-556 r5 scoped re-review: dse 92288b73..7095e3aa, superproject 789bf152..2f946190

**Verdict: FIX FIRST.** Findings: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 2 LOW, 3 INFO.
- HIGH-1 (r3) is fixed for the plain path, measured in real Obsidian 1.15.1. A heading embed of a 1,200-line note saves in both Reading view and Live Preview. Block embeds `![[note#^id]]` with a long note on both sides also save in both modes. An outside edit of an embedded block keeps the outside change and writes nothing.
- MEDIUM-1 (a regression from this ticket): in a heading embed of a long note, pressing **+ and then the Edit pencil** (the SC-519 flush path) opens a form that can never save. Every Save gets a false "changed on disk first" Notice, in both Reading view and Live Preview. Base 6270e84a saves.
- MEDIUM-2 (present on base too, not a regression): a block embed `![[note#^id]]` of a short note that has an identical block elsewhere writes the user's edit into the OTHER block. Nothing on disk changed. The same note made long gives a false refusal on HEAD; base writes into the twin.
- Both MEDIUMs share one cause: the rebase finds the embed's section by exact text and gives up when that fails. One fix closes both (see MEDIUM-1).
- LOW-1 (M7/M8) and LOW-2/3/4 (r3) are fixed. The comments are now accurate. One CHANGELOG phrase over-claims (LOW-1 below).
- Gates: tsc and lint rc 0. jest t30: 6514 passed / 2 skipped / 257 of 258. The touched jest files: 329/329. Lifecycle part 3: 9/9, with G-S64 (x), (y) and (z) green.
- Every one of the 14 mutations is killed except R4. R1 and R2 kill the implementer's embed test (3), so that test is not vacuous.

## Findings

### MEDIUM-1: + then the Edit pencil in a heading embed of a long note gives a form that can never save
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:778` (the rebase is started from the section text read at open), `:791-813` (`rebasePin` needs that exact section text inside `cachedRead`) and `:849` (Save waits for it).
- **Scenario:** a session note embeds `![[Prep#Tracker]]` and the prep note is long. The GM presses + on the tracker card and right away its Edit pencil. SC-519 writes the +1 first, then opens the form. The embed has not been redrawn yet, so `getSectionInfo` still gives the old section text (`current_value: 5`). `cachedRead` already holds 6. The section is not found, the pin stays partial, and the 400-edit limit refuses the Save. The user gets "a change to a block in Prep was not saved — the block changed on disk first", although nothing changed outside. Every later Save of that form is refused too, because the pin is fixed when the form opens.
- **Measured** (scratch scenario X-R5EMB, `lc-r5emb-head.log` vs `lc-r5emb-base.log`):

  | Case | HEAD 7095e3aa | base 6270e84a |
  |---|---|---|
  | heading long, RV, + then pencil | form OPEN, `values ["6"]`, 1 Notice | written (`Edited`, 6) |
  | heading long, LP, + then pencil | form OPEN, 1 Notice | written |
  | heading long, RV, + then wait 2.5 s then pencil | written | written |

  The jest version (J7, `probe-r5.log`: a stale section, a long note, the host's body newer) gives `ok=false notices=1 rebased=false`.
- **Fix:** rebase with Obsidian's own subpath instead of the section text:
  1. take the embed's link from `containerEl.closest('.internal-embed')?.getAttribute('src')` (e.g. `Prep#Tracker` or `Prep#^blk`);
  2. call `resolveSubpath(app.metadataCache.getFileCache(file), '#…')`;
  3. add `start.line` to the pin's relative line, and set `pin.text` to the `cachedRead` text.

  The relative line of the block's opening fence does not move when the card's own write changes the body below it. This also picks the one heading or block Obsidian embeds, which closes MEDIUM-2 and the duplicated-section case the owner dropped in (c). Keep the exact-text match as the fallback when there is no `src` or cache. Add:
  - a jest test like J7 (stale section text, a long note, the host's body newer);
  - a G-S64 phase: + on the embedded card, then the pencil, then Save lands.

### MEDIUM-2: a block embed of a short note with an identical block elsewhere writes the other block, with no outside change (present on base too)
- **Where:** the same code. A block embed's section is only the block (measured `{lines: 6, lineStart: 0, first: "```ds-counter"}`). With an identical twin elsewhere, `rebasePin` finds the text twice and gives up (`:806`). `pinnedTarget` then maps the partial pin with `mapLine` and lands on the twin.
- **Measured (X-R5EMB):**

  | Case | HEAD 7095e3aa | base 6270e84a |
  |---|---|---|
  | `![[r5-bas-src#^blk]]` (the lower block), short note | `names ["Edited","Twin"]`: the UPPER block was written | the same wrong write |
  | the same with 300 paragraphs on each side | refused, false Notice, form open | wrote the UPPER twin |

  The jest version (J6) agrees.
- **Why it matters here:** this is not the SC-556 outside-edit path, so it is not a regression. But it is exactly what the CHANGELOG headline says no longer happens (an edit written into a block the user never opened). It needs only an ordinary block embed and one identical block in a short note.
- **Fix:** the subpath rebase from MEDIUM-1 (`blocks[id]` is unique). If the owner keeps MEDIUM-1 apart, at least treat a partial pin whose section was found more than once as unplaceable (refuse) instead of mapping it. Otherwise file a Backlog ticket.

### LOW-1: CHANGELOG "however long that note is" over-claims
- **Where:** dse `CHANGELOG.md:32` and workspace `CHANGELOG.md:18`.
- **Problem:** "a form opened on a card in an embed of one heading of a note … however long that note is" is false for MEDIUM-1, and for a note with two identical sections (ruled DROP in r4 follow-up (c), but not disclosed).
- **Fix:** after MEDIUM-1, keep the phrase only if it holds. Otherwise add "unless you clicked the card just before opening the form" and drop the absolute.

### LOW-2: the trailing-blank-line trim in `rebasePin` is untested
- **Where:** `ReadingModeBlockHost.ts:798`.
- **Measured:** mutation R4 (the `pop()` loop disabled) leaves all 329 touched tests green. In the test fixture, the section's trailing `''` is also in the note, so the trim never matters there.
- **Scenario:** a heading embed of the last section of a note, where Obsidian's section text ends with more blank lines than the file has. Then the run is not found and a long note is refused.
- **Fix:** if MEDIUM-1's subpath fix lands, this code becomes the fallback only. Otherwise add a test with the embedded section at the end of the note and differing trailing blank lines.

### INFO-1: races and edge cases probed, all fine (jest `probe-r5.log`)
- J1: an outside edit outside the section between open and the `cachedRead` resolving, in a long note: Save lands. `cachedRead` reads at call time, so the snapshot matches the section.
- J2: the embedded block edited from outside right after open, with a twin above holding the old body: refused, nothing written.
- J4: `cachedRead` rejects: no unhandled rejection. A long note is refused (the pre-r4 behaviour); a short note still writes the right block.
- J5: the form is "closed" (no Save) before the rebase resolves, with `cachedRead` rejecting: no unhandled rejection, no leak (the WeakMap is keyed by the pin).
- J8: a card that is not in an embed: 0 `cachedRead` calls and the pin is untouched.
- J9: a full-note embed whose note changed since: no rebase, and Save maps and lands.
- Save before the rebase resolves: it is awaited. R2 (no await) fails tests 1–3.

### INFO-2: embed shapes
- Hover popover of a heading link (measured, `lc-r5hov.log`): the card's container sits under `.popover.hover-popover > .markdown-embed`, and the pin is rebased from `{lines: 9, lineStart: 1}` to `{lines: 1213, lineStart: 604}`.
- Nested embeds and canvas file nodes were not measured. Both sit under `.markdown-embed`, so the `closest` gate covers them by construction.

### INFO-3: side effects of the r4 change
- Every pinned Save now has one extra microtask (`await undefined` when no rebase is pending). This is benign.
- Card writes in an embed also start a rebase at their first click (`notePersistIntent` → `pinPosition`), and nobody awaits it. If it finishes before the 400 ms write, the card's pin is a whole-note pin, which is better than before. If not, the pre-r4 behaviour applies.

## Checks asked in the brief

1. **HIGH-1:** fixed in Reading view and Live Preview (X-R5EMB rows 1–2, and G-S64 (x)/(y) green in part 3). The races are covered in INFO-1 and the shapes in INFO-2. One race is not fine: MEDIUM-1.
2. **Block embeds:** a long note on both sides saves in Reading view and Live Preview, with the id on the next line or as its own paragraph. An outside edit of the block keeps the outside change: `values ["9"]`, nothing written, and the form closes with the embed's redraw, as in (z). With a twin elsewhere: MEDIUM-2.
3. **Scott's ruling in embeds:** test (3) is not vacuous. R1 (no rebase) and R2 (no await) both fail it, and it writes into the twin without the fix. In real Obsidian an outside edit closes the form ((z), and the block-embed outside-edit row), and nothing is written.
4. **LOW-1 (r3):** M7 and M8 are now killed (1 failed each). All 14 mutations are in the table below.
5. **Docs:**
   - `lineMap.ts:12-26` and the `pinnedTarget` doc (`:816-826`) now describe the adjacent-twin behaviour correctly (upper form → the surviving block, lower → refused) and the rebase.
   - Both CHANGELOG bullets are accurate apart from LOW-1.
   - `sc556-dse-verify-proposal.md` is refreshed: the footgun 1 card-only rule, phases (v)–(z), the mock `cachedRead` footgun and the load flakes.

## Mutations
`mutations.txt`; the 6 touched jest files; unmutated 329/329.

| Mutation | Failed tests |
|---|---|
| M1 pin-only for kept forms only | 6 |
| M2 rate limit back for form Saves | 4 |
| M3 force card writes too | 3 |
| M4 sidebar never forces | 1 |
| M5 notify ignores force | 5 |
| M6 forced Notice does not restart the clock | 1 |
| M7 unsavable not forced | **1 (killed now)** |
| M8 note-gone not forced | **1 (killed now)** |
| M9 `reported` not set on a drop | 9 |
| R1 no rebase | 3 (embed tests 1, 2, 3) |
| R2 no await | 3 (1, 2, 3) |
| R3 take the first of two identical sections | 1 (test 6) |
| R4 keep the trailing blank lines | **0 (survives, LOW-2)** |
| R5 no offset | 4 |

## Gates
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-review-r5/` (`$S`). Exit codes come from `gate.sh` (`<name>.rc`).

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0 | `$S/gate-tsc.log` |
| lint | rc 0 | `$S/gate-lint.log` |
| jest `--testTimeout=30000` | rc 0. `Test Suites: 1 skipped, 257 passed, 257 of 258 total` · `Tests: 2 skipped, 6514 passed, 6516 total` | `$S/gate-jest-t30.log` |
| touched jest files (6) | 329/329 | `$S/mut-UNMUTATED.log` |
| lifecycle part 3 | `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`. G-S64 (x) "Save landed in the embedded block (1220 lines in the note), the twin above and every other byte untouched, no Notice", (y) the same in Live Preview, (z) "the form closed with its embed's redraw" | `$S/gate-lc-part3.log` |
| e2e | not re-run, as briefed | — |

Probe artifacts:
- `$S/r5-probes.diff`: the jest probe file `r5-probe.test.ts` and the X-R5EMB / X-R5HOV scratch scenarios with their fixtures.
- `$S/probe-r5.log`, `$S/lc-r5emb-head.log`, `$S/lc-r5emb-base.log`, `$S/lc-r5hov.log`.
- `$S/mutations.txt`, `$S/mutate.py`, `$S/mutate-all.sh`.

Trees are as found: dse clean at 7095e3aa, superproject 2f946190 with ` M draw-steel-elements` as at start, and the scratch worktree removed.

# SC-687 decisions ledger — insert commands refuse inside an existing block / the properties

Effort: `sc687-insert-inside-block`. Worktree `/home/scott/code/steelCompendium/worktrees/sc687-insert-inside-block`,
plugin branch `sc687-insert-inside-block` cut from dse `develop` @ `aee83dc1`. Superproject base `6e2ff5de`.
Owner session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`. Concurrent effort: SC-690 (montage remove hero, other area).

## Scott's rulings (verbatim, dated)

### 2026-11-23 — the ticket itself (Scott created it; title + description)

Title: "DSE: an insert command run with the cursor inside an existing block breaks that block and turns the rest of the note into code"

> Put the cursor on a line inside an existing fenced block and run an insert command from the palette. The new block is written in the middle of the old one. The old block becomes an error card, the new block is not drawn, and everything below renders as code.
>
> Repro in real Obsidian (Live Preview):
>
> 1. A note with a `ds-stam` block that has an empty line in its body, then a blank line, then `after text`.
> 2. Cursor on the empty line inside the block.
> 3. Run "Insert Draw Steel: Counter" from the command palette.
>
> Result: the saved file has the `ds-ct` fence opening inside the `ds-stam` block. The stamina bar is an error card, no counter is drawn, and `after text` shows inside a code block. One undo restores the note.
>
> The compendium inserts (reference and snapshot) do the same. With the cursor in the note's properties (frontmatter), the insert writes a fence into the properties.
>
> Expected: an insert command does not write inside an existing fenced block or the properties. `/ds` already refuses there.

Ticket agent notes: `src/authoring/blockInsert.ts` `insertBlock` has no fence or frontmatter guard; callers `insert.ts`,
`compendiumInsert.ts` (reference and snapshot). SC-443 added the markers: three jsdom `test.failing`
(`test/dom/authoring/authoringKnownBugs.test.ts`, describe "SC-687: …") and one e2e `knownBug('SC-687', '[AUTH-I27] …')`
(`e2e/specs/authoring/insert-commands.e2e.ts`). Each asserts only `existingBlocksIntactProblem(before, after) === null`.

No comments on the ticket at dispatch (2026-11-24).

## Owner calls (ticket-owner, 2026-11-24 — not Scott rulings; Scott may overturn)

- **O1 — Refuse, do not move the block below.** The ticket's Expected says "does not write inside … `/ds` already refuses
  there". A refused command is never silent: it shows one Obsidian Notice. Nothing is written, the cursor and selection do
  not move, the undo history gets no entry.
- **O2 — Notice texts** (same sentence shape as the existing `CLOSED_EDITOR_NOTICE`):
  - inside a code block: `The cursor is inside another block, so nothing was inserted. Move it to a line outside the block and run the command again.`
  - inside the properties: `The cursor is inside the note's properties, so nothing was inserted. Move it below the properties and run the command again.`
- **O3 — One guard at the one write place.** `insertBlock` (blockInsert.ts) is the single place every authoring insert
  writes; the guard lives there, so the element commands, the compendium reference, the compendium snapshot and the `/ds`
  pick are all covered at write time. The two compendium commands ALSO check when the command starts, before the search
  list opens (the user must not search, pick, and only then be refused). At most one Notice per refused action.
- **O4 — What "inside" means** (by what the write would do, not by line number alone):
  - a line between a fence's opening and closing line: inside. Any language (not only `ds-*`), backtick or tilde, any
    fence length, callout / quote-prefixed fences, and fences indented under a list item (the shapes the insert command
    itself writes since SC-675: 2, 3, 4, 6… spaces). An unclosed fence runs to the end of the note.
  - the opening line: inside when the cursor is after the start of the fence marker (the block would start on the next
    line, in the body). Before the marker (line start / the line's own prefix): allowed, the new block lands above.
  - the closing line: inside unless the cursor is at the end of the line (after the marker and trailing whitespace):
    there the new block lands below, allowed.
  - the properties: line 0 `---` through the closing `---`, same end-of-closing-line exception. What counts as
    properties is what Obsidian treats as properties (measure in real Obsidian; an unclosed `---` block, a `---` rule
    lower in the note are not properties).
  - a selection: refused when EITHER end is inside. A selection whose two ends are both outside is written as today.
- **O5 — Scope boundary with SC-676 (Backlog, not this effort).** SC-676 = the `/ds` suggestion list still OFFERS itself
  in three places (list-indented block, properties, a fence's opening line) and the in-block key autocomplete does not see
  indented / quoted blocks. This effort does not change when either suggester triggers: `scanFenceState`'s results for its
  two existing consumers stay exactly as they are, and the three `test.failing` SC-676 markers stay failing. The new
  position scan is written in `fenceScan.ts` (one home for fence scanning) so SC-676 can switch the suggesters onto it.
  Side effect accepted: a `/ds` pick in one of SC-676's blind spots is now refused at write time with the Notice instead
  of corrupting the note.
- **O6 — Out of scope:** SC-682 (`/ds` list picked row), SC-688, SC-676 as above. A whole block selected and replaced by
  an insert (both selection ends outside) is existing behaviour, untouched.
- **O7 — Gates.** Full tsc / lint / jest / lifecycle / e2e. Shots, freeze and parity carry (592, 280/280, 0/0/24) only
  if the built `styles.css` is byte-identical to a clean `aee83dc1` build and no CSS / DOM-rendering file changed;
  otherwise they run.

- **O8 (2026-11-24, after r1) — an unclosed `---` at line 0 is NOT refused.** r1 measured (Obsidian 1.14.4): the editor
  styles every line below an unclosed line-0 `---` as properties and Live Preview draws no block there; Reading view draws
  blocks there normally. r1 followed the editor and refused every insert in such a note. Owner call: revert to O4 as
  written. The guard exists to stop a write from damaging existing structure; below an unclosed `---` nothing is damaged,
  and a refusal covering a whole note is not a narrow false refusal (and it blocks a note that works in Reading view).
  Only a CLOSED line-0 `---` … `---` is properties for the guard. Fix round: one line in `propertiesOf` + its test rows,
  docs/comment statements kept true.
- **O9 (2026-11-24) — r1 blind spots ruled:** cursor between a closing marker and its trailing spaces is refused: accepted
  (narrow, safe). Insert at ch 0 in front of a quoted / list-indented opening fence splits the callout / ends the list:
  dropped, that is the SC-675 rule for any quoted or list line at ch 0, not a block-damage case. Shift inline link refused
  with the rest of the reference command when the cursor is in a block: accepted. HTML blocks, `$$` math, `%%` comments
  not treated as structure: dropped, the ticket is fenced blocks and the properties. Multiple cursors: reviewer to probe.

## Round log

- r1 implementer — dispatched 2026-11-24.
- r1 implementer — DONE_WITH_CONCERNS. Plugin head `907d9c85`, superproject `9f79effa`. jest 14604 / 2 skipped (+166),
  lifecycle 64/64, e2e `803/813 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`, styles.css identical to base
  (carry 592 / 280 / 0-0-24). New e2e AUTH-I28..I35. Report `sc687-r1-impl-report.md`. Owner eyeballed
  `evidence/sc687-before.png` and `evidence/sc687-after.png`: both show what they claim.
- r2 reviewer — dispatched 2026-11-24 on `907d9c85`.
- r2 reviewer — FIX-REQUIRED on `907d9c85`: HIGH 2 (one cause, `fenceScan.ts:174` lazy continuation across a fence line),
  MEDIUM 2, LOW 1, INFO 4. Gates re-run and matched (jest 14604 / 2, e2e 803/813 ok 0 failed 10 known-bug 476/476,
  styles.css hash identical). Report `sc687-r2-review-report.md`. O8 measurement confirmed; reviewer sees no reason
  against the revert.

## Owner rulings on r2 findings (2026-11-24)

- HIGH-1, HIGH-2: fix (r3).
- MEDIUM-1 (several cursors, one inside a block): fix in r3 — refuse when ANY selection range has an end inside.
  The wider multi-cursor defect (the plan is computed for the main cursor's line and written at every cursor; same on
  base) is **filed as SC-692 (Backlog)** and is OUT OF SCOPE for r3.
- MEDIUM-2 (unquoted line inside a quoted fence): fix in r3, with a real-Obsidian measurement of what ends a quoted fence.
- LOW-1 (a refused `/ds` pick leaves the list open, each Enter another Notice): fold into r3 (`suggest.ts` pick path
  only; onTrigger untouched, O5 holds).
- O8 revert: r3, including `.repo-docs/architecture.md` and the `propertiesOf` comment.
- INFO-2..4: no action.
- r3 fix round — implementer resumed 2026-11-24.
- r3 fix — DONE. Plugin head `fe0b5bab`, superproject `754d46b0`; origin/develop still `aee83dc1`. jest 14643 / 2
  skipped (+39), e2e `809/819 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`, lifecycle 64/64 carried (delta is
  src/authoring + tests + docs), styles.css hash unchanged. New e2e AUTH-I36..I41. HIGH-1/2 `d3a9619f`, MEDIUM-2
  `6866cbcc`, MEDIUM-1 + LOW-1 `67e86de5`, O8 `136d6615`, docs `d06ae333`. Report `sc687-r3-fix-report.md`.
- r4 scoped re-review — reviewer resumed 2026-11-24 on `fe0b5bab`.
- r4 re-review — FIX-REQUIRED on `fe0b5bab`: all five r2 findings closed, O8 done, O5 holds, SC-692 untouched; gates
  matched (jest 14643 / 2; e2e second full run `809/819 ok, 0 failed, 10 known-bug, 476/476`; first run had SET-X03 /
  SET-X04 red, the SC-657 settings flake, 2/2 alone). NEW-HIGH-1 (`fenceScan.ts:193` tab columns on the fence line vs
  `listItemOf`), NEW-LOW-1 (`fenceScan.ts:175` shallower quoted fence line). Report `sc687-r4-rereview-report.md`.

## Owner rulings on r4 findings (2026-11-24)

- NEW-HIGH-1: fix (r5).
- NEW-LOW-1: fold into r5 (same function, a missed write into a block, small).
- INFO-1: no action (scan matches Obsidian's lazy continuation).
- INFO-2 (Live Preview draws a hand-written TAB-indented ds block under a nested item as an error card, Reading view
  draws it): dropped. Known and stated in `blockInsert.ts`'s header ("Tabs are not allowed as indentation"), it is why
  the insert writes spaces; YAML itself forbids tab indentation. Not a ticket.
- SET-X03 / SET-X04 red once in the reviewer's first full e2e run: the SC-657 flake named in `e2e/README.md`; no action.
- r5 fix round — implementer resumed 2026-11-24.
- r5 fix — DONE. Plugin head `bb3a3d10` (`1aaa8e70` NEW-HIGH-1, `0b2b967e` NEW-LOW-1, `af63569d`, docs `bb3a3d10`),
  superproject `754d46b0` unchanged; origin/develop still `aee83dc1`. jest 14674 / 2 skipped (+31), e2e
  `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` (+AUTH-I42), lifecycle carried, styles.css hash
  unchanged. NOTE: the implementer did NOT apply the reviewer's prescribed mechanism for NEW-HIGH-1 (2 columns per tab
  on the fence line); it measured that Obsidian reads a fence line's indentation by CommonMark tab stops and added a
  separate `readColumn` to `listItemOf`. r6 must verify that measurement. Report `sc687-r5-fix-report.md`.
- r6 scoped re-review — reviewer resumed 2026-11-24 on `bb3a3d10`.
- r6 re-review — LAND-READY on `bb3a3d10`. NEW-HIGH-1 and NEW-LOW-1 closed; the implementer's tab measurement is
  right (23 notes measured, CommonMark tab stops on the fence line); gates re-run and matched (jest 14674 / 2; e2e
  `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs`; styles.css hash unchanged); `scanFenceState` identical
  to base on 91 notes; `planBlockInsert` byte-identical to base on 29 prefixes. Report `sc687-r6-rereview-report.md`.

## Owner rulings on r6 findings (2026-11-24)

- NEW-LOW-1 (r6) — `- a⏎\t  ```ds-ct…` (a tab then two spaces under a bullet): Reading view draws a block, Live Preview
  does not, the scan says outside, so an insert there writes inside. **Dropped from this effort, recorded as a known
  gap** (option b). Reason: hand-typed mixed tab+space indentation, one view only, and neither tab rule explains how
  Reading view reads the line; option (a) is a guess that also refuses three notes Obsidian does not draw as blocks.
  Noted on SC-676 (the guard's blind-spot ticket) in the owner's comment there.
- INFO-1 (narrow false refusal for two spaces then a tab): accepted.
- INFO-2 (views disagree on a note already broken in Reading view): no action.
- INFO-3 (insert on a line indented with two tabs under a top-level bullet writes 8 spaces, text in Reading view; same
  on base): dropped — it is SC-675's known leftover "the cursor on an empty line indented with two or more tabs",
  already noted on SC-461 by the SC-675 owner.
- r7 final gates — lifecycle on the final head `bb3a3d10` (the r1 run was at `907d9c85`; the lifecycle harness drives
  authoring paths, and lifecycle is required to land). Implementer resumed 2026-11-24.
- r7 final gates — lifecycle on `bb3a3d10`: 64/64 (21+16+9+4+7+4+3), every part rc=0, no reds. Logs
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc687-impl-r7/r7-lc-part{1..7}.log`.

## LAND-READY (2026-11-24)

- dse `sc687-insert-inside-block` @ `bb3a3d10` on `develop` @ `aee83dc1` (17 commits, no rebase needed at report time).
- Superproject `sc687-insert-inside-block` @ `754d46b0` on `main` @ `6e2ff5de` (CHANGELOG only; pointer bump for landing).
- Gates at the final head: tsc (incl. `tsc -p e2e`) and lint clean · jest 14674 passed / 2 skipped (fresh worktree, no
  shots cache; +236) · lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 810/820 ok, 0 failed, 10 known-bug, coverage: 476/476
  pairs` (implementer and reviewer each ran it in full) · styles.css sha256 identical to a clean `aee83dc1` build
  (`18730938…f7a7f1f9`): shots 592, freeze 280/280, parity 0/0/24 carry. No freeze rebaseline.
- e2e known-bug 11 -> 10: `AUTH-I27` (SC-687) is a plain test. New e2e AUTH-I28..I42 (15), no new coverage pair. The
  three jsdom SC-687 `test.failing` markers are plain tests. SC-676 markers untouched.
- Posted: SC-687 land-ready comment (2 images), state In Progress + `Needs Review` (ask: message wording / refuse vs
  move-below; nothing blocks landing). SC-676 note posted. Filed SC-692 (Backlog, multi-cursor insert layout).
- For the dispatcher at landing: update `dse-verify` CURRENT with the numbers above; copy this ledger dir to
  `docs/superpowers/dse-overhaul/build-ledgers/` before `just wt-rm`.

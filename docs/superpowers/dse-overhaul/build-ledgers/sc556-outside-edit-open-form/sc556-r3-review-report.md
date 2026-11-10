# SC-556 r3 independent review: dse 92288b73, superproject 789bf152

**Verdict: FIX FIRST.** Findings: 0 CRITICAL, 1 HIGH, 0 MEDIUM, 4 LOW, 3 INFO.
- HIGH-1 (measured in real Obsidian 1.15.1): a block edit form on a card inside a **heading embed** (`![[note#Heading]]`) can never save when the source note has more than about 400 lines outside the embedded section. Every Save shows "the block changed on disk first", although nothing changed. Base 6270e84a saves it. The cause is that Obsidian gives an embedded section only that section's text, with line numbers relative to it. The pin is mapped against the whole note, and the 400-edit limit refuses it.
- The ruling holds everywhere else I probed. Own block edited or deleted gives no write, exactly one Notice per Save (2nd and 3rd Saves too), the form stays open, and the outside change is kept. A user-deleted block is not regenerated. G-S64 (v) and (w) fail on the base bundle for the right reason: the edit lands in the twin and the form closes.
- Tests are not vacuous. Branch tests run against base src: 10 fail. Against r1 src (a4900dca): 5 fail. Mutations M1-M6 and M9 are all caught. M7 and M8 (the forced "unsavable" Notice in the Reading-view host) survive (LOW-1).
- Gates: tsc and lint clean. jest t30: 6506 passed / 2 skipped / 257 of 258 (fresh worktree). Lifecycle part 3: 9/9. Part 1: 21/21. e2e: 128/128, 89/89. styles.css sha256 16e9aa64… equals a 6270e84a build, so shots, freeze and parity carry.
- The working tree is exactly as found: dse clean at 92288b73, superproject ` M draw-steel-elements` as at start, scratch worktree removed.

## Findings

### HIGH-1: a form inside a heading embed of a long note can never save (false "changed on disk first")
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:770` (`pinPosition` pins `section.text`), `:783-784` (`pinnedTarget` → `mapLine(pin.text, content, pin.lineStart)`), `:859` (pin-only → `'miss'`). Also `src/authoring/FormModal.ts:544` (every pinned Save is now pin-only) and `src/framework/host/lineMap.ts:16` (`LINE_MAP_MAX_EDITS = 400`).
- **Scenario:** a session note embeds `![[Encounter prep#Initiative]]`. The prep note has ~300 paragraphs above and below that heading. The user opens the tracker's edit form from the embed, changes a value and presses Save. Nothing changed on disk. Save writes nothing and says "a change to a block in Encounter prep was not saved — the block changed on disk first". It does the same on every retry. The only way out is to open the source note itself.
- **Measured (real Obsidian 1.15.1, scratch lifecycle scenario X-R3EMB):** logs are `lc-emb-head2.log` (HEAD build) and `lc-emb-base.log` (6270e84a bundle via `DSE_LIFECYCLE_BUNDLE`). Pin in a heading embed: `{"lines":10,"lineStart":2,"head":"## Tracker\n\n```ds-counter…"}`. That is the section's text, with the line number relative to it.

  | Case | HEAD 92288b73 | base 6270e84a |
  |---|---|---|
  | full-note embed, Reading view | wrote | wrote |
  | heading embed, 1,200-line source, Reading view | **form OPEN, wrote=false, 1 Notice** | wrote |
  | heading embed, small source, Reading view | wrote | wrote |
  | full-note embed, Live Preview | wrote | wrote |
  | heading embed, 1,200-line source, Live Preview | **form OPEN, wrote=false, 1 Notice** | wrote |

  The jest host probe agrees: a subsection pin with 500 filler lines on each side gives `ok=false notices=1`, and with 0 filler lines it writes (`probe-host-head.log`, E1).
- **Why:** `mapLine` counts every line of the note outside the embedded section as an insertion. With more than 400 of them, on both sides of the section, it returns null. On base the non-kept form then fell back to `resolveWriteTarget` → `locateByBody` and wrote. SC-556 removed that fallback for every form.
- **This contradicts the docs.** Both CHANGELOGs say the 400-line refusal happens only "if the note changed by more than about 400 lines around the block while the form was open". Here nothing changed. The scenario is outside the known cost the owner accepted.
- **Fix:** in `pinnedTarget`, before `mapLine`, handle a pin whose text is only part of the note. Find the pin's lines as one contiguous run in `content`. If the run appears exactly once, map to `offset + pin.lineStart` and then apply the existing fence and body checks. If not, fall back to `mapLine`. An alternative is to rebase the pin at open time when `section.text` is not the whole note. Add:
  - a jest host test: a subsection pin (relative `lineStart`) in a note with more than 400 lines on both sides must write the right block;
  - the same with an identical twin outside the embedded section, which must write the embedded one;
  - a G-S64 phase or a new lifecycle phase: a heading embed of a long note, form Save lands.

  Then correct the CHANGELOG limit sentence if any limit remains. Block embeds (`![[note#^id]]`) likely behave the same way. I did not measure them.

### LOW-1: the forced "unsavable" Notice in the Reading-view host is not pinned by any test
- **Where:** `ReadingModeBlockHost.ts:813` (note gone or renamed during a form Save) and `:923` (unplaceable).
- **Measured:** mutation M7 (`:923` force → false) and mutation M8 (`:813` force → false) both leave all 207 touched tests green (`mutations.txt`). The `force` parameter is unit-tested in `dropped-write-notice.test.ts`, but nothing checks that the host passes it.
- **Scenario:** the note is renamed by Sync while a kept-open form is open. A second Save within 5 s of the first "could not save" Notice then says nothing, which would go unnoticed if the force were lost.
- **Fix:** add a host test that makes two form Saves (no `fromView`) within 5 s on a renamed or deleted note. It must expect two `unsavableWriteMessage` Notices, and one for the same writes made with `fromView: true`.

### LOW-2: the F2 "known limit" comment states the wrong direction
- **Where:** `src/framework/host/lineMap.ts:21-23` and the `pinnedTarget` doc at `ReadingModeBlockHost.ts:~780`.
- **What the comment says:** "a form on a surviving twin can still place its pin".
- **Measured (jest, `probe-head.log`):** the setup is two twins separated only by a blank line.
  - Form on the **lower** twin, upper twin deleted (P1, P1b): the pin is refused and Save drops. The form's block survived and the Notice is false.
  - Form on the **upper** twin, upper twin deleted (P1c): the pin places onto the surviving lower twin and Save **writes the user's edit into the twin**. This is the SC-556 bug, still present in the identical-surroundings case.

  The owner ruled F2 DROP, and the note text really is the same either way. The comment, however, says the opposite of what happens. P1 is also a new false drop compared with base when the form's card stays on its own block (a Live Preview-like plan; base wrote the right block). P1b drops on both builds.
- **Fix:** rewrite the comment. Head-first line diffing puts the deletion at the lower twin. So a form on the upper twin writes into the surviving block (the result is the same either way), and a form on a lower twin is refused. Optionally add both as pinned tests.

### LOW-3: the CHANGELOGs over-claim slightly and state the limit incompletely
- **Where:** workspace `CHANGELOG.md:11-19` and the dse `CHANGELOG.md:25-33`.
- **The problems:**
  - "no longer writes your edit into an identical block" is false for the identical-surroundings case (LOW-2, P1c).
  - The 400-line sentence misses HIGH-1, where no change at all is needed.
- **Fix:** after HIGH-1 is fixed, keep the 400-line sentence only if it is still true. Add one clause: "blocks that are identical and separated only by blank lines can't be told apart".

### LOW-4: the dse-verify proposal is stale after r2
- **Where:** `sc556-dse-verify-proposal.md:21` (footgun 1) and `:29` (CURRENT block).
- **The problems:**
  - Footgun 1 says a dropped write's Notice is shown once per note per 5 s, so phases expecting the Notice need two notes. Since r2 a form Save's Notice is forced, so this applies only to card-write phases.
  - The CURRENT block points at r1 numbers. Measured now: jest 6506/2 on a fresh worktree (6507/1 expected on a cached one: 6492 + 15).
- **Fix:** reword footgun 1 to "card-write drops only" and refresh the numbers.

### INFO-1: an outside change to the fence line alone (e.g. a trailing space) now refuses Save
P5 (jest): `"```ds-counter "` → HEAD drops, base wrote. This is defensible, since the fence line is part of the block. A linter or formatter plugin that trims or pads fence lines while a form is open would trip it.

### INFO-2: no form path reaches `resolveWriteTarget` with a pin
- FormModal pins → pin-only always (`FormModal.ts:543-545`). The only pin-plus-fallback path is the view's own write (`pendingPin`, `fromView`), unchanged.
- Forms without a pin:
  - the sidebar panel (`SidebarBlockHost` has no `pinPosition`);
  - any Reading-view or Live Preview host whose `pinPosition()` is null: no section yet, or `findOwnFence` null, e.g. `locateInSection` returning `'ambiguous'` for callout twins with no readable ordinal. These keep the old unpinned path.
- `LivePreviewBlockHost` is a stub. ds-hero "Edit definition" goes through `openFormEditor` and is pinned.
- Embeds are pinned (HIGH-1).

### INFO-3: other false-drop and collateral probes (jest, HEAD = base unless noted)
- **Saves as before:** frontmatter edited (P6), CRLF note (C1, both CRLF and LF pin text: middle twin written, CRLF kept), the form's own card writing while the form is open (P11 and P12; the form's body then overwrites the +1, as on base), the other twin's card write plus a rebuild (P13).
- **Integrity:**
  - P8: own block edited → drop, then the outside edit reverted → the next Save writes. Base wrote into the twin on the first Save.
  - P9: own block deleted, Save ×2 → nothing regenerated. Base wrote into the twin.
- **Known limit, as documented:** 250 lines inserted above and 250 below (P2) → drop on HEAD, base wrote.
- **Notice behaviour:** the rate limit for card bursts is unchanged (M3 caught). Never two Notices per Save in these paths. `reported` prevents FormModal's own Notice (M9 caught, 9 tests red). The SC-455 "couldn't save — the block may have moved" Notice is still reachable (`canPersist` false), unchanged.

## Red-on-base and mutation evidence
All runs used the 5 touched jest files with the review probes excluded (`-t '^(?!.*PROBE)'`).

**Red on base** (`redbase.txt`):
- `src@6270e84a`: 10 failed / 197 passed. These are the r1 five (formModal ×2, twin-reuse a/b/c) and the r2 five.
- `src@a4900dca`: 5 failed (the r2 tests).

**G-S64 on the 6270e84a bundle** (`lc-gs64-base.log`): only (v) and (w) FAIL, and every other phase passes.
- (v): "the form is closed", lower twin `name: Edited`.
- (w): "the form is closed", the surviving block `name: Edited`.

**Mutations** (`mutations.txt`; unmutated: 207 passed):

| Mutation | Result |
|---|---|
| M1 pin-only for kept forms only | 6 failed |
| M2 rate limit back for form Saves | 3 failed |
| M3 force card writes too | 2 failed |
| M4 sidebar never forces | 1 failed |
| M5 notify ignores force | 5 failed |
| M6 forced Notice does not restart the clock | 1 failed |
| M7 unsavable not forced (host `:923`) | **0 failed** (LOW-1) |
| M8 note-gone not forced (host `:813`) | **0 failed** (LOW-1) |
| M9 `reported` not set on a drop | 9 failed |

## Gate summary
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-review-r3/` (`$S` below). Exit codes come from a script file (`gate.sh` writes `<name>.rc`).

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0 | `$S/gate-tsc.log` |
| lint | rc 0 | `$S/gate-lint.log` |
| jest `--testTimeout=30000` | rc 0. `Test Suites: 1 skipped, 257 passed, 257 of 258 total` · `Tests: 2 skipped, 6506 passed, 6508 total` (fresh worktree: 6491/2 + 15 new) | `$S/gate-jest-t30.log` |
| lifecycle part 3 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`) | `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`; G-S64 (v) "card on block 2", (w) "card on block 1", wrote nothing, one Notice, form open | `$S/gate-lc-part3.log` |
| lifecycle part 1 (21 ids) | `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed` | `$S/gate-lc-part1.log` |
| e2e | `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`, pointer parked, rc 0 (no RECOV-R07 flake this run) | `$S/gate-e2e.log` |
| styles.css | sha256 `16e9aa6428b370651d9e96b522e4cc95b5e59183d5383f93bb34808628efde04` in both the HEAD build and the clean 6270e84a build (`$S/base-src/styles.css`). `git diff 6270e84a -- styles-source.css assets` is empty. Shots 592, freeze 280/280 and parity 0/0/24 carry | — |
| G-S59 | not run (SC-561, as briefed) | — |

Probe artifacts: `$S/r3-probes.diff` (the scratch jest probes and the X-R3EMB scenario), `$S/probe-head.log`, `$S/probe-base.log`, `$S/probe-host-head.log`, `$S/probe-host-base.log`, `$S/lc-emb-head2.log`, `$S/lc-emb-base.log`, `$S/lc-gs64-base.log`, `$S/redbase.txt`, `$S/mutations.txt`, `$S/mutate.py`.

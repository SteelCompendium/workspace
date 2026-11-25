# SC-690 r2 independent review: "Remove a hero" on the montage tracker

**Executive summary**
- **Verdict: FIX-REQUIRED.** One real blocker: the required e2e gate is red (coverage gate). The rest of the work holds up under probing.
- Findings: CRITICAL 0 · HIGH 1 · MED 1 · LOW 4 · INFO 9.
- HIGH-1: `npm run e2e` (full) at `43574bfe` prints `815/826 ok, 0 failed, 11 known-bug, coverage: 485/485 pairs` and then `coverage gate FAILED: montage.remove-hero.hero x press:Escape (MONT-D05)`, **exit 1**. The implementer's own log shows the same exit 1, but the report and the ledger give the gate as green. Fix is one manifest line. I checked it in a scratch clone: `815/826 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, exit 0.
- MED-1: O3's rule "entries are matched the way the board matches them" has no test. A mutant that matches entries trimmed and case-insensitive survives all 186 tests in the three SC-690 suites.
- Gates I ran: tsc + `tsc -p e2e` + lint clean · jest **14471 passed / 1 skipped** (matches the implementer) · e2e full as above (exit 1) · shots 592 ok, exit 0 · freeze **280/280, 0 FAILED**. I did not re-run lifecycle (64/64) or parity (0/0/24): the diff gives no reason, and I read both from the implementer's logs.
- File integrity, checked in real Obsidian with my own notes: text outside the block, a text fence that contains a fake ```` ```ds-montage ````, a second block and an identical twin all stay byte-identical. Bare and malformed roster items stay in place. Quoted names (`"Kira: the Bold"`, `"Ash #2"`, `" Spacey "`, `"7"`, an emoji name, a 60-character name) all work. Near-miss entries (`kira: the bold`) stay. The tally moves by exactly the removed hero's contribution.
- Judgment calls 1–5: I agree with all five. Call 2 has a LOW side-effect (LOW-1), and call 4 has an INFO follow-up.

---

## Findings

### HIGH-1: the e2e coverage gate fails (exit 1), and the r1 report calls it green
- **Where:** `e2e/manifest/montage-remove-hero-modal.ts:14`. The row is `'montage.remove-hero.hero': c(['click', 'press:Enter'], ['D02', 'D03', 'D06'])`.
- **Failure:** `[MONT-D05]` (`e2e/specs/montage/remove-hero-modal.e2e.ts:97`) does `dse.press('Escape', first)` on a hero chip. That drives `montage.remove-hero.hero x press:Escape`, which no manifest declares. A full run fails the coverage gate after a clean test tally:
  ```
  OBSIDIAN-E2E done: 815/826 ok, 0 failed, 11 known-bug, coverage: 485/485 pairs
  OBSIDIAN-E2E coverage gate FAILED: 1 driven pair(s) are in no manifest:
    montage.remove-hero.hero x press:Escape (MONT-D05)
  e2e exit 1
  ```
  I reproduced this at `43574bfe`: `.../sc690-review-r2/r2-e2e-full.log`. The implementer's copied log `sc690-r1-logs/e2e-full.log` ends with the same three lines. The r1 report, and the ledger's round log after it, quote only the `done:` line. The CI `e2e` job runs the full suite, so every push and PR would go red.
- **Fix:** add the pair, as `montage-add-hero-modal.ts:13` already does for its field:
  `'montage.remove-hero.hero': c(['click', 'press:Enter', 'press:Escape'], ['D02', 'D03', 'D05', 'D06']),`
  I applied exactly this line in a scratch clone and ran the full suite: `OBSIDIAN-E2E done: 815/826 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, `e2e exit 0` (`.../sc690-review-r2/r2-e2e-full-manifestfix.log`). The expected numbers after the fix are therefore **486/486 pairs** (baseline 476, so +10, not the +9 the report gives).

### MED-1: no test pins O3's "match entries the way the board does" rule
- **Where:** `src/elements/montage/model.ts:747` and `:771` (`e.hero === name`), which mirror `BoardView.ts:539` (`entriesForHero`).
- **Failure:** I made both lines `e.hero.trim().toLowerCase() === name.trim().toLowerCase()` (mutant M5). All 186 tests in `test/unit/model/montage-remove-hero.test.ts`, `test/dom/elements/montage-remove-hero.test.ts` and `test/dom/elements/montage.test.ts` still pass. A refactor of this kind is plausible: the window's neighbour, `montageHeroNamed` (`model.ts:717`), matches trimmed and case-insensitive through `matchKey`. Under that mutant, removing "Kira" also deletes a hand-typed `hero: kira` or `hero: "Kira "` entry and its tally. The board never showed those entries in Kira's row. This is the deletion O3 forbids, and nothing would catch it.
- **Fix:** add a unit test with near-miss entries. Mine kills M5. The roster is Kira and Bram. The entries are `{Kira r1 success}`, `{kira r2 success}`, `{"Kira " r3 failure}`, `{" Kira" r1 success}` and `{Bram r1 assist}`. After the removal, `montageHeroRemoval(m,'Kira')` is `{actions:1}`, the entries left are `['kira','Kira ',' Kira','Bram']`, and the tally drops by exactly one success. The text is in `.../sc690-review-r2/probe-src/r2-probe.test.ts`, describe block "R2 near-miss entry names". As an option, export one predicate that both `BoardView.entriesForHero` and the removal use, so the two cannot drift apart.

### LOW-1: a duplicate name always removes the first roster item, whichever chip was pressed
- **Where:** `model.ts:763` (`list.findIndex(... item.name === name)`). `ConfigModals.ts` passes only the name.
- **Failure:** probe R2P-05 (`r2-dupes.md`) has Kira with `skills_used: [Nature]` first, then Kira with `[Climb]`. I pressed the **second** chip and then Remove. The note keeps `{name: Kira, skills_used: [Climb]}`, so the first item went. Both rows look the same on the board (skills show per cell), so the only effect is which `skills_used` list survives. That list feeds the skill-reuse warning. The impact is small, but the press did not do what it showed.
- **Fix:** give each chip its index among `montageRoster` and remove that item. Re-check on Remove that the item at that index still has the picked name, and treat a mismatch as the stale case (no write). Otherwise, say in the window that it removes the first hero of that name.

### LOW-2: the docs claim more than the write does, and name only the success limit
- **Where:** plugin `CHANGELOG.md:28-29`, superproject `CHANGELOG.md:14`, `docs/gm-trackers.md:116-118`.
- **Failure:**
  - "any keys you added to the block stay exactly as they were" (plugin) and "are left as they were" (superproject). In R2P-01 the removal moves the top-level unknown key `table_notes` below the known keys and drops its trailing `# comment`. The block's top comment also goes, and `title: 'Odd Names'` becomes `title: Odd Names`. Every montage write already did this (SC-625), so it is not new behaviour, but these new sentences promise "exactly".
  - "a montage that a success limit had finished can be live again" (both changelogs) and "had finished because of that hero's last success" (gm-trackers). A montage finished by the **failure** limit also comes back live. In R2P-11b, `failed.md` (failures 2 of 2) became live at Round 1 / 3 after Bram's failure went.
  - gm-trackers: "There is no undo, so Cancel (or Escape) leaves everything as it was" reads as if the second part followed from the first.
- **Fix:** say "are kept" instead of "stay exactly as they were". Say "that a success or failure limit had finished". Split the gm-trackers sentence: "There is no undo. Cancel (or Escape) closes the window and changes nothing."

### LOW-3: in a short window the consequence line scrolls out of view, and two scrollbars show
- **Where:** `ConfigModals.ts:104-108`. The line is built after the list, inside the scrolling `.dse-modal__body`.
- **Failure:** the implementer's own `evidence/sc690-D-window-12-heroes-short-viewport.png` (1440×620) has the long name picked and Remove fully visible. The line that names what goes is scrolled below Quill, out of sight. O4's case for "no Undo, no extra confirm" rests on the window naming what will be deleted before the press, and at that size it does not. The same capture shows two vertical scrollbars, one for the body and one for the modal. The zoom is `.../evidence-r2/impl-D-short-scrollbars-zoom.png`. A human reviewer would notice both. I could not regenerate a short window myself: the e2e driver's `setWindowSize` is unsupported in this Electron build (`p06-resize.txt`). At 1100px with 12 heroes the window is 531–547px tall and nothing scrolls (`p06-geometry-*.json`).
- **Fix:** put the line above the list, or in the footer row beside Cancel and Remove, so it is always on screen with Remove. Check whether the double scrollbar happens in other `DseModal`s at 620px. If it does, it is a shared tangent for the owner to file. If not, fix it here.

### LOW-4: screen readers may not announce the line on the first pick
- **Where:** `ConfigModals.ts:109-110` and `:140-141`. The `role="status"` region is `hidden` (display none) until the first pick, and its text is set while it is still hidden, before it is shown.
- **Failure:** a live region that enters the accessibility tree already holding its text is often not announced (Chromium with NVDA or JAWS). On the first pick a screen-reader user may not hear "Kira has 3 logged actions. They are removed too…". I inferred this from the code and did not run a screen reader.
- **Fix:** render the region from the start, empty and not hidden, so only its text changes. Alternatively, show it first and set the text on the next frame.

### INFO
1. **Judgment call 1 (an exact-name match takes hidden duplicate actions too): agree.** The stored tally counted the hidden duplicate when it was logged. Leaving it would bring it back under a later hero of the same name (D15). Probe: entries `sucess` r1, `success` r1 (hidden), `success` r5 (past `rounds: 2`) → `actions: 3`, successes 3→1, one per real success. Side note: the window's count ("3 logged actions") can be higher than the row's visible cells. That is acceptable for a hand-edited block.
2. **Judgment call 2 (a same-name twin keeps its entries and the tally): agree.** The remaining row shows those entries, so deleting them would remove what is still on the board. In R2P-05 the line reads "Another hero is also named Kira, so the logged actions stay with that row." See LOW-1 for which twin goes.
3. **Judgment call 3 (stale hero → silent close): agree.** In real Obsidian an outside edit closes the window first, with SC-650's Notice. R2P-13 renamed the picked Bram to Bramwell from outside: the window closed, one Notice appeared, and the note is exactly the outside edit. In the D16 removal case the guarded path (`view.ts:645`) is effectively unreachable, and mutant M7 shows the jsdom test pins it.
4. **Judgment call 4 (chips are Tab stops, not a radiogroup): acceptable for now.** The Tab order is chips → Cancel → wrap, and Remove joins once a hero is picked (R2P-08). Twelve heroes means up to 12 Tabs. An arrow-key radiogroup is a reasonable Backlog follow-up.
5. **Judgment call 5 (3-class selector): agree.** It is scoped to `.dse-mt__sheet-herochip`, which only this window uses, and it beats SC-203 section E's (0,2,0). A 60-character name wraps to 38px, short names stay 30px, labels are left-aligned and nothing clips (`p01-geometry.json`). Freeze is 280/280, so print is untouched.
6. **Owner calls, from the Director's side (for Scott):** O1, O2, O3 and O5 seem right. On O4, one small change would make the deliberate press carry the name itself: label the danger button "Remove Bram" instead of "Remove". That also covers LOW-3 and LOW-4 at once. On O3, the montage can quietly become live again. DONE (2/2) became Round 1 / 3, verdict "Total Failure" at 1/0, Log an action disabled because Kira already acted, End round enabled. That is consistent with Undo but easy to miss. The Notice could say "…; the montage is running again" when that happens. This is optional.
7. **Focus results (no defect):** a keyboard open puts focus on the first chip, with a ring. Enter on a chip only picks, and pressing it twice wrote nothing. Escape returns focus to the ⋯ item, with a ring. Keyboard Remove on a middle hero puts focus on the rebuilt item, with a ring. Keyboard Remove on the last hero puts it on Add a hero (F15). After a mouse open, Remove, Escape and Cancel all leave focus on Obsidian's `.markdown-preview-view` (Obsidian's own restore, not `<body>`). That matches the house rule that a mouse press pulls no focus in (SC-626). No window-level Enter handler exists (`managedModal.ts`).
8. **States after removal:** DONE (Bram's success removed) → live, bar `log:disabled, undo, end-round`. Undo then removes Kira's entry and the tally reaches 0/0. FAILED → live. EXHAUSTED → still Complete, with Undo/Back/Reopen/Clear all unchanged and Reopen still offered. `rounds`, both limits and `current_round` never moved, so SC-691 has not crept in.
9. **Other edge results:** Remove pressed twice in one tick gives 1 write, 1 Notice and 1 hero removed (R2P-12). With two panes, the other pane redraws without the hero (R2P-14). In an embed of `fresh.md` the item is offered and the write lands in `fresh.md`, with the embedding note untouched (R2P-15). The pinned sidebar copy offers the item, and Remove there writes the note; the Reading card and the sidebar both show `[Bram]` (R2P-17). `participants: Kira` (not a list) does not offer the item (R2P-07). Old-shape fixture: 4/2 is kept, not zeroed or re-typed (unit probe). `successes: "2"` stays quoted when nothing moved it, and becomes the plain `1` when it moved (R2P-01/02). Nits: the `e2eCensus.test.ts:470` describe title still says "its three modals". The manifest cites `D06` for `montage.remove-hero.cancel`, but D06 never touches Cancel. Mutant M16 (dropping `delete m.participants`) survives because it is equivalent: `serialize` already omits an empty list.

---

## Mutation probes (scratch clone, `git worktree add` at `43574bfe`, never the branch)
I ran the three SC-690 suites against each mutant (`.../sc690-review-r2/r2-mutants.log`, per-mutant logs `r2-mut-*.log`):

| id | mutant | result |
|---|---|---|
| M1 | removal skips the entries (`model.ts:768`) | KILLED (9 fail) |
| M2 | removal skips the tally delta (`:771`) | KILLED (9 fail) |
| M3 | removes the last roster item | KILLED (5 fail) |
| M3b | removes the next roster item | KILLED (5 fail) |
| M4 | duplicate-name guard dropped (`:748`) | KILLED (2 fail) |
| M5 | entries matched trimmed / case-insensitive | **SURVIVED**; my probe kills it (MED-1) |
| M7 | view: no stale-hero guard | KILLED |
| M8 | chip never pressed | KILLED |
| M9 | Remove enabled before a pick | KILLED |
| M10 | focus fallback for the item dropped | KILLED |
| M11 | item offered with an empty roster | KILLED |
| M12 | SC-628: successes re-typed when nothing moved it | KILLED |
| M13 | line never singular | KILLED |
| M14 | no Notice | KILLED |
| M15 | roster match case-insensitive | KILLED |
| M16 | `delete m.participants` dropped | survived (equivalent) |

Apart from M5, the tests are not vacuous. The e2e specs read the note on disk (`dse.noteText`, and `blockOf` through `expectNoteBlock`), and the driver's untouched-fence invariant guards the other blocks. The manifest claims no pair that its scenario fails to perform, but it is missing one pair that a scenario does perform (HIGH-1). The implementer did not run the unit tests red first. The mutation results above make up for that, apart from M5.

## Gates (all at plugin `43574bfe`, worktree untouched)
- tsc + `tsc -p e2e`: exit 0. Lint: exit 0 (only the pre-existing `.eslintignore` warning).
- jest: `Tests: 1 skipped, 14471 passed, 14472 total`, exit 0.
- e2e full: `OBSIDIAN-E2E done: 815/826 ok, 0 failed, 11 known-bug, coverage: 485/485 pairs`, then **coverage gate FAILED**, **exit 1**.
- e2e full with the HIGH-1 manifest fix (scratch clone): `815/826 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, exit 0.
- Shots: 592 `ok`, exit 0, including the `MontageRemoveHeroModal` modal host-leak sweep. Freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`, exit 0. I ran both because the diff changes CSS and modal DOM.
- Lifecycle 64/64 (seven parts, at `13cf641a`) and parity `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, read from `sc690-r1-logs/`. Not re-run, because the only later commit is modal CSS and no lifecycle scenario opens this window.
- Probe e2e (my 20 scenarios R2P-01…17, scratch clone): `20/20 ok, 0 failed`.

## Evidence audit
- The implementer's B2 (`sc690-B2-window-picked.png`) shows what its name says. My own capture (`p16-mid-bram-picked-modal.png`, MID, 4 heroes) shows the same window. The picked chip has a check, bold text and an accent border, so a colorblind reader can see the pick without the colour. The line is singular for one action. The capture shows no clipping or misalignment. The A annotated crop's labels are the implementer's annotations, as its report says. C before/after shows 5→4 heroes and the bars 5/2→4/1, as claimed. D short viewport: see LOW-3. Its file name does not mention that the line is out of view, and it shows two scrollbars.

## Artifacts
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc690-montage-remove-hero/sc690-r2-review-report.md`
- Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc690-review-r2/` (`r2-e2e-full.log`, `r2-e2e-full-manifestfix.log`, `r2-jest-full.log`, `r2-tsc.log`, `r2-tsc-e2e.log`, `r2-lint.log`, `r2-shots.log`, `r2-freeze.log`, `r2-probe-e2e-2.log`, `r2-probe-unit.log`, `r2-mutants.log`, `r2-mut-*.log`, `r2-mut-M5-probe.log`)
- Probe sources: `.../sc690-review-r2/probe-src/` (`r2-probe.e2e.ts`, `r2-probe.test.ts`, `r2-odd.md`, `r2-dupes.md`, `r2-embed.md`)
- Probe evidence (PNGs, before/after notes, JSON): `.../sc690-review-r2/evidence-r2/`

# SC-690 decisions ledger — a way to remove a hero in a montage test

Effort: `sc690-montage-remove-hero` · worktree `/home/scott/code/steelCompendium/worktrees/sc690-montage-remove-hero`
· dse branch `sc690-montage-remove-hero` cut from `develop` @ `aee83dc1` · workspace `origin/main` @ `04005f1f`.

Workers: read THIS file, never the tracker.

## Scott rulings (verbatim, dated)

### 2026-11-23 — ticket title + description (the whole spec)

Title: "to add a way to remove a Hero in montage test"

> request from an rc user.

No comments on the ticket as of 2026-11-24. Project: DSE 7.0.0.

### Earlier Scott rulings that bear on the design (quoted from the code that records them)

- SC-132 (`src/framework/kit/undoNotice.ts` header): "I dont want a missclick to be super punishing though."
  The recorded reasoning there: a confirmation dialog in FRONT of a one-click edit taxes the correct
  clicks; an escape hatch BEHIND it costs them nothing.
- SC-334 (`src/elements/montage/LogActionModal.ts` header): "remove the ability to change the hero and
  round. Those values should be determined when [the sheet opens] ... the behavior to change the hero
  and round in the modal is confusing and not needed." (About the Log an action sheet, which a cell opens.)

## Owner calls (ticket-owner, not Scott — each is reported to Scott in the review ask)

### 2026-11-24 — O1: the control is a ⋯ menu item, "Remove a hero", next to "Add a hero"

The montage's ⋯ menu already holds the Director's setup actions (Add a round, Add a hero, Set limits…,
Reset progress). Removing a hero is the same kind of action and a rare one, so it goes there, directly
after "Add a hero". Icon `user-minus`, control id `montage.chrome.remove-hero`.
No per-row remove button: a permanent delete icon on every row would sit next to the row's
"Log an action" plus, the most-used control on the board. (Alternative reported to Scott.)
Like every other menu item, it is not offered on a read-only host.
With no heroes on the board the item is not offered (or is shown disabled, only if the menu kit
already has a disabled state — do not add one for this).

### 2026-11-24 — O2: the item opens a small window that lists the heroes; pick one, press Remove

Title "Remove a hero". One option per roster hero (`montageRoster`, board order), nothing pre-selected.
Footer: Cancel (ghost) and Remove (disabled until a hero is picked). Same `DseModal` base and footer
shape as `MontageAddHeroModal`. Once a hero is picked the window says in one plain line what Remove
will do, e.g. "Kira has 3 logged actions. They are removed too, and the tally follows." /
"Bram has no logged actions." The window reads the LIVE model when it opens and again on Remove
(SC-627 / SC-650 pattern): a hero an outside edit removed while it is open is not removed twice and
the write does not fail.

### 2026-11-24 — O3: removing a hero removes that hero's logged actions too, and the tally follows

The roster item goes (with its `skills_used`), every entry the board shows in that hero's row goes, and
`successes` / `failures` drop by what those entries contributed (the same delta `removeMontageEntry`
applies — one path, not a hand-rolled recount). Reason: an entry whose hero has no row is invisible on
the board and cannot be edited, and the bar's Undo would then remove an action nobody can see.
Consequences, all accepted: a montage that was complete because a limit was reached can become live
again (same as Undo today); `current_round`, `rounds`, the limits, title and description do not change.
Integrity rules for the write:
- Only that one `participants` item is removed. Bare / malformed items in `participants:` (which the
  board skips) stay exactly as typed. Unknown keys elsewhere in the block stay.
- Hand-written duplicate names: if another roster hero with the same name is still on the board after
  the removal, that name still has a row, so its entries stay and the tally does not move.
- Entries are matched the same way the board matches them to a row (mirror `BoardView`'s own lookup).
- Tally scalars that do not move are not re-typed (SC-628: a typed `successes: "1"` stays as typed
  when nothing changes it).
- The last hero can be removed; the board then shows its existing empty state. What `participants:`
  looks like in the note afterwards follows the model's existing conventions (see how `entries`
  goes back to absent rather than `[]`, and what `e2e/vaults/shipped/Montage/empty.md` holds) — say
  in the report which shape was chosen and why.

### 2026-11-24 — O4: no Undo toast after Remove, no extra confirm

The window is already a deliberate second step (menu, pick, Remove) and names what will be deleted
before the press, so SC-132's "one misclick" case does not arise. A Notice confirms the removal in
plain words ("Removed Kira from the montage"), like Reset progress posts one. Reported to Scott.

### 2026-11-24 — O5: out of scope

- Limits by number of heroes is **SC-691**, queued next. Removing a hero does NOT touch
  `success_limit` / `failure_limit`.
- Renaming a hero. Not asked for.
- The v2 site. Plugin only.

## Deferred findings / follow-ups rulings

(none yet)

## Round log

- 2026-11-24: ticket set to Awaiting; worktree created.
- r1 implementer dispatched 2026-11-24 (brief: `sc690-brief-r1-impl.md`).
- r1 implementer DONE 2026-11-24: plugin `43574bfe` (5 commits on `aee83dc1`), superproject `0c6aec5f` (CHANGELOG only).
  Gates: tsc/lint clean · jest 14471/1 skipped (+32) · lifecycle 64/64 (at `13cf641a`; the later commit is modal CSS only) ·
  e2e 815/826, 0 failed, 11 known-bug, 485/485 pairs (+21 tests, +9 pairs) · shots 592 · freeze 280/280 · parity 0/0/24.
  New control ids: `montage.chrome.remove-hero`, `montage.remove-hero.{hero,cancel,submit}`. Report `sc690-r1-impl-report.md`; evidence in `evidence/`; logs in `sc690-r1-logs/`.
  `participants:` key is deleted when the last hero goes (matches `empty.md`); a skipped bare item keeps the key.
  Implementer's judgment calls 1-5 (exact-name entry match incl. hidden duplicate actions; same-name twin keeps entries; outside-removed hero = silent no-op close; chips are Tab stops; chip CSS fix) go to the r2 reviewer.
- Owner eyeballed `sc690-B2-window-picked.png`, `sc690-A-menu-panel-annotated.png`, `sc690-C-board-before-after.png`: coherent (picked hero has check + bold + border; Bram's row gone, totals 5/2 -> 4/1, head "4 heroes").
- r2 reviewer dispatched 2026-11-24 (brief: `sc690-brief-r2-review.md`), different identity from the implementer.
- r2 review DONE 2026-11-24 at `43574bfe`: **FIX-REQUIRED**, 0 CRIT / 1 HIGH / 1 MED / 4 LOW / 9 INFO. Report `sc690-r2-review-report.md`.
  Reviewer gates: tsc/lint rc 0 · jest 14471/1 skipped · full e2e **exit 1** (`coverage gate FAILED: montage.remove-hero.hero x press:Escape (MONT-D05)`) ·
  with the one-line manifest fix in a scratch clone: 815/826, 486/486 pairs, exit 0 · shots 592 · freeze 280/280.
  20 real-Obsidian integrity probes all passed; 16 mutants, 14 killed, 1 survivor (MED-1), 1 equivalent.
  CORRECTION to the r1 line above: the r1 e2e was NOT green — its own log ends with the coverage-gate failure; the r1 report quoted only the `done:` line.

## Deferred findings / follow-ups rulings (2026-11-24, owner)

- HIGH-1 (`e2e/manifest/montage-remove-hero-modal.ts:14`, undeclared pair `montage.remove-hero.hero x press:Escape`): **FIX in r3**. Expected pairs become 486/486.
- MED-1 (`model.ts:747,771`, no test pins exact-name entry matching; trim/case-insensitive mutant survives): **FIX in r3** (add the near-miss test).
- LOW-1 (`model.ts:763`, second same-name chip removes the first roster item): **FIX in r3** (pass the chip's roster index).
- LOW-2 (changelogs + `docs/gm-trackers.md:116-118` overclaim: keys "exactly as they were"; only the success limit named; "no undo, so Cancel" non-sequitur): **FIX in r3**.
- LOW-3 (`ConfigModals.ts:104-108`, 12 heroes in a short window: the what-will-be-removed line scrolls away, two scrollbars) and
  LOW-4 (`ConfigModals.ts:109-110,140-141`, `role=status` line hidden until first pick): **FIX in r3**, together with the reviewer's
  suggestion, adopted as owner call **O6: once a hero is picked the danger button reads "Remove <name>"** (plain "Remove", disabled, before a pick).
- INFO nits (`e2eCensus.test.ts:470` title says "three modals"; manifest cites D06 for Cancel though D06 never touches Cancel): **FIX in r3** (fold).
- INFO (the Notice could say a removal made the montage live again): **DROP** — the bar and the outcome band show the state at once; Undo reopens a montage just as quietly today.
- INFO / implementer follow-up (hero chips as an arrow-key radiogroup): **DROP** — the Result chips in the Log an action sheet are separate Tab stops too; changing that is a kit-wide pattern change, not this window, and rosters are about five heroes.
- Implementer follow-up (the ⋯ panel is icon-only, Add/Remove a hero are adjacent person icons): **DROP as a ticket** — existing menu design (every item is icon + tooltip); shown to Scott in the review image.
- INFO M16 (equivalent mutant on `delete m.participants`): no action.
- Reviewer agrees with all five implementer judgment calls: accepted as is (LOW-1 refines call 2's twin case).

- r3 fix round dispatched 2026-11-24: implementer resumed with the findings verbatim. Full battery at the final head. Scoped re-review of the delta goes to the r2 reviewer identity.
- r3 fix DONE 2026-11-24: plugin `a84fa7a5` (2 commits on `43574bfe`), superproject `980ac82c` (CHANGELOG only). All six findings + both nits + O6 fixed, each new test run red first.
  Gates at `a84fa7a5`: tsc/lint rc 0 · jest 14480/1 skipped (+41 over baseline 14439) · lifecycle 64/64 ·
  e2e `817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, exit 0, no `gate FAILED` line · shots 592 · freeze 280/280 · parity 0/0/24.
  Report `sc690-r3-fix-report.md`; logs `sc690-r3-logs/`; evidence B1, B2, D x2 overwritten.
- r4 scoped re-review dispatched 2026-11-24 to the r2 reviewer identity (brief: `sc690-brief-r4-rereview.md`).
- Owner eyeballed the r3 `sc690-B2-window-picked.png` ("Remove Bram" button) and `sc690-D-window-12-heroes-short-viewport.png` (line visible, one scrollbar, long name cut with an ellipsis in the button): good.
- 2026-11-24, dispatcher relay (mechanics, not a ruling): SC-687 landed; dse `origin/develop` is now `bb3a3d10` (was `aee83dc1`, 17 commits), workspace `origin/main` `61af335e`. SC-687 changed only the insert commands; `styles.css` byte-identical.
  New CURRENT baselines: jest 14674 passed / 2 skipped fresh (no shots cache) · lifecycle 64/64 · e2e `810/820 ok, 0 failed, 10 known-bug, coverage: 476/476 pairs` · shots 592 · freeze 280/280 · parity 0/0/24.
  Plan: r4 re-review finishes against `a84fa7a5` undisturbed (no rebase under a running reviewer), then r5 = rebase both branches onto `bb3a3d10` / `61af335e` + full battery, before land-ready.
- r4 scoped re-review DONE 2026-11-24 (r2 reviewer identity) at `a84fa7a5`: **LAND-READY**. All six r2 findings + both nits closed, O6 holds, 0 new findings above INFO.
  Reviewer gates at `a84fa7a5`: tsc/lint rc 0 · jest 14480/1 skipped · full e2e `817/828 ok, 0 failed, 11 known-bug, coverage: 486/486 pairs`, exit 0, no gate FAILED · shots 592 · freeze 280/280.
  9/9 delta mutants die (M5 included); r2 probe spec 20/20 at the new head. Report `sc690-r4-rereview-report.md`.
  - INFO-r4-1 (roster-place re-check compares names only; unreachable today because any outside edit closes the window): **FOLD into r5 as a one-line code comment** at the re-check, no behaviour change.
  - INFO-r4-2a (superproject `CHANGELOG.md:12` writes `**Remove <name>**` raw; GitHub may drop `<name>` as a tag): **FOLD into r5** (reword so no angle brackets; check the plugin CHANGELOG and docs for the same).
  - INFO-r4-2b ("Keys you added to the block are kept" does not cover the removed hero's own keys): **DROP** — the hero's item going is the feature; the sentence is about the block.
- r5 dispatched 2026-11-24: implementer resumed — rebase plugin onto `bb3a3d10`, superproject onto `61af335e`, the two folds, full battery.
  Expected after rebase: jest 14674+41 fresh / one more passed and 1 skipped with the shots cache · lifecycle 64/64 · e2e `833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs` · shots 592 · freeze 280/280 · parity 0/0/24.
- r5 rebase DONE 2026-11-24: plugin `a0e55f6b` on `bb3a3d10` (7 rebased commits + 1 comment-only fold), superproject `80b0934c` on `61af335e` (CHANGELOG only). Conflicts: both CHANGELOGs only, both sides kept.
  Owner verified mechanically: `range-diff` shows 6 of 7 commits `=`, commit 3 differs only in its CHANGELOG hunk; the fold is a 2-line comment in `model.ts`; both branches are fast-forwards; no attribution trailers. No further review round (code patch-identical to the re-reviewed `a84fa7a5`).
  Gates at `a0e55f6b`: tsc/lint rc 0 · jest 14716/1 skipped · lifecycle 64/64 · e2e `833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`, exit 0 · shots 592 · freeze 280/280 · parity 0/0/24.
  Report `sc690-r5-rebase-report.md`; logs `sc690-r5-logs/`.
- Comment 1 posted to SC-690 2026-11-24 (`sc690-comment-1.md`, 3 images): asks Scott to confirm the Remove a hero flow; reports O1 (menu item, not a per-row button) and O3 (logged actions go with the hero, totals follow) as the two calls he can reverse; O4/O5/O6 reported. Ticket **In Progress + Needs Review** (verified in the save response).
- LAND-READY reported to the dispatcher 2026-11-24: plugin `sc690-montage-remove-hero` @ `a0e55f6b` (ff of `develop` @ `bb3a3d10`), superproject @ `80b0934c` (ff of `origin/main` @ `61af335e`), submodule pointer uncommitted for `wt-finish`. No freeze rebaseline. New dse-verify CURRENT numbers for the dispatcher to record: jest 14716 / 1 skipped (with shots cache), lifecycle 64/64, e2e 833/843 ok, 0 failed, 10 known-bug, 486/486 pairs, shots 592, freeze 280/280, parity 0/0/24.
- On Scott's yes: ticket -> Done, remove `Needs Review`. If he reverses O1 or O3: new round on a fresh worktree from the then-current `develop`.

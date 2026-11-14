# SC-621 r4 — rebase onto 9b94baf2 + doc/harness fold (implementer B, resumed)

Context: re-read the common brief (now at baseline 9b94baf2) and the ledger section "owner rulings on r3" — that is your spec. r3 report:
sc621-r3-review-report.md (LOW-1..LOW-4 sections) in the ledger dir
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/. Workers never call the tracker.

## Task
1. **Rebase** dse branch (56ad4d1c) onto origin/develop `9b94baf2` (SC-613 landed: ConditionsModal keydown listener, conditions tests,
   e2e COND-N12..N15; no host/pin code — expect no conflict). Superproject branch: rebase onto current workspace `origin/main`
   (`git -C <worktree> fetch origin`); still ONE CHANGELOG commit, NO pointer commit.
2. **Fold r3 LOW-1..LOW-4 + owner note** (rulings quoted from the ledger):
   - LOW-1: "FOLD, docs only. ... Name it in plain words in the CHANGELOG, the `rebaseCardPin` comment and the skill proposal residual list
     (R3)." — the third still-written case: the ticket's shape combined with a very large outside change (several hundred lines added or
     removed at once, beyond the line-map's 400-edit cap); base writes the same.
   - LOW-2: "added or removed" (the OTHER identical counter removed with a line on one side edited is refused too).
   - LOW-3: "a preview of a note open in its own pane (SC-612)" -> "a note open in its own pane".
   - LOW-4: "delete the dead code" in G-S115: `GS115_C6`, `GS115_NOTE.twin`, the three unused edits and the `if (plus)` block
     (r3 cites obsidian-lifecycle.mjs:2477, :2482, :2492-2493, :2496, :2550-2565, :9177 at 56ad4d1c; re-find after rebase).
     G-S115 must still be 9 cells, (a)-(f) red on a base bundle is NOT re-proved (the cells are unchanged) — just green on yours.
   - Owner note: CHANGELOG "Because such a preview or embed is not redrawn by Obsidian" -> "is often not redrawn".
   Amend into the existing commits or add small fixup commits — your choice; keep history readable. No rule/code-logic change.
3. **Skill proposal** (`sc621-skill-proposal.md`): add residual R3, update CURRENT to 9b94baf2-based numbers you measure.
4. **Full battery** on the final head. Expected: tsc/lint clean; jest 11853 + 35 = **11888 passed / 2 skipped** (fresh, no shots cache;
   if `reading-mode-host-pin.test.ts:682` goes red under load — filed as SC-624, out of scope — re-run that suite alone and report both
   runs); lifecycle **64/64** in seven parts (part 7 `G-S108,G-S112,G-S115`); e2e **`338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`**;
   styles.css byte-identical to a clean 9b94baf2 build -> shots 592 / 163/978 / 40/240 / clip 147, freeze 280/280, parity 0/0/24 carry.
   Also produce `git range-diff 14521bf0..56ad4d1c 9b94baf2..<new head>` into the ledger dir.

## Report
`sc621-r4-fix-report.md` in the ledger dir (<=10-line exec summary: dse head + commit list, superproject sha + its origin/main base, every
gate number, range-diff summary). Logs `sc621-r4-gate-*.log`. Same footguns and return contract as before (common brief).

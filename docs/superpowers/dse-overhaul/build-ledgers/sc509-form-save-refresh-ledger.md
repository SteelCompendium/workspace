# SC-509 decisions ledger — Block edit form Save updates the note, but the card keeps showing the old content until the note is reopened

Owner: ticket-owner (Opus 5.5, posts with `--model opus-5.5`). Session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh (branch `sc509-form-save-refresh` in every submodule). Cut at dse develop 054c9c5, superproject a094db3.

## Ticket facts (from the description, 2026-10-23)
- Repro: block edit form (pencil, authoring controls on) on a `ds-montage` with `title: The Heist`; change to `title: Other Job`, Save. File reads `title: Other Job`; 3 s later the card still reads "The Heist". New content shows only after leaving the note and coming back.
- Expected: "the card redraws with the saved content right after Save."
- Suspected cause (not confirmed): view adoption treats the form's `cx.host.replaceSource` write as the view's own write and keeps the old model.
- Ticket asks: "A fix should add a real-Obsidian check (lifecycle or e2e) that saves from the form and reads the card."
- Origin: SC-493 review INFO-6 (docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml/sc493-r1-review-report.md).

## Dispatcher constraints (2026-10-23)
- SC-494 (FormModal collapsed: line) is in flight in src/authoring/FormModal.ts — prefer a fix outside FormModal; if FormModal must change, coordinate via rebase.
- Authoring controls are experimental.
- A new lifecycle scenario uses id G-S40.
- Owner reports land-ready to the dispatcher and stops; the dispatcher lands.

## Scott rulings
(none yet)

## Rounds
- 2026-10-23 r1 (diagnosis, reviewer A, agent abb0bbff5a200962d): dispatched, brief sc509-brief-r1-diagnose.md. No commits this round. Ticket Backlog -> Awaiting.
- 2026-10-24 ~01:31Z: owner + reviewer A killed by session-limit 429 (A's last text "Now the code."). After the reset, A was resumed via SendMessage with orders to check worktree/scratch/process state first. No commits expected.
- 2026-10-24 r1 DONE (A): root cause confirmed in real Obsidian 1.15.0 + jest. Every host write gets a claim ticket (ReadingModeBlockHost.ts:571), so the form's replaceSource (FormModal.ts:444) is adopted on rebuild (adoptView.ts:113-117) and the old model stays. Sidebar: lastWritten self-echo guard (SidebarBlockHost.ts:336/:438) swallows the form write. Stale: Reading view montage/counter/stamina, sidebar. Not affected: Live Preview. Hero "Edit definition" affected by construction (not measured). Only two replaceSource callers in src: view.ts:323, FormModal.ts:444 (owner grep). Throwaway option-A patch fixed all cases; 13 tests need a mechanical update. No commits; tree clean at 054c9c5; node_modules left in place.
- 2026-10-24 owner ruling: implement r1 option A (`replaceSource(body, { fromView })`, ticket/lastWritten only for view writes), FormModal and pipeline untouched. Live Preview claim-miss trace: DROP (the fix only removes tickets, so it is not needed). Hero edit-definition: add a jest case if cheap, else follow-up.
- 2026-10-24 r2 (impl, implementer B): dispatched, brief sc509-brief-r2-impl.md.
- 2026-10-24 dispatcher: dse develop 054c9c5 → 7046eb0 (SC-494 landed: FormModal.ts changed; `withReservedKeys` in src/framework/chrome/collapsedKey.ts now on every pipeline write-back). New baselines: jest 6026 / 1 skipped / 243 of 244, lifecycle 36/36, e2e 114/114 79/79, shots 592, freeze 280/280, parity 0/0/24. "Land-ready must be on 7046eb0 (or newer), with the superproject rebased onto origin/main." Sent B a mid-round rebase instruction (dse onto origin/develop 7046eb0, superproject onto origin/main, battery on rebased HEAD only).
- 2026-10-24 r2 DONE (B, agent af7aeaf377676641d): dse on 7046eb0: red dac643f, fix 731f3e1, G-S40 a426882; superproject CHANGELOG d93f8d3 on origin/main f007a2a. Red on 7046eb0: 5 fail; in-card adoption control green both sides. G-S40 red vs 054c9c5 bundle, also red vs reading-only half-fix (sidebar phase). FormModal.ts/pipeline.ts untouched (diff stat: 5 src files, 5 test files, lifecycle harness). Gates on a426882: tsc/lint rc 0; jest 6032 passed / 1 skipped (after shots), 244 of 245 suites; lifecycle 37/37; e2e 114/114, 0 known-bug, 79/79; shots 592, 0 FAIL (host-leak 113/678, modal 10/9/38/228); freeze 280/280; parity 0/0/24.
- 2026-10-24 owner rulings on r2 follow-ups:
  - FU1 hero "Edit definition" untested: FOLD into the r3 review as a real-Obsidian probe. Ticket only if it is broken.
  - FU2 dse-verify SKILL.md CURRENT/PREVIOUS (37/37, G-S40): dispatcher bookkeeping at landing; name it in the land-ready report.
  - FU3 lint does not cover visual-harness: DROP (it already does not, project-wide; node --check plus real runs cover this change).
  - FU4 sidebar phase uses the raw box only: DROP (the mechanism is the same for every element; jest covers the typed-field stamina bar in Reading view).
  - FU5 Live Preview claim miss: DROP (already ruled).
- 2026-10-24 r3 (independent review, reviewer C, fresh identity): dispatched, brief sc509-brief-r3-review.md.
- 2026-10-24 dispatcher: dse develop 7046eb0 → 38f94f4 (SC-500 landed: initiative control ids plus the e2e manifest; test-only). New baselines: jest 6027 / 1 skipped / 243 of 244, lifecycle 36/36, e2e 114/114 with coverage 82/82, shots 592, freeze 280/280, parity 0/0/24. "Land-ready must be on 38f94f4 (or newer), with the superproject rebased onto origin/main." Owner plan: let C finish the review on a426882 (SC-500 is test-only, so it does not touch the reviewed code). Then B rebases, folding in any fix round, onto 38f94f4 plus superproject origin/main and runs the full battery. A scoped range-diff check follows.
- 2026-10-24 r3 review DONE (C, agent aa293e4b237b78a2a): LAND-READY at a426882 on 7046eb0. 0 HIGH / 0 MEDIUM / 2 LOW / 8 INFO.
  - Red/green re-run: jest 5 red on 7046eb0; G-S40 red against a 7046eb0 bundle. All 9 mutants caught.
  - Real Obsidian: Reading montage/counter/stamina, twins, prefs+collapsed, hero Edit definition, sidebar, and Save-then-click all redraw on HEAD and are stale on base. Live Preview, scroll position, hand edits and an outside write are fine on both.
  - Battery at a426882 is green, the same as B's. One flaky timeout at `initiative-default-keys:459` passed on re-run (SC-506).
- 2026-10-24 owner rulings on r3:
  - LOW-1 (after Save, focus lands on `<body>`, where base returned it to the pencil; the redraw detaches the opener): FILED SC-518 (Backlog, Low, related SC-509/SC-404). Out of scope; the fix needs a focus handoff after the async re-mount. Name it in the land-ready comment.
  - LOW-2 (G-S40 does not check the note outside the block): FOLD into r4. G-S40 asserts the whole note equals the fixture with only the edited value changed (`t.read(rel) === FIXTURES[rel].replace(old, new)` or `t.integrity(rel).ok`), in both the Reading and the sidebar phase.
  - INFO-1 (a form opened inside the 400 ms debounce after an in-card click starts from the pre-click body, and Save reverts the click; also on base): FILED SC-519 (Backlog, Medium, related SC-509/SC-404). Out of scope.
  - INFO-2 (millisecond race, not reachable by a person): DROP.
  - INFO-3 (collapse is a session-only write) and INFO-4 (collapsed card has no pencil; same as base): DROP, by design.
  - INFO-5: rebase in r4.
  - INFO-6: dispatcher at landing (dse-verify CURRENT + G-S40).
  - INFO-7 (fixed sleeps for negative checks; base fails fast): DROP.
  - INFO-8 (hero case in G-S40, optional): DROP. Verified in real Obsidian by C.
- 2026-10-24 r4 (rebase onto 38f94f4 + LOW-2 fold, B resumed): dispatched, brief sc509-brief-r4-rebase.md. The scoped re-review of the G-S40 delta + range-diff goes to C (C did not author it).
- 2026-10-24 r4 DONE (B): rebased onto dse 38f94f4 / superproject origin/main 2bb85df.
  - dse commits: red c3cac7d, fix 80cd647, G-S40 4832950, LOW-2 85119e8 (HEAD). Superproject CHANGELOG a32bfa8.
  - Range-diff: the first three commits are `=`; 85119e8 is the only new commit.
  - Gates on 85119e8: tsc/lint rc 0; jest 6033 passed / 1 skipped, 244 of 245; lifecycle 37/37; e2e 114/114, 0 known-bug, 82/82; shots 592, 0 FAIL; freeze 280/280; parity 0/0/24.
- 2026-10-24 r5 scoped re-review of 85119e8 + range-diff (C resumed): dispatched.
- 2026-10-24 r5 scoped re-review DONE (C): LAND-READY at 85119e8 on 38f94f4 / superproject a32bfa8 on 2bb85df. Range-diff: the first three commits are `=`. 85119e8 is test-only. Mutants: mutR (Reading drops BELOW) and mutS (sidebar appends a stray line) both turn G-S40 red with the new harness, and the old harness passes both. G-S40 on HEAD passed 3 of 3. tsc and lint re-run rc 0. B's logs spot-checked: all post-rebase.
- 2026-10-24 dispatcher: dse develop 38f94f4 → a0365a4 (SC-505 landed: shared chrome keyboard focus for Collapse, Expand and Pin, plus new e2e). New baselines: jest 6052 / 1 skipped / 244 of 245, lifecycle 36/36, e2e 123/123 with 0 known-bug and 87/87, shots 592, freeze 280/280, parity 0/0/24. "Land-ready must be on a0365a4 (or newer), with the superproject rebased onto origin/main."
  - Owner check: no file overlap between SC-505 (38f94f4..a0365a4) and the SC-509 diff.
  - Semantic check: SC-505's Pin rebuild comes from `bindBlockToSidebar`, a vault write rather than `host.replaceSource`, so SC-509's `fromView` gating does not change it. Collapse is session-only. SC-505 dropped the adoptView focus claim (d4ad6c2).
  - The risk is low, and SC-505's own e2e (chrome-focus) gates it.
- 2026-10-24 r6 (B resumed): rebase onto a0365a4 plus superproject origin/main, then the full battery. Then the owner checks the range-diff; with no conflict and no `src/` change, no re-review is needed.
- 2026-10-24 r6 DONE (B): dse rebased onto a0365a4: 211f483 / ad163a4 / f1db21d / c2758a2 (HEAD). Superproject CHANGELOG f04f28c on origin/main 86bdd53 (CHANGELOG conflict, both bullets kept). Range-diff: all 4 commits `=` (owner verified). origin/develop is still a0365a4 and origin/main is still 86bdd53 (owner fetched). The dse tree is clean; the superproject shows only ` M draw-steel-elements` (unbumped pointer). Gates on c2758a2: tsc/lint rc 0; jest 6058 passed / 1 skipped, 245 of 246; lifecycle 37/37; e2e 123/123, 0 known-bug, 87/87 (SC-505 chrome-focus passed); shots 592, 0 FAIL; freeze 280/280; parity 0/0/24. No re-review needed: identical patches, no conflict in code.
- 2026-10-24: land-ready comment posted to SC-509 (before/after montage screenshots, owner-eyeballed; SC-518/SC-519 named; no ask). State stays Awaiting; landing is the dispatcher's. At landing the dispatcher updates dse-verify CURRENT (lifecycle 37/37, G-S40) and preserves this ledger to build-ledgers/.
- Identity plan: A = diagnosis; implementer B = fix; a fresh reviewer C (not A, not B) = independent review.

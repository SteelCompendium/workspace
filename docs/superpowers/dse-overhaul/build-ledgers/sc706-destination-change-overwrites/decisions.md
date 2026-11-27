# SC-706 decisions ledger

Ticket: SC-706 "After a first Sync, changing the Destination folder and syncing again overwrites
your own notes in the new folder, with no warning and no copy" (High, DSE 7.0.0, Bug + DSE Plugin).
Owner: Opus 5.5 ticket-owner (Scott asked this session for Opus 5.5 owners instead of Fable).
Dispatcher session e255a3cd-5cdb-4dc4-83be-b58e80eb1057.
Worktree: /home/scott/code/steelCompendium/worktrees/sc706-destination-change-overwrites
(branch sc706-destination-change-overwrites in every submodule). Base: dse develop e783b068,
superproject 694281bb (contains origin/main 018c2d24).

## Scott rulings

None on this ticket yet (thread empty at 2026-11-27).

## Ticket text (the spec), quoted

> **Expected:** a Sync into a changed Destination never overwrites a file the plugin did not
> install there, and asks first if the folder already holds files.

SC-441 ledger O22 (the marker's assertion), quoted: "a Sync into a changed Destination never
overwrites a file the plugin did not install there, and asks first if the folder holds files".

SC-441 r5 re-review on the marker [SYNC-K12], quoted: "The user's text must survive somewhere in
the vault, AND the sync either asked (a window) or wrote nothing into `Notes/`." Flip check
`sc706full2` ("when the manifest's folder differs, it goes through the first-sync check and opens
the window") makes K12 report `appears fixed`; `sc706partial` (only the in-place check) correctly
still fails.

## Owner rulings (2026-11-27)

**D1. Two halves, both required.**
(a) `CompendiumSyncService.applySync` Phase 1: a differing file at `<options.root>/<rel>` counts as
"we installed it" only when the old manifest's root IS `options.root` (normalized compare). When
the root changed, it is user content: `skippedConflicts`, never `modifyBinary`. Identical-hash
files stay `unchanged` (adopted, no write) as today.
(b) `main.ts` `syncCompendium`: a manifest whose root differs from the current Destination is
treated exactly like "no manifest" for the first-sync check of the NEW folder — vault-root refusal,
the migration-offer detection, and the "Existing compendium folder found" window
(`LegacyCompendiumModal`) when the new folder has children. Empty or absent new folder: sync runs
with no window, as a first sync would.

**D2. Reuse the existing window unchanged; do not touch `LegacyCompendiumModal` or its wording.**
SC-653 (In Progress + Needs Review, parked on Scott since 2026-11-14) owns that window's buttons
and wording. Routing the changed-Destination case through the same check means SC-653's eventual
fix covers both paths. D1(a) makes "Keep everything" safe on this path whatever SC-653 decides.
Known consequence, accepted: until SC-653 lands, a changed-Destination sync into a folder of user
notes now shows SC-653's window (with its trash button) instead of silently overwriting. That is
the same exposure a first sync into that folder already has today. Say so in the SC-706 comment
and add a one-line note for the SC-653 owner (SC-653 ledger is not ours; mention it in our
land-ready report so the dispatcher can relay).

**D3. Out of scope (other tickets queued in the same code — do not fix):** SC-694 (edited managed
note overwritten in place — the `modifyBinary` arm's "spec-sanctioned" overwrite stays as is for
same-root syncs), SC-695, SC-698, SC-702, SC-653 (the window itself). The fate of the OLD folder's
compendium files on a Destination change (left in place, untracked) is not this ticket; if the
implementer finds it is a real gap with no ticket, report it as a Follow-up and the owner files it.

**D4. Markers.** Flip SC-441's `knownBug('SC-706')` [SYNC-K12] in `e2e/specs/sync/` to a plain test
and the jest twin in `syncCompendiumBugs.test.ts` (describe `SC-706`: `test.failing` → plain; the
plain current-behaviour test is rewritten or removed). No other ticket's marker moves.

## Rounds

- 2026-11-27 r1 implementer dispatched (orchestration:implementer, agent ae5da05a2a30665f9),
  brief `sc706-brief-r1-implementer.md`. Ticket Backlog → Awaiting.
- r2 independent review goes to a fresh orchestration:reviewer (never the r1 author).
- 2026-11-27 r1 DONE: dse head 6961239e (85981444 fix, 113c450a jest, 285e6f25 e2e, 6961239e plugin
  changelog) on e783b068; superproject 0e32b647 (CHANGELOG only, pointer unstaged). tsc/lint clean;
  jest 15003/2 fresh (+13); lifecycle 64/64 (7 parts); e2e 932/952 ok, 0 failed, 20 known-bug,
  540/540; styles.css byte-identical (shots/freeze/parity carry). Changed existing test:
  syncCompendiumBusy.test.ts manifest stub gains `root`.

## Owner rulings on r1 follow-ups (2026-11-27)

**O1.** Follow-ups 1 (old folder left half-emptied, untracked) and 2 (A→B→A: window opens, A's
differing files skipped) → filed **SC-708** (Backlog, Medium, DSE 7.0.0, related SC-706/SC-653).
Out of scope for SC-706.
**O2.** Follow-up 3 (SC-653 relay: changed-Destination Sync now shows SC-653's window incl. trash
button) → relay in the land-ready report to the dispatcher, and say it in the SC-706 comment.
**O3.** Follow-up 4 (ManifestStore.load does not validate `root`) → dropped: the two new readers
guard with `typeof === 'string'`, and Phase 2's existing `oldManifest?.root ?? options.root`
already tolerates a missing root.

- r2 review dispatched to a fresh orchestration:reviewer (author-independent), brief
  `sc706-brief-r2-reviewer.md`, review head 6961239e.
  r2 reviewer agent a5fb9899b77b8b20d; r1 implementer agent ae5da05a2a30665f9 (fix-round target).

## Owner rulings on the r2 review (2026-11-27)

r2 verdict FIX REQUIRED at 6961239e: 0 CRITICAL, 1 HIGH, 1 MEDIUM, 2 LOW, 5 INFO. Integrity probes
all pass; no mutant survives. Reviewer re-measured: jest 15003/2 fresh, e2e 932/952 ok 0 failed 20
known-bug 540/540, sync element 87/98 ok 11 known-bug, styles.css identical. Report
`sc706-r2-review-report.md`.

**O4. H1 FOLD — refines D1(a).** D1(a) now reads: at a changed root, a differing existing file is
user content and is skipped, EXCEPT when its current hash equals the hash the old manifest recorded
for that rel (`currentHash === oldManifest.files[rel]`): those are the plugin's own bytes (a moved
or renamed install), so update in place (`modifyBinary`, `updated`, into `newFiles`). A user's own
note, or a user-edited moved file, has a different hash and stays skipped. Reason: the ticket's rule
is "never overwrites a file the plugin did not install there"; a file holding exactly the plugin's
recorded bytes is the plugin's install, and without this a renamed compendium folder freezes at the
old release forever (regression vs e783b068). Window (D2) stays as is. Tests per the review's H1
"Tests to add".
**O5. M1 FOLD** with the review's prescribed fix (re-key the manifest to `plan.root` when the
migration run itself adopts; do NOT change the `reconcile(options.root)` at the start of
`syncCompendium`). Reason: D1(b) newly routes changed-Destination users into the migration offer;
leaving M1 would make that path freeze the moved files. Keep it local to the adopt path — SC-698 and
SC-702 are queued in CompendiumMigration.ts next.
**O6. L1, L2 FOLD** with the review's wording.
**O7. INFO:** I1 drop (D11 + jest kill the (b)-only mutant). I2 drop (cannot occur with any rc
manifest). I3 drop (behaves as before the fix; not worse). I4 → add to the SC-653 relay (a parent
Destination, `Notes/DS Compendium` → `Notes`, now offers to trash `Notes`). I5 drop (O4 makes a
root-less manifest's unedited files update).

- r3 fix round: resume r1 implementer ae5da05a2a30665f9. r4 scoped re-review of the r3 delta: r2
  reviewer a5fb9899b77b8b20d (not the fix author).
- 2026-11-27 r3 DONE: dse head cbdf98d6 (0c366214 fix H1+M1, 5e4a3a39 tests incl e2e SYNC-D13/D14,
  cbdf98d6 docs L1/L2); superproject 98b2a527. jest 15011/2 fresh (+8); e2e full 934/954 ok, 0
  failed, 20 known-bug, 540/540 (one earlier full run had SET-X03/X04 settings file-picker
  timeouts; settings element alone 80/82 ok 0 failed, full re-run green); sync element 89/100 ok
  11 known-bug; styles.css identical; lifecycle carries (no sync scenario; src/data only).
  r3 follow-ups → r4 re-reviewer judges: (F1) re-keyed manifest keeps old releaseTag vs a
  `migrated:` tag (checkForUpdates); (F2) pre-existing stale `state.root` in execute()'s start-of-run
  reconcile — reachable via D1(b) routing or not. Owner rules after r4.

## Owner rulings on the r4 re-review (2026-11-27)

r4 verdict FIX REQUIRED at cbdf98d6: 0 CRITICAL, 1 HIGH (R4-H1, introduced by r3's re-key), 0
MEDIUM, 1 LOW (R4-L1 = F1), 1 INFO (R4-I1). H1/M1/L1/L2 confirmed fixed; mutants caught. Reviewer
measured jest 15011/2 fresh, e2e 934/954 ok 0 failed 20 known-bug 540/540 (SET-X03/X04 ok), sync
89/100 ok 11 known-bug, styles.css identical. Report `sc706-r4-rereview-report.md`.

**O8. R4-H1 FOLD** with the review's prescribed fix, both parts: in `execute()` start the run with
`migrated: []` when the stored state's root differs (normalized) from `plan.root`; and in
`reconcile`, adopt on re-key only when `state.root` equals the root. Tests: the probe as jest and
e2e `[SYNC-D15]`. Accepted side effect: an interrupted run in the old folder loses its self-heal
record — that folder is no longer the Destination, so it falls under SC-708 (add one line to
SC-708's agent notes at land-ready; owner does that).
**O9. R4-L1 (F1) FOLD:** when re-keyed, `releaseTag` = `` `migrated:${this.map.oldFinalRelease}` ``,
plus the assertion in r3's re-key test.
**O10. R4-I1:** no separate action; the one untrue docs line becomes true with O8. Fixer re-reads
the CHANGELOG/doc lines after O8 and confirms.

- r5 fix round: resume implementer ae5da05a2a30665f9. r6 scoped re-review of r5 delta: reviewer
  a5fb9899b77b8b20d.
- 2026-11-27 r5 DONE: dse head 71660971 (74666482 fix O8/O9, 71660971 tests incl e2e SYNC-D15);
  superproject 98b2a527 unchanged. jest 15014/2 fresh (+3); e2e full 935/955 ok, 0 failed, 20
  known-bug, 540/540; sync 90/101 ok 11 known-bug; styles.css identical; mutants each caught
  (reconcile-guard-off caught by jest only). O10: docs true after O8, no wording change.
  r6 scoped re-review → reviewer a5fb9899b77b8b20d.

## Owner rulings on the r6 re-review (2026-11-27)

r6 at 71660971: r5 delta correct (R4-H1 and R4-L1 fixed; O8 guards correct, same-folder resume
still self-heals; no e2e owed for the re-key guard — unreachable from the UI, jest kills it). One
HIGH outside the delta, pre-existing since e783b068: R6-H1. Gates measured: jest 15014/2 fresh, e2e
935/955 ok 0 failed 20 known-bug 540/540, sync 90/101 ok 11 known-bug, styles.css identical.
Report `sc706-r6-rereview-report.md`.

**O11. R6-H1 FOLD.** It is exactly this ticket's spec ("a Sync into a changed Destination never
overwrites a file the plugin did not install there") and the same rule as O8 in one more place.
Fix: in `markSettled`, when the stored state's root differs (normalized) from `root`, save
`emptyMigrationState(root)` instead of moving the root and keeping the list. ALSO take the review's
optional widening: `reconcile`, in BOTH branches (re-key or not), never adopts paths from a stored
state whose root differs from the root it is reconciling — this closes the class (three findings in
a row came from another folder's moved-path list leaking). Must not break a same-folder
interrupted-run resume. Tests: the r6 jest probe and e2e `[SYNC-D16]` (the reviewer's P02, with its
wait-for-sync-to-finish fix).

- r7 fix round: implementer ae5da05a2a30665f9. r8 scoped re-review: reviewer a5fb9899b77b8b20d.
- 2026-11-27 r7 DONE: dse head 17187e4c (6bf66547 fix markSettled + reconcile guard both branches,
  17187e4c tests incl e2e SYNC-D16 + R6b same-folder re-key resume); superproject 98b2a527. jest
  15018/2 fresh (+4); e2e full 936/956 ok, 0 failed, 20 known-bug, 540/540; sync 91/102 ok 11
  known-bug; styles.css identical; mutants caught (widened guard by jest only; D16 blocked by the
  markSettled reset). Follow-up: markSettled also drops the old folder's self-heal record → SC-708
  note already covers it (O8 side effect); no new ticket.
  r8 scoped re-review → reviewer a5fb9899b77b8b20d.

## r8 re-review → LAND-READY (2026-11-27)

r8 at 17187e4c: LAND-READY, 0 C/H/M/L, 3 INFO. R6-H1 fixed; widened guard breaks no legitimate
adoption (same-folder resume self-heals both branches; mirror case = one extra sync, no bytes at
risk); class sweep: no reachable overwrite/claim path left (markDeclined path also now safe).
Measured: jest 15018/2 fresh, e2e 936/956 ok 0 failed 20 known-bug 540/540, sync 91/102 ok 11
known-bug, styles.css identical. Report `sc706-r8-rereview-report.md`.

**O12.** R8-I1 drop (one extra sync after a failed manifest write, misleading Notice only, no bytes
at risk). R8-I2 → filed **SC-709** (Low, Backlog: "Sync anyway"/"Sync now" skip the
Destination-changed check). R8-I3 drop (guard unreachable from UI; jest kills the mutant).

LAND-READY: dse `sc706-destination-change-overwrites` @ 17187e4c on develop e783b068; superproject
@ 98b2a527 (CHANGELOG commit; submodule pointer unstaged for wt-finish). Lifecycle 64/64 from r1
(src/data-only after; no lifecycle scenario covers sync). shots 636 / freeze 280/280 / parity
0/0/24 carry (styles.css sha 50436d6b…37e98 = clean e783b068 build). Relay to SC-653 owner: changed-
Destination Sync into a non-empty folder now shows SC-653's window incl. trash, also for a parent
folder (`Notes/DS Compendium` → `Notes` offers to trash `Notes`); "Keep everything" is safe.

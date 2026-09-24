# SC-343 build ledger (preserved at landing, 2026-09-24)

Landed: dse develop 48ac20c; workspace main 41058a4. Effort decisions ledger follows the SDD execution ledger.

## SDD execution ledger


Spec: /home/scott/code/steelCompendium/worktrees/sc340-view-adoption/docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md @ 2428179 (APPROVED)
Effort ledgers: workspace/.superpowers/sdd/sc343-stale-write-guard/sc343-decisions.md, sc340-view-adoption/sc340-decisions.md
dse base: 0c132d8 (origin/develop). Execution method: subagent-driven (Scott, 2026-09-23).

## Pre-flight scan

| Pair / task | Produces → consumes | Finding |
|---|---|---|
| T1 → T3 | notifyDroppedWrite(sourcePath, noteName, now?) | consistent |
| T2 → T3 | normalizeBody, locateByBody, readSection(), hasDurableIdentity, knownBody/LineStart/Language | consistent (private fields defined in T2) |
| T2 → T4 | setMountedBody(source), notePersistIntent() / BlockHost.notePersistIntent?() | consistent |
| T4 → T5 | gate relies on mount-body seeding + persist refresh | consistent |
| T5 → T6 | gate id list + "5/5 ok" in dse-verify row | consistent |
| T0 → T6 | baseline numbers | consistent |
| T1 self | 5 tests vs code | agrees |
| T2 self | 8 tests (3 pure + 5 host) vs code; callout test relies on parseOpenFence failing on "> ```" | agrees |
| T3 self | 8 tests; stale-range / stale-model / navigate-away / twins / CRLF / callout / unterminated / known-body | traced each against resolveWriteTarget — agrees |
| T4 self | 2 tests; mock-shape fallbacks stated in plan | agrees (adaptation allowed) |
| T5 self | G-S7a does not discriminate on base (section path already correct) — plan's discrimination step runs only G-S7b/G-S6a/G-S5n | agrees; G-S7a is a regression pin |
| T6 self | docs text vs T5 ids | agrees |

Ruling: T0 is folded into T1's dispatch (setup folds into the first deliverable) — it has no commit — cost if wrong: none.
Ruling: planner gap #6 accepted — <note> in the Notice = file basename without extension, rate-limit keyed by sourcePath — cost if wrong: one-line change.
Ruling: planner gap #7 accepted — one [INTERNAL] CHANGELOG bullet (symptoms only in the unreleased 7.0 framework) — cost if wrong: re-tag the bullet.

## Tasks
Task 0+1: dispatched (implementer, orchestration:implementer/Sonnet), BASE 0c132d8
Task 0: complete (baseline: tsc/lint clean; jest 3925 passed/1 skipped/202 of 203 suites/3 snapshots; shots 524 0 FAIL; freeze 260/260; parity 0/0/16)
Task 1: implemented 0c132d8..24c8c65; review dispatched
Task 1: review ⚠️ resolved by controller — the "exactly 5000 ms later shows a new Notice" boundary (`<`) matches spec "at most one per note per 5 s".
Task 1: minor (deferred): droppedWriteNotice.ts lastShownAt Map is unbounded (one entry per note touched in a session).
Task 1: complete (commits 0c132d8..24c8c65, review clean)
Task 2: dispatched (orchestration:implementer/Sonnet), BASE 24c8c65
Task 2: implemented 24c8c65..6ea33f3; review dispatched (orchestration:reviewer/Opus)
Task 2: review → Needs fixes. Important-1 (plan-mandated): locateByBody finds nothing in a CRLF note — anchor.ts FENCE_LINE `.` does not match `\r`, so listFences sees no fences.
Ruling: fix Important-1 despite being plan-mandated — spec/plan Review Focus line 1 requires CRLF notes to save normally, and Task 3's durable path (navigate-away flush) would drop every CRLF write — cost if wrong: a 2-line local normalisation in locateByBody.
Task 2: minor (deferred): locateByBody recomputes each fence body; anchor.ts iterateFences already yields it (export listFencesWithBody).
Task 2: minor (deferred): missing tests — resolved-once but no setMountedBody → canPersist false after the section goes; a plain canPersist/getBlockInfo read refreshes lastKnownLineStart.
Task 2: minor (deferred): knownLanguage never cleared if a later read resolves to a non-fence line (hosts are recreated on re-render; comment-worthy).
Task 2: ⚠️ hover/nested getSectionInfo===null is a pre-existing documented assumption — verified live by SC-340's gate G-S6g, not in SC-343's scope.
Task 2: fix round 1/5 dispatched (resume implementer), FIX_BASE 6ea33f3
Task 2: fix round 1/5 (1 addressed, 0 open — CRLF locateByBody; commits 6ea33f3..0afc3fa)
Task 2: complete (commits 24c8c65..0afc3fa, review clean after 1 fix round)
Task 3: dispatched (orchestration:implementer/Sonnet), BASE 0afc3fa
Task 3: implemented 0afc3fa..bb18e46; review dispatched (orchestration:reviewer/Opus)
Task 3: review → Needs fixes. Important-1 (plan-mandated): overlapping writes from one host (timer flush + unload flush) — knownBody updated only after `await vault.process`, so write #2's callback compares against the stale body → false 'miss', user's latest change dropped behind a false Notice.
Ruling: fix Important-1 by setting knownBody inside the process callback, synchronously with the splice (Vault.process is atomic per file, so write #1's callback has run before #2's) — cost if wrong: a disk-write failure after the callback leaves knownBody ahead of disk → a later write may Notice (acceptable: the disk really doesn't hold our body).
Ruling: Minor-1 (unterminated fence at EOF only recognised when lineEnd is exactly the last line — a note ending in "\n" or blank lines would, once Task 4 wires setMountedBody, drop the write with a Notice) is PROMOTED into this fix round — it violates Global Constraints / Review Focus line 3 ("an unterminated fence at the end of the note: the write still lands … must not turn it into a Notice") — cost if wrong: one extra test + a `.every(blank)` check.
Task 3: minor (deferred): wrote/dropped flags not reset at the top of the process callback (only matters if process ever re-runs the callback).
Task 3: minor (deferred): section read twice per write (canPersist then readSection) — harmless.
Task 3: out-of-scope (pre-existing, for final review): replaceSource rejects if vault.process throws; ElementView.flushPersist `void …then()` has no catch → unhandled rejection.
Task 3: ⚠️ Obsidian's real lineEnd for an unterminated fence with trailing newline — covered by the promoted fix (tolerant check) + consider a gate scenario in Task 5.
Task 3: fix round 1/5 dispatched (resume implementer), FIX_BASE bb18e46
Task 3: fix round 1/5 (2 addressed, 0 open — knownBody set with the splice; tolerant unterminated-at-EOF; commits bb18e46..d297162)
Task 3: minor (deferred, DATA-LOSS NOTE for final review): tolerant EOF check + a STALE section range + knownBody === null can misread a terminated block as unterminated and delete text between its real close and lineEnd (e.g. open0 body1 close2 After3 ''4 ''5, range 0..4 → "After" deleted). Unreachable in production once Task 4 seeds setMountedBody for every production host (body compare then fails → safe locate); fix = also require no matching close fence inside [lineStart+1, lineEnd] (anchor.ts isFenceClose pattern) + test.
Task 3: complete (commits 0afc3fa..d297162, review clean after 1 fix round)
Task 4: dispatched (orchestration:implementer/Sonnet), BASE d297162
Task 4: implemented d297162..6c3dcb2 (+2 tests; plan's '+23' was cumulative from T0 — actual cumulative +27 incl. fix-round tests); review dispatched
Task 4: complete (commits d297162..6c3dcb2, review clean) — reviewer confirmed the processor is the only production `new ReadingModeBlockHost`, so every production host now has a mount body.
Ruling: no extra real-Obsidian scenario for "unterminated fence before trailing blank lines" — the tolerant `lines.slice(lineEnd+1).every(blank)` check is correct for any lineEnd Obsidian may report (exact last line, last content line, or past EOF → empty slice) — cost if wrong: one more gate scenario later.
Task 5: dispatched (orchestration:implementer/Sonnet), BASE 6c3dcb2
Task 5: implemented 6c3dcb2..a6f2101 (base 0/3 as predicted; HEAD 5/5). Deviations: ws fallback (Node 20.11.1; obsidian-camera precedent); Notice capture dedup by node identity + 'Draw Steel Elements:' prefix filter (Update Available banner; Obsidian re-parents a stacked Notice once). Review dispatched (orchestration:reviewer/Opus) with a can-fail check on the rate-limit assertion.
Task 5: review → Needs fixes. Executed can-fail check: INTERVAL=0 build → "G-S5n FAIL: rate limit: expected 1 Notice in 5 s, got 2" (assertion not vacuous; dedup counts distinct Notices).
  Important-1 (plan-mandated): Cdp has no onclose/timeout → an Obsidian crash hangs the gate forever (finally never runs; Xvfb/Electron orphaned).
  Important-2 (plan-mandated): envFail() → process.exit(2) inside try skips finally → orphaned Xvfb/Obsidian hold a :16x display / port 9262; next run exit 2.
Ruling: fix Important-1 and -2 now — the gate becomes mandatory battery step 4 and SC-340 extends this file; a hanging/orphaning gate is the known stall class — cost if wrong: ~20 lines.
Ruling: PROMOTE Minor-5 (per-run temp dir never deleted; ~30 MB/run) and Minor-6 (no SIGINT/SIGTERM handler) into this round — same single cleanup path as Important-2 — cost if wrong: trivial.
Ruling: PROMOTE Minor-4 (prefix allowlist hides the plugin's own unprefixed Notices, e.g. undo/"Recoveries:" — SC-340 stamina/hero scenarios asserting noticesSince(m).length===0 would be blind) — replace with a host-chrome DENYLIST (/^Update Available/) — cost if wrong: a scenario may need to exclude a new host notice.
Task 5: minor (deferred): `ws` resolved only transitively (jsdom); repo-wide pattern in 4 harness scripts; engines says node >=22.15 but this machine runs 20.11.1 → candidate Backlog item.
Task 5: fix round 1/5 dispatched (resume implementer), FIX_BASE a6f2101
Task 5: fix round 1/5 (4 addressed, 1 open — Minor-6 signal → exit 1 not 2 + fake FAIL lines; new minor: temp dir kept without screenshots; commits a6f2101..fcef71d)
Ruling: PROMOTE the re-review's out-of-scope `--only=<typo>` → "done: 0/0 ok" exit 0 (a false green in a mandatory gate) into fix round 2 — exit 2 when no scenario is selected — cost if wrong: one line.
Task 5: fix round 2/5 dispatched (resume implementer), FIX_BASE fcef71d
Task 5: fix round 2/5 (3 addressed, 0 open — signal exit 2; temp dir kept only with screenshots; all-unknown --only → exit 2; commits fcef71d..b6d360c)
Task 5: minor (deferred, false-green class — triage in final review): `--only=G-S7a,G-S5N` (valid + typo) silently skips the typo and exits 0 — fix `if (unknown.length) envFail(…)` regardless of matches (obsidian-lifecycle.mjs:446).
Task 5: minor (deferred): a signal before the scenario loop exits 2 but leaks the ~28 MB temp dir (onSignal doesn't rm `work`) — fix: rm `work` in onSignal when no shotsDir.
Task 5: minor (deferred): an interrupted run still prints "done: 0/N ok, 0 failed" before exit 2 — comment that the exit code is the source of truth.
Task 5: complete (commits 6c3dcb2..b6d360c, review clean after 2 fix rounds)
Task 6: dispatched (orchestration:implementer/Sonnet), BASE b6d360c
Task 6: implemented dse b6d360c..2114fe1 + superproject 3b1b19b..017044d; battery all green (jest 3952/1/204 of 205/3; lifecycle 5/5; shots 524 0 FAIL; freeze 260/260; parity 0/0/16); review dispatched
Task 6: minor (deferred): F1 amendment + dse-verify cite SC-340-view-adoption-spec.md, which exists only in the sc340 worktree — would dangle on main after SC-343 lands.
Ruling: SC-343's superproject branch will CARRY the approved SC-340 spec (docs/superpowers/dse-overhaul/SC-340-view-adoption-spec.md, byte-identical to sc340 superproject 2428179) so the citations resolve on landing — cost if wrong: SC-340's superproject branch must merge main before its own landing (add/add on the spec if SC-340 edits it first).
Task 6: minor (deferred): dse-verify Overview paragraph (SKILL.md:10-11) still lists the battery without the lifecycle gate.
Task 6: complete (dse b6d360c..2114fe1, superproject 3b1b19b..017044d, review clean)
Final review: dispatched (orchestration:reviewer/Opus) over dse 0c132d8..2114fe1 + superproject 3b1b19b..017044d
Final review: Ready to merge WITH FIXES. Real-Obsidian probes (24 scenarios, head vs base): no data lost or misplaced; nested ds-party hero_ref counter read-only; SC-336 fixed.
  Important-1: unterminated fence at EOF + write via the durable locate (navigate-away) → FALSE "not saved" Notice (listFences skips unterminated fences). Violates Review Focus #3; matters more under SC-340.
  Important-2: the SC-340 spec copy (ruled in at Task 6) was never added → dangling citations on main.
  Minor-3: G-S6a/b don't assert "no Notice".  Minor-4: FormModal drop shows two Notices.  Minor-5: hover popovers ARE writable on 1.14.2 (pre-existing, base = head) — spec/BlockHost premise false; SC-340's G-S6g as specified will fail.
  Triage fix-before-merge: T6 spec copy (=Imp-2); T6 SKILL.md Overview; T5 --only valid+typo. Cheap ride-alongs: T3 close-fence guard; T2 two missing tests.
Ruling: ONE final fix dispatch covering Imp-1 (+ jest + a gate scenario id `G-S6u`, avoiding SC-340's G-S6c–i ids), Imp-2, Minor-3, --only mixed typo, SKILL.md Overview, the T3 close-fence guard, the T2 two tests, and a BlockHost/canPersist doc correction (hover popovers resolve their section and are writable on 1.14.2 — measured) — cost if wrong: small; all in files this branch already touches.
Ruling: Minor-4 (two Notices on a dropped FormModal save) ACCEPTED as-is — both messages are accurate and FormModal's is modal-specific — cost if wrong: cosmetic duplicate message.
Ruling: stay-deferred per the final reviewer's triage: T1 Map unbounded; T2 listFencesWithBody; T2 knownLanguage comment; T3 flag reset; T3 double section read; T3 flushPersist unhandled rejection (→ Backlog); T5 ws transitive / node 20 (→ Backlog); T5 early-signal temp leak; T5 "done: 0/N" on interrupt.
Final fix: dispatched (orchestration:implementer/Sonnet), FIX_BASE dse 2114fe1 / superproject 017044d
Filed Backlog: SC-350 (flushPersist unhandled rejection), SC-351 (ws undeclared / Node 20 vs engines).
Final fix: dse 2114fe1..551a28a (f12f341, 551a28a), superproject 017044d..722488e; battery green (jest 3957/1; lifecycle 6/6; shots 524; freeze 260/260; parity 0/0/16); G-S6u fails on 2114fe1. Scoped re-review dispatched (resume final reviewer).
Final fix re-review: READY TO MERGE — Yes. Items 1–6, 8 ADDRESSED (real-Obsidian probe 8/8 ok incl. unterm1/2-away, twinU top/bottom); item 7 PARTIAL (F1 §3.4:432, §4.4:674, :850 still call hover non-persistable); SKILL.md:885 header says "landed at b6d360c" though numbers are from 551a28a.
Ruling: the two residual doc lines (F1 amendment sentence on hover; SKILL.md:885 header) ride in the pre-landing rebase dispatch as doc-only edits the owner reviews directly (no runtime code) — cost if wrong: a doc sentence.
Task parked — trailing-unterminated candidate can match an unclosed inner fence inside another language's unclosed fence — Ruling: parked (same lenient recovery anchor.ts already does for closed blocks; contrived).
Task parked — two unclosed openers of the same language compare only the last → a false Notice — Ruling: parked (contrived: a block body containing its own opening fence line).
Ruling: DROP (no ticket) — a closing fence indented 1–3 spaces at note end is still "unclosed" (CommonMark-valid, but the section path and anchor.ts both require column 0; unchanged from before this branch; rare).
Pre-landing: dse origin/develop moved 0c132d8 → f6fb208 (SC-241, SC-240 initiative fixes) → rebase + full battery required. Superproject: no file overlap with origin/main since fork 2e0db33.
Rebase dispatch: orchestration:implementer/Sonnet.

## Decisions ledger


Ticket: SC-343. Parent effort: SC-340 (ledger `.superpowers/sdd/sc340-view-adoption/sc340-decisions.md` — read it;
all rulings there apply). Worktree: /home/scott/code/steelCompendium/worktrees/sc343-stale-write-guard
(dse branch `sc343-stale-write-guard`, base origin/develop 0c132d8 (SC-278)). Owner: session 524e7562 (Opus 5.5).

## Scott's rulings (verbatim, dated)
- 2026-09-23: "1. yes / 2. yes / 3. yes / 4. yes" — ask 2 was "Land SC-343 first, on its own?" (landing approved).
- 2026-09-23: "After this work, I want to resolve sc-343"
- 2026-09-23: "spec approved. plan adn implement with subagent driven dev.  Show the obsidian notice."

## Scope (from the approved SC-340 spec §6.5 items 1–5, §8 "Durable miss", §13 Q1/Q2)
Durable identity; stale-position guard; durable locate (nearest last-known line); canPersist over durable identity
ONLY for a host whose section resolved at least once; position refresh at persist() via optional
`BlockHost.notePersistIntent?()`; dropped-write Obsidian Notice + console.warn, max one per note per 5 s, text:
"Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first."
Closes SC-343 and SC-336 (navigate-away flush lands).

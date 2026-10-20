# SC-453 decisions ledger — CRLF notes: sidebar locate + consistent line endings on write

Ticket-owner: Opus 5.5 (Scott's choice), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: /home/scott/code/steelCompendium/worktrees/sc453-crlf (every submodule on branch `sc453-crlf`).
dse base: `develop` @ f818002 (dse-verify CURRENT row, 2026-10-19).

## Spec (ticket description, verbatim, 2026-10-19)

> In a note with CRLF line endings, `SidebarBlockHost` fails to locate its block, because the anchor lookup does not strip the trailing `\r` from each line. Sidebar writes to blocks in such notes do not land.
>
> This predates SC-290; that fix leaves it unchanged.
>
> Where: `draw-steel-elements/src/framework/host/SidebarBlockHost.ts` (anchor / fence-line matching). Check `ReadingModeBlockHost` for the same thing while you are there.
>
> Also (SC-290 review INFO-4): after any DSE write, a CRLF note ends up with mixed line endings — the rewritten block uses LF. Same on SC-290's base. Fix both together: detect the note's line ending and write it back consistently.

## Scott rulings

(none yet — 2026-10-19: ticket has no comments)

## Owner rulings

- 2026-10-19: Scope = every DSE write path that rewrites or inserts text into an existing note (not only the two hosts) — a note that is all-CRLF stays all-CRLF after any DSE write; an all-LF note stays byte-identical to today's output. Mixed-ending notes: pick the dominant / first-line ending (implementer proposes, reviewer probes); must not crash or lose content.

## Round log

- 2026-10-19: R1 implementer (orchestration:implementer, id a7c5316…) dispatched on `sc453-brief-impl.md`. Reviewer must be a different identity.
- 2026-10-19: R1 DONE at dse `b3631f8` (commits 5c38cf9, 79df2ab, f825984, b3631f8). Implementer gates: jest 4867/1/228 of 229, lifecycle 26/26 (new G-S10), e2e 63/73 0 failed 47/47, shots 572, freeze 276/276, parity 0/0/24. INCIDENT: implementer ran `rm -rf /tmp/dse-obsidian-lifecycle-*` (could hit concurrent efforts' lifecycle scratch, ~14:35-14:45 local) — reported to dispatcher.
- 2026-10-19: R1 review dispatched to orchestration:reviewer (fresh identity) on `sc453-brief-review.md`.
- 2026-10-19: R1 follow-up rulings (owner):
  1. CodeBlocks.ts dead legacy CRLF hazard -> already covered by SC-454 (delete the file); drop here, cite SC-454 as out of scope.
  2. Second EOL detectors (hero `defnRaw`, anchor `ensureAnchor`) -> pending reviewer verdict; default drop (different input, no behaviour gap).
  3. Obsidian editor rewrites CRLF->LF wholesale -> drop (Obsidian behaviour, not DSE; CHANGELOG already scopes the claim to DSE's writes).
  4. dse-verify CURRENT row update -> dispatcher landing bookkeeping; goes in the land-ready report.
- 2026-10-19: R1 review (orchestration:reviewer, id ac18eaf…) FIX-REQUIRED: 0 CRIT / 0 HIGH / 1 MED / 2 LOW / 7 INFO. Report `sc453-review-report.md`.
- 2026-10-19: Owner rulings on R1 review:
  - MEDIUM-1 (G-S10 flakes ~3%: hex anchor ids that YAML reads as numbers) -> FOLD the test fix: make G-S10 deterministic (stub Math.random around the pin to a non-numeric-looking id). The product fix is OUT OF SCOPE: it is SC-383 (Backlog, "Sidebar panel loses its block when the anchor id looks like a number").
  - LOW-1 (lone-`\r`-ending body on LF note misread as external edit) -> FOLD: set `lastWritten` from `extractBody(next, …)` inside the `vault.process` callback, + test.
  - LOW-2 (`stripCr(newSource)` untested) -> FOLD: add a CRLF-newSource self-echo test that kills that mutation.
  - INFO-1 (redundant stripCr at ReadingModeBlockHost.ts:151, inaccurate comment) -> FOLD: make the comment accurate (keep or drop the call, implementer's choice; gates must stay green).
  - INFO-2 (lone `\r` ABOVE a block drops Reading-view writes silently; predates) -> filed SC-460 (Backlog, related SC-453). OUT OF SCOPE for the code; FOLD only correcting the false comments at `lineEnding.ts:17-18` and `ReadingModeBlockHost.ts:146-148` (new/changed on this branch), citing SC-460.
  - INFO-6 (write to unterminated fence at EOF drops the final newline; predates) -> DROP: harmless to Markdown rendering, predates, G-S6u already covers that path; not worth a ticket.
  - INFO-3/4/5 -> no action. INFO-7 -> land-ready report (dse-verify CURRENT row).
  - Impl follow-up 2 (second EOL detectors in hero model / ensureAnchor) -> DROP: reviewer found no behaviour gap; different inputs.
- 2026-10-19: Fix round 1 sent to R1 implementer (a7c5316…) via SendMessage resume. Scoped re-review -> R1 reviewer (ac18eaf…), delta only.
- 2026-10-19: Fix round 1 DONE at dse 52c9414 (2cc5b28, 3554856, 4351e4e, 52c9414). jest 4869/1/228 of 229, lifecycle 26/26, G-S10 solo 6/6, e2e 63/73 0 failed 47/47, shots 572, freeze 276/276, parity 0/0/24. Scoped re-review sent to reviewer ac18eaf…
- 2026-10-19 (dispatcher): dse origin/develop moved to 9ed8dc6 (SC-428). "Land-ready must be on 9ed8dc6." New base numbers: jest 4840 / 1 skipped / 227 of 228 · lifecycle 25/25 · e2e 68/76 ok, 0 failed, 8 known-bug, coverage 51/51 pairs · shots 572 · freeze 276/276 · parity 0/0/24. Workspace main 4af57bb. Plan: once the re-review returns, implementer rebases onto 9ed8dc6 (in the same worktree, so not while the reviewer runs), then runs the full battery. Expected after the rebase: jest 4899 (4840 + 59) / 1 / 228 of 229 · lifecycle 26/26 · e2e 68/76 0 failed 8 known-bug 51/51 · shots 572 · freeze 276/276 · parity 0/0/24. The reviewer then checks the rebase and any conflict resolution.
- 2026-10-19 (dispatcher): dse origin/develop moved again, to c616e22 (SC-450: setPressedState + a new jest guard suite `test/unit/build/ariaPressedWriters.test.ts`). "Land-ready must be on c616e22." New base numbers: jest 4849 / 1 / 228 of 229 · lifecycle 25/25 · e2e 68/76, 0 failed, 8 known-bug, 51/51 · shots 572, plus the in-run line `pressed toggle parity OK (96 comparisons …)` · freeze 276/276 · parity 0/0/24. This SUPERSEDES the 9ed8dc6 rebase target. Expected after rebasing onto c616e22: jest 4908 (4849 + 59) / 1 / 229 of 230 · lifecycle 26/26 · e2e 68/76 0 failed 8 known-bug 51/51 · shots 572 + pressed-toggle line · freeze 276/276 · parity 0/0/24. The new aria-pressed guard must pass, since SC-453 writes no aria-pressed.
- 2026-10-19 (dispatcher): The session process exited, and every worker died with it. dse head is 52c9414, tree clean. The re-review left no output. Overlap FYI: SC-360 (worktree sc360-flaky-undo, b1f15d9) fixes `generateAnchorId` ("sidebar anchor ids can never read as a non-string YAML scalar (leading a-d/f letter)"). That is the product fix our G-S10 stub works around.
- 2026-10-19 (owner): SC-453 and SC-360 can land in either order, so neither depends on the other. To keep it that way, G-S10 must NOT hard-code the `abcdef` id. It should assert that the id stamped on disk is the one the panel holds, and that YAML parses it as a string. Keep the Math.random stub, since it is harmless after SC-360. Folded into the rebase round. Next: rebase onto c616e22 plus this G-S10 change (implementer), then ONE scoped review over b3631f8..new head (the fix-round delta plus the rebase), by the reviewer identity.
- 2026-10-19: Rebase round DONE: head 6bcf9c8 on c616e22, 0 conflicts. G-S10 now asserts the id on disk equals the panel's anchorId and that YAML (node-side yaml v2) parses it as a string. jest 4908/1/229 of 230 (ariaPressed guard 5/5) · lifecycle 26/26 · G-S10 solo 5/5 · e2e 68/76 0 failed 8 known-bug 51/51 · shots 572 + pressed-toggle line · freeze 276/276 · parity 0/0/24. Owner session is now 1efbabcf-839e-4390-b636-65140a046f71. Scoped review (fix round + rebase + G-S10) -> reviewer ac18eaf…
- 2026-10-19: Scoped re-review (ac18eaf…) is LAND-READY on 6bcf9c8: 0 CRIT/HIGH/MED/LOW, 5 INFO. Owner rulings:
  - INFO-1 (trivial conflicts with SC-360: `src/elements/encounter/view.ts:20-21` adjacent imports, plus CHANGELOG adjacent bullets; keep both sides) -> pass to the dispatcher in the land-ready report.
  - INFO-2 (rejected write, then the file re-created with the attempted body gives one remount with identical content) -> no action; more correct than before.
  - INFO-3 (spurious external change from rapid writes, only under the jest fake, identical on every version) -> drop; the fake is the cause, not a regression.
  - INFO-4 (`SidebarBlockHost.ts:68` field doc still says "exact body") -> drop; cosmetic, not worth another battery run.
  - INFO-5 (R1 evidence paths lost in the restart) -> no action; the re-review regenerated everything as rr2-*.
- 2026-10-19: LAND-READY reported to the dispatcher: dse sc453-crlf @ 6bcf9c8 on c616e22.
- 2026-10-20: LANDED (dse develop 6bcf9c8, workspace af3b960). Ticket flipped to Done.

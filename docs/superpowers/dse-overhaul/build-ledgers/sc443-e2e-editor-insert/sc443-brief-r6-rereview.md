# SC-443 r6 — scoped re-review of the r5 delta only

You reviewed this branch in r4 (scope A or scope B). This is NOT a fresh full pass: review only what r5 changed.
Your final text goes to the SC-443 ticket-owner, not a human. **Workers never call the tracker.** Do not commit to
the branch, never push, never tag.

## 1. Context

- Ledger, from "Resume 2026-11-23" to the end (rulings on every r4 finding, the two new tickets SC-687 and SC-688,
  the SC-679 hand-off): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/decisions.md`
- The fix brief `sc443-brief-r5-fix.md` and the implementer's `sc443-r5-fix-report.md` (same directory; executive
  summary first).
- Your own r4 report and the other scope's (`sc443-r4a-review-report.md`, `sc443-r4b-review-report.md`).
- The SC-679 hand-off patch:
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc679-suggest-enter-double-value/sc679-on-sc443.patch`
- Branch: `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements`, branch
  `sc443-e2e-editor-insert`. Head, base and the implementer's numbers are in the dispatch message. The delta is
  `git -C <path> range-diff d582e7ff..6c5a073c 8c08bce2..<head>` for the rebased commits plus
  `git -C <path> diff <rebased 8th commit>..<head>` for the new work.

## 2. What to check — execute and probe

1. **Rebase fidelity.** The 8 rebased commits are `=` in the range-diff, or every difference is explained by the
   base move. `src/` diff vs `8c08bce2` is the three `data-dse-control` attribute edits only; SC-679's behaviour in
   `src/authoring/schemaSuggest.ts` is develop's, untouched.
2. **SC-679 hand-off.** No `knownBug('SC-679')` or SC-679 `test.failing` is left. AUTH-G13, AUTH-G14, AUTH-K09 are
   plain; the patch's 13 new e2e tests are all present (compare against the patch file), unweakened, ids unique.
   Mutation-probe in a scratch worktree: revert the SC-679 fix (`35f3a682`, `aabb47ca`, `5b476d17` — or remove the
   `close()` / cursor placement by hand) and confirm those tests go red.
3. **Each r4 finding the ledger folded is resolved as ruled** — r4a L-1, L-2, L-3, L-4; r4b MEDIUM-1, LOW-1, LOW-2,
   INFO-1, INFO-2, INFO-3, INFO-5. Re-run the probe that found it:
   - L-1: with AUTH-C10's own stub removed, the test goes red and NO request leaves (no "resolving compendium
     release…" Notice); the guard covers every authoring spec; no other spec's behaviour changed.
   - L-2: mutant M12 (Shift on the snapshot command routed to the inline link) is now red in e2e.
   - L-3: K01 / K02 assert the block draws.
   - L-4: the new manifest pair(s) and plain test(s) for middle-click / right-click drive real mouse input and pin
     today's behaviour; coverage counts them.
   - LOW-1 / LOW-2: the SC-678 and SC-677 markers now flip under BOTH fix shapes your r4 sims used, and still fail
     today for the stated reason.
4. **New markers.** SC-687 (jsdom `test.failing` + e2e `knownBug('SC-687')`) and SC-688 (jsdom `test.failing` ×2 +
   gate-ON e2e `knownBug('SC-688')`): each fails today for the stated reason and flips under each reasonable fix —
   simulate for SC-687 both a refusal that leaves the note unchanged and an insert moved below the existing block;
   for SC-688 both "write `key: value`" and "no list until a space is typed". No bracketed ticket id in a title.
5. **Nothing else moved.** No test outside the r5 task list was weakened or deleted; no edit to an `e2e/driver/*`
   file that exists on develop beyond what the report lists, and those are additive.
6. **Gates.** tsc (incl. `-p e2e`), lint, full jest, and the full `npm run e2e` ONCE at the head (exact
   `OBSIDIAN-E2E done:` line, wall time, loadavg). Lifecycle / shots / freeze / parity: only if item 1 finds a
   `src/` hunk that is not an attribute.

If two reviewers are dispatched, the dispatch message splits these items between you.

## 3. Footguns

Same as your r4 brief §3 (`sc443-brief-r4-review.md`), all of it: `git -C`, `devbox run -c <abs> -- bash <script
file>`, blocking foreground gates or a nohup job whose own unique rc file you poll, no `run_in_background`, no
Monitor, no `rm` in `/tmp` or the scratchpad (not even your own probe file), no pattern kills, scratch worktree
removed only with `git worktree remove <literal path>`, never key a wait on a stale scratch file (use NEW `r6-`
names in a NEW folder `…/scratchpad/sc443-rev-r6<a or b>/`), long output to files. SC-442 and other efforts run
gates on this host: an e2e failure that passes alone on a re-run is load — name the test and the loadavg.
If the report-file write is blocked by your harness, return the report inline.
You cannot `SendMessage` the ticket-owner — `to: 'main'` reaches the dispatcher, not me. If you need input, end with
`STATUS: NEEDS_CONTEXT` and the question; if you ever send a message anyway, its first word must be `SC-443:`.

## 4. Report and return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r6<a or b>-rereview-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / NOT LAND-READY), each r4 finding RESOLVED / NOT
RESOLVED, new findings by severity with file:line, gate numbers. Final text: raw facts only — verdict, per-finding
status, new findings (title + file:line + severity), product bugs, gate numbers, report path, and the path of every
evidence artifact.

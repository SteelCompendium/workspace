# SC-474 fix round 1 (to the impl-r1 implementer)

Context: ledger `decisions.md` (re-read it: base moved, rulings added) and the review report
`sc474-review-r1-report.md` in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc474-conditions-dropdown-click/`.
Same worktree, same branch, same footguns as your round-1 brief (private scratch subfolder — use a NEW one,
`<scratchpad>/sc474-fix-r1-<random 4-char suffix>/`; lifecycle port 9291; kill only by own-path PID; no shared-glob rm;
`git -C <absolute path>` always). Workers never call the tracker.

## 1. Rebase first

dse `origin/develop` moved 3480231 -> c03db7a (SC-456, test-only: e2e note-integrity check now compares every fence's full
opening/closing lines byte for byte; touches e2e/driver/noteFences.ts, invariants.ts, dse.ts, test/mocks/obsidian-core.ts).
`git -C <dse> fetch origin && git -C <dse> rebase origin/develop`; expect c03db7a. Before the fix commits, build `main.js` and
`styles.css` at the rebased head and record whether they are byte-identical to 8af4f9a's build (sha256 both).

## 2. Fixes — the review findings, verbatim, with owner rulings

HIGH-1 — FOLD (owner ruling). Reviewer text, verbatim:
> Old order: document mousedown → `closeAdd()` focuses "+ Add" → the mousedown's default action then focuses the pressed element, so the target won. New order: the mousedown's default action focuses the target → the click's capture listener calls `closeAdd()` and focus moves to "+ Add". Then the target's own click handler runs. Cog, remove, swatch, duration and effect handlers re-focus, which hides the problem; an input does not.
> Failure scenario: the GM has a row's editor open and the Add dropdown open, then clicks the icon search to look for an icon. The dropdown closes, the field shows no caret, and what they type goes nowhere. Space or Enter at that point lands on "+ Add condition" and reopens the dropdown. A second click works, because the dropdown is already closed.
> Prescribed fix: let the click-path close skip the refocus when focus has already left the add control. For example, `closeAdd(refocus = true)`, and in `closeIfArmed` pass `refocus` only when `activeDocument.activeElement` is null or `body`, or is still inside `addWrapEl`. That restores the old net result: the clicked control keeps focus, and a click on non-focusable space still lands on "+ Add" (this is better than pre-fix, which left `body`; see INFO-2). Fix the `:152-156` comment to match.
> Tests: add a jsdom test (focus the icon search between mousedown and click, then assert it still has focus after the click and the dropdown is closed). Add an e2e scenario like X4-P16 (`.dse-cond-icons__search` would need a control id and manifest row, or read it by `{ css }` and drive the click with `cond.edit`-style ids). Re-run the battery.

Also cover the custom-colour input (reviewer X4-P17: a cancelled chooser leaves focus on "+ Add") in jsdom at least. The reviewer's
probe spec `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc474-review-r1-x4vt/x4vt-probe.e2e.ts`
(X4-P16) is a reference you may read; do not edit it. The e2e scenario must fail on 8af4f9a's behaviour and pass on the fix.

LOW-1 — FOLD (owner ruling). Reviewer text, verbatim:
> Fix: `const doc = activeDocument;` once in `onOpen`, then use `doc` for all three listeners and `doc.defaultView` for the timer.

INFO-2 — owner ruling: KEEP as is (click-away on non-focusable space focuses "+ Add"); the HIGH-1 fix must preserve it — pin it in jsdom.
Out of scope (owner rulings: DROP): INFO-1 (keyboard click while a press is held), INFO-3. Do not add `evt.detail` guards.
Still no CSS at all; no `.dse-swatch` / `.dse-optchip` changes. Commit prefix `fix(conditions): SC-474 r1 …`, no attribution
trailers; update the CHANGELOG bullets only if the user-facing wording becomes inaccurate.

## 3. Gates at the final head (dse-verify order)

Re-run tsc (+ `-p e2e`), lint (+ e2e), jest, lifecycle, e2e. Expected on c03db7a: jest **5374 + 7 (round 1) + your new tests /
1 skipped / 231 of 232 suites** (fresh worktree: one fewer passed, 2 skipped until shots); lifecycle **28/28**; e2e
**87/91 + your new scenario(s), 0 failed, 4 known-bug, 63/63 pairs** (or 64/64+ if you add a control id / manifest row) — COND-E04/E05
must pass SC-456's stricter integrity check. Then shots (**572**, 0 FAIL), freeze (**276/276**), parity last (**0/0/24 DECLARED**) —
these are required this round because the fix changes `main.js`.

## 4. Report and return

Write `sc474-fix-r1-report.md` in the ledger dir, opening with a ≤10-line executive summary (inline if the write is blocked).
Final text to the ticket-owner: STATUS, dse head + superproject head, commit list, rebase result + byte-identity check, each gate
measured vs expected, tests added (paths), the e2e red-on-8af4f9a evidence, absolute paths of every artifact. `Drive-by fixes:` /
`Follow-ups:` sections. If you need input: STATUS: NEEDS_CONTEXT. If you ever message anyway, FIRST WORD `SC-474:`.

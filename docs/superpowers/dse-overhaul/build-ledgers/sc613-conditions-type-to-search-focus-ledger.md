# SC-613 decisions ledger — Conditions window: typing after a click on the title / blank space

Ticket: SC-613 (Linear). Related: SC-580 (type-to-search, landed), SC-585, SC-586 (landed). Not ours: SC-614.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus` (branch `sc613-conditions-type-to-search-focus` in every submodule).
Base: dse develop `14521bf0`; workspace main `f58d5f02`.
Lifecycle id reserved if needed: G-S116.

## Ticket statement (from the description, 2026-11-13)

> It does not work after you click the window's title or an empty part of it. That click moves focus out of the window to the page, so the next letter does nothing.
> **Repro (real Obsidian):** open an initiative tracker, click a row's Add Condition, click the window's title, type `daz`. Expected: the Add search opens with "daz" typed. Actual: nothing happens.

Fix options listed on the ticket: (a) a lifecycle-registered document keydown that routes only when the target is `body` and this window is the top-most modal; (b) make the modal element focusable (`tabindex=-1`) so a click on blank space keeps focus inside. "Check that (b) moves no shots or freeze bytes and does not add a visible focus ring."

No Scott comments on the ticket at start (2026-11-13). No decision needed from Scott: expected behaviour is stated in the ticket.

## Owner rulings

- 2026-11-13 owner: **option (a)** is the fix. Reasons: it covers every way focus can fall to `<body>` while the window is on top (title click, blank-space click, any later path), not only clicks; it adds no DOM attribute, so shots / freeze / parity / host-leak cannot move; no focus-ring question. Option (b) is not used. Constraints: route only when the key's target is the document's `body` or `documentElement`, this window's `containerEl` is the top-most `.modal-container` in its own document (a stacked modal keeps its keys), the event is not `defaultPrevented`, and the same key filter as SC-580's in-modal router (printable, no Ctrl/Meta/Alt, not Space) applies — reuse the existing router, do not fork it. Listener on the modal's own document (popout windows), registered through the modal's lifecycle so it is removed on close. Must not double-fire with the existing modalEl listener.

## Rounds

- r1 implementer: dispatched 2026-11-13.
- 2026-11-13: worktree created (`just wt-new`), plugin at `14521bf0`, superproject at `f58d5f02`. Ticket moved Backlog -> Awaiting. r1 implementer brief `sc613-r1-implementer-brief.md`. r2 reviewer brief pre-written: `sc613-r2-reviewer-brief.md` (independent Opus identity; never the implementer).
- r1 implementer DONE 2026-11-13: plugin `8978b6f0` on `14521bf0` (b18c2fb7 fix, d2048470 jest, 8978b6f0 e2e COND-N12..N14); superproject `e534de69` (CHANGELOG only, no pointer bump). jest 11852/2 fresh (+19) · lifecycle 63/63 · e2e 337/340 ok, 0 failed, 3 known-bug, 176/176 · shots 592/163-978/40-240/147 · freeze 280/280 · parity 0/0/24. Mutants M1-M6 each killed in jest. Design: document listener via lifecycle.registerDomEvent on containerEl.ownerDocument -> typeToSearchFromPage -> existing typeToSearch; guards: !defaultPrevented, target body/html, no `.menu, .suggestion-container` in doc, containerEl last `.modal-container`. Menu guard measured needed in real Obsidian (a letter with a file-explorer context menu open reached body undefended).
  - Owner rulings on r1 follow-ups:
    - `.suggestion-container` guard unmeasured in real Obsidian: **fold into r2 review** — reviewer probes it (e.g. a link-suggest or command palette over the window if reachable); keep the guard unless shown harmful.
    - jest matrix leaves modals open, listeners accumulate: **fold** into the next fix round (file-level afterEach closing opened modals), and reviewer confirms the stacked-modal test alone kills M3 once isolated.
    - two stacked modals' DOM-order "top-most" unmeasured in app: **fold into r2 review** — reviewer measures in real Obsidian.
- r2 independent review dispatched 2026-11-13 (fresh Opus reviewer identity), brief `sc613-r2-reviewer-brief.md` + the three folds above.
- r2 review DONE 2026-11-13: **LAND**, 0 HIGH / 0 MEDIUM / 2 LOW / 4 INFO (`sc613-r2-review-report.md`). Gates re-run on 8978b6f0: tsc/lint clean, jest 11853/1 (shots cache), e2e 337/340 ok 0 failed 3 known-bug 176/176, lifecycle parts 1 and 5 green; styles.css byte-identical to 14521bf0 build. Real-Obsidian probes all as ruled (popout, sidebar, hover opener, stacked command palette / stamina window, IME, open/close cycles).
  - Owner rulings:
    - LOW-1 (no test for the popout document; mutant M10 `keyDoc` -> global `document` survives): **fold** — jest test with the iframe pattern at `test/dom/authoring/compendiumSearchHoverPreview.test.ts:221-241`: body key in the iframe doc opens the search, body key in the main doc does not, neither after close. M10 must fail it.
    - LOW-2 (matrix `afterEach` never closes opened windows; listeners pile up): **fold** — track windows `open()` creates and close them in `afterEach`.
    - INFO-1 (`.suggestion-container` guard dead in real Obsidian, harmless): **keep both guards**, no change.
    - INFO-2 (top-most check measured correct; M3 passes every committed e2e): **fold** — promote the reviewer's probe P03 (command palette over the Conditions window, body key `d` types nothing into the Conditions search) to a committed e2e scenario with a fresh COND id.
    - INFO-3 (stacked test alone kills M3): drop, informational.
    - INFO-4 (M7 equivalent; unreachable `ownerDocument` on a Document target): drop — equivalent mutant / no reachable path.
- r3 fix round: resume r1 implementer with the three folds; test-only (no `src/` change), so lifecycle / shots / freeze / parity carry from r1; re-run tsc, lint, jest, full e2e. Then r4 scoped re-review by the r2 reviewer identity.
- r3 implementer DONE 2026-11-13: plugin `9b94baf2` (eb698951 popout jest test + afterEach closes windows; 9b94baf2 e2e COND-N15 command palette on top). Test-only (+21 e2e, +41 jest). jest 11854/1 with shots cache (= 11853/2 fresh) · e2e 338/341 ok, 0 failed, 3 known-bug, 176/176. M10 now killed by the popout jest test; M3 killed by the stacked jest test alone and by COND-N15. Lifecycle/shots/freeze/parity carry from r1.
- r4 scoped re-review (r2 reviewer identity) of 8978b6f0..9b94baf2 dispatched 2026-11-13.
- r4 scoped re-review DONE 2026-11-13: **LAND**, 0 HIGH/MEDIUM/LOW, 2 INFO. jest 11854/1 (cache) · matrix 368/368 · e2e 338/341 ok, 0 failed, 3 known-bug, 176/176 · COND-N12..N15 4/4. Folds verified non-vacuous (M10/M14/M15 kill popout test; afterEach masks nothing incl. randomized seeds; COND-N15 fails under M3).
  - Owner rulings: INFO-1 (M16, menu guard on the main doc survives): **drop** — defensive guard only, dead in real Obsidian (r2 INFO-1). INFO-2 (r3 report "461" typo vs 368): drop.
- Next: chore commits the single superproject pointer bump to 9b94baf2 on the branch (rebase onto workspace origin/main first if moved), then land-ready.
- Chore DONE 2026-11-13: superproject `d84892a4` = pointer bump to 9b94baf2 on top of e534de69 (CHANGELOG), on workspace origin/main `f58d5f02` (no rebase needed; owner verified ancestor, 2 commits, tree clean; no co-author trailer per Scott's global CLAUDE.md). Plugin 9b94baf2 = 5 commits on origin/develop 14521bf0.
- LAND-READY 2026-11-13: land-ready comment posted on SC-613 (`sc613-comment-landready.md`). Ticket stays Awaiting; dispatcher lands. After landing: dse-verify CURRENT = jest 11853/2 fresh · lifecycle 63/63 · e2e 338/341 ok, 0 failed, 3 known-bug, 176/176 · shots 592/163-978/40-240/147 · freeze 280/280 · parity 0/0/24; G-S116 unused.

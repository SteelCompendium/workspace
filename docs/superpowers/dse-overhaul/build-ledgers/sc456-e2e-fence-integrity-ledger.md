# SC-456 decisions ledger — e2e note-integrity check sees only each fence's first token

Worktree: /home/scott/code/steelCompendium/worktrees/sc456-e2e-fence-integrity (branch `sc456-e2e-fence-integrity`)
Base: dse `develop` @ 188755b. Owner: Opus 5.5 ticket-owner (posts with --model opus-5.5).

## Scott rulings
(none yet)

## Inherited from SC-290's ledger (.superpowers/sdd/sc290-info-string/decisions.md)
- L41 (verbatim): "INFO-1 (e2e integrity check sees only first fence token) -> FILED SC-456. ~~dse.expectNoteBlock / makeFakeContext limitation DROPPED~~ superseded: folded into SC-456."
- L42 (verbatim): "INFO-2 (space-before-language fence -> empty language, relocate fallback can't find it) -> FILED SC-457."  => the PRODUCT fix for space-before-language is SC-457, OUT OF SCOPE here.

## Ticket text (SC-456 description, verbatim fix line)
"Fix: compare the full opening fence line, and parse fences the same way the product does (`src/framework/host/fenceLine.ts`, added by SC-290). The jest fake `makeFakeContext` has the same first-token limitation."

## Dispatcher constraints (2026-10-20)
- "SC-460 (stray-CR write-back) and SC-422 may also add e2e tests concurrently — keep changes to the e2e integrity helper scoped."
- Land-ready goes to the dispatcher; the dispatcher lands.

## Owner rulings (2026-10-20)
- O1. Fence recognition in the e2e helpers follows the product's marker grammar (`src/framework/host/blockPrefix.ts` `matchFenceMarker`: ``` and ~~~ runs of 3+, quote prefix, closing fence = same char, length >= opener, nothing but whitespace after). Reuse the product module if `tsc -p e2e` + the wdio runner can import it; otherwise mirror it in the e2e driver with a jest test that pins the mirror to the product parser on a shared case table.
- O2. The helper's block TYPE (used by `dse.block()` / `declareTarget` / `expectNoteBlock`) is the first token of the TRIMMED info string (Obsidian/CommonMark semantics), so ```` ``` ds-x ```` is type `ds-x`. This deliberately differs from the product's current `language` (`\S*` -> '') — that product gap is SC-457, not fixed here.
- O3. The skeleton placeholder records the full opening line AND the full closing line of every fence byte-for-byte, so a write that rewrites a TARGET block's opening or closing line fails the after-every-test invariant. Only the body of a target fence is exempt.
- O4. Test-only change: nothing under `src/`, `styles*`, `visual-harness/` may change. Gate: tsc (incl. -p e2e), lint, jest, lifecycle, e2e full run REQUIRED; shots/freeze/parity are replaced by proof that built `main.js` + `styles.css` are sha256-identical to base 188755b and that `git diff --stat` touches only `e2e/` and `test/`. If anything outside those two dirs changes, the full battery applies.
- O5. Leave existing spec files (incl. SC-290's RECOV-I01 raw-line assertion) alone unless the helper change forces a minimal edit — concurrency with SC-460/SC-422.

## Round 1 (implementer, head 9e1b93d) — follow-up rulings (owner, 2026-10-20)
- F1 `readBlock` now treats a `ds-x` line inside another open fence as body (was counted as a block) -> DROP as ticket: correct CommonMark behaviour, intended by O1; reviewer confirms no spec relied on the old behaviour.
- F2 wdio worker now imports `src/framework/host/blockPrefix.ts` -> DROP as ticket: if that module ever gains an `obsidian`/DOM import the required e2e gate fails loudly at load, not silently. (A one-line note in `e2e/driver/noteFences.ts` is fine if a fix round happens anyway.)
- F3 fresh worktree needs `npm ci` -> DROP: known setup step.

## Review round 1 (reviewer, head 9e1b93d, FIX-REQUIRED) — rulings (owner, 2026-10-20). Findings verbatim: sc456-review-r1-findings.md
- R1 MEDIUM quoted fence must end when its blockquote ends (noteFences.ts scanFences + makeFakeContext) -> FOLD into fix round 1, exactly as the reviewer prescribes, incl. a jest table that checks the scan against the product's `listFences`.
- R2 LOW vacuous LF-ified test (`'```\nouro'` typo) -> FOLD.
- R3 LOW e2e/README.md integrity rule text -> FOLD; also say there that the product deliberately trims trailing whitespace on fence lines it writes (SC-290 policy), so fixtures must not carry trailing whitespace on fence lines of a block a test writes.
- R4 INFO product trims trailing whitespace / drops stray `\r` on written fence lines -> keep O3 byte-exact (no fixture is affected; full e2e green). Trailing whitespace: DROP as ticket — deliberate SC-290 policy, documented via R3. Stray `\r`: owned by SC-460, not here.
- R5 INFO stale comment stamina-recoveries.e2e.ts:41 -> DROP: O5 (concurrent spec edits by SC-460/SC-422); a comment, fix when that spec is next touched.
- R6 INFO unterminated fixture cannot exist -> DROP: no fixture needs one. Jest fake treating `ds-x` inside a ```md fence as a block -> FOLD if it falls out of R1 (make makeFakeContext skip every fence's body the way the scan does); otherwise DROP.

## Fix round 1 (implementer, head bbf0b32) — R1/R2/R3 folded, R6 fell out of R1; F2 one-line note added. Gates: jest 5294 passed / 2 skipped (fresh worktree), lifecycle 27/27, e2e 83/87 ok 0 failed 4 known-bug 57/57, O4 hashes identical. Scoped re-review dispatched to the round-1 reviewer (not the author).

## Dispatcher course correction (2026-10-21)
"dse develop has moved 188755b → ba20072 (SC-366 landed: styles-source.css adds `a.dse-ref-web-card__link` to the plugin link-colour rules around lines 8901/8909, plus the new test test/dom/theme/notInstalledLinkColour.test.ts). New baselines: jest 5260 / 1 skipped / 230 of 231 suites; everything else is unchanged (e2e 83/87, 4 known-bug, 57/57; freeze 276/276; parity 0/0/24). Land-ready must be on ba20072."
-> After the scoped re-review returns, the implementer rebases onto ba20072 and re-runs tsc/lint/jest/lifecycle/e2e and the O4 hash proof against ba20072 (not 188755b). Expected jest on the fresh worktree: 5259 + 38 branch tests = 5297 passed / 2 skipped / 231 of 232 suites (one more suite than base).

## Dispatcher course correction 2 (2026-10-21) — supersedes the ba20072 target above
"dse develop has moved ba20072 → 84636a9 (SC-460 landed: write-back now tolerates a stray CR above a block across Reading view, Live Preview, the sidebar and the encounter builder, with a new lifecycle scenario G-S12). New baselines: jest 5329 / 1 skipped / 230 of 231 suites, lifecycle 28/28; e2e 83/87, 4 known-bug, 57/57; freeze 276/276; parity 0/0/24. Land-ready must be on 84636a9."
-> ~~rebase onto ba20072~~ superseded: rebase onto 84636a9. O4 hash proof against 84636a9. Expected: jest (fresh worktree) 5328 + 38 = 5366 passed / 2 skipped / 231 of 232 suites; lifecycle 28/28; e2e 83/87 ok, 0 failed, 4 known-bug, 57/57. SC-460 may have touched test/mocks/obsidian-core.ts or e2e/driver — resolve conflicts keeping BOTH behaviours, and report every conflict hunk.

## Dispatcher course correction 3 (2026-10-21) — supersedes the 84636a9 target
"dse develop has moved 84636a9 → 0267b8a (SC-459 landed: only lifecycle G-S8 in visual-harness/obsidian-lifecycle.mjs and a previewScrollPin.ts header comment changed; the build is byte-identical). Baselines are unchanged: jest 5329/1, lifecycle 28/28, e2e 83/87 with 4 known-bug and 57/57, freeze 276/276, parity 0/0/24. Land-ready must be on 0267b8a."
-> ~~rebase onto 84636a9~~ superseded: rebase onto 0267b8a (fetch first; if develop has moved again, rebase onto the newest and report it). O4 hash proof against 0267b8a. Expected numbers as in correction 2.

## Dispatcher course correction 4 (2026-10-21) — supersedes the 0267b8a target
"dse develop has moved 0267b8a → 3480231 (SC-468 landed: Conditions modal focus after a keyboard pick, plus new e2e COND-E02/E03 — your integrity helper will now see those too). New baselines: jest 5336 / 1 skipped / 230 of 231 suites; e2e 85/89 ok, 0 failed, 4 known-bug, coverage 63/63 pairs; lifecycle 28/28; freeze 276/276; parity 0/0/24. Land-ready must be on 3480231. Rebase your superproject branch onto origin/main before you report (the CHANGELOG moved)."
-> rebase dse onto 3480231 (fetch first; newest if moved again) AND rebase the worktree's superproject branch onto origin/main. Expected: jest (fresh worktree) 5335 + 38 = 5373 passed / 2 skipped / 231 of 232; lifecycle 28/28; e2e 85/89 ok, 0 failed, 4 known-bug, coverage 63/63 — if the stricter invariant flags COND-E02/E03, that is a finding: stop and report, do not loosen. O4 hash proof against 3480231.

## Scoped re-review (round-1 reviewer, 9e1b93d..bbf0b32), relayed by the dispatcher 2026-10-21
"Verdict: LAND-READY at bbf0b32 (branch as-is, not rebased onto develop 3480231)". No HIGH/MEDIUM/LOW. One INFO: noteFences.ts:65 follows the CommonMark unterminated-fence rule -> DROP: intended, covered by R6. jest at bbf0b32: 5294 passed / 2 skipped (fresh worktree). Artifacts: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc456-review-r2/
-> Next: rebase round (correction 4).

## Rebase round (implementer r3) — LAND-READY (owner, 2026-10-21)
dse head c03db7a on develop 3480231 (f5ce164 helpers, 05a4968 tests, c03db7a review fixes); no conflicts. Superproject branch at origin/main 27e9de0, no own commits, pointer unstaged. Gates: tsc/lint clean; jest 5373 passed / 2 skipped / 231 of 232 (fresh worktree); lifecycle 28/28; e2e 85/89 ok, 0 failed, 4 known-bug, 63/63; main.js dc44016c… styles.css 9d88edb6… identical to 3480231 build. Land-ready comment posted. No CHANGELOG entry (test-only, not user-facing).

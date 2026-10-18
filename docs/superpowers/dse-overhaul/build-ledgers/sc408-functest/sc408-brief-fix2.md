# SC-408 fix round F2 — apply Scott's rulings before landing

## 0. Context loading

1. Re-read `sc408-brief-common.md` and the ledger `decisions.md`. The section "Scott's rulings"
   now holds his 2026-10-18 rulings verbatim. They are your scope. The B5/B6 entry under the
   owner rulings is struck through and superseded.
2. Your own F1 report `sc408-fix1-report.md`, and R2's verdict `sc408-r2-review.md` (land-ready).
3. Worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `1a33560`. Superproject worktree
   `/home/scott/code/steelCompendium/worktrees/sc408-functest`, skill commit `6e1427b`, plus an
   UNCOMMITTED submodule pointer change. Leave the pointer alone. `git -C … fetch origin`; if
   `origin/develop` moved off `be4f002`, rebase and report it.
4. Workers never call the tracker.

## 1. Task

Scott's rulings (verbatim, ledger):
> 2. yes, make it required to land future changes
> 5. I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands
> 6. I like your recommendation

(5) is B5 → ticket **SC-432**. The recommendation he agreed to: "disable Spend Recovery for
creatures. For heroes with no pool to spend from, keep it as a plain 'heal one Recovery's worth'
shortcut, relabelled so it does not claim to spend anything", plus his confirmation dialog for the
no-pool hero.
(6) is B6 → ticket **SC-433**. The recommendation: "make the temp field a direct edit, like the
Stamina field. Keep 'keep the higher' only for gaining temp from an effect."

**No product fix in this round.** Both stay open tickets. Only tests and docs change.

1. **B5 / SC-432 markers.** Every test titled "[current behaviour — ruling pending SC-408]"
   that touches Spend Recovery, in e2e and jest:
   - **Creature cases** become known-bug markers asserting the ruled behaviour: Spend Recovery is
     disabled for a creature. Use `knownBug('SC-432', …)` in e2e and `test.failing` in jest, with
     "[known bug SC-432]" in the title.
   - **No-pool hero cases**: the relabel text and the dialog are not designed yet, so do not
     guess a DOM. Keep the plain pin of today's behaviour. Retitle its suffix to
     "[current behaviour — SC-432 will relabel + confirm]" so the fixer knows to rewrite it.
2. **B6 / SC-433 markers.** Every pin of the temp take-higher behaviour becomes a known-bug
   marker asserting the ruled behaviour: at temp 5, minus gives 4 and Apply writes
   `temp_stamina: 4`; a typed lower temp is applied as typed. Use e2e `knownBug('SC-433', …)` and
   jest `test.failing` with "[known bug SC-433]". This includes the pre-existing SEM test "the
   minus button cannot walk temp below the session-start value". Converting it means editing an
   existing test file, which is allowed here.
3. **Coverage gate.** L-2's gate fails a pair driven only by known-bug tests. If a conversion
   leaves a pair with no plain driver (e.g. `sedit.temp.dec x click`), add or keep a plain
   scenario that drives it through behaviour that works today. For temp minus, that is walking
   back a pending in-session increase. A full run must end with coverage Y/Y.
4. **Ruling (2): e2e is required to land every DSE change.**
   - dse-verify skill (superproject worktree, `.claude/skills/dse-verify/SKILL.md`): today it says
     e2e is "Mandatory for any change to their `src/` interactive code". Make it mandatory for
     landing ANY draw-steel-elements change. Cite "Scott, SC-408, 2026-10-18: 'make it required
     to land future changes'". Update its e2e expected numbers to your final counts.
   - `.claude/orchestrate/PROJECT.md` §4 (superproject worktree): the battery list "(tsc, lint,
     jest, shots, freeze check, parity last, optional obsidian-shots)" gains the lifecycle and
     e2e steps in their dse-verify order.
   - DSE `AGENTS.md` (the `npm run e2e` bullet) and `e2e/README.md`: say it is a required gate
     before landing.
   - Commit the two superproject files together in the superproject worktree. Never commit the
     pointer.

Commit after every coherent step. No push. No Claude/AI attribution in commit messages.

**Out of scope:** any `src/` change. The tracker. Rollout surfaces. CI (SC-434).

## 2. Gates (dse-verify order; absolute paths; devbox from the workspace shape)

1. `npm run tsc` clean · 2. `npm run lint` clean ·
3. `rm -f main.js styles.css` then `npx jest`. Expected: **4666 passed / 1 skipped / 224 of 225
   suites**, ± any tests you add. Converted `test.failing` tests still count as passed. 0 failures.
4. `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle` → 25/25.
5. `npm run e2e` → 0 failed, coverage Y/Y. The known-bug count goes up from 8 by your new
   SC-432/SC-433 markers. Then **5 back-to-back full runs at `--shards=4`, 0 failures.**
6. `npm run shots` → 568, 0 FAIL. 7. Freeze:
   `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/visual-harness/shots`
   → 274/274. 8. `npm run parity` LAST → 0 / 0 / 24.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-fix2-report.md`, opening
with a ≤10-line executive summary: verdict, final DSE sha + superproject commit sha, every gate
number, and the e2e / known-bug / coverage counts. Then a table with one row per converted or
retitled test (old title → new title → file:line), the plain driver you added if any, and the doc
edits. End with `Drive-by fixes:` and `Follow-ups:`.

Return contract: your final text goes to the ticket-owner, not a human. Give raw facts, shas,
numbers, and the absolute path of every artifact. If the report write is blocked, return it
inline. Redirect long output to files. Run gates in the foreground; never background a job and
wait for a notification. Never key a wait on a scratch filename. You cannot message me; if you
need input, end with `STATUS: NEEDS_CONTEXT`.

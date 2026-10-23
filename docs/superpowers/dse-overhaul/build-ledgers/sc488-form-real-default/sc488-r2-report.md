# SC-488 r2 report (implementer A)

## Executive summary
- STATUS: NEEDS_CONTEXT. Everything folded and rebased; one gate (shots) exits 1 for an ENVIRONMENT reason unrelated to this branch (below).
- Plugin tip `e9996f4` on base `d152ea4` (SC-477). Superproject tip `3f55abe` on origin/main `00e2f37`. No rebase conflicts (plugin: 4 commits, superproject: 2). Submodule pointer not bumped, nothing pushed.
- Folded: LOW-1 (red test `2e80077`, then fix `e9996f4`), LOW-2 (CHANGELOG sentence dropped, `3f55abe`), INFO-1 (stale SC-483 wording reworded in `e9996f4`, comments/titles only).
- Gates on `e9996f4`: tsc clean, lint clean, jest 5784 passed / 1 skipped / 238 of 239 (5769 + 14 + 1), lifecycle 32/32, e2e 104/104 ok 0 failed 0 known-bug 69/69 pairs, freeze OK 280/280, parity 0 GAP / 0 undeclared / 24 declared.
- shots: all 592 PNGs written, but `npm run shots` exits 1 with `HOST COPY DRIFTED`: the machine now has Obsidian 1.15.0 (`/home/scott/.config/obsidian/obsidian-1.15.0.asar`, installed 2026-10-22 18:09; earlier shots runs today passed with 1.14.4), and `visual-harness/shoot.mjs` host-rule copy (pinned 1.14.0) differs in 3 rules (#3 `@media(hover:hover){button:hover}`, #5 `button[disabled],button[aria-disabled=true],button[disabled=true]`, #6 `@media(forced-colors:active){button}` - spacing/quoting only in the copy). The check aborts the run before the button host-leak, modal host-leak, ALLOWLISTED and both text-scale lines, so those could not be confirmed on this tip. Printed before the abort: pressed toggle parity OK (96), pipette selected look OK, chrome host-leak OK. I did not touch `shoot.mjs` (out of scope; message says re-extract from the 1.15.0 asar and bump PINNED_OBSIDIAN). Needs an owner ruling: fix the copy in a separate ticket, or pin the gate to 1.14.4.

## Commits
Plugin (draw-steel-elements, branch sc488-form-real-default, base d152ea4):
- `eb49e42` test(SC-488): red tests for the block edit form's Default option on optional selects (RED, r1)
- `ac1f6f2` fix(SC-488): block edit form shows the value an absent select will actually use (r1)
- `2e80077` test(SC-488): red test, a declared select key keeps its source position after Default and back (RED, LOW-1; 1 failed / 40 passed at that commit)
- `e9996f4` fix(SC-488): a declared select key keeps its source position after Default and back (LOW-1); reword stale SC-483 test wording (INFO-1)
Superproject (base 00e2f37):
- `aba1189` docs(changelog): SC-488 block edit form dropdowns show the value the block really uses
- `3f55abe` docs(changelog): SC-488 drop the unreachable empty-line sentence (LOW-2)

## What the folds changed
- LOW-1, `src/authoring/FormModal.ts`: new `sourceKeyOrder` (keys of the source body, prefs popped, set at open) and `setKeyInSourceOrder(key, value)`, used by the optional select's onChange for a non-Default pick. A key that is absent from `working` is inserted after every present key that preceded it in the source and before every key that followed it; a key unknown to the source goes last. Serializers untouched. New test: source `style: chips\nskills:\n  - climb` -> Default -> chips saves as `style: chips\nskills:\n  - climb` (SC-488 describe now has 15 tests).
- LOW-2: CHANGELOG sentence "A dropdown line left empty (`style:`) counts as left out." removed; D5 code kept.
- INFO-1, `test/dom/authoring/formModal.test.ts`: reworded the comment at the "Minor" test (:150), the title "the prefs: map still leads the body when the untouched select is left out", the title + comment of "a REQUIRED untouched absent select is seeded, so validation and the live preview see its value". No assertion changes.

## Gate table (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-impl-a-x7k3qz/)
| Gate | Result | Log |
|---|---|---|
| tsc (incl -p e2e) | clean, rc 0 | tsc.log |
| lint (incl e2e) | clean, rc 0 | lint.log |
| jest | 5784 passed, 1 skipped, 238 passed + 1 skipped of 239 suites | jest.log |
| lifecycle (9311) | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed` | life.log |
| e2e | `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` | e2e.log |
| shots | rc 1: 592 PNGs written, then HOST COPY DRIFTED abort (Obsidian 1.15.0 vs pinned 1.14.0 copy) | shots.log |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical ...)` | freeze.log |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | parity.log |
Superseded runs (older bases c0e761b / e8f6a14): `old-r1final/`, `old-r2c0e/`, `old-r2e8f/` in the same folder. On the e8f6a14-based tip the shots run still passed (rc 0, 592) - the 1.15.0 asar was installed after it.

## Drive-by fixes:
- None beyond INFO-1 (ruled).

## Follow-ups:
- `visual-harness/shoot.mjs` host-rule copy needs re-extraction for Obsidian 1.15.0 (and PINNED_OBSIDIAN bump); separate ticket, blocks `npm run shots` on this machine regardless of branch.

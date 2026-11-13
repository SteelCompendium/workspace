# SC-613 r3 implementer report (test-only fix round)

**Executive summary**
- Verdict: DONE. LOW-1, LOW-2 and INFO-2 folded; `src/` and CSS untouched (`git diff 8978b6f0..HEAD --stat` lists only the two test files).
- Plugin head `9b94baf2` (on `8978b6f0`): `eb698951` jest (popout test + afterEach closes windows), `9b94baf2` e2e COND-N15. Superproject unchanged at `e534de69`, no pointer bump.
- Gates: tsc (incl. e2e) + lint clean · jest 11854 passed / 1 skipped WITH the shots cache present (`visual-harness/dist/obsidian-app.css` exists from r1's shots run) = 11853 / 2 fresh, i.e. r1's 11852 + 1 new test · e2e `338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (+1: COND-N15).
- Lifecycle, shots, freeze, parity carry from r1 (no src / CSS change).
- Mutants: M10 (`keyDoc = document`) fails the new popout jest test (1 failed, 367 passed); M3 (top-most check removed) fails the new e2e COND-N15 AND now fails exactly 1 jest test (the stacked-modal one; was 8 before the afterEach fix). Source restored, tree clean.
- LOW-2's afterEach changed no existing test's outcome: the matrix file is 461 passed with it.

## Changes
- `test/dom/views/conditions-modal-matrix.test.ts` (+41): `open()` records each window in `opened`; file-level `afterEach` closes them (`close()` is idempotent in DseModal, so a test that closed its own window is not closed twice) before emptying the body. New test "a popout window ...": a jsdom iframe stands in for the popout, `document.body.appendChild` is spied so the `.modal-container` lands in the iframe body (pattern of `compendiumSearchHoverPreview.test.ts:221-241`); the iframe's HTMLElement prototype gets the same element helpers the jest setup installs on the main window (Obsidian does this for every window; without them `onOpen` throws `listEl.empty is not a function`). Asserts: `container.ownerDocument` is the iframe doc; a body key of the main document does nothing (not preventDefault-ed); a body key of the iframe doc opens the search with that letter and is swallowed; after `close()` neither document routes (`typeToSearch` spy not called).
- `e2e/specs/conditions-modal/cond-integrity.e2e.ts` (+21): COND-N15, promoted from reviewer probe P03. Command palette opened over the Conditions window via `app.commands.executeCommandById('command-palette:open')`, wait for 2 `.modal-container`, let go of the palette input's focus (script blur, as P03), real `d`: no `cond.input` in the Conditions window, no write; Escape closes just the palette (window stays); real title click, real `daz`: input focused and value exactly `daz`. No new control, no manifest pair (176/176 unchanged). No bracketed ticket id in any title.

## Mutants (logs `sc613-r3-mutant-*.log`)
| Mutant | jest (matrix file, 368 tests) | e2e (N12-N15) |
|---|---|---|
| M10 listener on global `document` | 1 failed: the new popout test | 4/4 ok (e2e has no popout) |
| M3 top-most check removed (`void modals;`) | 1 failed: "a modal stacked above this one keeps its keys..." | COND-N15 FAIL (`cond.input` existing) |

## Drive-by fixes
None.

## Follow-ups
None new.

## Artifacts
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/sc613-r3-implementer-report.md`
- Logs (same dir): `sc613-r3-gate-tsc-lint.log`, `sc613-r3-gate-jest.log`, `sc613-r3-gate-e2e.log`, `sc613-r3-mutant-M10-global-document-{jest,e2e}.log`, `sc613-r3-mutant-M3-no-topmost-{jest,e2e}.log`

# SC-455 fix round 1 report

**Executive summary**
- STATUS DONE. dse head `b6b08f3` on `origin/develop` = `7817133` (SC-360). Fix-round commits: `505b76b` (tests, red first), `018265e` (src), `b6b08f3` (e2e). Rebased branch commits: `a885d8b f9f7eb1 f8709a1 9b2f467 b8076f3 e404566`. Superproject (worktree) commit `5cbae52` = CHANGELOG.md only; pointer not committed. Nothing pushed, no tag.
- Rebase: ONE conflict, `src/framework/sidebar/anchor.ts` (our `FENCE_LINE` removal vs SC-360's `LEADING_LETTERS`): kept the removal and SC-360's `LEADING_LETTERS`, `generateAnchorId`, `SCALAR_TOKEN` readers. `registration.ts` auto-merged into `bindBlockToSidebar`; tsc clean. Every SC-360 reader (`readAnchor`, `findAnchoredBlock`, `findFenceByBody`, `findGeneratedBlock`, `ensureAnchor`) runs on the prefix-free body `iterateFences`/`blockBodyLines` yields, so the prefix handling is the only fence locator.
- Dispositions: HIGH-1 FIXED (`addBlockPrefix` is now the inverse of `stripBlockPrefix`); LOW-1 FIXED; LOW-2 FIXED; LOW-3 FIXED; INFO-1 FIXED; follow-up 6 FIXED; workspace CHANGELOG bullet DONE; dse docs/CHANGELOG claims now accurate ("space after `>` optional" is true).
- Gates (after rebase + fixes): tsc + lint clean · jest **5242 passed / 1 skipped / 230 of 231** · lifecycle **27/27** · e2e `OBSIDIAN-E2E done: 80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs` · shots 572, 0 FAIL, `pressed toggle parity OK (96 comparisons …)` · freeze `276/276` · parity 0 / 0 / 24 declared.
- FAIL on previous src (committed src of e4f60eb = e404566, new tests on it): 42 tests fail (31 blockPrefix round-trip rows, 2 notice-text, 6 reading-host, 2 sidebar-host, 1 FormModal). LOW-3 is a stronger e2e assertion with no src change, so it passes on the old src by construction.

## HIGH-1: the write step did not invert the read step
`blockPrefix.addBlockPrefix`: when the prefix does not end in a space (`>`, `>>`, `> >`) and the text starts with a space or tab, the marker's own space is now written (`prefix + ' ' + text`), so `stripBlockPrefix(addBlockPrefix(p, t), p) === t` for every prefix and text. Tests: `blockPrefix.test.ts` property `test.each` over prefixes `['> ', '>', '> > ', '>>', '> >', ' > ', '>   ', '']` x 9 texts (leading-space lines, tab, blank, quoted text, one space) x trimBlank true/false (144 rows; the 31 that fail on the old src are exactly the no-space-prefix + leading-space rows); a `replaceFenceBlock` test (nested YAML under `>` written twice is byte-identical); host-level two-writes tests for `>`, `>>`, `> >` (an unedited raw-mode-form-style save leaves the note byte-identical, then two edits land, no Notice); sidebar self-echo with `>` + nested YAML (own write not an external change, note byte-identical, second write lands). Note: the fixtures I first wrote used `> - name` for a mounted ` - name`; that reads back as `- name` (the marker eats the space) — the correct on-disk spelling is `>  - name`, which is what the new tests use.

## LOW-1: never guess a twin
Removed `knownLineStart ??= 0`; `hasDurableIdentity` no longer needs a known line. `locateByBody` takes `nearLine: number | null`; with no known position and 2+ equal bodies it returns `'ambiguous'`, which `resolveWriteTarget` turns into `'abort'` (the unsavable Notice). A unique body still writes. Tests (reading-host LP describe): two identical blocks, widget not attached, LOWER writes -> the upper twin is never touched (here: refused + Notice); one block not attached -> lands, no Notice.

## LOW-2 / INFO-1 / follow-up 6: Notices
- `BlockHost.lastWriteReported?: boolean` (optional, documented): true when the last failed `replaceSource` already showed a Notice. Implemented by ReadingModeBlockHost and SidebarBlockHost (reset each call, true after `dropped`/`unplaceable`/lost/missing-file). `FormModal.save()` shows its "couldn't save" Notice only when the host did NOT report. Tests: formModal (host reported -> no second Notice, modal stays open; the existing no-report test still sees its one Notice), reading-host and sidebar-host `lastWriteReported` tests.
- Wording: `unsavableWriteMessage(note, listShape = false)`; the "(blocks inside lists can't be edited yet)" hint only when the section window has a list-item line or a fence indented 2+ spaces (`looksLikeList`). A callout fence that never closes, an unreadable section, a 1-space-indented fence: generic text. `notifyUnsavableWrite(path, name, listShape = false, now)` (arg order changed; tests updated).
- Missing TFile in `ReadingModeBlockHost.replaceSource` now calls `notifyUnsavableWrite` (generic text, note name from the path) and sets `lastWriteReported`; test "a missing TFile shows the unsavable Notice".

## LOW-3
`e2e/specs/callout/callout-writes.e2e.ts` N01/N02 assert the exact message text for the note and that the set of `Draw Steel Elements:` Notices equals exactly `[that text]` after write-idle. Ran green (`logs-fix1/r1-e2e-callout.log`, 9/9).

## Workspace CHANGELOG
Worktree superproject `/home/scott/code/steelCompendium/worktrees/sc455-callout-write/CHANGELOG.md`, under `## Unreleased`: "- Fixed: Draw Steel blocks inside a callout or quote now save their changes (Reading view, Live Preview callouts, and the sidebar); a block that can't be saved (one inside a list item) now says so with a notice instead of failing silently. (SC-455)". Committed alone as `5cbae52`.

## Gate numbers and logs (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/logs-fix1/`)
`gate-tsc.log`, `gate-lint.log` (rc 0) · `gate-jest.log` (Tests: 1 skipped, 5242 passed; Suites 230 of 231; base 5013 + 229 new/changed) · `gate-lifecycle.log` (27/27) · `gate-e2e.log` (80/85) · `gate-shots.log` (572, 0 FAIL, pressed-toggle line) · `gate-freeze.log` (276/276) · `gate-parity.log` (0/0/24). FAIL-on-previous-src: `r1-onprev.json` / `r1-onprev.log` (vs passing `r1-new.json`).

## Drive-by fixes:
None.

## Follow-ups:
None new. (SC-461/462/463/464 stay out of scope; `blockKey` dropped as ruled.) Note for the owner: the test commit `505b76b` message ends "(SC-455 fix round 1)" rather than "(SC-455)".

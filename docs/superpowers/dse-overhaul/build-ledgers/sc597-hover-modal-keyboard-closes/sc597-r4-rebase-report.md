# SC-597 r4: rebase onto 79da77f8, r3 fold-ins, full battery (I1 resumed)

## Executive summary
- STATUS DONE. dse `origin/develop` = `79da77f8` (did not move further). dse branch rebased: old head `ca31aa14` (on `4f0c87f2`), new head `e5b6f9f2`.
- `git range-diff 4f0c87f2..ca31aa14 79da77f8..ea23de7e`: all 4 commits `=` (`sc597-r4-range-diff.log`). New commit on top: `e5b6f9f2` (INFO-6, managedModal.ts comment only).
- Superproject: `origin/main` had moved to `02426934`; branch rebased onto it (CHANGELOG only, no conflict), head `f205df8a` (`826dee1d` CHANGELOG bullet + `f205df8a` LOW-1). dse pointer not bumped (unstaged ` M draw-steel-elements`).
- tsc (incl. `-p e2e`) rc 0; lint rc 0; jest **7283 passed / 2 skipped / 262 of 263 suites**.
- lifecycle **56/56** = 21 + 16 + 9 + 4 + 6; wall 184 / 327 / 417 / 301 / 347 s (loadavg 1-9); G-S56 last in part 4; part 5 G-S87 ok.
- e2e `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (125 s).
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` on the fixed build and on a clean `79da77f8` archive build: equal, so shots/freeze/parity carry.
- Proposal rewritten (LOW-2, six edits, CURRENT draft on `79da77f8`).

## Work
1. Rebase: conflict-free. Commits now `a92f4d5b` fix, `5897773f` Escape test, `3c194532` G-S87, `ea23de7e` tsc cast, `e5b6f9f2` comment.
2. INFO-6: `src/framework/kit/managedModal.ts` comment at ~209 now reads "A modal opened outside a click (a delayed open, such as the block edit form after a pending write) arms them at once ... (Enter / Space on the stamina bar and on a montage cell are not such opens: they click the opener, SC-597, so they take the branch above.)". Verified the diff has no non-comment lines. The mutants of r2 are not affected (code unchanged).
3. LOW-1: CHANGELOG now says "On a Montage cell, Ctrl, Cmd or Alt with Enter no longer opens the window, as on the Stamina bar."
4. LOW-2: `sc597-dse-verify-proposal.md`: edit 1 (footgun 7, "the modal's scope is above the popover's 20 ms after the key, and Escape then closes only the modal"), edit 2 (footgun 11), edit 3 (56 / part 5), edit 4 (SKILL.md ~393 stale SC-597 item), edit 5 (jest bullet: SC-597 22 tests), edit 6 (CURRENT draft on `79da77f8`; demote the SC-592 block, which is the one CURRENT in the main checkout's SKILL.md at `02426934`).
5. Battery above, run on dse `e5b6f9f2`. G-S87 red-on-base is unchanged from r2 (`sc597-r2-red-on-base-G-S87.log`, 94133a5a bundle; plugin source identical).

Drive-by fixes: none.

Follow-ups: none.

## Evidence (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/`)
- `sc597-r4-range-diff.log`, `sc597-r4-gate-tsc.log`, `sc597-r4-gate-lint.log`, `sc597-r4-gate-jest.log`, `sc597-r4-gate-e2e.log`, `sc597-r4-gate-lifecycle-part1.log` ... `part5.log`, `sc597-r4-gate-styles-sha.log`
- `sc597-dse-verify-proposal.md`, this report.

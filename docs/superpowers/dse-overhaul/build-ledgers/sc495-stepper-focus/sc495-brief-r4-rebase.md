# SC-495 r4 — rebase round (implementer)

Context: same worktree, branch and footguns as `sc495-brief-r1-impl.md` §6 (all still apply; new private scratch subfolder `sc495-r4-impl-<suffix>/`). Ledger `decisions.md` is truth. Never call the tracker. No code changes in this round beyond conflict resolution.

Start state: dse HEAD `c909c54` on `9f08f06`; superproject `4cd1e12` on origin/main `3c7f392`.

1. dse: `git -C /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus/draw-steel-elements fetch origin`, then rebase onto origin/develop. Expected origin/develop = `66f474b` (SC-489 landed: `src/authoring/FormModal.ts` + tests — disjoint from our files, so zero conflicts expected). If it is newer, rebase onto it and report the sha. Run `npm ci` if `package.json` changed.
2. Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc495-stepper-focus fetch origin`, rebase our CHANGELOG commits onto origin/main (CHANGELOG conflict: keep both bullets, ours first). Leave the dse pointer bump unstaged.
3. Report EVERY conflict and how you resolved it (file, hunk). A hand-resolved conflict in `src/` or `test/` must be called out explicitly.
4. Full battery on the final head (dse-verify skill). Expected on 66f474b + ours: tsc/lint clean; jest **5872** passed / 1 skipped / 241 of 242 (5859 baseline + our 13; compare after a shots run; a one-off load timeout in the unrelated SC-485 `initiative-default-keys.test.ts` is known — re-run that file alone and the full suite once before calling it red); lifecycle **34/34**; e2e **114/114 ok, 0 failed, 0 known-bug, coverage 79/79**; shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.
5. Before returning: both heads fast-forward from their origins (`git -C … merge-base --is-ancestor origin/develop HEAD` etc.), dse tree clean, no live processes of yours (`pgrep -af "worktrees/sc495-stepper-focus/"`).

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc495-stepper-focus/sc495-r4-rebase-report.md` opening with a ≤10-line executive summary. Return raw facts: STATUS, dse head + base, superproject head + base, conflicts, each gate's numbers, absolute artifact paths. You cannot SendMessage me; NEEDS_CONTEXT if blocked; any stray message starts `SC-495:`.
